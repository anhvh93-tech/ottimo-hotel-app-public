# Đặc tả mức trường – EP02 Room rack & đặt phòng + EP11 Sale (phần R2) + US-139

- Tác giả: BA | Round 2 – Đợt 0 (đi trước Sprint 2 một sprint) | Ngày: 16/10/2026 | Phiên bản: **0.2** (17/10, Sprint 4: mục **9.3** xem trước giá đổi căn/đổi ngày theo ESC-019 A – `previewMoveReservation`, ô "Đã báo khách", nhóm lý do "khách xin / OTTIMO đổi"; mục 8 năm sinh trẻ em bắt buộc – S4-45). Bản 0.1 (16/10)
- Phạm vi: EP02 – US-016, 017 (gồm **AC5a tạm R2**), 018, 019, 020, 021, 022, 023, 024 (gồm **AC5–AC7** – ESC-019 A), 136; EP11 phần R2 – US-080, 082, 083, 084, 085, 086 (trừ AC3), 087; EP12 – US-139. Ngoài phạm vi: US-081, US-086 AC3 (dài hạn – R3 theo R-C), đơn nhóm US-140 (R3). Yêu cầu đặt phòng từ website (US-155): `specs/EP19-website-requests.md`.
- Nguồn và quy ước: như `specs/EP00-platform.md` mục 0 (bảng trường, V-01…V-11, hiển thị lỗi, lỗi chung, hộp xác nhận mục 9). Tài liệu này chỉ ghi phần riêng. Bản 0.2 đọc thêm: `business-rules.md` **v0.3.6** (BR-429 (a)–(h), BR-434, BR-111), OpenAPI **0.3.7** (`previewMoveReservation`, `moveReservation`, `MovePreview`, `MoveReasonCode`; `rounds/round-02/outputs/ARC/openapi-0.3.7.md` S-7, 10.4), chuỗi `move.*` đã duyệt (`rounds/round-02/reviews/s4-UXD.md` mục E).
- Quyết định INV áp dụng: ESC-004 (giá, định mức, phụ thu người), ESC-006 (giữ chỗ, cọc, hủy, no-show), **ESC-014** (sức chứa tối đa = định mức + 1 ngủ sofa; người vượt định mức được cấp bộ đồ dùng thêm – BR-812), ESC-012 R-C (AC5a), **ESC-019 A** (17/10 – khách tự xin đổi sang căn khác trước ngày đến thì tính giá căn mới; OTTIMO đổi thì giữ giá).

---

## 0. Khái niệm dùng chung trong tài liệu này

| Khái niệm | Định nghĩa (nguồn) |
|---|---|
| Ngày nghiệp vụ, "hôm nay" | BR-010 (`business_day_rollover`) |
| Khoảng lưu trú | [ngày đến, ngày đi), số đêm = ngày đi − ngày đến (BR-002) |
| Người tính sức chứa (`occCount`) | `adults` + `children6to11` (người lớn từ `adult_from_age`, trẻ 6–11); `childrenUnder6` **không** tính (BR-110, ESC-014) |
| Định mức căn (`base`) | `room.<no>.base_occupancy` (BR-110) – thuộc tính từng căn |
| Sức chứa tối đa (`max`) | `room.<no>.max_occupancy` = định mức + 1 (ESC-014) |
| Người vượt định mức (`extraCount`) | `max(0, occCount − base)` – tối đa 1 do `max = base + 1`. Người lớn xếp vào định mức trước; người vượt tính theo mức thấp hơn (BR-110) |
| Nhóm kênh | `channel_group`: `direct` (Trực tiếp), `agent` (CTV), `ota`, `internal` (Nội bộ) – `listChannels` |

**Kiểm sức chứa (dùng ở mọi luồng tạo/sửa đơn, giữ chỗ, báo giá, đổi căn/phòng, thêm người):** `occCount ≤ max` của căn → ngược lại chặn tại ô số khách, `422 CAPACITY_EXCEEDED` → `error.CAPACITY_EXCEEDED` (`{room}`, `{max}`). **Kênh `ota` vượt sức chứa (DOM D-1; BR-312 (1): không bao giờ từ chối đơn OTA đã về):** không chặn. Server trả **cảnh báo** – mã trường `CAPACITY_EXCEEDED_WARNING` (kèm `roomNo`, `max`; OpenAPI 0.3.5), cùng cách `RATE_OUT_OF_RANGE_WARNING`. Giao diện hiện hộp **(mới)** `booking.capacity_warning` "Căn {room} tối đa {max} người, đơn OTA có {n}. Vẫn lưu đơn? Ghi lý do và liên hệ khách." kèm ô lý do `capacityWarningAckReason` (V-08); gửi lại thì đơn được lưu. Đơn mang cờ **`Reservation.capacityConflict = true`**, vào "Cần chú ý" `capacity_conflict` của FD/FDL và **bị chặn nhận phòng (B9)** – điều kiện `capacity_within_max`, không ai bỏ qua được cho tới khi xử lý bằng một trong ba cách: đổi sang căn đủ chỗ (B7), tách thêm căn, hoặc sửa số người thực tế ≤ `max` sau khi liên hệ khách (mục 5.4). Kênh `direct`/`agent`/`internal` **vẫn chặn** `422 CAPACITY_EXCEEDED`. BR-812 vẫn sinh việc theo `extraCount` thực tế của căn được gán.

**Việc buồng phòng tự sinh (BR-812, ESC-014):** khi một đơn **ở trạng thái `confirmed`** (tạo mới B2, xác nhận cọc B4, khôi phục B12, gán căn B7a) có `extraCount > 0` trên căn đã gán → server sinh việc HK "Chuẩn bị bộ đồ dùng thêm × {extraCount} – căn {room}", hạn = giờ nhận phòng của đơn (BR-812 (2)). Đơn `hold` **chưa** sinh việc. Sửa đơn làm thay đổi `extraCount`/căn/trạng thái → hủy, thêm, chuyển việc theo BR-812 (4). Chi tiết vận hành: `business-processes.md` P07 bước 1a, 4a, 9.

---

## 1. Room rack – S03 (US-016, US-019, US-139)

### 1.1 Dữ liệu – `getRack`
| Tham số | Kiểu | BB | Kiểm tra |
|---|---|---|---|
| `from` | date | K | Mặc định = hôm nay − 2 (ngày nghiệp vụ) |
| `days` | int | K | 1–31, mặc định 14 (ràng buộc giao diện, AC1) |

Mỗi dòng căn: `roomNo`, nhóm, trạng thái buồng (`roomStatus` → `status.room.*`), "Ngừng bán" khi `isSellable=false`. Cột hôm nay đánh dấu `fo.rack.today` theo `Rack.today` (ngày nghiệp vụ – không tính ở client).

### 1.2 Thanh (RackBar) theo `kind`
| `kind` | Nhãn chữ (đọc được bằng trình đọc màn hình – AC2) | Kiểu hiển thị (UXD quyết màu) |
|---|---|---|
| `hold` | `status.booking.hold` + "hết hạn {time}" | Viền đứt |
| `confirmed` | `status.booking.confirmed` | |
| `in_house` | `status.booking.in_house` | |
| `long_stay` | `status.booking.long_term`; đơn AC5a thêm nhãn "HĐ ngoài hệ thống" | |
| `checked_out` | `status.booking.checked_out` | |
| `ooo` | `status.block.ooo` ("Khóa phòng") + lý do ngắn | |
| `unavailable` | `fo.rack.sold_out` – chỉ cho SAL/CTV | |

Bấm (chuột hoặc Enter/Space) vào thanh đơn → mở chi tiết đơn (AC3); thanh OOO → mở khối khóa/phiếu sửa. Bấm ô trống → form đặt phòng điền sẵn căn + ngày (`fo.rack.empty_cell_hint`) – chỉ vai có A01.

### 1.3 Làn "Chưa gán căn" (US-139)
`Rack.unassigned[]` – đơn OTA `conflictState=open`. Tiêu đề `fo.rack.unassigned_lane` (`{n}`), giải thích `fo.rack.unassigned_help`, mỗi thanh có nút `fo.rack.assign_room` (mục 6.3). Làn chỉ hiện khi `n > 0`; luôn ở trên cùng rack.

### 1.4 Theo vai (AC4)
| Vai | Thấy |
|---|---|
| OWN, MGR, FDL, FD | Đầy đủ: tên khách (`guestDisplayName`), kênh, mã đơn, làn chưa gán |
| HK, MT (`all_masked`) | Trạng thái buồng + `arrivingToday` (`fo.rack.arriving_today` / `_tomorrow`); không tên, kênh, giá, không `reservationId` |
| SAL, CTV (`availability_only`) | Chỉ căn – đêm còn/hết (`unavailable`), không tên, kênh, giá |

### 1.5 Trạng thái màn
Đang tải: khung lưới giữ chỗ. Rỗng: `fo.rack.empty_title`/`_body`. Lỗi: `fo.rack.error_title` + Thử lại. Mất kết nối SSE: `fo.rack.stale`. Lệch buồng – đơn (BR-806): `fo.rack.mismatch`.

---

## 2. Kiểm phòng trống – `searchAvailability` (US-082, US-017, US-019)

| Tham số | Kiểu | BB | Kiểm tra | Lỗi |
|---|---|---|---|---|
| `arrival` | date | B | V-05; không trước hôm nay | `DATE_IN_PAST` → `booking.error.past_date` |
| `departure` | date | B | > `arrival` | `DATE_ORDER` |
| `roomId` | uuid | K | V-11 | – |
| `roomGroupId` | uuid | K | V-11 | – |
| `adults` | int | K | ≥ 1 (mặc định 2) | – |

Kết quả: `requestedRoom.available` + `reason` → chip: `booked` "Trùng lịch", `blocked` "Đang khóa", `not_sellable` "Ngừng bán", `capacity` "Quá số khách", `past_date` "Ngày đã qua"; `alternatives[]` ≤ 6 căn trống cùng khoảng (cùng nhóm trước, rồi nhóm khác theo `room_group.sort_order` – BR-316), có `roomGroupCode`. Không còn căn nào: "Hết phòng trong khoảng ngày" + gợi ý chọn ngày khác (US-080 AC4). Ngày đã qua → khóa nút tạo giữ chỗ (US-082 AC2). SAL/CTV gọi được (S15), không thấy thông tin đơn chiếm căn.

---

## 3. Tạo đơn ngắn ngày đã đảm bảo – S05 (US-017, US-018, US-019, US-023) – `createReservation` (B2)

### 3.1 Quyền
FD+ (A01). SAL/CTV **không** có màn này (AC6) – chỉ tạo giữ chỗ từ báo giá (mục 10.4). HK/MT/GST ✖.

