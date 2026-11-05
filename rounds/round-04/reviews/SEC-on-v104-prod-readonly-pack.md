# SEC review – Gói câu hỏi chỉ đọc trên production trước v1.0.4 (QA4)

- Người review: SEC | Round 4, đợt v1.0.4, bước **Review** (điều kiện trước production v1.0.4) | 05/11/2026
- Đối tượng: `rounds/round-04/qa/v1.0.4-prod-readonly-pack.md` (chưa commit), bản QA4 có heredoc mục 2 SHA `05fa3451…`, ba khối chat SHA `12d6a5ab…`, `9b48e379…`, `c4037e06…`.
- Đọc thêm: mục 7–8 của gói; `SEC-on-v104-pr74-checkin-occupied.md` (thẻ FB-R4-SEC-QA-PR74-01); `outputs/BE/bug-r4-037-data-impact.md` (Q1, Q2, Q3, Q5a, Q5b và các điều kiện SEC 04/11); runbook v1.0.3 dòng 227–233 (`SQLRO`); runbook v1.0.4 mục 2, P2, P2e; `decision-log.md` dòng 1323 và 1417; `stay-occupancy.ts` (`inRoomOnSql`) và `02-roles.sh` tại `da6d6f3dc22b`.
- Giới hạn: không SSH, không chạm production hay staging, không commit. SEC chỉ chạy trên một container Postgres dùng một lần, không mạng, trên Mac (mục 6).

## 0. Kết luận

**ĐẠT CÓ ĐK.** SEC đã sửa gói trực tiếp (theo lời giao của ORC). Gói được chạy trên production khi đủ các điều kiện ở mục 9.

- **Chỉ đọc: đạt.** 4 khối của gói và Q2, Q5b của BE chỉ có `SHOW` và `SELECT`. Không có hàm ghi, khóa dòng hay hàm có tác dụng phụ. Mọi câu chạy trong giao dịch READ ONLY, bằng `ottimo_readonly`, có `statement_timeout=30s` và `lock_timeout=3s` (mục 1).
- **Số tiền và dữ liệu khách: đạt ở gói đếm.** Cột tiền chỉ nằm trong `WHERE`/`FILTER`. Khối mục 2 không in mã đơn, căn, tên hay số tiền (mục 2).
- **Đã sửa (4 chỗ trong SQL, chỉ ở khối mục 2):**
  - M1, M3d, M4c chỉ in dòng `TONG`; M1 bỏ số phút chồng. Lý do: với 10 căn, dòng theo ngày cộng số phút đủ để suy ra khách bị ảnh hưởng (mục 3).
  - Bỏ M4d (mục 5).
  - SHA mới của heredoc mục 2: `8c85549a…`. Ba khối chat, Q2 và Q5b không đổi.
- **Đã sửa (luật chạy):**
  - khối chat cần thêm câu đồng ý của INV, vì INV 05/11 chỉ cho "chỉ đếm" (mục 4);
  - chạy từ tệp trích ra từ commit và so 12 SHA, không dán tay (mục 6);
  - không chép giá trị trong dòng lỗi; không đưa mã đơn cho subagent.
- **SEC chốt trước luật ESC cho M1** (mục 3.3), để ORC không phải chờ SEC giữa lúc chạy.
- SEC **miễn** lượt chạy trên staging mà thẻ PR74-01 ý 1 có nhắc: staging chỉ có dữ liệu thử, không có khách thật.
- Không có ESC mới lúc này. ESC chỉ tạo khi có kết quả, theo mục 3.3.

## 1. Câu 1 – Mỗi câu có chỉ đọc thật không

| Khối | Câu | Ghi/khóa/tác dụng phụ | Ghi chú |
|---|---|---|---|
| Chốt phiên (cả 4 khối) | 4 `SHOW`, 1 `SELECT` trên `pg_roles` | Không | Giống hệt nhau ở 4 heredoc (cùng băm 5 dòng) |
| M1, CHAT-M1 | 1 câu `WITH … SELECT` | Không | CTE của hai khối giống từng chữ (đã `diff`). `generate_series` mỗi ngày nghiệp vụ của mỗi lượt: production 10 căn từ 26/10, vài trăm dòng |
| M2, M2b | `SELECT` | Không | Điều kiện M2 đúng từng chữ `inRoomOnSql` tại `da6d6f3dc22b`, với `${day}` = `b.today` |
| M3a | CTE `hit` + `SELECT` đếm | Không | CTE `hit` trùng từng chữ Q1 của BE (đã `diff`); bỏ CTE `priced` và mọi cột tiền |
| M3b, M3c | `SELECT` | Không | Trùng từng chữ Q3, Q5a của BE (đã `diff`) |
| M3d, CHAT-M3d | `SELECT` + câu con trên `audit_event`, `payment` | Không | Chỉ đọc khóa `totalRoomVnd` của `after`, chỉ dòng `reservation.priced` |
| M4a, M4b | `SELECT count` | Không | Trùng từng chữ P2, P2e của runbook v1.0.4, trừ 2 dòng chốt phiên (đã `diff`) |
| M4c, CHAT-M4c | `SELECT` | Không | |

