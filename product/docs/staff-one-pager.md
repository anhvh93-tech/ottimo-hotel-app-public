# OTTIMO Desk – Hướng dẫn 1 trang cho nhân viên

Dành cho lễ tân và buồng phòng · Bản 30/10/2026, sửa 07/11/2026 · Hướng dẫn đầy đủ: Sổ tay OTTIMO Desk v1.0 · In 4 tờ, mỗi tờ một mặt (cách in và chỗ dán: cuối tệp).

<!-- Lịch sử sửa (bản in bỏ qua): Lập PO + DOM. 26/10: nhận phòng từ 12:00. 27/10: kiểm phòng do lễ tân trưởng, minibar buồng phòng báo số – lễ tân nhập, in phiếu; tối 27/10 (BA theo SEC): QR "vừa đổi tài khoản nhận", mã cửa không qua tin nhắn, báo lỗi không kèm dữ liệu khách. 30/10 (PO, theo `v1.0.0`): In phiếu dùng được; rà giữ chỗ quá hạn; check-in online tạm dừng tới v1.0.1; tờ thông báo giấy tờ. 30/10 tối (PO, Phản hồi & sửa – rounds/round-03/responses/PO-to-v1.0.0-docs-reviews.md): sắp thành 4 tờ theo UXD (FB-R3-UXD-PO-DT1-04, quyết định dàn trang UXD mục 2) – chỉ chuyển chỗ; giữ chỗ quá hạn theo quyết định DOM (DOM-on-PO-v1.0.0-docs.md mục A: rà 3 mốc, sau hạn Desk v1.0.0 chỉ còn Hủy, có cọc thì để nguyên – làm lại khi khách đến; chưa cọc thì hủy ngay – tạo lại 1 lần); chỗ tìm giữ chỗ theo BA M13-02; chỉ tờ thông báo TRƯỚC khi nhận giấy tờ (SEC D01 = UXD DT1-01); câu đồng ý và tờ "Your ID details" theo chữ UXD mục 1.1–1.2 (dựa trên SEC mục B); OTTIMO hiện 1 người trực giữ 6 vai (decision-log 29/10). 30/10 khuya (PO, Phản hồi & sửa theo QA thử luồng trên staging – rounds/round-03/qa/qa3-rc1.md mục 20.7; PO-to-v1.0.0-docs-reviews.md mục 10): Tờ 2a – không dùng lý do "Khác (ghi rõ)" (BUG-R3-046), người trực nhập nơi nhận hoàn – chủ đầu tư duyệt và chi (SELF_APPROVAL_FORBIDDEN / SELF_REFUND_FORBIDDEN), đơn mới thu đủ cọc ngay khi đặt (DEPOSIT_INSUFFICIENT); cắt chữ trong cùng tờ để vừa A5 10 pt (bỏ chú thích Hôm nay/Sơ đồ phòng – đã có ở sổ tay 2.4). Tờ 1 – tách "Hoàn tiền" khỏi dòng hạn mức (hoàn không có hạn mức tự duyệt); bù chỗ bằng cách rút câu khách tới 12:00–14:00. Tờ 4 không đổi. 06/11/2026 (PO, Round 5 Gói 0, theo BA `rounds/round-05/outputs/BA/report.md` mục 4 và QC R4 ĐK-5): check-in online mở lại từ 06/11 cùng v1.0.4 (runbook v1.0.4 N1–N5, SEC N4 ĐẠT) – khối "tạm dừng từ 02/11" bỏ khỏi Tờ 2a, Tờ 1 thêm khối "Check-in online" theo sổ tay 2.9 và `guides/02` 17.3 (chỉ đơn đã xác nhận, gửi riêng 1–1, không kèm mã cửa, gửi nhầm thì thu hồi và tạo link mới, chủ đầu tư báo dừng thì ngừng – N6); Tờ 2a bỏ các câu v1.0.4 đã làm sai (Desk chưa báo ở Cần chú ý, "Khác" khóa nút hủy, sau hạn chỉ còn Hủy với giữ chỗ có cọc, hủy đơn cũ rồi đặt mới) theo release notes v1.0.4 bảng "Giữ chỗ và cọc" (BUG-R3-042…047, BR-303). Chờ DOM, SEC đọc lại; chủ đầu tư in lại Tờ 1 và Tờ 2a. Tờ 2a viết lại hẳn cùng sổ tay 2.4 ở V5-71. 06/11 tối (PO, Phản hồi & sửa theo rounds/round-05/reviews/SEC-on-ba-dk4-dk5.md mục 3): Tờ 1 "Gửi nhầm người" thêm ghi sổ giao ca và báo chủ đầu tư trong ngày (FB-R5-SEC-PO-01, SEC quyết thay giả định "không báo" của PO), lệnh dừng tách gạch riêng; "Gửi riêng 1–1" chỉ tới liên hệ ghi trên đơn (PO-02); Tờ 2a bỏ vế chú thích "Điều kiện bỏ khối check-in" (PO-03). SEC: Tờ 2a được in (phần giữ chỗ chờ DOM); Tờ 1 in sau khi SEC đọc lại dòng "Gửi nhầm người". 06/11 tối (PO, Phản hồi & sửa theo DOM rounds/round-05/reviews/DOM-on-staff-one-pager-2a.md): Tờ 2a – giữ chỗ chưa cọc tự hủy khi hết hạn, báo khách ngay, rà đơn Đã hủy lý do "Hết hạn giữ chỗ" ở mốc 11:00 và cuối ca (FB-R5-DOM-PO-01); xác nhận cọc sau hạn chỉ khi thấy tiền về (02); "cần quản lý duyệt" – người tạo không tự duyệt, nơi nhận hoàn (03); khách đến mà đơn vẫn giữ chỗ (04); điều kiện gỡ tờ (05); sổ giao ca "chờ chủ đầu tư hoàn" (06). Tờ 1 dòng "Cọc" thêm "(có cọc: xem Tờ 2a)" (02). 06/11 khuya (PO, theo SEC rounds/round-05/reviews/SEC-on-ba-dk4-dk5.md mục 3a lượt 3): Tờ 2a nơi nhận hoàn chọn nút "Cùng cách khách đã trả", không hỏi số tài khoản (FB-R5-SEC-PO-04); Tờ 1 "ảnh chụp, SMS khách gửi không tính", Tờ 2a Giờ nhận tiền "không sớm hơn" tin báo tiền vào (PO-05); chú thích gỡ tờ (PO-06). 06/11 khuya (PO, theo DOM lượt 2, thẻ FB-R5-DOM-PO-07 "bản gộp" nguyên văn, và rules-v1.0.5 mục 11): rà giữ chỗ theo mã đơn ghi ở sổ giao ca (nút Tất cả chỉ hiện 100 đơn đầu; sale, CTV không nhận tin tự hủy); kiểm tiền về trước khi hủy hoặc báo khách; tiền về mà đơn đã tự hủy thì đặt lại cùng căn, cùng giá, hoặc chủ đầu tư hoàn đủ. Tờ 1 không đổi. Không vừa A5 10 pt: in 9 pt, hoặc chuyển phần "Đơn để nguyên" của dòng Sổ giao ca sang sổ tay 2.4; giữ nguyên ba câu bản gộp và câu nơi nhận hoàn của SEC. 06/11 khuya (PO, theo ORC sau bản in UXD `bb67605d`; plan R5 quyết định 21): Tờ 1 giữ 8,25 pt, không dời khối chữ; Tờ 2a A4 dọc in riêng 11 pt, Tờ 2b hai bản trên một A4 cắt đôi; sửa bảng "Cách in và dán" và ghi chú khổ giấy; "OTM-…" trên Tờ 2a bọc mã để in bằng JetBrains Mono như Tờ 1. Không đổi chữ. 06/11 khuya (ORC dán nguyên văn chữ DOM `rules-v1.0.5.md` 11.2, `e9e0e2e4`; QA BUG-R5-002): Tờ 2a dòng "Quá hạn vài phút…" – Desk v1.0.4 chỉ cho Hủy giữ chỗ với giữ chỗ quá hạn chưa nhận đồng nào, nên bỏ câu "Tiền về trước hạn → Xác nhận đã nhận cọc", thay bằng hủy rồi đặt lại. 07/11/2026 (BA theo ORC, V5-71, V5-1B; ARC `rounds/round-05/reviews/ARC-on-be-pr-100-d1.md` mục 5, FB-R5-ARC-MOB-V51B-01): Tờ 2a ghi rõ **hộp Thông báo trên app nhân viên** (Desk không có hộp Thông báo); câu tin ở v1.0.4 là câu chung "Thông báo mới – xem chi tiết trên OTTIMO Desk" (sửa câu cũ "app báo Giữ chỗ chưa cọc đã hết hạn và tự hủy", chỉ đúng từ v1.0.5); từ v1.0.5 mọi tài khoản đang hoạt động có vai lễ tân, lễ tân trưởng nhận tin. Vẫn rà theo mã đơn. Chờ PO, DOM đọc lại; UXD dựng lại bản in. 07/11/2026 (PO, Review – rounds/round-05/reviews/PO-on-ba-v105-docs.md): phần BA sửa đúng mã (hold-notices.ts, notifications.tsx: câu chung staff.notif.k.other kèm mã đơn; app nhân viên nhận vai lễ tân; Desk không có hộp Thông báo). Theo DOM FB-R5-DOM-PO-08 (Major, rounds/round-05/reviews/DOM-on-ba-v105-docs.md, da9ac25d), chữ thay nguyên văn: dòng Ở đâu – tin không đổ chuông (push vẫn Mock), tin chỉ để nhắc, làm theo trạng thái đơn; tới v1.0.5 câu chung kèm mã đơn có thể là một trong ba loại tin giữ chỗ (tài khoản 6 vai nhận cả ba); dòng Hết hạn, chưa cọc – nhận ra theo đơn Đã hủy lý do Hết hạn giữ chỗ, kiểm tiền về rồi báo khách. Không vừa 11 pt thì bỏ câu "Tới v1.0.5…" khi v1.0.5 lên, không cắt "Tin chỉ để nhắc…". Bảng Cách in: Tờ 2a in bản 07/11 khi PDF dựng lại (câu "chưa in tới khi sửa dòng Hết hạn, chưa cọc" đã cũ). Câu "Từ v1.0.5" đúng khi MOB #117 lên cùng tag với #100 (plan R5 mục 4a). 07/11/2026 (DOM đọc lại lần cuối, FB-R5-DOM-PO-08 Closed – rounds/round-05/reviews/DOM-on-ba-v105-docs.md mục 1): chữ Tờ 2a đúng nguyên văn; chỉ sửa câu in lại ở bảng Cách in – tách Tờ 1 (bản 06/11) với Tờ 2a (chỉ in bản 07/11), không đổi ý. 07/11/2026 tối (PO, ORC giao, Round 5 – Phản hồi & sửa; theo SEC runbook sự cố dữ liệu khách bản 1.1 `3174ce65`, product/docs/runbook-su-co-du-lieu-khach.md mục 4 nhánh A bước 1–2 và mục 6, DOM V574-01, V574-03): Tờ 1 dòng Gửi nhầm người thêm tin kèm gì (chỉ loại, theo mẫu dòng ghi mục 6), không chụp hội thoại, nhắn thẳng chủ đầu tư đúng dòng sổ giao ca trong ngày, có ghi lạ thì gọi ngay; khớp `guides/02` 17.3 bước 5. Bảng Cách in: in lại Tờ 1 bản 07/11. Dòng bản ở đầu tệp (in ở chân mọi tờ) rút còn "Bản 30/10/2026, sửa 07/11/2026" để chân Tờ 1 vừa một dòng; nội dung các lần sửa 06/11 (check-in online mở lại; giữ chỗ quá hạn theo v1.0.4) và 07/11 (Tờ 2a: hộp Thông báo trên app nhân viên; Tờ 1: gửi nhầm link) ghi ở lịch sử này và bảng Cách in. Tờ 2a đã dựng bản 07/11 giữ chân cũ tới lần dựng sau, không phải in lại vì chân tờ. -->
<!-- PO 27/10 (L2 trong rounds/round-03/outputs/BA/manual-report.md), QA xác nhận Q6, Q7 (rounds/round-03/qa/manual-check.md): phần buồng phòng đúng với v1.0.0 (8b3aec8) – hk_self_inspection_enabled = false, nút kiểm phòng chỉ cho vai lễ tân trưởng trở lên; app nhân viên không có màn đếm minibar. Căn cứ BR-401 v0.4.6, BR-415, BR-802. -->

