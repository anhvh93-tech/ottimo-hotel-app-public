# PO review – P4-20 `v104/dom-br-fixtures` (BR v0.5.2 + fixtures, v1.0.4)

- Người review: PO (kèm phần **Góc BA**, theo ORC giao) | Round 4 – v1.0.4 – Bước: **Review chéo** | 04/11/2026
- Đối tượng: `origin/v104/dom-br-fixtures` @ `6bddbc29`, so với `origin/main` @ `7b5b6117`. Nhánh có 3 commit: `e116c2b4` (DOM J1 người nhận), `ceb05937` (BR v0.5.2 + fixtures), `6bddbc29` (BR-108-03 tham số lịch 01/11). Tác giả: DOM, kiêm QA cho fixtures và test case.
- Tệp đổi:
  - `product/docs/business-rules.md`;
  - `product/tests/fixtures/br-examples.json`;
  - `product/tests/tools/validate-fixtures.mjs`;
  - `product/tests/test-cases/r1-main-flows.md`;
  - `product/tests/e2e/api/stay-checkout.s3.api.spec.ts` (chỉ chú thích);
  - `rounds/round-04/outputs/DOM/v1.0.4-p4-20-br-fixtures.md`.
- Căn cứ:
  - plan v1.0.4 mục 3 (dòng P4-20) và brief DOM + QA mục 8;
  - thẻ PO của chính tôi `rounds/round-04/reviews/PO-on-PR25-BR-labels.md` (FB-R4-PO-DOM-PR25-01…05);
  - `02-escalations/ESC-045.md`, decision-log 01/11 (ESC-045 câu 1–6);
  - `product/docs/specs/EP02-reservations.md` mục 10.5, `product/docs/rbac-matrix.md`, `product/docs/api/openapi.yaml` 0.3.12 (mô tả `StaffNotification.kind`, `AttentionItem.kind`).
- Cách kiểm:
  - worktree tạm ở `6bddbc29`: `node product/tests/tools/validate-fixtures.mjs` → **OK – 0 lỗi, 1 cảnh báo cũ** (550 dòng, 209 dòng tính lại);
  - `git merge-tree` với `main`: sạch;
  - script so `br-examples.json` giữa `main` và nhánh: 14 dòng mới, 0 dòng xóa, 49 dòng sửa. Đã soát trường số của dòng sửa: **không có số kỳ vọng nào đổi**. BR-101-12, 103-04, 107-07 chỉ đổi dạng `input` để validator tính lại, `expected` giữ nguyên;
  - word-diff `business-rules.md`;
  - kiểm từng thẻ PR25 trên dữ liệu thật của nhánh.
- Không sửa mã, không sửa decision-log, không ghi số hoa hồng hay thưởng nào. Không có dữ liệu khách.

---

## 1. Kết luận

**ĐẠT.** Không có Blocker hay Major. Có 2 Minor (1 PO, 1 BA) và 2 Suggestion.

| Tiêu chí (plan P4-20) | Kết quả |
|---|---|
| `validate-fixtures` 0 lỗi | **Đạt** (PO chạy lại) |
| PO-DOM-PR25-01…05 + SEC-DOM-01 | **Đạt.** Xem bảng mục 2. PO đóng cả 5 thẻ |
| Không số mới | **Đạt.** 14 dòng mới không có trường hoa hồng/thưởng. 6 dòng có số hoa hồng cũ chỉ được thêm `oldCommissionFigures {validUntil: 2026-10-31, replacedBy}`, không đổi số. BR mới không có tỷ lệ nào |
| `calc` cho dòng bảng giá 01/11 (QA-01 phần DOM) | **Đạt phần DOM.** Phần BE (`byCalc` gộp `row.params`) là việc P4-11. `v104/be-lease-prices` đã nối tiếp trên `ceb05937`, nên **phải gộp P4-20 trước P4-11** |
| BUG-R4-025 phần BR-428 | **Đạt.** Câu nhánh OTA giờ nói: một yêu cầu hoàn cho khoản trả sớm; trả phòng không tạo lại khoản đó, chỉ hỏi phần trả thừa khác (BR-522). Câu này khớp `early_departure.row_refund_help` mới của P4-01 |
| Test case "ví dụ theo tỷ lệ cũ" | **Đạt** ở `r1-main-flows.md`. Hai màn hifi 11, 12 do UXD làm ở `v104/uxd-id-sheet-v2` (đã kiểm ở review tờ CCCD) |
| Phạm vi tệp | Brief chỉ cho sửa BR, fixtures và test case. DOM sửa thêm `validate-fixtures.mjs` (để oracle mới thật sự được tính lại) và một chú thích ở spec e2e. PO **chấp nhận**: đây là công cụ của chính fixtures, không gói v1.0.4 nào khác sửa tệp này, ngoài P4-11 nối tiếp nhánh này. Không đụng `rbac-cases.json` |

