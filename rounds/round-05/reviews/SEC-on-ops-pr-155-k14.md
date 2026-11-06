# SEC – Review PR #155 (OPS: runbook v1.0.5 K14, truy vấn người chốt DOM 1H-01) @ `2cea3139`

Round 5 · bước **Review** · SEC · 07/11/2026 · thẻ FB-R5-SEC-ARC-1I-02 (phần duyệt khối)

## Đối tượng

| PR | Nhánh | HEAD lúc đọc | Gốc (merge-base với `main`) | Phần của PR | CI lúc đọc |
|---|---|---|---|---|---|
| #155 | `r5-ops-1h01-query` | **`2cea3139`** | `101c68bc` | Một commit, 5 tệp: `k14-closer-change-counts.sql` (mới), `k14-closer-change-list.sql` (mới), `k14-closer-change-note.md` (mới), `v1.0.5-release-runbook.md` (K14 mới, sửa 0.1, 0.2, 6, 7, 8), `OPS-responses.md` (+2 dòng). Chỉ tài liệu và SQL | gitleaks, confidential paths, OpenAPI lint, API contract, no test endpoints: xanh. Các job còn lại đang chạy |

Đối chiếu:
- `SEC-on-contract-0313-addendum-1i.md`, thẻ FB-R5-SEC-ARC-1I-02;
- `SEC-on-ops-pr-129-r4.md`: khuôn K13 (mục 1, 2, 3, 6), điều kiện "không tách theo loại người hưởng hay theo người";
- `DOM-on-ops-pr-155-k14.md` (`c633a57b`): DOM duyệt 8 dòng đếm, thẻ DOM 155-01 Major đòi K14-L in tên hiển thị nhân viên;
- `.github/CODEOWNERS` (cổng (b), dòng "SQL run on production");
- `product/infra/postgres/init/02-roles.sh`; bảng `reservation_change`, `commission`, `user_property_role`, `reservation`, `property`, `app_user`; luật tên V-01 (`users.controller.ts`, `normalize.ts`) và `production-bootstrap.ts`.

Cách kiểm:
- Lấy `refs/pull/155/head` vào ref tạm, mở worktree riêng ở scratchpad. Không checkout vào bản làm việc chung, không SSH, không gọi staging hay production.
- Tự trích bốn thứ bằng `git show` và đúng lệnh `awk` của runbook, rồi tính `shasum -a 256`. Trích thêm `v530-run`, `v525-run`, `v530-check` để so.
- **Chạy thử trên DB dùng một lần:**
  - `postgres:17-alpine`, container riêng của SEC, mật khẩu giả chỉ sống trong container;
  - `02-roles.sh` thật của nhánh, rồi đủ migration (`pnpm db:migrate`);
  - dữ liệu giả lấy từ các test tích hợp của `main`. SEC thêm bằng tay một lần đổi người chốt sau nhận phòng (lý do có chuỗi đánh dấu và một số thẻ thử), hai dòng hoa hồng lệch người hưởng, và chuỗi đánh dấu trong mọi tên hiển thị nhân viên;
  - chạy hai khối chạy thật, chỉ thay dòng `ssh …` bằng `docker exec -i -e PGOPTIONS="<cùng chuỗi>" <container> sh -c '<cùng lệnh psql>'`.
- Xóa worktree, ref tạm, container và tệp tạm khi xong.

Tệp này không có bí mật, mật khẩu, địa chỉ IP, tỷ lệ hay số tiền hoa hồng, số đếm của production, tên người, mã đơn hay dữ liệu khách. Số trong mục 3 là của DB thử.

---

## 0. Kết luận

| Phần | SHA | Kết luận |
|---|---|---|
| **K14 đếm**: câu `k14-closer-change-counts.sql` + khối `k14-run` | `536ecbad…1275` + `9c109725…8d00` | **DUYỆT, ghim** (mục 1). DOM duyệt 8 dòng đếm không đổi |
| **K14-L**: câu `k14-closer-change-list.sql` + khối `k14-list-run` @ `2cea3139` | `84886b97…046d` + `131e3392…5ce5` | **K14-L chờ ghim lại.** Không ghim hai số này: câu sẽ đổi theo DOM 155-01 (thêm tên hiển thị nhân viên). SEC ghim lại ở một tệp review mới khi OPS đẩy head mới |
| Gộp #155 | `2cea3139` hoặc head mới | **Được**, khi CI xanh trên đúng head đó, và câu đếm cùng khối `k14-run` không đổi byte nào (ORC so bằng lệnh trích ở mục 7). Câu danh sách ở head nào cũng **không chạy** cho tới khi SEC ghim lại |

