# SEC – Review hợp đồng OpenAPI 0.3.13-draft (ARC, PR #94)

Round 5 · bước **Review** · SEC · 06/11/2026

Đối tượng:
- PR #94, nhánh `r5-contract-0313`, commit `f4c40d9b` (cắt từ `main` @ `4a36180a`). 7 tệp:
  - `product/docs/api/openapi.yaml` (0.3.12 → 0.3.13-draft);
  - `product/services/api/src/generated/openapi-meta.ts`, `openapi-schemas.ts`;
  - `product/packages/api-client/src/generated/openapi.ts`;
  - `product/tests/fixtures/rbac-cases.json`, `rbac-cases.csv`;
  - `rounds/round-05/outputs/ARC/contract-0.3.13.md`.
- Báo cáo ARC: `rounds/round-05/outputs/ARC/report.md`.

SEC đối chiếu với:
- `product/docs/rbac-matrix.md` (S07, S24, A01, A02, A18, A19, A31, A50, A101; D12c, D25), `rbac-matrix.json` 0.2.7;
- `product/docs/security/security-requirements.md`: SR-AZ-01/02/04/09, SR-AUTH-09/11, SR-GST-06/11, SR-LOG-01…05, SR-AUD-01/03, SR-INP-01, SR-BAK-03, SR-DEV-07;
- `product/docs/security/data-risk-assessment.md` L7, T15, T16, T18;
- `rounds/round-04/reviews/SEC-on-bug-r4-054.md` (FB-R4-SEC-OPS-OR-04, 5 yêu cầu về log), `SEC-on-lp-v2-s6d.md` (V5-1A, ca 10);
- `business-rules.md` BR-012 (7), BR-101, BR-105 (8), BR-112, BR-432/433;
- mã `main`: `sales/internal/quote-pricing.ts` (dòng 142–150, 481–494), `guest-portal.service.ts` (dòng 142–155, 305–364, 845–859), `guest.controller.ts` (dòng 66–72, 141–148), `shared/secret-fields.ts`, `http.ts` (`REDACT_PATHS`), `folio-lines.service.ts` (dòng 508–580), `reservations/public/pricing.service.ts` (dòng 360–370), `db/schema/rooms.ts` (dòng 129, 143), `apps/mobile/public/sw.js`, `infra/docker-compose.prod.yml`, `infra/caddy/Caddyfile.prod`, `infra/server/bootstrap-vps.sh`.

SEC chỉ đọc repo và diff PR (`git show origin/r5-contract-0313:…`), không checkout bản làm việc chung. Không SSH, không gọi staging hay production. Tệp này không có mật khẩu Wi-Fi, tỷ lệ hoa hồng, bí mật hay dữ liệu khách.

---

## 0. Kết luận: **DUYỆT CÓ ĐIỀU KIỆN**

> **Đọc lại 06/11 khuya @ `2cb549cc`: DUYỆT để gộp** – xem mục 5. Bảng dưới là kết luận lần đầu (`f4c40d9b`).

0 Blocker · 4 Major · 4 Minor · 5 Suggestion.

| Điều kiện | Thẻ | Hạn |
|---|---|---|
| Sửa chữ hợp đồng: báo giá chỉ nhận kênh `direct`/`agent` như mã hiện nay; bỏ câu "đơn kênh Nội bộ theo BR-421" ở `QuoteInput.nightlyRates` | ARC-01 (Major) | **Trước khi gộp PR-0** |
| Thêm yêu cầu phía client cho ô Wi-Fi (chống trình duyệt tự điền mật khẩu đăng nhập) vào mô tả `setPropertyWifi` | ARC-04 (Major) | **Trước khi gộp PR-0** (FE-A cài ở PR V5-58) |
| Danh sách ca deny viết tay cho 3 ranh giới quyền mới, thứ tự 403 trước kiểm giá; BA thêm ghi chú A18, A50 | ARC-02 (Major) | Trước khi gộp PR-S1 và PR-A1 |
| V5-15: audit có số đêm không tính; bộ lọc "Trả phòng quá ngày đi" cho OWN (không migration) | ARC-03 (Major) | Trong PR-0, hoặc bổ sung hợp đồng trước khi gộp PR-A1 |
| V5-63: ngưỡng dưới của tuổi journal; Postgres `log_error_verbosity=terse` | ARC-07, ARC-08 (Minor, OPS làm) | Cùng PR OPS của V5-63, trước lần deploy đổi driver |

Giả định ARC cần SEC xác nhận:
- **G3** (`openRefunds` chỉ FD+, cả ở `Folio.totals`): **SEC xác nhận.** Xem mục 1 (2).
- **G4** (Wi-Fi qua hai operation riêng; FD không đọc): **SEC xác nhận phần bảo mật.** SEC không phản đối nếu DOM muốn cho FD đọc (ARC-10).
- **G6** (`QuoteInput.nightlyRates` chỉ FD+, kênh khác OTA): **SEC xác nhận có điều kiện ARC-01 và ARC-02.**

ESC mới: **không**. Câu hỏi pháp lý về thời hạn log (L7) đi vào danh sách luật sư sẵn có ở ESC-001 (ARC-14).

---

## 1. Bảng kiểm theo 8 trọng tâm ORC giao

### (1) Wi-Fi – `getPropertyWifi`, `setPropertyWifi` (V5-58)

| Điểm kiểm | Kết quả | Bằng chứng |
|---|---|---|
| Ai đọc | OWN, MGR, FDL. Khớp S24 (FDL = R). FD, HK, MT, SAL, CTV → 403; phiên khách → 401 | `openapi-meta.ts` `getPropertyWifi.roles`; RB-0837…0847 |
| Ai ghi | OWN, MGR. Khớp A101 và BR-012 (7) | `setPropertyWifi.roles`; RB-1948…1958 |
| Mật khẩu không vào audit | Đạt (theo hợp đồng) | Audit `property.wifi_changed` chỉ có `before.ssid`, `after.ssid`, `after.passwordChanged`. Mã hiện không có audit nào chép cả dòng `property` (không có `SELECT *` hay audit `property.*`) |
| Mật khẩu không vào log | Đạt | Khóa `password` nằm trong `SECRET_BODY_FIELDS`, bị che ở mọi độ sâu (`withoutSecrets`, `REDACT_PATHS`); SR-LOG-01 không log body |
| Không lưu phản hồi có mật khẩu | Đạt | `idempotencyKey: false`, nên bảng `idempotency_key` không giữ thân phản hồi |
| Phản hồi cho vai không có quyền | Đạt | Cổng vai chặn trước handler; 403/401 không có dữ liệu |
| Bộ nhớ đệm | GET `no-store`. PUT chưa ghi `no-store` | ARC-05 |
| Ghi vào cột trang khách đang đọc | Đúng cột. `wifiOf()` đọc dạng phẳng `{ssid, password}` trước | `guest-portal.service.ts` 845–859 |
| Trang khách lộ gì, cho ai | `ssid` + `password` cho **mọi người cầm link khách còn hiệu lực** (mức GST1, kể cả link bị chuyển tiếp), từ ngày nhận phòng nghiệp vụ hoặc khi đang ở, tới khi trả phòng. Link chỉ cấp cho đơn `confirmed`/`in_house`. Sau `checked_out`: `GUEST_STAY_ENDED`, không còn Wi-Fi (SR-GST-11). Phản hồi `getGuestStay` có `no-store`; guest-web không có service worker | `guest-portal.service.ts` 151, 305–313, 359–362; `guest.controller.ts` 143 |
| Hệ quả | Đổi mật khẩu thì mọi khách đang ở thấy mật khẩu mới ở lần tải sau. Không thu hồi theo từng khách. Mật khẩu Wi-Fi về thực chất là thông tin chung giữa các khách (C1) | ARC-10, ARC-11 |
| Rủi ro mới SEC thấy | Form "tên mạng + mật khẩu" trên Desk dễ bị trình duyệt tự điền tài khoản Desk đã lưu. Khi đó mật khẩu đăng nhập của nhân viên bị công bố lên trang khách | **ARC-04 (Major)** |

### (2) `openRefunds[]` chỉ FD+ (G3)

| Điểm kiểm | Kết quả |
|---|---|
| `Folio.totals.openRefunds` | `x-visible-to` FD+; serializer sinh `v: [owner, manager, front_desk_lead, front_desk]`. CTV (`own_totals_only`) và SAL đọc `getFolio` thì **vắng** trường |
| `CheckoutSummary.openRefunds` | Không có `x-visible-to`, nhưng `CheckoutSummary` chỉ dùng ở `getCheckoutSummary` (FD+). Cùng mẫu với `unhandledCreditVnd`. Không schema nào khác nhúng `CheckoutSummary` |
| Nội dung | Chỉ `reasonCode` + `openVnd` gom theo lý do. Không mã yêu cầu, không người tạo, không nơi nhận hoàn (D15 C3). Không cần nới `listApprovalRequests` |
| Kết luận | **Đạt.** Không thẻ |

### (3) `QuoteInput.nightlyRates` – giá gõ chỉ FD+ và kênh khác OTA (G6)

| Đường SAL/CTV có thể dùng để tự hạ giá | Kết quả |
|---|---|
| `calculateQuote` / `saveQuote` gửi `nightlyRates` | Hợp đồng ghi SAL/CTV → 403. Luật nằm trong mô tả, **không** ở `x-roles` (hai lệnh cho SAL/CTV). Bộ `rbac-cases` không phủ. Test ARC chỉ có SAL, chưa có CTV và `calculateQuote`. Chưa nói 403 phải đi trước kiểm sàn–trần → **ARC-02** |
| Lộ sàn–trần qua `RATE_OUT_OF_RANGE.min/max` (V5-22) | SAL/CTV hiện không đọc được sàn–trần ở đâu: chỉ có trong `CheckInPreview`, `ExtensionOptions`, `CheckoutSummary` (FD+), còn `rate_floor_pct` nằm ở S24. Nếu kiểm giá chạy trước kiểm vai thì `min`/`max` lộ cho SAL/CTV → **ARC-02 (d)** |
| Kênh Nội bộ qua báo giá | Mã hiện nay chỉ nhận `direct`/`agent` cho báo giá (`quote-pricing.ts` 142–150, BR-112). Hợp đồng mới ghi "kênh khác nhóm `ota`" và "đơn kênh Nội bộ theo BR-421 v0.5.3 như `createReservation`". Cài theo chữ thì mở đường báo giá Nội bộ: không sàn–trần, đêm trống = 0 đ, rồi `createHoldFromQuote` (SAL/CTV gọi được) → **ARC-01 (Major)** |
| `createHoldFromQuote` kèm trường giá | 422 `NOT_ALLOWED`, không ghi gì. **Đạt**, đóng đường SAL chèn giá |
| Sửa báo giá đã lưu | Không có `updateQuote`. SAL/CTV chỉ dùng báo giá của mình (`x-scope own`, `closerUserId` bị ép = chính mình ở `quote-pricing.ts` 153–159). **Đạt** |
| Đêm `edited = false` mang số khác giá lịch | Server ghi số như gửi và ghi nguồn `calendar`. Đây là đường của FD, không phải SAL. Nó làm giá tay trông như giá lịch → **ARC-06 (Minor)** |
| `createReservationGroup` (R3, chưa cài) | SAL/CTV gọi được, thân có `ReservationCreate.nightlyRates`. Chưa có route nên hiện trả 404. Khi cài phải áp cùng luật → ghi chú trong ARC-02 |

