# Đặc tả mức trường – EP07 Buồng phòng (PWA nhân viên) · EP08 Bảo trì (phần R2)

- Tác giả: BA | Round 2 – Sprint 2 (đi trước Sprint 4 một sprint) | Ngày: 16/10/2026 | Phiên bản: 0.1
- Phạm vi (Must R2 theo R-C): EP07 – US-052, 053, 054, 055, 056, 057 · EP08 – US-061, 062 · phần buồng phòng của BR-812 (bộ đồ dùng thêm, ESC-014). **Should R2** (làm nếu dư, plan mục 2.1): US-058 hàng đợi offline (mục 8 đặc tả đủ để làm). **R3**: US-060 ảnh sau kiểm (Could), US-063 bảo trì định kỳ (Should R3 – mục 7 chỉ khung), xuất kho khi bổ sung minibar/chuẩn bị bộ đồ dùng (US-068, BR-705 – kho R3).
- Nguồn và quy ước: như `specs/EP00-platform.md` mục 0 (bảng trường, V-01…V-11, hiển thị lỗi, lỗi chung, hộp xác nhận mục 9). Thứ tự ưu tiên khi lệch: `business-rules.md` **v0.3.1** → backlog (AC) → `state-machines.md` (SM-02, SM-03, SM-04, SM-14, SM-15) → `rbac-matrix.md` (S10, S11, A80–A87) → `api/openapi.yaml` **0.3.4-draft** → `design/copy/strings-vi.json`. Không chép con số nghiệp vụ (ghi mã BR/tham số).
- Đọc cùng: `specs/EP03-05-stay.md` mục 0.1 (BR-812 trong nhận/lưu trú/trả phòng), `specs/EP02-reservations.md` mục 9.2 (đổi phòng B14), mục 12 (khối OOO US-019), `business-processes.md` P07, P08, P04c/P04d; ADR-005 (PWA, offline); SEC `security-requirements.md` mục 7 (SR-FILE), mục 12 (SR-PWA).
- Quyết định INV áp dụng: ESC-008 (dọn hằng ngày ngắn ngày, thay ga mỗi 3 đêm – BR-807), **ESC-014** (bộ đồ dùng thêm – BR-812). BR-808 (checklist 12 điểm), BR-809 (mức độ/thời hạn phiếu), BR-811 (định tuyến yêu cầu) còn nhãn `[GIẢ ĐỊNH – chờ INV xác nhận]` – đã viết theo tham số, đổi giá trị không đổi đặc tả.

---

## 0. Quy ước riêng của phân hệ

| Khái niệm | Định nghĩa (nguồn) |
|---|---|
| "Hôm nay" | Ngày nghiệp vụ (BR-010). Danh sách việc của ngày D gồm cả việc phát sinh 00:00–05:59 ngày D+1 |
| Ứng dụng | HK/MT dùng **PWA** `apps/mobile` ("OTTIMO Staff", ADR-005); FD+ dùng admin-web (màn S10/S11 bản máy tính, cùng API). PWA **không bao giờ** là thiết bị được cấp → không có dữ liệu C3 (rbac 8.7, SR-DEV-09) |
| Phạm vi T của HK | Căn có việc hôm nay **giao cho người đó** hoặc **chưa giao ai** (việc chưa giao thuộc mọi HK của ca) `[GIẢ ĐỊNH BA – rbac 8.2 chỉ ghi "giao cho người dùng"; cơ sở 10 căn, 2 HK dùng chung hàng việc]`. Việc đã giao người khác: HK thấy dòng (căn, loại, trạng thái), **không** thấy tên khách, không thao tác |
| Nhãn trạng thái buồng | PWA (HK/MT): câu thường `hk.status.*` (ví dụ "Cần dọn (khách đã đi)") – không hiện mã. admin-web: `status.room.*` (mã + tên, BR-801). US-052 AC1 "nhãn bằng chữ" đạt bằng `hk.status.*` |
| Thời điểm thao tác | Mọi thao tác ghi từ PWA gửi `performedAt` = giờ trên máy lúc bấm (giờ VN, BR-001); server lưu cả giờ nhận; chấp nhận trong [now − 24 giờ, now + 5 phút] (SR-PWA-05) |
| Hoàn tác 10 giây | Đổi trạng thái buồng/việc trên PWA: client **giữ thao tác 10 giây** trước khi gửi (toast có nút "Hoàn tác" – wireframe L6). Bấm Hoàn tác = hủy ở máy, **không gọi server** (SM-03 cấm chuyển ngược như `CL → VD`). Hết 10 giây → gửi (hoặc vào hàng đợi khi mất mạng – mục 8) |

### 0.1 Ảnh bằng chứng (dùng chung mục 4, 5, 6) – `uploadAttachment`
| Trường | Kiểu | BB | Kiểm tra | Lỗi |
|---|---|---|---|---|
| `file` | binary | B | Client chuẩn hóa: vẽ vào canvas → JPEG ~0,85, cạnh dài ≤ 2.500 px (bỏ EXIF/GPS – SR-FILE-01); PWA nén tiếp ≤ 300 KB/ảnh khi xếp hàng offline (ADR-005). Server: magic bytes JPEG/PNG/WebP, ≤ 10 MB, ≤ 40 MP, mã hóa lại bỏ metadata (SR-FILE-01…03) | 422 `FILE_REJECTED` + `errors[].code` `FILE_TYPE` / `FILE_TOO_LARGE` / `TOO_MANY_FILES` → `gw.take_photo_again` (dùng chung) |
| `purpose` | enum | B | `work_order` (sự cố, ảnh sau sửa) · `inspection` (kiểm phòng) · `penalty_evidence` (bằng chứng phạt/hư hỏng – EP03-05 3.2) | `NOT_IN_LIST` |

- Số ảnh: ≤ 4 ảnh/phiếu sửa mỗi lần gửi, ≤ 4 ảnh/lần kiểm phòng `[GIẢ ĐỊNH BA – ràng buộc nhập liệu]`.
- Ảnh chỉ chụp **căn/thiết bị**, không chụp người hay giấy tờ: câu nhắc dưới nút chụp **(mới)** `hk.photo_hint` "Chỉ chụp phòng và đồ vật – không chụp khách hay giấy tờ." (ảnh `attachment` là C1, không mã hóa như giấy tờ – erd 4.9).
- Xem lại ảnh: hợp đồng **chưa có** endpoint đọc ảnh đính kèm → đề nghị ARC **E07-01** (`getAttachment`). Thời hạn lưu ảnh đính kèm: chưa có trong bảng T01–T18 → câu hỏi SEC **E07-12**.

---

## 1. Trạng thái buồng – S10 (US-052) – `listRoomStatuses`

### 1.1 Quyền và phạm vi
| Vai | Thấy | Ghi chú |
|---|---|---|
| OWN, MGR, FDL, FD | 10 căn, đủ trường | admin-web |
| HK | 10 căn (số căn, tầng, nhóm, trạng thái, khách đến kế tiếp có/không + giờ); tên khách (`currentGuest`, `nextArrival.guestDisplayName`) **chỉ** căn trong phạm vi T (US-052 AC3, D01 Tên+căn); không kênh, giá, sức chứa (rbac 25a) | `x-scope: today_masked` |
| MT | 10 căn, trạng thái, **không** tên khách (D01 = K) | `read_only`; MT không đổi trạng thái buồng (A80 ✖) |
| SAL, CTV, GST | ✖ | 403 |

