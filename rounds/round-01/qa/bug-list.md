# Danh sách lỗi – Round 1 (round tài liệu)

- Tác giả: QA | Round 1 – Bước 5 (Kiểm thử) | Ngày: 16/10/2026 | **Cập nhật lượt 2/3 (16/10, sau vòng sửa)**: kiểm lại theo `qa/fix-notes-{ARC,BA,PO,DATA,INT,OPS}.md` và `qa/sec-findings.md` (Phần B, D); gộp 11 lỗi SEC (`BUG-R1-SEC-01…11`, giữ mã); thêm BUG-R1-023
- Phạm vi: lỗi **tài liệu** (lệch, thiếu, mâu thuẫn giữa PRD – backlog – business-rules – state-machines – rbac – ERD – OpenAPI – wireframe – test case) và lỗi **khung kỹ thuật** kiểm được tĩnh. Chưa có tính năng chạy được nên chưa có lỗi sản phẩm.
- Môi trường kiểm: bản tài liệu trong repo lúc 16/10/2026 sáng (backlog 145 story / 77 Must R2, OpenAPI `0.2.0-draft`, `rbac-matrix.json` 0.2, state-machines v0.2, business-rules v0.2, wireframe 01–10, test case v0.2.1). Máy kiểm: macOS, Python 3.9.6 + PyYAML 6.0.3 + openapi-spec-validator 0.7.2; **chưa có** node, pnpm, docker.
- Mức lỗi tài liệu theo `product/docs/qa/test-strategy.md` mục mức lỗi: **P0** = dev làm theo sẽ sai tiền / lộ dữ liệu C3 / đặt trùng; **P1** = mâu thuẫn chặn code luồng chính R2 hoặc OpenAPI cho vai làm việc rbac cấm; **P2** = lệch giữa tài liệu khiến dev phải đoán, có cách sửa rõ; **P3** = lệch nhỏ, chữ/ví dụ/số đếm, hoặc phần thuộc R3.
- Môi trường kiểm lại lượt 2: repo 16/10 chiều – OpenAPI `0.2.1-draft`, `openapi.test.yaml` 0.1.1-draft, `erd.md` v0.2.1, `state-machines.md` 0.2.1, `rbac-matrix.md/.json` 0.2.1, backlog (US-136 AC4 sửa 16/10), test case v0.2.2. Máy vẫn **chưa có** node, pnpm, docker.
- Trạng thái: **Open** (chưa sửa) · **Reopened** (QA kiểm lại không đạt) · **Closed** (QA đã tự kiểm lại đạt, có bằng chứng) · **Deferred R2/R3** (có lý do + nơi theo dõi). Cách kiểm mỗi lỗi ghi ở dòng "Kiểm lại lượt 2".

## 1. Tổng hợp

| Mức | Số lỗi | Open | Reopened | Closed | Deferred |
|---|---|---|---|---|---|
| P0 | 1 | 0 | 0 | 1 | 0 |
| P1 | 1 | 0 | 0 | 1 | 0 |
| P2 | 11 | 0 | 0 | 10 | 1 (R2) |
| P3 | 21 | 4 | 0 | 8 | 9 (7 R2 · 2 R3) |
| **Tổng** | **34** | **4** | **0** | **20** | **10** |

Lượt 1 (sáng 16/10): 22 lỗi QA (0 P0/P1). Lượt 2: gộp 9 lỗi SEC bước 5 + 2 lỗi SEC phát hiện khi kiểm lại (SEC-10, SEC-11) + 1 lỗi QA mới (023). **Không còn lỗi P0/P1 mở.** Không có lỗi Reopened.

