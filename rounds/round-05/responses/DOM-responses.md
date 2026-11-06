# DOM – phản hồi thẻ Round 5

- Tác giả: DOM | Round 5 – Phản hồi & sửa | Ngày: 07/11/2026

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R5-QA-DOM-BR438-01 | Done (chọn **A**) | Xem lý do và việc theo vai ngay dưới bảng |

## FB-R5-QA-DOM-BR438-01 – vì sao chọn A

QA đúng: B18 ghi dòng trả muộn (`source = checkout`) rồi `folios.settle` trong cùng giao dịch. Kiểm A32 ở `folio-lines.service.ts` `adjust` đứng trước kiểm BR-438. Dòng B18 vì thế không bao giờ nằm trên folio mở.

Chọn A, không chọn B, vì ba lý do:

1. **Nghiệp vụ.** Sau Trả phòng, khách đã trả xong. Giảm một dòng lúc này là trả lại tiền đã thu. Ngành lưu trú để việc đó cho quản lý. Luật của ta cũng vậy: A32, và BR-433 (e) tính lần giảm này là một lần miễn.
2. **Lễ tân vẫn có đường miễn.** Đường đó làm **trước** khi bấm Trả phòng:
   - đặt giờ trả muộn (B15) → dòng trả muộn trên folio mở → gửi FOC theo BR-433 (BR-438-07);
   - lúc Trả phòng, FOC đã duyệt đi theo sang dòng B18, tối đa bằng số tiền dòng mới (`replaceLateCharge` + `syncReductions`);
   - ca phụ thu thay đêm có sẵn ô xin FOC trong lần Trả phòng (`lateFeeInsteadOfNight.requestFoc`).
3. **Phương án B mở lại việc lớn mà không thêm lợi ích.** "Gửi miễn có duyệt" trên folio đã chốt là một lối hoàn tiền thứ hai, chạy song song A32 và yêu cầu hoàn. Đi đường này cần đổi hợp đồng, đổi BE, đổi Desk ngay trước v1.0.5. Ở OTTIMO hiện nay, người trực giữ cả vai quản lý, nên sửa được theo A32, có lý do, và chủ đầu tư xem lại mỗi sáng. Khi có lễ tân riêng, lễ tân nhờ quản lý.

## Việc theo vai

- **QA:**
  - BR-438-04 thành ca A32: dòng `checkout` trên folio `settled`. FD/FDL nhận 403 `FORBIDDEN_ACTION`, **không** `requiredFlow`. MGR được, theo BR-433 (e). Bỏ `hint` khỏi `expected`;
  - TC-V105-B438-04 kiểm thêm: thân 403 không có `requiredFlow`.
- **DOM (đã làm, cùng commit này):**
  - `business-rules.md` v0.5.15: sửa ví dụ BR-438, không đổi luật;
  - `rules-v1.0.5.md`: mục 7.2 ý 3, ca T-16-4, mục 14.6;
  - review `DOM-on-be-prs-101-108-110.md` mục 3.5, dòng BR-438-04.
- **BA:** sổ tay chỗ nói miễn phụ thu trả muộn ghi một câu: "Muốn miễn phụ thu trả muộn: làm trước khi bấm **Trả phòng** (đặt giờ trả muộn rồi **Gửi miễn có duyệt**). Sau Trả phòng chỉ quản lý sửa được." Không chặn v1.0.5.
- **ARC/BE:** không có việc. Thứ tự A32 trước BR-438 là đúng ý nghiệp vụ, giữ nguyên.

## Rủi ro BA mục 8, ý 1 – chốt chặn đếm lại minibar (BR-438 (2a)) ở OTTIMO hiện nay

ORC giao 07/11 (BA `792e510a`, `rounds/round-05/outputs/BA/report.md` mục 8). SEC đọc sau.

### Đánh giá

BA đúng ở cả ba điểm:

- App nhân viên chưa có màn đếm minibar. Buồng phòng báo số bằng lời, lễ tân gõ ở bước Minibar của Trả phòng (`CheckOutPage.tsx` là nơi duy nhất gọi `recordMinibarCheck`).
- Vì vậy lần đếm "gốc" thường là của chính lễ tân, gõ trong ngày. Hạ số sau đó vẫn hợp lệ theo BR-438 (1). Gõ thấp ngay từ đầu thì không có lần "sửa giảm" nào để chặn hay lọc.
- Lối "nhờ buồng phòng đếm lại" không gỡ được chặn: số buồng phòng đếm lại vẫn do lễ tân gõ.

DOM thêm một điểm lớn hơn. **Ở OTTIMO hôm nay, BR-438 không chặn người trực ở dòng nào, kể cả minibar:**

- Tài khoản đang trực giữ 6 vai, có vai quản lý (decision-log 29/10).
- BR-438 chỉ giới hạn lễ tân, lễ tân trưởng **không** có vai quản lý (`limitedByBr438` trên `r5-b2`: có `owner` hoặc `manager` thì không giới hạn; BR-438 (3)).
- Buồng phòng cũng là chính người đó, nên không có tách người đếm với người ghi số.

Điều này đúng ý chủ đầu tư đã chấp nhận ngày 29/10: người trực tự ghi, tự duyệt; bù lại chủ đầu tư rà Nhật ký tiền và Cần chú ý mỗi ngày. Chốt chặn (2a) chỉ có tác dụng khi có **đủ hai điều kiện**:

1. có lễ tân riêng, không giữ vai quản lý;
2. buồng phòng tự đếm trên app.

Thiếu một trong hai thì chốt vô hiệu.

Số tiền ở rủi ro nhỏ: 10 căn, mỗi món minibar vài chục nghìn đồng (ví dụ BR-438: bia 35.000).

