# SEC – Ghim lại K14-L r5.1 (PR #155 @ `17c6d493`)

Round 5 · bước **Review** · SEC · 07/11/2026 · thẻ SEC 155-01, 155-03; DOM 155-01, 155-02, 155-03

Tệp này nối tiếp `SEC-on-ops-pr-155-k14.md`. Tệp đó ghim K14 đếm và để K14-L chờ ghim lại. Tệp này ghim K14-L r5.1, và là **nguồn của khối `k14-list-run`** cho lệnh trích ở mục 6.

## Đối tượng

| PR | Nhánh | HEAD lúc đọc | Phần mới so với `2cea3139` | CI lúc đọc |
|---|---|---|---|---|
| #155 | `r5-ops-1h01-query` | **`17c6d493`** | Một commit. 4 tệp, +254 −109: `k14-closer-change-list.sql`, `k14-closer-change-note.md`, `v1.0.5-release-runbook.md`, `OPS-responses.md`. **`k14-closer-change-counts.sql` không đổi** | gitleaks, confidential paths, OpenAPI lint, API contract, no test endpoints, shellcheck, landing: xanh. format · lint · audit · test · build: đang chạy |

Cách kiểm:
- Lấy `refs/pull/155/head` vào ref tạm, mở worktree riêng ở scratchpad. Không SSH, không gọi staging hay production.
- Tự trích bằng `git show` và `awk` rồi tính `shasum -a 256`: hai câu, hai khối chạy, và `v530-run`.
- Đọc hết câu danh sách mới (154 dòng). Đọc phần K14-L của runbook và các ghi chú của OPS.
- **Chạy thử trên DB dùng một lần:**
  - `postgres:17-alpine`, chỉ nghe `127.0.0.1`;
  - `02-roles.sh` thật, đủ migration;
  - dữ liệu giả từ các test tích hợp hoa hồng của nhánh. SEC thêm tên xấu, lần đổi người chốt sau nhận phòng và dòng hoa hồng lệch bằng tay (mục 4);
  - chạy khối `k14-list-run` thật, chỉ thay dòng `ssh …` bằng `docker exec` với cùng `PGOPTIONS` và cùng lệnh `psql`.
- Xóa worktree, ref tạm, container và tệp tạm khi xong.

Tệp này không có bí mật, địa chỉ IP, tên người, mã đơn, tỷ lệ, số tiền hay dữ liệu khách. Đầu ra chạy thử chỉ nằm ở scratchpad và đã xóa.

---

## 0. Kết luận

| Phần | SHA | Kết luận |
|---|---|---|
| **K14-L r5.1**: câu `k14-closer-change-list.sql` + khối `k14-list-run` | `c6607b5b…f5ee` + `eb8e7492…71bd` | **GHIM** (mục 1) |
| K14 đếm | `536ecbad…1275` + `9c109725…8d00` | Không đổi. SEC tính lại ở `17c6d493`: trùng từng byte. ORC gộp #155 khi CI xanh, đúng như mục 0 của `SEC-on-ops-pr-155-k14.md` |
| Bản K14-L r5 | `84886b97…046d` + `131e3392…5ce5` | Không dùng. Khối r5 tự dừng ở dòng 3, vì câu đã đổi |

- **Điều kiện chạy K14-L**, theo runbook K14-L:
  - K14 có (a) > 0 hoặc (b) − (b3) > 0;
  - INV đồng ý riêng (câu đồng ý K14-L);
  - giữ đủ 5 luật kênh;
  - production có **một** cơ sở (giả định (h)).
- **Thẻ:**
  - SEC 155-01 và 155-03: **Done** @ `17c6d493`. **Closed** khi #155 gộp ở `17c6d493`, hoặc ở head sau có cùng bốn SHA;
  - FB-R5-SEC-ARC-1I-02, phần OPS của K14-L: **Closed** cùng lúc;
  - thẻ mới 155-04 (Suggestion, `:` và `+`) cho lần sửa câu sau;
  - ESC mới: **không**.
