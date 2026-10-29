# QA-3 – Hồi quy rút gọn trên `v1.0.0-rc.1` (staging) – phần 1

- Người chạy: QA | Round 3 – Bước **Kiểm thử** | Ngày: 26/10/2026, 15:09–15:50 (giờ VN). Phần 2 (A1 chặng 8–12) chạy sáng 27/10.
- Căn cứ: `rounds/round-03/qc/v1-gate-checklist.md` G5-6 (QA-3 (a)–(g)), G2-2 (ca 16), G1-6 (sổ R2), G6-1, G6-2, G7-1; decision-log 26/10 (INV "chạy hết đi" – QA dùng tài khoản `qa.*` trên staging).
- Đích: `desk.staging.ottimo.vn`, `staff.staging.ottimo.vn`, `g.staging.ottimo.vn` – image `sha-29636757822b` = tag `v1.0.0-rc.1` = commit `2963675`. Staging bật `MFA_ENFORCED=true` (OPS 16.2).
- Repo công khai: tệp này không ghi mật khẩu, secret TOTP, mã khôi phục, token link khách hay số tài khoản thật. Mọi dữ liệu nhập là giả.

## 1. Kết luận

| Ca | Kết quả | Ghi chú ngắn |
|---|---|---|
| (a) A1 chặng 1–7 (đặt + nhận phòng cùng ngày 26/10, 1 đêm) | **Đạt** | Đơn `OTM-00294`, căn 202, `in_house`, folio 792.000 đã thu đủ. Chặng 8–12: **27/10 sáng** |
| (b) Ca tiền trên staging | **Đạt** | `money-s4` 34/34, `gate-s4` 3/3, `stay-checkout.s3` (API) 9 đạt + 1 đỏ do dữ liệu (TC-L4-065, đã biết), `refund-credit.s4` 1 đạt + 2 bỏ qua (cần SQL) |
| (c) Ca giờ đêm / đồng hồ giả | Dẫn CI + chạy lại local | Không chạy được trên staging (image production). QA chạy lại ca tiền có đồng hồ trên stack dùng một lần (mục 4) |
| (d) 2FA khi cờ đã bật | **Đạt** | OWN/MGR bị buộc đăng ký; mọi thao tác 403 `MFA_ENROLLMENT_REQUIRED` trước khi đăng ký; đăng ký, đăng nhập 2 bước, mã sai, chống phát lại đều đúng; FD/FDL/HK không đổi |
| Ca 16 2FA có đồng hồ giả (G2-2) | **Đã thêm, đạt local** | `product/tests/e2e/ui-clock/mfa-us143-clock.r3s1.spec.ts` – 3 lượt xanh, 2 đột biến đỏ đúng chỗ |
| (e) R3-Q51 tài khoản nhận VietQR | **Đạt** | OWN lên lịch + hủy qua S2 (mật khẩu + TOTP); số luôn che; MGR/FD 403 và không thấy khối |
| (f) US-008 thêm người dùng | **Đạt** | OWN thêm `qa.e2e.us008.*` qua S2, mật khẩu tạm hiện một lần, buộc đổi mật khẩu; khóa lại xong; MGR/FD 403, không có menu |
| (g) S35 khi form tắt | **Đạt** (có ghi chú) | OWN, FDL thấy "Form đặt phòng trên website đang tắt"; FD không thấy dòng này (theo thiết kế, xem 3.7); SAL chưa kiểm |
| BUG-R2-208, 209, 210 | **Closed** | QA tự chạy lại 33/33 ca tích hợp + 13/13 E2E `debt-collect` có đồng hồ (mục 5) |

- **Không có lỗi P0, P1, P2 mới.** 2 lỗi P3 mới: **BUG-R3-015** (bộ test, QA) và **BUG-R3-016** (sản phẩm, PO/FE). Lỗi cũ thấy lại trên `rc.1`: **BUG-R2-219** (P3, hộp giữ chỗ khi khách đến hôm nay vẫn hiện mốc hết hạn đã qua), **BUG-R2-222** (P3, bộ test cần `E2E_LOCAL_CLOCK`).
- Điều kiện vào buổi B1 (không còn P0/P1 mở): QA-3 phần 1 không mở P0/P1.

## 2. Cách chạy

| Mục | Giá trị |
|---|---|
| Mã test | `git archive 2963675 product` vào scratchpad (`qa-r6/src-rc1/`). Repo không sửa cho lượt staging |
| Sửa trên bản chép (không vào repo) | (1) `E2E_LOCAL_CLOCK=1` như R-6 (BUG-R2-222 vẫn còn trên `rc.1`). (2) `freshSession`: gặp `401 MFA_REQUIRED` thì gửi bước 2 bằng TOTP thử của QA. (3) `createThrowawayUser`: S2 của OWN gửi kèm TOTP. (4) `ensureReceivingAccount` bỏ qua trên staging (hàm mới gọi `/health` và `/__test__/clock`). (2)–(4) là **BUG-R3-015** |
| Ca QA viết thêm (scratchpad) | `ui/qa-a1-rc1.spec.ts` (A1 cùng ngày), `ui/qa3-mfa.spec.ts`, `ui/qa3-q51-us008-s35.spec.ts`, `api/qa3-uat-data.api.spec.ts` + 4 tệp dò trạng thái |
| Bí mật | Mật khẩu seed đọc từ `~/.ottimo/staging/qa_seed_password.txt`, không in. Secret TOTP thử và 10 mã khôi phục của `qa.owner`, `qa.mgr` lưu ở `~/.ottimo/staging/totp/` (quyền 600), không in, không chụp (khung khóa và mã bị làm mờ trước khi chụp) |
| Trình duyệt | Playwright 1.63, Chromium, 1 worker, `--retries=0` |
| Giới hạn | Lần chạy A1 đầu gặp `429` đăng nhập (20 lần/IP/15 phút) do QA xóa nhầm bộ nhớ phiên. Chờ hết cửa sổ rồi chạy lại. Không phải lỗi sản phẩm |
| Gửi ra ngoài | Không. Không gọi `/__test__`, không quét VietQR |

## 3. Kết quả chi tiết

### 3.1 A1 chặng 1–7 – đặt và nhận phòng cùng ngày (26/10, 1 đêm)

Theo lệnh ORC: đến 26/10, đi 27/10, `A1_NIGHTS=1`. Khách đến hôm nay **không giữ chỗ được** (quy tắc đúng), nên chặng 2–3 đi đường "sale nhắn lễ tân tạo đơn đã thu" thay cho giữ chỗ + xác nhận cọc.

| # | Chặng | Ai | Kết quả | Ảnh (`a1-rc1/screens/`) |
|---|---|---|---|---|
| 1 | Báo giá: tìm căn trống 26/10, 1 đêm, 1 NL → báo giá căn 202 | `qa.sal` | Đạt – tổng 792.000, cọc 200.000 (`saveQuote` 201) | 001–003 |
| 2a | Giữ chỗ khi khách đến hôm nay | `qa.sal` | Đạt phần quy tắc – "Khách đến hôm nay thì không giữ chỗ được…", nút "Tạo giữ chỗ" khóa. **BUG-R2-219 vẫn còn**: bộ chọn "Giữ trong 12/24/48 h" và "Hết hạn 12:00 26/10" (đã qua) vẫn hiện | 004 |
| 2b–3 | Lễ tân tạo đơn đã thu (H09): căn 202, cọc 200.000 qua VietQR (mã giao dịch giả) | `qa.fd` | Đạt – `OTM-00294` 201 `confirmed`, đã cọc 200.000 | 005–006 |
| 4 | Link check-in online từ Desk | `qa.fd` | Đạt – token và QR che trên ảnh | 007, 011 |
| 5 | Khách check-in online (390×844): thông báo dữ liệu, gửi ảnh CCCD giả qua Caddy thật (201), khách 2 "Bổ sung tại quầy", giờ đến, đồng ý (không chọn sẵn) | khách | Đạt – "Check-in online hoàn tất" | 008–010, 012–018 |
| 6 | Nhận phòng H13: giấy tờ khách 1 từ app (step-up mật khẩu, PATCH 200); lễ tân nhập tay giấy tờ khách 2 (POST 201); bước Kiểm tra: đánh dấu "Tôi đã kiểm – Đạt" + cách xử lý cho khách 2; Khai báo sau; thu tiền mặt 592.000 cùng lệnh nhận phòng | `qa.fd` | Đạt – trước nhận phòng còn thu 592.000 = 792.000 − 200.000; sau đó `in_house` | 101–108 (lượt 15:42), 102–106 lượt 15:39 (giấy tờ) |
| 7 | Lưu trú: đơn Đang ở, Sơ đồ phòng | `qa.fd` | Đạt – folio tổng 792.000, đã thu 792.000, còn 0; căn 202 = OC | 109–110 |

Trạng thái cuối ngày (15:42, API): `OTM-00294` `in_house`, căn 202 OC, folio `open`, còn thu 0. Chặng 8–12 (trả phòng H16, VietQR thu nốt, PWA dọn + kiểm phòng) chạy **27/10 sáng** bằng `A1_PART=3` (state ở `a1-rc1/state.json`).

Ghi chú về cách chạy:
- H09 mặc định **2 người lớn**, còn báo giá của sale là 1 người lớn. Giá phòng không đổi (792.000), nhưng đơn có 2 khách nên khách 2 phải "Bổ sung tại quầy" và lễ tân nhập tay. Ghi thành **BUG-R3-016** (P3): không có đường chuyển báo giá đến-hôm-nay thành đơn, lễ tân nhập lại từ đầu.
- Lượt chạy chặng 4–7 phải chạy lại 3 lần vì kịch bản QA (bước "Kiểm tra" cần đánh dấu tay + ghi cách xử lý cho giấy tờ nhập tay). Mỗi lần dừng **trước** lệnh nhận phòng, không ghi trùng tiền.
- Ở hộp nhập tay khách 2, ô "Người trong đoàn" chỉ có "Người ở chưa có trong đơn" (đơn 2 người lớn nhưng người thứ 2 chưa có tên). Sau khi lưu, H13 vẫn tính đúng "2 khách", không thừa người. Không ghi lỗi.

### 3.2 Ca tiền trên staging (API, giờ thật)

| Tệp | Đạt | Đỏ | Bỏ qua | Ghi chú |
|---|---|---|---|---|
| `api/money-s4.api.spec.ts` | 34 | 0 | 0 | Gồm các ca có duyệt của `qa.mgr` (đã bật 2FA) |
| `api/gate-s4.api.spec.ts` | 3 | 0 | 0 | |
| `api/stay-checkout.s3.api.spec.ts` | 9 | 1 | 2 | Đỏ: **TC-L4-065** "chưa cấu hình tài khoản nhận" – staging đã có tài khoản thử từ 22/10 nên VietQR trả 201. Đúng như `round-02/qa/staging-run.md` mục 8 đã báo trước; lỗi dữ liệu môi trường, không phải lỗi sản phẩm. Bỏ qua: 2 ca cần đồng hồ/SQL |
| `api/refund-credit.s4.api.spec.ts` | 1 | 0 | 2 | 2 ca cần SQL trực tiếp (giống R-6) |

QR thử trong lượt này hiện tài khoản nhận đã che (`9704••••6789`) – số tài khoản thử của bộ test, tên đã đổi thành "STAGING KHONG CHUYEN TIEN" (G7-3 đã xong trước lượt này). Không ai quét.

### 3.3 2FA khi `MFA_ENFORCED=true` (staging)

| # | Ca | Kết quả |
|---|---|---|
| 1 | `qa.owner` đăng nhập mật khẩu → `mfaEnrollmentRequired=true` | Đạt |
| 2 | Phiên hạn chế của OWN: `GET rooms`, `GET reservations`, `GET users`, `POST users`, `GET parameters` | Đạt – cả 5 trả **403 `MFA_ENROLLMENT_REQUIRED`**; `GET /v1/me/2fa` 200 |
| 3 | Desk: OWN đăng nhập → thẳng tới "Bật xác thực 2 bước", không có menu; gõ `/overview` → quay về màn đăng ký | Đạt (ảnh `qa3/mfa/screens/001–002`) |
| 4 | Đăng ký trên Desk: khóa cài đặt + QR, mã xác nhận, 10 mã khôi phục hiện một lần, "Hoàn tất" khóa tới khi tích ô "đã cất riêng"; sau đó vào Desk, `rooms` 200 | Đạt (003–005, khóa và mã đã làm mờ) |
| 5 | Đăng nhập lại: bước mã 6 số; **mã sai** → "Mã chưa đúng hoặc đã hết hạn…", không vào; mã đúng → vào | Đạt (006–008) |
| 6 | `qa.mgr` qua API: phiên hạn chế 403 trên `rooms`, `reservations`, `approval-requests`; đăng ký (setup `no-store`, confirm 10 mã); phiên cũ 401, phiên mới 200; đăng nhập lại `401 MFA_REQUIRED` không cookie; bước 2 → 200; dùng lại `mfaToken` + mã vừa dùng → **401 `MFA_INVALID`** | Đạt |
| 7 | `qa.fd`, `qa.fdl`, `qa.hk`: đăng nhập 200, `mfaEnrollmentRequired=false` | Đạt |

