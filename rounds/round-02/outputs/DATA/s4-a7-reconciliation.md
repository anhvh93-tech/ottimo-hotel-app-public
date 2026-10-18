# A7 – Đối chiếu KPI đêm nay, khách đến/đi và "Cần chú ý" trên DS-0 (G4.4)

- Vai: DATA | Round 2, tuần Ổn định | Bước: **Kiểm thử** (trước cổng QC Sprint 4) | Ngày: 18/10/2026 ~09:20
- Việc: G4.4 / A7 trong `rounds/round-02/qc/s4-gate-readiness.md` (dòng G4.4, việc a4) và `outputs/BE/s4-be-d.md` mục 2.8. Bảng sẵn sàng ghi tên tệp `s4-report.md`; ORC giao tên `s4-a7-reconciliation.md`, nên kết quả nằm ở tệp này.
- Bản code:
  - **HEAD `2b134fb`**, xuất bằng `git archive`, chạy trên DB `ottimo_test_data_a7h`.
  - Chạy lại trên cây làm việc lúc 09:12 và 09:16, DB `ottimo_test_data_a7`. Cây này có thay đổi chưa commit của BE-A và BE-C.
  - Số liệu HEAD và cây làm việc lúc 09:12 **giống hệt nhau**. Lần chạy 09:16 chỉ khác ở A7-03 (xem mục 4).
- Không sửa `src`, không commit. Script tạo DB có chặn tên: chỉ nhận `ottimo_test_data_*`. Không in tệp env.
- **Lượt 2 (18/10 ~09:36, sau bản sửa A7-01 của BE-A):** xem **mục 8**. Mục 0–7 giữ nguyên kết quả lượt 1 để truy vết.

## 0. Kết luận

| Nhóm | Phép so | Khớp | Lệch | Ghi chú |
|---|--:|--:|--:|---|
| KPI đêm nay `getTonightKpi` (14 trường × 4 mốc) | 56 | 48 | **8** | Lệch `occupiedRooms` (K-02) và `occupancyPct` (K-03) ở cả 4 mốc, cùng một nguyên nhân (**A7-01**) |
| Danh sách hôm nay `getArrivalsDepartures` (đến / đi / giữ chỗ × 4 mốc) | 12 | 12 | 0 | Thành phần, thứ tự, nút `check-in`/`check-out` đúng, kể cả 02:00 (US-011 AC3) |
| "Cần chú ý" – các dòng tính tay | 26 | 26 | 0 | Mọi dòng tính tay đều có trong API, đúng loại, mức, số đếm, mã, căn, hạn |
| "Cần chú ý" – dòng API thừa so với đặc tả | – | – | **5** | 4 dòng `work_order_overdue` trùng phiếu Cao (**A7-02**); 1 dòng `room_status_mismatch` sai ở mốc T3 (**A7-03**) |
| Lọc theo vai (FD / MGR / OWN × 4 mốc) | 12 | 12 | 0 | DS-0 không có mục riêng của OWN/MGR (không FOC, cọc tiền mặt, không cảnh báo bảo mật) |
| S1c – biến thể C (DS-0 + 1 đơn OTA xung đột) | 7 | 7 | 0 | Xem mục 3.4 |
| `metricRefs` (K-01, K-02, K-03, S1c) | 1 | 1 | 0 | |

**Lượt 1: G4.4 chưa đạt** (K-02/K-03 lệch). **Lượt 2: G4.4 ĐẠT về số liệu** – 114/114 khớp trên cây chung 09:36 (chưa commit); chốt bằng một lần chạy lại trên commit gộp – mục 8.
- Nguyên nhân: Desk R2 chỉ nhập được đơn dài hạn qua US-017 AC5a "đơn dài hạn nhập tay", và đơn này **không sinh dòng `stay_night`**. KPI chỉ đếm `stay_night` (đúng Q-02), nên bỏ sót 2 căn dài hạn của DS-0 (301, 102).
- Công suất đêm 15/10 vì thế ra **44,4 %** (4/9), thay vì **66,7 %** (6/9). Đây chính là ví dụ của US-010 AC1.
- Biến thể B chứng minh nguyên nhân: thêm đêm `lease_allocation` cho 2 đơn này thì API ra đúng 6/9 = 66,7 % và 7/9 = 77,8 %.

## 1. Cách làm

### 1.1 Nạp DS-0
Product chưa có loader DS-0: QA W6 và BE s1-be-b đều ghi "`seed:ds-0` chưa có loader". DATA viết loader dạng test vitest trong scratchpad. Loader đi qua **api thật** (Nest trong tiến trình, đồng hồ giả, DB riêng) và theo đúng `loadProcedure` của `ds-0.json`:

1. **Nền DS-E**: tham số, 10 căn, nhóm căn, giá niêm yết, kênh, có hiệu lực từ 01/07/2026, vì hai đơn dài hạn đến 01/08 và 05/09. Nạp 17 khách g1…g17 với mã KH-0001…0017, nhãn khách lấy từ DS-0.
2. **17 đơn** qua `POST /reservations`, theo `loadOrder`:
   - hai đơn dài hạn tạo lúc 25/07 bằng AC5a (`manualLongStay`). R2 không có đường nào khác cho đơn dài hạn;
   - 15 đơn còn lại tạo lúc 01/10 09:00;
   - đơn trực tiếp/CTV có cọc tiền mặt theo `depositPaidVnd`;
   - đơn OTA có `otaRef` giả, `otaRoomAmountVnd` = giá đêm × số đêm.
   - **Mã server trả khớp `expectedCode` 17/17**. Không đơn nào phải nâng cọc hay ghi lý do giá.
