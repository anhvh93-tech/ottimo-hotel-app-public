# BA – Phản hồi review Sổ tay sử dụng OTTIMO Desk v1.0

- Round 3 · Bước: Phản hồi & sửa · 27/10/2026 · Tác giả: BA
- Review: `rounds/round-03/reviews/DOM-on-BA-user-manual.md` (23 thẻ: 2 Blocker, 9 Major, 11 Minor, 1 Suggestion) và `rounds/round-03/reviews/PO-on-BA-user-manual.md` (14 thẻ: 4 Major, 8 Minor, 2 Suggestion)
- Đã sửa: `product/docs/manual/user-manual-v1.0.md` (bản nội dung 1.1), `02-escalations/ESC-038.md`, dòng ESC-038 ở `02-escalations/escalations-index.md`
- Bộ dựng: `python3 -I product/design/tools/build_manual.py` chạy được (6 chương, 73 mục). Mã ảnh giữ nguyên: 88 mã, không thêm, không đổi. Các chú thích `<!-- QA: … -->` chưa có câu trả lời vẫn giữ; thêm chú thích cho các câu QA mới DOM nêu (Q14–Q19).
- Quyết định đã dùng: trả phòng sớm có nút từ **v1.0.1 (04/11)** (ORC, decision-log 27/10); tập trên staging bằng tài khoản tập, Desk thật trước 02/11 chỉ đăng nhập/đổi mật khẩu/đăng xuất (PO, decision-log 27/10); ESC-039 đang chờ INV nên viết theo cách tạm DOM đề xuất.

## Tổng hợp

| Mức | DOM | PO | Đã sửa | Không sửa |
|---|---|---|---|---|
| Blocker | 2 | 0 | 2 | 0 |
| Major | 9 | 4 | 13 | 0 |
| Minor | 11 | 8 | 19 | 0 |
| Suggestion | 1 | 2 | 3 | 0 |
| **Cộng** | **23** | **14** | **37** | **0** |

Một thẻ sửa khác đề xuất của người review: FB-R3-PO-BA-02 (lý do ở dòng thẻ).

## Thẻ của DOM

