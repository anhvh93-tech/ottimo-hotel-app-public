# BE-C – Round 2, Sprint 4: buồng phòng – bảo trì (nhóm H), giấy tờ C3 (S4-39, S4-11/32), tệp (S4-17)

- Vai: BE (luồng BE-C) | Ngày: 17/10/2026 | Bước: Sản xuất – Việc 0 + các mục CỔNG tuần 1 | **Không commit** (ORC commit).
- DB test riêng: `ottimo_test_bec_s4` (cây chung) và `ottimo_test_bec_s4_iso` (cây cô lập = HEAD + tệp của BE-C) trên `ottimo-dev-postgres-1`. Không đụng stack demo (8181–8183/3100). Stack tạm `ottimo-bec-s4` (cổng 46xxx) dùng cho Việc 0 **đã gỡ** (`down -v`). Script và env của BE-C nay chỉ nằm trong `scratchpad/bec-s4/`; `bec-newdb.sh` từ chối mọi tên DB không bắt đầu bằng `ottimo_test_bec_`.
- Đầu vào: `sprint-4-plan.md` (mục 4, 8.2, 8.2b, bảng phân việc), `openapi.yaml` 0.3.7 (nhóm H, nhóm D mục A + A.3, B-14), `specs/EP07-08-housekeeping-maintenance.md`, `state-machines.md` (SM-02, SM-03, SM-04, SM-14), BR-802…812, BR-951/952/955, `rbac-matrix.md`, SEC s3 mục 7, `s4-be-d.md` mục 2.2–2.3.

## 1. Đã làm

### 1.0 Việc 0 – TC-L7-010 (`guest-web.h18.spec.ts:90`, CI 39028814256) – BUG-R2-105
- **Nguyên nhân: ca test, không phải API.** Ca chụp giấy tờ cho Khách 2 tìm nút "Chụp" bằng `.nth(1)` trên toàn trang. Thứ tự đó chỉ đúng khi Khách 1 **còn đang** tải lên. Máy CI chậm thì Khách 1 xong trước, nút "Chụp" của Khách 1 biến mất, `.nth(1)` không còn trỏ tới nút nào. Tái hiện trên stack tạm bằng cách hãm CPU ×10 qua CDP: bản gốc hỏng 2/3 lần, bản sửa đạt 3/3. So phản hồi `getOnlineCheckin`/`guestUpload` với hợp đồng: không lệch. Migration 0055 (CHECK) không liên quan.
- Bản sửa test (`photo()` chọn nút theo `aria-describedby` của đúng người, chờ nút biến mất) là bản QA đã xác nhận dưới mã BUG-R2-105.
- **API: không đổi dòng nào cho Việc 0.** Chỉ thêm 1 test tích hợp ở `guest-portal.test.ts` cho đúng ca đã hỏng (2 khách, tải tuần tự rồi song song → 201/201, `uploadedPeople` [1] rồi [1,2]). ORC có thể giữ test này hoặc bỏ.

### 1.1 S4-39 – bỏ người khỏi đoàn theo phương án chính (BUG-085; SEC-BE-53/57/58 (2))
- `removePartyMember` nhận `guestUploadPersonIndex`, gồm cả phần BE-A cũ. Tôi sửa `frontdesk/public/ports.ts`, `frontdesk.controller.ts` (`@Query`) và `party.service.ts` (chuyển tham số tiếp). **BE-A cần review 3 tệp này.**
- Giấy tờ **gắn với người bị bỏ** bị hủy ngay: DEK, tệp xóa sau COMMIT, trường NULL, `purge_journal`, c3 `delete`.
- Ô "Khách n" (n ≥ 2) do lễ tân chọn bị hủy ngay. Các ô phía sau dồn số (1..k liên tục). Đồng ý P02b và lựa chọn "bổ sung tại quầy" đi theo đúng người (`shiftDeferredPeople`).
- Chọn `none`: không hủy gì. Lựa chọn được audit, chỉ ghi số ô hoặc `none`.
- Khi người bị bỏ chưa có giấy tờ gắn mà còn ô ≥ 2 → 422 `REQUIRED` kèm `personIndexes[]`. Chọn một số khi không cần → 422 `NOT_ALLOWED` (SEC-BE-58 (2)). Chọn số không phải ô hợp lệ → 422 `NOT_IN_LIST`.
- SEC-BE-57 (`legal_hold`): không hủy gì, không ghi c3 `delete`. Giấy tờ chỉ chuyển sang trạng thái rút (`removed_at`); J16 hủy và ghi log khi gỡ giữ (`purgeRetiredDocuments`, bước 0c).
- `GuestDocumentLink` (PATCH chỉ có `partyMemberId`) gắn giấy tờ đang chờ người, không cần trường C3. `DOCUMENT_UNCLAIMED_EXISTS` trả kèm id và `personIndex`. DTO có thêm `personIndex` và `unclaimedUntil`. Giấy tờ chờ gắn người không vào luật `legal_hold` sai chỗ (`unclaimedDocumentStays`).
- Phương án dự phòng 24 giờ chỉ còn dùng khi cắt số người mà lễ tân không chọn ô.

### 1.2 S4-17 – upload pipelining giữ ~1 GB (đóng bằng test cục bộ)
- `http.ts`, `readBody`: giải phóng `body = null` khi đọc xong, gỡ handler lỗi. Lỗi stream đến muộn đi vào hàm noop cấp module, nên không giữ lại closure.
- Upload **pipelined** sau một request chưa trả lời trên cùng kết nối → 429 `RATE_LIMITED` (`Retry-After: 5`) **trước khi đọc thân và trước khi kiểm phiên**.
- Test `upload-gate-socket.test.ts`: socket thô gửi 2 upload pipelined → nhận `200` rồi `429`, sau đó kết nối đóng. Phần kiểm qua Caddy thật thuộc S4-15 (VPS).

### 1.3 Module `housekeeping` – nhóm H (US-052…055, 057, 061, 062; B-14; J8/J11)
- **Migration 0056**:
  - các bảng `inspection`, `work_order`, `inspection_checklist` (RLS, grant, CHECK);
  - FK chéo module `room_block.work_order_id → work_order` (chỉ ở SQL, theo 4.2a-2e);
  - khóa catalogue `wo_done_photo_required_severities`.
  - Schema: `src/db/schema/housekeeping.ts`.
- **B-14**: `RoomStatusService` chuyển sang `housekeeping/public`. `frontdesk/public/room-status.service.ts` chỉ re-export.
- **13 operation**: `listRoomStatuses`, `transitionRoomStatus`, `getInspectionChecklist`, `recordInspection`, `listInspections`, `listHkTasks`, `createHkTask`, `transitionHkTask`, `listWorkOrders`, `createWorkOrder`, `getWorkOrder`, `updateWorkOrder`, `transitionWorkOrder`.
  - Phạm vi T của HK: ngoài phạm vi thì không có tên khách; ghi vào đó → 404.
  - MT chỉ đọc.
  - `allowedEvents` và `allowedActions` do server tính.
  - `performedAt` trong khoảng [−24 giờ, +5 phút]. `expectedFrom` lệch → 409 kèm `currentState`.
  - Có `roomName` (BR-012) trong `RoomStatusEntry`, `HkTask` và `WorkOrder`.
- **Kiểm phòng (BR-808)**: 12 điểm, thêm mục động "bộ đồ dùng thêm × n".
  - Đạt → `VI` (R4).
  - Không đạt → `VC`, sinh việc dọn lại, gắn cờ `inspectionFailed`.
  - Checklist cũ → 409 `CHECKLIST_OUTDATED`.
  - HK tự kiểm chỉ khi bật `hk_self_inspection_enabled` và bắt buộc có ảnh.
- **Việc hôm nay (BR-807)**: 7 hạng ưu tiên, tính lúc đọc. HK chỉ hủy được việc dọn khách đang ở và phải có lý do. FD chỉ tạo tay được các loại cho phép.
- **Phiếu sửa (SM-04, BR-809)**:
  - Mức đề xuất tính theo loại và tình trạng có khách. Hạn xử lý theo `wo_sla`.
  - Chuyển trạng thái W2…W6 có lịch sử (đọc từ `state_transition` + audit).
  - Xong phiếu → nhả khối OOO, căn chuyển `VD`, sinh việc `after_repair_clean`.
  - Khối OOO tạo từ phiếu: chỉ nhận đúng một trong hai trường `endDatePlanned` hoặc `expectedDoneDate`. Server cộng `ooo_reopen_buffer_days` (BR-804). Sửa trong `reservations/internal/room-blocks.service.ts` và tệp mới `reservations/public/room-block.port.ts`. **BE-A review.**
- **Job J8 `hk.daily`**:
  - khách ngắn ngày `OC → OD` + `stayover_clean`, thay ga theo `linen_change_every_nights`;
  - việc dọn khách ở lại của hôm trước → hủy với lý do `day_ended`;
  - các loại việc khác → `carried_over`.
- **Job J11 `work_order.sla`**:
  - quá hạn → báo **một lần**; mức cao báo thêm MGR/OWN;
  - mức cao ở căn có khách → `remedy_suggested_at`;
  - R5 `VI → VC`;
  - căn OOO bị hủy các việc dọn còn mở (R10).
- **Thông báo HK/MT**: `work_order_new`, `work_order_high_new`, `work_order_block_requested`, `work_order_overdue`, `room_awaiting_inspection`, `hk_task_urgent`, `hk_task_cancelled`.
- **"Cần chú ý" (BE-D yêu cầu, `s4-be-d.md` 2.2)**: `work_order_high_open`, `work_order_overdue`, `ooo_ending_work_open` (từ 12:00 ngày khóa cuối), `room_status_mismatch` (BR-806, chỉ báo, không tự sửa). Chỉ FD+ thấy. `params` lọc theo `ATTENTION_PARAM_KEYS` của BE-D.
- **Cổng EP14** (`s4-be-d.md` 2.3): **đồng ý, có 2 chỉnh**.
  - `createTask` không sinh `hk_task_urgent`.
  - `cancelTask` chỉ hủy việc còn `open`.
  - Đã bind `GUEST_REQUEST_WORK_PORT` (`GuestRequestWorkAdapter`), nối `HousekeepingModule` vào `feature-modules.ts`, dùng `GUEST_REQUEST_STATUS_PORT` của BE-D (tùy chọn).
- **Migration 0057 (phần FK EP14)**: `hk_task.guest_request_id` và `work_order.guest_request_id` → `guest_request`; `guest_request.work_order_id` → `work_order`. Bọc trong `to_regclass`, nên chạy được cả khi chưa có bảng của 0058. Trên cây chung (journal: 0058 ở idx 35, 0057 ở idx 38) cả 3 FK đã được tạo; đã kiểm bằng `pg_constraint`.
- **S4-31, phần việc dọn** (bổ sung cuối buổi):
  - B13 gia hạn làm căn `OC → OD` → căn có `stayover_clean` trong ngày (J8 đã bỏ qua căn này vì khách đi hôm nay). Nếu căn còn `checkout_clean` mở thì việc đó đổi thành `stayover_clean` (US-028 AC4).
  - `checkout_clean` hiện `notBeforeTime` = giờ trả đã chốt (`agreed_checkout_time`), tức "dọn sau <giờ trả>" (US-029 AC4).
  - Làm trong `RoomStatusService.set` (sự kiện `B13`) và câu đọc `listHkTasks`. Không sửa mã của BE-A.
