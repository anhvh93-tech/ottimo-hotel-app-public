# PO review BA – Sổ tay sử dụng OTTIMO Desk v1.0

- Người review: PO | Round 3, bước Review chéo (tài liệu phát hành v1.0) | Ngày: 27/10/2026
- Đối tượng: `product/docs/manual/user-manual-v1.0.md` (bản nội dung 1.0, BA 27/10, áp cho `v1.0.0-rc.3` `70fe734`); `rounds/round-03/outputs/BA/manual-report.md`
- Căn cứ: `product/docs/release-notes.md` (bản PO sửa 27/10 theo L3, L5), `rounds/round-03/release-v1-plan.md` mục 6, `03-backlog/backlog.md` cột "Phát hành", `01-decisions/decision-log.md` 24–27/10, BR-415, BR-802, `production-defaults.ts` (`hk_self_inspection_enabled = false`), mã app nhân viên rc.3 (`product/apps/mobile/src` – không có màn đếm minibar, nút kiểm phòng FDL+)
- Bốn câu PO xét: (1) phạm vi đúng v1.0, không hứa tính năng sau; (2) khung "Tạm ở v1.0" khớp release notes "Giới hạn đã biết"; (3) chương nào thiếu cho bộ phận nào; (4) ngôn ngữ có dễ cho nhân viên không rành máy.

## Kết luận

**Đạt có điều kiện.** Sổ tay viết đúng bản rc.3, mỗi chương đọc riêng được, bước đánh số và tên nút lấy từ chuỗi thật. Không có Blocker. Bốn thẻ Major phải xử lý trước bản cuối 30/10 (hai thẻ hứa sai hoặc thiếu giới hạn có thể làm nhân viên thu sai tiền hoặc hứa sai với CTV; hai thẻ ảnh hưởng trực tiếp tới buổi đào tạo 31/10–01/11).

| Mức | Số thẻ |
|---|---|
| Blocker | 0 |
| Major | 4 |
| Minor | 8 |
| Suggestion | 2 |

Đối chiếu khung "Tạm ở v1.0" và bảng 5.6 với release notes: các mục sổ tay có mà release notes rc.1 thiếu (minibar buồng phòng báo số, kiểm phòng do lễ tân trưởng, chủ đầu tư/quản lý chưa vào app nhân viên, chưa có vai kế toán, chấm công v1.1, ảnh giấy tờ 30 ngày) PO đã đưa vào release notes 27/10. Còn lệch: thẻ 02 (BR-415 – release notes có, sổ tay thiếu), thẻ 06 (BUG-R3-018 phần 1 – cả hai cùng thiếu; PO đã thêm vào release notes), thẻ 01 (sổ tay ghi sai bản so với kế hoạch phát hành), thẻ 09 (lỗi P3).

## Thẻ feedback

### FB-R3-PO-BA-01
- Mức độ: Major
- Vị trí: `user-manual-v1.0.md` mục 4.2, khung "Tạm ở v1.0" cuối mục ("chưa có màn hoa hồng chi tiết, kanban khách tiềm năng, mẫu tin nhắn (v1.2)")
- Vấn đề: Hứa sai bản. Theo backlog cột "Phát hành" và `release-v1-plan.md` mục 6: hoa hồng ghi nhận theo đợt chi (US-089) là **v1.3**; kanban khách tiềm năng (US-090) là **R4+, chưa xếp bản**. Chỉ "mẫu tin nhắn" đúng v1.2.
- Vì sao quan trọng: Sale và CTV là người ngoài/ăn hoa hồng; họ sẽ hỏi chủ đầu tư "v1.2 đâu" và tính toán thu nhập theo lời hứa đó. Sổ tay là tài liệu INV phát tay, sai bản ở đây thành cam kết.
- Đề xuất sửa: "chưa có màn hoa hồng theo đợt chi (dự kiến v1.3), bảng theo dõi khách tiềm năng (chưa xếp lịch), mẫu tin nhắn (dự kiến v1.2)". Thêm hai dòng tương ứng vào bảng 5.6. Nguyên tắc chung cho cả sổ tay: chỉ ghi số bản khi mục đó có trong `release-v1-plan.md` mục 6; ngoài ra ghi "chưa xếp lịch".
- Trạng thái: Open

