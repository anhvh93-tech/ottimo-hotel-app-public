# OPS review – SEC V5-74: runbook sự cố dữ liệu khách (SR-INC-01), nhánh B và việc đếm lượt mở link

- Người review: OPS | Round 5 (v1.0.5) – Review | Ngày: 07/11/2026
- Đối tượng: `product/docs/runbook-su-co-du-lieu-khach.md` bản 1.0, commit **`2f732f58`** (trên `main`). OPS xét:
  - mục 5 (nhánh B – lượt kéo sao lưu thoát mã 3);
  - mục 3, phần dấu hiệu của nhánh B;
  - việc phụ SEC đề nghị ở mục 4 bước 4: truy vấn chỉ đọc đếm số lần link đã thu hồi được mở.
  Nhánh A ở góc quầy là việc của DOM (`DOM-on-sec-v5-74.md`).
- Đối chiếu, tất cả trên `origin/main`:
  - `product/infra/server/bin/pull-backups.sh`;
  - `product/infra/server/README.md`, dòng "Bản sao lưu ngoài máy";
  - `product/docs/runbook-vps-moi.md` r2, khối "Nghi bị chiếm quyền" và mục 1, 2;
  - `product/docs/so-van-hanh.md` 1.1a;
  - `rounds/round-05/plan.md` V5-60;
  - schema `guest-portal.ts` và `audit.ts`, `guest-portal.service.ts` (`openSession`), `retention.service.ts` (J16), `02-roles.sh` (`ottimo_readonly`).
- Không có dữ liệu khách, IP hay số liệu production. Không đăng nhập máy chủ.

## 0. Kết luận

**ĐẠT CÓ ĐIỀU KIỆN.** Nhánh B mô tả đúng hành vi của `pull-backups.sh` và dòng README (bảng mục 1). Cách khoanh vùng ở bước 2 đúng. Bước 4 trỏ đúng khối "Nghi bị chiếm quyền" của `runbook-vps-moi.md`: khối đó có, và nói đúng ba việc runbook này dẫn.

**Điều kiện (thẻ 01, Major):** bước 3 ý 1, "loại trừ bản trên Mac hỏng trước", phải so bản trên máy chủ với `.sha256` **trên Mac**, không với `.sha256` trên máy chủ. Bước này còn phải nói rõ cách lấy bản trên máy chủ mà không đăng nhập. Chữ hiện nay chép từ README của OPS, nên lỗi gốc ở phía OPS. OPS sửa README cùng lượt với SEC, để hai nơi dùng chung một câu.

Ba thẻ còn lại (02, 03, 04 Minor) và một Suggestion (05) không chặn. Không ESC.

**Việc phụ:** truy vấn đếm số lần mở link **làm được, nhỏ**. Ước tính OPS khoảng nửa ngày, cộng một lượt SEC ghim. Không cần migration, không đổi API, không tốn tiền (mục 3). Chưa làm.

## 1. Nhánh B so với script và README

