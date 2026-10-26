# BE-B – Round 3 – Phản hồi & sửa: vá ESC-031 trước ngày chạy (phụ thu trả muộn bằng giá 1 đêm không cần mật khẩu quản lý tại quầy – ESC-024 B)

- Vai: BE-B | Ngày: 26/10/2026 | Nhánh: `worktree-agent-ae045319d05dda682` (cắt từ `main` `476b79d`, chưa push, không tag)
- Căn cứ: INV 26/10 "ESC-031 = vá ngay trước ngày chạy" (decision-log dòng cuối); ORC mở ngoại lệ đóng băng mã tiền **chỉ** cho phạm vi ESC-031/ESC-024 B; `02-escalations/ESC-031.md`, `ESC-024.md`; SEC `reviews/SEC-sprint1.md` mục 3.6 ghi chú 3; BR-416 v0.4.4 (đoạn ESC-024 B (1)–(4)), BR-433 (d)(e), BR-427, BR-522; ARC `outputs/ARC/s1-contracts.md` mục 2 (US-164), 13.3–13.4 (K11-06, `SELF_REFUND_FORBIDDEN`); OpenAPI 0.3.8 `checkOut.lateFeeInsteadOfNight`; DOM `outputs/DOM/s1-money-oracle.md` mục 10 (chuẩn ESC-024 B).
- Cổng trước khi gộp (INV): DOM + ARC + SEC review, QA kiểm tiền.

## 1. Thiết kế (tối thiểu, đúng ESC-024 B)

**Vì sao vỡ:** production `MFA_ENFORCED=true` → mọi OWN/MGR có 2FA → `PasswordReauth.verifyApprover` luôn 401 (fail-closed, SR-AUTH-11). Đường "quản lý gõ mật khẩu trên máy quầy" của `checkOut.lateFeeInsteadOfNight` (và `requestFoc` lồng trong nó) không bao giờ qua được.

**Không nới fail-closed.** Thêm một cách thứ tư cho `lateFeeInsteadOfNight`: `postReview: true` – lễ tân ghi, quản lý hậu kiểm.

| Điểm | Cách làm |
|---|---|
| Số tiền | Đúng số server tính (`lateFeeAsNightVnd`, đọc dưới khóa trong `decide`). Gửi số khác (cao hay thấp) → 409 `SURCHARGE_CHANGED`. Không có ô sửa. |
| Khi nào mở | Chỉ khi server xác định đêm ngày đi **không bán được** (giữ nguyên kiểm cũ: đêm bán được → 422 `NOT_ALLOWED` trên `lateFeeInsteadOfNight`). |
| Không vượt quyền | `postReview` kèm `approverUsername`, `authMethod`, `secret`, `totpCode`, `confirmationId` hoặc `requestFoc` → 422 `NOT_ALLOWED` từng trường. `postReview` không phải boolean → 422 `VALIDATION_FAILED`. Không gọi `verifyApprover`, không đếm sai, không audit bảo mật. Lý do bắt buộc (`REASON_REQUIRED`). Mọi lỗi trả **trước khi ghi**. |
| Ai gọi | FD/FDL/MGR/OWN (`x-roles` của `checkOut` không đổi). MGR/OWN gọi cũng phải theo đúng luật trên (không có lối tắt "mật khẩu của chính mình" trên đường này). |
| Ghi gì | Cùng giao dịch B18: dòng `late_checkout` `charge_code = late_fee_as_night` (như cũ); audit `money` `reservation.late_fee_instead_of_night` `after = {amountVnd, checkoutTime, date, channel: 'post_review', reviewDueAt}`, actor = người ghi, **không** `confirmedBy`; thông báo `late_fee_post_review` tới mọi OWN + MGR của cơ sở (trừ người ghi); **một** mục "Cần chú ý" `late_fee_post_review` mỗi đơn (nguồn `event`, `warning`, chỉ OWN/MGR thấy, `dueAt` = lúc ghi + `post_checkout_charge_hours`). B18 bị từ chối sau đó (minibar, yêu cầu chờ, số dư) → rollback cả ba. |
| Hậu kiểm | MGR+ xem lại trong cửa sổ sau trả phòng (folio `settled`, BR-427 24 giờ). Thấy nên miễn → **A32** (`adjustFolioLine`) giảm dòng phụ thu → tiền dư → yêu cầu hoàn tự sinh (K11-06, BR-433 (e) đếm vào Σ lượt ESC-026, `SELF_REFUND_FORBIDDEN` chặn người làm A32 tự chi). "Đã xem" = `resolveAttentionEvent` (MGR+; FD 404). **Không thêm đường tiền mới.** |
| Quá hạn | Job tick mới `late_fee.post_review_overdue`: mục còn mở quá `post_checkout_charge_hours` → báo mọi OWN **một lần** (cùng kind `late_fee_post_review`), mục vẫn mở; J15 đóng folio như thường (BR-416 (4)). |
| `requestFoc` | Chỉ `lateFeeInsteadOfNight.requestFoc` cùng gốc `verifyApprover` (FOC tự áp bởi người xác nhận). ESC-024 B: lễ tân **không được** miễn/giảm → trên đường `postReview` bị 422 `NOT_ALLOWED`. Cách làm thay: quản lý miễn sau bằng A32 (ở trên). Operation `requestFoc` của folio và `approveRequest` dùng `PasswordReauth.verify` (mật khẩu của chính người đang đăng nhập, phiên đã qua 2FA) – **không** bị MFA chặn, không đổi. |