### FB-R3-PO-BA-02
- Mức độ: Major
- Vị trí: mục 2.10 "Giờ nhận phòng" (dòng "Đơn OTA: phụ thu nhận sớm tính trên giá Trực tiếp hiện hành"); mục 1.16
- Vấn đề: Thiếu điều kiện BR-415: phụ thu của khách OTA chỉ thu được khi chính sách đã đăng trên nội quy/house rules của kênh. Release notes "Giới hạn đã biết" ghi rõ: kênh OTA chưa đổi giờ nhận phòng 12:00 (checklist A12) thì chưa thu được phụ thu nhận sớm của khách đặt qua kênh đó. Sổ tay chỉ nói "Desk tính … giá Trực tiếp", lễ tân sẽ thu theo số Desk đề xuất.
- Vì sao quan trọng: Thu phụ thu không có căn cứ trên kênh → khách khiếu nại với OTA, đánh giá xấu, có thể phải hoàn. Đây là tiền thu trực tiếp tại quầy.
- Đề xuất sửa: thêm vào 2.10 một khung "Tạm ở v1.0": "Khách đặt qua Booking.com, Agoda, Airbnb: chỉ thu phụ thu nhận sớm khi chủ đầu tư đã báo kênh đó đổi giờ nhận phòng 12:00 trong nội quy. Kênh chưa đổi: tắt **Khách nhận sớm**, ghi chú lý do, báo quản lý." Ở 1.16 thêm một câu: chủ đầu tư báo lễ tân trưởng danh sách kênh đã đổi.
- Trạng thái: Open

### FB-R3-PO-BA-03
- Mức độ: Major
- Vị trí: toàn sổ tay (không có mục đào tạo); mục 2.13 dòng cuối "Không quét mã VietQR trên staging…"; mục 0.2
- Vấn đề: Sổ tay dùng để INV đào tạo từng bộ phận 31/10–01/11 (decision-log 27/10) nhưng không nói **tập ở đâu** và **tập gì**. Từ buổi B2 (28/10) production đã có tài khoản thật; nếu nhân viên tập đặt phòng, thu tiền trên `desk.ottimo.vn` thì đơn giả, dòng Nhật ký tiền (chỉ ghi thêm, không xóa) và nhật ký xem giấy tờ sẽ nằm trong dữ liệu thật trước ngày D. Dòng nhắc "staging" ở 2.13 lại đặt trong hướng dẫn vận hành thật, nhân viên không biết staging là gì.
- Vì sao quan trọng: Dữ liệu tập lẫn vào sổ thật làm sai đối chiếu sổ giấy 3 ngày đầu và số chuyển sổ ngày D (mục 4.3). Không có bài tập thì buổi đào tạo thành đọc sổ tay.
- Đề xuất sửa: thêm **Phụ lục 5.8 "Đào tạo theo bộ phận"** (1 trang): (a) tập trên trang tập (staging – UXD/BA đặt tên dễ hiểu, ví dụ "Desk tập"), mã VietQR trên trang tập không chuyển tiền; trên Desk thật chỉ **đăng nhập, đổi mật khẩu tạm, đăng xuất**; (b) mỗi bộ phận: mục cần đọc, 3–5 bài tập (ví dụ lễ tân: báo giá → giữ chỗ → xác nhận cọc → nhận phòng → trả phòng 3 bước; buồng phòng: bắt đầu dọn → dọn xong → báo sự cố có ảnh → thao tác khi mất mạng), thời lượng; (c) ô ký "đã học, làm được" lưu ở OTTIMO. Chuyển dòng staging ở 2.13 vào phụ lục này. Tài khoản tập cho từng nhân viên do QA/OPS tạo trên staging (ORC giao) – PO đã ghi điều kiện này vào checklist INV mục C.
- Trạng thái: Open

