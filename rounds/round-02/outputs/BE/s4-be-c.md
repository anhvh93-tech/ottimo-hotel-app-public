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
- [GIẢ ĐỊNH] Việc dọn khách ở lại sinh do B13 không có cờ thay ga (`linenChange = false`); J8 ngày sau tính lại.
- [GIẢ ĐỊNH] Hiện chưa ghi `state_transition` cho các lần chuyển trạng thái bị từ chối.

## 5. Rủi ro
- Snapshot 0056–0061 chưa có → `schema-parity` đỏ tới khi ORC sinh.
- 0057 thêm FK `guest_request` chỉ khi bảng đã tồn tại. Nếu ORC đổi thứ tự journal để 0057 chạy trước 0058, phải thêm 3 FK vào migration tạo bảng `guest_request` (BE-D) hoặc một migration sau.
- `RoomStatusService` hiện được khai ở cả FrontdeskModule và HousekeepingModule (2 instance, cùng mã, không giữ trạng thái). Việc dời provider của B-14 mới làm một phần.
- TC-L3-032(a) của QA cần thêm điều kiện P05 vì khóa giấy tờ nay chỉ có ở hồ sơ P05 (SEC F03).

## 6. Việc chưa xong (NÊN) và ghi chú
- S4-12 (`imagesPurgedAt`), S4-46, US-058 phía server: chưa làm.
- Không ESC mới.
