# ARC review BE-B – BUG-R3-012 (P0) / BUG-R3-013 (P1), fuzz G1 cuối

- Người review: ARC | Round 3 – Sprint 1, bước Phản hồi & sửa (PR tiền, review bắt buộc) | Ngày: 24/10/2026
- Đối tượng: nhánh `be-b/r3-bug-012-013`, SHA `2f1d738` (mã ở `67f4e07`); báo cáo `outputs/BE/s1-be-b.md` mục 14.
- Đối chiếu:
  - critic `rounds/round-03/reviews/s1-money-critic-final.md` B-1, M-1, mục 6;
  - `bug-list.md` BUG-R3-012/013;
  - BR-522 K11-06, BR-427 (d);
  - `s1-contracts.md` 13.2;
  - ARC 16.19.

## Kết luận
**Gộp được.** Không có Blocker hay Major. Có 1 Minor (BUG012-01): lớp chặn ở bước duyệt, cài trong PR riêng ở Sprint 1, không chặn gộp. Có 1 Suggestion cho harness.

**Đã chạy** (worktree tách riêng ở `2f1d738`, PostgreSQL 17 riêng):
- `tsc` đạt;
- toàn bộ api: **128 tệp đạt (2 bỏ qua), 3.227 test đạt (21 bỏ qua)**, khớp báo cáo BE-B;
- fuzz `FZ-02` seed 1006 (`FUZZ_BE83 FUZZ_FZ02 FUZZ_K1106 FUZZ_ADD3`, 1 chuỗi) để phân xử I7 – xem kết luận 3.

**Đúng:**
- **BUG-R3-012**:
  - J15 chỉ `waiting_refund` khi còn tiền dư **và** còn yêu cầu mở;
  - yêu cầu vượt tiền dư được lập lại trước;
  - hết tiền dư thì yêu cầu đã duyệt chưa chi đóng `superseded`, rồi ghi nợ `post_checkout_unpaid` qua đường `debtOnCheckout` có sẵn (không thêm định nghĩa nợ), đóng folio, giải "Cần chú ý";
  - nhánh BUG-R3-002 (tiền dư chưa có yêu cầu) giữ nguyên thứ tự và vẫn đúng.
- **BUG-R3-013**:
  - `refundsDownToCredit` chạy **trước** mọi việc khác trong `afterSettledMoneyChange` (cả A32 giảm khi đang vượt);
  - gắn thêm `addFolioLine`, duyệt giá hư hỏng (`replanSettledRefunds`), J15;
  - bản thay thế giữ nguồn, ghi chú, `origin_actor_ids`, người xin; khi J15 chạy (không có người bấm) thì lấy người xin của yêu cầu cũ nhất;
  - mọi đường chạy dưới L1 → L3 người gọi đã giữ.
- `cancelApproved(…, 'superseded')` chỉ cho `refund` và chạy hook quyết định của refund (xóa nơi nhận – SEC-BE-45). Không cần migration (lý do đã có trong CHECK).

## Ba quyết định ORC hỏi

### (1) Lớp chặn "số duyệt ≤ tiền dư" ở bước duyệt – **CÓ, cài thêm (phòng thủ lớp hai)**
- Quy tắc lập lại kế hoạch nay chạy ở mọi đường **đã biết** làm giảm tiền dư. Nhưng critic tìm thấy 12 lần duyệt số lớn hơn tiền dư trước bản sửa, và đường mới sau này (thu hồi FOC Sprint 2, cổng thanh toán, đồng bộ `ota_collect`) có thể quên gọi.
- Lúc chi tiền đã kẹp `min(còn lại, rawCreditVnd)`, nên tiền không đi sai. Lớp chặn ở bước duyệt giữ cho **người duyệt không bao giờ duyệt một con số sai**.
- Quy tắc (ghi hợp đồng `approveRequest`, 0.3.8 bổ sung 6):
  - `type = refund`: dưới khóa folio, so `amountVnd` với **tiền dư còn trống** = `rawCreditVnd` − các yêu cầu hoàn đã duyệt chưa chi khác;
  - vượt → chạy lại `refundPlan` (yêu cầu thành `cancelled` `superseded`, xin lại đúng số nếu còn dư) → **409 `INVALID_TRANSITION`** (`currentState = cancelled`, `autoCancelReason = superseded`), không duyệt gì.
