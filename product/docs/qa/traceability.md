# Ma trận truy vết – Story ↔ AC ↔ BR ↔ Test case ↔ Endpoint ↔ Wireframe

- Tác giả: QA | Round 1 – Bước 2 (Sản xuất, đợt 4) | Ngày: 15/10/2026 | Phiên bản: 0.1
- **File này do script sinh** – không sửa tay: `python3 product/tests/tools/gen_traceability.py` (chạy từ thư mục gốc repo). Nguồn: `03-backlog/backlog.md` (story, AC), `product/tests/test-cases/r1-main-flows.md` (TC), `product/docs/api/openapi.yaml` (`operationId`, `x-stories`), `product/docs/business-rules.md`, `product/docs/baseline-issues-triage.md`, `product/design/wireframes/0*.html` (dòng đầu trang liệt kê US).
- Đọc cùng `product/docs/qa/test-strategy.md`. Cột **Endpoint** = hợp của `x-stories` trong OpenAPI và endpoint QA dùng trong TC. Cột **Wireframe** = trang có ghi US ở đầu trang (`L2`…); mục có hậu tố "(QA)" = QA tự đối chiếu màn hình khi đầu trang không ghi US. Cột ERD không nằm trong ma trận này (QC C1 – ARC đã có `erd.md` mục 13 truy vết thực thể).

## 1. Kết quả đếm (script)

| Chỉ số | Kết quả |
|---|---|
| Story Must R2 trong backlog (mục 3) | **74** |
| Story Must R2 có ≥ 1 TC | **74/74** (100%) |
| AC của story Must R2 (backlog mục 4) | **244** |
| AC có ≥ 1 TC | **244/244** (100.0%) |
| Story Must R2 không có AC ở mục 4 | 0  |
| Tổng số TC | **313** (Cao 192 · TB 113 · Thấp 8) |
| TC theo nhóm | L2 49 · L3 44 · L4 50 · L5 40 · L6 31 · L7 26 · L8 10 · NT 32 · RB 22 · X 9 |
| TC theo tầng (một TC có thể nhiều tầng) | U 39 · A 281 · E 117 · P 5 · M 4 |
| TC cho story ngoài Must R2 (ca chính) | US-041 (2), US-064 (1), US-137 (1), US-139 (3) |
| `operationId` dùng trong TC nhưng không có trong OpenAPI | 0 |
| Tham chiếu AC sai (AC không tồn tại) | 0 |
| Mã TC trùng | 0 |
| Story Must R2 **không có endpoint** (OpenAPI lẫn TC) | 0 |
| Story Must R2 có endpoint trong TC nhưng OpenAPI chưa gắn `x-stories` | 0 |
| Story Must R2 **không có wireframe** | 10 |
| BR trong danh mục / BR không được story hay TC nào tham chiếu | 129 / 13 |

**Không còn AC nào của story Must R2 thiếu test case.**

## 2. Ma trận story Must R2