| ID | Mức | Tóm tắt | Vai sửa | Trạng thái |
|---|---|---|---|---|
| BUG-R1-SEC-01 | P0 | `renderMessage` mẫu `door_code` trả mã cửa (C3) cho SAL/CTV, không thiết bị tin cậy, không nhật ký C3 | ARC (+BE) | **Closed** |
| BUG-R1-SEC-02 | P1 | `setParameter` cho MGR sửa tham số bảo mật, không có biên | ARC + BA (+BE) | **Closed** |
| BUG-R1-001 | P2 | SM-05 thiếu chuyển `review → partial` trong bảng chuyển (sơ đồ có) | BA | **Closed** |
| BUG-R1-002 | P2 | US-136 AC4 "khai báo có bản ghi mới" trái SM-05 K12 "dùng lại bản ghi" + ERD UK | PO (BA xác nhận) | **Closed** |
| BUG-R1-003 | P2 | K-22a dùng mã lý do hủy cũ, lệch BR-308 v0.2 | DATA | **Closed** |
| BUG-R1-004 | P2 | INT README `APP_ENV=development` lệch `dev` | INT | **Closed** |
| BUG-R1-005 | P2 | `listRooms`/`listRoomGroups` cho HK/MT trong khi rbac S25 cấm; `Room.maxOccupancy` chưa giới hạn vai | BA + ARC | **Closed** |
| BUG-R1-006 | P2 | `rbac-matrix.json` chưa theo quyết định bước 4 (A22 sale, A110 manager) | BA (+ARC) | **Closed** |
| BUG-R1-007 | P2 | Wireframe 10 dùng mã lỗi không có trong danh mục lỗi OpenAPI | ARC | **Closed** |
| BUG-R1-008 | P2 | TC-NT-022, TC-L4-053 dùng mẫu số bill cũ | QA | Closed (lượt 1) |
| BUG-R1-009 | P2 | Ví dụ BR-107 làm tròn | DOM | Closed (lượt 1) |
| BUG-R1-SEC-03 | P2 | Trang QR căn "gửi lại link" thu hồi link khách đang dùng (từ chối dịch vụ) | ARC | **Closed** |
| BUG-R1-SEC-10 | P2 | `getDoorCredential`/`setDoorCredential` thiếu step-up, `x-c3-log`, response 401/403 – vòng qua kiểm soát của `renderDoorCodeMessage` | ARC + SEC + BE | **Deferred R2** (hạn: trước khi BE cài A21) |
| BUG-R1-010 | P3 | Endpoint nhóm đơn (SM-16) và đóng ca (SM-17) chưa có trong OpenAPI | ARC | **Deferred R2** (plan R2 W1) |
| BUG-R1-011 | P3 | 4 operation OpenAPI hẹp vai hơn rbac | BA + ARC | **Closed** |
| BUG-R1-012 | P3 | Thiếu `x-scope: own` cho SAL/CTV ở 4 operation | ARC | **Closed** |
| BUG-R1-013 | P3 | Script kiểm quyền của QA báo 6 lệch giả | QA | Closed (lượt 1) |
| BUG-R1-014 | P3 | Ví dụ `billNo` trong OpenAPI theo mẫu cũ `F-yymmdd-nnnn` | ARC | **Open** (plan R2 W11) |
| BUG-R1-015 | P3 | Wireframe dùng `WO-031`, `WO-034` (3 số) | UXD | **Open** (plan R2 W11) |
| BUG-R1-016 | P3 | Mã đơn DS-0 4 số `OTM-0151` | QA (+ UXD) | **Deferred R2** (plan R2 W6) |
| BUG-R1-017 | P3 | Số đếm cũ "74 story Must R2" | ARC (PO đã sửa phần mình) | **Open** – còn phần ARC (plan R2 W11) |
| BUG-R1-018 | P3 | ERD mục 5 ghi SM-05 "K1–K11" | ARC | **Closed** |
| BUG-R1-019 | P3 | Tài liệu BA ghi cứng "06:00" không dẫn BR-010 | BA | **Closed** |
| BUG-R1-020 | P3 | 20/122 chuyển trạng thái, 31 BR, 4 lỗi BL chưa có test case (R3) | QA | **Deferred R3** |
| BUG-R1-021 | P3 | CI chưa có bước kiểm hợp đồng `x-roles` (`--strict`) và openapi-spec-validator | OPS | **Deferred R2** (plan R2 W5) |
| BUG-R1-022 | P3 | US-041, US-064 chưa có endpoint; US-064, US-137 chưa có wireframe (R3) | ARC/UXD | **Deferred R3** |
| BUG-R1-023 | P3 | `rbac-matrix.json` còn ghi chú/mục `openapi_check.differences` cũ sau khi sửa | BA | **Open** (mới lượt 2) |
| BUG-R1-SEC-04 | P3 | Operation app khách thiếu 403 `GUEST_STAY_ENDED`; `getGuestStay` không đánh dấu C3 | ARC | **Closed** |
| BUG-R1-SEC-05 | P3 | `providerSignature` mô tả như API key ở header | ARC (+INT) | **Closed** |
| BUG-R1-SEC-06 | P3 | Vai PostgreSQL lệch erd 2.1 (thiếu `ottimo_migrator`, owner có LOGIN) | OPS | **Deferred R2** – đã sửa, chờ chạy thật (plan R2 W4) |
| BUG-R1-SEC-07 | P3 | Mã xác minh khách băm bằng `ID_HASH_KEY`; `GUEST_CODE_SIGNING_KEY` chưa vào kiểm khởi động | ARC + OPS (+BE) | **Deferred R2** – phần R1 đạt, còn phần BE |
| BUG-R1-SEC-08 | P3 | Chưa có bước CI chặn `__test__` trong build production; `openapi.test.yaml` thiếu phiên | OPS + ARC | **Deferred R2** – đã sửa, chờ CI chạy thật (plan R2 W4) |
| BUG-R1-SEC-09 | P3 | INT README `APP_ENV=development` (trùng BUG-R1-004) | INT | **Closed** (trùng 004) |
| BUG-R1-SEC-11 | P3 | `x-c3-log` mới có ở 2 operation; operation C3 chưa khai 401/403; `setParameter` thiếu A119 | ARC | **Deferred R2** |

Ghi chú về Deferred: QA chỉ dời lỗi khi có nơi theo dõi. Nơi theo dõi là `rounds/round-02/plan.md` mục 3.2 (W1, W4, W5, W6, W11) hoặc quyết định SEC (sec-findings Phần D2, ORC ghi decision-log). Ba lỗi **chưa có dòng trong plan R2**: BUG-R1-SEC-10, SEC-11 và SEC-07 (phần BE). QA đề nghị PO/ORC thêm vào plan R2 mục 3.2 (xem test-report mục 7).

Lượt 1: không có lỗi P0/P1 của QA. Hai lỗi P1 sơ bộ ở bước 2 (khối OOO nửa mở; đơn OTA nhập tay vào căn đã kín) đã được DOM/PO/ARC sửa ở bước 4 – QA kiểm lại 16/10: BR-804 v0.2 (nửa mở), US-018 AC1/AC5, erd mục 7, OpenAPI `409 ROOM_UNAVAILABLE` + `suggestions[]` khớp nhau. Mã lỗi khóa lạc quan đã thống nhất `412 VERSION_CONFLICT` (ADR-009 điểm 9, coding-standards, OpenAPI).

---

## 2. Chi tiết

### BUG-R1-001 – SM-05 thiếu chuyển `review → partial` trong bảng chuyển
- Mức: P2 · Môi trường: tài liệu 16/10 · Vai sửa: **BA** · Trạng thái: **Closed**
- Tái hiện: (1) Mở `product/docs/state-machines.md`, sơ đồ SM-05 dòng 256: `review --> partial: Thêm người / bỏ một người`. (2) Xem bảng chuyển SM-05 (K1…K12, dòng 277–286) và bảng mã sự kiện dòng 563.
- Thực tế: bảng chuyển không có dòng `review → partial` (không mã K, không điều kiện, không vai). Script truy vết báo `TC-L3-055 → SM-05 review→partial` không khớp chuyển nào. ERD mục 5 cũng chỉ kiểm K1–K11.
- Mong đợi: mọi mũi tên trong sơ đồ có một dòng bảng chuyển (mã, sự kiện snake_case, điều kiện, vai) để BE sinh bảng chuyển trong `packages/contracts/src/state-machines/` và QA gắn TC.
- Bằng chứng: `product/docs/qa/traceability.md` mục 7 dòng cuối; QA-responses bước 4 đã đề nghị.
- Đề xuất: thêm K13 `review → partial` (sự kiện `remove_party_member`/`add_party_member`, FD+, điều kiện: số người có giấy tờ < số khách đơn sau khi thêm/bỏ), ERD mục 5 sửa "K1–K13".
- Kiểm lại lượt 2 (16/10): `state-machines.md` dòng 256 sơ đồ ghi "(K13)", dòng 287 bảng chuyển K13 `review → partial` (sự kiện `change_party`, điều kiện BR-601, vai FD+/SYS), dòng 565 bảng mã sự kiện. `gen_traceability.py --strict`: `bad SM refs: []` (trước: `TC-L3-055 → SM-05 review→partial`), chuyển trạng thái 102/122 (thêm K13, đã có TC-L3-055). **Đạt.**