| Câu trong runbook mục 5 | `pull-backups.sh` / README | Kết quả |
|---|---|---|
| So nội dung từng bản đã có trên Mac với tệp cùng tên trên máy chủ | Bước 1: `rsync -rtn --checksum --itemize-changes`, chỉ `*.age` và `*.age.sha256`; tệp mới (`>f+++`) không tính | Đúng. Tệp máy chủ đã xóa (theo hạn 35 ngày) không bị báo, vì không có `--delete`. Đây là đúng thiết kế |
| Máy chủ không bao giờ viết lại một bản sao lưu đã xong | Chú thích script: `backup.sh` đặt tên theo giây UTC, chuyển vào chỗ khi xong | Đúng |
| In `WARNING: server copy changed: <tên> – local copy kept`, vẫn kéo và kiểm tệp mới, giữ nguyên bản trên Mac, rồi thoát 3 | Bước 2 kéo bằng `--ignore-existing`. Bước 3 kiểm **mọi** `.sha256` trên Mac, không chỉ tệp mới. Rồi in WARNING và `rc=3` | Đúng. Chính xác hơn: "kiểm lại mọi tệp trên Mac" |
| Mã 3 che mã 1: có thể có dòng `checksum mismatch` cùng lúc | `rc=$bad`, rồi `rc=3` khi có tệp bị báo | Đúng |
| (không nói) | `.last_pull` chỉ ghi khi thoát 0. Bước 4 của script **xóa bản trên Mac quá 35 ngày ở mọi lượt chạy**, kể cả lượt thoát 3 | Thiếu. Xem thẻ 02 |
| Bước 3 ý 1: "so tay với `.sha256` trên máy chủ (README `infra/server`, dòng Bản sao lưu ngoài máy)" | README: "so tay với `.sha256` trên máy chủ trước khi kết luận" | Khớp chữ README, nhưng cả hai chưa đúng. Xem thẻ 01 |
| Bước 3 ý 2: Mac khớp `.sha256` của nó mà máy chủ khác → coi như bị xâm nhập, mức Cao, đồng hồ tính từ giờ lượt kéo | Mac không thể bị máy chủ ghi đè (`--ignore-existing`), nên bản Mac khớp băm là bản tin được | Đúng |
| Bước 4: dựng lại theo `runbook-vps-moi.md`, khối "Nghi bị chiếm quyền": SEC chọn bản trên Mac trước lúc nghi bị vào; xoay KEK và `id_hash_key`; bí mật tích hợp mới | `runbook-vps-moi.md` dòng 15–19: đủ ba ý, kèm "không dùng lại khóa SSH, token, `.env` hay bản sao lưu chưa so băm" | Đúng. Phần "Dùng khi" của runbook VPS mới chưa có ca máy còn chạy. Xem thẻ 04 |
| "Coi mọi dữ liệu trên máy chủ, kể cả ảnh giấy tờ, là có thể đã lộ, vì khóa giải mã nằm cùng máy" | `runbook-vps-moi.md` dòng 15: "KEK và `id_hash_key` cũ nằm trên máy bị chiếm" | Đúng. Riêng bản sao lưu `.age` thì khóa riêng `age` không ở máy chủ, nhưng DB đang chạy và KEK thì có |

## 2. Thẻ feedback

### FB-R5-OPS-SEC-V574-01
- Mức độ: Major
- Vị trí: runbook mục 5 bước 3 ý 1. Cùng câu ở `product/infra/server/README.md`, dòng "Bản sao lưu ngoài máy" (câu của OPS).
- Vấn đề:
  - **So với băm nào.** Bước này so bản trên máy chủ với `.sha256` trên máy chủ. Nhưng người đã sửa `X.age` trên máy chủ cũng sửa được `X.age.sha256` cho khớp. Khi đó hai tệp máy chủ khớp nhau, và việc so không chứng minh gì.
    - Ca dẫn tới kết luận sai: bản trên Mac tình cờ hỏng (Mac báo `checksum mismatch`) đúng lúc máy chủ bị sửa. Bước 3 ý 1 sẽ xếp mức Thấp ("bản Mac hỏng, máy chủ khớp"), dù `X.age.sha256` cũng có trong danh sách WARNING.
    - Băm tin được là `.sha256` **trên Mac**: máy chủ không ghi đè được nó (`--ignore-existing`). Chỉ trừ khi chính tệp `.sha256` đó nằm trong danh sách bị báo.
  - **Làm cách nào.** Khóa kéo chỉ có `rrsync -ro`, không có shell, nên không "so tay" trên máy chủ được. Cách còn lại là đăng nhập bằng tài khoản quản trị. Nhưng cách đó trái bước 2 ("không đăng nhập máy chủ tới khi SEC báo"). Nó còn tin vào `sha256sum` của một máy có thể đã bị chiếm.
