# Kế hoạch Sprint 1 – Round 3 (lượt kiểm tiền · bảo mật trước dữ liệu thật · 2FA và xác nhận từ xa)

- Người lập: PO | Ngày: 22/10/2026 | Bước: **Lập kế hoạch** | Trạng thái: **Chờ ORC duyệt và giao việc**.
  - ORC ghi decision-log khi giao: mở C1 một lần (V3 của `plan.md`), D1 = ngày giao việc.
  - Đổi kế hoạch sau khi giao: PO đề xuất, ORC duyệt, ghi decision-log trong ngày.
  - Đổi hợp đồng API sau khi ARC chốt: qua ARC, báo các vai trong ngày.
- Đầu vào:
  - `rounds/round-03/plan.md` (CHỐT 22/10), mục 3, 4.1, 4.2, 6.
  - `03-backlog/backlog.md`: AC viết 22/10 – US-007 AC7, US-012 AC7 phần R3, US-021 AC7, US-031 AC3, US-096, US-109 AC3, US-110 AC4, US-143 AC3–AC4, US-164 AC4 + AC8. Mục 5.5 R3-Q01…Q53.
  - `rounds/round-03/outputs/SEC/s1-security-requirements.md` (SEC 22/10):
    - A: SR-AUTH-06 chi tiết theo ESC-027 B;
    - B: điều kiện Verified 6 thẻ;
    - C: R3-Q51;
    - D: điều kiện review 208;
    - E: Dependabot;
    - F: việc theo vai.
  - `product/docs/business-rules.md` **0.4.0** (DOM đang ghi 22/10): BR-012 (7), BR-309 (iii)(vii), BR-416, BR-433 (c), BR-437, BR-525 (i).
  - `rounds/round-02/qc/round-qc-gate.md` mục 5–6 (R-6, D1–D9); `rounds/round-02/qc/s4-qc-gate.md` (C1–C14); `rounds/round-02/reviews/s4-SEC.md` (E, F); `rounds/round-02/qa/staging-run.md`.
  - ESC-022…028 (INV quyết 22/10); decision-log 22/10.
  - Khuôn: `rounds/round-02/sprint-4-plan.md`.
- **Thương hiệu (bắt buộc với UXD, FE-A, FE-B, FE-LP, MOB, INT).** Mọi màn mới và chữ khách/INV nhìn thấy theo OTTIMO Brand Guidelines (`00-brief/context/brand/brand-guidelines.md`). Áp cho: màn 2FA, mã khôi phục, R3-Q51, màn duyệt từ xa trên điện thoại, mục "Cần chú ý" mới, S35, thông báo, mẫu tin US-161/162, thiết kế R3-Q52.
  - Màu chỉ trong bảng 80/15/5: Ivory #F4F0E8, Cream #EDE6D8, Stone Grey #6B6760, Ink #2B2B28 · Light Oak #B08D57, Earth Brown #7A5C44 · Sage #8A9079.
  - Chữ: Lora (tiêu đề), Be Vietnam Pro (nội dung/UI), JetBrains Mono (mã đơn, mã khôi phục, Wi-Fi).
  - Giọng văn với khách: ngắn, lịch sự, điềm tĩnh, tiếng Anh dẫn – tiếng Việt hỗ trợ, không emoji.
  - Lệch với design system cũ thì guideline thắng; UXD ghi lệch và đề xuất sửa.
  - Màn nội bộ (Desk, PWA) vẫn theo token DS v0.4; chữ nội bộ tiếng Việt + tiếng Anh.
- **Ràng buộc** – mọi vai đọc trước khi làm:
  1. **Repo công khai.** Không ghi vào repo, `rounds/`, PR, log CI hay chat:
     - bí mật, khóa, mật khẩu (kể cả mật khẩu Wi-Fi);
     - số tài khoản ngân hàng (kể cả số thử), dữ liệu cá nhân thật;
     - cách đặt mã cửa, vị trí thiết bị, thủ tục khôi phục 2FA chi tiết.
     - Lỗ hổng Critical/High chưa vá → SEC đề xuất GitHub Security Advisory nháp; repo chỉ ghi một dòng.
  2. **Staging** (desk/staff/g.staging.ottimo.vn) chỉ có dữ liệu giả.
     - **Không đụng đơn `OTM-00239`** (căn 202, 23–25/10): không hủy, sửa, đổi căn, thêm dòng. QA đang chạy tay A1 phần 2 (23/10) và phần 3 (25/10) cho cổng QC Round 2.
     - Không chạy migration thủ công trên staging. Deploy chỉ qua CI có người duyệt.
  3. **Không quét VietQR** (staging hay CI) bằng app ngân hàng để chuyển tiền thật. Kiểm QR bằng giải mã payload trong test.
  4. **Thủ tục OPS của BUG-R2-210 giữ tới khi R3-Q21 Closed** (V4): không nâng tại chỗ DB/stack cũ; không dựng stack từ dump; demo chỉ `demo-up.sh`.
  5. **Mã tiền chỉ mở một lần** (C1) cho lượt kiểm tiền mục 3.1. PR chạm tiền ngoài danh sách mục 3.1 → chờ lượt sau, hoặc ORC cấp ngoại lệ có dòng decision-log.
  6. **Chưa có bản dùng thử** cho INV khi cổng QC Round 2 chưa đạt (ESC-028 A). Sprint 1 không trình INV bản chạy thử.
  7. Tài liệu tiếng Việt; code, tên biến, commit tiếng Anh. Giả định ghi `[GIẢ ĐỊNH]`.
  8. Stack test riêng cho từng vai (như R2). Không dùng stack demo của INV.

---

## 0. Tóm tắt

1. **Sprint 1 có hai việc ngang nhau:**
   - lượt kiểm tiền riêng (mở C1 một lần) để đóng 208/209/210 và các khe tiền còn lại;
   - toàn bộ việc bảo mật bắt buộc trước dữ liệu thật: 6 thẻ SEC, 2FA + khôi phục (ESC-027 B), màn tài khoản nhận VietQR (R3-Q51), hạn lưu ghi chú khách.
2. **Bốn quyết định INV 22/10 thành AC** và vào Sprint 1:
   - ESC-024 B → US-164 AC4, AC8;
   - ESC-026 A → US-007 AC7;
   - ESC-027 B → US-143 AC3, AC4;
   - ESC-023 A → **không** có việc thu phí; chỉ giữ ca hồi quy "phí 0".
3. **Thứ tự tiền cố định:** 210 → 209 → 208 → BE-83 + ESC-026 A → #8–#12 → nhóm đi cùng → fuzz R3-Q30.
   - 208 phải có SEC review trên đúng commit gộp.
   - Lượt kiểm tiền đạt → ORC đóng băng lại mã tiền tới QC RC.