### BUG-R1-002 – US-136 AC4 mâu thuẫn SM-05 K12 và ràng buộc ERD
- Mức: P2 · Vai sửa: **PO** (BA xác nhận) · Trạng thái: **Closed**
- Tái hiện: so `03-backlog/backlog.md` dòng 416 (US-136 AC4: "khai báo có **bản ghi mới** `none`") với `state-machines.md` dòng 286 (K12 `void → none`: "**Dùng lại** bản ghi khai báo của đơn – giữ ràng buộc một bản ghi/đơn, erd 4.7 UK").
- Thực tế: AC nói tạo bản ghi mới; máy trạng thái và ERD (UK `registration.reservation_id`) nói dùng lại bản ghi cũ. Làm theo AC sẽ vi phạm ràng buộc duy nhất; làm theo SM thì PO nghiệm thu AC4 sẽ "trượt".
- Mong đợi: một cách hiểu duy nhất.
- Đề xuất: PO sửa AC4 thành "bản ghi khai báo của đơn về `none` (SM-05 K12); ảnh đã xóa không khôi phục". TC-L2-074/075 đang test theo K12 – không phải sửa.
- Kiểm lại lượt 2 (16/10): backlog dòng 416 US-136 AC4 nay ghi "bản ghi khai báo của đơn được dùng lại và chuyển `void` → `none` (SM-05 K12 … **không** sinh bản ghi khai báo mới)". OpenAPI `restoreNoShow` (dòng 1611) cùng nghĩa. `grep -rn "bản ghi mới" product 03-backlog`: chỉ còn câu đúng nghĩa BR-608 (đơn con gia hạn). QA bỏ ghi chú lệch ở TC-L2-074 (test case v0.2.2). **Đạt.**

### BUG-R1-003 – Mã lý do hủy trong K-22a lệch BR-308 v0.2
- Mức: P2 · Vai sửa: **DATA** · Trạng thái: **Closed**
- Tái hiện: `product/docs/metrics-definitions.md` dòng 286 (K-22a loại trừ `hold_expired, relocated_external, channel_cancelled`) và ví dụ dòng 293 (`relocated_external`); so với BR-308 v0.2 (`ota_cancelled`, `overbooking_relocated`, có `guest_cancelled`), ERD và OpenAPI `CancelReasonCode`.
- Thực tế: hai mã `relocated_external`, `channel_cancelled` không tồn tại trong BR-308/ERD/OpenAPI → công thức K-22a cài theo tài liệu sẽ không loại trừ được đơn chuyển khách và đơn OTA tự hủy → tỉ lệ hủy bị thổi phồng.
- Mong đợi: K-22a dùng đúng mã BR-308 (ARC đã đề nghị ở `ARC-responses.md` mục 5, erd 14 E7).
- Đề xuất: thay `relocated_external` → `overbooking_relocated`, `channel_cancelled` → `ota_cancelled`; ghi rõ `guest_cancelled` **được** tính.
- Kiểm lại lượt 2 (16/10): `metrics-definitions.md` dòng 286 K-22a loại trừ `{hold_expired, overbooking_relocated, ota_cancelled}`, liệt kê mã được tính (có `guest_cancelled`); ví dụ dòng 293 dùng `overbooking_relocated`; mục 9 dòng 421 đủ danh mục BR-308 v0.2. `relocated_external`/`channel_cancelled` chỉ còn ở `stay_night.void_reason` và `overbooking_incident.resolution` – đúng tên trong ERD, không phải mã lý do hủy. ARC đã đóng E7 trong erd. **Đạt.**

### BUG-R1-004 – `APP_ENV` trong README tích hợp lệch giá trị hợp lệ
- Mức: P2 · Vai sửa: **INT** · Trạng thái: **Closed**
- Tái hiện: `product/integrations/README.md` dòng 270: `APP_ENV=development  # development | staging | production`. So với `architecture.md` dòng 315 (`dev|test|staging|production`), `product/.env.example` (`APP_ENV=dev`), `product/infra/docker-compose.yml` dòng 14 (`APP_ENV: dev`), `dev-setup.md` dòng 36 ("`APP_ENV=dev` là bắt buộc").
- Thực tế: dev chép khối biến từ README INT sẽ nhận `ConfigError` khi khởi động api/worker (dev-setup dòng 151); README cũng thiếu giá trị `test` mà CI dùng.
- Mong đợi: một danh sách giá trị duy nhất `dev|test|staging|production`.
- Đề xuất: INT sửa dòng 270 và chú thích mục 1.3 (quy tắc chặn mock/sandbox khi `production` giữ nguyên).
- Kiểm lại lượt 2 (16/10): `integrations/README.md` dòng 270 `APP_ENV=dev  # dev | test | staging | production`; dòng 15 `APP_ENV=dev|test|staging`; dòng 23 `APP_ENV === 'production'`. `grep -rn "APP_ENV=development\|'prod'" product/integrations product/docs` → 0 kết quả. Khớp `config.ts` `APP_ENVS`. **Đạt.** (SEC-09 trùng lỗi này, cũng Closed.)

### BUG-R1-005 – `listRooms`/`listRoomGroups` cho HK/MT nhưng rbac S25 cấm
- Mức: P2 · Vai sửa: **BA** (ghi phạm vi `catalog_only` vào rbac S25) + **ARC** (giới hạn trường) · Trạng thái: **Closed**
- Tái hiện: `python3 product/tests/tools/gen_traceability.py --strict` → exit 1; traceability mục 8: `listRooms`, `listRoomGroups` – OpenAPI cho thêm `housekeeping`, `maintenance`. `rbac-matrix.md` dòng 78: S25 HK ✖, MT ✖.
- Thực tế: OpenAPI mô tả HK/MT chỉ nhận `id`, `roomNo`, `floor`, `roomGroupId` "không giá, không sức chứa". Giá đã có `x-visible-to` (không lộ), nhưng `Room.maxOccupancy` **không** có `x-visible-to` → schema vẫn cho trả sức chứa cho HK/MT; rbac chưa ghi ngoại lệ.
- Vì sao P2 (không P1): không có dữ liệu C2/C3 nào lộ (giá được che bằng `x-visible-to`); lệch là ở văn bản rbac và một trường C0. Theo quy ước QA, "OpenAPI cho thêm vai" mặc định P1 – QA đã xem lại từng trường trước khi xếp P2.
- Đề xuất: BA thêm dòng S25a "Danh mục căn dạng tra cứu (`catalog_only`)" cho FDL/FD/HK/MT/SAL/CTV; ARC gắn `x-visible-to` cho `maxOccupancy`, `name` theo đúng mô tả. Sau đó `--strict` phải exit 0.
- Kiểm lại lượt 2 (16/10): OpenAPI `listRooms`, `listRoomGroups` `x-roles` = owner, manager, FDL, FD, SAL, CTV (không HK/MT), `x-scope catalog_only` cho FDL/FD/SAL/CTV; `Room.maxOccupancy` có `x-visible-to` (6 vai trên); `RoomStatusEntry` thêm `floor`, `roomGroupCode`. rbac.md ghi chú 25a + rbac.json `screen_scope_notes.S25`. `--strict` exit 0, ops mismatched 0. Thêm TC-RB-027. **Đạt.**