- **Tên nhân viên trên kênh (e):** SEC xác nhận lại là chấp nhận được, đúng như `SEC-on-ops-pr-155-k14.md` mục 6. Bản r5.1 đạt đủ 6 điều kiện (mục 2).

**Sửa tệp SEC trước.** `SEC-on-ops-pr-155-k14.md` dòng 211 (biểu thức lọc tên ở mục 6) có ký tự vô hình thật ở các mục `\u…` của lớp ký tự. Chúng xuất hiện khi SEC soạn tệp. Đó đúng là điều OPS ghi chú. Commit này thay dòng đó bằng đúng lớp ký tự viết bằng mã thoát ASCII mà câu r5.1 dùng. Lớp ký tự không đổi, và tệp đó nay không còn ký tự vô hình.
- Khối `k14-run` trong tệp đó không bị chạm. Lệnh trích K14 đếm vẫn ra `9c109725…8d00`; SEC đã chạy lại sau commit này.

---

## 1. Bản ghim

| Thứ | Lấy từ | SHA-256 | Trạng thái |
|---|---|---|---|
| `k14.sql` = `k14-closer-change-counts.sql` | Tệp riêng @ `17c6d493` | `536ecbade9a84b15d5b6a3f78f851ea4afc3b77cbc6a9e0e1914a1b89b881275` | Ghim từ trước (`SEC-on-ops-pr-155-k14.md`), không đổi |
| `k14_run.sh` = khối `k14-run` | `SEC-on-ops-pr-155-k14.md` mục 7 | `9c109725ef333676c2ec2941a0a952187afe6846a7f1929f25dc847f65d28d00` | Ghim từ trước, không đổi |
| `k14l.sql` = `k14-closer-change-list.sql` r5.1 | Tệp riêng @ `17c6d493` | `c6607b5b118eb819ec03cd4ed0070f9c830eded6e5735fb09cb68c1e486ff5ee` | **Ghim**. 154 dòng, 10 529 byte |
| `k14l_run.sh` = khối `k14-list-run` r5.1 | Runbook @ `17c6d493`, và mục 6 của tệp này | `eb8e7492fff02fdcc6cbbdf979838fec307568588784a61c554102dac21971bd` | **Ghim**. 6 dòng, 874 byte |

Cả bốn số trùng số OPS và ORC đưa. Ô `K14_PIN` của bảng 0.1: phần danh sách điền bằng hai số in đậm trên.

So khối:
- `k14-list-run` r5.1 khác bản r5 **chỉ ở dòng 3** (SHA của câu).
- Dòng 5 (`ssh … ottimo_readonly`, read only, `30s`/`3s`, `psql -X -v ON_ERROR_STOP=1 … -tA`) **giống từng byte** dòng 5 của `v530-run` (`4f89c218…32ab`, không đổi).
- So với `k14-run`, khối chỉ khác ở dòng 1, 3, 4, 6 (dấu mốc, tên tệp, SHA).
- Phần PR thêm vào không có tên máy, địa chỉ IP, khóa, mật khẩu hay token. Bốn tệp không có ký tự điều khiển hay ký tự vô hình nào.

---

## 2. Sáu điều kiện SEC 155-03

