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

## 19. rc.6 staging – J1 `hold.expire` (BUG-R3-039)

- Người chạy: QA | 29/10/2026 19:00–19:06 (+07), Round 3 – bước **Kiểm thử**, checklist rc.6 mục F (`bug-list.md`, cuối tệp). Bản staging: `main` `8b3aec8` (rc.6), deploy xong 18:58 theo ORC.
- Cách làm: gọi API Desk staging bằng `qa.fd` (lễ tân, không 2FA), mật khẩu đọc từ `~/.ottimo/staging/qa_seed_password.txt`, không in. Helper ở scratchpad phiên `qa-r6/j1/api.mjs`, kết quả thô `qa-r6/j1/*.json`.
- 19:00–19:01: chỉ đọc, dừng vì hạn tối thiểu > 60 phút (19.2, 19.3). 19:03–19:05: ORC duyệt phương án A + B, QA tạo 2 hold trên staging (19.4). Không sửa tham số, không đụng DB, không VietQR, không chuyển tiền, không đụng production, không commit.

### 19.1 Kết luận: **CHƯA KIỂM XONG** – đã tạo ca, chờ hết hạn 07:03 30/10

BUG-R3-039 giữ **Open**. Hai hold đã tạo lúc 19:03, hết hạn 07:03:46 và 07:03:47 ngày 30/10. Phần kiểm sau hạn ORC giao lại sáng 30/10 (19.5).

### 19.2 Tham số staging (GET `booking-rules`, 19:00:22, business date 2026-10-29)

| Tham số | Giá trị staging |
|---|---|
| `hold_hours_options` | 12, 24, 48 |
| `hold_hours_default` | 24 |
| `hold_latest_time_on_arrival` | 12:00 |
| `hold_extension_max_hours` | 24 |

Quy tắc trong mã rc.6 (`reservations/public/pricing.ts` `holdDeadline`, BR-302; `reservations.service.ts` ~970):
- `holdHours` phải nằm trong `hold_hours_options` (ngoài danh sách → 422 `NOT_IN_LIST`).
- Không giữ chỗ cho ngày đến hôm nay (`HOLD_NOT_ALLOWED_TODAY`): ngày đến ≥ business date + 1.
- Hạn = min(lúc tạo + `holdHours`, 12:00 ngày đến). Báo giá → đơn (`quotes.service.ts`) dùng cùng hàm và cùng danh sách. Không có đường tạo hold nào khác cho hạn ngắn hơn.

Hạn ngắn nhất làm được lúc 19:00 29/10: 12 giờ, ngày đến 30/10 → hết hạn **≈ 07:00 30/10**. Trường hợp ngắn nhất có thể trong ngày (tạo trước 06:00 khi business date còn là hôm trước, ngày đến là hôm đó) vẫn còn ~6 giờ. Tất cả đều > 60 phút → dừng.

Mốc đối chiếu: danh sách đơn `status=hold` lúc **19:00:45** = **0 đơn** (khớp số ORC báo; phần "N hold ở A" của mục F = 0, OPS xác nhận bằng DB).

### 19.3 Đề xuất cách khác (ORC chọn)

| | Cách | Ưu | Nhược |
|---|---|---|---|
| **A (QA đề xuất)** | Tạo hold thật trên staging với `holdHours = 12`, ngày đến 30/10, 1 đêm, kênh trực tiếp, khách giả rõ ràng (tên "QA J1 Test", SĐT giả), không cọc, không FOC/giảm giá, có tạo link khách. Tạo lúc T, hết hạn T+12h (vd. tạo 20:00 → hết hạn 08:00 30/10). Kiểm sau hạn + 2 nhịp | Đúng tham số, không sửa gì, kiểm đúng worker rc.6 thật; còn 2 ngày trước Day D 02/11 | Chờ ~12 giờ; căn đó bị giữ đêm 30/10 tới lúc hết hạn – chọn căn không dùng cho UAT; J2 sẽ gửi nhắc hạn cho nhân viên trước giờ hết hạn (đúng thiết kế) |
| B | Gộp vào A: cùng lúc tạo hold thứ 2 có ghi cọc tiền mặt (chỉ bản ghi staging) để kiểm "hold có cọc không bị hủy" (`kept_paid`), và sau hạn ghi cọc vào hold thứ nhất để kiểm `HOLD_EXPIRED` | Phủ đủ 2 ý còn lại của mục F trong cùng một lượt chờ | Giữ thêm 1 căn đêm 30/10 |
| C | Chạy test (d) J1 trong tiến trình chỉ nạp worker, có đồng hồ giả, trên stack dùng một lần dựng từ `8b3aec8` | Có kết quả trong ~30 phút | Không phải staging; CI đã chạy đúng test này (run 40858172485) – không thay được bằng chứng staging theo checklist |
| D | OWN/MGR thêm 1 vào `hold_hours_options` trên staging | Hạn ~1 giờ | ORC đã cấm sửa tham số; vẫn = 60 phút, không < 60; đổi hành vi form giữ chỗ trong lúc UAT. Không đề xuất |
| E | OPS sửa `hold_expires_at` trực tiếp trong DB | Nhanh | ORC đã cấm ghi DB thủ công; bỏ qua kiểm `holdDeadline`. Không đề xuất |

QA đề xuất **A + B**, tạo ngay khi ORC đồng ý (càng sớm hạn càng sớm), kiểm lúc hạn + 2–5 phút. Việc cần OPS sau đó (ORC chuyển): DB `reservation` (status, `cancel_reason_code`, `cancelled_by_type`), `room_occupancy.active`, audit `reservation.hold_expired`, `registration` của đơn, `job done` của `hold.expire` có `failed: 0` ở nhịp hết hạn.

### 19.4 Đã tạo 29/10 (ORC duyệt A + B)

Chọn căn: Rack 29/10 → 11/11 **không có đơn nào trên cả 10 căn** (GET `rack` 19:01, không bar nào). Chọn **101** và **102** (cùng nhóm L12, VC). Không đơn UAT/QA nào khác trên các đêm này.

| | Hold 1 | Hold 2 |
|---|---|---|
| Mã đơn | **OTM-00367** | **OTM-00368** |
| Căn | **101** | **102** |
| Khách (giả) | "QA Hold Test A", KH-0447, SĐT 0900000131, `qa.hold.test1@example.test` | "QA Hold Test B", KH-0448, SĐT 0900000132, `qa.hold.test2@example.test` |
| Báo giá | BG-00048 | BG-00049 |
| Ở | 30/10 → 01/11, **2 đêm**, 2 người lớn, kênh Trực tiếp | như hold 1 |
| Giá | 920.000 × 2 = 1.840.000, giá lịch, giảm 0%, không FOC | 978.000 × 2 = 1.956.000, giá lịch, giảm 0%, không FOC |
| `create-hold` | `holdHours = 12`, `depositMethod = cash` (để không sinh payment VietQR) | như hold 1 |
| Giờ tạo (máy chủ) | **19:03:46.792** 29/10 | **19:03:47.160** 29/10 |
| `hold_expires_at` | **2026-10-30T07:03:46.792+07:00** | **2026-10-30T07:03:47.160+07:00** |
| Cọc yêu cầu | 600.000 | 600.000 |
| Cọc đã ghi | 0 | **200.000 tiền mặt** (19:05:03, bản ghi staging, ghi chú "QA J1 rc.6 test"); đơn vẫn `hold` (US-086 AC2), kỳ vọng J1 trả `kept_paid` |
| Đăng ký lưu trú | `none` | `none` |
| Link khách | **Không cấp được – đúng thiết kế**: `POST …/guest-link` → 409 `INVALID_TRANSITION` (EP06 8.2: chỉ cấp cho `confirmed`/`in_house`, không cho hold) | không thử |

Lệch so với giao việc (không đổi được nếu không sửa tham số hay override):
- **2 đêm thay vì 1**: 30/10 là thứ Sáu, báo giá 1 đêm bị 422 `MIN_STAY_NOT_MET` (`minStayNights: 2`, BR-113). Giữ ngày đến 30/10, không dùng `minStayOverrideReason`. Không ảnh hưởng hạn giữ chỗ.
- **Không có link khách trên hold**: ý "link khách bị thu hồi (B-13)" của mục F không dựng được bằng hold. B-13 cần kiểm bằng ca hủy đơn `confirmed` có link (ngoài phạm vi J1) – đề nghị ORC ghi vào checklist F là "không áp dụng cho hold".

Mốc trước hạn (19:05:13): `status=hold` = 2 đơn (OTM-00367, OTM-00368). `availability` 30/10 → 01/11, 2 người: 103, 201, 202, 203, 301, 401 – **không có 101, 102** (bị giữ, đúng).

### 19.5 Kiểm sau hạn (sáng 30/10, từ 07:06) – kỳ vọng

Chạy `qa-r6/j1/check-after.sh` (scratchpad phiên; GET + 1 lần ghi cọc kỳ vọng bị từ chối), sau đó nhờ OPS phần DB/log.

| # | Kiểm | Kỳ vọng đạt |
|---|---|---|
| 1 | OTM-00367 qua API | `cancelled`, lý do `hold_expired`; lịch sử có B6 hold → cancelled; ghi giờ thấy hủy |
| 2 | Căn 101 | `availability` 30/10 → 01/11 có lại 101; Rack không còn bar OTM-00367; đặt lại được (QA chỉ kiểm bằng `availability`, không tạo đơn thứ 3 trừ khi ORC yêu cầu) |
| 3 | Đăng ký lưu trú OTM-00367 | `none` → `void` (K11) |
| 4 | Ghi cọc tiền mặt vào OTM-00367 sau hạn | Bị từ chối, không ghi tiền. **Lưu ý mã lỗi:** khi J1 đã hủy đơn, `deposits.service.ts` kiểm trạng thái trước nên trả 409 **`INVALID_TRANSITION`** (`currentState: cancelled`); `HOLD_EXPIRED` chỉ xuất hiện nếu đơn còn `hold` sau hạn (J1 chưa chạy hoặc lỗi). Vì vậy `INVALID_TRANSITION`/`cancelled` = đạt; `HOLD_EXPIRED` lúc 07:06 trở đi = J1 **không** hủy = không đạt |
| 5 | OTM-00368 (có cọc 200.000) | Vẫn `hold`, 102 vẫn bị giữ (`kept_paid`, DOM D-9); nhân viên nhận thông báo `hold_overdue_with_deposit` |
| 6 | OPS (DB/log, chỉ đọc) | OTM-00367: `cancelled_by_type = 'system'`, `cancel_reason_code = 'hold_expired'`, `room_occupancy.active = false` cả 2 đêm, 1 audit `reservation.hold_expired`, registration `void`; `job done` `hold.expire` nhịp 07:04 có `expired: 1, keptPaid: 1, failed: 0`, các nhịp sau `expired: 0`; 0 dòng `ERROR [` / `job failed` |

Dọn sau khi kiểm xong: hủy OTM-00368 và xử lý khoản 200.000 tiền mặt theo đường hoàn của Desk (bản ghi staging), để căn 102 trống lại trước UAT.

### 19.6 OPS xác nhận DB/log J1 (30/10, 07:55–07:58 +07)

- Người kiểm: OPS | Round 3 – bước **Kiểm thử**. Staging rc.6: api, worker `ottimo-api:sha-8b3aec89486f`, web `ottimo-web:sha-8b3aec89486f`, chạy từ 29/10 11:57:55Z, `RestartCount` 0 cả bốn container (api, web, postgres `healthy`; worker `running`).
- Cách làm như `outputs/OPS/j15-folio-close-check.md` mục 12: SSH `ottimo-admin`, `StrictHostKeyChecking=yes`; SQL trong `BEGIN READ ONLY … ROLLBACK`, phiên in `transaction_read_only = on`, giờ `Asia/Ho_Chi_Minh`; log worker `dc logs --no-color --timestamps --since 00:02Z --until 00:12Z` (07:02–07:12 giờ VN), bỏ mã màu ANSI, kiểm lại còn 0 ký tự ESC.
- Không ghi DB, không chạy job tay, không chạy `check-after.sh`, **không dọn OTM-00368**. Không in dữ liệu khách: chỉ mã đơn, mã phiếu thu, số căn, số đếm.

**Kết luận: ĐẠT** phần DB/log của BUG-R3-039. Số đếm cho BUG-R3-041 ở bảng 2.

**Bảng 1 – J1 trên DB và log**

| # | Kiểm | Thực tế (DB lúc 07:55:34) | KQ |
|---|---|---|---|
| 1 | OTM-00367 | `status = cancelled`, `status_before_cancel = hold`, `cancelled_by_type = system`, `cancel_reason_code = hold_expired`, `cancelled_at` 07:04:15.170 (hạn 07:03:46.792), `version` 2 | Đạt |
| 2 | `room_occupancy` căn 101 | 1 dòng `[2026-10-30, 2026-11-01)` (bao cả 2 đêm), `active = false`, cập nhật 07:04:15.170 | Đạt |
| 3 | Đêm | 2 dòng `stay_night` (30/10, 31/10): `void`, `void_reason = hold_expired`, `prev_state = hold`, `voided_at` 07:04:15.170 | Đạt |
| 4 | Folio | Folio của OTM-00367 vẫn `open` (folio chỉ có `open/settled/closed`), **0 dòng `folio_line`** và 0 payment: hold chưa ghi dòng tiền phòng nên `voidStay` không có gì để đảo. Không sinh dòng mới | Đạt |
| 5 | Đăng ký lưu trú | `registration.status = void`, `voided_at` 07:04:15.292 | Đạt |
| 6 | Audit | **1** `reservation.hold_expired` (`actor_type = system`, 07:04:15.223, after `{"status":"cancelled","reasonCode":"hold_expired"}`). Kèm 1 `lead.hold_ended` (system) cho báo giá BG-00048 (SM-09). Audit `reservation.hold_expired` toàn DB = 1 (chỉ đơn này). Audit 07:00–07:15 toàn DB: chỉ 2 dòng trên | Đạt |
| 7 | Chuyển trạng thái | `state_transition` SM-01 `hold → cancelled`, sự kiện `B6`, `system`, lý do `hold_expired`, 07:04:15.170 | Đạt |
| 8 | Outbox availability | **1** dòng `channel.availability_changed` 07:04:15, `cause = hold.expired`, 1 khoảng 30/10 → 01/11, căn **101**. Trạng thái `pending`: bình thường trên staging (topic này chưa có bộ phát; toàn bộ 814 dòng của topic đều `pending`) | Đạt |
| 9 | OTM-00368 (`kept_paid`) | Vẫn `hold`, `version` 1, không có `cancelled_*`. `room_occupancy` căn 102 `active = true`; 2 đêm vẫn `hold`; registration `none`. Phiếu thu PT-000465 `deposit` `cash` `succeeded` 200.000. Audit không có dòng nào sau 19:05:03 29/10 (nhánh `kept_paid` không ghi audit, đúng mã). Đơn `hold` toàn DB: 1 (chính đơn này, đã quá hạn) | Đạt |
| 10 | Log worker 07:02–07:12 | 140 dòng, 10 nhịp (07:02:15 … 07:11:15), mỗi nhịp 14 job tick `job done`. **0** `ERROR [`, **0** `job failed`, **0** `AuditEntityNotRegisteredError`; 140/140 dòng mức `info`. Nhịp 07:04:15 có `job done` `hold.expire` (00:04:15.317Z), khớp `cancelled_at` | Đạt |
| 11 | Các nhịp sau không xử lý lại | OTM-00367 giữ `version` 2; không có audit, transition, outbox nào khác cho 2 đơn sau 07:04:15 | Đạt |

Lưu ý về 19.5 mục 6 (`job done` có `expired: 1, keptPaid: 1, failed: 0`): **không đọc được từ log**. Worker rc.6 chỉ log `{"msg":"job done","job":…,"properties":n}`, không in kết quả của job (đã ghi ở `j15-folio-close-check.md` 11.3 mục 2, đề xuất v1.0.1). Thay bằng bằng chứng DB: expired = 1 (dòng 1–8), keptPaid = 1 (dòng 9 và outbox `hold_overdue_partial` ở bảng 2), failed = 0 (không đơn `hold` quá hạn nào ngoài đơn có cọc; 0 dòng lỗi).

**Bảng 2 – Bằng chứng cho BUG-R3-041** (DB lúc 07:56–07:58)

| Kiểm | Kết quả |
|---|---|
| `outbox_message` topic `staff.push`, tạo từ 07:03 30/10, dedupe bắt đầu `hold_expired:` | **1** dòng, 07:04:15, kind `hold_expired`, `refCode` OTM-00367. `status = pending`, `attempts = 0`, `dispatched_at` NULL (chưa gửi) |
| Như trên, dedupe bắt đầu `hold_overdue_partial:` | **1** dòng, 07:04:15, kind `hold_overdue_with_deposit`, `refCode` OTM-00368. `pending`, `attempts = 0`, chưa gửi |
| Toàn bộ topic `staff.push` trên staging | 506 dòng, **0** dòng từng được gửi (không dòng nào `done/in_flight/failed/dead` hay có `dispatched_at`): topic này không có bộ phát |
| `staff_notification` cho OTM-00367/00368 (theo `ref_code` hoặc `ref_id`) | **Không có dòng `hold_expired` hay `hold_overdue_with_deposit` nào.** Chỉ có 2 dòng `hold_expiring` lúc 05:04:12 (mỗi đơn 1, chưa đọc) do J2 ghi qua `events.notify` – khớp QA 19.7 mục 5b |
| `staff_notification` toàn DB tạo từ 07:03 30/10 | **0** dòng |

Như vậy thông báo của J1 dừng ở outbox `staff.push`, không vào hộp thư nhân viên; thông báo J2 thì vào. Khớp nguyên nhân QA nêu ở 19.7. `hold_overdue_cap` (12:00 hôm nay) chưa tới giờ; nếu ORC cần, OPS đếm lại cùng câu sau 12:00.

Còn để lại trên staging: OTM-00368 (hold, căn 102, cọc 200.000 tiền mặt). OPS đã xong phần đọc; việc dọn chờ ORC cho phép (QA làm theo 19.7).

### 19.7 QA kết quả J1 sau hết hạn (30/10, 07:52–07:55 +07)

- Người chạy: QA | Round 3 – bước **Kiểm thử**. Staging rc.6 (`8b3aec8`). API Desk bằng `qa.fd`. Chạy `qa-r6/j1/check-after.sh` (scratchpad phiên) lúc 07:52:45, rồi GET bổ sung tới 07:54:45: thông báo của `qa.fd`, "Cần chú ý", `availability` theo từng căn, lịch sử OTM-00368, đọc lại OTM-00367 sau lần thử ghi cọc. Kết quả thô ở `qa-r6/j1/after-*.json`.
- Ghi duy nhất 1 lần: thử ghi cọc 600.000 tiền mặt vào OTM-00367 (kỳ vọng bị từ chối, và đã bị từ chối). Không đụng DB, không VietQR, không chuyển tiền, không đụng production. **Không dọn OTM-00368** (OPS đang đọc DB/log, mục 19.6).

**Kết luận: ĐẠT phần J1 hủy hold (BUG-R3-039).** Thêm 1 lỗi mới **BUG-R3-041 (P2)**: thông báo của J1 không tới nhân viên nào. Lỗi này không chặn việc xác nhận 039. Phần DB/log chờ OPS (19.6).

