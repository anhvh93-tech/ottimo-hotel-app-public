# Use case chính – OTTIMO Desk

- Tác giả: BA | Round 1 – Bước 4 (Phản hồi & sửa) | Ngày: 15/10/2026 | Phiên bản: 0.2 (đã xử lý review DOM, ARC, SEC)
- "Hôm nay" = **ngày nghiệp vụ** (đổi lúc 06:00 giờ VN – `state-machines.md` 0.2 điểm 7).
- Nguồn: `business-processes.md` (P01–P10), `state-machines.md` (mã chuyển B1…, K1…, SM-xx), `rbac-matrix.md` (vai, hành động A-xx), `business-rules.md` (BR-xxx – con số chỉ tham chiếu mã), `03-backlog/backlog.md` (US-xxx).
- Mỗi use case có: tác nhân, kích hoạt, tiền điều kiện, hậu điều kiện, luồng chính, luồng thay thế/ngoại lệ (A), lỗi (X), quy tắc, story. Dữ liệu và thông báo lỗi ở mức hành vi; giao diện do UXD thiết kế.

## 0. Danh mục
| UC | Tên | Tác nhân chính | Quy trình | Story |
|---|---|---|---|---|
| UC-01 | Lập báo giá ngắn ngày | SAL, CTV, FD | P01 | US-080, US-082, US-083 |
| UC-02 | Tạo giữ chỗ | SAL, CTV, FD | P01, P02 | US-084, US-018 |
| UC-03 | Xác nhận cọc / ký quỹ | FD, SAL | P01, P02 | US-086, US-119 |
| UC-04 | Tạo đơn ngắn ngày đã đảm bảo (trực tiếp, OTA nhập tay) | FD | P01 | US-017, US-018, US-019, US-047 |
| UC-05 | Hủy đơn / hủy giữ chỗ / đánh dấu no-show | FD, SAL, CTV, SYS | P01 | US-021, US-085 |
| UC-06 | Lập báo giá dài hạn | SAL, CTV | P02 | US-081 |
| UC-07 | Sinh hợp đồng và lịch kỳ thu | SYS | P02 | US-086, US-088 |
| UC-08 | Ghi nhận thu kỳ dài hạn | FD | P02 | US-088 |
| UC-09 | Gia hạn / chấm dứt sớm hợp đồng | FD, MGR | P02 | US-091, US-093 |
| UC-10 | Check-in online | GST | P03 | US-106, US-107 |
| UC-11 | Nhận phòng | FD | P03 | US-025, US-026, US-027 |
| UC-12 | Nhập giấy tờ và khai báo lưu trú | FD | P03 | US-042–US-047, US-050 |
| UC-13 | Gia hạn lưu trú | FD, GST | P04 | US-028 |
| UC-14 | Nhắc trả phòng và đặt trả muộn | SYS, FD, GST | P04 | US-029, US-030, US-031, US-034, US-113 |
| UC-15 | Gửi và xử lý yêu cầu khách | GST, FD, HK, MT | P04 | US-109, US-110 |
| UC-16 | Đổi phòng | FD | P04 | US-024 |
| UC-17 | Thêm phát sinh vào folio | FD | P04, P05 | US-032, US-033 |
| UC-18 | Trả phòng 3 bước + bill (ngắn ngày) | FD | P05 | US-035–US-039 |
| UC-19 | Trả phòng nhanh qua app | GST | P05 | US-113 (mở rộng) |
| UC-20 | Trả phòng dài hạn và quyết toán ký quỹ | FD, MGR | P05 | US-041 |
| UC-21 | Chốt công tơ điện nước | MT, FD | P06 | US-064, US-065 |
| UC-22 | Dọn phòng và đổi trạng thái buồng | HK | P07 | US-052, US-053, US-054, US-056 |
| UC-23 | Kiểm phòng | FDL, MGR, HK | P07 | US-055 |
| UC-24 | Tạo và xử lý phiếu sửa chữa, khóa phòng | MT, FD, HK | P08 | US-057, US-061, US-062 |
| UC-25 | Bảo trì định kỳ | MT | P08 | US-063 |
| UC-26 | Ghi nhận và chi hoa hồng | SYS, OWN, MGR | P09 | US-089, US-087 |
| UC-27 | Gửi và duyệt FOC / ngoại lệ | FD, FDL, MGR | P10 | US-007, US-102 |
| UC-28 | Đăng nhập và truy cập theo vai | Mọi nhân viên | – | US-001, US-002, US-003 |
| UC-29 | Xem ảnh giấy tờ và xóa theo hạn / theo yêu cầu | FD, MGR, SYS | P03 | US-048, US-049 |
| UC-30 | Yêu cầu của chủ thể dữ liệu | GST, MGR | – | US-133, US-134 |
| UC-31 | Đơn nhóm (đoàn nhiều căn) | FD, SAL, CTV | P01 | (đề xuất PO thêm story – FB-R1-DOM-BA-05, DOM-PO-02) |
| UC-32 | Đóng ca và đối soát chuyển khoản | FD, FDL, MGR | P11 | US-124 (+ đề xuất story đối soát) |
| UC-33 | Vận hành khi mất mạng/mất điện | FD, MGR | P12 | (đề xuất PO thêm story) |

