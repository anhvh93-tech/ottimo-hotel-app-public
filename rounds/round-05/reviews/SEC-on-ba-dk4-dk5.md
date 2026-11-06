# SEC – Review sổ vận hành 1.2, câu check-in online (BA) và tờ dán quầy (PO)

Round 5 · bước **Review** · SEC · 06/11/2026 (tối)

Đối tượng:
- BA, commit `4d25f5b7` (QC Round 4 ĐK-4, ĐK-5 / V5-08):
  - `product/docs/so-van-hanh.md` bản 1.2;
  - `product/docs/manual/user-manual-v1.0.md`;
  - `product/docs/manual/guides/00-index.md`, `01-chu-dau-tu-quan-ly.md`, `02-le-tan.md`, `05-sale-ctv.md`, `screenshot-additions.md`;
  - báo cáo `rounds/round-05/outputs/BA/report.md` (ORC lưu ở `b9f017f7`).
- PO, commit `8d607f98` (ORC thêm phạm vi): `product/docs/staff-one-pager.md`, Tờ 1 khối "Check-in online – mở lại từ 06/11/2026" và Tờ 2a.

SEC đối chiếu với:
- `rounds/round-04/reviews/SEC-on-bug-r4-054.md` (B1, B4, OR-02 và mục "Xác nhận OR-01");
- `product/infra/server/bin/pull-backups.sh` bản `bede5332` và README `infra/server` dòng "Bản sao lưu ngoài máy";
- `rounds/round-04/qc/round-4-closeout-gate.md` ĐK-2 tới ĐK-5;
- `rounds/round-04/outputs/OPS/v1.0.4-release-runbook.md` N1–N6, K11; `rounds/round-04/reviews/SEC-on-v104-release-N4.md`;
- `rounds/round-03/reviews/SEC-on-PO-v1.0.0-docs.md` S4, S5, thẻ D05 (luật "lỡ gửi link" cũ);
- `product/docs/security/security-requirements.md` SR-GST-04/06/13, SR-BAK-03, SR-INC-01; `product/docs/rbac-matrix.md` A22, A22a, D25;
- `product/services/api/src/modules/guest-portal/internal/guest-portal.service.ts` (trang khách mức 1 trả những gì).

SEC chỉ đọc repo. Không SSH, không gọi staging hay production. Tệp này không có IP, bí mật, tên đăng nhập hay dữ liệu khách.

---

## 0. Kết luận: **DUYỆT CÓ ĐIỀU KIỆN**

| Phần | Kết luận | Điều kiện |
|---|---|---|
| Sổ vận hành 1.2 (ĐK-4) | **DUYỆT CÓ ĐIỀU KIỆN** | FB-R5-SEC-BA-02 (Major): sửa chữ trước lần kéo 08/11; ORC kiểm Time Machine ở lần kéo đó. Các thẻ Minor 03–07 sửa trước buổi review 20/11 |
| Sổ tay + bộ hướng dẫn (ĐK-5 / V5-08) | **DUYỆT CÓ ĐIỀU KIỆN** | FB-R5-SEC-BA-01 (Major): bước "gửi nhầm người" thêm ghi sổ và báo chủ đầu tư. Hạn **08/11**, sớm hơn hạn ĐK-5, vì luồng gửi link đang chạy thật từ 06/11 14:22 |
| Tờ dán quầy (PO) | ~~Tờ 1: chưa in.~~ **Tờ 1: được in** (SEC đọc lại lượt 2, mục 3a, `106722d7`). **Tờ 2a: được in** | PO-01, PO-02, PO-03 đã **Closed**. Tờ 2a bản in không còn chữ nào về check-in online. Phần giữ chỗ của Tờ 2a vẫn chờ DOM đọc |

- QC ĐK-5, tiêu chí grep: **đạt**. Trong `product/docs/manual/`, `grep "tạm dừng\|chưa gửi link"` còn 6 dòng, đều đúng: chú thích nguồn ẩn, phiếu sửa chờ vật tư, mục lịch sử.
- QC ĐK-4 (a), (b), (c): **đạt phần nội dung**. Nhịp 2 ngày, mã 3 là P0 bảo mật, giữ bản Mac, người thứ hai ở phòng Báo động, nhắc diễn tập 35 ngày: đều đúng quyết định 06/11. Các thẻ dưới đây là độ chính xác và chỗ hở còn lại.
- **Câu hỏi của PO** (gửi nhầm người có cần báo chủ đầu tư không): **Có.** Lý do ở thẻ BA-01, áp cho cả Tờ 1 (PO-01).
- **Kiểm lộ thông tin: đạt.** 111 dòng thêm của `4d25f5b7`, toàn bộ 8 tệp đích và báo cáo BA: 0 địa chỉ IP, 0 mật khẩu, khóa, token, 0 đường webhook hay ping, 0 tên đăng nhập của INV, 0 số điện thoại, 0 dữ liệu khách. Email chỉ có `info@ottimo.vn` (công khai) và mẫu `@ottimo.vn`. Ảnh C0-10, C2-14 mà BA cho dùng lại: đã che link, mã QR, Wi-Fi; tên trong ảnh là khách thử.
- ESC mới: **không**.

---

## 1. Bảng kiểm theo giao việc

### 1.1 Sổ vận hành 1.2

