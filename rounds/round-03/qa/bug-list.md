# Danh sách lỗi – Round 3

- Tác giả: QA | Mở: 23/10/2026 – Sprint 1, bước Kiểm thử (phân loại CI 39976959706 trên `origin/main` 8368fac, job "docker images build · E2E smoke")
- Mức lỗi theo `product/docs/qa/test-strategy.md` mục 8. Lỗi tồn từ R2: `rounds/round-02/qa/bug-list.md` (không chép lại; BUG-R2-218 vẫn Open – ca `TC-L7-053` là `test.fail` đúng dự kiến).
- Mã: `BUG-R3-xxx`. Nếu luồng QA khác (fuzz R3-Q30) cũng mở tệp này cùng lúc, ORC gộp và cấp lại số liên tiếp khi merge; ca E2E tham chiếu mã qua `e2e/support/known-bugs.ts`.

## 1. Tổng hợp

| Mức | Số lỗi | Open | Fixed | Closed |
|---|---|---|---|---|
| P0 | 3 | 0 | 0 | 3 |
| P1 | 11 | 2 (BUG-R3-019, 032) | 0 | 9 |
| P2 | 9 | 6 (BUG-R3-018 phần 1 – dời v1.0.1; 020–023; 033) | 0 | 3 |
| P3 | 12 | 11 (016; 024–031; 034; 035) | 0 | 1 |
| **Tổng** | **35** | **19** | **0** | **16** |

Cập nhật 28/10 ~00:20 (ESC-031 `postReview` + tiền mặt trên staging rc.3, `qa3-rc1.md` mục 16): ca **Đạt**. Thêm **BUG-R3-033 (P2, FE-A)**, **BUG-R3-034 (P3, BE-B)**, **BUG-R3-035 (P3, BE-B + UXD)**. Không lỗi nào chặn rc.4 hay B2.

Cập nhật 27/10 (SEC, `reviews/SEC-on-B2-readiness.md`): thêm **BUG-R3-032 (P1, BE-A + ARC)** – thư "Security notice" không có người nhận vì người dùng không có email. Không chặn B2/D (có biện pháp bù); sửa ở v1.0.1.

Cập nhật 27/10 ~11:05 (kiểm sổ tay v1.0 trên staging rc.3 `70fe734`, `manual-check.md`): thêm **BUG-R3-019…031** (1 P1, 4 P2, 8 P3). **BUG-R3-019 (P1)**: không tạo được "Đơn dài hạn nhập tay" – chặn chuyển đổi khách dài hạn ngày D, đề nghị vào bản vá trước 02/11.

Cập nhật 27/10 ~07:40 (rc.3 trên staging `70fe734`, `qa3-rc1.md` mục 15):
- **BUG-R3-018 phần 2 → Closed**: QA kiểm trên rc.3, căn 101. Lên lịch giá sai (28/10 và 29/10), rồi gõ lại giá đang dùng với cùng ngày hiệu lực. Kết quả: Lưu mở, toast ghi đúng ngày, báo giá các đêm đó về đúng giá. Cảnh báo mềm vẫn hiện; giá tháng không đổi; OTM-00355 không đổi.
- **Phần 1 vẫn mở, dời v1.0.1** (decision-log 26/10) – lỗi tính là Open ở bảng trên.
- Smoke-prod 9/9 trên rc.3. Không lỗi mới.

Cập nhật 26/10 ~23:15 (rc.2 trên staging, `qa3-rc1.md` mục 13):
- **BUG-R3-015 → Closed**: harness repo chạy được trên staging bật 2FA (smoke-prod 9/9, các ca rc.2); CI push `4629e6e` xanh.
- **BUG-R3-017 → Closed**: đã gộp `main` trong `v1.0.0-rc.2`; CI push `4629e6e` xanh. Lượt QA trên nhánh đạt 4/4. Chạy lại ca tiền mặt ESC-031 trên staging vào tối 27/10 – xem mục 13.
- Thêm **BUG-R3-018 (P2, FE-A)**.

Cập nhật 26/10 tối (ESC-031, `qa3-rc1.md` mục 11): thêm **BUG-R3-017 (P1, FE-A + BE-B)** – thu tiền mặt/thẻ cho phụ thu bằng 1 đêm ở bước 3 trả phòng bị chặn (có từ R2 0.3.7; trên production ESC-031 là đường duy nhất nên lỗi lộ ra). Bản vá ESC-031 tự nó: 14/14 ca tiền đạt.

Cập nhật 26/10 (QA-3 phần 1 – hồi quy trên `v1.0.0-rc.1` staging, `rounds/round-03/qa/qa3-rc1.md`): thêm **BUG-R3-015** (P3, bộ test – QA) và **BUG-R3-016** (P3, sản phẩm – PO/FE). Không P0/P1/P2 mới. Lỗi R2 thấy lại trên `rc.1`: BUG-R2-219, BUG-R2-222 (vẫn Open trong sổ R2). Sổ R2: BUG-R2-208, 209, 210 → Closed (QA kiểm lại 26/10).

Cập nhật 24/10 (luồng QA phụ – E2E US-155):
- Lượt 1 trên stack `ottimo-qa155`, bản `0ac4261`: mở BUG-R3-007…011.
- Lượt 2 trên `origin/main` `a1da76f`, dùng ảnh landing thật và `Caddyfile.landing` của OPS (`LANDING_PUBLIC_API=on`), không còn harness S35: 13/13 ca đạt. **BUG-R3-007…011 Closed.**
- Báo cáo: `rounds/round-03/outputs/QA/s1-us155-e2e.md`.

## 2. Bảng lỗi