---

## UC-01 – Lập báo giá ngắn ngày
- **Tác nhân**: SAL, CTV, FD. **Kích hoạt**: khách hỏi giá. **Tiền điều kiện**: đăng nhập; lịch giá có giá.
- **Hậu điều kiện**: báo giá `active` (SM-08) có mã, snapshot; lead `quoted`.
- **Luồng chính**: (1) Chọn khách (bộ chọn khách dùng chung) hoặc tạo lead; (2) nhập căn/nhóm căn, ngày đến, số đêm, số người lớn, trẻ em theo bậc tuổi BR-110, kênh (Trực tiếp/CTV), người chốt; (3) hệ thống kiểm phòng trống, gợi ý căn trống khác; (4) tính tổng tiền từng đêm theo lịch giá, giảm theo đêm, mã khách quay lại, phụ thu người, cọc, hoa hồng của người chốt; (5) lưu → mã báo giá, hạn hiệu lực; (6) sao chép văn bản VI/EN/RU.
- **A1**: số đêm đạt ngưỡng so sánh BR-108 → hiện thêm phương án thuê 1 tháng; đạt ngưỡng bắt buộc → chuyển UC-06.
- **A2**: CTV không thấy phần "OTTIMO còn lại" (rbac mục 6).
- **X1**: ngày đến đã qua / ngoài cửa sổ bán BR-112 → lỗi tại ô. **X2**: vượt sức chứa → lỗi. **X3**: không còn căn trống → "Hết phòng trong khoảng ngày", gợi ý ngày khác.
- **Quy tắc**: BR-104, 107, 108, 110, 111, 112, 304, 305, 903, 006, 007.

## UC-02 – Tạo giữ chỗ
- **Tác nhân**: SAL, CTV (khách của mình), FD. **Kích hoạt**: khách đồng ý báo giá. **Tiền điều kiện**: báo giá `active`; khách có SĐT.
- **Hậu điều kiện**: đơn `hold` (B1); căn khóa; khai báo `none`; lead `holding`; báo giá `converted`; đồng bộ kênh.
- **Luồng chính**: (1) Từ báo giá bấm "Tạo giữ chỗ"; (2) chọn hạn giữ trong BR-302 (mặc định theo tham số); (3) chọn cách nhận cọc; (4) hệ thống kiểm trùng trong giao dịch, tính hạn thực tế BR-302, tạo đơn; (5) hiển thị VietQR/nội dung chuyển khoản theo mã đơn.
- **A1**: ngày đến = hôm nay → không cho giữ chỗ, chuyển UC-04 thu ngay. **A2**: gia hạn giữ 1 lần (B3).
- **X1**: căn vừa bị đặt → "Căn vừa được đặt, chọn căn khác" (BR-906). **X2**: báo giá hết hiệu lực → yêu cầu gia hạn/lập lại (BR-304).
- **Quy tắc**: BR-302, 303, 906, 905, 608.

## UC-03 – Xác nhận cọc / ký quỹ
- **Tác nhân**: FD, SAL; SYS (R3 qua IPN). CTV chỉ "báo đã chuyển cọc" kèm ảnh biên nhận. **Tiền điều kiện**: đơn `hold` chưa hết hạn.
- **Hậu điều kiện**: giao dịch `succeeded`; đơn `confirmed` (B4); lead `won`; dài hạn → UC-07; hoa hồng `projected`.
- **Luồng chính**: (1) Mở đơn `hold`; (2) nhập số tiền, cách thanh toán, mã tham chiếu chuyển khoản; (3) hệ thống kiểm số tiền ≥ mức cọc BR-305 (ngắn ngày) hoặc ký quỹ BR-206 (dài hạn); (4) kiểm trùng lại; (5) xác nhận; nhật ký tiền.
- **A1**: thu thiếu → giao dịch ghi nhận, đơn vẫn `hold`, hiện "còn thiếu". **A2**: tiền về sau khi đơn đã tự hủy → cảnh báo, xử lý theo SM-01 mục 1.3.
- **X1**: CTV gọi xác nhận → từ chối (rbac A04). **X2**: đơn đã hết hạn → "Giữ chỗ đã hết hạn".
- **Quy tắc**: BR-305, 306, 206, 208, 521, 008.