| Điểm | Kết quả | Ghi chú |
|---|---|---|
| 1.1a nhịp kéo ≥ 2 ngày/lần, chỉ vào ngày INV cho phép | Đạt | Khớp ĐK-3, SEC B3, X6 |
| 1.1a mã 3 "server copy changed" = P0 bảo mật, giữ bản Mac | Đạt, kèm BA-03, BA-04 | Khớp script dòng 17–19, 88–94 và README. Dòng báo lại thiếu mã thoát. Mã 3 chỉ trỏ về quy trình P0 chung |
| 1.1a "bản quá 35 ngày tự xóa, đúng lời hứa" | **Chưa đúng hẳn** – BA-02 | Đúng với thư mục nhận. Chưa đúng nếu Time Machine đang chép thư mục đó |
| 2.1a mất dữ liệu tối đa 24 giờ / 12 giờ | Đạt một phần, kèm BA-05 | 03:00 + 14:00 cho khoảng 13 giờ. Dòng "máy chủ mất hẳn" chưa có con số |
| Người thứ hai phòng "Báo động": một người, `@ottimo.vn`, nhận FAIL thì gọi INV | Đạt, kèm BA-07 | Khớp OR-L7. Giả định BA "người thứ hai báo INV, không tự báo đội" đúng, vì đội chỉ nhận việc qua Claude Code của INV. SEC chấp nhận |
| Ngưỡng báo kéo chậm 48 giờ | Đạt, kèm BA-06 | SEC đồng ý 48 giờ làm ngưỡng **im lặng**. Lượt kéo lỗi thì báo ngay, theo OR-02 |
| Nhắc diễn tập 35 ngày thay "hằng quý" | Đạt | Khớp B1 OR-M1 và X4.4. 35 ngày cũng là tuổi bản trên Mac bị cắt |
| Mục 6 | Đạt | Tối đa một người thứ hai. Không xóa, không chuyển thư mục sao lưu, kể cả khi có mã 3. Không dán địa chỉ ping |
| Mục 7.2 | Đạt, kèm BA-07 | Nhắn đội chỉ ghi vai, không tên, không email. Có cách gỡ khi nghỉ việc |
| 1.3, 1.5, 2.3 bước 6, 3.1, 5.3 ý 5, 5.4, G2 | Đạt | Nhất quán với nhau và với `guides/00-index`, `guides/01` 17.1 |

### 1.2 Câu check-in online, đối chiếu điều kiện mở lại (N4 ĐẠT, N5 14:22, N6 còn chờ)

| Điều kiện | Sổ tay | `02` lễ tân | `01` chủ đầu tư | `05` sale/CTV | Tờ 1 (PO) |
|---|---|---|---|---|---|
| Ai được gửi: OWN, MGR, FDL, FD; không SAL, CTV (A22, A22a) | 2.9 khung đầu: đạt | 17.3: đạt | 15.4: đạt | 4.2, 7.2, 8.3: đạt, có "không chuyển tiếp", chỉ nhắn mã đơn | Đạt |
| Chỉ đơn đã xác nhận | 2.9: đạt | 17.3: đạt | 15.4: đạt | 8.3: đạt | Đạt |
| Gửi riêng 1–1, không kèm mã cửa, không chụp hộp link | 2.9 bước 2–3: đạt, kèm BA-08 | 16.2, 17.3: đạt, kèm BA-08 | – | – | Đạt, kèm PO-02 |
| Gửi nhầm người | 2.9 bước 6: **thiếu** – BA-01 | 17.3 bước 5: **thiếu** – BA-01 | 14.1: **thiếu** – BA-01 | – | **Thiếu** – PO-01 |
| Khi nào dừng (N6) | 2.9: đạt | 17.3: đạt | 15.4: đạt, có "đội có thể báo dừng" | – | Đạt |

Thêm:
- BA bỏ việc "đội đếm link mỗi sáng" là **đúng**. SEC S4 / C.2 (`SEC-on-PO-v1.0.0-docs.md`) chỉ chạy tới khi mở lại.
- Câu "đơn giữ chỗ cũng hiện nút link, Desk luôn từ chối" đã sai từ v1.0.4: thẻ BA-09, theo ORC.

---

## 2. Thẻ feedback – BA

### FB-R5-SEC-BA-01
- Mức độ: Major
- Vị trí: `product/docs/manual/user-manual-v1.0.md` mục 2.9 bước 6 (dòng 1018); `guides/02-le-tan.md` mục 17.3 bước 5 (dòng 1640); `guides/01-chu-dau-tu-quan-ly.md` mục 14.1, dòng "Lễ tân gửi nhầm link…" (dòng 876).
- Vấn đề:
  - Cả ba chỗ chỉ còn "Thu hồi link" (sổ tay thiếu cả bước tạo link mới cho đúng khách). Bước "ghi mã đơn vào sổ giao ca, báo chủ đầu tư trong ngày" của SEC S5 và thẻ D05 bị bỏ cùng khối "tạm dừng".
  - Bỏ như vậy là ngược rủi ro. Lúc tạm dừng, "lỡ gửi" nghĩa là gửi **đúng khách** một link có thông báo cũ. Nay "gửi nhầm" nghĩa là **người ngoài** cầm link mức 1 của một khách.
  - Theo `guest-portal.service.ts` (SR-GST-06), người đó thấy: tên gọi của khách ("Welcome to OTTIMO, Emma." ở ảnh C0-10), mã đơn, ngày đến – ngày đi, tên căn hoặc hạng căn, giờ đến khách đã khai, trạng thái thủ tục, địa chỉ, nội quy. Từ ngày đến còn thấy Wi-Fi, khi V5-58 lên.
  - Tới lúc thu hồi, người đó còn **ghi được vào đơn**: tải ảnh giấy tờ, đổi giờ đến, gửi yêu cầu. Ảnh đã tải chỉ ghi, không xem lại được (ĐK-3), nên người đó không xem được giấy tờ của khách.
  - `guides/01` 14.1 là dòng việc của **chủ đầu tư**, nhưng chỉ chép lại việc của lễ tân. Chủ đầu tư không biết mình phải làm gì.
- Vì sao quan trọng:
  - Đây là dữ liệu cá nhân của khách tới tay người thứ ba. Có phải sự cố phải báo cơ quan chức năng trong 72 giờ hay không (SR-INC-01; NĐ 13/2023 Đ.23, Luật 91/2025, luật sư xác nhận) là việc chủ đầu tư quyết cùng SEC, không phải việc của quầy.
  - Không có dòng ghi và lời báo thì chủ đầu tư không biết có việc để quyết, và hạn 72 giờ có thể trôi qua.
  - Thường thì đây **không** phải P0: dữ liệu mức 1 ít, link thu hồi ngay. Nhưng chỉ đánh giá được khi có dữ liệu.