| ID | Mức | Mô tả ngắn | Vai | Trạng thái |
|---|---|---|---|---|
| BUG-R3-001 | P1 | Desk "Xóa công nợ" không xin xác thực lại người xin (R3-Q25) → mọi lần xóa nợ trên Desk bị 422 `secret` REQUIRED | FE-A (+ UXD chữ) | **Closed** (QA xác nhận 24/10 – TC-X-082 đạt) |
| BUG-R3-002 | **P0** | Tiền dư phát sinh sau trả phòng (A32 void/giảm khi không còn công nợ) không thành yêu cầu hoàn; J15 đóng folio vẫn còn tiền dư | BE-B (folio/J15) | **Closed** 24/10 (lượt fuzz cuối G1: 610 chuỗi, 0 vi phạm I4/I8/I16) |
| BUG-R3-003 | **P0** | Xóa nợ của MGR vượt cơ sở hạn mức nhưng `required_role = front_desk_lead`; lễ tân trưởng duyệt được (200) | BE-B (approvals/BR-433) | **Closed** 24/10 (lượt fuzz cuối G1: 610 chuỗi, 0 vi phạm I4/I8/I16) |
| BUG-R3-004 | **P1** | Đã void hết đêm phòng sau trả phòng, MGR vẫn tự áp xóa nợ theo số chụp B18, không chuyển OWN (BR-433 (a) "không có đêm nào → chờ OWN") | BE-B (BR-433 (d) cơ sở) | **Closed** 24/10 (lượt fuzz cuối G1: 610 chuỗi, 0 vi phạm I4/I8/I16) |
| BUG-R3-005 | P1 | H09 Đặt phòng mới: ô "Số tiền đã nhận" giữ cọc của lần tính giá **đầu tiên**, không theo lần tính giá sau (gốc của `booking.test.tsx` chập chờn) | FE (H09 – `BookingDialog`) | **Closed** (QA xác nhận 24/10) |
| BUG-R3-006 | P2 | Test admin-web phụ thuộc giờ: từ 00:00 đến 05:59 một số ca đỏ vì lấy `todayLocal()` trong khi app mở form theo **ngày nghiệp vụ** (BR-010) | FE-A, FE-B (+ QA cho 2 ca BUG-R3-005, đã sửa) | **Closed** (QA xác nhận 24/10: admin-web 610/610 ở giờ thật và giờ giả 00:36, 02:40, 05:59, 14:00 trên `origin/main` `12f6d37`) |
| BUG-R3-007 | **P1** | US-155: `Me.screens` của server không có **S35** cho vai nào → Desk thật ẩn "Yêu cầu từ website" và chặn `/website-requests` ("Bạn không có quyền mở trang này"), kể cả nút "Mở" của "Cần chú ý" | BE-D (`identity/internal/screens.ts`) | **Closed** (QA xác nhận 24/10 trên `a1da76f` – TC-WR-000 đạt) |
| BUG-R3-008 | **P1** | US-155: công tắc `public_booking_requests_enabled` không đổi lại được trong ngày đã đặt (422 "value already effective") → OWN bật form xong không tắt ngay được khi có spam/sự cố | BE-D + ARC (mô hình tham số) | **Closed** (QA xác nhận 24/10 trên `a1da76f` – TC-WR-008 đạt) |
| BUG-R3-009 | **P1** | US-155 AC5: số CCCD viết cách nhóm (`079 203 012 345`) trong lời nhắn được nhận (202) và lưu vào yêu cầu; chỉ dãy 12 số liền bị chặn | BE-D (`website-request-rules.ts`) | **Closed** (QA xác nhận 24/10 trên `a1da76f` – TC-WR-007 + TC-WR-010 đạt) |
| BUG-R3-010 | P2 | S35: lễ tân trưởng (FDL) không thấy dòng "Form đặt phòng trên website đang tắt" – đọc công tắc trả 404 cho FDL, FE coi là "không biết" | FE-B + BE-D | **Closed** (QA xác nhận 24/10 trên `a1da76f` – TC-WR-011 đạt) |
| BUG-R3-011 | P2 | H09 "Tạo đơn" từ yêu cầu website: ô Kênh/Nguồn vẫn sửa được (AC2: nhân viên không đổi được nguồn); đổi thì server 422, Desk chỉ báo "Không áp dụng được cho đơn này." | FE-B (+ UXD chữ) | **Closed** (QA xác nhận 24/10 trên `a1da76f` – TC-WR-012 đạt) |
| BUG-R3-012 | **P0** | J15 trả `waiting_refund` mãi khi còn yêu cầu hoàn mở, kể cả khi đã hết tiền dư và khách đang **nợ**: không ghi công nợ, không báo OWN/MGR, folio không bao giờ đóng | BE-B (folio/J15) | **Closed** 24/10. Lượt fuzz chạy lại trên `origin/main` `f2ba2ac`: 710 chuỗi, 28.250 bước. Critic `reviews/s1-money-critic-rerun.md` mục 6 xác nhận. |
| BUG-R3-013 | P1 | Yêu cầu hoàn đang mở không được tính lại (`refundPlan`) khi tiền dư giảm (phát sinh sau trả phòng, A32, J15) – yêu cầu > tiền dư, có lần duyệt khi tiền dư 0 | BE-B (folio/refunds) | **Closed** 24/10. Lượt fuzz chạy lại trên `origin/main` `f2ba2ac`: 710 chuỗi, 28.250 bước. Critic `reviews/s1-money-critic-rerun.md` mục 6 xác nhận. |
| BUG-R3-014 | P1 | Chi hoàn (`payOut`) đưa tiền dư của folio `settled` về 0 nhưng các yêu cầu hoàn đã duyệt còn tiền chưa chi vẫn `approved`, không đóng `superseded` (hợp đồng 13.3 điểm 1 + 3). Tiền khách trả thêm về sau bị duyệt cũ "hút" và chi theo duyệt cũ, không qua định tuyến ADD3 | BE-B (payments/refunds) | **Closed** 24/10 – BE-B `76e21c4` (gộp `ce38624`, hợp đồng 13.4); fuzz chạy lại 710 chuỗi / 28.250 bước, 0 vi phạm cứng; critic `reviews/s1-money-critic-014.md` |
| BUG-R3-015 | P3 | **Bộ test**: không chạy được trên stack `MFA_ENFORCED=true` (staging, production): (1) `freshSession` không có bước TOTP cho DS-E OWN/MGR đã bật 2FA; (2) `createThrowawayUser` gửi S2 chỉ có mật khẩu; (3) `ensureReceivingAccount` (R3-Q51) gọi `/health` + `/__test__/clock` vô điều kiện; (4) `s2Context` dùng `qa.owner` – phiên hạn chế làm ca bỏ qua với lý do sai "DS-E chưa nạp đủ 10 căn" | QA | **Closed** 26/10 – harness trong repo (`totp-store.ts`, `E2E_TOTP_DIR`, `seedReauthFor`, `E2E_LOCAL_CLOCK`, mã TOTP theo đồng hồ stack); chạy trên staging rc.2 (smoke-prod, các ca rc.2) và stack bật 2FA; CI push `4629e6e` xanh |
| BUG-R3-016 | P3 | Khách **đến hôm nay**: báo giá đã lưu không chuyển được thành đơn. H12 chỉ báo "Sale/CTV: nhắn lễ tân tạo đơn đã thu"; lễ tân nhập lại H09 từ đầu – mặc định 2 người lớn trong khi báo giá 1 người lớn, không mang khách/giá của báo giá, không nối báo giá với đơn | PO (+ FE-A, UXD) | Open |
| BUG-R3-017 | **P1** | Trả phòng H16 bước 3, phụ thu trả muộn bằng 1 đêm (BR-416-06 – mọi lượt ESC-031 trên production): thu **tiền mặt** (hoặc thẻ POS) 792.000 → `recordPayment` 422 `note REASON_REQUIRED` (số > còn phải thu lúc đó vì phụ thu chỉ ghi khi B18); màn báo "Ghi lý do (ít nhất 3 ký tự)" nhưng không có ô ghi → không thu được, B18 tiếp theo 409 `BALANCE_DUE`. VietQR (gửi ngữ cảnh trả phòng) và chuyển khoản (có ô ghi chú) đi được | FE-A (+ BE-B) | **Closed** 26/10 – FE-A `64bf5c0` + `67fc853` gộp `main`, có trong `v1.0.0-rc.2` (`4629e6e`, CI push xanh); QA kiểm trên nhánh 4/4 (tiền mặt/thẻ POS, ESC-031 và đêm thêm) |
| BUG-R3-018 | P2 | Desk "Danh mục căn" (FB-INV-005): giá đêm đã **lên lịch** cho ngày sau không hiện ở ngăn kéo/bảng. OWN gõ lại đúng giá đang dùng để hủy lịch thì ô ngày hiệu lực/lý do ẩn, nút Lưu khóa ("không đổi") → không gỡ được giá sai đã lên lịch trên Desk | FE-A (+ BE-A nếu cần API xem/hủy lịch) | **Phần 2 Closed** 27/10 – QA kiểm trên staging `v1.0.0-rc.3` (`70fe734`): Desk lưu lại được giá đang dùng với ngày hiệu lực sau hôm nay; toast ghi ngày áp dụng; báo giá về đúng giá (`qa3-rc1.md` mục 15). **Phần 1 Open – dời v1.0.1**: hiện danh sách giá đã lên lịch + hủy lịch (hợp đồng 0.3.9 `Room.scheduledListPrices`, ARC/BE-A/FE-A) |
| BUG-R3-019 | **P1** | "Đơn dài hạn nhập tay" không tạo được: `createReservation` 422 `directSource REQUIRED` – form dài hạn không có/không gửi Nguồn, quy tắc từ US-155 (`5820a97`) | FE-A (+ BE-D) | Open |
| BUG-R3-020 | P2 | "In phiếu" (`window.print()`) in cả khung Desk (danh sách, ngăn kéo, lớp mờ, nút) – admin-web không có CSS in | FE-A (+ UXD) | Open |
| BUG-R3-021 | P2 | Không có chỗ nhập Wi-Fi trên Desk (`property.wifi_info_i18n` chỉ sửa được ở DB); trang khách báo "Hiện ở đây vào ngày nhận phòng (27/10)" ngay trong ngày 27/10 | PO + FE-A/BE-A (+ OPS) | Open |
| BUG-R3-022 | P2 | Không ghi được phát sinh sau trả phòng trên Desk: "Thêm phát sinh" chỉ hiện khi `in_house`, dù máy chủ có cửa sổ BR-427 (c) | FE-A | Open |
| BUG-R3-023 | P2 | Hộp Đổi phòng (đang ở) liệt kê căn **VD** (401 "Trống, cần dọn") trong "Căn mới (đã dọn hoặc đã kiểm)"; nhãn nhóm hiện mã nội bộ L12/N/NPLUS | FE-A / BE-A | Open |
| BUG-R3-024 | P3 | `/reservations/{id}/check-out` mở được trước ngày đi; mỗi lần qua bước Minibar ghi thêm một `minibar-checks`; hoàn tất 409 (B16) nhưng Desk báo sai "Đơn vừa chuyển sang 'Đang ở'…" | FE-A | Open |
| BUG-R3-025 | P3 | Hộp "Xác nhận cọc" không có ô Mã giao dịch / ghi chú (form Đặt phòng mới và Thu công nợ có) → cột Mã giao dịch ở Chờ đối soát trống | FE-A (+ UXD) | Open |
| BUG-R3-026 | P3 | App nhân viên "Báo sự cố" thiếu loại "Tắc thoát nước", "Wi-Fi" (Desk "Phiếu sửa mới" có 8 loại) | MOB | Open |
| BUG-R3-027 | P3 | Trang khách: mở lại link giữa chừng sau khi chọn "Bổ sung tại quầy" → app quay lại bước Xác nhận nhưng mất danh sách bổ sung → `complete` 409 `INVALID_TRANSITION` (documents), về bước Giấy tờ không thông báo | FE (guest-web) | Open |
| BUG-R3-028 | P3 | Chữ giao diện: lộ "Round 3 / R2 / R3" cho nhân viên; nhãn sai ở Thêm người đi cùng, Xác nhận giờ trả, chữ phụ ô Căn; hạn báo giá 00:00 vs 23:59 | UXD + FE-A | Open |
| BUG-R3-029 | P3 | App nhân viên: OWN/MGR đăng nhập thấy cùng lúc "Nhập mã trong ứng dụng xác thực…" và "Đăng nhập 2 bước sẽ có ở bản sau", không có ô mã | UXD + MOB | Open |
| BUG-R3-030 | P3 | Folio ở màn Trả phòng hiện dòng miễn "Bị từ chối" kèm số âm −210.000 (không được trừ nhưng trông như đã trừ) | FE-A | Open |
| BUG-R3-031 | P3 | Nút "Hoàn tác nhận phòng" (MGR) mở cả khi folio đã có dòng sau nhận phòng; xác nhận thì 409 "reverse the lines posted since check-in first" | FE-A | Open |
| BUG-R3-032 | **P1** | Thư "Security notice" (đổi tài khoản nhận tiền, dùng mã khôi phục, đặt lại 2 bước) **không tới ai**: `production-bootstrap` không đặt email cho chủ, API/Desk không có trường email người dùng → outbox `staff.email` `dead NO_RECIPIENT` (staging 0/27 người có email). Thiếu kênh ngoài app của SEC Q51-6 / 06.15 | BE-A + ARC (hợp đồng), OPS (`ops-check`) | Open – sửa ở **v1.0.1** (04/11). SEC chấp nhận chạy D 02/11 với biện pháp bù B1–B6; quá 09/11 → ESC |

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
- **Trạng thái:** **Closed** 24/10. QA đã chạy lại trên `origin/main` `12f6d37`, xem mục "Xác nhận BUG-R3-006" ở cuối file.

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
- **Ghi chú test lại (QA, 24/10, `origin/main` `a1da76f`, stack `ottimo-qa155`, harness S35 đã gỡ khỏi spec):**
  - TC-WR-000 đạt: OWN, MGR, FDL, FD, SAL đều thấy menu "Yêu cầu từ website" và mở được S35 (tiêu đề trang hiện, không có câu "không có quyền"); CTV không có menu và bị từ chối khi mở thẳng.
  - Mọi ca S35 khác (TC-WR-002…012) chạy với `Me` thật của server và đều đạt.
