# Kế hoạch phát hành v1.0 – OTTIMO Desk (đường nhanh, vận hành thật sớm)

- Người lập: PO | Ngày: 23/10/2026 | Round 3 – bước **Lập kế hoạch (lập lại)** | Trạng thái: **Chờ ORC duyệt**
- Căn cứ: decision-log 23/10 dòng **"INV – đường nhanh v1.0"**; `rounds/round-03/plan.md` (CHỐT 22/10); `rounds/round-03/sprint-1-plan.md`; backlog mục 3–5.5; review/response R3 tới `2deab84`; protocol mục 3, 4, 9, 10.
- File này **thay thế** mục 1, 3, 4.3, 6, 7 của `plan.md` về đích Round 3. Phần còn hiệu lực của `plan.md` và `sprint-1-plan.md`: ràng buộc repo công khai, quy tắc staging, thứ tự lượt tiền, điều kiện review, thứ tự cắt.
- Tài liệu đi kèm: `rounds/round-03/inv-golive-checklist.md` (việc INV làm trước ngày chạy) · `product/docs/uat-script.md` (10 việc dùng thử) · `product/docs/release-notes.md` (nháp v1.0.0).
- **Thương hiệu:** mọi chữ khách hoặc INV nhìn thấy trong v1.0 (Desk, PWA, trang khách, bill, release notes, UAT, trang HTML trình INV) theo `00-brief/context/brand/brand-guidelines.md`: màu bảng 80/15/5, Lora / Be Vietnam Pro / JetBrains Mono, giọng ngắn – lịch sự – điềm tĩnh, tiếng Anh dẫn với khách, không emoji.
- **Repo công khai:** không ghi bí mật, số tài khoản, mật khẩu Wi-Fi, mã khôi phục, cách đặt mã cửa, thủ tục khôi phục chi tiết vào file này hay bất kỳ file nào của repo.

---

## 0. Tóm tắt

1. **v1.0 = lõi vận hành đã Đạt ở Round 2 + phần bắt buộc của Sprint 1.**
   - Lõi: đặt phòng, giữ chỗ, cọc VietQR, nhận/trả phòng, folio, thu tiền, công nợ, buồng phòng PWA, bảo trì, check-in online.
   - Phần bắt buộc: lượt kiểm tiền bước 1–4 + fuzz; 2FA owner/manager; 6 thẻ SEC; ba việc INV cần để tự cài đặt mà không qua đội (màn tài khoản nhận VietQR R3-Q51, thêm người dùng US-008, hạn lưu ghi chú R3-Q15).
2. **Phát hành khi đạt đủ 5 điều kiện của INV** (mục 3). Không có ngoại lệ cho điều kiện 1–3.
3. **Mốc dự kiến:** QC cổng v1.0 ngày 01–02/11; INV chọn ngày chạy trong 02–05/11. Mốc phụ thuộc hạn mức phiên làm việc. Trượt quá 05/11 thì ORC báo INV kèm ngày mới.
4. **Tính năng còn lại** chia ba bản: v1.1, v1.2, v1.3 (mục 6). Story vẫn giữ trong backlog, chỉ đổi đích phát hành.
5. **Sau v1.0:** lỗi đi theo `/feedback`. P0 sửa trong ngày (hotfix). P1–P3 gom thành bản vá v1.0.x hằng tuần. Đánh số theo semver, tag git, release notes (mục 7).

## 1. Hiện trạng ngày 23/10 (tối)

