# R-6 – QA chạy trên staging (QA, Round 2 – Bước 4 sau cổng QC Round 2)

- Căn cứ: `rounds/round-02/qc/round-qc-gate.md` mục 5, dòng R-6 (phần của QA: E2E A1–A7 trên staging, chạy tay A1 có ảnh, S4-15 upload qua Caddy thật). Phần SEC (SEC-G2) và PO (P-R2-7) không nằm trong tệp này.
- Ngày chạy: 22/10/2026, 18:15–19:25 (giờ VN). Người chạy: QA.
- Staging: `https://desk.staging.ottimo.vn`, `https://staff.staging.ottimo.vn`, `https://g.staging.ottimo.vn` – image production `sha-4fd0651b7be3` (không `-test`, không test-support, `CLOCK_MODE=system`), chứng chỉ thật, dữ liệu giả DS-E (`outputs/OPS/staging-readiness.md` mục 10).

## 1. Kết luận

| Dòng | Trên staging | Còn lại |
|---|---|---|
| A1 | **Đang đi, phần 1–2/3 Đạt** (phần 2 chạy 23/10 19:16). Tự động: mọi ca A1 không cần đồng hồ giả đều xanh (API + UI). Chạy tay: chặng 1–5 Đạt hôm nay (đơn `OTM-00239`, căn 202, đến 23/10, đi 25/10) | Chặng 6–7 chạy **23/10 sau 14:00**, chặng 8–12 chạy **25/10** (giờ thật, không tua được ngày). `TC-X-070` liền mạch: chỉ chạy trên stack CI |
| A2 | Đạt phần API (10/10) | Ca cần đồng hồ: stack CI |
| A3 | Đạt (`concurrency` 4/4, chống trùng 7/7) | Giữ chỗ quá hạn tự hủy (`hold-expiry.clock`): stack CI |
| A4 | **Đạt trọn chuỗi chạy tay** (TC-X-072 làm bằng tay trên staging, giờ thật, 15 ảnh + 5 video) | `TC-X-072` tự động: stack CI |
| A5 | Đạt phần API (21/21 chạy; 2 ca cần SQL bỏ qua) | No-show sau mốc giờ: stack CI |
| A6 | Đạt: RBAC **1.474/1.474** + logout 11/11; identity, C3, nhật ký | SEC-G2 do SEC chấm |
| A7 | Ca tiền `money-s4` 34/34 Đạt | Đối soát `a7-ds0` (DATA, cần DS-0 + SQL): stack CI |
| S4-15 | **Đạt**: upload qua Caddy production đúng giới hạn (mục 5) | – |

- **Không lỗi P0/P1/P2 mới.** Có 4 lỗi P3 mới: 2 lỗi sản phẩm nhỏ (BUG-R2-219, 220) và 2 lỗi bộ test khi chạy trên staging (BUG-R2-221, 222). Lỗi cũ thấy lại trên staging: BUG-R2-216 (số cọc in 2 lần), BUG-R2-218 (ca `knownBug` hỏng đúng chỗ).
- **Mọi ca đỏ của lượt đầu là do giới hạn tần suất** (đăng nhập 20/IP/15 phút, tra khách 30/người/giờ, mở phiên khách 10/IP/phút). Image production không có `/__test__/rate-limits/reset`, nên QA chạy lại sau khi hết cửa sổ: **xanh hết**. Không ca nào đỏ vì lỗi sản phẩm.
- QC chấm "A1–A7 xanh trên staging" được cho mọi ca chạy được trên image production. Ca cần đồng hồ giả hoặc test-support ghi "chạy trên stack CI, không chạy được trên staging production image" (mục 4). Lượt chạy tay A1 có hình **chưa trọn** tới 25/10.

## 2. Cách chạy

