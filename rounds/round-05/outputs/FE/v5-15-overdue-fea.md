# FE-A2 – Trả phòng quá ngày đi, phần Desk (V5-15)

- Round 5, bước Sản xuất · FE-A2 · 07/11/2026
- Nguồn:
  - hợp đồng 0.3.13 bổ sung 1, mục 1.4 và 1.18 (T15-1…T15-15); BE #99 @ 92d16358 (đã gộp);
  - DOM `rules-v1.0.5.md` mục 7.1, 15.3, 15.4, 15.7;
  - UXD `copy-v1.0.5.md` bản 1.9 mục 9.9 (`checkout.overdue_reason_help`), `UXD-on-fe-prs-125-128.md` mục 3 (`checkout.overdue_need_manager`, `checkout.overdue_need_owner`).
- Nhánh `r5-fe-v5-15-overdue`, cắt từ `origin/main`, đã gộp (merge) nhánh của #140 (gồm #125, #128).
  - Lý do: hộp quá ngày đi dùng `checkoutAt` một mốc của V5-10.
  - Hệ quả: PR này gộp sau #140. Khi #140 vào `main`, diff của PR chỉ còn phần V5-15.

## 1. Việc đã làm

### 1.1 Ai được trả phòng: theo máy chủ, Desk không tự đoán theo vai
- **Hộp quá ngày đi** chỉ mở khi đơn có `allowedActions` `check_out` kèm `overdue: true`. Máy chủ chỉ trả cờ này cho OWN, và cho MGR khi chưa quá 1 đêm.
- **Không có cờ đó** (FD, FDL, hoặc MGR từ 2 đêm): trang Trả phòng chỉ hiện Alert info, không có bước nào, không ghi gì.
  - Tiêu đề Alert: `checkout.overdue_title`.
  - Nội dung lấy theo `CheckoutSummary.nightsNotBilled`: 1 đêm → `checkout.overdue_need_manager`; từ 2 đêm → `checkout.overdue_need_owner` với `{n}`.
  - Có nút "Về chi tiết đơn".
- **B18 trả 403 `FORBIDDEN_ACTION`** trên đơn quá ngày đi, ví dụ trang mở từ hôm trước và qua đêm thứ 2:
  - Desk đọc `requiredRole` và `nightsNotBilled` ngay trong 403 để chọn câu `checkout.overdue_need_owner`;
  - đọc lại đơn và chuyển sang màn chỉ dẫn.
- **Trong lúc chờ tóm tắt** (ngày nghiệp vụ đã qua ngày đi): trang chờ hoặc báo lỗi kèm nút Thử lại. Chưa có tóm tắt thì không đếm minibar, không ghi gì.
- **Ngăn đơn** (FD+, đơn gốc đang ở, ngày đi hiệu lực < ngày nghiệp vụ, máy chủ không mời `check_out`):
  - Desk đọc tóm tắt trả phòng;
  - nếu `overdue`: nút "Trả phòng" bị khóa, cạnh nút là câu need_manager hoặc need_owner. Cùng mẫu với nút Đánh dấu không đến bị khóa.

### 1.2 Hộp quá ngày đi (OWN; MGR ≤ 1 đêm)
- **Alert info ở mọi bước:** tiêu đề `checkout.overdue_title`, nội dung `checkout.overdue_body`. Nội dung gồm ngày đi, số đêm (`common.nights_*`), và câu "khách ở thêm thì gia hạn trước".
- **Ô giờ trả** (bước 2):
  - bắt buộc;
  - điền sẵn giờ của lần tóm tắt đầu: giờ trả muộn đã hẹn, hoặc giờ chuẩn. Không điền đồng hồ máy quầy, vì đơn đã rời từ ngày trước (DOM 15.3). Không có viền "giờ Desk tự điền";
  - help `checkout.overdue_time_help` theo DOM 15.3: ngày của giờ; không có bằng chứng thì ghi giờ chuẩn, hoặc giờ thấy căn trống nếu sớm hơn.
