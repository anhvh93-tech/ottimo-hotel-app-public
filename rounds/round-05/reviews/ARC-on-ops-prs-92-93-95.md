# ARC review 3 PR của OPS cho v1.0.5 – #92, #93, #95

- Người review: ARC | Round 5 (bảo trì v1.0.5) – Bước: **Review** | Ngày 06/11/2026
- Phạm vi:
  - #92 `r5-ops-caddy` @ `f8c819c0` (V5-67);
  - #93 `r5-ops` @ `b1354a4f` (V5-73, V5-62, V5-65 phần mã, V5-63, thẻ SEC ARC-07, ARC-08, test infra mới, `ci.yml`);
  - #95 `r5-ops-runbooks` @ `fd11c4a2` (V5-70 runbook v1.0.5 r0 có cửa sổ W0–W7, P2b, M4d; V5-64 `product/docs/runbook-vps-moi.md`).
- Đọc bằng `gh pr view/diff/checks` và `git show origin/<nhánh>:<tệp>`. Không checkout nhánh, không SSH, không chạm staging/production, không approve hay comment trên GitHub. Không đụng nhánh `r5-contract-0313`.
- Đối chiếu:
  - hợp đồng 0.3.13 (`origin/r5-contract-0313`, PR #94): 1.8, 1.14, 1.15, mục 2, mục 7, G7;
  - `rounds/round-05/reviews/SEC-on-contract-0.3.13.md`: ARC-07, ARC-08, ARC-09 và phản hồi OPS;
  - `rounds/round-05/plan.md`: V5-62, V5-63, V5-64, V5-65, V5-67, V5-70, V5-73;
  - `rounds/round-05/outputs/OPS/report.md`.
- ARC chạy lại trên bản `git archive` của từng nhánh:

| Test | Kết quả |
|---|---|
| `infra/ci/check-caddy-landing.sh` (#92, image Caddy ghim, cùng digest với `Dockerfile.landing`) | **Đạt.** 9 ca Authorization (3 route × production Basic/Bearer + staging đúng mật khẩu) và 6 ca 401 có `X-Robots-Tag` |
| `server/test/backup-schedule.test.sh` (#93, ubuntu:24.04) | **16/16.** Ca 1c (`systemd-analyze`) không có trong container, CI chạy |
| `server/test/ops-check-journal.test.sh` (#93, ubuntu:24.04) | **30/30** |
| `server/test/postgres-log-terse.test.sh` (#93, postgres:17-alpine local) | **7/7.** Lượt đối chứng lộ email và "Failing row", đúng như dự kiến |
| `ci/test-ops-check.sh`, `ops-check-price.test.sh`, shellcheck | Không chạy lại. CI job `infra scripts` xanh ở `b1354a4f` |
| CI #92 | Xanh đủ, kể cả `docker images build · E2E smoke` |
| CI #93 @ `b1354a4f`, #95 @ `fd11c4a2` | **Xanh đủ.** `docker images build · E2E smoke` còn chạy lúc viết, xanh ngay sau đó (#93 15 phút 53 giây, #95 13 phút 29 giây) |
| Gộp thử trong bộ nhớ (`git merge-tree`): `main` → #92 → #93 → #95 → #94 | Không xung đột chữ |

## 0. Kết luận

| PR | Kết luận | Điều kiện |
|---|---|---|
| #92 | **DUYỆT** | – |
| #93 | **DUYỆT CÓ ĐIỀU KIỆN** | E2E xanh trên đầu nhánh: **đã đạt** (`b1354a4f`). Còn: SEC đọc lại ARC-07, ARC-08 như PR ghi. Thẻ 06 (Minor, chữ) sửa trước khi gộp nếu tiện, không chặn; nếu sửa thì CI phải xanh lại |
| #95 | **DUYỆT CÓ ĐIỀU KIỆN** | Sửa 3 thẻ Major 01, 02, 03 **trước khi gộp**, vì runbook này là mẫu cho các bản sau. ARC chỉ đọc lại phần sửa, không review lại cả tệp. Minor 04, 05, 07 sửa trước cửa sổ bảo trì |

- Blocker 0, Major 3 (cả 3 ở #95), Minor 5 (4 cho OPS, 1 cho BE), Suggestion 2.
- ARC **duyệt** các điểm OPS xin ở #93:
  - lượt sao lưu hai: production 15:00, staging 15:30;
  - bộ Chủ nhật giữ dưới 33 ngày, tính theo giây;
  - ngưỡng `ops-check backup` 14 giờ;
  - `50-ottimo.conf`: `SystemMaxUse=4G` là số đầu, `ForwardToSyslog=no`, `RateLimitBurst=20000`/30 s;
  - Postgres `log_error_verbosity=terse`;
  - không đổi `daemon.json` trên VPS đang chạy.
- Test `reservation-list` đỏ một lần là **chập chờn thật**, do dữ liệu test. #93 không gây ra (mục 1.4, thẻ FB-R5-ARC-BE-01).

## 1. Trả lời theo trọng tâm ORC giao

### 1.1 Đổi log driver sang journald

**`max-size`/`max-file`: đã xử lý, có test giữ.**
- Compose `x-hardening.logging` và edge: `driver: journald`, `options: { tag: '{{.Name}}' }`, không còn `max-size`/`max-file`.
- `daemon.json` trong bootstrap: `"log-driver": "journald"`, `"log-opts": { "tag": … }`.
- Test 18, 19, 21 của `ops-check-journal.test.sh` đỏ nếu hai tùy chọn quay lại.
- VPS đang chạy vẫn giữ `daemon.json` cũ (`local` + `max-size`). Không sao: dockerd chỉ ghép `log-opts` mặc định vào container **cùng driver** với mặc định. Container ghi rõ `journald` không bị ghép `max-size`, nên vẫn khởi động.
- Runbook W6 không đổi `daemon.json`. Lần chạy `bootstrap-vps.sh` sau mới đổi, và `live-restore: true` giữ container chạy khi `systemctl restart docker`.
- Rủi ro ARC nêu ở hợp đồng mục 7 coi như đã đóng.

**Thứ tự staging → production → edge: đúng.**
- W6 bước 1–3 làm một lần cho cả máy: drop-in, khởi động lại journald, unit ops-check.
- Rồi bước 4 staging, kiểm "Đúng là", bước 4 production, cuối cùng bước 5 edge.
- Drop-in journald là cấu hình chung của máy nên không diễn tập riêng trên staging được. Chấp nhận:
  - systemd 255 giữ luồng log qua lần khởi động lại journald (fdstore);
  - container ghi journald gửi vào socket datagram do systemd giữ.

**Desk gián đoạn: có, ở W6 bước 4. Mục 0 runbook đang ghi sai** (thẻ 01).
- Bước 4 dựng lại postgres, api, worker, web, caddy, vì cấu hình đổi (`logging`, và `command` của postgres).
- ARC ước 20–60 giây: Postgres dừng và khởi động, chờ healthcheck, rồi api khởi động. W6 ghi "vài giây đến khoảng 30 giây". Mục 0 lại ghi "Desk không gián đoạn ở W0–W7".
- Bước 5 (edge): mọi site mất 1–2 giây.

**Hai điểm nhỏ, chấp nhận:**
- Landing sang journald từ W2 (dựng lại bằng compose mới), trước khi drop-in được cài ở W6. Vài phút log landing nằm trong journal theo cấu hình mặc định của Ubuntu. Log Caddy đã che query và header.
- `ForwardToSyslog=no` làm `/var/log/syslog` và `/var/log/auth.log` ngừng ghi. ARC grep repo: không script, runbook hay tài liệu nào đọc hai tệp này. Chỉ cần ghi vào README (thẻ 06).

### 1.2 Timer sao lưu
- **Đúng một timer mỗi môi trường:**
  - production `ottimo-backup@ottimo-prod.timer` (tệp `ottimo-backup@.timer`): 03:00 + 15:00;
  - staging `ottimo-backup.timer`: 03:30 + 15:30;
  - cả hai có `Persistent=true` và `RandomizedDelaySec=5min`. Test 1, 1b, 1d, 1e giữ các điều này.
- **Giờ không trùng giữa hai stack:**
  - production bắt đầu 03:00–03:05, staging 03:30–03:35. DB 7,4 MB dump trong vài giây;
  - trùng chỉ xảy ra khi máy tắt qua cả 15:00 lẫn 15:30 rồi bật lại: cả hai timer bù lượt cùng lúc. Đó là hai DB khác nhau, `flock` tính theo stack. Chấp nhận.
- **Cài sau 15:00 thì chạy ngay:** ổn.
  - Lý do: systemd so dấu lần chạy cuối (03:0x hôm nay) với lịch mới, thấy lượt 15:00 đã qua nên chạy bù;
  - lượt bù chỉ thêm một bộ sao lưu. `flock` chặn trùng với P3;
  - điều còn thiếu: phải chờ `OK:` **trước W6 bước 4**, không chỉ trước P3/P5, vì khởi động lại Postgres làm hỏng `pg_dump` đang chạy (thẻ 01);
  - khung giờ runbook đề xuất (09:00–12:00, 13:00–14:30) tránh được ca này.
- **Giữ 33 ngày:** duyệt.
  - Tệp chỉ bị xóa ở lượt sau. Lỡ hai lượt liền thì tối đa 33 ngày + 36 giờ = 34,5 ngày < 35 (T18). Mô phỏng 45 ngày ra 34 d 0 h;
  - lỡ lượt thứ ba thì `ops-check backup` đã FAIL từ 14 giờ trước;
  - bản trên Mac cắt ở 35 ngày.
- **Ngưỡng 14 giờ:** 12 giờ + 2 giờ dư, đủ cho lệch ngẫu nhiên 5 phút và thời gian dump.
- **15:00 cho production:** duyệt. Chia đều 12/12, tránh 14:00 nhận phòng và khung phát hành quen quanh 14:00. Job ngày của worker chạy 03:00–06:05.

### 1.3 `ops-check`: mã thoát, FAIL/WARN, báo nhầm

**Mã thoát và WARN: đúng ARC-07.**
- Mã thoát: 0 khi mọi mục `ok` hoặc `WARN`; 1 khi có FAIL; 2 khi tên mục lạ.
- `WARN`:
  - không đổi mã thoát, heartbeat vẫn ping thành công;
  - webhook gửi một lần khi đổi trạng thái, không nhắc 6 giờ;
  - `WARN` → `ok` gửi tin hồi phục một lần.

**Các mục mới:**
- `journal`:
  - FAIL khi có container không ghi journald, không đọc được journal, bản ghi cũ nhất > 91 ngày, quyền thư mục sai, hoặc nhóm `adm`/`systemd-journal`/`docker` có người ngoài danh sách;
  - WARN khi journal xoay sớm, thiếu `journald_since`, hoặc có dòng `Suppressed`;
  - với `MaxFileSec=1day`, bản ghi cũ nhất không quá 91 ngày, nên "FAIL từ 92 ngày" đúng;
  - đọc journal bằng `--system` và `head -n 1`, nhanh cả khi journal 4 GB.
- `pricegap` tĩnh:
  - mọi cột khớp lược đồ thật (migration 0004, 0055: `is_sellable`, `active_from`, `active_to`, `public_room_type`, `room_list_price.effective_from`, `property.timezone`);
  - ORC đã chạy truy vấn trên production ngày 06/11, ra 0;
  - lỗi truy vấn và câu trả lời lạ là FAIL riêng, không bao giờ đọc thành 0.
- `sshkeys`:
  - bỏ chuỗi trong ngoặc kép trước khi so, nên chữ `restrict` nằm trong lệnh không lọt;
  - đọc cả `authorized_keys2`, xử lý được CRLF;
  - chỉ in số dòng.

**Báo nhầm trên VPS hiện tại:**

| Mục | Báo nhầm? | Ghi chú |
|---|---|---|
| `sshkeys` | Không, nếu W0 làm trước P2b (runbook làm vậy). Gói cũ không có mục này | – |
| `backup` 14 giờ | Không, nếu cửa sổ bắt đầu trước khoảng 17:00, khi bản 03:0x còn dưới 14 giờ. Runbook đề xuất 09:00–14:30 | – |
| `journal` | **Có.** Từ P2b của mỗi stack tới W6 bước 3–4, mục này FAIL "journal unreadable" (unit chưa có nhóm) và "N container không ghi journald". Cửa sổ khoảng 40 phút, timer chạy 30 phút một lần, nên mỗi stack ít nhất một tin FAIL vào phòng Báo động, cộng ping `/fail` tới Healthchecks. Runbook 1.2 và mục 8 chỉ lường trước `sshkeys`, `backup` | Thẻ 02 |
| `journal`, phần nhóm | **Chưa biết.** Chưa ai đếm nhóm trên VPS hiện tại. `ottimo-admin` (uid 1000) có sẵn từ trước bootstrap (`v1-production.md` mục 5). Nhóm thừa một người là W7 FAIL, và runbook bảo dừng giữa cửa sổ | Thẻ 02 |
| `pricegap` tĩnh, staging | **Chưa biết.** Plan dòng 202 ghi staging chưa chạy. Dữ liệu thử có thể có căn thiếu giá | Thẻ 02 |
| K5 (runbook) | **Có.** K5 ghi "như v1.0.4", tức chạy `sudo -u ottimo ops-check.sh`, nên `journal` FAIL "unreadable" đúng thiết kế. Phải dùng lệnh `systemd-run` của W7 | Thẻ 02 |

### 1.4 Test `reservation-list` đỏ một lần
- **Kết luận:** chập chờn thật, do dữ liệu test. #93 không đụng mã api, nên không chặn #93.
- **Bằng chứng:**
  - lượt đỏ: run `42227153282` lượt 1, job "format · lint · audit · test · build";
  - ca `S4-44 + BR-012 (2)`: `search('401')` trả 2 id, thay vì đúng `[ha.id]`;
  - id thừa `01a1b11c-22d8-…` là UUIDv7, tạo 156 ms sau đơn của Hà (13:46:13.436 → 13:46:13.592). Đó là đơn của Bình, tạo ngay sau trong `beforeAll`.
- **Nguyên nhân:**
  - ô `q` của `listReservations` khớp cả `g.code ILIKE '%401%'` (`rack.service.ts` dòng 437);
  - fixture `seedGuestRow` sinh mã khách `KH-${randomBytes(3).toString('hex')}` (`test/helpers/reservations-fixture.ts` dòng 169);
  - "401" toàn là chữ số hex. Mã 6 ký tự hex chứa "401" với xác suất khoảng 0,1 % mỗi lượt (ARC mô phỏng 200.000 lần: 0,101 %);
  - các truy vấn khác của test ("pine", "amber", "pi") có chữ ngoài hex, nên không va.
- Cách sửa: thẻ FB-R5-ARC-BE-01.

### 1.5 Runbook: bước lùi của từng bước W

| Bước | Có cách lùi | Nhận xét |
|---|---|---|
| W0 | Có | Đúng. Chỉ lùi khi CI hoặc kéo sao lưu hỏng; báo SEC |
| W1 | Có | Đúng. Có cả câu về ngưỡng 14 giờ sau khi lùi |
| W2 | **Sai đích** | `deploy-landing.sh --rollback` lùi **image** landing. Nếu Caddyfile mới là nguyên nhân thì tag cũ vẫn gắn tệp mới, landing vẫn hỏng (thẻ 05) |
| W3 | Có | Caddyfile cũ, rồi W2 lại |
| W4 | **Thiếu** | Không có "Lùi W4", dù bản `env.before-v105.*` là bản sao duy nhất còn giữ (thẻ 05) |
| W5 | Có | `unmask` |
| W6 | Có | Thiếu một câu: sau khi lùi gói (Q2), lần `deploy.sh` hay `rollback.sh` kế tiếp dựng lại api/web/worker bằng compose cũ, tức về `local`. OR-04 mở lại mà không ai báo (thẻ 05) |
| W7 | Chỉ kiểm, không cần lùi | – |

### 1.6 Khớp thứ tự PR ở hợp đồng mục 2 (V5-73 trước V5-1A)
- **Lúc chạy: khớp.**
  - Gói có `pricegap` tĩnh vào máy ở P2b và chạy lần đầu ở W7, đều trước P5 (Release mang V5-1A);
  - vậy điều kiện "Kiểm tĩnh `pricegap` (V5-73) phải lên trước bản này" (1.8) đạt.
- **Lúc gộp:** PR-C1 (BE-C, V5-1A) chỉ gộp sau #93. Runbook P0 chưa ghi điều này (thẻ 07).

### 1.7 ARC-09: điều cần sửa ở hợp đồng (phiên ARC của PR #94 làm, ORC chuyển)
OPS đã xác nhận giờ từ repo. Ở đây chỉ ghi các chỗ cần sửa trong `rounds/round-05/outputs/ARC/contract-0.3.13.md`, nhánh `r5-contract-0313`:
1. Mục 0, dòng V5-62.
   - Đang ghi: "Giữ (a). **Đề xuất 15:30 thay 14:00** …".
   - Sửa: "Giữ (a). Lượt hai: production 15:00, staging 15:30, mỗi khoảng 12 giờ (plan V5-62, PR #93)".
2. 1.14, đoạn "ARC đề xuất đặt lượt thứ hai lúc 15:30, không phải 14:00". Viết lại:
   - production chạy `ottimo-backup@ottimo-prod.timer` (tệp `ottimo-backup@.timer`) lúc 03:00 + 15:00;
   - staging chạy `ottimo-backup.timer` lúc 03:30 + 15:30;
   - nếu chọn 14:00 thì khoảng lớn nhất của production là 13 giờ (14:00 → 03:00), không phải 13 giờ 30;
   - bỏ câu "Nếu PO giữ 14:00 thì sửa chữ…".
3. 1.14, "Việc của OPS":
   - thêm `ottimo-backup@.timer`: mỗi tệp timer có một dòng `OnCalendar` thứ hai;
   - vòng xoay: thay "bộ Chủ nhật UTC < 35 ngày" bằng "theo tuổi (giây) trong tên tệp: < 7 ngày; bộ Chủ nhật UTC < 33 ngày; `purge-journal` < 40 ngày (ARC duyệt 33 ngày ở `ARC-on-ops-prs-92-93-95.md`)";
   - tên test: `backup.test.sh` → `server/test/backup-schedule.test.sh`.
4. G7. Sửa thành: "Lượt hai: production 15:00, staging 15:30 (plan V5-62, PR #93). Chỉ câu 'RPO 12 giờ' còn chờ INV xác nhận ngày 20/11". Không còn là đề xuất.
5. Mục 8, dòng decision-log đề nghị: "V5-62 đề xuất 15:30 cho RPO 12 giờ" → "V5-62 lượt hai production 15:00, staging 15:30 (RPO 12 giờ)".
6. Nên sửa cùng lượt, cho khớp #93 (không bắt buộc):
   - 1.15:
     - đã chọn `ForwardToSyslog=no`;
     - smoke đọc `journalctl CONTAINER_TAG=<tên container>`;
     - `ops-check journal` có ngưỡng dưới (WARN), đếm `Suppressed`, kiểm nhóm `docker` (ARC-07);
     - Postgres `log_error_verbosity=terse` (ARC-08);
     - `daemon.json` trên VPS đang chạy giữ nguyên ở W6, chỉ bootstrap đổi.
   - Mục 7, rủi ro "Bỏ quên `max-size`…": ghi "đã xử lý ở PR #93, test 18, 19, 21".
7. Sau khi sửa: FB-R5-SEC-ARC-09 → Done trong `responses/ARC-responses.md`.

### 1.8 Thứ tự gộp đề xuất
1. **#92** ngay: độc lập, nhỏ, CI xanh đủ.
2. **#93** khi E2E xanh và SEC đã đọc lại ARC-07, ARC-08. Cần trước PR-C1 (hợp đồng mục 2).
3. **#94** khi đủ điều kiện SEC và đã sửa ARC-09 (mục 1.7). Không phụ thuộc PR của OPS, không xung đột. Gộp trước hay sau #93 đều được.
4. **#95** sau khi sửa Major 01–03, và sau #93: README và `hosting-plan.md` của #93 trỏ tới hai tệp của #95.
- PR-C1 (V5-1A) chỉ gộp sau **cả #93 và #94**.
- Gộp lần lượt, chờ CI `main` xanh giữa hai lần (`ci.yml` có `cancel-in-progress` cho push lên `main`, sự cố `ae6288f8`). Không gộp trong lúc đóng băng `main` của runbook.
- Dependabot #28 (digest postgres) để sau #93. Test terse đọc image từ compose nên tự theo digest mới.

---

## 2. Thẻ feedback

### FB-R5-ARC-OPS-01
- Mức độ: Major
- Người nhận: OPS (ORC chạy runbook)
- Vị trí: PR #95, `rounds/round-05/outputs/OPS/v1.0.5-release-runbook.md`:
  - mục 0, các dòng "Bản phát hành gồm gì", "Phần nào không đi qua Release", "Ảnh hưởng tới khách và lễ tân", "INV phải làm gì";
  - luật chung "Giờ chạy"; P0; W1; W6 bước 4–5; mục 6.
- Vấn đề:
  - Mục 0 ghi "Desk không gián đoạn ở W0–W7". W6 bước 4 lại dựng lại postgres, api, worker, web, caddy, và chính W6 ghi "Desk mất vài giây đến khoảng 30 giây". W6 bước 5 làm mọi site mất 1–2 giây.
  - INV chỉ được hỏi trước W0, P2b, P3, P4, P5. W6 production, gồm khởi động lại DB production và edge, không có trong danh sách.
  - Mục 0 không kể V5-63 trong phần OPS góp, cũng không kể W6 trong "Phần nào không đi qua Release".
  - Luật giờ chạy chỉ cấm P2b, P3, P5, R4 trong 02:55–03:45 và 14:55–15:45. W6 bước 4 khởi động lại Postgres, làm hỏng `pg_dump` đang chạy. W1 chỉ dặn chờ lượt bù `OK:` trước P3/P5, không nói trước W6.
- Vì sao quan trọng:
  - INV đồng ý dựa trên mục 0. Desk tắt lúc trả phòng 12:00 hay nhận phòng 14:00 làm lễ tân và khách check-in online bị chặn.
  - Đồng ý phải theo từng việc.
  - Lượt sao lưu hỏng làm RPO tạm về 24 giờ.
- Đề xuất sửa:
  1. Mục 0, dòng "Ảnh hưởng": "Desk, staff, `g.` mất khoảng ⟨số đo ở W6 staging⟩ giây ở W6 bước 4 production, mọi site mất 1–2 giây ở W6 bước 5; ottimo.vn mất vài giây ở W2".
  2. W6 staging bước 4 đo thời gian: từ lúc chạy `up` tới khi mọi service `Healthy` và `curl` Desk ra 200. Ghi số vào biên bản. Số này dùng trong câu xin INV đồng ý cho production.
  3. Thêm "W6 production (bước 4 và 5)" vào danh sách INV đồng ý: mục 0, P0, đầu W6. Khung giờ: ngoài 11:30–12:30 và 13:30–14:30. Báo lễ tân trước, không thu tiền đúng lúc đó.
  4. Luật giờ chạy và mục 6: W6 bước 4–5 cũng không làm trong 02:55–03:45 và 14:55–15:45. W1 thêm: lượt bù phải có `OK:` trước W6 bước 4.
  5. Mục 0 thêm V5-63 (journald, Postgres terse) vào phần OPS góp và vào "Phần nào không đi qua Release".
- Trạng thái: Open

### FB-R5-ARC-OPS-02
- Mức độ: Major
- Người nhận: OPS (SEC cho phần nhóm đọc log)
- Vị trí: PR #95 runbook mục 1.2 (dòng `ops-check.sh`), mục 8 "Rủi ro", P2, W6, W7, K5; PR #93 `check_journal`; `runbook-vps-moi.md` bước 12.
- Vấn đề (chi tiết ở mục 1.3):
  - (a) Từ P2b của mỗi stack tới W6 bước 3–4, `ops-check` mới chạy theo timer báo `journal` FAIL ("journal unreadable", "N container không ghi journald"). Cửa sổ dài hơn nhịp 30 phút, nên chắc có tin FAIL giả vào phòng Báo động và ping `/fail` tới Healthchecks. Runbook chỉ lường trước `sshkeys` và `backup`.
  - (b) Phép kiểm nhóm `adm`/`systemd-journal`/`docker` chưa từng chạy trên VPS hiện tại. Lệch một người là W7 FAIL, và runbook bảo dừng giữa cửa sổ.
  - (c) `pricegap` tĩnh trên staging chưa chạy lần nào.
  - (d) K5 "như v1.0.4" (`sudo -u ottimo`) và bước 12 của runbook VPS mới chạy `ops-check` không có nhóm `systemd-journal`, nên `journal` FAIL đúng thiết kế.
- Vì sao quan trọng:
  - Tin FAIL giả giữa lúc phát hành làm người chạy và INV khó phân biệt với lỗi thật.
  - Dừng ở W7 vì một nhóm có người lạ đã biết từ trước thì kéo dài thời gian Desk ở trạng thái nửa chừng.
- Đề xuất sửa:
  1. Cho (a), chọn một cách và ghi vào runbook:
     - (i) **ARC đề xuất:** dừng `ottimo-ops-check.timer` và `ottimo-ops-check@ottimo-prod.timer` ngay trước P2b staging. W7 bật lại, `list-timers` phải thấy lượt kế tiếp. Trước đó xem thời gian ân hạn của check Healthchecks có ≥ 60 phút không;
     - (ii) nếu ân hạn ngắn hơn: với mỗi stack, làm W6 bước 3–4 ngay sau W1, và báo trước trong phòng Báo động rằng có thể có một tin `journal` FAIL;
     - (iii) cách sửa trong mã (khi chưa có `journald_since` thì `journal` chỉ WARN) cũng được. Nhưng đó là đổi mã sau review, phải chạy lại test, nên không khuyên lúc này.
  2. Cho (b) và (c), thêm vào P2 (chỉ đọc, trước W0):
     - số thành viên ngoài danh sách của từng nhóm, theo đúng luật của `check_journal` (cả nhóm chính; `adm`, `systemd-journal` so với `LOG_READER_USERS`; `docker` chỉ `ottimo`). Chỉ in số, không in tên;
     - số đếm `pricegap` tĩnh của staging qua `SQLRO`;
     - lệch thì quyết với SEC trước cửa sổ: bỏ người khỏi nhóm, hoặc thêm vào `LOG_READER_USERS` có SEC đồng ý.
  3. Cho (d): K5, 5.0, R6 và runbook VPS mới bước 12 dùng đúng lệnh `systemd-run … -p SupplementaryGroups=systemd-journal` của W7, và kể cả mục `journal`.
  4. Mục 1.2 và mục 8: thêm `journal` vào danh sách mục có thể báo nhầm, kèm cách tránh đã chọn ở ý 1.
- Trạng thái: Open

### FB-R5-ARC-OPS-03
- Mức độ: Major
- Người nhận: OPS
- Vị trí: PR #95, `product/docs/runbook-vps-moi.md` mục 1, bước 11–13.
- Vấn đề:
  - Bước 11 (`deploy.sh`, `deploy-landing.sh`) chạy trước bước 13 (trỏ DNS về IP mới).
  - Caddy chỉ xin được chứng chỉ khi DNS đã trỏ về máy mới.
  - Smoke của `deploy.sh` kiểm TLS thật (`SMOKE_INSECURE` mặc định 0, `--retry 6 --retry-delay 5`, `deploy.sh` dòng 308–310). Vậy bước 11 sẽ FAIL ở `smoke`, và `ops-check tls` ở bước 12 cũng FAIL.
  - ACME thất bại lặp lại có thể chạm giới hạn "xác thực thất bại" của Let's Encrypt cho mỗi tên miền mỗi giờ.
- Vì sao quan trọng:
  - Đây là runbook dùng khi mất hẳn máy. Sai thứ tự làm người chạy, đang căng thẳng, dễ chẩn đoán nhầm và tốn thêm giờ.
  - RTO ≤ 4 giờ trình INV là giả định dựa trên runbook này.
- Đề xuất sửa:
  - Đưa bước 13 (DNS) lên ngay sau bước 10, rồi chờ hết TTL (bước 1 đã hạ TTL xuống 300 giây) trước bước 11. Máy cũ đã mất, nên trỏ DNS sớm không làm khách mất gì thêm. Lúc chưa deploy, edge chỉ trả lỗi, không lộ dữ liệu.
  - Nếu vì lý do gì phải deploy trước khi đổi DNS: ghi rõ chạy bước 11 với `SMOKE_INSECURE=1`, rồi chạy lại smoke sau khi đổi DNS.
  - Bước 12: `tls` chỉ được coi là đạt sau khi DNS đã đổi.
- Trạng thái: Open

### FB-R5-ARC-OPS-04
- Mức độ: Minor
- Người nhận: OPS
- Vị trí: PR #95, `product/docs/runbook-vps-moi.md` mục 0, bước 4, 11, 12.
- Vấn đề:
  1. `privacy-notice-<stamp>` có trong danh sách cần có, nhưng không bước nào khôi phục `state/privacy-notice.log`. `deploy-landing.sh` dòng 134–135 cảnh báo khi thiếu tệp này lúc form đang bật. Tệp là bằng chứng các phiên bản thông báo đã đăng (Nghị định 13).
  2. Bước 4 dẫn tới "runbook v1.0.5 W0", tức một tệp trong `rounds/`, viết cho một đợt phát hành. Tài liệu `product/docs/` không nên phụ thuộc vào tệp đó.
  3. VPS mới từ ảnh của hãng có thể có user mặc định trong nhóm `adm`, làm `journal` FAIL ở bước 12.
- Vì sao quan trọng: khôi phục thiếu bằng chứng thông báo dữ liệu cá nhân; runbook mất bước khi bản v1.0.5 cũ đi.
- Đề xuất sửa:
  - thêm bước khôi phục `state/privacy-notice.log` (giải mã trên Mac, chép vào `state/` của stack, `ottimo 0600`) **trước** `deploy-landing.sh`;
  - bước 4 chép các lệnh của W0 vào README `infra/server` mục 3, rồi trỏ về đó;
  - bước 12 thêm câu: `journal` FAIL vì nhóm thì xử lý như thẻ 02 ý 2.
- Trạng thái: Open

### FB-R5-ARC-OPS-05
- Mức độ: Minor
- Người nhận: OPS
- Vị trí: PR #95 runbook W2 ("Không healthy"), W4, mục 5.1 (dòng "App (tiếp)", "Gói `infra/`", "Log").
- Vấn đề: bảng ở mục 1.5 của review này.
  - W2 lùi bằng `deploy-landing.sh --rollback`, tức lùi image, không lùi Caddyfile;
  - W4 không có cách lùi;
  - 5.1 dòng "App (tiếp)" chưa kể journald và Postgres `terse` cũng được giữ;
  - 5.1 dòng "Gói `infra/`" chưa nói rằng sau khi lùi gói, lần deploy hay rollback kế tiếp đưa api/web/worker về driver `local`.
- Vì sao quan trọng: người chạy lùi sai đích thì ottimo.vn (form đặt phòng) vẫn hỏng; người quyết lùi không thấy hết biện pháp bảo vệ bị mất (SEC RB-03).
- Đề xuất sửa:
  - W2: "Không healthy sau khi dựng lại với Caddyfile mới → chép `Caddyfile.landing` từ `BAN CU GIU O` của P2b, rồi W2 lại, báo SEC (054-01 mở lại). `deploy-landing.sh --rollback` chỉ dùng khi lỗi nằm ở image";
  - W4 thêm "Lùi W4": `cat` bản `state/env.before-v105.*` vào `.env` (giữ `ottimo 0600`), `dc config -q`;
  - 5.1 bổ sung hai ý trên.
  - Trả lời câu hỏi của OPS ở mục 8: không cần hàng riêng cho việc lùi riêng Caddyfile. Đường lùi là Q2 hoặc chép riêng tệp như ý W2 ở trên. Cả hai đều mở lại 054-01.
- Trạng thái: Open

### FB-R5-ARC-OPS-06
- Mức độ: Minor
- Người nhận: OPS
- Vị trí: PR #93: `product/infra/server/journald/50-ottimo.conf` dòng 2; `product/infra/server/README.md` mục 7 (đoạn journald) và mục 3; `product/docs/hosting-plan.md` dòng RPO/RTO.
- Vấn đề:
  - `50-ottimo.conf` ghi "runbook v1.0.5 W7 on a running VPS", nhưng runbook cài tệp này ở W6 bước 1.
  - README chưa nói hệ quả của `ForwardToSyslog=no`: `/var/log/syslog` và `/var/log/auth.log` ngừng ghi, nhật ký sshd chỉ còn trong journal.
  - README mục 3 và `hosting-plan.md` trỏ tới hai tệp chỉ có khi #95 được gộp.
- Vì sao quan trọng: người đọc README tìm `auth.log` khi điều tra đăng nhập SSH sẽ thấy tệp dừng ghi và tưởng mất log.
- Đề xuất sửa:
  - `W7` → `W6` trong `50-ottimo.conf`;
  - README mục 7 thêm một dòng: "Từ v1.0.5, `/var/log/auth.log` và `/var/log/syslog` không ghi nữa. Nhật ký SSH đọc bằng `sudo journalctl -u ssh --since …`";
  - hai đường dẫn tới #95 để nguyên, vì thứ tự gộp ở mục 1.8 xử lý.
- Trạng thái: Open

### FB-R5-ARC-OPS-07
- Mức độ: Minor
- Người nhận: OPS
- Vị trí: PR #95 runbook P0, W1 "Đúng là", W6 bước 4, K1–K7, 5.0, R6.
- Vấn đề:
  - Hợp đồng 1.15 đòi test "smoke sau deploy: journal có dòng của container **trước** lần deploy". Đây chính là bằng chứng OR-04 (log còn qua lần dựng lại container). W6 bước 4 chỉ kiểm journal có dòng của container hiện tại. Bằng chứng thật chỉ có sau lần dựng lại kế tiếp, tức P5, mà K chưa kiểm.
  - W1 chưa kiểm cả máy có đúng hai timer sao lưu, mỗi stack một.
  - P0 chưa ghi PR-C1 (V5-1A) phải gộp sau #93.
- Vì sao quan trọng: V5-63 được làm để giữ log qua lần deploy. Không kiểm sau P5 thì chưa chứng minh được điều đó.
- Đề xuất sửa:
  - thêm K: `sudo journalctl CONTAINER_TAG=ottimo-prod-api-1 --since <giờ W6 bước 4> --until <giờ P5> -q | wc -l` > 0;
  - W1 "Đúng là": `systemctl list-timers 'ottimo-backup*' --all` có đúng 2 dòng timer trên máy;
  - P0: "PR-C1 (V5-1A) gộp sau #93 (hợp đồng mục 2)";
  - 5.0 và R6 thêm mục `journal`.
- Trạng thái: Open

### FB-R5-ARC-OPS-08
- Mức độ: Suggestion
- Người nhận: OPS (SEC xét ý 2)
- Vị trí: PR #93 `check_journal` bước 1; `bootstrap-vps.sh` tùy chọn `--deploy-key`.
- Vấn đề:
  1. `journal` chỉ kiểm container của stack mình. Edge là project riêng, nên edge về `local` (ví dụ chạy bootstrap bằng gói cũ) thì không ai thấy.
  2. Bootstrap bắt buộc `--deploy-key` lần đầu, kể cả khi đã có `--admin-user`. Vì vậy dựng máy nào cũng phải làm thêm bước gỡ khóa (OR-03).
- Vì sao quan trọng: hai chỗ hở nhỏ, dễ lặp lại ở VPS mới.
- Đề xuất sửa:
  - stack production kiểm thêm container có nhãn `com.docker.compose.project=ottimo-edge`;
  - backlog B-OPS: cho bootstrap chạy chỉ với `--admin-user`, không cần `--deploy-key`.
- Trạng thái: Open

### FB-R5-ARC-OPS-09
- Mức độ: Suggestion
- Người nhận: OPS
- Vị trí: PR #92 `product/infra/caddy/Caddyfile.landing`, chú thích trên `(public_api)`.
- Vấn đề: chú thích ghi "the preview password of the basic auth above". Basic auth nằm trong snippet `landing_access`, được import ở khối site **bên dưới**.
- Vì sao quan trọng: chỉ là chữ. Người sửa tệp sau có thể đi tìm `basic_auth` ở phía trên.
- Đề xuất sửa: "… the preview password of the basic auth in /run/secrets/landing_access (imported in the site block below)". Sửa lúc chạm tệp lần tới, không cần commit riêng.
- Trạng thái: Open

### FB-R5-ARC-BE-01
- Mức độ: Minor
- Người nhận: BE (BE-A, chủ test), QA
- Vị trí: `product/services/api/test/integration/reservation-list.test.ts` dòng 98; `test/helpers/reservations-fixture.ts` dòng 169 (`seedGuestRow`).
- Vấn đề: test chập chờn khoảng 0,1 % mỗi lượt. Mã khách `KH-<6 ký tự hex ngẫu nhiên>` có thể chứa "401", và ô `q` khớp `g.code ILIKE '%401%'`. Bằng chứng ở mục 1.4. Đã đỏ một lần ở CI của PR #93.
- Vì sao quan trọng:
  - CI đỏ không do lỗi làm người ta quen "chạy lại cho xanh", rồi bỏ qua lỗi thật;
  - lượt chạy lại tốn khoảng 10 phút mỗi lần.
- Đề xuất sửa:
  - trong test này, `guest()` ghi mã cố định không có chữ số (ví dụ `KH-HA`, `KH-BINH`);
  - hoặc `seedGuestRow` sinh mã từ bảng chữ ngoài `[0-9a-f]`;
  - rà các test khác tìm bằng `q` toàn chữ số trên dữ liệu có mã hex ngẫu nhiên.
- Trạng thái: Open

---

## 3. Trả lời các câu hỏi mở gửi ARC
- **ARC-08, hai chỗ OPS nhờ SEC xét.** Ý ARC để SEC quyết:
  - (a) câu lỗi chính có thể chứa giá trị (ví dụ uuid sai): chấp nhận. Api kiểm đầu vào trước khi gửi DB;
  - (b) chưa nên thêm `log_min_error_statement=panic`:
    - api luôn dùng tham số bind, nên dòng `STATEMENT` chỉ có `$1`;
    - SQL tay bị runbook giới hạn ở câu đếm READ ONLY;
    - mất dòng `STATEMENT` thì khó gỡ lỗi migration lúc phát hành.
- **`id_hash_key` không có bản ngoại tuyến** (runbook VPS mới mục 2).
  - ARC đồng ý đề xuất của OPS: INV giữ bản ngoại tuyến cạnh KEK, cùng cách giữ.
  - Mất khóa thì chỉ mục mù hỏng. Lộ khóa thì số giấy tờ 12 chữ số dò ngược được. Vì vậy khóa này cần cùng mức bảo vệ với KEK.
  - Không tốn tiền nên không ESC. SEC chốt cách giữ, ORC đưa vào danh sách việc của INV ngày 20/11.

## 4. Điểm làm tốt (nên giữ)
- Mỗi test mới có lượt đối chứng trên mã cũ (9 FAIL, 8 FAIL, 36 FAIL). Test Postgres đọc `command` từ chính compose và có lượt không setting, nên chứng minh được chỗ rò chứ không chỉ "chạy xanh".
- Vòng xoay theo giây kèm mô phỏng 45 ngày, có ca lỡ hai lượt. Con số 33 ngày được chứng minh, không phải đoán.
- W0 an toàn:
  - kiểm đường `ottimo-admin` + `sudo` trước;
  - ghi bằng tệp mới rồi `mv` nguyên tử, giữ bản cũ ở `/root`;
  - kiểm lại số khóa CI và khóa kéo, không in khóa, chỉ ghi 8 ký tự vân tay.

---

## 5. Phản hồi của OPS (06/11, bước Phản hồi & sửa)

Commit đã đẩy, chưa gộp (OPS không tự merge):
- **#93** nhánh `r5-ops`: `ad92f1b5` (thẻ 06, cùng SEC 93-01…04), `59216001` (prettier xuống dòng danh sách `command` của postgres; hai test đọc được cả hai dạng).
- **#95** nhánh `r5-ops-runbooks`: `40e31795` (runbook v1.0.5 r1, runbook VPS mới r1), `b7b00e06` và `bd175b80` (runbook VPS mới không còn trỏ vào runbook v1.0.5: lệnh viết thẳng hoặc trỏ về README).
- #95 trỏ tới README `infra/server` 3.1 và dòng `ID_HASH_KEY` của `hosting-plan.md` 8.1, hai chỗ này nằm trong #93. Gộp #93 trước, như mục 1.8.

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R5-ARC-OPS-01 | Done (`40e31795`) | (1) Mục 0, dòng "Ảnh hưởng": Desk, staff, `g.` mất `GIAN_DOAN_W6` giây ở W6 bước 4 production; mọi site mất 1–2 giây ở bước 5; ottimo.vn mất vài giây ở W2. (2) W6 staging bước 4 đo từ `up` tới khi mọi service `healthy` và Desk trả 200. Số ghi vào ô 0.1 `GIAN_DOAN_W6`, rồi đưa vào câu đồng ý Đợt C. (3) W6 production nằm trong **Đợt C** (0.2, P0, đầu W6). Khung giờ đề xuất 09:00–11:30, ngoài 11:30–12:30 và 13:30–14:30. Báo lễ tân trước 10 phút, không thu tiền đúng lúc đó. (4) Luật "Giờ chạy" và mục 6 thêm W1, W2, W6 bước 4–5. Lượt bù của W1 phải có `OK:` trước W6 bước 4. (5) Mục 0 kể V5-63 (journald, `terse`, ghim cài đặt log) trong phần OPS góp và trong "Phần nào không đi qua Release". |
| FB-R5-ARC-OPS-02 | Done (`40e31795`) | (a) Chọn cách (i), **làm theo từng stack**: bước T mới, T0 dừng timer `ops-check` của stack ngay trước P2b, T1 bật lại sau W7. `list-timers` phải thấy NEXT ≤ 30 phút, T0 → T1 < 60 phút (Healthchecks `ottimo-production` ân hạn 1 giờ, decision-log 30/10). Quá 50 phút thì T1 ngay và chuyển sang cách (ii). Lý do tách theo stack: Đợt A (staging) và Đợt C (production) có thể cách nhau nhiều ngày vì cổng V5-61 (SEC 95-02). Trong khoảng đó production vẫn chạy gói cũ, chưa có mục `journal`, nên không báo giả. (b)(c) P2 có thêm: số người ngoài danh sách của `adm`, `systemd-journal`, `sudo`, `wheel`, `docker` (tính cả nhóm chính, chỉ in số) và số ACL lạ; `pricegap` tĩnh của staging qua `SQLRO` bằng câu lấy từ `ops-check` tại `SHA_V105`. Có số khác 0 thì không vào Đợt A, quyết với SEC trước. (d) K5, 5.0, R6 và runbook VPS mới (bước 16, mục 1.6) dùng lệnh `systemd-run … -p SupplementaryGroups=systemd-journal` của W7. (4) Mục 1.2 và mục 8 có `journal` trong danh sách mục có thể báo nhầm, kèm cách tránh. |
| FB-R5-ARC-OPS-03 | Done (`40e31795`) | Runbook VPS mới: DNS là bước 14, chờ hết TTL rồi mới deploy ở bước 15. Mục 1.5 kiểm bằng `dig`. Bước 15 không đợi được DNS thì chạy `SMOKE_INSECURE=1` và chạy lại smoke sau khi đổi DNS. Mục 1.6: `tls` chỉ được coi là đạt sau bước 14. |
| FB-R5-ARC-OPS-04 | Done (`40e31795`, `b7b00e06`, `bd175b80`) | (1) Bước 13 (mục 1.4) khôi phục `state/privacy-notice.log` trước `deploy-landing.sh`. INV gõ, tệp `ottimo 0600`, so số dòng với lượt sao lưu. (2) Lệnh gỡ khóa deploy chuyển sang README `infra/server` **3.1** (#93). Bước 5 trỏ về đó. `b7b00e06` và `bd175b80` bỏ nốt các chỗ trỏ vào runbook v1.0.5: gói theo README 13.1; lệnh timer, `journald_since` và lệnh đếm người đọc log viết thẳng trong runbook. (3) Bước 5 đếm người đọc log bằng lệnh mục 1.7: chỉ in số, cùng luật với `journal`, đã chạy thử trong ubuntu:24.04 với dash. User mặc định của ảnh thì gỡ bằng `gpasswd -d`. Mục 1.6: `journal` FAIL vì nhóm thì làm như bước 5. |
| FB-R5-ARC-OPS-05 | Done (`40e31795`) | W2 "Không healthy": chép `Caddyfile.landing` cũ từ `BAN CU GIU O`, rồi W2 lại, báo SEC (054-01 mở lại). `--rollback` chỉ dùng khi lỗi nằm ở image. Có "Lùi W4": `cat` bản `env.before-v105.*` vào `.env` dưới user `ottimo` (giữ `0600`), rồi kiểm cấu hình không in giá trị. Mục 5.1: dòng "App (tiếp)" có thêm journald, `terse` và các cài đặt ghim. Dòng "Gói `infra/`" có thêm: lần deploy hay rollback kế tiếp đưa api, web, worker về driver `local`. Có thêm hai dòng: lùi W4 và Caddyfile riêng. Mục 8 ghi câu trả lời của ARC về hàng lùi riêng. |
| FB-R5-ARC-OPS-06 | Done (`ad92f1b5`) | `50-ottimo.conf` dòng 2: "runbook v1.0.5 W6 step 1 on a running VPS". README mục 7: `auth.log` và `syslog` ngừng ghi từ W6. Đọc SSH bằng `journalctl -u ssh`, đọc `sudo` bằng `journalctl _COMM=sudo`, giữ 90 ngày. Hai đường dẫn tới #95 để nguyên, theo mục 1.8. |
| FB-R5-ARC-OPS-07 | Done (`40e31795`) | K10 mới: `journalctl CONTAINER_TAG=ottimo-prod-api-1 --since <giờ W6 bước 4> --until <giờ P5> -q \| wc -l` > 0. Đây là bằng chứng OR-04, chỉ in số. W1 "Đúng là": cả máy có đúng 2 timer sao lưu, mỗi stack một (`TIMER SAO LUU TREN MAY: 2`). P0 thêm: PR-C1 (V5-1A) gộp sau #93. 5.0 và R6 có mục `journal`. |
| FB-R5-ARC-OPS-08 | Deferred (B-OPS) | Ý 1 (stack production kiểm thêm container nhãn `com.docker.compose.project=ottimo-edge`) là đổi mã `check_journal` sau review, phải SEC đọc lại. Để B-OPS, không gộp vào #93 lúc này. Trong lúc chờ, W6 bước 5 đếm container không ghi journald trên **cả máy**, kể cả edge (`CONTAINER KHONG JOURNALD (CA MAY): 0`). Ý 2 (bootstrap chạy được chỉ với `--admin-user`): B-OPS. Tạm thời README 3.1 có lệnh gỡ khóa dùng cho mọi máy mới. |
| FB-R5-ARC-OPS-09 | Deferred | #92 đã gộp (`e56c8513`). Theo đề xuất của thẻ, sửa chú thích `(public_api)` lúc chạm `Caddyfile.landing` lần tới, không commit riêng. |
| FB-R5-ARC-BE-01 | – | Thẻ của BE-A và QA, không phải OPS. OPS ghi nhận: CI đỏ ở #93 lượt `4f1fd261` là do thẻ này. |

Câu trả lời mục 3: OPS làm theo quyết định của SEC (không `log_min_error_statement=panic`). SEC 93-03 ghim thêm bốn cài đặt log trên dòng lệnh, có test đọc `pg_settings`. `id_hash_key`: `hosting-plan.md` 8.1 có dòng riêng (INV + OPS, bản ngoại tuyến cạnh KEK, khác phong bì với khóa `age`). README 4.2 có thêm bản chép. Runbook VPS mới bước 9 đặt cả KEK lẫn `id_hash_key`. Việc INV cất khóa: ORC đưa vào danh sách cuối round, làm cùng buổi V5-61.

## 6. Lượt 2 @ bd175b80 – ARC đọc lại #95 (06/11)

- Phạm vi: `git diff fd11c4a2 bd175b80`, gồm `40e31795`, `b7b00e06`, `bd175b80`, hai tệp:
  - `rounds/round-05/outputs/OPS/v1.0.5-release-runbook.md` (r1);
  - `product/docs/runbook-vps-moi.md` (r1).
- Chỉ đọc phần đổi cho thẻ ARC 01–05 và 07. Phần sửa theo thẻ SEC 95-01…07 thì SEC đọc lại.
- CI @ `bd175b80` xanh đủ, kể cả `docker images build · E2E smoke`. `mergeStateStatus` CLEAN. Gộp thử `main` → #93 → #95: không xung đột.
- Các chỗ #95 trỏ tới (README `infra/server` 3.1, 12, 13.1; `hosting-plan.md` 8.1) có ở `r5-ops` @ `59216001`. Vẫn gộp #93 trước #95 như mục 1.8.

| Thẻ | Kết quả đọc lại | Chỗ đã kiểm |
|---|---|---|
| FB-R5-ARC-OPS-01 | **Đóng** | Đủ năm ý: (1) mục 0 "Ảnh hưởng" có `GIAN_DOAN_W6`, 1–2 giây edge, vài giây ottimo.vn; (2) W6 bước 4 đo từ `up` tới khi mọi service `Healthy` và Desk trả `200` qua edge (`--resolve … 127.0.0.1`), staging ghi vào 0.1, production so lại, vượt gấp đôi thì ghi decision-log; (3) W6 production nằm trong Đợt C, có câu đồng ý riêng kèm số giây, 09:00–11:30, báo lễ tân trước 10 phút; (4) luật "Giờ chạy" và mục 6 có W1, W2, W6 bước 4–5, lượt bù W1 phải có `OK:` trước W6 bước 4; (5) V5-63 có trong mục 0. Thêm điểm tốt: cổng V5-61 chặn Đợt C và P3–P5, khớp SEC 95-02 |
| FB-R5-ARC-OPS-02 | **Đóng** | (a) Chọn cách (i) theo từng stack (bước T): T0 trước P2b, T1 sau W7, T0 → T1 < 60 phút theo ân hạn Healthchecks 1 giờ; quá 50 phút thì T1 ngay và chuyển sang cách (ii). Tách theo stack là đúng, vì Đợt A và C có thể cách nhau nhiều ngày; ARC đã kiểm lý do "production gói cũ không có mục `journal`, nên không báo giả". (b)(c) P2 mục 5–6: đếm nhóm (thêm `sudo`, `wheel`, ACL theo SEC 93-04), chỉ in số; `pricegap` tĩnh staging lấy đúng câu ở `SHA_V105` qua `SQLRO`, lệch thì không vào Đợt A. (d) K5, 5.0, R6, runbook VPS mới 1.6 dùng lệnh `systemd-run` của W7. (4) Mục 8 có `journal` trong rủi ro báo nhầm |
| FB-R5-ARC-OPS-03 | **Đóng** | DNS là bước 14, deploy là bước 15 và chỉ chạy sau bước 14. Mục 1.5 kiểm 4 tên bằng `dig`. Có đường `SMOKE_INSECURE=1`, kèm câu đúng về giới hạn của `--insecure` và giới hạn của Let's Encrypt. 1.6: `tls` chỉ đạt sau bước 14 |
| FB-R5-ARC-OPS-04 | **Đóng** | (1) Bước 13 / 1.4 khôi phục `privacy-notice.log` trước `deploy-landing.sh`: INV gõ, `ottimo 600`, so số dòng. (2) Không còn chỗ trỏ vào runbook v1.0.5: gỡ khóa theo README 3.1, gói theo README 13.1, lệnh 1.6/1.7 viết thẳng. (3) Bước 5 + 1.7 đếm người đọc log cùng luật `journal`, gỡ user mặc định bằng `gpasswd -d`. Ghi chú nhỏ ở thẻ 10 |
| FB-R5-ARC-OPS-05 | **Đóng** | W2 "Không healthy" chép `Caddyfile.landing` cũ từ `BAN CU GIU O` (`install -o root`, kiểm `AUTH STRIP TRONG TEP: 0`), `--rollback` chỉ khi lỗi ở image. "Lùi W4" dùng `cat >` dưới user `ottimo`, `config -q` không in giá trị. 5.1 có journald, `terse` + cài đặt ghim ở dòng "App (tiếp)", hai dòng mới (lùi W4, Caddyfile riêng), lùi W1 |
| FB-R5-ARC-OPS-07 | **Đóng** | K10 đếm dòng api trong [`GIO_W6_4`, `GIO_P5`) và kiểm container ghi các dòng đó không còn chạy, đúng bằng chứng OR-04. W1 `TIMER SAO LUU TREN MAY: 2`. P0 "PR-C1 (V5-1A) gộp sau #93". 5.0, R6 có `journal` |

### FB-R5-ARC-OPS-10
- Mức độ: Minor (sửa trước khi gửi câu đồng ý Đợt A; không chặn gộp #95)
- Người nhận: OPS
- Vị trí:
  - runbook v1.0.5 r1, mục 0.2 câu mẫu Đợt A và W6 bước 2;
  - `runbook-vps-moi.md` bước 5 và 7.
- Vấn đề:
  1. Câu Đợt A kết bằng "Production không đổi gì". Nhưng W6 bước 1 khởi động lại journald của cả máy. W6 bước 2 còn ghi `/opt/ottimo-prod/state/journald_since`. Không ảnh hưởng dịch vụ, vì container production còn driver `local`. Nhưng câu đồng ý phải đúng từng chữ (SEC 95-01).
  2. Runbook VPS mới bước 5 cho phép "thêm vào `LOG_READER_USERS`/`SUDO_USERS`" lúc `.env` chưa có (bước 7 mới tạo).
- Vì sao quan trọng: INV đồng ý dựa trên câu mẫu. Người chạy làm theo thứ tự bước.
- Đề xuất sửa:
  1. Chọn một trong hai:
     - (a) thay "Production không đổi gì" bằng "Production: app và container không đổi; chỉ ghi ngày bắt đầu nhật ký vào thư mục trạng thái của production";
     - (b) chuyển phần `/opt/ottimo-prod` của W6 bước 2 sang Đợt C, trước W6 bước 3 production.
     - ARC chọn (a): ít đổi nhất. `journald_since` là mốc của cả máy, ghi sớm không sai.
     - Trùng ý 1 của SEC FB-R5-SEC-OPS-95-08 (câu Đợt A). OPS sửa một lần theo thẻ SEC, vì thẻ đó rộng hơn (câu Đợt B, C). Thẻ này đóng cùng lúc.
  2. Bước 5: "muốn giữ user thì ghi lại, đặt `LOG_READER_USERS`/`SUDO_USERS` ở bước 7 (SEC đồng ý)".
- Trạng thái: Open

### Kết luận lượt 2 cho #95: **DUYỆT**
- Ba Major 01, 02, 03 và Minor 04, 05, 07 đã đóng.
- Thẻ 10 (Minor, chữ) sửa trước khi ORC gửi câu đồng ý Đợt A. Không cần ARC đọc lại.
- Gộp sau #93 (mục 1.8).
- Phần SEC (95-01…07) do SEC kết luận. Duyệt của ARC không thay kết luận "chưa duyệt" của SEC ở lượt trước.
- Lúc điền ô `⟨CHỜ tác giả PR⟩` khi cắt `SHA_V105`, OPS thêm bước kiểm trước Release của V5-25:
  - câu SQL `v5-25-parameter-shape-check.sql`, có guard và hai dòng đếm;
  - chạy trước P3;
  - `min_stay`/`weekend_nights` không ok thì dừng.
  - Xem `ARC-on-pr-96-v5-25.md` ĐK-2, thẻ FB-R5-ARC-BE-03.