3. **Nhận / trả phòng** qua api:
   - nhận phòng (B9) lúc 14:00 ngày đến: 0091, 0108, 0136, 0137, 0139, 0142, 0146;
   - trả phòng (B18) lúc 11:00 ngày 14/10: 0136, 0137;
   - cổng BE-C của bước nhận phòng là bản giả, giống `dashboard-s4-bed.test.ts` của BE-D.
4. **Phiếu sửa** lúc 14/10 09:00, theo thứ tự mảng, **mã khớp WO-00001…4**:
   - WO-031: mức Cao, kèm khối OOO 401 [15/10, 17/10); kỹ thuật nhận 09:05;
   - WO-030: Trung bình, chờ vật tư tới 17/10;
   - WO-028: xong;
   - WO-032: mới.
   - Chạy J9 `ooo.activate` lúc 15/10 06:05 → khối chuyển `active`.
5. **Bước 6 của DS-0 (ghi thẳng)**:
   - trạng thái khai báo theo `registrations[]`: `confirmed`, 0142 `partial`, 0152 `pre`, còn lại `none`;
   - `roomStatusAtT0`;
   - đồng hồ đặt lại 15/10 08:00.
6. **Không nạp**:
   - người đi cùng (g15, g16, g17): không nguồn KPI hay "Cần chú ý" R2 nào đọc tới. Phần "người đi cùng VIP" của BR-956 thuộc R3;
   - giấy tờ và ảnh: xem giới hạn của `visa_expiring` ở mục 3.3.

Loader nạp được trọn DS-0. **QA có thể dùng làm gốc cho `seed:ds-0` (W6)**. Tệp ở scratchpad, xem mục 6.

### 1.2 Bốn mốc đọc (đơn chỉ thay đổi theo thời gian, không ai thao tác thêm)
| Mốc | Giờ (VN) | Ngày nghiệp vụ | Mục đích |
|---|---|---|---|
| T0 | 15/10 08:00 | 15/10 | `clockAfterLoad` của DS-0 |
| T1 | 15/10 18:30 | 15/10 | Đã qua giờ gọi no-show 18:00 (BR-311); bộ đồ dùng thêm quá hạn 14:00 (BR-812) |
| T2 | 16/10 02:00 | **15/10** | BR-010 / US-010 AC3: "đêm nay" vẫn là đêm 15/10; đã qua mốc đánh dấu 23:00 |
| T3 | 16/10 08:00 | 16/10 | Sang ngày mới, đơn 15/10 chưa đến vẫn `confirmed` (BR-311 v0.3.8) |

Ở mỗi mốc gọi 3 API, với cả 3 vai FD, MGR, OWN:
- `GET /dashboard/tonight`;
- `GET /arrivals-departures`;
- `GET /attention`.

### 1.3 Cách hiểu ở chỗ định nghĩa chưa rõ
| # | Chỗ chưa rõ | DATA hiểu là | Căn cứ |
|---|---|---|---|
| H1 | Đơn dài hạn có vào "đêm có khách" đêm nay không | **Có.** Đơn `in_house` dài hạn là đêm bán đã gán căn | BR-904 "đêm bán … (gồm dài hạn)"; Q-05; US-010 AC1 "6 căn có đơn `confirmed`/`in_house`", tức ví dụ BL 3.2 gồm 301, 102 dài hạn |
| H2 | "Khách đến" gồm đơn đã nhận hôm nay | `confirmed` + `in_house` có ngày đến = hôm nay. Không tính `hold`, `cancelled`, `no_show` | EP01 1.1, 2.1 (để hiện "{đã nhận}/{tổng}"); BR-404 |
| H3 | Đơn đã báo ETA trước 18:00 nhưng chưa tới | Vào dòng "cần gọi" từ **18:00**, không phải ngay sau ETA. ETA còn ở phía trước thì chưa vào | BR-311 v0.3.8 |
| H4 | Phiếu mức Cao quá hạn | **Một** dòng `work_order_high_open`, mức `critical` khi quá hạn. `work_order_overdue` chỉ dành cho phiếu TB/Thấp | EP01 3.1 (`work_order_overdue`: "Phiếu TB/Thấp quá hạn…"); US-012 AC4 "mỗi loại một dòng" |
| H5 | Đối chiếu buồng – đơn khi khách quá ngày đi chưa trả phòng | Khách còn `in_house` thì căn có khách: OD không phải lệch | BR-806 "OC/OD mà không có đơn `in_house`" |
| H6 | Khách quá ngày đi chưa trả phòng có tính vào K-02 ngày hôm sau không | **Không.** Đêm đó không có `stay_night` `sold` (chưa gia hạn). Khách cũng không nằm trong "Khách đi" của ngày mới | K-02/Q-02; BR-404. Khoảng trống nghiệp vụ: xem O-1 |
| H7 | S1c "số đêm + số đơn" | R2 chỉ trả **số đơn** có đêm `sold` chưa gán căn đêm nay (`unassignedConflictReservations`) và dòng `overbooking`. Số đêm tính tay để đối chiếu, không có trường API | EP01 1.1; metrics S1c. Xem O-2 |
| H8 | Phương thức thu cọc DS-0 | **Tiền mặt** `[GIẢ ĐỊNH DATA]`, vì DS-0 không ghi. Do đó `reconcile_overdue` = 0. Nếu là chuyển khoản thì MGR+ sẽ thấy dòng "chờ đối soát quá 2 ngày" | DS-0 `reservations[].depositPaidVnd` không có phương thức |
| H9 | Hạn khai báo khách VN đã nhận phòng | 23:00 ngày lịch của giờ nhận thực tế: 0142 nhận 13/10 14:00 → hạn **13/10 23:00** | BR-602 |
| H10 | Đơn đến hôm nay chưa nhận phòng | Vào `registration_due`, chưa có hạn (`dueAt` vắng) | EP01 3.1, US-012 AC1 |