## 2. Thẻ PO cũ (PR #25) – kiểm và đóng

| Thẻ | Đã kiểm trên nhánh | PO |
|---|---|---|
| FB-R4-PO-DOM-PR25-01 (Major) | (a) Cột Nhãn BR-212, 326, 903, BR-525 và mục 13 `commission_payout` giờ ghi "từ 01/11: bảng nội bộ INV 01/11 (không ghi số ở kho mã)" + "Trước 01/11 – hết hiệu lực (INV quyết ESC-005 16/10)". (b) Chọn cách 2: BR-212-01/02, 326-01, 903-01…04 có `supersededBy` + `validUntil`; các dòng còn số cũ có `oldCommissionFigures`. Validator bắt cả hai quy ước. (c) SEC đã kiểm lịch sử git (decision-log 04/11). | **Đóng** |
| FB-R4-PO-DOM-PR25-02 | Cả 16 dòng PO nêu đều có `INV-043` (script: 0 dòng thiếu). BR-114-02 có `INV-045` và `PHÁP LÝ`. `conventions.labels` có luật "dòng mang nhãn của mọi quyết định mà số kỳ vọng phụ thuộc vào" | **Đóng** |
| FB-R4-PO-DOM-PR25-03 | BR-208-01, 208-02 có `GIẢ ĐỊNH`. Ghi chú 208-01 có "[GIẢ ĐỊNH – chờ INV xác nhận]" | **Đóng** |
| FB-R4-PO-DOM-PR25-04 | Mục 0.1 viết chung "INV quyết ESC-xxx (dd/mm)", hai cách viết (chọn phương án / tài liệu gửi theo ESC). `conventions.labels` định nghĩa `INV-043`, `INV-045` | **Đóng** |
| FB-R4-PO-DOM-PR25-05 | `retiredIds` ghi BR-208-02/03 `reused: true` kèm lý do. Validator chặn dùng lại id đã bỏ | **Đóng** |

## 3. Thẻ feedback (góc PO)

### FB-R4-PO-DOM-P420-01
- Mức độ: Minor
- Vị trí: `business-rules.md` BR-206 (thêm "HĐ trên 24 tháng = 2 tháng [GIẢ ĐỊNH – chờ INV xác nhận]"); `br-examples.json` BR-206-04 (30 tháng); biên bản DOM mục 5 và mục 6 (dòng decision-log đề xuất).
- Vấn đề:
  - Mức ký quỹ cho HĐ trên 24 tháng là **chính sách đặt cọc**, thuộc nhóm phải báo lên theo protocol mục 8.
  - DOM đã gắn nhãn giả định đúng ở BR và fixtures. Nhưng 2 dòng decision-log DOM đề xuất **không** có giả định này, và không có ESC.
  - Protocol yêu cầu giả định chính sách nằm trong `decision-log.md` với nhãn `[GIẢ ĐỊNH – chờ INV xác nhận]`.
- Vì sao quan trọng:
  - Sale báo khách số ký quỹ cho HĐ dài theo BR.
  - Nếu INV có mức khác thì cần một chỗ để gom câu hỏi cuối round. Hiện giả định này chỉ nằm sâu trong BR.
  - ESC-045 câu 2 chỉ chốt **mức giảm** cho HĐ trên 24 tháng (10 %), không chốt ký quỹ.