| ID | Mức | Trạng thái mới | Ghi chú |
|---|---|---|---|
| FB-R3-DOM-BA-01 | Blocker | Đã sửa | 2.10 khung "Mã cửa": không gửi qua Zalo, Messenger, WhatsApp, hộp thư OTA kể cả gõ tay; chỉ đọc tại quầy hoặc gọi đúng số khách đứng tên; không đọc cho người gọi chưa xác minh. 2.21: thay dòng bằng câu từ chối mẫu EN/VI. Thêm vào khối "Luôn nhớ" chương 2, 3.12 (buồng phòng), 5.4 (câu hỏi), 5.5 (sự cố). SEC xem câu mẫu: việc của SEC theo DOM |
| FB-R3-DOM-BA-02 | Blocker | Đã sửa | Thêm **2.14a "Khách trả phòng sớm"** theo đúng chữ DOM thẻ 02b (6 bước, ví dụ 767.000 đ), ghi "Từ bản v1.0.1 (dự kiến 04/11) có nút trên Desk". Thêm (c) ghi chú cho kế toán. Thêm dòng ở 1.11, 2.21, 5.2, 5.6. Phần (a) đã được ORC quyết (v1.0.1). Chú thích QA cho bước 6 (Q14 của DOM: trả phòng đúng ngày đi với ghi chú giờ rời thật) |
| FB-R3-DOM-BA-03 | Major | Đã sửa (tạm, chờ ESC-039) | 2.13 thêm khung cách tạm: 07:00–22:00 hỏi chủ đầu tư/quản lý; 22:00–07:00 tiền mặt/thẻ, chỉ chuyển khoản được thì ghi tay "Chờ đối soát", quản lý đối soát trước 09:00. 2.4 bước 1 trỏ về 2.13. 5.4 sửa câu trả lời. 4.3, 5.1 thêm mốc 09:00. Chú thích ẩn ghi cách sửa khi INV chọn A |
| FB-R3-DOM-BA-04 | Major | Đã sửa | 1.14 thay khung theo chữ DOM: quỹ lẻ cố định (để trống cho chủ đầu tư ghi số, nhãn [GIẢ ĐỊNH – chờ INV đặt số] trong chú thích), ghi sổ giao ca khi người khác lấy/bỏ tiền, công thức tiền phải có, ca đêm qua 00:00. 1.16 thêm việc chủ đầu tư đặt quỹ lẻ. QA Q15 (lọc theo giờ) để chú thích |
| FB-R3-DOM-BA-05 | Major | Đã sửa | 1.3 và 5.2 liệt kê đủ ngày đặc biệt đang cài (gồm Giỗ Tổ đêm 16/4/2027, đêm 1/9, Tết 05–10/02/2027). 2.8 bước 2 thay bằng chính sách đủ: cách đếm ngày, không hoàn cọc khi có đêm ngày đặc biệt, ví dụ 22/11, bất khả kháng dời 3 tháng. 5.2 dòng hủy bổ sung |
| FB-R3-DOM-BA-06 | Major | Đã sửa | 2.5 bước 8: "Luôn nhập giá trước giảm dài ngày" kèm ví dụ căn 202 (thiếu 519.000 đ). 2.12 Gia hạn bước 2 thêm câu nhập giá trước giảm |
| FB-R3-DOM-BA-07 | Major | Đã sửa | 2.6 bước 3: OTA đã thu thì không thu lại tiền phòng/cọc; trả tại OTTIMO; thẻ ảo chỉ OWN/MGR. Thêm khối "Khách OTA báo thêm người" (dùng đúng nhãn **Khách đã sửa đơn trên …** / **Khách báo trực tiếp với OTTIMO** của Desk). 2.8 bước 5: OTA sửa ngày → hủy lý do **OTA báo hủy** + tạo đơn mới (QA Q18). 2.10: điều kiện kênh đã đăng nội quy + khung "Tạm ở v1.0" (gộp với PO-02). 2.21 thay dòng giảm giá OTA |
| FB-R3-DOM-BA-08 | Major | Đã sửa | 2.7 khung thêm lịch thu, giới hạn hành vi khi khách trễ (không đổi mã, không khóa, không cắt điện nước), công thức điện theo đơn giá HĐ giấy (5.000 đ/kWh chưa in vào HĐ mới), công thức nước kèm ví dụ 142.000 đ, chốt công tơ (trỏ 4.1). 2.15 thay câu khách dài hạn theo BR-413 (QA Q4). 5.2 sửa dòng khách dài hạn |
| FB-R3-DOM-BA-09 | Major | Đã sửa | 2.16: sổ giao ca ghi **mọi phiếu thanh toán** trong ca, ngày hóa đơn là ngày trả phòng, OTA trả trước không hứa số tiền. 4.3 sửa tương ứng. Câu pháp lý hóa đơn khách lẻ đưa vào ESC-038 (câu phụ) và chú thích ẩn "PHÁP LÝ – cần kế toán xác nhận" |
| FB-R3-DOM-BA-10 | Major | Đã sửa | 0.9: thêm danh sách khách đến/đi ngày mai chép tay lúc 22:00 (không số giấy tờ, không mã cửa, cất ngăn khóa, hủy bản cũ); sổ giấy 3 ngày đầu giữ. 5.1, 5.5, 5.6 sửa tương ứng. SEC xem lại danh sách giấy: ghi chú ẩn, chờ SEC |
| FB-R3-DOM-BA-11 | Major | Đã sửa | Thêm **2.5a "Một khách đặt nhiều căn"** theo chữ DOM (mỗi căn một đơn, xác nhận cọc từng đơn khi chuyển gộp, giới hạn CTV 3/sale 5, hủy một căn). Thêm dòng 5.6. QA Q16 (2 lần xác nhận cùng mã giao dịch) để chú thích |
| FB-R3-DOM-BA-12 | Minor | Đã sửa | 0.6 thêm câu mốc 06:00 không áp cho hạn khai báo. 2.11 dòng công dân Việt Nam tách 23:00–23:59 và 00:00–05:59. 2.20, 5.1 sửa tương ứng |
| FB-R3-DOM-BA-13 | Minor | Đã sửa | 2.12 Đổi phòng bước 4: đếm minibar căn cũ, ghi số thẻ trả, xóa mã căn cũ, bộ đồ dùng thêm, bù sự cố. QA Q17 để chú thích |
| FB-R3-DOM-BA-14 | Minor | Đã sửa | 2.8 Không đến: kiểm extranet trước (OTA), "giữ toàn bộ cọc", thêm bước 5 không bán căn đã trả đủ trong đêm tới 06:00 |
| FB-R3-DOM-BA-15 | Minor | Đã sửa | 5.5 dòng mất điện thay theo chữ DOM (BR-964). 0.9 thêm dòng trỏ về 5.5 |
| FB-R3-DOM-BA-16 | Minor | Đã sửa | 0.8 ý 5 viết lại thành 3 gạch: ảnh khách đồng ý (30 ngày, 3 tháng ở bản vá – gộp PO-10), ảnh hồ sơ khai báo chưa xong 7 ngày, dữ liệu điền sẵn 3 tháng |
| FB-R3-DOM-BA-17 | Minor | Đã sửa | 1.13: công suất ghi lúc 22:00 hoặc đếm cột đêm qua trên Sơ đồ phòng; không lấy ô Công suất đêm nay buổi sáng. 5.1 dòng 22:00 thêm |
| FB-R3-DOM-BA-18 | Minor | Đã sửa | 1.7: kiểm số tài khoản bằng đơn thật đầu tiên, không tạo đơn thử trên Desk thật |
| FB-R3-DOM-BA-19 | Minor | Đã sửa | 2.14: nhắn 08:00–21:00, không mời trả muộn khi căn có khách đến. 5.1 dòng "Trước 21:00". 2.12 Gia hạn bước 5 thu tiền ngay, muộn nhất 14:00 (chú thích QA Q11 và ghi mốc 14:00 là giả định BR-423 chờ INV) |
| FB-R3-DOM-BA-20 | Minor | Đã sửa | 2.14 bước 2: chưa có số thì nhập theo lời khách, ghi "chưa đếm", không bấm "Không dùng gì – tủ đủ". 3.7 thêm bước 4. 1.11: lễ tân trở lên ghi trong 24 giờ kèm ảnh, quá 24 giờ thành công nợ (QA Q19 để chú thích) |
| FB-R3-DOM-BA-21 | Minor | Đã sửa | "Cách đọc sổ tay": tách hai trường hợp (đổi tham số → theo Desk; không rõ, nhất là tiền → vẫn theo Desk nhưng báo lễ tân trưởng trong ca, có thể là P0) |
| FB-R3-DOM-BA-22 | Suggestion | Đã sửa | 2.6 khung "Tạm ở v1.0": kiểm extranet đầu ca, 12:00, 18:00, cuối ca; bật thông báo đơn mới về điện thoại cơ sở; chỉ người chủ đầu tư giao được đóng/mở. 1.16 thêm việc chủ đầu tư ghi rõ người đóng/mở. Không đưa "cân nhắc tạm đóng kênh ít đơn" vào sổ tay vì là quyết định kinh doanh của INV, không phải thao tác nhân viên |
| FB-R3-DOM-BA-23 | Minor | Đã sửa | ESC-038: đề xuất đổi thành "A cho tuần đầu, C ở v1.1"; C ghi rõ phạm vi (xem Nhật ký tiền, phiếu thanh toán, công nợ, được bấm Đã khớp sao kê; không giấy tờ, không duyệt, không sửa giá); thêm bối cảnh việc hằng ngày và câu phụ hóa đơn khách lẻ. Index cập nhật. Sổ tay 4.3, 5.6 viết theo đề xuất mới |

