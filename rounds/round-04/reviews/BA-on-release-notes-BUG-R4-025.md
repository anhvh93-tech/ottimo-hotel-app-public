# BA review – Release notes, phần sửa BUG-R4-025 (commit `3292b047`)

- Người review: BA | Round 4 – Phản hồi & sửa (QC v1.0.3 mục 11.4, gộp ĐK5) | Ngày: 04/11/2026
- Tác giả: PO. Tệp: `product/docs/release-notes.md`. Hai chỗ: dòng v1.0.2 **Nút Trả sớm – đơn ngắn ngày** (dòng 97) và dòng mới v1.0.3 **Giới hạn đã biết** "Duyệt hoàn: một đơn có thể có hơn một yêu cầu hoàn" (dòng 64).
- Đối chiếu với: `rounds/round-04/qa/v1.0.2-dk10-b18.md` mục 2.2 (OTM-00379), 2.3 (OTM-00380), 5; `rounds/round-04/qc/v1.0.3-gate.md` mục 11.4, 11.5 ghi nhận 1; hợp đồng `checkOut` E15-05; BR-522 (số dư thừa chưa xử lý, chạy lại `refundPlan`); `product/services/api/src/modules/approvals/public/approval.service.ts` (`RefundApprovalCheck`: lúc duyệt, yêu cầu lớn hơn phần dư còn trống thì tự hủy `superseded` và tạo lại đúng số); chữ Desk ở `product/design/copy/strings-vi.json`, `strings-en.json`. Sổ tay 1.10 và bộ hướng dẫn 1.8 BA vừa sửa cùng lượt.
- Phạm vi: chỉ hai chỗ trên. BA không sửa `release-notes.md`.

## Kết luận: **ĐẠT, còn 1 Major cần sửa cùng lượt ĐK5**

| Điểm | Release notes | Thực tế (QA, hợp đồng) | KQ |
|---|---|---|---|
| Trả phòng không tạo lại khoản Trả sớm | Có | B18 chỉ xử lý `unhandledCreditVnd` | Khớp |
| Tiền trả thừa khác → thêm một đề nghị hoàn | Có, ví dụ đêm FOC đã thu | OTM-00380: 400.000 (B16) + 800.000 (B18) = `creditVnd` | Khớp |
| Tổng yêu cầu **bằng** số trả thừa → đều đúng, không từ chối | Có | Bất biến QA: tổng yêu cầu đang chờ = `creditVnd` | Khớp |
| Tổng yêu cầu **lớn hơn** số trả thừa | **Không có** | OTM-00379: yêu cầu 1.042.000, dư 1.017.000 (minibar). Lúc duyệt: 409 `superseded`, tạo lại 1.017.000 | Thiếu – thẻ 01 |
| Chữ Desk ở hộp Trả sớm | Không nhắc | Desk vẫn ghi câu sai cũ | Thiếu – thẻ 02 |

## Thẻ feedback

### FB-R4-BA-PO-RN025-01
- Mức độ: Major
- Vị trí: `product/docs/release-notes.md` dòng 64, v1.0.3 → Giới hạn đã biết, "Duyệt hoàn: một đơn có thể có hơn một yêu cầu hoàn"
- Vấn đề: Dòng này chỉ nói trường hợp tổng yêu cầu **bằng** số trả thừa. Trường hợp tổng **lớn hơn** không có, dù QA đã gặp ở OTM-00379: yêu cầu B16 1.042.000, sau đó minibar 25.000 làm dư còn 1.017.000. Đọc theo câu hiện tại, người duyệt thấy tổng lớn hơn số trả thừa sẽ nghĩ có yêu cầu sai và từ chối.
- Vì sao quan trọng: Từ chối là mất phần tiền đúng của khách (ở OTM-00379 là 1.017.000). Desk đã tự lo phần vượt: lúc duyệt, yêu cầu vượt tự đóng và Desk tạo lại đúng số. Vì vậy cách đúng là **duyệt**, không phải từ chối. QC 11.4 cũng gợi ý thêm nhánh này. Sửa tốn ít công.
- Đề xuất sửa: thêm vào cuối dòng 64 câu sau:
  > Tổng **lớn hơn** số trả thừa (thường vì có phát sinh mới sau khi tạo yêu cầu, ví dụ minibar lúc trả phòng): cũng không từ chối. Bấm **Duyệt**. Desk không cho duyệt quá số trả thừa: yêu cầu vượt thì Desk báo "Yêu cầu không còn cần duyệt nên đã tự đóng." và tự tạo yêu cầu mới đúng số; duyệt yêu cầu mới đó. Có điều bất thường (Desk không tự đóng mà tổng đã duyệt vượt số trả thừa, hoặc không rõ một yêu cầu từ đâu): dừng, chưa chi, báo đội kỹ thuật kèm mã đơn. Cách làm từng bước: sổ tay mục 1.8, hướng dẫn quản lý `01` mục 4.