4. **Hợp đồng trước code.** ARC chốt hợp đồng Sprint 1 trong D1–D2 (mục 4.2). BE/FE/MOB không code phần API mới trước khi ARC chốt; trong lúc chờ, FE/MOB dựng màn bằng MSW theo bản nháp.
5. **Song song không chặn:** cổng QC Round 2 chấm lại sau 25/10 (`plan.md` 2.1a). QA, PO, SEC dành thời gian cho R-6 theo lịch; không ai đụng `OTM-00239`.

## 1. Mục tiêu Sprint 1

### 1.1 Mục tiêu sản phẩm
- Quản lý xác nhận từ xa trên điện thoại của mình (US-164): lễ tân không còn phải hỏi mật khẩu qua điện thoại. Hết 15 phút không ai trả lời thì thu đúng số, quản lý xem lại trong 24 giờ.
- Chủ đầu tư và quản lý đăng nhập hai bước (US-143). OWN duy nhất vẫn khôi phục được (mã khôi phục + thủ tục có nhật ký).
- OWN tự đặt tài khoản nhận chuyển khoản trên Desk (R3-Q51). INV nhập tài khoản thật của OTTIMO trên staging, không qua chat.
- OWN tự thêm người dùng (US-008).
- Lễ tân nhận báo động "quá giờ trả phòng" đúng lúc (R3-Q13).
- Lễ tân có lịch "Tin cần gửi hôm nay" và gửi tay lời mời check-in online (US-161, US-162, chế độ gửi tay).
- Mã cửa ngẫu nhiên 8 số (US-128 + R3-Q32).
- Khách xác minh nhẹ trên trang khách (US-141).
- Yêu cầu đặt phòng từ website vào hàng chờ trên Desk (R3-Q06 – phần Desk của US-155; form trên landing ở Sprint 2).

### 1.2 Mục tiêu bắt buộc trước cổng QC Sprint 1
- Lượt kiểm tiền (mục 3.1) đạt: 0 lệch so với oracle DOM, 0 Major; fuzz R3-Q30 chạy, 0 vi phạm bất biến BR-525 (ii).
- 6 thẻ SEC (BE-65 kiểm lại, BE-74, BE-75, BE-79, BE-83, BE-84 (a)) **Verified** trên commit đã gộp, theo B.0 của `s1-security-requirements.md`.
- US-143 (AC1–AC4) và US-164 (AC1–AC8) đạt trên stack CI. `mfa_enforced = true` bật trên staging sau khi INV đăng ký 2FA (giả định G4).
- R3-Q51, R3-Q15 đạt; R3-Q26–Q28 ARC Verified.

### 1.3 Ngoài Sprint 1
- Beds24/OTA, R3-Q12 (đồng bộ kênh lỗi) → Sprint 2. AC đã viết.
- Báo cáo + xuất dữ liệu → Sprint 2. Form landing US-155 và lập trình R3-Q52 → Sprint 2.
- Dài hạn, đơn nhóm, hóa đơn điện tử, tiếng Nga → Sprint 3.
- Kết nối Zalo OA thật (R3-Q40/41) → Sprint 2, khi INV có OA đã xác thực.

## 2. Đầu vào INV và trạng thái môi trường (22/10)

| Mục | Trạng thái | Ảnh hưởng Sprint 1 |
|---|---|---|
| Staging + CI deploy có người duyệt | Chạy từ 22/10 | Nghiệm thu "Đạt (staging)" được cho phần chạy trên image production |
| GitHub E.6 | Đã bật | PR phải CI xanh mới gộp |
| ESC-022 B, 023 A, 024 B, 026 A, 027 B, 028 A | Đã quyết 22/10 | Đã vào AC/BR |
| Pháp nhân + MST | Đã có | Chưa dùng ở Sprint 1 (chân trang landing Sprint 2) |
| Logo SVG | Chờ INV | Không chặn Sprint 1 |
| Zalo OA, ZBS | Chờ INV | US-161/162 nghiệm thu chế độ gửi tay |
| Tên chủ tài khoản nhận cọc | Chờ INV | Không chặn mã; INV tự nhập trên màn R3-Q51 khi xong |
| Tài khoản gửi email giao dịch (ESC-010, giả định SES) | Chưa có | Email của 2FA (dùng mã khôi phục), R3-Q51 (báo đổi tài khoản), US-141 (mã một lần) chạy với **adapter email mock** trên CI/staging. Gửi thật là điều kiện trước dữ liệu thật – ORC nhắc INV |
| Beds24, MISA, luật sư ESC-001 | Chờ INV | Không chặn Sprint 1 |
| Backup tự động của Nhân Hòa | INV đang hỏi | Không chặn Sprint 1 (staging dữ liệu giả) |

## 3. Phạm vi Sprint 1

### 3.1 Lượt kiểm tiền riêng (C1 mở một lần – theo đúng thứ tự)