| # | Điều kiện | Ở câu r5.1 | Kết quả |
|---|---|---|---|
| 1 | Chỉ `app_user.display_name`; nối theo tổ chức của đơn | CTE `staff` nối `app_user` với `property` theo `organization_id`, rồi khớp theo `property_id` của đơn. Không cột nào in `username`, `email`, `phone`, id, `reason`, `old_value`/`new_value` thô, tỷ lệ, số tiền hay cột khách. `old_value` chỉ dùng để **so** (`user_id::text = old_value`), không ép kiểu, nên không có câu báo lỗi nào nhắc lại giá trị | **Đạt** |
| 2 | Lọc ký tự bằng đúng biểu thức SEC, cắt 80 ký tự | Dòng 33 và 104: đúng lớp ký tự của SEC, viết bằng mã thoát `\x` / `\u` (chữ ASCII), rồi `left(…, 80)` | **Đạt** |
| 3 | Hậu tố "(đã thu hồi)"; `none` khi không có người; không in lý do hay ngày thu hồi | Hậu tố gắn sau khi cắt, chỉ khi người đó có vai ở cơ sở và mọi vai đều đã thu hồi. `none` cho lần đổi do hệ thống và người chốt trống. `unknown` cho id không khớp nhân viên nào của tổ chức | **Đạt** |
| 4 | Câu đếm không đổi, không tách theo người | `536ecbad…1275`, từng byte như bản đã ghim | **Đạt** |
| 5 | Khung chạy giữ nguyên | `BEGIN TRANSACTION READ ONLY`, dòng gác `k14 list stopped: …`, `ROLLBACK`. Khối chỉ khác dòng 3 | **Đạt** |
| 6 | OPS chạy thử có ca tên xấu, ghi đạt / không đạt, không chép tên thử | Runbook K14-L ghi đủ: ESC, CR, U+202E, `\|`, xuống dòng kèm một dòng `l1` giả, BEL, C1, ký tự không rộng, U+2066, U+FEFF, U+2028, DEL, tên dài hơn 100 ký tự. Tất cả **đạt**. Không có tên thử trong tệp | **Đạt** |

Cột mới theo DOM 155-03 (loại đơn `short`/`long`, `main`/`child`) chỉ là hằng và trạng thái. Không mở thêm dữ liệu người.

---

## 3. Bốn ghi chú của OPS: SEC trả lời

| Ghi chú | SEC |
|---|---|
| Lớp ký tự viết bằng mã thoát `\x` / `\u`, không có ký tự vô hình trong tệp | **Đồng ý, và đúng hơn bản của SEC.** Người đọc tệp ghim phải thấy được mọi ký tự trong đó. Mã thoát cần `standard_conforming_strings = on`: đó là mặc định từ PostgreSQL 9.1, và `PGOPTIONS` của khối không đổi nó. Khi đó bộ máy regex đọc mã thoát. Nếu ai tắt nó, câu lỗi ngay ở lớp ký tự (`invalid byte sequence for encoding "UTF8": 0x9f`, SEC đã thử) và không in dòng nào, tức hỏng theo hướng an toàn. Đầu ra chạy thử của SEC không còn mã nào trong lớp (mục 4) |
| Người đổi cuối in `none` khi do hệ thống, cột vai ghi `system` | **Đồng ý.** Đúng điều kiện 3. Hai cột cùng nói "không có người", theo hai cách đọc |
| Không có cột cơ sở, vì chỉ có một cơ sở | **Đồng ý cho production hôm nay.** Đó là giả định (h) của runbook, và là điều kiện chạy ở mục 0. DB thử nhiều cơ sở cho thấy mã đơn có thể trùng giữa các cơ sở. Khi thêm cơ sở thứ hai, câu phải có mã cơ sở và SEC ghim lại |
| `:` và `+` trong tên không bị lọc | **Chấp nhận, kèm thẻ 155-04 (Suggestion).** Ở cột dòng hoa hồng (`tên:trạng thái`, nối bằng `+`), một tên có `:` hay `+` đọc ra như hai dòng. SEC thử tên `Hoa:earned+Tuan`: hiện như hai người hưởng. Tên nhân viên tạo hay sửa qua API đều qua luật V-01 (chỉ chữ, dấu, khoảng trắng, `.`, `'`, `-`), nên nhân viên không tự đặt được tên như vậy. Còn lại: tên chủ cơ sở do OPS tạo bằng `production-bootstrap.ts`, và dữ liệu nạp ngoài API. Không ai ngoài OWN và OPS tạo được tên đó, nên không có đường tấn công. Không đáng đổi SHA thêm một lần |

---

## 4. Chạy thử của SEC

