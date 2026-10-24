# Danh sách lỗi – Round 3

- Tác giả: QA | Mở: 23/10/2026 – Sprint 1, bước Kiểm thử (phân loại CI 39976959706 trên `origin/main` 8368fac, job "docker images build · E2E smoke")
- Mức lỗi theo `product/docs/qa/test-strategy.md` mục 8. Lỗi tồn từ R2: `rounds/round-02/qa/bug-list.md` (không chép lại; BUG-R2-218 vẫn Open – ca `TC-L7-053` là `test.fail` đúng dự kiến).
- Mã: `BUG-R3-xxx`. Nếu luồng QA khác (fuzz R3-Q30) cũng mở tệp này cùng lúc, ORC gộp và cấp lại số liên tiếp khi merge; ca E2E tham chiếu mã qua `e2e/support/known-bugs.ts`.

## 1. Tổng hợp

| Mức | Số lỗi | Open | Fixed | Closed |
|---|---|---|---|---|
| P0 | 2 | 2 | 0 | 0 |
| P1 | 6 | 4 | 0 | 2 |
| P2 | 3 | 3 | 0 | 0 |
| P3 | 0 | 0 | 0 | 0 |
| **Tổng** | **11** | **9** | **0** | **2** |

Cập nhật 24/10 (luồng QA phụ – E2E US-155 trên stack `ottimo-qa155`, `0ac4261`): thêm BUG-R3-007…011. Báo cáo: `rounds/round-03/outputs/QA/s1-us155-e2e.md`.

## 2. Bảng lỗi

| ID | Mức | Mô tả ngắn | Vai | Trạng thái |
|---|---|---|---|---|
| BUG-R3-001 | P1 | Desk "Xóa công nợ" không xin xác thực lại người xin (R3-Q25) → mọi lần xóa nợ trên Desk bị 422 `secret` REQUIRED | FE-A (+ UXD chữ) | **Closed** (QA xác nhận 24/10 – TC-X-082 đạt) |
| BUG-R3-002 | **P0** | Tiền dư phát sinh sau trả phòng (A32 void/giảm khi không còn công nợ) không thành yêu cầu hoàn; J15 đóng folio vẫn còn tiền dư | BE-B (folio/J15) | **Verified** 24/10 (ca tái hiện + fuzz thử); Closed sau lượt fuzz cuối G1 |
| BUG-R3-003 | **P0** | Xóa nợ của MGR vượt cơ sở hạn mức nhưng `required_role = front_desk_lead`; lễ tân trưởng duyệt được (200) | BE-B (approvals/BR-433) | **Verified** 24/10 (ca tái hiện + fuzz thử); Closed sau lượt fuzz cuối G1 |
| BUG-R3-004 | **P1** | Đã void hết đêm phòng sau trả phòng, MGR vẫn tự áp xóa nợ theo số chụp B18, không chuyển OWN (BR-433 (a) "không có đêm nào → chờ OWN") | BE-B (BR-433 (d) cơ sở) | **Verified** 24/10 (ca tái hiện + fuzz thử); Closed sau lượt fuzz cuối G1 |
| BUG-R3-005 | P1 | H09 Đặt phòng mới: ô "Số tiền đã nhận" giữ cọc của lần tính giá **đầu tiên**, không theo lần tính giá sau (gốc của `booking.test.tsx` chập chờn) | FE (H09 – `BookingDialog`) | **Closed** (QA xác nhận 24/10) |
| BUG-R3-006 | P2 | Test admin-web phụ thuộc giờ: từ 00:00 đến 05:59 một số ca đỏ vì lấy `todayLocal()` trong khi app mở form theo **ngày nghiệp vụ** (BR-010) | FE-A, FE-B (+ QA cho 2 ca BUG-R3-005, đã sửa) | Open |
| BUG-R3-007 | **P1** | US-155: `Me.screens` của server không có **S35** cho vai nào → Desk thật ẩn "Yêu cầu từ website" và chặn `/website-requests` ("Bạn không có quyền mở trang này"), kể cả nút "Mở" của "Cần chú ý" | BE-D (`identity/internal/screens.ts`) | Open – **chặn mốc bật form** |
| BUG-R3-008 | **P1** | US-155: công tắc `public_booking_requests_enabled` không đổi lại được trong ngày đã đặt (422 "value already effective") → OWN bật form xong không tắt ngay được khi có spam/sự cố | BE-D + ARC (mô hình tham số) | Open – **chặn mốc bật form** |
| BUG-R3-009 | **P1** | US-155 AC5: số CCCD viết cách nhóm (`079 203 012 345`) trong lời nhắn được nhận (202) và lưu vào yêu cầu; chỉ dãy 12 số liền bị chặn | BE-D (`website-request-rules.ts`) | Open – **chặn mốc bật form** |
| BUG-R3-010 | P2 | S35: lễ tân trưởng (FDL) không thấy dòng "Form đặt phòng trên website đang tắt" – đọc công tắc trả 404 cho FDL, FE coi là "không biết" | FE-B + BE-D | Open |
| BUG-R3-011 | P2 | H09 "Tạo đơn" từ yêu cầu website: ô Kênh/Nguồn vẫn sửa được (AC2: nhân viên không đổi được nguồn); đổi thì server 422, Desk chỉ báo "Không áp dụng được cho đơn này." | FE-B (+ UXD chữ) | Open |