- Không thay cho quy tắc lập lại kế hoạch ở từng đường; chỉ là lưới cuối.
- → Thẻ BUG012-01.

### (2) Thêm `postLine` (`addFolioLine`) vào danh sách K11-06 – **ĐỒNG Ý, và chuyển danh sách thành quy tắc chung**
- BE-B đã gắn `addFolioLine` và duyệt giá hư hỏng.
- ARC đổi 13.2 điểm 2 từ "danh sách đường" thành quy tắc: **mọi** thay đổi làm giảm tiền dư của folio `settled` thì chạy lại `refundPlan`, có danh sách hiện có. Đường mới phải gắn – đưa vào checklist review 16.31.3.
- Đã ghi:
  - `openapi.yaml`: changelog 0.3.8 bổ sung 6, `addFolioLine`, `approveRequest`;
  - `s1-contracts.md` mục 13.3;
  - không đổi hình dạng.
- Kiểm:
  - spec validator OK; `gen-openapi-meta --check` up to date;
  - api-client sinh lại, `tsc` đạt; `gen_rbac_cases --check` OK; `gen_traceability --strict` exit 0;
  - prettier xanh.
- Chưa commit (ORC commit).

### (3) I7 FZ-02 seed 1006 – **lỗi của harness (loại (b)), không phải lỗi mã**
ARC chạy lại seed này trên `2f1d738` và đọc log từng bước:
- **Bước 26** (trước đua): B 667.000, O 391.000 (R 391.000), W 276.000 – mã và tham chiếu khớp.
- **Bước 27**: `race [QR về muộn 1.567.000] ‖ [đảo 1.484.000]`.
  - Mã ra B 584.000, `debt_recorded_vnd` 1.875.000, O 308.000.
  - Đúng thứ tự "đảo trước, QR sau":
    - đảo khi O = 391.000 > 0 → **nối** 1.484.000 → R 1.875.000;
    - QR trả 1.567.000 → R − D = 308.000, B = 584.000, O = min(308.000, 584.000) = 308.000, W = 276.000.
  - Tham chiếu chọn thứ tự còn lại (QR trước làm O về 0 rồi mở chu kỳ mới), ra O = 584.000, W = 0. Harness đã gắn `I3?`/`I5?` cho bước này, đúng.
- **Bước 29**: OWN A32 hạ 139.000 → mã **201**. Theo trạng thái thật của mã (W = 276.000 ≥ 139.000), 201 là **đúng** quy tắc 208. Tham chiếu dùng W = 0 (do chọn sai thứ tự ở bước 27) nên đòi 409 và báo I7.
- **Nguyên nhân harness**: sau một bước đua không sắp được thứ tự, `ambiguousOrder` hạ I3/I5/I6 thành "?", nhưng **không** hạ I7. Mà I7 dùng W của tham chiếu, nên kéo theo cùng sai lệch.
- Đề xuất cho QA (Suggestion BUG012-02):
  - (a) thêm I7 vào nhóm hạ thành "?" khi `ambiguousOrder`;
  - hoặc tốt hơn, (b) I7 so phần giảm với **W của chính mã** (`B − openDebtVnd` đọc ngay trước bước), vì I7 là bất biến về quyết định A32 theo trạng thái hiện có, không về thứ tự lịch sử.
- Seed này cho cùng I7 trên `593ce95` (trước bản sửa), khớp nhận định của BE-B.

## Thẻ feedback