- Quét cả 4 heredoc theo danh sách từ khóa ghi và hàm nguy hiểm (`INSERT`, `UPDATE`, `DELETE`, `MERGE`, `TRUNCATE`, DDL, `GRANT`, `COPY`, `LOCK`, `SET`, `RESET`, `BEGIN`, `SESSION AUTHORIZATION`, `FOR UPDATE/SHARE`, `nextval`, `setval`, `set_config`, `pg_advisory_*`, `dblink`, `lo_*`, `pg_sleep`, `pg_read_*`, `pg_terminate_*`, `INTO`…): **0 dòng khớp**.
- Hàm dùng: `count`, `sum`, `min`, `max`, `bool_or`, `bool_and`, `string_agg`, `grouping`, `to_char`, `extract`, `greatest`, `least`, `generate_series`, `jsonb_typeof`, `jsonb_array_elements`, `COALESCE`, `now()`. Không hàm nào ghi.
- Khóa: `SELECT` chỉ lấy `AccessShareLock`, chỉ xung đột với `ACCESS EXCLUSIVE` (migration, DDL). Có `lock_timeout=3s`, và luật 1 cấm chạy khi `deploy.sh`/migrate đang chạy.
- Thời gian: `statement_timeout=30s` áp cho từng câu. QA4 đo 23 ms cho cả gói trên dữ liệu thử.
- Bốn lớp chặn ghi:
  - nội dung heredoc chỉ có `SELECT`, được khóa bằng SHA (mục 6);
  - `default_transaction_read_only=on`;
  - vai `ottimo_readonly` chỉ có `SELECT`, không có `TEMPORARY`;
  - `ON_ERROR_STOP=1`.
- `-c role=` không phải ranh giới bảo mật (P404R1-S1). Vì vậy SHA của nội dung là lớp chính. Năm dòng chốt phiên chỉ kiểm lại sau khi chạy.
- Dòng `ssh` của 4 khối giống hệt nhau, và trùng từng ký tự dòng 256 của tệp BE (đã `cmp`).

## 2. Câu 2 – Có lộ dữ liệu cá nhân hay doanh thu không

**Khối mục 2 (gói đếm), sau khi SEC sửa: không lộ.** Các cột in ra chỉ gồm:
- số đếm;
- nhãn nhóm: kênh, `payment_model`, nguồn giá trong bản chụp, trạng thái đêm, trạng thái yêu cầu, tên khóa tham số;
- tháng của đêm (M3a, M3c, đã được SEC chấp nhận 04/11).

**Cột tiền chỉ nằm trong `WHERE`/`FILTER`/`EXISTS`**, không in ra (SEC đã đọc từng câu):
- `reservation.total_room_vnd` (M3d);
- `audit_event.after ->> 'totalRoomVnd'` (M3d, CHAT-M3d), chỉ so `= 0`;
- `payment.amount_vnd` (M3d, CHAT-M3d), chỉ trong `EXISTS … > 0`;
- `stay_night.room_revenue_gross_vnd` (M3a, M3b, M3c);
- `minibar_check.total_vnd` (M4c, CHAT-M4c).

**Định danh chỉ dùng bên trong câu:**
- `booker_guest_id`: chỉ so bằng.
- `checkin_room_override_by`: chỉ `IS NOT NULL`.
- `created_by`, `checked_by`: chỉ để tra vai.
- `r.id`: chỉ để nối bảng.

**Một đường rò còn lại: dòng lỗi.**
- Lỗi ép kiểu in nguyên giá trị, ví dụ `invalid input syntax for type bigint: "…"`.
- Ở M3d và CHAT-M3d, giá trị đó là `totalRoomVnd`, tức số tiền.
- Đã thêm vào luật 4: báo lỗi chỉ ghi mục và loại lỗi, không chép phần giá trị vào repo hay lời giao việc.