## 3. Chi tiết

### BUG-R3-001 – Desk "Xóa công nợ" không gửi xác thực lại theo R3-Q25
- **Mức:** P1. Lỗi chạm tiền nên QA xét P0 trước. Hạ xuống P1 vì đã chứng minh lỗi chặn an toàn (fail-closed):
  - server từ chối trước khi ghi (`foc.service.ts` kiểm `requesterReauthenticated` trước mọi bước ghi);
  - test tích hợp `r3-be83-esc026.test.ts` "R3-Q25" khẳng định không có yêu cầu xóa nợ nào được ghi;
  - không sai số tiền, không mất dữ liệu; công nợ giữ nguyên, lễ tân vẫn thu nợ bình thường.
  - Còn lại là mất một chức năng tiền: quản lý và chủ đầu tư không xóa được công nợ trên Desk. Vì vậy không thấp hơn P1.
- **Môi trường:** stack dùng một lần `ottimo-qa2ci` (compose dev, cổng riêng 53000/58081–58083, không đụng dev/demo/staging), ảnh dựng từ `8368fac`, DS-E. Project `desk-clock`, ngày ảo.
- **Các bước tái hiện:**
  1. Có đơn 1 đêm. Lúc trả phòng (B18), MGR ghi công nợ 100.000.
  2. Hôm sau, đăng nhập `qa.mgr`, mở đơn, bấm "Xóa công nợ".
  3. Chọn khoản 100.000, ghi chú "Khach khong lien lac duoc", bấm xóa.
- **Kết quả thực tế:**
  - `POST /folios/{id}/lines/{lineId}/foc` trả `422 VALIDATION_FAILED` với `errors: [{field: "secret", code: "REQUIRED"}]`.
  - Hộp thoại không có ô mật khẩu. `DebtCollectDialog.tsx` (`DebtWriteOffDialog`, khoảng dòng 250) chỉ gửi `{kind, amountVnd, reasonCode: 'debt_write_off', note}`.
- **Kết quả mong đợi:** theo R3-Q25 (FB-R2-SEC-BE-82 (b), BE-B lượt kiểm tiền bước 4), người xin `debt_write_off` xác thực lại như người duyệt (S1). Hộp thoại phải xin mật khẩu (cùng mẫu các hộp duyệt), gửi `authMethod: 'password'` + `secret`, rồi 201 (`approved` khi ≤ cơ sở, `pending` chờ OWN khi vượt).
- **Bằng chứng:**
  - Ca `TC-X-082` (`e2e/ui-clock/debt-collect.s5.spec.ts`), lượt 23/10 ~23:05: "requestFoc debt_write_off: mong đợi 201, thực tế: 422 … secret REQUIRED".
  - Trên CI 39976959706 ca này nằm trong 54 ca "did not run", vì project `desk-clock` phụ thuộc `clock` đang đỏ. Khi `clock` xanh, ca sẽ đỏ.
- **Nguyên nhân:**
  - Server R3-Q25 đã gộp cùng BE-83 (BE-B bước 4).
  - Phía Desk không được giao trong `sprint-1-plan.md`: R3-Q25 chỉ ghi cho BE-B, không có việc FE.
- **Vai chịu trách nhiệm:** FE-A (hộp thoại + MSW + test). UXD duyệt chữ (brand OTTIMO, Việt/Anh).
- **Ca chống tái phát:**
  - `TC-X-082` đánh `knownBug('BUG-R3-001')` ở dòng đầu (`support/known-bugs.ts`), nên CI không đỏ vì lỗi đã ghi.
  - Khi sửa, PR của FE-A thêm bước nhập mật khẩu vào `TC-X-082` và xóa dòng `BUG-R3-001` khỏi `OPEN`. QA review PR đó.