## 2. Dữ liệu DS-0 theo căn (tính tay)

| Căn | Đêm 15/10 | Đêm 16/10 | Trạng thái buồng T0 |
|---|---|---|---|
| 101 | OTM-0142 `in_house` | OTM-0142 | OD |
| 102 | OTM-0108 **dài hạn** `in_house` | OTM-0108 | OD |
| 103 | OTM-0150 `confirmed` (đến hôm nay, ETA 14:00) | OTM-0150 | VI |
| 201 | – (OTM-0139 đi 15/10) | – (0139 quá ngày đi, H6) | OD |
| 202 | – | OTM-0151 `confirmed` (đến 16/10) | VD |
| 203 | – | – | VC |
| 301 | OTM-0091 **dài hạn** `in_house` | OTM-0091 | OC |
| 302 | OTM-0152 `confirmed` (đến hôm nay, ETA 15:30, 4 khách > định mức 3) | OTM-0152 | VC |
| 401 | Khối OOO `active` [15/10, 17/10) | OOO | OOO |
| 402 | OTM-0146 `in_house` | OTM-0146 | OD |

Mã thật: OTM-0091 → OTM-00001, 0108 → 00002, 0139 → 00005, 0142 → 00006, 0146 → 00007, 0150 → 00008, 0152 → 00009, 0151 → 00010. WO-031 → WO-00001.

## 3. Bảng đối chiếu

### 3.1 KPI đêm nay – `getTonightKpi` (vai FD; OWN trả giống hệt)
Ở T0, T1, T2 "đêm nay" đều là đêm 15/10, nên tay và API giống nhau ở cả ba mốc. T3 là đêm 16/10.

| Trường (mã) | Tay T0–T2 | API T0 / T1 / T2 | Tay T3 | API T3 | Kết quả | Lý do |
|---|--:|--:|--:|--:|---|---|
| `businessDate` | 15/10 | 15/10 · 15/10 · **15/10** | 16/10 | 16/10 | Khớp | T2 lúc 02:00 vẫn là 15/10 (BR-010, US-010 AC3) |
| `roomsTotal` | 10 | 10 | 10 | 10 | Khớp | |
| `roomsSellable` | 10 | 10 | 10 | 10 | Khớp | |
| `oooRooms` (K-01 OOO) | 1 | 1 | 1 | 1 | Khớp | 401 [15/10, 17/10) phủ cả 15 và 16 |
| `availableRoomsNet` (K-01) | 9 | 9 | 9 | 9 | Khớp | |
| `occupiedRooms` (K-02) | **6** | **4** | **7** | **5** | **Lệch** | **A7-01**: thiếu 301, 102 (đơn dài hạn AC5a không có `stay_night`) |
| `occupancyPct` (K-03) | **66,7** | **44,4** | **77,8** | **55,6** | **Lệch** | Hệ quả của dòng trên |
| `holdOnlyRooms` | 0 | 0 | 0 | 0 | Khớp | DS-0 không có giữ chỗ |
| `unassignedConflictReservations` (S1c) | 0 | 0 | 0 | 0 | Khớp | DS-0 không có xung đột. Trường hợp khác 0: xem 3.4 |
| `arrivals` / `arrivalsCheckedIn` | 2 / 0 | 2 / 0 | 1 / 0 | 1 / 0 | Khớp | 15/10: 0150, 0152; 16/10: 0151 |
| `departures` / `departuresCheckedOut` | 1 / 0 | 1 / 0 | 0 / 0 | 0 / 0 | Khớp | 15/10: 0139 |
| `inHouse` | 5 | 5 | 5 | 5 | Khớp | 0091, 0108, 0139, 0142, 0146 |
| `metricRefs` | K-01/K-02/K-03/S1c | đúng | | | Khớp | |

**Biến thể B** (chỉ để chẩn đoán): ghi thẳng 3 đêm `sold`, `lease_allocation` (14–16/10) cho 0091 và 0108. API khi đó trả `occupiedRooms` 6 ở T0 và 7 ở T3, `occupancyPct` **66,7** và **77,8**, khớp tay. Phần đọc KPI của BE-D đúng công thức; lỗi nằm ở chỗ đơn AC5a thiếu đêm.

### 3.2 Khách đến / đi hôm nay – `getArrivalsDepartures` (vai FD)
| Mốc | Danh sách | Tay | API | Kết quả |
|---|---|---|---|---|
| T0 | Khách đến | 0150 (103, ETA 14:00) → 0152 (302, ETA 15:30); cả hai có nút Nhận phòng | Giống, `allowedActions` = `check-in` | Khớp |
| T0 | Khách đi | 0139 (201, `in_house`), nút Trả phòng | Giống (`reminded_waiting`) | Khớp |
| T0 | Giữ chỗ chưa cọc | rỗng | rỗng | Khớp |
| T1 | Đến / đi / giữ chỗ | như T0; 0139 sau 12:00 thành quá giờ | như T0; 0139 `overdue` | Khớp ×3 |
| T2 (02:00 16/10) | Đến / đi / giữ chỗ | như T0, **vẫn nhận phòng được** (US-011 AC3) | như T0, nút `check-in` còn | Khớp ×3 |
| T3 | Đến / đi / giữ chỗ | 0151 (202) / rỗng / rỗng | Giống | Khớp ×3 |

