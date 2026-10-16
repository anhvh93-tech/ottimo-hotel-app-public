# Đặc tả mức trường – EP03 Nhận phòng · EP04 Lưu trú · EP05 Trả phòng & bill · EP15 Thu tiền (phần R2)

- Tác giả: BA | Round 2 – Sprint 1 (đi trước Sprint 3 một sprint) | Ngày: 16/10/2026 | Phiên bản: 0.2 (Sprint 3 khởi động: BR v0.3.3, DOM s2-DOM mục G, OpenAPI 0.3.5)
- Phạm vi (Must R2 theo R-C): EP03 – US-025, 026, 027 · EP04 – US-028, 029, 030, 031, 032 · EP05 – US-035, 036, 037, 038, 039 · EP15 – US-119 (trừ AC5), US-120 · phần folio/duyệt của US-007 (dòng FOC, giảm giá đặc biệt) dùng trong các luồng trên. **Bổ sung Sprint 3** (DOM s2-DOM mục G, BR **v0.3.3**): chi hoàn tiền (2.6), US-022 người đi cùng (4.7) và B14 đổi phòng khi đang ở (4.5) – hai phần dời từ Sprint 2.
- Ngoài phạm vi / dời: US-119 AC5 ghi thu theo kỳ HĐ **[Dời R3 – R-C]**; mã cửa trong app (US-128, phần mã cửa của US-025 AC3/AC5, US-029 AC4, US-038 AC1) **[Dời R3 – R-C]** – R2 lễ tân giao mã như hiện nay, app chỉ ghi số thẻ đã phát (mục 1.6); US-033 kiểm minibar giữa kỳ, US-137 trả sớm (Should R2 – chỉ ghi ràng buộc ở mục 4.6, làm nếu dư); US-034 nhắc trả phòng tự động, US-040 in/gửi bill, US-041 trả phòng dài hạn, US-124 đóng ca (R3).
- Nguồn và quy ước: như `specs/EP00-platform.md` mục 0 (bảng trường, V-01…V-11, hiển thị lỗi, lỗi chung, hộp xác nhận mục 9, xác nhận lại mục 0.5). Thứ tự ưu tiên khi lệch: `business-rules.md` **v0.3.3** → backlog (AC) → `state-machines.md` v0.2.2 → `rbac-matrix.md` v0.2.1 → `api/openapi.yaml` **0.3.2-draft** → `design/copy/strings-vi.json`. Tài liệu này chỉ ghi phần riêng; không chép con số nghiệp vụ (ghi mã BR/tham số).
- Đọc cùng: `specs/EP02-reservations.md` (mục 0 sức chứa + BR-812, mục 5.4 sửa số người, mục 9.2 đổi phòng B14), `specs/EP06-registration.md` (giấy tờ, đối chiếu, khai báo – bước 1–3 của nhận phòng).
- Quyết định INV áp dụng: ESC-006 (hoàn, trả sớm), ESC-007 (ân hạn trả muộn, bậc phụ thu, hạn mức FOC, tự miễn minibar), ESC-008 (giá gồm VAT, doanh nghiệp), ESC-010 (VietQR, tài khoản thử ở R2), **ESC-014** (người ngủ sofa + bộ đồ dùng thêm – BR-812).

---

## 0. Khái niệm dùng chung

| Khái niệm | Định nghĩa (nguồn) |
|---|---|
| Ngày nghiệp vụ, "hôm nay" | BR-010 – mọi điều kiện "hôm nay = ngày đến/ngày đi" dùng ngày nghiệp vụ; **hạn khai báo** dùng giờ đồng hồ thật (BR-602/603) |
| Giờ chuẩn | `checkin_time`, `checkout_time` (BR-401) – ô giờ trong mọi form mặc định giờ chuẩn, **không** mặc định giờ hiện tại (BR-414) |
| Giá đêm cơ sở phụ thu | Đơn Trực tiếp/CTV: giá đêm đầu (nhận sớm) / đêm cuối (trả muộn) của đơn (BR-411/412); đơn OTA: giá kênh Trực tiếp hiện hành của đêm đó (BR-415); đơn dài hạn (gồm đơn AC5a nhập tay): `monthlyRentVnd` ÷ 30 (BR-102, BR-413) |
| Còn phải thu (`balanceDueVnd`) | Σ dòng `posted` (gồm dòng FOC âm `posted`) − Σ giao dịch `succeeded` chưa `reversed` − phần OTA thu hộ (`paidViaOtaVnd`, BR-307). Server tính (view `v_folio_balance`), client **không** tự cộng |
| Người vượt định mức (`extraGuestCount`) | `Reservation.extraGuestCount` = max(0, người lớn + trẻ 6–11 − `Room.baseOccupancy`) (BR-110, ESC-014) |
| Dòng chờ duyệt | `FolioLine.lineState = pending_approval` – không vào tổng phải thu cho tới khi `approved` (SM-10 A3) |

### 0.1 BR-812 trong nhận/lưu trú/trả phòng (áp ESC-014)
| Thời điểm | Hành vi (server làm, giao diện hiện) | Nguồn |
|---|---|---|
| Mở form nhận phòng, đơn có `extraGuestCount > 0` | Dòng thông tin "Có {n} người ngủ sofa" + trạng thái việc `extra_guest_kit_prepare` (chưa làm / đã chuẩn bị). Việc **chưa xong** → cảnh báo vàng `checkin.kit_not_ready` **(mới)** "Bộ đồ dùng thêm cho căn {room} chưa chuẩn bị. Vẫn nhận phòng được – việc đã được đẩy lên đầu hàng đợi buồng phòng." **Không chặn** B9 | BR-812 (5), SM-14 |
| Bấm Nhận phòng khi việc chưa xong | Server nâng ưu tiên việc lên đầu hàng đợi (cùng giao dịch B9); thông báo HK của ca | BR-812 (5) |
| Khách đến nhiều người hơn đơn (thêm người tại quầy hoặc giữa kỳ) | Sửa số người qua `updateReservation` (EP02 mục 5.4): kiểm sức chứa; phụ thu người đề xuất, lễ tân xác nhận số tiền (BR-414); `extraGuestCount` tăng → việc chuẩn bị hạn `extra_guest_kit_midstay_due_minutes` | BR-110, BR-812 (2) |
| Giảm người khi đang ở | Việc chuẩn bị chưa làm → hủy; đã chuẩn bị → việc `extra_guest_kit_collect` ở lần dọn kế tiếp | BR-812 (4) |
| Gia hạn (B13), trả muộn (B15) | Bộ ở lại; khăn thay theo lịch dọn, mền theo lịch thay ga (BR-807). Trả muộn → dòng thu hồi trong việc dọn trả phòng ghi "sau {giờ trả}" | BR-812 (6) |
| Đổi phòng (B14) | Việc `extra_guest_kit_transfer` sang căn mới; nếu căn mới có định mức đủ cho mọi người (`extraGuestCount` mới = 0) → việc thu hồi ở căn cũ thay vì chuyển | BR-812 (4), EP02 9.2 |
| Hoàn tác nhận phòng (B17) | Không đổi việc bộ đồ dùng (đơn về `confirmed`, bộ vẫn cần) | BR-812 (1) |
| Hoàn tất trả phòng (B18) | Việc `checkout_clean` của căn có dòng "Thu hồi bộ đồ dùng thêm × {n}" (mền, khăn → giặt; bàn chải, đồ vệ sinh đã mở → bỏ). Việc chuẩn bị còn `open` (chưa từng chuẩn bị) → `cancelled` | BR-812 (4)(6) |
| Folio, bill | **Không** có dòng tiền riêng cho bộ đồ dùng (đã gồm trong phụ thu người `extra_person`) – mọi kênh, kể cả OTA | BR-812 (3), BR-110 |
| Mền/khăn bộ thêm bị mất/hỏng khi trả phòng | Ghi như hư hỏng (`damage`) theo bảng BR-512, ảnh bằng chứng bắt buộc (mục 3.2) | BR-512 |

---

## 1. Nhận phòng – S06 (US-025, US-026, US-027) – `previewCheckIn`, `checkIn` (B9), `undoCheckIn` (B17)

### 1.1 Quyền và thiết bị
FD+ (A11, S06 = ✔ Q). Chỉ trên **thiết bị được cấp** mở admin-web (rbac 8.7) vì bước giấy tờ là C3; PWA/thiết bị chưa cấp → nút "Nhận phòng" ẩn, gọi API → 403 `DEVICE_NOT_TRUSTED` (EP00 10.4). Người trực đêm (vai FD) làm đầy đủ như ca ngày (US-142 AC3). HK/MT/SAL/CTV/GST ✖.

### 1.2 Các bước trên màn (trình tự hiển thị – UXD quyết bố cục)
Theo chuỗi `checkin.step.*`: (1) **Giấy tờ** → (2) **Kiểm tra** (đối chiếu) → (3) **Khai báo** → (4) **Giao mã & hoàn tất**. Bước 1–3 đặc tả ở `EP06-registration.md` mục 2–5; tài liệu này đặc tả bước 4 và điều kiện. Bước 3 **không bắt buộc** trước B9 (khai báo được làm sau, trong hạn – `reg.later`). Thu tiền (mục 2) mở được ở mọi bước.

### 1.3 Điều kiện nhận phòng – `previewCheckIn` (gọi khi mở màn và mỗi lần đổi giờ nhận)
| `conditions[].code` | Chuỗi | Điều kiện (BR-402, SM-01 B9) | Khi chưa đạt |
|---|---|---|---|
| `not_unassigned` | `checkin.cond.not_unassigned` | `conflictState ≠ open` | Chặn mọi vai → gán căn trước (EP02 6.3); API 409 `RESERVATION_UNASSIGNED` |
| `capacity_within_max` (OpenAPI 0.3.5) | **(mới)** `checkin.cond.capacity` "Số khách không vượt sức chứa căn" | `Reservation.capacityConflict = false` (DOM D-1) | Chặn mọi vai, **không** ai bỏ qua được → đổi căn đủ chỗ (B7), tách căn hoặc sửa số người ≤ `max` (EP02 mục 0); API 409 `CHECKIN_CONDITIONS_NOT_MET` có `capacity_within_max` trong `unmet[]`. **Trong dòng điều kiện có nút "Sửa số khách thực tế"** **(mới)** `checkin.fix_guest_count` (DOM G-6): hộp nhỏ ô `adults`/`children6to11`/`childrenUnder6` → `updateReservation` (`If-Match`, EP02 5.4) → xong tự gọi lại `previewCheckIn`; không phải thoát màn nhận phòng |
| `room_ready` | `checkin.cond.room_ready` | Buồng `VI`/`VC` | FD: `checkin.room_not_ready` + nút "Gửi lễ tân trưởng xác nhận" (A12 = D); FDL+: `checkin.room_not_ready_lead` + ô lý do. Buồng `OOO` → chặn tuyệt đối, không có ngoại lệ |
| `balance_paid` | `checkin.cond.balance_paid` | Đơn `direct`/`agent`/`ota_pay_at_property`: `balanceDueVnd` = 0 tính trên tiền phòng + phụ thu người + phụ thu nhận sớm đã xác nhận (BR-305 phần còn lại); đơn `ota_prepaid`: đạt | Nút "Thu tiền" (mục 2) ngay trong dòng điều kiện: **thu ngay tại bước này, không có nút "bỏ qua"** (DOM G-7) – kể cả đơn không cọc thu khi đến (BR-527) và đơn MGR+ đã chấp nhận cọc thiếu (D-9): khách trả tại quầy rồi mới nhận phòng; công nợ chỉ khi trả phòng (BR-525) |
| `main_guest_document` | `checkin.cond.main_guest_document` | Khai báo ≥ `partial` **và** có giấy tờ của người đứng tên (`isMain = true`) | Chặn; mở bước Giấy tờ |
| `document_check_block` **(đề nghị ARC – E03-01)** | `checkin.cond.document_ok` **(mới)** "Giấy tờ khách nước ngoài hợp lệ tại ngày nhận" | `Registration.blocksDoorCode = false` (BR-613 c: hộ chiếu/thị thực đã hết hạn tại ngày nhận, hoặc thiếu dấu/chứng nhận nhập cảnh) | FD: chặn, "Gửi lễ tân trưởng"; FDL+: xác nhận nhận tiếp với lý do + cách xử lý (`documentBlockOverride`), MGR nhận thông báo |

`warnings[]` **(đề nghị ARC – E03-01)** – không chặn, hiện vàng: `extra_guest_kit_not_ready` (mục 0.1), `visa_expires_before_departure` (BR-613 a – khai đến hạn thị thực), `passport_expires_during_stay` (BR-613 b), `pending_online_checkin` ("Khách đã gửi giấy tờ trước qua app – đối chiếu với bản gốc", `checkin.docs.from_app`).