| Việc | Trạng thái | Nơi |
|---|---|---|
| Lượt tiền bước 1–2: BUG-R2-210 + 209 (`writeDebt` theo số) | **Đã gộp `main`** – ARC + SEC đạt, 210 SEC Verified (D.1) | `main` `4863c5c` |
| Lượt tiền bước 3: BUG-R2-208 (A32 giảm theo số, N-15, test tranh chấp) | **Đã gộp `main`** – SEC: đạt D.1–D.4, 0 Blocker/Major | `main` `4863c5c` |
| Lượt tiền bước 4: BE-83 + ESC-026 A + R3-Q25 | **BE-B đang làm (Sản xuất xong, chưa review)** – migration 0079, gỡ 15 dòng `pendingFix` | nhánh `worktree-agent-a4a7a7b47e3d900bf` (`28410aa`) |
| US-143 2FA + CỔNG S2 (BE-C server + FE-A màn) | **Đang tích hợp** – đã sửa BEC-01…08, FEA-01 sau review SEC (3 Major); chờ SEC review lại + QA E2E rồi gộp. Nhánh này mang theo R3-Q38 (`Me.businessDate`) và R3-Q36 (Desk đổi ngày kinh doanh lúc 06:00) | nhánh `r3-2fa-int` (`c20421b`) |
| R3-Q17 (BE-65 kiểm lại, BE-74, 75, 79) | BE-C bắt đầu, chưa có commit | nhánh `bec-r3-q17-sec` |
| BE-D: US-155 phần Desk + server form công khai | **Xong mã trên nhánh riêng – thuộc v1.1**, không gộp vào v1.0 | nhánh `worktree-agent-adbe3fc764beff1f5` (`a01c774`) |
| BE-D: R3-Q15 (xóa ghi chú yêu cầu khách T13) | Xong mã nhưng **nằm chung commit với US-155** (`f474538`) → phải tách (mục 5, việc BE-D-1) | như trên |
| A1 chạy tay trên staging (cổng R2) | Phần 2 **đạt** 23/10 (`5cbf026`); phần 3 hẹn **25/10 trước 12:00** | staging, đơn `OTM-00239` |
| Staging | Chạy từ 22/10, deploy có người duyệt, sao lưu + diễn tập khôi phục đã làm | desk/staff/g.staging.ottimo.vn |
| Production | **Chưa có** | – |

Hai việc ORC cần biết:
- **Trùng số migration 0079** giữa BE-B bước 4 và BE-D. Theo luật ARC, số lấy lúc rebase. Nhánh gộp sau phải đổi số.
- Nhánh `r3-2fa-int` có R3-Q36/Q38 (Should). PO **giữ** trong v1.0 vì đã review cùng 2FA và sửa đúng lỗi giờ đêm. Tách ra sẽ tốn thêm một vòng review.

## 2. Phạm vi v1.0

### 2.1 Lõi đã Đạt ở Round 2 (giữ nguyên, không thêm AC)

| Nhóm | Story | Ghi chú |
|---|---|---|
| Nền tảng, quyền | US-001, 002, 003, 004, 005, 006, 007, 135, 142 | US-135 còn AC3 (VoiceOver) – không chặn v1.0, ghi "giới hạn đã biết" |
| Tổng quan | US-010, 011, 012 (phần R2) | US-012 AC7 "đồng bộ kênh lỗi" → v1.1 cùng Beds24 |
| Sơ đồ phòng, đặt phòng | US-016, 017 (gồm AC5a đơn dài hạn nhập tay), 018, 019, 020, 021 (trừ AC7), 022, 023, 024, 136, 139 (OTA nhập tay) | US-021 AC7 (OTTIMO hủy vì lỗi cơ sở) → v1.1 |
| Nhận phòng, lưu trú | US-025, 026, 027, 028, 029, 030, 031 (trừ AC3), 032 | US-031 AC3 (thông báo J4) → v1.1 |
| Trả phòng, bill, thu tiền, công nợ | US-035, 036, 037, 038, 039, 119, 120 | Hóa đơn điện tử thật → v1.3 |
| Giấy tờ, khai báo lưu trú | US-042, 043, 044, 045, 046, 047, 048, 049, 050 | US-043, 048 lên "Đạt" khi SEC Verified BE-74/75/79 |
| Buồng phòng PWA, bảo trì, minibar | US-052, 053, 054, 055, 057, 061, 062, 066 | |
| Khách hàng, báo giá, giữ chỗ, cọc | US-071, 072, 073, 080, 082, 083, 084, 085, 086, 087 | Báo giá dài hạn (US-081) → v1.3 |
| Trang khách, check-in online | US-106, 107, 108 (trừ mã cửa), 109, 110, 112 | Tiếng Nga → v1.3 |

### 2.2 Phần Sprint 1 bắt buộc cho v1.0

