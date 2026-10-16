# Ma trận truy vết – Story ↔ AC ↔ BR ↔ Test case ↔ Endpoint ↔ Wireframe

- Tác giả: QA | Round 2 – Đợt 0 | Ngày: 16/10/2026 | Phiên bản: 0.4 (backlog R-C – ESC-012: 72 Must R2; AC `[Dời R3 – R-C]` tách khỏi nghiệm thu R2; AC5a)
- **File này do script sinh** – không sửa tay: `python3 product/tests/tools/gen_traceability.py` (chạy từ thư mục gốc repo). Nguồn: `03-backlog/backlog.md` (story, AC), `product/tests/test-cases/r1-main-flows.md` (TC), `product/docs/api/openapi.yaml` (`operationId`, `x-stories`), `product/docs/business-rules.md`, `product/docs/baseline-issues-triage.md`, `product/design/wireframes/NN-*.html` 01–10 (dòng `wf-meta` đầu trang liệt kê US), `product/docs/erd.md` mục 4, `product/docs/state-machines.md`, `product/docs/rbac-matrix.json`/`.md`.
- Đọc cùng `product/docs/qa/test-strategy.md`. Cột **Endpoint** = hợp của `x-stories` trong OpenAPI và endpoint QA dùng trong TC. Cột **Wireframe** = trang có ghi US ở đầu trang (`L2`…); mục có hậu tố "(QA)" = QA tự đối chiếu màn hình khi đầu trang không ghi US. Cột **ERD** = mục từ điển bảng `erd.md` 4.x: mục nêu US trực tiếp, hợp với mục suy từ `tags` của operation (bảng ánh xạ `TAG_ERD` của QA) – kiểm có bảng, chưa kiểm từng cột.

## 1. Kết quả đếm (script)

| Chỉ số | Kết quả |
|---|---|
| Story Must R2 trong backlog (mục 3) | **72** |
| Story Must R2 có ≥ 1 TC | **72/72** (100%) |
| AC của story Must R2 (backlog mục 4) | **250** |
| AC có ≥ 1 TC | **250/250** (100.0%) |
| AC có ≥ 1 TC **chạy được ở R2 với kỳ vọng xác định** (TC không mang nhãn `[BLOCKED]`/`[UNDECIDED]`) | **250/250** (100.0%) |
| TC mang nhãn `[BLOCKED]`/`[UNDECIDED]` · `[GIẢ ĐỊNH QA]` | 6 · 5 (danh sách mục 5.7) |
| Chuyển trạng thái (17 máy, `state-machines.md`) có ≥ 1 TC | **102/122** (83.6%) – chi tiết mục 7 |
| Tham chiếu chuyển trạng thái trong TC không có trong `state-machines.md` | 0 |
| Kiểm tĩnh quyền (nguồn chuẩn: rbac-matrix.json (A-xx) + rbac-matrix.md (S-xx, Dxx)): operation lệch `x-roles`/`x-scope` · thuộc tính lệch `x-visible-to` | 0 · 0 – chi tiết mục 8 |
| Story Must R2 không có AC ở mục 4 | 0  |
| Tổng số TC | **393** (Cao 240 · TB 147 · Thấp 6) · **Smoke (S)** 42 |
| TC theo nhóm | L2 60 · L3 48 · L4 54 · L5 45 · L6 37 · L7 27 · L8 12 · NT 42 · RB 27 · SEC 25 · X 16 |
| TC theo tầng (một TC có thể nhiều tầng) | U 43 · A 361 · E 139 · P 5 · M 7 |
| TC cho story ngoài Must R2 (ca chính) | US-041 (2), US-064 (1), US-081 (5), US-111 (2), US-125 (5), US-128 (5), US-137 (1), US-141 (5) |
| `operationId` dùng trong TC nhưng không có trong OpenAPI | 0 |
| Tham chiếu AC sai (AC không tồn tại) · TC trỏ AC `[Dời R3 – R-C]` mà thiếu nhãn | 0 · 0 |
| AC `[Dời R3 – R-C]` (không thuộc nghiệm thu R2) · TC mang nhãn `[Dời R3]` | 3 (US-012/AC2, US-086/AC3, US-119/AC5) · 3 (TC-L5-033, TC-L5-039, TC-L8-006) |
| Mã TC trùng | 0 |
| Story Must R2 **không có endpoint** (OpenAPI lẫn TC) | 0 |
| Story Must R2 có endpoint trong TC nhưng OpenAPI chưa gắn `x-stories` | 0 |
| Story Must R2 **không có wireframe** | 0 |
| Story Must R2 **không có bảng ERD** (US nêu trong erd.md mục 4, hoặc tag OpenAPI → mục ERD) | 0  |
| Story Must R2 đủ 4 chiều TC + endpoint + wireframe + ERD (QC C1) | **72/72** |
| BR trong danh mục / BR không được story hay TC nào tham chiếu | 151 / 0 |

**Không còn AC nào của story Must R2 thiếu test case.**

## 2. Ma trận story Must R2