Đường xác nhận tại quầy cũ giữ nguyên (máy không bật 2FA vẫn chạy; người có 2FA vẫn 401 – có test).

## 2. File tạo/sửa (`product/services/api/`)

| File | Thay đổi |
|---|---|
| `src/modules/frontdesk/internal/checkout.service.ts` | `LateFeeInput.postReview`; đọc + 422 `NOT_ALLOWED` (`POST_REVIEW_FORBIDDEN`); B18 không đòi người xác nhận khi `postReview`, từ chối nếu lỡ có; `recordForPostReview` (audit, thông báo, mục "Cần chú ý") |
| `src/modules/frontdesk/internal/frontdesk.controller.ts` | `lateFeeApprover`: `postReview` (khác `false`) → không gọi `verifyApprover` |
| `src/modules/frontdesk/public/late-fee-review-job.ts` (mới) | Job `late_fee.post_review_overdue` |
| `src/modules/frontdesk/frontdesk.module.ts`, `src/worker.ts` | Đăng ký job (api/test-support + worker); audit field `reviewDueAt` |
| `src/modules/events/public/events.service.ts` | `AttentionKind` + `late_fee_post_review`, người xem MGR+ |
| `src/modules/events/internal/attention.service.ts` | `dueAt` của `late_fee_post_review` = tạo + `post_checkout_charge_hours` |
| `src/db/schema/frontdesk.ts`, `src/db/migrations/0088_late_fee_post_review.sql`, `meta/0088_snapshot.json`, `meta/_journal.json` | CHECK `staff_notification.kind` + `late_fee_post_review` (chỉ thêm; drizzle `generate` lại = "No schema changes") |
| `test/integration/esc031-late-fee-post-review.test.ts` (mới) | 6 ca HTTP + Postgres thật |
| `test/esc031-units.test.ts` (mới) | 3 ca không DB |

OpenAPI **không sửa** – đề xuất ở mục 4 cho ARC (addendum 8).

## 3. Test (Postgres 17 riêng `beb-esc031-pg`, cổng 56731 – không đụng stack QA-3; `ottimo_app`, migrate bằng `ottimo_migrator`)