---

## Tờ 1 – Quầy lễ tân

<!-- A4 một mặt, 2 cột, Be Vietnam Pro 8,25 pt (`product/docs/print/pdf/to-1-quay-le-tan.pdf`; UXD dựng lại `bb67605d`: 9 pt bị tràn). Giữ 8,25 pt, không dời khối chữ sang tờ khác: chữ đã qua SEC và DOM (plan R5 quyết định 21). Dán phía trong quầy, chỗ nhân viên – không để khách đọc (SEC D06). -->

Desk (máy quầy): `desk.ottimo.vn` · App buồng phòng (điện thoại): `staff.ottimo.vn`

**Hiện OTTIMO có một người trực quầy, giữ cả 6 vai.** Chỗ nào ghi "lễ tân trưởng" hay "quản lý" là chính bạn, làm bằng quyền của vai đó và luôn ghi lý do. Chủ đầu tư xem lại mỗi sáng. Khi OTTIMO có thêm lễ tân, việc rà làm ở đầu mỗi ca và việc quyết đơn có cọc thiếu chuyển về quản lý.

### Luôn nhớ
- **Mỗi người một tài khoản.** Không dùng chung, không đọc mật khẩu qua điện thoại, không gõ mật khẩu cho người khác. Rời máy thì đăng xuất.
- **Giấy tờ khách chỉ nằm trên Desk.** Không chụp, không gửi qua Zalo, không lưu trên điện thoại cá nhân.
- **Mã cửa không gửi qua Zalo, tin nhắn, email hay ảnh**, kể cả gõ tay. Chỉ đọc tại quầy, hoặc lễ tân **tự gọi ra** số điện thoại trên đơn – khi khách đã nhận phòng trên Desk, có giấy tờ, đã thu đủ. Không đọc mã cho người gọi đến. Không mở cửa căn cho người tự nhận là khách.
- **Ngày trên Desk đổi lúc 06:00**, không phải 00:00. Từ 00:00 đến 05:59 vẫn là ngày hôm trước.
- Ba ngày đầu: ghi thêm **sổ giấy** (đơn, thu tiền), đối chiếu lúc 22:00.