### 1.2 Trường mỗi thẻ căn (`RoomStatusEntry`)
| Trường | Hiển thị | Quy tắc |
|---|---|---|
| `roomNo`, `floor`, `roomGroupCode` | "Căn 202 · Lầu 2" | Thay `listRooms` với HK/MT (BUG-R1-005) |
| `status`, `statusLabel`, `since` | Nhãn `hk.status.*` + "từ {hh:mm}" | 7 mã BR-801 |
| `currentGuest` | `hk.guest_first_name` | Chỉ T với HK; vắng với MT → ẩn dòng |
| `nextArrival.date`, `.etaTime`, `.guestDisplayName` | `hk.arriving_today` nếu `date` = hôm nay; "Có khách đến ngày mai" **(mới)** `hk.arriving_tomorrow` nếu = hôm nay + 1; xa hơn → không hiện | `etaTime` vắng → dùng giờ chuẩn `checkin_time` (BR-401) |
| `serviceNotes` | Chip "Lưu ý phục vụ" | D12a – chỉ T với HK; lưu ý sức khỏe chỉ hiện nhãn chung "Có lưu ý – hỏi lễ tân" (D12b) |
| `allowedEvents` | Nút hành động (mục 2) | Server tính theo trạng thái **và** vai; client không tự suy (EP00 0.4) |
| `openTaskIds` | Số việc mở của căn | – |
| `version` | – | Không dùng `If-Match` ở thao tác buồng (dùng `expectedFrom` – mục 2) |

### 1.3 Bộ lọc (US-052 AC2) – tham số `filter`
| Giá trị | Nhãn | Gồm trạng thái |
|---|---|---|
| `all` | Tất cả | 7 trạng thái |
| `needs_cleaning` | Cần dọn | `VD`, `OD`, `CL` (đúng AC2) |
| `occupied` | Có khách | `OC`, `OD`, và `CL` của căn còn đơn `in_house` |
| `ready` | Sẵn sàng | `VI` (Sẵn sàng đón khách) và `VC` (Đã dọn – chờ kiểm) – hai nhãn khác nhau trên thẻ `[GIẢ ĐỊNH BA: VC vẫn nhận phòng được – BR-803]` |

Sắp xếp mặc định: theo `priorityRank` của việc mở đầu tiên của căn (mục 3.3), căn không có việc xếp cuối theo `roomNo`. Hiển thị ở 360 px, một cột, không cuộn ngang (AC1 – ràng buộc cho UXD). Trạng thái màn: đang tải, rỗng (không xảy ra với 10 căn – chỉ khi lọc không có căn: "Không có căn nào ở trạng thái này" **(mới)** `hk.filter_empty`), lỗi (`today.error_title` dạng HK – wireframe L6), mất mạng (mục 8: dữ liệu lúc `asOf`).

---

## 2. Đổi trạng thái buồng (US-053, SM-03) – `transitionRoomStatus`

### 2.1 Nút theo trạng thái (= `allowedEvents`, kiểm lại ở server)
| Trạng thái hiện tại | Sự kiện (`event`) | Nút (chuỗi) | Kết quả | Vai (rbac) |
|---|---|---|---|---|
| `VD`, `OD` | `start_cleaning` (R1) | "Bắt đầu dọn" | `CL`; việc dọn mở đầu tiên → `in_progress` (nếu chưa có việc → server tạo `adhoc_clean`) | HK (T), FD+ (A80) |
| `CL` | `finish_cleaning` (R2/R3) | "Dọn xong" | Server quyết theo dữ liệu **tại lúc nhận**: căn còn đơn `in_house` → `OC` (R2); không còn → `VC` (R3, `hk.done_wait_inspect`). Việc dọn đang làm của căn → `done` (US-053 AC2) | HK (T), FD+ |
| `OC` | `needs_cleaning` (R8a) | "Báo cần dọn" **(mới)** `hk.mark_dirty` | `OD` + việc "Dọn phòng khách đang ở" (nếu chưa có việc mở cùng loại trong ngày) | HK (T), FD+ (A82) |
| `VC` | `inspect` | "Kiểm phòng" → mở checklist (mục 4) – **không** gọi `transitionRoomStatus` | `VI` khi đạt | FDL+; HK chỉ khi `hk_self_inspection_enabled` (A81 ◐) |
| `VI`, `OOO` | – | Không có nút đổi tay | `VI → VC` chỉ do SYS (R5); `OOO` chỉ qua khối OOO (SM-02) | – |

Chuyển bị cấm (US-053 AC4) – không có nút, gọi API → 409 `INVALID_TRANSITION`: vào/ra `OOO` bằng tay; `VD`/`CL` → `VI`; `OC`/`OD` → `VC`/`VI`; `VC` → `CL`. Server **ghi nhật ký** lần bị từ chối (`state_transition.rejected = true`, SM 0.2 (1)).

### 2.2 Bảng trường
| Trường | Kiểu | BB | Kiểm tra | Lỗi |
|---|---|---|---|---|
| `event` | enum | B | `start_cleaning` / `finish_cleaning` / `needs_cleaning`; phải có trong `allowedEvents` của vai | 403 `FORBIDDEN_ACTION`; 409 `INVALID_TRANSITION` |
| `expectedFrom` | `RoomStatusCode` | B | = trạng thái client đang thấy; ≠ trạng thái hiện tại ở server → 409 kèm `currentStatus` (thay `If-Match`, dùng được cho hàng đợi offline) | 409 `INVALID_TRANSITION` → `hk.conflict_status` **(mới)** "Căn {room} đã chuyển sang '{status}'. Thao tác không áp dụng." |
| `performedAt` | instant | B | Trong [now − 24 giờ, now + 5 phút] (SR-PWA-05); `performedAt` ≥ `since` của trạng thái hiện tại | 422 mã trường **(đề nghị ARC E07-02)** `PERFORMED_AT_OUT_OF_RANGE` → `hk.queue_too_old` **(mới)** "Thao tác đã quá 24 giờ – báo lễ tân cập nhật trạng thái căn." |
| `taskId` | uuid | K | Việc mở của **chính căn** đó; vắng → server chọn việc dọn mở đầu tiên theo `priorityRank` | `NOT_IN_LIST` |
| `Idempotency-Key` | header | B | UUID sinh trên máy, giữ nguyên khi gửi lại (ADR-005) | 428 `PRECONDITION_REQUIRED` |

### 2.3 Thứ tự kiểm ở server
Phiên → vai (A80/A82) → phạm vi T (HK: căn có việc hôm nay của mình/chưa giao; ngoài phạm vi → 404 `NOT_FOUND`) → `Idempotency-Key` (gửi lại cùng khóa → trả kết quả lần đầu) → `performedAt` (422) → `expectedFrom` (409) → chuyển hợp lệ SM-03 (409) → ghi `room_status` + `state_transition` (gồm `performed_at`) + cập nhật việc + SSE `room.status_changed` trong cùng giao dịch.

### 2.4 Tự động (SYS) – để HK/FD hiểu vì sao trạng thái đổi
| Sự kiện | Chuyển | Nguồn |
|---|---|---|
| Nhận phòng B9 | `VC`/`VI` → `OC`; ngoại lệ FDL+ `VD` → `OD` + việc `priority_clean` (R7) | SM-01, BR-402 |
| Trả phòng B18 | `OC`/`OD` → `VD` + việc `checkout_clean`; căn đang `CL` giữ `CL` (R9) | BR-802 |
| Gia hạn B13 | `OC` → `OD` + việc dọn | BR-802 |
| Mốc `daily_clean_status_time` (J8) | Khách **ngắn ngày** `OC` → `OD` + `stayover_clean` (trừ khách đã từ chối dọn hôm nay); khách dài hạn chỉ theo lịch gói (mục 3.5) | BR-802, BR-807 |
| `VI` đủ `vacant_reinspect_days` (đủ 72 giờ là quá) | `VI` → `VC` (R5) | BR-805 – J8 chạy một lần/ngày không đúng mốc giờ của ví dụ BR-805 → **E07-03** |
| Khối OOO `active` / `released` | → `OOO` (hủy mọi việc dọn mở, lý do "khóa bảo trì") / `OOO` → `VD` + việc `after_repair_clean` | SM-02 O2, O4; R10, R11 |
| Đối chiếu buồng – đơn (BR-806) | Không tự sửa; lệch → "Cần chú ý" cho FD (`EP01-dashboard.md` mục 3) | BR-806 |

---

## 3. Việc hôm nay (US-054, US-056; SM-14) – `listHkTasks`, `transitionHkTask`, `createHkTask`

