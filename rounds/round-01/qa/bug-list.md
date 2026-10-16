# Danh sách lỗi – Round 1 (round tài liệu)

- Tác giả: QA | Round 1 – Bước 5 (Kiểm thử) | Ngày: 16/10/2026
- Phạm vi: lỗi **tài liệu** (lệch, thiếu, mâu thuẫn giữa PRD – backlog – business-rules – state-machines – rbac – ERD – OpenAPI – wireframe – test case) và lỗi **khung kỹ thuật** kiểm được tĩnh. Chưa có tính năng chạy được nên chưa có lỗi sản phẩm.
- Môi trường kiểm: bản tài liệu trong repo lúc 16/10/2026 sáng (backlog 145 story / 77 Must R2, OpenAPI `0.2.0-draft`, `rbac-matrix.json` 0.2, state-machines v0.2, business-rules v0.2, wireframe 01–10, test case v0.2.1). Máy kiểm: macOS, Python 3.9.6 + PyYAML 6.0.3 + openapi-spec-validator 0.7.2; **chưa có** node, pnpm, docker.
- Mức lỗi tài liệu theo `product/docs/qa/test-strategy.md` mục mức lỗi: **P0** = dev làm theo sẽ sai tiền / lộ dữ liệu C3 / đặt trùng; **P1** = mâu thuẫn chặn code luồng chính R2 hoặc OpenAPI cho vai làm việc rbac cấm; **P2** = lệch giữa tài liệu khiến dev phải đoán, có cách sửa rõ; **P3** = lệch nhỏ, chữ/ví dụ/số đếm, hoặc phần thuộc R3.
- Trạng thái: Open · Fixed (tác giả báo đã sửa, chờ QA kiểm lại) · Closed (QA đã tự kiểm lại).

## 1. Tổng hợp

| Mức | Số lỗi | Open | Closed |
|---|---|---|---|
| P0 | 0 | 0 | 0 |
| P1 | 0 | 0 | 0 |
| P2 | 9 | 7 | 2 |
| P3 | 13 | 12 | 1 |
| **Tổng** | **22** | **19** | **3** |