### BUG-R1-006 – `rbac-matrix.json` chưa theo quyết định bước 4
- Mức: P2 · Vai sửa: **BA** · Trạng thái: **Closed**
- Tái hiện: traceability mục 8. (a) `issueGuestLink` (A22, A22a) và `issueGuestVerificationCode` (A22, A113): rbac.json A22 vẫn có `sales_staff: own`, trong khi ARC đã **bỏ** sales_staff khỏi `issueGuestLink` theo đề nghị của BA (`ARC-responses.md` mục 5, dòng "BA – 7 chỗ lệch x-roles"). (b) `listTrustedDevices`, `trustCurrentDevice`, `revokeTrustedDevice` (A100/A110): rbac.json A110 có `manager: conditional`, trong khi OpenAPI, wireframe L1 (bảng vai: chỉ chủ đầu tư cấp/thu hồi thiết bị) và ARC ("thiết bị giữ owner") chỉ cho owner.
- Thực tế: nguồn chuẩn quyền (rbac, decision-log QA 15/10) nói khác OpenAPI và wireframe ở 5 operation → test quyền R2 tự sinh từ rbac sẽ báo đỏ sai, hoặc BE làm theo rbac mà mở quyền thiết bị cho manager.
- Đề xuất: BA sửa A22 (bỏ sale hoặc ghi rõ "sale chỉ xem link đơn của mình, không cấp"), A110 (manager ✖ hoặc ghi điều kiện cụ thể và báo ARC).
- Kiểm lại lượt 2 (16/10): rbac.json 0.2.1: A22 `roles` = owner, manager, FDL, FD, system (bỏ sales_staff); A110 `roles` = owner (bỏ manager), `operationIds` 3 operation thiết bị. OpenAPI `issueGuestLink` `x-rbac [A22a]`, `issueGuestVerificationCode` `[A113]`. Script: 0 operation lệch. **Đạt.** Ghi chú cũ còn sót trong rbac.json: tách thành BUG-R1-023 (P3).

### BUG-R1-007 – Wireframe 10 dùng mã lỗi chưa có trong hợp đồng API
- Mức: P2 · Vai sửa: **ARC** (thêm mã vào danh mục lỗi + response của `updateRoom`, `setParameter`) hoặc **UXD** (đổi theo mã có sẵn) · Trạng thái: **Closed**
- Tái hiện: `product/design/wireframes/10-config-crm-messages.html` dòng 90 `409 CAPACITY_BELOW_BOOKINGS`, dòng 124 `PARAM_OUT_OF_RANGE`; danh mục lỗi OpenAPI (45 mã, dòng ~60–125) không có hai mã này.
- Thực tế: FE/BE không biết mã nào là chuẩn; QA không viết được kỳ vọng cho ca giảm sức chứa khi còn đơn tương lai và ca tham số ngoài khoảng.
- Đề xuất: ARC thêm `CAPACITY_BELOW_BOOKINGS` (409, kèm `conflicts[]`) và `PARAM_OUT_OF_RANGE` (422, kèm `min`,`max`) vào danh mục + `responses`; QA thêm TC ở R2 tuần 1.
- Kiểm lại lượt 2 (16/10): bảng mã lỗi OpenAPI dòng 130–131 có `CAPACITY_BELOW_BOOKINGS` (409, `conflicts[]`) và `PARAM_OUT_OF_RANGE` (422, `min`/`max`/`allowed[]`); `updateRoom` có response 409 kèm ví dụ; `setParameter` response 422; `Problem` có `min`, `max`, `allowed`, `conflicts`. Wireframe 10 giữ nguyên, nay khớp. Thêm TC-NT-039 và TC-SEC-028. **Đạt.**

### BUG-R1-008 – Test case dùng mẫu số bill cũ
- Mức: P2 · Vai sửa: **QA** · Trạng thái: **Closed** (QA tự sửa và kiểm lại 16/10)
- Thực tế trước khi sửa: TC-NT-022 kỳ vọng `F-261015-0001`, `F-261016-0001` (đặt lại theo ngày); TC-L4-053 `F-261015-nnnn` – trái BR-007 v0.2 (`F26-000123`, liên tục theo cơ sở trong năm, đặt lại 1/1).
- Đã sửa: `product/tests/test-cases/r1-main-flows.md` v0.2.1 – TC-NT-022 kỳ vọng `F26-000001`, `F26-000002`, ngày 16/10 → `F26-000003` (không đặt lại theo ngày); TC-L4-053 `F26-nnnnnn`. Grep lại: 0 chuỗi `F-yymmdd` trong test case.

### BUG-R1-009 – Ví dụ BR-107 (làm tròn) – điểm treo đã biết
- Mức: P2 · Vai sửa: **DOM** · Trạng thái: **Closed** (QA kiểm lại 16/10)
- Kiểm lại: BR-107 v0.2 dòng 74 tính trên giá đêm niêm yết đã làm tròn (BR-101): 202 = 9.500.000 ÷ 12 → 792.000; 7 đêm 792.000 × 0,9 = 712.800 → 713.000 × 7 = **4.991.000**; 14 đêm 673.200 → 673.000 × 14 = **9.422.000**. QA tự tính lại: khớp. Khớp với quy tắc ERD 4.1 (`room_list_price` – BE-ARC-15) và TC-L5-001/002. Không còn chuỗi giá đêm chưa làm tròn (791.667) ngoài `round-0-baseline.md` (tài liệu gốc, giữ nguyên).

### BUG-R1-010 – Endpoint nhóm đơn và đóng ca chưa có
- Mức: P3 · Vai sửa: **ARC** (đầu R2, khi PO chốt phạm vi) · Trạng thái: **Deferred R2**
- Thực tế: SM-16 (G1–G5) và SM-17 (C1–C5) có trong state-machines và ERD (`reservation_group`, `shift`, `group_bill`, `payment_allocation`) nhưng OpenAPI chưa có operation và enum trạng thái (`ReservationGroupStatus`, `ShiftStatus`); 10 chuyển này không có endpoint, không có TC. ARC đã ghi Deferred (`ARC-responses.md` mục 5).
- Vì sao P3: US-140 (đơn nhóm) và US-124 (đóng ca) là Must **R3**; phần R2 (cờ chờ đối soát US-119 AC6) đã có `reconcilePayment`. Không chặn R2.
- Kiểm lại lượt 2 (16/10): chưa sửa (đúng kế hoạch). Theo dõi: `rounds/round-02/plan.md` mục 3.2 **W1** (ARC, tuần 1 R2). Lý do dời: US-140, US-124 là Must R3, không chặn R2.