Hệ quả cho đội: từ 26/10 15:17, **`qa.owner` và `qa.mgr` đã bật 2FA trên staging**. Ai dùng hai tài khoản này cần TOTP thử ở `~/.ottimo/staging/totp/` (README cùng thư mục đã ghi). INV dùng tài khoản OWN dùng thử riêng (G7-4), không dùng `qa.owner`.

Một lần đỏ của QA ở lượt đầu: `POST /v1/users` trả `403 FORBIDDEN_ACTION` (detail "CSRF token") vì ca gửi cookie thô không kèm CSRF. Ca sửa lại dùng phiên của bộ test → 403 `MFA_ENROLLMENT_REQUIRED`. Lỗi của ca, không phải sản phẩm.

### 3.4 Ca 16 2FA có đồng hồ giả (G2-2, SEC A.7 #16 – G1 của `s1-SEC-on-2FA.md`)

- Tệp mới trong repo: `product/tests/e2e/ui-clock/mfa-us143-clock.r3s1.spec.ts` (project `desk-clock`, cần `E2E_UI=1` + đồng hồ giả – chạy trên CI và stack dùng một lần, **không** chạy trên staging).
- Đồng hồ stack (MutableClock, đóng băng) và đồng hồ trình duyệt (`page.clock`, dừng) đặt cùng nhau. Tài khoản tạm `qa.e2e.clk2fa.*` (FDL, bật 2FA tự nguyện).

| Mã | Mốc | Kỳ vọng | Kết quả |
|---|---|---|---|
| S1-CLK-17 | Bước mã 4:59 sau bước mật khẩu | Mã đúng → vào Desk | Đạt |
| S1-CLK-17 | 5:00 (máy chủ), trình duyệt 4:59 | Mã đúng vẫn **401 `MFA_INVALID`**, Desk báo một câu chung; tới 5:00 trình duyệt Desk tự về bước mật khẩu kèm "Bước nhập mã đã hết hạn…" | Đạt |
| S1-CLK-14 | Mã bước −2, +2 | Từ chối | Đạt |
| S1-CLK-14 | Mã bước +1; 90 giây sau mã bước −1 | Nhận | Đạt |
| S1-CLK-15 | Dùng lại mã bước −1 vừa dùng (còn trong cửa sổ) | Từ chối; mã bước 0 chưa dùng → nhận | Đạt |

- Chạy trên stack dùng một lần `ottimo-qa3` (compose dev, ảnh dựng từ `HEAD` `623a258`; `product/services`, `apps`, `packages` không đổi so với `2963675`): **3 lượt xanh** (1 lượt riêng + 2 lượt kèm ca 16 gốc). Ca 16 gốc `ui/mfa-us143.r3s1.spec.ts` 1/1 và `api/mfa-s2.r3s1.api.spec.ts` 2/2 cũng xanh trên stack này.
- Kiểm đột biến: đổi mốc 5:00 thành 4:58 → ca đỏ "Expected 401, Received 200"; đổi mã +2 thành +1 → ca đỏ ở "bước +2". Ca bắt được lỗi thật.
- prettier, eslint sạch. Ca 14 (US-164, v1.1) không thuộc lượt này – SEC ghi chấp nhận (QC-G5).
- Còn lại cho SEC: đọc ca, đối chiếu G1 và ghi Verified ca 16.

### 3.5 R3-Q51 – tài khoản nhận VietQR (OWN, staging)

| # | Bước | Kết quả |
|---|---|---|
| 1 | OWN mở Tham số → khối "Tài khoản nhận chuyển khoản (VietQR)": Đang dùng, số che `•••• 6789` | Đạt – không có dãy ≥ 7 chữ số trên màn |
| 2 | "Đổi tài khoản nhận": ô số trống, `autocomplete=off`; nhập lại khác số → "Hai số tài khoản chưa giống nhau"; hiệu lực = hôm nay → "Chọn ngày từ … trở đi" | Đạt |
| 3 | Xem lại → Lưu → S2 hỏi **mật khẩu + mã 6 số** (OWN có 2FA); mật khẩu sai → `PUT …/parameters/payment_receiving_account` **401**, không ghi | Đạt |
| 4 | S2 đúng → 200; dòng "Đã lên lịch" từ 27/10, số che | Đạt |
| 5 | `GET …/parameters/payment_receiving_account` (OWN): JSON không chứa số đầy đủ | Đạt |
| 6 | "Hủy lịch" → `cancel-scheduled` 204 → chỉ còn dòng "Đang dùng" như trước | Đạt – tài khoản đang dùng không đổi, A1 ngày 27/10 không bị ảnh hưởng |
| 7 | `qa.mgr`, `qa.fd`: API 403 `FORBIDDEN_ACTION`; màn Tham số không có khối | Đạt |

Số thử dùng trong lượt: số giả `000111222333`, tên "STAGING KHONG CHUYEN TIEN", đã hủy. Ảnh `qa3/q51/screens/001–010`.

### 3.6 US-008 – thêm người dùng (OWN, staging)

| # | Bước | Kết quả |
|---|---|---|
| 1 | OWN → Người dùng & vai → "Thêm người dùng": tên hiển thị, tên đăng nhập `qa.e2e.us008.hvggmm`, mật khẩu tạm sinh sẵn, vai Buồng phòng | Đạt |
| 2 | "Tạo tài khoản" → S2 (mật khẩu + mã 6 số) → `POST /v1/users` **201** | Đạt |
| 3 | Mật khẩu tạm hiện một lần (đã làm mờ trên ảnh); danh sách có người mới | Đạt |
| 4 | Người mới đăng nhập bằng mật khẩu tạm: 200, `mustChangePassword=true` | Đạt |
| 5 | Dọn: "Khóa tài khoản" → S2 → `PATCH` 200; phiên của người mới → 401 | Đạt |
| 6 | `qa.mgr`, `qa.fd`: `POST /v1/users` 403; không có menu "Người dùng & vai" | Đạt |

Ảnh `qa3/q51/screens/011–015`.

### 3.7 S35 – "Yêu cầu từ website" khi form tắt

| Vai | Menu | Dòng "Form đặt phòng trên website đang tắt" | Kết quả |
|---|---|---|---|
| `qa.owner` | Có | Có, kèm câu "Chỉ chủ đầu tư bật được form…"; ô trống "Form trên website đang tắt nên chưa có yêu cầu mới" | Đạt |
| `qa.fdl` | Có | Có (BUG-R3-010 vẫn đúng trên `rc.1`) | Đạt |
| `qa.fd` | Có | **Không** – ô trống ghi "Chưa có yêu cầu mới từ website" | Theo thiết kế: Desk chỉ đọc công tắc cho vai trưởng ca trở lên (`useFormSwitch`, LEADS); FD đọc tham số bị 403. TC-WR-011 chỉ đòi FDL. Không ghi lỗi. Gợi ý UXD/PO: cân nhắc cho FD thấy dòng "form đang tắt" để lễ tân không chờ yêu cầu |
| `qa.sal` | – | – | **Chưa kiểm** (ca dừng ở FD; hết khung giờ trước B1) |

Ảnh `qa3/q51/screens/016, 021–023`.

## 4. Ca giờ đêm và ca tiền có đồng hồ (không chạy được trên staging)

- Dẫn CI theo QC (G5-4): push `40199367309` và T9 `40226590285` trên `2963675` xanh, gồm project `clock` và `desk-clock` (ca giờ đêm 02:40/05:59/06:00).
- QA chạy lại trên stack dùng một lần `ottimo-qa3` (26/10 15:28–15:50):
  - `clock/stay-checkout.s3.clock.spec.ts`: 40 đạt, 2 bỏ qua có chủ đích, 0 đỏ;
  - `clock/debt-collect.s5.clock.spec.ts`: lượt đầu 10 đạt + 3 đỏ vì môi trường ("một căn sẵn sàng" – thiếu `E2E_COMPOSE_CONTROL=1` để dọn buồng); chạy lại với `E2E_COMPOSE_CONTROL=1` trỏ đúng stack: **13/13 đạt**.

## 5. Đóng BUG-R2-208, 209, 210

QA tự kiểm lại trước khi đóng (G1-6):
- Ca tích hợp trên PostgreSQL của stack `ottimo-qa3` (mã `services/api` giống `2963675`): `r3-folio-lines-208`, `r3-debt-210-209`, `r8ver-01`, `r8debt-01` → **4 tệp, 33/33 đạt**, 0 bỏ qua.
- E2E có đồng hồ `debt-collect.s5` 13/13 (mục 4).
- `pendingFix` của 208/209 đã gỡ hết trên `2963675` (QC G1-2). SEC Verified D.1–D.4 trên `880ea19` (`SEC-sprint1.md`). Fuzz G1 0 vi phạm (decision-log 24/10).
- Kết quả: **BUG-R2-208 (P2), 209 (P2), 210 (P3) → Closed** trong `rounds/round-02/qa/bug-list.md`.

## 6. Dữ liệu mẫu cho UAT buổi B1 (ORC giao thêm 26/10)

Dựng 15:36–15:45 bằng `qa.fd`, `qa.fdl` (và `qa.mgr` thử ghi công nợ). Kiểm lại 15:50: còn nguyên.

| # | Mục | Đơn | Căn | Trạng thái |
|---|---|---|---|---|
| 1 | Chờ nhận phòng hôm nay | `OTM-00295`, khách "Le Thi Cho Nhan", 26/10 → 28/10 | 301 | `confirmed`, đã cọc, còn thu 1.316.000, **chưa có giấy tờ** (để thử check-in online) |
| 2 | Đang ở, chờ trả phòng | `OTM-00296`, khách "Pham Van Dang O", 26/10 → 27/10 | 302 | `in_house`, folio còn thu 90.000 (2 cà phê) |
| 3 | Căn cần dọn | `OTM-00297`, khách "Hoang Thi Cong No", 26/10 → 27/10 | 401 | `in_house`, căn **OD** (lễ tân trưởng báo cần dọn); folio còn 150.000 F&B |
| 4 | Công nợ | – | – | **Chưa tạo được hôm nay.** Server chỉ cho trả phòng (B18, nơi ghi công nợ) vào đúng ngày đi: `409 INVALID_TRANSITION` "check-out on the departure business day". Đơn tạo hôm nay sớm nhất đi 27/10. Staging không còn đơn nào đi 26/10 và không có công nợ cũ. Đề xuất đã gửi ORC: 27/10 trả phòng `OTM-00297` kèm công nợ 150.000 (MGR), hoặc INV làm UAT việc 8 ngày 27/10 |

Lưu ý gửi ORC: "Cần chú ý" của OWN/MGR trên staging có **200 mục `closed_reservation_credit`** (rác của bộ test 22/10) cùng `registration_overdue OTM-00239` – INV sẽ thấy danh sách rất nhiễu ở UAT.

## 7. Lỗi

| ID | Mức | Tóm tắt | Vai |
|---|---|---|---|
| BUG-R3-015 | P3 | Bộ test không chạy được trên stack `MFA_ENFORCED=true` (staging/production): không có bước TOTP cho tài khoản DS-E OWN/MGR, S2 của `createThrowawayUser` thiếu mã, `ensureReceivingAccount` gọi `/health` + `/__test__/clock` vô điều kiện; `s2Context` dùng `qa.owner` hạn chế nên bỏ qua với lý do sai "DS-E chưa nạp đủ 10 căn" | QA |
| BUG-R3-016 | P3 | Khách đến hôm nay: báo giá đã lưu không chuyển thành đơn; sale chỉ được nhắn lễ tân, lễ tân nhập lại H09 từ đầu (mặc định 2 NL trong khi báo giá 1 NL, không mang khách/giá của báo giá) | PO (+ FE, UXD) |
| BUG-R2-219 | P3 (cũ) | Thấy lại trên `rc.1` (ảnh `a1-rc1/screens/004`) | FE |
| BUG-R2-222 | P3 (cũ) | Vẫn cần `E2E_LOCAL_CLOCK` trên `rc.1` | QA |

Chi tiết trong `rounds/round-03/qa/bug-list.md` mục 3.

## 8. Chưa làm / chưa kiểm được

- **A1 chặng 8–12**: 27/10 sáng (đi 27/10). Lệnh: `A1_NIGHTS=1 A1_EVIDENCE=<qa-r6>/a1-rc1 A1_PART=3 <qa-r6>/run-staging-rc1.sh <qa-r6>/a1-rc1/pw-output-3 --project=desk-chromium e2e/ui/qa-a1-rc1.spec.ts`.
- **Công nợ mẫu cho UAT**: 27/10 (mục 6).
- S35 với `qa.sal`.
- RBAC đầy đủ (`rbac` 1.5k ca) trên staging với `MFA_ENFORCED=true`: không chạy lượt này (khung giờ B1 16:30–19:30 không được chạy script trên staging). Các ca RBAC của OWN/MGR cần bản sửa BUG-R3-015 mới chạy được.
- QA-3 phần production (smoke sau deploy): chờ G4-1.

