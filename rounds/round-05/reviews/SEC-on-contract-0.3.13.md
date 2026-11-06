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
- Trạng thái: Open

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
- Trạng thái: Open

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
- Trạng thái: Open

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
- Trạng thái: Open

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
- Trạng thái: Open

### FB-R5-SEC-ARC-06
- Mức độ: Minor
- Vị trí: `QuoteInput.nightlyRates` + `NightRate.edited`; `contract-0.3.13.md` 1.3.
- Vấn đề:
  - Theo `NightRate.edited`, đêm `edited = false` được server ghi đúng số gửi lên với nguồn `calendar` ("không so số").
  - Ở báo giá, server tự tính được giá lịch, nên không cần nhận số của client cho đêm không sửa.
  - Giữ nguyên luật B1 thì FD có thể gửi giá thấp với `edited = false`. Đơn khi đó không mang `bookingRateSource = manual_agreed` và không vào các báo cáo giá tay.
- Vì sao quan trọng: giá tay bị che thành giá lịch làm hỏng kiểm soát phát hiện (ví dụ hạ giá trên hệ thống, thu tiền mặt cao hơn). Mức thiệt hại có trần là sàn BR-105, nên để Minor.
- Đề xuất sửa: ở `calculateQuote`/`saveQuote`, phần tử `edited` = `false` hoặc vắng thì server dùng giá lịch của chính nó và bỏ `amountVnd`, hoặc trả 422 `NOT_ALLOWED` khi số khác giá lịch. Chỉ phần tử `edited = true` mang giá của client. Thêm test T14-7. Luật B1 của `createReservation` giữ nguyên ở bản này; SEC sẽ nêu ở review B1 sau.
- Trạng thái: Open

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
- Trạng thái: Open

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
- Trạng thái: Open

### FB-R5-SEC-ARC-09
- Mức độ: Suggestion
- Vị trí: `contract-0.3.13.md` 1.14, G7.
- Vấn đề: ARC viết "03:30 + 15:30". `plan.md` V5-62 (OPS 06/11, PR #93) đã chốt production 03:00 + 15:00, staging 03:30 + 15:30, mỗi khoảng 12 giờ.
- Vì sao quan trọng: câu RPO trình chủ đầu tư và SR-BAK-01 phải theo một nguồn.
- Đề xuất sửa: sửa 1.14 và G7 theo dòng V5-62 của plan, hoặc trỏ sang đó. SEC sửa SR-BAK-01 khi bản lên, như ARC ghi.
- Trạng thái: Open

### FB-R5-SEC-ARC-10
- Mức độ: Suggestion
- Vị trí: G4; `contract-0.3.13.md` 1.13 "FD không đọc được", mục 3 dòng V5-58 (phụ).
- Vấn đề: SEC xác nhận phần bảo mật của G4: operation riêng, không qua tham số, mật khẩu không vào audit hay log. Còn việc không cho FD đọc thì không tăng bảo vệ:
  - mật khẩu Wi-Fi thuộc C1;
  - mức GST1 (chỉ cần link) đã thấy;
  - mật khẩu in trên thẻ trong căn.
- Vì sao quan trọng: tránh để DOM hiểu nhầm đây là yêu cầu của SEC. Lễ tân thường là người báo Wi-Fi cho khách tại quầy.
- Đề xuất sửa: DOM quyết theo vận hành. Nếu cho FD đọc thì giữ `no-store`, không log; BA thêm dòng rbac; ARC thêm vai.
- Trạng thái: Open

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
- Trạng thái: Open

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
- Trạng thái: Open

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