- **Trạng thái:** **Closed** 24/10.

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
- **Ghi chú test lại (QA, 24/10, `a1da76f` – hợp đồng 0.3.8 bổ sung 5):** TC-WR-008 viết lại thành ca kill switch, đạt. Các bước kiểm:
  - Hôm nay đã có dòng `true` và form token trả 200.
  - MGR, FDL đặt `false` → 403.
  - OWN đặt `false` hôm nay → 200. Lần gọi form token **ngay sau** đó → 404, landing hiện câu tạm dừng.
  - Dòng hôm nay thành `false`. Audit `security` có `before.value = true` và `after.sameDayOverride = true`.
  - OWN bật lại `true` cùng ngày → 422 (`effectiveFrom`), form token vẫn 404.
  - TC-WR-009 bỏ bước xóa dòng bằng psql: công tắc tắt đúng bằng API. Harness chỉ còn xóa dòng ở `beforeAll`/`afterAll` để chạy lại trong cùng ngày, vì bật lại cùng ngày bị chặn theo thiết kế.
- **Trạng thái:** **Closed** 24/10.

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
- **Ghi chú test lại (QA, 24/10, `a1da76f`):**
  - TC-WR-010 đạt: `079 203 012 345`, `079-203-012-345`, `079.203.012.345` đều nhận 422 `ID_NUMBER_DETECTED`.
  - TC-WR-007 đạt: dãy liền qua form landing → 422 báo tại ô, không lặp số, không lưu.
  - Log của mọi container trong project (api, worker, postgres, Caddy Desk, **Caddy landing thật với access log của OPS**) không có số; `idempotency_key` không có số.
- **Trạng thái:** **Closed** 24/10.

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
- **Ghi chú test lại (QA, 24/10, `a1da76f`):**
  - TC-WR-011 đạt. FDL đọc công tắc → 200, `current.value = false`; khóa bảo mật khác (`public_booking_request_pow_enabled`) vẫn 404 với FDL.
  - S35 của FDL hiện "Form đặt phòng trên website đang tắt".
  - FDL đặt công tắc → 403 (trong TC-WR-008).
- **Trạng thái:** **Closed** 24/10.

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
- **Ghi chú test lại (QA, 24/10, `a1da76f`):**
  - TC-WR-012 viết lại và đạt. H09 mở từ yêu cầu có ô "Kênh" chỉ đọc, giá trị "Trực tiếp · Website", kèm dòng "Đơn tạo từ yêu cầu website luôn là kênh Trực tiếp, nguồn Website – không đổi được."
  - Không còn ô chọn Nguồn hay nút "CTV / môi giới" / "OTA". Yêu cầu giữ `in_progress`, không có đơn.
  - TC-WR-003 tạo đơn B2 với ô khóa này: đơn `direct/website`.
  - Câu lỗi mới khi server trả 422/409 (`webreq.source_must_be_website`, `webreq.booking_closed`) không còn đường kích hoạt từ UI. Chỉ có test đơn vị của FE (`r3-bug-010-011-feb.test.tsx`), QA chưa kiểm E2E.
- **Trạng thái:** **Closed** 24/10.

### BUG-R3-012 – J15 chờ hoàn mãi khi khách đang nợ (critic B-1)
- **Mức:** P0 (lỗi tiền, oracle mục 0): khoản khách nợ không thành công nợ, không có nhật ký, không có thông báo, folio không đóng.
- **Tìm bằng:** lượt fuzz cuối G1 (24/10). Critic độc lập `reviews/s1-money-critic-final.md` B-1 thấy ở 5 chuỗi: FZ-01 60070, 60164; FZ-02 61019, 61084, 61092.
  - Harness đã ghi nhầm thành cảnh báo "J15 chưa chạy" (`I1?`/`I3?`). Nay đã sửa: quá cửa sổ + 60 phút mà folio còn `settled` là vi phạm cứng. Chạy lại seed 60164: I1 + I3 cứng.
- **Tái hiện (tất định):** `services/api/test/fuzz/bug-r3-012.test.ts`, chạy với `FUZZ_KNOWN_BUGS=1`.
  1. Trả phòng.
  2. MGR void F&B 300.000 → yêu cầu hoàn tự sinh.
  3. OWN duyệt.
  4. Ghi phát sinh 500.000 sau trả phòng → khách nợ 200.000.
  5. Qua cửa sổ, chạy J15.
- **Thực tế:** folio `settled`, `openDebtVnd` 0, J15 trả `waiting_refund`.
- **Mong đợi:** folio `closed`, công nợ 200.000 có nhật ký và báo OWN/MGR; yêu cầu hoàn thừa thì được hủy hoặc tính lại.
- **Mã:** `FolioService.closeAfterWindow` dòng ~1375 `if (b.openRefundVnd > 0) return 'waiting_refund'`. Nên chờ chỉ khi còn tiền dư thật, hoặc tính lại `refundPlan` trước.
- **Vai:** BE-B.
- **Trạng thái:** **Closed** 24/10. Bản sửa BE-B `2f1d738` và các bản theo sau `69a5398`, gộp ở `f2ba2ac`.
  - Lượt fuzz chạy lại: 710 chuỗi, 28.250 bước.
  - Critic `reviews/s1-money-critic-rerun.md` mục 6:
    - 195 lần J15 `waiting_refund`, lần nào cũng còn tiền dư và yêu cầu mở;
    - 25 lần đóng, trong đó 21 lần có ghi nợ;
    - seed cũ 60164 và 61092 nay đóng kèm ghi nợ;
    - 0 yêu cầu chờ vượt tiền dư trống sau 1.459 bước tuần tự làm giảm tiền dư; 0/297 lần duyệt vượt tiền dư trống.
  - Đường chi hoàn còn hở, tách thành BUG-R3-014.

### BUG-R3-013 – Yêu cầu hoàn không được tính lại khi tiền dư giảm (critic M-1)
- **Mức:** P1.
  - Có 2.406 bản ghi ở 241 chuỗi; 12 lần duyệt khi yêu cầu lớn hơn tiền dư, 2 lần trong đó tiền dư bằng 0.
  - Chưa thấy tiền chi sai, vì mức chi bị chặn ở số tiền dư (critic đọc mã). Fuzz chưa chi lần nào, do thiếu nơi nhận tiền (`REFUND_DESTINATION_REQUIRED`).
  - Đây là gốc của BUG-R3-012.
- **Mong đợi:** BR-522 / ARC 13.2: khi tiền dư giảm, chạy `refundPlan` để hủy (`superseded`) hoặc giảm yêu cầu đang mở; không duyệt yêu cầu lớn hơn tiền dư.
- **Vai:** BE-B.
- **Trạng thái:** **Closed** 24/10. Bản sửa BE-B `2f1d738` và các bản theo sau `69a5398`, gộp ở `f2ba2ac`.
  - Lượt fuzz chạy lại: 710 chuỗi, 28.250 bước.
  - Critic `reviews/s1-money-critic-rerun.md` mục 6:
    - 195 lần J15 `waiting_refund`, lần nào cũng còn tiền dư và yêu cầu mở;
    - 25 lần đóng, trong đó 21 lần có ghi nợ;
    - seed cũ 60164 và 61092 nay đóng kèm ghi nợ;
    - 0 yêu cầu chờ vượt tiền dư trống sau 1.459 bước tuần tự làm giảm tiền dư; 0/297 lần duyệt vượt tiền dư trống.
  - Đường chi hoàn còn hở, tách thành BUG-R3-014.

### Xác nhận BUG-R3-006 (QA 24/10, `origin/main` @ `12f6d37`)
- Đã chạy cả bộ admin-web 5 lần:
  - một lần ở giờ thật (11:24);
  - bốn lần với đồng hồ giả cố định qua `vi.useFakeTimers`, lúc 00:36, 02:40, 05:59 và 14:00. Đây là tệp cấu hình tạm, không commit.
- Cả 5 lần đều **610/610 đạt**.
- Bản sửa của QA2 và FE-A (ngày nghiệp vụ cho mọi màn, 4b193d7) đã có hiệu lực → **Closed**.

### BUG-R3-014 – Chi hoàn đưa tiền dư về 0 nhưng các yêu cầu đã duyệt vẫn treo (critic chạy lại M-2)
- **Mức:** P1. Loại (a): lách kiểm soát duyệt tiền ra, sổ không lệch đồng nào. Critic đề nghị **nâng P0** nếu SEC tái hiện được biến thể "tiền miễn A32 bị chi theo duyệt cũ".
- **Tìm thấy:**
  - Lượt fuzz chạy lại 24/10 trên `origin/main` `f2ba2ac`. Họ mới FZ-13 đi đường chi hoàn có nơi nhận.
  - QA tính lại offline bất biến I24 (đã thêm vào harness sau lượt chạy), critic xác nhận trong `reviews/s1-money-critic-rerun.md` mục 4, 5, 7.
