# Kế hoạch Round 2 – Xây dựng lõi MVP

- Người lập: PO (cùng ORC) | Ngày: 16/10/2026 | **Trạng thái: Dự thảo – chờ INV trả lời ESC** (chủ yếu ESC-012 câu phụ R-A/R-B/R-C; ngoài ra ESC-002, ESC-010 cho staging và VietQR)
- Phương án phạm vi dùng trong dự thảo: **R-C** (đội đề xuất trong ESC-012, áp dụng khi INV chưa trả lời – decision-log PO 15/10 `[GIẢ ĐỊNH – chờ INV qua ESC-012]`). Phương án thay thế nếu INV chọn R-A hoặc R-B: mục 2.4.
- Đầu vào: `rounds/round-01/plan.md` (mẫu), `product/docs/PRD.md` (mục 5, D6), `03-backlog/backlog.md` (145 story, 77 Must R2), `02-escalations/ESC-012.md`, `rounds/round-01/reviews/BE-on-ARC.md` (bảng ước lượng theo module), `rounds/round-01/responses/*.md`, `rounds/round-01/qa/bug-list.md`, `test-report.md`, `sec-findings.md`, `product/docs/architecture.md` (mục 1, 11, 15, 19), `product/docs/qa/test-strategy.md`.
- ARC, QA góp ý dự thảo ở đầu tuần 1; ORC duyệt và ghi decision-log khi commit (giống R1).

---

## 1. Mục tiêu Round 2

Biến bộ tài liệu R1 thành **phần mềm chạy được trên staging**, trong đó **luồng chính chạy từ đầu đến cuối** (protocol mục 4 Round 2) với dữ liệu mẫu DS-0 và đồng hồ giả lập:

1. **Lễ tân** vận hành một ngày trên Desk (admin-web): room rack → đặt/giữ chỗ → thu cọc VietQR → nhận phòng (giấy tờ, đối chiếu, khai báo bán tự động) → lưu trú (gia hạn, phát sinh, trả muộn) → trả phòng 3 bước → bill → thu tiền → hoàn tất.
2. **Không bao giờ đặt trùng** (chống trùng ở server, kể cả khi lưu đồng thời; đơn OTA trùng → cờ xung đột, không mất đơn).
3. **Buồng phòng/bảo trì** dùng app nhân viên (PWA) cho việc hôm nay, đổi trạng thái buồng, kiểm phòng, báo sự cố → phiếu sửa khóa phòng chặn bán.
4. **Khách** mở trang của đơn bằng link/QR (VI/EN), check-in online, xem thông tin lưu trú, gửi yêu cầu → yêu cầu vào đúng hàng việc.
5. **Chủ đầu tư** thấy KPI đêm nay + "Cần chú ý" từ dữ liệu thật; phân quyền 8 vai, dữ liệu giấy tờ (C3) chỉ mở trên thiết bị được cấp, mọi thao tác tiền có nhật ký.
6. **Hạ tầng**: CI chạy thật và xanh; staging deploy tự động; bộ test tự động (unit, API, quyền, E2E smoke) chạy mỗi PR.

## 2. Phạm vi

### 2.1 Trong phạm vi Round 2 (phương án R-C)

**77 story Must R2 của backlog trừ 5 story dời hẳn theo R-C** (US-081, 111, 125, 128, 141) = **72 story**, trong đó **4 story làm một phần** (US-012, 086, 108, 119 – phần dời ghi ở mục 2.2).

| Epic (thứ tự ưu tiên PRD D6) | Story làm trong R2 | Ghi chú phạm vi |
|---|---|---|
| EP00 Nền tảng | US-001, 002, 003, 004, 005, 006, 007, 135, 142 | Không cắt (D6). Duyệt FOC bằng mật khẩu đăng nhập (PIN ở R3) |
| EP02 Room rack & đặt phòng | US-016, 017, 018, 019, 020, 021, 022, 023, 024, 136 | Không cắt chống trùng. US-017 AC5 bổ sung **AC5a tạm** cho đơn dài hạn (mục 2.3, P-R2-3) |
| EP11 Sale (phần R2) | US-080, 082, 083, 084, 085, 086 (trừ AC3), 087 | Báo giá ngắn ngày, giữ chỗ, hết hạn giữ chỗ, xác nhận cọc. **Không** sinh HĐ dài hạn ở R2 |
| EP12 Kênh | US-139 | Đơn OTA nhập tay trùng → cờ xung đột, làn "Chưa gán căn" |
| EP03 Nhận phòng | US-025, 026, 027 | |
| EP04 Lưu trú | US-028, 029, 030, 031, 032 | |
| EP05 Trả phòng & bill | US-035, 036, 037, 038, 039 | |
| EP15 Thu tiền | US-119 (trừ AC5), 120 | VietQR với tài khoản thử (chờ ESC-010); cờ "chờ đối soát" (AC6) giữ ở R2 |
| EP06 Giấy tờ & khai báo | US-042, 043, 044, 045, 046, 047, 048, 049, 050 | Không cắt bảo vệ giấy tờ (D6) |
| EP07 Buồng phòng | US-052, 053, 054, 055, 056, 057 | App nhân viên PWA |
| EP08 Bảo trì | US-061, 062 | |
| EP09 Minibar | US-066 | Danh mục mặt hàng (phục vụ kiểm minibar khi trả phòng) |
| EP10 CRM | US-071, 072, 073 | |
| EP14 App khách | US-106, 107, 108 (trừ phần mã cửa của AC2), 109, 110, 112 | Phiên khách mức 1 (link). Điều kiện bảo mật khi dời US-141: mục 2.3, P-R2-4 |
| EP01 Tổng quan | US-010, 011, 012 (trừ AC2) | Theo lộ trình DATA: K-01/K-02/K-03 đêm nay, S1c, S7 |

**Should R2 – làm nếu còn thời gian, theo thứ tự**: US-094 (lệnh đồng bộ kênh giả lập – phần tối thiểu đã nằm trong AC Must "có lệnh đồng bộ" qua outbox + Mock, nên làm cùng module worker), US-058 (hàng đợi offline buồng phòng – ADR-005), US-137 (trả phòng sớm), US-013, US-033. Không kịp thì chuyển R3, không ảnh hưởng QC R2.

**Việc chuyển từ R1 sang tuần đầu R2** (bắt buộc, chi tiết mục 3.2): endpoint nhóm đơn/đóng ca, rà `x-roles` và `x-rbac-field`, bỏ nhánh cài không lockfile, chạy thật CI, seed DS-E/DS-0, `br-examples.json`, E2E smoke và các lỗi P2/P3 còn Open của R1.