### BUG-R1-011 – 4 operation OpenAPI hẹp vai hơn rbac
- Mức: P3 · Vai sửa: **BA + ARC** (chốt bên nào đúng) · Trạng thái: **Closed**
- Thực tế (traceability mục 8): `getArrivalsDepartures` (S02, S03) thiếu HK/MT/SAL/CTV; `listHkTasks` (S10) thiếu MT; `searchAvailability` (S03, S15) thiếu HK/MT; `createHkTask` (A83) thiếu HK (A83 HK `conditional`, A83-create không có HK).
- Vì sao P3: OpenAPI chặt hơn = không lộ dữ liệu; rủi ro là vai thiếu màn hình (ví dụ bảo trì cần xem việc buồng phòng của căn).
- Kiểm lại lượt 2 (16/10): ARC chốt OpenAPI đúng và sửa mã tham chiếu: `getArrivalsDepartures` `x-rbac [S02]`, `searchAvailability` `[S15]`, `createHkTask` `[A83-create]`; `listHkTasks` thêm `maintenance` với `x-scope read_only` (rbac S10 MT = R). Script: 0 lệch. Ca "MT xem việc buồng phòng" kiểm ở TC-RB-027 (c). **Đạt.**

### BUG-R1-012 – Thiếu `x-scope: own` cho SAL/CTV
- Mức: P3 · Vai sửa: **ARC** · Trạng thái: **Closed**
- Thực tế: rbac ô `M` cho SAL/CTV nhưng OpenAPI không có `x-scope` ở `createGuest` (S14), `createLead` (A52), `listMessageTemplates` (S29, A106-use), `searchAvailability` (S03, S15).
- Vì sao P3: 4 operation này không trả dữ liệu khách của người khác (tạo mới, mẫu tin, tồn phòng); vẫn cần khai báo để bộ test quyền tự sinh không báo đỏ và để rõ `owner_user_id` được gán khi tạo.
- Kiểm lại lượt 2 (16/10): `createGuest`, `createLead`, `listMessageTemplates`, `searchAvailability` đều có `x-scope {sales_staff: own, collaborator: own}`. Script: 0 lệch. **Đạt.**

### BUG-R1-013 – Script kiểm quyền của QA báo lệch giả
- Mức: P3 · Vai sửa: **QA** · Trạng thái: **Closed** (sửa 16/10, chạy lại kiểm)
- Thực tế trước khi sửa: 20 operation lệch, trong đó 6 là lỗi của script: `cancelRequest` (`x-scope: {all: own}` không được hiểu), `uploadGuestDocument`, `recordGuestConsent` (operation `/guest/*` chỉ cho `guest` nhưng bị so với cả cột nhân viên của A70/A72), `setMyApprovalPin`, `listUsers`, `updateReservation` (gộp dòng màn hình S-xx vào dòng hành động A-xx).
- Đã sửa `product/tests/tools/gen_traceability.py`: có A-xx thì bỏ S-xx; operation chỉ cho `guest` chỉ so cột GST; `x-scope.all` áp mọi vai. Chạy lại: **14** operation lệch, đã phân loại hết vào BUG-R1-005, 006, 011, 012 (2 + 5 + 4 + 4, `searchAvailability` có ở cả 011 và 012).

### BUG-R1-014 – Ví dụ `billNo` trong OpenAPI theo mẫu cũ
- Mức: P3 · Vai sửa: **ARC** · Trạng thái: **Open**
- Thực tế: `product/docs/api/openapi.yaml` dòng 2044 và 6017 `example: F-261022-0003` – trái BR-007 v0.2 / erd mục 10 (`F26-000123`). Đề xuất: đổi ví dụ, thêm `pattern: '^F\d{2}-\d{6,}$'`.
- Kiểm lại lượt 2 (16/10): **chưa sửa** – `openapi.yaml` dòng 2095 và 6186 vẫn `example: F-261022-0003`; chưa có `pattern`. ARC không nêu lỗi này trong fix-notes. Theo dõi: plan R2 mục 3.2 **W11**.

### BUG-R1-015 – Mã phiếu sửa 3 số trên wireframe
- Mức: P3 · Vai sửa: **UXD** · Trạng thái: **Open**
- Thực tế: `WO-031` (L1, L6, L8, L9), `WO-034` (L9) – trái mẫu `WO-{n:05}` (`WO-00034`, BR-007, erd mục 10). Đề xuất: đổi thành `WO-00031`, `WO-00034`.
- Kiểm lại lượt 2 (16/10): **chưa sửa** – `grep -rnoE "WO-[0-9]{3}\b" product/design/wireframes` còn ở 01, 02, 06, 08, 09 và index (UXD không có fix-notes). Theo dõi: plan R2 **W11**.

### BUG-R1-016 – Mã đơn DS-0 4 số
- Mức: P3 · Vai sửa: **QA** (test-strategy + seed R2), **UXD** đổi theo nếu QA đổi bộ mã · Trạng thái: **Deferred R2**
- Thực tế: test-strategy (DS-0), test case và wireframe dùng `OTM-0091`…`OTM-0163` (mã prototype BL 4.4), trong khi mẫu chuẩn là `OTM-{n:05}` và quyết định QA 15/10: đơn còn hiệu lực của DS-0 nạp **qua API** → server cấp mã mới, không giữ mã DS-0 → TC tra theo `OTM-0151` sẽ không tìm thấy đơn.
- Đề xuất (R2 tuần 1, cùng seed): coi mã DS-0 là **nhãn seed** lưu ở `reservation.external_ref`/ghi chú, TC tra đơn theo nhãn; hoặc nạp DS-0 với `doc_sequence` khởi đầu để mã sinh ra trùng nhãn. Ghi quyết định vào test-strategy.
- Kiểm lại lượt 2 (16/10): chưa sửa (việc của QA, gắn với seed). Còn 102 chỗ mã đơn 4 số trong design/docs/tests (gồm ví dụ mới `OTM-0152` ở response 409 `updateRoom`). Theo dõi: plan R2 **W6** (seed DS-E/DS-0 + quy ước mã).

### BUG-R1-017 – Số đếm cũ "74 story Must R2"
- Mức: P3 · Vai sửa: **ARC** (OpenAPI `info.description` "Phủ 74 story Must R2") + **PO** (backlog tiêu đề mục 4 "74 story Must Round 2") · Trạng thái: **Open** (phần ARC)
- Thực tế: backlog dòng 5 và decision-log PO 15/10 chốt **77** Must R2 (thêm US-139, US-141, US-142). Ma trận truy vết xác nhận cả 77 story có operation `x-stories` – chỉ là chữ cũ.
- Kiểm lại lượt 2 (16/10): phần PO **đạt** – backlog dòng 273 "77 story Must Round 2". QA sửa phần của mình: `test-strategy.md` dòng 21 và đầu file test case "74" → "77". Phần ARC **chưa sửa**: `openapi.yaml` dòng 134 vẫn "Phủ 74 story Must R2". Theo dõi: plan R2 **W11**.