R2 **không** có mã cửa trong app: BR-613 (c) "chặn giao mã cửa" và BR-402 (3) "giấy tờ người đứng tên trước khi giao mã cửa" được thực hiện bằng **chặn B9** (khách chưa được nhận phòng thì lễ tân chưa giao mã/thẻ) (DOM G-3 đồng ý; R3 khi có US-128 chuyển về chặn cấp mã như BR-613 nguyên văn).

### 1.4 Bảng trường – bước "Giao mã & hoàn tất" (`checkIn`, `If-Match` + `Idempotency-Key`)
| Trường | Nhãn | Kiểu | BB | Kiểm tra | Lỗi |
|---|---|---|---|---|---|
| `checkinTime` | Giờ nhận thực tế (`checkin.time` **(mới)**) | time | K | Mặc định = `checkin_time` (BR-401/414) – **không** điền giờ hiện tại; `HH:mm`; đổi giờ → gọi lại `previewCheckIn?checkinTime=`. Là **giờ khách thực sự vào căn**, không phải giờ tới quầy hay gửi hành lý: khách gửi hành lý lúc 09:00, vào căn 14:00 → nhập 14:00, không có phụ thu (DOM G-8). Nhắc dưới ô **(mới)** `checkin.time_hint` "Giờ khách vào căn – gửi hành lý không tính phụ thu." | `DATE_INVALID` |
| — | Phụ thu nhận sớm (đề xuất) | money (chỉ đọc) | – | Từ `earlyCheckinSurcharge` (BR-411 bậc giờ; cơ sở theo mục 0; dài hạn BR-413). Giờ ≥ `checkin_time` → 0, không hiện dòng | – |
| `applyEarlySurcharge` | "Ghi phụ thu {amount} vào phiếu" | bool | ĐK: hiện khi phụ thu > 0 | Mặc định **false**; lễ tân tích = xác nhận đúng số tiền đang hiển thị (US-026 AC2). Server tính lại ở thời điểm ghi; lệch với số client gửi trong `expectedSurchargeVnd` **(đề nghị ARC – E03-02)** → 409 `INVALID_TRANSITION` để tải lại preview | – |
| `requestFocForSurcharge` | "Đề nghị miễn phụ thu (FOC)" | `FocRequestInput` | K | Chỉ khi `applyEarlySurcharge = true`; trường như EP00 7.1 (`kind = foc`, `amountVnd` ≤ phụ thu, `reasonCode`, `note`); **không có ô chọn người duyệt** (BR-432) | như EP00 7.1 |
| `roomNotReadyOverride.reason` | Lý do nhận khi buồng chưa sẵn sàng | text | ĐK: `room_ready` chưa đạt | V-08; FDL+ → ghi ngay (B9, buồng → `OD`, việc dọn ưu tiên R7); FD → tạo yêu cầu `checkin_room_not_ready` (202 – đề nghị ARC E03-03) | `REASON_REQUIRED` |
| `documentBlockOverride.reason` **(E03-01)** | Lý do và cách xử lý giấy tờ | text | ĐK: `document_check_block` chưa đạt | V-08; chỉ FDL+; FD gửi → 403 `FORBIDDEN_ACTION` | `REASON_REQUIRED` |
| `cardsIssued` (OpenAPI 0.3.3) | Số thẻ phòng đã phát | int | B | 0…2 **mỗi căn** (BR-403/511 v0.3.3 – 1 chính + 1 dự phòng, không theo đầu người; DOM G-1). Đơn nhóm nhiều căn: mỗi căn 0…2. Khóa OTTIMO dùng mã (TTLock) – thẻ là dự phòng, 0 là hợp lệ. Dùng để đề xuất phí thiếu thẻ khi trả phòng = (đã phát − đã trả) × phí BR-511 | `VALUE_OUT_OF_RANGE` |
| `houseRulesSent` **(E03-04)** | "Đã gửi/giao nội quy VI/EN" | bool | B, phải `true` | Điều kiện để thu phí phạt sau này (BR-511) | `REQUIRED` |
| `doorAccessHandedOver` | "Đã giao mã cửa/thẻ cho khách" **(mới)** `checkin.door_handed_over` | bool | **K** (mặc định false – US-025 AC7, PO quyết 16/10) | Tick → ghi `Reservation.doorAccessHandedOverAt` + người tick; app **không** lưu, không hiện mã cửa (US-128 dời R3). Không tick vẫn hoàn tất nhận phòng. **Tick bổ sung sau** từ chi tiết đơn `in_house` (khách đến muộn, lễ tân giao thẻ sau): nút "Đã giao mã/thẻ" trên S04 – đường API do ARC chọn (đề nghị **E03-06**: `updateReservation` nhận `doorAccessHandedOver: true`, FD+, `If-Match`; chỉ đặt một lần, không bỏ tick) | – |

### 1.5 Nhận sớm trước mốc đổi ngày – B9a (US-026 AC3, BR-417)
- Xảy ra khi ngày nghiệp vụ hiện tại = ngày đến − 1 (khách tới 00:00–05:59 **của chính ngày đến**). `previewCheckIn` trả `earlyCheckinSurcharge.addsPreviousNight = true` và giá đêm thêm (đơn Trực tiếp/CTV: giá đêm của đơn, ngày đặc biệt lấy giá ngày đó; OTA: giá Trực tiếp hiện hành).
- Giao diện thay dòng phụ thu bằng hộp `checkin.prior_night` **(mới)** "Khách nhận trước 06:00 – thêm đêm {date}: {amount}. Đây là tiền phòng, không phải phụ thu." + nút "Thêm đêm và nhận phòng".
- Trường gửi kèm `checkIn` **(đề nghị ARC – E03-05)**: `addPriorNight: true`, `priorNightRateVnd` (money, B, trong sàn–trần BR-105 → `RATE_OUT_OF_RANGE`). Căn không trống đêm trước hoặc có OOO → 409 `ROOM_UNAVAILABLE` + chuỗi `checkin.prior_night_unavailable` **(mới)** "Căn {room} có khách đêm {date}. Gợi ý khách gửi hành lý hoặc đổi sang căn trống." (gợi ý `suggestions[]`).
- Hệ quả: Trực tiếp/CTV thêm 1 đêm đầu đơn; OTA tạo đơn con kênh Trực tiếp `in_house` cùng folio (BR-422). Đêm thêm là đêm bán (BR-904). Miễn tiền đêm này = "giảm giá đặc biệt" (BR-433 ví dụ), không phải FOC phụ thu → `requestFoc` `kind = special_discount` trên dòng `room`.

### 1.6 Thứ tự kiểm ở server và kết quả B9
Thứ tự: thiết bị (`DEVICE_NOT_TRUSTED`) → quyền → `If-Match` → trạng thái `confirmed` + ngày nghiệp vụ = ngày đến (hoặc B9a) (`INVALID_TRANSITION`) → `conflictState` (`RESERVATION_UNASSIGNED`) → điều kiện BR-402 + BR-613 c (`409 CHECKIN_CONDITIONS_NOT_MET` kèm `unmet[]` → `error.CHECKIN_CONDITIONS_NOT_MET` với `{unmet}` = danh sách nhãn `checkin.cond.*`) → dữ liệu trường (422).

Thành công (US-025 AC1, AC4, AC6): đơn `in_house`; `actualCheckinAt` = **thời điểm bấm** (giờ đồng hồ thật, kể cả 01:30 ngày hôm sau – AC6); `checkinTime` chỉ dùng tính phụ thu; buồng `OC` (hoặc `OD` qua ngoại lệ); dòng `early_checkin` nếu đã tích; yêu cầu FOC nếu có; hạn khai báo bắt đầu tính từ `actualCheckinAt` (BR-602/603 – `EP06` mục 6) → nếu khai báo < `sent`: hiện `reg.deadline` + đơn vào "Cần chú ý"; bộ đồ dùng thêm theo mục 0.1. B9a (trước 06:00) cũng tính hạn theo `actualCheckinAt` (BR-417 (4)): khách VN đến 04:40 ngày 20/10 → hạn 23:00 20/10 (BR-602); khách NN → 16:40 20/10 (+12 giờ, BR-603) – ca QA (DOM G-9, E05-08). Thông báo `checkin.done` **(mới)** "Đã nhận phòng căn {room}. Hạn khai báo: {deadline}." Lỗi 412 `VERSION_CONFLICT` (EP00 0.2).

### 1.7 Hoàn tác nhận phòng – `undoCheckIn` (B17, US-025 AC5)
MGR+ (A13); FD/FDL không thấy nút. Điều kiện: cùng ngày nghiệp vụ với lúc nhận; chưa có dòng folio nào `postedAt` sau `actualCheckinAt` (kể cả dòng phụ thu nhận sớm → phải đảo dòng đó trước). `reason` (B, V-08). Không đạt → 409 `INVALID_TRANSITION`. Hệ quả: đơn `confirmed`, buồng về trạng thái trước nhận, hạn khai báo bỏ tính (khai báo giữ nguyên trạng thái), nhật ký lý do. Hộp xác nhận EP00 mục 9 – chuỗi **(mới)** "Hoàn tác nhận phòng căn {room}? Đơn về 'Đã xác nhận', buồng về '{status}'."

### 1.8 Khách dài hạn nhận sớm (US-027)
Áp cho đơn `stayType = long` (R2: đơn AC5a nhập tay – `manualLongStay.monthlyRentVnd`). Cơ sở = `monthlyRentVnd` ÷ 30 làm tròn BR-005 (giá đêm quy đổi – BR-102). **Sửa theo BR-413 v0.3.3 / ESC-007 A dòng 2 (DOM G-2)** – bản 0.1 ghi ngược:

| Giờ khách vào căn (ngày đầu) | Căn **trống đêm trước** (không có khách trả phòng cùng ngày) | Căn **có** khách trả phòng cùng ngày |
|---|---|---|
| Trước 06:00 | Thêm đêm trước theo BR-417, giá = giá đêm quy đổi (mục 1.5) | Thêm đêm trước **không** được (căn có khách đêm trước – BR-417 (1)) |
| 06:00 – trước `checkin_time` | **Miễn phí – 0 đ** (`earlyCheckinSurcharge.waivedBy = BR-413`) | Bậc BR-411 trên giá đêm quy đổi |
| ≥ `checkin_time` | 0 đ | 0 đ |

"Căn trống đêm trước" do server xét lúc nhận phòng: không có đơn `in_house`/`checked_out` nào chiếm căn đó với ngày đi = ngày đến của đơn dài hạn. Mốc miễn 15:00 của BR-413 chỉ dành cho **trả muộn** ngày cuối (mục 4.2). `earlyCheckinSurcharge.ruleRef = BR-413`. Kiểm số (US-027 AC1, ví dụ BR-413): thuê 11.130.000 → 371.000/đêm; nhận 08:00, căn trống đêm trước → **0 đ**; căn có khách trả 12:00 cùng ngày → 50 % × 371.000 = 185.500 → **186.000** (BR-005).

---

## 2. Thu tiền và VietQR (US-119 trừ AC5, US-120) – `recordPayment`, `createVietQr`, `reconcilePayment`, `reversePayment`

### 2.1 Quyền
| Hành động | Vai | rbac |
|---|---|---|
| Ghi thu (`recordPayment`) | FD+; SAL chỉ `type = deposit` của đơn mình (`own_deposit_only`); CTV ✖ (US-119 AC4) | A33 |
| Tạo VietQR | FD+; SAL đơn của mình | A39 |
| Đối soát chuyển khoản/VietQR với sao kê (`reconciled`/`disputed`) | MGR+; **không** đối soát giao dịch do chính mình ghi, trừ OWN | A46 |
| Xác nhận **đã nhận tiền mặt** sale/CTV nộp quầy (mục 2.4) | FD+; **không** xác nhận khoản do chính mình ghi | A46a (PO 16/10) |
| Đảo giao dịch (sửa ghi sai) | MGR+ | A34 |
| Nhập nơi nhận hoàn (mục 2.6.1, thiết bị được cấp) | FD+ | A43 |
| Duyệt hoàn | MGR+ (không tự duyệt ngoài hạn mức BR-433) | rbac 5.1 |
| Xem đủ tài khoản nhận + chi hoàn **chuyển khoản / cùng phương thức gốc** | MGR+ | A47 |
| Chi hoàn **tiền mặt tại quầy** (đã duyệt) | FD+; **không** chi khoản hoàn do chính mình tạo yêu cầu | A47a (PO 16/10) |

