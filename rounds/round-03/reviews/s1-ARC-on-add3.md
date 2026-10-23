# ARC review – Hợp đồng 0.3.8 bổ sung 3 + BR-433 (e): BE-B `943e7f2` và FE-A `efbccf7`

- Người review: ARC | Round 3 – Sprint 1, bước Phản hồi & sửa (PR tiền, review bắt buộc) | Ngày: 24/10/2026
- Đối tượng:
  - BE-B: nhánh `be-b/r3-0.3.8-add3` `943e7f2`, gồm migration `0085_settled_reduction_a32_refund`; báo cáo `outputs/BE/s1-be-b.md` mục 12.
  - FE-A: nhánh `fe-a/fuzz-01-refund-request` `efbccf7`.
- Đối chiếu:
  - `s1-contracts.md` mục 13.2 (bổ sung 3, `ee88134`);
  - BR-433 (e) v0.4.3; oracle DOM mục 5.5 FZ02-1…8, I17;
  - review `s1-ARC-on-fuzz-fixes.md` FUZZ-01/02/03; SEC FZ-01/FZ-02.

## Kết luận
**Chưa gộp được.** Có **1 Blocker (ADD3-01)**: bỏ qua được quy tắc BR-433 (e) bằng cách xin lại khoản hoàn qua đường tay. ARC đã tái hiện bằng test.

Lỗ này mở ra do hợp đồng bổ sung 3 của chính ARC (cho `createRefundRequest` trên folio `settled`) gặp BR-433 (e). ARC chịu phần hợp đồng và chốt cách sửa dưới đây.

Ngoài Blocker, phần còn lại đúng. Sửa ADD3-01, FE-A rebase (ADD3-02), SEC xem lại FZ-02 trên head mới, thì gộp được.

**Đã chạy:**
- Gộp thử `943e7f2` vào `main` `d5d963b` (đã có harness fuzz cuối của QA): không xung đột; `tsc` đạt; `drizzle-kit generate` không sinh file.
- Toàn bộ api: **124 tệp đạt (2 bỏ qua), 3.134 test đạt (19 bỏ qua)**.
- Probe ARC (không commit; tệp giữ ở `/private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/arc-probe-a32-bypass.test.ts`), 2/2 ca chạy ra đúng lỗ ở ADD3-01.
- FE-A `efbccf7`: gộp với `main` **xung đột** ở các tệp chuỗi (`strings-*.json`, `gen_strings.py`, `strings-tables.md`, `strings.js`) – xem ADD3-02.

**Đúng hợp đồng 13.2:**
- `createRefundRequest` nhận folio `settled`; folio `closed` → 409.
- Một hàm `afterSettledMoneyChange` dùng chung cho ba đường có người bấm, đặt dưới L1 → L3.
- `refundPlan` chạy lại với `superseded` (FUZZ-02).
- Một hằng `DEBT_WRITE_OFF` (FUZZ-03).
- `decisionFloor` cho cả approve và reject (SEC FZ-01).
- Bảng `folio_settled_reduction` chỉ thêm, có RLS và FK.
- Ghi chú "Tự sinh từ A32" hiện được cho người duyệt: `ApprovalsPage` đã hiện `reasonNote`, FE không phải sửa.

## Thẻ feedback

### FB-R3-ARC-ADD3-01
- Mức độ: **Blocker**
- Vị trí:
  - `payments/internal/refunds.service.ts` `create`;
  - `folio.service.ts` `afterSettledMoneyChange` (nhánh `closeStayCredit` không có A32), `closeStayCredit`, `submitStayRefund`;
  - `approvals` `approve`;
  - migration `0085` (`origin_actor_id` một giá trị).