**Số kinh doanh.** M2 `so_can_co_luot_dang_o` (số căn có khách hôm nay) và M3b `so_dem` (số đêm OTA/Nội bộ theo nhóm) là số đếm, không phải doanh thu. Theo luật 04/11 các số này được ghi repo. SEC giữ.

## 3. Câu 3 – Dòng theo ngày và số phút của M1

### 3.1 Quyết định: repo chỉ ghi dòng `TONG`, không ghi số phút

- **Đối chiếu ngược ra khách được.**
  - OTTIMO có 10 căn, và repo công khai đã nêu tên, địa điểm, quy mô.
  - Một dòng "ngày X: 1 ca (b), chồng 60 phút" thu hẹp xuống một hoặc hai lượt ở.
  - Người biết ai ở OTTIMO ngày đó (người thân, đồng nghiệp, chính khách đó) suy ra được người đó dính vào một lần nhận phòng vào căn còn người. Đó là thông tin về một người cụ thể gắn với một sự cố an ninh.
- **Lộ mức nặng của một sự cố có thể phải thông báo.**
  - Số phút chồng cho biết khách lạ có thể đã ở chung phòng bao lâu.
  - Có báo cơ quan chức năng hay báo khách không, và báo thế nào, là quyết định của INV và luật sư. Nghị định 13/2023 Điều 23 đặt thời hạn ngắn; Luật 91/2025 cần luật sư xác nhận.
  - Đưa chi tiết lên repo công khai trước khi INV quyết là đi trước quyết định đó.
- **Repo không cần các số này.**
  - Mọi ngưỡng xử lý (`so_ca`, `ca_tu_ngay_d`, `ca_dang_chong_luc_chay`) đều nằm ở dòng `TONG`.
  - Ngày và số phút từng ca đã có ở CHAT-M1 cho INV.
- **"Số lượng và ngày" ở decision-log 1323** được hiểu là: số đếm, ngày giờ chạy, và cột tách trước/sau ngày D (`ca_tu_ngay_d`). Không phải ngày của từng ca.

### 3.2 Áp cùng luật cho M3d và M4c, và làm ngay trong SQL

- **M3d theo ngày** là lịch ở miễn phí của người nhà, nhân viên, đối chiếu được với người cụ thể. **M4c theo ngày** gắn một lần đảo tiền minibar với một ngày và một căn. Repo không cần cả hai. Dữ liệu thật đã tách bằng `tao_0d_tu_ngay_d` và cột mới `ve_0_tu_ngay_d`.
- **SEC sửa ngay trong SQL, không để người chạy tự lọc.** Câu cuối của M1, M3d, M4c chỉ in một dòng `TONG`. Vì vậy cả khối mục 2 ghi nguyên vào repo được, không phụ thuộc người chạy nhớ bỏ dòng nào.
- **Tương đương đã chứng minh** (mục 6): dòng mới bằng đúng dòng `TONG` cũ, bỏ cột phút (M1), hoặc thêm `ve_0_tu_ngay_d` (M4c).

### 3.3 Luật ESC cho M1 (SEC chốt trước)

| Kết quả | Việc |
|---|---|
| `so_ca` = 0 | Ghi decision-log, đóng thẻ PR74-01 |
| `so_ca` ≥ 1, `ca_tu_ngay_d` = 0 | Mọi ca thuộc dữ liệu trước ngày D. INV xác nhận trong chat (sau CHAT-M1) là đơn thử, không có khách thật, thì **không ESC**: ghi decision-log số ca và "INV xác nhận đơn thử", đóng thẻ. INV nói có khách thật thì như dòng dưới |
| `ca_tu_ngay_d` ≥ 1 | Trừ các ca INV xác nhận **cùng người ở** (ca `ca_b_cung_nguoi_dat`, cách làm tạm cho BUG-R4-038), **SEC tạo ESC mức Gấp**: pháp lý, dữ liệu cá nhân khách thật, thời hạn thông báo có thể ngắn. Phương án: liên hệ khách hay không; coi là sự cố dữ liệu cá nhân hay không (luật sư xác nhận) |
| `ca_dang_chong_luc_chay` ≥ 1 | Khẩn, xử lý trên Desk ngay (mục 3.1 của gói), không chờ ESC |

- `ca_b_cung_nguoi_dat` vẫn là ca. Cùng người đặt chưa chắc cùng người ở, ví dụ công ty đặt hai phòng cho hai người.
- ORC gọi SEC tạo ESC thì chỉ gửi dòng `TONG` và số ca INV đã xác nhận. Không gửi mã đơn, căn, ngày từng ca.

