# Phản hồi BA – Round 2, Sprint 3 (bước Phản hồi & sửa)

- Người làm: BA | Ngày: 17/10/2026 | Không commit
- Đầu vào:
  - `reviews/s3-DOM.md` (mục A S3-1…S3-16, thẻ FB-R2-DOM-BA-02), `s3-ARC.md` (mục B, C – 0.3.6 bổ sung), `s3-SEC.md`, `s3-UXD.md`.
  - BR **v0.3.4**, OpenAPI **0.3.6-draft** (bổ sung review S3).
- Thẻ gửi BA: **1** (FB-R2-DOM-BA-02). `s3-ARC`, `s3-SEC`, `s3-UXD` không có thẻ `-BA-`; các quyết định trong đó ảnh hưởng tới đặc tả đã áp ở mục 2.

## 1. Thẻ feedback

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R2-DOM-BA-02 | Done | Đã áp vào `specs/EP03-05-stay.md` v0.3 các quyết định DOM mục A, chi tiết dưới đây. Ca QA (DOM mục B ca 5, 7, 10, 12–15, 17, 18) đã thêm vào E05-08. |

Chi tiết áp cho FB-R2-DOM-BA-02:

| Quyết định DOM | Đã áp vào |
|---|---|
| **S3-9** (thay G-16) – một thao tác "Trả phòng – tính thêm 1 đêm" khi khách rời sau mốc cuối; có cửa sổ sau nửa đêm | 5.1 (điều kiện mở B18 a/b/c), 5.3 (`checkoutTime` + hộp "tính thêm 1 đêm"), đề nghị E05-11 |
| **S3-10** – chỉ yêu cầu tiền chặn B18; yêu cầu vận hành tự hủy `superseded` | 5.5 `pending_approvals` |
| **S3-11** – FOC đã duyệt đi theo dòng mới | 5.3 `applyLateSurcharge` |
| **S3-12** – không có "bỏ qua" phụ thu (`SURCHARGE_DECISION_REQUIRED`); ngưỡng lệch giờ nhập tay | 1.4 (`applyEarlySurcharge`, `checkinTimeNote`), 4.2, 5.3 |
| **S3-13** – phụ thu người tính theo từng đêm, áp từ `effectiveFrom` cho mọi thay đổi khi đang ở; đổi phòng: căn mới / mức thấp hơn | 0.1, 4.5, 4.7 |
| **S3-14** – `hold` cũng là "khách đến cùng ngày" | 4.2 |
| **S3-15** – chênh lệch OTA khi đổi phòng là doanh thu phòng | 4.5 |
| **S3-1 / S3-2** – B16 (trả sớm) | 4.6 viết đầy đủ |
| **S3-3** – hoa hồng cần đủ cả hai điều kiện | 5.5 kết quả |
| **S3-4** – `retain_with_guest_consent` chỉ khi khách tự nguyện bỏ; "để lại cho lần sau" → hoàn | 5.5 `credit_balance` |

## 2. Đặc tả đã cập nhật

### `specs/EP03-05-stay.md` → v0.3 (BR v0.3.4)
- Áp FB-R2-DOM-BA-02 như bảng trên.
- **Quyết định DOM khác:**
  - S3-6: giá đêm gia hạn theo lịch giá từng đêm; gợi ý "Giữ giá đơn" (đề nghị E04-07).
  - S3-7: trẻ chỉ có năm sinh → lấy tuổi nhỏ nhất có thể.
  - B9a tính lại bậc BR-107 và cộng vào `balance_paid` (thẻ DOM về B9a).
  - BR-522 v0.3.4: số dư thừa chưa xử lý; chỉ chi khi khoản thu đã đối soát (đề nghị E15-05).
- **ARC 0.3.6 bổ sung:**
  - `Reservation.depositShortfall` (dòng thông tin ở 1.3).
  - `SURCHARGE_DECISION_REQUIRED`.
  - `NOT_ALLOWED` (FOC khi không có phụ thu; tài khoản ngân hàng khi hoàn tiền mặt).
  - `AMOUNT_EXCEEDS_BALANCE` mở rộng cho ghi tiền (SAL/CTV luôn chặn, FD+ thiếu ghi chú).
  - `changeRoom.effectiveDate` chỉ nhận hôm nay (BR-424 v0.3.4).
  - `original_method` ra `cash` → chi bằng `executeCashRefund`.

