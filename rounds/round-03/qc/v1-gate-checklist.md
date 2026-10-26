# Cổng v1.0 – Bảng kiểm chuẩn bị (QC)

- Người lập: QC | Ngày: 26/10/2026 (chiều) | Round 3 – Bước **QC (chuẩn bị cổng v1.0, đường nhanh)**
- Bản ứng viên: tag `v1.0.0-rc.1` (tag có chú thích) = commit `2963675` – cùng commit đang chạy trên staging (`sha-29636757822b`, OPS `v1-production.md` 16.1).
- **Trạng thái cổng: CHƯA CHẤM.** Đây là bảng kiểm, không phải quyết định. QC **không chấm ĐẠT** lúc này: production chưa chạy được app, chưa smoke, chưa diễn tập khôi phục.
- Căn cứ: `rounds/round-03/release-v1-plan.md` (mục 3 – 5 điều kiện, mục 4, 5); `rounds/round-03/inv-golive-checklist.md`; `product/docs/uat-script.md`; `rounds/round-03/reviews/SEC-sprint1.md` (mục 2, 3); `rounds/round-03/qa/bug-list.md`; `rounds/round-02/qa/bug-list.md`; `rounds/round-02/qa/staging-run.md`; `rounds/round-03/outputs/OPS/v1-production.md` mục 12–16; decision-log 23–26/10.
- Cách QC kiểm: đọc tệp và lịch sử git; tự đọc CI bằng `gh run list/view -R anhvh93-tech/ottimo-hotel-app-public` (26/10 ~15:00); `git grep` trên `2963675`; `git diff 880ea19 2963675`; `curl` trang công khai (chỉ đọc mã trạng thái). QC **không** SSH vào máy chủ, không đăng nhập staging/production, không chạy stack.
- Repo công khai: tệp này không ghi IP, bí mật, số tài khoản, vân tay khóa hay thủ tục khôi phục.

Ký hiệu trạng thái:
- **Đạt** – có bằng chứng QC đã kiểm lại.
- **Còn thiếu** – việc của đội, không cần INV.
- **Cần INV** – INV phải làm hoặc quyết. Ghi số buổi (B1, B2) ở mục 5.
- Cột "Ngay": **N** = đội làm được ngay hôm nay, không chờ INV hay việc khác.

---

## 1. Tóm tắt

| Nhóm | Đạt | Còn thiếu | Cần INV |
|---|--:|--:|--:|
| ĐK1 Lượt kiểm tiền | 5 | 1 | 0 |
| ĐK2 2FA | 2 | 3 | 2 |
| ĐK3 SEC 6 thẻ | 1 | 1 | 0 |
| ĐK4 Production tách staging | 1 | 7 | 5 |
| ĐK5 QC cổng v1.0 | 3 | 4 | 0 |
| Bắt buộc thêm (R3-Q51, US-008, R3-Q15, tài liệu) | 2 | 6 | 1 |
| US-155 + bổ sung SEC/staging (G7) | 1 | 4 | 2 (gồm ESC-030) |
| Mang sang từ R2 | 0 | 4 (1 không chặn) | 0 |

Một hạng mục có thể vừa "Còn thiếu" vừa "Cần INV" (ví dụ G4-7), nên tổng các cột lớn hơn số dòng.

**Ba phát hiện mới khi lập bảng (ORC cần biết ngay):**

1. **Lượt deploy production đầu tiên đã HỎNG.** Release run `40288670558` (tag `v1.0.0-rc.1`, push 07:54Z = 14:54 giờ VN 26/10): job "resolve release" đạt (CI xanh, digest khớp), job "deploy production" trả `deploy sha-29636757822b: failed (step=switch, ref=20261026T075737Z-b915ac)` sau khoảng 22 giây. Bước `switch` trong `product/infra/server/bin/deploy.sh` là `dc up --wait … api worker web`. Hỏng nhanh như vậy thường là lỗi compose (mạng, tệp bí mật, cấu hình), không phải hết giờ chờ healthy. QC kiểm từ ngoài lúc ~15:00: `ottimo.vn` 200 (landing không ảnh hưởng), `desk.staging.ottimo.vn` 200, `desk/staff/g.ottimo.vn` không kết nối được. SSH tới máy chủ đã chạy được, nghĩa là INV đã xong phần 9.1–9.2 và đã duyệt lượt Release. **OPS đọc `deploy-history.log` / log theo `ref` trên máy chủ, sửa, rồi chạy lại.**
2. **A1 12/12 trên staging chạy trên bản trước RC.** Staging chạy image R2 (`sha-4fd0651…`) từ 22/10. Lượt deploy staging kế tiếp `4fab25b` còn chờ duyệt (OPS 13, 24/10). `sha-29636757822b` mới live 26/10 11:25 (OPS 16.1). Vì vậy A1 phần 1–3 (22, 23, 25/10) **chưa** đi qua mã tiền R3, 2FA, R3-Q51, US-008. A1 vẫn **Đạt theo chữ** điều kiện 5 ("phần 3 ngày 25/10"). Nhưng QC yêu cầu hồi quy A1 trên `rc.1` ở QA-3 (mục 3, G5-6) trước khi chấm.
3. **2FA, ca A.7 #16 chưa đủ.** `SEC-sprint1.md` ghi US-143 "Verified phần mã". Tuy vậy `s1-SEC-on-2FA.md` (ghi nhận G1) đòi ca 16 có đồng hồ giả, và trên `2963675` chưa có: `git grep` hai tệp `e2e/*mfa*` không có đồng hồ giả. Điều kiện 2 của plan ghi "ca A.7 đủ 16". Ca 14 (US-164, duyệt từ xa) thuộc v1.1, nên SEC phải ghi rõ chấp nhận thay thế.

