# SEC review – PR #71, BUG-R4-038 đêm thêm đơn Nội bộ 0 đ: điểm quyền A31 (`v104/fix-internal-added-night`)

- Người review: SEC | Round 4, đợt v1.0.4, bước **Review** (xem nhanh một điểm theo ORC) | 04/11/2026
- Đối tượng: nhánh `v104/fix-internal-added-night` @ **`7557e485`**, đọc bằng `git diff c2506a53..7557e485`.
  - SEC chỉ đọc phần A31: `folio/internal/folio-lines.service.ts` (`adjust`), `reservations/public/stay-night-pricing.ts` (`setNightRate`), và các test A31 trong `test/integration/bug-r4-038-internal-added-night.test.ts`.
  - SEC đọc thêm để đối chiếu: `folio.controller.ts` (`adjustFolioLine`), `shared/validation.ts` (`requireReason`), `audit/public/audit.service.ts`, `audit-fields.ts`, `reservations/audit-entities.ts`.
  - B13, B9a, B18 (`stay.service.ts`, `stay-support.ts`, `checkin/checkout.service.ts`) do ARC và QA review. SEC chỉ dùng các phần này để tìm đường vòng.
- Không sửa mã, không chạy test, không commit, không đụng nhánh BE.

## 0. Kết luận

**ĐẠT, rủi ro Low. Đề xuất giữ như hiện tại, không đặt ngưỡng.** Không có Blocker hay Major. Có 1 Minor (thẻ 01, test chưa khóa audit) và 1 Suggestion (thẻ 02). Cả hai không chặn gộp.

## 1. Có lạm quyền hay đường vòng không

**Không có lạm quyền mới.** PR này không mở thêm quyền nào cho FD/FDL.
- Cờ `zeroByManager` do máy chủ tính từ `principal(req).roles`, tức vai của phiên tại cơ sở. Client không gửi được cờ này. `setNightRate` chỉ có một nơi gọi là `adjust`.
- Giá 0 chỉ đi qua khi đủ bốn điều kiện:
  - dòng `room`;
  - đơn đang đồng bộ đêm (`hold`, `confirmed`, `in_house`);
  - kênh `internal`;
  - người làm có vai OWN hoặc MGR.

  Thiếu một điều kiện thì trả 422 `AMOUNT_NOT_POSITIVE` hoặc 403 `FORBIDDEN_ACTION`. Các ca sau đều bị chặn:
  - `extra_person` về 0;
  - đơn Trực tiếp về 0, kể cả MGR (có test);
  - folio đã trả phòng hay đã chốt về 0, vì không còn `night`.
- Lỗi 403 ném trong giao dịch, nên giao dịch rollback. `detail` chỉ là câu cố định, không lộ dữ liệu.

**Điểm lệch ORC nêu (FD gõ được 1 đ): đúng, nhưng không phải lỗ mới, và chặn 1 đ cũng không đóng được.**
- `setNightRate` bỏ sàn–trần BR-105 với kênh `internal` (`row.channel_group !== 'internal'`). Như vậy FD/FDL đặt được mọi giá > 0 cho đêm Nội bộ qua A31. Việc này có từ trước production (tệp BE `bug-r4-037-data-impact.md` mục 3.1), không do PR này mở.
- FD vẫn có ít nhất ba đường hợp lệ khác để có đêm Nội bộ 0 đ:
  - tạo đơn Nội bộ 0 đ (bắt buộc `internalNote`);
  - B13 gia hạn với giá mặc định 0 hoặc gõ 0. Test dòng 311 chạy bằng `c.fd`;
  - với đêm cuối (đêm gia hạn bị tính tiền thường là đêm cuối): dùng B7 đổi ngày đi sớm hơn để đêm đó void, rồi gia hạn lại qua B13 ở 0 đ. B7 thêm đêm cho đơn Nội bộ cũng ra 0 đ (tệp BE 037 mục 1.6). SEC suy ra từ đọc mã và tệp BE, chưa chạy thử.
