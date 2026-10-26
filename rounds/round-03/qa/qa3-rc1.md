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
