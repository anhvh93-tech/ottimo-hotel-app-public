# SEC review – Hợp đồng 0.3.8 bổ sung 3 + BR-433 (e): yêu cầu hoàn trên folio `settled`, A32 sau trả phòng là một lần miễn

- Người review: SEC | Ngày: 24/10/2026 | Round 3 Sprint 1 – Bước Phản hồi & sửa (review PR tiền)
- Nhánh:
  - BE-B `be-b/r3-0.3.8-add3`, **SHA `943e7f2`**;
  - FE-A `fe-a/fuzz-01-refund-request`, **SHA `efbccf7`**.
- Căn cứ:
  - báo cáo `outputs/BE/s1-be-b.md` mục 12;
  - review trước: `s1-SEC-on-fuzz-fixes.md` (FZ-01, FZ-02);
  - BR-433 (e) v0.4.3, BR-522 K11-06;
  - SEC F8 và SEC-BE-37 (kiểm soát yêu cầu hoàn).
- Đã đọc:
  - diff `approval.service.ts` (`decisionFloor`, `minRequiredRole`, `originActorId`, `assertNotSelf`);
  - `refunds.service.ts` (`create` cho folio `settled`);
  - `payments.service.ts` (`afterSettledMoneyChange`);
  - `folio-lines.service.ts`, `folio.service.ts`, `stay-waiver-alert.ts`;
  - migration 0085;
  - test `r3-add3-settled-credit`, `r3-br433e-a32-waiver`;
  - FE `ReservationDrawer.tsx` (nút "Đề nghị hoàn").
- Dữ liệu dùng để kiểm: toàn bộ là dữ liệu giả.

## Kết luận

| Hạng mục | Kết luận SEC |
|---|---|
| **Gộp** | **CHƯA GỘP.** 1 Blocker: FB-R3-SEC-ADD3-01 (lách kiểm soát BR-433 (e) qua yêu cầu hoàn lập tay), có tái hiện. |
| SEC FZ-01 (`approve`/`reject` xóa nợ luôn MGR+) | **Verified.** `decisionFloor` áp cho cả duyệt lẫn từ chối, bất kể `required_role` đã lưu. Test có ca dòng cũ `front_desk_lead` → 403. |
| `afterSettledMoneyChange` (A32 / `recordPayment` / `confirmPaymentReceived`) | Đạt. Chạy trong cùng giao dịch, dưới khóa L1 → L3. Người xin là người bấm. Đường tự động không tạo yêu cầu: J15 chờ (`waiting_refund`) và mở "Cần chú ý". |
| Yêu cầu hoàn tự sinh từ A32 | Đạt khi đi **một mình**. Định tuyến: Σ hoàn từ A32 > cơ sở hạn mức, hoặc cơ sở null → `owner`. Người làm A32 duyệt → 403, có thêm CHECK `approval_request_origin_check` ở CSDL. `reason_note` ghi rõ nguồn A32. Σ ESC-026 có cộng phần giảm sau trả phòng; tăng tay rồi hạ lại không bị tính. |
| `createRefundRequest` trên folio `settled` | **Mở đường lách** (FB-01): yêu cầu lập tay không mang nguồn A32 và không đi theo định tuyến BR-433 (e). |
| Migration 0085 | Đạt. `folio_settled_reduction` chỉ thêm (app chỉ có SELECT, INSERT), có RLS FORCE. Có CHECK vai và số tiền. Xem thêm FB-03. |

## Kiểm đã chạy
Chạy trên worktree tách riêng ở `943e7f2`, Postgres 17 mới, migrate từ đầu; đã gỡ sau khi chạy.
1. `r3-add3-settled-credit`, `r3-br433e-a32-waiver`, `r3-bug-002-credit-after-checkout`: **16/16 đạt**.
2. Test dò tạm của SEC (không commit, đã xóa). Hai ca P1 và P2 ở FB-01 đều tái hiện được, kết quả ghi trong thẻ.

## Thẻ feedback