### 2.2 Ghi thu – `recordPayment` (`Idempotency-Key`)
| Trường | Nhãn | Kiểu | BB | Kiểm tra | Lỗi |
|---|---|---|---|---|---|
| `type` | Loại thu | enum | B | R2: `deposit` (cọc), `charge` (thu tiền phòng/phát sinh). `security_deposit`, `deposit_deduction` (dài hạn) **ẩn ở R2**; `refund` **không** ghi ở đây – chỉ qua chi hoàn (mục 2.6, BR-522) | `NOT_IN_LIST` |
| `method` | Cách thanh toán (`pay.method`) | enum | B | R2 hiện: `vietqr` (`pay.vietqr`), `bank_transfer` ("Chuyển khoản", **(mới)**), `cash` (`pay.cash`), `card_pos` (thẻ qua máy POS – sửa nhãn `pay.card` **(UXD)** thành "Thẻ (máy POS tại quầy)"), `ota_collect` (`pay.ota` – chỉ đơn kênh `ota`). `vnpay`, `momo` ẩn đến R3 | `NOT_IN_LIST` |
| `amountVnd` | Số tiền | money | B | V-07, > 0. Có thể > còn phải thu (khách trả dư) → cảnh báo "Thu dư {x} – ghi chú cách xử lý" và `note` bắt buộc (DOM G-15 đồng ý); số dư âm còn lại khi trả phòng xử lý ở 5.5 `credit_balance` / 2.6 | `AMOUNT_NOT_POSITIVE`; `REASON_REQUIRED` |
| `receivedAt` | Thời điểm nhận | instant | K (mặc định bây giờ) | ≤ bây giờ; ≥ thời điểm tạo đơn; nhập bù quá khứ > 24 giờ cần `note` (P12) | `DATE_INVALID` |
| `posAuthCode` | Mã chuẩn chi POS | text | ĐK: `card_pos` | 1–12 ký tự chữ/số; **không** nhập số thẻ (V-09 trên ô này: dãy 13–19 số hợp Luhn → `CARD_NUMBER_DETECTED`) | `REQUIRED`; `CARD_NUMBER_DETECTED` |
| `note` | Ghi chú (mã giao dịch ngân hàng, tên người chuyển) | text | ĐK: chuyển khoản ghi tay khuyến nghị; thu dư; nhập bù | ≤ 300, V-09 | `CARD_NUMBER_DETECTED` |
| `attachmentId` **(đề nghị ARC – E05-01)** | Ảnh biên nhận chuyển khoản | uuid | K | `uploadAttachment purpose=deposit_receipt` (JPEG/PNG/WebP ≤ 10 MB) – BR-527 "kèm ảnh/mã giao dịch" | `FILE_REJECTED` |

Hệ quả (AC1, AC6): giao dịch `succeeded`, mã `PT-` (BR-007); `vietqr`/`bank_transfer` ghi tay → `reconciliation = pending` (chip `pay.pending_reconcile` **(mới)** "Chờ đối soát"); `cash`, `card_pos`, `ota_collect` → `not_required`. "Còn phải thu" cập nhật ngay (server). Ở R2 chưa có ca (US-124 R3) → `shiftId = null` với tiền mặt `[GIẢ ĐỊNH BA theo erd 4.6 "R2 nếu PO giữ đóng ca"]`. Nhật ký tiền BR-008 (người, thời điểm, số tiền, cách).

Đơn OTA thu hộ (`ota_prepaid`, AC2): tiền phòng không vào "còn phải thu" (`paidViaOtaVnd`); không có nút ghi thu tiền phòng; chỉ thu phát sinh.

### 2.3 VietQR – `createVietQr` (US-120)
| Trường | Kiểu | BB | Kiểm tra | Lỗi |
|---|---|---|---|---|
| `amountVnd` | money | B | Mặc định = còn phải thu (hoặc cọc còn thiếu khi `hold`); > 0; ≤ còn phải thu (DOM G-4 – chặn để tránh khách chuyển nhầm số), **trừ** khi FD+ chọn "Thu trước dịch vụ/ký quỹ" và ghi lý do (`overBalanceReason` **(đề nghị ARC E15-03)**, V-08) | `AMOUNT_NOT_POSITIVE`; `AMOUNT_EXCEEDS_BALANCE` (OpenAPI 0.3.3) |
| `purpose` | enum | B | `deposit` (đơn `hold`/cọc), `balance` (còn lại); `billing_period` ẩn (R3) | `NOT_IN_LIST` |

- Nội dung chuyển khoản (`transferContent`): **mã đơn bỏ dấu gạch** (`OTM00171`) khi folio `open`; **số bill bỏ dấu gạch** (`F26000123`) khi folio `settled` (thu phát sinh sau trả phòng) – BR-521, US-120 AC1. Client hiện QR + dòng `pay.qr_note` + nút `rsv.copy_qr`.
- Kết quả: giao dịch `pending` có `expiresAt`. Tạo QR mới cho cùng folio → QR `pending` cũ của folio → `expired` `[GIẢ ĐỊNH BA]`; QR `pending` hết hạn cuối ngày nghiệp vụ `[GIẢ ĐỊNH BA – ARC chốt cùng E05-02]`.
- Xác nhận đã thấy tiền: lễ tân bấm `pay.record` "Ghi nhận đã thu {amount}" → giao dịch `pending → succeeded` với `reconciliation = pending` (SM-12; R2 chưa có báo tiền về tự động). Hợp đồng **chưa có** thao tác này → đề nghị ARC E05-02. Trước khi bấm, giao diện nhắc `pay.error_not_received`.
- Chưa cấu hình tài khoản nhận (AC2): 409 `PAYMENT_NOT_CONFIGURED` → `error.PAYMENT_NOT_CONFIGURED`; **không** vẽ QR giả; OWN/MGR thấy thêm "Chưa cấu hình tài khoản nhận" ở Tham số. Tài khoản cá nhân (`payment_receiving_account.owner_type = individual`) → OWN thấy cảnh báo (BR-521) – không chặn thu.

### 2.4 Đối soát chuyển khoản – US-119 AC6, BR-527
**Danh sách chờ đối soát** (MGR+; FD/FDL xem giao dịch do mình ghi): hợp đồng chưa có endpoint liệt kê giao dịch → **đề nghị ARC E05-03** `listPayments` với bộ lọc:

| Tham số | Kiểu | BB | Kiểm tra |
|---|---|---|---|
| `reconciliation` | enum `pending`/`reconciled`/`disputed` | K (mặc định `pending`) | V-11 |
| `receivedFrom`, `receivedTo` | date (ngày nghiệp vụ) | K | V-05; khoảng ≤ 92 ngày (như nhật ký – EP00 G-6) |
| `recordedBy` | uuid | K | V-11 (người dùng của cơ sở) |
| `method` | enum | K | `vietqr`/`bank_transfer` |

Cột: mã `PT-`, mã đơn, số tiền, cách, người ghi, thời điểm nhận, ghi chú/ảnh, số ngày chờ. Giao dịch chờ > `bank_reconcile_alert_days` → "Cần chú ý" (BR-527).

**Đối soát – `reconcilePayment`** (`If-Match`): `result` (B) `reconciled` / `disputed`; `note` (ĐK: bắt buộc khi `disputed`, V-08, ≤ 300). Người đối soát = người ghi và không phải OWN → 403 `SELF_RECONCILE_FORBIDDEN` **(đề nghị ARC E05-03)** → `error.SELF_RECONCILE_FORBIDDEN` **(mới)** "Giao dịch do bạn ghi cần người khác đối soát." Giao dịch không còn `pending` → 409 `INVALID_TRANSITION`.
**Tiền mặt sale/CTV nộp quầy – xác nhận đã nhận** (A46a; BR-527 v0.3.3 / ESC-017 A; PO 16/10). Khoản thu `cash` do SAL/CTV ghi (`recordedByRole ∈ {sales_staff, collaborator}`) luôn `reconciliation = pending` cho tới khi tiền tới quầy:
| Trường | Kiểu | BB | Kiểm tra | Lỗi |
|---|---|---|---|---|
| (giao dịch) | path `paymentId` | B | `method = cash`, `status = succeeded`, `recordedByRole` SAL/CTV, `reconciliation = pending`; `If-Match` | 409 `INVALID_TRANSITION` (+ `currentState`); 412 `VERSION_CONFLICT` |
| `receivedVnd` | money | B | **Phải bằng** số đã ghi – lễ tân đếm tiền thực nhận | 422 `AMOUNT_INVALID` → **(mới)** "Số tiền nhận khác số sale/CTV đã ghi ({amount}). Báo quản lý." |
| `note` | text | K | ≤ 300, V-09 | `CARD_NUMBER_DETECTED` |

`confirmCashHandover` (FD+, A46a – OpenAPI 0.3.6). Người xác nhận = người đã ghi → 403 `SELF_RECONCILE_FORBIDDEN` (không ngoại lệ, kể cả OWN). Thành công → `reconciled` (`reconciledByName`), tiền vào ca đang mở của người xác nhận (R3 khi bật đóng ca – `409 SHIFT_NOT_OPEN`), hoa hồng của người ghi "đạt" (BR-527). **Nhận thiếu tiền**: không xác nhận được – báo MGR, MGR+ ghi `disputed` bằng `reconcilePayment` (A46) rồi xử lý (đảo giao dịch, thu lại). Danh sách cho FD: `listPayments?method=cash&recordedByRole=sales_staff,collaborator&reconciliation=pending` (A-40); nút **(mới)** `pay.confirm_cash_handover` "Đã nhận tiền mặt".

- `disputed` (không thấy tiền trên sao kê): cảnh báo đỏ OWN + MGR; hộp đối soát gợi ý bước tiếp "Đảo giao dịch" (`reversePayment`) – khi đảo, folio trở lại còn phải thu (BR-527, SM-12). Không tự đảo.

### 2.5 Đảo giao dịch – `reversePayment` (US-119 AC3)
MGR+ (A34). `reason` (B, V-08). Tạo giao dịch đảo trỏ giao dịch gốc (`reversalOfId`), gốc → `reversed`; không xóa. Giao dịch đã `reversed` → 409 `INVALID_TRANSITION`. Folio `settled` vẫn đảo được (bút toán, BR-008) – hệ quả "còn phải thu" > 0 trên folio đã khóa → "Cần chú ý" cho MGR `[GIẢ ĐỊNH BA]`. **Không** dùng đảo giao dịch để trả tiền lại cho khách – dùng chi hoàn (2.6).

### 2.6 Hoàn tiền: yêu cầu → nơi nhận → duyệt → chi hoàn (G-14; BR-522; SM-10, SM-12; rbac A43, A47, D15; OpenAPI **0.3.6-draft** A-33/A-34)

Một khoản hoàn đi **bốn bước, tách người**:
1. Sinh **yêu cầu hoàn** `ApprovalRequest.type = refund` (A43).
2. FD+ nhập **nơi nhận** (`setRefundDestination`).
3. MGR/OWN **duyệt** (SM-10; rbac 5.1).
4. **Chi hoàn** và ghi giao dịch, tách theo phương thức (PO 16/10):
   - **tiền mặt tại quầy** → **FD+** (A47a), người chi ≠ người tạo yêu cầu;
   - **chuyển khoản / cùng phương thức gốc** → MGR/OWN (A47; cần số tài khoản đầy đủ D15).

Đảo giao dịch (2.5) chỉ để sửa **ghi sai**, **không** dùng để trả tiền lại cho khách. `recordPayment` gửi `type = refund` → 422 `NOT_IN_LIST`.

**Nguồn sinh yêu cầu hoàn** (server sinh trong cùng giao dịch với nghiệp vụ gốc):

| Nguồn | Sinh khi | Số tiền |
|---|---|---|
| Hủy đơn có cọc (B10, EP02 mục 7) | `cancellation.refundableVnd > 0` | `refundableVnd` (BR-309) |
| Hủy giữ chỗ có cọc một phần (B5, EP02 10.6 – D-9) | Đơn chưa xác nhận | 100 % phần đã nhận |
| Trả sớm (B16, mục 4.6) | Đêm bỏ có phần hoàn | BR-428 |
| Dời khách ra ngoài (`resolveOverbookingExternal`) | Đơn đã thu | Phần đã thu của các đêm không ở |
| Trả thừa khi trả phòng (mục 5.5, `overpaymentHandling.mode = refund_request` – G-15) | `creditVnd > 0` | `creditVnd` |

Thu dư **giữa kỳ ở** (2.2): nút **(mới)** `refund.request_overpayment` "Đề nghị hoàn {creditVnd}" trên folio `open` có `creditVnd > 0` → `createRefundRequest` (FD+, A43; OpenAPI 0.3.6 – đáp ứng E15-01): `amountVnd` (B, > 0, ≤ `creditVnd` − các yêu cầu hoàn đang chờ/đã duyệt chưa chi → 422 `REFUND_EXCEEDS_APPROVED`), `reason` (B, 3–500, V-09); có thể gửi kèm nơi nhận (2.6.1). Không thì xử lý lúc trả phòng (5.5).