- Vấn đề: quy tắc BR-433 (e) chỉ gắn vào **yêu cầu do A32 tự sinh**. Tiền dư đó xin lại bằng đường khác thì đi theo đường hoàn BR-522 thường (MGR+, không có nguồn A32), nên chính người làm A32 duyệt được. ARC tái hiện trên `943e7f2` gộp `main`:
  1. MGR void dòng F&B 1.500.000 (> cơ sở) → yêu cầu tự sinh `required_role = owner`, `origin_actor_id = MGR`.
  2. (a) OWN **từ chối**, hoặc (b) chính MGR **hủy** yêu cầu của mình (200).
  3. FD gọi `createRefundRequest` 1.500.000 trên folio `settled` → 201, `required_role = manager`, không có nguồn.
  4. **MGR vừa làm A32 duyệt → 200 `approved`**.

  Cùng lỗ đó qua `recordPayment`/`confirmPaymentReceived`: khoản thu dư nhỏ bất kỳ → `closeStayCredit` xin **cả** tiền dư chưa yêu cầu (gồm phần OWN vừa từ chối) theo đường thường.
- Vì sao quan trọng:
  - MGR tự giảm tiền rồi tự duyệt chi lại cho khách, vượt cơ sở hạn mức và vô hiệu quyết định từ chối của OWN;
  - đúng lớp lỗi SEC FZ-02 / FB-07 (lách hạn mức);
  - với OTTIMO (một MGR), chỉ cần MGR nhờ FD bấm một nút.
- Đề xuất sửa (quyết định ARC; DOM xác nhận câu nghiệp vụ, oracle FZ02 không đổi):
  1. **Một hàm định tuyến** cho mọi yêu cầu hoàn mức folio, ví dụ `FolioService.refundRouting(tx, folioId, amountVnd, source: 'a32' | 'other')`. Mọi đường xin hoàn trên folio gọi hàm này: `submitStayRefund`, `closeStayCredit` (cả yêu cầu `superseded`), `refundsDownToCredit`, `RefundsService.create`.
  2. Folio `settled` có ít nhất một dòng `folio_settled_reduction` của vai dưới OWN:
     - **`source = 'a32'`** (do A32 tự sinh): giữ đúng như hiện nay. Σ hoàn từ A32 (chờ, đã duyệt, mới; bỏ từ chối/hủy) > cơ sở, hoặc cơ sở null → `owner`; còn lại → `manager`. Khớp FZ02-1…8.
     - **`source = 'other'`** (tạo tay, từ `recordPayment`, `confirmPaymentReceived`) → **`owner`**. Lý do: trên folio này không tách được phần tiền dư nào do A32 sinh ra; ca thật hiếm (QR về muộn dư trên folio đã có A32 giảm); OTTIMO một MGR nên ca A32 vốn đã lên OWN.
  3. **Người không được duyệt**: mọi người làm A32 giảm (dưới OWN) trên folio. Đổi cột trong `0085` (chưa gộp, đổi tự do) thành **`origin_actor_ids uuid[] NOT NULL DEFAULT '{}'`**:
     - CHECK `cardinality(origin_actor_ids) = 0 OR type = 'refund'`;
     - CHECK `approver_id IS NULL OR NOT (approver_id = ANY(origin_actor_ids))`.

     Gán cho cả yêu cầu `source = 'other'` trên folio đó. Yêu cầu `superseded` chép mảng.
  4. Test bắt buộc:
     - hai ca của probe (OWN từ chối; người xin hủy) → yêu cầu tay thành `owner`, MGR làm A32 duyệt → 403;
     - một ca `recordPayment` dư trên folio có A32 → `owner`;
     - folio **không** có A32 → `createRefundRequest` trên folio `settled` vẫn là `manager` (không làm nặng ca QR về muộn thường);
     - FZ02-1…8 vẫn đúng số.
  5. QA thêm vào fuzz: thao tác "người xin hủy yêu cầu hoàn" và "tạo yêu cầu hoàn tay" sau A32, kèm bất biến I17 mở rộng: không yêu cầu hoàn nào trên folio có A32 dưới OWN được duyệt bởi người làm A32, hoặc bởi vai < `owner` khi yêu cầu không do A32 tự sinh.