| Story | Tên (backlog mục 4) | AC → TC | BR trong AC | Endpoint (operationId) | Wireframe | ERD (erd.md mục) | ESC liên quan |
|---|---|---|---|---|---|---|---|
| US-001 | Đăng nhập (UC-28) | AC1: TC-NT-001, TC-SEC-020<br>AC2: TC-NT-002, TC-NT-003, TC-SEC-021<br>AC3: TC-NT-004, TC-X-030<br>AC4: TC-NT-037<br>bổ sung: TC-NT-005, TC-SEC-025 | BR-001 | `changeMyPassword`, `createReservation`, `getMe`, `getRack`, `getReservation`, `getReservationHistory`, `listAuditEvents`, `listHkTasks`, `login`, `loginMfa`, `logout`, `updateReservation` | L1 | 4.2 | – |
| US-002 | Gán vai (UC-28, rbac A100) | AC1: TC-NT-006, TC-NT-007, TC-SEC-022<br>AC2: TC-NT-008, TC-RB-018, TC-RB-023, TC-SEC-023<br>AC3: TC-NT-009, TC-RB-024, TC-RB-025, TC-RB-026, TC-RB-027<br>AC4: TC-NT-010<br>bổ sung: TC-RB-019 | – | `createReservation`, `createRoomBlock`, `createUser`, `createWorkOrder`, `getDocumentImage`, `getDoorCredential`, `getFolio`, `getMe`, `getReservation`, `listAuditEvents`, `listHkTasks`, `listItems`, `listQuotes`, `listReservations`, `listRoomGroups`, `listRoomStatuses`, `listRooms`, `listUsers`, `listWorkOrders`, `login`, `setUserRoles`, `transitionHkTask`, `updateUser`, `webhookPost` | L1 | 4.2, 4.3 | – |
| US-003 | Ẩn dữ liệu nhạy cảm (rbac mục 6–7) | AC1: TC-RB-001, TC-RB-002<br>AC2: TC-RB-003<br>AC3: TC-RB-004<br>AC4: TC-RB-005 | – | `getDocumentImage`, `getGuest`, `getGuestDocumentSensitive`, `getPortalData`, `getRegistration`, `getReservation`, `getTonightKpi`, `listAttentionItems`, `listItems`, `listParty`, `listTrustedDevices`, `recordMinibarCheck`, `revokeTrustedDevice`, `searchGuests`, `trustCurrentDevice` | L1, L4 §4.1 (ghi chú giá vốn) (QA) | 4.2, 4.4, 4.6, 4.10 | – |
| US-004 | Danh mục căn | AC1: TC-NT-018<br>AC2: TC-NT-019<br>AC3: TC-NT-020, TC-NT-039, TC-NT-040 | BR-006, BR-101, BR-106, BR-110 | `calculateQuote`, `cancelReservation`, `createHoldFromQuote`, `createReservation`, `createRoom`, `getQuote`, `getRack`, `getReservation`, `listRooms`, `updateRoom` | L10 | 4.1 | ESC-004, ESC-014 |
| US-005 | Bảng tham số quy tắc (BR mục 13) | AC1: TC-NT-011, TC-NT-012<br>AC2: TC-NT-013, TC-NT-014<br>AC3: TC-NT-015<br>bổ sung: TC-NT-041, TC-NT-042, TC-SEC-028 | BR-006, BR-302 | `createHoldFromQuote`, `getParameterHistory`, `getReservation`, `listAuditEvents`, `listParameters`, `setParameter` | L10 | 4.1 | – |
| US-006 | Nhật ký thao tác tiền (BR-008) | AC1: TC-NT-016<br>AC2: TC-NT-017 | BR-008 | `addFolioLine`, `adjustFolioLine`, `getReservationHistory`, `listAuditEvents` | L10 | 4.3, 4.5, 4.6 | – |
| US-007 | Phê duyệt FOC/giảm giá (UC-27, SM-10) | AC1: TC-NT-027<br>AC2: TC-NT-028<br>AC3: TC-NT-029<br>AC4: TC-NT-030<br>AC5: TC-NT-031<br>AC6: TC-NT-032<br>bổ sung: TC-NT-033, TC-NT-034, TC-NT-035, TC-NT-036, TC-X-064 | BR-432, BR-433, BR-434, BR-435, BR-436 | `approveRequest`, `cancelRequest`, `checkOut`, `getFolio`, `listApprovalRequests`, `listAuditEvents`, `rejectRequest`, `requestFoc`, `setMyApprovalPin` | L8 | 4.2, 4.6 | ESC-007 |
| US-142 | Thiết bị được cấp cho dữ liệu C3 (decision-log SEC) – *mới, Must R2* | AC1: TC-SEC-011, TC-SEC-013<br>AC2: TC-RB-022, TC-SEC-010, TC-SEC-012<br>AC3: TC-SEC-015 | – | `addGuestDocument`, `checkIn`, `getDocumentImage`, `getDoorCredential`, `getGuestDocumentSensitive`, `getMe`, `getPortalData`, `listTrustedDevices`, `purgeRegistrationImages`, `revokeTrustedDevice`, `setDoorCredential`, `trustCurrentDevice`, `updateGuestDocument` | L3 §3.5 (máy chưa cấp quyền) (QA), L1 (cảnh báo thiết bị) (QA) | 4.2 | – |
| US-135 | Xác nhận hành động không đảo ngược (HR-06) – *mới* | AC1: TC-NT-024<br>AC2: TC-NT-025<br>AC3: TC-NT-026, TC-X-040 | – | `cancelReservation`, `cancelReservationGroup`, `checkOut`, `getCheckoutSummary`, `getReservation`, `markNoShow`, `purgeRegistrationImages`, `transitionWorkOrder` | L9, L2 §2.3 (QA), L4 §4.4 (QA) | 4.5 | – |
| US-010 | KPI đêm nay | AC1: TC-L8-001<br>AC2: TC-L8-002<br>AC3: TC-L8-011 | BR-010, BR-804, BR-904 | `getArrivalsDepartures`, `getTonightKpi` | L8 | 4.5 | – |
| US-011 | Khách đến/đi hôm nay (BR-404) | AC1: TC-L8-003<br>AC2: TC-L8-004<br>AC3: TC-L8-010 | BR-010 | `getArrivalsDepartures` | L2 §2.1 tab Khách đến/đi (QA), L8 (QA) | 4.5 | – |
| US-012 | Cần chú ý (BR-907) | AC1: TC-L8-005<br>AC3: TC-L8-007<br>AC4: TC-L8-008<br>AC5: TC-L8-009<br>AC6: TC-RB-005<br>AC7: TC-L8-012<br>AC2 (Dời R3): TC-L8-006 | BR-303, BR-435, BR-602, BR-603, BR-605, BR-809, BR-905, BR-907 | `getTonightKpi`, `listAttentionItems`, `listMyNotifications`, `resolveAttentionEvent` | L8 | 4.2, 4.5 | ESC-012 |
| US-016 | Room rack | AC1: TC-L2-001<br>AC2: TC-L2-002, TC-X-040<br>AC3: TC-L2-003<br>AC4: TC-RB-014<br>bổ sung: TC-L2-004, TC-L2-005 | – | `getRack`, `getReservation`, `listAttentionItems`, `searchAvailability` | L2 | 4.5 | – |
| US-017 | Tạo đơn ngắn ngày đã đảm bảo (UC-04, B2) | AC1: TC-L2-010<br>AC2: TC-L2-011<br>AC3: TC-L2-012, TC-L2-013<br>AC4: TC-L2-014<br>AC5: TC-L2-015<br>AC5a: TC-L2-076, TC-L2-077, TC-L2-078<br>AC6: TC-L2-016<br>AC7: TC-L2-019<br>AC8: TC-L2-006<br>bổ sung: TC-L2-017, TC-L2-079 | BR-101, BR-103, BR-104, BR-105, BR-108, BR-110, BR-112, BR-307, BR-608, BR-901, BR-905 | `calculateQuote`, `createReservation`, `getFolio`, `getRack`, `getReservation`, `listChannels`, `listRegistrations`, `listReservations`, `recordPayment`, `searchAvailability` | L2 | 4.5 | ESC-004, ESC-014 |
| US-018 | Chống đặt trùng (BR-002, BR-906) | AC1: TC-L2-020<br>AC2: TC-L2-021, TC-X-001<br>AC3: TC-L2-022<br>AC4: TC-L2-023, TC-X-002<br>AC5: TC-L2-024, TC-L2-027<br>bổ sung: TC-L2-018 | BR-002, BR-316 | `assignRoom`, `changeRoom`, `confirmDeposit`, `createHoldFromQuote`, `createReservation`, `createRoomBlock`, `extendStay`, `getRack`, `listAttentionItems`, `listOverbookingIncidents`, `moveReservation`, `restoreNoShow`, `updateRoomBlock` | L2 | 4.5 | – |
| US-019 | Phòng khóa chặn bán (SM-02, BR-804) | AC1: TC-L2-030, TC-L6-044<br>AC2: TC-L2-031<br>bổ sung: TC-L2-032, TC-L2-033, TC-L6-052 | BR-904 | `calculateQuote`, `createHoldFromQuote`, `createReservation`, `createRoomBlock`, `createWorkOrder`, `getRack`, `getTonightKpi`, `listRoomBlocks`, `listRoomStatuses`, `searchAvailability`, `transitionRoomBlock` | L2, L6 (QA) | 4.5, 4.9 | – |
| US-020 | Chi tiết đơn | AC1: TC-L2-040<br>AC2: TC-L2-041<br>AC3: TC-RB-012<br>AC4: TC-L2-042<br>bổ sung: TC-L2-043 | BR-315 | `cancelReservation`, `checkIn`, `checkOut`, `confirmDeposit`, `getFolio`, `getReservation`, `listReservations`, `updateReservation` | L2 | 4.5, 4.6 | – |
| US-021 | Hủy đơn / hủy giữ chỗ (UC-05, B5, B10) | AC1: TC-L2-050<br>AC2: TC-L2-051<br>AC3: TC-L2-052, TC-X-010<br>AC4: TC-L2-053, TC-L2-054<br>AC5: TC-L2-055<br>AC6: TC-L2-056<br>bổ sung: TC-L2-057 | BR-308, BR-309, BR-310, BR-522 | `cancelReservation`, `getRack`, `getReservationHistory`, `listApprovalRequests`, `listAttentionItems`, `markNoShow`, `moveReservation` | L2 | 4.5 | ESC-006 |
| US-022 | Người đi cùng | AC1: TC-L2-060<br>AC2: TC-L2-061<br>AC3: TC-L2-062<br>AC4: TC-L3-056<br>bổ sung: TC-L2-063, TC-L3-055 | BR-110, BR-414, BR-601 | `addPartyMember`, `getFolio`, `getRegistration`, `getReservation`, `listHkTasks`, `listParty`, `removePartyMember` | L3 §3.1 (người thứ 2) (QA) | 4.5 | ESC-001 |
| US-023 | Mã duy nhất (BR-007) | AC1: TC-NT-021, TC-NT-022<br>AC2: TC-NT-038 | BR-007 | `cancelReservation`, `checkOut`, `createGuest`, `createGuestRequest`, `createReservation`, `createWorkOrder`, `getGuest`, `getReservation`, `saveQuote`, `updateGuest` | L2 | 4.4, 4.5, 4.9 | – |
| US-024 | Đổi căn / đổi ngày / đổi phòng (UC-16, B7, B14, BR-424) | AC1: TC-L2-065<br>AC2: TC-L2-066<br>AC3: TC-L2-067<br>AC4: TC-L2-068 | BR-006, BR-403, BR-424, BR-906 | `changeRoom`, `getDoorCredential`, `listHkTasks`, `moveReservation`, `swapRoom` | L9 | 4.5 | – |
| US-136 | Đánh dấu no-show (UC-05, B11, B12, BR-311) – *mới* | AC1: TC-L2-070<br>AC2: TC-L2-071, TC-L2-072<br>AC3: TC-L2-073<br>AC4: TC-L2-074<br>AC5: TC-L2-075 | BR-010, BR-311, BR-526, BR-904 | `approveRequest`, `getFolio`, `getRegistration`, `getReservation`, `listApprovalRequests`, `listAttentionItems`, `listAuditEvents`, `listMyNotifications`, `markNoShow`, `restoreNoShow` | L2, L9 | 4.2, 4.5 | – |
| US-025 | Nhận phòng (UC-11, B9, BR-402) | AC1: TC-L3-001<br>AC2: TC-L3-002<br>AC3: TC-L3-003, TC-L3-007, TC-L3-062<br>AC4: TC-L3-004<br>AC5: TC-L3-005<br>AC6: TC-L3-008<br>bổ sung: TC-L3-006, TC-X-061 | BR-401, BR-402, BR-411, BR-602, BR-603 | `checkIn`, `getRegistration`, `getReservation`, `listApprovalRequests`, `listAttentionItems`, `listHkTasks`, `previewCheckIn`, `recordPayment`, `setDoorCredential`, `undoCheckIn` | L3 | 4.5 | – |
| US-026 | Phụ thu nhận sớm (BR-411, BR-414; HR-04) | AC1: TC-L3-010<br>AC2: TC-L3-011, TC-L3-012<br>AC3: TC-L3-008, TC-L3-013<br>AC4: TC-L3-014 | BR-401, BR-411, BR-417, BR-421, BR-422, BR-904, BR-906 | `checkIn`, `previewCheckIn`, `requestFoc` | L3 | 4.5, 4.6 | – |
| US-027 | Phụ thu cho đơn dài hạn (BR-102, BR-213, BR-413) | AC1: TC-L3-015<br>AC2: TC-L3-016 | BR-102, BR-412, BR-413 | `checkIn`, `previewCheckIn`, `setLateCheckout`, `setParameter` | L4 §4.2 (QA), L9 (QA) | 4.5 | ESC-007 |
| US-028 | Gia hạn (UC-13, B13, BR-421–423) | AC1: TC-L4-001<br>AC2: TC-L4-002<br>AC3: TC-L4-003<br>AC4: TC-L4-004<br>AC5: TC-L4-005 | BR-104, BR-108, BR-421, BR-422, BR-423, BR-604, BR-802, BR-901 | `createReservation`, `extendStay`, `getExtensionOptions`, `getFolio`, `getRegistration`, `getReservation`, `listHkTasks` | L9 | 4.5 | – |
| US-029 | Trả muộn (B15, BR-412, BR-414, BR-416) | AC1: TC-L4-010, TC-L4-011<br>AC2: TC-L4-012<br>AC3: TC-L4-013<br>AC4: TC-L4-014 | BR-403, BR-412, BR-414, BR-416 | `getDoorCredential`, `getExtensionOptions`, `listCheckoutReminders`, `listHkTasks`, `requestFoc`, `setLateCheckout`, `setParameter` | L9, L4 §4.2 (trả muộn) (QA) | 4.5, 4.6, 4.8 | ESC-007 |
| US-030 | Xác nhận giờ trả (UC-14) | AC1: TC-L4-020<br>AC2: TC-L4-021 | – | `getArrivalsDepartures`, `listCheckoutReminders`, `recordCheckoutConfirmation` | L2 §2.1 (Xác nhận giờ trả) (QA) | 4.5 | – |
| US-031 | Thẻ khách trả phòng hôm nay chưa trả (BR-425) | AC1: TC-L4-022<br>AC2: TC-L4-023<br>bổ sung: TC-L4-024 | BR-001, BR-425 | `getArrivalsDepartures`, `listCheckoutReminders` | L2 §2.1, §2.4 (QA) | 4.5 | – |
| US-032 | Dòng phát sinh / phí phạt (UC-17, BR-511, BR-512) | AC1: TC-L4-030<br>AC2: TC-L4-031<br>AC3: TC-L4-032<br>AC4: TC-L4-033<br>bổ sung: TC-L4-034 | BR-511, BR-512, BR-904 | `addFolioLine`, `adjustFolioLine`, `getChargeCatalog`, `getFolio`, `getGuestFolio`, `listApprovalRequests` | L4 §4.2 (phí phạt) (QA) | 4.6 | – |
| US-035 | Trả phòng bước 1: minibar (BR-701, BR-702) | AC1: TC-L4-040<br>AC2: TC-L4-041<br>AC3: TC-L4-042<br>bổ sung: TC-L4-043 | BR-701, BR-702 | `getCheckoutSummary`, `recordMinibarCheck` | L4 | 4.6 | – |
| US-036 | Trả phòng bước 2: phụ phí | AC1: TC-L4-044<br>AC2: TC-L4-045<br>AC3: TC-L4-046, TC-L4-047, TC-L4-048 | BR-307, BR-401, BR-412, BR-414 | `checkOut`, `getCheckoutSummary` | L4 | 4.5 | – |
| US-037 | Trả phòng bước 3: bill | AC1: TC-L4-050<br>AC2: TC-L4-051<br>AC3: TC-L4-052 | BR-004, BR-009, BR-412 | `getBill`, `getCheckoutSummary`, `getFolio` | L4 | 4.5, 4.6 | – |
| US-038 | Hoàn tất trả phòng (UC-18, B18, SM-13) | AC1: TC-L4-053<br>AC2: TC-L4-054<br>AC3: TC-L4-055<br>AC4: TC-L4-056<br>bổ sung: TC-L4-057, TC-L4-067, TC-L4-068, TC-X-060 | BR-007, BR-525, BR-604 | `addFolioLine`, `adjustFolioLine`, `checkOut`, `getCheckoutSummary`, `getFolio`, `getReservation`, `listAttentionItems`, `listHkTasks`, `listRoomStatuses` | L4 | 4.5, 4.6 | – |
| US-039 | Thông tin hóa đơn GTGT công ty | AC1: TC-L4-058<br>AC2: TC-L4-059 | BR-524 | `getBill`, `getGuest`, `setInvoiceRequest` | L4 | 4.6 | – |
| US-042 | Danh sách cần khai báo (UC-12, BR-602, BR-603, BR-611) | AC1: TC-L3-044, TC-L3-045, TC-L3-046<br>AC2: TC-L3-048<br>AC3: TC-L3-049<br>bổ sung: TC-L3-047 | BR-602, BR-603, BR-611 | `checkIn`, `getRegistration`, `listAttentionItems`, `listRegistrations`, `setParameter` | L3 | 4.5, 4.7 | ESC-001 |
| US-043 | Nhập giấy tờ (K3–K5, BR-601, BR-606, BR-612) | AC1: TC-L3-030<br>AC2: TC-L3-031<br>AC3: TC-L3-032<br>AC4: TC-L3-033 | BR-601, BR-612, BR-951 | `addGuestDocument`, `getGuestDocumentSensitive`, `getRegistration`, `listC3AccessLog`, `listParty`, `updateGuestDocument` | L3 | 4.7 | – |
| US-044 | Đối chiếu tự động (K5, BR-605; HR-07) | AC1: TC-L3-034<br>AC2: TC-L3-035<br>AC3: TC-L3-036<br>AC4: TC-L3-037 | BR-605, BR-613, BR-952 | `addGuestDocument`, `checkIn`, `completeRegistrationReview`, `getRegistration`, `listAttentionItems` | L3 | 4.5, 4.7 | ESC-001 |
| US-045 | Ghi nhận đồng ý lưu ảnh giấy tờ (K5, BR-609) | AC1: TC-L3-038<br>AC2: TC-L3-039<br>AC3: TC-L3-040 | BR-609 | `completeRegistrationReview`, `getDocumentImage`, `getRegistration`, `recordGuestConsent`, `recordImageConsent`, `transitionRegistration` | L3 | 4.7, 4.11 | – |
| US-046 | Khai báo bán tự động (K6–K8, BR-606) | AC1: TC-L3-041<br>AC2: TC-L3-042<br>AC3: TC-L3-043 | BR-606 | `getPortalData`, `getRegistration`, `listC3AccessLog`, `listRegistrations`, `transitionRegistration` | L3 | 4.7 | – |
| US-047 | Mọi đơn có bản ghi khai báo (K1, BR-608) | AC1: TC-L2-010, TC-L3-050<br>AC2: TC-L3-051<br>AC3: TC-L3-052 | BR-422, BR-608 | `confirmDeposit`, `createHoldFromQuote`, `createReservation`, `extendStay`, `getRegistration`, `getReservation`, `listRegistrations`, `updateReservation` | L3 | 4.5, 4.7 | – |
| US-048 | Quyền xem ảnh giấy tờ (A71, D03–D06, BR-610) | AC1: TC-RB-006<br>AC2: TC-RB-002, TC-RB-007<br>AC3: TC-RB-008<br>AC4: TC-RB-009<br>bổ sung: TC-RB-020, TC-RB-022, TC-SEC-010, TC-SEC-012, TC-SEC-014 | BR-610 | `addGuestDocument`, `getDocumentImage`, `getDoorCredential`, `getGuest`, `getGuestDocumentSensitive`, `getMe`, `getPortalData`, `getRack`, `getRegistration`, `getReservation`, `listC3AccessLog`, `listRegistrations`, `listReservations`, `purgeRegistrationImages`, `setDoorCredential`, `streamEvents`, `trustCurrentDevice`, `updateGuestDocument` | L3 §3.1 (nút Xem giấy tờ) (QA) | 4.3, 4.4, 4.7 | – |
| US-049 | Tự xóa ảnh giấy tờ (UC-29, BR-609, BR-610) | AC1: TC-L3-070<br>AC2: TC-L3-071<br>AC3: TC-L3-072 | BR-609, BR-610 | `getDocumentImage`, `purgeRegistrationImages`, `transitionRegistration` | L3 §3.1 (QA) | 4.7 | ESC-001 |
| US-050 | Ngày đi thực tế & hạn tạm trú (K9–K10, BR-604, BR-605) | AC1: TC-L3-053<br>AC2: TC-L3-054 | BR-605 | `checkOut`, `earlyDeparture`, `extendStay`, `getRegistration`, `listAttentionItems`, `listRegistrations`, `transitionRegistration` | L8 (QA), L9 §9.1–9.2 (QA) | 4.5, 4.7 | – |
| US-052 | Xem trạng thái buồng (S10) | AC1: TC-L6-001<br>AC2: TC-L6-002<br>AC3: TC-RB-015<br>bổ sung: TC-L6-003 | BR-801 | `listRoomStatuses` | L6 | 4.8 | – |
| US-053 | Đổi trạng thái buồng hợp lệ (SM-03, BR-802) | AC1: TC-L6-010<br>AC2: TC-L6-011<br>AC3: TC-L6-012<br>AC4: TC-L6-013<br>bổ sung: TC-L6-014, TC-L6-029 | – | `listHkTasks`, `listRoomStatuses`, `recordInspection`, `transitionRoomStatus` | L6 | 4.8 | – |
| US-054 | Việc hôm nay tự sinh (SM-14, BR-807) | AC1: TC-L6-020<br>AC2: TC-L6-021<br>AC3: TC-L6-022<br>AC4: TC-L6-023<br>bổ sung: TC-L6-024, TC-L6-033, TC-L6-053, TC-L6-054, TC-L6-055, TC-X-020 | BR-807, BR-811 | `cancelReservation`, `changeRoom`, `checkIn`, `checkOut`, `confirmDeposit`, `createGuestRequest`, `createHoldFromQuote`, `createReservation`, `getFolio`, `listHkTasks`, `listRoomStatuses`, `recordInspection`, `streamEvents`, `transitionHkTask`, `updateReservation` | L6 | 4.8 | ESC-014 |
| US-055 | Checklist kiểm phòng (R4, BR-808) | AC1: TC-L6-025<br>AC2: TC-L6-026 | BR-808 | `getInspectionChecklist`, `recordInspection` | L6 | 4.8 | – |
| US-056 | Lịch dọn khách dài hạn (BR-807) | AC1: TC-L6-027<br>AC2: TC-L6-028 | BR-807 | `listHkTasks`, `listRoomStatuses` | L6 | 4.5, 4.8 | – |
| US-057 | Báo sự cố từ điện thoại (W1, BR-809) | AC1: TC-L6-030<br>AC2: TC-L6-031<br>bổ sung: TC-L6-032 | BR-809 | `createRoomBlock`, `createWorkOrder`, `listAttentionItems`, `listWorkOrders`, `uploadAttachment` | L6 | 4.9 | – |
| US-061 | Tạo phiếu sửa và khóa phòng (UC-24, W1, O1, BR-804) | AC1: TC-L2-033, TC-L6-040, TC-X-010<br>AC2: TC-L6-041<br>AC3: TC-L6-042<br>AC4: TC-L6-043 | BR-804 | `createRoomBlock`, `createWorkOrder`, `getRack`, `listAttentionItems`, `moveReservation`, `searchAvailability` | L6 | 4.5, 4.9 | – |
| US-062 | Cập nhật phiếu sửa (SM-04, O4) | AC1: TC-L6-045, TC-X-010<br>AC2: TC-L6-046<br>AC3: TC-L6-047<br>bổ sung: TC-L6-048, TC-L6-051 | BR-809 | `listAttentionItems`, `listHkTasks`, `listRoomBlocks`, `listWorkOrders`, `transitionRoomBlock`, `transitionWorkOrder` | L6 | 4.9 | – |
| US-066 | Danh mục mặt hàng minibar (BR-701, A91) | AC1: TC-L4-070<br>AC2: TC-L4-071<br>AC3: TC-RB-017 | BR-006, BR-701 | `createItem`, `getFolio`, `listItems`, `recordMinibarCheck`, `updateItem` | L10 | 4.10 | – |
| US-071 | Tạo/sửa hồ sơ khách | AC1: TC-L5-040<br>AC2: TC-L5-041<br>AC3: TC-L5-042 | BR-951 | `createGuest`, `getGuest`, `updateGuest` | L10 | 4.4 | – |
| US-072 | Chặn hồ sơ trùng (BR-951, BR-952) | AC1: TC-L5-043<br>AC2: TC-L5-044 | BR-951, BR-952 | `createGuest`, `lookupGuestByContact` | L10 | 4.4 | – |
| US-073 | Bộ chọn khách dùng chung | AC1: TC-L5-045<br>AC2: TC-L5-046<br>AC3: TC-L5-047<br>bổ sung: TC-L5-048 | – | `createGuest`, `createLead`, `getQuote`, `lookupGuestByContact`, `saveQuote`, `searchGuests` | L2 | 4.4 | – |
| US-080 | Báo giá ngắn ngày (UC-01) | AC1: TC-L5-001, TC-L5-002<br>AC2: TC-L5-003<br>AC3: TC-L5-004<br>AC4: TC-L5-005<br>AC5: TC-L5-006 | BR-107, BR-108, BR-110, BR-111, BR-112, BR-305, BR-903 | `calculateQuote`, `searchAvailability` | L5 | 4.5 | ESC-004, ESC-014 |
| US-082 | Kiểm phòng trống khi báo giá | AC1: TC-L5-019<br>AC2: TC-L5-020 | – | `calculateQuote`, `createHoldFromQuote`, `searchAvailability` | L5 | 4.5 | – |
| US-083 | Lưu và gửi báo giá (SM-08 Q1–Q4, BR-304) | AC1: TC-L5-015, TC-L5-018<br>AC2: TC-L5-016<br>AC3: TC-L5-017<br>bổ sung: TC-L5-036 | BR-006, BR-007, BR-304 | `createHoldFromQuote`, `getQuote`, `getQuoteText`, `listApprovalRequests`, `listQuotes`, `saveQuote`, `withdrawQuote` | L5 | 4.5 | – |
| US-084 | Tạo đơn giữ chỗ (UC-02, B1, BR-302) | AC1: TC-L5-021, TC-L5-022, TC-X-010<br>AC2: TC-L5-023<br>AC3: TC-L5-024<br>AC4: TC-L5-025<br>bổ sung: TC-L5-037, TC-L5-048 | BR-206, BR-302, BR-305, BR-306 | `createHoldFromQuote`, `createLead`, `createVietQr`, `getQuote`, `getRack`, `listAttentionItems`, `listLeads`, `saveQuote` | L5 | 4.5 | – |
| US-085 | Hết hạn giữ chỗ (B3, B6, BR-303) | AC1: TC-L5-026, TC-L5-027, TC-X-010<br>AC2: TC-L5-028<br>AC3: TC-L5-029<br>AC4: TC-L5-030, TC-X-004<br>bổ sung: TC-X-063 | BR-302, BR-303 | `confirmDeposit`, `extendHold`, `getRack`, `getReservation`, `getReservationHistory`, `listAttentionItems`, `listMyNotifications`, `recordPayment` | L5, L2 §2.3 (QA) | 4.2, 4.5 | ESC-006 |
| US-086 | Xác nhận cọc & sinh hợp đồng (UC-03, UC-07, B4, H1) | AC1: TC-L5-031<br>AC2: TC-L5-032<br>AC4: TC-L5-034<br>AC5: TC-L5-035<br>AC3 (Dời R3): TC-L5-033<br>bổ sung: TC-L5-039, TC-X-003 | BR-008, BR-305 | `checkIn`, `confirmDeposit`, `createDepositNotice`, `getLeaseContract`, `listAuditEvents`, `recordPayment`, `uploadAttachment` | L5 | 4.5 | ESC-012 |
| US-087 | CTV chỉ thấy phần của mình (rbac phạm vi M) | AC1: TC-RB-010<br>AC2: TC-RB-011<br>AC3: TC-RB-001<br>bổ sung: TC-L5-038 | – | `cancelReservation`, `changeLeadStage`, `checkOut`, `getGuest`, `getQuote`, `getReservation`, `listCommissions`, `listLeads`, `listParty`, `listQuotes`, `listReservations`, `searchGuests` | L5 | 4.4, 4.5, 4.6 | – |
| US-139 | Xung đột đơn OTA trùng (BR-312, SM-01 mục 1.3) – *bước 4: nâng Must R2* | AC1: TC-L2-024, TC-L2-027<br>AC2: TC-L2-025, TC-L2-028<br>AC3: TC-L2-026<br>bổ sung: TC-L2-029 | BR-312, BR-316, BR-317 | `assignRoom`, `checkIn`, `createReservation`, `getRack`, `listAttentionItems`, `listOverbookingIncidents`, `moveReservation`, `previewCheckIn`, `swapRoom`, `updateReservation` | L2, L9, L8 (Cần chú ý) (QA) | 4.5 | – |
| US-106 | Mở app khách bằng link/QR (ADR-006, A22) | AC1: TC-L7-001, TC-SEC-007<br>AC2: TC-L7-002, TC-SEC-006, TC-SEC-024, TC-SEC-030<br>AC3: TC-L7-003, TC-SEC-001, TC-SEC-002, TC-SEC-003, TC-SEC-004, TC-SEC-008<br>bổ sung: TC-L7-004, TC-SEC-029, TC-X-062 | BR-427 | `completeOnlineCheckin`, `createGuestRequest`, `getGuestFolio`, `getGuestStay`, `getOnlineCheckin`, `getRack`, `getReservation`, `issueGuestLink`, `issueGuestVerificationCode`, `listMyRequests`, `openGuestSession`, `recordGuestConsent`, `resendGuestLinkFromUnit`, `revokeGuestLink`, `sendGuestOtp`, `setParameter`, `updateOnlineCheckin`, `uploadGuestDocument`, `verifyGuestSession`, `withdrawGuestConsent` | L7 | 4.1, 4.5, 4.11 | – |
| US-107 | Check-in online (UC-10, K2) | AC1: TC-L7-010<br>AC2: TC-L7-011<br>AC3: TC-L7-012<br>AC4: TC-L7-013<br>AC5: TC-L7-014<br>bổ sung: TC-L7-015, TC-X-062 | BR-609 | `completeOnlineCheckin`, `getOnlineCheckin`, `getReservation`, `issueGuestLink`, `openGuestSession`, `recordGuestConsent`, `updateOnlineCheckin`, `uploadGuestDocument` | L7 | 4.5, 4.11 | – |
| US-108 | Thông tin lưu trú | AC1: TC-L7-020<br>AC2: TC-L7-021, TC-SEC-005 | BR-401, BR-403, BR-511 | `getGuestStay`, `getPublicUnitPage`, `listC3AccessLog` | L7 | 4.1, 4.11 | – |
| US-109 | Khách gửi yêu cầu (UC-15, SM-15) | AC1: TC-L7-030<br>AC2: TC-L7-031 | – | `createGuestRequest`, `listMyRequests`, `transitionGuestRequest` | L7 | 4.11 | – |
| US-110 | Định tuyến yêu cầu (BR-811, BR-809) | AC1: TC-L7-032<br>AC2: TC-L7-033, TC-L7-034, TC-L7-035<br>AC3: TC-RB-016<br>bổ sung: TC-L7-036 | BR-809, BR-811 | `createGuestRequest`, `createWorkOrder`, `listAttentionItems`, `listGuestRequests`, `listHkTasks`, `listMyNotifications`, `listMyRequests`, `listWorkOrders`, `transitionGuestRequest`, `transitionWorkOrder` | L7 | 4.2, 4.11 | – |
| US-112 | App khách tiếng Anh (HR-01) | AC1: TC-L7-050<br>AC2: TC-L7-051<br>AC3: TC-L7-052 | – | `getGuestStay`, `setGuestLocale` | L7 | 4.4, 4.11 | – |
| US-119 | Ghi nhận thu tiền (SM-12, BR-521) | AC1: TC-L4-060<br>AC2: TC-L4-061<br>AC3: TC-L4-062<br>AC4: TC-L4-063<br>AC6: TC-L4-069<br>AC5 (Dời R3): TC-L5-039<br>bổ sung: TC-L4-066, TC-RB-021 | BR-008, BR-307 | `addFolioLine`, `checkIn`, `confirmDeposit`, `createGuestRequest`, `createVietQr`, `getFolio`, `getLeaseContract`, `getShiftReport`, `reconcilePayment`, `recordPayment`, `reversePayment`, `updateReservation` | L4 | 4.5, 4.6 | ESC-012 |
| US-120 | VietQR (I2) | AC1: TC-L4-064<br>AC2: TC-L4-065<br>bổ sung: TC-L4-069 | BR-521 | `createVietQr`, `getFolio`, `recordPayment` | L4 | 4.6 | ESC-010 |