| ID | Mức | Tóm tắt | Vai sửa | Trạng thái |
|---|---|---|---|---|
| BUG-R1-001 | P2 | SM-05 thiếu chuyển `review → partial` trong bảng chuyển (sơ đồ có) | BA | Open |
| BUG-R1-002 | P2 | US-136 AC4 "khai báo có bản ghi mới" trái SM-05 K12 "dùng lại bản ghi" + ERD UK | PO (BA xác nhận) | Open |
| BUG-R1-003 | P2 | K-22a dùng mã lý do hủy cũ, lệch BR-308 v0.2 | DATA | Open |
| BUG-R1-004 | P2 | INT README `APP_ENV=development` lệch `dev` (architecture, `.env.example`, compose, dev-setup) | INT | Open |
| BUG-R1-005 | P2 | `listRooms`/`listRoomGroups` cho HK/MT trong khi rbac S25 cấm; `Room.maxOccupancy` chưa giới hạn vai | BA + ARC | Open |
| BUG-R1-006 | P2 | `rbac-matrix.json` chưa theo quyết định bước 4 (A22 sale, A110 manager) – 5 operation lệch | BA | Open |
| BUG-R1-007 | P2 | Wireframe 10 dùng mã lỗi không có trong danh mục lỗi OpenAPI | ARC + UXD | Open |
| BUG-R1-008 | P2 | TC-NT-022, TC-L4-053 dùng mẫu số bill cũ, trái BR-007 v0.2 | QA | Closed |
| BUG-R1-009 | P2 | Ví dụ BR-107 làm tròn (điểm treo đã biết) | DOM | Closed |
| BUG-R1-010 | P3 | Endpoint nhóm đơn (SM-16) và đóng ca (SM-17) chưa có trong OpenAPI | ARC (đầu R2) | Open |
| BUG-R1-011 | P3 | 4 operation OpenAPI hẹp vai hơn rbac – cần chốt bên nào đúng | BA + ARC | Open |
| BUG-R1-012 | P3 | Thiếu `x-scope: own` cho SAL/CTV ở 4 operation | ARC | Open |
| BUG-R1-013 | P3 | Script kiểm quyền của QA báo 6 lệch giả | QA | Closed |
| BUG-R1-014 | P3 | Ví dụ `billNo` trong OpenAPI theo mẫu cũ `F-yymmdd-nnnn` | ARC | Open |
| BUG-R1-015 | P3 | Wireframe dùng `WO-031`, `WO-034` (3 số) trái mẫu `WO-00034` | UXD | Open |
| BUG-R1-016 | P3 | DS-0 dùng mã đơn 4 số `OTM-0151` trong khi đơn còn hiệu lực nạp qua API được cấp mã 5 số | QA (+ UXD) | Open |
| BUG-R1-017 | P3 | Số đếm cũ "74 story Must R2" ở OpenAPI và tiêu đề backlog mục 4 (thực tế 77) | ARC + PO | Open |
| BUG-R1-018 | P3 | ERD mục 5 ghi SM-05 "K1–K11", thiếu K12 | ARC | Open |
| BUG-R1-019 | P3 | Tài liệu BA ghi cứng "06:00" / "00:00–05:59" không dẫn BR-010 | BA | Open |
| BUG-R1-020 | P3 | 20/121 chuyển trạng thái, 31 BR, 4 lỗi BL chưa có test case (đều thuộc R3/chưa có AC) | QA | Open |
| BUG-R1-021 | P3 | CI chưa có bước kiểm hợp đồng `x-roles` (`gen_traceability.py --strict`) và openapi-spec-validator mà ARC yêu cầu | OPS | Open |
| BUG-R1-022 | P3 | Endpoint thiếu chú thích `x-stories` cho story US-041, US-064 (R3) – ô trống mục 3 ma trận | ARC (R3) | Open |

Không có lỗi P0/P1. Hai lỗi P1 sơ bộ ở bước 2 (khối OOO nửa mở; đơn OTA nhập tay vào căn đã kín) đã được DOM/PO/ARC sửa ở bước 4 – QA kiểm lại 16/10: BR-804 v0.2 (nửa mở), US-018 AC1/AC5, erd mục 7, OpenAPI `409 ROOM_UNAVAILABLE` + `suggestions[]` khớp nhau. Mã lỗi khóa lạc quan đã thống nhất `412 VERSION_CONFLICT` (ADR-009 điểm 9, coding-standards, OpenAPI).

---

## 2. Chi tiết

### BUG-R1-001 – SM-05 thiếu chuyển `review → partial` trong bảng chuyển
- Mức: P2 · Môi trường: tài liệu 16/10 · Vai sửa: **BA** · Trạng thái: Open
- Tái hiện: (1) Mở `product/docs/state-machines.md`, sơ đồ SM-05 dòng 256: `review --> partial: Thêm người / bỏ một người`. (2) Xem bảng chuyển SM-05 (K1…K12, dòng 277–286) và bảng mã sự kiện dòng 563.
- Thực tế: bảng chuyển không có dòng `review → partial` (không mã K, không điều kiện, không vai). Script truy vết báo `TC-L3-055 → SM-05 review→partial` không khớp chuyển nào. ERD mục 5 cũng chỉ kiểm K1–K11.
- Mong đợi: mọi mũi tên trong sơ đồ có một dòng bảng chuyển (mã, sự kiện snake_case, điều kiện, vai) để BE sinh bảng chuyển trong `packages/contracts/src/state-machines/` và QA gắn TC.
- Bằng chứng: `product/docs/qa/traceability.md` mục 7 dòng cuối; QA-responses bước 4 đã đề nghị.
- Đề xuất: thêm K13 `review → partial` (sự kiện `remove_party_member`/`add_party_member`, FD+, điều kiện: số người có giấy tờ < số khách đơn sau khi thêm/bỏ), ERD mục 5 sửa "K1–K13".