### Giờ cần nhớ
| Giờ | Việc |
|---|---|
| 06:00 | Ngày mới trên Desk |
| 12:00 | Giờ trả phòng. Trả muộn: Desk tự tính phụ thu theo giờ |
| 12:00 | **Nhận phòng từ 12:00** nếu căn đã sẵn sàng (đã dọn hoặc đã kiểm – `VC`/`VI`), **không** phụ thu. Nhận trước 12:00: Desk tự tính phụ thu (khách OTA: chỉ thu khi kênh đó đã đăng giờ nhận 12:00 – xem danh sách kênh chủ đầu tư đưa) |
| 14:00 | Mọi căn có khách đến hôm nay **chắc chắn sẵn sàng** |
| 18:00 | Khách chưa đến, chưa báo giờ: gọi hoặc nhắn khách |
| 23:00 | Vẫn không liên lạc được: đánh dấu "Không đến". Hạn khai báo lưu trú khách Việt Nam (đến từ 23:00 thì trước 08:00 hôm sau) |
| +12 giờ | Hạn khai báo khách nước ngoài, tính từ giờ nhận phòng |

### Lễ tân
**Mở quầy:** mở **Hôm nay** → xem khách đến, khách đi, **Cần chú ý**. Xử lý từ dòng đỏ trở xuống. Rà giữ chỗ theo **Tờ 2a**.

**Đặt phòng:** từ **Sơ đồ phòng** hoặc **Đơn đặt phòng**. Đơn Trực tiếp, CTV bắt buộc có số điện thoại và nguồn. Đơn OTA mới: nhập Desk **ngay**, rồi đóng phòng trên extranet các kênh khác.

**Cọc:** gửi khách mã VietQR từ đơn, **từ điện thoại của cơ sở** (không mở Zalo trên máy quầy). Nội dung chuyển khoản là mã đơn. Chỉ bấm **Xác nhận đã nhận cọc** khi thấy tiền về tài khoản của OTTIMO (ảnh chụp, SMS khách gửi không tính), và bấm **trước giờ hạn** giữ chỗ (có cọc: xem Tờ 2a). Khách chuyển thiếu: gọi ngay xin phần còn lại trước hạn. Thấy **Giữ chỗ sắp hết hạn**: gọi khách; cần thêm giờ thì **Gia hạn giữ chỗ (1 lần)** ngay – sau hạn không gia hạn được.

**Mã VietQR hiện dòng "Tài khoản nhận vừa đổi":** **chưa cho khách chuyển**. Gọi điện cho chủ đầu tư (số đã lưu ở điện thoại cơ sở) xác nhận trước; chủ đầu tư đồng ý mới tiếp. Không gọi được thì mời khách trả tiền mặt hoặc thẻ.