---

## 2. Bảng kiểm theo 5 điều kiện của INV (release-v1-plan mục 3)

### ĐK1 – Lượt kiểm tiền R3 xong

| # | Hạng mục | Trạng thái | Bằng chứng | Ai làm việc còn thiếu | Ngay |
|---|---|---|---|---|---|
| G1-1 | Bước 1–4 gộp `main` (210, 209, 208, BE-83 + ESC-026 A + R3-Q25) | **Đạt** | `4863c5c`, `29ce3d8` → gộp; SEC Verified B.5 trên `880ea19` (`SEC-sprint1.md` mục 1); cả hai là tổ tiên của `2963675` | – | – |
| G1-2 | `pendingFix` BUG-R2-208, 209, R3-SEC-BE-83, R3-ESC-026 gỡ hết | **Đạt** | QC `git grep "pendingFix("` trên `2963675`: 0 chỗ gọi. `known-bugs.ts` chỉ còn BUG-R2-217, 218 (P3) | – | – |
| G1-3 | Fuzz R3-Q30: 0 vi phạm bất biến; critic 0 lệch, 0 Major | **Đạt** | Decision-log 24/10 "ORC – G1 (tiền đúng) ĐẠT": `ce38624`, 710 chuỗi, 28.250 bước, 0 vi phạm cứng I1–I25; `reviews/s1-money-critic-014.md`; commit `870ecfd` | – | – |
| G1-4 | BUG-R3-001…014 đóng | **Đạt** | `round-03/qa/bug-list.md` mục 1: 14/14 Closed (P0 3, P1 8, P2 3) | – | – |
| G1-5 | Đóng băng mã tiền tới QC v1.0 | **Đạt** | Decision-log 24/10 (`870ecfd`). QC `git diff 880ea19 2963675 -- product`: chỉ đổi `landing-web`, `test/fuzz`, `e2e/landing`, `design/landing`. Không đổi mã api, admin-web, mobile, guest-web, infra | – | – |
| G1-6 | BUG-R2-210 Closed (cùng 208, 209) trên sổ lỗi | **Còn thiếu** (thủ tục) | SEC ghi 208/209/210 **Verified** D.1–D.4 (`SEC-sprint1.md`). Nhưng `round-02/qa/bug-list.md` vẫn ghi 208, 209 "P2 Open", 210 "P3 Open" | QA: chuyển 3 dòng sang Closed, dẫn `880ea19` + G1 | **N** |

### ĐK2 – 2FA owner/manager gộp, `MFA_ENFORCED=true` trên production

