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

---

# Lượt 3 – SEC, QA và biện pháp bù B2 (27/10, tối)

- Căn cứ:
  - `rounds/round-03/reviews/SEC-on-BA-user-manual.md` (18 thẻ: 1 Blocker, 11 Major, 5 Minor, 1 Suggestion)
  - `rounds/round-03/qa/manual-check.md` (Q1–Q14, D14–D19, M1–M64; ảnh 86 tệp), `rounds/round-03/qa/bug-list.md` (BUG-R3-019…032)
  - `rounds/round-03/reviews/SEC-on-B2-readiness.md` mục 1.3 (biện pháp bù B1–B6)
  - decision-log ORC 27/10 (dữ liệu khách không vào repo qua `/feedback`; BUG-R3-019 sửa trong v1.0.0)
- Đã sửa:
  - `product/docs/manual/user-manual-v1.0.md` – lên bản nội dung **1.2**.
  - `product/docs/manual/screenshot-list.md` – thêm C0-11.
  - `product/docs/manual/img/C0-08b.png` → `C0-11.png` (`git mv`): bộ dựng chỉ nhận mã dạng `Cx-yy`, mã có chữ "b" không khớp.
  - `product/docs/staff-one-pager.md` – thêm dòng QR "vừa đổi tài khoản nhận", mã cửa không qua tin nhắn, không mở cửa cho người tự nhận là khách, báo lỗi không kèm dữ liệu khách, In phiếu đang lỗi.
- Bộ dựng: `python3 -I product/design/tools/build_manual.py` chạy được (6 chương, 73 mục). Có ảnh cho 86/89 mã; còn thiếu đúng 3 ảnh QA chưa chụp (C1-15, C2-13, C2-34).
- Chú thích `<!-- QA … -->` đã có câu trả lời thì đã gỡ hoặc đổi thành ghi chú nguồn. Còn mở 4 chỗ:
  - M24: khách đến hôm nay chưa trả cọc thì tạo đơn thế nào.
  - Q4: hai chỗ (2.7, 2.15), chờ bản sửa BUG-R3-019.
  - D14: diễn tập ngày 29/10 trên OTM-00359.

## Thẻ của SEC