- **Hạn:** trước cổng QC Sprint 1 (lượt kiểm tiền G1). Không chặn các ca API.
- **Trạng thái:** Open

### BUG-R3-005 – "Số tiền đã nhận" giữ cọc của lần tính giá đầu tiên (H09)

- **Mức:** P1. QA quyết. Lỗi tiền nên mặc định là P0; QA hạ xuống P1 vì những lý do sau. ORC/PO phân xử nếu không đồng ý.
  - Số sai chỉ là gợi ý điền sẵn trong ô lễ tân sửa được.
  - "Cọc cần thu" đúng hiện ngay phía trên ô.
  - Khi số điền sẵn thấp hơn cọc cần thu, Desk chặn bằng câu "Chưa đủ cọc".
  - Phiếu thu ghi sai vẫn đảo được.
- **Rủi ro tiền:** lễ tân chọn căn đắt hoặc khoảng ngày dài trước, sau đó đổi sang căn rẻ hơn hoặc rút ngắn ngày. Ô vẫn giữ cọc cũ, cao hơn mức cần thu và Desk không báo gì. Nếu lễ tân bấm "Tạo đơn" không xem lại, phiếu thu ghi nhiều hơn số khách thật sự chuyển.
- **Môi trường:** admin-web `main` @ `5834c6a`, vitest + MSW (jsdom). Đọc mã: `product/apps/admin-web/src/pages/booking/BookingDialog.tsx`, hiệu ứng `calculateQuote`, dòng `depositAmount: f.depositAmount || (r.data.depositVnd ? vnd(r.data.depositVnd) : '')`.
- **Bước tái hiện (tất định):**
  1. Đăng nhập qa.fd, mở Sơ đồ phòng, bấm "Đặt phòng mới".
  2. Chọn căn 201. Ngày mặc định là hôm nay → mai (1 đêm). Chờ phần giá hiện. Ô "Số tiền đã nhận" = 200.000 (đêm thứ Sáu 23/10).
  3. Đổi "Ngày đi" sang hôm nay + 4.
- **Thực tế:** tổng tiền và "Cọc cần thu" tính lại theo 4 đêm, nhưng ô "Số tiền đã nhận" vẫn là **200.000**.
- **Mong đợi:** khi lễ tân chưa gõ vào ô, ô theo cọc của lần tính giá **mới nhất**. Lễ tân đã gõ thì giữ số của lễ tân, giống cách ô giá từng đêm dùng `ratesEdited`.
- **Bằng chứng:**
  - Ca `BUG-R3-005: received amount follows the newest quote until the desk edits it` trong `product/apps/admin-web/src/__tests__/booking.test.tsx` (`it.skip`). Bỏ skip là đỏ tất định: `expected '200.000' not to be '200.000'`.
  - Chạy cả bộ admin-web 8 lần trên `main` (trước khi sửa ca): 3/8 lần đỏ ca "direct booking". Ảnh DOM lúc hỏng: tổng 1.628.000, cọc cần thu 500.000, "Chưa đủ cọc: cần 500.000, đã ghi nhận 200.000".
- **Đây cũng là nguyên nhân ca `booking.test.tsx` chập chờn:**
  - Ca chọn căn trước rồi mới đổi ngày.
  - Khi máy tải nặng (chạy cả bộ, nhiều worker), từ lúc chọn căn tới lúc đổi ngày mất hơn 300 ms (thời gian debounce của lần tính giá). Lần tính giá 1 đêm kịp về và điền 200.000. Lần tính 2 đêm sau đó không ghi đè, nên "Tạo đơn" bị chặn.
  - Chạy riêng một file thì đủ nhanh để debounce gộp hai bước, nên xanh 7/7.
  - Ca nào hỏng thay đổi theo lần chạy vì `fill()` dùng chung cho 4 ca.
- **Sửa phía test (QA, nhánh `qa/r3-s1-booking-flaky-fuzz`):**
  - `fill()` đặt ngày trước rồi mới chọn căn, đúng thứ tự Desk tính giá với khoảng ngày cuối.
  - Sau khi sửa: 8/8 lần chạy cả bộ xanh (489 đạt, 1 bỏ qua là ca BUG-R3-005).
