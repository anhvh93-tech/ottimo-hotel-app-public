# Kế hoạch Sprint 4 – Round 2 (buồng phòng & bảo trì · app khách · Tổng quan · đóng nợ tiền)

- Người lập: PO | Ngày: 17/10/2026 | Bước: **Lập kế hoạch → đóng băng (D1)** | Trạng thái: **ĐÓNG BĂNG D1 – 17/10/2026** (ORC chốt sau critic kiểm lại – decision-log dòng ORC "chốt đóng băng D1 Sprint 4", quyết định 1–4). Đổi kế hoạch sau đóng băng: PO đề xuất, ORC duyệt, ghi decision-log trong ngày. Đổi hợp đồng sau đóng băng: qua ARC, báo trong ngày (8.1). **Thay đổi sau đóng băng đã duyệt: mục 16** (17/10 – US-155 vào LP-v1, cổng LP-v1 hai mốc, điều kiện bật form, xếp lịch DOM-S4-17, DOM-S4-11 phần (2), Q-W09); nội dung cũ giữ nguyên, các mục bị ảnh hưởng có ghi chú trỏ về mục 16.
- Sửa khi đóng băng (critic kiểm lại `reviews/s4-kickoff-critic.md` phần cuối, ORC quyết định 1–4):
  - **S4-23 phần thứ tự = CỔNG, BE-B** (DOM chốt BR-434 v0.3.6; cài trong hàm đồng bộ của S4-02) – mục 0, 3, 4, 6, 7, 8.3, 10, 11, 12, 14 và `s4-carryover.md`;
  - **BR-012 phía folio** (`labelParams.room`, `folio.settled_room_names`, `Bill.roomName`) chuyển **BE-A từ D1** để BE-B còn dự phòng – mục 6 (S4-52), 8.1, 8.3, 12.1;
  - **migration chung `0055`** (mọi cột mới 0.3.7) do BE-B viết ở D1 – mục 4, 8.1, 8.3, 12.1, 12.2;
  - **B-4 `deferredPeople` = contract-ahead R3** (ORC chốt; ARC sửa mô tả) – mục 7 P-S4-13, 8.2b;
  - dòng DOM ở 8.3 ghi **đã xong** (BR v0.3.6 trả lời #13–#17); bỏ `[GIẢ ĐỊNH – PO]` ở mục 13 (DOM đã đưa vào BR-429 (h)); ước lượng 12.1 cập nhật.
- Sửa ở bản D1 (so với dự thảo):
  - áp **một bảng phân việc duy nhất** của ORC (decision-log, dòng ORC "phân việc Sprint 4"), thêm luồng **BE-D**;
  - thêm mốc kiểm **D3 / D5 / D7** và quy tắc **lùi cổng ở D8** (mục 4.1, 11.2);
  - phân loại từng mục **nhóm D** của hợp đồng 0.3.7 (mục 8.2b);
  - xử lý thiếu sót của critic `reviews/s4-kickoff-critic.md`: #3, #4, #5, #6, #10, #11, #20, #21, #22, #23 (PO); #1, #2 (theo ORC); #7–#9, #12 (ARC, ghi ở 8.2); #13–#17 (DOM, ghi ở 8.3); #18, #19 (UXD, ghi ở 8.3).
- Đầu vào:
  - `rounds/round-02/plan.md` (mục 4 dòng Sprint 4, mục 7);
  - `s4-carryover.md` (S4-01…S4-52);
  - `qc/s3-qc-gate.md` V3 (ĐK-S3-x);
  - `sprint-3-summary.md`;
  - `qa/bug-list.md` (103 lỗi, P0 Open 056…061);
  - `03-backlog/backlog.md`;
  - `01-decisions/decision-log.md` (tới dòng UXD landing mock v1.1);
  - ESC-019/020/021 (INV quyết A ngày 17/10);
  - `pending-for-INV.md`;
  - `outputs/PO/landing-scope.md`, `outputs/ARC/openapi-0.3.7-draft.md`, `specs/EP07-08-housekeeping-maintenance.md`, hi-fi H03, H19–H24;
  - `business-rules.md` **v0.3.5** (DOM 17/10): BR-429 theo ESC-019; BR-434, BR-433, BR-412, BR-315 (g) cho S4-02/18/22/34; BR-012 tên phòng hiển thị;
  - `outputs/ARC/openapi-0.3.7.md` + `openapi.yaml` 0.3.7-draft; `design-system.md` v0.4 (mục 11, B0–B6), `tokens.json`;
  - `reviews/s4-kickoff-critic.md` (thiếu sót 1–23); decision-log dòng ORC "phân việc Sprint 4 (một bảng duy nhất …)".
- **Thương hiệu:** mọi đầu ra của Sprint 4 (Desk, PWA, guest-web, landing, chuỗi VI/EN, mẫu tin, tài liệu trình INV) theo OTTIMO Brand Guidelines v1.0 (`00-brief/context/brand/brand-guidelines.md`; CLAUDE.md mục "Thương hiệu OTTIMO"). Màu chỉ trong bảng 80/15/5, Lora / Be Vietnam Pro / JetBrains Mono, khách thấy **tên phòng**, nội bộ giữ số căn. Lệch thì guideline thắng; UXD ghi ngoại lệ chức năng.
- **Quy tắc môi trường:** không đụng stack demo (cổng 8181–8183, 3100) – INV có thể đang bấm thử. QA, BE, SEC dùng stack riêng. Tài liệu tiếng Việt; code, tên biến, commit tiếng Anh. Giả định ghi `[GIẢ ĐỊNH]`.

---

## 0. Tóm tắt

1. **Sprint 4 có hai việc ngang nhau:**
   - đóng hết nợ tiền và bảo mật của Sprint 3;
   - giao phần sản phẩm còn lại của R2: PWA buồng phòng và bảo trì, yêu cầu khách, Hôm nay / Tổng quan / "Cần chú ý" + SSE.
2. **Mọi lỗi tiền phải đóng trước cổng QC Sprint 4, không còn ngoại lệ:** BUG-R2-055…061, cùng S4-04, S4-06, S4-08, S4-13, **S4-23 phần thứ tự**, S4-35, S4-38 và nhóm D #6 (`expectedVersion`). Còn sót một lỗi thì cổng KHÔNG ĐẠT.
3. **ESC-019 = A** (INV 17/10) thành **S4-21 – Must**: khách tự xin đổi sang căn khác trước ngày đến thì tính theo giá căn mới. DOM đã ghi BR-429 v0.3.5; AC viết vào US-024 AC5–AC7.
4. **Thứ tự tuần 1:** S4-28 → S4-07, S4-05 → S4-02 + S4-18 (sửa tổng quát) → S4-21 + S4-04 → S4-25. S4-25 chỉ gộp sau khi QA đóng 056, 059, 061 (S4-34).
5. **ARC ra OpenAPI 0.3.7 ở D1** và bổ sung trước khi đóng băng các trường mà việc CỔNG cần: tên phòng BR-012, trạng thái FOC v0.3.5, dòng dịch vụ S4-08 (mục 8.2). Mục nhóm D đã phân loại: CỔNG hoặc contract-ahead R3 (mục 8.2b). Riêng **#6 `expectedVersion`** khi duyệt hoàn tiền là CỔNG, BE-B và FE-A làm **trong cùng một PR**.
6. **Luồng song song:**
   - landing LP-v1 (ESC-020 A, cổng riêng);
   - chat Zalo OA bắt đầu ngay khi OA được xác thực (không lập trình; ESC-021 A);
   - staging (ĐK-S3-8) khi INV gửi VPS và tên miền, dự kiến 19/10.
7. **Phân việc (ORC 17/10):** 4 luồng BE – **BE-A** tiền phía đơn, **BE-B** FOC/thu/hoàn, **BE-C** buồng phòng/bảo trì + giấy tờ, **BE-D** (mới) đọc EP01 + SSE + EP14; 2 luồng FE Desk (**FE-A** tiền, **FE-B** vận hành + S4-26/29/30 + brand), **FE-LP**, **MOB** (mục 8.3).
8. **Mốc kiểm:** **D3** S4-07, S4-05, S4-02, S4-18 xong mã; **D5** M1 (7 lỗi tiền) xong mã; **D7** có báo cáo S4-38. Trễ mốc → ORC tự động dừng FE-LP và chuyển việc theo mục 4.2. **Tới D8 mà G1 chưa xanh thì cổng S4 lùi sang tuần Ổn định, không ép duyệt** (mục 11.2).
9. **Năng lực:** nhu cầu vẫn cao hơn năng lực khoảng 10–20 % nếu tính vòng sửa. Thứ tự cắt ở mục 12.3, có thêm bước cắt cho QA. Tiền, bảo mật và luồng A1/A4 không bao giờ bị cắt. Mục chạm tiền (S4-37 `otaPenaltyVnd`, S4-47 thu trước B18) chỉ được cắt sau khi S4-38 xác nhận không sai tiền. S4-23 phần thứ tự nay là **CỔNG** (BR-434, DOM 17/10).

## 1. Mục tiêu Sprint 4

### 1.1 Mục tiêu sản phẩm (plan R2 mục 4, dòng Sprint 4)
- **EP07/EP08:** PWA "OTTIMO Staff" cho buồng phòng và kỹ thuật. Gồm việc hôm nay, trạng thái 10 căn, dọn, kiểm phòng có checklist, báo sự cố có ảnh, phiếu sửa và khóa phòng. Desk có form khối OOO và hàng phiếu sửa.
- **EP14 phần còn lại:** thông tin lưu trú (chỉ đường bằng ghim INV gửi). Khách gửi yêu cầu, yêu cầu tự vào đúng hàng việc (buồng phòng, phiếu sửa, lễ tân) và có nhắc theo hạn.
- **EP01:** màn Hôm nay (máy quầy) và Tổng quan chủ đầu tư. KPI đêm nay, khách đến/đi, "Cần chú ý" đủ nguồn, cập nhật qua SSE.
- **US-066:** danh mục minibar.
- **Should R2** (US-094, US-058, US-137, US-013, US-033, `swapRoom` trên Desk): chỉ làm khi còn chỗ (mục 12.3).

### 1.2 Mục tiêu bắt buộc trước cổng QC Sprint 4
Chi tiết ở mục 3:
- lỗi tiền BUG-R2-055…061 (S4-01/02/05/07/18/22/34);
- BUG-R2-085 (S4-39, phương án chính);
- ĐK-S3-5, 6, 7, 11;
- BUG-R2-038 (`checkIn.payment`, 0.3.7);
- S4-21 (ESC-019) cùng S4-04 (xem trước và lệnh ghi dùng chung một hàm tính);
- nhóm D #6: `expectedVersion` khi duyệt/từ chối hoàn tiền (BE-B + FE-A cùng PR).

### 1.3 Mức "đủ dùng" khi kết thúc Sprint 4
- Mọi story Must R2 đạt **ít nhất "Đang nghiệm thu"** (plan mục 4). Không phần Must R2 nào còn "chưa làm".
- Có **một E2E liền mạch A1**: báo giá → VietQR cọc → … → trả phòng có FOC → buồng phòng dọn và kiểm trên PWA → `VI`.
- Có **E2E A4**: sự cố trên PWA → phiếu sửa + OOO → chặn bán → đóng phiếu → `VD` → dọn → bán lại.
- Các bước ghi trên giao diện đều **bấm thật** (QC-S3-09).

### 1.4 Ngoài Sprint 4
- Tự gửi tin Zalo/email (US-126, US-161, US-162 – R3; ESC-021 A).
- Mọi story đã dời R3 theo R-C.
- Đổi toolchain FE (React 19, Vite 8 – S4-16 phần còn lại).
- Hộp yêu cầu đặt phòng trên website (US-155 – R3). *(Thay đổi sau đóng băng 17/10 – mục 16.1: US-155 nay là Must "R2 – LP-v1"; BE-D phần nhận yêu cầu trong Sprint 4, phần Desk sang tuần Ổn định; vẫn **không** tính vào cổng QC Sprint 4.)*

## 2. Đầu vào số liệu (17/10 tối)

| Mục | Số | Ghi chú |
|---|---|---|
| Story Must R2 | 71 | 32 **Đạt (stack tạm)** · 24 **Đang nghiệm thu** · 15 **Sẵn sàng (Sprint 4)**. US-083 hạ về Đang nghiệm thu (P-S4-3) |
| 15 story Must R2 chưa làm | US-010, 011, 012, 052, 053, 054, 055, 057, 061, 062, 066, 108, 109, 110, 112 | Có AC từ R1, đặc tả BA (EP01, EP07-08, EP14), hi-fi H03, H19–H24 |
| Lỗi Open | P0 6 · P1 2 · P2 11 · P3 20 | P0 = 056…061 (tiền). P1 = 055 (tiền), 085 (C3) |
| Điều kiện QC S3 còn mở | ĐK-S3-5, 6, 7, 8, 11, 13 | 12 xong (083 Closed). **ĐK-S3-1 ĐÓNG**: smoke `fe4b166` đã ghi ở `outputs/OPS/demo-1.md` mục 6c (critic #5) |
| Mã nguồn | BE chưa có module housekeeping/maintenance. Bảng `hk_task`, `room_status` và các operation `listHkTasks`, `createHkTask`, `listWorkOrders`, `createWorkOrder`, `updateWorkOrder`, `createGuestRequest`, `listGuestRequests` đã có trong OpenAPI. `events` đã có `listAttentionItems`, `streamEvents`. `apps/mobile` mới là khung trống | PWA làm từ đầu; ước lượng ở mục 12 |
| Hạ tầng | Chưa có VPS. CI xanh trên `fe4b166` | INV hẹn 19/10 |

## 3. Việc bắt buộc trước cổng QC Sprint 4

| # | Việc | Gồm | Vai | Xong khi |
|---|---|---|---|---|
| M1 | **Lỗi tiền** (ĐK-S3-6, ngoại lệ ORC hết hạn ở cổng S4) | S4-01 + S4-03 (055), S4-02 (056, kèm 4A→2A→4A), S4-05 (057), S4-07 (058), S4-18 (059, kèm audit `folio.foc_cancelled` trong tập đóng `AuditEvent.action`, `monthlyApprovedBy`, trạng thái FOC trên yêu cầu duyệt – 0.3.7 mục 8.2 #14), S4-22 (060, DOM đã chốt BR-315 (g) v0.3.5), S4-34 (061); **S4-23 phần thứ tự** (BR-434 v0.3.6: nhiều khoản giảm trên cùng khóa áp theo thứ tự lúc duyệt, tổng = min(Σ số đã duyệt còn sống, dòng); cài trong hàm đồng bộ của S4-02; oracle BR-434-11/12); thêm S4-06, S4-08 (trường `serviceLines`/`retainLines` – 8.2 #15), S4-13, S4-35; nhóm D #6 `expectedVersion` duyệt/từ chối hoàn (BE-B + FE-A cùng PR) | BE-A, BE-B, FE-A (#6), DOM, QA | Mỗi lỗi có test đọc `br-examples.json`, CI xanh; QA đóng 055…061; ORC + QA chạy lại kiểm chứng đối kháng theo phạm vi S4-38 (đã mở rộng: ca `otaPenaltyVnd` của S4-37, S4-47 thu trước B18, xem trước = lệnh ghi), có báo cáo `reviews/s4-money-verification.md` với 0 ca lệch tiền **trước hết D7** |
| M2 | **S4-21 – ESC-019 A** (+ **S4-04**, critic #10) | Quy tắc đã có: BR-429 v0.3.5 (a)–(f), BR-106, BR-424, `room_move_pricing`. ARC đã thêm `previewMoveReservation` vào 0.3.7. **Xem trước và lệnh ghi gọi chung một hàm tính** – B7: `previewMoveReservation` ↔ `moveReservation`; B14: `changeRoom` `dryRun` ↔ `changeRoom`, kể cả phần FOC đi theo (BR-434 min theo số đã duyệt, FOC chờ duyệt) và giảm giá khách quay lại BR-111 – nếu không, `expectedDeltaVnd` lệch sẽ trả 409 `SURCHARGE_CHANGED` lặp lại và lễ tân không lưu được. S4-04 (B14 xem trước lệch khi FOC > giá mới) sửa cùng hàm này | ARC, BE-A (BE-B cấp hàm FOC dùng chung), FE-A, QA (DOM kiểm ví dụ) | US-024 AC5–AC7 đạt bằng ca bấm thật trên Desk; khớp ví dụ BR-429 v0.3.5 trong `br-examples.json`; ca **BR-434-06 và BR-434-09 chạy qua xem trước rồi ghi**, số xem trước = số ghi từng đồng; S4-04 có ca FOC > giá mới |
| M3 | **BUG-R2-085 / S4-39** – phương án chính (ĐK-S3-11, SEC-G1 b) | 0.3.7 (`GuestDocumentLink`, `DOCUMENT_UNCLAIMED_EXISTS` kèm id, `guestUploadPersonIndex`, `unclaimedUntil`, `personIndex`); BE-57, BE-58 (2); giấy tờ lễ tân tự nhập chưa gắn người; hộp chọn ô trên Desk; chuỗi `attn.dq_party_docs_unlinked`; BUG-090, 091 | ARC, **BE-C** (cả phần `removePartyMember` nhận `guestUploadPersonIndex` – chuyển từ BE-A theo bảng ORC; BE-A chỉ review vì chạm module đơn), FE-A, UXD, SEC | SEC ghi **Verified** trong `s3-SEC.md` mục 9; QA đóng 085 |
| M4 | **BUG-R2-038 / S4-10** – `checkIn.payment` + `CheckInPreview.amountDueAtCheckinVnd` | 0.3.7; H13 hiện số cần thu khi nhận phòng. **DOM đã chốt BR-402 v0.3.6** (17/10, critic #13): "đã thu đủ" xét sau phụ thu/đêm B9a và khoản thu; phần đang xin FOC chờ duyệt trên khoản phát sinh không phải thu để nhận phòng, tiền phòng vẫn thu đủ – oracle BR-402-01 | ARC, BE-A, FE-A, DOM, QA | TC-L3-011 bỏ `test.fail` và xanh; US-025 AC3 đạt; ca FOC chờ duyệt khớp BR-402-01 |
| M5 | **ĐK-S3-5** – người review ghi Verified | SEC: 8 Major (SEC-G3). DOM: 2 Blocker + 8 Major (quy tắc FOC cho B12 và FOC chờ duyệt đã chốt ở BR v0.3.5). ARC: 3 Blocker + 18 Major, xem phần BE 9b/9c. UXD: 13 Major, S4-41, S4-48 | SEC, DOM, ARC, UXD | Dòng Verified trong 4 tệp `reviews/s3-*.md`; dòng DOM trong decision-log |
| M6 | **ĐK-S3-7** – E2E A1 liền mạch | Số tiền đọc từ oracle; bước ghi bấm thật; không `test.fail` giữa chuỗi; sửa BUG-R2-064 (S4-24 phần 3 ca); nối PWA dọn và kiểm → `VI` | QA (FE, BE, MOB hỗ trợ; OPS sửa `ci.yml`) | Ca chạy xanh trên CI, nằm trong `WRITES` |
| M7 | **Story Sprint 4 đã giao** | 15 story Must R2 mục 5.1 và phần dời Sprint 4 của 24 story "Đang nghiệm thu" (mục 5.2) | Mọi vai dev | Mỗi AC có ca test; PO ghi kết quả ở `outputs/PO/s4-acceptance.md` |
| M8 | **S4-49 – thương hiệu** (INV 17/10) | Token DS v0.4 cho Desk, PWA, guest-web; **B0 + B1 vào cùng một bản build** (thiếu font JetBrains Mono thì `--mono` hiện bằng Courier New); **font tự host** (`@fontsource`, không CDN – SEC C-1) trên guest-web và landing; đạt AA; logo vector khi INV gửi; khách thấy tên phòng, nhân viên thấy "401 · The Pine" (BR-012, ánh xạ tạm BL 4.1 tới khi INV gửi bảng ghép; trường hợp đồng ở 8.2 #13); guest-web mặc định EN (P-S4-10) | UXD, FE-B, MOB | axe không lỗi nghiêm trọng trên mọi màn; không còn màu ngoài bảng, trừ ngoại lệ UXD đã ghi; 0 yêu cầu font ra tên miền ngoài |

**Ba tình huống làm cổng KHÔNG ĐẠT** (giữ từ QC S3, mục 6):
1. 057 hoặc 058 chưa sửa.
2. S4-25 đã phát hành mà S4-02/S4-18 chưa sửa tổng quát.
3. S4-39 (SEC-G1 b) chưa được SEC Verified.

PO thêm tình huống thứ tư: còn **bất kỳ** lỗi sai tiền P0/P1 nào Open.

## 4. Thứ tự tuần 1 (ĐK-S3-4, decision-log ORC 17/10 + ESC-019)

D1…D10 là 10 ngày làm việc của Sprint 4. Ngày lịch thật do ORC chốt.

**D1 trước hết (ORC 17/10, quyết định 4):** BE-B viết **một migration chung `0055`** cho mọi cột mới của 0.3.7 (room, reservation, folio, approval_request…) trước khi luồng BE khác viết migration riêng. Sau đó mỗi luồng xin số migration tiếp theo qua ORC (tránh trùng số và journal). Chữ "migration" ở việc của luồng khác (vd. S4-11 của BE-C) từ nay là phần dữ liệu/logic trên cột đã có ở `0055`, hoặc migration số mới xin qua ORC.

| Bước | Việc | Vai | Bắt đầu | Phụ thuộc / rào chắn | Xong khi |
|---|---|---|---|---|---|
| 1 | **S4-28** – vẽ VietQR cọc ở H12 (sau giữ chỗ) và H11 (Xác nhận cọc), `createVietQr purpose=deposit`; sửa luôn chuỗi `sale.qr_after` (BUG-R2-062) | FE-A (BE-B hỗ trợ phía API) | D1 | Không cần 0.3.7 | Ca E2E-UI: giữ chỗ → QR đúng số cọc BR-305, nội dung = mã đơn; US-084 AC4 |
| 2a | **S4-07** (BUG-058) – B7/B7a đổi/gán căn khác định mức: phụ thu người tính lại từng đêm theo nguyên nhân | BE-A | D1 | BR-429 bản 17/10 | Ví dụ BR-429 (202↔302, OTA 101→301) – **mốc D3** |
| 2b | **S4-05** (BUG-057) – chênh lệch đổi phòng đơn OTA so với căn gốc, đảo rồi ghi lại | BE-A | Sau 2a | BR-424 bản 17/10 | 203→401→302→202 = 250.000 / 125.000 / 0 – **mốc D3** |
| 3 | **S4-02 + S4-18** – sửa tổng quát FOC cho **mọi loại dòng** (đêm phòng, phụ thu người, trả muộn). FOC carry = min(**số đã duyệt**, giá mới); FOC chờ duyệt đi theo dòng mới; audit `folio.foc_cancelled`; không tính vào `monthlyApprovedBy`; trạng thái FOC trên yêu cầu duyệt (8.2 #14). Đóng luôn **S4-34** (BUG-061, `replaceLateCharge`). **S4-23 phần thứ tự** cài trong cùng hàm đồng bộ (ORC 17/10, quyết định 2): nhiều khoản giảm (FOC, giảm giá đặc biệt) trên cùng một khóa áp theo thứ tự lúc duyệt; "giá trị dòng" của mỗi khoản = dòng − phần các khoản trước đã áp; tổng = min(Σ số đã duyệt còn sống, dòng), không âm; khoản áp 0 → ngủ; mỗi lần đồng bộ tính lại cả khóa; hàng chờ "khi duyệt sẽ áp X" trừ các khoản đã duyệt | BE-B | D1 (sau migration `0055`) | Quy tắc đã chốt ở BR v0.3.5/v0.3.6: BR-434 (gồm thứ tự S4-23), BR-433, BR-412. Trường hợp đồng FOC v0.3.5 đã áp ở 0.3.7 D1 (8.2 #14) | 4A→2A→4A; X2b; 3 ca BUG-061; BR-434-11/12; QA đóng 056, 059, 061 – **mốc D3** (S4-02, S4-18 xong mã) |
| 4 | **S4-21 + S4-04** – ESC-019 A (mục 7, P-S4-1); xem trước và lệnh ghi dùng chung một hàm tính (M2) | ARC (0.3.7, D1) → BE-A (sau 2b) → FE-A; DOM đã có BR-429 v0.3.5 và (g)/(h) v0.3.6; **DOM đã chốt S4-23** (BR-434 thứ tự lúc duyệt, 17/10 – critic #15): BE-A gọi hàm đồng bộ FOC/giảm giá của BE-B (bước 3), không tính riêng | D2 | Phần FOC trên đêm đổi giá chạy sau bước 3 (BR-434 min theo số đã duyệt, thứ tự S4-23) | US-024 AC5–AC7; BR-434-06/09/11 qua xem trước rồi ghi; BR-429-09/10 |
| 5 | **S4-25** – Desk xin FOC ngoài bước nhận phòng: trả muộn (H15, H16 bước 2), dòng phát sinh, lễ tân tự áp FOC minibar; thêm lựa chọn "ghi phụ thu kèm đề nghị FOC" khi thêm người (BUG-R2-093) | FE-A + BE-B | Code từ D2 trên nhánh riêng | **Chỉ gộp vào nhánh chính sau khi QA đóng 056, 059, 061.** Demo và CI dựng từ nhánh chính | US-007 AC1, AC6; US-036; US-022 AC4 |
| 6 | **Nhóm D #6** – `expectedVersion` khi duyệt/từ chối yêu cầu `refund` | BE-B + FE-A, **một PR** | Sau bước 3 | Không gộp phần BE riêng: Desk chưa gửi trường này thì luồng duyệt hoàn vỡ | Ca duyệt hoàn có/thiếu/lệch phiên bản; FOC không cần trường |

Song song từ D1, không đụng vùng tiền:
- BE-C: S4-39 phần BE, S4-17 (test cục bộ), khung module buồng phòng/bảo trì (nhóm H);
- **BE-D:** khung EP01 đọc (`getTonightKpi`, `getArrivalsDepartures`, "Cần chú ý", SSE) + EP14 (US-108, 109, 110);
- MOB: khung PWA; B0 + B1 cho PWA và guest-web;
- FE-B: B0 + B1 cho Desk (cùng bản build) → **S4-26, S4-29, S4-30** (nhận từ FE-A ngày D1) → Hôm nay / Tổng quan trên MSW;
- UXD: token DS v0.4, duyệt chuỗi S4-41, S4-48;
- QA: test plan và TC;
- SEC, DOM, ARC: Verified ĐK-S3-5 (DOM đã trả lời critic #13–#17 ở BR v0.3.6, 17/10).

Tiếp theo trong tuần 1 (BE-B, sau bước 3):
- S4-01 + S4-03;
- S4-22 theo BR-315 (g) v0.3.5;
- S4-06, S4-08, S4-13 (test đua).

Kiểm chứng đối kháng tiền (S4-38) bắt đầu ngay khi M1 xong mã (**chậm nhất D5**), báo cáo **trước hết D7**. Lượt sửa của vòng kiểm chứng làm D6–D8, còn D9 cho một lượt kiểm lại.

### 4.1 Mốc kiểm có ngày (ORC 17/10, critic #21)

| Mốc | Phải có | Ai báo | Trễ mốc thì |
|---|---|---|---|
| **D3** (cuối ngày) | S4-07, S4-05 (BE-A) và S4-02, S4-18 (BE-B) **xong mã**: PR mở, test oracle xanh trên nhánh | BE-A, BE-B → ORC | ORC tự động chạy thứ tự cắt bước 1–4 (bước 4 = **dừng FE-LP**) và chuyển việc theo 4.2, không cần hỏi PO (P-S4-9) |
| **D5** (cuối ngày) | **M1 xong mã**: 7 lỗi tiền 055…061 + S4-06, S4-08, S4-13, S4-23 phần thứ tự, S4-35, #6; QA bắt đầu kiểm lại và S4-38 | BE-A, BE-B, QA → ORC | Như D3 (nếu chưa chạy) và chuyển việc đợt 2 (4.2); ORC được chạy tiếp bước 5 (S4-43) theo P-S4-9 |
| **D7** (cuối ngày) | Báo cáo `reviews/s4-money-verification.md` (S4-38), kèm kết luận cho S4-37 `otaPenaltyVnd`, S4-47 thu trước B18 | ORC + QA | Như D5; ORC được chạy bước 6; báo QC khả năng lùi cổng |
| **D8** | G1 xanh (mục 11.1) | QA → ORC, QC | **Cổng QC S4 lùi sang tuần Ổn định**, không ép duyệt (11.2) |

### 4.2 Chuyển việc khi trễ mốc

BE-D có chỗ trống khoảng 2–3 ngày (12.1), là luồng nhận việc đầu tiên. FE-B nhận việc FE-A. Việc đã bắt đầu thì người đang làm giữ, chỉ chuyển việc chưa bắt đầu.

| Khi | Từ | Sang | Việc chuyển |
|---|---|---|---|
| D3 trễ phía BE-B | BE-B | BE-D | US-066 + US-003 AC2 (danh mục minibar – đứng cuối hàng BE-B); S4-20 |
| D3 trễ phía BE-A | BE-A | BE-D | S4-09, S4-44, BUG-078 (`balanceDueVnd` danh sách đơn) |
| D5 trễ | BE-B | BE-A (nếu BE-A đã qua D3) | S4-35 phần B; S4-42 |
| D5 trễ | BE-C | BE-D | Thông báo HK/MT (`StaffNotification` +6), J11; S4-12, S4-46 |
| D5 trễ | FE-A | FE-B | S4-27 (nếu chưa bắt đầu), S4-50b |
| D7 trễ | – | – | Không chuyển thêm; ORC chuẩn bị quyết định D8 |

## 5. Phạm vi story Sprint 4

### 5.1 Story Must R2 chưa làm (Sẵn sàng → giao trong Sprint 4)

| Story | Phần làm | BE | FE / MOB | Thiết kế, đặc tả | Ghi chú |
|---|---|---|---|---|---|
| US-052 Trạng thái buồng | AC1–AC3 | BE-C | MOB (PWA H19) | EP07-08 spec, H19 | PWA không có dữ liệu C3 (SR-DEV-09) |
| US-053 Đổi trạng thái hợp lệ | AC1–AC4 | BE-C | MOB (H20, hoàn tác 10 giây) | SM-03 | |
| US-054 Việc hôm nay tự sinh | AC1–AC4 | BE-C (sinh việc từ trả phòng, gia hạn B13, trả muộn B15, yêu cầu khách) | MOB (H19); FE-B (Desk thấy cùng trạng thái) | BR-807 | Đóng phần dời của US-028 AC4, US-029 AC4, US-038 AC1 (S4-31) |
| US-055 Checklist kiểm phòng | AC1–AC2 | BE-C | MOB (H20) | BR-808 | |
| US-057 Báo sự cố | AC1–AC2 | BE-C | MOB (H21) | BR-809 | Mức Cao → "Cần chú ý" |
| US-061 Phiếu sửa + khóa phòng | AC1–AC4 | BE-C (cả khối OOO, `expectedDoneDate` – bảng ORC) | FE-B (form OOO hiện 2 ngày, H22 bản Desk); MOB (H22 bản kỹ thuật) | BR-804 | Đóng phần dời US-019 (form OOO) |
| US-062 Cập nhật phiếu | AC1–AC3 | BE-C | MOB, FE-B | SM-04 | Hộp xác nhận "done" (US-135) |
| US-066 Danh mục minibar | AC1–AC3 | BE-B (inventory) | FE-B | BR-701 | TC-L4-070/071 bỏ skip |
| US-108 Thông tin lưu trú | AC1; AC2 phần Wi-Fi | BE-D | MOB (guest-web H23) | | Chỉ đường bằng ghim INV gửi 17/10 (P-S4-7, S4-51); khách thấy tên phòng, không thấy số căn (BR-012, 8.2 #13) |
| US-109 Khách gửi yêu cầu | AC1–AC2 (phí dọn thêm theo ESC-016 A) | BE-D (BE-B ghi `feeVnd` vào folio khi xong) | MOB (H23 tab Yêu cầu) | SM-15, BR-506 | |
| US-110 Định tuyến yêu cầu | AC1–AC3 | BE-D (+ job nhắc BR-811; tạo việc HK/phiếu sửa qua cổng của BE-C) | FE-B (hàng yêu cầu trên Desk) | BR-811, BR-809 | |
| US-112 App khách tiếng Anh | AC1–AC3 trên mọi màn guest-web mới | – | MOB, UXD | content-guide | |
| US-010 KPI đêm nay | AC1–AC3 | BE-D | FE-B (H03, H24) | metrics-definitions K-01…K-03 | DATA đối chiếu DS-0 |
| US-011 Khách đến/đi hôm nay | AC1–AC3 | BE-D | FE-B (H03) | BR-404 | Cùng thẻ "khách trả phòng hôm nay" (S4-31) |
| US-012 Cần chú ý | AC1, AC3–AC8 (AC2 R3) | BE-D (gom nguồn; SSE) | FE-B (H03, H24) | BR-907 | Gồm `registration_party_docs_unlinked` (S4-39). Việc nhắn khách theo BR-979 (`eta.followup_time`) Sprint 4 lễ tân làm tay qua OA/OTA; tự sinh việc và gửi tin ở R3 (critic #16) |

### 5.2 Phần dời Sprint 4 của story "Đang nghiệm thu"

| Story | Phần còn | Mục S4 | Vai |
|---|---|---|---|
| US-003 | AC2 (minibar/kho không giá vốn cho HK), AC4 (Tổng quan FD không thấy doanh thu) | cùng US-066, US-010 | BE-B (AC2), BE-D (AC4), FE-B |
| US-006, US-032, US-038, US-119 | Điều chỉnh dòng, bút toán sau `settled`, đảo giao dịch thu, ghi công nợ | S4-27, S4-26, S4-35 | FE-A (S4-27), **FE-B (S4-26)**, BE-A, BE-B |
| US-007 | AC1, AC6 trên Desk | S4-25 | FE-A, BE-B |
| US-019 | Form OOO; AC2 phần Tổng quan + đêm khả dụng | US-061, US-010 | FE-B, BE-C (khối OOO), BE-D (Tổng quan) |
| US-020 | "Xem bill" cho đơn `checked_out` | S4-29 | **FE-B** |
| US-024 | AC4 nhánh `ROOM_NOT_READY` (ca test – có thể sang Ổn định theo bước cắt 6); **AC5–AC7 mới (ESC-019)**. Sprint 4 lễ tân **báo khách bằng tay** qua OA hoặc OTA; TP-15 tự động ở R3 (critic #16) | S4-33, S4-21 | QA, BE-A, FE-A |
| US-025 | AC3 "đã thu đủ" | S4-10 | BE-A, FE-A |
| US-028, US-029, US-030, US-031 | Việc dọn đổi loại, "dọn sau giờ trả", thẻ "khách trả phòng hôm nay", báo đỏ, xếp đầu | S4-31 | BE-D (thẻ, đọc), BE-C (việc dọn), FE-B, QA |
| US-043, US-048 | AC3 (khớp hồ sơ theo giấy tờ; 4 số cuối) | S4-11, S4-32 | **BE-C** (cả phần guests – bảng ORC), FE-A (nhãn "có thể là khách quen"), SEC |
| US-083 | AC2 tiếng Nga trên hộp báo giá Desk (BUG-R2-080) | S4-50a | FE-A |
| US-084 | AC4 VietQR cọc | S4-28 | FE-A |
| US-085 | AC2 nhắc trước hạn (J2) + "Cần chú ý" | cùng US-012 | BE-D, FE-B |
| US-086 | AC4 ảnh biên nhận; lễ tân thấy số tiền và ghi chú CTV đã báo (BUG-R2-081) | S4-30 | **FE-B** |
| US-135 | Hộp xác nhận phiếu sửa `done` | US-062 | FE-B, MOB |
| US-136 | AC1 nhắc gọi khách (J6/J7). AC2 việc "Báo no-show trên kênh" và AC4 thông báo MGR (P-S4-11: giữ Sprint 4 vì ARC đã thêm loại sự kiện ở 0.3.7 D1 – 8.2 #16; ARC rút thì dời R3) | cùng US-012 | BE-D, FE-B |
| US-139 | AC3 ca test `RESERVATION_UNASSIGNED` (có thể sang Ổn định theo bước cắt 6) | S4-33 | QA |
| US-016 | AC1–AC3 giao diện: ca UI + axe trên token mới | S4-49 | QA, FE-B |

### 5.3 Should R2 – chỉ làm khi còn chỗ
Thứ tự: US-058 (hàng đợi offline PWA) → US-137 (trả phòng sớm, giao diện) → US-094 → US-013 → US-033 → `swapRoom` trên Desk. Không kịp thì sang R3, không ảnh hưởng cổng (plan mục 2.1).

## 6. Phân loại S4-01…S4-52

Ký hiệu:
- **CỔNG** = phải xong trước cổng QC Sprint 4.
- **NÊN-ÔĐ** = nên xong trong Sprint 4; trễ thì làm trong giai đoạn Ổn định R2, **không** sang R3. Áp cho Must R2 phần không phải tiền hoặc bảo mật, và lỗi P2 hiển thị.
- **NÊN** = nên có trong Sprint 4; không kịp thì sang **R3**.
- **ĐÓNG** = đã xong.
- **VPS** = làm khi có máy chủ (ĐK-S3-8).
- **Chờ S4-38** = có thể chạm tiền; giữ như CỔNG và **không được cắt** tới khi vòng kiểm chứng S4-38 kết luận không sai tiền và ORC ghi lý do vào decision-log (critic #4, quy tắc ORC "mục sai tiền phải sửa trước cổng S4").
- Cột "Vai chính" theo bảng phân việc ORC 17/10 (mục 8.3).

| # | Hạng mục (rút gọn) | Phân loại | Lý do | Vai chính |
|---|---|---|---|---|
| S4-01 | BUG-055: FOC > giá đêm mới → 500 | **CỔNG** | Lỗi tiền P1, ngoại lệ ORC hết hạn ở cổng S4 | BE-B |
| S4-02 | BUG-056: FOC carry theo số đã duyệt (gồm 4A→2A→4A) | **CỔNG** | P0 tiền; là nền của S4-25 và S4-21 | BE-B |
| S4-03 | Base hoa hồng cũ sau B8 | **CỔNG** | Gộp S4-01; sai tiền hoa hồng tạm thời | BE-B |
| S4-04 | Preview B14 lệch số thực ghi khi FOC > giá mới | **CỔNG** (cùng S4-21 – critic #10) | Cùng loại lỗi với xem trước B7: xem trước lệch lệnh ghi thì `expectedDeltaVnd` trả 409 lặp lại, lễ tân không lưu được. Sửa bằng hàm tính dùng chung (M2) | BE-A |
| S4-05 | BUG-057: chênh lệch OTA so căn gốc | **CỔNG** | P0 tiền, với tới từ Desk; là tình huống KHÔNG ĐẠT số 1 | BE-A |
| S4-06 | Đơn hủy/no-show còn tiền dư → tự tạo yêu cầu hoàn + "Cần chú ý" | **CỔNG** | Major tiền, thuộc ĐK-S3-6. Loại mục "Cần chú ý" của S4-06: `closed_reservation_credit` (ARC 0.3.7 D1, critic #12) | BE-B (BE-D hiển thị) |
| S4-07 | BUG-058: phụ thu người khi đổi căn khác định mức | **CỔNG** | P0 tiền, với tới từ Desk; tình huống KHÔNG ĐẠT số 1 | BE-A |
| S4-08 | Hủy đơn tự đảo dòng dịch vụ chưa thực hiện | **CỔNG** | Major tiền, thuộc ĐK-S3-6. Cần trường hợp đồng `CancellationQuote.serviceLines[]`, `cancelReservation.retainLines[]` – ARC thêm D1 (8.2 #15, critic #9) | BE-B, FE-A (chọn dòng giữ kèm lý do) |
| S4-09 | B14 "chỉ chuyển tới hết đơn gốc" | NÊN | Minor; tới lúc có thì lễ tân chọn căn khác. ARC đã thêm `stayScope` vào 0.3.7; chưa cài thì là contract-ahead (8.2b). DOM đã chốt BR-424 (17/10, critic #13): `until_parent_departure` không sinh sẵn `priority_clean`; ghi khách chuyển về bằng `ReservationPatch.roomReturnRecorded`; oracle BR-424-05 | BE-A (BE-D khi chuyển việc), FE-A |
| S4-10 | BUG-038 `checkIn.payment` | **CỔNG** | Bắt buộc theo ORC; US-025 AC3 Must R2 | ARC → BE-A, FE-A |
| S4-11 | BUG-033 (a)(b): `id_doc_hmac`, hồ sơ "từ giấy tờ" | **CỔNG** | US-043 AC3 Must R2; điều kiện SEC; nằm trong 0.3.7 nhóm D mục A + A.3 | **BE-C** (cả phần guests, migration, J25 – bảng ORC), FE-A (nhãn), SEC |
| S4-12 | BUG-054 `imagesPurgedAt` | NÊN | P3, ảnh vẫn xóa đúng hạn. Ca TC-L3-074 vẫn sửa theo S4-24 | BE-C |
| S4-13 | Test đua duyệt FOC với B10/B11/resync | **CỔNG** | Tiền; ĐK-S3-6 yêu cầu kiểm chứng lại phần FOC | BE-B, QA |
| S4-14 | BR-434 dời chồng ngày | **ĐÓNG** | DOM chốt 17/10 | – |
| S4-15 | Upload qua Caddy thật | **VPS** | Cần staging; chậm nhất trước Ổn định | OPS, QA |
| S4-16 | Dependabot | Phần CI **ĐÓNG** (gộp 4, đóng 5 – 17/10); toolchain FE → **R3** | Không đổi toolchain giữa sprint | OPS, FE |
| S4-17 | Upload pipelining giữ ~1 GB thân | **CỔNG** – **đóng bằng test cục bộ** (critic #6): `body = null`/noop sau khi đọc xong, giới hạn pipelining, có test trên stack riêng. Phần kiểm qua Caddy thật thuộc **S4-15 (VPS)**, không chặn S4-17 | Major-defer từ kiểm chứng (C4: không còn Major mở); sửa nhỏ; không cần VPS | BE-C, SEC |
| S4-18 | BUG-059: FOC chờ duyệt khi dòng ghi lại + audit | **CỔNG** | P0 tiền; tình huống KHÔNG ĐẠT số 2 | BE-B |
| S4-19 | Ví dụ 302 917k | **ĐÓNG** | DOM 17/10; câu chính sách tách S4-21 | – |
| S4-20 | Test chập chờn `dev_clock` dùng chung | **CỔNG** | Cổng cần CI xanh, 0 lần chạy lại | BE (người sở hữu test), QA |
| S4-21 | **ESC-019 A – giá căn mới khi khách xin đổi căn trước ngày đến** | **CỔNG (Must – INV 17/10)** | Chính sách INV đã quyết; đóng kẽ hở doanh thu | DOM, ARC, BE-A, FE-A, QA |
| S4-22 | BUG-060: B12 khôi phục no-show mất FOC | **CỔNG** | P0 tiền; DOM đã chốt BR-315 (g) v0.3.5 | BE-B (DOM kiểm ví dụ) |
| S4-23 | Lọc `service_date` null; thứ tự giảm giá đặc biệt / FOC trên cùng dòng | Phần thứ tự: **CỔNG** (ORC 17/10, quyết định 2). DOM chốt BR-434 v0.3.6 (critic #15): áp theo **thứ tự lúc duyệt**, "giá trị dòng" của mỗi khoản = dòng − phần các khoản trước đã áp, tổng = min(Σ số đã duyệt còn sống, dòng), không âm; tính lại cả khóa mỗi lần đồng bộ (xem trước và ghi dùng chung hàm); oracle BR-434-11/12. Không dùng ràng buộc "một khoản mỗi khóa". Phần lọc `service_date` null: NÊN | Lấy min từng khoản với cả dòng có thể trừ vượt dòng (đêm âm) = sai tiền. P-S4-1 khuyên dùng giảm giá đặc biệt để tặng phần chênh nên hai khoản cùng một đêm sẽ gặp thường hơn | **BE-B** (cài trong hàm đồng bộ của S4-02; cả lọc null), QA (BR-434-11/12) |
| S4-24 | QA: BUG-064 (3 ca `test.fail` giữa ca), spec BR-434-02/03, SĐT trùng TC-L3-013 | **CỔNG** phần BUG-064 (ĐK-S3-7); phần còn lại NÊN | Lượt chạy lại che lỗi thật | QA |
| S4-25 | Xin FOC ngoài bước nhận phòng (+BUG-093) | **CỔNG** | Must R2, cần cho A1; chỉ gộp sau 056, 059, 061 | FE-A, BE-B, UXD |
| S4-26 | "Ghi công nợ" MGR/OWN | **CỔNG** | US-038 AC3 Must R2; API có sẵn, việc giao diện nhỏ | **FE-B** (từ D1 – critic #21) |
| S4-27 | Điều chỉnh dòng folio; đảo giao dịch thu | **CỔNG** | US-006 AC1, US-032 AC1, US-038 AC2, US-119 AC3; dòng giá đêm chờ S4-35 | FE-A |
| S4-28 | VietQR cọc H12/H11 (+BUG-062) | **CỔNG – làm đầu tiên** | US-084 AC4; cần cho A1 | FE-A (BE-B phía API) |
| S4-29 | "Xem bill" đơn `checked_out` | **CỔNG** | US-020 AC2 | **FE-B** (từ D1) |
| S4-30 | Ảnh biên nhận khi CTV báo chuyển cọc (+BUG-081, P-S4-4) | **CỔNG** | US-086 AC4 | **FE-B** (từ D1) |
| S4-31 | Thẻ "khách trả phòng hôm nay"; việc dọn sinh từ lưu trú | **CỔNG** | US-011, 028 AC4, 029 AC4, 030 AC2, 031, 038 AC1 | **BE-D** (thẻ), BE-C (việc dọn), FE-B, QA |
| S4-32 | `id_doc_last4` không được ghi | **CỔNG** | US-048 AC3; gộp S4-11 | BE-C, SEC |
| S4-33 | QA bổ sung ca (TC-L2-026, `ROOM_NOT_READY`, TC-L2-060…062, TC-L2-056, TC-SEC-015, TC-RB-008/009, H13 trước 06:00) | NÊN-ÔĐ – bước cắt 6 chuyển sang **Ổn định** (critic #22) | Không chặn cổng S4, nhưng là bằng chứng để PO nghiệm thu US-024, US-139, US-022; cắt thì các story này giữ "Đang nghiệm thu" tới Ổn định | QA |
| S4-34 | BUG-061: FOC trả muộn khi đổi giờ trả | **CỔNG** | P0 tiền; điều kiện để phát hành S4-25 | BE-B, FE-A |
| S4-35 | `setNightRate` – điều chỉnh dòng `room`/`extra_person` | **CỔNG** | Major (ARC-BE-S3-14 "Done tạm"); S4-27 và S4-21 cần. ARC đã ghi cách cài ở mô tả `adjustFolioLine` (0.3.7 D1, critic #12). DOM đã thêm BR-429 (g) v0.3.6 (critic #14): giá sửa tay / giá thỏa thuận gắn với căn cũ; khách tự xin đổi căn → lịch giá căn mới, muốn giữ ưu đãi thì lễ tân sửa giá đêm căn mới bằng S4-35 (oracle BR-429-09) – `adjustFolioLine` không tự đảo giá đã sửa | ARC → BE-A, BE-B |
| S4-36 | p95 gia hạn 62 đêm; N+1 `listRegistrations` | NÊN-ÔĐ | Minor; làm cùng test hiệu năng Ổn định (plan mục 6) | BE-A, BE-C |
| S4-37 | Ghi chú các vòng kiểm chứng (trần `otaPenaltyVnd`, 422 thiếu Content-Length, TC-L2-057 409…) | Ca **trần `otaPenaltyVnd` cộng cả phụ thu người** (nhãn MONEY vòng 5): **chờ S4-38** – vào phạm vi S4-38, chỉ cắt khi S4-38 xác nhận không sai tiền (critic #4). Phần còn lại: NÊN | Note. Riêng TC-L2-057 (409 ngay sau giữ chỗ) BE-A xem trong D1–D3: nếu là lỗi thật thì QA ghi sổ và xếp mức | BE-B (`otaPenaltyVnd`), BE-A, BE-C |
| S4-38 | Phạm vi kiểm chứng đối kháng tiền trước cổng | **CỔNG** – báo cáo **trước hết D7** | ĐK-S3-6. Phạm vi thêm (critic #4, #10): ca `otaPenaltyVnd` (S4-37), S4-47 thu trước B18 vượt số còn phải thu, xem trước = lệnh ghi (B7, B14), S4-23 phần thứ tự (BR-434-11/12) | ORC, QA, BE-A, BE-B |
| S4-39 | BUG-085 – phương án chính bỏ người khỏi đoàn | **CỔNG** | ĐK-S3-11; tình huống KHÔNG ĐẠT số 3 | **BE-C** (cả `removePartyMember`; BE-A review), ARC, FE-A, UXD, SEC |
| S4-40 | x-scope `listApprovalRequests` lệch tài liệu | NÊN | Server đã đúng; ARC ghi vào 0.3.7 nếu kịp | ARC, BA |
| S4-41 | UXD duyệt 13 chuỗi vòng 9 | **CỔNG** | ĐK-S3-5 | UXD |
| S4-42 | `refund_ready` gửi thêm FD/FDL trong ca | NÊN | Minor | BE-B |
| S4-43 | FD/FDL thấy khoản hoàn người khác tạo để nhập nơi nhận | NÊN (PO quyết **mở rộng** – P-S4-6) | Không có thì luồng hoàn do MGR tạo phải chờ MGR; có cách đi vòng. ARC 0.3.7 D1: x-scope `own_or_refund_queue` / `within_limit_or_own_or_refund_queue` nay gồm khoản hoàn chưa có nơi nhận (critic #12) | BE-B, ARC, BA |
| S4-44 | Tìm đơn theo tên khách (BUG-077) | NÊN | Should; tìm theo mã vẫn được | ARC, BE-A, FE-A |
| S4-45 | Năm sinh trẻ em; 2 dòng "Còn phải thu" (103); chọn ngân hàng theo tên (074, 099) | NÊN-ÔĐ phần năm sinh trẻ em (server bắt buộc mà Desk ghi "không bắt buộc" → lễ tân bị chặn) và 103; phần ngân hàng → NÊN | 074 đã Deferred (P2 có kế hoạch); INT cần danh sách ngân hàng VietQR | UXD, BA, FE-A, INT |
| S4-46 | Cảnh báo khóa tạm ở dev/test; `.env.example` | NÊN | Prod không ảnh hưởng | BE, OPS |
| S4-47 | `CheckoutSummary.serverTime`; thu trước B18 | Phần **thu trước B18 vượt số còn phải thu**: **chờ S4-38** (critic #4). Phần `serverTime` + giờ mặc định H16: NÊN | Minor nếu S4-38 xác nhận B18 chặn được số thừa; ARC đã thêm `serverTime`, `amountDueAtCheckoutVnd` vào 0.3.7 | BE-A, FE-A |
| S4-48 | Mã TC cho KB7; UXD duyệt chuỗi FE-07/KB7 (BUG-088); trường `unclaimedUntil` + `personIndex` | **CỔNG** | ĐK-S3-5 (UXD); trường cần cho S4-39 | QA, UXD, ARC |
| S4-49 | Brand Guidelines vào sản phẩm | **CỔNG** phần token, màu, chữ, AA (B0 + B1 cùng bản build; font tự host trên guest-web và landing); tên phòng theo BR-012 (khách thấy tên, nhân viên thấy "số · tên") dùng ánh xạ tạm BL 4.1. Logo: CỔNG nếu INV gửi SVG trước D7, không thì NÊN-ÔĐ | INV Must 17/10; đổi ánh xạ khi INV gửi bảng ghép chỉ là sửa cấu hình căn | UXD, FE-B, MOB, PO |
| S4-50a | BUG-076, 080, 081 (PO quyết – P-S4-2…4) | **CỔNG** | 076: lễ tân thấy giá trước khi tạo. 080: US-083 AC2 Must R2. 081: đi cùng S4-30 | FE-A (076, 080), FE-B (081), UXD |
| S4-50b | P2 hiển thị: 078, 087, 089, 101, 102 | NÊN-ÔĐ – trễ thì **bước cắt 6 (Ổn định)**, kể cả **BUG-078**; không sang R3 (critic #3) | Bill và số thu vẫn đúng; phải sửa trước lần INV thử thứ hai | FE-A, BE-A (078; BE-D khi chuyển việc), UXD |
| S4-50c | P3 còn lại: 075, 079, 082, 086, 091 (qua S4-39), 092, 094…098, 100 | NÊN | P3. Ưu tiên 082 (nút phụ phí chọn sai khoản – chạm bước trả phòng) | FE-A, UXD |

**Mục ngoài danh sách S4, PO thêm:**
- **S4-51** – ghim Google Maps INV gửi 17/10, đưa vào cấu hình cơ sở làm **một nguồn** cho US-108 AC1, US-148, US-162 (P-S4-7). **CỔNG** cho US-108. ARC: `GuestStay.property.mapUrl` đã có, OWN nhập ở Tham số – không đổi hợp đồng. Vai: BE-D (guest-portal EP14), MOB; SEC xác nhận tên miền liên kết.
- **S4-52** – trường tên phòng và hạng phòng công khai (US-004; BR-012) cho S4-49. **CỔNG** (cùng S4-49). ARC thêm trước khi đóng băng D1 (8.2 #13, critic #7): `Room.publicRoomType`; `GuestStay.roomName` + `publicRoomType` và ẩn `roomNo` với khách; `roomName` trong `RoomStatusEntry`, `HkTask`, `WorkOrder`, `MovePreview`; quy ước `labelParams.room` = tên phòng, chụp lại khi `settled`; cờ `roomDisclosedToGuest` trên đơn; tìm căn theo tên. Seed dùng ánh xạ tạm BL 4.1; bảng ghép INV gửi thì sửa cấu hình. Vai: ARC, BE-C (danh mục căn, HK/MT), BE-D (guest-portal), **BE-A (phía folio: `labelParams.room/from/to` = tên phòng, chụp `folio.settled_room_names` khi chốt, `Bill.roomName` – chuyển từ BE-B, ORC 17/10 quyết định 3)**, BE-B (cột trong migration chung `0055`), FE-B, MOB.

PO cập nhật `s4-carryover.md` (cột "Phân loại D1 – vai chính"; S4-21 thành Must; thêm S4-51, S4-52) theo giao việc ORC ở D1.

## 7. Quyết định PO trong Sprint 4 (thuộc quyền PO – ORC ghi decision-log khi commit)

| # | Quyết định | Lý do |
|---|---|---|
| P-S4-1 | **ESC-019 A → US-024 AC5–AC7** (backlog), theo BR-429 v0.3.5 của DOM. Áp cho B7 lý do `guest_request` có đổi căn, đơn `confirmed`.<br>• **Đơn Trực tiếp/CTV:** mọi đêm theo lịch giá hiện hành của căn mới, áp lại BR-107/BR-111, tính hai chiều.<br>• Bản tính thử từng đêm và tick "Đã báo khách số tiền mới" bắt buộc trước khi lưu.<br>• Cọc đã thu không đổi; phần thừa theo BR-522.<br>• OTTIMO muốn tặng phần chênh: giảm giá đặc biệt có duyệt, không dùng `upgrade`.<br>• **Do OTTIMO và `other`:** giữ giá. `upgrade` và `other` sang căn đắt hơn chỉ FDL+.<br>• **Đơn OTA:** giữ giá OTA; chênh lệch giá Trực tiếp so với căn gốc thu tại quầy muộn nhất khi nhận phòng, đảo rồi ghi lại, đổi xuống thì 0; OTA sửa đơn thì không có chênh lệch.<br>• FOC trên đêm đổi giá = min(số đã duyệt, giá mới) – BR-434. | INV quyết ESC-019 A 17/10; DOM BR-429 v0.3.5 |
| P-S4-2 | **BUG-R2-076 → CỔNG.** Nút "Dùng căn …" khi đặt trùng phải hiện giá từng đêm và tổng của căn gợi ý trước khi tạo đơn, một bấm xác nhận. Không tạo đơn ngay | Tiền của đơn đổi mà người tạo không thấy trước, dễ báo khách giá cũ. Cùng tinh thần "báo khách trước khi lưu" của ESC-019 |
| P-S4-3 | **BUG-R2-080 → CỔNG; US-083 hạ về "Đang nghiệm thu"** (rà lại theo ĐK-S3-4). AC2 tiếng Nga mới đạt ở API; hộp báo giá trên Desk chỉ có VI/EN | US-083 AC2 Must R2 nói rõ Việt/Anh/Nga. Từ QC-S3-09, AC giao diện chỉ nhận khi có ca UI bấm thật |
| P-S4-4 | **BUG-R2-081 → gộp S4-30 (CỔNG).** Hộp Xác nhận cọc hiện số tiền, giờ, ghi chú và ảnh biên nhận CTV đã báo, để lễ tân đối chiếu sao kê | US-086 AC4 ("FD/sale nhận thông báo") chỉ có giá trị khi người xác nhận thấy được nội dung đã báo |
| P-S4-5 | **US-152 AC2 – PO xác nhận bản ARC** (ADR-014 mục 3): gốc là tiếng Anh, tiếng Việt ở `/vi/`, không tự chuyển theo trình duyệt, chỉ có dải gợi ý. Chữ ESC-020 L1-A ghi "trình duyệt tiếng Việt mở bản Việt". PO coi khác biệt này là chi tiết kỹ thuật/SEO trong phạm vi L1-A: khách Việt vẫn sang bản Việt bằng một chạm. **ORC báo INV một dòng ở tổng kết, không cần ESC** | Google khuyên không tự chuyển hướng theo ngôn ngữ đoán được; Brand Guidelines "tiếng Anh dẫn dắt" |
| P-S4-6 | **S4-43 – mở rộng** (NÊN): FD/FDL thấy khoản hoàn `pending`/`approved` chưa có nơi nhận của mọi đơn trong cơ sở, để nhập nơi nhận (A43). Số tài khoản che như hiện hành; tách nhiệm không đổi (người duyệt ≠ người nhập ≠ người chi, trừ OWN). ARC sửa x-scope, BA ghi rbac S23 | Không có thì khoản hoàn do MGR tạo (MGR hủy đơn) kẹt ở MGR. Không nới kiểm soát chi |
| P-S4-7 | **Ghim Google Maps** INV gửi 17/10 (https://maps.app.goo.gl/oYos42G5YvUEcDCc6) là nguồn duy nhất cho nút "Chỉ đường" của guest-web (US-108), landing (US-148) và tin nhắc trước ngày đến (US-162, R3). Chỉ mở khi khách bấm, không nhúng bản đồ (SEC C-1, E14-08). SEC xác nhận tên miền `maps.app.goo.gl` trong danh sách cho phép | Một nguồn địa chỉ (US-148 AC3) |
| P-S4-8 | **Tên phòng (S4-49, S4-52) theo BR-012:** dùng **ánh xạ tạm BL 4.1** (101 The Amber … 402 The Ember) cho app và trang khách từ Sprint 4. INV gửi bảng ghép thì chỉ sửa cấu hình căn. **Landing không dùng ánh xạ tạm**: chỉ đăng tên phòng khi INV đã xác nhận bảng ghép | Không chặn Sprint 4 vì thông tin INV gửi chậm. Trang công khai không được sai thông tin |
| P-S4-9 | **Thứ tự cắt** theo mục 12.3 (gồm các bước cắt cho QA). ORC được cắt theo đúng thứ tự mà không cần hỏi lại PO; trễ mốc D3/D5/D7 thì ORC tự chạy tới bước 4 và chuyển việc theo 4.2. Cắt khác thứ tự thì bàn PO | Quyền phạm vi trong round của PO |
| P-S4-10 | **guest-web mặc định tiếng Anh** khi trình duyệt không phải `vi`/`ru`; trình duyệt `vi` → VI, `ru` → RU; khách đã chọn ngôn ngữ (`setLocale`) thì giữ lựa chọn đó. Khoảnh khắc thương hiệu (lời chào, tên phòng) tiếng Anh ở mọi ngôn ngữ theo DS 11.2. Bỏ nhãn `[GIẢ ĐỊNH – PO xác nhận]` của UXD | Brand Guidelines "tiếng Anh dẫn dắt"; khách nước ngoài là nhóm chính của trang khách; khách Việt vẫn thấy tiếng Việt ngay (trình duyệt `vi`). Khớp P-S4-5 của landing. ORC đã ghi vào dòng phân việc 17/10 |
| P-S4-11 | **US-136 AC2 (việc "Báo no-show trên kênh") và AC4 (thông báo MGR)**: **giữ ở Sprint 4 nếu** ARC thêm attention kind `ota_no_show_report` và notification `no_show_marked`/`no_show_restored` trước khi đóng băng D1 (8.2 #16). **Nếu ARC không thêm: dời sang R3** cùng US-124 (đóng ca) và kết nối kênh, ghi backlog. AC1 (nhắc gọi khách) giữ Sprint 4. **Lúc PO rà D1: ARC đã thêm cả ba loại** (`openapi.yaml` "0.3.7 bổ sung D1") → AC2/AC4 **giữ Sprint 4** (BE-D, FE-B), trừ khi ARC rút trước giờ đóng băng | Không có loại sự kiện trong hợp đồng thì không cài được mà không mở lại hợp đồng sau đóng băng. Tần suất thấp (đơn OTA no-show; 10 căn) và có cách vòng: lễ tân tự báo trên extranet OTA theo hướng dẫn ca, MGR xem nhật ký đơn. Phần chính AC2, AC4 đã đạt ở Sprint 2 |
| P-S4-12 | **Mục chạm tiền không được cắt trước khi có kết luận** (critic #4, #10, #15): S4-04 lên **CỔNG** cùng S4-21; ca `otaPenaltyVnd` của S4-37 và phần thu trước B18 của S4-47 vào phạm vi **S4-38** – chỉ cắt khi báo cáo S4-38 xác nhận không sai tiền và ORC ghi lý do vào decision-log; S4-23 phần thứ tự: DOM đã chốt BR-434 v0.3.6 → **CỔNG, BE-B** (ORC 17/10, quyết định 2) | Quy tắc ORC "mục sai tiền phải sửa trước cổng S4"; xem trước lệch lệnh ghi làm lễ tân bị 409 lặp lại |
| P-S4-13 | **Nhóm D của hợp đồng 0.3.7** phân loại theo mục 8.2b: **CỔNG** (A, A.3, B-6/#6, B-10 chỉ khai mã, B-14), **contract-ahead R3** (B-2, B-3, B-4, B-5, B-7, B-8, B-9, B-11, B-12); B-13 không đổi hợp đồng. Khớp phân loại ARC đã ghi trong `openapi.yaml`, trừ B-4: **ORC chốt contract-ahead R3 khi đóng băng** (quyết định 1; mã guest-web chỉ gửi `deferredPeople` ở `completeOnlineCheckin`) – ARC sửa mô tả `openapi.yaml` và `openapi-0.3.7.md` mục 4/7. Mục contract-ahead là trường/operation không bắt buộc đã có trong hợp đồng nhưng server chưa cài – QC không tính là lệch hợp đồng | Critic #2: phần nháp nhóm D đã vào hợp đồng nhưng chưa ai nhận, chưa có trong ước lượng. Xếp contract-ahead mọi mục không story Sprint 4 nào cần để giữ chỗ cho BE-B, BE-C, MOB đang sát năng lực |

## 8. Phân việc theo vai và trình tự

### 8.1 Trình tự phụ thuộc
1. **D1 – ARC ra OpenAPI 0.3.7** (mục 8.2): áp bản nháp + phần bổ sung, **thêm các trường critic #7, #8, #9 (8.2 #13–#15)**, thêm loại sự kiện #16, trả lời #12 (lúc PO rà D1 đã thấy trong `openapi.yaml`; chi tiết `openapi-0.3.7.md` mục 10); sửa `openapi-0.3.7.md` mục 4 và 7 cho khớp bảng phân việc ORC (nhóm H và B-14 thuộc BE-C; EP01 đọc thuộc BE-D; #6 thuộc BE-B); sinh lại `meta/api-client`, chạy `--check` và `--strict`, báo BE/FE/MOB/INT/QA trong ngày. **Đóng băng contract** cho mục CỔNG cuối D1. Đổi sau đó phải qua ARC và báo trong ngày.
   - Song song D1: DOM đã kiểm `br-examples.json` và trả lời critic #13–#17 ở BR v0.3.6 (8.3 dòng DOM – đã xong). QA viết test plan và TC cho US-024 AC5–AC7. BE-B viết migration chung `0055` (mục 4, ORC quyết định 4).
2. **D1–D5 – BE** (bảng phân việc ORC 17/10):
   - **BE-A** (tiền phía đơn): S4-07 → S4-05 (**mốc D3**) → S4-21 + S4-04 (hàm tính chung xem trước/ghi; phần FOC/giảm giá gọi hàm đồng bộ của BE-B, có thứ tự S4-23) → S4-10 (M4, theo BR-402 v0.3.6) → S4-35 phần A → **BR-012 phía folio** (S4-52: `labelParams.room/from/to` = tên phòng, chụp `folio.settled_room_names` khi chốt, `Bill.roomName`; cột ở `0055` – nhận từ BE-B, ORC 17/10 quyết định 3) → NÊN: S4-09, S4-37 (TC-L2-057), S4-44, S4-47, BUG-078. Review PR `removePartyMember` của BE-C.
   - **BE-B** (FOC/thu/hoàn): **migration chung `0055` (D1, trước mọi migration khác)** → S4-02 + S4-18 + S4-34 + **S4-23 phần thứ tự** (cùng hàm đồng bộ; **mốc D3** cho S4-02, S4-18) → #6 `expectedVersion` (cùng PR FE-A) → S4-01/03 → S4-22 → S4-06, S4-08, S4-13 (**mốc D5** = M1 xong mã) → S4-35 phần B → S4-25 (BE) → S4-20 → US-066 + US-003 AC2 (chuyển BE-D nếu trễ D3 – mục 4.2). Hỗ trợ API cho S4-28.
   - **BE-C** (buồng phòng/bảo trì + giấy tờ): S4-39 (cả `removePartyMember`) + S4-17 (test cục bộ) → module buồng phòng/bảo trì nhóm H (US-052…057, 061, 062; `listInspections`; khối OOO; J8/J11; thông báo HK/MT; B-14 `room_status`) → S4-11/32 (cả phần guests: migration, J25, khóa `guest_doc`, A.3) → NÊN: S4-12, S4-46, US-058 phía server.
   - **BE-D** (mới – đọc EP01 + SSE + EP14): khung module đọc trên dữ liệu seed → US-010 (`getTonightKpi`), US-011 + S4-31 (`getArrivalsDepartures`), US-012 "Cần chú ý" đủ nguồn (US-085 AC2 J2, US-136 AC1, AC2/AC4 theo P-S4-11) + SSE → US-003 AC4, US-019 AC2 → EP14: US-108 (+ S4-51), US-109, US-110 (+ job nhắc BR-811). Nhận việc chuyển ở mốc trễ (4.2).
3. **FE và MOB nối API thật theo từng phần BE giao.** Trước đó dùng MSW theo contract, như guest-web Sprint 3.
   - **FE-A** (Desk – tiền, lưu trú): S4-28 → S4-21 UI (hộp tính thử, ô "Đã báo khách"), 076, 080 → S4-10 (H13) → #6 `expectedVersion` (cùng PR BE-B) → S4-08 chọn dòng giữ → S4-39 FE + nhãn "có thể là khách quen" → S4-27 (sau S4-35) → S4-25 (gộp sau 056/059/061) → NÊN-ÔĐ/NÊN: S4-50b, S4-45, S4-50c, S4-44, S4-09, S4-47.
   - **FE-B** (Desk – vận hành, brand): **B0 + B1 cùng một bản build** (token DS v0.4 + `@fontsource/jetbrains-mono`, tự host) → **S4-26, S4-29, S4-30 (+081)** (nhận từ FE-A ngày D1) → Hôm nay / Tổng quan + "Cần chú ý" + SSE (MSW tới khi BE-D giao) → form OOO + phiếu sửa (Desk) → hàng yêu cầu khách → US-066 → Should R2.
   - **MOB:** khung PWA + B0 + B1 (G5) → H19 → H20 → H21 → H22 → guest-web H23 (yêu cầu, thông tin lưu trú, tên phòng, EN mặc định P-S4-10, font tự host) → NÊN: US-058.
4. **D5–D7 – kiểm chứng đối kháng S4-38** (báo cáo trước hết D7). **D6–D8 – nối chuỗi:** E2E A1 (có PWA) và A4; lượt sửa của vòng kiểm chứng; UXR đi thử PWA buồng phòng. **D8 – ORC kiểm G1** (11.2).
5. **D9–D10:** lượt kiểm lại sau sửa, review PR còn lại, Phản hồi & sửa, hồi quy, PO nghiệm thu, QC cổng Sprint 4 (hoặc lùi sang Ổn định theo quy tắc D8).

### 8.2 Nội dung OpenAPI 0.3.7 (ARC, D1)

"Đã áp" = có trong `openapi.yaml` 0.3.7-draft (`outputs/ARC/openapi-0.3.7.md`). "Đã áp D1" = critic khởi động chỉ ra còn thiếu; lúc PO rà (17/10, bước D1) ARC đã thêm vào `openapi.yaml` (mục "0.3.7 bổ sung D1 – đóng băng"), ARC ghi chi tiết ở `openapi-0.3.7.md` mục 10. ORC chỉ đóng băng khi các dòng này còn nguyên ở bản đóng băng; thiếu thì mục CỔNG tương ứng không làm được.

| # | Nội dung | Mục | Mức | Trạng thái |
|---|---|---|---|---|
| 1 | `checkIn.payment` + `CheckInPreview.amountDueAtCheckinVnd` | S4-10, BUG-038 | CỔNG | Đã áp; mô tả `checkIn` theo BR-402 v0.3.6 (DOM 17/10, critic #13), không còn nhãn giả định |
| 2 | `GuestDocumentLink` (PATCH chỉ `partyMemberId`, oneOf); `DOCUMENT_UNCLAIMED_EXISTS` + 409 kèm id; `removePartyMember.guestUploadPersonIndex`; mô tả `PARTY_DUPLICATE`, `REGISTRATION_INCOMPLETE` (K5, K6); erd 4.7, audit `registration.documents_unclaimed` / `document_claimed`, `retention_run.policy_key = party_removed`; `RegistrationPartyPort` | S4-39 | CỔNG | Đã áp; SEC xác nhận phương án dự phòng 24 giờ chỉ còn cho đường không có lựa chọn |
| 3 | `unclaimedUntil`, `personIndex` trong DTO giấy tờ | S4-48 | CỔNG | Đã áp |
| 4 | Nhóm D mục A + A.3: `guest.source`, `id_doc_hmac` v1, CHECK 1–3, `document_profile_retention_months`, J25 | S4-11, S4-32 | CỔNG | Đã áp (A.3 bật cùng PR migration – nay của **BE-C**) |
| 5 | Xem trước B7 `previewMoveReservation` + `applyDifference`/`expectedDeltaVnd`; **thêm thành phần giảm giá khách quay lại BR-111** vào `MovePreview` (critic #12); ghi rõ trong mô tả: xem trước và ghi dùng chung một hàm tính (critic #10) | S4-21, S4-04 | CỔNG | Đã áp; D1 thêm `returningGuestDiscountPct`, `nights[].pendingFocVnd`, cảnh báo `MANUAL_RATE_REPRICED`, câu "một hàm tính" (cả `changeRoom` `dryRun`) |
| 6 | `StayNightPricingPort.setNightRate` (cổng nội bộ) và quy tắc `adjustFolioLine` cho dòng `room`/`extra_person` | S4-35 | CỔNG | Đã áp D1: cách cài ghi ở mô tả `adjustFolioLine` (critic #12) |
| 7 | Ghim bản đồ của cơ sở (một nguồn cho US-108, US-148, US-162) | S4-51 | CỔNG | Không đổi hợp đồng – `GuestStay.property.mapUrl`, OWN nhập ở Tham số |
| 8 | Rà contract Sprint 4 đã có: HK, phiếu sửa, khối OOO, yêu cầu khách, loại mục `listAttentionItems` cho US-012, loại sự kiện `streamEvents`, danh mục minibar; `listInspections` | 5.1 | CỔNG | Đã áp (nhóm H). ARC sửa bảng việc mục 7: nhóm H thuộc BE-C, EP01 đọc thuộc BE-D |
| 9 | B14 `changeRoom.stayScope` "chỉ chuyển tới hết đơn gốc" | S4-09 | NÊN | Đã áp; chưa cài = contract-ahead |
| 10 | x-scope `listApprovalRequests` (S4-40) và mở rộng S4-43 – **gồm khoản `pending` chưa có nơi nhận** (critic #12) | S4-40, S4-43 | NÊN | Đã áp D1: x-scope `own_or_refund_queue` / `within_limit_or_own_or_refund_queue` gồm khoản hoàn chưa có nơi nhận |
| 11 | `listReservations.q` theo tên khách (S4-44 – NÊN); `balanceDueVnd` trong danh sách đơn (BUG-078 – **NÊN-ÔĐ**, không sang R3) | S4-44, BUG-078 | NÊN / NÊN-ÔĐ | `q` đã áp (D1 thêm tìm theo số căn/tên phòng); `balanceDueVnd`: ARC xác nhận ở `openapi-0.3.7.md` mục 10 |
| 12 | `CheckoutSummary.serverTime`, `amountDueAtCheckoutVnd` | S4-47 | NÊN (phần thu trước B18: chờ S4-38) | Đã áp |
| 13 | **Tên phòng BR-012** (critic #7): `Room.publicRoomType`, mô tả `Room.name`; `GuestStay.roomName` + `publicRoomType`, ẩn `roomNo` với khách (hoặc chỉ trả cho nhân viên); `roomName` trong `RoomStatusEntry`, `HkTask`, `WorkOrder`, `MovePreview`; `labelParams.room` = tên phòng, chụp lại khi `settled` (BR-012 (5)); cờ `roomDisclosedToGuest` trên đơn (BR-012 (4)); tìm căn theo tên | S4-52, S4-49 | CỔNG | **Đã áp D1** (`roomNo` phía khách deprecated – server không trả; `Bill.roomName` chụp khi chốt). Cài: phía folio (`labelParams.room`, `folio.settled_room_names`, `Bill.roomName`) = **BE-A** (ORC quyết định 3); danh mục căn, HK/MT = BE-C; guest-portal = BE-D |
| 14 | **FOC v0.3.5** (critic #8): `folio.foc_cancelled` vào tập đóng `AuditEvent.action` (thêm `foc_dormant`/`foc_restored` nếu ARC thấy cần); `ApprovalRequest.effectiveAmountVnd` (min(số xin, dòng)), `focState` (áp / ngủ / tạm dừng), `lineChangedNote` (BR-434); `StaffNotification.kind` `approval_cancelled` | S4-02, S4-18, S4-22 | CỔNG | **Đã áp D1** (thêm `foc_dormant`, `foc_suspended`, `foc_restored`, `focCancelReason`, `autoCancelReason`); QA thêm ca kiểm tập đóng |
| 15 | **S4-08** (critic #9): `CancellationQuote.serviceLines[]` (`lineId`, `performed`, `amountVnd`); `cancelReservation.retainLines[{lineId, reason}]`; mô tả `dryRun` | S4-08 | CỔNG | **Đã áp D1** (thêm `serviceReversedVnd`, `serviceRetainedVnd`, `refundRequestVnd`; `markNoShow.retainLines[]`) |
| 16 | **US-136** (critic #11): attention kind `ota_no_show_report`; notification `no_show_marked` / `no_show_restored`; sửa mô tả `restoreNoShow` | US-136 AC2, AC4 | Theo P-S4-11 | **Đã áp D1** → AC2/AC4 giữ Sprint 4 (BE-D, FE-B) |
| 17 | Trả lời từng điểm critic #12 (BR-111 trong `MovePreview`, S4-43 `pending`, loại mục "Cần chú ý" của S4-06, S4-35) | nhiều | CỔNG (trả lời) | **Đã áp D1**: dòng 5, 6, 10 ở trên; S4-06 dùng `AttentionItem.kind` `closed_reservation_credit` |

### 8.2b Nhóm D của 0.3.7 – phân loại (PO, critic #2 – P-S4-13)

Ký hiệu thêm: **contract-ahead R3** = trường/operation **không bắt buộc** đã có trong hợp đồng, server chưa cài ở Sprint 4, cài ở R3. QC không coi là lệch hợp đồng; ARC ghi nhãn trong mô tả (`x-round: R3` hoặc dòng "contract-ahead" – cách ghi do ARC chọn); client không được dựa vào trường này ở Sprint 4. Không mục nào nằm trong `required` được xếp contract-ahead.

Bảng dưới khớp phân loại ARC đã ghi trong `openapi.yaml` (mục "0.3.7 bổ sung D1"), **trừ B-4**: **ORC chốt contract-ahead R3 khi đóng băng** (quyết định 1, lý do ở dòng B-4); ARC sửa mô tả `openapi.yaml` (dòng phân loại nhóm D) và `openapi-0.3.7.md` mục 4/7 cho khớp, rồi chạy lại các bước kiểm hợp đồng.

| Mục | Nội dung | Phân loại | Vai | Lý do / ghi chú cho QC |
|---|---|---|---|---|
| A | Hồ sơ khách "từ giấy tờ" (BUG-033 b): `Guest.source`, `possibleReturningGuest`, thứ tự khớp ở `addGuestDocument`, `updateGuest` 422 cho hồ sơ chưa P05, `idDocLast4` chỉ khi P05, ERD 4.4, J25 | **CỔNG** (S4-11, S4-32) | BE-C (guests, migration, J25, khóa `guest_doc`, `document-party.port`; BE-A review phần `touchLastStay` ở B16/B18); FE-A nhãn "có thể là khách quen"; SEC kiểm | US-043 AC3, US-048 AC3 Must R2; điều kiện SEC |
| A.3 | `document_profile_retention_months` (1–12, mặc định 12, OWN) | **CỔNG** – cùng PR migration S4-11 | BE-C + ARC (bật `x-security-parameters` cùng PR) | ARC sửa ghi chú "cùng PR migration BE-B" thành BE-C |
| B-2 | `Reservation.availableOperations` | **contract-ahead R3** | (R3: BE-A, FE) | Không bắt buộc. Desk giữ cách hiện nút theo trạng thái + vai của Sprint 3; server vẫn kiểm khi ghi |
| B-3 | `getGuestSession` – đọc lại phiên khi tải lại guest-web | **contract-ahead R3** (`x-round: R3`) | (R3: BE-D, MOB) | guest-web giữ cách tải lại của Sprint 3; MOB và BE-D đều đang sát năng lực |
| B-4 | `updateOnlineCheckin.deferredPeople` (lưu lựa chọn "bổ sung tại quầy" ngay ở bước giấy tờ) | **contract-ahead R3** – ORC chốt khi đóng băng (quyết định 1) | (R3: BE-C, MOB) | Không story Sprint 4 nào cần; guest-web Sprint 3 chỉ gửi trường này ở `completeOnlineCheckin` (0.3.3, server đã cài – critic kiểm lại xác nhận ở `CheckinFlow.tsx`, `DocumentsStep.tsx`) nên không có luồng nào hỏng; BE-C đang thiếu ≈ 0,5 ngày (12.1) |
| B-5 | `ApprovalRequest.requestedById` (ẩn nút "Chi" với người tạo) | **contract-ahead R3** | (R3: BE-B, FE) | Server vẫn chặn `SELF_REFUND_FORBIDDEN`; chỉ là ẩn nút |
| **B-6 (#6)** | `approveRequest`/`rejectRequest.expectedVersion` – **bắt buộc với `refund`** (thiếu → lỗi kiểm dữ liệu, lệch → 412) | **CỔNG** | **BE-B + FE-A trong cùng một PR** | Thay đổi hành vi gây vỡ: BE cài mà Desk chưa gửi thì luồng duyệt hoàn hỏng. QA: ca có/thiếu/lệch phiên bản; ca duyệt FOC không cần trường |
| B-7 | `BookingRules.lateCheckout` (bậc phụ thu trả muộn, chỉ hiển thị) | **contract-ahead R3** | (R3: BE-A, FE) | Không bắt buộc; số phụ thu vẫn do server tính ở H15/H16 |
| B-8 | `MinibarCheck.checkedByName` | **contract-ahead R3** | (R3: BE-B, FE) | US-066 đạt không cần trường này |
| B-9 | `listReservations?roomId=` | **contract-ahead R3** | (R3: BE-A, FE) | Lọc theo căn đã có trên sơ đồ phòng; S4-44 (tìm theo tên) vẫn NÊN |
| B-10 | Mã lỗi còn thiếu: `recordPayment` 401/403/404/409 `FOLIO_LOCKED`; `reversePayment` 409/422; mô tả `createRefundRequest` | **CỔNG** (chỉ khai mã server đã trả) | BE-B xác nhận; QA kiểm bằng ca hợp đồng; FE-A hiển thị đúng 409/422 của `reversePayment` trong S4-27 | Server trả khác mã đã khai → lỗi lệch hợp đồng, BE-B sửa |
| B-11 | `Payment.receivedAmountVnd` (FD+), `selfReconciled` (MGR+) | **contract-ahead R3** | (R3: BE-B, FE) | Không story Sprint 4 nào cần; không bắt buộc |
| B-12 | `getBill?locale=vi\|vi_en` | **contract-ahead R3** | (R3: BE-B, FE) | Vắng tham số thì server theo BR-009 như 0.3.3 → S4-29 vẫn đạt US-020 AC2 |
| B-13 | Tách `overpayment_retained` | Không đổi hợp đồng | DATA quyết | – |
| B-14 | `room_status` sang module buồng phòng | **CỔNG** (nội bộ, cùng US-052) | **BE-C** (bảng ORC; `openapi-0.3.7.md` mục 4 ghi BE-A → ARC sửa) | Không đổi hợp đồng |

Đổi hành vi 0.3.7 mục 6 dòng 7 (`transitionHkTask` `cancel`, `transitionWorkOrder` `complete`, `createWorkOrder.category`): **CỔNG** cùng US-054/057/062 – BE-C + MOB, FE-B (chưa có client cũ).

### 8.3 Bảng phân việc (một bảng duy nhất – ORC 17/10)

Bảng này thay chỗ lệch giữa dự thảo kế hoạch và `outputs/ARC/openapi-0.3.7.md` mục 7 (critic #1). ARC sửa mục 7 và mục 4 (B-14) của tệp đó cho khớp trong D1.

| Vai | Việc Sprint 4 | Đầu ra |
|---|---|---|
| **ARC** | 0.3.7 (mục 8.2) ở D1, **gồm #13–#17** (critic #7, #8, #9, #11, #12) trước khi đóng băng; sửa `openapi-0.3.7.md` mục 4, 7 theo bảng này; ghi nhãn contract-ahead cho mục 8.2b và sửa dòng phân loại nhóm D trong `openapi.yaml` cho B-4 (contract-ahead R3 – ORC quyết định 1), ghi chú A.3 (BE-B → BE-C), bỏ "(nháp B-6)" ở mô tả `expectedVersion`. Review PR migration chung `0055` của BE-B trong D1. Review kỹ thuật mọi PR lớn (bắt buộc PR tiền, PR module mới, PR `removePartyMember` của BE-C). ĐK-S3-5: Verified 3 Blocker + 18 Major, xem phần BE 9b/9c. Theo dõi ADR-014 cho landing | `openapi.yaml` 0.3.7, `erd.md`, `outputs/ARC/openapi-0.3.7.md` (mục 10), Verified trong `reviews/s3-ARC.md` |
| **BE-A** (tiền phía đơn, nhận/trả phòng) | S4-07, S4-05 (mốc D3), S4-21 + **S4-04** (hàm tính chung xem trước/ghi), S4-10 / M4 (`checkIn.payment`, theo BR-402 v0.3.6), S4-35 (phần A), **BR-012 phía folio** (S4-52: `labelParams.room/from/to` = tên phòng, chụp `folio.settled_room_names` khi chốt, `Bill.roomName` – **nhận từ BE-B ngày D1**, ORC 17/10 quyết định 3; làm sau S4-35 phần A, không chen việc tiền). Review PR chạm module đơn (S4-39 của BE-C, A `touchLastStay`). NÊN: S4-09, S4-37 (TC-L2-057), S4-44, S4-47 (`serverTime`), BUG-078 (NÊN-ÔĐ) | Mã + test oracle; `outputs/BE/s4-be-a.md`; phản hồi S4-38 ở `responses/s3-BE-A.md` |
| **BE-B** (FOC, thu tiền, duyệt, hoàn) | **Migration chung `0055` ở D1** (mọi cột mới 0.3.7: room, reservation, folio, approval_request… – ORC quyết định 4; ARC review trong ngày), S4-02 + S4-18 + S4-34 (mốc D3 cho S4-02, S4-18), **S4-23 phần thứ tự** (BR-434 v0.3.6, cài trong hàm đồng bộ S4-02 – ORC quyết định 2), **#6 `expectedVersion` (cùng PR FE-A)**, B-10 (xác nhận mã lỗi đã khai), S4-01/03, S4-22, S4-06, S4-08 (`serviceLines`/`retainLines`), S4-13, S4-35 (phần B), S4-25 (BE), S4-28 phía API, ca `otaPenaltyVnd` (S4-37, trong phạm vi S4-38), S4-20, US-066 + US-003 AC2 (chuyển BE-D nếu trễ D3). **Không còn BR-012 phía folio** (chuyển BE-A). NÊN: S4-23 phần lọc `service_date` null, S4-42, S4-43 | `outputs/BE/s4-be-b.md` |
| **BE-C** (buồng phòng – bảo trì, giấy tờ C3, tệp) | S4-39 (BE-57, BE-58 (2), giấy tờ lễ tân tự nhập, cả `removePartyMember` nhận `guestUploadPersonIndex`), S4-17 (đóng bằng test cục bộ), S4-11/32 (cả phần guests: nhóm D mục A + A.3, migration, J25, khóa `guest_doc`), module buồng phòng + bảo trì nhóm H (US-052…057, 061, 062; khối OOO + `expectedDoneDate`; `listInspections`; J8/J11; thông báo HK/MT; B-14; việc dọn sinh từ lưu trú cho S4-31). NÊN: S4-12, S4-46; US-058 phía server | `outputs/BE/s4-be-c.md` |
| **BE-D** (mới – đọc EP01, SSE, EP14) | US-010 (`getTonightKpi`), US-011 + S4-31 (`getArrivalsDepartures`, thẻ "khách trả phòng hôm nay"), US-012 "Cần chú ý" đủ nguồn (US-085 AC2 J2; US-136 AC1, AC2/AC4 theo P-S4-11; mục S4-06; `registration_party_docs_unlinked`), SSE (quyền theo vai), US-003 AC4, US-019 AC2 (Tổng quan, đêm khả dụng); EP14: US-108 (+ ghim S4-51, tên phòng 8.2 #13), US-109, US-110 (+ job nhắc BR-811; tạo việc HK/phiếu sửa qua cổng BE-C). **Luồng nhận việc đầu tiên khi trễ mốc** (4.2) | `outputs/BE/s4-be-d.md` |
| **FE-A** (Desk – tiền, lưu trú) | S4-28, S4-21 UI (hộp tính thử, "Đã báo khách"), S4-10 (H13), **#6 `expectedVersion` (cùng PR BE-B)**, S4-08 (chọn dòng giữ kèm lý do), 076, 080, S4-39 FE (hộp chọn ô, gắn người bằng PATCH), nhãn "có thể là khách quen" (nhóm D mục A), S4-27 (xử lý 409/422 `reversePayment` – B-10), S4-25 (+093). NÊN-ÔĐ: S4-50b, S4-45 (năm sinh trẻ em, 103). NÊN: S4-50c, S4-44, S4-09, S4-47 | `outputs/FE/s4-report.md` (phần FE-A) |
| **FE-B** (Desk – vận hành, brand) | **B0 + B1 cùng một bản build** (token DS v0.4; `@fontsource/jetbrains-mono` 400/500 tự host; `.mono`; chuỗi KB7 S4-48) + logo; **S4-26, S4-29, S4-30 (+081) từ D1** (critic #21); Hôm nay (H03) + Tổng quan (H24) + "Cần chú ý" + SSE; thẻ khách trả phòng hôm nay (S4-31); form khối OOO + phiếu sửa trên Desk (US-019, 061, 062, US-135); hàng yêu cầu khách (US-110); bảng việc buồng phòng cho lễ tân (US-054 AC3); danh mục minibar (US-066); US-003 AC2/AC4; "401 · The Pine" (`roomLabel()`). Should: US-137, US-013, `swapRoom` | `outputs/FE/s4-report.md` (phần FE-B) |
| **FE-LP** (landing, luồng riêng) | Dựng LP-v1 theo hi-fi UXD mock v1.1 (tuần 2); font tự host (C-1); không đụng mã Desk, không BE, không đổi contract (rào chắn P1, landing-scope 7.2). **Dừng tự động khi trễ mốc D3/D5/D7** | `product/apps/landing` (thư mục ARC chọn) |
| **MOB** | **B0 + B1 cùng một bản build** cho PWA và guest-web (G5: Wi-Fi, mã đặt phòng JetBrains Mono 16 px; font tự host). PWA "OTTIMO Staff": đăng nhập theo vai HK/MT, H19, H20 (hoàn tác 10 giây, checklist), H21 (ảnh nén, banner mất mạng, đọc offline), H22 (kỹ thuật), VI/EN, "401 · The Pine"; không có dữ liệu C3. guest-web H23: tab Yêu cầu (US-109), thông tin lưu trú (US-108 + ghim), EN đủ (US-112), **mặc định EN theo P-S4-10**, khách chỉ thấy tên phòng (BR-012). NÊN: US-058 hàng đợi ghi offline | `product/apps/mobile`, `product/apps/guest-web`; `outputs/MOB/s4-report.md` |
| **UXD** | S4-49: DS v0.4, kiểm AA, ngoại lệ chức năng; **#18**: sinh lại `--bar-cf` bằng cách pha Light Oak với Ivory theo một tỷ lệ, hoặc ghi ngoại lệ ở DS 2.4; **#19**: giới hạn `--info` cho alert – OC "Có khách", khai báo `scanned`/`pre`, yêu cầu khách `acknowledged`/`in_progress` dùng Ink/Stone kèm icon. Rà chữ khách nhìn thấy theo giọng thương hiệu. ĐK-S3-5: Verified 13 Major, S4-41, S4-48 (BUG-088). Chuỗi VI/EN các màn Sprint 4; chuỗi `attn.dq_party_docs_unlinked`, hộp chọn ô (S4-39), xem trước giá (S4-21, 076), dòng dịch vụ giữ (S4-08). Review FE/MOB. Landing: hi-fi + biên tập chữ (L5-A), chọn ảnh (L6-A) – chỉ khi việc CỔNG của UXD đã xong | `product/design/` (DS v0.4, chuỗi), Verified trong `reviews/s3-UXD.md`, `product/design/landing/` |
| **DOM** | **Đã xong 17/10 – BR v0.3.5 và v0.3.6** (trả lời critic #13–#17 trước khi BE-A làm M4 và S4-21; critic kiểm lại tự tính lại các ví dụ, đều khớp): **#13** BR-402 – phần đang xin FOC chờ duyệt trên khoản phát sinh không phải thu để nhận phòng (oracle BR-402-01); BR-424 – `until_parent_departure` không sinh sẵn `priority_clean` (BR-424-05); **#14** BR-429 (g) giá sửa tay / giá thỏa thuận khi khách tự xin đổi căn (BR-429-09); **#15** S4-23 → BR-434 thứ tự lúc duyệt, tổng = min(Σ, dòng) (BR-434-11/12) – nay **CỔNG** (BE-B); **#16** nhóm 12B ghi chú Sprint 4 nhắn tay (vào mục 9.2); **#17** BR-429 (h) không áp cho đơn dài hạn nhập tay (BR-429-10) – thay giả định PO mục 13. **Còn trong Sprint 4:** xác nhận giả định ARC 0.3.7 bổ sung D1 (mốc `roomDisclosedToGuest`, danh sách dòng dịch vụ S4-08); ĐK-S3-5: Verified 2 Blocker + 8 Major; cùng PO nghiệm thu story tiền; hỗ trợ S4-38 | `business-rules.md` v0.3.6, `br-examples.json`, decision-log |
| **BA** | Cập nhật `specs/EP02-reservations.md` (B7 xem trước giá – ESC-019); rbac S23 (S4-40, S4-43); đặc tả trường S4-45 (năm sinh trẻ em); trả lời câu hỏi đặc tả EP07-08, EP14, EP01 trong ngày (cả cho BE-D mới) | `product/docs/specs/*`, `rbac-matrix.*` |
| **QA** | Test plan Sprint 4 (mục 10) ở D1; TC US-024 AC5–AC7 **trước khi commit backlog** (R-S4-8); oracle tiền; ca BR-434-06/09/11 qua xem trước rồi ghi; ca S4-23 thứ tự (BR-434-11/12), BR-402-01, BR-429-09/10 (gỡ nhãn TC-L2-094/098 khi đủ trường); ca tập đóng `AuditEvent.action`; sinh lại `docs/qa/traceability.md` trước commit đóng băng; ca #6; kiểm lại 055…061; S4-38 cùng ORC (báo cáo trước hết D7); E2E A1 liền mạch + A4 (ĐK-S3-7, sửa BUG-064); ca PWA; S4-13; S4-20; T9 theo cách chạy mới (mục 10); **NÊN**: sửa kết quả đúng tình huống **#14 theo BR-978** (mã cửa không qua Zalo/OTA – critic #5); S4-33 (sang Ổn định ở bước cắt 6); TC LP-v1 (dừng cùng FE-LP); hồi quy hằng đêm | `rounds/round-02/qa/s4-test-plan.md`, `product/tests/`, `qa/bug-list.md`, `qa/s4-test-report.md` |
| **SEC** | ĐK-S3-11 (S4-39 Verified) và SEC-G3 (8 Major). Review bắt buộc PR: PWA (không C3, `performedAt`, ảnh), guest-web yêu cầu khách (P-R2-4), SSE (quyền theo vai), S4-17 (test cục bộ), nhóm D mục A, `GuestStay.roomName` (tên phòng nhạy cảm như số căn – BR-012). Xác nhận giả định ARC: phương án dự phòng 24 giờ, `idDocLast4` chỉ khi P05. Landing C-1. Xác nhận tên miền liên kết bản đồ (P-S4-7) | `reviews/s3-SEC.md` mục 9, `qa/sec-findings.md`, `reviews/s4-SEC.md` |
| **OPS** | **ĐK-S3-1 đã đóng** (`outputs/OPS/demo-1.md` mục 6c). ĐK-S3-8 khi có VPS + tên miền (deploy staging, smoke, `deploy staging` = success); DNS tên miền gốc cho landing; SPF/DKIM/DMARC cho hộp thư chung – **không cấu hình trước khi có tên miền thật** (`ottimo.vn` và `booking@ottimo.vn` giữ nhãn [GIẢ ĐỊNH – xác nhận khi INV mua xong 19/10]); S4-15 cùng QA; `ci.yml` (`WRITES` cho ca A1/A4 mới; lịch chạy hằng đêm cho phần T9 còn lại); S4-46 | `outputs/OPS/s4-report.md`, `hosting-plan.md` |
| **INT** | S4-45 danh sách ngân hàng VietQR (BIN → tên). **NÊN**: sửa `product/docs/integrations/zalo-oa.md` mục 3 bước 1 theo **BR-972 `contact_source`** (liên hệ do OTA chuyển chỉ dùng cho hội thoại OTA và gọi điện; ZBS chỉ khi khách tự đưa liên hệ – critic #5). Chuẩn bị R3 cho ESC-021 A: cùng DOM, UXD soạn 7–8 mẫu tin ZBS theo giọng thương hiệu (NÊN). Không lập trình kết nối Zalo trong Sprint 4 | `product/integrations/`, `product/docs/integrations/zalo-oa.md` |
| **DATA** | Đối chiếu K-01/K-02/K-03 đêm nay, S1c, S7 và các dòng "Cần chú ý" trên DS-0 với số tính tay (A7); kiểm BE lưu đủ trường mục 9 cho EP07/EP08 (đêm OOO, việc dọn); B-13 `overpayment_retained` | `outputs/DATA/s4-report.md` |
| **UXR** | Đi thử PWA buồng phòng trên điện thoại 360/390 px (kịch bản buồng phòng cho C5); đi lại KB5, KB10; J6 chủ đầu tư 5 phút đầu ngày trên H24 | `product/docs/research/usability-report-r2.md` (bổ sung) |
| **PO** | Trả lời câu hỏi trong ngày (`outputs/PO/qa-log.md`); nghiệm thu từng AC (`outputs/PO/s4-acceptance.md`), AC giao diện chỉ nhận khi có ca UI bấm thật hoặc QA chạy tay có ảnh; cập nhật ghi chú US-136 theo P-S4-11 sau khi ARC chốt 8.2 #16; ghi chú US-024 và US-012 "Sprint 4 báo khách bằng tay" (critic #16); **NÊN**: đưa câu SEC DOM-04 (token thông báo, chỉ vai được gửi link mới chép được, `message_log` ghi `copied`, CTV không chép được – BR-976) vào AC của **US-161** (critic #5); review UXD (DS v0.4, landing hi-fi), QA (test plan), DATA; nghiệm thu nội dung LP-v1 trước khi trình INV; cập nhật PRD M15 (landing) theo ESC-020 A; dự thảo `rounds/round-03/plan.md` trong giai đoạn Ổn định (C6) | Như cột trái |
| **QC** | Cổng QC Sprint 4 (mục 11; quy tắc lùi D8); cổng LP-v1 riêng. Không tính mục contract-ahead (8.2b) là lệch hợp đồng | `qc/s4-qc-gate.md`, `qc/lp-v1-gate.md` |
| **ORC** | Mở luồng BE-D, FE-B, FE-LP; giao việc theo mục 8.1; giữ rào S4-25; theo dõi mốc D3/D5/D7, chuyển việc theo 4.2; điều phối kiểm chứng S4-38; quyết định D8; cắt theo mục 12.3; báo INV (mục 15) | decision-log, `sprint-4-summary.md` |

## 9. Luồng song song

### 9.1 Landing LP-v1 (ESC-020 = A hết, INV 17/10)
- Theo `outputs/PO/landing-scope.md` và phương án P1 ORC đã chọn:
  - UXD làm hi-fi, nội dung và ảnh ở tuần 1;
  - FE-LP dựng ở tuần 2.
- **Không tính vào cổng QC Sprint 4 / Round 2.** Cổng riêng **LP-v1** (mục 11.3).
- AC EP19 nay là AC chính thức. Các nhánh "nếu INV chọn khác" đã bỏ khỏi backlog.
- Lên mạng khi đủ:
  - tên miền + VPS;
  - bảng ghép phòng;
  - logo SVG;
  - hộp thư chung chạy được: địa chỉ `booking@ottimo.vn` và tên miền `ottimo.vn` giữ nhãn **[GIẢ ĐỊNH – xác nhận khi INV mua xong 19/10]** (critic #23: decision-log 17/10 ghi INV đã xác nhận, nhưng tin INV gần nhất xếp "email chung" vào nhóm "thứ Hai gửi đủ"; tên miền chưa mua xong). Ánh xạ thư mục ảnh → hạng phòng INV đã xác nhận 17/10;
  - quyền dùng ảnh;
  - INV duyệt nội dung một lần (L5-A);
  - INV đồng ý bản xem thử.
- Rào chắn: Sprint 4 trễ việc tiền (M1) thì ORC tạm dừng FE-LP, phần UXD giữ (landing-scope 7.2, rào 3).
- Lưu ý commit (ĐK-S3-13): tệp landing và brand commit **riêng** với mã Sprint 4. Trước cổng LP-v1 chạy `gen_traceability.py --strict --strict-track LP-v1`.
- *(Thay đổi sau đóng băng 17/10 – mục 16.1, 16.2: luồng LP-v1 thêm **US-155** (form "Yêu cầu đặt phòng" – INV chọn ESC-020 L7 = A); FE-LP dựng theo bản mẫu **v1.2.1** (thay v1.1) sau khi INV xem; lên mạng tách mốc "trang" và mốc "form".)*

### 9.2 Chat Zalo OA (ESC-021 = A, K1 = A)
- **Không lập trình trong Sprint 4.** Chat bắt đầu trên OA Manager ngay khi OA được xác thực. INV nộp bằng ĐKKD CTCP UTMG Living, hẹn 19/10. Zalo xác thực khoảng 2–3 ngày làm việc.
- Điều kiện SEC áp từ ngày đầu chat với khách thật. ORC gửi INV bản tóm tắt một trang khi OA được duyệt:
  - OA Manager bản web trên máy cơ sở;
  - mỗi người một tài khoản quản trị;
  - gỡ quyền trong ngày khi nghỉ việc;
  - không nhận ảnh giấy tờ hay số thẻ qua chat;
  - không gửi mã cửa.
- Khi OA xác thực: đổi nút Zalo của landing từ số hotline cơ sở sang OA bằng cấu hình (US-151 AC2), không sửa giao diện.
- Tự gửi tin (US-126, US-161, US-162, US-034, US-116) ở **R3**. Trong Sprint 4 chỉ soạn trước mẫu tin ZBS (INT, NÊN).
- Không gửi mã giảm cho khách OTA (K1-A).
- **Sprint 4 không lập trình nhắn tin** (critic #16): mọi tin BR v0.3.5 mô tả là tự động hoặc theo danh sách (BR-429 (d) tin TP-15 "đơn đã đổi"; BR-979 việc theo `eta.followup_time`; BR-973 (1) danh sách "Tin cần gửi hôm nay" – US-161) thì Sprint 4 **lễ tân báo tay** qua OA Manager hoặc hội thoại OTA. Tự động ở R3.
- Quy tắc áp **ngay khi chat tay** từ ngày đầu:
  - **BR-978**: không gửi mã cửa qua Zalo (ZBS, tin OA, chat gõ tay) hay hội thoại OTA; khách hỏi mã thì lễ tân gọi điện hoặc đọc trực tiếp;
  - **BR-973**: tin chủ động chỉ gửi trong khung [08:00, 21:00), marketing [08:00, 20:00);
  - **BR-981** (và BR-972 `contact_source`): không gửi ưu đãi/mã giảm cho khách OTA; liên hệ do OTA chuyển chỉ dùng cho hội thoại OTA và gọi điện vận hành.

### 9.3 Staging (ĐK-S3-8)
- INV hẹn gửi VPS và tên miền ngày 19/10. Từ lúc có IP và tên miền, OPS cần khoảng 1 ngày cho DNS, chứng chỉ, deploy và smoke.
- Có VPS trước D7: QA chạy A1 phần Sprint 3 trên staging; SEC smoke (SEC-G2); QA kiểm S4-15 qua Caddy thật. **S4-17 không chờ VPS**: đóng bằng test cục bộ (mục 6); bước kiểm qua Caddy thật nằm trong S4-15.
- Có VPS sau D7: làm trong giai đoạn Ổn định. **Không tính vào cổng QC Sprint 4**, nhưng là điều kiện của cổng cuối Round 2.

## 10. Kế hoạch kiểm thử Sprint 4 (QA – chi tiết ở `qa/s4-test-plan.md`, D1)

| Nhóm | Nội dung | Ghi chú |
|---|---|---|
| T1 Tiền – hồi quy và oracle | BR-434 (bậc 4A→2A→4A, X2b, BR-434-02…06 qua endpoint `move`), BR-424 căn gốc, BR-429 (phụ thu người theo nguyên nhân; **ví dụ mới ESC-019**; BR-429-09 giá thỏa thuận, BR-429-10 dài hạn nhập tay), BUG-061 3 ca, B12 + FOC, S4-06, S4-08 (`serviceLines`/`retainLines`); **S4-23 thứ tự** BR-434-11/12; **BR-434-06, BR-434-09 và BR-434-11 chạy qua xem trước rồi ghi** (B7 và B14), số xem trước = số ghi từng đồng (S4-04, S4-21); `checkIn.payment` với FOC chờ duyệt (BR-402-01); ca tập đóng `AuditEvent.action` có `folio.foc_cancelled`; ca `otaPenaltyVnd` (S4-37) và thu trước B18 (S4-47) | Mọi số đọc từ `br-examples.json`, không gõ tay |
| T2 Đồng thời | S4-13: duyệt FOC đua với B10/B11/resync; chống trùng khi B7 đổi căn có xem trước giá; **#6** duyệt/từ chối hoàn có/thiếu/lệch `expectedVersion` (UI + API, cùng PR) | |
| T3 Kiểm chứng đối kháng | ORC + QA theo phạm vi S4-38 (đã mở rộng – mục 6), bắt đầu khi M1 xong mã (chậm nhất D5) | Báo cáo `reviews/s4-money-verification.md` **trước hết D7**; kết luận riêng cho S4-37 `otaPenaltyVnd`, S4-47; S4-23 phần thứ tự kiểm như mục tiền CỔNG |
| T4 E2E liền mạch | A1 (báo giá → VietQR cọc → … → FOC có duyệt ở trả phòng → bill → VietQR → hoàn tất → PWA dọn, kiểm → `VI`); A4 (PWA báo sự cố → phiếu + OOO → rack/kiểm trùng/phòng trống chặn → đóng phiếu → `VD` → dọn → bán lại); A7 phần KPI và "Cần chú ý" | Bước ghi bấm thật; không `test.fail` giữa chuỗi; đưa vào `WRITES` |
| T5 PWA | 360×800, 390×844; banner mất mạng, đọc offline; hoàn tác 10 giây không gọi server; `performedAt` ngoài khoảng bị từ chối; không có C3 | Thiết bị thật trên staging khi có |
| T6 Yêu cầu khách | SM-15, định tuyến BR-811 (đồng hồ giả lập trước/sau hạn, trong/ngoài giờ trực), phí dọn thêm BR-506 (ESC-016 A); guest-web không lộ dữ liệu nhạy cảm (P-R2-4) | |
| T7 Tổng quan | K-01…K-03 khớp DATA; "Cần chú ý" đủ loại; SSE: mất kết nối, kết nối lại, đúng vai | |
| T8 Quyền | Ma trận sinh từ `x-roles` cho operation HK/MT/yêu cầu khách/minibar; HK không thấy giá vốn (US-003 AC2) | |
| T9 Giao diện + thương hiệu | axe trên mọi màn mới và màn cũ sau token DS v0.4 (B0 + B1); font tự host, không yêu cầu font ra ngoài | **Cách chạy (critic #22):** mỗi bản build chỉ chạy lại các ca UI có trong `WRITES` và A1/A4; phần ca UI + axe còn lại chạy **hằng đêm** (OPS thêm lịch vào `ci.yml`). Lỗi đêm nào thì QA ghi sổ sáng hôm sau |
| T10 Truy vết | TC cho US-024 AC5–AC7 **cùng commit** với backlog; sinh lại `traceability.md`; `--strict` exit 0 | |
| T11 LP-v1 | 3 cỡ màn × 2 ngôn ngữ; link Zalo/WhatsApp/gọi/email; 0 yêu cầu bên thứ ba (C-1); LCP; bàn phím | Cổng riêng. **Dừng cùng lúc với FE-LP** (bước cắt 4), chạy lại khi FE-LP mở lại |
| T12 Còn nợ | S4-24 (BUG-064 trước), S4-20; S4-33 (sang Ổn định ở bước cắt 6); tình huống #14 theo BR-978 (NÊN) | |

## 11. Tiêu chí QC

### 11.1 Cổng QC Sprint 4 – bảng kiểm

| # | Tiêu chí | Đạt khi |
|---|---|---|
| G1 | **Tiền** | BUG-R2-055…061 Closed; S4-06, S4-08, S4-13, S4-23 phần thứ tự (BR-434-11/12), S4-35 xong; S4-21 + S4-04 đạt US-024 AC5–AC7, xem trước = lệnh ghi; #6 `expectedVersion` (BE + Desk); BUG-038 Closed. Mỗi mục có test oracle. Có báo cáo kiểm chứng đối kháng Sprint 4 (phạm vi S4-38 mở rộng) với 0 ca lệch tiền; S4-37 `otaPenaltyVnd`, S4-47 thu trước B18 hoặc đã sửa hoặc có kết luận "không sai tiền" ghi decision-log. **Không ngoại lệ** |
| G2 | **Bảo mật** | S4-39 / BUG-085 SEC Verified (ĐK-S3-11); SEC-G3 8 Major Verified; S4-17 đóng **bằng test cục bộ** (phần Caddy thật thuộc S4-15, không tính ở G2); PR PWA, guest-web, SSE, 0.3.7 nhóm D mục A có review SEC; không phát hiện Critical/High Open |
| G3 | **Review** | ĐK-S3-5 đủ dòng Verified (SEC, DOM, ARC, UXD); thẻ Blocker/Major của review Sprint 4 đã xử lý hoặc dời có lý do |
| G4 | **Luồng** | E2E A1 liền mạch (có PWA) và A4 xanh trên CI, bước ghi bấm thật, BUG-064 Closed; A7 phần KPI/"Cần chú ý" khớp số DATA trên DS-0 |
| G5 | **CI** | Xanh trên đúng commit chấm: api, E2E (0 lần chạy lại), `WRITES`, `api-contract` (`--strict` exit 0), `contract-lint`, gitleaks, `pnpm audit` 0 high; lượt hằng đêm gần nhất của T9 xanh. Mục contract-ahead (8.2b) không tính là lệch hợp đồng |
| G6 | **Story** | 71 story Must R2 ≥ "Đang nghiệm thu"; không phần Must R2 nào "chưa làm"; PO ghi kết quả Sprint 4 ở `s4-acceptance.md` |
| G7 | **Lỗi** | 0 P0/P1 Open; P2 Open có kế hoạch (S4-50b, S4-45) |
| G8 | **Thương hiệu** | Token DS v0.4 trên Desk, PWA, guest-web; AA; axe 0 nghiêm trọng; màu ngoài bảng chỉ còn ngoại lệ UXD đã ghi |

### 11.2 Quyết định

| Quyết định | Điều kiện |
|---|---|
| **ĐẠT** | G1–G8 đạt |
| **ĐẠT CÓ ĐIỀU KIỆN** | G1, G2, G4, G5, G7 đạt. Thiếu ≤ 2 dòng trong G3, G6, G8, có kế hoạch trong Ổn định. Riêng G6: tối đa 3 phần Must R2 **không phải tiền, không phải bảo mật** chuyển sang Ổn định, ORC ghi decision-log |
| **KHÔNG ĐẠT** | Các trường hợp còn lại, và mọi trường hợp gặp một trong bốn tình huống ở mục 3 |

**Quy tắc lùi cổng ở D8 (ORC 17/10, critic #21):** cuối D8 ORC + QA kiểm G1. Nếu G1 **chưa xanh**, cổng QC Sprint 4 **lùi sang tuần Ổn định**; QC không chấm trong D10, không ép duyệt, không cấp ngoại lệ tiền. ORC ghi decision-log ngày chấm mới và báo INV ở tổng kết. Việc Sprint 4 khác vẫn chạy tiếp; FE-LP giữ trạng thái dừng tới khi G1 xanh.

Staging (ĐK-S3-8) không tính vào cổng Sprint 4 nếu VPS tới sau D7 (mục 9.3).

### 11.3 Cổng LP-v1 (riêng, không thuộc Round 2)
Gồm landing-scope mục 8, cùng:
- `gen_traceability.py --strict --strict-track LP-v1` exit 0;
- SEC C-1 (0 yêu cầu ra tên miền ngoài, không script/style nội tuyến trừ JSON-LD, header theo ADR-014);
- US-153 AC1 (Brand Guidelines, UXD ký duyệt bản dựng);
- INV đã duyệt nội dung và đồng ý bản xem thử.

*(Thay đổi sau đóng băng 17/10 – mục 16.2: cổng LP-v1 tách **mốc "trang"** (các điều kiện trên, form tắt trên mạng) và **mốc "form"** (US-155; chỉ bật production sau SEC C-1…C-13 và luật sư trả lời ESC-001 LZ-2, LZ-8).)*

## 12. Năng lực, rủi ro, thứ tự cắt

### 12.1 Ước lượng theo luồng (bản đóng băng D1, theo bảng phân việc ORC và quyết định đóng băng 2–4)
Ngày-người, ước tính của PO. Các vai xác nhận ở D1. Năng lực = 10 ngày/luồng. Chưa tính vòng sửa sau S4-38; phần dư của từng luồng là dự phòng cho vòng đó.

| Luồng | CỔNG | NÊN / NÊN-ÔĐ | Tổng | So năng lực |
|---|--:|--:|--:|---|
| BE-A | ≈ 6,75 | ≈ 1,5 | ≈ 8,25 | Dư ≈ 1,75 → dự phòng làm lại tiền (S4-07/05/21/04, M4). **Thêm BR-012 phía folio (≈ 0,5)** nhận từ BE-B ngày D1 (ORC quyết định 3), làm sau S4-35 phần A. EP01 sang BE-D, S4-39 sang BE-C |
| BE-B | ≈ 10,0 | ≈ 0,5 | ≈ 10,5 | **CỔNG đúng bằng năng lực, không còn dự phòng**: so bản D1 thêm **S4-23 phần thứ tự** (≈ 0,5, từ NÊN lên CỔNG – ORC quyết định 2) và **migration chung `0055`** (≈ 0,25 – quyết định 4); NÊN còn S4-23 lọc `service_date` null, S4-42, S4-43. **BR-012 phía folio (≈ 0,5, bản D1 chưa tính) không vào BE-B** vì đã chuyển BE-A – giữ lại thì BE-B ≈ 11,0. US-066 + US-003 AC2 (≈ 1,25) đứng cuối hàng, chuyển BE-D khi trễ D3 (4.2) → ≈ 9,25 |
| BE-C | ≈ 9,75 | ≈ 0,75 | ≈ 10,5 | Thiếu ≈ 0,5: bỏ EP14 (≈ 2,5), thêm S4-11/32 guests, khối OOO, `removePartyMember`, phần nhóm H trước ghi BE-A (≈ 3,0). Module HK mới là rủi ro → chuyển việc đợt D5 (4.2) |
| BE-D (mới) | ≈ 6,75 | – | ≈ 6,75 (+ ≈ 0,5 làm quen mã) | Dư ≈ 2,5 → **luồng nhận việc** khi trễ mốc (4.2) |
| FE-A | ≈ 5,75 | ≈ 3,25 | ≈ 9,0 | Vừa: bỏ S4-26/29/30 (≈ 2,0), thêm #6, S4-08 chọn dòng, nhãn khách quen (≈ 0,5) |
| FE-B | ≈ 9,0 | ≈ 2,0 | ≈ 11,0 | Thiếu ≈ 1 nếu làm cả Should R2 (≈ 2,0); Should cắt ở bước 1 → ≈ 9,0. Không còn ngồi chờ EP01: làm S4-26/29/30 và B0 + B1 trước, Hôm nay/Tổng quan trên MSW |
| MOB | ≈ 8,5 | ≈ 1,5 | ≈ 10,0 | Vừa sát (PWA làm từ đầu; B0 + B1 G5). US-058 cắt ở bước 1 |
| UXD | ≈ 6,5 | landing ≈ 3,0 | ≈ 9,5 | Vừa sát (thêm #18, #19). Landing dừng ở bước 4 |
| QA | ≈ 10,25 | ≈ 2,25 | ≈ 12,5 | **Thiếu ≈ 2,5** → bước cắt QA (12.3): T9 thu hẹp từ D1 (≈ −1,0), TC LP-v1 dừng cùng FE-LP (≈ −0,75), S4-33 sang Ổn định (≈ −1,0) → ≈ 9,75 |
| ARC · DOM · SEC · OPS | ≈ 6,25 · 4,5 · 5 · 3 | – | – | Đủ (ARC, DOM thêm việc D1 từ critic) |

*(Thay đổi sau đóng băng 17/10 – mục 16.1: US-155 thêm vào BE-D ≈ 2–2,5 trong Sprint 4 (phần nhận yêu cầu) và ≈ 1,5–2 ở tuần Ổn định (phần Desk); FE-B ≈ 1,5–2 ở tuần Ổn định; FE-LP ≈ 1,5–2; QA ≈ 1,75–2,25 (viết TC sớm ≈ 0,5); ARC ≈ 0,75–1; SEC ≈ 1–1,5. Bảng trên giữ số bản D1.)*

Sprint 3 cần 9 vòng sửa sau kiểm chứng đối kháng. Nếu Sprint 4 có tỉ lệ sửa lại 30–50 % trên việc tiền và module mới, BE-B và BE-C vẫn có thể thiếu 1–3 ngày. Với BE-B, mốc D3 là điểm quyết định: trễ D3 phía BE-B thì US-066 + US-003 AC2 và S4-20 sang BE-D ngay (4.2), BE-B chỉ còn việc tiền. Mốc D3/D5/D7 (4.1) và quy tắc lùi cổng D8 (11.2) là cách xử lý, không ép tiến độ bằng cách giảm kiểm chứng.

### 12.2 Rủi ro

| # | Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|---|
| R-S4-1 | Sửa FOC tổng quát (S4-02/18/34) kéo dài hoặc vòng kiểm chứng tìm lỗi mới | Trễ S4-25, A1, cổng KHÔNG ĐẠT | BE-B chỉ làm tiền tới khi xong M1; mốc D3/D5; S4-38 bắt đầu chậm nhất D5, báo cáo trước hết D7, còn D9 cho lượt kiểm lại; rào gộp S4-25; lùi cổng ở D8 nếu G1 chưa xanh |
| R-S4-2 | PWA và module HK làm từ đầu | A1 (phần dọn/kiểm) và A4 trễ | MOB dùng MSW theo contract từ D1; BE-C giao endpoint HK trước D4; chuyển việc đợt D5 sang BE-D; cắt US-058 trước |
| R-S4-3 | FE-B quá tải sau khi nhận S4-26/29/30 | Hôm nay/Tổng quan trễ, ảnh hưởng A7 (G4) | Should R2 của FE-B cắt trước; FE-B làm S4-26/29/30 trong lúc chờ BE-D; Hôm nay/Tổng quan chạy trên MSW từ D2 |
| R-S4-4 | Đổi token DS (S4-49) làm vỡ ca UI và axe | Đỏ CI cuối sprint | B0 + B1 cùng một bản build, sớm (D1–D2); T9: mỗi bản build chạy ca `WRITES` + A1/A4, phần còn lại hằng đêm |
| R-S4-5 | INV gửi chậm bảng ghép phòng, logo, VPS, tên miền | Tên phòng tạm có thể sai so với biển cửa; thiếu logo; ĐK-S3-8 trễ; LP-v1 chưa lên mạng; chưa có hộp thư chung | P-S4-8 (ánh xạ tạm, sửa bằng cấu hình); staging không tính vào cổng S4 nếu VPS tới sau D7; không cấu hình SPF/DKIM trước khi có tên miền; ORC nhắc INV 19/10 |
| R-S4-6 | ESC-019 chạm vùng mã đang sửa (B7, FOC) | Hồi quy tiền | S4-21 làm sau S4-07, S4-05 và sau khi S4-02 gộp; hàm tính chung xem trước/ghi; DOM đã trả lời #13–#15 (BR v0.3.6); thứ tự S4-23 nằm trong hàm đồng bộ của BE-B mà BE-A gọi lại, không có hai cách tính |
| R-S4-7 | Landing, brand, Sprint 4 cùng một cây làm việc | Commit lẫn, CI đỏ (QC K10) | Commit riêng từng luồng; FE-LP chỉ trong thư mục landing |
| R-S4-8 | US-024 thêm AC5–AC7 mà chưa có TC | `--strict` đỏ, job "API contract" đỏ khi commit backlog | QA viết TC cùng commit với backlog (có thể gắn `[BLOCKED – S4-21]` tới khi có mã) |
| R-S4-9 | Tải review của ARC, SEC, UXD (vừa Verified Sprint 3, vừa review Sprint 4) | PR chờ review | Review theo PR nhỏ; ưu tiên PR tiền và C3 |
| R-S4-10 | BE-D là luồng mới, chưa quen mã nguồn | EP01/EP14 chậm, ảnh hưởng A7 và US-108…110 | Bắt đầu bằng phần đọc trên dữ liệu seed; ARC chỉ cổng đọc cần dùng; BA trả lời đặc tả EP01/EP14 trong ngày |
| R-S4-11 | ARC chưa kịp thêm trường #13–#15 trong D1 | Đóng băng trễ; S4-49/52, S4-18, S4-08 không làm được | **Đã xử lý:** 8.2 #13–#15 đã áp D1, critic kiểm lại xác nhận đủ trường; hợp đồng đóng băng phần CỔNG |
| R-S4-12 | #6 `expectedVersion` cài phía BE trước Desk | Luồng duyệt hoàn tiền hỏng | Một PR cho BE-B + FE-A; ARC review chặn gộp tách |
| R-S4-13 | BE-B CỔNG ≈ 10,0 = năng lực; migration chung `0055` là điểm chờ của mọi luồng BE ở D1 | Trễ M1 → lùi cổng D8; luồng BE khác chờ cột mới | BR-012 phía folio đã chuyển BE-A (ORC quyết định 3); `0055` chỉ thêm cột, không logic, ARC review trong D1; trễ D3 → US-066 + US-003 AC2, S4-20 sang BE-D (4.2) |

### 12.3 Thứ tự cắt (cắt từ trên xuống; ORC cắt theo đúng thứ tự không cần hỏi lại – P-S4-9)
Trễ mốc D3/D5/D7 thì ORC tự chạy tới bước 4 (dừng FE-LP) và chuyển việc theo 4.2.

1. **Should R2:** US-058 (hàng đợi ghi offline; PWA vẫn có banner mất mạng và đọc offline), US-137 giao diện, US-094, US-013, US-033, `swapRoom` → R3.
2. **Minor và ghi chú → R3** (trường hợp đồng tương ứng thành contract-ahead R3): S4-09, S4-23 phần lọc `service_date` null, S4-37 (trừ TC-L2-057 nếu là lỗi thật **và trừ ca `otaPenaltyVnd`** – mục 6), S4-40, S4-42, S4-44, S4-46, S4-47 phần `serverTime` (**trừ phần thu trước B18**). **Không còn trong bước này:** S4-04 (CỔNG), BUG-078 (bước 6), S4-23 phần thứ tự (CỔNG – BR-434, ORC quyết định 2).
   - **QA-1 (áp ngay từ D1, không chờ trễ mốc):** T9 – mỗi bản build chỉ chạy lại các ca UI trong `WRITES` và A1/A4; phần ca UI + axe còn lại chạy hằng đêm.
3. **P3 giao diện:** S4-50c, S4-12, phần chọn ngân hàng theo tên của S4-45 → R3.
4. **FE-LP tạm dừng** (rào 3 landing). UXD chỉ làm landing khi việc CỔNG của UXD đã xong.
   - **QA-2:** TC LP-v1 (T11) dừng cùng lúc với FE-LP; chạy lại khi FE-LP mở lại.
   - *(Thay đổi sau đóng băng 17/10 – mục 16.1: bước 4 nay dừng cả **US-155** – BE-D phần nhận yêu cầu, FE-LP phần form, chạy TC US-155; BE-D quay về nhận việc chuyển theo 4.2. Phần Desk của US-155 đã ở tuần Ổn định nên không tính vào bước cắt Sprint 4.)*
5. **S4-43** (mở rộng hoàn tiền) → R3. Tạm thời MGR nhập nơi nhận.
6. **P2 hiển thị** (S4-50b **gồm BUG-078**, phần năm sinh trẻ em của S4-45) → giai đoạn Ổn định. Không sang R3; phải xong trước lần INV thử thứ hai.
   - **QA-3:** S4-33 → giai đoạn Ổn định. US-024 AC4 (nhánh `ROOM_NOT_READY`), US-139 AC3, US-022 giữ "Đang nghiệm thu" tới khi có ca.
7. **Cuối cùng**, ORC ghi decision-log và báo QC: chuyển sang Ổn định (không sang R3) tối đa 3 phần Must R2 không phải tiền hay bảo mật, chọn từ: US-012 AC7 (dòng VIP), US-110 AC2 (trả lời tự động ngoài giờ trực), US-136 AC1 (nhắc gọi khách), US-136 AC2/AC4 (nếu giữ theo P-S4-11), logo của S4-49 (khi INV chưa gửi SVG).

**Không bao giờ cắt:**
- tiền: S4-01/02/03/**04**/05/06/07/08/13/18/21/22/**23 phần thứ tự**/34/35/38, BUG-038, **#6 `expectedVersion`**;
- chạm tiền, tới khi có kết luận ghi decision-log (P-S4-12): S4-37 ca `otaPenaltyVnd`, S4-47 phần thu trước B18 (S4-38 kết luận);
- bảo mật: S4-39, S4-17, S4-11/32 (nhóm D mục A, A.3);
- ĐK-S3-5, ĐK-S3-7;
- S4-28, S4-25;
- luồng chính EP07/EP08 cho A1/A4 (US-053, 054, 055, 057, 061, 062; B-14) và PWA.

## 13. Giả định
- **Đã xác nhận (ORC 17/10, không còn giả định):** 4 luồng BE (A, B, C, **D**), 2 luồng FE cho Desk (FE-A, FE-B), 1 luồng FE-LP, 1 luồng MOB; BE-C nhận module buồng phòng/bảo trì; bảng phân việc mục 8.3. **Quyết định đóng băng D1** (decision-log ORC 17/10): (1) B-4 `deferredPeople` contract-ahead R3; (2) S4-23 phần thứ tự CỔNG, BE-B; (3) BR-012 phía folio sang BE-A từ D1; (4) migration chung `0055` do BE-B viết ở D1.
- `[GIẢ ĐỊNH]` Sprint 4 = 10 ngày làm việc (D1–D10, plan tuần 8–9). Ước lượng mục 12.1 là của PO, các vai xác nhận ở D1.
- **Đã chuyển vào BR (không còn là giả định của PO):** phạm vi ESC-019 không áp cho đơn dài hạn nhập tay (US-017 AC5a) nay là **BR-429 (h) v0.3.6** (DOM 17/10, oracle BR-429-10). BE và QA đọc từ BR.
- `[GIẢ ĐỊNH – chờ INV xác nhận]` Ánh xạ tạm tên phòng ↔ số căn theo BL 4.1 (BR-012 (6)) dùng cho app và trang khách tới khi INV gửi bảng ghép.
- `[GIẢ ĐỊNH – xác nhận khi INV mua xong 19/10]` Tên miền `ottimo.vn` (INV đang mua ở Mắt Bão) và hộp thư chung `booking@ottimo.vn` (critic #23). Không cấu hình SPF/DKIM/DMARC trước khi có tên miền thật.
- `[GIẢ ĐỊNH – chờ INV gửi 19/10]` VPS, bảng ghép tên phòng ↔ số căn, logo SVG, xác thực Zalo OA. Đã có từ INV: ánh xạ thư mục ảnh → hạng phòng, ghim Google Maps. Tới khi có: staging chưa chạy, tên phòng dùng ánh xạ tạm (P-S4-8), landing chỉ có bản xem thử `noindex`, nút Zalo dùng số hotline cơ sở.
- `[GIẢ ĐỊNH – SEC xác nhận]` Tên miền `maps.app.goo.gl` (link ghim INV gửi) nằm trong danh sách cho phép của nút "Chỉ đường" (E14-08). Không được thì dùng link `google.com/maps` cùng tọa độ.
- 4 giả định ARC của 0.3.7 (`openapi-0.3.7.md` mục 8): (a) và (b) **DOM đã chốt** (BR-402 v0.3.6; BR-424 – (b) sửa thành không sinh sẵn `priority_clean`); `[GIẢ ĐỊNH ARC – SEC xác nhận]` (c) hẹn xóa 24 giờ chỉ còn cho đường không có lựa chọn, (d) `id_doc_last4` chỉ ghi khi P05. Đội làm theo; đổi chỉ là sửa mô tả, không đổi trường.
- `[GIẢ ĐỊNH ARC – DOM xác nhận]` 0.3.7 bổ sung D1: (a) mốc `roomDisclosedToGuest`, (b) danh sách "dòng dịch vụ" S4-08; (c) `publicRoomType` là chữ tự do EN – chờ bảng INV 19/10. Đổi = sửa logic server/mô tả, không đổi trường.

## 14. Việc cần ghi decision-log (ORC ghi khi commit)
1. PO: P-S4-1…P-S4-13 (mục 7). Gồm US-083 hạ về Đang nghiệm thu; ESC-019 → US-024 AC5–AC7; xác nhận US-152 AC2; guest-web mặc định EN (P-S4-10); US-136 AC2/AC4 có điều kiện (P-S4-11); mục chạm tiền không cắt trước kết luận (P-S4-12); phân loại nhóm D (P-S4-13).
2. PO: phân loại S4-01…S4-52 (mục 6, bản D1): S4-04 lên CỔNG; S4-17 đóng bằng test cục bộ; S4-37 `otaPenaltyVnd` và S4-47 vào phạm vi S4-38; **S4-23 phần thứ tự = CỔNG, BE-B** (DOM BR-434 v0.3.6, ORC quyết định 2); BUG-078 sang bước 6 (Ổn định), không R3; S4-21 thành Must; thêm S4-51, S4-52.
3. PO: backlog – 15 story Must R2 Sprint 4 và 9 story EP19 v1 chuyển "Sẵn sàng"; AC EP19 bỏ các nhánh "INV chọn khác" vì INV quyết ESC-020 A.
4. PO: thứ tự cắt bản D1 (12.3) gồm bước cắt QA-1…QA-3; S4-23 phần thứ tự vào danh sách "không bao giờ cắt" (tiền).
5. PO: ước lượng bản đóng băng (12.1) – BE-A ≈ 8,25 (nhận BR-012 phía folio ≈ 0,5); BE-B ≈ 10,5 (S4-23 thứ tự ≈ 0,5 + `0055` ≈ 0,25; CỔNG ≈ 10,0 không dự phòng).
6. ORC (đã ghi 17/10): bảng phân việc một bảng, BE-D, mốc D3/D5/D7, quy tắc lùi D8, P-S4-10, nhãn tên miền/email; **chốt đóng băng D1, quyết định 1–4**. ORC ghi thêm khi commit: lịch D1 thực tế; giờ đóng băng hợp đồng.

## 15. Việc chờ INV (không có ESC mới)
- **Không có ESC mới.** ESC-019, 020, 021 đã quyết; Sprint 4 chạy theo các quyết định đó. P-S4-10, P-S4-11, P-S4-12, P-S4-13 thuộc quyền PO (ngôn ngữ mặc định theo Brand Guidelines INV đã ban hành; phạm vi trong round).
- Thông tin INV hẹn 19/10: VPS + tên miền (Mắt Bão), bảng ghép tên phòng ↔ số căn, logo SVG, xác thực Zalo OA, **xác nhận hộp thư chung `booking@ottimo.vn` chạy được trên tên miền đã mua**. Thêm: quyền dùng ảnh; chỗ đậu xe, thang máy, thú cưng; link OTA + 3–5 đánh giá.
- Đã nhận 17/10: ghim Google Maps; xác nhận ánh xạ thư mục ảnh → hạng phòng. Địa chỉ `booking@ottimo.vn` INV đã chọn nhưng giữ nhãn giả định tới khi có tên miền (mục 13).
- ORC báo INV một dòng ở tổng kết Sprint 4 về P-S4-5:
  - trang web mở bản tiếng Anh ở địa chỉ gốc;
  - khách dùng trình duyệt tiếng Việt thấy dải gợi ý "Xem bằng tiếng Việt";
  - trang không tự chuyển (để Google đọc đủ hai bản).

  Nếu INV muốn tự chuyển thì báo đội.
- Nếu cổng S4 lùi sang tuần Ổn định theo quy tắc D8, ORC báo INV ở tổng kết (không cần ESC: không đổi mốc cuối Round 2 nếu Ổn định vẫn đủ ngày; nếu ảnh hưởng mốc cuối Round 2 thì ORC tạo ESC theo protocol mục 8).

## 16. Thay đổi sau đóng băng (17/10, ORC duyệt)

Đề xuất: PO (`outputs/PO/landing-scope.md` mục 0.5–0.6; lượt Phản hồi & sửa sau workflow landing). Duyệt: ORC 17/10. Căn cứ: `04-investor-feedback/FB-INV-002.md` (INV chọn ESC-020 L7 = **A** ngày 17/10); `reviews/landing-booking-SEC.md`; `reviews/landing-v12-critic.md`; `business-rules.md` **v0.3.8** (nhóm 11A BR-911…916 vẫn ghi v0.3.7 – DOM giữ số cho luồng LP-v1); decision-log dòng DOM v0.3.8. Mục này **không** đổi cổng QC Sprint 4 (mục 11.1, 11.2), mốc D3/D5/D7/D8, danh sách "không bao giờ cắt".

### 16.1 US-155 vào luồng LP-v1
- **US-155 Should R3 → Must "R2 – LP-v1"** (PO, quyền ưu tiên backlog). Không thuộc cổng QC Sprint 4 / Round 2 – tính ở cổng LP-v1 riêng (9.1, 11.3, 16.2).
- Phương án **ESC-020 L7-A** (INV 17/10): yêu cầu đặt phòng vào Desk, nguồn `website` (nhãn `facebook` khi vào từ fanpage), lễ tân xác nhận qua Zalo, không thanh toán online.

| Vai | Phần việc | Khi | Ngày-người [ước tính PO] | Điều kiện |
|---|---|---|--:|---|
| ARC | Operation bổ sung sau đóng băng ("0.3.7 bổ sung 2" – đã có) + sửa theo SEC ARC-13…ARC-23; `erd.md` 4.14; ADR-014 (gỡ nhãn chờ INV, link `#book`) | Sprint 4, sau việc CỔNG | 0,75–1 | Chỉ thêm, không sửa operation có sẵn; báo BE/FE/QA trong ngày; **không** tính lệch hợp đồng ở cổng S4 (như 8.2b) |
| BA | `rbac-matrix` (mã hành động, trường D30 – SEC ARC-19) **cùng commit** với ARC; SM-18 đã có | Cùng ARC | 0,5 | `--strict` phải xanh trước commit (RL14) |
| **BE-D** | **Phần nhận yêu cầu:** bảng + migration, form token, endpoint công khai, kiểm đầu vào, ô bẫy, giới hạn RAM trước DB + bulkhead (SEC ARC-13), giới hạn trong DB, trần "bận", job hạn xóa mọi trạng thái (C-2), `erase` (ARC-16), tham số bật form có kiểm điều kiện (ARC-17); test Phụ lục B.1 | **Sprint 4, sau mốc D5** | 2–2,5 | BE-D đã nhận việc chuyển đợt D3 (US-066 + US-003 AC2, S4-20): làm US-155 chỉ khi các việc này xong và không phải nhận đợt chuyển D5 (4.2). ORC duyệt ngoại lệ so với landing-scope 0.5 ("đã nhận việc chuyển → sang Ổn định"). Không đủ chỗ ở D5 → sang tuần Ổn định |
| **BE-D** | **Phần Desk:** list/get/transition theo phạm vi vai, chuyển đơn WR6, thông báo, SSE, "Cần chú ý", Q-W09 (16.3 mục c); test Phụ lục B.2 | **Tuần Ổn định** | 1,5–2 | Sau G1 xanh |
| **FE-B** | Hàng chờ "Yêu cầu từ website" (S35): danh sách, chi tiết, nhận/đóng/spam/mở lại/xóa, "Chuyển thành báo giá", hiển thị dữ liệu lạ an toàn (SEC ARC-21) | **Tuần Ổn định**, sau mọi việc CỔNG của FE-B | 1,5–2 | Dựng trên MSW theo hợp đồng nếu BE-D chưa xong |
| FE-LP | Form VI/EN, trang cảm ơn, công tắc theo tham số server (không cờ build – ARC-17), nhãn nguồn lấy từ link | Tuần 2, **sau phần trang**; theo bản mẫu v1.2.1 INV đã xem | 1,5–2 | Vượt tuần 2 → tuần Ổn định |
| UXD | Màn form, cảm ơn (có ở v1.2); hàng chờ Desk; chữ VI/EN | Sau việc CỔNG | 1–1,5 | – |
| SEC | Review PR BE-D, FE-LP, FE-B; khung thông báo xử lý dữ liệu (Phụ lục A) chờ luật sư | Theo PR | 1–1,5 | – |
| QA | TC 11 AC của US-155 gắn `[BLOCKED …]` trước mốc "trang" (≈ 0,5); chạy TC + Phụ lục B ở tuần Ổn định | Như cột trái | 1,75–2,25 | – |

- Ưu tiên không đổi: việc sửa lỗi tiền luôn đi trước; **không** lấy giờ của BE-A, BE-B, BE-C, FE-A; không làm chậm D3, D5, D7, D8.
- Bước cắt 4 (12.3) dừng cả US-155 (BE-D phần nhận yêu cầu, FE-LP phần form, chạy TC).

### 16.2 Cổng LP-v1 – hai mốc (thay 11.3 khi lệch)
- **Mốc "trang"** (đưa trang giới thiệu lên mạng): các điều kiện 11.3 + landing-scope mục 8; AC mới US-146 AC5–AC7, US-147 AC6, US-151 AC7–AC8; **form tắt** trên mạng (nút "Đặt phòng" mở chat Zalo); `gen_traceability.py --strict --strict-track LP-v1` exit 0 – mọi AC Must của luồng, gồm US-155, có TC (TC US-155 được gắn `[BLOCKED …]`).
- **Mốc "form"** (bật form trên production): US-155 AC1–AC11 đạt trên bản thử (QA, không lỗi P0/P1); review bắt buộc ARC + SEC (phần BE), UXD + QA (phần FE); trang quyền riêng tư có phần form (US-149 AC5, US-155 AC10); QC chấm mốc form ĐẠT hoặc ĐẠT CÓ ĐIỀU KIỆN; **và** điều kiện ở 16.2a.
- **16.2a – Form chỉ bật production khi đủ cả hai:**
  1. **SEC xác nhận C-1…C-13** (`reviews/landing-booking-SEC.md` mục 1: C-1, C-2, C-3 mở rộng, C-11, C-12, C-13) và SEC-G1/G2 (Desk chạy thật, được nhận dữ liệu khách thật);
  2. **luật sư trả lời ESC-001 LZ-2 và LZ-8** (LZ-8 theo Luật TMĐT 2025 + NĐ 248/2026), hoặc OTTIMO đã làm xong thủ tục thông báo/đăng ký.
  - Tới khi đủ: form chỉ chạy ở bản thử có chặn truy cập (SEC ARC-10). Dự kiến sớm nhất **đầu Round 3** (cần Desk chạy thật).
- Sau khi trang lên mạng, INV tự đặt nút "Đặt ngay" của fanpage trỏ về link `#book` có UTM (ESC-020 mục "Việc anh/chị tự làm cho fanpage") – không cần chờ mốc "form".

### 16.3 Xếp lịch việc mới từ DOM (BR v0.3.8, decision-log dòng DOM 17/10) và BA Q-W09
| # | Việc | Mức | Xếp | Lý do | Tạm thời |
|---|---|---|---|---|---|
| a | **DOM-S4-17** – thao tác "khách để lại" tiền dư cho **đơn đã đóng** (`cancelled`/`no_show` có `closed_reservation_credit`), chỉ MGR+, bắt buộc đính kèm/ghi bằng chứng khách đồng ý (BR-522 v0.3.8) | NÊN | **R3 – Sprint 1** (cùng US-124 đóng ca); không vào Sprint 4, không vào tuần Ổn định | Đường ghi tiền mới: cần operation mới (đổi hợp đồng sau đóng băng), mã hành động rbac, ví dụ oracle DOM, ca kiểm chứng tiền như S4-38 – BE-B Sprint 4 đã kín năng lực (12.1). R2 chỉ có dữ liệu giả nên không có rủi ro sai tiền thật. Phải xong **trước RC** | Mục "Cần chú ý" `closed_reservation_credit` giữ mở tới khi chi hoàn đủ (S4-06 – đã là CỔNG); khách muốn để lại thì MGR ghi chú trên đơn, chưa đóng mục. PO thêm AC vào US-021 khi lập `round-03/plan.md` (không thêm AC bây giờ để không đỏ `--strict`) |
| b | **DOM-S4-11 phần (2)** – người đi cùng đã gắn hồ sơ mang nhóm VIP/Khách quen cũng sinh dòng "khách VIP/khách quen đến hôm nay" (BR-956 (2)) | NÊN | **R3 – Sprint 1** (cùng US-075 phân khúc khách, có nhóm "người đi cùng") | Module `reporting` chưa được đọc bảng người đi cùng; thêm bảng vào `REPORTING_READ_TABLES` cần **ARC duyệt** (điều kiện C5); BE-D Sprint 4 đã nhận thêm việc chuyển + US-155 | US-012 AC7 (dòng VIP/khách quen) nghiệm thu R2 theo **người đứng tên** (VIP/Khách quen hoặc đã từng ở – phần (1) BE-D đã làm). ARC trả lời câu C5 trong Sprint 4 để R3 làm ngay |
| c | **Q-W09** – BR-912 (2) báo lên lễ tân trưởng + quản lý khi yêu cầu website quá 30 phút chưa phản hồi; BR-912 (3) yêu cầu có ngày đến là **hôm nay** (kể cả ngoài giờ) báo ngay người trực | Must của US-155 (AC7, AC8) | **LP-v1 – mốc "form"** (không thuộc mốc "trang", không thuộc cổng S4). ARC thêm cờ `arrivesToday` + loại thông báo `website_request_overdue` (FDL + MGR, một lần mỗi yêu cầu, theo mẫu `guest_request_overdue` – DOM-S4-10) trong Sprint 4 cùng hợp đồng US-155; **BE-D làm ở tuần Ổn định** cùng phần Desk; FE-B hiển thị; FE-LP: trang cảm ơn của yêu cầu "đến hôm nay" luôn hiện số gọi | Khi form bật thật mà yêu cầu "đến tối nay" không ai thấy thì khách tới không có phòng – đây là rủi ro vận hành chính của form. Chi phí nhỏ vì dùng lại mẫu thông báo đã có | Ngoài giờ trực chỉ có thông báo trong app (FD/FDL đang trực) + trang cảm ơn mời khách gọi; **không** có kênh đẩy ngoài app (SMS/Zalo cho nhân viên) ở LP-v1 `[GIẢ ĐỊNH – người trực đêm mở Desk trên máy quầy; DOM xác nhận]`. PO đã ghi vào US-155 AC8 (sửa chữ, không thêm AC) |

### 16.4 Việc ghi decision-log (ORC ghi khi commit)
- ORC duyệt 16.1–16.3 (dòng PO "Thay đổi sau đóng băng Sprint 4 – landing" trong báo cáo PO gửi ORC 17/10).

### 16.5 Ngoại lệ "sang R3" cho hai phần Must R2 chưa làm (K9 cổng QC Sprint 4) – đề xuất của PO, 19/10

Căn cứ: `qc/s4-qc-gate.md` mục 5 K9 đường (ii); `outputs/PO/s4-acceptance.md` P-S4-14, P-S4-15 (18/10); backlog mục 5.5 R3-Q12, R3-Q13. Mục này là **ngoại lệ** so với 12.3 bước 7 (bước 7 chỉ cho chuyển sang Ổn định, không sang R3). Không đổi cổng QC, không đổi danh sách "không bao giờ cắt", không đụng tiền hay bảo mật.

| Phần Must R2 | Đề xuất | Lý do | Tác động R2 và vận hành tạm | Đích R3 |
|---|---|---|---|---|
| **US-012 AC7 – dòng "Đồng bộ kênh lỗi"** (`channel_sync_error`, critical, hướng dẫn đóng bán thủ công trên extranet) | Sang R3, làm cùng US-096 (nối channel manager) và job J18 `outbox.dispatch` (retry, trạng thái `dead`). Phần "khách quen/VIP đến hôm nay" của AC7 giữ R2 (đã Đạt) | R2 **không có kênh OTA/channel manager thật**: lệnh đồng bộ chỉ được ghi lại, adapter là Mock, J18 chưa có trong worker (US-094 Should R2 đã cắt ở 12.3 bước 1). Làm ở Ổn định nghĩa là dựng J18 + retry + `dead` (≈ 1–1,5 ngày BE-D/INT) chỉ để chạy bằng lỗi giả | Bản R2 và bản dùng thử trên dữ liệu giả không mất gì; lễ tân đóng bán thủ công trên extranet như hiện nay. TC-L8-012 chỉ kiểm phần VIP (QA ghi chú) | **R3-Q12** – Must R3, Sprint 2, **trước RC**, cùng lúc nối channel manager. Vai: INT, BE-D, FE-B, QA |
| **US-031 AC1 – thông báo chủ động J4** "quá giờ trả phòng" cho FD + MGR (12:00 nếu căn có khách đến hôm nay, 12:31 nếu không – BR-425) | Sang R3, làm cùng nhắc trả phòng tự động (US-034, US-161). Phần "báo đỏ" trên **Hôm nay** (thẻ chuyển "Quá giờ trả phòng", xếp đầu, SSE) giữ R2 | **Push ở R2 là Mock** (`s4-be-d.md` 2.4): thông báo J4 chỉ vào hộp thư trên Desk, cùng chỗ với thẻ đỏ đã có; hợp đồng 0.3.7 chưa có loại thông báo này (thêm sau đóng băng phải qua ARC); J4 chưa có job | Quản lý vắng mặt không nhận báo chủ động ở R2. Vận hành tạm: lễ tân gọi quản lý khi thẻ đỏ có khách đến cùng căn (trả muộn khi có khách đến vốn cần quản lý duyệt – BR-416) | **R3-Q13** – Must R3, **Sprint 1**, trước RC. Vai: ARC (loại thông báo), BE-D, FE-B, QA |

- Không đổi số story, MoSCoW, số AC (AC giữ, phần dời gắn **[Dời R3]** trong backlog như P-S4-14, P-S4-15). Must R2 vẫn 71.
- Không cần ESC: không bỏ phân hệ, không dời mốc RC/bản dùng thử, không đổi chính sách hay chi phí. ORC báo INV một dòng ở tổng kết Round 2 (QC mục 9 ý 5).
- Theo K9, khi ORC duyệt mục này thì G6.1 chấm "Đạt có ĐK" (1 dòng mềm).
- **Logo S4-49:** INV chưa gửi SVG → theo 12.3 bước 7, logo chuyển sang **Ổn định** (NÊN-ÔĐ, không sang R3): UXD, FE-B, MOB gắn logo **khi anh/chị gửi SVG (KAD)**, trước QC Round 2; tới lúc đó giữ chữ "OTTIMO" bằng Lora theo Brand Guidelines.

**ORC duyệt (19/10):** ☑ Duyệt (ii) cho hai phần trên · ☐ Không duyệt. Lý do: R2 không có kênh OTA/channel manager thật và push là Mock, nên làm trong tuần Ổn định không kiểm được thật. Báo INV ở tổng kết Round 2. Logo S4-49: chuyển Ổn định theo 12.3 bước 7, gắn khi INV gửi SVG.  
Người duyệt: ORC · Ngày: 19/10/2026 · Dòng decision-log: "ORC – K9 (cổng QC Sprint 4)" ngày 2026-10-19