| Bước | Mục | Vai làm | Điều kiện gộp | AC / oracle |
|---|---|---|---|---|
| 1 | **R3-Q21 – BUG-R2-210** (nợ ghi trước 0076) | BE-B (BE-A review) | CI xanh; QA + SEC xác nhận `openDebtVnd` đúng trên dữ liệu ghi trước 0076 | BR-525 (ii); ca R8VER-02 |
| 2 | **R3-Q20 – BUG-R2-209** (J15 ghi phần chênh, ARC 16.31.2 b) | BE-B | Song song bước 3 được nếu khác tệp; chung tệp với 208 thì 209 trước. Sau bước 1 | BR-427 (d), BR-525-02; gỡ `pendingFix` BUG-R2-209 |
| 3 | **R3-Q19 – BUG-R2-208** (N-7 theo số, ARC 16.31) | BE-B | **Sau bước 1. SEC review trên head SHA sẽ gộp** (`reviews/SEC-on-BE-208.md`, điều kiện D của `s1-security-requirements.md`) | BR-525-16 (DOM xác nhận 21/10); gỡ `pendingFix` BUG-R2-208 |
| 4 | **R3-Q22 – SEC-BE-83 + ESC-026 A** (cộng dồn xóa nợ / FOC cùng khóa; khác khóa → báo OWN) + R3-Q25 | BE-B (BE-D làm dòng "Cần chú ý" của OWN qua cổng đọc) | Sau bước 3; SEC Verified B.5 | US-007 AC7; BR-433 (a)(b)(c) 0.4.0; gỡ `pendingFix` R3-SEC-BE-83 |
| 5 | **R3-Q39 #8–#12**: giá niêm yết `effectiveFrom`, tham số `effectiveFrom`, chặng minibar lúc trả phòng, hạn công nợ (3 ngày – INV xác nhận), gợi ý "đã thực hiện" | FE-A (BE-A phần server nếu có) | Ca đồng hồ giả 02:40 / 05:59 / 06:00 | BR-010, BR-525 (i) |
| 6a | **R3-Q01** OTTIMO hủy vì lỗi cơ sở | BE-A (tính thử/hủy) + BE-B (yêu cầu hoàn) + FE-A | Oracle BR-309-18 qua xem trước rồi ghi | US-021 AC7; BR-309 (vii) |
| 6b | **R3-Q10** minibar HK bắt buộc `periodId` + `roomId` | ARC quyết trước → BE-B → MOB | MOB làm màn sau khi server bắt buộc | US-068 |
| 6c | **R3-Q23** (17/18), **R3-Q24** (L2 → L3 trước phiếu thu), **R3-Q29** (BUG-R2-123 `overbookingResolution`) | BE-A, BE-B | ARC Verified | ARC 16.19/16.31 |
| 6d | **R3-Q02** – chỉ khi Sprint 1 mở đường ghi vào folio đơn đã đóng | BE-B, DOM | Mặc định **không** mở → Should, giữ hướng (a) | BR-522-06 |
| 6e | **US-164 AC4 (a)** – số tiền thu khi hết hạn | BE-A | Lệnh hoàn tất = số server khóa lúc gửi; 409 khi lệch | US-164 AC4, AC8; BR-416 0.4.0 |
| 6f | Ca hồi quy **ESC-023 A**: rút ngắn đơn còn < 7 ngày → phí 0 | QA | Không có mã mới | Ghi chú US-024 |
| 7 | **R3-Q30 – fuzz công nợ** trên bản có 1–6 | QA (critic độc lập đọc log gốc) | Mặc định coi lỗi tiền là P0 tới khi chứng minh được là không | Bất biến BR-525 (ii) |
| 8 | Lượt kiểm tiền đạt → **ORC đóng băng lại mã tiền** tới QC RC | ORC | Dòng decision-log | – |

Thêm 3 điều kiện cho lượt này:
- Mỗi PR tiền có test oracle (`br-examples.json`) và **xem trước = lệnh ghi**.
- ARC review kỹ thuật bắt buộc mọi PR tiền.
- Tối đa **3 vòng** sửa – kiểm lại. Quá 3 vòng → PO cắt Should theo mục 9.3, ORC báo trong tổng kết.

### 3.2 Bảo mật trước dữ liệu thật (song song 3.1, khác tệp)