## 3. Story ngoài Must R2 có test case ca chính trong R1 (Must R3, Should R2)

| Story | AC → TC | Endpoint | Wireframe |
|---|---|---|---|
| US-041 | (chưa có AC) TC-L4-080, TC-L4-081 | **TRỐNG** (R3) | L4 |
| US-064 | (chưa có AC) TC-L6-050 | **TRỐNG** (R3) | **TRỐNG** |
| US-081 | AC1: TC-L5-010, TC-L5-011<br>AC2: TC-L5-012<br>AC3: TC-L5-013<br>AC4: TC-L5-014 | `calculateQuote`, `saveQuote` | L5 |
| US-111 | AC1: TC-L7-040<br>AC2: TC-L7-041 | `getFolio`, `getGuestFolio`, `issueGuestVerificationCode` | L7 |
| US-125 | AC1: TC-L7-060<br>AC2: TC-L7-061<br>AC3: TC-L7-062 | `listC3AccessLog`, `listMessageTemplates`, `renderDoorCodeMessage`, `renderMessage`, `stepUp` | L10 |
| US-128 | AC1: TC-L3-060<br>AC2: TC-RB-013<br>AC3: TC-L3-061 | `changeRoom`, `checkOut`, `getDoorCredential`, `getGuestStay`, `getReservation`, `listC3AccessLog`, `renderDoorCodeMessage`, `setDoorCredential`, `stepUp` | L3, L7 (QA) |
| US-137 | (chưa có AC) TC-L4-025 | `earlyDeparture`, `listApprovalRequests` | **TRỐNG** |
| US-141 | AC1: TC-SEC-001, TC-SEC-002<br>AC2: TC-SEC-003, TC-SEC-008<br>AC3: TC-SEC-004 | `getGuestFolio`, `getGuestStay`, `issueGuestVerificationCode`, `openGuestSession`, `sendGuestOtp`, `setParameter`, `verifyGuestSession` | L7 (màn xác minh OTP) (QA), L3 §3.5 (cấp mã xác minh) (QA) |

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
- TC-NT-023 (US-074/–)
- TC-RB-004 (US-003/AC3)
- TC-L4-080 (US-041/–)
- TC-L4-081 (US-041/–)
- TC-L5-037 (US-084/–)
- TC-L6-050 (US-064/–)
- TC-SEC-001 (US-106/AC3, US-141/AC1)

