# UXD review – v1.0.4 P4-32 `v104/fe-checkout` (FE-B, PR #64)

- Người review: UXD | Round 4 – đợt v1.0.4 – bước **Review** | 04/11/2026
- Đối tượng: `git diff origin/main...558c2b01`. Mã: `pages/stay/CheckOutPage.tsx`. Test: `v104-checkout-feb.test.tsx` (8 ca), cùng 3 ca cũ chỉnh đồng hồ.
- Đã đọc:
  - báo cáo `rounds/round-04/outputs/FE/v1.0.4-p4-32-fe-checkout.md`, nhất là mục 6 (U1–U5);
  - ghi chú khóa `checkout.pending_refund_line`, `checkout.use_early_departure`, `approvals.refund_may_decrease`, `co.complete_paid`, `checkout.complete`.
- Ảnh: 6 ảnh `v1.0.4-p4-32-*-{vi,en}-1366.png` gồm bước ③ Bill, màn Kết quả và trang trước ngày đi. Dữ liệu giả của mock. Ảnh không có QR, không có số tài khoản.
- Khóa mới UXD đã thêm trên chính nhánh này: `94ac2ade` (cha `558c2b01`), push thường, không force.

## Kết luận: ĐẠT CÓ ĐIỀU KIỆN

Hai việc của gói đều đúng thiết kế:
- Dòng "Đang chờ hoàn cho khách … (yêu cầu từ Trả sớm)" nằm dưới "Còn phải thu" ở bước ③ và ở màn Kết quả, dùng hàng phụ `tr.sub` của DS.
- Trang Trả phòng mở trước ngày đi chỉ còn `Alert info` với câu `checkout.use_early_departure` và nút **Về chi tiết đơn**. Không có thanh bước, không gửi B18.

Chữ VI/EN khớp bảng strings. Brand đạt.

Điều kiện gộp: 3 thẻ dưới đây (U2, U3, U5). Cả ba đều nhỏ. Chỉ U5 cần khóa mới, và khóa đó đã có trên nhánh. U1 giữ như hiện tại. U4 dời sang v1.0.5.

Không có việc cần báo chủ đầu tư.

## 1. Trả lời U1–U5

| Câu | Quyết định | Làm khi nào | Khóa |
|---|---|---|---|
| **U1**: trang chỉ dẫn: giữ Alert info + nút, hay mở thẳng hộp Trả sớm | **Giữ như hiện tại.** Từ khung đơn tới Trả sớm chỉ thêm một lần bấm. Khung đơn cho lễ tân thấy lại cả lượt ở (ngày, folio, người ở) trước khi làm một thao tác về tiền. Mở thẳng hộp từ URL sẽ bỏ qua bước nhìn lại đó, và cần thêm đường dẫn sâu vào khung đơn | Không làm. Nếu UXR thấy lễ tân vướng ở đây thì xét lại | Không |
| **U2**: thêm `approvals.refund_may_decrease` dưới dòng mới khi còn chờ duyệt | **Có.** Ca này xảy ra đúng ở trang Trả phòng. Minibar và phụ phí ghi ở bước ①–② là "phát sinh ghi sau yêu cầu", và theo ARC 6.4 sẽ được trừ trước khi hoàn. Nếu khách đã trả dư, "Còn phải thu" vẫn có thể là 0, trong khi số thật sẽ hoàn nhỏ hơn số trên dòng. Lễ tân đọc số này cho khách, nên phải có câu nhắc. Thẻ 01 | **v1.0.4** | Không (dùng khóa có sẵn) |
| **U3**: nút "Đã thu … – hoàn tất" cạnh dòng chờ hoàn | **Đổi nhãn** khi có tiền chờ hoàn: dùng `checkout.complete` ("Hoàn tất trả phòng"), không in số. Số "Đã thu 3.192.000 đ" đúng về sổ sách. Nhưng đặt ngay cạnh "chờ hoàn 732.000 đ", lễ tân dễ đọc thành "khách trả 3.192.000 đ cho lượt này". Thẻ 02 | **v1.0.4** | Không (dùng khóa có sẵn) |
| **U4** (BA-025-07): hiện số chờ hoàn ở khung đơn trước trả phòng | **Dời v1.0.5.** Lý do thứ nhất: ARC chưa chọn hướng A1. Với FD/FDL, Desk hiện chưa thấy yêu cầu chờ duyệt do người khác tạo. Đưa số lên khung đơn (nơi mọi ca đều mở) thì chỗ thiếu này lộ ra nhiều hơn. Lý do thứ hai: nếu ARC chọn A1 (b) (`openRefundsByReason[]` trong `CheckoutSummary`, hoặc trường tương tự trên `Reservation`), khung đơn sẽ đọc trường đó thay vì đọc cả hàng chờ. UXD làm chữ và vị trí sau khi ARC chốt. TC-V104-CO-03 ghi N/A cho v1.0.4 | **v1.0.5** | Chưa. UXD cấp khóa khi có hướng A1 |
| **U5**: đọc danh sách lỗi: im lặng hay câu báo | **Có câu báo.** Nếu im lặng khi lỗi, lễ tân sẽ nghĩ khách không còn khoản chờ hoàn và không báo gì, trong khi khách đang chờ nhận 732.000 đ. Câu báo chỉ cho lễ tân chỗ xem lại trước khi nói với khách. Thẻ 03 | **v1.0.4** | **Mới:** `checkout.pending_refund_unavailable` (đã thêm, `94ac2ade`) |

