# SEC review – PR #72, sổ tay v1.0.4 đợt r4c (phần bảo mật)

- Người review: SEC | Round 4, đợt v1.0.4, bước **Review** | 05/11/2026
- Đối tượng: nhánh `v104/ba-docs-r4c` @ **`11794c25`** (`11794c25a0fda71a422749ac2827463329d0f998`).
  - Đọc bằng `git diff origin/main...origin/v104/ba-docs-r4c -- product/docs/manual/`, merge-base `06626ead`.
  - Diff có 4 tệp, đều là tài liệu: `user-manual-v1.0.md`, `guides/00-index.md`, `guides/01-chu-dau-tu-quan-ly.md`, `guides/02-le-tan.md` (+104/−15).
- Phạm vi SEC:
  - quét dữ liệu nhạy cảm trong mọi từ thêm mới;
  - xem các bước mới có dạy lễ tân lách kiểm soát không, và việc của quản lý có còn ghi là quản lý làm không;
  - xem dòng sổ tay cho SEC-BE-PR74-02 đã đủ an toàn chưa.
  - Đúng sai nghiệp vụ (giá Nội bộ, giữ chỗ theo giá thỏa thuận, 2 tủ minibar, đơn quá ngày đi) là việc của DOM và PO. SEC chỉ xem các phần này ở góc quyền, tiền và dữ liệu.
- Căn cứ là mã trên `origin/main` @ `a08374bb`:
  - `reservations/public/stay-night-pricing.ts` (`setNightRate`), `folio/internal/folio-lines.service.ts` (`adjust`);
  - `folio/public/folio.service.ts` (`waiverLimitInput`, `reductionUsage`), `approvals/internal/limits.ts`;
  - `frontdesk/internal/stay.service.ts` (`changeRoom`, gia hạn B13), `registration/internal/registration.service.ts`;
  - `admin-web/src/pages/registration/RegistrationPage.tsx`;
  - các review SEC trước: `SEC-on-v104-pr74-checkin-occupied.md`, `SEC-on-v104-pr71-internal-nights.md`.
- SEC chỉ sửa tệp này. Không commit, không push, không đụng nhánh BA.

## 0. Kết luận

**ĐẠT CÓ ĐIỀU KIỆN.** Gộp được sau khi sửa thẻ **01** (Major). Thẻ này chỉ cần sửa chữ.
- **Dữ liệu: sạch** (mục 1).
- **Lách kiểm soát: không có bước nào dạy lách.** Các việc cần quản lý vẫn ghi rõ là quản lý làm (mục 2).
- **SEC-BE-PR74-02: câu kiểm căn đủ an toàn cho tới v1.0.5.** SEC chấp nhận chữ lệch so với đề xuất. Chỗ còn thiếu là ở phía người duyệt (thẻ 02, Minor).
- **Thẻ 01 (Major):** khối **Đơn quá ngày đi**, trường hợp (b), dẫn lễ tân sang mục 9.3. Làm theo mục đó, lễ tân sẽ:
  - kéo dài mã cửa cho người đã đi;
  - khai lên cổng Bộ Công an một ngày đi sai cho khách nước ngoài.
- **Thẻ 03 (Minor):** câu "từ 2 đêm chủ đầu tư duyệt" Desk không chặn.
- **Thẻ 04 (Suggestion):** đơn Nội bộ nên ghi tên người cho phép.

## 1. Dữ liệu nhạy cảm

SEC quét mọi từ thêm mới (`git diff --word-diff`) và mọi dòng thêm mới, kể cả các dòng "Lập:" và bảng phiên bản.

| Loại | Kết quả |
|---|---|
| Email | Chỉ có `info@`, `booking@`, `info+…@`, `booking+…@`, nằm trong các dòng "Lập:" cũ. Các dòng này đã có trên `main` (SEC PR68). Không có email mới |
| IP, tên máy chủ, tên đăng nhập | Không có |
| Khóa, mật khẩu, mã 2 bước | Không có. Chữ "mật khẩu" chỉ nằm trong các dòng "Lập:" cũ, không có trong từ mới |
| Số tài khoản, số thẻ, số điện thoại, chuỗi từ 6 chữ số | Không có. Chuỗi hex duy nhất là mã commit (`f9ff4e1f`, `2c8cd8cf`, `c9af9f4c`, `0df6a67b`, `055e92d5`) |
| Tên khách, tên người | Không có. Mã đơn chỉ ở dạng `OTM-…`. Căn 202 đã có trên `main` |
| Hoa hồng, doanh thu | Không có. Số tiền chỉ là ví dụ: 800.000, 700.000, 500.000, 400.000, 100.000 đ |
| Ảnh | Không có ảnh mới, chỉ giữ chỗ `[ẢNH: …]` cũ |

- Chú thích ẩn `<!-- -->` có nhắc đường mở ngoại lệ của PR74-02 và tên trường API. SEC chấp nhận, vì:
  - cùng nội dung đó đã có trong các tệp review công khai và trong mã;
  - bản HTML phát cho nhân viên (bản dựng trên máy, chưa commit) không có `<!--` nào.

  BA giữ cách dựng HTML không mang chú thích theo.

## 2. Có dạy lễ tân lách kiểm soát không

| Bước mới trong sổ tay | Kiểm soát trong mã | SEC |
|---|---|---|
| Đơn Nội bộ có cả đêm thu và đêm miễn phí: lễ tân gõ đủ giá mọi đêm. Quản lý hoặc chủ đầu tư sửa đêm miễn phí về 0 ở **Folio**. Lễ tân và lễ tân trưởng không sửa được. Cấm dùng FOC hay giảm 100 % | `setNightRate` chỉ nhận giá 0 khi có `zeroByManager` (OWN/MGR), kênh `internal`, dòng `room`, đơn còn `hold`/`confirmed`/`in_house`. Có audit `reservation.repriced` (SEC PR71) | **Đúng.** Đêm miễn phí phải qua người có vai quản lý, và để lại audit có vai đó |
| Giữ chỗ khi có giá thỏa thuận: giữ theo giá niêm yết. Tiền về thì lễ tân **Điều chỉnh** giá đêm ở Folio. Giá dưới sàn thì xin giảm giá đặc biệt có duyệt | A31 → `setNightRate` áp sàn–trần BR-105 của nhóm căn cho mọi vai, trừ kênh `internal`, đúng như form đặt phòng. Lý do bắt buộc, có audit | **Không mở thêm quyền.** Lễ tân vẫn chỉ trong khoảng sàn–trần như lúc tạo đơn. Ghi giá thỏa thuận vào sổ giao ca trước khi giữ chỗ là một dấu để đối chiếu, nên giữ |
| OTA từ v1.0.4 để trống thì lấy giá niêm yết. Giá ngoài sàn–trần lưu được nếu kèm lý do | Có từ trước | Không đổi. Câu "không nhập số thẻ vào Desk" vẫn còn |
| Nhận phòng: căn `OC`/`OD` hoặc còn đơn khác đang ở thì không có ngoại lệ, kể cả lễ tân trưởng. Căn kẹt `OC` sau **Đã trả phòng**: không nhận khách, đổi căn, báo quản lý. Cấm dùng `OOO` để đặt lại trạng thái | #74: `overridableBy` chỉ có khi `room && !holder && VD/CL` | **Đúng.** Sổ tay nêu tên `OOO` để cấm, SEC chấp nhận. Lý do: `OOO` không mở được căn còn lượt ở, vì #74 chặn theo `holder` chứ không theo trạng thái. Căn cũng phải dọn xong mới về `VC`/`VI` |
| 2 tủ minibar: lỡ bị đảo thì **Thêm phát sinh** (tăng tiền). Khách đã đi thì quản lý quyết | – | Không có khoản giảm nào bỏ qua quản lý |
| Đơn quá ngày đi, trường hợp (b): xin giảm 100 % qua **Gửi duyệt**, có kết quả mới hoàn tất. Gõ giờ 12:00 kèm **Ghi chú giờ trả** | `special_discount` phải qua duyệt, không tự duyệt được. `TIME_AFTER_ACTION` chặn giờ muộn hơn lúc bấm. `checkoutTimeNote` bắt buộc khi ghi bù | **Đúng hướng.** Người duyệt kiểm độc lập qua buồng phòng và sổ giao ca. Còn hai chỗ: thẻ 01 và thẻ 03 |
| Căn kẹt: nâng hạng, OTTIMO chịu chênh | Lý do "OTTIMO đổi – giữ giá đã đặt" ở mục 6.1 có từ trước, kèm "báo quản lý ngay" | Chấp nhận |