- **Bằng chứng:**
  - 7 bước chi đưa tiền dư về 0: FZ-01 60023 #41; FZ-13 64023 #42, 64026 #29, 64029 #36, 64034 #10, 64053 #27, 64062 #29.
  - Sau các bước này, 10 yêu cầu `approved` còn tổng 4.827.000 chưa chi vẫn để nguyên.
  - 4 lần tiền mới vào bị duyệt cũ "hút". Ví dụ 64023 #45: QR 900.000 chỉ sinh yêu cầu 66.000.
  - 2 lần chi tiền mới theo duyệt cũ, tổng 1.174.000:
    - 64023 #50: 534.000 theo duyệt `manager` cũ;
    - 64053 #54: 640.000, người chi là MGR đã làm A32 trên folio.
- **Mong đợi:** hợp đồng ARC 0.3.8 bổ sung 6 (`s1-contracts` 13.3).
  - Điểm 1: đường hoàn tiền làm giảm tiền dư phải chạy lại `refundPlan` (`refundsDownToCredit` / `afterSettledMoneyChange`) trong cùng giao dịch.
  - Điểm 3: hết tiền dư thì yêu cầu đã duyệt chưa chi hoặc chi dở phải đóng `superseded`, có nhật ký, báo người liên quan, xóa nơi nhận.
  - Tiền mới thành yêu cầu mới, định tuyến theo ADD3.
- **Gốc lỗi** (critic đọc mã): `refunds.service.ts` `payOut` (từ khoảng dòng 447) không gọi hàm lập lại kế hoạch hoàn.
- **Ca tái hiện:** `product/services/api/test/fuzz/bug-r3-014.test.ts` – QR thừa 300.000 → duyệt → phát sinh 100.000 → chi 200.000 → kỳ vọng không còn yêu cầu mở, QR mới 500.000 thì xin 500.000.
  - Chỉ chạy khi `FUZZ_KNOWN_BUGS=1`.
  - **Chưa chạy được**: Docker (OrbStack) treo ngay sau lượt fuzz, Postgres test không truy cập được. Bằng chứng hiện có là log JSONL của lượt chạy và đối chiếu của critic. QA chạy lại ca này khi Docker trở lại.
- **Vai:** BE-B sửa; SEC dò biến thể A32 để chốt mức; ARC review.
- **Trạng thái:** **Closed** 24/10.
  - Bản sửa BE-B `76e21c4`, gộp ở `ce38624`, theo hợp đồng ARC 0.3.8 bổ sung 7 (`s1-contracts` 13.4):
    - bất biến K11-06 tính cả yêu cầu đã duyệt;
    - `payOut` lập lại kế hoạch hoàn;
    - `SELF_REFUND_FORBIDDEN` cho người làm A32 dưới OWN.
  - `bug-r3-014.test.ts` (bước do BE-B viết lại theo 13.4): 1/1 đạt trên `ce38624`, QA xác nhận đúng oracle 13.4.
  - Lượt fuzz chạy lại cùng seed: 710 chuỗi, 28.250 bước, 0 vi phạm cứng. I24 (K11-06) và I25 (`SELF_REFUND_FORBIDDEN`) chấm cứng, đều 0.
  - Critic `reviews/s1-money-critic-014.md`:
    - 0 vi phạm K11-06 trên 26.105 bản ghi;
    - 7 chuỗi M-2 cũ không còn duyệt treo hay chi theo duyệt cũ;
    - 63/63 lần 403 `SELF_REFUND_FORBIDDEN` đúng người.

### BUG-R3-015 – Bộ test không chạy được trên stack bật `MFA_ENFORCED`

- **Mức:** P3. Lỗi của bộ test, không phải sản phẩm. Ảnh hưởng: không chạy được E2E hồi quy trên staging/production sau khi OWN/MGR bật 2FA, gồm smoke production sau deploy (G5-5) và các lượt hồi quy sau v1.0.
- **Môi trường:** bộ E2E `2963675` (`v1.0.0-rc.1`), đích staging `MFA_ENFORCED=true`, 26/10.
- **Bước tái hiện:**
  1. Bật 2FA cho `qa.owner`, `qa.mgr` (staging bắt buộc).
  2. Chạy bất kỳ ca nào gọi `s2Context`, `session('qa.owner'|'qa.mgr')`, `createThrowawayUser` hoặc `ensureReceivingAccount` với đích staging.
- **Thực tế:**
  - Trước khi OWN đăng ký: `s2Context` nhận phiên hạn chế, `GET rooms` 403 → ca **bỏ qua** "môi trường: DS-E chưa nạp đủ 10 căn" (lý do sai).
  - Sau khi đăng ký: `freshSession` gặp `401 MFA_REQUIRED` → ca đỏ ở bước đăng nhập; `createUser` 422 `STRONG_REAUTH_REQUIRED` vì S2 thiếu mã.
  - `ensureReceivingAccount` gọi `GET /health` (404 từ Internet theo thiết kế) và `/__test__/clock` (không có trên image production).
- **Mong đợi:**
  - Bộ test đọc secret TOTP thử của tài khoản DS-E từ tệp ngoài repo (biến môi trường trỏ tới thư mục, quyền 600, không in), tự gửi bước 2 và kèm `totpCode` vào S2; theo dõi bước đã dùng để không phát lại (SEC 06.18).
  - `ensureReceivingAccount` bỏ qua khi đích không có test-support (`CLOCK_MODE=system`).
  - `s2Context`/`sessionOrSkip` báo rõ "phiên hạn chế – tài khoản cần đăng ký 2FA" thay vì bỏ qua với lý do khác.
- **Bằng chứng:** `qa3-rc1.md` mục 2. Bản sửa thử trên bản chép scratchpad (`qa-r6/src-rc1/product/tests/e2e/support/api.ts`, `s3-stay.ts`; tệp `*.orig` là bản gốc) – với bản sửa, `money-s4` 34/34, A1, 2FA, R3-Q51, US-008 chạy được trên staging.
- **Vai:** QA (sửa trong repo cùng BUG-R2-222 phần (1)). SEC xem cách lưu secret thử.
- **Bản sửa (26/10 tối, QA):**
  - `e2e/support/totp-store.ts`: secret thử đọc từ `E2E_TOTP_DIR` (ngoài repo, 0700/0600), bước đã dùng ghi `<user>.laststep` dưới khóa liên tiến trình; chờ bước mới thì cộng thời gian cho ca.
  - `support/api.ts`: `freshSession` gửi bước 2 khi `401 MFA_REQUIRED`; phiên "đăng ký 2FA trước" của DS-E OWN/MGR → tự đăng ký khi `E2E_TOTP_ENROLL=1`, nếu không thì **đỏ** kèm lý do; phiên hạn chế không được dùng lại từ bộ nhớ đệm; `ownerForTestSupport` đi đường đăng nhập đầy đủ; `seedReauthFor(username)` thêm `totpCode` (dùng ở `createThrowawayUser`, `identity.api`, `rbac/sprint1-ops`); `healthTime` + `E2E_LOCAL_CLOCK` (BUG-R2-222 (1)).
  - `support/s3-stay.ts`: `ensureReceivingAccount` không gọi `/health`, `/__test__` khi đích không có test-support. `ui/helpers.ts` `loginForm` điền mã TOTP. `api/mfa-s2` S1-SEC-11 bỏ qua có lý do trên stack cờ bật.
  - Thêm `e2e/smoke-prod/readonly.prod.spec.ts` (project `smoke-prod`, chỉ đọc) cho smoke production sau deploy; `global-setup` không đăng nhập `qa.*` khi `E2E_PROD_SMOKE=1`. Hướng dẫn: `product/tests/README.md`.
- **Kiểm (stack dùng một lần `ottimo-qa3`):**
  - Cờ bật, `E2E_TOTP_ENROLL=1`: harness tự đăng ký 2FA `qa.owner`, `qa.mgr`; `api` identity + mfa-s2 + money-s4 + gate-s4 + stay-checkout.s3 + refund-credit.s4: 56 đạt, 0 đỏ, bỏ qua có chủ đích (S1-SEC-11, ca cần SQL/đồng hồ); `rbac-sprint1` 319 đạt / 55 bỏ qua (giống CI); UI `rack-booking.smoke`, `admin-web.smoke`, `mfa-us143` 17 đạt / 2 bỏ qua.
  - Cờ tắt, DB mới, không `E2E_TOTP_DIR` (đường CI): identity + mfa-s2 + gate-s4 14 đạt + 1 đỏ `429` đăng nhập theo IP ở ca US-143 API (chạy lại riêng: 2/2 đạt – giới hạn 20 lần/IP của stack mới, không liên quan bản sửa); `rbac-sprint1` 319/55; `ui-clock/mfa-us143-clock` 1/1; `smoke-prod` 8 bỏ qua (không có `E2E_PROD_SMOKE`).
  - `smoke-prod` trên stack dev với `E2E_PROD_SMOKE_LOCAL=1`: 8/8; không có cờ LOCAL thì PS-02 đỏ đúng (`/health` 200 trên dev).
  - Chưa chạy trên staging (khung B1). Lượt staging 27/10 sáng: A1 phần 3 bằng harness repo + `smoke-prod` (PS-01…05 trên staging dùng Caddyfile.prod).
