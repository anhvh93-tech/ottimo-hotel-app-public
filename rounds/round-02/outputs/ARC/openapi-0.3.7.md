# OpenAPI 0.3.7 – khởi động Sprint 4 (ARC, 17/10/2026)

- **Trạng thái**: đã áp vào `product/docs/api/openapi.yaml` (`info.version: 0.3.7-draft`, mục "Thay đổi phiên bản 0.3.7-draft"). **Bổ sung D1 – đóng băng (17/10 tối)**: áp các điểm hợp đồng của critic `reviews/s4-kickoff-critic.md` #7–#12 và câu trả lời DOM (BR-402, BR-424, BR-429 (g)/(h), BR-434 S4-23 v0.3.6) – **mục 10**; mục 4 phân loại nhóm D; mục 7 viết lại theo bảng phân việc ORC 17/10. Tệp này là `s4-contract.md` ghi ở sprint-4-plan mục 8.3. **Đóng băng phần CỔNG từ cuối D1** – đổi sau đó qua ARC, báo trong ngày. **Sửa chữ đóng băng D1 (ORC 17/10 (1), critic kiểm lại)**: B-4 `updateOnlineCheckin.deferredPeople` → contract-ahead R3 (mục 4, 7; mô tả trường trong spec); ghi chú A.3 "PR migration BE-B" → PR mục A của BE-C (mục 4, 5.3; spec); mô tả `expectedVersion`/`ApprovalRequest.version` bỏ chữ "nháp", ghi CỔNG. Không đổi trường, operation, `x-*` nào. Đã sinh lại `openapi-meta.ts`, `openapi-schemas.ts`, api-client, `rbac-cases.json/.csv`. Đã cập nhật `erd.md` (mục 4.4, 4.7, 4.8, 4.9, 9.1, 9.3, 15), `architecture.md` (J8, J11) và ADR-005 (gửi trễ 10 giây). **Chưa commit** – ORC commit.
- **Không đổi**: đường dẫn cũ, tên trường cũ. Thêm 3 operation (`previewMoveReservation`, `listInspections`, `getGuestSession`) – 192 operation. Bổ sung D1 không thêm operation; `getGuestSession` gắn `x-round: R3` (contract-ahead).
- **Nguồn**: `rounds/round-02/s4-carryover.md` (S4-09, 10, 21, 32, 39, 40, 44, 47, 48), `qa/bug-list.md` (BUG-R2-038, 085), `reviews/s3-SEC.md` (mục 4 b, 7, 9.3–9.6), `outputs/ARC/s3-contract.md` (7.5, 7.7, B-33), `outputs/ARC/s2-contract.md` (nhóm B), `outputs/ARC/openapi-0.3.7-draft.md`, BA `specs/EP07-08…`, `EP01…`, `EP14…`, BR-429 v0.3.5 (DOM 17/10), backlog US-024 AC5–AC7 (PO 17/10), ESC-019/020/021 (INV 17/10), decision-log 17/10.
- **Nhãn**: [ARC] = quyết định kỹ thuật của ARC; [GIẢ ĐỊNH …] = chờ vai ghi trong ngoặc xác nhận, đội vẫn làm theo.

---

## 1. Kiểm tra đã chạy (trên tệp thật, 17/10 – chạy lại sau bổ sung D1 và sau sửa chữ đóng băng D1)

| Kiểm tra | Kết quả |
|---|---|
| `openapi-spec-validator` 0.7.2 (`openapi.yaml`, `openapi.test.yaml`) | OK / OK |
| Redocly CLI 1.34.21 `lint` (job `contract-lint`) | Hợp lệ, 0 lỗi, 4 cảnh báo – đúng 4 cảnh báo có từ trước (server `example.invalid`, 3 operation không có 4xx); 0 cảnh báo mới |
| `check-no-test-surface.sh spec` | OK |
| `gen-openapi-meta.mjs --check` | up to date (sửa chữ đóng băng chỉ đổi mô tả – meta không đổi) |
| api-client `gen.mjs` | sinh lại sau sửa chữ đóng băng (JSDoc `deferredPeople`, `expectedVersion`, `ApprovalRequest.version`), chạy lại = up to date; test drift xanh |
| `gen_rbac_cases.py --check` | OK – 192 operation, 2.112 ca, R3 286 (275 + 11 ca `getGuestSession` do `x-round: R3`), rbac mismatch [] – không đổi |
| `gen_traceability.py --strict` (ghi ra tệp tạm như CI) | **exit 0**: AC 254/254 chạy được ở R2; RBAC 0 operation lệch, 0 thuộc tính lệch, x-rbac-field 153 gắn, 0 thiếu. So với `docs/qa/traceability.md` chỉ lệch ô ERD dòng US-136 (thiếu `4.12`) đã biết – QA sinh lại (việc sửa chữ (3)); sửa chữ của ARC không thêm lệch |
| vitest `services/api` `contract.test.ts` + `serializer.test.ts` + `module-boundaries.test.ts`; `packages/api-client` | 23/23; 18/18. `module-boundaries` kiểm tập đóng `AuditEvent.action` = `money-actions.ts` (đã thêm 4 mã FOC cùng lúc) |
| `tsc --noEmit` api-client, admin-web, guest-web, mobile, api | 0 lỗi |
| prettier (`openapi.yaml`, `openapi.ts`, `openapi-meta.ts`, `openapi-schemas.ts`) | xanh |

Không chạy bộ test tích hợp cần PostgreSQL (không đụng stack demo). D1 không đổi `securityParameters`, `ifMatch`, `dryRun` của operation nào (meta chỉ đổi enum/mô tả/x-scope `listApprovalRequests`, `x-round` `getGuestSession`). Sửa chữ đóng băng D1 chỉ đổi chữ mô tả/chú thích trong spec, không đổi meta, `rbac-cases` hay kiểu TypeScript.

---

## 2. Nhóm S – việc Sprint 4 do ORC giao (mục a–g)

### S-1 (a) BUG-R2-038 – thu tiền ngay ở bước nhận phòng (thiết kế đã chốt ở s3-contract 7.7)
- `checkIn.payment` (`PaymentCreate`, chỉ `type = charge`; lỗi trường có tiền tố `payment.`), cùng quy tắc với `checkOut.finalPayment`.
- **Thứ tự trong giao dịch B9**: kiểm `SURCHARGE_CHANGED` → ghi phụ thu nhận sớm / đêm B9a → ghi `payment` → **mới** xét `balance_paid`. Chưa đạt → 409 `CHECKIN_CONDITIONS_NOT_MET`, không ghi gì (kể cả khoản thu).
- `CheckInPreview.balanceDueVnd` + `amountDueAtCheckinVnd` (= còn phải thu + phụ thu sẽ ghi + đêm B9a). Đây là trần của `checkIn.payment` (vượt → 422 `AMOUNT_EXCEEDS_BALANCE` kèm `max`) và của VietQR ngày đến.
- `createVietQr.purpose` thêm `check_in` (gửi kèm `checkinTime`/`addPriorNight`/`priorNightRateVnd` để server tính đúng trần, không cần `overBalanceReason`). VietQR được xác nhận trước B9 làm folio tạm có `creditVnd` > 0 – không phải trả thừa thật.
- ~~Giả định ARC~~ → **BR-402 v0.3.6 (DOM 17/10)**: FOC **chờ duyệt trên khoản phát sinh** (phụ thu nhận sớm, phụ thu người, khoản đã xin trước) không phải thu để nhận phòng – mỗi yêu cầu trừ min(số xin, dòng); tiền phòng gồm đêm B9a vẫn thu đủ. `amountDueAtCheckinVnd` trừ đúng phần này. Oracle BR-402-01.
- Vì sao: BA EP03-05 1.3 + DOM G-7 ("thu ngay, không bỏ qua"); không để phụ thu dồn tới B18.