Ghi chú về A1 (gửi ARC, không phải câu của UXD): câu U5 chỉ hiện khi **đọc lỗi**. Nó không che được chỗ thiếu A1, vì trong ca A1 việc đọc vẫn thành công, chỉ thiếu bản ghi. Vì vậy v1.0.4 vẫn cần câu trong sổ tay hoặc release notes như FE-B đề xuất: "ca chưa duyệt, xem ở Nhật ký tiền → Hoàn tiền".

## 2. Kiểm theo yêu cầu

| Mục | Kết quả |
|---|---|
| Brand | **Đạt.** Diff không có `style=`, không mã màu. Dòng mới dùng `tr.sub` (chữ Stone nhỏ, gạch đứt), như `co.late_fee_as_night_line`. Trang chỉ dẫn dùng `card`, `Alert info`, `Link.btn.pri` của DS. Tiêu đề trang dùng Lora, mã đơn và số phiếu dùng JetBrains Mono. Không emoji |
| Chữ VI/EN | Khớp `gen_strings.py`: `checkout.pending_refund_line` (VI "Đang chờ hoàn cho khách 732.000 đ (yêu cầu từ Trả sớm).", EN "Refund pending for the guest: 732,000 VND (requested in Early departure)."), `checkout.use_early_departure` (có ngày), `ci.back_to_booking`, `checkout.done`, `co.done_tasks`. Tiền trong câu có đơn vị |
| Trạng thái | Bước ③ và Kết quả: có số thì hiện dòng, số 0 thì không hiện, đọc lỗi thì im lặng (đổi ở thẻ 03). Trang trước ngày đi: hôm trước ngày đi hiện `LoadingBlock` tới khi có bản tóm tắt, nên không nháy câu sai. Cửa sổ sau nửa đêm vẫn chạy 3 bước. 409 `INVALID_TRANSITION` thì đọc lại đơn rồi chuyển sang câu chỉ dẫn. Câu sai "vừa chuyển sang Đang ở" không còn |
| 1366 VI/EN | Không vỡ. Dòng EN xuống 2 dòng trong thẻ Folio. Nút chính ở chân trang không bị đẩy |
| A11y | Trang chỉ dẫn: chỉ một việc chính (nút **Về chi tiết đơn**), Alert có icon kèm chữ, không chỉ dựa vào màu |

---