## 9. Bằng chứng (ngoài repo)

Thư mục gốc: `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/qa-r6/`.
- `a1-rc1/` – `run-log.md`, `state.json`, `screens/001–018`, `101–110`, `video/` (chỉ phiên guest-web; phiên Desk có link khách/QR không quay).
- `qa3/mfa/` – `run-log.md`, `screens/001–008`; `qa3/q51/` – `run-log.md`, `screens/001–023`; `qa3/money/run1.log`.
- `uat-data/uat-data.md`, `uat-data.json`.
- `run-staging-rc1.sh`, `src-rc1/` (bản chép `2963675` + tệp `*.orig` gốc của các tệp đã sửa).
- Stack dùng một lần: `.../scratchpad/qa3-stack/` (`run-local.sh`, `clock-money*.log`, `out-*`). Stack `ottimo-qa3` còn chạy (cổng 3000/8081–8083/5432), dừng sau khi xong phần 2.

## 10. Phản hồi & sửa 26/10 tối – BUG-R3-015 vào repo + smoke production chỉ đọc

- Harness chạy được trên stack `MFA_ENFORCED=true`: `E2E_TOTP_DIR` (secret thử ngoài repo), `E2E_TOTP_ENROLL=1` (stack dùng một lần), S2 có mã, `ensureReceivingAccount` không gọi `/health`/`/__test__` trên đích không có test-support, `E2E_LOCAL_CLOCK` (BUG-R2-222 (1)). Chi tiết và số liệu kiểm: `bug-list.md` BUG-R3-015.
- Smoke production chỉ đọc: `product/tests/e2e/smoke-prod/readonly.prod.spec.ts` (project `smoke-prod`, cần `E2E_PROD_SMOKE=1`), lệnh chạy ở `product/tests/README.md`. Dùng ở B2 phần 6 (G5-5) và sau mỗi deploy production.
- Không chạy gì trên staging. Sáng 27/10: A1 chặng 8–12 (harness repo, `E2E_TOTP_DIR=~/.ottimo/staging/totp`, `E2E_LOCAL_CLOCK=1`), thử `smoke-prod` PS-01…05 trên staging (cùng Caddyfile.prod), rồi trả phòng `OTM-00297` kèm công nợ 150.000 (MGR) cho UAT.

## 11. ESC-031 – kiểm tiền điều kiện gộp cuối (SEC 8.6 (3)) trên stack bật 2FA bắt buộc

- Người chạy: QA | 26/10/2026, 16:45–17:15 | Bước **Kiểm thử**. Không dùng staging (B1 đang chạy).
- Mã: nhánh gộp `worktree-agent-a67639f06f6add4d9`, tip **`c7ba6b5`** (BE-B `35a477c`, ARC `e386928`, FB-03 `66d88e7`, FE-A `6f72a9c`, UXD `c7ba6b5`). Dựng bằng `git archive c7ba6b5 product`; repo không sửa.
- Stack dùng một lần `ottimo-esc031` (compose dev, đồng hồ ảo, test-support, DS-E), chạy hai pha:
  - pha 1 – `MFA_ENFORCED=false` (như CI): hồi quy và TC-X-086;
  - pha 2 – **`MFA_ENFORCED=true`** (`printenv` api/worker = `true`): harness BUG-R3-015 tự đăng ký 2FA cho `qa.owner`, `qa.mgr`, rồi chạy UI và E31.
- Ca QA viết cho lượt này (scratchpad, chưa vào repo vì `main` chưa có mã ESC-031):
  - `tests/e2e/clock/qa-esc031.r3.clock.spec.ts` – 11 ca E31 + I-E31 qua HTTP thật;
  - `tests/e2e/ui-clock/qa-esc031-ui.spec.ts` – Desk H16.
  - Đề nghị gộp hai tệp này vào nhánh khi gộp ESC-031.

### 11.1 Kết luận: **ĐẠT** điều kiện gộp về tiền – kèm 1 lỗi P1 mới ngoài phạm vi bản vá (BUG-R3-017)

| Hạng mục | Kết quả |
|---|---|
| E31-1…E31-11 + I-E31 (oracle DOM `s1-money-oracle.md` 10.1) trên stack 2FA bắt buộc | **14/14 Đạt** (lượt cuối 17:11, 13,6 s) |
| UI Desk khi 2FA bắt buộc | **Đạt** – một cách duy nhất, không ô mật khẩu, body `lateFeeInsteadOfNight` đúng 3 trường; 409 và 422 hiện câu đúng, không ghi gì |
| TC-X-086 (axe, đồng hồ ảo, cờ tắt – có hai cách) | **Đạt** 1/1 |
| Hồi quy tiền trên nhánh (cờ tắt) | `clock`: `money-s4` + `stay-checkout.s3` + `debt-collect.s5` **63 đạt**, 1 bỏ qua có chủ đích. `api`: `money-s4` + `stay-checkout.s3` + `refund-credit.s4` + `gate-s4` **50 đạt**, 2 bỏ qua (cần SQL). `desk-clock`: `checkout.h16`, `flow-a1.s4`, `stay-money.s4`, `axe-k8.s4`, `debt-collect.s5` **19/19** |
| Tích hợp BE trên PostgreSQL của stack | `esc031-late-fee-post-review` + `esc031-units` + `s438-r8` (14 tệp) **104/104** |
| Lỗi mới | **BUG-R3-017 (P1)**: lễ tân không ghi được **tiền mặt/thẻ** cho phụ thu bằng 1 đêm ở bước 3. Lỗi có từ R2 (0.3.7), không do bản vá ESC-031 gây ra. Nhưng ESC-031 là đường duy nhất trên production, nên lỗi chặn trả phòng thu tiền mặt. Đường vòng: VietQR hoặc chuyển khoản |

### 11.2 Kết quả từng ca E31 (MFA_ENFORCED=true, API thật)

Ngày trong oracle (2030) được dời nguyên số tuần, giữ thứ trong tuần, sang sau mọi mốc đồng hồ stack đã đi qua. Lý do: đồng hồ ảo của các bộ clock pha 1 đã qua 2031, và mã TOTP của OWN/MGR chỉ được dùng tiến (chống phát lại). Ngày lễ 30/04 thay bằng một ngày đặc biệt QA thêm vào `special_dates` (OWN, hiệu lực hôm sau; `to` không tính – như dữ liệu DS-E).

| Ca | Kết quả đo | Kết luận |
|---|---|---|
| E31-1 | B18 200; dòng `late_fee_as_night` **792.000**, không FOC; khách trả 792.000. Audit `post_review`: actor = FD, không `confirmedBy`, `checkoutTime` 20:30, `reviewDueAt` = `post_checkout_window_until` = lúc bấm + 24 giờ. Thông báo: OWN 1, MGR 1, FD 0, FDL 0. "Cần chú ý": MGR 1 (hạn đúng), OWN 1, FD 0. Audit bảo mật mới 0, đếm sai mới 0 | Đạt |
| E31-2 | Đêm ngày đi thứ Sáu → **911.000** | Đạt |
| E31-3 | Đêm ngày đi ngày đặc biệt → **1.030.000** (không cộng thêm +15 %) | Đạt |
| E31-4 | Lượt 6 đêm → **792.000** (không 713.000) | Đạt |
| E31-5 | MGR A32 792.000 → 396.000 (201). Tự sinh yêu cầu hoàn **396.000** `pending`, người xin MGR. MGR tự duyệt → **403 `SELF_APPROVAL_FORBIDDEN`**; OWN duyệt → 200. Không báo OWN thêm. MGR "Đã xem" → 204, mục hết; FD đóng → 404. Job quá hạn sau đó không báo thêm | Đạt. Mã 403 khác chữ oracle (`SELF_REFUND_FORBIDDEN` là mã của bước **chi** hoàn) – đề nghị DOM sửa câu oracle |
| E31-6 | MGR A32 `voidLine` → hoàn **792.000**; không báo OWN thêm; tiền dư 792.000 | Đạt |
| E31-7 | Job 20:34: OWN 1, MGR 1. 20:35: OWN **2**. Thêm 3 lần: vẫn 2, MGR 1. Mục vẫn mở. J15 đóng folio; A32 sau đó → **409 `FOLIO_LOCKED`** | Đạt |
| E31-8 | MGR đặt trả muộn 17:00 kèm FOC 200.000 (MGR áp ngay). B18: phụ thu 792.000, xem trước = **592.000**, FOC ròng **200.000**. A32 → 396.000: FOC ròng 200.000, hoàn **396.000**. Biến thể A32 → 150.000: FOC ròng **150.000**, hoàn **592.000** = số khách đã trả cho khoản này | Đạt |
| E31-9 | FD xin FOC 200.000 trên phụ thu trả muộn (`pending`). B18 → **409 `PENDING_APPROVALS`**. Trước/sau: `in_house`, 4 dòng, 0 audit, 0 thông báo | Đạt |
| E31-10 | 692.000 và 792.001 → 409 `SURCHARGE_CHANGED`. `requestFoc`, mật khẩu, TOTP, `confirmationId`, `approverUsername` → 422 `NOT_ALLOWED` (MGR gửi kèm mật khẩu cũng 422). Thiếu lý do → 422 `REASON_REQUIRED`. Đêm bán được → 422 `NOT_ALLOWED`. Mọi ca: `in_house`, số dòng/audit/thông báo không đổi | Đạt |
| E31-11 | MGR tự bấm B18 → 200; OWN 1 thông báo, MGR 0; mục mở cho MGR và OWN; audit `post_review`, actor MGR | Đạt |
| I-E31 | 11 đơn có ghi phụ thu: Σ hoàn ≤ đã trả; ròng phụ thu sau FOC ≥ 0; số ghi = `lateFeeAsNightVnd` của summary đọc ngay trước. Đơn E31-9 không ghi gì nên không xét | Đạt |

Ghi chú cách chạy: ba lượt đầu đỏ vì ca của QA, không phải sản phẩm. QA sửa ca rồi chạy lại cả chuỗi trên dữ liệu mới, lần cuối 14/14. Các lỗi của ca:
- thiếu `Idempotency-Key` khi gọi `resolve` (428);
- A32 hủy dòng phải gửi `voidLine`;
- `special_dates` có `to` không tính;
- đếm FOC phải cộng cả dòng đảo;
- E31-9 cần FOC do FD xin (FOC của MGR được áp ngay, không chờ);
- đếm audit bảo mật toàn bảng thay vì phần tăng thêm.

### 11.3 UI Desk khi 2FA bắt buộc (`rounds/round-03/outputs/FE/esc031-shots/`)

| Ảnh | Nội dung |
|---|---|
| `01-buoc3-mot-cach-mfa.png` | Bước 3: chỉ có "Ghi phụ thu – quản lý xem lại". Không có "Quản lý xác nhận tại quầy" (0 nút, 0 radio), 0 ô mật khẩu. Số 792.000 chỉ đọc, ô Lý do |
| `02-buoc3-tien-mat-bi-doi-ly-do.png` | **BUG-R3-017**: tiền mặt 792.000 → `POST payments` 422 `note REASON_REQUIRED`. Màn báo "Ghi lý do (ít nhất 3 ký tự)" nhưng phần tiền mặt không có ô nào để ghi |
| `02b-buoc3-da-thu-vietqr.png` | Thu bằng VietQR (truyền ngữ cảnh trả phòng) → ghi nhận được, còn phải thu 0 |
| `03-hop-xac-nhan-fb02.png` | Hộp xác nhận (UXD FB-02): "Phụ thu trả muộn 792.000 đ được ghi vào folio; quản lý nhận thông báo để xem lại." |
| `04-sau-409-so-moi.png` | Sau 409 `SURCHARGE_CHANGED` (QA sửa số trong request gửi đi để giả lập lệch; server trả 409 thật): "Phụ thu vừa được tính lại: 792.000 đ. Chưa ghi gì…"; đơn vẫn `in_house` |
| `05-tra-phong-xong.png` | Hoàn tất lại → 200. Body: `lateFeeInsteadOfNight = {amountVnd, reason, postReview: true}` – đúng 3 trường (cấp trên còn `checkoutTime`, `applyLateSurcharge: false`) |
| `06a-…`, `06-sau-422-dem-ban-lai-duoc.png` | Khách đến sau hủy trong lúc lễ tân ở bước 3 → B18 trả 422 `NOT_ALLOWED`. Desk báo "Đêm nay căn đã trống lại…" và quay về bước Phụ phí với "tính thêm 1 đêm"; đơn vẫn `in_house` |

Ghi chú nhỏ (không ghi lỗi): khi 2FA bắt buộc, ô chọn cách vẫn hiện như một nút đơn "Ghi phụ thu – quản lý xem lại". UXD có thể cân nhắc đổi thành nhãn tĩnh.

### 11.4 Harness