### 3.3 "Cần chú ý" – `listAttentionItems`
Ký hiệu: C = critical, W = warning, I = info. Danh sách của FD, MGR và OWN giống hệt nhau ở cả 4 mốc, và tính tay cũng ra như vậy.

**T0 – 15/10 08:00** (tay 5 dòng, API 6 dòng)
| Dòng | Tay | API | Kết quả |
|---|---|---|---|
| `registration_overdue` | C · 1 · OTM-00006 · 101 · hạn 13/10 23:00 | Giống | Khớp |
| `work_order_high_open` | C (quá hạn phương án 2 giờ: 14/10 11:00) · WO-00001 · 401 | Giống, `dueAt` 14/10 11:00 | Khớp |
| `work_order_overdue` | **không có** (H4) | C · WO-00001 · 401 | **Lệch – A7-02** |
| `registration_due` | W · 2 (0150 `none`, 0152 `pre`) · 103, 302 · không hạn | Giống | Khớp |
| `vip_arrival` | I · OTM-00009 (g8 VIP) · 302 · 15:30 | Giống | Khớp |
| `room_ooo` | I · 1 · 401 | Giống | Khớp |

**T1 – 15/10 18:30** (tay 7, API 8)
| Dòng | Tay | API | Kết quả |
|---|---|---|---|
| `registration_overdue`, `work_order_high_open` | như T0 | như T0 | Khớp ×2 |
| `work_order_overdue` | không có | C · WO-00001 | **Lệch – A7-02** |
| `no_show_call` | W · 2 (0150, 0152; ETA đã qua; mốc 18:00) · hạn 23:00 | W · 2 · `time` 18:00 · 23:00 | Khớp |
| `extra_guest_kit_overdue` | W · 1 · 302 (hạn 14:00, BR-812) | Giống | Khớp |
| `registration_due` | W · 2 | Giống | Khớp |
| `vip_arrival`, `room_ooo` | như T0 | như T0 | Khớp ×2 |

**T2 – 16/10 02:00, ngày nghiệp vụ 15/10** (tay 7, API 8)
| Dòng | Tay | API | Kết quả |
|---|---|---|---|
| `no_show_mark` | C · 2 · hạn 15/10 23:00. Không còn dòng gọi | Giống | Khớp |
| `registration_overdue`, `work_order_high_open` | như T0 | như T0 | Khớp ×2 |
| `work_order_overdue` | không có | C · WO-00001 | **Lệch – A7-02** |
| `extra_guest_kit_overdue`, `registration_due` (2) | như T1 | như T1 | Khớp ×2 |
| `vip_arrival`, `room_ooo` | như T0 | như T0 | Khớp ×2 |

**T3 – 16/10 08:00** (tay 7, API 9)
| Dòng | Tay | API | Kết quả |
|---|---|---|---|
| `no_show_mark` | C · 2 (đơn 15/10 vẫn `confirmed`, BR-311 v0.3.8) · 15/10 23:00 | Giống | Khớp |
| `registration_overdue`, `work_order_high_open` | như T0 | như T0 | Khớp ×2 |
| `work_order_overdue` | không có | C · WO-00001 | **Lệch – A7-02** |
| `extra_guest_kit_overdue` | W · 1 · 302 | Giống | Khớp |
| `registration_due` | W · 1 · OTM-00010 · 202 | Giống | Khớp |
| `room_status_mismatch` | **không có** (H5: 201 OD, 0139 vẫn `in_house`) | W · 1 · 201 | **Lệch – A7-03** |
| `vip_arrival` | I · OTM-00010 (g5 "Khách quen") · 202 · 14:00 (không ETA → giờ nhận chuẩn) | Giống | Khớp |
| `room_ooo` | I · 401 | Giống | Khớp |

Các loại bằng 0 ở cả 4 mốc, cả tay lẫn API:
- `hold_expiring`;
- `capacity_conflict`, `overbooking`, `unassigned_with_free_room`;
- `visa_expiring`;
- `ooo_ending_work_open` (khối hết 17/10, nên chỉ hiện từ 12:00 ngày 16/10);
- `reconcile_overdue` (H8);
- `foc_threshold` (không có FOC);
- `data_quality`, `security_alert`;
- `guest_request_overdue`, `closed_reservation_credit`, `ota_no_show_report`, `deposit_after_cancel`, `website_request_new`, `channel_sync_error`.

Riêng `work_order_overdue` của WO-030 và WO-032 đúng là 0: WO-030 tạm dừng vì chờ vật tư tới 17/10; WO-032 mức Thấp, hạn 72 giờ tới 17/10.

Giới hạn về `visa_expiring`:
- Tính tay ra 0 ở mọi mốc. g2 là khách dài hạn, thị thực tới 20/11, nên theo BR-605 chỉ nhắc từ **21/10**.
- Nguồn này đọc `guest_document`. Loader không nạp giấy tờ, nên "0 = 0" ở đây **không chứng minh** nguồn chạy đúng.
- Cần QA thêm một ca có giấy tờ, xem O-3.