**Giờ nhận phòng nói với khách:** "Nhận phòng từ 12:00. Phòng luôn sẵn sàng lúc 14:00." (EN: "Check-in is from 12:00. Your room is always ready by 14:00."). **Không** hứa "phòng sẵn sàng từ 12:00". Khách tới 12:00–14:00 mà căn chưa xong: giữ hành lý, hẹn giờ; không phụ thu, không giảm giá. Quá 14:00 vẫn chưa xong: đổi căn sẵn sàng hoặc nâng hạng (quyền lễ tân trưởng, quản lý), ghi lý do.

**Check-in online – mở lại từ 06/11/2026.** Khách không làm online thì làm giấy tờ tại quầy như cũ.
- **Chỉ đơn đã xác nhận.** Đơn giữ chỗ: xác nhận cọc trước. Mở đơn → **Tạo link check-in online** → **Sao chép link**. Link chỉ hiện một lần. Không chụp màn hình hộp link.
- **Gửi riêng 1–1** tới số, email hoặc hội thoại OTA **ghi trên đơn**, từ điện thoại cơ sở hoặc email của OTTIMO. Người xin link từ số khác: không gửi. Không gửi vào nhóm chat. **Không kèm mã cửa** hay số căn. Sale, CTV không gửi link.
- **Gửi nhầm người:** **Thu hồi link** ngay. Nhầm do mình gửi: tạo link mới, gửi tới liên hệ trên đơn. Đã gửi đúng liên hệ trên đơn mà vẫn nhầm, hoặc không chắc: **không gửi link mới**, không nhắn thêm; khách làm thủ tục tại quầy. Không sửa liên hệ theo lời người khác. Ghi sổ giao ca: mã đơn, ngày giờ gửi, **tin kèm gì** (chỉ link / có tên / có ngày ở / có căn; ghi loại, không chép nội dung), giờ thu hồi, kênh. Không ghi tên khách, tên hay số người nhận nhầm; không chụp hội thoại. **Nhắn thẳng chủ đầu tư** đúng dòng đó, trong ngày. Đơn đã hiện **Đã làm thủ tục trước**, giờ đến hay yêu cầu mới mà khách nói chưa gửi: không dùng giấy tờ đó, **gọi chủ đầu tư ngay**.
- Chủ đầu tư báo "dừng check-in online": ngừng tạo, ngừng gửi link tới khi được báo mở lại.

**Nhận phòng:** buồng đã sạch; đã thu đủ phần còn lại (đơn trực tiếp); có giấy tờ người đứng tên **trước khi** giao mã cửa. **Trước khi nhận giấy tờ**, chỉ khách tờ **Your ID details** trên quầy: "Before I take your ID, please read this note on how we use it." / "Trước khi nhận giấy tờ, mời anh/chị đọc tờ này về cách chúng tôi dùng thông tin." Rồi nhập giấy tờ ở bước Giấy tờ, khai báo lưu trú và đánh dấu "đã khai" ở **Giấy tờ & khai báo** trước hạn.

**Hỏi khách đồng ý lưu ảnh giấy tờ** – ở Khối 1 "Đối chiếu và đồng ý lưu ảnh". Chỉ hỏi khi có chụp ảnh giấy tờ, hỏi từng người lớn được chụp. Khách đang ở lúc chuyển đổi ngày D không chụp lại ảnh, không hỏi. Đọc đúng số ngày N Desk hiện. Gọi khách là "anh" hoặc "chị", không đọc "anh/chị".
- EN: "May we keep photos of your ID for N days after check-out? They are then deleted automatically. If you'd rather not, that's fine – we use them only to register your stay, then delete them."
- VI: "Anh/chị có đồng ý cho OTTIMO lưu ảnh giấy tờ N ngày sau khi trả phòng không? Sau đó ảnh tự xóa. Anh/chị không đồng ý cũng không sao, chúng tôi chỉ dùng ảnh để khai báo lưu trú rồi xóa."
- Ghi câu trả lời trên Desk. Khách không đồng ý vẫn ở bình thường. Khách không đọc được tờ EN/VI: đọc to câu hạn lưu (đoạn 3 của tờ).

**Trả phòng – 3 bước:** minibar (nhập **số còn lại** từng món theo số buồng phòng báo) → phụ phí → bill & thu tiền. Khách chưa trả đủ: ghi công nợ bằng quyền quản lý.

**Phiếu thanh toán:** khung đơn đã trả phòng → **Xem Phiếu thanh toán** → chọn **Tiếng Việt** hoặc **Việt – Anh**. Bấm **In phiếu** → hộp in của trình duyệt in một tờ A4. Khách cần bản điện tử: chọn "Lưu dưới dạng PDF" trong hộp in rồi gửi riêng 1–1 cho khách. Không chụp màn hình phiếu gửi qua chat.

**Miễn, giảm, xóa nợ:** trong hạn mức của bạn thì Desk áp ngay, luôn ghi lý do. Vượt hạn mức: gửi yêu cầu, người có quyền duyệt ở **Cần duyệt** bằng tài khoản của chính mình. **Hoàn tiền:** người tạo yêu cầu không tự duyệt, không tự chi – hiện chủ đầu tư duyệt và chi. **Không** gõ mật khẩu người khác vào màn của bạn.

**Kiểm phòng (vai lễ tân trưởng):** đăng nhập `staff.ottimo.vn` trên điện thoại. Nhận thông báo **Căn đã dọn – chờ kiểm** → mở căn → **Kiểm phòng** → đi hết danh mục → **Kiểm đạt – sẵn sàng**, hoặc **Chưa đạt** (ghi chỗ chưa đạt; căn quay về cần dọn). Căn trống từ đêm qua có khách đến hôm nay: kiểm xong **trước 12:00**.

**Trước khi rời quầy:** "Cần chú ý" không còn dòng đỏ chưa xử lý. Ba ngày đầu: so sổ giấy với Desk lúc 22:00.