#### 2.6.1 Nơi nhận hoàn – `setRefundDestination` (FD+, A43; thiết bị được cấp; `Idempotency-Key`)
| Trường | Nhãn | Kiểu | BB | Kiểm tra | Lỗi |
|---|---|---|---|---|---|
| `method` | Cách hoàn **(mới)** `refund.method` | enum `original_method` "Cùng cách khách đã trả" · `cash` "Tiền mặt" · `bank_transfer` "Chuyển khoản" | B | BR-522 "hoàn qua cùng phương thức hoặc chuyển khoản"; tiền thu qua cổng (`vnpay`, `momo` – R3) chỉ `original_method`. Khách trả bằng thẻ POS → `original_method` = hoàn qua máy POS | `NOT_IN_LIST` |
| `bankBin` | Ngân hàng nhận | text (chọn danh sách NAPAS, 6 số) | ĐK: `bank_transfer` | `^[0-9]{6}$` | `REQUIRED` |
| `accountNo` | Số tài khoản (**C3 – D15**, chỉ ghi) | text | ĐK: `bank_transfer` | 6–19 chữ số sau bỏ khoảng trắng; dãy hợp Luhn → `CARD_NUMBER_DETECTED` (không nhận số thẻ); lưu mã hóa DEK riêng; FD chỉ thấy **dạng che** sau khi lưu | `REQUIRED`; `CARD_NUMBER_DETECTED` |
| `accountHolder` | Tên chủ tài khoản | text | ĐK: `bank_transfer` | ≤ 70; khác tên khách đứng tên → **cảnh báo** **(mới)** "Tên chủ tài khoản khác tên khách – xác nhận với khách" (không chặn) | `TOO_LONG` |

- Áp dụng: chỉ yêu cầu `refund` chưa thực hiện; khác → 409 `INVALID_TRANSITION`.
- Đổi nơi nhận **sau khi đã duyệt** → yêu cầu về `pending`, phải duyệt lại (SEC F8, SM-12).
- Nhật ký: ghi `c3_access_log` (`refund_account`).
- Phản hồi: `ApprovalRequest.refundDestination` dạng che.

#### 2.6.2 Duyệt – `approveRequest` / `rejectRequest` (EP00 mục 7)
- Ai duyệt: MGR/OWN. Người duyệt ≠ người tạo, trừ khi trong hạn mức BR-433 (rbac 5.3).
- Xem đủ số tài khoản: `getRefundDestination` (MGR/OWN, A47) – cần thiết bị được cấp + xác nhận lại mật khẩu (SR-C3-09); mỗi lần xem ghi nhật ký C3.
- Từ chối: phải có lý do; nghiệp vụ gốc giữ nguyên (đơn đã hủy vẫn hủy; tiền còn trên folio dưới dạng `creditVnd`).
- Hộp duyệt hiện số tiền, nguồn, cách hoàn, tài khoản dạng che.

#### 2.6.3 Chi hoàn – tiền mặt: FD+ (A47a) · chuyển khoản/phương thức gốc: MGR/OWN (A47) – tiền mặt: `executeCashRefund` (A47a; `attachmentId` `purpose=refund_proof` bắt buộc) · chuyển khoản/phương thức gốc: `executeRefund` (A47) – OpenAPI 0.3.6; `Idempotency-Key`
| Trường | Nhãn | Kiểu | BB | Kiểm tra | Lỗi |
|---|---|---|---|---|---|
| (yêu cầu) | – | path `approvalId` | B | `type = refund`, `approved`, đã có nơi nhận; người chi ≠ người tạo yêu cầu (CHECK DB) – với tiền mặt áp cả cho FD/FDL. **Nơi nhận `cash`** → FD+ (A47a), không cần thiết bị được cấp, không thấy D15. **Nơi nhận `bank_transfer`/`original_method`** → chỉ MGR/OWN (A47); FD/FDL gọi → 403 `FORBIDDEN_ACTION` | 409 `INVALID_TRANSITION`; 409 `REFUND_DESTINATION_REQUIRED` → **(mới)** "Chưa có nơi nhận hoàn (hoặc vừa đổi) – nhập/duyệt lại." |
| `amountVnd` | Số tiền chi lần này | money | B | > 0; ≤ số duyệt − đã chi (`refundedVnd`) **và** ≤ đã thu − đã hoàn của folio. Được chi nhiều lần (một phần tiền mặt, phần còn lại chuyển khoản – mỗi lần theo nơi nhận hiện hành) | 422 `REFUND_EXCEEDS_APPROVED` → **(mới)** "Còn được hoàn tối đa {max}." |
| `paidAt` | Thời điểm chi | instant | B | ≤ bây giờ; ≥ lúc duyệt | `DATE_INVALID` |
| `bankReference` | Mã giao dịch ngân hàng / mã hoàn POS | text | ĐK: nơi nhận `bank_transfer` hoặc hoàn qua POS `[GIẢ ĐỊNH BA – hợp đồng để không bắt buộc]` | ≤ 64, `[A-Za-z0-9-/._]` | `REQUIRED` |
| `attachmentId` | Ảnh chứng từ (ủy nhiệm chi / biên nhận có chữ ký khách) | uuid | ĐK: **B** với `bank_transfer` `[GIẢ ĐỊNH BA – BR-522 "có chứng từ"]`; **B với `cash`** – ảnh biên nhận có chữ ký khách (PO 16/10: "chữ ký/ảnh biên nhận khách") | `uploadAttachment` (0.3.6 dùng `purpose=deposit_receipt`; ảnh UNC có thể chứa số tài khoản → đề nghị **E15-02** purpose riêng `refund_proof`, đọc như D15) | `EVIDENCE_REQUIRED` |
| `note` | Ghi chú | text | K | ≤ 300, V-09 | `CARD_NUMBER_DETECTED` |

Kết quả:
- Ghi giao dịch `type = refund`, `succeeded`, mã `PT-`, gắn `approvalRequestId`. `creditVnd` của folio giảm về 0 khi chi đủ.
- Đối soát: `bank_transfer` → `reconciliation = pending`, đối soát bởi người **khác** người chi (A46, trừ OWN). `cash` → `not_required`, ghi vào **đóng ca** của người chi (BR-526; R2 chưa có ca → `shiftId = null`, hiện trong danh sách chi tiền mặt trong ngày cho MGR xem).
- Chi đủ → hủy DEK tài khoản trong cùng giao dịch (T09).
- Folio `settled` vẫn nhận (không đổi bill đã phát hành).
- Nhật ký tiền BR-008.
- Thông báo cho người tạo yêu cầu: `refund_ready` khi đã duyệt (A-36).

Lỗi: FD/FDL chi chuyển khoản → 403 `FORBIDDEN_ACTION`; tự chi khoản hoàn do mình tạo yêu cầu → 403 `SELF_APPROVAL_FORBIDDEN` (OpenAPI 0.3.6) → "Khoản hoàn do bạn tạo cần người khác chi."; yêu cầu đã chi đủ → 409 `INVALID_TRANSITION`. Khi quản lý vắng, khoản hoàn chuyển khoản chờ quản lý: màn hiện **(mới)** `refund.transfer_waits_manager` "Hoàn chuyển khoản do quản lý thực hiện – báo khách thời hạn."

**Đã quyết (PO 16/10 – Q-S3-1)**: tiền mặt tại quầy FD+ (A47a), chuyển khoản MGR/OWN (A47); MGR/OWN vẫn là người **duyệt**.

---

## 3. Folio và dòng phát sinh (US-032, US-007 phần folio) – `getFolio`, `getChargeCatalog`, `addFolioLine`, `adjustFolioLine`, `requestFoc`

### 3.1 Xem folio – `getFolio`
Vai: FD+ đầy đủ; SAL đơn của mình; CTV chỉ `totals.roomVnd` + `depositHeldVnd` (rbac ghi chú 4 – các trường khác vắng mặt, giao diện ẩn hẳn). HK/MT ✖. Khối: dòng (theo `serviceDate`, nhóm `revenueGroup`), dòng chờ duyệt (`approval.status.pending`), giao dịch (chip đối soát), tổng: tiền phòng, khác, FOC, tổng, đã thu, OTA thu hộ, còn phải thu.

### 3.2 Thêm dòng phát sinh – `addFolioLine` (A30; US-032 AC1–AC4)
| Trường | Nhãn | Kiểu | BB | Kiểm tra | Lỗi |
|---|---|---|---|---|---|
| `chargeCode` | Khoản (danh mục) | text (chọn) | ĐK: bắt buộc trừ dòng `fnb`/`service_fee`/`damage` ngoài bảng | V-11 với `getChargeCatalog` (giặt ủi BR-507, dọn lẻ BR-506, khử mùi thuốc lá + thiếu thẻ BR-511, hư hỏng theo bảng BR-512) | `NOT_IN_LIST` |
| `category` | Loại | enum | ĐK: khi không có `chargeCode` | Chỉ `fnb`, `service_fee`, `damage` (ngoài bảng) cho FD; các loại khác do hệ thống/luồng riêng sinh (`room`, `early_checkin`, `late_checkout`, `extra_person`, `minibar`, `foc`, `discount`, `adjustment`…) | `NOT_IN_LIST` |
| `description` | Mô tả | text | ĐK: khi không có `chargeCode` | 3–200, V-09 | `REQUIRED`; `TOO_LONG` |
| `quantity` | Số lượng | number | B | > 0; số lẻ 1 chữ số thập phân chỉ với khoản tính theo kg (giặt ủi) `[GIẢ ĐỊNH BA]`; còn lại số nguyên | `VALUE_OUT_OF_RANGE` |
| `unitPriceVnd` | Đơn giá | money | ĐK | Mặc định từ danh mục. Khoản **phí phạt, hư hỏng theo bảng, dọn lẻ, giặt ủi** – FD **không** sửa (giá theo tham số BR); khoản `fnb`/`service_fee` – nhập, > 0. Hợp đồng chưa có cờ sửa được → đề nghị ARC E04-03 `ChargeCatalogItem.priceEditable` + mã trường `PRICE_NOT_EDITABLE` | `AMOUNT_NOT_POSITIVE`; `PRICE_NOT_EDITABLE` **(mới)** |
| `proposedUnitPriceVnd` **(E04-03)** | Giá đề xuất (hư hỏng ngoài bảng) | money | ĐK: `category = damage` không `chargeCode` | > 0 → dòng `pending_approval` + yêu cầu `damage_pricing` cho MGR+ (US-032 AC4, BR-512) | `AMOUNT_NOT_POSITIVE` |
| `serviceDate` | Ngày dùng dịch vụ | date | K (mặc định hôm nay) | Trong [ngày đến, ngày đi] | `DATE_INVALID` |
| `note` | Ghi chú bằng chứng | text | ĐK (xem dưới) | ≤ 500, V-09 | `CARD_NUMBER_DETECTED` |
| `evidenceAttachmentIds` | Ảnh bằng chứng | uuid[] | ĐK: khoản có `evidenceRequired = true` (phí phạt, hư hỏng) | ≥ 1 ảnh (`uploadAttachment purpose=penalty_evidence`) **hoặc** `note` ≥ 3 ký tự mô tả bằng chứng (US-032 AC2 "ảnh/ghi chú") | `EVIDENCE_REQUIRED` **(đề nghị ARC E04-03)** → `field_error.evidence_required` **(mới)** "Thêm ảnh hoặc ghi chú bằng chứng cho khoản phạt/hư hỏng." |

Kết quả: dòng `posted` (hoặc `pending_approval`), `postedBy`, nhật ký tiền (US-006); "còn phải thu" cập nhật ở chi tiết đơn (AC3; app khách R3). Folio `settled` → 409 `FOLIO_LOCKED`, **trừ** trong `post_checkout_window_until` (BR-427 c – phát sinh sau trả phòng, FD+ được ghi, dòng gắn nhãn "phát sinh sau trả phòng" **(mới)**). Dòng phí phạt (khử mùi, thiếu thẻ) chỉ thu được khi đơn có `houseRulesSent = true` (BR-511). `houseRulesSent` là `false` **hoặc `null`** (đơn nhận phòng trước khi có trường này; R3 khách tự check-in) → cảnh báo `co.house_rules_not_sent` "Chưa ghi nhận đã gửi nội quy – cân nhắc trước khi thu phạt", **không** chặn; MGR quyết (DOM G-19).

### 3.3 Sửa dòng – `adjustFolioLine` (A31, A32; BR-008)
`reason` (B, V-08); một trong `newQuantity` (≥ 0), `newUnitPriceVnd` (A31: FD chỉ trong sàn–trần BR-105 với dòng `room`; dòng khác theo 3.2), `voidLine = true`. Kết quả: bút toán đảo + dòng mới (không sửa dòng cũ). Folio `settled`: chỉ MGR+ (US-038 AC2) → FD/FDL nhận 403 `FORBIDDEN_ACTION` (nút ẩn). Dòng đang `pending_approval` → 409 `INVALID_TRANSITION` (rút yêu cầu trước).

