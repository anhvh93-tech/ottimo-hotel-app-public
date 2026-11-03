# DOM review – Tài liệu BUG-R4-025: một đơn có thể có hơn một yêu cầu hoàn

- Người review: DOM | Round 4 – Review (QC v1.0.3 mục 11.4: gộp ĐK5 release notes và ĐK11 sổ tay) | Ngày: 04/11/2026
- Tác giả: BA (sổ tay 1.10, bộ hướng dẫn 1.8 – `2b7d60b8`, `abb7ee48`), PO (release notes – `3292b047`, `abb7ee48`).
- Phạm vi (chỉ Markdown): `product/docs/manual/user-manual-v1.0.md` mục 1.8 khối "Đơn có hơn một yêu cầu hoàn", 2.14 bước 6, 2.14a nhánh ngắn ngày, 5.6, lịch sử 1.10; `guides/01-chu-dau-tu-quan-ly.md` mục 4 khối mới, 7.3; `guides/02-le-tan.md` 11.1 bước 6, 11.5.2; `guides/00-index.md` dòng 1.8; `product/docs/release-notes.md` v1.0.2 dòng **Nút Trả sớm – đơn ngắn ngày**, v1.0.3 Giới hạn đã biết dòng "Duyệt hoàn…".
- Đối chiếu: QA `rounds/round-04/qa/v1.0.2-dk10-b18.md` (2.2 OTM-00379, 2.3 OTM-00380, 5); BA `rounds/round-04/reviews/BA-on-release-notes-BUG-R4-025.md` và phản hồi PO; QC `rounds/round-04/qc/v1.0.3-gate.md` 11.2, 11.4, 11.5; decision-log 04/11 (ORC phân xử nhánh "lớn hơn"); BR-428, BR-522 (`product/docs/business-rules.md`); hợp đồng E15-05 (`openapi.yaml` dòng 3744, 3878–3884, 5980, 6641). Mã thật để xác nhận nhãn và đường tiền:
  - `product/apps/admin-web/src/pages/stay/CheckOutPage.tsx` `BillDialog` dòng 1975–2006: Phiếu thanh toán có các dòng **Tổng cộng**, **Đã thu**, **Đã hoàn … (cách)**, **Còn phải thu**, **Hoàn lại khách … đ** (= `creditVnd`).
  - `ReservationDrawer.tsx` dòng 145: "Đã thu = `paidVnd` (refunds not taken off)"; nút **Xem Phiếu thanh toán** chỉ có khi đơn **Đã trả phòng** (dòng 376); dòng "Khách đã trả phòng và còn dư…" và nút **Đề nghị hoàn …** chỉ hiện khi còn phần chưa có yêu cầu (dòng 732–741).
  - `services/api/src/modules/folio/public/folio.service.ts` dòng 448 (`creditVnd = đã thu của OTTIMO − đã hoàn − phần OTA không trả`), `refundAboveFreeCredit` (3128), `refundsDownToCredit` (3476), `carriedOrigin` (3241); `refund-plan.ts` (vượt thì đóng **mọi** yêu cầu đang chờ, tạo **một** yêu cầu mới); `approval.service.ts` dòng 877 và `payments/internal/refunds.service.ts` dòng 108 (SEC-BE-45: yêu cầu bị đóng thì xóa nơi nhận).
- Góc nhìn: chủ đầu tư (người duyệt và chi hoàn duy nhất hiện nay), quản lý, lễ tân trả phòng lúc khách đứng ở quầy.

## Kết luận: **ĐẠT CÓ ĐIỀU KIỆN**

Phần chính đúng nghiệp vụ và đúng Desk: trả phòng không tạo lại khoản **Trả sớm**, chỉ hỏi phần trả thừa khác, số Desk hiện ở bước **Bill & thu tiền** là phần chưa có yêu cầu, hai yêu cầu cho hai khoản khác nhau không phải hoàn trùng. Ba con đường "bằng / lớn hơn / bất thường" đã có. Câu cho lễ tân và quản lý nhất quán giữa sổ tay, `01`, `02` và release notes. Không mâu thuẫn E15-05, BR-522, ESC-048 B ở phần chính. BR-428 còn câu nhánh OTA sai, nhưng đó là việc của DOM (xem Ghi chú cho ORC).