## 3. SEC-BE-PR74-02: sổ tay đã đủ an toàn chưa

**Chỗ BA lệch so với chữ SEC đề xuất là đúng.**
- SEC chạy `git grep 'stayScope|roomReturnRecorded|until_parent_departure'` trên `product/apps` (admin-web, mobile, booking-web, guest-web) ở `main`: 0 dòng.
- Máy chủ mặc định `whole_stay` (`stay.service.ts` dòng 848–850).
- Vậy ca đúng của thẻ (ngày về căn cũ mà chưa ghi "đã chuyển về") không tạo được từ Desk hay app. Chỉ gọi thẳng API mới tạo được.

**Desk tạo được một ca gần giống: đổi phòng trong ngày** (`02` 9.4). SEC suy ra từ đọc mã, chưa chạy thử.
- Desk không gửi `oldRoomVacated`. Máy chủ mặc định `true`, nên căn cũ lên `VD` ngay (`stay.service.ts` dòng 845, 1192).
- Ngày chuyển, `inRoomOnSql` lấy đoạn mới nhất, nên căn cũ không có `holder`.
- Kết quả: lễ tân trưởng trở lên xác nhận được ngoại lệ cho một đơn đến căn cũ, trong lúc khách hoặc đồ của khách vẫn còn trong căn.
- Ca này có từ R2, không do #74 mở.

**Câu BA viết phủ được cả hai ca.**
- Câu ở `02` 7.4 và sổ tay 2.10, đặt trước câu chặn: "kiểm căn… thật sự không còn người và đồ của khách, nhất là căn có khách **đổi phòng** trong hôm nay mà chưa chuyển xong. Còn người hoặc đồ: không xác nhận".
- Câu này đúng hướng hơn chữ SEC đề xuất, vì chữ SEC trỏ vào một nút không có.

**Kết luận:** đủ an toàn cho tới v1.0.5, rủi ro còn lại **Low**.
- Phần sổ tay của PR74-02: SEC đóng khi #72 gộp.
- Phần mã vẫn Open, sửa ở v1.0.5.

**Còn thiếu (thẻ 02):**
- Người duyệt ở **Cần duyệt** không được nhắc câu này. Chủ đầu tư thường duyệt trên laptop riêng, không thấy căn.
- **Lý do** không ghi việc đã kiểm, nên người duyệt không biết lễ tân đã kiểm chưa.
- Lúc giao mã không có bước kiểm mã cũ trên app khóa.

## 4. Thẻ

### FB-R4-SEC-BA-PR72-01
- Mức độ: **Major**. Sửa trước khi gộp #72, chỉ cần sửa chữ.
- Vị trí:
  - `02` 11.1, khối **Đơn quá ngày đi, vẫn Đang ở**, bước 2 và bước 3 (b); sổ tay 2.14, cùng khối.
  - Các mục liên quan: `02` 9.3 bước 4 và sổ tay 2.12 **Gia hạn** bước 4; `02` 8.3 và sổ tay 2.11, gạch "Khách nước ngoài **gia hạn, trả sớm hoặc trả phòng**".
- Vấn đề:
  - Bước 2 bảo **Gia hạn** tới hôm nay "(mục 9.3)". Mục 9.3 bước 4 ghi: "Kéo dài hiệu lực mã cửa trên app khóa. Khách nước ngoài: cập nhật khai báo trong ngày." Khối (b) không dặn bỏ hai việc này, dù khách đã đi từ trước.
  - **Mã cửa:** làm đúng chữ thì lễ tân mở lại mã cho một người không còn là khách.
  - **Khai báo:**
    - Gia hạn (B13) gọi `registration.onDepartureChanged`. Hồ sơ có khách nước ngoài chuyển sang `needs_update` và hiện ở tab **Cần cập nhật ngày đi**. Trả phòng (B18) chuyển lại một lần nữa.
    - Khối **Sao chép lên cổng khai báo** lấy ô ngày đi từ `reg.actual_departure_date ?? stay.effectiveDepartureDate` (`registration.service.ts` dòng 2206).
    - Desk không có nút ghi ngày đi thật. `mark-updated` chỉ có ở API; `RegistrationPage.tsx` chỉ gửi `mark-sent`, `mark-confirmed`, `mark-rejected`.
    - Vì vậy ô ngày đi Desk đưa ra là ngày gia hạn, tức hôm nay. Lễ tân dán ô này theo mục 8.3 là khai sai ngày đi lên cổng Bộ Công an.
  - **Thị thực:** khi gia hạn, Desk có thể báo thị thực hết hạn trước ngày đi mới (`VISA_EXPIRES_BEFORE_DEPARTURE`, cảnh báo mềm, cần ghi lý do). Sổ tay chưa nói ghi gì. Nếu thị thực hết hạn trong khoảng từ ngày đi thật tới hôm nay, hồ sơ trên cổng trông như khách ở quá hạn thị thực tại OTTIMO.
- Vì sao quan trọng:
  - Dữ liệu cá nhân gửi cơ quan nhà nước phải đúng. Ngày đi sai có thể gây rắc rối cho chính khách, khi gia hạn thị thực hay xuất cảnh, và cho cả OTTIMO. SEC không kết luận về pháp lý. Cách khai khi ghi trả phòng muộn trên hệ thống cần DOM xác nhận.
  - Theo sổ tay, ca (b) "hay gặp hơn" ca (a). Khối này áp dụng ngay, không chờ v1.0.4.
- Đề xuất sửa: thêm vào (b), ở cả `02` và sổ tay. Đây là chữ đề xuất; câu về cổng khai báo cần DOM duyệt.
  - "**Không** kéo dài mã cửa: khách đã đi, bỏ câu kéo dài mã ở mục 9.3 bước 4. Ở bước trả phòng, vẫn mở app khóa: còn mã của lượt này thì xóa."
  - "Desk báo thị thực hết hạn trước ngày đi mới: ghi lý do 'Gia hạn để trả phòng, khách đi ngày …'."
  - "Khách nước ngoài: hồ sơ sẽ hiện ở **Cần cập nhật ngày đi**. Ngày đi trên cổng phải là **ngày khách đi thật**. Ô ngày đi Desk hiện là ngày gia hạn: **không** dán ô đó. [DOM chọn một trong hai: không cập nhật cổng vì ngày đã khai đúng ngày khách đi / gõ tay ngày đi thật]. Không chắc thì hỏi quản lý trước khi gửi cổng."
  - Giữ (a) như cũ. Khách ở thật thì kéo dài mã nếu khách còn cần vào căn, và cập nhật cổng theo ngày khách rời thật.
  - Thêm vào `02` 9.3 bước 4, sổ tay 2.12 bước 4 và `02` 8.3, sổ tay 2.11 một vế: "trừ đơn quá ngày đi mà khách đã đi (mục 11.1, trường hợp (b))".