### 3.4 FOC và giảm giá đặc biệt (US-007 trên folio; BR-431…436)
Gửi từ một dòng folio bằng `requestFoc` – trường, định tuyến, tự áp minibar và hộp duyệt theo **EP00 mục 7** (không lặp lại). Ràng buộc riêng trên folio:
| Dòng gốc | `kind` cho phép | Ghi chú |
|---|---|---|
| `early_checkin`, `late_checkout`, `minibar`, `laundry`, `cleaning`, `penalty`, `damage`, `fnb`, `service_fee` | `foc` | BR-431; minibar có thể tự áp (BR-436) |
| `room`, `extra_person` | `special_discount` | Giảm tiền phòng ngoài chính sách (BR-431); đêm thêm B9a (mục 1.5) |
| `foc`, `discount`, `adjustment` | ✖ | 422 `NOT_IN_LIST` |

Hiển thị: dòng FOC âm cùng giá trị, `lineState = pending_approval` → chip `approval.status.pending` và **không** trừ vào còn phải thu cho tới `approved`; `rejected` → dòng FOC bỏ, phát sinh giữ nguyên (SM-10 A5). Bill ghi `bill.foc_line` "Miễn phí · {reason}" + tên người duyệt (BR-434). Folio còn yêu cầu `pending`/`escalated` → **chặn** hoàn tất trả phòng (mục 5.5). **UXD sửa**: `handover.foc_approver` ("Người duyệt") trái BR-432 – form gửi FOC không có ô người duyệt; `approval.pin_*` ghi PIN trong khi R2 xác nhận bằng mật khẩu (EP00 0.5).

---

## 4. Lưu trú (US-028, 029, 030, 031)

### 4.1 Gia hạn – `getExtensionOptions`, `extendStay` (B13, US-028)
Quyền FD+ (A14). Đơn `in_house` (đơn `confirmed` đổi ngày đi dùng B7 – EP02 9.1).

| Trường | Nhãn | Kiểu | BB | Kiểm tra | Lỗi |
|---|---|---|---|---|---|
| `nights` | Ở thêm (`extend.nights`) | int | B | 1…`maxNights` (= min(số đêm liên tiếp còn trống sau ngày đi, giới hạn BR-421)); đêm `available = false` hiện `extend.night_taken` | `EXTENSION_LIMIT_EXCEEDED` **(đề nghị ARC E04-01)** → `extend.max_hint` |
| `nightlyRates[]` | Giá từng đêm | `{date, amountVnd}` | K | Bỏ trống = `defaultRateVnd` (BR-421: Trực tiếp/CTV giữ giá đơn, ngày đặc biệt BR-104; OTA giá Trực tiếp hiện hành); sửa trong `floorVnd`–`ceilingVnd` (BR-105); mỗi đêm một dòng | `RATE_OUT_OF_RANGE`; `AMOUNT_NOT_POSITIVE` |
| `visaWarningAckReason` **(đề nghị ARC E04-01, dùng chung US-050)** | Lý do vẫn gia hạn quá hạn thị thực | text | ĐK: khách NN có `visaValidUntil` < ngày đi mới | V-08. Thiếu → 422 mã trường `VISA_EXPIRES_BEFORE_DEPARTURE` (cảnh báo – client hiện ô lý do rồi gửi lại, như `RATE_OUT_OF_RANGE_WARNING`) | `VISA_EXPIRES_BEFORE_DEPARTURE` **(mới)** |

- Hiển thị trước khi lưu: nguồn giá (`extend.rate_source`), tổng (`extend.submit`), hạn thu tiền gia hạn (`extend.pay_by`, BR-423), hệ quả (`extend.effects`); OTA: `extend.ota_child` với `channelFeeSavingsVnd` (tỷ lệ từ cấu hình kênh BR-901/422 – không viết cứng).
- `exceedsShortStayLimit = true` (muốn > giới hạn BR-421 hoặc tổng ≥ ngưỡng BR-108): nút `extend.to_long`. Ở R2 báo giá dài hạn dời R3 → nút đổi thành "Báo quản lý – thuê dài hạn" (tạo việc lễ tân cho MGR) `[R2 – R-C; GIẢ ĐỊNH BA]`.
- Kết quả (AC4): ngày đi mới; Trực tiếp/CTV thêm dòng `room`; OTA tạo đơn con kênh Trực tiếp (`childReservation`, chung folio, không sinh khai báo mới – BR-608); buồng `OD` (BR-802); việc "Dọn trả phòng" của ngày đi cũ đổi thành "Dọn phòng khách đang ở"; khai báo NN `confirmed`/`updated` → `needs_update` + việc "Cập nhật ngày đi" (BR-604); hạn thu tiền gia hạn vào "Cần chú ý" khi quá BR-423; đồng bộ kênh; bộ đồ dùng thêm giữ nguyên (mục 0.1).
- Lỗi: trùng đêm do người khác vừa đặt (AC5) → 409 `ROOM_UNAVAILABLE` (`booking.error.server_conflict`); 412 `VERSION_CONFLICT`.
- Đơn dài hạn nhập tay (AC5a): gia hạn theo HĐ giấy bằng B13 với `nights` không giới hạn BR-421, **không** sinh dòng `room` (tiền thu theo US-119 AC1) `[GIẢ ĐỊNH BA – ARC xác nhận server bỏ qua nightlyRates với externalContract]`.

### 4.2 Trả muộn – `setLateCheckout` (B15, US-029)
Quyền FD+ (A16); có khách đến cùng ngày, không còn căn thay thế → FD gửi duyệt (A16 = D, `late_checkout_conflict`), MGR+ lưu trực tiếp.

| Trường | Nhãn | Kiểu | BB | Kiểm tra | Lỗi |
|---|---|---|---|---|---|
| `checkoutTime` | Giờ trả đã hẹn (`late.time`) | time | B | > `checkout_time` (BR-401); ≤ mốc cuối của `late_checkout_tiers` (BR-412); sau mốc → `treatAsExtension = true`, giao diện `late.treat_as_extension` + nút sang Gia hạn 1 đêm (BR-416) | `LATE_CHECKOUT_AFTER_LIMIT` **(đề nghị ARC E04-02)** |
| `dryRun` | – | bool | – | `true` mỗi lần đổi giờ (không cần khóa idempotency); `false` khi lưu | – |
| `applySurcharge` | "Ghi phụ thu {amount}" | bool | K | Mặc định **false** trên giao diện (BR-414 – lễ tân xác nhận số tiền); hợp đồng mặc định `true` → client luôn gửi tường minh `[đề nghị ARC đổi mặc định – E04-02]` | – |
| `requestFocForSurcharge` | Đề nghị miễn phụ thu | `FocRequestInput` | K | Như EP00 7.1 | – |
| `requestApproval` **(E04-02)** | Gửi quản lý duyệt | bool | ĐK: FD + `LATE_CHECKOUT_CONFLICT` | `true` → 202 + yêu cầu `late_checkout_conflict` (`late.request_approval`) | – |

- Kết quả dry-run hiển thị: `late.fee` (`tierPct`, cơ sở mục 0) hoặc `late.fee_zero` (trong ân hạn `late_grace_until` khi **không** có khách đến cùng ngày – BR-412); `late.arrival_warning` (tên khách đến, giờ đến dự kiến, căn thay thế cùng nhóm – AC2) hoặc `late.conflict_block`.
- Căn có khách đến cùng ngày, trả muộn được MGR+ **duyệt** (`late_checkout_conflict`, A16): "duyệt" chỉ là cho phép ở lại, **không** miễn phí – ân hạn 12:30 không áp (BR-412), phụ thu theo bậc; muốn miễn thì gửi FOC (BR-433) (DOM G-11).
- Giờ hẹn ở đây chỉ là **dự kiến**: phụ thu cuối cùng tính theo **giờ trả thực tế** ở bước trả phòng (5.3 – DOM G-10).
- Dài hạn (US-027 AC2): cơ sở = `monthlyRentVnd` ÷ 30; miễn đến `long_stay_free_late_until` khi không có khách đến (BR-413) → phụ thu đề xuất 0.
- Kết quả lưu (AC4): `agreedCheckoutTime`; việc dọn của căn ghi `late.effects` "dọn sau {time}" (gồm dòng thu hồi bộ đồ dùng thêm nếu có); dòng `late_checkout` nếu đã xác nhận; nhật ký nhắc ghi giờ đã chốt (US-030). Phần "mã cửa kéo dài" **[Dời R3 – US-128]**. 409 `LATE_CHECKOUT_CONFLICT` → `error.LATE_CHECKOUT_CONFLICT`.

### 4.3 Xác nhận giờ trả – `recordCheckoutConfirmation`, `listCheckoutReminders` (US-030)
| Trường | Nhãn | Kiểu | BB | Kiểm tra | Lỗi |
|---|---|---|---|---|---|
| `channel` | Kênh | enum `phone` · `in_person` · `zalo_copy` (nhắn tay qua Zalo) · `app` | B | V-11 | `NOT_IN_LIST` |
| `replyType` | Khách trả lời | enum `on_time` (đúng giờ chuẩn) · `time` (giờ cụ thể ≤ giờ chuẩn) · `late` (muốn trả muộn) · `extend` (muốn ở thêm) | B | V-11 | `NOT_IN_LIST` |
| `confirmedTime` | Giờ | time | ĐK: `time`, `late` | `time`: ≤ `checkout_time`; `late`: > `checkout_time` → sau khi lưu mở form Trả muộn (4.2) điền sẵn | `REQUIRED`; `DATE_INVALID` |
| `note` | Ghi chú | text | K | ≤ 300, V-09 | – |

Kết quả (AC1, AC2): dòng nhật ký "{kênh} – khách trả lúc {giờ}" + người ghi + thời điểm; thẻ khách đi → `replied`. `extend` → mở form Gia hạn (4.1). Ghi `late` **không** tự đặt trả muộn (phải qua 4.2 để tính phụ thu/xung đột).

### 4.4 Thẻ "Khách trả phòng hôm nay chưa trả" (US-031, BR-425)
Danh sách = đơn `in_house` có ngày đi = hôm nay (BR-404). `reminderState` server tính theo `checkout_reminders` và giờ VN thật:
| `DepartureReminderState` | Khi | Nhãn **(mới, UXD duyệt)** |
|---|---|---|
| `reminded_waiting` | Trước mốc "báo lễ tân gọi" | "Chờ khách trả lời" – R2 chưa có tin nhắc tự động (US-034 R3) nên **không** dùng chữ "Đã nhắc" `[GIẢ ĐỊNH BA]` |
| `call_needed` | Từ mốc "báo lễ tân gọi" (BR-425) | "Chưa trả lời – gọi xác nhận" |
| `overdue` | Từ mốc quá giờ: căn có khách đến hôm nay → mốc 12:00; không → mốc sau ân hạn (BR-425/412) | "Quá giờ trả phòng" – báo đỏ FD + MGR |
| `replied` | Có xác nhận (4.3) hoặc đã đặt trả muộn (4.2) | "Đã trả lời – trả lúc {time}" |
| `checked_out` | B18 xong | rời danh sách |

Sắp xếp (AC2): `hasArrivalSameRoomToday = true` lên đầu, rồi theo trạng thái (`overdue` > `call_needed` > `reminded_waiting` > `replied`). QA kiểm ngay trước/ngay sau mỗi mốc bằng đồng hồ giả lập (AC1).

### 4.5 Đổi phòng khi đang ở – `changeRoom` (B14; US-024 AC2–AC4 – dời từ Sprint 2; BR-424, BR-803)
Quyền FD+ (A15). Đơn `in_house`. Trường (`If-Match` + `Idempotency-Key`):

| Trường | Nhãn | Kiểu | BB | Kiểm tra | Lỗi |
|---|---|---|---|---|---|
| `newRoomId` | Căn mới | uuid | B | ≠ căn hiện tại; trống từ `effectiveDate` tới ngày đi (BR-906); **không** OOO; buồng `VI`/`VC` (AC4, BR-803 – **không** có ngoại lệ FDL+ như B9); đủ sức chứa – **chặn cứng** `422 CAPACITY_EXCEEDED` với **mọi kênh**, kể cả OTA. Lý do: khách đang ở đã có phòng, không cần nhận cảnh báo như đơn OTA mới về (OpenAPI 0.3.6 A-37) | 409 `ROOM_UNAVAILABLE`/`ROOM_BLOCKED` (+ `suggestions[]`); 409 `ROOM_NOT_READY` (+ `roomStatus`) → **(mới)** "Căn {room} chưa sẵn sàng (đang {status}). Chọn căn đã dọn." |
| `effectiveDate` | Đổi từ đêm | date | B | Mặc định = ngày nghiệp vụ hôm nay; ≥ hôm nay và < ngày đi | `DATE_INVALID` |
| `cause` | Nguyên nhân | enum `property_fault` "Sự cố của OTTIMO" · `guest_request` "Khách yêu cầu" | B | V-11; `property_fault` khi đổi từ phiếu sửa mức Cao (EP07-08 6.4 gợi ý) → điền sẵn + gắn `workOrderId` **(đề nghị E04-05)** | `NOT_IN_LIST` |
| `reason` | Lý do | text | B | V-08 | `REASON_REQUIRED` |