- Đề xuất sửa (cùng một ý ở cả ba chỗ, và ở Tờ 1 của PO):
  1. **Thu hồi link** ngay (Desk hỏi lại; người mở link thấy "Liên kết đã hết hạn"). Rồi **Tạo link mới**, gửi đúng khách.
  2. Ghi sổ giao ca: mã đơn, giờ gửi nhầm, giờ thu hồi, kênh. Không ghi tên khách. Không ghi tên hay số của người nhận nhầm.
  3. Báo chủ đầu tư **trong ngày**.
  4. Trước khi thu hồi, đơn đã hiện **Đã làm thủ tục trước**, giờ đến mới hoặc yêu cầu mới mà khách thật nói mình chưa gửi:
     - không dùng giấy tờ đó để khai báo;
     - khi khách đến, đối chiếu bản gốc như mọi khách;
     - ảnh không phải của người trên đơn thì không **Gắn người**, quản lý **Xóa ảnh** (sổ tay 2.11);
     - báo chủ đầu tư **ngay trong ca**.
  5. `guides/01` 14.1, cột việc của chủ đầu tư: "Đọc dòng sổ giao ca. Báo đội bằng `/feedback` (không cần P0): mã đơn, giờ gửi, giờ thu hồi, kênh, đơn có hiện **Đã làm thủ tục trước** trước giờ thu hồi không. Không ghi tên khách hay người nhận nhầm. Đội bảo mật trả lời trong ngày có cần làm gì thêm."
  - Không cần báo khách hay báo người nhận nhầm, trừ khi đội bảo mật đề nghị.
- Trạng thái: Open

### FB-R5-SEC-BA-02
- Mức độ: Major
- Vị trí: `product/docs/so-van-hanh.md` mục 1.1a dòng 51; mục 5.4 dòng 324.
- Vấn đề:
  - 1.1a viết: "Bản quá 35 ngày trên Mac tự xóa sau mỗi lần kéo, **đúng lời hứa** trong thông báo quyền riêng tư." Script đúng là cắt bản ≥ 35 ngày trong thư mục nhận (`pull-backups.sh` dòng 77–85).
  - Nhưng thư mục nhận nằm trong thư mục người dùng trên Mac của INV. Nếu Time Machine đang bật và không loại thư mục này, mỗi lượt Time Machine chép thêm một bản. Bản Time Machine theo tuần được giữ tới khi ổ đầy, tức lâu hơn 35 ngày nhiều.
  - 5.4 chỉ nhắc loại khỏi Time Machine, iCloud như một phần của việc **cài lịch tự kéo** (v1.0.5). Bản kéo tay đã nằm trên Mac từ 26/10.
  - Chưa tài liệu nào trong repo ghi Mac của INV có bật Time Machine hay không. FileVault thì INV đã xác nhận ngày 27/10 (decision-log).
  - Lỗi gốc là của SEC: B4 và OR-02 điểm 3 gắn điều kiện này vào lượt tự động, trong khi chính OR-02 viết "lời hứa này áp cho **mọi** bản sao". BA chép đúng theo SEC.
- Vì sao quan trọng:
  - Thông báo quyền riêng tư bản 2 (trang khách, tờ Your ID details, web) hứa bản sao lưu đã mã hóa xóa trong 35 ngày sau đó (SR-BAK-03, TM-15).
  - Bản sao Time Machine vẫn được `age` mã hóa, nên rủi ro lộ thấp. Rủi ro chính là **giữ quá thời hạn đã hứa**. Sổ vận hành đang khẳng định điều chưa kiểm.
  - Bản cũ nhất đã kéo về từ 26/10, nên có thể chạm mốc 35 ngày từ khoảng cuối tháng 11.
- Đề xuất sửa:
  - **BA (chữ):**
    - 1.1a: "Bản quá 35 ngày trong thư mục sao lưu trên Mac tự xóa sau mỗi lần kéo. Để giữ đúng lời hứa 35 ngày, thư mục này không được nằm trong Time Machine hay iCloud. Ở lần kéo 08/11, đội kiểm việc này và hỏi anh/chị trước khi đổi gì trên máy."
    - 5.4: tách ý Time Machine ra khỏi câu cài lịch tự kéo. Ghi "đã làm ở lần kéo 08/11 (mục 1.1a)", hoặc giữ thành câu hỏi có/không nếu 08/11 chưa làm.
  - **ORC (lần kéo 08/11):**
    - kiểm chỉ đọc: Time Machine có bật không, thư mục nhận đã bị loại chưa;
    - chưa loại thì xin INV đồng ý trong chat rồi mới loại. Đây là cấu hình lâu dài trên máy của INV;
    - kiểm thư mục nhận không nằm trong vùng iCloud Drive đồng bộ;
    - ghi kết quả có/không vào dòng decision-log của lần kéo.
  - **Nếu Time Machine đã từng chép thư mục này:** OPS và SEC đề xuất cách bỏ các bản đó trước khi bản cũ nhất quá 35 ngày. Việc xóa trên Time Machine là xóa vĩnh viễn, nên **INV tự làm** theo hướng dẫn của đội.
  - Mac không bật Time Machine thì thẻ đóng ngay, chỉ còn sửa chữ.
- Trạng thái: Open

