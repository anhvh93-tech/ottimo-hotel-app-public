# Cổng QC giữa round – Round 2, Sprint 2 (đặt phòng, chống trùng, giữ chỗ, cọc, OOO, no-show, OTA trùng căn)

- Người kiểm: QC | Ngày: 16/10/2026 | Không sửa sản phẩm, không commit
- Bản kiểm: `main` @ `cfcf6d8` (khớp `headSha` của CI run 38911271416). Cây làm việc chỉ khác HEAD ở `rounds/round-02/qa/bug-list.md` (dòng BUG-R2-023 → Closed).
- Chuẩn chấm: plan R2 mục 4, dòng Sprint 2 ("Đặt + giữ chỗ + chống trùng chạy trên staging; QA smoke chống trùng xanh"); tiêu chí round mục 7 (A3, B1–B4, C4) áp ở phần thuộc Sprint 2; DoD protocol. Đây là cổng sprint, không phải QC gate cuối Round 2.

## 1. Quyết định: **ĐẠT CÓ ĐIỀU KIỆN**

Lý do:
1. Lõi Sprint 2 có bằng chứng chạy thật. CI 6/6 xanh, E2E trên stack sạch 783 đạt, 0 trượt. Chống đặt trùng được chặn ở tầng PostgreSQL và qua test đồng thời. Không còn lỗi P0/P1, 26/26 thẻ Blocker/Major của Sprint 2 đã xử lý. Mọi thao tác tiền (folio, cọc, hoa hồng, phí kênh) đều có `recordMoney`.
2. Có điều kiện vì: chưa có staging; PO chưa nghiệm thu AC nào; UI admin-web chưa chạy bằng trình duyệt (chưa có E2E UI, axe, VoiceOver); 5 story mới làm một phần nhưng backlog chưa ghi phần dời. QC kiểm mẫu còn thấy 2 lỗi mới (mục 4), không lỗi nào sai tiền hay lộ dữ liệu.
3. Chỉ có 2 lỗi P3 còn mở và chưa đóng thủ tục (BUG-R2-014, BUG-R2-010). Không có lỗi bảo mật nghiêm trọng. Sprint 3 được bắt đầu song song với việc thực hiện các điều kiện ở mục 5.

## 2. Bảng kiểm