Ca mới `esc031-late-fee-post-review` (6/6 xanh):
1. Căn 203, rời 19:00, đêm không bán được: FD `postReview` → 200, dòng **792.000**, không dòng FOC, audit `post_review` actor FD không `confirmedBy`, `reviewDueAt` = 18/01 19:00 (+07); thông báo OWN 1, MGR 1, FD/FDL 0; "Cần chú ý" OWN/MGR thấy 1 mục `dueAt` +24 giờ, FD/FDL không thấy; 0 audit bảo mật, bộ đếm 0; folio `settled`, cửa sổ = hạn hậu kiểm.
2. Quản lý có 2FA xác nhận tại quầy → 401 `REAUTH_FAILED` (fail-closed giữ), không ghi gì; cùng lệnh với `postReview` → 200.
3. Từ chối trước khi ghi: `requestFoc`, `authMethod`+`secret`, `approverUsername`, `totpCode`, `confirmationId` → 422 `NOT_ALLOWED`; `postReview: 'yes'` → 422; thiếu lý do → 422 `REASON_REQUIRED`; số − 100.000 / + 1 → 409 `SURCHARGE_CHANGED`; MGR gọi kèm mật khẩu → 422; đêm bán được → 422 `NOT_ALLOWED`. Sau đó: đơn vẫn `in_house`, 0 audit, 0 thông báo, 0 mục, 0 dòng.
4. Gửi lại cùng `Idempotency-Key` → 200 đã lưu (`Idempotent-Replayed`), 1 audit, 1 thông báo mỗi người, 1 dòng.
5. Hậu kiểm (oracle DOM mục 10): rời 20:30, 09:00 hôm sau MGR A32 giảm còn 396.000 → yêu cầu hoàn **396.000** người xin = MGR (`pending`); MGR "Đã xem" → mục biến mất; FD resolve → 404; job sau đó không báo thêm.
6. Quá hạn: 18:59 hôm sau job không báo; 19:00 báo OWN lần 2 (MGR không); chạy thêm 3 lần → vẫn 2.

Ca đơn vị `esc031-units` 3/3 (người xem mục MGR+; job đọc đúng tham số, chỉ báo OWN, thiếu tham số → không làm gì).

Hồi quy: **toàn bộ bộ test api** trên DB riêng – 133 tệp xanh, 2 tệp bỏ qua theo cấu hình môi trường; **3247 ca xanh**, 24 bỏ qua, 0 đỏ. Gồm các bộ tiền liên quan: `s438r3/r4/r5-money` (đường xác nhận tại quầy, BE-64, BUG-R2-165/167), `mfa-us143` (ca 15 fail-closed), `checkout-due`, `frontdesk-stay`, `s438-r8/*` (K11-06, BR-433 (e), `SELF_REFUND_FORBIDDEN`, 208/209/210), `money-limit-basis-architecture` (CHECK kind chỉ thêm), `module-boundaries`, `migrations-journal`, `schema-parity`. `drizzle-kit generate`: "No schema changes". Typecheck (`turbo typecheck`), eslint, prettier trên tệp đã sửa: xanh.

## 4. Đề xuất cho ARC – OpenAPI 0.3.8 addendum 8 (BE không tự sửa `openapi.yaml`)

Đổi hình dạng: **thêm 1 trường tùy chọn** vào body `checkOut.lateFeeInsteadOfNight`. Không đổi response, `x-roles`, mã lỗi mới.

```yaml
postReview:
  type: boolean
  default: false
  description: |
    0.3.8 bổ sung 8 (ESC-031, INV 26/10; ESC-024 B) – cách (4) "Lễ tân ghi, quản lý hậu kiểm" (v1.0, chưa có US-164):
    gửi `amountVnd` (= `CheckoutSummary.lateFeeAsNightVnd`, lệch → 409 `SURCHARGE_CHANGED`), `reason`, `postReview: true`.
    Kèm `approverUsername`, `authMethod`, `secret`, `totpCode`, `confirmationId`, `requestFoc` → 422 `NOT_ALLOWED` (từng trường);
    không phải boolean → 422 `VALIDATION_FAILED`. Không kiểm mật khẩu ai, không đếm SR-RL-02. Chỉ khi đêm ngày đi không bán được.
    Ghi: audit `money` `reservation.late_fee_instead_of_night` `after.channel = post_review`, `after.reviewDueAt`; thông báo
    `late_fee_post_review` mọi OWN/MGR (trừ người gọi); "Cần chú ý" `late_fee_post_review` (MGR+, `dueAt` = ghi +
    `post_checkout_charge_hours`); quá hạn chưa xem → job `late_fee.post_review_overdue` báo OWN một lần.
    Miễn sau hậu kiểm: A32 trên folio `settled` → hoàn BR-522 (K11-06, `SELF_REFUND_FORBIDDEN`).
```

