# PO review – tờ "Your ID details" v2 + tờ EN/RU (`v104/uxd-id-sheet-v2`)

- Người review: PO (kèm phần **Góc BA**, theo ORC giao) | Round 4 – v1.0.4 – Bước: **Review chéo** | 04/11/2026
- Đối tượng: `origin/v104/uxd-id-sheet-v2` @ `82df5fea` (1 commit, tác giả UXD), so với `origin/main` @ `7b5b6117`. Nhánh cắt từ `714fe810`, gộp vào `main` sạch (`git merge-tree`).
- Tệp đổi:
  - `product/design/tools/build_print_sheets.py`;
  - `product/docs/staff-one-pager.md`;
  - 3 tờ EN/VI: `product/docs/print/to-4-your-id-details-{a4,a4-2-ban,a5}.html`;
  - tờ mới `…-a4-ru.html`;
  - 4 PDF, 4 ảnh kiểm trong `rounds/round-04/outputs/UXD/id-sheet-v2/`;
  - hifi `11-reservation.html`, `12-sales-quote.html` (nhãn "ví dụ theo tỷ lệ cũ", việc P4-20 chuyển UXD).
- Căn cứ:
  - `rounds/round-04/reviews/SEC-on-plan-v1.0.4.md` mục 6.2 (chữ gốc) và 6.4 ý 4–5 (điều kiện tờ, thứ tự bật);
  - `SEC-on-privacy-v2-ru.md`, `UXD-on-privacy-v2-ru.md` (RU đã qua đủ 3 bước: CPY dịch, SEC đối chiếu nghĩa, UXD duyệt giọng);
  - chữ trên trang khách ở `v104/guest-privacy-v2` @ `80c35dcc`;
  - brand `00-brief/context/brand/brand-guidelines.md`;
  - `rbac-matrix.md` A71, D06; BR-610.
- Cách kiểm:
  - script tách chữ từ 4 tệp HTML và so **từng câu** với 4 khóa `gw.notice_body`, `gw.notice_retention`, `gw.notice_translation`, `gw.notice_rights` (EN, VI, RU) của `v104/guest-privacy-v2`;
  - đếm trang 4 PDF;
  - soát mã màu và font trong tờ RU;
  - đọc diff `staff-one-pager.md` và hifi.
- Không sửa mã, không sửa decision-log. Không có dữ liệu khách.

---

## 1. Kết luận

**ĐẠT.** Không có Blocker hay Major. Có 1 Minor và 2 Suggestion (1 PO, 1 Góc BA).

| Tiêu chí (SEC 6.4 ý 4 + yêu cầu brand) | Kết quả |
|---|---|
| Thêm đoạn dịch `gw.notice_translation` vào bản EN và VI | **Đạt** ở cả 3 tờ EN/VI |
| Chữ khớp nguyên văn với trang khách v2, đúng thứ tự 6.2 | **Đạt.** Script so câu: 4 khóa × EN/VI × 3 tờ và EN/RU × tờ RU đều khớp. `gw.notice_body` tách 2 đoạn ở cùng chỗ như bản v1. Chỉ khác cách ngắt dòng (`span.nb`, U+00A0), không khác chữ |
| Chân tờ `OTTIMO · ID notice · v2 · 11/2026` | **Đạt** ở cả 4 tờ (tờ A4 hai bản có 2 lần, đúng vì có 2 bản trên một trang) |
| Bản cũ giữ trong lịch sử repo (SEC D08) | **Đạt.** Sửa tại chỗ, bản v1 còn trong git |
| Bản RU chỉ in khi RU đã duyệt (6.4 ý 3) | **Đạt.** Chữ RU khớp bản đã có câu SEC sửa ("После удаления … не более 35 дней") |
| Mỗi tờ vừa 1 trang | **Đạt.** 4 PDF đều 1 trang (`/Count 1`) |
| Brand OTTIMO | **Đạt.** Lora tiêu đề, Be Vietnam Pro thân; tờ RU dùng Onest cho cột RU vì Be Vietnam Pro không có chữ Kirin, theo cách landing `/ru/` LP-v2 đã dùng. Màu: Ink, Stone Grey, Light Oak, Earth Brown, Ivory, Cream. Đường kẻ `#CFC8BA` có sẵn ở mọi tờ in từ trước, không phải mới. Không emoji. EN dẫn |
| Phạm vi | Đúng. Tờ v2 là điều kiện SEC của P4-42 (trang khách v2). Không có tờ này thì OWN không đặt được `privacy_notice_version` = v2. Hai màn hifi gắn nhãn tỷ lệ cũ là việc P4-20 chuyển sang UXD (biên bản DOM mục 4), làm cùng nhánh là hợp lý |