### S-2 (b) S4-39 / SEC-G1 (b) / BUG-R2-085 – giấy tờ chờ gắn người
| Thay đổi | Chi tiết |
|---|---|
| `GuestDocumentLink` (schema mới) | `updateGuestDocument` nhận thân `oneOf`: `GuestDocumentInput` (như cũ) **hoặc** `GuestDocumentLink {partyMemberId}` (`additionalProperties: false`). Gắn người **không** đọc/gửi lại C3 (SEC 9.6 e (2)). Vẫn ghi 1 dòng `c3_access_log update`. Người đã có giấy tờ → 409 `PARTY_DUPLICATE`; giấy tờ đã gắn người khác → 409 `INVALID_TRANSITION`; người không còn trong đoàn → 422 `NOT_IN_LIST` |
| 409 `DOCUMENT_UNCLAIMED_EXISTS` (mã mới) | `addGuestDocument` trùng số với giấy tờ **đang chờ gắn** → kèm `documentId`, `personIndex` – Desk mở đúng giấy tờ (hết lỗi "mở nhầm khi ≥ 2 giấy tờ chờ") |
| 409 `PARTY_DUPLICATE` | Khai báo ở `addGuestDocument`/`updateGuestDocument`; sửa mô tả mã (trước ghi "chỉ `addPartyMember`") và dòng `DUPLICATE_GUEST` |
| `REGISTRATION_INCOMPLETE` | Mô tả thêm K6 `mark-sent` (SEC-BE-54, BE-C đã cài): số giấy tờ **được tính** < số người → 409 `errors[{field: party_count}]` + `missingCount` (Problem, mới); mô tả K5 chính xác lại |
| DTO | `GuestDocumentMasked.personIndex` (ô "Khách n"), `unclaimedUntil` (hạn chờ gắn – thay cách đoán từ `imagePurgeAt`) (S4-48) |
| `removePartyMember?guestUploadPersonIndex=` | Phương án chính SEC-BE-53: số ô ≥ 2 hoặc `none`. Bắt buộc khi người bị bỏ chưa có giấy tờ gắn **và** còn ô chưa gắn (422 `REQUIRED` + `personIndexes[]`). Ô được chọn bị hủy ngay, ô sau **dồn số**, `required_count` theo đoàn; `none` không hủy gì. Ô khác không còn hẹn xóa 24 giờ. `legal_hold`: không hủy, không log `delete` (SEC-BE-57). Query param (không dùng thân DELETE) vì chỉ là số ô, không phải dữ liệu cá nhân [ARC] |
| "Cần chú ý" | `data_quality` mang `params.check` ∈ `registration_stay_not_closed`, `registration_party_docs_unlinked` (đúng như BE-C đang phát) |
| Phương án dự phòng 0.3.6 | Chỉ còn cho đường giảm người không có lựa chọn của lễ tân (`updateReservation` giảm khách, OTA sửa đơn) [GIẢ ĐỊNH ARC – SEC xác nhận] |
| Giấy tờ lễ tân nhập chưa gắn người | Hết ở 0.3.7 nhờ hồ sơ "từ giấy tờ" (nhóm D): `addGuestDocument` luôn gắn người. Dữ liệu cũ: BE-C xử lý một lần như giấy tờ chờ |
| ERD 4.7 | `party_member_id`, `person_index` (dồn số), `removed_at`, `fields_purge_after` = hạn chờ gắn, `policy_key = party_removed`, audit `registration.documents_unclaimed` / `document_claimed` / `unclaimed_choice`, đọc người qua `RegistrationPartyPort` |

### S-3 (c) S4-47 – giờ máy chủ và đêm thêm khi trả phòng
- `CheckoutSummary.serverTime` – giờ trả mặc định của bước 2 (FE không dùng đồng hồ máy quầy).
- `CheckoutSummary.amountDueAtCheckoutVnd` – số cần thu nếu B18 chạy ngay, **gồm** phụ thu trả muộn tính lại và đêm thêm (`extraNightDefaultRateVnd`).
- `checkOut`: thứ tự đêm thêm / phụ thu tính lại → `finalPayment` → `balance_due`; trần `finalPayment` = còn phải thu **sau** các dòng đó. Tiền đêm thêm sau 18:00 thu bằng `finalPayment` (hoặc VietQR `purpose = check_out` + `confirmPaymentReceived`), không `recordPayment` trước B18.

### S-4 (d) S4-09 – "khách đồng ý, chỉ chuyển tới hết đơn gốc"
- `changeRoom.stayScope`: `whole_stay` (mặc định, như 0.3.6) | `until_parent_departure`.
- 409 `ROOM_UNAVAILABLE` do đêm đơn con kèm `parentOnlyAvailable: true` → Desk hỏi khách rồi gửi lại (cả `dryRun`).
- `ChangeRoomPreview.stayScope`, `returnToRoomDate` (đêm đầu đơn con – khách về lại căn cũ).
- Lượt không có đơn con → 422 `NOT_ALLOWED`. ~~Sinh sẵn `priority_clean`~~ → **BR-424 v0.3.6 (DOM 17/10)**: không sinh sẵn; ngày về căn cũ là căn đón khách (J8 như thường), căn mới **không** tự `VD` lúc 07:00 – lễ tân ghi khách đã chuyển về bằng `updateReservation.roomReturnRecorded = true` (đơn con; cách ghi ARC chọn – mục 10.4). Oracle BR-424-05.

### S-5 (e) S4-40 – hàng chờ chi hoàn của FD/FDL
- x-scope `listApprovalRequests`: `front_desk: own_or_refund_payout`, `front_desk_lead: within_limit_or_own_or_refund_payout` (theo đúng cách server đã cài 17/10: thêm yêu cầu `refund` `approved` chưa chi đủ; chuyển khoản hiện dạng che, chỉ OWN/MGR chi). Hết mâu thuẫn với A47a. BA cập nhật ghi chú S23. **D1**: đổi tên thành `own_or_refund_queue` / `within_limit_or_own_or_refund_queue` và mở rộng cho S4-43 (mục 10.6).

