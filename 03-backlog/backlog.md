# Product Backlog – OTTIMO Desk

- Chủ sở hữu: PO | Cập nhật: 15/10/2026 – Round 1, bước 2, đợt 1 (**bản đầu**)
- Nguồn: `product/docs/PRD.md` (phân hệ M0–M15), `product/docs/round-0-baseline.md` (**BL**), `00-brief/investor-brief.md` (**Brief**).
- Trạng thái chung: chờ review BA, DOM (bắt buộc). Tiêu chí nghiệm thu (AC) sẽ hoàn thiện ở **đợt 3** sau khi có `business-rules.md` (DOM) và `use-cases.md` (BA): khi đó mọi con số trong AC được thay bằng **mã BR-xxx**. Ở bản này AC đã viết cho **toàn bộ story Must của Round 2** (mục 3), con số ghi "(mặc định BL x.y)" là giá trị mặc định cấu hình được `[GIẢ ĐỊNH – chờ INV xác nhận]`.

## 1. Quy ước

| Cột | Ý nghĩa |
|---|---|
| ID | `US-xxx`, không tái sử dụng khi xóa |
| Vai | U1 Chủ đầu tư/Quản lý · U2 Lễ tân · U3 Buồng phòng/Bảo trì · U4 CTV/Sale · U5 Khách (PRD mục 4) |
| MoSCoW | **Must** = bắt buộc cho bản RC cuối R3 · **Should** = nên có, dời được nếu thiếu thời gian · **Could** = làm nếu dư · **Won't** = không làm trong MVP (xem PRD 5.3) |
| Round | Round dự kiến giao (R2, R3, R4+ = sau MVP) |
| Nguồn | Mục BL / Brief / decision-log làm căn cứ; "Mới" = không có trong BL, đội đề xuất |
| Trạng thái | Mới · Sẵn sàng (đủ AC, đã review) · Đang làm · Xong · Dời |

Thứ tự ưu tiên trong R2 nếu thiếu thời gian (PRD D6): EP00 → EP02/EP11 (đơn, chống trùng, giữ chỗ) → EP03–EP05 → EP06 → EP07/EP08 → EP14 → phần còn lại.

## 2. Danh sách epic

| Epic | Tên | Phân hệ PRD | Số story | Must R2 |
|---|---|---|--:|--:|
| EP00 | Nền tảng: đăng nhập, phân quyền, cấu hình, nhật ký, phê duyệt | M0 | 9 | 7 |
| EP01 | Tổng quan (dashboard) | M1 | 6 | 3 |
| EP02 | Room rack & đặt phòng | M2 | 9 | 8 |
| EP03 | Nhận phòng | M2 | 3 | 3 |
| EP04 | Lưu trú: gia hạn, trả muộn, nhắc trả phòng, phát sinh | M2, M6 | 7 | 5 |
| EP05 | Trả phòng & bill | M2, M6, M12 | 7 | 5 |
| EP06 | Giấy tờ & khai báo lưu trú | M3 | 10 | 9 |
| EP07 | Buồng phòng | M4 | 9 | 6 |
| EP08 | Bảo trì & điện nước | M5 | 5 | 2 |
| EP09 | Kho F&B / minibar | M6 | 5 | 1 |
| EP10 | Khách hàng (CRM) | M7 | 9 | 3 |
| EP11 | Sale, báo giá, giữ chỗ, hợp đồng dài hạn | M8 | 14 | 8 |
| EP12 | Kênh OTA & channel manager | M9 | 6 | 0 |
| EP13 | Báo cáo | M10 | 6 | 0 |
| EP14 | App khách | M11 | 13 | 7 |
| EP15 | Thanh toán & hóa đơn điện tử | M12 | 6 | 2 |
| EP16 | Giao tiếp với khách (mẫu tin đa ngôn ngữ) | M13 | 3 | 1 |
| EP17 | Khóa cửa & thẻ phòng | M14 | 3 | 1 |
| EP18 | Đặt phòng trực tiếp trên web | M15 | 2 | 0 |
| | **Tổng** | | **132** | **71** |

## 3. User story

### EP00 – Nền tảng
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-001 | Là **nhân viên OTTIMO** (U1–U4), tôi muốn đăng nhập bằng tài khoản riêng, để mọi thao tác được ghi đúng người làm | Must | R2 | BL 2, BL 7 | Mới |
| US-002 | Là **chủ đầu tư**, tôi muốn gán vai (chủ đầu tư, quản lý, lễ tân, buồng phòng/bảo trì, CTV/sale) cho từng tài khoản, để mỗi người chỉ thấy và làm đúng phần việc của mình | Must | R2 | BL 2, BL 8.2 #27, decision-log 15/10 (4 nhóm) | Mới |
| US-003 | Là **chủ đầu tư**, tôi muốn dữ liệu nhạy cảm (giấy tờ tùy thân, giá vốn, P&L, hoa hồng người khác) bị ẩn với vai không được phép ở mọi màn hình, để tránh lộ thông tin và thất thoát | Must | R2 | BL 2 (mâu thuẫn quyền), BL 8.2 #27, BL 5.13 | Mới |
| US-004 | Là **chủ đầu tư**, tôi muốn quản lý danh mục căn (số, tên, nhóm, giá niêm yết đêm/tháng, sức chứa, trạng thái bán), để sơ đồ phòng và giá luôn đúng thực tế | Must | R2 | BL 4.1, BL 9 #1, #5 | Mới |
| US-005 | Là **chủ đầu tư**, tôi muốn tự chỉnh bảng tham số quy tắc (giảm giá, phụ thu, cọc, hạn giữ chỗ, giờ chuẩn, đơn giá điện nước, phí phạt, hoa hồng), để đổi chính sách mà không cần lập trình viên | Must | R2 | BL 5 (toàn bộ), BL 4.17, decision-log 15/10 (số quy tắc cấu hình được) | Mới |
| US-006 | Là **chủ đầu tư**, tôi muốn xem nhật ký mọi thao tác liên quan tới tiền (folio, giảm giá, FOC, hủy, thu tiền) với người làm, thời điểm, giá trị cũ/mới, để kiểm soát thất thoát | Must | R2 | BL 5.7, BL 8.2 #24 | Mới |
| US-007 | Là **quản lý / lễ tân trưởng**, tôi muốn tự xác nhận các khoản FOC/giảm giá cần duyệt bằng chính tài khoản của mình (không để người thao tác chọn tên người duyệt), để việc miễn phí có người chịu trách nhiệm thật | Must | R2 | BL 5.7, BL 8.2 #24, BL 9 #8 | Mới |
| US-008 | Là **chủ đầu tư**, tôi muốn tự thêm, khóa tài khoản và đặt lại mật khẩu cho nhân viên, để không phụ thuộc đội kỹ thuật khi nhân sự thay đổi | Should | R3 | Mới | Mới |
| US-009 | Là **chủ đầu tư**, tôi muốn chọn cơ sở khi đăng nhập, để sau này quản lý thêm cơ sở thứ hai trên cùng app | Could | R4+ | BL 9 #24, decision-log (đa cơ sở thiết kế sẵn) | Mới |

### EP01 – Tổng quan
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-010 | Là **chủ đầu tư / lễ tân**, tôi muốn thấy KPI đêm nay (công suất, số căn đang ở, khách đến, khách đi, căn khóa) tính từ dữ liệu thật, để nắm tình hình trong 5 giây | Must | R2 | BL 3.2, BL 8.2 #8, #28, #29 | Mới |
| US-011 | Là **lễ tân**, tôi muốn danh sách khách đến/đi hôm nay có nút Nhận phòng/Trả phòng và không lẫn đơn hủy hoặc giữ chỗ, để xử lý đúng việc trong ngày | Must | R2 | BL 3.2, BL 8.2 #7 | Mới |
| US-012 | Là **chủ đầu tư / lễ tân**, tôi muốn mục "Cần chú ý" tự sinh từ dữ liệu (chưa khai báo lưu trú, thị thực sắp hết, kỳ thu dài hạn sắp tới, hợp đồng sắp hết hạn, giữ chỗ sắp hết hạn, căn khóa, phiếu sửa mức Cao), để không bỏ sót việc quan trọng | Must | R2 | BL 3.2, BL 8.2 #28, BL 5.20 | Mới |
| US-013 | Là **lễ tân**, tôi muốn thấy số việc buồng phòng chưa xong, phiếu sửa đang mở, yêu cầu khách chưa xử lý và bấm vào để mở đúng màn hình, để điều phối nhanh | Should | R2 | BL 3.2 | Mới |
| US-014 | Là **chủ đầu tư**, tôi muốn xem ADR, RevPAR tháng và biểu đồ công suất 30 ngày qua + 14 ngày tới so với mục tiêu 80%, để biết cần đẩy bán hay không | Should | R3 | BL 3.2, Brief 1 | Mới |
| US-015 | Là **chủ đầu tư**, tôi muốn được cảnh báo khi công suất dự kiến hoặc số căn dài hạn lệch mục tiêu, để hành động sớm | Could | R4+ | BL 9 #25 | Mới |

### EP02 – Room rack & đặt phòng
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-016 | Là **lễ tân**, tôi muốn xem sơ đồ phòng 10 căn × 14 ngày với thanh đơn phân biệt loại (đang ở, đã xác nhận, dài hạn, giữ chỗ, đã trả, khóa) bằng cả màu và chữ, để thấy ngay phòng trống | Must | R2 | BL 3.3a, BL 8.3 | Mới |
| US-017 | Là **lễ tân**, tôi muốn tạo đơn ngắn ngày (căn, kênh, ngày đến, số đêm, số khách, giá/đêm, mã OTA, đã thu qua OTA hay chưa), để mọi đơn – kể cả đơn OTA – nằm ở một nơi | Must | R2 | BL 3.5, BL 8.2 #26 | Mới |
| US-018 | Là **lễ tân**, tôi muốn hệ thống chặn đặt trùng căn – đêm ngay cả khi hai người lưu cùng lúc, để không bao giờ phải đuổi khách vì trùng phòng | Must | R2 | BL 5.4, BL 8.2 #30 | Mới |
| US-019 | Là **lễ tân**, tôi muốn căn đang khóa (OOO) bị coi là không bán được trên sơ đồ, khi kiểm trùng và khi tính phòng trống, để không nhận khách vào phòng hỏng | Must | R2 | BL 8.2 #5 | Mới |
| US-020 | Là **lễ tân**, tôi muốn mở chi tiết đơn thấy tiến trình, thông tin khách, folio và chỉ những nút hành động hợp lệ với trạng thái đơn và vai của tôi, để không thao tác nhầm | Must | R2 | BL 3.4, BL 8.2 #27 | Mới |
| US-021 | Là **lễ tân / sale**, tôi muốn hủy đơn hoặc hủy giữ chỗ với lý do bắt buộc (và phí hủy nếu chính sách có), để có dấu vết và mở lại phòng ngay | Must | R2 | BL 3.18, BL 8.2 #23, BL 9 #6 | Mới |
| US-022 | Là **lễ tân**, tôi muốn thêm người đi cùng (người lớn có hồ sơ, trẻ em có năm sinh) vào đơn và được cảnh báo khi số người khai ít hơn số khách, để khai báo lưu trú đủ người | Must | R2 | BL 3.4, BL 3.17 | Mới |
| US-023 | Là **lễ tân**, tôi muốn mỗi mã đơn, mã khách, mã phiếu, số bill là duy nhất và không đổi, để tra cứu và đối soát không nhầm | Must | R2 | BL 8.2 #18 | Mới |
| US-024 | Là **lễ tân**, tôi muốn đổi căn hoặc đổi ngày của đơn (có kiểm trùng và ghi lý do), để xử lý khi khách đổi kế hoạch hoặc phòng có sự cố | Should | R2 | Mới (BL không có) | Mới |