- **Ô lý do** `overdueReason`:
  - bắt buộc, 3–500 ký tự;
  - nhãn `checkout.overdue_reason_label`;
  - 3 nút gợi ý theo DOM 7.1 (`Seg`, nhãn nhóm `checkout.overdue_reason_pick`): hai nút đầu điền chữ của nút vào ô; "Khác (ghi rõ)" xóa ô và đưa con trỏ vào ô;
  - help `checkout.overdue_reason_help` luôn hiện, kể cả sau khi chọn gợi ý. Help nối với ô qua `aria-describedby` (điều kiện SEC 2.5).
- **Giờ sau mốc trả muộn cuối** (`extraNightRequired` trên đơn quá ngày đi, hoặc 422 `LATE_CHECKOUT_AFTER_LIMIT` trên `checkoutAt`):
  - dưới ô giờ hiện lỗi `checkout.overdue_after_limit` ("gia hạn trước");
  - không có ô giá đêm thêm, không có phụ thu một đêm, không có dòng "Trả đúng giờ";
  - số cần thu là số dư folio;
  - "Tiếp tục" bị khóa, lý do nằm cạnh nút.
- **"Tiếp tục" và "Hoàn tất"** nói lý do khóa đầu tiên: thiếu giờ (`error.field_named`), quá mốc, lý do dưới 3 ký tự (`field_error.reason_required`).
- **Phụ thu trả muộn** tính theo giờ đã nhập, giữ nguyên luồng cũ: tick "Tôi đã báo khách", FOC, B15 trước bước bill.
- **Thân B18:**
  - `checkoutAt`: lấy từ tóm tắt có giờ của máy chủ (V5-10);
  - `checkoutTime`;
  - `overdueReason` (đã cắt khoảng trắng hai đầu);
  - không gửi `checkoutTimeNote`, `extraNight`, `lateFeeInsteadOfNight`.
- **Hộp xác nhận** thêm dòng `checkout.overdue_effect`: giờ và ngày theo `checkoutAt` của máy chủ.
- **409 `CONCURRENT_UPDATE`:** gửi lại 1 lần sau `Retry-After`, cùng Idempotency-Key, cùng thân (`STAY_WRITE_RETRY` sẵn có).
- **422 trên `overdueReason`:**
  - `CARD_NUMBER_DETECTED` hoặc lý do quá ngắn: quay về bước 2, con trỏ vào ô lý do;
  - `NOT_ALLOWED` (đơn đã gia hạn, hết quá ngày đi): đọc lại đơn; lần bấm sau là lệnh mới, khóa mới.

### 1.3 Chữ
- `gen_strings.py` thêm 13 khóa, đặt sau `stay.time_note_help`; đã chạy lại để sinh `strings-*.json`, `strings.js`, `strings-tables.md`.
- **3 khóa chép nguyên chữ UXD đã chốt:** `checkout.overdue_reason_help`, `checkout.overdue_need_manager`, `checkout.overdue_need_owner`.
- **10 khóa FE-A2 viết theo chữ DOM, chờ UXD duyệt ở PR:**

| Khóa | VI | EN |
|---|---|---|
| `checkout.overdue_title` | Trả phòng quá ngày đi | Check-out past the departure date |
| `checkout.overdue_body` | Ngày đi là {date}, đã qua {nights}. Ghi giờ khách rời căn và lý do. Khách ở thêm đêm nào thì gia hạn trước, rồi mới trả phòng. | The departure date was {date}, {nights} ago. Enter when the guest left and why. If the guest stayed another night, extend the stay first, then check out. |
| `checkout.overdue_time_help` | Giờ khách rời căn, ngày {date}. Không có bằng chứng giờ: ghi {time} (giờ trả chuẩn) hoặc giờ thấy căn trống nếu sớm hơn, không phụ thu. | The time the guest left, on {date}. With no proof of the time, enter {time} (standard check-out) or the time the room was found empty if earlier – no surcharge. |
| `checkout.overdue_reason_label` | Lý do quá ngày đi | Why it's past the departure date |
| `checkout.overdue_reason_pick` | Lý do thường gặp | Common reasons |
| `checkout.overdue_reason.no_notice` | Khách đi không báo | Guest left without telling us |
| `checkout.overdue_reason.desk_forgot` | Lễ tân quên bấm Trả phòng | Front desk forgot to check out |
| `checkout.overdue_reason.other` | Khác (ghi rõ) | Other (please specify) |
| `checkout.overdue_after_limit` | Giờ này quá mốc trả muộn của ngày đi. Khách ở thêm đêm đó thì gia hạn trước, rồi trả phòng. | This time is past the late check-out limit of the departure day. If the guest stayed that night, extend the stay first, then check out. |
| `checkout.overdue_effect` | Ghi giờ khách rời: {time} ngày {date}. | Records when the guest left: {time} on {date}. |

