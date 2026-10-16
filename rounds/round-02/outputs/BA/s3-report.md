# Báo cáo BA – Round 2, Sprint 3 khởi động "EP03-05 + EP06 theo BR v0.3.3 và DOM mục G"

- Người làm: BA | Ngày: 16/10/2026 | Không commit
- Căn cứ:
  - BR **v0.3.3** (ESC-015/016/017 A; BR-403/511, BR-413).
  - `reviews/s2-DOM.md` mục G (G-1…G-19), `outputs/DOM/s3-report.md`.
  - OpenAPI **0.3.6-draft** (ARC đang viết song song – đã đọc và đồng bộ tên ở A-33, A-34, A-37, A-38).

## 1. Đã làm gì
1. **`specs/EP03-05-stay.md` → v0.2**
   - **Mục 1.8 sửa theo BR-413 / ESC-007 A (G-2):** bản 0.1 ghi ngược. Nay khách dài hạn nhận sớm ngày đầu:
     - căn trống đêm trước → **0 đ** từ 06:00;
     - căn có khách trả cùng ngày → bậc BR-411 trên giá đêm quy đổi;
     - trước 06:00 → thêm đêm theo BR-417.
     - Kiểm số: 0 / 186.000.
   - **Thẻ phòng 0…2 mỗi căn (G-1):** đơn nhóm tính mỗi căn 0…2; phí thiếu thẻ = (đã phát − đã trả) × phí BR-511.
   - **Mục 1.3 – 1.6:**
     - G-3: chặn B9 thay cho chặn giao mã cửa (bỏ nhãn giả định).
     - G-6: nút "Sửa số khách thực tế" ngay trong điều kiện `capacity_within_max`.
     - G-7: thu tiền tại bước nhận phòng, không có nút "bỏ qua".
     - G-8: giờ nhận tính theo giờ khách vào căn; gửi hành lý không tính phụ thu.
     - G-9: ví dụ hạn khai báo khi nhận phòng B9a.
   - **Mục 2.3 (G-4):** VietQR không được vượt số còn phải thu, trừ khi FD+ ghi lý do "thu trước" (đề nghị E15-03).
   - **Mục 2.6 mới – Hoàn tiền (G-14):** bốn bước tách người, đặc tả mức trường theo tên 0.3.6.
     - Nguồn sinh yêu cầu hoàn: B10, B5, B16, dời khách ra ngoài, trả thừa khi trả phòng.
     - `setRefundDestination`: FD+, số tài khoản là C3 (D15), đổi nơi nhận sau khi duyệt thì phải duyệt lại.
     - Duyệt: MGR/OWN.
     - `executeRefund`: MGR/OWN, cho chi nhiều lần, có chứng từ, chuyển khoản thì phải đối soát, chi đủ thì hủy khóa số tài khoản (DEK).
   - **Mục 3.2 (G-19):** `houseRulesSent` là `null` → chỉ cảnh báo khi thu phí phạt, không chặn.
   - **Mục 4.2 (G-11):** trả muộn được MGR duyệt không có nghĩa là miễn phí.
   - **Mục 4.5 – B14 đổi phòng khi đang ở (dời từ Sprint 2):** viết đầy đủ trường, giá theo `cause`, folio đảo/ghi lại, buồng cũ VD/OD, khai báo không làm lại, nhắc thu/giao thẻ. Vượt sức chứa là chặn cứng ở mọi kênh (A-37).
   - **Mục 4.7 – US-022 người đi cùng (dời từ Sprint 2):** quyền, cảnh báo thiếu người, trẻ em (C3), chặn trùng, thêm người giữa kỳ ở kèm phụ thu từ `effectiveFrom`, ảnh hưởng khai báo, bỏ người (xóa giấy tờ ngay theo A-38).
   - **Mục 5.1 / 5.3 / 5.4 / 5.5:**
     - G-10: phụ thu trả muộn tính theo giờ trả thực tế – đảo dòng cũ, ghi dòng mới; nếu giảm thì server tự làm.
     - G-16: trả phòng sau nửa đêm → buộc gia hạn 1 đêm (đề nghị dùng `checkoutAt`).
     - G-12: bill không in cặp dòng gốc + dòng đảo (cả dòng tiền và giao dịch).
     - G-13: phân biệt đơn OTA trả trước (`ota_prepaid`) và trả tại chỗ (`ota_pay_at_property`).
     - G-15: blocker `credit_balance` + `overpaymentHandling` (A-34).
2. **`specs/EP06-registration.md` → v0.2**
   - G-5: tên trên đơn chỉ có một từ → `unverified` (lễ tân kiểm tay).
   - G-17: trả sớm được tính như trả phòng khi tính hạn xóa ảnh; người bị bỏ khỏi đơn → xóa giấy tờ ngay (A-38).
   - G-18: cập nhật ngày đi cho khách VN là câu hỏi pháp lý, gộp vào ESC-001.
   - E06-08 ghi "Đã trả lời".
3. **`gen_traceability.py --strict` exit 0** (ghi ra thư mục tạm, không ghi đè `qa/traceability.md`): AC 251/251, rbac lệch 0, `x-rbac-field` 141.

## 2. File đã tạo/sửa
- `product/docs/specs/EP03-05-stay.md` (v0.2)
- `product/docs/specs/EP06-registration.md` (v0.2)
- `rounds/round-02/outputs/BA/s3-report.md`