Dữ liệu (DB thử, tên giả):
- Người A: tên có ESC + chuỗi xóa dòng, CR, `|`, chuỗi đổi tiêu đề cửa sổ (OSC) và BEL. Là người chốt lúc nhận phòng và là người hưởng.
- Người B: tên có U+202E, xuống dòng kèm một dòng `l1|…` giả đủ 15 trường, C1, U+200B, U+2066, U+FEFF, U+2028, DEL, U+00AD. Mọi vai đã thu hồi. Là người đổi cuối.
- Người C: tên tiếng Việt có dấu, 150 ký tự. Là người chốt đang ghi.
- Người D: tên có `:` và `+`. Là người chốt kiêm người hưởng của một đơn thứ hai. Đơn đó có `old_value` không phải UUID và người đổi là một id không khớp ai.
- Chuỗi đánh dấu riêng trong `username`, `email`, `phone`, lý do đổi (kèm một số thẻ thử) và `old_value`.

Kết quả của khối `k14-list-run` (vai `ottimo_readonly`):

| Kiểm | Kết quả |
|---|---|
| Mã thoát, số dòng | 0. Dòng 1–6 (`on`, `ottimo_readonly`, `30s`, `3s`, `t\|f`, `BEGIN`), 2 dòng `l1`, 1 dòng `l2`, `ROLLBACK`, `#END` |
| Ký tự bị chặn trong đầu ra | **0**, tính trên mọi mã của lớp SEC và mọi ký tự loại Cc, Cf, Zl, Zp (trừ xuống dòng cuối dòng) |
| Số trường | Mọi dòng `l1` đủ 15 trường, dòng `l2` đủ 9. Không có dòng giả: dòng `l1` giả trong tên B nằm gọn trong một trường, các `\|` đã thành `?` |
| Tên | Tiếng Việt có dấu giữ nguyên, tên C cắt ở 80 ký tự. Tên B có hậu tố "(đã thu hồi)", cột vai ghi `revoked`. `unknown` cho `old_value` lạ và người đổi lạ; cột vai ghi `none` |
| Không lộ | `username`, `email`, `phone`, lý do, số thẻ thử, `old_value` thô, UUID: **0 lần** |
| Sai vai | `role=ottimo_app` → thoát mã 3, `k14 list stopped: run as ottimo_readonly …`. `role=ottimo_requeue` → thoát mã 3, `permission denied for table property`. Không dòng `l1`/`l2` nào |
| Đổi một byte | Đổi một byte của `k14l.sql` (`ROLLBACK` → `RoLLBACK`) → `k14l.sql: SHA-256 mismatch - stop, report to SEC`, thoát mã 1, không gửi gì |

---

## 5. Phần K14-L của runbook (thẻ 155-01)

| Kiểm | Kết quả |
|---|---|
| 5 luật kênh | Chép đủ, đúng ý mục 5 của `SEC-on-ops-pr-155-k14.md`: đúng ứng dụng; dòng lệnh tự kiểm; ORC không nhìn; INV không chép ra, ORC không hỏi tên; dọn. **Đạt** |
| Mẫu dòng lệnh cho INV | Có, chờ SHA của SEC. SHA thật ở mục 6 dưới. **Đạt** |
| Câu đồng ý K14-L | "cửa sổ mới của ứng dụng Terminal của macOS (không phải tab Terminal trong ứng dụng Claude)"; có tên hiển thị nhân viên, không có thông tin khách, tỷ lệ hay số tiền. **Đạt** |
| Thấy `?` trong tên | INV nhận người qua phần chữ còn lại. Không chắc thì hỏi ORC, ORC báo SEC, không kèm tên. **Đạt** |
| Lệnh trích của runbook | Lấy khối từ runbook (`R`). Lệnh của SEC ở mục 6 lấy khối từ **tệp này**. Cả hai ra cùng `eb8e7492…71bd`. ORC dùng lệnh của SEC, như runbook đã ghi |

---

## 6. Lệnh trích K14-L, dòng lệnh cho INV, khối đã ghim

**ORC chạy trên Mac**, từ thư mục repo, sau khi #155 đã gộp. Khi dán vào zsh, không thêm chú thích `#` vào cuối dòng.