### Khi có sự cố
- **Mất mạng:** thử 4G điện thoại của cơ sở phát Wi-Fi cho máy quầy → app trên điện thoại cơ sở → sổ giấy. Chưa xem được phòng trống thì không nhận đơn mới, ghi số điện thoại và hẹn gọi lại. Có mạng lại thì nhập bù trong 24 giờ, ghi giờ thật.
- **Desk báo lỗi, tính sai tiền, không làm tiếp được:** ghi bằng lời căn, mã đơn, giờ, đã bấm gì, Desk báo gì và mã tham chiếu. **Không** ghi tên, số điện thoại, số giấy tờ của khách; **không** chụp màn hình có dữ liệu khách để gửi đi. Báo chủ đầu tư. Không đặt được, không nhận/trả phòng được hay sai tiền là lỗi "P0", đội sửa trong ngày; trong lúc chờ, ghi sổ giấy.

---

## Tờ 2a – Giữ chỗ quá hạn (tạm)

<!-- A4 dọc một mặt, 2 cột, 11 pt, viền Light Oak, in riêng (`product/docs/print/pdf/to-2a-giu-cho-qua-han-a4.pdf`; UXD dựng lại `bb67605d`: khổ A5 chỉ vừa 8 pt). Dán cạnh Tờ 1, phía nhân viên. Gỡ khi chủ đầu tư báo hết tạm. Khối check-in online đã bỏ 06/11/2026 (mở lại cùng v1.0.4; cách gửi link chuyển sang Tờ 1). Gỡ khi: (1) sổ tay 2.4 viết lại theo v1.0.4 (V5-71); (2) đội báo tin giữ chỗ quá hạn đã chạy đúng trên production (release notes v1.0.4, "Việc anh/chị làm sau khi lên" mục 5). Sửa 06/11 tối theo DOM rounds/round-05/reviews/DOM-on-staff-one-pager-2a.md (FB-R5-DOM-PO-01…06). Gỡ tờ này thì sửa Tờ 1 dòng Cọc: "xem Tờ 2a" → "xem sổ tay 2.4" (FB-R5-SEC-PO-06). -->

**Gỡ tờ này khi chủ đầu tư báo hết tạm** (sau khi sổ tay 2.4 viết lại theo v1.0.4).

**Rà giữ chỗ – 3 mốc mỗi ngày** (từ 06/11 Desk cũng báo giữ chỗ quá hạn ở **Cần chú ý** và khối **Giữ chỗ chờ cọc** trên **Hôm nay**; vẫn rà đủ 3 mốc)
- **Khi nào:** lúc mở quầy (muộn nhất 09:00) · **11:00** · trước khi rời quầy (muộn nhất 21:00) · mỗi lần thấy **Giữ chỗ sắp hết hạn**.
- **Ở đâu:** **Đơn đặt phòng** → lọc **Đang hiệu lực** → mở từng dòng **Giữ chỗ · chờ cọc**. Mỗi mốc và mỗi lần thấy **Giữ chỗ sắp hết hạn**: ghi vào sổ giao ca mã đơn và giờ hạn của mọi giữ chỗ chờ cọc, cả đơn sale, CTV tạo. Mốc sau: mã nào không còn trong **Đang hiệu lực** → gõ mã vào ô tìm, bấm **Tất cả**. Đơn **Đã hủy**, lý do **Hết hạn giữ chỗ**: kiểm tiền về theo mã đơn (không thấy thì hỏi chủ đầu tư), rồi báo khách (đơn sale, CTV: báo người đó trước). **Hộp Thông báo trên app nhân viên** (Desk không có; máy hoặc điện thoại ở quầy đăng nhập app trong ca). Tin không đổ chuông: mở hộp ở mỗi mốc. Tin chỉ để nhắc: gõ mã đơn trong tin vào ô tìm, bấm **Tất cả**, làm theo trạng thái đơn. Tới v1.0.5 mọi tin giữ chỗ là câu chung "Thông báo mới – xem chi tiết trên OTTIMO Desk" kèm mã đơn. Tin đó có thể là giữ chỗ tự hủy (chỉ đơn bạn tạo), giữ chỗ có cọc đã quá hạn, hoặc giữ chỗ còn chờ cọc sau 12:00 ngày đến. Từ v1.0.5 mỗi loại có câu riêng; tin "Giữ chỗ chưa cọc đã hết hạn và tự hủy" tới mọi lễ tân, lễ tân trưởng. Có tin vẫn rà theo mã đơn.
- **Còn dưới 2 giờ:** xử lý **trước hạn** – thu đủ rồi xác nhận, gia hạn 1 lần, hoặc hủy (Tờ 1, dòng Cọc).
- **Hết hạn, chưa cọc:** Desk **tự hủy** và nhả căn: đơn **Đã hủy**, lý do **Hết hạn giữ chỗ** (tin ở hộp Thông báo: dòng **Ở đâu**). Kiểm tiền về theo mã đơn, rồi **báo khách ngay** (đơn CTV: báo CTV trước). Khách còn muốn: đến từ ngày mai → giữ chỗ mới **12 h**, chỉ một lần; đến hôm nay → gửi VietQR, tạo đơn khi tiền về. Quá hạn vài phút mà đơn vẫn **Giữ chỗ · chờ cọc**: Desk chỉ còn nút **Hủy giữ chỗ**, kể cả khi tiền về trước hạn. Kiểm tiền về theo mã đơn, rồi **Hủy giữ chỗ**, lý do **Khác (ghi rõ)**: "Quá hạn, Desk chưa tự hủy". Tiền đã về → đặt lại ngay theo dòng **Tiền đã về mà đơn đã tự hủy**. Chưa về → báo khách như trên. Cả hai: ghi sổ giao ca, báo chủ đầu tư.
- **Tiền đã về mà đơn đã tự hủy** (cả khi khách chuyển theo mã QR cũ): căn còn trống → giữ chỗ mới cùng căn, cùng giá → **Xác nhận đã nhận cọc**, Giờ nhận tiền để bây giờ, Ghi chú "Tiền về hh:mm dd/mm theo mã `OTM-…`". Căn đã bán và khách không nhận căn khác cùng hạng → báo chủ đầu tư hoàn đủ; sổ giao ca ghi "`OTM-…` tiền về sau tự hủy – chờ chủ đầu tư hoàn". Không tự hứa ngày hoàn.
- **Hết hạn, có cọc** ("0h00" đỏ): **không** tự hủy, căn vẫn giữ (khung đơn ghi "Quá hạn giữ chỗ lúc … nên đơn chưa hủy, căn vẫn giữ"). Không tạo đơn mới chồng lên. Gọi khách.
  - **Không đi**, hoặc không liên lạc được tới 11:00 ngày đến → **Hủy giữ chỗ**. Lý do: **Không liên lạc được**, **Khách đổi ý** hoặc **Khác (ghi rõ)**. Hộp hủy ghi "Không thu phí. Sẽ tạo yêu cầu hoàn … – cần quản lý duyệt": bạn là người tạo nên không tự duyệt được, **chủ đầu tư duyệt và chi**. Nơi nhận: **Nhật ký tiền → Hoàn tiền** → **Nhập nơi nhận hoàn** → **Cùng cách khách đã trả** (Desk chọn sẵn Tiền mặt: đổi lại). Không hỏi số tài khoản. Khách xin hoàn vào tài khoản khác: không nhập, báo chủ đầu tư.
  - **Vẫn đi** → **để nguyên đơn**. Khách chuyển nốt: thấy tiền về tài khoản OTTIMO thì **Xác nhận đã nhận cọc** (sau hạn vẫn bấm được với giữ chỗ đã có cọc); ô **Giờ nhận tiền** ghi đúng giờ trên tin báo tiền vào, không sớm hơn, không sau bây giờ. Khách hẹn trả phần còn lại khi đến: quản lý tích **Chấp nhận cọc thiếu**, ghi lý do.
  - **Khách đến mà đơn vẫn Giữ chỗ · chờ cọc:** thu phần cọc còn thiếu → **Xác nhận đã nhận cọc** (Giờ nhận tiền = giờ thu) → **Nhận phòng**, thu phần còn lại như mọi đơn. Khách chỉ trả được lúc trả phòng: quản lý tích **Chấp nhận cọc thiếu**, ghi lý do. **Không hủy đơn cũ để đặt lại.**