- Vì vậy cổng "0 chỉ OWN/MGR" của A31 là cổng phân vai cho việc gỡ dữ liệu cũ (DOM R5), không phải cổng chặn tiền. Mọi đường kể trên đều có lý do bắt buộc và audit tiền.
- Kịch bản gian lận thực sự là thu tiền mặt của người ở Nội bộ ngoài sổ, rồi đưa dòng về gần 0. Kịch bản này làm được dễ hơn bằng cách tạo đơn 0 đ ngay từ đầu, nên không mã nào chặn được. Chỉ có kiểm soát phát hiện mới bắt được: lý do, audit, quản lý xem **Nhật ký tiền**.

## 2. Đặt ngưỡng hay giữ nguyên

| PA | Nội dung | SEC |
|---|---|---|
| **Giữ** | 0 chỉ OWN/MGR; giá > 0 ai có A31 cũng gõ được, như hiện nay | **Đề xuất.** Đúng quy tắc DOM (đêm Nội bộ không áp sàn–trần, "Nội bộ có thu" gõ giá > 0), và không mở thêm quyền |
| Ngưỡng "dưới sàn Trực tiếp cần MGR" | Áp sàn Trực tiếp cho A31 trên đêm Nội bộ | **Không nên.** Ngược quy tắc DOM 04/11 (không sàn–trần), và lệch với B13: FD gõ 100.000 dưới sàn ở B13 là hợp lệ (test dòng 311–330). Ngưỡng cũng không chặn được, vì FD vẫn đi B7 + B13 về 0 |
| Mọi lần **giảm** đêm Nội bộ qua A31 cần MGR | FD/FDL chỉ được tăng | Chặt hơn nhưng vẫn có đường B7 + B13, và chặn cả việc FD tự sửa lỗi gõ của "Nội bộ có thu". Chỉ đáng làm nếu PO/DOM muốn quy tắc "giảm tiền đã ghi là việc của quản lý" cho mọi đường. Khi đó làm ở v1.0.5, cho cả B7/B13, không chỉ A31 |

Ai được giảm tiền đêm Nội bộ là quy tắc nghiệp vụ, thuộc quyền DOM và PO. SEC chấm rủi ro Low và không chặn.

## 3. Lý do có bắt buộc không

**Có.**
- `adjust` gọi `requireReason('reason', …)` ngay dòng đầu, trước mọi nhánh, nên áp cho cả ca 0 đ lẫn 1 đ:
  - tối thiểu 3 ký tự sau khi bỏ ký tự điều khiển và khoảng trắng thừa;
  - tối đa 500 ký tự;
  - từ chối chuỗi giống số thẻ (`assertNoCardNumber`).
- Lý do đi vào cả hai dòng audit và vào dòng đảo, dòng mới của folio.

## 4. Audit có ghi đủ không

**Đủ cho truy vết.** Một lần A31 trên đêm Nội bộ ghi trong cùng giao dịch:
- `reservation.repriced` (nhóm `money`):
  - ai: `actor_type`, `actor_user_id` lấy từ ngữ cảnh giao dịch, không lấy từ client;
  - khi nào, `entity_code`, `request_id`;
  - `before.nightlyRates`, `after.nightlyRates`, `after.rateSource` = `complimentary` (0 đ) hoặc `manual` (> 0). Cả hai trường đều có trong danh sách cho phép của `reservation`;
  - `reason`.
- `folio_line.adjusted` (nhóm `money`): `before.amountVnd`, `after.amountVnd`, `reason`.
- Dòng đảo cùng dòng mới của folio có `postedBy`, `reason`, `relatedLineId`.
- Thiếu nhỏ:
  - vai tại thời điểm làm không được ghi ở nhánh này (thẻ 02);
  - test chưa khẳng định các dòng audit của ca 0 đ (thẻ 01).

## 5. Thẻ

