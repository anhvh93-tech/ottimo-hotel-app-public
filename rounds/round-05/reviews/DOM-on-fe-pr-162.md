# DOM review – FE PR #162: ô "Người chốt" trên khung đơn theo mốc (DOM 154-03)

- Người review: DOM | Round 5 (v1.0.5) – Review | Ngày: 07/11/2026
- Đối tượng: PR #162 (`r5-fe-closer-field`), commit **`c5cc1f50`**:
  - `CloserField.tsx` (`closerAccess`, `closerKindOf`, thân PATCH, xử lý 403/409/412/422);
  - chỗ gắn ô ở `ReservationDrawer.tsx`;
  - 7 khóa chữ mới (VI, EN);
  - test `v5-30-closer-field-fea.test.tsx`;
  - báo cáo `rounds/round-05/outputs/FE/v5-30-closer-field-fea.md` (bảng vai × mốc, giả định G1–G7).
  DOM chỉ xét phần nghiệp vụ: ai sửa được ở mốc nào, hai dòng chỉ đọc, lý do, đơn hủy/no-show, SAL/CTV. Không xét bố cục và câu chữ (UXD), bảo mật (SEC), mã (ARC).
- Đối chiếu:
  - DOM `DOM-on-be-h-pr-154.md` thẻ 154-03, 154-04;
  - luật máy chủ trên `main` (`updateReservation`, #154/#157);
  - sổ tay `02-le-tan.md` (gạch "Chọn nhầm người chốt") và `01-chu-dau-tu-quan-ly.md` 7.5;
  - BR-903, BR-105 (tiền lệ "quản lý hoặc chủ đầu tư làm được từ xa").
- Cách đọc: `gh pr diff 162` và `git show` trên `origin/main`. Không checkout nhánh, không chạy mã. Tên trong mock và test là dữ liệu giả. Không dữ liệu khách, không tỷ lệ hay số tiền hoa hồng.

## 0. Kết luận

**DUYỆT.** Ô "Người chốt" khớp đúng luật máy chủ ở cả 16 ô vai × mốc. Vai nào máy chủ trả 403 thì Desk không có ô chọn, không có nút, nên lễ tân làm đúng việc không sinh `access.denied`. Thẻ 154-03 đã xong:
- hai dòng chỉ đọc nói đúng cần báo ai;
- thân PATCH chỉ có người chốt, thêm lý do khi đổi.

Luồng "báo quản lý trước khi khách nhận phòng" đúng với cách quầy làm việc. Còn hai chỗ nên nói thêm trong sổ tay: không giữ khách chờ (thẻ 162-02), và đơn chọn nhầm nguồn (thẻ 162-03).

Đề xuất ORC đóng FB-R5-DOM-BE-154-03 khi #162 gộp. Bốn thẻ Suggestion, không chặn gộp. Không ESC.

## 1. Đối chiếu

### 1.1 Ai sửa được ở mốc nào

| Mốc | Máy chủ (`main`) | Desk (#162) | Kết quả |
|---|---|---|---|
| `hold` | Không xét vai, không bắt lý do | FD+ có ô chọn, không ô lý do | Khớp |
| `confirmed`, chưa nhận phòng | MGR+; vai khác 403 `CLOSER_CHANGE_BEFORE_CHECKIN` | OWN, MGR: ô chọn, lý do "Không bắt buộc". FD, FDL: chỉ đọc + `rsv.closer.readonly_manager` | Khớp |
| Sau nhận phòng (`in_house`, `checked_out`, hoặc đã có giờ nhận phòng thật) | Chỉ OWN, lý do bắt buộc; vai khác 403 `CLOSER_CHANGE_AFTER_CHECKIN` | OWN: ô chọn, lý do bắt buộc. MGR, FDL, FD: chỉ đọc + `rsv.closer.readonly_owner` | Khớp |
| `cancelled`, `no_show` | Mọi PATCH 409 | Chỉ tên, không dòng hướng dẫn (G6) | Khớp |
| SAL, CTV | – | Không có dòng | Đúng (mục 1.4) |

Mốc "sau nhận phòng" ở Desk và máy chủ dùng **cùng một điều kiện**: đơn `in_house` hoặc `checked_out`, hoặc đơn đã có giờ nhận phòng thật. Vì vậy hai bên không lệch nhau ở đơn vừa nhận phòng.

Lý do: Desk chặn trước khi gửi khi OWN để trống sau nhận phòng, hoặc khi đã gõ mà chưa đủ 3 ký tự. Trước nhận phòng, để trống vẫn gửi được. Khớp V-08 (3–500 ký tự) và DOM 1H-05.

Thân PATCH:
- chỉ có `closerUserId`, thêm `closerChangeReason` khi người chốt đổi ở đơn ngoài giữ chỗ;
- không bao giờ gửi lý do khi người chốt không đổi;
- đơn `checked_out` nhận đúng hai trường này.
Khớp gạch cuối của 154-03 và BE 1H-01.

### 1.2 Hai dòng chỉ đọc và luồng "báo quản lý trước khi khách nhận phòng"

- `readonly_manager` (FD, FDL ở đơn đã xác nhận): "Cần đổi người chốt? Báo quản lý trước khi khách nhận phòng. Sau đó chỉ chủ đầu tư đổi được."
- `readonly_owner` (MGR, FDL, FD sau nhận phòng): "Khách đã nhận phòng nên chỉ chủ đầu tư đổi được người chốt. Cần đổi thì báo chủ đầu tư."

Đúng cách quầy làm việc:
- **Đơn đã xác nhận:** người phát hiện nhầm thường là sale ("đơn này em chốt") hoặc lễ tân lúc gọi xác nhận khách. Lễ tân báo quản lý. Quản lý sửa được từ xa trên Desk của mình, như tiền lệ BR-105. Đơn đặt trước nhiều ngày nên thời gian còn rộng.
- **Đơn sắp nhận phòng:** dòng nói rõ mốc, nên lễ tân biết phải báo ngay.
- **Hết mốc:** khách đã nhận phòng ở máy khác trong lúc quản lý đang sửa. Desk tải lại đơn rồi mới hiện `error.closer_change_forbidden`, ô thành chỉ đọc với dòng `readonly_owner`. Người dùng thấy ngay phải báo chủ đầu tư, không phải đoán vì sao bị từ chối.
- **Đơn đã trả phòng:** câu "Khách đã nhận phòng…" vẫn đúng sự thật. Chủ đầu tư sửa sau trả phòng thì hoa hồng chuyển sang người mới (#154/#157). Đây đúng là việc của K14.
- Hai dòng khớp sổ tay `02-le-tan.md` ("Đơn đã xác nhận thì báo quản lý ngay, trước giờ khách nhận phòng. Khách đã nhận phòng thì chỉ chủ đầu tư sửa") và bảng 7.5 của `01-chu-dau-tu-quan-ly.md`.

Không bước nhận phòng nào cần người chốt đúng. Vì vậy lễ tân không bị chặn khi nhận khách. Sổ tay nên nói rõ điều này (thẻ 162-02).

### 1.3 Đơn hủy, no-show (G6)

Đồng ý G6: chỉ tên, không dòng hướng dẫn.
- Căn hủy không tính hoa hồng (BR-903, BR-326). Dòng dự kiến bị `void` lúc hủy hoặc no-show, nên không còn gì để tranh người chốt.
- Đơn được khôi phục (B12 no-show, sau này B19) quay lại `confirmed`/`hold`. Lúc đó ô sửa tự hiện theo mốc mới.
- Còn thiếu một ca test cho mốc này (thẻ 162-04).

### 1.4 SAL, CTV không có dòng

Đúng nghiệp vụ:
- Sửa người chốt không phải việc của sale/CTV.
- Sale/CTV đã có dòng **Hoa hồng dự kiến của bạn** trên đơn của mình, nên biết mình có được ghi nhận không. Có tranh chấp thì sale báo quản lý, như sổ tay.

### 1.5 Người chốt không còn hoạt động (G4)

Tài khoản người chốt đã tắt thì ô hiện `mlog.who_unlisted` thay cho tên. DOM chấp nhận, như ở #159:
- lễ tân không cần tên đó để làm việc;
- chủ đầu tư xem tên ở Nhật ký tiền và sổ chi của mình.

## 2. Thẻ

### FB-R5-DOM-UXD-162-01
- Mức độ: Suggestion – UXD (chữ 9.16), FE (chỉ đổi chữ). v1.0.6, không chặn #162.
- Vị trí: `rsv.closer.readonly_manager` (VI, EN).
- Vấn đề: dòng chỉ nói "Báo quản lý". Ở mốc này chủ đầu tư cũng sửa được (MGR+), và không phải ghi lý do. OTTIMO có 10 căn, không phải ca nào cũng có quản lý. Lúc vắng quản lý, lễ tân dễ để qua lúc nhận phòng. Sau đó chủ đầu tư phải sửa với lý do bắt buộc, và hoa hồng phải chuyển lại.
- Vì sao quan trọng: sửa trước nhận phòng là cách rẻ nhất: chưa có dòng đạt, không cần lý do. BR-105 đã dùng cùng cách nói: "gọi quản lý hoặc chủ đầu tư (làm được từ xa)".
- Đề xuất sửa: "Cần đổi người chốt? Báo quản lý hoặc chủ đầu tư trước khi khách nhận phòng. Sau đó chỉ chủ đầu tư đổi được." EN tương ứng: "Tell a manager or the owner before the guest checks in." Sổ tay `02-le-tan.md` sửa cùng câu.
- Trạng thái: Open

### FB-R5-DOM-BA-162-02
- Mức độ: Suggestion – BA (`02-le-tan.md`, gạch "Chọn nhầm người chốt"). Bản sổ tay kế tiếp.
- Vị trí: `product/docs/manual/guides/02-le-tan.md`, gạch "Chọn nhầm người chốt".
- Vấn đề: sổ tay ghi "báo quản lý ngay, trước giờ khách nhận phòng", nhưng không nói phải làm gì khi chưa báo kịp mà khách đã ở quầy.
- Vì sao quan trọng: lễ tân có thể giữ khách chờ để "kịp mốc". Người chốt là việc nội bộ, không bao giờ được làm khách chờ. Desk cũng không bắt người chốt đúng khi nhận phòng.
- Đề xuất sửa: thêm một câu: "Chưa báo kịp mà khách đã đến: nhận phòng bình thường, không để khách chờ. Sau đó báo chủ đầu tư, ghi sổ giao ca mã đơn và tên người chốt đúng. Không ghi tỷ lệ hay số tiền hoa hồng."
- Trạng thái: Open

### FB-R5-DOM-PO-162-03
- Mức độ: Suggestion – PO (xếp v1.0.6), BA (sổ tay ngay), ARC (hợp đồng nếu PO xếp).
- Vị trí:
  - `closerKindOf`: dòng chỉ hiện khi kênh là CTV, hoặc Trực tiếp với nguồn "Sale nội bộ", hoặc đơn đã có người chốt;
  - `ReservationPatch`: không có `directSource`/kênh.
- Vấn đề: ca hay gặp ở quầy: sale chuyển khách qua điện thoại, lễ tân tạo đơn với nguồn "Zalo / điện thoại" thay vì "Sale nội bộ". Đơn không có dòng "Người chốt", và Desk không có cách nào sửa nguồn rồi thêm người chốt sau khi tạo đơn. #162 đúng hợp đồng, nên đây không phải lỗi của #162.
- Vì sao quan trọng: sale mất ghi nhận trên Desk. Chủ đầu tư chỉ biết nếu được báo, rồi chi ngoài Desk như v1.0.4.
- Đề xuất sửa:
  - **Ngay (BA):** thêm vào sổ tay: "Chọn nhầm nguồn (đơn của sale mà không chọn Sale nội bộ): Desk chưa sửa được nguồn. Báo chủ đầu tư, ghi sổ giao ca mã đơn và tên sale."
  - **v1.0.6 (PO xếp, ARC):** cho MGR+ đổi nguồn Trực tiếp sang "Sale nội bộ" kèm người chốt, trước nhận phòng, theo cùng mốc của bảng 1.29.
- Trạng thái: Open

### FB-R5-DOM-FE-162-04
- Mức độ: Suggestion – FE (test), QA.
- Vị trí: `v5-30-closer-field-fea.test.tsx`.
- Vấn đề: 16 ô vai × mốc chỉ phủ `hold`, `confirmed`, `in_house`, `checked_out`. Không có ca cho `cancelled`/`no_show` (G6): chỉ tên, không ô chọn, không dòng `readonly_*`, không nút Lưu.
- Vì sao quan trọng: nếu sau này ai sửa `closerAccess`, đơn hủy có thể hiện ô chọn. Khi đó lễ tân bấm thì chỉ nhận 409 mà không hiểu vì sao.
- Đề xuất sửa: thêm một ca lặp cho OWN và FD × `cancelled`, `no_show`.
- Trạng thái: Open

## 3. Điểm làm tốt

- `closerAccess` chép đúng luật máy chủ, kể cả mốc "đã có giờ nhận phòng thật", và có đột biến thử (cho FD/FDL sửa ở `confirmed` → ca đỏ).
- Ca 403 "khách vừa nhận phòng ở máy khác" là ca thật ở quầy. Desk đọc lại đơn trước rồi mới báo, nên dòng hướng dẫn đúng mốc mới.
- Ô lý do chỉ hiện khi người chốt thật sự đổi. Chọn lại người cũ thì chữ đã gõ bị xóa. Như vậy không có lý do nào được lưu mà không có thay đổi đi kèm.
- FE giữ `BookingDialog` (hộp tạo đơn) không đổi và nói rõ lý do (G1). Đúng: luật mốc chỉ áp cho đơn đã có.

## 4. Giả định

- PR head vẫn là `c5cc1f50` lúc gộp. Chỉ sửa chữ theo UXD (G2, G3, G7) thì DOM không cần xem lại.
- Câu chữ 9.16 là của UXD. Thẻ 162-01 chỉ là gợi ý nghiệp vụ cho bản chữ kế tiếp, không đòi sửa trong #162.
- DOM không chạy test. Phần quyền theo mốc DOM đối chiếu bằng cách đọc mã `closerAccess` và `updateReservation` trên `main`.

## 5. Dòng decision log (ORC ghi)

`| 2026-11-07 | 5 | **DOM – review FE PR #162 (ô Người chốt trên khung đơn, V5-30) @ c5cc1f50: DUYỆT về nghiệp vụ.** closerAccess khớp máy chủ ở 16 ô vai × mốc (cùng điều kiện "sau nhận phòng": in_house/checked_out hoặc có giờ nhận phòng thật): hold FD+ không lý do; confirmed MGR+ lý do không bắt buộc, FD/FDL chỉ đọc + readonly_manager; sau nhận phòng chỉ OWN lý do bắt buộc, MGR/FDL/FD chỉ đọc + readonly_owner; cancelled/no_show chỉ tên (G6 đúng: căn hủy không tính hoa hồng); SAL/CTV không có dòng. Vai bị 403 không có nút nên không sinh access.denied; thân chỉ closerUserId (+ lý do khi đổi). Luồng "báo quản lý trước khi khách nhận phòng" đúng quầy; 403 khi khách vừa nhận phòng ở máy khác thì tải lại rồi hiện dòng readonly_owner. Đóng FB-R5-DOM-BE-154-03 khi #162 gộp. Thẻ Suggestion: 162-01 UXD readonly_manager "báo quản lý hoặc chủ đầu tư" (v1.0.6); 162-02 BA sổ tay: không giữ khách chờ vì người chốt; 162-03 PO/BA chọn nhầm nguồn (không Sale nội bộ) thì Desk không thêm được người chốt – sổ tay ngay, đổi nguồn MGR+ ở v1.0.6; 162-04 FE test cancelled/no_show. Không ESC | DOM | rounds/round-05/reviews/DOM-on-fe-pr-162.md |`