### 3.4 S1c – biến thể C (DS-0 + biến thể B + một đơn Agoda 15→16/10 vào căn 101 đang có khách, `allowUnassigned`)
| Chỉ số | Tay | API | Kết quả |
|---|---|---|---|
| Đêm `sold` chưa gán căn / số đơn (S1c) | 1 đêm / 1 đơn | `unassignedConflictReservations` = 1; DB 1 đêm (OTM-00018) | Khớp |
| `occupiedRooms` / `occupancyPct` | 6 / 66,7 (đêm chưa gán không vào tử số) | 6 / 66,7 | Khớp |
| `availableRoomsNet` | 9 (không trừ mẫu số) | 9 | Khớp |
| `arrivals` | 3; đơn chưa gán lên đầu, không có nút Nhận phòng | 3; OTM-00018 đầu, `roomNo` null, `allowedActions` rỗng | Khớp |
| `overbooking` | C · 1 | C · 1 | Khớp |
| `registration_due` | W · 3 | W · 3 | Khớp |

## 4. Thẻ lỗi

### A7-01 – KPI đêm nay bỏ sót căn của đơn dài hạn nhập tay (AC5a)
- Mức: **P1 / Major**. Chặn G4.4 và US-010 AC1 trên DS-0.
- Vị trí:
  - `services/api/src/modules/reservations/internal/reservations.service.ts`, hàm `create`: chỉ khi `if (priced)` mới gọi `insertNights`. Đơn `manualLongStay` không có giá nên không sinh đêm;
  - `reporting/internal/tonight-kpi.ts`: đếm `stay_night` `sold`.
- Vấn đề:
  - Trên DS-0, 0091 (301) và 0108 (102) là đơn `in_house` dài hạn nhưng có 0 dòng `stay_night`;
  - `occupiedRooms` = 4 thay vì 6, công suất 15/10 = **44,4 %** thay vì **66,7 %**;
  - ngày 16/10 ra 55,6 % thay vì 77,8 %.
  - Lỗi lặp lại ở mọi mốc. Có trên HEAD `2b134fb` và trên cây làm việc 09:16.
- Vì sao quan trọng:
  - OTTIMO nhắm 4–6 căn dài hạn (K-13). Mỗi căn dài hạn làm công suất trên Tổng quan/Hôm nay thấp đi 11 điểm %;
  - FOC tháng tính phần trăm theo BR-435 trên Σ `stay_night.room_revenue_vnd`, thiếu doanh thu dài hạn. Mẫu số nhỏ đi thì tỷ lệ phồng lên, OWN có thể nhận cảnh báo sai;
  - R3 (K-06, K-12, K-13, ADR) cũng sẽ thiếu.
- Đề xuất sửa. DATA giữ Q-02: một nguồn đêm duy nhất, không đếm căn từ nguồn khác (decision-log 18/10).
  - **A (khuyến nghị)** – BE-A:
    - sinh `stay_night` cho đơn AC5a: `sold`, `room_id` theo đoạn, `stay_type` `long`, `rate_source` `lease_allocation`;
    - doanh thu mỗi đêm theo Q-10, từ `manual_long_stay.monthly_rent_vnd`: chia theo tháng hợp đồng, dư dồn đêm cuối tháng;
    - cập nhật đêm khi gia hạn, trả sớm, đổi căn như đơn ngắn ngày;
    - chạy bổ sung đêm cho các đơn AC5a đã có.
  - **B (tạm, chỉ khi A không kịp cổng; ARC/ORC quyết)** – BE-D:
    - `tonightKpi` đếm thêm căn của đoạn `active` thuộc đơn `external_contract` (`confirmed`/`in_house`) phủ đêm đó;
    - ghi nợ R3 để chuyển sang A.
  - Cả hai cách: BE-D thêm ca test "DS-0 có 2 đơn AC5a → 6/9 = 66,7 %".
- Người sửa: **BE-D** chịu số KPI (ca test, phương án B nếu chọn). **BE-A** sửa nguồn đêm (phương án A). ARC chọn phương án.
- Kiểm lại: DATA chạy lại loader (mục 6). Kỳ vọng T0 6/9, T3 7/9.
- Trạng thái: **Fixed – DATA đã kiểm lại 18/10 09:36 trên cây chung (chưa commit)**: T0–T2 6/9 = 66,7 %, T3 7/9 = 77,8 % (mục 8). Verified khi chạy lại trên commit gộp.

### A7-02 – Phiếu sửa mức Cao quá hạn hiện hai dòng
- Mức: **P3 / Minor**.
- Vị trí: `housekeeping/internal/attention-sources.ts`. Nguồn `overdue` lấy cả phiếu `high`.
- Vấn đề: WO-00001 (Cao, quá hạn phương án 14/10 11:00) ra 2 dòng critical cùng phiếu: `work_order_high_open` và `work_order_overdue`. Lỗi có ở cả 4 mốc.
- Vì sao quan trọng: lễ tân thấy cùng một phiếu hai lần trong khối critical, số việc khẩn bị đếm gấp đôi. Sai EP01 3.1 và US-012 AC4 ("mỗi loại một dòng").
- Đề xuất sửa:
  - `work_order_overdue` chỉ lấy phiếu TB/Thấp;
  - mức Cao để `work_order_high_open` báo, đã chuyển `critical` khi quá hạn;
  - thêm ca test.
- Người sửa: **BE-C** (nguồn thuộc bảng của BE-C, s4-be-d 2.3); BE-D xem lại thứ tự gộp.
- Trạng thái: **Fixed trên cây chung 09:36** (không còn dòng `work_order_overdue` của WO-00001 ở cả 4 mốc). Verified khi chạy lại trên commit gộp.