- **Việc của FE:** sửa `BookingDialog` (cờ "đã sửa" cho `depositAmount`), bỏ `it.skip` của ca BUG-R3-005, giữ thứ tự mới của `fill()`.
- **Trạng thái:** Open. QA test lại khi FE báo đã sửa.

### BUG-R3-002 – Tiền dư sau trả phòng bị J15 đóng mà không có yêu cầu hoàn

- **Mức:** P0. Lỗi tiền mặc định P0; chưa chứng minh được là không ảnh hưởng tiền. Khách trả thừa, folio đóng, không có yêu cầu hoàn và không có "Cần chú ý", nên tiền thừa có thể không bao giờ được hoàn.
- **Môi trường:** `origin/main` @ `7100f3b` (bước 4 đã gộp). PostgreSQL 17 riêng của QA, migrate từ đầu, đồng hồ giả, dữ liệu giả.
- **Tìm bằng:** fuzz R3-Q30, 9 chuỗi bị bất biến I4 bắt ("folio closed có tiền dư"). Ví dụ FZ-01 seed 10047, bước 19–22.
- **Bước tái hiện (tất định):** `product/services/api/test/fuzz/bug-r3-002.test.ts`, chạy với `FUZZ_KNOWN_BUGS=1`.
  1. Đơn trả phòng xong, folio `settled`, đã thu đủ, O = 0.
  2. MGR A32 void dòng phòng. Được phép vì O = 0 (208) → `creditVnd` > 0.
  3. Qua hết cửa sổ 24 giờ, chạy J15.
- **Thực tế:**
  - J15 trả `closed`; audit `folio.closed` ghi `balanceDueVnd 0`;
  - folio `closed` với `creditVnd` > 0 (1.106.000 ở seed 10047);
  - không có `approval_request type = refund`, không có `attention_event`.
- **Mong đợi:** I4 (oracle mục 8): không bao giờ có tiền dư trên folio `closed`. Một trong hai:
  - J15 chờ (`waiting_refund`) và tạo yêu cầu hoàn + "Cần chú ý" `closed_reservation_credit`, như cách mã đang làm cho tiền dư lúc B18;
  - hoặc tạo yêu cầu hoàn ngay lúc A32 làm phát sinh tiền dư.
- **Đọc mã:** `FolioService.closeAfterWindow` chỉ chờ khi `openRefundVnd > 0`. Tiền dư chưa có yêu cầu hoàn thì folio vẫn bị đóng.
- **Vai:** BE-B. DOM xác nhận đường hoàn cho tiền dư phát sinh sau B18.
- **Trạng thái:** Open.

### BUG-R3-003 – Xóa nợ vượt cơ sở được chuyển cho lễ tân trưởng duyệt

- **Mức:** P0. Lách hạn mức tiền: công nợ được xóa mà OWN không duyệt. BR-433 (a): Σ vượt cơ sở → chờ OWN. BR-525: chỉ MGR trở lên được xóa nợ.
- **Môi trường:** như BUG-R3-002.
- **Tìm bằng:** fuzz FZ-01 seed 10128 bước 17, bất biến I8 ("vượt cơ sở nhưng `required_role` ≠ owner").
- **Bước tái hiện (tất định):** `product/services/api/test/fuzz/bug-r3-003.test.ts`, chạy với `FUZZ_KNOWN_BUGS=1`.
  1. Folio đã trả phòng, O = 100.000 (đảo khoản chuyển khoản), có khoản cửa sổ 2.000.000.
  2. MGR A32 void một đêm, hạ đêm còn lại xuống 1.000. Cả hai được phép vì ≤ W. Cơ sở bảo vệ còn 1.000.
  3. MGR xin xóa nợ 2.000 → `201 pending`.
  4. Lễ tân trưởng bấm duyệt.
- **Thực tế:** `required_role = front_desk_lead`, `limit_basis_vnd = 1.000`; lễ tân trưởng duyệt → **200**.
- **Mong đợi:** `required_role = owner`; lễ tân trưởng → 403.
- **Ghi chú:**
  - Hướng định tuyến có vẻ so số tiền với hạn mức lần của từng vai (lễ tân trưởng 300.000), không xét "xóa nợ chỉ MGR+".
  - Đường này mở khi cơ sở < 300.000. Cơ sở xuống thấp được bằng chính A32 giảm sau B18, hoặc ở đơn giá thấp.
- **Vai:** BE-B (approvals – định tuyến `debt_write_off`). SEC review lại BR-433 (a).
- **Trạng thái:** Open.