## 3. Đề nghị hợp đồng gửi ARC (OpenAPI 0.3.6) – chi tiết ở cuối mỗi file specs
| # | Nội dung | Trạng thái so với 0.3.6-draft |
|---|---|---|
| E15-01 | Tạo yêu cầu hoàn **tay** từ folio khi khách trả thừa giữa kỳ ở (FD+, A43, ≤ `creditVnd`) | Chưa có |
| E15-02 | `executeRefund`: `purpose` ảnh riêng `refund_proof` (đọc như D15); `bankReference` và `attachmentId` bắt buộc khi chuyển khoản | 0.3.6 dùng `deposit_receipt`, hai trường đang không bắt buộc |
| E15-03 | `createVietQr.overBalanceReason` – cho QR vượt số còn phải thu khi thu trước (DOM G-4); mô tả `AMOUNT_EXCEEDS_BALANCE` bỏ chữ "chờ DOM" | Chưa có |
| E04-04 | `PartyMemberCreate.effectiveFrom`, `applyExtraPersonSurcharge`, phản hồi `occupancyChange` (US-022 AC4); `Party.version` + `If-Match` cho `removePartyMember`; `childAgeBand` | Chưa có |
| E04-05 | `changeRoom`: xem trước chênh lệch folio, `workOrderId`, `oldRoomVacated` (VD/OD), dòng `room_change_difference` cho đơn OTA | Một phần (A-37 có `searchAvailability?reservationId=`) |
| E05-09 | `checkOut`/`getCheckoutSummary` nhận `checkoutAt` (instant) – trả phòng sau nửa đêm (G-16) | Chưa có |
| E05-10 | Phụ thu trả muộn theo giờ thực tế: `lateSurchargeRecalc {oldVnd, newVnd}`, server tự đảo khi giảm (G-10); `getBill` bỏ cặp dòng đảo, thêm tóm tắt OTA trả trước, dòng hoàn (G-12, G-13) | Phần trả thừa A-34 đã có; phần còn lại chưa |
| E03-06 | Tick bổ sung "Đã giao mã/thẻ" từ chi tiết đơn (US-025 AC7) | Cần kiểm lại trong 0.3.6 |

## 4. Giả định / câu hỏi
- **Q-S3-1 (DOM + PO):** DOM G-14 đề xuất FD+ chi hoàn, còn rbac A47 và hợp đồng 0.3.6 giữ MGR/OWN. Đặc tả đang giữ MGR/OWN. Câu hỏi: khi quản lý vắng, FD có được hoàn **tiền mặt** tại quầy không?
- `[GIẢ ĐỊNH BA]` mới:
  - Khách thu dư giữa kỳ ở thì xử lý lúc trả phòng (chưa có nút hoàn tay).
  - Ảnh chứng từ bắt buộc khi hoàn bằng chuyển khoản.
  - B14: buồng cũ VD hay OD do lễ tân chọn.
  - Trẻ em trùng tên + năm sinh → báo trùng.
  - Trả phòng giờ 00:00–05:59 hiểu là sau nửa đêm.
  - Trả muộn giảm so với giờ hẹn → server tự hạ phụ thu, không cần lễ tân tích.
- Không có ESC mới: G-18 (pháp lý) đã gộp vào ESC-001 (luật sư) theo DOM.

## 5. Việc chưa xong
- Chờ ARC trả lời các đề nghị ở mục 3 và chốt 0.3.6; khi có sẽ đổi tên gợi ý trong specs.
- Chờ review bắt buộc DOM, ARC cho v0.2 của hai file.

## 6. Bổ sung – PO quyết 16/10: tách tiền mặt / chuyển khoản (A46a, A47a)
- `rbac-matrix.md` / `.json` **0.2.3**: thêm hai hành động mới; A46 và A47 giữ MGR+.
  - **A46a** – FD+ xác nhận đã nhận tiền mặt sale/CTV nộp quầy, không xác nhận khoản do mình ghi.
  - **A47a** – FD+ chi hoàn tiền mặt đã duyệt, không chi khoản hoàn do mình tạo yêu cầu.
  - Ghi chú 38 và mục 5.3 đã cập nhật.
- `specs/EP03-05-stay.md`:
  - 2.1: bảng quyền thêm hai hành động.
  - 2.4: xác nhận tiền mặt nộp quầy – trường `result` / `receivedAmountVnd` / `note`, lỗi `SELF_RECONCILE_FORBIDDEN`.
  - 2.6: chi hoàn tách theo phương thức; ảnh biên nhận có chữ ký khách bắt buộc khi chi tiền mặt; thu dư giữa kỳ ở dùng `createRefundRequest` (0.3.6 đã có – E15-01 đóng); Q-S3-1 đóng; thêm E15-04.
- Đã ghi đề xuất ánh xạ operation vào `outputs/ARC/s3-contract.md` mục "BA – ánh xạ A46a/A47a": `confirmCashHandover`, `executeCashRefund`, phạm vi `listPayments` cho FD; kèm phương án thay thế dùng `x-scope`. JSON để `operationIds` rỗng cho tới khi ARC chốt tên.
- **Cập nhật sau đó:** ARC 0.3.6 đã có `confirmCashHandover` (A46a) và `executeCashRefund` (A47a), đúng tên BA đề xuất.
  - BA đã điền `operationIds` vào JSON.
  - Đặc tả đã chỉnh theo hợp đồng ARC: `receivedVnd` phải bằng số đã ghi; nhận thiếu tiền thì MGR ghi `disputed`; tự chi khoản hoàn do mình tạo → `403 SELF_APPROVAL_FORBIDDEN`.
- Kiểm tra cuối:
  - `gen_rbac_cases --check`: **OK** (189 operation, rbac mismatch []).
  - `gen_traceability --strict`: **exit 0** (AC 251/251, rbac lệch 0).