| Mục | Vì sao bắt buộc | Vai |
|---|---|---|
| Lượt tiền bước 1–4: R3-Q21 (210), R3-Q20 (209), R3-Q19 (208), R3-Q22 (BE-83) + ESC-026 A + R3-Q25 | Điều kiện 1 của INV | BE-B; ARC, SEC review |
| R3-Q30 fuzz công nợ + critic độc lập | Điều kiện 1 | QA |
| US-143 2FA owner/manager (AC1–AC4) + CỔNG S2 | Điều kiện 2 | BE-C, FE-A, OPS |
| R3-Q17 (BE-65, 74, 75, 79), R3-Q33 (a) (BE-84), BE-83 | Điều kiện 3 | BE-C, BE-B; SEC |
| **R3-Q51** màn tài khoản nhận VietQR (chỉ OWN, xác thực lại S2, cảnh báo "vừa đổi") | Không có màn này thì INV không tự nhập được tài khoản nhận cọc thật; hiện chỉ đổi được qua API | BE-B, FE-A, UXD; SEC |
| **US-008** thêm người dùng (S26) | INV phải tự tạo tài khoản nhân viên. Server `createUser` đã có, đã gắn CỔNG S2 trong `r3-2fa-int`; thiếu màn Desk | FE-B, UXD; SEC (kèm 2FA) |
| **R3-Q15** xóa ghi chú yêu cầu khách theo hạn lưu | Plan R3 xếp "trước dữ liệu khách thật"; INV chấp nhận rủi ro ESC-001 với hạn lưu ngắn nhất → hạn lưu phải chạy thật | BE-D (tách commit); SEC B.7 |
| R3-Q36, R3-Q38 (ngày kinh doanh từ server) | Đã nằm trong `r3-2fa-int`; sửa đúng lỗi giờ đêm | Đi cùng 2FA |
| D4 cổng R2 (SEC đọc PWA snapshot 502/503/504), R3-Q31 (Dependabot không gộp PR đỏ) | Điều kiện mang sang từ R2 | SEC, OPS |

### 2.3 Không thuộc v1.0 (chi tiết mục 6)
US-164, US-155 (form + hàng chờ Desk), landing lên mạng, Beds24, báo cáo, xuất dữ liệu, mẫu tin + lịch tin, mã cửa 8 số trên app, xác minh nhẹ trang khách, dài hạn đủ vòng, MISA, đóng ca, tiếng Nga, lượt tiền phần 5–6.

**Đóng băng mã tiền:** khi lượt tiền bước 1–4 + fuzz đạt, ORC đóng băng lại mã tiền. Từ đó tới khi phát hành v1.0, chỉ sửa tiền khi có lỗi P0/P1 và có dòng ngoại lệ trong decision-log.

## 3. Năm điều kiện phát hành v1.0 (INV 23/10)

| # | Điều kiện | Đạt khi (bằng chứng) | Người xác nhận |
|---|---|---|---|
| 1 | Lượt kiểm tiền R3 xong | Bước 1–4 gộp `main`, CI xanh. `pendingFix` BUG-R2-208, 209, R3-SEC-BE-83, R3-ESC-026 gỡ hết. BUG-R2-210 Closed. Fuzz R3-Q30: 0 vi phạm bất biến BR-525 (ii). Critic: 0 ca lệch, 0 Major | QA + critic; ORC ghi đóng băng lại |
| 2 | 2FA owner/manager gộp, `MFA_ENFORCED=true` trên production | US-143 AC1–AC4 đạt, SEC Verified SR-AUTH-06 (3 Major SEC đóng, ca A.7 đủ 16). OPS đã diễn tập lệnh khôi phục trên staging (biên bản không ghi thủ tục). INV + mọi manager đã đăng ký 2FA trên production **trước** khi bật cờ | SEC, OPS; INV xác nhận đã cất mã |
| 3 | SEC Verified BE-65, 74, 75, 79, 83, 84 (a) | Mỗi thẻ ghi Verified trên commit đã gộp (B.0 của `s1-security-requirements.md`). 0 Critical/High mở | SEC |
| 4 | Production tách staging | Cùng VPS, **CSDL riêng, bí mật riêng, tên miền riêng** (desk/staff/g.ottimo.vn). Cấu hình production qua kiểm khởi động (không đồng hồ giả, không test-support). Deploy qua environment `production` có INV duyệt. Sao lưu hằng ngày chạy, khóa giải mã do INV giữ ngoại tuyến. **Một lần diễn tập khôi phục** bản sao lưu production trong môi trường dùng một lần, có biên bản | OPS; SEC rà cấu hình |
| 5 | QC "cổng v1.0" rút gọn đạt | QC chấm 1–4 + **A1 đạt** (chuỗi chính trên staging: phần 3 ngày 25/10) + 0 P0/P1 mở + CI xanh trên commit phát hành + smoke trên production sau deploy đầu | QC |