- **Tin khẩn "treo `startFeatureApp`"**:
  - Đã tái hiện: dựng lại cách nối cũ (`GUEST_REQUEST_STATUS_PORT` lấy từ `GuestRequestsService`) → ứng dụng không khởi động trong 20 giây và Nest không báo lỗi. Đó là vòng phụ thuộc `HousekeepingService → STATUS_PORT → GuestRequestsService → WORK_PORT → HousekeepingService`.
  - BE-D đã gỡ vòng ở phía guest-portal lúc 20:06 (tách `GuestRequestLifecycle`).
  - Theo ORC, **tôi đã hoàn lại** bản sửa phía mình (resolve qua `ModuleRef` – vốn cũng vi phạm ARC-BE-S3-16). `housekeeping.service.ts` giống hệt bản trước đó. Test tạm đã xóa.

### 1.4 S4-11/32 – hồ sơ khách "từ giấy tờ" (nhóm D mục A + A.3)
- **Migration 0057**:
  - cột `guest_document.possible_returning_guest`;
  - khóa catalogue `document_profile_retention_months` (1–12, mặc định 12, chỉ OWN, `is_security`).
  - Đã **bật dòng A.3** trong `openapi.yaml` (`x-security-parameters`) và sinh lại `src/generated/openapi-meta.ts`, `openapi-schemas.ts` (test kiến trúc catalogue ↔ OpenAPI đạt). **ARC review.** Bản sinh lại có cả các thay đổi `openapi.yaml` đang chờ của luồng khác.
- **Khóa giấy tờ v1**: `v1:` + HMAC theo mục đích `guest_doc` (`CryptoService.keyedHash`, HKDF riêng). Đầu vào gồm loại, nước cấp (alpha-3), số đã chuẩn hóa (erd 4.4). Chỉ tính trong bộ nhớ, không ghi log.
- **Thứ tự khớp** ở `addGuestDocument` khi lễ tân không chọn `partyMemberId` (`frontdesk/internal/document-party.port.ts`, viết lại – **BE-A review**):
  1. thành viên trong đơn có khóa trùng, hoặc trùng tên + ngày sinh;
  2. hồ sơ P05 ngoài đơn có khóa trùng → thêm làm người đi cùng `unknown`;
  3. người lớn không khớp ai → tạo hồ sơ `source = document` tối thiểu (tên như trên giấy tờ + quốc tịch, `crm_consent = not_asked`).
  - Trẻ chưa thành niên không khớp → không tạo hồ sơ.
  - Bước 2–3 được vượt số người đã khai, có cờ `overCount`.
  - Trùng tên + ngày sinh với hồ sơ **ngoài đơn** → không tự gắn, chỉ bật `possibleReturningGuest = true` trên `GuestDocumentMasked` (FD+).
- **P05_CRM tại quầy** (`recordImageConsent` với `purpose = P05_CRM`):
  - đồng ý → `crm_consent = granted`, hồ sơ giữ khóa v1 + `id_doc_last4` của giấy tờ này;
  - từ chối/rút → `refused`, xóa khóa và 4 số cuối trong cùng giao dịch (SEC F03);
  - ghi `consent_record`.
  - Thêm giấy tờ mới cho người đã có P05 → cập nhật khóa (`keepDocKey`). Khóa đang thuộc hồ sơ sống khác thì không chép (đó là trường hợp gộp hồ sơ).
- **Module guests** (BE-B chủ – **cần review**):
  - `DocumentProfileService` (`@Global`, export);
  - `Guest.source`; `idDocLast4` chỉ có khi P05;
  - SAL/CTV không thấy hồ sơ `document` chưa P05 (kể cả hồ sơ do họ tạo);
  - `updateGuest` với hồ sơ đó: `tags`, `freeNote`, `serviceNotes`, `dateOfBirth`, `gender` → 422 `NOT_ALLOWED`; các trường khác sửa được, không bắt buộc liên hệ.
- **J25 `guest.document_profile_anonymize`** (03:30, T05):
  - phạm vi: hồ sơ `document` chưa P05, lần trả phòng cuối đã quá `document_profile_retention_months`;
  - kết quả: tên → `ANON <mã>`, ghi `anonymized_at` + `purge_journal` (`T05`, `anonymize`);
  - giữ lại: mã, quốc tịch, cờ người nước ngoài.
  - J25 **tự bù** `last_stay_checkout_at` từ các lưu trú `checked_out` của căn hộ, nên hạn lưu không phụ thuộc việc BE-A có gọi `touchLastStay` hay không.
  - Không bao giờ ẩn danh hồ sơ còn lưu trú `hold`/`confirmed`/`in_house`.
  - Đăng ký ở module (api) và `worker.ts`.

## 2. Test và cổng chất lượng
| Kiểm | Kết quả |
|---|---|
| Vitest api, **cây cô lập** (HEAD + BE-C), DB mới – lượt cuối, sau S4-31 | **63/63 tệp, 2363/2363 ca đạt** |
| Vitest api, **cây chung**, DB `ottimo_test_bec_s4` mới – lượt cuối, sau S4-31 | **2605/2605 ca đạt**. Chỉ tệp `schema-parity` đỏ, đúng thiết kế: chờ ORC sinh snapshot 0056–0061. Một lượt giữa chừng còn đỏ `move-pricing.test.ts:1082` (tệp BE-A đang sửa dùng cột `rank`); lượt cuối đã xanh |
| Test mới/sửa của BE-C | `housekeeping-s4` (10 ca, gồm "Cần chú ý" và S4-31), `rbac-sprint4-bec`, `guest-document-profiles` (3 ca: P05, khớp khóa, hồ sơ từ giấy tờ, cờ khách quen, ẩn SAL, 422 `NOT_ALLOWED`, J25), `registration-party-removal` (viết lại cho S4-39), `upload-gate-socket` (S4-17), `guest-portal` (TC-L7-010), `files-attachments`, `registration-flow` (A-38 theo phương án chính), `frontdesk-s3-fixes` (BUG-R2-033 viết lại theo mục A – **tệp BE-A**) |
| `tsc --noEmit` (cây chung), `eslint` các tệp BE-C, `prettier --check` | Sạch |
| `pnpm build` (cây cô lập) | Đạt |

## 3. Tệp chạm vào module của luồng khác (chủ module review)
- **BE-A**:
  - `frontdesk/public/ports.ts`, `frontdesk/internal/frontdesk.controller.ts`, `frontdesk/internal/party.service.ts` (S4-39);
  - `frontdesk/internal/document-party.port.ts` (S4-11);
  - `frontdesk/public/room-status.service.ts` (shim B-14);
  - `reservations/internal/room-blocks.service.ts`, `reservations/public/room-block.port.ts`, `reservations/reservations.module.ts`;
  - `test/integration/frontdesk-s3-fixes.test.ts` (ca BUG-R2-033: hồ sơ ngoài đơn phải có `name_search` không dấu như module guests).
  - **Việc BE-A cần làm**: gọi `DocumentProfileService.touchLastStay(tx, guestIds, at)` ở B18/B16 (J25 đã tự bù nên đây không phải cổng chặn, nhưng là nguồn chính xác hơn).
- **BE-B**: `guests/guests.module.ts`, `guests/internal/guest-mapper.ts`, `guests/internal/guests.service.ts`, `guests/public/document-profile.service.ts`, `guests/public/worker-jobs.ts`; `crypto/public/crypto.service.ts` (thêm `guest_doc`). Migration 0055 **không đụng**.
- **BE-D**: dùng `ATTENTION_PARAM_KEYS`, `GUEST_REQUEST_STATUS_PORT`; FK `guest_request` trong 0057.
- **ARC**:
  - `docs/api/openapi.yaml` (bật dòng A.3) và `src/generated/*` sinh lại;
  - `schema-parity.test.ts` (`CROSS_MODULE_FKS` thêm `room_block_work_order_fk`, `hk_task_guest_request_fk`, `work_order_guest_request_fk`, `guest_request_work_order_fk`).
- **Dùng chung**:
  - `feature-modules.ts` (thêm `HousekeepingModule`);
  - `worker.ts` (J8/J11, J25);
  - `db/schema/index.ts`;
  - `migrations/meta/_journal.json`: 0056 idx 36, 0057 idx 38. **Chưa sinh snapshot** – ORC sinh khi tích hợp.

## 4. Giả định
- [GIẢ ĐỊNH] Checklist kiểm phòng mặc định 12 điểm nằm trong mã (version 1) khi căn hộ chưa có dòng `inspection_checklist`. Bản EN/RU là bản dịch của BE; nội dung BR-808 chờ INV, nhãn chờ UXD.
- [GIẢ ĐỊNH ARC – SEC chốt] `idDocLast4` chỉ trả khi P05 (cùng luật với `id_doc_hmac`).
- [GIẢ ĐỊNH] Trẻ chưa thành niên không khớp ai thì giấy tờ để chưa gắn người (không tạo hồ sơ – rbac 9).
- [GIẢ ĐỊNH] BR-804 v0.3.2 ghi `endDateActual`, hợp đồng ghi ngày nghiệp vụ → khi nhả khối dùng **ngày nghiệp vụ**.
- [GIẢ ĐỊNH] `dnd` (khách treo biển) chỉ phát SSE, không có loại thông báo riêng.
- [GIẢ ĐỊNH] `createHkTask` vào căn đang khóa → 409 `ROOM_BLOCKED` (mã chưa khai trong hợp đồng – ARC xem). Tạo trùng việc dọn khách ở lại trong ngày → trả việc đã có.
- ~~[GIẢ ĐỊNH] Việc dọn khách ở lại sinh do B13 không có cờ thay ga~~ → đã theo DOM-S4-16 (a), xem mục 7.
- [GIẢ ĐỊNH] Hiện chưa ghi `state_transition` cho các lần chuyển trạng thái bị từ chối.

## 5. Rủi ro
- Snapshot 0056–0061 chưa có → `schema-parity` đỏ tới khi ORC sinh.
- ~~0057 thêm FK `guest_request` chỉ khi bảng đã tồn tại~~ – ORC đã chuyển 3 FK sang 0058 khi tích hợp.
- ~~`RoomStatusService` khai ở 2 module~~ – nay chỉ HousekeepingModule cung cấp (mục 7).
- ~~TC-L3-032(a) cần điều kiện P05~~ – đã thêm vào tiền điều kiện của ca (mục 7).

## 6. Việc chưa xong (NÊN) và ghi chú
- S4-12, S4-46, US-058 phía server: đã làm ở lượt 2 (mục 7).
- Không ESC mới.

## 7. Lượt 2 (sau tích hợp của ORC 17/10, HEAD 0b605f3/b6153b7)