Xem trước giá trước khi lưu: 0.3.6 dùng `searchAvailability?reservationId=` (A-37); đề nghị `dryRun` riêng **E04-05** nếu cần trả chênh lệch folio: giá các đêm từ `effectiveDate` – `property_fault` → **giữ giá cũ** (kể cả căn mới đắt hơn – nâng hạng miễn phí); `guest_request` → giá căn mới theo lịch giá kênh hiện hành từ đêm đổi (BR-424; kênh `direct`/`agent` áp lại bậc giảm theo tổng số đêm – D-8; đơn OTA: chênh lệch thu tại quầy như phát sinh `room_change_difference` **(mới)**, không sửa giá OTA) – lễ tân xác nhận số chênh (BR-414); căn mới rẻ hơn với `guest_request` → giảm theo giá mới, không tự hoàn tiền đã thu (dư → mục 2.6).

Kết quả (AC2, AC3): segment cũ đóng, segment mới từ `effectiveDate` (ADR-009, cùng giao dịch); folio đảo dòng `room` các đêm từ `effectiveDate` và ghi lại theo giá trên (BR-008); căn cũ → `VD` (khách đã dọn đồ) hoặc `OD` nếu khách còn để đồ tới chiều `[GIẢ ĐỊNH BA – lễ tân chọn "Khách đã chuyển xong" (VD) / "Chuyển sau" (OD)]` + việc dọn; căn mới → `OC`; khai báo **không** làm lại (BR-424), chỉ ghi chú đổi căn trong hồ sơ khai báo; mã cửa: R2 hiện nhắc **(mới)** `room_change.door_reminder` "Thu thẻ cũ, giao thẻ/mã căn {room}." và đặt lại `doorAccessHandedOver = false` (mã cửa trong app **[Dời R3 – US-128]**); bộ đồ dùng thêm → việc `extra_guest_kit_transfer` (mục 0.1); đồng bộ kênh; nhật ký. Hộp xác nhận EP00 mục 9: "Đổi khách {code} từ căn {old} sang {new} từ đêm {date}? {Giữ giá cũ | Giá mới {amount}/đêm}."

Lỗi chung: 409 `INVALID_TRANSITION` (đơn không `in_house`), 412 `VERSION_CONFLICT`. Đổi nhiều lần trong một kỳ được, mỗi lần một segment.

### 4.6 Trả sớm (US-137 – **Should R2**, chỉ làm nếu dư)
`earlyDeparture` (B16, A17): `newDepartureDate` (B, ≥ hôm nay, < ngày đi), `noticeGivenAt` (B, instant ≤ bây giờ). Phần hoàn theo BR-428 (đếm BR-011) → yêu cầu hoàn (mục 2.6, nguồn "trả sớm"); mở bán đêm còn lại; khai báo NN `needs_update`. Yêu cầu hoàn sinh tự động; nơi nhận nhập theo mục 2.6.1. Ảnh giấy tờ: trả sớm = trả phòng – hạn xóa tính từ `actualCheckoutAt` (EP06 6.1, DOM G-17).

### 4.7 Người đi cùng tại quầy và khi đang ở (US-022 – dời từ Sprint 2) – `listParty`, `addPartyMember`, `removePartyMember`
Trường cơ bản ở `EP02-reservations.md` mục 8 (giữ nguyên). Bổ sung để làm Sprint 3:

| Chủ đề | Quy tắc | Nguồn |
|---|---|---|
| Quyền | FD+ (A20) thêm/bỏ; SAL/CTV chỉ thấy số người (`own_count_only`, D10); HK/MT ✖ | rbac D10, A20 |
| Cảnh báo thiếu người (AC1) | `missingCount = requiredCount − presentCount` (requiredCount = `adults` + `children6to11` + `childrenUnder6` – BR-601); > 0 → khối khách hiện "Thiếu {n} người" **(mới)** `party.missing`; ở màn nhận phòng điều kiện `party_count` (EP06 3.1) – **không** chặn B9 nếu có giấy tờ người đứng tên | BR-601, BR-402 (3) |
| Trẻ em / người dưới ngưỡng (AC2) | `role = child`: `childName` (V-01), `childBirthYear` – C3 chỉ ghi, mã hóa (DEK `child_data`), không tạo hồ sơ CRM, không liên hệ, không đồng ý marketing; trả về chỉ `childAgeBand` (`under6`, `6to11`, `12plus`) tính tại ngày đến | BR-612, BR-110 |
| Chặn trùng (AC3) | Cùng `guestId` (gồm người đứng tên) → 409 `PARTY_DUPLICATE`; trẻ em: cùng `childName` chuẩn hóa + năm sinh → cũng 409 `[GIẢ ĐỊNH BA]` | AC3 |
| Thêm người **giữa kỳ ở** (AC4) | Đơn `in_house`: trường thêm **`effectiveFrom`** (date, B – ngày nghiệp vụ hôm nay hoặc trong khoảng lưu trú; **(đề nghị ARC E04-04)**). Người làm `occCount` vượt số khách khai → server trả `occupancyChange` (số khách mới, `extraCount` mới, phụ thu đề xuất theo BR-110 **từ đêm `effectiveFrom`** × số đêm còn lại) – lễ tân tích "Ghi phụ thu {amount}" (`applyExtraPersonSurcharge`, mặc định false – BR-414) rồi lưu; kiểm sức chứa (`CAPACITY_EXCEEDED` – trực tiếp/CTV; OTA cảnh báo D-1); `extraCount` tăng → việc bộ đồ dùng thêm hạn `extra_guest_kit_midstay_due_minutes` (mục 0.1). Đơn OTA: chỉ cập nhật số khách, phụ thu chỉ khi số người thực tế vượt số khách trên đơn OTA (BR-110) | BR-110, BR-812 (2), US-022 AC4 |
| Khai báo | Thêm người khi khai báo đã `sent`/`confirmed` → `needs_update` + việc "Khai bổ sung {n} người" (BR-604, K9); bỏ người đã khai → cảnh báo "Người này đã khai trên cổng – cập nhật trên cổng" **(mới)**, khai báo `needs_update` | SM-05 K9 |
| Bỏ người (`removePartyMember`) | FD+; không bỏ người đứng tên; `If-Match` theo `Party.version` **(đề nghị ARC E04-04 – 0.3.6 vẫn thiếu)**; người đứng tên → 409 `INVALID_TRANSITION` (A-38); người đã có giấy tờ → hộp xác nhận **(mới)** "Bỏ {name} khỏi đơn? Giấy tờ và ảnh của người này sẽ bị xóa ngay." (0.3.6 A-38: xóa cùng giao dịch); giảm `occCount` → hỏi "Giảm số khách của đơn xuống {n}?" → `updateReservation` (phụ thu người không tự hoàn – đảo dòng từ đêm kế tiếp nếu lễ tân xác nhận) | BR-008, BR-812 (4) |
| Lỗi | 409 `PARTY_DUPLICATE`; 422 `REQUIRED`/`NAME_INVALID`/`VALUE_OUT_OF_RANGE`; 409 `INVALID_TRANSITION` (đơn `checked_out`/`cancelled`); 412 `VERSION_CONFLICT` | – |

---

## 5. Trả phòng 3 bước + bill (US-035…039, US-038 B18) – S07

### 5.1 Quyền và điều kiện mở
FD+ (S07, A18). Đơn `in_house`, ngày đi = hôm nay (ngày nghiệp vụ) hoặc trả sớm đã ghi (4.6). Khách trả sau nửa đêm (01:00 ngày lịch hôm sau, ngày nghiệp vụ vẫn là ngày đi – BR-010) vẫn mở được màn này, nhưng giờ trả đã qua mốc cuối BR-412 → bắt buộc Gia hạn 1 đêm trước (5.3, DOM G-16). Không cần thiết bị được cấp (không có C3). Các bước theo chuỗi `checkout.step.minibar` → `checkout.step.extras` → `checkout.step.bill`; quay lại bước trước được cho tới khi hoàn tất. Bảng tóm tắt "Còn phải thu" (`checkout.summary.balance`) luôn hiện, gọi lại `getCheckoutSummary` sau mỗi thao tác ghi.

### 5.2 Bước 1 – Minibar (US-035) – `recordMinibarCheck` (`mode = checkout`, A37)
| Trường | Nhãn | Kiểu | BB | Kiểm tra | Lỗi |
|---|---|---|---|---|---|
| `lines[].itemId` | Món | uuid | B | Đủ **mọi** món của tủ chuẩn căn (BR-701 `minibar_standard`); thiếu món → lỗi; món ngoài tủ chuẩn → lỗi | `MINIBAR_ITEMS_INCOMPLETE` **(đề nghị ARC E05-04)**; `NOT_IN_LIST` |
| `lines[].remainingQty` | Còn lại (`checkout.minibar.left`) | int | B | 0 ≤ còn lại ≤ mức chuẩn (US-035 AC3, BR-702); không nhận số âm, số lẻ | `MINIBAR_QTY_OVER_STANDARD` **(E05-04)** → `field_error.minibar_over_standard` **(mới)** "Không quá {max} (mức chuẩn của tủ)." |
| `performedAt` | Thời điểm kiểm | instant | K | ≤ bây giờ | `DATE_INVALID` |

- Điền sẵn: HK đã kiểm khi khách báo trả (cùng ngày, `mode = checkout`) → hiện `checkout.minibar.from_hk` và số của HK; FD xác nhận hoặc sửa. Nút `checkout.minibar.all_full` = mọi món còn đủ. Căn không có món tính tiền → `checkout.minibar.empty`, bước 1 tự đạt.
- Tính: đã dùng = chuẩn − còn lại; tiền = đã dùng × giá bán (BR-702); món miễn phí hiện `checkout.minibar.free`, **không** tạo dòng tiền nhưng ghi tiêu hao (BR-701, AC2). Mỗi món tính tiền có `usedQty > 0` → một dòng folio `minibar` `[BA quyết cách trình bày; bill gộp theo món]`. HK nhập được số nhưng không thấy tiền (rbac ghi chú 26).
- Kiểm lại lần 2 trước khi hoàn tất: bản mới thay bản cũ – server đảo các dòng minibar của bản cũ và ghi dòng mới (BR-008) `[GIẢ ĐỊNH BA – ARC xác nhận]`.
- Hệ quả: `refillTaskId` (việc "Bổ sung minibar" sinh khi hoàn tất B18 nếu có tiêu hao). Khách tranh cãi → FOC minibar tự áp trong hạn mức (mục 3.4, BR-436). Chưa ghi bước 1 → blocker `minibar_not_checked` (5.5).