## 4. Câu 4 – Ba khối "CHỈ GỬI CHỦ ĐẦU TƯ TRONG CHAT"

### 4.1 Cổng: đúng nhưng chưa đủ

- Cổng số đếm (≥ 1) hợp lý: không có ca thì không in gì.
- **Nhưng INV 05/11 cho "chỉ đếm, không sửa"** (decision-log 1417). In mã đơn khách là đọc dữ liệu ngoài phạm vi đó. Phê duyệt của SEC là phê duyệt kỹ thuật, không thay được sự cho phép của INV.
- Vì vậy thêm điều kiện thứ hai cho cả ba khối, và cho Q2, Q5b của BE: **INV trả lời đồng ý trong chat**, sau khi ORC báo tên khối và số đếm.
- Kết quả cũng gửi cho INV, nên hỏi trước tốn một câu, không làm chậm việc.
- Ca `ca_dang_chong_luc_chay` ≥ 1: ORC hỏi INV ngay.

### 4.2 Nội dung: giữ nguyên, không cần cắt

| Khối | Cột | Quyết | Lý do |
|---|---|---|---|
| Cả ba | `ma_don` (`OTM-xxxxx`) | Giữ | Cần để mở trong Desk. Mã nội bộ, không đăng nhập được bằng mã (web khách dùng token và mã xác minh riêng) |
| CHAT-M1 | `ngay`, `nhom`, `ngoai_le_luc_nhan`, `phut_chong`, `dang_chong`, `cung_nguoi_dat`, `trang_thai_don` | Giữ | Đúng thứ INV cần để quyết: ca nặng hay nhẹ, có còn đang chồng, có thể là cùng người |
| CHAT-M1 | `can` | Giữ | Để lễ tân, buồng phòng kiểm tại chỗ. Với người có Desk thì không thêm gì so với mã đơn. Tin nhắn chỉ ở chat với INV |
| CHAT-M1 | `ma_don_o_cung_can` | Giữ | Khách kia cũng là người bị ảnh hưởng (phòng của họ bị mở) |
| CHAT-M3d | `van_0d`, `co_sua_gia`, `co_thu_tien`, `vai_nguoi_tao` | Giữ | Chỉ là cờ và vai, không id hay tên. Vai giúp tách đơn thử của INV với đơn của lễ tân. Cùng loại `vai_nguoi_tao` của Q5b đã duyệt 04/11 |
| CHAT-M4c | `can_cua_tu`, `lan_truoc`, `lan_thay`, `phut_giua_hai_lan`, `vai_nguoi_dem_lai` | Giữ | Cần để xác nhận khách có dùng minibar không. Không in số tiền |

- **Lưu ý về `vai_nguoi_dem_lai`.** Đội nhỏ thì vai gần như chỉ ra một người, mà cột gắn với một lần có thể đảo tiền. Đó là dữ liệu về nhân viên.
  - Chỉ INV (chủ, bên sử dụng lao động) được xem, trong chat.
  - Không đưa vào sổ giao ca hay nhóm chat chung.
  - Chưa được coi là bằng chứng sai phạm, vì luật 3.10 của gói đã nêu lễ tân sửa đúng cũng ra cùng dấu vết.
- **Q2 của BE có in số tiền** (`gia_tung_dem`, `tien_dang_ghi_vnd`, `ota_chenh_uoc_tinh_vnd`). Đã được SEC chấp nhận 04/11 chỉ trong chat. Giữ, áp cùng luật.

### 4.3 Nơi kết quả được đi qua

Kết quả các khối chat chỉ in ra màn hình của phiên ORC rồi gửi INV:
- không `tee`, không ghi tệp, kể cả scratchpad;
- không đưa vào lời giao việc cho subagent (DOM, QA, SEC…), vì subagent ghi được vào repo;
- việc từng đơn do INV/MGR làm trên Desk.

Rủi ro còn lại, chấp nhận: bản ghi phiên Claude Code của ORC nằm trên Mac của INV (ngoài repo), như mọi tin chat khác.

## 5. Câu 5 – Mục ngoài phạm vi giao

