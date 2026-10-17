# Đặc tả mức trường – EP01 Tổng quan / Hôm nay (phần R2)

- Tác giả: BA | Round 2 – Sprint 2 (đi trước Sprint 4 một sprint) | Ngày: 16/10/2026 | Phiên bản: **0.2** (17/10, Sprint 4: mục 3.3 dùng khóa chuỗi thật `attn.foc_pct`/`attn.foc_count`, bỏ tham số server không trả; **mục 3.5 mới** – bảng `params` từng `kind` theo OpenAPI 0.3.7 bổ sung 1; 3.1/3.2/4 khớp 0.3.7). Bản 0.1 (16/10)
- Phạm vi (Must R2 theo R-C): US-010 (KPI đêm nay), US-011 (khách đến/đi hôm nay), US-012 **trừ AC2** (kỳ thu/HĐ – dời R3 cùng J12, J13), gồm **AC3 đã sửa theo SEC** và **AC8 mới** (BR-435 cho OWN – PO quyết 16/10). **Should R2**: US-013 (bộ đếm việc vận hành – mục 5, chỉ khung). **R3**: US-014 (ADR, RevPAR, biểu đồ 30 + 14 ngày), K-04…K-22 theo tháng (metrics "Lộ trình hiển thị").
- Nguồn và quy ước: như `specs/EP00-platform.md` mục 0. Thứ tự ưu tiên khi lệch: `business-rules.md` **v0.3.1** → backlog (AC) → **`metrics-definitions.md` v0.2** (nguồn sự thật cho công thức – Q-01, Q-03…Q-05, Q-15, K-01…K-03, K-18, S1c, S7) → `state-machines.md` → `rbac-matrix.md` (S02, ghi chú 1, mục 5.2 quy tắc 4) → `api/openapi.yaml` **0.3.4-draft** (`getTonightKpi`, `getArrivalsDepartures`, `listAttentionItems`, `resolveAttentionEvent`, `streamEvents`) → `design/copy/strings-vi.json` (`today.*`). Không chép con số nghiệp vụ.
- Đọc cùng: architecture mục 9 (job J1–J24), 12 (SSE, "Cần chú ý"), 16 (hiệu năng); `EP07-08-housekeeping-maintenance.md`, `EP14-guest-app.md` (nguồn các mục "Cần chú ý" mới).

---

## 0. Màn hình và vai

| Màn (cùng mã S02) | Vai | Màn mặc định | Nội dung R2 (thứ tự do UXD quyết) |
|---|---|---|---|
| **Tổng quan** | OWN, MGR | ✔ (rbac mục 1) | KPI đêm nay (mục 1) · Cần chú ý (mục 3, gồm mục tài chính/FOC/bảo mật theo vai) · Cần duyệt (EP00 mục 7, US-007) |
| **Hôm nay** | FDL, FD | ✔ | KPI đêm nay (`today.kpi_*`) · Khách đến / Khách đi / Giữ chỗ chưa cọc (mục 2) · Cần chú ý vận hành (mục 3) · Yêu cầu khách (`today.requests` – EP14 4.2) |
| – | HK, MT, SAL, CTV, GST | ✖ | API → 403 `FORBIDDEN_ACTION` |