### S-6 (f) S4-44 – tìm đơn theo tên khách
- `listReservations.q` nhận thêm **tên người đứng tên** (≥ 2 ký tự, không dấu, khớp một phần, qua `guests/public` + trigram `name_search`). Tên trong query đã có tiền lệ (`searchGuests`); SĐT/email vẫn cấm.
- Thêm `roomId` (nháp B-9).

### S-7 (g) ESC-019 A – giá khi khách tự xin đổi căn trước ngày đến
- **Operation mới** `previewMoveReservation` (`GET …/reservations/{id}/move-preview?roomId&arrivalDate&departureDate&mode&reasonCode`) → `MovePreview`: từng đêm giá cũ → mới, tổng chênh (`folioDeltaVnd`), cọc đã thu, còn phải thu mới (`balanceDueAfterVnd`), chênh lệch OTA, phụ thu người, FOC đi theo, `warnings[]`. Ví dụ trong spec = ví dụ BR-429 (101 → 401: 2.001.000 → 3.126.000, cọc 600.000, còn thu 2.526.000).
- `moveReservation`: `reasonCode = guest_request` có đổi căn → giá căn mới (hai chiều; OTA: giá OTA giữ, `room_change_difference` so với căn gốc) + **bắt buộc** `applyDifference = true` ("Đã báo khách số tiền mới") và `expectedDeltaVnd` (lệch → 409 `SURCHARGE_CHANGED`). Do OTTIMO và `other` → giữ giá; `other` sang căn đắt hơn chỉ FDL+.
- `reasonCode` là trường đánh dấu "khách xin / OTTIMO đổi" (đã có từ 0.3.5) – 0.3.7 ghi rõ nhóm giá trong `MoveReasonCode`.
- Khớp BR-429 v0.3.5 (a)–(f) và US-024 AC5–AC7. Cọc không đòi bổ sung; FOC = min(số đã duyệt, giá mới); hoa hồng theo tiền phòng mới; audit `reservation.room_change_repriced` (đã có trong tập đóng).

---

## 3. Nhóm H – rà EP14 / EP07 / EP08 / EP01 (mục h)

**Kết luận rà**: 0.3.6 đã có **đủ operation** cho các story Sprint 4, nhưng phần lớn quyết định nhóm B của 0.3.5 (s2-contract B-02…B-12, B-18…B-20, B-23 – "áp ở 0.3.7", s3-contract B-33) **chưa vào spec**. 0.3.7 áp hết, thêm `listInspections` và vài trường còn thiếu.

| Story | Operation đã có (0.3.6) | Thiếu → 0.3.7 thêm |
|---|---|---|
| US-052 trạng thái buồng | `listRoomStatuses` | R5 tính khi đọc (B-03); `RoomStatusEntry.inspectionFailed` (E07-17) |
| US-053 đổi trạng thái | `transitionRoomStatus` | 422 `PERFORMED_AT_OUT_OF_RANGE` (B-02); khai 401/403/422 |
| US-054 việc hôm nay | `listHkTasks`, `createHkTask`, `transitionHkTask` | `HkTask.linenChange`, `carriedOver`, `cancelReasonCode`, `cancelNote`; `transitionHkTask.cancelReasonCode` + `cancelNote` (`cancelReason` deprecated) (B-04, B-05) |
| US-055 kiểm phòng | `getInspectionChecklist`, `recordInspection` | `?roomId=` + mục động `extra_guest_kit` + nhãn theo `Accept-Language` (B-07, B-23); 409 `CHECKLIST_OUTDATED` (B-02); `Inspection.items/photoAttachmentIds/checklistVersion/redoTaskId`; **`listInspections`** (B-07; MT chỉ xem để khớp rbac S10) |
| US-057 báo sự cố | `createWorkOrder`, `uploadAttachment` | `WorkOrderCategory` (+ `drain`, E07-17) bắt buộc, `blockRequested`; HK gửi `block` → 403 (B-09) |
| US-061 phiếu + khóa | `createWorkOrder`, `createRoomBlock` | `expectedDoneDate` (đúng một trong hai với `endDatePlanned`), `RoomBlock.expectedDoneDate` (B-10) |
| US-062 cập nhật phiếu | `updateWorkOrder`, `transitionWorkOrder` | `blockRequested`; `partsExpectedDate`, `resultNote` bắt buộc, ảnh theo `wo_done_photo_required_severities` = `[high, medium]` (B-10, DOM D-15); `WorkOrder.history[]`, `remedySuggested`, `acceptedAt`, `doneAt` (B-11) |
| Thông báo HK/MT | `listMyNotifications`, SSE | `StaffNotification.kind` +6 (B-08), `refType` `hk_task`; `refund_ready` tiền mặt gửi thêm FD/FDL khác người tạo (S4-42) |
| US-010 KPI | `getTonightKpi` | `arrivalsCheckedIn`, `departuresCheckedOut`, định nghĩa đến/đi BR-404 (B-19); S1b → S1c (B-18) |
| US-011, US-031 đến/đi | `getArrivalsDepartures` | `allowedActions` mỗi dòng (`check_in`/`check_out`), `date` ±7 → 422 `VALUE_OUT_OF_RANGE` (B-20) |
| US-012 Cần chú ý | `listAttentionItems`, `resolveAttentionEvent` | Đủ `kind` (0.3.6 B-21); ghi rõ `data_quality.params.check`, `ooo_ending_work_open` 12:00 (B-12, DOM D-12 h) |
| SSE | `streamEvents` | Danh mục đủ; ghi rõ người nhận theo vai HK/MT/FD+ |
| US-106…110 app khách | `getGuestStay`, `listMyRequests`, `createGuestRequest`, `listGuestRequestOptions`, `listGuestRequests`, `transitionGuestRequest` | Đủ (B-13…B-17 ở 0.3.6). Thêm phía nhân viên `GuestRequest.feeVnd` (FD+), `declinedReasonCode`, `replyNote`, `updatedAt`; `getGuestSession` (nhóm D) |

Ghi chú bối cảnh INV 17/10:
- **Ghim Google Maps** `https://maps.app.goo.gl/…` hợp lệ với danh sách host của `GuestStay.property.mapUrl` (SEC E14-08: `maps.app.goo.gl`) – OWN nhập ở Tham số, không đổi hợp đồng.
- **ESC-020 (landing, A hết)**: v1 tĩnh, không form, không gọi API → không đổi OpenAPI ở Sprint 4 (form v2 – US-155, R3 – cần operation công khai mới, ARC làm khi PO kéo vào).
- **ESC-021 (Zalo OA, A)**: chat trên OA Manager, tin tự động R3 → không đổi OpenAPI ở Sprint 4.
- **Tên miền/VPS (Mắt Bão, hẹn thứ Hai 19/10)**: `servers[1]` vẫn `https://staging.example.invalid`; OPS thay khi có tên miền (không ảnh hưởng client – proxy cùng origin).

---

## 4. Nhóm D – bản nháp 0.3.7 (17/10) đã áp – phân loại (D1, critic #2)