```bash
cd /Users/anhvh/Desktop/hotel-app && git fetch origin
Q=$(git log -1 --format=%H origin/main -- rounds/round-05/outputs/OPS/k14-closer-change-list.sql)
S=$(git log -1 --format=%H origin/main -- rounds/round-05/reviews/SEC-on-ops-pr-155-k14l-r51.md)
W=$(mktemp -d)
git show "${Q}:rounds/round-05/outputs/OPS/k14-closer-change-list.sql" > "$W/k14l.sql"
git show "${S}:rounds/round-05/reviews/SEC-on-ops-pr-155-k14l-r51.md" | awk '/^# >>> k14-list-run$/ {f=1} f {print} /^# <<< k14-list-run$/ {f=0}' > "$W/k14l_run.sh"
cd "$W" && shasum -a 256 k14l.sql k14l_run.sh && echo "$W"
```

Đúng là: `c6607b5b…f5ee  k14l.sql` và `eb8e7492…71bd  k14l_run.sh`. Lệch thì không đưa gì cho INV, báo SEC. Đúng thì ORC **không chạy khối**. ORC đưa INV đúng một dòng này, chỉ thay `⟨W⟩` bằng thư mục vừa in:

```
cd '⟨W⟩' && test "$(shasum -a 256 k14l_run.sh | cut -d ' ' -f 1)" = eb8e7492fff02fdcc6cbbdf979838fec307568588784a61c554102dac21971bd && bash k14l_run.sh
```

- INV dán dòng đó vào một **cửa sổ mới của ứng dụng Terminal của macOS**, theo 5 luật của runbook K14-L.
- INV chỉ dán khi dòng: bắt đầu bằng `cd '/var/folders/` (thư mục `mktemp -d` trên macOS) hoặc `cd '/tmp/`; có đúng SHA `eb8e7492…71bd` ở trên; kết thúc bằng `&& bash k14l_run.sh`.
- Sau đó: INV đọc, xóa màn hình (Cmd+K), đóng cửa sổ, chỉ báo "xong" hoặc loại lỗi. ORC xóa `⟨W⟩`.

Khối đã ghim:

```bash
# >>> k14-list-run
cd "$(dirname "$0")" || exit 1
test "$(shasum -a 256 k14l.sql | cut -d ' ' -f 1)" = c6607b5b118eb819ec03cd4ed0070f9c830eded6e5735fb09cb68c1e486ff5ee || { echo 'k14l.sql: SHA-256 mismatch - stop, report to SEC'; exit 1; }
{ printf '%s\n' 'SHOW default_transaction_read_only;' 'SELECT current_user;' 'SHOW statement_timeout;' 'SHOW lock_timeout;' 'SELECT r.rolbypassrls, r.rolsuper FROM pg_roles r WHERE r.rolname = current_user;'; cat k14l.sql; printf '%s\n' "SELECT '#END';"; } | \
ssh -i ~/.ssh/ottimo_ops -o BatchMode=yes ottimo-admin@desk.ottimo.vn 'cd / && sudo -n -u ottimo /opt/ottimo-prod/infra/server/bin/dc exec -T -e PGOPTIONS="-c default_transaction_read_only=on -c role=ottimo_readonly -c statement_timeout=30s -c lock_timeout=3s" postgres sh -c '\''psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tA'\'''
# <<< k14-list-run
```

---

## 7. Thẻ

### FB-R5-SEC-OPS-155-04
- Mức độ: Suggestion. Không chặn gộp, không chặn chạy K14-L r5.1. Làm ở lần **sau** phải sửa `k14-closer-change-list.sql` vì lý do khác (ví dụ thêm cột cơ sở), để không tốn thêm một lần ghim.
- Người nhận: OPS
- Vị trí: `k14-closer-change-list.sql`, lớp ký tự ở CTE `staff` (dòng 33 và 104); cột `live_rows` (l1) và `rows_not_closer` (l2).
- Vấn đề: hai cột này viết `tên:trạng thái`, nối bằng `+`. Một tên có `:` hay `+` đọc ra như hai dòng hoa hồng. Ở DB thử, tên `Hoa:earned+Tuan` hiện như hai người hưởng.
- Vì sao quan trọng: thấp. Luật V-01 của API không cho tên nhân viên có hai dấu này. Chỉ tên chủ cơ sở (bootstrap) hay dữ liệu nạp ngoài API mới có. Nhưng nếu có, OWN có thể đọc nhầm người hưởng của một đơn.
- Đề xuất sửa: thêm `:` và `+` vào cuối lớp ký tự ở cả hai CTE, viết bằng chữ ASCII như các ký tự khác. Thêm một ca tên có `:`/`+` vào lượt chạy thử.
- Trạng thái: Open