Còn **2 thẻ Major**. Cả hai nằm ở chính danh sách kiểm mà người duyệt dùng để không từ chối nhầm:
- **01:** cách tính "số trả thừa" (**Đã thu** trừ **Tổng cộng**) không trừ **Đã hoàn**. Bước 1 cũng chỉ đếm yêu cầu ở **Cần duyệt**, bỏ sót yêu cầu đã duyệt mà chưa chi. Ca hay gặp nhất là yêu cầu Trả sớm đã chi tiền mặt lúc trả phòng, rồi có thêm yêu cầu 800.000. Ở ca này người duyệt tính ra "nhỏ hơn" hoặc "bất thường", trong khi đơn đúng. Hậu quả là giữ lại hoặc từ chối khoản đúng của khách.
- **02:** nhánh "lớn hơn" bảo "duyệt yêu cầu mới đó". Nhưng yêu cầu mới **không có nơi nhận hoàn**: Desk xóa tài khoản của yêu cầu đã đóng. Nếu không nhập lại nơi nhận, khoản hoàn kẹt ở bước chi trong khi khách đã về. Desk cũng đóng **mọi** yêu cầu đang chờ của đơn, không chỉ yêu cầu vượt.

Cả hai thẻ chỉ cần sửa vài câu:
- **Release notes:** sửa thẻ PO-RN025-01, 02 **trước P0** (ĐK5).
- **Sổ tay, `01`, `02`:** sửa thẻ BA-025-01, 02 **trước khi UXD dựng lại HTML** và trước khi ORC báo INV "v1.0.3 đã lên" (ĐK11).

Còn 3 Minor và 2 Suggestion, dời được. **Không có ESC mới**: không có chính sách hay vấn đề pháp lý phải hỏi INV.

---

### FB-R4-DOM-BA-025-01
- Mức độ: Major
- Vị trí: `user-manual-v1.0.md` mục 1.8 khối "Đơn có hơn một yêu cầu hoàn" bước 1, 2, 3, 6; `guides/01-chu-dau-tu-quan-ly.md` mục 4 cùng khối, bước 1, 2, 3, 6. (Release notes: thẻ PO-RN025-01.)
- Vấn đề:
  1. **Bước 2: số trả thừa = Đã thu trừ Tổng cộng.** Trên Desk, **Đã thu** là tổng tiền đã thu, chưa trừ các khoản đã hoàn (`ReservationDrawer.tsx` dòng 145; Phiếu có dòng **Đã hoàn …** riêng). Số Desk dùng để chặn là `creditVnd` = đã thu − **đã hoàn** − phần khách còn phải trả. Phiếu hiện số này ở dòng **Hoàn lại khách … đ**.
  2. **Bước 1 chỉ cộng yêu cầu "đang chờ" ở Cần duyệt.** Theo BR-522 và E15-05, yêu cầu còn mở gồm yêu cầu **chờ duyệt** và yêu cầu **đã duyệt nhưng chưa chi đủ**. Yêu cầu đã duyệt không còn nằm ở **Cần duyệt**.
  3. Ví dụ theo OTM-00380, ca hay gặp ở OTTIMO. Yêu cầu Trả sớm 400.000 được duyệt, lễ tân ca khác chi tiền mặt lúc khách trả phòng. B18 tạo thêm yêu cầu 800.000 cho đêm FOC đã thu. Phiếu ghi Tổng cộng 1.200.000, Đã thu 2.400.000, Đã hoàn 400.000 (tiền mặt), Hoàn lại khách 800.000.
     - Theo bước 1–2: 2.400.000 − 1.200.000 = 1.200.000, lớn hơn 800.000 đang chờ, nên rơi vào **bước 6 "nhỏ hơn"**.
     - Bước 6 bảo tìm dòng "Khách đã trả phòng và còn dư …". Desk **không** hiện dòng này, vì phần chưa có yêu cầu là 0.
     - Người duyệt không khớp được số, nên dừng (bước 5) hoặc nghi yêu cầu 800.000 sai rồi từ chối.
     - Ca thứ hai: 400.000 đã duyệt, chưa chi, còn 800.000 chờ. Bước 1 cũng ra "nhỏ hơn" như trên.
  4. **Đơn OTA thu hộ.** **Đã thu** gồm cả tiền OTA (`ota_collect`). Phép trừ tay có thể ra số trả thừa mà OTTIMO không phải hoàn. Dòng **Hoàn lại khách** đã tính phần này đúng.