### `specs/EP06-registration.md` → v0.3
- **Dữ liệu cổng khai báo** theo tham số `portal_date_format` / `portal_nationality_format` – `[GIẢ ĐỊNH – chờ INV, ESC-018]`:
  - ngày dạng `dd/MM/yyyy`;
  - quốc tịch dạng "Hàn Quốc (KOR)";
  - "Ngày đến" = ngày nhận phòng thực tế;
  - giá trị enum bằng tiếng Việt, kèm `valueKey` để hiển thị theo ngôn ngữ;
  - trường rỗng không có nút sao chép.
- **Đồng ý lưu ảnh:**
  - Desk và app khách gửi `retentionDays`.
  - App khách dùng `OnlineCheckin.currentNoticeVersion` và `imageRetentionDays`; thiếu hoặc lạ → không hiện câu đồng ý (fail closed).
- **Khác:**
  - S3-7: tuổi trẻ em tính từ năm sinh.
  - S3-8: khai báo `mixed` bị từ chối → khai lại mọi khối.

### `state-machines.md`
- B18: cửa sổ sau nửa đêm; "tính thêm 1 đêm"; chỉ yêu cầu tiền chặn; số dư thừa.
- B16: theo BR-428 v0.3.4.
- SM-10 A6: SYS hủy yêu cầu vận hành `superseded`.

## 3. Đề nghị hợp đồng mới cho ARC (0.3.7) – cuối EP03-05 mục 7
| # | Nội dung |
|---|---|
| E05-11 | "Trả phòng – tính thêm 1 đêm": `checkOut.extraNight {rateVnd}` (hoặc operation riêng), cùng giao dịch với B18. `getCheckoutSummary` trả `extraNightRequired`, `extraNightDefaultRateVnd`. Điều kiện mở B18/B16 gồm cửa sổ sau nửa đêm. Thay E05-09 (`checkoutAt`) nếu ARC chọn cách này |
| E03-07 | `checkinTimeNote` / `checkoutTimeNote` bắt buộc khi giờ nhập tay lệch giờ thao tác quá `manual_time_tolerance_minutes`; mã 422 khi giờ vào căn muộn hơn giờ bấm nhận phòng |
| E04-06 | `earlyDeparture.otaRetainedVnd`, `noticeEvidence` (khi giờ báo nhập lùi); phản hồi trả `earlyDepartureFeeVnd`, `refundRequestId` |
| E04-07 | `ExtensionOptions.currentBookingRateVnd` (S3-6, thẻ DOM BE-31) |
| E15-05 | 409 `REFUND_SOURCE_NOT_RECONCILED`; chi ≤ `creditVnd` hiện tại; B18 chỉ xử lý số dư thừa **chưa xử lý** (không tạo yêu cầu hoàn trùng – thẻ DOM BE-14) |
| (đã có, nhắc lại) | E04-04: `effectiveFrom` cho **mọi** thay đổi số người khi đang ở (gồm `removePartyMember`); `updateReservation` đổi số khách khi `in_house` → hướng sang party |

## 4. Kiểm tra
- `gen_rbac_cases --check`: **OK** (189 operation, rbac mismatch []).
- `gen_traceability --strict`: **exit 0**. Ghi ra thư mục tạm, không ghi đè `qa/traceability.md`. AC 251/251, rbac lệch 0, `x-rbac-field` 145, không có tham chiếu SM sai.

## 5. Giả định / còn mở
- **Giả định BA mới:**
  - Ô "Ghi phụ thu" hiện tích sẵn khi phụ thu > 0 (UXD quyết cách hiện).
  - Mã lỗi cho `effectiveDate` khác hôm nay: `VALUE_OUT_OF_RANGE` (ARC đặt tên chính thức).
- **ESC-018 (DOM tạo):** định dạng dữ liệu cổng khai báo vẫn là giả định cho tới khi INV gửi biểu mẫu thật. Không có ESC mới từ BA.
- **Chờ ARC chốt tên ở 0.3.7:** E05-11, E03-07, E04-06, E04-07, E15-05.