### FB-R5-SEC-BA-03
- Mức độ: Minor
- Vị trí: `so-van-hanh.md` 1.1a dòng 50, 51, 52, 53.
- Vấn đề:
  1. Dòng 50 "Đội báo lại một dòng: số tệp mới, tên bản mới nhất, mã kiểm tra có khớp không" thiếu **mã thoát**. Mã thoát chính là tín hiệu bảo mật: 3 nghĩa là máy chủ đổi tệp cũ. ĐK-3 yêu cầu ghi mã thoát, SEC X6 yêu cầu ghi giờ chạy.
  2. Dòng 52 "lượt kéo **dừng** với mã 3": script vẫn kéo và kiểm tệp mới, rồi mới **kết thúc** với mã 3 (dòng 13–15, 88–94). "máy chủ **đã đổi** một bản sao lưu cũ" là khẳng định quá mức. README ghi: nếu cùng tệp còn báo `checksum mismatch` thì có thể bản trên Mac mới là bản hỏng. Mức P0 vẫn giữ nguyên.
  3. Dòng 51 "Cách kéo từ 06/11": lượt 06/11 khoảng 19:00 chạy script **cũ**, chưa có `--ignore-existing` (decision-log 06/11). Cách kéo mới bắt đầu từ lần kéo 08/11.
  4. Dòng 53 gộp "mã kiểm tra không khớp" (mã 1) với lỗi mạng rồi hẹn "kéo lại". Với `--ignore-existing`, kéo lại **không** thay được tệp hỏng trên Mac, nên lượt sau vẫn ra mã 1 tới khi đội xử lý tay.
- Vì sao quan trọng: INV đọc dòng báo lại hai ngày một lần. Thiếu mã thoát thì một lượt mã 3 dễ bị đọc như "đã kéo xong". Câu chữ sai thì INV kỳ vọng sai về việc đội sẽ làm.
- Đề xuất sửa:
  - Dòng 50: "giờ chạy, **mã thoát (0 là ổn)**, số tệp mới, tên bản mới nhất, có dòng 'server copy changed' không".
  - Dòng 52: "lượt kéo kết thúc với mã 3: bản trên máy chủ khác bản đã có trên Mac. Coi là P0 bảo mật, nghi máy chủ bị xâm nhập, tới khi đội bảo mật kết luận".
  - Dòng 51: "Từ lần kéo 08/11".
  - Dòng 53: "đội xử lý, báo anh/chị trong ngày" (bỏ "kéo lại" với mã 1).
- Trạng thái: Open

### FB-R5-SEC-BA-04
- Mức độ: Minor
- Vị trí: `so-van-hanh.md` 1.1a dòng 52 ("xử lý ngay theo mục 3.4"); mục 3.4.
- Vấn đề: 3.4 là quy trình P0 chung, nhắm tới lỗi do bản phát hành: quay lui, sửa, QA, QC, "đội sao lưu trước khi phát hành", "mục tiêu: xong trong ngày". Với nghi máy chủ bị chiếm, các bước này không đúng:
  - không phát hành gì lên một máy chủ đang bị nghi;
  - bản sao lưu mới từ máy đó không đáng tin;
  - dựng lại máy chủ không xong trong ngày.
  Chưa có runbook sự cố SR-INC-01 (đây là việc của SEC và OPS, mục 5).
- Vì sao quan trọng: INV là người duyệt "Review deployments" và là người quyết tắt máy chủ. Không được dặn trước thì INV có thể duyệt một bản vá theo thói quen 3.4.
- Đề xuất sửa: thêm 3 dòng ngay dưới dòng 52, hoặc một ý trong 3.4:
  - (a) "Không duyệt phát hành nào ('Review deployments') tới khi đội bảo mật báo."
  - (b) "Đội có thể đề nghị tạm tắt máy chủ. Khi đó Desk ngừng, quầy làm theo mục 3.2 với sổ giấy. Anh/chị quyết."
  - (c) "Nếu xác nhận dữ liệu khách bị lộ, có thể phải báo cơ quan chức năng trong 72 giờ. Đội và luật sư chuẩn bị, anh/chị quyết."
- Trạng thái: Open

### FB-R5-SEC-BA-05
- Mức độ: Minor (hạn: trước buổi review 20/11, vì INV xác nhận con số ở buổi đó)
- Vị trí: `so-van-hanh.md` 2.1a dòng 142–146; 2.2 dòng 154; 5.4 dòng 325.
- Vấn đề:
  1. **12 hay 13 giờ.** BA đã tự nêu: 03:00 + 14:00 để lại khoảng 14:00 → 03:00 dài 13 giờ. Lỗi gốc nằm ở SEC B1 OR-M2. ORC đã giao OPS chọn.
     - Ý kiến SEC: không phản đối cách nào về bảo mật. SEC nghiêng về **15:00**: hai khoảng 12/12 giờ, giữ được chữ "12 giờ" ở mọi nơi. DB khoảng 7,4 MB nên lượt dump trong giờ làm việc không đáng kể.
     - Nếu OPS giữ 14:00 thì 2.1a, 2.2 và 5.4 ghi **13 giờ**.
     - SEC sửa SR-BAK-01 theo con số OPS chốt khi V5-62 lên.
  2. **Dòng "Máy chủ mất hẳn" không có con số.** Đây là kịch bản thật của TM-52: bị chiếm quyền, bị xóa, bị khóa tài khoản. INV xác nhận "12 giờ" ở 5.4 dễ hiểu là mức chung cho mọi sự cố.
     - Ước tính của SEC, OPS chốt: kéo tay khoảng 19:00, đúng nhịp 2 ngày thì bản mới nhất trên Mac là bản 03:00 cùng ngày. Ngay trước lần kéo kế tiếp, phần mất có thể tới **khoảng 2 ngày 16 giờ (64 giờ)**, và hơn nếu kéo trễ.
     - Có lượt dump chiều, vẫn kéo tay: khoảng 2 ngày 4–5 giờ.
     - Mac tự kéo hằng ngày sau lượt dump chiều: khoảng 1 ngày cộng vài giờ.