### BUG-R1-018 – ERD mục 5 thiếu K12 của SM-05
- Mức: P3 · Vai sửa: **ARC** · Trạng thái: **Closed**
- Thực tế: `erd.md` mục 5 dòng SM-05 ghi "K1–K11"; state-machines v0.2 có K12 (`void → none`, khôi phục no-show). Sửa cùng BUG-R1-001 (K13).
- Kiểm lại lượt 2 (16/10): `erd.md` dòng 941 SM-05 "K1–K13" (K12, K13 có mô tả). **Đạt.**

### BUG-R1-019 – Ghi cứng mốc ngày nghiệp vụ, không dẫn BR-010
- Mức: P3 · Vai sửa: **BA** · Trạng thái: **Closed**
- Thực tế: `use-cases.md` (dòng 4, 126, 256), `business-processes.md` (dòng 4, 203, 260, 720, 732), `state-machines.md` (dòng 73, 132, 133) ghi "06:00", "00:00–05:59" và dẫn decision-log, nhưng không dẫn **BR-010** (tham số `business_day_rollover`). Trái QC B3 (tài liệu khác chỉ tham chiếu mã BR). Đề xuất: thêm "(BR-010, tham số `business_day_rollover`, mặc định 06:00)" ở mỗi chỗ.
- Kiểm lại lượt 2 (16/10): số lần dẫn BR-010 – `use-cases.md` 5, `business-processes.md` 7, `state-machines.md` 6; mọi vị trí QA nêu đã dẫn "BR-010, tham số `business_day_rollover`". Còn 1 chỗ nhỏ ngoài danh sách cũ: `state-machines.md` dòng 113 (B12) "trước 06:00 hôm sau" chưa dẫn BR-010 – cùng bảng đã có quy ước 0.2 điểm 7 dẫn BR-010 nên không gây hiểu sai; BA sửa khi chạm file lần sau, không mở lại. **Đạt.**

### BUG-R1-020 – Phần còn thiếu test case (thuộc R3 hoặc chưa có AC)
- Mức: P3 · Vai sửa: **QA** · Trạng thái: **Deferred R3**
- Thực tế: 20/121 chuyển trạng thái chưa có TC (SM-06 H3–H9, SM-07 T3, SM-11 `earned→payable`, `payable→paid`, SM-16 G1–G5, SM-17 C1–C5); 31 BR được story tham chiếu nhưng chưa có TC (traceability mục 5.6, đa số R3: BR-313/314, 316–326, 501–527, 705/706, 961–964…); 4 lỗi BL 8.2 chưa có TC chống tái phát: #11, #14, #22, #25 (P&L, độ đầy đủ hồ sơ, doanh thu dài hạn, VAT – đều R3).
- Kế hoạch: viết TC khi story có AC (đầu R3; SM-06 H3–H9 nếu PO đưa chấm dứt HĐ vào R2).
- Kiểm lại lượt 2 (16/10): không đổi – 20/122 chuyển trạng thái trống (SM-06 H3–H9, SM-07 T3, SM-11 ×2, SM-16 ×5, SM-17 ×5), 31 BR story-no-TC, BL #11, #14, #22, #25. Lý do dời: đều thuộc story R3 hoặc chưa có AC. Theo dõi: test case mục 11, traceability mục 5.6 và 7 (ô TRỐNG).

### BUG-R1-021 – CI chưa kiểm hợp đồng quyền và spec
- Mức: P3 · Vai sửa: **OPS** · Trạng thái: **Deferred R2**
- Thực tế: `.github/workflows/ci.yml` có Redocly lint, gitleaks, build ảnh và smoke `/health`, nhưng chưa có job `api-contract` ARC yêu cầu (openapi-spec-validator + kiểm `x-roles`; ARC-responses mục 6, yêu cầu OPS (3)). QA đã có lệnh sẵn: `python3 product/tests/tools/gen_traceability.py --strict --out /dev/null` (exit 1 khi OpenAPI cho thêm vai). Ghi chú: thêm bước này **sau** khi đóng BUG-R1-005, nếu không CI sẽ đỏ ngay.
- Kiểm lại lượt 2 (16/10): chưa có job `api-contract` (OPS ghi "ngoài phạm vi vòng này"). Điều kiện tiên quyết đã đủ: `--strict` exit 0. Theo dõi: plan R2 **W5**. Khi làm, nên thêm luôn kiểm `x-c3-log`/401/403 theo BUG-R1-SEC-11.

### BUG-R1-022 – Story ngoài Must R2 có TC nhưng thiếu endpoint/wireframe
- Mức: P3 · Vai sửa: **ARC/UXD ở R3** · Trạng thái: **Deferred R3**
- Thực tế: traceability mục 3: US-041, US-064 chưa có endpoint (R3); US-064, US-137 chưa có wireframe. Không thuộc Must R2, ghi để không quên khi lập R3.
- Kiểm lại lượt 2 (16/10): không đổi; story R3. Theo dõi: traceability mục 3, lập plan R3.


### BUG-R1-023 – `rbac-matrix.json` còn ghi chú và danh sách lệch cũ sau vòng sửa
- Mức: P3 · Môi trường: `rbac-matrix.json` 0.2.1 (16/10 chiều) · Vai sửa: **BA** · Trạng thái: **Open** (mới, lượt 2)
- Tái hiện: (1) Đọc `A22.note`: "OpenAPI x-rbac A22 = issueGuestLink, issueGuestVerificationCode". (2) Đọc `openapi_check.differences`: còn 3 mục `cancelRequest`, `listApprovalRequests`, `setMyApprovalPin`. (3) Chạy `gen_traceability.py --strict`.
- Thực tế: sau sửa, OpenAPI dùng `x-rbac [A22a]` và `[A113]`; `A22.operationIds = []`. Script báo 0 operation lệch, nhưng `openapi_check.differences` vẫn ghi 3 chỗ "missing_in_openapi" như còn lệch.
- Mong đợi: ghi chú và danh sách lệch trong rbac.json khớp trạng thái hiện tại. Người đọc (BE viết guard, QA sinh test quyền) không bị dẫn sai.
- Vì sao P3: chỉ là chú thích; bộ test quyền đọc `roles`/`operationIds`, không đọc `note`/`differences`.
- Đề xuất: BA sửa `A22.note` (A22 = gửi qua kênh hệ thống, không ánh xạ operation; A22a/A113 cho 2 operation trên), xóa hoặc đánh dấu "đã khớp" 3 mục `differences` (hoặc bỏ hẳn khối này vì script đã thay thế). Gộp vào plan R2 W11.

