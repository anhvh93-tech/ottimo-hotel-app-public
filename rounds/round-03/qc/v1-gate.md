# Cổng v1.0 – Kết quả chấm (QC)

- Người chấm: QC | 30/10/2026, 08:10–09:30 giờ VN | Round 3 – Bước **QC (cổng v1.0)**. INV yêu cầu chạy QC ngay (30/10). Ngày D vận hành thật: **thứ Hai 02/11/2026**.
- Đọc lại theo ma trận: ORC (bắt buộc), PO (khuyến nghị).
- **Bản chấm: `v1.0.0-rc.6` = commit `8b3aec8`** (`8b3aec89486f0f01…`, merge PR #14 sửa worker audit registry). Image `sha-8b3aec89486f` chạy trên staging từ 18:58 29/10 và trên production từ 07:51 30/10 (release run `40903554902`). Đây cũng là commit ORC định gắn tag `v1.0.0`.
- Căn cứ: bảng kiểm `qc/v1-gate-checklist.md` (26/10, mục 6 = quy tắc chấm); `release-v1-plan.md` mục 3 (5 điều kiện của INV); decision-log 26–30/10; `qa/bug-list.md` (41 lỗi); `qa/qa3-rc1.md` mục 15–19; `outputs/OPS/b2-runbook.md` mục 4–5; `outputs/OPS/j15-folio-close-check.md` mục 11–14; `outputs/OPS/v1-production.md`; `reviews/SEC-G7-5-production.md`; `reviews/SEC-on-B2-readiness.md`; `reviews/SEC-sprint1.md` 3, 5.2; `reviews/ARC-on-BE-B-worker-audit-fix.md`; `inv-golive-checklist.md`; `product/docs/uat-script.md`, `release-notes.md`, `staff-one-pager.md`, `manual/`.
- Cách QC kiểm (như 26/10): đọc tệp và git; `gh run list/view -R anhvh93-tech/ottimo-hotel-app-public`; `curl` mã trạng thái trang công khai; so tập trường audit allowlist giữa `70fe734` và `8b3aec8`; đọc dòng kết quả của biên bản diễn tập khôi phục trên Mac INV (chỉ số đếm). QC **không** SSH, không đăng nhập staging/production, không deploy, không gắn tag.
- Repo công khai: tệp này không ghi IP, bí mật, số tài khoản, dữ liệu khách hay thủ tục khôi phục.

---

## 1. Quyết định

### **ĐẠT CÓ ĐIỀU KIỆN**

**Lý do (1 câu):** rc.6 đạt đủ nội dung 5 điều kiện của INV bằng bằng chứng QC tự kiểm lại (tiền, 2FA, SEC, production tách biệt có sao lưu và diễn tập khôi phục, CI xanh, smoke production, J1/J15/J24 đúng trên staging), nhưng còn **một lỗi P1 mở (BUG-R3-032)** trái chữ "0 P0/P1 mở" của điều kiện 5 mà chỉ INV được chấp nhận, và còn **hai bằng chứng ngắn** của SEC và OPS trên chính commit rc.6.

Quyết định tách hai phạm vi:

| Phạm vi | Kết quả | Khi nào được làm |
|---|---|---|
| **A. Gắn tag `v1.0.0` lên `8b3aec8`** | ĐẠT CÓ ĐIỀU KIỆN | Chỉ sau khi xong **T1, T2, T3** (mục 4.1). ORC **không** gắn tag trước. Không cần deploy lại |
| **B. Chạy ngày D 02/11 với dữ liệu khách thật** | ĐẠT CÓ ĐIỀU KIỆN | Chỉ khi xong mọi dòng "Chặn D" ở mục 4.2 và 4.3, chậm nhất tối **01/11** |

Không phải KHÔNG ĐẠT vì: 0 P0 mở; không lỗi bảo mật nghiêm trọng mở (BUG-R3-032 là thiếu một kênh báo, SEC đã chấp nhận có biện pháp bù); không sai tiền mở; mọi điều kiện còn lại là việc làm được trong 1–2 ngày, không cần sửa mã.

Không phải ĐẠT vì: luật plan mục 3 và QC mục 6.5 – còn P1 mở thì không ĐẠT; QC không có quyền miễn điều kiện của INV (skill QC: "đội muốn phát hành dù QC đánh trượt – chủ đầu tư quyết"). Đã lập **ESC-040**.

Quy tắc QC mục 6.1 ("ĐK1–3 chỉ ĐẠT hoặc KHÔNG ĐẠT") vẫn giữ: ĐK1 ĐẠT; ĐK2, ĐK3 **không hạ nội dung**. Thiếu duy nhất là dòng xác nhận của SEC trên `8b3aec8` (T1) – bằng chứng đã có trên CI và QC đã tự đối chiếu (mục 2). Tới khi có T1, ĐK2–3 ở trạng thái "chờ bằng chứng", không phải "đạt một phần".

---

## 2. Bảng kiểm theo 5 điều kiện của INV

### ĐK1 – Lượt kiểm tiền R3 xong → **ĐẠT**

| # | Hạng mục | KQ | Bằng chứng QC kiểm lại 30/10 |
|---|---|---|---|
| G1-1…G1-5 | Bước 1–4 gộp, `pendingFix` gỡ, fuzz 0 vi phạm, BUG-R3-001…014 đóng, đóng băng | Đạt | Giữ kết quả 26/10 (`v1-gate-checklist.md` mục 2) |
| G1-6 | BUG-R2-208/209/210 Closed | Đạt | Decision-log 26/10 dòng QA-3 phần 1 (33/33 `s438-r8` + 13/13 `debt-collect.s5`) |
| G1-7 (mới) | Mã chạm tiền từ `70fe734` (rc.3) tới `8b3aec8` có ngoại lệ đóng băng | Đạt | `git diff 70fe734 8b3aec8 -- product/services/api/src`: 53 tệp, toàn bộ là đăng ký audit allowlist + nối worker (`folio/public/refund-routing.ts`, `payments/internal/refund-decision-hooks.ts` là **tách hàm nối có sẵn**, không đổi công thức). Ngoại lệ: decision-log 28/10 "ORC – BUG-R3-037 sửa trong v1.0.0", 29/10 "QA – mở lại 037, ghi 038", INV đồng ý PR #14. ESC-031 (rc.1→rc.3) có ngoại lệ 26/10 |
| G1-8 (mới) | Tiền đúng sau sửa worker | Đạt | Staging rc.6: J15 đóng 5/5 folio, 5 audit, OTM-00297 không thêm công nợ; J24 2/2 payment `expired`; J1 hủy hold không cọc, giữ hold có cọc, cọc sau hạn bị 409 không ghi tiền (`j15-folio-close-check.md` 12.1; `qa3-rc1.md` 19.6–19.7) |

### ĐK2 – 2FA owner/manager, `MFA_ENFORCED=true` trên production → **Nội dung đạt; chờ T1 (dòng SEC)**

| # | Hạng mục | KQ | Bằng chứng |
|---|---|---|---|
| G2-1 | US-143 AC1–AC4 + CỔNG S2, 3 Major SEC đóng | Đạt | Giữ 26/10 |
| G2-2 | Ca A.7 đủ 16 (ca 16 đồng hồ giả) | **Có bằng chứng, chưa có dòng SEC** | Tệp `product/tests/e2e/ui-clock/mfa-us143-clock.r3s1.spec.ts` có trên `8b3aec8` (commit `5c2f5b6`). `ci.yml` dòng 544–548 **làm đỏ CI** nếu báo cáo junit không có ca `ui-clock/`. CI push `40865799549` trên `8b3aec8` xanh toàn bộ; T9 hằng đêm `40944110781` (code giống hệt `8b3aec8`) xanh. Ca 14 dời v1.1 – SEC ghi 26/10. `SEC-sprint1.md` dòng 267 vẫn ghi "Đang làm… SEC đọc khi commit và CI xanh" → **T1** |
| G2-3 | Staging cờ bật | Đạt | Giữ 26/10 |
| G2-4, G2-5 | OWN đăng ký 2FA trên staging; diễn tập 06.33 có người chứng kiến thật | Đạt | Decision-log 26/10 "B1 phần 1–2 đạt" (`MFA-DRILL-20261026`) |
| G2-6 | Production `MFA_ENFORCED=true` | Đạt | `b2-runbook.md` mục 5 #2 (`printenv` api/worker). SEC-G2 ý 2: mọi đăng nhập production đi qua 401 → `login/mfa` 200; 0 phiên đầy đủ không qua 2 bước |
| G2-7 | INV + mọi manager đăng ký 2FA trên production | **Chủ: Đạt. Quản lý: chưa – chặn D** | OPS 16:58 29/10 và SEC 17:05 29/10: tài khoản giữ 6 vai (gồm `manager`) chưa đăng nhập lần nào, còn mật khẩu tạm, chưa 2 bước. Vì cờ bật từ DB trống (QC-G3, decision-log 26/10), tài khoản này **không làm được gì** ngoài đổi mật khẩu và đăng ký 2 bước, nên mục tiêu của ĐK2 (không quản lý nào thao tác mà không có 2FA) đang đúng. Rủi ro còn lại: mật khẩu tạm không hết hạn – ai biết mật khẩu tạm có thể tự gắn 2 bước của mình. → **D-INV-2** |

### ĐK3 – SEC Verified BE-65, 74, 75, 79, 83, 84 (a) → **Nội dung đạt; chờ T1**

| # | Hạng mục | KQ | Bằng chứng |
|---|---|---|---|
| G3-1 | 6 thẻ Verified, 0 Critical/High mở | Đạt | `SEC-sprint1.md` mục 1 (`880ea19`); xác nhận lại RC `2963675` (decision-log 26/10 SEC) |
| G3-2 | Kiểm lại trên commit RC | **Chờ T1** | SEC kiểm lại tới `70fe734` (`SEC-G7-5-production.md` mục 2: "không đổi dòng nào" ở registration, identity, crypto, files, audit). **Từ `70fe734` tới `8b3aec8` các thư mục này có đổi**: `identity/public/mfa-store.ts`, `password-reauth.ts`, `registration/*`, `files/*`, `audit/public/audit-fields.ts` – chuyển `defineAuditEntity` sang tệp `audit-entities.ts` từng module. QC tự so: tập trường allowlist (thực thể.trường) trên `70fe734` và `8b3aec8` **giống hệt, 243/243**, không trường nào mới được ghi vào audit. Theo quy tắc QC 6.2 (diff chạm `services` → SEC chạy lại tệp liên quan, B.0 (7)), SEC phải ghi xác nhận → **T1** |

### ĐK4 – Production tách staging → **ĐẠT**

| # | Hạng mục | KQ | Bằng chứng |
|---|---|---|---|
| G4-1 | App production chạy | Đạt | Release `40903554902`: "resolve release" và "deploy production" success (00:51:46Z 30/10). QC `curl` 08:19: `ottimo.vn`, `desk`, `staff`, `g` 200; `desk/health` 404; `desk/v1/me` 401 |
| G4-2 | CSDL, bí mật, tên miền, khóa riêng | Đạt | Giữ 26/10 |
| G4-3 | Kiểm khởi động production | Đạt | `printenv` 4 biến (`APP_ENV=production`, `MFA_ENFORCED=true`, `CLOCK_MODE=system`, `INCLUDE_TEST_SUPPORT=0`) – `b2-runbook.md` mục 5 #2; deploy rc.6 qua bước `config` → `smoke` ok |
| G4-4 | SEC rà cấu hình production + OPS-01… | Đạt | Decision-log 26/10 SEC (OPS-01/02/03/05, BOOT-01/02 Verified); `SEC-G7-5-production.md` phần hạ tầng (edge = `main`, chỉ 22/80/443, `ufw`, `sshd -T`, vai DB) |
| G4-5 | Sao lưu hằng ngày + bản kéo ra ngoài | Đạt | `ops-check` 7/7 (backup 4 giờ trước) – `j15-folio-close-check.md` 14.1; kéo về Mac 29/10, `shasum` khớp – `b2-runbook.md` mục 5 Phần 5 |
| G4-6 | Khóa giải mã INV giữ ngoại tuyến | Đạt | `KHOP` trong Passwords, bản giấy A8 phong bì riêng, tệp khóa đã xóa khỏi Mac (decision-log 29/10 "B2 kết thúc") |
| G4-7 | Một lần diễn tập khôi phục bản production, có biên bản | **Đạt** (biên bản chưa vào repo) | QC đọc dòng kết quả tệp biên bản trên Mac INV (chỉ số đếm): bản `20261029T033257Z`, image `sha-70fe734e9077`, "ĐẠT – /health ok", 5 giây, đếm bảng khớp 100 %. `v1-production.md` **chưa có mục 22**, README `infra/server` mục 12 chưa ghi ngày → **D-T3** (thủ tục) |
| G4-8 | KEK có bản ngoại tuyến trước dữ liệu thật | Đạt | B2 phần 2 Đạt (decision-log 29/10) |
| G4-9 | Thư thử tới hộp thư INV | Đạt | INV xác nhận có thư, không vào Spam (`b2-runbook.md` mục 5 Phần 6) |
| G4-10 | Báo động A7 (ESC-029 A) | **Chưa – chặn D** | `v1-production.md` dòng 714, 768: `HEARTBEAT_URL`, `ALERT_WEBHOOK_URL` rỗng; UptimeRobot chưa có xác nhận. Quy tắc QC 6.3: không chặn deploy/tag, chặn ngày chạy với dữ liệu thật → **D-INV-4 + D-T5** |
| G4-11 | RAM/đĩa khi hai stack chạy | Đạt | Sau rc.6: RAM khả dụng 3,8 GB (77 %), đĩa 17 % (`j15-folio-close-check.md` 14.1) |
| G4-12 | Bản chụp của Nhân Hòa (A5) | Không rõ – không chặn | Chưa có xác nhận của INV. Rủi ro dữ liệu khách nằm ngoài kiểm soát của OTTIMO (mục 6) |

### ĐK5 – QC cổng v1.0 rút gọn → **Chưa ĐẠT theo chữ, chỉ vì BUG-R3-032 (P1) → T2 / ESC-040**

| # | Hạng mục | KQ | Bằng chứng |
|---|---|---|---|
| G5-1 | QC chấm ĐK1–4 | Đạt | Tệp này |
| G5-2 | A1 đạt trên staging | Đạt | A1 12/12 (R2, 22–25/10); hồi quy A1 trên `rc.1` ở QA-3 (`qa3-rc1.md`); UAT INV 8/8 việc 2–9 (decision-log 26/10) |
| G5-3 | **0 P0/P1 mở** | **Không đạt theo chữ** | `bug-list.md` mục 1 (cập nhật 30/10 08:10): P0 0 mở; **P1 1 mở = BUG-R3-032** (thư "Security notice" không có người nhận). BUG-R3-037/038/039 Closed 30/10 trên rc.6 – QC đối chiếu bằng chứng ở G1-8. Không còn P1 nào khác. SEC chấp nhận chạy D với biện pháp bù B1–B6, sửa bắt buộc ở v1.0.1, hạn 09/11 (`SEC-on-B2-readiness.md` mục 1). **INV chưa có dòng chấp nhận P1 mở này trong decision-log** → ESC-040 |
| G5-4 | CI xanh trên commit phát hành | Đạt | Push `40865799549` trên `8b3aec8`: 10 job đạt (gồm `docker images build · E2E smoke`, `gitleaks`, `no test endpoints in production contract`), `deploy staging` success. PR `40861720879` trên `a753201` xanh, `git diff a753201 8b3aec8 -- product` rỗng. T9 hằng đêm `40944110781` (19:53Z 29/10) trên `0b08b9e`, `git diff 8b3aec8 0b08b9e -- product` rỗng → T9 xanh trên đúng mã rc.6. Lượt CI đang chạy `40983717603` trên `1517da5` chỉ đổi tài liệu |
| G5-5 | Smoke production sau deploy | Đạt | Không đăng nhập: QA 18.1 (7 đạt, 0 lỗi + C-1…C-6) trên rc.3; sau rc.6: OPS 14.1 (image, 5 nhịp worker 0 lỗi, log api 0 lỗi, `/health` ok, 4 host 200, 401/404 đúng, `ops-check` 7/7) + QC `curl` 08:19. Có đăng nhập: INV đăng nhập có 2 bước, Desk hiện 10 căn (29/10). **Đăng xuất (SEC-G2 1b) chưa từng chạy → D-INV-1** |
| G5-6 | QA-3 hồi quy rút gọn | Đạt | `qa3-rc1.md` mục 1–19 (rc.1 → rc.6) |
| G5-7 | P3 có đích phát hành | Đạt | Decision-log 26/10 PO (backlog mục 5.6). P3 mới 034–036, 040 có đích v1.0.1 hoặc "ghi nhận" trong `bug-list.md` |

---

## 3. Bắt buộc thêm, tài liệu, SEC/US-155, mang sang R2

| # | Hạng mục | KQ | Bằng chứng / việc còn lại |
|---|---|---|---|
| G6-1 | R3-Q51 tài khoản nhận VietQR chạy thật | Đạt phần mã. **Xác nhận cuối = C1 của INV – chặn D** | B2 phần 3: 1 dòng `payment_receiving_account`, hiệu lực 30/10. Tên chủ tài khoản trên QR chỉ INV kiểm được bằng app ngân hàng → **D-INV-3** |
| G6-2 | US-008 thêm người dùng | Đạt | B2 phần 4: INV tạo tài khoản trên Desk production (OPS kiểm vai) |
| G6-3 | R3-Q15 | Đạt | Giữ 26/10 |
| G6-4 | Release notes v1.0.0 có "Giới hạn đã biết" đầy đủ | **Không đạt – chặn D** | `product/docs/release-notes.md` còn ghi "NHÁP – `v1.0.0-rc.3`… cập nhật PO 27/10". Thiếu thay đổi rc.4 → rc.6 (BUG-R3-019…023, 033, 037–039). Thiếu giới hạn BUG-R3-032, BUG-R3-041, trả phòng sớm dời v1.0.1, ô Wi-Fi Desk dời v1.0.1. **Dòng 93 sai sự thật**: "thông báo bảo mật… gửi từ `info@ottimo.vn` tới chủ đầu tư" – thực tế thư không có người nhận (BUG-R3-032) và SEC cấm dùng `info@` cho thư bảo mật → **D-T1** |
| G6-5 | Hướng dẫn chuyển đổi ngày đầu | Đạt | `product/docs/day-one-guide.md` |
| G6-6 | Hướng dẫn 1 trang + sổ tay | **Có, nhưng lỗi thời so với rc.6 – chặn D** | `staff-one-pager.md` dòng 43 còn "**In phiếu** đang lỗi" (đã sửa ở rc.4, BUG-R3-020 Closed). Sổ tay `user-manual-v1.0.md` bản 1.2 (27/10) dòng 679 còn "Tạo đơn dài hạn hiện chưa tạo được đơn" (BUG-R3-019 Closed ở rc.4). Chưa có cách tạm của **BUG-R3-041** (rà hold "0h00" đỏ đầu mỗi ca) ở cả hai tệp (`grep "0h00"`: 0 kết quả). Chưa có câu thông báo hạn lưu cho khách tại quầy (SEC 5.2: DOM thêm vào tờ ở quầy; `grep "3 tháng"`: 0). Bản HTML `manual/ottimo-manual-v1.0.html` dựng 27/10 11:13, **trước** ảnh C2-13 (28/10 01:15), chưa commit. 3 ảnh C1-15, C2-34 (chờ QA ca tối), C2-13 (ORC báo chưa cập nhật) → **D-T1, D-T2** |
| G6-7 | Giá trị khởi tạo + hạn lưu | Đạt | INV trả lời 8 câu 26/10; B2 phần 3 nhập giá 10/10 căn; SEC-G1 đọc tham số lưu giữ trên production (30 ngày / 7 ngày / 3 tháng) |
| G6-8 | Backlog cột Phát hành | Đạt | Decision-log 26/10 PO |
| G7-1 | US-155 trong RC, form tắt | Đạt | ESC-030 = A (26/10): form tắt tới khi luật sư trả lời. Cổng không xét form (quy tắc 6.4) |
| G7-3, G7-4 | Tài khoản nhận thử staging; tài khoản chủ dùng thử cho INV | Đạt | Decision-log 26/10 (xóa dòng tài khoản thật trên staging; `inv.owner`) |
| G7-5 | SEC-G1/G2 trên production | Đạt có điều kiện | `SEC-G7-5-production.md`: G1 Đạt; G2 5/6, còn **L-1 đăng xuất** (D-INV-1). Kiểm trên rc.3; phần chênh rc.3 → rc.6 thuộc **T1** |
| G7-6 | INV tự nhập tài khoản nhận thật | Đạt phần nhập; xác nhận = C1 | Như G6-1 |
| G7-7 (mới) | Thông báo xử lý dữ liệu `privacy-2026-10-v2` (SEC 5.2, `SEC-G7-5` mục 6) | **Chưa – chặn D cho check-in online** | `git grep` trên `8b3aec8`: `NOTICE_TEXT_VERSIONS = ['privacy-2026-10-v1']`, không có `privacy-2026-10-v2`. Việc này **cần sửa mã** (`design/copy` + `guest-web/src/app/config.ts`), nên không thể có trong image rc.6. SEC: "trước khách thật đầu tiên dùng check-in online" → **D-T4** |
| G8-1 | Chấm lại cổng R2 | Đóng tại đây | Lý do duy nhất R2 KHÔNG ĐẠT (21/10) là chưa có staging. Nay: staging chạy từ 22/10 với deploy tự động (`deploy staging` success trên `8b3aec8`); A1 12/12 trên staging; R-2, R-6 xong (bảng kiểm 26/10 G8-1). QC không chấm lại tệp R2 riêng: cổng v1.0 thay thế |
| G8-2 | D4 PWA snapshot | Đạt | `SEC-sprint1.md` 3.4 |
| G8-3 | Dependabot | Đạt | Decision-log 26/10 SEC mục (4) |
| G8-4 | Nhân viên thật trên điện thoại thật | Không chặn | Rủi ro (mục 6) |

### 3.1 Quy trình review

- Không còn thẻ Blocker/Major mở có ảnh hưởng tới rc.6. Hai thẻ Major của ARC (`FB-R3-ARC-BEB-WA-01`, `WA-02`) vẫn ghi "Open" trong `reviews/ARC-on-BE-B-worker-audit-fix.md` dù đã làm xong (OPS 12, 13, 14) và chưa có dòng trả lời trong `responses/` → **D-T6** (thủ tục, không chặn).
- SEC chưa review PR #14 (protocol: SEC là người review khuyến nghị cho BE). QC chấp nhận vì ARC đã duyệt và phần liên quan bảo mật (allowlist audit) QC đã so khớp; dòng xác nhận của SEC nằm trong T1.
- Sổ tay: BA trả lời đủ 37 thẻ (DOM 23, PO 14), 0 Rejected (`responses/BA-on-manual-reviews.md`).

---

## 4. Điều kiện kèm theo

Cột "Chặn tag" = ORC không gắn `v1.0.0` khi dòng này chưa xong. Cột "Chặn D" = không đưa khách thật / dữ liệu thật vào production ngày 02/11 khi dòng này chưa xong.

### 4.1 Chặn gắn tag `v1.0.0` (làm ngay hôm nay 30/10)

| # | Việc | Vai | Hạn | Chặn tag | Chặn D | Xong khi |
|---|---|---|---|---|---|---|
| **T1** | Dòng xác nhận SEC trên `8b3aec8`: (a) đọc diff `70fe734..8b3aec8` phần `identity`, `registration`, `files`, `audit`, `approvals`, `payments` – xác nhận không mở rộng dữ liệu ghi vào audit, không đổi đường xác thực (QC đã so allowlist 243/243 giống nhau); (b) **Verified ca A.7 #16** (`ui-clock/mfa-us143-clock`, CI `40865799549` + T9 `40944110781`); (c) SEC-G1/G2 giữ nguyên trên rc.6 | SEC | 30/10 | **Có** | Có | Một dòng trong decision-log + mục ngắn trong `SEC-G7-5-production.md` |
| **T2** | INV trả lời **ESC-040**: chấp nhận phát hành v1.0.0 khi BUG-R3-032 (P1) còn mở, sửa ở v1.0.1 hạn 09/11, giữ biện pháp bù B1–B6 mỗi sáng | **INV** (ORC trình) | 31/10 | **Có** | Không (D đã chạy theo SEC; xem ESC-040 phương án B) | Dòng INV trong decision-log |
| **T3** | Đọc log worker **staging** rc.6 quanh lượt chạy theo lịch đầu tiên (đa số 03:00–03:30 30/10, `catchUp: always`) của 6 job: `guest.document_profile_anonymize`, `hk.daily`, `lease.nights`, `log.partitions`, `web_request.purge`, `web_request.stale`. Cùng lệnh lọc như mục 12 (bỏ ANSI): 0 `ERROR [`, 0 `job failed`, 0 `AuditEntityNotRegisteredError`. Job nào chưa tới giờ thì ghi giờ chạy kế tiếp | OPS | 30/10 | **Có** | Có | Mục mới trong `j15-folio-close-check.md`. Có lỗi ở job nào → mở lại BUG theo job, QC chấm lại |

Vì sao T3 chặn tag: bốn job audit đã hỏng cùng gốc (037/038/039); sáu job này chưa chạy lần nào trên mã rc.6. Lỗi lộ ra sau khi đã gắn tag thì `v1.0.0` trỏ vào commit hỏng. Staging đã qua 03:00 30/10 trên rc.6, nên đọc được ngay.

### 4.2 Việc của đội – chặn ngày D (xong trước tối 01/11)

| # | Việc | Vai | Hạn | Chặn tag | Chặn D |
|---|---|---|---|---|---|
| **D-T1** | Cập nhật tài liệu phát hành theo rc.6: (1) `release-notes.md` → `v1.0.0` (commit `8b3aec8`), bảng thay đổi rc.3 → rc.6, "Giới hạn đã biết" thêm BUG-R3-032 (cách bù B1–B6, sửa v1.0.1), BUG-R3-041 (cách tạm), FB-R3-ARC-BEB-WA-04 (hold có yêu cầu giảm giá/FOC quá hạn phải hủy tay), trả phòng sớm và ô Wi-Fi Desk ở v1.0.1; **sửa dòng 93** (không còn nói thư bảo mật gửi từ `info@`); (2) `staff-one-pager.md`: bỏ "In phiếu đang lỗi"; thêm "Đầu mỗi ca: mở Rack / Hôm nay, xử lý mọi giữ chỗ có đồng hồ **0h00 đỏ** (gọi khách, gia hạn hoặc hủy theo quyền)"; thêm câu thông báo hạn lưu cho khách tại quầy của SEC 5.2; (3) sổ tay bản 1.3: bỏ khung "Lỗi đang sửa" của BUG-R3-019, 020 theo chú thích BA đã để sẵn, thêm cách tạm BUG-R3-041 | PO (release notes), PO + DOM (one-pager), BA (sổ tay); DOM xác nhận người xử lý hold quá hạn; UXD duyệt chữ hướng khách (brand OTTIMO) | 31/10 trước buổi đào tạo | Không | **Có** |
| **D-T2** | Sổ tay HTML: UXD dựng lại `ottimo-manual-v1.0.html` từ bản 1.3 + ảnh mới nhất (theo brand guideline OTTIMO); QA kiểm che dữ liệu khách cho **mọi** ảnh nhúng trước khi commit (quy tắc ảnh: chỉ commit sau khi QA kiểm che); ORC commit; công bố hay không là việc ORC hỏi INV. Ảnh C1-15, C2-34, C2-13: QA chụp lại nếu kịp, không kịp thì sổ tay giữ mô tả chữ | UXD, QA, ORC | 31/10 | Không | Không (đào tạo dùng được bản `.md`) – nhưng phần nội dung ở D-T1 thì chặn |
| **D-T3** | OPS ghi biên bản diễn tập khôi phục production 29/10 vào `v1-production.md` mục 22 (chỉ số đếm, bản `20261029T033257Z`, image, kết quả, thời gian) và dòng "Diễn tập khôi phục production: 29/10/2026" ở README `infra/server` mục 12 | OPS | 31/10 | Không | Không (QC đã đọc biên bản gốc) |
| **D-T4** | Thông báo xử lý dữ liệu v2 (SEC 5.2). Không có trong rc.6. Đội chọn một trong hai, PO quyết trong quyền phạm vi, SEC đồng ý: **(a) đề xuất của QC** – từ D tới khi v2 lên production (v1.0.1, 04/11), lễ tân **không gửi link check-in online cho khách thật**; khách khai tại quầy, lễ tân đọc câu đồng ý có số ngày và chỉ tờ thông báo ở quầy (D-T1); hoặc (b) bản rc.7 chỉ đổi chữ + `NOTICE_TEXT_VERSIONS`, qua CI, staging, INV duyệt production trước 01/11 – khi đó tag `v1.0.0` phải gắn lên commit rc.7 và QC chấm lại phần chênh. Ghi lựa chọn vào decision-log | PO + SEC (UXD duyệt chữ, FE-B làm nếu chọn b) | 31/10 | Không với (a); Có với (b) | **Có** |
| **D-T5** | Gắn báo động sau khi INV tạo tài khoản (lệnh `b2-runbook.md` 2.7, dấu nhắc ẩn): `HEARTBEAT_URL`, `ALERT_WEBHOOK_URL`; xác nhận Healthchecks.io "up", một tin thử tới Google Chat, UptimeRobot đủ 5 địa chỉ | OPS | 01/11 | Không | **Có** |
| **D-T6** | Đọc log worker **production** sau lượt chạy theo lịch đầu tiên trên rc.6 (03:00–03:30 31/10) của 6 job ở T3; chạy lại truy vấn vai sau D-INV-2; chạy truy vấn `logout` sau D-INV-1 | OPS (SEC cho truy vấn `logout`) | 31/10–01/11 | Không | **Có** |
| **D-T7** | Thủ tục: ARC/OPS ghi trạng thái `WA-01`, `WA-02` = Done (dẫn OPS 12–14); `WA-03/04/05` dời v1.0.1 có dòng trong `responses/`. ORC cập nhật `inv-golive-checklist.md` (tick A6–A9, B1, B2; thêm C1 từ 30/10, L-1, quản lý đăng nhập) | ARC, OPS, ORC | 01/11 | Không | Không |

### 4.3 Việc INV phải làm (ORC trình, đội không làm thay)

| # | Việc | Thời gian | Hạn | Chặn tag | Chặn D |
|---|---|---|---|---|---|
| **T2** | Trả lời **ESC-040** (một câu) | 2 phút | 31/10 | **Có** | Không |
| **D-INV-1** | **L-1 – thử đăng xuất trên Desk thật** (`SEC-G7-5-production.md` mục 5): đăng nhập, thao tác một việc, bấm Đăng xuất, bấm Back rồi tải lại trang – phải ở màn đăng nhập. Báo ORC giờ đăng xuất để OPS/SEC kiểm dòng `logout`. Không đạt → `/feedback P1 đăng xuất không thu hồi phiên` | 5 phút | 01/11 | Không | **Có** |
| **D-INV-2** | **Người giữ tài khoản 6 vai đăng nhập lần đầu trên Desk thật**: đổi mật khẩu tạm, đăng ký 2 bước, cất 10 mã khôi phục trên giấy. Nếu mật khẩu tạm đã gửi qua chat/Zalo/tin nhắn, anh/chị **đặt lại mật khẩu tạm** trước rồi đưa tận tay | 15 phút | 01/11 | Không | **Có** |
| **D-INV-3** | **C1 – kiểm VietQR** (từ 30/10, tài khoản đã có hiệu lực): tạo đơn thử ghi "TEST", quét QR bằng app ngân hàng, xem **tên chủ tài khoản đúng**, **không chuyển tiền**, hủy đơn. Tên sai → `/feedback P0` | 5 phút | 31/10 | Không | **Có** |
| **D-INV-4** | **A7 – báo động**: tạo Healthchecks.io, UptimeRobot (5 địa chỉ), phòng Google Chat; đưa địa chỉ ping/webhook cho OPS qua kênh riêng (không qua chat dự án) | 20 phút | 31/10 | Không | **Có** |
| **D-INV-5** | **A10 – danh sách chuyển đổi** (đơn từ D, cọc đã thu, khách đang ở, dài hạn, công nợ cũ) cùng lễ tân trưởng, giữ ở OTTIMO | 30–45 phút | D−1 (01/11) | Không | **Có** (không có thì không chuyển đổi được) |
| D-INV-6 | Mỗi sáng: biện pháp bù B1–B6 của SEC (kiểm "Tài khoản nhận chuyển khoản", Cần chú ý, Nhật ký tiền 24 giờ, đối soát ngân hàng) – tới khi v1.0.1 sửa BUG-R3-032 | 10 phút/ngày | Liên tục | Không | Điều kiện của ESC-040 A |
| D-INV-7 | Khuyến nghị, không chặn cổng: A12 phần (1) giờ nhận 12:00 trên extranet OTA (thiếu thì chưa thu được phụ thu nhận sớm khách OTA); A5 hỏi Nhân Hòa về bản chụp; trả lời ESC-039 (hạn 31/10), ESC-035 (hạn 01/11), ESC-038, ESC-037, ESC-032, ESC-033 – **không ESC nào chặn D**, đội đã có cách tạm hoặc mặc định | – | Theo từng ESC | Không | Không |
| D-INV-8 | Đào tạo C3a 31/10–01/11 trên staging bằng sổ tay (sau D-T1). Trên Desk thật chỉ đăng nhập, đổi mật khẩu, đăng xuất | Theo lịch | 01/11 | Không | Không (khuyến nghị mạnh) |

### 4.4 Sau ngày D – theo dõi, không chặn

| Việc | Vai | Hạn |
|---|---|---|
| BUG-R3-032 (P1): trường email người dùng, thư "Security notice" tới chủ; `ops-check` đếm `dead NO_RECIPIENT` | BE-A + ARC, OPS, SEC | v1.0.1 (04/11), **chậm nhất 09/11** – quá hạn SEC lập ESC |
| BUG-R3-041 (P2): thông báo J1 vào hộp thư/SSE/"Cần chú ý"; kèm `capacity_conflict`, `overbooking` cùng cách gửi | BE-B + ARC, DOM | v1.0.1 |
| Thông báo xử lý dữ liệu v2 (nếu chọn D-T4 (a)) | UXD, FE-B, SEC; OWN đặt `privacy_notice_version` | v1.0.1 |
| WA-03, WA-04 (hold có yêu cầu giảm giá/FOC quá hạn làm J1 lỗi mỗi nhịp), WA-05; log worker in kết quả job | BE-B, ARC | v1.0.1 |
| FB-R3-SEC-OPS-06 `fail2ban` (P3); FB-R3-SEC-FE-A-17 đăng xuất lỗi mạng (Suggestion) | OPS; FE-A | v1.0.x; v1.1 |
| BUG-R3-018 phần 1, 021, 023 phần còn lại, 034–036, 040; trả phòng sớm (US-137 Desk) | Theo `bug-list.md` | v1.0.1 / v1.0.2 |
| Đọc lại log 6 job theo lịch sau lượt chạy có **dữ liệu thật** đầu tiên (02–03/11) | OPS | 03/11 |

---

## 5. Ghi chú cho ORC khi gắn tag

1. Gắn tag có chú thích `v1.0.0` lên **đúng `8b3aec8`** (không phải `HEAD` `1517da5`): `release.yml` lấy image theo commit của tag (`sha-${GITHUB_SHA::12}`); `8b3aec8` → `sha-8b3aec89486f`, cùng image đang chạy.
2. **Đẩy tag `v1*` sẽ tự tạo một lượt Release mới** (`on: push: tags: ['v*']`), dừng ở environment `production` chờ duyệt. Lượt này deploy lại đúng image đang chạy. Không cần, và không nên chạy trong giờ có khách: **bấm Reject** (hoặc để chờ rồi hủy). Nếu muốn `deploy-history.log` ghi `v1.0.0` thì chỉ duyệt khi INV đồng ý riêng, ngoài giờ khách, không phải D−1 hay D.
3. Nếu chọn D-T4 (b) (rc.7), tag `v1.0.0` chuyển sang commit rc.7 và cần QC chấm lại phần chênh theo quy tắc 6.2.
4. Sau khi gắn: PO ghi tag và ngày vào `release-notes.md` (D-T1); ORC ghi decision-log.

---

## 6. Rủi ro chủ đầu tư cần biết

1. **Thư báo bảo mật chưa tới ai (BUG-R3-032)** tới v1.0.1. Nếu ai đó đổi tài khoản nhận tiền hay reset 2 bước, anh/chị chỉ biết khi tự kiểm trên Desk mỗi sáng. Lớp chặn vẫn còn: chỉ chủ đổi được, phải xác thực lại, hiệu lực từ hôm sau, mã QR báo "vừa đổi tài khoản nhận".
2. **Giữ chỗ quá hạn có cọc không báo ai (BUG-R3-041).** Căn bị giữ im lặng tới khi lễ tân thấy đồng hồ "0h00" đỏ. Cách tạm: rà đầu mỗi ca. Không sai tiền, không đặt trùng.
3. **Một người giữ 6 vai** (decision-log 29/10) tự ghi và tự duyệt giảm giá/hoàn tiền. Kiểm soát duy nhất là anh/chị rà Nhật ký tiền mỗi ngày.
4. **Production mới chứng minh "chạy sạch", chưa chứng minh "xử lý đúng dữ liệu thật".** J1/J15/J24 đúng trên staging; trên production 0 đơn. Ba ngày đầu giữ sổ giấy (C4) và OPS đọc log sau lượt có dữ liệu thật đầu tiên.
5. **Chưa có nhân viên thật dùng thử PWA buồng phòng trên điện thoại thật** (G8-4). Lỗi dùng thực tế đi qua `/feedback`.
6. **Bản chụp tự động của Nhân Hòa** (A5) có thể chứa dữ liệu khách ngoài kiểm soát của OTTIMO nếu chưa hỏi.
7. **Máy chủ dùng chung staging + production**: RAM khả dụng còn khoảng 3,8 GB; theo dõi qua `ops-check` `mem` (chỉ báo được khi D-T5 xong).

---

## 7. QC chưa kiểm được

- Trạng thái thật của container, DB và log production: dựa vào OPS 14.1 và SEC-G7-5 (đều đọc chỉ đọc, có số đếm). QC xác nhận gián tiếp bằng release run success và `curl`.
- Nội dung biên bản diễn tập khôi phục ngoài dòng kết quả và số đếm; khóa, KEK, mã khôi phục (đúng thiết kế: QC không đọc).
- Việc của INV: L-1, đăng nhập tài khoản 6 vai, C1 tên chủ tài khoản trên QR, báo động.
- Log 6 job theo lịch trên rc.6 (T3, D-T6).
- Hiệu năng và axe trên rc.6 (plan mục 3: không chặn v1.0).
- Bản HTML sổ tay chưa commit: QC không duyệt nội dung ảnh nhúng (thuộc QA, D-T2).

## 8. Giả định

| # | Giả định | Ai xác nhận |
|---|---|---|
| QC-G6 | Biên bản diễn tập trên Mac INV (`restore-prod-20261029.txt`, 29/10 10:37) là lượt diễn tập của B2 phần 5 mà decision-log 29/10 ghi "Đạt" | OPS (D-T3) |
| QC-G7 | `catchUp: 'always'` và giờ `daily` 03:00/03:10 nghĩa là ít nhất `log.partitions`, `lease.nights` đã chạy trên staging rc.6 lúc ~03:00 30/10; các job còn lại có thể có giờ khác | OPS (T3) |
| QC-G8 | BUG-R3-032 giữ mức P1 như QA/SEC xếp. QC không tự hạ mức để qua cổng | QA, SEC |
| QC-G9 | Đề xuất D-T4 (a) (tạm không gửi link check-in online) nằm trong quyền PO về phạm vi trong bản, không phải chính sách kinh doanh cần INV quyết. Nếu PO/SEC thấy khác thì ORC báo INV trong tóm tắt | PO, SEC |
| QC-G10 | Không lập `outputs/QC/report.md` riêng: ORC chỉ giao `v1-gate.md` và cập nhật bảng kiểm; nội dung báo cáo nằm trong tệp này (giống lượt 26/10) | ORC |

## 9. Điểm làm tốt (để giữ)

- QA và OPS kiểm worker bằng số đếm DB + log từng nhịp, không chỉ "không có job failed" – chính cách này bắt được 038/039 và chứng minh bản sửa.
- Deploy production rc.6 theo đúng WA-02: đếm chỉ đọc trước, sao lưu tay, kiểm sau, ghi `previous_tag` để quay lui.
- SEC không ghi "Đạt" cho đăng xuất khi log không có `logout` – tách đúng "đăng nhập lại sau hết phiên" và "đăng xuất".
