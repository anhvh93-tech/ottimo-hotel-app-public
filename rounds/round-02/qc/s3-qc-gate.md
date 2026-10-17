# Cổng QC giữa round – Round 2, Sprint 3 (nhận phòng, lưu trú, trả phòng 3 bước, bill, VietQR, thu tiền, giấy tờ C3, khai báo, check-in online)

- Người kiểm: QC | Ngày: 17/10/2026 | Không sửa sản phẩm, không commit. Chỉ sửa `demo-1-limits.md` mục C theo yêu cầu ORC, và thêm 1 dòng quyết định vào `decision-log.md`.
- Bản kiểm: code **`6af7173`**, khớp `headSha` của CI run **38998735861**. HEAD `adc0a47` chỉ thêm tài liệu. Cây làm việc khác HEAD ở 5 tệp của PO: backlog, decision-log, escalations-index, ESC-019, `outputs/PO/s3-acceptance.md`. Không tệp nào nằm trong `product/`.
- Chuẩn chấm:
  - plan R2 mục 4, dòng Sprint 3: "Luồng A1 (mục 7) chạy được lần đầu trên staging";
  - mục 7, áp phần thuộc Sprint 3: A1 từ cọc tới trả phòng, A6 phần C3 và app khách, B1–B5, C1–C4;
  - DoD của protocol;
  - các điều kiện ĐK-S2-1…7 của cổng Sprint 2.
- Đây là cổng sprint, không phải QC gate cuối Round 2.

## 1. Quyết định: **ĐẠT CÓ ĐIỀU KIỆN**

**Lý do:** lõi nhận phòng, lưu trú, trả phòng, thu tiền, giấy tờ C3 và check-in online đã chạy đúng trên CI. Không còn lỗi P0/P1, và mọi thẻ Blocker/Major đã được xử lý qua 8 vòng kiểm chứng. Nhưng chưa đạt mức "đủ dùng" (A1 trên staging), vì chưa có staging, còn 2 bước A1 chưa có trên giao diện, và còn vài lỗi tiền ở đường hiếm phải sửa trong Sprint 4.

Chi tiết:
1. **Có bằng chứng chạy thật.**
   - CI 38998735861: 7 job chạy đều xanh. API 2.187/2.187. E2E 1.777 đạt, 0 trượt.
   - 118 ca Sprint 3, RBAC Sprint 3 737/737, axe 0 vi phạm.
   - PO nghiệm thu 27 story: 17 Accepted, 10 Accepted một phần, 0 trả lại.
   - Kiểm chứng đối kháng vòng 8 không còn mục nào phải sửa ngay.
2. **Có điều kiện vì:**
   - Chưa có staging. Job `deploy staging` bị bỏ qua.
   - A1 còn thiếu 2 bước trên Desk: mã VietQR cọc (S4-28*) và xin FOC ở bước trả phòng (S4-25*).
   - Còn lỗi tiền ở đường hiếm, đã chuyển Sprint 4. Hai lỗi với tới được từ Desk: S4-07 và S4-05.
   - SEC và DOM chưa tự ký "Verified" các thẻ Sprint 3 của mình.
   - QC kiểm mẫu thấy thêm 4 điểm (mục 5). Không điểm nào làm sai tiền ở luồng demo, và không điểm nào lộ dữ liệu.
3. **Sprint 4 được bắt đầu**, vì việc của Sprint 4 không phụ thuộc staging. Các điều kiện ở mục 6 làm song song.

## 2. Bảng kiểm