Quy tắc phân loại của ARC: **CỔNG** khi một mục CỔNG của Sprint 4 cần nó, client đã gửi/đọc nó mà server thiếu sẽ vỡ, hoặc là đổi hành vi gây vỡ; còn lại **contract-ahead – cài ở R3**: trường/operation đã có trong hợp đồng, server chưa phải trả, client không được dựa vào. QC **không** tính mục contract-ahead là lệch hợp đồng; QA không viết ca cho chúng ở Sprint 4 (operation có `x-round: R3` → `rbac-cases` gắn `sprint: R3`).

| Mục nháp | Áp ở 0.3.7 | Phân loại | Người làm |
|---|---|---|---|
| A – hồ sơ khách "từ giấy tờ" (BUG-R2-033 b, SEC s3 mục 7; S4-11, S4-32) | `Guest.source`/`GuestSummary.source` (FD+, D10); `GuestDocumentMasked.possibleReturningGuest`; `addGuestDocument` thứ tự khớp + tạo hồ sơ tối thiểu; `updateGuest` 422 `NOT_ALLOWED`; SAL/CTV không thấy hồ sơ `document`; `Guest.idDocLast4` chỉ khi P05; ERD 4.4 | **CỔNG** | **BE-C** (theo bảng ORC – gồm migration `guest.source`, J25, `document-profile.ts`; BE-B review module guests), FE-A (nhãn "có thể là khách quen"), SEC kiểm |
| A.3 `document_profile_retention_months` (1–12, 12, OWN) | Ghi chú trong `x-security-parameters` – ARC bật cùng PR mục A của BE-C (PR thêm dòng catalogue `config_parameter_def.is_security`) | **CỔNG** (cùng PR mục A) | BE-C + ARC |
| B-2 `Reservation.availableOperations` | Có | **contract-ahead – R3** | – (FE giữ cách ẩn nút hiện tại) |
| B-3 `getGuestSession` | Operation mới, **`x-round: R3`** từ D1 | **contract-ahead – R3** | – (guest-web Sprint 4 đọc lại bằng `getGuestStay`) |
| B-4 `updateOnlineCheckin.deferredPeople` | Có (ĐK-2); mô tả ghi rõ contract-ahead | ~~CỔNG – guest-web đã gửi trường này~~ → **contract-ahead – R3** (ORC đóng băng D1 (1)): guest-web chỉ gửi `deferredPeople` ở `completeOnlineCheckin` (`CheckinFlow.tsx`), không gửi ở `updateOnlineCheckin`; server Sprint 4 bỏ qua trường này ở `updateOnlineCheckin` | – (`completeOnlineCheckin.deferredPeople` đã chạy, không đổi) |
| B-5 `ApprovalRequest.requestedById` | Có (FD+) | **contract-ahead – R3** | – (server vẫn chặn `SELF_REFUND_FORBIDDEN`) |
| B-6 khóa phiên bản khi duyệt `refund` | `ApprovalRequest.version` + `approveRequest`/`rejectRequest.expectedVersion` – bắt buộc với `refund`, lệch → 412 | **CỔNG** – đổi hành vi gây vỡ | **BE-B + FE-A cùng một PR** (không gộp phần BE trước) |
| B-7 `BookingRules.lateCheckout` | Có | **contract-ahead – R3** | – |
| B-8 `MinibarCheck.checkedByName` | Có (FD+, D27) | **contract-ahead – R3** | – (Desk đã có fallback) |
| B-9 `listReservations?roomId=` | Có | **contract-ahead – R3** | – (BE-A làm cùng S4-44 nếu còn chỗ – NÊN) |
| B-10 mã còn thiếu (`recordPayment`, `reversePayment`) | Chỉ khai mã server đã trả | **CỔNG** (không phải cài – chỉ test) | BE-B kiểm test có sẵn, QA |
| B-11 `Payment.receivedAmountVnd` (FD+), `selfReconciled` (MGR+) | Có | **contract-ahead – R3** | – |
| B-12 `getBill?locale=vi\|vi_en` | Có | **contract-ahead – R3** | – (server tự chọn ngôn ngữ như hiện nay) |
| B-13 tách `overpayment_retained` | Không đổi hợp đồng – DATA quyết | – | DATA |
| B-14 `room_status` sang module housekeeping | Nội bộ, không đổi hợp đồng | **CỔNG** (nền của nhóm H) | **BE-C** (trước ghi BE-A) |

---