| Mục | Vai làm | SEC Verified theo | Ghi chú |
|---|---|---|---|
| **R3-Q17**: BE-65 (kiểm lại trên RC), BE-74, BE-75, BE-79 | BE-C (BE-B review phần guests, folio-lines) | `s1-security-requirements.md` B.1–B.4 | US-043, US-048 lên "Đạt" khi BE-74/75/79 Verified |
| **R3-Q22** BE-83 | BE-B | B.5 | Nằm trong lượt kiểm tiền (3.1 bước 4) |
| **R3-Q33 (a)** BE-84 | BE-C (+ ARC chọn a1/a2, UXD + FE-A nếu a1) | B.6 | – |
| **R3-Q15** xóa `note` yêu cầu khách (T13) | BE-D | B.7 | US-109 AC3, US-110 AC4 |
| **US-143** 2FA + khôi phục (ESC-027 B) | BE-C (server), FE-A (màn), OPS (lệnh khôi phục ngoài repo, cờ `mfa_enforced`) | A.1–A.7 | AC1–AC4 |
| **R3-Q51** tài khoản nhận VietQR | BE-B (server: S2, email), FE-A (màn), UXD | C (Q51-1…9) | Làm sau khi S2 của US-143 có. Màn chỉ OWN |
| **R3-Q42** token thông báo `purpose=notify` + ADR-006 điểm 4 | ARC (ADR) → BE-D | Điều kiện [CHẶN] C-6 | Trước US-161 AC5 |
| **R3-Q45** thông tin bên nhận dữ liệu Zalo/VNG → DRA P11 | INT → SEC | C-9 điểm 1 | Phụ thuộc luật sư ESC-001 cho phần thông báo khách |
| **R3-Q31** Dependabot | SEC (đã phân loại 22/10, mục E), FE-A (test `useAfterLoginPath`), OPS (đóng cảnh báo #1) | E | Không gộp PR Dependabot đỏ (D5 cổng R2) |
| **D4 cổng R2**: SEC đọc PWA snapshot 502/503/504 | SEC | – | Ngày D1, trước khi MOB gộp PR PWA |

### 3.3 Story và mục hàng chờ khác của Sprint 1

| Mục | Nội dung | Vai | Phụ thuộc |
|---|---|---|---|
| **US-164** (+ R3-Q03, R3-Q09) | Xác nhận từ xa: gửi → duyệt trên điện thoại của quản lý (PIN, phiên đã qua 2FA) → Desk nhận qua SSE; hết 15 phút → thu đúng số (AC4); xem lại 24 giờ (AC8) | ARC (hợp đồng), BE-A (luồng trả phòng + yêu cầu), BE-D (thông báo, SSE, "Cần chú ý"), FE-A (Desk), MOB (màn duyệt trên điện thoại, PWA hoặc Desk đáp ứng – ARC chọn), BA (danh sách đường cần OWN/MGR tại quầy – AC7), UXD, SEC, QA | US-143 cho phần "phiên đã qua 2FA"; trước đó dùng PIN (SR-AUTH-09) |
| **US-143** | 2FA + khôi phục | Như 3.2 | ARC hợp đồng |
| **US-008** | OWN thêm người dùng (S26), S2 khi tạo/đổi vai (SEC 06.26) | BE-C, FE-B, UXD | US-143 (S2) |
| **US-128 + R3-Q32** | Mã cửa ngẫu nhiên 8 số đặt theo ngày lưu trú dự kiến (INV xác nhận 22/10), BR-403 0.3.9 | DOM (đã có BR), INT (đặc tả khóa ESC-011), BE-C, FE-B, MOB (trang khách hiện mã theo BR-978), UXD, QA, SEC | Không ghi cách đặt mã vào repo |
| **US-141** | Xác minh nhẹ trên trang khách (mã một lần qua email của đơn hoặc mã lễ tân cấp) | BE-D, MOB, UXD, SEC | Email mock tới khi có tài khoản email (mục 2) |
| **US-161** (+ R3-Q42) | Lịch "Tin cần gửi hôm nay", chế độ gửi tay, chép link có `message_log` | BE-D, FE-B, INT (mẫu tin), UXD | R3-Q42 cho AC5 |
| **US-162** | Mời/nhắc check-in online (gửi tay khi chưa có ZBS) | BE-D, FE-B, INT, UXD | US-161 |
| **R3-Q13** | Thông báo chủ động J4 quá giờ trả phòng | ARC (loại thông báo), BE-D, FE-B, QA | US-031 AC3 |
| **R3-Q06** | Phần Desk của US-155: hàng chờ yêu cầu website, chuyển thành báo giá/đơn, SSE, "Cần chú ý", màn S35 | ARC, BE-D, FE-B, SEC, QA | Form landing ở Sprint 2 |
| **R3-Q26, Q27, Q28** | Đọc chéo bảng, gỡ `ModuleRef`, registration qua cổng đọc | BE-C, BE-D, BE-B, BE-A; ARC Verified | Không chạm tiền. Nếu chạm tệp của lượt tiền thì làm sau bước 3 |
| **R3-Q53** | Rà BR-012 theo INV 22/10 (tập trung số phòng) | DOM, UXD, PO | Giả định G3. Sprint 1 chỉ làm tài liệu + thiết kế + cách hiển thị; không xóa dữ liệu tên phòng |
| **R3-Q52** (phần thiết kế) | Ảnh đầu trang tự chạy 3 giây + bộ ảnh theo hạng phòng | UXD (hi-fi + quy tắc chuyển động, ảnh), SEC (C-1) | Lập trình FE-LP ở Sprint 2 |
| **ESC-022 B** | Sửa ví dụ Wi-Fi "OTTIMO_103" trong thiết kế thành mạng chung | UXD | Không đổi mã (app đã lưu một mạng chung) |

### 3.4 Should – làm khi còn chỗ (thứ tự)

1. **R3-Q36, R3-Q37, R3-Q38**: ngày kinh doanh từ server cho Desk và PWA. FE-A, MOB; ARC hợp đồng R3-Q38.
2. **R3-Q11**: PWA báo hủy việc bổ sung minibar. MOB.
3. **R3-Q47, R3-Q48**: UXR P-35, P-36 (hàng đợi PWA, báo hiệu tải một phần). MOB + UXD.
4. **R3-Q46**: US-012 AC3 phần dời. FE-B.
5. **R3-Q50**: các lỗi P3 BUG-R2-214…218 và BUG-R2-219…222 (staging). FE/MOB/QA theo lỗi.
6. **R3-Q04, R3-Q07, R3-Q08, R3-Q18, R3-Q34, R3-Q35**: BE theo luồng, ngoài lượt kiểm tiền.

## 4. Trình tự và phụ thuộc

### 4.1 Mốc

| Mốc | Việc phải xong |
|---|---|
| **D1** | ORC giao việc, ghi decision-log mở C1. ARC bắt đầu hợp đồng. SEC D4 (PWA snapshot). BE-B bắt đầu bước 1 (210 – không cần hợp đồng mới). DOM gửi oracle cho 6a, bước 4, US-164 AC4/AC8. QA viết test plan Sprint 1 |
| **D2** | **ARC chốt hợp đồng Sprint 1** (mục 4.2), sinh lại `meta/api-client`, `--check` + `--strict`, báo BE/FE/MOB/INT/QA trong ngày. BA rà danh sách đường cần OWN/MGR tại quầy (US-164 AC7), sửa rbac cho US-164, R3-Q51, R3-Q06, US-008 |
| **D3** | Bước 1 (210) gộp. US-143 phần server có trên nhánh |
| **D5** | Bước 2–3 (209, 208) gộp, SEC đã review 208. US-143 xong mã; R3-Q51 bắt đầu |
| **D7** | Bước 4–6 gộp. US-164 xong mã. 6 thẻ SEC đã có PR |
| **D8** | QA chạy fuzz R3-Q30 + critic. ORC + QA kiểm G1 (mục 8). G1 chưa xanh → cổng Sprint 1 lùi, giống quy tắc D8 của Sprint 4 R2 |
| **D9–D10** | Kiểm lại sau sửa; SEC Verified; PO nghiệm thu; QC cổng Sprint 1 |

Lịch R-6 (`plan.md` 2.1a) chạy song song:
- 23/10 sau 14:00: QA chạy A1 phần 2;
- 25/10 trước 12:00: QA chạy A1 phần 3;
- PO nghiệm thu bổ sung sau mỗi phần;
- QC chấm lại cổng R2 muộn nhất 28/10.

### 4.2 ARC chốt hợp đồng trước khi code (D1–D2)

ARC ra bản OpenAPI kế tiếp (số phiên bản do ARC chọn) gồm:
1. **US-143**: đăng ký TOTP, `loginMfa`, mã khôi phục, `mfaToken`, S2 token dùng một lần, lỗi `MFA_ENROLLMENT_REQUIRED` / `MFA_INVALID`, idempotency không lưu thân (SEC 06.9). Lệnh khôi phục 06.33 **không** có endpoint.
2. **US-164**:
   - yêu cầu xác nhận từ xa (tạo, xem, duyệt bằng PIN, từ chối, hết hạn, hoàn tất khi hết hạn theo 06.30);
   - sự kiện SSE; loại thông báo; dòng "Cần chú ý" xem lại 24 giờ (AC8);
   - kênh đẩy tới điện thoại quản lý trong hạ tầng hiện có.
3. **R3-Q51**: đọc lịch sử / đặt / hủy dòng lên lịch `payment_receiving_account`, `accountNoMasked`, S2.
4. **US-007 AC7 / BR-433 (c)**: loại thông báo + dòng "Cần chú ý" của OWN (khác khóa vượt hạn mức); tham số ngưỡng "chờ duyệt" mặc định tắt.
5. **US-021 AC7**: mã lý do hủy "lỗi cơ sở" (đề xuất `property_fault`), nhánh hoàn đủ trong `cancellationQuote`.
6. **R3-Q13**: loại thông báo J4 `checkout_overdue`.
7. **R3-Q42**: token `purpose=notify` + sửa ADR-006 điểm 4.
8. **R3-Q06**: list/get/transition yêu cầu website theo vai, chuyển thành báo giá/đơn, SSE (Q-W09).
9. **US-008**: tạo người dùng; **US-128**: tham số mã cửa 8 số; **US-141**: xác minh nhẹ; **US-161/162**: lịch tin, `message_log`.
10. **R3-Q10**: quyết server bắt buộc `periodId` với vai HK.
11. **16.31** cho 208/209 (đã có – xác nhận lại trên `main` hiện tại).
12. **B.6** của SEC: chọn (a1) hay (a2).
13. Nếu làm Should: `Me.property.businessDate` (R3-Q38).

Mục chưa chốt ở D2 → BE không code phần đó; ARC ghi "contract-ahead" có nhãn như R2.

### 4.3 Phụ thuộc chính

| Việc | Cần trước |
|---|---|
| Bước 2–3 lượt tiền (209, 208) | Bước 1 (210) gộp; SEC review 208 trên commit gộp |
| Bước 4 (BE-83 + ESC-026 A) | Bước 3; oracle DOM; ARC loại thông báo |
| R3-Q51, US-008 | S2 của US-143 |
| US-164 duyệt trên phiên đã qua 2FA | US-143; trước đó PIN (SR-AUTH-09) |
| US-161 AC5 | R3-Q42 |
| `mfa_enforced = true` trên staging | US-143 Verified + INV đã đăng ký 2FA và cất mã khôi phục + OPS đã diễn tập lệnh khôi phục |
| MOB màn minibar HK | R3-Q10 phía server |
| Fuzz R3-Q30 | Bước 1–6 đã gộp |

## 5. Bảng giao việc theo vai (một bảng duy nhất)

Đầu ra mỗi vai là `rounds/round-03/outputs/<VAI>/s1-report.md` (Đã làm gì · File tạo/sửa · Giả định · Rủi ro/vướng mắc · Việc chưa xong), cộng các tệp riêng ghi ở cột cuối. Sản phẩm thật nằm trong `product/`.

| Vai | Việc Sprint 1 | Đầu ra |
|---|---|---|
| **ARC** | Hợp đồng mục 4.2 (D1–D2). Review kỹ thuật **bắt buộc** mọi PR tiền (mục 3.1), PR US-143/164, R3-Q51. Quyết R3-Q10, B.6. Verified R3-Q23, Q24, Q26, Q27, Q28, Q29 (test kiến trúc). Kiểm `ModuleRef` gỡ hết | `product/docs/api/openapi.yaml`, `erd.md`, ADR-006 sửa; `outputs/ARC/s1-contract.md`; `reviews/ARC-sprint1.md` |
| **BE-A** (đơn, nhận/trả phòng) | R3-Q01 phần tính thử/hủy; US-164 luồng trả phòng (gửi, khóa số, hoàn tất khi hết hạn – AC1, AC3, AC4, AC5); R3-Q09; R3-Q29; R3-Q23 phần A; review PR 210/208 của BE-B; cổng đọc cho R3-Q26/28 phía đơn | Mã + test oracle; `outputs/BE/s1-be-a.md` |
| **BE-B** (folio, thu, FOC, duyệt, hoàn) | **Lượt kiểm tiền bước 1–4** (210 → 209 → 208 → BE-83 + ESC-026 A + R3-Q25); R3-Q24; R3-Q23 phần B; R3-Q01 phần yêu cầu hoàn; R3-Q10 phía server; **R3-Q51 phía server** (S2, email mock, Q51-1…9); R3-Q02 chỉ khi điều kiện xảy ra; R3-Q27 phần payments | `outputs/BE/s1-be-b.md` |
| **BE-C** (bảo mật dữ liệu, giấy tờ, HK, người dùng) | **US-143 phía server** (SEC A.1–A.7, đăng ký TOTP, mã khôi phục, `loginMfa`, S2, phiên hạn chế); **R3-Q17** (BE-65 kiểm lại, BE-74, BE-75, BE-79); **R3-Q33 (a)**; **US-008** phía server; **US-128/R3-Q32** phía server; R3-Q26 (housekeeping đọc chéo), R3-Q28 | `outputs/BE/s1-be-c.md` |
| **BE-D** (đọc, SSE, thông báo, khách, website) | **R3-Q15** (T13 + `purge_journal`); **R3-Q13** (J4); US-164 phần thông báo + SSE + "Cần chú ý" AC8; dòng "Cần chú ý" của US-007 AC7 (cổng đọc từ BE-B); **R3-Q06** (Desk yêu cầu website); **US-161, US-162** (lịch tin, gửi tay, `message_log`); **R3-Q42**; **US-141** phía server (email mock) | `outputs/BE/s1-be-d.md` |
| **FE-A** (Desk – tiền, bảo mật) | Màn 2FA: đăng ký, bước 2, mã khôi phục, màn hạn chế, lời nhắc chủ duy nhất, S2 dialog dùng chung. **R3-Q51** (Q51-3: không điền sẵn, gõ hai lần, xóa form khi rời). US-164 phía Desk: gửi, chờ, nhận SSE, hết hạn → "Hoàn tất – thu đúng số máy tính" khóa số, lý do. R3-Q01 UI hủy "lỗi cơ sở". **R3-Q39 #8–#12**. Test `useAfterLoginPath` (SEC E). Should: R3-Q36 | `product/apps/admin-web`; `outputs/FE/s1-fe-a.md` |
| **FE-B** (Desk – vận hành) | **US-008** S26 thêm người dùng. **R3-Q13** chuông/thẻ quá giờ. **R3-Q06** màn S35 hàng chờ yêu cầu website. **US-161/162** "Tin cần gửi hôm nay", chép link. **US-128** nhập/hiện mã cửa 8 số (che theo vai). Dòng "Cần chú ý" mới: US-007 AC7, US-164 AC8, R3-Q33 (a1 nếu ARC chọn). Hiển thị căn theo R3-Q53 khi DOM/UXD chốt. Should: R3-Q46, R3-Q50 phần Desk | `outputs/FE/s1-fe-b.md` |
| **MOB** | **Màn duyệt từ xa của quản lý trên điện thoại** (US-164 AC2; theo ARC chọn: PWA "OTTIMO Staff" hay Desk đáp ứng) – PIN, xem đủ số trước khi duyệt, từ chối có lý do. **R3-Q10** màn minibar HK (sau server). **US-141** trang khách (nhập mã một lần). **US-128** trang khách hiện mã cửa theo BR-978. Should: R3-Q11, R3-Q37, R3-Q47, R3-Q48 | `product/apps/mobile`, `product/apps/guest-web`; `outputs/MOB/s1-report.md` |
| **INT** | **R3-Q45**: thu thông tin bên nhận dữ liệu Zalo/VNG (tên pháp nhân, nơi lưu, vai theo điều khoản ZBS) → gửi SEC. **R3-Q32**: cập nhật đặc tả khóa (ESC-011) theo mã 8 số – không ghi cách đặt mã. **Mẫu tin US-161/162** (VI/EN, theo brand: tiếng Anh dẫn, không emoji) cùng UXD. Chuẩn bị Beds24 sandbox/mock cho Sprint 2 (không code kết nối thật) | `product/docs/integrations/*`; `outputs/INT/s1-report.md` |
| **DOM** | Hoàn tất **BR 0.4.0** (đang ghi): BR-416 (ESC-024 B), BR-433 (c) (ESC-026 A), BR-437 (ESC-027 B), BR-309 (iii)(vii), BR-012 (7), BR-525 (i). Gỡ nhãn giả định INV đã xác nhận 22/10 (hạn công nợ 3 ngày, giá đêm thêm, mã cửa, giường phụ 1m4 Premium 302/402). **Oracle** cho lượt kiểm tiền: 6a (BR-309-18), bước 4 (vượt/không vượt, khác khóa), US-164 AC4/AC8, ca ESC-023 A phí 0. **R3-Q53**: đề xuất sửa BR-012 theo giả định G3. Review AC mới của PO | `product/docs/business-rules.md`, `product/tests/fixtures/br-examples.json`; `outputs/DOM/s1-report.md` |
| **BA** | Danh sách đường cần OWN/MGR có mặt tại quầy (US-164 AC7) trước D2. rbac: US-164 (duyệt từ xa), R3-Q51 (chỉ OWN), R3-Q06 (S35), US-008 (A100 + S2), mã lý do hủy "lỗi cơ sở" (chỉ MGR+). Đặc tả: `specs/EP00-platform.md` (2FA, S2, khôi phục), `specs/EP03-05-stay.md` (US-164), `specs/EP19-website-requests.md` (Desk). Review AC mới của PO | `product/docs/specs/*`, `rbac-matrix.*`; `outputs/BA/s1-report.md` |
| **UXD** | **Theo brand OTTIMO (bắt buộc).** Hi-fi + chuỗi VI/EN: 2FA (đăng ký, QR, mã khôi phục bằng JetBrains Mono, `auth.enroll.single_owner`), S2 dialog, R3-Q51, màn duyệt từ xa trên điện thoại (360/390 px), hết hạn + "Hoàn tất – thu đúng số máy tính", dòng "Cần chú ý" mới, S35, US-008, "Tin cần gửi hôm nay", mẫu tin cùng INT, trang khách US-141/US-128. **R3-Q52** hi-fi landing (ảnh chạy 3 giây, bộ ảnh hạng phòng, giảm chuyển động, không thư viện ngoài). **R3-Q53** rà giao diện khách theo số phòng, ghi lệch với Brand Guidelines. Sửa ví dụ Wi-Fi (ESC-022 B). Review FE/MOB | `product/design/`; `outputs/UXD/s1-report.md` |
| **SEC** | D4 (PWA snapshot) ngày D1. Review bắt buộc: PR 208 (điều kiện D), US-143, US-164, R3-Q51, R3-Q06, US-141, US-128. Verified 6 thẻ theo B.0 trên commit gộp. Cập nhật `security-requirements.md` SR-AUTH-06/11 theo mục A. Review R3-Q42, R3-Q45 (DRA P11). Phân loại Dependabot mới. Xác nhận `mfa_enforced` trên staging | `reviews/SEC-sprint1.md`, `reviews/SEC-on-BE-208.md`; `outputs/SEC/s1-security-requirements.md` (đã có), `outputs/SEC/s1-report.md` |
| **QA** | Test plan Sprint 1 (D1). Ca: lượt kiểm tiền (oracle qua xem trước rồi ghi), **fuzz R3-Q30** + critic độc lập, ca SEC A.7/B/C/D, ca đồng hồ giả (J4 11:59/12:00/12:30/12:31; US-164 14:59/15:00 phút; AC8 24 giờ; TOTP ±1 bước; R3-Q39 02:40/05:59/06:00), ca hồi quy ESC-023 A, ca R3-Q15. TC cho mọi AC mới; giữ `gen_traceability.py --strict` xanh. **R-6**: A1 phần 2 (23/10), phần 3 (25/10), VoiceOver US-135 AC3. Sổ lỗi | `rounds/round-03/qa/s1-test-plan.md`, `product/tests/`, `rounds/round-03/qa/bug-list.md`, `rounds/round-03/qa/s1-test-report.md` |
| **OPS** | Thủ tục khôi phục 2FA bằng lệnh quản trị (06.33) – tài liệu **ngoài repo**, diễn tập một lần trên staging, biên bản không ghi thủ tục. Cờ `mfa_enforced` trên staging (bật khi đủ điều kiện 4.3). Adapter email mock trên staging. Giữ thủ tục 0076 (V4). Đóng cảnh báo Dependabot #1. Giám sát deploy; không chạm `OTM-00239` | `outputs/OPS/s1-report.md` |
| **DATA** | Kiểm dòng "Cần chú ý" mới và nhật ký `money` của US-007 AC7, US-164 AC4/AC8 lưu đủ trường cho báo cáo FOC/hậu kiểm Sprint 2; chuẩn bị định nghĩa cột US-104 (để BE-D Sprint 2) | `outputs/DATA/s1-report.md` |
| **UXR** | Đi thử màn duyệt từ xa trên điện thoại (360/390 px) và đăng ký 2FA (kịch bản quản lý ở nhà buổi tối) – mô phỏng; ghi mức nghiêm trọng | `product/docs/research/usability-report-r3.md` |
| **PO** | Trả lời câu hỏi trong ngày (`outputs/PO/qa-log.md`). Nghiệm thu từng AC (`outputs/PO/s1-acceptance.md`); AC giao diện chỉ nhận khi có ca UI bấm thật hoặc QA chạy tay có ảnh. R-6 nghiệm thu staging (23/10, 25/10). R3-Q53 cùng DOM/UXD; sửa AC dính tên phòng khi INV xác nhận. Review UXD, QA test plan, DATA | Như cột trái |
| **QC** | Cổng QC Sprint 1 (mục 8). Chấm lại cổng QC Round 2 sau R-6 (muộn nhất 28/10). Quyết nhận hay không đề xuất ca đồng hồ giả (`plan.md` mục 6) | `rounds/round-03/qc/s1-qc-gate.md`; `rounds/round-02/qc/round-qc-gate.md` (chấm lại) |
| **ORC** | Ghi decision-log mở C1; giao việc theo bảng này; theo dõi mốc D3/D5/D7; điều phối critic lượt tiền; quyết định D8; nhắc INV mục 11; đóng băng lại mã tiền khi lượt đạt | decision-log, `rounds/round-03/sprint-1-summary.md` |

## 6. Kế hoạch kiểm thử Sprint 1 (QA – chi tiết ở `rounds/round-03/qa/s1-test-plan.md`)

- **Tiền:**
  - mỗi bước của 3.1 có ca oracle từ `br-examples.json`, chạy qua xem trước rồi ghi;
  - fuzz R3-Q30 sau bước 6;
  - critic độc lập đọc log gốc;
  - mức lỗi theo `test-strategy.md` mục 8.
- **Bảo mật:** ca bắt buộc của SEC (A.7, B.1–B.7, C, D). Quét log, audit, idempotency không có mã TOTP, mã khôi phục, số tài khoản đầy đủ.
- **Giờ đêm và mốc thời gian:**
  - ca đồng hồ giả chạy trong mọi lượt CI push;
  - màn mới có ô ngày hoặc gọi API theo ngày phải có ca đồng hồ giả (quy tắc đề xuất ở `plan.md` mục 6);
  - T9 hằng đêm vẫn chạy; đỏ thì ghi sổ lỗi trong 24 giờ, kèm phân loại.
- **UI:**
  - E2E Playwright cho màn mới (2FA, R3-Q51, US-164 Desk + màn duyệt điện thoại, S35, US-008);
  - axe 0 lỗi nghiêm trọng;
  - điện thoại 360/390 px cho màn duyệt từ xa và trang khách.
- **Staging:**
  - phần chạy được trên image production thì chạy trên staging sau mỗi lượt deploy (smoke + luồng mới);
  - phần cần đồng hồ giả/test-support chạy trên stack CI cùng commit.
- **Truy vết:**
  - TC cho mọi AC mới của mục 3;
  - AC R3 của story R2 mang nhãn `[Dời R3 – R3 Sprint 1]` nên không đổi số Must R2;
  - `gen_traceability.py --strict` phải xanh.

## 7. Điều kiện mang sang từ Round 2 – xếp vào Sprint 1

| Điều kiện (`round-qc-gate.md` mục 6 / `s4-qc-gate.md`) | Xếp ở |
|---|---|
| D1 / C1 lượt kiểm tiền riêng có critic | Mục 3.1 |
| D2 / C2 thủ tục OPS 210 | Ràng buộc 4; giữ tới R3-Q21 Closed |
| D3 SEC Major dời + ESC-026 A | Mục 3.2; 3.1 bước 4 |
| D4 / C5 SEC đọc PWA snapshot | Mục 3.2, ngày D1 |
| D5 / C9 PR Dependabot đỏ không gộp | Mục 3.2 R3-Q31 |
| D6 ARC mục F (R3-Q36…Q38), US-012 AC7 (R3-Q12), US-031 AC1 (R3-Q13), logo | R3-Q13 ở 3.3; R3-Q36–38 Should 3.4; R3-Q12 Sprint 2; logo khi INV gửi |
| D7 kiểm chứng với người dùng thật | Trước bản dùng thử (Sprint 3–4); Sprint 1 UXR mô phỏng |
| D8 BR-403 mã cửa 8 số | Mục 3.3 US-128 + R3-Q32 |
| D9 / C13 báo cáo CI dẫn `gh run list -L 5` | Mọi báo cáo Sprint 1 |

## 8. Tiêu chí QC Sprint 1

### 8.1 Bảng kiểm

| # | Tiêu chí | Đạt khi |
|---|---|---|
| G1 | **Tiền** | Bước 1–6 của 3.1 gộp. Mỗi mục có test oracle; xem trước = lệnh ghi. `pendingFix` BUG-R2-208, BUG-R2-209, R3-SEC-BE-83, R3-OTTIMO-FAULT-CANCEL đã gỡ. BUG-R2-210 Closed. Fuzz R3-Q30: 0 vi phạm bất biến. Critic: 0 ca lệch tiền, 0 Major. SEC đã review 208 trên commit gộp. **Không ngoại lệ** |
| G2 | **Bảo mật** | SEC Verified BE-65, 74, 75, 79, 83, 84 (a) và R3-Q15. US-143 AC1–AC4 và R3-Q51 có SEC review, đạt ca A.7 và C. 0 Critical/High mở. Không bí mật, số tài khoản, thủ tục khôi phục chi tiết trong repo (gitleaks + SEC rà) |
| G3 | **Review** | PR theo ma trận review (ARC bắt buộc PR tiền; SEC theo 3.2). Thẻ Blocker/Major của review Sprint 1 xử lý hoặc dời có lý do |
| G4 | **Luồng** | E2E: trả phòng có phụ thu thay đêm → gửi quản lý → duyệt trên điện thoại → Desk nhận; nhánh hết 15 phút → thu đúng số → OWN thấy dòng xem lại. Đăng nhập OWN có 2FA → đặt tài khoản nhận VietQR (S2) → QR có cảnh báo "vừa đổi". Xanh trên CI |
| G5 | **CI** | Xanh trên commit chấm: api, E2E (0 `retry #`), `api-contract` (`--strict`), `contract-lint`, gitleaks, `pnpm audit` 0 high, `gen_traceability.py --strict`. Ca đồng hồ giả của màn mới chạy trong lượt push. Không có lượt T9 đỏ chưa ghi/chưa phân loại (C13: dẫn `gh run list --workflow CI -L 5`) |
| G6 | **Story** | US-143, US-164, US-008, US-128 (+ R3-Q32), US-141, US-161, US-162 và R3-Q06, R3-Q13, R3-Q15, R3-Q26–28, R3-Q51 ≥ "Đang nghiệm thu" có lý do cụ thể, hoặc "Đạt (stack CI)". Phần chạy được trên staging: "Đạt (staging)" |
| G7 | **Lỗi** | 0 P0/P1 Open. P2 mở có kế hoạch |
| G8 | **Thương hiệu** | Màn mới theo token DS v0.4 + Brand Guidelines; AA; axe 0 nghiêm trọng; chữ khách nhìn thấy (US-141, US-128, mẫu tin) đúng giọng thương hiệu, không emoji |

### 8.2 Quyết định

| Quyết định | Điều kiện |
|---|---|
| **ĐẠT** | G1–G8 đạt |
| **ĐẠT CÓ ĐIỀU KIỆN** | G1, G2, G4, G5, G7 đạt. Thiếu ≤ 2 dòng trong G3, G6, G8, có kế hoạch ở Sprint 2. Trong G6: tối đa 2 mục **không phải tiền, không phải bảo mật** chuyển Sprint 2, ORC ghi decision-log |
| **KHÔNG ĐẠT** | Các trường hợp còn lại |

**Quy tắc lùi cổng ở D8:**
- Cuối D8, ORC + QA kiểm G1. Chưa xanh → cổng Sprint 1 lùi, QC không chấm trong D10, không cấp ngoại lệ tiền.
- Việc khác vẫn chạy tiếp, nhưng PR tiền mới **không** được mở ngoài danh sách 3.1.
- Cổng QC Round 2 (chấm lại) là cổng riêng, không tính vào cổng Sprint 1.

## 9. Năng lực, rủi ro, thứ tự cắt

### 9.1 Ước lượng (ngày-người, [PO – các vai xác nhận khi nhận việc])

| Luồng | Việc | Ước lượng |
|---|---|---|
| BE-B | Lượt tiền bước 1–4 + R3-Q24/23B + R3-Q51 server + R3-Q10 | 6–8 |
| BE-A | US-164 luồng trả phòng + R3-Q01 + R3-Q29/23A/09 + review | 5–6,5 |
| BE-C | US-143 server + R3-Q17 + R3-Q33 (a) + US-008 + US-128 + R3-Q26/28 | 7–9 |
| BE-D | R3-Q15, R3-Q13, US-164 thông báo/SSE, R3-Q06, US-161/162, R3-Q42, US-141 | 7–9 |
| FE-A | 2FA màn + S2 + R3-Q51 + US-164 Desk + R3-Q01 UI + R3-Q39 | 6–8 |
| FE-B | US-008, R3-Q13, S35, US-161/162, US-128, dòng "Cần chú ý" | 5–7 |
| MOB | Màn duyệt từ xa, R3-Q10, US-141, US-128 trang khách | 4–5,5 |
| ARC | Hợp đồng 4.2 + review | 3–4 |

Sprint 1 nặng hơn một sprint R2 trung bình. Thứ tự cắt (mục 9.3) đã định trước để ORC cắt không cần hỏi lại.

### 9.2 Rủi ro

| Rủi ro | Ảnh hưởng | Cách giảm |
|---|---|---|
| Lượt tiền sinh lỗi cùng lớp (công nợ) | Trễ G1 | Thứ tự cố định; fuzz; critic; tối đa 3 vòng |
| ARC chốt hợp đồng trễ quá D2 | BE/FE chờ | BE-B làm bước 1 (không cần hợp đồng mới); FE/MOB dựng màn bằng MSW theo bản nháp; mục chưa chốt ghi contract-ahead |
| 2FA khóa nhầm INV khỏi staging | INV không vào được | `mfa_enforced` chỉ bật sau khi INV đăng ký + cất mã + OPS đã diễn tập lệnh khôi phục (G4) |
| Đụng `OTM-00239` hoặc dữ liệu R-6 trên staging | Cổng R2 trượt | Ràng buộc 2; deploy Sprint 1 lên staging vẫn qua người duyệt; QA báo trước mỗi lượt chạy tay |
| Email chưa có nhà cung cấp | Thông báo ngoài app (SEC 06.15, Q51-6) chưa gửi thật | Adapter mock; điều kiện trước dữ liệu thật; ORC nhắc INV (ESC-010) |
| Repo công khai lộ thủ tục khôi phục hoặc cách đặt mã cửa | Rủi ro an ninh | OPS/INT viết ngoài repo; SEC rà PR |

### 9.3 Thứ tự cắt (cắt từ trên xuống; ORC cắt theo đúng thứ tự, không cần hỏi lại)

1. Mọi Should mục 3.4.
2. R3-Q52 phần hi-fi (UXD) → đầu Sprint 2.
3. US-162 → Sprint 2 (giữ US-161).
4. R3-Q06 phần chuyển thành báo giá/đơn (giữ hàng chờ + "Cần chú ý") → Sprint 2.
5. US-141 → Sprint 2.
6. R3-Q26/27/28 → Sprint 2 (hạn vẫn trước bản dùng thử).

**Không cắt:** lượt kiểm tiền 3.1, 6 thẻ SEC, US-143, US-164, R3-Q51, R3-Q15, R3-Q13, US-128 + R3-Q32.

## 10. Giả định

| # | Giả định | Ai xác nhận |
|---|---|---|
| G1 | Sprint 1 dài 10 ngày làm việc D1–D10, D1 = ngày ORC giao việc | ORC |
| G2 | Nếu QC chưa nhận đề xuất ca đồng hồ giả (`plan.md` mục 6), G5 dùng lại điều kiện "lượt T9 gần nhất xanh" của Sprint 4 | QC |
| G3 | **[GIẢ ĐỊNH – chờ INV xác nhận] R3-Q53.** Theo câu INV 22/10 "bỏ qua tên phòng, tập trung số phòng":<br>• số căn là định danh chính trên chữ khách và nhân viên nhìn thấy;<br>• tên phòng thành trường tùy chọn, để trống thì không hiện;<br>• không xóa dữ liệu tên phòng đã có;<br>• không đổi giao diện khách thật cho tới khi INV xác nhận. ORC hỏi một câu xác nhận ở tổng kết Sprint 1, kèm ghi chú lệch Brand Guidelines của UXD. Không phải ESC mới: INV đã nêu hướng | INV qua ORC |
| G4 | `mfa_enforced = true` trên staging bật khi đủ 3 điều kiện ở 4.3. Trước đó OWN/MGR thấy lời nhắc bắt buộc (SEC 06.3) | SEC, OPS, INV |
| G5 | Màn duyệt từ xa của quản lý: ARC chọn PWA "OTTIMO Staff" hay Desk đáp ứng điện thoại. PO không chỉ định | ARC |
| G6 | US-161/162 nghiệm thu ở chế độ gửi tay (không ZBS) | PO (ESC-021 đã cho phép) |
| G7 | Email giao dịch dùng adapter mock trên CI và staging tới khi INV mở tài khoản (ESC-010, giả định SES vùng Singapore của INT 15/10) | INV qua ORC |
| G8 | Thời hạn chờ US-164 = 15 phút, xem lại = 24 giờ, là tham số OWN chỉnh được (ESC-024 B) | Đã xác nhận |

## 11. Việc chờ INV (không có ESC mới)

ORC gom và nhắc INV ở tổng kết Sprint 1 hoặc khi cần:
1. Câu xác nhận R3-Q53 (G3): khách và nhân viên gọi căn bằng số phòng, bỏ tên The Pine…, đúng ý anh/chị chưa?
2. Logo SVG gốc (Sprint 2).
3. Zalo OA đã xác thực + ZBS (Sprint 2).
4. Tên chủ tài khoản nhận cọc. INV tự nhập trên màn R3-Q51 khi xong, không gửi qua chat.
5. Beds24 (đầu Sprint 2), MISA (Sprint 3).
6. Luật sư ESC-001 (trước QC RC).
7. Câu trả lời của Nhân Hòa về backup (trước dữ liệu thật).
8. Tài khoản gửi email giao dịch (ESC-010) – trước dữ liệu thật.
9. **Khi US-143 lên staging:** INV cài ứng dụng xác thực, đăng ký 2FA, cất 10 mã khôi phục tách khỏi điện thoại. OPS hướng dẫn, không qua chat.

## 12. Việc cần ghi decision-log (ORC ghi khi commit/giao việc)

- Mở C1 một lần cho lượt kiểm tiền Sprint 1 (V3 `plan.md`).
- Bảng giao việc mục 5 là bảng duy nhất của Sprint 1.
- Quy tắc lùi cổng D8 (mục 8.2).
- Khi lượt kiểm tiền đạt: đóng băng lại mã tiền tới QC RC.