| # | Kiểm (19.5) | Thực tế | KQ |
|---|---|---|---|
| 1 | OTM-00367 qua API | `status: cancelled`, `cancellation.reasonCode: hold_expired`, `cancelledAt` **07:04:15.170** (hạn 07:03:46.792, tức nhịp worker đầu sau hạn, trễ 28 giây). `version` 1 → 2 và giữ 2 tới 07:54: các nhịp sau không xử lý lại. Lịch sử có `reservation.transition.B6` hold → cancelled, `actorType: system`, và 1 audit `reservation.hold_expired` (07:04:15.223) | Đạt |
| 2 | Căn 101 trống lại 30/10 → 01/11 | `availability` (2 người lớn) có **101**. `availability` hỏi riêng căn 101: `available: true`. Rack 30/10, 3 ngày: 101 không còn bar nào. Ghi chú: 401 không còn trong danh sách gợi ý vì API chỉ trả tối đa 6 căn (`MAX_SUGGESTIONS`), 101 chiếm một chỗ; Rack cho thấy 401 vẫn trống. Không phải lỗi | Đạt |
| 3 | Đăng ký lưu trú OTM-00367 | `registrationStatus: void` (trước đó `none`) – K11 | Đạt |
| 4 | Ghi cọc vào OTM-00367 sau hạn | **409 `INVALID_TRANSITION`**, `currentState: cancelled` (requestId `c5cd4db6-…`). Không phải `HOLD_EXPIRED`. Đọc lại đơn: `depositPaidVnd` 0, `version` 2, lịch sử vẫn 4 dòng, không có dòng tiền | Đạt |
| 5a | OTM-00368 (cọc 200.000) không bị hủy | `status: hold`, `depositPaidVnd` 200.000, `version` 1, lịch sử không có dòng nào sau 19:05:03 (nhánh `kept_paid` không ghi audit, đúng thiết kế). Căn 102 vẫn bị giữ: Rack có bar `hold` OTM-00368; `availability` hỏi riêng 102: `available: false`, `reason: booked`; danh sách `status=hold` chỉ còn OTM-00368 | Đạt |
| 5b | Nhân viên nhận thông báo `hold_overdue_with_deposit` | Hộp thư `qa.fd` (người tạo hold, vai front_desk) lấy 100 dòng mới nhất: **không có** `hold_overdue_with_deposit`, cũng không có `hold_expired` cho OTM-00367. Chỉ có 2 dòng `hold_expiring` lúc 05:04:12 (J2 nhắc trước hạn, đúng). "Cần chú ý": **không có** mục nào cho OTM-00368. Desk chỉ còn đồng hồ đếm "0h00" màu đỏ trên Rack và Hôm nay (`remaining()` chặn ở 0). Xem BUG-R3-041 | **Không đạt** → BUG-R3-041 (P2) |
| 6 | Link khách | N/A với hold: link chỉ cấp cho `confirmed`/`in_house` (19.4). B-13 cần ca hủy đơn `confirmed` có link, ngoài phạm vi J1 | N/A |
| 7 | Desk đang mở tự làm mới (`reservation.changed`) | **Chưa kiểm**: lúc 07:04 không có Desk nào mở. Có thể kiểm qua log/SSE nếu OPS cần | Chưa kiểm |
| 8 | DB/log (OPS, 19.6) | Chờ OPS: `cancelled_by_type = 'system'`, `room_occupancy.active = false` cả 2 đêm, `job done` `hold.expire` nhịp 07:04 có `expired: 1, keptPaid: 1, failed: 0`, các nhịp sau `expired: 0`, 0 dòng `ERROR [` / `job failed`. Nhờ OPS đếm thêm `outbox_message` topic `staff.push` cho `hold_expired:01a1878b-7812-…` và `hold_overdue_partial:01a1878b-7988-…` (bằng chứng cho BUG-R3-041) | Chờ OPS |

**Nguyên nhân 5b (đọc mã rc.6):** `expireOne` (`reservations.service.ts` ~4654, ~4667, ~4718) gửi `hold_overdue_with_deposit`, `hold_overdue_cap` và `hold_expired` bằng `outboxStaffPush`. Hàm này chỉ ghi `outbox_message` topic `staff.push`, mà topic này không có bộ phát nào (push vẫn là Mock). Hàm không đi qua `EventsService.notify`, nên không ghi `staff_notification` (hộp thư) và không phát SSE. `hold_overdue_with_deposit` và `hold_overdue_cap` cũng không có trong danh sách kind của `staff_notification`. Đối chiếu: J2 `hold_expiring` đi qua `events.notify` nên có trong hộp thư.

**Việc tiếp:**
- 12:00 hôm nay (`hold_latest_time_on_arrival` của ngày đến 30/10), J1 sẽ gửi `hold_overdue_cap` cho MGR, cũng chỉ qua `staff.push`. QA không kiểm thêm. OPS có thể đếm outbox sau 12:00 nếu ORC cần.
- Dọn OTM-00368 (hủy + hoàn 200.000 tiền mặt, bản ghi staging) sau khi OPS xong 19.6 và ORC cho phép.

### 19.8 Dọn OTM-00368 trên staging (30/10, 08:00–08:05 +07)

- Người làm: QA | Round 3 – bước **Kiểm thử**. ORC giao sau khi OPS xong 19.6. Đây là bản ghi thử, không có tiền thật.
- Không SQL tay, không VietQR, không chuyển tiền, không đụng production.
- Thao tác bằng API Desk staging:
  - `qa.fd` (lễ tân).
  - `qa.mgr` đăng nhập bằng mật khẩu thử và TOTP thử trong `~/.ottimo/staging/totp/`, không in ra; đã cập nhật `qa.mgr.laststep`.
  - Helper và kết quả thô: `qa-r6/j1/login-mfa.mjs`, `cleanup-368.sh`, `c-*.json` (scratchpad phiên).

**Chọn đường xử lý tiền: đảo phiếu thu (A34, MGR), không hoàn.**
- Thử hủy (dry run, không ghi): BR-308 cho hold → hoàn 100 %, tự sinh 1 yêu cầu hoàn 200.000.
- Nếu đi đường hoàn, phải qua 3 bước: OWN/MGR duyệt, FD đặt nơi nhận, FD chi tiền mặt. Bước chi bắt buộc có ảnh biên nhận (`EVIDENCE_REQUIRED`), tức phải tạo thêm 1 phiếu chi và 1 ảnh giả.
- Phiếu thu PT-000465 vốn là bản ghi thử, không có tiền thật. Vì vậy đảo phiếu đúng bản chất hơn ("ghi nhầm") và để lại ít dữ liệu hơn.
- Thứ tự: đảo trước, hủy ngay sau. Hủy trước rồi mới đảo sẽ sinh rồi lại tự giảm một yêu cầu hoàn.
- Chạy ngay sau nhịp J1 (:15) để J1 không kịp tự hủy hold sau khi cọc về 0.

| # | Giờ | Thao tác | Kết quả |
|---|---|---|---|
| 0 | 08:00 | FD `cancel` dry run (`reasonCode: other`) | 200: `depositPaidVnd` 200.000, `refundableVnd` 200.000, `retainedVnd` 0, `refundRequestVnd` 200.000. Không ghi |
| 1 | 08:02:18 | MGR `POST payments/PT-000465/actions/reverse` (lý do "QA J1 rc.6 staging test record cleanup - not real money (ORC 30/10)") | 200. PT-000465 → `reversed`; phiếu đảo **PT-000466** `deposit` `cash` −200.000 `succeeded`; audit `payment.reversed` (QA MGR) |
| 2 | 08:02:19 | FD `GET` đơn rồi `cancel` (`If-Match` v1, `reasonCode: other`, ghi chú "QA J1 rc.6 test data cleanup (ORC 30/10)") | 200. `cancelled` v2, B5, `cancelledAt` 08:02:19.417. Báo giá: cọc 0, hoàn 0, giữ 0, `refundRequestVnd` 0, không sinh yêu cầu hoàn |

**Kiểm sau dọn (08:03–08:05, API chỉ đọc)**

| Kiểm | Kết quả | KQ |
|---|---|---|
| OTM-00368 | `cancelled` / `other` (người hủy QA FD), registration `void`, `depositPaidVnd` 0. Lịch sử: B1 → priced → `payment.recorded` → `payment.reversed` (MGR) → B5 → `reservation.cancelled` | Đạt |
| Folio | `open`, 0 dòng; PT-000465 `reversed` 200.000 và PT-000466 −200.000. Tổng: đã thu 0, giữ cọc 0, `balanceDueVnd` 0, `creditVnd` 0, `unhandledCreditVnd` 0, `pendingApprovals` 0 | Đạt (không còn số dư) |
| Căn 102, 30/10 → 01/11 | `availability` hỏi riêng 102: `available: true`. Rack 30/10, 3 ngày: không còn bar nào trên cả 10 căn | Đạt |
| Hold trên staging | `status=hold`: 0 đơn | Đạt |
| "Cần chú ý" của MGR | Không có mục nào cho OTM-00368 | Đạt |

**Dữ liệu thử còn lại của J1 trên staging** (chỉ là bản ghi, không giữ căn nào):
- OTM-00367 và OTM-00368 `cancelled`.
- Khách giả KH-0447, KH-0448; báo giá BG-00048, BG-00049 (về `quoted` theo SM-09).
- PT-000465 (`reversed`) và PT-000466.
- Folio của 2 đơn để `open`, 0 dòng, dư 0. Đây cũng là trạng thái folio của hold bị J1 hủy (OPS 19.6 dòng 4).
- 2 thông báo `hold_expiring` chưa đọc trong hộp thư `qa.fd`.
- 2 dòng outbox `staff.push` (BUG-R3-041).
- Vì OTM-00368 đã hủy, mục "12:00 `hold_overdue_cap`" ở 19.7 không còn áp dụng: không có gì để đếm.

## 20. Cách tạm giữ chỗ quá hạn – thử luồng (rc.6 staging, 30/10)

- Người chạy: QA | Round 3 – bước **Kiểm thử** | 30/10/2026 11:40–12:01 (+07). Theo ORC, kiểm các giả định PO ở `responses/PO-to-v1.0.0-docs-reviews.md` mục 8 cho cách tạm DOM A.3 (`reviews/DOM-on-PO-v1.0.0-docs.md`) và sổ tay `product/docs/manual/user-manual-v1.0.md` mục 2.4. Hạn: trước buổi đào tạo C3a 31/10.
- Đích: `desk.staging.ottimo.vn`, rc.6 `8b3aec8` (= `v1.0.0`), business date 2026-10-30.
- Cách làm:
  - API Desk bằng `qa.fd` (lễ tân), `qa.mgr` và `qa.owner` (mật khẩu thử + TOTP thử trong `~/.ottimo/staging/`, không in).
  - Lệnh cần máy tin cậy gửi cookie thiết bị seed `qa-desk-01`.
  - Desk thật (Chromium 1440×900, phiên `qa.fd`) để xem khung đơn và hộp hủy. Hộp hủy lần 3 bấm thật.
  - Helper và kết quả thô: `qa-r6/hf/` (scratchpad phiên, ngoài repo): `api.mjs`, `api2.mjs`, `ui*.mjs`, `*.json`, `shots/`.
- Dữ liệu đều giả:
  - Khách giả KH-0447 "QA Hold Test A" (tạo ở 19.4).
  - Tiền chỉ là bản ghi tiền mặt trên staging, ghi chú "QA … not real money".
  - Ảnh biên nhận hoàn là ảnh thử "QA TEST IMAGE – NOT A REAL RECEIPT".
  - Giấy tờ khách nhập tay: CCCD giả `000000000131`, không ảnh.
- Không VietQR, không chuyển tiền, không SQL tay, không đụng production, không in khóa TOTP, không commit.
- **Không cần chờ quá hạn.** Theo mã rc.6, các bước hủy – đặt lại – hoàn của cách tạm A.3 (khách tới quầy) giống nhau trước và sau hạn:
  - Hủy giữ chỗ không xét hạn: `allowed-actions.ts` dòng 52–58, `cancel` cho `hold` không có điều kiện `holdExpired`.
  - Hoàn 100 % số đã nhận theo BR-308 cho giữ chỗ.
  - Đặt đơn mới, thu tiền, nhận phòng và hoàn tiền nằm trên đơn khác, không đụng hạn của đơn cũ.
  - Sau hạn chỉ khác ở các chỗ Desk **từ chối** (xác nhận cọc, gia hạn – BUG-R3-042) và ở chữ khung đơn (BUG-R3-044 phần 1–2). Hai chỗ này chưa thử được (20.5).

### 20.1 Kết luận

| # | Giả định / câu trong tài liệu | Kết quả | Bằng chứng |
|---|---|---|---|
| G1 | PO: "Khung đơn đã tạo **không có** ô ghi chú cho lễ tân" | **Đạt** (giả định đúng). Khung đơn giữ chỗ không có ô nhập nào. Mã Desk: `internalNote` chỉ có ở **Đặt phòng mới** khi kênh **Nội bộ** (`BookingDialog.tsx` dòng 1099–1112). Khung đơn không hiện cũng không sửa ghi chú nội bộ; không hộp nào gọi `updateReservation` với `internalNote`. Dùng sổ giao ca là đúng | 20.2 dòng 5, `shots/a1-drawer.png` |
| G2 | PO: "Đặt phòng mới ở quầy (Trực tiếp) lưu thành **Đã xác nhận** và nhận phòng được khi thu đủ ở bước nhận phòng" | **Đạt, kèm 1 điều kiện tài liệu thiếu**. Đơn mới lưu `confirmed`. Nhận phòng bị chặn khi chưa thu đủ (409 `balance_paid`), thu cùng lệnh nhận phòng thì vào `in_house`. **Nhưng** đơn mới **phải thu đủ cọc yêu cầu ngay lúc đặt** (422 `DEPOSIT_INSUFFICIENT`), nên "thu đủ 2.376.000 ở bước nhận phòng" là sai bước: cọc thu ở (b), phần còn lại ở (c) | 20.2 dòng 8–9, 20.4 |
| G3 | PO/DOM: "Người tạo yêu cầu hoàn không tự chi tiền mặt được" | **Đạt**. 403 `SELF_REFUND_FORBIDDEN` cho FD và cả MGR là người tạo. Người khác chi được; OWN vừa duyệt vừa chi tiền mặt được | 20.2 dòng 13–14, 18–19 |
| G4 | DOM A.3 / sổ tay 2.4: "Người trực hủy **và duyệt**" (tài khoản 6 vai tự duyệt) | **Không đạt**. Người tạo yêu cầu hoàn **không duyệt được** khoản hoàn của mình: 403 `SELF_APPROVAL_FORBIDDEN`, không có ngoại lệ cho quản lý hay chủ đầu tư (SEC F8). Người trực hủy đơn → chủ đầu tư phải **duyệt và chi**. Không phải lỗi sản phẩm: quy tắc tách nhiệm đã chốt. Đây là **lỗi tài liệu** | 20.2 dòng 15–16 |
| G5 | Sổ tay 2.4: "Không tạo đơn mới trước khi hủy đơn cũ (Desk chặn trùng)" | **Đạt**. 409 `ROOM_UNAVAILABLE`, xung đột với giữ chỗ cũ, không ghi tiền | 20.2 dòng 4 |
| G6 | BUG-R3-044: hộp hủy giữ chỗ có cọc ghi "Không thu phí (giữ chỗ chưa cọc)", không hiện dòng hoàn | **Tái hiện trên staging** (phần 3, trước hạn). Máy chủ vẫn tạo yêu cầu hoàn đủ 200.000 | 20.3 |
| G7 | Sổ tay 2.4: hủy với lý do **Khác (ghi rõ)** | **Không làm được trên Desk** → **BUG-R3-046 (P2, mới)** | 20.3 |
| G8 | Tái hiện BUG-R3-042 và 044 phần 1–2 bằng đồng hồ giả | **Bỏ qua.** Staging không có đồng hồ giả (20.5) | – |

- **Lỗi mới:** **BUG-R3-046 (P2)** – hủy với "Khác (ghi rõ)" bị khóa. **BUG-R3-047 (P3)** – khung đơn giữ chỗ hiện nút link check-in online mà máy chủ luôn từ chối. Không có P0/P1 mới.
- **Tài liệu phải sửa trước C3a 31/10** (PO; DOM duyệt nghiệp vụ): G2 (thu cọc ở bước (b)), G4 (chủ đầu tư duyệt), G7 (không dùng "Khác") – chi tiết 20.7.
- Dọn xong (20.6): không còn đơn treo; căn 202 và 103 trống; 3 folio dư 0.

### 20.2 Luồng A.3 "Khách đó tới quầy" – từng bước (căn 202, 09/11 → 11/11, 2 đêm, giá 750.000/đêm)

| # | Giờ | Bước theo sổ tay | Ai | Thao tác | Kết quả |
|---|---|---|---|---|---|
| 1 | 11:40:47 | (dựng ca) Báo giá | FD | `saveQuote` căn 202, 2 người lớn, Trực tiếp | 201 BG-00050: 1.500.000, cọc yêu cầu 500.000 |
| 2 | 11:40:52 | (dựng ca) Giữ chỗ | FD | `create-hold` 12 h, cọc tiền mặt | 201 **OTM-00369** `hold`, hạn 23:40 30/10 |
| 3 | 11:40:59 | (dựng ca) Cọc **thiếu** | FD | `confirm-deposit` 200.000 tiền mặt (PT-000467) | 200, đơn vẫn `hold`, đã cọc 200.000 / 500.000 (A-13) |
| 4 | 11:41:20 | Cảnh báo "không đặt đơn mới trước khi hủy" | FD | `createReservation` cùng căn, cùng ngày, kèm cọc 500.000 | **409 `ROOM_UNAVAILABLE`**, xung đột `kind: hold` OTM-00369. Không ghi đơn, không ghi tiền. `availability` căn 202: `available: false`, `booked` → **câu sổ tay đúng** |
| 5 | 11:42 | Khung đơn: có ô ghi chú cho lễ tân không? | FD (Desk) | Mở khung đơn OTM-00369 | **Không có ô nhập nào** trong khung đơn (0 `input/textarea/select`). Nút: Tạo link check-in online, Thu hồi link, Hủy giữ chỗ, Gia hạn giữ chỗ (1 lần), Xác nhận đã nhận cọc (20.3) |
| 6 | 11:42–11:43 | (a) Hủy giữ chỗ, **Khác (ghi rõ)** | FD (Desk) | Hộp **Hủy giữ chỗ** | Hộp ghi sai với đơn có cọc (BUG-R3-044 phần 3). **Không hủy được với "Khác (ghi rõ)"** → **BUG-R3-046** (20.3) |
| 7 | 11:43:47 | (a) Hủy giữ chỗ – lý do khác | FD (Desk) | **Không liên lạc được** → **Hủy giữ chỗ** | 200, OTM-00369 `cancelled`, registration `void`; toast "Đã hủy đơn OTM-00369". Máy chủ tạo **yêu cầu hoàn 200.000** (`unreachable`, người tạo **QA FD**, `requiredRole: manager`). Hộp không báo khoản hoàn này |
| 8 | 11:46:04 | (b) Đặt phòng mới cùng căn, cùng giá | FD | `createReservation` 202, 09–11/11, `walk_in`, 2 đêm 750.000 (`edited: true`) | **Không kèm cọc → 422 `DEPOSIT_INSUFFICIENT`** (cần 500.000; thử trên căn 102, không ghi gì). **Kèm cọc 500.000 tiền mặt → 201 OTM-00370 `confirmed`** (PT-000468). Nút: `move`, `cancel` (chưa tới ngày đến nên chưa có `check-in`) |
| 9 | 11:46 | (c) Thu đủ ở bước nhận phòng | FD | `check-in-preview` OTM-00370 | `balance_paid` chưa đạt, **còn thu 1.000.000** = 1.500.000 − 500.000 cọc lúc đặt. Nhận phòng thật: xem 20.4 (đơn đến hôm nay) |
| 10 | 11:45:13 | (d) Duyệt hoàn – lễ tân | FD | `approve` yêu cầu hoàn | 403 `FORBIDDEN_ACTION` (FD không có quyền duyệt) |
| 11 | 11:45:36 | (d) Nơi nhận tiền hoàn | FD | `refund-destination` = tiền mặt | 200 (cần máy tin cậy; không có cookie máy → 403 `DEVICE_NOT_TRUSTED`) |
| 12 | 11:46:23 | (d) Duyệt hoàn | **OWN** | `approve` (mật khẩu) | 200 `approved`, người duyệt QA OWNER |
| 13 | 11:46:32 | (d) Chi tiền mặt – **người tạo yêu cầu** | FD (người tạo) | `execute-cash-refund` 200.000 + ảnh biên nhận thử | **403 `SELF_REFUND_FORBIDDEN`** → giả định PO **đúng** |
| 14 | 11:46:41 | (d) Chi tiền mặt | **OWN** (cũng là người duyệt) | `execute-cash-refund` 200.000 | 201 **PT-000469** −200.000 `refund` `cash`. Folio OTM-00369: đã thu 200.000, đã hoàn 200.000, **còn thu 0, tiền dư 0** |