| Mục | Giá trị |
|---|---|
| Mã test | `git archive 4fd0651 product` (đúng commit của image) vào scratchpad. Repo **không sửa**, không commit |
| Đích | `E2E_API_URL` = `E2E_WEB_URL` = `E2E_ORIGIN` = desk; `E2E_STAFF_URL` = staff; `E2E_GUEST_ORIGIN` = g; `E2E_COOKIE_SECURE_PREFIX=true` (cookie `__Host-`) |
| Bí mật | `QA_SEED_PASSWORD` đọc từ `~/.ottimo/staging/qa_seed_password.txt` vào biến môi trường, không in. Token thiết bị quầy đọc thẳng từ `~/.ottimo/staging/ds-e.map.json` (`E2E_SEED_OUT`). Không `TEST_SUPPORT_TOKEN` |
| Trình duyệt | Playwright 1.63, Chromium, 1 worker, `--retries=0` |
| Sửa trên bản chép (scratchpad, không vào repo) | (1) `E2E_LOCAL_CLOCK=1`: `stackToday`/`stackNow`/`serverLocalTime` lấy giờ máy QA (+07:00) thay vì `GET /health`. Staging chặn `/health` từ Internet theo thiết kế (SEC OPS-12), còn staging chạy giờ thật, nên hai đồng hồ trùng nhau → BUG-R2-222. (2) `rbac-sprint3.spec.ts`: hàm SSE dùng `node:https` khi URL là https → BUG-R2-221. Không sửa điều kiện kiểm nào |
| Ca QA viết thêm cho lượt này (scratchpad) | `ui/qa-a1-staging.spec.ts` (A1 chia 3 phần theo ngày thật), `ui/qa-a4-staging.spec.ts` (A4), `api/qa-s415.api.spec.ts` + `api/qa-guest-upload-big.api.spec.ts` (S4-15) |
| Gửi ra ngoài | Không. Zalo/email ở staging là `mock`/tắt (`staging-readiness.md` mục 9). Không gọi `/__test__`, không dò cổng |

## 3. Kết quả tự động trên staging

| Project | Số ca | Lượt đầu | Sau khi chạy lại hết cửa sổ giới hạn | Bỏ qua (lý do) |
|---|---|---|---|---|
| `api` (26 tệp) | 216 | 196 đạt · 13 đỏ (đều 429) · 7 bỏ qua | **209 đạt · 0 đỏ** | 7: 3 ca cần SQL/đọc DB trực tiếp (`E2E_COMPOSE_CONTROL`), 4 ca R3 (mã cửa US-128, dài hạn ký quỹ US-041) – giống CI |
| `rbac` (sprint 1–3) | 1.529 | 1.197 đạt · 9 đỏ (BUG-R2-221) · 323 bỏ qua | **1.474 đạt · 0 đỏ** | 55: 2FA thuộc R3 (5 thao tác × 11 chủ thể) – giống CI. 268 ca `qa.fdsal`/`qa.hkmt` bỏ qua ở lượt đầu vì 429 đăng nhập: chạy lại, đạt |
| `rbac-logout` | 11 | 11 đạt | – | – |
| `desk-chromium` (11 tệp UI + axe) | 64 | 57 đạt · 5 đỏ (đều 429) · 2 bỏ qua | **62 đạt · 0 đỏ** | 2: TC-L2-020/076 (E) `fixme` sẵn trong bộ, giống CI |
| – trong đó axe `a11y.axe.spec.ts` H01–H12 + giao diện tối | 9 | 9 đạt | – | – |
| – trong đó `TC-L7-053` (BUG-R2-218, `knownBug`) | 1 | hỏng đúng chỗ lỗi (tính là đạt) | – | lỗi P3 vẫn Open |
| `smoke` | 8 | 2 đỏ (`TC-X-050a/b` `/health`) · 6 pending | – | `/health` trả 404 từ Internet **theo thiết kế** (SEC OPS-12). Thay bằng smoke của OPS từ VPS: `/health` 200 (`staging-readiness.md` 10.2). Không tính là lỗi |