### BUG-R1-002 – US-136 AC4 mâu thuẫn SM-05 K12 và ràng buộc ERD
- Mức: P2 · Vai sửa: **PO** (BA xác nhận) · Trạng thái: Open
- Tái hiện: so `03-backlog/backlog.md` dòng 416 (US-136 AC4: "khai báo có **bản ghi mới** `none`") với `state-machines.md` dòng 286 (K12 `void → none`: "**Dùng lại** bản ghi khai báo của đơn – giữ ràng buộc một bản ghi/đơn, erd 4.7 UK").
- Thực tế: AC nói tạo bản ghi mới; máy trạng thái và ERD (UK `registration.reservation_id`) nói dùng lại bản ghi cũ. Làm theo AC sẽ vi phạm ràng buộc duy nhất; làm theo SM thì PO nghiệm thu AC4 sẽ "trượt".
- Mong đợi: một cách hiểu duy nhất.
- Đề xuất: PO sửa AC4 thành "bản ghi khai báo của đơn về `none` (SM-05 K12); ảnh đã xóa không khôi phục". TC-L2-074/075 đang test theo K12 – không phải sửa.

### BUG-R1-003 – Mã lý do hủy trong K-22a lệch BR-308 v0.2
- Mức: P2 · Vai sửa: **DATA** · Trạng thái: Open
- Tái hiện: `product/docs/metrics-definitions.md` dòng 286 (K-22a loại trừ `hold_expired, relocated_external, channel_cancelled`) và ví dụ dòng 293 (`relocated_external`); so với BR-308 v0.2 (`ota_cancelled`, `overbooking_relocated`, có `guest_cancelled`), ERD và OpenAPI `CancelReasonCode`.
- Thực tế: hai mã `relocated_external`, `channel_cancelled` không tồn tại trong BR-308/ERD/OpenAPI → công thức K-22a cài theo tài liệu sẽ không loại trừ được đơn chuyển khách và đơn OTA tự hủy → tỉ lệ hủy bị thổi phồng.
- Mong đợi: K-22a dùng đúng mã BR-308 (ARC đã đề nghị ở `ARC-responses.md` mục 5, erd 14 E7).
- Đề xuất: thay `relocated_external` → `overbooking_relocated`, `channel_cancelled` → `ota_cancelled`; ghi rõ `guest_cancelled` **được** tính.

### BUG-R1-004 – `APP_ENV` trong README tích hợp lệch giá trị hợp lệ
- Mức: P2 · Vai sửa: **INT** · Trạng thái: Open
- Tái hiện: `product/integrations/README.md` dòng 270: `APP_ENV=development  # development | staging | production`. So với `architecture.md` dòng 315 (`dev|test|staging|production`), `product/.env.example` (`APP_ENV=dev`), `product/infra/docker-compose.yml` dòng 14 (`APP_ENV: dev`), `dev-setup.md` dòng 36 ("`APP_ENV=dev` là bắt buộc").
- Thực tế: dev chép khối biến từ README INT sẽ nhận `ConfigError` khi khởi động api/worker (dev-setup dòng 151); README cũng thiếu giá trị `test` mà CI dùng.
- Mong đợi: một danh sách giá trị duy nhất `dev|test|staging|production`.
- Đề xuất: INT sửa dòng 270 và chú thích mục 1.3 (quy tắc chặn mock/sandbox khi `production` giữ nguyên).