### 3.2 Bảng trường
| Trường | Nhãn | Kiểu | BB | Kiểm tra | Lỗi |
|---|---|---|---|---|---|
| `channelId` | Kênh (`booking.field.channel`) | uuid | B | V-11; danh sách = BR-901 đang `isActive` + "Nội bộ" (AC8). **Chỉ có một kênh Trực tiếp**, mã `direct` (ARC A-08, DOM D-6); không còn các kênh riêng `zalo_phone`/`walk_in`/`direct_web`/`returning`/`sales_staff` | `NOT_IN_LIST` |
| `directSource` | Nguồn | enum, 5 giá trị (DOM D-6): `website` – khách tự đặt qua web OTTIMO · `zalo_phone` – khách **mới** liên hệ qua Zalo/điện thoại/mạng xã hội · `walk_in` – khách tới quầy không đặt trước · `returning` – khách **đã từng ở** OTTIMO tự liên hệ lại · `sales_staff` – sale nội bộ chủ động tìm/chốt khách. Khi trùng nhiều nguồn, ưu tiên `sales_staff` > `returning` > còn lại. Hồ sơ khách đã có lượt ở trước → **chọn sẵn** `returning` (lễ tân đổi được) và hiện gợi ý **(mới)** `booking.source_hint` "Khách đã từng ở → chọn Quay lại" (FB-R2-DOM-FE-02). CTV/môi giới **không** phải là nguồn mà là kênh `agent` | ĐK: bắt buộc khi kênh thuộc nhóm `direct` (AC8); kênh khác gửi trường này → lỗi | V-11 | `REQUIRED`; `DIRECT_SOURCE_NOT_ALLOWED` |
| `roomId` | Căn (`booking.field.room`) | uuid | B (trừ OTA lưu chưa gán – mục 6) | V-11; căn `isSellable=true` (AC2 US-004) | 409 `ROOM_NOT_SELLABLE` |
| `arrivalDate` | Ngày đến | date | B | V-05; ≥ hôm nay − 1 chỉ cho luồng nhận trước mốc đổi ngày (B9a – EP03), còn lại ≥ hôm nay; ≤ hôm nay + `booking_window_days` (BR-112) | `DATE_IN_PAST`; 422 `OUTSIDE_BOOKING_WINDOW` |
| `departureDate` | Ngày đi | date | B | > ngày đến; số đêm 1…`short_stay_max_nights` (BR-112); số đêm ≥ `long_stay_required_from_nights` (BR-108) → không lưu được, hướng sang AC5a (mục 4) | `DATE_ORDER`; 422 `OUTSIDE_BOOKING_WINDOW`; `LONG_STAY_REQUIRES_CONTRACT` → `field_error.long_stay_requires_contract` **(mới)** "Từ {n} đêm là thuê dài hạn. Chọn 'Đơn dài hạn nhập tay'." |
| — | Ở tối thiểu | – | – | Ngày đến rơi vào ngày có `min_stay` (BR-113: thứ Sáu, thứ Bảy, ngày đặc biệt → mặc định 2 đêm) mà số đêm < mức đó → chặn, **trừ** (a) ngoại lệ đêm lẻ BR-113: căn đã chọn là đêm lẻ → nhận; không phải đêm lẻ → lỗi kèm `suggestions[]` các căn đêm lẻ cùng nhóm (`orphanNight=true`), giao diện hiện nút "Dùng căn {room} (đêm lẻ)" (ARC A-05, DOM D-15); (b) FDL+ bỏ qua có lý do cho đơn trực tiếp. **Không** áp cho kênh OTA nhập tay (OTA đã kiểm trên kênh) và kênh **Nội bộ** (không phải bán – DOM D-7) | `MIN_STAY_NOT_MET` **(đề nghị ARC – mục 14)** → `field_error.min_stay` **(mới)** "Ngày đến {date} cần ở tối thiểu {n} đêm." |
| `adults` | Người lớn (từ 12 tuổi) | int | B | ≥ 1 | `REQUIRED` |
| `children6to11` | Trẻ 6–11 tuổi | int | K (0) | ≥ 0 | – |
| `childrenUnder6` | Trẻ dưới 6 tuổi | int | K (0) | ≥ 0; không tính sức chứa | – |
| — | Kiểm sức chứa | – | – | Mục 0 (`occCount ≤ max`) | 422 `CAPACITY_EXCEEDED` |
| `bookerGuestId` | Khách đứng tên (`booking.field.guest`) | uuid | B | Chọn bằng bộ chọn khách (EP00 11.4) | `REQUIRED` |
| — (SĐT của khách đứng tên) | `booking.field.phone` | – | ĐK: kênh `direct`/`agent` | Hồ sơ khách phải có SĐT hợp lệ (V-02); chưa có → nhập ngay trong form, lưu vào hồ sơ trước khi tạo đơn | 422 `PHONE_REQUIRED` → `error.PHONE_REQUIRED` (AC2) |
| `guestEmail` | Email khách | text | K (AC8) | V-03; lưu vào hồ sơ người đứng tên; trống → nhãn "Đơn chưa có email – khách cần mã xác minh từ lễ tân" | `EMAIL_INVALID` |
| `otaRef` | Mã đặt phòng OTA | text | ĐK: kênh có `requiresOtaRef` | 1–64, chỉ chữ/số/`-`; trùng `otaRef` + kênh với đơn khác chưa hủy → chặn | `REQUIRED`; `OTA_REF_DUPLICATE` **(đề nghị ARC)** → `field_error.ota_ref_duplicate` **(mới)** "Mã OTA này đã có ở đơn {code}." |
| `paymentModel` | Kiểu thanh toán (`booking.field.ota_paid`) | enum `direct` / `ota_prepaid` / `ota_pay_at_property` | B | Kênh `direct`/`agent`/`internal` → chỉ `direct`; kênh `ota` → `ota_prepaid` hoặc `ota_pay_at_property` (BR-307) | `NOT_IN_LIST` |
| `otaBookedAt` | Ngày khách đặt trên OTA | instant | K (kênh OTA) | ≤ thời điểm hiện tại | `DATE_INVALID` |
| `nightlyRates[]` | Giá mỗi đêm (`booking.field.rate`) | danh sách `{date, amountVnd}` | K | Bỏ trống → giá mặc định theo lịch giá của kênh (BR-101, 103, 104, giảm BR-107/111 cho Trực tiếp/CTV) và **hiện trước khi lưu** (`booking.field.rate_source`); mỗi ngày đúng một dòng trong khoảng lưu trú; > 0 (AC3); kênh `direct`/`agent`: trong sàn–trần nhóm (BR-105) → ngoài khoảng chặn; kênh `ota`: ngoài sàn–trần chỉ **cảnh báo**, bắt ghi `rateOverrideReason` | `AMOUNT_NOT_POSITIVE` → `booking.error.rate_empty`; 422 `RATE_OUT_OF_RANGE` → `booking.error.rate_range` |
| `rateOverrideReason` **(đề nghị ARC thêm)** | Lý do giá ngoài khoảng (OTA) | text | ĐK | V-08 | `REASON_REQUIRED` |
| `otaRoomAmountVnd` | Tổng tiền phòng OTA | money | K (kênh OTA) | > 0; có cả `nightlyRates` thì Σ phải bằng (erd mục 8) | `OTA_AMOUNT_MISMATCH` **(mới)** "Tổng giá các đêm ({sum}) khác tổng tiền OTA ({total})." |
| `otaChannelFeeVnd` | Phí kênh OTA báo | money | K | ≥ 0, ≤ `otaRoomAmountVnd` | `AMOUNT_INVALID` |
| `closerUserId` | Người chốt (`booking.field.closer` **(mới)**) | uuid | **ĐK (US-017 AC9 – PO quyết 16/10)**: **B** khi kênh nhóm `agent` (CTV) – phải là người có vai CTV; **B** khi kênh `direct` nguồn `sales_staff` – phải là sale nội bộ (SAL); kênh/nguồn khác: K (SAL/CTV/FD+) | Chọn từ `listCloserCandidates` (`kind=agent` cho kênh CTV, `kind=staff` cho nguồn `sales_staff`) – chỉ tên hiển thị, không SĐT/email (rbac ghi chú 37); V-11 | `REQUIRED` → **(mới)** `field_error.closer_required` "Chọn người chốt đơn (CTV / sale)."; sai loại người → `NOT_IN_LIST` |
| `etaTime` | Giờ đến dự kiến | time | K | `HH:mm` | – |
| `initialPayment` | Thu ngay (khách vãng lai / thu cọc) | `PaymentCreate` | ĐK: kênh `direct`/`agent` **phải** có thanh toán ≥ mức cọc BR-305 (B2 điều kiện b) hoặc là khách vãng lai đến hôm nay đã thu theo BR-402 (c); không đủ → hướng sang giữ chỗ (qua báo giá, mục 10.4) | `type` ∈ `deposit`/`charge`; `method` V-11; `amountVnd` > 0 | 422 `DEPOSIT_INSUFFICIENT` → `error.DEPOSIT_INSUFFICIENT` |
| `internalNote` | Ghi chú nội bộ | text | K | ≤ 1000, V-09 | `CARD_NUMBER_DETECTED` |

Kênh **Nội bộ** (phòng dùng nội bộ): `paymentModel=direct`, cho phép giá 0, `internalNote` bắt buộc (lý do dùng). Đêm Nội bộ là **đêm có khách miễn phí** (`is_complimentary`): tính vào Occupancy, **không** tính vào ADR, **không** trừ đêm khả dụng (khác OOO); không áp ở tối thiểu BR-113 (DOM D-7, metrics Q-05).

### 3.3 Thông tin tính sẵn hiện trước khi lưu
Gọi `calculateQuote` hoặc `previewOnly` (ARC chốt tên): số đêm (`booking.field.nights`), giá từng đêm + nguồn giá, **phụ thu người** (kênh Trực tiếp/CTV: `extraCount` × mức BR-110 theo bậc tuổi × số đêm – AC7; kênh OTA: 0, chỉ ghi số khách), tổng tiền phòng (`booking.summary.total`), cọc cần thu (BR-305 – **không** gồm phụ thu người, `booking.summary.deposit`), dòng thông tin "Có {extraCount} người ngủ sofa – buồng phòng chuẩn bị bộ đồ dùng thêm" khi `extraCount > 0` (BR-812).

### 3.4 Thứ tự kiểm ở server và kết quả
Thứ tự: quyền → dữ liệu trường (422 gom mọi lỗi trường) → căn bán được (`ROOM_NOT_SELLABLE`) → khối OOO (`ROOM_BLOCKED` – US-019 AC1) → chống trùng trong cùng giao dịch (`ROOM_UNAVAILABLE` – US-018) → tiền (`DEPOSIT_INSUFFICIENT`).

Thành công (AC1): đơn `confirmed`, mã `OTM-` (US-023), hiện trên rack, bản ghi khai báo `none` cần đủ số người (BR-608 – mọi người kể cả trẻ dưới 6 tuổi), folio, `stay_night`, lệnh đồng bộ đóng phòng (BR-905), việc HK bộ đồ dùng thêm nếu `extraCount > 0` (BR-812). Thông báo `booking.toast.created`.

### 3.5 Chống đặt trùng (US-018)
| Tình huống | Kết quả | Chuỗi |
|---|---|---|
| Kênh `direct`/`agent`/`internal`, căn đã có đơn/khối trong khoảng (AC1) | 409 `ROOM_UNAVAILABLE` + `conflicts[]` (khoảng trùng) + `suggestions[]` | FD+: `booking.error.conflict` (có tên khách); vai khác: `booking.error.conflict_noname`; `booking.error.conflict_alt` |
| Hai người lưu cùng căn – đêm gần như đồng thời (AC2) | Một thành công; người kia 409 `ROOM_UNAVAILABLE`; form giữ nguyên dữ liệu | `booking.error.server_conflict` |
| Ngày đi đơn A = ngày đến đơn B (AC3) | Không trùng | – |
| Kênh `ota` vào căn đã kín (AC5) | Mục 6 | – |

AC4: cùng một hàm kiểm trùng ở server cho B1, B4, B7, B7a, B12, B13, B14, O1, O3 – QA kiểm bằng ca đồng thời cho từng luồng (state-machines 0.2 điểm 4).

---

## 4. Đơn dài hạn nhập tay – **US-017 AC5a (tạm R2)** – `createReservation` + `manualLongStay`

Hiện khi số đêm ≥ `long_stay_required_from_nights` (BR-108): form chuyển sang chế độ "Đơn dài hạn nhập tay" (nút chọn, không tự đổi).

| Trường | Nhãn | Kiểu | BB | Kiểm tra | Lỗi |
|---|---|---|---|---|---|
| `roomId` | Căn | uuid | B | Như 3.2 | như 3.2 |
| `channelId` | Kênh | uuid | B | Chỉ kênh `direct` hoặc `agent` (HĐ trực tiếp/CTV) | `NOT_IN_LIST` |
| `arrivalDate` | Ngày vào ở | date | B | V-05; ≥ hôm nay (xem Q-01) | `DATE_IN_PAST` |
| `departureDate` | Ngày ra (theo HĐ giấy) | date | B | Số đêm ≥ `long_stay_required_from_nights`; ≤ ngày vào + 24 tháng `[GIẢ ĐỊNH BA – ràng buộc nhập liệu]` | `MANUAL_LONG_STAY_BELOW_THRESHOLD` → `field_error.manual_long_stay_short` **(mới)** "Đơn dài hạn nhập tay cần từ {n} đêm." |
| `adults`, `children6to11`, `childrenUnder6` | Số người | int | B / K / K | Như 3.2; kiểm sức chứa (mục 0) | `CAPACITY_EXCEEDED` |
| `bookerGuestId` | Khách thuê | uuid | B | Có SĐT (V-02) | `PHONE_REQUIRED` |
| `paymentModel` | – | – | – | Server đặt `direct` | – |
| `manualLongStay.monthlyRentVnd` | Tiền thuê/tháng (theo HĐ giấy) | money | B | > 0 | `AMOUNT_NOT_POSITIVE` |
| `manualLongStay.externalContractRef` | Số HĐ giấy | text | K | ≤ 64 | `TOO_LONG` |
| `manualLongStay.depositHeldVnd` | Ký quỹ đang giữ ngoài hệ thống | money | K | ≥ 0; chỉ hiển thị, không tạo giao dịch | – |
| `manualLongStay.note` | Ghi chú | text | K | ≤ 500, V-09 | – |
| Không được gửi | – | – | – | `nightlyRates`, `otaRoomAmountVnd`, `allowUnassigned`, `initialPayment` → 422 | `VALIDATION_FAILED` |