- Vì sao quan trọng: bước này quyết mức Thấp (không báo cơ quan chức năng) hay mức Cao (dựng lại máy, mặc định chuẩn bị báo). Một cách kiểm mà máy bị chiếm làm giả được thì không dùng làm căn cứ được. Lý do lại sẽ nằm trong decision-log.
- Đề xuất sửa (SEC sửa runbook, OPS sửa README cùng câu):
  1. Lấy bản trên máy chủ của đúng các tệp bị báo bằng **khóa kéo chỉ đọc** (cùng lệnh `rsync` của script, thêm `--include` đúng tên). Kéo vào một thư mục **mới, trống, ngoài** thư mục sao lưu. Không đăng nhập máy chủ.
  2. Tính băm trên Mac. So với `.sha256` **trên Mac** của tệp đó, chỉ khi `.sha256` không nằm trong danh sách WARNING.
  3. Kết luận:
     - bản máy chủ khớp `.sha256` trên Mac, và bản Mac không khớp → bản Mac hỏng, mức Thấp, xử lý theo thẻ 03;
     - chỉ `.sha256` bị báo (`.age` không bị báo), và bản `.age` trên Mac khớp `.sha256` vừa lấy từ máy chủ → `.sha256` trên Mac hỏng, mức Thấp;
     - mọi ca khác (cả hai `.age` và `.sha256` đều bị báo, hoặc không khớp bên nào) → mức Cao.
  4. Xong thì để nguyên thư mục tạm, cho SEC xem. Không chép vào thư mục sao lưu.

  OPS soạn sẵn dòng lệnh cho bước 1 (chỉ in mã thoát và 8 ký tự băm) trong README, để ORC chạy trong câu đồng ý của OWN.
- Trạng thái: Open

### FB-R5-OPS-SEC-V574-02
- Mức độ: Minor
- Vị trí: mục 5 bước 2, câu "Không kéo lại".
- Vấn đề: câu đúng, nhưng thiếu lý do. Thiếu lý do thì dễ bị bỏ qua khi có người muốn "kéo lại cho chắc". Mỗi lượt chạy `pull-backups.sh` làm hai việc:
  - kéo thêm tệp mới từ máy chủ đang bị nghi;
  - xóa bản trên Mac có `<stamp>` quá 35 ngày (bước 4 của script, chạy cả ở lượt thoát 3). Bản bị xóa có thể đúng là bản sạch trước lúc bị vào, mà SEC cần ở bước 4.

  Thêm hai điều:
  - V5-60 sẽ cài lịch kéo bằng launchd trên máy INV (chờ INV đồng ý). Khi có lịch, "không kéo lại" nghĩa là **tắt lịch trước**;
  - các tệp kéo về **trong chính lượt thoát 3** cũng đến từ máy bị nghi. `.last_pull` vẫn ghi giờ của lượt thoát 0 gần nhất.
- Vì sao quan trọng: giữ được bản sạch cuối cùng trên Mac là điều kiện để dựng lại máy.
- Đề xuất sửa: bước 2 thêm một câu: "Không chạy lại `pull-backups.sh`, kể cả lịch tự động (V5-60): mỗi lượt chạy kéo thêm từ máy chủ và xóa bản trên Mac quá 35 ngày. Tệp kéo về trong lượt mã 3 không dùng để dựng lại". OPS thêm lệnh tắt lịch (`launchctl bootout …`) vào README khi V5-60 làm xong, và báo SEC để thêm vào đây.
- Trạng thái: Open

### FB-R5-OPS-SEC-V574-03
- Mức độ: Minor
- Vị trí: mục 5 bước 3 ý 1, "xử lý như mã 1".
- Vấn đề: chưa tài liệu nào nói "xử lý mã 1" là làm gì. README chỉ liệt kê mã thoát. Script không bao giờ thay tệp đã có trên Mac (`--ignore-existing`), nên tệp hỏng nằm nguyên đó mãi. Lượt kéo sau vẫn thoát 1, và `.last_pull` không bao giờ được ghi lại.
- Vì sao quan trọng: người làm theo runbook sẽ dừng ở chỗ này. Nếu tự xóa tệp hỏng, họ lại phạm câu "không xóa thư mục sao lưu" của bước 2.
- Đề xuất sửa:
  - OPS viết cách xử lý mã 1 vào README, dòng "Bản sao lưu ngoài máy": chuyển tệp hỏng và `.sha256` của nó vào thư mục con `quarantine/` (vẫn trên Mac, không xóa, script không đụng tới), rồi kéo lại. Lượt kéo sẽ lấy bản máy chủ cho tên đó và kiểm băm. SEC quyết khi nào xóa `quarantine/` (hạn 35 ngày SR-BAK-03).
  - Runbook trỏ tới dòng đó.