### BUG-R1-005 – `listRooms`/`listRoomGroups` cho HK/MT nhưng rbac S25 cấm
- Mức: P2 · Vai sửa: **BA** (ghi phạm vi `catalog_only` vào rbac S25) + **ARC** (giới hạn trường) · Trạng thái: Open
- Tái hiện: `python3 product/tests/tools/gen_traceability.py --strict` → exit 1; traceability mục 8: `listRooms`, `listRoomGroups` – OpenAPI cho thêm `housekeeping`, `maintenance`. `rbac-matrix.md` dòng 78: S25 HK ✖, MT ✖.
- Thực tế: OpenAPI mô tả HK/MT chỉ nhận `id`, `roomNo`, `floor`, `roomGroupId` "không giá, không sức chứa". Giá đã có `x-visible-to` (không lộ), nhưng `Room.maxOccupancy` **không** có `x-visible-to` → schema vẫn cho trả sức chứa cho HK/MT; rbac chưa ghi ngoại lệ.
- Vì sao P2 (không P1): không có dữ liệu C2/C3 nào lộ (giá được che bằng `x-visible-to`); lệch là ở văn bản rbac và một trường C0. Theo quy ước QA, "OpenAPI cho thêm vai" mặc định P1 – QA đã xem lại từng trường trước khi xếp P2.
- Đề xuất: BA thêm dòng S25a "Danh mục căn dạng tra cứu (`catalog_only`)" cho FDL/FD/HK/MT/SAL/CTV; ARC gắn `x-visible-to` cho `maxOccupancy`, `name` theo đúng mô tả. Sau đó `--strict` phải exit 0.

### BUG-R1-006 – `rbac-matrix.json` chưa theo quyết định bước 4
- Mức: P2 · Vai sửa: **BA** · Trạng thái: Open
- Tái hiện: traceability mục 8. (a) `issueGuestLink` (A22, A22a) và `issueGuestVerificationCode` (A22, A113): rbac.json A22 vẫn có `sales_staff: own`, trong khi ARC đã **bỏ** sales_staff khỏi `issueGuestLink` theo đề nghị của BA (`ARC-responses.md` mục 5, dòng "BA – 7 chỗ lệch x-roles"). (b) `listTrustedDevices`, `trustCurrentDevice`, `revokeTrustedDevice` (A100/A110): rbac.json A110 có `manager: conditional`, trong khi OpenAPI, wireframe L1 (bảng vai: chỉ chủ đầu tư cấp/thu hồi thiết bị) và ARC ("thiết bị giữ owner") chỉ cho owner.
- Thực tế: nguồn chuẩn quyền (rbac, decision-log QA 15/10) nói khác OpenAPI và wireframe ở 5 operation → test quyền R2 tự sinh từ rbac sẽ báo đỏ sai, hoặc BE làm theo rbac mà mở quyền thiết bị cho manager.
- Đề xuất: BA sửa A22 (bỏ sale hoặc ghi rõ "sale chỉ xem link đơn của mình, không cấp"), A110 (manager ✖ hoặc ghi điều kiện cụ thể và báo ARC).

### BUG-R1-007 – Wireframe 10 dùng mã lỗi chưa có trong hợp đồng API
- Mức: P2 · Vai sửa: **ARC** (thêm mã vào danh mục lỗi + response của `updateRoom`, `setParameter`) hoặc **UXD** (đổi theo mã có sẵn) · Trạng thái: Open
- Tái hiện: `product/design/wireframes/10-config-crm-messages.html` dòng 90 `409 CAPACITY_BELOW_BOOKINGS`, dòng 124 `PARAM_OUT_OF_RANGE`; danh mục lỗi OpenAPI (45 mã, dòng ~60–125) không có hai mã này.
- Thực tế: FE/BE không biết mã nào là chuẩn; QA không viết được kỳ vọng cho ca giảm sức chứa khi còn đơn tương lai và ca tham số ngoài khoảng.
- Đề xuất: ARC thêm `CAPACITY_BELOW_BOOKINGS` (409, kèm `conflicts[]`) và `PARAM_OUT_OF_RANGE` (422, kèm `min`,`max`) vào danh mục + `responses`; QA thêm TC ở R2 tuần 1.