### FB-R3-SEC-ADD3-01
- Mức độ: **Blocker** (lách kiểm soát tiền ra mà chính PR này đặt ra; sai tiền)
- Vị trí:
  - `refunds.service.ts` `create`: nay nhận folio `settled`, nhưng không gắn `origin_actor_id`, không tính Σ A32, không đặt `minRequiredRole`;
  - `approval.service.ts` `cancel`: người xin tự hủy được yêu cầu hoàn tự sinh;
  - cách tính Σ hoàn từ A32 bỏ qua yêu cầu bị hủy hoặc từ chối;
  - FE `ReservationDrawer.tsx`: nút "Đề nghị hoàn" hiện với mọi `unhandledCreditVnd` > 0.
- Vấn đề, tái hiện trên DB thật (dữ liệu giả):
  - **P1 – người làm A32 tự duyệt hoàn tiền:**
    1. MGR void một đêm khách đã trả → yêu cầu hoàn tự sinh 667.000 (`origin = mgr`, `manager`).
    2. **Chính MGR đó hủy yêu cầu → 200.**
    3. Lễ tân thấy "Cần chú ý" tiền dư, bấm "Đề nghị hoàn" 667.000 → 201, `origin_actor_id = null`.
    4. **Chính MGR đã làm A32 duyệt → 200 `approved`.**
  - **P2 – lách quyết định của OWN:**
    1. MGR void hai đêm → yêu cầu thứ hai 750.000 vượt cơ sở, chuyển `owner`.
    2. **OWN từ chối.**
    3. Lễ tân bấm "Đề nghị hoàn" 750.000 → 201, `manager`.
    4. **MGR thứ hai duyệt → 200.** Khi cơ sở chỉ có một MGR thì chính MGR làm A32 cũng duyệt được, như P1.
- Vì sao quan trọng:
  - BR-433 (e) và FZ-02 đặt ra để A32 giảm sau trả phòng không thành đường đưa tiền ra mà không có OWN và không có người thứ hai độc lập.
  - Với P1/P2, chỉ cần một MGR cùng một lễ tân **làm đúng việc** (màn và "Cần chú ý" đều mời lập yêu cầu) là tiền phòng khách đã trả bị hoàn. Bỏ qua cả định tuyến OWN, cả quyết định từ chối của OWN, cả luật "người làm A32 không duyệt".
  - Lỗi đi kèm đúng thay đổi của PR này (`create` trên `settled`). Trước đây, sau trả phòng chỉ có đường tự sinh.
- Đề xuất sửa (ARC chốt hợp đồng, DOM xác nhận):
  1. **Gắn nguồn theo folio, không theo yêu cầu.** Mọi yêu cầu hoàn trên folio `settled`, kể cả lập tay qua `createRefundRequest`, đều được định tuyến theo BR-433 (e). Tính Σ từ `folio_settled_reduction` của vai dưới OWN (phần giảm đã ghi, không bị hủy hay từ chối làm giảm) so với cơ sở hạn mức: vượt hoặc cơ sở null → `owner`.
  2. **Người không được duyệt = mọi người đã làm A32 giảm trên folio đó** (bản ghi `folio_settled_reduction` dưới OWN), không chỉ `origin_actor_id` của một yêu cầu. Kiểm ở `assertNotSelf` cho mọi yêu cầu hoàn của folio. Nên có CHECK hoặc trigger ở CSDL tương ứng.
  3. **OWN đã từ chối thì không hạ cấp.** Folio có yêu cầu hoàn bị OWN từ chối → mọi yêu cầu hoàn sau trên folio đó cần `owner`, cho tới khi OWN tự xử lý.
  4. **Không cho người làm A32 tự hủy yêu cầu tự sinh**, hoặc hủy thì không làm mất Σ: Σ tính theo phần giảm, không theo yêu cầu.
  5. FE: nút "Đề nghị hoàn" trên folio `settled` hiện câu "Sẽ chờ chủ cơ sở duyệt" khi server báo định tuyến `owner` (không cần đổi quyền ở FE).
  6. Test: P1, P2 và biến thể "MGR làm A32 + FD lập tay + cùng MGR duyệt" → 403 hoặc `owner`. QA đưa vào fuzz, kèm bất biến I18: "không yêu cầu hoàn nào trên folio có A32 giảm dưới OWN được duyệt bởi người đã làm A32 đó, và Σ > cơ sở ⇒ người duyệt là OWN".