### 5.4 Story Must R2 chưa có wireframe
- Không có.

### 5.5 BR trong danh mục chưa được story hay test case nào tham chiếu
Đa số thuộc phân hệ Round 3 hoặc ngoài MVP (điện nước, VAT, kho, P&L, chấm dứt HĐ, đồ thất lạc, độ đầy đủ hồ sơ). Plan R1 mục 6 yêu cầu mỗi BR có ≥ 1 story/TC tham chiếu → đề nghị PO gắn các BR này vào story R3 tương ứng (US-064/065, US-122, US-093, US-118, US-078…), QA viết TC khi story có AC.
- Không có.

### 5.6 BR được story tham chiếu nhưng chưa có test case R1 (thường là phân hệ R3)
- BR-215, BR-313, BR-314, BR-316, BR-317, BR-321, BR-322, BR-323, BR-324, BR-325, BR-326, BR-417, BR-436, BR-501, BR-504, BR-505, BR-506, BR-513, BR-523, BR-527, BR-613, BR-706, BR-810, BR-902, BR-955, BR-961, BR-962, BR-963, BR-964

### 5.7 Test case bị chặn, chưa có kỳ vọng xác định, hoặc theo giả định QA

| TC | Nhãn | Story/AC |
|---|---|---|
| TC-NT-023 | [BLOCKED: R3 – gộp hồ sơ US-074; decision-log 15/10 PO chuyển US-023 AC2 sang US-074] | US-074/– |
| TC-NT-042 | [UNDECIDED: erd 9.1 chưa ghi khoảng giá trị cho khóa nghiệp vụ – chờ ARC] | US-005/– |
| TC-RB-024 | [GIẢ ĐỊNH QA – chờ BA: D01 hiển thị theo màn đang mở] | US-002/AC3 |
| TC-L2-029 | [BLOCKED: R2 chỉ có nhánh lễ tân nhập lại theo extranet; nhánh SYS từ channel manager là R3] | US-139/– |
| TC-L3-070 | [GIẢ ĐỊNH QA – chờ DOM: "30 ngày sau trả phòng" = xóa ở lần chạy J16 đầu tiên từ 00:00 ngày (ngày trả theo lịch giờ VN + 30); BA-DOM-07] | US-049/AC1 |
| TC-L5-015 | [GIẢ ĐỊNH QA – chờ DOM: hạn = 23:59 của ngày (ngày lập + `quote_validity_days`)] | US-083/AC1 |
| TC-L5-033 | [Dời R3 – R-C: AC dời theo INV quyết ESC-012 16/10; giữ TC cho đầu R3, không chạy ở R2] | US-086/AC3 |
| TC-L5-039 | [Dời R3 – R-C: AC dời theo INV quyết ESC-012 16/10; giữ TC cho đầu R3, không chạy ở R2] | US-086/–, US-119/AC5 |
| TC-L6-029 | [GIẢ ĐỊNH QA – chờ DOM: đủ đúng 72 giờ tính là "quá 3 ngày" → VC] | US-053/– |
| TC-L6-053 | [BLOCKED: OpenAPI 0.3 chưa có loại việc buồng phòng cho bộ đồ dùng thêm (`HkTaskType` thiếu `extra_guest_kit_prepare`/`collect`/`transfer` – BA EP02 E02-05) – chờ ARC; backlog chưa có AC cho BR-812 – chờ PO] | US-054/– |
| TC-L6-054 | [BLOCKED: OpenAPI 0.3 chưa có loại việc buồng phòng cho bộ đồ dùng thêm (`HkTaskType` thiếu `extra_guest_kit_prepare`/`collect`/`transfer` – BA EP02 E02-05) – chờ ARC; backlog chưa có AC cho BR-812 – chờ PO] | US-054/– |
| TC-L6-055 | [BLOCKED: OpenAPI 0.3 chưa có loại việc buồng phòng cho bộ đồ dùng thêm (`HkTaskType` thiếu `extra_guest_kit_prepare`/`collect`/`transfer` – BA EP02 E02-05) – chờ ARC; backlog chưa có AC cho BR-812 – chờ PO] | US-054/– |
| TC-L7-035 | [GIẢ ĐỊNH QA – chờ DOM: giờ trực là khoảng [07:00, 22:00) – 22:00 là ngoài giờ] | US-110/AC2 |
| TC-L8-006 | [Dời R3 – R-C: AC dời theo INV quyết ESC-012 16/10; giữ TC cho đầu R3, không chạy ở R2] | US-012/AC2 |