### A7-03 – Lệch buồng giả khi khách quá ngày đi chưa trả phòng
- Mức: **P3 / Minor**.
- Vị trí: `housekeeping/internal/attention-sources.ts`, nguồn `mismatch`. Bản HEAD lọc `s.to_date >= today`.
- Vấn đề: ở T3, 0139 vẫn `in_house` trong căn 201 (OD) nhưng đã qua ngày đi 15/10. API báo `room_status_mismatch` cho 201, trong khi BR-806 chỉ báo khi OC/OD **không có** đơn `in_house`.
- Vì sao quan trọng: cảnh báo sai hướng. Việc cần làm là trả phòng hoặc gia hạn, không phải sửa trạng thái buồng.
- Đề xuất sửa: một định nghĩa "khách đang ở căn" cho mọi nguồn.
- Tình hình: **cây làm việc (chưa commit) đã có bản sửa của BE-C**: `housekeeping/public/stay-occupancy.ts` `inRoomOnSql`. Lần chạy 09:16 không còn dòng này.
- Người sửa: **BE-C**, gộp bản sửa; DATA chạy lại sau khi gộp.
- Trạng thái: **Fixed trên cây chung 09:36** (T3 không còn dòng). Verified khi chạy lại trên commit gộp.

QA cấp số `BUG-R2-…` cho 3 thẻ khi đưa vào `qa/bug-list.md`. DATA không sửa tệp của QA.

## 5. Quan sát (không tính lệch)
- **O-1 (Suggestion, PO + DOM):** khách quá ngày đi chưa trả phòng (0139 ở T3) gần như vô hình trên "Hôm nay".
  - Không nằm trong "Khách đi" của ngày mới (BR-404), không có dòng "Cần chú ý". J4 "báo đỏ" chưa làm (s4-be-d mục 6).
  - Căn vẫn có người nhưng không vào K-02 (H6).
  - Đề nghị: dòng "Cần chú ý" "quá ngày đi chưa trả phòng", hoặc giữ đơn trong "Khách đi" tới khi B18.
- **O-2 (Suggestion, R3 – DATA/FE):** API R2 chỉ trả số **đơn** S1c đêm nay. Báo cáo R3 cần thêm số **đêm** chưa gán căn (định nghĩa S1c đầy đủ).
- **O-3 (QA):** chưa có ca A7 cho `visa_expiring` với giấy tờ thật. Đề nghị ca T6/E2E nạp giấy tờ g2 (thị thực 20/11, đơn tới 04/12): nhắc từ 21/10, không trước.
- **O-4 (QA, W6):** loader DS-0 dạng test (mục 6) nạp trọn DS-0 qua api, 21/21 mã khớp `expectedCode`. Có thể dùng làm gốc `seed:ds-0`. Hai chỗ ghi thẳng (khai báo, trạng thái buồng) đúng bước 6 của DS-0.

## 6. Tệp và cách chạy lại
Thư mục scratchpad: `/private/tmp/claude-501/-Users-anhvh-Library-Application-Support-Claude-scratch-workspaces-00554cf2-3678-4864-82b0-830aaeaa97bd-4c0caebe-be05-49c5-a5a2-5bf357fddc6a-scratch-2026-10-15-c4f0d4/36df3adc-c586-471c-a039-340d2b696728/scratchpad/data-a7/`
- `newdb.sh <ottimo_test_data_*>`: tạo lại DB, từ chối mọi tên khác.
- `env-data.sh` / `env-head.sh`: biến DB của DATA, không in ra.
- `a7-ds0.test.ts`: loader DS-0 + 4 mốc + biến thể B, C.
- `vitest.a7.config.mts`: cấu hình chạy.
- `a7-ds0-head.test.ts`, `vitest.head.config.mts`, `head/`: bản chạy trên HEAD xuất bằng `git archive`.
- Kết quả thô: `out-head.json` (HEAD `2b134fb`), `out-wt-0912.json`, `out.json` (cây làm việc 09:16).

Chạy lại, với PATH có `$HOME/.local/bin:$HOME/.local/node/bin`:
```
bash newdb.sh ottimo_test_data_a7 && source env-data.sh
cd product/services/api && pnpm db:migrate
./node_modules/.bin/vitest run --config <scratchpad>/data-a7/vitest.a7.config.mts
```

## 7. Báo cáo ngắn (theo protocol)
- **Đã làm gì:**
  - tính tay K-01…K-03, S1c, khách đến/đi và các nguồn "Cần chú ý" trên DS-0 ở 4 mốc;
  - nạp DS-0 qua api thật trên DB riêng;
  - so 114 phép so: 106 khớp, 8 lệch; API còn thừa 5 dòng "Cần chú ý";
  - tìm 3 lỗi, trong đó 1 lỗi P1 chặn G4.4.
- **Tệp tạo/sửa:**
  - tạo tệp này;
  - `01-decisions/decision-log.md` +1 dòng DATA: Q-02 áp cho đơn AC5a.
- **Giả định:** H8 (cọc tiền mặt); không nạp người đi cùng và giấy tờ.
- **Rủi ro:** cây làm việc đang đổi nhanh (BE-A, BE-C). Số ở đây gắn với HEAD `2b134fb`. Sau khi gộp bản sửa A7-01…03 cần chạy lại (khoảng 15 giây).
- **Việc chưa xong:** kiểm lại sau khi sửa; ca `visa_expiring` có giấy tờ (O-3, QA).