## Thẻ của PO

| ID | Mức | Trạng thái mới | Ghi chú |
|---|---|---|---|
| FB-R3-PO-BA-01 | Major | Đã sửa | 4.2: hoa hồng theo đợt chi v1.3, bảng khách tiềm năng "chưa xếp lịch", mẫu tin v1.2. 5.6 thêm hai dòng. Áp nguyên tắc chung: chỉ ghi số bản khi có trong kế hoạch phát hành; đếm minibar trên app, đơn nhóm, thông báo tiền về ghi "chưa xếp lịch"/"đang chờ chủ đầu tư quyết" |
| FB-R3-PO-BA-02 | Major | Đã sửa (khác đề xuất) | Thêm khung "Tạm ở v1.0" ở 2.10 và câu ở 1.16 (chủ đầu tư báo danh sách kênh đã đăng). **Không** dùng cách "tắt Khách nhận sớm": làm vậy ghi sai giờ nhận thật (BR-414 không có "bỏ qua phụ thu", giờ ghi phải đúng thực tế). Thay bằng cách DOM thẻ 07 (3): ghi giờ thật, chọn **Xin miễn phụ thu (gửi duyệt)** lý do "Kênh OTA chưa đăng phụ thu", báo quản lý. Cùng hiệu quả với khách, giữ dữ liệu đúng |
| FB-R3-PO-BA-03 | Major | Đã sửa | Thêm **5.8 "Đào tạo theo bộ phận"**: tập trên "Desk tập" bằng tài khoản tập, Desk thật trước 02/11 chỉ đăng nhập/đổi mật khẩu/đăng xuất; bảng 6 bộ phận (mục cần đọc, bài tập, thời lượng); bảng ký "đã học" giữ ở OTTIMO. Thêm khung ở 0.2. Bỏ dòng "staging" khỏi 2.13. Địa chỉ staging để trong chú thích ẩn (ORC/UXD quyết có in hay không, vì repo công khai và tên gọi "staging" khó hiểu với nhân viên) |
| FB-R3-PO-BA-04 | Major | Đã sửa | Thêm **5.0 "Từ ngữ trên Desk"** (27 từ, trạng thái buồng trỏ về 3.2). "Cách đọc sổ tay" trỏ về 5.0. Ghi nghĩa ngắn trong ngoặc ở lần đầu của các từ chính: folio (1.9, 1.11, 2.12), bút toán (1.11), FOC (1.13), sàn–trần (2.5), extranet (2.6), chờ đối soát (2.13) |
| FB-R3-PO-BA-05 | Minor | Đã sửa | Bỏ mọi mã ESC, FB-INV, đường dẫn repo khỏi phần nhân viên đọc; thay bằng câu thường ("theo quyết định của chủ đầu tư ngày 26/10", "hướng dẫn chuyển đổi ngày đầu – chủ đầu tư giữ"). Mã và đường dẫn chuyển vào chú thích ẩn và 5.7 Lịch sử |
| FB-R3-PO-BA-06 | Minor | Đã sửa | 1.3 thêm khung "Tạm ở v1.0" (chưa có danh sách giá đã lên lịch và nút hủy, dự kiến v1.0.1; ghi sổ; bỏ giá đã lên lịch bằng cách nhập lại giá hiện hành đúng ngày). Thêm dòng 5.6 |
| FB-R3-PO-BA-07 | Minor | Đã sửa | 3.3 dòng "Trống từ đêm qua": buồng phòng rà, bấm Dọn xong; lễ tân trưởng kiểm xong trước 12:00. 5.1 dòng 12:00 sửa tương ứng |
| FB-R3-PO-BA-08 | Minor | Đã sửa (chờ QA Q14) | 3.6: lễ tân trưởng kiểm trên app; chủ đầu tư/quản lý chưa vào app; ngày lễ tân trưởng nghỉ nhận khách vào VC như thường, chủ đầu tư có thể gán thêm vai Lễ tân trưởng. 5.3 ô OWN/MGR đổi "– (v1.0)". Chú thích QA Q14: nếu Desk có thao tác kiểm phòng cho OWN/MGR thì đổi lại |
| FB-R3-PO-BA-09 | Minor | Đã sửa | Thêm "Lỗi nhỏ đã biết": Cần chú ý chưa ghi mã đơn ở dòng giữ chỗ (2.2), mã lý do thô trong Nhật ký tiền (1.12), câu "phí phạt" hiện với giặt ủi (2.12) |
| FB-R3-PO-BA-10 | Minor | Đã sửa | 0.8 ý 5: 30 ngày ở v1.0; 3 tháng áp ở bản vá sau khi đội bảo mật duyệt; luôn đọc số ngày trên câu hỏi đồng ý của Desk khi nói với khách |
| FB-R3-PO-BA-11 | Minor | Đã sửa | 4.1 thêm khung "Chốt công tơ khách dài hạn": người chốt và ngày cụ thể để trống cho chủ đầu tư điền; cuối tháng ± 2 ngày; chỉ chụp công tơ; kỳ 10/2026 chốt 31/10 trong sổ cũ. 2.7 trỏ về 4.1 |
| FB-R3-PO-BA-12 | Minor | Đã sửa | Thêm **2.22 "Việc riêng của lễ tân trưởng"** (7 dòng, trỏ về mục chi tiết) |
| FB-R3-PO-BA-13 | Suggestion | Đã sửa | Thêm khối "Luôn nhớ" 5 dòng ở đầu chương 2, 3, 4.1, 4.2, câu khớp `staff-one-pager.md` (bản PO 27/10) và thêm câu mã cửa (DOM-01). One-pager chưa có câu "không gửi mã cửa qua Zalo" – PO/DOM thêm khi sửa one-pager (DOM đã ghi việc này) |
| FB-R3-PO-BA-14 | Suggestion | Đã sửa | Dòng đầu sổ tay ghi "OTTIMO Desk v1.0"; `rc.3`/commit để ở 5.7 Lịch sử và chú thích ẩn. BA cập nhật 5.7 khi PO ghi tag cuối |

