# Chiến lược kiểm thử – OTTIMO Desk

- Tác giả: QA | Round 1 – Bước 4 (Phản hồi & sửa) | Ngày: 15/10/2026 | Phiên bản: 0.2 (sửa theo review BA, PO – `rounds/round-01/responses/QA-responses.md`)
- Thay đổi bản 0.2: kiểm quyền lấy **rbac-matrix** làm chuẩn (tầng R, C + kiểm tĩnh mới); truy vết **chuyển trạng thái → TC**; nhãn `[BLOCKED]`/`[UNDECIDED]`/`[GIẢ ĐỊNH QA]`; bộ **Smoke**; bước **PO nghiệm thu**; áp quyết định 15/10 (OOO nửa mở, BR-603 +12 giờ, ngày nghiệp vụ 06:00, đơn OTA nhập tay căn kín → 409, màn mặc định "Hôm nay", OTP/mã lễ tân, thiết bị được cấp, `MutableClock`, xóa ảnh ngay khi `confirmed`); ca bảo mật SR-SES/SR-DEV/SR-GST.
- Nguồn: `03-backlog/backlog.md` (US-xxx, AC), `business-rules.md` (BR-xxx – nguồn sự thật mọi con số), `state-machines.md` (SM-xx, mã chuyển B/K/R/O/W/A…), `rbac-matrix.md` (vai, A-xx, S-xx, Dxx), `use-cases.md`, `erd.md` (ràng buộc K1–K10), `api/openapi.yaml` (operationId, mã lỗi), `architecture.md` (job J1–J23, ngân sách hiệu năng mục 16), ADR-008 (Clock), ADR-009 (chống đặt trùng, idempotency), `security/data-risk-assessment.md` (R-REG, R-PAY, T01–T18, F01–F14), `round-0-baseline.md` (**BL**), wireframe L1–L8.
- Tài liệu đi kèm: `product/tests/test-cases/r1-main-flows.md` (test case), `product/docs/qa/traceability.md` (ma trận truy vết).
- Tài liệu này **không chép con số nghiệp vụ** làm quy tắc. Khi test case ghi một con số (ví dụ 210.000 đ), đó là **kết quả mong đợi tính từ tham số mặc định của BR** tại ngày 15/10/2026; DOM đổi BR thì QA cập nhật kết quả mong đợi, không đổi bước test.

## 1. Mục tiêu và phạm vi