## 2. Mock (MSW)
- **`mocks/overdue.ts` (mới):** chép các luật thuần của máy chủ (`overdue-checkout.ts`):
  - `overdueNights`;
  - `canCheckOutOverdue`: OWN luôn được, MGR khi ≤ 1 đêm;
  - `overdueRefusal`: 403, MGR kèm `requiredRole` và `nightsNotBilled`; FD, FDL không có trường thêm.
- **`allowedActions`:**
  - đơn gốc quá ngày đi theo ngày nghiệp vụ và ngày đi hiệu lực: `check_out` có `overdue: true`, chỉ cho vai được phép;
  - đơn khác: như cũ.
- **Tóm tắt trả phòng:**
  - thêm `overdue`, `nightsNotBilled`;
  - `checkoutTimeNoteRequired = false` khi quá ngày đi;
  - `checkoutAt` lấy ngày đi hiệu lực.
- **B18:**
  - chặn theo vai trước khi đọc thân;
  - `checkoutAt` bắt buộc, phải thuộc ngày đi hoặc rạng sáng hôm sau;
  - `overdueReason` 3–500 ký tự, có số thẻ thì trả `CARD_NUMBER_DETECTED`;
  - gửi `extraNight` hoặc `lateFeeInsteadOfNight` thì trả `NOT_ALLOWED`; giờ sau mốc cuối thì trả `LATE_CHECKOUT_AFTER_LIMIT`;
  - bỏ kiểm giờ so với đồng hồ;
  - đơn không quá ngày đi mà có `overdueReason` thì trả `NOT_ALLOWED`;
  - `actualCheckoutAt` = `checkoutAt`; ghi audit `after.overdue`.
- **VietQR `check_out`:** cùng chặn theo vai; `checkoutAt` bắt buộc; không nhận `extraNightRateVnd` và `lateFeeAsNight`; giờ sau mốc cuối thì trả 422.

## 3. Test
- **Vitest `v5-15-overdue-fea.test.tsx` (15 ca):**
  - luật mock;
  - MGR 1 đêm, luồng đủ:
    - Alert ở bước 1;
    - giờ điền sẵn 12:00, không viền;
    - help lý do nối với ô;
    - nút khóa tới khi có lý do;
    - gợi ý điền chữ;
    - thân B18: `checkoutAt` = ngày đi 12:00, có `overdueReason`, không có note, extra night, late fee;
    - `actualCheckoutAt` đúng;
  - "Khác (ghi rõ)" xóa ô và đưa con trỏ vào; 2 ký tự thì vẫn khóa;
  - giờ 19:00 → `overdue_after_limit`, không ô giá đêm, không dòng "Trả đúng giờ";
  - ô giờ để trống → "Bắt buộc";
  - OWN 2 đêm: hộp mở, không có ô ghi chú giờ;
  - 409 `CONCURRENT_UPDATE` với `Retry-After: 1` → 2 lần gửi, cùng khóa, cùng thân;
  - 422 `CARD_NUMBER_DETECTED` hiện dưới ô lý do;
  - 403 `requiredRole: owner` → need_owner {n: 2}, lấy từ 403;
  - FD 1 đêm → need_manager, không ghi gì;
  - FDL 2 đêm → need_owner;
  - MGR 2 đêm → need_owner;
  - ngăn đơn: FD thấy nút khóa kèm lý do; MGR thấy nút thường;
  - 05:00 hai ngày lịch sau ngày đi vẫn là đêm thứ 1, theo ngày nghiệp vụ (ví dụ DOM 7.1).