## UC-04 – Tạo đơn ngắn ngày đã đảm bảo
- **Tác nhân**: FD (R2 nhập tay đơn OTA); SYS (R3 channel manager). **Tiền điều kiện**: căn mở bán.
- **Hậu điều kiện**: đơn `confirmed` (B2), giá từng đêm snapshot, khai báo `none`, đồng bộ kênh.
- **Luồng chính**: (1) Từ rack chọn căn + ngày; (2) nhập kênh, ngày đến, số đêm (giới hạn BR-112), số khách, khách (bộ chọn), giá/đêm mặc định theo lịch giá kênh, mã OTA và kiểu thanh toán (OTA) hoặc giao dịch đã thu (trực tiếp); (3) lưu, kiểm trùng ở server.
- **A1**: khách vãng lai đến hôm nay → thu tiền rồi tạo `confirmed`. **A2** (chỉ kênh thuộc nhóm OTA, `channel_group = 'ota'` – decision-log PO): căn đã chọn đã kín → server **không tự đổi căn**, trả `409` kèm danh sách căn trống (cùng nhóm trước) để FD chọn lại; **không còn căn nào** → FD xác nhận tạo đơn ở làn "Chưa gán căn" (`conflict_state = open`, B7b), cảnh báo đỏ FD + MGR, xử lý bằng UC-04b. **A3**: đơn OTA về từ channel manager (R3) trùng → tự gán căn cùng nhóm, không có → chưa gán căn (BR-312).
- **UC-04b – Gán căn cho đơn chưa gán**: FD mở làn "Chưa gán căn" → hệ thống gợi ý căn trống theo BR-312 → FD chọn → kiểm trùng → `conflict_state = resolved`, sự cố đóng (B7a). Không còn căn → MGR dời khách ra ngoài (`resolveOverbookingExternal`). Nhận phòng bị chặn cho đến khi gán căn.
- **X1** (kênh Trực tiếp/CTV): trùng lịch/khối OOO → chặn, báo căn, khoảng ngày trùng, gợi ý căn trống. **X2**: kênh trực tiếp thiếu SĐT → chặn. **X3**: giá ngoài sàn–trần → lỗi tại ô.
- **Quy tắc**: BR-104, 105, 106, 112, 307, 312, 608, 901, 905, 906, 951.

## UC-05 – Hủy đơn / hủy giữ chỗ / no-show
- **Tác nhân**: FD+, SAL (đơn của mình), CTV (giữ chỗ của mình), SYS (hết hạn giữ). **Tiền điều kiện**: đơn `hold` hoặc `confirmed`.
- **Hậu điều kiện**: `cancelled`/`no_show`; mở phòng; khai báo `void`; hoa hồng `void`; yêu cầu hoàn (nếu có) chờ duyệt.
- **Luồng chính (hủy)**: (1) Chọn Hủy; (2) chọn lý do danh mục BR-308 (+ ghi chú khi "Khác"); (3) hệ thống hiển thị phí hủy/phần hoàn theo BR-309 (trực tiếp) hoặc nhập theo kênh (BR-310); (4) xác nhận (hộp thoại xác nhận bắt buộc – khắc phục HR-06); (5) phần hoàn → UC-27 (MGR duyệt).
- **Luồng no-show**: sau mốc gọi BR-311 hệ thống nhắc FD gọi khách; sau mốc đánh dấu FD ghi kết quả liên lạc và bấm No-show (B11).
- **A1**: MGR dời ngày thay vì hủy (B8). **A2**: hết hạn giữ chỗ → SYS hủy (B6), báo người tạo. **A3**: khôi phục no-show (B12) – FD/FDL tự làm khi đủ 3 điều kiện (còn ngày nghiệp vụ của đêm đến; căn còn trống, không đổi căn; không hoàn/đổi giá), lý do bắt buộc, MGR được báo; ngoài ra gửi duyệt MGR+.
- **X1**: thiếu lý do → chặn. **X2**: đơn `in_house` → không hủy được (dùng trả sớm).
- **Quy tắc**: BR-303, 308–311, 522.

## UC-06 – Lập báo giá dài hạn
- **Tác nhân**: SAL, CTV. **Tiền điều kiện**: căn trống từ ngày vào ở.
- **Hậu điều kiện**: báo giá dài hạn `active` có snapshot các tham số kỳ hạn.
- **Luồng chính**: (1) Nhập khách, căn, ngày vào ở, kỳ hạn, loại khách VN/NN, số người, gói dọn, người chốt; (2) hệ thống tính tiền thuê/tháng, phí dịch vụ + gói dọn, điện nước ước tính, ký quỹ, chu kỳ thu, thu khi chốt, ngày kết thúc theo tháng lịch, hoa hồng; quy đổi USD tham khảo cho khách NN; (3) lưu, sao chép văn bản VI/EN/RU.
- **A1**: kỳ hạn lẻ → mức mốc thấp hơn (BR-202). **A2**: phí dịch vụ = 0 có lý do (BR-204, Q-D1).
- **X1**: căn có đơn trong khoảng HĐ → gợi ý căn khác.
- **Quy tắc**: BR-004, 009, 109, 201–209, 212.

## UC-07 – Sinh hợp đồng và lịch kỳ thu
- **Tác nhân**: SYS (sau UC-03 với đơn dài hạn). **Hậu điều kiện**: HĐ `signed` (H1); kỳ thu `scheduled` (SM-07); hoa hồng `projected`.
- **Luồng chính**: (1) Lấy snapshot từ báo giá; (2) tạo HĐ (mã server cấp); (3) sinh danh sách kỳ: kỳ đầu = ngày vào ở, các kỳ sau theo chu kỳ, số tiền mỗi kỳ = (thuê + dịch vụ) × chu kỳ; (4) đặt mốc nhắc.
- **A1**: HĐ có số tiền thỏa thuận khác công thức → MGR sửa tay có lý do (H5).
- **Quy tắc**: BR-006, 007, 207, 208, 209, 212.