- **Sổ giao ca:** mỗi đơn đã xử lý một dòng: mã đơn, đã làm gì, lý do thật. Đơn để nguyên: "`OTM-…` Giữ – cọc thiếu …, thu khi đến – [người quyết] dd/mm". Đơn có cọc đã hủy: "chờ chủ đầu tư hoàn"; khách hỏi thì báo chủ đầu tư, không hứa ngày. Không ghi tên khách.
- **Trước khi rời quầy:** mọi giữ chỗ có cọc đã quá hạn đã xử lý (hủy, xác nhận cọc, hoặc có dòng "Giữ – …" trong sổ giao ca); mọi khách có giữ chỗ tự hủy hôm nay đã được báo.


---

## Tờ 2b – Khách ở quá 18:00 mà đêm đó căn đã bán

<!-- A5 một mặt. In hai bản trên một tờ A4 rồi cắt đôi (`product/docs/print/pdf/to-2b-a4-2-ban.pdf`); không còn in chung với 2a (UXD `bb67605d`). Kẹp sau Tờ 1 hoặc trong bìa quầy. Không gỡ khi v1.0.1 lên. -->

1. Phòng trước: từ 12:00, chốt giờ đi với khách đi hôm nay nếu căn có khách đến tối nay.
2. Khách vẫn ở quá 18:00: đổi căn cho **khách sắp đến** sang căn trống khác (quyền lễ tân trưởng, quản lý; cùng hạng trước, lý do "OTTIMO đổi căn"). Khi đó Desk tính thêm 1 đêm cho khách ở quá giờ như thường.
3. Không còn căn trống: **gọi chủ đầu tư** báo trước. Không chờ duyệt, không xin mật khẩu. Trên Desk chọn **"Ghi phụ thu – quản lý xem lại"**: Desk hiện số bằng giá 1 đêm của đêm đó, không sửa được, không có ô miễn. Ghi lý do (ví dụ "Rời 20:30, căn có khách đến tối nay"), thu đủ số Desk hiện, hoàn tất trả phòng.
4. Khách xin giảm: không hứa. Nói OTTIMO xem lại trong 24 giờ, nếu được giảm OTTIMO sẽ hoàn lại. Khách không chịu trả: không hoàn tất trả phòng, gọi chủ đầu tư.
5. Xem lại (chủ đầu tư, hoặc quản lý): trong 24 giờ mở **Cần chú ý**. Đồng ý thì bấm "Đã xem". Nên giảm thì sửa dòng phụ thu trên bill, Desk tự tạo yêu cầu hoàn; chủ đầu tư duyệt hoàn. Quá 24 giờ, bill đóng, không sửa được nữa.

---

## Tờ 3 – Buồng phòng (điện thoại)

<!-- A4 một mặt, 10 pt. Dán ở phòng buồng / kho đồ vải. -->

App buồng phòng: `staff.ottimo.vn`

### Luôn nhớ
- **Mỗi người một tài khoản.** Không dùng chung, không đọc mật khẩu qua điện thoại, không gõ mật khẩu cho người khác. Rời máy thì đăng xuất.
- **Giấy tờ khách chỉ nằm trên Desk.** Không chụp, không gửi qua Zalo, không lưu trên điện thoại cá nhân.
- **Mã cửa không gửi qua Zalo, tin nhắn, email hay ảnh**, kể cả gõ tay. Không đọc mã cho người gọi đến. Không mở cửa căn cho người tự nhận là khách.