| # | Tiêu chí | Kết quả | Bằng chứng |
|---|---|---|---|
| K1 | CI chạy thật, xanh (B1) | **Đạt** | `gh run view 38998735861`: `headSha` = `6af7173…`, conclusion success.<br>**7 job chạy, đều xanh:** format·lint·audit·test·build; API contract `--strict`; Redocly; gitleaks; no test endpoints; shellcheck; docker build + E2E.<br>**2 job bị bỏ qua:** `deploy staging` và `publish images (GHCR)`, vì chưa có staging. Câu "9/9 xanh" cần hiểu là 7 job xanh và 2 job bỏ qua.<br>Job test: api `Tests 2187 passed (2187)`. `pnpm audit --audit-level=high` có 3 lỗi mức moderate, 0 mức high.<br>Log E2E: `1777 passed`, `82 skipped`, 0 failed. Số đạt gồm 3 ca `test.fail` đúng dự kiến: TC-L3-032, TC-L3-011, TC-L3-074.<br>Bước "UI cases ran": 39 ca UI, 2 ca bỏ qua được phép, 13 ca axe. TC-SEC-024 đã chạy. Header của Caddyfile.prod được kiểm trên ảnh web.<br>Lưu ý: QC-S3-04 (lượt chạy lại của TC-L3-011) |
| K2 | 0 lỗi P0/P1 Open (B2) | **Đạt** | `qa/bug-list.md` mục 1, tổng 54 lỗi:<br>• P0: 0 mở.<br>• P1: 0 mở, 1 Fixed (BUG-R2-053). CI này đã chạy đủ ca C3 trên runner (TC-RB-022 ✓, TC-SEC-010 ✓), nên đủ bằng chứng để đóng (ĐK-S3-3).<br>• P2: 033 (a) Open → S4-11. 038 Deferred → S4-10; trong lúc chờ, B18 vẫn chặn `BALANCE_DUE` (`checkout.service.ts:412`) nên không mất tiền.<br>• P3: 054 Open → S4-12.<br>Mọi lỗi P2/P3 đều có mục S4 |
| K3 | Thẻ Blocker/Major Sprint 3 đóng hoặc dời có lý do (C4) | **Đạt** – thiếu chữ ký người review | Có 54 thẻ: 7 Blocker, 47 Major, trong `reviews/s3-ARC/DOM/SEC/UXD.md`. QC dùng script đối chiếu với `responses/s3-*.md`: thẻ nào cũng có dòng trả lời.<br>• Dời có lý do: ARC-BE-S3-30 sang S4; UXD-FE S3-20 (1) sang R3 theo ORC.<br>• 8 vòng kiểm chứng đối kháng. Vòng 8 (`6af7173`): không còn Major-fix-now.<br>• Major-defer đã chuyển S4: S4-01, 02, 05, 06, 07, 08, 17, 18, 22.<br>• Chưa có dòng "Verified" của SEC/DOM trong `s3-SEC.md`, `s3-DOM.md`. Trong khi đó SEC đã ghi "chưa cho qua cổng tới khi SEC kiểm lại SEC-BE-32, SEC-OPS-03" (decision-log dòng 503). Hai thẻ này đã được người kiểm độc lập đóng: SEC-BE-32 trong `s3-blocker-reverification.md`; SEC-OPS-03 trong `s3-blocker-verification.md`, ghi "đã sửa, chờ smoke staging". Chữ ký: ĐK-S3-5 |
| K4 | Tiền đúng (phần tiền của A1, B4) | **Đạt có điều kiện** | **Đã có bằng chứng:**<br>• Các oracle `br-examples.json` (BR-411…436, 507, 511, 521/522/527, 602…611, 903) đều đọc từ tệp, không gõ tay.<br>• TC-L4-050: bill 2.485.000. TC-L4-061: đơn OTA thu hộ chỉ còn phát sinh. P0 044 đã Closed.<br>• Vòng 8 chạy 28/29 ca tiền đúng trên PostgreSQL thật. Ca đỏ thuộc S4-07.<br>**Còn sai tiền ở đường hiếm:**<br>• Với tới được từ Desk: S4-07 (dời/gán căn khác định mức, lệch tới 300.000) và S4-05 (đơn OTA đổi phòng nhiều lần).<br>• Chỉ với tới qua API: S4-02 mở rộng (+150.000), S4-22 (+300.000), S4-18 (FOC chờ duyệt thành `rejected`). Lý do: Desk chỉ xin được FOC phụ thu nhận sớm (`CheckInPage.tsx:234` `requestFocForSurcharge`).<br>Checklist QC "không ĐẠT nếu còn sai tiền" áp ở cổng cuối Round 2: ĐK-S3-6. Có rủi ro mở thêm đường tới lỗi tiền: QC-S3-03 |
| K5 | Bảo mật phần Sprint 3 (B3, A6) | **Đạt** | • SEC review có 2 Blocker và 8 Major, tất cả đã Done và đã qua kiểm chứng.<br>• Rò chỗ upload và giữ bộ nhớ: đóng ở vòng 7. S4-17 (pipelining) chỉ xảy ra khi gọi thẳng cổng api, mà prod không mở cổng này.<br>• C3: TC-SEC-010, TC-RB-001/002/022 ✓ trong CI. RBAC S3 737/737.<br>• QC chạy `gen_rbac_cases --check`: OK, 189 operation, 2.079 ca, 0 lệch.<br>• Demo: QC gọi `/__test__/clock` (GET, POST) đều nhận 404; container api chạy `INCLUDE_TEST_SUPPORT=0`.<br>• Còn mở: chữ ký SEC, smoke SEC-OPS-03 trên staging, S4-15 |
| K6 | Story Sprint 3 đạt AC (C1 phần S3) | **Đạt một phần** | `outputs/PO/s3-acceptance.md`: 27 story có 17 Accepted, 10 Accepted một phần, 0 trả lại. Chấm lại 19 story S1/S2: 10 Accepted, 9 Accepted một phần.<br>QC đối chiếu 46 story với cột Trạng thái của backlog: khớp.<br>Phần dời đều sang Sprint 4. Không có phần Must R2 nào bị đẩy sang R3.<br>Mọi "Accepted" là trên stack tạm. Theo P-R2-7, story chưa được tính là "Xong" |
| K7 | **Mức "đủ dùng" Sprint 3: A1 chạy lần đầu trên staging** | **Không đạt** | Xem mục 4 |
| K8 | Staging, deploy tự động từ CI (B5) | **Không đạt** | Job `deploy staging` bị skipped. Chưa có VPS và tên miền (INV đang mua, decision-log dòng 559). OPS đã diễn tập trên máy: deploy 18 giây, tự quay về bản trước, sao lưu và khôi phục (`pending-for-INV.md` mục 1) |
| K9 | Giao diện, a11y, VI/EN (C2) | **Đạt** (trên Chromium) | • CI: 39 ca UI gồm desk-chromium, desk-clock H16 và guest-web H18 (390×844); 13 ca axe.<br>• `qa/s3-retest.md`: 45 lần quét H01–H18 (sáng/tối, VI/EN), 0 vi phạm. ĐK-S2-4 đã đóng.<br>• Chưa kiểm: thiết bị thật, VoiceOver. Câu pháp lý RU tạm dùng bản EN đã duyệt (quyết định ORC 17/10) |
| K10 | Truy vết, tài liệu (C3) | **Đạt** | QC chạy `gen_traceability.py`: 71/71 story, AC 251/251, 0 operation lệch rbac, `x-rbac-field` không còn thuộc tính chưa gắn. `traceability.md` không đổi.<br>Còn: BR-429 chưa có TC nào tham chiếu (QC-S3-07). OpenAPI 0.3.7 còn là nháp (S4-10) |
| K11 | ĐK-S2-1…7 của cổng Sprint 2 | **Đạt 6/7**, ĐK-S2-6 một phần | Mục 3 |
| K12 | Bản demo localhost cho INV | **Đạt có điều kiện** | • Stack `ottimo-demo` dựng từ `adc0a47` (`~/.ottimo-demo/built-from`) lúc 10:53 ngày 17/10.<br>• `/health` trả `{"status":"ok","db":"ok"}`. Cổng 8181, 8182, 8183 trả 200. `CLOCK_MODE=system`.<br>• **Chưa có bằng chứng smoke trên `adc0a47`.** `outputs/OPS/demo-1.md` mục 6 chỉ ghi smoke trên `5304fc8`.<br>• Mục C đã được QC sửa. Mục B còn 2 ô chờ PO. Hướng dẫn KB3 bước 2 viết sai (QC-S3-01). Việc cần làm: ĐK-S3-1, ĐK-S3-2 |