Chi tiết các ca đỏ của lượt đầu (đều chạy lại xanh):
- 429 đăng nhập theo IP (SR-RL-01, 20 lần/15 phút): `TC-RB-022`, `TC-NT-006` (`qa.mt`, `qa.sal`, `qa.ctv1`), `TC-NT-010 (E)`; 268 ca RBAC của `qa.fdsal`/`qa.hkmt` bỏ qua.
- 429 tra khách theo người (30 lần/giờ): `TC-L5-016 (ru)`, `TC-L5-020`, `TC-L5-035`, `TC-L5-052`, `TC-L4-063`, `TC-L5-053 (E)`.
- 429 mở phiên khách theo IP (SR-RL-03, 10 lần/phút): `TC-L7-004`, `TC-L7-010…015`.
- `TC-L7-013` thêm 2 lần không xong ở bước tải "ảnh" 25 MB (lần 1 hết giờ ca 30 giây; lần 2 treo 9,9 phút rồi `write EPIPE`, 18:47–18:57). 3 lần sau (19:19–19:21) cùng tệp 25 MB qua cả hai cách gửi đều trả `422 FILE_TOO_LARGE` trong 2–4 giây, ca đạt. **Chưa tái hiện được**, có thể do mạng phía máy QA. Đề nghị OPS xem log Caddy/api khung 18:45–19:00 cho `POST /v1/guest/online-checkin/documents` (body ~26 MB). Nếu thấy request treo phía máy chủ thì QA mở mã lỗi.

Nhật ký: thư mục scratchpad `qa-r6/` (mục 7): `api.log`, `rbac.log`, `rbac2.log`, `ui.log`, `re1.log`…`re5.log`, `smoke.log`, `logout.log`.

## 4. Ca không chạy được trên staging production image

Các ca này cần đồng hồ giả (`/__test__/clock`), reset giới hạn, SQL trực tiếp hoặc dừng PostgreSQL. Image production không có các thứ đó, nên **chạy trên stack CI, không chạy được trên staging production image**.

| Project / nhóm | Số ca | Dòng A | Bằng chứng CI |
|---|---|---|---|
| `clock` (16 tệp: hold-expiry, no-show, ota-rules, night-business-day, money-s4, refund-credit, late-fee-qr, guest-portal…) | 160 | A1, A2, A3, A5, A7 | push 39542016580 trên `e3f98d1` (1.981 đạt, 69 bỏ qua, 0 hỏng, 0 retry – `outputs/PO/s4-acceptance.md` R-1.4); push 39364680576 + T9 39462961483 + T9 39485554354 trên `21bb797` (`qc/round-qc-gate.md` mục A). Từ `21bb797` tới `4fd0651` không đổi `product/services`, `product/apps`, `product/packages` (`git diff --stat` rỗng; 18 tệp đổi là test, tài liệu, infra) |
| `desk-clock` (`ui-clock/`: **TC-X-070 A1 liền mạch**, TC-X-071, **TC-X-072 A4 liền mạch**, H16 trả phòng, axe K8…) | 53 | A1, A4 | như trên |
| `limits` (khóa tài khoản, cửa sổ IP) | 3 | A6 | như trên. Chạy trên staging sẽ khóa tài khoản `qa.*` 15 phút mà không reset được |
| `serial` (đổi tham số đang hiệu lực) | 5 | – | như trên. Không chạy để không đổi cấu hình staging lúc PO nghiệm thu |
| `db-outage` (dừng PostgreSQL) | 1 | B | như trên |
| Ca `api` cần SQL (`c3-at-rest` lưu trữ, `refund-credit` S4-06) | 3 | A5, A6 | như trên |
| Đối soát `a7-ds0` (DATA) | 114 dòng | A7 | `outputs/DATA/s4-a7-reconciliation.md` 8.7 trên `c293ceb` |

## 5. S4-15 – upload qua Caddy production thật

Chạy 22/10 18:37–19:21. Ảnh dùng PNG giả (nhiễu ngẫu nhiên) hoặc byte lặp, không ảnh thật.