- Vì sao quan trọng: INV đang được mời xác nhận mức mất dữ liệu thay giả định 15 phút. Xác nhận phải dựa trên con số đúng cho cả hai kịch bản. Muốn thấp hơn thì cần máy phụ, có chi phí (ESC riêng).
- Đề xuất sửa:
  - 2.1a: ghi con số OPS chốt cho cả hai dòng.
  - 5.4: "Xác nhận: máy chủ còn – mất tối đa 12 (hoặc 13) giờ từ v1.0.5; máy chủ mất hẳn – mất tối đa khoảng … (nhịp kéo hiện nay), khoảng … khi Mac tự kéo hằng ngày."
- Trạng thái: Open – chờ OPS chọn giờ lượt dump hai

### FB-R5-SEC-BA-06
- Mức độ: Minor
- Vị trí: `so-van-hanh.md` 2.2 dòng 153, cột đề xuất v1.0.5 ("Quá 48 giờ chưa kéo được thì có email báo về `info@ottimo.vn`").
- Vấn đề: câu này hiểu là "chỉ báo sau 48 giờ". Theo OR-02 điểm 1 (OPS đã nhận trong `responses/OPS-LP-v2.md`):
  - lượt tự kéo ra mã 1, 2, 3, hoặc bản mới nhất trên Mac quá 36 giờ, thì gửi `/fail`, tức là **báo ngay**;
  - 48 giờ chỉ là ngưỡng **im lặng**, khi Mac tắt hoặc ngủ, không có lượt nào chạy;
  - mã 3 khi tự kéo vẫn là P0 bảo mật như 1.1a.
- Vì sao quan trọng: INV đồng ý cài lịch tự kéo dựa trên mô tả này (5.4). Mã 3 mà chờ 48 giờ mới báo thì mất tác dụng.
- Đề xuất sửa: "…Lượt tự kéo lỗi thì có email báo ngay; lỗi 'server copy changed' là P0 như mục 1.1a. Quá 48 giờ không có lượt kéo nào thành công (ví dụ Mac tắt) cũng có email."
  - SEC chốt phần của mình cho V5-60: ngưỡng im lặng **48 giờ**, kèm điều kiện ping của OR-02 (thoát 0 **và** bản mới nhất ≤ 36 giờ). Thay cho 8 ngày.
  - Gợi ý cho OPS (không bắt buộc): cho check `ottimo-offsite` báo thêm vào phòng "Báo động", nếu không phải đưa bí mật mới vào repo.
- Trạng thái: Open

### FB-R5-SEC-BA-07
- Mức độ: Minor
- Vị trí: `so-van-hanh.md` 7.2 dòng 371–377; `guides/01` 17.1 (dòng 995–997), 1.9 khối **Ngày cuối của người nghỉ** bước 5 (dòng 261); sổ tay 1.5 cùng khối, bước 5 (dòng 409); `guides/02` (không có hướng dẫn FAIL).
- Vấn đề:
  1. Chưa nói người thứ hai là **thành viên thường**. Người đó không làm quản lý phòng, nên không quản lý được webhook `ottimo-alert`, một bí mật theo mục 6. Phòng Báo động cũng chưa có luật "không thêm ứng dụng hay webhook nào khác" như phòng "Yêu cầu đặt phòng" (`01` 12.1).
  2. Chưa nói điện thoại của người đó phải cài theo `01` 12.1 trước khi thêm: 2 bước, khóa màn hình, quản lý thiết bị. MGR và FDL đã làm, nhưng chủ đầu tư có thể chọn người khác.
  3. Khối 8 bước **Ngày cuối của người nghỉ**, bước 5, chỉ ghi gỡ khỏi phòng "Yêu cầu đặt phòng". Dòng "gỡ khỏi phòng Báo động" mới có ở sổ vận hành 1.5 và `01` 17.1, trong khi chủ đầu tư làm theo khối 8 bước.
  4. Nếu chủ đầu tư chọn **FDL**: hướng dẫn nhận FAIL chỉ có ở sổ vận hành 2.3 bước 6 và `01` 17.1. FDL đọc tệp `02` và sổ vận hành mục 1, không đọc hai chỗ đó.
- Vì sao quan trọng: tin cảnh báo không có dữ liệu khách (OR-L7). Rủi ro nằm ở quyền trên phòng và ở người nhận FAIL mà không biết phải làm gì.
- Đề xuất sửa:
  - 7.2 "Cách thêm": "thêm là **thành viên** (không làm quản lý phòng); điện thoại người đó đã cài theo `01` mục 12.1; trong phòng không có ứng dụng hay webhook nào khác ngoài `ottimo-alert`; cho người đó đọc mục 2.3 bước 6".
  - Bước 5 của khối 8 bước (`01` 1.9 và sổ tay 1.5): thêm "và phòng 'OTTIMO – Báo động' nếu người đó là người thứ hai".
  - Tùy chọn: thêm 3 dòng 2.3 bước 6 vào `02` mục 13 hoặc 15.
- Trạng thái: Open

### FB-R5-SEC-BA-08
- Mức độ: Minor
- Vị trí: sổ tay 2.9 bước 3 (dòng 1015); `guides/02` 17.3 bước 3 (dòng 1638), 16.2 (dòng 1543).
- Vấn đề: "Gửi riêng 1–1 **cho khách của đơn**" chưa nói gửi **tới đâu**. Link là thẻ vào cửa: ai cầm cũng vào được mức 1. SR-GST-13 đã đặt luật cho mã xác minh: chỉ gửi tới hội thoại OTA của đơn, Zalo hoặc email của liên hệ trên đơn, không gửi tới tài khoản khác "dù người nhắn tự xưng là khách". Link nên theo cùng luật.
- Vì sao quan trọng: cách gửi nhầm hay gặp nhất là người lạ nhắn từ số khác, xưng là khách, xin link. Đây cũng là cách phòng FB-R5-SEC-BA-01 từ gốc.
- Đề xuất sửa: bước 3 thêm: "tới số điện thoại (Zalo), email hoặc hội thoại OTA **ghi trên đơn**. Người nhắn từ số hoặc tài khoản khác, dù xưng là khách: không gửi; gửi tới liên hệ trên đơn, hoặc mời làm thủ tục tại quầy. Đơn CTV: gửi khách, không gửi CTV."
- Trạng thái: Open