Để chạy được ESC-031 trên stack vừa bật 2FA vừa dùng đồng hồ ảo, QA sửa thêm bộ test (BUG-R3-015 phần 2), commit cùng mục này:
- mã TOTP tính theo **đồng hồ của stack** (`totpNow`: `/health`, hoặc giờ máy khi `E2E_LOCAL_CLOCK=1`), dùng bước kế tiếp trong cửa sổ ±1 trước khi phải chờ;
- báo lỗi rõ khi đồng hồ ảo đứng và đã hết bước;
- `trustCurrentDevice` của OWN (thiết bị quầy ảo, thiết bị dự phòng) gửi kèm mã.

Giới hạn còn lại:
- mã TOTP chỉ dùng **tiến**: một stack mà OWN/MGR đã đăng nhập ở mốc ảo xa thì không quay lại giờ thật được;
- trên CI cờ 2FA vẫn tắt nên không ảnh hưởng.

## 12. ESC-031 kiểm lại sau bản sửa BUG-R3-017 – **ĐẠT**

- 26/10 ~17:20–17:45. Không dùng staging.
- Nhánh `worktree-agent-a67639f06f6add4d9`: tip `64bf5c0` (đã rebase trên `origin/main`; gồm hai bộ ca ESC-031 của QA). Ảnh web dựng lại ở **`67fc853`** (FB-14/15/16: chữ, chặn rời trang).
- Stack `ottimo-esc031` dựng mới từ đầu (DB mới):
  - pha 1 – cờ 2FA tắt: hồi quy tiền;
  - pha 2 – `MFA_ENFORCED=true`: ca ESC-031 và BUG-R3-017.

| Hạng mục | Kết quả |
|---|---|
| E31-1…E31-11 + I-E31 (`clock/qa-esc031.r3.clock.spec.ts` trên nhánh) | **14/14 Đạt** (17:34) |
| UI ESC-031 (`ui-clock/qa-esc031-ui.spec.ts`), web `67fc853` | **Đạt**: một cách, 0 ô mật khẩu; tiền mặt không gửi `/payments`, B18 mang `finalPayment` 792.000; `lateFeeInsteadOfNight` đúng 3 trường; 409 → "Phụ thu vừa được tính lại…"; 422 khi đêm bán lại được |
| BUG-R3-017 – tiền mặt/thẻ POS ở bước 3 (ca QA `ui-clock/qa-bug017.spec.ts`), web `67fc853` | **4/4 Đạt**: ESC-031 + POS; đêm thêm thường + tiền mặt; đêm thêm thường + POS; ESC-031 + folio đã nợ 70.000 + tiền mặt 862.000. B18 200, folio `settled`, còn 0, không dư |
| Hồi quy tiền (cờ tắt) | `clock` money-s4 + stay-checkout.s3 + debt-collect.s5: **63 đạt**, 1 bỏ qua. `desk-clock` checkout.h16, flow-a1, stay-money, axe-k8 (gồm TC-X-086), debt-collect: **19/19**. `api` money-s4 + stay-checkout.s3 + gate-s4: **47 đạt**, 2 bỏ qua |
| admin-web (vitest) | **625/625** trên `67fc853` |

Ảnh mới ở `rounds/round-03/outputs/FE/esc031-shots/`:
- `01`, `03`–`06` chụp lại;
- `02-buoc3-tien-mat-ghi-khi-hoan-tat.png` thay cho ảnh lỗi `02-buoc3-tien-mat-bi-doi-ly-do.png` (ảnh lỗi giữ lại làm bằng chứng);
- `bug017-{A,B,C,D}-*-buoc3.png` và `-hop-xac-nhan.png`.

Còn lại:
- Ca `ui-clock/qa-bug017.spec.ts` đang ở scratchpad (`esc031b/product/tests/e2e/ui-clock/`). Đề nghị FE-A đưa vào nhánh, cùng điều kiện `E2E_TOTP_DIR` như hai bộ ca ESC-031.
- BUG-R3-017 chuyển Closed khi nhánh gộp và CI xanh.

## 13. Kiểm nhanh `v1.0.0-rc.2` trên staging (26/10 22:54–23:10)

- Bản: staging `4629e6e` = tag `v1.0.0-rc.2`; CI push `4629e6e` xanh.
- Harness repo `4629e6e` (BUG-R3-015 có sẵn): `E2E_TOTP_DIR=~/.ottimo/staging/totp`, `E2E_LOCAL_CLOCK=1`, không có test-support. Bộ chạy ở scratchpad: `qa-r6/run-staging-rc2.sh`, `qa-r6/src-rc2`.
- Tài khoản `qa.*`; `qa.owner` dùng TOTP thử.
- Không đụng OTM-00294 (căn 202). Không ảnh nào có QR.

| # | Việc | Kết quả |
|---|---|---|
| 1 | Smoke `smoke-prod` chỉ đọc trên staging | **Đạt 9/9**: PS-01 desk/staff/guest 200 + header bảo mật đúng từng giá trị (HTTPS thật); PS-02 `/health`, `/__test__` 404; PS-03 401; PS-04 không request ghi, không lỗi JS; PS-05; PS-06 với `qa.fd` và với `qa.owner` (bước 2FA, `mfaEnabled` đúng) |
| 2 | ESC-031 `postReview` + tiền mặt `finalPayment` | **Chưa chạy được tối nay (giờ thật):** không có đơn nào trả phòng hôm nay 26/10. Đơn mới tạo sớm nhất trả 27/10, và phụ thu bằng 1 đêm chỉ có khi trả muộn đúng ngày đi. **Đã dựng sẵn:** OTM-00357 căn 203, 26→27/10, đã nhận phòng 22:58, tiền phòng đã thu; OTM-00358 căn 203 đến 27/10 (đêm ngày đi không bán được). `checkout-summary` 20:30 xem trước: `lateFeeAsNightVnd` **792.000**, `extraNightAvailable` false. **Chạy 27/10 sau 18:00** (≈ 20:30): B18 `postReview` + tiền mặt qua Desk, rồi hủy OTM-00358 |
| 3 | FB-INV-005 – giá đêm 102 từ ngày mai | **Đạt** (kèm **BUG-R3-018**, P2) – chi tiết dưới bảng |
| 4 | `checkin_time` 12:00 + bậc nhận sớm như production | **Đặt xong, chưa kiểm số** – chi tiết dưới bảng |

Mục 3 – FB-INV-005:
- Giá đêm 102 trên staging trước lượt QA là **850.000**, hiệu lực 26/10 (giá tháng 10.200.000), không phải 750.000 của seed.
- Qua Desk (`qa.owner`): Danh mục căn → Sửa 102 → giá đêm 700.000, hiệu lực 27/10 → PATCH 200.
- `calculateQuote` (kênh Trực tiếp, 2 NL):

  | Đêm | Kết quả |
  |---|---|
  | 26/10 (hôm nay) | 850.000 – không đổi |
  | 27/10 | **700.000** |
  | 28/10 | **700.000** |
  | 30–31/10 (thứ Sáu, thứ Bảy) | **805.000 × 2 = 1.610.000** (= 700.000 × 1,15) |

- Trả lại giá cũ:
  - Lần 1 QA nhầm, trả về 750.000 (giá seed) trong khoảng 3 phút. Giá đó lên lịch từ 27/10, không đơn nào bị ảnh hưởng.
  - Desk không cho trả về 850.000 (**BUG-R3-018**), nên QA đặt bằng API `PATCH rooms/102` 850.000 hiệu lực 27/10.
  - Sau khi sửa: 27/10, 28/10 = **850.000**; 30–31/10 = **978.000 × 2** (= 850.000 × 1,15).
  - Lịch sử giá 102 còn hai dòng thừa: 750.000 rồi 850.000, cùng hiệu lực 27/10.
- Ảnh: `qa-r6/rc2/screens/fb005-*.png`. Ảnh `fb005-hoan-ngan-keo.png` chụp lúc ngăn kéo còn đang hiện dần, nên trông như trong suốt – không phải lỗi.

Mục 4 – `checkin_time` 12:00 và bậc nhận sớm:
- `qa.owner` đặt `checkin_time` = 12:00 và `early_checkin_tiers` = [10:00–12:00 30 %, 06:00–10:00 50 %], đúng như `production-defaults.ts`, hiệu lực **27/10** → 200 / 200.
- Tham số chỉ cho hiệu lực từ ngày mai, nên tối nay `check-in-preview` của OTM-00358 vẫn trả `standardCheckinTime` 14:00.
- **Kiểm sau 06:00 27/10** (ngày nghiệp vụ mới, trước A1): xem trước nhận phòng 11:00 = **30 %** × 792.000 = **238.000**; 12:30 = **0**; 09:00 = 50 %.

**Kết luận rc.2 tối 26/10:**
- Không có lỗi P0/P1 mới. **1 lỗi P2 mới: BUG-R3-018.**
- Mục 1 và 3 Đạt. Mục 2 và 4 làm tiếp ngày 27/10 vì giờ thật.
- BUG-R3-015, BUG-R3-017 → Closed (rc.2 có bản sửa, CI xanh).

**Việc 27/10:**
1. Sau 06:00: xem trước nhận sớm 11:00 / 12:30 / 09:00 trên OTM-00358.
2. A1 chặng 8–12 (OTM-00294), rồi trả phòng OTM-00297 kèm công nợ 150.000.
3. Sau 18:00: B18 OTM-00357 đường `postReview` + tiền mặt, rồi hủy OTM-00358.

## 14. Sáng 27/10 trên staging `v1.0.0-rc.2` (06:01–06:02)

Harness repo `4629e6e` (`qa-r6/run-staging-rc2.sh`). Báo ORC lúc 06:02 để deploy rc.3.

| # | Việc | Kết quả |
|---|---|---|
| 1 | Xem trước phụ thu nhận sớm OTM-00358 (căn 203, đêm đầu 792.000; tham số từ 27/10: `checkin_time` 12:00, bậc 10:00–12:00 30 %, 06:00–10:00 50 %) | **Đạt.** `standardCheckinTime` 12:00. 09:00 → 50 % = **396.000**; 11:00 → 30 % = **238.000**; 11:59 → 238.000; 12:00 → **0**; 12:30 → **0**; 13:30 → 0 (`ruleRef` BR-411) |
| 2 | A1 chặng 8–12 OTM-00294 (căn 202) | **Đạt** – chi tiết dưới bảng |
| 3 | Công nợ mẫu UAT: trả phòng OTM-00297 (căn 401) | **Đạt.** `qa.mgr` (2FA) B18 ghi công nợ 150.000, hạn 30/10 → 200; đơn `checked_out`, folio `settled` còn phải thu 150.000; "Cần chú ý" MGR có `checkout_debt` (1 mục, hạn 30/10) |

A1 chặng 8–12 (ảnh `a1-rc1/screens/201–212`, `run-log.md` phần 3):

| Chặng | Việc | Kết quả |
|---|---|---|
| 8 | Minibar 2 bia, 1 snack, 2 nước | Bill còn thu 100.000 |
| 9 | VietQR thu nốt | Đã thu (ảnh 204: QR, số tài khoản, tên chủ tài khoản đều che) |
| 10 | Hoàn tất trả phòng | Folio `settled`, bill F26-000002, đã thu 892.000, còn 0 |
| 11 | PWA buồng phòng `qa.hk` | VD → CL → VC |
| 12 | PWA lễ tân trưởng `qa.fdl` kiểm phòng | Đạt → VI |

**A1 trên bản RC: trọn 12/12 chặng trên giờ thật**:
- 26/10: chặng 1–7 trên `rc.1` (đặt và nhận phòng cùng ngày);
- 27/10: chặng 8–12 trên `rc.2`.
- Hai bản cùng chuỗi `main`; `rc.2` thêm ESC-031, BUG-R3-017, nhận phòng 12:00, giá đêm nhập riêng.

Không lỗi mới.

Còn tối 27/10 sau 18:00: B18 OTM-00357 đường `postReview` + tiền mặt (mục 13 việc 2), rồi hủy OTM-00358.

## 15. rc.3 staging 27/10 – xác nhận BUG-R3-018 phần 2 + smoke-prod (07:25–07:36)

- Bản: staging `70fe734` = tag `v1.0.0-rc.3`, image api/web/worker `sha-70fe734e9077`. Gói Desk đang phục vụ có 3 chuỗi mới của bản sửa (`rooms.saved_scheduled`, `rooms.price_same_*`). CI push `70fe734` (40416908930) xanh. Lượt Release `rc.3` đang chờ duyệt production.
- Harness repo `70fe734`, chép bằng `git archive`. Bộ chạy ở scratchpad: `qa-r6/run-staging-rc3.sh`, `qa-r6/src-rc3`. Biến môi trường: `E2E_TOTP_DIR=~/.ottimo/staging/totp`, `E2E_LOCAL_CLOCK=1`. Mật khẩu `qa.*` đọc từ tệp ngoài repo, không in ra.
- Phạm vi: chỉ phần 2 của BUG-R3-018. Phần 1 (danh sách giá đã lên lịch, hợp đồng 0.3.9, hủy lịch) dời sang v1.0.1 theo decision-log 26/10, nên không kiểm.
- Căn thử: **101** (The Amber), có đơn `OTM-00355` (28→29/10, `confirmed`). Không đụng căn 203, OTM-00357, OTM-00358. Ảnh không có QR hay số tài khoản (màn Danh mục căn).