### FB-R3-ARC-BUG012-01
- Mức độ: Minor (cài trong Sprint 1, PR riêng, SEC review; không chặn gộp `2f1d738`)
- Vị trí: `approvals` `approve` cho `type = refund` (hook preLock của payments/folio)
- Vấn đề: chưa có lớp chặn ở bước duyệt. Một đường làm giảm tiền dư mà quên gọi quy tắc K11-06 sẽ lại để người duyệt duyệt số lớn hơn tiền dư (critic M-1: 12 lần trước bản sửa).
- Đề xuất sửa:
  - theo quyết định (1);
  - test: yêu cầu chờ 300.000, tiền dư giảm còn 100.000 qua đường không gắn hook (ghi thẳng bảng như ca J15 của BE-B) → duyệt → 409, yêu cầu cũ `superseded`, có yêu cầu thay thế 100.000 cùng nguồn.
- Trạng thái: Verified (ARC 24/10, `69a5398`)

### FB-R3-ARC-BUG012-02
- Mức độ: Suggestion (QA – harness fuzz)
- Vị trí: `test/fuzz/invariants.ts` I7; `runner.ts` `ambiguousOrder`
- Vấn đề, đề xuất: như kết luận (3).
- Trạng thái: Open

## Điểm làm tốt
- Sửa đúng gốc ở một chỗ (`refundsDownToCredit`) rồi gắn vào mọi đường, kể cả J15 không có người bấm (bản thay thế giữ người xin cũ) – không thêm định nghĩa thứ hai.
- J15 dùng lại đường ghi nợ `debtOnCheckout` có sẵn thay vì tự ghi.
- Báo cáo nêu rõ vi phạm fuzz còn lại kèm seed và đối chiếu trên `main` trước bản sửa.

---

# Lượt 2 – `69a5398` (lớp chặn bước duyệt BUG012-01 + SEC FB-1213-01/02), ARC 24/10

**Gộp được.** BUG012-01 chuyển Verified.

- Đã chạy (worktree tách riêng ở `69a5398`, PostgreSQL 17 riêng):
  - `tsc` đạt;
  - toàn bộ api **129 tệp đạt (2 bỏ qua), 3.231 test đạt (21 bỏ qua)**;
  - gồm `r3-bug012-followups` 4 ca.
- **BUG012-01** – đúng hợp đồng 13.3 điểm 5:
  - `refundAboveFreeCredit` chạy trong `approve`, dưới khóa folio (preLock của refund);
  - tiền dư còn trống = `rawCreditVnd` − phần còn phải chi của các yêu cầu hoàn **đã duyệt khác** của lượt ở; so với phần còn lại của yêu cầu;
  - vượt → `refundsDownToCredit` (người xin giữ như J15) được **commit**, rồi trả 409 `INVALID_TRANSITION` (`currentState = cancelled`, `autoCancelReason = superseded`) theo mẫu `fail` sau commit như A4;
  - không duyệt gì;
  - đăng ký qua `provideRefundRouting`, nên module approvals không import folio (ADR-001).
- **SEC FB-1213-01**: bản thay mang `minRequiredRole` = cấp cao nhất của các yêu cầu bị thay, và định tuyến chỉ nâng, không hạ. Đồng ý.
- **SEC FB-1213-02**: OWN thao tác thì bản thay giữ người xin của yêu cầu cũ nhất (yêu cầu `a32` vẫn giữ người làm A32). Đồng ý – tránh kẹt luật F8 ở cơ sở chỉ có một OWN. Khi OWN là người xin gốc thì vẫn là OWN, và đó là ca F8 hiện có (OWN không tự duyệt yêu cầu của mình).
- Ghi chú (không phải thẻ): khi nhiều yêu cầu cùng chờ, `refundPlan` hủy mọi yêu cầu chờ rồi tạo lại một (DOM-S4-14), nên yêu cầu đang được duyệt luôn nằm trong số bị hủy; 409 "cancelled" luôn đúng.