| # | Tiêu chí | Kết quả | Bằng chứng |
|---|---|---|---|
| K1 | CI chạy thật, xanh trên nhánh chính (B1) | **Đạt** | `gh run view 38911271416`: 6/6 job xanh (format·lint·audit·test·build; API contract `--strict`; gitleaks; no test endpoints; Redocly; docker build + E2E). `headSha` = HEAD `cfcf6d8`. Log job E2E: `783 passed`, `193 skipped`, 0 failed. Có bước guard TC-SEC-024 (Origin) và ca này đã chạy |
| K2 | 0 lỗi P0/P1 Open (B2) | **Đạt** | `qa/bug-list.md`: P1 3/3 Closed (005, 006, 015). P2 Open = 0: BUG-R2-023 Closed theo CI, TC-L2-080 đạt ở log run 38911271416 (ca số 925). P3: BUG-R2-014 vẫn ghi **Open** nhưng code đã sửa (`test-support.module.ts:254`: chỉ mở khóa khi `locked_until IS NOT NULL`), QA chưa kiểm lại. BUG-R2-010 Fixed, chờ kiểm UI. **Bảng tổng mục 1 của bug-list còn sai**: ghi P2 Open 1, P3 Fixed 1 → ĐK-S2-1 |
| K3 | Chống đặt trùng (A3, US-018) | **Đạt (tầng API/DB)** | Migration `0014`: `EXCLUDE USING gist (room_id WITH =, stay_range WITH &&) WHERE (active)` trên `room_occupancy`, gồm cả đơn, giữ chỗ và OOO (`kind` ∈ reservation/hold/ooo). Log CI: TC-L2-021 (8 yêu cầu song song × 20 vòng) và TC-X-001 (50 → 1×201, 49×409, 0×5xx) đều ✓; TC-X-002/003 đạt (s2-retest mục 2). QA đã cài thử một API cố ý cho đặt trùng và test bắt được (s2-report 3.3). Giữ chỗ hết hạn: J1 qua MutableClock, đúng biên 1 giây. **Chưa đạt ở UI**: xem phát hiện QC-S2-02 |
| K4 | Tiền có nhật ký (folio/cọc/hoa hồng – A7 phần R2) | **Đạt** | `folio.service.ts`: `recordMoney` ở đồng bộ đêm, đảo khi hủy/no-show, hoa hồng `voided`, phí kênh (dòng 375, 480, 575, 701, 730, 835). `deposits.service.ts:215` và `payment.service.ts:80` cũng có `recordMoney`. Đổi người chốt ghi `reservation.closer_changed` (SEC-BE-26). Hoa hồng lấy % snapshot báo giá (`reservations.service.ts:981` → `folio.service.ts:666`), không lấy % tham số hiện tại. E2E: TC-L2-053 (b) hủy thật đảo 3 dòng phòng + 1 dòng phí 350.000; TC-L2-082 4.079.000 ↔ 5.205.000 khớp oracle BR-107-03/04; TC-X-003 hai người cùng xác nhận cọc → chỉ 1 lần thành công |
| K5 | Thẻ Blocker/Major Sprint 2 đóng hoặc có lý do dời (C4) | **Đạt** | 26 thẻ (ARC 6 Major; DOM 1 Blocker + 7 Major; SEC 3 Major; UXD 9 Major) đều có dòng **Done** trong `responses/s2-BE-A.md`, `s2-BE-B.md`, `s2-FE.md`, `ARC-responses.md`. FB-R2-DOM-FE-01 "Done (phần FE), chờ UXD": chuỗi `move.reason.*` đã có trong `responses/s2-UXD.md`. Thẻ dời đều là Minor (SEC-BE-31 → S3, ARC-BE-S2-12 → S4) và có lý do. **Lưu ý**: SEC và DOM chưa tự kiểm lại bản sửa; QC dựa vào E2E (TC-L5-051 dryRun → 422, CONCURRENT_UPDATE, TC-L2-053/071/074 đảo folio) |
| K6 | Bảo mật (B3, phần Sprint 2) | **Đạt** | `reviews/s2-SEC.md`: 0 Blocker, 3 Major (đã Done). Đã kiểm: RLS 19/19 bảng mới có ENABLE + FORCE; phạm vi M của SAL/CTV lọc trong SQL, trả 404; `conflicts[]` ẩn mã đơn/tên với SAL/CTV/MT (TC-L6-041 đạt). Runner quyền Sprint 2: 363 ca đạt. Gitleaks xanh, không có khóa thật trong repo |
| K7 | Story Sprint 2 đạt AC (C1 phần Sprint 2) | **Đạt một phần** | Xem mục 3. 13/18 story đạt AC phần R2 ở tầng API. 5 story mới làm một phần, phần còn lại có ghi dời trong báo cáo BE/FE nhưng **chưa ghi vào backlog**: cột Trạng thái của cả 18 story vẫn là "Mới". **Chưa có nghiệm thu của PO**: không có `outputs/PO/acceptance.md`; P-R2-7 yêu cầu nghiệm thu trên staging |
| K8 | Staging (mức "đủ dùng" của Sprint 2: chạy trên staging) | **Không đạt** | Chưa có VPS/tên miền (sprint-1-summary mục 3; ESC-002/010 còn chờ INV gửi). Hiện dùng tạm stack compose dùng một lần có Origin như staging (decision-log 16/10, dòng 360). Plan mục 8 quy định ORC nâng ESC lên "Gấp" khi thiếu tên miền quá tuần 2, nhưng chưa thấy dòng nào ghi việc nâng mức |
| K9 | Truy vết (C3 phần Sprint 2) | **Đạt, còn 1 lệch** | `gen_traceability.py --strict` exit 0 (402 TC, AC 251/251, ops lệch 0); `gen_rbac_cases --check` OK (181 operation, 1991 ca); OpenAPI 0.3.5-draft có `CONCURRENT_UPDATE`, `HOLD_LIMIT_REACHED`. Còn lệch: backlog chưa ghi phần dời của 5 story (K7); comment `reservations.module.ts:5` nói có cài `ROOM_CAPACITY_CHECK` nhưng code không có (QC-S2-01) |
| K10 | UI admin-web H08–H12 (C2 phần Sprint 2) | **Chưa có bằng chứng** | 18 ca `desk-chromium` đều bỏ qua (chưa bật `E2E_UI`, máy chưa cài trình duyệt Playwright). Chưa chạy axe (chưa có `@axe-core/playwright`), chưa thử VoiceOver và zoom 200 %. FE tự báo: phần FE chạy trên MSW, chưa thử với API thật trong trình duyệt (`outputs/FE/s2-report.md` mục 6). Chỉ có test đơn vị admin-web xanh trong CI |