- Vì sao quan trọng: khối này viết ra để người duyệt **không** từ chối nhầm. Nếu phép đối chiếu sai ở ca phổ biến nhất (khoản Trả sớm chi trước, khoản thứ hai chờ sau), người duyệt sẽ từ chối hoặc giữ lại khoản đúng. Khách chậm nhận tiền hoặc mất 800.000, rồi khiếu nại sau khi đã về. Desk vẫn chặn chi trùng và chi quá. Vì vậy lỗi này không làm OTTIMO mất tiền, nhưng làm khách mất tiền: đúng loại rủi ro QC 11.4 nêu.
- Đề xuất sửa (sổ tay 1.8 và `01` mục 4, cùng chữ):
  1. "Cộng các yêu cầu hoàn **còn mở** của cùng mã đơn: **Chờ duyệt** (ở **Cần duyệt**) và **Đã duyệt** nhưng chưa chi đủ (ở **Nhật ký tiền → Hoàn tiền**, tìm theo mã đơn). Khoản đã chi xong không cộng."
  2. "Lấy số Desk còn nợ khách: dòng **Hoàn lại khách … đ** trên **Phiếu thanh toán** (khung đơn → **Xem Phiếu thanh toán**). Desk đã trừ các khoản **Đã hoàn** và phần OTA giữ. Không tự lấy **Đã thu** trừ **Tổng cộng**."
  3, 4, 5: giữ, nhưng so với số ở bước 2 mới.
  6. "Tổng **nhỏ hơn** số ở bước 2, và khung đơn hiện 'Khách đã trả phòng và còn dư …': gửi **Đề nghị hoàn …** cho phần đó (mục 1.11). Khung đơn không hiện dòng này thì tính lại theo bước 1–2. Vẫn lệch thì làm như bước 5, không tạo yêu cầu bằng cách khác."
  - Ví dụ một dòng cho người duyệt: "Đã hoàn 400.000 tiền mặt, còn chờ 800.000, Phiếu ghi **Hoàn lại khách 800.000 đ** → bằng → duyệt."
- Trạng thái: Open

### FB-R4-DOM-PO-RN025-01
- Mức độ: Major
- Vị trí: `product/docs/release-notes.md` v1.0.3 → Giới hạn đã biết, dòng "Duyệt hoàn: một đơn có thể có hơn một yêu cầu hoàn", cụm "(**Đã thu** trừ **Tổng cộng** trên **Phiếu thanh toán** của đơn)" và "cộng các yêu cầu đang chờ".
- Vấn đề: cùng lỗi với thẻ BA-025-01. Release notes là chỗ chủ đầu tư (người duyệt) đọc trước tiên.
- Vì sao quan trọng: như thẻ BA-025-01. Release notes bắt buộc đúng trước P0 (ĐK5).
- Đề xuất sửa: thay hai cụm trên bằng "cộng các yêu cầu hoàn còn mở của đơn (chờ duyệt và đã duyệt chưa chi), đối chiếu với dòng **Hoàn lại khách … đ** trên **Phiếu thanh toán** của đơn (Desk đã trừ khoản đã hoàn)". Phần còn lại giữ.
- Trạng thái: Open