### (4) V5-15 – trả phòng đơn quá ngày đi chỉ OWN/MGR

| Điểm kiểm | Kết quả |
|---|---|
| FD/FDL → 403 trước thân lệnh, không ghi gì | Đạt theo hợp đồng (`checkOut` dòng 4020–4033). QR `check_out` của đơn quá ngày đi cũng chỉ OWN/MGR |
| `AllowedAction.overdue` chỉ cho OWN/MGR | Đạt |
| Ranh giới quyền máy đọc được | **Không**: `checkOut.x-roles` vẫn có FD, FDL. Bộ `rbac-cases` không phủ. Test ARC thiếu FDL và QR → **ARC-02** |
| Kiểm soát với chính MGR | Đường cũ của FD là B13 gia hạn rồi FOC 100 % (có duyệt, có hạn mức BR-433, cấm tự duyệt BR-432). Đường mới để **một mình MGR** bỏ N đêm: không người thứ hai, không thông báo, không "Cần chú ý", bộ lọc tuần V5-16 không bắt → **ARC-03 (Major)** |
| `overdueReason` (văn bản tự do) | D12c (C2). BE phải đi qua cùng hàm đọc chữ (`f.text`, có kiểm số thẻ V-09) như `checkoutTimeNote`. Ghi trong ARC-03 |
| Giữ đường cũ cho FD | Đúng: FD vẫn B13 rồi B18 thường, nên không bị kẹt lượt ở |

### (5) `Problem.lockReason` (V5-44)

| Điểm kiểm | Kết quả |
|---|---|
| Giá trị | Enum 4 giá trị, không id, không số tiền, không người. Mã hiện nay đã nói cùng ý trong `detail` (`folio-lines.service.ts` 519, 576–579) |
| Ai nhận `FOLIO_LOCKED` | FD+ ở `addFolioLine`, `adjustFolioLine`, `requestFoc`, `createRefundRequest`. SAL (phạm vi `own`/`own_deposit_only`) ở `confirmDeposit`, `recordPayment`. SAL chỉ thấy `closed`/`settled`/`post_checkout_window_over` của đơn mình, vốn đã thấy trạng thái đơn. `debt_reduction_requires_write_off` chỉ ra ở `adjustFolioLine` (FD+) |
| Thứ tự | Kiểm phạm vi (404 ngoài phạm vi, SR-AZ-02) đi trước 409, nên không dò được folio ngoài phạm vi |
| (b) trigger 0094 → 409 | Chỉ ánh xạ `23514` ở một lệnh, `check_violation` khác vẫn 500. Không che lỗi khác |
| Kết luận | **Đạt.** Không thẻ |

### (6) Bảng `rbac-cases` mới

| Điểm kiểm | Kết quả |
|---|---|
| Số ca mới | 22 = 2 operation × 11 chủ thể (8 vai đơn, 2 vai ghép, phiên khách). So hai bản sau khi bỏ cột id: **thêm đúng 22 dòng, không dòng nào đổi kỳ vọng hay mất** |
| Deny | `getPropertyWifi`: 7 × 403 + 1 × 401. `setPropertyWifi`: 9 × 403 + 1 × 401. Khớp S24 và A101; `rbacMismatchOps: []` |
| Operation mới thiếu ca | Không. 209 operation, mỗi operation 11 ca, 13 operation `skipped` (public/webhook) không đổi |
| Giới hạn của bộ ca | Bộ ca chỉ kiểm cổng vai. Ba ranh giới quyền mới của 0.3.13 không nằm ở `x-roles`, nên **không có ca nào** → ARC-02 |
| Đánh số | RB-id từ RB-0837 dịch +11, từ RB-1948 dịch +22. Cột `sprint` của hai operation mới là `R2` (mặc định của bộ sinh) → ARC-13 (Suggestion, truy vết) |

### (7) V5-63 – journald, `MaxRetentionSec=90day`, 0640, không vào sao lưu ngoài máy

Đối chiếu 5 yêu cầu của FB-R4-SEC-OPS-OR-04:

| Yêu cầu SEC | Thiết kế ARC | Kết quả |
|---|---|---|
| Giữ log qua lần dựng lại container | journald `Storage=persistent`, log ở máy chủ, không theo vòng đời container | Đạt |
| Trần cứng 90 ngày (T16, SR-LOG-05) | `MaxRetentionSec=90day` + `MaxFileSec=1day` (trễ ≤ 1 ngày); `ops-check` báo khi bản ghi cũ nhất > 91 ngày; rsyslog `/var/log/syslog` < 90 ngày hoặc `ForwardToSyslog=no` | Đạt trần trên. Trần dung lượng có thể xóa log **sớm** hơn 90 ngày khi bị dội log → ARC-07 |
| Không cho mọi user đọc | `root:systemd-journal`, 0640; OPS kiểm nhóm `adm`, `systemd-journal` | Đạt. Thêm nhóm `docker` vào danh sách kiểm (thành viên `docker` đọc được qua `docker logs`) – ghi trong ARC-07 |
| Không đổi cách che | Ứng dụng che khóa nhạy cảm; Caddy che `/g/*`, bỏ query string; Caddy ghi ra stdout nên cũng vào journal | Đạt. Log của **Postgres** không qua bộ che, và nay được giữ qua lần dựng lại → ARC-08 |
| Không vào sao lưu ngoài máy | `backup.sh` không đọc `/var/log/journal`; `pull-backups.sh` chỉ kéo thư mục sao lưu | Đạt. Snapshot của nhà cung cấp VPS (tắt hoặc ≤ 7 ngày, SR-BAK-03) có thể chứa journal thêm tối đa 7 ngày. Nằm trong T16 + T18, SEC chấp nhận |

Về dữ liệu cá nhân (Nghị định 13/2023, Luật BVDLCN 91/2025/QH15):
- Log kỹ thuật chứa dữ liệu cá nhân của nhân viên (user id, vai) và IP đã băm.
- Đội đã cài các biện pháp: mục đích ghi rõ (điều tra sự cố, T16), trần 90 ngày, quyền đọc hẹp, không bản sao ngoài máy, không C3.
- SEC **không** kết luận là đã tuân thủ. Còn một điểm mở: L7 (Nghị định 53/2022, nhật ký hệ thống có thể phải giữ tối thiểu 12 tháng nếu OTTIMO thuộc diện áp dụng). Nếu luật sư nói có áp dụng thì trần 90 ngày phải xem lại → ARC-14.

### (8) Đổi phá vỡ V5-1A (giá đêm bắt buộc)

| Điểm kiểm | Kết quả |
|---|---|
| Thiếu giá đêm | 422 `REQUIRED`, không ghi gì (`createRoom`, `updateRoom.listPrice`) |
| Giá 0 / null | `MoneyVnd` ≥ 1 ở hợp đồng; DB `nightly_list_price_vnd` NOT NULL + `CHECK > 0` (`rooms.ts` 129, 143). Không có đường ra 500 hay ghi 0 |
| Căn chưa có dòng giá | Báo giá và tạo đơn **đóng an toàn**: 422 `NOT_IN_LIST` (`quote-pricing.ts` 489–491, `pricing.service.ts` 363–368). Không ra đơn 0 đ |
| Bootstrap / nhập danh mục | Căn ngừng bán tới khi OWN nhập giá; `pricegap` tĩnh (V5-73) phải gộp trước BE-C. Đạt |
| Đường lỗi mới | Không thấy. Còn rủi ro gõ nhầm số (giá đêm 800 thay 800.000 vẫn qua ≥ 1, và kéo sàn–trần xuống theo) → ARC-12 (Suggestion) |
| Mâu thuẫn chữ | `info` của OpenAPI ghi "form tạo căn của Desk phải thêm ô giá đêm (FE-A)", còn 1.8 ghi "Desk không có màn tạo căn". `admin-web` không gọi `createRoom` → ARC-12 |

---

## 2. Thẻ feedback – ARC

### FB-R5-SEC-ARC-01
- Mức độ: Major
- Vị trí: `openapi.yaml` `QuoteInput.nightlyRates` (dòng 12267–12275); `contract-0.3.13.md` 1.3 ("kênh khác nhóm `ota`", "đơn Nội bộ theo BR-421 v0.5.3"); G6.
- Vấn đề:
  - Mã hiện nay chỉ nhận kênh `direct` và `agent` cho báo giá. Kênh khác → 422 `channelId NOT_IN_LIST` (`quote-pricing.ts` 142–150, BR-112).
  - Hợp đồng mới viết giới hạn là "kênh khác nhóm `ota`". Theo chữ, câu này **gồm cả `internal`**. Thêm câu "đơn kênh Nội bộ theo BR-421 v0.5.3 như `createReservation`".
  - Ở `createReservation`, kênh Nội bộ không áp sàn–trần, và đêm để trống = 0 đ, nguồn `complimentary` (`pricing.service.ts` 278–284, 359; BR-105 (8)).
  - BE cài theo chữ hợp đồng thì có đường mới: báo giá kênh Nội bộ → `saveQuote` chụp giá → `createHoldFromQuote` giữ chỗ và tính cọc theo giá chụp.
  - `saveQuote` và `createHoldFromQuote` cho cả SAL/CTV. Báo giá kênh Nội bộ **không** kèm `nightlyRates` không bị 403, nên SAL/CTV có thể ra giữ chỗ 0 đ hoặc dưới sàn nếu bộ tính giá dùng chung luật "đêm trống = 0" của Nội bộ.
