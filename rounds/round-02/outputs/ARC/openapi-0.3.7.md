# OpenAPI 0.3.7 – khởi động Sprint 4 (ARC, 17/10/2026)

- **Trạng thái**: đã áp vào `product/docs/api/openapi.yaml` (`info.version: 0.3.7-draft`, mục "Thay đổi phiên bản 0.3.7-draft"). **Bổ sung D1 – đóng băng (17/10 tối)**: áp các điểm hợp đồng của critic `reviews/s4-kickoff-critic.md` #7–#12 và câu trả lời DOM (BR-402, BR-424, BR-429 (g)/(h), BR-434 S4-23 v0.3.6) – **mục 10**; mục 4 phân loại nhóm D; mục 7 viết lại theo bảng phân việc ORC 17/10. Tệp này là `s4-contract.md` ghi ở sprint-4-plan mục 8.3. **Đóng băng phần CỔNG từ cuối D1** – đổi sau đó qua ARC, báo trong ngày. **Sửa chữ đóng băng D1 (ORC 17/10 (1), critic kiểm lại)**: B-4 `updateOnlineCheckin.deferredPeople` → contract-ahead R3 (mục 4, 7; mô tả trường trong spec); ghi chú A.3 "PR migration BE-B" → PR mục A của BE-C (mục 4, 5.3; spec); mô tả `expectedVersion`/`ApprovalRequest.version` bỏ chữ "nháp", ghi CỔNG. Không đổi trường, operation, `x-*` nào. Đã sinh lại `openapi-meta.ts`, `openapi-schemas.ts`, api-client, `rbac-cases.json/.csv`. Đã cập nhật `erd.md` (mục 4.4, 4.7, 4.8, 4.9, 9.1, 9.3, 15), `architecture.md` (J8, J11) và ADR-005 (gửi trễ 10 giây). **Chưa commit** – ORC commit.
- **Bổ sung 1 (17/10 tối, giữa Sprint 4 – mục 11)**: theo đề nghị các luồng BE-D (`outputs/BE/s4-be-d.md` 2.5), FE-A và FE-B (`outputs/FE/s4-report.md`). Chỉ thêm trường / khai mã / mô tả – hợp đồng đóng băng D1 không gãy; `info.version` giữ `0.3.7-draft`. Có review module `reporting` của BE-D (mục 11.4). **Chưa commit** – ORC commit.
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

---

## 11. Bổ sung 1 – giữa Sprint 4 (ARC, 17/10 tối)