### 3.1 Nguồn sinh việc (SYS, trong cùng giao dịch với sự kiện gốc)
| Loại (`type`) | Nhãn **(mới)** `hk.task.type.*` | Sinh khi | Hạn / khung | Nguồn |
|---|---|---|---|---|
| `checkout_clean` | Dọn trả phòng | B18 hoàn tất trả phòng (US-054 AC1); có dòng "Thu hồi bộ đồ dùng thêm × n" nếu căn có bộ thêm (BR-812 (6)) | Trong ngày; trả muộn → `notBeforeTime` = giờ trả đã xác nhận (US-029 AC3) | BR-802, 812 |
| `stayover_clean` | Dọn phòng khách đang ở | J8 hoặc R8 bằng tay; `linenChange` mỗi `linen_change_every_nights` đêm (đề nghị trường **E07-04**) | Trong ngày | BR-807 |
| `long_stay_clean` | Dọn phòng khách dài hạn | J8 theo lịch gói (mục 3.5) | `windowStart`–`windowEnd` (BR-807) | US-056 |
| `minibar_refill` | Bổ sung minibar | Sau kiểm minibar có món đã dùng (`refillItems`) | Trong ngày | US-054; kho R3 |
| `guest_request` | Yêu cầu của khách | Yêu cầu app khách loại `extra_cleaning`/`amenities` (BR-811) – chip `source = guest_app` "App khách" + ghi chú của khách (US-054 AC2) | Theo hạn trả lời BR-811 | `EP14-guest-app.md` mục 4 |
| `after_repair_clean` | Dọn sau sửa chữa | O4 khối OOO `released` | Trong ngày | R11 |
| `priority_clean` | Dọn gấp – khách đang chờ | B9 ngoại lệ phòng chưa sẵn sàng (R7) | Ngay | BR-402 |
| `adhoc_clean` | Dọn lại / dọn theo yêu cầu | FD+ tạo tay; SYS khi kiểm phòng không đạt (mục 4.4); R1 không có việc | Trong ngày | – |
| `extra_guest_kit_prepare` / `_transfer` / `_collect` | `hk.task.extra_kit` (chuẩn bị), "Chuyển bộ đồ dùng thêm sang căn {room}" **(mới)**, "Thu hồi bộ đồ dùng thêm" **(mới)** | Chỉ SYS (BR-812; EP03-05 0.1; EP02 mục 0) | `dueAt` = giờ nhận phòng của đơn / lúc xác nhận thêm người + `extra_guest_kit_midstay_due_minutes` / giờ đổi phòng | BR-812 (2)(4) |

Việc **không xong trong ngày**: lúc J8 của ngày mới, `stayover_clean`/`long_stay_clean` còn `open` của hôm trước → `cancelled` lý do `day_ended` (ngày mới đã sinh việc mới); các loại còn lại **giữ lại** và hiện chip "Từ hôm trước" **(mới)** `hk.task.carried_over` `[GIẢ ĐỊNH BA – DOM xác nhận]`.

### 3.2 Bảng trường mỗi việc (`HkTask`) và theo vai
| Trường | Hiển thị | HK | MT | FD+ |
|---|---|:-:|:-:|:-:|
| `roomNo`, `type`, `status`, `source` (chip "App khách") | Dòng việc | ✔ | R | ✔ |
| `dueDate`, `dueAt`, `windowStart/End`, `notBeforeTime` | "trước {time}" / "khung {from}–{to}" / "sau {time}" | ✔ | R | ✔ |
| `quantity` (bộ đồ dùng thêm) | `hk.task.extra_kit` `{n}` + `hk.task.extra_kit_items` (UXD sửa câu – mục 11 E07-14) | ✔ | – | ✔ |
| `note` | Ghi chú của lễ tân / của khách (D23 – T với HK) | ✔ (T) | ✖ | ✔ |
| `refillItems[]` | "bổ sung minibar: 2 bia, 1 snack" – **không** giá, không giá vốn (rbac ghi chú 10) | ✔ | ✖ | ✔ |
| `assignedUserId` | Tên người làm | ✔ | R | ✔ |
| `summary.done/total` | "Việc của tôi {x}/{y} xong" (US-054 AC3) – đếm việc trong phạm vi người xem, không đếm `cancelled` | ✔ | – | ✔ (toàn cơ sở) |

### 3.3 Thứ tự ưu tiên (`priorityRank`, US-054 AC4 – BR-807)
Server tính khi sinh và tính lại khi có sự kiện ảnh hưởng (khách đến nhận phòng, đổi giờ đến, đổi ưu tiên). Bậc (nhỏ = trước):

| Bậc | Gồm | Sắp trong bậc |
|---|---|---|
| 1 | `priority_clean`; việc bộ đồ dùng thêm **khi khách đã nhận phòng** mà chưa xong (BR-812 (5)) | `dueAt` |
| 2 | Mọi việc của **căn có khách đến hôm nay** (dọn trả phòng của căn đó, `after_repair_clean`, `extra_guest_kit_prepare`) | Giờ đến (`etaTime`, vắng = `checkin_time`; nhận sớm đã xác nhận = giờ đó) – đến sớm trước (BR-807) |
| 3 | `guest_request` (khách đang chờ, có hạn trả lời BR-811) `[GIẢ ĐỊNH BA – BR-807 chưa xếp loại này, DOM xác nhận]` | Thời điểm gửi |
| 4 | Dọn phòng ở lại của khách có tag VIP/Khách quen (EP00 11.2) | `roomNo` |
| 5 | `checkout_clean` (căn không có khách đến hôm nay), `after_repair_clean` không khách đến | Giờ trả thực tế |
| 6 | `stayover_clean`, `long_stay_clean` (có khung → theo `windowStart`) | Khung, rồi `roomNo` |
| 7 | `minibar_refill`, `adhoc_clean`, `extra_guest_kit_collect` | `roomNo` |

### 3.4 Thao tác trên việc – `transitionHkTask` (`action` = `start` / `complete` / `cancel`)
| Hành động | Ai | Điều kiện | Trường | Kết quả / lỗi |
|---|---|---|---|---|
| `start` | HK (T), FD+ | `open` | `performedAt` (B) | `in_progress`. Việc dọn (`*_clean`) nên bắt đầu qua "Bắt đầu dọn" (mục 2) – cùng kết quả |
| `complete` (tick xong) | HK (T), FD+ | `open`/`in_progress` | `performedAt` (B) | `done`, ghi `doneBy`, `doneAt` = `performedAt`. Bộ đếm cập nhật, FD thấy cùng trạng thái qua SSE (AC3). Việc `*_clean` của căn đang `CL` → khuyến nghị dùng "Dọn xong" (để đổi buồng); tick ở đây **không** đổi trạng thái buồng. Việc `guest_request` xong → yêu cầu khách `done` (SM-15). Việc `extra_guest_kit_prepare` xong → R2 **không** ghi kho (BR-812 (7) – kho R3), ghi `doneBy/At` để R3 xuất kho bù `[GIẢ ĐỊNH BA]` |
| `cancel` | HK: **chỉ** `stayover_clean`/`long_stay_clean` khi khách từ chối dọn hoặc treo biển (rbac ghi chú 33); FD+: mọi việc tạo tay; SYS: việc tự sinh khi nguồn mất | `open` | `cancelReasonCode` **(đề nghị E07-05)** enum: `guest_refused` (`hk.task.guest_refused`), `dnd` ("Khách treo biển không làm phiền" **(mới)**), `other`; `cancelNote` 3–300 V-09 bắt buộc khi `other` | `cancelled`; `dnd` → thông báo FD (BR-807 "hoãn, báo FD"); FD tạo lại việc khi khách cho dọn (`createHkTask`). HK hủy loại khác → 403 `FORBIDDEN_ACTION` |

Lỗi chung: việc đã `done`/`cancelled` → 409 `INVALID_TRANSITION` kèm `currentState` → chuỗi **(mới)** `hk.task_changed` "Việc này đã {state} – có thể do lễ tân hoặc đơn thay đổi." (BR-812: "Việc này đã hủy do đơn thay đổi" khi `cancelled` vì đơn).