### FB-R4-SEC-BE-PR71-01
- Mức độ: Minor
- Vị trí: `product/services/api/test/integration/bug-r4-038-internal-added-night.test.ts`, test "BR-421-04/05/06 …", đoạn "A31 brings it back to 0 (OWN/MGR only)" (khoảng dòng 472–480).
- Vấn đề: test kiểm mã 403 của FD, 201 của MGR và nguồn `complimentary` trong bản chụp giá. Test chưa kiểm audit tiền, và chưa ghi ca FD gõ 1 đ là hành vi chủ đích.
- Vì sao quan trọng: đổi tiền phải có audit đủ (BR-008, SR-AUD). Lần sửa sau có thể làm mất `reason` hoặc `rateSource` ở nhánh 0 đ mà không test nào báo. Ca 1 đ không có test thì không ai biết đó là chủ đích hay sót.
- Đề xuất sửa: thêm vào test này:
  - sau lần MGR đưa về 0: có đúng một `reservation.repriced` với `after.rateSource = 'complimentary'`, `after.nightlyRates[0].amountVnd = 0`, `reason` đúng chuỗi gửi lên, `actor_user_id` là MGR; và một `folio_line.adjusted` với `after.amountVnd = 0`;
  - sau lần FD bị 403: không có audit `reservation.repriced` mới, folio và đêm không đổi;
  - ca FD gõ 1 đ: 201, nguồn `manual`, có audit với `actor_user_id` của FD. Ghi chú trong test: "đúng ý, quy tắc DOM: đêm Nội bộ không áp sàn".
- Trạng thái: **Closed** – `1e3a91fd`, SEC xác nhận ở `02c34bc9` (mục 9.2).

### FB-R4-SEC-BE-PR71-02
- Mức độ: Suggestion
- Vị trí: `stay-night-pricing.ts` `setNightRate`, `audit.recordMoney` cuối hàm; `reservations/audit-entities.ts`.
- Vấn đề: cổng của ca 0 đ dựa vào vai, nhưng audit chỉ ghi `actor_user_id`, không ghi vai lúc làm. Ở folio đã trả phòng, `folio-lines` đã ghi `actorRole` (BR-433 (e)), còn nhánh này thì chưa.
- Vì sao quan trọng: người duyệt **Nhật ký tiền** về sau, khi vai người đó đã đổi, không thấy ngay lần đưa về 0 có qua đúng cổng OWN/MGR không.
- Đề xuất sửa: với nhánh `complimentary`, thêm `actorRole` vào `after` (dùng `actorRoleOf`, truyền từ `adjust`) và vào danh sách cho phép của `reservation`. Làm ở v1.0.5 cũng được.
- Trạng thái: **Closed** – `1e3a91fd`, SEC xác nhận ở `02c34bc9` (mục 9.2).

## 6. Ghi chú cho ORC

- Không ESC. Rủi ro Low, nằm trong quyền SEC.
- Nếu PO/DOM muốn quy tắc "giảm tiền đêm Nội bộ là việc của quản lý" (PA 3 ở mục 2), đó là quy tắc nghiệp vụ mới cho v1.0.5. Quy tắc phải áp cho mọi đường (A31, B7, B13), không chỉ A31.
- Việc tạm cho tới v1.0.5, thuộc BA/PO: quản lý xem **Nhật ký tiền** mỗi tuần, lọc `reservation.repriced` của đơn Nội bộ (nguồn `manual` có số nhỏ, hoặc `complimentary`). **Bộ lọc này thiếu, dùng bộ lọc ở mục 9.5.**
- Desk: ô **Điều chỉnh** nhận 0 (tệp BE 037 mục 1.8), nên FD gõ 0 sẽ gặp 403. FE/UXD nên có câu báo rõ "Chỉ quản lý đưa đêm Nội bộ về 0 đ". Đây không phải việc bảo mật.

## 7. Điểm làm tốt

- Cổng nằm ở máy chủ, và cờ được tính từ vai của phiên, không tin dữ liệu client.
- Mặc định là từ chối: giá 0 bị chặn ở cả `folio-lines` lẫn `setNightRate`, cho mọi kênh khác `internal` và mọi loại dòng khác `room`.
- Đêm đưa về 0 mang nguồn `complimentary` chứ không phải `manual`. Nhờ vậy Q4/Q5 và báo cáo phân biệt được đêm đã gỡ đúng với đêm gõ tay.

## 8. Dòng decision-log đề xuất (ORC ghi khi commit, SEC không sửa decision-log)