**Ca "tài khoản 6 vai tự duyệt"** (người trực có quyền quản lý, chính người đó hủy đơn). Dựng bằng `qa.mgr` khi dọn OTM-00370:

| # | Giờ | Thao tác | Kết quả |
|---|---|---|---|
| 15 | 11:48:35 | MGR hủy OTM-00370 (`guest_changed_mind`) | 200 `cancelled`, BR-309: giữ lại 0, **yêu cầu hoàn 500.000**, người tạo **QA MGR** |
| 16 | 11:48:41 | **MGR tự duyệt** yêu cầu hoàn của chính mình | **403 `SELF_APPROVAL_FORBIDDEN`**. Chữ Desk cho mã này (`strings-vi.json` dòng 411, chưa mở trên Desk): "Bạn không tự duyệt yêu cầu của chính mình được. Yêu cầu vẫn chờ người duyệt khác." |
| 17 | 11:48:57 | MGR đặt nơi nhận tiền mặt → **OWN duyệt** | 200 / 200 `approved` |
| 18 | 11:48:58 | **MGR (người tạo) chi** tiền mặt | **403 `SELF_REFUND_FORBIDDEN`** (có quyền quản lý vẫn bị chặn) |
| 19 | 11:48:58 | **OWN chi** tiền mặt 500.000 | 201 PT-000471. Folio OTM-00370: còn thu 0, tiền dư 0 |

Quy tắc trong mã khớp kết quả:
- `approval.service.ts` dòng 1352–1356: không ai duyệt khoản hoàn do mình tạo, "no owner/manager exception" (SEC F8).
- Dòng 1369–1374: người **đặt nơi nhận** cũng không được duyệt khoản hoàn tiền mặt, kể cả OWN.
- `refunds.service.ts` dòng 495: người tạo yêu cầu không chi tiền mặt, không ngoại lệ.
- Dòng 498–503: người duyệt **được** chi tiền mặt; với hoàn chuyển khoản thì người duyệt hoặc người đặt nơi nhận không chi được, trừ OWN.

### 20.3 Khung đơn và hộp hủy trên Desk (OTM-00369, giữ chỗ có cọc 200.000, **trước hạn**)

- **Khung đơn** (`shots/a1-drawer.png`):
  - Không có ô ghi chú hay ô nhập nào. Hiện "Hết hạn giữ chỗ sau 11 giờ 58 phút (23:40 30/10) – Quá hạn chưa cọc → hệ thống tự hủy và mở bán lại căn."
  - Folio: Tiền phòng 1.500.000 · Cọc cần thu 300.000 · Đã thu −200.000.
  - Có nút link check-in online, máy chủ không cấp cho giữ chỗ → **BUG-R3-047** (P3).
- **Hộp Hủy giữ chỗ** (`shots/a1-cancel.png`), đối chiếu BUG-R3-044 phần 3:
  - Hộp ghi: "Căn 202 sẽ mở bán lại từ 09/11 đến 11/11 trên mọi kênh. Khách tiềm năng QA Hold Test A trở về 'Đã báo giá'." và "**Không thu phí (giữ chỗ chưa cọc)**".
  - **Không có dòng nào về khoản sẽ hoàn.** Bản tính thử trả `refundableVnd` = `refundRequestVnd` = 200.000, nên dòng `cancel.refund_request` bị ẩn (`ReservationDialogs.tsx` dòng 351).
  - Hủy xong, máy chủ tạo yêu cầu hoàn 200.000 (20.2 dòng 7). Toast chỉ báo "Đã hủy đơn OTM-00369".
  - **Khớp BUG-R3-044 phần 3, tái hiện trên staging.** Câu cảnh báo của sổ tay ("đừng tin dòng này – Desk vẫn tạo yêu cầu hoàn đủ số đã nhận") đúng.
- **Lý do "Khác (ghi rõ)"** (`shots/a1-cancel-other.png`, `a2-cancel-other-note.png`):
  - Chọn xong, hộp báo ngay "Chưa tính được phí hủy nên chưa hủy được. Bấm Thử lại." Nút **Hủy giữ chỗ** khóa.
  - Gõ ghi chú "QA test - het han giu cho co coc" rồi bấm **Thử lại**: vẫn khóa. Bản tính thử gửi lại `{"reasonCode":"other","dryRun":true}` không có `note`, 422 `note` `REASON_REQUIRED`.
  - Các lý do khác tính thử 200, hủy được ("Không liên lạc được" đã hủy thật ở dòng 7).
  - → **BUG-R3-046 (P2)**. Sổ tay 2.4 hiện dặn **Khác (ghi rõ)** ở 3 chỗ: hủy giữ chỗ chưa cọc quá hạn, dòng "Không đi nữa", và bước (a) của dòng "Khách đó tới quầy". Làm theo sổ tay thì kẹt ở hộp hủy.

### 20.4 Nhận phòng khi thu đủ ở bước nhận phòng (OTM-00371, căn 103, đến hôm nay 30/10 → 01/11, 1 người lớn)

Đơn ở 20.2 đến ngày 09/11 nên chưa nhận phòng được: nút `check-in` chỉ có khi hôm nay là ngày đến (`allowed-actions.ts` dòng 63). Phần "thu đủ → nhận phòng" vì vậy thử trên một đơn Trực tiếp đến hôm nay, cùng cách đặt.

| # | Giờ | Thao tác | Kết quả |
|---|---|---|---|
| 1 | 11:47:45 | FD `createReservation` không kèm cọc | 422 `DEPOSIT_INSUFFICIENT`, cần 600.000. Không ghi gì |
| 2 | 11:47:51 | FD đặt lại, kèm cọc 600.000 tiền mặt (PT-000470) | 201 **OTM-00371** `confirmed`, nút `check-in` có. Tổng 1.956.000 (978.000 × 2) |
| 3 | 11:48:13 | FD nhập tay giấy tờ khách chính (CCCD giả, không ảnh) → hoàn tất kiểm (`complete-review`) | 201 / 200 `scanned`. Các mục kiểm `pass` hoặc `not_applicable` |
| 4 | 11:48:23 | FD nhận phòng trước 12:00 | 422 `applyEarlySurcharge` `SURCHARGE_DECISION_REQUIRED` (phụ thu nhận sớm, đúng BR-414). QA chờ tới 12:00 để không ghi phụ thu |
| 5 | 12:00:22 | `check-in-preview` | Chỉ còn `balance_paid` chưa đạt; **còn thu 1.356.000** = 1.956.000 − 600.000; phụ thu sớm 0 |
| 6 | 12:00:22 | FD nhận phòng **không thu** | **409 `CHECKIN_CONDITIONS_NOT_MET`**, `unmet: [balance_paid]`, `balanceDueVnd` 1.356.000. Không ghi gì |
| 7 | 12:00:23 | FD nhận phòng **kèm thu** 1.356.000 tiền mặt (`payment.type = charge`) | **200 `in_house`**; PT-000472; folio tổng 1.956.000, đã thu 1.956.000, còn 0; Rack căn 103 = OC |

Kết luận: nhận phòng được khi thu đủ ở bước nhận phòng (BR-402 (2), thu và nhận phòng trong cùng một giao dịch). Bước 1 cho thấy G2: đơn Trực tiếp mới không lưu được nếu chưa có cọc.

Ghi chú:
- Nhận phòng qua API, không qua màn H13 trên Desk. H13 gửi đúng lệnh này với `payment` (BUG-R2-038; A1 26/10 ở 3.1 đã chạy trên Desk).
- Bước 4 là hành vi đúng. Sổ tay nên nhắc rằng khách tới trước 12:00 sẽ có hỏi phụ thu nhận sớm (đã có ở mục nhận phòng).

### 20.5 Đồng hồ giả trên staging – không có, bỏ qua tái hiện quá hạn

- `GET https://desk.staging.ottimo.vn/v1/__test__/clock` → **404 `NOT_FOUND`** (JSON của API). Đường `/api/__test__/clock` trả 200 chỉ vì là trang SPA.
- Staging chạy cấu hình production: `docker-compose.prod.yml` `CLOCK_MODE=system`, `INCLUDE_TEST_SUPPORT=0`. Image production bỏ thư mục `test-support` (`Dockerfile.api` dòng 28–30).
- Hold quá hạn ngắn nhất trên staging cần ≥ 12 giờ (19.2). ORC cấm sửa tham số và ghi DB.
- Vì vậy **chưa tái hiện trên staging**:
  - BUG-R3-042 (xác nhận cọc sau hạn → `HOLD_EXPIRED`);
  - BUG-R3-044 phần 1 (khung đơn "đơn đã tự hủy") và phần 2 (câu `HOLD_EXPIRED` "căn đã mở bán lại").
  - Cả hai vẫn **xác minh bằng mã**. Muốn tái hiện: tạo hold 12 h có cọc thiếu lúc ~20:00, kiểm lúc ~08:00 hôm sau (như 19.4), hoặc chạy trên stack dùng một lần có `CLOCK_MODE=mutable`.
- Phần **không** phụ thuộc hạn đã thử đủ: hủy, đặt lại, thu, nhận phòng, hoàn (giải thích ở đầu mục).

### 20.6 Dữ liệu staging – trước / sau

| | Trước (11:40) | Sau (12:01) |
|---|---|---|
| Đơn `hold` | 0 | 0 |
| Rack 30/10 → 12/11, 10 căn | Không bar nào | Không bar nào; 101, 102, 103, 202, 301, 401, 402 `VC`; 203 `VD`; 201, 302 `OD` – như lúc đầu |
| Căn 202, 09–11/11 | Trống | `availability`: `available: true` |
| Căn 103, 30/10 → 01/11 | `VC`, trống | Hoàn tác nhận phòng (MGR, B17, 12:00:39) → `VC`; `available: true` |

Bản ghi thử còn lại (chỉ là bản ghi, không giữ căn nào, không còn tiền dư):
- **OTM-00369** `cancelled` (`unreachable`, FD).
  - Folio `open`: PT-000467 cọc 200.000, PT-000469 hoàn −200.000. Còn thu 0, tiền dư 0.
  - Yêu cầu hoàn đã chi đủ (`approved`, `refundedVnd` 200.000, OWN).
- **OTM-00370** `cancelled` (`guest_changed_mind`, MGR).
  - Folio: PT-000468 cọc 500.000, PT-000471 hoàn −500.000. Còn thu 0, tiền dư 0.
  - Yêu cầu hoàn đã chi đủ (OWN).
- **OTM-00371** `cancelled` (`guest_changed_mind`, FD), registration `void`.
  - MGR đảo PT-000470 (cọc 600.000) → PT-000474, và PT-000472 (thu 1.356.000) → PT-000473, lý do "test record cleanup – not real money".
  - Folio: tổng 0, đã thu 0, còn thu 0, tiền dư 0.
  - Giấy tờ giả (CCCD `000000000131`, không ảnh) nằm trong registration `void`.
- Báo giá BG-00050 (về `quoted` theo SM-09). 2 ảnh biên nhận thử (`refund_proof`).
- Thông báo `refund_ready` trong hộp thư `qa.fd`/`qa.mgr` (nếu có).
- "Cần chú ý" của MGR không có mục nào cho 3 đơn. Khách giả KH-0447 dùng lại, không tạo khách mới.
- Đối chiếu tiền: đã ghi 2.656.000 tiền mặt thử. Hoàn 700.000, đảo 1.956.000. Mọi folio dư 0.

### 20.7 Việc cho PO/DOM trước buổi C3a 31/10 (QA đề nghị, PO quyết chữ)

1. **Bỏ "Khác (ghi rõ)" khỏi hướng dẫn hủy** tới khi có bản sửa BUG-R3-046. Chỗ cần đổi:
   - Sổ tay 2.4, khung "Giữ chỗ quá hạn": bước 2 (chưa cọc), dòng "Không đi nữa", dòng "Khách đó tới quầy" bước (a).
   - Sổ tay mục Hủy (dòng ~772) liệt kê "Khác (ghi rõ)" như một lựa chọn dùng được.
   - `staff-one-pager.md` dòng 81–82.
   - Thay bằng lý do có sẵn: **Không liên lạc được** (gọi không được), **Khách đổi ý** (khách không đi hoặc làm lại đơn). Câu cần ghi ("Hết hạn giữ chỗ – có cọc", "Tạo lại khi khách đến – thay bằng OTM-…") chuyển sang sổ giao ca.
2. **Người trực không tự duyệt được khoản hoàn do chính mình tạo** khi hủy đơn: 403 `SELF_APPROVAL_FORBIDDEN`, không có ngoại lệ cho quản lý hay chủ đầu tư. OTTIMO có một người trực giữ 6 vai, nên mọi khoản hoàn sinh ra khi người trực hủy đơn đều cần **chủ đầu tư duyệt**. Chỗ cần sửa:
   - Sổ tay 2.4, dòng "Không đi nữa": cột "Ai" ghi "Người trực hủy và duyệt" → "Người trực hủy, chọn nơi nhận; chủ đầu tư duyệt và chi (tiền mặt)". Bỏ "Mở **Cần duyệt** để duyệt hoàn" khỏi việc của người trực.
   - Dòng "Khách đó tới quầy" bước (d): "chủ đầu tư **duyệt và** chi".
   - Sổ tay 1.1 dòng ~212: "chi hoàn tiền mặt mà người trực đã duyệt" → "duyệt và chi các khoản hoàn người trực tạo".
   - Sổ tay mục Hủy (dòng ~776): "duyệt ở **Cần duyệt**" → ghi rõ ai duyệt.
   - DOM A.3: câu "Tài khoản 6 vai tự duyệt được" không đúng với Desk.
   - Nói thêm cho đúng thứ tự: người trực đặt **nơi nhận** trước, rồi chủ đầu tư mới duyệt. Nếu chủ đầu tư tự đặt nơi nhận tiền mặt thì cũng không duyệt được (đọc mã, dòng 1369–1374). Với hoàn **chuyển khoản**, chủ đầu tư được tự đặt nơi nhận, duyệt và chi.
   - Hệ quả vận hành, DOM xem: khách đến quầy lúc chủ đầu tư vắng thì người trực **không** trả lại cọc cũ tại quầy được, kể cả có quyền quản lý. Lúc đó chỉ còn cách chủ đầu tư duyệt (Desk, mật khẩu) rồi chuyển khoản trong ngày, đúng như sổ tay đã ghi ở (d). Nếu INV muốn người trực tự xử lý hoàn tại quầy, đó là đổi quy tắc tách nhiệm SEC F8 → SEC + INV quyết, không sửa trong v1.0.1.
3. **Bước (b) phải thu cọc ngay lúc đặt đơn mới.** Đơn Trực tiếp/CTV không lưu được nếu chưa đủ cọc yêu cầu (422 `DEPOSIT_INSUFFICIENT`; Desk cũng bắt ô **Số tiền đã nhận** > 0). Vì vậy:
   - Câu "(c) Thu đủ 2.376.000 ở bước nhận phòng" nên thành: "(b) … nhập **Số tiền đã nhận** ít nhất bằng **cọc yêu cầu** (ví dụ 700.000) và cách trả; (c) thu phần còn lại ở bước nhận phòng".
   - Tổng khách trả không đổi. Phần đã chuyển sau hạn (dòng cuối bảng) ghi vào ô này ở bước (b), không phải bước (c).
4. Các phần còn lại của cách tạm **đúng trên staging**:
   - Phải hủy đơn cũ trước khi đặt đơn mới (409 `ROOM_UNAVAILABLE`).
   - Đơn mới lưu thành **Đã xác nhận**.
   - Nhận phòng bị chặn khi chưa thu đủ, và thu cùng lệnh nhận phòng thì vào được (20.4).
   - Người tạo yêu cầu không tự chi tiền mặt.
   - Chủ đầu tư vừa duyệt vừa chi tiền mặt được.
   - Folio cũ về 0.

### 20.8 Xác nhận 2 giả định PO trên giao diện Desk (rc.6 staging, 30/10 12:16–12:24)

- Người chạy: QA | Round 3 – bước **Kiểm thử** | theo ORC, cho `responses/PO-to-v1.0.0-docs-reviews.md` mục 10.6 (và việc "QA (nếu kịp trước C3a)" ở 10.4). Đích: `desk.staging.ottimo.vn`, rc.6 `8b3aec8` (= `v1.0.0`), business date 30/10.
- Cách làm: **Desk thật** (Chromium 1440×900, `vi-VN`) với phiên `qa.fd` (Lễ tân) và cookie thiết bị seed `qa-desk-01` (máy quầy đã cấp quyền). Mọi bước của lễ tân bấm trên giao diện: đặt đơn, hủy đơn, nhập nơi nhận hoàn. API chỉ dùng để dọn (OWN duyệt + chi, MGR đảo khoản) và để đọc kiểm. Helper, ảnh, mạng: `qa-r6/hf2/` (scratchpad phiên, ngoài repo).
- Dữ liệu đều giả: khách giả KH-0447 "QA Hold Test A"; tiền chỉ là bản ghi tiền mặt trên staging, ghi chú "QA test record - not real money"; ảnh biên nhận hoàn là ảnh thử "QA TEST IMAGE – NOT A REAL RECEIPT". Không VietQR (không bấm **Tạo VietQR**), không chuyển tiền, không SQL, không in khóa TOTP, không commit.

#### 20.8.1 Kết luận

| # | Giả định PO (10.6) | Kết quả | Bằng chứng |
|---|---|---|---|
| 1 | Lễ tân mở được **Nhật ký tiền → Hoàn tiền → Nhập nơi nhận hoàn** trên Desk (máy tin cậy) cho khoản do mình tạo, đúng sổ tay 1.4 mục 2.8 | **Đạt.** Tên mục, tab, nút đúng chữ sổ tay. Thứ tự đúng: hủy đơn → Desk tạo yêu cầu hoàn → **Nhật ký tiền** (nhóm **Quản trị**) → tab **Hoàn tiền** → dòng của đơn → **Nhập nơi nhận hoàn** → **Cách hoàn** → **Lưu**. Lưu xong dòng ghi "Cách hoàn: Tiền mặt", vẫn **Chờ duyệt**. Có 3 chỗ sổ tay nên bổ sung (20.8.4) | 20.8.2 dòng 1–6; `shots/u0-refund-tab.png`, `d2-dialog.png`, `d2-after.png` |
| 2 | Khi **đặt đơn** và khi **nhận phòng**, Desk chỉ nhận **một** cách thanh toán mỗi lần thu | **Đạt.** Đặt đơn: một ô **Số tiền đã nhận** + một danh sách **Cách thanh toán**; lệnh gửi một `initialPayment`. Nhận phòng: khối **Thu tiền trước khi giao mã** chọn đúng một trong 4 cách, thu đúng **Cần thu để nhận phòng**; không có nút thêm cách thứ hai. Cách ghi gộp ở sổ tay 2.4 (dòng "lỡ chuyển nốt sau hạn") khớp Desk. Câu "Thu nhiều lần, nhiều cách được" ở sổ tay 2.13 **không đúng** cho hai bước này (20.8.4) | 20.8.3; `shots/b2-pay.png`, `ci2-pay-default.png`, `ci2-pay-cash.png`, `ci3-transfer.png`, `ci3-pos.png` |