Kết quả: đơn `confirmed`, `stayType=long`, cờ `externalContract=true` hiển thị "HĐ ngoài hệ thống – chuyển vào app ở R3"; chiếm tồn phòng, chống trùng như mục 3.5; thanh `long_stay` trên rack; **không** sinh HĐ, kỳ thu, hoa hồng, giá theo đêm; thu tiền bằng ghi thu không gắn kỳ (US-119 AC1). `extraCount > 0` → vẫn sinh việc bộ đồ dùng thêm (BR-812 áp mọi đơn `confirmed`). SAL/CTV không tạo được (A01 ✖). Danh sách đơn lọc `externalContract=true` (để chuyển HĐ ở R3, giữ mã đơn).

**Q-01 (gửi PO + DOM, không chặn Sprint 2):** P-R2-3 nhằm đưa **khách dài hạn đang ở** lên rack, nhưng AC5a tạo đơn `confirmed` từ hôm nay trở đi. Khách đã ở từ trước khi dùng app cần đơn `in_house` có ngày vào ở trong quá khứ. Đề xuất BA: thêm `manualLongStay.alreadyInHouse=true` (chỉ FDL+), cho `arrivalDate` < hôm nay, server tạo thẳng `in_house` với `actualCheckinAt` = ngày vào ở 14:00, không đòi điều kiện BR-402 và giấy tờ (khai báo đã làm ngoài hệ thống, bản ghi khai báo `void`/đánh dấu "ngoài hệ thống"). Cần DOM xác nhận nghiệp vụ, ARC đổi hợp đồng. **Tạm thời** (`[GIẢ ĐỊNH BA]`): lễ tân nhập `arrivalDate` = hôm nay rồi nhận phòng bình thường (B9) – rack đúng từ hôm nay, lịch sử lưu trú trước đó nằm ngoài app.

---

## 5. Chi tiết đơn – S04 (US-020) – `getReservation`

### 5.1 Khối thông tin
| Khối | Trường (API) | Vai thấy |
|---|---|---|
| Đầu | `code`, `status` (`status.booking.*`), kênh, `stayType`, cờ `externalContract`, cờ xung đột (`conflictState=open` → "Chưa gán căn") | Mọi vai có S04 |
| Tiến trình (AC1) | `progress[]`: ngắn ngày `hold → deposit → confirmed → checked_in → checked_out`; dài hạn thêm `contract`, `first_period` (R3) | Mọi vai có S04 |
| Lưu trú | căn (`segments[]`), ngày đến/đi, số đêm, số người (`adults`, `children6to11`, `childrenUnder6`), "Có {extraCount} người ngủ sofa" khi vượt định mức, `etaTime`, giữ chỗ (`hold.expiresAt` → `drawer.hold.expires`) | Mọi vai có S04 |
| Khách | `booker` (`GuestSummary`), người đi cùng (mục 8), cảnh báo "Thiếu {n} người" (`partyMissingCount` – US-022 AC1) | FD+ đầy đủ; SAL/CTV: tên + quốc tịch, số người (không quan hệ) |
| Tiền | `nightlyRates` (FD+, SAL), `totalRoomVnd`, `depositRequiredVnd` (FD+, SAL, CTV), `balanceDueVnd` (FD+, SAL), folio (FD+) | CTV chỉ tổng tiền phòng + cọc (AC3, rbac ghi chú 4) |
| Khai báo | `registrationStatus`, `registrationDeadlineAt` | FD+ |
| Ghi chú | `internalNote` | FD+ |
| Lịch sử | `getReservationHistory` | FD+ |

### 5.2 Nút hành động = `allowedActions[]` (server tính theo trạng thái **và** vai)
| Trạng thái | Hành động (`event` – mã chuyển) | Vai |
|---|---|---|
| `hold` | `confirm_deposit` B4 "Xác nhận đã nhận cọc" | FD+, SAL (của mình) |
| `hold` | "Báo đã chuyển cọc" (A53, `createDepositNotice`) | CTV, SAL (của mình) |
| `hold` | `extend_hold` B3 (khi `hold.extendedCount = 0` và chưa hết hạn) | FD+, SAL/CTV (của mình) |
| `hold` | `cancel_hold` B5 | FD+, SAL/CTV (của mình) |
| `confirmed` | `check_in` B9 (khi ngày nghiệp vụ = ngày đến, `conflictState ≠ open`; `requiresTrustedDevice=true`) | FD+ |
| `confirmed` | `move` B7, `cancel` B10, `mark_no_show` B11 (khi đủ điều kiện mục 9) | FD+ (B10 thêm SAL cho đơn trực tiếp của mình) |
| `confirmed` | `postpone` B8 | MGR+ |
| `confirmed` + `conflictState=open` | `assign_room` B7a | FD+ |
| `in_house` | `extend_stay` B13, `change_room` B14, `set_late_checkout` B15, `early_departure` B16, `check_out` B18 (ngày đi = hôm nay) | FD+ |
| `in_house` | `undo_check_in` B17 | MGR+ |
| `no_show` | `restore_no_show` B12 (`requiresApproval=true` khi thiếu điều kiện BR-315 với FD/FDL) | FD+ |
| `checked_out` | Chỉ "Xem bill" | FD+ |
| `cancelled` | Không có nút thay đổi | – |

Không có nút "Hủy" khi `in_house` (US-021 AC6). Gọi API chuyển không hợp lệ → 409 `INVALID_TRANSITION` (AC4) → `error.INVALID_TRANSITION` (`{status}` = trạng thái hiện tại).

### 5.3 Phạm vi CTV/SAL (AC3, US-087)
CTV mở đơn không do mình tạo/chốt/được gán → **404** `NOT_FOUND` (không lộ sự tồn tại – OpenAPI quy ước, khớp US-087 AC2). Chuỗi `error.NOT_FOUND`.

### 5.4 Sửa thông tin không đổi tồn phòng – `updateReservation` (FD+, `If-Match`)
| Trường | Kiểu | Kiểm tra | Hệ quả |
|---|---|---|---|
| `adults`, `children6to11`, `childrenUnder6` | int | Như 3.2; kiểm sức chứa (mục 0); trạng thái `hold`/`confirmed`/`in_house` | Tính lại phụ thu người (Trực tiếp/CTV; `in_house`: đề xuất dòng phụ thu, lễ tân xác nhận số tiền trước khi ghi folio – BR-110, BR-414); số người cần khai báo cập nhật (khai báo đã `confirmed` → `needs_update`); `extraCount` đổi → thêm/hủy/thu hồi việc bộ đồ dùng thêm (BR-812 (4)); thêm người khi `in_house` → việc hạn `extra_guest_kit_midstay_due_minutes` |
| `etaTime` | time | `HH:mm` | Có `etaTime` → không nhắc gọi no-show (BR-311) |
| `closerUserId` | uuid | V-11 | Hoa hồng tính theo người chốt mới (chỉ khi chưa `confirmed` – sau đó cần MGR+) `[GIẢ ĐỊNH BA]` |
| `internalNote` | text | ≤ 1000, V-09 | – |

---

## 6. Đơn OTA nhập tay vào căn đã kín – US-018 AC5, **US-139**

### 6.1 Luồng (SM-01 B7b, B7a; BR-312, 316, 317)
1. FD lưu đơn kênh OTA vào căn đã kín → server **không** tự đổi căn: 409 `ROOM_UNAVAILABLE` kèm `suggestions[]` (căn trống cùng nhóm trước theo BR-316 – ưu tiên `VI`/`VC` nếu đến hôm nay, ít tạo đêm lẻ; nhóm khác đánh dấu `upgrade=true`, chỉ gợi ý).
2. Giao diện hiện danh sách gợi ý (`booking.error.conflict_alt`); căn `upgrade=true` có nhãn "Nâng hạng – cần lễ tân trưởng xác nhận" và chỉ FDL+ chọn được (BR-312 (4)(ii)).
3. Chọn căn gợi ý → gửi lại với `roomId` mới → đơn `confirmed` ở căn đó.
4. Không còn căn hoặc chọn "Lưu chưa gán căn" → gửi lại với `allowUnassigned: true` (chỉ kênh `ota`; kênh khác → 422 `VALIDATION_FAILED` mã trường `ALLOW_UNASSIGNED_OTA_ONLY`) → đơn `confirmed`, `conflictState=open`, **không** chiếm căn, vào làn "Chưa gán căn", tạo `overbooking_incident` (`source=desk`), cảnh báo đỏ ngay cho FD + MGR (thông báo + "Cần chú ý" `overbooking`), hạn có phương án theo BR-317 (5).

### 6.2 Hộp "Lưu chưa gán căn"
Nội dung: "Đơn {otaRef} sẽ vào làn Chưa gán căn và chưa nhận phòng được. Quản lý nhận cảnh báo ngay. Hạn có phương án: {deadline}." Nút "Lưu chưa gán căn" / "Quay lại chọn căn".

### 6.3 Gán căn – `assignRoom` (B7a)
| Trường | Kiểu | BB | Kiểm tra | Lỗi |
|---|---|---|---|---|
| `roomId` | uuid | B | Trống cả khoảng, không khối OOO, `isSellable`, đủ sức chứa | 409 `ROOM_UNAVAILABLE` (+ `suggestions[]`), `ROOM_BLOCKED`, `CAPACITY_EXCEEDED` |
| `resolution` | enum `reassigned_same_group` / `upgraded` | B | `upgraded` khi căn khác nhóm → chỉ FDL+ | 403 `FORBIDDEN_ACTION` |
| `note` | text | K | ≤ 500, V-09 | – |

Thành công: `conflictState=resolved`, incident `resolved`, việc bộ đồ dùng thêm nếu `extraCount > 0` (BR-812), đồng bộ kênh. Không bao giờ dời khách `in_house`, dài hạn, VIP/khách quen (BR-312 (3)) – các đơn này không xuất hiện trong lựa chọn "dời đơn khác".

### 6.4 Dời đơn khác để lấy căn
- Đổi chéo căn hai đơn (`swapRoom`): `otherReservationId` (B), `otherVersion` (B), `effectiveDate` (K), `reason` (B, V-08). Đơn khác phải không thuộc nhóm "không bao giờ dời". Lỗi lúc ghi → 409 `ROOM_UNAVAILABLE`.
- Dời ra cơ sở khác (`resolveOverbookingExternal`, MGR+): `costVnd` (B, ≥ 0), `note` (B, V-08) → đơn hủy lý do `overbooking_relocated` (B10), ghi chi phí (BR-317 (7)).

### 6.5 Chặn nhận phòng (US-139 AC3)
Đơn còn `conflictState=open` → nút nhận phòng không có; gọi API → 409 `RESERVATION_UNASSIGNED` → `error.RESERVATION_UNASSIGNED`; điều kiện nhận phòng hiện `checkin.cond.not_unassigned` chưa đạt.

---

## 7. Hủy đơn / hủy giữ chỗ (US-021) – `cancelReservation` (B5, B10)

### 7.1 Quyền
FD+ mọi đơn; SAL: giữ chỗ của mình + đơn **trực tiếp** của mình đã xác nhận (`own_direct_only`); CTV: chỉ giữ chỗ của mình (`own_hold_only`). Đơn `in_house` không hủy (AC6 – dùng trả sớm).

### 7.2 Trường
| Trường | Nhãn | Kiểu | BB | Kiểm tra | Lỗi |
|---|---|---|---|---|---|
| `reasonCode` | Lý do hủy (`cancel.reason`) | enum (BR-308) | B (AC1) | Người dùng chọn: `guest_changed_mind` (`cancel.reason.changed_mind`), `found_other`, `price`, `date_change` (`cancel.reason.dates`), `unreachable`, `other`; thêm `ota_cancelled` ("OTA báo hủy" **(mới)**) chỉ khi kênh `ota`. Mã hệ thống `hold_expired`, `overbooking_relocated`, `group_partial`, `guest_cancelled` **không** có trong danh sách chọn | `REQUIRED`; `NOT_IN_LIST` |
| `note` | Ghi rõ | text | ĐK (`other`) | V-08, ≤ 500 | `REASON_REQUIRED` |
| `dryRun` | – | bool | – | Gọi `true` khi mở hộp xác nhận (không cần `Idempotency-Key`/`If-Match`), `false` khi bấm xác nhận | – |
| — (đơn OTA) | Tiền phạt theo kênh | money | ĐK: kênh `ota` | ≥ 0, nhập theo extranet; app không tự tính (BR-310) `[đề nghị ARC thêm trường `otaPenaltyVnd`]` | `AMOUNT_INVALID` |