Có một khoảng trống cần nói rõ. Bộ lọc **Sửa giảm dòng – 7 ngày** (#108) chỉ đọc `folio_line.adjusted`, mà lần đếm lại minibar trên `main` lại ghi `folio.line_reversed` (lý do "Đếm lại minibar") cộng một dòng mới. Hệ quả:

- tới khi BE-A2 làm phần audit của BR-438 (2a), lần đếm lại thấp hơn **không** hiện trong bộ lọc;
- lượt rà tuần của chủ đầu tư sẽ bỏ sót, nếu chỉ nhìn bộ lọc.

### Đề xuất DOM

**(A) Chấp nhận rủi ro tới khi có màn đếm minibar cho buồng phòng, kèm một kiểm soát thao tác không cần code.** Không đổi luật BR-438.

1. **Giới hạn đã biết v1.0.5** (PO ghi vào release notes). Chữ đề xuất:
   > Chốt chặn "lễ tân đếm lại minibar thấp hơn" chỉ có tác dụng khi lễ tân không giữ vai quản lý và buồng phòng tự đếm trên app. Hiện buồng phòng báo số bằng lời và lễ tân nhập, nên chủ đầu tư đếm kho minibar mỗi tuần (sổ tay 1.1).
   >
   > Lần đếm lại minibar chưa hiện trong bộ lọc **Sửa giảm dòng – 7 ngày**. Xem thêm dòng **Đảo dòng folio**, lý do **Đếm lại minibar**, ở **Nhật ký thao tác tiền**.

   Bỏ câu thứ hai nếu BE-A2 kịp phần audit.
2. **Kiểm soát K-MB – chủ đầu tư đếm kho minibar mỗi tuần** (khoảng 10 phút, cùng lượt rà tuần ở sổ tay 1.1). Đây là cách duy nhất bắt được trường hợp gõ thấp ngay từ đầu.
   - Hàng minibar để ở một chỗ riêng có khóa; chủ đầu tư giữ chìa dự phòng. Nhập mua thì ghi sổ kho: ngày, món, số lượng.
   - Người nạp tủ ghi phiếu nạp đặt ở kho, mỗi lần một dòng: ngày, căn, món, số lượng lấy ra. Không ghi tên khách.
   - Mỗi tuần, chủ đầu tư:
     - đếm kho, tính theo từng món: tồn đầu tuần + nhập − tồn cuối = số đã lấy ra, rồi so với tổng phiếu nạp;
     - chọn ngẫu nhiên 3 dòng phiếu nạp sau trả phòng. Với mỗi dòng, mở đơn đã trả phòng của căn đó, ngày đó, rồi xem **Folio**: số món minibar có tính tiền trên bill phải bằng số món đó trên phiếu. Món miễn phí không có dòng trên bill nên không so. Trang Buồng phòng chỉ hiện việc hôm nay, nên không dùng trang này cho lượt rà tuần; trong ngày thì việc bổ sung hiện "Bổ sung minibar: …".
   - Phiếu nhiều hơn bill nghĩa là lần đếm lúc trả phòng thấp hơn thực tế. Khi đó xem **Nhật ký thao tác tiền** của đơn đó: có lần sửa giảm hay đếm lại thấp hơn không.
   - Lệch quá 2 món một tuần, hoặc một dòng ngẫu nhiên lệch: chủ đầu tư hỏi người trực, ghi sổ.
   - Vì sao giữ kiểm soát này cả khi người trực là người nhà: nó bắt cả lỗi đếm nhầm, không chỉ gian lận. Nó cũng cho số thật về minibar để chủ đầu tư quyết nhập hàng.
3. **Điều kiện trước ngày giao tài khoản lễ tân riêng** (không vai quản lý). Cần **một trong hai**:
   - **màn đếm minibar cho buồng phòng trên app nhân viên** (backlog, PO xếp). Khi có màn này, lần đếm gốc là của buồng phòng và chốt (2a) mới có tác dụng;
   - **phiếu đếm giấy**: buồng phòng ghi và ký số đếm từng món; lễ tân nhập đúng số phiếu; phiếu kẹp sổ giao ca; quản lý so 3 phiếu ngẫu nhiên với bill mỗi tuần.

   Giữ K-MB trong cả hai trường hợp.

**(B) Không đề xuất:** thêm code chặn mới trước v1.0.5. Chặn trên người gõ số khi người gõ là người duy nhất ở quầy không có tác dụng, chỉ làm chậm Trả phòng.

### Việc theo vai

- **PO:**
  - thêm hai câu ở mục (A) 1 vào "Giới hạn đã biết v1.0.5";
  - xếp backlog "Màn đếm minibar cho buồng phòng trên app nhân viên" (v1.0.6 hoặc v1.1, theo ngày OTTIMO có nhân viên thuê riêng);
  - ghi điều kiện (A) 3 vào danh sách việc trước khi giao tài khoản lễ tân riêng (cùng chỗ decision-log 29/10 "Khi có nhân viên lễ tân/buồng phòng thật…").
- **BA:**
  - sổ tay 1.1 và `01` 2.1 (việc mỗi tuần): thêm K-MB, gồm đếm kho và so 3 dòng phiếu nạp;
  - `03` mục 7 và sổ tay 3.7: người nạp ghi phiếu nạp ở kho;
  - hai khối [Chờ xác nhận] ở `02` 11.1 bước 2 và sổ tay 2.14: như BA đề xuất, chỉ ghi "báo quản lý", bỏ "nhờ buồng phòng đếm lại";
  - câu bộ lọc 7 ngày ở sổ tay 1.15, `01` 8.1: xem thẻ FB-R5-DOM-BA-03 (`DOM-on-ba-v105-docs.md` mục 3).
- **BE-A2 (`r5-v516-minibar`):**
  - phần **chặn** của (2a) không cần cho v1.0.5, vì ở OTTIMO hôm nay nó vô hiệu. Làm cùng màn đếm của buồng phòng;
  - phần **audit** (lần đếm làm dòng nhỏ đi hiện trong bộ lọc 7 ngày) đáng làm sớm nếu rẻ, vì chủ đầu tư dựa vào lượt rà tuần. ORC quyết theo sức BE.
- **SEC:** đọc đề xuất này, nhất là việc đưa phần chặn của V516-01 sang làm cùng màn đếm của buồng phòng. SEC giữ Major thì ORC xếp lại.
- **ESC:** không. Chủ đầu tư đã chấp nhận mô hình một người 6 vai ngày 29/10; K-MB là việc thêm cho chủ đầu tư, báo trong release notes.