- **Lỗi mới:** **BUG-R3-048 (P3, UXD + FE-A)**: trên máy **chưa** cấp quyền, **Lưu** nơi nhận hoàn bị từ chối đúng (403 `DEVICE_NOT_TRUSTED`) nhưng Desk báo "Máy này chưa được cấp quyền **xem giấy tờ và mã cửa**…". Lễ tân không hiểu vì sao việc hoàn tiền bị chặn. Không có P0/P1/P2 mới.
- **Tên nút sai trong sổ tay:** không có. Mọi chữ sổ tay 2.8 và 1.12 dùng cho luồng này khớp Desk từng chữ (bảng 20.8.4 phần A).
- Dọn xong (20.8.5): không còn đơn treo, không còn giữ chỗ; căn 202 và 103 trống; 2 folio dư 0; yêu cầu hoàn mới đã chi đủ.

#### 20.8.2 Ý 1 – từng bước trên Desk (OTM-00372, căn 202, 17/11 → 19/11, 2 đêm, 750.000/đêm)

| # | Giờ | Bước | Ai | Thao tác trên Desk | Kết quả |
|---|---|---|---|---|---|
| 1 | 12:17:54 | (dựng ca) Đặt đơn có cọc | FD | **Đơn đặt phòng → Đặt phòng mới**: căn 202, 17/11–19/11, **Trực tiếp**, **Khách vãng lai**, khách KH-0447. **Số tiền đã nhận** để nguyên 500.000, **Cách thanh toán** đổi sang **Tiền mặt** → **Tạo đơn** | 201 **OTM-00372** `confirmed`, PT-000475 cọc 500.000 tiền mặt. Toast "Đã tạo đơn OTM-00372" |
| 2 | 12:18:34 | Hủy đơn (sổ tay 2.8 **Hủy** bước 2) | FD | Khung đơn → **Hủy đơn** → **Lý do hủy**: **Khách đổi ý** → đọc hộp → **Hủy đơn** | Hộp **Hủy đơn OTM-00372 của QA Hold Test A?** ghi "Không giữ phí hủy; hoàn đủ 500.000 cho khách – cần quản lý duyệt" (báo trước 18 ngày → hoàn 100 %). 200 `cancelled`. Máy chủ tạo yêu cầu hoàn 500.000, người tạo **QA FD**, `pending` |
| 3 | 12:19 | Mở Nhật ký tiền | FD | Menu trái, nhóm **Quản trị** → **Nhật ký tiền** (`/audit`) | Mở được. 3 tab: **Nhật ký thao tác tiền**, **Chờ đối soát**, **Hoàn tiền** |
| 4 | 12:19 | Tab Hoàn tiền | FD | Bấm **Hoàn tiền** | Danh sách mới nhất ở trên. Dòng đầu: "OTM-00372 · 500.000 / QA FD gửi lúc 30/10/2026 12:18 / —", nhãn **Chờ duyệt**, nút **Nhập nơi nhận hoàn**. Không có nút **Chi hoàn tiền mặt** (chưa duyệt) |
| 5 | 12:19 | Mở hộp | FD | **Nhập nơi nhận hoàn** | Hộp **Nhập nơi nhận hoàn**, nhóm **CÁCH HOÀN** gồm 3 nút chọn một: **Tiền mặt** (chọn sẵn) · **Chuyển khoản** · **Cùng cách khách đã trả**. Nút **Hủy**, **Lưu** |
| 6 | 12:19:17 | Lưu nơi nhận | FD | **Tiền mặt** → **Lưu** | 200 `PUT …/refund-destination` `{"method":"cash"}`. Dòng đổi thành "Cách hoàn: Tiền mặt", vẫn **Chờ duyệt**, nút **Nhập nơi nhận hoàn** vẫn còn (sửa lại được) |
| 7 | 12:19:37 | Cùng thao tác trên máy **chưa** cấp quyền | FD | Như dòng 3–6, không có cookie thiết bị | Nhật ký tiền, tab, nút, hộp **vẫn hiện**. Bấm **Lưu** → 403 `DEVICE_NOT_TRUSTED`, không đổi gì. Toast: "Máy này chưa được cấp quyền xem giấy tờ và mã cửa. Dùng máy quầy đã cấp, hoặc nhờ chủ đầu tư cấp quyền cho máy này." → **BUG-R3-048** |

Ghi chú:
- Câu "Desk tạo yêu cầu hoàn" ở sổ tay 2.8 đúng: dòng xuất hiện ngay ở tab **Hoàn tiền**, không cần làm thêm gì ở khung đơn.
- Hộp hủy ghi "cần **quản lý** duyệt". Sổ tay đã nói rõ ở OTTIMO là chủ đầu tư duyệt và chi. Người dạy C3a nên nhắc chữ này để lễ tân không đi tìm "quản lý".
- Trên staging tab **Hoàn tiền** dài (khoảng 50 yêu cầu cũ của các lượt E2E). Trên production ngày D danh sách sẽ ngắn. Tab không có ô tìm theo mã đơn, nên lễ tân tìm dòng bằng **mã đơn** (OTM-…) và giờ gửi.

#### 20.8.3 Ý 2 – một cách thanh toán mỗi lần thu

**Đặt đơn** (`shots/b1-pay.png`, `b2-pay.png`; mạng `b2-net.json`):
- Khối tiền dưới **Giá mỗi đêm** chỉ có: **Số tiền đã nhận \*** (một ô, điền sẵn bằng **Cọc cần thu**), **Cách thanh toán** (một danh sách: **Chuyển khoản VietQR** · **Chuyển khoản** · **Tiền mặt** · **Thẻ (máy POS tại quầy)**), **Mã giao dịch / ghi chú (không ghi số thẻ)**. Không có nút thêm khoản hay thêm cách.
- Danh sách **Cách thanh toán** **mặc định là Chuyển khoản VietQR**. QA phải đổi sang **Tiền mặt** trước khi bấm **Tạo đơn**.
- Lệnh gửi máy chủ có đúng một `initialPayment` `{type: deposit, method: cash, amountVnd: 500000}` (OTM-00372) và `600.000` (OTM-00373).

**Nhận phòng** (OTM-00373, căn 103, đến hôm nay 30/10 → 01/11, đặt trên Desk 12:20:01 với cọc 600.000 tiền mặt; `shots/ci1-ci.png`, `ci2-*.png`, `ci3-*.png`, `ci4-transfer-short.png`):
- **Nhận phòng** → dòng điều kiện **Đã thu đủ hoặc OTA đã trả/đảm bảo** "Còn phải thu 1.356.000 đ – thu ở bước 4, trước khi giao mã cửa." → nút **Thu tiền (VietQR / tiền mặt)** mở khối **THU TIỀN TRƯỚC KHI GIAO MÃ**.
- Khối có **Cần thu để nhận phòng 1.356.000 đ** và **CÁCH THANH TOÁN** là 4 nút chọn một (`aria-pressed`, đúng một nút bật): **Chuyển khoản VietQR** (bật sẵn) · **Tiền mặt** · **Chuyển khoản** · **Thẻ (máy POS tại quầy)**.
  - **Tiền mặt**: một ô **Tiền khách đưa \***.
  - **Chuyển khoản**: một ô **Số tiền đã nhận \*** + **Mã giao dịch / ghi chú**, nhãn **Chờ đối soát**.
  - **Thẻ (máy POS tại quầy)**: một ô **Số tiền đã nhận \*** + **Mã chuẩn chi trên phiếu POS \***.
  - Đổi nút thì ô của cách cũ mất. Câu chân khối: "Khoản thu 1.356.000 đ được ghi cùng lúc với nhận phòng – nhận phòng không thành thì không ghi tiền."
- Không có nút thêm cách thứ hai. Đọc mã `CheckInPayment.tsx` `inlinePayment` (dòng 50–70, rc.6): chuyển khoản/POS phải **bằng đúng** số cần thu (thiếu hoặc thừa đều khóa nút); tiền mặt phải **≥** số cần thu (thừa thì tính tiền thối). Vậy ở bước nhận phòng cũng **không thu một phần** rồi đổi cách.
- **Folio & điều chỉnh** của đơn đã xác nhận chỉ có **Điều chỉnh**, **Mở form miễn phí / giảm giá**. Không có nút thu tiền riêng trước khi nhận phòng.
- QA **không** bấm **Nhận phòng**, **không** bấm **Tạo VietQR**. Không có lệnh ghi nào trong lúc xem (mạng: 0 lệnh POST/PUT ở `ci1`–`ci4`).
- Thu nhiều lần, mỗi lần một cách, chỉ có ở **trả phòng** (`PaymentPanel` chỉ dùng ở `CheckOutPage.tsx`; đọc mã, chưa thử trên Desk lượt này).

#### 20.8.4 Đối chiếu với sổ tay 1.4 – việc cho PO

**A. Chữ trên Desk khớp sổ tay (không phải sửa):** **Quản trị → Nhật ký tiền** · tab **Hoàn tiền** · **Nhập nơi nhận hoàn** · **Cách hoàn**: **Tiền mặt**, **Chuyển khoản**, **Cùng cách khách đã trả** · **Chờ duyệt** · **Hủy đơn** · **Lý do hủy** · **Khách đổi ý** · **Giữ lại đơn** · **Số tiền đã nhận** · **Cách thanh toán** · **Cọc cần thu** · **Tạo đơn** · **Tiền khách đưa** · **Mã chuẩn chi trên phiếu POS** · **Mã giao dịch / ghi chú**.

**B. Đề nghị bổ sung (PO quyết chữ):**

| # | Chỗ | Thiếu / sai | Đề nghị |
|---|---|---|---|
| B1 | Sổ tay 2.8 **Hủy** bước 1 và 4; 2.4 dòng "Không đi nữa"; 1.12 bước 1 | Không ghi nút cuối. Hộp có **Tiền mặt** chọn sẵn | Viết đủ: "… → **Nhập nơi nhận hoàn** → chọn **Cách hoàn** (Desk chọn sẵn **Tiền mặt**; khách nhận lại theo cách đã trả thì bấm **Cùng cách khách đã trả**) → **Lưu**". Dòng đơn ghi "Cách hoàn: …" là xong. Riêng 2.4 dòng "Không đi nữa" dặn **Cùng cách khách đã trả**: nhắc đổi khỏi mặc định |
| B2 | Sổ tay 0.5 (danh sách việc chỉ làm được trên máy đã cấp quyền) | Chỉ ghi giấy tờ, ảnh giấy tờ, **Nhận phòng**. **Nhập nơi nhận hoàn** cũng cần máy đã cấp quyền (dòng 7), mà Desk vẫn hiện nút trên máy chưa cấp | Thêm "**Nhập nơi nhận hoàn**" vào gạch đầu dòng 1 của 0.5. Ở 2.8 bước 1 và 4 thêm "(trên máy quầy đã cấp quyền)". Tới khi có bản sửa BUG-R3-048: "Gặp câu 'Máy này chưa được cấp quyền xem giấy tờ và mã cửa' khi lưu nơi nhận hoàn: chuyển sang máy quầy" |
| B3 | Sổ tay 2.13 gạch đầu dòng "Thu nhiều lần, nhiều cách được: ghi phần đã nhận, chọn cách khác cho phần còn lại" | Sai ở **đặt đơn** và **nhận phòng** (20.8.3): mỗi lần thu một cách; ở nhận phòng phải thu đúng đủ số cần thu bằng một cách | Giới hạn câu: "Ở **trả phòng**: thu nhiều lần, mỗi lần một cách. Khi **đặt đơn** và khi **nhận phòng**: Desk nhận **một** cách cho mỗi lần thu, và ở nhận phòng thu **đủ** **Cần thu để nhận phòng** bằng cách đó. Khách muốn trả hai cách lúc nhận phòng: chưa làm được ở v1.0, mời khách trả một cách (thường tiền mặt hoặc thẻ)." DOM duyệt câu mời khách |
| B4 | Sổ tay 2.5 bước 10; 2.4 dòng "Khách đó tới quầy" (b) | Không nói **Cách thanh toán** mặc định là **Chuyển khoản VietQR** | Thêm "Desk chọn sẵn **Chuyển khoản VietQR** – đổi đúng cách khách đã trả trước khi bấm **Tạo đơn**." (Cùng kiểu với khối nhận phòng: VietQR bật sẵn, sổ tay 2.10 bước 6 đã dẫn sang 2.13) |

- Giả định 10.6 dòng 2 (ca "lỡ chuyển nốt sau hạn" ghi gộp một khoản chuyển khoản ở bước (b)) **khớp** Desk. QA không thử ghi gộp với số lẻ (không cần: ô **Số tiền đã nhận** nhận số bất kỳ ≥ cọc cần thu).

#### 20.8.5 Dữ liệu staging – trước / sau

| | Trước (12:16) | Sau (12:24) |
|---|---|---|
| Đơn `hold` | 0 | 0 |
| Rack 30/10 → 26/11 (2 lượt 14 ngày), 10 căn | Không bar nào | Không bar nào; trạng thái buồng như lúc đầu (101, 102, 103, 202, 301, 401, 402 `VC`; 203 `VD`; 201, 302 `OD`) |
| Căn 202 17–19/11, căn 103 30/10–01/11 | Trống | Trống |

Bản ghi thử còn lại (chỉ là bản ghi, không giữ căn, không còn tiền dư):
- **OTM-00372** `cancelled` (`guest_changed_mind`, FD, trên Desk).
  - Yêu cầu hoàn 500.000: nơi nhận tiền mặt (FD, Desk) → **OWN duyệt** 12:22:34 (mật khẩu) → **OWN chi** tiền mặt 12:22:46, PT-000477 −500.000, ảnh biên nhận thử (`refund_proof`). `approved`, `refundedVnd` 500.000.
  - Folio `open`: PT-000475 cọc 500.000, PT-000477 hoàn −500.000. Đã thu 500.000, đã hoàn 500.000, **còn thu 0, tiền dư 0**, `pendingApprovals` 0. (`depositHeldVnd` vẫn 500.000 – cùng cách hiển thị như OTM-00369 ở 20.6, không phải số dư.)
- **OTM-00373** `cancelled` (`guest_changed_mind`, FD, ghi chú "QA 20.8 test data cleanup", 12:23:36).
  - MGR đảo PT-000476 (cọc 600.000) → PT-000478, lý do "test record cleanup – not real money" (12:23:09), rồi mới hủy: giữ lại 0, hoàn 0, không sinh yêu cầu hoàn.
  - Folio: tổng 0, đã thu 0, còn thu 0, tiền dư 0. Không có giấy tờ, không nhận phòng.
- Khách giả KH-0447 dùng lại, không tạo khách mới. 1 ảnh biên nhận thử.
- Đối chiếu tiền: ghi 1.100.000 tiền mặt thử; hoàn 500.000, đảo 600.000. Mọi folio dư 0.
- Chưa kiểm lượt này: hộp thư thông báo `qa.fd`/`qa.owner` (thông báo `refund_ready` nếu có), "Cần chú ý" của MGR.

## 21. US-155 đầu-cuối – từ form trên landing tới Desk và thông báo (30/10, 14:18–15:08)

- Người chạy: QA | Round 3 – bước **Kiểm thử** | ORC giao 30/10 chiều: chủ đầu tư muốn xem "flow đặt trên landing page, nó hiện về desk ntn, và noti ntn", chuẩn bị bật form trên ottimo.vn. ORC bổ sung câu hỏi của chủ đầu tư: "lỡ nhân viên đang không log in vào web thì sao".
- Không VietQR, không tiền, không SQL tay trên staging/production, không đụng production, không in khóa TOTP, không commit. Dữ liệu đều giả: tên "QA Test Anna", "QA Thu Thang"; SĐT `+1 202 555 0123` (dải số giả 555-01xx); email `qa.thang@example.com`.

### 21.0 Môi trường – staging chưa nhận được form, nên luồng đầy đủ chạy trên stack thử dùng đúng image staging

| Đích | Thấy gì | Hệ quả |
|---|---|---|
| api staging `v1.0.0` (`sha-8b3aec89486f`) | `LANDING_BASE_URL` của container api và worker **rỗng** (đọc tên biến bằng `docker inspect`, không đọc bí mật). Khóa ký form có. `EMAIL_PROVIDER=mock` | Mọi lệnh công khai `/v1/public/properties/dlt/form-token` và `/booking-requests` trả **404**, kể cả khi bật công tắc (`public-site.controller.ts`: không có landing origin → `NOT_FOUND`). Staging **không** nhận được yêu cầu từ form |
| Công tắc staging | `public_booking_requests_enabled = false` từ 22/10, chưa có lịch sử | QA **không bật**: bật cũng không nhận (dòng trên); bật rồi tắt thì không bật lại được trong ngày (thiết kế BUG-R3-008) |
| Landing staging | Không còn từ 24/10 (OPS `v1-production.md` 13) | Đúng ghi chú của `outputs/FE/us155-enable-readiness.md` mục 3 và bước G: "staging" của US-155 = stack thử |

Vì vậy QA làm hai phần:

1. **Staging thật** (chỉ đọc, không ghi gì):
   - Landing **bản có form** (image dựng từ HEAD, `LANDING_BOOKING_FORM=true`, slug `dlt`) chạy trên máy QA. Proxy nhỏ chỉ chuyển đúng 2 đường công khai sang `desk.staging.ottimo.vn`, giống `Caddyfile.landing`. Dùng cho ca **công tắc tắt**: khách thấy gì.
   - Desk staging, S35 **Yêu cầu từ website**, với `qa.fd` (máy quầy đã cấp quyền `qa-desk-01`) và `qa.owner`.
2. **Stack thử `ottimo-qa155e`** (dùng một lần, máy QA) cho luồng gửi → Desk → thông báo:
   - api/worker/migrate/seed = **đúng image staging** `ghcr.io/anhvh93-tech/ottimo-api:sha-8b3aec89486f-test` (bản `-test` của cùng commit, có `/__test__`); web = `ottimo-web:sha-8b3aec89486f`.
   - Landing = image dựng từ HEAD với `infra/docker/Dockerfile.landing`, `LANDING_BOOKING_FORM=true`, `LANDING_PROPERTY_SLUG=dlt`; mount nguyên `infra/caddy/Caddyfile.landing` (`LANDING_PUBLIC_API=on`) qua overlay `tests/e2e/support/us155-stack/compose.us155.yml`. `product/apps/landing-web`, `services`, `apps/admin-web`, `infra` ở HEAD **không khác** `8b3aec8` (`git diff --stat` rỗng).
   - DB mới, migrate, seed DS-E, đồng hồ thật. `LANDING_BASE_URL=https://landing.localhost:58150`, khóa ký form ngẫu nhiên.
   - Khác staging: `MFA_ENFORCED=false`; chưa cài tài khoản nhận chuyển khoản nên không có VietQR (không có gì phải che).
   - Bước dữ liệu: đăng `privacy_notice_version` `2026-10-24` (vi, en) bằng psql **trên stack thử** – giống bước phát hành landing; không có API cho việc này (OPS đang làm `publish-privacy-notice.sh`). `qa.owner` bật công tắc qua API: 200, `reason` bắt buộc (thiếu → 422 `reason REQUIRED`).
   - Helper và kết quả thô: scratchpad phiên `qa-r6/wr/` (ngoài repo): `lapi.mjs`, `land.mjs`, `watch.mjs`, `wr-ui.mjs`, `pwa.mjs`, `desk.mjs`, `stgproxy.mjs`, `*.json`, `shots/`.