Đề xuất của PO cho QC (QC giữ quyền quyết):
- **Bắt buộc thêm** (không phải điều kiện mới, là phần của 1–4): R3-Q51 và US-008 chạy trên staging; R3-Q15 SEC đạt B.7; release notes v1.0.0 có mục "Giới hạn đã biết".
- **Không chặn v1.0:** axe, hiệu năng, UAT của INV (INV chạy song song, lỗi đi theo `/feedback`), hướng dẫn vận hành đầy đủ (bản 1 trang đủ cho ngày đầu).
- Quyết định: ĐẠT hoặc KHÔNG ĐẠT. Không dùng "ĐẠT CÓ ĐIỀU KIỆN" cho điều kiện 1–3.

## 4. Thứ tự việc và mốc (23/10 → 05/11)

```
23–25/10  BE-B bước 4 → review ARC + SEC   |  r3-2fa-int → SEC review lại + QA E2E   |  QA A1 phần 3 (25/10)
26–27/10  Gộp bước 4  →  QA fuzz R3-Q30 + critic   |  Gộp 2FA + S2   |  BE-D tách + gộp R3-Q15
27–30/10  R3-Q51 (sau S2) · US-008 màn · R3-Q17/Q33a  →  SEC Verified   |  OPS dựng production
28/10     QC chấm lại cổng R2 (muộn nhất)
29–31/10  OPS diễn tập khôi phục 2FA (staging) + khôi phục sao lưu (production)   |  INV làm checklist trên staging
01–02/11  Đóng băng → tag v1.0.0-rc.1 trên staging → QC cổng v1.0
02–05/11  Deploy production (INV duyệt) → INV nhập cấu hình → bật MFA_ENFORCED → smoke → ngày chạy
```

| Mốc | Phải xong |
|---|---|
| **25/10** (CN) | QA chạy A1 phần 3. PO nghiệm thu bổ sung R-6. ARC + SEC review BE-B bước 4. SEC review lại `r3-2fa-int` |
| **27/10** (T3) | Bước 4 gộp `main`. `r3-2fa-int` gộp `main` (BE + FE + E2E cùng lượt). R3-Q15 gộp |
| **28/10** (T4) | QC chấm lại cổng R2. Fuzz R3-Q30 chạy + critic đọc log gốc. OPS: production chạy trên VPS với dữ liệu trống |
| **30/10** (T6) | R3-Q51, US-008, R3-Q17, R3-Q33 (a) gộp. SEC Verified 6 thẻ + SR-AUTH-06. Lượt tiền đạt → ORC đóng băng lại mã tiền |
| **31/10** (T7) | OPS diễn tập lệnh khôi phục 2FA trên staging, diễn tập khôi phục sao lưu production. INV đi xong `uat-script.md` trên staging (ít nhất 8/10 việc) |
| **01–02/11** | Tag `v1.0.0-rc.1`, deploy staging, QA hồi quy rút gọn. QC cổng v1.0 |
| **02–05/11** | Tag `v1.0.0`, deploy production. INV làm phần B của checklist. Bật `MFA_ENFORCED=true`. Ngày chạy |

Quy tắc trượt mốc:
- Điều kiện 1–3 chưa đạt ngày 30/10 → cắt theo thứ tự mục 4.1, không hạ điều kiện.
- Ngày 31/10 còn thiếu điều kiện → ORC báo INV ngày dự kiến mới (không cần ESC; INV đã nói mốc phụ thuộc hạn mức).

### 4.1 Thứ tự cắt khi thiếu thời gian (ORC cắt không cần hỏi lại)
1. R3-Q36/Q38 tách khỏi `r3-2fa-int` nếu chúng làm chậm việc gộp 2FA → v1.0.1.
2. US-008 màn Desk → OPS tạo tài khoản nhân viên bằng lệnh quản trị có nhật ký, cùng INV, ngày chạy. Mật khẩu tạm INV trao tận tay, đổi ở lần đăng nhập đầu. Màn vào v1.0.1.
3. Không cắt: lượt tiền, 2FA, 6 thẻ SEC, R3-Q51, R3-Q15, production + diễn tập khôi phục.