### 5.3 Bước 2 – Phụ phí, giờ trả, FOC, cách thanh toán (US-036)
| Trường | Nhãn | Kiểu | BB | Kiểm tra | Lỗi |
|---|---|---|---|---|---|
| `checkoutTime` | Giờ trả phòng thực tế (`checkout.departure_time`) | time | B | Mặc định = `agreedCheckoutTime` nếu đã hẹn (4.2), không thì `checkout_time` (AC1, BR-414); `HH:mm` **trên trục ngày nghiệp vụ**: giờ 00:00–05:59 hiểu là **sau nửa đêm** của ngày đi (không phải sáng sớm) → luôn > mốc cuối BR-412. > mốc cuối → chặn, nút "Gia hạn 1 đêm" (4.1) rồi quay lại trả phòng (DOM G-16). Hợp đồng chỉ có `time` → đề nghị ARC **E05-09** nhận `checkoutAt` (instant) để server khỏi đoán | `LATE_CHECKOUT_AFTER_LIMIT` |
| — | Phụ thu trả muộn (đề xuất) | money (chỉ đọc) | – | `getCheckoutSummary?checkoutTime=` → `lateCheckoutSurcharge` (BR-412/413/415, ân hạn theo khách đến cùng ngày xét **lúc trả phòng**); `checkout.late_none` khi 0 | – |
| `applyLateSurcharge` | "Ghi phụ thu {amount}" (`checkout.late_fee`) | bool | ĐK: phụ thu > 0 | Mặc định **false**; tích = lễ tân xác nhận số tiền (BR-414). **Tính theo giờ trả thực tế** (DOM G-10): đã có dòng `late_checkout` ghi ở 4.2 mà số theo giờ thực tế **khác** → server **đảo dòng cũ và ghi dòng mới** (BR-008), không "ghi phần chênh". Giảm (khách trả sớm hơn giờ hẹn – hẹn 17:00 [50 %], trả 13:00 [30 %, thuộc (12:00, 15:00]]; hoặc trả trong ân hạn → 0) → server **tự** đảo và ghi lại khi hoàn tất, không cần tích (lợi cho khách); tăng (trả muộn hơn giờ hẹn) → cần tích xác nhận số mới. Màn hiện **(mới)** `checkout.late_recalc` "Phụ thu trả muộn đã ghi {old} → theo giờ trả thực tế {new}." | – |
| Dòng phát sinh | Giặt ủi, đồ ăn, hư hỏng, khử mùi, thiếu thẻ (`checkout.extras.*`) | `addFolioLine` | K | Mục 3.2. "Thiếu thẻ phòng": số lượng đề xuất = `cardsIssued` − số thẻ khách trả (ô nhập, 0…`cardsIssued`) | như 3.2 |
| FOC | trên từng dòng | `requestFoc` | K | Mục 3.4 | – |
| — | Cách thanh toán dự kiến (`pay.method`) | enum | K | Chỉ để hiện QR/hướng dẫn ở bước 3; **không** ghi tiền (AC2: "Còn phải thu" cập nhật ngay khi thêm dòng) | – |

Theo kiểu thanh toán đơn OTA (BR-307, DOM G-13):
- `ota_prepaid` (OTA thu hộ – AC3): bước 2 chỉ hiện các khoản phát sinh thu tại quầy; tiền phòng hiện "Đã thu qua OTA" (`paidViaOtaVnd`), không vào còn phải thu.
- `ota_pay_at_property` (khách trả tại chỗ, ví dụ Agoda "pay at hotel"): tiền phòng **theo giá OTA** là khoản phải thu tại quầy (đã thu đủ khi nhận phòng – 1.3 `balance_paid`); bước 2 hiện như đơn trực tiếp.

### 5.4 Bước 3 – Bill và thu tiền (US-037, US-039, US-119, US-120) – `getBill`, `setInvoiceRequest`
**Nội dung bill** (`getBill`, US-037):
| Khối | Nội dung | Quy tắc |
|---|---|---|
| Đầu | Tên/địa chỉ/MST cơ sở, `bill.no` (trống tới khi hoàn tất – số cấp lúc `settled`, BR-007 `F26-xxxxxx`), tên khách (D01), căn, ngày đến/đi | BR-007 |
| Dòng | `bill.night_line` mỗi đêm; phụ thu người; nhận sớm/trả muộn; minibar (theo món); phát sinh; mỗi FOC/giảm giá **đã duyệt** = dòng âm `bill.foc_line` ngay dưới dòng gốc (BR-434); dòng `pending_approval` **không** in. **Dòng đã bị đảo và dòng đảo của nó không in** – chỉ in dòng còn hiệu lực (giá trị ròng theo đêm/khoản); nhật ký vẫn giữ đủ (DOM G-12). Đơn `ota_prepaid`: không in giá từng đêm, in một dòng **(mới)** `bill.ota_prepaid` "Tiền phòng {n} đêm – đã thanh toán qua {channel}"; `ota_pay_at_property`: in giá từng đêm theo giá OTA (G-13) | BR-434, BR-008, BR-307 |
| Tổng | `bill.total` = Σ dòng `posted`; `bill.deposit` = Σ giao dịch thu `succeeded` chưa đảo (giao dịch đã đảo và giao dịch đảo **không** in – G-12) (US-037 AC3) + "Đã thu qua OTA"; giao dịch hoàn đã chi in dòng **(mới)** `bill.refund` "Đã hoàn {amount} ({method})"; `bill.balance` (âm → in "Hoàn lại khách {x}" **(mới)**) | US-119 |
| Ngôn ngữ | `locale = vi_en` khi khách NN theo giấy tờ khai báo (BR-009) **hoặc** hồ sơ có ngôn ngữ ≠ `vi`; ngược lại `vi`. Dòng USD tham khảo (`common.approx_usd`): tổng ÷ `fx_usd_vnd`, 1 chữ số thập phân, kèm ngày cập nhật tỷ giá (BR-004) – chỉ khi `vi_en` | US-037 AC2 |
| Thuế | `bill.vat_note` "Giá đã gồm thuế GTGT" (BR-523); **không** tách VAT trên bill R2 (tách khi xuất hóa đơn – R3) | BR-523 |
| Chuyển khoản | `vietqrTransferContent` (mục 2.3) | BR-521 |

Kiểm số bắt buộc: US-037 AC1 (3 đêm × 820.000, minibar 25.000, phụ thu trả muộn có FOC duyệt, chưa cọc → tổng 2.485.000, còn phải thu 2.485.000) – QA đọc `br-examples.json`.

**Thu tiền ở bước 3**: dùng mục 2 (một hoặc nhiều lần, nhiều cách – `pay.split`); nút hoàn tất ghi `checkout.complete` kèm "Đã thu {X} đ" khi còn phải thu = 0. Có thể gửi giao dịch cuối cùng trong `checkOut.finalPayment` (cùng giao dịch DB với B18 – tránh trạng thái "đã thu nhưng chưa trả phòng").

**Hóa đơn công ty – `setInvoiceRequest`** (US-039, A38; hiện khi tích `invoice.toggle`):
| Trường | Nhãn | Kiểu | BB | Kiểm tra | Lỗi |
|---|---|---|---|---|---|
| `buyerType` | – | enum | B | Tích ô → `company`; bỏ tích → `individual` (R2 không dùng `retail`) | `NOT_IN_LIST` |
| `companyName` | `invoice.company` | text | ĐK (`company`) | 2–200 ký tự sau cắt khoảng trắng | `REQUIRED`; `TOO_LONG` |
| `taxCode` | `invoice.tax_id` | text | ĐK (`company`) | V-04 (US-039 AC1) | `TAX_CODE_INVALID` → `invoice.tax_id_error` |
| `email` | `invoice.email` | text | ĐK (`company`) | V-03 | `EMAIL_INVALID` |
| `address` | Địa chỉ công ty **(mới)** | text | K | ≤ 300 `[MISA có thể bắt buộc – INT xác nhận ở R3]` | `TOO_LONG` |

Kết quả (AC2): thông tin gắn folio + hồ sơ khách (D16); `einvoiceStatus = not_requested` ở R2 (`invoice.pending` chỉ hiện khi R3 phát hành MISA – BR-524). Folio `settled` vẫn sửa được thông tin hóa đơn tới khi phát hành (R3) `[GIẢ ĐỊNH BA]`.

### 5.5 Hoàn tất trả phòng – `checkOut` (B18, US-038; `If-Match` + `Idempotency-Key`)
| Trường | Kiểu | BB | Kiểm tra | Lỗi |
|---|---|---|---|---|
| `checkoutTime` | time | B | Như 5.3 | – |
| `applyLateSurcharge` | bool | K | Như 5.3 | – |
| `overpaymentHandling.mode` | enum `refund_request` / `retain_with_guest_consent` | ĐK: `creditVnd > 0` | `retain_with_guest_consent` chỉ MGR+ | 422 `OVERPAYMENT_HANDLING_REQUIRED`; 403 |
| `overpaymentHandling.reason` | text | ĐK | 3–500, V-09 | `REASON_REQUIRED` |
| `finalPayment` | `PaymentCreate` | K | Như 2.2 | như 2.2 |
| `debt.dueDate` | date | ĐK: MGR+ ghi công nợ (A19) | > hôm nay `[GIẢ ĐỊNH BA: ≤ hôm nay + 30 ngày]` | `DATE_INVALID` |
| `debt.reason` | text | ĐK | V-08 | `REASON_REQUIRED` |

**Blocker** (`CheckoutSummary.blockers`, kiểm lại ở server theo thứ tự):
| Blocker | Hành vi | Lỗi |
|---|---|---|
| `minibar_not_checked` | Chưa có kiểm minibar `checkout` cho căn có món tính tiền | 409 `INVALID_TRANSITION` → đề nghị ARC mã riêng `MINIBAR_NOT_CHECKED` (E05-04) → chuỗi **(mới)** "Chưa kiểm minibar. Làm bước 1 trước khi hoàn tất." |
| `pending_approvals` | Còn FOC/giảm giá `pending`/`escalated` (US-038 AC4) | 409 `PENDING_APPROVALS` → `error.PENDING_APPROVALS` |
| `balance_due` | Còn phải thu > 0 và không có `finalPayment` đủ, không có `debt` (AC3, BR-426) | 409 `BALANCE_DUE` (`balanceDueVnd`) → `checkout.blocked_balance`; FD/FDL gửi `debt` → 403 `FORBIDDEN_ACTION` |
| `credit_balance` (DOM G-15; OpenAPI 0.3.6 A-34) | `creditVnd > 0`: đã thu (gồm giao dịch chờ đối soát) − tổng − đã hoàn > 0, ví dụ cọc lớn hơn bill sau FOC/trả sớm | Màn hiện **(mới)** `checkout.blocked_credit` "Khách đã trả thừa {x}. Chọn cách xử lý." Bắt buộc `checkOut.overpaymentHandling {mode, reason}`; thiếu → 422 `OVERPAYMENT_HANDLING_REQUIRED`. Hai cách: `refund_request` (FD+) → tạo yêu cầu hoàn = `creditVnd` cùng giao dịch B18; yêu cầu này **không** tính vào blocker `pending_approvals`; nơi nhận + chi hoàn làm sau (mục 2.6). `retain_with_guest_consent` (**chỉ MGR+**; FD/FDL → 403) → khách đồng ý để lại: ghi dòng `deposit_forfeit` = `creditVnd`, `reason` 3–500 bắt buộc. R2 không có ví tín dụng – lần sau MGR giảm giá thủ công có ghi chú |

Hộp xác nhận (US-135, EP00 mục 9): `checkout.complete_confirm_title` / `_body` – **UXD sửa** `_body` bỏ "mã cửa bị hủy" ở R2 (mã cửa chưa ở trong app) và thêm "thu hồi bộ đồ dùng thêm" khi `extraGuestCount > 0`.

Kết quả (AC1): đơn `checked_out`, `actualCheckoutAt` = thời điểm bấm; folio `settled` + `billNo` (server cấp), `post_checkout_window_until` = + `post_checkout_charge_hours` (BR-427); buồng `VD` (đang `CL` thì giữ `CL` – SM-03 R9); việc `checkout_clean` (+ dòng thu hồi bộ đồ dùng thêm – mục 0.1) và `minibar_refill` nếu có tiêu hao (`createdTaskIds`); khai báo NN → `needs_update` (BR-604, việc "Cập nhật ngày đi"); hoa hồng ngắn ngày → `earned` khi thu đủ (BR-903); thông báo `checkout.done`. Mã cửa "đã hủy" **[Dời R3]**. Hóa đơn điện tử **[R3 – US-122]**. `checkout.send_bill` **[R3 – US-040]**: R2 chỉ xem/in bill từ trình duyệt.

Sau hoàn tất (AC2): sửa dòng → chỉ MGR+ bút toán (3.3); FD+ ghi phát sinh sau trả phòng trong `post_checkout_window_until` (3.2); folio → `closed` do hệ thống khi hết hạn và còn phải thu = 0 (SM-13). Lỗi chung: 409 `INVALID_TRANSITION` (đơn đã đổi trạng thái), 412 `VERSION_CONFLICT`.

---

## 6. Truy vết story → mục (AC backlog)