- Đề xuất sửa: ORC thêm một dòng decision-log khi commit gói này: "BR-206: HĐ trên 24 tháng ký quỹ 2 tháng `[GIẢ ĐỊNH – chờ INV xác nhận]`, DOM 04/11". PO đưa câu này vào danh sách câu hỏi gom cuối round 4. Không lập ESC riêng và không chặn v1.0.4, vì OTTIMO chưa có HĐ nào trên 24 tháng.
- Trạng thái: Open

### FB-R4-PO-DOM-P420-02
- Mức độ: Suggestion
- Vị trí: `br-examples.json`, các dòng đã thêm `supersededBy` hoặc `oldCommissionFigures`; hotfix H2 (SEC-BE-01 trong backlog 5.6).
- Vấn đề:
  - Thẻ PR25-01 (b) cách 2 có vế "BE không dùng các dòng này làm đáp án cho đơn từ 01/11".
  - Nhánh mới bảo đảm phía **validator** (quy ước bắt buộc).
  - Test BE (`reservations-pricing`, `byCalc`) chưa phân biệt các dòng này. Hiện chưa sai, vì động cơ hoa hồng mới chưa có.
- Vì sao quan trọng: khi H2 làm hoa hồng theo tham số OWN nhập, test BE đọc dòng cũ làm đáp án sẽ xanh trên số đã hết hiệu lực.
- Đề xuất sửa: ghi vào thẻ H2 / SEC-BE-01: test BE bỏ qua (hoặc chỉ chạy với ngày trước `validUntil`) mọi dòng có `supersededBy` hay `oldCommissionFigures`, và dùng tham số thử `test_rate_*` (SEC-ORC-01 G3). Không cần sửa gì ở P4-20.
- Trạng thái: Open

### FB-R4-PO-DOM-P420-03
- Mức độ: Suggestion
- Vị trí: `br-examples.json` trường `note` của các dòng `calcPending` (ví dụ BR-101-12, BR-103-04): "… (BR-104 v0.5.1)**..** v0.5.2 (P4-20): …".
- Vấn đề: nối chuỗi sinh ra hai dấu chấm.
- Vì sao quan trọng: thấp, chỉ là chữ. P4-11 sẽ sửa lại các ghi chú này khi đổi `calcPending` → `calc`.
- Đề xuất sửa: BE-C sửa luôn khi bỏ `pendingFix` ở P4-11.
- Trạng thái: Open

---

## 4. Góc BA – quy tắc đúng đặc tả, ma trận quyền

Phạm vi Góc BA: đối chiếu BR v0.5.2 và kết luận J1 (biên bản DOM mục 0) với đặc tả (`specs/EP02`, `EP01`), `rbac-matrix.md` và hợp đồng 0.3.12.

| Mục | Đối chiếu | Kết quả |
|---|---|---|
| J1 `hold_overdue_with_deposit`: người tạo + người chốt + FD, FDL, MGR | OpenAPI 0.3.12 mô tả `StaffNotification.kind` (thêm MGR, chống trùng theo đơn + `holdExpiresAt`); P4-01 ghi chú `staff.notif.k.hold_overdue_with_deposit` | Khớp |
| J1 `hold_overdue_cap`: MGR, OWN; "Cần chú ý" `hold_overdue_cap` chỉ OWN/MGR, `hold_overdue` FD+ | OpenAPI `AttentionItem.kind` (bảng vai); P4-01 `attn.hold_overdue_cap` | Khớp |
| J1 `hold_expired`: người tạo + người chốt, dự phòng FD/FDL | OpenAPI 0.3.12 ("`hold_expired` thêm người nhận dự phòng FD/FDL") | Khớp hợp đồng. **Lệch EP02 10.5** → thẻ BA-01 |
| HK, MT, kế toán không nhận; SAL/CTV chỉ khi là người tạo/người chốt | `rbac-matrix.md`: SAL/CTV chỉ thấy đơn của mình (US-087); HK/MT không có quyền đơn đặt phòng | Khớp. Thông báo chỉ có loại + mã đơn, không có tên khách hay số tiền. Đúng tinh thần SEC A5 |
| `deposit.accept_shortfall` chỉ OWN/MGR (P4-40) | Biên bản DOM không đổi quyền này; hợp đồng 0.3.12 (403 cho FD/FDL/SAL) và chữ P4-01 nói "chỉ OWN/MGR" | Khớp |
| BR-428 đơn CTV đi nhánh Trực tiếp | BR-428 v0.5.2 ("đơn CTV – kênh Trực tiếp, nguồn CTV"); đơn CTV không có OTA giữ tiền | Đúng. Đây là suy ra từ mô hình kênh, không phải chính sách hoàn mới. Nhãn `NGÀNH` phù hợp. BR-428-11 kiểm đúng ca này |
| BR-428 / BR-522 (BUG-R4-025): một đơn có thể có hơn một yêu cầu hoàn, mỗi khoản một yêu cầu | EP02/H15 15.7 (B16), chữ P4-01 `early_departure.row_refund_help`, `checkout.pending_refund_line` | Khớp. BR-522 thêm ghi chú "duyệt lúc khách ở, chi sau trả phòng", khớp ARC 6.4 và chữ `approvals.refund_may_decrease` |
| BR-115 "câu 3 = A" → "câu 3 = B" | decision-log 01/11 (ESC-045 câu 3: trẻ dưới 6 tuổi miễn, từ 6 tuổi 150.000/đêm); BA review PR #25 (decision-log 03/11) | Đúng. Sửa theo BA-01 |
| BR-202-06…12, BR-110-21/22 (biên) | ESC-045 câu 2 (13–23 tháng 7 %, trên 24 tháng 10 %), câu 3 (mốc 6 tuổi) | Đúng biên. Validator tính lại được |
| Ma trận quyền | Gói này không đổi quyền nào. `rbac-cases.json` không đụng, đúng plan | Không có việc |