## 3. Kiểm từng ĐK-S2

| ĐK | Kết quả | Bằng chứng |
|---|---|---|
| ĐK-S2-1 sổ lỗi | **Đạt** | `outputs/QA/s3-kickoff.md` dòng 10–12: BUG-R2-014 Closed, bảng tổng đã sửa, QC-S2-01/02 đã ghi thành BUG-R2-025/026 |
| ĐK-S2-2 sức chứa (`CAPACITY_BELOW_BOOKINGS`) | **Đạt** | BUG-R2-025 Closed. Log CI 38998735861: TC-NT-039 ✓, TC-NT-040 ✓ (3 ca). Cảnh báo ngừng bán là A-39 `warnings[]` (decision-log dòng 471) |
| ĐK-S2-3 câu báo khi lưu đồng thời | **Đạt** | BUG-R2-026 Closed. Log CI: "BUG-R2-026 (E)" ✓ (2 ca), TC-L2-021 (E) ✓. Mẫu DS 6.21 tự thử lại theo `Retry-After` |
| ĐK-S2-4 E2E UI + axe | **Đạt** | Bước CI "UI cases ran": `UI: 39 case(s), 2 allowed skip(s), axe 13 case(s) ran`. CI báo đỏ nếu ca UI bị bỏ qua vì môi trường |
| ĐK-S2-5 PO nghiệm thu S2 + backlog | **Đạt** | `outputs/PO/acceptance.md` (S1+S2) và `s3-acceptance.md` mục 3. Cột Trạng thái của backlog khớp (QC đối chiếu) |
| ĐK-S2-6 staging, nâng "Gấp" | **Một phần** | Decision-log dòng 444 ghi đã nâng mức Gấp. `pending-for-INV.md` mục 1 có "Gấp – Máy chủ chạy thử". INV đang mua VPS và tên miền (dòng 559).<br>`escalations-index.md` không có dòng riêng; QC chấp nhận vì ESC-002/010 đã quyết, phần còn lại là INV gửi thông tin.<br>Staging vẫn chưa có → K7, K8 |
| ĐK-S2-7 SEC/DOM kiểm lại thẻ S2 | **Đạt** | SEC: decision-log dòng 446 và `s2-SEC.md:145-164`. DOM: decision-log dòng 462 |

## 4. Mức "đủ dùng" của Sprint 3: "Luồng A1 chạy được lần đầu trên staging"

### 4.1 Kết luận: **KHÔNG ĐẠT**

Phần A1 thuộc Sprint 3 chạy đúng trên CI, theo từng đoạn ở cả tầng API và giao diện. Nhưng có 3 thiếu sót:
- chưa chạy trên staging;
- chưa có lượt nào chạy liền một mạch, kể cả E2E và QA chạy tay có ghi hình;
- còn 2 bước chưa có trên Desk.