| Story / AC | Mục | Ghi chú |
|---|---|---|
| US-025 AC1, AC2, AC4, AC6 | 1.3, 1.4, 1.6 | AC2: A12 = D (FD gửi, FDL+ tự xác nhận) |
| US-025 AC3 | 1.3 (`balance_paid`, `main_guest_document`) | Phần "không giao mã cửa" → chặn B9 ở R2 (1.3); mã cửa **[Dời R3]** |
| US-025 AC7 | 1.4 (`doorAccessHandedOver`), E03-06 | Ô không bắt buộc, tick bổ sung từ chi tiết đơn |
| US-025 AC5 | 1.7 | "Mã cửa bị hủy" **[Dời R3]** |
| US-026 AC1–AC4 | 1.4, 1.5, 3.4 | AC3 = B9a |
| US-027 AC1–AC2 | 1.8, 4.2 | Đơn dài hạn R2 = đơn AC5a |
| US-028 AC1–AC5 | 4.1 | |
| US-029 AC1–AC3 | 4.2 | AC4 phần mã cửa **[Dời R3]** |
| US-030 AC1–AC2 | 4.3 | |
| US-031 AC1–AC2 | 4.4 | |
| US-032 AC1–AC4 | 3.2, 3.3 | AC3 phần "app khách" → US-111 **[Dời R3]** |
| US-035 AC1–AC3 | 5.2 | |
| US-036 AC1–AC3 | 5.3 | |
| US-037 AC1–AC3 | 5.4 | |
| US-038 AC1–AC4 | 5.5, 3.3 | AC1 phần mã cửa **[Dời R3]**, hóa đơn điện tử R3 |
| US-039 AC1–AC2 | 5.4 | Phát hành thật US-122 (R3) |
| US-119 AC1–AC4, AC6 | 2.2, 2.4, 2.5 | **AC5 [Dời R3 – R-C]** |
| US-120 AC1–AC2 | 2.3 | |
| US-007 (phần folio) | 3.4; EP00 mục 7 | |
| ESC-014 / BR-110, BR-812 | 0.1, 1.3, 4.1, 4.2, 4.5, 5.5 | |
| US-137 (Should R2) | 4.6 | Chỉ khung |
| US-022 AC1–AC4 (dời từ S2) | 4.7; EP02 mục 8 | |
| US-024 AC2–AC4 phần B14 (dời từ S2) | 4.5 | |
| BR-522 hoàn tiền (G-14) | 2.6, 5.5 | |

## 7. Đề nghị hợp đồng cho ARC (OpenAPI 0.3.2 → 0.3.3) và vai khác

| # | Gửi | Nội dung |
|---|---|---|
| E03-01 | ARC | `CheckInPreview.conditions[].code` thêm `document_check_block` (từ `Registration.blocksDoorCode`, BR-613 c, `overridableBy: [front_desk_lead, manager, owner]`); thêm `CheckInPreview.warnings[]` (`extra_guest_kit_not_ready`, `visa_expires_before_departure`, `passport_expires_during_stay`, `pending_online_checkin`); `checkIn` body thêm `documentBlockOverride { reason }` (FDL+) |
| E03-02 | ARC | `checkIn` (và `setLateCheckout`, `checkOut`) thêm `expectedSurchargeVnd` – server so với số tự tính, lệch → 409 để client tải lại (bảo đảm "ghi đúng số tiền đang hiển thị" BR-414) |
| E03-03 | ARC | `checkIn` khi FD gửi `roomNotReadyOverride`: khai báo response **202** + `ApprovalRequest` (`checkin_room_not_ready`); sau khi FDL+ duyệt, FD bấm lại nhận phòng (yêu cầu `approved` còn hiệu lực trong ngày nghiệp vụ) |
| E03-04 | ARC | `checkIn` thêm `cardsIssued` (int 0–2) và `houseRulesSent` (bool); `Reservation.cardsIssued`, `houseRulesSentAt` (không phải C3) – phục vụ phí thiếu thẻ/khử mùi BR-511 khi chưa có US-128 |
| E03-05 | ARC | B9a `check_in_add_prior_night`: `checkIn` thêm `addPriorNight`, `priorNightRateVnd`; `AllowedAction` có `event = check_in_add_prior_night`; lỗi căn không trống đêm trước = 409 `ROOM_UNAVAILABLE` + `suggestions[]` |
| E04-01 | ARC | `extendStay`: mã trường `EXTENSION_LIMIT_EXCEEDED`; `visaWarningAckReason` + mã trường cảnh báo `VISA_EXPIRES_BEFORE_DEPARTURE` (dùng chung `updateReservation`, `moveReservation` – US-050 AC2, EP06 mục 7) ; xác nhận cách gia hạn đơn `externalContract = true` (4.1) |
| E04-02 | ARC | `setLateCheckout`: mã trường `LATE_CHECKOUT_AFTER_LIMIT`; `requestApproval` → 202 + `late_checkout_conflict`; đổi mặc định `applySurcharge` thành `false` (BR-414) |
| E04-03 | ARC | `ChargeCatalogItem.priceEditable`; `FolioLineCreate.proposedUnitPriceVnd` (hư hỏng ngoài bảng → dòng `pending_approval` + yêu cầu `damage_pricing`); mã trường `PRICE_NOT_EDITABLE`, `EVIDENCE_REQUIRED` |
| E05-01 | ARC | `PaymentCreate.attachmentId` (ảnh biên nhận chuyển khoản – BR-527) |
| E05-02 | ARC | Thao tác `pending → succeeded` cho VietQR ghi tay (ví dụ `POST /payments/{id}/actions/confirm-received`, FD+, `reconciliation = pending`); quy tắc hết hạn/thay thế QR `pending` (mục 2.3) |
| E05-03 | ARC | `listPayments` (lọc `reconciliation`, `receivedFrom/To`, `recordedBy`, `method`; FD/FDL `x-scope: own`) cho US-119 AC6; mã `SELF_RECONCILE_FORBIDDEN` (403) cho `reconcilePayment` (rbac A46); `note` bắt buộc khi `disputed` |
| E05-04 | ARC | `recordMinibarCheck`: mã trường `MINIBAR_ITEMS_INCOMPLETE`, `MINIBAR_QTY_OVER_STANDARD`; endpoint đọc tủ chuẩn của căn (hoặc `MinibarCheck` dry-run); mã `MINIBAR_NOT_CHECKED` (409) cho `checkOut`; xác nhận cách thay bản kiểm thứ hai (đảo dòng cũ) |
| E05-05 | ARC | `getBill`: xác nhận `locale` do server quyết theo BR-009/ngôn ngữ hồ sơ; `usdReference.totalUsd` 1 chữ số thập phân; dòng FOC đặt ngay dưới dòng gốc (`relatedLineId`) |
| E05-06 | DOM | **Đã trả lời** (s2-DOM G-1…G-4; BR v0.3.3) – áp vào 1.4, 1.8, 1.3, 2.3 (Sprint 3) |
| E05-07 | UXD | Chuỗi **(mới)** trong tài liệu; sửa `pay.card` (POS tại quầy), `handover.foc_approver` (bỏ – BR-432), `approval.pin_*` (mật khẩu ở R2), `checkout.complete_confirm_body` (bỏ mã cửa R2, thêm thu hồi bộ đồ dùng thêm), nhãn trạng thái thẻ khách đi (4.4); chip "Chờ đối soát" |
| E03-06 | ARC | US-025 AC7: đường API tick bổ sung "Đã giao mã cửa/thẻ" từ chi tiết đơn sau khi đã nhận phòng – đề nghị `ReservationPatch.doorAccessHandedOver` (chỉ `true`, FD+, đơn `in_house`, đặt một lần) |
| E15-01 | ARC | **Đã có** trong 0.3.6 (`createRefundRequest`) – đã áp vào 2.6 |
| E15-02 | ARC + SEC | `executeRefund.attachmentId`: dùng `purpose` riêng `refund_proof` (ảnh UNC có số tài khoản → phạm vi đọc như D15, chỉ MGR/OWN) thay cho `deposit_receipt`; `bankReference` bắt buộc khi `bank_transfer`/POS; `attachmentId` bắt buộc khi `bank_transfer` |
| E15-03 | ARC | `createVietQr.overBalanceReason` (FD+, V-08) – cho phép QR vượt còn phải thu khi thu trước dịch vụ/ký quỹ (DOM G-4); thiếu → giữ 422 `AMOUNT_EXCEEDS_BALANCE` |
| E04-04 | ARC | `PartyMemberCreate.effectiveFrom` (đơn `in_house`), `applyExtraPersonSurcharge`, phản hồi `occupancyChange` (US-022 AC4); `Party.version` + `If-Match` cho `removePartyMember`; `childAgeBand` thay vì trả năm sinh |
| E04-05 | ARC | `changeRoom`: `dryRun` hoặc `searchAvailability` trả cả chênh lệch folio; `workOrderId` (khi `property_fault` từ phiếu sửa), `oldRoomVacated` (VD/OD – 4.5); dòng `room_change_difference` cho đơn OTA `guest_request` |
| E05-09 | ARC | `checkOut`/`getCheckoutSummary`: nhận `checkoutAt` (instant) thay/kèm `checkoutTime` để xử lý trả sau nửa đêm (DOM G-16) |
| E05-10 | ARC | (0.3.6 đã có `creditVnd`, blocker `credit_balance`, `overpaymentHandling` – A-34.) Còn đề nghị: `getCheckoutSummary` tính lại phụ thu `late_checkout` theo giờ thực tế và trả `lateSurchargeRecalc {oldVnd, newVnd}`; server tự đảo/ghi lại khi giảm (G-10). `getBill` bỏ cặp dòng gốc + dòng đảo (dòng và giao dịch), thêm `otaPrepaidSummary` và dòng hoàn (G-12, G-13) |
| Q-S3-1 | DOM + PO | **Đã quyết** (PO 16/10): A47a tiền mặt FD+, A47 chuyển khoản MGR+ |
| E15-04 | ARC | **Đã có** trong 0.3.6: `confirmCashHandover` (A46a), `executeCashRefund` (A47a). Còn đề nghị: `listPayments` x-scope để FD/FDL thấy mọi khoản tiền mặt SAL/CTV chờ nộp |
| E05-08 | QA | Ca đồng hồ giả lập cho mốc BR-412 (12:30 ân hạn có/không khách đến), BR-425 (4.4), B9a 05:59/06:00, **B9a 04:40 khách NN → hạn khai báo 16:40 (G-9)**, trả muộn hẹn 17:00 trả 13:00 → 30 % (G-10), trả 01:00 sau nửa đêm → bắt gia hạn (G-16), dài hạn nhận 08:00 căn trống/không trống (0 / 186.000 – G-2), chi hoàn một phần + phần còn lại, số dư âm khi trả phòng (G-15); ca đồng thời: hai người cùng ghi thu một folio, gia hạn trùng tạo đơn (US-028 AC5) |

## 8. Lịch sử thay đổi
| Ngày | Round | Thay đổi | Người |
|---|---|---|---|
| 16/10/2026 | 2 (Sprint 1) | Bản đầu: đặc tả mức trường EP03, EP04, EP05, EP15 phần R2 (US-119 trừ AC5, US-120), folio + FOC/giảm giá gắn US-007; áp BR-812 vào nhận/lưu trú/trả phòng; R2 không có mã cửa trong app (chặn B9 thay chặn giao mã) | BA |
| 16/10/2026 | 2 (Sprint 2 – PO quyết) | Nhận phòng: ô `doorAccessHandedOver` không bắt buộc, tick bổ sung từ chi tiết đơn (US-025 AC7, đề nghị E03-06); điều kiện `capacity_within_max` theo OpenAPI 0.3.5 | BA |
| 16/10/2026 | 2 (Sprint 3 khởi động) | Áp BR v0.3.3 + DOM mục G: 1.8 theo BR-413 (nhận sớm dài hạn miễn khi căn trống đêm trước – G-2, bản cũ ngược); thẻ 0…2 **mỗi căn** (G-1); G-3/G-4/G-6/G-7/G-8/G-9/G-11/G-19; **2.6 hoàn tiền: yêu cầu → duyệt → chi hoàn** (G-14); 5.3/5.4 trả muộn theo giờ thực tế (G-10), bill bỏ cặp dòng đảo (G-12), OTA trả trước/trả tại chỗ (G-13), trả sau nửa đêm (G-16); 5.5 blocker `credit_balance` (G-15); 4.5 B14 đầy đủ và 4.7 US-022 (dời từ S2); đề nghị E15-01…03, E04-04/05, E05-09/10, Q-S3-1 | BA |
| 16/10/2026 | 2 (Sprint 3 khởi động – đồng bộ 0.3.6) | Mục 2.6 viết lại theo tên OpenAPI 0.3.6-draft của ARC (A-33 `setRefundDestination`/`getRefundDestination`/`executeRefund`, `REFUND_DESTINATION_REQUIRED`, `REFUND_EXCEEDS_APPROVED`); 5.5 `credit_balance` theo A-34 (`overpaymentHandling` `refund_request`/`retain_with_guest_consent`, 422 `OVERPAYMENT_HANDLING_REQUIRED`); 4.5 đổi phòng vượt sức chứa = chặn cứng mọi kênh (A-37); E15-01/02, E05-10 thu hẹp | BA |
| 16/10/2026 | 2 (Sprint 3 – PO quyết) | Tách theo phương thức tiền: 2.4 xác nhận tiền mặt SAL/CTV nộp quầy (A46a, FD+, không tự xác nhận); 2.6 chi hoàn tiền mặt FD+ (A47a, không tự chi khoản mình tạo, ảnh biên nhận có chữ ký bắt buộc), chuyển khoản MGR/OWN (A47); Q-S3-1 đóng; E15-04 | BA |
