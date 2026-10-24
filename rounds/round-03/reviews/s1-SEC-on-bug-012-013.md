# SEC review – BUG-R3-012 (P0) / BUG-R3-013 (P1): yêu cầu hoàn theo tiền dư sau trả phòng, J15 không chờ mãi

- Người review: SEC | Ngày: 24/10/2026 | Round 3 – Phản hồi & sửa (review PR tiền)
- Nhánh: `be-b/r3-bug-012-013`, **SHA `2f1d738`** (mã ở `67f4e07`, `2f1d738` chỉ thêm báo cáo).
- Căn cứ:
  - `qa/bug-list.md` BUG-R3-012/013; critic B-1 / M-1;
  - BR-522 K11-06, BR-433 (e);
  - các review trước của SEC: `s1-SEC-on-add3.md` (ADD3-01), `s1-SEC-on-fuzz-fixes.md`.
- Đã đọc diff `approval.service.ts` (`cancelApproved` nhận `superseded`, chạy hook của yêu cầu hoàn), `folio-lines.service.ts`, `folio.service.ts`:
  - `closeAfterWindow` (J15);
  - `afterSettledMoneyChange`, `replanSettledRefunds`, `refundsDownToCredit`;
  - `carriedOrigin`, `replacementActor`.
- Dữ liệu dùng để kiểm: toàn bộ là dữ liệu giả.

## Kết luận

| Hạng mục | Kết luận SEC |
|---|---|
| **Gộp** | **Gộp được** ở `2f1d738`. **Không có Blocker, không có Major.** |
| Mất `origin_actor_ids` qua bản thay thế? | **Không.** Bản thay thế lấy **hợp** `origin_actor_ids` của mọi yêu cầu nó thay (`carriedOrigin`). Lúc `submit`, `refundRouting` còn cộng thêm mọi người đã làm A32 trên folio (`folio_settled_reduction`). Lúc duyệt, `isA32Maker` kiểm lại lần nữa. Cột này bị khóa ở CSDL: quyền UPDATE theo cột cộng trigger (0085). SEC dò: void hai đêm, rồi ghi phát sinh 800.000 → hai yêu cầu cũ `superseded`, bản thay 534.000 vẫn `a32`, origin = [MGR]. |
| Hạ định tuyến owner → manager? | **Có thể, nhưng không phải đường lách.** Bản thay được định tuyến lại bằng **cùng một hàm** `refundRouting`, theo Σ các yêu cầu hoàn `a32` còn sống (bỏ yêu cầu đã hủy/từ chối) cộng số mới, so với cơ sở. Tiền dư giảm thì số xin lại nhỏ hơn, nên có thể về `manager` **khi** Σ ≤ cơ sở, tức đúng phần MGR được duyệt nếu đi từ đầu. OWN đã được ESC-026 báo khi có lần giảm (Σ lượt). Ở ca dò của SEC, bản thay vẫn `owner` (không còn đêm sống → cơ sở null). Xem FB-01 (Minor) về việc khóa "không hạ cấp". |
| Bản thay do J15 tạo (không có người bấm) | **Không lách self-approval.** Người xin của bản thay = người làm A32 (với nguồn `a32`) hoặc người xin của yêu cầu cũ nhất bị thay. Không bao giờ là người duyệt cũ, cũng không phải "hệ thống" để né F8. Người xin không duyệt được (F8). Người làm A32 không duyệt được (origin + `isA32Maker`). Yêu cầu thay thế không tự áp (F8). |
| Đóng yêu cầu đã duyệt chưa chi khi tiền dư = 0 | Đạt. `cancelApproved(..., 'superseded')` có audit, báo người xin và người duyệt, chạy hook xóa tài khoản nhận (SEC-BE-45), nên không còn đường chi tiền. Khi tiền dư > 0 thì yêu cầu đã duyệt được giữ lại, phần chi vẫn bị kẹp theo tiền dư. |
| J15 ghi nợ và đóng folio | Đạt. J15 tính lại kế hoạch hoàn trước, rồi chỉ chờ khi **còn tiền phải trả lại** (`openRefundVnd > 0` và `rawCreditVnd > 0`). Khách đang nợ thì ghi công nợ (BR-427 (d)) và đóng folio, đóng luôn "Cần chú ý" `closed_reservation_credit`. Hết lỗi P0 "chờ mãi". |

## Kiểm đã chạy
Chạy trên worktree tách riêng ở `2f1d738`, Postgres 17 mới, migrate từ đầu; đã gỡ sau khi chạy.
1. `r3-bug-012-013`, `fuzz/bug-r3-012`, `r3-add3-settled-credit`, `r3-br433e-a32-waiver`, cùng test dò của SEC: **31/31 đạt**.
2. Test dò tạm của SEC (không commit, đã xóa):
   - MGR void hai đêm → hai yêu cầu `a32` (`manager`, `owner`), origin = [MGR];
   - ghi phát sinh 800.000 → hai yêu cầu cũ `cancelled`, bản thay 534.000 `owner`, `a32`, origin = [MGR], người xin = MGR (người làm A32);
   - MGR duyệt → 403; MGR2 duyệt → 403 (yêu cầu ở mức `owner`).

## Thẻ feedback