## 5. Việc còn lại theo vai (bảng giao việc v1.0 – thay mục 5 `sprint-1-plan.md` cho phần còn lại)

| # | Vai | Việc | Cần trước | Hạn |
|---|---|---|---|---|
| BE-B-1 | BE-B | Trả lời review bước 4 (ARC, SEC B.5). Đổi số migration nếu gộp sau BE-D. Gộp | ARC, SEC review | 27/10 |
| BE-B-2 | BE-B | **R3-Q51 phía server** (S2, Q51-1…9, email báo đổi tài khoản theo adapter ARC chọn cho production) | 2FA + S2 gộp | 30/10 |
| BE-B-3 | BE-B | Sửa lỗi tiền do fuzz/critic tìm ra (tối đa 3 vòng) | QA-2 | 30/10 |
| BE-C-1 | BE-C | Đóng 3 Major SEC trên `r3-2fa-int` (BEC-01/02 đã sửa – chờ SEC xác nhận), cùng FE-A gộp | SEC-1 | 27/10 |
| BE-C-2 | BE-C | **R3-Q17** (BE-65 kiểm lại, BE-74, 75, 79) và **R3-Q33 (a)** (BE-84) | – | 30/10 |
| BE-D-1 | BE-D | **Tách R3-Q15** khỏi `f474538` thành PR riêng trên `main` (không mang `public-site`), SEC B.7. Giữ nhánh US-155 cho v1.1, rebase sau v1.0 | – | 27/10 |
| FE-A-1 | FE-A | Gộp màn 2FA + S2 cùng BE-C (FEA-01) | SEC-1 | 27/10 |
| FE-A-2 | FE-A | **Màn R3-Q51** (gõ hai lần, không điền sẵn, xóa form khi rời, che `•••• 1234`) – brand OTTIMO | BE-B-2, UXD-1 | 30/10 |
| FE-B-1 | FE-B | **US-008** màn thêm người dùng S26 (mật khẩu tạm hiện một lần, hộp S2) – brand OTTIMO | 2FA gộp, UXD-1 | 30/10 |
| UXD-1 | UXD | Hi-fi + chuỗi VI/EN cho R3-Q51 và US-008 (nếu chưa có trong bộ Sprint 1) theo brand guideline | – | 28/10 |
| ARC-1 | ARC | Review bước 4; review R3-Q51, US-008, R3-Q15. **Chọn adapter email cho production** (kiểm khởi động production từ chối adapter `mock`): tài khoản thật nếu INV có, hoặc phương án không gửi email + báo trong app, SEC đồng ý | – | 28/10 |
| SEC-1 | SEC | Review lại `r3-2fa-int` → Verified SR-AUTH-06. Review B.5 (bước 4), B.7 (R3-Q15), C (R3-Q51). Verified 6 thẻ trên commit gộp. D4 PWA snapshot nếu chưa làm. Rà cấu hình production (điều kiện 4) | – | 30/10 |
| QA-1 | QA | A1 phần 3 (25/10). E2E 2FA + S2 trên `r3-2fa-int` | – | 27/10 |
| QA-2 | QA | **Fuzz R3-Q30** + critic độc lập trên `main` có bước 1–4 | BE-B-1 | 28–30/10 |
| QA-3 | QA | Hồi quy rút gọn trên `v1.0.0-rc.1` (staging): A1, ca tiền, ca đồng hồ giả giờ đêm, 2FA, R3-Q51, US-008. Smoke production sau deploy | QC-1 trước | 01–02/11 |
| OPS-1 | OPS | **Dựng production** trên cùng VPS: compose project riêng, CSDL riêng, bí mật riêng, Caddy thêm desk/staff/g.ottimo.vn, environment GitHub `production` có INV duyệt, tag image theo `v1.0.x` | INV: DNS (checklist A6) | 28/10 |
| OPS-2 | OPS | Sao lưu production hằng ngày + bản ra khỏi VPS; **diễn tập khôi phục một lần** (môi trường dùng một lần); kiểm RAM/đĩa khi chạy chung staging | OPS-1 | 31/10 |
| OPS-3 | OPS | Thủ tục khôi phục 2FA bằng lệnh quản trị (ngoài repo) + diễn tập trên staging. Bật `MFA_ENFORCED` trên staging khi đủ 3 điều kiện của `sprint-1-plan.md` 4.3; trên production ở ngày chạy | 2FA gộp | 31/10 |
| DOM-1 | DOM | **Hướng dẫn chuyển đổi ngày đầu** (1–2 trang, không bí mật): nhập đơn tương lai đã nhận, cọc đã thu, khách đang ở, công nợ cũ; giữ sổ giấy dự phòng 3 ngày đầu. Bảng **giá trị hạn lưu ngắn nhất** đề xuất (cùng SEC) để INV xác nhận trên màn Tham số | – | 30/10 |
| PO-1 | PO | Nghiệm thu R-6 (25/10); nghiệm thu R3-Q51, US-008, R3-Q15 trên staging; release notes v1.0.0 bản cuối; cập nhật backlog cột "Phát hành" | – | 01/11 |
| QC-1 | QC | Chấm lại cổng R2 (≤ 28/10). **Cổng v1.0** theo mục 3 | QA-3 | 01–02/11 |
| ORC | ORC | Giao việc theo bảng này; ghi decision-log; đóng băng mã tiền; nhắc INV checklist; tag + deploy cùng OPS; báo INV kết quả QC | – | liên tục |