- **Lưu ý commit:** phần sửa các tệp có sẵn đã vào `476b79d` (commit của ORC lúc 16:09 gom cả cây làm việc) trước khi `totp-store.ts` và `smoke-prod/` được thêm – `476b79d` thiếu `support/totp-store.ts` nên typecheck/E2E đỏ; commit kế tiếp của QA bổ sung.
- **Trạng thái:** Closed 26/10 – chạy trên staging `v1.0.0-rc.2` bằng harness repo (`qa3-rc1.md` mục 13); CI push `4629e6e` xanh.

### BUG-R3-016 – Khách đến hôm nay: báo giá không chuyển được thành đơn

- **Mức:** P3. Không sai tiền (server tính lại theo đơn), không chặn luồng: lễ tân vẫn tạo được đơn. Rủi ro là nhập lại sai số khách/giá so với cái sale đã báo cho khách.
- **Môi trường:** staging `rc.1`, Desk Chromium 1366×768, `qa.sal` + `qa.fd`, 26/10 15:34 (A1-rc1 chặng 1–3).
- **Bước tái hiện:**
  1. `qa.sal` H12: ngày đến = hôm nay, 1 đêm, **1 người lớn** → Báo giá căn 202 → Lưu báo giá (tổng 792.000, cọc 200.000).
  2. Bấm "Giữ chỗ": hộp báo "Khách đến hôm nay thì không giữ chỗ được… Sale/CTV: nhắn lễ tân tạo đơn đã thu cho khách này." Nút "Tạo giữ chỗ" khóa (đúng quy tắc).
  3. `qa.fd` mở H09 "Đặt phòng mới".
- **Thực tế:**
  - Không có nút "Tạo đơn từ báo giá"; H09 không biết báo giá vừa lưu. Lễ tân chọn lại ngày, căn, khách.
  - H09 mặc định **2 người lớn**. Đơn `OTM-00294` tạo ra có 2 khách trong khi báo giá cho khách là 1 người. Khách 2 phải "Bổ sung tại quầy", lễ tân nhập tay giấy tờ.
- **Mong đợi:** PO chọn một trong hai:
  - (a) khi khách đến hôm nay, hộp "Giữ chỗ" của lễ tân (vai có quyền tạo đơn) có nút tạo đơn đã thu từ báo giá: mang căn, ngày, số khách, khách, giá; sale vẫn chỉ được nhắn;
  - (b) giữ như hiện tại nhưng H09 cho tìm/chọn báo giá còn hiệu lực của khách, và câu hướng dẫn nói rõ lễ tân kiểm lại số khách.
  - Nếu PO cho rằng đúng thiết kế thì đóng có lý do.
- **Bằng chứng:** `qa-r6/a1-rc1/screens/002–006`, `run-log.md` (`createReservation` 201, `adults` 2).
- **Vai:** PO quyết; FE-A (H09/H12) + UXD (chữ) nếu sửa.
- **Trạng thái:** Open.

### BUG-R3-017 – Không thu được tiền mặt/thẻ cho phụ thu trả muộn bằng 1 đêm ở bước 3 trả phòng

- **Mức:** P1. QA quyết. Trả phòng kèm thu tiền là luồng chính, nên đúng ra xét P0 ("không thu tiền được"). Hạ xuống P1 vì:
  - có đường vòng trong cùng màn: VietQR, hoặc chuyển khoản có ô ghi chú;
  - không sai tiền, không mất dữ liệu.
  Vẫn là P1 vì:
  - từ v1.0, mọi lượt trả muộn mà đêm ngày đi không bán được đều đi đường này (ESC-031 – đường duy nhất trên production);
  - khách trả tiền mặt lúc 20:30 thì lễ tân bị chặn, không có chỗ ghi lý do.
- **Môi trường:** stack dùng một lần `ottimo-esc031` dựng từ `c7ba6b5`, `MFA_ENFORCED=true`, Desk Chromium 1366×768, `qa.fd`, đồng hồ ảo.
  - Cùng mã PaymentPanel/`recordPayment` có trên `main` từ R2 0.3.7 (`feb7503`, `f527d35`). Lỗi không do bản vá ESC-031 gây ra.
- **Bước tái hiện:**
  1. Đơn 1 đêm, đã thu đủ tiền phòng. Có khách khác đến cùng căn tối ngày đi, nên đêm đó không bán được.
  2. Ngày đi 20:35, mở Trả phòng → Minibar → Phụ phí (báo "phụ thu bằng giá 1 đêm") → Bill & thu tiền.
  3. Ghi lý do. Chọn "Tiền mặt", số 792.000, "Tiền khách đưa" 792.000, bấm "Ghi nhận đã thu 792.000 đ".
- **Thực tế:**
  - `POST /folios/{id}/payments` → **422** `errors[{field: note, code: REASON_REQUIRED}]` (số tiền > còn phải thu tại lúc đó = 0; phụ thu chỉ vào folio khi B18).
  - Màn báo "Ghi lý do (ít nhất 3 ký tự)" nhưng phần tiền mặt không có ô ghi chú.
  - Thẻ POS: QA đọc mã (`PaymentPanel.tsx`), chưa bấm thử – cùng `recordPayment` không ngữ cảnh, phần thẻ chỉ có ô mã POS, nên bị chặn như tiền mặt.
  - Bỏ qua bước thu, bấm Hoàn tất → B18 **409 `BALANCE_DUE` 792.000**.
- **Mong đợi:** lễ tân thu được đúng số bill đang hiện (còn phải thu 792.000 gồm phụ thu dự tính) bằng mọi cách thanh toán, giống VietQR đang làm.
- **Hướng sửa (ARC/FE-A/BE-B chọn):**
  - (a) Desk gửi `finalPayment` (cash/card) trong lệnh B18 – hợp đồng đã có, ca tích hợp BE-B dùng sẵn;
  - (b) `recordPayment` nhận ngữ cảnh trả phòng như `createVietQr` (`checkoutAt`, `lateFeeAsNight`) để tính "còn phải thu" gồm phụ thu;
  - (c) tối thiểu: hiện ô ghi chú cho tiền mặt/thẻ khi server đòi.
  - Cần thêm ca UI hồi quy (bước 3 thu tiền mặt rồi hoàn tất).
- **Bằng chứng:** `rounds/round-03/outputs/FE/esc031-shots/02-buoc3-tien-mat-bi-doi-ly-do.png`; log scratchpad `esc031/p2b-ui.log` (`[ui] tiền mặt 792.000 (bước 3) → 422 … note REASON_REQUIRED`).
- **Vai:** FE-A (+ BE-B nếu chọn (b)); UXD chữ nếu chọn (c).
- **Hạn:** trước ngày chạy D (02/11). Đề nghị ORC xếp cùng lượt gộp ESC-031.
- **Kiểm lại (QA, 26/10 ~17:30–17:45):**
  - Nhánh `worktree-agent-a67639f06f6add4d9` tip `64bf5c0`, ảnh web dựng lại ở `67fc853`. Stack dùng một lần `ottimo-esc031`, `MFA_ENFORCED=true`.
  - FE-A sửa phía Desk, server không đổi: tiền mặt/thẻ POS vượt số folio đang nợ không gọi `recordPayment`. Panel ghi "đã nhận …, ghi vào folio khi bấm Hoàn tất", và B18 gửi `finalPayment`.
  - Bốn ca (ca QA `ui-clock/qa-bug017.spec.ts`, scratchpad):

    | Ca | Đường | Cách trả | Số ghi trong B18 | Kết quả |
    |---|---|---|---|---|
    | A | ESC-031 | thẻ POS | `finalPayment` 792.000 | 200 |
    | B | đêm thêm sau 18:00 (đêm bán được) | tiền mặt | 708.000 | 200 |
    | C | đêm thêm sau 18:00 | thẻ POS | 750.000 | 200 |
    | D | ESC-031, folio đã nợ 70.000 F&B | tiền mặt | 862.000 | 200 |

  - Cả bốn ca: không có `POST /payments` ở bước 3; hộp xác nhận có dòng "Ghi vào folio khoản thu …"; folio `settled`, còn phải thu 0, không dư; dòng thanh toán đúng cách trả và số tiền.
  - Ca ESC-031 UI (tiền mặt 1.000.000 khách đưa) → `finalPayment` 792.000. `lateFeeInsteadOfNight` vẫn đúng 3 trường. 409/422 như cũ.
  - admin-web 625/625. Ảnh: `rounds/round-03/outputs/FE/esc031-shots/02-buoc3-tien-mat-ghi-khi-hoan-tat.png`, `bug017-*.png`.
- **Trạng thái:** Closed 26/10 – gộp `main` trong `v1.0.0-rc.2` (`4629e6e`), CI push xanh.

### BUG-R3-018 – Không xem, không gỡ được giá đêm đã lên lịch trên Desk (FB-INV-005)

- **Mức:** P2. Lỗi chạm giá (tiền) cho các đêm tương lai, nên QA xét P1 trước. Hạ xuống P2 vì:
  - không sai tiền của đơn/báo giá đã có (BR-006 giữ giá cũ);
  - đổi giá lần nữa sang số **khác** vẫn làm được;
  - có đường vòng bằng API.
  Không thấp hơn P2 vì:
  - B2 (28/10) là lúc INV nhập giá thật: nhập nhầm rồi muốn quay về giá đang dùng thì Desk chặn;
  - Desk không cho biết đang có giá đã lên lịch.
- **Môi trường:** staging `v1.0.0-rc.2` (`4629e6e`), Desk Chromium 1366×768, `qa.owner` (2FA), 26/10 ~23:00.
- **Bước tái hiện:**
  1. Danh mục căn → Sửa căn 102 (giá đêm đang dùng 850.000).
  2. Giá đêm 700.000, hiệu lực 27/10, lý do → Lưu → 200. Báo giá 102 ngày 27/10 = 700.000.
  3. Mở lại Sửa căn 102.