### 7.3 Hộp xác nhận (AC2, US-135)
- `hold`: `cancel.title`, `cancel.consequence` (căn, khoảng ngày mở bán lại, số kênh, lead quay về "Đã báo giá"), `cancel.fee_none`.
- `confirmed` Trực tiếp/CTV đã cọc: `confirm.cancel_booking.*` với `{retained}` = phí hủy, `{refund}` = phần hoàn theo `CancellationQuote` (BR-309, đếm ngày BR-011, ngày cao điểm không hoàn) – AC4. Phần hoàn tạo yêu cầu duyệt `refund` cho MGR+ (BR-522).
- MGR+ có lựa chọn "Dời ngày thay vì hủy" (B8, `moveReservation mode=postpone_instead_of_cancel`) – một lần, ngày đến mới ≤ ngày đến cũ + `reschedule_window_months` (BR-309); FD không thấy (AC5).

### 7.4 Kết quả (AC3)
`cancelled`; căn trống ngay trên rack; lệnh đồng bộ mở phòng; khai báo → `void`; hoa hồng → `void`; lead → `quoted` (khi hủy `hold`); việc bộ đồ dùng thêm chưa làm → hủy, đã chuẩn bị → thu hồi (BR-812 (4)); nhật ký ghi lý do, người hủy, phí/hoàn. Lỗi: 409 `INVALID_TRANSITION` (đơn đã đổi trạng thái), 412 `VERSION_CONFLICT`.

---

## 8. Người đi cùng (US-022) – `listParty`, `addPartyMember`, `removePartyMember`

| Trường | Nhãn | Kiểu | BB | Kiểm tra | Lỗi |
|---|---|---|---|---|---|
| `role` | Loại | enum `companion` (người lớn có hồ sơ) / `child` (trẻ em) | B | V-11 | – |
| `guestId` | Người đi cùng | uuid | ĐK (`companion`) | Chọn bằng bộ chọn khách; tuổi ≥ `minor_data_age_threshold` (BR-612); không trùng người đã có trong đơn (gồm người đứng tên) | 409 `PARTY_DUPLICATE` **(đề nghị ARC đặt mã)** → `field_error.party_duplicate` **(mới)** "Người này đã có trong đơn." (AC3) |
| `relationship` | Quan hệ | enum `spouse`, `partner`, `family`, `friend`, `colleague`, `unknown` | K (mặc định `unknown`) | V-11; SAL/CTV không thấy (D10) | – |
| `childName` | Họ tên trẻ | text (C3, chỉ ghi) | ĐK – **B** khi `role = child`; gửi kèm `role = companion` → 422 `NOT_ALLOWED` | V-01, 1–100 ký tự | `REQUIRED`; `NOT_ALLOWED` |
| `childBirthYear` | Năm sinh | int 4 chữ số (C3, chỉ ghi – không bao giờ trả lại, chỉ trả `priceAgeBand`/`isMinorData`) | ĐK – **B** khi `role = child` (S4-45, khớp server `party.service.ts`); gửi kèm `role = companion` → 422 `NOT_ALLOWED` (`field` = `childName`) | Số nguyên, 2000 ≤ năm ≤ **năm của ngày nghiệp vụ hiện tại** (BR-010); ô trống/không phải số → coi như thiếu | Thiếu → 422 `REQUIRED` → **(mới)** `party.child_birth_year_required` "Nhập năm sinh của trẻ để tính đúng phụ thu và sức chứa."; ngoài khoảng → `VALUE_OUT_OF_RANGE` → `field_error.value_out_of_range` |

**S4-45 – năm sinh trẻ em là bắt buộc (BA chốt 17/10, khớp server):** server đã bắt buộc từ Sprint 3 (`f.int('childBirthYear', { required: true, min: 2000, max: năm hiện tại })`) và đặc tả 0.1 đã ghi "ĐK (`child`)" = bắt buộc khi là trẻ em; Desk hiện ô **không** có dấu bắt buộc (hiện "không bắt buộc") → lễ tân để trống, server trả `REQUIRED`, hộp bị chặn mà không rõ vì sao. Lý do giữ bắt buộc: chỉ có năm sinh mới tính được (1) bậc tuổi phụ thu BR-110 (tuổi = năm đến − năm sinh − 1, tuổi nhỏ nhất có thể – DOM S3-7, EP03-05 4.7), (2) sức chứa (trẻ dưới `child_free_under_age` không tính – ESC-014), (3) ngưỡng dữ liệu trẻ em BR-612 (`isMinorData`), (4) khai báo lưu trú người dưới ngưỡng (EP06 mục 0). Desk: ô "Năm sinh" có dấu **bắt buộc**, bàn phím số, tối đa 4 ký tự; nút "Thêm" khóa kèm lý do cạnh nút khi ô trống (mẫu "… để bật nút" của UXD); câu trợ giúp `rsv.child_note` giữ ("chỉ cần năm sinh – không tạo hồ sơ khách"). Không đổi hợp đồng: `PartyMemberCreate.childBirthYear` không nằm trong `required` vì chỉ bắt buộc theo `role` – đề nghị ARC ghi câu "bắt buộc khi `role = child`" vào mô tả trường (E02-09). Trẻ có năm sinh cho tuổi ≥ `adult_from_age` vẫn nhận được với `role = child` nhưng tính như người lớn (`priceAgeBand = adult`) – Desk hiện bậc tuổi server trả, không tự tính.

- Người dưới ngưỡng bảo vệ dữ liệu (`isMinorData`): **không** tạo hồ sơ CRM, không lưu liên hệ, không hỏi đồng ý marketing (AC2, rbac mục 9). Bậc tuổi phụ thu (`priceAgeBand`) tính riêng theo BR-110 tại ngày đến.
- Thêm người làm `occCount` vượt số khách đã khai → hỏi "Cập nhật số khách của đơn lên {n}?" → gọi `updateReservation` (mục 5.4: sức chứa, phụ thu, bộ đồ dùng thêm). Vượt sức chứa → chặn `CAPACITY_EXCEEDED`.
- Đơn OTA: chỉ cập nhật số khách; phụ thu chỉ khi số người thực tế vượt số khách trên đơn OTA (BR-110).
- Cảnh báo thiếu người: `partyMissingCount > 0` → "Thiếu {n} người" ở khối khách (AC1, BR-601).
- Xóa người đi cùng: FD+, không có hộp xác nhận (đảo ngược được bằng thêm lại); khai báo đã `confirmed` → `needs_update`.

---

## 9. Đổi căn, đổi ngày, đổi phòng (US-024)

### 9.1 Đơn chưa nhận phòng – `moveReservation` (B7, `mode=change`)
| Trường | Kiểu | BB | Kiểm tra | Lỗi |
|---|---|---|---|---|
| `roomId` | uuid | ĐK (ít nhất một trong căn/ngày thay đổi) | Trống khoảng mới, không OOO, bán được, đủ sức chứa; **không** đòi căn đang sạch (AC4) | 409 `ROOM_UNAVAILABLE`, `ROOM_BLOCKED`, `ROOM_NOT_SELLABLE`; 422 `CAPACITY_EXCEEDED` |
| `arrivalDate`, `departureDate` | date | ĐK | V-05, BR-112; đơn OTA **không** đổi ngày (chỉ đổi căn nội bộ). Khách OTA muốn đổi ngày ở R2 (DOM D-5): hủy đơn với lý do `ota_cancelled` (tiền phạt 0) rồi tạo đơn mới cùng mã OTA, ghi chú "OTA sửa đơn"; từ R3 channel manager tự xử lý | `OTA_DATES_LOCKED` → "Đơn OTA chỉ đổi ngày theo kênh." |
| `reasonCode` | `MoveReasonCode` (OpenAPI 0.3.5, A-19), 7 lý do (DOM D-5): `guest_request` – khách yêu cầu (cũng dùng khi dời ngày thay vì hủy, B8 thường) · `property_fault` – căn hỏng/sự cố, gắn OOO · `overbooking` – xử lý trùng/xung đột, **chỉ hiện** khi đơn `conflictState = open` hoặc `capacityConflict = true` (BR-312) · `upgrade` – nâng hạng chủ động, **chỉ FDL+** (BR-316 (3)) · `inventory_optimize` – sắp căn để tránh đêm lẻ, khách không bị ảnh hưởng, chỉ khi chưa báo số căn cho khách (**0.3.7**: chỉ hiện khi `Reservation.roomDisclosedToGuest = false`) · `force_majeure` – **chỉ** `mode = postpone_instead_of_cancel` (B8), dời ngày miễn phí do bất khả kháng (BR-309), **MGR+**, bắt buộc ghi chú bằng chứng · `other`. **0.3.7 (ESC-019 A)**: mã lý do quyết **giá** – xếp theo 3 nhóm "khách xin / OTTIMO đổi / khác" (mục 9.3.2) | B | V-11. Sai vai hoặc sai chế độ (`upgrade` do FD gửi; `force_majeure` do người dưới MGR gửi) → 403; `force_majeure` ngoài B8 → 422 `NOT_IN_LIST`; `overbooking` cho đơn không có cờ xung đột → 422 `NOT_IN_LIST`; **0.3.7**: `inventory_optimize` khi `roomDisclosedToGuest = true` → 422 `NOT_IN_LIST`; `other` sang căn có giá Trực tiếp hiện hành cao hơn do FD gửi → 403 `FORBIDDEN_ACTION` (BR-429 (b)). Đổi căn đơn OTA sang căn vẫn nhỏ hơn số khách → cảnh báo `CAPACITY_EXCEEDED_WARNING`, gửi lại với `capacityWarningAckReason` | `REQUIRED`; `NOT_IN_LIST`; 403 `FORBIDDEN_ACTION` |
| `note` | text | ĐK (`other`, `force_majeure`) | V-08 (≥ 3 ký tự); lệnh xem trước (9.3) không đòi | `REASON_REQUIRED` |
| `overbookingResolution` | enum `reassigned_same_group` / `upgraded` | ĐK (`conflictState=open`) | Sang nhóm căn khác = `upgraded`, chỉ FDL+ (BR-312 (4)) | `REQUIRED`; 403 |
| `applyDifference` **(0.3.7)** | bool – ô "Đã báo khách số tiền mới" (`move.told_guest`) | ĐK – **B** = `true` khi lý do `guest_request` **và** có đổi căn **và** đơn không phải dài hạn nhập tay (`externalContract = false`) – đúng điều kiện server kiểm (kể cả đơn OTA và khi OWN đặt `room_move_pricing.guestRequest = keep_booked_rate`) | Mục 9.3.4 | 422 `REQUIRED` (`field` = `applyDifference`, kèm `folioDeltaVnd`) |
| `expectedDeltaVnd` **(0.3.7)** | số nguyên VND, có thể âm hoặc 0 | ĐK – **B** cùng điều kiện với `applyDifference`; với `guest_request` chỉ đổi ngày: K, nhưng Desk **luôn gửi** số đã hiện (server so nếu có) | = `MovePreview.folioDeltaVnd` của bản tính thử khớp đúng đầu vào đang gửi | 422 `REQUIRED` (`field` = `expectedDeltaVnd`); 422 `AMOUNT_INVALID`; lệch → 409 `SURCHARGE_CHANGED` (`surchargeVnd` = `folioDeltaVnd` mới) – mục 9.3.5 |
| `capacityWarningAckReason`, `visaWarningAckReason` | text 3–500 | ĐK (khi bản tính thử có cảnh báo tương ứng – 9.3.3) | V-08, V-09 | 422 cảnh báo `CAPACITY_EXCEEDED_WARNING` / `VISA_EXPIRES_BEFORE_DEPARTURE` |
| `mode` | enum `change` (mặc định, B7) / `postpone_instead_of_cancel` (B8 – mục 7.3) | K | B8 chỉ MGR+ | 403 |

