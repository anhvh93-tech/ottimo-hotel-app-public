# Báo cáo MOB – Round 2, Sprint 4, bước Sản xuất

- Người viết: MOB | Ngày: 17/10/2026 | Đầu vào: `sprint-4-plan.md` (ĐÓNG BĂNG D1) mục 8.3 dòng MOB, 11; ADR-005; hi-fi H19–H23; DS v0.4.1 mục 6.18, 6.19, 11; CLAUDE.md "Thương hiệu OTTIMO"; OpenAPI 0.3.7; backlog US-052…058, US-108…112; tin ORC giữa phiên (dùng `roomLabel()` chung của `@ottimo/i18n`).
- Trạng thái: **xong mục 1 (B0 + B1), PWA H19 + H20 (và H21, H22 phần chính), guest-web H23** (đợt 1); **đợt 2 (mục 6)**: H22.5 phiếu + khóa phòng, ảnh lúc báo, hộp thông báo + SSE, 0.3.7 bổ sung 1 (#10, #12, #13), thẻ UXD MOB-S4-01 – xong mọi mục không phụ thuộc API; còn minibar H20.4 chờ BE-D giao US-066. Không commit (ORC commit). Không đụng demo stack (thử giao diện bằng dev server riêng cổng 5274/5275 và Chromium không giao diện, đã tắt).

## 1. Đã làm gì

### 1.1 B0 + B1 cùng một bản build (S4-49, G5)
- PWA và guest-web cùng import `@ottimo/ui/styles.css` → token DS v0.4.1 (B0) và font tự host Lora 500/600, Be Vietnam Pro 400/500/600, **JetBrains Mono 400/500** (B1) vào **cùng bản build**. Phần `@fontsource/jetbrains-mono` trong `packages/ui` do FE-B thêm (cùng lúc); MOB không sửa gói chung.
- Đã kiểm trên bản build thật: các tệp `jetbrains-mono-*.woff2`, `lora-*.woff2`, `be-vietnam-pro-*.woff2` nằm trong `dist/assets`, **0 yêu cầu font ra tên miền ngoài** (`bundle.test.ts` của PWA kiểm mỗi lần test). Trình duyệt không giao diện xác nhận JetBrains Mono đã tải trên guest-web (Wi-Fi, mã đặt phòng) và trên PWA (mã phiếu sửa).
- G5: Wi-Fi (tên mạng, mật khẩu) và mã đặt phòng trên guest-web dùng `.gw-code` = JetBrains Mono **16 px**, giãn 0,02em, không ngắt dòng; mã phiếu sửa trên PWA cũng 16 px.
- G6: guest-web chỉ chế độ sáng (`<html lang="en" data-theme="light">`).

### 1.2 PWA "OTTIMO Staff" (`product/apps/mobile`, thư mục ADR-005 chọn)
| Màn | Story | Đã có |
|---|---|---|
| Đăng nhập theo vai | US-001 | HK → "Việc của tôi"; MT → "Phiếu sửa"; FD/FDL/MGR/OWN → màn buồng phòng (họ kiểm phòng – H19 ghi "FDL/FD xem cùng dữ liệu"); SAL/CTV → "Bạn không có quyền mở trang này". Lỗi chung một câu (không lộ sai tên hay sai mật khẩu), 429, offline |
| **H19** Việc của tôi | US-052, US-054 | Nhóm "Làm trước – có khách đến hôm nay" / "Khách đang ở" / "Sau khi khách trả phòng" / "Đã xong (n)"; thứ tự trong nhóm = `priorityRank` server (AC4); bộ đếm x/y; chip "App khách" + lời khách nhắn (chỉ khi online); bộ đồ dùng thêm (chuẩn bị/thu hồi/chuyển); "Chờ khách trả phòng" khóa; thẻ "401 / The Pine" |
| **H19** Các căn | US-052 | 10 căn, trạng thái bằng câu thường + icon + màu (không mã VC/VD), khách đến kế tiếp, tên gọi khách chỉ căn có việc hôm nay; lọc Tất cả / Cần dọn (VD, OD, CL) / Có khách / Sạch / Đang sửa; không cuộn ngang ở 360 px (đo: 0 px) |
| **H20** Màn căn | US-053 | Nút = `allowedEvents` server: Bắt đầu dọn → Dọn xong → Kiểm phòng; ghim đáy 56 px; câu hậu quả "Dọn xong" (căn trống / có khách); "Báo sự cố căn này"; thông báo tại chỗ khi server từ chối |
| **H20** Hoàn tác 10 giây | DS 6.18, ADR-005 | Toast "Căn 202 · The Valley: Đang dọn  [Hoàn tác (n)]", đếm lùi, **dừng đếm khi focus nút** (WCAG 2.2.1); Hoàn tác = xóa khỏi hàng đợi, **không gọi API** (test xác nhận 0 request); hết 10 giây mới gửi, `performedAt` = giờ bấm, `Idempotency-Key` sinh lúc bấm; hết giờ khi mất mạng → "Đã lưu trên máy – sẽ tự gửi khi có mạng" |
| **H20** Khách không muốn dọn | SM-14 | Lý do bắt buộc (Treo biển / Khách nói không cần / Lý do khác + ghi chú) → `cancel` với `cancelReasonCode` (`dnd`/`guest_refused`/`other`) |
| **H20.3** Kiểm phòng | US-055, BR-808 | Checklist từ `getInspectionChecklist(roomId)` (có mục động bộ đồ dùng thêm); "Kiểm đạt" khóa tới khi tick đủ và có ảnh phòng (khi server yêu cầu – HK tự kiểm); "Chưa đạt" bắt buộc ghi chỗ chưa đạt, ghi vào từng mục không đạt; gửi qua hàng đợi (hoàn tác 10 giây) |
| **H21** Báo sự cố | US-057 | Chọn căn, 6 loại nhanh (gợi ý mức BR-809), mô tả bắt buộc (US-061 AC4), ≤ 3 ảnh nén ≤ 300 KB trên máy, mức Gấp/Trong ngày/Không gấp có câu giải thích, "Đề nghị khóa căn" (`blockRequested`, không bao giờ gửi `block` – A86). Online: ảnh rồi phiếu, hiện mã server; offline: ảnh + phiếu vào hàng đợi (ảnh trước), màn "Đã lưu trên máy – chưa gửi" trung thực |
| **H21.3** Thao tác trên máy | US-058 (NÊN) | "Đang chờ gửi (n)" + "Cần xem lại (n)" kèm lý do theo mã (`INVALID_TRANSITION` + trạng thái hiện tại, việc bị hủy vì đơn đổi, `PERFORMED_AT_OUT_OF_RANGE`, `CHECKLIST_OUTDATED`, mã khác), "Đã hiểu", "Gửi ngay", "hệ thống bận – sẽ tự gửi lại" |
| Banner mất mạng + đọc offline | ADR-005 | Banner vàng đầu mọi màn + nút "n thao tác đang chờ gửi"; danh sách việc/căn/checklist/phiếu đọc từ IndexedDB, dòng "Dữ liệu lúc hh:mm"; mở app khi mất mạng dùng hồ sơ đã lưu |
| **H22** Phiếu sửa (bản kỹ thuật) | US-061, US-062 | Danh sách: Quá hạn → Gấp → hạn gần nhất; mức (chữ + icon + viền trái), trạng thái, hạn kế tiếp bằng câu ("Nhận việc trước 19:50 – còn 5 phút", "Có phương án trước…", "Hạn tạm dừng – vật tư dự kiến…"), "Đang khóa – mở bán lại …"; lọc Đang mở / Gấp / Chờ vật tư. Chi tiết: nhật ký `history[]`, Nhận việc, Chờ vật tư (ghi chú + ngày dự kiến bắt buộc với Trong ngày/Không gấp), Sửa tiếp, Sửa xong (kết quả + ảnh bắt buộc với Gấp/Trong ngày, hộp hậu quả khi có khối OOO, trạng thái trung thực "Đang mở bán lại…" → "Đã mở bán lại căn …"). Chỉ online, `If-Match` = `version` |
| Tôi | – | Tên, vai, cơ sở; ngôn ngữ **VI/EN**; "Thao tác trên máy"; Đăng xuất (cảnh báo nếu còn thao tác chưa gửi, rồi xóa IndexedDB + Cache Storage – SR-PWA-04) |

- **Không có dữ liệu C3, không tiền** (ADR-005 mục 6, SR-DEV-09): mã nguồn không gọi `…/sensitive`, `door-credential`, giấy tờ, folio, thanh toán, hoàn tiền, step-up, duyệt – `guard.test.ts` quét mỗi lần test. `Me.deviceTrusted` luôn false với PWA.
- **Tên phòng (BR-012):** dùng **`roomLabel()` chung của `@ottimo/i18n`** (FE-B) theo tin ORC – nhân viên thấy "401 · The Pine", số căn to + tên dưới (DS 11.3), `aria-label` "Căn 401, The Pine". Hàm riêng của MOB đã bỏ; `src/app/rooms.ts` chỉ đổi tên trường `roomName` → `name` (không dựng chữ). Sắp xếp căn bằng `compareRoomNo()` chung.
- **Lưu trên máy (SR-PWA-01…07):** chỉ IndexedDB, 3 kho `snapshot` / `queue` / `blobs`; bản sao dựng **từng trường theo danh sách cho phép** (không ghi chú tự do của khách, không tên khách đến kế tiếp, không "lưu ý phục vụ", phiếu sửa không mô tả/ảnh/nhật ký; hồ sơ người dùng không có CSRF); không `localStorage`/`sessionStorage` cho dữ liệu. Service worker chỉ cache vỏ app (`/v1/*` không bao giờ vào cache), tên cache theo mã build.
- **Ngân sách tải đầu** (ADR-005 ≤ 180 KB gzip): JS 79 KB + CSS 28,5 KB ≈ **108 KB gzip**; bundle chỉ mang khóa chuỗi mã nguồn gọi (`scripts/used-keys.ts`, cùng cách guest-web).
- **Dựng trên MSW theo 0.3.7** (`src/mocks/handlers.ts`): quy tắc hợp đồng được mô phỏng – `expectedFrom` → 409 `INVALID_TRANSITION` + `currentState`, khoảng `performedAt` → 422, `CHECKLIST_OUTDATED`, `If-Match` → 412, phát lại `Idempotency-Key`, CSRF, phân vai. `pnpm dev:server` chuyển sang API thật khi BE-C giao module.

### 1.3 guest-web H23 (`product/apps/guest-web`)
- **Tab "Yêu cầu" (US-109):** danh sách SM-15 (Đã gửi · Đã nhận · Đang xử lý · Hoàn thành · Không thực hiện được), chip theo DS 2.3 (`ink` cho đã nhận/đang xử lý), giờ gửi theo giờ cơ sở, lời khách nguyên văn, dòng phí "Phí 100.000 đ – thanh toán khi trả phòng." (không chữ "hóa đơn" – SEC ĐK-6), lý do từ chối theo mã `declinedReasonCode` + lời nhắn lễ tân (`lang="vi"`), trả lời tự động; làm mới 30 giây khi trang đang hiện. Gửi yêu cầu: 6 ô loại (2 cột ở 360 px), phí **do server tính** (`listGuestRequestOptions`, ESC-016 A: dọn bù miễn phí / dọn đầy đủ lần hai kèm giờ đã dọn / dài hạn mỗi lần), loại có phí bắt buộc tick đồng ý mới mở nút Gửi (lý do khóa đọc được), ngoài giờ trực [07:00, 22:00) báo trước + nút gọi người trực, loại chưa dùng được kèm lý do; lỗi `FEE_NOT_ACCEPTED` (tải lại phí, hỏi lại), `REQUEST_TYPE_NOT_AVAILABLE`, `CARD_NUMBER_DETECTED`, 429 (gọi lễ tân kèm số). **Mất mạng không xếp hàng** trên máy khách (DS 6.19) – nút báo "Cần có mạng để gửi yêu cầu".
- **Tab "Thông tin" (US-108 AC1 + AC2 phần Wi-Fi):** Wi-Fi (từ ngày nhận phòng, JetBrains Mono 16 px, nút sao chép), giờ nhận/trả chuẩn, địa chỉ + "Chỉ đường" mở **ghim INV gửi 17/10** (`https://maps.app.goo.gl/oYos42G5YvUEcDCc6`, lấy từ `property.mapUrl` – BE-D đặt làm mặc định tham số `property_map_url`; chỉ mở khi bấm, không nhúng; host trong danh sách cho phép E14-08), nội quy + phí phạt (văn bản server theo ngôn ngữ phiên), "Cần giúp? Người trực đêm" + gọi. Không mã cửa (ĐK-6).
- **Khách chỉ thấy tên phòng (BR-012):** `roomNo` bị bỏ khỏi bộ lọc mức 1 (`pickStayLevel1`, `pickSession`) kể cả khi server cũ còn gửi; hiển thị qua `roomLabel(…, 'guest')` chung: "The Bloom" (Lora 500 20 px, `lang="en"`) + hạng phòng công khai dưới; đơn chưa báo căn (`roomName` null) → hạng phòng. Test xác nhận trang không có số căn.
- **EN đủ (US-112) và mặc định EN (P-S4-10):** `browserLocale()`: `vi*` → VI, `ru*` → RU, **còn lại → EN** (trước: còn lại → VI); ngôn ngữ của phiên (khách đã chọn / hồ sơ) vẫn thắng. Mọi chữ mới có EN; test luồng yêu cầu bằng EN không còn chữ VI cố định.
- **Giọng thương hiệu (DS 11.2, G2–G4):** lời chào là khoảnh khắc thương hiệu **tiếng Anh ở mọi ngôn ngữ** – H2 "Welcome to OTTIMO, Anna." (`lang="en"`, Lora) + dòng hỗ trợ Stone (trang VI/RU: ngôn ngữ trang; trang EN: bản VI "Chúc bạn có một kỳ nghỉ an yên."); bỏ "!" – `guest.oci.done_title` theo bản UXD DS 11.2.2 ("You're all set. See you on {date}." / "Thủ tục đã xong. Hẹn gặp bạn ngày {date}."). Test EN kiểm không còn "!" trên trang.

### 1.4 Chuỗi (tệp dùng chung `gen_strings.py`)
Đọc lại ngay trước khi sửa (FE-A, FE-B vừa thêm nhóm), thêm **2 nhóm riêng** trước `TEMPLATES`, chạy lại `gen_strings.py` (2512 chuỗi):
- "R2 Sprint 4 – MOB: PWA OTTIMO Staff (H19–H22)": 26 khóa – các khóa "(mới)" của đặc tả EP07-08 8.1–8.3 (`hk.data_as_of`, `hk.chip.queued`, `hk.queue_full`, `hk.queue_logout_warn`), lý do từ chối (`hk.queue.too_old`, `hk.queue.checklist_outdated`, `hk.queue.rejected_other`), `hk.task.complete`, toast, ảnh, nhật ký phiếu `wo.log.*` theo `history[].change`, `staff.*`.
- "R2 Sprint 4 – MOB: guest-web giọng thương hiệu + H23": `gw.welcome_title`, `gw.welcome_sub`, `gw.room_label`, `guest.oci.done_title` (chép nguyên bản UXD DS 11.2.2), `gw.welcome_title_plain` (mới), 3 lý do từ chối theo enum 0.3.7, `gw.req.paid_limit`, `gw.req.note_label`. RU: chỉ nháp cho 5 khóa brand (cần người bản ngữ duyệt).
- **Tất cả chuỗi mới cần UXD duyệt** (ghi trong tên nhóm).

### 1.5 Kiểm thử
- PWA: **61 test** (6 tệp) – `queue.test.ts` (hoàn tác không gọi API, gửi sau 10 giây với `performedAt` lúc bấm, dừng đếm khi focus, FIFO + lùi dần, đã áp dụng, Cần xem lại, 422, 503 + `Retry-After`, 401 tạm dừng, ảnh trước phiếu, ảnh bị từ chối không chặn phiếu, giới hạn, bền qua đóng app); `cache.test.ts` (dump IndexedDB thật qua fake-indexeddb sau một ca giả: chỉ khóa cho phép, không ghi chú khách, SĐT, CSRF, tên khách đến kế tiếp; đổi người xóa sạch); `flow.test.tsx` (20 luồng RTL + MSW trong StrictMode: đăng nhập 4 vai, H19 nhóm/bộ đếm/không mã trạng thái, lọc "Cần dọn", hoàn tác, gửi sau 10 giây, offline → hàng đợi → online, từ chối → Cần xem lại, khách không muốn dọn, kiểm đạt/chưa đạt, báo sự cố online/offline/thiếu mô tả, bảo trì nhận việc + sửa xong mở bán lại, đăng xuất xóa dữ liệu, giao diện EN); `units.test.ts`; `guard.test.ts`; `bundle.test.ts` (build production: ≤ 180 KB, font tự host, không mock, SW gắn mã build, chỉ khóa chuỗi được gọi).
- guest-web: **61 test** (trước 50) – thêm `requests.test.tsx` (10 ca H23, EN mặc định, RU, không số căn); sửa ca cũ theo lời chào mới, Wi-Fi mono, ghim bản đồ INV.
- Typecheck xanh: mobile, guest-web, admin-web, `@ottimo/i18n`, `@ottimo/ui`. Test admin-web 289/289, `@ottimo/i18n` 19/19 (sau khi sinh lại chuỗi). ESLint 0 lỗi, Prettier sạch trên 2 app.
- Xem bằng Chromium không giao diện (390×844, 360×800) trên dev server riêng: H19, H20 + toast, H20.3, H21, offline, H22 danh sách + chi tiết, guest-web Lưu trú / Yêu cầu. Sửa từ lượt xem: lỗi StrictMode làm danh sách đứng ở "Đang tải…" (cờ `alive`), lỗi StrictMode làm tiêu đề bị focus khi mở trang (cả guest-web S3), thân trang thành khung cuộn riêng (`overflow` của hifi.css), toast che nút chính, chip trạng thái chật tiêu đề, nút đáy không đầy chiều ngang.

## 2. File đã tạo / sửa
**Tạo:** `product/apps/mobile/README.md`, `public/sw.js`, `public/mockServiceWorker.js` (MSW, chỉ dev – build xóa), `scripts/used-keys.ts`, `src/styles.css`, `src/vite-env.d.ts`, `src/app/{actions,api,config,data,image,overlay,rooms,router,session,tasks,time,useOnline,workOrders}.ts(x)`, `src/data/{store,cache}.ts`, `src/queue/{queue,QueueProvider,messages}.ts(x)`, `src/ui/{parts,PhotoPicker}.tsx`, `src/pages/{Login,Tasks,Rooms,Room,Inspection,Report,Queue,Me,WorkOrders,WorkOrder}Page.tsx`, `src/mocks/{handlers,browser,node}.ts`, `src/test/setup.ts`, `src/__tests__/{queue,cache,units,flow,guard,bundle}.test.ts(x)`; `product/apps/guest-web/src/pages/RequestsPage.tsx`, `src/__tests__/requests.test.tsx`.
**Sửa:** `product/apps/mobile/{package.json,index.html,tsconfig.json,vite.config.ts,public/manifest.webmanifest,src/App.tsx,src/main.tsx}` (xóa `src/App.test.tsx` khung R1); `product/apps/guest-web/{index.html,README.md,src/app/api.ts,src/app/i18n.tsx,src/mocks/handlers.ts,src/pages/GuestShell.tsx,src/pages/HomePage.tsx,src/pages/InfoPage.tsx,src/pages/WifiBlock.tsx,src/styles.css,src/__tests__/{flow,states}.test.tsx,src/__tests__/units.test.ts}`; `product/design/tools/gen_strings.py` (2 nhóm mới) → sinh lại `product/design/copy/strings-{vi,en,ru}.json`, `design/tools/strings-tables.md`, `design/wireframes/assets/strings.js`; `product/pnpm-lock.yaml` (deps của `@ottimo/mobile`); `01-decisions/decision-log.md` (1 dòng MOB).

## 3. Giả định
- [GIẢ ĐỊNH MOB] FD/FDL/MGR/OWN mở PWA thấy màn buồng phòng (để kiểm phòng); MT thấy "Các căn" chỉ xem.
- [GIẢ ĐỊNH MOB] "Kiểm đạt" cần tick **mọi** mục checklist (BR-808 coi cả checklist là điều kiện; mục tùy chọn không tick sẽ bị server coi là không đạt thiếu ghi chú).
- [GIẢ ĐỊNH MOB – theo SR-PWA-01] Ảnh kiểm phòng **không** xếp hàng offline (chỉ "ảnh sự cố" được phép, E07-12 chờ SEC) → bước ảnh kiểm phòng cần mạng; kiểm phòng không ảnh (FDL) vẫn xếp hàng được.
- [GIẢ ĐỊNH MOB] Giờ trực khách [07:00, 22:00) tính trên máy theo giờ cơ sở (BR-811) chỉ để báo trước; trả lời tự động của server là căn cứ.
- [GIẢ ĐỊNH MOB – UXD duyệt] `gw.welcome_title_plain` "Welcome to OTTIMO." khi phiên không có tên gọi; 3 câu lý do từ chối theo enum 0.3.7.
- Đơn chưa báo căn cho khách: dựa vào server trả `roomName: null` (0.3.7 mô tả `GuestStay.roomName`); guest-web không có cờ `roomDisclosedToGuest`.
- Mock: dữ liệu DS-0 rút gọn, tên phòng ánh xạ tạm BL 4.1 (P-S4-8); mật khẩu giả `change_me_mock_dev_only` theo mẫu đã cho phép trong `.github/gitleaks.toml`.

## 4. Rủi ro / vướng mắc – cần vai khác xử lý (không mở ESC)
1. **TC-L7-010 (E2E guest-web)**: lỗi đỏ hiện tại là **phía test**, không thấy lỗi guest-web: sau khi khách 1 tải ảnh xong, ô của khách 1 chỉ còn "Đã gửi" + "Gửi lại" (ĐK-3) nên `.nth(personIdx-1)` không còn nút "Chụp" của khách 2 – cây làm việc đã có bản sửa của QA chọn nút theo `aria-describedby~="gw-p{n}-name"`, guest-web có sẵn id này (MOB không đổi `DocumentsStep`). **Cần QA thêm cùng commit:** `guest-web.h18.spec.ts` dòng 101 và 213 đang tìm tiêu đề theo `guest.hello` ("Xin chào, …"/"Hello, …") – G2 đổi tiêu đề thành `gw.welcome_title` ("Welcome to OTTIMO, Anna.", mọi ngôn ngữ) → đổi thành `stem(EN['gw.welcome_title'])`. Ca "Xong!" (dòng 149) đọc từ từ điển nên tự theo chữ mới. MOB **không sửa test này** theo yêu cầu ORC.
2. **P-S4-10 khi đã có phiên (BE-D/ARC):** `GuestSession.locale` luôn có giá trị nên ngôn ngữ phiên luôn thắng trình duyệt; mặc định EN chỉ áp trước khi có phiên (trang link hết hạn, đang tải). Đề nghị BE-D: khi khách chưa chọn và hồ sơ không có ngôn ngữ, đặt `locale` phiên theo `Accept-Language` với cùng quy tắc (vi→vi, ru→ru, còn lại en); mock hiện trả `vi`.
3. **Nhãn checklist theo ngôn ngữ app (ARC/FE):** `getInspectionChecklist` dịch theo `Accept-Language`, nhưng `@ottimo/api-client` không cho đặt header → nhãn theo ngôn ngữ trình duyệt, không theo nút VI/EN của app. Đề nghị thêm tùy chọn `acceptLanguage` vào `RequestOptions`.
4. **Wi-Fi theo căn (DOM/INV, nhỏ):** hi-fi H23 có tên mạng "OTTIMO_103" – nếu Wi-Fi thật đặt theo số căn thì khách vẫn thấy số căn (BR-012). Mock dùng "OTTIMO-Guest".
5. **Lockfile:** `pnpm install` ghi cả importer `apps/landing-web` (thư mục FE-LP đang có trong cây, chưa commit) – ORC commit cùng FE-LP hoặc sinh lại lockfile lúc tích hợp.
6. **Icon PWA:** manifest chưa có icon (chờ logo SVG – B6/G7, INV hẹn 19/10) → Chrome Android có thể không hiện lời mời "Cài đặt"; "Thêm vào màn hình chính" vẫn dùng được.
7. Trình duyệt nhúng không chạy service worker của MSW → xem bản dev bằng Chrome/Safari.

## 5. Việc chưa xong
- H20.4 đếm minibar khi dọn phòng có khách (`recordMinibarCheck`) – chờ danh mục minibar (US-066, BE-B/FE-B).
- H22.5 tạo phiếu + khóa phòng bản kỹ thuật (online) – Desk của FE-B đã có form; bản PWA làm ở lượt sau.
- Ảnh "lúc báo" trong chi tiết phiếu (đã có `getAttachment`, chưa hiện), hộp thông báo trong app + SSE (`notification.created`), Background Sync mới đánh thức trang đang mở.
- Nối API thật khi BE-C giao module buồng phòng/bảo trì và BE-D giao EP14 (`pnpm dev:server`), chạy lại test luồng trên stack riêng của QA.
- Review chéo theo ma trận (UXD, QA; khuyến nghị ARC) và review bắt buộc của SEC cho PR PWA + guest-web yêu cầu khách (sprint-4-plan G2).

## 6. Đợt 2 (ORC 17/10 – làm tiếp sau báo cáo đợt 1)

### 6.1 Đã làm
| Việc | Kết quả |
|---|---|
| **H22.5 – phiếu mới + khóa phòng** (US-061, A86) | Màn "Báo sự cố" của bảo trì / lễ tân trở lên thành **"Phiếu sửa mới"** (nút ở đầu danh sách phiếu): thêm "Khóa căn – không bán đến khi sửa xong" → Khóa từ, Dự kiến xong, Lý do khóa (`block.expectedDoneDate` – ngày mở bán lại **server tính** theo BR-804, câu `wo.block_reopen_note`, hiện ngay sau khi lưu: "Đã khóa – ngừng bán trên mọi kênh" + `wo.block_info` từ `roomBlock` trả về – trạng thái trung thực HR-20). Khóa **chỉ online** (tồn phòng – ADR-005): mất mạng → nút "Cần có mạng". 409: `ROOM_OCCUPIED` (đổi phòng cho khách trước), `ROOM_UNAVAILABLE` (danh sách mã đơn + ngày, **không tên khách** – rbac D18), `ROOM_BLOCKED`; mỗi lỗi có nút "Tạo phiếu không khóa"; ảnh đã tải không tải lại khi gửi lại. Không đưa ô "quản lý đã có phương án": theo 0.3.5 A-03 ô này **không** gỡ được 409 nên vô ích trên PWA. Buồng phòng giữ "Đề nghị khóa căn" (`blockRequested`) như cũ |
| **Ảnh lúc báo** (H22 22.2) | `getAttachment` (C2, B-01) → object URL, thu hồi khi rời màn; không cache; ảnh đã xóa theo hạn (404) → ô "Chưa mở được ảnh"; mất mạng → "Cần có mạng" |
| **Hộp thông báo + SSE** (ADR-005 mục 4) | Chuông ở thanh trên mọi màn, số chưa đọc (`aria-label` "Thông báo, n chưa đọc"); màn Thông báo: câu theo `kind` (9 loại của HK/MT/FDL + câu chung "xem trên OTTIMO Desk" cho loại của Desk), mã tham chiếu riêng (số căn / mã phiếu – SR-PWA-06, không ghép câu), giờ; bấm = đánh dấu đã đọc (`markNotificationRead`) + mở phiếu / việc. Không lưu trên máy (không thuộc danh sách SR-PWA-01). **SSE** `streamEvents` một luồng mỗi phiên: `room.status_changed`, `hk_task.changed`, `guest_request.changed` → đọc lại việc + căn; `work_order.changed` → danh sách / chi tiết phiếu (chi tiết chỉ đọc lại khi không mở form, để `If-Match` vẫn bảo vệ); `notification.created` → hộp thư + câu báo `aria-live` không cướp focus. Gom sự kiện 300 ms; nối lại sau khi rớt → đọc lại hết; luồng đóng hẳn (404/chưa triển khai) → hỏi lại 60 giây; **không lọc theo vai ở client** (server lọc – 11.5 #1–4). Bản mock không có SSE → hỏi lại 60 giây |
| **0.3.7 bổ sung 1** | #10 `GuestRequest.roomNo` null – PWA không hiện `GuestRequest`, không phải sửa. #12 guest-web dùng `locale` server chọn, gửi `Accept-Language` theo quy tắc P-S4-10, trạng thái `localeChosenByGuest` (dòng gợi ý + mô tả ô chọn), mock mặc định **en** và giữ lựa chọn của khách. #13 PWA gửi `acceptLanguage` (nút VI/EN) cho `getInspectionChecklist`, `recordInspection` (kể cả từ hàng đợi) |
| **Review UXD** (`reviews/s4-UXD.md`) | MOB-S4-01 Done (khóa `guest.req.decline.<code>`); trả lời ở `responses/s4-MOB.md`; `guest.req.auto_reply` do server dựng – guest-web hiện nguyên `autoReply` |
| Sửa sau khi xem bằng Chromium không giao diện | Nút đáy không đầy chiều ngang (lưới kế thừa `justify-content: space-between` của `.wiz-foot`); lỗi từ chối khóa hiện dưới form → cuộn tới; ảnh mock hợp lệ |
| Chuỗi | Nhóm mới "R2 Sprint 4 – MOB đợt 2…" trong `gen_strings.py` (20 khóa: `staff.notif.*`, `staff.photo_load_error`, `staff.block_blocked_body`, `gw.lang_auto`, `gw.lang_chosen` – RU nháp) – chờ UXD duyệt; dùng lại khóa đã duyệt của FE-B (`wo.block_reopen_note`, `wo.block_reason`, `wo.create`, `wo.create_without_block`, `wo.block_conflict_dates`, `wo.block_blocked_title`) |

### 6.2 Kiểm thử đợt 2
- PWA **71/71** (7 tệp; +10 ca `s4b.test.tsx`: chuông + đánh dấu đã đọc + mở phiếu; SSE `notification.created` → tải lại + câu báo; SSE phòng/việc → một lần đọc lại, không hỏi lại khi luồng mở; loại của Desk; ảnh lúc báo + ảnh đã xóa; khóa phòng thành công với ngày server; đơn trùng (không lộ tên khách) → tạo không khóa; căn có khách + mất mạng; HK không thấy form khóa; nút EN → `Accept-Language: en` ở checklist và biên bản). Tách `__tests__/helpers.tsx` (đăng nhập qua App thật trong StrictMode, `FakeEventSource`).
- guest-web **63/63** (+2 ca ngôn ngữ phiên: `fr-FR` → en + gợi ý → chọn VI → mở lại link giữ VI; `ru-RU` → ru).
- `tsc` mobile, guest-web 0 lỗi; ESLint 0 lỗi; Prettier sạch. Lần tải đầu PWA ≈ **112 KB gzip** (83 + 29).

### 6.3 File đợt 2
**Tạo:** `product/apps/mobile/src/app/{live,notifications}.tsx`, `src/pages/NotificationsPage.tsx`, `src/ui/AttachmentPhotos.tsx`, `src/__tests__/{helpers.tsx,s4b.test.tsx}`; `rounds/round-02/responses/s4-MOB.md`.
**Sửa:** `product/apps/mobile/src/{App.tsx,styles.css,app/api.ts,app/actions.ts,app/data.tsx,app/router.ts,app/session.ts,queue/queue.ts,ui/parts.tsx,pages/ReportPage.tsx,pages/WorkOrdersPage.tsx,pages/WorkOrderPage.tsx,pages/InspectionPage.tsx,mocks/handlers.ts,test/setup.ts,__tests__/flow.test.tsx}`, `README.md`; `product/apps/guest-web/src/{App.tsx,app/api.ts,pages/GuestShell.tsx,pages/HomePage.tsx,pages/RequestsPage.tsx,mocks/handlers.ts,__tests__/flow.test.tsx,__tests__/requests.test.tsx}`; `product/design/tools/gen_strings.py` (nhóm đợt 2) → sinh lại `design/copy/strings-*.json`, `strings-tables.md`, `wireframes/assets/strings.js`; `01-decisions/decision-log.md` (1 dòng).

### 6.4 Giả định / vướng mắc đợt 2
- [GIẢ ĐỊNH MOB] Thông báo bấm vào: `work_order` → chi tiết phiếu; `hk_task`/`guest_request` → danh sách việc (HK) hoặc phiếu (MT); loại khác chỉ đánh dấu đã đọc.
- [GIẢ ĐỊNH MOB] Lý do khóa mặc định = loại sự cố đã chọn (sửa được).
- US-061 AC1 muốn thấy "mở bán lại từ …" **trước khi lưu**; hợp đồng giữ `ooo_reopen_buffer_days` ở server (MT/FD không đọc) nên PWA, như Desk (FE-B), hiện câu "hệ thống tính – hiện ngay khi lưu" rồi ngày thật sau khi lưu. Nếu PO muốn thấy trước: ARC thêm ngày tính thử (vd. `dryRun` hoặc trả buffer trong `BookingRules`) – đề nghị, không chặn.
- Minibar H20.4: chờ ORC báo BE-D giao US-066 (hợp đồng `getMinibarStandard`/`recordMinibarCheck` đã có; ghi vào hàng đợi theo ADR-005).
- Nối API thật: chờ ORC báo BE-C (module buồng phòng) và BE-D (yêu cầu khách, thông báo, SSE) gộp – `pnpm dev:server`.

## 7. Phản hồi & sửa trước cổng QC Sprint 4 – review thương hiệu UXD (18/10/2026)

Đầu vào: `reviews/s4-UXD-brand.md` (FB-R2-UXD-MOB-S4-02 Major – chặn ký G8.3; FB-R2-UXD-MOB-S4-03 Minor); tin ORC 18/10 (UXD đổi `hifi.css`: `h3` sang Be Vietnam Pro 600, thêm `.btn.brand` – chụp thêm 1 màn PWA có `h3`, chạy lại test). Trả lời thẻ ở `responses/s4-MOB.md`. Không commit.

### 7.1 Đã sửa
| Thẻ | Sửa | Đo trên bản chạy (localhost, MSW mock) |
|---|---|---|
| **MOB-S4-02** (Major) | Thêm `btn` cho 3 nút `icon-btn`: Quay lại của PWA (`ui/parts.tsx:134`, mọi màn con H20–H22, Thông báo, Thao tác trên máy), bỏ ảnh của PWA (`ui/PhotoPicker.tsx:58`, H20 kiểm phòng / H21 / H22), Quay lại ở guest-web H23 (`pages/RequestsPage.tsx:381`) | Trước: nền `rgb(239,239,239)` + viền đen (tối: `rgb(107,107,107)` + viền trắng). Sau: nền `--surface`, viền 1px `--line-strong` – sáng #FBF9F4 / #857E71, tối #24221F / #857F75; 48×48 px (PWA), 44×44 px (guest). Quét mọi `button`/`a.icon-btn` đang hiện ở 8 màn chụp (PWA căn 101, Thao tác trên máy, Báo sự cố có ảnh, Các căn – sáng + tối; guest H23, Lưu trú, Thông tin): **0** nút còn vỏ mặc định |
| Rà `icon-btn` khác | CheckinFlow H18 đã đúng (`btn icon-btn gw-back`). Chuông PWA `<a class="icon-btn hk-bell">`: thẻ liên kết, không có vỏ nút của trình duyệt (nền trong suốt, icon Ink) – **giữ nguyên** | Câu hỏi cho UXD (không chặn): chuông có cần khung như nút Quay lại / chuông Desk (`btn icon-btn`) không? Sửa 1 dòng nếu cần |
| **MOB-S4-03** (Minor) | `styles.css` của PWA: `.staff-app .chip` cho xuống dòng trong nền (`white-space: normal; max-width: 100%; overflow-wrap: break-word`), icon canh dòng đầu (`align-items: flex-start`, `margin-top: calc(0.8em - 8px)` = nửa của line-height 1.6em trừ icon 16 px). Cột chữ thẻ "Các căn" `align-items: flex-start` để chip ôm chữ như hi-fi H19 – trước đó cột flex kéo chip hết bề ngang, chữ `nowrap` tràn qua mép nền. Không đụng `hifi.css` | Chip có chữ tràn nền: 390 px VI **6/10 → 0/10**; 360 px VI 10/10 → 0/10; 390 px EN 9/10 → 0/10; 360 px EN 9/10 → 0/10 (chip dài nhất 3 dòng, cao 87 px). Vùng chạm = cả thẻ `a.hk-card.rowlink` (thấp nhất 99 px ≥ 44 px); chip không phải phần tử bấm |
| Tự phát hiện khi chụp | Màn căn 101 có một **thẻ trống có viền** (`.card.hk-info` render cả khi không có câu nào: không có khách đến, không đang dọn, chưa có "Dọn xong"). `pages/RoomPage.tsx`: chỉ render thẻ khi có nội dung | Ảnh "sau" căn 101 không còn khối trống; căn 103 vẫn hiện "Có khách đến hôm nay 14:00" |
| `h3` (tin ORC) | Không phải sửa mã. PWA dùng `h3` qua `StateView` (`@ottimo/ui`) | Màn "Thao tác trên máy" trạng thái rỗng: `h3` "Đã gửi hết" = Be Vietnam Pro 600 (đo `getComputedStyle`), sáng + tối |

### 7.2 Kiểm thử
- Ca mới, mỗi chỗ sửa một ca (đã thử đảo ngược bản sửa – bỏ `btn`, chip `nowrap`, thẻ `.hk-info` luôn render: 5/7 ca PWA và 2/2 ca guest-web chuyển đỏ; 2 ca PWA còn xanh là luật cột chữ `align-items` (không đảo trong lần thử) và ca cấu trúc thẻ):
  - `apps/mobile/src/__tests__/s4-brand.test.tsx` (7 ca): Quay lại căn 101 có `btn icon-btn`; "Bỏ ảnh 1" có `btn icon-btn` và vẫn bỏ được ảnh; quét mã nguồn – không `<button>` nào có `icon-btn` mà thiếu `btn` (chỉ chuông là `<a>`); luật CSS chip (xuống dòng, `max-width`, icon dòng đầu); cột chữ thẻ không kéo giãn chip; chip nằm trong thẻ liên kết, không có phần tử bấm lồng bên trong; căn 101 không có thẻ trống, căn 103 có dòng khách đến.
  - `apps/guest-web/src/__tests__/s4-brand.test.tsx` (2 ca): Quay lại H23 có `btn icon-btn gw-back`, bấm vẫn về danh sách; quét mã nguồn – mọi `icon-btn` có `btn`.
- Chạy lại sau khi UXD đổi `hifi.css`: PWA **78/78** (8 tệp, gồm quét bundle production – ngân sách lần tải đầu), guest-web **65/65** (8 tệp). `tsc` mobile, guest-web 0 lỗi. ESLint 0 lỗi (2 cảnh báo cũ "unused eslint-disable" trong `public/mockServiceWorker.js` do MSW sinh, không phải mã MOB). Prettier sạch.
- jsdom không tính bố cục, nên ca CSS chỉ khóa luật. Phép đo tràn chữ thật (Chromium, 360/390 px) nằm trong script chụp ảnh ở scratchpad. QA có thể đưa phép đo này vào bộ e2e UI (a13) nếu muốn khóa bằng trình duyệt.

### 7.3 Ảnh trước / sau cho UXD ký (390 px, Chromium headless, `deviceScaleFactor` 2)
Thư mục: `/private/tmp/claude-501/-Users-anhvh-Library-Application-Support-Claude-scratch-workspaces-00554cf2-3678-4864-82b0-830aaeaa97bd-4c0caebe-be05-49c5-a5a2-5bf357fddc6a-scratch-2026-10-15-c4f0d4/36df3adc-c586-471c-a039-340d2b696728/scratchpad/shots/` – hai thư mục con `before/` và `after/`, cùng tên tệp:
- `pwa-room101-back-390-{light,dark}.png` – PWA H20 căn 101, nút Quay lại (MOB-S4-02)
- `gw-h23-back-390-{light,dark}.png` – guest-web H23 form yêu cầu, nút Quay lại (trang khách luôn sáng, ảnh `dark` = máy đặt tối)
- `pwa-queue-h3-back-390-{light,dark}.png` – PWA "Thao tác trên máy": `h3` Be Vietnam Pro 600 + nút Quay lại (tin ORC)
- `pwa-report-photo-x-390-{light,dark}.png` – PWA H21 có 1 ảnh, nút bỏ ảnh
- `pwa-rooms-chips-390-{light,dark}.png`, `pwa-rooms-chips-360-vi-light.png`, `pwa-rooms-chips-{390,360}-en-light.png` – PWA "Các căn", chip (MOB-S4-03), chụp cả trang
- `measure.json` – số đo màu nền/viền từng nút, quét vỏ nút mặc định, đo tràn chữ từng chip. Script: `../shoot.mjs` (cổng 5274/5275 – dev server mock, không dùng stack demo)

### 7.4 File đã sửa / tạo
**Sửa:** `product/apps/mobile/src/ui/parts.tsx`, `src/ui/PhotoPicker.tsx`, `src/styles.css`, `src/pages/RoomPage.tsx`; `product/apps/guest-web/src/pages/RequestsPage.tsx`; `rounds/round-02/responses/s4-MOB.md`; báo cáo này.
**Tạo:** `product/apps/mobile/src/__tests__/s4-brand.test.tsx`, `product/apps/guest-web/src/__tests__/s4-brand.test.tsx`.

### 7.5 Giả định / còn mở
- [GIẢ ĐỊNH MOB] Chip nhiều dòng giữ dạng viên thuốc (`--r-pill`) như UXD đề xuất. Chữ vẫn nằm trong nền ở mọi ảnh. Nếu UXD muốn chip nhiều dòng bo góc nhỏ hơn hoặc nằm một dòng riêng dưới số căn thì báo MOB.
- Chuông PWA giữ không khung (xem 7.1) – chờ UXD trả lời, không chặn G8.3.
- Không ESC mới.

## 8. Phản hồi & sửa theo UXR đi thử PWA (18/10/2026)

Đầu vào: `outputs/UXR/s4-pwa-walkthrough.md` (34 vấn đề), tin ORC 18/10 (phần MOB: mức 3 P-05, P-04; mức 2/1 P-07, 08, 09, 10, 11, 12, 13, 16, 27, 28, 31, 33; P-01 phía PWA = câu báo lỗi theo P-08), thẻ UXD mới **FB-R2-UXD-MOB-S4-04** (chuông có khung). Không commit.

### 8.1 Đã sửa
| Mục | Gốc lỗi | Sửa |
|---|---|---|
| **P-05** (mức 3) – ảnh báo sự cố offline rơi khỏi phiếu | **Tái hiện được bằng test đơn vị.** Lúc đăng nhập lại, `enter()` gọi `queue.load()` để đọc lại hàng đợi. Đúng lúc đó, lượt gửi do đồng hồ hoặc sự kiện `online` đang tải ảnh. `load()` thay danh sách bằng đối tượng mới, nên mã ảnh được ghi vào phiếu **mới**. Lượt gửi cũ vẫn cầm phiếu **cũ** còn `@att:`, và `toRequest` lọc bỏ chỗ giữ chỗ đó, nên phiếu đi với `photoAttachmentIds: []`. Khớp với network UXR thấy: `attachments` 201 rồi `work-orders` 201 với `[]` | `queue.ts`: `load()` chờ lượt gửi đang chạy xong rồi mới đọc lại; vòng gửi luôn lấy mục **sống** theo id, không dùng bản chụp |
| **P-04** (mức 3) – minibar "1, 1" | **API chưa trả tên món.** Hợp đồng 0.3.7 có `refillItems[].itemName` (không bắt buộc), nhưng server chỉ lưu `{itemId, quantity}` (`inventory/internal/refill-tasks.ts` `refillItemsJson`; `housekeeping.service.ts:740` trả nguyên). **Cần BE (BE-C/BE-D) điền `itemName`** theo ngôn ngữ phiên | PWA: đủ tên thì hiện "Bổ sung minibar: 1 Bia Larue lon, 1 Coca-Cola lon". Thiếu tên thì hiện "Bổ sung minibar: 2 món – xem tủ hoặc hỏi lễ tân tên món" (khóa mới `hk.refill_unnamed`), không còn "1, 1". Hàm `refillText` ở `app/tasks.ts` |
| **P-07** – bộ đếm lệch, dòng lặp "Bấm lúc" | Gốc thật: khi mất mạng, đồng hồ hàng đợi chỉ thức theo mục **đã đến hạn**. Lượt gửi dừng ở "offline" mà không đổi gì, nên không đặt đồng hồ mới, và thao tác thứ hai kẹt ở "trong 10 giây hoàn tác" mãi. Nút tròn bỏ qua mục đó, còn danh sách thì đếm nó, nên lệch số | `nextWakeAt()`: khi offline chỉ thức để kết thúc 10 giây hoàn tác. `wake` tính lại khi `online` đổi. Thêm một hàm đếm `waitingActions()` dùng chung cho nút tròn và "Thao tác trên máy". Mỗi dòng ghi giờ bấm 1 lần + 1 trạng thái: "Đang gửi 1/n…", "Chờ lượt" (mới) hoặc "Chờ mạng" |
| **P-08** + **P-01** phía PWA | 422 của server là `VALIDATION_FAILED` + `errors[performedAt] = PERFORMED_AT_OUT_OF_RANGE`. Hàng đợi chỉ giữ mã ngoài cùng, và câu thì in nguyên mã | Hàng đợi giữ mã của trường. "Cần xem lại" hiện câu thường theo từng lý do (giờ bấm không khớp, 403, 404, ảnh, khác); mã chỉ là dòng nhỏ "Mã tham chiếu: …". Với trạng thái buồng/việc bị từ chối vì giờ: nút **"Gửi lại 'Dọn xong'"** (ở "Thao tác trên máy" và ngay trên màn căn) tạo thao tác mới với giờ lúc bấm, có Hoàn tác 10 giây. Phần server của P-01 vẫn do BE-C sửa (thẻ ARC S4-01); nút này là đường gỡ cho người dùng, kể cả với lệnh quá 24 giờ |
| **P-09** | Lúc mở app, chỉ lỗi mạng thật mới vào chế độ đọc offline | 502/503/504 lúc khởi động cũng tính là không có máy chủ (`unreachable()` ở `app/api.ts`), nên app mở bằng hồ sơ đã lưu. Màn đăng nhập luôn ghi "n thao tác vẫn còn trên máy và sẽ gửi sau khi bạn đăng nhập", không chỉ khi phiên hết hạn |
| **P-10** | `InspectionPage` bắt tick mọi mục; mục "Ảnh phòng" với FDL+ (`photoRequired: false`) thành ô tick | Chỉ mục `required` khóa "Kiểm đạt". Mục có `photoRequired` (cả `false`) là bước chụp ảnh: bắt buộc khi `true`, tùy chọn khi `false`. Mục không bắt buộc chưa tick thì không gửi (gửi "chưa đạt" sẽ cần ghi chú). Khớp server: chỉ mục bắt buộc không phải ảnh quyết định đạt (`housekeeping.service.ts` `failedItems`) |
| **P-11** (phần MOB) | `resultNote` có trong API nhưng PWA không hiện. **API gộp ảnh lúc báo và ảnh sau sửa** vào `photoAttachmentIds` (`work-orders.service.ts:243`), không có trường riêng | Hiện "Kết quả: …". Khi phiếu đã có `doneAt`, tiêu đề khối ảnh là "Ảnh lúc báo và sau khi sửa" (mới). **Tách 2 khối cần ARC/BE-C** thêm trường ảnh sau sửa vào hợp đồng (DB đã tách `done_photo_attachment_ids`). Mock làm giống server |
| **P-12** | Nhóm "Làm trước – có khách đến hôm nay" còn chứa bộ đồ dùng thêm, việc gấp, việc có hạn giờ | Tiêu đề nhóm là "Làm trước" (khóa mới `hk.grp.do_first`); lý do nằm trên từng thẻ (giờ khách đến, hạn) |
| **P-13** | Việc đã bỏ biến mất; toast không ghi căn; thẻ "Đã xong" hiện trạng thái căn | Thêm nhóm "Đã bỏ (n)", mỗi thẻ có lý do (lý do từ server, hoặc từ thao tác còn chờ gửi; thêm 3 câu cho mã hệ thống). Toast "Căn 102 · The Fern: đã bỏ việc dọn hôm nay". Thẻ "Đã xong" ghi "Dọn trả phòng – xong 09:40", không còn chip trạng thái căn |
| **P-16** | "Bảo trì đã thấy phiếu" là câu sai sự thật | "Đã gửi tới bảo trì. Bạn không cần làm gì thêm." (khóa mới `hk.wo.sent_to_mt`; phiếu Gấp giữ câu cũ của UXD) |
| **P-27** (mức 1) | Nhãn dài, sát mép; khi vào căn thì thanh dưới chuyển sang "Các căn" | Nhãn "Việc" (khóa có sẵn `nav.tasks`), lề 4 px. Màn con giữ tab người dùng đi từ đó (`App.tsx` `lastTab`). Đo 360 px: 4 tab một dòng, cao 64 px, tab đầu cách mép 4 px |
| **P-28** (mức 1) | Câu lỗi mạng chung bảo bấm "Thử lại" | "Chưa kết nối được tới máy chủ. Kiểm tra mạng rồi bấm Đăng nhập lần nữa." (khóa mới `login.error_network`) |
| **P-31** (mức 1) | Hai banner mất mạng chồng nhau ở Báo sự cố | `TopBar ownOfflineNote`: màn Báo sự cố chỉ giữ câu riêng của form; các màn khác vẫn có banner chung |
| **P-33** (mức 1, phần MOB) | Hợp đồng ghi `currentGuest` = "tên gọi + căn", nên thẻ lặp số căn | `guestName()` bỏ phần " · <căn>". Còn câu hỏi **họ tên đầy đủ hay tên gọi** (server dùng `stay.name`) thì cần DOM/SEC xác nhận, BE sửa nếu cần |
| **MOB-S4-04** (UXD) | Chuông không có khung | `btn icon-btn hk-bell`. Ca quét nguồn đòi `btn` cho mọi `icon-btn` |

### 8.2 Chuyển vai khác / R3 (MOB không sửa được một mình)
- **BE (gấp, mức 3) – P-04:** điền `refillItems[].itemName` (VI/EN theo phiên) ở `listHkTasks`. PWA đã sẵn: có tên là hiện ngay, không phải sửa thêm.
- **ARC + BE-C – P-11:** tách ảnh sau sửa ra trường riêng trong `WorkOrder` (vd. `donePhotoAttachmentIds`). Khi có trường, MOB tách 2 khối (sửa 1 chỗ).
- **BE-C – P-01:** sửa phía server (thẻ ARC S4-01). PWA đã có câu thường và nút "Gửi lại".
- **DOM/SEC (+ BE) – P-33:** buồng phòng thấy họ tên hay tên gọi.
- **UXD + SEC – P-14** (xem trước ảnh), **OPS – P-15** (`VITE_DESK_PHONE`; OPS đã ghi decision-log), **INV – P-25** (logo cho icon PWA): ngoài phần MOB, giữ theo ORC.
- Danh sách R3 của MOB: không còn mục MOB nào chưa làm trong phần ORC giao. Các mục trên chỉ chờ vai khác.

### 8.3 Câu chữ – chờ UXD duyệt
`product/design/tools/gen_strings.py`: nhóm mới "R2 Sprint 4 – MOB sửa theo UXR đi thử PWA … (chờ UXD duyệt)", 20 khóa VI/EN, đã sinh lại `copy/strings-*.json`, `strings-tables.md`, `wireframes/assets/strings.js`:
- hàng đợi: `hk.queue.in_line`, `hk.queue.r.{time,photo,forbidden,not_found,other}`, `hk.queue.ref_code`, `hk.queue.resend`, `hk.queue.resent_toast`;
- đăng nhập: `login.error_network`;
- báo sự cố và phiếu sửa: `hk.wo.sent_to_mt`, `wo.photos_report_and_after`;
- việc của tôi: `hk.grp.do_first`, `hk.grp.cancelled`, `hk.task_done_at`, `hk.toast.refused`, `hk.cancel.{reservation_changed,room_blocked,day_ended}`, `hk.refill_unnamed`.

Khóa cũ không còn dùng trong PWA: `hk.grp.first`, `hk.wo.sent_body`, `hk.queue.rejected_other`. UXD quyết có giữ cho Desk hay bỏ.

### 8.4 Kiểm thử
- Ca mới:
  - `apps/mobile/src/__tests__/s4-uxr-queue.test.ts` (4 ca, node): P-05 đọc lại hàng đợi trong lúc tải ảnh; ca này **đỏ khi bỏ bản sửa**. Thêm ca đóng app khi offline rồi mở lại, ca giữ mã 422 của trường, ca "Gửi lại" (khóa mới, giờ mới) và ca không có "Gửi lại" với 409.
  - `apps/mobile/src/__tests__/s4-uxr.test.tsx` (18 ca), mỗi mục ít nhất một ca:
    - P-05: báo sự cố + ảnh khi offline, đóng app, mở lại có mạng, phiếu có ảnh;
    - P-04: có tên / không tên;
    - P-07: nút tròn = tiêu đề danh sách (1 rồi 2); mỗi dòng 1 "Bấm lúc" + "Chờ mạng";
    - P-08/P-01: câu thường, không lộ mã; "Gửi lại" gửi với giờ mới; 403 có mã tham chiếu nhỏ, không có "Gửi lại";
    - P-09: 502 lúc mở app; ghi số thao tác chờ ở màn đăng nhập;
    - P-28;
    - P-10: FDL, mục không bắt buộc và ảnh tùy chọn không khóa nút, không gửi mục chưa tick;
    - P-11, P-12;
    - P-13: Đã bỏ + lý do + toast có căn; thẻ Đã xong;
    - P-33, P-16, P-31;
    - P-27: tab giữ đúng chỗ đi.
  - `s4-brand.test.tsx`: thêm MOB-S4-04.
  - Sửa ca cũ cho đúng chữ mới: `flow.test.tsx` ("Việc", "Làm trước", "Tasks", "Do first"), `s4b.test.tsx` ("Làm trước").
- Kết quả: PWA **100/100** (10 tệp, gồm quét bundle production), guest-web **65/65**. `tsc` mobile và guest-web 0 lỗi. ESLint 0 lỗi (2 cảnh báo cũ trong `public/mockServiceWorker.js` do MSW sinh). Prettier sạch.
- Ảnh kiểm nhanh 360 px (thanh dưới "Việc", chuông có khung, "Làm trước", thẻ "Đã xong"): `/private/tmp/claude-501/-Users-anhvh-Library-Application-Support-Claude-scratch-workspaces-00554cf2-3678-4864-82b0-830aaeaa97bd-4c0caebe-be05-49c5-a5a2-5bf357fddc6a-scratch-2026-10-15-c4f0d4/36df3adc-c586-471c-a039-340d2b696728/scratchpad/shots/uxr/pwa-tasks-360-{light,dark}.png`.
- **Chưa đi lại trên stack `ottimo-uxr`** (API thật bản `7ac11a4`; stack không có mã sửa của MOB, muốn thử phải dựng lại image web). Mọi kiểm thử chạy trên mock MSW. Đề nghị UXR/QA đi lại T6, T7, T9, T10, T13, T14 sau khi gộp mã MOB và BE-C (như UXR mục 1 đã ghi).

### 8.5 File đã sửa / tạo
**Sửa (PWA):**
- `product/apps/mobile/src/queue/{queue.ts,QueueProvider.tsx,messages.ts}`;
- `src/App.tsx`;
- `src/app/{api.ts,actions.ts,rooms.ts,tasks.ts}`;
- `src/pages/{TasksPage,RoomPage,RoomsPage,QueuePage,LoginPage,InspectionPage,ReportPage,WorkOrderPage}.tsx`;
- `src/ui/parts.tsx`, `src/styles.css`;
- `src/mocks/handlers.ts` (`currentGuest` "tên · căn", ảnh sau sửa gộp như server);
- `src/__tests__/{flow,s4b,s4-brand}.test.tsx`.

**Tạo:** `src/__tests__/s4-uxr.test.tsx`, `src/__tests__/s4-uxr-queue.test.ts`.

**Khác:**
- `product/design/tools/gen_strings.py` và các tệp sinh lại;
- `01-decisions/decision-log.md` (1 dòng MOB);
- `rounds/round-02/responses/s4-MOB.md` (MOB-S4-04).

- README theo OPS P-15 (tin ORC): `product/apps/mobile/README.md`, `product/apps/guest-web/README.md`. `VITE_DESK_PHONE` nay **bắt buộc** khi build profile demo/production. Ghi rõ dạng chỉ chữ số + dấu cách (vd. `08 4444 0909`, cùng regex với `app/config.ts`), số mẫu bị chặn, `pnpm dev` không bắt buộc.

Mã guest-web không phải sửa trong đợt này.

### 8.6 Bổ sung cùng đợt (tin ORC 18/10)
- **BR-614 (DOM chốt P-33):**
  - Thẻ việc và thẻ căn hiện số căn ở đầu thẻ, rồi "Khách: <tên gọi>" ("101 · Khách: Huy"). Số căn không lặp lại. Đơn chưa có tên thì chỉ hiện "101", không có dòng "Khách:".
  - `guestName()` (`app/rooms.ts`) lấy nguyên giá trị server trả: bỏ phần "· <căn>"; nếu chỉ còn số căn thì không hiện. PWA **không tự tách** tên gọi từ họ tên, vì quy tắc khách VN / khách nước ngoài là của server (BE-C đang sửa).
  - Test: 3 ca trong `s4-uxr.test.tsx` (thẻ việc 101 chỉ có một "101"; đơn chưa có tên; bảng giá trị `guestName`).
- **Chuỗi UXD đã duyệt (8 câu sửa):**
  - Ca test không còn so chữ VI viết cứng với các câu mới. Thêm `tv(key, args)` vào `__tests__/helpers.tsx` (như admin-web).
  - `s4-uxr.test.tsx` đọc mọi câu mới qua khóa; câu có `{time}` so theo mẫu (`withTime`).
- **Chạy lại:** PWA **103/103** (10 tệp), guest-web **65/65**, `tsc` 0 lỗi, ESLint 0 lỗi (2 cảnh báo cũ của MSW), Prettier sạch. Không commit.
- **BR-614 sau quyết định ARC (18/10):**
  - `currentGuest` và `nextArrival.guestDisplayName` **chỉ chứa tên**. PWA tự ghép "101 · Khách: Huy" từ `roomNo` + `hk.guest_first_name`; PWA không hiện `guestDisplayName`.
  - Mock trả tên không kèm số căn, như hợp đồng.
  - `guestName()` vẫn bỏ " · 101" nếu server chưa cập nhật gửi kiểu cũ. Có ca giao diện "Huy · 101" → thẻ hiện "Khách: Huy", số 101 chỉ một lần.
  - **Chưa kiểm với server thật:** không stack nào đang chạy có mã BE-C mới (`ottimo-api:qa-s4` dựng 17/10 19:00, `ottimo-uxr` = `7ac11a4`). Kiểm bằng dạng phản hồi của ca tích hợp BE-C (`housekeeping-s4-arc.test.ts` BR-614) và mock.
  - PWA **104/104**, `tsc`, ESLint, Prettier sạch.
- **P-04 sau khi BE-B điền `itemName`** (`s4-be-b.md` mục 22):
  - Thẻ việc hiện "Bổ sung minibar: Bia Đà Lạt × 2, Coca-Cola lon × 1".
  - Món nào chưa có tên (việc ghi trước bản sửa, chưa đối chiếu lại) thì vẫn giữ câu tạm "… {n} món – xem tủ hoặc hỏi lễ tân tên món".
  - Mock trả `{ itemId, itemName, quantity }` như server.
  - Test: ca giao diện có tên / không tên, và ca `refillText()` (cả trường hợp thiếu tên một món).
  - PWA **105/105**, `tsc`, ESLint 0 lỗi, Prettier sạch.