### EP03 – Nhận phòng
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-025 | Là **lễ tân**, tôi muốn nhận phòng cho khách (ghi giờ thực tế, cảnh báo nếu buồng chưa sẵn sàng), để đơn chuyển "đang ở" và buồng chuyển "có khách" đúng lúc | Must | R2 | BL 3.6, BL 5.15 | Mới |
| US-026 | Là **lễ tân**, tôi muốn phụ thu nhận sớm tự tính theo bậc giờ và không tự phát sinh phí khi tôi chưa nhập giờ, để thu đúng mà không làm khách khó chịu | Must | R2 | BL 5.6, BL 8.2 #2 | Mới |
| US-027 | Là **lễ tân**, tôi muốn phụ thu nhận sớm/trả muộn của khách dài hạn được tính trên giá đêm quy đổi (không phải giá tháng), để không tính nhầm hàng triệu đồng | Must | R2 | BL 5.6, BL 8.2 #1, BL 9 #7 | Mới |

### EP04 – Lưu trú
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-028 | Là **lễ tân**, tôi muốn gia hạn đơn trong số đêm liên tiếp còn trống (tối đa theo tham số), có giá mặc định theo quy tắc và ghi dòng "thu trực tiếp" với đơn OTA, để bán thêm đêm mà không mất phí kênh | Must | R2 | BL 3.9, BL 5.8, BL 8.2 #12, #13 | Mới |
| US-029 | Là **lễ tân**, tôi muốn đặt trả muộn với phụ thu theo bậc giờ, được cảnh báo nếu có khách đến căn đó cùng ngày, và miễn phí (FOC) khi có người duyệt, để linh hoạt mà không ảnh hưởng khách sau | Must | R2 | BL 3.10, BL 5.6, BL 5.7, BL 8.2 #4 | Mới |
| US-030 | Là **lễ tân**, tôi muốn ghi giờ trả phòng khách xác nhận và nhật ký các lần nhắc, để cả ca biết khách nào đã trả lời | Must | R2 | BL 3.10, BL 4.15 | Mới |
| US-031 | Là **lễ tân**, tôi muốn thẻ "Khách trả phòng hôm nay chưa trả" đổi trạng thái theo giờ thật (chờ trả lời → cần gọi → quá giờ), để biết lúc nào phải gọi khách | Must | R2 | BL 3.3b, BL 5.9 | Mới |
| US-032 | Là **lễ tân**, tôi muốn thêm dòng phát sinh vào folio (giặt ủi, đồ ăn, hư hỏng, phí phạt như khử mùi thuốc lá, làm lại thẻ phòng) từ danh mục có giá mặc định, để bill cuối không thiếu khoản nào | Must | R2 | BL 3.7, Brief 5 (phí phạt thực tế) | Mới |
| US-033 | Là **buồng phòng / lễ tân**, tôi muốn kiểm minibar giữa kỳ cho khách đang ở và ghi tiền vào folio ngay, để không dồn hết vào lúc trả phòng | Should | R2 | BL 3.13 | Mới |
| US-034 | Là **lễ tân**, tôi muốn hệ thống tự gửi nhắc trả phòng cho khách theo các mốc giờ (tối hôm trước, sáng ngày trả) và nhận lựa chọn của khách (trả đúng giờ / ở thêm / trả muộn), để giảm cuộc gọi | Should | R3 | BL 5.9, BL 7 | Mới |

### EP05 – Trả phòng & bill
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-035 | Là **lễ tân**, tôi muốn bước 1 trả phòng là kiểm minibar (nhập số còn lại, tự tính số đã dùng và tiền, đồ miễn phí không tính tiền), để thu đúng đồ khách dùng | Must | R2 | BL 3.7, BL 5.14 | Mới |
| US-036 | Là **lễ tân**, tôi muốn bước 2 nhập phụ phí, giờ trả thực tế (tự tính phụ thu trả muộn), FOC và cách thanh toán, để chốt mọi khoản trước khi in bill | Must | R2 | BL 3.7, BL 5.6, BL 5.7 | Mới |
| US-037 | Là **lễ tân**, tôi muốn bước 3 xem bill đúng công thức (tiền phòng từng đêm, phát sinh, minibar, phụ thu, dòng FOC âm, trừ đã cọc, còn phải thu), song ngữ Việt – Anh và quy đổi USD tham khảo cho khách nước ngoài, để khách hiểu và trả tiền ngay | Must | R2 | BL 3.8, BL 5.20 | Mới |
| US-038 | Là **lễ tân**, tôi muốn bấm "hoàn tất" để đơn chuyển "đã trả", buồng chuyển "cần dọn", tự tạo việc dọn và bổ sung minibar, bill bị khóa không sửa được (chỉ điều chỉnh có ghi vết), để không còn việc làm tay sau khi khách đi | Must | R2 | BL 3.7, BL 5.15 | Mới |
| US-039 | Là **lễ tân**, tôi muốn ghi thông tin xuất hóa đơn GTGT cho công ty (tên, MST, email) ngay trong bước trả phòng, để phát hành hóa đơn đúng | Must | R2 | BL 3.7, BL 5.16 (MST), BL 5.20 | Mới |
| US-040 | Là **lễ tân**, tôi muốn in bill, xuất PDF và gửi bill qua email/Zalo, để khách có chứng từ ngay | Should | R3 | BL 3.8, BL 7 | Mới |
| US-041 | Là **lễ tân**, tôi muốn trả phòng cho khách dài hạn với tiền thuê/điện nước kỳ cuối và khấu trừ hoặc hoàn ký quỹ theo chính sách, để kết thúc hợp đồng đúng tiền | Must | R3 | BL 8.2 #6, BL 9 #9 | Mới |

### EP06 – Giấy tờ & khai báo lưu trú
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-042 | Là **lễ tân**, tôi muốn danh sách khách cần khai báo kèm hạn ("khi nhận phòng", "trước 23:00 hôm nay", "đã quá hạn") và được nhắc trước hạn, để không bị phạt | Must | R2 | BL 3.11, BL 5.12 | Mới |
| US-043 | Là **lễ tân**, tôi muốn nhập giấy tờ từng người (chụp/tải ảnh và các trường: họ tên, loại, số, ngày sinh, quốc tịch, hạn hộ chiếu, thị thực, ngày nhập cảnh; trẻ em dùng số định danh), để có đủ dữ liệu khai báo | Must | R2 | BL 3.11, BL 4.12, BL 5.12 | Mới |
| US-044 | Là **lễ tân**, tôi muốn hệ thống đối chiếu tự động (tên khớp đơn, hộ chiếu còn hạn sau ngày trả, thị thực còn hạn đến ngày trả, đủ số người), để phát hiện sai sót trước khi khai báo | Must | R2 | BL 5.12, BL 8.2 #3 | Mới |
| US-045 | Là **lễ tân**, tôi muốn ghi nhận khách đã đồng ý cho OTTIMO lưu ảnh giấy tờ trước khi lưu, để tuân thủ luật dữ liệu cá nhân | Must | R2 | BL 5.13, BL 3.11 | Mới |
| US-046 | Là **lễ tân**, tôi muốn khai báo bán tự động: chọn đúng loại (tạm trú người nước ngoài / lưu trú công dân Việt Nam), sao chép dữ liệu, mở cổng Bộ Công an, dán mã hồ sơ, đánh dấu đã xác nhận, để làm nhanh dù cổng chưa có kết nối | Must | R2 | BL 3.11, BL 5.12, BL 9 #15 | Mới |
| US-047 | Là **lễ tân**, tôi muốn mọi đơn (đặt mới, từ báo giá, từ OTA) đều tự có bản ghi khai báo với số người cần khai, để không đơn nào bị sót | Must | R2 | BL 8.2 #9 | Mới |
| US-048 | Là **chủ đầu tư**, tôi muốn ảnh giấy tờ chỉ lễ tân và quản lý được xem, mỗi lần mở đều ghi nhật ký, hồ sơ khách chỉ hiện 4 số cuối, để bảo vệ dữ liệu nhạy cảm | Must | R2 | BL 5.13, BL 8.2 #27 | Mới |
| US-049 | Là **chủ đầu tư**, tôi muốn ảnh giấy tờ tự xóa sau số ngày cấu hình kể từ ngày trả phòng và xóa sớm khi khách yêu cầu, để không giữ dữ liệu quá mức cần thiết | Must | R2 | BL 5.13, BL 9 #14 | Mới |
| US-050 | Là **lễ tân**, tôi muốn được nhắc cập nhật ngày đi thực tế khi khách nước ngoài gia hạn/trả sớm, và bị cảnh báo khi ngày đi dự kiến vượt hạn thị thực/tạm trú, để khai báo tạm trú luôn đúng | Must | R2 | Brief 5 (khai báo tạm trú), BL 5.12 | Mới |
| US-051 | Là **lễ tân**, tôi muốn quét QR CCCD gắn chip hoặc vùng MRZ hộ chiếu để tự điền thông tin, để giảm gõ tay và sai sót | Should | R3 | BL 3.11, BL 7 | Mới |