### FB-R4-DOM-BA-025-02
- Mức độ: Major
- Vị trí: `user-manual-v1.0.md` 1.8 khối mới bước 4; `01` mục 4 bước 4. (Release notes: thẻ PO-RN025-02.)
- Vấn đề: bước 4 viết "yêu cầu vượt thì Desk báo … tự đóng và tự tạo yêu cầu mới đúng số còn lại; duyệt yêu cầu mới đó". Theo mã, ý này đúng về tiền nhưng thiếu 3 điều người duyệt sẽ gặp:
  1. **Desk đóng mọi yêu cầu đang chờ của đơn, không chỉ yêu cầu đang bấm**, rồi tạo **một** yêu cầu mới = số trả thừa − các yêu cầu đã duyệt chưa chi (`refund-plan.ts`; `refundsDownToCredit`). Ví dụ đơn có 400.000 và 800.000 đang chờ, sau đó số trả thừa giảm còn 700.000:
     - Bấm **Duyệt** 800.000 trước: Desk đóng **cả hai** (400.000 và 800.000) và tạo **một** yêu cầu 700.000.
     - Bấm 400.000 trước: duyệt được, vì chưa vượt. Bấm tiếp 800.000: Desk đóng 800.000 và tạo yêu cầu 300.000.
     - Người đang "duyệt từng yêu cầu" thấy yêu cầu thứ hai biến mất, dễ nghĩ là lỗi. Tiền vẫn đúng ở cả hai thứ tự.
  2. **Yêu cầu mới chưa có nơi nhận hoàn.** Yêu cầu bị đóng thì Desk xóa tài khoản đã nhập (SEC-BE-45, `approval.service.ts` dòng 877, `refunds.service.ts` dòng 108). Yêu cầu mới được tạo không kèm nơi nhận (`carriedOrigin` chỉ mang người tạo, nguồn và cấp duyệt).
     - Không nhập lại thì chuyển khoản không chi được.
     - Lúc này khách thường đã về, nên phải liên lạc xin lại số tài khoản.
  3. **Lý do của yêu cầu mới là lý do chung "trả thừa"**, không ghi "từ Trả sớm". Người duyệt có thể tưởng đây là "yêu cầu không rõ từ đâu" và dừng theo bước 5.
  - Người tạo yêu cầu mới là người tạo yêu cầu cũ (`refundAboveFreeCredit` gọi với `actor: null`). Vì vậy chủ đầu tư hoặc quản lý duyệt tiếp được, không vướng luật không tự duyệt. Phần này tài liệu đúng.
- Vì sao quan trọng: đây là nhánh ORC vừa chốt (04/11) và QA đã gặp thật ở OTM-00379. Làm theo chữ hiện tại thì khoản hoàn đúng số nhưng kẹt ở bước chi: "Cách hoàn" trống, nên chủ đầu tư bấm chi không được. Khách đã về, OTTIMO phải xin lại số tài khoản qua điện thoại. Việc này vừa chậm vừa thêm một lần trao đổi dữ liệu nhạy cảm.
- Đề xuất sửa: bước 4 thêm sau "duyệt yêu cầu mới đó":
  > Desk có thể đóng **cả các yêu cầu khác đang chờ** của đơn và gộp thành **một** yêu cầu mới, lý do "trả thừa". Đó là yêu cầu thay thế, không phải yêu cầu lạ. Yêu cầu mới **chưa có nơi nhận hoàn**: trước khi chi, người tạo yêu cầu cũ (hoặc chủ đầu tư) mở **Nhật ký tiền → Hoàn tiền** → dòng của mã đơn → **Nhập nơi nhận hoàn** (mục 1.12) trên máy đã cấp quyền. Cộng lại theo bước 1–2 sau khi duyệt.
  - QA xác nhận một lần trên staging. Yêu cầu 1.017.000 thay thế ở OTM-00379 phải **không** có "Cách hoàn". Nếu có, BA bỏ câu "chưa có nơi nhận". Đây là kiểm bằng cách đọc dữ liệu, QA không chi tiền.
- Trạng thái: Open

### FB-R4-DOM-PO-RN025-02
- Mức độ: Major
- Vị trí: `release-notes.md` v1.0.3 dòng "Duyệt hoàn…", câu "tự tạo yêu cầu mới đúng số; duyệt yêu cầu mới đó".
- Vấn đề: như thẻ BA-025-02, ý 1 và 2.
- Vì sao quan trọng: chủ đầu tư là người duyệt và chi. Nếu chỉ đọc release notes, chủ đầu tư không biết phải nhập lại nơi nhận.
- Đề xuất sửa: sau "duyệt yêu cầu mới đó" thêm "(Desk có thể gộp các yêu cầu đang chờ của đơn thành một; yêu cầu mới chưa có nơi nhận hoàn, nhập lại trước khi chi – sổ tay 1.8 bước 4)".
- Trạng thái: Open