### FB-R4-UXD-FE-P432-01
- Mức độ: Major (U2)
- Vị trí: `CheckOutPage.tsx`, `pendingRefundRow` và `earlyDepartureRefundPendingVnd`. Ảnh `bill-pending-refund-*`, `result-pending-refund-*`
- Vấn đề: dòng chờ hoàn in tổng `amountVnd − refundedVnd` của yêu cầu. Nhưng khi yêu cầu còn **chờ duyệt** (`pending`/`escalated`), số khi duyệt có thể nhỏ hơn. Lý do: minibar và phụ phí ghi ở bước ①–② của chính trang này được trừ trước khi hoàn (ARC 6.4, GN-R4-QA-01). Với khách đã trả dư, "Còn phải thu" vẫn là 0 đ, nên không có tín hiệu gì cho lễ tân thấy số trên dòng có thể đổi.
- Vì sao quan trọng: lễ tân đọc số này cho khách khi khách rời đi. Nếu số khác với số khách nhận sau đó, khách sẽ hỏi lại hoặc khiếu nại về tiền.
- Đề xuất sửa:
  - Hàm cộng trả thêm cờ `anyAwaitingDecision`: có ít nhất một yêu cầu được tính đang ở `pending`/`escalated`.
  - Khi cờ bật, **cùng ô** `tr.sub` thêm một dòng thứ hai `<span className="li-s">{t('approvals.refund_may_decrease')}</span>`. Không thêm hàng `tr.sub` thứ hai, để không có hai gạch đứt.
  - Áp ở cả bước ③ và màn Kết quả. Yêu cầu đã `approved` (số đã chốt) thì không có câu này.
  - Không cần khóa mới. Câu "Số có thể giảm khi duyệt: phát sinh ghi sau yêu cầu này được trừ trước khi hoàn." đọc đúng ngay dưới dòng chờ hoàn.
  - Test: một ca `pending` có câu, một ca `approved` không có câu.
- Trạng thái: Open

### FB-R4-UXD-FE-P432-02
- Mức độ: Minor (U3)
- Vị trí: `CheckOutPage.tsx`, `completeLabel` (dòng khoảng 1757) và `confirmLabel` của `ConfirmDialog` (dòng khoảng 1862). Ảnh `bill-pending-refund-*`: nút "Đã thu 3.192.000 đ – hoàn tất" nằm ngay dưới dòng "Đang chờ hoàn cho khách 732.000 đ"
- Vấn đề: `co.complete_paid` in `paidShown`, tức tổng tiền đã nhận, gồm cả phần sẽ hoàn. Hai con số đứng cạnh nhau, và 3.192.000 không khớp với "Tổng cộng 2.460.000 đ" ở thẻ bên trái. Lễ tân dễ hiểu sai số nào là tiền của lượt ở.
- Vì sao quan trọng: nhỏ, vì không sai tiền. Nhưng đây là nút chốt cuối của trả phòng, và lễ tân thường đọc to nhãn nút khi chốt với khách.
- Đề xuất sửa:
  - Khi `edRefundVnd > 0` và không bật công nợ: cả nút chính lẫn nút xác nhận trong `ConfirmDialog` dùng `t('checkout.complete')` ("Hoàn tất trả phòng" / "Complete check-out").
  - Ca không có tiền chờ hoàn giữ `co.complete_paid` như cũ. Ca công nợ giữ `co.complete_debt`.
  - Không cần khóa mới. Thêm một ca test.
- Trạng thái: Open