### FB-R3-PO-BA-04
- Mức độ: Major
- Vị trí: chương 1, 2, 4 (ví dụ "folio" xuất hiện ở 1.9, 1.11, 2.12, 2.14 không giải thích; "FOC", "OTA", "extranet", "sàn–trần" (2.5, 2.6), "bút toán" (1.11), "đối soát" (1.12), "Mã BIN" (1.7), "ngày kinh doanh", "công nợ")
- Vấn đề: Sổ tay không có bảng giải thích từ ngữ. Phần lớn từ trên là từ của hệ thống/ngành, nhân viên lễ tân mới và người không rành máy không hiểu; chương 3 (buồng phòng) viết dễ hiểu hơn hẳn chương 1–2.
- Vì sao quan trọng: Tiêu chí "dễ cho nhân viên không rành máy" của INV. Hiểu sai "folio" hay "đối soát" là thao tác sai trên tiền.
- Đề xuất sửa: thêm **5.0 "Từ ngữ trên Desk"** (15–20 từ, mỗi từ một dòng, ví dụ "**Folio** – bảng tiền của một lượt ở: tiền phòng, phát sinh, đã thu, còn phải thu"; "**FOC** – miễn phí một khoản"; "**Sàn – trần** – giá thấp nhất và cao nhất được phép nhập"; `VD`/`VC`/`VI`… trỏ về 3.2). Lần đầu một từ xuất hiện trong mỗi chương thì ghi kèm nghĩa ngắn trong ngoặc.
- Trạng thái: Open

### FB-R3-PO-BA-05
- Mức độ: Minor
- Vị trí: 0.1, 1.3, 1.4, 1.9 (tiêu đề "(ESC-031)"), 2.18 ("ESC-030 A"), 4.3 ("ESC-038", "ESC-033"), 5.2 ("ESC-035"), đầu sổ tay ("BR v0.4.7", "rbac-matrix.md v0.2.5", commit `70fe734`), 1.16 và 2.7, 4.3 (đường dẫn `product/docs/day-one-guide.md`)
- Vấn đề: Mã nội bộ của đội và đường dẫn trong repo nằm trong phần nhân viên đọc. Nhân viên không có các tài liệu đó; "ESC-030 A" không mang nghĩa gì với lễ tân.
- Vì sao quan trọng: Rối mắt, làm sổ tay trông như tài liệu kỹ thuật; nhân viên tưởng phải đọc thêm tài liệu khác.
- Đề xuất sửa: thay bằng câu thường ("theo quyết định của chủ đầu tư ngày 26/10", "hướng dẫn chuyển đổi ngày đầu – chủ đầu tư giữ"). Giữ mã và đường dẫn ở phần "Nguồn" đầu sổ tay và 5.7 Lịch sử, hoặc chú thích ẩn `<!-- -->` như các ghi chú QA.
- Trạng thái: Open

### FB-R3-PO-BA-06
- Mức độ: Minor
- Vị trí: mục 1.3 "Đổi giá một căn" và "Lỡ lên lịch nhầm một giá tương lai"
- Vấn đề: Thiếu khung "Tạm ở v1.0" cho BUG-R3-018 phần 1 (decision-log 26/10): Desk chưa hiện danh sách giá đã lên lịch và chưa có nút hủy (v1.0.1). Sổ tay chỉ dạy cách sửa giá nhầm, không nói chủ đầu tư không xem lại được mình đã lên lịch những giá nào.
- Vì sao quan trọng: Chủ đầu tư nhập giá ở B2 và sau đó; quên một giá tương lai thì tới ngày đó giá tự đổi mà không ai thấy trước.
- Đề xuất sửa: thêm khung "Tạm ở v1.0: Desk chưa hiện danh sách giá đã lên lịch và chưa có nút hủy (dự kiến v1.0.1). Mỗi lần lên lịch giá cho ngày sau, ghi căn, giá, ngày hiệu lực vào sổ. Muốn bỏ một giá đã lên lịch: nhập lại giá hiện hành với đúng ngày hiệu lực đó." Thêm một dòng vào 5.6. (PO đã thêm mục này vào release notes "Giới hạn đã biết".)
- Trạng thái: Open

### FB-R3-PO-BA-07
- Mức độ: Minor
- Vị trí: mục 3.3 bảng "Giờ cần xong", dòng "Trống từ đêm qua … **12:00** (kiểm và báo sẵn sàng đầu ca sáng)"; mục 5.1 dòng 12:00 ("Hạn buồng phòng báo sẵn sàng")
- Vấn đề: Mâu thuẫn trong sổ tay: 3.6 nói buồng phòng không tự kiểm ở v1.0 (đúng – `hk_self_inspection_enabled = false` trong `production-defaults.ts`), nhưng 3.3 giao buồng phòng "kiểm và báo sẵn sàng".
- Vì sao quan trọng: Buồng phòng đi tìm nút kiểm phòng không có; lễ tân trưởng không biết mình phải kiểm trước 12:00.
- Đề xuất sửa: "Rà lại căn, bấm **Dọn xong** nếu có dọn; lễ tân trưởng kiểm xong trước **12:00**". 5.1 sửa tương tự. (One-pager đã sửa cùng hướng.)
- Trạng thái: Open