Vai không có việc v1.0: INT, DATA, UXR, BA (BA cập nhật rbac cho R3-Q51, US-008 nếu thiếu – kèm PR). Các vai này chuẩn bị v1.1 khi được ORC giao, **không chạm `main`** tới khi v1.0 phát hành.

## 6. Dời sang v1.1 / v1.2 / v1.3

Nguyên tắc: không đổi MoSCoW hay AC; chỉ đổi đích phát hành. PO cập nhật backlog cột "Phát hành". Bản v1.x có cổng QC riêng (rút gọn theo phạm vi) và vẫn chạy đủ review chéo.

### v1.1 – kiểm soát từ xa, website, kênh OTA (mục tiêu ~2 tuần sau v1.0)

| Mục | Nguồn |
|---|---|
| **US-164** xác nhận từ xa (+ R3-Q03, R3-Q09, US-164 AC4 phần tiền, AC8) | INV 23/10; sprint-1 3.3 |
| **US-155** form website + hàng chờ Desk (R3-Q06, BE-D nhánh `adbe3fc`), landing LP-v1 lên mạng ở tên miền gốc (US-146…154) khi đủ US-155 AC4 | INV 23/10; plan R3 mục 1.5 |
| **Beds24**: US-095, 096, 099, R3-Q12 (US-012 AC7 phần R3) | INV 23/10; plan R3 Sprint 2 |
| **Lượt tiền phần 2** (mở C1 một lần nữa): R3-Q39 #8–#12, R3-Q01 (US-021 AC7), R3-Q10, R3-Q23, R3-Q24, R3-Q29, R3-Q02 (nếu có điều kiện), OWN thu hồi khoản miễn (R3-FOC-REVOKE, hợp đồng 0.3.9) | sprint-1 3.1 bước 5–6; ARC 22/10 |
| R3-Q13 thông báo J4 quá giờ trả phòng (US-031 AC3) | plan R3 3.1 |
| US-128 + R3-Q32 mã cửa 8 số trên app; US-141 xác minh nhẹ trang khách | plan R3 3.3 Sprint 1 |
| R3-Q53 cách gọi căn với khách (chờ INV xác nhận G3), R3-Q52 ảnh landing | INV 22/10 |
| R3-Q26, Q27, Q28 (kiến trúc), R3-Q37, Q11, Q47, Q48, Q46, Q50 | sprint-1 3.3–3.4 |
| US-145 bảng dự phòng in sẵn khi mất mạng (v1.0 dùng sổ giấy theo DOM-1) | plan R3 3.4 #1 |
| Kiểm tra bảo mật tổng (SEC), test hiệu năng (QA) | plan R3 4.3 Sprint 4 |

### v1.2 – báo cáo, dữ liệu, giao tiếp với khách

| Mục | Nguồn |
|---|---|
| Báo cáo: US-100, 101, 102; US-014 ADR/RevPAR | plan R3 Sprint 2; 3.4 #6 |
| Xuất dữ liệu: US-104 (R3-Q05) | plan R3 Sprint 2 |
| Mẫu tin + lịch tin: US-125, US-161, US-162, R3-Q42; Zalo OA: R3-Q40, 41, 43, 45; US-126 tự gửi khi có ZBS | plan R3 Sprint 1–3 |
| US-111 folio tạm tính trên trang khách; US-040 in bill/PDF/gửi bill; US-123 ghi nhận hoàn cọc; US-034, US-138 | plan R3 3.3, 3.4 |