**Thứ tự gộp:** `v104/uxd-id-sheet-v2` trước `v104/ba-docs` (decision-log 04/11, BA trích tờ v2). Tờ in không phụ thuộc mã, nên gộp lúc nào cũng được. Nhưng OWN chỉ **dán** tờ v2 theo đúng bước 2 của SEC 6.4 ý 5, sau khi v1.0.4 đã deploy.

## 2. Thẻ feedback (góc PO)

### FB-R4-PO-UXD-IDS2-01
- Mức độ: Minor
- Vị trí: `product/docs/staff-one-pager.md`:
  - bảng in cuối tệp, dòng `| 4 – Your ID details | A5 dọc một mặt | … | Giữ |` (giữ nguyên), nằm ngay trên dòng mới `4 – Your ID details (bản v2)`;
  - câu cuối "Tờ 4 phải ở quầy trước khi nhận giấy tờ đầu tiên trên Desk thật: tối 01/11 … 06:00 ngày 02/11".
- Vấn đề:
  - Bảng cùng lúc ghi tờ v1 "Giữ" và tờ v2 "Thay tờ v1". Người in theo bảng có thể in cả hai, hoặc giữ tờ v1 ở quầy.
  - Câu cuối còn mốc ngày của v1.0.0, đã qua.
  - Dòng v2 ghi "Thay **trước** khi đặt tham số". SEC 6.4 ý 5 nói rõ hơn: thay tờ rồi đặt tham số **cùng ngày**, sau khi deploy v1.0.4.
- Vì sao quan trọng:
  - Tờ v1 không có đoạn về dịch vụ dịch.
  - Nếu tờ v1 còn ở quầy sau khi Desk ghi v2 cho khách làm thủ tục tại quầy, bằng chứng đồng ý ghi một bản mà khách lại đọc bản khác. Đây đúng là rủi ro SEC muốn chặn.
  - Ngược lại, nếu dán tờ v2 sớm nhiều ngày khi trang khách và Desk còn v1, hai bên cũng lệch.
- Đề xuất sửa:
  - đổi dòng v1 thành "Thôi dùng – thay bằng bản v2 (dòng dưới)", hoặc bỏ dòng v1;
  - dòng v2 ghi: "Dán sau khi deploy v1.0.4, **cùng ngày** OWN đặt `privacy_notice_version` = v2 (SEC 6.4 ý 5 bước 2–3)";
  - câu cuối thay mốc 01–02/11 bằng câu chung "Tờ 4 ở quầy phải cùng phiên bản với tham số `privacy_notice_version` trên Desk".

  Nên làm trước khi BA trích sang sổ tay (`v104/ba-docs`) để không phải sửa hai lần.
- Trạng thái: Open

### FB-R4-PO-UXD-IDS2-02
- Mức độ: Suggestion
- Vị trí: `product/design/tools/build_print_sheets.py`. Chữ tờ đọc từ `staff-one-pager.md` (`read_source`), là bản chép tay của `gw.notice_*` trong `gen_strings.py`.
- Vấn đề:
  - Hiện chữ khớp (PO đã so bằng script).
  - Nhưng không có kiểm tự động nào giữ cho tờ in và trang khách không lệch nhau. Chữ RU của `v104/guest-privacy-v2` chưa gộp vào `main`. Nếu CPY hay SEC sửa thêm một câu trước khi gộp thì tờ in lệch mà không ai biết.
  - Ghi chú trong tệp đã dặn "đổi chữ thì đổi cả trang khách", nhưng đó là việc tay.
- Vì sao quan trọng: tờ ở quầy là văn bản thông báo xử lý dữ liệu cá nhân (ND13). Lệch chữ với trang khách cùng version là lỗi pháp lý nhỏ nhưng có thật.
- Đề xuất sửa:
  - Khi in, `build_print_sheets.py` so từng đoạn Tờ 4 và Tờ 4ru với `design/copy/strings-{en,vi,ru}.json` (4 khóa `gw.notice_*`). Lệch thì dừng.
  - Nếu chưa kịp làm ở v1.0.4: QA thêm một bước tay vào checklist phát hành P4-42: "so tờ in với trang khách sau khi gộp `guest-privacy-v2`".
- Trạng thái: Open