- Trạng thái: Open

### FB-R3-ARC-ADD3-02
- Mức độ: Major (điều kiện gộp – thao tác rebase)
- Vị trí: FE-A `efbccf7` – `product/design/copy/strings-en.json`, `strings-vi.json`, `design/tools/gen_strings.py`, `strings-tables.md`, `wireframes/assets/strings.js`
- Vấn đề: nhánh tách từ `ee88134`. `main` đã gộp thêm chuỗi của FE-A khác (ngày kinh doanh, R3-Q39), nên gộp thẳng bị xung đột ở cả 5 tệp chuỗi.
- Đề xuất sửa:
  - FE-A rebase lên `main`, hợp khóa chuỗi trong `gen_strings.py`/`strings-*.json`, rồi **sinh lại** `strings.js` bằng `gen_strings.py` (không sửa tay); chạy lại test admin-web;
  - chuỗi mới chờ UXD duyệt theo brand OTTIMO;
  - sau ADD3-01, câu báo khi yêu cầu tay chuyển `owner` dùng câu sẵn có của trạng thái chờ chủ đầu tư; không cần chuỗi mới.
- Trạng thái: Open

### FB-R3-ARC-ADD3-03
- Mức độ: Minor
- Vị trí: `reporting/internal/attention-sources.ts` (`DEBT_WRITE_OFF_REASON` riêng, BE-B đã nêu)
- Vấn đề: vẫn còn hằng thứ hai cho `debt_write_off` (FUZZ-03 chưa xong hẳn).
- Đề xuất sửa: chủ module `reporting` (BE-D) import `DEBT_WRITE_OFF` từ `approvals/public`. Có thể làm trong cùng PR nếu ORC cho BE-B chạm một dòng import.
- Trạng thái: Open

## Trả lời giả định BE-B (mục 12)
1. **Số migration 0085: đồng ý.** `main` hiện dừng ở 0084, không nhánh cục bộ nào khác giữ 0085. Snapshot `prevId` = 0084, `drizzle-kit generate` trên bản gộp thử không sinh file. Khi sửa ADD3-01 (đổi cột thành mảng), sửa luôn trong `0085` và sinh lại snapshot – không tạo 0086.
2. **Σ ESC-026 chỉ tính phần giảm dưới số lúc khách rời**, tức max(0, min(dòng trước, số lúc khách rời) − dòng sau): **đồng ý**. Cách này giữ BB07-1/I16: tăng tay rồi hạ lại không thành miễn; đêm phòng không vượt `limit_ref_vnd`; khoản phát sinh trong cửa sổ lấy dòng đầu làm mốc.
3. **Số yêu cầu hoàn tự sinh = min(tiền dư chưa yêu cầu, phần giảm): đồng ý.** Khớp FZ02-7 (giảm khoản cửa sổ chưa trả thì không có tiền dư, không có yêu cầu) và FZ02-8 (chỉ xin phần của lần giảm này, không xin lại phần OWN đã từ chối). Phần đã từ chối được bảo vệ khỏi đường khác nhờ ADD3-01 điểm 2.
4. **Yêu cầu `superseded` giữ nguồn và cách định tuyến của yêu cầu nó thay: đồng ý**, mở rộng theo ADD3-01: chép cả `origin_actor_ids` và `source`, để yêu cầu tay đã lên `owner` không tụt về `manager` khi `refundPlan` tạo lại.

## Điểm làm tốt
- Một hàm `afterSettledMoneyChange` cho cả ba đường có người bấm, đúng tinh thần "một định nghĩa K11-06". Thêm `decisionFloor` ở bước quyết định làm lớp phòng thủ cho BUG-R3-003.
- `folio_settled_reduction` chỉ thêm, có FK và RLS. Cách tính "số lúc khách rời" giữ được bất biến I16 mà không cần thêm cột.
- Test bám đúng oracle FZ02. Chỗ phải đổi dữ liệu (FZ02-3) được ghi rõ lý do.