## UC-08 – Ghi nhận thu kỳ dài hạn
- **Tác nhân**: FD; SYS nhắc. **Tiền điều kiện**: kỳ thu chưa `paid`.
- **Luồng chính**: (1) Từ danh sách HĐ/"Cần chú ý" mở kỳ; (2) ghi giao dịch; (3) đủ → `paid`, xuất hóa đơn; kỳ đầu `paid` → hoa hồng đợt 1 đủ điều kiện.
- **A1**: thu một phần → hiển thị còn thiếu. **A2**: quá hạn → mốc cảnh báo BR-207, không khóa cửa.
- **Quy tắc**: BR-207, 212, 521, 524.

## UC-09 – Gia hạn / chấm dứt sớm hợp đồng
- **Tác nhân**: FD, SAL (đề xuất gia hạn), MGR. **Kích hoạt**: cảnh báo chào gia hạn BR-211 hoặc khách báo nghỉ.
- **Luồng gia hạn**: (1) Lập báo giá gia hạn theo tham số hiện hành; (2) kiểm thị thực khách NN đến ngày kết thúc mới; (3) kiểm trùng phần kéo dài; (4) xác nhận (MGR duyệt nếu SAL đề xuất); (5) bù ký quỹ nếu hệ số cao hơn; khai báo `needs_update`.
- **Luồng chấm dứt sớm**: (1) Ghi ngày báo, ngày nghỉ; (2) hệ thống tính mất ký quỹ và tiền thuê hoàn theo BR-313; (3) HĐ `terminating`; kỳ chưa bắt đầu `waived`; hoa hồng đợt chưa chi `void`; (4) ngày nghỉ → UC-20.
- **X1**: thị thực không đủ → cảnh báo đỏ, chỉ khai đến hạn thị thực (BR-605).
- **Quy tắc**: BR-211, 212, 313, 314, 605.

## UC-10 – Check-in online
- **Tác nhân**: GST. **Kích hoạt**: link check-in gửi trước ngày đến. **Tiền điều kiện**: đơn `confirmed`; link còn hạn.
- **Hậu điều kiện**: khai báo `pre`; giờ đến dự kiến; hồ sơ đồng ý theo mục đích.
- **Luồng chính**: (1) Mở link (không cài app, chọn VI/EN; RU từ R3); (2) đọc thông báo xử lý dữ liệu; (3) tải giấy tờ từng người (ảnh trang thông tin, thị thực, dấu nhập cảnh với NN); (4) chọn giờ đến dự kiến; (5) chọn đồng ý lưu ảnh (không tích sẵn, tách mục đích); (6) hoàn tất → thông báo mã cửa gửi theo BR-403.
- **A1**: khách không đồng ý lưu ảnh → vẫn hoàn tất (SEC R-REG-05). **A2**: đơn nhiều người → **một link cho đơn**; người đứng tên tải giấy tờ cho cả nhóm, mỗi người một mục trong cùng phiên (ADR-006, SR-GST-04). Link riêng cho từng người là ý tưởng R3 (đề xuất PO đưa backlog Could). **A3**: phiên check-in online ở mức GST1 (chỉ ghi): khách không xem lại được ảnh/số giấy tờ đã tải.
- **X1**: tệp sai loại/quá lớn → lỗi, tải lại. **X2**: link hết hạn/không đúng đơn → trang lỗi, hướng liên hệ lễ tân.
- **Quy tắc**: BR-403, 601, 606, 609; SEC R-CON-01, R-REG-08.

## UC-11 – Nhận phòng
- **Tác nhân**: FD (gồm người trực đêm), FDL (ngoại lệ). **Tiền điều kiện**: đơn `confirmed`, `conflict_state` khác `open`; **ngày nghiệp vụ hiện tại = ngày đến** (khách tới 00:00–05:59 của đơn ngày hôm trước vẫn hợp lệ); phiên chạy trên **thiết bị được cấp** mở admin-web (máy quầy hoặc máy tính bảng của cơ sở – phân xử ORC 15/10/2026).
- **Hậu điều kiện**: `in_house` (B9); buồng `OC`; giờ nhận; phụ thu (nếu có); mã cửa hiệu lực.
- **Luồng chính**: (1) Mở đơn từ "Khách đến"; (2) kiểm buồng; (3) giấy tờ người đứng tên đã có (UC-12); (4) thu phần còn lại hoặc xác nhận OTA đã trả; (5) giờ nhận mặc định giờ chuẩn; (6) bấm Nhận phòng; (7) nhập/giao mã cửa, số thẻ; gửi nội quy.
- **A1**: buồng chưa `VI`/`VC` → FDL+ xác nhận lý do. **A2**: giờ nhận sớm → hệ thống đề xuất phụ thu theo bậc BR-411 (dài hạn BR-413); FD xác nhận; FOC → UC-27. **A3**: ngày nghiệp vụ = ngày đến − 1 (khách tới 00:00–05:59 của ngày đến) → **B9a Thêm đêm trước**: kiểm căn trống đêm trước; đơn Trực tiếp/CTV thêm 1 đêm đầu đơn; đơn OTA tạo đơn con kênh Trực tiếp đi thẳng `in_house`; giá BR-411; căn không trống → không nhận, gợi ý gửi hành lý. **A4**: người trực đêm chỉ có điện thoại cá nhân (PWA) → không nhận phòng được; dùng máy quầy hoặc thiết bị di động của cơ sở đã được cấp (SR-DEV-08/09). Không có người trực và khách chưa GST2 → gọi số trực đêm của quản lý (SR-GST-15). **A5**: mất mạng → UC-33.
- **X1**: còn phải thu → chặn. **X2**: thiếu giấy tờ người đứng tên → chặn giao mã cửa. **X3**: đơn chưa gán căn → chặn: "Đơn chưa có căn. Gán căn trước khi nhận phòng." **X4**: thiết bị chưa được cấp → chặn: "Nhận phòng chỉ làm trên máy của cơ sở đã được cấp quyền."
- **Quy tắc**: BR-003, 401, 402, 403, 411, 413, 414, 422.

