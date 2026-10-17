# BE-B – gợi ý cho vòng kiểm chứng đối kháng tiền S4-38

- Người viết: BE (luồng BE-B) | Ngày: 17/10/2026 | Dùng cho: ORC + QA + người phản biện (S4-38, plan mục 3 M1, mục 4.1 mốc D7)
- Mục đích: liệt kê **mọi đường tiền BE-B đã chạm** trong Sprint 4 và các **ca biên** nên thử. Mỗi ca ghi "nên thấy gì" để người phản biện so nhanh. Đây không phải kết luận "đúng", BE-B chỉ chỉ chỗ dễ sai.
- Cách chạy gợi ý: PostgreSQL thật, stack riêng (không đụng demo). Đọc `getFolio`, `listApprovalRequests` (các trường `effectiveAmountVnd`, `focState`, `lineChangedNote`, `autoCancelReason`, `version`), `audit_event` loại `money` và `staff_notification`.

## 1. Đường tiền BE-B đã chạm

| # | Đường | Ở đâu (mã) | Ghi chú cho người phản biện |
|---|---|---|---|
| P1 | **Đồng bộ FOC theo khóa**: áp = min(số đã duyệt, dòng − Σ khoản trước), theo thứ tự lúc duyệt; ngủ / khôi phục; chờ duyệt đi theo dòng mới; tự hủy | `folio/public/folio.service.ts` `syncReductions`, `planReductions`, `applyFoc`, `followPending`, `cancelFoc`; hàm thuần `folio/public/reductions.ts` | Khóa: folio × loại × ngày (`room`, `extra_person`); một khóa mỗi lượt (`early_checkin`, `late_checkout`); dòng khác = chính dòng (đi theo bản thay của `adjustFolioLine`). Ngày hiện tại của khóa nằm ở `approval_request.foc_service_date` (0060) |
| P2 | Nơi gọi P1 | `syncStay` (B2/B4/B7/B8/B12/B13/B14/B16/PATCH người), `voidStay` (B10/B11/di dời – 2 pha), `replaceLateCharge` (B15/B13/B16/B18), `reverseLine` (mặc định – đếm lại minibar, chênh lệch OTA B14/B16), `adjustFolioLine`, hook duyệt FOC, `settle` (B18) | Một lần gọi bị sót là FOC lệch. Đường **không** gọi P1: `postLines` (ghi dòng mới không qua đồng bộ) – xem ca A7 |
| P3 | Dòng phòng ghi theo **giá gộp** của đêm; `stay_night.discount_vnd` = số đang áp; hoa hồng + phí kênh tính trên số ròng **sau** đồng bộ | `syncStay`, `syncNightDiscounts`, `StayNightAllocationService.setDiscount/revenueOf` | S4-01/03. Sau `adjustFolioLine` hoa hồng chỉ phân bổ lại ở lần đồng bộ đêm kế tiếp (đã biết – B18 có `resyncStay`) |
| P4 | Hạn mức tháng | `ApprovalService.monthlyApprovedBy` | Chỉ tính `applied`/`dormant`; folio đã chốt thì tính số thực áp; `suspended`/`cancelled`/chờ/từ chối không tính |
| P5 | Thứ tự khóa khi duyệt FOC | `ApprovalService.onBeforeDecide` → `FolioService.lockStay` (các đơn của folio → folio → yêu cầu); `FolioFocService.request` cùng thứ tự | Test đua của BE-B từng ra 40P01 trước khi sửa |
| P6 | Hủy / no-show: dịch vụ đảo hoặc giữ, phí, **một** yêu cầu hoàn, "Cần chú ý" | `FolioService.closeStayPreview` (dry run = ghi), `voidStay` (`services.retainLines`), `closeStayCredit`; `reservations.service.ts` `cancel`/`markNoShow` (đoạn BE-B) | Yêu cầu hoàn = số dư thừa **sau** phí và đảo dịch vụ, không gồm tiền OTA. Yêu cầu đã mở không đổi số, chỉ xin phần còn thiếu |
| P7 | Mục `closed_reservation_credit` tự đóng | `RefundsService.payOut` | Đóng khi `rawCreditVnd` của folio ≤ 0 và đơn `cancelled`/`no_show` |
| P8 | Trần `otaPenaltyVnd` | `reservations.service.ts` `cancel` | = `total_room_vnd` của đơn OTA (không cộng phụ thu người) |
| P9 | Sửa giá đêm từ folio (S4-35 B) | `FolioLinesService.adjust` → `StayNightPricingPort.setNightRate` (BE-A) → đảo + ghi lại → P1 | Giá nhập = giá lịch trước bậc BR-107 |
| P10 | Thông báo `refund_ready` | `RefundsService.onDecided` | S4-42: tiền mặt hoặc chưa chọn nơi nhận → thêm mọi FD/FDL đang hoạt động (chưa có bảng ca) |
| P11 | **Chưa gộp** (bản vá): `expectedVersion` (#6), trần số xin theo khóa ở `requestFocForSurcharge` (S4-25) | `outputs/BE/s4-be-b-b6-expected-version.patch`, `outputs/BE/s4-be-b-s4-25.patch` | Nếu chạy S4-38 trước khi gộp: ca S4-25 (6) ở B15 sẽ còn cho xin vượt khóa – xem ca B6 |

## 2. Ca biên nên thử

### A. Đua (hai thao tác cùng lúc trên cùng folio)

| Ca | Cách thử | Nên thấy |
|---|---|---|
| A1 | Duyệt FOC chờ ‖ B7 kéo dài đơn làm đổi giá đêm đó (BR-107) | Một trong hai xong trước, bên sau đọc lại. Cuối cùng: `approved` + `applied` = min(số xin, dòng hiện tại), dòng FOC trỏ đúng dòng đêm sống. Không có "approved mà không áp", không 500 |
| A2 | Duyệt ‖ B10 hủy đơn | Duyệt xong trước: `focState = cancelled` (`reservation_cancelled`), audit `folio.foc_cancelled`, hạn mức trả lại. Hủy xong trước: yêu cầu `cancelled` (`autoCancelReason = reservation_cancelled`), duyệt nhận 409 |
| A3 | Duyệt ‖ B11 no-show | Như A2 nhưng `suspended` / `reservation_no_show` |
| A4 | Duyệt FOC trên trả muộn ‖ B15 đổi giờ trả | FOC = min(số xin, phụ thu lúc duyệt). Nếu giờ mới trong ân hạn thì `dormant` (không "approved mà không áp") |
| A5 | Duyệt ‖ PATCH số người (phụ thu người về 0) | `dormant`; PATCH lại → `applied` = min(số đã duyệt, phụ thu mới) |
| A6 | Hai người duyệt **hai yêu cầu khác nhau trên cùng một khóa** gần như cùng lúc | Tổng áp ≤ dòng, không đêm âm. Thứ tự = `decided_at`, rồi `requested_at`, rồi `id`; bản đầu được nhận đủ trước. Thử cả cùng mili-giây (đồng hồ giả) |
| A7 | Ghi dòng phát sinh bằng `postLines` (vd. B18 ghi đêm thêm, phạt) **trong lúc** có FOC ngủ trên khóa trả muộn | Đường `postLines` không gọi P1: FOC ngủ chỉ khôi phục ở lần đồng bộ sau (đổi giờ trả, B18). **Nên thử xem có số nào lệch lúc chốt** – nghi vấn BE-B tự nêu |
| A8 | Tự áp FOC minibar (FD) ‖ FDL duyệt FOC khác cho cùng người duyệt/tự áp | Khóa hạn mức (advisory lock) – không vượt `per_month` |
| A9 | B10 hủy ‖ chi hoàn tiền mặt của một yêu cầu hoàn cũ trên cùng đơn | Không âm số dư; yêu cầu hoàn tự tạo không xin lại phần đã có yêu cầu mở |

### B. Nhiều khoản trên một khóa (S4-23, BR-434 v0.3.6)

| Ca | Cách thử | Nên thấy |
|---|---|---|
| B1 | Đêm 401 (1.042.000): giảm giá đặc biệt 250.000 (duyệt trước) + FOC 792.000. Đổi 401 → 302 → 101 → 401 (B7 khách xin) | 1.042.000 → 917.000 → 667.000 → 1.042.000; FOC 792.000 → 667.000 → 417.000 → 792.000 (oracle BR-434-11) |
| B2 | Như B1 nhưng **ba** khoản (thêm FOC 100.000 duyệt sau cùng); hạ giá xuống dưới tổng hai khoản đầu | Khoản 3 áp 0 → `dormant`; khôi phục khi giá lên; báo cáo FOC = Σ `effectiveAmountVnd` |
| B3 | FOC chờ duyệt trên khóa đã có khoản đã duyệt; đổi căn trước khi duyệt | Hàng chờ: `lineChangedNote` cũ → mới, `effectiveAmountVnd` = min(số xin, dòng − khoản đã duyệt) (oracle BR-434-12) |
| B4 | Xin mới khi dòng đã được miễn hết | 422 `VALUE_OUT_OF_RANGE`, `max = 0` |
| B5 | Phụ thu người về 0 (FOC ngủ) → **dời đơn sang ngày khác** (B7/B8) → tăng người lại | FOC khôi phục ở **ngày mới** của khóa (theo bản đồ ngày – cột `foc_service_date`). Sai hay gặp: FOC kẹt ở ngày cũ hoặc mất |
| B6 | B15 có FOC đã duyệt trên trả muộn, gọi B15 lần nữa giờ cao hơn kèm `requestFocForSurcharge` = cả phụ thu mới | **Trước bản vá S4-25**: server nhận (tổng xin có thể > phụ thu – chỉ lệch báo cáo, tổng áp vẫn ≤ dòng). **Sau bản vá**: 422 với `max` = phụ thu mới − FOC đang áp |
| B7 | Folio chốt khi một khoản đang ngủ (trả muộn về ân hạn) | Khoản đó `cancelled` (`settled_while_dormant`), audit `folio.foc_cancelled`, hạn mức trả lại; các khoản `applied` tính theo số thực áp |
| B8 | Gia hạn B13 làm đảo trả muộn (FOC ngủ) rồi trả muộn ở ngày đi mới | FOC khôi phục = min(số đã duyệt, phụ thu mới), không duyệt lại (BR-412) |
| B9 | B12 khôi phục no-show **sau** ngày nghiệp vụ (MGR) và khi căn đã bán lại (làn chưa gán) | FOC của các đêm quay lại `applied` (BR-315 (g) (b)(c)); hạn mức tính lại |

### C. `otaPenaltyVnd` (S4-37) và tiền OTA

| Ca | Cách thử | Nên thấy |
|---|---|---|
| C1 | Đơn OTA trả trước, `otaRoomAmountVnd` = X; hủy với phạt X và X + 1 | X → 200, `ota_collect` = X; X + 1 → 422 `VALUE_OUT_OF_RANGE` |
| C2 | Đơn OTA trả trước, khách thêm người tại quầy (phụ thu đã thu tiền mặt), rồi hủy với phạt X | Tiền phụ thu đã thu → **yêu cầu hoàn tự tạo** (S4-06) bằng đúng số đó; tiền OTA không vào số dư thừa |
| C3 | Đơn OTA trả tại cơ sở, hủy với phạt | Phạt = còn phải thu tại cơ sở; không yêu cầu hoàn nếu khách chưa trả gì |
| C4 | Đơn OTA có đơn con Trực tiếp (B13), hủy/rút | Đơn con không đụng `ota_collect` của đơn gốc |
| C5 | FOC trên đêm phòng đơn OTA trả trước | 422 `FOC_NOT_ALLOWED_OTA_PREPAID` (giữ quy tắc cũ) |

### D. Hủy / no-show với dịch vụ (S4-06, S4-08)

| Ca | Cách thử | Nên thấy |
|---|---|---|
| D1 | Hủy thử (`dryRun`) rồi hủy thật với **cùng** `retainLines` | `serviceLines`, `serviceReversedVnd`, `serviceRetainedVnd`, `refundRequestVnd` của thử = của thật, từng đồng |
| D2 | Dịch vụ đã trả tiền và giữ một dòng | Số hoàn = dư thừa sau phí và sau khi đảo dòng không giữ; dòng giữ vẫn tính |
| D3 | Đã có yêu cầu hoàn mở (vd. khách trả dư lúc trước) rồi hủy | Không xin trùng: tổng yêu cầu mở = dư thừa; `unhandledCreditVnd` = 0 |
| D4 | Khách trả bằng chuyển khoản chưa đối soát rồi hủy | Yêu cầu hoàn tạo được; chi bị chặn tới khi đối soát (BR-522) |
| D5 | `markNoShow` với `retainLines` trỏ dòng phòng | 422 trước khi ghi gì, đơn vẫn `confirmed` |
| D6 | FOC trên dịch vụ bị đảo khi hủy, FOC trên dịch vụ giữ | Bị đảo: `cancelled` (`reservation_cancelled`). Giữ: vẫn `applied` |
| D7 | Chi hoàn một phần rồi đủ | Mục `closed_reservation_credit` còn mở sau lần một, đóng sau lần đủ |

### E. Sửa giá đêm từ folio (S4-35 B)

| Ca | Cách thử | Nên thấy |
|---|---|---|
| E1 | FOC 100 % đã duyệt, sửa giá đêm xuống rồi lên | FOC = giá mới khi xuống, = số đã duyệt khi lên lại; đêm vẫn 0 |
| E2 | Giá ngoài sàn–trần; `newQuantity`/`voidLine` trên dòng đêm của đơn đang ở | 422 `RATE_OUT_OF_RANGE`; 422 `NOT_ALLOWED` |
| E3 | Sửa giá đêm rồi B7 đổi ngày giữ căn / B7 khách xin đổi căn | Giữ giá sửa tay / lấy lịch giá căn mới (BR-429 (g)); FOC theo P1 |
| E4 | Hoa hồng ngay sau E1 | Chưa phân bổ lại tới lần đồng bộ sau (giới hạn đã biết) – kiểm số **lúc B18** mới là số chốt |

### F. Hạn mức tháng (BR-433)

| Ca | Cách thử | Nên thấy |
|---|---|---|
| F1 | FDL duyệt 300.000, khách dời bỏ đêm đó | Hạn mức trả lại (oracle BR-433-03) |
| F2 | Duyệt cuối tháng, hủy theo quy tắc sang tháng sau | Trả lại vào **tháng của lúc duyệt** |
| F3 | FD tự áp minibar tới sát `per_month`, rồi FOC đó ngủ (đếm lại minibar) | Vẫn tính (ngủ = còn sống) tới khi chốt folio |
| F4 | Giảm giá đặc biệt ≤ 300.000 do FDL duyệt (BUG-R2-104 đã sửa) | FDL duyệt được; > 300.000 → chuyển quản lý |

## 3. Giới hạn đã biết (đừng tính là phát hiện mới – nhưng xác nhận có sai tiền không)

1. Dòng FOC trả muộn mang theo **trước Sprint 4** (dữ liệu cũ, không có liên kết yêu cầu) không được nối lại – chỉ ảnh hưởng dữ liệu demo cũ.
2. Hoa hồng sau `adjustFolioLine` dòng đêm (E4).
3. Chưa có thao tác "khách để lại tiền" cho đơn đã đóng → mục chú ý S4-06 có thể mở lâu.
4. `refund_ready` gửi mọi FD/FDL đang hoạt động (chưa có dữ liệu ca).
5. Bản vá #6 và S4-25 chưa gộp (P11).