### FB-R4-DOM-BA-025-03
- Mức độ: Minor
- Vị trí: sổ tay 1.8 khối mới bước 3; `01` mục 4 bước 3; release notes câu "Tổng **bằng** số trả thừa thì các yêu cầu đều đúng".
- Vấn đề: "bằng thì các yêu cầu đều đúng" nói quá. Tổng bằng số trả thừa chỉ chứng minh **không có yêu cầu trùng nhau**. Nó không chứng minh **khoản trả thừa là thật**. Ví dụ lễ tân ghi trùng một khoản thu tiền mặt 800.000: Desk thấy trả thừa 800.000, B18 tạo đề nghị hoàn 800.000, tổng "bằng". Desk chỉ chặn chi khi khoản thu tạo ra tiền thừa là chuyển khoản chưa đối soát (BR-522, BR-527). Ghi trùng tiền mặt thì Desk không chặn, chỉ lộ ra khi đóng ca.
- Vì sao quan trọng: người duyệt là lớp kiểm cuối trước khi tiền ra khỏi OTTIMO. Câu "đều đúng, duyệt" có thể khiến người duyệt bỏ qua việc đọc lý do (sổ tay 1.8 bước 2 "Đọc: … lý do"). Rủi ro thấp ở OTTIMO (10 căn, chủ đầu tư duyệt), nên để Minor.
- Đề xuất sửa: "Tổng **bằng** số ở bước 2: **không có hoàn trùng**. Không từ chối chỉ vì đơn có hai yêu cầu: từ chối nhầm thì khách mất tiền. Vẫn đọc lý do từng yêu cầu như mọi yêu cầu hoàn (FOC đã duyệt, trả sớm, cọc lớn hơn bill). Lý do không khớp folio thì hỏi người tạo trước khi duyệt." Release notes: đổi "các yêu cầu đều đúng" thành "không có hoàn trùng".
- Trạng thái: Open

### FB-R4-DOM-BA-025-04
- Mức độ: Minor
- Vị trí: sổ tay 1.8 khối mới bước 6 và 2.14 bước 6; `01` mục 4 bước 6; `02` 11.1 bước 6.
- Vấn đề: khối mới áp cho mọi đơn, không loại **đơn HĐ thuê tháng**. QA GN-R4-QA-02 (backlog 5.6) đã gặp ca: tiền thuê ghi trên folio (qua API, hoặc nhập sai) thì B18 coi toàn bộ là trả thừa, lựa chọn của lễ tân chỉ có "Hoàn lại khách". Theo khối mới, tổng 0 nhỏ hơn số trả thừa, nên người duyệt sẽ gửi **Đề nghị hoàn** cho tiền thuê tháng đang ở. Việc này trái ESC-048 B: tháng đang ở không hoàn, ký quỹ và tiền thuê xử lý ngoài app.
- Vì sao quan trọng: đây là luồng tiền ra. Hiện Desk không ghi được tiền thuê HĐ (sổ tay 2.7), và yêu cầu vẫn qua chủ đầu tư duyệt. Vì vậy ca này hiếm, để Minor. Nhưng câu "gửi Đề nghị hoàn cho phần đó" viết chung cho mọi đơn là đường sai duy nhất có thể dẫn tới hoàn nhầm tiền.
- Đề xuất sửa: thêm vào cuối khối (sổ tay 1.8, `01` mục 4) và vào 2.14 / 11.1 bước 6 một dòng: "**Đơn HĐ thuê tháng** (dài hạn nhập tay): không hoàn theo khối này. Desk báo trả thừa thì không chọn hoàn, dừng, hỏi chủ đầu tư; tiền thuê và ký quỹ xử lý ngoài app theo 2.14a nhánh HĐ và 2.7."
- Trạng thái: Open