### 7.1 Đã làm
| Việc | Cách làm | Test |
|---|---|---|
| **BR-424-05 phần HK** (S4-09) | J8 dùng `roomReturnsOn()` của BE-A. **Căn khách chuyển về** không sinh `stayover_clean` và không đổi `OC→OD`. Căn sạch (VC/VI/OC) → không làm gì. Căn chưa sạch (VD/OD/CL): việc dọn đang mở được đặt hạn = `checkout_time`; nếu không có việc nào mở thì sinh `priority_clean` (hạn `checkout_time`, `priority_rank` 2, ghi chú `room_return`). Mỗi ngày chỉ một lần. **Căn khách rời đi** không bị J8 đặt `VD`. `listHkTasks` xếp mọi việc dọn của căn khách chuyển về ở hạng "khách đến" (2), kể cả `priority_clean`. BR-806: căn đang chờ khách về **không** báo lệch trong ngày về; nếu sáng hôm sau vẫn chưa ghi chuyển về thì báo lệch (`notRecordedByNextMorningCheck`). Đã **bỏ `pendingFix: S4-09`** của BR-424-05 trong `tests/fixtures/br-examples.json` | `housekeeping-s4` – ca BR-424-05 đọc oracle (đủ 3 kịch bản + kiểm tra lệch BR-806); `move-pricing` (phần BE-A) vẫn xanh |
| **S4-12 / BUG-R2-054** | J16 xóa ảnh của khai báo chưa bao giờ `confirmed` (SR-RET-02 `unconfirmed`) nay ghi `Registration.imagesPurgedAt` + `imagesPurgeReason = retention` (enum hợp đồng không có `unconfirmed` – [GIẢ ĐỊNH BE-C, ARC xem]). `replaced`/`party_removed` không ghi vì chỉ là xóa giấy tờ của một người | `registration-flow` (SEC BE-32). **E2E TC-L3-074 (a)+(b) đạt** trên stack riêng → đã xóa `BUG-R2-054` khỏi `OPEN` |
| **BUG-R2-033** (S4-11) | Ca TC-L3-032 (a) viết lại theo hợp đồng 0.3.7: trong tiền điều kiện, người đứng tên lần ở trước đồng ý **P05_CRM** (SEC F03: khóa giấy tờ chỉ có ở hồ sơ P05) | **E2E TC-L3-032 (a)+(b) đạt** → đã xóa `BUG-R2-033` khỏi `OPEN` (QA review tệp `known-bugs.ts` và ca (a)) |
| **Minor review BE-A** – khối OOO rỗng | Khi `ooo_reopen_buffer_days = 0` mà `expectedDoneDate = startDate` thì khối có 0 đêm → 422 `DATE_ORDER` (`createRoomBlock`: `expectedDoneDate`; `createWorkOrder`: `block.expectedDoneDate`). Kiểm `end > start` sau khi đã cộng đệm | `housekeeping-s4` – ca BR-804 đệm 0 |
| **DOM-S4-16 (a)** | Hàm chung `linenChangeDue(every, nights)`. Số đêm tính từ ngày đến **đầu tiên** của lượt ở (đơn con gia hạn tính theo đơn cha), dùng cho cả J8 và việc dọn khách ở lại sinh do B13 (sinh mới hoặc đổi từ `checkout_clean`) | `housekeeping-s4` – S4-31: 2 đêm → không thay ga, 3 đêm → thay ga |
| **DOM-S4-16 (b)** – BR-601 v0.3.8 | Giấy tờ **trẻ em** chưa gắn người không bị đặt hạn "chưa gắn" và không bị J16 xóa khi khai báo chưa `confirmed`/`updated`. Giấy tờ trẻ em chưa gắn người (lễ tân nhập, hoặc ô của link) hiện ở "Cần chú ý" `registration_party_docs_unlinked` **không kèm `dueAt`** | `registration-party-removal` (ca mới), `guest-document-profiles` (giấy tờ trẻ em không khớp ai) |
| **S4-46** | Tiến trình dev/test chạy bằng khóa tạm sẽ ghi **một** dòng `warn` khi khởi động, chỉ nêu **tên** biến thiếu (`DATA_KEK_CURRENT`, `ID_HASH_KEY`), không bao giờ ghi giá trị. Không ghi trong lúc chạy vitest. Sửa chú thích trong `product/.env.example`. Việc điền khóa vào `product/.env` của máy thuộc OPS – BE-C không đụng `.env` | `crypto-units` (ca mới) |
| **US-058 phía server** | Kiểm đủ các điều kiện EP07 mục 8.3–8.4: gửi lại cùng `Idempotency-Key` → trả kết quả lần đầu, chỉ một lần chuyển; HK thứ hai → 409 với `currentState` = đích ("đã áp dụng"); "Dọn xong" xếp hàng lúc 10:42, khách trả phòng 10:50, gửi 11:05 → `VC` (R3) theo dữ liệu lúc nhận, lịch sử giữ `performed_at` của máy; căn bị khóa trong lúc mất mạng → 409 `OOO`. Không cần đổi mã | `housekeeping-s4` – ca US-058 |
| Gợi ý BE-A | (1) `RoomStatusService` **chỉ còn 1 instance**: bỏ provider/export ở `frontdesk.module.ts` (tệp BE-A – sửa 3 dòng + chú thích đầu tệp), HousekeepingModule (global) export. (2) `addCompanion` (document-party port) phát `reservation.changed` | toàn bộ vitest |

### 7.2 Kết quả kiểm
- Vitest api, **cây cô lập** (HEAD + BE-C), DB mới: **75/75 tệp, 2620/2620 đạt**.
- Vitest api, **cây chung**, DB `ottimo_test_bec_s4` mới: 2635/2636 đạt. Chỉ đỏ `contract.test.ts`, vì `docs/api/openapi.yaml` đang được sửa dở (+342/−101 dòng, không phải BE-C) mà chưa sinh lại `src/generated/*` – ARC/ORC chạy `gen:openapi`.
- E2E trên stack riêng `ottimo-bec-s4` (ảnh `ottimo-api:bec-s4b` = dist của cây cô lập; DS-E; `E2E_COMPOSE_PROJECT=ottimo-bec-s4`): TC-L3-032 (a)(b), TC-L3-074 (a)(b) đạt.
- `tsc` (api, cây chung), eslint, prettier các tệp BE-C, `validate-fixtures` (0 lỗi): sạch.

### 7.3 Tệp lượt 2
- Của BE-C:
  - `services/api/src/modules/housekeeping/{public/worker-jobs.ts, public/room-status.service.ts, internal/housekeeping.service.ts, internal/attention-sources.ts, internal/rules.ts, internal/work-orders.service.ts, housekeeping.module.ts}`;
  - `services/api/src/modules/registration/internal/{registration.service.ts, attention-sources.ts}`;
  - `services/api/src/modules/crypto/internal/keyring.ts`;
  - test: `housekeeping-s4`, `registration-flow`, `registration-party-removal`, `guest-document-profiles`, `crypto-units`.
- Chạm module khác, cần chủ module review:
  - BE-A: `frontdesk/frontdesk.module.ts`, `frontdesk/internal/document-party.port.ts`, `reservations/internal/room-blocks.service.ts`;
  - QA: `tests/e2e/support/known-bugs.ts` (xóa BUG-R2-033, BUG-R2-054), `tests/e2e/api/checkin.s3.api.spec.ts` (tiền điều kiện P05 của TC-L3-032 a), `tests/fixtures/br-examples.json` (bỏ `pendingFix` của BR-424-05);
  - OPS: `product/.env.example` (chú thích).

### 7.4 Giả định mới
- ~~[GIẢ ĐỊNH BE-C – ARC] `imagesPurgeReason` của SR-RET-02 = `retention`~~ → ARC bổ sung 3 #8 đã thêm `unconfirmed` (mục 8).
- [GIẢ ĐỊNH BE-C] Căn khách chuyển về: "chưa sạch" = VD/OD/CL; căn vẫn OOO thì không làm gì (J11 hủy việc dọn).
- [GIẢ ĐỊNH BE-C] "Khai báo xong" của BR-601 v0.3.8 = registration `confirmed`/`updated`.

## 8. Lượt 3 – ARC bổ sung 3 (HEAD 6f8d429)