## 8. Lượt 2 – kiểm lại sau bản sửa A7-01 (18/10 ~09:36)

### 8.1 Cách chạy
- Cây chung lúc 09:36: HEAD `2b134fb` cộng 36 tệp `src` chưa commit, trong đó có bản sửa A7-01 của BE-A (`s4-be-a.md` mục 20: `reservations/internal/lease-nights.ts`, job `lease.nights`). DB `ottimo_test_data_a7` tạo mới và migrate lại.
- `a7-ds0.test.ts` **bỏ biến thể B**: đêm `lease_allocation` nay có sẵn nên ca chèn tay đụng chỉ mục duy nhất. Biến thể C (S1c) chạy thẳng trên DS-0.
- Mã thật vẫn khớp `expectedCode` 21/21. Đơn AC5a nay có đêm: OTM-00001 365 đêm, OTM-00002 90 đêm, mỗi đơn 1 đêm `sold` ngày 15/10.
- Kết quả thô: `scratchpad/data-a7/out-wt-0936.json`.

### 8.2 Kết quả
| Nhóm | Phép so | Khớp | Lệch | So với lượt 1 |
|---|--:|--:|--:|---|
| KPI đêm nay (14 trường × 4 mốc) | 56 | **56** | 0 | `occupiedRooms` 6/6/6/7, `occupancyPct` **66,7 / 66,7 / 66,7 / 77,8**, đúng số tính tay. A7-01 hết |
| Khách đến / đi / giữ chỗ (× 4 mốc) | 12 | 12 | 0 | Giống hệt lượt 1 |
| "Cần chú ý" – dòng tính tay (5 / 7 / 7 / 7) | 26 | 26 | 0 | |
| "Cần chú ý" – dòng API thừa | – | – | **0** | Không còn `work_order_overdue` trùng (A7-02) và `room_status_mismatch` 201 (A7-03) |
| Lọc theo vai FD / MGR / OWN (× 4 mốc) | 12 | 12 | 0 | |
| S1c – biến thể C | 7 | 7 | 0 | `unassignedConflictReservations` 1, công suất vẫn 6/9, `overbooking` C·1, đơn chưa gán lên đầu, không có nút Nhận phòng |
| `metricRefs` | 1 | 1 | 0 | |
| **Tổng** | **114** | **114** | **0** | |

**G4.4: ĐẠT về số liệu.** K-01…K-03, S1c, khách đến/đi và "Cần chú ý" khớp hoàn toàn số tính tay trên DS-0 ở cả 4 mốc.
- Điều kiện: ba bản sửa (A7-01 của BE-A, A7-02 và A7-03 của BE-C) đang **chưa commit**.
- Sau khi ORC gộp, chạy lại `a7-ds0.test.ts` một lần trên commit đó (khoảng 15 giây, lệnh ở mục 6). QC ghi mã commit đó vào cổng.

### 8.3 Đêm `lease_allocation` so với Q-10 (DS-0)
| Đơn | Kiểm | Kết quả |
|---|---|---|
| OTM-00001 (0091, HĐ từ 01/08, thuê 11.130.000) | Mỗi tháng lịch = một tháng HĐ. Σ mỗi tháng = 11.130.000. Tháng 31 đêm: 30 × 359.032 + 359.040. Tháng 30 đêm: 371.000. Tháng 2: 397.500 | Đúng Q-10 (trùng ví dụ "Daniel") |
| OTM-00002 (0108, 05/09 → 04/12, thuê 9.410.000) | Tháng HĐ 1 [05/09, 05/10): 313.666 × 29 + 313.686. Tháng HĐ 2 [05/10, 05/11): 303.548 × 30 + 303.560. Σ mỗi tháng = 9.410.000 | Đúng Q-10 |
| OTM-00002 – phần đuôi [05/11, 04/12), 29 đêm | **Sau D-A7-1 (DOM chốt "tháng thiếu", BE-A sửa `leaseNightAmounts`):** 9.410.000 ÷ 29 = 324.482,76 → 28 × 324.482 + **324.504** (dư 22 đ dồn đêm 03/12) = 9.410.000. Tổng đơn **28.230.000** = 3 tháng tiền thuê. Đã kiểm 18/10 09:44 trên DB mới | Đúng Q-10 và D-A7-1. Bản 09:36 tính ngày lẻ BR-210, 314.000 × 29, nay đã thay |

K-01…K-03 không bị ảnh hưởng (chỉ đếm đêm). Phần tiền chỉ vào K-06 (R3) và mẫu số tỷ lệ FOC của BR-435 (OWN, R2). Sau D-A7-1, tổng đêm của mỗi đơn dài hạn nhập tay trong DS-0 bằng đúng tiền HĐ: OTM-00001 = 12 × 11.130.000, OTM-00002 = **28.230.000**.

### 8.4 Oracle BR-215-01 lệch 4 đ – **mã đúng, oracle sai**
- **Tính lại:** 11.130.000 ÷ 31 = 359.032,26.
  - Mỗi đêm lấy phần nguyên 359.032. Dư 11.130.000 − 31 × 359.032 = **8 đ**, dồn vào đêm cuối tháng HĐ (14/11).
  - Tháng 10 (15–31/10, 17 đêm) = 17 × 359.032 = **6.103.544**.
  - Tháng 11 (1–14/11) = 13 × 359.032 + 359.040 = **5.026.456**. Tổng 11.130.000.