| # | Ca | Kết quả | Thời gian |
|---|---|---|---|
| a | Ảnh 9,5 MB (dưới trần 10 MB/ảnh) → `attachments` | 201 (máy chủ lưu 2,27 MB sau xử lý) | 1,7 giây |
| b | Ảnh 11,4 MB (trên 10 MB, dưới 42 MB) → `attachments` | 422 `FILE_REJECTED / FILE_TOO_LARGE` | ~2 giây |
| c | Thân multipart 43 MB (> 42 MB) → `attachments` | 413 tại Caddy | – |
| d | JSON 1,2 MB tới route không phải upload (`POST guests`) | 413 tại Caddy | – |
| e | Tệp 25 MB (nhiễu và byte lặp) → `attachments` | 422 `FILE_TOO_LARGE` | 1,4 / 1,7 giây |
| f | Guest upload (`/v1/guest/online-checkin/documents`): ảnh nhỏ / 12 MB / 25 MB byte lặp / 25 MB nhiễu | 201 / 422 / 422 / 422 | 0,2 / 1,2 / 2,8 / 3,6 giây |
| g | Thực tế qua giao diện: ảnh giấy tờ khách (A1 chặng 5) và ảnh sau sửa (A4 bước 3) | 201 / 201 | – |

**S4-15 Đạt.** Kết luận S4-17 phần Caddy thật: Caddy chặn thân > 42 MB và route thường > 1 MB trước khi tới api. Lưu ý: 2 lần treo của `TC-L7-013` ở mục 3, chưa tái hiện được.

## 6. Chạy tay A1 và A4 trên staging (giờ thật)

### 6.1 A1 – phần 1 (chặng 1–5), 22/10 18:33, **Đạt**

Hai lượt dò trước lượt chính (18:31, 18:32) dừng vì **quy tắc kinh doanh đúng**, không phải lỗi:
- khách đến hôm nay thì không giữ chỗ được (lượt 1). Chỗ này lộ BUG-R2-219;
- thứ Sáu ở tối thiểu 2 đêm (lượt 2, M-A theo ESC-004). Chỗ này lộ BUG-R2-220.

Lượt chính: đến thứ Sáu 23/10, 2 đêm, 1 người lớn.

| # | Chặng | Ai | Kết quả | Ảnh |
|---|---|---|---|---|
| 1 | Báo giá: tìm căn trống 23/10, 2 đêm → báo giá căn 202 | `qa.fdsal`* | Đạt – tổng 1.822.000, cọc 500.000 | 001–003 |
| 2 | Giữ chỗ + VietQR cọc | `qa.fdsal`* | Đạt – `OTM-00239` hold, QR 500.000, nội dung `OTM00239`. Số tiền và nội dung in 2 lần (BUG-R2-216, thấy lại). Cảnh báo "Tài khoản nhận vừa đổi trong 24 giờ qua" hiện đúng | 004–005 |
| 3 | Xác nhận cọc = giao dịch QR | `qa.fd` | Đạt – `confirmed`, đã cọc 500.000, còn phải thu 1.322.000 | 006–008 |
| 4 | Tạo link check-in online | `qa.fd` | Đạt – link `g.staging…/g/…`, hết hạn 26/10 12:00. Token và QR đã che trên ảnh | 009 |
| 5 | Khách check-in online trên điện thoại (390×844) | khách | Đạt – thông báo dữ liệu, gửi ảnh CCCD giả qua Caddy thật (201), chọn giờ đến, đồng ý lưu ảnh (không chọn sẵn), "Thủ tục đã xong. Hẹn gặp bạn ngày 23/10" | 010–015 |

\* Vai sale dùng `qa.fdsal` (lễ tân kiêm sale), không dùng `qa.sal`: `qa.sal` vừa hết lượt tra khách 30 lần/giờ do bộ API chạy trước. Màn và quyền báo giá, giữ chỗ giống nhau; RBAC của `qa.sal` cho các thao tác này đã xanh ở mục 3.

### 6.2 A1 – phần 2 (chặng 6–7), 23/10 19:16, **Đạt**