## 6. Danh mục operationId OpenAPI chưa được test case nào dùng (để R2 bổ sung ca)
- `addReservationGroupMember`, `allocateGroupDeposit`, `assignRoom`, `cancelReservationGroup`, `cancelReservationGroupMember`, `changeLeadStage`, `closeShift`, `confirmMy2fa`, `createHkTask`, `createReservationGroup`, `createRoom`, `createUser`, `deleteMyPushSubscription`, `disableMy2fa`, `getMy2fa`, `getMyCurrentShift`, `getPublicUnitPage`, `getReservationGroup`, `getShiftReport`, `getWorkOrder`, `issueGroupBill`, `listCommissions`, `listMyNotifications`, `listReservationGroups`, `listShifts`, `loginMfa`, `markCommissionPayoutPaid`, `markNotificationRead`, `openShift`, `putMyPushSubscription`, `reconcileChannelFee`, `reconcilePayment`, `removeReservationGroupMember`, `reopenShift`, `resolveAttentionEvent`, `resolveOverbookingExternal`, `reviewShift`, `sendGuestOtp`, `setMyApprovalPin`, `startMy2faSetup`, `startShiftClosing`, `swapRoom`, `updateWorkOrder`, `webhookGet`

## 7. Chuyển trạng thái (17 máy) → test case