### 3.5 Lịch dọn khách dài hạn (US-056, BR-807)
- J8 sinh `long_stay_clean` vào ngày trong `weekdays` của gói, kèm khung `windowStart`–`windowEnd`, và chuyển buồng `OC → OD` (R8 d) – AC1. Gói kết thúc (`validTo`) hoặc đổi gói → các ngày sau đó không sinh theo gói cũ (AC2); việc đã sinh của ngày đổi gói **giữ** `[GIẢ ĐỊNH BA]`.
- **Lỗ hổng R2**: gói dọn (`cleaning_schedule`) gắn với **HĐ dài hạn** (erd 4.5) nhưng R-C dời HĐ sang R3; khách dài hạn R2 là **đơn nhập tay AC5a** (EP02 mục 4) – không có HĐ → không có lịch → US-056 không chạy được. Đề nghị **E07-06** (ARC + PO): cho đơn `externalContract = true` có gói dọn: `manualLongStay.cleaningPlan { weekdays[] (0–3 ngày/tuần – BR-204), windowStart, windowEnd }` và thao tác sửa gói (FD+), `cleaning_schedule.reservation_id` (thay `contract_id` khi chưa có HĐ). Theo BR-204, HĐ đang chạy trước khi dùng app mặc định **không** có gói (chỉ dọn lẻ BR-506) → ô gói để trống mặc định; lễ tân nhập nếu HĐ giấy có thỏa thuận dọn. Câu hỏi PO/DOM: có căn dài hạn nào hiện có lịch dọn cố định không (nếu không, US-056 AC1 chỉ kiểm được bằng dữ liệu mẫu).
- Dọn lẻ ngoài gói (khách gửi qua app hoặc gọi lễ tân) → `guest_request`/`adhoc_clean`; tiền BR-506 ghi folio khi việc `done` (SYS, A30) – chi tiết `EP14-guest-app.md` mục 4.4.

### 3.6 Tạo việc bằng tay – `createHkTask` (FD+, A83-create)
| Trường | Kiểu | BB | Kiểm tra | Lỗi |
|---|---|---|---|---|
| `roomId` | uuid | B | V-11; căn không `OOO` | `NOT_IN_LIST`; 409 `ROOM_BLOCKED` |
| `type` | enum | B | `adhoc_clean`, `stayover_clean`, `priority_clean`, `minibar_refill`; **không** `extra_guest_kit_*`, `checkout_clean`, `long_stay_clean`, `after_repair_clean`, `guest_request` (chỉ SYS) | `NOT_IN_LIST` |
| `dueDate` | date | B | ≥ hôm nay, ≤ hôm nay + 7 `[GIẢ ĐỊNH BA]` | `DATE_IN_PAST` |
| `note` | text | K | ≤ 300, V-09 | `CARD_NUMBER_DETECTED` |
| `assignedUserId` | uuid | K | Người có vai HK của cơ sở | `NOT_IN_LIST` |

---

## 4. Kiểm phòng (US-055; SM-03 R4; BR-802, BR-808) – `getInspectionChecklist`, `recordInspection`

### 4.1 Ai được kiểm
- FDL, MGR, OWN (A81 ✔). FD ✖ (rbac A81).
- HK chỉ khi tham số `hk_self_inspection_enabled = true` **và** gửi ≥ 1 ảnh (BR-802, A81 ◐) – server xác định "tự kiểm" khi người kiểm có vai HK. HK không đọc được bảng tham số (S24 ✖) → nút "Dọn xong & tự kiểm đạt" (`hk.self_inspect`) chỉ hiện khi `allowedEvents` của căn có `inspect` (server tính). Tắt → HK thấy `hk.done_wait_inspect` và FDL+ nhận thông báo "Căn {room} chờ kiểm" **(đề nghị kind E07-08)**.

### 4.2 Checklist (`getInspectionChecklist`)
- Nội dung theo BR-808 (cấu hình được – AC1): mỗi mục `code`, `label` (VI/EN), `required`, `photoRequired`. Phiên bản `version` tăng khi OWN/MGR sửa danh mục.
- **Mục động BR-812 (5)**: căn có việc `extra_guest_kit_prepare`/`_transfer` của đơn sắp nhận/đang ở → thêm mục bắt buộc `extra_guest_kit` "Bộ đồ dùng thêm đủ × {n}" **(mới)**. Hợp đồng lấy checklist theo cơ sở, không theo căn → **E07-07** (`?roomId=`).
- Mục "Ảnh phòng" của BR-808: `photoRequired = true` **chỉ khi tự kiểm** (BR-802); người kiểm FDL+ chụp ảnh là tùy chọn (US-055 AC2 "ảnh nếu có"; ảnh sau kiểm bắt buộc là US-060 – R3) `[GIẢ ĐỊNH BA – BR-808 liệt kê "ảnh" trong 12 điểm; DOM xác nhận]`.

### 4.3 Bảng trường – `recordInspection` (`Idempotency-Key`)
| Trường | Kiểu | BB | Kiểm tra | Lỗi |
|---|---|---|---|---|
| (căn) | path `roomId` | B | Buồng phải `VC` lúc server nhận | 409 `INVALID_TRANSITION` → `hk.conflict_status` |
| `checklistVersion` | int | B | = phiên bản hiện hành; khác → checklist đã đổi | 409 **(đề nghị E07-02)** `CHECKLIST_OUTDATED` → **(mới)** "Danh mục kiểm phòng vừa thay đổi. Mở lại và kiểm lại." |
| `items[]` | `{code, passed, note}` | B | Có **đủ** mọi mục của phiên bản (kể cả mục động); `note` 3–300 (V-09) **bắt buộc** cho mục `passed = false` `[GIẢ ĐỊNH BA]` | 422 `REQUIRED` (field `items[i].note`); mục lạ → `NOT_IN_LIST` |
| `photoAttachmentIds` | uuid[] | ĐK | Ảnh `purpose = inspection` cùng cơ sở, ≤ 4; **≥ 1 khi tự kiểm** | 422 `REQUIRED` (field `photoAttachmentIds`) → `hk.self_inspect_help` |
| `performedAt` | instant | B | Như mục 0 | `PERFORMED_AT_OUT_OF_RANGE` |

### 4.4 Kết quả
- **Đạt** (mọi mục `required` = `passed`): `result = pass`, buồng `VC → VI` (R4); biên bản ghi người kiểm, thời điểm (`performedAt`), căn, ảnh (AC2); chip "Sẵn sàng đón khách" (`hk.status.VI`). Mốc BR-805 tính từ thời điểm kiểm đạt.
- **Không đạt** (AC1 – còn mục bắt buộc chưa đạt): `result = fail`, buồng **giữ `VC`** (SM-03 không có `VC → CL`); SYS tạo việc `adhoc_clean` "Dọn lại theo kiểm phòng: {danh sách mục không đạt}" **(mới)** `hk.task.redo` cho căn, bậc ưu tiên theo căn (mục 3.3); HK làm xong tick `complete` (không đổi trạng thái buồng) → kiểm lại. `[GIẢ ĐỊNH BA – P07 vẽ "Không đạt → trả lại HK → Bắt đầu dọn" nhưng R1 chỉ từ VD/OD; DOM xác nhận cách "trả lại" này]`.
- Giao diện: chưa tick đủ mục bắt buộc → nút "Kiểm đạt" khóa (AC1); server vẫn kiểm (gửi thiếu → `fail`, không phải lỗi).
- Lịch sử kiểm của căn: hợp đồng chưa có danh sách → **E07-07** `listInspections`.

---

## 5. Báo sự cố từ điện thoại (US-057; SM-04 W1) – `createWorkOrder` bởi HK