- Vì sao quan trọng:
  - Sai tiền, và mở cho vai không được đặt giá (A31: SAL/CTV ✖).
  - BR-105 (8) chỉ cho đơn Nội bộ khi OWN/MGR đã đồng ý, và đi đường `createReservation` (A01, FD+), không qua báo giá.
  - Lỗi nằm ở chữ hợp đồng, nên phải sửa trước khi BE viết PR-S1.
- Đề xuất sửa:
  1. `QuoteInput.channelId` ghi rõ: báo giá chỉ nhận nhóm `direct`, `agent` (BR-112). `ota`, `internal` → 422 `VALIDATION_FAILED` (`channelId`, `NOT_IN_LIST`), như mã hiện nay.
  2. `QuoteInput.nightlyRates`: thay "kênh khác nhóm `ota`" bằng "chỉ kênh `direct`/`agent`". Bỏ câu "đơn kênh Nội bộ theo BR-421 v0.5.3". Ghi "luôn áp sàn–trần BR-105, không có đêm 0 đ".
  3. T14-4 thêm ca: kênh `internal` có và không có `nightlyRates` → 422. Thêm ca hồi quy: SAL `saveQuote` kênh `internal` → 422, không có báo giá.
- Trạng thái: Closed (SEC đọc lại PR #94 @ `2cb549cc`, 06/11 khuya – mục 5.1)

### FB-R5-SEC-ARC-02
- Mức độ: Major
- Vị trí: `checkOut` (dòng 4020–4033), `createVietQr.checkoutAt` (dòng ~6228), `QuoteInput.nightlyRates`; `contract-0.3.13.md` T14-3, T15-1, T15-7; `rbac-cases.*`; `rbac-matrix.md` A18, A50.
- Vấn đề: 0.3.13 thêm ba ranh giới quyền mới. Cả ba chỉ nằm trong mô tả, không ở `x-roles`:

  | Ranh giới | Vai bị chặn | Có trong `rbac-cases`? | Test ARC |
  |---|---|---|---|
  | B18 đơn quá ngày đi chỉ OWN/MGR | FD, FDL | Không (`checkOut.x-roles` có FD, FDL) | T15-1 chỉ FD. **Thiếu FDL** |
  | QR `check_out` đơn quá ngày đi chỉ OWN/MGR | FD, FDL | Không | **Không có** |
  | `nightlyRates` ở báo giá chỉ FD+ | SAL, CTV, vai ghép `front_desk+sales_staff` (lấy quyền cao hơn – cần nói rõ) | Không (`calculateQuote`/`saveQuote` cho SAL/CTV) | T14-3 chỉ SAL, không rõ lệnh. **Thiếu CTV và `calculateQuote`** |

  Thêm hai chỗ hở:
  - (d) Hợp đồng không nói thứ tự kiểm. V5-22 thêm `min`/`max` (sàn và trần) vào `RATE_OUT_OF_RANGE`. Nếu BE kiểm khoảng giá trước rồi mới kiểm vai, SAL/CTV gửi giá thấp sẽ nhận 422 có sàn–trần. Hiện SAL/CTV không có đường nào đọc số này.
  - (e) Bộ ca tự sinh (SR-AZ-09 lớp 1) chỉ kiểm cổng vai, nên ba ranh giới trên không có lưới tự động. Nếu một PR BE quên kiểm thì CI vẫn xanh.
- Vì sao quan trọng: cả ba đều chạm tiền (bỏ đêm, trần QR, giá tay). SR-AZ-01 đòi 403 kèm `audit_event access.denied` cho mọi lần từ chối quyền. Không có ca test thì QC không có bằng chứng.
- Đề xuất sửa:
  1. ARC ghi vào mô tả từng lệnh:
     - kiểm vai theo điều kiện **trước** mọi kiểm thân lệnh và mọi tính giá;
     - 403 `FORBIDDEN_ACTION` + `access.denied`, không có trường mở rộng nào (không `min`, `max`, `dates`).
  2. Bảng test ở `contract-0.3.13.md` thêm các ca:
     - FDL B18 quá ngày đi → 403;
     - FD và FDL `createVietQr purpose=check_out` trên đơn quá ngày đi → 403;
     - CTV `saveQuote` + `nightlyRates` → 403;
     - SAL và CTV `calculateQuote` + `nightlyRates` → 403;
     - SAL gửi `nightlyRates` **dưới sàn** → 403, thân không có `min`/`max`;
     - `access.denied` có cho từng ca.
  3. QA đưa các ca trên vào lớp 2 (viết tay) của SR-AZ-09.
  4. BA thêm ghi chú vào `rbac-matrix` để `gen_traceability` nối được test với dòng quyền:
     - A18: đơn quá ngày đi chỉ OWN/MGR (V5-15);
     - A50: báo giá kèm giá gõ chỉ FD+, theo A31.
  5. Khuyến nghị, ARC tự quyết: thêm phần mở rộng máy đọc được cho quyền ghi theo trường, ví dụ `x-write-roles` trên `QuoteInput.nightlyRates`. `gen_rbac_cases.py` khi đó sinh thêm ca "có trường → 403" cho vai ngoài danh sách. Ranh giới theo trạng thái (đơn quá ngày đi) vẫn viết tay.
  6. Ghi chú cho R3: khi cài `createReservationGroup` (SAL/CTV gọi được, thân có `ReservationCreate.nightlyRates`) phải áp cùng luật.
- Trạng thái: Closed (SEC đọc lại PR #94 @ `2cb549cc`, 06/11 khuya – mục 5.1)

### FB-R5-SEC-ARC-03
- Mức độ: Major
- Vị trí: `checkOut` V5-15 (dòng 4026–4033); `contract-0.3.13.md` 1.4 (mục "Vì sao chỉ OWN/MGR"), mục 3 (V5-15).
- Vấn đề:
  - Đường cũ cho đơn quá ngày đi là B13 gia hạn tới hôm nay, rồi `requestFoc special_discount` 100 % cho các đêm không ở. Đường này cần **người thứ hai** duyệt (BR-432, cấm tự duyệt), có **hạn mức** (BR-433) và xác nhận lại bằng mật khẩu (SR-AZ-07).
  - Đường mới để **một mình MGR** ghi ngày rời sớm hơn và bỏ N đêm. Không người thứ hai, không hạn mức, không thông báo, không "Cần chú ý" ("người làm đã là quản lý").
  - Bộ lọc tuần V5-16 (`removalsOnly`) không bắt được, vì không có `folio_line.adjusted` nào.
  - OWN chỉ thấy khi tự lọc `action=reservation.checked_out` rồi mở từng bản ghi.
  - Hợp đồng chọn OWN/MGR là đúng hướng, nhưng mới chặn được lễ tân. Rủi ro giấu tiền đêm ở thêm mà ARC nêu ở 1.4 vẫn còn ở cấp MGR.
- Vì sao quan trọng: chủ đầu tư không ở cơ sở hằng ngày. Đây là đường làm giảm doanh thu đã bán mà không có kiểm soát phát hiện. Mức Major, cùng mức với A31-01 (FD bỏ dòng, V5-16).
- Đề xuất sửa (không migration):
  1. Audit `reservation.checked_out` `after.overdue` thêm `nightsNotBilled`: số đêm giữa ngày đi của lượt và ngày nghiệp vụ lúc ghi. Chỉ là số nguyên, không số tiền, nên tập mã `money` không đổi.
  2. `listAuditEvents` thêm `overdueOnly` (boolean, lọc jsonb như `removalsOnly`). Desk có bộ lọc "Trả phòng quá ngày đi – tuần này" cạnh "Bỏ/giảm dòng – tuần này". OWN thấy mọi bản ghi, MGR thấy bản ghi của MGR khác. Test: T15-2 kiểm `nightsNotBilled`; thêm ca lọc `overdueOnly`.
  3. Chờ DOM chọn (đưa vào mục 3 cùng câu hỏi vai):
     - (a) `nightsNotBilled` > 1 thì chỉ OWN;
     - hoặc (b) MGR phải xác nhận lại bằng mật khẩu của chính mình (`reauth` như `approveRequest`, SR-AUTH-09), không migration.

     SEC nghiêng về (b): ít cản việc hơn, và mỗi lần đều ghi `authMethod`.
  4. `overdueReason` đi qua cùng hàm đọc chữ với `checkoutTimeNote` (`f.text`: bỏ ký tự điều khiển, kiểm số thẻ V-09). Không ghi họ tên khách vào lý do; Desk nhắc như ở D12c.
  5. Gợi ý cho FE/UXD, không bắt buộc ở v1.0.5: hộp "Trả phòng quá ngày đi" hiện các dấu hiệu sau ngày đi (yêu cầu từ trang khách, lần đếm minibar, kiểm phòng của HK) để MGR đối chiếu trước khi ghi.
- Trạng thái: Closed (SEC đọc lại PR #94 @ `2cb549cc`, 06/11 khuya – mục 5.1)

### FB-R5-SEC-ARC-04
- Mức độ: Major
- Vị trí: `setPropertyWifi` (dòng 1856–1888); `contract-0.3.13.md` 1.13; làn FE-A (màn Cấu hình), UXD.
- Vấn đề:
  - Màn đặt Wi-Fi có một ô chữ (tên mạng) đi liền một ô mật khẩu. Với trình duyệt, đây là hình dạng của **form đăng nhập**.
  - Trên máy hoặc điện thoại có lưu tài khoản `desk.ottimo.vn`, trình duyệt có thể tự điền tên đăng nhập vào ô tên mạng và mật khẩu Desk vào ô mật khẩu. Khi lưu, nó còn có thể hỏi "lưu mật khẩu" cho cặp này.
  - SR-DEV-07 cấm lưu mật khẩu ở máy quầy, nhưng OWN/MGR còn dùng điện thoại. Nếu người dùng bấm Lưu mà không để ý, `ssid` = tên đăng nhập vẫn qua được kiểm hiện có (1–32 ký tự, không có số căn).
  - Khi đó tên đăng nhập và mật khẩu Desk của OWN/MGR hiện cho **mọi người cầm link khách** (mức GST1, kể cả link bị chuyển tiếp) và được in lên thẻ trong căn.
- Vì sao quan trọng: lộ tài khoản quản trị có quyền tiền và cấu hình ra ngoài. Tài khoản có 2FA (ESC-031) thì giảm bớt nhưng không hết: tên đăng nhập vẫn lộ, và mật khẩu có thể đang dùng lại ở nơi khác.
- Đề xuất sửa:
  1. ARC ghi vào mô tả `setPropertyWifi` mục "Client":
     - ô mật khẩu Wi-Fi **không** là `type="password"`; dùng ô chữ có nút ẩn/hiện;
     - form và hai ô có `autocomplete="off"`;
     - `name`/`id` không chứa `user`, `login`, `password` (ví dụ `wifiNetworkName`, `wifiKey`);
     - không điền sẵn từ trình duyệt;
     - trước khi lưu có bước xác nhận "Khách sẽ thấy: tên mạng …, mật khẩu …".
  2. Server, ARC chọn, khuyến nghị cả hai:
     - (a) `ssid` trùng (không phân biệt hoa thường) một tên đăng nhập nhân viên của cơ sở → 422 `NOT_ALLOWED`;
     - (b) `password` trùng mật khẩu đăng nhập **của chính người gọi** → 422 `NOT_ALLOWED`. Cách làm: một lần argon2 verify trên hash của người gọi; không đếm vào khóa đăng nhập; không ghi log.

     (b) chỉ so với chính người gọi nên không thành kênh dò mật khẩu người khác, và không thuộc SR-AUTH-11.
  3. Test:
     - E2E Desk với trình duyệt có tài khoản đã lưu → hai ô vẫn trống;
     - unit (a), (b) → 422, không ghi `property`, không audit.
  4. Ảnh chụp sổ tay màn này chỉ dùng `<wifi-password>` (đúng như hợp đồng); QA kiểm che trước khi commit.
- Trạng thái: Closed (SEC đọc lại PR #94 @ `2cb549cc`, 06/11 khuya – mục 5.1)

### FB-R5-SEC-ARC-05
- Mức độ: Minor
- Vị trí: `setPropertyWifi`, `PropertyWifi`; `contract-0.3.13.md` T58-5, T58-6.
- Vấn đề:
  - T58-6 chỉ kiểm `no-store` ở GET. Phản hồi PUT cũng trả `password`, nhưng mô tả không ghi `no-store`.
  - Chưa có test 422 không lặp lại giá trị đã gửi. Ví dụ `password` 7 ký tự → `FieldError.message`/`detail` không được chứa chuỗi đó.
  - Hợp đồng không nói `setPropertyWifi` có phát sự kiện SSE hay không. Nếu có, sự kiện phải theo luật "chỉ loại + id" (rbac ghi chú 11).
  - `ssid` "1–32 ký tự": giới hạn của chuẩn Wi-Fi là 32 **byte** UTF-8. Tên có dấu tiếng Việt vượt 32 byte thì máy phát từ chối, và trang khách sẽ hiện tên khác với mạng thật (sai thông tin, không phải lỗ hổng).
- Vì sao quan trọng: thiếu `no-store` thì proxy hoặc bộ đệm trình duyệt có thể giữ mật khẩu. Lặp lại giá trị trong lỗi thì đưa mật khẩu vào ảnh chụp hoặc log phía client.
- Đề xuất sửa:
  - PUT `Cache-Control: no-store`; T58-6 kiểm cả hai lệnh;
  - T58-3 kiểm thân 422 không chứa giá trị thử;
  - ghi "không phát SSE", hoặc "SSE chỉ loại + id";
  - `ssid` tính theo byte UTF-8 (≤ 32).
- Trạng thái: Closed (SEC đọc lại PR #94 @ `2cb549cc`, 06/11 khuya – mục 5.1)

### FB-R5-SEC-ARC-06
- Mức độ: Minor
- Vị trí: `QuoteInput.nightlyRates` + `NightRate.edited`; `contract-0.3.13.md` 1.3.
- Vấn đề:
  - Theo `NightRate.edited`, đêm `edited = false` được server ghi đúng số gửi lên với nguồn `calendar` ("không so số").
  - Ở báo giá, server tự tính được giá lịch, nên không cần nhận số của client cho đêm không sửa.
  - Giữ nguyên luật B1 thì FD có thể gửi giá thấp với `edited = false`. Đơn khi đó không mang `bookingRateSource = manual_agreed` và không vào các báo cáo giá tay.
- Vì sao quan trọng: giá tay bị che thành giá lịch làm hỏng kiểm soát phát hiện (ví dụ hạ giá trên hệ thống, thu tiền mặt cao hơn). Mức thiệt hại có trần là sàn BR-105, nên để Minor.
- Đề xuất sửa: ở `calculateQuote`/`saveQuote`, phần tử `edited` = `false` hoặc vắng thì server dùng giá lịch của chính nó và bỏ `amountVnd`, hoặc trả 422 `NOT_ALLOWED` khi số khác giá lịch. Chỉ phần tử `edited = true` mang giá của client. Thêm test T14-7. Luật B1 của `createReservation` giữ nguyên ở bản này; SEC sẽ nêu ở review B1 sau.
- Trạng thái: Closed (SEC đọc lại PR #94 @ `2cb549cc`, 06/11 khuya – mục 5.1)

### FB-R5-SEC-ARC-07
- Mức độ: Minor
- Vị trí: `contract-0.3.13.md` 1.15 (cấu hình `50-ottimo.conf`, `ops-check.sh`); làn OPS.
- Vấn đề:
  - `SystemMaxUse` là trần dung lượng chung cho journal của production, staging và hệ điều hành. Khi chạm trần, journald xóa tệp **cũ nhất** trước 90 ngày.
  - Kẻ dò có thể dội request rác (Caddy ghi mỗi request) để đẩy log cũ ra khỏi đĩa, xóa dấu vết lần dò trước.
  - `RateLimitBurst` tương tự: khi chạm ngưỡng, journald bỏ dòng và chỉ ghi "Suppressed N messages".
  - `ops-check` của ARC chỉ kiểm trần trên (bản ghi cũ nhất ≤ 91 ngày), không kiểm việc xoay **sớm**.
  - Danh sách nhóm cần kiểm chưa có `docker`: thành viên nhóm này đọc được log qua `docker logs`.
- Vì sao quan trọng: điều tra sự cố là lý do chính của V5-63 (OR-04). Log bị xóa sớm mà không ai biết thì mất đúng thứ cần giữ.
- Đề xuất sửa:
  1. OPS đo dung lượng journal thật sau 7 ngày rồi đặt `SystemMaxUse` ≥ 3 lần lượng 90 ngày ước tính. Ghi số vào `hosting-plan.md`.
  2. `ops-check` thêm ngưỡng dưới: tuổi bản ghi cũ nhất < min(90 ngày, số ngày từ lúc đổi driver) − 1 → WARN "journal xoay sớm vì dung lượng".
  3. `ops-check` đếm dòng "Suppressed" của journald trong 24 giờ; > 0 thì WARN.
  4. Kiểm nhóm gồm `adm`, `systemd-journal` **và `docker`**.
- Trạng thái: Closed phần mã (SEC đọc lại PR #93 @ `b1354a4f`, 06/11, `SEC-on-ops-prs-92-93-95.md` mục 3) – ý 2–4 Done; ý 1 Deferred tới 7 ngày sau W6 production (OPS). Có hiệu lực khi W6 + W7 ok. Chỗ hở WARN dính chuyển sang FB-R5-SEC-OPS-93-01
- Phản hồi OPS: Làm trong PR #93 (nhánh `r5-ops`, commit `b1354a4f`), cùng với V5-63 (driver `journald`, `server/journald/50-ottimo.conf`).
  1. `SystemMaxUse=4G` là số đầu (đĩa ≥ 40 GB, đang dùng 18 %). `SystemKeepFree=8G`. `ForwardToSyslog=no`, nên chỉ có một bản, một trần.
     - Runbook v1.0.5 W6 bước 1 ghi `journalctl --disk-usage` làm mốc. Sau 7 ngày OPS đặt `SystemMaxUse` ≥ 3 lần lượng 90 ngày và ghi số vào `hosting-plan.md` mục 7 (đang để [GIẢ ĐỊNH]).
     - Deferred, vì cần số đo thật sau khi đổi driver.
  2. `ops-check journal` WARN khi bản ghi cũ nhất trẻ hơn min(90, số ngày từ `state/journald_since`) − 1. Bootstrap và W6 bước 2 ghi tệp ngày này.
     - `notify` có thêm trạng thái WARN: ghi journal mức warning, gửi webhook một lần khi đổi trạng thái, không nhắc 6 giờ, lượt kiểm vẫn đạt, Healthchecks không báo fail.
     - Thiếu `journald_since` cũng là WARN.
  3. Đếm dòng `Suppressed …` của `systemd-journald` trong 24 giờ, > 0 thì WARN. `RateLimitBurst=20000`/30 s, vì mọi container chung nguồn `docker.service`.
  4. Kiểm nhóm `adm`, `systemd-journal` và `docker`:
     - tính cả thành viên theo nhóm chính (`/etc/passwd`);
     - `adm` và `systemd-journal` chỉ cho `LOG_READER_USERS` (`.env`, mặc định `syslog ottimo-admin`); `docker` chỉ cho `ottimo`;
     - tin chỉ có số người lạ, không in tên.
  - Thêm (ngoài thẻ):
    - FAIL khi có container chưa sang journald, khi không đọc được journal, khi bản ghi cũ nhất > 91 ngày, khi `/var/log/journal` không phải `root:systemd-journal` hoặc có tệp ai cũng đọc được.
    - Đọc journal bằng `SupplementaryGroups=systemd-journal` trên unit ops-check. User `ottimo` không vào nhóm, nên phép kiểm nhóm ở ý 4 vẫn sạch.
  - Test: `server/test/ops-check-journal.test.sh` 30 passed, 0 failed (trên mã `main`: 36 FAIL), có trong CI.

### FB-R5-SEC-ARC-08
- Mức độ: Minor
- Vị trí: `infra/docker-compose.prod.yml` service `postgres` (dòng 124–153, không có `command`); `contract-0.3.13.md` 1.15 "Giữ nguyên cách che".
- Vấn đề:
  - Postgres chạy với `log_error_verbosity` mặc định, nên dòng lỗi của chính máy chủ DB có phần DETAIL:
    - CHECK/NOT NULL ghi "Failing row contains (…)", tức cả dòng dữ liệu;
    - unique ghi "Key (cột)=(giá trị) already exists".
  - Log này đi thẳng ra stderr của container, **không** qua bộ che của ứng dụng (SR-LOG-04). Dữ liệu C2 (họ tên, điện thoại, email) có thể lọt vào.
  - Với driver `local`, log bị cắt theo dung lượng. Với journald, log được giữ qua lần dựng lại, tới 90 ngày, và còn bản chép ở `/var/log/syslog`.
  - Lỗi có từ trước V5-63. V5-63 không gây ra, nhưng là PR đổi cách giữ log, nên sửa ở đây là hợp.
  - `02-roles.sh` đã hạ `log_min_error_statement` quanh lệnh đặt mật khẩu, tức đội đã biết lối lộ này.
- Vì sao quan trọng: SR-LOG-05 (log kỹ thuật không chứa C3, che C2) và T16.
- Đề xuất sửa:
  - service `postgres` thêm `command: ['postgres', '-c', 'log_error_verbosity=terse']`. `terse` bỏ DETAIL, HINT, QUERY, CONTEXT, vẫn giữ mã lỗi và câu lỗi;
  - giữ `log_parameter_max_length_on_error` = 0 (mặc định);
  - test trên DB thử ở CI: gây một vi phạm unique có email giả → dòng log Postgres không chứa email đó.
- Trạng thái: Closed phần mã (SEC đọc lại PR #93 @ `b1354a4f`, 06/11). SEC quyết không bắt `log_min_error_statement=panic`, kèm FB-R5-SEC-OPS-93-03 và 95-05 (b) (`SEC-on-ops-prs-92-93-95.md` mục 1.1)
- Phản hồi OPS: PR #93, commit `b1354a4f`. Service `postgres` có `command: ['postgres', '-c', 'log_error_verbosity=terse']`. `log_parameter_max_length_on_error` giữ mặc định 0.
  - Test `server/test/postgres-log-terse.test.sh` (7 passed, 0 failed, có trong CI):
    - dựng Postgres theo đúng image và `command` đọc từ compose;
    - gây lỗi unique, CHECK, NOT NULL bằng tham số bind (extended protocol, như api);
    - log có mã và câu lỗi, không có email, số điện thoại hay `DETAIL`;
    - lượt đối chứng không có setting phải lộ email và "Failing row", nên test chứng minh được chỗ rò.
  - Có hiệu lực khi container Postgres được dựng lại: runbook v1.0.5 W6 bước 4, kiểm `SHOW log_error_verbosity` = `terse`.
  - Còn lại, nhờ SEC xét:
    - (a) câu lỗi chính vẫn có thể chứa giá trị, ví dụ `invalid input syntax for type uuid: "…"`. Api kiểm đầu vào trước khi gửi DB, nên ca này hiếm.
    - (b) dòng `STATEMENT` (`log_min_error_statement`, mặc định ERROR) in nguyên văn câu SQL. Với câu có tham số thì chỉ thấy `$1`. Câu SQL viết thẳng giá trị (psql tay) thì lộ. Runbook chỉ chạy câu đếm READ ONLY.
    - Muốn chặn hẳn thì thêm `-c log_min_error_statement=panic`. Đánh đổi: mất câu SQL khi gỡ lỗi. OPS chưa thêm, chờ SEC quyết.

### FB-R5-SEC-ARC-09
- Mức độ: Suggestion
- Vị trí: `contract-0.3.13.md` 1.14, G7.
- Vấn đề: ARC viết "03:30 + 15:30". `plan.md` V5-62 (OPS 06/11, PR #93) đã chốt production 03:00 + 15:00, staging 03:30 + 15:30, mỗi khoảng 12 giờ.
- Vì sao quan trọng: câu RPO trình chủ đầu tư và SR-BAK-01 phải theo một nguồn.
- Đề xuất sửa: sửa 1.14 và G7 theo dòng V5-62 của plan, hoặc trỏ sang đó. SEC sửa SR-BAK-01 khi bản lên, như ARC ghi.
- Trạng thái: Open – phần xác nhận của OPS đã xong; chờ ARC sửa 1.14 và G7 trong `contract-0.3.13.md`
- Phản hồi OPS (xác nhận theo repo, không SSH): đúng như SEC ghi.
  - Production chạy `ottimo-backup@ottimo-prod.timer` (tệp `ottimo-backup@.timer`), lượt đầu 03:00. Staging chạy `ottimo-backup.timer`, lượt đầu 03:30. Nguồn:
    - `bootstrap-vps.sh` mục 7: production bật `ottimo-backup@$stack.timer`, staging bật `ottimo-backup.timer`;
    - OPS kiểm chỉ đọc 06/11 (`ops-readiness-06-11.md` dòng 27, 38–39): 4 timer bật, production chạy timer lúc 03:05, staging lúc 03:33;
    - tệp `db-20261106T070832Z` trên Mac là bản chạy tay trước LP-v2, không phải lượt timer.
  - Mỗi môi trường có đúng một timer sao lưu, không timer nào thừa.
  - PR #93 đặt production 03:00 + 15:00, staging 03:30 + 15:30, mỗi khoảng 12 giờ. Mô tả PR #93 có mục "Lượt đầu là 03:00 hay 03:30?". Dòng V5-62 trong `plan.md` đã sửa (`c224f0e8`).
  - 15:30 của ARC đúng cho staging, vì ARC tính từ tệp staging. Mục "Việc của OPS" ở 1.14 chỉ nêu `ottimo-backup.timer`, nên ARC thêm `ottimo-backup@.timer` (production) khi sửa 1.14.

### FB-R5-SEC-ARC-10
- Mức độ: Suggestion
- Vị trí: G4; `contract-0.3.13.md` 1.13 "FD không đọc được", mục 3 dòng V5-58 (phụ).
- Vấn đề: SEC xác nhận phần bảo mật của G4: operation riêng, không qua tham số, mật khẩu không vào audit hay log. Còn việc không cho FD đọc thì không tăng bảo vệ:
  - mật khẩu Wi-Fi thuộc C1;
  - mức GST1 (chỉ cần link) đã thấy;
  - mật khẩu in trên thẻ trong căn.
- Vì sao quan trọng: tránh để DOM hiểu nhầm đây là yêu cầu của SEC. Lễ tân thường là người báo Wi-Fi cho khách tại quầy.
- Đề xuất sửa: DOM quyết theo vận hành. Nếu cho FD đọc thì giữ `no-store`, không log; BA thêm dòng rbac; ARC thêm vai.
- Trạng thái: Closed (SEC đọc lại PR #94 @ `2cb549cc`, 06/11 khuya – mục 5.1)

### FB-R5-SEC-ARC-11
- Mức độ: Suggestion
- Vị trí: BR-012 (7) (một mạng chung, ESC-022 B); `contract-0.3.13.md` 1.13; ngoài hợp đồng (OPS, INV).
- Vấn đề:
  - Từ v1.0.5, mật khẩu thật đi tới mọi người cầm link khách còn hiệu lực, kể cả link bị chuyển tiếp.
  - Đổi mật khẩu chỉ thay cho mọi khách cùng lúc, không thu hồi được theo từng khách.
  - Nếu máy quầy (thiết bị được cấp, xem C3), bộ điều khiển khóa cửa, camera hay trang quản trị bộ phát nằm chung mạng này, mọi khách đều đứng chung mạng nội bộ với các thiết bị đó.
- Vì sao quan trọng: TM-46 (máy quầy), TM-38/39 (khóa cửa).
- Đề xuất sửa: không đổi hợp đồng. Việc cho INV/OPS:
  - mạng khách tách khỏi mạng thiết bị nội bộ;
  - bật cách ly máy khách (client isolation);
  - mật khẩu quản trị bộ phát khác mật khẩu Wi-Fi.

  SEC sẽ thêm thành yêu cầu SR-NET-01, kèm vào checklist SR-DEV-07, ở bước Phản hồi & sửa của SEC.
- Trạng thái: Open

### FB-R5-SEC-ARC-12
- Mức độ: Suggestion
- Vị trí: `RoomInput.nightlyListPriceVnd`, `RoomPatch.listPrice`; mục `info` "Thay đổi phiên bản 0.3.13-draft" đoạn đầu; `contract-0.3.13.md` 1.8.
- Vấn đề:
  - Bỏ đường "giá tháng ÷ 12" là đúng. Từ nay giá đêm luôn do người gõ.
  - Gõ thiếu ba số 0 (800 thay 800.000) vẫn qua `MoneyVnd` ≥ 1. Sàn–trần (`rate_floor_pct`) tính theo giá nền nên tụt theo, và giá sai hiện lên web cùng Desk.
  - Mục `info` ghi "form tạo căn của Desk phải thêm ô giá đêm (FE-A)", trong khi 1.8 ghi Desk không có màn tạo căn. `admin-web` thật không gọi `createRoom`.
- Vì sao quan trọng: sai tiền do gõ nhầm. Hai câu mâu thuẫn làm FE-A tìm một màn không tồn tại.
- Đề xuất sửa:
  - Cảnh báo, không chặn (BR-101 (1) giữ hai giá độc lập): khi giá đêm nằm ngoài một khoảng so với giá tháng, Desk đòi lý do. DOM đặt khoảng, ví dụ < giá tháng/60 hoặc > giá tháng/3. Có thể dùng mẫu `*_WARNING` + lý do như `RATE_OUT_OF_RANGE_WARNING`.
  - Sửa câu `info` theo 1.8.
- Trạng thái: Closed (SEC đọc lại PR #94 @ `2cb549cc`, 06/11 khuya – mục 5.1)

### FB-R5-SEC-ARC-13
- Mức độ: Suggestion
- Vị trí: `product/tests/tools/gen_rbac_cases.py` (dòng 59, 100, 130); `rbac-cases.*`.
- Vấn đề:
  - RB-id đánh số liền theo thứ tự `operationId`, nên mỗi operation mới làm dịch mọi id phía sau. Lần này từ RB-0837 dịch +11, từ RB-1948 dịch +22.
  - Tài liệu cũ đang trỏ vào id (bug-list R2: RB-0387, RB-1784, RB-1792; `s4-be-c.md`: RB-0969). Các id này nay chỉ sang ca khác.
  - Cột `sprint` của operation không có `x-round` mặc định là `R2`, kể cả hai operation của R5.
- Vì sao quan trọng: truy vết test → quyền. Không phải lỗ hổng.
- Đề xuất sửa: ARC/QA chọn một trong hai:
  - id ổn định, ví dụ `RB-<operationId>-<subject>`;
  - giữ tệp ánh xạ id cũ → mới qua mỗi lần sinh.

  Hai operation mới ghi `x-round: R5`, hoặc bộ sinh lấy round từ ghi chú phiên bản.
- Trạng thái: Closed (SEC đọc lại PR #94 @ `2cb549cc`, 06/11 khuya – mục 5.1)

### FB-R5-SEC-ARC-14
- Mức độ: Suggestion
- Vị trí: V5-63; `data-risk-assessment.md` L7, T15, T16; ESC-001.
- Vấn đề: trần 90 ngày của log kỹ thuật khớp T16 và SR-LOG-05. DRA còn để mở L7: Nghị định 53/2022 có thể đòi giữ nhật ký hệ thống tối thiểu 12 tháng với một số loại doanh nghiệp, "chưa xác minh" phạm vi cho OTTIMO. Audit ứng dụng giữ 24 tháng (T15), nhưng chưa rõ luật tính "nhật ký hệ thống" là audit hay log kỹ thuật.
- Vì sao quan trọng: nếu L7 áp dụng cho log kỹ thuật thì trần cứng 90 ngày phải đổi. SEC không tự kết luận pháp lý.
- Đề xuất sửa: ORC thêm câu L7 vào danh sách hỏi luật sư của ESC-001 (đã quyết A, thuê luật sư), không tạo ESC mới. Câu hỏi: "Log kỹ thuật 90 ngày + audit thao tác 24 tháng có đủ theo NĐ 53/2022 và Luật BVDLCN 91/2025 không?". V5-63 vẫn lên với 90 ngày.
- Trạng thái: Open

---

## 3. Điểm làm tốt (nên giữ)

- `openRefunds` gom theo lý do, không mã yêu cầu hay người tạo. Cách này vừa đủ cho lễ tân, không phải nới phạm vi `listApprovalRequests`. `x-visible-to` ở `Folio.totals` sinh đúng vào serializer.
- `createHoldFromQuote` từ chối trường giá bằng 422 thay vì âm thầm bỏ qua. Đây là cách đóng đường chèn giá rõ ràng nhất cho SAL/CTV, và đúng cam kết PR75-01.
- Wi-Fi tách operation riêng, audit chỉ `ssid` + `passwordChanged`, không idempotency, `no-store`, chỉ dùng chuỗi `<wifi-password>`. Khóa `password` lại trùng danh sách che sẵn có, nên không phải thêm luật che mới.

---

## 4. Dòng decision-log đề xuất (ORC ghi)

`| 2026-11-06 | 5 | **SEC – review hợp đồng OpenAPI 0.3.13-draft (PR #94, f4c40d9b): DUYỆT CÓ ĐIỀU KIỆN** (rounds/round-05/reviews/SEC-on-contract-0.3.13.md). 0 Blocker, 4 Major, 4 Minor, 5 Suggestion. Trước khi gộp PR-0: ARC-01 (báo giá chỉ kênh direct/agent, bỏ câu Nội bộ ở QuoteInput.nightlyRates), ARC-04 (ô Wi-Fi chống trình duyệt tự điền tài khoản Desk; tùy chọn server chặn ssid = tên đăng nhập, password = mật khẩu người gọi). Trước PR-S1/PR-A1: ARC-02 (ca deny viết tay FDL B18 quá ngày đi, FD/FDL QR check_out quá ngày đi, SAL/CTV × calculateQuote/saveQuote nightlyRates; 403 trước kiểm giá, không lộ min/max; BA ghi chú A18, A50), ARC-03 (audit nightsNotBilled + lọc overdueOnly cho OWN; DOM chọn trần đêm hoặc MGR xác nhận lại mật khẩu). OPS trong PR V5-63: ARC-07 (ngưỡng dưới tuổi journal, đếm Suppressed, kiểm nhóm docker), ARC-08 (Postgres log_error_verbosity=terse). Xác nhận G3; G4 phần bảo mật (SEC không phản đối FD đọc Wi-Fi – C1); G6 kèm ARC-01/02; V5-63 đạt 5 yêu cầu OR-04; V5-1A không mở đường lỗi (NOT NULL + CHECK > 0 + đóng an toàn khi thiếu dòng giá); lockReason không lộ thông tin nội bộ; rbac-cases +22 ca đủ deny. Không ESC mới; L7 vào danh sách luật sư ESC-001 | SEC | Quyền SEC (mức rủi ro, yêu cầu bảo mật kỹ thuật) |`

---

## 5. Đọc lại 06/11 khuya – PR #94 @ `2cb549cc`

Round 5 · bước **Review (đọc lại)** · SEC · 06/11/2026

Đối tượng:
- `gh pr diff 94`, HEAD `2cb549cc`. CI run `42239136222` (`pull_request`) đã chạy xong, xanh, trên đúng SHA này.
- `rounds/round-05/responses/ARC-on-contract-0.3.13-reviews.md` (trên nhánh).
- `rounds/round-05/outputs/ARC/contract-0.3.13.md` (trên nhánh): bổ sung 1/1b/1c, mục 1.16–1.24, 3, 4, 6.

SEC đối chiếu với:
- `rounds/round-05/reviews/SEC-on-bug-r5-002.md`: V5-48, S1–S8, mục 4;
- DOM `rules-v1.0.5.md` 11.4 (`e9e0e2e4`, `5ad26fc1`);
- BA `rbac-matrix.md` 0.2.8 (`4bb9e68d`);
- mã `main`:
  - `payments.service.ts` (`scopedReservation`, `record`, `confirmReceived`);
  - `attachment.service.ts` (`bindTo`, `purgeDue`);
  - `registration.service.ts` (`scheduleAfterStay`, `scheduleRetention`, mốc `penalty_evidence`);
  - các chỗ dùng `pg_advisory_xact_lock`.

Cách làm: chỉ đọc. Không checkout nhánh vào bản làm việc chung, không chạy stack, không SSH. Không approve, không comment trên GitHub.

### 5.0 Kết luận: **DUYỆT để gộp**

- **Không có điều kiện trước khi gộp PR-0.** Đọc lại có 0 Blocker, 0 Major mới.
- **Thẻ mới:** 3 Minor (ARC-15, 16, 17) và 2 Suggestion (ARC-18, BA-19). Hạn của các thẻ này rơi vào PR sau (PR-B1, PR-B3, 0.3.14, BA), không chặn gộp.
- **Thẻ cũ:**
  - Đóng: ARC-01, 02, 03, 04, 05, 06, 09, 10, 12, 13.
  - Còn mở:
    - ARC-07 ý 1 (Deferred, OPS đo journal 7 ngày sau W6);
    - ARC-11 (SEC viết SR-NET-01; INV/OPS tách mạng khách);
    - ARC-14 (ORC thêm câu L7 vào danh sách luật sư ESC-001).
- **BUG-R5-002 (mục 1.21):** khớp V5-48 và S1–S8. 5B-2 khớp mục 4 của `SEC-on-bug-r5-002.md`.
- **G15:** SEC **không** cần ràng ở DB cho v1.0.5. Khóa tư vấn được chấp nhận, kèm 5 điều kiện ở 5.3 (giao cho BE ở thẻ ARC-15).
- **Mốc `actual_checkout_at`:** SEC xác nhận (5.4).
- **Delta chỉ đổi tài liệu** (G9 thành giá tháng ÷ 5, bỏ các dòng "chờ DOM"): SEC chấp nhận gộp mà không đọc lại, nếu delta nằm trong phạm vi ở 5.6.
- ESC mới: không.

### 5.1 Thẻ cũ

| Thẻ | Mức | ARC làm gì | SEC đọc lại | Trạng thái |
|---|---|---|---|---|
| ARC-01 | Major | Báo giá chỉ nhận kênh `direct`/`agent`. `ota`, `internal`, kênh ngừng → 422 `NOT_IN_LIST`. Bỏ câu Nội bộ BR-421 | Đúng ở `QuoteInput.channelId`, `QuoteInput.nightlyRates`, `saveQuote`. T14-8, T14-9 phủ cả SAL `saveQuote` kênh `internal` | **Closed** |
| ARC-02 | Major | `x-write-roles`, 21 `fieldCases`, ca viết tay H-01…H-09 | Thứ tự (Idempotency → `x-roles` → `x-write-roles` → thân lệnh → giá) và 403 không trường mở rộng đã ghi ở cả `calculateQuote`, `saveQuote`, `createReservationGroup`. `openapi-meta.ts` có `writeRoles` ở cả 3 operation. `fieldCases` có 6 ca 403 = SAL, CTV × 3 operation. BA đã thêm ghi chú 46a/46b | **Closed**. Ghi chú 46a của BA cần sửa theo trần đêm mới (thẻ BA-19) |
| ARC-03 | Major | DOM chọn (a): MGR ≤ 1 đêm, từ 2 đêm chỉ OWN. Thêm `nightsNotBilled`, `overdueOnly`; `overdueReason` qua bộ đọc D12c | Đủ ý 1, 2, 4. Ý 3 theo lựa chọn (a) của DOM, là một trong hai phương án SEC nêu. Đường một mình MGR nay chỉ còn 1 đêm, và OWN thấy qua `overdueOnly` | **Closed** |
| ARC-04 | Major | Luật phía client và hai chặn ở máy chủ | Đủ cả 5 ý phía client. Máy chủ chặn `ssid` trùng tên đăng nhập (kể cả tài khoản đã khóa) và mật khẩu trùng mật khẩu người gọi (argon2 một lần, không đếm khóa, không log). T58-9, T58-10 | **Closed**. FE-A làm T58-10 ở PR V5-58 |
| ARC-05 | Minor | `no-store` cả PUT; giới hạn byte; lỗi không lặp lại giá trị; không SSE | Đủ. PUT không trả `password`, chỉ trả `passwordSet` | **Closed** |
| ARC-06 | Minor | Đêm có `edited` ≠ `true` dùng giá lịch của máy chủ | Đúng cho báo giá (T14-11). B1 khác có chủ đích ở bản này | **Closed**. SEC muốn B1 theo cùng luật ở 0.3.14 (thẻ ARC-18) |
| ARC-09 | Suggestion | Sửa 1.14, G7, mục 0 và mục 8 | 1.14 có đủ hai tệp timer và giờ 03:00 + 15:00 (production), 03:30 + 15:30 (staging); G7 khớp plan V5-62 | **Closed**. Dòng trạng thái ở mục 2 do chính PR #94 sửa thành "Resolved"; SEC không sửa dòng đó trên `main` để tránh xung đột khi gộp |
| ARC-10 | Suggestion | FD đọc Wi-Fi khi BA có dòng rbac riêng | BA đã thêm S36 (0.2.8, `4bb9e68d`) | **Closed** phía SEC. ARC đổi `getPropertyWifi` sang S36 và thêm `front_desk`; SEC không cần đọc lại, nếu đổi đúng phạm vi ở 5.6 |
| ARC-12 | Suggestion | Sửa changelog. Thêm cảnh báo không chặn `NIGHTLY_PRICE_UNUSUAL`; Desk hỏi xác nhận lại | Đủ. Không có ô lý do; SEC chấp nhận vì audit `config` đã ghi giá | **Closed**. Biên trên ÷ 5 (DOM `1568e523`) là delta tài liệu (5.6) |
| ARC-13 | Suggestion | Id ổn định `RB-<operationId>-<subject>`, `RBF-…`; `x-round: R5` | `rbac-cases.json` có 2310 ca, id dạng mới, và 21 `fieldCases` | **Closed** |
| ARC-07 | Minor | Không phải việc của ARC | Không đổi so với lần đọc PR #93 | Ý 1 còn **Deferred** (OPS) |
| ARC-11 | Suggestion | Không phải việc của ARC | – | **Open**: SEC viết SR-NET-01; INV/OPS tách mạng khách |
| ARC-14 | Suggestion | Không phải việc của ARC | – | **Open**: ORC thêm câu L7 vào danh sách luật sư ESC-001 |

### 5.2 BUG-R5-002 trong 0.3.13 (mục 1.21; mô tả `recordPayment` (A) (B), `confirmPaymentReceived`, `createVietQr`, `setRefundDestination`, `createDepositNotice`, `listAuditEvents`)

| Yêu cầu SEC | Hợp đồng | Kết quả |
|---|---|---|
| V5-48: trên đơn đã đóng, mọi vai kể cả OWN; kiểm dưới khóa đơn; lỗi thì không ghi gì | `recordPayment` (A) | Khớp |
| Tiền mặt, POS, ví, `ota_collect` → 422 `NOT_IN_LIST` (`method`) | (A) | Khớp. Thêm: **API từ chối tiền mặt** trên đơn đã đóng |
| Thiếu ảnh → 422 `REQUIRED` | (A). Ảnh của một báo "khách đã chuyển" → 422 `NOT_IN_LIST` | Khớp, và chặt hơn đề xuất (S7) |
| Luôn `pending`; audit `afterClosure` + `reservationStatus`; `Payment.afterClosure` | (A) | Khớp (S6) |
| Thứ tự 403 → 404 → luật đơn đã đóng | Có ở `recordPayment`. Ở `confirmPaymentReceived`, `createVietQr` ghi "trước mọi kiểm khác" | Cần ghi rõ 404 phạm vi đi trước 409 ở hai operation này → **ARC-17** (Minor) |
| `confirmPaymentReceived`, `createVietQr` → 409 `INVALID_TRANSITION` + `reservationStatus`, cả SAL, cả khi có `overBalanceReason` | Có, kèm schema `Problem.reservationStatus` | Khớp |
| S2: yêu cầu hoàn đứng tên người ghi; người ghi vào `origin_actor_ids` | (B), mã lý do mới `payment_after_cancel` | Khớp. Mã lý do riêng tốt hơn dùng lại `overpayment` |
| S3: nơi nhận cố định `original_method`; không chi tiền mặt | (B); `setRefundDestination` → 409; `executeCashRefund` → 409; chỉ chi khi đã `reconciled` | Khớp |
| S4 tối thiểu: "Có thể trùng" | `Payment.possibleDuplicateCodes` (có `x-visible-to` FD+), `ApprovalRequest.possibleDuplicateCodes` | Khớp. Riêng `ApprovalRequest.possibleDuplicateCodes` chưa có `x-visible-to` → **ARC-16** (Minor) |
| S4 bản tốt: `bankReference`, trùng → 409 | `PaymentCreate.bankReference` tùy chọn ở **mọi đường ghi**; 409 `DUPLICATE_BANK_REFERENCE` + `duplicateReservationCode` | Đúng hướng. Còn thiếu phạm vi vai, kiểm số thẻ, chuẩn hóa mã → **ARC-15** (Minor) |
| S5 trần (nên có) | FD/FDL → 422 `AMOUNT_EXCEEDS_BALANCE` (`max`); MGR/OWN ghi được, kèm `note` | Khớp |
| S7: báo của sale trên đơn đã đóng | `createDepositNotice` → 202 + `deposit_after_cancel`; không sinh khoản thu; ảnh không dùng làm chứng từ; audit `afterClosure`; tin đẩy chỉ có mã đơn | Khớp |
| S8: "Không thấy tiền" | `resolveAttentionEvent`, ghi chú bắt buộc, audit người và giờ, có trong `afterClosureOnly` | Khớp |
| DOM B002-04: ghi hai lần; chứng từ là thông báo tiền vào tài khoản OTTIMO | `disputed` → `reversePayment` → `superseded`. Nhãn ô ảnh ghi chứng từ | Khớp. Luật "một dòng sao kê một khoản" ở v1.0.6 – SEC chấp nhận, vì đối soát vẫn do MGR+ làm bằng tay |
| 5B-2 (mục 4) | 1.21 ý 4: FD+ không cần duyệt, chỉ khi đủ 3 điều kiện; ngoài điều kiện không khôi phục, kể cả OWN; SAL, CTV không bao giờ; chỉ cùng giao dịch với khoản thu V5-48; khóa căn + EXCLUDE; còn yêu cầu hoàn mở → 409 `refund_pending`; lý do bắt buộc; `ROOM_UNAVAILABLE`; không ghi nửa chừng; audit; báo OWN và MGR | Khớp đủ. Migration nhỏ (kind thông báo) theo QC R4 ĐK-2 – đúng. Ghi chú cho 0.3.14 ở thẻ ARC-18 |

### 5.3 G15 – `bankReference`: khóa tư vấn hay unique index

SEC **không** cần ràng buộc ở DB cho v1.0.5. Lý do:
- `bankReference` là trường tùy chọn (DOM: lễ tân thường không đọc được mã). Một unique index cũng không bắt được ca không gõ mã. Lớp chặn chính vẫn là:
  - "Có thể trùng";
  - MGR+ đối soát với sao kê;
  - chỉ chi khi đã đối soát.
- Mọi lần ghi khoản thu đi qua một hàm (`recordInTx`). Mẫu `pg_advisory_xact_lock(hashtextextended('<tiền tố>:…', 0))` đã dùng ở 4 chỗ trong mã. Lớp DB còn chặn khóa tư vấn mức phiên (`database.ts` 236–237).
- Thêm index là thêm migration, nên phải chờ V5-61 (QC R4 ĐK-2).

Điều kiện cho BE khi làm PR-B3 (ghi ở thẻ ARC-15):
1. Lấy khóa `pg_advisory_xact_lock(hashtextextended('bank-ref:' || property_id || ':' || <mã đã chuẩn hóa>, 0))` **trước** câu kiểm trùng, trong cùng giao dịch với lệnh `INSERT`.
   - Giao dịch giữ mức `READ COMMITTED` (mặc định của `database.ts`), để câu kiểm chạy sau khi có khóa thấy dòng mà giao dịch trước vừa commit.
2. Chuẩn hóa trước khi khóa, kiểm và lưu: bỏ khoảng trắng đầu/cuối, so không phân biệt hoa thường (lưu dạng chữ hoa).
3. Chỉ so với **khoản thu** (`type` ∈ `deposit`, `charge`; `reversal_of_id IS NULL`; chưa `reversed`).
   - Cột `bank_reference` còn chứa mã của **khoản chi hoàn** (`refunds.service.ts` 782–802). Mã chi ra không được làm khoản thu nhận 409.
4. Áp ở **mọi** đường dùng `PaymentCreate`: `recordPayment`, `confirmDeposit`, `checkIn`, `checkOut.finalPayment`, `ReservationCreate.payment`, `GroupDepositInput`. Bỏ sót một đường là có cách ghi trùng.
5. Test integration: hai giao dịch song song cùng mã (khác hoa thường) → một 201, một 409. Mã trùng với một khoản chi hoàn → 201.

**Nên có ở v1.0.6:** partial unique index trên `(property_id, upper(bank_reference)) WHERE type IN ('deposit','charge') AND reversal_of_id IS NULL AND status <> 'reversed' AND bank_reference IS NOT NULL`. Làm cùng ô mã giao dịch ở bước đối soát và luật "một dòng sao kê một khoản" (DOM 3a). Đây là lớp thứ hai, như CHECK chống tự duyệt hoàn ở 0040. Không bắt buộc.

### 5.4 Mốc giữ chứng cứ `actual_checkout_at` (ARC mục 3, 1.18; BE C0313-03)

**SEC xác nhận:** B18 có `checkoutAt` ghi `reservation.actual_checkout_at` = `registration.actual_checkout_at` = `stay_ended_at` = `checkoutAt`. Hai mốc giữ dữ liệu tính từ giá trị này:
- mốc của ảnh giấy tờ (`scheduleRetention`: hết lượt ở + min(số ngày khách đã đọc, tham số));
- mốc 12 tháng của `penalty_evidence` (`setRetentionAnchor` trong `onCheckedOut`).

Lý do:
- Hạn giữ ảnh giấy tờ (C3) khách đã đọc là "sau khi trả phòng". Lấy giờ rời thật thì đúng với điều khách đã đồng ý (BR-610), và không giữ lâu hơn chỉ vì lễ tân bấm muộn.
- `checkoutAt` không dời mốc tùy ý được:
  - ngày nghiệp vụ của nó phải là ngày đi (hoặc cửa sổ sau nửa đêm);
  - không được sau giờ server + dung sai;
  - với đơn quá ngày đi, MGR chỉ lùi được 1 đêm.
  Mốc vì vậy không thể bị kéo về trước ngày đi để xóa chứng cứ sớm.
- `penalty_evidence` gửi **sau** B18 vẫn lấy mốc "bây giờ", tức muộn hơn lúc trả phòng, nên được giữ lâu hơn chứ không ngắn hơn (`attachment.service.ts` 168–174). `post_checkout_window_until` tính từ lúc ghi, nên lễ tân không mất thời gian thêm chứng cứ.

Giữ khi cài (BE ở PR-A1b, test):
- `COALESCE(stay_ended_at, …)` không dời một mốc đã có;
- audit giữ cả `checkoutAt` và giờ ghi;
- một test: đơn quá ngày đi 1 đêm → `delete_after` của ảnh giấy tờ = `checkoutAt` + số ngày. Không tính từ giờ bấm.

### 5.5 Thẻ mới

#### FB-R5-SEC-ARC-15
- Mức độ: Minor
- Người nhận: ARC (chữ hợp đồng), BE-B (PR-B3)
- Vị trí: `PaymentCreate.bankReference`; `Problem.duplicateReservationCode`; `recordPayment` (B); contract 1.21 ý 3; G15.
- Vấn đề:
  - `bankReference` nằm trong `PaymentCreate`. Hợp đồng ghi "mọi đường ghi dùng schema này", và SAL gọi được một số đường đó (ví dụ `recordPayment` loại cọc, phạm vi `own_deposit_only`).
  - SAL gửi một mã đã có thì nhận 409 kèm `duplicateReservationCode`, tức mã của một đơn ngoài phạm vi của mình (SR-AZ-02 chỉ cho 404 với tài nguyên ngoài phạm vi).
  - Mẫu `^[A-Za-z0-9./_-]{1,64}$` nhận được một dãy 16 số. Ở `executeRefund`, cùng trường đã có kiểm `CARD_NUMBER_DETECTED`; ở `PaymentCreate` thì chưa.
  - Chưa nói chuẩn hóa: `abc123` và `ABC123` qua được cả hai.
  - Còn thiếu các điều kiện G15 ở 5.3.
- Vì sao quan trọng: lộ mã đơn của người khác (mức thấp). Ngoài ra, chặn trùng có thể bị lách bằng chữ hoa, chữ thường, hoặc bằng một đường ghi không kiểm.
- Đề xuất sửa (ARC chọn một trong hai cho ý 1):
  1. Hoặc `x-write-roles` `bankReference`: FD+ ở các operation dùng `PaymentCreate` (Desk chỉ gửi trường này ở 5B-1, của FD+). Hoặc trả 409 **không** có `duplicateReservationCode` cho người gọi không có vai FD+.
  2. Kiểm `CARD_NUMBER_DETECTED` như `executeRefund`.
  3. Chuẩn hóa và các điều kiện 1–5 ở 5.3.
- Hạn: trước khi gộp PR-B3. Mã chưa có PR 5B-1 thì từ chối trường lạ, nên tới đó chưa có đường hở.
- Trạng thái: Open

#### FB-R5-SEC-ARC-16
- Mức độ: Minor
- Người nhận: ARC
- Vị trí: `ApprovalRequest.possibleDuplicateCodes`.
- Vấn đề:
  - `Payment.possibleDuplicateCodes` có `x-visible-to` FD+, còn `ApprovalRequest.possibleDuplicateCodes` thì không.
  - `listApprovalRequests` mở cho cả HK, MT, SAL, CTV (theo phạm vi của từng vai).
- Vì sao quan trọng: mã đơn của khoản khác có thể hiện ra cho vai không xem tiền, nếu sau này một yêu cầu hoàn lọt vào phạm vi của vai đó.
- Đề xuất sửa: thêm `x-visible-to: [owner, manager, front_desk_lead, front_desk]` (serializer sinh lại). Test: SAL đọc danh sách yêu cầu thì không có trường này.
- Hạn: trước khi gộp PR-B3.
- Trạng thái: Open

#### FB-R5-SEC-ARC-17
- Mức độ: Minor
- Người nhận: ARC (một câu mô tả), BE-B (test ở PR-B1)
- Vị trí: mô tả `confirmPaymentReceived` và `createVietQr` (bổ sung 1, V5-48): "kiểm dưới khóa đơn trước mọi kiểm khác".
- Vấn đề:
  - Câu trên đọc được là 409 + `reservationStatus` có thể đi trước 404 phạm vi.
  - Khi đó SAL gửi id một QR hoặc folio của sale khác thì biết được đơn đó đã hủy hay no-show.
  - Mã hiện nay đúng thứ tự (`scopedReservation` trả 404 trước, dòng 533), nhưng chữ hợp đồng chưa giữ thứ tự này.
- Vì sao quan trọng: SR-AZ-02. Rủi ro thấp, nhưng 409 là lối lộ trạng thái mà BE dễ cài sai.
- Đề xuất sửa:
  - Sửa thành "sau 403 vai và 404 phạm vi, trước mọi kiểm khác của khoản thu", như `recordPayment` (A).
  - Test ở PR-B1: SAL với QR còn chờ của đơn đã hủy của sale khác → 404, thân lỗi không có `reservationStatus`.
- Hạn: trước khi gộp PR-B1 (V5-48). ARC có thể sửa câu cùng delta tài liệu ở 5.6.
- Trạng thái: Open

#### FB-R5-SEC-ARC-18
- Mức độ: Suggestion
- Người nhận: ARC (danh sách 0.3.14)
- Vấn đề, đề xuất:
  1. `recordPayment.restoreHold` (5B-2): gắn `x-write-roles` FD+, để SAL gửi trường này thì nhận 403 trước mọi kiểm khác, không dựa vào việc SAL đã bị chặn ở nhánh đơn đã đóng.
  2. B1 (`createReservation`): đêm có `edited` ≠ `true` dùng giá lịch của máy chủ, như báo giá (đuôi ARC-06).
  3. Gắn `x-write-roles` cho các luật trường cũ, như ARC đã hẹn (G13).
- Trạng thái: Open

#### FB-R5-SEC-BA-19
- Mức độ: Suggestion
- Người nhận: BA
- Vị trí: `rbac-matrix.md` dòng A18 và ghi chú 46a: "chỉ OWN, MGR".
- Vấn đề: theo DOM 7.1 (a) và hợp đồng 1.18, OWN luôn được làm, còn MGR chỉ khi `nightsNotBilled` ≤ 1; từ 2 đêm thì MGR nhận 403 `requiredRole: owner`.
- Đề xuất sửa: sửa A18 và 46a theo luật mới, để `gen_traceability` và QA dựa vào cùng một nguồn.
- Trạng thái: Open

### 5.6 Delta chỉ đổi tài liệu sau `2cb549cc`

**SEC chấp nhận gộp mà không đọc lại**, nếu delta chỉ gồm:
- G9 và câu `NIGHTLY_PRICE_UNUSUAL` ở `createRoom`, `updateRoom`: biên trên thành giá tháng ÷ 5 (DOM `1568e523`). Vẫn chỉ là cảnh báo, vẫn lưu, không thêm mã chặn.
- Bỏ các dòng "chờ DOM" hoặc `[GIẢ ĐỊNH]` đã có câu trả lời, ở `contract-0.3.13.md`, `openapi.yaml` (mô tả) và tệp trả lời của ARC.
- Tệp sinh lại (`openapi-meta.ts`, `openapi-schemas.ts`, api-client, `traceability.md`) chỉ khác ở chuỗi mô tả.
- Có thể kèm hai việc đã định, cũng không cần SEC đọc lại:
  - câu thứ tự của thẻ ARC-17;
  - `getPropertyWifi`: `x-rbac` S36, `x-roles` thêm `front_desk`, `rbac-cases` sinh lại với FD → 200 ở **riêng** operation này. `no-store` và "không log" giữ nguyên.

Cách kiểm (ORC, trước khi gộp):
- `git diff 2cb549cc..<HEAD mới> --stat`;
- `git diff 2cb549cc..<HEAD mới> -- product/docs/api/openapi.yaml | grep -E '^[+-] *(x-roles|x-write-roles|x-visible-to|x-scope|x-rbac|operationId|required|enum|pattern|type):'` không ra dòng nào, trừ đúng hai dòng `x-roles`/`x-rbac` của `getPropertyWifi` nếu ARC gộp việc S36;
- CI xanh trên HEAD mới.

Nếu delta đổi gì khác thì gửi lại SEC đọc riêng phần đó: vai, phạm vi, `x-visible-to`, mã lỗi, luật tiền, luật Wi-Fi, luật đơn đã đóng, hoặc `rbac-cases` ngoài `getPropertyWifi`.

### 5.7 Dòng decision-log đề xuất (ORC ghi khi gộp)

`| 2026-11-06 | 5 | **SEC – đọc lại PR #94 (0.3.13-draft bổ sung 1/1b/1c, HEAD 2cb549cc, CI 42239136222 xanh): DUYỆT để gộp** (rounds/round-05/reviews/SEC-on-contract-0.3.13.md mục 5). Đóng ARC-01…06, 09, 10, 12, 13; còn mở ARC-07 ý 1 (OPS, Deferred), ARC-11 (SR-NET-01), ARC-14 (L7, ESC-001). BUG-R5-002 (1.21) khớp V5-48 và S1–S8: API từ chối tiền mặt, POS, OTA trên đơn đã đóng, ảnh bắt buộc, luôn chờ đối soát, confirmPaymentReceived/createVietQr 409 + reservationStatus, hoàn payment_after_cancel đứng tên người ghi, nơi nhận cố định original_method, Có thể trùng, createDepositNotice 202; 5B-2 (0.3.14) khớp SEC mục 4. G15: không cần unique index ở v1.0.5 – khóa tư vấn kèm chuẩn hóa mã, khóa trước khi kiểm, chỉ so khoản thu, mọi đường PaymentCreate, test song song; index một phần nên có ở v1.0.6. Xác nhận mốc giữ chứng cứ theo checkoutAt. Thẻ mới, không chặn gộp: ARC-15 (bankReference: vai FD+ hoặc 409 không mã đơn cho SAL, kiểm số thẻ – trước PR-B3), ARC-16 (x-visible-to cho ApprovalRequest.possibleDuplicateCodes – trước PR-B3), ARC-17 (404 phạm vi trước 409 reservationStatus – trước PR-B1), ARC-18 và BA-19 (Suggestion). Chấp nhận delta chỉ đổi tài liệu (G9 ÷ 5, bỏ "chờ DOM", có thể kèm S36 cho getPropertyWifi) mà không đọc lại, theo phạm vi mục 5.6 | SEC | Quyền SEC (review bảo mật hợp đồng API) |`