### v1.3 – dài hạn đủ vòng và phần còn lại của MVP

| Mục | Nguồn |
|---|---|
| Dài hạn: US-081, 088, 041, 064, 065, 056, 089, 114 (v1.0 dùng đơn dài hạn nhập tay US-017 AC5a) | plan R3 Sprint 3 |
| Hóa đơn điện tử MISA US-122; đóng ca US-124; tiếng Nga US-115 | INV 23/10 |
| Đơn nhóm US-140; quyền dữ liệu của khách US-133, 134 (v1.0: OWN xử lý yêu cầu của khách bằng tay theo DRA) | plan R3 Sprint 3–4 |

Should R3 còn lại (US-051, 059, 063, 067–069, 074–077, 090–093, 097, 098, 103, 113, 116, 121, 127, 129, 131, 156, 158) giữ R4+ như `plan.md` 3.4; PO xếp lại theo feedback vận hành thật.

## 7. Quy trình sau v1.0

### 7.1 Đánh số phiên bản (semver)

| Loại | Ví dụ | Chứa gì |
|---|---|---|
| Bản chính | `v1.0.0` | Bản phát hành đầu |
| Bản vá | `v1.0.1`, `v1.0.2` … | Chỉ sửa lỗi (hotfix P0 hoặc gom P1–P3). Không thêm tính năng. Migration chỉ dạng thêm, không phá dữ liệu |
| Bản tính năng | `v1.1.0`, `v1.2.0`, `v1.3.0` | Tính năng mục 6; có QC cổng riêng |
| Bản thử trên staging | `v1.1.0-rc.1` | Trước mỗi bản tính năng hoặc bản vá lớn |

- Tag git **có chú thích** trên đúng commit `main` đã qua QC: `git tag -a v1.0.0`. Production chỉ deploy image gắn tag phát hành, không deploy commit lẻ.
- Hotfix làm trên nhánh `hotfix/v1.0.<n>` tạo từ tag đang chạy, gộp lại `main` ngay sau khi phát hành.
- Mỗi tag có một mục trong `product/docs/release-notes.md` (ngôn ngữ người dùng, theo brand; mục "Giới hạn đã biết").

### 7.2 Luồng feedback của INV

1. INV gõ `/feedback <nội dung>` (kèm ảnh nếu có). Không gửi mật khẩu, số tài khoản, dữ liệu khách thật trong nội dung.
2. ORC tạo `04-investor-feedback/FB-INV-<số>.md`: nguyên văn, loại (Bug / UX / Tính năng mới / Nghiệp vụ / Hiệu năng), **P0–P3**, vai chịu trách nhiệm, phiên bản đang chạy. ORC xác nhận mức với INV bằng một bảng ngắn.
3. Phân luồng theo mức:

| Mức | Ví dụ | Xử lý | Thời hạn |
|---|---|---|---|
| **P0** | Không đặt / nhận / trả phòng / thu tiền được; sai tiền; mất dữ liệu; sập; lộ dữ liệu khách | **Hotfix**: vai sửa → QA kiểm lỗi + hồi quy rút gọn (A1, ca tiền) → QC rút gọn → SEC nếu chạm bảo mật/tiền → deploy production **có INV duyệt** → tag `v1.0.<n>` | **Trong ngày** từ lúc nhận. Chưa sửa kịp: OPS quay về bản trước hoặc DOM đưa cách làm tạm; ORC báo INV |
| **P1** | Luồng chính bị cản nhưng có cách làm tạm | Gom bản vá tuần; PO được đưa ra sớm giữa tuần nếu ảnh hưởng ca đêm | ≤ 7 ngày |
| **P2–P3** | Khó dùng, sai chữ, chậm | Gom bản vá tuần hoặc bản kế tiếp | Theo PO xếp |
| Tính năng mới | Yêu cầu thêm | Vào backlog, PO xếp vào v1.x | Theo round |

