# ARC review BE-B – BUG-R3-014 (chi hoàn không lập lại kế hoạch hoàn), đọc mã

- Người review: ARC | Round 3 – Sprint 1, bước Phản hồi & sửa (PR tiền) | Ngày: 24/10/2026
- Đối tượng: nhánh `be-b/r3-bug-014`, SHA `1216250`; báo cáo `outputs/BE/s1-be-b.md` mục 16; critic `reviews/s1-money-critic-rerun.md` M-2.
- **Docker trên máy đang treo: review bằng đọc mã, chưa chạy test.** BE-B cũng chưa chạy test có DB.

## Kết luận
**Mã `1216250` đúng hướng, gộp được sau khi có test DB xanh** (BE-B chạy toàn bộ API khi Docker chạy lại; ARC không cần review lại phần này).

Hai điểm ORC hỏi đã quyết bên dưới và ghi hợp đồng **0.3.8 bổ sung 7**. Phần cài thêm (BUG014-01, BUG014-02) làm trong **cùng nhánh hoặc PR kế tiếp, trước cổng G1**. Fuzz G1 chỉ đạt khi có cả hai.

**Đọc mã `1216250`:**
- `RefundsService.payOut` (đường chung của `executeCashRefund` và `executeRefund`) gọi `FolioService.replanRefundsAfterPayout` **sau** khi ghi phiếu hoàn, cùng giao dịch, dưới khóa folio lần chi đang giữ. Thứ tự khóa không đổi (L3 rồi L4 phiếu).
- `replanRefundsAfterPayout` dùng lại `refundsDownToCredit` (một định nghĩa):
  - người bấm `null` → bản thay giữ người xin và cấp duyệt (FB-1213-01/02);
  - folio `closed` bỏ qua (không chi được);
  - hết tiền dư → đóng mọi yêu cầu đã duyệt còn tiền, kể cả yêu cầu vừa chi dở; có hook xóa nơi nhận.
- Ba ca test (đọc): ca QA, tiền mới sau khi tiền dư về 0, còn tiền dư thì giữ. Đúng 13.3.
- Không migration, không đổi hình dạng.

## Quyết định 1 – biến thể còn hở (tiền dư > 0 nhưng < phần còn lại của yêu cầu duyệt trước A32): **không chọn (a) hay (b); chọn bất biến K11-06 (13.4 điểm 1)**
- **Quy tắc:** sau mọi thay đổi tiền (gồm chi hoàn và A32 giảm), Σ (chờ + phần còn phải chi của đã duyệt) ≤ `rawCreditVnd`. Vượt → `refundPlan` hủy `superseded` cả **yêu cầu đã duyệt** phần vượt (mới nhất trước) rồi xin lại đúng số; bản thay giữ nguồn, người xin và cấp duyệt.
- **Vì sao đóng được lỗ:**
  - lỗ chỉ có khi một yêu cầu đã duyệt **lớn hơn** tiền dư lúc A32 xảy ra (phần vượt "chờ" tiền mới);
  - bất biến làm phần vượt đó không tồn tại: ngay khi tiền dư giảm dưới số đã duyệt, yêu cầu được thu về đúng số;
  - phần A32 sinh ra sau đó luôn là tiền dư **chưa yêu cầu**, đi đường yêu cầu `a32` (BR-433 (e), ADD3-01).
- **So với hai đề xuất:**
  - (a) kiểm lúc chi theo `decided_at`: yêu cầu trông như chi được rồi 409 lúc chi; phải gắn ở mọi đường chi; "A32 mới hơn lần duyệt" không phân biệt A32 có liên quan hay không;
  - (b) A32 đóng mọi yêu cầu đã duyệt: hủy cả lần duyệt nằm gọn trong tiền dư, không liên quan A32, bắt OWN/MGR duyệt lại vô ích;
  - bất biến chỉ chạm đúng phần vượt, và dùng lại `refundsDownToCredit` có sẵn.
- **Đánh đổi:** một yêu cầu đã duyệt có thể bị thu nhỏ (`superseded` + yêu cầu mới) khi tiền dư giảm, nên phải duyệt lại phần còn lại. Chấp nhận: đó đúng là trường hợp số đã duyệt không còn đúng. Lúc chi trước đây vẫn kẹp `min`, nên không mất tiền, chỉ thêm một bước duyệt.