- Trạng thái: Open

### FB-R4-BA-PO-RN025-02
- Mức độ: Minor
- Vị trí: `product/docs/release-notes.md` v1.0.3 → Giới hạn đã biết (cùng dòng 64); chữ Desk `early_departure.row_refund_help` (`strings-vi.json` và `strings-en.json` dòng 3290, hiện ở `EarlyDepartureDialog.tsx` dòng 926)
- Vấn đề: Ở bước **Xem trước** của hộp **Trả sớm**, dưới dòng **Sẽ xin hoàn cho khách**, Desk vẫn ghi "Một yêu cầu hoàn, cần quản lý duyệt. Trả phòng sau đó không tạo thêm yêu cầu." (EN: "Check-out won't create another."). Đây đúng là câu sai của BUG-R4-025, nhưng nằm trên Desk, ngoài 3 chỗ bug-list nêu. Release notes và sổ tay giờ đã nói khác chữ trên màn.
- Vì sao quan trọng: Lễ tân và quản lý đọc chữ trên màn trước, đọc tài liệu sau. Sổ tay dặn "khác nhau thì làm theo Desk", nên câu sai trên Desk có thể lấn át phần đính chính.
- Đề xuất sửa: (1) Thêm một ý vào dòng 64: "Ở bước **Xem trước** của hộp **Trả sớm**, Desk vẫn ghi 'Trả phòng sau đó không tạo thêm yêu cầu.' Câu này thiếu ngoại lệ trên, sẽ sửa chữ ở bản sau." (2) PO đưa vào backlog 5.6 cho UXD/FE (đích v1.0.4): đổi chữ VI/EN, ví dụ VI "Một yêu cầu hoàn cho phần trả sớm, cần quản lý duyệt. Trả phòng không tạo lại khoản này.", EN "One refund request for the early departure, needs manager approval. Check-out won't create it again." (3) QA ghi thêm vị trí này vào BUG-R4-025, hoặc mở lỗi P3 riêng cho phần chữ Desk, để đóng lỗi tài liệu không phải chờ v1.0.4. BA đã ghi lỗi chữ này vào sổ tay 5.6 và hướng dẫn `02` 11.5.2.
- Trạng thái: Open

### FB-R4-BA-PO-RN025-03
- Mức độ: Suggestion
- Vị trí: dòng 97 ("bước **Bill** hỏi cách xử lý") và dòng 64 ("số khách đã trả thừa trên folio (**Đã thu** trừ **Tổng cộng**)")
- Vấn đề: (a) Trên Desk, bước này tên **Bill & thu tiền** (nút **Tiếp tục: Bill & thu tiền**), không phải **Bill**. (b) Khung đơn chỉ hiện **Đã thu** và **Còn phải thu**, không có dòng **Tổng cộng**. Hai số này đứng cạnh nhau trên **Phiếu thanh toán** (và ở bước Bill & thu tiền).
- Vì sao quan trọng: Chữ đậm phải đúng chữ trên màn để người đọc tìm được. Người duyệt mở khung đơn sẽ không thấy "Tổng cộng".
- Đề xuất sửa: (a) "bước **Bill & thu tiền** hỏi cách xử lý phần đó"; (b) "đối chiếu với số khách đã trả thừa (**Đã thu** trừ **Tổng cộng** trên **Phiếu thanh toán** của đơn)". Sổ tay 1.10 và bộ hướng dẫn 1.8 đã dùng chữ này.
- Trạng thái: Open

### FB-R4-BA-PO-RN025-04
- Mức độ: Suggestion
- Vị trí: dòng 64
- Vấn đề: Dòng này đủ để hiểu, nhưng không dẫn tới chỗ có cách làm từng bước.
- Vì sao quan trọng: Người duyệt hoàn (hiện là chủ đầu tư) đọc release notes một lần, còn khi duyệt thì mở sổ tay.
- Đề xuất sửa: thêm "Cách làm: sổ tay mục 1.8 **Đơn có hơn một yêu cầu hoàn**, hướng dẫn quản lý `01` mục 4." Nếu PO nhận câu đề xuất ở thẻ 01 thì câu đó đã có ý này.
- Trạng thái: Open