### EP07 – Buồng phòng
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-052 | Là **buồng phòng**, tôi muốn xem trạng thái 10 căn trên điện thoại với bộ lọc (cần dọn, có khách, sẵn sàng) và khách đến kế tiếp, để biết dọn căn nào trước | Must | R2 | BL 3.12, BL 4.5 | Mới |
| US-053 | Là **buồng phòng**, tôi muốn đổi trạng thái buồng chỉ theo các bước hợp lệ (bắt đầu dọn → dọn xong → kiểm đạt…), dọn xong thì việc dọn tự đánh dấu xong, để lễ tân thấy phòng sẵn sàng ngay | Must | R2 | BL 5.15 | Mới |
| US-054 | Là **buồng phòng**, tôi muốn danh sách việc hôm nay tự sinh (dọn trả phòng, dọn phòng khách đang ở, bổ sung minibar, yêu cầu từ app khách, lịch dọn dài hạn) và tick xong được, để không cần ai nhắn việc | Must | R2 | BL 3.12, BL 5.15, BL 5.19 | Mới |
| US-055 | Là **buồng phòng**, tôi muốn đi qua checklist kiểm phòng trước khi đánh dấu "đã kiểm · sẵn sàng", để phòng đạt chuẩn OTTIMO | Must | R2 | BL 3.12 | Mới |
| US-056 | Là **buồng phòng**, tôi muốn việc dọn của khách dài hạn tự xuất hiện đúng ngày theo gói (1/2/3 lần mỗi tuần) và khung giờ đã hẹn, để không quên lịch | Must | R2 | BL 5.15, BL 3.21 | Mới |
| US-057 | Là **buồng phòng**, tôi muốn báo sự cố từ điện thoại (căn, mô tả, ảnh, mức độ), để kỹ thuật nhận phiếu ngay | Must | R2 | BL 3.14 | Mới |
| US-058 | Là **buồng phòng**, tôi muốn thao tác đổi trạng thái vẫn được ghi nhận khi mạng chập chờn và tự gửi lại khi có mạng, để không phải làm lại | Should | R2 | BL 9 #22 | Mới |
| US-059 | Là **lễ tân**, tôi muốn phân việc buồng phòng cho từng người và mỗi người chỉ thấy việc của mình trước, để rõ trách nhiệm | Should | R3 | BL 4.6, BL 9 #13 | Mới |
| US-060 | Là **buồng phòng**, tôi muốn chụp ảnh phòng sau kiểm và đính vào lần kiểm, để có bằng chứng khi khách phản ánh | Could | R3 | BL 3.12 | Mới |

### EP08 – Bảo trì & điện nước
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-061 | Là **kỹ thuật / lễ tân**, tôi muốn tạo phiếu sửa chữa (căn, mức độ, mô tả, người xử lý) và chọn khóa phòng với khoảng ngày dự kiến, để phòng hỏng không bị bán | Must | R2 | BL 3.14, BL 8.2 #5 | Mới |
| US-062 | Là **kỹ thuật**, tôi muốn cập nhật trạng thái phiếu (mới → đang xử lý → chờ vật tư → xong); khi xong thì căn được mở khóa và chuyển "cần dọn", để phòng quay lại bán nhanh | Must | R2 | BL 3.14, BL 5.15 | Mới |
| US-063 | Là **kỹ thuật**, tôi muốn việc bảo trì định kỳ tự sinh kỳ kế tiếp và báo khi còn ≤ 7 ngày, để không quên bảo dưỡng | Should | R3 | BL 3.14, BL 4.8 | Mới |
| US-064 | Là **kỹ thuật / lễ tân**, tôi muốn chốt chỉ số điện nước theo kỳ cho căn dài hạn, bị chặn khi chỉ số mới nhỏ hơn cũ, và xem lịch sử chỉ số, để tính tiền đúng | Must | R3 | BL 3.14, BL 5.10, BL 8.2 #21 | Mới |
| US-065 | Là **lễ tân**, tôi muốn tiền điện nước đã chốt tự vào hóa đơn tháng của khách và hiện trong app khách, để thu không cần nhắn tin tính tay | Must | R3 | BL 5.10, BL 3.21 | Mới |

### EP09 – Kho F&B / minibar
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-066 | Là **chủ đầu tư**, tôi muốn quản lý danh mục mặt hàng minibar/F&B (giá vốn, giá bán hoặc miễn phí, mức chuẩn mỗi tủ, mức tối thiểu), để kiểm minibar và tính tiền đúng | Must | R2 | BL 4.13, BL 5.14 | Mới |
| US-067 | Là **lễ tân**, tôi muốn nhập kho, xuất kho (có lý do, không vượt tồn) và kiểm kê, xem bảng xuất nhập tồn tháng, để biết hàng còn bao nhiêu | Should | R3 | BL 3.15, BL 5.14 | Mới |
| US-068 | Là **buồng phòng**, tôi muốn tick việc "Bổ sung minibar" thì kho tự trừ và tủ về mức chuẩn, để tồn kho khớp thực tế | Should | R3 | BL 5.14 | Mới |
| US-069 | Là **lễ tân**, tôi muốn được báo mặt hàng hết hoặc dưới mức tối thiểu, để nhập hàng kịp | Should | R3 | BL 3.15 | Mới |
| US-070 | Là **chủ đầu tư**, tôi muốn xem doanh thu, lãi gộp F&B, chi phí đồ miễn phí và mặt hàng bán chạy, để điều chỉnh danh mục | Could | R3 | BL 3.15, BL 5.14 | Mới |

### EP10 – Khách hàng (CRM)
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-071 | Là **lễ tân / sale**, tôi muốn tạo và sửa hồ sơ khách (họ tên, SĐT/Zalo/WhatsApp, email, ngày sinh, quốc tịch, ngôn ngữ, liên hệ ưu tiên, công ty/MST, nhóm khách, sở thích, ghi chú), để phục vụ đúng người | Must | R2 | BL 3.16, BL 5.16 | Mới |
| US-072 | Là **lễ tân / sale**, tôi muốn bị chặn khi tạo hồ sơ trùng SĐT hoặc email đã có (và được cảnh báo khi trùng tên + ngày sinh), để không sinh hồ sơ đôi | Must | R2 | BL 5.16 | Mới |
| US-073 | Là **lễ tân / sale**, tôi muốn một bộ chọn khách dùng chung (tìm theo tên có/không dấu, SĐT, email, mã KH hoặc tạo nhanh) ở mọi nơi cần chọn khách, để thao tác giống nhau | Must | R2 | BL 3.16 (guestPicker) | Mới |
| US-074 | Là **lễ tân**, tôi muốn gộp hai hồ sơ trùng mà mọi đơn, người đi cùng, khai báo, báo giá, hợp đồng, công tơ đều chuyển theo và có nhật ký gộp, để lịch sử khách liền mạch | Should | R3 | BL 5.16, BL 8.2 #16 | Mới |
| US-075 | Là **chủ đầu tư / sale**, tôi muốn lọc khách theo phân khúc (khách quen, dài hạn, nước ngoài, VIP, người đi cùng, tiềm năng), để chăm sóc đúng nhóm | Should | R3 | BL 4.20 | Mới |
| US-076 | Là **lễ tân**, tôi muốn xem dòng thời gian, số lượt lưu trú, doanh thu thanh toán và doanh thu phân bổ của khách, để nhận ra khách quen | Should | R3 | BL 3.16, BL 5.11 | Mới |
| US-077 | Là **lễ tân**, tôi muốn ghi đồng ý nhận ưu đãi riêng từng người và gửi link mời người đi cùng tự điền liên hệ, để làm marketing hợp pháp | Should | R3 | BL 5.18, BL 3.17 | Mới |
| US-078 | Là **lễ tân**, tôi muốn thấy độ đầy đủ hồ sơ tính đúng (chỉ tính "đồng ý ưu đãi" khi khách đã trả lời), để biết cần hỏi thêm gì | Could | R3 | BL 5.17, BL 8.2 #14 | Mới |
| US-079 | Là **lễ tân**, tôi muốn phát hiện hồ sơ nghi trùng theo tên chính xác hơn (không báo nhầm tên đảo chữ, bắt được tên thiếu một chữ), để gộp đúng | Could | R3 | BL 8.2 #15 | Mới |

### EP11 – Sale, báo giá, giữ chỗ, hợp đồng dài hạn
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-080 | Là **sale/CTV**, tôi muốn báo giá ngắn ngày (giảm theo số đêm, cọc, hoa hồng của tôi, phần OTTIMO còn lại), để trả lời khách ngay trong cuộc chat | Must | R2 | BL 5.3 | Mới |
| US-081 | Là **sale/CTV**, tôi muốn báo giá dài hạn theo kỳ hạn, loại khách, gói dọn, số người (tiền thuê, phí dịch vụ, điện nước ước tính, ký quỹ, chu kỳ thu, thu khi chốt, hoa hồng, phần OTTIMO còn lại), để chốt hợp đồng tháng nhanh | Must | R2 | BL 5.2 | Mới |
| US-082 | Là **sale/CTV**, tôi muốn biết căn còn trống trong khoảng ngày và được gợi ý căn trống khác, để không hứa phòng đã có khách | Must | R2 | BL 5.4 | Mới |
| US-083 | Là **sale/CTV**, tôi muốn lưu báo giá (có mã, hạn hiệu lực theo tham số) và sao chép văn bản báo giá Việt/Anh/Nga để gửi Zalo, để khách nhận báo giá chuyên nghiệp | Must | R2 | BL 3.18, BL 5.4, BL 8.2 #19, decision-log P4 | Mới |
| US-084 | Là **sale/CTV**, tôi muốn tạo đơn giữ chỗ từ báo giá với hạn giữ (12/24/48 giờ) và cách nhận cọc, căn bị khóa ngay, để khách yên tâm chuyển cọc | Must | R2 | BL 3.18, BL 5.5 | Mới |
| US-085 | Là **sale/CTV**, tôi muốn giữ chỗ quá hạn mà chưa cọc được hệ thống tự xử lý theo chính sách (mặc định: tự hủy, mở lại phòng) và báo cho tôi, để phòng không bị "treo" | Must | R2 | BL 5.5, BL 8.2 #19, BL 9 #11 | Mới |
| US-086 | Là **sale / lễ tân**, tôi muốn xác nhận đã nhận cọc/ký quỹ để đơn chuyển "đã xác nhận" và – với dài hạn – sinh hợp đồng có lịch thu theo kỳ đúng công thức, để không phải lập lịch thu bằng tay | Must | R2 | BL 3.18, BL 5.5, BL 8.2 #10 | Mới |
| US-087 | Là **CTV**, tôi muốn chỉ thấy báo giá, đơn, khách tiềm năng và hoa hồng của chính mình, để thông tin của người khác được bảo mật | Must | R2 | BL 2, BL 8.2 #27 | Mới |
| US-088 | Là **lễ tân / chủ đầu tư**, tôi muốn danh sách hợp đồng dài hạn với kỳ thu tới, được nhắc trước hạn thu theo tham số (mặc định 7 ngày) và ghi nhận đã thu từng kỳ, để không sót tiền thuê | Must | R3 | BL 3.18, BL 5.20 | Mới |
| US-089 | Là **chủ đầu tư**, tôi muốn hoa hồng CTV/sale được ghi nhận theo từng hợp đồng/đơn, đánh dấu đã chi theo đợt, và mỗi người xem phần của mình, để chi đúng, đủ | Must | R3 | BL 3.18, BL 5.2, BL 9 #3 | Mới |
| US-090 | Là **sale**, tôi muốn bảng kanban khách tiềm năng (mới → đã báo giá → giữ chỗ → đã chốt) gắn với hồ sơ khách theo mã (không theo tên), để theo dõi cơ hội | Should | R3 | BL 3.18, BL 8.2 #17 | Mới |
| US-091 | Là **sale**, tôi muốn được nhắc chào gia hạn hợp đồng trước khi hết hạn theo tham số, để giữ khách dài hạn | Should | R3 | BL 5.20 | Mới |
| US-092 | Là **sale / chủ đầu tư**, tôi muốn xuất hợp đồng thuê dài hạn ra PDF từ mẫu có sẵn dữ liệu, để ký nhanh | Should | R3 | BL 9 #17 | Mới |
| US-093 | Là **chủ đầu tư**, tôi muốn xử lý chấm dứt hợp đồng sớm theo chính sách (phạt, hoàn ký quỹ), để quy trình rõ ràng | Should | R3 | BL 9 #6 | Mới |