| Bước A1 (plan mục 7) | API, E2E trên CI | Giao diện, E2E-UI | Demo localhost | Còn thiếu |
|---|---|---|---|---|
| Báo giá ngắn ngày → giữ chỗ (căn bị chặn bán) | Đạt (S2: TC-L5-001…025) | Đạt (H12) | KB3 | – |
| **VietQR cọc** | Đạt: `createVietQr` cho đơn `hold` (TT `payments-s3.test.ts:503`) | **Không**: chỉ hiện số tiền và nội dung chuyển khoản, không vẽ mã QR (`QuoteDialog.tsx:658/684`) | – | **S4-28*** |
| Xác nhận cọc → `confirmed` | Đạt (TC-X-003, TC-L5-034) | Đạt | KB3 | Ảnh biên nhận của CTV: S4-30* |
| Check-in online qua link (VI/EN) | Đạt (TC-L7-001…014) | Đạt (H18 390×844 + axe) | KB9 | Chưa thử trên điện thoại thật |
| Nhận phòng: giấy tờ, đối chiếu, đồng ý lưu ảnh, khai báo `sent` → `confirmed` | Đạt (TC-L3-001…054) | Đạt (H13, H14) | KB4 | S4-10 (BUG-038), S4-11 |
| Lưu trú: thêm phát sinh, gia hạn 1 đêm | Đạt (TC-L4-001…033) | Đạt (H15) | KB6 | – |
| Lưu trú: yêu cầu khách | – | – | – | Sprint 4 (EP14) |
| Trả phòng 3 bước: minibar, phụ thu trả muộn | Đạt (TC-L4-040…048) | Đạt (H16, desk-clock) | KB7 | – |
| **FOC có duyệt ở bước trả phòng** | Đạt (TC-NT-027…032) | **Không**: Desk chỉ xin được FOC phụ thu nhận sớm | KB4 + KB10 dùng FOC nhận sớm để thay | **S4-25*** |
| Bill VI/EN đúng công thức, số `F26-xxxxxx` | Đạt (TC-L4-050, 051, 053) | Đạt (H16) | KB7 | Mở lại bill sau khi trả phòng: S4-29* |
| Thu VietQR hoặc ghi thu, "chờ đối soát" | Đạt (TC-L4-060…069) | Đạt | KB7, KB10 | – |
| Hoàn tất → buồng `VD` + việc dọn tự sinh | Đạt (TC-L4-053: `VD`, `createdTaskIds` = 2) | Đạt | KB7 | Xem việc dọn: Sprint 4 (`listHkTasks`) |
| Buồng phòng dọn, kiểm checklist trên PWA → `VI` | – | – | – | Sprint 4 (EP07) |
| Mọi số tiền khớp `br-examples.json` | Đạt (oracle) | – | – | Sai tiền ở đường hiếm (K4) |
| **Chạy trên staging** | Không | Không | – | Chưa có VPS |
| **Một chuỗi A1 liền mạch** (E2E + QA chạy tay có ghi hình) | Chưa có | Chưa có | `smoke-demo.mjs` chạy được một phần chuỗi (trên `5304fc8`) | ĐK-S3-7 |

### 4.2 Hệ quả của việc chưa có staging
1. **Sprint 3 không đạt mức "đủ dùng" theo đúng chữ của plan.** Sprint 4 vẫn bắt đầu được, vì việc của Sprint 4 không cần staging.
2. **Chưa story nào được "Xong".** Theo P-R2-7, story chỉ dừng ở "Đạt (stack tạm)". PO phải kiểm lại giao diện trên staging (s3-acceptance N3-5).
3. **Cổng QC cuối Round 2:** nhóm A (A1–A7) phải chạy trên staging, kèm một lượt QA chạy tay có ghi hình. B5 cũng cần staging. Nếu đến lúc đó chưa có staging thì **KHÔNG ĐẠT ở nhóm A và B5**. Như vậy Round 2 không được ĐẠT hay ĐẠT CÓ ĐIỀU KIỆN theo plan mục 7.
4. **Các việc chỉ staging mới chứng minh được, hiện chưa ai kiểm:**
   - deploy tự động có migration chạy thành bước riêng;
   - Caddyfile prod với tên miền thật, HTTPS/HSTS, cookie và Origin tách theo tên miền (SEC-OPS-03);
   - upload qua Caddy thật (S4-15, S4-17);
   - check-in online trên điện thoại thật (camera, ảnh HEIC hay 48 MP, mạng yếu);
   - p95 của sơ đồ phòng trên VPS;
   - sao lưu hằng ngày;
   - email SPF/DKIM.
5. **Thử với nhân viên thật (C5 – UXR):** nếu chỉ có localhost thì phải ngồi tại máy Mac của INV. Lễ tân và buồng phòng không dùng được điện thoại của mình.
6. **Thời gian:** OPS đã có sẵn kịch bản. Từ lúc INV gửi IP và tên miền, cần khoảng 1 ngày cho DNS, chứng chỉ, deploy và smoke. Để còn giai đoạn Ổn định chạy A1–A7 trên staging, INV nên gửi chậm nhất trước khi Sprint 4 kết thúc (ĐK-S3-8).

### 4.3 Demo localhost có thay tạm được cho buổi INV bấm thử không?
**Có, thay tạm được cho việc INV tự bấm thử để góp ý nghiệp vụ và giao diện.** Lý do:
- Demo chạy cùng mã với CI: dựng từ `adc0a47`, tức mã `6af7173` cộng tài liệu.
- Image là bản build production: không có endpoint kiểm thử (QC kiểm: 404).
- Dùng đồng hồ thật.
- Dữ liệu được dựng qua API, nên đi đúng quy tắc nghiệp vụ.
- Kiểm Origin giống staging.
- Smoke của OPS đã chạy đúng chuỗi chính: đăng nhập 8 vai, nhận phòng D1, VietQR, trả phòng D3, link khách. Lượt smoke này chạy trên `5304fc8`; với `adc0a47` cần xác nhận lại (ĐK-S3-1).

