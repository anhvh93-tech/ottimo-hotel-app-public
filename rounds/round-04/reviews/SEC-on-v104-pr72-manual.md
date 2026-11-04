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