| ID | Mức | Trạng thái mới | Ghi chú |
|---|---|---|---|
| FB-R3-SEC-BA-01 | Blocker | Đã sửa | (a) 0.8 điểm 9: báo lỗi mô tả bằng lời (mã đơn, căn, giờ, đã bấm gì, mã tham chiếu), không ghi tên/SĐT/email/số giấy tờ khách, không chụp màn hình có dữ liệu khách, `/feedback` coi như công khai. (b) 5.5 dòng P0 thêm "chỉ ghi mã đơn"; đoạn cuối 5.5 trỏ về 0.8 điểm 9. 4.3 sổ giấy: `/feedback` chỉ kèm mã đơn. (c) 1.15: bỏ đường `/feedback`, chủ đầu tư nhắn Điều phối viên chỉ mã đơn + "tra nhật ký giấy tờ", kết quả gửi riêng. (d) ORC đã ghi decision-log 27/10. One-pager sửa dòng báo lỗi cùng ý |
| FB-R3-SEC-BA-02 | Major | Đã sửa | 2.10 khung "Giao mã cửa": điều kiện (đã nhận phòng trên Desk, có giấy tờ, đã thu đủ); tại quầy đọc nhỏ; gọi điện = lễ tân tự gọi ra số có trên đơn từ trước hôm nay, xác nhận họ tên + ngày đến, không để lời nhắn thoại; không đọc khi khách gọi đến; không gọi số mới đổi trong ngày; nghi ngờ thì báo quản lý. 2.21 thêm dòng "có người gọi đến xin mã". 5.4, 5.5 trỏ về 2.10. Luôn nhớ chương 2 sửa theo |
| FB-R3-SEC-BA-03 | Major | Đã sửa | 2.21 thay câu từ chối EN/VI bằng câu của SEC (không gửi qua tin nhắn · OTTIMO gọi vào số trong đơn · hoặc nhận tại quầy). UXD rà chữ khi dựng HTML |
| FB-R3-SEC-BA-04 | Major | Đã sửa | 2.10: "không gửi bằng chữ hay ảnh qua bất kỳ kênh nào (Zalo, Messenger, WhatsApp, SMS, email, hộp thư OTA…)". 0.8 thêm điểm 10 (mã cửa chỉ nằm trên app khóa, không ghi vào sổ, ghi chú, nhóm chat). 3.12, khối "Luôn nhớ" chương 3 và 4.1: không mở cửa căn cho người tự nhận là khách |
| FB-R3-SEC-BA-05 | Major | Đã sửa (giả định chờ INV) | 2.10 khung mã cửa thêm: app khóa chỉ trên điện thoại/máy tính bảng của cơ sở, tài khoản quản trị do chủ đầu tư giữ; mã ngẫu nhiên mới mỗi lượt, không ngày sinh/SĐT/số căn/mã cũ, đặt hạn trên khóa; xóa mã ngay khi trả, đổi, rời sớm, hủy, không đến. 0.4 thêm dòng mất máy có app khóa. 5.5 thêm dòng tương ứng. Ghi `[GIẢ ĐỊNH – chờ INV xác nhận]` app khóa đang trên máy của cơ sở (chú thích ẩn ở 2.10) |
| FB-R3-SEC-BA-06 | Major | Đã sửa | 0.9 thay khung theo chữ SEC: mã đơn; khách đi không cần SĐT; không ghi giấy tờ/mã cửa/email/số TK; ngăn khóa, chìa do người trực giữ; một bản, cắt nhỏ khi hủy, bỏ thùng rác khu nhân viên; mất mạng phải xem giấy tờ gốc, không chụp giấy tờ bằng điện thoại; sổ giấy không ghi giấy tờ/thẻ/mã cửa, hết dùng nộp két. Desk trên điện thoại cơ sở chỉ để xem đơn và thu tiền. 4.3 trỏ về 0.9. Phần SEC của DOM thẻ 10 đóng |
| FB-R3-SEC-BA-07 | Major | Đã sửa | 0.3 bước 5: làm trên máy riêng, không in/tải mã khôi phục trên máy quầy, xóa tệp và dọn thùng rác. 0.2 "Luôn nhớ": trình duyệt hỏi lưu mật khẩu → Không bao giờ. 0.4 dòng quản lý mất điện thoại: báo chủ đầu tư **Đặt lại mật khẩu** (đăng xuất mọi máy). 5.5 dòng "Nghi lộ mật khẩu": Đặt lại mật khẩu hoặc Khóa tài khoản – bỏ câu "Đăng xuất mọi máy" vì Desk không có nút này |
| FB-R3-SEC-BA-08 | Major | Đã sửa | 5.8 thêm: mật khẩu Desk tập khác Desk thật; tài khoản tập khóa sau đào tạo; chỉ mở Desk tập bằng địa chỉ chủ đầu tư đưa. 0.2 "Luôn nhớ": chỉ đăng nhập bằng gõ địa chỉ/dấu trang. 0.4 câu cuối: không ai (chủ đầu tư, quản lý, đội kỹ thuật, ngân hàng, OTA) hỏi mật khẩu/mã. Ý OPS/QA (tài khoản tập theo người, ngày khóa): ngoài sổ tay, chuyển ORC |
| FB-R3-SEC-BA-09 | Major | Đã sửa (giả định chờ INV) | 2.4 thêm "Nhắn khách từ đâu" (tài khoản OTTIMO trên điện thoại cơ sở hoặc hộp thư OTA; máy quầy không cài/mở Zalo) và câu chống giả danh EN/VI cho tin có số tiền/QR; không gửi ảnh QR cũ, không gõ số TK. 0.5 thêm: máy quầy đã cấp quyền không cài ứng dụng chat. 2.9, 4.2 trỏ về 2.4. Bill qua Zalo (2.14, 5.4) đã bỏ vì In phiếu đang lỗi. `[GIẢ ĐỊNH – chờ INV xác nhận]` có Zalo của cơ sở trên điện thoại cơ sở (chú thích ẩn ở 2.4) |
| FB-R3-SEC-BA-10 | Major | Đã sửa | 2.13: xác nhận qua số đã lưu trong danh bạ điện thoại cơ sở, kèm mã đơn + số tiền, chỉ bấm khi trả lời đúng; tin từ số/tài khoản lạ thì không tin. Thêm "SMS báo tiền khách đưa xem không thay xác nhận" (2.13, 5.4, Luôn nhớ chương 2). Điều kiện SEC cho A đã có trong ESC-039 (ORC `64310e1`); chú thích ẩn ở 2.13 nhắc giữ ý (2), (3) khi INV quyết A |
| FB-R3-SEC-BA-11 | Major | Không thuộc sổ tay – đã được xử lý | Ảnh `C2-14` do QA sửa (tô QR, thu hồi link OTM-00359, thêm `svg.qr` vào bộ che, rà lại cả bộ ảnh – `manual-check.md` mục 3, 3.1). BA thêm vào 2.9: "không chụp màn hình hộp link (mã QR là link)" |
| FB-R3-SEC-BA-12 | Major | Đã sửa | 1.7 thêm "Nhận thông báo đổi tài khoản nhận mà anh/chị không làm": chủ đầu tư gõ địa chỉ, Hủy lịch, đổi mật khẩu, tạo mã khôi phục mới, báo đội; quản lý gọi chủ đầu tư, lễ tân ngừng gửi VietQR. Thêm khung "Lỗi đang sửa" về thư chưa gửi (BUG-R3-032) và việc kiểm mỗi sáng (mục 1.1) |
| FB-R3-SEC-BA-13 | Major | Đã sửa | 2.13 bảng dòng Thẻ: khách quẹt/chạm trước mặt mình. Dưới bảng: không nhận số thẻ qua điện thoại/Zalo/email/giấy, không chụp, không ghi; thẻ ảo OTA chỉ OWN/MGR gõ thẳng vào POS. 2.6 dòng thẻ ảo sửa cùng ý. 0.8 thêm điểm 11. 2.21 thêm dòng "khách đọc số thẻ qua điện thoại" |
| FB-R3-SEC-BA-14 | Minor | Đã sửa | 0.8 điểm 4 (xóa khi đơn hủy/không đến trước khi khai), điểm 5 ("7 ngày sau trả phòng"), điểm 7 (trẻ em: số định danh + năm sinh, không chụp giấy tờ trẻ; dữ liệu trẻ em là dưới 16 tuổi, khác mốc 12 của phụ thu) |
| FB-R3-SEC-BA-15 | Minor | Đã sửa | 0.8 điểm 3: chỉ xem khi làm thủ tục/khai báo cho đúng đơn đó, xem vì tò mò là vi phạm, có nhật ký người/giờ/đơn. 2.11 bước 4: không mở cổng hay dán dữ liệu khi khách khác đang nhìn. Không viết "chủ đầu tư tra được trên Desk" vì v1.0 chưa có màn S28 (QA Q3) |
| FB-R3-SEC-BA-16 | Minor | Đã sửa | 4.2 gạch Sale nội bộ: gửi mã VietQR do Desk tạo; kiểm tiền theo 2.13 (kèm mã đơn, số tiền); ảnh của khách không thay xác nhận; QR "vừa đổi" thì gọi chủ đầu tư |
| FB-R3-SEC-BA-17 | Minor | Đã sửa | 1.7 thêm khung "Lỗi nhỏ đã biết (v1.0.1)" dưới ảnh C1-11: câu gợi ý trên màn bảo tạo mã VietQR nhỏ – làm theo sổ tay, không tạo mã thử, không chuyển tiền. Câu đề xuất cho UXD giữ ở review SEC |
| FB-R3-SEC-BA-18 | Suggestion | Đã sửa | Đầu sổ tay thêm dòng in đậm "Tài liệu nội bộ OTTIMO – không chụp, không đăng lên mạng. Nghỉ việc thì trả lại." Chân trang bản in: việc của UXD trong bộ dựng |