## 3. Story Sprint 2 (18 story Must R2 của Sprint 2; tổng Must R2 là 71 sau khi PO dời US-056)

| Story | AC phần R2 | Bằng chứng chính | Phần chưa xong / dời (cần ghi vào backlog) |
|---|---|---|---|
| US-016 rack 14 ngày | Đạt API; UI chưa thử trình duyệt | RackBar 0.3.5 (ARC-BE-S2-06), H08 + test đơn vị | – |
| US-017 tạo đơn (+ AC5a, AC9) | Đạt | TC-L2-010…016, 079, 080 ✓ (CI) | – |
| US-018 chống trùng | Đạt API/DB | K3 | Thông báo trên UI khi trả `CONCURRENT_UPDATE` (QC-S2-02) |
| US-019 OOO | Đạt API | TC-L2-030…033 | Màn tạo khối OOO (S4 Bảo trì) → Sprint 4 (FE s2-report mục 6) |
| US-020 chi tiết đơn | Một phần | Drawer H11, `allowedActions` | Xem folio đầy đủ (dòng/thu) → Sprint 3 cùng folio/bill |
| US-021 hủy | Đạt | TC-L2-052, 053 (a)(b) | Chi tiền hoàn (luồng `refund`) → Sprint 3 |
| US-022 người đi cùng | **Chưa làm** | – | Toàn bộ → Sprint 3 (cần mã hóa C3 trẻ em; `s2-be-a.md` mục 8) |
| US-023 mã duy nhất | Đạt | DocNumberService, seed 7/7 mã khớp | – |
| US-024 đổi căn/ngày | Một phần | B7/B8, swap (đơn `confirmed`) | B14 đổi phòng cho khách đang ở → Sprint 3; FE chưa có `swapRoom`/`updateReservation` |
| US-136 no-show | Một phần | Đánh dấu, khôi phục, cần duyệt (clock ✓) | J6/J7 nhắc gọi + "Cần chú ý" → Sprint 4 |
| US-080 báo giá ngắn | Đạt | TC-L5-001…006 khớp oracle | – |
| US-082 căn trống | Đạt | `searchAvailability`, gợi ý cùng nhóm hoặc nhóm cao hơn (BUG-R2-020 Closed) | – |
| US-083 lưu báo giá + văn bản | Đạt API | `generated/quote-copy.ts`, `extendQuote` | – |
| US-084 giữ chỗ từ báo giá | Đạt | TC-L5-021…025, `HOLD_LIMIT_REACHED` | – |
| US-085 giữ chỗ hết hạn | Một phần | J1 ✓, có tiền thì không tự hủy (D-9) | J2 nhắc trước hạn → Sprint 4 |
| US-086 xác nhận cọc | Đạt (trừ AC3 dời R3) | TC-X-003, A-13 | VietQR → Sprint 3 |
| US-087 CTV chỉ thấy của mình | Đạt | SEC K6, runner quyền | – |
| US-139 OTA trùng căn | Đạt API | TC-L2-024, 027, 028 | – |

## 4. Phát hiện của QC khi kiểm mẫu (đọc code)