### EP12 – Kênh OTA & channel manager
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-094 | Là **lễ tân**, tôi muốn mỗi thay đổi phòng trống (đặt, giữ chỗ, gia hạn, khóa, hủy) tạo một lệnh đồng bộ kênh trong nhật ký (giả lập ở R2), để R3 nối channel manager không phải sửa luồng | Should | R2 | BL 5.21, BL 3.19 | Mới |
| US-095 | Là **lễ tân**, tôi muốn đơn từ OTA tự vào Desk qua channel manager, tự tạo/gắn hồ sơ khách theo SĐT/email, để không nhập tay | Must | R3 | BL 3.19, BL 5.21, BL 9 #18, Brief 7 #3 | Mới |
| US-096 | Là **lễ tân**, tôi muốn phòng trống được đẩy tự động lên mọi kênh khi có thay đổi, để tránh trùng phòng giữa các OTA | Must | R3 | BL 5.21 | Mới |
| US-097 | Là **chủ đầu tư**, tôi muốn sửa giá theo nhóm căn × ngày và đẩy lên các kênh, bị chặn khi giá trống/0 hoặc ngoài giá sàn–trần, để quản lý giá ở một nơi | Should | R3 | BL 3.19, BL 8.2 #20 | Mới |
| US-098 | Là **chủ đầu tư**, tôi muốn xem trạng thái kết nối từng kênh và bật/tắt mở bán, để kiểm soát kênh | Should | R3 | BL 3.19 | Mới |
| US-099 | Là **chủ đầu tư**, tôi muốn mỗi đơn lưu phí kênh thực tế (theo tỉ lệ kênh hoặc số OTA báo), để báo cáo thực thu đúng | Must | R3 | BL 5.11, BL 8.2 #11, #12 | Mới |

### EP13 – Báo cáo
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-100 | Là **chủ đầu tư**, tôi muốn báo cáo vận hành theo tháng (công suất trừ phòng khóa, không tính giữ chỗ, ADR, RevPAR, thời gian ở trung bình theo kênh, cơ cấu ngắn/dài hạn), để quyết định giá và kênh | Must | R3 | BL 3.20, BL 5.11, BL 8.2 #8, #29 | Mới |
| US-101 | Là **chủ đầu tư**, tôi muốn báo cáo kênh bán (doanh thu, phí kênh, thực thu theo kênh), để biết kênh nào thực sự lời | Must | R3 | BL 5.11, BL 8.2 #11 | Mới |
| US-102 | Là **chủ đầu tư**, tôi muốn báo cáo FOC theo tháng (tổng giá trị, số lần, lý do, người duyệt), để soát thất thoát | Must | R3 | BL 5.7 | Mới |
| US-103 | Là **chủ đầu tư**, tôi muốn nhập chi phí vận hành trong app và xem lãi lỗ đơn giản (doanh thu, chi phí, GOP, GOPPAR), với doanh thu dài hạn ghi nhận theo quy ước của DATA, để biết lãi thật | Should | R3 | BL 5.11, BL 8.2 #22, BL 9 #26 | Mới |
| US-104 | Là **chủ đầu tư**, tôi muốn xuất báo cáo ra file bảng tính, để gửi kế toán | Should | R3 | BL 7 | Mới |
| US-105 | Là **chủ đầu tư**, tôi muốn nhập điểm đánh giá theo kênh và xem tổng hợp khen/chê, để cải thiện dịch vụ | Could | R3 | BL 3.20 | Mới |

### EP14 – App khách
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-106 | Là **khách**, tôi muốn mở trang của đơn mình bằng link hoặc QR mà không cần cài app hay tạo tài khoản, để dùng ngay | Must | R2 | BL 3.21, BL 7 | Mới |
| US-107 | Là **khách sắp đến**, tôi muốn check-in online (tải giấy tờ từng người, giờ đến dự kiến, đồng ý lưu giấy tờ), để nhận phòng nhanh tại quầy | Must | R2 | BL 3.21, BL 5.12, BL 5.13 | Mới |
| US-108 | Là **khách**, tôi muốn xem thông tin lưu trú (ngày, giờ nhận/trả, Wi-Fi, mã cửa khi đến hạn, chỉ đường, nội quy và phí phạt), để không phải hỏi lễ tân | Must | R2 | BL 3.21, Brief 5 | Mới |
| US-109 | Là **khách đang ở**, tôi muốn gửi yêu cầu (dọn thêm, khăn/đồ dùng, báo hỏng, đặt xe/tour, trả muộn, khác) và thấy yêu cầu đã được nhận/xử lý, để yên tâm | Must | R2 | BL 5.19, Brief 5 (sự cố thường gặp) | Mới |
| US-110 | Là **lễ tân / buồng phòng / kỹ thuật**, tôi muốn yêu cầu của khách tự vào đúng hàng việc (việc buồng phòng, phiếu sửa, việc lễ tân) và có báo mới, để phản hồi trong thời gian cam kết | Must | R2 | BL 5.19, BL 3.21 | Mới |
| US-111 | Là **khách**, tôi muốn xem folio/hóa đơn tạm tính của đơn (tiền phòng, phát sinh, đã trả, còn phải trả), để không bất ngờ khi trả phòng | Must | R2 | BL 3.21 | Mới |
| US-112 | Là **khách nước ngoài**, tôi muốn chuyển trang của mình sang tiếng Anh, để hiểu mọi nội dung | Must | R2 | BL 1, DoD (VI + EN), decision-log P4 | Mới |
| US-113 | Là **khách trả phòng hôm nay**, tôi muốn tự chọn trả đúng giờ, ở thêm (nếu còn phòng) hoặc trả muộn có phí hiển thị trước, để không phải gọi lễ tân | Should | R3 | BL 3.21, BL 5.9 | Mới |
| US-114 | Là **khách dài hạn**, tôi muốn xem hợp đồng, lịch dọn, kỳ thanh toán tới và hóa đơn điện nước hằng tháng, để chủ động thanh toán | Must | R3 | BL 3.21, BL 5.10 | Mới |
| US-115 | Là **khách nói tiếng Nga**, tôi muốn dùng trang của mình bằng tiếng Nga, để thoải mái hơn | Must | R3 | Brief 5, decision-log P4 | Mới |
| US-116 | Là **chủ đầu tư**, tôi muốn app tự hỏi thăm khách ngày thứ 2, gửi lời cảm ơn + mã giảm đặt trực tiếp khi trả phòng và mời đánh giá trên kênh khách đã đặt sau 1 ngày, để tăng điểm đánh giá và khách quay lại | Should | R3 | BL 5.18 | Mới |
| US-117 | Là **khách**, tôi muốn xem gợi ý Đà Lạt (điểm tham quan, quán cà phê) và nhờ OTTIMO đặt xe/tour, để có trải nghiệm tốt | Could | R3 | BL 3.21 | Mới |
| US-118 | Là **lễ tân**, tôi muốn ghi nhận đồ khách để quên và thông báo cho khách, để xử lý chuyên nghiệp | Could | R3 | Brief 5 (sự cố thường gặp) | Mới |

### EP15 – Thanh toán & hóa đơn điện tử
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-119 | Là **lễ tân / sale**, tôi muốn ghi nhận các lần thu tiền của một đơn (cọc, thu khi nhận, thu khi trả, theo kỳ) theo cách thanh toán (chuyển khoản, thẻ, tiền mặt, đã thu qua OTA), để số "còn phải thu" luôn đúng | Must | R2 | BL 3.7, BL 5.20 | Mới |
| US-120 | Là **lễ tân**, tôi muốn hiện mã VietQR đúng số tiền với nội dung chuyển khoản là mã bill/đơn, để khách chuyển đúng và dễ đối soát | Must | R2 | BL 3.8, BL 5.20, decision-log (VietQR) | Mới |
| US-121 | Là **khách**, tôi muốn thanh toán cọc/tiền phòng qua VNPay hoặc MoMo bằng link, để trả nhanh từ xa | Should | R3 | Brief 7 #4, BL 9 #20 | Mới |
| US-122 | Là **lễ tân**, tôi muốn hóa đơn điện tử được phát hành qua MISA meInvoice khi thu tiền (khách lẻ hoặc công ty), để tuân thủ thuế | Must | R3 | BL 5.20, Brief 7 #3, BL 9 #16 | Mới |
| US-123 | Là **quản lý**, tôi muốn ghi nhận hoàn cọc/hoàn tiền có lý do và người duyệt, để khớp sổ | Should | R3 | BL 9 #6, BL 8.2 #23 | Mới |
| US-124 | Là **lễ tân**, tôi muốn xem tổng thu trong ngày theo cách thanh toán, để bàn giao tiền mặt và đối soát chuyển khoản | Should | R3 | Mới | Mới |