| # | Hạng mục | Trạng thái | Bằng chứng | Ai làm việc còn thiếu | Ngay |
|---|---|---|---|---|---|
| G2-1 | US-143 AC1–AC4 + CỔNG S2 gộp `main`; 3 Major SEC đóng | **Đạt** | `aa570e6` là tổ tiên của `2963675`; `s1-SEC-on-2FA.md` lượt `aa570e6`: 0 Blocker/Major, BEC-01…08 + FEA-01 đạt; Verified phần mã trên `880ea19` (`mfa-us143` 23 ca) | – | – |
| G2-2 | Ca A.7 đủ 16 | **Còn thiếu** | Ca 16 thiếu phần đồng hồ giả (G1 trong `s1-SEC-on-2FA.md`): trên `2963675` tệp `e2e/ui/mfa-us143.r3s1.spec.ts`, `e2e/api/mfa-s2.r3s1.api.spec.ts` không có đồng hồ giả. Ca 14 phụ thuộc US-164 (v1.1) | FE-A/QA: thêm ca 16 có đồng hồ giả (`mfaToken` quá 5 phút, mã ±1/±2 bước). SEC: ghi chấp nhận ca 14 dời v1.1 (ca 15 đạt nhờ fail-closed) | **N** |
| G2-3 | Staging `MFA_ENFORCED=true` | **Đạt** | OPS 16.2: `printenv` api/worker = `true`; `qa.owner`/`qa.mgr` chưa 2FA → 403 `MFA_ENROLLMENT_REQUIRED`, lễ tân không đổi. Bật trước thứ tự 4.3 theo lệnh ORC. QC chấp nhận vì staging chỉ có dữ liệu giả | – | – |
| G2-4 | OWN và MGR **thật** đăng ký 2FA trên staging, SEC chứng kiến (SEC mục 2 #1) | **Cần INV** (B1) | Chưa có biên bản | INV (+ MGR thật nếu có), SEC chứng kiến, ORC dẫn | – |
| G2-5 | Thủ tục 06.33: OPS viết (ngoài repo), có người thật theo chức danh, diễn tập 1 lần trên staging có người chứng kiến thật, SEC duyệt (SEC mục 2 #2) | **Còn thiếu** + **Cần INV** (B1) | OPS 12: bản nháp ngoài repo, README ghi "SEC duyệt ngày: (chưa)"; R3-OPS-09 mở | OPS: đưa SEC đọc bản nháp **trước** B1 (**N**). Diễn tập ở B1: INV + 1 người chứng kiến thật | **N** (phần đọc) |
| G2-6 | Production `MFA_ENFORCED=true` | **Còn thiếu** (chờ deploy) | `.env` production có `MFA_ENFORCED=true` (OPS 16.4); `deploy.sh` từ chối production khi cờ khác `true`; api production từ chối khởi động khi `false`. Cần xác nhận trên container production đang chạy | OPS: `printenv` trong api/worker production sau deploy | sau G4-1 |
| G2-7 | INV + mọi MGR đăng ký 2FA trên production | **Cần INV** (B2) | **Lệch thứ tự, QC chấp nhận:** plan ghi "đăng ký trước khi bật cờ". Thực tế production bật cờ từ DB trống, nên tài khoản chưa 2FA chỉ vào được màn đăng ký, không ai bị khóa ngoài. Cách này chặt hơn plan. Mục B8 của `inv-golive-checklist.md` đổi thành "đăng nhập lại để kiểm" | INV, MGR thật; ORC sửa B8 | – |

### ĐK3 – SEC Verified BE-65, 74, 75, 79, 83, 84 (a)

| # | Hạng mục | Trạng thái | Bằng chứng | Ai làm việc còn thiếu | Ngay |
|---|---|---|---|---|---|
| G3-1 | Sáu thẻ Verified trên commit đã gộp; 0 Critical/High mở | **Đạt** | `SEC-sprint1.md` mục 1: tất cả Verified trên `880ea19`. SEC chạy lại 18 tệp, 229/229 đạt; 14 bảng nhạy cảm bật RLS + FORCE. Thẻ còn mở chỉ Minor/Suggestion (BE-84 (b), BE-B-09, …), không chặn | – | – |
| G3-2 | Kiểm lại trên commit RC (B.0 (7), SEC mục 2 #4) | **Còn thiếu** (nhẹ) | QC đã xác nhận `880ea19 → 2963675` không đổi mã ứng dụng (G1-5). Theo B.0 (7), SEC chỉ cần ghi một dòng xác nhận trên `2963675`, không phải chạy lại cả bộ | SEC | **N** |

### ĐK4 – Production tách staging

| # | Hạng mục | Trạng thái | Bằng chứng | Ai làm việc còn thiếu | Ngay |
|---|---|---|---|---|---|
| G4-1 | **App production chạy được** (deploy qua environment `production`, INV duyệt) | **Còn thiếu – CHẶN** | Release `40288670558` hỏng ở `step=switch` (mục 1 phát hiện 1). `desk/staff/g.ottimo.vn` không kết nối | OPS: điều tra theo `ref`, sửa, chạy lại. Sửa chỉ ở `infra/` thì cần commit mới + CI xanh + tag `rc` mới (mục 6). INV: duyệt lại lượt Release (2 phút, không cần buổi) | **N** |
| G4-2 | CSDL, bí mật, tên miền, mạng, khóa `age`, timer, khóa CI riêng | **Đạt** (cấu hình) | OPS 2, 13, 16.4: `/opt/ottimo-prod` riêng; bí mật production sinh 24/10, khác staging; khóa `age` production khác staging; DNS A `desk/staff/g` trỏ VPS, không AAAA; environment `production` có người duyệt INV, chỉ tag `v*`/`landing-v*` | – | – |
| G4-3 | Cấu hình production qua kiểm khởi động (không đồng hồ giả, không test-support) | **Còn thiếu** (chờ G4-1) | `.env`: `APP_ENV=production`, `CLOCK_MODE=system`, `INCLUDE_TEST_SUPPORT=0`, không `TEST_SUPPORT_TOKEN` (OPS 16.4). `deploy.sh` bước `config` chặn các cờ test. Cần lần deploy chạy qua bước `config` → `smoke` | OPS | sau G4-1 |
| G4-4 | SEC rà cấu hình production + kiểm lại các bản sửa OPS-01 (Major), OPS-02, 03, 05, BOOT-01/02 (SEC mục 2 #3) | **Còn thiếu** | `responses/s1-OPS-v1.md` báo Done; `s1-SEC-on-landing.md` chỉ nhắc OPS-01 "đã sửa ở `a22cd4f`", chưa có dòng Verified. Theo SEC: production chỉ nhận người dùng thật sau khi OPS-01 Verified | SEC (+ OPS cấp kết quả `ops-check`) | **N** (phần repo) |
| G4-5 | Sao lưu production hằng ngày chạy (timer `@ottimo-prod`) + bản kéo ra khỏi VPS | **Còn thiếu** | Timer chưa bật, chờ app (OPS 16.4). Khóa kéo `rrsync -ro` đã cài ở 9.1 (suy ra từ việc SSH của Release chạy được). OPS cần xác nhận | OPS, sau G4-1 | sau G4-1 |
| G4-6 | Khóa giải mã sao lưu INV giữ ngoại tuyến | **Cần INV** (B1) | Khóa riêng đang ở Mac INV, mode 0600 (OPS 16.4). Chưa có xác nhận INV đã cất bản ngoại tuyến (phần 9.3) | INV | – |
| G4-7 | **Một lần diễn tập khôi phục** bản sao lưu production, môi trường dùng một lần, có biên bản | **Còn thiếu** + **Cần INV** (B2) | Mới chạy thử local 23/10, khớp 100 % (OPS 8.3). Lần bắt buộc làm sau deploy đầu | OPS chạy; INV có mặt (khóa ở Mac INV) | – |
| G4-8 | KEK production có bản ngoại tuyến **trước** dữ liệu thật | **Cần INV** (B2) | OPS 13, 16.4: "KEK chưa có bản ngoại tuyến của INV" | INV (phần 4b) | – |
| G4-9 | Email production: thư thử 8b tới hộp thư INV | **Còn thiếu** (chờ G4-1) | Relay đã thông tới `MAIL FROM` 250, TLS 1.3, từ máy chủ và từ container (OPS 16.3). Chưa gửi trọn một thư. 26/10: `mail-test.mjs` (SEC duyệt, `SEC-sprint1.md` mục 4.1) chạy chế độ chỉ kiểm → `verified`; thư thử có tiêu đề "OTTIMO – Test message: e-mail delivery check / Thư thử: kiểm tra gửi email", không dùng mẫu "Security notice" | OPS (INV mở hộp thư, B2) | sau G4-1 |
| G4-10 | Báo động (ESC-029 A): Healthchecks.io, UptimeRobot, Google Chat; bật timer `ops-check@ottimo-prod` | **Cần INV** (B1) + **Còn thiếu** | `inv-production-steps.md` phần 6 chưa có xác nhận. `ottimo.vn` chưa được giám sát (OPS 13, 15.1). QC thêm hạng mục này vì cam kết "P0 sửa trong ngày" không làm được nếu không ai biết hệ thống sập. **Không chặn deploy, chặn ngày chạy** | INV tạo tài khoản; OPS gắn URL + bật timer | – |
| G4-11 | RAM/đĩa khi production + staging + landing + edge cùng chạy | **Còn thiếu** | Trước khi có app: còn 4,1 GB / 4,9 GB, đĩa dùng 15 % (OPS 16.4). Chưa đo khi app production chạy | OPS: đo sau deploy; `ops-check` `mem` | sau G4-1 |
| G4-12 | Bản chụp tự động của nhà cung cấp VPS (checklist A5) | **Cần INV** (tự làm) | Chưa có xác nhận | INV hỏi Nhân Hòa (không cần buổi) | – |

### ĐK5 – QC "cổng v1.0" rút gọn

| # | Hạng mục | Trạng thái | Bằng chứng | Ai làm việc còn thiếu | Ngay |
|---|---|---|---|---|---|
| G5-1 | QC chấm ĐK1–4 | **Còn thiếu** | Bảng này. QC chấm sau B2 (mục 5) | QC | – |
| G5-2 | A1 đạt trên staging | **Đạt (theo chữ plan)** | `round-02/qa/staging-run.md` 6.1–6.3: 12/12 chặng, 22/10, 23/10, 25/10 (`d5df6a4`); A4 trọn chuỗi đạt 22/10. **Chạy trên image R2, không phải RC** (mục 1 phát hiện 2) → xem G5-6 | – | – |
| G5-3 | 0 P0/P1 mở | **Đạt** | R3: 0/14 mở. R2: tổng hợp `round-02/qa/bug-list.md` 0 P0/P1 mở. Còn P2 208/209 (đã Verified, chờ G1-6) và P3: 216–222 cùng 15 dòng cũ | – | – |
| G5-4 | CI xanh trên commit phát hành | **Đạt** (cho `2963675`) | QC đọc `gh`: push `40199367309` trên `2963675` success, mọi job kiểm xanh, deploy staging xanh. T9 hằng đêm `40226590285` (schedule, 19:33Z 25/10 = 02:33 giờ VN 26/10) success trên `2963675`. **Phải đọc lại** nếu commit gắn tag `v1.0.0` khác `2963675` | QC (khi chấm) | – |
| G5-5 | Smoke trên production sau deploy đầu | **Còn thiếu – CHẶN** | Chưa có app (G4-1) | OPS (smoke của `deploy.sh`) + QA (QA-3 phần production: đăng nhập, Desk/PWA/trang khách mở, header, `/health` ẩn) + SEC-G1/G2 (G7-5) | sau G4-1 |
| G5-6 | QA-3 hồi quy rút gọn trên `v1.0.0-rc.1` (staging) | **Còn thiếu** | Chưa có báo cáo. Phạm vi (plan 5, QA-3): (a) A1 chạy tay trên `rc.1`: chặng 1–7 ngày D, chặng 8–12 ngày D+1; (b) ca tiền (`money-s4` + ca API R3) trên staging; (c) ca giờ đêm: dẫn CI `2963675` (stack đồng hồ giả); (d) 2FA khi `MFA_ENFORCED=true` (QA dùng TOTP thử cho `qa.owner`/`qa.mgr`); (e) R3-Q51; (f) US-008; (g) S35 hàng chờ website khi công tắc tắt | QA | **N** |
| G5-7 | Lỗi P3 mới hoặc chưa xếp đích | **Còn thiếu** (thủ tục) | BUG-R2-219, 220 (FE), 221, 222 (bộ test), 216, 218 chưa có đích v1.0.x/v1.1 trong backlog | PO xếp đích; QA cập nhật sổ | **N** |

---

## 3. Bắt buộc thêm cho v1.0 (đề xuất PO, QC chấp nhận) và tài liệu

| # | Hạng mục | Trạng thái | Bằng chứng | Ai làm việc còn thiếu | Ngay |
|---|---|---|---|---|---|
| G6-1 | R3-Q51 tài khoản nhận VietQR: gộp, SEC đạt, **chạy trên staging**, PO nghiệm thu | **Còn thiếu** (phần staging) | Gộp `a636faa`; SEC Verified C (`SEC-sprint1.md`). Trên staging từ 26/10 (`2963675`). Chưa có nghiệm thu PO trên staging | PO (+ QA-3 (e)) | **N** |
| G6-2 | US-008 thêm người dùng S26: gộp, SEC đạt (cùng 2FA), **chạy trên staging**, PO nghiệm thu | **Còn thiếu** (phần staging) | Gộp `5f13b26` trong nhánh 2FA; SEC lượt `aa570e6` đạt (FEA-01, `AddUserDialog` gửi S2). Chưa có nghiệm thu PO trên staging | PO (+ QA-3 (f)) | **N** |
| G6-3 | R3-Q15 xóa ghi chú yêu cầu khách theo hạn lưu, SEC B.7 | **Đạt** | `8e0b08c` (migration 0083); SEC Verified B.7 trên `880ea19` | – | – |
| G6-4 | Release notes v1.0.0 có "Giới hạn đã biết" đầy đủ | **Còn thiếu** | `product/docs/release-notes.md` còn ghi form "Yêu cầu đặt phòng" và landing là **v1.1**. Thực tế landing đã chạy 24–25/10 và US-155 vào v1.0 (INV 24/10). "Giới hạn đã biết" thiếu: R3-Q39 #8–#12 (G-v1-3), FZ-08 P3, US-135 AC3, các P3 còn mở, form tắt tới khi có ESC-030, cách báo khi chưa có email (nếu có) | PO (QC bổ sung khi chấm) | **N** |
| G6-5 | Hướng dẫn chuyển đổi ngày đầu (DOM-1): nhập đơn tương lai, cọc đã thu, khách đang ở, công nợ cũ; sổ giấy 3 ngày | **Còn thiếu** | Không có tệp. `grep` chỉ thấy tên việc trong plan và checklist | DOM | **N** |
| G6-6 | Hướng dẫn vận hành 1 trang cho ngày đầu (protocol R3: "có tài liệu hướng dẫn"; plan: "bản 1 trang đủ") | **Còn thiếu** | Không có trong `product/docs/` | PO + DOM. Nếu làm thành trang HTML trình INV thì UXD kiểm brand OTTIMO | **N** |
| G6-7 | Bảng giá trị khởi tạo + hạn lưu ngắn nhất đề xuất (DOM + SEC) | **Đạt** (phần đội) / **Cần INV** (B1) | `outputs/DOM/v1-production-defaults.md` mục 2 (ảnh 1 ngày; khai báo chưa xong 2 ngày; hồ sơ điền sẵn 3 tháng), mục 3 có 8 câu chờ INV (hạng Studio, tên phòng trên Desk, phí OTA, VAT 8 %, điện nước, Tết 2027, hạn lưu, mục chờ luật sư/kế toán). Giá trị nằm trong `production-defaults.ts` (`309822b`, tổ tiên `2963675`) | INV trả lời ở B1; OWN nhập trên màn Tham số ở B2 | – |
| G6-8 | Backlog cột "Phát hành" | **Còn thiếu** | `03-backlog/backlog.md` cập nhật lần cuối 22/10 | PO | **N** |

---

## 4. Điều kiện SEC, US-155, phần mang sang từ R2

### 4.1 Điều kiện SEC còn lại (`SEC-sprint1.md` mục 2) – đối chiếu

| SEC # | Nội dung | Ở bảng này |
|---|---|---|
| 1 | OWN/MGR thật đăng ký 2FA trên staging, SEC chứng kiến | G2-4 |
| 2 | Thủ tục 06.33 + diễn tập có người chứng kiến thật | G2-5 |
| 3 | SEC kiểm lại các bản sửa OPS production | G4-4 |
| 4 | Kiểm lại trên commit RC | G3-2 |
| 5 | SEC-G1/G2 trên production trước ngày mở | G7-5 |
| 6 | INV tự nhập tài khoản nhận thật trên H05 | G7-6 |

### 4.2 Hạng mục bổ sung

| # | Hạng mục | Trạng thái | Bằng chứng | Ai làm việc còn thiếu | Ngay |
|---|---|---|---|---|---|
| G7-1 | US-155 phần server + S35 Desk + form landing (tắt) trong `rc.1` | **Đạt** | `61255f1`, `aa2d52c`, `4233290`, `4ceee4e` là tổ tiên `2963675`; SEC Verified phần server; QA E2E 13/13 trên `a1da76f` (BUG-R3-007…011 Closed); `.env` production `LANDING_PUBLIC_API=off` | – | – |
| G7-2 | **Mốc bật form trên production** (INV 24/10: "bật cùng ngày Desk production") – 7 điều kiện SEC (`s1-SEC-on-us155.md`) | **Còn thiếu** + **Cần INV** (ESC-030) | #2 phần OPS đạt trên repo (`751ce79`). Mở: #1 B.2.1–B.2.3 phía Desk, #3 C-1 bản dựng landing có form, #7 E2E trên stack có `LANDING_BASE_URL` + khóa ký (SEC cần xác nhận lượt QA 13/13 trên `a1da76f` có đủ cho #1, #7 không), #6 = G7-5, **#4 C-3 (a) và #5 C-13 cần luật sư** – mâu thuẫn với quyết định INV bật form ngày chạy. Chi tiết `02-escalations/ESC-030.md` | FE-B/QA/SEC (#1, #3, #7); INV quyết ESC-030 | **N** (#1, #3, #7) |
| G7-3 | Tài khoản nhận thử trên staging đổi tên "STAGING KHONG CHUYEN TIEN" (SEC E.13), **trước khi INV dùng thử** | **Còn thiếu** | `s4-acceptance.md` R-6: chưa làm, lệnh ghi bị chặn hai lần. Staging còn số thử `…6789` / "OTTIMO TEST" (`staging-run.md` 8). Số này có thể trùng tài khoản thật của người khác | PO/OPS. `qa.owner` nay cần 2FA nên phải dùng TOTP thử. ORC xin INV một câu cho phép nếu hệ thống quyền chặn | **N** |
| G7-4 | Tài khoản chủ cho INV dùng thử trên staging (UAT việc 1–2) | **Còn thiếu** | `uat-script.md` không ghi INV đăng nhập bằng tài khoản nào. `qa.owner` thuộc bộ test, đang bị E2E dùng | ORC + OPS: tạo một tài khoản OWN dùng thử cho INV trên staging, mật khẩu tạm INV đổi ngay ở B1 | **N** |
| G7-5 | SEC-G1/G2 (`s3-SEC.md` 9.5) trên production trước ngày mở | **Còn thiếu** (chờ G4-1) | – | SEC + OPS | sau G4-1 |
| G7-6 | INV tự nhập tài khoản nhận thật trên production (Q51-9) | **Cần INV** (B2) | Hiệu lực từ ngày hôm sau → B2 phải cách ngày chạy ≥ 1 ngày | INV | – |

### 4.3 Mang sang từ cổng R2

| # | Hạng mục | Trạng thái | Bằng chứng | Ai làm việc còn thiếu | Ngay |
|---|---|---|---|---|---|
| G8-1 | QC chấm lại cổng R2 (QC-1, hạn ≤ 28/10) | **Còn thiếu** | `round-02/qc/round-qc-gate.md` vẫn là bản 21/10 KHÔNG ĐẠT. Đã có R-5 (staging), R-6 (QA `staging-run.md`, PO `s4-acceptance.md` R-6: 19 story Đạt (staging)), R-2 (INT trả lời đủ 7 thẻ trong `round-02/responses/INT-responses.md`) | QC | **N** |
| G8-2 | D4: SEC đọc PWA snapshot 502/503/504 (FB-R2-SEC-MOB-03) | **Còn thiếu** | Không thấy kết quả trong `round-03/reviews/` hay `outputs/SEC/`. Hạn cũ "trước R3 Sprint 1" đã qua | SEC | **N** |
| G8-3 | D5 / R3-Q31: Dependabot không gộp PR đỏ | **Còn thiếu** (thủ tục) | Cảnh báo #1 đóng có lý do (OPS 11). Lượt "Dependabot Updates" `40099237186` (24/10) và PR `7d43952` (24/10) đỏ, chưa thấy phân loại | OPS + SEC: ghi phân loại; xác nhận không có PR Dependabot nào được gộp khi đỏ | **N** |
| G8-4 | D7: kiểm chứng với nhân viên thật trên điện thoại thật (ESC-003) | **Còn thiếu – không chặn v1.0** | Theo plan v1.0, UAT/usability không chặn. QC ghi rủi ro: PWA buồng phòng chưa có nhân viên thật dùng thử | UXR (sau v1.0, theo `/feedback`) | – |

### 4.4 Checklist go-live của INV (`inv-golive-checklist.md`) – trạng thái

| Mục | Trạng thái | Bằng chứng / ghi chú |
|---|---|---|
| A1 Ứng dụng xác thực | Cần INV (trước B1) | – |
| A2 Danh sách nhân viên + vai | Cần INV (B1, giữ ở OTTIMO) | – |
| A3 Rà giá, chính sách | Cần INV (B1) | DOM 8 câu (G6-7) |
| A4 Hạn lưu ngắn nhất | Cần INV (B1) | G6-7 |
| A5 Hỏi Nhân Hòa về bản chụp | Cần INV (tự làm) | G4-12 |
| A6 DNS `desk/staff/g` | **Đạt** | Decision-log 26/10; OPS 16.4 |
| A7 Environment `production` | **Đạt** | Decision-log 23/10; OPS 16.4 |
| A8 Khóa giải mã sao lưu, có mặt diễn tập | Cần INV (B1 cất, B2 diễn tập) | G4-6, G4-7 |
| A9 Email | **Đạt** phần INV (relay 26/10); thư thử 8b còn thiếu | G4-9 |
| A10 UAT ≥ 8/10 | Cần INV (B1) | Mục 4.5 |
| A11 Danh sách đơn/cọc/khách/công nợ | Cần INV (tự làm, trước B2) | Dùng hướng dẫn DOM-1 (G6-5) |
| B1–B6 | Cần INV (B2) | – |
| B7 Nhập dữ liệu cũ | Cần INV (tự làm cùng lễ tân trưởng, sau B2) | – |
| B8 Bật 2 bước | Đổi nội dung: cờ đã bật từ đầu (G2-7) | ORC sửa checklist |
| B9 Sổ giấy 3 ngày | Cần INV (ngày chạy) | – |
| Phần 9.1–9.2 khóa CI | **Đạt** (suy ra) | Release `40288670558` SSH tới máy chủ và nhận được kết quả `deploy-from-ci.sh` |
| Phần 9.3 cất khóa sao lưu | Cần INV (B1) | G4-6 |

### 4.5 UAT (`product/docs/uat-script.md`)

- Trạng thái: **chưa bắt đầu.** Staging đã chạy `rc.1` từ 26/10 11:25, nên INV dùng thử được ngay khi G7-3, G7-4 xong.
- Theo plan, UAT **không chặn** v1.0 trừ lỗi P0/P1 (G-v1-6). Mốc ≥ 8/10 việc là điều kiện để INV chọn ngày chạy.
- Việc 1 (2FA) làm cùng G2-4. Việc 10 (sau 00:00) không bắt buộc: CI có ca đồng hồ giả giờ đêm trên `2963675`.

---

## 5. Việc còn thiếu – thứ tự nên làm

### 5.1 Đội làm ngay, không cần INV

| Thứ tự | Việc | Vai | Gỡ dòng | Vì sao xếp ở đây |
|---|---|---|---|---|
| 1 | Điều tra và sửa lượt deploy production hỏng (`step=switch`, ref `20261026T075737Z-b915ac`). Báo nguyên nhân. Nếu cần sửa `infra/`: commit mới, CI xanh, tag `v1.0.0-rc.2`. Kiểm landing không bị ảnh hưởng | OPS (ARC xem nếu sửa compose) | G4-1 → G2-6, G4-3, G4-5, G4-9, G4-11, G5-5, G7-5 | Chặn mọi việc production |
| 2 | Chuẩn bị B1: đổi tên tài khoản nhận thử trên staging (E.13); tạo tài khoản OWN dùng thử cho INV trên staging; OPS đưa SEC đọc bản nháp 06.33 | PO/OPS, ORC, SEC | G7-3, G7-4, G2-5 (phần đọc) | B1 không chạy được nếu thiếu |
| 3 | SEC kiểm lại OPS-01/02/03/05, BOOT-01/02 trên repo; ghi một dòng xác nhận RC (G3-2); D4 PWA snapshot; phân loại Dependabot đỏ | SEC (+ OPS) | G4-4, G3-2, G8-2, G8-3 | OPS-01 chặn người dùng thật trên production |
| 4 | QA-3 hồi quy rút gọn trên `rc.1` staging (A1 tay 2 ngày D/D+1, ca tiền, 2FA với cờ bật, R3-Q51, US-008, S35 khi form tắt). Thêm ca 16 có đồng hồ giả cho 2FA. Cập nhật sổ R2 (208/209/210 Closed) | QA, FE-A | G5-6, G2-2, G1-6, G5-7 | A1 trên RC cần 2 ngày thật, nên bắt đầu sớm |
| 5 | QC chấm lại cổng R2 | QC | G8-1 | Hạn 28/10 |
| 6 | PO nghiệm thu R3-Q51, US-008 trên staging; sửa release notes (US-155/landing, Giới hạn đã biết); backlog cột Phát hành; xếp đích các P3 | PO | G6-1, G6-2, G6-4, G6-8, G5-7 | Cần trước QC cổng |
| 7 | DOM-1 hướng dẫn chuyển đổi ngày đầu + hướng dẫn 1 trang cho nhân viên (brand OTTIMO nếu làm HTML) | DOM, PO (UXD kiểm brand) | G6-5, G6-6 | INV cần trước A11/B7 |
| 8 | Ba điều kiện kỹ thuật của form (#1 B.2.1–B.2.3 Desk, #3 bản dựng landing có form, #7 E2E có `LANDING_BASE_URL`). Làm để sẵn sàng khi INV quyết ESC-030 | FE-B, QA, SEC | G7-2 (phần đội) | Không chặn Desk v1.0 |
| 9 | ORC: sửa `inv-golive-checklist.md` (A6, A7, A9 đã xong; B8 đổi nội dung); thêm ESC-030 vào `escalations-index.md`; hẹn lịch B1, B2 với INV | ORC | G2-7, mục 6 | – |
| 10 | Sau khi app production chạy (sau 1): bật timer `@ottimo-prod`, `printenv MFA_ENFORCED`, đo RAM, chuẩn bị `production-bootstrap` cho B2 | OPS | G2-6, G4-3, G4-5, G4-11 | Phải xong trước B2 |

Việc INV làm lẻ, không cần buổi:
- Duyệt lại lượt Release khi OPS chạy lại (2 phút, phần 5).
- Hỏi Nhân Hòa về bản chụp tự động (A5).
- Chuẩn bị danh sách đơn, cọc, khách, công nợ (A11).
- Sau B2: kiểm VietQR thật bằng app ngân hàng hôm sau (B3, 5 phút); nhập dữ liệu cũ cùng lễ tân trưởng (B7).

### 5.2 Hai buổi cần INV có mặt

**Buổi B1 – trên staging (khoảng 3 giờ 30 phút).**
- Khi nào: sau việc 2 và 3 ở 5.1. Sớm nhất 27–28/10.
- Ai có mặt: INV; MGR thật (nếu OTTIMO có quản lý); **một người chứng kiến thật** cho 06.33 (ví dụ lễ tân trưởng hoặc kế toán); ORC, OPS, SEC (chứng kiến, không giữ mã).

| Phần | Thời lượng | INV làm gì | Gỡ dòng |
|---|---|---|---|
| 1 | 15 phút | Đăng nhập tài khoản OWN dùng thử trên `desk.staging.ottimo.vn`, đổi mật khẩu tạm, đăng ký 2 bước bằng ứng dụng xác thực của mình, cất 10 mã khôi phục (bản thử). MGR thật làm như vậy. SEC chứng kiến qua màn hình, không xem mã | G2-4, UAT việc 1 |
| 2 | 30 phút | Diễn tập thủ tục 06.33 (khôi phục khi mất cả hai yếu tố) trên staging, cùng người chứng kiến. OPS ghi biên bản chỉ có kết quả | G2-5 |
| 3 | 2 giờ | UAT việc 2–9 (`uat-script.md`). Gặp lỗi thì gõ `/feedback` | A10, UAT |
| 4 | 20 phút | Trả lời 8 câu của DOM (`v1-production-defaults.md` mục 3): hạng Studio, tên phòng trên Desk, phí OTA, VAT, điện nước, Tết 2027, **hạn lưu ngắn nhất**, mục chờ luật sư/kế toán. Quyết **ESC-030** (form website). Xác nhận đã có danh sách nhân viên + vai (A2, không gửi đội) | G6-7, A3, A4, G7-2 |
| 5 | 25 phút | Tạo Healthchecks.io, UptimeRobot, phòng Google Chat (phần 6), gửi địa chỉ ping/webhook qua kênh riêng. Cất khóa sao lưu production ra trình quản lý mật khẩu + một bản ngoại tuyến (phần 9.3) | G4-10, G4-6 |

Không bắt buộc, làm riêng: UAT việc 10 sau 00:00 (20 phút, INV hoặc lễ tân trưởng).

**Buổi B2 – trên production (khoảng 2 giờ).**
- Khi nào: sau khi app production chạy, smoke đạt, SEC Verified OPS-01, QA-3 xong. **Ít nhất 1 ngày trước ngày chạy**, vì tài khoản nhận tiền có hiệu lực từ hôm sau. Dự kiến 30/10–01/11.
- Ai có mặt: INV; MGR thật; ORC, OPS, SEC, QA.

| Phần | Thời lượng | INV làm gì | Gỡ dòng |
|---|---|---|---|
| 1 | 20 phút | OPS chạy `production-bootstrap`, INV ngồi cạnh. Mật khẩu tạm chỉ hiện trên màn hình máy chủ. INV đăng nhập `desk.ottimo.vn`, đổi mật khẩu, đăng ký 2 bước, cất 10 mã khôi phục **thật** (giấy, 2 nơi) | B1, G2-7 |
| 2 | 10 phút | Chép KEK production ra bản ngoại tuyến (phần 4b) – trước khi có dữ liệu thật | G4-8 |
| 3 | 20 phút | B2 tài khoản nhận VietQR thật (gõ hai lần, xác thực lại); B4 mật khẩu Wi-Fi; B5 giá + tham số theo câu trả lời B1, gồm hạn lưu | G7-6, B2, B4, B5 |
| 4 | 20 phút | B6 tạo tài khoản nhân viên, đưa mật khẩu tạm tận tay. MGR đăng ký 2 bước ngay | B6, G2-7 |
| 5 | 35 phút | OPS chạy sao lưu đầu tiên → kéo về Mac → diễn tập khôi phục trong môi trường dùng một lần bằng khóa của INV → biên bản khớp số. INV chỉ cần mở khóa / có mặt | G4-7, G4-5 |
| 6 | 15 phút | Thư thử 8b: INV mở hộp thư `info@ottimo.vn` (cả Spam), xác nhận có thư "OTTIMO – Test message: e-mail delivery check / Thư thử: kiểm tra gửi email". SEC-G1/G2 và smoke đăng nhập của QA trên production; INV đăng nhập lại để kiểm cờ 2 bước | G4-9, G5-5, G7-5 |

Sau B2, QC chấm cổng v1.0 (G5-1). Nếu ĐẠT, INV làm B3 hôm sau, chọn ngày chạy, rồi làm B7, B9. Form website bật theo kết quả ESC-030.

---

## 6. Quy tắc QC sẽ dùng khi chấm (để đội biết trước)

1. Quyết định chỉ là **ĐẠT** hoặc **KHÔNG ĐẠT** (plan mục 3). Không dùng ĐẠT CÓ ĐIỀU KIỆN cho ĐK1–3.
2. Commit chấm là commit gắn tag `v1.0.0`. Nếu khác `2963675`:
   - diff chỉ ở `infra/`, tài liệu, landing → CI push xanh + T9 gần nhất + smoke production + SEC đọc diff `infra/` là đủ;
   - diff chạm `product/services`, `product/apps` (trừ landing), `product/packages` → QA-3 chạy lại phần liên quan, SEC chạy lại tệp liên quan (B.0 (7)). Chạm mã tiền thì phải có dòng ngoại lệ đóng băng trong decision-log.
3. G4-10 (báo động) và G6-5/G6-6 (hướng dẫn) không chặn deploy. Chưa xong thì QC ghi KHÔNG ĐẠT cho **ngày chạy với dữ liệu thật**, không chặn việc dựng production.
4. Form website (G7-2) không thuộc 5 điều kiện. Form tắt thì cổng v1.0 không xét. Form chỉ bật khi đủ 7 điều kiện SEC, hoặc theo phương án INV chọn ở ESC-030 có dòng decision-log.
5. Lỗi P0/P1 mới từ UAT hoặc QA-3 → KHÔNG ĐẠT tới khi đóng.

## 7. QC chưa kiểm được

- Nguyên nhân deploy production hỏng (cần đọc log trên máy chủ; QC không SSH).
- Nội dung thủ tục 06.33 và các khóa ngoài repo. SEC đọc, QC không đọc.
- Trạng thái thật của container/timer production, RAM khi hai stack cùng chạy.
- E2E trên staging với `MFA_ENFORCED=true`. Chưa ai chạy; thuộc QA-3.
- Nhân Hòa có bật bản chụp tự động hay không.

## 8. Giả định

| # | Giả định | Ai xác nhận |
|---|---|---|
| QC-G1 | Staging chạy image R2 (`4fd0651`) suốt 22–25/10, nên A1 chưa đi trên mã R3. Căn cứ: OPS 13 (deploy `4fab25b` chờ duyệt), OPS 16.1 (`rc.1` live 26/10 11:25), không thấy lượt CI push xanh nào khác có deploy staging trong khoảng đó | OPS (đọc `deploy-history.log` staging) |
| QC-G2 | INV đã cài khóa CI (9.1) và đặt 3 secret `PRODUCTION_SSH_*` (9.2), vì lượt Release đi tới bước `switch` trên máy chủ | OPS |
| QC-G3 | Plan đòi "đăng ký 2FA trước khi bật cờ" ở production. Bật cờ ngay từ DB trống đáp ứng mục đích đó (không ai bị khóa ngoài, OWN/MGR buộc đăng ký ở lần đầu) | ORC ghi decision-log |
| QC-G4 | Báo động (ESC-029 A) là điều kiện cho **ngày chạy**, không phải cho deploy | ORC |
| QC-G5 | Ca A.7 #14 (US-164) được SEC chấp nhận dời v1.1 vì US-164 thuộc v1.1 và ca 15 đạt nhờ fail-closed. SEC phải ghi rõ | SEC |