### 15.1 Kết luận

| # | Việc | Kết quả |
|---|---|---|
| 1 | BUG-R3-018 phần 2: OWN lên lịch giá sai, rồi trả về giá đang dùng với cùng ngày hiệu lực trên Desk | **Đạt** → BUG-R3-018 phần 2 **Closed** |
| 2 | Smoke `smoke-prod` chỉ đọc trên rc.3 | **Đạt 9/9**: PS-01 desk/staff/guest, PS-02, PS-03, PS-04, PS-05, PS-06 với `qa.fd`, PS-06 với `qa.owner` (có bước 2FA) |
| 3 | Dọn dữ liệu | **Xong**: giá căn 101 về đúng giá trước lượt thử (15.3) |

Không có lỗi mới.

### 15.2 BUG-R3-018 phần 2 – từng bước (Desk Chromium 1366×768, `qa.owner` có 2FA)

Trước lượt thử, căn 101: giá tháng **9.600.000**, giá đêm **800.000**, hiệu lực 26/10. Báo giá (kênh Trực tiếp, 2 người lớn) cho đêm 28/10 và 29/10 đều 800.000.

| Bước | Thao tác | Kết quả đo | Kết luận |
|---|---|---|---|
| A | Gõ lại 800.000, hiệu lực = hôm nay 27/10, ghi lý do | Ô "Hiệu lực từ" và "Lý do đổi giá" hiện ngay khi gõ. Chữ phụ `rooms.price_same_today` hiện. Nút **Lưu khóa**, kể cả khi đã ghi lý do. Không gửi PATCH | Đạt |
| B | Giá đêm **300.000** (giá sai cố ý), hiệu lực **28/10** | **Cảnh báo mềm hiện**: "Giá đêm đang thấp hơn giá tháng chia 30 ngày (320.000 đ)…". Lưu vẫn mở. PATCH 200, body `listPrice` = {28/10, tháng 9.600.000, đêm 300.000}. Toast: "Đã lưu căn 101. Giá áp dụng từ 28/10/2026." Báo giá: 28/10 = **300.000**, 29/10 = 300.000, hôm nay 27/10 = 800.000 (không đổi). `currentListPrice` vẫn 800.000 | Đạt |
| C | Mở lại ngăn kéo. Gõ lại **800.000**, hiệu lực **28/10**, ghi lý do | Ngăn kéo vẫn hiện giá hôm nay 800.000; danh sách lịch giá là phần 1, dời v1.0.1. Chữ phụ `rooms.price_same_future` ("Lưu để giữ giá này từ 28/10/2026…") hiện. **Lưu không khóa.** PATCH 200, body {28/10, 9.600.000, 800.000}. Toast ghi **28/10/2026**. Báo giá: 28/10 = **800.000**, 29/10 = **800.000** | **Đạt – lỗi đã sửa** |
| D | Ngày thứ hai: 880.000 hiệu lực **29/10** (không cảnh báo, vì 880.000 × 30 > 9.600.000), rồi gõ lại 800.000 cùng ngày 29/10 | Cả hai lần: PATCH 200, toast ghi 29/10/2026. Sau lần sai: 28/10 = 800.000, 29/10 = 880.000, tức dòng giá 28/10 giữ nguyên. Sau khi trả lại: 29/10 = **800.000** | Đạt |
| E | Không ảnh hưởng đơn đang có | `OTM-00355` (101, đêm 28/10): `confirmed`, giá đêm **667.000**, `version` 2. Giống hệt trước lượt thử, kể cả lúc giá sai 300.000 đang áp cho 28/10 (BR-006) | Đạt |
| F | Giá tháng độc lập | Mọi PATCH gửi giá tháng 9.600.000, đúng giá đang có; không lần nào đổi giá tháng. Nhật ký `room.updated` (4 dòng, `after.listPrice`) xác nhận dòng 28/10 và 29/10 lưu giá tháng 9.600.000. `currentListPrice` sau lượt thử: tháng 9.600.000, đêm 800.000 | Đạt |

Sau lượt thử: báo giá 27/10, 28/10, 29/10 = 800.000; 30–31/10 (thứ Sáu, thứ Bảy) = **920.000 × 2** (= 800.000 × 1,15).

Ảnh và nhật ký ở scratchpad `qa-r6/rc3/`: `run-log.md`, `r018.json`, `smoke.log`, `screens/r018-*.png`.
- Ảnh khung nhìn, chụp khi chưa lưu: `r018-A2-cung-gia-hom-nay` (Lưu khóa), `r018-C2-cung-gia-29-10` (Lưu mở, có chữ phụ), `r018-B2-canh-bao-mem`.
- Ảnh toast: `r018-B-toast`, `r018-C-toast`, `r018-D-toast`.

Ghi chú (không ghi lỗi):
- Ảnh `fullPage` chụp ngăn kéo trông trong suốt. Đo `opacity` thì ngăn kéo = 1 sau ~400 ms, ảnh khung nhìn chụp sau đó vẫn đặc. Đây là do cách chụp, không phải lỗi giao diện.
- Khi ô "Hiệu lực từ" có chữ phụ, ô "Lý do đổi giá" bên cạnh bị đẩy xuống, cách xa nhãn của nó (ảnh `r018-C2`). Lỗi trình bày nhỏ, đề nghị FE-A/UXD xếp ô lý do theo đầu hàng (như `.g-2.top` đã làm cho hai ô giá).
- Không kiểm được giá tháng của một ngày tương lai qua báo giá. Lý do: `calculateQuote` loại `long` trả 422 `type NOT_IN_LIST` (US-081 chưa làm, theo thiết kế). Vì vậy F kiểm qua nhật ký và body PATCH.
- Rủi ro cho phần 1 (v1.0.1): Desk luôn gửi **cả hai** giá, lấy giá **hôm nay** điền sẵn. Giả sử một dòng đã lên lịch ngày D đổi cả giá tháng lẫn giá đêm, và OWN chỉ sửa giá đêm cho D. Khi đó giá tháng đã lên lịch bị ghi đè về giá tháng hôm nay mà OWN không thấy. Chữ phụ `price_same_future` có nói "giá đã lên lịch đúng ngày đó sẽ được thay", nhưng không nói rõ cả giá tháng cũng bị thay. Đã thêm vào mong đợi phần 1 trong `bug-list.md`: chọn ngày có dòng lên lịch thì điền sẵn giá của dòng đó. Ở B2 (28/10), OWN nhập giá hiệu lực ngay hôm đó, nên không chạm rủi ro này.

### 15.3 Dọn dữ liệu

| Căn | Trước lượt thử | Đã ghi trong lượt thử (hiệu lực) | Sau dọn |
|---|---|---|---|
| 101 | Tháng 9.600.000 · đêm 800.000 (từ 26/10) | 28/10: 300.000, rồi ghi đè 800.000. 29/10: 880.000, rồi ghi đè 800.000. Giá tháng luôn 9.600.000 | Tháng 9.600.000 · đêm 800.000. Báo giá 27, 28, 29/10 = 800.000. Lịch sử còn 2 dòng 28/10 và 29/10 **trùng giá đang dùng**, vô hại; contract chưa có cách xóa dòng giá |

- Căn khác không đổi. OTM-00355 không đổi.
- Lượt chụp ảnh không lưu gì: 0 PATCH, đã kiểm.

### 15.4 Còn lại hôm nay

- Sau 18:00: B18 OTM-00357 theo đường `postReview` + tiền mặt (mục 13 việc 2), rồi hủy OTM-00358. Chạy trên rc.3.

## 16. ESC-031 postReview + tiền mặt trên rc.3 (đêm 27/10)

- Người chạy: QA | 28/10/2026 00:04–00:21 giờ thật. Ngày nghiệp vụ Desk vẫn là **27/10** (đổi lúc 06:00), nên OTM-00357 vẫn đang ở quá giờ trả của ngày đi 27/10. Bước **Kiểm thử**.
- Bản: staging `70fe734` = `v1.0.0-rc.3`, 2FA bắt buộc cho OWN/MGR.
- Harness repo `70fe734`. Bộ chạy ở scratchpad: `qa-r6/run-staging-rc3n.sh`, ca `src-rc3/product/tests/e2e/ui/qa-esc031n-*.spec.ts`. Biến môi trường: `E2E_TOTP_DIR=~/.ottimo/staging/totp`, `E2E_LOCAL_CLOCK=1`. Mật khẩu `qa.*` đọc từ tệp ngoài repo, không in ra.
- Không quét QR, không chuyển khoản. Tiền mặt và chi hoàn tiền mặt chỉ là bản ghi trên staging. Ảnh che tiêu đề (có tên khách) và mọi ảnh QR. Ảnh trang danh sách đơn có tên khách đã xóa, không dùng.
- Nhật ký và ảnh: scratchpad `qa-r6/esc031n/` (`run-log.md`, `screens/n01…n07`).

### 16.1 Kết luận: **ĐẠT** – kèm 3 lỗi mới (1 P2, 2 P3), không lỗi nào chặn rc.4

| # | Việc | Kết quả |
|---|---|---|
| 1 | B18 OTM-00357 (căn 203) trên Desk, `qa.fd`, đường `postReview`, thanh toán cuối **tiền mặt** | **Đạt.** 200, folio `settled`, phiếu **F26-000004** |
| 2 | Phí do máy chủ tính, không hỏi mật khẩu quản lý | **Đạt.** Số 792.000 lấy từ `checkout-summary`, Desk không cho sửa; 0 ô mật khẩu, 0 lựa chọn "Quản lý xác nhận tại quầy". Gửi số sai → 409, gửi kèm người duyệt → 422, không ghi gì |
| 3 | Mục chờ MGR/OWN xem lại trong `post_checkout_charge_hours` (24) | **Đạt.** Hạn **29/10 00:15** = lúc trả + 24 giờ |
| 4 | MGR/OWN (có 2FA) xem lại, duyệt; tách người làm (`SELF_APPROVAL_FORBIDDEN`, `SELF_REFUND_FORBIDDEN`) | **Đạt** cả 3 chặn (16.4) |
| 5 | Folio, nhật ký tiền, phiếu | **Đạt** về số. Có **BUG-R3-033 (P2)**: khung Folio trên màn Trả phòng vẫn hiện "Còn phải thu 792.000 đ" sau khi xong |
| 6 | Hủy OTM-00358 | **Đạt.** `cancelled`, giữ cọc 200.000 theo BR-309, không sinh yêu cầu hoàn, căn 203 `VD` |

Lỗi mới, chi tiết ở `bug-list.md`:
- **BUG-R3-033 (P2, FE-A).** Màn Trả phòng sau khi xong vẫn hiện số dự tính trước khi trả: "Đã thu −792.000 · Còn phải thu 792.000 đ". Máy chủ ghi đã thu 1.584.000, còn 0. Ảnh rc.2 hôm 26/10 (`esc031-shots/05-tra-phong-xong.png`) cũng có lỗi này, lúc đó QA bỏ sót.
- **BUG-R3-034 (P3, BE-B).** Đơn đã trả phòng, sau khi chi hoàn đủ, mục "Cần chú ý · tiền dư đơn đã đóng" vẫn còn cho OWN, MGR và FD. Không đóng tay được (409). Mục chỉ tự hết khi J15 đóng folio, sau 29/10 00:15.
- **BUG-R3-035 (P3, BE-B + UXD).** Trên phiếu, dòng phụ thu bằng 1 đêm hiện "Phụ thu trả muộn (00:15)". Chữ không nói "bằng giá 1 đêm", và 00:15 thực ra là rạng sáng 28/10, khác ngày dịch vụ 27/10.

### 16.2 Trước / sau