Kết quả (AC1 – **trước ESC-019**; từ 0.3.7 áp cho lý do do OTTIMO, `other` và mọi trường hợp chỉ đổi ngày giữ căn; khách tự xin đổi **căn** → mục 9.3): server kiểm trùng; đêm không đổi giữ **giá lịch** đã chốt (BR-006, BR-106); đêm mới lấy giá lịch hiện hành của kênh. Khi số đêm thay đổi, bậc giảm BR-107 tính lại theo **tổng số đêm cuối cùng** và áp lại cho **mọi đêm còn hiệu lực** trên giá lịch của từng đêm (chỉ kênh `direct`/`agent`; không áp OTA/Nội bộ). Ví dụ căn 202: 5 → 7 đêm = **5.205.000** (BR-107); 7 → 5 đêm = **4.079.000**. Cọc đã thu giữ nguyên, không đòi cọc bổ sung (DOM D-8). Folio đồng bộ trong cùng giao dịch: đảo dòng của đêm bỏ, ghi dòng đêm mới, phụ thu người theo số người mới (FB-R2-DOM-BE-02); đồng bộ kênh; việc bộ đồ dùng thêm chuyển sang căn mới / tính lại theo định mức căn mới (BR-812 (4)).

### 9.2 Khách đang ở – `changeRoom` (B14)
| Trường | Kiểu | BB | Kiểm tra | Lỗi |
|---|---|---|---|---|
| `newRoomId` | uuid | B | Trống từ `effectiveDate` đến ngày đi; buồng `VI`/`VC` (AC4, BR-803); không OOO; đủ sức chứa | 409 `ROOM_UNAVAILABLE`, `ROOM_BLOCKED`; 409 `ROOM_NOT_READY` **(đề nghị ARC đặt mã)** → "Căn {room} chưa sẵn sàng (đang {status}). Chọn căn đã dọn." |
| `effectiveDate` | date | B | = hôm nay (ngày nghiệp vụ) hoặc trong khoảng lưu trú | `DATE_INVALID` |
| `cause` | enum `property_fault` (sự cố OTTIMO – giữ giá) / `guest_request` (khách yêu cầu – giá căn mới từ đêm đổi, `room_change.cause.guest_request`) | B | BR-424 (AC2) | – |
| `reason` | text | B | V-08 | `REASON_REQUIRED` |

Kết quả (AC3): căn cũ → `VD`/`OD` + việc dọn; mã cửa cũ "đã hủy", yêu cầu nhập mã mới (BR-403); khai báo không làm lại (BR-424); bộ đồ dùng thêm: việc "chuyển bộ sang căn mới" (BR-812 (4)).

### 9.3 Xem trước tiền khi đổi căn / đổi ngày đơn chưa nhận phòng – `previewMoveReservation` (B7, B8 – ESC-019 A, BR-429 (a)–(h), US-024 AC5–AC7) – *mới 0.2, Sprint 4 S4-21 + S4-04*

#### 9.3.1 Mục đích, quyền, khi nào gọi
- **Mục đích**: lễ tân thấy **trước khi lưu** số tiền mới của đơn sau khi đổi căn/đổi ngày, báo khách, rồi lưu **đúng số đó** (BR-429 (d), BR-414). Xem trước và lệnh ghi `moveReservation` chạy **cùng một hàm tính** (ARC `openapi-0.3.7.md` 10.4): cùng đầu vào, dữ liệu không đổi giữa hai lần gọi → số lưu = số xem trước từng đồng, không bao giờ 409 `SURCHARGE_CHANGED`.
- **Quyền**: FD+ (rbac A07, A08 – `x-rbac: [A07, A08]`). SAL, CTV, HK, MT → 403. B8 (`mode = postpone_instead_of_cancel`) chỉ MGR+ (mục 7.3).
- **Không ghi gì**: giao dịch chỉ đọc, không `Idempotency-Key`, không `If-Match`, không khóa đơn; gọi lại bao nhiêu lần cũng được.
- **Áp cho**: đơn `hold`, `confirmed` (B7, B8). Đơn `in_house` đổi phòng dùng `changeRoom` + `dryRun` (mục 9.2, B14 – cùng hàm tính theo ARC 10.4, S4-04).
- **Khi nào Desk gọi**: hộp "Đổi căn / đổi ngày" (`move.title`) có đủ đầu vào – đã chọn lý do **và** ít nhất căn hoặc ngày khác hiện tại. Mỗi lần đổi căn, ngày, lý do hoặc chế độ → gọi lại (đợi người dùng ngừng nhập ngày khoảng 300 ms `[GIẢ ĐỊNH BA – chi tiết cài đặt FE]`). Trong lúc chờ bản mới: giữ bản cũ làm mờ + "Đang tính thử…" (`move.preview_loading`), nút Lưu khóa (UXD FE-S4-08).

#### 9.3.2 Ba nhóm lý do – "khách xin đổi" hay "OTTIMO đổi" (BR-429 (a), (b); `MoveReasonCode` 0.3.7)
Ô "Lý do đổi" (`move.reason`) chia **3 nhóm có tiêu đề**, lễ tân nhìn là biết lý do quyết giá thế nào:

| Nhóm (chuỗi tiêu đề) | Mã | Giá khi **đổi căn** (`pricingBasis`) | Chỉ đổi ngày, giữ căn | Ai chọn được / khi nào hiện |
|---|---|---|---|---|
| **Khách xin đổi** – `move.group_guest` "Khách xin đổi – tính giá căn mới" | `guest_request` (`move.reason.guest_request`) | `new_room_rate`: **mọi đêm** của đơn sau khi đổi lấy lịch giá hiện hành của căn mới (BR-104, giá Trực tiếp/CTV), áp lại BR-107 **hoặc** BR-111 (mức có lợi hơn cho khách, không cộng dồn); **hai chiều** (đắt hơn trả thêm, rẻ hơn được giảm); đổi về lại căn cũ cũng lấy giá hiện hành. Phụ thu người theo định mức căn mới (BR-429). Đơn OTA → mục 9.3.3 dòng `roomChangeDifferenceVnd` | `keep_booked_rate`: đêm giữ giữ giá đã chốt, đêm thêm giá hiện hành, BR-107 tính lại theo tổng đêm (AC1) | FD+; luôn hiện |
| **OTTIMO đổi** – `move.group_ottimo` "OTTIMO đổi – giữ giá đã đặt" | `property_fault`, `overbooking`, `upgrade`, `inventory_optimize`, `force_majeure` | `keep_booked_rate`: **giữ nguyên mọi dòng** (giá từng đêm BR-106, dòng chênh lệch OTA đã ghi); phụ thu người mỗi đêm = min(cũ, theo căn mới) – khách không bao giờ trả thêm vì OTTIMO đổi | Như cột bên | `property_fault` FD+; `overbooking` chỉ khi đơn `conflictState = open` hoặc `capacityConflict = true`; `upgrade` chỉ FDL+ (ẩn với FD); `inventory_optimize` chỉ khi `roomDisclosedToGuest = false`; `force_majeure` chỉ B8, MGR+ |
| **Khác** – `move.group_other` "Khác – giữ giá đã đặt" | `other` | Như OTTIMO đổi (giữ giá). Sang căn có giá Trực tiếp hiện hành cao hơn → chỉ FDL+ (FD nhận 403 ngay ở bước xem trước → hiện lỗi `error.FORBIDDEN_ACTION` tại ô lý do) | Như cột bên | FD+; `note` bắt buộc khi lưu |

- **Khách xin mà OTTIMO muốn tặng phần chênh**: vẫn chọn `guest_request`, lưu với số mới, rồi gửi **giảm giá đặc biệt có duyệt** cho phần chênh (`requestFoc kind = special_discount`, BR-431…433, vào báo cáo FOC). Không dùng `upgrade` để né giá (US-024 AC5). Desk hiện câu gợi ý dưới nhóm "Khách xin đổi" **(đề nghị UXD – E02-11)**.
- **Đơn dài hạn nhập tay** (`Reservation.externalContract = true`, US-017 AC5a): mọi nhóm → `pricingBasis = external_contract`, chênh 0, câu `move.basis.external_contract` (BR-429 (h)); mã lý do, kiểm trùng, khối OOO vẫn áp.
- **Tham số `room_move_pricing.guestRequest`** (OWN, mặc định `new_room_rate` theo ESC-019 A): OWN đặt `keep_booked_rate` thì `guest_request` đổi căn cũng giữ giá – ô "Đã báo khách" **vẫn** bắt buộc (server kiểm theo lý do, không theo `pricingBasis`).

#### 9.3.3 Đầu vào và phản hồi
**Tham số (query, `GET …/reservations/{id}/move-preview`)**: `roomId` (vắng = giữ căn), `arrivalDate`, `departureDate` (vắng = giữ), `mode` (`change` mặc định / `postpone_instead_of_cancel`), `reasonCode` (**B**). Không gửi `note`, `overbookingResolution`, lý do cảnh báo – chỉ lệnh lưu cần.

**Lỗi** (cùng kiểm tra với `moveReservation`, trừ `note`): 409 `ROOM_UNAVAILABLE` / `ROOM_BLOCKED` kèm `suggestions[]` (hiện danh sách căn gợi ý), 409 `ROOM_NOT_SELLABLE`; 422 `CAPACITY_EXCEEDED`, `MIN_STAY_NOT_MET`, `OTA_DATES_LOCKED`, `NOT_IN_LIST` (lý do không hợp lệ cho đơn – mục 9.1), `DATE_ORDER`, `DATE_IN_PAST`; 403 `FORBIDDEN_ACTION` (`upgrade` do FD, `other` sang căn đắt hơn do FD, B8 do người dưới MGR); 404. Mất mạng/5xx → `move.preview_failed` + nút Thử lại; nút Lưu khóa (`move.save_needs_preview`). Lỗi loại **cảnh báo cần lý do** không trả 422 ở đây mà nằm trong `warnings[]`.

**Phản hồi `MovePreview` → hiển thị** (mọi số lấy từ server, Desk không tự tính; thứ tự và bố cục do UXD – `s4-UXD.md` FE-S4-03…08):

| Trường | Hiển thị | Chuỗi |
|---|---|---|
| `pricingBasis` | Câu cơ sở giá ở đầu hộp. Đơn kênh `ota` + `guest_request` đổi căn → câu OTA | `move.basis.new_room_rate` / `keep_booked_rate` / `external_contract`; `move.basis.ota` |
| `roomNo`, `roomName` | Căn mới dạng nội bộ "401 · The Pine"; lễ tân báo khách **bằng tên phòng** (BR-012) | – |
| `warnings[]` có `MANUAL_RATE_REPRICED` | Cảnh báo đặt **trước** bảng số (đêm đang giá sửa tay/thỏa thuận nay tính theo giá căn mới – BR-429 (g)); kèm `nights[].suggestedRateVnd` dạng "Gợi ý {amount}" (NÊN – chỉ gợi ý, không áp; muốn giữ ưu đãi thì sửa giá đêm sau khi lưu bằng `adjustFolioLine`, S4-35) | `move.warn.MANUAL_RATE_REPRICED`, `move.suggested` |
| `nights[]` (`date`, `oldRateVnd`, `newRateVnd`) | Bảng theo đêm: ngày có thứ ("T5 12/11"), giá cũ, giá mới (số trần, cột có "(đ)"). `oldRateVnd = null` → nhãn "Đêm thêm". > 7 đêm: bảng theo đêm gói lại, bảng tổng luôn hiện (UXD FE-S4-06) | `move.col_night`, `move.col_old`, `move.col_new`, `move.night_added`, `move.nights_toggle` |
| `nights[].roomChangeDifferenceVnd` | Đơn OTA: dòng phụ dưới giá mới của đêm | `move.night_ota_diff` |
| `removedNights[]` | "Bỏ {n} đêm: {dates}" (FOC của đêm bỏ theo BR-434 (2)/(3)) | `move.removed_nights` |
| `roomTotalOldVnd` → `roomTotalNewVnd` | Dòng tiền phòng | `move.room_total` |
| `extraPersonOldVnd` → `extraPersonNewVnd` | Chỉ hiện khi một trong hai > 0 | `move.extra_person` |
| `roomChangeDifferenceVnd` | Chỉ đơn OTA: tổng chênh lệch đổi căn thu tại quầy | `move.ota_difference` |
| Σ `nights[].focVnd` | FOC/giảm giá đặc biệt **đã duyệt** đi theo = min(số đã duyệt, giá mới) (BR-434) – hiện số âm khi > 0 | `move.foc_follow` |
| `losDiscountPct` / `returningGuestDiscountPct` | Chỉ một trong hai > 0 (không cộng dồn) | `move.discount_los` / `move.discount_returning` |
| `folioDeltaVnd` | Dòng tổng **có dấu**: > 0 "Khách trả thêm +…", < 0 "Khách được giảm −…", = 0 "Không đổi tiền" | `move.delta_up` / `move.delta_down` / `move.delta_zero` |
| Σ `nights[].pendingFocVnd` | Ngay dưới dòng chênh: FOC **chờ duyệt** – nếu được duyệt sẽ trừ thêm, **không** nằm trong `folioDeltaVnd` | `move.pending_foc` |
| `depositPaidVnd` | Cọc đã thu – giữ nguyên, không thu thêm cọc (BR-429 (e)) | `move.deposit_paid` |
| `balanceDueAfterVnd` | Còn phải thu khi nhận phòng (BR-305); 0 khi dư – phần thừa theo BR-522 | `move.balance_after` |
| `warnings[]` có `CAPACITY_EXCEEDED_WARNING` / `VISA_EXPIRES_BEFORE_DEPARTURE` | Hiện ô lý do tương ứng (`capacityWarningAckReason` / `visaWarningAckReason`, 3–500 ký tự); nút Lưu khóa tới khi nhập | `booking.capacity_warning`; chuỗi cảnh báo thị thực hiện có |