### 5.1 Bảng trường (form "Báo sự cố" – wireframe L6)
| Trường | Nhãn | Kiểu | BB | Kiểm tra | Lỗi |
|---|---|---|---|---|---|
| `roomId` | Căn | uuid | B | V-11 – chọn trong 10 căn (từ `listRoomStatuses`); mở từ thẻ căn → điền sẵn | `NOT_IN_LIST` |
| `category` **(đề nghị E07-09)** | Chuyện gì xảy ra? | enum | B | `hot_water` Mất nước nóng · `power` Điện / đèn · `leak` Rò nước · `door_lock` Khóa cửa · `wifi` Wi-Fi · `broken_item` Đồ hỏng · `other` Khác (chip wireframe L6, thêm Wi-Fi vì BR-809 nâng bậc cho khách dài hạn) | `NOT_IN_LIST` |
| `title` | – | text | B (tự điền) | Client điền "{nhãn category} – căn {room}"; ≤ 120 | `TOO_LONG` |
| `description` | Mô tả | text | B | 1–2000 (US-061 AC4), V-09; gợi ý "Không ghi tên khách, số giấy tờ" | `REQUIRED` → **(mới)** `wo.error.description` "Mô tả sự cố trước khi gửi."; `CARD_NUMBER_DETECTED` |
| `severity` | Mức độ (BR-809) | enum | B (điền sẵn) | `high` "Gấp" / `medium` "Trong ngày" / `low` "Không gấp" (wireframe). Mặc định (mục 6.4) | `NOT_IN_LIST` |
| `photoAttachmentIds` | Chụp ảnh (nên có) | uuid[] | K | 0–4 ảnh `purpose = work_order` (mục 0.1) | `FILE_REJECTED` |
| `lockRequested` **(đề nghị E07-09)** | "Đề nghị khóa căn – không bán đến khi sửa xong" (`hk.lock_request`, sửa câu – E07-14) | bool | K | Chỉ ghi đề nghị; HK **không** tạo khối OOO (A86 ✖, US-057 AC2). HK gửi `block` → 403 `FORBIDDEN_ACTION` | 403 |

### 5.2 Kết quả (AC1, AC2)
- Phiếu `new`, mã `WO-xxxxx` do server cấp (BR-007), `source = housekeeping`, `reportedBy` = người gửi; MT thấy ngay (SSE + thông báo `work_order_new` **(đề nghị kind E07-08)**).
- Mức `high` → thông báo MT + FD + MGR và vào "Cần chú ý" (`work_order_high_open` – BR-809, BR-907).
- `lockRequested = true` → thông báo FD + MT "Đề nghị khóa căn {room} – WO-xxxxx" **(mới)**; phiếu hiện chip "Đề nghị khóa" tới khi FD/MT tạo khối (mục 6.2) hoặc bỏ đề nghị (`updateWorkOrder lockRequested=false`, ghi nhật ký). Căn đang có khách `in_house` → chip thêm `hk.lock_by_others` + "Căn đang có khách: lễ tân đổi phòng trước" (BR-804).
- Sau khi gửi: HK thấy toast "Đã gửi báo sự cố WO-xxxxx" **(mới)**; chỉ khi FD/MT tạo khối, HK mới thấy `hk.lock_done` (wireframe: "Chỉ khi hiện 'Đã khóa'… căn mới thật sự bị khóa").
- HK xem phiếu: phiếu do mình tạo + phiếu của căn mình đang có việc hôm nay (`own_or_room_today`, rbac ghi chú 8); không đổi trạng thái phiếu.

---

## 6. Phiếu sửa chữa và khóa phòng (US-061, US-062; SM-04, SM-02) – S11

### 6.1 Quyền
| Hành động | OWN/MGR | FDL/FD | MT | HK |
|---|:-:|:-:|:-:|:-:|
| Tạo phiếu (A84) | ✔ | ✔ | ✔ | ✔ (mục 5) |
| Tạo phiếu **kèm khóa phòng** / tạo, kéo dài khối (A86) | ✔ | ✔ | ✔ | ✖ |
| Xác nhận đã có phương án cho đơn trùng (`affectedReservationsAcknowledged`) | ✔ | ✖ | ✖ | ✖ |
| Nhận / chờ vật tư / xong / mở lại (A85) | ✔ | ✔ | ✔ | ✖ |
| Hủy phiếu (W5) | ✔ | ✔ | Chỉ phiếu mình tạo, còn `new` | ✖ |
| Mở khóa OOO không qua phiếu (A87) | ✔ | ✖ | ✖ | ✖ |

### 6.2 Tạo phiếu – `createWorkOrder` (FD+/MT; `Idempotency-Key`)
Trường như 5.1 (trừ `lockRequested`) + `assigneeUserId` (K, người có vai MT; V-11) + khối khóa tùy chọn:

| Trường `block.*` | Nhãn | Kiểu | BB | Kiểm tra | Lỗi |
|---|---|---|---|---|---|
| (ô tick) | "Khóa phòng" (`hk.lock_request` bản FD/MT) | bool | K | Bật → hiện các ô dưới | – |
| `startDate` | Khóa từ | date | B | ≥ hôm nay; = hôm nay → khối `active` ngay (buồng `OOO`); tương lai → `planned` (J9 kích hoạt) | `DATE_IN_PAST` |
| `expectedDoneDate` **(đề nghị E07-10)** | Dự kiến sửa xong | date | B | ≥ `startDate` | `DATE_ORDER` |
| `endDatePlanned` | Mở bán lại từ | date | B (tính sẵn) | **Server tính** = `expectedDoneDate` + `ooo_reopen_buffer_days` (BR-804) khi client không gửi – vì FD/MT không đọc được bảng tham số (S24); form hiện **cả hai ngày** (AC1): "Dự kiến xong 17/10 · Mở bán lại từ 18/10" **(mới)** `wo.block.dates` | `DATE_ORDER` |
| `reason` | Lý do khóa | text | B | 3–500, V-09; điền sẵn = `title` | `REASON_REQUIRED` |
| `affectedReservationsAcknowledged` | "Đã có phương án cho các đơn bị trùng" | bool | ĐK | Chỉ MGR+; FD/MT gửi `true` → 403 `FORBIDDEN_ACTION` | 403 |

Thứ tự kiểm ở server: quyền (HK gửi `block` → 403) → trường (422 gom lỗi) → căn có đơn `in_house` trong khoảng khóa → **409 `ROOM_UNAVAILABLE`** kèm đơn đang ở (AC3) → khoảng trùng đơn `hold`/`confirmed` → **409 `ROOM_UNAVAILABLE` + `conflicts[]`** (mã đơn, ngày, căn) trừ khi MGR+ gửi `affectedReservationsAcknowledged = true` (AC2, O1) → tạo phiếu + khối + `room_occupancy kind=ooo` + lệnh đồng bộ đóng phòng (BR-905) trong **một** giao dịch.

Giao diện khi 409:
- Có khách đang ở → **(mới)** `wo.block.in_house` "Căn {room} đang có khách {code}. Đổi phòng cho khách trước (US-024), rồi khóa." + nút "Đổi phòng" (EP02 9.2) + nút "Tạo phiếu không khóa" (gửi lại bỏ `block`). Không tạo phiếu nửa vời.
- Trùng đơn tương lai → danh sách `conflicts[]` + **(mới)** `wo.block.conflicts` "Khoảng khóa trùng {n} đơn. Dời các đơn này trước, hoặc quản lý xác nhận đã có phương án." – FD/MT: nút "Tạo phiếu không khóa" và "Gửi quản lý"; MGR+: ô xác nhận rồi lưu.
- Kết quả thành công: rack thanh "Khóa phòng" (`rack.ooo_until`), tạo đơn trùng đêm khóa → `ROOM_BLOCKED` (US-019), đêm khả dụng trừ đêm khóa (BR-904, metrics Q-04).

Đề nghị khóa từ HK (5.2): FD/MT mở phiếu → nút "Khóa phòng theo đề nghị" → `createRoomBlock` (EP02 mục 12) với `workOrderId` của phiếu; thành công → `lockRequested` tự về false, HK thấy `hk.lock_done`.