| Mục | Trước (00:04) | Sau B18 (00:15) | Cuối (00:18, sau xem lại + hủy) |
|---|---|---|---|
| OTM-00357 | `in_house`, 26→27/10, version 2 | `checked_out`, version 3 | như sau B18 |
| Folio OTM-00357 | `open`; tiền phòng 792.000; đã thu 792.000 (cọc 200.000 + 592.000 tiền mặt); còn 0 | `settled`, F26-000004. Thêm dòng `late_checkout/late_fee_as_night` 792.000 (ngày 27/10, người ghi QA FD). Thêm **PT-000459** `charge/cash` 792.000. Tổng 1.584.000 = đã thu 1.584.000, còn 0, dư 0 | Dòng 792.000 đảo (−792.000) + dòng mới 396.000 (QA MGR). Thêm **PT-000460** `refund/cash` −396.000. Tổng 1.188.000; đã thu 1.584.000; đã hoàn 396.000; còn 0; dư 0 |
| Nhật ký tiền (`listPayments`, mọi trạng thái đối soát) | PT-000450, PT-000451 | + PT-000459 tiền mặt 792.000, `not_required`, người ghi FD | + PT-000460 hoàn tiền mặt −396.000, người chi FD. Màn "Nhật ký thao tác tiền" của MGR có đủ các dòng: chi hoàn, OWN duyệt, phí hủy 358 |
| Thông báo của đơn | OWN 0; MGR, FD, FDL: 1 `registration_due` (cũ) | `late_fee_post_review`: OWN 1, MGR 1, FD 0, FDL 0 | Thêm `approval_decided` (MGR), `refund_ready` (MGR, FD, FDL). OWN không bị báo thêm |
| "Cần chú ý" của đơn | `registration_overdue` (mục gộp cũ) | `late_fee_post_review`: OWN 1, MGR 1 (hạn 29/10 00:15); FD 0 | `late_fee_post_review` đã hết (MGR "Đã xem"). **`closed_reservation_credit` còn** cho OWN, MGR, FD (BUG-R3-034) |
| Yêu cầu duyệt | 0 | 0 | 1 `refund` 396.000, tiền mặt, `approved`, đã hoàn 396.000 |
| Audit đơn | – | `reservation.late_fee_instead_of_night`: `channel` `post_review`, 792.000, `checkoutTime` 00:15, `reviewDueAt` 29/10 00:15, actor QA FD, **không có `confirmedBy`**; `folio.settled`; `reservation.checked_out` (`lateSurchargeVnd` 792.000) | + `reservation.cancellation_fee`, `reservation.cancelled` (358) |
| OTM-00358 | `confirmed`, 27→28/10, cọc 200.000, còn phải thu 592.000 | không đổi | `cancelled`, version 2. Folio: tiền phòng đảo, dòng `cancellation_fee` 200.000 = cọc giữ lại, còn 0, không có yêu cầu hoàn |
| Căn 203 | OC | `VD` (Trống · cần dọn), 1 việc dọn | `VD` |

`checkout-summary` trước khi trả (`qa.fd`):
- Không có `checkoutTime` thì trả giờ chuẩn 12:00.
- Với 00:15, 20:30 và 23:59: `lateFeeAsNightVnd` đều **792.000**, `extraNightAvailable` false, còn phải thu 792.000, `blockers` [`minibar_not_checked`].
- Máy chủ coi 00:15 sau nửa đêm vẫn thuộc ngày nghiệp vụ 27/10 (bậc 100 %), đúng BR-010.

### 16.3 B18 trên Desk (Chromium 1366×768, `qa.fd`)

| Bước | Đo được | Kết luận |
|---|---|---|
| Thăm dò API trước khi làm (`qa.fd`) | `lateFeeInsteadOfNight` 791.000 → **409 `SURCHARGE_CHANGED`**. 792.000 kèm `approverUsername` → **422** `lateFeeInsteadOfNight.approverUsername NOT_ALLOWED`. Sau cả hai: đơn `in_house` version 2, folio version 4, không thêm dòng, không thêm khoản thu | Đạt |
| Mở Trả phòng | Desk gọi `checkout-summary?checkoutTime=00:15` → 200, `lateFeeAsNightVnd` 792.000 | Đạt |
| Bước 2 Phụ phí (ảnh `n02`) | "Đêm nay căn đã có khách nên không bán thêm đêm được. Thay vào đó thu phụ thu trả muộn bằng giá 1 đêm: 792.000 đ…" | Đạt |
| Bước 3 (ảnh `n03`) | Chỉ có một cách: "Ghi phụ thu – quản lý xem lại". 0 ô mật khẩu. Số 792.000 chỉ đọc; ô nhập duy nhất trong khung là Lý do | Đạt |
| Tiền mặt (ảnh `n04`, `n05`) | Tiền 792.000, khách đưa 800.000 → "Thối lại 8.000 đ". Sau "Ghi nhận": "Tiền mặt: đã nhận 792.000 đ. Khoản thu này được ghi vào folio khi bấm Hoàn tất." **0 lần `POST /payments`** (BUG-R3-017 giữ đúng) | Đạt |
| Hộp xác nhận (ảnh `n06`) | "Hoàn tất trả phòng căn 203? … Phụ thu trả muộn 792.000 đ được …" (FB-02) | Đạt |
| Hoàn tất | **200**. Body gửi một lần: `{"checkoutTime":"00:15","applyLateSurcharge":false,"lateFeeInsteadOfNight":{"amountVnd":792000,"reason":"…","postReview":true},"finalPayment":{"type":"charge","method":"cash","amountVnd":792000}}`. `lateFeeInsteadOfNight` đúng 3 trường | Đạt |
| Màn sau khi xong (ảnh `n07`) | "Đã trả phòng. Bill đã lưu. Phiếu F26-000004…". Nhưng khung Folio vẫn ghi "Phụ thu… (dự tính) 792.000 · Đã thu −792.000 · **Còn phải thu 792.000 đ**" | **BUG-R3-033** |

Lần chạy đầu dừng ở bước 3: dòng QA đọc chữ "tiền thối" chờ không giới hạn. Đây là lỗi của ca QA; lần đó chưa bấm Hoàn tất, nên không ghi gì. QA sửa ca và chạy lại, lần hai đạt (00:15).

### 16.4 Xem lại và duyệt (API thật, `qa.mgr` và `qa.owner` đều `mfaEnabled` true, đăng nhập bằng TOTP thử)

| # | Thao tác | Kết quả | Kết luận |
|---|---|---|---|
| R1 | MGR A32 dòng phụ thu 792.000 → 396.000 (khách trễ do OTTIMO) | 201. Dòng đảo −792.000 + dòng 396.000. Dư 396.000, tự sinh **1 yêu cầu hoàn 396.000 `pending`** | Đạt |
| R2 | MGR tự duyệt yêu cầu hoàn mình tạo | **403 `SELF_APPROVAL_FORBIDDEN`** | Đạt |
| R3 | MGR (người làm A32) đặt nơi nhận | **403 `SELF_REFUND_FORBIDDEN`** (0.3.8 bổ sung 7) | Đạt |
| R4 | FD đặt nơi nhận tiền mặt | 200, yêu cầu vẫn `pending` | Đạt |
| R5 | OWN duyệt | 200 → `approved` | Đạt |
| R6 | MGR (người tạo yêu cầu, người làm A32) chi tiền mặt | **403 `SELF_REFUND_FORBIDDEN`** | Đạt |
| R7 | FD chi tiền mặt 396.000, kèm ảnh biên nhận (ảnh giả 16×16) | 201 **PT-000460** `refund/cash` −396.000. Dư về 0 | Đạt |
| R8 | FD đóng mục "xem lại phụ thu" | 404 (không thuộc FD) | Đạt |
| R8 | MGR "Đã xem" | 204. Mục hết ở cả MGR và OWN | Đạt |
| – | Mục `closed_reservation_credit` sinh lúc A32 | Vẫn mở sau R7. MGR đóng tay → 409 `INVALID_TRANSITION` | **BUG-R3-034** |

Ghi chú (không ghi lỗi):
- Yêu cầu hoàn đã chi đủ vẫn để `status` `approved`, chỉ khác ở `refundedVnd` = số duyệt. Mã máy chủ suy ra "refunded" từ hai số này khi trả 409, nên coi là theo thiết kế.
- Phiếu `GET bill` sau khi xem lại: tổng 1.188.000, đã thu 1.584.000, còn 0; dòng phụ thu hiện 396.000 (người ghi QA MGR). Dòng 792.000 đã đảo không còn trên phiếu.

### 16.5 Dữ liệu staging để lại (báo ORC trước B2)

- OTM-00357: `checked_out`, folio `settled` (J15 đóng sau 29/10 00:15).
- OTM-00358: `cancelled`, giữ cọc 200.000.
- Căn 203 `VD`, có 1 việc dọn. Nên dọn trước UAT nếu dùng căn 203.
- Từ giờ tới khi J15 đóng folio (sau 29/10 00:15), "Cần chú ý" của OWN, MGR, FD còn mục **"tiền dư đơn đã đóng – OTM-00357"** dù dư đã về 0 (BUG-R3-034). Nếu INV hỏi trong buổi B2, nói rõ đây là dữ liệu thử của QA.
- Hàng "Cần duyệt" có yêu cầu hoàn 396.000 của OTM-00357 ở trạng thái đã chi; không còn việc chờ.

## 17. rc.4 staging 28/10 – xác nhận bản sửa v1.0.0 (BUG-R3-019…023, 033) + smoke-prod

- Người chạy: QA | 28/10/2026 01:03–06:22 giờ thật (ngày nghiệp vụ 27/10 tới 06:00, rồi 28/10). Round 3 – bước **Kiểm thử**.
- Bản: staging = commit `d12cda6`, image `sha-d12cda6f26a4` (ứng viên `v1.0.0-rc.4`, tag gắn sau B2). Kiểm gói Desk đang phục vụ có đúng bản sửa: `LongStayDialog` gửi `directSource`, `print.css` có `@page { size: A4 }`, chuỗi `room_change.ready_only` mới, `listRoomGroups` trong hộp Đổi phòng.
- Harness: `git archive d12cda6 product/tests product/design/copy` vào scratchpad `qa-r6/src-rc4/`; bộ chạy `qa-r6/run-staging-rc4.sh`, `qa-r6/run-man4.sh`; ca riêng `e2e/ui/man/r4-*.spec.ts`. `E2E_TOTP_DIR=~/.ottimo/staging/totp`, `E2E_LOCAL_CLOCK=1`. Mật khẩu `qa.*` đọc từ tệp ngoài repo, không in.
- Không quét QR, không chuyển khoản. Tiền mặt chỉ là bản ghi staging. Không đụng production. Link khách lưu tạm ở scratchpad (quyền 600), đã thu hồi và xóa sau lượt.
- Nhật ký và ảnh thô: scratchpad `qa-r6/man4/` (`log.md`, `raw/`, `img/`), `qa-r6/rc4/smoke.log`.

### 17.1 Kết luận: **ĐẠT** – không lỗi P0/P1/P2 mới; 1 lỗi P3 mới (BUG-R3-036); 1 điểm cần OPS/BE kiểm (J15, 17.8)

| # | Việc | Kết quả | Trạng thái lỗi |
|---|---|---|---|
| 1 | BUG-R3-019 (P1) Đơn dài hạn nhập tay | **Đạt** – cả hai đường tạo được, đúng nguồn, không có "Sale nội bộ" (17.2) | **Closed** |
| 2 | BUG-R3-033 (P2) Folio sau "Hoàn tất" | **Đạt** đường trả phòng thường có thu tiền mặt ở bước 3. Đường `postReview` chưa chạy lại được (chỉ dựng được sau 18:00) (17.3) | **Closed** (ghi chú 17.3) |
| 3 | BUG-R3-020 (P2) In phiếu | **Đạt** – 1 tờ A4 chỉ có phiếu, 11 pt / 9 pt, chỉ màu brand (17.4) | **Closed** |
| 4 | BUG-R3-022 (P2) Thêm phát sinh sau trả phòng | **Đạt** – nút hiện ở folio `settled`; ghi thử rồi đảo, số dư về như cũ. Chưa kiểm được ca `closed` (17.5, 17.8) | **Closed** |
| 5 | BUG-R3-023 (P2) Hộp Đổi phòng | **Đạt** phần sửa của v1.0.0: nhãn nhóm, câu mới, căn VD bị máy chủ chặn, không lưu gì (17.6) | Phần nhãn + câu **Closed**; lọc căn VD **Open – v1.0.1** |
| 6 | BUG-R3-021 (P2) Wi-Fi trang khách EN/VI/RU | **Đạt** phần trang khách (17.7) | Phần trang khách **Closed**; ô nhập Wi-Fi trên Desk **Open – v1.0.1** |
| 7 | Smoke-prod trên rc.4 | **Đạt 9/9** (01:17): PS-01 desk/staff/guest, PS-02…05, PS-06 `qa.fd`, PS-06 `qa.owner` (có 2FA) | – |
| 8 | Ảnh sổ tay còn thiếu | **C2-13 đã chụp**. C1-15, C2-34 **chưa** – cần đường ESC-031 sau 18:00 (17.9) | – |

Lỗi mới: **BUG-R3-036 (P3, BE-B)** – phí hủy (và phí không đến, cùng hàm) ghi sau 00:00 mang ngày lịch, không phải ngày nghiệp vụ (17.8).

### 17.2 BUG-R3-019 – Đơn dài hạn nhập tay (Desk Chromium 1440×900, `qa.fd`, 01:08)