| Mục | Quyết | Lý do |
|---|---|---|
| M4a (P2), M4b (P2e) | **Giữ** | Chép nguyên runbook, chỉ đếm, không đọc `value`. Là điều kiện vào Release, đọc sớm thì biết sớm (P2e lệch thì phải dừng). Ngày phát hành vẫn chạy P2/P2e như runbook |
| M4c | **Giữ, chỉ dòng `TONG`** | BUG-R4-035/042 là lỗi tiền P1 đã ở production từ v1.0.1. Bug list ghi "thấy dòng minibar bị đảo trên dữ liệu thật" thì nâng P0. Đó là "tác động dữ liệu", thuộc danh sách INV cho đếm. Chỉ đếm; tiền chỉ trong `FILTER` |
| CHAT-M4c | **Giữ**, với cổng hai điều kiện | Như 4.1, 4.2 |
| M4d | **Bỏ** | BUG-R4-043 là P2, không sai tiền, dời v1.0.5. Số mốc chỉ cần ngay trước lượt tính lại cờ ở v1.0.5. Không thuộc danh sách INV cho đếm. Câu in tổng đêm theo mọi kênh từ ngày mở cửa, là số kinh doanh không cần cho v1.0.4. Đưa vào runbook v1.0.5; repo khi đó chỉ ghi hai cột lệch cờ |

## 6. Câu 6 – Bảo đảm người chạy dán đúng bản đã duyệt

**SHA của QA4 đúng.** SEC cắt lại 4 heredoc từ tệp, ra đúng 4 giá trị QA4 ghi.

**Chỗ còn hở.** Luật cũ là "dán nguyên khối, kiểm SHA nếu chép qua công cụ khác". Người chạy là ORC, chạy lệnh qua công cụ Bash. Nếu ORC dán, hay gõ lại, một khối gần 400 dòng, thì:
- không có bước nào bắt buộc so SHA **trước** khi gửi lên;
- văn bản trong tệp đang làm việc có thể đã bị sửa sau khi SEC duyệt.

**Đã sửa (mục 2.1 của gói):**
- Trích các khối bằng `git show <commit>:…` từ **commit ORC đã commit bản đã duyệt**, cả gói lẫn tệp BE.
- So 12 SHA, gồm heredoc và cả khối có dòng `ssh`, **trước** khi chạy. Lệch một dòng thì không chạy khối đó.
- Chạy bằng `bash "$W/pack1.sh"`. Tệp chỉ chứa câu SQL, không chứa kết quả.

| Tệp | Khối | SHA-256 heredoc | SHA-256 cả khối |
|---|---|---|---|
| `pack1` | Mục 2 – gói đếm (bản SEC) | `8c85549ae1e3e0e852ef4596b7b0f25d799664dad2f2928dcb5da6857a610ad2` | `c48740db01390329b0b78386718944b75cc11b695b32ea4d27ee20ba01e3ceb9` |
| `pack2` | CHAT-M1 | `12d6a5ab26106031d8784345c953bc7ecc86aab3f7e6a17fe208da5707ec1b07` | `99998c1229b1fd9982793aaeee22f39dfe9b02f349be7751ad2f4e8cabf3eccb` |
| `pack3` | CHAT-M3d | `9b48e379f228c5b7b0bc670856b3a106c2c57cc14c70a6e08506f8acaa9d46ef` | `ccb1d075021d2bd62abd0835532f11970efd47c0dd22697cc727bc7005736578` |
| `pack4` | CHAT-M4c | `c4037e06fa8d7c06ff78dd49b20753fc050fd9f6731c216e60c5c00e83d37477` | `1d3ad7b02cbafed78ac51a84ce0c518bc12ee327d581c147ffb2deda17ba1e57` |
| `be1` | Q2 của BE | `fe89c9b4157d8ed998c0dce7baeefba492c816063e7b813ab2de0ffadcb3aed8` | `920cdeab972b07a6dbd09b6b09d34a29b0b83fdd7204ce11bd0085f91b1dc320` |
| `be4` | Q5b của BE | `5bd80973ea05be38ab260b88d76524717df281e0882568b244f7a5f1e57b7340` | `9bf667ad538b074af1556692c78bb1842260782e48d82cf15f8d220ca9f481e4` |

Bản QA4 cũ của khối mục 2 (`05fa3451…`) **không còn được chạy**.