### 6.3 Cập nhật phiếu – `updateWorkOrder` (`If-Match`; A85)
| Trường | Kiểu | BB | Kiểm tra | Lỗi |
|---|---|---|---|---|
| `assigneeUserId` | uuid | K | Người có vai MT (hoặc FD+ nhận thay) của cơ sở | `NOT_IN_LIST` |
| `severity` | enum | K | FD+ nâng/hạ; MT nâng/hạ có ghi chú `[GIẢ ĐỊNH BA]`. Đổi mức → hạn tính lại từ **thời điểm tạo phiếu** theo mức mới (mục 6.4) | `NOT_IN_LIST` |
| `partsNote` | text | K | ≤ 500, V-09 | – |
| `lockRequested` **(E07-09)** | bool | K | FD+/MT bỏ đề nghị khóa | – |

Mỗi lần đổi người xử lý/mức/trạng thái ghi **nhật ký phiếu** (người, thời điểm, giá trị cũ → mới – US-062 AC2) → hợp đồng chưa trả lịch sử trong `WorkOrder` → **E07-11** `WorkOrder.history[]`.

### 6.4 Mức độ và thời hạn (BR-809, tham số `wo_sla`)
| Mức | Mặc định khi | Hạn nhận (`ackDueAt`) | Hạn xử lý (`resolveDueAt`) | Dừng hạn khi chờ vật tư |
|---|---|---|---|---|
| `high` Cao | `category` ∈ {`hot_water`, `power`, `leak`, `door_lock`} **và** căn có đơn `in_house` | tạo + mức Cao "nhận" | tạo + mức Cao "phương án" (sửa xong **hoặc** đổi phòng/bù sự cố) | **Không** |
| `medium` Trung bình | Mặc định còn lại khi căn có khách; yêu cầu "Báo hỏng" từ app khách (BR-811 → FD nâng mức) | – | tạo + mức TB | Có, khi `waiting_parts` có `partsExpectedDate` |
| `low` Thấp | Căn trống và `category` ∉ nhóm Cao | – | tạo + mức Thấp | Có (như TB) |

- Căn có khách **dài hạn** và `category` ∈ {`wifi`, `hot_water`} → nâng **một bậc** (BR-809). Mặc định chỉ là gợi ý trên form; người tạo đổi được.
- Hạn dừng: thời gian ở `waiting_parts` (có `partsExpectedDate`) được cộng vào `resolveDueAt` của TB/Thấp; quá `partsExpectedDate` mà vẫn `waiting_parts` → cảnh báo lại + "Cần chú ý" (W3).
- J11 (mỗi 5 phút): quá `ackDueAt`/`resolveDueAt` → `isOverdue = true`, thông báo `work_order_overdue` (MT, FD; mức Cao thêm MGR) và "Cần chú ý". **Mức Cao của căn có khách đang ở quá hạn phương án** → phiếu hiện hộp gợi ý (US-062 AC3) **(mới)** `wo.remedy` "Quá {h} giờ chưa có phương án cho khách căn {room}. Đổi phòng cho khách và đề nghị bù sự cố." + nút "Đổi phòng" (EP02 9.2, B14) + "Đề nghị FOC bù sự cố" (EP03-05 3.4, `reasonCode = service_recovery`) – chỉ FD+. Hợp đồng chưa có cờ → **E07-11** `WorkOrder.remedySuggested`.

### 6.5 Chuyển trạng thái phiếu – `transitionWorkOrder` (`If-Match` + `Idempotency-Key`; US-062)
| Nút | `action` | SM-04 | Từ | Trường | Kiểm tra | Kết quả |
|---|---|---|---|---|---|---|
| "Nhận phiếu" **(mới)** `wo.accept` | `accept` | W2 | `new` | — | Người bấm thành người xử lý nếu phiếu chưa giao | `in_progress`, `acceptedAt` (đo hạn nhận) |
| "Chờ vật tư" | `wait-parts` | W3 | `in_progress` | `note` (vật tư cần, B, 3–500); `partsExpectedDate` **(đề nghị E07-10)** – B với TB/Thấp, K với Cao | `partsExpectedDate` ≥ hôm nay | `waiting_parts`; dừng hạn TB/Thấp |
| "Có vật tư – làm tiếp" | `resume` | W3 | `waiting_parts` | — | – | `in_progress`; hạn chạy lại |
| "Sửa xong" | `complete` | W4 | `in_progress` | `resultNote` (B, 3–500, V-09); `photoAttachmentIds` (ảnh sau sửa – **B ≥ 1 với mức Cao**, K với TB/Thấp – SM-04 W4) | Thiếu → 422 `REQUIRED` | `done`; **hộp xác nhận** khi có khối OOO liên kết (US-135, US-062 AC1) **(mới)** `wo.complete_confirm` "Căn {room} sẽ mở bán lại từ {date} trên mọi kênh và chuyển 'Cần dọn'." → khối `released` (O4), `endDateActual` = ngày nghiệp vụ kế tiếp (BR-804: xong sớm → mở bán từ đêm kế tiếp), buồng `OOO → VD`, việc `after_repair_clean`, lệnh đồng bộ mở bán; yêu cầu khách liên kết → `done` |
| "Hủy phiếu" | `cancel` | W5 | `new`/`waiting_parts` | `cancelReason` (B, V-08) | MT chỉ phiếu mình tạo và còn `new` | `cancelled`; khối liên kết: `planned` → `cancelled` (O5), `active` → `released` (O4 – buồng `VD` + việc dọn). Hộp xác nhận nêu hậu quả mở bán |
| "Mở lại" | `reopen` | W6 | `done` | `note` (B, V-08) | Trong kỳ lưu trú của khách đang ở căn đó, hoặc trong 7 ngày từ `done` khi căn trống `[GIẢ ĐỊNH BA – SM-04 chỉ ghi "trong cùng kỳ lưu trú"]`; FD+ | `in_progress`, hạn tính lại từ lúc mở lại; cần khóa lại → tạo khối mới (6.2) |

Lỗi: không còn trạng thái nguồn → 409 `INVALID_TRANSITION`; `If-Match` lệch → 412 `VERSION_CONFLICT`; MT hủy phiếu người khác → 403 `FORBIDDEN_ACTION`. Mọi chuyển: nhật ký phiếu (AC2).

### 6.6 Khối OOO sắp hết hạn khi phiếu chưa xong
Khối lưu nửa mở; tới `endDatePlanned` căn **tự mở bán** dù phiếu chưa xong → nguy cơ bán phòng hỏng. Đề nghị **E07-13**: J9/J11 phát "Cần chú ý" **(mới)** kind `ooo_ending_work_open` cho FD + MT từ 12:00 ngày cuối còn khóa (`endDatePlanned − 1`) khi phiếu liên kết chưa `done`, kèm nút "Kéo dài khóa" (`updateRoomBlock`, O3 – kiểm trùng như O1) `[GIẢ ĐỊNH BA – mốc 12:00; DOM xác nhận]`.

### 6.7 Danh sách phiếu – `listWorkOrders` (S11)
Lọc `status` (mặc định: `new`, `in_progress`, `waiting_parts`), sắp: quá hạn trước, rồi mức (Cao → Thấp), rồi `ackDueAt`/`resolveDueAt`. Cột: mã, căn, tiêu đề, mức, trạng thái, người xử lý, hạn còn lại ("còn 1 giờ 20 phút" / "quá 35 phút" đỏ), chip nguồn ("App khách", "Buồng phòng"), chip "Đề nghị khóa", "Đang khóa đến {date}". MT màn mặc định = danh sách này (rbac mục 1). HK: phạm vi mục 5.2.

---

## 7. Bảo trì định kỳ (US-063 – Should **R3**; BR-810) – chỉ khung
- R2 **không** có `maintenance_plan` (erd 4.9 R3), không job J23. Bảo dưỡng có kế hoạch ở R2: MT/FD tạo **khối OOO `planned`** (`createRoomBlock`, EP02 mục 12) và phiếu sửa thường (6.2) cho lần bảo dưỡng đó.
- R3 (để ARC giữ chỗ): kế hoạch = `title`, `cycleMonths` (int 1–60), `roomIds[]` (hoặc toàn cơ sở), `nextDueDate`, `lastDoneAt`; hoàn thành một kỳ → SYS sinh kỳ kế tiếp = ngày hoàn thành + chu kỳ (BR-810); còn ≤ `maintenance_due_warning_days` → "Cần chú ý"; cần khóa phòng → tạo khối `planned`. Đặc tả mức trường viết khi PO kéo US-063 vào round.