### BUG-R1-008 – Test case dùng mẫu số bill cũ
- Mức: P2 · Vai sửa: **QA** · Trạng thái: **Closed** (QA tự sửa và kiểm lại 16/10)
- Thực tế trước khi sửa: TC-NT-022 kỳ vọng `F-261015-0001`, `F-261016-0001` (đặt lại theo ngày); TC-L4-053 `F-261015-nnnn` – trái BR-007 v0.2 (`F26-000123`, liên tục theo cơ sở trong năm, đặt lại 1/1).
- Đã sửa: `product/tests/test-cases/r1-main-flows.md` v0.2.1 – TC-NT-022 kỳ vọng `F26-000001`, `F26-000002`, ngày 16/10 → `F26-000003` (không đặt lại theo ngày); TC-L4-053 `F26-nnnnnn`. Grep lại: 0 chuỗi `F-yymmdd` trong test case.

### BUG-R1-009 – Ví dụ BR-107 (làm tròn) – điểm treo đã biết
- Mức: P2 · Vai sửa: **DOM** · Trạng thái: **Closed** (QA kiểm lại 16/10)
- Kiểm lại: BR-107 v0.2 dòng 74 tính trên giá đêm niêm yết đã làm tròn (BR-101): 202 = 9.500.000 ÷ 12 → 792.000; 7 đêm 792.000 × 0,9 = 712.800 → 713.000 × 7 = **4.991.000**; 14 đêm 673.200 → 673.000 × 14 = **9.422.000**. QA tự tính lại: khớp. Khớp với quy tắc ERD 4.1 (`room_list_price` – BE-ARC-15) và TC-L5-001/002. Không còn chuỗi giá đêm chưa làm tròn (791.667) ngoài `round-0-baseline.md` (tài liệu gốc, giữ nguyên).

### BUG-R1-010 – Endpoint nhóm đơn và đóng ca chưa có
- Mức: P3 · Vai sửa: **ARC** (đầu R2, khi PO chốt phạm vi) · Trạng thái: Open
- Thực tế: SM-16 (G1–G5) và SM-17 (C1–C5) có trong state-machines và ERD (`reservation_group`, `shift`, `group_bill`, `payment_allocation`) nhưng OpenAPI chưa có operation và enum trạng thái (`ReservationGroupStatus`, `ShiftStatus`); 10 chuyển này không có endpoint, không có TC. ARC đã ghi Deferred (`ARC-responses.md` mục 5).
- Vì sao P3: US-140 (đơn nhóm) và US-124 (đóng ca) là Must **R3**; phần R2 (cờ chờ đối soát US-119 AC6) đã có `reconcilePayment`. Không chặn R2.

### BUG-R1-011 – 4 operation OpenAPI hẹp vai hơn rbac
- Mức: P3 · Vai sửa: **BA + ARC** (chốt bên nào đúng) · Trạng thái: Open
- Thực tế (traceability mục 8): `getArrivalsDepartures` (S02, S03) thiếu HK/MT/SAL/CTV; `listHkTasks` (S10) thiếu MT; `searchAvailability` (S03, S15) thiếu HK/MT; `createHkTask` (A83) thiếu HK (A83 HK `conditional`, A83-create không có HK).
- Vì sao P3: OpenAPI chặt hơn = không lộ dữ liệu; rủi ro là vai thiếu màn hình (ví dụ bảo trì cần xem việc buồng phòng của căn).

### BUG-R1-012 – Thiếu `x-scope: own` cho SAL/CTV
- Mức: P3 · Vai sửa: **ARC** · Trạng thái: Open
- Thực tế: rbac ô `M` cho SAL/CTV nhưng OpenAPI không có `x-scope` ở `createGuest` (S14), `createLead` (A52), `listMessageTemplates` (S29, A106-use), `searchAvailability` (S03, S15).
- Vì sao P3: 4 operation này không trả dữ liệu khách của người khác (tạo mới, mẫu tin, tồn phòng); vẫn cần khai báo để bộ test quyền tự sinh không báo đỏ và để rõ `owner_user_id` được gán khi tạo.