**Bằng chứng SEC chạy lại (05/11, Mac, không chạm production hay staging):**
- Container dùng một lần `postgres@sha256:b0f9560a2de0…` (cùng digest production), `--network none`, mật khẩu sinh ngẫu nhiên không in ra. Schema 68 migration từ `git archive da6d6f3dc22b`, áp bằng `ottimo_owner`, rồi áp lại `02-roles.sh`. Chạy bằng `ottimo_readonly` với đúng bốn tham số `PGOPTIONS`.
- Bản cũ trên schema rỗng: ra đúng như mục 6 của gói.
- Bản mới trên schema rỗng: chốt phiên đúng; M1 `TONG|0|0|0|0|0|0|0|0|0|0`; M3d `TONG|0|0|0|0|0|0|0|0`; M4c `TONG|0|0|0|0`; các mục khác như cũ; `#END`; mã thoát 0.
- Ba khối chat, Q2, Q5b: không lỗi, không `permission denied`.
- Tương đương cũ – mới, trên DB tổng hợp riêng (không có dữ liệu thật):
  - M1: `TONG|4|2|3|1|1|1|1|3|1|240|2` → `TONG|4|2|3|1|1|1|1|3|1|2`;
  - M3d: giống nhau;
  - M4c: `TONG|3|2|2` → `TONG|3|2|2|1`.
- Cách chạy 2.1: trích ra đúng 12 SHA; `bash -n` đạt; chạy tệp khối với dòng `ssh` thay bằng `docker exec` ra cùng kết quả.
- Container đã xóa.

## 7. Thẻ feedback

### FB-R4-SEC-QA-ROPACK-01
- Mức độ: Major
- Vị trí: gói, mục 2, câu cuối của M1, M3d, M4c; mục 5 ("`TONG` + các dòng ngày"); mục 8 điểm 6
- Vấn đề: khối đếm in một dòng cho mỗi ngày có ca (M1, M3d, M4c), và M1 in `phut_chong_lon_nhat`. Mục 5 cho ORC dán các dòng đó vào repo công khai.
- Vì sao quan trọng:
  - Với 10 căn, ngày cộng số phút chồng đủ để người biết ai ở hôm đó suy ra một khách cụ thể dính vào lần nhận phòng vào căn còn người.
  - Nó cũng lộ mức nặng của một sự cố có thể phải thông báo, trước khi INV và luật sư quyết.
  - Dòng theo ngày của M3d, M4c không giúp quyết định gì trong repo.
- Đề xuất sửa: M1, M3d, M4c chỉ in dòng `TONG`; bỏ số phút; M4c thêm `ve_0_tu_ngay_d`. Ngày và số phút chỉ ở khối chat.
- Trạng thái: **Fixed** – SEC sửa trực tiếp theo lời giao của ORC (gói mục 9). QA4 ghi nhận ở tệp phản hồi của QA (`responses/QA-on-SEC-v104-prod-readonly-pack.md`).

### FB-R4-SEC-QA-ROPACK-02
- Mức độ: Major
- Vị trí: gói, luật 6, mục 4.1–4.4 (cổng)
- Vấn đề: cổng của khối chat chỉ là số đếm ≥ 1. INV 05/11 cho đọc production "chỉ đếm, không sửa". In mã đơn, căn, ngày ở của khách là đọc ngoài phạm vi đó.
- Vì sao quan trọng: SEC duyệt câu về kỹ thuật, không thay được sự cho phép của chủ dữ liệu. Chạy khối chat mà chưa hỏi là vượt quyền INV đã cho.
- Đề xuất sửa:
  - Cổng hai điều kiện: số đếm mở **và** INV đồng ý trong chat cho đúng khối đó (gồm Q2, Q5b).
  - Kết quả chỉ ra màn hình. Không `tee`, không ghi tệp, không đưa vào lời giao việc cho subagent.
- Trạng thái: **Fixed** – SEC sửa trong gói (luật 6, mục 4).

### FB-R4-SEC-QA-ROPACK-03
- Mức độ: Minor
- Vị trí: gói, luật 2, mục 2 (SHA)
- Vấn đề: luật cũ là dán nguyên khối, chỉ kiểm SHA "nếu chép qua công cụ khác". Không có bước bắt buộc so SHA trước khi gửi lên, và không ghim vào commit đã duyệt. Dòng `ssh` không có SHA.
- Vì sao quan trọng: `-c role=` không phải ranh giới (P404R1-S1). Lớp chính là văn bản đã duyệt. Một khối gần 400 dòng gõ lại hay dán lệch thì không ai biết.
- Đề xuất sửa: mục 2.1, gồm trích từ commit, so 12 SHA (heredoc + cả khối), rồi chạy bằng `bash`.
- Trạng thái: **Fixed** – SEC thêm mục 2.1, đã thử cách trích và chạy.