| Story | Tên (backlog mục 4) | AC → TC | BR trong AC | Endpoint (operationId) | Wireframe |
|---|---|---|---|---|---|
| US-001 | Đăng nhập (UC-28) | AC1: TC-NT-001<br>AC2: TC-NT-002, TC-NT-003<br>AC3: TC-NT-004, TC-X-030<br>bổ sung: TC-NT-005 | BR-001 | `createReservation`, `getMe`, `getRack`, `getReservation`, `getReservationHistory`, `listAuditEvents`, `login`, `logout`, `updateReservation` | L1 |
| US-002 | Gán vai (UC-28, rbac A100) | AC1: TC-NT-006, TC-NT-007<br>AC2: TC-NT-008, TC-RB-018<br>AC3: TC-NT-009<br>AC4: TC-NT-010<br>bổ sung: TC-RB-019 | – | `createReservation`, `createUser`, `getMe`, `getReservation`, `listAuditEvents`, `listQuotes`, `listReservations`, `listUsers`, `login`, `setUserRoles`, `updateUser` | L1 |
| US-003 | Ẩn dữ liệu nhạy cảm (rbac mục 6–7) | AC1: TC-RB-001, TC-RB-002<br>AC2: TC-RB-003<br>AC3: TC-RB-004<br>AC4: TC-RB-005 | – | `getDocumentImage`, `getGuest`, `getGuestDocumentSensitive`, `getPortalData`, `getRegistration`, `getReservation`, `getTonightKpi`, `listAttentionItems`, `listItems`, `listParty`, `recordMinibarCheck`, `searchGuests` | L1, L4 §4.1 (ghi chú giá vốn) (QA) |
| US-004 | Danh mục căn | AC1: TC-NT-018<br>AC2: TC-NT-019<br>AC3: TC-NT-020 | BR-006, BR-101, BR-106, BR-110 | `calculateQuote`, `createHoldFromQuote`, `createReservation`, `createRoom`, `getQuote`, `getRack`, `getReservation`, `listRooms`, `updateRoom` | **TRỐNG** |
| US-005 | Bảng tham số quy tắc (BR mục 13) | AC1: TC-NT-011, TC-NT-012<br>AC2: TC-NT-013, TC-NT-014<br>AC3: TC-NT-015 | BR-006, BR-302 | `createHoldFromQuote`, `getParameterHistory`, `getReservation`, `listParameters`, `setParameter` | **TRỐNG** |
| US-006 | Nhật ký thao tác tiền (BR-008) | AC1: TC-NT-016<br>AC2: TC-NT-017 | BR-008 | `addFolioLine`, `adjustFolioLine`, `getReservationHistory`, `listAuditEvents` | **TRỐNG** |
| US-007 | Phê duyệt FOC/giảm giá (UC-27, SM-10) | AC1: TC-NT-027<br>AC2: TC-NT-028<br>AC3: TC-NT-029<br>AC4: TC-NT-030<br>AC5: TC-NT-031<br>bổ sung: TC-NT-032 | BR-432, BR-433, BR-434 | `approveRequest`, `checkOut`, `getFolio`, `listApprovalRequests`, `requestFoc` | L8 |
| US-135 | Xác nhận hành động không đảo ngược (HR-06) – *mới* | AC1: TC-NT-024<br>AC2: TC-NT-025<br>AC3: TC-NT-026, TC-X-040 | – | `cancelReservation`, `checkOut`, `getCheckoutSummary`, `getReservation`, `markNoShow`, `purgeRegistrationImages`, `transitionWorkOrder` | L9, L2 §2.3 (QA), L4 §4.4 (QA) |
| US-010 | KPI đêm nay | AC1: TC-L8-001<br>AC2: TC-L8-002 | BR-804, BR-904 | `getTonightKpi` | L8 |
| US-011 | Khách đến/đi hôm nay (BR-404) | AC1: TC-L8-003<br>AC2: TC-L8-004<br>bổ sung: TC-L8-010 | – | `getArrivalsDepartures` | L2 §2.1 tab Khách đến/đi (QA), L8 (QA) |
| US-012 | Cần chú ý (BR-907) | AC1: TC-L8-005<br>AC2: TC-L8-006<br>AC3: TC-L8-007<br>AC4: TC-L8-008<br>AC5: TC-L8-009<br>AC6: TC-RB-005 | BR-207, BR-211, BR-303, BR-435, BR-602, BR-603, BR-605, BR-809 | `getTonightKpi`, `listAttentionItems` | L8 |
| US-016 | Room rack | AC1: TC-L2-001<br>AC2: TC-L2-002, TC-X-040<br>AC3: TC-L2-003<br>AC4: TC-RB-014<br>bổ sung: TC-L2-004, TC-L2-005 | – | `getRack`, `getReservation`, `listAttentionItems`, `searchAvailability` | L2 |
| US-017 | Tạo đơn ngắn ngày đã đảm bảo (UC-04, B2) | AC1: TC-L2-010<br>AC2: TC-L2-011<br>AC3: TC-L2-012, TC-L2-013<br>AC4: TC-L2-014<br>AC5: TC-L2-015<br>AC6: TC-L2-016<br>bổ sung: TC-L2-017 | BR-101, BR-103, BR-104, BR-105, BR-108, BR-112, BR-307, BR-608, BR-905 | `calculateQuote`, `createReservation`, `getReservation`, `listRegistrations`, `recordPayment`, `searchAvailability` | L2 |
| US-018 | Chống đặt trùng (BR-002, BR-906) | AC1: TC-L2-020<br>AC2: TC-L2-021, TC-X-001<br>AC3: TC-L2-022<br>AC4: TC-L2-023, TC-X-002<br>bổ sung: TC-L2-018, TC-L2-024 | BR-002 | `changeRoom`, `confirmDeposit`, `createHoldFromQuote`, `createReservation`, `createRoomBlock`, `extendStay`, `getRack`, `listAttentionItems`, `listOverbookingIncidents`, `moveReservation`, `restoreNoShow`, `updateRoomBlock` | L2 |
| US-019 | Phòng khóa chặn bán (SM-02, BR-804) | AC1: TC-L2-030, TC-L6-044<br>AC2: TC-L2-031<br>bổ sung: TC-L2-032 | BR-904 | `calculateQuote`, `createHoldFromQuote`, `createReservation`, `createRoomBlock`, `getRack`, `getTonightKpi`, `listRoomBlocks`, `listRoomStatuses`, `searchAvailability` | L2, L6 (QA) |
| US-020 | Chi tiết đơn | AC1: TC-L2-040<br>AC2: TC-L2-041<br>AC3: TC-RB-012<br>AC4: TC-L2-042<br>bổ sung: TC-L2-043 | – | `cancelReservation`, `checkIn`, `checkOut`, `confirmDeposit`, `getFolio`, `getReservation`, `listReservations`, `updateReservation` | L2 |
| US-021 | Hủy đơn / hủy giữ chỗ (UC-05, B5, B10) | AC1: TC-L2-050<br>AC2: TC-L2-051<br>AC3: TC-L2-052, TC-X-010<br>AC4: TC-L2-053, TC-L2-054<br>AC5: TC-L2-055<br>AC6: TC-L2-056<br>bổ sung: TC-L2-057 | BR-308, BR-309, BR-310, BR-522 | `cancelReservation`, `getRack`, `getReservationHistory`, `listApprovalRequests`, `listAttentionItems`, `markNoShow`, `moveReservation` | L2 |
| US-022 | Người đi cùng | AC1: TC-L2-060<br>AC2: TC-L2-061<br>AC3: TC-L2-062<br>bổ sung: TC-L2-063 | BR-110, BR-601 | `addPartyMember`, `getReservation`, `listParty` | L3 §3.1 (người thứ 2) (QA) |
| US-023 | Mã duy nhất (BR-007) | AC1: TC-NT-021, TC-NT-022<br>AC2: TC-NT-023 | BR-007, BR-953 | `cancelReservation`, `checkOut`, `createGuestRequest`, `createReservation`, `createWorkOrder`, `saveQuote` | L2 |
| US-024 | Đổi căn / đổi ngày / đổi phòng (UC-16, B7, B14, BR-424) | AC1: TC-L2-065<br>AC2: TC-L2-066<br>AC3: TC-L2-067<br>AC4: TC-L2-068 | BR-006, BR-403, BR-424, BR-906 | `changeRoom`, `getDoorCredential`, `listHkTasks`, `moveReservation` | L9 |
| US-136 | Đánh dấu no-show (UC-05, B11, B12, BR-311) – *mới* | AC1: TC-L2-070<br>AC2: TC-L2-071, TC-L2-072<br>AC3: TC-L2-073<br>AC4: TC-L2-074 | BR-311, BR-904 | `getFolio`, `getReservation`, `listApprovalRequests`, `listAttentionItems`, `markNoShow`, `restoreNoShow` | L2, L9 |
| US-025 | Nhận phòng (UC-11, B9, BR-402) | AC1: TC-L3-001<br>AC2: TC-L3-002<br>AC3: TC-L3-003, TC-L3-062<br>AC4: TC-L3-004<br>AC5: TC-L3-005<br>bổ sung: TC-L3-006 | BR-401, BR-402, BR-411, BR-602, BR-603 | `checkIn`, `getRegistration`, `listApprovalRequests`, `listAttentionItems`, `listHkTasks`, `previewCheckIn`, `setDoorCredential`, `undoCheckIn` | L3 |
| US-026 | Phụ thu nhận sớm (BR-411, BR-414; HR-04) | AC1: TC-L3-010<br>AC2: TC-L3-011, TC-L3-012<br>AC3: TC-L3-013<br>AC4: TC-L3-014 | BR-003, BR-401, BR-411 | `checkIn`, `moveReservation`, `previewCheckIn`, `requestFoc` | L3 |
| US-027 | Phụ thu cho đơn dài hạn (BR-102, BR-213, BR-413) | AC1: TC-L3-015<br>AC2: TC-L3-016 | BR-102, BR-412, BR-413 | `checkIn`, `previewCheckIn`, `setLateCheckout`, `setParameter` | **TRỐNG** |
| US-028 | Gia hạn (UC-13, B13, BR-421–423) | AC1: TC-L4-001<br>AC2: TC-L4-002<br>AC3: TC-L4-003<br>AC4: TC-L4-004<br>AC5: TC-L4-005 | BR-104, BR-108, BR-421, BR-422, BR-423, BR-604, BR-802, BR-901 | `createReservation`, `extendStay`, `getExtensionOptions`, `getFolio`, `getRegistration`, `getReservation`, `listHkTasks` | L9 |
| US-029 | Trả muộn (B15, BR-412, BR-414, BR-416) | AC1: TC-L4-010, TC-L4-011<br>AC2: TC-L4-012<br>AC3: TC-L4-013<br>AC4: TC-L4-014 | BR-403, BR-412, BR-414, BR-416 | `getDoorCredential`, `getExtensionOptions`, `listCheckoutReminders`, `listHkTasks`, `requestFoc`, `setLateCheckout`, `setParameter` | L9, L4 §4.2 (trả muộn) (QA) |
| US-030 | Xác nhận giờ trả (UC-14) | AC1: TC-L4-020<br>AC2: TC-L4-021 | – | `getArrivalsDepartures`, `listCheckoutReminders`, `recordCheckoutConfirmation` | L2 §2.1 (Xác nhận giờ trả) (QA) |
| US-031 | Thẻ khách trả phòng hôm nay chưa trả (BR-425) | AC1: TC-L4-022<br>AC2: TC-L4-023<br>bổ sung: TC-L4-024 | BR-001, BR-425 | `getArrivalsDepartures`, `listCheckoutReminders` | L2 §2.1, §2.4 (QA) |
| US-032 | Dòng phát sinh / phí phạt (UC-17, BR-511, BR-512) | AC1: TC-L4-030<br>AC2: TC-L4-031<br>AC3: TC-L4-032<br>AC4: TC-L4-033<br>bổ sung: TC-L4-034 | BR-511, BR-512, BR-904 | `addFolioLine`, `adjustFolioLine`, `getChargeCatalog`, `getFolio`, `getGuestFolio`, `listApprovalRequests` | L4 §4.2 (phí phạt) (QA) |
| US-035 | Trả phòng bước 1: minibar (BR-701, BR-702) | AC1: TC-L4-040<br>AC2: TC-L4-041<br>AC3: TC-L4-042<br>bổ sung: TC-L4-043 | BR-701, BR-702 | `getCheckoutSummary`, `recordMinibarCheck` | L4 |
| US-036 | Trả phòng bước 2: phụ phí | AC1: TC-L4-044<br>AC2: TC-L4-045<br>AC3: TC-L4-046, TC-L4-047 | BR-307, BR-401, BR-412, BR-414 | `checkOut`, `getCheckoutSummary` | L4 |
| US-037 | Trả phòng bước 3: bill | AC1: TC-L4-050<br>AC2: TC-L4-051<br>AC3: TC-L4-052 | BR-004, BR-009, BR-412 | `getBill`, `getCheckoutSummary`, `getFolio` | L4 |
| US-038 | Hoàn tất trả phòng (UC-18, B18, SM-13) | AC1: TC-L4-053<br>AC2: TC-L4-054<br>AC3: TC-L4-055<br>AC4: TC-L4-056<br>bổ sung: TC-L4-057 | BR-007, BR-525, BR-604 | `addFolioLine`, `adjustFolioLine`, `checkOut`, `getCheckoutSummary` | L4 |
| US-039 | Thông tin hóa đơn GTGT công ty | AC1: TC-L4-058<br>AC2: TC-L4-059 | BR-524 | `getBill`, `getGuest`, `setInvoiceRequest` | L4 |
| US-042 | Danh sách cần khai báo (UC-12, BR-602, BR-603, BR-611) | AC1: TC-L3-044, TC-L3-045, TC-L3-046<br>AC2: TC-L3-048<br>AC3: TC-L3-049<br>bổ sung: TC-L3-047 | BR-602, BR-603, BR-611 | `checkIn`, `getRegistration`, `listAttentionItems`, `listRegistrations`, `setParameter` | L3 |
| US-043 | Nhập giấy tờ (K3–K5, BR-601, BR-606, BR-612) | AC1: TC-L3-030<br>AC2: TC-L3-031<br>AC3: TC-L3-032<br>AC4: TC-L3-033 | BR-601, BR-612, BR-951 | `addGuestDocument`, `getGuestDocumentSensitive`, `getRegistration`, `listC3AccessLog`, `listParty`, `updateGuestDocument` | L3 |
| US-044 | Đối chiếu tự động (K5, BR-605; HR-07) | AC1: TC-L3-034<br>AC2: TC-L3-035<br>AC3: TC-L3-036<br>AC4: TC-L3-037 | BR-605, BR-952 | `addGuestDocument`, `checkIn`, `completeRegistrationReview`, `getRegistration`, `listAttentionItems` | L3 |
| US-045 | Ghi nhận đồng ý lưu ảnh giấy tờ (K5, BR-609) | AC1: TC-L3-038<br>AC2: TC-L3-039<br>AC3: TC-L3-040 | BR-609 | `completeRegistrationReview`, `getDocumentImage`, `getRegistration`, `recordGuestConsent`, `recordImageConsent`, `transitionRegistration` | L3 |
| US-046 | Khai báo bán tự động (K6–K8, BR-606) | AC1: TC-L3-041<br>AC2: TC-L3-042<br>AC3: TC-L3-043 | BR-606 | `getPortalData`, `getRegistration`, `listC3AccessLog`, `listRegistrations`, `transitionRegistration` | L3 |
| US-047 | Mọi đơn có bản ghi khai báo (K1, BR-608) | AC1: TC-L2-010, TC-L3-050<br>AC2: TC-L3-051<br>AC3: TC-L3-052 | BR-422, BR-608 | `confirmDeposit`, `createHoldFromQuote`, `createReservation`, `extendStay`, `getRegistration`, `getReservation`, `listRegistrations`, `updateReservation` | L3 |
| US-048 | Quyền xem ảnh giấy tờ (A71, D03–D06, BR-610) | AC1: TC-RB-006<br>AC2: TC-RB-002, TC-RB-007<br>AC3: TC-RB-008<br>AC4: TC-RB-009<br>bổ sung: TC-RB-020, TC-RB-022 | BR-610 | `getDocumentImage`, `getGuest`, `getGuestDocumentSensitive`, `getPortalData`, `getRack`, `getRegistration`, `getReservation`, `listC3AccessLog`, `listRegistrations`, `listReservations`, `streamEvents` | L3 §3.1 (nút Xem giấy tờ) (QA) |
| US-049 | Tự xóa ảnh giấy tờ (UC-29, BR-609, BR-610) | AC1: TC-L3-070<br>AC2: TC-L3-071<br>AC3: TC-L3-072 | BR-609, BR-610 | `getDocumentImage`, `purgeRegistrationImages`, `transitionRegistration` | **TRỐNG** |
| US-050 | Ngày đi thực tế & hạn tạm trú (K9–K10, BR-604, BR-605) | AC1: TC-L3-053<br>AC2: TC-L3-054 | BR-605 | `checkOut`, `earlyDeparture`, `extendStay`, `getRegistration`, `listAttentionItems`, `listRegistrations`, `transitionRegistration` | **TRỐNG** |
| US-052 | Xem trạng thái buồng (S10) | AC1: TC-L6-001<br>AC2: TC-L6-002<br>AC3: TC-RB-015<br>bổ sung: TC-L6-003 | BR-801 | `listRoomStatuses` | L6 |
| US-053 | Đổi trạng thái buồng hợp lệ (SM-03, BR-802) | AC1: TC-L6-010<br>AC2: TC-L6-011<br>AC3: TC-L6-012<br>AC4: TC-L6-013<br>bổ sung: TC-L6-014, TC-L6-029 | – | `listHkTasks`, `listRoomStatuses`, `recordInspection`, `transitionRoomStatus` | L6 |
| US-054 | Việc hôm nay tự sinh (SM-14, BR-807) | AC1: TC-L6-020<br>AC2: TC-L6-021<br>AC3: TC-L6-022<br>AC4: TC-L6-023<br>bổ sung: TC-L6-024, TC-X-020 | BR-807, BR-811 | `checkOut`, `createGuestRequest`, `listHkTasks`, `listRoomStatuses`, `streamEvents`, `transitionHkTask` | L6 |
| US-055 | Checklist kiểm phòng (R4, BR-808) | AC1: TC-L6-025<br>AC2: TC-L6-026 | BR-808 | `getInspectionChecklist`, `recordInspection` | L6 |
| US-056 | Lịch dọn khách dài hạn (BR-807) | AC1: TC-L6-027<br>AC2: TC-L6-028 | BR-807 | `listHkTasks`, `listRoomStatuses` | L6 |
| US-057 | Báo sự cố từ điện thoại (W1, BR-809) | AC1: TC-L6-030<br>AC2: TC-L6-031<br>bổ sung: TC-L6-032 | BR-809 | `createRoomBlock`, `createWorkOrder`, `listAttentionItems`, `listWorkOrders`, `uploadAttachment` | L6 |
| US-061 | Tạo phiếu sửa và khóa phòng (UC-24, W1, O1, BR-804) | AC1: TC-L6-040, TC-X-010<br>AC2: TC-L6-041<br>AC3: TC-L6-042<br>AC4: TC-L6-043 | – | `createRoomBlock`, `createWorkOrder`, `getRack`, `listAttentionItems`, `moveReservation`, `searchAvailability` | L6 |
| US-062 | Cập nhật phiếu sửa (SM-04, O4) | AC1: TC-L6-045, TC-X-010<br>AC2: TC-L6-046<br>AC3: TC-L6-047<br>bổ sung: TC-L6-048 | BR-809 | `listAttentionItems`, `listHkTasks`, `listRoomBlocks`, `listWorkOrders`, `transitionWorkOrder` | L6 |
| US-066 | Danh mục mặt hàng minibar (BR-701, A91) | AC1: TC-L4-070<br>AC2: TC-L4-071<br>AC3: TC-RB-017 | BR-006, BR-701 | `createItem`, `getFolio`, `listItems`, `recordMinibarCheck`, `updateItem` | **TRỐNG** |
| US-071 | Tạo/sửa hồ sơ khách | AC1: TC-L5-040<br>AC2: TC-L5-041<br>AC3: TC-L5-042 | BR-951 | `createGuest`, `getGuest`, `updateGuest` | **TRỐNG** |
| US-072 | Chặn hồ sơ trùng (BR-951, BR-952) | AC1: TC-L5-043<br>AC2: TC-L5-044 | BR-951, BR-952 | `createGuest`, `lookupGuestByContact` | **TRỐNG** |
| US-073 | Bộ chọn khách dùng chung | AC1: TC-L5-045<br>AC2: TC-L5-046<br>AC3: TC-L5-047<br>bổ sung: TC-L5-048 | – | `createGuest`, `createLead`, `getQuote`, `lookupGuestByContact`, `saveQuote`, `searchGuests` | L2 |
| US-080 | Báo giá ngắn ngày (UC-01) | AC1: TC-L5-001, TC-L5-002<br>AC2: TC-L5-003<br>AC3: TC-L5-004<br>AC4: TC-L5-005 | BR-107, BR-108, BR-110, BR-111, BR-112, BR-305, BR-903 | `calculateQuote`, `searchAvailability` | L5 |
| US-081 | Báo giá dài hạn (UC-06) | AC1: TC-L5-010, TC-L5-011<br>AC2: TC-L5-012<br>AC3: TC-L5-013<br>AC4: TC-L5-014 | BR-004, BR-202, BR-203, BR-204, BR-206, BR-208, BR-209, BR-212 | `calculateQuote`, `saveQuote` | L5 |
| US-082 | Kiểm phòng trống khi báo giá | AC1: TC-L5-019<br>AC2: TC-L5-020 | – | `calculateQuote`, `createHoldFromQuote`, `searchAvailability` | L5 |
| US-083 | Lưu và gửi báo giá (SM-08 Q1–Q4, BR-304) | AC1: TC-L5-015, TC-L5-018<br>AC2: TC-L5-016<br>AC3: TC-L5-017 | BR-006, BR-007, BR-304 | `createHoldFromQuote`, `getQuote`, `getQuoteText`, `listApprovalRequests`, `listQuotes`, `saveQuote` | L5 |
| US-084 | Tạo đơn giữ chỗ (UC-02, B1, BR-302) | AC1: TC-L5-021, TC-L5-022, TC-X-010<br>AC2: TC-L5-023<br>AC3: TC-L5-024<br>AC4: TC-L5-025<br>bổ sung: TC-L5-048 | BR-206, BR-302, BR-305, BR-306 | `createHoldFromQuote`, `createLead`, `createVietQr`, `getQuote`, `getRack`, `listAttentionItems`, `saveQuote` | L5 |
| US-085 | Hết hạn giữ chỗ (B3, B6, BR-303) | AC1: TC-L5-026, TC-L5-027, TC-X-010<br>AC2: TC-L5-028<br>AC3: TC-L5-029<br>AC4: TC-L5-030, TC-X-004 | BR-302, BR-303 | `confirmDeposit`, `extendHold`, `getRack`, `getReservation`, `listAttentionItems`, `recordPayment` | L5, L2 §2.3 (QA) |
| US-086 | Xác nhận cọc & sinh hợp đồng (UC-03, UC-07, B4, H1) | AC1: TC-L5-031<br>AC2: TC-L5-032<br>AC3: TC-L5-033<br>AC4: TC-L5-034<br>AC5: TC-L5-035<br>bổ sung: TC-X-003 | BR-008, BR-206, BR-207, BR-208, BR-209, BR-305 | `confirmDeposit`, `createDepositNotice`, `getLeaseContract`, `listAuditEvents`, `recordPayment`, `uploadAttachment` | L5 |
| US-087 | CTV chỉ thấy phần của mình (rbac phạm vi M) | AC1: TC-RB-010<br>AC2: TC-RB-011<br>AC3: TC-RB-001 | – | `getGuest`, `getQuote`, `getReservation`, `listLeads`, `listParty`, `listQuotes`, `listReservations`, `searchGuests` | L5 |
| US-106 | Mở app khách bằng link/QR (ADR-006, A22) | AC1: TC-L7-001<br>AC2: TC-L7-002<br>AC3: TC-L7-003<br>bổ sung: TC-L7-004 | – | `getGuestFolio`, `getGuestStay`, `issueGuestLink`, `openGuestSession`, `revokeGuestLink`, `verifyGuestSession` | L7 |
| US-107 | Check-in online (UC-10, K2) | AC1: TC-L7-010<br>AC2: TC-L7-011<br>AC3: TC-L7-012<br>AC4: TC-L7-013<br>AC5: TC-L7-014<br>bổ sung: TC-L7-015 | BR-609 | `completeOnlineCheckin`, `getOnlineCheckin`, `openGuestSession`, `recordGuestConsent`, `updateOnlineCheckin`, `uploadGuestDocument` | L7 |
| US-108 | Thông tin lưu trú | AC1: TC-L7-020<br>AC2: TC-L7-021 | BR-401, BR-403, BR-511 | `getGuestStay` | L7 |
| US-109 | Khách gửi yêu cầu (UC-15, SM-15) | AC1: TC-L7-030<br>AC2: TC-L7-031 | – | `createGuestRequest`, `listMyRequests`, `transitionGuestRequest` | L7 |
| US-110 | Định tuyến yêu cầu (BR-811, BR-809) | AC1: TC-L7-032<br>AC2: TC-L7-033, TC-L7-034, TC-L7-035<br>AC3: TC-RB-016 | BR-809, BR-811 | `createGuestRequest`, `listAttentionItems`, `listGuestRequests`, `listHkTasks`, `listMyRequests`, `listWorkOrders`, `transitionGuestRequest` | L7 |
| US-111 | Khách xem folio | AC1: TC-L7-040<br>AC2: TC-L7-041 | – | `getFolio`, `getGuestFolio` | L7 |
| US-112 | App khách tiếng Anh (HR-01) | AC1: TC-L7-050<br>AC2: TC-L7-051<br>AC3: TC-L7-052 | – | `getGuestStay`, `setGuestLocale` | L7 |
| US-119 | Ghi nhận thu tiền (SM-12, BR-521) | AC1: TC-L4-060<br>AC2: TC-L4-061<br>AC3: TC-L4-062<br>AC4: TC-L4-063<br>bổ sung: TC-L4-066, TC-RB-021 | BR-008, BR-307 | `addFolioLine`, `confirmDeposit`, `createGuestRequest`, `getFolio`, `recordPayment`, `reversePayment`, `updateReservation` | L4 |
| US-120 | VietQR (I2) | AC1: TC-L4-064<br>AC2: TC-L4-065 | BR-521 | `createVietQr` | L4 |
| US-125 | Mẫu tin nhắn đa ngôn ngữ | AC1: TC-L7-060<br>AC2: TC-L7-061<br>AC3: TC-L7-062 | – | `listMessageTemplates`, `renderMessage` | **TRỐNG** |
| US-128 | Mã cửa trong đơn (BR-403, A21, D22) | AC1: TC-L3-060<br>AC2: TC-RB-013<br>AC3: TC-L3-061<br>bổ sung: TC-L3-062 | BR-403 | `changeRoom`, `checkOut`, `getDoorCredential`, `getGuestStay`, `getReservation`, `listC3AccessLog`, `setDoorCredential` | L3, L7 (QA) |