#### 9.3.4 Ô "Đã báo khách số tiền mới" và nút Lưu
| Quy tắc | Chi tiết |
|---|---|
| Khi nào có ô | `reasonCode = guest_request` **và** có đổi căn **và** `externalContract = false` (gồm đơn OTA). Lý do khác, chỉ đổi ngày, đơn dài hạn nhập tay → không có ô (vẫn hiện bản tính thử, chênh 0 với nhóm OTTIMO/Khác) |
| Mặc định | Không tick. **Tự bỏ tick** mỗi khi bản tính thử đổi (đổi đầu vào, tính lại sau 409) – số khách đã nghe phải là số đang hiện |
| Ý nghĩa ở Sprint 4 | Lễ tân xác nhận **đã báo khách** số tiền mới bằng bất kỳ cách nào (tại quầy, gọi điện, chat Zalo OA, hội thoại OTA) và khách đồng ý. Khách không có mặt → lễ tân tự nhắn tin "đơn đã đổi" kèm số mới theo kênh BR-972 và quy tắc nhắn tay đầu nhóm 12B (BR-429 (d) v0.3.6); tin TP-15 tự động từ R3. Khách không đồng ý → đóng hộp, không lưu |
| Nút "Lưu thay đổi" khóa khi (lý do đặt cạnh nút + `aria-describedby`) | (1) chưa có bản tính thử khớp đúng đầu vào đang chọn → `move.save_needs_preview`; (2) có ô "Đã báo khách" mà chưa tick → `move.save_needs_told`; (3) thiếu `note` với `other`/`force_majeure`; (4) có cảnh báo cần lý do mà chưa nhập; (5) đơn xung đột chưa chọn `overbookingResolution` |
| Thân lệnh lưu `moveReservation` | Đúng `roomId`, `arrivalDate`, `departureDate`, `mode`, `reasonCode` của bản tính thử đang hiện + `applyDifference = true` (khi có ô) + `expectedDeltaVnd = folioDeltaVnd` (Desk **luôn gửi** khi có bản tính thử – với lý do OTTIMO/Khác server bỏ qua; với `guest_request` chỉ đổi ngày server vẫn so) + `note`, lý do cảnh báo, `overbookingResolution` khi cần; header `If-Match` (phiên bản đơn) và `Idempotency-Key` (giữ nguyên khi gửi lại sau lỗi mạng) |

#### 9.3.5 Lỗi khi lưu
| Lỗi | Nguyên nhân | Desk làm |
|---|---|---|
| 409 `SURCHARGE_CHANGED` (`surchargeVnd` = `folioDeltaVnd` mới) | Giá/đơn vừa đổi giữa lúc xem trước và lúc lưu (người khác sửa giá lịch, duyệt FOC, đổi số khách) | Không lưu; bỏ tick; gọi lại `previewMoveReservation`; hiện `move.delta_changed` "Số tiền vừa đổi thành {amount}…"; lễ tân báo lại khách, tick lại rồi lưu |
| 412 `VERSION_CONFLICT` / 428 | Đơn vừa được người khác sửa / thiếu `If-Match` | Tải lại đơn, tính thử lại; giữ lựa chọn của lễ tân |
| 409 `ROOM_UNAVAILABLE` / `ROOM_BLOCKED` | Căn vừa bị đặt/khóa | Hiện `suggestions[]`, bỏ tick |
| 422 `REQUIRED` (`applyDifference` / `expectedDeltaVnd`), `AMOUNT_INVALID` | Desk gửi thiếu – lỗi lập trình | Hiện lỗi chung; QA bắt bằng ca test |
| 403 `FORBIDDEN_ACTION` | Vai không đủ cho lý do đã chọn | Hiện lỗi tại ô lý do |

#### 9.3.6 Kết quả sau khi lưu (một giao dịch – BR-429 (d)–(f), ARC S-7)
- Dòng `room`/`extra_person` **đảo rồi ghi lại** theo số của hàm tính (BR-008); đơn OTA ghi/đảo `room_change_difference` (đổi nhiều lần không cộng dồn); FOC đã duyệt đi theo = min(số đã duyệt, giá mới); FOC chờ duyệt đi theo dòng mới, khi duyệt áp min(số xin, giá mới) (BR-434); hoa hồng theo tiền phòng mới (BR-903). Lý do OTTIMO/Khác: không dòng tiền nào ghi lại.
- Cọc không đổi; còn phải thu = `balanceDueAfterVnd`; tổng mới thấp hơn số đã thu → phần thừa theo BR-522.
- `guest_request` sang căn khác → `Reservation.roomDisclosedToGuest = true` (từ đó không dùng `inventory_optimize` cho đơn này).
- Nhật ký tiền `reservation.room_change_repriced` (giá trị cũ/mới, mã lý do, người làm – BR-008); lịch sử đơn (`getReservationHistory`) có dòng B7/B8 kèm lý do; SSE `reservation.changed`; lệnh đồng bộ kênh; việc bộ đồ dùng thêm theo căn mới (BR-812 (4)).

#### 9.3.7 Ví dụ kiểm (oracle `product/tests/fixtures/br-examples.json`)
| Ca | Đầu vào | `pricingBasis` | Số xem trước = số lưu | Ô "Đã báo khách" |
|---|---|---|---|---|
| BR-429-03 | Trực tiếp 101 → 401, `guest_request`, 10–13/11, 3 × 667.000 | `new_room_rate` | 2.001.000 → **3.126.000**, chênh **+1.125.000**, cọc 600.000, còn thu **2.526.000** | Có, bắt buộc |
| BR-429-04 | 401 → 101, `guest_request`, cùng ngày | `new_room_rate` | 3.126.000 → **2.001.000**, chênh **−1.125.000**, cọc 900.000, còn thu **1.101.000** | Có |
| BR-429-05 | 7 đêm 202 → 302, 9–16/11 (5.205.000), `guest_request` | `new_room_rate`, `losDiscountPct` 10 | **6.025.000**, chênh **+820.000** | Có |
| BR-429-06 | 202 → 401, `property_fault`, 3 × 792.000 | `keep_booked_rate` | Giữ **2.376.000**, chênh **0**, không dòng nào ghi lại | Không |
| BR-429-07 | Agoda tự gán 203, 2 đêm 10–12/11, khách nhắn OTTIMO xin 401 → rồi 302 → rồi 101 (`guest_request`) | `new_room_rate` (giá OTA giữ) | `roomChangeDifferenceVnd` **500.000** (chênh +500.000) → **250.000** (đảo 500.000, ghi 250.000; chênh −250.000) → **0** (chênh −250.000) | Có |
| BR-429-09 | 101 giá thỏa thuận 600.000/đêm → 401, `guest_request` | `new_room_rate` + cảnh báo `MANUAL_RATE_REPRICED`, gợi ý **937.000**/đêm | 1.800.000 → **3.126.000**, chênh **+1.326.000**, cọc 500.000, còn thu **2.626.000** | Có |
| BR-429-10 | Dài hạn nhập tay 202 → 302, `guest_request` | `external_contract` | Chênh **0**, câu "giá theo HĐ giấy" | Không |
| BR-434-06 | Đêm 202 giá 792.000 có FOC 792.000 đã duyệt, `guest_request` → 302 (917.000) | `new_room_rate` | FOC đi theo **792.000**, khách trả **125.000** (chênh **+125.000**) | Có |
| BR-434-09 | 203, 23–26/11 kéo tới 30/11 (7 đêm, −10%), FOC 300.000 **chờ duyệt** đêm 24/11 | `keep_booked_rate` (chỉ đổi ngày) | Đêm thường **713.000**, thứ Sáu/thứ Bảy **820.000** = 5.205.000; `pendingFocVnd` 24/11 = **300.000** (không trừ vào chênh); duyệt sau → tổng **4.905.000** | Không |

Ca BR-429-03, BR-434-06, BR-434-09 bắt buộc chạy **xem trước rồi lưu**, không 409 (ARC 10.4; sprint-4-plan M2).

---

## 10. Sale: báo giá → giữ chỗ → cọc (EP11 phần R2)

### 10.1 Tính báo giá ngắn ngày – `calculateQuote` (US-080, US-082)
| Trường | Nhãn | Kiểu | BB | Kiểm tra | Lỗi |
|---|---|---|---|---|---|
| `type` | Loại | enum | B | R2 chỉ `short`; `long` → 422 (US-081 dời R3) | `NOT_IN_LIST` |
| `roomId` / `roomGroupId` | Căn / nhóm căn | uuid | B một trong hai | V-11 | `REQUIRED` |
| `arrivalDate` | Ngày đến | date | B | ≥ hôm nay; trong cửa sổ BR-112 | `DATE_IN_PAST`; `OUTSIDE_BOOKING_WINDOW` |
| `nights` | Số đêm | int | B | 1…`short_stay_max_nights`; ở tối thiểu BR-113 | `OUTSIDE_BOOKING_WINDOW`; `MIN_STAY_NOT_MET` |
| `adults`, `children6to11`, `childrenUnder6` | Số người | int | B / K / K | Sức chứa (mục 0) | `CAPACITY_EXCEEDED` |
| `channelId` | Kênh | uuid | B | `direct` hoặc `agent` | `NOT_IN_LIST` |
| `closerUserId` | Người chốt | uuid | K | Mặc định = người đang đăng nhập nếu là SAL/CTV | – |
| `returnGuestCode` | Mã khách quay lại | text | K | Khớp `return_guest_code` (BR-111); chỉ kênh `direct` | `RETURN_CODE_INVALID` **(mới)** "Mã khách quay lại không đúng." |

Kết quả tính tự động khi đổi bất kỳ trường nào (không cần bấm nút): giá từng đêm (BR-104), giảm theo số đêm (BR-107) hoặc mã quay lại – không cộng dồn, lấy mức có lợi hơn (BR-111), phụ thu người (BR-110 – AC5), tổng (khớp ví dụ BR-107 – AC1), cọc (BR-305), hoa hồng người chốt (BR-903 – chỉ OWN/MGR/SAL/CTV thấy), "OTTIMO còn lại" (không hiện cho CTV – AC2), `longStayAlternative` khi số đêm ≥ `long_stay_compare_from_nights` (AC3), `availability` + căn thay thế ≤ 6 (US-082 AC1). Từ ngưỡng bắt buộc BR-108: báo "Từ {n} đêm là thuê dài hạn – báo giá dài hạn có ở bản sau; tạm thời nhờ lễ tân tạo đơn dài hạn nhập tay" `[R2 – R-C]`.