### FB-R4-PO-BA-P420-01
- Mức độ: Minor
- Vị trí: `product/docs/specs/EP02-reservations.md` mục 10.5 "Gia hạn và hết hạn giữ chỗ", ý Job J1: "… → `cancelled` lý do `hold_expired`, …, **báo người tạo** (AC1)". Mục này cũng chưa có hai loại thông báo mới.
- Vấn đề:
  - Đặc tả EP02 vẫn ghi người nhận `hold_expired` là "người tạo".
  - Chưa có `hold_overdue_with_deposit`, `hold_overdue_cap` và luật chống trùng mỗi phút (DOM mục 0 ý 4).
  - Trong khi đó, DOM A.5 (xác nhận lại 04/11) và OpenAPI 0.3.12 đã là: người tạo + người chốt, dự phòng FD/FDL; thêm hai loại mới với người nhận như bảng trên.
  - Không nhánh v1.0.4 nào đang sửa EP02 (đã soát `git diff --name-only` mọi nhánh `v104/*`).
- Vì sao quan trọng: QA viết ca kiểm J1 theo EP02 sẽ thiếu người chốt (sale/CTV, người phải báo khách) và thiếu ca "không gửi lặp mỗi phút". BE-B (P4-10) code theo hợp đồng nên mã sẽ đúng, nhưng tài liệu đặc tả lệch mã.
- Đề xuất sửa: BA cập nhật EP02 10.5 theo bảng DOM mục 0, gồm:
  - ba loại thông báo;
  - người nhận;
  - người nhận dự phòng;
  - chống trùng theo khóa;
  - mục "Cần chú ý" `hold_overdue`/`hold_overdue_cap`.

  Dẫn sang `openapi.yaml` 0.3.12 thay vì chép lại. Làm trong `v104/ba-docs` hoặc một commit tài liệu riêng trước QC v1.0.4.
- Trạng thái: Open

---

## 5. Điểm làm tốt
- Thẻ PO đóng được bằng dữ liệu, không phải bằng lời. Validator có quy ước bắt buộc (`supersededBy` đi cùng `validUntil`, chặn dùng lại id đã bỏ). DOM còn tự thử 10 đột biến để chứng minh validator bắt được.
- Đúng kỷ luật "không số mới": số hoa hồng cũ được đánh dấu là hết hiệu lực chứ không bị xóa. Nhờ vậy vẫn tra được đơn và HĐ cũ, và không lộ thêm số nào.
- Kết luận J1 có đối chiếu mã đang chạy và chỉ ra 2 chỗ mã lệch A.5 (thiếu MGR, thiếu OWN) và rủi ro gửi lặp mỗi phút. ARC và BE-B dùng được ngay.