- Trạng thái: Open

### FB-R3-SEC-ADD3-02
- Mức độ: Minor
- Vị trí: `afterSettledMoneyChange` gọi từ `recordPayment` / `confirmPaymentReceived`.
- Vấn đề: lễ tân ghi thu thừa (ví dụ gõ nhầm số), thì yêu cầu hoàn tự sinh có `requested_by` = lễ tân đó. Kiểm soát F8 vẫn giữ (người xin không duyệt, yêu cầu hoàn không tự áp). Nhưng một khoản thu tiền mặt "thừa" gõ khống, rồi được hoàn, là cách rút quỹ quen thuộc.
- Vì sao quan trọng: không lách được một mình, vì phải có MGR/OWN duyệt. Nhưng người duyệt cần thấy nguồn gốc của yêu cầu.
- Đề xuất sửa: `reason_note` của yêu cầu sinh từ khoản thu ghi "Tự sinh từ khoản thu <mã> <phương thức>". Với tiền mặt, nên yêu cầu khoản thu đã đối soát hoặc bàn giao ca trước khi được duyệt. DOM chọn.
- Trạng thái: Open

### FB-R3-SEC-ADD3-03
- Mức độ: Minor
- Vị trí: migration 0085, cột `approval_request.origin_actor_id`.
- Vấn đề: chú thích ghi "Written at INSERT only", nhưng không có gì ở CSDL ngăn `UPDATE` cột này nếu `ottimo_app` có quyền UPDATE cả bảng `approval_request`. Xóa `origin_actor_id` là gỡ được cả CHECK lẫn luật 403.
- Đề xuất sửa: đổi quyền UPDATE của `ottimo_app` trên `approval_request` sang quyền theo cột, không gồm `origin_actor_id`. Hoặc thêm trigger chặn đổi giá trị khác NULL. Thêm test kiến trúc.
- Trạng thái: Open

### FB-R3-SEC-ADD3-04
- Mức độ: Suggestion
- Vị trí: `reporting/internal/attention-sources.ts` còn hằng `DEBT_WRITE_OFF_REASON` riêng (BE báo, ngoài module BE-B).
- Đề xuất sửa: chủ module đổi sang import `DEBT_WRITE_OFF`, kèm test kiến trúc "chỉ một chuỗi `'debt_write_off'` trong `src`".
- Trạng thái: Open

## Điều kiện để SEC cho gộp
1. Sửa FB-01 theo điểm 1–4. Có test P1, P2 và biến thể trong PR. SEC review lại diff.
2. FE: không cần đổi quyền, chỉ cần hiện định tuyến (điểm 5). Có thể gộp cùng lượt.
3. FB-02, FB-03, FB-04 không chặn gộp; FB-03 nên làm trong round.

## Điểm làm tốt
1. `decisionFloor` đóng FZ-01 cho cả duyệt lẫn từ chối, kể cả dòng cũ.
2. Bảng `folio_settled_reduction` chỉ thêm, ghi vai lúc làm. Đây là nền đúng để sửa FB-01 theo folio thay vì theo yêu cầu.
3. Một hàm K11-06 dùng chung cho mọi đường có người bấm. Đường tự động không tạo yêu cầu, J15 có lưới an toàn.

---

## Review lại – BE-B `43abb0b`, FE-A `9633211` (24/10/2026)

- Bản sửa BE-B (`43abb0b`) gồm:
  - một hàm định tuyến chung `FolioService.refundRouting`, được `ApprovalService.submit` gọi cho **mọi** yêu cầu hoàn (lập tay, từ khoản thu, từ A32, yêu cầu thay thế khi bị `superseded`);
  - cột `origin_actor_ids` (danh sách) và `refund_source` (`a32` | `other`), cùng CHECK `approval_request_origin_check`, `approval_request_origin_scope_check`, `approval_request_refund_source_check`, và trigger khóa hai cột này, tức chỉ ghi lúc INSERT;
  - `isA32Maker` được kiểm lại **lúc duyệt**, nên bắt cả trường hợp có người làm A32 sau khi yêu cầu đã được tạo;
  - người làm A32 không tự hủy được yêu cầu tự sinh (403);
  - folio có A32 giảm của vai dưới OWN thì mọi yêu cầu hoàn nguồn `other` đều về `owner`.