| Bước | Đo được | Kết luận |
|---|---|---|
| A. Sơ đồ phòng → **Đơn dài hạn nhập tay**: căn 402, 01/03–01/06/2027, khách tạo nhanh (tên, SĐT giả), tiền thuê 12.000.000, ký quỹ 12.000.000, số HĐ, ghi chú, Nguồn **Khách vãng lai** | Ô **Nguồn** có 4 lựa chọn: Zalo / điện thoại (mặc định) · Website · Khách vãng lai · Khách quay lại. **Không có "Sale nội bộ"**. `POST reservations` → **201** `OTM-00363`, body `directSource` `walk_in`, `manualLongStay` {12.000.000, 12.000.000, số HĐ, ghi chú} | Đạt |
| Đọc lại OTM-00363 | `confirmed`, `stayType` long, căn 402, `directSource` walk_in, `externalContract` true (cờ "HĐ ngoài hệ thống") | Đạt |
| B. **Đặt phòng mới** 01/07–01/09/2027 (62 đêm) → **Tạo đơn dài hạn nhập tay** | Form dài hạn mang sẵn ngày từ H09; có ô Nguồn, cùng 4 lựa chọn. Chọn căn 401, để nguồn mặc định → **201** `OTM-00364`, `directSource` `zalo_phone`, `externalContract` true | Đạt |
| C. Yêu cầu website dài hạn (ô Nguồn ẩn, máy chủ đặt Website) | Staging không có yêu cầu website nào đang mở. **Chưa kiểm trên staging**; dựa vào test của FE-A (`r3-v100-fea.test.tsx`) | Không kiểm |

**Trả lời Q4 sổ tay (thu tiền thuê ghi ở đâu, folio có dòng tiền thuê không)** – đo trên OTM-00363:
- Folio của đơn dài hạn nhập tay: `open`, **0 dòng**, tổng 0, không có khoản thu nào. Ký quỹ 12.000.000 chỉ là thông tin trên đơn (`manualLongStay.depositHeldVnd`), không thành khoản thu; folio `depositHeldVnd` = 0.
- Khung đơn `confirmed` có: Tạo link check-in online · Thu hồi link · Folio & điều chỉnh · Thêm người đi cùng · Hủy đơn · Đổi căn / đổi ngày. Không có nút ghi thu.
- Kết luận cho sổ tay 2.7: **tiền thuê và ký quỹ ghi ngoài app** (hợp đồng giấy, sổ thu), đúng câu trên form "Đơn này không sinh: hợp đồng, lịch kỳ thu, nhắc thu, hoa hồng". App không có dòng tiền thuê. Khi đơn đã nhận phòng, khoản phát sinh (giặt, dọn lẻ…) ghi được bằng **Thêm phát sinh** như đơn ngắn ngày; thu ở bước 3 trả phòng hoặc **Thu công nợ** sau trả phòng (Q11). Phần nhận phòng / trả phòng của đơn dài hạn chưa diễn tập (ngày 2027).
- Dọn: OTM-00363, OTM-00364 **đã hủy** (lý do "Khác", không có tiền nên không phí, không yêu cầu hoàn).

### 17.3 BUG-R3-033 – Folio sau "Hoàn tất" trả phòng

Đơn thử **OTM-00365** (căn 103, 27→28/10, khách giả). Dựng lúc 01:10: tạo đơn, trả đủ tiền phòng 850.000 (cọc 300.000 + 550.000 tiền mặt), nhận phòng 01:16, thêm 1 dòng giặt ủi 30.000 để còn phải thu khi trả phòng.

| Bước (06:03, Desk `qa.fd`) | Đo được | Kết luận |
|---|---|---|
| Bước 3 trước khi thu | Folio: tiền phòng 850.000 · giặt ủi 30.000 · Đã thu −850.000 · **Còn phải thu 30.000 đ** | Đúng |
| Tiền mặt 30.000, khách đưa 50.000 → Ghi nhận | `POST payments` 201 (**PT-000464**). Số ≤ còn phải thu nên Desk ghi ngay, không giữ lại tới B18 | Đúng thiết kế |
| Hoàn tất → xác nhận | B18 **200**, body `{"checkoutTime":"06:03","applyLateSurcharge":false}`, phiếu **F26-000005** | Đạt |
| Ngay sau 200 | Desk gọi `GET folios/{id}` → 200. Khung Folio: tiền phòng 850.000 · giặt ủi 30.000 · **Đã thu −880.000 · Còn phải thu 0 đ**. Không có chữ "dự tính", không có khối "Thử lại" | **Đạt** |
| Đối chiếu máy chủ | Folio `settled` v8, đã thu 880.000, còn 0 – khớp từng số trên màn | Đạt |

- Ghi chú phạm vi: trả phòng thường **không gửi** `finalPayment` – tiền mặt ≤ còn phải thu được ghi ngay ở bước 3. `finalPayment` chỉ có khi B18 mới ghi thêm khoản (phụ thu trả muộn, đêm thêm, ESC-031), tức chỉ dựng được sau 12:00 / 18:00 ngày đi. Trước 08:30 không dựng được, nên **đường `postReview` + tiền mặt (16.3) chưa chạy lại trên staging**.
- Vì sao vẫn đóng lỗi: mã rc.4 có **một** chỗ xử lý sau B18 200 (`CheckOutPage.tsx` `setDone` → `getFolio`), không rẽ theo đường trả phòng. Staging xác nhận chỗ đó đọc folio máy chủ và hiện đúng số; đường `postReview` + tiền mặt có test riêng của FE-A (`bug-r3-033-fea.test.tsx`, đỏ trước khi sửa). Nếu ORC muốn chắc trên staging: chạy lại 16.3 sau 18:00 một ngày bất kỳ trước 02/11 (dựng từ sáng hôm trước).
- Ảnh (scratchpad, tên khách che): `man4/img/r4-033-buoc3-tien-mat.png`, `man4/img/r4-033-tra-phong-xong.png`.

### 17.4 BUG-R3-020 – In phiếu (Desk Chromium, `qa.fd`, OTM-00294 F26-000002, chỉ đọc)

| Bước | Đo được | Kết luận |
|---|---|---|
| Mở **Xem Phiếu thanh toán** | `body > .print-root` có 1 bản, `aria-hidden` true, ẩn trên màn hình | Đạt |
| Bấm **In phiếu** (chặn `window.print`) | Gọi 1 lần; `.print-root` vẫn còn sau khi gọi (Ctrl+P in cùng tờ) | Đạt |
| Chế độ in (`emulateMedia print`) | Mọi con của `body` khác `.print-root` là `display: none` | Đạt |
| `page.pdf` A4, `preferCSSPageSize` | **1 trang**, MediaBox 595 × 842 pt (A4). Chỉ có tờ phiếu: tên cơ sở, số phiếu, lập lúc, tên khách · căn · ngày, 3 dòng, Tổng cộng 892.000, Đã thu, Còn phải thu 0, "Giá đã gồm thuế GTGT", dấu "ĐÃ THU ĐỦ" | Đạt |
| Cỡ chữ, phông | Nội dung `td` **14,67 px = 11 pt**, tiêu đề cột `th` **12 px = 9 pt**; tên cơ sở Lora 14 pt, "Phiếu thanh toán" Lora 16 pt, nội dung Be Vietnam Pro, số phiếu JetBrains Mono | Đạt |
| Màu | Chỉ 5 màu bảng brand + giấy trắng: Ink, Stone Grey, Light Oak, Sage, Earth Brown | Đạt |
| Việt – Anh | Cùng 1 trang A4; mỗi dòng có dòng tiếng Anh ("Guest folio", "Room The Valley, night of 26/10", "Total", "Paid", "Balance due", "PAID IN FULL") | Đạt |
| Đóng hộp | `.print-root` gỡ khỏi trang; 0 lệnh ghi trong lượt | Đạt |

- Chưa kiểm: máy in thật ở quầy, Safari iPad (không có thiết bị). Đề nghị OPS/INV in thử 1 tờ trên máy quầy trước ngày D.
- Ghi chú (không ghi lỗi): bản Việt – Anh của dòng minibar lặp lại tên tiếng Việt ("Minibar – Bia Larue lon × 2") vì danh mục minibar chỉ có tên tiếng Việt. Gợi ý PO/UXD thêm tên tiếng Anh cho danh mục ở v1.0.1.
- Bằng chứng (scratchpad, tên khách giả): `man4/raw/r4-OTM-00294-vi.pdf`, `r4-OTM-00294-vien.pdf`, ảnh `r4-vien-pdf.png`.

### 17.5 BUG-R3-022 – Thêm phát sinh sau trả phòng

| Đơn | Trạng thái | "Thêm phát sinh" | Kết luận |
|---|---|---|---|
| OTM-00357 (trả 28/10 00:15) | `checked_out`, folio `settled` | Có (cạnh Folio & điều chỉnh, Xem Phiếu thanh toán) | Đạt |
| OTM-00294 (trả 27/10 06:01) | `checked_out`, folio `settled` | Có | Đạt |
| OTM-00365 lúc đang ở | `in_house`, folio `open` | Có (như cũ) | Đạt |
| Folio `closed` | Staging **không có folio `closed` nào** (17.8) | Không kiểm được trên staging; dựa vào test FE-A | Không kiểm |

Ghi thử trên OTM-00365 vừa trả phòng (06:04, `qa.fd`):

| Bước | Đo được |
|---|---|
| Trước | Folio `settled` v8: tổng 880.000, đã thu 880.000, còn 0 |
| **Thêm phát sinh** → Giặt ủi (theo kg) × 1, ghi chú | `POST lines` **201**. Folio v10: tổng 910.000, **còn phải thu 30.000**. Khung đơn hiện thêm **Thu công nợ** |
| Đảo dòng thử | Lễ tân `voidLine` → **403** `FORBIDDEN_ACTION` (đúng: sau trả phòng chỉ quản lý điều chỉnh). Quản lý `voidLine` → **201**, dòng đảo −30.000 |
| Sau | Folio `settled` v12: tổng 880.000, đã thu 880.000, **còn 0** – như trước. Không sinh "Cần chú ý", không sinh yêu cầu duyệt |

Đơn quá cửa sổ mà folio chưa đóng – OTM-00239 (trả 25/10): nút **có**; bấm Thêm vào folio → máy chủ **409 `FOLIO_LOCKED`**, hộp báo "Phiếu thanh toán đã khóa sau khi trả phòng. Chỉ quản lý ghi được bút toán điều chỉnh.", không ghi gì. Đúng như FE-A mô tả cho khoảng hở; nhưng trên staging khoảng hở này kéo dài nhiều ngày (17.8).

### 17.6 BUG-R3-023 – Hộp Đổi phòng (OTM-00365 đang ở, căn 103, 01:16)

- Trạng thái buồng lúc thử: 203 **VD**, 202 VI, 101/102/301/401/402 VC.
- Danh sách: "101 · Lầu 1–2", "202 · Lầu 1–2", "203 · Lầu 1–2", "401 · Căn N · Nâng hạng…", "402 · Căn N+ · Nâng hạng…". **Không còn mã L12 / N / NPLUS.**
- Câu dưới danh sách đúng chuỗi mới `room_change.ready_only`: "Chỉ đổi được sang căn VI · Đã kiểm, sẵn sàng hoặc VC · Đã dọn, chờ kiểm. Danh sách có thể còn căn chưa dọn – chọn căn đó sẽ được báo, không lưu gì."
- Chọn **203 (VD)**: máy chủ trả **409 `ROOM_NOT_READY`** (`roomStatus` VD) ngay khi xem trước; hộp hiện "Căn 203 chưa sẵn sàng (VD · Trống, cần dọn). Chọn căn đã kiểm sẵn sàng hoặc đã dọn." Bấm **Đổi sang căn 203** → lại 409.
- Sau: đơn vẫn căn 103, `version` 2 như trước; trạng thái buồng không đổi. **Không lưu gì.** Đạt.
- Ghi chú cho UXD (không ghi lỗi): tiêu đề nhóm vẫn là "CĂN MỚI (ĐÃ DỌN HOẶC ĐÃ KIỂM)" trong khi danh sách có căn VD; câu mới đã giải thích, có thể sửa tiêu đề cùng lúc làm phần lọc ở v1.0.1.

### 17.7 BUG-R3-021 – Wi-Fi trên trang khách (điện thoại 390×844, đổi ngôn ngữ bằng ô chọn của trang)

Staging chưa có Wi-Fi của cơ sở (`wifi` = `null` trong phản hồi trang khách).

| Đơn | Lúc | Tình huống | EN | VI | RU |
|---|---|---|---|---|---|
| OTM-00365 | 01:11 | Đến 27/10, `confirmed`, trong ngày đến | "Please ask reception for the network name and password." | "Vui lòng hỏi lễ tân tên mạng và mật khẩu." | "Пожалуйста, узнайте имя сети и пароль у администратора." |
| OTM-00365 | 01:17 | `in_house` | như trên | như trên | như trên |
| OTM-00366 | 01:17 | Đến 29/10 (trước ngày đến) | "Shown here on your arrival day (29 Oct)." | "Hiện ở đây vào ngày nhận phòng (29/10)." | "Появится здесь в день заезда (29 окт.)." |

- Kết luận: trong ngày đến / đang ở hiện câu "hỏi lễ tân" đúng ba ngôn ngữ; trước ngày đến giữ câu cũ. Đạt.
- Chưa kiểm: trường hợp đã có Wi-Fi (staging chưa nhập; ô nhập trên Desk là v1.0.1).
- Ghi chú: mở cùng một link khách 5 lần trong khoảng 30 giây thì trang báo "Bạn đã thử quá nhiều lần. Chờ 1 phút rồi thử lại." Đây là giới hạn chống dò link, không ghi lỗi; QA chạy lại bằng một phiên.
- Dọn: OTM-00366 đã hủy (giữ cọc 300.000 theo BR-309, không có yêu cầu hoàn). Link của OTM-00365 đã thu hồi (204).