Trả lời các câu OPS và ORC hỏi:
- **Bốn SHA:** ghim hai (K14 đếm). Hai số của K14-L không ghim (xem trên). SEC tự tính cả bốn, cả bốn trùng số OPS đề xuất.
- **(d) Tên hiển thị nhân viên trong K14-L:** **SEC chấp nhận**, trên kênh (e) và kèm 6 điều kiện ở mục 6 (thẻ 155-03). Thẻ 1I-02 của SEC đã tính tới việc truy vấn trả tên hiển thị nhân viên; điều SEC đòi là cách chạy, không cấm tên. Lý do chấp nhận ở mục 6.
- **(e) Kênh của K14-L:** **chấp nhận** cách OPS đề xuất (INV tự dán một dòng vào Terminal trên Mac), kèm 5 luật ở mục 5. Có tên người thì 5 luật này càng bắt buộc. Luật có hiệu lực ngay theo tệp này; OPS chép vào runbook theo thẻ 155-01. Không chọn cách "ORC chạy vào một tab Terminal của INV": tab Terminal trong ứng dụng Claude là chỗ ORC đọc được bằng công cụ của mình.
- **(f) CODEOWNERS:** **có**, một dòng ở PR sau của OPS, không chặn gộp (thẻ 155-02).

0 Blocker · 1 Major (155-03: điều kiện để SEC ghim lại K14-L; không chặn gộp #155, không chặn K14 đếm) · 1 Minor · 1 Suggestion. ESC mới: **không**.

Thẻ FB-R5-SEC-ARC-1I-02:
- phần OPS, K14 đếm: **Closed** khi #155 gộp;
- phần OPS, K14-L: còn mở tới khi SEC ghim lại;
- phần ARC (một dòng ở 1.30 hoặc 0.3.14): còn mở.

Điều kiện chạy K14 đếm vẫn như runbook K14 "Khi nào": bản đang chạy có #154, DOM xác nhận định nghĩa, hai dòng `shasum` trùng bản ghim. SEC không thêm điều kiện cho câu đếm. Lưu ý cho OPS: thẻ DOM 155-03 (ii) (đổi nhãn `payee_not_closer_projected_auto`) là tùy chọn. Nếu OPS sửa câu đếm, SHA đổi, khối `k14-run` đã ghim sẽ dừng ở dòng 3, và SEC phải ghim lại cả câu đếm. SEC đề nghị **giữ nguyên câu đếm** trong lượt sửa này.

---

## 1. Bản ghim

SEC tự trích từ `2cea3139` và tự tính.

| Thứ | Lấy từ | SHA-256 | Trạng thái |
|---|---|---|---|
| `k14.sql` = `k14-closer-change-counts.sql` | Tệp riêng @ `2cea3139` | `536ecbade9a84b15d5b6a3f78f851ea4afc3b77cbc6a9e0e1914a1b89b881275` | **Ghim**. 75 dòng, 4 954 byte |
| `k14_run.sh` = khối `k14-run` | Runbook @ `2cea3139`, và mục 7 của tệp này | `9c109725ef333676c2ec2941a0a952187afe6846a7f1929f25dc847f65d28d00` | **Ghim**. 6 dòng, 861 byte |
| `k14l.sql` = `k14-closer-change-list.sql` | Tệp riêng @ `2cea3139` | `84886b970bdf544ec129075aa03c9d1e043dd087108eb0e41dea7c8b18f1046d` | **Không ghim** (chờ câu mới theo DOM 155-01) |
| `k14l_run.sh` = khối `k14-list-run` | Runbook @ `2cea3139` | `131e33920be9b8012287b7adce0f86e915c6dd846d973c9235223493dbfb5ce5` | **Không ghim**. Khối mới sẽ chỉ khác ở dòng 3 (SHA của câu mới) |

Ô `K14_PIN` ở bảng 0.1 của runbook: OPS (ở head mới) hoặc ORC (lúc cắt `SHA_V105`) điền phần đếm bằng hai số đã ghim. Phần danh sách ghi "chờ SEC ghim lại".

**Các bản ghim cũ không đổi.** Trích ở `2cea3139`:
- `v530-run` = `4f89c218…32ab`;
- `v525-run` = `60872413…41eb`;
- `v530-check` = `c13c4d68…0d71`.

Cả ba trùng `SEC-on-ops-pr-129-r4.md` mục 1.

**So với `v530-run` đã ghim:**
- `diff v530_run.sh k14_run.sh` chỉ ra dòng 1, 3, 4, 6: hai dòng đánh dấu, tên tệp và SHA của câu ở dòng 3, tên tệp ở dòng 4.
- `k14_run.sh` và `k14l_run.sh` (bản @ `2cea3139`) cũng chỉ khác nhau ở bốn dòng đó.
- **Dòng 5** (`ssh … PGOPTIONS … psql`) của cả hai khối **giống từng byte** dòng 5 của `v530-run`: vai `ottimo_readonly`, `default_transaction_read_only=on`, `statement_timeout=30s`, `lock_timeout=3s`, `psql -X -v ON_ERROR_STOP=1 … -tA`.

---

## 2. Bốn điểm ORC yêu cầu kiểm

### 2.1 Không có tên, id, số tiền hay tỷ lệ nào ra khỏi máy chủ

| Câu | Cột in ra | Kết quả |
|---|---|---|
| Câu đếm (ghim) | Nhãn hằng (`closer_changed_after_checkin…`, `payee_not_closer…`) và `count(*)`. Phần tách chỉ theo **trạng thái đơn** và **trạng thái dòng hoa hồng**, không theo loại người hưởng hay theo người (điều kiện K13) | **Đạt** |
| K14-L @ `2cea3139` (không ghim) | `l1`/`l2`, mã đơn, trạng thái đơn, ngày nhận phòng và ngày đổi cuối (theo giờ cơ sở), số lần đổi, **vai** hiện có của người đổi cuối, trạng thái các dòng hoa hồng, `yes`/`no`/`none`, nhãn việc. Không có `display_name`, `username`, id, `amount_vnd`, `base_amount_vnd`, `rate_pct_snapshot`, `reason`, `old_value`/`new_value` hay cột khách | **Đạt** ở bản này. Bản mới sẽ có thêm tên hiển thị (mục 6) |
| Đường lỗi | Câu đếm chỉ có một phép ép kiểu, ở dòng gác, và nó ép một **câu hằng** sang `boolean`. K14-L thêm `timestamptz → date → text`, phép này không bao giờ lỗi. Không câu báo lỗi nào nhắc lại giá trị của hàng | **Đạt** |

Bằng chứng chạy thử (mục 3):
- trong đầu ra của cả hai khối, SEC tìm: mẫu UUID, chuỗi đánh dấu (có trong tên nhân viên và lý do), số thẻ thử trong lý do, và **16 giá trị** `amount_vnd` / `rate_pct_snapshot` có trong bảng `commission` của DB thử;
- kết quả: **0 lần**, ở cả hai khối.

Số đếm chính xác đi vào chat ORC–INV, như K13. Repo chỉ ghi `= 0` / `> 0` (runbook K14 "Ghi gì, ở đâu", mục 6, 7).

### 2.2 Dòng gác dừng khi chạy sai vai

Chạy cả hai câu trên DB thử, mỗi lần một `PGOPTIONS` khác:

| Vai / cách chạy | Kết quả |
|---|---|
| `role=ottimo_readonly` (đúng khối) | Qua dòng gác, ra đủ dòng |
| `role=ottimo_app`, không tenant | **Thoát mã 3** ngay sau `BEGIN`: `k14 check stopped: run as ottimo_readonly …` / `k14 list stopped: …` |
| `role=ottimo_app` + `app.property_id` của một cơ sở không có | **Thoát mã 3**: `… no property is visible` |
| `role=ottimo_requeue` | **Thoát mã 3**: `permission denied for table property` |
| DB không có cơ sở nào, `role=ottimo_readonly` | **Thoát mã 3**: `… no property is visible` |
| Bỏ `-c role=` (người dùng quản trị của container, siêu người dùng) | Dòng gác cho qua (`rolsuper`), như K13. Dòng 2 ra tên người dùng quản trị, không phải `ottimo_readonly`, nên bảng "Đúng là" (dòng 1–5) dừng. Đầu ra không thêm cột nào |

Hai điểm SEC nhận, không thẻ:
- `ottimo_app` kèm tenant **thật** sẽ qua dòng gác và chỉ đếm một cơ sở. Kết quả vẫn chỉ là số đếm. Muốn tới được ca này thì phải sửa dòng 5 của khối, tức SHA của khối đổi và bước so SHA dừng.
- `permission denied` → runbook đã ghi "dừng, báo OPS, không chạy lại bằng vai quản trị".

### 2.3 Đổi một byte thì dừng

- SEC đổi **một byte** (một chữ hoa thành chữ thường ở `ROLLBACK`) trong `k14.sql` rồi trong `k14l.sql`, sau đó chạy khối.
- Cả hai khối dừng ở dòng 3: `k14.sql: SHA-256 mismatch - stop, report to SEC` / `k14l.sql: …`, mã thoát 1.
- Dòng 1–5 (`on`, vai…) không hiện, tức **không có gì được gửi** tới `psql`.
- Khối chạy tự nó được kiểm ở bước trích: dòng `shasum` của `k14_run.sh` phải trùng mục 1.

### 2.4 `desk.ottimo.vn` chỉ ở dòng `ssh` đã ghim

- Trong phần PR thêm vào, `desk.ottimo.vn` xuất hiện đúng **2 lần**: dòng 5 của `k14-run` và dòng 5 của `k14-list-run`. Cả hai giống từng byte dòng 5 của `v530-run`.
- Phần thêm vào không có địa chỉ IP, tên máy khác, khóa, mật khẩu hay token. Đường dẫn khóa `~/.ssh/ottimo_ops` và người dùng `ottimo-admin` là của dòng đã ghim.
- Bốn dòng PR xóa đều là dòng runbook được viết lại để thêm K14 (bảng 0.2, câu P3–P5, dòng K mục 6, dòng mẫu mục 7). Không có luật SEC nào bị bỏ.

---

## 3. Chạy thử trên DB dùng một lần

Dữ liệu thử có: một đơn đã trả phòng, người chốt bị đổi **sau** nhận phòng, dòng `earned` của người khác; một đơn `confirmed` có dòng `projected` lệch người hưởng.

**Khối `k14-run` (ghim):** đúng **16 dòng**, đúng thứ tự:
- dòng 1–5: `on`, `ottimo_readonly`, `30s`, `3s`, `t|f`;
- dòng 6: `BEGIN`;
- dòng 7–14: 8 dòng đếm, đúng nhãn và đúng số kỳ vọng của bộ dữ liệu: (a) = (a2) = 1; (b) = 2, (b1) = (b2) = (b3) = 1;
- các phép kiểm của runbook đều đạt: `a = a1 + a2 + a3`; `b1 ≤ b`; `b2 ≤ b`; `b ≤ b1 + b2`; `b3 ≤ b2`;
- dòng 15–16: `ROLLBACK`, `#END`.

**Khối `k14-list-run` @ `2cea3139` (không ghim):**
- dòng 1–6 như trên, rồi một dòng `l1` (`checked_out`, `owner`, `earned`, `no`, `next_payout`);
- hai dòng `l2`: `next_payout` cho đơn đã đạt, `desk_fixes_at_checkout` cho đơn `confirmed`;
- rồi `ROLLBACK`, `#END`.

Ghi chú cho OPS và DOM (không phải thẻ): DB thử có nhiều cơ sở, nên hai đơn ở hai cơ sở mang cùng một mã. K14-L không có cột cơ sở. Production hôm nay có một cơ sở nên không sao. Nếu thêm cơ sở thứ hai, câu nên thêm mã cơ sở, và SEC ghim lại.

---

## 4. Phần còn lại của runbook (ngoài khối ghim)

| Chỗ | Kiểm | Kết quả |
|---|---|---|
| 0.1 `K14_PIN`, `MERGE_154` | Ô chờ. Chưa ghim thì bỏ K14, không chặn P0 | **Đạt** |
| 0.2 câu đồng ý P5 + K | Có K14 theo điều kiện; "chỉ ra số đơn, không ra tên, mã đơn, tỷ lệ hay số tiền" | **Đạt** |
| K14 "Khi nào" | 4 điều kiện; không chạy trước `r5-h1c`; lần 2 cần câu đồng ý riêng | **Đạt** |
| K14 bước 3 | Một lần gọi, không `| tee`, không `>`; không chạy khi `deploy.sh`/migrate đang chạy; xóa `$W` | **Đạt** |
| K14 "Ghi gì, ở đâu" | Repo: `= 0` / `> 0` và "số khớp: đúng". Số chính xác chỉ trong chat ORC–INV, không vào subagent hay chat với vai khác. Dừng vì số không khớp: chỉ báo phép kiểm nào hỏng, không kèm số | **Đạt**, đúng khuôn 129-01 |
| Mục 6 (dừng gì) | K14 dừng chỉ dừng chính K14, không lùi Release | **Đạt** |
| Mục 7 (dòng mẫu decision-log) | Chỉ `= 0` / `> 0`; K14-L "INV tự chạy trên Mac, ORC không xem" | **Đạt** |
| Mục 8 giả định (a)–(g) | (a)–(c) thuộc DOM; (d) thay theo DOM 155-01, SEC chấp nhận tên (mục 6); (e) mục 5; (f) thẻ 155-02; (g) đúng (mục 2.4) | Như ghi |
| "Đội không sửa tay `reservation`, `reservation_change`, `commission`, `audit_event` trên production" | Có | **Đạt** |

---

## 5. Kênh của K14-L: SEC chấp nhận (e), kèm 5 luật

Vì sao chấp nhận:
- Đầu ra cần đi tới **đúng một người**: INV là OWN, người quyết và chi hoa hồng. Nó không được đi qua phiên của ORC.
- Đầu ra lệnh ORC chạy đi vào phiên chat và tệp phiên. Tab Terminal trong ứng dụng Claude cũng là chỗ ORC đọc được bằng công cụ đọc terminal. Vì vậy cách "ORC chạy vào một tab Terminal của INV mà không đọc" không giữ được lời hứa "không đọc".
- Cách "không có danh sách" không dùng được: DOM 155-01 cho thấy Desk v1.0.5 không hiện người chốt cũ, người chốt hiện tại hay người hưởng cho OWN.

**5 luật (có hiệu lực ngay theo tệp này, áp cho mọi bản K14-L):**
1. **Đúng ứng dụng.** "Terminal trên Mac" là ứng dụng **Terminal của macOS** (hoặc một ứng dụng terminal riêng không có trợ lý AI), mở cửa sổ mới. **Không** dùng tab Terminal bên trong ứng dụng Claude, không dùng terminal của trình soạn mã có tiện ích AI, không dùng khung chat.
2. **Dòng lệnh tự kiểm.** ORC trích và so hai SHA bằng lệnh K14-L trong tệp SEC ghim lại (hai dòng `shasum` vào chat là được, chúng không chứa dữ liệu). Rồi ORC đưa INV **đúng một dòng theo mẫu này**, chỉ thay `⟨W⟩` bằng thư mục của `mktemp -d`:
   ```
   cd '⟨W⟩' && test "$(shasum -a 256 k14l_run.sh | cut -d ' ' -f 1)" = ⟨SHA khối k14-list-run SEC ghim lại⟩ && bash k14l_run.sh
   ```
   - Dòng này tự kiểm khối chạy, và khối chạy tự kiểm câu SQL (dòng 3 của khối). Như vậy INV không phải tin dòng ORC đưa.
   - INV chỉ dán khi dòng **bắt đầu bằng** `cd '/var/folders/` hoặc `cd '/tmp/`, **có đúng** SHA khối của tệp SEC ghim lại, **kết thúc bằng** `&& bash k14l_run.sh`, và không có `sudo`, `curl`, `|`, `;`, `>` hay chữ nào khác.
   - Sai mẫu, hoặc lệnh không in gì rồi thoát ngay (SHA lệch): INV không chạy lại, báo ORC "dòng lệnh sai mẫu". ORC báo SEC.
3. **ORC không nhìn.** Từ lúc đưa dòng lệnh tới lúc INV báo "xong", ORC không dùng công cụ đọc terminal, chụp màn hình, điều khiển máy tính hay trình duyệt, và không tự chạy `k14l_run.sh` bằng bất kỳ cách nào.
4. **INV không chép ra.** INV đọc trên màn hình, làm việc trên Desk theo bảng việc của DOM. Không dán dòng nào vào chat, không chụp màn hình, không lưu tệp. INV chỉ báo ORC một trong ba câu: "xong", "có lỗi ở dòng 6", "có lỗi khác".
   - ORC không hỏi tên. Nếu INV tự viết tên vào chat, ORC không chép tên vào repo, decision-log hay lời giao việc cho subagent.
5. **Dọn.** INV xóa màn hình (Cmd+K) rồi **đóng cửa sổ** trước khi thoát Terminal, để tính năng khôi phục cửa sổ của macOS không giữ lại nội dung. ORC xóa `⟨W⟩` ngay sau khi INV báo "xong".
   - Lịch sử shell chỉ giữ dòng lệnh, không giữ đầu ra. Dòng lệnh chỉ có đường dẫn và SHA, không có dữ liệu.

Câu đồng ý K14-L của runbook giữ nguyên ý, nhưng phải sửa hai chỗ khi OPS sửa câu theo DOM 155-01: bỏ "không có tên người", thay bằng "có tên hiển thị nhân viên, không có tên khách, tỷ lệ hay số tiền"; thêm "cửa sổ Terminal của macOS, không phải tab trong ứng dụng Claude".

---

## 6. Tên hiển thị nhân viên trong K14-L: SEC chấp nhận, kèm 6 điều kiện

Vì sao chấp nhận:
- **Đúng mục đích.** Việc của 1H-01 là chi hoa hồng đúng người. Không có tên thì INV không biết ai là người chốt lúc nhận phòng, ai đang ghi, ai giữ dòng hoa hồng (DOM 155-01, mục 1.4). Không có cách nào khác trên Desk v1.0.5.
- **Đúng người xem.** INV là OWN, người quản lý tài khoản nhân viên trên Desk và là bên chi hoa hồng. Tên hiển thị là thứ OWN đã thấy ở danh sách nhân viên. Không có gì mới đối với người xem, chỉ có ghép tên với đơn.
- **Tối thiểu.** Chỉ tên hiển thị, không username, email, số điện thoại, id. Người hưởng (`payee_type` `agent` hoặc `staff`) luôn là người dùng Desk (`payee_user_id` → `app_user`), nên không có tên người ngoài hệ thống.
- **Không lưu lại.** Tên chỉ có trên màn hình INV trong vài phút, theo 5 luật ở mục 5. Không vào repo, chat, decision-log hay subagent.

Rủi ro SEC thấy và cách chặn:
- `psql -tA` in nguyên byte ra Terminal. Tên nhân viên tạo qua API qua luật V-01 (chỉ chữ, dấu, khoảng trắng, `.`, `'`, `-`; tối đa 80 ký tự). Tên chủ cơ sở tạo qua `production-bootstrap.ts` chỉ được cắt khoảng trắng và giới hạn 100 ký tự. Dữ liệu cũ hay dữ liệu nạp ngoài API cũng không chắc qua V-01.
- Một tên có ký tự điều khiển (ESC, CR, BEL) hoặc ký tự đảo chiều chữ (U+202E) có thể xóa hay viết đè dòng trên màn hình INV. Ví dụ: một dòng `l1` bị giấu, hoặc tên người này hiện thành tên người kia. INV sẽ quyết sai người hưởng mà không biết.
- Một tên có `|` làm lệch cột.

**6 điều kiện để SEC ghim lại câu K14-L (thẻ 155-03):**
1. **Chỉ `app_user.display_name`.** Không `username`, `email`, `phone`, id, cột nào của khách, `reason`, `old_value`/`new_value` thô, tỷ lệ, số tiền. Nối `app_user` theo cả `organization_id` của đơn.
2. **Lọc ký tự trong câu SQL.** Mọi tên in ra đi qua đúng biểu thức này (SEC đã thử trên PostgreSQL 17, UTF8: giữ nguyên chữ tiếng Việt có dấu; thay ESC, BEL, CR, C1, ký tự không rộng, ký tự đảo chiều và `|` bằng `?`; cắt ở 80 ký tự):
   ```sql
   left(regexp_replace(u.display_name, '[\x01-\x1f\x7f-\x9f­؜᠎​-‏ -‮⁠-⁯﻿￹-￻|]', '?', 'g'), 80)
   ```
   OPS có thể gói biểu thức trong một CTE, nhưng không đổi lớp ký tự.
3. **Hậu tố và giá trị trống.** Người đã thu hồi hết vai ở cơ sở: thêm hậu tố hằng "(đã thu hồi)". Không có người (lần đổi do hệ thống, người chốt trống): in `none`. Không in lý do thu hồi hay ngày thu hồi.
4. **Câu đếm không đổi.** Tên chỉ có ở K14-L. Câu đếm vẫn không tách theo người (SEC 129).
5. **Khung chạy giữ nguyên.** Câu mới vẫn: `BEGIN READ ONLY`, dòng gác `k14 list stopped: …`, `ROLLBACK`. Khối `k14-list-run` mới chỉ khác bản @ `2cea3139` ở dòng 3 (SHA của câu). Dòng 5 giống từng byte `v530-run`.
6. **Chạy thử của OPS có thêm ca tên xấu.** Ngoài chuỗi đánh dấu, DB thử có tên chứa ESC, CR, U+202E và `|`. Đầu ra không còn byte nào trong các lớp đó. OPS ghi kết quả trong `k14-closer-change-note.md` bằng chữ (đạt / không đạt), không chép tên thử vào tệp.

Khi OPS đẩy head mới, SEC sẽ: trích và tính lại hai SHA của K14-L; đọc lại câu theo 6 điều kiện; chạy thử lại trên DB dùng một lần (gồm ca tên xấu); rồi ghim ở một tệp review mới, kèm lệnh trích K14-L và mẫu dòng lệnh của luật 2 có SHA thật.

---

## 7. Lệnh trích và khối đã ghim (K14 đếm)

ORC dùng **đúng lệnh này** (runbook K14 bước 2 đã ghi "dùng lệnh trích SEC đưa"). Câu SQL lấy từ `main`, khối chạy lấy từ **tệp này**, như K13. Chạy trên Mac từ thư mục repo. Khi dán vào zsh, không thêm chú thích `#` vào cuối dòng.

```bash
cd /Users/anhvh/Desktop/hotel-app && git fetch origin
Q=$(git log -1 --format=%H origin/main -- rounds/round-05/outputs/OPS/k14-closer-change-counts.sql)
S=$(git log -1 --format=%H origin/main -- rounds/round-05/reviews/SEC-on-ops-pr-155-k14.md)
W=$(mktemp -d)
git show "${Q}:rounds/round-05/outputs/OPS/k14-closer-change-counts.sql" > "$W/k14.sql"
git show "${S}:rounds/round-05/reviews/SEC-on-ops-pr-155-k14.md" | awk '/^# >>> k14-run$/ {f=1} f {print} /^# <<< k14-run$/ {f=0}' > "$W/k14_run.sh"
cd "$W" && shasum -a 256 k14.sql k14_run.sh
```

Đúng là: `536ecbad…1275  k14.sql` và `9c109725…8d00  k14_run.sh`. Rồi chạy `bash "$W/k14_run.sh"` một lần, theo runbook K14 bước 3.

Trích khối từ runbook (lệnh của runbook K14 bước 2) cũng ra đúng số của khối. Nguồn ghim là tệp này. Lệnh trích K14-L sẽ có ở tệp SEC ghim lại.

Khối đã ghim:

```bash
# >>> k14-run
cd "$(dirname "$0")" || exit 1
test "$(shasum -a 256 k14.sql | cut -d ' ' -f 1)" = 536ecbade9a84b15d5b6a3f78f851ea4afc3b77cbc6a9e0e1914a1b89b881275 || { echo 'k14.sql: SHA-256 mismatch - stop, report to SEC'; exit 1; }
{ printf '%s\n' 'SHOW default_transaction_read_only;' 'SELECT current_user;' 'SHOW statement_timeout;' 'SHOW lock_timeout;' 'SELECT r.rolbypassrls, r.rolsuper FROM pg_roles r WHERE r.rolname = current_user;'; cat k14.sql; printf '%s\n' "SELECT '#END';"; } | \
ssh -i ~/.ssh/ottimo_ops -o BatchMode=yes ottimo-admin@desk.ottimo.vn 'cd / && sudo -n -u ottimo /opt/ottimo-prod/infra/server/bin/dc exec -T -e PGOPTIONS="-c default_transaction_read_only=on -c role=ottimo_readonly -c statement_timeout=30s -c lock_timeout=3s" postgres sh -c '\''psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tA'\'''
# <<< k14-run
```

---

## 8. Thẻ

### FB-R5-SEC-OPS-155-01
- Mức độ: **Minor**. Không chặn gộp #155. Hạn: trước lần chạy K14-L đầu tiên. Tới đó ORC theo mục 5 của tệp này.
- Người nhận: OPS (runbook), ORC (làm theo)
- Vị trí: `v1.0.5-release-runbook.md` K14, phần "Danh sách mã đơn (K14-L)", gạch "Kênh: chỉ màn hình Mac của INV"; câu đồng ý K14-L cuối bước.
- Vấn đề:
  - Runbook ghi "cửa sổ **Terminal của macOS**", nhưng chưa nói rõ không dùng tab Terminal trong ứng dụng Claude. Tab đó ORC đọc được bằng công cụ của mình.
  - Dòng ORC đưa INV là `bash ⟨thư mục $W⟩/k14l_run.sh`, tức INV phải tin ORC đã so SHA. Dòng lệnh không tự kiểm, và INV không có mẫu để nhận ra một dòng lạ.
  - Chưa ghi việc ORC không dùng công cụ đọc terminal, chụp màn hình hay điều khiển máy trong lúc INV xem.
  - Chưa ghi việc đóng cửa sổ trước khi thoát Terminal, để macOS không khôi phục nội dung cửa sổ.
- Vì sao quan trọng: K14-L là đầu ra duy nhất của K14 có mã đơn, tên nhân viên và quan hệ "người hưởng khác người chốt". Lời hứa "ORC không đọc, không vào chat" chỉ giữ được khi đầu ra không đi vào chỗ nào ORC có công cụ đọc. Một dòng lệnh được dán vào terminal từ chat phải tự chứng minh nó là dòng đã duyệt.
- Đề xuất sửa:
  - chép 5 luật ở mục 5 vào phần K14-L;
  - thay dòng `bash ⟨thư mục $W⟩/k14l_run.sh` bằng mẫu tự kiểm ở luật 2;
  - sửa câu đồng ý K14-L như cuối mục 5.
  - Chỉ sửa chữ ngoài khối ghim, nên không đổi SHA nào.
- Trạng thái: Open

### FB-R5-SEC-OPS-155-02
- Mức độ: Suggestion. Ở PR sau của OPS, không chặn gộp #155.
- Người nhận: OPS
- Vị trí: `.github/CODEOWNERS`, nhóm "SEC – SQL run on production (gate (b))" (hiện chỉ có `/product/services/api/scripts/*.sql`).
- Vấn đề: hai câu K14 chạy trên production bằng bản SEC ghim, nhưng nằm ở `rounds/round-05/outputs/OPS/`. Cổng (b) không có dòng nào cho chỗ này, nên một PR sửa câu sẽ không được ORC chuyển cho SEC trước khi gộp.
- Vì sao quan trọng:
  - Bản ghim đã chặn được việc chạy một câu đã đổi: khối dừng ở dòng 3. Đây là hướng an toàn.
  - Dòng CODEOWNERS giúp phát hiện sớm hơn: câu đổi thì SEC review và ghim lại **trước** ngày chạy, không phải lúc ORC đã đứng ở bước K14.
- Đề xuất sửa: thêm dưới dòng `scripts/*.sql`, cùng chú thích của nhóm đó:
  ```
  /rounds/*/outputs/OPS/*.sql @anhvh93-tech
  ```
  Dùng `*` cho round để phủ cả các câu ghim của round sau. Không thêm cả thư mục `OPS/`, vì phần chữ của runbook không phải đường dẫn SEC.
- Trạng thái: Open

### FB-R5-SEC-OPS-155-03
- Mức độ: **Major**, là điều kiện để SEC ghim lại câu K14-L. Không chặn gộp #155, không chặn ghim và chạy K14 đếm.
- Người nhận: OPS (câu `k14-closer-change-list.sql`, chữ K14-L, `k14-closer-change-note.md`), SEC (ghim lại)
- Vị trí: `k14-closer-change-list.sql` khối (1), (2), khi sửa theo DOM 155-01; runbook K14-L và câu đồng ý K14-L; mục 8 giả định (d).
- Vấn đề: câu mới sẽ in tên hiển thị nhân viên ra thẳng Terminal của INV. Tên tạo ngoài luật V-01 (chủ cơ sở qua bootstrap, dữ liệu cũ, dữ liệu nạp ngoài API) có thể chứa ký tự điều khiển, ký tự đảo chiều hay `|`.
- Vì sao quan trọng: các ký tự đó viết đè hay giấu được dòng trên màn hình. INV sẽ chi hoa hồng theo một danh sách đã bị sửa mà không biết. Không có tên thì cũng không có quyết định đúng (DOM 155-01), nên phải in tên, nhưng in an toàn.
- Đề xuất sửa: làm đủ 6 điều kiện ở mục 6. Sửa giả định (d) theo chữ DOM đề xuất, thêm "lọc ký tự theo SEC 155-03".
- Trạng thái: Open

---

## 9. Điểm làm tốt

- Câu SQL ở **tệp riêng** thay vì trong runbook. Sửa chữ runbook không còn đụng tới SHA của câu, và lệnh trích đơn giản hơn K13. Nhờ vậy SEC ghim được câu đếm ngay, dù câu danh sách còn đổi.
- Dòng 5 của cả hai khối giống từng byte dòng đã ghim của `v530-run`. SEC chỉ phải đọc bốn dòng khác, và không có đường kết nối mới tới máy chủ.
- Lượt chạy thử của OPS dùng chuỗi đánh dấu, có ca dòng gác và ca đổi một byte (`k14-closer-change-note.md`), không chỉ đọc câu.

## 10. Giới hạn

- SEC không xét định nghĩa đếm, giả định (a)–(c), nhãn việc hay bảng việc của INV. Các phần đó thuộc DOM.
- SEC chưa đọc câu K14-L mới (chưa có). Mục 6 là điều kiện, không phải kết quả review.
- SEC không chạy gì trên staging hay production, không SSH. SEC không approve hay gộp trên GitHub.
- Kết quả chạy thử là của DB thử của SEC, không nói gì về dữ liệu production.

---

## 11. Dòng decision-log đề xuất (ORC ghi)

`| 2026-11-07 | 5 | **SEC – review PR #155 (OPS runbook v1.0.5 K14, truy vấn người chốt DOM 1H-01) @ 2cea3139: DUYỆT K14 đếm, ghim; K14-L chờ ghim lại.** K14_PIN phần đếm: k14-closer-change-counts.sql 536ecbad…1275 (75 dòng), khối k14-run 9c109725…8d00; SEC tự trích và tính, trùng số OPS. K14-L @ 2cea3139 (84886b97…046d, 131e3392…5ce5) không ghim: câu đổi theo DOM 155-01. Gộp #155 được khi CI xanh và câu đếm cùng khối k14-run không đổi byte nào; K14-L không chạy tới khi SEC ghim lại. Dòng 5 (ssh … ottimo_readonly, read only, 30s/3s) giống từng byte v530-run; desk.ottimo.vn chỉ ở dòng đó; v525-run, v530-run, v530-check không đổi. Chạy thử trên DB dùng một lần: 16 dòng đúng thứ tự, phép kiểm số đạt; UUID, chuỗi đánh dấu, số thẻ thử và 16 giá trị amount/rate của DB thử xuất hiện 0 lần; ottimo_app (không tenant hoặc tenant lạ), ottimo_requeue, DB không có cơ sở → thoát mã 3 ở dòng gác; đổi một byte → dừng ở dòng 3, không gửi gì. (d) Tên hiển thị nhân viên trong K14-L: SEC chấp nhận, chỉ trên kênh (e), kèm 6 điều kiện (chỉ display_name; lọc ký tự điều khiển, đảo chiều và dấu sổ bằng biểu thức SEC đưa, cắt 80 ký tự; câu đếm không tách theo người; khung chạy giữ nguyên; chạy thử có ca tên xấu). (e) INV tự dán một dòng vào Terminal của macOS: chấp nhận, kèm 5 luật (ứng dụng Terminal riêng, không phải tab trong ứng dụng Claude; dòng lệnh tự kiểm SHA khối; ORC không đọc terminal, không chụp màn hình, không hỏi tên; INV không chép ra; đóng cửa sổ, ORC xóa thư mục tạm). (f) CODEOWNERS: có, /rounds/*/outputs/OPS/*.sql ở PR sau. Lệnh trích K14: câu từ main, khối từ tệp SEC này. Thẻ: 155-03 Major (điều kiện ghim lại K14-L), 155-01 Minor (chép 5 luật vào runbook trước lần K14-L đầu, không đổi SHA), 155-02 Suggestion (dòng CODEOWNERS). 1I-02: phần OPS K14 đếm Closed khi #155 gộp; K14-L và phần ARC còn mở. Không ESC | SEC | rounds/round-05/reviews/SEC-on-ops-pr-155-k14.md |`