### BUG-R1-013 – Script kiểm quyền của QA báo lệch giả
- Mức: P3 · Vai sửa: **QA** · Trạng thái: **Closed** (sửa 16/10, chạy lại kiểm)
- Thực tế trước khi sửa: 20 operation lệch, trong đó 6 là lỗi của script: `cancelRequest` (`x-scope: {all: own}` không được hiểu), `uploadGuestDocument`, `recordGuestConsent` (operation `/guest/*` chỉ cho `guest` nhưng bị so với cả cột nhân viên của A70/A72), `setMyApprovalPin`, `listUsers`, `updateReservation` (gộp dòng màn hình S-xx vào dòng hành động A-xx).
- Đã sửa `product/tests/tools/gen_traceability.py`: có A-xx thì bỏ S-xx; operation chỉ cho `guest` chỉ so cột GST; `x-scope.all` áp mọi vai. Chạy lại: **14** operation lệch, đã phân loại hết vào BUG-R1-005, 006, 011, 012 (2 + 5 + 4 + 4, `searchAvailability` có ở cả 011 và 012).

### BUG-R1-014 – Ví dụ `billNo` trong OpenAPI theo mẫu cũ
- Mức: P3 · Vai sửa: **ARC** · Trạng thái: Open
- Thực tế: `product/docs/api/openapi.yaml` dòng 2044 và 6017 `example: F-261022-0003` – trái BR-007 v0.2 / erd mục 10 (`F26-000123`). Đề xuất: đổi ví dụ, thêm `pattern: '^F\d{2}-\d{6,}$'`.

### BUG-R1-015 – Mã phiếu sửa 3 số trên wireframe
- Mức: P3 · Vai sửa: **UXD** · Trạng thái: Open
- Thực tế: `WO-031` (L1, L6, L8, L9), `WO-034` (L9) – trái mẫu `WO-{n:05}` (`WO-00034`, BR-007, erd mục 10). Đề xuất: đổi thành `WO-00031`, `WO-00034`.

### BUG-R1-016 – Mã đơn DS-0 4 số
- Mức: P3 · Vai sửa: **QA** (test-strategy + seed R2), **UXD** đổi theo nếu QA đổi bộ mã · Trạng thái: Open
- Thực tế: test-strategy (DS-0), test case và wireframe dùng `OTM-0091`…`OTM-0163` (mã prototype BL 4.4), trong khi mẫu chuẩn là `OTM-{n:05}` và quyết định QA 15/10: đơn còn hiệu lực của DS-0 nạp **qua API** → server cấp mã mới, không giữ mã DS-0 → TC tra theo `OTM-0151` sẽ không tìm thấy đơn.
- Đề xuất (R2 tuần 1, cùng seed): coi mã DS-0 là **nhãn seed** lưu ở `reservation.external_ref`/ghi chú, TC tra đơn theo nhãn; hoặc nạp DS-0 với `doc_sequence` khởi đầu để mã sinh ra trùng nhãn. Ghi quyết định vào test-strategy.

### BUG-R1-017 – Số đếm cũ "74 story Must R2"
- Mức: P3 · Vai sửa: **ARC** (OpenAPI `info.description` "Phủ 74 story Must R2") + **PO** (backlog tiêu đề mục 4 "74 story Must Round 2") · Trạng thái: Open
- Thực tế: backlog dòng 5 và decision-log PO 15/10 chốt **77** Must R2 (thêm US-139, US-141, US-142). Ma trận truy vết xác nhận cả 77 story có operation `x-stories` – chỉ là chữ cũ.