Tổng SEC: Blocker 1/1, Major 11/11 (10 sửa trong sổ tay, 1 đã do QA xử lý), Minor 5/5, Suggestion 1/1.

## Câu trả lời của QA (Q1–Q14, D14–D19)

| # | Đã áp vào | Ghi chú |
|---|---|---|
| Q1 | 1.4 | Công tắc form ở nhóm **Khác**, khóa thô `public_booking_requests_enabled`. Wi-Fi: khung "Lỗi đang sửa" (BUG-R3-021) ở 1.4; 2.9, 2.21, 5.4, bảng lỗi 5.6 trỏ về. Không viết "đội kỹ thuật nhập Wi-Fi" vì SEC không duyệt sửa dữ liệu production ngoài app |
| Q2 | 1.9 bước 5 | Chủ đầu tư sửa thì quản lý duyệt, chủ đầu tư không tự duyệt |
| Q3 | 1.15 | Giữ khung "Tạm ở"; đổi đường tra theo SEC-01 |
| Q4 | 2.7, 2.15 | Khung "Lỗi đang sửa" BUG-R3-019 + cách tạm "Khóa phòng có kế hoạch" (theo ORC). Tiền thuê kỳ: thu và ghi sổ như hiện nay, không ghi Desk. Chú thích QA còn mở cho lượt sau bản sửa |
| Q5 | 2.14, 5.4, 5.6, one-pager | Khung "Lỗi đang sửa – In phiếu" (BUG-R3-020): đưa khách xem trên màn hình, ghi sổ giao ca để gửi sau |
| Q6 | 3.7 | Giữ khung "Tạm ở", gỡ chú thích |
| Q7 | 3.6 | Giữ, gỡ chú thích; thêm "căn của buồng phòng không có nút Kiểm phòng" |
| Q8 | 3.1 | Giữ câu; thêm ghi chú lỗi chữ (BUG-R3-029) |
| Q9 | 1.8 bước 3 | Duyệt chỉ hỏi mật khẩu; Từ chối hỏi lý do + mật khẩu |
| Q10 | 1.6 | Liệt kê 5 mục kiểm máy, luôn hỏi mật khẩu + mã 6 số, form chỉ hiện trên máy chưa cấp |
| Q11 | 2.7, 2.12 Gia hạn bước 5 | Không có nút ghi thu giữa kỳ: ghi sổ giao ca, thu ở bước Bill & thu tiền. Mốc 14:00 (BR-423) không làm được trên Desk v1.0 – chú thích cho DOM |
| Q12 | 1.3 | Giữ "chủ đầu tư, quản lý" |
| Q13 | 2.10 bước 7–8 | Tên hộp và hai nút; Desk về khung đơn |
| Q14 | 3.6, 5.3 | Chỉ lễ tân trưởng kiểm; OWN/MGR "–"; lễ tân trưởng nghỉ thì không ai kiểm, VC vẫn nhận khách được |
| D14 | 2.14a bước 1, 6 | Bước 1 ghi sổ giao ca (không có ô ghi chú đơn – M48), không mở màn Trả phòng trước ngày đi (BUG-R3-024). Bước 6: giờ trả là giờ bấm; giảm dưới sàn thì dùng giảm giá đặc biệt trên dòng đêm – chú thích QA kiểm 29/10 trên OTM-00359, DOM xác nhận |
| D15 | 1.12, 1.14 | Nhật ký tiền không lọc theo giờ, không lọc theo người (bỏ "lọc người làm") |
| D16 | 2.4, 2.5a | Không có ô mã giao dịch: khung "Lỗi đang sửa" + ghi sổ giao ca; 2.5a bỏ "cùng mã giao dịch" |
| D17 | 2.12 Đổi phòng | Giữ gạch "Thêm phát sinh"; thêm khung "Lỗi đang sửa" BUG-R3-023 (kiểm trạng thái căn trước khi chọn) |
| D18 | 2.8 | Lý do **OTA báo hủy** có; gỡ chú thích |
| D19 | 1.11 | Khung "Lỗi đang sửa" BUG-R3-022: ghi sổ giao ca, báo quản lý; quản lý điều chỉnh dòng cùng loại nếu có; không thu tiền ngoài Desk |