### 21.1 Kết luận

**ĐẠT** luồng US-155 đầu-cuối trên image `v1.0.0`: khách gửi → Desk hiện ngay → nhân viên nhận xử lý → báo giá → giữ chỗ → yêu cầu "Đã thành đơn", nguồn Website. 5 lỗi mới đều **P3**, không P0/P1/P2.

Với câu hỏi "lỡ nhân viên không đăng nhập web thì sao":
- **Hiện tại (v1.0.0) không có kênh nào báo ra ngoài app.** Khi không ai mở Desk:
  - không đẩy thông báo về điện thoại (`staff.push` nằm trong outbox, không có bộ phát – như BUG-R3-041);
  - không email, không Zalo, không Google Chat;
  - chủ đầu tư không nhận gì, kể cả khi yêu cầu quá hạn.
- Yêu cầu **không mất**. Khi có người mở Desk, menu **Yêu cầu từ website** có số, **Cần chú ý** có dòng "chưa ai nhận". Quá hạn 30 phút mà chưa ai nhận thì máy chủ ghi thêm thông báo cho trưởng lễ tân + quản lý. Thông báo này chỉ hiện trong **app nhân viên**, mà tài khoản có 2 bước (chủ đầu tư, quản lý, tài khoản 6 vai của người trực) không đăng nhập được app này.
- Khách **không** nhận email/tin xác nhận nào. Đây là thiết kế, AC7. Khách chỉ có màn cảm ơn với mã yêu cầu, giờ hứa trả lời và số gọi nếu quá giờ hứa.
- Nghĩa là trước v1.0.1 (Google Chat, ARC `gchat-booking-request-notify.md`), cách tạm INV đã chọn 30/10 – **Desk luôn mở trên máy quầy và điện thoại người trực 07:00–22:00** – là cách **duy nhất** để biết có yêu cầu mới. Khi Desk đang mở, menu có số sau ~1,4 giây, không cần tải lại. Đề nghị ORC trình INV thêm 2 điểm, kèm phương án:
  - (1) Google Chat v1.0.1 nên báo cả tin "chưa ai nhận" quá hạn tới chủ đầu tư; hiện `website_request_overdue` chỉ tới FDL + MGR.
  - (2) Ngoài giờ trực (22:00–07:00) khách vẫn gửi được. Câu hứa "trước 09:00 sáng hôm sau" vẫn đúng, nhưng máy chủ chỉ báo quá hạn lúc ~07:30.
  - Lưu ý cho cách tạm: Desk **không có âm báo, không có thông báo trình duyệt**; số trên menu chỉ đổi khi tab Desk đang mở. Trên điện thoại, tab trình duyệt chạy nền hoặc màn hình tắt thì không có gì kêu – người trực phải tự mở Desk xem (đọc mã; không có mã `Notification`/âm thanh trong `apps/admin-web`).
- **Staging chưa nhận được form** (21.0): `LANDING_BASE_URL` api staging rỗng. Không phải lỗi sản phẩm. OPS đặt cùng lúc với production (bước H của `us155-enable-readiness.md`) nếu muốn thử trên staging.

### 21.2 Phía khách – form và màn cảm ơn (stack thử, landing có form)

| # | Giờ | Bước | Thấy gì | Ảnh | Đạt? |
|---|---|---|---|---|---|
| 1 | 14:30:04 | (a) EN, **By the night** 09/11 → 12/11, 2 người lớn, **Reply on: Zalo**, SĐT giả, lời nhắn "Late arrival around 22:00…", tích đồng ý – điện thoại 390×844 | Form đủ ô theo AC1: kỳ ở, ngày, số người, hạng phòng (không bắt buộc), tên, kênh (Zalo đứng đầu), số, lời nhắn, ô đồng ý không tích sẵn, link **Privacy notice**. Không hỏi quốc tịch/giấy tờ/thẻ. Chạm form lần đầu → 1 lệnh `GET form-token` 200 | `01`, `02`; máy tính: `04`, `05` | Đạt |
| 2 | 14:30:08 | (a) **Send booking request** | 1 lệnh `POST booking-requests` 202 (`Idempotency-Key`), mã **QRH7ATJ0**. Màn **Request sent**: "Thank you, QA Test Anna. This is a request, not yet a booking." · mã `QRH7 ATJ0` (JetBrains Mono) · "For the fastest reply, open Zalo and send us this number." · "We reply within 1 hour (07:00–22:00, Da Lat time)." · "If you have not heard from us by 15:30, call 08.4444.0909 or message us on Zalo with this number." · nút **Open Zalo**, **Send another request**. Không giá, không giữ phòng, không thu tiền (AC7) | `03` | Đạt |
| 3 | 14:31:12 | (b) VI, **Theo tháng** từ 20/11, **3 tháng**, 1 người lớn, **Trả lời qua: Email**, email giả, lời nhắn – máy tính 1440×900 | Form tiếng Việt, ô **Thời gian ở** thay ô ngày đi. 202, mã **KNJ6F2Z1**. Màn **Đã gửi yêu cầu**: "Cảm ơn QA Thu Thang. Đây là yêu cầu, chưa phải đặt phòng." · mã · "Chúng tôi sẽ trả lời qua email." · "Chúng tôi trả lời trong 1 giờ (07:00–22:00, giờ Đà Lạt)." · "Nếu đến 15:31 chúng tôi chưa liên hệ, vui lòng gọi 08.4444.0909 hoặc nhắn Zalo kèm mã này." | `07`, `08`, `09`; điện thoại: `06` | Đạt |
| 4 | – | Khách có nhận xác nhận qua email/Zalo không? | **Không.** Không có dòng outbox nào gửi khách (chỉ `staff.push`, 21.4). Đúng thiết kế: AC7 "hệ thống **không** tự gửi email/Zalo tới liên hệ khách nhập" (ADR-014 4.3, chống dùng form để spam người khác). Khách chỉ có màn cảm ơn với mã yêu cầu | – | Đúng thiết kế |

Giọng chữ khách: tiếng Anh dẫn, tiếng Việt đủ bản, không emoji, không "!", màu và chữ đúng bảng thương hiệu (nút gửi Earth Brown, nền Ivory/Cream, Lora tiêu đề, mã JetBrains Mono).

### 21.3 Phía Desk – lễ tân `qa.fd`, máy quầy đã cấp quyền (Chromium 1440×900)

| # | Giờ | Bước | Thấy gì | Ảnh | Đạt? |
|---|---|---|---|---|---|
| 1 | 14:30:09 | Desk mở sẵn ở **Hôm nay** trước khi khách gửi (a), **không tải lại** | Menu **Yêu cầu từ website** hiện số **1** sau **1,4 giây** (SSE `website_request.changed` → Desk tự gọi lại danh sách). Khối **CẦN CHÚ Ý 1**: "Yêu cầu đặt phòng từ website QRH7ATJ0 chưa ai nhận · Trả lời trước 14:45 · **Mở**" hiện sau **20,8 giây** (khối này chờ nhịp tải lại, không nghe SSE của yêu cầu website) | `10`, `11` | Đạt |
| 2 | 14:32 | **Yêu cầu từ website** – danh sách | Cột: Mã yêu cầu · Gửi lúc · Ngày ở · Số khách · Hạng phòng · Trả lời qua · Nguồn (**Website**) · Hạn trả lời · Cần xem · Người xử lý · Trạng thái. (b) có dòng "Ở dài ngày – báo giá dài hạn". Lọc theo trạng thái: Mới · Đang xử lý · Đã thành đơn · Đã đóng · Spam | `20` | Đạt |
| 3 | 14:32 | Mở (a) | Ngăn chi tiết: **LƯU TRÚ KHÁCH HỎI** (ngày, số khách, hạng, **Ngôn ngữ khách dùng: Tiếng Anh**, gửi lúc, người xử lý) · **LIÊN HỆ KHÁCH** (tên, SĐT, "Khách muốn được trả lời qua Zalo", **Sao chép SĐT**, **Gọi**, nhắc dùng Zalo OA của cơ sở) · **LỜI NHẮN CỦA KHÁCH** · **Chi tiết nguồn**. Nút: **Đánh dấu spam**, **Đóng – không thành đơn**, **Báo giá**, **Tạo đơn**, **Nhận xử lý**. SĐT hiện "+120 255 501 23" → **BUG-R3-049** | `21` | Đạt, kèm BUG-R3-049 (P3) |
| 4 | 14:33 | **Nhận xử lý** | Toast "Đã nhận yêu cầu QRH7ATJ0"; trạng thái **Đang xử lý**, "Bạn · nhận lúc 14:33"; số menu còn 1 (chỉ đếm yêu cầu chưa ai nhận). Nút **Nhận xử lý** đổi thành **Trả lại hàng chờ**. Không có nút riêng "đã liên hệ": **Nhận xử lý** chính là dấu "đã có người lo", dừng nhắc quá hạn | `22` | Đạt |
| 5 | 14:34 | **Báo giá** | Hộp **Báo giá cho yêu cầu QRH7ATJ0** điền sẵn ngày, số đêm, số khách; "Chưa có hồ sơ cùng liên hệ – tìm hoặc tạo hồ sơ mới bên dưới" (không tự gộp hồ sơ – BR-951). Giá 3 đêm × 667.000 = 2.001.000, cọc 30% 600.000 | `23` | Đạt |
| 6 | 14:35 | **Khách đứng tên** → **Tạo nhanh khách** → **Lưu hồ sơ** | Hộp **Hồ sơ khách mới** chỉ điền sẵn tên; SĐT/kênh trống, ngôn ngữ Tiếng Việt, quốc tịch Việt Nam → **BUG-R3-050**. QA gõ SĐT giả rồi lưu: KH-0001 | – | Đạt, kèm BUG-R3-050 (P3) |
| 7 | 14:35 | **Lưu báo giá** | BG-00001, bước gửi khách chọn đúng **English**, mẫu tin tiếng Anh, nút **Sao chép gửi Zalo**, **Khách đồng ý – Giữ chỗ**. Yêu cầu hiện "Đã có báo giá"; máy chủ gắn `quoteId` | `24a` | Đạt |
| 8 | 14:36 | Mở lại BG-00001 từ **Báo giá & giữ chỗ** → tab **Báo giá** | **Ngôn ngữ gửi khách: Tiếng Việt**, mẫu tin tiếng Việt (lấy từ hồ sơ ở bước 6) → BUG-R3-050 | `24` | Không đạt (P3) |
| 9 | 14:36:55 | **Khách đồng ý – Giữ chỗ** → **12 h** → **Tạo giữ chỗ** | 201 **OTM-00001** `hold` căn 101, hạn 02:36 31/10; "Gửi mã QR cho khách. Bạn sẽ được nhắc 2 giờ trước khi hết hạn." VietQR 409 vì stack thử chưa cài tài khoản nhận ("Chưa cài tài khoản nhận chuyển khoản…") – không có QR, không tiền | `25`, `26` | Đạt |
| 10 | 14:37 | Yêu cầu (a) sau khi giữ chỗ | Máy chủ: `converted`, `reservationCode OTM-00001`, tên/SĐT/lời nhắn đã xóa (C2 = NULL). Desk: lọc **Đã thành đơn** → "Đã thành đơn OTM-00001 · **Mở đơn**", không còn nút thao tác. Đơn: kênh `direct`, nguồn **`website`** (AC2, WR6) | `27` | Đạt |
| 11 | 14:38 | Danh sách sau ca gửi trùng (21.5 dòng 3) | (b) KNJ6F2Z1 và bản gửi lại WR45Q6DQ đều gắn "Có thể trùng yêu cầu khác"; ngăn chi tiết "Có thể trùng với: KNJ6F2Z1" | `28` | Đạt |
| 12 | 15:03 | Mở (b) KNJ6F2Z1 (ở dài) → **Tạo đơn** | Mở hộp **Đặt phòng cho yêu cầu KNJ6F2Z1 – Hợp đồng dài hạn** (HĐ ngoài hệ thống): điền sẵn ngày vào, 3 tháng · 92 đêm, 1 người lớn; "Đơn tạo ra có nguồn Website; yêu cầu chuyển sang Đã thành đơn và thông tin liên hệ trên yêu cầu được xóa". QA **không** tạo, bấm đóng | `44` | Đạt |
| 13 | 15:05 | **Xóa theo yêu cầu người gửi** (WR45Q6DQ, `qa.fdl`) | Hộp "Xóa dữ liệu của yêu cầu WR45Q6DQ?", nói rõ xóa ngay, không khôi phục, không mở lại; nút **Xóa ngay** khóa tới khi chọn cách xác minh và nhập liên hệ. Nhập đúng email → 200, "Đã xóa dữ liệu…", lý do "Đã xóa theo yêu cầu của người gửi". Mục liên hệ ghi "đã xóa **theo hạn lưu**" → **BUG-R3-055**. Lễ tân `qa.fd` không có nút này (đúng quyền) | `45`, `46` | Đạt, kèm BUG-R3-055 (P3) |
| 14 | 15:06 | **Đóng – không thành đơn** (KNJ6F2Z1) | Hộp chọn lý do (Hết phòng · Khách chưa chọn vì giá · Khách không đặt nữa · Không liên lạc được · Trùng yêu cầu / đã có đơn · Không phù hợp quy định · Lý do khác) + ghi chú nội bộ; nút khóa tới khi chọn lý do. **Khách không đặt nữa** → "Đã đóng yêu cầu KNJ6F2Z1." | `47`, `48` | Đạt |
| 15 | 15:06 | Dọn: **Hủy giữ chỗ** OTM-00001 trên Desk, lý do **Khách đổi ý** | Hộp "Hủy giữ chỗ căn 101? … mở bán lại từ 09/11 đến 12/11… Không thu phí (giữ chỗ chưa cọc)" – đúng vì chưa cọc. → `cancelled` | `49` | Đạt |

### 21.4 Thông báo – ai được báo, bằng gì, sau bao lâu

**Đọc mã `v1.0.0`:**
- Khi lưu yêu cầu mới (`public-booking.service.ts` `store()`), trong cùng giao dịch:
  - `events.notify(kind 'website_request_new', roles FDL + FD + SAL)` → mỗi người có vai đó được **1 dòng hộp thư `staff_notification`** (chỉ mã yêu cầu, không tên/SĐT/email) + sự kiện SSE `notification.created` riêng người đó + **1 dòng outbox `staff.push`**.
  - `events.publish('website_request.changed')` → SSE cho FD+ và SAL: Desk đang mở tự cập nhật số trên menu.
  - **Không** báo OWN, MGR khi có yêu cầu mới. OWN/MGR chỉ thấy nếu đang mở Desk (số trên menu, "Cần chú ý").
- Job `web_request.sla` (mỗi nhịp worker ~60 giây): yêu cầu vẫn **Mới** (chưa ai **Nhận xử lý**) sau `reply_by` + (`web_request_escalate_minutes` − `web_request_response_minutes`) = hạn trả lời + 15 phút → **một** thông báo `website_request_overdue` cho **FDL + MGR** (hộp thư + outbox `staff.push`). Trong giờ trực: hạn trả lời = lúc gửi + 15 phút → báo quá hạn ở phút ~30. Ngoài giờ trực (22:00–07:00): hạn trả lời = 07:00 + 15 phút, báo quá hạn ~07:30 sáng hôm sau.
- Desk web **không có chuông/hộp thư**. Desk không gọi `GET /v1/me/notifications`. Tín hiệu trên Desk chỉ có: số trên menu **Yêu cầu từ website** (yêu cầu chưa ai nhận, cập nhật qua SSE) và dòng **Cần chú ý** `website_request_new` (tính lúc đọc; mức `warning` khi quá hạn trả lời).
- Hộp thư `staff_notification` chỉ hiện ở **app nhân viên** (PWA `staff.…`): chuông + trang **Thông báo**, chữ chung "Thông báo mới – xem chi tiết trên OTTIMO Desk" + mã yêu cầu. App nhân viên **không đăng nhập được với tài khoản có 2 bước** (`LoginPage.tsx`: `MFA_REQUIRED` → báo lỗi). Ở OTTIMO, tài khoản người trực giữ 6 vai và có 2 bước (DOM `DOM-on-BA-department-guides.md`), nên người trực thật **không** xem được hộp thư này.
- `staff.push` (đẩy về điện thoại khi app đóng): **không có bộ phát** – cùng gốc BUG-R3-041 (không mã nào đọc topic này; không có mã Web Push dù máy chủ có khóa VAPID). Trên stack thử: 3 dòng `staff.push` ở trạng thái `pending`, `attempts 0` suốt lượt kiểm.
- Email nhân viên: `staff.email` chỉ dùng cho 2 bước và đổi tham số (`mfa-store.ts`, `platform.controller.ts`); **không** có email cho yêu cầu website. (Staging còn `EMAIL_PROVIDER=mock`; BUG-R3-032: người dùng không có email.)
- Zalo, Google Chat: **chưa có**. Google Chat đã có thiết kế ARC (`outputs/ARC/gchat-booking-request-notify.md`, topic `staff.chat`, nhắc lại qua `web_request.sla`), đích v1.0.1.
- Khách: không nhận gì ngoài màn cảm ơn (21.2 dòng 4).

**Đo trên stack thử:**