### 2.2 Ngoài phạm vi Round 2
- **Dời sang đầu Round 3 theo R-C** (ESC-012): US-081 báo giá dài hạn; US-086 AC3 sinh HĐ + lịch kỳ thu; US-119 AC5 ghi thu theo kỳ HĐ; US-012 AC2 và job J12 nhắc kỳ thu/chào gia hạn tự động; US-111 khách xem folio; US-128 mã cửa trong đơn (và phần mã cửa của US-108 AC2); US-141 xác minh một lần trên app khách; US-125 mẫu tin đa ngôn ngữ.
- Các story Must R3 khác đã có trong backlog: đơn nhóm US-140, đóng ca US-124, 2FA US-143, trả phòng dài hạn US-041, điện nước US-064/065, báo cáo tháng US-100…102, channel manager thật US-095/096/099, MISA US-122, tiếng Nga US-115, quyền dữ liệu của khách US-133/134.
- Kết nối thật với bên thứ ba (channel manager, VNPay/MoMo, MISA, Zalo, khóa cửa, cổng Bộ Công an): R2 dùng adapter **Mock**; sandbox thật chỉ khi INV đã cấp tài khoản (ESC-009, ESC-010) – không chặn QC R2.
- Bước "đánh giá" trong hành trình khách (US-116) – R3.
- Production, giám sát đầy đủ, diễn tập khôi phục – R3 (OPS).
- Trang đặt phòng trực tiếp (booking-web) – R3 (nên có).

### 2.3 Quyết định phạm vi của PO trong round này (ORC ghi decision-log khi commit)
| # | Quyết định | Lý do |
|---|---|---|
| P-R2-1 | Phạm vi R2 theo **R-C** cho tới khi INV trả lời ESC-012; INV chọn khác thì áp mục 2.4 ngay trong tuần 1 | ESC-012 "Nếu chưa trả lời"; phân xử ORC 15/10 |
| P-R2-2 | Không cắt 4 phần dù chọn phương án nào: nền tảng + phân quyền, chống đặt trùng, folio/thu tiền, bảo vệ giấy tờ (C3) | PRD D6, BE-on-ARC "phần không được cắt" |
| P-R2-3 | Khi dời báo giá dài hạn + HĐ, **khách dài hạn vẫn phải chiếm phòng trên rack** để chống trùng đúng. PO thêm (tuần 1) **US-017 AC5a tạm cho R2**: FD+ tạo "đơn dài hạn nhập tay" (căn, ngày vào/ra, số tiền/tháng nhập tay, cờ "HĐ ngoài hệ thống – chuyển vào app ở R3"), đơn chiếm tồn phòng như mọi đơn; thu tiền ghi bằng US-119 AC1 (không gắn kỳ). R3 chuyển các đơn này sang HĐ đầy đủ (US-086 AC3) | Nếu không, 4–6 căn dài hạn (mục tiêu G2) không có trên rack → sai tồn phòng, sai KPI; "dài hạn vẫn làm tay như hiện nay thêm một round" (ESC-012) chỉ áp cho tính tiền/hợp đồng |
| P-R2-4 | Dời US-141 với điều kiện: ở R2 app khách **không** hiển thị dữ liệu nhạy cảm nào – không mã cửa, không folio, không hiện lại số giấy tờ hay ảnh đã tải khi khách mở lại link check-in (US-107 AC2 chỉ hiện "đã tải n/m người" và cho tải lại). **SEC xác nhận điều kiện này trong tuần 1**; SEC không đồng ý thì US-141 quay lại R2 (+ khoảng 0,5 tuần-người BE, MOB tương ứng) | Phiên khách mức 1 chỉ dựa vào link; SEC SR-GST-07…11 |
| P-R2-5 | US-108 AC2 ở R2: Wi-Fi hiện theo khung hiệu lực; mã cửa **không** có trên app (lễ tân giao như hiện nay) cho tới US-128 ở R3 | Theo R-C |
| P-R2-6 | Thanh toán R2 = VietQR (chuỗi QR đúng số tiền + nội dung = mã đơn/bill) với **tài khoản ngân hàng thử** + ghi thu tay có cờ "chờ đối soát". Cổng VNPay/MoMo sandbox ở R3 (US-121 Should) khi có tài khoản (ESC-010) | Protocol R2 ghi "thanh toán (sandbox)"; VietQR không cần merchant, đủ để chạy luồng từ đầu đến cuối |
| P-R2-7 | Mỗi story chỉ "Xong" khi QA chạy hết TC Cao và **PO nghiệm thu từng AC trên staging** (Accepted / Trả lại) | Decision-log QA + PO 15/10; DoD |

### 2.4 Phương án thay thế nếu INV chọn R-A hoặc R-B

| | R-C (dự thảo này) | R-A – giữ đủ 77 story | R-B – thu hẹp theo D6 |
|---|---|---|---|
| Phần thêm/bớt so với R-C | – | **Thêm lại** US-081, 086 AC3, 119 AC5, 012 AC2 + J12, 111, 128, 108 AC2 đủ, 141, 125. Bỏ P-R2-3, P-R2-4, P-R2-5 | **Thêm lại** phần dài hạn (US-081, 086 AC3, 119 AC5, 012 AC2), US-125, US-128 (mã cửa chỉ trên Desk). **Dời sang đầu R3**: app buồng phòng EP07 (US-052…057) và app khách EP14 (US-106…110, 112, 141). Giữ US-061/062 trên Desk (phiếu sửa + khóa phòng – cần cho chống bán phòng hỏng US-019) |
| BE (tuần-người) | ≈ 16–21 | ≈ 20–25 | ≈ 17–21 |
| Lịch dự kiến (2 luồng BE song song – mục 3.3) | ≈ 10–11 tuần | ≈ 12–14 tuần | ≈ 10–11 tuần |
| MOB | PWA nhân viên + guest-web | Như R-C + bill, mã cửa, OTP trên guest-web | **Gần như không có việc R2** (chỉ dựng khung + UI theo UXD) → ORC có thể giảm MOB, chuyển hỗ trợ FE |
| Luồng QC R2 (mục 7, nhóm A) | A1–A7 | A1–A7 + A8 dài hạn (báo giá → giữ chỗ → ký quỹ → HĐ → ghi thu kỳ) + bước xác minh OTP, xem folio, mã cửa trong A1 | A1–A7 + A8 dài hạn; **bỏ** check-in online, yêu cầu khách và bước dọn/kiểm trên PWA khỏi A1; A4 rút còn: phiếu sửa + khóa OOO trên Desk → chặn bán → đóng phiếu → căn `VD` |
| Việc PO làm trong tuần 1 khi đổi | – | Bỏ AC5a tạm; khôi phục round R2 cho story dời | Sửa round của EP07/EP14 sang R3; báo UXR (giả thuyết H-05 kiểm trên bản R3 – UXR-responses) |