## 5. Quyết định kỹ thuật của ARC (đã ghi decision-log)
1. **Xem trước đổi căn = operation GET riêng** (`previewMoveReservation`), không thêm `dryRun` vào `moveReservation`: meta sinh từ spec bật đường `dryRun` (bỏ `Idempotency-Key`/`If-Match`) ngay khi sinh lại, trước khi BE cài – trái nguyên tắc fail-closed SEC-BE-21. GET chỉ đọc, không có rủi ro này.
2. **Khóa phiên bản duyệt hoàn tiền = `expectedVersion` trong thân**, không phải header `If-Match`: guard dùng chung bật `If-Match` cho **cả** operation theo meta, nên khai header sẽ bắt buộc với mọi loại yêu cầu (vỡ luồng duyệt FOC đang chạy).
3. **`document_profile_retention_months`**: biên chốt trong spec (chú thích), bật vào `x-security-parameters` cùng PR mục A của **BE-C** (PR thêm dòng catalogue `config_parameter_def.is_security`) để không đỏ test kiến trúc giữa chừng. (Trước ghi "PR migration BE-B" – sửa khi đóng băng D1; mục A thuộc BE-C theo bảng ORC.)
4. **`guestUploadPersonIndex` là query param** (`integer ≥ 2 | none`), không thân DELETE.
5. **`listInspections` cho MT chỉ xem** – khớp rbac S10 (MT = R), để `gen_rbac_cases --check` không lệch.
6. **`WorkOrderCreate.category` bắt buộc** – BA đặc tả "B"; `createWorkOrder` chưa có client/BE nào cài nên không vỡ gì.
7. **(D1) Một hàm tính cho xem trước và lệnh ghi** (B7, B14) – module reservations sở hữu; module folio chỉ ghi đúng dòng hàm trả. Lý do: 409 `SURCHARGE_CHANGED` lặp lại khi hai nhánh tính lệch (critic #10, S4-04).
8. **(D1) `roomNo` phía khách deprecated, server không trả** thay vì xóa khỏi schema – tránh vỡ kiểu guest-web; xóa hẳn ở 0.4.
9. **(D1) Snapshot tên phòng khi chốt ở `folio.settled_room_names`**, không UPDATE `folio_line.label_params` – giữ `folio_line` chỉ-thêm (GRANT UPDATE chỉ `line_state`, `approval_request_id`).
10. **(D1) Desk ghép tên phòng từ `listRooms`; chỉ trả `roomName` ở phản hồi cho HK/MT và phản hồi dùng để báo khách** – ít việc BE nhất mà vẫn đủ cho BR-012.
11. **(D1) x-scope đổi tên `…refund_queue`** cho đúng nghĩa mới (S4-43); server không đọc chuỗi này nên không vỡ, chỉ `rbac-cases` sinh lại.
12. **(D1) Contract-ahead đánh dấu bằng `x-round: R3` cho operation** (`getGuestSession`) để `rbac-cases` tự gắn `sprint: R3`; trường contract-ahead liệt kê ở mục 4.
13. **(D1) Ghi khách chuyển về căn cũ = `ReservationPatch.roomReturnRecorded`** (tick một chiều như `doorAccessHandedOver`) – không thêm operation (BR-424 v0.3.6 để ARC chọn cách ghi).
14. **(D1) S4-35: giá đêm sửa tay ghi vào `stay_night.calendar_rate_vnd`** (đã có), không thêm cột – khớp BR-429 (g) "giá sửa tay là giá lịch của đêm, bậc BR-107 áp trên đó".
15. **(D1) Đồng bộ `money-actions.ts` cùng lúc với tập đóng `AuditEvent.action`** – thêm mã cho phép không đổi hành vi, giữ `module-boundaries.test.ts` xanh.

---

## 6. Đổi hành vi – bên gọi phải sửa cùng lúc

| # | Operation | Trước | Từ 0.3.7 | Ai sửa cùng |
|---|---|---|---|---|
| 1 | `checkIn` | `balance_paid` chỉ xét số dư hiện tại (BUG-R2-038) | Xét sau phụ thu/đêm B9a + `payment`, trừ FOC chờ duyệt trên khoản phát sinh (BR-402 v0.3.6); thiếu tiền → 409, không ghi gì | BE-A + FE-A (bước thu ở H13) – QA bỏ `test.fail` TC-L3-011 |
| 2 | `moveReservation` lý do `guest_request` đổi căn | Giữ giá đã chốt | Giá căn mới + bắt buộc `applyDifference`/`expectedDeltaVnd`; một hàm tính với xem trước | BE-A (BE-B review phần ghi dòng/FOC) + FE-A (hộp tính thử) |
| 3 | `removePartyMember` | Hẹn xóa 24 giờ mọi giấy tờ chưa gắn | Bắt buộc `guestUploadPersonIndex` khi có ô chưa gắn; hủy đúng ô | BE-C + FE-A/UXD (hộp chọn ô) |
| 4 | `addGuestDocument` trùng giấy tờ chờ | 409 `PARTY_DUPLICATE` không id | 409 `DOCUMENT_UNCLAIMED_EXISTS` + `documentId` | BE-C + FE-A |
| 5 | `addGuestDocument` không khớp người | Giấy tờ không gắn ai | Tạo hồ sơ "từ giấy tờ" + người đi cùng | BE-C (BE-B review module guests) |
| 6 | `approveRequest`/`rejectRequest` loại `refund` | Không khóa phiên bản | Bắt buộc `expectedVersion` | **BE-B + FE-A – cùng một PR** |
| 7 | `transitionHkTask` `cancel`, `transitionWorkOrder` `complete`, `createWorkOrder` | Chưa cài | `cancelReasonCode`; `resultNote` + ảnh; `category` bắt buộc | BE-C + MOB/FE-B – chưa có client cũ |
| 8 | `getGuestStay`, `getGuestSession` (D1) | Trả `roomNo` | `roomNo` deprecated, server **không trả**; trả `roomName`/`publicRoomType` (BR-012) | BE-D + MOB (G3) cùng bản – guest-web hiện đang ẩn khi vắng nên không vỡ |
| 9 | `cancelReservation`, `markNoShow` (D1) | Dòng dịch vụ giữ nguyên | Dòng dịch vụ **tự đảo**, trừ `retainLines`; tiền dư → yêu cầu hoàn tự tạo | BE-B + FE-A (hộp hủy, hộp no-show) |
| 10 | `moveReservation` `inventory_optimize` (D1) | Luôn được | 422 `NOT_IN_LIST` khi `roomDisclosedToGuest = true` | BE-A + FE-A (ẩn lý do khi đã báo căn) |
| 11 | `listApprovalRequests` FD/FDL (D1) | Phạm vi `…refund_payout` | Đổi tên `…refund_queue`, thêm khoản hoàn chưa có nơi nhận (NÊN) | BE-B + FE-A; QA dùng `rbac-cases` mới |
| 12 | `adjustFolioLine` dòng `room`/`extra_person` (D1) | 422 `NOT_ALLOWED` tạm | Sửa được qua `StayNightPricingPort.setNightRate`; `newQuantity`/`voidLine` dòng đêm → 422 | BE-A (cổng) + BE-B + FE-A (S4-27) |
| 13 | `getBill` / bản in bill (D1) | In `roomNo` | In `roomName` (chụp khi chốt); `roomNo` deprecated | BE-B + FE-A |
| 14 | Tập đóng audit tiền (D1) | 49 mã | +4 mã `folio.foc_*` | BE-B (server list đã đồng bộ – `money-actions.ts`); FE câu `mlog.a_*` (mã lạ → `mlog.a_other`) |

---

## 7. Bảng việc theo vai (Sprint 4) – khớp bảng phân việc ORC 17/10 (decision-log, một bảng duy nhất)

Thay bản trước (BE-A ôm nhóm H + EP01 – critic #1). Nhóm H → **BE-C**; EP01 đọc + SSE + EP14 → **BE-D**; `expectedVersion` → **BE-B + FE-A cùng PR**; S4-26/29/30 → **FE-B**. Mốc kiểm của ORC: D3 S4-07/05/02/18 xong mã; D5 M1 xong mã; D7 báo cáo S4-38; D8 G1 chưa xanh → cổng lùi sang tuần Ổn định.

| Vai | CỔNG (Sprint 4) | NÊN | Đã chuyển đi |
|---|---|---|---|
| **BE-A** (lỗi tiền phía đơn) | S4-07 phụ thu người khi đổi căn; S4-05 chênh lệch OTA; S-7/S4-21 `previewMoveReservation` + giá theo `reasonCode` + **một hàm tính** dùng chung `moveReservation` và `changeRoom` `dryRun` (S4-04, nay CỔNG – mục 10.4), `returningGuestDiscountPct`, `pendingFocVnd`, `MovePreview.roomName`, `pricingBasis = external_contract`; M4 = S-1/S4-10 `checkIn.payment` + thứ tự B9 + `amountDueAtCheckinVnd` (BR-402 v0.3.6); `roomDisclosedToGuest` (cột, mốc đặt `true`, PATCH, chặn `inventory_optimize`); S4-35 phần A: cổng `StayNightPricingPort.setNightRate` (ghi `calendar_rate_vnd`); `touchLastStay` ở B18/B16 (nhóm A) | S-3/S4-47 `serverTime`, `amountDueAtCheckoutVnd`; S-4/S4-09 `stayScope` + `roomReturnRecorded`; S-6/S4-44 `q` theo tên khách + số căn/tên phòng (BR-012 (2)) + B-9 `roomId`; BUG-078; gợi ý `suggestedRateVnd`/`MANUAL_RATE_REPRICED` (BR-429 (g)) | Nhóm H → BE-C; `getTonightKpi`, `getArrivalsDepartures`, "Cần chú ý", SSE → BE-D; `expectedVersion` → BE-B; `removePartyMember` (S4-39) → BE-C; `availableOperations`, `requestedById`, `lateCheckout` → R3 |
| **BE-B** (FOC/thu/hoàn) | S4-02 + S4-18 + S4-34 (khóa FOC, ngủ/khôi phục, chờ duyệt đi theo dòng, thứ tự nhiều khoản S4-23): `ApprovalRequest.effectiveAmountVnd`/`focState`/`focCancelReason`/`lineChangedNote`/`autoCancelReason`, cột `approval_request.*` (erd 4.6), audit `folio.foc_cancelled/dormant/suspended/restored`, thông báo `approval_cancelled`, hạn mức chỉ FOC còn sống; S4-22 (tạm dừng/khôi phục khi no-show); S4-01/03; S4-06 (`refundRequestVnd`, mục `closed_reservation_credit`); S4-08 (`serviceLines`, `retainLines` ở hủy và no-show); S4-35 phần B (`adjustFolioLine` gọi cổng, bỏ 422 tạm); BR-012 phía folio (`labelParams` = tên phòng, `folio.settled_room_names`, `Bill.roomName`); **#6 `expectedVersion` – cùng PR với FE-A**; B-10; trần `payment`/`finalPayment`, `createVietQr purpose=check_in/check_out`; ghi lại dòng của S-7 **theo đúng số hàm tính BE-A trả** (không tính lại); S4-28 phía API; S4-13 | S4-42 `refund_ready` FD/FDL; S4-43 phạm vi `…refund_queue` phần (b) | S4-11/S4-32 (nhóm A) → BE-C (BE-B review module guests); B-8, B-11, B-12 → R3 |
| **BE-C** (buồng phòng/bảo trì + giấy tờ) | Nhóm H (mục 3): trạng thái buồng (B-02, B-03, `inspectionFailed`), việc HK (B-04, B-05), kiểm phòng + `listInspections` (B-07, B-23), phiếu sửa (B-09…B-11), khối OOO `expectedDoneDate`, J8/J11, thông báo HK/MT (B-08), B-14; `roomName` trên `RoomStatusEntry`/`HkTask`/`WorkOrder` (BR-012); `Room.publicRoomType` + cột `room.public_room_type` + seed BL 4.1 (S4-52); S-2/S4-39 (gồm route `removePartyMember` – BE-A review module reservations), S4-48; nhóm A + A.3 (S4-11, S4-32); S4-17 (đóng bằng test cục bộ) | S4-12, S4-46; US-058 phía server | B-4 `updateOnlineCheckin.deferredPeople` → R3 (ORC đóng băng D1) |
| **BE-D** (mới – EP01 đọc + SSE + EP14) | `getTonightKpi` (B-18, B-19); `getArrivalsDepartures` (B-20); `listAttentionItems` – gom nguồn US-012 (`data_quality.params.check`, `ooo_ending_work_open`, `closed_reservation_credit` do BE-B phát, **`ota_no_show_report`**); US-136 AC1/AC2/AC4: `no_show_call`/`no_show_mark`, mục `ota_no_show_report` + thông báo `no_show_marked`/`no_show_restored` phát trong giao dịch B11/B12 qua cổng sự kiện (BE-A review); SSE `streamEvents` người nhận theo vai; S4-31; EP14: `getGuestStay` `roomName`/`publicRoomType`, bỏ `roomNo` (BR-012), ghim bản đồ S4-51, US-109/110 (`GuestRequest.roomName`, `feeVnd`, `declinedReasonCode`, `replyNote`, `updatedAt`; nhắc BR-811) | – | – |
| **FE-A** (Desk tiền) | S4-28; S4-25 (sau S4-34); S4-27 (sau S4-35 – giá đêm trước bậc giảm); S4-21 UI (hộp tính thử: `MovePreview` đủ trường mới, ô "Đã báo khách"); S4-10 H13; S4-08 UI (danh sách `serviceLines`, chọn giữ + lý do ở hộp hủy và hộp no-show); hàng chờ FOC hiện `lineChangedNote`/`effectiveAmountVnd`/`focState`; **#6 `expectedVersion` cùng PR BE-B**; S4-39 FE (hộp chọn ô, `GuestDocumentLink`, mở theo `documentId`, nhãn `unclaimedUntil`); nhãn "có thể là khách quen"; bản in bill dùng `Bill.roomName` (BR-012); BUG-076, 080 | S4-09 lựa chọn "chỉ chuyển tới hết đơn gốc" + nút ghi khách chuyển về; S4-44; S4-47; S4-43 nhập nơi nhận từ hàng chờ; S4-50b/c | S4-26, S4-29, S4-30 → FE-B |
| **FE-B** (Desk vận hành + EP01 + brand) | B0 + B1 **cùng một build** (token v0.4/v0.4.1 + JetBrains Mono tự host); helper `roomLabel()` "401 · The Pine" + ô tìm căn theo tên (lọc client trên `listRooms`); H04 nhập `name`/`publicRoomType` (S4-52); Tổng quan/Hôm nay (`TonightKpi`, `ArrivalsDepartures.allowedActions`, "Cần chú ý" gồm `ota_no_show_report` – nút "Đã báo kênh" = `resolveAttentionEvent`, `closed_reservation_credit`), SSE; S4-31; form OOO + phiếu sửa Desk; hàng yêu cầu khách (US-110); chuông thông báo hiện 3 loại mới; nút "Đã báo căn cho khách" (`roomDisclosedToGuest`); S4-26, S4-29, S4-30 (+081) | US-137, US-013, `swapRoom` | – |
| **FE-LP** | Landing tĩnh – không đổi hợp đồng | – | – |
| **MOB** | PWA H19–H22 theo nhóm H (`PERFORMED_AT_OUT_OF_RANGE`, `CHECKLIST_OUTDATED`, `currentState`, gửi trễ 10 giây – ADR-005), thẻ việc/phiếu/buồng hiện "401 · The Pine" từ `roomName`; guest-web: `roomName`/`publicRoomType` thay `roomNo` (G3), brand B4, B0 + B1 cùng build | US-058 | `getGuestSession` → R3 (dùng `getGuestStay` khi tải lại); `updateOnlineCheckin.deferredPeople` → R3 (giữ cách gửi ở `completeOnlineCheckin`) |
| **QA** | Ca: BR-434-06/09 + BR-429 (101 → 401) xem trước rồi lưu – không 409; S4-04 `changeRoom` thử rồi lưu; S4-08 giữ/đảo dịch vụ (hủy + no-show); S4-06 tiền dư + mục chú ý; `focState` qua đủ 4 trạng thái + 4 mã audit; `approval_cancelled`; US-136 AC2/AC4/AC5 (`ota_no_show_report` report/revoke, 2 thông báo); BR-012 (khách không nhận `roomNo` ở `getGuestStay`/`getGuestSession`, bill không in số căn, HK/MT thấy `roomName`); S4-39; nhóm H; RBAC theo `rbac-cases` mới (`…refund_queue`, `getGuestSession` R3) | – | Không viết ca cho mục contract-ahead |
| **BA** | rbac S23 đổi tên phạm vi `own_or_refund_queue`/`within_limit_or_own_or_refund_queue` + điểm (b) S4-43; EP02 B7 (một hàm tính, `external_contract`); EP14 (`roomName`); EP01 bảng 3.1 thêm `ota_no_show_report`, `closed_reservation_credit` | – | – |
| **UXD** | Chuỗi: "Dòng đã đổi: {old} → {new}, khi duyệt sẽ áp {x}"; nhãn `focState` (đang áp / đang ngủ / tạm dừng / đã hủy); `notif.approval_cancelled`, `notif.no_show_marked`, `notif.no_show_restored`; `attn.ota_no_show_report` (report/revoke), `attn.closed_reservation_credit`; `mlog.a_folio_foc_cancelled/dormant/suspended/restored`; hộp hủy/no-show: dịch vụ giữ/đảo + lý do; cảnh báo `MANUAL_RATE_REPRICED`; "Đã báo căn cho khách"; "Khách đã chuyển về căn cũ"; "Giá theo HĐ giấy" | – | – |
| **SEC** | Xác nhận: `roomName` trên trang khách có token (BR-012 cho phép) không chung khối với mã cửa; FD/FDL thấy nơi nhận **đã che** của khoản hoàn người khác tạo (S4-43); S4-32; S4-39 | – | `getGuestSession` (ĐK-2) dời R3 |
| **DOM** | Xác nhận mốc đặt `roomDisclosedToGuest = true` và danh sách loại dòng dịch vụ + định nghĩa `performed` của S4-08 (mục 8) | – | – |
| **OPS** | Thay `servers[1]` khi có tên miền [GIẢ ĐỊNH – xác nhận khi INV mua xong 19/10] | – | – |

---

## 8. Giả định dùng trong 0.3.7
- ~~[GIẢ ĐỊNH ARC – DOM] FOC chờ duyệt và `balance_paid`~~ → **đã chốt** BR-402 v0.3.6 (DOM 17/10).
- ~~[GIẢ ĐỊNH ARC – DOM] `until_parent_departure` sinh sẵn `priority_clean`~~ → **đã chốt khác** BR-424 v0.3.6: không sinh sẵn; cách ghi khách chuyển về = `ReservationPatch.roomReturnRecorded` [ARC].
- [GIẢ ĐỊNH ARC – SEC xác nhận] Hẹn xóa 24 giờ + "Cần chú ý" chỉ còn cho đường giảm người không có lựa chọn của lễ tân.
- [GIẢ ĐỊNH ARC – SEC chốt ở S4-32] `guest.id_doc_last4` cùng điều kiện ghi với `id_doc_hmac` (chỉ khi P05).
- [GIẢ ĐỊNH SEC – chờ luật sư, ESC-001] `document_profile_retention_months` = 12 (biên 1–12).
- [GIẢ ĐỊNH ARC – DOM xác nhận] (D1) `roomDisclosedToGuest = true` khi: tạo đơn Trực tiếp/CTV, đơn OTA căn ánh xạ từng căn, B7 `guest_request` sang căn khách chọn, lễ tân bật, B9; `false` cho đơn OTA tự gán theo nhóm và đơn xung đột vừa gán. Đổi mốc = đổi logic server, không đổi trường.
- [GIẢ ĐỊNH ARC – DOM xác nhận] (D1) "Dòng dịch vụ" của S4-08 = `early_checkin`, `late_checkout`, `minibar`, `fnb`, `laundry`, `cleaning`, `service_fee`, `utilities`; `performed` = ngày dịch vụ < ngày nghiệp vụ lúc hủy hoặc dòng đã đánh dấu đã dùng – chỉ là gợi ý, lễ tân quyết giữ.
- [GIẢ ĐỊNH – chờ bảng ghép INV 19/10] (D1) `publicRoomType` là chữ tự do EN (4 hạng e-brochure), không phải enum – đổi hạng chỉ sửa cấu hình căn.
- Tên miền staging: chưa có (INV hẹn 19/10) – giữ `example.invalid` [GIẢ ĐỊNH – xác nhận 19/10].

## 9. Còn mở / chưa làm
- Migration cho cột mới (không thuộc ARC): `room.public_room_type` (BE-C), `reservation.room_disclosed_to_guest` (BE-A), `folio.settled_room_names`, `approval_request.foc_state`/`foc_cancel_reason`/`line_change`/`auto_cancel_reason` (BE-B). ERD đã ghi (mục 4.1, 4.5, 4.6, `attention_event`).
- UXD chưa có chuỗi cho các mã/loại mới (danh sách ở mục 7); FE dùng câu chung (`mlog.a_other`, câu chú ý chung) tới khi có.
- BA cập nhật rbac S23 theo tên phạm vi mới; `rbac-matrix.json` chưa có `operationIds` cho 3 operation mới (không bắt buộc).
- Chưa chạy test tích hợp cần PostgreSQL (D1 chỉ đổi mô tả/enum/trường mới, không đổi guard `ifMatch`/`dryRun`/`securityParameters`).

---

## 10. Bổ sung D1 – đóng băng (critic `reviews/s4-kickoff-critic.md` #7–#12, câu trả lời DOM 17/10)

### 10.1 (#7) BR-012 – tên phòng hiển thị (S4-49, S4-52 – CỔNG)
| Điểm critic | Hợp đồng |
|---|---|
| `Room.publicRoomType` | Thêm vào `Room`, `RoomInput`, `RoomPatch` (chữ EN ≤ 60, `null` = chưa nhập); mô tả `Room.name` (khách chỉ thấy tên, nhân viên "số · tên", quy tắc tìm) |
| `GuestStay.roomName` + `publicRoomType`, ẩn `roomNo` với khách | `GuestStay`, `GuestSession`: thêm `roomName`, `publicRoomType`; `roomNo` **deprecated – server không trả** (giữ trong schema tới 0.4 để không vỡ kiểu). `roomName = null` khi đơn chưa báo căn → guest-web hiện hạng phòng |
| `roomName` trên `RoomStatusEntry`, `HkTask`, `WorkOrder`, `MovePreview` | Có, thêm cả `GuestRequest` (PWA thấy yêu cầu khách định tuyến tới HK/MT). Quy ước [ARC]: operation mà vai không gọi được `listRooms` (HK/MT) hoặc phản hồi dùng để báo khách trả `roomName`; Desk (FD+) ghép tên từ `listRooms` (≤ 10 căn) |
| `labelParams.room` = tên, snapshot khi `settled` | `room`/`from`/`to` = tên phòng ở mọi phản hồi (một chuỗi bill); folio `open` điền lúc đọc (BR-012 (5)); khi chốt server chụp `folio.settled_room_names` trong giao dịch chốt – **không** UPDATE `folio_line` (giữ chỉ-thêm, GRANT cột không đổi). `Bill.roomName` cùng nguồn; `Bill.roomNo` deprecated (không in); `GuestFolio.lines.description` ghi tên |
| Cờ `roomDisclosedToGuest` | `Reservation.roomDisclosedToGuest` (FD+), `ReservationPatch.roomDisclosedToGuest` (chỉ `true`); `inventory_optimize` chỉ khi `false` → 422 `NOT_IN_LIST` |
| Tìm căn theo tên | `listReservations.q` nhận số căn/tên phòng (cài cùng S4-44 – NÊN); ô chọn/tìm căn lọc ở client trên `roomNo` + `roomName` (CỔNG cùng S4-49, không cần server) |

### 10.2 (#8) FOC v0.3.5 (S4-02, S4-18, S4-22 – CỔNG)
- `AuditEvent.action` (tập đóng) thêm `folio.foc_cancelled` (bắt buộc theo BR-433), `folio.foc_dormant`, `folio.foc_suspended`, `folio.foc_restored` – cần vì hạn mức tháng đổi theo từng chuyển trạng thái, nhật ký tiền phải giải thích được. `money-actions.ts` đã đồng bộ để `module-boundaries.test.ts` xanh. Yêu cầu chờ duyệt tự hủy dùng `approval.cancelled` (đã có).
- `ApprovalRequest`: `effectiveAmountVnd` (pending: "khi duyệt sẽ áp X"; approved: số đang áp), `focState` (`applied|dormant|suspended|cancelled`), `focCancelReason`, `lineChangedNote {oldLineVnd, newLineVnd, fromServiceDate, toServiceDate, cause, changedAt}`, `autoCancelReason`; mô tả `folioLineId` (dòng hiện tại của khóa) và `amountVnd` (= "số đã duyệt"). Nhiều khoản trên một khóa theo thứ tự lúc duyệt (BR-434 S4-23 v0.3.6) – `effectiveAmountVnd` của từng khoản đã trừ phần các khoản trước.
- `StaffNotification.kind` thêm `approval_cancelled` (người gửi + người đã nhận `approval_requested`).
- ERD 4.6: cột `approval_request.foc_state`, `foc_cancel_reason`, `line_change`, `auto_cancel_reason` + CHECK; hạn mức tháng chỉ cộng yêu cầu `foc_state ∈ (applied, dormant)`.

### 10.3 (#9) S4-08 – hủy đơn với dòng dịch vụ (CỔNG)
- `CancellationQuote.serviceLines[] {lineId, category, labelKey, labelParams, serviceDate, amountVnd, performed, retained, retainReason}`, `serviceReversedVnd`, `serviceRetainedVnd`, `refundRequestVnd` (S4-06).
- `cancelReservation.retainLines[{lineId, reason}]`; mô tả `dryRun` (readOnly, không khóa, `retained` theo `retainLines`, cùng hàm tính với lần lưu) và trình tự Desk: thử → chọn giữ + lý do → thử lại → lưu với cùng `retainLines`.
- `markNoShow.retainLines` (BR-309 áp cả no-show; không có tính thử – Desk lấy dòng từ `getFolio`).

### 10.4 (#10) Xem trước = lệnh ghi (S4-21 + S4-04 – CỔNG, BE-A)
- [ARC] **Một hàm tính** trong module reservations cho `previewMoveReservation`, `moveReservation`, `changeRoom` (`dryRun` và thật); lệnh ghi chạy đúng hàm đó sau khi khóa đơn → folio, so `expectedDeltaVnd`, ghi đúng dòng hàm trả; module folio không tính lại. Ca bắt buộc: BR-434-06, BR-434-09, BR-429 (101 → 401) xem trước rồi lưu – không 409.
- `MovePreview`: `returningGuestDiscountPct` (BR-111, không cộng dồn BR-107), `nights[].pendingFocVnd` (FOC chờ duyệt đi theo – không vào `folioDeltaVnd`), `nights[].suggestedRateVnd` + cảnh báo `MANUAL_RATE_REPRICED` (BR-429 (g) – NÊN), `pricingBasis = external_contract` (BR-429 (h)), `roomName`.
- Theo DOM: `checkIn` theo BR-402 v0.3.6; `changeRoom.stayScope = until_parent_departure` theo BR-424 v0.3.6 + `ReservationPatch.roomReturnRecorded` [ARC – cách ghi khách chuyển về: một trường tick một chiều như `doorAccessHandedOver`, không thêm operation].

### 10.5 (#11) US-136 AC2/AC4 (CỔNG phần dời Sprint 4 – BE-D)
- `AttentionItem.kind` `ota_no_show_report` (`params.action` `report` khi đánh dấu no-show đơn OTA, `revoke` khi khôi phục đơn OTA đã báo; nguồn `event`; lễ tân đóng sau khi làm trên extranet). Mô tả `restoreNoShow` bỏ câu "R2 chưa lưu đã báo kênh"; FD/FDL vẫn luôn 202 với đơn OTA (D-3).
- `StaffNotification.kind` `no_show_marked`, `no_show_restored` (OWN + MGR; khôi phục không báo chính người khôi phục).

### 10.6 (#12) Các khoảng trống nhỏ
- **BR-111 trong `MovePreview`**: mục 10.4.
- **S4-43 (NÊN, BE-B)**: x-scope `listApprovalRequests` đổi tên `own_or_refund_queue` / `within_limit_or_own_or_refund_queue` = cũ + khoản hoàn `pending`/`approved` chưa có nơi nhận của mọi đơn; `setRefundDestination` ghi rõ FD/FDL nhập cho yêu cầu người khác tạo, tách nhiệm không đổi. `rbac-cases` đã sinh lại.
- **S4-06 (CỔNG, BE-B)**: kind `closed_reservation_credit` (nguồn `event`, không số tiền, tự đóng khi chi đủ/khách để lại; OWN/MGR/FDL/FD như `deposit_after_cancel`) – không dùng `deposit_after_cancel` (khác nghĩa: tiền về sau khi giữ chỗ tự hủy).
- **S4-35 (CỔNG, BE-A + BE-B)** – ghi chú ARC còn thiếu (plan 8.2 #6): bỏ 422 tạm; `adjustFolioLine` dòng `room` nhận **giá đêm trước bậc giảm**, BE-B gọi `StayNightPricingPort.setNightRate` (BE-A) trong cùng giao dịch, khóa đơn → folio, cổng ghi `stay_night.calendar_rate_vnd` (cột có sẵn – BR-429 (g): giá sửa tay là giá lịch của đêm, bậc BR-107 áp trên đó) rồi tính lại dòng; dòng `extra_person` nhận phụ thu đêm; `newQuantity`/`voidLine` dòng đêm → 422; ngoài sàn–trần BR-105 → 422 `RATE_OUT_OF_RANGE`; đồng bộ sau giữ giá sửa tay, trừ khách tự xin đổi căn (BR-429 (a), (g)).