| # | Giờ | Ca | Thấy gì | Thời gian | Ảnh | Đạt? |
|---|---|---|---|---|---|---|
| 1 | 14:30:08 | Có người đang mở: Desk `qa.fd` ở **Hôm nay** + app nhân viên `qa.fdl` (điện thoại), khách gửi (a) | Desk: số **1** trên menu không cần tải lại. App nhân viên: chuông có số **1**, dòng "Có thông báo mới". Desk **Cần chú ý** thêm dòng QRH7ATJ0 | Menu Desk **1,4 giây**; chuông app **1,4 giây**; **Cần chú ý** 20,8 giây | `10`, `11`, `12a`, `12b` | Đạt |
| 2 | 14:31:12 | **Không ai đăng nhập**: QA đăng xuất cả 3 phiên (204), DB còn **0** phiên hiệu lực; khách gửi (b) | Máy chủ ghi 5 dòng hộp thư `website_request_new` (qa.fd, qa.fd2, qa.fdl, qa.fdsal, qa.sal) + 1 dòng `staff.push` `pending`. **Không có gì đi ra ngoài**: không đẩy về điện thoại, không email, không Zalo, không Chat. Chủ đầu tư, quản lý: không có dòng hộp thư nào | Không ai biết cho tới khi mở app | – | Đúng mã; là **khoảng trống** (21.1) |
| 3 | 14:32 | Đăng nhập lại sau ca 2 | Desk `qa.fd` → **Hôm nay**: menu **2** ("2 yêu cầu mới chưa ai nhận"), **CẦN CHÚ Ý 1** "Yêu cầu đặt phòng từ website chưa ai nhận: 2 · Trả lời trước 14:45 · Mở". App nhân viên `qa.fdl`: **Thông báo** 2 dòng "Thông báo mới – xem chi tiết trên OTTIMO Desk" KNJ6F2Z1 14:31, QRH7ATJ0 14:30. Chủ đầu tư: hộp thư chỉ có "đổi công tắc form" | Ngay khi mở | `13`, `14` | Đạt |
| 4 | 15:02:01 | **Quá hạn, vẫn không ai đăng nhập**: KNJ6F2Z1 (gửi 14:31, hạn trả lời 14:46) để nguyên **Mới**, 0 phiên hiệu lực | Job `web_request.sla` đặt `overdue_notified_at` 15:02:01 (hạn 14:46:12 + 15 phút = 15:01:12, trễ < 1 nhịp worker) → 2 dòng hộp thư `website_request_overdue` (**qa.fdl, qa.mgr**) + 1 dòng `staff.push` `pending`. Chủ đầu tư: **không** có. Không có gì đi ra ngoài | ~31 phút sau khi khách gửi | – | Đúng mã |
| 5 | 15:03 | Đăng nhập lại sau ca 4 | Desk `qa.fd` **Hôm nay** và `qa.owner` **Tổng quan**: menu **2**, **Cần chú ý** "Yêu cầu đặt phòng từ website chưa ai nhận: 2 · **Trả lời trước 14:46**" – chỉ viền đổi màu, không có chữ "quá hạn" → **BUG-R3-054**. Danh sách S35: "Quá hạn 17 phút", "Quá hạn 9 phút". App nhân viên `qa.fdl`: dòng mới 15:02 "Thông báo mới – xem chi tiết trên OTTIMO Desk · KNJ6F2Z1" – **cùng chữ** với thông báo yêu cầu mới, không nói là quá hạn. Hộp thư `qa.mgr` có `website_request_overdue` (xem qua API; quản lý thật có 2 bước nên không mở được app nhân viên) | Ngay khi mở | `40`, `41`, `42`, `43` | Đạt, kèm BUG-R3-054 (P3) |
| 6 | 15:07 | Chủ đầu tư **tắt công tắc cùng ngày** (kill switch) | 200, `value false`. Khách chạm form ngay sau đó: token 404, dòng "Online requests are paused right now…", không `POST` | Tức thì | `36` | Đạt |

### 21.5 Ca lỗi chính

| # | Giờ | Ca | Thấy gì | Ảnh | Đạt? |
|---|---|---|---|---|---|
| 1 | 14:27:38–14:27:57 | **Công tắc tắt – staging thật** (landing có form gọi api staging qua proxy 2 đường): EN máy tính, VI điện thoại | Chạm form → `GET form-token` **404** → ngay dưới form: "Online requests are paused right now. Please message us on **Zalo** or call **08.4444.0909**. We will reply as soon as we can." (VI: "Yêu cầu trực tuyến đang tạm dừng. Vui lòng nhắn chúng tôi qua Zalo hoặc gọi 08.4444.0909…"). Bấm gửi: hỏi lại token (404), **không** `POST`, không màn cảm ơn giả (AC5, AC11). Dữ liệu khách nhập giữ nguyên | `30`, `31` | Đạt |
| 2 | 14:27:04 | Công tắc tắt – stack thử (trước khi OWN bật) | Như dòng 1 | `31b` | Đạt |
| 3 | 14:38:24 | **Gửi trùng**: gửi lại (b) cùng email, **bấm đúp** nút gửi (điện thoại) | Bấm đúp → đúng **1** `POST` (202). Khách nhận mã mới WR45Q6DQ như bình thường (không cho biết liên hệ đã từng gửi – AC5). Desk: cả hai yêu cầu gắn "Có thể trùng yêu cầu khác" và trỏ nhau (21.3 dòng 11). Quá 3 lần/ngày cùng liên hệ thì máy chủ trả 202 giống hệt nhưng không tạo yêu cầu mới, chỉ tăng đếm trên yêu cầu cũ (đọc mã `public-booking.service.ts` bước 10; không thử để giữ hạn mức IP 5/giờ của stack) | `28` | Đạt |
| 4 | 14:38:38 | **Thiếu trường bắt buộc** (EN, máy tính): không ngày, không tên, không số, không tích đồng ý → gửi | Không gửi lên máy chủ (0 `POST`). Hộp "Please check 5 fields" liệt kê 5 link tới ô lỗi; dưới từng ô: "Choose your check-in date." · "Choose your check-out date." · "Tell us your name." · "Enter a Zalo number we can reach." · "Please tick the box so we can reply." (chữ, có biểu tượng, không chỉ màu – AC11) | `32` | Đạt |
| 5 | 14:38:47 | **Số giấy tờ trong lời nhắn** (VI): lời nhắn có số CCCD giả viết cách nhóm | Máy chủ 422 `note` `ID_NUMBER_DETECTED` (chỉ `field` + `code`, không lặp số). Form: "Vui lòng kiểm tra 1 mục – Không cần gửi số giấy tờ ở bước này. Vui lòng xóa số đó." Không lưu yêu cầu | `33` (số giả nằm ngoài khung ảnh) | Đạt |

### 21.6 Ảnh (`rounds/round-03/qa/us155-e2e/`, 43 tệp, dữ liệu giả)

- Khách: `01`–`09` (EN điện thoại/máy tính, VI điện thoại/máy tính, màn cảm ơn EN điện thoại, VI máy tính).
- Thông báo: `10`, `11` (Desk trước/sau 1,4 giây), `12a`, `12b` (app nhân viên), `13`, `14` (đăng nhập lại sau khi không ai trực), `40`–`43` (quá hạn).
- Desk: `20`–`28` (danh sách, chi tiết, nhận xử lý, báo giá, giữ chỗ, đã thành đơn, có thể trùng), `44`–`49` (tạo đơn dài hạn, xóa theo yêu cầu, đóng, hủy giữ chỗ).
- Lỗi: `30`, `31` (công tắc tắt – **staging thật**), `31b`, `36` (stack thử), `32`, `33`, `34`, `35` (Desk staging khi form tắt: chủ đầu tư, lễ tân).
- Kiểm che theo `product/docs/manual/screenshot-list.md`:
  - không có mã QR: VietQR không tạo được trên stack thử;
  - không có số tài khoản, giấy tờ, mã 2 bước;
  - số CCCD giả của ca `33` nằm ngoài khung ảnh;
  - tên, SĐT `+1 202 555 0123`, email `example.com` đều giả; số 08.4444.0909 là số công khai của OTTIMO.
- Lệch quy tắc 1 ("chỉ chụp trên staging"): ảnh `01`–`29` và `36`–`49` chụp trên stack thử chạy **đúng image staging `v1.0.0`**, vì staging không nhận form (21.0). Ảnh `41` có băng "nên bật xác thực 2 bước" do stack thử tắt `MFA_ENFORCED`. Không dùng các ảnh này cho sổ tay.

### 21.7 Dọn dữ liệu

| Nơi | Trước | Sau |
|---|---|---|
| Staging | Công tắc tắt; 0 yêu cầu website | **Không đổi gì.** Chỉ đọc + 6 lần `GET form-token` (404). Không bật công tắc. 2 phiên QA (`qa.fd`, `qa.owner`) đã đăng xuất (204) |
| Stack thử `ottimo-qa155e` | – | Lúc kết thúc: QRH7ATJ0 `converted` (C2 đã xóa), KNJ6F2Z1 `declined`, WR45Q6DQ `declined` (đã xóa theo yêu cầu); OTM-00001 `cancelled` (không cọc, không tiền); công tắc **tắt**. Sau đó `docker compose down -v`: xóa toàn bộ container, DB, volume. Xóa tệp `.env` của stack (khóa thử). Còn trên máy QA: image `ottimo-landing:qa155`, 2 image GHCR đã kéo |
| Production | – | Không đụng |

- Lưu ý: lệnh seed của stack thử ghi đè `product/tests/fixtures/seed/.out/ds-e.map.json` (gitignore, mã thiết bị thử). Stack khác đang chạy trên máy QA (`ottimo-esc031`, `ottimo-demo`) cần mã máy quầy thì chạy lại seed của stack đó.

### 21.8 Chưa kiểm / giới hạn

- Chưa chạy trên staging thật phần gửi → Desk (21.0). Lần kiểm trên production sau bước H/J của `us155-enable-readiness.md` (SEC xác nhận mốc, khói L) vẫn cần.
- Chưa thử ngoài giờ trực, ngày đến hôm nay (câu hứa "call now"), chạm trần ngày (503) và quá 3 lần/ngày cùng liên hệ. Lý do: không đổi giờ máy để giữ đồng hồ thật cho phép đo thông báo, và giới hạn 5 lần gửi/giờ/IP của stack. Phần này đã có ở TC-WR-* (`s1-us155-e2e.md`) và đọc mã.
- Không thử SAL (vai sale) và CTV. Đã có ở TC-WR-000/004.
- "Cần chú ý" chậm ~20 giây so với số trên menu, vì khối Hôm nay không nghe SSE `website_request.changed` (`useDashboard.ts`). Không ghi lỗi: số trên menu hiện ngay.

## 22. Bộ hướng dẫn theo bộ phận (staging `v1.0.0`, 30/10)

- Người chạy: QA | Round 3 – bước **Kiểm thử** | 30/10/2026 14:28–15:00 (+07). Giao việc ORC: câu Q2–Q4 của BA (`outputs/BA/department-guides.md` mục 4), app nhân viên với vai quản lý, chụp ảnh G + C1-15, C2-34 (`product/docs/manual/guides/screenshot-additions.md`). Hạn: trước buổi C3a tối 31/10.
- Đích: `desk.staging.ottimo.vn`, `staff.staging.ottimo.vn` – `v1.0.0` (`8b3aec8`). Desk Chromium 1440×900, điện thoại 390×844 DPR 2, `vi-VN`, giao diện Sáng.
- Cách làm: Playwright thao tác thật trên giao diện; API chỉ để tạo/khóa tài khoản dùng một lần, dựng dữ liệu mẫu và dọn. Mã, chữ từng màn, ảnh thô ở scratchpad phiên `qa-r6/g/` (ngoài repo). Mật khẩu, khóa TOTP, mã khôi phục chỉ nằm trong tệp 0600 ở scratchpad và **đã xóa** sau khi khóa tài khoản.
- Tài khoản dùng một lần (đều **đã khóa** 14:56): `qa.g.hk1` (chỉ Buồng phòng), `qa.g.mt1` (chỉ Bảo trì), `qa.g.six` (6 vai: Quản lý, Lễ tân trưởng, Lễ tân, Buồng phòng, Bảo trì, Sale nội bộ – như tài khoản người trực production), `qa.g.fd1` (Lễ tân, chỉ để thử khóa do sai mật khẩu). Tên hiển thị giả.
- Không VietQR (không bấm **Tạo VietQR**), không chuyển tiền, không SQL, không sửa tham số, không sửa hướng dẫn, không commit.

### 22.1 Kết luận

| Câu | Kết quả | Hệ quả cho hướng dẫn |
|---|---|---|
| **Q2** Buồng phòng mới, còn mật khẩu tạm | App nhân viên **cho đăng nhập** nhưng **không có màn đổi mật khẩu tạm**; mọi màn báo "Chưa tải được … Có thể do mạng yếu" (máy chủ 403 `PASSWORD_CHANGE_REQUIRED`) → **BUG-R3-052 (P2)**. Đổi mật khẩu tạm trên Desk (**Đặt mật khẩu của bạn → Lưu và vào ứng dụng**) rồi vào app: **được**, app mở **Việc** bình thường. Desk của vai chỉ có Buồng phòng: mở thẳng trang **Buồng phòng**, **không** báo "Bạn không có quyền mở trang này" | Giả định A1 của BA **đúng**: giữ bước A (Desk trước). Sửa bước A.5 của tệp 03 (22.6 dòng 1). Thêm dòng câu báo "mạng yếu" vào bảng 1.3 của 03, 04 |
| **Q3** Tên nút khung phiếu sửa trên Desk | Gần khớp, **thiếu một bước**: khung phiếu có **Nhận việc** (kèm **Hủy phiếu**); sau khi nhận có **Chờ vật tư** và **Sửa xong**. **Lưu – chờ vật tư** là nút **trong hộp** **Chờ vật tư – WO-…**, không nằm trên khung. Hộp **Sửa xong WO-…**: **Đã làm gì?**, **Ảnh sau khi sửa** (bắt buộc), câu "Ảnh sau sửa: chụp bằng app kỹ thuật hoặc chọn ảnh ở đây.", **Xác nhận sửa xong** → thêm **hộp xác nhận thứ hai** (mở khóa, "Cần dọn (khách đã đi)", "Dọn sau sửa chữa") với **Không, quay lại** / **Xác nhận sửa xong** | Sửa 04 mục 4.4 bước 3 và 5 (22.6 dòng 5) |
| **Q4** Desk của vai chỉ có Bảo trì | Desk mở thẳng trang **Bảo trì** (`/maintenance`). Menu chỉ có nhóm **VẬN HÀNH**: **Các căn** (sơ đồ trạng thái, không có đơn), **Buồng phòng**, **Phiếu sửa** – mục tên **Phiếu sửa**, không phải **Bảo trì** như menu của quản lý. Thấy và nhận phiếu (**Nhận việc**), xem tab **Khóa phòng**, có nút **Phiếu sửa mới**, **Khóa phòng có kế hoạch**, **Đổi ngày mở bán**. **Nhưng ô Căn trống** trong cả hai hộp (GET `rooms` 403) → **không tạo được phiếu, không khóa phòng được trên Desk** → **BUG-R3-053 (P2)**. Mở `/today`, `/reservations`, `/overview`: "Bạn không có quyền mở trang này" + **Về trang chủ của tôi** | Giả định A9 **sai ở phần khóa phòng**: sửa 04 mục 1.1, 1.3 (Desk), 5 và 01 mục 1.9 bảng vai (22.6 dòng 3, 4) |
| **App + vai quản lý** (tài khoản 6 vai) | **Bị chặn** đúng như BA giả định (A2). Đã bật 2 bước: app báo "Nhập mã trong ứng dụng xác thực để hoàn tất đăng nhập. Đăng nhập 2 bước sẽ có ở bản sau. Nhờ chủ đầu tư hỗ trợ đăng nhập." (401 `MFA_REQUIRED`, không có ô mã – BUG-R3-029 còn nguyên). Còn mật khẩu tạm, hoặc đã đổi mật khẩu mà chưa bật 2 bước: app vào được nhưng mọi màn báo "mạng yếu" (403 `MFA_ENROLLMENT_REQUIRED`, BUG-R3-052) | Giữ chữ 01 mục 1.8, 00 mục 2.1, đầu tệp 03, 04. Không đổi |
| **Ảnh** | **15/21** đã chụp và kiểm che, đã lưu `product/docs/manual/img/` (22.5). **Chưa có 6**: G2-05, G2-06 (cần giữ chỗ quá hạn – đã dựng ca, hạn 02:44 31/10, chụp sáng 31/10), G2-03 (ảnh chụp tờ in thật), G3-02 (hộp của trình duyệt trên điện thoại thật), C1-15, C2-34 (ca ESC-031 sau 18:00) | Không kịp thì bản dựng giữ mô tả chữ (theo `screenshot-additions.md`) |

- **Lỗi mới:** BUG-R3-052 (P2, MOB + UXD), BUG-R3-053 (P2, FE-A + BE-A). Không có P0/P1 mới. Chi tiết ở `bug-list.md`.
- QA không tạo ESC: hai lỗi P2 đều có cách tạm ngày D, ORC/PO xếp vào v1.0.1.

### 22.2 Q2 – tài khoản chỉ có vai Buồng phòng (`qa.g.hk1`, 14:28)

| # | Bước | Kết quả |
|---|---|---|
| 1 | Chủ đầu tư tạo tài khoản, vai **Buồng phòng**, mật khẩu tạm (API, xác nhận mật khẩu + mã 6 số) | 201 |
| 2 | App nhân viên (390×844), đăng nhập bằng **mật khẩu tạm** | `POST /v1/auth/login` 200. App vào **Việc của tôi**: "Chưa tải được việc hôm nay – Có thể do mạng yếu. Việc bạn đã bấm không bị mất. Bấm Thử lại; vẫn lỗi thì gọi lễ tân." + **Thử lại**, **Gọi lễ tân**. **Các căn**: "Chưa tải được trạng thái các căn" cùng câu. **Tôi**: tên, "Buồng phòng · OTTIMO Đà Lạt", **Ngôn ngữ giao diện**, **Thao tác trên máy**, **Đăng xuất**. Không có màn hay nút đổi mật khẩu. Lượt cùng bước với `qa.g.mt1` ghi được mạng: `work-orders`, `room-statuses`, `me/notifications`, `events` đều 403 `PASSWORD_CHANGE_REQUIRED` |
| 3 | Desk (1440×900), đăng nhập bằng mật khẩu tạm | Màn **Đặt mật khẩu của bạn**: "Bạn đang dùng mật khẩu tạm do chủ đầu tư cấp. Đặt mật khẩu riêng để tiếp tục." · **Mật khẩu hiện tại** · **Mật khẩu mới** (3 dòng quy tắc) · **Nhập lại mật khẩu mới** · **Lưu và vào ứng dụng** · **Đăng xuất**. Khớp tệp 03 bước A.1–4 |
| 4 | **Lưu và vào ứng dụng** | `POST /v1/me/password` 204. Desk mở `/housekeeping` – trang **Buồng phòng** ("Việc buồng phòng hôm nay", "Trạng thái buồng"), toast "Đã lưu". Menu: **VẬN HÀNH** – **Các căn**, **Buồng phòng**, **Phiếu sửa**; **QUẢN TRỊ** – **Minibar**. Chip "Máy chưa cấp quyền giấy tờ". **Không** có câu "Bạn không có quyền mở trang này". Ảnh **G3-01** |
| 5 | App nhân viên, đăng nhập bằng mật khẩu mới | Vào **Việc của tôi** bình thường: "Hôm nay 30/10 · 0/3 xong", nhóm **Làm trước**, **Khách đang ở**, thanh dưới **Việc · Các căn · Báo sự cố · Tôi** |

Kết luận Q2: bước A (đổi trên Desk) là **bắt buộc** cho buồng phòng, bảo trì mới và sau mỗi lần **Đặt lại mật khẩu**. Lặp lại với `qa.g.mt1` (chỉ Bảo trì): cùng kết quả, Desk mở `/maintenance` (trang **Bảo trì**), app mở **Phiếu sửa** sau khi đổi.

### 22.3 Q3 – khung phiếu sửa trên Desk (`qa.mgr`, WO-00004, 14:30–14:35)

Dựng ca: `qa.mgr` tạo **WO-00004** trên Desk – căn 301 (trống, `VC`), "Đèn đầu giường không sáng", **Điện / đèn**, **Trong ngày**, 1 ảnh thử, tích **Khóa căn – không bán đến khi sửa xong** (Khóa từ 30/10, Dự kiến xong 31/10) → **Tạo phiếu**. Desk ghi "Căn khóa đêm 30/10 – 31/10, mở bán lại từ 01/11".