### FB-R3-SEC-1213-01
- Mức độ: Minor (phòng thủ nhiều lớp)
- Vị trí: `folio.service.ts` `refundsDownToCredit` → `submitStayRefund` (bản thay thế).
- Vấn đề: bản thay được định tuyến lại từ đầu, nên nó có thể ở mức **thấp hơn** yêu cầu mà nó thay (`owner` → `manager`), khi Σ yêu cầu `a32` còn sống cộng số mới không vượt cơ sở. Theo BR-433 (e) hiện hành thì đúng. Nhưng lần OWN chưa kịp xem được thay bằng một yêu cầu MGR khác duyệt được mà không ai báo OWN, và đường này phụ thuộc vào việc tiền dư giảm (do một khoản phát sinh ai đó ghi).
- Đề xuất sửa:
  - bản thay giữ `minRequiredRole` = vai cao nhất của các yêu cầu nó thay (chỉ tăng, không giảm);
  - thêm ca test "owner → thay → vẫn owner";
  - DOM xác nhận đây là đúng nghiệp vụ: "một yêu cầu viết lại đúng số" không đổi cấp duyệt.
- Trạng thái: Open

### FB-R3-SEC-1213-02
- Mức độ: Minor (khả dụng, không phải lách)
- Vị trí: `replacementActor` khi người đang thao tác là OWN và nguồn là `other`, trên folio có A32 của vai dưới OWN, nên định tuyến `owner`.
- Vấn đề: bản thay có người xin là OWN, cấp duyệt `owner`. F8 cấm OWN duyệt yêu cầu hoàn của chính mình, mà vai dưới OWN không đủ cấp. Với cơ sở chỉ có một OWN thì **không ai duyệt được**, tiền dư của khách bị kẹt; J15 chờ (`waiting_refund`) và "Cần chú ý" vẫn mở.
- Đề xuất sửa:
  - khi người thao tác là OWN, giữ người xin cũ, như nhánh J15 `firstRequester`;
  - hoặc ghi rõ cách xử lý trong runbook (OWN hủy rồi để lễ tân lập lại);
  - thêm test.
- Trạng thái: Open

## Ca thêm cho fuzz R3-Q30
1. Bất biến I19: mọi bản thay `superseded` có `origin_actor_ids` ⊇ hợp origin của các yêu cầu bị thay, và `refund_source = a32` nếu có ít nhất một yêu cầu bị thay là `a32`.
2. Bất biến I20: không yêu cầu hoàn nào được duyệt bởi người xin của nó, hay bởi người có trong `folio_settled_reduction` (dưới OWN) của folio đó, kể cả bản do J15 tạo.
3. Sau J15: folio `closed` ⇒ không còn yêu cầu hoàn `pending`/`approved` chưa chi đủ, và tiền dư = 0.

## Điểm làm tốt
1. Một hàm lập lại kế hoạch (`refundsDownToCredit`) dùng chung cho A32, phát sinh sau trả phòng, giá bồi thường hư hỏng được duyệt và J15. Không viết thêm đường hoàn tiền mới.
2. Bản thay luôn mang theo nguồn, ghi chú và danh sách người không được duyệt. Kiểm lúc duyệt vẫn còn, nên không có cách "rửa" origin qua `superseded`.
3. Yêu cầu không còn gì để trả bị đóng **kèm** xóa tài khoản nhận, không để một yêu cầu "approved" treo có thể bị chi về sau.

---

## Xác nhận nhanh – `be-b/r3-bug012-followups` `69a5398` (24/10/2026)

- Đã đọc diff `approval.service.ts` (`RefundApprovalCheck`), `approvals.controller.ts` (409 `superseded`), `folio.service.ts` (`refundAboveFreeCredit`, `carriedOrigin.minRequiredRole`, `replacementActor`).
- Đã chạy, trên worktree tách riêng, Postgres mới; đã gỡ sau khi chạy: `tsc` đạt; `r3-bug012-followups` (4 ca mới), `r3-bug-012-013`, `r3-add3-settled-credit`, `r3-br433e-a32-waiver`, `fuzz/bug-r3-012`: **34/34 đạt**.

| Thẻ | SEC xác nhận |
|---|---|
| FB-R3-SEC-1213-01 | **Verified.** Bản thay mang `minRequiredRole` = cấp cao nhất của các yêu cầu bị thay, nên chỉ có thể giữ nguyên hoặc nâng, không hạ. Có ca "owner → thay đúng số MGR được duyệt → vẫn owner". |
| FB-R3-SEC-1213-02 | **Verified.** Khi OWN thao tác, hoặc J15 chạy không có người bấm, bản thay giữ người xin của yêu cầu cũ nhất. Riêng nguồn `a32` thì giữ người làm A32. Như vậy OWN vẫn duyệt được, và không ai trong danh sách bị cấm thành người duyệt. |
| ARC BUG012-01 (lớp chặn ở bước duyệt) | **Đạt.** Lớp chặn chạy **sau** các kiểm F8, người làm A32 và cấp duyệt, nên chỉ người đủ quyền mới kích được việc lập lại kế hoạch. Nếu số xin > tiền dư còn trống (trừ phần các yêu cầu đã duyệt khác chưa chi), yêu cầu bị `superseded` và xin lại đúng số. Thay đổi này được commit, rồi trả 409. Không yêu cầu nào được duyệt vượt tiền dư. |

**Kết luận: gộp được ở `69a5398`.** Không còn Blocker/Major/Minor của SEC cho BUG-R3-012/013.