### EP16 – Giao tiếp với khách
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-125 | Là **lễ tân / sale**, tôi muốn chọn mẫu tin nhắn theo tình huống (xác nhận đặt, link check-in, nhắc trả phòng, nội quy, xin lỗi sự cố nước nóng…) bằng Việt/Anh/Nga có sẵn dữ liệu đơn và sao chép được, để nhắn nhóm chat nhanh, đúng ngôn ngữ | Must | R2 | Brief 5, decision-log P4 | Mới |
| US-126 | Là **lễ tân**, tôi muốn tin nhắn quan trọng (xác nhận, link check-in, nhắc trả phòng, bill) tự gửi qua Zalo OA/ZNS hoặc email, để không phải gửi tay | Should | R3 | BL 7, BL 9 #19 | Mới |
| US-127 | Là **chủ đầu tư**, tôi muốn sửa nội dung các mẫu tin, để phù hợp giọng văn OTTIMO | Should | R3 | Mới | Mới |

### EP17 – Khóa cửa & thẻ phòng
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-128 | Là **lễ tân**, tôi muốn nhập mã cửa (và thời hạn hiệu lực) vào đơn, để khách thấy mã trong app từ ngày nhận phòng | Must | R2 | Brief 7 #3, decision-log (khóa thông minh) | Mới |
| US-129 | Là **lễ tân**, tôi muốn ghi số thẻ phòng đã cấp/thu cho từng đơn và tự thêm phí khi thiếu thẻ lúc trả phòng, để không thất thoát thẻ | Should | R3 | Brief 5 (phí làm lại thẻ) | Mới |
| US-130 | Là **lễ tân**, tôi muốn app tự tạo mã cửa có hạn (theo ngày sinh nhật khách nếu khách muốn) qua API hãng khóa, để không phải đặt mã trên app khóa riêng | Could | R4+ | Brief 7 #3 | Mới |

### EP18 – Đặt phòng trực tiếp trên web
| ID | User story | MoSCoW | Round | Nguồn | Trạng thái |
|---|---|---|---|---|---|
| US-131 | Là **khách**, tôi muốn xem phòng trống và giá trực tiếp trên website OTTIMO rồi gửi yêu cầu giữ chỗ, để đặt mà không qua OTA | Should | R3 | BL 3.19 (kênh Website), BL 5.11 (giảm phí kênh) | Mới |
| US-132 | Là **khách**, tôi muốn đặt và thanh toán ngay trên website mà không cần chờ xác nhận, để chốt nhanh | Could | R4+ | Mới | Mới |

### Won't (ngoài phạm vi MVP – chi tiết PRD 5.3)
POS nhà hàng; kế toán tổng hợp/lương; ca làm việc & chấm công; ký số hợp đồng; kết nối trực tiếp từng OTA; iCal; định giá tự động; hạng thành viên; đa tiền tệ thanh toán; app cài từ store cho khách; tiếng Hàn/Trung.

---

## 4. Tiêu chí nghiệm thu – story Must Round 2

Định dạng: **Given** (bối cảnh) / **When** (hành động) / **Then** (kết quả kiểm chứng được). Con số "(mặc định BL x.y)" là tham số cấu hình – sẽ thay bằng mã BR ở đợt 3. Dữ liệu ví dụ lấy từ dữ liệu mẫu 10 căn của BL.

#### US-001 – Đăng nhập
- AC1: Given tài khoản lễ tân đang hoạt động, When nhập đúng tên đăng nhập và mật khẩu, Then vào được màn hình mặc định của vai lễ tân và tên người dùng hiện trên đầu trang.
- AC2: Given chưa đăng nhập, When mở trực tiếp đường dẫn một màn hình nội bộ, Then bị chuyển về trang đăng nhập và không thấy dữ liệu nào.
- AC3: Given đã đăng nhập, When tạo hoặc sửa một đơn, Then nhật ký ghi đúng tên tài khoản đó là người thực hiện.

#### US-002 – Gán vai
- AC1: Given chủ đầu tư mở một tài khoản, When đổi vai từ "lễ tân" sang "buồng phòng" và người đó đăng nhập lại, Then menu chỉ còn các màn hình của vai buồng phòng theo `rbac-matrix.md`.
- AC2: Given tài khoản vai buồng phòng, When gọi trực tiếp một hành động không được phép (ví dụ tạo đơn), Then hệ thống từ chối và ghi nhật ký lần bị từ chối – không chỉ ẩn nút.