## 3. Story ngoài Must R2 có test case ca chính trong R1 (Must R3, Should R2)

| Story | AC → TC | Endpoint | Wireframe |
|---|---|---|---|
| US-041 | (chưa có AC) TC-L4-080, TC-L4-081 | **TRỐNG** (R3) | L4 |
| US-064 | (chưa có AC) TC-L6-050 | **TRỐNG** (R3) | **TRỐNG** |
| US-137 | (chưa có AC) TC-L4-025 | `earlyDeparture`, `listApprovalRequests` | **TRỐNG** |
| US-139 | AC1: TC-L2-024<br>AC2: TC-L2-025 | `checkIn`, `createReservation`, `getRack`, `listAttentionItems`, `listOverbookingIncidents`, `moveReservation`, `previewCheckIn` | L2, L9, L8 (Cần chú ý) (QA) |

## 4. Lỗi baseline BL 8.2 → test case chống tái phát

| BL 8.2 | Nội dung (rút gọn) | Phân loại DOM | Test case |
|---|---|---|---|
| #1 | Phụ thu sớm/muộn của đơn dài hạn tính trên tiền thuê tháng (30% × 11,13 tr ≈ 3,3 | Sửa | TC-L3-015 |
| #2 | Mở modal nhận phòng lúc 11:05 tự tính phụ thu 30% ngay | Sửa | TC-L3-010 |
| #3 | Kiểm tra hạn hộ chiếu luôn "Khớp" | Sửa | TC-L3-034 |
| #4 | Bảng `LATE` (miễn phí đến 13:00) khai báo nhưng không dùng; code tính phí từ 12: | Cần INV quyết | TC-L4-011 |
| #5 | Phiếu sửa chữa tick "Khóa phòng" chỉ đổi trạng thái buồng, không chặn bán | Sửa | TC-L2-030, TC-L6-040 |
| #6 | Trả phòng dài hạn: bill không có tiền thuê lẻ, điện nước kỳ cuối, khấu trừ/hoàn  | Sửa | TC-L4-080 |
| #7 | "Khách đến" hiện cả đơn hủy/giữ chỗ; "Khách đi" hiện đơn hủy | Sửa | TC-L8-003 |
| #8 | Đơn giữ chỗ tính là đêm đã bán trong công suất và biểu đồ | Sửa | TC-L8-001 |
| #9 | Đơn tạo từ báo giá không sinh bản ghi khai báo lưu trú | Sửa | TC-L3-050 |
| #10 | [LỆCH] Số liệu HĐ mẫu: kỳ thu Daniel 36,03 tr ≠ công thức 37,84 tr; hoa hồng Emm | Bỏ | TC-L5-033 |
| #11 | [LỆCH] Phí OTA trong P&L 15,5 tr ≠ bảng kênh 15,79 tr | Sửa | **chưa có** – xem test case mục 11 |
| #12 | Thông báo gia hạn OTA ghi "15%" cho Airbnb trong khi bảng kênh 15,5% | Sửa | TC-L4-003 |
| #13 | Hai quy ước quy đổi giá (÷12 cho giá đêm, ÷30 cho dài hạn); giá gia hạn dùng giá | Cần INV quyết | TC-L4-003 |
| #14 | Độ đầy đủ hồ sơ: "Đồng ý nhận ưu đãi" luôn đạt | Sửa | **chưa có** – xem test case mục 11 |
| #15 | Khóa tên = sắp xếp chữ cái → báo trùng sai (đảo chữ), bỏ sót tên viết thiếu | Sửa | TC-L5-044 |
| #16 | Gộp hồ sơ không cập nhật người đi cùng, khai báo, lead, công tơ, CRM; không có n | Sửa | TC-NT-023 |
| #17 | Lead nối với khách bằng tên | Sửa | TC-L5-048 |
| #18 | Sinh mã không an toàn (WO, khách, hóa đơn có thể trùng) | Sửa | TC-NT-022 |
| #19 | Hết hạn giữ chỗ và hiệu lực báo giá 3 ngày không được thực thi | Sửa | TC-L5-026 |
| #20 | Sửa giá OTA: rỗng/0 bị bỏ qua lặng lẽ; không có giá sàn/trần | Sửa | TC-L2-013 |
| #21 | Công tơ: chỉ số mới < cũ ép về 0; không lưu kỳ | Sửa | TC-L6-050 |
| #22 | Doanh thu dài hạn tính theo số tháng làm tròn; CRM dùng số cứng `LEGACY` | Sửa | **chưa có** – xem test case mục 11 |
| #23 | Hủy giữ chỗ không lý do, không phí; không có chính sách hủy đơn đã cọc | Cần INV quyết | TC-L2-052, TC-NT-024 |
| #24 | FOC tự duyệt: người thao tác tự chọn tên người duyệt | Sửa | TC-NT-027 |
| #25 | Không tách VAT dù ghi "đã gồm VAT" | Cần INV quyết | **chưa có** – xem test case mục 11 |
| #26 | Đặt phòng mới chỉ ngắn ngày, ngày đến tối đa 31/12/2026, tối đa 60 đêm, không ch | Sửa | TC-L2-014 |
| #27 | Rò rỉ quyền: Sale thấy số giấy tờ và P&L; Buồng phòng thấy giá vốn; mọi vai bấm  | Sửa | TC-RB-001 |
| #28 | Số cứng trên Tổng quan (ADR, % tăng, "Cần chú ý", cảnh báo thị thực…) | Sửa | TC-L8-002 |
| #29 | Đêm khả dụng không trừ phòng OOO | Sửa | TC-L8-001 |
| #30 | Kiểm trùng lịch chỉ ở giao diện, không có giao dịch → đặt trùng khi nhiều người  | Sửa | TC-L2-020 |