## UC-12 – Nhập giấy tờ và khai báo lưu trú
- **Tác nhân**: FD. **Tiền điều kiện**: bản ghi khai báo của đơn tồn tại (BR-608).
- **Hậu điều kiện**: khai báo `confirmed` trước hạn; ảnh áp hạn lưu hoặc xóa.
- **Luồng chính**: (1) Danh sách "Cần khai báo" với hạn tính theo BR-602/603; (2) nhập/đối chiếu giấy tờ từng người; trẻ em theo BR-612; (3) đối chiếu tự động; xử lý cảnh báo; (4) ghi đồng ý lưu ảnh có/không → `scanned`; (5) chọn loại khai báo; sao chép dữ liệu (máy quầy); tự đăng nhập cổng; dán mã hồ sơ → `sent`; (6) xác nhận → `confirmed`.
- **A1**: dữ liệu `pre` từ khách → chỉ đối chiếu. **A2**: thêm người giữa chừng / gia hạn / trả sớm / trả phòng NN → `needs_update` → cập nhật → `updated`. **A3**: cổng từ chối → `scanned`, khai lại.
- **X1**: hạn hộ chiếu ≤ ngày trả, thị thực hết trước ngày trả → cảnh báo đỏ (không chặn nhận phòng). **X2**: sắp/quá hạn → "Cần chú ý", nhắc người trực.
- **Quy tắc**: BR-601–612; SEC R-REG-01…12.
- **Hạn khai báo**: VN theo BR-602; NN = giờ nhận thực tế + số giờ BR-603, không áp mốc 23:00 (decision-log DOM 15/10/2026) `[GIẢ ĐỊNH – chờ luật sư qua ESC-001]`. Mọi bước giấy tờ chỉ trên thiết bị được cấp.

## UC-13 – Gia hạn lưu trú
- **Tác nhân**: FD; GST yêu cầu (R3 tự phục vụ). **Tiền điều kiện**: đơn `in_house`.
- **Luồng chính**: (1) Hệ thống liệt kê đêm liên tiếp còn trống (tối đa BR-421); (2) chọn số đêm; (3) giá mặc định BR-421; (4) xác nhận; (5) đơn OTA → đơn con Trực tiếp (BR-422); (6) thu tiền BR-423.
- **A1**: vượt giới hạn → UC-06. **X1**: đêm vừa bị đặt → từ chối.
- **Quy tắc**: BR-105, 421, 422, 423, 604, 802, 905.

## UC-14 – Nhắc trả phòng và đặt trả muộn
- **Tác nhân**: SYS, FD, GST. **Tiền điều kiện**: đơn `in_house` có ngày đi = ngày mai/hôm nay.
- **Luồng chính**: (1) SYS gửi nhắc theo mốc BR-425; (2) khách chọn; (3) thẻ "chưa trả" đổi trạng thái theo giờ thật; (4) FD ghi giờ trả xác nhận hoặc đặt trả muộn: phụ thu theo bậc BR-412 (dài hạn BR-413), kiểm khách đến cùng ngày BR-416.
- **A1**: trả muộn quá mốc 100% → UC-13. **A2**: có khách đến và không có căn thay thế → chặn, MGR duyệt nếu có phương án.
- **Quy tắc**: BR-412, 413, 414, 416, 425.

## UC-15 – Gửi và xử lý yêu cầu khách
- **Tác nhân**: GST; FD, HK, MT. **Luồng chính**: (1) Khách chọn loại + ghi chú; (2) định tuyến BR-811; (3) bộ phận "Đã nhận" trong thời hạn; (4) tạo việc/phiếu; (5) xong → khách thấy "Hoàn thành"; phát sinh có phí ghi folio.
- **A1**: ngoài giờ trực → trả lời tự động. **X1**: quá thời hạn chưa nhận → báo FD.
- **Quy tắc**: BR-506, 507, 809, 811.

## UC-16 – Đổi phòng
- **Tác nhân**: FD. **Luồng chính**: (1) Chọn căn trống `VI`/`VC`; (2) lý do (sự cố OTTIMO / khách yêu cầu); (3) giá theo BR-424; (4) xác nhận: kiểm trùng; căn cũ → `VD`/`OD`; mã cửa mới; khai báo không khai lại.
- **X1**: căn mới không sạch/OOO → chặn.
- **Quy tắc**: BR-403, 424, 906.