### FB-R5-SEC-BA-09
- Mức độ: Minor
- Vị trí:
  - sổ tay 2.4 (dòng 808), 2.9 khung đầu và bước 1, 5.6 dòng "Khung đơn giữ chỗ hiện nút link…", 5.7;
  - `guides/02` 4.5 (dòng 323), 17.3 (dòng 1631);
  - `guides/05` 4.2;
  - `guides/00-index` mục 7;
  - báo cáo BA mục 1 "Câu còn đúng".
- Vấn đề: câu "đơn giữ chỗ cũng hiện nút **Tạo link check-in online**, Desk luôn từ chối (dự kiến sửa ở v1.0.5)" đã sai từ v1.0.4. BUG-R3-047 đã sửa ở `5539b7e6`: đơn giữ chỗ không còn nút này (release notes v1.0.4; plan R5 mục 8 ý 8). PO phát hiện. ORC đã giao BA sửa.
- Vì sao quan trọng: không có tác động bảo mật, vì luật "chỉ đơn đã xác nhận" vẫn đúng, máy chủ vẫn từ chối. Ghi lại để ĐK-5 khép đúng sự thật.
- Đề xuất sửa: thay bằng "Đơn giữ chỗ không có nút link: xác nhận cọc trước." Giữ nguyên luật chỉ đơn đã xác nhận.
- Trạng thái: **Đang sửa (BA)**

### FB-R5-SEC-BA-10
- Mức độ: Suggestion
- Vị trí: sổ tay 2.9 khung đầu ("Đội bảo mật đã kiểm xong"); `01` 15.4; `02` 17.3.
- Vấn đề:
  - N6 / K11 (d) chưa chạy: SEC đếm sau lượt đồng ý thật đầu tiên. "Đã kiểm xong" nói hơi quá.
  - Khi có lệnh dừng, các câu chỉ nói "ngừng tạo, ngừng gửi". Chưa nói gì về link đã gửi mà khách chưa dùng.
- Đề xuất sửa:
  - "Đội bảo mật đã kiểm trang khách (06/11); còn kiểm lượt đồng ý thật đầu tiên."
  - Thêm vào ý dừng: "Link đã gửi: đội báo có cần thu hồi không. Chưa có lời đội thì không tự thu hồi."
- Trạng thái: Open

### FB-R5-SEC-BA-11
- Mức độ: Suggestion
- Vị trí: `so-van-hanh.md` 5.4 dòng 323, ý (c).
- Vấn đề: FileVault trên Mac của INV đã được xác nhận ngày 27/10 (decision-log). Câu hỏi lặp lại nguyên văn câu B4 (c) của SEC.
- Đề xuất sửa: "(c) FileVault trên Mac vẫn bật (đã xác nhận 27/10)". INV chỉ cần trả lời "vẫn bật". Bớt một câu phải nghĩ trong danh sách vốn đã dài.
- Trạng thái: Open

---

## 3. Thẻ feedback – PO, tờ dán quầy (`staff-one-pager.md`, commit `8d607f98`)

**Khối "Check-in online – mở lại từ 06/11/2026" ở Tờ 1, đối chiếu N4–N6:**
- Đạt:
  - người gửi (sale, CTV không gửi);
  - chỉ đơn đã xác nhận, đơn giữ chỗ thì xác nhận cọc trước; câu này đúng với v1.0.4, không mắc lỗi của BA-09;
  - link hiện một lần, không chụp hộp link;
  - gửi riêng 1–1, không nhóm chat, không mã cửa, không số căn;
  - lệnh dừng của chủ đầu tư.
- Thiếu: bước sau khi gửi nhầm (PO-01).

**Tờ 2a:** phần in không còn chữ nào về check-in online. Chữ "check-in" chỉ còn trong chú thích HTML, bản in bỏ qua. SEC **không chặn** in Tờ 2a. Nội dung giữ chỗ thuộc phần DOM review.

### FB-R5-SEC-PO-01
- Mức độ: Major (chặn in Tờ 1)
- Vị trí: `product/docs/staff-one-pager.md` Tờ 1, khối "Check-in online", gạch 3 (dòng 50).
- Vấn đề: "**Gửi nhầm người:** **Thu hồi link** ngay, rồi tạo link mới cho đúng khách." Giả định của PO là không cần báo chủ đầu tư. **SEC quyết: cần báo.** Lý do như FB-R5-SEC-BA-01:
  - người ngoài đã thấy dữ liệu mức 1 của khách, và ghi được vào đơn tới lúc thu hồi;
  - chỉ chủ đầu tư, cùng SEC, quyết có phải sự cố phải báo trong 72 giờ không;
  - Tờ 1 là thứ người trực nhìn mỗi ca, nên bước này phải có ở đây, không chỉ ở sổ tay. Thẻ D05 Round 3 đã nêu đúng điểm này với bản cũ.
- Vì sao quan trọng: tờ in khó sửa lại. In bản thiếu bước thì thói quen ở quầy sẽ theo bản in, kể cả khi sổ tay đã sửa.
- Đề xuất sửa (gọn cho 9 pt):
  - "**Gửi nhầm người:** **Thu hồi link** ngay, tạo link mới cho đúng khách. Ghi sổ giao ca mã đơn, giờ gửi, giờ thu hồi (không ghi tên, số của người nhận nhầm). **Báo chủ đầu tư trong ngày.** Đơn đã hiện **Đã làm thủ tục trước** mà khách nói chưa gửi: không dùng giấy tờ đó, báo chủ đầu tư ngay."
  - Tách "Chủ đầu tư báo 'dừng check-in online'…" thành một gạch riêng.