**Không thay được staging ở các việc sau:**
- tiêu chí QC nhóm A và B5;
- nghiệm thu "Xong" của PO;
- thử trên điện thoại, nhiều người dùng cùng lúc;
- thử với lễ tân và buồng phòng thật;
- kiểm cấu hình bảo mật thật.

**Rủi ro riêng của bản demo:**
- chỉ chạy trên một máy;
- các cổng localhost dùng chung cookie, nên mở hai vai cùng lúc phải dùng cửa sổ ẩn danh;
- mỗi lần làm lại (reset), mật khẩu và link khách đổi;
- giữ chỗ D5 sẽ hết hạn lúc khoảng **15:53 ngày 17/10** (`holdExpiresAt` trong `state.json`). Nếu INV thử muộn hơn giờ đó hoặc sang ngày khác thì cần chạy `demo-reset.sh` trước.

## 5. Tự kiểm mẫu của QC và phát hiện

**Đọc code 5 story chính:**

| Story | Kết quả | Vị trí đã kiểm |
|---|---|---|
| US-025, US-139 AC3 (cổng nhận phòng) | Đúng | `checkin.service.ts:201-226` và `:326-328`. Đơn OTA trả trước được tính là đã thu đủ. Đơn chưa gán căn trả `RESERVATION_UNASSIGNED`. Phần "đã thu đủ" chưa cộng phụ thu nhận sớm có chú thích rõ, khớp BUG-R2-038 |
| US-038 AC3 (trả phòng còn nợ) | Đúng | `checkout.service.ts:275-279`: chỉ MGR/OWN được ghi công nợ. `:412-413`: `BALANCE_DUE`. Có nhật ký `reservation.debt_on_checkout` |
| US-120 (VietQR) | Đúng | `integrations/payment/vietqr/emvco.ts:116-139`: trường 54 là số tiền, 62/08 là nội dung chuẩn hóa chỉ gồm A–Z0–9, có CRC. Không có tên hay số điện thoại khách |
| US-021 AC4 (hoàn khi hủy) | Đúng | `reservations.service.ts:2477-2490`: hủy đơn có phần được hoàn thì **tự tạo** yêu cầu hoàn `refund`. Dẫn tới QC-S3-02 |
| US-048, US-142 (C3) | Đúng | `registration.service.ts:2291` `requiresTrustedDevice`, `C3LogService`. Có ca CI tương ứng (K5) |

Ngoài ra QC đã chạy:
- `gen_traceability.py` và `gen_rbac_cases.py --check`;
- đọc log CI (E2E, test);
- probe stack demo, chỉ đọc, không đăng nhập.

### QC-S3-01 – Hướng dẫn demo KB3 bảo CTV "đính 1 ảnh", nhưng Desk không có ô ảnh
- **Mức:** Minor (tài liệu demo).
- **Vai sửa:** UXR (hướng dẫn); FE (S4-30*).
- **Vị trí:**
  - `demo-1-guide.md` KB3 bước 2: "**Báo đã chuyển cọc** (đính 1 ảnh)".
  - `ReservationDialogs.tsx:1240-1242` ghi rõ "No receipt image field in R2".
- **Hậu quả:** INV sẽ tìm ô đính ảnh mà không thấy, và ghi lỗi vào phiếu.
- **Xử lý:** QC đã thêm dòng này vào mục C. Hướng dẫn vẫn phải sửa (ĐK-S3-2).

### QC-S3-02 – `demo-1-limits.md` mục C có 2 dòng mô tả sai (QC đã sửa)
- **Dòng "Hủy đơn… App không tự tạo yêu cầu hoàn tiền":**
  - Câu này sai với trường hợp thường gặp: hủy đơn có cọc thì app tự tạo yêu cầu hoàn theo chính sách hủy (`reservations.service.ts:2477-2490`).
  - KB8 lại hướng dẫn INV vào "Hoàn tiền" để xử lý yêu cầu đó, nên hai tài liệu mâu thuẫn nhau.
  - S4-06 chỉ nói về **phần tiền khách trả thêm ngoài cọc** (BR-522, bổ sung 17/10).
- **Dòng "dòng dịch vụ… lễ tân đảo tay":**
  - Desk không có thao tác đảo hay điều chỉnh dòng: admin-web không gọi `adjustFolioLine`, xem S4-27*.
  - Desk chỉ thêm được dịch vụ khi khách đang ở (`ReservationDrawer.tsx:446`), mà đơn đang ở thì không hủy được.
  - Vì vậy trường hợp này không xảy ra từ Desk.
- **Hai dòng FOC tiền phòng (S4-01, S4-18):** INV không thể gặp trong demo, vì Desk chưa xin được FOC trên tiền phòng. QC đã gộp vào một dòng "không gặp trong demo".

### QC-S3-03 – Làm S4-25* (xin FOC ngoài bước nhận phòng) sẽ đưa lỗi FOC S4-02/S4-18 lên đường dùng hằng ngày
- **Mức:** Major (rủi ro sai tiền ở Sprint 4).
- **Vai sửa:** BE-B (+ BE-A), DOM, FE, QA.
- **Vị trí:**
  - Hiện nay lỗi FOC chỉ với tới qua API, vì Desk chỉ xin FOC phụ thu nhận sớm (`CheckInPage.tsx:234`).
  - `stay-support.ts:515-575` (`replaceLateCharge`): mỗi lần hẹn lại giờ trả (B15), gia hạn (B13) hay trả phòng, hàm này đảo dòng phụ thu trả muộn. Sau đó nó chỉ mang theo FOC **đã duyệt**, với số tiền min(FOC hiện có, số mới).