### FB-R4-DOM-BA-025-05
- Mức độ: Minor
- Vị trí: sổ tay 2.14 bước 6; `02` 11.1 bước 6 (gạch "Chọn hoàn thì đơn có **thêm một** đề nghị hoàn…").
- Vấn đề: bước 6 bảo lễ tân ghi lý do nhưng không nhắc **Nhập nơi nhận hoàn** cho đề nghị hoàn thứ hai. Lúc trả phòng là lúc duy nhất khách còn đứng ở quầy để đưa số tài khoản. Mục 12.2 (`02`) và 2.17 (sổ tay) có nói "người tạo nhập nơi nhận ngay". Tuy vậy, ở mục Trả sớm (11.5.2) tài liệu nhắc lại việc này, còn ở bước 6 thì không. Lễ tân làm theo từng bước sẽ bỏ sót. Lễ tân cũng chưa có câu nói với khách: khách sẽ nhận hai lần chuyển (ví dụ 400.000 và 800.000). Khách thấy một khoản tới trước có thể nghĩ OTTIMO hoàn thiếu.
- Vì sao quan trọng: thiếu nơi nhận thì khoản hoàn kẹt, phải gọi khách sau khi khách đã về. Khách nhận hai khoản lẻ mà không được báo trước dễ khiếu nại "hoàn thiếu".
- Đề xuất sửa: thêm gạch thứ ba ở 2.14 / 11.1 bước 6:
  > Nhập nơi nhận hoàn ngay khi khách còn ở quầy (mục 12.2), trên máy đã cấp quyền. Đơn đã có yêu cầu Trả sớm: báo khách tổng số hoàn và số lần chuyển, ví dụ "You will receive 1,200,000 VND back in two transfers: 400,000 and 800,000 VND." / "OTTIMO sẽ hoàn anh/chị 1.200.000 đ, chuyển làm hai lần: 400.000 đ và 800.000 đ."
  - Câu nói với khách theo giọng văn brand OTTIMO: ngắn, lịch sự, tiếng Anh dẫn, tiếng Việt hỗ trợ, không emoji. UXD hoặc CPY chỉnh chữ nếu cần. Tới v1.0.4 (GN-R4-QA-03), lễ tân đọc số chờ hoàn ở **Nhật ký tiền → Hoàn tiền**, vì bước Bill chưa hiện số này.
- Trạng thái: Open

### FB-R4-DOM-BA-025-06
- Mức độ: Suggestion
- Vị trí: sổ tay 1.8 khối mới bước 5; `01` mục 4 bước 5 ("không rõ một yêu cầu từ đâu").
- Vấn đề: ngoài Trả sớm và Trả phòng, Desk còn tạo yêu cầu hoàn đúng từ các nguồn khác: hủy đơn có cọc, "Tự sinh từ khoản thu …" (thu thêm trên folio đã chốt), "Tự sinh từ A32: …" (giảm dòng sau trả phòng), và yêu cầu thay thế sau khi tự đóng (thẻ 02). Người duyệt không biết các nguồn này sẽ dừng không cần thiết.
- Vì sao quan trọng: mỗi lần dừng là một lần khách chờ thêm tiền hoàn. Hiện một người duyệt, nên không có ai gỡ hộ.
- Đề xuất sửa: một câu ở bước 5: "Các nguồn Desk tự ghi: Trả sớm, Trả phòng (lý do lễ tân ghi), hủy đơn, 'Tự sinh từ khoản thu …', 'Tự sinh từ A32 …', yêu cầu thay thế sau khi tự đóng (lý do 'trả thừa'). Ngoài các nguồn này mới là 'không rõ từ đâu'."
- Trạng thái: Open

### FB-R4-DOM-BA-025-07
- Mức độ: Suggestion
- Vị trí: sổ tay 1.8 khối mới bước 2; `01` mục 4 bước 2 và 7.3 (nhánh ngắn ngày).
- Vấn đề: bước 2 dẫn tới **Xem Phiếu thanh toán**. Nút này chỉ có khi đơn **Đã trả phòng**. Yêu cầu Trả sớm thường được tạo khi khách còn ở. Trong lúc khách còn ở, người duyệt không có Phiếu để đối chiếu. Khung đơn cũng không có dòng **Tổng cộng** (BA thẻ RN025-03).
- Vì sao quan trọng: người duyệt mở Cần duyệt lúc khách chưa về sẽ không làm được bước 2.
- Đề xuất sửa: thêm vào bước 2: "Đơn chưa trả phòng thì chưa có Phiếu. Lúc này thường chỉ có một yêu cầu (Trả sớm), cứ duyệt bình thường: Desk không cho chi quá số khách trả thừa. Nên chi sau khi khách trả phòng, vì bill cuối có thể thêm minibar hoặc phụ thu." Thứ tự "duyệt trong lúc ở, chi sau trả phòng" là cách quầy khách sạn Việt Nam hay làm (NGÀNH). Cách này cũng tránh nhánh tự đóng ở thẻ 02, nơi yêu cầu mới mất nơi nhận.
- Trạng thái: Open

