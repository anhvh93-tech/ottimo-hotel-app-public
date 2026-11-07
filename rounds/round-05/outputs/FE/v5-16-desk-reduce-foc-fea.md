# FE – V5-16 phía Desk: 403 `foc_request` → Gửi miễn có duyệt, lý do Ghi nhầm (US-177 AC2, AC8)

- Round 5 (v1.0.5), bước Sản xuất · FE · 07/11/2026
- Nhánh `r5-fe-v5-16`, cắt từ `origin/main` @ `78024f17`. Không rebase, không force-push.
- Căn cứ:
  - BR-438, DOM `rules-v1.0.5.md` 3.1, 3.5 (T-16-2, -4, -7, -11), 3.6, 7.2;
  - hợp đồng 0.3.13 mục 1.20 (`Problem.requiredFlow`, `FocRequestInput.reasonCode` `entered_in_error`), `openapi.yaml` `adjustFolioLine`, `requestFoc`;
  - máy chủ đã gộp: `services/api/src/modules/folio/public/line-reduction.ts` (`br438Refusal`), `line-labels.ts` (`GUEST_HIDDEN_REASONS`);
  - UXD `copy-v1.0.5.md` 9.5; backlog US-177 AC2, AC8, AC9, AC10; plan R5 mục 4a T4, 4b.

## 1. Việc đã làm
**Hộp Điều chỉnh** (`pages/stay/FolioDialog.tsx`, `AdjustLineDialog`)
- Câu phụ `folio.adjust_reduce_rule` dưới ô Bỏ cả dòng. Chỉ FD, FDL (không có vai MGR, OWN, như `limitedByBr438` của máy chủ). Không hiện ở dòng đêm (dòng đêm không thuộc BR-438, không có ô Bỏ cả dòng).
- Lối sửa giữ nguyên: Desk không biết trước dòng nào bị chặn (`FolioLine` chưa có nguồn, ngày nghiệp vụ ghi, dòng gốc tới 0.3.14 – DOM 3.6).
- 403 `FORBIDDEN_ACTION` có `requiredFlow = foc_request`: khung `warn` `error.reduce_needs_foc` thay câu chung `error.FORBIDDEN_ACTION`. Hộp giữ nguyên số đã gõ, folio không đổi. Nút `folio.foc_request_btn` trong khung.
- 403 không có `requiredFlow` (ví dụ folio đã chốt, A32; quyền vừa đổi) giữ câu chung, không có nút.

**Gửi miễn có duyệt** (`FolioDialog` → `FocRequestDialog`, `pages/stay/foc.tsx`)
- Nút đóng hộp Điều chỉnh, mở form miễn phí của đúng dòng đó.
- Ô Số tiền điền sẵn phần định giảm của lần lưu bị từ chối: số cũ − số mới, bỏ dòng = cả dòng, không quá `foc.max` (phần còn lại sau các khoản miễn đã có). Số lấy lúc bấm Ghi điều chỉnh, nên sửa ô sau 403 không làm lệch số máy chủ đã từ chối.
- Dòng đầu form `foc.reduce_note`, chỉ khi mở từ nút này. Mở form theo lối thường thì không có.
- Không chọn sẵn lý do: câu `foc.reduce_note` mời người dùng chọn.
- Nút chỉ hiện khi dòng còn xin miễn được (`canAskFoc`: folio mở, còn phần chưa miễn). FOC minibar tự áp vẫn theo BR-436 (mật khẩu), như form thường.

**Lý do Ghi nhầm** (`entered_in_error`, US-177 AC8)
- `LINE_FOC_REASONS` (form miễn phí của dòng đã ghi, cả ở Trả phòng bước 2): BR-432 + Ghi nhầm, "Khác" vẫn cuối.
- Không thêm vào chỗ ghi phụ thu kèm xin miễn (B9, B15 – `FOC_REASONS`): dòng đó đang được ghi, không phải ghi nhầm.
- Tên lý do trên Desk: `FOC_REASON` (`app/folio.ts`: dòng folio "Miễn phí · Ghi nhầm", Cần duyệt, Yêu cầu đã gửi) và `CODE_KEYS` (`app/auditReason.ts`: Nhật ký tiền).
- Bill khách (AC10): máy chủ `getBill` không gửi lý do này (`guestFacing`), nên `lineLabel` in "Miễn phí". Desk không cần sửa gì thêm.

**Thân lệnh gửi** (`requestFoc`, `FocRequestInput`): `{ kind: 'foc', amountVnd, reasonCode: 'entered_in_error', note? }`. Không có trường mới.

**Mock** (`mocks/stay.ts`, bám `line-reduction.ts`)
- Dòng mock có thêm `source` (`manual` ở A30, `minibar_check` ở đếm minibar), `postedByUserId`, và `root` trên dòng thay thế (xét theo dòng gốc).
- `adjustments`: FD/FDL sửa giảm dòng khác dòng đêm mà dòng gốc không phải gõ tay, không do chính họ ghi, hoặc khác ngày nghiệp vụ → 403 `FORBIDDEN_ACTION` + `requiredFlow: foc_request`, không ghi gì. Kiểm sau A32 (folio đã chốt vẫn 403 không có `requiredFlow`).
- Các trường chỉ có ở mock không gửi ra (`wireLine`) ở `getFolio`, tóm tắt trả phòng, bill.
- Bill mock bỏ lý do `entered_in_error` như máy chủ.
- Hai test cũ (`s4-money` S4-27, `s4-205` N-6) cho FD giảm dòng chưa có nguồn: nay dòng đó ghi rõ là FD tự nhập tay hôm nay (đúng ý ca), không đổi điều kiện kiểm.