### 10.2 Lưu báo giá – `saveQuote` (Q1, US-083)
Như 10.1 + `guestId` (B, bộ chọn khách; SAL/CTV chỉ khách của mình) + `leadId` (K). Kết quả: mã `BG-`, `active`, `expiresAt` = **00:00:00 ngày (ngày lập + `quote_validity_days` + 1)**, giờ VN, tính theo **ngày lịch** – không dùng mốc 06:00 của BR-010 (DOM D-2). `now ≥ expiresAt` → báo giá hết hiệu lực. Văn bản gửi khách ghi "Hiệu lực đến 23:59 {dd/mm}" (= ngày lập + `quote_validity_days`). Biên: báo giá lập 15/10 (kể cả lập lúc 01:30 ngày 15/10) → 23:59:59 ngày 18/10 còn hiệu lực, 00:00:00 ngày 19/10 hết hạn (ví dụ BR-304); snapshot giá và tham số (BR-006), lead → `quoted` (SM-09). Báo giá **không** khóa phòng.

### 10.3 Văn bản gửi khách – `getQuoteText` (US-083 AC2)
`locale` (B): `vi` / `en` / `ru`. Văn bản gồm căn, ngày, số đêm, giá, tổng, cọc, hạn hiệu lực, cách chuyển cọc; **không** có hoa hồng, "OTTIMO còn lại", SĐT/email khách. Nút "Sao chép gửi Zalo" sao chép văn bản; báo "Đã sao chép".

### 10.4 Tạo giữ chỗ từ báo giá – `createHoldFromQuote` (B1 + Q2, US-084)
| Trường | Nhãn | Kiểu | BB | Kiểm tra | Lỗi |
|---|---|---|---|---|---|
| `holdHours` | Giữ trong | enum từ `hold_hours_options` (BR-302) | B (mặc định `hold_hours_default`) | V-11 | `NOT_IN_LIST` |
| `depositMethod` | Cách nhận cọc | enum `vietqr` / `bank_transfer` / `cash` (R2; `vnpay`, `momo` ẩn đến R3) | K (mặc định `vietqr`) | V-11 | – |

Điều kiện server: báo giá `active` (hết hạn → 409 `QUOTE_EXPIRED`, US-083 AC3); ngày đến ≠ hôm nay (→ 422 `HOLD_NOT_ALLOWED_TODAY`, AC2 – hướng sang tạo đơn đã thu, mục 3, chỉ FD+); khách có SĐT (→ 422 `PHONE_REQUIRED`, AC3); căn trống, không OOO (409 `ROOM_UNAVAILABLE`/`ROOM_BLOCKED`); sức chứa.

Kết quả (AC1, AC4): đơn `hold` (viền đứt), hạn = min(thời điểm tạo + `holdHours`, `hold_latest_time_on_arrival` ngày đến) – khớp ví dụ BR-302; căn bị chặn bán + đồng bộ; báo giá → `converted`; lead → `holding`; hiện số tiền cọc (BR-305) và VietQR/nội dung chuyển khoản = mã đơn (US-120). Nút tạo: `booking.create_hold` (`{time}` = hạn).

**Gia hạn báo giá đã hết hạn – `extendQuote`** (Q4, A51; ARC A-18, OpenAPI 0.3.5):
- Trường `reason`: bắt buộc với SAL/CTV (V-08), không bắt buộc với MGR+.
- MGR/OWN → 200: báo giá trở lại `active`, hạn mới tính theo cách trên kể từ ngày gia hạn (BR-304), giá giữ snapshot.
- SAL/CTV (chỉ báo giá của mình) → **202** + yêu cầu duyệt `quote_extension` (SM-10). Hiện chuỗi **(mới)** `quote.extend_requested` "Đã gửi quản lý duyệt gia hạn báo giá {code}."
- Báo giá không ở trạng thái `expired` → 409 `INVALID_TRANSITION` + `currentState`.
- FD/FDL: không có nút (A51).

### 10.5 Gia hạn và hết hạn giữ chỗ (US-085)
- `extendHold` (B3): `extraHours` (B, int 1…`hold_extension_max_hours`); hạn mới ≤ trần BR-302; chỉ 1 lần (`extendedCount = 0`), trước hạn. Lỗi: lần 2 → 409 `INVALID_TRANSITION` với chuỗi `field_error.hold_extended_once` **(mới)** "Giữ chỗ chỉ gia hạn được 1 lần."; quá hạn → 409 `HOLD_EXPIRED`.
- Nhắc trước hạn `hold_expiry_reminder_hours` (BR-303): thông báo người tạo + "Cần chú ý" `hold_expiring` có thời gian còn lại (AC2).
- Job J1 (SYS, B6): đến hạn, không có giao dịch cọc `succeeded` → `cancelled` lý do `hold_expired`, mở phòng, đồng bộ, lead → `quoted`, báo người tạo (AC1). Có giao dịch `succeeded` trước hạn → không hủy dù job chạy trễ; tiền về sau khi đã hủy → "Cần chú ý" `deposit_after_cancel` cho FD/SAL (AC4). Màn chi tiết đơn đã tự hủy: `drawer.hold.expired`.

### 10.6 Xác nhận cọc – `confirmDeposit` (B4, US-086 AC1, AC2, AC4, AC5)
| Trường | Kiểu | BB | Kiểm tra | Lỗi |
|---|---|---|---|---|
| `payment.type` | enum | B | = `deposit` | – |
| `payment.method` | enum | B | `vietqr`, `bank_transfer`, `cash`, `card_pos` | `NOT_IN_LIST` |
| `payment.amountVnd` | money | B | > 0 | `AMOUNT_NOT_POSITIVE` |
| `payment.receivedAt` | instant | K (mặc định bây giờ) | ≤ bây giờ; ≥ lúc tạo giữ chỗ | `DATE_INVALID` |
| `payment.posAuthCode` | text | ĐK (`card_pos`) | ≤ 12 ký tự chữ/số; **không** nhập số thẻ (V-09) | `CARD_NUMBER_DETECTED` |
| `payment.note` | text | K | ≤ 300, V-09 | – |
| `existingPaymentId` | uuid | K (thay cho `payment`) | Giao dịch `succeeded` của chính đơn, chưa gắn đơn khác | `NOT_IN_LIST` |

- Tổng giao dịch cọc ≥ mức BR-305 → `confirmed`, bỏ hạn giữ chỗ, lead → `won`, hoa hồng → `projected`, việc bộ đồ dùng thêm nếu `extraCount > 0` (BR-812) – AC1.
- **Cọc thiếu** (ARC A-13, OpenAPI 0.3.5): giao dịch **vẫn được ghi** và server trả **200** + `Reservation` (`status = hold`, `depositPaidVnd`). Server không trả 4xx sau khi đã ghi tiền, để lễ tân không bấm lại và ghi tiền hai lần. Giao diện hiện **(mới)** `booking.deposit_partial` "Đã ghi nhận {paid}, còn thiếu {missing}." (`{missing}` = mức cọc BR-305 − `depositPaidVnd`) – AC2. `422 DEPOSIT_INSUFFICIENT` (kèm `depositRequiredVnd`, `depositPaidVnd`, `shortfallVnd`) chỉ còn dùng khi bấm xác nhận mà **không** có giao dịch mới nào được ghi.
- **Giữ chỗ có cọc một phần tới hạn** (DOM D-9, BR-303 v0.3.2):
  - Job J1 **không tự hủy** (đã có tiền của khách), nhưng cũng không giữ vô hạn.
  - Khi tới hạn: thông báo đỏ một lần cho sale phụ trách + FD/FDL; đơn mang cờ "Giữ chỗ quá hạn – cọc thiếu" **(mới)** `drawer.hold.overdue_partial`.
  - Phải xử lý trước trần `hold_latest_time_on_arrival` của ngày đến (BR-302), bằng **một trong ba** cách:
    1. Thu đủ → B4.
    2. MGR+ chấp nhận cọc thiếu, ghi lý do (V-08) → `confirmed`. Đề nghị ARC thêm tham số, gợi ý `acceptShortfallReason` cho `confirmDeposit`, chỉ MGR+.
    3. Hủy B5, **hoàn 100 %** phần đã nhận (đơn chưa xác nhận – BR-308 không tính phí).
  - Quá trần mà chưa xử lý → báo MGR, vẫn **không** tự hủy.
  - Mục "Cần chú ý" đầy đủ làm ở Sprint 4 (dùng lại cờ này).
- Chuyển khoản ghi tay (FD, SAL) → giao dịch `reconciliation = pending` ("chờ đối soát", US-119 AC6, SM-12).
- Nhật ký tiền: số tiền, cách thanh toán, người xác nhận (AC5, BR-008).
- CTV không có nút (AC4) → "Báo đã chuyển cọc" (`createDepositNotice`): `amountVnd` (B, > 0), `attachmentId` (K – ảnh biên nhận JPEG/PNG/WebP, ≤ 10 MB, tải qua `uploadAttachment`), `note` (K, ≤ 500, V-09) → 202; FD và SAL phụ trách nhận thông báo, xác nhận bằng B4.

### 10.7 Phạm vi CTV (US-087)
CTV chỉ thấy báo giá, đơn, lead, khách do mình tạo/được gán/là người chốt (AC1); gọi API mục của người khác → 404 (AC2); thấy hoa hồng **dự kiến** của mình trên chi tiết báo giá/đơn của mình, không có màn "Hoa hồng của tôi" (R3); không thấy bất kỳ trường giấy tờ nào (AC3, D03–D07 = K).

### 10.8 Lead – `createLead`, `changeLeadStage` (SM-09)
`createLead`: `guestId` (B), `need` (K, ≤ 500, V-09), `source` (K, danh mục như `directSource`). Chuyển tay: `new ↔ quoted`, `* → lost` (`lostReasonCode` B – danh mục BR-308, `note` ĐK khi `other`), `lost → new`. `holding`/`won` chỉ hệ thống đặt; chuyển tay sai → 409 `INVALID_TRANSITION`.

---

## 11. No-show (US-136) – `markNoShow` (B11), `restoreNoShow` (B12)

### 11.1 Nhắc gọi (AC1)
Đơn `confirmed`, đến hôm nay, chưa nhận phòng, không có `etaTime`, qua `no_show_call_time` (BR-311) → FD nhận nhắc `noshow.reminder`, "Cần chú ý" `no_show_call`.

### 11.2 Đánh dấu không đến
| Trường | Nhãn | Kiểu | BB | Kiểm tra | Lỗi |
|---|---|---|---|---|---|
| `contactAttemptNote` | Kết quả liên lạc (`noshow.contact_note`) | text | B | V-08 (3–500), V-09 | `REASON_REQUIRED` |

**Thao tác một bước** (ARC A-04): ô kết quả liên lạc nằm ngay trong hộp xác nhận và được lưu cùng giao dịch (`reservation.no_show_contact_note` + nhật ký trạng thái).
- Nút "Không đến" chỉ hiện theo `allowedActions` (server tính giờ); client **không** tự khóa theo giờ máy.
- Trước mốc, giao diện hiện "Mở lúc {time}" lấy từ `Reservation.noShowAvailableFrom` (`noshow.locked`, AC3).
- Nút "Xác nhận" trong hộp chỉ bật khi ô kết quả liên lạc có ≥ 3 ký tự.
- Thứ tự kiểm ở server: body → `If-Match` → trạng thái + giờ.
  - Thiếu hoặc quá ngắn `contactAttemptNote` → **422** `errors[{field: contactAttemptNote, code: REASON_REQUIRED}]` (kể cả khi chưa tới giờ).
  - Đủ ghi chú nhưng chưa tới `no_show_mark_time` (BR-311) → **409 `INVALID_TRANSITION`** + `currentState` + `availableFrom`.
  - `If-Match` lệch → 412. Hệ thống **không bao giờ** tự đánh dấu. Hộp xác nhận EP00 mục 9. Kết quả (AC2): `no_show`; đơn trực tiếp giữ cọc (doanh thu khác – BR-904); mở bán các đêm còn lại + đồng bộ; khai báo → `void`; hoa hồng → `void`; việc bộ đồ dùng thêm chưa làm → hủy; đơn OTA → việc "Báo no-show trên kênh".

### 11.3 Khôi phục
| Trường | Kiểu | BB | Kiểm tra |
|---|---|---|---|
| `reason` | text | B | V-08 |

FD/FDL đủ 3 điều kiện BR-315 → 200, đơn `confirmed`, đóng lại phòng, khai báo `void → none` (dùng lại bản ghi, K12), ảnh đã xóa không khôi phục, MGR nhận thông báo, hiện trong đóng ca (AC4). Thiếu điều kiện hoặc đơn OTA đã báo kênh → **202** + yêu cầu duyệt `no_show_restore` → chuỗi `noshow.restore_request_sent` (AC5). Đơn kênh OTA → **luôn** đi đường duyệt MGR+, vì R2 chưa lưu được "đã báo no-show lên kênh" (DOM D-3 c).