- **Hậu quả khi S4-25* cho xin FOC trên phụ thu trả muộn:** nhiều khả năng gặp đúng lớp lỗi S4-02 và S4-18 trên một thao tác lễ tân làm hằng ngày, là khách đổi giờ trả.
  - Phụ thu về 0 (khách đổi về giờ trong ân hạn) rồi lại tăng: FOC đã đảo theo dòng cũ nên không được mang sang. FOC mất, khách trả thừa.
  - FOC đang chờ duyệt mà dòng bị đảo: cơ chế giống S4-18. Khi duyệt, FOC có thể thành `rejected`, trong khi hạn mức tháng vẫn bị trừ. QC chưa chạy thử ca này; QA kiểm bằng ca test ở dưới.
- **Đề xuất:**
  - Chỉ phát hành S4-25* khi S4-02 và S4-18 đã sửa **chung cho mọi loại dòng**: phòng, phụ thu người, trả muộn, phát sinh, minibar.
  - DOM chốt quy tắc FOC khi dòng trả muộn bị đặt lại.
  - QA viết các ca: FOC chờ duyệt rồi đổi giờ; FOC đã duyệt rồi đổi giờ 15:00 → 12:30 → 15:00; FOC rồi gia hạn (B13).

### QC-S3-04 – TC-L3-011: `test.fail()` gọi giữa ca nên che lỗi thật của lượt chạy đầu
- **Mức:** P3 (hạ tầng test).
- **Vai sửa:** QA (mở rộng S4-24).
- **Vị trí:**
  - `e2e/clock/checkin.s3.clock.spec.ts`: `test.fail(...)` (BUG-R2-038) nằm khoảng 60 dòng sau đầu ca TC-L3-011 (`:773`).
  - Log CI 38998735861: lượt 1 ✘ (#1784), chạy lại ✘ (#1785).
- **Cơ chế:** chỉ có thể chạy lại nếu lượt 1 hỏng **trước** khi tới `test.fail`. Đó là một lỗi ngoài dự kiến. Đến lượt 2 thì ca tới được `test.fail`, và Playwright tính kết quả theo `expectedStatus` cuối cùng. Vì vậy cả ca được báo là "đúng dự kiến", không ghi flaky. Lỗi thật ở các bước nhận sớm phía trước bị giấu đi.
- **Đề xuất:**
  - Tách bước BUG-R2-038 thành một ca riêng, chỉ chứa bước lỗi.
  - Cho CI báo đỏ khi một ca có annotation BUG bị chạy lại.
  - Đọc trace hoặc junit của run này để tìm lỗi của lượt 1.

### Ghi chú nhỏ (không thành điều kiện riêng)
- **QC-S3-05:** câu "9/9 job xanh" trong báo cáo cần sửa thành "7 job xanh, 2 job bỏ qua vì chưa có staging" (K1).
- **QC-S3-06:** BUG-R2-053 vẫn đang ở trạng thái Fixed, đã đủ bằng chứng để đóng (K2).
- **QC-S3-07:** BR-429 (đổi căn trước khi đến) không có TC nào tham chiếu, trong khi S4-07 và ESC-019 đều dựa vào quy tắc này. QA thêm TC ở Sprint 4.

## 6. Điều kiện kèm theo

| # | Điều kiện | Vai | Hạn | Cách xác nhận |
|---|---|---|---|---|
| ĐK-S3-1 | Ngay trước khi gửi INV: chạy `./product/infra/demo/demo-up.sh --smoke` từ HEAD. Hoặc xác nhận rằng stack đang chạy (`adc0a47`, dựng 10:53) đã qua smoke. Ghi commit, giờ, kết quả vào `outputs/OPS/demo-1.md` mục 6, rồi gửi INV câu "XONG". Smoke sẽ đổi mật khẩu và link, nên chạy **trước** khi INV mở tệp tài khoản | OPS | Trước khi gửi demo cho INV (17/10) | Có dòng smoke ĐẠT với commit ≥ `adc0a47` trong `demo-1.md` |
| ĐK-S3-2 | **ORC** sửa `demo-1-limits.md` mục B theo PO (`s3-acceptance.md` mục 6):<br>• bỏ dòng "Gửi link check-in online", vì đã có;<br>• tách dòng "[PO xác nhận]": ghi công nợ và xin miễn phí trên phát sinh, trả muộn, minibar → Sprint 4; trả phòng sớm → Sprint 4 nếu kịp, không thì R3; quét QR CCCD → R3.<br>**UXR** sửa `demo-1-guide.md` KB3 bước 2: bỏ "(đính 1 ảnh)" (QC-S3-01) | ORC, UXR | Trước khi gửi demo cho INV (17/10) | Không còn ô "[PO …]" trong limits. KB3 không bảo đính ảnh |
| ĐK-S3-3 | `qa/bug-list.md`:<br>• đóng BUG-R2-053;<br>• ghi PO-S3-04 (chuỗi `sale.qr_after` hứa QR mà không có) và PO-S3-07 (`guest.id_doc_last4` không được ghi), mức P3;<br>• ghi QC-S3-04 (P3).<br>Thêm TC cho BR-429 (QC-S3-07) | QA | Trước khi giao việc Sprint 4 | Bảng tổng của bug-list khớp từng dòng; `gen_traceability` không còn "BR unref: BR-429" |
| ĐK-S3-4 | `s4-carryover.md`:<br>• thêm S4-25…S4-33 (đề nghị của PO);<br>• thêm mục QC-S3-03 (S4-25* chỉ phát hành cùng S4-02/S4-18 sửa cho mọi loại dòng);<br>• mở rộng S4-24 với QC-S3-04.<br>Thứ tự tuần đầu Sprint 4: S4-28 → S4-07, S4-05 → S4-02/18 (tổng quát) → S4-25 | ORC | Trước khi giao việc Sprint 4 | QC đối chiếu `s4-carryover.md` |
| ĐK-S3-5 | SEC và DOM ghi "Verified" (hoặc mở lại) cho các thẻ Blocker/Major Sprint 3 của mình trên `6af7173`, trong `s3-SEC.md` và `s3-DOM.md`. Được dựa vào các báo cáo kiểm chứng `s3-*verification*.md`. SEC-OPS-03 ghi "chờ smoke staging" và đóng sau smoke. DOM chốt quy tắc FOC cho B12 (S4-22) và cho dòng trả muộn bị đặt lại (QC-S3-03) | SEC, DOM | Trước lần deploy staging đầu tiên và trước cổng QC Sprint 4 | Có dòng Verified trong 2 file review; có dòng DOM trong decision-log |
| ĐK-S3-6 | Sửa xong mọi mục sai tiền đã dời: S4-07, S4-05, S4-02 (mở rộng), S4-18 (mở rộng), S4-22, S4-06, S4-08, S4-01/03. Mỗi mục có test đọc `br-examples.json`, rồi chạy kiểm chứng đối kháng lại phần FOC. **Không mở thêm nút xin FOC nào trên Desk trước khi S4-02/S4-18 xong** (QC-S3-03) | BE-A, BE-B, QA (DOM ví dụ) | Trước cổng QC Sprint 4. Còn sót mục nào thì cổng cuối Round 2 KHÔNG ĐẠT (sai tiền) | Ca mới xanh trên CI; có báo cáo kiểm chứng của Sprint 4 |
| ĐK-S3-7 | Viết một E2E **liền mạch cho A1**: báo giá → giữ chỗ → cọc VietQR → xác nhận → check-in online → nhận phòng → gia hạn + phát sinh → trả phòng 3 bước + FOC có duyệt → bill → VietQR → hoàn tất → `VD` + việc dọn. Khi Sprint 4 xong thì nối thêm bước dọn và kiểm trên PWA → `VI`. Số tiền đọc từ oracle. Không có `test.fail` giữa chuỗi. Sửa luôn TC-L3-011 (QC-S3-04) | QA (FE, BE hỗ trợ) | Trước cổng QC Sprint 4 | Ca chạy xanh trong CI |
| ĐK-S3-8 | Khi INV gửi VPS và tên miền, cần làm đủ:<br>• OPS deploy qua CI, job `deploy staging` = success;<br>• SEC smoke Caddy (SEC-OPS-03);<br>• QA kiểm S4-15/S4-17 qua Caddy thật;<br>• QA chạy A1 phần Sprint 3 trên staging, có ghi hình;<br>• PO kiểm lại giao diện (N3-5).<br>ORC ghi vào lần báo INV tới **ngày chậm nhất cần VPS**: trước khi Sprint 4 kết thúc | ORC, OPS, SEC, QA, PO | Ngay khi có VPS; chậm nhất trước giai đoạn Ổn định cuối Round 2 | Run CI có `deploy staging` success; có báo cáo QA chạy trên staging |

Nếu tới cổng QC Sprint 4 mà vẫn còn một trong hai tình huống sau thì QC chấm Sprint 4 **KHÔNG ĐẠT** ở mục tiền:
- S4-07 hoặc S4-05 chưa sửa;
- S4-25* đã phát hành mà S4-02/S4-18 chưa được sửa tổng quát.

## 7. Hạng mục trượt và vai chịu trách nhiệm
- **Staging (K7, K8):** INV cấp VPS và tên miền; sau đó OPS deploy, ORC theo dõi.
- **A1 trên giao diện:** VietQR cọc (S4-28*, FE); xin FOC ở bước trả phòng (S4-25*, FE + BE-B, kèm QC-S3-03); dọn và kiểm trên PWA (EP07, MOB + BE).
- **10 story Accepted một phần:**
  - FE: S4-26…S4-30 (ghi công nợ, điều chỉnh dòng và đảo giao dịch, xem bill, ảnh biên nhận);
  - BE-A + FE: S4-31 (thẻ "khách trả phòng hôm nay");
  - BE-C: S4-11/32 (khớp hồ sơ theo giấy tờ, 4 số cuối);
  - BE-A + ARC: S4-10 (0.3.7);
  - QA: S4-33 (ca còn thiếu).
- **Sai tiền ở đường hiếm:** BE-A, BE-B; DOM chốt quy tắc.
- **Tài liệu demo:** UXR, ORC (ĐK-S3-2). OPS (ĐK-S3-1).

## 8. Rủi ro mang sang Sprint 4
1. **Sprint 4 quá tải.** Việc vốn có là EP07, EP08, EP01, phần còn lại của EP14 và US-066. Cộng thêm 24 mục carry-over, 9 mục PO đề nghị và các điều kiện ở đây. Nếu phải đẩy phần Must nào sang R3 thì đó là đổi phạm vi: PO lập ESC. ORC nên chốt sớm thứ tự cắt.
2. **FOC là vùng dễ hỏng.** Đã qua 8 vòng sửa, và vòng 6, vòng 7 từng làm hỏng lại chỗ đã đúng. Mọi thay đổi FOC ở Sprint 4 (S4-01/02/18/22, S4-25*) phải qua kiểm chứng đối kháng trên PostgreSQL thật, như vòng 4–8.
3. **Vẫn chưa có staging.** Nhóm A và B5 của cổng cuối Round 2 sẽ không đạt. Upload qua Caddy thật (S4-15, S4-17) và SEC-OPS-03 cũng chưa được kiểm.
4. **Test chập chờn có thể che hồi quy:**
   - TC-L3-013: số điện thoại sinh ngẫu nhiên bị trùng;
   - TC-L3-011: lượt chạy lại che lỗi (QC-S3-04);
   - bảng `dev_clock` dùng chung giữa các tệp test (S4-20);
   - TC-L2-057: lỗi `CONCURRENT_UPDATE` ngay sau khi giữ chỗ.
5. **Đổi hợp đồng 0.3.7** (`checkIn.payment`, BUG-R2-038; trường mới cho B14 ở S4-09). Phải đi qua ARC → BE-A → FE → QA trong cùng sprint; dễ lệch giữa các bên.
6. **Chưa thử thiết bị thật.** Check-in online chưa chạy trên iPhone/Android: camera, HEIC, ảnh 48 MP, mạng yếu.
7. **Nâng thư viện (S4-16).** Gộp các PR Dependabot nhỏ sau cổng này thì phải chạy lại CI đầy đủ. Nâng React 19 và Vite 8 để sang R3.
8. **Pháp lý và chính sách còn chờ.** ESC-001 (luật sư, trước khi có dữ liệu khách thật); ESC-019 (giá khi đổi căn trước ngày đến); câu pháp lý tiếng Nga đang dùng bản EN.

## 9. Rủi ro chủ đầu tư cần biết (ORC đưa vào round-summary, không cần ESC mới)
- Phần nhận phòng, trả phòng, bill, thu tiền và giấy tờ khách đã chạy đúng trên hệ thống kiểm tra tự động. Anh/chị bấm thử được ngay trên máy Mac, với dữ liệu giả.
- **Vẫn chưa có máy chủ chạy thử.** Nếu anh/chị chưa gửi VPS và tên miền trước khi Sprint 4 kết thúc, cổng QC cuối Round 2 sẽ không đạt ở phần "chạy trên môi trường thật". Lễ tân và buồng phòng cũng chưa thử được bằng điện thoại của họ.
- Đội đã biết một số trường hợp hiếm làm lệch tiền: đổi căn trước ngày đến khi căn mới có định mức người khác, và đơn OTA đổi phòng nhiều lần. Các lỗi này phải sửa xong trong Sprint 4, trước khi Round 2 kết thúc. Khi demo, nếu dời căn thì anh/chị nên xem lại phiếu thanh toán.

## 10. Kết luận cho demo lần 1
**Có.** Anh/chị bấm thử được ngay sau cổng này, khi xong 2 việc nhỏ trước lúc gửi:
1. **ĐK-S3-1:** OPS xác nhận smoke trên bản đang chạy, hoặc dựng lại rồi chạy smoke.
2. **ĐK-S3-2:** ORC sửa mục B, UXR sửa KB3 bước 2.

Mục C đã được QC sửa. Lưu ý khi thử:
- chỉ dùng dữ liệu giả;
- chỉ quét QR để xem, không chuyển tiền;
- thử trong ngày 17/10, trước khoảng 15:53 vì giữ chỗ D5 hết hạn lúc đó; thử muộn hơn thì chạy `demo-reset.sh` trước.

Buổi này **không thay** cho việc chạy A1 trên staging và thử với nhân viên thật.

## 11. QC không kiểm được
- **Không đăng nhập bản demo hay đi qua giao diện bằng trình duyệt.** Phiên này không có yêu cầu trực tiếp từ chủ đầu tư để dùng tài khoản demo. Trạng thái demo chỉ được kiểm bằng probe chỉ đọc: `/health`, các cổng, biến môi trường, `/__test__`.
- **Không chạy lại stack, E2E hay bộ api.** Số liệu lấy từ log CI 38998735861 (QC tự đọc log job E2E và job test) và từ các báo cáo QA/kiểm chứng.
- **Không tìm ra lỗi ở lượt 1 của TC-L3-011.** Muốn biết phải tải artifact của run, mà QC không tải.
- **Không kiểm:** thiết bị thật, VoiceOver, hiệu năng p95, Caddy prod với tên miền thật.