**Chữ**: `gen_strings.py` thêm 5 khóa chép nguyên UXD 9.5 (`folio.adjust_reduce_rule`, `error.reduce_needs_foc`, `folio.foc_request_btn`, `foc.reduce_note`, `foc.r_entered_in_error`). Đã sinh lại `strings-*.json`, `strings.js`, `strings-tables.md`. Không thiếu chữ.

**Thương hiệu**: chỉ dùng thành phần có sẵn (`Alert` warn có nút, `Button`, chữ `li-s`). Không thêm màu, CSS, emoji.

## 2. Kiểm
`src/__tests__/v5-16-desk-reduce-foc-fea.test.tsx`, 12 ca (Vitest + Testing Library, mock API):
1. FD, rồi FDL, giảm số lượng dòng mình nhập tay hôm nay: ghi ngay, thân `{ newQuantity: 2, reason }`, không gọi `requestFoc`, không dòng FOC; hộp có câu luật (T16-6).
2. FD bỏ dòng lễ tân khác nhập (T-16-2, T-16-11): câu `error.reduce_needs_foc`, không câu chung, không lộ mã; hộp giữ ô Bỏ cả dòng và lý do; folio không đổi. Nút mở form đúng dòng, số 105.000 (cả dòng), có `foc.reduce_note`. Chọn Ghi nhầm, gửi: thân đúng `{ kind: 'foc', amountVnd: 105000, reasonCode: 'entered_in_error' }`, yêu cầu chờ duyệt trên đúng dòng, folio hiện "Miễn phí · Ghi nhầm".
3. FD giảm dòng mình ghi hôm qua (T16-8): 3 → 2 điền 35.000; bỏ dòng khi đã miễn 50.000 điền 55.000 (`foc.max`), không 105.000.
4. FDL giảm đơn giá dòng Desk tự ghi (T-16-4, T-16-7): 403 → form điền 15.000 (3 × 5.000).
5. 403 không có `requiredFlow`: câu chung, không nút.
6. MGR, rồi OWN, bỏ dòng lễ tân khác nhập hôm qua: ghi ngay, không câu luật (T16-11).
7. Form miễn phí mở theo lối thường: có Ghi nhầm, không `foc.reduce_note`, số = phần còn lại.
8. `LINE_FOC_REASONS` có Ghi nhầm trước Khác; `FOC_REASONS` (B9, B15) không có.
9. Tên lý do trên folio, Cần duyệt, Nhật ký tiền; dòng không có lý do in "Miễn phí".
10. Bill mock không có lý do Ghi nhầm, folio vẫn có; folio không lộ trường chỉ có ở mock.

Admin-web cả bộ, `tsc` (admin-web, api-client), `eslint`, `prettier --check`: xanh. Số ca: xem PR.

## 3. Việc cần vai khác (không ESC)
- **UXD**: xem khung cảnh báo có nút trong hộp Điều chỉnh (hộp `sm`, 390 px) và câu `foc.reduce_note` đầu form. Câu hỏi: có điền sẵn ô Ghi chú của form miễn phí bằng lý do đã gõ ở hộp Điều chỉnh không? Bản này để trống, theo 9.5 chỉ nói Số tiền.
- **QA**: TC-V105-B438-03 (phần Desk), -09 (form mở đúng dòng, số = số cũ − số mới), -04 (folio đã chốt: không nút). Ca E2E -09 dùng được nhãn nút `folio.foc_request_btn`.
- **PO, BA**: plan 4a T4 có phần Desk thì bỏ câu tạm ở **Giới hạn đã biết** v1.0.5 ("Desk chỉ báo lỗi chung"), và sổ tay mục sửa dòng folio, `02` 9.5 dùng nút **Gửi miễn có duyệt** thay lối "Mở form miễn phí / giảm giá".
- **Ngoài phạm vi PR này:** đếm lại minibar thấp hơn (BR-438 (2a), T-16-13) chưa có 403 ở `recordMinibarCheck` (máy chủ chỉ ghi audit, chờ hợp đồng). Khi có, hộp đếm minibar dùng cùng nút.

## 4. Giả định, ESC
- Không có ESC mới.
- Giả định:
  - `lineReductions[]` trong hợp đồng là trường đọc của `ShiftReport` (danh sách đóng ca), đã dời v1.0.6 (R5-B-10, US-177 AC7 (iii)). Desk không gửi trường này. Thân gửi của luồng là `FocRequestInput` của `requestFoc`;
  - dòng không còn xin miễn được (đã miễn hết hoặc đang chờ duyệt cả dòng): 403 vẫn hiện câu chỉ dẫn, không có nút;
  - nút và câu luật xét vai theo `limitedByBr438` của máy chủ: người có cả vai lễ tân lẫn quản lý sửa như quản lý.