- Trạng thái: **Fixed** – PO 06/11 tối, commit "round-5: Phản hồi & sửa – PO one-pager SEC cards…". Tờ 1 dòng "Gửi nhầm người" theo đúng câu SEC đề xuất, thêm "kênh" và "không ghi tên khách" như BA-01 ý 2; lệnh dừng tách gạch riêng. PO bỏ giả định "không báo". Chờ SEC đọc lại dòng này, rồi INV in Tờ 1 (`rounds/round-05/responses/PO-responses.md`) → **Closed – SEC đọc lại 06/11 tối** (mục 3a). Tờ 1 được in

### FB-R5-SEC-PO-02
- Mức độ: Minor (nên sửa trong cùng lần in Tờ 1)
- Vị trí: Tờ 1, khối "Check-in online", gạch 2 (dòng 49).
- Vấn đề: như FB-R5-SEC-BA-08. "Gửi riêng 1–1 cho khách của đơn" chưa nói gửi tới liên hệ trên đơn, và chưa nói không gửi cho người tự xưng là khách từ số khác.
- Đề xuất sửa: "**Gửi riêng 1–1** tới số, email hoặc hội thoại OTA **ghi trên đơn**, từ điện thoại cơ sở hoặc email của OTTIMO. Người xin link từ số khác: không gửi." Phần còn lại giữ nguyên.
- Trạng thái: **Fixed** – PO 06/11 tối, cùng commit với PO-01. Tờ 1 gạch 2 theo câu SEC đề xuất: gửi tới số, email hoặc hội thoại OTA ghi trên đơn; người xin link từ số khác thì không gửi → **Closed – SEC đọc lại 06/11 tối** (mục 3a)

### FB-R5-SEC-PO-03
- Mức độ: Suggestion
- Vị trí: Tờ 2a, chú thích HTML đầu tờ.
- Vấn đề: chú thích vẫn còn "Điều kiện bỏ khối check-in: SEC-on-PO-v1.0.0-docs.md mục C.1 …" dù khối đã bỏ. Không in ra, chỉ dễ gây nhầm cho người sửa sau.
- Đề xuất sửa: bỏ vế này, giữ câu "Khối check-in online đã bỏ 06/11/2026".
- Trạng thái: **Fixed** – PO 06/11 tối, cùng commit với PO-01. Bỏ vế "Điều kiện bỏ khối check-in…" ở chú thích đầu Tờ 2a, giữ câu "Khối check-in online đã bỏ 06/11/2026" → **Closed – SEC đọc lại 06/11 tối** (mục 3a)

### 3a. Đọc lại lượt 2 – tờ dán quầy (commit `106722d7`)

Round 5 · bước **Review**, lượt 2 · SEC · 06/11/2026 (tối). SEC đọc `product/docs/staff-one-pager.md` ở `106722d7`. Tệp này không đổi tới `main` lúc đọc. SEC cũng đọc `rounds/round-05/responses/PO-responses.md`.

| Thẻ | Kết quả | Bằng chứng |
|---|---|---|
| FB-R5-SEC-PO-01 (Major) | **Closed** | Tờ 1 dòng 50. Có đủ các ý: thu hồi ngay; tạo link mới cho đúng khách; ghi sổ giao ca mã đơn, giờ gửi, giờ thu hồi, kênh; không ghi tên khách, không ghi tên hay số của người nhận nhầm; **báo chủ đầu tư trong ngày**; đơn đã hiện **Đã làm thủ tục trước** mà khách nói chưa gửi thì không dùng giấy tờ đó và báo ngay. Lệnh dừng là gạch riêng ở dòng 51. Khớp BA-01 ý 1–4. Phần đối chiếu bản gốc và **Xóa ảnh** để ở sổ tay, vì đó là việc của quản lý, không cần lên tờ quầy |
| FB-R5-SEC-PO-02 (Minor) | **Closed** | Tờ 1 dòng 49: gửi riêng 1–1 tới số, email hoặc hội thoại OTA **ghi trên đơn**; người xin link từ số khác thì không gửi. Vẫn giữ: không nhóm chat, không mã cửa, không số căn, sale và CTV không gửi |
| FB-R5-SEC-PO-03 (Suggestion) | **Closed** | Chú thích đầu Tờ 2a không còn vế "Điều kiện bỏ khối check-in…" |

- **Tờ 1: được in.** Khối check-in online nay đủ 5 điều kiện ở mục 1.2: ai gửi, chỉ đơn đã xác nhận, gửi riêng tới liên hệ trên đơn không kèm mã cửa, gửi nhầm thì làm gì, khi nào dừng. Không còn điều kiện bảo mật nào chặn việc in.
- **Tờ 2a: được in** (như lượt 1). Phần giữ chỗ chờ DOM đọc, ngoài phạm vi SEC.
- Ghi nhận, không phải điều kiện: khối check-in dài thêm khoảng 40 chữ. Tờ 1 là A4 hai cột 9 pt. In thử một bản xem có còn vừa một mặt không. Tràn thì PO/UXD rút chữ chỗ khác, **không** rút dòng "Gửi nhầm người".
- Kiểm lộ thông tin trong phần sửa: 0 IP, 0 bí mật, 0 email, 0 dữ liệu khách.
- BA-01, BA-02 và các thẻ BA khác: chưa đọc lại. ORC gửi sau khi BA sửa xong. Trạng thái giữ nguyên ở mục 2.
- PO đã nhận runbook SR-INC-01 vào V5-74 (mục 5 ý 1), hạn 14/11, SEC viết. SEC nhận việc.

Dòng decision-log đề xuất (lượt 2):

`| 2026-11-06 | 5 | SEC – đọc lại tờ dán quầy (106722d7, rounds/round-05/reviews/SEC-on-ba-dk4-dk5.md mục 3a): FB-R5-SEC-PO-01 (Major), PO-02, PO-03 Closed. Tờ 1 được in: gửi nhầm link thì thu hồi, tạo link mới, ghi sổ giao ca mã đơn + giờ gửi/thu hồi + kênh, báo chủ đầu tư trong ngày; chỉ gửi tới liên hệ ghi trên đơn. Tờ 2a được in (phần giữ chỗ chờ DOM). In thử xem Tờ 1 còn vừa một mặt A4 | SEC | Quyền SEC (yêu cầu bảo mật, dữ liệu cá nhân) |`