| Chỗ | Chữ thật trên Desk |
|---|---|
| Menu (quản lý) | **VẬN HÀNH → Bảo trì** (`/maintenance`), tab **Phiếu sửa** / **Khóa phòng**, lọc **Đang mở (n)**, **Gấp (n)**, **Chờ vật tư (n)**, **Đã xong (n)** |
| Khung phiếu, trạng thái **Mới** | Tiêu đề "WO-… · …", căn, chip **Mới**, **Trong ngày**, loại; "Xong trước …"; mô tả; "Người báo: …"; "Ảnh lúc báo: n"; dòng khóa căn; **MỨC ĐỘ** **Gấp / Trong ngày / Không gấp**; nút **Hủy phiếu**, **Nhận việc** |
| Sau **Nhận việc** | Chip **Đang sửa**, "Người xử lý: …"; nút **Chờ vật tư**, **Sửa xong** |
| Hộp **Chờ vật tư – WO-…** | **Cần vật tư gì?** \*, **Ngày dự kiến có vật tư** \*, câu "Hạn của phiếu tạm dừng đến ngày này. Quá ngày mà chưa có, phiếu vào 'Cần chú ý'." · **Hủy**, **Lưu – chờ vật tư** (QA mở rồi **Hủy**, không lưu) |
| Hộp **Sửa xong WO-…** | **Đã làm gì?** \*, **Ảnh sau khi sửa** \* (ô chọn tệp), câu "Chụp ít nhất 1 ảnh sau khi sửa làm bằng chứng. Ảnh sau sửa: chụp bằng app kỹ thuật hoặc chọn ảnh ở đây." · **Hủy**, **Xác nhận sửa xong**. Ảnh **G4-02** |
| Hộp xác nhận thứ hai | Tiêu đề **Sửa xong WO-…**, "Khi bấm Xác nhận: Căn 301 · The Velvet mở khóa và mở bán lại trên mọi kênh · Căn chuyển 'Cần dọn (khách đã đi)' · Buồng phòng nhận việc 'Dọn sau sửa chữa'" · **Không, quay lại**, **Xác nhận sửa xong** |
| Kết quả | `actions/accept` 200, `actions/complete` 200; phiếu rời **Đang mở**, căn 301 `OOO` → `VD`, có việc **Dọn sau sửa chữa** |

- Toast "Đã mở bán lại căn …" chưa ghi được (QA đọc chữ trang sau 3,5 giây, toast đã tắt). Không ảnh hưởng chữ hướng dẫn.

### 22.4 Q4 – Desk của tài khoản chỉ có vai Bảo trì (`qa.g.mt1`, 14:31–14:34)

| Việc | Kết quả |
|---|---|
| Sau đăng nhập | Mở thẳng `/maintenance`, tiêu đề trang **Bảo trì**, góc phải "… · Bảo trì" |
| Menu | Chỉ nhóm **VẬN HÀNH**: **Các căn** (`/rack`), **Buồng phòng** (`/housekeeping`), **Phiếu sửa** (`/maintenance`). Không có nhóm Quản trị. Ảnh **G4-01** |
| Trang Bảo trì | Nút **Khóa phòng có kế hoạch**, **Phiếu sửa mới**; tab **Phiếu sửa**, **Khóa phòng**; lọc như quản lý. Thấy WO-00004 kèm "Đang khóa – mở bán lại 01/11" |
| Khung phiếu | Mở được, nút **Nhận việc** (không có **Hủy phiếu**, không chọn **MỨC ĐỘ**). QA không bấm |
| Tab **Khóa phòng** | Thấy danh sách khóa, **Đổi ngày mở bán**, "Khóa gắn phiếu WO-… – đóng phiếu để mở khóa." |
| **Phiếu sửa mới** | Hộp mở, **ô Căn không có lựa chọn nào** → không tạo được |
| **Khóa phòng có kế hoạch** | Hộp mở (**Căn**, **Khóa từ**, **Dự kiến xong**, **Lý do khóa**), **ô Căn không có lựa chọn nào** → không khóa được. Mạng: `GET …/rooms` 403 `FORBIDDEN_ACTION`, `GET …/channels` 403 → **BUG-R3-053** |
| **Các căn** | Sơ đồ 10 căn với trạng thái buồng (VC, OD, OOO "Mở bán lại 01/11"…), không có đơn, không tên khách |
| **Buồng phòng** | Thấy việc buồng phòng hôm nay và trạng thái buồng (chỉ xem; QA không bấm) |
| `/today`, `/reservations`, `/overview` | "Bạn không có quyền mở trang này – Trang này dành cho vai khác. Nếu bạn cần dùng, nhờ chủ đầu tư thêm vai cho tài khoản." + **Về trang chủ của tôi** |

Đối chiếu thêm vai chỉ Buồng phòng trên `/maintenance`: thấy danh sách phiếu, **không** có **Phiếu sửa mới**, **Khóa phòng có kế hoạch**.

### 22.5 Ảnh – đã chụp và kiểm che

Quy tắc theo `screenshot-list.md`. Ảnh lưu thẳng `product/docs/manual/img/<mã>.png` **sau khi QA xem từng ảnh ở cỡ thật**. PNG 8-bit, tổng 652 KB. Desk 1440×900; điện thoại 390×844 DPR 2 (tệp 780×1688). Che bằng hộp Ink #2B2B28.

| Mã | Có | Vai / dữ liệu | Kiểm che |
|---|---|---|---|
| G1-01 | Có | `qa.g.six` (quản lý thử), trang **Xác thực 2 bước**: "Đang bật từ 30/10/2026 14:39", "Còn 10 mã khôi phục", **Tạo bộ mã mới** (không bấm) | Không có mã nào trên màn |
| G1-02 | Có | Màn **Dùng mã khôi phục**, ô trống | Ô trống |
| G1-03 | Có | **Đăng ký lại trên điện thoại mới**, bước **Quét mã** (sau khi vào bằng 1 mã khôi phục) | **QR và khóa nhập tay che kín**; ô mã 6 số trống |
| G1-04 | Có | Chủ đầu tư, hộp **Khóa tài khoản của Trần Ngọc Mai?** (`qa.g.hk1`), bấm **Hủy** | Ô trống. Tên hiển thị các tài khoản thử của INV/E2E ở nền (danh sách người dùng) **che** |
| G1-05 | Có | Như G1-04, hộp **Đặt lại mật khẩu cho Trần Ngọc Mai?**, bấm **Hủy** | Như G1-04. Hộp xác nhận không hiện mật khẩu tạm |
| G1-06 | Có | `qa.mgr`, **Trả phòng** OTM-00359 (Emma Laurent, đơn thử của QA) bước **Bill & thu tiền**, bật **Ghi công nợ – khách trả sau**, **Hạn thanh toán** 02/11/2026, **Lý do** trống, nút **Ghi công nợ 210.000 đ – hoàn tất** (khóa). Không bấm hoàn tất | Không có mã giao dịch, QR chưa tạo |
| G2-01 | Có | `qa.g.fd1`, 5 lần sai → lần 6: "Bạn đã thử quá nhiều lần. Chờ 15 phút rồi thử lại." | Ô mật khẩu trống, tên đăng nhập giả |
| G2-02 | Có | `qa.fd`, **tên của mình → Đổi mật khẩu** | 3 ô trống |
| G2-04 | Có | `qa.fd` trên máy đã cấp quyền, **Nhật ký tiền → Hoàn tiền → Nhập nơi nhận hoàn** (OTM-00376, **Tiền mặt** chọn sẵn) | **Dòng nơi nhận chuyển khoản có 4 số cuối (••xxxx) của đơn khác ở nền đã che** |
| G2-07 | Có | `qa.fd`, hộp **Hủy giữ chỗ căn 402?** (OTM-00375), đóng hộp, không hủy (bản tính thử `dryRun`, đơn vẫn `hold`) | Danh sách **Lý do hủy** là ô chọn của trình duyệt, không chụp mở được bằng trình duyệt tự động; chữ các lựa chọn ghi ở 22.6 dòng 12 |
| G3-01 | Có | `qa.g.hk1` ngay sau **Lưu và vào ứng dụng** | Không có dữ liệu khách (trang buồng phòng chỉ có số căn) |
| G4-01 | Có | `qa.g.mt1`, trang **Bảo trì**, WO-00004 đang mở | – |
| G4-02 | Có | `qa.mgr`, khung WO-00004 (**Chờ vật tư**, **Sửa xong**) + hộp **Sửa xong WO-00004** có chữ "Đã làm gì?" và ảnh thử | Ảnh thử là ảnh chữ "QA TEST IMAGE", không người. Nút chọn tệp hiện "Choose File" (Chromium tiếng Anh, như C4-02) |
| G5-01 | Có | Desk **Đăng nhập** trên điện thoại | Ô trống |
| G5-02 | Có | `qa.ctv1` trên điện thoại, **Khách của tôi** tìm "Phan": 2 khách giả do QA tạo bằng CTV (KH-0450, KH-0451) | SĐT giả, Desk tự che giữa (0900\*\*\*141) |
| G2-05 | **Chưa** | Cần ≥ 1 giữ chỗ quá hạn. Đã dựng (22.7): OTM-00374 (cọc thiếu, hạn **02:44 31/10**) + OTM-00375 (còn hạn tới 01/11 14:44) | Chụp sáng 31/10 sau 02:50 |
| G2-06 | **Chưa** | Khung OTM-00374 sau hạn | Như trên |
| G2-03 | **Không làm được** | Ảnh chụp tờ in thật trong khung mica ở quầy | Cần UXD/INV chụp bằng máy ảnh tại OTTIMO |
| G3-02 | **Không làm được** | Hộp **Thêm vào Màn hình chính** là giao diện của trình duyệt trên điện thoại, không có trong Chromium tự động | Cần chụp trên điện thoại thật (che thanh địa chỉ, thông báo); hoặc giữ mô tả chữ |
| C1-15, C2-34 | **Chưa** | Cần ca ESC-031: đơn đi đúng ngày, trả sau 18:00, đêm đó căn đã có đơn đến. Staging hôm nay không có đơn nào đi 30/10 (2 đơn đang ở đều đi 29/10). Dựng ca hôm nay thì sớm nhất chụp được sau 18:00 31/10 – trùng buổi C3a | Giữ mô tả chữ |

- Không ảnh nào lọt QR, số tài khoản, tên chủ tài khoản, số giấy tờ, mã cửa, mã 2 bước, mã khôi phục, mật khẩu, link có token, SĐT hay email thật. **QA xác nhận 15 ảnh G mới trong `img/` đã kiểm che, ORC commit được.**
- Ảnh ứng viên và ảnh thô ở `qa-r6/g/shots/`, `qa-r6/g/raw/` (scratchpad). Ảnh thô màn đăng ký 2 bước không được lưu.

### 22.6 Chỗ hướng dẫn BA viết khác giao diện (BA sửa, QA không sửa tệp)

| # | Tệp, mục | Hướng dẫn ghi | Giao diện thật | Đề nghị |
|---|---|---|---|---|
| 1 | 03 mục 1.2 bước A.5 (và chú thích G3-01) | "Desk có thể báo 'Bạn không có quyền mở trang này'… Bấm tên của mình → Đăng xuất" | Desk mở trang **Buồng phòng**, không báo gì | "Desk mở trang **Buồng phòng**. Không cần làm gì thêm: bấm **tên của mình → Đăng xuất**." Xóa chú thích `<!-- QA kiểm (BA-GUIDES Q2) -->` ở 03, 04, 01 mục 1.9 (đã có kết quả) |
| 2 | 03, 04 mục 1.3 (bảng câu báo) | Không có câu "mạng yếu" | Nếu chưa đổi mật khẩu tạm, app vẫn vào nhưng báo "Chưa tải được việc hôm nay – Có thể do mạng yếu…" (bảo trì: "Chưa tải được phiếu sửa") | Thêm dòng: "Ngay lần đăng nhập đầu, hoặc sau khi chủ đầu tư đặt lại mật khẩu, app báo 'Chưa tải được … Có thể do mạng yếu': chưa đổi mật khẩu tạm. Làm bước A trên Desk rồi đăng nhập lại app" (tới khi sửa BUG-R3-052) |
| 3 | 04 mục 1.1 (bảng), 1.3 phần **Desk**, mục 5; 01 mục 1.9 bảng vai ("Bảo trì: App nhân viên (+ Desk khi khóa phòng)") | Bảo trì khóa phòng có kế hoạch, tạo phiếu sửa trên Desk | Vai chỉ Bảo trì không chọn được căn → không khóa, không tạo phiếu được trên Desk (BUG-R3-053) | Tới v1.0.1: "Khóa phòng có kế hoạch do lễ tân hoặc người trực làm trên Desk. Bảo trì báo sự cố trên app (tích **Đề nghị khóa căn**) hoặc nhắn lễ tân ngày, căn, lý do." Bảng 01 mục 1.9: cột "Đăng nhập ở" của Bảo trì → "App nhân viên". Mục 5 "Bảo trì hoặc lễ tân" → "Lễ tân hoặc người trực" |
| 4 | 04 mục 1.3 phần Desk bước 2 | "Mở **Vận hành → Bảo trì**" | Với vai chỉ Bảo trì, mục menu tên **Phiếu sửa**; Desk mở sẵn trang **Bảo trì** sau đăng nhập. Với quản lý/người trực, mục tên **Bảo trì** | "Desk mở sẵn trang **Bảo trì** (menu: **Vận hành → Phiếu sửa**)". Nếu áp dòng 3 thì phần này chỉ còn để xem |
| 5 | 04 mục 4.4 bước 3, 5 | "Các nút cùng tên như trên app: **Nhận việc**, **Lưu – chờ vật tư**, **Sửa xong**" · bước 5 "Bấm **Xác nhận sửa xong**" | Khung: **Nhận việc** (và **Hủy phiếu**); sau khi nhận: **Chờ vật tư**, **Sửa xong**. **Lưu – chờ vật tư** nằm trong hộp **Chờ vật tư – WO-…**. **Xác nhận sửa xong** mở thêm hộp xác nhận, bấm **Xác nhận sửa xong** lần nữa | Bước 3: "Bấm **Nhận việc**. Sau đó khung có **Chờ vật tư** (hộp **Chờ vật tư – WO-…**: **Cần vật tư gì?**, **Ngày dự kiến có vật tư** → **Lưu – chờ vật tư**) và **Sửa xong**." Bước 5: "Bấm **Xác nhận sửa xong**, đọc hộp 'Khi bấm Xác nhận…' rồi bấm **Xác nhận sửa xong** lần nữa." |
| 6 | 02 mục 1.6 "Đổi mật khẩu khi muốn" + nhãn ảnh G2-02 "Hộp Đổi mật khẩu" | "… → nhập mật khẩu hiện tại và mật khẩu mới → lưu" | Là **màn** (trang `/change-password`), không phải hộp: **Mật khẩu hiện tại**, **Mật khẩu mới**, **Nhập lại mật khẩu mới**, nút **Lưu và vào ứng dụng**, **Quay lại** | "… → màn **Đổi mật khẩu** → **Mật khẩu hiện tại**, **Mật khẩu mới**, **Nhập lại mật khẩu mới** → **Lưu và vào ứng dụng**". Nhãn ảnh: "Màn Đổi mật khẩu" |
| 7 | 02 mục 1.4 (G2-01) | "Gõ sai nhiều lần: Desk báo …" | Đúng chữ. Khóa sau **5** lần sai, lần thứ 6 báo "Chờ 15 phút", nút **Đăng nhập** mờ | Có thể ghi rõ "5 lần sai – chờ 15 phút" (tùy BA) |
| 8 | 01 mục 1.7 dòng "mất điện thoại, còn mã khôi phục" | "Desk mở **Đăng ký lại trên điện thoại mới**: làm lại như mục 1.3" | Đúng chữ. Bước 2 hỏi **Mật khẩu hiện tại** rồi **Tạo mã QR**. **Nếu bỏ dở** (đóng trình duyệt trước khi xong), lần đăng nhập sau Desk vẫn nhận mã của **ứng dụng trên điện thoại cũ** và vào thẳng **Tổng quan**, không bắt đăng ký lại (QA thử 14:40) | Thêm: "Làm xong đăng ký lại ngay, không bỏ dở." **SEC xem** (S2/S4): đây là cách hợp đồng 0.3.8 mô tả (phiên hạn chế chỉ cho lượt vào bằng mã khôi phục), không ghi là lỗi; nhưng với người mất điện thoại, mã trên máy bị mất vẫn dùng được tới khi đăng ký lại hoặc chủ đầu tư **Đặt lại mật khẩu** |
| 9 | 01 mục 1.9 **Đặt lại mật khẩu** | Chỉ ghi Desk hỏi mật khẩu + mã 6 số ở **Khóa tài khoản** | **Đặt lại mật khẩu** cũng hỏi **Mật khẩu đăng nhập** và **Mã trong ứng dụng xác thực (6 số)** (hộp "Đặt lại mật khẩu cho …?") | Thêm câu này vào gạch **Đặt lại mật khẩu** |
| 10 | 05 mục 6.2 **Khách của tôi** | "Hồ sơ khách mình đã tạo: họ tên, số điện thoại, ngôn ngữ giao tiếp" | Trang tiêu đề **Khách hàng**, **trống** tới khi gõ: "Tìm khách để bắt đầu – Gõ ít nhất 2 ký tự của tên, mã KH hoặc SĐT/email." Kết quả: **MÃ KH**, **HỌ TÊN**, **LIÊN HỆ** (SĐT che giữa), **QUỐC TỊCH**, **NHÓM KHÁCH**; nút **Thêm khách** | Thêm bước: "Gõ ít nhất 2 ký tự của tên, mã KH hoặc SĐT vào ô **Tìm khách**." Ghi "trang **Khách hàng**" |
| 11 | 02 mục 17.1 bảng, (a) | "**Nhập nơi nhận hoàn** ngay: **Chuyển khoản** (mặc định)" | Hộp chọn sẵn **Tiền mặt** (câu trong ngoặc ngay sau đã nói đúng) | Đổi "(mặc định)" thành "(cách nên dùng)" để khỏi hiểu là Desk chọn sẵn |
| 12 | 02 mục 17.2 (G2-07) | Lý do **Khách đổi ý**, **Không liên lạc được**, **Khác (ghi rõ)** | Đúng. Danh sách đủ: **Khách đổi ý**, **Khách tìm được chỗ khác**, **Giá chưa phù hợp**, **Đổi ngày**, **Không liên lạc được**, **Khác (ghi rõ)**. Hộp **Hủy giữ chỗ căn …?**, nút **Giữ lại đơn** / **Hủy giữ chỗ** | Không phải sửa |

Khớp, không phải sửa: 01 mục 1.4 (trang **Xác thực 2 bước**, **Tạo bộ mã mới**), 1.7 (**Mất điện thoại? Dùng mã khôi phục**, **Mã khôi phục (16 ký tự)**, **Đăng nhập bằng mã khôi phục**), 1.8 (chữ app với vai quản lý), 1.9 (**Khóa tài khoản**, **Sửa vai**, **Đặt lại mật khẩu**, **Mở khóa**), mục 6 (**Ghi công nợ – khách trả sau**, **Hạn thanh toán** mặc định +3 ngày, **Lý do ghi công nợ**, **Ghi công nợ … – hoàn tất**); 02 mục 12.2 (**Nhập nơi nhận hoàn**, **Cách hoàn** chọn sẵn **Tiền mặt**, **Cùng cách khách đã trả**, **Lưu**); 03 mục 1.2 bước A.1–4, B, 1.3 (thanh dưới); 04 mục 1.2, 1.3 phần app; 05 mục 1.2 (CTV vào thẳng **Báo giá & giữ chỗ**).

### 22.7 Dữ liệu staging – trước / sau