## Chỗ lệch M1–M64

| Nhóm | Mục | Kết quả |
|---|---|---|
| Đã sửa trong sổ tay (48) | M1, M2, M3, M4, M5, M6, M7, M9, M10, M11, M12, M15, M16, M19, M21, M22, M23, M24, M26, M29, M30, M32, M33, M34, M35, M37, M38, M40, M41, M42, M43, M45, M46, M47, M48, M49, M50, M51, M53, M54, M55, M56, M58, M60, M61, M62, M63, M64 | Theo cột "Đề xuất sửa" của QA. Khác đề xuất ở 2 chỗ: M7 không viết "đội kỹ thuật nhập Wi-Fi" (lý do ở Q1); M24 viết theo mã nguồn (nút **Giữ chỗ đến …** chỉ có với kênh Trực tiếp/CTV và ngày đến từ ngày mai; ô **Số tiền đã nhận** điền sẵn chỉ để nguyên khi khách đã chuyển), ca đến hôm nay để chú thích QA lượt sau |
| QA ghi "không cần sửa" (16) | M8, M13, M14, M17, M18, M20, M25, M27, M28, M31, M36, M39, M44, M52, M57, M59 | Giữ nguyên. M20 có thêm Русский vào 2.4; M28 thêm "(danh sách chọn)"; M31 viết lại thứ tự trang khách ở 2.9 |