## 3. Phân việc từng vai

Quy ước như R1: mỗi vai nộp `rounds/round-02/outputs/<VAI>/report.md` (Đã làm gì · File tạo/sửa · Giả định · Rủi ro/vướng mắc · Việc chưa xong) cuối mỗi đợt; giả định ghi nhãn `[GIẢ ĐỊNH – chờ INV xác nhận]`; code, biến, commit tiếng Anh; tài liệu tiếng Việt.

### 3.1 Bảng phân việc

| Vai | Việc cụ thể trong R2 | Đầu vào chính | Đầu ra |
|---|---|---|---|
| **PO** | (1) Tuần 1: áp R-C vào backlog (trạng thái "Dời R3" cho phần dời, thêm US-017 AC5a, ghi chú US-108/US-012/US-086/US-119) – hoặc áp R-A/R-B nếu INV đã trả lời. (2) Trả lời câu hỏi dev/design trong ngày (ghi Q&A vào `rounds/round-02/outputs/PO/qa-log.md`). (3) Nghiệm thu từng story trên staging theo AC (Accepted / Trả lại). (4) Cập nhật backlog theo phát hiện mới. (5) Review UXR, UXD, QA, DATA. (6) Cùng ORC lập `rounds/round-03/plan.md` | Backlog, PRD, ESC trả lời | `03-backlog/backlog.md`; `product/docs/PRD.md` (nếu đổi phạm vi); bảng nghiệm thu `rounds/round-02/outputs/PO/acceptance.md` |
| **ORC** | Chốt số luồng BE (mục 3.3), giao việc theo đợt, theo dõi, điều phối review theo PR và cuối đợt, phân xử, nâng ESC lên "Gấp" nếu ESC-002/ESC-010 chặn staging (mục 8), viết `round-summary.md` | – | `rounds/round-02/round-summary.md` |
| **BA** | (1) Đầu R2: đặc tả theo phân hệ mức trường/kiểm tra hợp lệ/thông báo lỗi `product/docs/specs/<phân-hệ>.md` cho các phân hệ R2 (theo thứ tự D6, kịp trước sprint tương ứng). (2) Sửa lỗi R1 còn Open: BUG-R1-001 (K13), 005 (S25a `catalog_only`), 006 (A22, A110), 011 (chốt cùng ARC), 019 (dẫn BR-010). (3) Trả lời câu hỏi nghiệp vụ của dev | BR, SM, RBAC, OpenAPI, wireframe | `product/docs/specs/*.md`; cập nhật `state-machines.md`, `rbac-matrix.md/.json` |
| **DOM** | (1) Xác nhận các giả định chờ DOM ở R2: người thực hiện chuyển khoản hoàn = MGR+ (BA-responses), rời trong ngày giữ đêm đầu (erd 14 E6). (2) Cùng QA rà `br-examples.json` (đúng cột ví dụ BR). (3) Cùng PO nghiệm thu các story tiền/khai báo (bill, phụ thu, no-show, khai báo). (4) Cập nhật BR khi INV trả lời ESC-004…008 (chỉ đổi tham số) | BR, ESC trả lời | `product/docs/business-rules.md` |
| **UXR** | (1) Áp luật quyết định khi có kết quả ESC-003. (2) Test kịch bản trên UI R2 (staging): lễ tân, buồng phòng, khách check-in online; gồm phần dời từ R1: tương phản token tối, trạng thái tải/rỗng/lỗi/mất mạng (UXD-UXR-10), J5 CTV báo giá tại chỗ, J6 chủ đầu tư 5 phút đầu ngày (UXD-UXR-13); đo số lần nhập PIN/xác thực lại mỗi ca (SEC-10) | UI R2, persona, journeys | `product/docs/research/usability-report-r2.md` |
| **UXD** | (1) UI hoàn chỉnh (hi-fi) cho luồng R2: Desk (rack, đơn, nhận/trả phòng, folio, khai báo, CRM, báo giá ngắn, cấu hình, phê duyệt, nhật ký, thiết bị được cấp), PWA nhân viên (việc, buồng, checklist, sự cố, banner mất mạng, "đang chờ gửi (n)"), guest-web VI/EN. (2) Chuỗi VI/EN cho mọi màn R2. (3) Sửa BUG-R1-015 (`WO-00031`), BUG-R1-007 (cùng ARC). (4) Màn "đơn dài hạn nhập tay" (P-R2-3) | Design System, wireframe R1, specs BA | `product/design/` (ui, tokens, chuỗi) |
| **ARC** | (1) Tuần 1 (việc chuyển R2): thêm vào OpenAPI endpoint + enum **nhóm đơn (SM-16 G1–G5)** và **đóng ca (SM-17 C1–C5)** – chỉ hợp đồng, code ở R3 (BUG-R1-010); **rà toàn bộ `x-roles`** với `rbac-matrix.json` (14 operation lệch: BUG-R1-005/011/012) và phủ **`x-rbac-field`** cho mọi thuộc tính nhạy cảm (cùng QA); thêm 2 mã lỗi `CAPACITY_BELOW_BOOKINGS`, `PARAM_OUT_OF_RANGE` (BUG-R1-007); sửa BUG-R1-014, 017 (phần OpenAPI), 018, mô tả `restoreNoShow` (fix-notes-PO); ADR-012 theo đề nghị OPS. (2) Chốt thẻ BE-ARC 01–07 trong tuần 1 (điều kiện của ước lượng BE). (3) Hợp đồng API cho AC5a đơn dài hạn nhập tay. (4) Review kỹ thuật mọi PR lớn của BE/FE/MOB/INT; không đổi contract mà không báo | OpenAPI 0.2, ERD, ADR | `product/docs/api/openapi.yaml` (0.3), `erd.md`, `adr/*` |
| **BE** (2 luồng, mục 3.3) | Code `services/api` + worker theo 12 module của bảng BE-on-ARC (đã trừ phần dời R-C): nền tảng (Drizzle + migration, vai DB + GRANT từng bảng, RLS, problem+json, Idempotency/If-Match, guard `x-roles` + serializer `x-visible-to` sinh từ spec, `audit_event`/`state_transition` phân vùng tháng, `DocNumberService`, `ParameterService`, `MutableClock` + `/__test__`, `assertSafeConfig()` + kiểm `BYPASSRLS`); identity; platform; reservations + chống trùng (exclusion constraint, ADR-009) + giữ chỗ/báo giá ngắn + no-show; frontdesk + folio + VietQR; registration + C3 (mã hóa phong bì, `c3_access_log`, xóa ảnh J16 phần R2); housekeeping/maintenance; guests; guest-portal mức 1 + yêu cầu khách; reporting R2 + SSE; worker J1–J18 phần R2 + outbox với Mock. Test unit đọc `br-examples.json`; test đồng thời + RLS 2 cơ sở | OpenAPI, ERD, coding-standards, BR | `product/services/api/`, `product/packages/contracts/` |
| **FE** | admin-web (Desk) cho các story R2: đăng nhập, điều hướng theo vai, rack 14 ngày, tạo/sửa/hủy đơn, xung đột OTA, chi tiết đơn + hành động hợp lệ, nhận phòng + giấy tờ + đối chiếu + khai báo, lưu trú, trả phòng 3 bước + bill VI/EN + VietQR, CRM + bộ chọn khách, báo giá ngắn + giữ chỗ (vai sale/CTV), cấu hình căn + tham số, phê duyệt FOC, nhật ký tiền, thiết bị được cấp, dashboard + "Cần chú ý" (SSE). Trạng thái tải/rỗng/lỗi, bàn phím, VI/EN. Hỗ trợ MOB ở guest-web. Ước lượng FE theo màn **trong tuần 1** | UI UXD, OpenAPI, contracts sinh kiểu | `product/apps/admin-web/` |
| **MOB** | (1) PWA "OTTIMO Staff" (`apps/mobile`): việc hôm nay, trạng thái 10 căn + bộ lọc, đổi trạng thái buồng hợp lệ, checklist kiểm phòng, báo sự cố kèm ảnh nén, phiếu sửa (kỹ thuật), đọc offline + hàng đợi ghi offline nếu kịp (US-058). (2) guest-web (chính): mở bằng link/QR, check-in online nhiều bước (chuẩn hóa ảnh trên client theo SEC-01), thông tin lưu trú, gửi/xem yêu cầu, VI/EN; tuân P-R2-4. Ước lượng MOB theo màn **trong tuần 1** | UI UXD, OpenAPI | `product/apps/mobile/`, `product/apps/guest-web/` |
| **INT** | (1) Tuần 1: chép interface adapter (README 3.1–3.4, 3.6) vào `packages/contracts`; cài `scrubCardData`, `EnvCredentialProvider`; cùng BE cài `assertSafeConfig()`. (2) Adapter **Mock** cho channel manager (outbox lệnh đồng bộ, lỗi giả lập để thử BR-905), PaymentAdapter (VietQR: sinh chuỗi EMVCo đúng số tiền + nội dung), email (log). (3) Sửa BUG-R1-004 (`APP_ENV`). (4) Máy tính giá Beds24 và kiểm các điểm [Chưa xác minh] (báo no-show, hạn chế theo kênh) để chuẩn bị R3. (5) Sandbox thật chỉ khi INV đã cấp tài khoản (ESC-009/010) | INT README, ADR-011, ESC trả lời | `product/integrations/` |
| **OPS** | (1) Tuần 1 (việc chuyển R2): sinh và commit `pnpm-lock.yaml`, **bỏ nhánh cài không lockfile** ở CI và 2 Dockerfile (SEC-R1-24), `turbo prune @ottimo/api --docker`; **chạy thật CI** ngay khi máy có Node 22 + pnpm + Docker và có repo (đề xuất ESC repo GitHub riêng tư của OPS – ORC quyết tạo/gộp); bật chặn `contract-lint`; thêm job `api-contract` (openapi-spec-validator + `gen_traceability.py --strict`) **sau khi** BUG-R1-005 đóng (BUG-R1-021). (2) Staging: VPS theo ESC-002, Caddyfile production (CSP, HSTS, `Referrer-Policy: no-referrer`, 3 origin, che log `/g/*` và query, `/health` hạn chế – SEC-OPS-11/12), deploy tự động từ CI, migration là bước riêng, DNS + SPF/DKIM/DMARC cho email. (3) CODEOWNERS, branch protection, push protection, GHCR riêng tư (SEC-OPS-13); gitleaks trên image. (4) Runbook xoay KEK; sao lưu staging hằng ngày. (5) Quyết `@swc-node/register` cùng BE | hosting-plan, ci.yml, sec-findings | `.github/workflows/ci.yml`, `product/infra/`, `product/docs/hosting-plan.md`, `dev-setup.md` |
| **QA** | (1) Tuần 1 (việc chuyển R2): **seed DS-E và DS-0** (chốt quy ước mã DS-0 là nhãn seed – BUG-R1-016); **`product/tests/fixtures/br-examples.json`** (cùng DOM); script ma trận quyền tự sinh từ `x-roles`; **khung E2E Playwright + bộ smoke** (≈ 38 ca nhãn S); TC cho 2 mã lỗi mới (BUG-R1-007) và 17 `operationId` chưa có TC; chạy TC-X-050 (`docker compose up` + `/health`). (2) Bỏ ghi chú lệch tài liệu ở TC-L2-074 (BUG-R1-002 đã sửa); TC cho AC5a đơn dài hạn nhập tay. (3) Kiểm thử chức năng + hồi quy theo story (TC Cao trước khi PO nghiệm thu); smoke mỗi PR, TC Cao hằng đêm. (4) Ghi lỗi P0–P3, kiểm lại bản sửa | test-strategy, test case v0.2.1, traceability | `product/tests/`, `rounds/round-02/qa/test-report.md`, `qa/bug-list.md` |
| **SEC** | (1) Tuần 1: xác nhận điều kiện P-R2-4 (dời US-141). (2) Review code bảo mật theo PR cho: identity/phiên/CSRF, RLS + vai DB, guard `x-roles`/`x-visible-to`, C3 (mã hóa, nhật ký xem, thiết bị được cấp, xóa ảnh), guest link, upload ảnh, cấu hình. (3) Kiểm lại SEC-R1-24 khi OPS bỏ nhánh không lockfile. (4) Kiểm tra bảo mật staging cuối round (header, cookie, quyền theo vai, IDOR theo `property_id`/đơn của mình) | security-requirements, threat-model | `rounds/round-02/qa/sec-findings.md` |
| **DATA** | (1) Sửa BUG-R1-003 (mã lý do hủy K-22a theo BR-308). (2) Kiểm BE lưu đủ trường mục 9 của `metrics-definitions.md` từ R2 (trạng thái đơn, đêm OOO, phí kênh ước tính, `user_activity_day`…). (3) Đối chiếu K-01/K-02/K-03 đêm nay, S1c, S7 trên DS-0 với số tính tay | metrics-definitions, ERD | `product/docs/metrics-definitions.md`, `rounds/round-02/outputs/DATA/report.md` |
| **QC** | Cổng chất lượng theo mục 7 | Toàn bộ đầu ra R2 | `rounds/round-02/qc/qc-gate.md` |