### BUG-R3-004 – Không còn đêm phòng sống, MGR vẫn tự áp xóa nợ

- **Mức:** P1. QA quyết; ORC/PO phân xử nếu không đồng ý. Đây là lệch quy tắc hạn mức, nhưng số MGR tự xóa được không vượt cơ sở chụp lúc B18, tức hạn mức MGR vốn đã có. Nếu SEC coi đây là đường lách thì nâng P0.
- **Môi trường:** như BUG-R3-002.
- **Tìm bằng:** fuzz lượt 1, 42 lần I16 "cơ sở lưu > cơ sở bảo vệ 0". Critic độc lập xác nhận (M-2, 8 lần / 6 chuỗi ở lượt 2).
- **Bước tái hiện (tất định):** `product/services/api/test/fuzz/bug-r3-004.test.ts`, chạy với `FUZZ_KNOWN_BUGS=1`.
  1. Folio đã trả phòng, O = 100.000, có khoản cửa sổ 3.000.000.
  2. MGR A32 void mọi đêm phòng (≤ W, được phép).
  3. MGR xin xóa nợ 50.000.
- **Thực tế:** `201 approved eff 50000` (tự áp); `required_role = front_desk_lead`.
- **Mong đợi:** BR-433 (a): cơ sở = giá đêm `room` còn sống, "không có đêm nào → chờ OWN", nên phải `pending` với `required_role = owner`.
- **Ghi chú:** void một phần thì mã đã bỏ đêm void ra khỏi cơ sở (critic). Chỉ khi void **toàn bộ** đêm, mã mới quay về số chụp. Cùng chỗ định tuyến với BUG-R3-003.
- **Vai:** BE-B. SEC xem lại cùng FB-R3-SEC-BE-B-09.
- **Trạng thái:** Open.

### Xác nhận sửa lỗi (QA 24/10, `main` @ `0281e20`)
- **BUG-R3-001 → Closed.** TC-X-082 (`e2e/ui-clock/debt-collect.s5.spec.ts`, project `desk-clock`) **đạt** trên stack dùng một lần `ottimo-qa-r3s1b`: compose dev, cổng riêng 33000/38081–38083, DS-E, đồng hồ giả, không đụng dev/demo/staging.
- **BUG-R3-005 → Closed.**
  - Hai ca `BUG-R3-005` trong `booking.test.tsx` đã bỏ skip và **đạt**.
  - Lúc chạy là 01:12, nên đã đổi `todayLocal()` thành `businessDayLocal()`. Đây là một phần của BUG-R3-006.
  - Chạy lại với đồng hồ cố định ban ngày (setup tạm, không commit): booking 9/9 đạt.
- **BUG-R3-002, 003, 004 → Verified, Closed sau lượt fuzz cuối G1.**
  - `test/fuzz/bug-r3-00{2,3,4}.test.ts` và `r3-bug-002-credit-after-checkout.test.ts`: 5/5 đạt trên PostgreSQL riêng.
  - Fuzz thử 6 chuỗi/họ × 9 họ: 0 vi phạm I4, I8, I16.

### BUG-R3-006 – Test admin-web đỏ khi chạy từ 00:00 tới 05:59
- **Mức:** P2. Chỉ ở test, không phải sản phẩm. Nhưng nếu push trong khoảng đêm, CI đỏ giả, và lúc đó dễ bỏ qua lỗi thật.
- **Tái hiện:** chạy `pnpm --filter @ottimo/admin-web test` lúc 01:12 giờ Việt Nam (24/10). Các ca đỏ:
  - `booking.test.tsx` "BUG-R3-005" ×2: form 5 đêm thay vì 4. Ca do QA viết, đã sửa trong nhánh này.
  - `guest-picker-race.test.tsx` "a refused preview is said in the dialog";
  - `r3-q51-fea.test.tsx` ×2 (hiệu lực "ngày mai");
  - ban ngày cả ba tệp đều đạt.
- **Nguyên nhân:** test tính ngày bằng `todayLocal()` (ngày lịch). App và MSW mở form và kiểm "từ ngày mai" theo **ngày nghiệp vụ**, đổi lúc 06:00.
- **Mong đợi:** test dùng `businessDayLocal()`, hoặc cố định giờ bằng `vi.setSystemTime`; thêm một lượt CI chạy unit với giờ giả 02:40 (quy tắc ca đồng hồ giả, plan R3 mục 6).
- **Vai:** FE-A (`r3-q51-fea`), FE-B (`guest-picker-race`). QA đã sửa phần của mình.
- **Trạng thái:** Open.