- Trạng thái: Open

### FB-R4-SEC-BA-PR72-02
- Mức độ: **Minor**. Làm trong round, nên làm cùng lượt với thẻ 01. Không chặn gộp.
- Vị trí:
  - `02` 7.4 và sổ tay 2.10, câu "Trước khi gửi hoặc xác nhận ngoại lệ";
  - `02` 14.3 **Duyệt yêu cầu trong hạn mức**;
  - `01` mục 4 và sổ tay 1.8 **Duyệt yêu cầu (Cần duyệt)**, ở dòng "Nhận phòng khi buồng chưa sẵn sàng" và bước "Đọc: ai gửi…".
- Vấn đề:
  - Câu kiểm căn (SEC-BE-PR74-02) chỉ nằm ở 7.4 và 2.10. Người duyệt yêu cầu "Nhận phòng khi buồng chưa sẵn sàng" ở **Cần duyệt** không được nhắc: lễ tân trưởng đọc 14.3; quản lý và chủ đầu tư đọc `01` mục 4 hoặc sổ tay 1.8. Chủ đầu tư thường duyệt trên laptop riêng, không thấy căn.
  - Desk chỉ bắt **Lý do** phải có chữ. Sổ tay không dặn ghi việc đã kiểm, nên người duyệt không biết lễ tân đã kiểm chưa, và về sau cũng không truy được ai đã kiểm.
  - Căn vừa có khách đổi phòng: mục 9.4 dặn xóa mã căn cũ, nhưng lúc giao mã cho khách mới không có bước kiểm lại. Quên xóa thì khách cũ vẫn mở được cửa căn đã có khách mới.
- Vì sao quan trọng: tới v1.0.5, bước kiểm tận nơi là lớp chặn duy nhất cho ca này. Hậu quả giống BUG-R4-039: giao cho khách mới một căn còn người.
- Đề xuất sửa:
  - 7.4 và 2.10, thêm hai câu:
    - "**Lý do** ghi: 'Đã kiểm căn trống lúc hh:mm, người kiểm: <tên nhân viên>'. Không ghi tên hay thông tin của khách."
    - "Trước khi giao mã căn này: trên app khóa, kiểm căn không còn mã nào khác còn hạn."
  - 14.3, `01` mục 4 và sổ tay 1.8, thêm: "Yêu cầu nhận phòng khi buồng chưa sẵn sàng: chỉ duyệt khi **Lý do** ghi đã kiểm căn trống, có giờ và người kiểm. Căn có khách đổi phòng hôm nay mà Lý do không ghi đã kiểm: gọi quầy hoặc từ chối."
- Trạng thái: Open

### FB-R4-SEC-BA-PR72-03
- Mức độ: **Minor**
- Vị trí:
  - `02` 11.1 (b) và sổ tay 2.14 (b), câu "Quản lý duyệt tới 1 đêm; từ 2 đêm trở lên thì chủ đầu tư duyệt";
  - `01`, bảng hỏi đáp, dòng "Yêu cầu giảm giá đặc biệt 100 % … Quên bấm Trả phòng": "(quản lý tới 1 đêm, từ 2 đêm chủ đầu tư)".
- Vấn đề:
  - Sổ tay dặn lễ tân gửi một yêu cầu cho **từng dòng** tiền phòng.
  - Desk tính hạn mức theo dòng: `waiverLimitInput` gọi `reductionUsage(lineId)`, chỉ cộng các khoản giảm của **dòng đó**, không cộng cả đơn. Hạn mức của quản lý là `one_night_rate` mỗi lần, không có hạn tháng (`limits.ts`).
  - Vậy mỗi yêu cầu bằng đúng 1 đêm, và Desk chuyển nó tới quản lý. Đơn quá hạn 3 đêm thì quản lý tự duyệt được cả 3 yêu cầu. Desk không chặn quy tắc "từ 2 đêm chủ đầu tư".
  - Ở tệp 02, câu này không có tác dụng, vì người gửi không chọn được người duyệt. Ở tệp 01, câu này lại không nói Desk không chặn.
- Vì sao quan trọng:
  - Chủ đầu tư đọc sổ tay sẽ nghĩ Desk giữ cổng chủ đầu tư cho đơn từ 2 đêm. Thật ra cổng này chỉ dựa vào việc quản lý tự dừng.
  - Đây là đường có thể dùng để xóa tiền phòng của khách ở thật: thu tiền mặt ngoài sổ, rồi xin giảm với lý do "quên bấm".
  - Hiện chủ đầu tư là người trực duyệt, nên tác động thấp.
- Đề xuất sửa:
  - `01`, dòng hỏi đáp, thêm:
    - "Desk gửi mỗi đêm một yêu cầu và cho quản lý duyệt từng yêu cầu. Xin giảm từ 2 đêm trở lên: quản lý **không** bấm **Duyệt**, để chủ đầu tư duyệt."
    - "Xem thêm app khóa: mã của lượt ở có bị kéo dài, hay được dùng sau ngày đi không." Mã cửa đặt hạn tới giờ trả phòng (mục 7.5), nên đây là bằng chứng độc lập.
  - `02` (b) và sổ tay: đổi thành "Quản lý hoặc chủ đầu tư duyệt", bỏ vế "từ 2 đêm".
  - Chủ đầu tư thêm vào bộ lọc tuần của **Nhật ký tiền** (SEC PR71 mục 9.5): giảm giá đặc biệt có lý do "Quên bấm Trả phòng".
  - Nếu PO hoặc DOM muốn Desk tự giữ cổng này: ở v1.0.5, cộng các yêu cầu cùng lý do trên cả đơn, như Desk đã làm với xóa công nợ (`debt_write_off`). PO xếp việc này.
- Trạng thái: Open

### FB-R4-SEC-BA-PR72-04
- Mức độ: Suggestion
- Vị trí: `02` 5.1 bước 4, gạch **Nội bộ**; sổ tay 2.5 bước 4; `01`, bảng hỏi đáp, dòng "Đơn Nội bộ có đêm miễn phí".
- Vấn đề:
  - Sổ tay chỉ dặn ghi "ai cho" ở ca có cả đêm thu và đêm miễn phí.
  - Đơn Nội bộ 0 đ cho cả đơn thì lễ tân tạo được mà không cần ai duyệt. Desk chỉ bắt phải có **Ghi chú nội bộ** (SEC PR71 mục 1).
  - Sổ tay không nói ai được quyền cho dùng phòng Nội bộ. Khi quản lý sửa một đêm về 0, sổ tay cũng không nhắc kiểm "ai cho".
- Vì sao quan trọng: với đơn Nội bộ chỉ có kiểm soát phát hiện, gồm ghi chú, audit và bộ lọc tuần. Ghi chú không có tên người cho thì kiểm soát này yếu.
- Đề xuất:
  - `02` và sổ tay: "Đơn Nội bộ chỉ tạo khi chủ đầu tư hoặc quản lý đã đồng ý. **Ghi chú nội bộ** ghi người cho, lý do, số đêm miễn phí."
  - `01`, dòng hỏi đáp: "Trước khi sửa về 0: kiểm **Ghi chú nội bộ** ghi đúng người đã cho."
  - Ai được quyền cho là quy tắc của PO và DOM. SEC chỉ đề nghị ghi quy tắc đó ra.