### BUG-R1-018 – ERD mục 5 thiếu K12 của SM-05
- Mức: P3 · Vai sửa: **ARC** · Trạng thái: Open
- Thực tế: `erd.md` mục 5 dòng SM-05 ghi "K1–K11"; state-machines v0.2 có K12 (`void → none`, khôi phục no-show). Sửa cùng BUG-R1-001 (K13).

### BUG-R1-019 – Ghi cứng mốc ngày nghiệp vụ, không dẫn BR-010
- Mức: P3 · Vai sửa: **BA** · Trạng thái: Open
- Thực tế: `use-cases.md` (dòng 4, 126, 256), `business-processes.md` (dòng 4, 203, 260, 720, 732), `state-machines.md` (dòng 73, 132, 133) ghi "06:00", "00:00–05:59" và dẫn decision-log, nhưng không dẫn **BR-010** (tham số `business_day_rollover`). Trái QC B3 (tài liệu khác chỉ tham chiếu mã BR). Đề xuất: thêm "(BR-010, tham số `business_day_rollover`, mặc định 06:00)" ở mỗi chỗ.

### BUG-R1-020 – Phần còn thiếu test case (thuộc R3 hoặc chưa có AC)
- Mức: P3 · Vai sửa: **QA** · Trạng thái: Open
- Thực tế: 20/121 chuyển trạng thái chưa có TC (SM-06 H3–H9, SM-07 T3, SM-11 `earned→payable`, `payable→paid`, SM-16 G1–G5, SM-17 C1–C5); 31 BR được story tham chiếu nhưng chưa có TC (traceability mục 5.6, đa số R3: BR-313/314, 316–326, 501–527, 705/706, 961–964…); 4 lỗi BL 8.2 chưa có TC chống tái phát: #11, #14, #22, #25 (P&L, độ đầy đủ hồ sơ, doanh thu dài hạn, VAT – đều R3).
- Kế hoạch: viết TC khi story có AC (đầu R3; SM-06 H3–H9 nếu PO đưa chấm dứt HĐ vào R2).

### BUG-R1-021 – CI chưa kiểm hợp đồng quyền và spec
- Mức: P3 · Vai sửa: **OPS** · Trạng thái: Open
- Thực tế: `.github/workflows/ci.yml` có Redocly lint, gitleaks, build ảnh và smoke `/health`, nhưng chưa có job `api-contract` ARC yêu cầu (openapi-spec-validator + kiểm `x-roles`; ARC-responses mục 6, yêu cầu OPS (3)). QA đã có lệnh sẵn: `python3 product/tests/tools/gen_traceability.py --strict --out /dev/null` (exit 1 khi OpenAPI cho thêm vai). Ghi chú: thêm bước này **sau** khi đóng BUG-R1-005, nếu không CI sẽ đỏ ngay.

### BUG-R1-022 – Story ngoài Must R2 có TC nhưng thiếu endpoint/wireframe
- Mức: P3 · Vai sửa: **ARC/UXD ở R3** · Trạng thái: Open
- Thực tế: traceability mục 3: US-041, US-064 chưa có endpoint (R3); US-064, US-137 chưa có wireframe. Không thuộc Must R2, ghi để không quên khi lập R3.

---

## 3. Không phải lỗi – bị chặn do môi trường

| Mục | Kết quả | Lý do |
|---|---|---|
| TC-X-050 `docker compose up` + `GET /health` | **BLOCKED (môi trường)** | `which node pnpm docker` → cả 3 "not found" (16/10). Chủ đầu tư đang cài. Không báo đạt. |
| CI khung (format, lint, test, build, docker smoke) | **BLOCKED (môi trường)** | Không chạy được cục bộ khi chưa có node/pnpm/docker; chưa có bằng chứng một lần chạy CI xanh trên GitHub. |

Hai mục này không mở ESC: không cần tiền, tài khoản hay quyết định của INV – chỉ chờ cài xong công cụ. QA chạy lại ngay khi máy có node 20 + pnpm + Docker (xem test-report mục 5).