### BUG-R3-007 – Desk thật không mở được S35 "Yêu cầu từ website" (thiếu S35 trong `Me.screens`)
- **Mức:** P1. QA quyết.
  - Xét P0 trước: yêu cầu của khách vào mà không ai xử lý được nghĩa là mất khách và sai câu hứa "trả lời trong 1 giờ".
  - Để P1 vì công tắc form **mặc định tắt** và server tự chặn bật khi thiếu điều kiện, nên hiện chưa có yêu cầu thật nào bị bỏ.
  - **Thành P0 nếu form được bật khi lỗi chưa sửa.** Chặn mốc "bật form" (SEC điều kiện 7).
- **Vai:** BE-D. FE-B kiểm lại menu khi có bản sửa.
- **Môi trường:** stack dùng một lần `ottimo-qa155` (compose dev + `product/tests/e2e/support/us155-stack/compose.us155.yml`), ảnh dựng từ `0ac4261`, DS-E, Chromium 1366×768. `origin/main` hiện tại (`ca06365`) chưa đổi `screens.ts`.
- **Liên quan:** US-155 AC2, AC8; rbac-matrix S35 (OWN ✔, MGR ✔, FDL ✔, FD ✔, SAL M); TC-WR-000.
- **Bước tái hiện:**
  1. Đăng nhập Desk bằng `qa.owner`, `qa.fd` hoặc `qa.sal`.
  2. Xem nhóm menu "Khách & bán".
  3. Mở thẳng `/website-requests`, hoặc bấm "Mở" ở mục "Cần chú ý" "Yêu cầu đặt phòng từ website … chưa ai nhận".
- **Thực tế:**
  - Cả 3 vai: menu không có "Yêu cầu từ website".
  - `/website-requests` hiện "Bạn không có quyền mở trang này – Trang này dành cho vai khác…".
  - `GET /v1/me` → `properties[0].screens` không có `S35`, kể cả `qa.owner`.
- **Mong đợi:** `screens` có S35 cho OWN, MGR, FDL, FD, SAL (rbac-matrix mục 3, ghi chú 42); menu hiện, trang mở được.
- **Nguyên nhân (đọc mã):** `product/services/api/src/modules/identity/internal/screens.ts` – `SCREENS_BY_ROLE` dừng ở S34 (`owner: range(1, 34)`, các vai khác liệt kê tay); không vai nào có S35. Test FE chạy MSW, `me.screens` giả có S35 nên không lộ lỗi.
- **Đề xuất sửa:** thêm S35 cho owner, manager, front_desk_lead, front_desk, sales_staff. Thêm test so `SCREENS_BY_ROLE` với các cột S của `rbac-matrix.json` để màn mới không bị quên lần nữa.
- **Bằng chứng:**
  - TC-WR-000 (`knownBug('BUG-R3-007')`) đỏ đúng dự kiến.
  - Dò `GET /v1/me` của 3 vai: `S35` = false.
  - Các ca S35 còn lại chạy được nhờ harness thêm S35 vào `Me.screens` **chỉ trong trình duyệt** (annotation `harness`). Mọi API vẫn do server kiểm quyền.
- **Ca chống tái phát:** TC-WR-000 (`product/tests/e2e/ui/us155-website-requests.r3.spec.ts`). Khi sửa: xóa `BUG-R3-007` khỏi `OPEN` trong `support/known-bugs.ts`; harness tự thôi sửa `Me`.
- **Trạng thái:** Open.

### BUG-R3-008 – Công tắc form website không đổi lại được trong ngày đã đặt
- **Mức:** P1. QA quyết.
  - Công tắc là **cách duy nhất** dừng nhận dữ liệu lúc chạy (OpenAPI `setParameter` 0.3.7 bổ sung 2, SEC ARC-17; US-155 AC4 "bật/tắt form không cần dựng lại trang").
  - Form bật cùng ngày Desk production chạy (INV 24/10). Nếu hôm đó gặp spam, lỗi hiển thị hay yêu cầu pháp lý, OWN không tắt được tới hết ngày nghiệp vụ.
  - Cách vòng duy nhất là OPS sửa Caddy landing trên máy chủ: "cách vòng rất tốn công" (định nghĩa P1).
  - Không P0 vì vẫn còn trần ngày, giới hạn IP và giới hạn liên hệ.