### 17.8 Phát hiện thêm

**BUG-R3-036 (P3, BE-B) – phí hủy ghi sau nửa đêm mang ngày lịch, không phải ngày nghiệp vụ.**
- OTM-00366 hủy lúc 01:22 ngày 28/10 (ngày nghiệp vụ 27/10): dòng `cancellation_fee` 300.000 có `serviceDate` **28/10**. OTM-00358 hủy 00:18 ngày 28/10: dòng 200.000 cũng **28/10**.
- `metrics-definitions.md` (dòng 32, Q-09): phí hủy / không đến ghi theo **ngày nghiệp vụ** hủy / đánh dấu. Mã `folio.service.ts` (~dòng 1700) dùng `localDate(now)` – ngày lịch. Phí không đến dùng cùng đoạn mã; việc đánh dấu không đến thường làm sau 23:00 hoặc ca đêm, nên dễ rơi sang ngày hôm sau.
- Ảnh hưởng: doanh thu khác (K-22e) của ca đêm bị tính sang ngày sau. Không sai tổng tiền. Chi tiết ở `bug-list.md`.

**Cần OPS/BE kiểm: J15 không đóng folio quá cửa sổ trên staging.**
- OTM-00239 trả phòng 25/10, folio vẫn `settled` lúc 28/10 06:20. OTM-00294 (trả 27/10 06:01, còn 0) và OTM-00297 (trả 27/10 06:02, công nợ 150.000), cửa sổ 24 giờ hết khoảng 06:01–06:02 ngày 28/10: lúc 06:05, 06:09 và 06:20 cả hai vẫn `settled`, `version` không đổi.
- Theo `folio-close-job.ts`, J15 chạy mỗi nhịp worker và đóng mọi folio `settled` có `post_checkout_window_until` ≤ giờ hiện tại. OTM-00239 không có tiền dư, không yêu cầu hoàn mở, còn 0 – đáng lẽ đã `closed`.
- Hệ quả nếu production cũng vậy: nút **Thêm phát sinh** hiện mãi trên đơn cũ, lễ tân bấm sẽ gặp 409; khoản còn nợ sau cửa sổ không thành công nợ (BR-427 d); mục "tiền dư đơn đã đóng" của BUG-R3-034 không tự hết.
- QA không xem được log worker. **Đề nghị OPS xem log `J15` / `folio.close` trên staging và production hôm nay**, BE-B xem cột `post_checkout_window_until` của hai folio trên. Chưa ghi lỗi vì chưa rõ nguyên nhân (job không chạy, hay dữ liệu cửa sổ rỗng).
- **Theo dõi 29/10:** nguyên nhân đã rõ. rc.4: J15 không đăng ký trong worker → **BUG-R3-037 (P1)**. rc.5 (`1078b5b`, OPS kiểm 29/10): J15 chạy nhưng `AuditEntityNotRegisteredError`, 0/5 folio đóng → 037 **mở lại**. Thêm **BUG-R3-038 (P1)**: `payment.expire` `job failed` mỗi nhịp, cùng gốc. Lượt này QA không đọc log worker của các job khác nên bỏ sót 038; từ nay mỗi lần kiểm staging có bước đọc log worker trọn 2 nhịp, cho mọi job. Chi tiết, lỗ hổng test (b) và điều kiện kiểm lại trên rc.6: `bug-list.md` mục BUG-R3-037, BUG-R3-038; `outputs/OPS/j15-folio-close-check.md` mục 10.

### 17.9 Ảnh sổ tay

| Mã | Kết quả |
|---|---|
| **C2-13** Hộp **Đánh dấu … không đến?** | **Đã chụp** – `product/docs/manual/img/C2-13.png` (1440×900, 56 KB). Đơn mới OTM-00365, đến hôm nay, chụp 01:15 (sau 23:00 ngày đến). Che: tiêu đề hộp và tên khách ở đầu khung đơn (khối Ink đặc). Không có QR, tài khoản, SĐT, giấy tờ, mã cửa. Hộp **không** xác nhận (bấm Chờ thêm), 0 lệnh ghi. Chữ trên hộp: "Giữ cọc 300.000 theo chính sách. Căn 103 mở bán lại 27/10 → 28/10 trên mọi kênh. Khai báo và hoa hồng của đơn bị hủy.", ô **Kết quả liên lạc** (Gọi không nghe máy / Khách báo đến trễ / Chưa liên lạc), **Ghi chú**, nút **Chờ thêm** / **Đánh dấu không đến** |
| C1-15 Cần chú ý – phụ thu bằng 1 đêm chờ xem lại | **Chưa chụp.** Cần một lượt trả phòng ESC-031 `postReview` (sau 18:00 ngày đi, đêm đó căn đã có khách). Mục của OTM-00357 đã được MGR "Đã xem" đêm 27/10 |
| C2-34 Trả sau 18:00 – Ghi phụ thu, quản lý xem lại | **Chưa chụp**, cùng lý do. Ảnh `esc031n/screens/n03` (rc.3) có đúng màn này nhưng dùng đơn cấm chụp (OTM-00357) |

Đề nghị: nếu cần đủ ảnh trước 02/11, ORC giao QA một lượt tối (dựng đơn ở căn trống từ ngày hôm trước + đơn đến đêm đó), làm luôn chạy lại 16.3 cho BUG-R3-033 và chụp C1-15, C2-34.

### 17.10 Dữ liệu staging – trước / sau

| Mục | Trước (01:03) | Trong lượt | Sau (06:20, kiểm lại bằng API) |
|---|---|---|---|
| Trạng thái buồng | 203 VD · 302 OD · 202 VI · 101, 102, 103, 301, 401, 402 VC · 201 OC | 103 OC (đơn thử) → VD sau trả phòng | 103 **VC** (`qa.hk` dọn trên PWA: VD → CL → VC, việc dọn xong). Còn lại như trước |
| OTM-00363, OTM-00364 (dài hạn nhập tay, 2027) | – | Tạo | **Hủy**. Không có tiền |
| OTM-00365 (103, 27→28/10) | – | Tạo, thu 850.000 (PT-000461 cọc 300.000, PT-000462 550.000), nhận phòng, giặt ủi 30.000, trả phòng (PT-000464 30.000, F26-000005), dòng thử sau trả phòng + đảo | `checked_out`, folio `settled` tổng 880.000 = đã thu, còn 0. Link khách thu hồi. Việc dọn căn 103 `done`; màn Hôm nay không còn việc mở của căn 103 |
| OTM-00366 (402, 29→30/10) | – | Tạo, cọc 300.000 (PT-000463) | **Hủy**, giữ cọc 300.000 theo BR-309 (dòng `cancellation_fee`), không yêu cầu hoàn |
| Khách | – | 4 hồ sơ khách giả (2 tạo nhanh trên Desk, 2 của harness) | Còn (không có thao tác xóa hồ sơ) |
| Tham số, giá căn | – | Không đổi | Không đổi |
| Đơn khác (OTM-00239, 294, 357) | – | Chỉ đọc; OTM-00239 một lần thêm dòng bị 409, không ghi | Không đổi |

## 18. B2 Phần 6 – smoke production 29/10

- Người chạy: QA | 29/10/2026 16:58–17:00 (+07), Round 3 – bước **Kiểm thử**, B2 phần 6, G5-5. Từ Mac ngoài máy chủ (đường Internet của người dùng thật).
- Bản trên production: image `sha-70fe734e9077` (= `v1.0.0-rc.3`, theo biên bản OPS `b2-runbook.md` mục kiểm trước buổi). `smoke-prod/readonly.prod.spec.ts`, `playwright.config.ts`, `support/env.ts`, `global-setup.ts`, `infra/caddy/` không đổi giữa `70fe734` và HEAD, nên chạy thẳng từ repo.
- **Không đăng nhập, chỉ đọc.** Chỉ GET/HEAD và bắt tay TLS. Không đặt `E2E_SMOKE_USER` nên PS-06 tự bỏ qua. Không tạo tài khoản, không gửi form, không đặt phòng, không quét VietQR, không thử tải.
- Lệnh: đúng lệnh ở `product/tests/README.md` (project `smoke-prod`, `--no-deps`), thêm `--output` ra scratchpad để không sinh `test-results/` trong repo. Kiểm bổ sung bằng `curl`/`openssl` cho các ý runbook 2.3 và G5-5 mà spec chưa phủ (`http` → `https`, `/v1/*` lạ, chứng chỉ, TLS cũ).
- Nhật ký thô ngoài repo: scratchpad phiên `b2-smoke/smoke.log`, `b2-smoke/curl.log`. Không ghi IP máy chủ, không có bí mật.

### 18.1 Kết luận: **ĐẠT** phần không đăng nhập của G5-5 – không lỗi mới

| # | Ca | Kết quả |
|---|---|---|
| PS-01 desk | `https://desk.ottimo.vn/` 200 `text/html`; CSP, HSTS, Referrer-Policy `same-origin`, nosniff, X-Frame-Options DENY, Permissions-Policy, COOP, Cache-Control `no-cache` đúng từng giá trị `expected-headers.sh`; `Server` không lộ phiên bản | **Đạt** |
| PS-01 staff | `https://staff.ottimo.vn/` 200, header như trên, `worker-src 'self'` | **Đạt** |
| PS-01 guest | `https://g.ottimo.vn/` 200, header như trên, Referrer-Policy `no-referrer`, Cache-Control `no-store` | **Đạt** |
| PS-02 | `/health` và `/__test__/clock` từ Internet → 404 (desk; kiểm thêm bằng curl trên staff, g: cũng 404) | **Đạt** |
| PS-03 | `/v1/me`, `/v1/users` không phiên → 401, thân không có `username/phone/email` (staff, g: `/v1/me` cũng 401 `problem+json`) | **Đạt** |
| PS-04 | Desk hiện màn đăng nhập OTTIMO (nút Đăng nhập), tải trang không có request ghi, không lỗi JS | **Đạt** |
| PS-05 | PWA nhân viên và trang khách mở trong Chromium, thân trang có nội dung, không lỗi JS | **Đạt** |
| PS-06 | Đăng nhập tài khoản smoke | **Bỏ qua (cố ý)** – phần đăng nhập do INV tự làm trong buổi (Desk hiện 10 căn), ORC ghi |
| C-1 | `http://` → `https://` cho desk, staff, g, `ottimo.vn`: 308 về đúng host `https` | **Đạt** |
| C-2 | `/v1/<đường lạ>` (`/v1/does-not-exist`, `/v1/`, `/v1/properties`) trên desk, staff, g → 404 `application/problem+json`, thân chỉ có `type/title/status/code/requestId`, không stack | **Đạt** |
| C-3 | Chứng chỉ: 4 host Let's Encrypt, CN đúng host, xác minh chuỗi OK, TLS 1.3, HTTP/2; hết hạn 22/01/2027 (`ottimo.vn`) và 24/01/2027 (desk, staff, g) | **Đạt** |
| C-4 | TLS 1.0 và 1.1 bị từ chối (alert `protocol version`) trên cả 4 host | **Đạt** |
| C-5 | `/.env`, `/.git/config` → 404; GET ẩn danh 3 trang không đặt cookie | **Đạt** |
| C-6 | Landing `https://ottimo.vn/` 200, có HSTS, CSP, X-Frame-Options DENY – không bị ảnh hưởng bởi B2 | **Đạt** |

Tổng: spec `smoke-prod` **7 đạt, 1 bỏ qua (PS-06), 0 lỗi** (903 ms); kiểm bổ sung C-1…C-6 **đạt hết**.

### 18.2 Ghi nhận (không phải lỗi)

- `/v1` (không dấu `/`), `/api`, `/metrics` trên desk trả 200 `text/html`: đây là trang `index.html` của SPA (cùng băm với `/`), không phải API hay số liệu thật. Đúng cấu hình SPA fallback của Caddy, không lộ gì. SEC xem thêm trong SEC-G1/G2 nếu muốn trả 404 cho `/metrics`.
- CSP của landing khác CSP ba SPA (có `frame-src 'none'`, `upgrade-insecure-requests`, không có `blob:`): landing có chính sách riêng, nằm ngoài `expected-headers.sh`. Không đổi kết luận.
- Chứng chỉ do Caddy tự gia hạn; hạn gần nhất 22/01/2027. Giám sát hạn chứng chỉ thuộc G4-10 (OPS), không thuộc smoke.

### 18.3 Chưa kiểm / phần của người khác

- Phần cần đăng nhập (G5-5 ý "đăng nhập", Desk hiện **10 căn**, cờ 2 bước khi đăng nhập lại): INV làm trong buổi, ORC ghi vào biên bản B2.
- Header/TLS sâu, giới hạn kết nối ở edge, cổng mở: SEC-G1/G2 (G7-5), không lặp ở đây.
- Không kiểm luồng ghi nào trên production (đặt phòng, thanh toán, VietQR, gửi form) theo ràng buộc của buổi.