---

## 4. Việc cho vai khác (không phải thẻ của BA, PO)

| Việc | Vai | Hạn | Liên quan |
|---|---|---|---|
| Lần kéo 08/11: kiểm Time Machine, iCloud (chỉ đọc), xin INV đồng ý trước khi loại thư mục khỏi Time Machine, ghi có/không vào decision-log. Ghi thêm mã thoát và giờ chạy như ĐK-3 | ORC | 08/11 | BA-02, BA-03 |
| Chọn giờ lượt dump hai (15:00, hoặc 14:00 và ghi 13 giờ). Cho con số mất dữ liệu khi máy chủ mất hẳn | OPS (+ ARC) | Trước 20/11 | BA-05 |
| V5-60: thông báo ngay khi lượt tự kéo lỗi, im lặng 48 giờ, mã 3 là P0 | OPS | Cùng V5-60 | BA-06 |
| Cách bỏ bản Time Machine cũ nếu có, INV tự xóa | OPS + SEC | Trước khi bản cũ nhất quá 35 ngày | BA-02 |

## 5. Việc SEC tự nhận

1. **Runbook sự cố dữ liệu SR-INC-01 chưa có** (phát hiện → khoanh vùng → đánh giá → 72 giờ → báo chủ thể). SEC + OPS viết một trang, kèm nhánh "server copy changed" và nhánh "gửi nhầm link". Đề xuất ORC xếp mã V5 (Minor). Tới khi có, BA-04 là lớp tạm ở sổ vận hành.
2. Sửa SR-BAK-01 theo con số OPS chốt (12 hoặc 13 giờ) khi V5-62 lên. Ghi rõ dòng "máy chủ mất hẳn" theo nhịp kéo.
3. Sửa phạm vi OR-02 điểm 3 trong hồ sơ SEC: loại khỏi Time Machine, iCloud áp cho **mọi** bản trên Mac từ 26/10, không chỉ lượt tự động.
4. N6 / K11 (d): SEC chạy sau lượt đồng ý thật đầu tiên, chỉ số đếm. Lệch thì báo dừng theo sổ tay 2.9.
5. Trả lời "gửi nhầm" cho đội trong ngày khi INV báo qua `/feedback` (BA-01 ý 5).

## 6. Giả định SEC dùng

- [GIẢ ĐỊNH] Chưa biết Mac của INV có bật Time Machine không. BA-02 viết theo trường hợp xấu. Không bật thì thẻ chỉ còn sửa chữ.
- Dữ liệu người nhận nhầm link thấy là mức 1, lấy theo mã `guest-portal.service.ts` ở `main` và ảnh C0-10. SEC không mở link nào.
- Con số 64 giờ ở BA-05 là ước tính, theo giờ kéo khoảng 19:00 và lượt sao lưu 03:00. OPS chốt.

## 7. Dòng decision-log đề xuất (ORC chép, SEC là người quyết)

`| 2026-11-06 | 5 | SEC – review BA sổ vận hành 1.2 + câu check-in online (4d25f5b7) và PO tờ dán quầy (8d607f98) (rounds/round-05/reviews/SEC-on-ba-dk4-dk5.md): DUYỆT CÓ ĐIỀU KIỆN. ĐK-4 đạt phần nội dung (kéo ≥ 2 ngày/lần, mã 3 = P0 bảo mật giữ bản Mac, tối đa 1 người thứ hai phòng Báo động báo INV, nhắc diễn tập 35 ngày); SEC chốt ngưỡng im lặng kéo tự động 48 giờ (V5-60), lượt lỗi báo ngay theo OR-02. ĐK-5 grep đạt. Gửi nhầm link check-in online: thu hồi, tạo link mới, ghi sổ giao ca mã đơn + giờ, BÁO CHỦ ĐẦU TƯ TRONG NGÀY (SEC quyết thay giả định PO; người ngoài thấy dữ liệu mức 1 và ghi được vào đơn tới khi thu hồi; chủ đầu tư + SEC quyết có phải sự cố 72 giờ). Link chỉ gửi tới liên hệ trên đơn. Tờ 1 chưa in tới khi sửa dòng gửi nhầm; Tờ 2a được in. Time Machine/iCloud phải loại cho mọi bản sao lưu trên Mac từ 26/10, không chỉ lượt tự động (sửa phạm vi OR-02.3): ORC kiểm ở lần kéo 08/11, đổi cấu hình máy INV chỉ khi INV đồng ý. Mất dữ liệu: OPS chọn lượt hai 15:00 (12 giờ) hoặc ghi 13 giờ; thêm con số khi máy chủ mất hẳn (ước khoảng 64 giờ với nhịp hiện nay). Thẻ: 3 Major (BA-01, BA-02, PO-01), 8 Minor, 3 Suggestion. Không ESC | SEC | Quyền SEC (mức rủi ro, yêu cầu bảo mật kỹ thuật, dữ liệu cá nhân) |`

---

## 8. Điểm làm tốt

- Sổ vận hành 1.2 nói đúng điều khó nói: con số "15 phút" cũ là sai, và mức thật hôm nay là 24 giờ. BA còn tự bắt lỗi 13 giờ mà chính SEC đã viết sai.
- Các câu cho INV và người thứ hai luôn nhắc "chỉ ghi vai, không ghi tên, email" và "không dán bí mật". Mục 6 thêm đúng câu "không xóa, không chuyển thư mục, kể cả khi có mã 3": đây là điều quan trọng nhất khi có sự cố.
- Tệp `05` cho sale, CTV có thêm "không chuyển tiếp link, chỉ nhắn mã đơn, không kèm tên hay số điện thoại khách". Đây là cách tối thiểu dữ liệu đúng chỗ.