## 6. Bổ sung – PO quyết 17/10 (SEC-37): hoàn chuyển khoản "trừ OWN"
- **`rbac-matrix.md`:**
  - A47 và D15 thêm quy tắc: người chi ≠ người tạo ≠ người duyệt ≠ người đặt nơi nhận, **trừ OWN** (ghi chú 39). OWN được vừa duyệt vừa chi cùng một khoản; MGR không bao giờ vừa duyệt vừa chi.
  - Mục 5.3 bỏ câu cũ "MGR tự gửi và tự duyệt hoàn trong hạn mức BR-433" – duyệt hoàn theo vai, không qua `foc_limits` (ARC 17/10).
- **`rbac-matrix.json` 0.2.4:** ghi chú A47 (vai không đổi nên ca rbac không đổi).
- **`specs/EP03-05-stay.md`:** 2.6.2 (người duyệt) và 2.6.3 (người chi) thêm quy tắc trên, lỗi 403 `SELF_APPROVAL_FORBIDDEN` cho MGR, cách làm khi OWN vắng.
- **Kiểm tra:** `gen_rbac_cases --check` OK (189 operation, mismatch []); `gen_traceability --strict` exit 0 (AC 251/251, rbac lệch 0).

## 7. Bổ sung – hồ sơ khách "từ giấy tờ" (BUG-R2-033 b; PO 17/10 chọn A; SEC duyệt có điều kiện – `reviews/s3-SEC.md` mục 7) – đặc tả ngay, cài đặt Sprint 4

### `specs/EP06-registration.md`
- **2.2:** `partyMemberId` để trống → server tìm người theo thứ tự khớp ở mục 2.2a.
- **2.2a (mới) – thứ tự khớp:**
  1. Trong cùng đơn: khớp `doc_number_hmac` → 409 `PARTY_DUPLICATE`.
  2. Ngoài đơn: **chỉ tự gắn** khi khớp `id_doc_hmac` – tức hồ sơ mà chính người đó đã đồng ý P05.
  3. Khớp **tên + ngày sinh**: **chỉ gợi ý** "có thể là khách quen", lễ tân xác nhận bằng hai nút ngang hàng.
  4. Không khớp ai: tạo hồ sơ `source = document` với trường tối thiểu (tên trên giấy tờ, quốc tịch; **không** ngày sinh, số/khóa giấy tờ, liên hệ, tag/ghi chú).
- **2.2a – khác:** vượt số khách thì vẫn gắn và cảnh báo; hạn lưu T05 (12 tháng, tham số); hiển thị theo vai.
- **4.1 (mới) – hỏi người đi cùng đồng ý P05:**
  - Tùy chọn, không bắt buộc để nhận phòng.
  - Hai nút "Đồng ý" / "Không đồng ý" **ngang hàng**, **không chọn sẵn**; mặc định "Chưa hỏi".
  - Chính người đi cùng quyết, người đặt phòng không quyết thay.
  - Đồng ý → ghi khóa giấy tờ lên hồ sơ, chuyển hạn lưu T06. Từ chối hoặc rút lại → không có khóa / xóa khóa.
- Đề nghị ARC: E06-12 (ghi đồng ý P05 tại quầy), E06-13 (`possibleReturningGuest`, `PartyMember.profileSource`, cùng các mục ARC trong SEC 7.4).

### `specs/EP00-platform.md` 11.2
- Ngoại lệ "không cần SĐT/email" **chỉ** cho hồ sơ `source = document` do server tạo.
- Bảng quy tắc cho hồ sơ loại này:
  - Chỉ sửa được tên, quốc tịch, ngôn ngữ; trường P05 → 422 `NOT_ALLOWED`.
  - Thêm SĐT/email → thành hồ sơ CRM thường.
  - Muốn làm người đứng tên đơn mới → phải có SĐT trước.
  - SAL/CTV không thấy hồ sơ loại này.

### `rbac-matrix.md`
- D10 + ghi chú 40: SAL/CTV không thấy hồ sơ "từ giấy tờ" ở mọi danh sách, tìm kiếm, tra cứu, xuất dữ liệu.
- `rbac-matrix.json` không đổi: bản máy đọc chỉ chứa hành động; việc lọc theo vai do ARC làm ở 0.3.7.

### Kiểm tra
- `gen_rbac_cases --check`: OK (189 operation, mismatch []).
- `gen_traceability --strict`: exit 0 (AC 251/251, rbac/fields lệch 0).