- **Thực tế:**
  - Ngăn kéo và bảng vẫn chỉ hiện 850.000 (giá đang dùng), không có dòng "đã lên lịch 700.000 từ 27/10".
  - Gõ lại 850.000 → ô Hiệu lực từ và Lý do biến mất, nút **Lưu khóa**.
  - Không có nút hủy lịch. Giá 700.000 vẫn áp từ 27/10.
  - Chỉ gỡ được bằng API (`PATCH rooms/{id}` `listPrice` 850.000 hiệu lực 27/10). QA đã làm như vậy để trả staging về đúng giá.
- **Mong đợi:**
  - Ngăn kéo hiện giá đã lên lịch (ngày, giá tháng, giá đêm, người, lý do).
  - So "đã đổi" với giá **của ngày hiệu lực chọn** (gồm dòng lên lịch), không chỉ giá hôm nay. Hoặc có nút "Hủy lịch đổi giá" như màn tài khoản nhận (R3-Q51).
- **Bằng chứng:** scratchpad `qa-r6/rc2/run-log.md`, ảnh `qa-r6/rc2/screens/fb005-*.png`; ca `ui/qa-rc2.spec.ts` (`setNightly` → `Timeout` ô "Hiệu lực từ" vì ô ẩn).
- **Vai:** FE-A (+ BE-A nếu cần API danh sách/hủy giá đã lên lịch); UXD chữ.
- **Hạn:** trước B2 (28/10) nếu kịp. Nếu không, ORC báo INV khi nhập giá ở B2: nhập nhầm thì gọi đội sửa bằng API.
- **Chia hai phần (ORC, decision-log 26/10):**
  - (2) Desk sửa được giá nhầm đã lên lịch, bằng cách ghi đè cùng ngày hiệu lực. Có trong `v1.0.0-rc.3`.
  - (1) Hiện danh sách giá đã lên lịch và nút hủy lịch. Dời **v1.0.1**.
- **Kiểm lại phần 2 (QA, 27/10 07:27–07:36, staging `v1.0.0-rc.3` `70fe734`, Desk Chromium 1366×768, `qa.owner` có 2FA, căn 101):**
  - Giá trước lượt thử: tháng 9.600.000, đêm 800.000.
  - Gõ lại 800.000 với hiệu lực hôm nay: Lưu khóa, kể cả khi đã ghi lý do; chữ phụ `rooms.price_same_today` hiện.
  - Lên lịch 300.000 từ 28/10: cảnh báo mềm (giá đêm × 30 < giá tháng) hiện, vẫn lưu được (200). Toast "Đã lưu căn 101. Giá áp dụng từ 28/10/2026." Báo giá 28/10 = 300.000.
  - Gõ lại 800.000, hiệu lực 28/10: ô ngày và ô lý do không ẩn; chữ phụ `rooms.price_same_future` hiện; **Lưu mở**. PATCH 200, body `listPrice` {28/10, 9.600.000, 800.000}. Toast ghi 28/10/2026. Báo giá 28/10 và 29/10 = 800.000.
  - Lặp lại với 29/10 (880.000, rồi về 800.000): đạt. Dòng 28/10 giữ nguyên.
  - Giá tháng không đổi: body PATCH và nhật ký `room.updated` đều ghi 9.600.000.
  - Đơn OTM-00355 (đêm 28/10, 667.000) không đổi.
  - Ca: scratchpad `qa-r6/src-rc3/product/tests/e2e/ui/qa-rc3.spec.ts`. Nhật ký và ảnh: `qa-r6/rc3/`.
- **Thêm vào mong đợi phần 1 (v1.0.1):** Desk luôn gửi cả giá tháng và giá đêm, điền sẵn theo giá **hôm nay**. Nếu dòng đã lên lịch ngày D đổi cả hai giá mà OWN chỉ sửa một giá cho D, giá kia của dòng D sẽ bị ghi đè về giá hôm nay mà không báo. Khi chọn ngày có dòng lên lịch, Desk nên điền sẵn giá của dòng đó, hoặc nói rõ cả hai giá sẽ bị thay. Trong rc.3, chữ phụ `price_same_future` chỉ nói "giá đã lên lịch đúng ngày đó sẽ được thay".
- **Trạng thái:** **Phần 2 Closed** 27/10 (QA tự kiểm lại trên rc.3). **Phần 1 Open, dời v1.0.1.**

### BUG-R3-019 – Không tạo được "Đơn dài hạn nhập tay"

- **Mức:** P1.
- **Vì sao P1:**
  - Chặn hẳn một chức năng cần cho ngày D. Khách dài hạn đang ở phải được đặt lên sơ đồ bằng đơn này (`day-one-guide.md` mục 4, sổ tay 2.7).
  - Không có đơn thì căn của khách dài hạn hiện trống, có thể bị bán trùng.
- **Vì sao không P0:** không sai tiền, không lộ dữ liệu. Có cách tạm chặn bán trùng bằng **Khóa phòng có kế hoạch**.
- **Môi trường:** staging `v1.0.0-rc.3` (`70fe734`), Desk Chromium 1440×900, `qa.fd`, 27/10 10:31.
- **Bước tái hiện:**
  1. Sơ đồ phòng → **Đơn dài hạn nhập tay**.
  2. Căn 402, Ngày vào 01/03/2027, Ngày ra 01/06/2027 (3 tháng · 92 đêm). Khách đứng tên "Trần Quốc Bảo" (tạo nhanh, SĐT giả). Tiền thuê 12.000.000, ký quỹ 12.000.000, số HĐ "HD-MAU-2027-01", ghi chú.
  3. Bấm **Tạo đơn dài hạn**.
- **Thực tế:**
  - `POST /v1/properties/{p}/reservations` → **422** `{"code":"VALIDATION_FAILED","errors":[{"field":"directSource","code":"REQUIRED"}]}`.
  - Form vẫn mở. Desk không chỉ ra ô nào sai (form không có ô Nguồn).
- **Nguyên nhân (đọc mã):**
  - `LongStayDialog.tsx` gửi `channelId` = kênh trực tiếp nhưng không có `directSource`.
  - `reservations.service.ts:603` (US-155, commit `5820a97`) bắt buộc `directSource` khi kênh trực tiếp và không có `websiteBookingRequestId`.
  - Mở form từ **Đặt phòng mới** với ≥ 28 đêm cũng chuyển sang form này.
- **Mong đợi:** tạo được đơn, cờ "HĐ ngoài hệ thống".
- **Đề xuất sửa:** form dài hạn gửi `directSource` (thêm ô Nguồn như H09, hoặc mặc định `zalo_phone`). Hoặc máy chủ miễn `directSource` khi có `manualLongStay`. ARC chọn.
- **Thêm ca E2E** tạo đơn dài hạn nhập tay (UI) vào smoke.
- **Bằng chứng:** scratchpad `qa-r6/man/log.md` (lượt `walk lt3`); ảnh form `product/docs/manual/img/C2-09.png`.
- **Vai:** FE-A (+ BE-D/ARC).
- **Hạn:** bản vá trước 02/11.
- **Trạng thái:** Open.

### BUG-R3-020 – "In phiếu" in cả khung Desk

- **Mức:** P2. Sổ tay v1.0 dựa vào nút này để đưa bill giấy/PDF cho khách. Có cách tạm: cho khách xem trên màn hình.
- **Môi trường:** staging rc.3, Desk Chromium, `qa.fd`, OTM-00294 (đã trả phòng).
- **Bước tái hiện:**
  1. Đơn đã trả phòng → **Xem Phiếu thanh toán**.
  2. Bấm **In phiếu**. Xem bản in (QA dùng chế độ media `print` + `page.pdf` A4 của Chromium – cùng bộ in với Chrome).
- **Thực tế:**
  - `window.print()` được gọi.
  - Bản in gồm cả danh sách đơn, ngăn kéo khung đơn, lớp phủ tối, khung hộp "Phiếu thanh toán", nút ngôn ngữ, nút "Xem Phiếu thanh toán". Chữ của trang nền chồng lên nhau.
  - Trong `apps/admin-web` và `packages/ui` không có `@media print`.
- **Mong đợi:** chỉ in phần phiếu (logo/tên cơ sở, số phiếu, dòng, tổng, "Giá đã gồm thuế GTGT"), đúng ngôn ngữ chọn, khổ A4/A5.
- **Bằng chứng:** scratchpad `qa-r6/man/raw/BILL-vi.pdf`, `BILL-vi-printmedia.png` (tên khách giả, không đưa repo).
- **Vai:** FE-A (+ UXD mẫu in).
- **Trạng thái:** Open.

### BUG-R3-021 – Wi-Fi: không có chỗ nhập trên Desk, trang khách báo sai

- **Mức:** P2. Khách không xem được Wi-Fi trên trang khách. Sổ tay 1.4 dặn chủ đầu tư nhập ở Tham số quy tắc, nhưng không có chỗ đó.
- **Môi trường:** staging rc.3. Trang khách trên điện thoại, đơn OTM-00359 (đến 27/10).
- **Thực tế:**
  - Tham số quy tắc không có khóa `wifi.*`. Desk không màn nào sửa Wi-Fi.
  - Máy chủ đọc `property.wifi_info_i18n` (`guest-portal.service.ts` `wifiOf()`), cột này chỉ ghi được bằng DB/seed.
  - Staging chưa có giá trị. Ngày 27/10, ngày nhận phòng của đơn, trang khách vẫn ghi "Wi-Fi – Hiện ở đây vào ngày nhận phòng (27/10)."
