# Đặc tả mức trường – EP01 Tổng quan / Hôm nay (phần R2)

- Tác giả: BA | Round 2 – Sprint 2 (đi trước Sprint 4 một sprint) | Ngày: 16/10/2026 | Phiên bản: 0.1
- Phạm vi (Must R2 theo R-C): US-010 (KPI đêm nay), US-011 (khách đến/đi hôm nay), US-012 **trừ AC2** (kỳ thu/HĐ – dời R3 cùng J12, J13). **Should R2**: US-013 (bộ đếm việc vận hành – mục 5, chỉ khung). **R3**: US-014 (ADR, RevPAR, biểu đồ 30 + 14 ngày), K-04…K-22 theo tháng (metrics "Lộ trình hiển thị").
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
Mặc định = ngày nghiệp vụ hiện tại. Cho chọn ngày khác trong [hôm nay − 7, hôm nay + 7] để xem kế hoạch `[GIẢ ĐỊNH BA – ràng buộc giao diện]`; ngoài khoảng → 422 `DATE_INVALID`. Ngày khác hôm nay: **không** có nút Nhận/Trả phòng (chỉ xem). 01:30 ngày 21/10 vẫn là ngày 20/10 → đơn đến 20/10 hiện và nhận phòng được (AC3).

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
| `room_ooo` | Khối OOO `active` phủ hôm nay (AC4) | computed | info | ✔ | ✔ | ✔ | `rack.ooo_until` "Căn {room} khóa · mở bán lại {date}" + mã phiếu → phiếu sửa |
| `work_order_high_open` | Phiếu mức Cao chưa `done`/`cancelled` (BR-809, AC4) | computed | warning; `critical` khi `isOverdue` | ✔ | ✔ | ✔ | "{WO} · căn {room} · {title}" → phiếu (EP07 6) |
| `work_order_overdue` **(E01-04)** | Phiếu TB/Thấp quá hạn xử lý, hoặc quá `partsExpectedDate` khi `waiting_parts` (BR-809, W3) | computed | warning | ✔ | ✔ | ✔ | "{WO} quá hạn xử lý" → phiếu |
| `ooo_ending_work_open` **(E07-13)** | Khối OOO tới ngày cuối còn khóa mà phiếu chưa xong | computed | critical | ✔ | ✔ | ✔ | "Căn {room} sẽ mở bán lại {date} nhưng {WO} chưa xong" + nút "Kéo dài khóa" |
| `vip_arrival` | Khách tag VIP/Khách quen (EP00 11.2) có đơn đến hôm nay (AC7) | computed | info | ✔ | ✔ | ✔ | "Khách {tag} {name} đến hôm nay · căn {room}" → đơn |
| `no_show_call` / `no_show_mark` | Mốc gọi / mốc đánh dấu không đến (BR-311; J6, J7) | computed | warning | ✔ | ✔ | ✔ | `today.noshow_when`, `today.log_contact` → đơn |
| `overbooking` | Đơn OTA xung đột chưa gán căn (`overbooking_incident open` – BR-312, BR-317; **S1c**) | event (tự đóng khi gán căn) | critical (đến ≤ 24 giờ), warning (xa hơn) – BR-317 (5) | ✔ | ✔ | ✔ | `today.unassigned_title` + `today.unassigned_hint` → rack làn "Chưa gán căn" |
| `unassigned_with_free_room` | Còn căn trống phù hợp mà đơn xung đột chưa gán (R-06b – J17) | event (tự đóng khi gán) | warning | ✔ | ✔ | ✔ | "Có căn trống cho đơn {code} – gán ngay" → rack |
| `channel_sync_error` | Lệnh đồng bộ lỗi quá ngưỡng BR-905/BR-317 (6) (R2: lớp giả lập – AC7) | event | critical | ✔ | ✔ | ✔ | "Đồng bộ kênh lỗi – {channel}, căn {room}" + hướng dẫn đóng bán thủ công trên extranet **(mới)** → S18 nhật ký đồng bộ (FD xem – rbac ghi chú 12) |
| `deposit_after_cancel` | Tiền về cho đơn đã tự hủy (giữ chỗ hết hạn) | event | warning | ✔ | ✔ | ✔ | `today.money_after_cancel` + `_body` → đơn |
| `guest_request_overdue` **(E14-05)** | Yêu cầu khách quá hạn trả lời (BR-811, US-110 AC2) | computed | warning | ✔ | ✔ | ✔ | "Yêu cầu {type} căn {room} chưa được nhận – quá {m} phút" → S30 |
| `extra_guest_kit_overdue` **(E01-04)** | Việc bộ đồ dùng thêm quá `dueAt` chưa xong (BR-812 (5), P07 E-K5) | computed | warning | ✔ | ✔ | ✔ | "Bộ đồ dùng thêm căn {room} chưa chuẩn bị – khách đến {time}" → việc HK |
| `room_status_mismatch` **(E01-04)** | Lệch buồng – đơn (BR-806): `OC`/`OD` không có đơn `in_house`, hoặc `in_house` mà buồng `VC`/`VD` | computed | warning | ✔ | ✔ | ✔ | "Căn {room}: trạng thái buồng '{status}' không khớp đơn" → S10 |
| `reconcile_overdue` **(E01-04)** | Giao dịch chờ đối soát quá `bank_reconcile_alert_days` (BR-527, SM-12; `listPayments.reconcileOverdue`) | computed | warning | ✔ | ✔ | ✖ | "{n} giao dịch chờ đối soát quá {days} ngày" → S33 |
| `foc_threshold` | BR-435 – mục 3.3 (AC6) | computed **(E01-05)** | warning | ✔ | ✖ | ✖ | Mục 3.3 → hộp duyệt/nhật ký FOC |
| `data_quality` | Lệch R-04/R-05/R-06a (J17) | event | warning | ✔ | ✖ | ✖ | "Số liệu cần kiểm tra: {rule}" **(mới)** |
| `security_alert` | Cảnh báo bảo mật cho OWN (SR-LOG-06; khóa tài khoản nhiều lần…) | event | critical | ✔ | ✖ | ✖ | Theo loại (SEC) → S26/S27 |
| `rent_due_soon`, `lease_expiring` | **Dời R3** (US-012 AC2, J12, J13) | – | – | – | – | – | Không sinh ở R2 |
| `meter_not_read` | **R3** (US-064) | – | – | – | – | – | Không sinh ở R2 |