Nguồn: bảng chuyển của `state-machines.md`. Máy có cột "#" dùng mã chuyển (B1…, O1…, R1…, W1…, K1…, H1…, T1…, Q1…, A1…); máy chưa có mã (SM-09, SM-11…SM-15) dùng khóa `từ→đến`. TC khai báo chuyển ở cột "Quy tắc" (`SM-10 A5`, `SM-14 open→cancelled`). Cột Endpoint lấy từ `x-transition` của OpenAPI.

| Máy | # | Từ → Đến | Sự kiện | Endpoint (`x-transition`) | TC |
|---|---|---|---|---|---|
| SM-01 | B1 | [*] → `hold` | Tạo giữ chỗ | `createHoldFromQuote` | TC-L2-023, TC-L5-021, TC-L5-024 |
| SM-01 | B2 | [*] → `confirmed` | Tạo đơn đã đảm bảo | `createReservation` | TC-L2-010, TC-L2-017, TC-L2-076 |
| SM-01 | B3 | `hold` → `hold` | Gia hạn giữ chỗ | `extendHold` | TC-L2-040, TC-L5-029 |
| SM-01 | B4 | `hold` → `confirmed` | Xác nhận cọc / ký quỹ | `confirmDeposit` | TC-L2-023, TC-L2-040, TC-L5-031, TC-L5-032 |
| SM-01 | B5 | `hold` → `cancelled` | Hủy giữ chỗ | `cancelReservation` | TC-L2-040, TC-L2-050, TC-L2-052 |
| SM-01 | B6 | `hold` → `cancelled` | Hết hạn giữ chỗ | – | TC-L5-026, TC-X-063 |
| SM-01 | B7 | `confirmed` → `confirmed` | Đổi căn / đổi ngày | `moveReservation`, `swapRoom` | TC-L2-023, TC-L2-065 |
| SM-01 | B7a | `confirmed` → `confirmed` | Gán căn cho đơn xung đột / chưa gán căn | `assignRoom` | TC-L2-028 |
| SM-01 | B7b | `confirmed` → `confirmed` | Lễ tân nhập tay đơn OTA vào căn đã kín (R2) | – | TC-L2-024, TC-L2-027 |
| SM-01 | B7c | `confirmed` → `confirmed` | OTA sửa đơn (đổi ngày, số khách, loại phòng, hủy một phần đê | – | TC-L2-029 |
| SM-01 | B8 | `confirmed` → `confirmed` | Dời ngày thay vì hủy (BR-309) | `moveReservation` | TC-L2-055 |
| SM-01 | B9 | `confirmed` → `in_house` | Nhận phòng | `checkIn` | TC-L3-001, TC-L3-007, TC-L3-008 |
| SM-01 | B9a | `confirmed` → `in_house` | Nhận trước mốc đổi ngày (BR-010, mặc định 06:00) – thêm đêm  | – | TC-L3-008, TC-L3-013 |
| SM-01 | B10 | `confirmed` → `cancelled` | Hủy đơn đã đảm bảo | `cancelReservation` | TC-L2-052 |
| SM-01 | B11 | `confirmed` → `no_show` | Đánh dấu không đến | `markNoShow` | TC-L2-071 |
| SM-01 | B12 | `no_show` → `confirmed` | Khôi phục no-show (DOM SQ-1) | `restoreNoShow` | TC-L2-023, TC-L2-074 |
| SM-01 | B13 | `in_house` → `in_house` | Gia hạn | `extendStay` | TC-L2-023, TC-L4-002 |
| SM-01 | B14 | `in_house` → `in_house` | Đổi phòng | `changeRoom`, `swapRoom` | TC-L2-023, TC-L2-066 |
| SM-01 | B15 | `in_house` → `in_house` | Đặt trả muộn | `setLateCheckout` | TC-L4-010 |
| SM-01 | B16 | `in_house` → `in_house` | Trả sớm (báo trước ngày đi) | `earlyDeparture` | TC-L4-025 |
| SM-01 | B17 | `in_house` → `confirmed` | Hoàn tác nhận phòng nhầm (DOM xác nhận) | `undoCheckIn` | TC-L3-005 |
| SM-01 | B18 | `in_house` → `checked_out` | Hoàn tất trả phòng | `checkOut` | TC-L4-048, TC-L4-053, TC-L4-067, TC-NT-031 |
| SM-02 | O1 | [*] → `planned`/`active` | Tạo khối | `createRoomBlock`, `createWorkOrder` | TC-L2-023, TC-L2-032, TC-L2-033, TC-L6-031, TC-L6-040, TC-L6-041, TC-L6-042, TC-RB-025 |
| SM-02 | O2 | `planned` → `active` | Đến ngày bắt đầu | – | TC-L6-044 |
| SM-02 | O3 | `active` → `active` | Đổi khoảng ngày | `updateRoomBlock` | TC-L2-023 |
| SM-02 | O4 | `active` → `released` | Mở khóa | `transitionRoomBlock` | TC-L6-045, TC-L6-051 |
| SM-02 | O5 | `planned` → `cancelled` | Hủy khóa | `transitionRoomBlock` | TC-L6-052 |
| SM-03 | R1 | `VD`/`OD` → `CL` | Bắt đầu dọn | `transitionRoomStatus` | TC-L6-010 |
| SM-03 | R2 | `CL` → `OC` | Dọn xong (căn còn đơn `in_house`) | `transitionRoomStatus` | TC-L6-010 |
| SM-03 | R3 | `CL` → `VC` | Dọn xong (không còn đơn `in_house`) | `transitionRoomStatus` | TC-L6-010 |
| SM-03 | R4 | `VC` → `VI` | Kiểm phòng đạt | `recordInspection` | TC-L6-012 |
| SM-03 | R5 | `VI` → `VC` | Quá hạn chờ khách | – | TC-L6-029 |
| SM-03 | R6 | `VC`/`VI` → `OC` | Nhận phòng (B9) | – | TC-L3-001 |
| SM-03 | R7 | `VD` → `OD` | Nhận phòng ngoại lệ (B9 khi buồng chưa sẵn sàng) | – | TC-L3-002 |
| SM-03 | R8 | `OC` → `OD` | Cần dọn | `transitionRoomStatus` | TC-L6-024, TC-L6-027 |
| SM-03 | R9 | `OC`/`OD`/`CL` → `VD` | Trả phòng (B18) | – | TC-L2-067, TC-L4-053, TC-L4-067 |
| SM-03 | R10 | `VC`/`VI`/`VD`/`CL` → `OOO` | Khối OOO `active` | – | TC-L6-040 |
| SM-03 | R11 | `OOO` → `VD` | Khối OOO `released` | – | TC-L6-045 |
| SM-04 | W1 | [*] → `new` | Tạo phiếu | `createWorkOrder` | TC-L6-030, TC-L6-043 |
| SM-04 | W2 | `new` → `in_progress` | Nhận phiếu | `transitionWorkOrder` | TC-L6-046 |
| SM-04 | W3 | `in_progress` ↔ `waiting_parts` | Chờ / có vật tư | `transitionWorkOrder` | TC-L6-046 |
| SM-04 | W4 | `in_progress` → `done` | Sửa xong | `transitionWorkOrder` | TC-L6-045, TC-L6-046 |
| SM-04 | W5 | `new`/`waiting_parts` → `cancelled` | Hủy | `transitionWorkOrder` | TC-L6-046, TC-L6-048 |
| SM-04 | W6 | `done` → `in_progress` | Mở lại | `transitionWorkOrder` | TC-L6-046 |
| SM-05 | K1 | [*] → `none` | Đơn sinh (B1, B2) | – | TC-L3-050 |
| SM-05 | K2 | `none` → `pre` | Check-in online | `uploadGuestDocument` | TC-L7-010 |
| SM-05 | K3 | `pre`/`none` → `partial`/`review` | Nhập/đối chiếu giấy tờ | `addGuestDocument` | TC-L3-030 |
| SM-05 | K4 | `partial` → `review` | Đủ người | – | TC-L3-030 |
| SM-05 | K5 | `review` → `scanned` | Đối chiếu xong | `completeRegistrationReview` | TC-L3-037 |
| SM-05 | K6 | `scanned` → `sent` | Đã khai | `transitionRegistration` | TC-L3-043 |
| SM-05 | K7 | `sent` → `confirmed` | Cổng xác nhận | `transitionRegistration` | TC-L3-043 |
| SM-05 | K8 | `sent` → `scanned` | Cổng từ chối | `transitionRegistration` | TC-L3-043 |
| SM-05 | K9 | `confirmed`/`updated` → `needs_update` | Thay đổi phải cập nhật | – | TC-L3-052, TC-L3-053 |
| SM-05 | K10 | `needs_update` → `updated` | Đã cập nhật | `transitionRegistration` | TC-L3-053 |
| SM-05 | K11 | `none`/`pre`/`partial`/`review` → `void` | Đơn `cancelled`/`no_show` | – | TC-L2-052 |
| SM-05 | K12 | `void` → `none` | Khôi phục no-show (B12) | – | TC-L2-074 |
| SM-05 | K13 | `review` → `partial` | Đổi thành phần khách khi đang đối chiếu | – | TC-L3-055 |
| SM-06 | H1 | [*] → `signed` | Xác nhận ký quỹ (B4) | – | TC-L5-033 |
| SM-06 | H2 | `signed` → `active` | Nhận phòng | – | TC-L5-039 |
| SM-06 | H3 | `signed` → `cancelled` | Hủy trước vào ở | – | **TRỐNG** |
| SM-06 | H4 | `active` → `active` | Gia hạn HĐ | – | **TRỐNG** |
| SM-06 | H5 | `active` → `active` | Sửa tay con số trên HĐ | – | **TRỐNG** |
| SM-06 | H6 | `active` → `terminating` | Khách báo chấm dứt sớm | – | **TRỐNG** |
| SM-06 | H7 | `terminating` → `active` | Khách rút thông báo | – | **TRỐNG** |
| SM-06 | H8 | `active`/`terminating` → `settling` | Khách trả phòng (B18) | – | **TRỐNG** |
| SM-06 | H9 | `settling` → `closed` | Quyết toán xong | – | **TRỐNG** |
| SM-07 | T1 | → `due_soon` / `due` / `overdue` / `escalated` | Mốc theo BR-207 (tiền thuê) hoặc hạn BR-504 (điện nước) | – | TC-L5-039 |
| SM-07 | T2 | → `paid` | Tổng giao dịch `succeeded` gắn kỳ ≥ số tiền kỳ | – | TC-L5-039 |
| SM-07 | T3 | → `waived` | Chấm dứt sớm (H6) hoặc MGR+ miễn có lý do | – | **TRỐNG** |
| SM-08 | Q1 | [*] → `active` | Lưu báo giá | `saveQuote` | TC-L5-015 |
| SM-08 | Q2 | `active` → `converted` | Tạo giữ chỗ từ báo giá (B1) | `createHoldFromQuote` | TC-L5-021 |
| SM-08 | Q3 | `active` → `expired` | Hết hiệu lực | – | TC-L5-015 |
| SM-08 | Q4 | `expired` → `active` | Gia hạn báo giá | – | TC-L5-017 |
| SM-08 | Q5 | `active`/`expired` → `withdrawn` | Rút báo giá | `withdrawQuote` | TC-L5-036 |
| SM-09 | – | [*] → `new` | Tạo lead | – | TC-L5-048 |
| SM-09 | – | `new` → `quoted` | Báo giá `active` đầu tiên (Q1) | – | TC-L5-037 |
| SM-09 | – | `quoted` → `holding` | Đơn `hold` từ báo giá (B1) | – | TC-L5-021 |
| SM-09 | – | `holding` → `won` | Đơn → `confirmed` (B4) | – | TC-L5-031 |
| SM-09 | – | `holding` → `quoted` | Đơn giữ chỗ hủy/hết hạn (B5, B6) | – | TC-L5-037 |
| SM-09 | – | `new`/`quoted` → `lost` | Đóng lead, lý do bắt buộc (cùng danh mục BR-308) | – | TC-L5-037 |
| SM-09 | – | `lost` → `quoted` | Mở lại khi khách quay lại | – | TC-L5-037 |
| SM-10 | A1 | [*] → `pending` | Có lý do từ danh mục BR-432; giá trị; đối tượng (đơn/folio/H | `requestFoc` | TC-L2-075, TC-NT-027 |
| SM-10 | A2 | [*] → `approved` (tự áp) | Quy tắc chung (DOM SQ-3): không ai duyệt yêu cầu của chính m | `requestFoc` | TC-NT-032, TC-NT-036 |
| SM-10 | A3 | `pending` → `approved` | Người duyệt khác người gửi (trừ MGR/OWN); giá trị ≤ hạn mức  | `approveRequest` | TC-L2-075, TC-NT-028 |
| SM-10 | A4 | `pending` → `escalated` | Giá trị vượt hạn mức người duyệt hiện tại | `approveRequest` | TC-NT-029, TC-NT-034 |
| SM-10 | A5 | `pending`/`escalated` → `rejected` | Lý do từ chối | `rejectRequest` | TC-NT-033, TC-NT-034 |
| SM-10 | A6 | `pending` → `cancelled` | – | `cancelRequest` | TC-NT-035 |
| SM-11 | – | [*] → `projected` | Đơn/HĐ có người chốt SAL/CTV được xác nhận (B4) | – | TC-L5-031 |
| SM-11 | – | `projected` → `earned` | Ngắn ngày: đơn `checked_out` và thu đủ (BR-903). Dài hạn: ch | – | TC-L4-053, TC-L5-038 |
| SM-11 | – | `earned` → `payable` | Kỳ chi gộp theo tháng lịch (DOM SQ-4): job ngày 1 chuyển mọi | – | **TRỐNG** |
| SM-11 | – | `payable` → `paid` | Đánh dấu đã chi, ghi ngày, cách chi, chứng từ | – | **TRỐNG** |
| SM-11 | – | `projected`/`earned` → `void` | Đơn `cancelled`/`no_show`; HĐ chấm dứt sớm trước đợt 2 (BR-2 | – | TC-L2-052, TC-L5-038 |
| SM-12 | – | [*] → `pending` | Tạo yêu cầu thu online (VietQR động, link VNPay/MoMo – R3) | – | TC-L4-064 |
| SM-12 | – | [*] → `succeeded` | Ghi nhận thu tay (tiền mặt, chuyển khoản đã thấy tiền, "đã t | – | TC-L4-060 |
| SM-12 | – | `pending` → `succeeded` | IPN/webhook đã xác thực chữ ký và khớp số tiền (decision-log | – | TC-L4-069 |
| SM-12 | – | `pending` → `failed` / `expired` | Cổng báo lỗi / quá hạn link | – | TC-L4-069 |
| SM-12 | – | `succeeded` → `reversed` | Ghi sai: tạo giao dịch đảo (không xóa – BR-008) | – | TC-L4-062 |
| SM-12 | – | → `not_required` | Tiền mặt (đối chiếu qua đếm tiền đóng ca), IPN/webhook đã xá | – | TC-L4-069 |
| SM-12 | – | → `pending` | Chuyển khoản/VietQR ghi tay (kể cả SAL xác nhận cọc – SEC-BA | – | TC-L4-064 |
| SM-12 | – | `pending` → `reconciled` | MGR+ tick sau khi xem sao kê ngân hàng; hoặc webhook bank fe | – | TC-L4-069 |
| SM-12 | – | `pending` → `disputed` | Không thấy tiền trên sao kê sau mốc đối soát (BR-526) | – | TC-L4-069 |
| SM-13 | – | `open` → `settled` | (mô tả trong đoạn văn) | – | TC-L4-053 |
| SM-13 | – | `settled` → `closed` | (mô tả trong đoạn văn) | – | TC-L4-068 |
| SM-14 | – | [*] → `open` | SYS sinh (trả phòng, gia hạn, lịch dọn dài hạn BR-807, OC→OD | – | TC-L4-053, TC-L6-020 |
| SM-14 | – | `open` → `in_progress` | Bắt đầu dọn (R1) hoặc nhận việc | – | TC-L6-022 |
| SM-14 | – | `in_progress`/`open` → `done` | Dọn xong (R2/R3) hoặc tick xong; việc "Bổ sung minibar" → tr | – | TC-L6-022 |
| SM-14 | – | `open` → `cancelled` | Khách từ chối dọn, khối OOO, đơn hủy; việc bộ đồ dùng thêm k | – | TC-L6-033 |
| SM-15 | – | [*] → `new` | Khách gửi (6 loại, BR-811) | – | TC-L7-030 |
| SM-15 | – | `new` → `acknowledged` | Bộ phận được định tuyến bấm "Đã nhận" – đo thời hạn phản hồi | – | TC-L7-036 |
| SM-15 | – | `acknowledged` → `in_progress` | Tạo việc HK (SM-14) / phiếu sửa (SM-04) / ghi chú lễ tân | – | TC-L7-036 |
| SM-15 | – | `in_progress` → `done` | Việc/phiếu liên kết `done`, hoặc lễ tân trả lời xong | – | TC-L7-031 |
| SM-15 | – | `new`/`acknowledged` → `declined` | Không thực hiện được, ghi lý do gửi khách | – | TC-L7-031 |
| SM-16 | G1 | [*] → `open` | Tạo nhóm từ báo giá nhiều căn hoặc gom các đơn có sẵn | – | **TRỐNG** |
| SM-16 | G2 | `open` → `open` | Cọc chung | – | **TRỐNG** |
| SM-16 | G3 | `open` → `open` | Hủy một căn trong nhóm | – | **TRỐNG** |
| SM-16 | G4 | `open` → `open` | Thêm/bớt đơn khỏi nhóm | – | **TRỐNG** |
| SM-16 | G5 | `open` → `closed` | Mọi đơn trong nhóm ở trạng thái kết thúc | – | **TRỐNG** |
| SM-17 | C1 | [*] → `open` | Mở ca | – | **TRỐNG** |
| SM-17 | C2 | `open` → `closing` | Bắt đầu đóng ca | – | **TRỐNG** |
| SM-17 | C3 | `closing` → `closed` | Xác nhận đóng ca | – | **TRỐNG** |
| SM-17 | C4 | `closing` → `open` | Quay lại sửa | – | **TRỐNG** |
| SM-17 | C5 | `closed` → `closed` | MGR+ xem lại, ghi nhận chênh lệch | – | **TRỐNG** |

Tóm tắt theo máy: SM-01 22/22 · SM-02 5/5 · SM-03 11/11 · SM-04 6/6 · SM-05 13/13 · SM-06 2/9 · SM-07 2/3 · SM-08 5/5 · SM-09 7/7 · SM-10 6/6 · SM-11 3/5 · SM-12 9/9 · SM-13 2/2 · SM-14 4/4 · SM-15 5/5 · SM-16 0/5 · SM-17 0/5

## 8. Kiểm tĩnh quyền – rbac-matrix (nguồn chuẩn) ↔ OpenAPI

Nguồn chuẩn: `rbac-matrix.json (A-xx) + rbac-matrix.md (S-xx, Dxx)`. Với mỗi operation: tập vai được phép = **hợp** các dòng A-xx trong `x-rbac` (nhiều mã thường là phương án thay thế); chỉ khi không có A-xx mới lấy hợp các dòng S-xx; operation chỉ cho `guest` thì chỉ so cột GST; `x-scope: {all: own}` áp mọi vai (bản bước 5); ô `R` chỉ tính cho GET; ô `M` đòi `x-scope: own`) – so với `x-roles`. Với thuộc tính có `x-visible-to`: so với dòng Dxx mục 6 qua bảng ánh xạ của QA (`FIELD_MAP`, đến khi ARC gắn `x-rbac-field`). "OpenAPI cho thêm vai" = nguy cơ rò quyền → lỗi tài liệu **P1** (P0 nếu là C3); "OpenAPI thiếu vai" = P2. Kết quả do người xem lại trước khi mở lỗi (ô `D`, `◐`, ghi chú chân trang có thể giải thích lệch).

- Không có operation lệch.

- Không có thuộc tính lệch.

Phủ `x-rbac-field` (W2 R2): 115 thuộc tính đã gắn mã Dxx; thiếu mã: 0; mã Dxx lạ: 0. Bắt buộc gắn: mọi thuộc tính có `x-classification` và mọi thuộc tính có `x-visible-to` nằm trong `FIELD_MAP`. So sánh trường dùng `x-rbac-field` trước, `FIELD_MAP` chỉ là dự phòng.
