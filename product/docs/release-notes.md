# OTTIMO Desk – Release notes

Ghi chép thay đổi theo từng phiên bản, viết cho chủ đầu tư và nhân viên. Bản mới nhất ở trên.
Đánh số: `v1.0.0` bản chính · `v1.0.x` bản vá lỗi · `v1.x.0` bản thêm tính năng (quy trình: `rounds/round-03/release-v1-plan.md` mục 7).
Từ 01/11/2026 bản vá đi theo **đợt**: đợt nào xong trước thì lên trước, mỗi đợt nhận số kế tiếp (`rounds/round-04/plan-v1.0.1.md` mục 2). Kế hoạch cũ gom mọi việc vào một bản vá ngày 04/11. Nay chia như sau:

- **v1.0.1** – tin Google Chat. Đã phát hành 03/11.
- **v1.0.2** – trả phòng sớm, giá hẹn theo ngày. Đã phát hành 03/11.
- **v1.0.3** – email nhận thông báo bảo mật. Đã phát hành 04/11.
- **v1.0.4** – giữ chỗ quá hạn, đăng nhập 2 bước trên app nhân viên, đặt lại xác thực 2 bước, ngày kết thúc HĐ khi gia hạn, giá hẹn của căn mới, thông báo xử lý dữ liệu bản 2, các lỗi tiền ở đặt phòng, nhận phòng, trả phòng. Đã phát hành 06/11 14:10.
- **Website mới (LP-v2)** – 5 ngôn ngữ, form gửi yêu cầu, giá ước tính. Đã phát hành 06/11, cùng mã với v1.0.4 (tag `landing-v2.0.0`). Giá web bật cùng ngày.
- **v1.0.5** – bản bảo trì đợt 1: chỉ sửa lỗi và việc đã hẹn. **Đang làm** (Round 5). Lên production khi anh/chị đồng ý, dự kiến xem ở buổi review 20/11.

PO chốt phạm vi v1.0.3 ngày 03/11 (`rounds/round-04/plan-v1.0.3.md`): v1.0.3 chỉ sửa thư báo bảo mật để chắc kịp hạn 09/11. Các bảng "Chưa có" bên dưới đã ghi theo số mới (cập nhật 04/11).

---

## v1.0.5 – Bản bảo trì đợt 1 (đang làm)

- Trạng thái: **ĐANG LÀM** – Round 5, bắt đầu tối 06/11/2026. Kế hoạch chi tiết: `rounds/round-05/plan.md`.
- Bản này **chỉ sửa**: lỗi tiền hoặc giá, các cách làm tạm ở quầy, bảo mật và dữ liệu cá nhân, chữ sai sự thật. Không thêm tính năng. Không đổi giá, cọc, hoàn, hủy.
- Lịch dự kiến: đội làm và kiểm 07–19/11 → anh/chị xem kết quả ở buổi review **20/11** → lên production khi anh/chị đồng ý (20–21/11, dự phòng tới 25/11).
- Trước khi lên: nếu bản có thay đổi cấu trúc dữ liệu (đội báo khi cắt bản), đội phải **diễn tập khôi phục từ bản sao lưu** đạt trước. Buổi diễn tập cần anh/chị khoảng 30 phút để mở khóa giải mã.
- Phần **hoa hồng theo bảng nội bộ** có hạn **01/12**. Tới 25/11 mà v1.0.5 chưa lên, đội tách phần này thành bản riêng. Bản riêng đó vẫn chờ anh/chị đồng ý.
- Tới khi v1.0.5 lên: làm theo mục v1.0.4 **Giới hạn đã biết và cách làm ở quầy** bên dưới.

### Dự kiến có (ghi chi tiết khi cắt bản)

| Nhóm | Anh/chị và nhân viên sẽ thấy gì | Việc |
|---|---|---|
| **Trả phòng và tiền ở quầy** | Nút **Trả phòng** có từ 00:00 cho khách đi đúng ngày, ghi được giờ khách rời thật. **Trả sớm** lúc 00:00–05:59 đặt sẵn đúng ngày. **Tổng cộng** ở bước Bill gồm đêm thêm. Trang Trả phòng và folio hiện tổng tiền đang chờ hoàn của đơn, kể cả yêu cầu người khác tạo. Giữ chỗ theo đúng giá đã gõ. Trả phòng được đơn quá ngày đi, có nút **Cần dọn**. Lễ tân, lễ tân trưởng chỉ tự sửa giảm (bỏ, giảm số lượng, giảm giá) dòng phát sinh do chính mình nhập trong ngày; dòng của người khác, dòng Desk tự ghi hoặc dòng ngày trước phải **Gửi miễn có duyệt**. Quản lý có bộ lọc "Sửa giảm dòng – 7 ngày". Hộp chấp nhận cọc thiếu nói rõ phần tiền chưa đối soát | V5-10 … V5-18 |
| **Chữ và tham số theo bảng giá 01/11** | Bỏ chữ theo mức cũ ("Từ 28 đêm…", nhãn "+15 %"). Tham số anh/chị phải chỉnh có tên tiếng Việt. Ô giá OTA ghi "Không cần nhập". Câu giá ngoài sàn–trần có số thật. Một lượt sửa các câu sai sự thật. Tiếng Nga trên trang khách đúng từ và đúng font. Báo giá và trang khách tiếng Việt gọi là "phòng", không gọi "căn" | V5-20 … V5-24 |
| **Tham số ở tối thiểu và đêm cuối tuần** | Lưu ô **Ở tối thiểu** (`min_stay`) hay **Đêm tính là cuối tuần** (`weekend_nights`) sai dạng thì Desk từ chối, nói rõ dạng đúng và giữ nguyên giá trị đang chạy; lưu lại đúng giá trị đang chạy thì được. Một lần lưu sai không còn làm báo giá, đặt phòng hay giá trên web dừng cả ngày. Bỏ lời dặn tạm "không bấm Lưu thay đổi" ở hai ô này | V5-25 |
| **Hoa hồng và phí dọn thuê tháng** | Hoa hồng nhập theo bảng nội bộ trên Desk, không có số mặc định trong phần mềm (hạn 01/12). Phí dọn theo lượt cho khách thuê tháng theo hạng | V5-30, V5-31 |
| **Bảo mật nhỏ** | Desk bắt lễ tân trưởng bật 2 bước. Anh/chị đặt được hạn lưu ảnh giấy tờ 90 ngày. Trang khách báo rõ khi chặn số giấy tờ. Tờ in ở quầy và trang khách luôn cùng chữ. Đơn đã hủy hoặc không đến chỉ nhận khoản thu chuyển khoản hoặc VietQR kèm ảnh chứng từ, luôn chờ đối soát, với mọi người kể cả chủ đầu tư; không tạo mã VietQR mới, không xác nhận mã cũ trên đơn này. Hộp **Xác nhận cọc** mở từ trước lúc đơn tự hủy sẽ báo rõ đơn đã hủy | V5-40 … V5-48 |
| **Lỗi nhỏ ở quầy** (nên có; không kịp thì sang v1.0.6) | Hộp **Đổi phòng** bỏ căn chưa dọn. Ô **Mã giao dịch** khi xác nhận cọc. Tìm đơn theo tên khách. Ô nhập Wi-Fi trên Desk. Desk hiện cả giá web khách đã thấy lúc gửi ("từ – đến"). Tiền khách chuyển về cho đơn đã hủy hoặc không đến: lễ tân trở lên ghi được trên Desk (chỉ chuyển khoản, VietQR, kèm ảnh chứng từ), Desk tự tạo yêu cầu hoàn đủ số; sale, CTV báo "khách đã chuyển" thì lễ tân thấy ở **Cần chú ý**. Phần chưa xong trước khi cắt bản sang v1.0.6 | V5-50 … V5-5B, V5-19 |
| **Vận hành** | Kéo bản sao lưu ra ngoài máy chủ an toàn hơn, tự động khi anh/chị đồng ý cài. Thêm lượt sao lưu 15:00: mức mất dữ liệu tối đa còn 12 giờ. Giữ nhật ký máy chủ qua các lần lên bản. Nhắc hạn tên miền, máy chủ. Báo khi tin Google Chat không gửi được. Có các bước viết sẵn khi dữ liệu khách tới nhầm người, ví dụ gửi nhầm link check-in online | V5-60 … V5-74 |

### Không có trong v1.0.5

Tính năng mới, đổi chính sách giá, cọc, hoàn, hủy, kết nối kênh OTA tự động, chấm công, báo cáo xuất file. Các việc này nằm ở backlog cải tiến. Anh/chị chọn việc cho bản sau ở buổi review định kỳ (2 tuần một lần, buổi đầu 20/11).

---

## v1.0.4 – Giữ chỗ quá hạn, đăng nhập 2 bước trên app nhân viên, các lỗi tiền ở quầy