Người chạy: ORC chạy script QA (`A1_PART=2`) trên staging, INV cho phép ORC đăng nhập `qa.fd` ngày 23/10 (QA là subagent, không nhập mật khẩu theo lời chuyển). Mật khẩu đọc từ tệp, không in. Kết quả 1 đạt / 0 hỏng (15,6 s).

| # | Chặng | Ai | Kết quả | Ảnh |
|---|---|---|---|---|
| 6 | Nhận phòng H13: giấy tờ khách gửi qua app → step-up → nhập số/họ tên/ngày sinh (giả) → `PATCH …/documents/:id` 200 → 1/1 → Kiểm tra → Khai báo sau → thu tiền mặt 1.322.000 cùng lệnh nhận phòng | `qa.fd` | Đạt – trước nhận phòng còn thu 1.322.000 (= 1.822.000 − cọc 500.000); sau đó `in_house` | 101–110 |
| 7 | Lưu trú: đơn Đang ở, folio; Sơ đồ phòng | `qa.fd` | Đạt – folio 1.822.000, đã thu 1.822.000, còn phải thu 0; căn 202 "OC · Có khách, sạch" ngày 23/10 | 111–112 |

Không lỗi mới. Ghi chú: setup E2E báo `/health` không phản hồi qua Desk (đúng thiết kế production, TC-X-050) nên bỏ đăng nhập trước; không ảnh hưởng ca.

### 6.3 A1 – phần 3 (chưa chạy)

| Phần | Chặng | Khi nào | Lệnh |
|---|---|---|---|
| 3 | 8–10 trả phòng 3 bước (minibar 2 bia, 1 snack, 2 nước) → bill → VietQR → ghi nhận → hoàn tất; 11 PWA dọn VD → CL → VC; 12 PWA kiểm → VI | **25/10** (chủ nhật, trước 12:00 để khỏi phụ thu trả muộn) | `A1_PART=3` |

Không ai được hủy hoặc sửa đơn `OTM-00239` (căn 202, 23–25/10) trước khi QA chạy xong phần 3. Mỗi phần ghi tiếp vào cùng thư mục bằng chứng. Kết quả sẽ bổ sung vào mục 6.2 của tệp này.

### 6.3 A4 – trọn chuỗi, 22/10 18:35, **Đạt**

| # | Bước | Ai | Kết quả | Ảnh |
|---|---|---|---|---|
| 1 | PWA báo sự cố căn 101 + ảnh + "Khóa căn" tới 24/10 | `qa.mt` | Đạt – phiếu `WO-00001`, khối khóa 22–24/10, căn `OOO` | 01–02 |
| 2 | Desk Bảo trì thấy phiếu và khối khóa; H12 không còn căn 101; sơ đồ phòng "OOO · Khóa phòng, đang sửa" | `qa.fd` | Đạt | 03–06 |
| 3 | PWA Nhận việc → Sửa xong (ghi việc đã làm + ảnh sau sửa, upload 201 qua Caddy) | `qa.mt` | Đạt – căn `VD` + việc "Dọn sau sửa chữa" | 07–09 |
| 4 | PWA buồng phòng Bắt đầu dọn → Dọn xong; lễ tân trưởng kiểm đủ checklist + ảnh → Kiểm đạt | `qa.hk`, `qa.fdl` | Đạt – VD → CL → VC → **VI** | 10–14 |
| 5 | Bán lại: H12 có lại căn 101; tạo đơn mới đêm 22/10 trên căn 101 (rồi hủy, dọn dữ liệu) | `qa.fd` | Đạt – 201 | 15 |

## 7. Bằng chứng (ngoài repo)

Thư mục gốc: `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/qa-r6/`. Scratchpad của phiên, không đưa vào git. Dữ liệu đều giả: khách "Nguyen Thi Ckeeal", CCCD ngẫu nhiên, ảnh 16×16. Ảnh và log không có mật khẩu.