## 5. Ô trống và điểm cần xử lý

### 5.1 Story Must R2 chưa có endpoint OpenAPI
- Không có.

### 5.2 Story Must R2 có endpoint trong TC nhưng OpenAPI chưa ghi `x-stories` (đề nghị ARC bổ sung để truy vết hai chiều)
- Không có.

### 5.3 Test case cần chức năng/endpoint chưa có trong OpenAPI R2 (cột Endpoint ghi "—"; TC chỉ kiểm giao diện/thủ công ghi "–" và không nằm trong danh sách này)
- TC-NT-023 (US-023/AC2)
- TC-RB-004 (US-003/AC3)
- TC-RB-011 (US-087/AC2)
- TC-L4-080 (US-041/–)
- TC-L4-081 (US-041/–)
- TC-L6-050 (US-064/–)

### 5.4 Story Must R2 chưa có wireframe
- US-004 (Danh mục căn), US-005 (Bảng tham số quy tắc (BR mục 13)), US-006 (Nhật ký thao tác tiền (BR-008)), US-027 (Phụ thu cho đơn dài hạn (BR-102, BR-213, BR-413)), US-049 (Tự xóa ảnh giấy tờ (UC-29, BR-609, BR-610)), US-050 (Ngày đi thực tế & hạn tạm trú (K9–K10, BR-604, BR-605)), US-066 (Danh mục mặt hàng minibar (BR-701, A91)), US-071 (Tạo/sửa hồ sơ khách), US-072 (Chặn hồ sơ trùng (BR-951, BR-952)), US-125 (Mẫu tin nhắn đa ngôn ngữ)