`| 2026-11-04 | 4 | **SEC – PR #71 (BUG-R4-038) điểm quyền A31 (v104/fix-internal-added-night @ 7557e485): ĐẠT, rủi ro Low, giữ như hiện tại** (rounds/round-04/reviews/SEC-on-v104-pr71-internal-nights.md): đêm Nội bộ về 0 chỉ OWN/MGR, cờ tính ở máy chủ từ vai của phiên; kênh khác, dòng khác room, folio đã trả phòng → 422; lý do bắt buộc (requireReason), audit tiền reservation.repriced (rateSource complimentary) + folio_line.adjusted. FD gõ 1 đ là hành vi có từ trước (đêm Nội bộ không áp sàn – DOM), không phải lỗ mới; FD còn đường B13/B7 về 0 hợp lệ, nên không đặt ngưỡng theo sàn Trực tiếp. Minor 01 (test khóa audit ca 0 đ, ghi ca 1 đ là chủ đích), Suggestion 02 (ghi actorRole); không chặn gộp | SEC | Quyền SEC |`

---

## 9. Lượt 2 @ 02c34bc9 (05/11)

- Đối tượng: `origin/v104/fix-internal-added-night` @ **`02c34bc9`**. SEC đọc `git diff 7557e485..02c34bc9`, gồm 3 commit:
  - `d47c3649`: ARC sửa chữ hợp đồng, sinh lại api-client;
  - `1e3a91fd`: BE sửa theo các thẻ review;
  - `02c34bc9`: hợp đồng ghi số cần thu khi `lateFeeAsNightVnd = 0`.
- Mã đổi ít:
  - `stay-night-pricing.ts` và `folio-lines.service.ts` mỗi tệp thêm 7 dòng;
  - test thêm 152 dòng;
  - `openapi.yaml` chỉ đổi mô tả, không đổi schema.
- SEC đọc thêm để đối chiếu:
  - `frontdesk.controller.ts`: `checkOut`, `lateFeeApprover`;
  - `checkout.service.ts`: `lateFeePrecheck`, `decide`, `lateFeeInput`;
  - `audit-fields.ts`, `frontdesk/audit-entities.ts`, `audit/public/actor-role.ts`;
  - `stay-support.ts` (`replaceLateCharge`), `folio.service.ts` (`reverseLine`);
  - các dòng audit của B13, B9a, B18.
- SEC chạy riêng `test/integration/bug-r4-038-internal-added-night.test.ts`:
  - môi trường: worktree tạm ở scratchpad, PostgreSQL 17 riêng. Vai DB tạo bằng `02-roles.sh`, migrate như CI, test chạy bằng `ottimo_app`;
  - kết quả **11/11 đạt**;
  - thử đột biến 2 lần, mỗi lần test A31 báo đỏ đúng chỗ: (1) bỏ `actorRole` khỏi audit; (2) bỏ `reason` ở audit của ca 0 đ;
  - đã khôi phục mã, xóa worktree và container. Không commit, không push.
- CI ở `02c34bc9` đỏ, nhưng không do PR này:
  - job `format · lint · audit · test · build` đỏ ở `admin-web` `v104-holds-feb.test.tsx`: 2 test không tìm thấy "Giữ chỗ chờ cọc (1)";
  - PR không đụng `product/apps`;
  - turbo dừng nên bộ test API **chưa chạy** trên CI ở đầu này. Cho tới khi CI chạy lại, kết quả 11/11 ở trên là bằng chứng duy nhất cho tệp này.

### 9.1 Kết luận

**ĐẠT, rủi ro Low, giữ kết luận lượt 1. Được gộp về mặt bảo mật ở `02c34bc9`.**
- **PR71-01 và PR71-02: Closed.**
- Không có Blocker hay Major. Có 1 Suggestion mới (thẻ 03, nhãn nguồn trong audit B13/B9a/B18). Thẻ này làm ở v1.0.5, **không** chặn gộp và **không** làm thêm commit trên #71.

### 9.2 Xác nhận thẻ