### BUG-R1-SEC-01 – `renderMessage` mẫu `door_code` trả mã cửa (C3) không qua kiểm soát C3
- Mức: **P0** · Môi trường: `openapi.yaml` 0.2.0-draft d.4346 · Vai sửa: **ARC** (contract), BE (cài R2) · Trạng thái: **Closed**
- Chi tiết gốc (bước tái hiện, mong đợi): `rounds/round-01/qa/sec-findings.md` Phần B. Tóm tắt: CTV/SAL và FD trên thiết bị chưa cấp lấy được mã cửa qua `renderMessage` mà không ghi `c3_access_log`.
- Kiểm lại lượt 2 (16/10, script PyYAML trên `openapi.yaml` 0.2.1-draft): operation mới `renderDoorCodeMessage` có `x-roles` [owner, manager, FDL, FD], `x-rbac [A21]`, `x-classification C3`, `x-requires-trusted-device true`, `x-step-up true`, `x-c3-log {door_credential, copy}`, responses 200/401/403/404/409/422/429. `renderMessage` mô tả từ chối mẫu `containsC3` → `422 VALIDATION_FAILED` (`C3_TEMPLATE_USE_DEDICATED_ENDPOINT`) với mọi vai. `MessageTemplate.containsC3` có; `listMessageTemplates` ẩn mẫu C3 với SAL/CTV. SEC kiểm lại: Đạt (Phần D1). Thêm TC-SEC-026, TC-SEC-027 (Smoke). **Đạt.** Đường thứ hai đến cùng mã cửa (`getDoorCredential`) chưa có step-up → BUG-R1-SEC-10.

### BUG-R1-SEC-02 – `setParameter` cho MGR sửa tham số bảo mật, không có biên
- Mức: **P1** · Môi trường: `openapi.yaml` 0.2.0-draft d.948; erd 9.3 · Vai sửa: **ARC** + **BA** (rbac A119), BE (cài R2) · Trạng thái: **Closed**
- Chi tiết gốc: sec-findings Phần B.
- Kiểm lại lượt 2 (16/10): `setParameter` có `x-security-parameters` 8 khóa. QA so từng biên với yêu cầu SEC: max_attempts 3–5, level2_idle 5–30, link_grace 0–24, channel_minutes 5–30, code_channels ⊆ 4 kênh (`uniqueItems`), trusted_device 1–180, mobile 1–30, c3_stepup 1–15. Khớp 8/8. Mô tả: chỉ owner (MGR → 403), ngoài biên → `422 PARAM_OUT_OF_RANGE` kể cả owner, audit `category='security'`. rbac.json có A119 (owner, `operationIds [setParameter]`, 8 `parameter_keys`); A118 ánh xạ `setParameter`. Script 0 lệch. Thêm TC-SEC-028 (Smoke). TC-SEC-008 bỏ giả định. **Đạt.** Phần còn thiếu nhỏ (`x-rbac` chưa có A119) chuyển vào BUG-R1-SEC-11.

### BUG-R1-SEC-03 – Gửi lại link từ trang QR căn thu hồi link khách đang dùng
- Mức: P2 · Môi trường: `openapi.yaml` d.4775; ADR-006 · Vai sửa: **ARC** · Trạng thái: **Closed**
- Kiểm lại lượt 2 (16/10): mô tả `resendGuestLinkFromUnit` đủ 6 điều SEC yêu cầu: link chờ `pending` không thu hồi link đang dùng; tối đa 2 token; kế thừa bộ đếm sai/khóa; không email thì không đổi gì; audit `security` mỗi lần, không ghi token; phản hồi 202 giống nhau. erd `guest_access_token.activation/replaces_token_id/first_opened_at` (dòng 698) và ADR-006 khớp. Thêm TC-SEC-029. **Đạt.**

### BUG-R1-SEC-04 – Operation app khách thiếu 403 sau trả phòng; `getGuestStay` không đánh dấu C3
- Mức: P3 · Vai sửa: **ARC** · Trạng thái: **Closed**
- Kiểm lại lượt 2 (16/10, script): 14/14 operation chỉ cho `guest` có `x-after-checkout`. 8 operation `blocked` đều có `403`. `getGuestFolio`, `withdrawGuestConsent` (`allowed`) có 403 cho `GUEST_VERIFICATION_REQUIRED`. `GuestForbidden` có ví dụ `GUEST_STAY_ENDED`, `GUEST_VERIFICATION_REQUIRED`. `getGuestStay` có `x-classification C3` và `x-c3-log`. Thêm TC-SEC-030. **Đạt.**

### BUG-R1-SEC-05 – `providerSignature` mô tả như API key ở header
- Mức: P3 · Vai sửa: **ARC** (+INT xác nhận) · Trạng thái: **Closed**
- Kiểm lại lượt 2 (16/10): mô tả scheme ghi "Không phải API key và không có middleware chung", adapter từng cổng kiểm (VNPay query `vnp_SecureHash`, MoMo `signature` trong body), so sánh thời gian hằng, fail-closed trước khi đọc dữ liệu. `webhookGet` có mô tả riêng (query ≤ 4 KB → 414, `RspCode=97`, không ghi query thô). **Đạt.** Webhook là `x-round: R3` nên chưa viết TC; viết khi làm thanh toán qua cổng.

### BUG-R1-SEC-06 – Vai PostgreSQL lệch erd 2.1
- Mức: P3 · Vai sửa: **OPS** · Trạng thái: **Deferred R2** (đã sửa, chờ chạy thật)
- Kiểm lại lượt 2 (16/10, kiểm tĩnh): `bash -n 02-roles.sh` OK. Đọc script: `ottimo_owner NOLOGIN PASSWORD NULL`; `ottimo_migrator LOGIN NOSUPERUSER NOBYPASSRLS NOINHERIT` + `GRANT ottimo_owner … WITH INHERIT FALSE, SET TRUE` (cần PG ≥ 16; mọi chỗ ghim `postgres:17-alpine`, cùng digest ở CI service, smoke và compose); `REVOKE ottimo_owner FROM ottimo_app/readonly`; tạo vai bằng `\gexec` rồi `ALTER ROLE` nên chạy lại được. `.env.example` dòng 23/57, `ci.yml` dòng 45/59/197, compose dòng 31 đều dùng `ottimo_migrator`/`OTTIMO_MIGRATOR_DB_PASSWORD`. Không còn `OTTIMO_OWNER_DB_PASSWORD` (chỉ còn trong hướng dẫn chuyển volume cũ ở `dev-setup.md`). `db-role.test.ts` kiểm 4 vai. **Chưa chạy** trên PostgreSQL thật (không có Docker).
- Lý do dời: phần sửa đúng theo kiểm tĩnh; chỉ còn bằng chứng chạy. SEC cũng chấm "Đạt có điều kiện". Đóng khi CI `build-test` + smoke xanh lần đầu. Theo dõi: plan R2 **W4**, TC-X-065.