### FB-R3-PO-BA-08
- Mức độ: Minor
- Vị trí: mục 3.6 câu đầu ("Lễ tân trưởng (hoặc quản lý trên Desk) kiểm"); bảng 5.3 dòng "Kiểm phòng (VC → VI)" cột Chủ đầu tư, Quản lý ✔; mục 3.1 câu cuối
- Vấn đề: 3.1 nói chủ đầu tư và quản lý chưa đăng nhập được app nhân viên ở v1.0 (chuỗi `auth.mfa_later` có trong mã). Vậy quản lý kiểm phòng ở đâu? Chương 2.19 (Buồng phòng trên Desk) không có thao tác kiểm phòng. Chưa có trong danh sách Q của QA.
- Vì sao quan trọng: Ngày lễ tân trưởng nghỉ, không ai biết ai chuyển căn sang `VI`. Lễ tân vẫn nhận khách vào `VC` được, nhưng căn trống quá 3 ngày cần kiểm lại (3.6).
- Đề xuất sửa: thêm Q14 cho QA: Desk có thao tác kiểm phòng cho MGR/OWN không. Nếu không: 3.6 ghi "Lễ tân trưởng kiểm trên app nhân viên. Ngày lễ tân trưởng nghỉ: nhận khách vào căn `VC` như thường; chủ đầu tư có thể gán thêm vai Lễ tân trưởng cho một lễ tân (mục 1.5)" và 5.3 đổi ô OWN/MGR thành "– (v1.0)".
- Trạng thái: Open

### FB-R3-PO-BA-09
- Mức độ: Minor
- Vị trí: các khung "Lỗi nhỏ đã biết"; đối chiếu release notes "Lỗi nhỏ còn mở"
- Vấn đề: Thiếu 2 lỗi nhân viên sẽ gặp: (a) "Cần chú ý": dòng giữ chỗ sắp hết hạn chưa ghi mã đơn (v1.0.1) – thuộc 2.2/2.4; (b) Nhật ký tiền hiện mã lý do thô (v1.0.2) – thuộc 1.12/4.3, kế toán và chủ đầu tư đọc lý do ở đây; câu "phí phạt" hiện cả với giặt ủi (v1.0.2) – thuộc 2.12.
- Vì sao quan trọng: Nhân viên gặp lỗi không có trong sổ tay sẽ báo P0 hoặc làm khác đi.
- Đề xuất sửa: thêm vào đúng mục. Ở (a) cách làm: mở dòng để xem đơn. Ở (b): đọc cột lý do người làm ghi, bỏ qua mã.
- Trạng thái: Open

### FB-R3-PO-BA-10
- Mức độ: Minor
- Vị trí: mục 0.8 điểm 5 ("chủ đầu tư đã chọn 3 tháng, áp từ bản v1.0.1")
- Vấn đề: Ghi chắc chắn "từ v1.0.1" cho một thay đổi còn chờ SEC đánh giá (decision-log 26/10 DOM: "BE nới biên v1.0.1, SEC đánh giá").
- Vì sao quan trọng: Nếu SEC chưa duyệt kịp, sổ tay sai và lễ tân nói sai với khách về thời gian lưu ảnh (đây là câu nói với khách theo Nghị định 13).
- Đề xuất sửa: "Ở v1.0 ảnh tự xóa 30 ngày sau trả phòng. Mức 3 tháng chủ đầu tư đã chọn sẽ áp ở bản vá sau khi đội bảo mật duyệt. Luôn đọc số ngày trên câu hỏi đồng ý của Desk khi nói với khách."
- Trạng thái: Open