- Trạng thái: Open

## 5. Ghi chú cho ORC

- **v1.0.5 – thêm vào phần mã của SEC-BE-PR74-02** (cho ARC, BE, FE):
  - hộp **Đổi phòng** hỏi "Khách đã dọn khỏi căn cũ chưa?" rồi gửi `oldRoomVacated`;
  - chưa dọn thì căn cũ giữ `OD`, nên ngoại lệ bị chặn;
  - ARC xem cách đưa `OD` về `VD` khi khách dọn xong. Nút "Cần dọn" đã nằm trong backlog v1.0.5.
- **Căn kẹt `OC`, "đội kỹ thuật sửa trạng thái căn":** hiện chưa có runbook.
  - Sửa trên production phải đi qua API có audit, bằng tài khoản có vai (ví dụ `status-transitions`). Không sửa thẳng vào DB.
  - Nếu buộc phải dùng SQL, gửi SEC duyệt trước, như truy vấn PR74-01.
  - Lời nhắn cho đội kỹ thuật chỉ có số căn và mã đơn, đúng như sổ tay ghi. Không tên khách, không ảnh màn hình.
- **Đề xuất v1.0.5 "Trả phòng theo ngày khách thật sự đi"** (PO, ARC; chú thích DOM lượt 8). Việc này gỡ tận gốc thẻ 01 và gỡ luôn hai chỗ lệch nhỏ. SEC ủng hộ. Ba thứ hiện đều tính từ lúc bấm trả phòng chứ không từ ngày khách đi:
  - ngày đi trên khai báo;
  - giờ trả phòng trong Desk;
  - mốc giữ ảnh giấy tờ (`scheduleAfterStay` lúc B18). Vì vậy ở ca (b), ảnh được giữ lâu thêm đúng số đêm quá hạn.
- **Thẻ 01 cần DOM chốt cách khai cổng** khi trả phòng muộn trên hệ thống. SEC không tạo ESC, vì đây là quy trình nội bộ do DOM quyết. Nếu DOM thấy cần hỏi luật về khai báo muộn thì DOM tạo ESC; SEC chưa thấy cần.
- **Không ESC mới.**

## 6. Điểm làm tốt

- Đêm miễn phí của đơn Nội bộ phải qua quản lý ở Folio, để lại audit có vai quản lý, và sổ tay cấm rõ dùng FOC hay giảm 100 % thay cho bước này.
- Căn kẹt `OC`: không có ngoại lệ, cấm dùng `OOO`, xếp khách sang căn khác và báo quản lý. Lời nhắn cho đội kỹ thuật chỉ có số căn và mã đơn.
- Giá thỏa thuận: ghi vào sổ giao ca trước khi giữ chỗ. Giá dưới sàn phải xin duyệt, không có đường tắt.

## 7. Dòng decision-log đề xuất (ORC ghi khi commit, SEC không sửa decision-log)

`| 2026-11-05 | 4 | **SEC – PR #72 sổ tay v1.0.4 r4c (v104/ba-docs-r4c @ 11794c25, chỉ tài liệu): ĐẠT CÓ ĐK – gộp sau khi sửa thẻ 01** (rounds/round-04/reviews/SEC-on-v104-pr72-manual.md): dữ liệu sạch (không dữ liệu khách, email mới, tên đăng nhập, IP, khóa, số tài khoản, số hoa hồng/doanh thu); không bước nào dạy lách kiểm soát (đêm Nội bộ về 0 chỉ OWN/MGR; giá thỏa thuận trong sàn–trần, dưới sàn qua duyệt; OC/OD và căn còn lượt ở không có ngoại lệ; cấm OOO). SEC-BE-PR74-02 phần sổ tay: chấp nhận câu kiểm căn tận nơi (UI không gửi stayScope/roomReturnRecorded; câu phủ cả ca đổi phòng trong ngày, vì oldRoomVacated mặc định true), đóng khi #72 gộp; phần mã v1.0.5, thêm oldRoomVacated ở hộp Đổi phòng. PR72-01 Major: đơn quá ngày đi (b) – không kéo dài mã cửa, không khai ngày gia hạn lên cổng (ô ngày đi Desk = effectiveDepartureDate), DOM duyệt câu về cổng. PR72-02 Minor: câu kiểm căn ở chỗ người duyệt, Lý do ghi đã kiểm, kiểm mã cũ trên app khóa. PR72-03 Minor: "từ 2 đêm chủ đầu tư" Desk không chặn (hạn mức tính theo dòng). PR72-04 Suggestion: đơn Nội bộ ghi người cho. Không ESC | SEC | Quyền SEC |`

---

## Lượt 2 (05/11/2026) – #72 @ `e200fea1` và soát nhanh #85 @ `f11e928c`

- Đối tượng:
  - #72: `git diff 11794c25..origin/v104/ba-docs-r4c -- product/docs/manual/` (head `e200fea1d0ac6158e3be8e075a3941b7512a9d79`). Bảng thẻ của BA: `rounds/round-04/reviews/BA-reply-v104-pr72.md` trên nhánh.
  - #85: `git diff origin/main...origin/v104/ba-esc045-prices` (head `f11e928c27864e5688fefeb46760764164b791b1`, merge-base `c6b2f78e`). 5 tệp sổ tay, +18/−14.
- Căn cứ mã thêm ở lượt này (`origin/main` @ `a08374bb`):
  - `folio/internal/folio-lines.service.ts` (`adjust`: nhánh `voidLine`);
  - `folio/public/folio.service.ts` (`reverseLine`, audit `folio.line_reversed`);
  - `frontdesk/internal/checkout.service.ts` (`dueAtCheckout`: B18 tính lại phụ thu trả muộn);
  - `docs/api/openapi.yaml` (`adjustFolioLine`: `x-roles [owner, manager, front_desk_lead, front_desk]`);
  - `docs/rbac-matrix.md` (A31 chú thích 23), `docs/business-rules.md` (BR-433, BR-435, BR-436, BR-526);
  - `test/integration/ota-prepaid-flow.test.ts` (FD `voidLine` trả 201).
- SEC chỉ sửa tệp này. Không commit, không push.

### L2.0 Kết luận

- **#72: ĐẠT về bảo mật, gộp được.**
  - SEC-01…04 đã đóng đúng (mục L2.1).
  - Lượt này có thêm một bước mới: **Bỏ cả dòng** minibar trùng. Bước này không mở thêm quyền, nhưng là lần đầu sổ tay chỉ cho lễ tân nút bỏ dòng trên folio đang mở. Mã cho lễ tân bỏ **mọi** dòng phát sinh mà không cần duyệt. Vì vậy có 1 Minor cho sổ tay (thẻ 05) và 1 thẻ mã cho v1.0.5, rủi ro **Medium**, không chặn v1.0.4 (thẻ A31-01).
  - Thêm 1 Suggestion: cho quản lý câu trả lời khi lễ tân hỏi về ghi trễ ngày đi trên cổng (thẻ 06).
- **#85: ĐẠT, không thẻ.** Chỉ có giá công khai (mục L2.4).
- Không ESC mới.

### L2.1 Kiểm SEC-01…04