- **Mong đợi:**
  - (a) Chủ đầu tư nhập/sửa Wi-Fi trên Desk (vai OWN, có lịch sử).
  - (b) Khi chưa cấu hình, trang khách không hứa "hiện vào ngày nhận phòng". Ghi "Hỏi lễ tân" hoặc ẩn mục.
- **Cần kiểm thêm:** production đã có `wifi_info_i18n` chưa (OPS).
- **Vai:** PO (phạm vi) + FE-A/BE-A; OPS kiểm dữ liệu production.
- **Trạng thái:** Open.

### BUG-R3-022 – Không ghi được phát sinh sau trả phòng trên Desk

- **Mức:** P2. Thiếu tiền: hư hỏng/minibar phát hiện sau khi khách đi không vào folio. Cách tạm: điều chỉnh tăng một dòng có sẵn – sai bản chất dòng.
- **Môi trường:** staging rc.3, `qa.fd` và `qa.mgr`, OTM-00294 (trả 27/10 06:01, còn trong 24 giờ).
- **Thực tế:**
  - Khung đơn **Đã trả phòng** chỉ có **Folio & điều chỉnh**, **Xem Phiếu thanh toán** (+ **Thu công nợ** / **Xóa công nợ** khi còn nợ).
  - Không có **Thêm phát sinh**: `ReservationDrawer.tsx` chỉ hiện nút khi `r.status === 'in_house'`.
  - Máy chủ có cửa sổ ghi dòng sau trả phòng (`folio-lines.service.ts`, BR-427 (c), `post_checkout_window_until`).
- **Mong đợi:** lễ tân trở lên thấy **Thêm phát sinh** (kèm ảnh) trên đơn đã trả phòng trong cửa sổ BR-427 (c).
- **Vai:** FE-A.
- **Trạng thái:** Open.

### BUG-R3-023 – Hộp Đổi phòng đưa căn chưa dọn vào danh sách

- **Mức:** P2. Lễ tân có thể chuyển khách đang ở sang căn bẩn, trong khi giao diện ghi "Chỉ hiện căn 'Sẵn sàng' hoặc 'Trống, sạch' và không bị khóa".
- **Môi trường:** staging rc.3, `qa.fd`, OTM-00359 (Đang ở, 201), 27/10 ~10:16. Căn 401 lúc đó **VD · Trống, cần dọn** (màn Buồng phòng).
- **Bước tái hiện:** khung đơn → **Đổi phòng**.
- **Thực tế:**
  - Danh sách "CĂN MỚI (ĐÃ DỌN HOẶC ĐÃ KIỂM)" có "401 · N · Nâng hạng – cần lễ tân trưởng xác nhận".
  - Nhãn nhóm hiện mã nội bộ "L12", "N", "NPLUS" thay vì tên nhóm ("Lầu 1–2", "Căn N", "Căn N+").
  - QA không bấm lưu, nên chưa biết máy chủ có chặn không.
- **Mong đợi:** chỉ VC/VI không khóa; nhãn nhóm bằng tên hiển thị.
- **Vai:** FE-A (lọc + nhãn) / BE-A (nếu danh sách từ API).
- **Trạng thái:** Open.

### BUG-R3-024 – Trang Trả phòng mở được trước ngày đi, báo lỗi sai

- **Mức:** P3. Nút trên khung đơn đã ẩn. Chỉ gặp khi mở bằng URL/lịch sử trình duyệt.
- **Môi trường:** staging rc.3, `qa.fd`, OTM-00359 (đi 29/10), 27/10 10:22–10:25.
- **Bước tái hiện:** mở `/reservations/{id}/check-out` → Không dùng gì → Tiếp tục: Phụ phí → giờ 08:30 → Tiếp tục: Bill → **Đã thu … – hoàn tất** → xác nhận.
- **Thực tế:**
  - Cả 3 bước chạy. Mỗi lần qua bước 1, Desk ghi thêm một `POST …/minibar-checks` 201 (4 bản ghi trong lượt thử).
  - Bước 2: giờ 08:30 (sớm hơn giờ bấm) không đòi ghi chú (BR-414).
  - Hoàn tất → `check-out` 409 `INVALID_TRANSITION` "check-out on the departure business day (early departure first – B16)".
  - Desk báo "Đơn vừa chuyển sang 'Đang ở' nên thao tác này không còn dùng được" (sai – đơn vẫn Đang ở từ trước). Công tắc hóa đơn công ty tắt lại dù đã lưu.
- **Mong đợi:**
  - Trang Trả phòng chặn ngay khi chưa tới ngày đi, với câu đúng (v1.0.1 có nút Trả phòng sớm).
  - Không ghi `minibar-checks` thừa.
- **Vai:** FE-A.
- **Trạng thái:** Open.

### BUG-R3-025 – Hộp "Xác nhận cọc" không có ô mã giao dịch

- **Mức:** P3. Đối soát khó hơn. Nhiều đơn chuyển gộp không ghi được mã chung (sổ tay 2.5a).
- **Thực tế:**
  - Hộp **Xác nhận cọc · OTM-00361** chỉ có Số tiền đã nhận, Cách thanh toán, Tạo mã VietQR mới.
  - Chọn "Chuyển khoản" cũng không hiện ô **Mã giao dịch / ghi chú**. Form Đặt phòng mới và Thu công nợ thì có ô này.
  - Tab Chờ đối soát, cột Mã giao dịch toàn "—".
- **Mong đợi:** có ô Mã giao dịch / ghi chú (không ghi số thẻ) khi cách thanh toán là chuyển khoản/thẻ.
- **Vai:** FE-A (+ UXD).
- **Trạng thái:** Open.

### BUG-R3-026 – App nhân viên thiếu 2 loại sự cố

- **Mức:** P3.
- **Thực tế:** **Báo sự cố** trên app nhân viên chỉ có Mất nước nóng, Điện / đèn, Rò nước, Khóa cửa, Đồ hỏng, Khác. Desk (**Phiếu sửa mới**) và sổ tay 3.9 có thêm **Tắc thoát nước**, **Wi-Fi**.
- **Mong đợi:** cùng danh mục trên hai nơi.
- **Vai:** MOB.
- **Trạng thái:** Open.

### BUG-R3-027 – Trang khách mất lựa chọn "Bổ sung tại quầy" khi mở lại link

- **Mức:** P3. Khách bị kẹt, không có thông báo. Khách phải tự quay lại bước Giấy tờ chọn lại.
- **Môi trường:** staging rc.3, trang khách 390×844, OTM-00359.
- **Bước tái hiện:**
  1. Làm thủ tục trước: khách 1 chụp giấy tờ, khách 2 chọn **Bổ sung tại quầy**, chọn giờ đến. Đóng trình duyệt trước khi Gửi.
  2. Mở lại link → **Làm thủ tục trước**. App vào thẳng bước Xác nhận. Chọn đồng ý/không → **Gửi thủ tục**.
- **Thực tế:** `POST /v1/guest/online-checkin/complete` 409 `{"currentState":"documents"}`. App quay về bước Giấy tờ, khách 2 lại "chưa có giấy tờ", không có câu báo.
  - Lựa chọn bổ sung tại quầy chỉ nằm trong bộ nhớ trang, gửi ở `complete` (`deferredPeople`). Máy chủ không lưu lựa chọn giữa chừng.
- **Mong đợi:** lưu lựa chọn bổ sung tại quầy cùng bản nháp, hoặc mở lại đúng bước Giấy tờ và báo lý do.
- **Vai:** FE (guest-web) (+ BE nếu lưu ở máy chủ).
- **Trạng thái:** Open.

### BUG-R3-028 – Chữ trên giao diện chưa đúng

- **Mức:** P3 (UX writing).
- **Thực tế:**
  - (a) Chữ nội bộ lộ cho nhân viên:
    - "Hóa đơn điện tử phát hành từ Round 3; R2 lưu thông tin để kế toán xuất." (bước 3 trả phòng);
    - "Mã cửa – nhập tay trên app khóa (R2)", "OTTIMO không lưu mã cửa ở R2" (nhận phòng, khung đơn);
    - "lập báo giá dài hạn (R3). Ở R2 tạo 'đơn dài hạn nhập tay'" (hộp Gia hạn).
  - (b) Hộp Người ở → Thêm người đi cùng: ô chọn người ghi "Khách đứng tên".
  - (c) Hộp Xác nhận giờ trả: ô giờ ghi "Giờ trả phòng thực tế" (giờ khách hẹn).
  - (d) Chữ phụ ô Căn ở Đặt phòng mới: "chỉ hiện căn đang bán và còn trống trong khoảng ngày", nhưng danh sách luôn đủ 10 căn.
  - (e) Báo giá: hộp ghi "Hết hiệu lực 31/10/2026 00:00", tin gửi khách ghi "hiệu lực đến 23:59 30/10/2026".
  - (f) Danh sách Đơn của tôi (sale): "Bấm Đặt phòng mới để tạo đơn" – sale không có nút này.
  - (g) Hộp Báo đã chuyển cọc: số tiền không định dạng (600000).
- **Vai:** UXD + FE-A.
- **Trạng thái:** Open.

### BUG-R3-029 – App nhân viên: thông báo mâu thuẫn khi OWN/MGR đăng nhập