### 3.2 Việc chuyển từ Round 1 – làm trong **tuần 1** R2 (gom từ `rounds/round-01/responses/*.md`, `qa/bug-list.md`, `qa/test-report.md`, `qa/sec-findings.md`)

| # | Việc | Vai | Nguồn | Điều kiện xong |
|---|---|---|---|---|
| W1 | Endpoint + enum nhóm đơn (SM-16) và đóng ca (SM-17) trong OpenAPI (hợp đồng, code R3) | ARC | ARC-responses mục 5; BUG-R1-010 | Spec hợp lệ, có `x-stories` US-140/US-124 |
| W2 | Giữ 0 operation lệch `x-roles` ↔ rbac (đã đạt cuối R1); phủ `x-rbac-field` mọi thuộc tính nhạy cảm | ARC + BA + QA | ARC report "Việc chưa xong"; BUG-R1-005, 006, 011, 012 | `gen_traceability.py --strict` exit 0 |
| W3 | Bỏ nhánh `--no-frozen-lockfile` (CI + 2 Dockerfile) sau khi commit lockfile; `turbo prune` | OPS (SEC kiểm) | OPS-responses SEC-OPS-05, ARC-OPS-06; SEC-R1-24 | SEC đóng SEC-R1-24 |
| W4 | Chạy thật CI (format, lint, test + PostgreSQL, build, Redocly, gitleaks, build ảnh + smoke `/health`) khi có Node/Docker và repo | OPS + QA | test-report mục 3; QC R1 C2 | Có link một lần chạy xanh; TC-X-050 Đạt |
| W5 | Bật chặn `contract-lint`; thêm job `api-contract` (sau W2) | OPS | ARC-OPS-08; BUG-R1-021 | CI đỏ khi OpenAPI cho thêm vai |
| W6 | Seed DS-E / DS-0 + quy ước mã DS-0 | QA (+ UXD) | QA report; BUG-R1-016 | `pnpm seed:ds-e`, `seed:ds-0` chạy được trên dev |
| W7 | `br-examples.json` (oracle cột ví dụ BR) | QA + DOM | test-strategy mục 3 | BE test unit đọc được file |
| W8 | Khung E2E Playwright + bộ smoke (S) chạy trong CI | QA | QA report | Smoke chạy mỗi PR (cho phép đỏ ở ca chưa có tính năng, đánh dấu skip) |
| W9 | Chép interface INT vào contracts; `scrubCardData`, `EnvCredentialProvider`, `assertSafeConfig()` | INT + BE | INT report; OPS-responses mục 5 | Build + test xanh |
| W10 | Chốt thẻ BE-ARC 01–07 | ARC + BE | BE-on-ARC giả định ước lượng | Không chốt → cộng 1–1,5 tuần BE (rủi ro R2-3) |
| W11 | Lỗi tài liệu R1 còn Open (P3): BUG-R1-014, 015, 017 (phần ARC), 023 | ARC, UXD, BA | bug-list | QA chuyển Closed |
| W12 | Áp phương án phạm vi vào backlog (R-C hoặc R-A/R-B) | PO | ESC-012 | Backlog cập nhật, QA sinh lại traceability |
| W13 | Ước lượng FE, MOB theo màn; BE xác nhận lại bảng mục 3.3 | FE, MOB, BE | – | ORC chốt lịch sprint |
| W14 | DNS email, chọn VPS staging (báo giá ≥ 2 hãng) | OPS | OPS report R4; INT-ARC-17 | Phụ thuộc ESC-002, ESC-010 |
| W15 | Step-up + `x-c3-log` + 401/403 cho `getDoorCredential`/`setDoorCredential` | ARC + BE (SEC kiểm) | BUG-R1-SEC-10 (P2); decision-log 16/10 | **Phải xong trước khi BE cài A21 (mã cửa)** |
| W16 | Đồng bộ `x-c3-log`, 401/403 cho mọi operation C3; thêm A119 vào `x-rbac` của `setParameter` | ARC | BUG-R1-SEC-11 (P3) | QA script + SEC xác nhận |
| W17 | `GUEST_CODE_SIGNING_KEY` vào `REQUIRED_SECRETS`; mỗi mục đích một khóa (ADR-013 điểm 5) | BE | BUG-R1-SEC-07 (phần BE) | Test config đỏ khi thiếu khóa |
| W18 | Đóng SEC-06, SEC-08 khi CI chạy xanh lần đầu (vai DB 4 vai trên PostgreSQL thật; quét bundle `__test__`) | OPS + SEC | BUG-R1-SEC-06, 08 | Gắn với W4 |

