# OPS – Ghi chú K14: truy vấn người chốt DOM 1H-01 (Round 5, 07/11/2026)

Việc: thẻ SEC FB-R5-SEC-ARC-1I-02 (phần OPS), cho DOM FB-R5-DOM-ARC-1H-01 và hợp đồng 0.3.13 mục 1.30 (#152). Chi tiết ở runbook `v1.0.5-release-runbook.md` bước **K14**.
- **r5 (Sản xuất):** câu đếm, câu danh sách, runbook K14.
- **r5.1 (Phản hồi & sửa):** theo DOM `DOM-on-ops-pr-155-k14.md` (DUYỆT CÓ ĐIỀU KIỆN) và SEC `SEC-on-ops-pr-155-k14.md` (ghim K14 đếm, K14-L chờ ghim lại). Câu đếm và khối `k14-run` không đổi byte nào.

## 1. Đã làm gì
- **Câu đếm** `k14-closer-change-counts.sql`, tệp riêng cạnh runbook. In 8 dòng đếm:
  - (a) đơn đổi người chốt sau nhận phòng, tách đang ở / đã trả phòng / trạng thái khác;
  - (b) đơn có dòng hoa hồng sống mà người hưởng khác người chốt, tách đã đạt / dự kiến / Desk tự sửa lúc trả phòng.
  - DOM duyệt nguyên trạng; **SEC đã ghim** (r5.1 không đổi).
- **Câu danh sách** `k14-closer-change-list.sql` (K14-L), **viết lại ở r5.1**:
  - in **tên hiển thị nhân viên** (DOM 155-01): người chốt lúc nhận phòng, người chốt đang ghi, người đổi cuối, người giữ dòng hoa hồng sống;
  - thêm cột loại đơn (`short` / `long`) và đơn chính / đơn con (DOM 155-03);
  - `l2` có nhãn mới `desk_fixes_when_earned` cho đơn đã trả phòng chỉ còn dòng `projected` lệch (DOM 155-03 ý 2). Câu đếm không đổi, nhóm này vẫn ngoài (b3);
  - tên lọc theo 6 điều kiện SEC 155-03: chỉ `display_name` của tổ chức có đơn; ký tự điều khiển, không rộng, đảo chiều và `|` thành `?`; cắt 80 ký tự; hậu tố `(đã thu hồi)`; `none` khi không có người;
  - lớp ký tự viết bằng mã thoát ASCII (`\x`, `\u`), để tệp ghim không chứa ký tự vô hình nào. OPS so với cách viết của SEC trên mọi mã Unicode: 0 mã khác.
  - Vẫn không có username, email, điện thoại, id, số tiền, tỷ lệ, lý do hay cột khách.
- **Runbook K14 (r5.1):**
  - "Cách đọc" thay bằng luật chung và bảng việc của DOM (155-02). Bỏ chữ "màn **Hoa hồng**";
  - phần K14-L: cột mới, cách đọc tên, 5 luật kênh của SEC 155-01, dòng lệnh tự kiểm SHA khối;
  - câu đồng ý K14-L: có tên hiển thị nhân viên, không có thông tin khách, tỷ lệ hay số tiền; ứng dụng Terminal của macOS, không phải tab trong ứng dụng Claude;
  - bảng 0.1: `K14_PIN` phần đếm điền hai số SEC ghim, phần danh sách chờ SEC ghim lại; `MERGE_154` = `fe70d0c0` (cha thứ hai `4e81c3be`);
  - mục 8: giả định (d), (e), (f) viết lại; thêm (h), (i).
- **Chạy thử** trên DB dùng một lần (r5 và r5.1): `postgres:17-alpine`, `--network none`, `02-roles.sh` thật, đủ 72 migration, dữ liệu giả có chuỗi đánh dấu. Kết quả r5.1, bằng chữ:
  - bộ ca DOM và 4 ca mới (đơn dài hạn, đơn con có id lạ, tên có `|`, đơn đã trả phòng chỉ còn `projected` lệch): **đạt**;
  - ca tên xấu của SEC (ESC, CR, U+202E, `|`, xuống dòng kèm dòng giả, BEL, C1, ký tự không rộng, U+2066, U+FEFF, U+2028, DEL, tên tiếng Việt dài hơn 100 ký tự): đầu ra không còn byte nào trong các lớp SEC chặn, số trường mỗi dòng đúng, không có dòng giả, chữ có dấu giữ nguyên, cắt đúng 80 ký tự: **đạt**;
  - không lộ username, email, điện thoại, lý do, bản chép giá, tên tổ chức và cơ sở, tỷ lệ, số tiền, uuid: **đạt**;
  - dòng gác dừng đúng (mã thoát 3); không dữ liệu chỉ ra `BEGIN`, `ROLLBACK`, `#END`; khối dừng ở dòng 3 khi câu đổi một byte: **đạt**.
  - Container và tệp tạm đã xóa. Không chép tên thử vào tệp nào.
- Không SSH, không chạy gì trên staging hay production.

## 2. Bản ghim

| Thứ | SHA-256 | Trạng thái |
|---|---|---|
| `k14-closer-change-counts.sql` (75 dòng, 4 954 byte) | `536ecbade9a84b15d5b6a3f78f851ea4afc3b77cbc6a9e0e1914a1b89b881275` | **SEC đã ghim**, không đổi |
| Khối `k14-run` (6 dòng, 861 byte) | `9c109725ef333676c2ec2941a0a952187afe6846a7f1929f25dc847f65d28d00` | **SEC đã ghim**, không đổi |
| `k14-closer-change-list.sql` r5.1 (154 dòng, 10 529 byte) | `c6607b5b118eb819ec03cd4ed0070f9c830eded6e5735fb09cb68c1e486ff5ee` | OPS đề xuất, chờ SEC ghim lại |
| Khối `k14-list-run` r5.1 (6 dòng, 874 byte) | `eb8e7492fff02fdcc6cbbdf979838fec307568588784a61c554102dac21971bd` | OPS đề xuất, chờ SEC ghim lại |

Bản danh sách r5 không dùng nữa: câu `84886b97…046d`, khối `131e3392…5ce5`. Các bản ghim cũ không đổi: `v525-run` `60872413…41eb`, `v530-run` `4f89c218…32ab`, `v530-check` `c13c4d68…0d71`.

## 3. Luật dữ liệu
- Câu đếm không chọn tên, username, id, mã đơn, ngày, số tiền, tỷ lệ, lý do hay cột khách. Chỉ tách theo trạng thái, không theo loại người hưởng hay theo người.
- Repo chỉ ghi `= 0` / `> 0`. Số chính xác ORC báo INV trong chat với INV, như K13.
- Danh sách K14-L có mã đơn và tên hiển thị nhân viên. Chỉ hiện trong ứng dụng Terminal của macOS trên Mac INV, theo 5 luật SEC. Không vào repo, PR, commit, chat, subagent, tệp hay log. ORC không chạy, không đọc, không hỏi tên.

## 4. Giả định (runbook mục 8, "Giả định K14")
- (a) Không lọc loại đơn, đúng chữ DOM; có thể đếm thừa. DOM đồng ý.
- (b) "Sau nhận phòng" = `changed_at ≥ actual_checkin_at`. DOM đồng ý.
- (c) Nhãn "Desk tự sửa lúc trả phòng" dựa vào `ensureCommission` của #154 @ `4e81c3be`, đúng bản đã gộp (`fe70d0c0`). DOM đồng ý.
- (d) K14-L có tên hiển thị nhân viên, vì Desk v1.0.5 chưa hiện người chốt và người hưởng cho chủ đầu tư (DOM 155-01). SEC chấp nhận, lọc ký tự theo SEC 155-03.
- (e) INV tự dán một dòng lệnh tự kiểm vào ứng dụng Terminal của macOS. SEC chấp nhận, kèm 5 luật.
- (f) Tệp SQL đặt cạnh runbook, bảo vệ bằng SHA. Dòng CODEOWNERS `/rounds/*/outputs/OPS/*.sql` ở PR sau (SEC 155-02).
- (g) Không thêm tên máy, IP hay bí mật mới.
- (h) Một cơ sở: K14-L không có cột cơ sở.
- (i) Dấu `:` và `+` trong tên không bị lọc; chỉ làm khó đọc cột dòng hoa hồng.

## 5. Việc chưa xong, người làm tiếp
- **SEC:** ghim lại K14-L (câu và khối r5.1) ở một tệp review mới, kèm lệnh trích K14-L và mẫu dòng lệnh có SHA thật.
- **DOM:** xem lại cột K14-L theo bảng việc của mình, nhất là `none` cho lần đổi do hệ thống (SEC 155-03 điều kiện 3) và `desk_fixes_when_earned`.
- **OPS:** dòng CODEOWNERS ở PR sau (SEC 155-02).
- **ARC:** một dòng ở 0.3.14 hoặc 1.30: "chạy theo khối runbook K14 đã ghim, như K13" (SEC 1I-02).
- **ORC:** chạy K14 đếm ngay sau K5 của lần Release có #154. K14-L chỉ khi SEC đã ghim lại và INV đồng ý riêng.

ESC mới: không.