### Việc hằng ngày
- Mở **Việc của tôi**, làm từ trên xuống. Mỗi căn: **Bắt đầu dọn** → **Dọn xong**. Căn trống chuyển **Đã dọn – chờ kiểm**; **lễ tân trưởng kiểm** rồi báo sẵn sàng. Ở v1.0 buồng phòng **không tự kiểm**. Desk cập nhật ngay.
- **Căn có khách đến hôm nay:** căn trống từ đêm qua → rà lại đầu ca sáng, dọn nếu cần, để lễ tân trưởng kiểm xong **trước 12:00**. Căn khách trả rồi khách mới đến cùng ngày → dọn ngay khi khách trả, bấm **Dọn xong** sớm để căn **sẵn sàng trước 14:00**. Bộ đồ dùng cho người ở thêm: xong trước 12:00.
- **Các căn**: xem trạng thái mọi căn.
- **Khách trả phòng – minibar:** lễ tân báo căn sắp trả → đếm tủ → **báo lễ tân số còn lại từng món** (gọi hoặc nói trực tiếp; tin nhắn nội bộ chỉ ghi số căn và số món, không ghi tên khách). App chưa có màn đếm minibar; lễ tân nhập vào Desk.
- Việc **Bổ sung minibar**: bổ sung xong bấm **Làm xong**.
- Hỏng hóc: **báo sự cố** kèm ảnh hỏng hóc (không chụp khách, không chụp giấy tờ). Căn không ở được thì báo lễ tân khóa bán.
- Đồ khách để quên: báo lễ tân ngay.
- Không thấy giấy tờ của khách trên app: đúng như thiết kế.
- **Không mở cửa căn** cho người nói mình là khách ("quên mã, mở giúp"), kể cả khi họ biết tên khách. Mời ra quầy hoặc gọi lễ tân.
- Trả máy hoặc nghỉ việc: bấm **Đăng xuất** (xóa dữ liệu đã lưu trên máy).

### Khi có sự cố
- **Mất mạng:** app vẫn bấm được; thao tác tự gửi khi có mạng. Đừng xóa dữ liệu trình duyệt.
- **App báo lỗi, không làm tiếp được:** ghi bằng lời căn, giờ, đã bấm gì, app báo gì. **Không** ghi tên khách, **không** chụp màn hình có dữ liệu khách để gửi đi. Báo lễ tân hoặc chủ đầu tư.

---

## Tờ 4 – Your ID details (khách đọc)

<!-- Bản v2 (privacy-2026-10-v2), UXD 04/11/2026 theo SEC-on-plan-v1.0.4 mục 6.2 và 6.4 ý 4: chữ EN và VI chép nguyên văn 4 khóa gw.notice_body, gw.notice_retention, gw.notice_translation, gw.notice_rights, đúng thứ tự trên trang khách; gw.notice_body tách 2 đoạn (câu 1–2, câu 3–4) như bản v1. Chân tờ đổi thành "OTTIMO · ID notice · v2 · 11/2026". Bản v1 giữ trong lịch sử repo (SEC D08). In 3 lần: A4 đặt ở quầy, A5, A4 hai bản cắt đôi. Dán tờ ở quầy sau khi deploy v1.0.4, cùng ngày OWN đặt privacy_notice_version = v2 (6.4 ý 5 bước 2–3); gỡ tờ v1 cùng lúc (FB-R4-PO-UXD-IDS2-01). Khách nói tiếng Nga: tờ EN/RU riêng ở phần "Tờ 4ru" ngay dưới. Quy cách: Lora tiêu đề, Be Vietnam Pro thân, chỉ Ink – Stone Grey – Light Oak trên giấy trắng hoặc ngà, không emoji (rounds/round-03/reviews/UXD-on-PO-v1.0.0-docs.md mục 1.3). Đặt trong khung mica trên quầy, mặt quay ra khách, chỗ khách đứng làm thủ tục, không bị che (SEC S2). Đổi chữ thì đổi dòng chân trang và giữ bản cũ trong lịch sử repo (SEC D08). -->

OTTIMO

**Your ID details**
*Thông tin giấy tờ của bạn*

OTTIMO uses your ID details to register your stay with the police, as required by Vietnamese law. ID photos are encrypted; only reception and managers can see them.

We will ask separately whether we may keep your ID photos after registration. Saying no does not affect your stay.

ID photos and saved ID details are deleted within 3 months after check-out, unless the law requires us to keep them longer. Copies in our encrypted backups are deleted within a further 35 days.

We may use a translation service, such as Google Translate, to read your messages and reply to you. The text we translate may include your name, contact, stay details and message. The service handles this text under its own privacy policy, and its servers may be outside Viet Nam.

To see, correct or delete your details, please ask reception.

---

OTTIMO dùng thông tin giấy tờ của bạn để khai báo lưu trú với cơ quan công an theo luật Việt Nam. Ảnh giấy tờ được mã hóa; chỉ lễ tân và quản lý xem được.

Chúng tôi sẽ hỏi riêng bạn có muốn cho lưu ảnh giấy tờ sau khi khai báo hay không. Bạn không đồng ý cũng không ảnh hưởng gì tới việc lưu trú.

Ảnh và thông tin giấy tờ được xóa trong vòng 3 tháng sau khi trả phòng, trừ phần pháp luật yêu cầu lưu lâu hơn. Bản sao trong dữ liệu sao lưu đã mã hóa được xóa trong 35 ngày sau đó.

OTTIMO có thể dùng một dịch vụ dịch, như Google Dịch, để đọc tin nhắn và trả lời bạn. Nội dung được dịch có thể gồm tên, liên hệ, thông tin lưu trú và lời nhắn của bạn. Dịch vụ này xử lý nội dung đó theo chính sách riêng của họ, và máy chủ của họ có thể đặt ngoài Việt Nam.

Muốn xem, sửa hoặc xóa thông tin của bạn, vui lòng hỏi lễ tân.

OTTIMO · ID notice · v2 · 11/2026