- `a1/` – `run-log.md`, `screens/001…015`, `state.json` (mã đơn, căn – cho phần 2, 3), `video/03-khach-check-in-online.webm`.
  - Video của sale (chứa mã QR) và lễ tân (chứa link khách trước khi che) **đã xóa**, vì máy không có ffmpeg để che.
  - Phần 3 tắt video ở màn trả phòng (có VietQR).
- `a1-try1/`, `a1-try2/` – 2 lượt dò: ảnh 004 (BUG-R2-219) và 002 (BUG-R2-220).
- `a4/` – `run-log.md`, `screens/01…15`, `video/` (5 video PWA/Desk, không có QR hay link khách).
- `run-staging.sh` – chạy bộ test với đích staging (đọc mật khẩu từ tệp, không in). Phần A1 tiếp theo:
  `A1_NIGHTS=2 A1_SALE_USER=qa.fdsal A1_EVIDENCE=<qa-r6>/a1 A1_PART=2 <qa-r6>/run-staging.sh <qa-r6>/a1/pw-output-2 --project=desk-chromium e2e/ui/qa-a1-staging.spec.ts` (phần 3: `A1_PART=3`, thư mục `pw-output-3`).
- `src/product/tests/e2e/...` – bản chép test `4fd0651` cùng 4 tệp ca của lượt này và 4 tệp sửa (`*.orig` là bản gốc).

Che dữ liệu: ảnh 005, 007, 009 che QR; ảnh 009 che token link (`/g/••••••`). Ảnh guest-web không có thanh địa chỉ.

## 8. Dữ liệu lượt này để lại trên staging (đều giả)

PO, SEC cần biết trước khi nghiệm thu:
- Khoảng 240 đơn của bộ test (`OTM-00001…00238`, cộng các đơn sau A1), khách giả `e2e…@example.test`, vài tài khoản tạm `qa.e2e.*`, 1 phiếu sửa `WO-00001`, các ảnh giả. Ca có dọn dẹp thì đã hủy đơn của mình (`cleanupTracked`).
- **Tham số `payment_receiving_account` = tài khoản thử của bộ test** (BIN 970436, số `0123456789`, tên "OTTIMO TEST"), hiệu lực từ 22/10. Không có tham số này thì không tạo được VietQR cho A1.
  - Rủi ro: số này **có thể trùng tài khoản thật** của người khác ở ngân hàng đó.
  - Đề nghị: trước khi cho bất kỳ ai ngoài đội quét QR trên staging, PO/OPS đổi sang tài khoản INV chỉ định hoặc dừng dùng QR. QA không tự đổi.
  - Ca `TC-L4-065` ("chưa cấu hình tài khoản") đã chạy xanh **trước** khi đặt tham số. Nếu chạy lại hôm nay trên staging thì ca này sẽ đỏ, vì lý do dữ liệu.
- Phiên đăng nhập của bộ test: `rbac-logout` đã đăng xuất mọi tài khoản `qa.*` của bộ test lúc 19:21.

## 9. Lỗi mới (chi tiết; dòng tóm tắt trong `bug-list.md`)

### BUG-R2-219 – P3 – Hộp "Giữ chỗ" khi khách đến hôm nay vẫn hiện thời hạn giữ đã qua
- Môi trường: staging `sha-4fd0651b7be3`, Desk Chromium 1366×768, `qa.fdsal`, 22/10 18:31.
- Bước:
  1. H12 Báo giá & giữ chỗ, ngày đến = hôm nay, 1 đêm → Báo giá căn 202 → Lưu báo giá.
  2. Bấm "Giữ chỗ".
- Thực tế:
  - Thông báo "Khách đến hôm nay thì không giữ chỗ được. Thu tiền và tạo đơn ngay." hiện đúng, nút "Tạo giữ chỗ" bị khóa (đúng).
  - Nhưng hộp vẫn cho chọn "Giữ trong 12 h / 24 h / 48 h" và ghi "Hết hạn 12:00 22/10 – chưa cọc thì tự hủy, mở bán lại". Mốc này **đã qua** (lúc đó 18:31).