### FB-R4-UXD-FE-P432-03
- Mức độ: Minor (U5)
- Vị trí: `CheckOutPage.tsx`, `edRefund` / `pendingRefundRow`. Hiện tại đọc lỗi thì `edRefundVnd = 0` và không có dòng. Ca test 5 đang kiểm "không có dòng"
- Vấn đề: lỗi đọc trông giống hệt "không có khoản chờ hoàn".
- Vì sao quan trọng: lễ tân không biết là phải tự xem lại. Khách có thể rời đi mà không được báo về khoản hoàn.
- Đề xuất sửa:
  - Khi `refundPhase` có giá trị và `edRefund.state.status === 'error'`, hiện cùng hàng `tr.sub` câu khóa mới `t('checkout.pending_refund_unavailable')`.
  - Câu không đỏ, không có nút Thử lại, không chặn **Hoàn tất**. Lúc sang màn Kết quả trang đã đọc lại, nên không cần nút Thử lại.
  - Khóa đã có trên `v104/fe-checkout` @ `94ac2ade`:
    - VI: "Chưa tải được khoản chờ hoàn từ Trả sớm. Xem ở Nhật ký tiền › Hoàn tiền trước khi báo khách."
    - EN: "Couldn't load the refund pending from Early departure. Check Money log › Refunds before telling the guest."
    - Không có tham số. "Nhật ký tiền" = `nav.moneylog`, "Hoàn tiền" = `refund.title`.
  - Sửa ca test 5: có câu này, **Hoàn tất** vẫn bấm được.
- Trạng thái: Open

## Điểm nên giữ
- Trang trước ngày đi đã tính đủ các ca biên: cửa sổ sau nửa đêm, hôm trước ngày đi chờ bản tóm tắt, và 409 sau khi đơn bị gia hạn. Không ca nào hiện câu sai hay gửi lệnh.
- Hàm cộng tách riêng, có test bỏ đúng các ca không tính: lý do khác, đơn khác, FOC, đã từ chối, đã hủy, đã chi đủ. Dòng không chặn **Hoàn tất**.
- Báo cáo nêu rõ chỗ thiếu A1 và tách câu hỏi theo vai (ARC / UXD), nên UXD trả lời nhanh được.

---

## Bổ sung 04/11 – đổi câu U5 (`checkout.pending_refund_unavailable`) theo lưu ý ARC

- Lý do đổi: theo ARC, tab Nhật ký tiền › Hoàn tiền có **cùng phạm vi** với dòng chờ hoàn. FD/FDL cũng không thấy ở đó yêu cầu do người khác tạo (A1). Câu cũ ("Xem ở Nhật ký tiền › Hoàn tiền…") vì vậy có thể chỉ tới một chỗ không có số. Sổ tay ghi "hỏi MGR/OWN", nên câu trên màn hình đổi cho khớp với sổ tay.
- **Quyết định: đổi câu.** Tên khóa và cách dùng giữ như thẻ FB-R4-UXD-FE-P432-03: chữ Stone, không đỏ, không có nút, không chặn Hoàn tất.
  - VI: "Chưa tải được khoản chờ hoàn từ Trả sớm. Hỏi quản lý trước khi báo khách."
  - EN: "Couldn't load the refund pending from Early departure. Ask a manager before telling the guest."
  - Ghi chú khóa mới (FE thay vào `gen_strings.py` rồi chạy gen): "P4-32 U5 (UXD-on-v104-p4-32, FB-R4-UXD-FE-P432-03, đổi chữ 04/11 theo ARC A1). H16 bước ③ Bill và màn Kết quả: đọc listApprovalRequests lỗi – thay chỗ checkout.pending_refund_line, cùng hàng tr.sub, chữ Stone, không đỏ, không chặn Hoàn tất. Không chỉ sang Nhật ký tiền: tab đó cùng phạm vi, FD/FDL không thấy yêu cầu người khác tạo. Một câu cho mọi vai (OWN/MGR gặp câu này thì tự xem ở hàng chờ duyệt)."
- UXD **không** push. ORC chuyển cho FE-B áp lên `v104/fe-checkout` (thay chữ của `94ac2ade`) và chạy `gen_strings.py`.
- Câu "xem ở Nhật ký tiền → Hoàn tiền" trong ghi chú A1 ở mục 1 cũng đổi theo sổ tay: "ca chưa duyệt, hỏi MGR/OWN".
- Thẻ 03 vẫn Open. Kiểm lại khi FE-B nộp lượt sửa: chữ phải là câu mới ở trên.

---

## Review lại @ 56e9e72f (04/11/2026)