| Thẻ | Đã kiểm ở | Kết quả |
|---|---|---|
| **PR72-01** (Major) | `02` 11.1 và sổ tay 2.14 khối **Đơn quá ngày đi**; `02` 9.3 bước 4, sổ tay 2.12 **Gia hạn** bước 4; `02` 8.3, sổ tay 2.11 | **Closed.** (b) bước 1: **xóa mã cửa** ngay, không chờ duyệt, ghi sổ giao ca. Bước 2: **không** kéo dài mã; thị thực ghi lý do "Gia hạn để trả phòng, khách đi ngày …". (b) bước con 3: lúc hoàn tất, mở app khóa, còn mã thì xóa. (b) bước con 4: **không** cập nhật ngày đi mới lên cổng; ngày rời là ngày đi trên đơn cũ, cổng chưa ghi thì gõ tay ngày đó; **không** dán ô ngày đi Desk hiện (đúng chỗ gốc: `departureDate = actual_departure_date ?? effectiveDepartureDate`). Vế ngoại lệ có ở cả 9.3 bước 4 và 8.3, ở cả `02` và sổ tay. (a) giữ như cũ. Chữ "hạn và cách ghi trễ: hỏi quản lý": SEC chấp nhận. Điều cần giữ là không khai ngày sai lên cổng, và câu đã giữ được điều đó. Hạn ghi trễ là câu hỏi pháp lý, DOM đã ghi cần chủ đầu tư hoặc luật sư xác nhận (DOM #72 dòng 195). Quản lý hiện chưa có câu trả lời: xem thẻ 06 |
| **PR72-02** (Minor) | `02` 7.4, sổ tay 2.10; `02` 14.3; `01` mục 4; sổ tay 1.8 | **Closed.** 7.4 tách theo ca. Ba câu kiểm (kiểm tận nơi, **Lý do** "Đã kiểm căn trống lúc hh:mm, người kiểm: …", kiểm mã cũ trên app khóa) nằm đúng dưới ca `VD`/`CL`, không lẫn sang ca "căn còn khách". Câu cho người duyệt có ở cả ba chỗ duyệt. Lý do chỉ ghi tên nhân viên, không ghi khách: đúng |
| **PR72-03** (Minor) | `02` 11.1 (b), sổ tay 2.14 (b); `01` 14.1 | **Closed (phần sách).** `02` ghi "Quản lý hoặc chủ đầu tư duyệt". `01` ghi Desk cho quản lý duyệt từng đêm, từ 2 đêm quản lý không bấm **Duyệt**. Duyệt cần ít nhất hai dấu hiệu, gồm app khóa không có lần mở sau ngày đi và mã không bị kéo dài. Cùng một người gửi lý do này nhiều lần trong tháng thì báo chủ đầu tư. Hai phần còn lại SEC chấp nhận **Deferred**: bộ lọc tuần **Nhật ký tiền** gộp với SEC PR71 mục 9.5 (BA/PO); Desk tự giữ cổng 2 đêm ở v1.0.5 (PO xếp) |
| **PR72-04** (Suggestion) | `02` 5.1 bước 4, sổ tay 2.5; `01` 14.1 | **Closed.** "Chỉ tạo khi chủ đầu tư hoặc quản lý đã đồng ý. **Ghi chú nội bộ** ghi người cho, lý do, số đêm miễn phí." Quản lý kiểm người cho trước khi sửa về 0. Giả định "người cho là OWN/MGR" đang chờ DOM: SEC đồng ý giả định này, vì đây là hướng chặt hơn |

**SEC-BE-PR74-02, phần sổ tay:** giữ như lượt 1. Đóng khi #72 gộp. Phần mã ở v1.0.5.

### L2.2 Bước **Bỏ cả dòng** minibar trùng: có mở đường lạm dụng không

Sổ tay mới (`02` 11.1 bước 2, sổ tay 2.14): trước khi trả phòng, nếu có dòng **Thêm phát sinh** ghi minibar căn cũ (cách làm cũ lúc đổi phòng), thì lễ tân **Bỏ cả dòng**, Lý do "Trùng minibar tủ căn cũ", rồi vẫn nhập số tủ căn cũ ở bước **Minibar**. "Lễ tân trở lên bỏ được khi chưa hoàn tất trả phòng."

**Bản thân ca này đúng và cần làm.**
- Nếu không bỏ thì khách bị tính hai lần cho cùng một tủ.
- Dòng bị bỏ được đảo bằng bút toán, không xóa. `reverseLine` ghi audit `folio.line_reversed` kèm lý do và người làm.
- Số tủ căn cũ được đối chiếu với sổ giao ca do người đổi phòng ghi và số buồng phòng đếm. Đây là số của người khác, không phải số lễ tân trả phòng tự đặt.

**Quyền thật trong mã rộng hơn ca này.** Không do #72 mở, có từ R2.
- `adjustFolioLine` cho FD. Ở folio đang mở, nhánh `voidLine` không có giới hạn nào ngoài lý do bắt buộc. Chỉ dòng đêm (`room`, `extra_person`) và dòng giảm (`foc`, `discount`, `adjustment`) bị chặn.
- Vậy lễ tân bỏ được mọi dòng phát sinh khác (minibar, đồ ăn uống, giặt ủi, hư hỏng…) mà không qua duyệt. Test `ota-prepaid-flow.test.ts` khẳng định FD `voidLine` trả 201, nên đây là thiết kế có chủ đích ("sửa ghi nhầm", BR-008).
- Hệ quả: bỏ dòng là một đường đi vòng qua thang hạn mức miễn phí. Theo BR-436, lễ tân chỉ tự miễn minibar ≤ 100.000 đ/lần, ≤ 500.000 đ/tháng; theo BR-433, lễ tân trưởng ≤ 300.000 đ/lần. Bỏ dòng thì không có hạn mức nào.
- Lần bỏ dòng không vào cảnh báo thất thoát BR-435 (chỉ tính FOC và giảm giá đặc biệt), cũng không vào danh sách đóng ca BR-526. Dấu vết duy nhất là **Nhật ký thao tác tiền**, và hiện chưa ai rà mục này.
- Phụ thu trả muộn **không** lách được theo đường này: B18 tính lại phụ thu trả muộn từ giờ trả phòng (`dueAtCheckout`).
- RBAC A31 chú thích 23 ghi lễ tân sửa giá trong sàn–trần, còn giảm dưới giá chính sách là giảm giá đặc biệt (A35). Mã đang cho bỏ cả dòng, tức giảm về 0, mà không qua A35.

**Đánh giá:**
- Sổ tay không mở quyền mới, nhưng lần đầu chỉ cho lễ tân nút bỏ dòng trên folio đang mở. Thẻ 05 (Minor) khoanh bước này lại, kèm dấu đối chiếu.
- Phần mã: rủi ro **Medium**. Có từ trước, có audit, số tiền của dòng phát sinh nhỏ, và chủ đầu tư hiện là người duyệt. SEC không chặn v1.0.4 (quyền SEC). Thẻ A31-01 đưa vào v1.0.5.

### L2.3 Thẻ mới

#### FB-R4-SEC-BA-PR72-05
- Mức độ: **Minor**. Nên sửa cùng lượt nếu #72 còn mở; nếu không thì ở nhánh tài liệu kế tiếp. Không chặn gộp.
- Vị trí: `02` 11.1 bước 2, gạch **Kiểm trùng, trước khi bấm Trả phòng**; sổ tay 2.14, cùng gạch; `01` 14.1 (hỏi đáp của quản lý).
- Vấn đề: câu hiện tại chỉ ghi cách bấm và câu "Lễ tân trở lên bỏ được khi chưa hoàn tất trả phòng". Câu này không giới hạn dòng nào được bỏ, không bắt ghi lại việc đã bỏ, và quản lý không được dặn xem lại. Trong khi đó, mã cho lễ tân bỏ mọi dòng phát sinh mà không qua duyệt (mục L2.2).
- Vì sao quan trọng: người đọc dễ hiểu **Bỏ cả dòng** là cách miễn cho khách nhanh hơn mục 9.5. Làm vậy là lách hạn mức BR-433/BR-436, và không vào cảnh báo BR-435.
- Đề xuất sửa (chữ đề xuất):
  - `02`, sổ tay: "Chỉ bỏ dòng **Thêm phát sinh** ghi minibar căn cũ lúc đổi phòng: ghi chú của dòng hoặc sổ giao ca cho thấy đúng tủ căn cũ, cùng số tiền. **Không** dùng **Bỏ cả dòng** để miễn hay giảm cho khách: miễn, giảm luôn làm theo mục 9.5. Ghi sổ giao ca: mã đơn, dòng đã bỏ, số tiền, số tủ căn cũ đã nhập."
  - `01` 14.1, thêm một dòng hỏi đáp: "Nhật ký thao tác tiền có dòng **Bỏ cả dòng** do lễ tân làm trên đơn chưa trả phòng: lý do khác 'Trùng minibar tủ căn cũ', hoặc không có ghi sổ giao ca, thì hỏi người làm. Cùng một người bỏ dòng nhiều lần trong tháng: báo chủ đầu tư."
  - Thêm `folio.line_reversed` do FD/FDL làm trên folio đang mở vào bộ lọc tuần đã dời (SEC PR71 mục 9.5, PR72-03).
- Trạng thái: Open

#### FB-R4-SEC-BA-PR72-06
- Mức độ: Suggestion
- Vị trí: `01` (chưa có chỗ). Liên quan `02` 11.1 (b) bước con 4, sổ tay 2.14: "Hạn và cách ghi trễ trên cổng: hỏi quản lý trước khi gửi."
- Vấn đề: lễ tân được dặn hỏi quản lý, nhưng `01` không có câu nào cho quản lý trả lời. DOM ghi hạn ghi trễ cần chủ đầu tư hoặc luật sư xác nhận.
- Đề xuất: `01`, thêm một dòng hỏi đáp: "Lễ tân hỏi ghi trễ ngày đi trên cổng (đơn quá ngày đi, khách đã đi): ghi ngay trong ngày phát hiện, đúng ngày khách rời thật, không dán ô ngày đi Desk hiện. Ghi sổ giao ca. Hạn ghi trễ chưa có quy định: báo chủ đầu tư." ORC đưa câu hỏi "hạn ghi trễ ngày đi trên cổng" vào danh sách câu hỏi cho luật sư (BR mục 15, ESC-001). Không cần ESC mới.
- Trạng thái: Open

#### FB-R4-SEC-BE-A31-01 (thẻ cho BE, ARC, PO; v1.0.5)
- Mức độ: **Major cho v1.0.5**. Rủi ro hiện tại **Medium**, không chặn v1.0.4.
- Vị trí: `folio/internal/folio-lines.service.ts` `adjust`: nhánh `voidLine`, và `newQuantity` về 0, trên folio chưa `settled`. Liên quan BR-433, BR-435, BR-436, BR-526, RBAC A31 chú thích 23.
- Vấn đề: ở folio đang mở, FD/FDL bỏ được hoặc giảm số lượng về 0 mọi dòng phát sinh không phải dòng đêm, chỉ cần lý do. Thang hạn mức miễn phí bị bỏ qua, và việc này không vào cảnh báo thất thoát hay danh sách đóng ca.
- Vì sao quan trọng: lễ tân thu tiền mặt của khoản phát sinh rồi bỏ dòng, hoặc miễn cho người quen, đều không cần ai duyệt. Dấu vết chỉ còn ở audit mà chưa ai rà.
- Đề xuất (PO/DOM chọn, ARC thiết kế):
  - (a) FD/FDL chỉ được bỏ hoặc giảm dòng do **chính mình** ghi, trong cùng ngày nghiệp vụ (đúng nghĩa "ghi nhầm"). Ngoài phạm vi đó thì đi đường FOC có duyệt (A35).
  - (b) Tối thiểu: đưa các lần bỏ hoặc giảm dòng của FD/FDL vào BR-435 (đếm theo người làm) và vào danh sách đóng ca BR-526.
  - Test: FD bỏ dòng do người khác ghi → 403 hoặc chuyển thành yêu cầu duyệt; FD bỏ dòng mình vừa ghi → 201, có audit.
- Trạng thái: Open

### L2.4 #85 `v104/ba-esc045-prices` @ `f11e928c` – soát nhanh

- Nội dung: bỏ +15 % thứ Sáu, thứ Bảy và +30 % ngày đặc biệt (một giá mọi đêm); phụ thu người vượt định mức từ 6 tuổi trở lên 150.000 đ/đêm, dưới 6 tuổi miễn. Sửa ở `01` 9.1, `02` 9.2 và 20.2, `05` 3, sổ tay 1.3, 2.12, 5.2; thêm ghi chú sửa ở `00` và sổ tay.
- **Không lộ số nội bộ.**
  - Không có hoa hồng, doanh thu, sàn–trần, giá OTA hay bảng giá nội bộ.
  - "15 %" và "30 %" chỉ còn trong ghi chú "không còn…", và đó là quy tắc giá công khai cũ.
  - Studio 800.000 là giá niêm yết, đã có trên `main` (ví dụ giữ chỗ) và trên web đặt phòng.
  - Ngày đặc biệt là lịch công khai.
- Tệp `05` (sale, CTV, có thể là người ngoài OTTIMO) chỉ nhận giá công khai và phụ thu người. Tên tham số `weekend_uplift_pct`, `special_uplift_pct` chỉ nằm trong `01` và sổ tay 1.3 (chủ đầu tư, quản lý), không có ở `05`. Tên tham số cũng không phải bí mật: repo đã có.
- Không có email, IP, tên đăng nhập, khóa, số tài khoản, số điện thoại, tên khách.
- Không dạy lách: "Desk hiện 100.000 cho trẻ 6–11 tuổi: báo quản lý, không tự sửa"; "Báo giá thử … ra khác 800.000: dừng, báo quản lý, không tự sửa giá". Đúng hướng.
- **Kết luận #85: ĐẠT, không thẻ.**

### L2.5 Ghi chú cho ORC

- Thẻ A31-01 là thẻ mã. ORC chuyển vào backlog v1.0.5 cho PO xếp, cùng chỗ với "Desk tự giữ cổng 2 đêm" (PR72-03) và bộ lọc tuần (SEC PR71 mục 9.5). Ba việc này cùng một chủ đề: kiểm soát giảm tiền của lễ tân.
- Quét dữ liệu ở lượt 2 (từ mới và dòng thêm của #72 lượt 2, toàn bộ #85): sạch. Chuỗi hex chỉ là mã commit; ký tự "@" duy nhất nằm trong chú thích "QA2 #77 @ 055e92d5".
- Không ESC mới.

### L2.6 Dòng decision-log đề xuất (ORC ghi khi commit, SEC không sửa decision-log)

`| 2026-11-05 | 4 | **SEC – PR #72 lượt 2 (v104/ba-docs-r4c @ e200fea1): ĐẠT về bảo mật, gộp được; PR #85 (v104/ba-esc045-prices @ f11e928c): ĐẠT, không thẻ** (rounds/round-04/reviews/SEC-on-v104-pr72-manual.md mục Lượt 2): PR72-01 Closed (đơn quá ngày đi (b): xóa mã cửa ngay, không kéo dài mã, không khai ngày gia hạn và không dán ô ngày đi Desk lên cổng, ghi ngày rời thật; hạn ghi trễ "hỏi quản lý" chấp nhận); PR72-02 Closed (Lý do ghi đã kiểm, kiểm mã cũ, câu cho người duyệt ở 02 14.3, 01 mục 4, sổ tay 1.8); PR72-03 Closed phần sách, bộ lọc tuần và cổng 2 đêm Deferred v1.0.5; PR72-04 Closed (giả định OWN/MGR cho đơn Nội bộ, chờ DOM). Mới: PR72-05 Minor (khoanh "Bỏ cả dòng" chỉ cho minibar trùng, ghi sổ giao ca, quản lý rà); PR72-06 Suggestion (01: câu trả lời cho ghi trễ cổng, đưa vào câu hỏi luật sư); FB-R4-SEC-BE-A31-01 (Major cho v1.0.5, rủi ro hiện tại Medium, không chặn v1.0.4): FD/FDL bỏ được mọi dòng phát sinh trên folio đang mở chỉ với lý do, lách thang BR-433/436, không vào BR-435/526. #85: chỉ giá công khai, không hoa hồng, doanh thu hay sàn–trần, 05 không có tên tham số. Không ESC | SEC | Quyền SEC |`

---

## Lượt 3 (05/11/2026) – #85 @ `f9302d82`: thẻ PR72-05, PR72-06 và quét dữ liệu

- Đối tượng: `git diff f11e928c..origin/v104/ba-esc045-prices -- product/docs/manual/` (head `f9302d82f577e1573e31b412c91e55955bacc1d3`).
  - Hai commit sổ tay mới của #85:
    - `4747318b`: phạm vi chuyển giá. Không giảm theo số đêm, dài hạn từ 30 đêm, nhận sớm từ 11:00, câu kiểm "ngày đến thứ Sáu, 2 đêm", ví dụ trả sớm, CO-05.
    - `f9302d82`: việc còn lại của #72 (UXD-10, SEC-05/06, DOM-07, QA2 03).
  - `9aea7d03` là merge main (#72). Phần #72 trong đó SEC đã xem ở lượt 2.
  - Diff của PR so với merge-base `20358556`: 7 tệp sổ tay, +72/−60, không có mã.
- SEC chỉ sửa tệp này. Không commit, không push. **Tệp này không ghi tỷ lệ hoa hồng nào**, chỉ ghi vị trí.

### L3.0 Kết luận

- **#85: ĐẠT về bảo mật, gộp được.**
- **PR72-05 Closed, PR72-06 Closed** (mục L3.1). Bộ lọc tuần **Nhật ký thao tác tiền** vẫn Deferred cùng SEC PR71 mục 9.5. Phần mã là thẻ A31-01, làm ở v1.0.5.
- 1 thẻ mới, **Minor**, không chặn gộp: FB-R4-SEC-BA-PR85-01. Tệp `05` và sổ tay ghi tỷ lệ hoa hồng **cũ** như số đang dùng. Cần sửa trước ngày chủ đầu tư chuyển giá.
- Đính chính 2 chỗ SEC ghi sai trước đây (mục L3.4).
- Không ESC mới.

### L3.1 Kiểm thẻ PR72-05, PR72-06

| Thẻ | Đã kiểm ở (head `f9302d82`) | Kết quả |
|---|---|---|
| **PR72-05** (Minor) | `02` 11.1 bước 2, gạch **Kiểm trùng, trước khi bấm Trả phòng** (dòng 871); sổ tay 2.14, cùng gạch (dòng 1241); `01` 14.1 (dòng 869) | **Closed.**<br>- Cả `02` và sổ tay dùng đúng chữ SEC đề xuất: "**Chỉ** bỏ dòng **Thêm phát sinh** ghi minibar căn cũ lúc đổi phòng … **Không** dùng **Bỏ cả dòng** để miễn hay giảm cho khách". Có ghi sổ giao ca (mã đơn, dòng đã bỏ, số tiền, số tủ căn cũ đã nhập).<br>- Thêm câu "Quản lý xem lại các lần bỏ dòng này".<br>- Sổ tay trỏ mục 2.12 **Miễn phí, giảm giá** thay cho 9.5. Đúng, vì đó là số mục của sổ tay.<br>- `01` 14.1 có dòng hỏi đáp theo chữ SEC: lý do khác "Trùng minibar tủ căn cũ" hoặc sổ giao ca không ghi thì hỏi người làm; một người bỏ dòng nhiều lần trong tháng thì báo chủ đầu tư.<br>- Bộ lọc tuần: **Deferred**, SEC chấp nhận (cùng PR71 9.5, A31-01). |
| **PR72-06** (Suggestion) | `01` 14.1 (dòng 870) | **Closed.**<br>- Dòng hỏi đáp dùng đúng chữ đề xuất: "Ghi ngay trong ngày phát hiện, đúng ngày khách rời thật (ngày đi trên đơn cũ), không dán ô ngày đi Desk đang hiện. Ghi sổ giao ca. Hạn ghi trễ chưa có quy định: báo chủ đầu tư". Dòng này trỏ về `02` 11.1 **Đơn quá ngày đi**.<br>- ORC đã đưa câu hỏi "hạn ghi trễ ngày đi trên cổng" vào danh sách hỏi luật sư. Không cần ESC mới. |

**Bước mới cùng loại, do quản lý làm.** `01` 14.1 (dòng 867): sửa đêm đầu của đơn Nội bộ về 0 sau khi người ở đã nhận phòng sớm. Lúc đó quản lý **Bỏ cả dòng** phụ thu nhận sớm, lý do "Đêm đầu miễn phí – đơn Nội bộ", không dùng FOC.
- Bước này đặt trong tệp của quản lý và có lý do cố định.
- Đơn Nội bộ phải có người cho (chủ đầu tư hoặc quản lý) ghi ở **Ghi chú nội bộ** (BR-105 (8)).
- Nó không xung đột với PR72-05, vì dòng hỏi đáp 869 chỉ rà các lần bỏ dòng do **lễ tân** làm. Khi làm A31-01 phương án (a), quyền bỏ dòng của quản lý vẫn giữ.
- Không thẻ.

### L3.2 Quét dữ liệu hai commit mới

Cách quét: lấy các dòng thêm của `git diff 20358556..origin/v104/ba-esc045-prices` (72 dòng, gồm `4747318b` và `f9302d82`). Lọc tìm:
- email, IP, số điện thoại, URL;
- dãy từ 6 chữ số liền, chuỗi hex từ 20 ký tự;
- từ khóa khóa, token, mật khẩu;
- tên người;
- từ khóa hoa hồng, thưởng, doanh thu, "Bạn nhận";
- mọi số "n %".

Sau đó SEC đọc tay từng dòng bắt được.

| Nhóm | Kết quả |
|---|---|
| Email, IP, điện thoại, URL, khóa, token, mật khẩu, số tài khoản, tên đăng nhập, tên khách | Không có |
| Số tiền | Chỉ có giá niêm yết và chính sách công khai: Studio một đêm, phụ thu người vượt định mức, tổng kiểm báo giá (2 đêm thứ Sáu; căn 401, 7 đêm, 5 người lớn), ví dụ trả sớm (hoàn 50 % các đêm bỏ, theo chính sách hủy công khai), ví dụ phụ thu nhận sớm. Tất cả tính từ giá niêm yết. Không phải doanh thu, sàn–trần hay giá OTA |
| Tỷ lệ % | Cọc 30 %, phụ thu nhận sớm 50 % / 30 %, hoàn 50 %: chính sách công khai cho khách. 15 % / 30 % chỉ còn trong câu "không còn…" và nhãn cũ cột **Nguồn giá** |
| Tên tham số | `weekend_uplift_pct`, `special_uplift_pct`, tham số giảm theo số đêm: chỉ ở `01` và sổ tay phần chủ đầu tư, quản lý. Không có ở `05`. Repo đã có các tên này từ trước |
| Hoa hồng | **1 dòng**: `05` mục 3 bước 3 ghi tỷ lệ hoa hồng cũ trong ngoặc. `4747318b` có sửa dòng này. Xem thẻ PR85-01 |
| Câu chống lách | "Desk hiện 100.000 cho trẻ 6–11 tuổi: báo quản lý, không tự sửa"; "Ra số khác: dừng, báo quản lý". Đúng hướng |

### L3.3 Thẻ mới

#### FB-R4-SEC-BA-PR85-01
- Mức độ: **Minor**. Về bảo mật: **Low**. Về đúng sai: **Medium**.
  - Không chặn gộp #85.
  - Nếu #85 còn lượt sửa thì sửa luôn, vì chỉ có 2 dòng. Nếu không, sửa ở nhánh tài liệu kế tiếp. Hạn: **trước ngày chủ đầu tư chuyển giá và nhập tỷ lệ hoa hồng mới**.
- Vị trí (head `f9302d82`):
  - `product/docs/manual/guides/05-sale-ctv.md` dòng 135 (mục 3 **Báo giá**, bước 3);
  - `product/docs/manual/user-manual-v1.0.md` dòng 1729 (mục 4.2 **Sale nội bộ (SAL) và CTV / môi giới**).
  - Hai bản HTML **chưa commit** có cùng câu: `product/docs/manual/guides/html/05-sale-ctv.html`, `product/docs/manual/ottimo-manual-v1.0.html`.
- Vấn đề:
  - Sau nhãn **Bạn nhận (…% tiền phòng)**, ngoặc ghi tỷ lệ hoa hồng ngắn ngày của CTV và sale theo **bản cũ** (ESC-005, hết hiệu lực từ 01/11). Ngoặc này không có nhãn "hết hiệu lực".
  - BR-903 v0.5.0 quy định: từ 01/11 tỷ lệ theo bảng nội bộ của chủ đầu tư, không ghi số ở kho công khai.
  - Dòng này có từ 27/10 (`13be5e2c`). `4747318b` sửa chính dòng này (bỏ "giảm theo số đêm") nhưng giữ ngoặc tỷ lệ.
  - **Không phải số của bảng nội bộ 01/11.**
- Vì sao quan trọng:
  - Tệp `05` dành cho sale và CTV, có thể là người ngoài OTTIMO. Sau khi chủ đầu tư nhập tỷ lệ mới, Desk sẽ hiện số khác sổ tay. CTV có thể lấy sổ tay làm căn cứ khi đòi hoa hồng.
  - Lý do chính SEC ghi thẻ: một ngoặc có số trong sổ tay là chỗ người viết sau dễ "cập nhật" bằng số mới. Làm vậy là lộ bảng nội bộ lên repo công khai, tức rủi ro R1 và quy tắc G3 ở `SEC-on-commission-numbers.md`.
- Đề xuất sửa: bỏ cả ngoặc tỷ lệ, không thay bằng số nào.
  - `05` dòng 135, chữ đề xuất: "… và **Bạn nhận (…% tiền phòng)**: Desk tự điền theo tỷ lệ chủ đầu tư cài. Sổ tay không ghi tỷ lệ."
  - Sổ tay dòng 1729: "Báo giá hiện **Bạn nhận (…% tiền phòng)** theo tỷ lệ chủ đầu tư cài."
  - Tạo lại hai bản HTML từ md đã sửa trước khi commit HTML.
  - Không ghi số mới ở bất kỳ đâu: ghi chú sửa của sổ tay, mô tả PR, thông điệp commit, bảng trả lời thẻ.
- Trạng thái: Open

### L3.4 Đính chính lượt trước của SEC

- **Lượt 2, mục L2.4** ghi "Tệp `05` … chỉ nhận giá công khai và phụ thu người". Câu này **thiếu**: dòng 135 đã có ngoặc tỷ lệ cũ nhưng nằm ngoài phần diff của lượt 2, nên SEC không thấy.
- **`SEC-on-commission-numbers.md` mục 2** (dòng 114) ghi sổ tay `product/docs/manual/` sạch số hoa hồng. Câu này **sai**.
  - Bộ từ khóa K1 (`hoa hồng`, `HH`, `commission`, `thưởng`, `bonus`, `hiệu suất`, `Sale nhận`) không bắt dạng "Bạn nhận … (CTV n %, sale n %)".
  - Hai vị trí của thẻ PR85-01 thuộc loại **TL-cũ**, cần thêm vào mục 2.1 (tài liệu sống).
  - Vẫn **không có số nào của bảng nội bộ 01/11**.
  - Lượt này SEC không sửa tệp đó (ORC chỉ giao tệp này). SEC sẽ ghi đính chính vào tệp đó ở lần sửa tới, hoặc ORC giao riêng.
- Lần quét số hoa hồng sau sẽ thêm từ khóa `Bạn nhận` và mẫu "`CTV`/`sale`/`nhân viên` đứng gần n %".

### L3.5 Ghi chú cho ORC

- PR85-01: giao BA trong lượt sửa #85 nếu còn. Nếu #85 gộp ngay, chuyển thẻ sang nhánh tài liệu kế tiếp, hạn trước ngày chuyển giá.
- Bản HTML sổ tay chưa commit (`product/docs/manual/ottimo-manual-v1.0.html`, `product/docs/manual/guides/html/`) đang chép lại câu có tỷ lệ cũ. Tạo lại HTML từ md đã sửa trước khi commit.
- Không ESC mới. Câu hỏi "hạn ghi trễ ngày đi trên cổng" đã nằm trong danh sách hỏi luật sư.

### L3.6 Dòng decision-log đề xuất (ORC ghi khi commit, SEC không sửa decision-log)

`| 2026-11-05 | 4 | **SEC – PR #85 lượt 2 (v104/ba-esc045-prices @ f9302d82): ĐẠT về bảo mật, gộp được** (rounds/round-04/reviews/SEC-on-v104-pr72-manual.md mục Lượt 3): FB-R4-SEC-BA-PR72-05 Closed (Bỏ cả dòng chỉ cho dòng minibar căn cũ ghi trùng, không dùng để miễn/giảm, ghi sổ giao ca, quản lý xem lại; 01 14.1 có dòng hỏi đáp theo chữ SEC; bộ lọc tuần Deferred cùng SEC PR71 9.5, phần mã A31-01 ở v1.0.5); FB-R4-SEC-BA-PR72-06 Closed (01 14.1 có câu trả lời ghi trễ ngày đi, hạn ghi trễ chờ luật sư). Quét dữ liệu 4747318b + f9302d82: chỉ giá và chính sách công khai, không email/IP/khóa/tên khách. Mới: FB-R4-SEC-BA-PR85-01 Minor – 05 mục 3 và sổ tay 4.2 ghi tỷ lệ hoa hồng cũ (ESC-005) như số đang dùng; bỏ ngoặc số, không thay số mới, sửa trước ngày chuyển giá, tạo lại HTML. Đính chính: sổ tay không sạch số hoa hồng cũ như SEC-on-commission-numbers mục 2 đã ghi; không có số bảng nội bộ 01/11. Không ESC mới. | SEC | Thẻ của #72 đã đóng đúng chữ đề xuất; dòng tỷ lệ cũ không lộ số mới nhưng sai sau ngày chuyển giá và dễ bị cập nhật bằng số nội bộ. |`