### 3.3 Ước lượng BE và chia luồng (phương án R-C)

Tổng **BE ≈ 16–21 tuần-người** (ESC-012 R-C; gốc ≈ 20–25 của bảng BE-on-ARC trừ khoảng 3–4 tuần phần dời). Bảng dưới là **chia tạm của PO** theo module của BE để lập lịch; **BE xác nhận lại trong tuần 1** (W13).

| # | Module (BE-on-ARC) | Gốc (R-A) | R-C | Phần dời ở R-C | Luồng |
|---|---|---|---|---|---|
| 1 | Nền tảng kỹ thuật | 3,0–3,5 | 3,0–3,5 | – | BE-A |
| 2 | identity | 1,0 | 1,0 | – | BE-B |
| 3 | platform | 0,5–0,75 | 0,5–0,75 | – | BE-B |
| 4 | reservations + giá + báo giá + giữ chỗ | 4,0–5,0 | 2,75–3,5 | Báo giá dài hạn, sinh HĐ + lịch kỳ thu (thêm nhẹ: đơn dài hạn nhập tay) | BE-A |
| 5 | frontdesk + folio + VietQR | 2,0–2,5 | 2,0–2,5 | US-119 AC5 (nhỏ) | BE-B |
| 6 | registration + C3 | 1,75–2,25 | 1,75–2,25 | – | BE-B |
| 7 | housekeeping + maintenance + inventory | 1,5–2,0 | 1,5–2,0 | – | BE-B |
| 8 | guests | 0,5–0,75 | 0,5–0,75 | – | BE-B |
| 9 | guest-portal + messaging + doorlock | 1,5–2,0 | 0,5–0,75 | OTP/mã lễ tân, folio khách, mã cửa, mẫu tin | BE-B |
| 10 | reporting R2 + SSE | 1,0–1,25 | 0,75–1,0 | Nhắc kỳ thu/gia hạn | BE-A |
| 11 | worker J1–J18 phần R2 + outbox Mock | 1,5–2,0 | 1,0–1,25 | J12 kỳ thu, nhắc gia hạn | BE-A |
| 12 | Ổn định cuối round | 1,5–2,0 | 1,25–2,0 | Chia đều 2 luồng | A + B |
| | **Tổng** | **≈ 20–25** | **≈ 16,5–21,25 (≈ 16–21)** | | A ≈ 8–10 · B ≈ 8,5–11 |