### 1.1 Mục tiêu
1. Không để lọt lỗi **P0** (đặt trùng, sai tiền, mất dữ liệu, lộ dữ liệu C3) vào bản dùng thử của chủ đầu tư.
2. Mỗi tiêu chí nghiệm thu (AC) của story Must có **ít nhất 1 test case**; mỗi **chuyển trạng thái** của `state-machines.md` thuộc phạm vi round có ≥ 1 test case; mỗi lỗi BL 8.2 loại "Sửa" có test chống tái phát **trước khi story liên quan vào round** (round dự kiến từng lỗi: `traceability.md` mục 4; BL #11, #14, #22 thuộc story R3).
3. Kiểm thử **ở server** mọi quy tắc tiền, tồn phòng, phân quyền – giao diện chỉ là lớp phụ (rbac-matrix mục 8).
4. Mốc giờ (giữ chỗ, khai báo, no-show, nhắc trả phòng) được kiểm **xác định** bằng đồng hồ giả (ADR-008), không chờ giờ thật.

### 1.2 Trong phạm vi theo round
| Round | Đối tượng kiểm thử | Hình thức |
|---|---|---|
| R1 (tài liệu) | PRD, backlog, BR, BA (SM, RBAC, UC), ERD, OpenAPI, wireframe, khung repo | Kiểm truy vết, kiểm nhất quán chéo, chạy CI khung + `health` (plan R1 mục 6) |
| R2 (lõi MVP) | 77 story Must R2: rack, đặt/giữ chỗ, nhận/trả phòng, folio, thu tiền (VietQR, ghi tay), khai báo bán tự động, buồng phòng, bảo trì, app khách VI/EN, phân quyền | Unit + API + E2E + kiểm thử thủ công khám phá; đồng thời; mốc giờ |
| R3 (RC) | Story Must R3 (dài hạn quyết toán, OTA thật qua channel manager, MISA, RU, xung đột OTA, quyền chủ thể dữ liệu) + hồi quy toàn bộ | Hồi quy, hiệu năng (k6), đa ngôn ngữ, thiết bị, mất mạng, bảo mật cùng SEC |
| R4+ | Lỗi chủ đầu tư báo | Tái hiện → test chống tái phát → xác nhận bản sửa |

### 1.3 Ngoài phạm vi (và lý do)
- Kết nối thật với VNPay/MoMo/MISA/channel manager/khóa cửa ở R2 – chỉ adapter `Mock` (ADR-011); sandbox thật cần tài khoản INV cấp (ESC-009, ESC-010, ESC-011) → kiểm ở R3 nếu có tài khoản.
- Cổng khai báo Bộ Công an: không có API (BR-606) – chỉ kiểm phần app chuẩn bị dữ liệu, sao chép, ghi mã hồ sơ.
- Kiểm thử xâm nhập chuyên sâu – SEC phụ trách; QA chạy các ca phân quyền và rò dữ liệu ở mức chức năng.
- Thiết bị khóa cửa thật, máy in, máy POS ngân hàng.

## 2. Các tầng kiểm thử

| Tầng | Công cụ (ADR-012) | Đặt ở đâu | Phạm vi | Ai viết | Chạy khi nào |
|---|---|---|---|---|---|
| **U – Unit** | Vitest | cạnh mã nguồn từng package (vd. `services/api/test/`) | Bộ tính giá (BR-101…112, 201…215), phụ thu (BR-411…416), hạn giữ chỗ/khai báo (BR-302, 602, 603), làm tròn (BR-005), máy trạng thái SM-01…15 (bảng chuyển hợp lệ/cấm), chuẩn hóa định danh (BR-951, 952) | Dev (BE/FE/MOB); QA review | Mỗi commit (CI) |
| **A – API/tích hợp** | Vitest + HTTP client trên **PostgreSQL thật** (CI service `postgres:17`), DB `ottimo_test` | `services/api/test/` (tích hợp) + `product/tests/api/` (QA, R2) | Mọi endpoint OpenAPI: mã lỗi `Problem.code`, `allowedActions[]`, lọc trường `x-visible-to`, `x-roles` → 403, phạm vi `x-scope` → 404, ràng buộc DB K1–K10, idempotency, `If-Match`, outbox sinh lệnh đồng bộ | BE viết test cho logic chính; QA viết ca nghiệp vụ, phân quyền, đồng thời | Mỗi PR |
| **C – Hợp đồng** | Kiểm phản hồi theo `openapi.yaml` (ajv / openapi-response-validator) | `product/tests/api/contract/` | Mọi phản hồi 2xx/4xx khớp schema; không có trường thừa ngoài `x-visible-to` của vai. **Lưu ý**: tầng C chỉ chứng minh "server khớp OpenAPI"; việc "OpenAPI khớp quyền nghiệp vụ" do bước kiểm tĩnh (tầng R, TC-RB-023) đảm nhận | QA | Mỗi PR |
| **R – Ma trận quyền** | (1) **Kiểm tĩnh** `gen_traceability.py --strict`: tra `x-rbac` của mỗi operation trong **rbac-matrix** (nguồn chuẩn: `rbac-matrix.json` do BA xuất cho A-xx; `rbac-matrix.md` cho S-xx và Dxx), so tập vai với `x-roles`, ô M với `x-scope`, Dxx với `x-visible-to`. (2) **Ca động** sinh từ rbac-matrix (không từ `x-roles`): operation × 8 vai + khách | `product/tests/tools/`, `product/tests/api/rbac/` | (1) OpenAPI cho thêm vai so với rbac → CI đỏ, lỗi tài liệu P1 (P0 nếu C3); (2) vai rbac ✖ → 403 `FORBIDDEN_ACTION` + 1 dòng `audit_event`; ô M ngoài phạm vi → 404; endpoint C3 từ thiết bị chưa cấp → 403 `DEVICE_NOT_TRUSTED` (TC-RB-018, TC-RB-023, TC-SEC-010) | QA | Mỗi PR |
| **E – E2E** | Playwright: Chromium (máy quầy 1366×768), WebKit di động 390×844 và Chromium Android 360×800 | `product/tests/e2e/` | Luồng L1–L8 từ đầu đến cuối; trạng thái tải/rỗng/lỗi/mất mạng; bàn phím; axe-core (WCAG 2.2 AA) | QA | Mỗi PR (bộ smoke), hằng đêm (đầy đủ) |
| **P – Hiệu năng** | k6 | `product/tests/load/` | Ngân sách `architecture.md` mục 16 + kịch bản tranh chấp (mục 7) | QA (+ OPS dựng môi trường) | R3; bản rút gọn chạy hằng tuần từ cuối R2 |
| **M – Thủ công khám phá** | Danh sách kiểm (checklist) theo persona | `rounds/round-<n>/qa/test-report.md` | Trải nghiệm lễ tân vội, buồng phòng tay ướt, khách nói tiếng Anh/Nga, mạng chập chờn | QA | Cuối mỗi đợt sản xuất R2–R3 |

Quy tắc phân bổ: **quy tắc tiền và thời gian kiểm chính ở tầng U** (bảng dữ liệu từ cột "Mặc định & ví dụ số" của BR – mỗi ví dụ BR là 1 dòng test); **quyền và tồn phòng kiểm chính ở tầng A** (vì phải đúng ở server); **E2E chỉ phủ đường chính + vài ngoại lệ quan trọng** để bộ test không chậm và giòn.

### 2.0 Truy vết ba chiều (script)
`product/tests/tools/gen_traceability.py` sinh `traceability.md` gồm: AC → TC (kèm chỉ số "AC có TC **chạy được ở R2 với kỳ vọng xác định**" – loại TC mang nhãn `[BLOCKED: …]`/`[UNDECIDED: …]`); **chuyển trạng thái → TC** (đọc bảng chuyển của mọi máy SM trong `state-machines.md`, ô trống ghi **TRỐNG**; TC khai báo chuyển ở cột Quy tắc bằng `SM-xx <mã>` hoặc `SM-xx từ→đến`); kiểm tĩnh quyền rbac ↔ OpenAPI; cột "ESC liên quan" cho từng story. Ma trận cuối cùng chỉ sinh ở bước 5 sau khi mọi vai sửa xong.

### 2.1 Bộ "oracle" từ ví dụ BR
QA lập (R2, tuần đầu) file `product/tests/fixtures/br-examples.json`: mỗi dòng = mã BR, đầu vào, kết quả mong đợi lấy đúng cột ví dụ của `business-rules.md` (vd. BR-411: giá 700.000, nhận 11:00 → 210.000). Test unit của BE đọc file này. Khi DOM sửa ví dụ BR, chỉ cần sửa file này → mọi tầng tự cập nhật. Đây là cách đáp ứng quy ước "khớp ví dụ BR-xxx" của backlog.

## 3. Môi trường kiểm thử

| Môi trường | Dựng bằng | Dữ liệu | Đồng hồ | Dùng cho |
|---|---|---|---|---|
| **Local dev** | `pnpm dev` (Docker Compose – `dev-setup.md`) | Seed DS-E / DS-0 (mục 4) | `CLOCK_OVERRIDE` | Dev + QA chạy thử nhanh |
| **CI** | GitHub Actions (`.github/workflows/ci.yml`) + service PostgreSQL 17 | DB tạo mới mỗi lần chạy, seed DS-E | `FixedClock` (unit) + `MutableClock` (API/E2E) | U, A, C, R, E (smoke) |
| **Staging** (R2, OPS dựng – `hosting-plan.md`) | Docker trên VPS (ADR-010) | Seed DS-0, reset theo yêu cầu QA | Đồng hồ điều khiển được (mục 5) | E2E đầy đủ, khám phá, demo cho PO/QC |
| **Perf** (R3) | Bản sao staging, cùng cấu hình máy chủ dự kiến production | DS-0 × nhân bản lịch sử 12 tháng | Thật | k6 |

Thiết bị/trình duyệt tối thiểu (PRD N2, ADR-005/006): Chrome bản mới trên Windows/macOS (lễ tân); Safari iOS 17+ và Chrome Android 10+ màn 360px (buồng phòng, sale, khách); thêm 1 máy Android tầm trung thật ở R3 (mục 10 – cần INV hoặc đội có thiết bị).

Tích hợp ở R2: mọi adapter chạy `mock`/`manual` (`.env.example`); QA kiểm **lệnh đã sinh** (bảng `outbox_message`, `integration_log`) thay vì kết quả bên thứ ba. Không dùng khóa thật trong mọi môi trường test.

## 4. Dữ liệu kiểm thử

Nguyên tắc: **dữ liệu giả**, không dùng dữ liệu khách thật; số giấy tờ, SĐT, email đều bịa và đánh dấu tiền tố `TEST`. Seed nằm ở `product/tests/fixtures/` (R2), mật khẩu tài khoản test ghi trong file seed (không ghi trong tài liệu hay chat).

### 4.1 Hai bộ dữ liệu chuẩn
- **DS-E (rỗng)**: 1 cơ sở "OTTIMO Đà Lạt" (`Asia/Ho_Chi_Minh`), 10 căn BL 4.1, nhóm căn, tham số mặc định đúng BR mục 13, kênh và tỷ lệ phí BR-901, danh mục minibar 17 món BL 4.13, danh mục phí BR-511/512, checklist BR-808, tài khoản mục 4.3. **Không có đơn**. Dùng cho test API/ unit cô lập – mỗi test case tự tạo dữ liệu ghi ở cột "Tiền điều kiện".
- **DS-0 (mẫu BL)**: DS-E + dữ liệu mẫu prototype quy đổi về ngày thật với **T0 = Thứ Năm 15/10/2026** (BL 4.4; mốc "ngày 0" của prototype). Dùng cho E2E và demo.

### 4.2 Danh mục căn (BL 4.1) và đơn mẫu DS-0
| Căn | Tên | Nhóm | Giá tháng | Giá đêm niêm yết (BR-101) |
|---|---|---|--:|--:|
| 101 | The Amber | Lầu 1–2 | 8.000.000 | 667.000 |
| 102 | The Fern | Lầu 1–2 | 9.000.000 | 750.000 |
| 103 | The Bloom | Lầu 1–2 | 9.000.000 | 750.000 |
| 201 | The Mist | Lầu 1–2 | 8.500.000 | 708.000 |
| 202 | The Valley | Lầu 1–2 | 9.500.000 | 792.000 |
| 203 | The Sage | Lầu 1–2 | 9.500.000 | 792.000 |
| 301 | The Velvet | Căn N | 11.500.000 | 958.000 |
| 302 | The Ivory | Căn N+ | 11.000.000 | 917.000 |
| 401 | The Pine | Căn N | 12.500.000 | 1.042.000 |
| 402 | The Ember | Căn N+ | 12.000.000 | 1.000.000 |

Đơn mẫu DS-0 (BL 4.4, ngày đi = ngày trả phòng, khoảng `[đến, đi)` BR-002):
| Mã | Căn | Kênh | Đến → Đi | Trạng thái | Ghi chú |
|---|---|---|---|---|---|
| OTM-0142 | 101 | Airbnb | 13/10 → 17/10 | `in_house` | 2 khách |
| OTM-0108 | 102 | HĐ dài hạn | 05/09 → 04/12 | `in_house` | Emma (NN), dọn 2 lần/tuần T2, T5 |
| OTM-0150 | 103 | Booking.com | 15/10 → 18/10 | `confirmed` | đến hôm nay, ETA 14:00 |
| OTM-0139 | 201 | Agoda | 12/10 → 15/10 | `in_house` | đi hôm nay |
| OTM-0151 | 202 | Trực tiếp | 16/10 → 20/10 | `confirmed` | cọc **1.000.000** (BR-305: 30% × 4 × 792.000 = 950.400 → làm tròn 100.000) |
| OTM-0153 | 203 | Booking.com | 19/10 → 22/10 | `confirmed` | Ji-woo Park, 820.000/đêm |
| OTM-0091 | 301 | HĐ dài hạn | 01/08/2026 → 01/08/2027 | `in_house` | Daniel (NN), thuê 11.130.000, ký quỹ 22.300.000 |
| OTM-0152 | 302 | Trực tiếp | 15/10 → 19/10 | `confirmed` | 4 khách, ETA 15:30 |
| (khối OOO) | 401 | – | 15/10 → 17/10 | `active` | WO-031 bình nóng lạnh – **xem lưu ý OOO ở mục 4.4** |
| OTM-0154 | 401 | Airbnb | 17/10 → 21/10 | `confirmed` | |
| OTM-0146 | 402 | Airbnb | 14/10 → 18/10 | `in_house` | |
| OTM-0155 | 201 | CTV / môi giới | 17/10 → 19/10 | `confirmed` | CTV Minh Anh chốt, cọc 500.000 |
| OTM-0156 | 101 | Booking.com | 18/10 → 21/10 | `confirmed` | |
| OTM-0136, OTM-0137 | 203, 103 | Trực tiếp, Agoda | đã trả 14/10 | `checked_out` | dùng cho test ảnh giấy tờ/khóa bill |
| OTM-0157, 0158, 0159 | 302, 203, 402 | Agoda, Airbnb, Trực tiếp | 21–24/10, 23–26/10, 20–23/10 | `confirmed` | |

Cách nạp DS-0: đơn `hold`/`confirmed`/`in_house` nạp **qua API** (đi qua B1/B2/B4/B9, nên phải thỏa quy tắc hiện hành); đơn `checked_out` (OTM-0136, 0137) và lịch sử HĐ dài hạn nạp **trực tiếp vào DB** như snapshot cũ (BR-006), ghi cột `seed_source = direct`.

Trạng thái buồng lúc T0 (BL 4.5): 101 OD · 102 OD · 103 VI · 201 OD · 202 VD · 203 VC · 301 OC · 302 VC · 401 OOO · 402 OD. Khách mẫu g1–g17 (BL 4.2) – g12 "Đỗ Mai Anh" và g14 "Do Mai Anh" trùng email cố ý (US-072).

### 4.3 Tài khoản test (một tài khoản/vai + tổ hợp)
| Tài khoản | Vai (rbac mục 1) | Dùng cho |
|---|---|---|
| `qa.owner` | `owner` | Cấu hình, gán vai, duyệt mọi mức |
| `qa.mgr` | `manager` | Duyệt FOC/hoàn tiền, khôi phục no-show, hoàn tác nhận phòng |
| `qa.fdl` | `front_desk_lead` | Duyệt trong hạn mức BR-433, nhận phòng ngoại lệ |
| `qa.fd`, `qa.fd2` | `front_desk` | Luồng lễ tân; `qa.fd2` cho ca đồng thời |
| `qa.hk` | `housekeeping` | Buồng phòng, minibar không giá vốn |
| `qa.mt` | `maintenance` | Phiếu sửa, khối OOO |
| `qa.sal` | `sales_staff` | Báo giá, giữ chỗ, xác nhận cọc đơn của mình |
| `qa.ctv1` (Minh Anh), `qa.ctv2` | `collaborator` | Phạm vi "của mình" (M) – `qa.ctv2` là "người khác" |
| `qa.fdsal` | `front_desk` + `sales_staff` | Hợp quyền (rbac mục 1 quy tắc 2) |
| `qa.hkmt` | `housekeeping` + `maintenance` | Hợp quyền P3 (TC-RB-024 … 026) |
| Thiết bị `qa-desk-01` | máy quầy được `qa.owner` cấp (cookie `__Host-ottimo_did`) | Ca C3 (SR-DEV); mọi ca C3 khác chạy trên thiết bị này |
| Thiết bị `qa-tablet-night` | máy tính bảng của cơ sở được cấp | Ca trực đêm (TC-SEC-015) |
| Trình duyệt PWA di động | không bao giờ được cấp | Ca chặn C3 (TC-RB-022, TC-SEC-012) |
| `qa.locked` | `front_desk`, trạng thái `locked` | Đăng nhập bị chặn |
| Khách | link app khách theo đơn (ADR-006) | L7 |

### 4.4 Lưu ý dữ liệu đã phát hiện khi lập DS-0 (đã ghi vào report QA mục 4)
- **Khoảng ngày khối OOO** (đã chốt – decision-log 15/10 DOM): khối lưu **nửa mở** `[bắt đầu, ngày mở bán lại)`; mở bán lại mặc định = ngày xong + 1. Khối 401 của DS-0 là `[15/10, 17/10)` = đêm 15, 16; OTM-0154 bán từ 17/10 (TC-L2-032, TC-L2-033).
- Dữ liệu thử trong AC của backlog (vd. US-017 AC1 "203 trống 19–22/10", US-018 AC1 "201 có đơn 20–22/10") **khác** DS-0 → các test case đó chạy trên DS-E + dữ liệu tự tạo.
- Wireframe dùng dữ liệu khác BL (Emma ở 302 thay vì 102, mã `OTM-000171` 6 chữ số, 202 có 4 khách vượt sức chứa BR-110). Không dùng wireframe làm nguồn dữ liệu test.

## 5. Đồng hồ giả cho các ca theo giờ (ADR-008)

### 5.1 Cơ chế
- Mọi mã nghiệp vụ đọc giờ qua `Clock` (`services/api/src/clock.ts`). Unit test dùng `FixedClock`. API/E2E/staging dùng **`MutableClock`** (ARC chốt ở bước 4 theo đề xuất QA/BE): giờ giả lưu dạng offset trong bảng `dev_clock`, api và worker đọc chung; đặt/tua giờ và chạy job qua `/__test__/clock`, `/__test__/jobs/{jobKey}/run` (`openapi.test.yaml`, chỉ ngoài production – SR-SECR-05 chặn ở production).
- **Ngày nghiệp vụ đổi lúc 06:00** giờ cơ sở (decision-log 15/10 DOM): 00:00–05:59 vẫn thuộc ngày hôm trước. Mọi ca "hôm nay" phải có thêm điểm 05:59/06:00 (TC-L8-010, TC-L8-011, TC-L3-008).
- Ký hiệu trong test case: **`⏱ 16/10 11:59`** = đặt đồng hồ cơ sở về 16/10/2026 11:59:00 giờ Đà Lạt (+07:00). **`▶ J1`** = chạy job J1 (`architecture.md` mục 9.1) một lần ngay.
- Mỗi mốc giờ kiểm **3 điểm**: ngay trước mốc (−1 giây hoặc −1 phút), đúng mốc, ngay sau mốc (backlog mục 4 quy ước). Mọi giá trị kỳ vọng tính theo giờ VN, kể cả khi trình duyệt test đặt múi giờ khác (chạy E2E thêm một lần với `TZ=Europe/Moscow` để bắt lỗi dùng giờ thiết bị – ADR-008 mục 5).

### 5.2 Yêu cầu với ARC/BE (đã được nhận ở bước 4 – kiểm ở bước 5 và đầu R2)
`FixedClock` chỉ đóng băng thời gian; E2E và job cần thời gian trôi và chạy job theo yêu cầu. Yêu cầu cho R2, chỉ bật khi `NODE_ENV != production` và CI kiểm không có trong bản build production:
1. `MutableClock`: đặt giờ (`set`) và tua (`advance`) khi đang chạy; worker và api dùng chung nguồn giờ (đọc từ DB hoặc biến dùng chung) để không lệch nhau.
2. Endpoint kiểm thử nội bộ (vd. `POST /__test__/clock`, `POST /__test__/jobs/{jobKey}/run`) hoặc lệnh CLI tương đương để E2E đặt giờ và kích hoạt job J1–J16 xác định.
3. Job đọc giờ qua `Clock`, ghi `job_run` theo `business_date` của đồng hồ giả (không theo giờ máy).
Nếu chưa có (1)–(2) ở đầu R2: QA chạy ca theo giờ bằng cách khởi động lại api/worker với `CLOCK_OVERRIDE` mới cho từng mốc (chậm, chỉ dùng cho bộ ca Cao).

### 5.3 Bảng mốc giờ phải kiểm
| Mốc | Quy tắc | Job | Test case |
|---|---|---|---|
| Hạn giữ chỗ = min(tạo + 12/24/48 giờ, 12:00 ngày đến); tự hủy khi hết hạn | BR-302, BR-303 | J1 | TC-L5-021, TC-L5-022, TC-L5-026, TC-L5-027, TC-X-004 |
| Nhắc giữ chỗ trước 2 giờ; gia hạn 1 lần ≤ +24 giờ | BR-303 | J2 | TC-L5-028, TC-L5-029 |
| Báo giá hết hiệu lực 23:59 của ngày (ngày lập + `quote_validity_days`) | BR-304 | J3 | TC-L5-015 |
| Nhận sớm 06:00 / 10:00 / 14:00, mặc định giờ chuẩn | BR-411, BR-414, BR-003 | – | TC-L3-010 … TC-L3-013 |
| Trả muộn 12:00 / 12:01 / 15:00 / 15:01 / 18:00 / 18:01 | BR-412, BR-416 | – | TC-L4-010 … TC-L4-013 |
| Nhắc trả phòng 20:00 hôm trước, 09:00, 11:00, 12:00 | BR-425 | J4 | TC-L4-022 … TC-L4-024 |
| Hạn khai báo VN 23:00 / 08:00 hôm sau; NN = giờ đến + 12 giờ, không còn `earlier_of` (decision-log 15/10, chờ ESC-001) | BR-602, BR-603 | J5 | TC-L3-044 … TC-L3-047, TC-L3-049 |
| Nhắc khai báo ca tối 22:00, 07:00 | BR-611 | J5 | TC-L3-048 |
| No-show gọi 18:00, đánh dấu 23:00, không tự động | BR-311 | J6, J7 | TC-L2-070 … TC-L2-074 |
| 07:00 OC → OD khách ngắn ngày; lịch dọn dài hạn; VI quá 3 ngày → VC | BR-802, BR-807, BR-805 | J8 | TC-L6-024, TC-L6-027, TC-L6-028, TC-L6-029 |
| OOO `planned` → `active` 00:01 | SM-02 O2 | J9 | TC-L6-044 |
| Yêu cầu khách chưa nhận sau 10 phút, giờ trực 07:00–22:00 | BR-811 | J10 | TC-L7-033 … TC-L7-035 |
| Phiếu sửa mức Cao quá 2 giờ chưa có phương án | BR-809 | J11 | TC-L6-047 |
| Kỳ thu dài hạn trước 7 ngày; chào gia hạn HĐ trước 30 ngày | BR-207, BR-211 | J12, J13 | TC-L8-006 |
| Thị thực hết hạn trước ngày đi | BR-605 | J14 | TC-L8-007, TC-L3-054 |
| Xóa ảnh: không đồng ý → **ngay khi `confirmed`** (24 giờ là hạn trên); có đồng ý → ngày trả + 30 (giả định QA chờ DOM quy ước đếm) | BR-610, BR-609, SEC T01/T02, M3 | J16 | TC-L3-039, TC-L3-070 … TC-L3-072 |
| Ngày nghiệp vụ đổi lúc 06:00 giờ cơ sở (server chạy UTC); nhận trước 06:00 = đêm bán (B9a) | BR-001, BR-404, BR-411 | – | TC-L8-010, TC-L8-011, TC-L3-008, TC-L3-013, TC-X-030 |
| Phiên admin-web 30 phút không hoạt động / tối đa 12 giờ; PWA 72 giờ / 30 ngày | SR-SES-03 | – | TC-SEC-021 |
| OTP/mã xác minh khách 10 phút; mức 2 rảnh 30 phút, tối đa 24 giờ; link khách ân hạn 24 giờ sau trả phòng | SR-GST-05, -07, -09 | – | TC-SEC-001, TC-SEC-003, TC-SEC-006 |
| Thiết bị được cấp hết hạn 180 ngày | SR-DEV-01 | – | TC-SEC-014 |

## 6. Tiêu chí vào / ra mỗi round

### Round 1 (tài liệu)
- **Vào**: backlog có AC cho story Must R2; BR, SM, RBAC, ERD, OpenAPI bản nháp; wireframe L1–L8.
- **Ra**: (1) 100% story Must R2 có ≥ 1 TC, mục tiêu 100% AC có ≥ 1 TC (đo bằng script trong `traceability.md`); (2) ma trận truy vết không có ô "test case" trống; (3) `qa/bug-list.md` liệt kê mọi lệch tên trạng thái/vai/thực thể giữa PRD–BR–BA–ERD–OpenAPI–wireframe, **0 lỗi tài liệu P0/P1 mở**; (4) CI khung xanh, `docker compose up` + `GET /health` = 200 (bước 5).

### Round 2 (lõi MVP)
- **Vào (mỗi story)**: dev báo "xong code" + test unit/API của logic chính xanh trên CI; endpoint khớp OpenAPI (contract test xanh); seed DS-E/DS-0 và đồng hồ điều khiển được (mục 5.2) có trên staging.
- **Nghiệm thu từng story (PO)**: QA chạy hết TC Cao của story → báo PO → PO xem demo trên staging, đối chiếu từng AC → **Accepted** hoặc **Trả lại** (ghi lý do vào backlog). Story chưa Accepted không tính là xong (DoD).
- **Smoke mỗi PR**: các TC có nhãn **(S)** (≈ 38 ca – đặt trùng/đồng thời, tiền, C3, hạn pháp lý, phiên/thiết bị); TC Cao còn lại chạy hằng đêm.
- **Ra (round)**: 100% TC ưu tiên **Cao** đã chạy và đạt; ≥ 95% TC **TB** đã chạy; 0 lỗi **P0/P1** mở; E2E đặt phòng → nhận phòng → trả phòng → thu tiền (Mock/VietQR) xanh trên CI; ca đồng thời TC-X-001 … TC-X-004, TC-L2-021, TC-L4-005 đạt 10 lần liên tiếp; ma trận quyền tự sinh (tầng R) đạt 100%; test-report ghi trung thực phần chưa test được.

### Round 3 (RC)
- **Vào**: tính năng R3 đóng băng; staging ổn định ≥ 3 ngày; dữ liệu demo sạch.
- **UAT**: kịch bản dùng thử của PO (`uat-script.md`) chạy trên DS-0 đã reset; QA chuẩn bị và kiểm dữ liệu, ghi lỗi INV gặp vào bug-list.
- **Ra**: hồi quy toàn bộ đạt; ngân sách hiệu năng mục 7 đạt; app khách VI/EN/RU đủ chuỗi (không chuỗi cứng); kiểm 3 kích thước màn hình + mất mạng (ADR-005); 0 P0/P1, ≤ 5 P2 mở có kế hoạch; dữ liệu demo cho INV đã reset và kiểm.

### Round 4+
- **Vào**: phiếu `04-investor-feedback/FB-INV-xxx.md` có mức P0–P3.
- **Ra**: lỗi tái hiện được → có test tự động chống tái phát; bản sửa xác nhận trên staging; P0 đi luồng hotfix (protocol mục 9) với QA + QC rút gọn.

## 7. Hiệu năng (đích theo `architecture.md` mục 16)
| Kịch bản | Tải | Đích | Round |
|---|---|---|---|
| Tìm phòng trống/báo giá (`searchAvailability`, `calculateQuote`) | 200 người dùng ảo đồng thời, 5 phút | p95 < 300 ms, lỗi < 0,1% | R3 |
| 50 yêu cầu tạo đơn cùng căn – cùng đêm trong 1 giây (`createReservation`, `createHoldFromQuote` trộn) | 50 song song | **Đúng 1** thành công, 49 nhận `409 ROOM_UNAVAILABLE`, `room_occupancy` có đúng 1 dòng active, không lỗi 5xx | R2 (bản nhỏ trong CI), R3 (k6) |
| 50 yêu cầu tạo đơn ở 50 cặp căn–đêm khác nhau | 50 song song | 50 mã `OTM-xxxxx` liên tiếp, không trùng, không hở (ERD K3) | R2 |
| Ghi folio/thu tiền | 20 VU | p95 < 500 ms | R3 |
| Rack 14 ngày × 10 căn (`getRack`) | 20 VU | 1 request, p95 < 200 ms | R3 |
| Mở app khách lần đầu 4G (Lighthouse/Playwright trace) | – | < 2 s, bundle guest-web ≤ 150 KB gzip | R3 |
| PWA nhân viên – màn "Việc của tôi" (buồng phòng), "Căn trống" (sale), "Hôm nay" (lễ tân ca tối) – 4G mô phỏng | – | < 2 s (PRD N3) | R3 |
| Lưu đơn / Dọn xong / ghi folio – phản hồi trên giao diện | 20 VU | ≤ 1 s p95 nhìn từ người dùng (PRD N3) | R3 |
| Đồng bộ tồn lên kênh (Mock) | 1 thay đổi | lệnh outbox gửi ≤ 1 phút (BR-905) | R2 |

## 8. Mức lỗi P0–P3

| Mức | Tên | Định nghĩa (sản phẩm chạy được – R2+) | Ví dụ OTTIMO | Với tài liệu (R1) | Xử lý |
|---|---|---|---|---|---|
| **P0** | Chặn | Không đặt/nhận/trả phòng/thanh toán được và không có cách vòng; **sai tiền**; **đặt trùng**; mất/hỏng dữ liệu; lộ dữ liệu C3 (giấy tờ, mã cửa) cho vai không được phép hoặc ra ngoài; lưu số thẻ (R-PAY-01); sập hệ thống | Hai lễ tân cùng đặt 203 đêm 20/10 đều thành công; bill cộng sai phụ thu; `collaborator` gọi API thấy số hộ chiếu | Hai tài liệu mâu thuẫn ở chỗ sẽ dẫn tới sai tiền/đặt trùng/lộ C3 nếu code theo một bên | Sửa ngay; chặn phát hành; QC không ĐẠT |
| **P1** | Nghiêm trọng | Luồng chính sai quy tắc nghiệp vụ (không trực tiếp sai tiền) hoặc cách vòng rất tốn công; phân quyền sai ở hành động/dữ liệu C2; job theo giờ không chạy (giữ chỗ quá hạn vẫn khóa phòng, không nhắc khai báo); không dùng được bằng bàn phím ở luồng chính | Giữ chỗ hết hạn không tự hủy; `sales_staff` thấy P&L; đơn `cancelled` vẫn hiện "Khách đến" | Lệch tên trạng thái/vai/thực thể làm hai đội code khác nhau; story Must thiếu endpoint hoặc AC không kiểm chứng được | Sửa trong round; không còn P1 mở khi qua QC |
| **P2** | Trung bình | Chức năng phụ sai; UX gây nhầm có cách khắc phục; thiếu trạng thái tải/rỗng/lỗi; chuỗi EN thiếu ở phần không pháp lý | Bộ lọc "Cần dọn" thiếu căn `CL`; thông báo lỗi không nêu ô sai | Ví dụ số trong tài liệu phụ không khớp BR; thiếu wireframe cho màn phụ | Nên sửa trong round, được dời có kế hoạch |
| **P3** | Nhẹ | Thẩm mỹ, chính tả, căn lề, câu chữ | Sai dấu tiếng Việt trên nút | Định dạng mã ví dụ khác nhau (5 hay 6 chữ số) | Dời được |

Nguyên tắc: **không hạ mức lỗi vì áp lực tiến độ** (skill QA). Lỗi tiền, tồn phòng, C3 mặc định P0 cho đến khi chứng minh không ảnh hưởng tiền/dữ liệu. Mức lỗi do QA quyết (protocol mục 8 – thuộc quyền QA), bất đồng thì ORC phân xử.

## 9. Cách ghi lỗi

File: `rounds/round-<n>/qa/bug-list.md`. Mỗi lỗi:

```
### BUG-R{round}-{3 số} – <tiêu đề ngắn: chỗ nào + sai gì>
- Mức: P0 | P1 | P2 | P3            - Trạng thái: Mới → Đã nhận → Đang sửa → Chờ test lại → Đóng | Mở lại | Không sửa (có lý do)
- Vai chịu trách nhiệm: BE / FE / MOB / ARC / BA / DOM / PO / UXD / OPS / INT
- Môi trường: local / CI / staging · commit hoặc phiên bản · trình duyệt/thiết bị · đồng hồ giả (nếu có ⏱)
- Liên quan: US-xxx ACn · BR-xxx · TC-xxx · operationId
- Tiền điều kiện / dữ liệu: DS-E hoặc DS-0 + bản ghi tự tạo
- Các bước tái hiện: 1… 2… 3…
- Kết quả thực tế:
- Kết quả mong đợi: (trích BR/AC)
- Bằng chứng: ảnh, đoạn log (đã che dữ liệu cá nhân), `Problem.code`, mã yêu cầu
- Ghi chú test lại: ngày, người, kết quả
```

Quy tắc: một lỗi một mục; không dán dữ liệu C3 thật hay mật khẩu vào bằng chứng; **không đóng lỗi khi QA chưa tự test lại**; lỗi tài liệu R1 dùng cùng mẫu, mục "Các bước" ghi vị trí từng tài liệu mâu thuẫn.

## 10. Rủi ro kiểm thử và cách giảm
| # | Rủi ro | Giảm thiểu |
|---|---|---|
| QR1 | Đồng hồ chỉ đóng băng được, không tua → không test được job E2E | Đề xuất mục 5.2; tạm khởi động lại dịch vụ theo mốc |
| QR2 | Chính sách chưa chốt (ESC-001, 004, 006, 007…) → kết quả mong đợi đổi | Mọi kỳ vọng tính từ BR mục 13; file oracle mục 2.1; INV đổi → sửa 1 chỗ |
| QR3 | Không có sandbox đối tác ở R2 | Kiểm lệnh outbox + adapter Mock; ca sandbox thật để R3 khi có tài khoản (ESC-009/010) |
| QR4 | Thiếu thiết bị thật (Android tầm trung, iPhone) | R2 dùng giả lập Playwright; R3 cần ít nhất 1 Android + 1 iPhone thật (đội hoặc INV mượn) |
| QR5 | Hai tài liệu mâu thuẫn (ví dụ khối OOO, hạn khai báo NN) | Ghi `bug-list.md` R1; TC ghi rõ giả định đang test |
| QR6 | Dữ liệu C3 trong log/ảnh chụp lỗi | Dữ liệu test giả có tiền tố TEST; kiểm log không chứa số giấy tờ (TC-RB-020) |