- **Oracle** ghi 6.103.548 / 5.026.452 = làm tròn 11.130.000 × 17/31, tức chia tỷ lệ số thực theo tháng báo cáo.
- **Quy tắc không mơ hồ:**
  - Q-10: "chia lấy phần nguyên đồng cho từng đêm, phần dư dồn đêm cuối của tháng hợp đồng".
  - Q-02: "báo cáo **không tự chia lại** để tổng các tháng khớp đúng từng đồng".
  - Hai câu này cho kết quả duy nhất: số tháng báo cáo = Σ đêm trong tháng = 6.103.544.
- Ví dụ trong chính Q-10 (HĐ 9.500.000) cũng tính theo tỷ lệ. Đây là lỗi ví dụ của DATA; **DATA đã sửa** trong `metrics-definitions.md` Q-10 (5.209.667 / 4.290.333), kèm câu "số theo tháng báo cáo = Σ đêm" và ví dụ BR-215.

#### FB-R2-DATA-QA-A7-01
- Mức độ: Minor (lệch 4 đ; nhưng sai thì ca test của BE-A không kiểm được trường này)
- Vị trí: `product/tests/fixtures/br-examples.json`, BR-215-01 `expected.reportMonthAllocationVnd` và `note`
- Vấn đề: `2026-10: 6103548`, `2026-11: 5026452` là chia tỷ lệ số thực; quy tắc Q-10 + Q-02 cho 6.103.544 / 5.026.456 (lệch 4 đ, tổng tháng HĐ vẫn 11.130.000)
- Vì sao quan trọng: báo cáo R3 (K-06) cộng `stay_night`; oracle sai sẽ bắt BE chia lại theo tỷ lệ và phá tính "tổng các tháng = tiền HĐ" từng đồng
- Đề xuất sửa: `"2026-10": 6103544`, `"2026-11": 5026456`; `note` = "17 × 359.032 (phần nguyên mỗi đêm); dư 8 đ dồn đêm 14/11 thuộc tháng 11 – Q-10, Q-02". Sau đó BE-A cho ca `a7-lease-nights` kiểm luôn trường này
- Trạng thái: Open

#### FB-R2-DATA-DOM-A7-01
- Mức độ: Minor (chỉ là ví dụ, quy tắc đúng)
- Vị trí: `product/docs/business-rules.md` BR-215, cột ví dụ
- Vấn đề: "→ 6.103.548 (làm tròn đồng); tháng 11 nhận 14 đêm còn lại". Đúng quy tắc phải là **6.103.544**; tháng 11 = **5.026.456**
- Đề xuất sửa: thay số và ghi "tháng 10 = 17 × 359.032; dư 8 đ ở đêm cuối tháng HĐ (14/11)"
- Trạng thái: Open

### 8.5 Câu hỏi để DOM chốt (không chặn G4.4; cần trước báo cáo doanh thu R3)
- **D-A7-1 – Phần đuôi ngắn hơn một tháng hợp đồng của đơn dài hạn nhập tay. ĐÃ CHỐT 18/10: DOM chọn "tháng thiếu"; BE-A đã sửa `leaseNightAmounts`; DATA kiểm lại lúc 09:44: tổng 28.230.000.**
  - Ví dụ DS-0 OTM-0108: HĐ "3 tháng" từ 05/09 nhưng ngày đi ghi 04/12 (BL snapshot; BR-209 cho 05/12).
  - Bản trước (09:36) tính 29 đêm cuối là ngày lẻ BR-210. Nay chia 9.410.000 cho 29 đêm: 28 × 324.482 + 324.504, tổng **28.230.000**.
  - Cách khác: coi là **tháng HĐ thứ 3 thiếu 1 đêm**, chia 9.410.000 cho 29 đêm, tổng 28.230.000 = số khách trả.
  - (Đề xuất ban đầu của DATA là giữ ngày lẻ. DOM chọn "tháng thiếu"; DATA đồng ý vì tổng đêm = tiền HĐ, đúng mục đích của Q-10.)
- **D-A7-2 – Làm tròn giá đêm quy đổi BR-102 khi không chia hết.**
  - 9.410.000 ÷ 30 = 313.666,67. Mã làm tròn theo `rounding.night_rate` (1.000) → 314.000, cùng giá trị lễ tân và folio dùng cho phụ thu, hoàn trả (BR-413).
  - BR-102/BR-210 chỉ có ví dụ chia hết (371.000).
  - **DATA đề xuất:** chấp nhận `rounding.night_rate` để một con số dùng chung mọi chỗ.
  - DOM ghi rõ vào BR-102.

### 8.6 Tệp sửa ở lượt 2
- `rounds/round-02/outputs/DATA/s4-a7-reconciliation.md` (tệp này: mục 0, trạng thái thẻ, mục 8).
- Lượt 3 (09:44): chạy lại sau bản sửa D-A7-1. 114/114 vẫn khớp, KPI và "Cần chú ý" không đổi so với 09:36. Kết quả thô: `scratchpad/data-a7/out-wt-d-a7-1.json`.
- `product/docs/metrics-definitions.md`:
  - Q-10: sửa ví dụ 9.500.000 và thêm câu "số tháng báo cáo = Σ đêm" + ví dụ BR-215;
  - mục 10: +1 dòng lịch sử.
- Scratchpad: `data-a7/a7-ds0.test.ts` bỏ biến thể B và thêm truy vấn đêm `lease_allocation`. Bản lượt 1 lưu ở `a7-ds0.v1.test.ts.bak`.