### QC-S2-01 – `CAPACITY_BELOW_BOOKINGS` không bao giờ được trả (US-004 AC, Sprint 1 hẹn nối ở Sprint 2)
- Mức: **P2** (QA ghi vào bug-list)
- Vai sửa: BE-A, phối hợp BE-B
- Vị trí: `services/api/src/modules/platform/platform.module.ts:43` vẫn là `{ provide: ROOM_CAPACITY_CHECK, useValue: NO_BOOKINGS_YET }`. Module reservations không ghi đè cổng này: chỉ có comment ở `reservations.module.ts:5`, không có provider. `grep ROOM_CAPACITY_CHECK` chỉ thấy trong `platform/`.
- Hậu quả: quản lý hạ sức chứa tối đa của căn xuống dưới số khách của đơn tương lai vẫn lưu được. Sau đó lễ tân nhận đơn với số khách vượt sức chứa mà không được cảnh báo. Nhánh 409 ở `rooms.service.ts:375` không bao giờ chạy.
- `s1-be-b.md` mục "chưa xong" hẹn nối ở Sprint 2. `s2-be-a.md` mục 7 lại chuyển sang Sprint 3, nhưng không có thẻ hay bug theo dõi.

### QC-S2-02 – Bên thua khi lưu đồng thời có thể thấy "Máy chủ đang gặp sự cố"
- Mức: **P2** (QA ghi)
- Vai sửa: FE (xử lý mã), UXD (chuỗi VI/EN)
- Vị trí: từ 0.3.5 (decision-log 16/10), server có thể trả `409 CONCURRENT_UPDATE` kèm `Retry-After`, hoặc `503 SERVICE_UNAVAILABLE`. QA đã ghi nhận bên thua đồng thời có khi nhận `CONCURRENT_UPDATE` (s2-retest mục 2). Nhưng `design/copy/strings-*.json` chưa có `error.CONCURRENT_UPDATE` / `error.SERVICE_UNAVAILABLE`, và `apps/admin-web/src/app/problem.ts:47-50` rơi về `error.server`. Kết quả: lễ tân thấy câu "Máy chủ đang gặp sự cố…".
- Hậu quả: sai thông điệp với TC-L2-021 (E). Lễ tân tưởng hệ thống hỏng thay vì hiểu là "vừa có người thao tác cùng căn". Không có thử lại theo `Retry-After`. Dữ liệu vẫn đúng.

### Lưu ý nhỏ (không thành điều kiện)
- OPS ghi nhận 2 ca vitest MutableClock thỉnh thoảng đỏ khi chạy cả bộ. QA theo dõi; nếu đỏ ở CI thì ghi lỗi.
- Bundle admin-web 503 KB, vượt ngưỡng cảnh báo. Đã có kế hoạch tách chuỗi ở R3.

## 5. Điều kiện kèm theo