- R2 **không** hiện thẻ doanh thu, ADR, RevPAR, biểu đồ công suất 30 + 14 ngày (US-014, R3). Wireframe L8 vẽ các thẻ này với nhãn "(R3)" – R2 **ẩn hẳn**, không để ô "…" `[GIẢ ĐỊNH BA – S9: không có ô số liệu không có API]`.
- Mọi số trên màn gắn mã chỉ số (`metricRefs`) và lấy từ API; không hằng số trong giao diện (US-010 AC2, metrics S9, BL 8.2 #28).
- "Hôm nay"/"đêm nay" = **ngày nghiệp vụ** (BR-010): 02:00 ngày 21/10 → đêm 20/10 (US-010 AC3, US-011 AC3). Tiêu đề hiện ngày nghiệp vụ, ví dụ "Hôm nay · Thứ Ba 20/10" kèm chú thích khi giờ thật đã qua 00:00 **(mới)** `today.business_day_note` "Ngày làm việc đổi lúc {rollover}."

---

## 1. KPI đêm nay (US-010) – `getTonightKpi`

### 1.1 Trường, công thức, hiển thị
| Trường (`TonightKpi`) | Nhãn (chuỗi) | Công thức (metrics v0.2) | Hiển thị |
|---|---|---|---|
| `businessDate` | – | `business_date(now)` (BR-010, Q-01) | Tiêu đề |
| `roomsTotal` | – | Căn đang kinh doanh của cơ sở (`active_from ≤ đêm < active_to`) | Chỉ dùng trong chú thích |
| `roomsSellable` | – | Căn có `is_sellable = true` trong `roomsTotal` (Q-04) | Chú thích |
| `oooRooms` | "{n} căn khóa" | Căn **bán được** có khối OOO `status ∈ {active, released}` phủ đêm nay (`start ≤ đêm < coalesce(endDateActual, endDatePlanned)`); khối `planned`/`cancelled` không tính (Q-04) | Thẻ "Căn khóa" + chú thích mẫu số |
| `availableRoomsNet` | – | `roomsSellable − oooRooms` (K-01 đêm nay) | Mẫu số |
| `occupiedRooms` | – (không có thẻ riêng; **khác** "Đang ở" `inHouse`) | Số căn có đêm `sold` **đã gán căn** đêm nay (đơn `confirmed`/`in_house`/`checked_out` – Q-03, Q-05; K-02) – gồm căn khách chưa đến nhưng đã xác nhận | Tử số công suất |
| `occupancyPct` | `today.kpi_occupancy` "Công suất đêm nay" | `occupiedRooms ÷ availableRoomsNet × 100` (K-03 đêm nay) – luôn ≤ 100% | 1 chữ số thập phân, dấu phẩy VI (66,7%), dấu chấm EN (66.7%); `null` (mẫu số 0) → "–" (Q-15) |
| (chú thích mẫu số) | `today.kpi_occupancy_note` "{sold}/{sellable} căn bán được ({blocked} đang khóa)" | `{sold}` = `occupiedRooms`, `{sellable}` = `availableRoomsNet`, `{blocked}` = `oooRooms` | Luôn hiện cạnh công suất (AC1 "có chú thích mẫu số") – UXD sửa câu cho rõ "có khách/bán được" (E01-09) |
| `holdOnlyRooms` | **(mới)** `today.kpi_holds` "+ {n} căn đang giữ chỗ (chưa tính)" | Căn chỉ có đơn `hold` phủ đêm nay – **không** cộng vào công suất (BR-904, Q-03, AC1) | Dòng phụ dưới công suất; 0 → ẩn |
| `unassignedConflictReservations` | **(mới)** `today.kpi_unassigned` "+ {n} đơn OTA chưa gán căn (chưa tính)" | Đơn có đêm `sold` đêm nay mà `room_id IS NULL` (Q-05) – chỉ số giám sát **S1c**, **không** vào tử số, không trừ mẫu số | Dòng phụ đỏ; bấm → rack làn "Chưa gán căn" (EP02 1.3); 0 → ẩn. `metricRefs` đang ghi `S1b` → sửa `S1c` (E01-01) |
| `arrivals` | `today.kpi_arrivals` "Khách đến hôm nay" | Đơn có ngày đến = hôm nay, trạng thái `confirmed` hoặc `in_house` (đã nhận hôm nay) – BR-404; không `hold`, `cancelled`, `no_show` | "{đã nhận}/{tổng}" – cần trường `arrivalsCheckedIn` (E01-02) |
| `departures` | `today.kpi_departures` "Khách đi hôm nay" | Đơn có ngày đi = hôm nay, trạng thái `in_house` hoặc `checked_out` (đã trả hôm nay) – BR-404 | "{đã trả}/{tổng}" – `departuresCheckedOut` (E01-02) |
| `inHouse` | `today.kpi_in_house` "Đang ở" | Số **đơn** `in_house` lúc gọi | Số nguyên |
| `metricRefs` | – | `availableRoomsNet: K-01`, `occupiedRooms: K-02`, `occupancyPct: K-03`, `unassignedConflictReservations: S1c` | Tooltip/ghi chú nguồn (S9) |

Ví dụ kiểm (AC1 – dữ liệu mẫu BL 3.2): 10 căn bán được, 1 căn khối OOO `active`, 6 căn có đơn `confirmed`/`in_house` phủ đêm nay, 1 căn chỉ có đơn `hold` → `availableRoomsNet` = 9, `occupiedRooms` = 6, `occupancyPct` = **66,7%** (6/9), `holdOnlyRooms` = 1 hiện riêng; prototype cũ ra 60% (6/10) là sai.

Biên: một đêm vừa có đơn bán vừa trong khối OOO (dữ liệu sai – BR-804 cấm) → tính đêm bán, **không** trừ OOO, sinh `data_quality` (metrics Q-04, J17). Căn ngừng bán (`is_sellable = false`) không vào cả tử lẫn mẫu.

### 1.2 Quyền và tính toán
- OWN, MGR, FDL, FD (S02). Không có trường tiền → FD thấy đủ (rbac ghi chú 1).
- Tính **khi đọc** từ `stay_night` + `room_occupancy` + `room_block` (không bảng tổng hợp ở R2); đích p95 < 300 ms (architecture 16). Thay đổi dữ liệu → lần đọc sau thấy ngay (AC2); cập nhật tự động qua SSE (mục 4).

---

## 2. Khách đến / khách đi hôm nay (US-011; BR-404) – `getArrivalsDepartures`

### 2.1 Danh sách
| Khối | Gồm (ngày nghiệp vụ `date`) | Không gồm | Sắp xếp |
|---|---|---|---|
| **Khách đến** (`today.arrivals` "Khách đến ({n})") | Đơn ngày đến = `date`, trạng thái `confirmed` (chưa nhận) và `in_house` (đã nhận – chip `status.booking.in_house` "Đã nhận") | `hold` (khối riêng), `cancelled`, `no_show` (AC1) | Chưa nhận trước; trong nhóm theo `etaTime` (vắng = `checkin_time`) tăng dần; đơn chưa gán căn đầu tiên |
| **Khách đi** (`today.departures`) | Đơn ngày đi = `date`, `in_house` (chưa trả) và `checked_out` (chip `status.booking.checked_out` "Đã trả") | `cancelled`, `no_show` | Chưa trả trước; theo trạng thái nhắc US-031 (`overdue` > `call_needed` > `reminded_waiting` > `replied`) |
| **Giữ chỗ chưa cọc** (**(mới)** `today.holds_arriving` "Giữ chỗ chưa cọc – đến hôm nay ({n})") | Đơn `hold` có ngày đến = `date` | – | `holdExpiresAt` tăng dần |

### 2.2 Trường mỗi dòng (`ReservationSummary`)
| Trường | Hiển thị | Vai |
|---|---|---|
| `code`, `guestDisplayName` | Mã đơn + tên gọi | FD+ |
| `roomNo` | Căn; `null` + `conflictState = open` → chip "Chưa gán căn" + gợi ý (`today.unassigned_hint`) | FD+ |
| `channelCode`, `nights`, `stayType` | Kênh, số đêm, nhãn dài hạn | FD+ |
| `etaTime` | Giờ đến dự kiến (từ check-in online hoặc lễ tân ghi) | FD+ |
| `registrationStatus` | Chip khai báo (`today.no_docs`, `today.prechecked` khi đã check-in online, `today.reg_due`) | FD+ |
| `balanceDueVnd` | "Còn phải thu {amount}" | FD+ (`x-visible-to`) |
| `holdExpiresAt` | `today.hold_left` | Khối giữ chỗ |
| `reminderState` (khách đi) | Nhãn US-031 (EP03-05 4.4) | FD+ |
| `hasArrivalSameRoomToday` (khách đi) | Chip "Có khách đến cùng căn hôm nay" **(mới)** – để ưu tiên trả phòng/dọn | FD+ |

### 2.3 Nút (AC2)
- Dòng `confirmed` → "Nhận phòng" (`drawer.action.check_in`) mở S06 (EP03-05 mục 1). Nút chỉ dùng được trên thiết bị được cấp (`Me.properties[].deviceTrusted = true` – S06 ✔ Q); máy chưa cấp → nút khóa + chú thích `error.DEVICE_NOT_TRUSTED`. Đơn `conflictState = open` → nút khóa, hiện "Gán căn trước" (US-139 AC3).
- Dòng `in_house` của khối Khách đi → "Trả phòng" (`drawer.action.check_out`) mở S07.
- Dòng đã chuyển → chip "Đã nhận"/"Đã trả", không có nút.
- Khối giữ chỗ: "Mở đơn" (`today.open_booking`); không có nút nhận phòng (đơn `hold` không nhận phòng được – SM-01).
- Nguyên tắc EP00 0.4: nút theo `allowedActions` do server tính – `ReservationSummary` chưa có trường này → **E01-03**; trước khi có, client hiện nút theo trạng thái như trên và server vẫn kiểm (409 `INVALID_TRANSITION`/`CHECKIN_CONDITIONS_NOT_MET`).

### 2.4 Tham số `date`
Mặc định = ngày nghiệp vụ hiện tại. Cho chọn ngày khác trong [hôm nay − 7, hôm nay + 7] để xem kế hoạch `[GIẢ ĐỊNH BA – ràng buộc giao diện]`; ngoài khoảng → 422 mã trường **`VALUE_OUT_OF_RANGE`** (ARC B-20 – `DATE_INVALID` chỉ dùng cho ngày sai lịch). Ngày khác hôm nay: **không** có nút Nhận/Trả phòng (chỉ xem). 01:30 ngày 21/10 vẫn là ngày 20/10 → đơn đến 20/10 hiện và nhận phòng được (AC3).

---

## 3. "Cần chú ý" (US-012 trừ AC2; BR-907) – `listAttentionItems`, `resolveAttentionEvent`

### 3.1 Danh mục mục R2
Server lọc theo vai (không lọc ở client). "Mức": `critical` (đỏ), `warning` (vàng), `info`. Nguồn: `computed` (tính lúc đọc, tự hết khi trạng thái nghiệp vụ đổi) hoặc `event` (bảng `attention_event`, đóng bằng `resolveAttentionEvent`).

| `kind` | Điều kiện (BR) | Nguồn | Mức | OWN | MGR | FDL/FD | Dòng hiển thị (chuỗi) → bấm mở |
|---|---|---|---|:-:|:-:|:-:|---|
| `registration_due` | Đơn đến hôm nay (`confirmed`) hoặc `in_house` có khai báo trước `sent`; hạn theo BR-602 (VN) / BR-603 (NN, giờ đến thực tế + giờ của BR-603); đơn chưa nhận phòng: hạn chưa có (AC1) | computed | warning | ✔ | ✔ | ✔ | `today.registration` + `{n}` đơn + hạn sớm nhất (`today.reg_due` / `today.reg_due_foreign` khi chưa nhận) → S09 lọc hôm nay |
| `registration_overdue` | Quá `deadlineAt` mà chưa `sent` (J5) | computed | critical | ✔ | ✔ | ✔ | "Quá hạn khai báo: {codes}" **(mới)** → S09 |
| `visa_expiring` | Khách NN có thị thực/tạm trú hết trước ngày đi (BR-605; `visa_alert_on ≤ hôm nay` – J14) | computed | warning | ✔ | ✔ | ✔ | **Chỉ mã đơn + căn** (SR-RET-06) **(mới)** `today.visa_expiring` "Đơn {code} · căn {room}: thị thực hết trước ngày đi" → S09 (xem ngày hết hạn ở màn giấy tờ, thiết bị được cấp). Xem lệch AC3 – mục 3.4 |
| `hold_expiring` | Giữ chỗ còn ≤ `hold_expiry_reminder_hours` tới hạn (BR-303) | computed | warning | ✔ | ✔ | ✔ | `today.holds` + `today.hold_left` → đơn |
| `room_ooo` | Khối OOO `active` phủ hôm nay (AC4) | computed | info | ✔ | ✔ | ✔ | **(0.2)** một dòng gộp: `attn.room_ooo_rooms` "Căn đang khóa sửa chữa: {rooms}" (`{rooms}` ghép từ `roomNos`, dạng "401 · The Pine" – BR-012). Server **không** trả ngày mở bán (`params` chỉ `count`, mục 3.5) → không dùng câu có `{date}`; xem ngày ở màn khối OOO → danh sách khối OOO / phiếu sửa |
| `work_order_high_open` | Phiếu mức Cao chưa `done`/`cancelled` (BR-809, AC4) | computed | warning; `critical` khi `isOverdue` | ✔ | ✔ | ✔ | "{WO} · căn {room} · {title}" → phiếu (EP07 6) |
| `work_order_overdue` **(E01-04)** | Phiếu TB/Thấp quá hạn xử lý, hoặc quá `partsExpectedDate` khi `waiting_parts` (BR-809, W3) | computed | warning | ✔ | ✔ | ✔ | "{WO} quá hạn xử lý" → phiếu |
| `ooo_ending_work_open` **(E07-13)** | Khối OOO tới ngày cuối còn khóa mà phiếu chưa xong | computed | critical | ✔ | ✔ | ✔ | "Căn {room} sẽ mở bán lại {date} nhưng {WO} chưa xong" + nút "Kéo dài khóa" |
| `vip_arrival` | Khách tag VIP/Khách quen (EP00 11.2) có đơn đến hôm nay (AC7) | computed | info | ✔ | ✔ | ✔ | "Khách {tag} {name} đến hôm nay · căn {room}" → đơn |
| `no_show_call` / `no_show_mark` | Mốc gọi / mốc đánh dấu không đến (BR-311; J6, J7) | computed | warning | ✔ | ✔ | ✔ | `today.noshow_when`, `today.log_contact` → đơn |
| `capacity_conflict` | Đơn OTA nhận với số khách > sức chứa căn (`Reservation.capacityConflict = true` – DOM D-1, OpenAPI 0.3.5); tự hết khi đổi căn đủ chỗ hoặc sửa số khách | computed | `critical` nếu đến hôm nay/ngày mai, còn lại `warning` `[GIẢ ĐỊNH BA – như `overbooking`]` | ✔ | ✔ | ✔ | **(mới)** `today.capacity_conflict` "Đơn {code} · căn {room}: {n} khách, căn tối đa {max} – đổi căn hoặc xác nhận lại số khách" → đơn |
| `overbooking` | Đơn OTA xung đột chưa gán căn (`overbooking_incident open` – BR-312, BR-317; **S1c**) | event (tự đóng khi gán căn) | `critical` khi (14:00 ngày đến − bây giờ) ≤ 24 giờ hoặc đã tới ngày đến; xa hơn `warning` (BR-317 (5), DOM D-14 c) | ✔ | ✔ | ✔ | `today.unassigned_title` + `today.unassigned_hint` → rack làn "Chưa gán căn" |
| `unassigned_with_free_room` | Còn căn trống phù hợp mà đơn xung đột chưa gán (R-06b – J17) | event (tự đóng khi gán) | warning | ✔ | ✔ | ✔ | "Có căn trống cho đơn {code} – gán ngay" → rack |
| `channel_sync_error` | Lệnh đồng bộ lỗi quá ngưỡng BR-905/BR-317 (6) (R2: lớp giả lập – AC7) | event | critical | ✔ | ✔ | ✔ | "Đồng bộ kênh lỗi – {channel}, căn {room}" + hướng dẫn đóng bán thủ công trên extranet **(mới)** → S18 nhật ký đồng bộ (FD xem – rbac ghi chú 12) |
| `deposit_after_cancel` | Tiền về cho đơn đã tự hủy (giữ chỗ hết hạn) | event | warning | ✔ | ✔ | ✔ | `today.money_after_cancel` + `_body` → đơn |
| `guest_request_overdue` **(E14-05)** | Yêu cầu khách quá hạn trả lời (BR-811, US-110 AC2) | computed | warning | ✔ | ✔ | ✔ | "Yêu cầu {type} căn {room} chưa được nhận – quá {m} phút" → S30 |
| `extra_guest_kit_overdue` **(E01-04)** | Việc bộ đồ dùng thêm quá `dueAt` chưa xong (BR-812 (5), P07 E-K5) | computed | warning | ✔ | ✔ | ✔ | "Bộ đồ dùng thêm căn {room} chưa chuẩn bị – khách đến {time}" → việc HK |
| `room_status_mismatch` **(E01-04)** | Lệch buồng – đơn (BR-806): `OC`/`OD` không có đơn `in_house`, hoặc `in_house` mà buồng `VC`/`VD` | computed | warning | ✔ | ✔ | ✔ | "Căn {room}: trạng thái buồng '{status}' không khớp đơn" → S10 |
| `reconcile_overdue` **(E01-04)** | Giao dịch chờ đối soát quá `bank_reconcile_alert_days` (BR-527, SM-12; `listPayments.reconcileOverdue`) | computed | warning | ✔ | ✔ | ✖ | "{n} giao dịch chờ đối soát quá {days} ngày" → S33 |
| `foc_threshold` | BR-435 – mục 3.3 (AC6, **AC8**) | computed (tính khi OWN mở trang – PO quyết, ARC B-22) | warning | ✔ | ✖ | ✖ | Mục 3.3 (`attn.foc_pct` / `attn.foc_count`, vắng số → `attn.foc_threshold`) → `link` của mục (hộp duyệt lọc FOC tháng) |
| `data_quality` | Lệch R-04/R-05/R-06a (J17) | event | warning | ✔ | ✖ | ✖ | "Số liệu cần kiểm tra: {rule}" **(mới)** |
| `security_alert` | Cảnh báo bảo mật cho OWN (SR-LOG-06; khóa tài khoản nhiều lần…) | event | critical | ✔ | ✖ | ✖ | Theo loại (SEC) → S26/S27 |
| `ota_no_show_report` **(0.3.7 D1, US-136 AC2/AC5)** | Đánh dấu không đến đơn kênh `ota` (`params.action = report`) / khôi phục đơn OTA đã báo (`revoke`) | event (lễ tân đóng sau khi làm trên extranet) | warning | ✔ | ✔ | ✔ | `attn.ota_no_show_report` / `attn.ota_no_show_revoke` (`{channel}`, `{code}`) + nút `attn.reported_channel` "Đã báo kênh" → đơn |
| `closed_reservation_credit` **(0.3.7 D1, S4-06, BR-522)** | Đơn đã đóng (hủy/no-show) còn tiền dư | event – **tự đóng** khi chi hoàn đủ hoặc khách đồng ý để lại; **không** đóng tay | warning | ✔ | ✔ | ✔ | `attn.closed_reservation_credit` (`{code}`, không số tiền) → đơn |
| `website_request_new` **(0.3.7 bổ sung 2, US-155 – cài theo lịch luồng LP)** | Còn yêu cầu đặt phòng từ website `new` chưa ai nhận (BR-912, BR-907) | computed | `warning` khi yêu cầu `new` cũ nhất đã quá `replyBy`, còn lại `info` | ✔ | ✔ | ✔ | **(mới – đề nghị UXD)** `attn.website_request_new` "{n} yêu cầu đặt phòng từ website chưa có người nhận"; `count` = 1 thì kèm mã yêu cầu `{code}`; không tên/SĐT → `/website-requests?status=new` (`specs/EP19-website-requests.md`). SAL không nhận mục này (nhận thông báo) |
| `rent_due_soon`, `lease_expiring` | **Dời R3** (US-012 AC2, J12, J13) | – | – | – | – | – | Không sinh ở R2 |
| `meter_not_read` | **R3** (US-064) | – | – | – | – | – | Không sinh ở R2 |

AC4: giữ chỗ trong khoảng nhắc, một khối OOO, một phiếu mức Cao → **ba dòng riêng** (mỗi `kind` một dòng; nhiều đơn cùng `kind` gộp một dòng có `count` – trừ `work_order_*`, `vip_arrival`, `overbooking` mỗi đối tượng một dòng) (DOM D-14 b).

### 3.2 Thứ tự, rỗng, đóng mục
- Sắp: `critical` → `warning` → `info`; trong mức theo `dueAt` tăng dần (mục không có hạn xếp sau).
- Rỗng (AC5): **(mới)** `today.attention_empty` "Không có việc cần chú ý." (OWN/MGR dùng câu wireframe L8 "Không có gì cần chú ý"). KPI vẫn hiện.
- Mục `computed` không có nút đóng – tự hết khi xử lý nghiệp vụ (khai báo `sent`, phiếu `done`, gán căn…).
- Mục `event` có nút "Đã xử lý" → `resolveAttentionEvent` (`Idempotency-Key`):

| Trường | Kiểu | BB | Kiểm tra | Lỗi |
|---|---|---|---|---|
| `note` | text | ĐK: **B** với mức `critical` (`channel_sync_error`, `security_alert`); K với loại khác `[GIẢ ĐỊNH BA]` | 3–500, V-09 | `REASON_REQUIRED`; `CARD_NUMBER_DETECTED` |

  Ai đóng: mục FD thấy → FD+; `data_quality`, `security_alert` → OWN. `overbooking`, `unassigned_with_free_room`, `closed_reservation_credit` **không** đóng tay (tự đóng khi gán căn/hủy, khi chi hoàn đủ/khách để lại) – Desk không hiện nút "Đã xử lý"; gọi vẫn bị → 409 `INVALID_TRANSITION` (`currentState = open`). **Thứ tự kiểm ở server (0.3.7 bổ sung 1)**: mục không tồn tại / đã đóng / vai không thấy → 404 `NOT_FOUND` (không lộ mục tồn tại; mục biến mất sau khi tải lại) → loại tự đóng → 409 → `note` (mục `critical` thiếu/ngắn → 422 `REASON_REQUIRED`; > 500 → `TOO_LONG`; giống số thẻ → `CARD_NUMBER_DETECTED`). Đóng xong: 204, SSE `attention.changed` (FD+). Mục `event`: `count` = 1, `dueAt` = **lúc sinh mục** (không phải hạn).

### 3.3 Cảnh báo thất thoát FOC – BR-435 (AC6; rbac 5.2 quy tắc 4)
- **Chỉ OWN** nhận (MGR, FDL, FD không thấy – AC6, rbac ghi chú 1).
- Hai điều kiện, mỗi điều kiện một dòng:
  - (a) **Tỷ lệ** – `params.check = foc_pct_of_room_revenue`: giá trị FOC tháng (K-18 – Σ |dòng FOC âm `posted`| có ngày áp dụng trong tháng lịch của ngày nghiệp vụ hiện tại, **gồm** FOC tự áp BR-436 (4); **không** gồm dòng chờ duyệt, bị từ chối, đã đảo) > `foc_alert_pct_of_room_revenue` × doanh thu phòng tháng (K-06 – Σ `stay_night.room_revenue` các đêm `sold` từ ngày 1 tới đêm nay). Dòng `attn.foc_pct` "Miễn phí tháng này bằng {pct}% doanh thu phòng – vượt ngưỡng {threshold}%" (`{pct}` ← `params.pct`, 1 chữ số thập phân; `{threshold}` ← `params.threshold`). Doanh thu phòng tháng = 0 mà FOC > 0 → vẫn cảnh báo, server **không** gửi `pct` → Desk dùng `attn.foc_threshold` "Miễn phí tháng này vượt ngưỡng cảnh báo" (Q-15).
  - (b) **Số lần theo người duyệt** – `params.check = foc_count_per_approver`: số yêu cầu FOC `approved` (SM-10) theo người duyệt trong tháng lịch > `foc_alert_count_per_approver` → mỗi người một dòng `attn.foc_count` "Một người đã duyệt hoặc tự áp {count} lần miễn phí tháng này – vượt ngưỡng {max}" (`{count}` ← `params.count`, `{max}` ← `params.max`; lần tự áp minibar của FD/FDL tính vào người tự áp – DOM D-14 a). **Không** nêu tên người duyệt trên dòng (SEC-BE-52 – `params` không chứa tên); OWN bấm dòng → `link` `/approvals?type=foc&month=YYYY-MM&approverId=<id>` mở danh sách của đúng người đó.
  - **Bỏ so với bản 0.1** (BE-D không trả, UXD duyệt 17/10 – `s4-UXD.md` mục D): khóa `today.foc_alert_pct`, `today.foc_alert_count` và tham số `{foc}` (số tiền FOC), `{month}`, `{name}`. Tháng luôn là tháng nghiệp vụ hiện tại ("tháng này"); số tiền FOC xem ở hộp duyệt/báo cáo FOC (S22 – R3).
- Kỳ so sánh là **lũy kế từ đầu tháng tới hôm nay** (cảnh báo sớm – DOM D-14 a). Bấm → `link` của mục: danh sách yêu cầu duyệt lọc loại FOC tháng này (S23; dòng (b) lọc thêm người duyệt; báo cáo FOC S22 là R3).
- **US-012 AC8 (PO quyết 16/10, ARC B-22)**: R2 **tính khi đọc** mỗi lần OWN mở Tổng quan (`listAttentionItems`, truy vấn `folio_line` + `approval_request` + `stay_night` tháng hiện tại) – không lưu, không job. Thông báo đẩy hằng ngày (J21) thuộc R3. MGR/FDL/FD không bao giờ nhận dòng này (AC6). Ví dụ kiểm: ngưỡng tỷ lệ × doanh thu phòng lũy kế theo ví dụ BR-435 (186,4 tr → 5,59 tr).

### 3.4 US-012 AC3 theo SEC SR-RET-06 (PO đã sửa AC 16/10)
US-012 AC3 yêu cầu dòng thị thực "nêu căn và **ngày hết hạn**"; SR-RET-06 (SEC, M9) chỉ cho mục `visa_expiring` chứa **mã đơn** (ngày hết hạn là dữ liệu giấy tờ). **Đã chốt (PO 16/10)**: AC3 theo SEC – dòng `visa_expiring` chỉ có **mã đơn + căn**, **không** có ngày hết hạn; bấm vào mở màn giấy tờ (S09, thiết bị được cấp, có nhật ký C3) để xem ngày. QA sửa TC AC3 (không kiểm ngày trên dòng).

### 3.5 Khóa `params` từng `kind` và cách điền chuỗi (OpenAPI 0.3.7 bổ sung 1 – đúng `ATTENTION_PARAM_KEYS` server đã cài)
Danh sách khóa là **đóng** (server sinh khóa lạ → lỗi lúc sinh mục, không lọc im lặng); `params` chỉ chứa đếm, mã, số căn, ngày – **không** tên, SĐT, ghi chú, số tiền của khách (SEC-BE-52). Desk điền chuỗi đúng theo bảng; thiếu khóa hoặc `kind` lạ → câu chung `attn.other` "Mục cần kiểm tra: {n}" (không lỗi màn).

| `kind` | Khóa `params` (kiểu) | Trường khác dùng | Chuỗi Desk (tham số ← nguồn) | Người thấy |
|---|---|---|---|---|
| `foc_threshold` | `check` = `foc_pct_of_room_revenue` → `pct` (số 0–1000, 1 chữ số thập phân; **vắng** khi doanh thu phòng = 0), `threshold`; `check` = `foc_count_per_approver` → `count` (nguyên), `max` | `link` (dòng (b) có `approverId`) | `attn.foc_pct` ({pct} ← `pct`, {threshold} ← `threshold`); vắng `pct` → `attn.foc_threshold`; `attn.foc_count` ({count}, {max}) | Chỉ OWN |
| `reconcile_overdue` | `count`, `oldestDays` | – | `attn.reconcile_overdue` ({n} ← `count`, {days} ← `oldestDays` = giao dịch cũ nhất) | MGR+ |
| `no_show_call`, `no_show_mark` | `count`, `time` (`HH:mm`) | `refCode` khi `count` = 1 | `attn.no_show_call` ({code} ← `refCode`, {time} ← `time`); `attn.no_show_mark` ({code}) | FD+ |
| `registration_due` | `count`, `deadline` (thời điểm ISO hoặc `HH:mm`) | `dueAt` | `attn.registration_due` ({n} ← `count`, {time} ← `deadline` đổi sang `HH:mm` giờ cơ sở) | FD+ |
| `capacity_conflict`, `overbooking`, `unassigned_with_free_room`, `hold_expiring`, `room_ooo`, `extra_guest_kit_overdue`, `registration_overdue`, `guest_request_overdue` | `count` | `refCode`, `roomNos`, `dueAt`, `reservationIds` | `attn.<kind>` ({n} ← `count`; {code} ← `refCode`; {room}/{rooms} ← `roomNos` dạng "số · tên"; {time} ← `dueAt`). `room_ooo`: **không** có `endDate`/`dueAt` → `attn.room_ooo_rooms` | FD+ |
| `data_quality` | `check` (`registration_stay_not_closed`, `registration_party_docs_unlinked`, kiểm DATA khác) | `refCode`, `dueAt` (hạn tự xóa với `registration_party_docs_unlinked`), `count` | `attn.dq_stay_not_closed` / `_one`; `attn.dq_party_docs_unlinked` / `_one` ({time} ← `dueAt`); `check` khác → `attn.data_quality` | FD+ khi `check` bắt đầu `registration_`; còn lại chỉ OWN |
| `deposit_after_cancel`, `security_alert` | `code` (mã chứng từ, ví dụ `OTM-00171`) | – | `today.money_after_cancel` ({code}); `attn.security_alert` | FD+ / chỉ OWN |
| `ota_no_show_report` | `action` (`report` hoặc `revoke`), `channel` (mã kênh) | `refCode` = mã đơn | `attn.ota_no_show_report` / `attn.ota_no_show_revoke` ({channel} ← tên kênh theo mã, {code} ← `refCode`) | FD+ |
| `ooo_ending_work_open` | `roomNo`, `endDate` (`YYYY-MM-DD`) | `refCode` = mã WO | `attn.ooo_ending_work_open` ({room} ← `roomNo`, {date} ← `endDate`, {code} ← `refCode`) | FD+ (và MT qua thông báo) |
| `website_request_new` (bổ sung 2) | `count` | `refCode` khi `count` = 1, `dueAt` = `replyBy` sớm nhất, `link` | `attn.website_request_new` (đề nghị UXD – mục 3.1) | FD+ |
| `vip_arrival` (mỗi đơn một dòng, `info`), `closed_reservation_credit`, `visa_expiring`, mọi `kind` khác | không có `params` | `refCode`, `roomNos`, `dueAt` | `attn.vip_arrival`, `attn.closed_reservation_credit` ({code} ← `refCode`), `attn.visa_expiring` ({code}) | FD+ |

Định dạng giá trị (SEC-BE-52): đếm là số nguyên ≥ 0; `pct`/`threshold` số 0–1000; `check`/`channel` mã `snake_case` ≤ 40 ký tự; `roomNo` 1–10 ký tự chữ-số. `kind` chưa có nguồn ở R2 (`rent_due_soon`, `lease_expiring`, `meter_not_read`, `channel_sync_error`, `work_order_high_open`, `work_order_overdue`, `room_status_mismatch`): khóa mới phải vào hợp đồng (ARC) **trước** khi server thêm vào danh sách cho phép (ARC 11.3 (4)) – BA cập nhật bảng này cùng lúc.

---

## 4. Cập nhật thời gian thực – `streamEvents` (SSE)
| Sự kiện | Màn gọi lại |
|---|---|
| `reservation.changed` | `getTonightKpi`, `getArrivalsDepartures`, `listAttentionItems` |
| `room.status_changed` | `getArrivalsDepartures` (chip căn sẵn sàng), `listAttentionItems` (`room_status_mismatch`) |
| `attention.changed` | `listAttentionItems` |
| `guest_request.changed` (thay `request.created` của 0.2) | Khối yêu cầu khách (FD), `listAttentionItems` (`guest_request_overdue`) |
| `hk_task.changed`, `work_order.changed` | `listAttentionItems` (mục phiếu, bộ đồ dùng thêm, `ooo_ending_work_open`) |
| `registration.changed` | `listAttentionItems` (`registration_*`, `data_quality` khai báo) |
| `payment.changed` (chỉ MGR+ và người ghi khoản) | `listAttentionItems` (`reconcile_overdue` – MGR+) |
| `website_request.changed` (bổ sung 2 – khi cài US-155) | `listAttentionItems` (`website_request_new`), số đếm menu "Yêu cầu từ website" |
| `notification.created` | Hộp thông báo |

**Người nhận theo vai** (OpenAPI 0.3.7 bổ sung 1, `architecture.md` mục 12, `rbac-matrix.md` mục 8 quy tắc 11): server lọc, client **không** lọc thêm. Màn Hôm nay/Tổng quan chỉ mở cho FD+ nên nhận đủ các loại trên, trừ `payment.changed` với FD/FDL (chỉ khoản chính mình ghi).

- Gộp sự kiện dồn dập: chờ 1 giây rồi gọi lại một lần cho mỗi API `[GIẢ ĐỊNH BA – ràng buộc kỹ thuật cho FE]`. Sự kiện chỉ có loại + ID (không dữ liệu – architecture 12); dữ liệu luôn lấy lại qua API theo quyền của người xem.
- Mất SSE: tự nối lại (lùi dần tới 30 giây); trong lúc mất → gọi lại khi trang được focus + mỗi 30 giây; nối lại → gọi lại toàn bộ. Mất mạng: banner `shell.offline_desk` "Mất kết nối. Dữ liệu lúc {time} – chỉ xem…"; nút Nhận/Trả phòng, Đã xử lý khóa (`rsv.need_online`).
- Mục có hạn theo giờ (`hold_expiring`, `registration_due`, `no_show_*`) đổi theo thời gian dù không có sự kiện → client gọi lại `listAttentionItems` mỗi 60 giây khi màn đang mở `[GIẢ ĐỊNH BA]`.

---

## 5. US-013 (Should R2) – bộ đếm vận hành cho lễ tân (khung)
Ba ô trên "Hôm nay": việc buồng phòng chưa xong (`listHkTasks.summary` – total − done), phiếu sửa đang mở (`listWorkOrders` trạng thái `new`/`in_progress`/`waiting_parts`), yêu cầu khách chưa xong (`listGuestRequests` chưa kết thúc); bấm mở đúng màn (S10, S11, S30). Dùng API sẵn có, không cần endpoint mới; chỉ làm khi PO kéo vào sprint.

---

## 6. Trạng thái màn (DoD)
| Khối | Đang tải | Rỗng | Lỗi | Mất mạng |
|---|---|---|---|---|
| KPI | Khung xương 4 ô | – (luôn có số; mẫu số 0 → "–") | `today.error_title` + Thử lại | Số lúc {time} |
| Khách đến/đi | Khung xương | `today.empty_title`/`_body` khi cả ba khối rỗng; từng khối rỗng: "Không có khách đến hôm nay" **(mới)** | như trên | Chỉ xem |
| Cần chú ý | Khung xương | `today.attention_empty` (AC5) | như trên | Chỉ xem |

---

## 7. Truy vết story → mục (AC Must R2 theo R-C)
| Story / AC | Mục |
|---|---|
| US-010 AC1 | 1.1 (ví dụ 6/9) |
| US-010 AC2 | 0, 1.2, 4 |
| US-010 AC3 | 0, 1.1 (`businessDate`) |
| US-011 AC1–AC3 | 2.1–2.4 |
| US-012 AC1 | 3.1 `registration_due`/`_overdue` |
| US-012 AC2 | **Dời R3** |
| US-012 AC3 | 3.1 `visa_expiring`, 3.4 (mã đơn + căn – theo SEC) |
| US-012 AC4 | 3.1 (`hold_expiring`, `room_ooo`, `work_order_high_open` – ba dòng) |
| US-012 AC5 | 3.2 |
| US-012 AC6 | 3.1, 3.3 |
| US-012 AC7 | 3.1 `channel_sync_error`, `vip_arrival` |
| US-012 AC8 | 3.1 `foc_threshold`, 3.3 (tính khi OWN mở trang), 3.5 (`params`) |
| US-136 AC2/AC5 (phần Sprint 4) | 3.1 `ota_no_show_report`, 3.5 |
| S4-06 | 3.1 `closed_reservation_credit`, 3.2 (không đóng tay) |
| US-155 AC8 ("Cần chú ý") | 3.1 `website_request_new`, 3.5 |
| (0.3.5) đơn OTA vượt sức chứa | 3.1 `capacity_conflict` |
| metrics S1c, S7 | 1.1 `unassignedConflictReservations`; 3.1 `overbooking` · S7 "giữ chỗ treo = 0" theo dõi qua `hold_expiring` + J1 (không có ô riêng ở R2 `[GIẢ ĐỊNH BA]`) |

---

## 8. Đề nghị hợp đồng cho ARC (OpenAPI 0.3.4 → 0.3.5) và vai khác
| # | Gửi | Nội dung |
|---|---|---|
| E01-01 | ARC | `TonightKpi.metricRefs.unassignedConflictReservations` = `S1c` (đang ghi `S1b`; metrics Q-05: S1c = đêm xung đột chưa gán; S1b = cảnh báo overbooking do đồng bộ trễ); mô tả trường sửa "S1b" → "S1c" |
| E01-02 | ARC | `TonightKpi.arrivalsCheckedIn`, `departuresCheckedOut` (để hiện "{đã nhận}/{tổng}"); ghi rõ định nghĩa `arrivals`/`departures` (mục 1.1, BR-404) |
| E01-03 | ARC | `ArrivalsDepartures` mỗi dòng có `allowedActions[]` (nhận phòng / trả phòng / mở đơn) theo trạng thái + vai + thiết bị; `date` giới hạn ±7 ngày → 422 `DATE_INVALID` |
| E01-04 | ARC | `AttentionItem.kind` thêm `work_order_overdue`, `extra_guest_kit_overdue`, `room_status_mismatch`, `reconcile_overdue`, `ooo_ending_work_open` (E07-13), `guest_request_overdue` (E14-05), `registration_overdue` (đã có); `AttentionItem` thêm `refCode` (mã WO/đơn để hiện dòng không cần gọi thêm) và `params` (chỉ số, mã – không C2/C3) |
| E01-05 | **Đã quyết** (PO: làm R2, tính khi đọc – US-012 AC8; ARC B-22). Nội dung cũ: ARC + PO | `foc_threshold` tính khi đọc cho OWN ở R2 (mục 3.3); J21 (thông báo hằng ngày) giữ R3. Nếu PO không đồng ý → US-012 AC6 vẫn đạt (FD không thấy), nhưng OWN chưa có cảnh báo BR-435 tới R3 – cần ghi rõ trong round-summary |
| E01-06 | **Đã quyết** (PO sửa AC3 theo SEC). Nội dung cũ: PO + SEC | US-012 AC3 ↔ SR-RET-06 (mục 3.4) |
| E01-07 | DATA | Xác nhận: (a) công thức BR-435 lũy kế đầu tháng, gồm FOC tự áp (3.3); (b) `oooRooms` chỉ đếm căn bán được; (c) S7 không có ô riêng ở R2 |
| E01-08 | DOM | **Đã trả lời** (s2-DOM D-14; áp 16/10 Sprint 2). Nội dung cũ: Xác nhận: kỳ BR-435 (lũy kế); cách gộp dòng "Cần chú ý" (3.1); ngưỡng "critical" của `overbooking` theo BR-317 (5) |
| E01-09 | UXD | Chuỗi **(mới)** trong tài liệu; sửa `today.kpi_occupancy_note` cho rõ "{occupied}/{available} căn có khách đêm nay ({blocked} căn khóa)"; nhãn cho mọi `kind` mới; ẩn thẻ ADR/RevPAR/biểu đồ ở R2 (US-014 R3) |
| E01-10 | QA | Ca đồng hồ giả lập 05:59/06:00 (đêm nay, khách đến), ví dụ 6/9 (AC1), OOO `planned` không trừ mẫu số, đơn `hold` không vào tử số, đơn OTA chưa gán không vào tử số; FD/MGR không thấy `foc_threshold`; ba dòng riêng AC4 |

## 9. Lịch sử thay đổi
| Ngày | Round | Thay đổi | Người |
|---|---|---|---|
| 16/10/2026 | 2 (Sprint 2) | Bản đầu: KPI đêm nay theo metrics v0.2 (Occupancy chỉ đêm đã gán, S1c riêng, giữ chỗ riêng), khách đến/đi BR-404, "Cần chú ý" theo vai + BR-435 (chỉ OWN), SSE; lệch AC3 ↔ SR-RET-06; đề nghị E01-01…10 | BA |
| 16/10/2026 | 2 (Sprint 2 – phản hồi) | Áp DOM D-14 (BR-435 lũy kế, gộp dòng, mức `overbooking`), ARC B-20 (`VALUE_OUT_OF_RANGE`) – FB-R2-DOM-BA-01 | BA |
| 16/10/2026 | 2 (Sprint 2 – PO quyết) | US-012 AC3 theo SEC (mã đơn + căn), AC8 BR-435 tính khi OWN mở trang; thêm `capacity_conflict` (0.3.5); E01-05, E01-06 đã quyết | BA |
| 17/10/2026 | 2 (Sprint 4 – trả lời UXD `s4-UXD.md` mục D/E, BE-D, ARC 0.3.7 bổ sung 1) | v0.2: **3.3** dùng khóa chuỗi thật `attn.foc_pct` / `attn.foc_count` (vắng `pct` → `attn.foc_threshold`), bỏ `{foc}`, `{month}`, `{name}` (server không trả – không nêu tên người duyệt, đi qua `link` có `approverId`); **3.5 mới** – bảng khóa `params` từng `kind` đúng `ATTENTION_PARAM_KEYS` + cách điền chuỗi + người thấy; 3.1 sửa `room_ooo` (chỉ `count` + `roomNos`, câu `attn.room_ooo_rooms`), thêm `ota_no_show_report`, `closed_reservation_credit`, `website_request_new`; 3.2 thứ tự kiểm `resolveAttentionEvent` (404 → 409 loại tự đóng → `note`), `closed_reservation_credit` không đóng tay; mục 4 bảng SSE theo danh mục 0.3.7 (bỏ `request.created`) + người nhận theo vai | BA |