- Bản sửa FE-A (`9633211`): thông báo sau khi lập yêu cầu nói rõ "chờ chủ cơ sở duyệt" khi server định tuyến `owner`; MSW theo hợp đồng.
- Kiểm đã chạy, trên worktree tách riêng ở `43abb0b`, Postgres 17 mới, migrate từ đầu; đã gỡ sau khi chạy:
  - `tsc` đạt;
  - toàn bộ `test/integration/s438-r8/` và `test/fuzz/bug-r3-00*`: **12 tệp, 85/85 đạt**.
- Chạy lại test dò P1, P2 của SEC, thêm P3 (không commit, đã xóa):

| Ca | Kết quả |
|---|---|
| P1 – MGR void đêm đã trả → yêu cầu tự sinh (`a32`, origin = MGR) | MGR tự hủy → **403**. Lễ tân lập tay khi tiền dư đã có yêu cầu → 422 `max 0`. MGR làm A32 duyệt yêu cầu tự sinh → **403**. |
| P1 tiếp – MGR2 từ chối, lễ tân lập tay lại | Yêu cầu mới `other`, **`owner`**, origin = [MGR]. MGR làm A32 duyệt → **403**. MGR2 duyệt → **403** (chưa đủ vai). |
| P2 – yêu cầu đã chuyển OWN, OWN từ chối, lễ tân lập tay lại | Yêu cầu mới **`owner`**. MGR2 → **403**; MGR → **403**. Quyết định của OWN không bị lách. |
| P3 – MGR2 làm A32 trên folio **sau khi** yêu cầu đầu đã tạo | MGR2 duyệt yêu cầu đầu → **403** (`isA32Maker` lúc duyệt). |
| P3 – `UPDATE origin_actor_ids = '{}'` bằng SQL với role `ottimo_app` | **Bị từ chối** (`42501`: không có quyền UPDATE trên cột; trigger chặn thêm một lớp). |

### Trạng thái thẻ

| ID | Mức | SEC xác nhận |
|---|---|---|
| FB-R3-SEC-ADD3-01 | Blocker | **Verified** ở `43abb0b`: P1, P2, P3 đều bị chặn; một hàm định tuyến dùng chung cho mọi đường; người làm A32 không duyệt, kể cả khi làm A32 sau; nguồn `other` trên folio có A32 → `owner`. |
| FB-R3-SEC-ADD3-02 | Minor | Đạt phần ghi nguồn: tham số `receipt` của `afterSettledMoneyChange` ghi ghi chú "từ khoản thu". Phần "tiền mặt phải đối soát trước khi duyệt" chờ DOM, không chặn. |
| FB-R3-SEC-ADD3-03 | Minor | **Verified**: không có quyền UPDATE theo cột cho hai cột này, cộng trigger `approval_request_refund_origin_immutable`. |
| FB-R3-SEC-ADD3-04 | Suggestion | Còn mở (module `reporting`), không chặn. |

### Nhận xét, không lập thẻ
- Bước tăng tay rồi hạ lại sau trả phòng không ghi vào `folio_settled_reduction`. Vì vậy nếu khách đã trả cả phần tăng, tiền dư phát sinh khi hạ lại sẽ đi đường `other` không có sàn `owner`.
- Chấp nhận được: đó là tiền khách trả thêm và nhận lại đúng số đó, không có phần miễn thu; yêu cầu vẫn phải qua người thứ hai (F8).
- QA nên đưa ca này vào fuzz cùng I17/I18.

### Kết luận
**Gộp được:** BE-B `43abb0b` cùng FE-A `9633211`, gộp cùng lượt. Không còn Blocker hay Major của SEC. Còn mở: ADD3-02 phần đối soát tiền mặt (chờ DOM), ADD3-04 (Suggestion).