#### US-003 – Ẩn dữ liệu nhạy cảm
- AC1: Given tài khoản sale/CTV, When mở hồ sơ một khách đã có giấy tờ, Then không thấy loại/số giấy tờ hay ảnh giấy tờ (khắc phục BL 8.2 #27).
- AC2: Given tài khoản buồng phòng, When xem minibar hoặc kho, Then thấy số lượng nhưng không thấy giá vốn.
- AC3: Given tài khoản sale/CTV hoặc buồng phòng, When tìm cách mở báo cáo lãi lỗ, Then không có menu và truy cập trực tiếp bị từ chối.

#### US-004 – Danh mục căn
- AC1: Given danh mục 10 căn theo BL 4.1, When chủ đầu tư đổi giá niêm yết tháng của căn 203, Then báo giá mới tạo sau đó dùng giá mới, đơn và báo giá cũ giữ nguyên giá đã chốt.
- AC2: Given một căn được đánh dấu "ngừng bán", When lễ tân tạo đơn mới, Then căn đó không có trong danh sách chọn và room rack hiện căn đó với nhãn "ngừng bán".

#### US-005 – Bảng tham số quy tắc
- AC1: Given tham số "hạn giữ chỗ mặc định" = 24 giờ (mặc định BL 5.5), When chủ đầu tư đổi thành 48 giờ, Then đơn giữ chỗ tạo sau đó có hạn mặc định 48 giờ, đơn tạo trước giữ nguyên hạn cũ.
- AC2: Given tài khoản không phải chủ đầu tư/quản lý, When mở trang tham số, Then không được sửa.
- AC3: Given chủ đầu tư sửa một tham số, Then nhật ký ghi giá trị cũ, giá trị mới, người sửa, thời điểm.

#### US-006 – Nhật ký thao tác tiền
- AC1: Given một đơn có folio, When lễ tân thêm, sửa hoặc xóa một dòng phát sinh, Then nhật ký của đơn ghi người làm, thời điểm, giá trị trước và sau.
- AC2: Given chủ đầu tư mở nhật ký, When lọc theo ngày và người làm, Then thấy đúng các thao tác tiền (folio, giảm giá, FOC, hủy, thu tiền) trong khoảng đó.

#### US-007 – Phê duyệt FOC/giảm giá
- AC1: Given lễ tân nhập FOC cho phụ thu trả muộn, When lưu, Then khoản FOC ở trạng thái "chờ duyệt" cho tới khi một tài khoản có quyền duyệt xác nhận; lễ tân không thể tự chọn tên người duyệt.
- AC2: Given quản lý xác nhận duyệt, Then folio có dòng phụ thu và dòng FOC âm cùng giá trị, ghi lý do và tên người duyệt thật (BL 5.7).
- AC3: Given khoản FOC vượt hạn mức của lễ tân trưởng (tham số – chờ ESC BL 9 #8), When lễ tân trưởng cố duyệt, Then bị từ chối và yêu cầu quản lý/chủ đầu tư duyệt.

#### US-010 – KPI đêm nay
- AC1: Given 10 căn, 6 căn có đơn đang ở/đã xác nhận phủ đêm nay, 1 căn khóa, 1 căn chỉ có giữ chỗ, When mở Tổng quan, Then công suất đêm nay hiển thị theo công thức của `metrics-definitions.md` (đêm khả dụng trừ phòng khóa, giữ chỗ không tính là bán – khắc phục BL 8.2 #8, #29) và ghi chú rõ mẫu số.
- AC2: Given không còn số cứng, When dữ liệu đơn thay đổi, Then KPI cập nhật trong lần tải lại kế tiếp mà không cần sửa code (BL 8.2 #28).

#### US-011 – Khách đến/đi hôm nay
- AC1: Given hôm nay có 1 đơn đã hủy và 1 đơn giữ chỗ chưa cọc có ngày đến hôm nay, When mở danh sách Khách đến, Then hai đơn đó không xuất hiện (BL 8.2 #7).
- AC2: Given đơn đã xác nhận đến hôm nay, Then dòng có nút "Nhận phòng"; đơn đang ở có ngày đi hôm nay có nút "Trả phòng"; đơn đã xử lý hiện chip "Đã nhận"/"Đã trả".

#### US-012 – Cần chú ý
- AC1: Given một đơn đến hôm nay chưa khai báo lưu trú, When mở Tổng quan, Then "Cần chú ý" có dòng nêu số đơn chưa khai báo và hạn 23:00 hôm nay; bấm vào mở màn hình khai báo.
- AC2: Given hợp đồng dài hạn có kỳ thu trong ≤ 7 ngày (tham số, mặc định BL 5.20), Then có dòng nhắc thu với tên khách, số tiền, ngày thu.
- AC3: Given một khách nước ngoài có thị thực hết hạn trước ngày trả phòng, Then có dòng cảnh báo thị thực với căn và ngày hết hạn.
- AC4: Given không có việc nào thỏa điều kiện, Then mục hiện trạng thái rỗng "Không có việc cần chú ý".

#### US-016 – Room rack
- AC1: Given dữ liệu mẫu, When mở Lễ tân, Then thấy 10 dòng căn × 14 cột ngày (2 ngày trước tới 11 ngày sau hôm nay), cột hôm nay được đánh dấu.
- AC2: Given mỗi thanh đơn, Then loại đơn được thể hiện bằng cả màu và nhãn chữ/biểu tượng đọc được bởi trình đọc màn hình (BL 8.3).
- AC3: Given bấm vào một thanh đơn bằng chuột hoặc bàn phím, Then mở chi tiết đơn đó.

#### US-017 – Tạo đơn ngắn ngày
- AC1: Given căn 203 trống 19–22/10, When lễ tân tạo đơn kênh Booking.com 3 đêm 2 khách giá 820.000 có mã OTA, Then đơn được lưu trạng thái "đã xác nhận", hiện trên rack, có bản ghi khai báo cần 2 người.
- AC2: Given kênh Trực tiếp hoặc CTV, When lưu mà khách không có SĐT, Then bị chặn với thông báo cần SĐT (BL 3.5).
- AC3: Given bỏ trống giá, Then giá mặc định lấy theo quy tắc giá niêm yết làm tròn (mặc định BL 5.1) và hiển thị trước khi lưu.
- AC4: Given ngày đến xa hơn 31/12/2026, When tạo đơn, Then vẫn tạo được (không giới hạn cứng cuối năm – BL 8.2 #26); giới hạn xa nhất là tham số.

#### US-018 – Chống đặt trùng
- AC1: Given căn 201 đã có đơn 20–22/10, When tạo đơn căn 201 từ 21/10, Then bị chặn và thông báo nêu tên khách và khoảng ngày đang trùng.
- AC2: Given hai người cùng lưu đơn cho cùng căn và đêm gần như đồng thời, When cả hai bấm lưu, Then chỉ một đơn thành công, người kia nhận thông báo trùng (kiểm ở máy chủ – BL 8.2 #30).
- AC3: Given ngày đi của đơn A = ngày đến của đơn B cùng căn, Then không bị coi là trùng (khoảng `[đến, đi)`).

#### US-019 – Phòng khóa chặn bán
- AC1: Given căn 401 khóa 15–17/10 do phiếu sửa, When tạo đơn hoặc báo giá căn 401 ngày 16/10, Then bị chặn với lý do "phòng đang khóa".
- AC2: Given căn đang khóa, Then rack hiện thanh "Khóa phòng" và phòng trống đếm trên Tổng quan/báo giá không tính căn này.

#### US-020 – Chi tiết đơn
- AC1: Given đơn giữ chỗ, When mở chi tiết, Then thấy tiến trình 5 bước đúng loại đơn (ngắn ngày/dài hạn – BL 3.4) và chỉ có nút "Xác nhận đã nhận cọc", "Hủy giữ chỗ".
- AC2: Given đơn đang ở có ngày đi hôm nay, Then có nút "Trả phòng"; đơn đã trả chỉ có "Xem bill".
- AC3: Given người xem là CTV, When mở đơn không do mình bán, Then không xem được (theo RBAC).

#### US-021 – Hủy đơn/hủy giữ chỗ
- AC1: Given đơn giữ chỗ, When hủy mà không chọn lý do, Then không lưu được.
- AC2: Given hủy thành công, Then đơn chuyển "đã hủy", phòng trống lại ngay trên rack, có lệnh đồng bộ mở phòng (US-094) và nhật ký ghi lý do, người hủy.
- AC3: Given đơn đã cọc, When hủy, Then hệ thống hiển thị khoản phí hủy/hoàn cọc theo tham số chính sách hủy `[GIẢ ĐỊNH – chờ ESC BL 9 #6]` và yêu cầu xác nhận trước khi lưu.

#### US-022 – Người đi cùng
- AC1: Given đơn 2 khách chỉ có người đứng tên, When mở chi tiết, Then hiện cảnh báo "Thiếu 1 người" ở khối khách trong đơn.
- AC2: Given thêm trẻ em với họ tên + năm sinh, Then trẻ em được ghi vai "trẻ em" và chỉ dùng cho khai báo (không tạo hồ sơ marketing).
- AC3: Given chọn một người đã có trong đơn, When thêm lần nữa, Then bị chặn trùng.

#### US-023 – Mã duy nhất
- AC1: Given tạo liên tiếp nhiều đơn, phiếu sửa (kể cả phiếu tạo từ app khách), bill, Then không có hai mã trùng trong cùng loại (BL 8.2 #18).
- AC2: Given một hồ sơ khách bị gộp, Then mã cũ vẫn tra được và trỏ tới hồ sơ được giữ lại.

#### US-025 – Nhận phòng
- AC1: Given đơn đã xác nhận đến hôm nay và buồng VI, When lễ tân nhận phòng lúc 14:30, Then đơn → "đang ở", buồng → OC, ghi giờ nhận 14:30, không có phụ thu.
- AC2: Given buồng đang VD, When mở nhận phòng, Then hiện cảnh báo "buồng chưa sẵn sàng" và yêu cầu xác nhận nếu vẫn nhận.
- AC3: Given đơn chưa khai báo lưu trú, When nhận phòng xong, Then hiện nhắc khai báo trước 23:00 và đơn xuất hiện trong "Cần chú ý".

#### US-026 – Phụ thu nhận sớm
- AC1: Given mở form nhận phòng, Then ô giờ nhận mặc định = giờ chuẩn nhận phòng (mặc định 14:00 – BL 5.6) và phụ thu = 0 cho tới khi lễ tân sửa giờ (khắc phục BL 8.2 #2).
- AC2: Given đơn giá 700.000/đêm, When nhập giờ nhận 11:00, Then phụ thu = 30% × 700.000 = 210.000 (bậc mặc định BL 5.6) và hiển thị trước khi lưu.
- AC3: Given chọn FOC cho phụ thu, Then áp dụng luồng duyệt của US-007.

#### US-027 – Phụ thu cho đơn dài hạn
- AC1: Given đơn dài hạn tiền thuê 11.130.000/tháng, When tính phụ thu trả muộn bậc 30%, Then cơ sở tính là giá đêm quy đổi theo quy tắc của DOM (không phải 11.130.000) – kết quả khác 3.339.000 (lỗi BL 8.2 #1).
- AC2: Given chính sách riêng cho dài hạn được INV quyết (BL 9 #7), Then chỉ cần đổi tham số, không đổi luồng.

#### US-028 – Gia hạn
- AC1: Given căn 201 trống 3 đêm liên tiếp sau ngày đi, tham số tối đa 7 đêm, When mở gia hạn, Then chọn được 1–3 đêm và mỗi đêm hiện "Trống".
- AC2: Given đơn Agoda, When gia hạn 1 đêm, Then folio có dòng "Gia hạn 1 đêm – thu trực tiếp tại OTTIMO" với giá theo quy tắc gia hạn (BL 5.8 – chờ ESC BL 9 #1/#13), đơn OTA gốc không đổi.
- AC3: Given gia hạn thành công, Then ngày đi được cập nhật, buồng → OD, việc "Dọn trả phòng" đổi thành "Dọn phòng khách đang ở", có lệnh đồng bộ đóng phòng, và nếu khách nước ngoài thì có nhắc cập nhật ngày đi khai báo (US-050).
- AC4: Given hai người cùng gia hạn và tạo đơn mới vào cùng đêm, Then chỉ một thao tác thành công (US-018).

#### US-029 – Trả muộn
- AC1: Given đơn giá 700.000, When đặt trả muộn 15:00, Then phụ thu = 210.000 (bậc mặc định BL 5.6) hiển thị trước khi lưu.
- AC2: Given căn có khách đến hôm nay, When mở trả muộn, Then hiện cảnh báo tên khách đến và giờ đến dự kiến.
- AC3: Given lưu trả muộn, Then việc dọn của căn ghi "dọn sau 15:00" và nhật ký nhắc ghi giờ trả đã chốt.

#### US-030 – Xác nhận giờ trả
- AC1: Given khách trả lời qua điện thoại, When lễ tân chọn giờ 11:00 và ghi chú, Then nhật ký nhắc của đơn có dòng "Gọi điện – khách trả lúc 11:00" với người ghi và thời điểm.
- AC2: Given giờ trả đã xác nhận, Then thẻ "khách trả phòng hôm nay" của đơn đó chuyển màu "đã trả lời".

#### US-031 – Thẻ khách trả phòng hôm nay chưa trả
- AC1: Given đơn đang ở có ngày đi hôm nay, khách chưa trả lời, When giờ hiện tại 10:30, Then trạng thái "Đã nhắc, chờ khách trả lời"; lúc 11:20 → "Chưa trả lời – lễ tân gọi xác nhận"; lúc 12:15 → "Quá giờ trả phòng 15 phút" (mốc mặc định BL 5.9, dùng giờ Việt Nam thật).
- AC2: Given căn đó có khách đến trong ngày, Then thẻ được xếp lên đầu.

#### US-032 – Dòng phát sinh / phí phạt
- AC1: Given danh mục phí có "Khử mùi thuốc lá" và "Làm lại thẻ phòng" với giá mặc định (Brief 5), When lễ tân thêm vào folio, Then dòng có giá mặc định, sửa được số lượng, và ghi nhật ký (US-006).
- AC2: Given folio đã có dòng phát sinh, Then "Còn phải thu" trong chi tiết đơn và app khách cập nhật đúng.

#### US-035 – Trả phòng bước 1: minibar
- AC1: Given tủ căn 201 chuẩn Coca 2 lon, When nhập còn 0, Then đã dùng 2 và tiền = 2 × giá bán Coca (BL 4.13).
- AC2: Given đồ miễn phí (nước suối), When đã dùng 2, Then dòng ghi "Miễn phí", không cộng tiền nhưng vẫn ghi tiêu hao.
- AC3: Given nhập số còn lại lớn hơn mức chuẩn hoặc âm, Then bị chặn.

#### US-036 – Trả phòng bước 2: phụ phí
- AC1: Given đơn có trả muộn đã hẹn 15:00, When mở bước 2, Then giờ trả thực tế mặc định 15:00 và phụ thu theo bậc tương ứng; nếu không hẹn, giờ mặc định = giờ chuẩn trả phòng, phụ thu 0.
- AC2: Given nhập giặt ủi 120.000 và chọn cách thanh toán "Chuyển khoản QR", Then bảng tóm tắt "Còn phải thu" cập nhật ngay.

#### US-037 – Trả phòng bước 3: bill
- AC1: Given đơn 3 đêm × 820.000, minibar 25.000, phụ thu 210.000 có FOC đã duyệt, đã cọc 0, Then bill có 3 dòng tiền phòng, 1 dòng minibar, 1 dòng phụ thu 210.000, 1 dòng FOC −210.000, tổng = 2.485.000, còn phải thu = 2.485.000.
- AC2: Given khách quốc tịch khác VN, Then bill song ngữ Việt – Anh và có dòng quy đổi USD tham khảo theo tỷ giá cấu hình (không cố định 26.200 – BL 7).
- AC3: Given đơn đã cọc, Then dòng "Đã cọc / đã thu" trừ đúng tổng các lần thu đã ghi (US-119).

#### US-038 – Hoàn tất trả phòng
- AC1: Given bấm "Đã thu X đ – hoàn tất", Then đơn → "đã trả", buồng → VD, có việc "Dọn trả phòng" và (nếu có tiêu hao) "Bổ sung minibar" kèm danh sách hàng.
- AC2: Given bill đã hoàn tất, When lễ tân cố sửa dòng bill, Then không sửa trực tiếp được; chỉ tạo "điều chỉnh" có lý do, được ghi nhật ký và cần quyền quản lý.
- AC3: Given còn phải thu > 0 mà chưa ghi nhận thu, When bấm hoàn tất, Then bị chặn hoặc yêu cầu ghi lý do "công nợ" có người duyệt.

#### US-039 – Thông tin hóa đơn GTGT công ty
- AC1: Given tích "Khách lấy hóa đơn công ty", When MST không phải 10 hoặc 13 chữ số (cho phép gạch ngang), Then bị chặn với thông báo rõ (BL 5.16).
- AC2: Given lưu đủ tên công ty, MST, email, Then thông tin gắn với bill và hồ sơ khách để phát hành hóa đơn (phát hành thật ở US-122, R3).

#### US-042 – Danh sách cần khai báo
- AC1: Given đơn đến hôm nay chưa khai báo, Then dòng hiện hạn "Trước 23:00 hôm nay"; đơn đến ngày mai hiện "Khi nhận phòng dd/m"; đơn đến hôm qua chưa xong hiện "Đã quá hạn" màu cảnh báo.
- AC2: Given 21:00 (tham số) mà còn đơn chưa khai báo, Then lễ tân đang trực và quản lý nhận nhắc trong app.

#### US-043 – Nhập giấy tờ
- AC1: Given đơn 2 người lớn, When nhập đủ trường cho người thứ nhất, Then trạng thái khai báo "Thiếu người đi cùng"; nhập đủ người thứ hai → "Đã quét, chờ lưu" (BL 5.12).
- AC2: Given trẻ em, Then loại giấy tờ là "Số định danh (trẻ em)" và không bắt ảnh.
- AC3: Given người lớn từ giấy tờ chưa có trong đơn, When lưu, Then được gắn vào đơn: khớp hồ sơ theo tên + ngày sinh nếu có, không thì tạo hồ sơ mới quan hệ "Chưa rõ".

#### US-044 – Đối chiếu tự động
- AC1: Given hộ chiếu hết hạn trước ngày trả phòng, Then kiểm "hộ chiếu còn hạn" báo **Không khớp** (khắc phục BL 8.2 #3 – trước đây luôn "Khớp").
- AC2: Given tên đơn "Daniel Weber" và giấy tờ "WEBER DANIEL", Then kiểm tên báo khớp (bỏ dấu, chấp nhận đảo thứ tự).
- AC3: Given thị thực hết hạn trước ngày trả phòng, Then báo cảnh báo thị thực và đơn xuất hiện trong "Cần chú ý".

#### US-045 – Đồng ý lưu giấy tờ
- AC1: Given đủ giấy tờ nhưng chưa tích đồng ý, When bấm "Lưu và chuyển sang khai báo", Then nút bị khóa với lý do.
- AC2: Given khách đã đồng ý qua check-in online (US-107), Then ô đồng ý đã được ghi kèm thời điểm và hình thức "qua app".

#### US-046 – Khai báo bán tự động
- AC1: Given đơn có ít nhất một người mang thị thực, When mở khai báo, Then tiêu đề "Khai báo tạm trú người nước ngoài"; đơn toàn người Việt → "Thông báo lưu trú công dân Việt Nam".
- AC2: Given bấm "Sao chép dữ liệu", Then bộ nhớ tạm có đủ trường bắt buộc của từng người theo đúng thứ tự cổng yêu cầu (Brief 5: thông tin hộ chiếu, thị thực/miễn thị thực, ngày đến/đi, mục đích, SĐT).
- AC3: Given dán mã hồ sơ, When lưu, Then trạng thái → "Đã gửi, chờ xác nhận"; bấm "Công an đã xác nhận" → "Đã xác nhận" và đơn biến khỏi danh sách cần xử lý.

#### US-047 – Mọi đơn có bản ghi khai báo
- AC1: Given đơn tạo từ báo giá (US-084) hoặc từ OTA, Then có bản ghi khai báo với số người cần khai = số khách của đơn (khắc phục BL 8.2 #9).
- AC2: Given số khách của đơn thay đổi, Then số người cần khai cập nhật theo.

#### US-048 – Quyền xem ảnh giấy tờ
- AC1: Given tài khoản lễ tân, When mở ảnh giấy tờ, Then xem được và nhật ký ghi người xem, thời điểm, đơn, người được xem.
- AC2: Given tài khoản buồng phòng hoặc sale/CTV, When truy cập ảnh (kể cả qua đường dẫn trực tiếp), Then bị từ chối.
- AC3: Given hồ sơ khách ở CRM, Then số giấy tờ chỉ hiện 4 số cuối.

#### US-049 – Tự xóa ảnh giấy tờ
- AC1: Given tham số lưu ảnh = 30 ngày sau trả phòng (mặc định BL 5.13 – chờ ESC pháp lý BL 9 #14), When đơn đã trả quá 30 ngày, Then ảnh bị xóa tự động, dữ liệu khai báo dạng chữ giữ theo tham số riêng, nhật ký ghi lần xóa.
- AC2: Given khách yêu cầu xóa sớm, When quản lý xác nhận, Then ảnh bị xóa ngay và có nhật ký.

#### US-050 – Ngày đi thực tế & hạn tạm trú
- AC1: Given khách nước ngoài đã khai báo, When gia hạn hoặc trả phòng khác ngày đi dự kiến, Then đơn xuất hiện trong danh sách cần cập nhật khai báo với ngày đi mới.
- AC2: Given ngày đi dự kiến sau ngày hết hạn thị thực, When lưu đơn hoặc gia hạn, Then hiện cảnh báo chặn mềm (phải xác nhận lý do).

#### US-052 – Xem trạng thái buồng
- AC1: Given điện thoại rộng 360px, When buồng phòng mở màn hình, Then thấy thẻ 10 căn với số căn, nhãn trạng thái bằng chữ, khách hiện tại/kế tiếp, không cuộn ngang.
- AC2: Given chọn lọc "Cần dọn", Then chỉ còn căn VD, OD, CL (BL 3.12).

#### US-053 – Đổi trạng thái buồng hợp lệ
- AC1: Given căn VD, Then chỉ có nút "Bắt đầu dọn" (→ CL); căn CL có khách → "Dọn xong" chuyển OC, không khách → VC (BL 5.15).
- AC2: Given chuyển sang VC/OC, Then việc dọn chưa xong đầu tiên của căn tự đánh dấu xong.
- AC3: Given căn VC, When bấm "Kiểm đạt", Then phải qua checklist (US-055) mới chuyển VI.

#### US-054 – Việc hôm nay tự sinh
- AC1: Given lễ tân hoàn tất trả phòng căn 201, Then việc "Dọn trả phòng 201" xuất hiện trong danh sách buồng phòng trong vòng 1 phút.
- AC2: Given khách gửi yêu cầu "Khăn, đồ dùng" từ app, Then việc có chip "App khách" và ghi chú của khách.
- AC3: Given tick xong, Then bộ đếm x/y cập nhật và lễ tân thấy cùng trạng thái.

#### US-055 – Checklist kiểm phòng
- AC1: Given checklist 12 điểm (BL 3.12, nội dung cấu hình được), When chưa tick đủ điểm bắt buộc, Then không chuyển được VI.
- AC2: Given tick đủ và lưu, Then lần kiểm ghi người kiểm, thời điểm, căn.

#### US-056 – Lịch dọn khách dài hạn
- AC1: Given hợp đồng gói "2 lần/tuần – T2, T5, 9:00–11:00", When đến thứ Hai, Then việc "Dọn phòng khách dài hạn" có khung giờ xuất hiện trong việc hôm nay.
- AC2: Given hợp đồng kết thúc hoặc khách đổi gói, Then các việc sau ngày đó không còn sinh theo gói cũ.

#### US-057 – Báo sự cố từ điện thoại
- AC1: Given buồng phòng chọn căn, mô tả "mất nước nóng", đính 1 ảnh, When gửi, Then tạo phiếu sửa mới với nguồn "buồng phòng" và kỹ thuật thấy ngay.
- AC2: Given chọn "cần khóa phòng", Then áp dụng như US-061 (khóa có khoảng ngày, chặn bán).

#### US-061 – Tạo phiếu sửa và khóa phòng
- AC1: Given tạo phiếu căn 401 có tích "Khóa phòng đến khi sửa xong" với ngày dự kiến xong 17/10, Then căn 401 bị chặn bán 15–17/10 trên rack, kiểm trùng và phòng trống (khắc phục BL 8.2 #5), buồng → OOO.
- AC2: Given trong khoảng khóa đã có đơn tương lai, When lưu phiếu, Then hiện cảnh báo nêu đơn bị ảnh hưởng để lễ tân đổi phòng (US-024) trước khi khóa.
- AC3: Given bỏ trống mô tả, Then không lưu được.

#### US-062 – Cập nhật phiếu sửa
- AC1: Given phiếu của căn đang khóa, When chuyển "Xong", Then khóa được gỡ, căn bán lại được, buồng → VD và có việc dọn.
- AC2: Given đổi trạng thái hoặc người xử lý, Then nhật ký phiếu ghi người đổi và thời điểm.

#### US-066 – Danh mục mặt hàng minibar
- AC1: Given chủ đầu tư thêm mặt hàng với giá bán = "miễn phí", Then khi kiểm minibar mặt hàng đó không tính tiền nhưng vẫn ghi tiêu hao.
- AC2: Given đổi giá bán, Then các lần kiểm minibar sau dùng giá mới, dòng folio đã ghi giữ nguyên.

#### US-071 – Tạo/sửa hồ sơ khách
- AC1: Given form hồ sơ, When thiếu họ tên hoặc thiếu cả SĐT và email, Then không lưu được.
- AC2: Given SĐT dưới 9 chữ số hoặc email sai dạng, Then báo lỗi tại ô tương ứng (BL 5.16).
- AC3: Given form hồ sơ, Then không có ô nhập tay số giấy tờ (chỉ lấy từ bước giấy tờ – BL 3.16).

#### US-072 – Chặn hồ sơ trùng
- AC1: Given đã có khách SĐT 0901 234 567, When tạo khách mới SĐT "+84 901234567", Then bị chặn và có nút "Mở hồ sơ đó" (chuẩn hóa SĐT – BL 5.16).
- AC2: Given trùng tên + ngày sinh nhưng khác SĐT/email, Then chỉ cảnh báo, vẫn cho lưu.

#### US-073 – Bộ chọn khách dùng chung
- AC1: Given gõ "do mai anh" (không dấu), Then kết quả có "Đỗ Mai Anh" (tối đa 5 kết quả, từ 2 ký tự).
- AC2: Given không tìm thấy, When tạo nhanh với SĐT đã tồn tại, Then hiện cảnh báo trùng và nút "Dùng hồ sơ này".

#### US-080 – Báo giá ngắn ngày
- AC1: Given căn 201 giá niêm yết, 7 đêm, When tính, Then áp giảm theo số đêm (mặc định ≥7 đêm −10% – BL 5.3), cọc = tỉ lệ cọc × tổng làm tròn theo quy tắc, hiển thị hoa hồng của người chốt và phần OTTIMO còn lại.
- AC2: Given người xem là CTV, Then thấy hoa hồng của mình nhưng không thấy chi phí vận hành chi tiết nếu RBAC cấm (BA chốt).

#### US-081 – Báo giá dài hạn
- AC1: Given ví dụ BL 5.2 (căn 302, khách nước ngoài, 6 tháng, dọn 2/tuần, 1 người, CTV, vào ở 1/11/2026), When tính với tham số mặc định, Then ra đúng các số trong ví dụ BL 5.2 (thuê 11.130.000; khách trả 13.908.000/tháng; ký quỹ 16.700.000; thu khi chốt 56.339.000) – trừ khi DOM sửa công thức trong BR.
- AC2: Given đổi bất kỳ trường nào, Then kết quả tính lại ngay không cần bấm nút.
- AC3: Given khách nước ngoài, Then có quy đổi USD tham khảo theo tỷ giá cấu hình.

#### US-082 – Kiểm phòng trống khi báo giá
- AC1: Given căn chọn bị trùng lịch, Then chip "Trùng lịch" và danh sách tối đa 6 căn khác còn trống trong cùng khoảng.
- AC2: Given ngày vào ở đã qua, Then báo "ngày đã qua" và khóa nút tạo giữ chỗ.

#### US-083 – Lưu và gửi báo giá
- AC1: Given lưu báo giá, Then có mã báo giá duy nhất và hạn hiệu lực = ngày tạo + tham số (mặc định 3 ngày – BL 5.4).
- AC2: Given chọn ngôn ngữ Anh hoặc Nga, When bấm "Sao chép gửi Zalo", Then văn bản báo giá bằng đúng ngôn ngữ đó, có ngày hết hiệu lực.
- AC3: Given báo giá đã hết hiệu lực, When tạo giữ chỗ từ báo giá đó, Then hệ thống yêu cầu tính lại giá trước.

#### US-084 – Tạo đơn giữ chỗ
- AC1: Given báo giá còn trống, When tạo giữ chỗ hạn 24 giờ, Then đơn "giữ chỗ" hiện trên rack (viền đứt), căn bị chặn bán và có lệnh đồng bộ đóng phòng.
- AC2: Given khách chưa có SĐT, Then không tạo được.
- AC3: Given đơn giữ chỗ dài hạn, Then số tiền cần thu = ký quỹ (và kỳ đầu nếu chính sách yêu cầu) theo BL 5.5; ngắn ngày = cọc theo tham số.

#### US-085 – Hết hạn giữ chỗ
- AC1: Given đơn giữ chỗ hạn 12 giờ chưa cọc, When quá hạn, Then đơn tự xử lý theo tham số chính sách (mặc định: chuyển "đã hủy – hết hạn giữ chỗ", mở phòng) trong vòng 5 phút và người tạo nhận thông báo.
- AC2: Given còn 2 giờ trước hạn, Then đơn xuất hiện trong "Cần chú ý" với thời gian còn lại.

#### US-086 – Xác nhận cọc & sinh hợp đồng
- AC1: Given đơn giữ chỗ ngắn ngày, When xác nhận đã nhận cọc (ghi một lần thu US-119), Then đơn → "đã xác nhận", hạn giữ chỗ bị bỏ.
- AC2: Given đơn giữ chỗ dài hạn 1 năm, When xác nhận ký quỹ, Then sinh hợp đồng với lịch thu theo chu kỳ của kỳ hạn; số tiền mỗi kỳ = (thuê + dịch vụ) × chu kỳ theo công thức BR (khắc phục lệch BL 8.2 #10).
- AC3: Given xác nhận cọc, Then nhật ký ghi số tiền, cách thanh toán, người xác nhận.

#### US-087 – CTV chỉ thấy phần của mình
- AC1: Given CTV Minh Anh đăng nhập, When mở danh sách báo giá/đơn/khách tiềm năng, Then chỉ thấy mục do Minh Anh tạo hoặc được gán.
- AC2: Given CTV mở báo cáo hoa hồng, Then chỉ thấy hoa hồng của mình.

#### US-106 – Mở app khách bằng link/QR
- AC1: Given đơn đã xác nhận, When lễ tân bấm "Gửi link check-in", Then có link riêng của đơn để sao chép; mở link trên điện thoại vào thẳng trang của đơn, không yêu cầu cài app.
- AC2: Given link của đơn A, Then không xem được dữ liệu đơn B; link hết hiệu lực sau ngày trả phòng + tham số.
- AC3: Given thông tin nhạy cảm (giấy tờ, hóa đơn), Then cần thêm một bước xác minh nhẹ (ví dụ 4 số cuối SĐT) – cách làm do SEC/ARC chốt.

#### US-107 – Check-in online
- AC1: Given khách sắp đến, When hoàn tất 3 bước (giấy tờ từng người → giờ đến dự kiến → đồng ý lưu giấy tờ), Then đơn có trạng thái khai báo "Đã nhận trước qua app" và lễ tân thấy giờ đến.
- AC2: Given khách bỏ dở ở bước 2, When mở lại link, Then tiếp tục từ bước còn dở, dữ liệu đã nhập vẫn còn.
- AC3: Given chưa tích đồng ý, Then không hoàn tất được.

#### US-108 – Thông tin lưu trú
- AC1: Given đơn đã xác nhận, Then trang hiện ngày nhận/trả, giờ chuẩn nhận/trả, địa chỉ + chỉ đường, nội quy (gồm phí phạt thuốc lá, thẻ phòng theo tham số).
- AC2: Given trước ngày nhận phòng, Then mã cửa và Wi-Fi bị ẩn với dòng "sẽ hiện vào ngày nhận phòng"; từ ngày nhận phòng thì hiện (US-128).

#### US-109 – Khách gửi yêu cầu
- AC1: Given khách chọn "Báo hỏng" và ghi chú "Không có nước nóng", When gửi, Then thấy thẻ "Đã nhận" với thời điểm và trạng thái.
- AC2: Given nhân viên đánh dấu xử lý xong, Then trạng thái trên trang khách đổi thành "Đã xử lý".

#### US-110 – Định tuyến yêu cầu
- AC1: Given yêu cầu "Báo hỏng", Then tạo phiếu sửa mức Trung bình nguồn "App khách"; "Dọn phòng thêm"/"Khăn, đồ dùng" → việc buồng phòng; "Đặt xe, tour"/"Trả muộn"/"Khác" → việc lễ tân (BL 5.19).
- AC2: Given yêu cầu "Khác" chưa được xử lý sau thời gian cam kết (mặc định 10 phút – BL 5.19), Then lễ tân nhận nhắc.

#### US-111 – Khách xem folio
- AC1: Given đơn có tiền phòng, 1 dòng minibar, đã cọc, Then trang khách hiện các dòng, tổng, đã trả, còn phải trả khớp với chi tiết đơn ở Desk.
- AC2: Given folio có dòng nội bộ (ví dụ ghi chú, giá vốn), Then không hiện cho khách.

#### US-112 – App khách tiếng Anh
- AC1: Given khách bấm chuyển "English", Then mọi chữ trên trang (menu, nút, thông báo lỗi, trạng thái yêu cầu) là tiếng Anh; không còn chuỗi tiếng Việt cố định.
- AC2: Given hồ sơ khách có ngôn ngữ "English", When mở link lần đầu, Then trang mặc định tiếng Anh.

#### US-119 – Ghi nhận thu tiền
- AC1: Given đơn tổng 2.460.000 đã cọc 800.000, When ghi thu 1.660.000 bằng chuyển khoản, Then còn phải thu = 0 và đơn có 2 lần thu với cách thanh toán, người thu, thời điểm.
- AC2: Given đơn OTA "đã thu qua OTA", Then tiền phòng không cộng vào còn phải thu tại quầy, chỉ phát sinh phải thu.
- AC3: Given ghi thu sai, Then chỉ hủy được bằng bút toán đảo có lý do (không xóa).

#### US-120 – VietQR
- AC1: Given còn phải thu 1.660.000 và cách thanh toán chuyển khoản, Then hiện mã VietQR theo chuẩn với số tiền 1.660.000 và nội dung = mã bill/đơn không dấu cách.
- AC2: Given chưa cấu hình tài khoản nhận (chờ ESC tài khoản), Then không hiện QR giả mà hiện thông báo "Chưa cấu hình tài khoản nhận" cho quản lý.

#### US-125 – Mẫu tin nhắn đa ngôn ngữ
- AC1: Given đơn của khách ngôn ngữ Nga, When chọn mẫu "Link check-in", Then văn bản tiếng Nga có tên khách, ngày nhận/trả, link check-in đã điền sẵn và nút sao chép.
- AC2: Given đổi ngôn ngữ sang Anh/Việt, Then nội dung đổi tương ứng mà dữ liệu đơn giữ nguyên.

#### US-128 – Mã cửa trong đơn
- AC1: Given lễ tân nhập mã cửa và hiệu lực từ ngày nhận tới ngày trả, Then app khách hiện mã từ ngày nhận phòng và ẩn sau ngày trả.
- AC2: Given tài khoản buồng phòng hoặc CTV, Then không thấy mã cửa của khách.

---

## 5. Ghi chú cho các vai
- **DOM:** mọi con số trong AC đang là mặc định từ BL; khi `business-rules.md` có mã BR, PO sẽ thay bằng mã. Các AC phụ thuộc chính sách đã gắn "chờ ESC".
- **BA:** US-002, US-003, US-020, US-048, US-080, US-087 phụ thuộc `rbac-matrix.md`; US-020, US-053, US-061 phụ thuộc `state-machines.md`.
- **QA:** mỗi AC ở mục 4 là một ca kiểm thử tối thiểu; số liệu ví dụ lấy từ dữ liệu mẫu BL.
- **ARC:** các story có yêu cầu thời gian/đồng thời: US-018, US-023, US-031, US-042, US-085 (job theo lịch, giờ Việt Nam).

## 6. Lịch sử thay đổi
| Ngày | Round | Thay đổi | Người |
|---|---|---|---|
| 15/10/2026 | 1 (đợt 1) | Bản đầu: 19 epic, 132 story, AC cho 71 story Must R2 | PO |