- **Vai:** BE-D. ARC chốt cách làm (mô hình tham số "không sửa giá trị đã hiệu lực" – erd 4.1).
- **Môi trường:** như BUG-R3-007.
- **Liên quan:** US-155 AC4; SEC ARC-17; `setParameter`; TC-WR-008.
- **Bước tái hiện:**
  1. Đã có `privacy_notice_version` vi + en và khóa ký form. Hôm nay chưa có dòng nào của khóa `public_booking_requests_enabled`.
  2. `qa.owner`: `PUT /v1/properties/{id}/parameters/public_booking_requests_enabled` với `{value: true, effectiveFrom: <hôm nay>}` → 200, form nhận yêu cầu.
  3. Cùng ngày: `PUT …` với `{value: false, effectiveFrom: <hôm nay>}`.
- **Thực tế:**
  - 422 `VALIDATION_FAILED`, `detail: "value already effective – add a row with a later effectiveFrom"`, `errors[{field: effectiveFrom}]`.
  - Form vẫn nhận yêu cầu tới ngày mai.
  - Chiều ngược lại cũng vậy: đã đặt `false` trong ngày thì không bật lại được.
- **Mong đợi:** OWN tắt công tắc có hiệu lực ngay (form token 404), có audit `security`.
- **Nguyên nhân (đọc mã):** `product/services/api/src/modules/platform/public/parameter.service.ts` `set()`:
  - `INSERT … ON CONFLICT (property_id, key, effective_from) DO UPDATE … WHERE config_parameter.effective_from > today` – dòng của hôm nay không sửa được;
  - `effectiveFrom < today` bị từ chối;
  - trigger `config_parameter_delete_future_only` cấm xóa.
- **Đề xuất sửa (ARC chọn):**
  - (a) Khóa bảo mật kiểu công tắc (`public_booking_requests_enabled`, `public_booking_request_pow_enabled`) cho ghi đè dòng hôm nay, lịch sử giữ trong audit.
  - (b) Hoặc thêm thao tác "tắt khẩn" riêng cho OWN.
- **Bằng chứng:**
  - TC-WR-008 (`knownBug('BUG-R3-008')`) đỏ đúng dự kiến, 422 như trên.
  - Lượt chạy đầu của QA tự vướng: đặt `false` rồi `true` trong cùng ngày nhận đúng câu 422 này.
- **Ghi chú harness:** để kiểm nhánh "công tắc tắt" trong cùng lượt, TC-WR-009 xóa dòng hôm nay bằng psql (bỏ qua trigger, superuser, chỉ trên stack dùng một lần) để giả lập "ngày hôm sau". Production không có đường này.
- **Trạng thái:** Open.

### BUG-R3-009 – Số CCCD viết cách nhóm trong lời nhắn lọt qua bộ lọc
- **Mức:** P1. QA quyết.
  - Mặc định P0 vì là số giấy tờ (nhóm C3) nằm ngoài kho C3: lưu ở cột `note` của yêu cầu; FD/FDL/MGR/OWN và SAL (sau khi nhận) đều đọc được.
  - Để P1 vì: số do chính người gửi tự gõ; không lộ ra ngoài hay cho khách khác; hạn lưu tối đa 180 ngày; xóa theo yêu cầu (WR8) chạy đúng.
  - Vẫn là sai AC5 + SEC C-12, và là "phân quyền sai ở dữ liệu" (SAL không được thấy số giấy tờ). ORC/SEC nâng P0 nếu không đồng ý.
- **Vai:** BE-D. SEC duyệt mẫu nhận diện.
- **Môi trường:** như BUG-R3-007.
- **Liên quan:** US-155 AC5; SEC Phụ lục B.2.3, C-12; TC-WR-007 (dãy liền – đạt), TC-WR-010 (cách nhóm – đỏ).
- **Bước tái hiện:** landing bật form (hoặc gọi thẳng `createWebsiteBookingRequest` từ origin landing), lời nhắn `CCCD cua toi 079 203 012 345` (số giả), các ô khác hợp lệ → gửi.
- **Thực tế:**
  - 202 kèm `refCode` (trên stack QA: `PT6B96FB`, `E4Y53FH9`, `WAJQ584D`).
  - DB: `note` = `CCCD cua toi ### ### ### ###` (đã che số khi trích) – số được lưu nguyên.
  - Desk hiện số này trong ngăn chi tiết.