## Còn chờ

| Việc | Ai | Ảnh hưởng tới sổ tay |
|---|---|---|
| QA kiểm Q1–Q14 (BA, PO) và Q14–Q19 (DOM) trên staging – kết quả `rounds/round-03/qa/manual-check.md` | QA | BA sửa lượt hai các chỗ có chú thích `<!-- QA: … -->`: 1.4, 1.9, 1.11, 1.14, 1.15, 2.5a, 2.7, 2.8, 2.12 (gia hạn, đổi phòng), 2.14, 2.14a, 2.15, 3.6, 3.7, 5.3 |
| ESC-039 – lễ tân thấy tiền chuyển khoản (hạn 31/10) | INV | Sửa khung 2.13, câu 5.4, dòng 5.6 |
| ESC-038 – quyền của kế toán + câu phụ hóa đơn khách lẻ | INV (hỏi kế toán) | Sửa 4.3, 2.16, 5.6 |
| ESC-035 – mức phụ thu nhận sớm | INV | 2.10, 5.2 nếu đổi |
| Số quỹ lẻ trong két, người và ngày chốt công tơ | INV (điền khi đào tạo) | Ô trống ở 1.14, 4.1 |
| Mốc thu tiền gia hạn 14:00 (BR-423 giả định) | INV qua DOM | 2.12 Gia hạn bước 5 |
| SEC xem danh sách khách đến/đi viết tay (DOM-10) và câu từ chối gửi mã cửa (DOM-01) | SEC | 0.9, 2.21 nếu SEC đổi |
| Nút "Trả phòng sớm" ở v1.0.1 | FE/BE/ARC | Khi phát hành v1.0.1: thay 2.14a bằng thao tác nút |
| `staff-one-pager.md` thêm câu mã cửa | PO/DOM | Không (sổ tay đã có) |