---

## 3. Góc BA – quy tắc đúng đặc tả, ma trận quyền

| Câu trên tờ | Đối chiếu | Kết quả |
|---|---|---|
| "ID photos are encrypted; only reception and managers can see them" | `rbac-matrix.md` A71 (xem ảnh giấy tờ, số đầy đủ): OWN, MGR, FDL, FD ✔; HK, MT, SAL, CTV ✖; D06 (ảnh giấy tờ): HK/MT/SAL/CTV "K"; mục 7: chỉ trên thiết bị được cấp. BR-610: "chỉ lễ tân và quản lý **(và chủ đầu tư)** xem được" | Khớp về nhóm **không** được xem (buồng phòng, bảo trì, sale, CTV). Lệch nhỏ về cách gọi OWN → thẻ BA-01 |
| "We will ask separately whether we may keep your ID photos … Saying no does not affect your stay" | BR-610 (chỉ giữ ảnh của người **đã đồng ý**; người không đồng ý thì xóa khi khai báo xong), `guest.oci.consent_optional` | Khớp |
| "deleted within 3 months after check-out, unless the law requires … longer" | BR-610 (90 ngày từ v1.0.1), tham số `id_image_retention_days_after_checkout` = 90 | Khớp |
| "Copies in our encrypted backups are deleted within a further 35 days" | SEC 6.2/6.3 (đã đối chiếu với hạn giữ bản sao lưu của OPS) | Khớp chữ gốc SEC. Phần kỹ thuật thuộc SEC/OPS, BA không chấm |
| Đoạn dịch vụ dịch | SEC 6.2 `gw.notice_translation` | Khớp chữ gốc SEC |
| "To see, correct or delete your details, please ask reception" | SEC 6.2 `gw.notice_rights`; lễ tân là đầu mối nhận yêu cầu tại quầy | Khớp chữ gốc SEC. BA kiểm bước xử lý ở sổ tay (`v104/ba-docs`) |
| Nơi đặt và người thay tờ | SEC 6.4 ý 5 bước 2: "INV/OWN thay tờ v2 ở quầy" | Đúng vai. Xem thẻ PO IDS2-01 về câu chữ thời điểm |

### FB-R4-PO-BA-IDS2-01
- Mức độ: Suggestion
- Vị trí: câu 2 của `gw.notice_body` (EN "only reception and managers can see them"; VI "chỉ lễ tân và quản lý xem được"; RU "только администраторы и управляющие"). Câu này giống hệt v1 và có trên cả 4 tờ lẫn trang khách.
- Vấn đề: BR-610 và `rbac-matrix` A71 cho **chủ đầu tư (OWN)** xem ảnh giấy tờ. Câu thông báo chỉ nêu "lễ tân và quản lý". Ở OTTIMO hiện nay, OWN là người quản lý trực tiếp và giữ cả 6 vai, nên người đọc hiểu "managers" là gồm cả OWN. Nhưng khi có quản lý thuê riêng, câu này hẹp hơn thực tế phân quyền.
- Vì sao quan trọng: thấp với v1.0.4. Đây là chữ pháp lý của SEC, luật sư đã đọc EN/VI. Đổi chữ thì phải đổi version, nên **không** đề nghị sửa ở v1.0.4.
- Đề xuất sửa: SEC ghi một dòng vào ghi chú khóa `gw.notice_body` hoặc decision-log: "'managers' gồm OWN – chủ đầu tư trực tiếp quản lý". Lần đổi version thông báo tới thì cân nhắc chữ "reception and management". Không đổi tờ in ở v1.0.4.
- Trạng thái: Open

---

## 4. Điểm làm tốt
- Chữ trên 4 tờ khớp từng câu với trang khách v2, kể cả câu SEC sửa ở bản RU. Khoảng trắng không ngắt ở "3 месяцев", "35 дней" được giữ và có ghi chú cảnh báo đừng gõ lại.
- Tờ EN/RU hai cột, EN dẫn, dùng Onest cho chữ Kirin như landing `/ru/`. Font được nhúng, nên in khi mất mạng vẫn đúng. 4 tờ vừa 1 trang, và UXD khuyên dùng A4 ở quầy (A5 để dự phòng): rõ, dễ làm theo.
- Đóng luôn việc hifi 11/12 mà P4-20 chuyển sang, với câu nhãn thống nhất "Ví dụ theo tỷ lệ cũ (trước 01/11/2026, hết hiệu lực)" và không thêm số mới.