AC4: giữ chỗ trong khoảng nhắc, một khối OOO, một phiếu mức Cao → **ba dòng riêng** (mỗi `kind` một dòng; nhiều đơn cùng `kind` gộp một dòng có `count` – trừ `work_order_*`, `vip_arrival`, `overbooking` mỗi đối tượng một dòng) `[GIẢ ĐỊNH BA – cách gộp]`.

### 3.2 Thứ tự, rỗng, đóng mục
- Sắp: `critical` → `warning` → `info`; trong mức theo `dueAt` tăng dần (mục không có hạn xếp sau).
- Rỗng (AC5): **(mới)** `today.attention_empty` "Không có việc cần chú ý." (OWN/MGR dùng câu wireframe L8 "Không có gì cần chú ý"). KPI vẫn hiện.
- Mục `computed` không có nút đóng – tự hết khi xử lý nghiệp vụ (khai báo `sent`, phiếu `done`, gán căn…).
- Mục `event` có nút "Đã xử lý" → `resolveAttentionEvent` (`Idempotency-Key`):

| Trường | Kiểu | BB | Kiểm tra | Lỗi |
|---|---|---|---|---|
| `note` | text | ĐK: **B** với mức `critical` (`channel_sync_error`, `security_alert`); K với loại khác `[GIẢ ĐỊNH BA]` | 3–500, V-09 | `REASON_REQUIRED`; `CARD_NUMBER_DETECTED` |

  Ai đóng: mục FD thấy → FD+; `data_quality`, `security_alert` → OWN. `overbooking`, `unassigned_with_free_room` **không** đóng tay (tự đóng khi gán căn/hủy). Mục đã đóng → 404 `NOT_FOUND` (mục biến mất khỏi danh sách sau khi tải lại).