### FB-R4-SEC-QA-ROPACK-04
- Mức độ: Minor
- Vị trí: gói, M4d (mục 2, 3.11)
- Vấn đề: M4d ngoài danh sách INV cho đếm, không phải tác động của lỗi sai tiền, và chỉ cần cho v1.0.5. Câu còn in tổng đêm theo mọi kênh từ ngày mở cửa.
- Vì sao quan trọng: nguyên tắc tối thiểu dữ liệu; giữ đúng phạm vi INV cho phép.
- Đề xuất sửa: bỏ khỏi gói. OPS/QA đưa vào runbook v1.0.5 ngay trước lượt tính lại cờ; repo khi đó chỉ ghi hai cột lệch cờ; SEC duyệt lại.
- Trạng thái: **Fixed** (bỏ khỏi gói). Phần runbook v1.0.5 giao OPS (thẻ 06).

### FB-R4-SEC-QA-ROPACK-05
- Mức độ: Minor
- Vị trí: gói, luật 4; M3d và CHAT-M3d `(e.after ->> 'totalRoomVnd')::bigint`
- Vấn đề: lỗi ép kiểu của Postgres in nguyên giá trị trong ngoặc kép. Luật cũ "có lỗi thì báo QA" có thể khiến số tiền vào bug list hay lời giao việc.
- Vì sao quan trọng: repo công khai không được có số tiền.
- Đề xuất sửa: báo lỗi chỉ ghi mục `#M…` và loại lỗi, không chép phần giá trị.
- Trạng thái: **Fixed** – SEC thêm vào luật 4.

### FB-R4-SEC-OPS-ROPACK-06
- Mức độ: Suggestion (v1.0.5)
- Vị trí: runbook v1.0.5 (chưa có)
- Vấn đề: mốc "trước" của BUG-R4-043 (M4d cũ) cần chạy ngay trước lượt tính lại cờ ở v1.0.5.
- Vì sao quan trọng: thiếu mốc thì không đo được lượt tính lại cờ đã sửa bao nhiêu đêm.
- Đề xuất sửa:
  - OPS thêm bước chỉ đọc vào runbook v1.0.5, dùng câu M4d cũ (bản QA4, `05fa3451…`, mục 2).
  - Repo chỉ ghi `co_mien_phi_ma_co_tien` và `khong_co_mien_phi_ma_0d`, không ghi `dem_con_hieu_luc` theo kênh.
  - SEC duyệt.
- Trạng thái: Open

## 8. Quy tắc ghi kết quả vào repo

| Được ghi repo (gói mục 5, decision-log, ESC, round-summary) | Chỉ gửi INV trong chat | Không ở đâu cả |
|---|---|---|
| Nguyên các dòng của khối `pack1` (mục 2): chốt phiên, M1–M4c. Sau khi SEC sửa, tất cả là số đếm, nhãn nhóm, tháng của đêm | Mọi dòng kết quả của `pack2`–`pack4`, `be1` (Q2), `be4` (Q5b) | Kết quả khối chat trong tệp (kể cả scratchpad, `tee`), commit, ESC, decision-log, Google Chat, ảnh chụp, sổ giao ca (trừ khi MGR sửa từng đơn) |
| Ngày giờ chạy, commit đã trích, "12 SHA đúng" | Mã đơn, số căn, ngày từng ca, số phút, vai người tạo/đếm, số tiền (Q2) | Mã đơn, căn, ngày từng ca trong lời giao việc cho subagent |
| Tên khối chat đã chạy, số dòng, lúc INV đồng ý | Phần giá trị trong dòng lỗi (nếu INV cần) | Phần giá trị trong dòng lỗi, ở repo hay lời giao việc |
| Số ca INV/MGR đã xác nhận: M1 cùng người ở hoặc đơn thử; M3d cố ý 0 đ; M4c khách không dùng. Chỉ số | | |
| Q2, Q5b: số đơn theo từng `duong_sua` (SEC 04/11, 3 (d) và Q5 (e)) | | |
| ESC (nếu có): chỉ dòng `TONG` của M1 và các số đếm ở trên | Chi tiết từng ca cho quyết định của INV | |

## 9. Điều kiện trước khi chạy trên production