- **Mong đợi:** 422 `ID_NUMBER_DETECTED` ở `note`, như với `079203012345`. Dạng liền đã đạt ở TC-WR-007: 422, không lặp số, không lưu, không có trong log api/worker/postgres/Caddy.
- **Nguyên nhân (đọc mã):** `product/services/api/src/modules/public-site/internal/website-request-rules.ts` `looksLikeIdNumber()` (dòng 79–83) chỉ bắt `\d{12}` / `\d{9}` liền nhau. `looksLikeCard()` cùng tệp đã cho phép dấu cách/gạch. Dạng gạch `079-203-012-345` và chấm `079.203.012.345` cũng lọt theo cùng biểu thức (đọc mã; lượt E2E dừng ở dạng đầu).
- **Đề xuất sửa:** bỏ `[ .-]` giữa các chữ số trước khi so (như `looksLikeCard`), giữ ngoại lệ số điện thoại có `+`; thêm ca đơn vị cho 3 dạng. FE landing không cần đổi (lỗi trả về theo `field` + `code`).
- **Ca chống tái phát:** TC-WR-010 (`knownBug('BUG-R3-009')`).
- **Trạng thái:** Open.

### BUG-R3-010 – S35 không báo "form đang tắt" cho lễ tân trưởng
- **Mức:** P2. Chức năng phụ sai; FDL vẫn xử lý yêu cầu cũ bình thường, chỉ thiếu dòng thông tin.
- **Vai:** FE-B + BE-D (chốt FDL có được đọc công tắc hay không).
- **Môi trường:** như BUG-R3-007.
- **Liên quan:** US-155 AC4; EP19; TC-WR-011.
- **Bước tái hiện:** công tắc tắt → `qa.fdl` mở S35.
- **Thực tế:**
  - Không có dòng "Form đặt phòng trên website đang tắt".
  - `GET /v1/properties/{id}/parameters/public_booking_requests_enabled` với `qa.fdl` → **404**; với OWN → 200, `current.value = false`.
  - `WebRequestsPage.tsx` `useFormSwitch` coi lỗi là "không biết" nên không hiện gì.
  - Với `qa.mgr` dòng này hiện đúng (TC-WR-009 đạt).
- **Mong đợi:** OWN/MGR/FDL đều thấy. Chú thích trong mã FE ghi "OWN/MGR/FDL – getParameterHistory"; `x-roles` của `getParameterHistory` có `front_desk_lead`.
- **Đề xuất sửa:** server cho FDL đọc khóa này (chỉ đọc), hoặc FE lấy trạng thái từ chỗ khác (ví dụ một trường trong danh sách S35).
- **Ca chống tái phát:** TC-WR-011 (`knownBug('BUG-R3-010')`).
- **Trạng thái:** Open.

### BUG-R3-011 – "Tạo đơn" từ yêu cầu website vẫn cho đổi Kênh/Nguồn
- **Mức:** P2. UX gây nhầm, có cách khắc phục; server chặn đúng nên dữ liệu không sai.
- **Vai:** FE-B (`BookingDialog.tsx` khi có `prefill.webRequest`); UXD duyệt câu lỗi.
- **Môi trường:** như BUG-R3-007.
- **Liên quan:** US-155 AC2 ("nguồn luôn `website` do server đặt… nhân viên không đổi được nguồn"); BR-112 (a); TC-WR-012.
- **Bước tái hiện:** FD nhận yêu cầu → "Tạo đơn" → H09 có Nguồn = Website → đổi Nguồn sang "Zalo / điện thoại" → chọn căn, khách → "Tạo đơn".
- **Thực tế:**
  - Ô Kênh (Trực tiếp / CTV / OTA / Nội bộ) và ô Nguồn đều sửa được.
  - Server trả 422 `NOT_ALLOWED` (`field: directSource`). Desk hiện dưới ô Nguồn "Không áp dụng được cho đơn này.", không nói phải là Website.
  - Không tạo đơn; yêu cầu giữ `in_progress` (đúng).
- **Mong đợi:** khi tạo đơn từ yêu cầu website, Kênh = Trực tiếp và Nguồn = Website ở dạng chỉ đọc, kèm câu đã có "Đơn tạo ra có nguồn Website…".
- **Bằng chứng:** TC-WR-012 đạt phần server (422, không đơn, yêu cầu giữ nguyên), annotation `observation` "Ô Nguồn … SỬA ĐƯỢC"; ảnh `h09-source-changed.png` trong thư mục kết quả của ca.
- **Trạng thái:** Open.