| # | Điều kiện | Vai chịu trách nhiệm | Hạn | Cách xác nhận |
|---|---|---|---|---|
| ĐK-S2-1 | Kiểm lại BUG-R2-014 trên build `cfcf6d8` rồi đóng. Sửa bảng tổng mục 1 của bug-list cho khớp từng dòng (P2 Open 0). Ghi QC-S2-01 và QC-S2-02 thành BUG-R2-025/026 (P2) | QA | Trước khi giao việc Sprint 3 (17/10/2026) | bug-list cập nhật, ORC commit |
| ĐK-S2-2 | Cài `ROOM_CAPACITY_CHECK` theo bảng đơn (`CAPACITY_BELOW_BOOKINGS`, cảnh báo "n đơn tương lai" khi ngừng bán) + test tích hợp; QA thêm E2E | BE-A (provider ở reservations), BE-B (platform) | Hết tuần đầu Sprint 3 | Ca E2E hạ `maxOccupancy` dưới đơn tương lai → 409 trên CI xanh |
| ĐK-S2-3 | Thêm chuỗi `error.CONCURRENT_UPDATE` và `error.SERVICE_UNAVAILABLE` (VI/EN). FE hiện đúng câu, giữ dữ liệu form, cho thử lại sau `Retry-After` | UXD (chuỗi), FE (xử lý) | Hết tuần đầu Sprint 3 | Test đơn vị admin-web + QA kiểm lại |
| ĐK-S2-4 | Bật E2E UI trên CI: cài trình duyệt Playwright, `E2E_UI=1` cho 18 ca `desk-chromium` (gồm TC-L2-021 (E) hai lễ tân cùng lưu); thêm `@axe-core/playwright` cho H08–H12 (0 lỗi critical/serious); kiểm UI BUG-R2-010 | QA (ca + axe), OPS (job CI) | Trước cổng QC Sprint 3 | Log CI có `desk-chromium` đạt, 0 bỏ qua vì môi trường |
| ĐK-S2-5 | Nghiệm thu AC của 18 story Sprint 2 (Accepted / Trả lại) trong `outputs/PO/acceptance.md`, ghi rõ "trên stack tạm – chờ staging" cho tới khi có staging. Cập nhật cột Trạng thái backlog và ghi phần dời của US-019, 020, 022, 024, 085, 136 (mục 3) | PO | Trước cổng QC Sprint 3 | QC đối chiếu file nghiệm thu với backlog |
| ĐK-S2-6 | Thực hiện plan mục 8: kiểm tình trạng VPS + tên miền (ESC-002/010). Nếu INV chưa cấp, ghi việc nâng "Gấp" vào decision-log và đưa vào lần báo INV tới, kèm hệ quả: thiếu staging thì nhóm A của QC cuối Round 2 KHÔNG ĐẠT | ORC (+ OPS chuẩn bị deploy) | Trước khi bắt đầu Sprint 3 | Dòng decision-log + escalations-index |
| ĐK-S2-7 | SEC kiểm lại 3 thẻ Major Sprint 2 (BE-21, 22, 23) và DOM kiểm lại thẻ Blocker DOM-BE-01 trên `cfcf6d8`, ghi "Verified" vào file review | SEC, DOM | Trước cổng QC Sprint 3 | Dòng Verified trong `reviews/s2-SEC.md`, `s2-DOM.md` |

Nếu tới cổng QC Sprint 3 mà ĐK-S2-2 hoặc ĐK-S2-3 chưa xong, QC chấm Sprint 3 KHÔNG ĐẠT ở mục chống trùng/sức chứa.

## 6. Hạng mục trượt và vai chịu trách nhiệm
- Staging: ORC/OPS. Phụ thuộc INV cấp VPS + tên miền.
- UI chưa có bằng chứng trình duyệt, a11y: QA, OPS, FE.
- Nghiệm thu PO, trạng thái backlog: PO.
- QC-S2-01: BE-A/BE-B. QC-S2-02: FE/UXD.

## 7. Rủi ro chủ đầu tư cần biết (ORC đưa vào round-summary, không cần ESC riêng)
- Chưa có máy chủ chạy thử (staging). Đội vẫn kiểm được trên máy tạm, nhưng anh/chị chưa bấm thử được qua Internet. Nếu chưa có VPS + tên miền, cổng QC cuối Round 2 sẽ không đạt ở phần "luồng chính trên staging".
- Phần đặt phòng chống trùng đã được chứng minh chắc chắn ở máy chủ và cơ sở dữ liệu. Giao diện web chưa được thử bằng trình duyệt tự động, nên còn có thể có lỗi hiển thị.

## 8. QC không kiểm được
- Không chạy được stack hay trình duyệt trên máy QC (không có Docker, không có trình duyệt Playwright). Số liệu chạy lấy từ log CI run 38911271416 (đã tự đọc log job E2E) và `qa/s2-retest.md`.
- Không thử UI, VoiceOver, zoom, hiệu năng rack (p95 – việc của giai đoạn ổn định).
- Phần tự kiểm mẫu dựa trên đọc code: migration 0014, folio/payments/deposits (audit tiền), `problem.ts`, `test-support.module.ts`, `platform.module.ts`.