| Thẻ | SEC kiểm | Kết quả |
|---|---|---|
| PR71-01, MGR đưa về 0 | Sau lần MGR đưa về 0 có **đúng 1** dòng `reservation.repriced` mới, đếm sau dòng của FD (`slice(before + 1)`, độ dài 1). Dòng này có `actor` = MGR, `reason` = chuỗi gửi lên, `after.nightlyRates = [{date, 0}]`, `rateSource: complimentary`, `actorRole: manager`. Có **đúng 1** `folio_line.adjusted` trên dòng đang sửa, với `actor` = MGR, cùng `reason`, `after {category: room, amountVnd: 0}` | Đạt. Đột biến bỏ `actorRole` thì test đỏ ở `"actorRole": "manager"`; đột biến bỏ `reason` thì đỏ ở `reason: null` |
| PR71-01, FD bị 403 | Số dòng `reservation.repriced` không đổi. Không có `folio_line.adjusted` trên dòng. Tiền đêm và số dư folio giữ nguyên | Đạt. Lỗi 403 ném trước mọi `UPDATE` trong `setNightRate`, trong cùng giao dịch |
| PR71-01, FD gõ 1 đ | Trả 201, nguồn `manual`. Audit có `actor` = FD, đúng `reason`, `rateSource: manual`. `actorRole` vắng, vì vai chỉ ghi ở nhánh 0 đ. Test có ghi chú "INTENDED … no BR-105 floor (DOM, BR-421 (b))" | Đạt. Test chưa kiểm `folio_line.adjusted` của ca FD. Không cần thẻ, vì dòng `reservation.repriced` đã đủ người, lý do, số tiền |
| PR71-02 | `adjust` truyền `actorRole: actorRoleOf(actor.userId, actor.roles)` chỉ khi `zeroPrice`, cùng chỗ với `zeroByManager`. Cổng và vai ghi lại lấy từ cùng `actor.roles` của phiên. `actorRoleOf` luôn trả chuỗi khác rỗng (vai cao nhất, hoặc `system`/`unknown`), nên ca 0 đ luôn có vai. `reservation.actorRole` đã có trong danh sách cho phép ở `frontdesk/audit-entities.ts`. Tệp này nạp ở cả api lẫn worker (`src/audit-entities.ts`), và registry gộp trường theo entity, nên trường không bị lọc mất (test đọc được `manager` trong DB) | Đạt. Đúng là không cần đổi danh sách cho phép hay schema |

### 9.3 Bốn câu ORC hỏi

**1. Audit có đủ không, có ai đưa một đêm về 0 mà không để lại dấu vết được không? Không có đường nào như vậy.**
- **A31:** hai dòng audit tiền ghi trong cùng giao dịch với lệnh ghi.
  - Lỗi 403 hay 422 ném trước khi ghi.
  - Lỗi sau `setNightRate` (`VERSION_CONFLICT`, `FOLIO_LOCKED`, `FORBIDDEN_ACTION` của folio đã trả phòng) rollback cả lệnh ghi lẫn audit.
  - Vì vậy không có lệnh ghi nào thiếu audit, cũng không có audit nào thiếu lệnh ghi.
- **Các đường 0 đ khác của đêm Nội bộ đều có audit tiền với `amountVnd = 0` và người làm:**
  - B13: `reservation.extended`;
  - B9a: `reservation.prior_night_added`;
  - B18: `reservation.extra_night_on_checkout`;
  - tạo đơn 0 đ: bắt buộc `internalNote`.
  - Ở B18, khi đêm ngày đi được tính 0 đ, phụ thu B15 bị đảo về 0 qua `reverseLine`. Thao tác này ghi `folio.line_reversed` kèm lý do, người làm, và dòng đảo có `posted_by`.
- **Chỗ thiếu: nhãn nguồn trong audit (thẻ 03).** Số 0 đ vẫn nằm trong audit, nhưng nhãn đi kèm không nói `complimentary`:
  - B13 ghi `rateSource` một lần cho cả lệnh: `'calendar'` khi không gõ, `'manual'` khi có gõ. Vậy đêm Nội bộ 0 đ mặc định mang nhãn `calendar`, dù snapshot ghi `complimentary`;
  - B9a và B18 không ghi `rateSource`.
  - Hệ quả: bộ lọc tuần SEC đề xuất ở mục 6 lượt 1 (`reservation.repriced` + `complimentary`) chỉ bắt được A31. Bộ lọc đúng ở mục 9.5.

**2. Audit có lộ thêm dữ liệu cá nhân không? Không.**
- `actorRole` là tên vai trong danh sách cố định, không phải dữ liệu cá nhân. Luật cấm (`FORBIDDEN`) của danh sách cho phép không đổi.
- Hai dòng audit chỉ có ngày, số tiền, nguồn, vai, loại dòng. Mã đơn nằm ở `entityCode` như mọi audit tiền.
- `reason` là chữ tự do của nhân viên, như cũ: vẫn qua `requireReason` (bỏ ký tự điều khiển, 3–500 ký tự, chặn chuỗi giống số thẻ).
- Lỗi 422 chỉ trả `field` và `code`, không lặp lại `secret` hay tên đăng nhập. Log vẫn che `lateFeeInsteadOfNight.secret` ở mọi độ sâu (`http.ts`, `withoutSecrets`).
- `openapi.yaml` chỉ đổi mô tả. Test dùng dữ liệu giả: `not-the-password`, người dùng của tenant test.