## Quyết định 2 – người làm A32 giảm không chi hoàn của folio (trừ OWN), 403 `SELF_REFUND_FORBIDDEN`: **ĐỒNG Ý, mở rộng sang `setRefundDestination`**
- Áp cho `executeCashRefund`, `executeRefund` và **`setRefundDestination`**: đổi nơi nhận cũng chuyển được tiền miễn về tài khoản mình (critic 64053 #54 là ca chi; nơi nhận là cùng đường lách).
- Phạm vi: **mọi** yêu cầu hoàn của folio có dòng `folio_settled_reduction` của người đó (vai dưới OWN), không chỉ yêu cầu `a32`. Vì tiền dư không gắn nhãn nguồn, giới hạn theo yêu cầu sẽ để lọt qua yêu cầu `other`.
- OWN không bị chặn (OWN không có dòng A32 tính, BR-433 (e)).
- Dùng lại mã có sẵn `SELF_REFUND_FORBIDDEN`: cùng nghĩa "người này không được chi khoản này". Kiểm dưới khóa folio, cạnh điều kiện "người chi ≠ người tạo".
- Desk: nút "Chi"/"Nhập nơi nhận" ẩn với người đó. FE-A dùng `origin_actor_ids` của yêu cầu – tập này gồm mọi người làm A32 của folio lúc lập (ADD3-01). Server vẫn là nơi quyết định, vì có thể có A32 làm sau khi lập.

## Hợp đồng – 0.3.8 bổ sung 7 (chưa commit, ORC commit)
- `openapi.yaml`:
  - changelog bổ sung 7;
  - bảng mã `SELF_REFUND_FORBIDDEN` thêm trường hợp A32;
  - mô tả `setRefundDestination`, `executeCashRefund`, `executeRefund`.
- `s1-contracts.md` mục **13.4**: bất biến K11-06 thay 13.3 điểm 3, luật 403, việc BE-B và test.
- Không đổi hình dạng. Kiểm:
  - spec validator OK; `gen-openapi-meta --check` up to date;
  - api-client sinh lại (JSDoc), `tsc` đạt; `gen_rbac_cases --check` OK; `gen_traceability --strict` exit 0;
  - prettier xanh.

## Thẻ feedback

### FB-R3-ARC-BUG014-01
- Mức độ: Major (điều kiện G1)
- Vị trí: `folio.service.ts` `refundsDownToCredit`
- Vấn đề: hiện chỉ đóng yêu cầu đã duyệt khi **hết** tiền dư. Khi tiền dư > 0 nhưng nhỏ hơn phần còn lại của yêu cầu đã duyệt, phần vượt vẫn treo và hút được tiền A32 giảm về sau (quyết định 1).
- Đề xuất sửa: cài bất biến 13.4 điểm 1, kèm test như `s1-contracts` 13.4. QA thêm bất biến vào fuzz: "sau mỗi bước, Σ chờ + đã duyệt còn phải chi ≤ `rawCreditVnd`".
- Trạng thái: Verified (ARC 24/10, `76e21c4`)

### FB-R3-ARC-BUG014-02
- Mức độ: Major (điều kiện G1)
- Vị trí: `refunds.service.ts` – `executeCashRefund`, `executeRefund`, `setRefundDestination`
- Vấn đề: người làm A32 giảm trên folio vẫn chi được và nhập được nơi nhận cho yêu cầu hoàn của folio đó (critic 64053 #54).
- Đề xuất sửa: chặn theo quyết định 2, 403 `SELF_REFUND_FORBIDDEN`. Test: MGR làm A32 rồi chi / nhập nơi nhận → 403; MGR khác (không làm A32) → được; OWN → được.
- Trạng thái: Verified (ARC 24/10, `76e21c4`)

## Điểm làm tốt
- Đặt lập lại kế hoạch ở `payOut` (một chỗ cho cả hai đường chi) và dùng lại `refundsDownToCredit`, không thêm định nghĩa.
- Báo cáo nêu thẳng biến thể còn hở suy ra từ mã, không để fuzz tìm lại.

---

# Lượt 2 – `76e21c4` (BUG014-01 bất biến K11-06, BUG014-02 `SELF_REFUND_FORBIDDEN`), ARC 24/10

**Gộp được.** BUG014-01 và BUG014-02 chuyển Verified. Toàn bộ suite để CI chạy sau khi gộp (máy đang tải cao, theo ORC).

**Đã chạy** (worktree tách riêng ở `76e21c4`, PostgreSQL 17 tạm, **đã gỡ container ngay sau khi xong**):
- `tsc`: đạt;
- `r3-bug-014-payout-replan`, `r3-bug-012-013`, `fuzz/bug-r3-014`, `approvals-refund-payout`: **4 tệp, 16/16 đạt**.

**Đọc mã:**
- **BUG014-01** – `refundsDownToCredit` cài đúng bất biến 13.4 điểm 1:
  - Σ mở > tiền dư → mọi yêu cầu **chờ** hủy (`refundPlan`, như DOM-S4-14);
  - yêu cầu **đã duyệt** hủy `superseded` **mới nhất trước** cho tới khi phần còn giữ ≤ tiền dư;
  - xin lại đúng `credit − phần đã duyệt còn giữ`;
  - bản thay chép nguồn, ghi chú, `origin_actor_ids`, cấp duyệt từ **cả** yêu cầu chờ lẫn yêu cầu đã duyệt bị hủy;
  - `cancelApproved` có audit, báo tin và hook xóa nơi nhận;
  - không còn nhánh riêng "hết tiền dư", vì đó là trường hợp đặc biệt của cùng vòng lặp (credit = 0 thì hủy hết, không xin lại).
- **BUG014-02** – `assertNotA32Maker` ở `setDestination` và ở `payOut` (đường chung của tiền mặt và chuyển khoản):
  - đặt sau điều kiện "người chi ≠ người tạo";
  - OWN bỏ qua;
  - dùng `FolioService.isA32Maker`, cùng hàm của bước duyệt (ADD3-01), nên một định nghĩa "người làm A32".
- Hợp đồng 0.3.8 bổ sung 7 khớp mã; không đổi hình dạng.