## Điểm làm tốt
- Câu đính chính ở dòng v1.0.2 viết đúng cơ chế (không tạo lại, chỉ hỏi phần trả thừa khác, không trùng) và giữ dấu vết "Đính chính 04/11" cùng câu cũ. Người đã đọc bản trước biết chỗ nào đổi.
- Lý do của dòng 64 ("từ chối nhầm thì khách mất tiền") nói thẳng hậu quả, đúng thứ người duyệt cần nhớ.
- Ví dụ đêm FOC đã thu khớp đúng ca OTM-00380 QA gặp, dễ hình dung.

## Phản hồi PO

- Người phản hồi: PO | Round 4 – Phản hồi & sửa (QC v1.0.3 mục 11.4, gộp ĐK5) | Ngày: 04/11/2026
- Tệp đã sửa: `product/docs/release-notes.md` (v1.0.3 → Giới hạn đã biết, dòng "Duyệt hoàn: một đơn có thể có hơn một yêu cầu hoàn"; v1.0.2 → dòng **Nút Trả sớm – đơn ngắn ngày**), `03-backlog/backlog.md` mục 5.6 (bảng 04/11, thêm 1 dòng) và nhật ký thay đổi. Chưa commit; ORC commit cùng bước.
- Căn cứ: phân xử của ORC trong decision-log 04/11 (`2b7d60b8`): tổng yêu cầu chờ **lớn hơn** số trả thừa thì vẫn bấm **Duyệt**, Desk tự đóng yêu cầu vượt và tạo lại đúng số; chỉ dừng, báo kỹ thuật khi bất thường. Đã đối chiếu chữ `approval.auto_cancel.other`, `checkout.step.bill`, `co.go_bill`, `bill.title`, `early_departure.row_refund_help` trong `product/design/copy/strings-vi.json` / `strings-en.json`, sổ tay 1.10 mục 1.8 (bước 1–6) và hướng dẫn `01` mục 4.

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R4-BA-PO-RN025-01 | **Accepted – Done** | Thêm nhánh tổng **lớn hơn** số trả thừa gần nguyên câu BA đề xuất: không từ chối, bấm **Duyệt**; Desk báo "Yêu cầu không còn cần duyệt nên đã tự đóng." và tạo yêu cầu mới đúng số. Nhánh bất thường đổi "chưa chi" thành "chưa duyệt, chưa chi" cho khớp sổ tay 1.8 bước 5 |
| FB-R4-BA-PO-RN025-02 | **Accepted – Done** (1), (2); (3) chuyển QA | (1) Dòng giới hạn thêm: bước **Xem trước** của hộp **Trả sớm** vẫn ghi câu cũ, chữ Desk sửa ở v1.0.4, tới lúc đó làm theo release notes. (2) Backlog 5.6 thêm dòng **BUG-R4-025 – phần chữ Desk** (UXD → FE-A, v1.0.4 mục (5)). (3) Việc ghi vị trí vào BUG-R4-025 là của QA: đề nghị ORC chuyển; PO không mở lỗi riêng, dòng backlog đã đủ để đóng phần tài liệu không chờ v1.0.4 |
| FB-R4-BA-PO-RN025-03 | **Accepted – Done** | (a) v1.0.2: "bước **Bill & thu tiền** hỏi cách xử lý phần đó". (b) v1.0.3: "(**Đã thu** trừ **Tổng cộng** trên **Phiếu thanh toán** của đơn)" |
| FB-R4-BA-PO-RN025-04 | **Accepted – Done** | Cuối dòng: "Cách làm từng bước: sổ tay mục 1.8 **Đơn có hơn một yêu cầu hoàn**, hướng dẫn quản lý `01` mục 4." |

Ghi chú cho BA (không phải thẻ): `product/docs/manual/guides/01-chu-dau-tu-quan-ly.md` dòng 423 vẫn ghi "bước **Bill** hỏi lễ tân cách xử lý", cùng lỗi chữ thẻ 03 (a). Đề nghị sửa thành **Bill & thu tiền** ở lượt dựng lại bộ hướng dẫn kế tiếp.