- **Mức:** P3.
- **Thực tế:** đăng nhập `qa.mgr`, màn hiện "Nhập mã trong ứng dụng xác thực để hoàn tất đăng nhập." và ngay dưới "Đăng nhập 2 bước sẽ có ở bản sau. Nhờ chủ đầu tư hỗ trợ đăng nhập." Không có ô nhập mã.
- **Mong đợi:** chỉ một câu: "Tài khoản chủ đầu tư/quản lý chưa đăng nhập được app nhân viên ở bản này. Dùng Desk."
- **Vai:** UXD + MOB.
- **Trạng thái:** Open.

### BUG-R3-030 – Folio ở màn Trả phòng hiện số âm cho dòng miễn bị từ chối

- **Mức:** P3. Lễ tân/khách có thể hiểu nhầm là đã được giảm.
- **Thực tế:**
  - OTM-00359: FOC 210.000 cho phụ thu nhận sớm bị quản lý từ chối.
  - Màn Trả phòng (cả 3 bước) vẫn có dòng "Miễn phí · Phòng sẵn sàng, không ảnh hưởng khách sau · **Bị từ chối** · −210.000".
  - Tổng và Còn phải thu đúng (không trừ).
- **Mong đợi:** ẩn dòng bị từ chối, hoặc hiện số gạch ngang / "0" kèm chip "Bị từ chối".
- **Vai:** FE-A.
- **Trạng thái:** Open.

### BUG-R3-031 – "Hoàn tác nhận phòng" bấm được nhưng máy chủ từ chối

- **Mức:** P3.
- **Thực tế:**
  - `qa.mgr`, OTM-00359 (nhận phòng hôm nay, folio đã có phụ thu nhận sớm và khoản thu).
  - Hộp **Hoàn tác nhận phòng căn 201 – …?** ghi "Chỉ làm được trong ngày và khi folio chưa có dòng mới", nhưng vẫn cho bấm.
  - Máy chủ trả 409 "reverse the lines posted since check-in first".
- **Mong đợi:** ẩn/khóa nút khi folio có dòng sau nhận phòng, nói rõ phải đảo các dòng nào trước. Hoặc cho phép hoàn tác cùng lúc đảo phụ thu nhận sớm và khoản thu ghi lúc nhận phòng.
- **Vai:** FE-A (+ BE-B nếu chọn cách đảo cùng lúc).
- **Trạng thái:** Open.

### BUG-R3-032 – Thư "Security notice" không có người nhận (SEC Q51-6, 06.15)

- **Mức:** P1. Một kiểm soát bảo mật mức B không chạy trên production: kênh báo ngoài app khi đổi tài khoản nhận tiền hoặc khi có thao tác 2 bước bất thường. Không lên P0 vì các lớp phòng ngừa vẫn đủ: chỉ OWN, S2, hiệu lực từ hôm sau, cảnh báo 24 giờ trên QR, thông báo trong app. Biện pháp bù hằng ngày ở `reviews/SEC-on-B2-readiness.md` mục 1.3.
- **Nguồn:** OPS kiểm sẵn sàng B2, `outputs/OPS/v1-production.md` mục 21.4. Staging 27/10 (chỉ đếm): 0/27 người dùng có email; `receiving_account_changed` `dead NO_RECIPIENT` ×3, `mfa_reset_by_operator` ×1.
- **Nguyên nhân:**
  - `jobs/email-dispatch.ts` chỉ gửi tới `app_user.email` khác rỗng;
  - `production-bootstrap` không nhận email;
  - `users.controller.ts` và Desk không có trường email.
  - Thư đã `dead` không gửi lại.
- **Mong đợi (v1.0.1):** theo `SEC-on-B2-readiness.md` mục 1.5.
  - Trường email cho người dùng. Đặt/đổi bắt buộc S2. MGR không đổi được email của OWN.
  - Audit `security` (email che); thư `email_changed` tới cả địa chỉ cũ và mới.
  - Bootstrap `--owner-email` qua dấu nhắc ẩn (tùy chọn).
  - `ops-check` đếm `dead NO_RECIPIENT`.
- **Không làm:** vá tạm bằng SQL tay trên production (SEC từ chối).
- **Kiểm lại:**
  - QA trên staging: OWN có email → đổi tài khoản nhận → thư tới; đổi email không S2 → 401; MGR đổi email OWN → 403.
  - Production: INV xác nhận nhận được thư.
- **Trạng thái:** Open.

### BUG-R3-033 – Trả phòng xong, khung Folio vẫn báo "Còn phải thu"

- **Mức:** P2. Số tiền hiện sai ngay trên màn lễ tân nhìn khi khách đứng ở quầy. Lễ tân có thể thu lần hai. Dữ liệu trên máy chủ đúng.
- **Môi trường:** staging `v1.0.0-rc.3` (`70fe734`), Desk Chromium 1366×768, `qa.fd`, 28/10 00:15. Cũng có ở nhánh ESC-031 `67fc853` ngày 26/10: ảnh `rounds/round-03/outputs/FE/esc031-shots/05-tra-phong-xong.png`, lúc đó QA bỏ sót.
- **Các bước:**
  1. Đơn đang ở, quá 18:00 ngày đi, đêm đó căn đã có khách đến (OTM-00357).
  2. Trả phòng → Bill & thu tiền: ghi phụ thu – quản lý xem lại, chọn Tiền mặt, Ghi nhận 792.000.
  3. Hoàn tất → xác nhận.
- **Thực tế:**
  - B18 trả 200, màn hiện "Đã trả phòng. Bill đã lưu. Phiếu F26-000004".
  - Khung FOLIO bên phải vẫn là số trước khi trả: "Phụ thu trả muộn bằng giá 1 đêm (dự tính) 792.000 · Đã thu −792.000 · **Còn phải thu 792.000 đ**".
  - `GET folio` cùng lúc: `settled`, đã thu 1.584.000, còn 0.
- **Mong đợi:** sau 200, tải lại folio (hoặc dùng folio trong phản hồi). Khung hiện dòng phụ thu đã ghi (bỏ chữ "dự tính"), "Đã thu −1.584.000", "Còn phải thu 0 đ".
- **Bằng chứng:** scratchpad `qa-r6/esc031n/screens/n07-tra-phong-xong.png`, `run-log.md` ("màn sau khi xong", "sau B18 folio").
- **Chưa kiểm:** có xảy ra với trả phòng thường trả bằng `finalPayment` (không có phụ thu bằng 1 đêm) hay không.
- **Vai:** FE-A.
- **Trạng thái:** Open.

### BUG-R3-034 – "Tiền dư đơn đã đóng" còn sau khi đã chi hoàn đủ (đơn đã trả phòng)

- **Mức:** P3. Báo động giả trong "Cần chú ý" của OWN, MGR, FD. Kéo dài tới khi J15 đóng folio, tối đa `post_checkout_charge_hours` (24 giờ) cộng một nhịp job. Không đóng tay được.
- **Môi trường:** staging rc.3, 28/10 00:16–00:20, OTM-00357.
- **Các bước:**
  1. Trả phòng xong (folio `settled`).
  2. MGR A32 giảm dòng phụ thu → dư 396.000, tự sinh yêu cầu hoàn và mục `closed_reservation_credit`.
  3. OWN duyệt; FD chi tiền mặt đủ 396.000 → dư 0.
- **Thực tế:**
  - Mục `closed_reservation_credit` vẫn mở cho OWN, MGR, FD.
  - MGR `resolve` → 409 `INVALID_TRANSITION`: mục thuộc loại hệ thống tự đóng.
  - Mã `refunds.service.ts` chỉ tự đóng mục khi đơn `cancelled`/`no_show`. Với đơn `checked_out`, chỉ J15 đóng mục, lúc đóng folio sau khung giờ phát sinh.
- **Mong đợi:** chi hoàn xong mà dư về 0 thì tự đóng mục, với mọi trạng thái đơn (gồm `checked_out`), như đã làm cho `cancelled`/`no_show`.
- **Ảnh hưởng ngay:** staging còn mục này cho OTM-00357 tới sau 29/10 00:15 (`qa3-rc1.md` 16.5).
- **Vai:** BE-B.
- **Trạng thái:** Open.

### BUG-R3-035 – Phiếu ghi "Phụ thu trả muộn (00:15)" cho khoản phụ thu bằng 1 đêm

- **Mức:** P3 (chữ trên phiếu khách cầm).
- **Môi trường:** staging rc.3, phiếu F26-000004 (`GET folios/{id}/bill`).
- **Thực tế:**
  - Dòng `chargeCode` `late_fee_as_night` có `labelKey` `bill.line.late_checkout`, `labelParams` {time "00:15", pct 100}, `serviceDate` 27/10. Theo `design/copy/strings-vi.json`, dòng này hiện "Phụ thu trả muộn (00:15)"; bản tiếng Anh là "Late check-out fee (00:15)".
  - Trên Desk, cùng khoản đó lại ghi "Phụ thu trả muộn bằng giá 1 đêm".
  - Khách rời 00:15 rạng sáng 28/10, nhưng phiếu ghi ngày dịch vụ 27/10 với giờ 00:15, dễ đọc là sáng 27/10.
- **Mong đợi:**
  - Khóa nhãn riêng, ví dụ `bill.line.late_fee_as_night`: "Phụ thu trả muộn bằng giá 1 đêm" / "Late check-out (one night's rate)".
  - Giờ sau nửa đêm ghi kèm ngày ("00:15 28/10"), hoặc bỏ giờ.
- **Chưa kiểm:** ảnh phiếu in. QA kết luận từ `GET bill` và bảng chuỗi.
- **Vai:** BE-B (`line-labels.ts`) + UXD (chữ).
- **Trạng thái:** Open.