- Trạng thái: **ĐÃ PHÁT HÀNH – tag `v1.0.4` trên commit `6414be25`**, production chạy từ **06/11/2026 14:10**. Cổng QC: **ĐẠT CÓ ĐIỀU KIỆN** (`rounds/round-04/qc/QC-v1.0.4-release.md`). Anh/chị cho phép phát hành 06/11. Đội sao lưu ngay trước khi lên. Lượt kiểm sau khi lên đạt ở mọi mục chạy được ngay; mục kiểm theo lượt khách đồng ý thật đầu tiên làm sau.
- Website mới LP-v2 lên cùng ngày, cùng mã (tag `landing-v2.0.0`). Giá web bật 06/11 (xem **Giới hạn đã biết**).
- Gồm: website mới LP-v2 phần máy chủ và Desk (#34), hợp đồng dữ liệu 0.3.12 (#35), nút **Hủy lịch** (#37), các PR #38–#68 và #70–#91. Mỗi PR qua duyệt chéo và kiểm tự động trước khi gộp. #69 là tài liệu, chưa gộp (dòng **Hướng dẫn**).
- Ngày phát hành: 06/11/2026
- Áp dụng từ 06/11/2026 14:10. Các khối "tới v1.0.3" của sổ tay (đổi kênh, giá đơn OTA và Nội bộ, giữ chỗ khi có giá thỏa thuận, nhận phòng vào căn còn khách, minibar hai tủ) hết hiệu lực: Desk đã làm thay. Các cách làm ở mục **Giới hạn đã biết và cách làm ở quầy** vẫn dùng tới v1.0.5.
- Hướng dẫn: sổ tay bản nội dung **1.13** và bộ hướng dẫn theo bộ phận bản **1.11** trên `main` là bản đang dùng. Hai bản này đã gồm phần sửa của #72 (nhận phòng vào căn còn khách, minibar hai tủ và đổi phòng, đơn quá ngày đi, giá đơn Nội bộ), #85 (giá theo bảng 01/11, khách đi trước 06:00) và #89 (các chỗ nhỏ sau #85, bỏ tỷ lệ hoa hồng khỏi sổ tay).
  - **#69 chưa gộp** lúc tối 06/11 vì xung đột với `main`. #69 nâng sổ tay lên **1.14**, bộ hướng dẫn lên **1.12** và gỡ lời dặn "không bật 2 bước ở v1.0.x". BA gộp ở Gói 0 của Round 5; đội ghi số bản mới ở đây khi gộp. **Đã gộp 06/11/2026 (21:01).** Cùng hai khối sửa 06/11 dưới đây, số bản mới: sổ tay bản nội dung **1.15**, bộ hướng dẫn **1.13** (UXD đánh số khi dựng lại HTML, V5-04). Tới lúc đó, lời dặn "không bật 2 bước ở v1.0.x" trong sổ tay **hết hiệu lực** (dòng **App nhân viên đăng nhập được bằng 2 bước** dưới đây).
  - Câu cũ "check-in online tạm dừng, chưa gửi link" trong sổ tay và bộ hướng dẫn: BA đã sửa tối 06/11 (khối "Sửa 06/11/2026 – Round 5, chưa đánh số bản" ở phần lịch sửa cuối sổ tay và cuối `00`). Có trong sổ tay **1.15** và bộ hướng dẫn **1.13** (V5-08).
  - Phần giữ chỗ quá hạn (sổ tay 2.4) chưa viết lại. Gặp giữ chỗ có cọc quá hạn thì làm theo bảng **Giữ chỗ và cọc** dưới đây, không theo các bước "Desk từ chối" của 2.4.
  - Các mục đổi theo bản này: `00` mục 2.1, 4; `01` mục 1.6a–1.9, 4, 7.3, 9.1, 9.2, 14.1; `02` mục 1.6, 1.7, 1.8, 5.1, 7.1, 7.2, 7.4, 9.3, 11.1, 11.5, 14.2, 14.3, 16, 17.5, 20.2; `03` mục 1.5, 1.6, 7; `04` mục 1.5; `05` mục 1.2, 1.6, 3; sổ tay mục 0.3a, 0.4, 1.3, 1.5, 1.8, 2.5, 2.10, 2.12, 2.14, 2.14a, 2.21, 3.1, 5.0, 5.2, 5.6.

### Có trong bản này

**Giữ chỗ và cọc**

| Thay đổi | Anh/chị và nhân viên thấy gì | Nguồn |
|---|---|---|
| **Giữ chỗ có cọc mà quá hạn: không còn bị khóa** | Đơn đã nhận một phần cọc thì không tự hủy, căn vẫn giữ. Khung đơn ghi "Quá hạn giữ chỗ lúc … Đã nhận …/… nên đơn chưa hủy, căn vẫn giữ." Lễ tân trở lên thu nốt cọc và **Xác nhận đã nhận cọc** được tới khi nhận phòng. Ô mới **Giờ nhận tiền**: ghi lùi được, không ghi giờ sau bây giờ. Giữ chỗ **chưa** cọc vẫn chỉ xác nhận được khi tiền về trước hạn. Sale, CTV không ghi tiền vào giữ chỗ đã quá hạn: chuyển lễ tân | BUG-R3-042 (P1), SEC HOLDS-01 |
| **Chấp nhận cọc thiếu** | Chủ đầu tư và quản lý tích **Chấp nhận cọc thiếu (phần còn lại thu khi nhận phòng)**, ghi lý do (ít nhất 3 ký tự). Đơn thành **Đã xác nhận**, phần còn lại thu lúc nhận phòng. Vai khác không thấy ô này | BUG-R3-043, BR-303 |
| **Báo giữ chỗ quá hạn** | **Trên Desk:** lễ tân trở lên thấy mục giữ chỗ quá hạn ở **Cần chú ý** tới khi đơn được xử lý; quản lý và chủ đầu tư thấy thêm mục "còn chờ cọc sau 12:00 ngày đến – quản lý quyết". Trang **Hôm nay** có khối **Giữ chỗ chờ cọc (n)**. **Trên app nhân viên**, hộp **Thông báo** có tin cho 3 trường hợp, không ghi tên khách: "Giữ chỗ có cọc đã quá hạn – căn vẫn giữ" (người tạo, người chốt, lễ tân, lễ tân trưởng, quản lý); "Giữ chỗ chưa cọc đã hết hạn và tự hủy" (người tạo, người chốt; không còn ai thì lễ tân và lễ tân trưởng); "Giữ chỗ còn chờ cọc sau mốc giờ ngày đến – quản lý quyết" (quản lý, chủ đầu tư). **Sale, CTV chỉ dùng Desk nên không nhận các tin này**: tiếp tục mở **Đơn của tôi** đầu ngày và xử lý khi Desk nhắc **Giữ chỗ sắp hết hạn** (`05` mục 2), như hiện nay | BUG-R3-041, DOM A.5 |
| **Hủy giữ chỗ** | Hộp hủy giữ chỗ có cọc ghi trước "Không thu phí. Sẽ tạo yêu cầu hoàn … – cần quản lý duyệt." Hủy với lý do **Khác (ghi rõ)** làm được (trước đây nút hủy bị khóa). Giữ chỗ chưa cọc có yêu cầu giảm giá hoặc FOC đang chờ cũng tự hủy khi hết hạn, yêu cầu đó hủy theo. Đơn giữ chỗ không còn nút tạo link check-in | BUG-R3-044, 046, 047 |
| **Hộp Giữ chỗ sau khi tạo** | Số cọc và nội dung chuyển khoản in một lần. Khách đến hôm nay: không hiện bộ chọn 12/24/48 giờ và mốc hạn đã qua | BUG-R2-216, 219 (#60) |
| **Giữ chỗ khi có giá đã gõ** | Nút **Giữ chỗ đến …** khóa, kèm câu: "Giữ chỗ chỉ theo giá niêm yết. Đã nhận cọc thì bấm Tạo đơn để lưu giá đã gõ. Chưa nhận cọc thì xóa giá đã gõ rồi giữ chỗ, xác nhận cọc xong thì Điều chỉnh giá ở Folio." Trước đây giữ chỗ bỏ giá đã gõ mà không báo, cọc tính theo giá niêm yết. Giữ chỗ theo đúng giá thỏa thuận: v1.0.5 (V5-14) | BUG-R4-041 (#75) |
| **Gia hạn giữ chỗ** | Hạn rơi vào 00:00–06:59 hiện đúng ngày ở nút "Gia hạn đến …" và ở câu báo sau khi gia hạn. Trước đây sớm một ngày | BUG-R4-044 (#80) |

**Đặt phòng**

| Thay đổi | Anh/chị và nhân viên thấy gì | Nguồn |
|---|---|---|
| **Giá đã gõ khi đổi kênh, đổi căn** | Đổi kênh sang hoặc khỏi **OTA**, **Nội bộ**: Desk xóa giá đã gõ và báo "Đã xóa giá đã gõ vì đổi kênh." Đổi căn Trực tiếp, CTV sang nhóm căn khác: Desk cũng xóa và báo. Đổi số khách, đổi ngày, đổi căn cùng nhóm: giá đã gõ giữ nguyên. Trước đây giá Trực tiếp có thể ở lại trong đơn OTA hoặc Nội bộ mà không báo | BUG-R4-037 (P0, #70) |
| **Đơn OTA để trống giá** | Desk lấy giá đêm niêm yết của căn cho từng đêm. Không cần nhập `ota_base_rate`. Đã có dòng này thì dòng này được ưu tiên: đổi cùng lúc với bảng giá | #73, BR-103 |
| **Đơn Nội bộ: giá cho mọi đêm, hoặc để trống hết** | Gõ giá cho một phần số đêm thì Desk chặn, không tạo đơn: "Đơn Nội bộ: nhập giá cho mọi đêm, hoặc để trống hết nếu miễn phí cả đơn." Gõ 0 vào ô thì Desk báo "Miễn phí: để trống ô. Có thu: nhập giá lớn hơn 0." Trước đây đơn lưu 0 đ cho mọi đêm mà không báo | BUG-R4-046 (P0, #82), BR-105 |
| **Cột Nguồn giá** | Ô có số đã gõ ghi **Giá đã gõ**, ô trống ghi "–", ô Desk điền ghi **Giá niêm yết**. Không còn nhãn "+15%" theo thứ trong tuần. Trong lúc chờ bản xem giá, các ô tiền của bảng tổng hiện "–" | #82 |

**Nhận phòng**

| Thay đổi | Anh/chị và nhân viên thấy gì | Nguồn |
|---|---|---|
| **Không nhận phòng vào căn còn khách** | Căn còn khách của đơn trước (`OC`, `OD`) hoặc còn đơn khác đang ở: Desk chặn với mọi vai, không có ô lý do, không xin duyệt. Câu báo nêu căn, mã đơn đang giữ căn và cách làm: trả phòng đơn đó trước, mời khách chờ, hoặc đổi đơn sang căn trống. Căn vẫn hiện có khách mà không còn đơn nào đang ở: đổi căn và báo quản lý sửa trạng thái. Ngoại lệ "buồng chưa sẵn sàng" của lễ tân trưởng chỉ còn cho căn `VD`, `CL` | BUG-R4-039 (#74, #77, #79), BR-402 |
| **Đơn chưa gán căn** | Màn nhận phòng không còn in trạng thái buồng và sức chứa không có thật. Dòng "Đơn đã được gán căn" nói nguyên nhân | BUG-R4-049 (#84) |

**Trả phòng, minibar, đơn Nội bộ**

| Thay đổi | Anh/chị và nhân viên thấy gì | Nguồn |
|---|---|---|
| **Đếm minibar khi trả phòng** | Nút **Tiếp tục** chờ Desk đọc xong số trong tủ, không còn gửi "tủ đầy" khi bấm quá nhanh. Khách có hai tủ (đổi căn giữa kỳ): Desk nhớ tủ đã đếm, không quay lại tủ đó; màn đếm ghi tên tủ; nút chính ghi "Tiếp tục: Tủ căn …"; lưu xong báo "Đã lưu số đếm tủ căn …." Máy chủ đòi đếm lại một tủ (tủ vừa bổ sung, vừa gia hạn) thì Desk đưa về bước **Minibar** đúng tủ đó. **Quay lại** rồi bấm **Tiếp tục** không còn báo nhầm "Tủ vừa được bổ sung…". Số lễ tân vừa gõ không bị đặt lại. Trước đây có lúc dòng minibar đã tính bị đảo mất. Tới khi lên: chờ bảng tủ hiện đủ số rồi mới bấm **Tiếp tục**, xem bill có khoản minibar của mọi tủ trước khi thu tiền (sổ tay 2.14) | BUG-R4-035 (P1, #67), BUG-R4-042 (P1, #81), BUG-R4-045, 047, 048 (#83; 048 chỉ có trên bản nháp, chưa từng lên) |
| **Đêm thêm của đơn Nội bộ** | Gia hạn và đêm thêm lúc nhận phòng, trả phòng của đơn Nội bộ mặc định 0 đ; có thu thì gõ giá lớn hơn 0. Phụ thu trả muộn, nhận sớm tính theo giá đêm của chính đơn (đêm 0 đ thì không phụ thu). Quản lý, chủ đầu tư sửa được đêm Nội bộ về 0 ở **Folio** (ghi lý do). Trước đây đêm thêm lấy giá Trực tiếp | BUG-R4-038 (P0, #71), BR-421 |
| **Đang chờ hoàn ở trang Trả phòng** | Bước **Bill** và màn **Kết quả** có dòng "Đang chờ hoàn cho khách … (yêu cầu từ Trả sớm)." Mở **Trả phòng** trước ngày đi thì Desk chỉ sang **Trả sớm** | P4-32, BUG-R3-024 (#64) |
| **Trả phòng sau 24:00 của ngày đi** | Trả phòng lúc 00:00–05:59 sáng hôm sau ngày đi: mã VietQR nhận đúng số **Còn phải thu**, giá đêm thêm đã sửa được tính lại. Trước đây VietQR bị từ chối ("Số tiền lớn hơn số còn phải thu") và Bill hiện giá gợi ý. Tới khi lên, kể cả trên bản đang chạy: ca này thu tiền mặt hoặc thẻ qua máy POS, thu theo giá gợi ý, không sửa giá đêm thêm | BUG-R4-050 (P2, #86) |

**Tài khoản và đăng nhập 2 bước**

| Thay đổi | Anh/chị và nhân viên thấy gì | Nguồn |
|---|---|---|
| **Đặt lại xác thực 2 bước** cho người khác | Chủ đầu tư, **Người dùng & vai → Khác…**. Người mất cả điện thoại lẫn mã khôi phục **giữ tài khoản cũ**. Chủ đầu tư gặp tận mặt, ghi lý do, xác nhận bằng mật khẩu và mã. Desk đăng xuất người đó trên mọi máy, mã khôi phục cũ hết hiệu lực, mật khẩu giữ nguyên, thư "Security notice: 2-step verification was reset" tới người đó và mọi chủ đầu tư (thư này anh/chị biết trước, không cần làm gì). Quản lý và lễ tân trưởng bật lại 2 bước ngay buổi đó. Thay cách khóa tài khoản rồi tạo tài khoản mới. Hướng dẫn từng bước: sổ tay mục 1.5, `01` 1.9 | BUG-R4-020, BUG-R4-032 (#63) |
| **Đặt lại 2 bước đã có người làm trước** | Desk báo "Đã có người đổi xác thực 2 bước của {tên} trước bạn – hiện không còn bật, nên không cần đặt lại. Danh sách đã được tải lại." | #65 |
| **Menu Khác…** ở **Người dùng & vai** | Cột **Thao tác** còn **Sửa vai** và **Khác…** (tài khoản đã khóa có thêm **Mở khóa**). **Đặt lại mật khẩu**, **Khóa tài khoản** nằm trong **Khác…**. Cột Email không còn ngắt giữa địa chỉ. Hộp xác nhận chỉ có ô mật khẩu báo đúng khi sai mật khẩu | BUG-R4-020, 023, 024 |
| **App nhân viên đăng nhập được bằng 2 bước** | Sau mật khẩu, app hỏi **mã 6 số** hoặc mã khôi phục. Mật khẩu tạm đổi ngay trên app. Bật 2 bước vẫn làm trên Desk; app chỉ đường sang Desk khi cần. Người trực (vai quản lý) vào được app. Lời dặn "không bật 2 bước ở v1.0.x" **hết hiệu lực** | ARC-RN103-02, BUG-R3-052 |
| **Ai bật 2 bước** | Chủ đầu tư, quản lý: bắt buộc, Desk ép. Các vai khác theo mặc định đội chọn, anh/chị đổi được (báo đội): lễ tân trưởng bắt buộc (Desk chưa ép, dự kiến v1.0.5 – V5-40, nên anh/chị nhìn tận mắt người đó đã bật rồi mới giao việc); buồng phòng, bảo trì tùy chọn; sale nội bộ, CTV không bắt buộc, nên bật | DOM B.1; PO |
| **Người trực kiểm căn trên app nhân viên** (mặc định đội chọn, anh/chị đổi được) | Từ bản này người trực kiểm căn trên app, khoảng 1–2 phút mỗi căn. Giữ mốc 11:00 và 14:00. Nhận khách vào căn đã kiểm; căn còn chờ kiểm lúc khách tới thì kiểm trên app ngay, hoặc làm như nhận phòng khi buồng chưa sẵn sàng. App không vào được thì kiểm bằng mắt rồi chỉ bấm **Làm xong** như cũ (`02` mục 13.2a), ghi sổ giao ca | DOM B.2 |
| **Email nhận thông báo bảo mật** | Desk chặn thêm `booking@` (cùng `info@`), kể cả dạng `info+…@`. Gmail dùng cho OTA và hộp thư quầy vẫn phải tự tránh. Email của mỗi người đổi được tối đa 5 lần trong 24 giờ, kể cả khi chủ đầu tư đổi hộ. Xóa email lúc nào cũng làm được, nhưng lần xóa vẫn được tính. Các thư bảo mật cùng một bố cục, có dòng thời điểm. Tiêu đề mới: "Security notice: 2-step verification was reset" và "Security notice: receiving account update" (cả thư hủy lịch đổi tài khoản nhận). Ai lọc thư theo tiêu đề cũ thì sửa bộ lọc | EM-09, M18-01, CPY |

**Tiền, giá, tham số**

| Thay đổi | Anh/chị và nhân viên thấy gì | Nguồn |
|---|---|---|
| **Yêu cầu hoàn thay thế giữ nơi nhận** | Desk gộp các yêu cầu hoàn còn mở thành một yêu cầu thay thế thì giữ nơi nhận, nếu các yêu cầu cũ chỉ có một nơi nhận do một người nhập. Vẫn kiểm **Cách hoàn** trước khi duyệt; người nhập nơi nhận không tự duyệt. Hai nơi nhận khác nhau hoặc hai người nhập: nhập lại | DOM-BA-025-02 |
| **Chữ ở màn tiền** | **Nhật ký thao tác tiền**, **Cần duyệt**, **Hoàn tiền** ghi "Hoàn tiền khách trả thừa", "Hoàn khi trả sớm" thay cho mã `overpayment`. Hàng chờ duyệt hoàn ghi "Số có thể giảm khi duyệt…". Folio đơn đang ở chỉ còn một dòng **Còn phải thu**. Thông báo chi hoàn hết dấu trừ thừa. Folio đã khóa không hiện **Điều chỉnh**, **Thêm phát sinh**; câu báo nói rõ cả quản lý cũng không sửa được | BUG-R4-026, BUG-R2-103, 097, BUG-R3-045 |
| **Trả sớm – đơn HĐ thuê tháng đã gia hạn** | Desk giữ ngày kết thúc HĐ khi gia hạn, nên hộp **Trả sớm** chọn đúng nhánh: khách rời trong phần gia hạn không bị coi là trả trước hạn HĐ, không còn khung ký quỹ; tiền các ngày gia hạn và ký quỹ vẫn làm ngoài app như cũ (Desk không có dòng tiền cho phần gia hạn của đơn HĐ). Nhánh "đã thu tiền thuê tới hết HĐ" ghi thêm phát sinh chưa thu (minibar, dọn lẻ). Bước **Xem trước** bỏ câu sai "Trả phòng sau đó không tạo thêm yêu cầu." Không cần ghi "HĐ kết thúc…" vào sổ giao ca trước khi bấm **Gia hạn** nữa; bảng kỳ thu vẫn giữ cột ngày kết thúc HĐ (sổ tay 2.12 bước 6, 2.14a) | FB-R4-DOM-FE-A-01, BUG-R4-025 |
| **Giá hẹn của căn mới** | Desk không cho hủy dòng giá đầu tiên của căn mới (trước đây hủy được và căn không báo giá được tới ngày của dòng sau) | BUG-R4-015 |
| **Hủy lịch tham số** | Hộp sửa tham số ở **Tham số quy tắc** có nút **Hủy lịch** cho dòng hẹn chưa áp dụng. Dòng hẹn áp dụng từ 06:00 ngày đó, nên trước 06:00 vẫn hủy được. Dòng đã bắt đầu áp dụng thì không hủy được: lưu giá trị mới. Tài khoản nhận chuyển khoản giữ cách hủy riêng | P4-34 |
| **Vai chỉ Bảo trì trên Desk** | Tạo được **Phiếu sửa mới** và **Khóa phòng có kế hoạch**: ô **Căn** có danh sách căn | BUG-R3-053 |
| **Chữ dưới ô giá đêm ở trang Căn** | "Mọi đêm, kênh Trực tiếp, đã gồm VAT. Mức tăng cuối tuần, ngày đặc biệt (nếu có) ở Tham số quy tắc." thay câu cũ "…Cuối tuần, ngày đặc biệt do lịch giá cộng thêm." | ESC-045 (#87) |

**Khách và giấy tờ**

| Thay đổi | Anh/chị và nhân viên thấy gì | Nguồn |
|---|---|---|
| **Thông báo xử lý dữ liệu bản 2** | Trang khách có thông báo bản 2 bằng tiếng Việt, Anh, Nga. Tờ **Your ID details** bản v2 ở quầy (chân tờ "OTTIMO · ID notice · v2 · 11/2026"), tờ A4 EN/RU cho khách đọc tiếng Nga. Tham số `privacy_notice_version` chỉ nhận `privacy-2026-10-v2`; giá trị khác thì Desk báo "Giá trị này nằm ngoài khoảng cho phép…" và không lưu gì | V3-08, P4-16 |
| **Check-in online: đã mở lại 06/11** | Ngày lên bản, anh/chị thay tờ **Your ID details** bản v2 ở quầy và đặt `privacy_notice_version` = `privacy-2026-10-v2`. Đội bảo mật kiểm đạt, đội báo "mở lại" (bước N2–N5). Từ đó lễ tân gửi link check-in online cho đơn **đã xác nhận** theo sổ tay 2.9 (bỏ qua khung "Tạm dừng" của mục này). Đơn giữ chỗ không có nút tạo link | SEC 6.4, runbook N1–N5 |

**Sổ tay và tài liệu (gộp 05/11)**

| Thay đổi | Anh/chị và nhân viên thấy gì | Nguồn |
|---|---|---|
| **Sổ tay theo bảng giá 01/11** | Một giá mọi đêm, trẻ từ 6 tuổi 150.000 đ/đêm, không giảm theo số đêm, dài hạn từ 30 đêm, nhận sớm không phụ thu từ 11:00. Mỗi câu ghi "từ ngày chủ đầu tư chuyển giá" và có báo giá thử. Cách trả phòng cho khách đi trước 06:00 như mục **Giới hạn đã biết và cách làm ở quầy**. Minibar căn cũ bị ghi trùng: chỉ dòng trùng đó mới **Bỏ cả dòng**, ghi sổ giao ca | ESC-045 (#85) |
| **Sổ tay: các chỗ nhỏ sau #85** | Khách đi trước 06:00 mà quá 12:00 mới trả phòng; khách báo trả sớm trong ngày rời (phụ thu người các đêm bỏ vẫn hoàn); sổ tay không còn ghi tỷ lệ hoa hồng, Desk tự điền theo tỷ lệ chủ đầu tư cài | DOM-PR85-04, DOM-PR89-01, SEC-PR85-01 (#89) |
| **Tài liệu thiết kế trang Căn** | Bản thiết kế và hướng dẫn chữ dùng câu mới dưới ô giá đêm, khớp Desk | #88 |

### Việc trước khi lên (đã làm, hoặc anh/chị đổi cách làm)

1. **Lượt kiểm chỉ đọc trên production:** anh/chị cho phép, đội chạy 05/11 12:40. Mọi số đếm bằng 0: không có lần nhận phòng vào căn còn khách (BUG-R4-039), không có đơn bị giá sai do BUG-R4-037, 038, 046. Không có đơn nào cần sửa.
2. **Chuyển giá theo bảng 01/11:** ngày 06/11 anh/chị chọn bật giá web với bảng tham số đang chạy, rồi tự chỉnh một lần các tham số còn lại theo từ điển tham số (`product/docs/tham-so-quy-tac.md`). Các bước B1–B11 của hướng dẫn chuyển giá chưa làm hết. Số đang chạy và cách làm ở quầy: dòng **Giá theo bảng 01/11** ở mục **Giới hạn đã biết**.
3. **Kiểm giá:** web bằng Desk ở 4 ca mẫu trên production (06/11).

### Việc anh/chị làm sau khi lên

1. ~~Nhắn đội "v1.0.4 đã lên".~~ Đã xong 06/11. #69 chưa gộp: xem dòng **Hướng dẫn** ở đầu mục này.
2. ~~Ngày thay tờ v2.~~ Đã xong 06/11: tờ v2 ở quầy, `privacy_notice_version` = v2, đội bảo mật kiểm đạt, check-in online mở lại.
3. Người trực đăng nhập app nhân viên bằng mật khẩu và mã 6 số, kiểm căn trên app từ hôm đó.
4. Khi có lễ tân trưởng mới: ngồi cùng người đó bật 2 bước trên Desk ngay buổi đầu, nhìn tận mắt đã bật rồi mới giao việc (`01` mục 1.9 bước 8). Desk tự bắt bật từ v1.0.5 (V5-40).
5. **Giữ** lượt rà 3 mốc giữ chỗ mỗi ngày (cách rà ở sổ tay 2.4). Gặp giữ chỗ có cọc quá hạn thì xử lý theo bảng **Giữ chỗ và cọc** ở trên, không theo các bước "Desk từ chối" của 2.4. Đội báo bỏ lượt rà khi tin giữ chỗ quá hạn đã chạy đúng trên production. Lượt kiểm B1–B6 giữ tới khi đội bảo mật báo bỏ.
6. Chỉnh các tham số giá còn lệch sổ tay theo từ điển tham số, khi anh/chị sẵn sàng. Sau mỗi lần đổi, báo giá thử theo câu kiểm trong sổ tay. Đổi giá thì đổi **cả các căn cùng hạng một lần**. Muốn hai căn cùng hạng khác giá thì báo đội trước (V5-19).

### Thay đổi cấu trúc dữ liệu (đọc trước khi duyệt Release)

- Bản này có 4 thay đổi, đều **chỉ thêm, không sửa hay xóa dữ liệu cũ**: **0092** (ngôn ngữ và giá ước tính của website mới; khóa hiện giá mặc định tắt), **0093** (2 loại tin mới về giữ chỗ quá hạn), **0094** (chặn xóa dòng giá đã hoặc đang áp dụng), **0095** (chặn chặt hơn việc sửa, xóa bản thông báo quyền riêng tư đã đăng). Các bản sửa gộp ngày 05/11 không thêm thay đổi dữ liệu nào.
- Desk lỗi nặng sau khi lên: đội lùi **phần mềm** về v1.0.3, dữ liệu giữ nguyên (diễn tập trên staging trước QC). Trong lúc lùi:
  - giữ chỗ có cọc quá hạn lại bị khóa, tin giữ chỗ quá hạn và mục **Cần chú ý** mới không còn: lượt rà 3 mốc là cách duy nhất, làm theo sổ tay 2.4;
  - app nhân viên mất bước nhập mã, người đã bật 2 bước chỉ vào được Desk. Người trực (vai quản lý) không vào được app: kiểm căn bằng mắt rồi bấm **Làm xong** (`02` mục 13.2a), ghi sổ giao ca;
  - không có nút **Đặt lại xác thực 2 bước**;
  - Trả sớm của đơn HĐ đã gia hạn lại hiện khung "Trả trước hạn hợp đồng thuê tháng": làm theo khung lỗi ở sổ tay 2.14a (ký quỹ theo nhánh đã thu đủ, hỏi quản lý), lấy ngày kết thúc HĐ ở bảng kỳ thu;
  - dòng giá đầu tiên của căn mới lại hủy được: không hủy dòng giá của căn mới trong lúc lùi;
  - các lỗi ở nhóm **Đặt phòng**, **Nhận phòng**, **Trả phòng, minibar, đơn Nội bộ** và nút **Giữ chỗ** quay lại: làm theo các khối "tới v1.0.3" trong sổ tay (2.5, 2.10, 2.12, 2.14). Đổi kênh thì xóa trống mọi ô giá trước **Tạo đơn**; đơn OTA gõ đủ giá mọi đêm; đơn Nội bộ gõ đủ hoặc để trống hết, ở thêm thì không bấm **Gia hạn**; giá thỏa thuận thì không bấm **Giữ chỗ**; không xác nhận ngoại lệ nhận phòng cho căn còn khách; minibar hai tủ theo cách tạm ở sổ tay 2.14;
  - giới hạn đổi email tắt; trang khách vẫn đưa khách tới quầy.
- Khôi phục dữ liệu từ bản sao lưu chỉ làm khi dữ liệu hỏng và anh/chị quyết. Đội sao lưu ngay trước khi lên.
- Cách tính tiền phòng, cọc, folio so với v1.0.3 chỉ đổi ở các chỗ ghi trong bảng trên: đơn OTA để trống giá lấy giá niêm yết; đêm thêm của đơn Nội bộ 0 đ, phụ thu theo giá đêm của chính đơn; đơn Nội bộ gõ một phần số đêm bị chặn; các dòng giữ chỗ, yêu cầu hoàn và khung ký quỹ khi **Trả sớm đơn HĐ đã gia hạn**. Với đơn HĐ đã gia hạn mà khách rời trong phần gia hạn, Desk không còn hiện khung ký quỹ trả trước hạn HĐ. Desk không có dòng tiền cho các ngày gia hạn của đơn HĐ, nên không tự tính hoàn hay phí cho phần này: ký quỹ và tiền các ngày gia hạn vẫn làm ngoài app như cũ.
- Mức giá (tăng cuối tuần, ngày đặc biệt, giảm theo số đêm, phụ thu trẻ, nhận sớm, ngưỡng dài hạn) đi theo **Tham số quy tắc**, không đổi khi lên hay lùi phần mềm.

### Giới hạn đã biết và cách làm ở quầy

- **Khách đi trước 06:00** (BUG-R4-036, P1; **áp dụng ngay**, cả trên bản đang chạy). Nút **Trả phòng** chỉ hiện từ 06:00.
  - Lúc khách đi: thu thẻ, chìa khóa, xóa mã cửa, đếm minibar nếu kịp. Xem **Còn phải thu** ở khung đơn, cộng minibar vừa đếm, thu ngay bằng tiền mặt hoặc thẻ qua máy POS. Khách chỉ chuyển khoản được: ghi sổ giao ca số còn thu, đầu ca sáng báo quản lý. Ghi sổ giao ca giờ khách rời thật và khoản đã thu. Không bấm **Trả sớm** (trước 06:00 Desk vẫn tính là ngày hôm trước).
  - **Từ 06:00, trước 12:00:** khung đơn → **Trả phòng**. Ở bước **Phụ phí**, **để nguyên giờ Desk điền sẵn** ở ô **Giờ trả phòng thực tế**. Trước 12:00 Desk không phụ thu, không thêm đêm, nên tiền đúng. Ở bước **Bill & thu tiền**, ghi khoản đã thu lúc khách đi. Hoàn tất xong, ghi sổ giao ca "Trả phòng trên Desk lúc 06:xx, khách rời thật hh:mm".
  - **Quá 12:00 mới làm được:** gõ **12:00** ở **Giờ trả phòng thực tế**. Desk đòi **Ghi chú giờ trả (vì sao ghi bù)** thì ghi giờ rời thật, ví dụ "Khách rời hh:mm, trả phòng trên Desk lúc hh:mm", rồi hoàn tất lại. Không phụ thu (DOM-PR85-04).
  - **Không gõ giờ trước 06:00** (ví dụ 04:30). Desk sẽ hiện hộp đêm thêm và **Còn phải thu** sai, rồi báo "Giờ này muộn hơn hiện tại…" và không hoàn tất. Lỡ gõ: không thu theo số đó, không tạo mã VietQR, làm lại với giờ Desk điền sẵn. Cách làm cũ (từ 06:00 gõ giờ khách đi thật) **bỏ**.
  - Desk có nút **Trả phòng** từ 00:00 và ghi được giờ khách rời thật ở v1.0.5 (BUG-R4-036, 051 – V5-10). Hướng dẫn: sổ tay 2.14a bước 2, `02` 11.5.1 (#85, #89).
- **Trả sớm lúc 00:00–05:59:** ô **Ngày rời mới** đặt sẵn ngày hôm trước (Desk chưa sang ngày mới). Đổi thành **ngày lịch hôm nay** rồi mới bấm **Xem trước**. Khách rời đúng ngày đi ghi trên đơn: không dùng **Trả sớm**, làm **Trả phòng** từ 06:00 như dòng trên. Áp dụng ngay; sửa ở v1.0.5 (V5-11).
- **Trả sớm, khách báo trong ngày rời** (đơn Trực tiếp/CTV; áp dụng ngay, đúng cách Desk đang tính; QA kiểm lại trên staging 07/11). Không hoàn tiền phòng các đêm bỏ. Phụ thu người khách đã trả cho các đêm bỏ vẫn hoàn **100 %**: Desk tạo **một** yêu cầu hoàn cho phần đó, lễ tân **Nhập nơi nhận hoàn** như thường (`02` mục 12.2), trên máy đã cấp quyền. Các đêm bỏ không có phụ thu người đã trả: Desk ghi "Không có khoản hoàn.", không có yêu cầu hoàn. Dòng phí trên bill: "Phí trả phòng sớm (báo trước 0 ngày)". Báo trước từ 1 ngày thì vẫn hoàn 50 % tiền phòng các đêm chưa ở. Hướng dẫn: sổ tay 2.14a, 5.2; `02` 11.5.2; `01` 7.3 (#89).
- **Bước Bill: Tổng cộng chưa gồm đêm thêm sắp ghi** (BUG-R4-052, P3, sửa ở v1.0.5 – V5-12). Dòng đêm thêm có ở Folio ngay dưới. **Còn phải thu** vẫn đúng: thu theo **Còn phải thu**, giải thích cho khách theo các dòng Folio. Bản đang chạy cũng vậy.
- **Đơn Nội bộ** (BR-105). Chỉ tạo khi chủ đầu tư hoặc quản lý đã đồng ý; **Ghi chú nội bộ** ghi người cho, lý do, số đêm miễn phí. Desk chưa chặn theo vai.
  - Giá mỗi đêm: có thu thì gõ **mọi** đêm; miễn phí cả đơn thì để trống **mọi** đêm. Áp dụng ngay: bản đang chạy chưa chặn, gõ một phần thì đơn thành 0 đ mà không báo.
  - Đơn có cả đêm thu và đêm miễn phí: gõ mọi đêm, rồi quản lý hoặc chủ đầu tư sửa đêm miễn phí về 0 ở **Folio** **trước khi nhận phòng** (sửa về 0 làm được từ v1.0.4; tới khi lên, hỏi quản lý trước khi tạo đơn loại này). Không dùng FOC hay giảm giá đặc biệt 100 %.
  - Tới lúc nhận phòng mà chưa sửa: chưa thu, gọi quản lý sửa (làm được từ xa trên Desk). Không liên lạc được: thu đủ số Desk đòi, ghi sổ giao ca; phần dư hoàn như tiền khách trả thừa khi trả phòng. Hướng dẫn: sổ tay 2.5, `02` 5.1.
- **Minibar khi đổi phòng** (áp dụng ngay). **Không** ghi minibar căn cũ bằng **Thêm phát sinh**. Buồng phòng đếm tủ căn cũ ngay, trước khi dọn; lễ tân ghi số còn lại từng món vào sổ giao ca. Lúc trả phòng, nhập số đó cho tủ căn cũ ở bước **Minibar**, không đếm lại tủ căn cũ. Đơn đã lỡ có dòng **Thêm phát sinh** minibar căn cũ: trước khi bấm **Trả phòng**, **Bỏ cả dòng** đó (chỉ dòng trùng này) với lý do "Trùng minibar tủ căn cũ", ghi sổ giao ca mã đơn, số tiền. Không dùng **Bỏ cả dòng** để miễn hay giảm cho khách. Quản lý xem lại các lần bỏ dòng này. Hướng dẫn: sổ tay 2.12, 2.14; `02` mục 11.1; `03` mục 7.
- **Giá theo bảng 01/11 (ESC-045, #85) – production chưa chuyển hết.** Sổ tay ghi các mức mới: một giá mọi đêm, trẻ 6–11 tuổi vượt định mức 150.000 đ/đêm, không giảm theo số đêm, thuê dài hạn từ 30 đêm, nhận phòng sớm từ 11:00 không phụ thu.
  - Ngày 06/11 anh/chị chọn bật giá web với bảng tham số đang chạy và sẽ tự chỉnh phần còn lại theo từ điển tham số. Lúc bật, production đang chạy: cuối tuần **0 %** (đã về mức mới), ngày đặc biệt **+30 %**, giảm **10 %** từ 7 đêm và **15 %** từ 14 đêm, trẻ 6–11 tuổi **100.000 đ/đêm**, thuê tháng từ **28 đêm**.
  - Web và Desk luôn tính cùng một số. Lễ tân báo giá theo số Desk tính, không tự sửa giá cho khớp sổ tay. Số trên Desk khác sổ tay ở các điểm trên là do tham số chưa chỉnh, không phải lỗi.
  - Câu kiểm sau mỗi lần chủ đầu tư báo đã đổi giá: báo giá thử một Studio, ngày đến thứ Sáu, 2 đêm, 2 người lớn phải ra 1.600.000. Ra số khác: dừng, báo quản lý, không tự sửa giá.
  - Câu nói với khách giữ "Check-in is from 12:00." Không hứa trước nhận phòng từ 11:00.
  - Chữ trên Desk còn vài chỗ theo mức cũ ("Từ 28 đêm…", "trước giảm theo số đêm"): làm theo số Desk tính. Sửa chữ ở v1.0.5 (V5-20); tên tiếng Việt cho các tham số ở V5-21.
  - Hai tham số `weekend_nights`, `min_stay`: xem dòng **Lời dặn tạm** ngay dưới.
- **Lời dặn tạm cho bản v1.0.4 đang chạy – hai tham số `weekend_nights` và `min_stay`** (BUG-R5-001, BUG-R5-003; áp dụng ngay, gỡ khi v1.0.5 lên – V5-25).
  - **Tới khi v1.0.5 lên**, không bấm **Lưu thay đổi** ở hai dòng `weekend_nights` (**Đêm tính là cuối tuần**) và `min_stay` (**Ở tối thiểu**), nhóm **Khác**: Desk v1.0.4 nhận cả giá trị sai dạng, lưu sai thì Desk không nhận ra đêm cuối tuần, hoặc mọi báo giá và đơn trực tiếp mới báo lỗi, không gỡ được trong ngày (BUG-R5-001, BUG-R5-003). Buộc phải đổi: nhắn đội trước, chọn **Hiệu lực từ** từ ngày mai để còn **Hủy lịch** được. Lỡ lưu: báo đội ngay, coi là **P0** (chủ đầu tư gõ `/feedback P0`, quản lý gọi chủ đầu tư).
  - Riêng `weekend_nights`: Desk còn báo lỗi khi lưu đúng dạng đang chạy (`["FRI","SAT"]`). Cả hai ô trên production đang đúng dạng mà bộ tính giá cần (đội kiểm chỉ đọc 06/11): `weekend_nights` = `["FRI","SAT"]` từ 28/10, `min_stay` là danh sách 2 luật. Mức tăng cuối tuần đang 0 % nên giá hiện chưa sai. Muốn đổi mức tăng cuối tuần trước v1.0.5: báo đội trước.
  - Các tham số dạng danh sách khác (giảm theo số đêm, ngày đặc biệt, bậc nhận phòng sớm, trả phòng muộn): đội đang rà xem có cùng lỗi không (V5-25). Tới khi đội báo kết quả, đổi các ô này thì chọn **Hiệu lực từ** từ ngày mai và giữ đúng dạng trong từ điển tham số.
  - Hướng dẫn: sổ tay 1.4, 5.5, 5.6 (bản 1.16).
- **Đơn quá ngày đi mà vẫn Đang ở** (áp dụng ngay): Desk không có nút **Trả phòng** cho đơn này. **Gia hạn** tới hôm nay rồi **Trả phòng**. Khách ở thật thì thu đêm thêm. Quên bấm (khách đã đi): giảm giá đặc biệt 100 % cho đêm thêm (quản lý duyệt tới 1 đêm, từ 2 đêm chủ đầu tư), xóa mã cửa ngay, khai báo lưu trú ghi ngày rời thật, ghi sổ giao ca. Chờ duyệt xong mới **Trả phòng** được. Ghi trễ ngày đi trên cổng: hỏi quản lý trước khi gửi. Hướng dẫn: sổ tay 2.14, `02` 11.1. Sửa ở v1.0.5 (V5-15).
- **Tiền cọc về cho giữ chỗ đã tự hủy** (BUG-R5-002, P2; áp dụng ngay). Desk chưa ghi được khoản thu lên đơn đã tự hủy, chưa tạo được yêu cầu hoàn và chưa báo ai khi tiền về.
  - Trước mỗi lần tự bấm hủy, và khi thấy đơn **Đã hủy** lý do **Hết hạn giữ chỗ**: kiểm tiền về theo mã đơn (không thấy thì hỏi chủ đầu tư) rồi mới báo khách.
  - Tiền đã về, căn còn trống: giữ chỗ mới cùng căn, cùng giá → **Xác nhận đã nhận cọc**, Giờ nhận tiền để bây giờ, Ghi chú "Tiền về hh:mm dd/mm theo mã OTM-…". Sổ giao ca ghi mã đơn cũ → mã đơn mới.
  - Căn đã bán và khách không nhận căn khác cùng hạng: chủ đầu tư hoàn đủ theo sao kê, ngoài Desk. Sổ giao ca ghi "OTM-… tiền về sau tự hủy – chờ chủ đầu tư hoàn", không hứa ngày.
  - Hướng dẫn: Tờ 2a, sổ tay 2.4 (V5-71). Từ v1.0.5, phần mềm chỉ nhận khoản thu chuyển khoản, VietQR kèm ảnh trên đơn đã hủy hoặc không đến, luôn chờ đối soát (V5-48, bắt buộc). Desk ghi được tiền về cho đơn đã hủy hoặc không đến (chuyển khoản, VietQR, kèm ảnh), tự tạo yêu cầu hoàn và báo ở **Cần chú ý** ở v1.0.5 nếu kịp, không thì v1.0.6 (V5-5B). Khôi phục giữ chỗ cũ khi còn căn: v1.0.6.
- **Lời dặn tạm cho bản v1.0.4 đang chạy – người duyệt hoàn (chủ đầu tư, quản lý)** (SEC, BUG-R5-002; áp dụng ngay, gỡ khi v1.0.5 lên – V5-48). Nguyên văn SEC (`rounds/round-05/reviews/SEC-on-bug-r5-002.md` mục 3.3):
  - Duyệt yêu cầu hoàn của đơn **đã hủy** hoặc **no-show**: mở Nhật ký tiền của đơn và xem khoản thu làm ra số dư.
  - Khoản thu ghi **sau giờ hủy** mà là **Tiền mặt** hoặc **Thẻ**: không duyệt, báo đội.
  - **Chuyển khoản, VietQR**: chỉ duyệt khi đã thấy tiền trên sao kê.
  - Lời dặn không đổi chính sách hoàn. Desk v1.0.4 không có nút ghi khoản thu cho đơn đã hủy, nên khoản như trên chỉ đến từ gọi API thẳng hoặc từ hộp **Xác nhận cọc** mở từ trước lúc đơn tự hủy.
- **Căn vẫn hiện có khách sau khi đơn trước đã trả phòng:** Desk chưa có nút đổi trạng thái căn. Xếp khách sang căn trống khác (cùng hạng hoặc nâng hạng, OTTIMO chịu phần chênh), báo quản lý để đội sửa trạng thái. Không dùng khóa sửa chữa (OOO). Hướng dẫn: sổ tay 2.10, `02` 7.4. Nút **Cần dọn** ở v1.0.5 (V5-15).
- **Giá ngoài sàn–trần:** câu báo ở đầu hộp **Đặt phòng mới** còn hiện chữ `{min}`, `{max}` (BUG-R4-040, P3). Desk vẫn chặn đúng. Bấm **Tạo đơn** mà không thấy gì: kéo lên đầu hộp đọc câu báo, hỏi quản lý khoảng sàn–trần. Sửa ở v1.0.5 (V5-22).
- **Lễ tân và lễ tân trưởng không thấy yêu cầu hoàn còn chờ duyệt do người khác tạo** (Trả sớm, hủy giữ chỗ có cọc, tiền khách trả thừa), cả ở dòng "Đang chờ hoàn" của trang Trả phòng lẫn ở **Nhật ký tiền → Hoàn tiền**. Yêu cầu đã được quản lý duyệt thì vẫn thấy như thường. Đơn có Trả sớm hoặc hủy có cọc mà anh/chị không phải người bấm, hoặc khách hỏi tiền hoàn mà Desk không hiện: **hỏi quản lý hoặc chủ đầu tư** trước khi báo khách số tiền. Không báo khách "không có khoản hoàn". v1.0.5 (V5-13): trang Trả phòng và folio hiện **tổng số đang chờ hoàn** của đơn, kể cả yêu cầu do người khác tạo. Tab **Hoàn tiền** giữ phạm vi như hiện nay; đây là phân quyền có chủ ý. Hướng dẫn: sổ tay 2.14, 2.14a; `02` 11.1, 11.5; `01` 7.3.
- **Lễ tân trưởng bắt buộc 2 bước** nhưng Desk chưa tự ép (v1.0.5 – V5-40). Anh/chị kiểm lúc tạo tài khoản (Việc làm sau khi lên, bước 4).
- **Desk chưa có màn xem nhật ký bảo mật** (ai đặt lại 2 bước, cho ai, lý do). Cần tra thì nhắn Điều phối viên tên đăng nhập, không kèm lý do. Màn này nằm ở backlog cải tiến; anh/chị chọn ở buổi review định kỳ.
- **Check-in online đã mở lại 06/11.** Câu cũ "tạm dừng, chưa gửi link" trong sổ tay đã sửa tối 06/11 (V5-08). Bản in cũ còn câu này thì bỏ qua. Khách mở lại link giữa chừng sau khi chọn "Bổ sung tại quầy" có thể không gửi được: làm giấy tờ tại quầy (sửa ở v1.0.5, V5-5A). Trang khách chưa có câu báo riêng khi chặn số giấy tờ (V5-46).
- **Chữ đơn cách cho tiếng Nga** (BUG-R4-017, P3): ô mã và Wi-Fi hiện chữ Nga bằng font dự phòng. Sửa ở v1.0.5 (V5-24).
- **Website mới (LP-v2) đã lên 06/11:** 5 ngôn ngữ (Anh, Việt, Hàn, Trung, Nga), form gửi yêu cầu, thông báo quyền riêng tư bản 2026-11-04. Giá ước tính bật 06/11; web luôn bằng Desk.
  - Muốn tắt giá web gấp: đặt `public_show_prices` = false ở **Tham số quy tắc**. Form vẫn chạy.
  - Số trên yêu cầu web là **giá thấp nhất của hạng** lúc khách gửi. Báo giá thật làm trên Desk theo từng căn. Desk chưa hiện mức "đến" (V5-19): hiện các căn cùng hạng cùng giá nên chưa lệch. Đổi giá thì đổi cả các căn cùng hạng một lần.
  - Web chỉ hiện giá ước tính tới mốc `web_estimate.open_until`. Chưa gia hạn thì từ 01/01/2027 web ghi "giá theo yêu cầu". Anh/chị chốt giá 2027 và mốc này ở buổi review 20/11.

### Chưa có trong bản này

| Tính năng | Dự kiến |
|---|---|
| Desk tự ép lễ tân trưởng bật 2 bước | **v1.0.5** (V5-40) |
| Trang Trả phòng và folio hiện tổng số đang chờ hoàn của đơn, kể cả yêu cầu do người khác tạo | **v1.0.5** (V5-13) |
| Trả sớm trong 00:00–05:59: Desk đặt sẵn **Ngày rời mới** theo ngày lịch, máy chủ chặn ngày hôm trước | **v1.0.5** (V5-11) |
| Nút **Trả phòng** từ 00:00 cho khách đi đúng ngày (BUG-R4-036) | **v1.0.5** (V5-10) |
| Desk ghi được giờ khách rời thật trước 06:00 khi trả phòng sau 06:00; bản tóm tắt, VietQR và Trả phòng dùng chung một thời điểm (BUG-R4-051) | **v1.0.5** (V5-10) |
| Bước Bill: **Tổng cộng** gồm đêm thêm sắp ghi (BUG-R4-052) | **v1.0.5** (V5-12) |
| Dòng phí khi khách báo trả sớm trong ngày rời ghi "Phí trả phòng sớm (báo trong ngày rời)" / "Early departure fee (same-day notice)" thay "báo trước 0 ngày"; chỉ đổi chữ (FB-R4-DOM-UXD-PR89-02) | **v1.0.5** (V5-23) |
| Giữ chỗ theo đúng giá thỏa thuận (giá đã gõ) | **v1.0.5** (V5-14) |
| **Trả phòng** nhận đơn quá ngày đi với ngày rời thật; nút **Cần dọn** ở Desk và app nhân viên | **v1.0.5** (V5-15) |
| Câu báo giá ngoài sàn–trần có số thật (BUG-R4-040) | **v1.0.5** (V5-22) |
| Chữ Desk theo bảng giá 01/11 ("28 đêm", "trước giảm theo số đêm", nhãn tham số mức tăng) | **v1.0.5** (V5-20, V5-21) |
| Đêm Nội bộ có thu được tính đúng trong chỉ số giá phòng bình quân (BUG-R4-043) | **v1.0.5** (V5-17), trước báo cáo đầu tiên |
| Desk chặn hoặc gửi duyệt đơn Nội bộ theo vai | Backlog cải tiến – anh/chị chọn ở buổi review định kỳ |
| Màn xem nhật ký bảo mật trên Desk | Backlog cải tiến – anh/chị chọn ở buổi review định kỳ |
| Hoa hồng nhập theo bảng nội bộ trên Desk, không có số mặc định trong mã | **v1.0.5** (V5-30), hạn 01/12. Tới 25/11 v1.0.5 chưa lên thì tách thành bản riêng |
| Ô nhập Wi-Fi của cơ sở trên Desk (BUG-R3-021) | **v1.0.5** (V5-58, nên có; không kịp thì v1.0.6) |
| Chữ đơn cách tiếng Nga ở ô mã và Wi-Fi (BUG-R4-017) | **v1.0.5** (V5-24) |
| Desk hiện cả giá web khách đã thấy lúc gửi ("từ – đến") | **v1.0.5** (V5-19, nên có). Phải có trước khi hai căn cùng hạng có giá khác nhau |
| Các việc khác trong bảng "Chưa có" của v1.0.3, v1.0.2 và v1.0.0 | Theo đích ghi ở bảng đó |

### Ghi chú kỹ thuật (không đổi giao diện)

- Lên bản theo thứ tự mới: chạy cập nhật dữ liệu → worker → api và web; lùi bản theo thứ tự ngược. Lượt kiểm hằng ngày kiểm thêm lớp chặn sửa, xóa bản thông báo quyền riêng tư và dùng tài khoản chỉ đọc.
- Bộ dò số thẻ và số giấy tờ dùng chung một bản ở mọi nơi. Nhật ký máy chủ không ghi lỗi kèm chữ khách viết.
- Kiểm tự động chặn tệp bảng giá nội bộ khỏi repo. Mẫu mô tả PR nhắc không ghi tỷ lệ hay tiền hoa hồng.
- Kiểm tự động không còn dùng lại kết quả cũ, mọi lượt chạy test thật (#61, BUG-R4-029/030/031). Bốn ca test phụ thuộc giờ hoặc chạy song song được sửa (#62, #76).
- Công cụ dựng Desk demo và lượt smoke trên máy chạy lại được (#78). Chỉ chạy trên máy, không đụng staging hay production.
- Sổ tay HTML nhúng sẵn font OTTIMO, mở khi mất mạng vẫn đúng chữ. Bản HTML phát hành sinh lại từ sổ tay mới nhất.
- Hợp đồng dữ liệu OpenAPI 0.3.12, thêm mô tả cho đêm thêm của đơn Nội bộ và lý do chặn nhận phòng; không nâng số bản.
- Đội bảo mật rà cảnh báo thư viện trước cắt bản: v1.0.4 không nâng gói nào; gói gửi thư nâng ở v1.0.5 (V5-41).
- Sổ tay và 6 hướng dẫn không còn ghi tỷ lệ hoa hồng (#89); Desk điền tỷ lệ theo Tham số quy tắc. Bản HTML sổ tay không lưu trong repo; bản dựng trước #89 còn câu có tỷ lệ cũ, nên UXD dựng lại từ sổ tay mới trước khi gửi ai (V5-04).

---

## v1.0.3 – Email nhận thông báo bảo mật

- Trạng thái: **ĐÃ PHÁT HÀNH – tag `v1.0.3` trên commit `da6d6f3d`**, production chạy từ **04/11/2026 07:12**. Cổng QC rút gọn: **ĐẠT CÓ ĐIỀU KIỆN** (`rounds/round-04/qc/v1.0.3-gate.md`). Anh/chị duyệt "Phát hành ngay" (04/11), chấp nhận phát hành trước lượt kiểm trả sớm giờ thật sáng 05/11 trên staging; lượt đó ra lỗi tiền thì đội làm bản vá v1.0.3.x. Đội sao lưu ngay trước khi lên; lượt kiểm sau khi lên chạy đủ K1–K9.
- Ngày phát hành: 04/11/2026
- Bản này sửa **BUG-R3-032** (P1): thư "Security notice" chưa tới ai. Hạn sửa chậm nhất **09/11** (ESC-040).
- Áp dụng từ khi anh/chị báo "v1.0.3 đã lên". Hướng dẫn: bộ hướng dẫn theo bộ phận bản 1.7 (áp dụng khi v1.0.3 lên) – chủ đầu tư và quản lý `01` mục 1.6a, 1.7, 1.9, 2.2, 10.1, 10.2, 15.1; lễ tân `02` mục 1.3, 1.5, 1.6, 1.8; buồng phòng `03` mục 1.6; bảo trì `04` mục 1.5; sale, CTV `05` mục 1.5. Sổ tay gốc bản nội dung 1.9 – mục 0.2, 0.3a (email của mình), 0.4, 0.5, 1.1, 1.5 (chủ đầu tư sửa email cho nhân viên), 1.7, 1.16 (thứ tự ngày lên bản), 3.1, 3.6, 4.1, 5.0.

### Có trong bản này

| Thay đổi | Anh/chị và nhân viên thấy gì | Nguồn |
|---|---|---|
| **Email nhận thông báo bảo mật** | Menu dưới tên của mình có mục **Bảo mật tài khoản** (trước đây là **Xác thực 2 bước**). Trang này có khối mới **Email nhận thông báo bảo mật**. OTTIMO gửi thư **Security notice** tới địa chỉ này khi có thay đổi quan trọng: đổi tài khoản nhận chuyển khoản, dùng mã khôi phục, đặt lại xác thực 2 bước, đổi email. Chủ đầu tư và quản lý **bắt buộc** có email: chưa có thì Desk nhắc ở đầu trang. Lễ tân trưởng: không bắt buộc, khuyến khích có. Vai khác không bắt buộc. Thư đổi tài khoản nhận cọc có tiêu đề **"OTTIMO – Notice: …"**, không có chữ "Security notice": đừng lọc thư theo chữ đó. Nhận thư về việc mình không làm: mở Desk bằng cách **gõ địa chỉ**, làm theo bảng **Thư nào – làm gì** (`01` mục 1.6a). Với thư tài khoản nhận cọc: **Hủy lịch**, đổi mật khẩu, tạo bộ mã khôi phục mới, báo đội. Lễ tân **ngừng gửi mã VietQR** tới khi anh/chị xác nhận (`01` mục 10.2, sổ tay 1.7) | BUG-R3-032, ESC-040 |
| **Ai đặt email của ai** | **Mỗi người tự đặt email của mình** ở **Bảo mật tài khoản**. **Chủ đầu tư sửa được email của người khác** (quản lý, nhân viên) ở **Người dùng & vai** → **Sửa email**. Mỗi chủ đầu tư tự đặt email của mình; không ai sửa hộ. Quản lý và các vai khác không sửa email của người khác | V3-01, sổ tay 0.3a, 1.5 |
| **Xác nhận mỗi lần lưu** | Thêm, đổi hay xóa email đều phải nhập **mật khẩu đăng nhập**, và **mã 6 số** nếu tài khoản có xác thực 2 bước | SEC |
| **Thư báo khi email thay đổi** | Mỗi lần thêm, đổi hoặc xóa email, OTTIMO gửi thư tới **địa chỉ mới** (khi thêm, đổi), **địa chỉ cũ** (khi đổi, xóa) và **chủ đầu tư** (mọi lần). Thư không ghi địa chỉ email, không có đường liên kết, không hỏi mật khẩu hay mã. Nhận thư mà mình không đổi: không trả lời thư, mở Desk bằng cách gõ địa chỉ, đổi mật khẩu, báo chủ đầu tư trong ngày | SEC, CPY |
| **Chặn `info@`** | Desk từ chối `info@ottimo.vn` và báo: "Đây là hộp thư chung của cơ sở. Thông báo bảo mật cần tới một email riêng." **Desk chỉ chặn được địa chỉ này.** Các hộp thư chung khác như `booking@ottimo.vn`, Gmail dùng cho Booking/Agoda/Airbnb, hộp thư của quầy thì Desk vẫn nhận: **không dùng**. Hộp thư nhận chỉ một người đọc, không đăng nhập trên máy quầy, không tự chuyển tiếp sang hộp khác. Câu báo hiện sau khi bấm **Lưu email** trong hộp xác nhận; mật khẩu và mã không bị tính là sai | SEC, DOM, ARC |
| **App nhân viên** | Hộp **Thông báo** ghi rõ nghĩa, ví dụ "Email nhận thông báo bảo mật của bạn đã thay đổi", không còn hiện mã nội bộ. App không lưu địa chỉ email trên điện thoại | BUG-R4-021 |
| **Buồng phòng, bảo trì, sale nội bộ, CTV** | Thấy lại email của chính mình sau khi lưu | BUG-R4-018 |
| **Sale nội bộ, CTV: bật 2 bước được** | Từ bản này trang **Bảo mật tài khoản** hiện đúng mã QR và 10 mã khôi phục cho buồng phòng, bảo trì, sale nội bộ, CTV (ở v1.0.2 không hiện). Sale, CTV chỉ dùng Desk: tự bật được, nên bật | BUG-R4-022 |
| **Người dùng app nhân viên: chưa bật đăng nhập 2 bước ở v1.0.x** | Buồng phòng, bảo trì (mới bật được từ bản này) và lễ tân trưởng (bật được từ v1.0.0) dùng app nhân viên. **App nhân viên chưa đăng nhập được bằng 2 bước**: bật xong, app báo "Đăng nhập 2 bước sẽ có ở bản sau. Nhờ chủ đầu tư hỗ trợ đăng nhập." và người đó **không vào được app** (không nhận việc dọn, không bấm dọn xong). Anh/chị dặn khi cấp tài khoản (`01` mục 1.9). **Lỡ bật:** đăng nhập Desk bằng mật khẩu và mã → **Bảo mật tài khoản → Tắt xác thực 2 bước** → đăng nhập lại app. Lỡ bật rồi mất cả điện thoại lẫn mã khôi phục: báo chủ đầu tư; chủ đầu tư làm như `01` mục 1.7 (gặp tận mặt, khóa tài khoản cũ, tạo tài khoản mới đúng vai cũ, người đó không bật 2 bước) | DOM, ARC, SEC, BUG-R4-022 |

### Việc anh/chị làm sau khi lên

1. Desk → **tên của mình → Bảo mật tài khoản** → nhập **hộp thư riêng** chỉ anh/chị đọc vào ô **Email** (không dùng `info@ottimo.vn` hoặc `booking@ottimo.vn`, không dùng Gmail chung của OTA) → bấm **Thêm email** → trong hộp xác nhận, đọc lại **Địa chỉ mới**, nhập mật khẩu và mã 6 số → **Lưu email**.
2. Mở hộp thư, tìm thư **Security notice: notification email changed**. Thấy thư thì nhắn đội "đã nhận". **Không dán địa chỉ email vào chat.** Sau 15 phút chưa thấy: xem mục Spam (thấy thì đánh dấu **Không phải thư rác**), kiểm lại địa chỉ, rồi báo đội. Không cần thử lại nhiều lần.
3. Đội có thể nhờ anh/chị thử **một lần** nhập `info@ottimo.vn` theo hướng dẫn riêng, để xác nhận Desk từ chối địa chỉ này. Việc này không bắt buộc.
4. **Sau khi anh/chị đã thấy thư của mình**: người trực (đang giữ vai quản lý, nên **bắt buộc** có email) **tự nhập** email riêng ở **Bảo mật tài khoản**. Anh/chị sẽ nhận một thư báo email của người trực đã đổi: thư này là bình thường. Người trực không tự làm được thì anh/chị đặt hộ ở **Người dùng & vai → Sửa email**, hỏi tận miệng địa chỉ. **Anh/chị nhập trước, người trực nhập sau**: làm ngược thì thư báo gửi anh/chị không có người nhận, đội bảo mật phải chờ thêm mới báo bỏ được B1–B6.
5. **Lượt kiểm B1–B6 mỗi sáng vẫn tiếp tục tới khi đội bảo mật báo bỏ**, ít nhất 24 giờ sau khi anh/chị nhận thư. Không bỏ ngay ngày lên bản.

### Thay đổi cấu trúc dữ liệu (đọc trước khi duyệt Release)

- Bản này thêm **0091**: bảng ghi các lần đổi email, để gửi thư tới địa chỉ cũ. Địa chỉ cũ bị xóa ngay sau khi thư đã gửi, chậm nhất sau 7 ngày.
- 0091 **chỉ đi tiến**. Nếu sau khi lên mà Desk lỗi nặng, đội lùi **phần mềm** về v1.0.2; dữ liệu giữ nguyên (đã diễn tập trên staging). Trong lúc lùi, menu trở lại tên **Xác thực 2 bước** và khối email tạm ẩn: anh/chị không thêm hay đổi email. Email đã lưu vẫn dùng, thư báo bảo mật vẫn tới, **không cần nhập lại**. Thư báo đổi email trong khoảng đó được gửi bù sau khi lên lại, khi anh/chị đồng ý. App nhân viên bản cũ có thể hiện mã `user.email_changed` trong lúc lùi: bỏ qua.
- Thư không tới (lỗi đường gửi thư) **không** phải lý do lùi phần mềm. Đội kiểm đường gửi thư, anh/chị giữ lượt kiểm B1–B6.
- Khôi phục dữ liệu từ bản sao lưu chỉ làm khi dữ liệu hỏng và anh/chị quyết. Đội sao lưu ngay trước khi lên.
- Bản này không đổi luồng tiền: đặt phòng, folio, thu tiền, cọc giữ nguyên như v1.0.2.

### Giới hạn đã biết

- **Chưa có nút "Đặt lại xác thực 2 bước" cho người khác trên Desk** (BUG-R4-020, P3). **Đặt lại mật khẩu không gỡ 2 bước.** Người trực (hoặc người khác có 2 bước) mất cả điện thoại lẫn mã khôi phục: người đó báo anh/chị, không xin mã của ai. Anh/chị **gặp tận mặt** người đó, **không làm theo tin nhắn**, rồi trên máy riêng: (1) **Khóa tài khoản** cũ ngay (để khóa, **không xóa**: giữ nhật ký); (2) **Thêm người dùng** mới cho chính người đó, **tên đăng nhập mới**, đúng các vai cũ; (3) đưa mật khẩu tạm tận tay. Người đó đăng nhập trên laptop riêng, **bật 2 bước** trên điện thoại mới và **nhập email nhận thông báo ngay** (vai quản lý bắt buộc có email). Đây là cách duy nhất ở v1.0.3, như `01` mục 1.7. **v1.0.4 sẽ có nút đặt lại 2 bước trên Desk.**
- **Chưa bật đăng nhập 2 bước cho người dùng app nhân viên ở v1.0.x** (buồng phòng, bảo trì, lễ tân trưởng). App nhân viên chưa có bước nhập mã: bật xong là không vào được app. **Lỡ bật:** đăng nhập Desk bằng mật khẩu và mã → **Bảo mật tài khoản → Tắt xác thực 2 bước** → đăng nhập lại app. Lỡ bật rồi mất cả điện thoại lẫn mã khôi phục: báo chủ đầu tư; chủ đầu tư làm như dòng trên (gặp tận mặt, khóa tài khoản cũ, tạo tài khoản mới đúng vai cũ), người đó không bật 2 bước. App nhân viên có bước nhập mã dự kiến ở v1.0.4.
- **Cột Email ở Người dùng & vai có thể ngắt địa chỉ giữa chữ** trên màn 1440 px (BUG-R4-023, P3). Cần chép địa chỉ thì mở **Sửa email**: ô nhập hiện trên một dòng. Ảnh sổ tay C1-07, C1-22 mang lỗi này; chụp lại khi sửa.
- **Hộp xác nhận chỉ có ô mật khẩu** (tài khoản không có 2 bước): nhập sai mật khẩu thì Desk báo "Mật khẩu hoặc mã chưa đúng. Kiểm tra lại rồi nhập mã mới." (BUG-R4-024, P3). Không có mã nào cần nhập: chỉ nhập lại mật khẩu đúng.
- **Chưa giới hạn số lần đổi email.** Mọi lần đổi cần mật khẩu và mã, thư tới cả địa chỉ cũ và chủ đầu tư. Lượt kiểm hằng ngày của đội báo khi một người đổi quá 5 lần trong 24 giờ. Giới hạn cứng ở v1.0.4.
- **Thư thật chỉ thử được trên production.** Staging không gửi thư ra ngoài. Lần anh/chị lưu email là lần đầu thư đi tới hộp thư ngoài tên miền `ottimo.vn`.
- **Check-in online vẫn tạm dừng với khách thật.** Thông báo xử lý dữ liệu bản 2 **không** có trong bản này (dời v1.0.4). Lễ tân vẫn không tạo, không gửi link check-in online; mọi khách làm giấy tờ tại quầy như mục v1.0.0 "Giới hạn đã biết". Mở lại khi bản có thông báo bản 2 lên, đội bảo mật kiểm xong và đội báo "mở lại". *Cập nhật 06/11: check-in online đã mở lại từ 06/11 cùng v1.0.4.*
- **Lượt kiểm B1–B6 mỗi sáng tiếp tục tới khi đội bảo mật báo bỏ** (cách làm ở mục v1.0.0). Đội bảo mật chỉ báo bỏ khi bản đã lên, anh/chị đã nhận thư và qua ít nhất 24 giờ không có thư nào bị kẹt.
- **Giữ chỗ quá hạn**: vẫn rà 3 mốc mỗi ngày (sổ tay 2.4) tới v1.0.4.
- **Duyệt hoàn: một đơn có thể có hơn một yêu cầu hoàn** (BUG-R4-025, đính chính mục v1.0.2). Ví dụ: một yêu cầu từ **Trả sớm** và một yêu cầu từ **Trả phòng** cho đêm đã thu rồi được FOC. Hai yêu cầu cho hai khoản khác nhau, **không phải hoàn trùng**. Trước khi từ chối một yêu cầu, cộng các yêu cầu hoàn **còn mở** của đơn (chờ duyệt và đã duyệt chưa chi), đối chiếu với dòng **Hoàn lại khách … đ** trên **Phiếu thanh toán** của đơn (Desk đã trừ khoản đã hoàn). Không tự lấy **Đã thu** trừ **Tổng cộng**. Tổng **bằng** số đó thì **không có hoàn trùng**, không từ chối vì nghĩ là trùng: từ chối nhầm thì khách mất tiền. Tổng **lớn hơn** số đó (thường vì có phát sinh mới sau khi tạo yêu cầu, ví dụ minibar lúc trả phòng): cũng không từ chối, bấm **Duyệt**. Desk không cho duyệt quá số trả thừa: yêu cầu vượt thì Desk báo "Yêu cầu không còn cần duyệt nên đã tự đóng." và tự tạo yêu cầu mới đúng số; duyệt yêu cầu mới đó. Desk có thể gộp mọi yêu cầu còn mở của đơn, kể cả yêu cầu đã duyệt chưa chi, thành **một** yêu cầu thay thế. Yêu cầu này không ghi lý do ở Cần duyệt và, ở v1.0.3, không mang nơi nhận (từ v1.0.4 có, xem dưới); nhận ra nó ở **Nhật ký thao tác tiền** qua cặp dòng cùng phút "Đã tự đóng" rồi "Gửi yêu cầu duyệt" (cột lý do có thể hiện mã `overpayment`, lỗi chữ sửa ở v1.0.4, BUG-R4-026): đó không phải yêu cầu lạ. Trước khi **duyệt**, xem **Cách hoàn** của yêu cầu mới: trống thì nhập lại nơi nhận hoàn (**Nhật ký tiền → Hoàn tiền**, sổ tay mục 1.12) rồi mới duyệt; nhập sau khi đã duyệt thì yêu cầu quay về Chờ duyệt. **Áp dụng từ v1.0.4:** yêu cầu thay thế **giữ nơi nhận** của yêu cầu bị đóng, nếu các yêu cầu cũ chỉ có một nơi nhận, do một người nhập; vẫn kiểm **Cách hoàn** trước khi duyệt; người đã nhập nơi nhận đó vẫn không duyệt được. Yêu cầu cũ có 2 nơi nhận khác nhau, hoặc do 2 người khác nhau nhập: yêu cầu mới không có nơi nhận, phải nhập lại. Có điều bất thường (Desk không tự đóng mà tổng đã duyệt vượt số trả thừa, hoặc không rõ một yêu cầu từ đâu): dừng, chưa duyệt, chưa chi, báo đội kỹ thuật kèm mã đơn. Ở bước **Xem trước** của hộp **Trả sớm**, Desk vẫn ghi "Trả phòng sau đó không tạo thêm yêu cầu." Câu này thiếu ngoại lệ trên; chữ trên Desk sẽ sửa ở v1.0.4, tới lúc đó làm theo dòng này. Cách làm từng bước: sổ tay mục 1.8 **Đơn có hơn một yêu cầu hoàn**, hướng dẫn quản lý `01` mục 4.
- **Đơn HĐ thuê tháng đã gia hạn** và **hủy giá hẹn của căn mới** (BUG-R4-015): giữ cách làm ở mục v1.0.2 "Giới hạn đã biết" tới v1.0.4.

### Chưa có trong bản này

| Tính năng | Dự kiến |
|---|---|
| Giữ chỗ đã có cọc mà quá hạn: ghi thêm tiền và xác nhận được; ô **Chấp nhận cọc thiếu – lý do**; báo giữ chỗ quá hạn vào hộp thư và **Cần chú ý**; chữ đúng cho giữ chỗ có cọc (BUG-R3-042, 043, 041, 044) | **Có ở v1.0.4** (06/11) |
| Thông báo xử lý dữ liệu bản 2 trên trang khách; mở lại check-in online | **Có ở v1.0.4**; check-in online mở lại 06/11 |
| Desk giữ ngày kết thúc HĐ khi gia hạn đơn HĐ | **Có ở v1.0.4** |
| Không hủy được dòng giá đầu tiên của căn mới (BUG-R4-015) | **Có ở v1.0.4** |
| App nhân viên có bước nhập mã 2 bước khi đăng nhập; nút **Đặt lại xác thực 2 bước** cho người khác trên Desk (BUG-R4-020) | **Có ở v1.0.4** |
| Cột Email không ngắt giữa địa chỉ; câu báo sai mật khẩu đúng với hộp chỉ có mật khẩu (BUG-R4-023, 024) | **Có ở v1.0.4** |
| Giới hạn cứng số lần đổi email | **Có ở v1.0.4** |
| Các việc khác trong bảng "Chưa có" của v1.0.2 và v1.0.0 | Theo đích ghi ở bảng đó |

### Ghi chú kỹ thuật (không đổi giao diện)

- Lượt kiểm hằng ngày của đội thêm 3 dòng về email: tài khoản chủ đầu tư/quản lý chưa có email, số lần đổi email trong 24 giờ, địa chỉ có ký tự lạ. Kết quả chỉ ghi số, không ghi địa chỉ.
- Cảnh báo "thư bảo mật không có người nhận" bật sau, ít nhất 24 giờ sau khi anh/chị lưu email, khi đủ điều kiện và anh/chị đồng ý.
- Trên staging: diễn tập lên bản và lùi bản có dữ liệu mới đạt 16/16 bước; kiểm giao diện Desk và app nhân viên đạt 6/6.

---

## v1.0.2 – Trả phòng sớm và giá hẹn theo ngày

- Trạng thái: **ĐÃ PHÁT HÀNH – tag `v1.0.2` trên commit `e5fffe05`**, production chạy từ **03/11/2026** (anh/chị duyệt Release). Cổng QC rút gọn: **ĐẠT CÓ ĐIỀU KIỆN** (`rounds/round-04/qc/v1.0.2-gate.md`). Lượt kiểm sau khi lên đạt K1–K9. Đội sao lưu ngay trước khi lên; lệnh quay lui đã diễn tập trên staging.
- Áp dụng từ khi anh/chị báo "v1.0.2 đã lên". Hướng dẫn: bộ hướng dẫn theo bộ phận bản 1.5 – lễ tân `02` mục 11.5 và 17.5, chủ đầu tư và quản lý `01` mục 7.3; sổ tay gốc bản nội dung 1.7 mục 2.14a.

### Có trong bản này

| Thay đổi | Anh/chị và nhân viên thấy gì | Nguồn |
|---|---|---|
| **Nút Trả sớm – đơn ngắn ngày** | Khung đơn đang ở có nút **Trả sớm** (lễ tân trở lên). Hộp có 3 bước: **Ngày rời và giờ báo** → **Xem trước** → **Kết quả**. Bước **Xem trước** do máy chủ tính và **chưa ghi gì**; chỉ khi bấm **Xác nhận trả sớm** Desk mới ghi. Desk tính theo chính sách trả sớm: đơn Trực tiếp/CTV báo trước từ 1 ngày thì hoàn 50 % tiền phòng các đêm chưa ở, phụ thu người của các đêm đó hoàn đủ; báo trong ngày rời thì không hoàn. Đơn OTA: lễ tân nhập **Số OTA giữ lại** theo extranet. Các đêm bỏ được mở bán lại ngay. Có khoản hoàn thì Desk tạo **một** yêu cầu hoàn cho phần trả sớm, quản lý duyệt, anh/chị chi. Trả phòng sau đó **không tạo lại** khoản này. Nếu folio còn tiền khách trả thừa **khác** (ví dụ đêm đã thu rồi được FOC), bước **Bill & thu tiền** hỏi cách xử lý phần đó; chọn hoàn thì có **thêm một** đề nghị hoàn cho đúng phần này, không trùng. *(Đính chính 04/11, BUG-R4-025: bản trước ghi "trả phòng sau đó không tạo thêm".)* Giờ báo ghi lùi (khách đã nhắn từ trước) phải kèm bằng chứng | B16, BR-428 |
| **Nút Trả sớm – đơn HĐ thuê tháng** (đơn dài hạn nhập tay) | Bước **Xem trước** không có bảng tiền. Desk hiện khung **Trả trước hạn hợp đồng thuê tháng** với hai nhánh: **đã thu tiền thuê tới hết HĐ** thì không vi phạm HĐ, quyết toán ký quỹ như trả phòng đúng hạn, không hoàn các ngày không ở; **chưa thu đủ** thì vi phạm HĐ, mất toàn bộ ký quỹ, không truy thu giảm giá kỳ hạn. Desk chưa biết kỳ thu đã thu tới đâu, nên lễ tân kiểm bảng kỳ thu và **hỏi quản lý (hiện là anh/chị) trước khi báo khách**. Ký quỹ và tiền thuê vẫn xử lý ngoài app | ESC-048 B (03/11), ESC-045 câu 4, BR-313 |
| **Bỏ cách tạm cũ khi khách rời sớm** | Không để căn **Đang ở** tới ngày đi, không giảm tiền phòng trên folio bằng tay nữa. Màn **Trả phòng** vẫn chỉ dùng vào ngày đi: khách rời hôm nay thì bấm **Trả phòng ngay** ở bước **Kết quả** của hộp **Trả sớm** | BR-428, sổ tay 2.14a |
| **Xem và hủy giá hẹn theo ngày** | **Danh mục căn** → mở căn: có danh sách giá đêm/giá tháng đã lên lịch cho các ngày sau. Hủy được một dòng chưa tới ngày hiệu lực; không hủy được dòng đang áp dụng hay dòng giá duy nhất của căn. Chủ đầu tư và quản lý thấy danh sách, lễ tân không thấy. Đơn đã đặt giữ giá lúc đặt. Bỏ việc ghi sổ mỗi lần lên lịch giá | BUG-R3-018 phần 2 |
| **Form website chặn số giấy tờ và số thẻ chặt hơn** | Lời nhắn trên form "Yêu cầu đặt phòng" có số CCCD, hộ chiếu hay số thẻ, kể cả khi viết tách bằng dấu cách, dấu chấm, ký tự ẩn hay chữ số khổ rộng, thì form báo khách sửa và **không lưu gì**. Số phòng, ngân sách, số điện thoại vẫn gửi bình thường. Đôi khi form chặn nhầm (ví dụ hai số điện thoại nối bằng chữ "no"): khách viết lại bằng "hoặc" hay "/". Đội theo dõi tỉ lệ bị chặn 4 tuần đầu, quá 2 % thì xem lại | PR #24, BUG-R3-058, GCHAT-07 |
| **Làm sạch chữ trong tin Google Chat** | Tin Chat dùng cùng bộ dò với form, và bỏ các ký tự có thể làm giả đường link. Hiện tin vẫn ở **mức A** (chỉ mã yêu cầu, giờ, hạn trả lời, link Desk; không có chữ khách viết), nên anh/chị chưa thấy khác. Đây là điều kiện trước khi bật mức tin có chi tiết khách | PR #24, SEC mục 10 |
| **Thông báo quyền riêng tư chỉ thêm, không sửa, không xóa** | Hệ thống khóa nơi lưu các bản thông báo quyền riêng tư của website: chỉ thêm được bản mới; không sửa, không xóa bản cũ. Nhờ vậy luôn chứng minh được khách đã đồng ý với bản nào khi gửi form. Nhân viên không có việc gì mới | PN-01 |

### Thay đổi cấu trúc dữ liệu (đọc trước khi duyệt Release)

- Bản này đổi cấu trúc cơ sở dữ liệu lần đầu kể từ v1.0.0: **0089** (chốt để bước **Xem trước** của **Trả sớm** không ghi gì; cho phép hủy dòng giá hẹn) và **0090** (khóa chỉ-thêm cho bản thông báo quyền riêng tư).
- Hai thay đổi này **chỉ đi tiến**. Nếu sau khi lên mà Desk lỗi nặng, đội lùi **phần mềm** về v1.0.1; dữ liệu giữ nguyên và v1.0.1 vẫn chạy được trên dữ liệu mới. Khi đó Desk không còn nút **Trả sớm** và danh sách giá hẹn: lễ tân quay lại cách tạm cũ (sổ tay 2.14a bản trước).
- Khôi phục dữ liệu từ bản sao lưu sẽ mất mọi thao tác sau giờ sao lưu, nên **chỉ làm khi dữ liệu hỏng và anh/chị quyết**. Đội sao lưu ngay trước khi lên.
- Đội kỹ thuật không sửa hay xóa tay bảng thông báo quyền riêng tư trên máy chủ.

### Giới hạn đã biết

- **Đơn HĐ thuê tháng đã gia hạn** (sửa ở v1.0.4): bấm **Gia hạn** thì Desk dời **Ngày ra (theo HĐ)** sang ngày cuối gia hạn và không giữ ngày kết thúc HĐ. Trước khi gia hạn, ghi ngày kết thúc HĐ vào bảng kỳ thu và sổ giao ca. Khách rời trong phần gia hạn vẫn thấy khung **Trả trước hạn hợp đồng thuê tháng**: đây không phải vi phạm HĐ, làm theo `02` mục 11.5.4. Nhật ký của đơn HĐ có thể ghi "BR-428 notice …": bỏ qua, nhánh và người quyết ghi ở sổ giao ca.
- **Trả phòng trước ngày đi chỉ qua Trả sớm.** Màn **Trả phòng** vẫn mở được trước ngày đi nhưng báo lỗi khi hoàn tất (BUG-R3-024): không dùng.
- **Hộp Trả sớm trên màn 1440 × 900:** ô tích "Đã báo khách…" và nút **Xác nhận trả sớm** có thể nằm dưới mép màn. Cuộn xuống trong hộp để thấy.
- **Hủy giá hẹn của căn mới** (BUG-R4-015, P3, sửa ở v1.0.4): căn mới có ngày bắt đầu bán ở tương lai, đã lên lịch thêm một giá sau đó, rồi hủy dòng giá đầu tiên, thì căn không báo giá được cho tới ngày của dòng sau. Không sai tiền. Cách tránh: không hủy dòng giá đầu tiên của căn mới. Lỡ hủy: lên lịch lại giá đúng ngày bắt đầu bán.
- **Chữ đơn cách cho tiếng Nga** (BUG-R4-017, P3): ô mã và Wi-Fi hiện chữ Nga bằng font dự phòng; cửa sổ kỹ thuật của trình duyệt báo lỗi font. Không ảnh hưởng thao tác.
- **Tin Google Chat vẫn ở mức A.** Mức có chi tiết khách bật sau, khi đủ các điều kiện bảo mật (cần phòng Chat thử – ESC-046).
- **Vẫn giữ các cách tạm của v1.0.0** cho thư báo bảo mật (lượt kiểm B1–B6 mỗi sáng trước 09:00, tới khi đội bảo mật báo bỏ sau khi v1.0.3 lên), giữ chỗ quá hạn (rà 3 mốc mỗi ngày, tới v1.0.4) và check-in online (tạm dừng với khách thật, tới khi có thông báo xử lý dữ liệu bản 2 – dự kiến v1.0.4). Chi tiết ở mục v1.0.0 bên dưới. *Cập nhật 06/11: check-in online đã mở lại từ 06/11 cùng v1.0.4.*

### Chưa có trong bản này

| Tính năng | Dự kiến |
|---|---|
| Ô email cho người dùng; thư báo bảo mật tới hộp thư riêng của chủ đầu tư (BUG-R3-032, P1) | **Có ở v1.0.3** (04/11) |
| Giữ chỗ đã có cọc mà quá hạn: ghi thêm tiền và xác nhận được; ô **Chấp nhận cọc thiếu – lý do**; báo giữ chỗ quá hạn vào hộp thư và **Cần chú ý**; chữ đúng cho giữ chỗ có cọc (BUG-R3-042, 043, 041, 044) | **Có ở v1.0.4** (06/11) |
| Thông báo xử lý dữ liệu bản 2 trên trang khách; mở lại check-in online | **Có ở v1.0.4**; check-in online mở lại 06/11 |
| Desk giữ ngày kết thúc HĐ khi gia hạn đơn HĐ; khung HĐ chỉ hiện khi khách rời trước ngày kết thúc HĐ | **Có ở v1.0.4** |
| Không hủy được dòng giá đầu tiên của căn mới (BUG-R4-015) | **Có ở v1.0.4** |
| Các việc khác trong bảng "Chưa có" của v1.0.0 | Theo đích ghi ở bảng đó |

### Ghi chú kỹ thuật (không đổi giao diện)

- Tệp lệnh cho chủ đầu tư có thêm mục quay lui phần mềm; thêm lệnh kiểm nhật ký thông báo quyền riêng tư và bước diễn tập khôi phục (PR #26).
- Trên staging, mọi số tiền trả sớm ở bước **Xem trước** trùng đúng số ghi thật, và bước **Xem trước** không đổi bảng dữ liệu nào (kiểm 124 bảng).

---

## v1.0.1 – Tin Google Chat cho yêu cầu từ website

- Trạng thái: **ĐÃ PHÁT HÀNH – tag `v1.0.1` trên commit `755cad16`**, production chạy từ **03/11/2026**. Lượt kiểm sau khi lên đạt 14/14: tin thử tới đúng phòng Chat, xóa được bằng quyền quản lý phòng. QC: `rounds/round-04/qc/v1.0.1-gate.md`.

| Thay đổi | Anh/chị và nhân viên thấy gì | Nguồn |
|---|---|---|
| **Tin báo yêu cầu website vào Google Chat** | Mỗi yêu cầu mới trên form ottimo.vn đăng một tin vào phòng **"OTTIMO – Yêu cầu đặt phòng"**, kèm tin nhắc và tin báo khi yêu cầu quá hạn trả lời. Tin ở **mức A**: mã yêu cầu, giờ nhận, hạn trả lời, mức gấp, link mở Desk; không có tên hay liên hệ của khách. Xem và trả lời khách vẫn trên Desk. Cách dùng: `01` mục 12, `02` mục 13.1a | US-155, ESC-041 |
| **Câu báo giá ghi đúng số ít, số nhiều** | "1 night" thay cho "1 nights"; tiếng Nga và tiếng Việt cũng đúng | BUG-R4-009 |
| Kiểm hạ tầng | Lệnh kiểm hằng ngày báo rõ loại lỗi; nhật ký thông báo quyền riêng tư vào bản sao lưu mã hóa. Không đổi giao diện | PR #23, #25 |

Không có trong v1.0.1 (dù kế hoạch cũ hẹn các việc này cho bản vá 04/11): trả phòng sớm và giá hẹn – nay ở **v1.0.2**; thư báo bảo mật – nay ở **v1.0.3**; giữ chỗ quá hạn, thông báo xử lý dữ liệu bản 2 – nay ở **v1.0.4** (cập nhật 04/11).

---

## v1.0.0 – Bản vận hành đầu tiên

- Trạng thái: **ĐÃ PHÁT HÀNH – tag `v1.0.0` trên commit `8b3aec8`** (cùng mã với `v1.0.0-rc.6`). Gắn tag ngày **30/10/2026** sau cổng QC v1.0 (ĐẠT CÓ ĐIỀU KIỆN, `rounds/round-03/qc/v1-gate.md`) và quyết định ESC-040 A của anh/chị (30/10). Cập nhật lần cuối: PO, 30/10/2026 (khuya, sau khi đội thử luồng giữ chỗ quá hạn và kiểm từng nút hoàn tiền trên bản thử).
- Bản đang chạy: **production chạy đúng mã này từ 07:51 ngày 30/10/2026** (anh/chị đồng ý 29/10). Gắn tag không cài lại gì: lượt Release tự sinh khi gắn tag bị từ chối vì cùng một bản.
- Ngày chạy với khách thật: **thứ Hai 02/11/2026** (anh/chị chốt 26/10), sau khi xong các việc "Chặn D" trong `rounds/round-03/qc/v1-gate.md` mục 4.2–4.3.
- Bản vá kế tiếp (cập nhật 04/11 theo cách đánh số đợt): **v1.0.1** đã lên 03/11 (tin Google Chat); **v1.0.2** đã lên 03/11 (trả phòng sớm và giá hẹn); **v1.0.3** thư báo bảo mật (chậm nhất 09/11); **v1.0.4** thông báo xử lý dữ liệu bản 2, giữ chỗ quá hạn – báo và xác nhận cọc sau hạn (dự kiến 08/11, chậm nhất 10/11). Xem "Chưa có trong bản này".
- Địa chỉ: Desk `desk.ottimo.vn` · app nhân viên (buồng phòng, bảo trì, lễ tân trưởng) `staff.ottimo.vn` · trang khách `g.ottimo.vn` · website `ottimo.vn`
- Hướng dẫn dùng cho từng bộ phận: **Sổ tay sử dụng OTTIMO Desk v1.0** (`product/docs/manual/user-manual-v1.0.md`, bản nội dung 1.5, 30/10). Bản tóm tắt dán quầy: `product/docs/staff-one-pager.md`. Chuyển đổi ngày đầu: `product/docs/day-one-guide.md`.

### Thay đổi từ `rc.3` (27/10) đến `v1.0.0` (= `rc.6`, 29/10)

`rc.4`, `rc.5` chỉ chạy trên staging. Production đi thẳng từ `rc.3` lên `rc.6` sáng 30/10.

| Thay đổi | Anh/chị và nhân viên thấy gì | Nguồn |
|---|---|---|
| **Tạo được đơn dài hạn nhập tay** | Form **Đơn dài hạn nhập tay** có ô **Nguồn** (Zalo / điện thoại, Website, Khách vãng lai, Khách quay lại). Đơn giữ căn trên sơ đồ, mang cờ "HĐ ngoài hệ thống". Tiền thuê và ký quỹ vẫn ghi ngoài app như cũ | BUG-R3-019 (P1) |
| **In phiếu dùng được** | **In phiếu** in đúng một tờ A4 chỉ có phiếu, Tiếng Việt hoặc Việt – Anh, chữ và màu theo nhận diện OTTIMO. Chưa thử trên máy in ở quầy: in thử một tờ trước ngày 02/11 | BUG-R3-020 |
| **Ghi phát sinh sau trả phòng** | Đơn đã trả phòng có nút **Thêm phát sinh** trong 24 giờ sau khi hoàn tất trả phòng (ví dụ phát hiện hư hỏng, minibar thiếu); khoản phạt, đền bù phải kèm ảnh hoặc ghi chú bằng chứng. Ghi nhầm: quản lý mở **Folio & điều chỉnh** → **Điều chỉnh** → **Bỏ cả dòng** hoặc sửa số, ghi lý do. Quá 24 giờ Desk khóa folio: **không ai** thêm hay điều chỉnh được, kể cả quản lý (câu báo lỗi trên Desk còn ghi "chỉ quản lý…" – sai, xem "Giới hạn đã biết") | BUG-R3-022 |
| **Khung Folio đúng số sau trả phòng** | Bấm **Hoàn tất** xong, khung Folio đọc lại số của hệ thống, không còn báo "Còn phải thu" khi khách đã trả đủ | BUG-R3-033 |
| **Hộp Đổi phòng dễ đọc hơn** | Tên nhóm căn hiện bằng chữ (không còn mã L12, N, NPLUS). Danh sách còn có thể lẫn căn chưa dọn: chọn căn đó thì Desk báo và không lưu gì (lọc hẳn ở v1.0.5 – V5-50, nên có) | BUG-R3-023 (một phần) |
| **Wi-Fi trên trang khách** | Ngày đến và trong lúc ở, trang khách ghi "hỏi lễ tân" thay cho câu sai cũ. Ô nhập Wi-Fi trên Desk ở v1.0.5 (V5-58, nên có) | BUG-R3-021 (một phần) |
| **Việc tự động chạy đúng** | Desk tự đóng phiếu sau 24 giờ trả phòng và ghi công nợ nếu khách còn nợ; mã VietQR quá hạn tự chuyển "hết hạn"; giữ chỗ **chưa cọc** quá hạn tự hủy và nhả căn, giữ chỗ **đã có cọc** được giữ lại để lễ tân xử lý. Ở `rc.3` ba việc này không chạy (production lúc đó chưa có đơn nên không ảnh hưởng) | BUG-R3-037, 038, 039 (P1) |

### Thay đổi từ `rc.1` (26/10) đến `rc.3` (27/10)

| Thay đổi | Anh/chị và nhân viên thấy gì | Nguồn |
|---|---|---|
| **Khách rời sau 18:00 khi đêm đó căn đã có khách đến** – vá trước ngày chạy theo quyết định của anh/chị | Ở bước "Bill & thu tiền", Desk chọn sẵn **"Ghi phụ thu – quản lý xem lại"**: số bằng giá 1 đêm do Desk tính, lễ tân không sửa được, không có ô miễn, phải ghi lý do; không cần mật khẩu của ai. Quản lý và anh/chị nhận thông báo, xem lại ở **Cần chú ý** trong 24 giờ kể từ lúc bấm trả phòng: đồng ý thì bấm **Đã xem**; nên giảm thì sửa dòng phụ thu, Desk tự tạo yêu cầu hoàn và người sửa không tự duyệt khoản hoàn. Quá hạn, Desk báo anh/chị | ESC-031 (26/10), ESC-024 B |
| **Thu tiền mặt/thẻ ở bước cuối trả phòng** khi vừa có phụ thu mới | Tiền mặt hoặc thẻ POS lớn hơn số đang nợ lúc đó (ví dụ phụ thu sau 18:00 vừa ghi ở bước 3): Desk ghi "đã nhận", khoản thu vào folio khi bấm **Hoàn tất**. Desk không nhận quá số còn phải thu; số cần thu đổi sau khi nhập thì Desk báo và cho **Bỏ** khoản đó để nhập lại | BUG-R3-017 |
| **Nhận phòng từ 12:00** | Ô giờ nhận mặc định "Nhận từ 12:00 – không phụ thu"; phụ thu nhận sớm chỉ trước 12:00 (chi tiết ở mục "Giờ nhận và trả phòng" bên dưới) | FB-INV-004 (26/10) |
| **Giá đêm và giá tháng nhập riêng** | **Danh mục căn → Sửa**: ô **Giá đêm niêm yết** nhập được, không còn tự bằng giá tháng ÷ 12. Giá đêm anh/chị nhập là giá ngày thường, kênh Trực tiếp; Desk vẫn tự cộng cuối tuần và ngày đặc biệt như cũ. Desk cảnh báo (vẫn cho lưu) khi giá đêm thấp hơn giá tháng chia 30 | FB-INV-005, ESC-036 A (26/10) |
| **Sửa một giá đã lên lịch bị nhập nhầm** | Mở **Sửa**, chọn đúng ngày hiệu lực của giá nhầm, nhập giá đúng, **Lưu**: giá đúng thay giá nhầm của ngày đó. Phần còn lại (xem danh sách giá đã lên lịch, nút hủy) **có ở v1.0.2** | BUG-R3-018 phần 2; phần 1 → v1.0.2 |
| Giá trị khởi tạo theo câu trả lời 26/10 | Hạng Studio City View 101, 201 / Garden View 102, 103, 202, 203; tên hạng Premium, Signature theo e-brochure; điện 5.000 đ/kWh, nước 100.000 đ/người/tháng (ghi để tính tay, xem "Giới hạn đã biết") | INV 26/10 (8 câu DOM) |

### Có trong bản này

**Desk (lễ tân, quản lý, chủ đầu tư)**
- **Sơ đồ phòng và đặt phòng:** sơ đồ 14 ngày, đặt trực tiếp, chặn đặt trùng, đổi căn/đổi ngày, hủy, khách không đến, đơn OTA nhập tay, đơn dài hạn nhập tay.
- **Báo giá, giữ chỗ, cọc:** báo giá có hạn, giữ chỗ tự hết hạn, mã VietQR đúng số tiền và mã đơn, xác nhận đã nhận cọc.
- **Giờ nhận và trả phòng (đổi 26/10 theo quyết định của anh/chị):** khách **nhận phòng từ 12:00** khi căn đã sẵn sàng, căn **chắc chắn sẵn sàng lúc 14:00**; **trả phòng 12:00** như cũ. Từ 12:00 không có phụ thu nhận sớm; nhận trước 12:00 Desk tính 30 % (10:00–11:59) hoặc 50 % (06:00–09:59) giá đêm đầu. Câu nói với khách: "Check-in is from 12:00. Your room is always ready by 14:00. Check-out is by 12:00." / "Nhận phòng từ 12:00. Phòng luôn sẵn sàng lúc 14:00. Trả phòng trước 12:00."
- **Nhận phòng, lưu trú, trả phòng:** phụ thu nhận sớm/trả muộn tự tính, gia hạn, thêm dịch vụ vào folio, trả phòng 3 bước, thu tiền nhiều lần, công nợ và thu nợ. Trả sau 18:00 khi đêm đó căn đã có khách đến: lễ tân ghi phụ thu bằng giá 1 đêm, quản lý xem lại trong 24 giờ (xem "Thay đổi từ rc.1").
- **Phiếu thanh toán (bill):** xem trên màn hình trước và sau trả phòng, chọn **Tiếng Việt** hoặc **Việt – Anh**, nút **In phiếu** in một tờ A4 qua hộp in của trình duyệt (in giấy, hoặc "Lưu dưới dạng PDF" của trình duyệt rồi gửi riêng cho khách). Mẫu in chính thức và gửi bill tự động ở v1.2 (bảng dưới).
- **Danh mục căn và giá:** giá đêm và giá tháng nhập riêng, có ngày hiệu lực; lịch giá tự cộng cuối tuần và ngày đặc biệt.
- **Giấy tờ và khai báo lưu trú:** nhập giấy tờ, đối chiếu, nhắc hạn khai báo. Ảnh giấy tờ chỉ lễ tân và quản lý xem, tự xóa theo hạn lưu chủ đầu tư đặt.
- **Ngày kinh doanh:** từ 00:00 đến 05:59, Desk và app buồng phòng vẫn tính là ngày hôm trước. Ngày mới bắt đầu lúc 06:00.
- **Kiểm soát:** phân quyền theo vai, nhật ký mọi thao tác tiền, miễn giảm có hạn mức và người duyệt, báo chủ đầu tư khi tổng miễn trên một lượt ở vượt ngưỡng.
- **Bảo mật:** đăng nhập 2 bước bắt buộc cho chủ đầu tư và quản lý, có mã khôi phục; xác thực lại trước thao tác nhạy cảm.
- **Chủ đầu tư tự cài đặt:** tự đặt tài khoản nhận chuyển khoản (có hiệu lực từ ngày hôm sau, có cảnh báo khi vừa đổi); tự thêm nhân viên và gán vai.
- **Yêu cầu từ website:** hàng chờ trên Desk cho yêu cầu đặt phòng gửi từ ottimo.vn; tạo đơn từ yêu cầu, nguồn ghi "website". Hàng chờ chỉ có dữ liệu khi form trên website được bật (xem "Giới hạn đã biết").

**App nhân viên (điện thoại – buồng phòng, bảo trì, lễ tân trưởng)**
- Buồng phòng: việc dọn tự sinh (gồm việc bổ sung minibar), bắt đầu dọn → dọn xong, báo sự cố có ảnh, vẫn bấm được khi mất mạng.
- **Lễ tân trưởng kiểm phòng** theo checklist trên app (căn "Đã dọn – chờ kiểm" → "Sẵn sàng"). Buồng phòng tự kiểm **đang tắt** (giá trị khởi tạo); anh/chị bật được ở **Tham số quy tắc** khi muốn.
- Bảo trì: phiếu sửa, chờ vật tư, sửa xong có ảnh, khóa và mở bán lại căn.

**Trang khách (link riêng của từng đơn)**
- Check-in online: tải giấy tờ, chọn giờ đến, gửi yêu cầu trong lúc ở. Tiếng Anh dẫn, có tiếng Việt.
- **Tạm chưa dùng với khách thật từ 02/11 tới khi bản có thông báo xử lý dữ liệu bản 2 lên (dự kiến v1.0.4) và đội báo "mở lại"** (xem "Giới hạn đã biết" – check-in online).

**Website ottimo.vn**
- Trang giới thiệu OTTIMO (concept "The art of staying well"), tiếng Anh và tiếng Việt, đã lên mạng từ **25/10/2026**.
- Nút liên hệ mở Zalo, gọi điện, email. Form "Yêu cầu đặt phòng" có sẵn trong bản này nhưng **đang tắt**.

### Chưa có trong bản này
| Tính năng | Dự kiến |
|---|---|
| Ô email cho người dùng; thư báo bảo mật tới hộp thư riêng của chủ đầu tư (BUG-R3-032) | **Có ở v1.0.3** (04/11) |
| Nút **Trả phòng sớm** trên Desk (máy chủ tính tiền hoàn) | **Có ở v1.0.2** (03/11) |
| Thông báo xử lý dữ liệu bản 2 trên trang khách (thêm câu hạn lưu), mở lại check-in online | **Có ở v1.0.4**; check-in online mở lại 06/11 |
| Báo giữ chỗ quá hạn vào hộp thư và **Cần chú ý** (BUG-R3-041); giữ chỗ có yêu cầu giảm giá/FOC quá hạn tự hủy được | **Có ở v1.0.4** |
| Giữ chỗ **đã có cọc** mà quá hạn: lễ tân ghi thêm tiền và xác nhận được tới khi khách nhận phòng (BUG-R3-042) | **Có ở v1.0.4** |
| Ô **Chấp nhận cọc thiếu – lý do** trong hộp Xác nhận cọc, cho quản lý và chủ đầu tư (BUG-R3-043) | **Có ở v1.0.4** |
| Desk ghi đúng giữ chỗ có cọc: không ghi "đơn đã tự hủy" hay "căn đã mở bán lại"; hộp hủy hiện số sẽ hoàn (BUG-R3-044); **Cần chú ý** liệt kê mọi giữ chỗ quá hạn, mọi ngày đến | **Có ở v1.0.4** |
| Câu báo khi folio đã khóa ghi đúng (không còn "chỉ quản lý ghi được…") (BUG-R3-045) | **Có ở v1.0.4** |
| Nhập nơi nhận hoàn trên máy chưa cấp quyền: câu báo đúng việc, nút khóa kèm giải thích (BUG-R3-048) | **v1.0.5** (V5-53, nên có) |
| Ô nhập Wi-Fi của cơ sở trên Desk | **v1.0.5** (V5-58, nên có) |
| Hộp Đổi phòng chỉ liệt kê căn đã dọn hoặc đã kiểm | **v1.0.5** (V5-50, nên có) |
| Giữ ảnh giấy tờ của khách đồng ý lưu tới 3 tháng (v1.0: 30 ngày) | **v1.0.5** (V5-45): Desk cho đặt tới 90 ngày, đội bảo mật duyệt; anh/chị tự đặt sau khi lên |
| Xem danh sách giá đã lên lịch và hủy một giá đã lên lịch | **Có ở v1.0.2** (03/11) |
| Quản lý xác nhận từ xa trên điện thoại | v1.1 |
| Kết nối kênh OTA tự động (Beds24) | v1.1 |
| Mã cửa 8 số quản lý trên app; báo tự động khi khách quá giờ trả phòng | v1.1 |
| Bảng dự phòng in sẵn mỗi sáng (khi mất mạng) | v1.1 |
| Chấm công qua Wi-Fi OTTIMO trên app nhân viên | v1.1 |
| Báo cáo tháng, kênh, FOC; xuất dữ liệu | v1.2 |
| Mẫu tin và lịch nhắn khách; Zalo OA | v1.2 |
| **Mẫu in bill chính thức**, xuất PDF từ Desk, gửi bill qua email/Zalo; khách xem folio tạm tính trên trang khách (v1.0 đã in phiếu qua trình duyệt – xem trên) | v1.2 |
| Hợp đồng dài hạn đủ vòng (ký quỹ, kỳ thu, điện nước); hoa hồng CTV/sale ghi theo đợt chi | v1.3 |
| Hóa đơn điện tử MISA; đóng ca; tiếng Nga; khách tự gửi yêu cầu về dữ liệu cá nhân | v1.3 |
| Buồng phòng đếm minibar trên app; bảng theo dõi khách tiềm năng cho sale | Chưa xếp lịch – xếp theo góp ý sau ngày chạy |

### Giới hạn đã biết

**Ba việc phải làm hằng ngày từ 02/11** (cập nhật 04/11: B1–B6 tới khi đội bảo mật báo bỏ sau v1.0.3; giữ chỗ quá hạn và check-in online tới v1.0.4) (đào tạo ở buổi C3a, có trong sổ tay mục 1.1, 2.4, 2.9 và Tờ 2a dán quầy). Hiện OTTIMO có một người trực giữ cả 6 vai (anh/chị quyết 29/10): "người trực" dưới đây là người đó; anh/chị xem lại mỗi sáng.

- **Thư báo bảo mật chưa tới ai (BUG-R3-032, mức P1).** Khi có thay đổi nhạy cảm (đổi tài khoản nhận chuyển khoản, dùng mã khôi phục, đặt lại đăng nhập 2 bước), Desk có tạo thư "Security notice" nhưng v1.0.0 chưa có ô email của người dùng, nên **thư không gửi tới ai** – kể cả `info@ottimo.vn` (hộp thư chung không dùng cho thư bảo mật). Thông báo trong Desk vẫn hiện. Các lớp chặn vẫn đủ: chỉ chủ đầu tư đổi được tài khoản nhận, phải xác thực lại, có hiệu lực từ hôm sau, mã VietQR báo "Tài khoản nhận vừa đổi". Anh/chị chấp nhận phát hành với lỗi này ngày 30/10 (ESC-040 A). Tới khi đội bảo mật báo bỏ (sau khi v1.0.3 lên, anh/chị nhận được thư và qua ít nhất 24 giờ; v1.0.3 chậm nhất 09/11), **mỗi sáng trước 09:00, kể cả ngày nghỉ**, làm 6 việc bù của đội bảo mật (B1–B6):
  - B1 – chủ đầu tư mở **Tài khoản nhận chuyển khoản**: đúng một dòng đang dùng, tên chủ tài khoản đúng, không có dòng đã lên lịch lạ;
  - B2 – chủ đầu tư xem **Cần chú ý** và **Nhật ký tiền** 24 giờ qua: có thay đổi tài khoản nhận, mã khôi phục, đặt lại 2 bước mà mình không làm thì gọi đội ngay, không đổi lại trên chính phiên đó;
  - B3 – ghi một dòng vào sổ giao ca "Đã kiểm TK nhận + nhật ký – <giờ>", không ghi số tài khoản;
  - B4 – chủ đầu tư hoặc quản lý đối soát tiền chuyển khoản trên app ngân hàng với các khoản VietQR trên Desk của hôm trước;
  - B5 – mọi ca: mã VietQR có dòng "Tài khoản nhận vừa đổi" thì chưa cho khách chuyển, gọi chủ đầu tư xác nhận trước;
  - B6 – kênh dự phòng là điện thoại; không chia sẻ mật khẩu; mã khôi phục chỉ trên giấy.

  Quá 09/11 chưa sửa thì đội bảo mật báo lại anh/chị. Cách làm: Sổ tay mục 1.1.
- **Giữ chỗ quá hạn – Desk không báo, và sau hạn chỉ còn nút Hủy** (BUG-R3-041 P2, WA-04, BUG-R3-042 P1, BUG-R3-043 P2, BUG-R3-044 P2). Không sai tiền, không đặt trùng, nhưng căn có thể bị giữ im lặng và khách cọc thiếu không nhận phòng được trên đơn gốc. Cụ thể ở `v1.0.0`:
  - Giữ chỗ **đã có cọc** (đủ hoặc thiếu) mà tới hạn thì Desk giữ lại đơn, đúng quy tắc, nhưng không báo vào hộp thư hay **Cần chú ý**. Giữ chỗ **có yêu cầu giảm giá/FOC** thì không tự hủy, kể cả khi chưa cọc.
  - **Sau hạn**, Desk không cho **Xác nhận đã nhận cọc** (báo "Giữ chỗ đã hết hạn…"), không cho **Gia hạn giữ chỗ**, và **chưa có ô "Chấp nhận cọc thiếu"** ở bất kỳ lúc nào. Chỉ còn **Hủy giữ chỗ**.
  - Desk ghi sai với giữ chỗ có cọc (BUG-R3-044): khung đơn ghi "**đơn đã tự hủy**" và câu lỗi ghi "**căn đã mở bán lại**" trong khi đơn vẫn **Giữ chỗ · chờ cọc** và căn vẫn bị giữ; hộp hủy ghi "**Không thu phí (giữ chỗ chưa cọc)**" và không hiện số hoàn. **Đừng tin dòng "Không thu phí" này:** Desk vẫn tạo yêu cầu hoàn đủ số đã nhận, xem ở **Cần duyệt** và **Nhật ký tiền → Hoàn tiền**.

  Cách tạm (chuyên gia nghiệp vụ chốt 30/10):
  - **Phòng trước:** khách chuyển thiếu thì xin phần còn lại ngay trong ngày; cần thêm giờ thì **Gia hạn giữ chỗ (1 lần)** trước hạn; tiền về thì bấm xác nhận **trước giờ hạn**.
  - **Rà 3 mốc mỗi ngày** (mở quầy, muộn nhất 09:00 · 11:00 · trước khi rời quầy, muộn nhất 21:00): **Đơn đặt phòng** → lọc **Đang hiệu lực** → mở từng dòng **Giữ chỗ · chờ cọc**. Trên màn, đơn quá hạn hiện "còn 0 giờ 00 phút" màu đỏ.
  - **Lý do hủy:** chọn **Không liên lạc được** hoặc **Khách đổi ý**, không chọn **Khác (ghi rõ)** (Desk khóa nút hủy, xem dòng BUG-R3-046 bên dưới). Lý do thật ghi sổ giao ca.
  - **Chưa cọc mà quá hạn:** hủy ngay, báo khách; khách còn muốn thì tạo giữ chỗ mới 12 giờ, chỉ một lần.
  - **Có cọc mà quá hạn:** khách không đi → hủy, Desk tạo yêu cầu hoàn đủ; người trực nhập nơi nhận hoàn, **anh/chị duyệt và chi**. Khách vẫn đi → **để nguyên đơn** (căn vẫn giữ), ghi sổ giao ca. Khi khách đến: hủy đơn cũ → đặt đơn mới cùng căn, cùng giá, cùng kênh và CTV, **thu đủ cọc ngay lúc đặt** (Desk không lưu đơn thiếu cọc) → nhận phòng, thu phần còn lại → **anh/chị duyệt và hoàn phần cọc cũ** (tiền mặt tại quầy hoặc chuyển khoản lại trong 24 giờ). Khách phải nhận lại tiền rồi trả lại, nên chỉ dùng tới khi v1.0.4 có BUG-R3-042 và 043.
  - **Người trực không tự duyệt, không tự chi khoản hoàn do mình tạo** khi hủy đơn, kể cả có quyền quản lý: đây là quy tắc tách nhiệm đã chốt; phần duyệt không có ngoại lệ, kể cả quản lý hay chủ đầu tư. Hiện một người trực giữ 6 vai, nên **mọi khoản hoàn sinh ra khi người trực hủy đơn đều chờ anh/chị duyệt và chi**. Anh/chị vắng thì khách chưa nhận lại cọc tại quầy được: người trực nói thật với khách và hẹn chuyển khoản lại trong 24 giờ (anh/chị làm trong lượt kiểm sáng), hoặc nhận tiền mặt khi anh/chị đã hẹn giờ tới quầy. Cọc cũ khách chuyển khoản mà chưa đối soát thì Desk chưa cho chi: anh/chị đối soát ở **Nhật ký tiền → Chờ đối soát** trước. Muốn người trực tự hoàn tại quầy là đổi quy tắc tách nhiệm, cần đội bảo mật xem và anh/chị quyết; không có trong v1.0.3 và v1.0.4.
  - Anh/chị xem lại các dòng "giữ chỗ" trong sổ giao ca và các yêu cầu hoàn mới trong lượt kiểm sáng B1–B6.

  Bỏ cách tạm khi v1.0.4 có đủ BUG-R3-041, WA-04, 042, 043 và đội đã thử lại cả ba lối ra (xác nhận cọc, chấp nhận cọc thiếu, hủy hoàn) trước và sau hạn. Cách làm đầy đủ: Sổ tay mục 2.4.
- **Check-in online tạm dừng với khách thật** (*cập nhật 06/11: đã mở lại từ 06/11 cùng v1.0.4*) (PO quyết 30/10 trong phạm vi bản, không đổi chính sách; **đội bảo mật đã đồng ý 30/10**). Trang khách v1.0.0 còn thông báo xử lý dữ liệu bản 1, chưa nêu hạn lưu thông tin giấy tờ điền sẵn. Bản 2 cần sửa mã; không kịp v1.0.3 nên dời **v1.0.4**. Từ 02/11 tới khi bản có thông báo bản 2 lên production và đội báo "mở lại": lễ tân **không tạo, không gửi link check-in online** cho khách thật; mọi khách làm giấy tờ tại quầy. **Trước khi nhận giấy tờ**, lễ tân chỉ khách tờ **Your ID details** đặt trên quầy (hạn lưu, sao lưu, cách hỏi về dữ liệu); tới bước đối chiếu thì hỏi đồng ý lưu ảnh, đọc đúng số ngày Desk hiện. Lỡ gửi link: **Thu hồi link** ngay, ghi mã đơn vào sổ giao ca (không ghi tên khách), báo anh/chị; đội đếm số link mới mỗi sáng để phát hiện. Trong thời gian này khách cũng không dùng trang khách để gửi yêu cầu trong lúc ở: khách nhắn Zalo hoặc gọi lễ tân như hiện nay. Đơn chuyển đổi ngày D cũng không gửi link. Tập trên staging thì vẫn tập mục 2.9 với dữ liệu giả. Mở lại khi: v1.0.4 (hoặc bản sau) có thông báo bản 2 ở mọi ngôn ngữ trang khách (gồm tiếng Nga), cùng chữ với tờ ở quầy, và đội bảo mật kiểm xong.

**Cách làm khác so với sau này**
- **Trả phòng sớm**: Desk chưa có nút trả phòng trước ngày đi (có ở v1.0.2 – cách dưới đây chỉ dùng tới khi v1.0.2 lên). Lễ tân ghi sổ giao ca và báo quản lý; quản lý điều chỉnh tiền phòng các đêm chưa ở theo quy tắc trả phòng sớm. Không hứa số hoàn với khách. Cách làm: Sổ tay mục 2.14a.
- **Wi-Fi**: Desk chưa có chỗ nhập Wi-Fi (v1.0.5, V5-58), trang khách ghi "hỏi lễ tân". Khách xem thẻ Wi-Fi trong căn; lễ tân đọc tên mạng và mật khẩu khi khách hỏi.
- **Đổi phòng khi khách đang ở**: hộp **Đổi phòng** còn có thể liệt kê căn chưa dọn. Xem **Buồng phòng** hoặc **Sơ đồ phòng** trước khi chọn; chọn nhầm căn chưa dọn thì Desk báo và không lưu gì.
- **Form "Yêu cầu đặt phòng" trên ottimo.vn tắt** tới khi anh/chị quyết ESC-030 (bật khi luật sư chưa trả lời, hay chờ luật sư). Trong lúc này khách liên hệ qua Zalo hoặc điện thoại. Khi được quyết, chủ đầu tư bật trên Desk trong 1 phút, không cần cài lại.
- **Đơn OTA nhập tay.** Có đơn OTA mới thì lễ tân nhập vào Desk ngay và đóng phòng trên extranet của kênh khác. Desk chặn trùng trong app, nhưng chưa tự đóng phòng trên kênh.
- **Quản lý chưa xác nhận được ngay trên màn của lễ tân, tại quầy hay từ xa.** Vì quản lý và chủ đầu tư đều có đăng nhập 2 bước, Desk từ chối mọi ô "mật khẩu của quản lý" trên phiên của lễ tân. Cách làm ở v1.0:
  - Miễn/giảm vượt hạn mức, xóa công nợ, hoàn tiền: lễ tân gửi yêu cầu, quản lý hoặc chủ đầu tư duyệt ở **"Cần duyệt"** bằng tài khoản của chính mình (máy quầy sau khi lễ tân đăng xuất, hoặc thiết bị riêng).
  - **Phụ thu trả muộn bằng giá 1 đêm** (khách rời sau 18:00 mà đêm đó căn đã có khách đến): đã vá trong `rc.3` (ESC-031) – lễ tân gọi quản lý báo trước, rồi **"Ghi phụ thu – quản lý xem lại"**, quản lý xem lại trong 24 giờ. Giới hạn của v1.0: quản lý nghe máy và muốn miễn ngay thì **khách vẫn trả đủ tại quầy, rồi OTTIMO hoàn** sau khi quản lý sửa dòng (không miễn tại quầy được). Vẫn nên phòng trước: chốt giờ đi từ 12:00 với khách đi hôm nay nếu căn có khách đến tối nay; khách ở quá 18:00 thì ưu tiên đổi căn cho khách sắp đến để Desk tính thêm 1 đêm như thường. Cách làm: Sổ tay mục 1.9, 2.15; `staff-one-pager.md`.
  - Không đọc mật khẩu qua điện thoại, không đưa mật khẩu cho lễ tân gõ hộ.
- **Chủ đầu tư và quản lý chưa đăng nhập app nhân viên** (`staff.ottimo.vn`) vì tài khoản có đăng nhập 2 bước; app báo "Đăng nhập 2 bước sẽ có ở bản sau". Kiểm phòng do lễ tân trưởng làm trên app.
- **Minibar khi trả phòng:** app nhân viên chưa có màn đếm minibar. Buồng phòng đếm tủ, báo lễ tân số còn lại từng món (gọi hoặc nói trực tiếp; tin nhắn nội bộ không ghi tên khách); lễ tân nhập ở bước Minibar.
- **Giá đã lên lịch:** Desk chưa hiện danh sách giá đã lên lịch cho ngày sau và chưa có nút hủy (có ở v1.0.2). Mỗi lần lên lịch giá cho ngày sau, ghi căn, giá, ngày hiệu lực vào sổ. Muốn bỏ một giá đã lên lịch: nhập lại giá hiện hành với đúng ngày hiệu lực đó. Ở buổi B2, anh/chị nhập giá có hiệu lực ngay hôm đó.
- **Hạn lưu ảnh giấy tờ của khách đồng ý lưu:** v1.0 tự xóa **30 ngày** sau trả phòng (giới hạn hiện tại của tham số). Mức 3 tháng anh/chị chọn 26/10 áp ở bản vá sau khi đội bảo mật duyệt. Lễ tân đọc số ngày trên câu hỏi đồng ý của Desk khi nói với khách. Tờ **Your ID details** ở quầy ghi câu chung: xóa trong vòng 3 tháng sau khi trả phòng, trừ phần pháp luật yêu cầu lưu lâu hơn; bản sao trong dữ liệu sao lưu đã mã hóa xóa trong 35 ngày sau đó (`staff-one-pager.md` Tờ 4, khớp trang chính sách trên ottimo.vn).
- **Kế toán chưa có tài khoản riêng trên Desk.** Việc đối chiếu do anh/chị hoặc quản lý làm trên Desk, kế toán ngồi cùng hoặc nhận số liệu. Cách cấp quyền cho kế toán chờ anh/chị quyết **ESC-038**.
- **Nhật ký xem giấy tờ:** mỗi lần xem số giấy tờ đầy đủ đều được ghi, nhưng Desk v1.0 chưa có màn để anh/chị tự xem nhật ký này; cần tra thì báo đội qua `/feedback`.
- **Giờ nhận phòng 12:00 trên các kênh ngoài Desk** anh/chị tự đổi trước ngày chạy: extranet Booking.com, Agoda, Airbnb (giờ nhận phòng và nội quy), Google Maps, fanpage, thẻ trong căn. Kênh OTA chưa đổi thì chưa thu được phụ thu nhận sớm của khách đặt qua kênh đó. Tin nhắn xác nhận và tin nhắc trước ngày đến ở v1.0 vẫn gửi tay: dùng câu chuẩn ở trên, không viết "phòng sẵn sàng từ 12:00".
- **Mã cửa** vẫn tạo trên app khóa như hiện nay, ngoài Desk. Chỉ đọc cho khách tại quầy hoặc lễ tân tự gọi ra số điện thoại trên đơn; không gửi bằng tin nhắn, email hay ảnh.
- **Tài khoản nhận chuyển khoản** mới nhập chỉ có hiệu lực **từ ngày hôm sau**. Đây là cách chống tráo tài khoản, không phải lỗi.
- **Khách dài hạn** dùng "Đơn dài hạn nhập tay" để giữ căn trên sơ đồ. Tiền thuê, ký quỹ, lịch kỳ thu, điện nước chưa có trong app: thu và ghi theo sổ hiện nay (Sổ tay mục 2.7). Khoản phát sinh trong lúc ở (giặt, dọn lẻ) ghi bằng **Thêm phát sinh** như đơn ngắn ngày.
- **Hóa đơn GTGT** vẫn xuất ngoài app. Desk ghi thông tin công ty để xuất.
- **Mất mạng:** chưa có bảng dự phòng in sẵn. Ba ngày đầu giữ sổ giấy song song (hướng dẫn `product/docs/day-one-guide.md`).
- **Yêu cầu của khách về dữ liệu cá nhân** (xem, sửa, xóa): khách hỏi lễ tân (tờ ở quầy ghi vậy); lễ tân ghi lại, chuyển anh/chị; anh/chị xử lý bằng tay.
- **Hủy đơn với lý do "Khác (ghi rõ)" chưa làm được** (BUG-R3-046, P2, **đã sửa ở v1.0.4**). Ở hộp **Hủy giữ chỗ** và **Hủy đơn**, chọn **Khác (ghi rõ)** thì hộp báo "Chưa tính được phí hủy nên chưa hủy được" và khóa nút, kể cả khi đã gõ ghi chú và bấm **Thử lại**. Không sai tiền (không hủy được thì không ghi gì). Cách làm: chọn lý do có sẵn gần nhất, thường là **Không liên lạc được** hoặc **Khách đổi ý**; điều cần giải thích ghi vào sổ giao ca kèm mã đơn. Sổ tay mục 2.4, 2.8.
- **Folio đã khóa sau 24 giờ** (BUG-R3-045, P3): câu báo trên Desk ghi "Chỉ quản lý ghi được bút toán điều chỉnh" nhưng thực tế không ai ghi được, kể cả quản lý; nút **Thêm phát sinh** còn hiện tới khoảng 1 giờ sau khi khóa. Khoản còn nợ: **Thu công nợ** hoặc **Xóa công nợ**. Phát hiện mới sau 24 giờ: ghi sổ giao ca, báo anh/chị. Sổ tay mục 1.11.
- **Email:** đường gửi thư đã thử ở buổi B2 (thư thử tới hộp thư của chủ đầu tư, không vào Spam). **Thư báo bảo mật chưa tới ai** (BUG-R3-032, sửa ở v1.0.3): xem đầu mục này. Hộp `info@ottimo.vn` là hộp thư chung, không dùng để nhận thư bảo mật.

**Lỗi nhỏ còn mở (mức P3, không sai tiền, không chặn việc)** – sửa ở bản vá hằng tuần. PO chốt phạm vi v1.0.3 ngày 03/11: v1.0.3 chỉ có thư báo bảo mật. Dòng ghi "v1.0.4–v1.0.5" đi v1.0.4 nếu kịp mà không làm trễ nhóm giữ chỗ quá hạn, không thì v1.0.5. *Cập nhật 06/11: trạng thái thật ghi ở cuối từng dòng.*
- Desk, hộp "Giữ chỗ": số cọc và nội dung chuyển khoản hiện hai lần; khi khách đến hôm nay vẫn hiện ô chọn thời hạn giữ dù không giữ được (**đã sửa ở v1.0.4**).
- Desk, bước "Phụ phí" khi trả phòng: các nút nhanh (giặt ủi, F&B, hút thuốc, mất thẻ) mở hộp nhưng chưa chọn sẵn khoản – lễ tân chọn tay (v1.0.5, V5-59).
- Desk, khung đơn đang ở: dòng "Còn phải thu" hiện hai lần, cùng một số (**đã sửa ở v1.0.4**).
- Desk, sau khi chi hoàn: thông báo có dấu trừ thừa, ví dụ "Đã ghi hoàn -500.000 đ" (**đã sửa ở v1.0.4**). Số tiền ghi sổ đúng.
- Desk, "Cần chú ý": dòng giữ chỗ sắp hết hạn chưa ghi mã đơn (v1.0.5, V5-59).
- Desk, **Nhật ký tiền → Hoàn tiền**: trên máy **chưa** cấp quyền, nút **Nhập nơi nhận hoàn** vẫn hiện; bấm **Lưu** thì Desk không lưu (đúng) nhưng báo sai lý do "Máy này chưa được cấp quyền xem giấy tờ và mã cửa…" (BUG-R3-048, v1.0.5, V5-53). Nhập nơi nhận hoàn trên máy quầy đã cấp quyền. Sổ tay mục 0.5.
- Desk, khung đơn **giữ chỗ**: hiện nút **Tạo link check-in online** và **Thu hồi link**, nhưng Desk chỉ cấp link cho đơn đã xác nhận nên luôn từ chối (BUG-R3-047, **đã sửa ở v1.0.4**: đơn giữ chỗ không còn nút này).
- Desk, nhận phòng: chip "Cần nhập thông tin" đè nút "Xem đủ số / ảnh" trên màn 1366 px (backlog cải tiến).
- Desk, đặt phòng mới: sau "Tạo nhanh khách", ô "Khách đứng tên" đôi khi vẫn đỏ tới lần bấm sau (backlog cải tiến).
- App buồng phòng: việc "Bổ sung minibar" còn nằm dưới "Khách đang ở" sau khi khách đã trả phòng (backlog cải tiến).
- Trang khách: câu "Ngôn ngữ theo trình duyệt của bạn" hiện cả khi ngôn ngữ lấy theo hồ sơ khách (v1.0.5, V5-23).
- Desk, một số chữ chưa gọn: mã lý do thô trong Nhật ký tiền, tiêu đề hộp mật khẩu khi xem số tài khoản, câu "phí phạt" hiện cả với giặt ủi, nhãn ô người đi cùng, phím Esc không đóng khung đơn, báo giá thứ Sáu 1 đêm chỉ báo "tối thiểu 2 đêm" sau khi mở hộp, tìm đơn chưa tìm theo tên khách (chữ: v1.0.5, V5-23; tìm theo tên: V5-57; phím Esc và báo giá thứ Sáu: backlog cải tiến).
- Desk, nơi nhận hoàn tiền: phải gõ mã ngân hàng 6 số, chưa có danh sách chọn ngân hàng (v1.1).
- Kiểm tra trình đọc màn hình (VoiceOver) cho hộp xác nhận chưa xong (v1.1).
- Thêm từ lượt kiểm sổ tay và rc.4–rc.6 (bản vá v1.0.x, cách làm tạm ở Sổ tay mục 5.6): màn **Trả phòng** mở được trước ngày đi rồi báo lỗi khi hoàn tất; hộp **Xác nhận cọc** chưa có ô mã giao dịch (ghi sổ giao ca); app nhân viên thiếu loại sự cố "Tắc thoát nước", "Wi-Fi"; trang khách mất lựa chọn "Bổ sung tại quầy" khi mở lại link; vài chữ còn lộ "Round 3" hoặc nhãn chưa đúng; app nhân viên hiện hai câu trái nhau khi chủ đầu tư/quản lý đăng nhập; folio ở màn Trả phòng hiện số âm cho dòng miễn **Bị từ chối** (số đó không bị trừ); nút **Hoàn tác nhận phòng** bấm được nhưng bị từ chối khi folio đã có dòng mới; mục "tiền dư đơn đã đóng" còn hiện tới khi Desk đóng phiếu; phiếu ghi "Phụ thu trả muộn (00:15)" cho khoản phụ thu bằng 1 đêm; phí hủy, phí không đến ghi từ 00:00 tới 05:59 mang ngày lịch thay vì ngày kinh doanh (BUG-R3-024…031, 034–036). *Cập nhật 06/11:* đã sửa ở v1.0.4 màn Trả phòng trước ngày đi (024) và hai câu trái nhau ở app nhân viên (029); v1.0.5: ô mã giao dịch (V5-51), mở lại link (V5-5A), chữ "Round 3" và phiếu "Phụ thu trả muộn" (V5-23), số âm dòng miễn (V5-52), phí hủy và phí không đến sau nửa đêm (V5-11); còn lại vào backlog cải tiến.

**Ghi chú kỹ thuật (không ảnh hưởng bản thật)**
- Hai trường hợp công nợ chỉ xảy ra với dữ liệu ghi trước tháng 10/2026 (FZ-08, BUG-R2-210). Bản thật bắt đầu từ dữ liệu trống nên không gặp. Đội vẫn sửa ở v1.1.
- App buồng phòng chưa được nhân viên thật thử trên điện thoại thật. Tuần đầu đội theo dõi góp ý của buồng phòng qua `/feedback`.
- Bản ghi nhật ký của buổi cài đặt production (B2, 28/10) thiếu danh sách căn và kênh; dữ liệu căn, kênh trên Desk đúng. Nhật ký chỉ ghi thêm nên bản ghi cũ giữ nguyên; lỗi không lặp lại từ `v1.0.0` (BUG-R3-040).

### Cách báo lỗi
Gõ `/feedback <mô tả>`. Lỗi làm không đặt, nhận, trả phòng hay thu tiền được, hoặc sai tiền: ghi "P0" ở đầu, đội sửa trong ngày.