---

## Kiểm theo yêu cầu của ORC

| Điểm kiểm | Kết quả |
|---|---|
| Đúng thực tế quầy và quản lý khách sạn VN | Đúng: hai khoản hoàn cho hai lý do, người duyệt đối chiếu theo mã đơn, không duyệt bằng trí nhớ. Còn thiếu nơi nhận hoàn (thẻ 02, 05) và câu nói với khách (thẻ 05) |
| Con đường **bằng** | Rõ. Câu "đều đúng" nói quá (thẻ 03) |
| Con đường **lớn hơn** | Rõ hướng (Duyệt, Desk tự đóng), khớp ORC 04/11 và QA OTM-00379. Thiếu: gộp nhiều yêu cầu, yêu cầu mới không có nơi nhận (thẻ 02) |
| Con đường **nhỏ hơn** | Phép đối chiếu sai khi đã có khoản chi hoặc yêu cầu đã duyệt (thẻ 01). Chưa loại HĐ tháng (thẻ 04) |
| Con đường **bất thường** | Rõ: dừng, không duyệt, không chi, ghi sổ giao ca, báo. Nên liệt kê nguồn hợp lệ (thẻ 06) |
| Đường làm **khách mất tiền** | Có một: thẻ 01 (đối chiếu sai → từ chối nhầm). Sửa trước P0 / trước báo INV |
| Đường **chi trùng / chi quá** | Không có trên Desk: chi ≤ số đã duyệt và ≤ `creditVnd`, duyệt vượt thì tự đóng (BR-522, `refundAboveFreeCredit`). Đường duy nhất qua tài liệu là hoàn tiền thuê HĐ tháng (thẻ 04, hiếm) |
| Nhất quán sổ tay ↔ `01` ↔ `02` ↔ release notes | Nhất quán: cùng tên bước **Bill & thu tiền**, cùng ví dụ đêm FOC, cùng câu Desk "Yêu cầu không còn cần duyệt nên đã tự đóng." (`approval.auto_cancel.other`), "Khách đã trả thừa … đ. Chọn cách xử lý." (`checkout.blocked_credit`), "Khách đã trả phòng và còn dư …" (`refund.settled_credit`). Release notes "báo đội kỹ thuật", sổ tay "báo chủ đầu tư và đội kỹ thuật": khớp người đọc. Các thẻ 01–02 phải sửa cùng chữ ở cả hai nơi |
| BR-428 | Câu chính "không tạo trùng" khớp. Câu nhánh OTA "là yêu cầu hoàn duy nhất của đơn, trả phòng sau đó không tạo thêm" **trái** tài liệu mới: việc của DOM, xem Ghi chú |
| BR-522 / E15-05 | Khớp: số hỏi ở B18 = `unhandledCreditVnd`, yêu cầu mở gồm chờ duyệt và đã duyệt chưa chi (thẻ 01 đưa ý này vào tài liệu) |
| ESC-048 B | Phần chính không đụng. Bước 6 chưa loại HĐ tháng (thẻ 04) |
| Chữ Desk `early_departure.row_refund_help` | Sổ tay 5.6, `02` 11.5.2, release notes đã báo câu thiếu ngoại lệ, dặn làm theo tài liệu. Đúng cách xử lý tới v1.0.4 |

## Ghi chú cho ORC