- **E2E `tests/e2e/ui-clock/overdue-checkout.r5.spec.ts`** (project desk-clock, API thật):
  - nhận phòng D, tua tới D+2 09:00;
  - API: tóm tắt có `overdue` và 1 đêm; FD không có `check_out`; MGR có `overdue`;
  - FD: màn chỉ dẫn;
  - MGR: chọn gợi ý, Hoàn tất; API trả `checked_out`, `actualCheckoutAt` = D+1 12:00;
  - axe ở bước 2 và hộp xác nhận.
  - Chưa chạy ở máy này (cần stack có MutableClock). CI chạy với `E2E_UI=1`.
- **Đã chạy:**
  - admin-web cả bộ: 91 tệp, 1030 ca, xanh;
  - `tsc` admin-web và `tests/`; `eslint`, `prettier` sạch trên các tệp đã sửa.
- **Ảnh chụp** (dữ liệu mock, không vào repo): 390 và 1440 px, VI và EN, 8 cảnh mỗi cỡ. Thư mục scratchpad của phiên: `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/shots-v515/`.

## 4. Việc cần vai khác (không ESC)
- **UXD**, duyệt ở PR:
  - 10 khóa ở mục 1.3;
  - Alert info (token chức năng `--info`) dùng ở đầu trang và ở màn chỉ dẫn;
  - `Seg` 3 gợi ý: ở 390 px xếp 3 dòng;
  - nút "Trả phòng" bị khóa kèm lý do ở ngăn đơn;
  - chữ Alert dài ở 390 px.
- **ARC + DOM, câu hỏi thẻ FB-R5-FE-ARC-V515-01 (Minor):**
  - Trên đơn quá ngày đi, giờ gõ trước 06:00 (ví dụ 03:00) luôn được máy chủ quy về rạng sáng **hôm sau** ngày đi (D+1 03:00), vì `resolveCheckoutAt` chọn ứng viên muộn nhất. Mốc đó sau mốc cuối, nên B18 trả `LATE_CHECKOUT_AFTER_LIMIT`.
  - Như vậy ca DOM 15.4 ý 2 ("khách đi 03:00 sáng ngày đi: không phụ thu") không ghi được bằng giờ gõ. Desk không tự dựng `checkoutAt` (luật V5-10).
  - Đề xuất: trên đơn quá ngày đi, máy chủ chọn ứng viên của ngày đi cho giờ trước mốc rollover. Có thể để v1.0.6. Trong lúc chờ, theo DOM 15.3 ý 5: ghi 06:00 và ghi giờ thật trong lý do.
- **QA:** ca T15-x trên Desk ở mục 3. Kiểm che dữ liệu trên ảnh chụp: chỉ có dữ liệu mock (tên khách mẫu "Phạm Huy").
- **BA:** sổ tay chỉ dẫn FD khi gặp đơn quá ngày đi: màn Trả phòng và ngăn đơn nói gọi ai. Không đổi luật.

## 5. Giả định, ESC
- Không có ESC mới.
- Giả định:
  - giờ điền sẵn cho đơn quá ngày đi là `checkoutTime` của lần tóm tắt đầu: giờ hẹn trả muộn nếu có, không thì giờ chuẩn (DOM 15.3: không rõ giờ thì ghi giờ chuẩn);
  - nút gợi ý điền chữ theo ngôn ngữ đang dùng trên Desk; máy chủ nhận chữ tự do;
  - ngăn đơn chỉ đọc tóm tắt khi đủ cả bốn điều kiện: FD+, đơn gốc đang ở, ngày đi hiệu lực đã qua theo ngày nghiệp vụ, không có `check_out`. Đọc lỗi thì không hiện gì thêm (như trước);
  - danh sách "Hôm nay" và sơ đồ phòng không đổi: hàng nào máy chủ không mời `check_out` thì không có nút, như trước.