### 5.5 BR trong danh mục chưa được story hay test case nào tham chiếu
Đa số thuộc phân hệ Round 3 hoặc ngoài MVP (điện nước, VAT, kho, P&L, chấm dứt HĐ, đồ thất lạc, độ đầy đủ hồ sơ). Plan R1 mục 6 yêu cầu mỗi BR có ≥ 1 story/TC tham chiếu → đề nghị PO gắn các BR này vào story R3 tương ứng (US-064/065, US-122, US-093, US-118, US-078…), QA viết TC khi story có AC.
- BR-215, BR-313, BR-314, BR-501, BR-504, BR-505, BR-506, BR-513, BR-523, BR-705, BR-706, BR-902, BR-955

### 5.6 BR được story tham chiếu nhưng chưa có test case R1 (thường là phân hệ R3)
- BR-427, BR-810

## 6. Danh mục operationId OpenAPI chưa được test case nào dùng (để R2 bổ sung ca)
- `cancelRequest`, `channelWebhook`, `createHkTask`, `createRoom`, `createUser`, `getWorkOrder`, `listChannels`, `listRoomGroups`, `listRooms`, `paymentCallback`, `rejectRequest`, `removePartyMember`, `resolveOverbookingExternal`, `transitionRoomBlock`, `updateUser`, `updateWorkOrder`, `withdrawQuote`