## UC-17 – Thêm phát sinh vào folio
- **Tác nhân**: FD; HK qua kiểm minibar. **Luồng chính**: (1) Chọn mục từ danh mục (giặt ủi, dọn lẻ, phí phạt, hư hỏng, minibar); giá mặc định theo BR; (2) số lượng, ghi chú, ảnh bằng chứng với phạt/hư hỏng; (3) lưu – nhật ký.
- **A1**: món hư hỏng ngoài bảng → MGR định giá (UC-27). **X1**: phạt thiếu bằng chứng → chặn lưu.
- **Quy tắc**: BR-008, 506, 507, 511, 512, 702.

## UC-18 – Trả phòng 3 bước + bill (ngắn ngày)
- **Tác nhân**: FD. **Tiền điều kiện**: đơn `in_house`. **Hậu điều kiện**: `checked_out` (B18), bill khóa, buồng `VD`, việc dọn + bổ sung minibar, hóa đơn điện tử.
- **Luồng chính**: Bước 1 minibar → Bước 2 phụ phí + giờ trả + FOC + cách thanh toán → Bước 3 bill (VI/EN, USD tham khảo) → ghi giao dịch → thông tin hóa đơn công ty (tùy chọn) → Hoàn tất.
- **A1**: công nợ (MGR). **A2**: đơn OTA thu hộ → chỉ thu phát sinh. **A3**: "← Sửa lại" quay bước trước khi hoàn tất.
- **X1**: còn phải thu > 0 → chặn. **X2**: FOC chờ duyệt → chặn. **X3**: MST sai → lỗi tại ô.
- **Quy tắc**: BR-004, 007, 307, 412, 414, 426, 434, 521, 523, 524, 525, 702.

## UC-19 – Trả phòng nhanh qua app
- **Tác nhân**: GST. **Tiền điều kiện**: `in_house`, ngày đi = hôm nay, còn phải thu = 0.
- **Luồng chính**: (1) Khách bấm "Trả phòng"; (2) xác nhận để lại thẻ; (3) `checked_out`; bill gửi email/Zalo; (4) HK kiểm sau; phát sinh → link thanh toán trong thời hạn BR-427.
- **X1**: còn phải thu > 0 → hướng khách thanh toán (R3) hoặc đợi lễ tân.
- **Quy tắc**: BR-427.

## UC-20 – Trả phòng dài hạn và quyết toán ký quỹ
- **Tác nhân**: FD, MT/HK, MGR. **Tiền điều kiện**: HĐ `active`/`terminating`.
- **Luồng chính**: chốt công tơ ngày trả → kiểm phòng có ảnh → bảng quyết toán (ngày lẻ, điện nước kỳ cuối, phát sinh, phạt − ký quỹ) → hoàn tất trả phòng → MGR duyệt → thu thêm hoặc hoàn trong hạn BR-214 → HĐ `closed`.
- **X1**: thiếu biên bản ảnh → không cho khấu trừ. **X2**: hoàn quá hạn → "Cần chú ý".
- **Quy tắc**: BR-210, 214, 502, 511, 522.

## UC-21 – Chốt công tơ điện nước
- **Tác nhân**: MT, FD; MGR duyệt bất thường. **Luồng chính**: danh sách căn cần chốt → nhập 2 chỉ số + ảnh → kiểm hợp lệ → tính tiền → hóa đơn tháng hiện trong app khách.
- **X1**: mới < cũ → chặn, lý do + MGR duyệt. **X2**: bất thường → cảnh báo kiểm tra trước khi gửi. **X3**: thiếu ảnh → chặn.
- **Quy tắc**: BR-501–504.

## UC-22 – Dọn phòng và đổi trạng thái buồng
- **Tác nhân**: HK. **Luồng chính**: danh sách việc theo ưu tiên → Bắt đầu dọn (`CL`) → kiểm minibar (phòng có khách) → Dọn xong (`OC`/`VC`) → việc tự xong.
- **A1**: khách từ chối dọn → hủy việc có lý do. **A2**: mất mạng → lưu và gửi lại (US-058). **X1**: chuyển không hợp lệ → server từ chối.
- **Quy tắc**: BR-703, 801, 802, 807.

## UC-23 – Kiểm phòng
- **Tác nhân**: FDL, MGR; HK khi cơ sở bật "tự kiểm". **Luồng chính**: chọn căn `VC` → checklist đủ mục + ảnh → Đạt (`VI`) hoặc Không đạt (trả việc dọn).
- **X1**: thiếu mục checklist → không cho Đạt.
- **Quy tắc**: BR-802, 805, 808.

## UC-24 – Phiếu sửa chữa và khóa phòng
- **Tác nhân**: MT, FD, HK (tạo). **Luồng chính**: tạo phiếu (căn, mô tả, ảnh, mức) → tùy chọn khóa phòng với khoảng ngày → nhận phiếu → xử lý/chờ vật tư → xong → mở khóa, buồng `VD`.
- **A1**: căn đang có khách → đổi phòng trước (UC-16). **A2**: khoảng khóa trùng đơn tương lai → danh sách đơn cần dời. **A3**: mức Cao quá thời hạn phương án → gợi ý đổi phòng + FOC.
- **X1**: thiếu mô tả → chặn.
- **Quy tắc**: BR-804, 809, 811, 905.