- **Giả định lịch**: ORC chạy **2 luồng BE song song** (BE-A, BE-B – theo đề xuất trong BE-on-ARC) → R2 khoảng **10–11 tuần lịch** gồm tuần 1. Chỉ 1 luồng BE thì R2 khoảng **4–5 tháng lịch** – ORC phải báo trong `round-summary` và cân nhắc R-B. Chạy 2 luồng là việc của ORC; nếu phát sinh chi phí thì báo ESC riêng (ESC-012 R-A).
- BE-B phụ thuộc phần nền của BE-A (migration, guard, giao dịch có ngữ cảnh) → tuần 1–2 BE-B làm identity/platform/guests trên khung nền được BE-A giao sớm theo từng phần (bộ khung migration + guard trước hết).
- Chưa gồm: adapter thật (INT), FE/MOB (ước ở W13), staging/CI (OPS).

## 4. Thứ tự chạy (bước 2 Sản xuất – theo sprint 2 tuần)

Thứ tự theo PRD D6: EP00 → EP02/EP11 (đơn, chống trùng, giữ chỗ) → EP03–EP05 → EP06 → EP07/EP08 → EP14 → phần còn lại. Mỗi story đi đủ: code + test → review PR (mục 5) → QA chạy TC Cao trên staging → PO nghiệm thu.

| Đợt | Tuần (dự kiến) | Nội dung | Vai chính | Mức "đủ dùng" để đợt sau bắt đầu |
|---|---|---|---|---|
| **Đợt 0 – Khởi động** | 1 | Việc chuyển R1 (mục 3.2, W1–W14); BA specs EP00/EP02; UXD hi-fi EP00/EP02; BE-A khung nền (migration, vai DB, RLS, guard, Clock) | ARC, OPS, QA, INT, BA, UXD, PO, BE | CI xanh trên khung; OpenAPI 0.3 không lệch rbac; seed DS-E; `br-examples.json` bản 1; phạm vi R2 áp vào backlog |
| **Sprint 1** | 2–3 | EP00 nền tảng (US-001…007, 135, 142), platform, guests (US-071…073); FE đăng nhập, điều hướng vai, cấu hình căn/tham số, CRM; staging dựng lần đầu | BE-A, BE-B, FE, OPS | Đăng nhập 8 vai trên staging; guard quyền chạy từ spec; deploy tự động |
| **Sprint 2** | 4–5 | EP02 + EP11 phần R2 + US-139: rack, tạo/đổi/hủy đơn, chống trùng + test đồng thời, OOO, no-show, báo giá ngắn, giữ chỗ + hết hạn, xác nhận cọc, đơn dài hạn nhập tay; FE rack + đơn + sale | BE-A, BE-B (folio nền), FE | Đặt + giữ chỗ + chống trùng chạy trên staging; QA smoke chống trùng xanh |
| **Sprint 3** | 6–7 | EP03–EP05 + EP15 + EP06: nhận phòng, lưu trú, trả phòng 3 bước, bill, VietQR, thu tiền + chờ đối soát, giấy tờ C3 + đối chiếu + khai báo + xóa ảnh; MOB guest-web check-in online (đẩy sớm vì cần cho nhận phòng) | BE-B, BE-A (job, SSE), FE, MOB | Luồng A1 (mục 7) chạy được lần đầu trên staging |
| **Sprint 4** | 8–9 | EP07/EP08 (PWA buồng phòng, phiếu sửa), EP14 còn lại (thông tin lưu trú, yêu cầu khách + định tuyến), EP01 dashboard + "Cần chú ý" + SSE; Should R2 nếu dư | BE-A, BE-B, MOB, FE | Mọi story R2 ở trạng thái "Đang nghiệm thu" |
| **Ổn định + bước 3–6** | 10–11 | Review cuối round, sửa thẻ Blocker/Major, hồi quy toàn bộ + E2E 7 luồng, test hiệu năng rack (p95), SEC kiểm staging, UXR test kịch bản, PO nghiệm thu nốt, QC gate | Mọi vai | Mục 7 |

Ghi chú:
- UXD đi trước dev **một sprint** (hi-fi + chuỗi VI/EN của sprint sau xong trước khi sprint đó bắt đầu); BA specs cũng vậy.
- Nếu một vai bị chặn: ghi report, làm tiếp với giả định có nhãn; chỉ ESC "Gấp" mới dừng việc.
- Đổi contract API phải qua ARC và báo FE/MOB/BE/INT/QA trong ngày.

## 5. Ma trận review chéo áp dụng Round 2 (bước 3)

Review chạy **liên tục theo PR** (bắt buộc trước khi gộp) và **một lượt tổng cuối round**. Thẻ theo định dạng protocol mục 6; tác giả trả lời trong `responses/<TÁC_GIẢ>-responses.md`; Blocker/Major phải xử lý trong round.