### FB-R3-PO-BA-11
- Mức độ: Minor
- Vị trí: mục 2.7 khung "Tạm ở v1.0" ("chốt chỉ số công tơ (có ảnh), tính tay …"); chương 3, chương 4.1
- Vấn đề: Sổ tay nói phải chốt công tơ có ảnh nhưng không bộ phận nào được giao: không có trong chương 3 (buồng phòng) hay 4.1 (bảo trì), không có ngày chốt. PRD mục 4 giao "chốt số điện nước" cho nhóm U3.
- Vì sao quan trọng: Thu điện nước khách dài hạn là tiền hằng tháng; việc không có người làm là việc bị sót.
- Đề xuất sửa: thêm vào 4.1 (hoặc 3) một khung "Tạm ở v1.0 – Chốt công tơ khách dài hạn": ai làm theo phân công hiện nay của OTTIMO, ngày nào trong tháng, chụp ảnh công tơ (không chụp khách, không gửi nhóm Zalo), đưa số cho lễ tân/chủ đầu tư tính tay. Ngày chốt để trống cho chủ đầu tư điền khi đào tạo.
- Trạng thái: Open

### FB-R3-PO-BA-12
- Mức độ: Minor
- Vị trí: chương 2, khung "Trước khi bắt đầu" ("Lễ tân trưởng có thêm: duyệt trong hạn mức, xác nhận nhận phòng ngoại lệ, kiểm phòng")
- Vấn đề: Lễ tân trưởng có menu **Cần duyệt** (0.7) và hạn mức duyệt ≤ 300.000 đ/lần (1.8) nhưng chương 2 không có mục nào chỉ cách duyệt; cách duyệt nằm ở chương 1 "dành cho chủ đầu tư và quản lý", lễ tân trưởng dễ bỏ qua.
- Vì sao quan trọng: Lễ tân trưởng là người duyệt đầu tiên trong ca; không biết duyệt thì yêu cầu dồn lên quản lý.
- Đề xuất sửa: thêm mục 2.22 "Việc riêng của lễ tân trưởng" (5 dòng, mỗi dòng trỏ về mục chi tiết): duyệt miễn/giảm trong hạn mức (1.8), xác nhận nhận phòng khi buồng chưa sẵn sàng (2.10), xác nhận nâng hạng khi gán căn (2.6), kiểm phòng trên app (3.6), đổi căn cho khách sắp đến khi khách cũ ở quá 18:00 (2.15).
- Trạng thái: Open

### FB-R3-PO-BA-13
- Mức độ: Suggestion
- Vị trí: đầu mỗi chương
- Vấn đề: Mỗi chương dài; người không rành máy cần một khối "5 điều phải nhớ" in được, khớp với `staff-one-pager.md`.
- Vì sao quan trọng: Dễ ôn sau buổi đào tạo; one-pager và sổ tay nói cùng một câu.
- Đề xuất sửa: thêm khối 5 dòng ở đầu chương 2, 3, 4.1, 4.2. Lấy câu từ one-pager (bản PO sửa 27/10) để hai tài liệu không lệch.
- Trạng thái: Open

### FB-R3-PO-BA-14
- Mức độ: Suggestion
- Vị trí: đầu sổ tay ("Áp dụng cho bản `v1.0.0-rc.3`") và 5.7
- Vấn đề: Khi QC chấm cổng v1.0 ĐẠT, bản chạy ngày D sẽ mang tag `v1.0.0` (release notes). Sổ tay in ra ghi "rc.3" sẽ làm nhân viên hỏi có phải bản thử không.
- Vì sao quan trọng: Tránh câu hỏi không cần thiết khi đào tạo.
- Đề xuất sửa: ghi "OTTIMO Desk v1.0" ở dòng hiển thị; giữ `rc.3`/commit ở 5.7 Lịch sử. BA cập nhật khi PO ghi tag cuối vào release notes.
- Trạng thái: Open

## Điểm làm tốt (giữ)

1. Chỉ viết những gì rc.3 làm được, và mỗi chỗ chưa làm được có cách làm thay cụ thể (đặc biệt 1.14 đóng ca bằng sổ giao ca hai chữ ký và 3.7 minibar) – đúng tinh thần "không hứa".
2. Ghi lỗi P3 ngay tại thao tác bị ảnh hưởng, kèm cách vượt qua – nhân viên không phải tra release notes.
3. Ghi chú `<!-- QA: … -->` ẩn trong tệp và bảng Q1–Q13 trong báo cáo: rõ chỗ nào chưa chắc, ai kiểm, nếu khác thì sửa gì.