## UC-25 – Bảo trì định kỳ
- **Tác nhân**: MT. **Luồng chính**: danh sách việc định kỳ với hạn → hoàn thành → hệ thống sinh kỳ kế tiếp (BR-810); việc cần khóa phòng → khối OOO `planned`.
- **Quy tắc**: BR-804, 810.

## UC-26 – Ghi nhận và chi hoa hồng
- **Tác nhân**: SYS; OWN/MGR chi; SAL/CTV xem của mình. **Luồng chính**: `projected` → `earned` theo điều kiện BR-212/903 → `payable` → OWN/MGR đánh dấu `paid`.
- **A1**: hủy/no-show/chấm dứt sớm → `void`. **X1**: CTV mở hoa hồng người khác → từ chối.
- **Quy tắc**: BR-212, 903.

## UC-27 – Gửi và duyệt FOC / ngoại lệ
- **Tác nhân**: người gửi (FD, FDL, SAL, MT); người duyệt (FDL, MGR, OWN). **Luồng chính**: gửi yêu cầu + lý do → hệ thống chọn người duyệt theo loại và hạn mức BR-433 → người duyệt xác nhận bằng PIN của chính mình → folio dòng phát sinh + dòng FOC âm.
- **A1**: tự áp trong hạn mức (MGR/OWN theo BR-433; FD/FDL chỉ FOC minibar trong hạn mức lần + hạn mức tháng tự áp, PIN của mình – DOM SQ-3); vượt hạn mức tháng → gửi duyệt FDL+ khác người gửi. **A2**: vượt hạn mức → chuyển cấp trên. **A3**: từ chối có lý do.
- **X1**: người duyệt = người gửi → từ chối. **X2**: PIN sai → không duyệt.
- **Quy tắc**: BR-431–435, 522.

## UC-28 – Đăng nhập và truy cập theo vai
- **Tác nhân**: mọi nhân viên; OWN (quản trị). **Luồng chính**: (1) đăng nhập tài khoản riêng (mỗi người một tài khoản, cấm dùng chung – rbac 8.8); (2) lần đầu với mật khẩu tạm → buộc đổi mật khẩu; (3) OWN/MGR: nhập mã 2FA TOTP (bắt buộc trước dữ liệu thật – R3, SR-AUTH-06); (4) hệ thống ghi nhận thiết bị: được cấp (admin-web) hay không (PWA/thiết bị lạ) – quyết định có mở C3 không; (5) vào màn mặc định theo vai (rbac mục 1: FD/FDL = Hôm nay); menu, nút, trường theo ma trận.
- **A1**: đổi ca trên máy quầy → "Đổi người nhanh" (A117): đăng xuất người cũ, đăng nhập người mới; ca SM-17 gắn người mới. **A2**: OWN khóa/đổi vai/đặt lại mật khẩu → mọi phiên của người đó hết hiệu lực ngay. **A3**: OWN mất mật khẩu/2FA → khôi phục bằng mã khôi phục in sẵn do INV giữ (A116, runbook OPS). **A4**: đặt/đổi PIN duyệt của mình (A112).
- **X1**: mở trực tiếp đường dẫn không được phép → từ chối + nhật ký. **X2**: phiên hết hạn (admin-web 30 phút không hoạt động, tối đa 12 giờ; PWA 72 giờ, tối đa 30 ngày) → về đăng nhập. **X3**: sai mật khẩu quá số lần SEC quy định (SR-AUTH) → khóa tạm, báo OWN. **X4**: mở chức năng C3 từ thiết bị chưa cấp → `DEVICE_NOT_TRUSTED`, hướng dẫn dùng máy quầy.
- **Quy tắc**: `rbac-matrix.md` mục 8.

## UC-29 – Xem ảnh giấy tờ và xóa theo hạn
- **Tác nhân**: FD, FDL, MGR, OWN; SYS. **Luồng chính**: mở ảnh từ màn khai báo (chỉ thiết bị được cấp) → ghi nhật ký C3 (lý do theo rbac ghi chú 30: không cần trong luồng đang mở của chính đơn; các lần khác chọn lý do, xác nhận lại PIN nếu > 15 phút) → SYS xóa ảnh khi hết hạn BR-610 hoặc ngay sau khai báo nếu khách không đồng ý (BR-609).
- **A1**: khách yêu cầu xóa sớm → MGR xóa, ghi nhật ký. **X1**: vai không được phép → trường không trả về.
- **Quy tắc**: BR-609, 610; SEC mục 7.

## UC-30 – Yêu cầu của chủ thể dữ liệu
- **Tác nhân**: GST gửi (mức GST2); MGR/OWN xử lý. **Luồng chính**: khách gửi yêu cầu (xem, sửa, xóa, rút đồng ý, nhận bản sao) qua app/quầy → MGR xác minh danh tính → xử lý trong thời hạn luật (SEC R-DSR-02) → trả lời rõ phần không xóa được do luật buộc lưu. Bản sao dữ liệu của **một** chủ thể (A77) giao qua app khách mức 2, không đính kèm email, ghi `c3_access_log` – không vi phạm A75 (cấm xuất nhiều người).
- **Story**: US-133, US-134.