---

## 8. PWA offline và đồng bộ xung đột (US-058 – **Should R2**; ADR-005; SR-PWA-01…07)

> Nếu PO không kéo US-058 vào R2: PWA vẫn phải có **đọc offline + banner** (mục 8.1, Must theo ADR-005 cho US-052/054) và **khóa nút ghi** khi mất mạng ("Cần có mạng" – `rsv.need_online`), không xếp hàng.

### 8.1 Đọc khi mất mạng
| Dữ liệu cache (IndexedDB – SR-PWA-01) | Hiển thị |
|---|---|
| `listRoomStatuses`, `listHkTasks` (hôm nay), `getInspectionChecklist`, danh mục minibar (không giá vốn), phiếu sửa của mình (không ảnh) | Banner `common.offline_banner` + "Dữ liệu lúc {asOf}" **(mới)** `hk.data_as_of` |
| **Không** cache: tên khách ngoài việc hôm nay, ghi chú khách tự do (D23 – SR-PWA-01 cấm "ghi chú khách tự do"), SĐT/email, tiền, C3 | Ghi chú của khách trên việc `guest_request` chỉ hiện khi online `[áp SR-PWA-01]` |

Đăng xuất/hết phiên/đổi người → xóa IndexedDB, Cache Storage, bộ nhớ truy vấn; còn mục chưa gửi → hộp cảnh báo trước khi xóa (SR-PWA-04) **(mới)** `hk.queue_logout_warn` "Còn {n} thao tác chưa gửi. Đăng xuất bây giờ sẽ mất các thao tác này."

### 8.2 Thao tác được xếp hàng / không
| Xếp hàng khi mất mạng | Không (nút khóa "Cần có mạng") |
|---|---|
| `transitionRoomStatus` (mục 2); `transitionHkTask` (mục 3.4, kể cả hủy vì khách từ chối); `recordInspection` (mục 4); `uploadAttachment` (`work_order`, `inspection`) + `createWorkOrder` **không có** `block` (mục 5); `recordMinibarCheck` của HK (EP03-05 5.2 – server tính tiền lúc nhận) | Tạo/kéo dài/mở khối OOO, `createWorkOrder` có `block` (tồn phòng – ADR-005); `transitionWorkOrder`, `updateWorkOrder` `[GIẢ ĐỊNH BA – `complete` mở bán phòng; các bước khác giữ online cho đơn giản]`; `transitionGuestRequest` (đo hạn BR-811); mọi thao tác tiền, C3 |

Mỗi mục hàng đợi: `Idempotency-Key` (UUID sinh trên máy), `performedAt`, operation + body, `dependsOn` (ảnh phải gửi xong trước phiếu/lần kiểm). Giới hạn: ≤ 200 mục, ảnh chờ gửi ≤ 20 ảnh × 300 KB `[GIẢ ĐỊNH BA]`; vượt → khóa thao tác ghi mới với **(mới)** `hk.queue_full` "Đang chờ gửi quá nhiều thao tác. Kết nối mạng để gửi trước khi làm tiếp." Ảnh **kiểm phòng** chờ gửi chưa có trong danh sách được phép của SR-PWA-01 (chỉ "ảnh sự cố") → **E07-12** SEC.

### 8.3 Gửi lại và xử lý kết quả
Gửi tuần tự theo thứ tự thao tác (FIFO), từng mục một: khi có sự kiện `online`, khi mở app, và Background Sync (Chrome Android). Kết quả mỗi mục:

| Server trả | Phân loại ở PWA | Hiển thị |
|---|---|---|
| 2xx, hoặc trả lại kết quả lần đầu (cùng khóa) | Đã gửi | Bỏ khỏi hàng đợi, bộ đếm `common.offline_queued` giảm |
| 409 `INVALID_TRANSITION` mà `currentState`/`currentStatus` **đúng bằng** trạng thái thao tác muốn đạt (người khác đã làm) | Đã áp dụng | Bỏ khỏi hàng đợi, không báo lỗi; ghi chú nhỏ "Đã được {người} cập nhật" **(mới)** |
| 409 `INVALID_TRANSITION` khác (căn bị khóa OOO, khách đã nhận/trả phòng, việc bị hủy do đơn đổi), 409 `CHECKLIST_OUTDATED`, 422 `PERFORMED_AT_OUT_OF_RANGE`, 422 `FILE_REJECTED`, 422 khác, 403, 404 | **Không áp dụng được** | Mục chuyển sang danh sách **(mới)** `hk.queue_failed_title` "Không áp dụng được ({n})" với lý do theo mã + nút "Bỏ qua" / "Báo lễ tân" (tạo thông báo cho FD kèm mã căn, loại thao tác – không nội dung khách). **Không ghi đè im lặng** (ADR-005). Mục phụ thuộc (phiếu chờ ảnh bị từ chối) vẫn gửi, bỏ ảnh lỗi |
| 401 `UNAUTHENTICATED` | Tạm dừng | Dừng cả hàng đợi, yêu cầu đăng nhập lại; cùng người đăng nhập → gửi tiếp; người khác → áp 8.1 (cảnh báo rồi xóa) |
| 409 `IDEMPOTENCY_IN_PROGRESS`, 429, 5xx, lỗi mạng | Thử lại | Lùi dần 5 giây → 15 giây → 1 phút → 5 phút (lặp 5 phút); giữ thứ tự (mục sau chờ) |

Giao diện lạc quan (PRD N3 – chỉ thao tác buồng phòng, architecture 16): sau 10 giây hoàn tác, thẻ căn/việc hiện trạng thái mới kèm chip "Chờ gửi" **(mới)** `hk.chip.queued`; mục bị "Không áp dụng được" → thẻ quay về trạng thái server trả.

### 8.4 Trùng thao tác giữa hai người
Hai HK cùng bấm "Bắt đầu dọn" căn 202: người gửi sau nhận 409 với `currentStatus = CL` → "Đã áp dụng" (đúng đích) – không báo lỗi. HK bấm "Dọn xong" offline lúc 10:42 cho căn khách đang ở; khách trả phòng lúc 10:50 (căn `CL` giữ `CL` – R9) → khi gửi lúc 11:05, server quyết theo dữ liệu lúc nhận: không còn đơn `in_house` → `VC` (R3) – đúng nghiệp vụ. Căn bị khóa OOO trong lúc HK offline → `CL → OOO` (R10) đã xảy ra, thao tác "Dọn xong" → "Không áp dụng được: căn đang khóa sửa chữa".

---

## 9. Thông báo và cập nhật thời gian thực cho HK/MT
- SSE `streamEvents` (architecture 12): PWA nghe `room.status_changed` → gọi lại `listRoomStatuses`; sự kiện việc → `listHkTasks`; `notification.created` → hộp thông báo; mất SSE → TanStack Query gọi lại khi online/focus + mỗi 30 giây. Tên sự kiện việc lệch giữa OpenAPI (`task.assigned`) và erd (`hk_task.changed`) → **E07-08**.
- Thông báo trong app (`staff_notification`, R2; Web Push R3): nội dung chỉ loại + số căn + mã phiếu (SR-PWA-06), ví dụ "Căn 203 cần dọn gấp". Loại cần có (E07-08): phiếu mới mức Cao (MT, FD, MGR), phiếu mới (MT), đề nghị khóa căn (FD, MT), phiếu quá hạn (có sẵn `work_order_overdue`), việc dọn gấp/bộ đồ dùng thêm lên đầu hàng (HK của ca), căn chờ kiểm (FDL+), yêu cầu khách mới (có sẵn `guest_request_new`), việc bị hủy do đơn thay đổi (HK được giao).

---

## 10. Truy vết story → mục (AC Must R2 theo R-C)

