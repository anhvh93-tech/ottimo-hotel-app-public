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
- Trạng thái: Open

### FB-R4-SEC-BE-PR71-02
- Mức độ: Suggestion
- Vị trí: `stay-night-pricing.ts` `setNightRate`, `audit.recordMoney` cuối hàm; `reservations/audit-entities.ts`.
- Vấn đề: cổng của ca 0 đ dựa vào vai, nhưng audit chỉ ghi `actor_user_id`, không ghi vai lúc làm. Ở folio đã trả phòng, `folio-lines` đã ghi `actorRole` (BR-433 (e)), còn nhánh này thì chưa.
- Vì sao quan trọng: người duyệt **Nhật ký tiền** về sau, khi vai người đó đã đổi, không thấy ngay lần đưa về 0 có qua đúng cổng OWN/MGR không.
- Đề xuất sửa: với nhánh `complimentary`, thêm `actorRole` vào `after` (dùng `actorRoleOf`, truyền từ `adjust`) và vào danh sách cho phép của `reservation`. Làm ở v1.0.5 cũng được.
- Trạng thái: Open

## 6. Ghi chú cho ORC

- Không ESC. Rủi ro Low, nằm trong quyền SEC.
- Nếu PO/DOM muốn quy tắc "giảm tiền đêm Nội bộ là việc của quản lý" (PA 3 ở mục 2), đó là quy tắc nghiệp vụ mới cho v1.0.5. Quy tắc phải áp cho mọi đường (A31, B7, B13), không chỉ A31.
- Việc tạm cho tới v1.0.5, thuộc BA/PO: quản lý xem **Nhật ký tiền** mỗi tuần, lọc `reservation.repriced` của đơn Nội bộ (nguồn `manual` có số nhỏ, hoặc `complimentary`).
- Desk: ô **Điều chỉnh** nhận 0 (tệp BE 037 mục 1.8), nên FD gõ 0 sẽ gặp 403. FE/UXD nên có câu báo rõ "Chỉ quản lý đưa đêm Nội bộ về 0 đ". Đây không phải việc bảo mật.

## 7. Điểm làm tốt

- Cổng nằm ở máy chủ, và cờ được tính từ vai của phiên, không tin dữ liệu client.
- Mặc định là từ chối: giá 0 bị chặn ở cả `folio-lines` lẫn `setNightRate`, cho mọi kênh khác `internal` và mọi loại dòng khác `room`.
- Đêm đưa về 0 mang nguồn `complimentary` chứ không phải `manual`. Nhờ vậy Q4/Q5 và báo cáo phân biệt được đêm đã gỡ đúng với đêm gõ tay.

## 8. Dòng decision-log đề xuất (ORC ghi khi commit, SEC không sửa decision-log)

`| 2026-11-04 | 4 | **SEC – PR #71 (BUG-R4-038) điểm quyền A31 (v104/fix-internal-added-night @ 7557e485): ĐẠT, rủi ro Low, giữ như hiện tại** (rounds/round-04/reviews/SEC-on-v104-pr71-internal-nights.md): đêm Nội bộ về 0 chỉ OWN/MGR, cờ tính ở máy chủ từ vai của phiên; kênh khác, dòng khác room, folio đã trả phòng → 422; lý do bắt buộc (requireReason), audit tiền reservation.repriced (rateSource complimentary) + folio_line.adjusted. FD gõ 1 đ là hành vi có từ trước (đêm Nội bộ không áp sàn – DOM), không phải lỗ mới; FD còn đường B13/B7 về 0 hợp lệ, nên không đặt ngưỡng theo sàn Trực tiếp. Minor 01 (test khóa audit ca 0 đ, ghi ca 1 đ là chủ đích), Suggestion 02 (ghi actorRole); không chặn gộp | SEC | Quyền SEC |`