- Trạng thái: Open

### FB-R5-OPS-SEC-V574-04
- Mức độ: Minor
- Vị trí: mục 5 bước 4. `runbook-vps-moi.md`, dòng "Dùng khi" (tài liệu của OPS).
- Vấn đề:
  - "Dùng khi" của runbook VPS mới chỉ nói tới VPS mất hẳn ("bị chiếm quyền rồi bị xóa"). Nhánh B mức Cao lại là máy **còn chạy**.
  - Hai runbook đều chưa nói làm gì với máy cũ: tắt lúc nào, giữ bao lâu, ai hủy thuê.
  - Trong lúc dựng máy mới, hai máy cùng tồn tại, nên tốn thêm tiền thuê.
- Vì sao quan trọng: xóa máy cũ sớm thì mất dấu vết SEC và luật sư có thể cần (journal và nhật ký SSH không nằm trong bản sao lưu, `runbook-vps-moi.md` mục 2). Giữ quá lâu thì dữ liệu khách nằm trên một máy bị chiếm.
- Đề xuất sửa:
  - OPS thêm ca "nghi bị chiếm quyền, máy còn chạy (runbook sự cố, nhánh B mức Cao)" vào "Dùng khi", cùng một dòng cho máy cũ: tắt bằng console của nhà cung cấp khi OWN quyết, theo đề nghị của SEC; không xóa và không hủy thuê tới khi SEC (và luật sư, nếu đang hỏi) cho; xong thì hủy thuê và ghi decision-log.
  - Tiền thuê máy thứ hai do OWN quyết. Nếu vượt ngân sách đã duyệt thì OPS tạo ESC.
  - Runbook này giữ nguyên câu trỏ.
- Trạng thái: Open

### FB-R5-OPS-SEC-V574-05
- Mức độ: Suggestion
- Vị trí: mục 5 bước 4, "SEC chọn bản trên Mac trước lúc nghi bị vào".
- Vấn đề: lượt thoát 0 gần nhất (`.last_pull`) chỉ cho biết tệp bị sửa **sau** lúc đó. Nó không cho biết người lạ vào từ khi nào. Người lạ có thể đã ở trong máy nhiều ngày rồi mới sửa một bản cũ.
- Đề xuất sửa: thêm nửa câu: "`.last_pull` chỉ cho biết tệp bị sửa sau giờ đó, không cho biết lúc bị vào. SEC chọn bản theo dấu hiệu khác, và chọn lùi thêm nếu không chắc". Trước khi tắt máy cũ, SEC có thể xin bản chụp journal chỉ đọc làm dấu vết (thẻ 04).
- Trạng thái: Open

## 3. Việc phụ SEC đề nghị: đếm số lần link đã thu hồi được mở trước giờ thu hồi

**Làm được, nhỏ.** Chưa làm, chờ PO xếp chỗ. Vì đã có cột và sự kiện cần đếm, việc này không cần migration và không đổi API.

**Nguồn đếm:**
- Trang khách chỉ hiện dữ liệu sau khi đổi token lấy phiên (`POST /guest/sessions` → `openSession`). Mọi màn sau đó đều cần cookie phiên.
- Mỗi lần đổi thành công ghi hai thứ trong cùng một giao dịch:
  - một dòng `guest_session` (`token_id`, `created_at`);
  - một dòng `audit_event`: `action = 'guest_session.opened'`, `entity_type = 'guest_access_token'`, `entity_id` = id token, `entity_code` = mã đơn, `occurred_at`.
- Giờ thu hồi lấy ở `guest_access_token.revoked_at`, cùng lý do (`revoked`, `reissued`…).
- Đếm theo `audit_event`, vì J16 xóa `guest_session` một ngày sau `expires_at` (`retention.service.ts`). Đếm `guest_session` chỉ để đối chiếu khi dòng còn.