| Đối tượng | Trước | Sau |
|---|---|---|
| Tài khoản `qa.g.hk1`, `qa.g.mt1`, `qa.g.six`, `qa.g.fd1` | Không có | Tạo 14:28–14:49, **khóa** 14:56 (owner, xác nhận 2 bước). `qa.g.six` đã bật 2 bước, dùng 2 mã khôi phục, đăng ký lại 1 lần. Khóa nhập tay lần đăng ký lại của `qa.g.six` lọt **một lần** vào nhật ký chạy của QA (scratchpad, không vào repo): đã xóa khỏi nhật ký, tài khoản đã khóa nên khóa đó vô dụng. Tệp mật khẩu/khóa/mã ở scratchpad **đã xóa**. Desk không có nút xóa người dùng |
| WO-00004 (301, Điện / đèn, Trong ngày, khóa 30/10–31/10) | Không có | Tạo (MGR) → nhận → **Sửa xong** (ảnh thử) → khóa mở. 1 khóa phòng `WO-00004` đã đóng |
| Căn 301 | `VC` | `OOO` → `VD` → QA (`qa.g.hk1`) **Bắt đầu dọn → Dọn xong** → **`VC`** như trước |
| **Căn 203** | `VD`, việc "Dọn trả phòng" từ hôm trước | **`VC`** – **QA bấm nhầm**: lượt dọn căn 301 trên app nhân viên bấm vào nút **Bắt đầu dọn** của dòng đầu (203) rồi **Dọn xong** (14:36). Không đơn nào gắn với 203 hôm nay. Nếu ca ESC-031 (C1-15/C2-34) cần 203 ở trạng thái cũ: MGR/FDL đổi về "cần dọn" (`needs_cleaning`) – QA chưa làm để khỏi ghi thêm |
| OTM-00374 (401, 24/11→26/11, giữ chỗ 12 giờ, khách giả KH-0447) | Không có | **Còn `hold`**, cọc 100.000 tiền mặt thử (PT-000479, cọc cần 600.000), hạn **02:44 31/10** – để chụp G2-05/G2-06. Dọn sau khi chụp: MGR đảo PT-000479, rồi **Hủy giữ chỗ** lý do **Khách đổi ý** (như dọn OTM-00368, 19.8) |
| OTM-00375 (402, 24/11→26/11, giữ chỗ 48 giờ, KH-0447) | Không có | **Còn `hold`**, chưa cọc, hạn 14:44 01/11 – dòng "còn hạn" của G2-05. Dọn sau khi chụp: **Hủy giữ chỗ**, **Khách đổi ý** |
| OTM-00376 (103, 25/11→27/11, Trực tiếp) | Không có | Tạo có cọc 500.000 tiền mặt thử → **hủy** (Khách đổi ý) → yêu cầu hoàn 500.000 → FD nhập nơi nhận **Tiền mặt** → OWN **duyệt** → OWN **chi** PT-000481 (ảnh biên nhận thử). Folio: đã thu 500.000, đã hoàn 500.000, **còn thu 0, tiền dư 0** |
| OTM-00359 (201, Emma Laurent – đơn thử QA từ 27/10, đi 29/10, vẫn **Đang ở**) | Folio 1.610.000/1.610.000 | QA mở **Trả phòng** để chụp G1-06 (không hoàn tất). Desk ghi thêm: 3 bản ghi `minibar-checks` (BUG-R3-024) và **đặt trả muộn 14:53** (`late-checkout` 200) → dòng **Phụ thu trả muộn (14:53)** 210.000, còn phải thu 210.000. Đơn vẫn **Đang ở**. Việc trả phòng đơn này (tồn từ 27/10) cần làm khi dọn: xử lý dòng 210.000 (MGR đảo) rồi trả phòng, hoặc ORC quyết |
| Khách giả KH-0450 "Phan Minh Khang", KH-0451 "Phan Thu Trang" (SĐT 0900000141/142) | Không có | Tạo bằng `qa.ctv1` cho G5-02. Desk không có nút xóa hồ sơ |
| BG-00051, BG-00052 | Không có | Báo giá của OTM-00374/00375 (đã chuyển giữ chỗ) |

- Không VietQR, không chuyển tiền thật; mọi khoản là "tiền mặt" thử có ghi chú "QA test record - not real money".
- Lượt chụp G2-05/G2-06 sáng 31/10 (sau 02:50) cần ORC giao lại cho QA, kèm dọn OTM-00374/00375.

## 23. D1 – landing có form trên digest CI (30/10, 15:48–15:59)

- Người chạy: QA | Round 3 – bước **Kiểm thử** | Điều kiện **D1** của SEC (`reviews/SEC-on-OPS-us155-enable.md`) và bước **P4** của `outputs/OPS/us155-enable-plan.md` (mục 3 "QA thử landing có form").
- Ứng viên `landing-v1.1.0` = commit `8f1265e0` trên `main` (có PR #15 gộp ở `4aadbb4`). CI run **41025960284**: **success**, xong 15:48:54. Mọi job xanh: shellcheck, landing Playwright, lint/test/build, gitleaks, OpenAPI, contract, no test endpoints, docker E2E smoke, publish images, deploy staging. Chỉ "deploy landing preview" bị bỏ qua (skipped).
- Không đụng production, không đụng staging VPS. Không SQL tay ngoài stack thử. Không commit. Dữ liệu đều giả. Dùng đúng chuỗi của khói L: "TEST OTTIMO", `info@ottimo.vn` là hộp thư chung công khai.

### 23.1 Kết luận: **ĐẠT**

| Mục | Kết quả |
|---|---|
| Image landing CI | `ghcr.io/anhvh93-tech/ottimo-landing:sha-8f1265e0e878` = **`sha256:2a284a7d6f7cea5a9a6e7dfeb6b0193461b03a4af94fd7a9cd681cb1eb5c2af6`** (artifact `image-digests` của run; tag và digest trỏ cùng image) |
| **Băm `/privacy/` (en)** | **`d35d2810f341c1cf6d4b9079ba1d21281902f259f9ca6b05a4673c188d3c327a`** |
| **Băm `/vi/privacy/` (vi)** | **`940bd18b6701e93dfa520ee87463a776ae0bb98c8d964b2dbd1276767a88776a`** |
| Test OPS `publish-privacy-notice.test.sh` trên image này | **22 passed, 0 failed** (15:51:25–15:51:57) |
| Công cụ thật trên stack `ottimo-qa155` (kiểm cả digest) | chạy thử `DRY RUN OK` → `--apply` `RESULT: published (inserted: vi,en)` |
| Trang privacy `2026-10-24` nguyên văn | Đạt (23.3) |
| Form gửi được (K → L2) | Đạt: OWN bật 200; form gửi 202; consentVersion `2026-10-24` |
| WR8 + `us155-smoke-counts.sh` trên dòng do api ghi | **`RESULT: OK – 14/14`**, exit 0 |
| TC-WR-* + C-1 trên cùng digest (bổ sung P4) | **13/13 passed** (1,1 phút) |

**Số đối chiếu cho bước J (SEC D1):** 2 băm ở trên là băm của image CI theo digest `2a284a7d…2af6`. Có 4 nguồn đo khác nhau và cả 4 trùng nhau:
- (a) `sha256sum` chạy trong image (`docker run`);
- (b) dòng `image:` mà công cụ in ra trong test OPS;
- (c) công cụ chạy trên stack `ottimo-qa155`. Trên stack này công cụ có kiểm digest: image của container landing đang chạy phải mang `@sha256:2a284a7d…`;
- (d) `curl -H 'Accept-Encoding: identity'` từ Mac qua Caddy landing của stack: `/privacy/` và `/vi/privacy/` trả 200 `text/html`, đúng 2 băm.

Ở bước J (VPS) và khi băm từ Mac qua mạng ngoài, 2 băm phải trùng 2 số này. Lệch thì dừng, không sang K.

### 23.2 Môi trường

- Stack `ottimo-qa155` dựng trên Mac QA theo đầu tệp `tests/e2e/support/us155-stack/compose.us155.yml`:
  - landing = **đúng image CI**: `docker pull …@sha256:2a284a7d…`, gắn tag `ottimo-landing:qa155`, `pull_policy: never`, kèm `infra/caddy/Caddyfile.landing` thật (`LANDING_PUBLIC_API=on`, `https://landing.localhost:58150`);
  - api/worker/migrate/seed = `ghcr.io/anhvh93-tech/ottimo-api:sha-8b3aec89486f-test` (`v1.0.0` + hỗ trợ test, `sha256:04b2f857…8b91`), web = `ottimo-web:sha-8b3aec89486f` (`sha256:c85e8874…4755`) – cùng image api staging `v1.0.0`;
  - DB mới, migrate, seed DS-E. `.env` tạo bằng `infra/ci/make-ci-env.sh`, khóa ký form ngẫu nhiên. Tệp này nằm ở scratchpad và **đã xóa**.
- Image CI chỉ có bản `linux/amd64`. Trên Mac (arm64) image chạy qua giả lập và chạy bình thường. VPS là amd64.
- Đặc điểm image (đọc trong image):
  - trang chủ EN/VI có `<form>` và `data-consent-version="2026-10-24"`, `data-property="dlt"`;
  - `/privacy/` có "Version 2026-10-24", `/vi/privacy/` có "Phiên bản 2026-10-24";
  - canonical trỏ `https://ottimo.vn/…`, tức image dựng với `LANDING_SITE_URL=https://ottimo.vn`, đúng bản sẽ deploy.
- Công cụ OPS chạy trên stack qua `PN_TEST_DC` (wrapper compose của stack) và `SMOKE_HTTPS_PORT=58150 SMOKE_INSECURE=1` (CA nội bộ của Caddy, không phải production). **Không** dùng `PN_TEST_NO_DIGEST`: `state/digests/landing-qa155` = digest CI, nên công cụ kiểm được digest như trên VPS. Dòng log: `landing container image 2a284a7d6f7c ok (digest 2a284a7d6f7c…)`.

### 23.3 Trang privacy `2026-10-24` – nguyên văn

| Kiểm | Kết quả |
|---|---|
| Nguồn chữ không đổi từ lúc tạo version | `git diff 5d6701a6 8f1265e0` (5d6701a6 = commit FE-B 24/10 tạo version `2026-10-24`) **rỗng** cho `content/privacy.ts`, `pages/[privacy].astro`, `pages/vi/[privacy].astro`. Câu đồng ý A.1/A.2 trong `en.ts`/`vi.ts` không đổi. `site.json` chỉ đổi `checkinTime`/`roomReadyBy`, privacy không dùng 2 trường này. Có một câu báo lỗi ô đồng ý trong `booking-strings.ts` đổi "OTTIMO" → "chúng tôi" (24/10, CPY); câu này không thuộc văn bản thông báo hay câu đồng ý |
| Trang phục vụ = nguồn | Lấy mọi chuỗi trong `privacy.ts`, thay `${VERSION}`, tên pháp nhân, mã số thuế, địa chỉ, email, Zalo theo `site.json`, rồi so với trang lấy từ stack: **74/74 chuỗi có nguyên văn** trên `/privacy/` + `/vi/privacy/`, 0 thiếu |
| Version 3 nơi khớp | Trang "Version 2026-10-24" / "Phiên bản 2026-10-24"; form 2 trang chủ `data-consent-version="2026-10-24"`; yêu cầu do api lưu: `consent_version = 2026-10-24` |

### 23.4 K → L2 → L4 → L5 trên stack (diễn tập đúng kịch bản production)

| # | Giờ | Bước | Thấy gì | Đạt? |
|---|---|---|---|---|
| 1 | 15:52:21 | J chạy thử: `publish-privacy-notice.sh --landing-tag qa155 --version 2026-10-24 --property DLT --operator qa.test` | Kiểm digest OK. Băm image = băm trang thật. In các dòng INSERT "would" vi/en và audit. `readiness: … vi+en active = 2026-10-24`, `DRY RUN OK – nothing written` | Đạt |
| 2 | 15:52:29 | J `--apply` | `RESULT: published (inserted: vi,en, already present: -)`, `OK: version 2026-10-24 published (vi + en)` | Đạt |
| 3 | 15:54:45 | K: OWN (`qa.owner`) `PUT …/parameters/public_booking_requests_enabled` `true`, hôm nay | **200**, không còn 422 `PUBLIC_FORM_NOT_READY`. Dòng tham số được ghi trên dòng do công cụ ghi | Đạt |
| 4 | 15:55:03 | L0 `since` = `2026-10-30T15:55:03+07:00`, lấy ngay trước khi gửi | – | – |
| 5 | 15:55:0x | L2: Chromium, landing EN, ngày đến +20 ngày, 2 đêm, tên **TEST OTTIMO**, kênh **Email**, `info@ottimo.vn`, **không SĐT** (ô SĐT trống), lời nhắn "Smoke test – please erase", tích đồng ý → **Send** | 1 `GET form-token`, đúng 1 `POST …/dlt/booking-requests` (202). **0 request ra ngoài origin landing (C-1)**. Mã **DNWFFR5W**. Màn **Request sent**: "Thank you, TEST OTTIMO. This is a request, not yet a booking." · "We will reply by email." · "We reply within 1 hour (07:00–22:00, Da Lat time)." · "If you have not heard from us by 16:55, call 08.4444.0909…". DB: `status new`, `consent_version 2026-10-24` | Đạt |
| 6 | 15:55:1x | L4: Desk `qa.fdl` → **Yêu cầu từ website** → tìm DNWFFR5W → mở (thấy "TEST OTTIMO") → **Xóa theo yêu cầu người gửi** → cách xác minh **cùng liên hệ** = `info@ottimo.vn` → **Xóa ngay** | Toast "Đã xóa dữ liệu…" | Đạt |
| 7 | 15:55:22 | L5: `bin/us155-smoke-counts.sh --ref REQ-DNWFFR5W --since 2026-10-30T15:55:03+07:00` (`PN_TEST_DC` = compose của stack) | 14 dòng OK, **`RESULT: OK – 14/14`**, exit 0 (chạy lại lần 2: exit 0) | Đạt |

Đầu ra nguyên văn của L5. Chỉ có mã REQ và số, không dữ liệu cá nhân:

```
US-155 smoke counts – ref DNWFFR5W since 2026-10-30T15:55:03+07:00 – 2026-10-30T08:55:22Z
1. website_booking_request: rows with this ref | 1 | 1 | OK
2. website_booking_request: erased (name/phone/email/note/decline_note/contact_hmac/ip_hmac NULL, pii_purged_at set, declined/erased_on_request) | 1 | 1 | OK
3. website_booking_request: this row contains a test string | 0 | 0 | OK
4. purge_journal: dsr_erase null_columns for this request | 1 | 1 | OK
5. audit_event: security website_request.erased for this request | 1 | 1 | OK
6. audit_event since: test string in a row | 0 | 0 | OK
7. idempotency_key since: test string (response_body or row) | 0 | 0 | OK
8. outbox_message since: test string (payload or row) | 0 | 0 | OK
9. staff_notification: notifications for this request (website_request_new …) | 5 | >=1 | OK
10. staff_notification since: test string in a row | 0 | 0 | OK
11. attention_event since: test string in a row | 0 | 0 | OK
12. state_transition SM-18: history rows of this request | 2 | >=1 | OK
13. state_transition SM-18 of this request: test string in a row | 0 | 0 | OK
14. all public tables: rows containing test string 1 – none | 0 | 0 | OK
RESULT: OK – 14/14
```

Khác với ca 15 của OPS (dòng giả dựng bằng SQL): ở đây dòng yêu cầu, outbox, thông báo, lịch sử SM-18, purge và audit đều do **api `v1.0.0` thật** ghi. Đường đi là form trên image CI → Caddy landing → api, rồi WR8 trên Desk.

### 23.5 Test OPS – 22 ca trên image CI

`VERBOSE=1 API_IMAGE_REF=ghcr.io/anhvh93-tech/ottimo-api:sha-8b3aec89486f-test LANDING_IMAGE_REF=ottimo-landing:qa155 bash product/infra/server/test/publish-privacy-notice.test.sh` (`ottimo-landing:qa155` lúc chạy = digest `2a284a7d…`). Kết quả: **22 passed, 0 failed**, khoảng 32 giây. Gồm ca 1–14, 3b, 13b, 15–20. Bốn ca SEC yêu cầu QA đều Đạt: chạy thử không ghi (1), `--apply` ghi đúng 2 dòng + 1 audit (2), chạy lại không đổi (5), khác băm → dừng (9). Dòng `image:` của ca 1–2 in đúng 2 băm ở 23.1. Stack thử `ottimo-pn-test` tự xóa: 0 container, 0 volume.

### 23.6 TC-WR-* + C-1 trên cùng digest (P4)

`e2e/ui/us155-website-requests.r3.spec.ts` (`desk-chromium`) trên stack `ottimo-qa155`, sau L5: **13/13 passed**. Gồm:
- TC-WR-000…012: công tắc 422/404, Desk S35, gửi EN, nhận xử lý + Tạo đơn, Kênh/Nguồn chỉ đọc, WR8 có `CONTACT_MISMATCH`, tên/lời nhắn độc hại, U+202E, CCCD 422 kể cả viết cách nhóm, kill switch, công tắc tắt → Zalo/gọi, FDL thấy dòng "form đang tắt";
- C-1 trong TC-WR-002: không request nào ra ngoài origin landing.

Phiên đăng nhập của harness lưu ở thư mục riêng trong scratchpad (`E2E_AUTH_DIR`), không ghi đè phiên của stack khác.

### 23.7 Ghi chú (không phải lỗi mới)

- **Bật công tắc lần hai trong cùng ngày khi công tắc đang bật → 422.** Lượt chạy lại script diễn tập của QA gặp trường hợp này. Lượt đầu (bước 3) đã 200. Hướng dẫn cho bước K: OWN bấm bật **một lần**; nếu thấy 422 thì xem Desk H05 trước, có thể công tắc đã bật. Cùng thiết kế BUG-R3-008 (bật lại trong ngày bị từ chối). QA không đọc mã lỗi của lượt này, chỉ ghi số 422.
- Trên production, công cụ chạy với chứng chỉ thật, `SMOKE_*` mặc định và có kiểm digest. Stack thử khác ở hai điểm:
  - `SMOKE_INSECURE=1` vì Caddy dùng CA nội bộ;
  - `PN_TEST_DC`.

  Băm không phụ thuộc hai điểm này.
- Image landing chỉ có `linux/amd64`. Nếu sau này cần chạy trên máy arm64 thì sẽ chạy qua giả lập, chậm hơn nhưng kết quả băm không đổi.

### 23.8 Dọn

| Nơi | Sau |
|---|---|
| Stack `ottimo-qa155` | `docker compose down -v --remove-orphans`: 0 container, 0 volume, mạng đã xóa. Dữ liệu (DNWFFR5W đã xóa C2, các yêu cầu của TC-WR, công tắc) mất cùng volume |
| Stack `ottimo-pn-test` | Test tự xóa |
| Tệp tạm | `.env` stack (khóa thử), thư mục home giả của công cụ, phiên harness, trang tải về: **đã xóa**. Script diễn tập tạm (`tests/e2e/ui/zz-qa155-d1-smoke.tmp.spec.ts`) **đã xóa**, không vào repo |
| `tests/fixtures/seed/.out/ds-e.map.json` | Lệnh seed của stack ghi đè tệp này. QA đã sao lưu trước và **chép lại bản cũ** sau khi dọn, nên stack `ottimo-esc031`, `ottimo-demo` không bị ảnh hưởng |
| Image trên Mac | Còn `ghcr.io/anhvh93-tech/ottimo-landing:sha-8f1265e0e878` (digest CI). Tag `ottimo-landing:qa155` đã trả về bản dựng cục bộ trước đó (`6c0645fe`). Đã gỡ tag tạm `ottimo-api:qa155`, `ottimo-web:qa155` (image GHCR gốc vẫn giữ) |
| Production, staging VPS | Không đụng |