### BUG-R1-SEC-07 – Mã xác minh khách dùng chung khóa `ID_HASH_KEY`
- Mức: P3 · Vai sửa: **ARC** + **OPS** (R1), **BE** (R2) · Trạng thái: **Deferred R2** (phần R1 Đạt)
- Kiểm lại lượt 2 (16/10): erd dòng 702 `code_hash` = HMAC-SHA256 với `GUEST_CODE_SIGNING_KEY`; ADR-013 điểm 5 "mỗi mục đích một khóa"; architecture dòng 315; `.env.example` dòng 43–44. Phần R1 **đạt**.
- Lý do dời: phần còn lại (BE thêm khóa vào `REQUIRED_SECRETS` của `config.ts`, ≥ 32 ký tự) chỉ làm được khi cài SR-GST ở R2. Theo dõi: ADR-013 điểm 5; SEC kiểm ở review code R2. **Chưa có dòng trong plan R2** – QA đề nghị thêm vào W9 hoặc phần việc BE.

### BUG-R1-SEC-08 – Chưa có bước CI chặn `__test__`; `openapi.test.yaml` thiếu phiên
- Mức: P3 · Vai sửa: **OPS** + **ARC** · Trạng thái: **Deferred R2** (đã sửa, chờ CI chạy thật)
- Kiểm lại lượt 2 (16/10): `openapi.test.yaml` `security: [{testToken: [], staffSession: []}]` (AND). openapi-spec-validator: OK. `ci.yml` parse OK, có job `test-surface-guard` (không `continue-on-error`) và bước kiểm bundle trong `docker-build`. QA tự chạy: `check-no-test-surface.sh spec docs/api/openapi.yaml` → exit 0; với `openapi.test.yaml` → exit 1, chỉ ra 2 path (đối chứng đúng); `bundle services/api/src` → exit 0. `Dockerfile.api` `ARG INCLUDE_TEST_SUPPORT=0` xóa `dist/test-support` trước `pnpm deploy`.
- Lý do dời: bước bundle trên image thật chưa chạy (không có Docker). Đóng khi CI xanh lần đầu. Theo dõi: plan R2 **W4**, TC-X-066.

### BUG-R1-SEC-09 – INT README `APP_ENV=development`
- Mức: P3 · Vai sửa: **INT** · Trạng thái: **Closed** (trùng BUG-R1-004)
- Kiểm lại lượt 2: xem BUG-R1-004. **Đạt.**

### BUG-R1-SEC-10 – `getDoorCredential`/`setDoorCredential` thiếu step-up, `x-c3-log` và response 401/403
- Mức: **P2** · Môi trường: `openapi.yaml` 0.2.1-draft d.2253–2310 · Vai sửa: **ARC** (contract), **SEC** (SR-C3-09, SR-DEV-03), **BE** (cài) · Trạng thái: **Deferred R2**
- Nguồn: sec-findings Phần D3. QA xác nhận bằng script: `getDoorCredential` có `x-classification C3`, `x-requires-trusted-device`, nhưng **không** `x-step-up`, **không** `x-c3-log`, responses chỉ `200, 404`. `setDoorCredential` không `x-step-up`, responses `200, 403, 412`. Cùng giá trị mã cửa với `renderDoorCodeMessage` (đã có step-up) → step-up của đường kia mất tác dụng.
- Mong đợi: cả hai thêm `x-step-up: true`, response 401/403/429; `getDoorCredential` thêm `x-c3-log {door_credential, view}`; `setDoorCredential` ghi `c3_access_log action=write`.
- Lý do dời: R1 chưa có mã nên chưa gây hại. Quyết định của SEC (Phần D2, ORC ghi decision-log): làm ở R2, **hạn trước khi BE cài A21 (khóa cửa)**. **Chưa có dòng trong plan R2** – QA đề nghị thêm vào W11 hoặc W2. TC: mở rộng TC-SEC-010 và TC-SEC-026 khi ARC sửa contract (FD máy quầy hết cửa sổ step-up gọi `getDoorCredential` → `401 REAUTH_REQUIRED`; trong cửa sổ → 200 + 1 dòng log).

### BUG-R1-SEC-11 – Chú thích máy đọc chưa đồng bộ cho bộ sinh test
- Mức: P3 · Vai sửa: **ARC** · Trạng thái: **Deferred R2**
- Nguồn: sec-findings Phần D3. QA xác nhận: trong 11 operation C3, chỉ `renderDoorCodeMessage` và `getGuestStay` có `x-c3-log`. Một số operation có `x-requires-trusted-device`/`x-step-up` không khai 401/403: `getDoorCredential` (200, 404), `addGuestDocument` (201, 422), `updateGuestDocument` (200), `getPortalData` (200), `purgeRegistrationImages` (204, 409). `setParameter` `x-rbac [A101, A102, A118]` thiếu A119.
- Lý do dời: chỉ ảnh hưởng bộ sinh test tầng R ở R2; quyền thực tế đã đúng ở rbac và mô tả. Hạn: trước khi QA sinh test tầng R từ contract. **Chưa có dòng trong plan R2** – QA đề nghị gộp vào W2. QA sẽ thêm luật kiểm vào `gen_traceability.py --strict` (mọi `x-classification: C3` đọc phải có `x-c3-log`; có `x-requires-trusted-device` phải khai 403; có `x-step-up` phải khai 401) cùng lúc OPS làm W5.

---

## 3. Không phải lỗi – bị chặn do môi trường

| Mục | Kết quả | Lý do |
|---|---|---|
| TC-X-050 `docker compose up` + `GET /health` | **BLOCKED (môi trường)** | `which node pnpm docker` → cả 3 "not found" (16/10 sáng và kiểm lại 16/10 chiều, lượt 2). Không báo đạt. |
| CI khung (format, lint, test, build, docker smoke) và TC-X-065, TC-X-066 | **BLOCKED (môi trường)** | Không chạy được cục bộ khi chưa có node/pnpm/docker; chưa có bằng chứng một lần chạy CI xanh trên GitHub. |

Hai mục này không mở ESC: không cần tiền, tài khoản hay quyết định của INV – chỉ chờ cài xong công cụ. QA chạy lại ngay khi máy có node 20 + pnpm + Docker (xem test-report mục 5).