MGR+ tự làm, hoặc khi yêu cầu được duyệt → 200:
- Căn cũ đã bán lại / phải đổi căn (DOM D-3 b, OpenAPI 0.3.5): MGR+ gửi thêm `roomId` (căn trống khác; trùng → 409 + `suggestions[]`) **hoặc** `allowUnassigned = true` → đơn về `confirmed` ở **làn chưa gán căn** (`conflictState = open`, sự cố nguồn `no_show_restore`), rồi gán căn bằng `moveReservation` (`reasonCode = overbooking`). Thực hiện từ yêu cầu duyệt đã `approved` **không bao giờ** trả 409 – căn không còn thì tự vào làn chưa gán.

| Trường thêm | Kiểu | BB | Kiểm tra | Lỗi |
|---|---|---|---|---|
| `roomId` | uuid | K (MGR+) | Căn trống cả khoảng còn lại, đủ sức chứa | 409 `ROOM_UNAVAILABLE` + `suggestions[]`; FD/FDL gửi → 403 |
| `allowUnassigned` | bool | K (MGR+, mặc định false) | Không gửi cùng `roomId` `[GIẢ ĐỊNH BA]` | FD/FDL gửi → 403 |
- Khôi phục sau ngày nghiệp vụ: các đêm đã qua **vẫn tính tiền** theo giá snapshot (BR-311 "đêm vẫn tính"); muốn miễn thì đi FOC BR-434 (D-3 a).
- Đơn đã khôi phục **không** tính là no-show trong chỉ số (D-3 d).

---

## 12. Khóa phòng OOO (US-019) – `createRoomBlock` (O1), `updateRoomBlock` (O3), `transitionRoomBlock` (O4, O5)

| Trường | Nhãn | Kiểu | BB | Kiểm tra | Lỗi |
|---|---|---|---|---|---|
| `roomId` | Căn | uuid | B | V-11; căn không có đơn `in_house` trong khoảng khóa (đổi phòng trước – BR-804/424) | 409 **`ROOM_OCCUPIED`** + `conflicts[]` (đơn đang ở) – ARC A-03 |
| `startDate` | Khóa từ | date | B | ≥ hôm nay; = hôm nay → `active`, tương lai → `planned` | `DATE_IN_PAST` |
| — | Dự kiến sửa xong (ngày cuối còn khóa) | date | B | ≥ `startDate` | `DATE_ORDER` |
| `endDatePlanned` | Mở bán lại từ | date | B (tính sẵn) | = ngày xong + `ooo_reopen_buffer_days` (BR-804), sửa được, > `startDate`; hiển thị cả hai ngày | `DATE_ORDER` |
| `reason` | Lý do | text | B | 3–500, V-09 | `REASON_REQUIRED` |
| `workOrderId` | Phiếu sửa | uuid | ĐK: bắt buộc khi khóa ngay từ sự cố | V-11 | `REQUIRED` |
| `affectedReservationsAcknowledged` | Quản lý đã biết các đơn bị trùng | bool | K | **Chỉ ghi lại người xác nhận** (MGR+); **không** vượt được chống trùng (ARC A-03, BR-906). Khoảng khóa trùng đơn `hold`/`confirmed` **luôn** trả 409 dù gửi `true` – phải dời/hủy các đơn trùng trước (B7/B10), rồi mới tạo khối | 409 `ROOM_UNAVAILABLE` + `conflicts[]` (`OccupancyConflict`); mọi xung đột đều là khối OOO khác (`kind=ooo`) → 409 `ROOM_BLOCKED` |

Thứ tự lỗi ở server (ARC A-03): `ROOM_NOT_SELLABLE` → `ROOM_OCCUPIED` → `ROOM_BLOCKED` (khi mọi xung đột là OOO) → `ROOM_UNAVAILABLE`.

Mở khóa trước hạn (O4): ngày mở bán lại = **ngày nghiệp vụ hiện tại**, tức căn bán được từ đêm nay (DOM D-4). Hộp xác nhận hiện chuỗi **(mới)** `ooo.release_confirm` "Mở bán từ đêm nay ({dd/mm}). Nhớ báo buồng phòng dọn và kiểm căn trước giờ nhận phòng." (FB-R2-DOM-BE-10).

Kết quả: rack hiện thanh "Khóa phòng" (AC2); tạo đơn/giữ chỗ/báo giá căn đó trong các đêm khóa → 409 `ROOM_BLOCKED` "Phòng đang khóa" (`error.ROOM_BLOCKED`) – AC1; đêm khả dụng trừ đêm khóa (BR-904); đồng bộ kênh. Hủy khối `planned` (O5): hộp xác nhận (EP00 mục 9). Mở khóa không qua phiếu (O4): MGR+, lý do bắt buộc.

---

## 13. Truy vết story → mục

| Story / AC | Mục |
|---|---|
| US-016 AC1–AC4 | 1 |
| US-017 AC9 | 3.2 `closerUserId` |
| US-017 AC1–AC4, AC6–AC8 | 3; AC5 → 3.2 (`LONG_STAY_REQUIRES_CONTRACT`); **AC5a** → 4; AC7 → 3.3 |
| US-018 AC1–AC5 | 3.5, 6 |
| US-019 AC1–AC2 | 1.2, 3.4, 12 |
| US-020 AC1–AC4 | 5 |
| US-021 AC1–AC6 | 7 |
| US-022 AC1–AC4 | 8 (năm sinh trẻ em bắt buộc – S4-45), 5.4 |
| US-023 AC1–AC2 | EP00 8.2; 3.4 |
| US-024 AC1–AC4 | 9.1, 9.2 |
| US-024 AC5–AC7 (ESC-019 A, S4-21) | 9.1 (`applyDifference`, `expectedDeltaVnd`), **9.3** (xem trước, 3 nhóm lý do, ô "Đã báo khách", ví dụ BR-429-03…10, BR-434-06/09) |
| US-136 AC1–AC5 | 11 |
| US-139 AC1–AC3 | 1.3, 6 |
| US-080 AC1–AC5 | 10.1 |
| US-082 AC1–AC2 | 2, 10.1 |
| US-083 AC1–AC3 | 10.2–10.4 |
| US-084 AC1–AC4 | 10.4 |
| US-085 AC1–AC4 | 10.5 |
| US-086 AC1, AC2, AC4, AC5 | 10.6 |
| US-087 AC1–AC3 | 5.3, 10.7 |
| ESC-014 / BR-110, BR-812 | 0, 3.2, 3.3, 5.4, 6.3, 8, 9, 10.6; `business-processes.md` P07 |

## 14. Đề nghị cho vai khác

| # | Gửi | Nội dung |
|---|---|---|
| E02-01 | ARC | `ReservationCreate.directSource` (enum mục 3.2) – US-017 AC8 chưa có trường "Nguồn" |
| E02-02 | ARC | `ReservationCreate.rateOverrideReason` (OTA ngoài sàn–trần, US-017 AC3) và mã trường `RATE_OUT_OF_RANGE_WARNING` để client hiện cảnh báo thay vì lỗi |
| E02-03 | ARC | Mã lỗi còn thiếu trong bảng `Problem.code`/`FieldError.code`: `MIN_STAY_NOT_MET` (BR-113), `OTA_REF_DUPLICATE`, `PARTY_DUPLICATE` (409), `ROOM_NOT_READY` (B14, 409), `ALLOW_UNASSIGNED_OTA_ONLY`, `LONG_STAY_REQUIRES_CONTRACT` và `MANUAL_LONG_STAY_BELOW_THRESHOLD` (đã có trong mô tả, chưa có trong bảng) |
| E02-04 | ARC | `cancelReservation`: thêm `otaPenaltyVnd` cho đơn OTA (BR-310) |
| E02-05 | ARC | `HkTaskType` thêm `extra_guest_kit_prepare`, `extra_guest_kit_collect`, `extra_guest_kit_transfer` (BR-812); `HkTask` có `dueAt`, `quantity`; sinh/hủy trong cùng giao dịch với chuyển trạng thái đơn |
| E02-06 | ARC + PO + DOM | Q-01 (mục 4): đơn dài hạn nhập tay cho khách **đang ở** (`alreadyInHouse`) |
| E02-07 | DOM | **Đã trả lời** (s2-DOM D-1, D-5, D-7) – đã áp vào mục 0, 3.2, 9.1 (Sprint 2, bước phản hồi) |
| E02-08 | UXD | Chuỗi **(mới)** ở tài liệu này; nhãn lý do `ota_cancelled`; nhãn "Nâng hạng – cần lễ tân trưởng xác nhận"; dòng "Có {n} người ngủ sofa – buồng phòng chuẩn bị bộ đồ dùng thêm" trên form đặt phòng và chi tiết đơn |
| E02-09 | ARC | (S4-45) `PartyMemberCreate.childBirthYear`, `childName`: ghi vào mô tả "bắt buộc khi `role = child`; gửi kèm `role = companion` → 422 `NOT_ALLOWED`" và khoảng 2000…năm của ngày nghiệp vụ – chỉ đổi mô tả, không đổi `required`, không gãy client |
| E02-10 | DOM | (9.3.4) Đổi **ngày** theo lý do `guest_request` (giữ căn) làm tiền đổi (BR-107 tính lại, đêm thêm giá hiện hành) – có bắt buộc tick "Đã báo khách số tiền mới" như BR-414 không? Hiện server chỉ đòi khi **đổi căn** (BR-429 (d)); Desk vẫn hiện bản tính thử và gửi `expectedDeltaVnd`. Nếu DOM chọn bắt buộc → ARC đổi điều kiện `applyDifference`, BE-A sửa một dòng, FE-A bật ô cho trường hợp này |
| E02-11 | UXD | (9.3.2) Câu gợi ý dưới nhóm "Khách xin đổi": "Muốn tặng phần chênh cho khách? Lưu với lý do Khách yêu cầu, rồi gửi giảm giá đặc biệt để duyệt." (khóa đề nghị `move.gift_hint`); (8) `party.child_birth_year_required` |

## 15. Lịch sử thay đổi
| Ngày | Round | Thay đổi | Người |
|---|---|---|---|
| 16/10/2026 | 2 (Đợt 0) | Bản đầu: đặc tả mức trường EP02, EP11 phần R2, US-139, US-017 AC5a; áp ESC-014 (sức chứa = định mức + 1, trẻ < 6 không tính) và BR-812 (việc bộ đồ dùng thêm tự sinh); Q-01 đơn dài hạn đang ở | BA |
| 16/10/2026 | 2 (Sprint 2 – PO quyết) | Mục 3.2 `closerUserId` bắt buộc theo US-017 AC9; đồng bộ tên OpenAPI 0.3.5: `MoveReasonCode`, `CAPACITY_EXCEEDED_WARNING` + `capacityWarningAckReason`, `Reservation.capacityConflict`, `restoreNoShow` `roomId`/`allowUnassigned` | BA |
| 17/10/2026 | 2 (Sprint 4 – S4-21, S4-04, S4-45) | v0.2: **mục 9.3 mới** – xem trước tiền khi đổi căn/đổi ngày đơn chưa nhận phòng theo ESC-019 A (BR-429 (a)–(h) v0.3.6; OpenAPI 0.3.7 `previewMoveReservation`, `MovePreview`; xem trước = lệnh ghi một hàm tính – ARC 10.4): 3 nhóm lý do "Khách xin đổi / OTTIMO đổi / Khác" (`move.group_*`), bảng trường phản hồi → chuỗi `move.*` đã duyệt, ô "Đã báo khách số tiền mới" (điều kiện đúng như server: `guest_request` + đổi căn + không phải dài hạn nhập tay), nút Lưu và lý do khóa, xử lý 409 `SURCHARGE_CHANGED`, kết quả sau lưu, bảng ví dụ BR-429-03…10, BR-434-06, BR-434-09; mục 9.1 thêm `applyDifference`, `expectedDeltaVnd`, `mode`, lý do cảnh báo, ràng buộc 0.3.7 (`inventory_optimize` khi đã báo căn, `other` sang căn đắt hơn); **mục 8 (S4-45)**: `childBirthYear` bắt buộc khi `role = child` (khớp server), giới hạn năm theo ngày nghiệp vụ, lỗi `REQUIRED`/`VALUE_OUT_OF_RANGE`/`NOT_ALLOWED`, Desk đánh dấu bắt buộc; mục 14 thêm E02-09…E02-11 | BA |