Kèm theo:
- Mô tả `lateFeeInsteadOfNight` "ba cách xác nhận, đúng một" → "bốn cách"; `after.channel` thêm `post_review` (ARC 2.2: `desk|self|remote|expired_self_record|post_review`).
- `AttentionItem.kind` / `StaffNotification.kind` `late_fee_post_review`: **đã có** trong 0.3.8; sửa câu `dueAt` "ghi + `late_fee_post_review_hours`" thành "`post_checkout_charge_hours`" (lý do: miễn sau hậu kiểm chỉ làm được bằng A32 khi folio còn `settled`, tức đúng cửa sổ BR-427 – hai tham số riêng có thể lệch nhau; khóa `late_fee_post_review_hours` / `late_fee_fallback_review_hours` chưa có trong catalogue). Nếu ARC/DOM muốn khóa riêng ở v1.1 thì phải ≤ `post_checkout_charge_hours`.
- v1.1 (US-164): ARC quyết giữ hay bỏ cách (4) khi có `confirmationId` hết hạn (cách (3)) – ESC-024 B gốc là "chờ 15 phút rồi mới tự ghi".
- Sinh lại `openapi-meta`/`openapi-schemas` (request body không vào serializer – dự kiến không đổi) và `packages/api-client` để FE có kiểu `postReview`.

## 5. Giả định (thuộc quyền BE; DOM/ARC/SEC xác nhận khi review – không ESC)

1. **Không có thời gian chờ 15 phút ở v1.0.** ESC-024 B gốc tính 15 phút từ lúc gửi yêu cầu xác nhận từ xa (US-164, v1.1); v1.0 không có kênh đó. INV chọn ESC-031 theo câu "lễ tân ghi đúng số máy tính, không giảm, quản lý nhận thông báo và xem lại trong 24 giờ – không cần mật khẩu của ai". Lễ tân gọi điện quản lý theo `staff-one-pager.md` trước khi ghi (quy trình, không ép bằng máy).
2. FOC trả muộn **đã duyệt trước** (ví dụ quản lý duyệt FOC cho bậc trả muộn trong lượt ở) vẫn đi theo dòng mới như mọi đường B18 (BR-434, S3-11) – đó là quyết định của quản lý, không phải lễ tân miễn trong lệnh. DOM xác nhận.
3. Hạn hậu kiểm = `post_checkout_charge_hours` (24) – xem mục 4.
4. Người ghi là MGR/OWN: không tự nhận thông báo; mục "Cần chú ý" vẫn mở cho người còn lại (OWN thấy).
5. Quá hạn: báo OWN một lần qua thông báo cùng kind; mục giữ nguyên (không lên `critical`).

## 6. Rủi ro / việc còn lại

- **FE phải làm cùng bản** (không thì bản vá vô dụng): `CheckOutPage.tsx` – khi `extraNightAvailable = false`, thay panel mật khẩu quản lý bằng "Ghi phụ thu – quản lý xem lại trong 24 giờ" (số chỉ đọc, lý do bắt buộc, gửi `postReview: true`, không ô FOC); "Cần chú ý" hiển thị `late_fee_post_review` cho OWN/MGR, mở folio để A32; chữ theo brand OTTIMO. Đề nghị giữ panel cũ ẩn ở production.
- PO sửa `release-notes.md` (Giới hạn đã biết) và `staff-one-pager.md` (cách tạm ESC-031 → cách chính thức).
- Lạm dụng: lễ tân không giảm được số; đường chỉ mở khi đêm không bán được (server quyết). Tạo đơn giả cho đêm đó để mở đường chỉ làm khách trả **bằng** giá 1 đêm thay vì bán thêm đêm – không mất doanh thu, nhưng SEC xem.
- Migration 0088: lấy số lúc rebase nếu `main` có migration mới trước khi gộp (ARC S1-14).