Ghi chú: M35 (QA ghi "không cần sửa lớn") và M53 (QA ghi "không cần sửa") BA vẫn sửa nhỏ: thêm chi tiết thu cùng lúc với nhận phòng, ô thẻ +/− vào 2.10; đổi thứ tự lý do và thêm nút **Quay lại** ở 3.4.

## Lỗi sản phẩm mới – cách tạm trong sổ tay

| Lỗi | Mục | Cách tạm ghi trong sổ tay |
|---|---|---|
| BUG-R3-019 | 2.7, 5.6 | Khung "Lỗi đang sửa": giữ căn bằng **Khóa phòng có kế hoạch**, lý do "HĐ dài hạn ngoài app – <mã HĐ giấy>"; tạo việc dọn tay; khi có bản sửa thì hủy khóa và tạo đơn |
| BUG-R3-020 | 2.14, 5.4, 5.6, one-pager | Đưa khách xem phiếu trên màn hình; ghi sổ giao ca để gửi sau |
| BUG-R3-021 | 1.4, 2.9, 2.21, 5.4, 5.6 | Thẻ Wi-Fi trong căn; lễ tân đọc khi khách hỏi |
| BUG-R3-022 | 1.11, 3.7, 5.6 | Ghi sổ giao ca, báo quản lý; quản lý điều chỉnh dòng cùng loại |
| BUG-R3-023 | 2.12, 5.6 | Kiểm `VC`/`VI` trên Buồng phòng/Sơ đồ phòng trước khi chọn căn mới |
| BUG-R3-024 | 2.14a, 5.6 | Không mở màn Trả phòng trước ngày đi |
| BUG-R3-025 | 2.4, 2.5a, 5.6 | Ghi mã giao dịch vào sổ giao ca |
| BUG-R3-026 | 3.9, 5.6 | Chọn **Khác**, ghi rõ trong mô tả |
| BUG-R3-027 | 2.9, 5.6 | Làm giấy tờ tại quầy |
| BUG-R3-028 | 2.5, 2.12, 2.14, 5.6 | Ghi rõ nhãn nhầm; làm theo sổ tay |
| BUG-R3-029 | 3.1 | Ghi chú lỗi chữ |
| BUG-R3-030 | 2.12, 5.6 | Đọc **Còn phải thu** |
| BUG-R3-031 | 2.10, 2.21, 5.6 | Quản lý đảo dòng mới trước khi hoàn tác |
| BUG-R3-032 | 1.1, 1.7, 5.6 | Kiểm bảo mật mỗi sáng trước 09:00 (SEC B1–B4) |