- Mong đợi: khi không được giữ chỗ thì ẩn bộ chọn thời hạn và dòng hết hạn, hoặc thay bằng hướng dẫn tạo đơn đã thu. Không hiện mốc giờ trong quá khứ.
- Bằng chứng: `a1-try1/screens/004-giu-cho-hop.png`.
- Vai: FE (+ UXD chữ). Trạng thái: Open.

### BUG-R2-220 – P3 – H12 liệt kê căn "Trống" và cho báo giá dù kỳ ở vi phạm ở tối thiểu
- Môi trường: như trên, 22/10 18:32.
- Bước: H12, ngày đến thứ Sáu 23/10, 1 đêm → Tìm kiếm → Báo giá căn 202 → chọn khách.
- Thực tế:
  - Danh sách hiện 6 căn "Trống", nút "Báo giá" bấm được.
  - Chỉ sau khi mở hộp và chọn khách mới hiện "Ngày này cần ở tối thiểu 2 đêm", nút "Lưu báo giá" bị khóa.
  - Quy tắc đúng (ESC-004 M-A), nhưng sale mất một vòng thao tác.
- Mong đợi: báo ngay ở kết quả tìm (ví dụ dòng "Thứ Sáu cần ở tối thiểu 2 đêm" và gợi ý đổi số đêm), hoặc khóa "Báo giá" kèm lý do. Nếu UXD cố ý để kiểm ở hộp thì đóng có lý do.
- Bằng chứng: `a1-try2/screens/002-bao-gia.png`.
- Vai: FE (+ UXD). Trạng thái: Open.

### BUG-R2-221 – P3 – Bộ test: ca SSE của RBAC Sprint 3 không chạy được với đích https
- Môi trường: bộ E2E `4fd0651`, đích staging https.
- Bước: chạy project `rbac` với `E2E_API_URL=https://…`.
- Thực tế: 9 ca `streamEvents` (RB-1904…1911, RB-1914) đỏ với `TypeError: Protocol "https:" not supported`. `rbac/rbac-sprint3.spec.ts` gọi `request` của `node:http` cho mọi URL.
- Mong đợi: chọn `node:https` khi URL là https.
  - Đã thử trên bản chép: 9/9 đạt. Máy chủ trả 200 `text/event-stream` cho 8 vai, 401 cho phiên khách.
- Bằng chứng: `rbac.log`, `rbac2.log`.
- Vai: QA. Trạng thái: Open (sửa trong repo ở đầu R3 cùng BUG-R2-222).

### BUG-R2-222 – P3 – Bộ test chưa chạy được trên staging/production image nếu không chỉnh tay
- Môi trường: như trên.
- Thực tế:
  - (1) `global-setup.ts`, `stackToday`, `stackNow`, `serverLocalTime` đọc giờ từ `GET /health`. Staging trả 404 từ Internet (theo thiết kế, SEC OPS-12), nên mọi ca của 23/26 tệp API và 9/11 tệp UI hỏng ở dòng đọc ngày và setup bỏ đăng nhập trước.
  - (2) Không có test-support thì gặp 429 đăng nhập, tra khách hay mở phiên khách là ca đỏ ngay (hoặc bỏ qua), không chờ `Retry-After`. Lượt staging phải chạy lại thủ công theo cửa sổ giới hạn.
- Mong đợi:
  - (1) Thêm tùy chọn `E2E_LOCAL_CLOCK=1`: lấy giờ máy chạy test, chỉ cho đích `CLOCK_MODE=system`. Global setup kiểm `POST /v1/auth/login` thay `/health`.
  - (2) Khi không có `TEST_SUPPORT_TOKEN`: chờ `Retry-After` (có trần), chạy tuần tự nhóm ca mở phiên khách, và chia lượt staging theo cửa sổ giới hạn.
  - Không đề nghị mở `/health` cho IP của QA (quyết định của SEC/OPS).
- Bằng chứng: `api.log` (lượt đầu không có bản sửa (1) chỉ chạy được 22 ca không đọc ngày), mục 2.
- Vai: QA. Trạng thái: Open.