1. **BR-428 câu nhánh OTA**: DOM sửa ở lượt BR kế tiếp, như backlog 5.6 "BUG-R4-025 – phần BR-428" (đích v1.0.4, không chặn v1.0.3). Câu mới: "phần hoàn tạo **một** yêu cầu hoàn cho khoản trả sớm; trả phòng không tạo lại khoản này, chỉ hỏi phần trả thừa khác (BR-522 số dư thừa chưa xử lý)". Ví dụ Agoda 302 giữ nguyên. DOM không sửa trong lượt review này.
2. **Gộp 2 yêu cầu thành 1**: DOM **không** đề nghị gộp ở v1.0.4. Hai yêu cầu có hai lý do khác nhau thì dễ đối soát hơn, khi lý do ghi rõ (thẻ 05). Thẻ 02 cho thấy gộp tự động còn làm mất nơi nhận. Việc nên làm là GN-R4-QA-01 (chạy `refundPlan` ngay lúc `checkOut`, ARC trả lời) cộng với **giữ nơi nhận khi Desk tạo yêu cầu thay thế**. Việc thứ hai DOM đề nghị PO thêm vào backlog 5.6 cho ARC + SEC, vì đụng SEC-BE-45 (giữ tài khoản sang yêu cầu thay thế). Đích v1.0.4.
3. **Kiểm trên staging cho thẻ 02**: QA đọc yêu cầu thay thế 1.017.000 của OTM-00379 (Nhật ký tiền → Hoàn tiền) có "Cách hoàn" hay không. Chỉ đọc, không chi.
4. ĐK11: UXD dựng lại HTML sau khi BA sửa thẻ 01, 02. Thẻ 03–05 nếu BA sửa cùng lượt thì không cần dựng thêm lần nữa.

## Điểm làm tốt (nên giữ)

- Bước 6 của Trả phòng nói đúng điều lễ tân cần biết nhất: "Số Desk hiện chỉ là phần **chưa có** yêu cầu hoàn". Lễ tân không phải tự trừ, không tạo lại khoản Trả sớm. Câu khớp mã (`unhandledCreditVnd`).
- Gợi ý ghi lý do "đêm 05/11 đã thu, được FOC" để người duyệt đối chiếu. Nhờ đó yêu cầu thứ hai tự giải thích, đúng cách quầy làm khi chuyển việc cho người duyệt vắng mặt.
- Nhánh "lớn hơn" theo ORC chọn đúng hướng: bấm Duyệt để Desk tự tính lại, không bảo người duyệt tự trừ hay từ chối. Bước "bất thường" có đủ dừng, không chi, ghi sổ giao ca kèm số.

## Dòng đề xuất decision-log (ORC ghi khi commit)

`| 2026-11-04 | 4 | DOM – review tài liệu BUG-R4-025 (sổ tay 1.10, guides 1.8, release notes v1.0.2/v1.0.3; QC v1.0.3 11.4, ĐK5 + ĐK11): **ĐẠT CÓ ĐK**. 2 Major phải sửa: (01) đối chiếu "Đã thu trừ Tổng cộng" không trừ Đã hoàn và bỏ yêu cầu đã duyệt chưa chi → ca Trả sớm đã chi tiền mặt + yêu cầu 800.000 bị coi "nhỏ hơn/bất thường", người duyệt có thể từ chối khoản đúng; sửa: cộng yêu cầu còn mở (chờ duyệt + đã duyệt chưa chi), so với dòng "Hoàn lại khách … đ" trên Phiếu thanh toán; (02) nhánh "lớn hơn": Desk đóng mọi yêu cầu đang chờ và gộp một yêu cầu mới, lý do "trả thừa", chưa có nơi nhận (SEC-BE-45) → nhập lại nơi nhận trước khi chi. Release notes (PO-RN025-01, 02) sửa trước P0; sổ tay/01 (BA-025-01, 02) sửa trước khi UXD dựng HTML và ORC báo INV v1.0.3 đã lên. 3 Minor (bằng = không trùng, vẫn đọc lý do; loại HĐ tháng khỏi bước 6 – ESC-048 B; lễ tân nhập nơi nhận và báo khách hai lần chuyển ở B18) + 2 Suggestion dời được. Không ESC mới. DOM sửa câu nhánh OTA BR-428 ở lượt BR kế tiếp; đề nghị backlog 5.6 thêm "giữ nơi nhận khi tạo yêu cầu thay thế" (ARC + SEC, v1.0.4); không gộp 2 yêu cầu | DOM | Quyền DOM (tính đúng nghiệp vụ); rounds/round-04/reviews/DOM-on-BUG-R4-025-docs.md |`