### 3.3 Cảnh báo thất thoát FOC – BR-435 (AC6; rbac 5.2 quy tắc 4)
- **Chỉ OWN** nhận (MGR, FDL, FD không thấy – AC6, rbac ghi chú 1).
- Hai điều kiện, mỗi điều kiện một dòng:
  - (a) **Tỷ lệ**: giá trị FOC tháng (K-18 – Σ |dòng FOC âm `posted`| có ngày áp dụng trong tháng lịch của ngày nghiệp vụ hiện tại, **gồm** FOC tự áp BR-436 (4); **không** gồm dòng chờ duyệt, bị từ chối, đã đảo) > `foc_alert_pct_of_room_revenue` × doanh thu phòng tháng (K-06 – Σ `stay_night.room_revenue` các đêm `sold` từ ngày 1 tới đêm nay). Dòng **(mới)** `today.foc_alert_pct` "FOC tháng {month}: {foc} = {pct}% doanh thu phòng (ngưỡng {threshold}%)". Doanh thu phòng tháng = 0 mà FOC > 0 → vẫn cảnh báo, `{pct}` hiện "–" (Q-15).
  - (b) **Số lần theo người duyệt**: số yêu cầu FOC `approved` (SM-10) theo người duyệt trong tháng lịch > `foc_alert_count_per_approver` → mỗi người một dòng **(mới)** `today.foc_alert_count` "{name} đã duyệt {n} FOC trong tháng (ngưỡng {max})" `[GIẢ ĐỊNH BA: đếm cả lần tự áp minibar của FD/FDL vào người tự áp]`.
- Kỳ so sánh là **lũy kế từ đầu tháng tới hôm nay** `[GIẢ ĐỊNH BA – BR-435 ghi "tháng"; DOM xác nhận lũy kế hay cả tháng đã qua]`. Bấm → danh sách yêu cầu duyệt lọc loại FOC tháng này (S23; báo cáo FOC S22 là R3).
- Hợp đồng: `foc_threshold` có trong enum nhưng job J21 ghi **R3** (architecture mục 9) → đề nghị **E01-05**: R2 tính khi đọc cho OWN (truy vấn trên `folio_line` + `approval_request` + `stay_night` tháng hiện tại), J21 (thông báo hằng ngày) giữ R3.

### 3.4 Lệch giữa US-012 AC3 và SEC SR-RET-06
US-012 AC3 yêu cầu dòng thị thực "nêu căn và **ngày hết hạn**"; SR-RET-06 (SEC, M9) chỉ cho mục `visa_expiring` chứa **mã đơn** (ngày hết hạn là dữ liệu giấy tờ). Đặc tả này theo SEC (dữ liệu cá nhân ưu tiên): dòng có mã đơn + căn; ngày hết hạn xem ở màn giấy tờ (S09, thiết bị được cấp, có nhật ký). Đề nghị **E01-06**: PO sửa AC3 thành "nêu mã đơn và căn; bấm vào xem ngày hết hạn" – hoặc SEC chấp nhận hiện ngày cho FD+ trên thiết bị được cấp.

---

## 4. Cập nhật thời gian thực – `streamEvents` (SSE)
| Sự kiện | Màn gọi lại |
|---|---|
| `reservation.changed` | `getTonightKpi`, `getArrivalsDepartures`, `listAttentionItems` |
| `room.status_changed` | `getArrivalsDepartures` (chip căn sẵn sàng), `listAttentionItems` (`room_status_mismatch`) |
| `attention.changed` | `listAttentionItems` |
| `request.created` | Khối yêu cầu khách (FD) |
| `notification.created` | Hộp thông báo |
| (việc HK, phiếu sửa – tên chờ E07-08) | `listAttentionItems` (mục phiếu, bộ đồ dùng thêm) |

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
| US-012 AC3 | 3.1 `visa_expiring`, 3.4 (lệch SR-RET-06) |
| US-012 AC4 | 3.1 (`hold_expiring`, `room_ooo`, `work_order_high_open` – ba dòng) |
| US-012 AC5 | 3.2 |
| US-012 AC6 | 3.1, 3.3 |
| US-012 AC7 | 3.1 `channel_sync_error`, `vip_arrival` |
| metrics S1c, S7 | 1.1 `unassignedConflictReservations`; 3.1 `overbooking` · S7 "giữ chỗ treo = 0" theo dõi qua `hold_expiring` + J1 (không có ô riêng ở R2 `[GIẢ ĐỊNH BA]`) |