1. **ĐK1 – commit rồi chạy từ commit.** ORC commit gói (bản SEC sửa) cùng tệp review này. Chạy theo mục 2.1 từ đúng commit đó. 12 SHA phải trùng bảng mục 6. Lệch thì không chạy khối đó, báo SEC.
2. **ĐK2 – thời điểm.** Không chạy khi `deploy.sh` hoặc migrate đang chạy, ở cả production và staging.
3. **ĐK3 – khối chat.** Chỉ chạy khi cổng số đếm mở **và** INV đồng ý trong chat (mục 4.1). Kết quả theo mục 4.3.
4. **ĐK4 – ghi kết quả.** Theo bảng mục 8. Năm dòng chốt phiên khác `on`, `ottimo_readonly`, `30s`, `3s`, `t|f` thì dừng, không đọc tiếp (luật 3).
5. **ĐK5 – sau M1.** Làm theo bảng 3.3. Gọi SEC tạo ESC thì chỉ gửi dòng `TONG` và số ca đã xác nhận.
6. QA4 chạy lại `pack1` mới trên bộ dữ liệu thử của mình: không bắt buộc, không chặn (gói mục 9).

## 10. Dòng decision-log đề xuất (ORC ghi)

```
| 2026-11-05 | 4 | **SEC – gói chỉ đọc trên production v1.0.4 (QA4) `qa/v1.0.4-prod-readonly-pack.md`: ĐẠT CÓ ĐK, SEC đã sửa gói.** Mọi câu chỉ `SHOW`/`SELECT` (quét 0 từ khóa ghi), READ ONLY + `ottimo_readonly` + `statement_timeout=30s`/`lock_timeout=3s`; cột tiền chỉ trong `WHERE`/`FILTER`. Sửa: M1, M3d, M4c chỉ in dòng `TONG` (10 căn: ngày + số phút của ca đối chiếu ngược ra khách được, và lộ mức nặng sự cố trước khi INV quyết), M1 bỏ số phút, M4c thêm `ve_0_tu_ngay_d`; bỏ M4d (ngoài phạm vi INV, sang runbook v1.0.5). Heredoc mục 2 `8c85549a…` (bản `05fa3451…` không chạy nữa); CHAT-M1 `12d6a5ab…`, CHAT-M3d `9b48e379…`, CHAT-M4c `c4037e06…`, Q2 `fe89c9b4…`, Q5b `5bd80973…`. **ĐK:** chạy từ commit theo mục 2.1, so 12 SHA trước khi chạy; khối chat (CHAT-M1/M3d/M4c, Q2, Q5b) cần thêm câu đồng ý của INV trong chat vì INV chỉ cho "chỉ đếm"; kết quả khối chat không ghi tệp, không đưa subagent; lỗi không chép giá trị. Repo chỉ ghi các dòng khối mục 2, số khối chat đã chạy, số ca đã xác nhận. ESC: `ca_tu_ngay_d` ≥ 1 (trừ ca INV xác nhận cùng người ở) → SEC tạo ESC Gấp; chỉ ca trước ngày D và INV xác nhận đơn thử → không ESC. Miễn lượt chạy staging của PR74-01 | SEC | `rounds/round-04/reviews/SEC-on-v104-prod-readonly-pack.md`; thẻ ROPACK-01..05 Fixed, 06 Open (v1.0.5) |
```

## 11. Điểm làm tốt

- Định nghĩa M1 chặt và có bằng chứng: QA4 dựng đủ 6 ca dương và 5 ca âm (lượt nối nhau, đổi căn B14, đơn con, `VD` hợp lệ, đơn hủy), chạy cả trên DB có dữ liệu thử lẫn DB rỗng. Phần giới hạn (mục 7) nói thẳng chỗ bỏ sót.
- Mọi câu "nguyên văn" là nguyên văn thật: SEC `diff` từng câu với Q1, Q3, Q5a, P2, P2e và `inRoomOnSql`, không lệch ký tự nào. M3a bỏ đúng các cột tiền.
- Dòng đánh dấu `#M…`, `#END`, SHA cho từng heredoc, và mục 8 "điểm cần SEC xem" làm review nhanh và kiểm được.

## Giả định

- "Chỉ đếm" trong câu INV 05/11 không gồm việc in mã đơn. Vì vậy cần thêm câu đồng ý cho từng khối chat. Nếu INV nói rõ là đã cho, ORC ghi decision-log; điều kiện vẫn giữ để có dấu vết từng lần.
- "Tác động dữ liệu" trong danh sách INV gồm tác động của các lỗi tiền đang ở production (037, 038, 046, 035/042), và các số đếm P2/P2e của runbook.
- Dữ liệu trước 02/11 là dữ liệu thử (INV 01/11: production chưa vận hành). Có ca M1 trước ngày D thì INV xác nhận lại.
- Bản ghi phiên Claude Code trên Mac của INV được coi như chat, không phải repo.