**Đọc kết quả thế nào:**
- 0 lần nghĩa là không ai thấy trang khách của link đó.
- Trình xem trước link của Zalo/Messenger chỉ tải HTML, không chạy JS, nên không tạo phiên và không bị đếm. Khi viết test, OPS kiểm lại điều này với trang khách.
- Giới hạn: nếu cùng một link đã tới cả khách thật lẫn người nhận nhầm, con số không tách được ai mở. SEC có thể cho đếm thêm số `ip_hmac` khác nhau. Đầu ra vẫn chỉ là một con số, nhưng đó là định danh bí danh, nên SEC quyết có đếm hay không.

**Hình dạng:** như K14 (#155).
- Một tệp `.sql` do SEC ghim SHA-256. Chạy `BEGIN READ ONLY`, có dòng gác như K14, chạy bằng `ottimo_readonly` (`BYPASSRLS`, chỉ `SELECT`, `02-roles.sh`), kết thúc bằng `ROLLBACK`.
- Đầu vào: mã đơn, qua biến `psql`, kiểm dạng `OTM-` + số ngay trong SQL. Không đúng đúng một đơn thì dừng.
- Đầu ra chỉ có nhãn cố định và số, cho từng token đã thu hồi của đơn (theo thứ tự tạo): lý do thu hồi, số lần mở trước giờ thu hồi, số lần mở sau giờ thu hồi (phải là 0), số dòng phiên còn lại. Không có tên, giờ, IP hay id.
- Chạy qua khối do SEC ghim, như `k14-run`.

**Cỡ việc:**
- OPS khoảng nửa ngày: SQL khoảng 40 dòng; khối chạy dùng lại khuôn K14; một test trên Postgres dùng một lần với đủ migration, gồm các ca 0/1/n lần mở, link cấp lại, mã sai, mở sau thu hồi bị từ chối.
- SEC: một lượt review và ghim.
- SEC sửa một dòng ở runbook mục 4 bước 4 để trỏ tới khối chạy.
- Không tốn tiền.

**Thời điểm:** sau V5-47. PO xếp vào v1.0.5 nếu còn chỗ trước khi cắt code 13/11, không thì v1.0.6. Trong lúc chưa có, câu "Chưa đếm được thì coi như đã mở" ở bước 4 vẫn giữ đúng phía an toàn.

## 4. Dòng decision-log (để ORC chép)

`| 2026-11-07 | 5 | **OPS – review SEC V5-74 runbook sự cố dữ liệu khách @ 2f732f58, nhánh B: ĐẠT CÓ ĐIỀU KIỆN.** Khớp pull-backups.sh và README infra/server (so nội dung tên trùng, kéo tệp mới, giữ bản Mac, thoát 3, mã 3 che mã 1); bước 4 trỏ đúng khối "Nghi bị chiếm quyền" của runbook-vps-moi. Điều kiện 01 Major: loại trừ "bản Mac hỏng" phải so bản máy chủ (kéo bằng khóa chỉ đọc vào thư mục tạm, không đăng nhập) với .sha256 trên Mac, không với .sha256 trên máy chủ – OPS sửa câu README cùng lượt. 02–04 Minor (không chạy lại script vì nó kéo thêm và xóa bản Mac quá 35 ngày, tắt lịch V5-60; viết cách xử lý mã 1 bằng quarantine/; runbook VPS mới thêm ca máy còn chạy và việc với máy cũ), 05 Suggestion. Việc phụ đếm lượt mở link đã thu hồi: làm được, ~nửa ngày OPS + SEC ghim, đếm audit_event guest_session.opened trước guest_access_token.revoked_at, khuôn K14, không migration – chưa làm, PO xếp v1.0.5 hay v1.0.6. Không ESC | OPS | rounds/round-05/reviews/OPS-on-sec-v5-74.md |`

## 5. Điểm làm tốt
- Nhánh B viết từ đúng hành vi của script: mã 3 che mã 1, bản Mac giữ nguyên, và đồng hồ tính từ giờ lượt kéo. Người đọc không cần mở mã nguồn.
- Bước 2 khoanh vùng theo đúng thứ tự an toàn: không phát hành, không xóa, không kéo, không đăng nhập. Không dùng lại gì lấy từ máy chủ.
- Phân vai rõ: OPS chỉ làm khi OWN đồng ý trong chat. Lệnh chỉ đọc, chỉ ra số. Mẫu dòng ghi không có IP hay tên.