4. **Bản vá tuần v1.0.x:** chốt danh sách thứ Hai; QA + QC rút gọn thứ Ba; deploy **thứ Tư, 09:30–10:30** [GIẢ ĐỊNH – DOM xác nhận khung giờ vắng]. Không deploy trong 22:00–06:00 (qua mốc ngày kinh doanh) và trong giờ trả phòng 11:00–12:30.
5. Sửa chạm mã tiền sau v1.0 (kể cả P0) cần: dòng ngoại lệ decision-log của ORC, oracle DOM, ARC review, SEC nếu chạm BR-433/công nợ.
6. Khi xong, ORC báo INV: đã sửa gì, ở phiên bản nào, cách kiểm tra (theo protocol mục 9.5). Ghi trạng thái vào `FB-INV-<số>.md`.
7. Từ v1.0, `/round 4` trở đi lấy đầu vào chính là `04-investor-feedback/` (protocol mục 4).

## 8. Rủi ro

| Rủi ro | Ảnh hưởng | Cách giảm |
|---|---|---|
| Fuzz/critic tìm thêm lỗi tiền | Trượt điều kiện 1 | Tối đa 3 vòng; quá thì ORC báo INV ngày mới. Không hạ điều kiện |
| Production và staging chung VPS | Thiếu RAM; thao tác nhầm môi trường | OPS-2 đo tài nguyên; compose project, CSDL, bí mật, tên miền tách; khi thiếu RAM tắt staging ngoài giờ test |
| INV mất điện thoại + mã khôi phục (một tài khoản chủ) | Khóa quyền OWN | Lệnh khôi phục có nhật ký đã diễn tập (OPS-3); mã khôi phục cất 2 nơi |
| Kiểm khởi động production từ chối adapter email `mock` | Không deploy được, hoặc thiếu thông báo đổi tài khoản nhận | ARC-1 chọn trước 28/10; cần tài khoản thì INV làm theo checklist A9 |
| Luật sư chưa trả lời ESC-001 | Rủi ro pháp lý | INV đã chấp nhận rủi ro 23/10; hạn lưu đặt mức ngắn nhất; luật sư trả lời sau thì đổi tham số, không sửa mã |
| Đơn và cọc đang có ngoài app khi chuyển sang | Trùng phòng ngày đầu, sai công nợ | DOM-1 hướng dẫn chuyển đổi; INV/lễ tân nhập trước ngày chạy; sổ giấy dự phòng 3 ngày |
| Lỗi giờ đêm chỉ lộ khi chạy thật | Sai ngày kinh doanh, sai tiền ca đêm | Ca đồng hồ giả trên CI; UAT việc 10 chạy thật sau 00:00 trên staging |

## 9. Giả định

| # | Giả định | Ai xác nhận |
|---|---|---|
| G-v1-1 | Tên miền production: `desk.ottimo.vn`, `staff.ottimo.vn`, `g.ottimo.vn`; tên miền gốc chưa dùng ở v1.0 | OPS, INV (DNS) |
| G-v1-2 | R3-Q51, US-008, R3-Q15 thuộc "Sprint 1 phần bắt buộc" của v1.0 (PO quyết phạm vi trong round) | ORC duyệt |
| G-v1-3 | R3-Q39 #8–#12 (lỗi ngày kinh doanh chạm tiền, mức P3) vào lượt tiền v1.1; v1.0 ghi ở "Giới hạn đã biết" | ORC duyệt |
| G-v1-4 | Khung deploy bản vá: thứ Tư 09:30–10:30 | DOM |
| G-v1-5 | "Hạn lưu ngắn nhất cho phép" = mức thấp nhất trong biên tham số mà vẫn đủ cho việc khai báo lưu trú; DOM + SEC đề xuất số, INV xác nhận trên màn Tham số | DOM, SEC, INV |
| G-v1-6 | INV chạy UAT trên staging song song với QC; lỗi UAT không chặn v1.0 trừ P0/P1 | ORC |

## 10. Cần ghi decision-log (ORC khi duyệt)

- File này là kế hoạch đích của Round 3 thay cho RC; bảng mục 5 là bảng giao việc duy nhất tới v1.0.
- Phạm vi v1.0 mục 2 (gồm G-v1-2, G-v1-3) và danh sách dời mục 6.
- Quy trình mục 7 (semver, hotfix, bản vá tuần).
- Đóng băng lại mã tiền khi điều kiện 1 đạt.