**3. Đơn Nội bộ trả 422 trước khi kiểm mật khẩu. Thứ tự này không tạo oracle và không bỏ qua bộ đếm sai.**
- Thứ tự trong `checkOut`:
  1. trả lại kết quả cũ nếu Idempotency-Key đã hoàn tất;
  2. kiểm dạng thông tin xác nhận: `authMethod`, `secret` dài 6–256, `approverUsername`;
  3. `lateFeePrecheck`, giao dịch chỉ đọc:
     - `lateFeeInput`: `amountVnd = 0` trả `AMOUNT_NOT_POSITIVE`;
     - `decide`: `freeNight` trả `NOT_ALLOWED`;
     - `f.done()` ném 422;
  4. chỉ sau đó mới gọi `verifyApprover`.
- Với `postReview`, không có bước xác nhận lại. B18 từ chối trong `decide` trước mọi lệnh ghi, và giao dịch rollback.
- Test kiểm cả 3 đường: `postReview` + 0, `postReview` + 1, mật khẩu sai + 1. Cả ba trả 422, đơn vẫn `in_house`, không có `reservation.late_fee_instead_of_night`.
- **Không có oracle.** Câu trả lời không phụ thuộc `secret` hay tên đăng nhập:
  - tên không được tra, mật khẩu không được băm, nên cũng không lệch thời gian;
  - điều duy nhất lộ ra là "đêm ngày đi của đơn này là đêm Nội bộ 0 đ". Người gọi vốn đã đọc được điều này qua `checkoutSummary.lateFeeAsNightVnd = 0`, với cùng quyền theo cơ sở.
- **Không bỏ qua bộ đếm.** SR-RL-02 đếm các lần so mật khẩu sai. Đường này không so lần nào, nên không có gì để đếm. Người gọi cũng không học được gì về mật khẩu, vì đúng hay sai đều nhận cùng một câu trả lời. Vậy không dùng đường này để dò mật khẩu được.
- Cách làm khớp nguyên tắc đã có (SEC BE-64, BUG-R2-165): kiểm mọi điều kiện nghiệp vụ trước mật khẩu. Đơn kênh khác không đổi: kiểm trước, rồi trả 401 chung cho sai tên, sai mật khẩu hay thiếu vai, có đếm.
- Test không kiểm bộ đếm sai của MGR sau ca mật khẩu sai. Theo mã thì bộ đếm không thể đổi, nên không cần thẻ.

**4. Regex migration của SEC (`SEC-on-v104-ops-scripts.md` mục 5.2 (a)): sạch.**
- `git diff origin/main...02c34bc9 -- '**/migrations/*.sql'`: không tệp nào đổi, 0 dòng khớp.
- `git diff 7557e485..02c34bc9`: không tệp nào đổi, 0 dòng khớp.
- Quét cả diff `7557e485..02c34bc9` (bỏ dòng chú thích) tìm `DISABLE TRIGGER|GRANT|REVOKE|ROW LEVEL SECURITY|CREATE POLICY|SECURITY DEFINER|(CREATE|ALTER|DROP|SET) ROLE`: 0 dòng.
- Bước CI "Schema matches migrations" đã qua, vì job chỉ dừng ở bước Test chạy sau nó.

### 9.4 Thẻ mới

#### FB-R4-SEC-BE-PR71-03
- Mức độ: Suggestion
- Vị trí:
  - `frontdesk/internal/stay.service.ts`, audit `reservation.extended` (`rateSource: byDate.size > 0 ? 'manual' : 'calendar'`);
  - `checkin.service.ts`, audit `reservation.prior_night_added`;
  - `checkout.service.ts`, audit `reservation.extra_night_on_checkout`.