---

## Tờ 4ru – Your ID details EN/RU (khách đọc, tiếng Nga)

<!-- UXD 04/11/2026, việc T2–T8 ở rounds/round-04/reviews/UXD-on-privacy-v2-ru.md mục 3.2. Chỉ in A4 dọc, đặt cạnh tờ EN/VI ở quầy. Hai cột: EN bên trái, RU bên phải, mỗi hàng một đoạn. Chữ EN y hệt Tờ 4. Chữ RU chép nguyên văn 4 khóa gw.notice_* RU đã duyệt (SEC-on-privacy-v2-ru.md, UXD-on-privacy-v2-ru.md mục 2); gw.notice_body tách 2 đoạn ở cùng chỗ với EN. Giữ khoảng trắng không ngắt (U+00A0) trong "3 месяцев" và "35 дней"; sửa tệp này thì không gõ lại hai chỗ đó. Dòng phụ RU "Данные ваших документов" do UXD đặt (T4). Font: Lora (tiêu đề, có chữ Kirin), Be Vietnam Pro (cột EN), Onest (cột RU), nhúng trong HTML. Đổi chữ RU thì đổi cả trang khách, đổi version và dòng chân tờ. -->

OTTIMO

**Your ID details**
*Данные ваших документов*

OTTIMO uses your ID details to register your stay with the police, as required by Vietnamese law. ID photos are encrypted; only reception and managers can see them.

We will ask separately whether we may keep your ID photos after registration. Saying no does not affect your stay.

ID photos and saved ID details are deleted within 3 months after check-out, unless the law requires us to keep them longer. Copies in our encrypted backups are deleted within a further 35 days.

We may use a translation service, such as Google Translate, to read your messages and reply to you. The text we translate may include your name, contact, stay details and message. The service handles this text under its own privacy policy, and its servers may be outside Viet Nam.

To see, correct or delete your details, please ask reception.

---

OTTIMO использует данные ваших документов, чтобы зарегистрировать ваше проживание в полиции, как требует закон Вьетнама. Фото документов зашифрованы; их могут видеть только администраторы и управляющие.

Мы отдельно спросим, можно ли нам хранить фото ваших документов после регистрации. Если вы не разрешите, это не повлияет на ваше проживание.

Фото документов и сохранённые данные из них удаляются в течение 3 месяцев после выезда, если закон не обязывает нас хранить их дольше. После удаления они остаются в наших зашифрованных резервных копиях не более 35 дней.

Мы можем пользоваться сервисом перевода, например Google Переводчиком, чтобы читать ваши сообщения и отвечать вам. Переводимый текст может включать ваше имя, контакт, сведения о проживании и текст сообщений. Этот сервис обрабатывает такой текст в соответствии со своей политикой конфиденциальности, и его серверы могут находиться за пределами Вьетнама.

Чтобы посмотреть, исправить или удалить свои данные, обратитесь, пожалуйста, к администратору.

OTTIMO · ID notice · v2 · 11/2026

---

## Cách in và dán (cho chủ đầu tư)

| Tờ | Khổ | Dán ở đâu | Giữ hay thay |
|---|---|---|---|
| 1 – Quầy lễ tân | A4 một mặt, 2 cột, chữ 8,25 pt (`to-1-quay-le-tan.pdf`) | Phía trong quầy, chỗ nhân viên (khách không đọc được) | Giữ |
| 2a – Giữ chỗ quá hạn (tạm) | A4 dọc một mặt, in riêng, chữ 11 pt (`to-2a-giu-cho-qua-han-a4.pdf`) | Cạnh Tờ 1 | Gỡ khi chủ đầu tư báo hết tạm |
| 2b – Khách ở quá 18:00 | A5: hai bản trên một tờ A4, cắt đôi (`to-2b-a4-2-ban.pdf`) | Kẹp sau Tờ 1 hoặc trong bìa quầy | Giữ |
| 3 – Buồng phòng | A4 một mặt | Phòng buồng / kho đồ vải | Giữ |
| 4 – Your ID details (bản v1) | A5 dọc một mặt | – | **Thôi dùng.** Gỡ khỏi quầy đúng lúc dán bản v2 (dòng dưới). Không để hai bản cùng ở quầy |
| 4 – Your ID details (bản v2) | A4 dọc một mặt (hoặc A5) | Khung mica trên quầy, chỗ tờ v1, mặt quay ra khách | Dán sau khi deploy v1.0.4, **cùng ngày** OWN đặt tham số `privacy_notice_version` = `privacy-2026-10-v2` (SEC 6.4 ý 5, bước 2–3). Không dán sớm khi Desk còn ghi v1 |
| 4ru – Your ID details EN/RU | A4 dọc một mặt | Cạnh tờ EN/VI ở quầy, mặt quay ra khách | Dán cùng lúc với tờ v2 |

**In lại Tờ 1 bản sửa 07/11/2026** (gửi nhầm link check-in online: ghi tin kèm gì, nhắn thẳng chủ đầu tư) ngay, PDF đã dựng lại 07/11; chân tờ ghi "sửa 07/11/2026". Không in Tờ 1 bản 06/11. **Tờ 2a: chỉ in bản sửa 07/11/2026** (giữ chỗ quá hạn theo v1.0.4, hộp Thông báo trên app nhân viên; dòng **Hết hạn, chưa cọc** đã sửa theo QA BUG-R5-002) khi đội báo bản PDF đã dựng lại. Không in Tờ 2a bản 06/11. Gỡ bản cũ cùng lúc: bản cũ còn dặn không gửi link. Tờ 2b, 3, 4, 4ru không đổi.

Không in hai mặt. In thử Tờ 4 dưới đèn quầy trước khi dán. Tờ 4 ở quầy phải cùng phiên bản với tham số `privacy_notice_version` trên Desk: chân tờ ghi phiên bản (`v2`), nên đổi tham số ngày nào thì đổi tờ ngày đó.