- **Nguồn**: `outputs/BE/s4-be-d.md` mục 2.5 (#1–#7), `outputs/FE/s4-report.md` (FE-A mục 4 giả định `checkIn` 202; FE-B mục 5 – BUG-R2-081, `Bill.settledAt`), yêu cầu thêm của ORC (BE-D 2.5 #6: erd 4.11 theo `0058`, erd 9 `property_map_url`, `GuestRequest.roomNo` cho phép `null`; MOB `outputs/MOB/s4-report.md` mục 4 điểm 2–3: ngôn ngữ phiên khách theo P-S4-10, `Accept-Language` theo nút ngôn ngữ của PWA).
- **Nguyên tắc**: hợp đồng đã đóng băng D1 → chỉ **thêm trường tùy chọn, khai mã server đã trả, viết mô tả**. Không đổi đường dẫn, operation, `x-roles`/`x-scope`/`x-rbac`, header (`Idempotency-Key`/`If-Match`), `dryRun` → `openapi-meta.ts` và `rbac-cases` **không đổi**. `info.version` giữ `0.3.7-draft`. Hai chỗ có ảnh hưởng tới bên gọi ghi ở 11.2 (#7, #10).

### 11.1 Kiểm tra đã chạy (17/10 ~20:15, trên tệp thật, chạy lại sau mọi phần thêm của ORC – gồm phần ngôn ngữ của MOB)

**Lưu ý chạy song song**: trong lúc làm, `openapi.yaml` có thêm **0.3.7 bổ sung 2** (7 operation `website-booking-requests`/`public-site` – US-155, `x-round: R3`) của một phiên ARC khác. Mã sinh lần cuối (meta, api-client, `rbac-cases`) đã gồm cả bổ sung 2 vì `--check` so với spec hiện tại; số operation/ca dưới đây là của spec gộp. Phần riêng của bổ sung 1 không đổi meta và `rbac-cases`.

| Kiểm tra | Kết quả |
|---|---|
| `openapi-spec-validator` 0.7.2 (`openapi.yaml`, `openapi.test.yaml`) | OK / OK |
| Redocly CLI 1.34.21 `lint` | Hợp lệ, 0 lỗi, **4 cảnh báo – đúng 4 cảnh báo có từ trước** (server `example.invalid`, 3 operation không có 4xx); 0 cảnh báo mới |
| `check-no-test-surface.sh spec` | OK |
| `gen-openapi-meta.mjs` → `--check` | Sinh lại: phần bổ sung 1 không đổi `openapi-meta.ts` (đổi của meta là từ bổ sung 2); `openapi-schemas.ts` thêm `Reservation.depositNotices` (2 chỗ), `Bill.settledAt`, `GuestSession.localeChosenByGuest`. `--check` up to date |
| api-client `gen.mjs` (chạy 2 lần) | Sinh lại (bổ sung 1 chỉ thêm: `depositNotices?`, `settledAt?`, `localeChosenByGuest?`, header `Accept-Language` của `openGuestSession`/`recordInspection`, mã lỗi khai thêm của `resolveAttentionEvent`/`createDepositNotice`, `GuestRequest.roomNo: string \| null`, JSDoc); lần 2 up to date; vitest 28/28; `tsc` 0 lỗi |
| `gen_rbac_cases.py` → `--check` | Phần bổ sung 1: không đổi ca nào. Sinh lại trên spec gộp: 195 operation, 2.145 ca, R3 319, bỏ qua 12, rbac mismatch [] (thay đổi do bổ sung 2); `--check` OK |
| `gen_traceability.py --strict` (ra tệp tạm như CI) | **exit 0**; RBAC: 0 operation lệch, 0 thuộc tính lệch, 0 mã lạ; x-rbac-field 166 gắn, 0 thiếu (bổ sung 1 góp 3: `resolveAttentionEvent.note` D12c, `depositNotices[].note` D12c, `depositNotices[].createdByName` D27; phần còn lại từ bổ sung 2) |
| vitest `services/api` `contract` + `serializer` + `module-boundaries` | 26/26 |
| prettier (`openapi.yaml`, `openapi.ts`, `openapi-meta.ts`, `openapi-schemas.ts`) | xanh |
| `tsc --noEmit` mobile, guest-web | 0 lỗi |
| `tsc --noEmit` admin-web | Lần chạy cuối: 1 lỗi **không do hợp đồng** – `src/__tests__/s4-money.test.tsx:392` (FE-A, tùy chọn `exact` của `getByRole`). Lần chạy giữa chừng từng có 1 lỗi do #10 (`roomNo` nullable) ở tệp FE-B đang làm (`src/mocks/ops.ts` – gom `roomNos`), nay không còn; FE-B vẫn cần xử lý `roomNo = null` ở màn (11.5) |

Không chạy test tích hợp cần PostgreSQL (không đụng stack demo; bổ sung 1 không đổi guard).

### 11.2 Thay đổi trong `openapi.yaml`

| # | Đề nghị | Hợp đồng sau bổ sung 1 | Loại |
|---|---|---|---|
| 1 | BE-D #1 | `resolveAttentionEvent`: mô tả thứ tự kiểm + khai `401`, `403`, `409` (`INVALID_TRANSITION`, `currentState = open` – `overbooking`, `unassigned_with_free_room`, `closed_reservation_credit`), `422` (`VALIDATION_FAILED` mã trường `REASON_REQUIRED`/`TOO_LONG`; `CARD_NUMBER_DETECTED`), `428`; `note` có mô tả + `x-rbac-field: D12c`, ví dụ | Khai mã đã cài |
| 2 | BE-D #2 | `AttentionItem.params`: bảng khóa cho phép **từng `kind`** đúng `ATTENTION_PARAM_KEYS` (gồm `foc_threshold`: `check` = `foc_pct_of_room_revenue` → `pct` (vắng khi doanh thu phòng = 0), `threshold`; `check` = `foc_count_per_approver` → `count`, `max`; người duyệt chỉ qua `link` `approverId`), định dạng SEC-BE-52, người thấy từng loại; `listAttentionItems`: lọc vai ở server, thứ tự, `dueAt` của mục `event` = lúc sinh mục, khi nào có nút "Đã xử lý" | Mô tả |
| 3 | BE-D #3 | `streamEvents` + `info.description`: bảng người nhận theo loại; **SAL/CTV** chỉ `reservation.changed` đơn của mình (người tạo/người chốt) + `notification.created` của mình (SAL thêm `payment.changed` khoản mình ghi); "vai người phát chỉ cộng thêm"; thiếu người nhận → FD+ | Mô tả |
| 4 | BE-D #4 | `getArrivalsDepartures` có `description` (đơn chính, cách chọn và sắp từng danh sách); `ArrivalsDepartures.departures`: `departureDate` = **ngày đi hiệu lực**, `nights` tới ngày đi hiệu lực, `roomNo` = căn đêm cuối; `TonightKpi.departures`/`inHouse` ghi cùng nghĩa | Mô tả |
| 5 | FE-B (BUG-R2-081) | **Thêm** `Reservation.depositNotices[]` `{id, amountVnd, note, attachmentId, createdAt, updatedAt, createdByName, status}` – chi tiết 11.3 (2) | Thêm trường (tùy chọn) |
| 6 | FE-B (S4-29) | **Thêm** `Bill.settledAt` (`folio.settled_at`; `null` khi folio `open`) | Thêm trường (tùy chọn) |
| 7 | FE-A (giả định) | `checkIn`: nhánh 202 không nhận phòng, **không ghi gì** ngoài `ApprovalRequest`; gửi `payment` ở nhánh này → 422 `VALIDATION_FAILED` mã trường `NOT_ALLOWED` (`field` = `payment`); mô tả 202 + dòng `NOT_ALLOWED` ở bảng mã trường | Làm rõ – **server phải đổi** (hiện bỏ qua im lặng) |
| 8 | (ARC, đi kèm #5) | `createDepositNotice`: mô tả (chỉ đơn `hold`, tối đa một bản `open`, báo lại = cập nhật, B4 → `handled`, đọc lại ở `depositNotices`) + khai `404`/`409`/`422` server đã trả | Khai mã đã cài |
| 9 | BE-D #6 / ORC (b) | `setParameter`: khóa `property_map_url` (chỉ OWN, không phải tham số bảo mật, nguồn duy nhất của `GuestStay.property.mapUrl`, host SEC E14-08 → 422 mã trường `NOT_IN_LIST`, cột `property.map_url` chỉ dự phòng); `GuestStay.property.mapUrl`: lấy từ khóa này, kiểm host mỗi lần đọc | Mô tả |
| 10 | BE-D #6 / ORC (c) | `GuestRequest.roomNo`: `type: [string, 'null']` (vẫn `required`) – `null` khi đơn chưa có căn, **không** dùng `''` | Nới kiểu phản hồi – **bên đọc xử lý `null`** |
| 12 | ORC (MOB mục 4 điểm 2) | `GuestSession.locale` có mô tả thứ tự chọn: **khách đã chọn** (phiên trước của cùng đơn) → `preferredLocale` hồ sơ → `Accept-Language` thẻ đầu (`vi*` → vi, `ru*` → ru, còn lại/vắng → **en** – P-S4-10); **thêm** `GuestSession.localeChosenByGuest` (tùy chọn, vắng = `false`); `openGuestSession` khai header `Accept-Language` (chuỗi tự do của trình duyệt, không enum); `setGuestLocale` ghi "khách đã chọn" | Thêm trường + **đổi hành vi server** (mặc định `vi` → `en`, `ru` → `ru`) theo PO P-S4-10 |
| 13 | ORC (MOB mục 4 điểm 3) | `getInspectionChecklist`: PWA gửi `Accept-Language` theo nút ngôn ngữ của app; cùng quy tắc cho `listInspections`, `recordInspection` (khai thêm header `AcceptLanguage` ở `recordInspection` – server đã đọc) | Mô tả + khai header đã dùng |
| 11 | BE-D #7 | `createGuestRequest` 429 đã khai từ 0.3.6; `unavailableReason = outside_service_hours`/`not_offered` chưa dùng ở R2 – giữ nguyên hợp đồng, client hiện câu chung nếu gặp | Không đổi |

ERD (`erd.md`): 4.6 `deposit_notice` (đọc lại qua cổng); 4.11 `guest_request` – bảng cột/CHECK/chỉ mục/GRANT đúng migration `0058` (ORC (a)); 9.3 khóa `property_map_url` (ORC (b)); 4.1 `property.map_url` thành dự phòng; lịch sử. `architecture.md`: 5.1 quy tắc bảng thuộc module + mô hình đọc `reporting` (11.4); mục 12 người nhận SSE; lịch sử.

### 11.3 Quyết định kỹ thuật của ARC (ghi decision-log)

1. **`checkIn` nhánh 202 không thu tiền** (trả lời giả định FE-A – **xác nhận**). 202 nghĩa là chưa nhận phòng: B9 chưa chạy nên không có phụ thu/đêm B9a để tính trần, chưa xét `balance_paid`; ghi khoản thu khi đó tạo tiền "treo" trên đơn chưa nhận phòng, yêu cầu duyệt bị từ chối thì phải hoàn. Server **không được bỏ qua im lặng** (tiền lễ tân đã cầm mà không vào folio – sai tiền): `payment` ở nhánh 202 → 422 `NOT_ALLOWED`, không ghi gì, khóa idempotency không bị tiêu. Thu tiền: (a) sau khi FDL+ duyệt, FD gọi lại B9 kèm `roomNotReadyOverride.approvalRequestId` **và** `payment` (nhánh 200, trần `amountDueAtCheckinVnd`); hoặc (b) thu trước bằng `createVietQr purpose=check_in` + `confirmPaymentReceived`. FE-A đang làm đúng (không gửi `payment` ở nhánh 202).
2. **`Reservation.depositNotices[]`** – mới nhất trước; tối đa một bản `open` (SEC-BE-28 (3)), bản `handled` giữ để đối chiếu. **Thêm `updatedAt`** ngoài danh sách FE-B đề nghị: báo lại là cập nhật tại chỗ (số tiền mới) – Desk phải hiện giờ của lần báo gần nhất, không phải `createdAt`. Người thấy: mảng `x-visible-to` FD+ + SAL + CTV (SAL/CTV chỉ tới được đơn của mình qua `x-scope own` của `getReservation`); trong phần tử, `note` gắn **D12c** và `createdByName` gắn **D27**, `x-visible-to` FD+ → serializer tự bỏ với SAL/CTV (rbac mục 6: D12c, D27 = K với SAL/CTV). `amountVnd`, `attachmentId`, `status`, giờ **không** gắn D14 vì đây là số người báo khai (dữ liệu "cọc" của đơn – CTV "M (tổng tiền phòng, cọc)" ở bảng dữ liệu kinh doanh mục 6), không phải "kết quả thanh toán" (gắn D14 sẽ làm serializer bỏ với CTV). Server **bắt buộc** trả ở `getReservation`; phản hồi hành động dùng schema `Reservation` được vắng. Cách cài: bảng `deposit_notice` thuộc `payments` → dùng mẫu cổng `ReservationHooks.provideDepositNotices(reader)` như `provideRegistrationSummary` – `reservations` không đọc bảng này, `payments` không bị import vòng.
3. **`Bill.settledAt`** = `folio.settled_at` (cột có sẵn, cấp cùng `billNo`), không thêm cột. Cài cùng chỗ `Bill.roomName` (ORC D1 (3) đã chuyển phần bill BR-012 cho BE-A) để không hai luồng sửa cùng hàm dựng bill.
4. **Khóa `params` của "Cần chú ý" – hợp đồng đi trước code**: bảng ở `AttentionItem.params` là danh sách đóng; nguồn mới (BE-C: `work_order_*`, `room_status_mismatch`; J18 `channel_sync_error`) cần khóa mới thì gửi ARC ghi hợp đồng **trước** khi thêm vào `ATTENTION_PARAM_KEYS`.
5. **`GuestRequest.roomNo` = `null`** khi đơn chưa có căn (theo ORC) – `''` là giá trị giả, dễ lọt vào `roomNos`/nhãn. Vẫn `required` (luôn có khóa). Đây là nới kiểu phản hồi trong hợp đồng đóng băng: chấp nhận vì operation mới cài ở Sprint 4 (chưa có client đã phát hành), bên đọc duy nhất là Desk/PWA đang làm (11.5).
6. **`property_map_url`** là nguồn duy nhất của ghim bản đồ (khóa tham số có ngày hiệu lực, OWN sửa, audit `config`, không phải tham số bảo mật – host đã chặn bằng danh sách cho phép ở cả lúc ghi và lúc đọc); cột `property.map_url` chỉ dự phòng khi khóa vắng, bỏ ở R3 (expand → contract).
7. **Review module `reporting` – CHẤP NHẬN KÈM ĐIỀU KIỆN** (11.4).
8. **Ngôn ngữ phiên khách (P-S4-10) do server quyết, client không tự ghi đè**: lý do MOB nêu – `GuestSession.locale` luôn có giá trị nên client không thể áp "mặc định EN" sau khi có phiên. Server chọn một lần lúc mở phiên theo thứ tự: khách đã chọn (lưu `guest_session.locale_chosen_at`, áp cho phiên mới của **cùng đơn** – mở lại link, link cấp lại) → hồ sơ người đứng tên → `Accept-Language` (thẻ đầu: `vi*` → vi, `ru*` → ru, còn lại/vắng → en). Lựa chọn của khách **không** ghi vào hồ sơ khách (`guest.preferred_locale` – dữ liệu lễ tân quản lý, module `guests`). `localeChosenByGuest` chỉ để hiển thị trạng thái. Giữ `required: [locale]` – không đổi hợp đồng cũ.
9. **`Accept-Language` của nhân viên = ngôn ngữ app, không phải trình duyệt**: PWA truyền rõ qua `RequestOptions.acceptLanguage` của `@ottimo/api-client`; operation không có nhãn theo ngôn ngữ bỏ qua header.

### 11.4 Review mô hình đọc `reporting` (BE-D #5)

**Đã xem**: `src/modules/reporting/**` (bảng đọc: `reservation`, `reservation_segment`, `stay_night`, `room`, `room_block`, `checkout_confirmation`, `channel`, `guest`; `attention-sources.ts` thêm `folio_line`, `approval_request`; `no-show-notices.ts` đọc **và ghi** `attention_event`; `hold-reminder-job.ts` ghi `job_run`).

**Kết luận: chấp nhận đọc thẳng (không bắt chuyển hết sang cổng)**, vì: KPI và danh sách "Hôm nay" cần gộp nhiều bảng trong **một** truy vấn để giữ p95 < 300 ms (đi qua cổng từng module = N+1); `reporting` theo architecture 5.1 là phân hệ "tính từ dữ liệu" (M1); BE-D đã đưa giá trị từng đơn có chủ (còn phải thu, trạng thái khai báo) qua cổng (`FolioService.balance`, `ReservationHooks.registrationSummary`) và chạy trong giao dịch chỉ đọc có RLS. **Điều kiện** (BE-D, trước khi gộp M1 – CỔNG):

| # | Điều kiện | Hiện trạng |
|---|---|---|
| C1 | Chỉ `SELECT` bảng của module khác, trong giao dịch chỉ đọc của người gọi (RLS) | Đạt (trừ C2) |
| C2 | **Không ghi bảng của module khác**: `no-show-notices.ts` đang `SELECT … FOR UPDATE` + `UPDATE attention_event` thẳng → chuyển sang `EventsService` (`events/public`, BE-D cũng là người sửa module events): thêm hàm đọc lịch sử mục theo (`kind`, `refType`, `refId`) có khóa dòng và `resolveAttentionById(tx, id, now, note)` (đóng bởi hệ thống, `resolved_by` NULL, phát `attention.changed`) | **Chưa đạt – phải sửa** |
| C3 | Giá trị từng đơn có chủ lấy qua cổng; chỗ còn chép logic (`stay-actions.ts` ↔ `reservations/internal/allowed-actions.ts`) **bắt buộc** giữ test đối chiếu (parity) trong CI. R3: `reservations/public` xuất hàm `allowedActions` để bỏ bản chép | Đạt có điều kiện |
| C4 | Số khớp định nghĩa DATA (K-01…K-03, S1c, K-18 cho `foc_threshold`) – có ca oracle (6/9 = 66,7 %, FOC đảo ròng = 0) | Đạt (test BE-D); DATA đối chiếu A7 |
| C5 | Danh sách bảng được đọc khai ở đầu `reporting.module.ts`; thêm bảng = ARC review. `guest` chỉ đọc tên người đứng tên (D01 – đã có trong `ReservationSummary`) và `tags` để lọc VIP (không trả ra) | Thiếu khai báo – bổ sung |
| C6 | Test kiến trúc (thêm vào `module-boundaries.test.ts`): mã trong `modules/reporting` không có `INSERT`/`UPDATE`/`DELETE`/`FOR UPDATE` trừ `job_run` (mẫu job 9.1); chỉ đọc bảng trong danh sách C5 | Chưa có – thêm |

Xem lại ở R3 (US-014 doanh thu tháng/ADR/RevPAR, đa cơ sở): danh sách > 12 bảng hoặc cần dữ liệu nhiều cơ sở → module chủ cung cấp view `v_reporting_*`. Ghi vào `architecture.md` 5.1.

### 11.5 Ai cài gì

| # | Thay đổi | BE (cài) | FE / MOB (dùng) | Kiểm / review |
|---|---|---|---|---|
| 1–4 | `resolveAttentionEvent`, `params`, SSE, ngày đi hiệu lực | **BE-D** – đã cài, không phải sửa; giữ `ATTENTION_PARAM_KEYS` khớp bảng hợp đồng (11.3 (4)) | **FE-B** – đúng như đang làm (`app/attention.ts`, `useLiveEvents`, H03). Sửa giả định FE-B: `room_ooo` **không** có `params.endDate` / `params.roomNo` / `dueAt` – chỉ `count` + `roomNos` → câu không ngày. `foc_threshold` 2 câu theo `params.check` (chờ UXD). MOB: không lọc SSE theo vai | QA: ca 409 cho 3 loại tự đóng, 422 mục critical thiếu `note`, V-09; SEC: G2 SSE (BE-D đã nhờ) |
| 5 | `Reservation.depositNotices[]` | **BE-B** (chủ `deposit_notice`, module `payments`): bộ đọc theo đơn (mới nhất trước, `createdByName` = tên hiển thị `created_by`, `updatedAt`), đăng ký `ReservationHooks.provideDepositNotices`. **BE-A** (module `reservations`): thêm slot `provideDepositNotices`/`depositNotices(tx, id)` vào `ReservationHooks` (vài dòng như `registrationSummary`) và gọi trong `getReservation`. Serializer tự lọc `note`/`createdByName` | **FE-B**: H11 "Xác nhận cọc" hiện bản `open` (số, `updatedAt`, ghi chú, ảnh qua `getAttachment`) → đóng BUG-R2-081; MSW `mocks/reservations.ts` trả trường mới. `DepositDialog` nằm trong `ReservationDialogs.tsx` – **tệp chung với FE-A** (S4-28): báo FE-A trước khi sửa. MOB (PWA sale/CTV): không bắt buộc | QA: ca trường – FD thấy `note`/`createdByName`; SAL/CTV (đơn mình) thấy số/giờ/trạng thái, **không** thấy `note`/`createdByName`; SAL/CTV đơn người khác → 404 |
| 6 | `Bill.settledAt` | **BE-A** cùng chỗ `Bill.roomName` (D1 (3)); BE-B review module folio. NÊN – nếu BE-A kín việc, ORC giao BE-B | **FE-B**: `BillDialog` in "Lập lúc {settledAt}", `null` (folio `open`) mới dùng giờ hiện tại | QA: in lại phiếu đã chốt hôm trước – giờ không đổi |
| 7 | `checkIn` 202 + `payment` → 422 | **BE-A** (`frontdesk/internal/checkin.service.ts`): ở nhánh `requestRoomApproval`, `payment` có mặt → `f.add('payment', 'NOT_ALLOWED')` **trước** `f.done()`; hiện đang trả 202 và bỏ qua `payment` im lặng. Ca test: FD + phòng chưa sạch + `payment` → 422, folio/payment không đổi, không có `ApprovalRequest`. CỔNG cùng M4 | **FE-A**: giữ nguyên (không gửi `payment` ở nhánh 202) – giả định FE-A được xác nhận | QA: ca trên vào bộ TC-L3 (H13) |
| 8 | `createDepositNotice` mô tả + mã | **BE-B** – đã cài | **FE-B** – hiện 409 (đơn không còn giữ chỗ) / 422 ảnh không hợp lệ ở hộp "Báo đã chuyển cọc" | – |
| 9 | `property_map_url` | **BE-D** – đã cài (`0058`, `parameter-rules.ts`, `guest-portal`) | FE-B: màn Tham số (H04/OWN) nhập khóa này khi làm – 422 mã trường `NOT_IN_LIST` hiện ở ô; MOB guest-web: không đổi (đọc `mapUrl`) | SEC: E14-08 cả lúc ghi và lúc đọc |
| 10 | `GuestRequest.roomNo` nullable | **BE-D** (`guest-portal/internal/guest-requests.service.ts` ~dòng 471): trả `null` thay `''` | **FE-B**: `mocks/ops.ts` (~1197) bỏ `null` khi gom `roomNos` (đang làm admin-web `tsc` đỏ 1 lỗi); `pages/ops/GuestRequests.tsx` hiện "Chưa gán căn" khi `roomNo = null` (UXD cấp chuỗi). **MOB** (PWA HK/MT nếu hiện yêu cầu khách): xử lý `null` – `tsc` mobile hiện xanh | QA: yêu cầu của đơn OTA xung đột chưa gán căn → `roomNo: null` |
| 12 | Ngôn ngữ phiên khách (P-S4-10) + `localeChosenByGuest` | **BE-D** (`guest-portal`): `pickLocale` theo thứ tự 11.3 (8) – hiện mã map `ru` → en và trình duyệt lạ → **vi**, phải đổi; nhận `preferredLocale = ru`; cột `guest_session.locale_chosen_at` (vào `0058` nếu chưa gộp, khác thì xin số ORC); `setGuestLocale` ghi cột; `openGuestSession` (và `getGuestSession` khi cài R3) trả `localeChosenByGuest`. Ca test: `fr-FR` → en, `ru-RU` → ru, `vi-VN` → vi, vắng → en, đã chọn rồi mở lại link → giữ + cờ `true` | **MOB** (guest-web): dùng nguyên `locale` của phiên, nút ngôn ngữ gọi `setGuestLocale` và hiện trạng thái theo cờ; trước khi có phiên (link hết hạn, đang tải) giữ mặc định theo trình duyệt P-S4-10 như đang làm; mock trả `locale` theo quy tắc + cờ (hiện trả `vi`) | QA: ca 4 giá trị `Accept-Language` + mở lại link sau khi chọn |
| 13 | `Accept-Language` theo nút ngôn ngữ PWA | – (server đã đọc header ở `getInspectionChecklist`, `listInspections`, `recordInspection`) | **FE** (chủ `@ottimo/api-client` – ORC chỉ định một luồng; `packages/api-client/src/endpoints.ts` là tệp chung FE-A/FE-B, đọc lại trước khi sửa): thêm `acceptLanguage?: 'vi' \| 'en' \| 'ru'` vào `RequestOptions` → đặt header `Accept-Language`, có test. **MOB** (PWA): truyền `acceptLanguage` theo nút VI/EN khi gọi 3 operation trên | QA: đổi nút EN → nhãn checklist tiếng Anh dù trình duyệt tiếng Việt |
| 11.4 | Điều kiện `reporting` C2, C5, C6 | **BE-D** – CỔNG trước gộp M1; báo ARC review lại. **BE-A** review `frontdesk/internal/attention-sources.ts` (BE-D đã nhờ) | – | ARC review lại |

### 11.6 Giả định
- [GIẢ ĐỊNH ARC – BA xác nhận] SAL/CTV xem báo chuyển cọc của **đơn mình** (số tiền khai, giờ, ảnh id, trạng thái) – thuộc dòng "folio của đơn – cọc (M)" của bảng dữ liệu kinh doanh rbac mục 6, không phải D14; `note` (D12c) và tên người báo (D27) chỉ FD+. BA ghi một dòng/ghi chú vào rbac-matrix mục 6 nếu đồng ý; khác ý thì chỉ đổi `x-visible-to` trong phần tử (không gãy client).
- [GIẢ ĐỊNH ARC] `depositNotices` trả mọi bản của đơn (thường ≤ 2–3); nếu cần giới hạn, server trả 20 bản mới nhất.
- [GIẢ ĐỊNH BE-D – giữ] Mặc định `property_map_url` = ghim INV 17/10 (một cơ sở ở R2); OWN đổi ở Tham số.
- [GIẢ ĐỊNH ARC – PO xác nhận nếu khác] Hồ sơ người đứng tên có `preferredLocale` thì ưu tiên hơn `Accept-Language` (lễ tân biết khách hơn trình duyệt); `ru` theo P-S4-10 → `ru` (khóa RU còn thiếu, guest-web dùng EN cho khóa đó).

---

## 12. Bổ sung 2 – "Yêu cầu đặt phòng" từ website, phương án A (ARC, 17/10 khuya – FB-INV-002 ý 3, 4; US-155; luồng landing)

- **Nguồn**: `04-investor-feedback/FB-INV-002.md` (ý 3: đặt phòng trực tiếp từ website, nút trên fanpage trỏ về, đổ vào Desk với nguồn website; ý 4: Zalo OA là kênh chính, fanpage Facebook chỉ là link); `02-escalations/ESC-020.md`; `rounds/round-02/outputs/PO/landing-scope.md`; `rounds/round-02/reviews/landing-zalo-SEC.md` (C-2, C-3, ARC-02…12, DOM-05, SR-RL mục 7); backlog EP19 (US-151, US-155, US-158), EP18 (US-131); BR-108, BR-110, BR-112, BR-811, BR-951; ADR-014 (bản 17/10 tối).
- **Phương án**: hợp đồng chốt cho **A** – "Yêu cầu đặt phòng" không thanh toán; nhân viên xác nhận qua Zalo, giữ chỗ, gửi QR cọc. **INV đã chọn A ngày 17/10** (FB-INV-002, mục "Xác nhận của INV" – sửa 17/10, Phản hồi & sửa). **B** (phòng trống + giá thật) chỉ là **contract-ahead**, không cài; đổi A → B không đổi operation của A.
- **Đã áp**:
  - `openapi.yaml`: đoạn "0.3.7 bổ sung 2" trong mục thay đổi phiên bản; quy ước "Origin landing" trong `info.description`; khối path "public-site + hàng chờ…" đặt trước khối webhooks; khối schema ở cuối tệp; vài dòng thêm ở `saveQuote`, `createHoldFromQuote`, `ReservationCreate`, `Reservation`, `Quote`, `AttentionItem`, `StaffNotification`, `streamEvents`, `setParameter` (ghi chú tham số bảo mật), bảng mã lỗi.
  - `erd.md`: mục **4.14 mới** + dòng ở 4.5, 5 (SM-18), 9.2, 9.3, 12, 15.
  - ADR-014: **mục 4 viết lại**; sửa tóm tắt (dòng 4, 10), 1.4 (đường dẫn proxy), 2.6, 6.1, Hệ quả, 10.
  - Đã sinh lại `openapi-meta.ts`, `openapi-schemas.ts`, api-client `openapi.ts`, `rbac-cases.json/.csv`.
  - **Chưa commit** – ORC commit.
- **Chạy song song với bổ sung 1** (mục 11): hai khối tách riêng, không sửa dòng của nhau. Sửa vào mô tả chung chỉ bằng dòng thêm có nhãn "0.3.7 bổ sung 2" (cuối mô tả `streamEvents`, khóa `description` riêng của `AttentionItem.kind`). Một sửa nhỏ ngoài khối: mô tả `listAttentionItems` trỏ "erd mục 4.14" (sai từ trước) → "erd mục 4.12 `attention_event`", vì 4.14 nay là `public-site`.
- **Không đổi**: đường dẫn, operation, trường, `x-roles`/`x-scope` đã có. Mọi trường thêm vào operation cũ là **tùy chọn**, server bỏ qua tới khi cài. Không đổi guard `ifMatch`/`dryRun`/`securityParameters` của operation nào.

### 12.1 Kiểm tra đã chạy (17/10 khuya, trên tệp thật, sau khi gộp với bổ sung 1)

| Kiểm tra | Kết quả |
|---|---|
| `openapi-spec-validator` 0.7.2 | OK |
| Redocly CLI 1.34.21 `lint` | Hợp lệ, 0 lỗi; 4 cảnh báo – đúng 4 cảnh báo có từ trước, 0 cảnh báo mới |
| `check-no-test-surface.sh spec` | OK |
| `gen-openapi-meta.mjs` → `--check` | Đã sinh lại; up to date. Meta thêm 7 operation (4 `public: true`), 2 mã lỗi (`FORM_TOKEN_INVALID` 422, `SITE_BUSY` 503); `securityParameters` **không đổi** |
| api-client `gen.mjs` (chạy 2 lần) | Sinh lại; lần 2 "up to date" |
| `gen_rbac_cases.py` → `--check` | OK. 195 operation có ca (+3 operation nhân viên), 2.145 ca, R3 319 (+33), bỏ qua 12 (+4 operation công khai), rbac mismatch [] |
| `gen_traceability.py --strict` (ghi ra tệp tạm như CI) | exit 0. RBAC: 0 operation lệch, 0 thuộc tính lệch, 0 mã lạ. `x-rbac-field` 166 gắn (bổ sung 2 góp 10, đều D28), 0 thiếu |
| vitest `services/api` (`contract`, `serializer`, `module-boundaries`, `problem-concurrency`) | 29/29; lần chạy cuối 32/32 (vai khác thêm ca song song) |
| vitest `packages/api-client` | 28/28; lần chạy cuối 30/30 |
| `tsc --noEmit` api-client, api, admin-web, guest-web, mobile | 0 lỗi ở lần chạy sau khi sinh mã. Lần chạy cuối: api có 4 lỗi **không do hợp đồng** – `guest-portal/internal/guest-requests.service.ts` thiếu `./guest-request-lifecycle` (việc BE-D đang làm dở); các gói khác 0 lỗi |
| prettier (`openapi.yaml`, `openapi.ts`, `openapi-meta.ts`, `openapi-schemas.ts`) | Xanh |

Không chạy test tích hợp cần PostgreSQL (không đụng stack demo; chưa có mã server cho các operation này).

### 12.2 Hợp đồng phương án A (chốt – cài theo lịch ORC)

| Operation | Ai gọi | Tóm tắt |
|---|---|---|
| `getPublicFormToken` – `GET /v1/public/properties/{propertySlug}/form-token` | Công khai, `x-allowed-origins: [landing]` | Mã form có chữ ký HMAC, dùng một lần trong [3 giây, 2 giờ]; 404 khi cơ sở chưa bật form; 30/giờ/IP |
| `createWebsiteBookingRequest` – `POST …/booking-requests` | Công khai | Ngày đến/đi, người lớn/trẻ em (+ tuổi), hạng phòng (slug `publicRoomType`), tên, **SĐT (Zalo) bắt buộc**, email tùy chọn, kênh ưa thích (mặc định `zalo`), lời nhắn, đồng ý + phiên bản thông báo, UTM, `refHost`, ngôn ngữ, ô bẫy, form token, `Idempotency-Key`. Trả **202** `{refCode, replyBy}` – không dữ liệu khách. 403 Origin / 404 chưa bật / 422 / 428 / 429 theo IP / 503 `SITE_BUSY` theo trần cơ sở; quá 3 lần/ngày/SĐT → 202 giống hệt, không lưu. Không đọc phòng trống, hồ sơ khách, đơn |
| `listWebsiteBookingRequests` | OWN, MGR, FDL, FD; SAL `unassigned_or_own` | Hàng chờ; lọc `status`, tìm `refCode` (không tìm SĐT/tên qua URL) |
| `getWebsiteBookingRequest` | Như trên | Chi tiết + `ETag` |
| `transitionWebsiteBookingRequest` – `…/actions/{claim\|release\|decline\|mark-spam\|reopen}` | Như trên | WR1–WR5; `If-Match`, `Idempotency-Key`; `decline` cần `reasonCode` |
| `saveQuote.websiteBookingRequestId` → `createHoldFromQuote` | Theo quyền có sẵn (CTV không thấy yêu cầu) | Giữ chỗ; WR6 trong cùng giao dịch |
| `ReservationCreate.websiteBookingRequestId` → `createReservation` | FD+ | Đơn đảm bảo khi khách đã chốt và cọc; WR6 |
| `Reservation.directSubSource` (chỉ đọc), `Quote.websiteBookingRequestId` | – | Định danh "website · facebook" |
| `AttentionItem.kind` `website_request_new` (FD+); `StaffNotification.kind` `website_request_new` (FDL, FD, SAL), `website_request_cap_reached` (OWN); SSE `website_request.changed` | – | Không tên/SĐT/lời nhắn trong thông báo |

### 12.3 Contract-ahead phương án B – **không cài**
`getPublicAvailability`, `getPublicOffers` (`x-round: R3`, mô tả ghi "KHÔNG cài"); `WebsiteBookingRequestInput.offerSnapshot` + `PublicOfferSnapshot` (server A bỏ qua); `WebsiteBookingRequest.offerSnapshot` (luôn null); cột `website_booking_request.offer_snapshot` (luôn NULL). Đơn vị công bố = slug `room.public_room_type` – bỏ bảng `public_listing` của phác thảo ADR. Chỉ còn/hết phòng, không số phòng còn lại (khớp FB-INV-002 ý 1). Hiện giá đêm là đổi chính sách ESC-020 L3 → INV quyết lại khi chọn B.

### 12.4 Quyết định kỹ thuật của ARC (đề xuất dòng decision-log – ORC ghi khi commit)
1. **Đổi tên** `booking_inquiry` (phác thảo ADR) → `website_booking_request` / `createWebsiteBookingRequest` (chữ INV dùng, nguồn `website`).
2. **Không có operation "convert" riêng**: chuyển thành giữ chỗ/đơn đi qua `saveQuote` → `createHoldFromQuote` hoặc `createReservation` kèm `websiteBookingRequestId`; WR6 + xóa C2 trong cùng giao dịch qua cổng `WebsiteRequestPort` của module `public-site`. Lý do: chỉ một đường qua ràng buộc chống trùng căn – đêm, giá, hạn giữ chỗ, hạn mức giữ chỗ.
3. **Bỏ bước lead bắt buộc** của phác thảo (sale vẫn tạo lead nếu muốn theo dõi kanban) – bớt một bước trả lời cho 10 căn.
4. **Nguồn phụ `directSubSource`** (enum đóng `facebook|instagram|google|zalo|qr|other`, null): server suy từ UTM rồi tên miền giới thiệu; không nhập tay. Đây là cách "định danh khách đến từ website · facebook" (FB-INV-002 ý 3).
5. **Origin theo operation** – `x-allowed-origins: [landing]`; sai → `403 FORBIDDEN_ACTION` (mã guard có sẵn, bỏ `ORIGIN_NOT_ALLOWED`); không CORS (cùng origin qua proxy). Meta chưa sinh khóa này – BE-D sửa generator + guard trong PR US-155 (generator là của BE; ARC review).
6. **`Idempotency-Key` bắt buộc** cho POST công khai, principal `public_site` + `propertyId`; phản hồi cũ trả **trước** khi kiểm form token.
7. **Giới hạn**: IP → 429; SĐT → 202 giống hệt (không dò được SĐT đã gửi); trần cơ sở → 503 `SITE_BUSY` (không giả thành công); đếm trong DB `rate_limit_counter` (SEC ARC-02, 04, 05).
8. **SĐT bắt buộc, email tùy chọn, `preferredChannel` mặc định `zalo`** – Zalo OA là kênh chính (FB-INV-002 ý 4).
9. **Một ô ngày cho mọi khách** (bỏ `stayType`/`months`): từ 28 đêm server ghi `stayKind = long` (BR-108). Khớp định vị boutique stay – không tách form "căn hộ dịch vụ" (FB-INV-002 ý 2).
10. **Hạng phòng = slug của `Room.publicRoomType`**; slug không khớp → vẫn nhận + cờ `room_type_unmatched` (trang cũ không làm hỏng yêu cầu).
11. **C2 không vào URL**: hàng chờ chỉ tìm theo `refCode`; tra khách bằng `lookupGuestByContact`.
12. **Tham số bảo mật** (`public_booking_request_daily_cap`, `retention.web_request_*`) ghi chú trong `x-security-parameters`, bật cùng PR US-155 – cùng lý do mục A.3 (test kiến trúc catalogue ↔ OpenAPI).
13. **`x-round: R3`** cho mọi operation mới tới khi ORC xếp lịch US-155. Nếu ORC kéo vào luồng LP: ARC bỏ `x-round` của 5 operation A (`getPublicFormToken`, `createWebsiteBookingRequest`, `list/get/transitionWebsiteBookingRequest`) và sinh lại `rbac-cases` – không đổi hình dạng.
14. **`recordSiteEvent`** (bộ đếm US-158) chưa vào hợp đồng – làm cùng US-158 (áp SEC ARC-09 lúc đó).

### 12.5 Bảng việc cài (cài theo lịch ORC; bật trên mạng chỉ sau SEC C-2, C-3, SEC-G1/G2 và trả lời ESC-001 LZ-2, LZ-8)

| Vai | Việc | Phụ thuộc | Xong khi | Ước (ngày-người, [ước tính ARC]) |
|---|---|---|---|---|
| **BE-D** – endpoint công khai | (1) Migration theo erd 4.14: `website_booking_request`, `privacy_notice_version`, `public_form_nonce`, `rate_limit_counter`, hàm `public_resolve_property` (mẫu erd 2.4), `reservation.direct_sub_source`, `quote.website_booking_request_id`, `idempotency_key.principal_type` + `public_site`, kind/ref_type `staff_notification`; dòng catalogue `public_booking_requests_enabled`, `web_request_response_minutes` và 6 khóa bảo mật (ARC bật `x-security-parameters` **cùng PR**). (2) Generator meta sinh `allowedOrigins` từ `x-allowed-origins` + kiểu `OpenApiMeta`; guard: operation có `allowedOrigins: [landing]` chỉ nhận `LANDING_BASE_URL` (bắt buộc https ở staging/production khi bật form); operation nhân viên/khách không bao giờ nhận origin landing. (3) Đơn vị giao dịch công khai: idempotency principal `public_site`, replay trước form token, bỏ qua cookie. (4) `getPublicFormToken`: ký/kiểm HMAC, khóa `PUBLIC_FORM_SIGNING_KEY_FILE` ≥ 32 byte, kiểm khi khởi động (SR-SECR-05). (5) `createWebsiteBookingRequest` đúng 11 bước thứ tự trong mô tả operation: bộ đếm DB, HMAC IP (/64) và SĐT (khóa dẫn xuất `web_request_contact`), bộ nhận diện số thẻ/số giấy tờ, cờ nghi ngờ, bảng suy `DirectSubSource`, `replyBy` theo `front_desk_hours`, outbox thông báo, SSE, 202 giống hệt / 429 / 503 | Hợp đồng này; OPS biến môi trường | Ca bắt buộc: Origin sai → 403; ô bẫy → 202 không lưu; token quá nhanh/dùng lại → 422; gửi lại cùng khóa → cùng `refCode`, 1 bản ghi; SĐT lần 4/ngày → 202 không bản ghi mới, `duplicateCount` + 1; yêu cầu thứ 101/ngày → 503, 1 cảnh báo OWN; SĐT đã có hồ sơ và SĐT mới → phản hồi giống hệt; log không chứa body | 2–2,5 |
| **BE-D** – hàng chờ + chuyển đổi | (6) `list/get/transitionWebsiteBookingRequest` (phạm vi SAL `unassigned_or_own` trong truy vấn, `allowedActions`, ETag/If-Match, `state_transition` + audit `state` không C2). (7) Cổng `WebsiteRequestPort` (`attachQuote`, `markConverted`) gọi từ `saveQuote`, `createHoldFromQuote`, `createReservation` – **BE-A review** module quotes/reservations; ghi `direct_source = website`, `direct_sub_source`, WR6, xóa C2 cùng giao dịch. (8) "Cần chú ý" `website_request_new` (tính lúc đọc); thông báo `website_request_new`, `website_request_cap_reached`. (9) Job `web_request.stale`, `web_request.purge`, dọn nonce/bộ đếm; `purge_journal` | BA SM-18 + mã rbac; (7) cần BE-A rảnh review | Ca rbac theo `rbac-cases` (sau khi bỏ `x-round`); SAL không thấy yêu cầu người khác (404); giữ chỗ từ báo giá có liên kết → đơn `website` + nguồn phụ, yêu cầu `converted`, C2 rỗng; test `Clock` giả SEC ARC-03 (31 ngày → `stale`; ngày 121 → C2 rỗng; `reopen` ngày 179 → vẫn xóa ngày 180) | 1,5–2 |
| **FE-LP** – form trên landing | (1) Trang `/book/` + `/vi/book/`. Cờ build `PUBLIC_BOOKING_FORM`: tắt → trang hiện nút Zalo + "Kênh khác", không tải script form; bật → form. (2) Trường theo `WebsiteBookingRequestInput`: Zalo chọn sẵn và đứng đầu, WhatsApp/Telegram/Viber/gọi/email trong "Kênh khác"; ô đồng ý không tích sẵn + link `/privacy/` đúng phiên bản; ô bẫy ẩn bằng class; **không** hiện số phòng/số căn; không ô nhận ưu đãi. (3) Script module ngoài (CSP `'self'`, không inline): lấy form token khi khách chạm ô đầu tiên; kiểm bằng schema zod chung; `Idempotency-Key` UUID mỗi lần gửi, giữ khi gửi lại; UTM lấy từ URL + giữ UTM trên link nội bộ (không cookie/localStorage); `refHost` từ `document.referrer` (chỉ tên miền, khi khác origin); `landingPath`. (4) Xử lý phản hồi: 202 → trang cảm ơn có mã yêu cầu, `replyBy` theo giờ cơ sở, nút "Nhắn Zalo" soạn sẵn mã + "Kênh khác"; `FORM_TOKEN_INVALID` → lấy mã mới, gửi lại một lần; 422 trường → lỗi tại ô; 429/503/404/mất mạng → khối "Nhắn Zalo / Gọi" (dữ liệu khách không gửi đi đâu khác). (5) Link fanpage Facebook ở chân trang + Liên hệ (thẻ `<a>`, không SDK) | Hợp đồng (dựng trước bằng mock từ spec); UXD chữ + bố cục v1.2; SEC duyệt văn bản thông báo | Playwright: 0 request ra tên miền ngoài, không cookie, không `localStorage` mới; axe không lỗi nghiêm trọng; gửi được ở 360 px EN/VI; link "Book now" có UTM → yêu cầu có `subSource = facebook`; tắt cờ → `/book/` không 404 | 2–3 |
| **FE-B** – hàng chờ Desk | (1) Mục menu "Yêu cầu từ website" (FD+, SAL) + số đếm `new`; trang `/website-requests`. (2) Danh sách: mã, ngày, số đêm, số khách, hạng, kênh ưa thích, nguồn ("Website · Facebook"), hạn trả lời (tô quá hạn), cờ nghi ngờ, người xử lý; lọc trạng thái, tìm mã. (3) Ngăn chi tiết: C2 + nút sao chép SĐT, mở Zalo/WhatsApp/gọi; nút theo `allowedActions` (Nhận xử lý, Trả lại, Từ chối + hộp lý do, Spam, Mở lại), ETag/If-Match, xử lý 409/412. (4) "Báo giá": `GuestPicker` điền sẵn (`lookupGuestByContact`/`createGuest` – BR-951) → `QuoteDialog` điền sẵn ngày, người, nhóm tuổi, hạng → `saveQuote` + `websiteBookingRequestId` → `createHoldFromQuote`; "Tạo đơn" (FD+) → `BookingDialog` + `websiteBookingRequestId`. (5) SSE `website_request.changed`; chuông hiện 2 loại thông báo mới; "Cần chú ý" `website_request_new`. (6) Đơn hiện "Website · {nguồn phụ}" ở danh sách/ngăn đơn | BE-D (6)–(8); UXD chuỗi `webreq.*` | Ca: SAL thấy đúng phạm vi; nhận → giữ chỗ → đơn mang nguồn website/facebook, yêu cầu biến khỏi hàng chờ; từ chối thiếu lý do bị chặn ở client; mã lạ của `kind` → câu chung | 2–3 |
| UXD | Bố cục form + trang cảm ơn trong mock v1.2 (theo FB-INV-002 ý 1, 2, 4, 5); chuỗi VI/EN: form, lỗi từng mã, thông báo, lý do từ chối, hàng chờ | – | – | – |
| BA | SM-18 (WR1–WR7) vào `state-machines.md`; màn + hành động `rbac-matrix.md` (FD+, SAL `unassigned_or_own`, không CTV); use case "Xử lý yêu cầu từ website" | – | Trước BE-D (6) | – |
| SEC | Review hợp đồng (C-2, C-3, ARC-02…12); SR-RL-10/11 vào `security-requirements.md`; mã T19 vào DRA; văn bản thông báo xử lý dữ liệu có phiên bản; sổ bí mật `PUBLIC_FORM_SIGNING_KEY` | – | Trước khi bật form | – |
| DOM | Chốt `web_request_response_minutes` (đề xuất 30) và danh sách lý do từ chối; xác nhận BR-112 ghi thêm nguồn phụ | – | Trước BE-D (5) | – |
| OPS | `LANDING_BASE_URL`, `PUBLIC_FORM_SIGNING_KEY_FILE` (`.env.example`, sổ bí mật); Caddy origin landing proxy đúng 2 đường dẫn (B thêm 2) | – | Trước khi bật form | – |
| QA | Ca theo 12.5 + `rbac-cases` (khi bỏ `x-round`); không viết ca cho phần contract-ahead B | – | – | – |
| INV (qua ORC) | Trả lời A/B (FB-INV-002); đặt nút "Book now" của fanpage trỏ `https://<tên-miền>/book/?utm_source=facebook&utm_medium=page_button&utm_campaign=book_now` khi form bật | – | – | – |

Thứ tự: BE-D (1)–(5) → FE-LP ghép thật (FE-LP dựng trước bằng mock theo spec); BE-D (6)–(8) → FE-B. Tổng phần cài A ≈ 7,5–10,5 ngày-người [ước tính ARC] – cao hơn ước 5,5–8 của PO vì thêm `Idempotency-Key`, nguồn phụ và job hạn lưu theo SEC ARC-03.

### 12.6 Đổi hành vi – bên gọi phải sửa cùng lúc
Không có. Mọi thay đổi ở operation cũ là trường **tùy chọn** (`saveQuote.websiteBookingRequestId`, `ReservationCreate.websiteBookingRequestId`) hoặc trường **đọc thêm** (`Reservation.directSubSource`, `Quote.websiteBookingRequestId`). `AttentionItem.kind` và `StaffNotification.kind` có giá trị mới – client đã hiện câu chung cho mã lạ.

### 12.7 Thẻ SEC `landing-zalo-SEC.md` gửi ARC
Trả lời từng thẻ ở `rounds/round-02/responses/ARC-responses.md` (mục "Landing + Zalo OA – thẻ SEC"). Đã áp: ARC-02, 03, 04, 05, 06, 07, 08, 12. Đã áp từ trước (17/10 tối): ARC-10, 11. Dời: ARC-09 (cùng US-158).

### 12.8 Giả định
- ~~[GIẢ ĐỊNH – chờ INV] Phương án A~~ → **INV đã chọn A** (FB-INV-002, 17/10). Sau này chọn B → cài thêm 12.3, không đổi A; C → ADR riêng.
- ~~[GIẢ ĐỊNH – DOM] `web_request_response_minutes` = 30~~ → **DOM chốt 15** (BR-912 v0.3.8); lý do từ chối: DOM giữ 7 mã hợp đồng + `stale` (mục 13).
- [GIẢ ĐỊNH – SEC] Mã hạn lưu T19; mặc định trong biên ARC-03; bộ nhận diện số giấy tờ dùng lại SR-LOG-04. Pháp lý (Luật 91/2025, NĐ 356/2025, thông báo Bộ Công Thương) chờ luật sư – ESC-001.
- [GIẢ ĐỊNH ARC] Slug hạng = `publicRoomType` bỏ dấu, chữ thường, ký tự khác chữ-số → `-`. Landing dùng cùng slug, kiểm trong checklist phát hành (như giá "từ" – US-147 AC4).
- ~~[GIẢ ĐỊNH ARC] SĐT bắt buộc~~ → **SEC chốt một cách liên hệ** (SĐT hoặc email theo kênh – ARC-14, mục 13).
- [GIẢ ĐỊNH ARC – UXD/PO xác nhận] Zalo đứng đầu ở **cả** bản EN và VI (FB-INV-002 ý 4 thay thứ tự cũ "bản EN xếp WhatsApp trước" của ESC-020 L2-A); US-151 AC1 cần PO sửa.
- [GIẢ ĐỊNH ARC] Một replica api (như SEC đã ghi) – form token, cache B trong RAM đúng; bộ đếm giới hạn của form nằm trong DB.

### 12.9 Còn mở / chưa làm
- `architecture.md`: thêm module `public-site`, 2 job, origin thứ tư – ARC làm khi ORC xếp lịch cài (không ảnh hưởng hợp đồng).
- BA (SM-18, mã rbac), SEC (SR-RL-10/11, T19, văn bản thông báo), UXD (chuỗi), DOM (số phút, lý do) – xem 12.5.
- `x-security-parameters` 6 khóa mới – ARC bật cùng PR BE-D (1).
- `recordSiteEvent` / `web_metric_daily` – cùng US-158.
- Không có ESC mới từ ARC: phương án không tốn thêm tiền, không đưa dữ liệu ra nước ngoài. Câu A/B đã nằm trong FB-INV-002 (ORC trình); pháp lý nằm trong ESC-001 (LZ-2, LZ-8).

---

## 13. Bổ sung 2 – phản hồi review SEC + DOM v0.3.8 + PO (ARC, 17/10 – bước Phản hồi & sửa)

- **Nguồn**: `reviews/landing-booking-SEC.md` (5 Major, 8 Minor, 3 Suggestion; điều kiện C-1…C-3, C-11…C-13); `business-rules.md` v0.3.8 + dòng DOM trong decision-log (DOM-S4-18, EP19 Q-W01…W10); `specs/EP19-website-requests.md` mục 12 (BA Q-W01…W15); UXD `design/landing/concept.md` v1.2 (khóa `infants`, `months = null`); PO landing-scope 0.10 (link fanpage `#book`, Q-W09). **INV đã chọn A** (17/10) – đã bỏ nhãn "chờ INV" ở mục 12, ADR-014.
- **Phạm vi**: chỉ khối bổ sung 2 (mọi operation vẫn `x-round: R3`, chưa có mã server) – sửa được theo ORC. Thêm 1 operation (`lookupWebsiteBookingRequests`), 1 mã lỗi (`PUBLIC_FORM_NOT_READY`), 2 mã trường (`CONTACT_MISMATCH`, `POW_INVALID`), 3 `StaffNotification.kind`. Không đổi operation nào ngoài khối, trừ mô tả `createHoldFromQuote`, `ReservationCreate.websiteBookingRequestId`, `setParameter`.

### 13.1 Kiểm tra (17/10 – chạy lại lần cuối sau mọi phần sửa A, B, C, gồm BE-B đợt 3 (f)–(i), DOM-S4-19, `unconfirmed`)

| Kiểm tra | Kết quả |
|---|---|
| `openapi-spec-validator` 0.7.2 | OK / OK |
| Redocly 1.34.21 | Hợp lệ, 0 lỗi, **4 cảnh báo cũ** (một cảnh báo ví dụ `PublicFormToken` thiếu `minDelaySeconds` đã sửa) |
| `check-no-test-surface.sh spec` | OK |
| `gen-openapi-meta --check` | Up to date sau khi sinh lại: meta +2 operation (`lookupWebsiteBookingRequests`, `listAssignableStaff`), +1 mã (`PUBLIC_FORM_NOT_READY` 422); `securityParameters` **không đổi** (khóa mới vẫn là ghi chú, bật cùng PR US-155) |
| api-client `gen.mjs` (2 lần) | Sinh lại; lần 2 up to date; vitest 30/30; `tsc` 0 lỗi |
| `gen_rbac_cases --check` | OK – 197 operation, 2.167 ca, R3 330 (+11 `lookupWebsiteBookingRequests`), bỏ qua 12, rbac mismatch [] |
| `gen_traceability --strict` | exit 0; RBAC 0 lệch; x-rbac-field 169 (+3: `verifiedContact`, `lookup.phone`, `lookup.email` – D28), 0 thiếu, 0 mã lạ |
| vitest api `contract`, `serializer`, `module-boundaries`, `crypto-boundary` | 30/30; `integration/architecture.test.ts` **bỏ qua** (cần DB – không đặt `DATABASE_URL` để không đụng DB của luồng khác; `securityParameters` không đổi nên phép so catalogue ↔ OpenAPI không bị ảnh hưởng) |
| `tsc --noEmit` api, admin-web, mobile, guest-web, api-client | 0 lỗi (lần chạy sau khi sinh mã) |

Chạy song song với các luồng BE đang sửa mã: mỗi khối sửa yaml đều sinh lại meta/schemas/api-client ngay (ORC (1)) – cây chung xanh ở `contract.test.ts`.

### 13.2 Thay đổi theo thẻ SEC
| Thẻ | Mức | Hợp đồng sau sửa |
|---|---|---|
| ARC-13 (C-11) | Major | Bước 0 trong RAM trước DB (tính cả 4xx, 30/giờ/IP, IPv6 /64), bulkhead 4 request → 503, `statement_timeout` 2 s, cache `public_resolve_property` 60 s; thiếu `Origin`/`Origin: null` → 403; non-JSON → 422; > 8 KB → 413; `Sec-Fetch-Site` ≠ `same-origin` ở form token → 403; giới hạn 40/ngày/dải IPv6 /48 (không gộp IPv4 /24); bỏ qua cookie (không ghi `user_id`). Ca B.1 vào DoD của BE-D (`rbac-cases` không sinh ca công khai) |
| ARC-14 | Major | **Một cách liên hệ**: `preferredChannel` quyết định `phone` hoặc `email` (thiếu `REQUIRED`, thừa `NOT_ALLOWED`); `contact_hmac` của đúng liên hệ; `children` (6–11) + `infants` (< 6), bỏ `childrenAges`; `preferredChannel` bắt buộc |
| ARC-15 (C-11) | Minor | Idempotency ở mọi nhánh 202; `aliasRefCodes` (≤ 5) + tìm theo mã phụ |
| ARC-16 (C-3 d) | Major | Hành động `erase` (WR8, OWN/MGR/FDL; `verificationMethod` `same_contact` + `verifiedContact` so HMAC → `CONTACT_MISMATCH`, hoặc `called_back`); xóa C2 + `contact_hmac` + `ip_hmac` ngay, `purge_journal` `dsr_erase`, audit `security`, không mở lại, `converted` → 409; operation mới `lookupWebsiteBookingRequests` (POST, liên hệ trong thân, trả mã/trạng thái, 20/giờ/người) |
| ARC-17 (C-3 e) | Minor | `public_booking_requests_enabled` → tham số **bảo mật** (ghi chú `x-security-parameters`); bật cần `privacy_notice_version` mỗi ngôn ngữ + khóa ký → 422 `PUBLIC_FORM_NOT_READY` (`missing[]`); thông báo `public_booking_toggled`; một công tắc lúc chạy (cờ build chỉ chọn A/B) |
| ARC-18 | Major (B) | `offerToken` HMAC `keyedHash('public_offer')` ở `getPublicOffers`; `PublicOfferSnapshot.offerToken` bắt buộc; snapshot chỉ lưu khi chữ ký đúng, khác → cờ `offer_unverified`; `getPublicOffers` thêm `infants`. DOM sửa BR-916 (2), ORC thêm nhược điểm "lộ lấp đầy" vào ESC-020 L7-B |
| ARC-19 (C-12 a) | Minor | SAL: yêu cầu `new` chưa giao **không** có C2; `createHoldFromQuote` chỉ chuyển yêu cầu khi người gọi FD+ hoặc đang được giao, khác → thông báo `website_request_linked_hold`; FD+ thấy bộ lọc spam để mở lại. **D30**: chưa đổi tag (D28 giữ) – cần BA thêm dòng D30 vào rbac-matrix mục 6 và BE thêm `D30` vào `RBAC_FIELD_DENY` **trước**, rồi ARC đổi tag trong cùng PR (đổi trước sẽ đỏ `gen_traceability --strict` + `serializer.test.ts`) |
| ARC-20 | Minor | Tên khóa catalogue = BR v0.3.8 (DOM đã đổi theo hợp đồng); thêm `public_booking_request_spam_pow_threshold_per_week` (bảo mật, 5–50, 10) – tên theo BR v0.3.8; `web_request_response_minutes` = 15; danh sách đầy đủ ở ghi chú `x-security-parameters` + erd 9.3 |
| ARC-21 (C-12 b, c) | Major | Chuẩn hóa NFC + bỏ Cc + ký tự hướng ở `guestName`/`note`/`transition.note`; nhận diện số thẻ/giấy tờ cho `guestName`; quy tắc hiển thị Desk (chữ thường, không tự tạo link, `tel:`/`wa.me` từ E.164, không deep link Zalo/Telegram/Viber, "Sao chép SĐT" + nhắc tài khoản OTTIMO); log Postgres không tham số (OPS) |
| ARC-22 | Suggestion | **Không Turnstile**; tầng 2 PoW tự host contract-ahead: `PublicFormToken.powChallenge`, `WebsiteBookingRequestInput.pow`, tham số bảo mật `public_booking_request_pow_enabled`, mã trường `POW_INVALID`; không trừ lùi bộ đếm khi đánh dấu spam |
| ARC-23 (C-11) | Minor | `PublicFormToken.minDelaySeconds` (3); trang chờ theo đồng hồ trình duyệt rồi gửi lại một lần |
| UXD-07 (phần ARC) | Minor | Server chuẩn hóa `refCode` khi tìm (bỏ `-`/khoảng trắng, chữ hoa, Crockford `I/L→1`, `O→0`); FE-LP dùng tên khóa hợp đồng (`roomType`, `guestName`, `preferredChannel`, `note`) – ánh xạ từ mock (`listingSlug`, `name`, `preferredContact`, `message`) |
| UXD-08 điểm 4 | Suggestion | ADR-014 4.2 `rel="noopener noreferrer"` |

### 13.3 Theo DOM v0.3.8 (DOM-S4-18) và BA EP19 mục 12
| # | DOM/BA | Hợp đồng |
|---|---|---|
| Q-W01 | 7 mã đóng + `stale` | Giữ 7 mã hợp đồng; thêm mã hệ thống `erased_on_request` (WR8) |
| Q-W02 | "Đã chuyển" = lúc tạo giữ chỗ/đơn | Như cũ (WR6 ở `createHoldFromQuote`/`createReservation`); báo giá chỉ gắn `quoteId` |
| Q-W03 | Nguồn phụ theo hợp đồng, rỗng thay `direct` | `DirectSubSource` null = "không rõ"; **tên miền của chính OTTIMO → null** (không `other`) |
| Q-W04 | `replyBy` 15 phút; câu hứa công khai tách riêng | `replyBy` nội bộ 15 (quy tắc BR-912 đủ: ngoài giờ, chỉ gọi điện 08:15, đến hôm nay ngoài giờ 30); 202 trả **`promise`** (`within_minutes` 60 / `next_morning` 09:00 / `call_now`) – **bỏ `replyBy` khỏi phản hồi công khai** |
| Q-W05 | Theo đề xuất BA | `createReservation` nhận `manualLongStay` + `websiteBookingRequestId` cùng lúc (HĐ giấy, nguồn `website`) |
| Q-W06 | Tên khóa theo hợp đồng; tự đóng 30 ngày | `retention.web_request_stale_days` mặc định 30 (biên 7–60) |
| Q-W07 | (PO/UXD/SEC) | Một cách liên hệ; `children` + `infants`; `stayType` + `months` (`null` = "Not sure yet") |
| Q-W08 | Không có lệnh sửa yêu cầu | Ghi rõ ở `transitionWebsiteBookingRequest` và `WebsiteBookingRequest` |
| Q-W09 (PO – mốc "form") | Báo khẩn/báo lên | `arrivesToday`; `website_request_overdue` (FDL + MGR, một lần, khi còn `new` ở mốc `web_request_escalate_minutes` 30 trong giờ trực) |
| Q-W10 | Cờ "có thể trùng" – NÊN | `possible_duplicate` + `relatedRefCodes` (server so `contact_hmac` lúc nhận) – NÊN cho BE-D |
| Q-W11 | Ghi lần liên hệ | Không có ở LP-v1 (R3 `contactAttempts[]` nếu DATA cần) |
| Q-W12 | Gỡ nhãn chờ INV | Đã gỡ (mục 12, ADR-014, comment `openapi.yaml`) |
| UXD v1.2 | `infants`, `months = null` | Có; tên khóa còn lại theo hợp đồng |
| PO 0.10 | Link fanpage `#book` | **Form nằm trong mục `#book` của trang chủ** (`/`, `/vi/`), không trang `/book/` (301 về `/#book`); ví dụ, `WebsiteUtm`, `landingPath`, ADR-014 4.2 đã sửa |

### 13.4 Quyết định ARC (ghi decision-log)
1. Phản hồi công khai trả `promise`, **không** trả `replyBy` – lời hứa với khách và hạn nội bộ là hai con số khác nhau theo DOM; trả cả hai dễ bị hiện nhầm.
2. Xác minh `erase` bằng HMAC liên hệ (server so) hoặc ghi nhận gọi lại – không đưa liên hệ vào URL, không lưu liên hệ người xin.
3. `lookupWebsiteBookingRequests` là POST chỉ đọc, không `Idempotency-Key`, giới hạn 20/giờ/người – không có đường tìm theo SĐT qua query.
4. Form nằm trong trang chủ (`#book`) – một link chuẩn cho fanpage, mọi tài liệu cũ `/book/` được 301.
5. `infants` (khóa của UXD) thay `childrenUnder6` ở hợp đồng công khai; bản nhân viên mô tả ánh xạ sang `children6to11`/`childrenUnder6` của báo giá/đơn.
6. D30 đổi tag theo thứ tự BA → BE → ARC trong cùng PR (tránh đỏ CI giữa chừng).
7. **C5 – `reporting` đọc bảng người đi cùng (DOM-S4-11 phần 2, R3): KHÔNG cho đọc thẳng** `reservation_guest` (bảng của frontdesk có D10 quan hệ, dữ liệu trẻ em). Cho làm ở R3 qua **cổng** do chủ bảng (BE-A, frontdesk) cung cấp, ví dụ `PartyReadPort.reservationsWithTaggedMember(tx, arrivalDate, tags): Set<reservationId>` – chỉ trả id đơn, không tên/quan hệ/tuổi; `reporting` vẫn đọc `guest.tags` như hiện tại cho người đứng tên; ARC review cổng; danh sách bảng của `reporting` (C5) không đổi.

### 13.5 Việc cho vai khác
| Vai | Việc |
|---|---|
| **BE-D** | **Được bắt đầu** cài phương án A theo hợp đồng này (endpoint công khai (1)–(5) mục 12.5 + bước 0/bulkhead/idempotency mọi nhánh/một cách liên hệ/chuẩn hóa văn bản/`promise`/`aliasRefCodes`; hàng chờ (6)–(9) + `erase`, `lookupWebsiteBookingRequests`, thông báo mới, `arrivesToday`; NÊN `possible_duplicate`). Hàng chờ (6) chờ BA có WR8 + mã rbac; ARC bỏ `x-round` của **6** operation A (thêm `lookupWebsiteBookingRequests`) khi ORC kéo US-155 vào lịch, rồi sinh lại `rbac-cases`. DoD gồm Phụ lục B (B.1, B.2) của review SEC. Bật production chỉ khi đạt C-1…C-3, C-11…C-13, SEC-G1/G2 |
| **BA** | SM-18: thêm **WR8** (`new, in_progress, declined, spam → declined`, `erased_on_request`, OWN/MGR/FDL) + mã sự kiện `erase_website_request`; rbac-matrix: mã hành động cho `list/get/transition/lookupWebsiteBookingRequests` (+ `operationIds` trong `rbac-matrix.json`), **D30** (SEC ARC-19 điểm 1); EP19 mục 6 bảng mã (7 + `stale` + `erased_on_request`), mục 2 trường mới (`stayKind`/`months`/`infants`/`aliasRefCodes`/`arrivesToday`/`relatedRefCodes`), mục 3–4 quy tắc hiển thị ARC-21 |
| **SEC** | Kiểm lại thẻ đã sửa: **ARC-13, ARC-14, ARC-16, ARC-18, ARC-21** (Major) và ARC-15, 17, 19 (phần D30 còn chờ BA), 20, 22, 23; xem thiết kế `lookupWebsiteBookingRequests` + `verifiedContact` (SR-DSR-04); chốt `idDocLast4` chỉ khi P05 (giả định ARC – BE-C đã cài) |
| **FE-LP** | Form theo `WebsiteBookingRequestInput` mới (một cách liên hệ, `stayType`/`months`, `children`/`infants`, tên khóa hợp đồng); trang cảm ơn đọc `promise` + lối thoát gọi/Zalo; chờ `minDelaySeconds`; form trong mục `#book` |
| **FE-B** | Hàng chờ Desk theo quy tắc hiển thị ARC-21, `erase` (OWN/MGR/FDL) + hộp xác minh, tìm theo liên hệ (`lookupWebsiteBookingRequests`), SAL không có C2 khi chưa nhận, thông báo mới; tìm mã chấp nhận `XXXX-XXXX` |
| **UXD** | Chuỗi: `promise` (3 kiểu), lối thoát trang cảm ơn, hộp `erase`, nhãn cờ `possible_duplicate`/`offer_unverified`, nhắc dùng tài khoản OTTIMO; mock dùng tên khóa hợp đồng |
| **DOM** | BR-916 (2) "giữ giá chụp" chỉ với snapshot đã ký (SEC ARC-18) |
| **OPS** | Postgres `log_parameter_max_length = 0`, `…_on_error = 0` (staging/production); Caddy origin landing: 301 `/book/` → `/#book`, `handle_errors` 404 `/404.html`; biến `LANDING_INDEXABLE`, `LANDING_SITE_URL` |
| **ORC** | ESC-020 L7-B thêm nhược điểm "đối thủ thấy lịch còn/hết theo hạng"; sửa câu LZ-8/LZ-2/LZ-7 của ESC-001 theo SEC mục 7 |

### 13.6 Giả định
- [GIẢ ĐỊNH ARC] Bulkhead 4 request và `statement_timeout` 2 s đủ cho 10 căn (SEC đề xuất) – đo lại ở test tải nhẹ trên bản thử (C-11).
- [GIẢ ĐỊNH ARC] `stayType = long` + `months` → `departure = arrival + months` tháng lịch cho báo giá; DOM chỉnh nếu muốn tính khác.
- ~~[GIẢ ĐỊNH ARC] `call_now` dùng `web_request_same_day_after_hours_minutes` (30)~~ → **DOM BR-912 v0.3.8**: khóa riêng `web_request_public_promise_call_now_minutes` = 60 (mục 15).

---

## 14. Bổ sung 3 – mô tả/khai báo còn thiếu của 0.3.7 (ARC, 17/10 – bước Phản hồi & sửa)

Phần chính 0.3.7 vẫn đóng băng: chỉ sửa mô tả, khai mã server đã trả, thêm trường/giá trị enum tùy chọn và **một** operation đọc (cần cho AC Must Sprint 4). Không đổi `required`, guard, `x-roles` của operation cũ.

| # | Nguồn | Thay đổi | Ai cài / dùng |
|---|---|---|---|
| 1 | DOM-S4-06 (BR-429-12, BA E02-10) | `moveReservation.applyDifference`/`expectedDeltaVnd`: bắt buộc cho **mọi** B7/B8 có `folioDeltaVnd` ≠ 0 (mọi lý do, như B14); `guest_request` đổi căn bắt buộc kể cả chênh 0, trừ đơn HĐ giấy (BR-429 (h)) | Mô tả – **BE-A, FE-A đã làm** |
| 2 | BE-B (a) | `ApprovalRequest.folioLineId` = dòng giảm (FOC) hiện tại của yêu cầu (pending → dòng `pending_approval`; approved → dòng đang áp), đi theo dòng mới; dòng được giảm = `relatedLineId` | Mô tả – khớp mã BE-B, Desk, QA |
| 3 | BE-B (b) | `lineChangedNote.cause` thêm **`manual_adjust`** (`adjustFolioLine` – S4-35); mặc định khi không nêu: trả muộn/nhận sớm → `checkout_time_change`, `extra_person` → `party_change`, còn lại → `move` | **BE-B** truyền `manual_adjust` từ `adjustFolioLine`; FE-A: câu UXD cho giá trị mới (lạ → câu chung) |
| 4 | BE-B S4-25 (ORC đồng ý) | `PartyMemberCreate.requestFocForSurcharge` **không** thêm ở 0.3.7 – ghi R3 | – |
| 5 | BA E02-09 | `PartyMemberCreate.childName`/`childBirthYear`: bắt buộc khi `role = child`; `companion` gửi → `NOT_ALLOWED`; năm 2000…năm hiện tại | Mô tả – server đã làm |
| 6 | BE-D | Mã trường **`NOT_EDITABLE`** (`updateItem.code`); `REQUIRED` chỉ khi khóa vắng/`null`/rỗng – sai kiểu là `VALIDATION_FAILED`; `updateItem` khai 412/422/428 | **Chủ module `platform`** (mapper `platform/public/validation.ts` – BE-A theo D0, ORC xác nhận) sửa chung: `invalid_type` có khóa trong thân → `VALIDATION_FAILED` (zod 4 không kèm `input` – kiểm có khóa trong thân thay vì `issue.input`); BE-D bỏ `refine` tạm sau đó |
| 7 | BE-C | `createHkTask`: 409 `ROOM_BLOCKED` (căn `OOO` hôm nay, không `conflicts[]`), 422 `NOT_IN_LIST` (`roomId`, `assignedUserId` không phải HK), việc ở lại trùng → trả việc đã có | Mô tả – server đã làm |
| 8 | BE-C | `Registration.imagesPurgeReason` thêm **`unconfirmed`** (SR-RET-02 – khai báo chưa bao giờ `confirmed`) | **BE-C**: migration mở rộng CHECK `registration_purge_reason_check` + `document_image.delete_reason` (số ORC cấp), đổi `retention` → `unconfirmed` trong J16; UXD nhãn; client lạ → nhãn chung |
| 9 | BE-C | `idDocLast4` chỉ khi P05 – giữ `[GIẢ ĐỊNH ARC – SEC chốt]` (mô tả đã có từ 0.3.7) | SEC chốt |
| 10 | Queue US-061 AC1 | `BookingRules.oooReopenBufferDays` (tùy chọn) | **BE-A** (chủ `getBookingRules`, 1 dòng) – BE-C làm nếu BE-A đồng ý; FE-B/MOB form phiếu sửa |
| 11 | Queue US-062 AC2 | **Thêm operation `listAssignableStaff`** (`GET …/assignable-staff?department=housekeeping|maintenance`, FD+ và MT, `x-rbac: [A85]`, chỉ `userId`, `displayName`) | **BE-C** (qua `identity/public`); FE-B (giao lại phiếu, chọn người cho việc HK); MOB (MT giao lại); BA thêm `operationIds` vào `rbac-matrix.json` A85 (không bắt buộc – x-rbac đã có) |
| 12 | Queue – tên món | `Item.nameI18n` (khớp `0061`), mô tả `Item.name` (VI → EN → RU), `ItemInput.name` độ dài | **BE-D** trả `nameI18n` trong `itemDto` (1 dòng); FE-B/MOB hiện theo ngôn ngữ |
| 13 | Queue – MOB locale | **Đã xong**: bổ sung 1 (`localeChosenByGuest`, `Accept-Language`) – BE-D cài `pickGuestLocale` (P-S4-10), api-client có `RequestOptions.acceptLanguage`, guest-web đọc cờ, PWA truyền theo nút | – |
| 14 | BA E19-02 | `AllowedAction` trỏ `state-machines.md` **mục 19** | **BE-A** sửa chú thích `reservations/internal/allowed-actions.ts` (1 dòng – ARC không sửa mã) |
| 15 | BE-B (f), S4-10 | `createVietQr`: `priorNightRateVnd` không kèm `addPriorNight = true` → 422 `NOT_ALLOWED`; `check_in`/`check_out` chỉ FD+, trạng thái sai → 409 `INVALID_TRANSITION`, ngoài cửa sổ → 409; không ghi dòng folio. Đã kiểm: `purpose` có `check_in`, `check_out` từ 0.3.7 | Mô tả – BE-B đã làm |
| 16 | BE-B (g), DOM-S4-15 | `focCancelReason`: **không thêm giá trị** – `settled_while_dormant` = folio chốt khi FOC chưa áp (`dormant` **hoặc** `suspended`); `reservation_cancelled` cho FOC trên dịch vụ giữ khi hủy. Lý do: báo cáo không cần phân biệt, tránh đổi CHECK DB giữa sprint | Mô tả – khớp mã BE-B |
| 17 | BE-B (h), DOM-S4-12/15 | `CancellationQuote.serviceLines[].performed`: hủy "<", no-show "≤" ngày nghiệp vụ; `amountVnd` của dòng giữ = số khách chịu (FOC không còn áp) | Mô tả – BE-B đã làm; FE-A hộp hủy/no-show đọc đúng nghĩa |
| 18 | BE-B (i), DOM-S4-13 | `restoreNoShow`: B11 đảo `room_change_difference` của đêm bị bỏ (lý do đảo riêng); B12 nhận ra theo lý do đảo và ghi lại cho đêm khôi phục; FOC `suspended` trên dịch vụ giữ → `applied` | Mô tả – BE-B đã làm |
| 19 | DOM-S4-19 | `moveReservation.expectedDeltaVnd`: đã gửi thì luôn phải khớp, kể cả khi không bắt buộc tick – lệch → 409 `SURCHARGE_CHANGED` | **BE-A đang làm**; FE-A luôn gửi số đang hiện |

Giả định: [GIẢ ĐỊNH ARC] `listAssignableStaff` là operation đọc nhỏ cần cho AC Must Sprint 4 (US-062 AC2) – thêm trong bổ sung 3 thay vì dời R3; ORC có thể gắn `x-round: R3` nếu không xếp kịp (không đổi hình dạng).

---

## 15. Bổ sung 4 – sau kiểm chứng tiền S4-38 (ARC, 17/10 – Phản hồi & sửa; commit `72fa486`)

Phần chính 0.3.7 vẫn đóng băng: mô tả + thêm có đánh dấu. Không đổi `required`, guard, `x-roles` của operation cũ.

| # | Nguồn | Hợp đồng | Ai cài / dùng |
|---|---|---|---|
| 1 | S4-38, BR-417-04…06 (BR-416-04/05) | `CheckInPreview.amountDueAtCheckinVnd` – bỏ câu "client cộng chênh": server tính **đủ** bằng một hàm cho xem trước, trần QR `check_in`, lệnh B9 (bậc BR-107 trên tổng đêm gồm B9a, giá mặc định đêm B9a theo lịch của chính đêm đó, phụ thu người đêm B9a, FOC chờ duyệt, trừ tiền thừa rồi kẹp 0 một lần). Giá B9a gõ khác mặc định: số đúng = trần QR `check_in` kèm `priorNightRateVnd` / `max` của 422. `CheckoutSummary.amountDueAtCheckoutVnd` sửa tương tự cho đêm thêm | Mô tả – **BE-A đã làm** (72fa486). **FE-A**: bỏ phép cộng chênh ở H13/H16; khi lễ tân gõ giá, lấy số từ QR hoặc từ `max` của 422 |
| 2 | S4-38, BR-309-11 | `Reservation.depositRequiredVnd` – **không thêm trường**, ghi rõ hai nghĩa theo trạng thái: `hold` = cọc phải thu để xác nhận (Desk đòi, "còn thiếu cọc"); từ `confirmed` = cơ sở phí hủy/no-show, tính lại sau B7/B8 theo tiền phòng hiện hành; Desk **không** đòi bổ sung ở đơn đã xác nhận. Lý do chọn mô tả: server đã lưu một cột và dùng đúng hai nghĩa này (`requiredDepositAfter`, `retainableDeposit`); thêm trường thứ hai chỉ để hiển thị sẽ cần migration giữa sprint | Mô tả – BE-A đã làm. **FE-A**: chỉ hiện/đòi "còn thiếu cọc" khi `status = hold` (kiểm lại H11/H12/drawer) |
| 3 | S4-38, BE-A giả định (s) | `swapRoom`: tiền theo quy tắc OTTIMO đổi căn; **contract-ahead, `x-round: R3`** (xếp tuần Ổn định hoặc R3): operation `previewSwapRoom` (GET, cùng hàm) + `SwapRoomPreview` + thân `applyDifference`, `expectedDeltaVnd`, `otherExpectedDeltaVnd` (server hiện bỏ qua). Không thêm `dryRun` vào thân (giữ quyết định 5 (1)). Tới lúc cài: server ghi chênh lệch như hiện nay, audit `money` | **Cần thêm: có** (khớp DOM-S4-06). BE-A khi ORC xếp; FE-A hộp đổi chéo; BA thêm `operationIds` cho A15 (không bắt buộc – `x-rbac` đã có); QA không viết ca tới khi bỏ `x-round` |
| 4 | S4-38, BE-B giả định (j) | `ApprovalRequest.autoCancelReason` thêm **`no_show_restored`** (B12 tự hủy yêu cầu hoàn sinh do no-show) | **BE-B**: mở rộng CHECK `approval_request.auto_cancel_reason` (migration số ORC cấp) rồi ghi giá trị mới; tới đó giữ `superseded`. UXD câu `approval.auto_cancel.no_show_restored`; client lạ → câu chung |
| 5 | DOM BR-912 v0.3.8 | `promise.kind = call_now` → `minutes` = `web_request_public_promise_call_now_minutes` (**60**), tách khỏi hạn nội bộ `web_request_same_day_after_hours_minutes` (30). Ghi chú `x-security-parameters` + erd 9.3 có khóa mới | **BE-D** khi cài US-155 (thêm dòng catalogue); FE-LP đọc `promise.minutes` |
| 6 | S4-38, BR-107 v0.3.8 | `BookingRules` mô tả: giá gõ tay là **giá lịch**, bậc BR-107 (và BR-111) áp lên, áp lại khi số đêm đổi – thay ARC-BE-S3-24.3 | Mô tả – BE-A đã làm (S438-MOVE-05); FE hiện giá sau bậc |

**Kiểm tra (17/10, sau bổ sung 4)**:

| Kiểm | Kết quả |
|---|---|
| spec-validator | OK / OK |
| Redocly | 0 lỗi, 4 cảnh báo cũ |
| `check-no-test-surface` | OK |
| `gen-openapi-meta --check` | Up to date (meta +1 operation `previewSwapRoom`) |
| api-client | Sinh lại, lần 2 up to date; vitest 30/30; tsc 0 |
| `gen_rbac_cases --check` | OK – 198 operation, 2.178 ca, R3 341 (+11 `previewSwapRoom`), mismatch [] |
| `gen_traceability --strict` | exit 0, x-rbac-field 169, 0 thiếu, 0 mã lạ |
| vitest api `contract`/`serializer`/`module-boundaries`/`crypto-boundary` | 30/30 |
| tsc api, admin-web, mobile, guest-web | 0 lỗi |
| prettier | Xanh |

Quyết định ARC: (a) `depositRequiredVnd` giữ một trường, hai nghĩa theo trạng thái (mô tả); (b) đổi chéo căn cần xác nhận "đã báo khách" như B7/B8 – contract-ahead tới tuần Ổn định/R3, xem trước bằng GET riêng (không `dryRun`); (c) `no_show_restored` thay `superseded` cho đúng nghĩa (thêm giá trị, đổi CHECK khi tiện).

**Bổ sung 4 – thêm sau lượt kiểm lại S4-38** (`reviews/s4-money-reverification.md`, chỉ mô tả):
| Lỗi | Hợp đồng | Ai cài |
|---|---|---|
| BUG-R2-127 | `amountDueAtCheckinVnd` chỉ gồm đêm B9a khi `priorNight.available = true`; `createVietQr purpose=check_in` gửi `addPriorNight` khi đêm trước không trống → 422 `NOT_ALLOWED`; B9 vẫn 409 `ROOM_UNAVAILABLE` | BE-A (`evaluate`, `amountDueForQr`); FE-A đọc `priorNight.available` |
| BUG-R2-132 | `ExtensionOptions.currentBookingRateVnd` = giá thỏa thuận của đêm (giá lịch, trước bậc – bỏ chữ "giá ròng"); chỉ có với đơn giá thỏa thuận theo **cờ nguồn giá** (migration `0064`, bù cờ đơn cũ); `null` với đơn lịch giá kể cả có đêm S4-35/B9a/B13/B18 gõ tay | BE-A (cùng BUG-R2-126) |
| BUG-R2-128 (kèm) | `depositRequiredVnd` tính lại mỗi khi tiền phòng đổi, gồm sửa giá S4-35 | BE-A |
| BUG-R2-129 | **Chỉ ghi nhận**: BE-B chọn cách nối chuỗi minibar để FOC tự khôi phục (`relatedLineId` hay khóa lượt × minibar × món); ARC xác nhận khi ORC chuyển. Yêu cầu của ARC khi xác nhận: không trừ đôi hạn mức BR-433, đúng "bất kể lịch sử thao tác" (S4-23 (4)) | BE-B → ARC |
| DOM MOVE-06 (BR-424-07) | `changeRoom.expectedDeltaVnd` đã gửi thì luôn phải khớp số tính lúc ghi, kể cả chênh 0 – lệch → 409 `SURCHARGE_CHANGED`, không lưu (như DOM-S4-19 cho B7) | BE-A |
| BUG-R2-129 – **ARC xác nhận** (18/10) | Cách BE-B nối chuỗi (`minibar.service.ts` `record()`: dòng cuối của chuỗi `related_line_id` theo từng món, gieo từ các lần đếm `checkout` của lượt ở, đi qua cả dòng đã đảo/đếm 0/void và dòng thay của `adjustFolioLine`; đếm lại > 0 nối `related_line_id` vào dòng cuối) tương đương khóa lượt × minibar × món (BR-434-15): FOC tự khôi phục = min(số đã duyệt, dòng mới), không duyệt lại, không trừ hạn mức BR-433 lần hai; không đổi hợp đồng, không migration. Điều kiện giữ: chuỗi chỉ gieo từ lần đếm `checkout` (dòng tiêu thụ `stayover` là khoản riêng, không nối); test hồi quy giữ các ca đếm 0 → đếm lại, void → đếm lại, sửa dòng → đếm lại, món rời danh mục (BUG-R2-130). **~~Xác nhận này~~ thay bằng mục 16 (18/10)**: kiểm lại lần 3 cho thấy chuỗi không đủ (BUG-R2-135) – FOC minibar chuyển sang khóa theo mã món | BE-B (đã sửa) → mục 16 |

## 16. Mô hình minibar M-1 + BR-416-06 + xác nhận QR vượt (ARC, 18/10 – tuần Ổn định, thiết kế trước khi code)

Căn cứ: `reviews/s4-money-recheck3.md` (BUG-R2-134…140), DOM chốt 18/10 (BR v0.3.8 bổ sung, decision-log dòng DOM "chốt kiểm lại lần 3"), bảng ca nháp của QA
`product/tests/test-cases/s4-minibar-matrix.md`. Ba vòng vá minibar (095/109 → 129/130 → 135…138, 140) đều vá từng nhánh của `record()`; mục này thay bằng **một mô hình** để BE-B
làm một lần. Cách "nối chuỗi, không đổi khóa" ARC xác nhận ở mục 15 **bỏ**: chuỗi không giữ được tổng FOC ≤ giá trị món khi có nhiều yêu cầu trên các mắt khác nhau (BUG-R2-135).

### 16.1 Khái niệm

| Khái niệm | Định nghĩa | Lưu ở đâu |
|---|---|---|
| Lượt ở | Folio của đơn chính (đơn con B9a/B13/B18 dùng chung folio) | `folio` |
| **Tủ** | (lượt ở, căn) – mỗi căn lượt đã ở là một tủ; B14 giữa lượt → hai tủ | `minibar_check.reservation_id` (= đơn chính) + `room_id` |
| **Lần nạp** | Mức và giá bán từng món trong tủ tại một thời điểm: lúc nhận phòng/vào căn (R2), bổ sung giữa kỳ (R3) | bảng mới `minibar_fill` + `minibar_fill_line` (16.3) |
| **Mốc** | Số lượng của món ở lần nạp gần nhất của tủ (BR-702-02) | `minibar_fill_line.qty` (vắng → danh mục hiện hành, xem R2) |
| Lần đếm | Bản `checkout` của **một tủ**; lần sau thay lần trước **cùng tủ** | `minibar_check` (UK đổi, 16.3) |
| Dòng sống của món | Dòng folio `minibar` chưa đảo của món, trong tủ | `folio_line` `category = minibar`, **`charge_code = item.code`** |
| **Khóa FOC minibar** | `item:minibar:<item.code>` trên folio – lượt × minibar × món (BR-434-15), qua mọi tủ, mọi kỳ nạp | `reductions.ts` `keyOf` |

### 16.2 Quy tắc

| # | Quy tắc |
|---|---|
| R1 | **Tủ và thay thế**: lần đếm `checkout` thay bản cũ **cùng (lượt, căn)**; không bao giờ thay bản của căn khác. `roomId` vắng = căn đang gán; căn cũ của chính lượt được; căn khác → 422 `NOT_IN_LIST`. |
| R2 | **Mốc = mức lúc nhận phòng** (DOM (b), BR-702-02) – ARC **chọn chụp mức tủ lúc nhận phòng**, cài theo kiểu **chụp khi danh mục đổi** (copy-on-write): mỗi lần sửa danh mục (định mức, giá bán, miễn phí, tắt món, thêm món), **trong cùng giao dịch**, mọi tủ của lượt đang ở **chưa có lần nạp** được ghi lần nạp `source = check_in` bằng **danh mục trước khi sửa**. Tủ chưa có lần nạp ⇒ danh mục chưa đổi từ lúc vào căn ⇒ danh mục hiện hành **chính là** mức lúc nhận phòng. Kết quả đúng như chụp ở B9/B14 nhưng gọn trong module `inventory`, không móc vào B9/B14 của BE-A, không ghi gì khi danh mục không đổi. Giả định R2: tủ căn trống được nạp theo danh mục hiện hành (HK bổ sung sau trả phòng; R3 theo dõi tồn từng tủ). |
| R3 | **Món của tủ** = món trong lần nạp gần nhất (qty > 0); tủ chưa có lần nạp → món đang hoạt động có định mức > 0. Món đã tắt/định mức 0/đổi miễn phí **sau** lần nạp vẫn ở trong tủ, vẫn hiện và vẫn đếm được tới lần nạp sau. Món thêm vào danh mục sau lần nạp → `NOT_IN_LIST`. `mode = checkout` vẫn phải đủ mọi món của tủ (`MINIBAR_ITEMS_INCOMPLETE`). |
| R4 | Đã dùng = mốc − còn lại (BR-702); còn lại > mốc → `MINIBAR_QTY_OVER_STANDARD`. |
| R5 | **Giá** = giá bán trong lần nạp (`null` = miễn phí) cho **toàn bộ** số đã dùng của kỳ nạp – cùng nguyên tắc với định mức: "đổi danh mục áp từ lần nạp sau". Một món trong một kỳ nạp chỉ có một đơn giá. DOM xác nhận 18/10 (BR-702-04); trả lời Q1/Q2 của QA ở 16.5 |
| R6 | **Giữ dòng** (DOM (e)): đã dùng = **lần đếm trước** của món trong tủ (xác nhận lại) **hoặc** = số trên **dòng folio sống** (lễ tân đã sửa/void có lý do) → giữ dòng folio sống (kể cả dòng thay của `adjustFolioLine`; void thì giữ "không dòng"), giữ FOC và nhãn; dòng của lần đếm mới **chép** `unit_price`, `amount_vnd`, `folio_line_id` theo dòng folio sống. Không phụ thuộc giá/định mức/trạng thái danh mục hiện hành (sửa 130, 137, 140). |
| R7 | **Lần đếm thật mới** (khác cả hai số ở R6; hoặc lần đếm đầu sau một lần nạp – R3) → đảo dòng sống (BR-008), ghi **một** dòng mới: `quantity` = đã dùng, `unit_price` = giá R5, `charge_code = item.code`, `serviceDate` = ngày đếm. Đã dùng 0 → chỉ đảo. |
| R8 | **FOC minibar** (BR-434-15): mọi yêu cầu FOC/giảm giá trên **bất kỳ** dòng minibar nào của món gom vào khóa `item:minibar:<code>`; **giá trị khóa** = Σ dòng sống của món trên folio (mọi tủ, mọi kỳ). Gom xong mới gọi `allocateKey(giá trị, đã duyệt theo thứ tự duyệt S4-23, chờ duyệt)` → áp_i = min(duyệt_i, giá trị − Σ áp trước); **Σ FOC ≤ giá trị** luôn đúng. Về 0 → ngủ; > 0 lại → tự khôi phục, không duyệt lại; hạn mức BR-433 trừ **một lần** lúc duyệt; chốt folio khi còn ngủ → hủy `settled_while_dormant` (BR-434-16). Dòng FOC gắn `related_line_id` vào dòng sống đầu tiên của món (hiển thị), không dùng để tính khóa. |
| R9 | **B14 giữa lượt** (DOM (c), BR-703-01): tủ căn cũ đếm như trả phòng (`roomId` = căn cũ) → sinh việc bổ sung minibar căn cũ; B14 **không** bị chặn. B18 chặn `minibar_not_checked` khi **còn tủ nào** của lượt có món tính tiền chưa đếm (`CheckoutSummary.minibarUncheckedRooms`). |
| R10 | Hiển thị: `latestCheck.totalVnd` = Σ tiền dòng folio sống của tủ = số H16 bước 1 = số B18 thu (M7 của QA). HK không thấy giá/tiền/trường folio. |

### 16.3 Dữ liệu (BE-B; số migration ORC cấp)

- `minibar_fill` (`property_id`, `reservation_id` – đơn chính, `room_id`, `source` `check_in|refill|backfill`, `filled_at`, `created_by`) + `minibar_fill_line` (`fill_id`, `item_id`, `qty` ≥ 1,
  `unit_price_vnd_snapshot` – null = miễn phí, `unit_cost_vnd_snapshot` C2). Lần nạp gần nhất = `filled_at` lớn nhất của tủ. RLS theo `property_id` như mọi bảng.
- `minibar_check`: UK một phần đổi từ (`reservation_id`) thành (`reservation_id`, `room_id`) `WHERE mode='checkout' AND replaced_by_check_id IS NULL`.
- `folio_line.charge_code = item.code` cho mọi dòng `minibar` (mã món bất biến – `NOT_EDITABLE`); bù cho dòng cũ từ `minibar_check_line.folio_line_id` → `item.code`; `adjustFolioLine` chép `charge_code` sang dòng thay.
- Bù lần nạp (`source = backfill`) cho tủ của lượt đang ở **đã có lần đếm**: `qty = minibar_check_line.standard_qty`, giá = `unit_price_vnd_snapshot` của lần đếm đó. Tủ chưa đếm: không bù (R2).
  Dữ liệu thử đã đổi danh mục trước migration có thể lệch – QA tạo lại ca.
- `payment.qr_purpose` + `payment.qr_context` (jsonb: `checkinTime`, `addPriorNight`, `priorNightRateVnd`, `checkoutAt`, `extraNightRateVnd`, `lateFeeAsNight`) – ghi lúc `createVietQr` để tính
  "còn phải thu lúc xác nhận" (16.6).

### 16.4 Bảng ca (số đúng – nguồn recheck3 + DOM 18/10)

| # | Ca | Diễn biến | Đúng | Quy tắc |
|---|---|---|---|---|
| 1 | BUG-R2-095/109/129 | Bia dùng 2 (70.000), FOC 70.000 duyệt → đếm lại còn 2 (dùng 0) → đếm lại còn 0 | FOC ngủ ở bước giữa; cuối: tự khôi phục 70.000, ròng 0, không duyệt lại, hạn mức trừ 1 lần | R7, R8 |
| 2 | BUG-R2-135 | 102: bia 2 → FOC A 70.000 → 0 → 2 → FOC B (trên dòng mới) → dùng 1 | Giá trị khóa 35.000: A áp 35.000, B 0 (ngủ); ròng 0; folio **750.000**; B18 thu 0 | R8 |
| 3 | BUG-R2-136 | 202 → 203 (B14 sự cố); tủ 202 dùng 2 bia, tủ 203 dùng 1 | Hai lần đếm không thay nhau; minibar **105.000**, tổng **1.689.000**; FOC 70.000 xin trên dòng bia 202 → ròng **35.000** | R1, R8, R9 |
| 4 | BUG-R2-137 | 302: bia sang miễn phí sau nhận phòng, đếm lại cùng 2 | Giữ **70.000**, folio **987.000**; đếm lại 3 → **105.000** (giá lần nạp) | R5, R6 |
| 5 | BUG-R2-138 | 103: bia dùng 2, OWN hạ định mức 2 → 1, đếm lại còn 0 | Mốc 2 (lần nạp chụp khi sửa) → dùng 2 → giữ **70.000**, folio **820.000**; snack nâng 1 → 2 → mốc 1 → **30.000** (không 60.000) | R2 |
| 6 | BUG-R2-140 | 301: đổi giá bia 40.000, đếm lại 2 | Giữ 70.000; lần đếm `totalVnd` = `latestCheck.totalVnd` = **70.000**, `unitPriceVnd` 35.000 | R5, R6 |
| 7 | BUG-R2-130 | Món tắt sau nhận phòng, đếm lại | Món vẫn trong `items`; cùng số giữ dòng; khác số tính theo giá lần nạp | R3 |
| 8 | DOM (e) | Bia đếm 2 (70.000) → lễ tân sửa folio còn 1 (35.000, lý do) | `adjustedAfterLastCheck = true`, `folioUsedQty = 1`; Desk mặc định gửi còn = mốc − 1 → giữ 35.000; HK đếm lại dùng 2 (xác nhận lần cũ) → giữ 35.000; dùng 3 → lần đếm mới **105.000** | R6, R7 |
| 9 | DOM (e) void | Lễ tân void dòng bia (lý do) → đếm lại dùng 2 | Giữ "không dòng" (0); dùng 1 → **35.000** | R6 |
| 10 | Món mới | Thêm món vào danh mục sau nhận phòng | Không trong tủ → `NOT_IN_LIST`; vào tủ từ lượt/lần nạp sau | R3 |
| 11 | Sửa danh mục hai lần | Định mức 2 → 1 → 3 khi lượt đang ở | Mốc vẫn 2 (chỉ lần sửa đầu chụp) | R2 |

### 16.5 Đối chiếu bảng ca nháp của QA (`s4-minibar-matrix.md`) – QA sửa bảng theo đây

| Chỗ của QA | Mô hình M-1 | QA sửa |
|---|---|---|
| **Q1** phần dùng thêm sau đổi giá theo giá hiện hành | **Không** – một đơn giá cho cả kỳ nạp = giá lúc nạp (R5). Lý do: lần đếm chỉ cho tổng đã dùng, không biết khách dùng trước hay sau lúc đổi giá; bảng giá trong phòng chỉ đổi khi nạp lại; cùng nguyên tắc DOM chốt cho định mức. Muốn ưu đãi cho khách thì dùng FOC. DOM xác nhận 18/10 (BR-702-04) | MX-A1-B2 = **70.000** / folio **862.000** (không 75.000); MX-A2-B2 = **70.000** / **862.000** (không 65.000); MX-A1-B2-C1 ròng **35.000** (không 40.000) |
| **Q2** món đã chuyển miễn phí, phần thêm 0 đ | **Không** – theo R5, phần thêm tính giá lúc nạp (35.000) | MX-A3-B2 và MX-A4-B2 = **70.000** / folio **862.000** (không 35.000) |
| **Q3** món đã tắt (hoặc định mức 0) không đếm được ở H16 | Vẫn **hiện và đếm được** tới lần nạp sau (R3); `getMinibarStandard.items` lấy theo lần nạp; lệnh đếm `checkout` phải có món đó | MX-A5-B2 = 70.000, MX-A5-B3 = 35.000, MX-A5-B4 = 0 (dòng đảo); MX-A7-B2…B4 như A6 (mốc 2) |
| **Q4** mốc khi chưa có lần đếm trước | Mức lúc nhận phòng/vào căn (DOM (b)), cài bằng chụp khi danh mục đổi (R2) | MX-A8 giữ nguyên số; MX-D1-A6: tủ 203 mốc = danh mục lúc vào căn (định mức đã hạ trước B14 → **1**), tủ 202 mốc 2 |
| M2 "mốc = `standard_qty` của dòng đếm trước" | Nguồn chính là **lần nạp gần nhất**; `standard_qty` lần đếm trước luôn bằng nó trong cùng kỳ | Ghi lại câu M2 |
| M3 "chép giá chụp và tiền của dòng được giữ" | Chép theo **dòng folio sống** (số lễ tân sửa thắng – DOM (e)); giữ cả khi đã dùng = số trên folio | Thêm ô ca 8, 9 của 16.4 |
| M4 "dòng mới nối chuỗi; phần thêm giá hiện hành" | Lần đếm thật mới đảo dòng sống, ghi **một** dòng mới = đã dùng × giá lần nạp; chuỗi không còn dùng cho FOC | Sửa câu M4 |
| M5, M6 "(DOM (c) chưa chốt)" | DOM đã chốt: FOC theo món qua hai tủ (R8, R9) | Bỏ chú thích "chưa chốt"; MX-D1-c giữ ròng 35.000 |
| Thiếu ô | Ca 8–11 của 16.4; ca HK mở H16 tủ căn cũ (`roomId`) trong ngày | Thêm |

Các ô còn lại của QA (A0, A6, A8, tầng ii trừ A1-B2-C1, tầng iii) **khớp** mô hình. Số tiền phòng của MX-D2-a QA tự đối chiếu (ngoài phạm vi minibar).

### 16.6 Ba điểm DOM chốt cho FE-A (bổ sung 4 – trường đã chốt)

**(d) BR-416-06 – phụ thu trả muộn bằng giá 1 đêm khi đêm ngày đi không bán được (BUG-R2-139)**

| Chỗ | Trường | Ý nghĩa |
|---|---|---|
| Xem trước | `CheckoutSummary.lateFeeAsNightVnd` | Có khi `extraNightRequired = true` và `extraNightAvailable = false`; = `extraNightDefaultRateVnd` (giá 1 đêm của đêm ngày đi, không tính lại bậc vì không thêm đêm) |
| Xem trước | `CheckoutSummary.amountDueAtCheckoutVnd` | Trường hợp trên: **gồm** `lateFeeAsNightVnd` (sau khi đảo phụ thu theo bậc; FOC trả muộn đã duyệt đi theo – khóa cả lượt); không bao giờ gồm đêm không bán được. Ví dụ 203: **792.000** |
| QR | `createVietQr.lateFeeAsNight: true` (`purpose = check_out`) | Trần = `amountDueAtCheckoutVnd` ở trên. Gửi ngoài trường hợp trên → 422 `NOT_ALLOWED`; gửi `extraNightRateVnd` khi không bán được → 422 `NOT_ALLOWED` |
| Lệnh ghi | `checkOut.lateFeeInsteadOfNight { amountVnd, reason, approverUsername?, authMethod, secret }` | Thay `extraNight`. Ghi dòng `late_checkout` `charge_code = late_fee_as_night` (doanh thu khác, không `stay_night`), giờ trả = giờ rời thật. Thiếu cả hai → 422 `LATE_CHECKOUT_AFTER_LIMIT` (`field` = `lateFeeInsteadOfNight`); `amountVnd` lệch → 409 `SURCHARGE_CHANGED` |
| Xác nhận | **Quyết định ARC**: quản lý xác nhận **tại quầy** – lễ tân làm B18, quản lý nhập tên đăng nhập + mật khẩu của mình (OWN/MGR gọi thì chỉ nhập lại mật khẩu của mình); **không** tạo loại yêu cầu duyệt | Người xác nhận phải là OWN/MGR của cơ sở, đang hoạt động; sai mật khẩu / tên không có / không đủ vai đều trả **cùng** 401 `REAUTH_FAILED` (`field` = `lateFeeInsteadOfNight.secret`); bộ đếm 5 sai/15 phút theo người xác nhận (SR-RL-02); audit `money` `reservation.late_fee_instead_of_night` ghi cả hai người. R3 chuyển sang PIN |

Lý do chọn xác nhận tại quầy: khách đang đứng ở quầy, cần xong ngay; luồng yêu cầu duyệt bất đồng bộ sẽ kẹt đơn ở `in_house` (đúng lỗi recheck3 thấy); `secret` đã nằm trong
`SECRET_BODY_FIELDS` (không vào băm idempotency, không vào log). Rủi ro mới: lễ tân thấy quản lý gõ mật khẩu trên máy quầy và endpoint kiểm được mật khẩu người khác – đã chặn
bằng phản hồi giống nhau + bộ đếm; **SEC xem lại** trong tuần Ổn định (không chặn BE-A). Giảm/miễn khoản này (DOM 18/10): FOC trả muộn đã duyệt đi theo; FOC mới gửi kèm
**`lateFeeInsteadOfNight.requestFoc`** (`FocRequestInput`: `kind`, `amountVnd`, `reasonCode`, `note`; không `authMethod`/`secret`) – người xác nhận tự áp trong hạn mức BR-433, cùng giao dịch B18;
vượt phụ thu → 422 `VALUE_OUT_OF_RANGE`; vượt hạn mức → 403 `APPROVAL_LIMIT_EXCEEDED`, không ghi gì. Ví dụ 203: miễn 50 % → FOC 396.000, khách trả 396.000. DOM đã xác nhận: giá lúc nạp
(BR-702-04) và `lateFeeAsNightVnd` không tính lại bậc BR-107.

**(e) Minibar – số folio đã sửa thắng lần đếm cũ**: `getMinibarStandard.items[]` thêm `lastCheckUsedQty`, `folioLineId`, `folioUsedQty`, `folioAmountVnd`, `adjustedAfterLastCheck`
(bốn trường folio chỉ FD+). "Giữ số folio" **không cần cờ riêng**: Desk gửi `remainingQty = standardQty − folioUsedQty` → server giữ dòng (R6). Đếm khác cả hai số = lần đếm thật mới.

**(f) Xác nhận QR vượt số còn phải thu**

| Câu hỏi | Chốt |
|---|---|
| Số còn phải thu lúc xác nhận | **Trần đúng mục đích QR tính lại lúc xác nhận** với ngữ cảnh lưu lúc tạo (`check_in` như `amountDueAtCheckinVnd` – đêm B9a chỉ khi còn trống; `check_out` như `amountDueAtCheckoutVnd`; `deposit` = cọc còn thiếu; `balance` = còn phải thu folio). Không so với số dư folio: QR B9a/B18 luôn lớn hơn số dư trước khi ghi đêm |
| Desk đọc ở đâu | `Payment.amountDueNowVnd` (chỉ VietQR `pending`, tính lúc đọc – trong `getFolio.payments[]`, `listPayments`) + `Payment.qrPurpose` |
| Thiếu `note` | 422 `REASON_REQUIRED`, `field` = `note`, Problem `max` = số còn phải thu lúc xác nhận; `note` ≥ 3 ký tự |
| Phần vượt | Vào `creditVnd`/`unhandledCreditVnd`, theo BR-522 (B18 `overpaymentHandling` hoặc `createRefundRequest`); không tự tạo yêu cầu hoàn; audit ghi số vượt |
| NÊN: đêm có QR `addPriorNight` chờ | **Xếp R3** (không thêm trường lúc này). Thiết kế sẵn: `searchAvailability` mỗi căn-đêm thêm `pendingPriorNightQr: { reservationCode, expiresAt }` (FD+) – Desk cảnh báo khi bán/gán |

**(a) `ExtensionOptions.currentBookingRateVnd`** – một hàm "giá gợi ý đêm kề" (BE-A `addedNightRate`) cho trường này, `CheckoutSummary.extraNightDefaultRateVnd`, giá mặc định B9a, theo thứ tự DOM chốt 18/10: (1) OTTIMO đã đổi căn (sự cố, swap, B7a; căn khách mua = căn của lần khách xin đổi cuối, không có thì căn gốc) → min(giá khách mua – giá nhập tay của đêm kề, kể cả S4-35 sửa sau khi đổi, không có thì lịch căn khách mua; lịch căn hiện tại), áp cả đơn lịch giá và đêm con Trực tiếp của đơn OTA (sự cố 201 → 401: **700.000**; Agoda 203 → 401, gia hạn thứ Tư: **792.000**); (2) đêm kề ở căn hiện tại có giá nhập tay → giá đó; (3) khách xin đổi căn → `null` = lịch căn hiện tại (201 → 401: **1.042.000**); luôn kẹp sàn–trần BR-105 căn hiện tại.

### 16.7 Quyết định ARC

| # | Quyết định | Phương án bỏ |
|---|---|---|
| D1 | Mốc = mức lúc nhận phòng, cài bằng **chụp khi danh mục đổi** (R2) | Chụp ở B9/B14 (cần cổng sang BE-A, ghi cho mọi lượt); định mức mới chỉ từ lần bổ sung sau mà không chụp (không có mốc cho tủ chưa đếm) |
| D2 | FOC minibar khóa theo **mã món** `item:minibar:<code>` (R8) | Nối chuỗi `related_line_id` (mục 15) – không giữ Σ FOC ≤ giá trị khi nhiều yêu cầu |
| D3 | Tủ = (lượt, căn) (R1, R9) | Một bản `checkout`/đơn |
| D4 | Một đơn giá/kỳ nạp = giá lúc nạp (R5) – DOM xác nhận 18/10 (BR-702-04) | Phần thêm theo giá hiện hành (QA Q1) – một món nhiều giá, không biết lúc dùng |
| D5 | BR-416-06 xác nhận tại quầy bằng mật khẩu quản lý, không yêu cầu duyệt [SEC xem lại] | Loại yêu cầu duyệt mới / chỉ OWN/MGR tự làm B18 |
| D6 | QR `check_out` dùng cờ tường minh `lateFeeAsNight` (như `addPriorNight`) | Tự cộng khi không bán được (QR vượt nếu sau đó dời được khách đến) |
| D7 | QR vượt so với trần mục đích tính lại lúc xác nhận; lưu ngữ cảnh QR | So với số dư folio |
| D8 | Cảnh báo QR chờ khi bán đêm: R3 | Thêm trường ngay |

### 16.8 Việc

| Ai | Việc |
|---|---|
| **BE-B** (inventory + folio) | (1) Migration: `minibar_fill(_line)`, UK `minibar_check` theo (`reservation_id`, `room_id`), bù `folio_line.charge_code` minibar, bù lần nạp `backfill`, `payment.qr_purpose/qr_context`. (2) `items.service`: chụp khi danh mục đổi (R2) trong cùng giao dịch. (3) `minibar.service.record()` viết lại theo R1–R7 (mốc/món/giá từ lần nạp; giữ dòng theo R6; một dòng mới theo R7; `chargeCode = item.code`); bỏ chặn giữ dòng theo giá hiện hành; `roomId`. (4) `reductions.ts`: khóa `item:minibar:<chargeCode>` cho `category = minibar`, giá trị = Σ dòng sống cùng mã; `adjustFolioLine` chép `charge_code`; bỏ logic chuỗi khỏi FOC. (5) `MinibarCheckoutPort.checkoutStatus` trả theo từng tủ; `onCheckedOut`/đếm tủ căn cũ sinh việc bổ sung. (6) `getMinibarStandard`: `items` theo lần nạp + 5 trường DOM (e), `roomId`. (7) `createVietQr` lưu ngữ cảnh + `lateFeeAsNight`; `confirmPaymentReceived` kiểm vượt → `note` bắt buộc, `Payment.qrPurpose`/`amountDueNowVnd`. Test hồi quy: 11 ca của 16.4 + bảng QA đã sửa |
| **BE-A** (reservations/checkout) | (1) BUG-R2-139: `dueAtCheckout`/`amountDueForQr` không cộng đêm không bán được; `lateFeeAsNightVnd`; `checkOut.lateFeeInsteadOfNight` (xác nhận người khác: kiểm vai OWN/MGR cơ sở, phản hồi 401 giống nhau, bộ đếm SR-RL-02 theo người xác nhận, audit hai người; kiểm `REDACT_PATHS` che `secret` lồng). (2) BUG-R2-134: hàm giá gợi ý đêm kề (16.6 (a)) dùng chung B9a/B13/B18 + `currentBookingRateVnd`. (3) `CheckoutSummary.minibarUncheckedRooms` + blocker theo mọi tủ (gọi cổng mới của BE-B). (4) Cổng tính trần theo mục đích cho BE-B dùng ở `confirmPaymentReceived` |
| **FE-A** | H16 bước 1: chọn tủ (`roomId`) khi `minibarUncheckedRooms` có căn cũ; cảnh báo `adjustedAfterLastCheck`, mặc định điền theo folio; CheckOutPage đường "phụ thu bằng giá 1 đêm" (hộp quản lý xác nhận: tên đăng nhập + mật khẩu + lý do; không hiện "còn phải thu" gồm đêm khi `extraNightAvailable = false`); QR `check_out` gửi `lateFeeAsNight`; xác nhận QR: so `amountVnd` với `amountDueNowVnd`, ô `note` bắt buộc khi vượt, đọc 422 `REASON_REQUIRED` + `max` |
| **DOM** | Đã xác nhận 18/10: R5 giá lúc nạp (BR-702-04), `lateFeeAsNightVnd` không tính lại bậc, cần `requestFoc` (đã thêm) |
| **SEC** | Xem lại D5 (xác nhận mật khẩu quản lý tại quầy) |
| **QA** | Sửa `s4-minibar-matrix.md` theo 16.5; thêm ca 8–11; ca BR-416-06 (203: 792.000, xác nhận sai → 401 giống nhau); ca QR vượt (`note` thiếu → 422) |
| **BA** | Ghi chú rbac A18: đường BR-416-06 cần OWN/MGR xác nhận tại quầy; mã lỗi trường `REASON_REQUIRED` thêm `confirmPaymentReceived.note` |

### 16.9 Kiểm tra (18/10, sau bổ sung 4 phần minibar/BR-416-06/QR)

| Kiểm | Kết quả |
|---|---|
| spec-validator | OK |
| Redocly | 0 lỗi, 4 cảnh báo cũ |
| `gen-openapi-meta --check` | Up to date (sinh lại sau mỗi khối sửa yaml) |
| api-client | Sinh lại, lần 2 up to date |
| `gen_rbac_cases --check` | OK (không thêm operation) |
| `gen_traceability --strict` | exit 0 – x-rbac-field 170, 0 thiếu, 0 mã lạ |
| vitest api `contract`/`serializer`/`module-boundaries` | 26/26 |
| prettier | Xanh |

Tất cả là **bổ sung** (trường tùy chọn, tham số query tùy chọn, mô tả) – không đổi trường cũ, không thêm operation, không `dryRun` mới.

### 16.10 Phản hồi SEC review D5 (`reviews/s4-SEC-lateFee-reauth.md`, 18/10) – ĐỒNG Ý CÓ ĐIỀU KIỆN

| Thẻ | Trạng thái | Cách xử lý |
|---|---|---|
| FB-R2-SEC-ARC-24 (Minor) | Done (hợp đồng) | `checkOut.responses` thêm `401 ReauthFailed`, `403 Forbidden` (`APPROVAL_LIMIT_EXCEEDED` của `requestFoc`, `FORBIDDEN_ACTION` của `debt`), `429 RateLimited`; `approveRequest`/`rejectRequest` thêm `429`. Mô tả `lateFeeInsteadOfNight` ghi điều kiện SEC (tìm người xác nhận theo cơ sở, 2FA chưa kiểm được → 401 giống hệt, đếm cả người gọi và người xác nhận, nghiệp vụ trước mật khẩu, thông báo người xác nhận); `authMethod`: R2 `pin` → 422 `NOT_IN_LIST`; **R3 (contract-ahead)**: chỉ `pin` hoặc `password` + `totpCode` |
| FB-R2-SEC-ARC-25 (Major) | Trả lời trong round; cài R3 | (a) **PO**: mục backlog R3 "Xác nhận phụ thu trả muộn từ xa trên máy của quản lý". ARC chọn hướng cho R3: Desk tạo yêu cầu đồng bộ hạn ngắn (vd 10 phút) loại `late_fee_as_night`, push tới OWN/MGR; quản lý duyệt trên phiên của mình bằng PIN/2FA; Desk nhận qua SSE rồi gọi B18 kèm mã yêu cầu đã duyệt (thay `approverUsername`/`secret`). Bỏ hướng "B18 treo khoản chờ duyệt, chốt folio sau" vì phá bất biến B18 (folio `settled` không còn yêu cầu tiền chờ). (b) **PO/DOM**: thêm một dòng vào hướng dẫn vận hành: *không bao giờ đọc mật khẩu qua điện thoại hoặc tin nhắn; nghi lộ thì đổi ngay*; UXR đưa vào kịch bản test khả dụng. Nếu PO/DOM kết luận phải cho lễ tân tự ghi khoản này khi vắng quản lý thì đó là chính sách → ORC mở ESC (ARC không mở) |
| FB-R2-SEC-ARC-26 (Minor, trước GL) | Ghi việc R3/GL | Trần theo ngày (≥ 2 lần khóa/24 giờ cùng người gọi hoặc người xác nhận → khóa đường này 24 giờ + cảnh báo OWN, SR-LOG-06) và bắt buộc phiên máy quầy `device_trusted` (thiếu → 403 `DEVICE_NOT_TRUSTED`, kiểm trước mật khẩu; tự xác nhận không cần) – đã ghi contract-ahead trong mô tả; tham số vào `x-security-parameters` khi cài (R3, trước GL). Việc: BE-A (R3), SEC kiểm trước GL |

Việc BE-A theo SEC (BE-59…64) giữ nguyên như thẻ SEC; ARC không đổi trường nào ngoài `responses` và mô tả.

### 16.11 Duyệt vòng sửa 3 của BE-A (`outputs/BE/s4-be-a.md` mục 14, 18/10)

| Điểm | Kết luận ARC |
|---|---|
| Mã audit `reservation.late_fee_instead_of_night` vào danh sách đóng `AuditEvent.action` (`openapi.yaml`) + `money-actions.ts` | **Đồng ý** – mã mô tả `checkOut` đã dùng; test `module-boundaries` giữ hai bên khớp. UXD/FE thêm câu `mlog.a_reservation_late_fee_instead_of_night` (thiếu thì `mlog.a_other`) |
| `ReservationSalesPort.amountDueNowFor(tx, AmountDueQuery)` (D7) | **Đồng ý** – cùng hàm tính với `amountDueFor`, không từ chối (bỏ tùy chọn hết hiệu lực; đơn đã qua bước → số dư folio), đúng 16.6 (f). Đã soát thứ tự khóa: `confirmPaymentReceived` khóa `payment` + `folio` rồi gọi cổng; đường `amountDueNow` chỉ **đọc** đơn (`loadReservation` không `forUpdate`, không khóa đơn con) nên không đảo thứ tự khóa "đơn → folio" của B9/B18. Điều kiện giữ: cổng này không bao giờ thêm `FOR UPDATE` |
| (r3-1) "căn khách mua" = căn của lần khách xin đổi cuối, không có thì căn gốc; min chỉ Trực tiếp/CTV; ngày đặc biệt min giữa hai lịch đặc biệt | DOM chốt 18/10: **sửa phạm vi** – min áp cả đêm con Trực tiếp của đơn OTA (B9a, gia hạn, B18; Agoda 203 → 401 gia hạn thứ Tư 792.000). Việc BE-A. Mô tả `currentBookingRateVnd` đã sửa |
| (r3-2) đêm S4-35 gõ sau OTTIMO đổi căn vẫn qua min | DOM chốt 18/10: **đồng ý** – min sau OTTIMO đổi căn đứng trước "giá nhập tay ở căn hiện tại"; 16.6 (a) và mô tả `currentBookingRateVnd` đã đổi thứ tự (mã BE-A `addedNightRate` đã đúng) |
| (r3-4) `requestFoc` của BR-416-06 chỉ `kind = foc` | **Đồng ý** – đã ghi vào mô tả `lateFeeInsteadOfNight.requestFoc` (`special_discount` → 422 `NOT_IN_LIST`, `field` = `lateFeeInsteadOfNight.requestFoc.kind`) |
| (r3-5) người xác nhận không đủ điều kiện không bị tăng bộ đếm | Đúng thẻ SEC BE-60 |

**16.12 Giả định BE-B khi cài M-1 (`outputs/BE/s4-be-b.md` mục 13, 18/10) – ARC xác nhận**: (n) danh mục chưa có món minibar thì không chụp lần nạp – **đồng ý** (chỉ lệch một lần lúc bắt đầu dùng minibar giữa lượt: món đầu tiên vào luôn tủ đang ở, chấp nhận ở R2); (o) phòng của lượt = segment + mọi tủ đã có lần nạp/lần đếm, B14/B18 ghi nhận tủ qua `onCheckedOut` – **đồng ý có điều kiện**: `onCheckedOut` ở B14 phải ghi nhận tủ căn cũ **vô điều kiện** (chụp lần nạp nếu tủ chưa có), kể cả khi chưa đếm và chưa đổi danh mục, để B14 đêm đầu (ghi đè segment) không làm mất tủ khỏi `minibarUncheckedRooms` – test: B14 đêm đầu không đếm trước → B18 chặn tới khi đếm tủ cũ; (p) `latestCheck` tủ căn cũ = lần đếm sống bất kể ngày, tủ đang ở theo ngày nghiệp vụ – **đồng ý**; (q) dòng minibar mang mã món vẫn sửa giá (miễn `PRICE_NOT_EDITABLE`) – **đồng ý**, đúng DOM (e); `adjustFolioLine` chép `charge_code` nên khóa FOC giữ nguyên.