---

## 8. Trạng thái thẻ

| Thẻ | Trạng thái |
|---|---|
| FB-R5-SEC-OPS-155-01 (Minor, chép 5 luật kênh vào runbook) | **Done** @ `17c6d493`. Closed khi #155 gộp |
| FB-R5-SEC-OPS-155-02 (Suggestion, dòng CODEOWNERS) | Open, ở PR sau của OPS |
| FB-R5-SEC-OPS-155-03 (Major, 6 điều kiện tên trong K14-L) | **Done** @ `17c6d493`. Closed khi #155 gộp |
| FB-R5-SEC-OPS-155-04 (Suggestion, `:` và `+`) | Open (mới) |
| FB-R5-SEC-ARC-1I-02 | Phần OPS: K14 đếm và K14-L **Closed** khi #155 gộp. Phần ARC (một dòng ở 1.30 hoặc 0.3.14) còn mở |

## 9. Giới hạn

- SEC không xét bảng việc của INV (DOM 155-02), nhãn việc hay định nghĩa danh sách. Các phần đó thuộc DOM.
- SEC không chạy gì trên staging hay production, không SSH. SEC không approve hay gộp trên GitHub.
- Kết quả chạy thử là của DB thử của SEC.

---

## 10. Dòng decision-log đề xuất (ORC ghi)

`| 2026-11-07 | 5 | **SEC – ghim lại K14-L r5.1 (PR #155 @ 17c6d493): GHIM.** K14_PIN phần danh sách: k14-closer-change-list.sql c6607b5b…f5ee (154 dòng), khối k14-list-run eb8e7492…71bd; SEC tự trích và tính, trùng số OPS/ORC. K14 đếm không đổi (536ecbad…1275, 9c109725…8d00, từng byte). Khối chỉ khác r5 ở dòng 3; dòng 5 giống từng byte v530-run. Sáu điều kiện SEC 155-03 đạt: chỉ display_name theo tổ chức của đơn; lọc ký tự bằng đúng lớp SEC (viết bằng mã thoát ASCII), cắt 80; (đã thu hồi), none, unknown; câu đếm không đổi; khung READ ONLY + dòng gác + ROLLBACK; OPS chạy thử ca tên xấu đạt. SEC chạy thử trên DB dùng một lần: tên có ESC, CR, OSC, BEL, U+202E, xuống dòng kèm dòng l1 giả, C1, ký tự không rộng → 0 ký tự bị chặn trong đầu ra, l1 đủ 15 trường, l2 đủ 9, không dòng giả, tiếng Việt giữ nguyên; username, email, phone, lý do, số thẻ thử, old_value, UUID 0 lần; ottimo_app, ottimo_requeue → thoát mã 3; đổi một byte → dừng ở dòng 3. Bốn ghi chú OPS: mã thoát ASCII đồng ý; none/system đồng ý; không cột cơ sở đồng ý khi production một cơ sở (giả định (h)); : và + không lọc chấp nhận, thẻ 155-04 Suggestion cho lần sửa câu sau. Runbook K14-L chép đủ 5 luật kênh, câu đồng ý đúng. Lệnh trích K14-L: câu từ main, khối từ tệp SEC này; dòng lệnh cho INV có SHA khối eb8e7492…71bd. Sửa SEC-on-ops-pr-155-k14.md dòng 211: thay ký tự vô hình thật bằng mã thoát ASCII, cùng lớp; khối k14-run không đổi. Đóng 155-01, 155-03 và phần OPS của 1I-02 khi #155 gộp. Không ESC | SEC | rounds/round-05/reviews/SEC-on-ops-pr-155-k14l-r51.md |`