---

## 8. Đề nghị hợp đồng cho ARC (OpenAPI 0.3.4 → 0.3.5) và vai khác
| # | Gửi | Nội dung |
|---|---|---|
| E01-01 | ARC | `TonightKpi.metricRefs.unassignedConflictReservations` = `S1c` (đang ghi `S1b`; metrics Q-05: S1c = đêm xung đột chưa gán; S1b = cảnh báo overbooking do đồng bộ trễ); mô tả trường sửa "S1b" → "S1c" |
| E01-02 | ARC | `TonightKpi.arrivalsCheckedIn`, `departuresCheckedOut` (để hiện "{đã nhận}/{tổng}"); ghi rõ định nghĩa `arrivals`/`departures` (mục 1.1, BR-404) |
| E01-03 | ARC | `ArrivalsDepartures` mỗi dòng có `allowedActions[]` (nhận phòng / trả phòng / mở đơn) theo trạng thái + vai + thiết bị; `date` giới hạn ±7 ngày → 422 `DATE_INVALID` |
| E01-04 | ARC | `AttentionItem.kind` thêm `work_order_overdue`, `extra_guest_kit_overdue`, `room_status_mismatch`, `reconcile_overdue`, `ooo_ending_work_open` (E07-13), `guest_request_overdue` (E14-05), `registration_overdue` (đã có); `AttentionItem` thêm `refCode` (mã WO/đơn để hiện dòng không cần gọi thêm) và `params` (chỉ số, mã – không C2/C3) |
| E01-05 | ARC + PO | `foc_threshold` tính khi đọc cho OWN ở R2 (mục 3.3); J21 (thông báo hằng ngày) giữ R3. Nếu PO không đồng ý → US-012 AC6 vẫn đạt (FD không thấy), nhưng OWN chưa có cảnh báo BR-435 tới R3 – cần ghi rõ trong round-summary |
| E01-06 | PO + SEC | US-012 AC3 ↔ SR-RET-06 (mục 3.4) |
| E01-07 | DATA | Xác nhận: (a) công thức BR-435 lũy kế đầu tháng, gồm FOC tự áp (3.3); (b) `oooRooms` chỉ đếm căn bán được; (c) S7 không có ô riêng ở R2 |
| E01-08 | DOM | Xác nhận: kỳ BR-435 (lũy kế); cách gộp dòng "Cần chú ý" (3.1); ngưỡng "critical" của `overbooking` theo BR-317 (5) |
| E01-09 | UXD | Chuỗi **(mới)** trong tài liệu; sửa `today.kpi_occupancy_note` cho rõ "{occupied}/{available} căn có khách đêm nay ({blocked} căn khóa)"; nhãn cho mọi `kind` mới; ẩn thẻ ADR/RevPAR/biểu đồ ở R2 (US-014 R3) |
| E01-10 | QA | Ca đồng hồ giả lập 05:59/06:00 (đêm nay, khách đến), ví dụ 6/9 (AC1), OOO `planned` không trừ mẫu số, đơn `hold` không vào tử số, đơn OTA chưa gán không vào tử số; FD/MGR không thấy `foc_threshold`; ba dòng riêng AC4 |

## 9. Lịch sử thay đổi
| Ngày | Round | Thay đổi | Người |
|---|---|---|---|
| 16/10/2026 | 2 (Sprint 2) | Bản đầu: KPI đêm nay theo metrics v0.2 (Occupancy chỉ đêm đã gán, S1c riêng, giữ chỗ riêng), khách đến/đi BR-404, "Cần chú ý" theo vai + BR-435 (chỉ OWN), SSE; lệch AC3 ↔ SR-RET-06; đề nghị E01-01…10 | BA |