- Vấn đề: ở đơn Nội bộ, đêm 0 đ mặc định của B13 ghi audit `rateSource: calendar`, còn gõ 0 thì ghi `manual`. B9a và B18 không ghi nguồn. Trong khi đó snapshot và báo cáo dùng `complimentary`. Số 0 đ vẫn có, nên vẫn truy vết được, nhưng lọc theo nguồn thì chỉ thấy A31.
- Vì sao quan trọng: kiểm soát duy nhất với đêm Nội bộ là kiểm soát phát hiện, tức quản lý xem **Nhật ký tiền** (mục 1 lượt 1). Nhãn audit lệch nhãn snapshot thì người duyệt dễ sót.
- Đề xuất sửa:
  - làm ở v1.0.5: ghi nguồn theo **từng đêm** trong `nightlyRates` (hoặc thêm `rateSource` cho B9a/B18), dùng đúng nguồn của snapshot (`default`/`manual`/`complimentary`). `rateSource` đã có trong danh sách cho phép của `reservation`, nên không đổi danh sách hay schema;
  - không làm trên PR #71.
- Trạng thái: Open

### 9.5 Ghi chú cho ORC

- **Thay bộ lọc tuần ở mục 6** (việc của BA/PO, cho tới v1.0.5). Với đơn kênh Nội bộ, lọc:
  - các action `reservation.repriced`, `reservation.extended`, `reservation.prior_night_added`, `reservation.extra_night_on_checkout` có đêm `amountVnd = 0` hoặc số nhỏ;
  - `folio.line_reversed` của dòng `late_checkout`.
- **Cho DOM/PO (không phải lỗi bảo mật, rủi ro Low):** test BR-421-11 cho thấy với đơn "Nội bộ có thu", khách ở muộn hơn lại trả ít hơn:
  - kịch bản: buổi sáng B15 đã ghi phụ thu 17:00 là 150.000. Khách rời 19:00 và đêm ngày đi đã bán, nên B18 đảo phụ thu về 0. FD làm được việc này, không cần quản lý;
  - cách lạm dụng: FD bấm trả phòng trên hệ thống lúc ≥ 19:00 trong khi khách đi lúc 17:00, rồi giữ tiền mặt. FD không gõ được giờ tương lai (`TIME_AFTER_ACTION`), nên phải chờ thật;
  - truy vết: có `folio.line_reversed`, lý do "extra night on checkout 19:00", người làm, và giờ trả phòng;
  - đây là số của quy tắc DOM. Việc làm cho ca 0 đ và > 0 nhất quán đã có thẻ ARC FB-R4-ARC-BE-PR71-03 (v1.0.5). SEC chỉ đề nghị đưa vào bộ lọc tuần ở trên.
- **CI:** chạy lại job test trước khi gộp, để bộ test API (gồm tệp BUG-R4-038) chạy trên CI ở `02c34bc9`. Ca đỏ ở `admin-web` `v104-holds-feb.test.tsx` ngoài phạm vi SEC, nhờ QA/FE xem.
- Không ESC. Rủi ro Low, nằm trong quyền SEC.

### 9.6 Dòng decision-log đề xuất (ORC ghi khi commit, SEC không sửa decision-log)

`| 2026-11-05 | 4 | **SEC – PR #71 (BUG-R4-038) lượt 2 @ 02c34bc9: ĐẠT, rủi ro Low, được gộp về bảo mật** (rounds/round-04/reviews/SEC-on-v104-pr71-internal-nights.md mục 9): PR71-01 Closed (test A31 khóa audit: MGR về 0 có đúng 1 reservation.repriced complimentary + actorRole manager + reason, 1 folio_line.adjusted 0; FD 403 không audit, dữ liệu không đổi; FD 1 đ là chủ đích, nguồn manual; SEC chạy riêng tệp 11/11 và 2 đột biến đều bị bắt); PR71-02 Closed (actorRole ở nhánh 0 đ, reservation.actorRole đã trong danh sách cho phép); lateFeeInsteadOfNight của đơn Nội bộ → 422 trước mật khẩu: không oracle, không so mật khẩu nên không có gì để đếm; không migration, regex SEC 0 dòng. Suggestion mới PR71-03 (nhãn rateSource theo đêm ở audit B13/B9a/B18, v1.0.5); bộ lọc tuần Nhật ký tiền đổi theo mục 9.5; CI cần chạy lại vì ca đỏ admin-web ngoài PR làm bộ test API chưa chạy | SEC | Quyền SEC |`