## UC-31 – Đơn nhóm (đoàn nhiều căn)
- **Tác nhân**: FD, SAL, CTV (khách của mình). **Kích hoạt**: khách đặt ≥ 2 căn cho một đoàn/gia đình. **Tiền điều kiện**: báo giá nhiều căn `active`, hoặc các đơn đã có cùng khách đầu mối.
- **Hậu điều kiện**: nhóm `open` (SM-16); mỗi căn một đơn SM-01 có `group_id`; cọc chung phân bổ theo căn.
- **Luồng chính**: (1) báo giá nhiều căn; (2) "Tạo giữ chỗ cho nhóm" → mỗi căn một đơn `hold` (căn trùng báo riêng, căn khác vẫn tạo); (3) khách chuyển một khoản cọc (nội dung = mã nhóm); (4) FD/SAL ghi giao dịch nhóm, hệ thống đề xuất phân bổ theo tỷ lệ tiền phòng, FD sửa nếu cần; đơn đủ mức cọc → `confirmed`; (5) cập nhật danh sách khách từng căn trước ngày đến; (6) nhận/trả từng căn; (7) khi trả phòng chọn bill gộp hoặc bill tách.
- **A1**: hủy một căn → phí/hoàn theo BR-309 trên phần cọc của căn đó; phần hoàn giữ làm cọc các căn còn lại nếu khách đồng ý. **A2**: một căn ở thêm → gia hạn riêng đơn đó. **A3**: đơn OTA nhiều phòng → gom nhóm theo mã OTA.
- **X1**: tổng phân bổ ≠ số tiền giao dịch → chặn lưu. **X2**: CTV phân bổ cọc → từ chối (rbac ghi chú 36).
- **Quy tắc**: BR-110, 302, 305, 309, 523, 906; quy tắc đoàn DOM bổ sung.

## UC-32 – Đóng ca và đối soát chuyển khoản
- **Tác nhân**: FD/FDL (chủ ca); MGR (đối soát, xem chênh lệch). **Kích hoạt**: hết ca/bàn giao; đối soát hằng ngày. **Tiền điều kiện**: ca `open` của chính người đó.
- **Hậu điều kiện**: ca `closed`; việc tồn chuyển ca sau; chuyển khoản `reconciled`/`disputed`.
- **Luồng chính**: (1) Đóng ca → báo cáo ca (thu theo cách thanh toán, tiền mặt phải có, chuyển khoản chờ đối soát, FOC tự áp, khôi phục no-show, nhập bù); (2) nhập tiền mặt đếm thực tế; (3) chênh lệch → lý do; (4) xem việc tồn; (5) xác nhận đóng ca. MGR: mở danh sách chuyển khoản `pending` → so sao kê → tick `reconciled` hoặc `disputed`.
- **A1**: người trực đêm một mình → đóng ca khi bàn giao buổi sáng. **A2**: quên đóng ca → "Cần chú ý" cho MGR. **A3**: R3 bank feed tự đối soát.
- **X1**: chưa nhập tiền mặt → chặn đóng ca. **X2**: tự đối soát giao dịch mình ghi (trừ OWN) → từ chối.
- **Quy tắc**: BR-008, 521, 526 (DOM bổ sung). **Story**: US-124 (đề xuất PO nâng Must R3 theo DOM-PO-06, thêm story đối soát).

## UC-33 – Vận hành khi mất mạng / mất điện
- **Tác nhân**: FD, MGR. **Kích hoạt**: quầy mất mạng/mất điện. **Tiền điều kiện**: danh sách dự phòng của ngày đã sinh (06:00).
- **Luồng chính**: (1) thử 4G của cơ sở; (2) không được → chế độ giấy: ghi sổ dự phòng (giờ thực tế, căn, khách, tiền, người làm); (3) không nhận đơn mới khi chưa xem được tồn phòng; (4) có mạng lại → nhập bù từng việc theo thứ tự thời gian với giờ thực tế + lý do "nhập bù sau mất mạng"; (5) hệ thống kiểm trùng, đối soát kênh, báo MGR.
- **A1**: đơn OTA về trong lúc mất mạng trùng việc nhập bù → xử lý như xung đột (UC-04b).
- **X1**: nhập bù không có lý do → chặn. **X2**: giờ thực tế quá mốc `offline_backfill_max_hours` → cần MGR+.
- **Quy tắc**: BR-402, 414, 603, 905, 906. Phần kỹ thuật bản đọc offline: ARC/UXD.

## Lịch sử thay đổi
| Ngày | Round | Thay đổi | Người |
|---|---|---|---|
| 15/10/2026 | 1 (đợt 2) | Bản đầu: 30 use case, truy vết P/SM/BR/US | BA |
| 15/10/2026 | 1 (bước 4) | Ngày nghiệp vụ; UC-04 A2/X1 tách theo kênh + UC-04b gán căn; UC-05 A3 khôi phục no-show theo SQ-1; UC-10 A2 một link/đơn; UC-11 thiết bị được cấp, B9a, chặn đơn chưa gán; UC-12 hạn khai báo NN; UC-27 FOC tự áp; UC-28 2FA, đổi mật khẩu lần đầu, khóa, đổi người nhanh, thu hồi phiên; UC-30 → US-133/134; thêm UC-31 đơn nhóm, UC-32 đóng ca, UC-33 mất mạng | BA |