### 8.1 Đã làm
| Việc | Cách làm | Test |
|---|---|---|
| **`listAssignableStaff`** (#11, US-062 AC2, A85) | `GET …/assignable-staff?department=housekeeping\|maintenance`. Trả `{ data: [{ userId, displayName, department }] }`, sắp theo tên, không phân trang, **không** SĐT/email/tên đăng nhập/vai khác. `department` vắng → 422 `REQUIRED`; sai → `NOT_IN_LIST`. Vai theo `x-roles` (FD+, MT; HK → 403). "Đang hoạt động" = tài khoản không `disabled` và không bị quản trị khóa (`locked` mà không có `locked_until`); khóa đăng nhập tạm thời vẫn tính; vai ở cơ sở chưa thu hồi. Hàm chung mới `identity/public/staff-directory.ts` (`activeStaffWithRole`, `isActiveStaff`) – **BE-B review**. Kiểm khi giao (`createHkTask.assignedUserId`, `createWorkOrder`/`updateWorkOrder` người được giao) nay dùng cùng luật này (trước chỉ kiểm vai) | `housekeeping-s4` (ca mới: lọc người, sắp xếp, loại người bị khóa/thu hồi, 422 khi giao người bị khóa); `rbac-sprint4-bec` +11 ca RB-0969…0979 |
| **Migration 0062** (#8) | `0062_registration_purge_unconfirmed.sql`: mở rộng `registration_purge_reason_check` thêm `unconfirmed` (`document_image.delete_reason` đã có từ 0053). Sinh bằng drizzle-kit vào thư mục tạm (journal tới 0061 + `0061_snapshot.json`) rồi đổi tên. Journal: idx 39, `when` 1792249758865 > 0061. Có `0062_snapshot.json` (prettier). `drizzle-kit generate` ở thư mục thật báo "No schema changes". J16 nay ghi `imagesPurgeReason = unconfirmed` cho khai báo chưa bao giờ `confirmed` | `schema-parity`, `migrations-journal`, `registration-flow` (đổi kỳ vọng sang `unconfirmed`) |
| **`createHkTask` 409 `ROOM_BLOCKED`** (#7) | Mã đã khớp hợp đồng: căn OOO hôm nay → 409 `ROOM_BLOCKED`, **không** có `conflicts[]`; người được giao không phải HK đang hoạt động → 422 `NOT_IN_LIST` | `housekeeping-s4` (ca mới) |

### 8.2 Kết quả kiểm
- Vitest api toàn bộ, cây chung (lúc chạy, thư mục `services/api` chỉ có thay đổi của BE-C), DB `ottimo_test_bec_s4` mới: **78/78 tệp, 2657/2657 đạt** (gồm `contract`, `schema-parity`, `architecture`, `migrations-journal`).
- `tsc`, eslint, prettier các tệp đã sửa: sạch.

### 8.3 Việc cho QA (ORC chuyển)
- **TC-L3-074 (b)** (`tests/e2e/clock/checkin.s3.clock.spec.ts`, khoảng dòng 2283): cả hai khai báo (a) trả phòng và (b) hủy đều dừng ở `sent`, chưa bao giờ `confirmed`. Kỳ vọng `imagesPurgeReason` phải đổi từ `'retention'` sang **`'unconfirmed'`**. BE-C không sửa tệp này.

### 8.4 Tệp lượt 3
- Mới:
  - `services/api/src/modules/identity/public/staff-directory.ts` (module identity – BE-B review);
  - `services/api/src/db/migrations/0062_registration_purge_unconfirmed.sql`;
  - `services/api/src/db/migrations/meta/0062_snapshot.json`.
- Sửa:
  - `services/api/src/db/migrations/meta/_journal.json`, `services/api/src/db/schema/registration.ts`;
  - `services/api/src/modules/housekeeping/internal/{housekeeping.controller,housekeeping.service,work-orders.service}.ts`;
  - `services/api/src/modules/registration/internal/registration.service.ts`;
  - test `housekeeping-s4`, `rbac-sprint4-bec`, `registration-flow`.

### 8.5 Giả định mới
- [GIẢ ĐỊNH BE-C] "Nhân viên đang hoạt động" = không `disabled` và không bị quản trị khóa (theo luật `auth.service`). Khóa đăng nhập tạm thời (`locked_until` còn hạn) vẫn được giao việc.

## 9. Kiểm thử → sửa: BUG-R2-108 (P1) – `WorkOrder.allowedActions` luôn rỗng

### 9.1 Gốc lỗi và cách sửa
- **Gốc (đã xác nhận):**
  - `woAllowedActions` trả mảng chuỗi (`'accept'`…), còn hợp đồng là `AllowedAction[]`;
  - bộ định dạng phản hồi (`serializeResponse`, theo `generated/openapi-schemas.ts`) bỏ phần tử sai kiểu, nên mọi vai nhận `[]`;
  - test serializer mới chứng minh điều này: mảng chuỗi ra `[]`, mảng object giữ nguyên.
- **Sửa** (`housekeeping/internal/rules.ts`, `work-orders.service.ts`): trả `{ event, transition, action }`:
  - `event` lấy từ state-machines.md mục 19: `accept_work_order`, `wait_parts`, `resume_work_order`, `complete_work_order`, `cancel_work_order`, `reopen_work_order`;
  - `transition` là W2…W6 của SM-04;
  - `action` là đoạn đường dẫn (`accept`, `wait-parts`, `resume`, `complete`, `cancel`, `reopen`).
- **Theo vai (A85):**
  - HK: không có hành động;
  - MT: không `reopen`; `cancel` chỉ với phiếu mình tạo còn `new`;
  - FD+: mọi hành động trạng thái cho phép. `reopen` chỉ hiện khi còn mở lại được (khách còn ở căn đó, hoặc ≤ 7 ngày sau khi xong – DOM D-12 g). Bước chuyển dùng chung hàm kiểm `reopenable`.
- `HkTask` không có `allowedActions` trong hợp đồng; `RoomStatusEntry.allowedEvents` là enum chuỗi đúng hợp đồng → không đổi.

### 9.2 Test
- Unit mới `test/be-c-s4-units.test.ts`:
  - đủ trạng thái × vai;
  - serializer `getWorkOrder` giữ object, bỏ chuỗi.
- Tích hợp `housekeeping-s4`, ca BUG-R2-108:
  - OWN/MGR/FDL/FD với phiếu `new` → `accept`, `cancel`; MT → `accept`; MT với phiếu của mình → `accept`, `cancel`; HK người báo → `[]`;
  - `in_progress` → `wait-parts`, `complete`;
  - `done` → FD có `reopen`, MT không;
  - sau 8 ngày, căn trống → `[]`, gọi `reopen` → 409.
- E2E trên `ottimo-qa-s4` qua `qa-s4/clock-run.sh`:
  - TC-L6-045 (E) **đạt** → đã xóa `BUG-R2-108` khỏi `OPEN` (`known-bugs.ts` về `{}` như HEAD);
  - cả tệp `e2e/ui-clock/ops.s4.spec.ts`: 4/4 đạt.
- Vitest api toàn bộ:
  - cây cô lập (HEAD 2442d26 + BE-C), DB mới: **80/80 tệp, 2665/2665 đạt**;
  - cây chung, DB mới: **2665/2665 đạt**.
- eslint, prettier các tệp BE-C: sạch. `tsc` ở cây chung có 1 lỗi ở `reservations/internal/reservations.service.ts:2802` (`shortDeposit` – BE-A đang sửa dở, không phải BE-C). `tsc` cây cô lập: sạch.

### 9.3 Báo QA (qua ORC) – stack `ottimo-qa-s4` đã dựng lại api
- 23:09, api + worker của `ottimo-qa-s4` chạy dist mới `scratchpad/bec-s4/api-dist-108` (HEAD 2442d26 + bản sửa BUG-R2-108; override `scratchpad/bec-s4/compose.api-bec108.yml`) **thay cho `api-dist7`**.
- Đã ghi dòng thông báo vào `qa-s4/clock-lock.txt` trước khi dựng.
- `migrate` chạy cùng dist này, nên áp 0062 nếu DB QA chưa có (chỉ mở rộng CHECK).
- QA muốn quay lại: chạy `up -d api worker` với `compose.api-wt7.yml` như trước.

### 9.4 Tệp
- Sửa:
  - `services/api/src/modules/housekeeping/internal/rules.ts`;
  - `services/api/src/modules/housekeeping/internal/work-orders.service.ts`;
  - `services/api/test/integration/housekeeping-s4.test.ts`;
  - `tests/e2e/support/known-bugs.ts` (xóa BUG-R2-108 – QA review).
- Mới: `services/api/test/be-c-s4-units.test.ts`.

## 10. Tuần Ổn định – BR-807-01 (DOM v0.3.8): khách đến hôm nay không phải khách ở tiếp
- **J8 `hk.daily`**: chỉ chuyển `OC → OD` và sinh `stayover_clean` khi ngày đến của lượt ở < ngày nghiệp vụ < ngày đi.
  - Đơn con gia hạn tính theo ngày đến của đơn cha, nên khách gia hạn vẫn được dọn ở tiếp vào ngày đi cũ.
  - Không dùng điều kiện đoạn ở `from_date < today` theo câu chữ: điều kiện đó bỏ sót khách gia hạn qua đơn con và khách đổi phòng trong ngày.
- **B13 vào đúng ngày đến**: `RoomStatusService.set(…, 'OD', B13)` giữ `OC`, không sinh việc dọn. 07:00 hôm sau J8 làm cả hai.
- **Căn khách chuyển về (BR-424-05)**: không đổi – đã nằm ngoài nhánh khách ở tiếp.
- Đã bỏ `pendingFix: S438R3-G-J8` của BR-807-01.
- Test: `housekeeping-s4`, ca BR-807-01 đọc oracle (J8 chạy bù 15:00 → `OC`, không việc; 07:00 hôm sau → `OD` + việc; B13 ngày đến → `OC`).
- Vitest api toàn bộ: cây chung **83/83 tệp, 2709/2709**; cây cô lập (HEAD + BE-C) 2709/2709. `tsc`, eslint, prettier, validate-fixtures: sạch.
- Tệp:
  - `services/api/src/modules/housekeeping/public/{worker-jobs,room-status.service}.ts`;
  - `services/api/test/integration/housekeeping-s4.test.ts`;
  - `tests/fixtures/br-examples.json` (QA review).
- **BE-A cần biết:** nhánh OD của B13 (BUG-R2-047) nay không đổi trạng thái khi khách đến hôm nay.

## 11. BUG-R2-151 (P2) – J8/B13 với đơn OTA nhận phòng sớm B9a
- **Gốc:** bản sửa BR-807-01 lấy ngày đến của lượt = `COALESCE(ngày đến đơn cha, ngày đến đơn)`. Đơn OTA nhận phòng trước 06:00 có đơn con B9a cho đêm trước; đơn con trỏ **về** đơn chính, nên đơn chính bị coi là "đến hôm nay" → mất một ngày dọn ở lại.
- **Sửa:** hàm SQL dùng chung `housekeeping/public/stay-arrival.ts` (`STAY_ARRIVAL_SQL`). Ngày đến của lượt = LEAST(ngày đến đơn, ngày đến đơn cha, MIN ngày đến các đơn con `in_house`/`checked_out` cùng đơn gốc). Dùng cho:
  - J8: điều kiện khách ở tiếp và cột `nights` (luật thay ga);
  - `RoomStatusService.arrivedToday`;
  - `stayContinues`.
- **Test:** `housekeeping-s4`, ca BUG-R2-151:
  - đơn OTA đến hôm nay + đơn con B9a đêm trước → J8 07:00: `OD` + 1 `stayover_clean` (thay ga = không, mới ngủ 1 đêm);
  - B13 cùng ngày (đơn con đã trả): `OD` + 1 việc.
  - Ca BR-807-01 (đến hôm nay, không B9a → giữ `OC`) vẫn xanh. DOM sẽ thêm dòng oracle B9a.
- Vitest api toàn bộ, DB mới: **86/86 tệp, 2734/2734**. `tsc`, eslint, prettier: sạch.
- Tệp:
  - `services/api/src/modules/housekeeping/public/stay-arrival.ts` (mới);
  - `services/api/src/modules/housekeeping/public/{worker-jobs,room-status.service}.ts`;
  - `services/api/test/integration/housekeeping-s4.test.ts`.


## 12. Vòng sửa 5b – BUG-R2-170 (QA-VS5-01, P2): danh sách khai báo bỏ sót khách mới khi hồ sơ mở vượt 1.000
- **Gốc:** `list()` (`action_needed`, `needs_update`), `openDeclarations()` (J5 + "Cần chú ý" `registration_due`/`registration_overdue`), `staysNotClosed()`, `visaExpiringReservations()` lấy `ORDER BY id LIMIT 1000` (cũ trước) **rồi mới** lọc theo đơn (đọc qua cổng stay-view của BE-A). Hồ sơ vẫn "mở" sau khi trả phòng/hủy, nên khi quá 1.000 thì khách mới nhất rơi khỏi danh sách.
- **Sửa (`registration.service.ts`):**
  - Hàm chung `scanRegistrations`: đọc hồ sơ **mới trước**, trang 500 dòng (keyset `id <`), mỗi trang đọc đơn qua stay-view rồi lọc **mọi** dòng. Không còn giới hạn trước bộ lọc.
  - Lọc sớm trong SQL bằng cột của chính module (giữ ARC FB-S3-15 (e)): hồ sơ có `actual_checkout_at` (hook B18 ghi trong giao dịch trả phòng của BE-A; `checked_out` là trạng thái cuối) bị loại khỏi `action_needed`, `staysNotClosed`, `visaExpiring`. `openDeclarations` giữ lượt trả phòng trong `id_image_unconfirmed_max_days` + 1 ngày (cảnh báo quá hạn sau trả phòng vẫn cần). Không lọc theo `stay_ended_at` vì J16 có thể đánh dấu một đơn còn `in_house`.
  - Thứ tự giữ nguyên hợp đồng: `action_needed` xếp theo ngày đến tăng dần (lâu nhất trước, cần xử lý trước), con trỏ `[arrivalDate, id]`; "còn nữa" = `page.nextCursor` có sẵn. **Không cần đổi `openapi.yaml`.**
  - Trần kỹ thuật `SCAN_MAX` = 20.000 dòng đọc/lần (rất xa mức 10 căn ~3.000 lượt/năm). Chạm trần thì ghi log cảnh báo (chỉ số đếm) và bỏ dòng **cũ nhất**, không bỏ dòng mới.
  - J16 `scheduleEndedStays`: trần đi qua 2.000 → `SCAN_MAX` + log khi chạm. Lý do: mỗi giờ đi lại từ đầu, các lượt còn ở được đọc lại, nên trần 2.000 có thể chặn mãi lượt mới đã kết thúc.
- **Rà cùng kiểu, đã sửa:** housekeeping `attention-sources.ts` lấy 200 phiếu sửa chữa mở cũ nhất rồi mới lọc cao/quá hạn. Nay lọc trong SQL trước (cao, quá hạn tiếp nhận/xử lý như `isOverdue`, chờ vật tư quá ngày), trần 500 sau bộ lọc + log.
- **Rà, không cùng kiểu (giữ nguyên):** `unclaimedDocumentStays` (mọi điều kiện đã ở SQL trước trần); `retention.service` (lô 500 `FOR UPDATE SKIP LOCKED`, lượt sau làm tiếp); `c3-log` và `inspectionRows` (phân trang keyset); các `LIMIT 1` tra một dòng.
- **Chỉ mục:** dùng `registration_property_status_idx (property_id, status, deadline_at)` có sẵn. EXPLAIN trên DB thử (2.430 hồ sơ mở/cơ sở): Bitmap Index Scan, 0,23 ms/trang 500 dòng. Gọi `action_needed` đủ 8 trang (721 dòng) ~14 ms/lần. `work_order_status_idx` phủ truy vấn phiếu. Không thêm migration (tránh đụng số 0069 BE-B đang làm).
- **Test mới** `test/integration/registration-open-cap.test.ts` (5 ca), dữ liệu như stack QA: 1.214 hồ sơ mở cũ (719 đang ở, 478 đã trả – 30 trong đó không có `actual_checkout_at` như dữ liệu trước hook, 16 hủy ở `sent`, 1 `confirmed` chưa đến) + 1 khách nhận phòng hôm nay qua cổng check-in:
  - TC-L3-004/044: `action_needed` mọi trang có khách mới (hạn 21:00, `before_deadline_today`), đủ 719 + 2 dòng, không dòng đã kết thúc, đúng thứ tự, không trùng giữa trang;
  - TC-L3-046: "Cần chú ý" `registration_due` → J5 nhắc 1 lần → `registration_overdue` có khách mới (đếm 720);
  - `needs_update`: 1.215 dòng có khách mới;
  - housekeeping: 520 phiếu thấp cũ + 1 phiếu cao mới + 1 phiếu quá hạn mới → cả hai có trong "Cần chú ý".
  - Đối chứng: chạy test với mã cũ (HEAD) → 4/5 ca đỏ; với bản sửa → 5/5 xanh.
- Vitest api toàn bộ, DB riêng `ottimo_test_bec_170` mới: **90/90 tệp, 2849/2849**. `tsc`, eslint, prettier các tệp của BE-C: sạch. Không chạy codegen, không commit.
- Tệp:
  - `services/api/src/modules/registration/internal/registration.service.ts`;
  - `services/api/src/modules/housekeeping/internal/attention-sources.ts`;
  - `services/api/test/integration/registration-open-cap.test.ts` (mới).
- **Giả định:** `registration.actual_checkout_at` chỉ được ghi ở B18 (`checkout.service` gọi `onCheckedOut` trong cùng giao dịch đặt `checked_out`), và không có luồng hoàn tác trả phòng. Nếu BE-A thêm "hoàn tác trả phòng" thì hook đó phải xóa `actual_checkout_at` của hồ sơ.
- **Ghi chú cho BE-A (thấp, không sửa vì là tệp của BE-A):** `reservations/public/stay-view.ts` `activeRootBookings` lấy `ORDER BY id LIMIT 2000` rồi registration mới lọc "chưa có hồ sơ". Nếu một cơ sở có hơn 2.000 đơn đang mở, đơn mới nhất không được J16 tạo hồ sơ bù. Bình thường hồ sơ đã được hook `created` tạo, nên đây chỉ là lưới an toàn.
- **Gợi ý cho ARC (không bắt buộc):** nếu muốn FE biết khi chạm `SCAN_MAX`, có thể thêm cờ `truncated` vào `PageInfo` của `listRegistrations`. Hiện chỉ có log máy chủ; với quy mô OTTIMO không thể chạm trần.
- **Trên stack QA `ottimo-qa-s4`:** dựng lại api từ cây có bản sửa là đủ, không cần sửa DB. TC-L3-004/044/046 sẽ thấy khách mới vì `regRow` đã đọc mọi trang.

## 13. Tuần Ổn định – S4-36 (ARC-BE-S3-30, NÊN-ÔĐ): N+1 trong `listRegistrations`
- **N+1 đã hết từ trước, nay có test chặn quay lại.** Thẻ ARC chỉ vào bản Sprint 3 (`789ac90`): `list()` gọi `readRegistration` cho từng dòng. Với `limit=50` là khoảng 57 câu, `limit=100` khoảng 107 câu (đọc mã; bản đó đọc thẳng bảng `reservation` nên không chạy được trên cây hiện tại). Bản sửa Sprint 3 (`229db99`) đã đọc theo lô. BUG-R2-170 (mục 12, đã vào `723179b`) giữ cách đọc theo lô: mỗi trang 500 hồ sơ chỉ tốn 1 câu đọc hồ sơ và 1 câu đọc đơn qua stay-view.
- **Số câu mỗi lần gọi (đo, `action_needed`):**
  - Phần service: 1 múi giờ + 3 tham số hạn + 2 × số trang 500 ứng viên. Đo được 8 câu với cả `limit=1` và `limit=100`, nên số câu không tăng theo cỡ trang. Ứng viên tăng thì mỗi 500 thêm 2 câu.
  - Cả lượt HTTP (xác thực + giao dịch + danh sách): 15 câu.
- **Đo p95**, lượt HTTP trong tiến trình (Fastify inject), 40 lần `GET …/registrations?view=action_needed&limit=50`, PostgreSQL thật, DB `ottimo_test_bec_170`. Máy dùng chung với các agent khác đang chạy test, nên số dao động. Mỗi cấu hình chạy 3 lượt:

| Cấu hình | Hồ sơ mở | Ứng viên sau lọc SQL | Câu service | Câu HTTP | p50 (ms) | p95 (ms) |
|---|---|---|---|---|---|---|
| Trước (`723179b^`, `LIMIT 1000` rồi lọc – sai kết quả, xem mục 12) | 1.215 | 1.000 (cắt) | 6 | 13 | 20–40 | 27–83 |
| Sau – trộn như stack QA | 1.215 | 767 | 8 | 15 | 23–44 | 37–100 |
| Sau – tồn đọng nhiều đã trả (719 ở + 4.478 đã trả) | 5.215 | 767 | 8 | 15 | 12 | 13–15 |
| Sau – rất nhiều khách đang ở (2.719 ở) | 3.215 | 2.767 | 16 | 23 | 27–28 | 30–38 |
| Sau – trong lượt chạy toàn bộ suite song song | 1.215 | 767 | 8 | 15 | 88 | 130 |

  - Ngân sách p95 đọc < 300 ms: đạt ở mọi cấu hình.
  - Trước và sau gần như nhau. Bản "trước" ít hơn 2 câu chỉ vì nó cắt ở 1.000 dòng và bỏ sót khách mới.
  - Lọc sớm bằng `actual_checkout_at` giữ chi phí không đổi khi hồ sơ đã trả phòng tồn đọng: 5.215 hồ sơ vẫn chỉ 767 ứng viên.
- **Chỉ mục:** không cần chỉ mục mới, **không dùng migration 0070**. EXPLAIN ở mục 12: `registration_property_status_idx` (Bitmap Index Scan), 0,23 ms cho một trang 500 dòng. Phần tốn nhất là câu stay-view của BE-A trên các ứng viên (LATERAL phòng hiện tại + đơn con), nhưng vẫn trong ngân sách.
- **Test (chặn quay lại N+1):** thêm ca `S4-36 …` vào `test/integration/registration-open-cap.test.ts`, chạy trên bộ 1.215 hồ sơ của ca 170:
  - số câu service với `limit=1` phải **bằng** với `limit=100`;
  - số câu ≤ 6 + 2 × ⌈ứng viên/500⌉;
  - số câu HTTP ≤ số câu service + 12.
  - Thời gian chỉ đo, không kiểm, vì phụ thuộc máy và suite song song (lượt toàn bộ suite có max 326 ms). Đặt `BEC_PERF=<tệp>` thì ca ghi số đo vào tệp đó.
- Vitest api toàn bộ, DB mới: **90 tệp đạt + 1 bỏ qua (`test/perf` của BE-A); 2851 đạt / 2 bỏ qua**. `tsc`, eslint, prettier tệp của BE-C: sạch. Không commit.
- Tệp: `services/api/test/integration/registration-open-cap.test.ts`. Mã nguồn không đổi: bản đọc theo lô đã có trong `723179b`.
- **Việc có thể làm sau (không cần cho ngân sách):** gộp 3 lần đọc tham số hạn thành 1 câu. Phần này thuộc `ParameterService` của platform, không phải module của BE-C.

## 14. Tuần Ổn định – review ARC module housekeeping (`reviews/s4-ARC.md` S4-01/02/03, + 05, 06 một phần) và DATA A7-02/03, cổng S4-09 cho BE-D
- **S4-01 (Major) – hàng đợi offline HK:**
  - `performedAt` nay so với **lần thao tác cuối trên căn theo giờ của người làm**: `RoomStatusService.lastActionAt` = `COALESCE(performed_at, occurred_at)` của dòng SM-03 cuối. Không còn so với `since` (giờ server lúc nhận lệnh). `since` vẫn dùng để hiển thị.
  - Cho lệch đồng hồ 5 phút (`CLOCK_SKEW_MS`, bằng biên +5' của `performedAtInRange`), giữa máy và server hay giữa hai máy.
  - R5 tự ghi lúc đọc trạng thái (VI → VC) mang `performedAt` = thời điểm R5 tới hạn. Nhờ vậy một lệnh xếp hàng làm sau mốc đó vẫn được nhận.
- **S4-05 (Minor, cùng hệ giờ):** `complete` có `performedAt` sớm hơn `started_at` quá 5 phút → 422 `PERFORMED_AT_OUT_OF_RANGE`.
- **S4-02 (Major) – thứ tự khóa (16.19 bổ sung 3):**
  - `transitionRoomStatus` và `recordInspection` khóa căn bằng `FOR KEY SHARE`, không còn `FOR UPDATE`. Hai HK trên cùng căn vẫn xếp hàng nhờ khóa advisory `hk-room:<id>`, lấy trước khi đọc và kiểm trạng thái.
  - `taskId` chỉ nhận việc thuộc `CLEAN_TYPES`. Việc khác (ví dụ `minibar_refill`) → 422 `NOT_IN_LIST`.
  - Việc có `guest_request_id` trên đường tới `done` (Dọn xong, `complete`) gọi `GuestRequestStatusPort.lockForFee` **trước** khi khóa `hk_task`. Việc chọn từ danh sách chưa khóa nay được khóa lại và kiểm lại trạng thái.
  - BE-D đã cài `lockForFee` thật. Test dùng adapter thật ở cả hai phía.
- **S4-03 (Major) – định nghĩa "khách đang ở căn":**
  - Một định nghĩa duy nhất `housekeeping/public/stay-occupancy.ts` `inRoomOnSql`, cùng quy tắc với `currentRoomOfStay` của BE-B (BUG-R2-178):
    - đoạn phủ ngày D;
    - không có đoạn nào phủ D (ngày đi chưa trả, hoặc quá ngày đi) → đoạn bắt đầu muộn nhất của lượt (đơn + đơn con cùng gốc).
  - Hệ quả: ngày đổi căn chỉ căn mới có khách; ngày đi căn vẫn có khách tới B18.
  - Áp cho: trạng thái suy ra OC, nhánh B13 (`arrivedToday`, `stayContinues`), danh sách buồng (`inHouseByRoom`), `room_status_mismatch`, phiếu sửa (`occupancy`, gợi ý J11).
  - J8 cố ý giữ câu hỏi khác: "đêm D có ở" (`stayoverNightSql`, BR-807-01). Đã ghi rõ trong tệp.
  - Ngoại lệ BR-424-05 (ngày quay về, lễ tân chưa ghi nhận): căn khách rời vẫn tính có khách, ở cả `inHouseByRoom` và `room_status_mismatch` (theo `roomReturnsOn`).
  - Phần chuyển sang cổng đọc của BE-A/BE-B: dời R3 nếu QC đồng ý (theo thẻ).
- **DATA A7-02:** `work_order_high_open` mức `warning`, chuyển `critical` khi `isOverdue`. `work_order_overdue` chỉ còn phiếu TB/Thấp, mức `warning` (EP01 3.1). Phiếu Cao quá hạn nay đúng 1 dòng.
- **DATA A7-03:** khách quá ngày đi chưa trả phòng vẫn "đang ở căn" (`inRoomOnSql`), nên 201 (OD) không còn bị báo lệch.
  - Chạy lại loader DS-0 của DATA trên DB riêng `ottimo_test_bec_a7`: T0 5 dòng; T1, T2, T3 mỗi mốc 7 dòng, khớp số tay. Không còn `work_order_overdue` và `room_status_mismatch` thừa. Kết quả: `scratchpad/bec-170/a7/out.json`.
- **S4-09 (cổng cho BE-D, phần tiền):**
  - `GuestRequestWorkPort.lastFullCleanAt(tx, {roomId, since, until, fullCleanRequestIds?})` → `done_at` của lần dọn đầy đủ cuối, hoặc null.
  - `FULL_CLEAN_TASK_TYPES` chuyển về `housekeeping/public/guest-request-work.port.ts`.
  - Việc `guest_request` chỉ tính khi bên gọi nêu id yêu cầu "Dọn thêm" của mình, vì bảng `guest_request` thuộc guest-portal.
  - Thêm `taskStatus` theo đề xuất của BE-D (S4-07).
  - **Chữ ký cần ORC chốt với BE-D**; BE-D chuyển `lastFullClean` sang cổng.
- **Test mới** `test/integration/housekeeping-s4-arc.test.ts`, 8 ca:
  - S4-01: chuỗi offline 200/200/201 → VI, lịch sử giữ giờ máy; lệnh sớm 20' → 422, lệch 3' → nhận;
  - S4-05;
  - S4-02 (2): `minibar_refill` → 422;
  - S4-02 (1): giữ `KEY SHARE` căn → HK đi qua ngay; giữ `FOR UPDATE` → HK chờ; hai HK → 200/409, 1 dòng CL;
  - S4-02 (3): giữ folio → lệnh HK `complete` chờ mà **không** khóa việc (`NOWAIT` vào được), sau đó phí 100.000 đúng 1 lần, bằng chạy tuần tự;
  - ca đua tiền: 4 vòng HK `complete` ‖ FD thêm dòng folio → 0 lỗi, phí 4 × 100.000, tổng = chạy tuần tự;
  - S4-03 + A7-03: ngày đi, quá ngày đi, ngày đổi căn;
  - S4-09: oracle BR-506-03 + `taskStatus`.
- **Sửa test cũ** `housekeeping-s4.test.ts` ("Cần chú ý"): theo EP01, phiếu Cao `warning` → `critical`, không có `work_order_overdue`; thêm ca phiếu TB quá hạn → `work_order_overdue` `warning`.
- **Đối chứng:** chạy 8 ca mới trên mã HEAD → 6 đỏ. Hai ca còn xanh là ca đua (cặp này vốn không tạo vòng khóa) và S4-09 (cổng mới, không thay ở HEAD). Bản sửa → 8/8.
- Tệp:
  - `housekeeping/internal/{housekeeping.service,rules,attention-sources,work-orders.service,guest-request-work.adapter}.ts`;
  - `housekeeping/public/{room-status.service,worker-jobs,guest-request-work.port}.ts`;
  - `housekeeping/public/stay-occupancy.ts` (mới);
  - `test/integration/housekeeping-s4-arc.test.ts` (mới), `test/integration/housekeeping-s4.test.ts`.
  - BE-D cũng đang sửa `guest-request-work.port.ts` (thêm `taskStatus?`): đã giữ nguyên phần của BE-D.
- **Chưa làm:**
  - S4-04 (Minor): J8 và R5 với `expectedFrom`;
  - S4-06 phần "J8 chạy lại sau khi hủy `dnd`";
  - đổi `room_status` của danh sách buồng ngày quay về BR-424-05 cho căn khách rời (đã hiện khách, nhưng chưa thêm ca riêng).

## 15. Tuần Ổn định – SEC FB-R2-SEC-BE-73 (Major, chặn cổng) + BE-78 (a), theo ARC 16.22
- **Gốc:** `guestOfPerson` coi giấy tờ chính không `partyMemberId` là của **người đặt**. Khi đặt hộ, khóa giấy tờ, 4 số cuối và P05 của người ở thật rơi vào hồ sơ người đặt.
- **Sửa** (mô hình R2 giữ nguyên, ARC 16.22):
  - **Không bao giờ suy người từ `isMain`.** Thiếu `partyMemberId` thì mọi giấy tờ, kể cả giấy tờ chính, đi cổng khớp người (`document-party.port.ts`):
    1. người trong đơn **kể cả người đặt**: khóa giấy tờ của hồ sơ có P05, rồi tên + ngày sinh;
    2. hồ sơ có P05 ngoài đơn theo khóa;
    3. hồ sơ "từ giấy tờ" + người đi cùng `unknown`.
    - Khớp người đặt → `memberId` = id đơn (id của người đặt trong `party[]`).
  - **Người đặt là một người được chọn:** `partyMemberId` = id đơn được nhận ở `addGuestDocument`, `updateGuestDocument` (đủ thân) và `GuestDocumentLink`.
    - Lưu ở `guest_document.guest_id` (cột có từ 0051, trước nay bỏ trống) = hồ sơ người đặt.
    - Loại trừ với `party_member_id`; mỗi khai báo một giấy tờ người đặt. Trùng → 409 `PARTY_DUPLICATE`.
    - DTO trả `partyMemberId` = id đơn cho giấy tờ người đặt.
  - **Khóa, last4 và P05 chỉ ghi lên hồ sơ của đúng người đã gắn** (`keepDocKey`, `recordCrmConsent`):
    - giấy tờ chưa gắn ai + P05 → 422 `REQUIRED` (`partyMemberId`), lễ tân gắn người trước;
    - `partyMemberId` = id đơn mà giấy tờ không phải của người đặt → 422 `NOT_IN_LIST`.
    - Desk đã bắt buộc `ConsentInput.partyMemberId` (422 `REQUIRED`). Endpoint nay nhận cả id đơn (người đặt).
  - P05 theo `personIndex` (app khách): hiện **không có đường** nào ghi P05 từ app khách lên hồ sơ. Giấy tờ từ app vẫn chờ gắn người, nên tự động đúng điều 3 của ORC.
- **Migration 0070** `0070_be73_guest_doc_person.sql` (+ `meta/0070_snapshot.json`, `_journal.json`; `drizzle-kit generate` → "No schema changes"):
  - kiểm dữ liệu cũ trước, `RAISE` nếu lệch, không tự sửa;
  - CHECK `guest_document_person_check` (`guest_id` loại trừ `party_member_id`) + unique `guest_document_booker_uk`;
  - `GRANT UPDATE (guest_id)` cho app;
  - **BE-78 (a):** CHECK `guest_id_doc_last4_consent_check` (`id_doc_last4 IS NULL OR crm_consent='granted'`).
- **Script kiểm dữ liệu demo/test:** `services/api/scripts/sec-be73-check.sql`, chỉ đọc, chỉ in id/đếm. Trên DB thử: 0 hồ sơ người đặt mang last4 của giấy tờ chính chưa gắn ai, 0 P05 trên giấy tờ như vậy, 0 last4 không có P05.
- **Test:**
  - `guest-document-profiles.test.ts` ca mới SEC BE-73, đủ 3 bước của SEC: X (đã có P05) đặt hộ Y;
    - (1) giấy tờ chính của Y → hồ sơ Y, X không có khóa/last4;
    - (2) Y từ chối rồi đồng ý → chỉ Y đổi, X giữ nguyên;
    - (3) Y quay lại làm người đi cùng của Z → gắn hồ sơ Y.
    - Thêm: id đơn cho giấy tờ không phải người đặt → 422; giấy tờ chưa gắn ai + P05 → 422 `REQUIRED`; DB từ chối `id_doc_last4` không P05 (23514).
  - Sửa 2 ca cũ theo hợp đồng mới:
    - Emma và Bình là người đặt → Desk gửi `partyMemberId` = id đơn; thêm 409 khi người đặt có giấy tờ thứ hai;
    - BUG-R2-033: giấy tờ chính nay cũng đi cổng khớp.
- **Cần FE-A/FE-B (ARC 16.22) trước cổng:**
  - Desk (`DocsPanel.tsx:646`) phải luôn chọn người, kể cả "người đặt" = id đơn trong `party[]`.
  - Tới khi đổi: giấy tờ người đặt nhập không chọn người chỉ khớp được khi trùng khóa hoặc tên + ngày sinh. Không khớp thì server tạo hồ sơ "từ giấy tờ" + người đi cùng cho chính người đặt (trùng người, an toàn về dữ liệu nhưng sai danh sách đoàn).
- **Rủi ro còn lại:**
  - `updateGuestDocument` đổi người của giấy tờ không xóa khóa/last4 đã ghi lên hồ sơ người cũ. Có từ trước; chỉ xảy ra khi lễ tân sửa nhầm người. Đề xuất làm cùng BE-74/75 trước dữ liệu thật.
  - Khi đặt hộ, `overCount` vẫn tính người đặt là người ở. Phần "người đặt không lưu trú" để R3 theo ARC.
- Tệp:
  - `registration/internal/{registration.service,registration.repo,registration.controller}.ts`, `registration/public/party-port.ts`;
  - `frontdesk/internal/document-party.port.ts` (tệp BE-C viết ở S4-11);
  - `db/schema/{registration,guests}.ts`, `db/migrations/0070_be73_guest_doc_person.sql`, `meta/0070_snapshot.json`, `meta/_journal.json`;
  - `scripts/sec-be73-check.sql`;
  - test `guest-document-profiles.test.ts`, `registration-flow.test.ts`.

## 16. SEC FB-R2-SEC-BE-77 – phần `hasLongDigitRun` (registration, theo `s4-be-d.md` 7.5)
- Thêm `,` vào tập dấu ngăn cách, kiểm trên dạng NFKC (chữ số toàn khổ). Ghi chú vẫn lưu như người dùng gõ. Không thêm ngoại lệ tiền/ngày (SEC C.6).
- Test `registration-rules.test.ts`: `079,123,456,789`, `mã cửa 123,456`, số toàn khổ → chặn; `Phòng ２０２, ２ khách` → không chặn.
- Tệp: `registration/internal/rules.ts`, `test/registration-rules.test.ts`.

## 17. Kiểm tra chung (mục 14–16)
- `tsc`, eslint, prettier các tệp của BE-C: sạch. `drizzle-kit generate` trên bản sao migrations: không lệch.
- Vitest api toàn bộ, DB mới `ottimo_test_bec_170`: **94 tệp đạt / 2 hỏng / 1 bỏ qua; 2890 ca đạt / 2 hỏng**.
  - 2 ca hỏng là ca SEC BE-77 của BE-D (`be-d-s4-units`, `guest-requests-s4-fix-bed`). Chúng hỏng vì BE-D đang sửa `guest-request-rules.ts` đúng lúc chạy; chạy lại riêng 2 tệp → 41/41 đạt.
  - Không liên quan `hasLongDigitRun`: guest-portal không gọi hàm này.
- Không commit, không chạy codegen.

## 18. BR-614 (DOM 18/10, UXR P-33; rbac D01) – buồng phòng chỉ thấy tên gọi + số căn
- **Đã sửa API của HK/MT** (`listRoomStatuses`):
  - vai HK (trong phạm vi T) nhận **tên gọi**: `currentGuest` = "Huy" (theo ARC 18/10 chỉ có tên, client tự ghép với `roomNo`); `nextArrival.guestDisplayName` = "Mai";
  - MT không có tên (như trước); FD+ giữ họ tên đầy đủ.
  - Không đổi tên trường. ARC đã sửa mô tả trong `openapi.yaml`: chỉ có tên, không kèm số căn; FD+ nhận họ tên đầy đủ. Mã đã sửa theo, kể cả với FD+.
- **Quy tắc tên gọi** (`registration/public/call-name.ts`):
  - R2 chưa có trường tên gọi khách tự điền;
  - khách NN = họ, tức chữ đầu trên **giấy tờ NN đã gắn cho người đặt** (`guest_id`, BE-73): "KIM MIN JUN" → "Kim";
  - còn lại = chữ cuối của họ tên: "Phạm Gia Huy" → "Huy";
  - không có tên → không trả trường, màn hình chỉ hiện số căn.
  - Mỗi đơn chỉ một từ đi ra khỏi module registration.
- **Đã rà:**
  - danh sách việc, chi tiết việc (`taskDto`) và phiếu sửa: không có tên khách;
  - SSE chỉ mang id;
  - thông báo HK mang mã căn/mã phiếu;
  - `listGuestRequests` (BE-D) không đọc tên khách.
- **Test RBAC:** ca BR-614 trong `housekeeping-s4-arc.test.ts`. Trong thân phản hồi của HK không có họ tên đầy đủ; FD giữ họ tên; MT không có tên; có ca cho luật tên gọi. Ca US-052 cũ sửa theo: HK thấy "Khách", FD thấy "Lê Văn Khách" (không kèm số căn).
- **Cần biết:**
  - MOB/QA: E2E hay app HK nào đang so họ tên đầy đủ thì phải đổi sang tên gọi.
  - Hợp đồng nên ghi rõ thêm: `guestDisplayName` của `nextArrival` với HK là tên gọi (ARC).
- Kiểm tra: tsc, eslint, prettier sạch; `housekeeping-s4`, `housekeeping-s4-arc`, `module-boundaries`: 34/34 đạt. Không commit.

## 19. BUG-R2-199 (P3, phần BE-C của BUG-R2-163 – kiểm lại tiền lần 6)
- `transitionHkTask`: `start`, `complete` hay `cancel` có `performedAt` sớm hơn `hk_task.created_at` quá 5 phút (cùng mức lệch đồng hồ S4-01) → 422 `VALIDATION_FAILED`, `errors[]` `performedAt` / `PERFORMED_AT_OUT_OF_RANGE`.
- Test: ca BUG-R2-199 trong `housekeeping-s4-arc.test.ts`:
  - `start`/`complete`/`cancel` sớm 15–20' → 422;
  - sớm 3' → nhận;
  - sau đó `complete`/`cancel` đúng giờ → 200.
- Vitest api toàn bộ, DB mới: **96 tệp đạt / 1 bỏ qua; 2896 ca đạt / 2 bỏ qua**. `tsc`, eslint, prettier sạch. Không commit.

## 20. BUG-R2-205 (P2, ARC 16.29) – `Registration.partyOverCount`
- Mọi phản hồi `Registration` (gồm `addGuestDocument`, `getRegistration`) có `partyOverCount` khi số người của đoàn **vượt** số khách của đơn.
  - Số người của đoàn = người đặt + người đi cùng còn trong đoàn, đúng con số panel đoàn đang hiện.
  - Vắng trường = không vượt.
  - Chỉ là cảnh báo: không ghi phụ thu lúc nhập giấy tờ.
- Trường hợp chính: giấy tờ không có `partyMemberId` không khớp ai trong đơn, nên server thêm người đi cùng `unknown` (16.22).
- Test (`guest-document-profiles.test.ts`):
  - ca QA của ARC: người đặt thiếu ngày sinh, giấy tờ không `partyMemberId` → 201 có `partyOverCount` 1, folio không có dòng; gỡ người thừa → hết cảnh báo;
  - ca đặt hộ của BE-73 → 1 (cả khi đọc lại);
  - người đặt được chọn → không có trường.
- BUG-R2-199: ARC chấp nhận dung sai 5 phút, giữ nguyên mã.
- Vitest api toàn bộ, DB mới: **99 tệp đạt / 1 bỏ qua; 2938 ca đạt / 2 bỏ qua**. `tsc`, eslint, prettier sạch. Không commit.

## 21. Sau cổng QC Sprint 4 KHÔNG ĐẠT – K1: FB-R2-SEC-BE-65 (Major, hạn lưu ảnh), theo ARC `s4-ARC.md` E.1 (ORC duyệt 19/10)

### 21.1 BE-65 (a1–a6, b1–b3)
- Ngày 19/10/2026. Không commit. **Không chạm mã tiền đóng băng:** không sửa `folio/**`, `payments/**`, `folio-lines.service.ts`, `foc`, checkout tiền, `stay.service.ts`, `attachment-usage.ts`, chữ ký `bindTo`. Không đụng stack demo.
- **(a1) `AttachmentService.setRetentionAnchorForRef(tx, {type: 'work_order'|'inspection', id}, at|null)`** (`files/public/attachment.service.ts`). `UPDATE attachment SET retention_anchor_at = $3 WHERE bound_ref_type/bound_ref_id khớp AND purged_at IS NULL`. Ghi đè, `null` = xóa mốc. Chỉ theo một bản ghi, không theo mục đích (giữ ARC FB-S3-31 (2)). `setRetentionAnchor` cũ không đổi.
- **(a2)(a3) Phiếu sửa** (`housekeeping/internal/work-orders.service.ts`, sau `UPDATE work_order` và sau vòng `bindTo` ảnh sửa xong):
  - `complete`/`cancel` → mốc = `c.now` (cùng giá trị `done_at` khi `complete`) cho **mọi** ảnh của phiếu: ảnh lúc báo + ảnh sửa xong;
  - `reopen` → mốc NULL; đóng lại → mốc mới.
  - Cùng giao dịch đang giữ khóa phiếu (`FOR UPDATE` + `If-Match`); `attachment` đứng sau `work_order` như `bindTo` hiện có, không thêm cặp khóa.
- **(a4) Kiểm phòng** (`housekeeping.service.ts`): `bindTo` truyền `retentionAnchorAt: body.performedAt` (= `inspected_at`).
- **(b1) Upload `penalty_evidence` sau khi lượt ở đã xong** (`attachment.service.ts` `upload`): đơn `checked_out`/`cancelled`/`no_show` → `retention_anchor_at` = giờ tải lên ngay lúc INSERT. Đơn còn ở → NULL, việc trả phòng đặt mốc như cũ (`registration.service.ts` `onCheckedOut` → `setRetentionAnchor` theo `reservationId`). `bindTo` sau đó giữ mốc (`COALESCE`).
  - Lệch nhỏ so với chữ ARC: trạng thái đơn đọc từ `ReservationSalesPort.ownership()` (cùng cổng, cùng dòng `reservation`, đã gọi sẵn để kiểm quyền, có trường `status`) thay vì gọi thêm `stayInfo()`. Kết quả như nhau, bớt một truy vấn. `assertReservationVisible` nay trả `status`.
- **(b2) Lưới an toàn J16** (`purgeDue`): đếm ảnh đã gắn (`bound_ref_id IS NOT NULL`), chưa xóa, `retention_anchor_at IS NULL`, `purpose IN ('work_order','inspection','penalty_evidence')`, `uploaded_at + attachment_ops_retention_months ≤ now`. Kết quả trả thêm `anchorMissing`. **Không xóa.** `RetentionService` (J16 giờ) ghi `stats.attachmentAnchorMissing` và một dòng `retention_run` `policy_key = 'anchor_missing'` (chỉ số đếm, `done`) khi > 0. SEC quyết có đẩy lên "Cần chú ý" ở R3 hay không.
- **(b3)/(a5) Migration 0078 `0078_attachment_retention_anchor_backfill.sql`** (chỉ dữ liệu, không RAISE):
  - tắt/bật RLS cho `attachment`, `work_order`, `inspection`, `reservation` (mẫu 0075);
  - (i) ảnh `work_order`: `done` → `done_at`; `cancelled` → `updated_at`;
  - (ii) ảnh `inspection` → `inspected_at`;
  - (iii) `penalty_evidence` đã gắn, đơn `checked_out`/`cancelled`/`no_show` → `COALESCE(actual_checkout_at, uploaded_at)`;
  - mọi câu chỉ sửa dòng `retention_anchor_at IS NULL AND purged_at IS NULL`; chạy lại không đổi gì.
  - Luật 4.2a: `_journal.json` thêm idx 55, `when` = 0077 + 1000; `meta/0078_snapshot.json` = bảng của 0077, `id` mới, `prevId` = id 0077 (2b: tên snapshot đầu = tiền tố lớn nhất); `drizzle-kit generate` trên bản sao migrations → "No schema changes, nothing to migrate"; prettier sạch.
- **Test mới `test/integration/sec-be65-retention.test.ts` – 9/9 đạt** (7 ca ARC a6 + (5b), (6b) ở 21.2):
  1. phiếu `done` có ảnh lúc báo + ảnh sửa xong: mốc = `done_at`; `purgeDue` tại hạn − 1 ngày còn, + 1 ngày → `purged_at`, `purge_reason='retention'`, DEK hủy, GET 404 (đúng ca P1 của SEC);
  2. `done` → `reopen` → mốc NULL, J16 sau hạn không xóa; đóng lại → mốc mới;
  3. phiếu `cancelled` như (1);
  4. kiểm phòng gửi `performedAt` sớm hơn giờ nhận 2 giờ → mốc = `performedAt`, J16 theo đó;
  5. `penalty_evidence` tải lên sau `checked_out`/`cancelled`/`no_show` → mốc = giờ tải lên, giữ sau `bindTo`; tải lên khi `in_house` → NULL tới lúc trả phòng đặt mốc; `deposit_receipt` không bị đặt mốc lúc tải lên;
  6. migration 0078 trên dữ liệu kiểu cũ (mốc NULL): đúng `done_at` / `updated_at` / `inspected_at` / `actual_checkout_at` / `uploaded_at` (no_show); phiếu đang mở, ảnh đơn đang ở, ảnh chưa gắn, mốc đã có: không đổi; chạy lại không đổi;
  7. `anchorMissing`: phiếu đang mở + bằng chứng đơn đang ở, sau hạn → 2, không xóa; J16 ghi `retention_run` `anchor_missing` 2; đóng phiếu → còn 1.
- **Giả định:**
  - Mốc của bằng chứng tải sau trả phòng trong mã = giờ tải lên (giữ lâu hơn), trong migration = `actual_checkout_at` (đúng chữ ARC/ORC). Hai cách cùng nằm trong ý SEC "`actual_checkout_at` hoặc muộn hơn". Đơn hủy / no-show trong migration: `cancelled_at` / `no_show_marked_at`, thiếu thì giờ tải lên (21.2 (4)).
  - Phiếu `cancelled` cũ dùng `updated_at` (≥ giờ hủy) – giữ lâu hơn chứ không ngắn hơn.
- **Rủi ro / việc còn lại (không thuộc K1):**
  - `onCheckedOut` thoát sớm khi đơn không có `registration` (`if (!reg) return`), nên bằng chứng phạt của đơn như vậy không được đặt mốc lúc trả phòng. Hiện J16 bước 0 tạo `registration` cho mọi đơn trong 1 phút nên khó xảy ra. Nếu xảy ra, (b2) đếm được. Ghi để SEC biết, không sửa trong K1.
  - Ảnh tải lên đúng lúc giao dịch trả phòng chưa commit (đọc trạng thái `in_house`) vẫn NULL → (b2) báo, như ARC đã nêu.
- Tệp (mục 21.1):
  - `product/services/api/src/modules/files/public/attachment.service.ts`
  - `product/services/api/src/modules/housekeeping/internal/work-orders.service.ts`
  - `product/services/api/src/modules/housekeeping/internal/housekeeping.service.ts`
  - `product/services/api/src/modules/registration/internal/retention.service.ts`
  - `product/services/api/src/db/migrations/0078_attachment_retention_anchor_backfill.sql`, `meta/0078_snapshot.json`, `meta/_journal.json`
  - `product/services/api/test/integration/sec-be65-retention.test.ts`

### 21.2 Phần ORC giao thêm trong lượt K1 (ARC C.K7, E.1)
1. **FB-R2-ARC-BE-S4-21 (Major) – giấy tờ ô "Khách n" (n ≥ 2) đã gắn người đặt bị coi là ô trống.**
   - Một định nghĩa dùng chung ở `registration.repo.ts`: `isLinkedToNobody(d)` (`party_member_id` và `guest_id` đều NULL), bản SQL `LINKED_TO_NOBODY_SQL`, và `UNCLAIMED_DOC_SQL` (bản SQL của `isUnclaimed`, trừ `removed_at`).
   - `isOpenGuestSlot` và `isUnclaimed` dùng `isLinkedToNobody` (thêm `guest_id` vào `Pick`).
   - 4 câu SQL ở `registration.service.ts` dùng hằng chung: J16 `purgeUnclaimedDocuments`, "Cần chú ý" `unclaimedDocumentStays` (nhánh trẻ em cũng thêm `guest_id IS NULL`), nhắc thị thực, `uploadedPeople` của guest-web.
   - Test (`registration-party-removal.test.ts`, 2 ca mới, cả hai **hỏng trên mã HEAD**, đạt sau sửa):
     - (1) ô 3 gắn người đặt (`GuestDocumentLink`, `partyMemberId` = id đơn) → bỏ A chưa có giấy tờ: 422 `REQUIRED` `personIndexes` = [2]; chọn 3 → 422 `NOT_IN_LIST`, giấy tờ người đặt nguyên vẹn, 0 c3 `delete`; chọn 2 → chỉ hủy ô 2;
     - (2)(3) cắt số người không chọn ô → ô 3 của người đặt không có `fields_purge_after`/`delete_after`; J16 sau 25 giờ hủy ô 2, ảnh ô 3 còn (DEK, tệp); `uploadedPeople` = [1, 3]; "Cần chú ý" hết sau khi ô 2 bị xóa.
   - Không cần migration.
2. **S4-22 – 0078 tắt RLS khi bù dữ liệu.** 0078 đã theo mẫu 0075 từ đầu (NO FORCE + DISABLE cho `attachment`, `work_order`, `inspection`, `reservation`, bật lại cuối tệp). Thêm ca **(6b)** trong `sec-be65-retention.test.ts`:
   - chạy **nguyên tệp** bằng `ottimo_owner` **không** có ngữ cảnh `set_config` (như migrator), trong giao dịch rồi ROLLBACK (DB test dùng chung không đổi);
   - đối chứng: cùng 3 câu UPDATE khi RLS còn bật → `rowCount` [0, 0, 0], owner không đọc được dòng nào;
   - tệp thật → bù ≥ 2 ảnh phiếu sửa và ≥ 1 bằng chứng phạt, đúng mốc của tenant test;
   - khóa 4 bảng `ACCESS EXCLUSIVE NOWAIT` có thử lại, nên ca này không bao giờ chờ khóa khi đang giữ khóa (không gây deadlock cho tệp test khác chạy song song).
   - Quy tắc ghi vào **`product/docs/coding-standards.md` mục 6**, dòng "Migration dữ liệu và RLS" + dòng lịch sử. Repo **không có `CONTRIBUTING.md`**; mục 6 là nơi các quy tắc migration đang ở (`drizzle.config.ts` trỏ tới "coding-standards 6"). Nếu ORC/OPS vẫn muốn tệp `CONTRIBUTING.md` riêng thì OPS tạo và trỏ về mục này.
   - Phần còn lại của S4-22 (chạy `scripts/sec-be73-check.sql` bằng owner, tắt RLS, trên DB demo): **chưa làm** vì BE-C không được đụng stack demo. OPS chạy trước khi nâng demo.
3. **Hai điểm SEC sẽ xét:**
   - (a) **`anchor_missing` thành mục "Cần chú ý": chưa làm, có lý do.** Không nhẹ vì phải đổi hợp đồng: `data_quality.params.check` là danh sách đóng trong `openapi.yaml` 0.3.7 (B-21: khóa lạ → lỗi lúc sinh mục), cần ARC thêm giá trị mới, UXD viết câu (`attn.dq_*`), FE thêm nhánh ở `admin-web/src/app/attention.ts`. Ngoài ra phải chọn người nhận (OWN/MGR, không phải FD vì đây là việc tuân thủ chứ không phải việc quầy). Hiện có: số đếm trong kết quả J16 (`anchorMissing`, `stats.attachmentAnchorMissing`) và dòng `retention_run` `anchor_missing` mà OPS/SEC truy vấn được. Đề xuất: R3 Sprint 1, ARC thêm `check = attachment_retention_anchor_missing` cho OWN/MGR, hoặc OPS cảnh báo từ `retention_run`. SEC quyết.
   - (b) **Bằng chứng phạt tải lên TRƯỚC khi đơn bị hủy / no-show: ĐÃ LÀM trong module registration** (không chạm folio/payments). `RegistrationService.onReservationVoided` – được hook `transitioned` của registration gọi khi đơn sang `cancelled`/`no_show` – nay gọi `setRetentionAnchor({reservationId, purpose: 'penalty_evidence'}, now)` **trước** khi xét có `registration` hay không. Thứ tự khóa như `onCheckedOut`: registration rồi attachment. Hàm "chỉ tăng" nên no-show được khôi phục rồi trả phòng sẽ có mốc mới, muộn hơn. Migration 0078 (iii) bù dữ liệu cũ theo `cancelled_at` / `no_show_marked_at`, thiếu thì giờ tải lên. Ca **(5b)** trong `sec-be65-retention.test.ts`.
- **Kiểm tra cuối (mục 21.1 + 21.2):**
  - `tsc --noEmit` sạch; eslint + prettier sạch cho mọi tệp mã/test đã sửa. `coding-standards.md` vốn chưa theo prettier ở HEAD, không định dạng lại cả tệp;
  - `drizzle-kit generate` trên bản sao migrations: "No schema changes, nothing to migrate";
  - `sec-be65-retention` 9/9, `registration-party-removal` 18/18;
  - **toàn bộ vitest api trên DB mới `ottimo_test_bec_k1full2`: 104 tệp đạt / 1 bỏ qua; 2971 ca đạt / 2 bỏ qua; 0 hỏng.**
  - DB test (`ottimo_test_bec_k1*` trên `ottimo-dev-postgres-1`) tạo bằng script trong scratchpad, chặn mọi tên không bắt đầu bằng `ottimo_test_bec_`. Env sinh từ `product/.env` bằng `sed`, không in giá trị.
- Tệp thêm ở 21.2:
  - `product/services/api/src/modules/registration/internal/registration.repo.ts`
  - `product/services/api/src/modules/registration/internal/registration.service.ts`
  - `product/services/api/test/integration/registration-party-removal.test.ts`
  - `product/docs/coding-standards.md`
  - (đã kể ở 21.1, sửa thêm) `0078_attachment_retention_anchor_backfill.sql`, `sec-be65-retention.test.ts`