| Tác giả → sản phẩm | Review bắt buộc | Review khuyến nghị | File review cuối round |
|---|---|---|---|
| BE → API, DB, job | ARC, QA | **SEC (bắt buộc với PR chạm C3, phiên, RLS, quyền)** | `BE-on-…` → `ARC-on-BE.md`, `QA-on-BE.md`, `SEC-on-BE.md` |
| FE → admin-web | UXD, QA | ARC, **DOM (bill, phụ thu, khai báo)** | `UXD-on-FE.md`, `QA-on-FE.md` |
| MOB → PWA nhân viên, guest-web | UXD, QA | ARC, **SEC (guest-web, upload ảnh)** | `UXD-on-MOB.md`, `QA-on-MOB.md` |
| INT → adapter Mock, VietQR | ARC, SEC | BE, DOM | `ARC-on-INT.md`, `SEC-on-INT.md` |
| OPS → CI, staging, Caddy | ARC, SEC | – | `ARC-on-OPS.md`, `SEC-on-OPS.md` |
| ARC → OpenAPI 0.3, ADR mới | BE, SEC | FE, MOB, INT | `BE-on-ARC.md`, `SEC-on-ARC.md` |
| UXD → UI hi-fi, chuỗi | UXR, PO | FE, MOB, DOM | `UXR-on-UXD.md`, `PO-on-UXD.md` |
| BA → specs phân hệ, sửa SM/RBAC | DOM, ARC | QA | `DOM-on-BA.md`, `ARC-on-BA.md` |
| PO → backlog (áp phạm vi, AC5a) | BA, DOM | ARC, UXD | `BA-on-PO.md`, `DOM-on-PO.md` |
| QA → test report, TC mới, seed | BA, PO | QC | `BA-on-QA.md`, `PO-on-QA.md` |
| SEC → sec-findings R2 | ARC | OPS | `ARC-on-SEC.md` |
| UXR → usability-report-r2 | PO, UXD | DOM | `PO-on-UXR.md`, `UXD-on-UXR.md` |
| DATA → kiểm trường + K-01…03 | PO | BE | `PO-on-DATA.md` |
| QC → qc-gate | ORC | PO | – |

Ngoài review: **PO nghiệm thu từng story** trên staging (P-R2-7) – kết quả ở `outputs/PO/acceptance.md`.

## 6. Bước 5 (Kiểm thử) Round 2
- Chức năng: TC Cao của mọi story R2 trên staging (DS-E + dữ liệu tự tạo; DS-0 cho E2E/demo), đồng hồ giả lập cho ca theo giờ.
- Hồi quy: bộ smoke mỗi PR; TC Cao hằng đêm; hồi quy đầy đủ ở tuần 10–11.
- Quyền: ma trận tự sinh từ `x-roles`/rbac cho 8 vai + khách; kiểm server từ chối và ghi nhật ký.
- Đồng thời: chống trùng (2 phiên lưu cùng lúc), duyệt FOC, thu tiền (khóa folio).
- E2E: 7 luồng mục 7 nhóm A (Playwright – máy quầy 1366×768, di động 390×844, 360×800), axe-core.
- Hiệu năng: p95 rack và tạo đơn theo ngân sách `architecture.md` mục 16 (k6 mức nhẹ).
- SEC: review code + kiểm staging (mục 3.1).

## 7. Tiêu chí QC ĐẠT Round 2 – "luồng chính chạy từ đầu đến cuối"

QC chấm từng dòng ĐẠT / KHÔNG. **ĐẠT** = mọi dòng nhóm A–C đạt và không còn thẻ Blocker/Major Open. **ĐẠT CÓ ĐIỀU KIỆN** = nhóm A và B đạt, nhóm C thiếu ≤ 2 dòng có kế hoạch xử lý đầu R3. Còn lại **KHÔNG ĐẠT**. (Nếu INV chọn R-A/R-B, nhóm A đổi theo mục 2.4.)

### A. Luồng chính chạy từ đầu đến cuối trên **staging** (E2E tự động + QA chạy tay một lần có ghi hình/ảnh)
- [ ] A1. **Khách ngắn ngày trực tiếp**: sale báo giá ngắn ngày → giữ chỗ (căn bị chặn bán) → VietQR cọc → xác nhận cọc → `confirmed` → khách check-in online qua link (VI/EN) → lễ tân nhận phòng (giấy tờ, đối chiếu, đồng ý lưu ảnh, khai báo bán tự động `sent` → `confirmed`) → lưu trú (thêm phát sinh, gia hạn 1 đêm, yêu cầu khách) → trả phòng 3 bước (minibar, phụ thu trả muộn, FOC có duyệt) → bill VI/EN đúng công thức + số bill `F26-xxxxxx` → thu nốt bằng VietQR/ghi thu → hoàn tất → buồng `VD` + việc dọn tự sinh → buồng phòng dọn, kiểm checklist trên PWA → `VI`. Mọi số tiền khớp `br-examples.json`.
- [ ] A2. **Đơn OTA**: lễ tân nhập đơn Booking.com (OTA thu hộ) → có lệnh đồng bộ (Mock) → nhận/trả phòng chỉ thu phát sinh; nhập đơn OTA thứ hai trùng căn – đêm → cờ xung đột, làn "Chưa gán căn", báo đỏ, gợi ý căn → gán căn khác → chặn nhận phòng khi chưa gán.
- [ ] A3. **Chống đặt trùng**: 2 phiên lưu cùng căn – đêm đồng thời → đúng 1 đơn thành công, phiên kia nhận `409 ROOM_UNAVAILABLE` + gợi ý; giữ chỗ quá hạn tự hủy theo job và mở phòng.
- [ ] A4. **Sự cố & khóa phòng**: buồng phòng báo sự cố trên PWA (ảnh) → phiếu sửa + khóa OOO → căn không bán được trên rack, khi kiểm trùng, khi tính phòng trống → kỹ thuật đóng phiếu → căn `VD` → dọn → bán lại.
- [ ] A5. **Hủy / no-show / khôi phục**: hủy đơn có lý do + phí theo BR-309/310; no-show sau mốc BR-311 (không tự đánh dấu) → khôi phục trong ngày nghiệp vụ, khai báo dùng lại bản ghi (SM-05 K12).
- [ ] A6. **Phân quyền & dữ liệu nhạy cảm**: 8 vai đăng nhập, mỗi vai chỉ thấy/làm đúng rbac (server từ chối + ghi nhật ký); C3 chỉ mở trên thiết bị được cấp, mỗi lần xem có `c3_access_log`; CTV chỉ thấy báo giá/đơn của mình; app khách không lộ dữ liệu nhạy cảm (P-R2-4).
- [ ] A7. **Chủ đầu tư đầu ngày**: KPI đêm nay (K-01/K-02/K-03) và "Cần chú ý" khớp số tính tay trên DS-0 (DATA đối chiếu); nhật ký thao tác tiền đủ người – thời điểm – giá trị cũ/mới.