Mọi khung ghi "Lỗi đang sửa", không hứa ngày.

## Biện pháp bù SEC B1–B6 (ORC bổ sung lượt 3)

| # | Đã áp vào |
|---|---|
| B1–B4 | 1.1: dòng mới "Mỗi sáng trước 09:00, kể cả ngày nghỉ" và khung "Tạm ở v1.0 – kiểm bảo mật mỗi sáng", gồm: kiểm Tài khoản nhận (một dòng đang dùng, không dòng lên lịch lạ); xem Cần chú ý và Nhật ký tiền 24 giờ; đối soát app ngân hàng với VietQR hôm trước; ghi sổ giao ca. 5.8: bài tập cho chủ đầu tư |
| B5 | 1.7 (gạch "Trong 24 giờ…"), 2.4 (giữ chỗ bước 4, lưu ý), 2.13 (đoạn riêng trước khung kiểm tiền), 2.21, 4.2, 5.4, 5.5, "Luôn nhớ" chương 2, bài tập lễ tân ở 5.8, `staff-one-pager.md` |
| B6 | Đã có: 0.3 (mã khôi phục trên giấy/trình quản lý mật khẩu, không làm trên máy dùng chung), 0.4 (06.33 không ghi trong sổ tay) |

Desk v1.0 không có "chuông thông báo" và không có màn nhật ký `security`/`config`. Vì vậy sổ tay viết "chuông" là **Tổng quan → Cần chú ý**, và hướng chủ đầu tư tìm việc đổi tài khoản nhận trong **Nhật ký tiền** (dòng "Đổi tài khoản nhận chuyển khoản"). Còn sự kiện `mfa.recovery_code_used` / `mfa.reset*` thì chủ đầu tư chưa xem được trên Desk. Đã để chú thích ẩn ở 1.1 nhờ **SEC/QA xác nhận** cách chủ đầu tư thấy các sự kiện này ở v1.0.

## Còn chờ (cập nhật)

| Việc | Ai | Mục |
|---|---|---|
| ESC-039 – lễ tân thấy tiền chuyển khoản | INV | 2.13, 5.4, 5.6 |
| ESC-038 – quyền kế toán + câu phụ hóa đơn khách lẻ | INV (hỏi kế toán) | 4.3, 2.16, 5.6 |
| ESC-035 – mức phụ thu nhận sớm | INV | 2.10, 5.2 |
| `[GIẢ ĐỊNH – chờ INV xác nhận]` app khóa cài trên điện thoại/máy tính bảng của cơ sở (SEC-05) | INV | 2.10 |
| `[GIẢ ĐỊNH – chờ INV xác nhận]` có Zalo của cơ sở (OA hoặc số cơ sở) trên điện thoại cơ sở (SEC-09) | INV | 2.4 |
| Số quỹ lẻ; người và ngày chốt công tơ | INV điền khi đào tạo | 1.14, 4.1 |
| Mốc thu tiền gia hạn 14:00 (BR-423) không làm được trên Desk v1.0 | DOM xem lại, INV nếu đổi chính sách | 2.12 |
| Diễn tập D14 ngày 29/10 (OTM-00359); M24; Q4 sau bản sửa BUG-R3-019 | QA | 2.14a, 2.5, 2.7, 2.15 |
| Cách chủ đầu tư thấy sự kiện `mfa.*` ở v1.0 | SEC/QA | 1.1 |
| Khi bản sửa BUG-R3-019/020/021/022/023 lên: bỏ khung "Lỗi đang sửa" tương ứng | BA | 1.4, 1.11, 2.7, 2.12, 2.14, 5.6 |
| Bộ dựng chưa có kiểu khung riêng cho "**Lỗi đang sửa**" (hiện là khối trích thường) | UXD | Toàn sổ tay |