- Đối tượng: `git diff 94ac2ade..56e9e72f`. Tệp sửa: `CheckOutPage.tsx`, `mocks/stay.ts` (phạm vi `approval-requests`, thẻ ARC 03), test, và `gen_strings.py` cùng các tệp sinh. Đọc kèm báo cáo FE mục 9.
- Ảnh đã xem, tất cả 1366, dữ liệu giả, không QR, không số tài khoản:
  - chụp lại: `bill-pending-refund-{vi,en}`, `result-pending-refund-{vi,en}`;
  - mới: `bill-refund-unavailable-{vi,en}`.

### Kết luận: ĐẠT

| Thẻ | UXD kiểm | Trạng thái |
|---|---|---|
| FB-R4-UXD-FE-P432-01 (Major, U2) | Hàm trả `{ vnd, awaitingDecision }`. Cờ chỉ bật với `pending`/`escalated`. Câu `approvals.refund_may_decrease` là dòng thứ hai **trong cùng ô** `tr.sub`, không thêm hàng thứ hai, nên chỉ có một gạch đứt. Ảnh: VI "Số có thể giảm khi duyệt: phát sinh ghi sau yêu cầu này được trừ trước khi hoàn." nằm ngay dưới dòng 732.000 đ, ở cả bước ③ và màn Kết quả. EN xuống 4 dòng, không tràn thẻ. Yêu cầu `approved` không có câu này (có test) | **Đóng** |
| FB-R4-UXD-FE-P432-02 (Minor, U3) | Có tiền chờ hoàn thì nút chính hiện "Hoàn tất trả phòng" / "Complete check-out", không in số. Nút xác nhận trong `ConfirmDialog` dùng cùng điều kiện (`paidLabel`). Không có tiền chờ hoàn thì giữ `co.complete_paid`. Công nợ giữ `co.complete_debt`. Có test cả hai nhánh | **Đóng** |
| FB-R4-UXD-FE-P432-03 (Minor, U5) | Chữ đúng bản đổi 04/11: VI "Chưa tải được khoản chờ hoàn từ Trả sớm. Hỏi quản lý trước khi báo khách." / EN "Couldn't load the refund pending from Early departure. Ask a manager before telling the guest.". Ghi chú khóa đúng bản UXD, đã chạy gen. Câu nằm ở hàng `tr.sub`, chữ Stone, không `role=alert`, không có nút Thử lại, **Hoàn tất** vẫn bấm được. Màn Kết quả đọc lại danh sách và vẫn báo nếu lỗi | **Đóng** |

Giả định FE:
- **G5 – đồng ý.** Đọc danh sách hoàn lỗi thì nút dùng `checkout.complete`. Lúc đó chưa biết có tiền chờ hoàn hay không, nên dùng nhãn không có số là an toàn, đúng tinh thần thẻ 02. Không cần khóa mới.
- **G6 – đồng ý.** Dùng `<div className="li-s">` là đúng. Thẻ 01 của UXD ghi `span`, nhưng `.li-s` chỉ đặt cỡ chữ và màu, nên `span` sẽ nối liền vào câu trên. Ý của thiết kế là "dòng thứ hai trong cùng ô", và `div` cho ra đúng như vậy. UXD sửa lại cách hiểu này ở thẻ 01, FE không cần làm gì thêm.

Thêm:
- Thẻ ARC 04, hôm trước ngày đi mà đọc tóm tắt lỗi: trang hiện `ErrorBlock` (`co.error_title` + `common.retry`), không còn hiện câu chỉ dẫn Trả sớm. UXD đồng ý. Đây là trạng thái lỗi chuẩn của DS, và tránh việc chỉ người dùng sang một thao tác về tiền khi chưa biết lượt ở đang ở cửa sổ sau nửa đêm hay không.
- Brand: không thêm `style=` hay màu mới. Chỉ dùng `tr.sub`, `li-s`, `ErrorBlock` của DS. Chữ VI/EN trên 6 ảnh khớp bảng strings. Không emoji.
- Không còn điều kiện gộp từ phía UXD cho PR #64. U4 vẫn ở v1.0.5, chờ ARC chọn hướng A1. Không có ESC.