### B. Chất lượng kỹ thuật
- [ ] B1. CI chạy thật và **xanh** trên nhánh chính: format, lint, typecheck, unit + API trên PostgreSQL, quyền tự sinh, `api-contract`, `contract-lint` (chặn), gitleaks, `pnpm audit`, build ảnh, smoke `/health`, E2E smoke. Không còn nhánh cài không lockfile.
- [ ] B2. **0 lỗi P0/P1 Open** trong `rounds/round-02/qa/bug-list.md`; P2 Open có kế hoạch.
- [ ] B3. SEC: không còn phát hiện mức Critical/High Open; review bảo mật đã làm cho mọi PR chạm C3, phiên, RLS, quyền, guest link.
- [ ] B4. Test tự động cho logic chính: mọi BR có ví dụ số thuộc story R2 có test đọc `br-examples.json`; test đồng thời chống trùng/FOC/thu tiền; test RLS 2 cơ sở.
- [ ] B5. Staging deploy tự động từ CI (migration là bước riêng), Caddyfile production đúng SEC-OPS-11/12; không có khóa/mật khẩu thật trong repo.

### C. Definition of Done & tài liệu
- [ ] C1. 100% story trong phạm vi R2 (mục 2.1) có PO **Accepted** trên staging; story Trả lại đã sửa hoặc ghi dời có lý do.
- [ ] C2. Giao diện đúng Design System; mọi màn R2 có trạng thái tải/rỗng/lỗi (PWA có mất mạng); VI + EN đủ chuỗi; axe-core không lỗi mức nghiêm trọng ở 7 luồng.
- [ ] C3. Tài liệu cập nhật khớp code: OpenAPI 0.3 (không lệch rbac – `--strict` exit 0), ERD/migration, specs BA, `dev-setup.md`, hosting-plan (staging), traceability sinh lại.
- [ ] C4. Không còn thẻ Blocker/Major Open; mọi Rejected có lý do.
- [ ] C5. UXR có `usability-report-r2.md` với ≥ 3 kịch bản (lễ tân, buồng phòng, khách check-in online) và danh sách việc sửa cho R3.
- [ ] C6. Có `rounds/round-03/plan.md` dự thảo (PO + ORC), gồm các phần dời theo phương án INV chọn.

## 8. Phụ thuộc vào ESC (INV trả lời)

| ESC | Ảnh hưởng R2 | Nếu chưa trả lời |
|---|---|---|
| **ESC-012** (phạm vi R2, MVP, logo) | Chọn R-A/R-B/R-C | Theo R-C (dự thảo này); logo L-A |
| **ESC-002** (vị trí máy chủ, chi phí hosting, tên miền) | Dựng staging (tuần 2–3) | OPS chuẩn bị theo phương án A (VN). **Chưa trả lời hết tuần 2 → ORC nâng thành "Gấp"** vì chặn A1–A7 trên staging; tạm chạy E2E trên môi trường Docker dùng một lần trong CI |
| **ESC-010** (tài khoản bên thứ ba) | Tài khoản nhận VietQR thật, email SES, DNS | VietQR dùng số tài khoản thử (placeholder); email Mock ghi log |
| **ESC-003** (kiểm chứng người dùng thật) | Ưu tiên UX, H-05 buồng phòng tự dùng app | Làm theo persona mô phỏng; UXR test kịch bản trên staging |
| ESC-004 … ESC-008 (chính sách giá, dài hạn, hủy, phụ thu/FOC, VAT) | Giá trị tham số | Dùng mặc định trong BR (đã cấu hình được – US-005); INV trả lời chỉ đổi tham số |
| ESC-001 (luật sư dữ liệu cá nhân) | Hạn lưu ảnh, hạn khai báo khách NN | Mặc định hiện hành trong BR/SEC |
| ESC-009 (channel manager), ESC-011 (khóa cửa) | Không ảnh hưởng R2 (Mock / nhập tay) | – |
| Đề xuất ESC của OPS: repo GitHub riêng tư (OPS-responses mục 6 – ORC chưa tạo/gộp) | Chạy CI thật (W4) | ORC quyết tạo ESC mới hoặc gộp vào ESC-002; không có repo thì CI chạy cục bộ khi máy có Node/Docker – B1 có nguy cơ không đạt |

## 9. Rủi ro và giả định

### 9.1 Rủi ro
| # | Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|---|
| R2-1 | Chỉ chạy được 1 luồng BE | R2 kéo dài 4–5 tháng lịch | ORC chốt tuần 1; nếu 1 luồng → đề xuất INV R-B hoặc chia R2 thành 2 mốc demo |
| R2-2 | Máy chưa có Node/pnpm/Docker, chưa có repo | CI không chạy, B1 không đạt | W4 ưu tiên số 1 tuần 1; INV cài công cụ; ESC repo của OPS |
| R2-3 | Thẻ BE-ARC 01–07 chưa chốt tuần 1 | +1–1,5 tuần BE | ARC chốt trong 3 ngày đầu (W10) |
| R2-4 | FE/MOB chưa có ước lượng | Lịch sprint có thể vỡ ở phía giao diện | W13; UXD đi trước một sprint |
| R2-5 | Staging chậm do ESC-002 | A1–A7 không chạy trên staging | Nâng "Gấp" hết tuần 2; dùng môi trường CI dùng một lần |
| R2-6 | Dời US-141 nhưng app khách vẫn lộ dữ liệu nhạy cảm | Rủi ro dữ liệu cá nhân | P-R2-4: SEC xác nhận tuần 1, review bắt buộc PR guest-web |
| R2-7 | Đơn dài hạn nhập tay (AC5a) sinh dữ liệu phải chuyển đổi ở R3 | Thêm việc R3 | Cờ "HĐ ngoài hệ thống" để lọc và chuyển; ARC thiết kế để chuyển sang HĐ không đổi `reservation_id` |
| R2-8 | Chính sách INV trả lời giữa round khác mặc định | Sửa test, ví dụ BR | Chỉ đổi tham số + `br-examples.json`; DOM cập nhật BR |

### 9.2 Giả định dùng cho Round 2
- `[GIẢ ĐỊNH – chờ INV qua ESC-012]` Phạm vi R2 theo R-C (decision-log PO 15/10).
- `[GIẢ ĐỊNH – ORC xác nhận]` 2 luồng BE song song, R2 ≈ 10–11 tuần lịch.
- `[GIẢ ĐỊNH – chờ INV qua ESC-002]` Staging trên 1 VPS tại Việt Nam, trong ngân sách ≤ 1 tr/tháng (ADR-010).
- `[GIẢ ĐỊNH – chờ INV qua ESC-010]` VietQR dùng tài khoản thử ở R2; tài khoản thật điền vào cấu hình khi INV cấp.
- Mọi con số quy tắc là tham số mặc định chờ ESC-004…008 (như R1).
- Ngôn ngữ R2: VI + EN; tiếng Nga ở R3 (US-115) – mẫu tin RU dời cùng US-125.