| Story / AC | Mục | Ghi chú |
|---|---|---|
| US-052 AC1–AC3 | 1.1–1.3 | AC3: phạm vi T + D01 |
| US-053 AC1–AC4 | 2.1–2.3, 4 | AC3 kiểm đạt qua checklist; AC4 chuyển bị cấm |
| US-054 AC1–AC4 | 3.1–3.4, 9 | AC1 ngân sách độ trễ = SSE + architecture 16 |
| US-055 AC1–AC2 | 4.2–4.4 | |
| US-056 AC1–AC2 | 3.5 | **Phụ thuộc E07-06** (gói dọn cho đơn AC5a) |
| US-057 AC1–AC2 | 5 | |
| US-061 AC1–AC4 | 6.2, 6.4 | AC1 hai ngày + nửa mở; AC3 409 in_house |
| US-062 AC1–AC3 | 6.3–6.5 | AC2 nhật ký phiếu – E07-11 |
| US-058 (Should) | 8 | |
| BR-812 (ESC-014) | 3.1, 3.3, 3.4, 4.2 | Cùng EP03-05 0.1, EP02 mục 0 |
| BR-805, 806 | 2.4 | |
| BR-809 | 6.4 | |

---

## 11. Đề nghị hợp đồng cho ARC (OpenAPI 0.3.4 → 0.3.5) và vai khác

| # | Gửi | Nội dung |
|---|---|---|
| E07-01 | ARC + SEC | `GET /v1/properties/{propertyId}/attachments/{attachmentId}` (`getAttachment`): trả ảnh đã mã hóa lại, `Content-Disposition: inline`, `nosniff`, CSP sandbox (SR-FILE-06); phạm vi theo `purpose` và vai: `work_order` – vai thấy phiếu; `inspection` – FD+, HK người chụp; `penalty_evidence` – FD+ |
| E07-02 | ARC | Mã trường `PERFORMED_AT_OUT_OF_RANGE` (422; `performedAt` ngoài [now − 24 giờ, now + 5 phút] – SR-PWA-05) cho `transitionRoomStatus`, `transitionHkTask`, `recordInspection`, `recordMinibarCheck`; `Problem.code` `CHECKLIST_OUTDATED` (409) cho `recordInspection`; 409 `INVALID_TRANSITION` của các operation PWA **luôn** kèm `currentStatus`/`currentState` (để PWA phân loại "Đã áp dụng") |
| E07-03 | ARC | R5 (BR-805 "đủ 72 giờ là quá") đang ở J8 chạy một lần/ngày → lệch tới 24 giờ so với ví dụ BR-805. Đề nghị quét theo giờ (cùng tick J11 5 phút) hoặc tính khi đọc `listRoomStatuses` |
| E07-04 | ARC | `HkTask.linenChange` (bool – đêm thay ga theo `linen_change_every_nights`, BR-807); `HkTask.carriedOver` (bool – việc từ hôm trước) |
| E07-05 | ARC | `transitionHkTask` body: `cancelReasonCode` enum `guest_refused` / `dnd` / `day_ended` (SYS) / `reservation_changed` (SYS) / `room_blocked` (SYS) / `other` + `cancelNote` (bắt buộc khi `other`) thay `cancelReason` tự do |
| E07-06 | ARC + PO + DOM | Gói dọn cho đơn dài hạn nhập tay AC5a: `manualLongStay.cleaningPlan {weekdays[], windowStart, windowEnd}`, thao tác sửa gói (FD+), `cleaning_schedule.reservation_id` khi chưa có HĐ – không có thì US-056 không chạy được ở R2 |
| E07-07 | ARC | `getInspectionChecklist?roomId=` trả thêm mục động `extra_guest_kit` (BR-812 (5)); `listInspections?roomId=&from=&to=` (lịch sử biên bản kiểm – US-055 AC2) |
| E07-08 | ARC | `StaffNotification.kind` thêm: `work_order_new`, `work_order_high_new`, `work_order_lock_requested`, `hk_task_urgent`, `room_awaiting_inspection`, `hk_task_cancelled`. Thống nhất tên sự kiện SSE của việc buồng phòng (`task.assigned` ở OpenAPI ↔ `hk_task.changed` ở erd 4.8) – đề nghị `hk_task.changed` + `work_order.changed` |
| E07-09 | ARC | `WorkOrderCreate.category` (enum mục 5.1), `WorkOrderCreate.lockRequested`, `WorkOrder.category`, `WorkOrder.lockRequested`, `updateWorkOrder.lockRequested`; `createWorkOrder` của HK có `block` → 403 (ghi rõ trong mô tả, khớp A86) |
| E07-10 | ARC | `block.expectedDoneDate` (cho `createWorkOrder.block` và `RoomBlockCreate`): server tính `endDatePlanned` = ngày xong + `ooo_reopen_buffer_days` khi client không gửi (FD/MT không đọc được tham số), phản hồi trả cả hai ngày; `transitionWorkOrder` body thêm `partsExpectedDate` (bắt buộc với TB/Thấp ở `wait-parts`); `complete` bắt buộc `resultNote`, mức Cao bắt buộc ≥ 1 ảnh |
| E07-11 | ARC | `WorkOrder.history[]` (`at`, `byName`, `change`: `status`/`assignee`/`severity`/`lockRequested`, `from`, `to`, `note`) cho US-062 AC2; `WorkOrder.remedySuggested` (bool, J11 – US-062 AC3); `WorkOrder.partsExpectedDate`, `acceptedAt`, `doneAt` |
| E07-12 | SEC | (a) Thời hạn lưu ảnh `attachment` (sự cố, kiểm phòng) – chưa có trong T01–T18; (b) cho phép PWA giữ **ảnh kiểm phòng** chờ gửi trong IndexedDB như ảnh sự cố (SR-PWA-01); (c) xác nhận ghi chú khách (D23) **không** cache offline (8.1) |
| E07-13 | ARC + DOM | "Cần chú ý" `ooo_ending_work_open` (khối OOO sắp hết mà phiếu chưa xong – mục 6.6), mốc 12:00 ngày cuối còn khóa |
| E07-14 | UXD | Chuỗi **(mới)** trong tài liệu (VI/EN); sửa `hk.task.extra_kit_items` (đang "1 1 mền…", "(không gối)" – BR-812 (3) không nhắc gối) thành "Mỗi bộ: 1 mền, 1 khăn tắm, 1 khăn mặt, 1 bàn chải, 1 bộ đồ vệ sinh cá nhân"; `hk.lock_request` bản HK = "Đề nghị khóa căn" (HK không tự khóa); nhãn 7 `category` sự cố; chip "Chờ gửi", "Từ hôm trước", "Đề nghị khóa"; danh sách "Không áp dụng được" |
| E07-15 | DOM | Xác nhận: (a) phạm vi T gồm việc chưa giao (mục 0); (b) `guest_request` bậc 3 trong BR-807 (3.3); (c) việc ở lại không xong hủy cuối ngày, loại khác chuyển ngày (3.1); (d) kiểm không đạt → giữ `VC` + việc dọn lại (4.4); (e) ảnh chỉ bắt buộc khi tự kiểm (4.2); (f) mức mặc định theo `category` (6.4); (g) hạn mở lại phiếu (6.5); (h) mốc 12:00 cảnh báo khối sắp hết (6.6) |
| E07-16 | QA | Ca đồng hồ giả lập: BR-805 72 giờ (09:59 vs 10:00), J8 07:00, hạn BR-809 có/không dừng khi chờ vật tư, khối OOO hết hạn khi phiếu chưa xong; ca offline: hai HK cùng bắt đầu dọn, dọn xong khi căn vừa bị khóa, `performedAt` quá 24 giờ, đăng xuất khi còn hàng đợi; dump IndexedDB sau 1 ca (SR-PWA-01) |

## 12. Lịch sử thay đổi
| Ngày | Round | Thay đổi | Người |
|---|---|---|---|
| 16/10/2026 | 2 (Sprint 2) | Bản đầu: đặc tả mức trường EP07 (US-052…057), EP08 (US-061, 062), BR-812 phía buồng phòng, US-058 offline (Should), khung US-063 (R3); đề nghị E07-01…16 | BA |
