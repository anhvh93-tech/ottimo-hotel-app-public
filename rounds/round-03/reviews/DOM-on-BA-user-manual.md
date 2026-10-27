# DOM review BA – Sổ tay sử dụng OTTIMO Desk v1.0

- Người review: DOM | Round 3, bước Review chéo | Ngày: 27/10/2026
- Đối tượng: `product/docs/manual/user-manual-v1.0.md` (bản nội dung 1.0, BA 27/10, áp cho `v1.0.0-rc.3` `70fe734`); `rounds/round-03/outputs/BA/manual-report.md`; `02-escalations/ESC-038.md`
- Căn cứ: `product/docs/business-rules.md` v0.4.7 (BR-101, 104, 107, 110, 305, 307, 309, 311, 401, 411–417, 421–428, 501–502, 521–527, 602–611, 961–964, 978), `decision-log.md` 24–27/10, `day-one-guide.md`, `staff-one-pager.md`, `release-notes.md`, `rbac-matrix.md`, `production-defaults.ts` (tham số thật), mã Desk rc.3 (`allowed-actions.ts`, `ReservationDrawer.tsx`) để kiểm những chỗ sổ tay im lặng.
- Góc nhìn: lễ tân trực một mình lúc 23:00, buồng phòng 2 người cho 10 căn, chủ đầu tư kiêm quản lý và thường không ở cơ sở.

## Kết luận

Sổ tay viết tốt, đúng giọng, đúng tên nút, và đa số con số khớp BR v0.4.7: giá đêm độc lập (BR-101), +15 %/+30 % (BR-104), nhận từ 12:00 và bậc 30 %/50 % (BR-401, 411), trả muộn và đường "Ghi phụ thu – quản lý xem lại" (BR-416 + ESC-031), phụ thu người, hạn mức FOC, hạn lưu ảnh 30 ngày (lên 3 tháng ở v1.0.1).

**Chưa nên dùng để đào tạo** khi còn 2 Blocker:
1. Sổ tay cho gửi **mã cửa qua Zalo**, trái BR-978 và quyết định SEC ngày 17/10.
2. **Khách trả phòng sớm** không có hướng dẫn. Desk rc.3 cũng không có đường làm: nút **Trả phòng** chỉ hiện đúng ngày đi, Desk không có nút "Trả sớm" (US-137 xếp R4+). Tình huống này liên quan tồn phòng, tiền hoàn và khai báo khách nước ngoài.

Ngoài ra có 9 Major, phần lớn là cách tạm của v1.0 khó làm thật ở cơ sở 10 căn:
- Lễ tân không có cách thấy tiền về tài khoản cá nhân của chủ đầu tư. DOM mở **ESC-039**.
- Cách đóng ca tạm thiếu quỹ đầu ca.
- Danh sách xuất hóa đơn chỉ gồm khách lấy hóa đơn công ty.
- Sau 3 ngày đầu không còn dự phòng khi mất mạng.
- Sổ tay thiếu: khách đặt nhiều căn, khách OTA đã trả trước, khách dài hạn trả trễ.

| Mức | Số thẻ |
|---|---|
| Blocker | 2 (01, 02) |
| Major | 9 (03–11) |
| Minor | 11 (12–21, 23) |
| Suggestion | 1 (22) |

---

## Thẻ feedback

### FB-R3-DOM-BA-01
- Mức độ: Blocker
- Vị trí: mục 2.21, dòng "Khách nhờ gửi mã cửa qua Zalo"; mục 2.10 khung "Mã cửa", câu cuối
- Vấn đề:
  - Dòng 2.21 ghi "Gửi mã riêng, không kèm số căn, địa chỉ". Câu cuối 2.10 viết "Không gửi mã cửa trong cùng tin nhắn có số căn hoặc địa chỉ". Cả hai câu đều ngầm cho gửi mã qua tin nhắn.
  - BR-978 (theo SEC C-10, decision-log 17/10 "Không gửi mã cửa qua Zalo (ZNS/OA/chat) và hội thoại OTA"): mã cửa **không** gửi qua Zalo, kể cả chat gõ tay, và không qua hội thoại OTA. Ở v1.0 chỉ được đọc trực tiếp tại quầy hoặc gọi điện đọc mã.
  - Release notes "gửi khách như hiện nay" không thay được quy tắc này.
- Vì sao quan trọng: Mã cửa nằm trong tin Zalo thì ai cầm điện thoại khách, hoặc ai được thêm vào nhóm chat, cũng vào được căn. Tên phòng in trên biển cửa (BR-012) nên chỉ cần mã là đủ. Đây là an toàn thân thể và tài sản của khách. Sổ tay là tài liệu đào tạo duy nhất, viết sai thì cả đội làm sai từ ngày đầu.
- Đề xuất sửa:
  - Mục 2.10, câu cuối khung "Mã cửa" thay bằng: "Mã cửa **không gửi qua Zalo, Messenger, WhatsApp hay hộp thư OTA**, kể cả gõ tay. Giao mã bằng cách đọc trực tiếp tại quầy, hoặc gọi điện cho đúng số của khách đứng tên rồi đọc mã. Không đọc mã cho người gọi đến mà lễ tân chưa xác minh là khách của đơn."
  - Mục 2.21 thay dòng thành: "Khách nhờ gửi mã cửa qua Zalo | Không gửi. Trả lời: 'For your security, we share door codes by phone or at the desk only.' / 'Vì an toàn của anh/chị, OTTIMO chỉ báo mã cửa qua điện thoại hoặc tại quầy.' Rồi gọi đúng số khách đứng tên để đọc mã."
  - Phụ lục 3.12 / 5.5: thêm "Không gửi mã cửa qua tin nhắn".
  - ORC lưu ý: nếu OTTIMO đang quen gửi mã qua Zalo cho khách tự nhận phòng khuya, thì đó là thay đổi thói quen. Muốn giữ thói quen cũ phải qua SEC rồi INV quyết. Không được nới quy tắc trong sổ tay.
- Trạng thái: Open

### FB-R3-DOM-BA-02
- Mức độ: Blocker
- Vị trí: Chương 2 (thiếu mục); 1.8 (bảng duyệt có ghi "trả sớm"); 2.11 ("Khách nước ngoài gia hạn, trả sớm…"); 5.6
- Vấn đề:
  - Sổ tay nhắc "trả sớm" 3 lần nhưng không có cách làm. DOM kiểm mã rc.3:
    - `allowed-actions.ts` chỉ trả nút `check_out` khi `today === departureDate`.
    - Máy chủ có B16 `early_departure` nhưng `ReservationDrawer.tsx` không có nút gọi B16.
    - Backlog US-137 (trả sớm) xếp phát hành R4+.
  - Hệ quả: khách rời sớm thì lễ tân **không trả phòng được trên Desk** trước ngày đi. Căn vẫn "Đang ở", không bán lại được. Mỗi sáng 07:00 Desk vẫn sinh việc dọn khách ở lại. Tab "Cần cập nhật ngày đi" không hiện khách nước ngoài này. Phần hoàn 50 % theo BR-428 không có đường ghi.
- Vì sao quan trọng: Ở Đà Lạt, khách rút ngắn chuyến vì thời tiết hay đổi lịch là việc hằng tuần, không phải hiếm. Không có hướng dẫn thì lễ tân sẽ ứng biến: hoàn tiền mặt ngoài sổ, hứa số hoàn sai chính sách, hoặc quên cập nhật ngày đi trên cổng khai báo (BR-604, nghĩa vụ pháp lý).
- Đề xuất sửa:
  - (a) **Cho PO/ORC (không phải việc của BA):** máy chủ đã có B16 và logic tiền BR-428 đã được review. Đề nghị đưa nút "Trả sớm" (US-137, phần Desk) vào bản vá **v1.0.1 (thứ Tư 04/11)**. Nếu FE ước dưới 1 ngày thì làm trước ngày D. QA kiểm tiền theo oracle BR-428.
  - (b) **BA thêm mục 2.14a "Khách trả phòng sớm – tạm ở v1.0"**, chữ đề xuất:
    > **Tạm ở v1.0:** Desk chưa trả phòng được trước ngày đi (có ở v1.0.1). Khi khách báo rời sớm:
    > 1. Ghi vào ghi chú đơn: "Khách báo rời ngày dd/mm lúc hh:mm, báo qua (Zalo/điện thoại/tại quầy)". Giờ báo quyết định tiền hoàn. **Không hứa số hoàn**, không hoàn tiền tại quầy.
    > 2. Khi khách rời: thu thẻ (ghi số thẻ trả), **xóa mã trên app khóa ngay**, nhờ buồng phòng đếm minibar, kiểm hư hỏng. Món đã dùng và hư hỏng: **Thêm phát sinh** vào folio.
    > 3. Khách nước ngoài: **cập nhật ngày đi trên cổng khai báo trong ngày khách rời**. Desk chưa nhắc việc này.
    > 4. Buồng phòng: **Hủy việc** dọn khách ở lại các ngày sau, lý do "Khách đã rời sớm". Tạo **Việc mới → Dọn trả phòng** cho ngày khách rời.
    > 5. Báo quản lý trong ca. Căn vẫn hiện "Đang ở" tới ngày đi: **không** nhận khách khác vào căn này ngoài Desk. Có khách mới cần căn thì gọi quản lý.
    > 6. Ngày đi trên đơn: lễ tân bấm **Trả phòng**, ghi chú "Khách đã rời ngày dd/mm". Quản lý mở folio trong 24 giờ và **Điều chỉnh** tiền phòng các đêm chưa ở theo chính sách:
    >    - Đơn Trực tiếp/CTV báo trước từ 1 ngày: hoàn 50 % tiền các đêm chưa ở. Phụ thu người của các đêm đó hoàn 100 %.
    >    - Báo trong ngày rời: không hoàn.
    >    - Đơn OTA: theo kênh.
    >    - Desk tự tạo yêu cầu hoàn. Chủ đầu tư duyệt khi khoản giảm vượt giá 1 đêm.
    >
    > Ví dụ (BR-107, BR-428): đơn 202 từ 9/11 đến 16/11, 5.205.000 đ. Khách báo ngày 12/11 rằng sẽ rời 14/11, tức báo trước 2 ngày. Hai đêm bỏ là 14/11 (thứ Bảy) 820.000 đ và 15/11 713.000 đ, cộng 1.533.000 đ. Hoàn 50 % là **766.500 đ, làm tròn lên 767.000 đ** (BR-428 làm tròn có lợi cho khách). Các đêm đã ở **không** tính lại mức giảm 7 đêm.
  - (c) Ghi rõ giới hạn trong sổ tay cho kế toán: theo cách tạm này, đêm bỏ vẫn hiện là đêm bán trong Nhật ký tiền tới khi quản lý điều chỉnh. Phần giữ lại nằm trong tiền phòng, không tách thành dòng "phí trả phòng sớm".
  - QA diễn tập bước 6 trên staging trước khi in sổ tay. Bước này cần Desk cho trả phòng ngày đi khi giờ thật khác giờ khách rời (ghi chú bắt buộc theo BR-414).
- Trạng thái: Open

### FB-R3-DOM-BA-03
- Mức độ: Major
- Vị trí: 2.4 "Xác nhận đã nhận cọc" bước 1; 2.13 bảng "Chuyển khoản VietQR"; 5.4 "Khách chuyển khoản nhưng tôi chưa thấy tiền?"
- Vấn đề:
  - Sổ tay bắt lễ tân "mở ứng dụng ngân hàng của OTTIMO" và "chờ thấy tiền về" rồi mới xác nhận. Nhưng tài khoản nhận hiện là **tài khoản cá nhân của chủ đầu tư** (BR-521). Lễ tân không có, và không được có, mật khẩu ngân hàng.
  - Không tài liệu nào nói lễ tân thấy tiền về bằng cách nào. Ban đêm, khi một người trực một mình, quy tắc này không làm được.
- Vì sao quan trọng: Quy tắc không làm được thì người ta sẽ tự chọn cách dễ, tức tin ảnh chụp màn hình. Rủi ro điển hình: ảnh chuyển khoản giả lúc 23:00, khách đi sáng sớm, trước khi quản lý đối soát. Mất tiền phòng.
- Đề xuất sửa:
  - Chờ INV quyết **ESC-039** (DOM tạo kèm review này).
  - Tới khi INV quyết, 2.13 thêm khung:
    > **Tạm tới khi có thông báo tiền về tại quầy (ESC-039):** 07:00–22:00 nhắn hoặc gọi chủ đầu tư/quản lý xác nhận đã thấy tiền rồi mới bấm. 22:00–07:00 mời khách trả tiền mặt hoặc thẻ (máy POS). Khách chỉ chuyển khoản được thì ghi **Chuyển khoản (tay)** với mã giao dịch khách đọc. Khoản mang cờ **Chờ đối soát**. Ghi sổ giao ca để quản lý đối soát **trước 09:00** sáng hôm sau. Không giao mã cửa cho khách mà chưa có giấy tờ người đứng tên.
  - 5.4 sửa câu trả lời theo cùng ý.
- Trạng thái: Open

### FB-R3-DOM-BA-04
- Mức độ: Major
- Vị trí: 1.14 "Đóng ca" (khung Tạm ở v1.0); 2.1 "Đầu ca, cuối ca"; giả định BA mục 5 dòng 2
- Vấn đề: Cách đóng ca tạm "đếm két, lọc Nhật ký tiền hôm nay, đếm các dòng Tiền mặt" có 4 lỗ:
  - (1) Không có **quỹ đầu ca**. Két có sẵn tiền lẻ để thối, nên số đếm luôn lệch số trên Desk.
  - (2) Lễ tân chỉ xem được **khoản của mình** (rbac: Nhật ký tiền = M). Khoản tiền mặt quản lý chi hoàn từ két, hay khoản sale nộp tiền mặt mà lễ tân trưởng xác nhận, không hiện trong danh sách của lễ tân.
  - (3) Lọc "hôm nay" theo ngày, trong khi ca đêm 22:00–07:00 cắt qua hai ngày lịch và qua mốc 06:00.
  - (4) Không có bước nộp tiền về chủ đầu tư. Két dồn tiền nhiều ngày.
- Vì sao quan trọng: Lệch két mỗi ca mà không giải thích được thì sổ giao ca mất giá trị kiểm soát. Đây là kiểm soát tiền mặt duy nhất tới v1.3 (BR-526).
- Đề xuất sửa: thay khung 1.14 bằng:
  > **Tạm ở v1.0 (tới v1.3):**
  > 1. Két có **quỹ lẻ cố định** [GIẢ ĐỊNH – chờ INV đặt số, ví dụ 2.000.000 đ], ghi ở đầu sổ giao ca. Tiền vượt quỹ lẻ nộp chủ đầu tư (hoặc người chủ đầu tư giao) mỗi ngày, hai bên ký sổ.
  > 2. Ai lấy tiền ra hoặc bỏ tiền vào két trong ca của người khác (quản lý chi hoàn, sale nộp tiền mặt, nộp tiền về chủ đầu tư) thì **ghi ngay một dòng vào sổ giao ca**: giờ, số tiền, mã đơn, chữ ký.
  > 3. Cuối ca: **Tiền phải có = quỹ lẻ đầu ca + tiền mặt thu trong ca − tiền mặt chi trong ca − tiền nộp về**. Thu/chi của mình lấy từ **Nhật ký tiền** lọc theo giờ ca. Thu/chi của người khác lấy từ sổ giao ca.
  > 4. Đếm két, ghi tiền phải có, tiền đếm, chênh lệch và lý do. Hai người giao/nhận ký. Chênh khác 0: báo quản lý trong ca.
  > 5. Ca đêm qua 00:00: lọc **Từ ngày** hôm trước **Đến ngày** hôm nay, chỉ đếm dòng trong giờ ca.
  - QA kiểm thêm: Nhật ký tiền có lọc theo giờ không. Nếu không, bước 5 đổi thành "đếm theo cột thời gian".
- Trạng thái: Open

### FB-R3-DOM-BA-05
- Mức độ: Major
- Vị trí: 1.3 (gạch đầu dòng 3); 2.8 "Hủy" bước 2; 5.2 dòng "Cuối tuần, ngày đặc biệt" và dòng "Hủy (Trực tiếp)"
- Vấn đề:
  - (1) Danh sách ngày đặc biệt trong sổ tay ("Tết, 30/4–1/5, 2/9, 24/12–1/1") thiếu những ngày đang cài trên bản thật (`production-defaults.ts`): **Giỗ Tổ Hùng Vương (đêm 16/4/2027)**, **đêm 1/9** (ESC-015). Tết 2027 cũng chưa ghi ngày cụ thể (đêm 05–10/02/2027).
  - (2) Chính sách hủy thiếu 3 điểm của BR-309:
    - Đơn có **ít nhất 1 đêm ngày đặc biệt thì không hoàn cọc**.
    - **Bất khả kháng** (đèo đóng, chuyến bay Liên Khương hủy do thời tiết): dời ngày miễn phí trong 3 tháng, không hoàn tiền mặt.
    - Cách đếm ngày báo trước (BR-011).
- Vì sao quan trọng: Khách hỏi chính sách hủy qua Zalo lúc đặt, và lễ tân trả lời theo sổ tay. Hứa "báo trước 7 ngày hoàn 100 %" với đơn Tết là hứa sai tiền, rồi phải chọn giữa giữ lời và đúng chính sách. Đà Lạt mùa mưa có đèo sạt thật, lễ tân cần câu trả lời sẵn.
- Đề xuất sửa:
  - 1.3 và 5.2 thay bằng: "Ngày đặc biệt (+30 %, tối thiểu 2 đêm, không hoàn cọc khi hủy) đang cài: đêm 24/12/2026–01/01/2027 · Tết Nguyên đán đêm 05–10/02/2027 · Giỗ Tổ Hùng Vương đêm 16/4/2027 · đêm 30/4 và 1/5/2027 · đêm 1/9 và 2/9/2027. Danh sách đầy đủ ở **Tham số quy tắc**. Chủ đầu tư thêm ngày thì Desk tự áp."
  - 2.8 bước 2 thay bằng:
    > **Hủy đơn** → **Lý do hủy**. Desk tính phí hủy và khoản hoàn theo chính sách kênh Trực tiếp/CTV. Số ngày báo trước = ngày đến − ngày khách báo (ngày trên Desk).
    > - Từ 7 ngày: hoàn 100 % cọc.
    > - 3–6 ngày: hoàn 50 %.
    > - Dưới 3 ngày: không hoàn.
    > - **Đơn có đêm ngày đặc biệt: không hoàn cọc.**
    >
    > Ví dụ đơn đến 22/11: báo 15/11 là 7 ngày, hoàn 100 %. Báo 16/11 là 6 ngày, hoàn 50 %.
    >
    > Khách không đến được vì đèo vào Đà Lạt đóng hoặc chuyến bay hủy do thời tiết, có giấy báo của cơ quan hoặc hãng bay: không hoàn tiền mặt. Quản lý cho **dời ngày** miễn phí trong 3 tháng, áp cả ngày đặc biệt.
    >
    > Đọc số trên hộp trước khi bấm.
  - 5.2 dòng "Hủy (Trực tiếp)" thêm: "· ngày đặc biệt: không hoàn · bất khả kháng: dời 3 tháng".
- Trạng thái: Open

### FB-R3-DOM-BA-06
- Mức độ: Major
- Vị trí: 2.5 bước 8; 2.12 "Gia hạn"; 2.15 bảng dòng "thêm 1 đêm (giá đêm thêm sửa được…)"
- Vấn đề: Sổ tay cho sửa **Giá mỗi đêm** nhưng không nói đó là **giá trước giảm dài ngày** (BR-107: ô nhập là giá lịch, Desk áp bậc 7/14 đêm lên mọi đêm). `day-one-guide.md` 4.1 có ghi điều này, sổ tay thì không.
- Vì sao quan trọng: Lễ tân chốt với khách "7 đêm, 713.000 đ/đêm" (giá đã giảm) rồi gõ 713.000. Desk giảm thêm 10 % còn 642.000 đ/đêm. Ví dụ căn 202, 7 đêm 9–16/11: gõ giá đã giảm (713.000 ngày thường, 820.000 cuối tuần) thì Desk tính 5 × 642.000 + 2 × 738.000 = 4.686.000 đ, thay vì 5.205.000 đ, mất 519.000 đ trên một đơn. Lỗi này lặng lẽ, không có cảnh báo.
- Đề xuất sửa:
  - 2.5 bước 8 thay bằng: "**Giá mỗi đêm**: Desk điền theo lịch giá. Chỉ sửa khi đã chốt giá khác với khách, trong khoảng sàn–trần. **Luôn nhập giá trước giảm dài ngày.** Đơn từ 7 đêm Desk tự giảm 10 % (từ 14 đêm 15 %) trên số anh/chị nhập. Ví dụ đã báo khách căn 202, 7 đêm 9–16/11 là 5.205.000 đ: để nguyên giá lịch. Gõ 713.000 thì Desk giảm tiếp còn 642.000 đ/đêm."
  - 2.12 Gia hạn, thêm sau bước 2: "Sửa giá đêm thêm thì cũng nhập giá trước giảm."
- Trạng thái: Open

### FB-R3-DOM-BA-07
- Mức độ: Major
- Vị trí: 2.6; 2.8 "Đổi căn / đổi ngày" bước 5; 2.10 dòng "Đơn OTA: phụ thu nhận sớm…"; 2.21 dòng "Khách đặt OTA đến xin giảm giá"
- Vấn đề: Khách OTA đã trả trước là nhóm khách chính của OTTIMO, nhưng sổ tay thiếu hoặc sai 4 điểm:
  - (1) Không nói rõ OTA đã thu thì **không thu lại tiền phòng**, chỉ thu phát sinh tại quầy (BR-307, 426).
  - (2) Dòng 2.21 "gửi yêu cầu giảm giá đặc biệt, quản lý duyệt" **trái BR-307**: không giảm được trên đêm OTA đã trả trước. Muốn bù thì miễn khoản phát sinh hoặc hoàn tiền bồi thường.
  - (3) Thiếu điều kiện thu phụ thu nhận sớm/trả muộn của khách OTA: **chỉ khi kênh đã đăng nội quy** (BR-415, release notes "Kênh OTA chưa đổi thì chưa thu được"). Desk không có "bỏ qua phụ thu" (BR-414), nên lễ tân phải biết đi đường xin miễn.
  - (4) "Ngày theo kênh" ở 2.8 không nói phải làm gì khi khách sửa ngày trên OTA (BR-429). Sổ tay cũng thiếu cách xử lý khi khách OTA báo thêm người (BR-110 (i)/(ii)).
- Vì sao quan trọng: Thu lại tiền khách đã trả qua OTA, hoặc thu phụ thu chưa đăng trên kênh, sẽ thành khiếu nại trên OTA, ảnh hưởng điểm đánh giá và có thể bị kênh phạt. Hứa giảm giá mà Desk chặn thì lễ tân mất uy tín trước khách.
- Đề xuất sửa:
  - 2.6, thêm sau bước 3:
    > - **OTA đã thu tiền phòng** (Airbnb, Agoda trả trước, Booking "Payments by Booking"): Desk tự ghi **Đã thu qua OTA**. Lễ tân **không thu lại tiền phòng, không thu cọc**. Tại quầy chỉ thu phụ thu người vượt, nhận sớm/trả muộn, phát sinh.
    > - **Khách trả tại OTTIMO**: thu đủ tiền phòng khi nhận phòng như đơn Trực tiếp.
    > - Kênh trả bằng thẻ thanh toán ảo: chỉ chủ đầu tư/quản lý xử lý. Không nhập số thẻ vào Desk.
    > - **Khách OTA báo thêm người**: có thông báo sửa đơn trên extranet thì sửa số khách theo đơn mới, không phụ thu. Khách tự báo với OTTIMO (Zalo, điện thoại, tại quầy) thì giữ số khách OTA và thu phụ thu người vượt tại quầy. Không có bằng chứng sửa đơn trên kênh thì coi là khách tự báo.
  - 2.8 bước 5 thay bằng: "Đơn OTA: đổi căn trong cùng ngày thì dùng **Đổi căn** như thường. Khách sửa **ngày** trên kênh thì **Hủy đơn** với lý do OTA hủy, tiền phạt 0, rồi tạo đơn mới cùng **Mã đặt phòng OTA** theo ngày mới, ghi chú 'OTA sửa đơn'." (QA kiểm tên lý do trên Desk.)
  - 2.10 dòng OTA thay bằng: "Đơn OTA: phụ thu nhận sớm/trả muộn tính trên giá Trực tiếp hiện hành của đêm đó, **chỉ khi chủ đầu tư đã đăng giờ nhận/trả và mức phụ thu trong nội quy của kênh đó**. Kênh chưa đăng: chọn **Xin miễn phụ thu (gửi duyệt)**, lý do 'Kênh OTA chưa đăng phụ thu'. Chủ đầu tư báo lễ tân kênh nào đã đăng."
  - 2.21 thay dòng thành: "Khách OTA đã trả trước xin giảm giá | Không hứa. OTTIMO không giảm được tiền OTA đã thu. Có sự cố cần bù: miễn khoản phát sinh tại quầy, hoặc quản lý duyệt hoàn tiền bồi thường. Đơn OTA trả tại OTTIMO: gửi yêu cầu giảm giá đặc biệt."
- Trạng thái: Open

### FB-R3-DOM-BA-08
- Mức độ: Major
- Vị trí: 2.7 khung "Tạm ở v1.0"; 2.15 câu "Khách dài hạn…"; 5.2 dòng "Khách dài hạn"
- Vấn đề:
  - (1) Thiếu tình huống **khách dài hạn trả trễ tiền thuê**. Desk v1.0 không nhắc thu (`lsm.no_reminder`). BR-207 có mốc: nhắc trước 7 ngày, quá 3 ngày cảnh báo, quá 10 ngày xử lý theo HĐ, **không khóa cửa**.
  - (2) Điện 5.000 đ/kWh được viết áp cho mọi khách. HĐ giấy đang chạy có thể ghi đơn giá khác. BR-501 còn ghi đơn giá này **cần kế toán/luật sư xác nhận trước khi in vào HĐ mới** (quy định giá điện cho người thuê để ở).
  - (3) Cách tính nước "theo số ngày ở" chưa có ví dụ.
  - (4) Chưa nhắc chốt công tơ tháng 10.
  - (5) BR-413 (nhận sớm ngày đầu miễn phí từ 06:00 khi căn trống đêm trước; cơ sở phụ thu = tiền thuê HĐ ÷ 30) không có. Cũng chưa rõ Desk tính gì với "Đơn dài hạn nhập tay" (QA Q4).
- Vì sao quan trọng: Khách dài hạn là dòng tiền ổn định nhất của OTTIMO. Lễ tân tự đổi mã cửa hay cắt điện để ép trả tiền là rủi ro pháp lý. Thu điện cao hơn HĐ là tranh chấp với khách ở lâu.
- Đề xuất sửa: khung 2.7 thêm:
  > - **Lịch thu**: lễ tân trưởng giữ bảng kỳ thu (giấy hoặc bảng tính trên máy quầy; không ghi số giấy tờ) gồm căn, khách, kỳ, số tiền, hạn. Nhắn khách 7 ngày trước hạn và đúng ngày hạn, trong khung 08:00–21:00. **Quá hạn 3 ngày: báo quản lý. Quá hạn 10 ngày: quản lý xử lý theo hợp đồng.** Không đổi mã cửa, không khóa cửa, không cắt điện nước, không mang đồ của khách ra để ép trả.
  > - **Điện**: (chỉ số cuối − chỉ số đầu) × đơn giá trên HĐ giấy. HĐ không ghi đơn giá: báo quản lý trước khi gửi khách. Chưa in đơn giá 5.000 đ/kWh vào HĐ mới tới khi kế toán/luật sư xác nhận (BR-501).
  > - **Nước**: 100.000 đ × số người × số ngày ở trong tháng ÷ số ngày của tháng, làm tròn 1.000 đ. Ngày vào tính, ngày trả không tính. Ví dụ 2 người vào 10/10, tháng 31 ngày: 100.000 × 2 × 22 ÷ 31 = **142.000 đ**.
  > - **Chốt công tơ** ngày cuối tháng (cho phép lệch 2 ngày), chụp ảnh, ghi người chốt. Kỳ tháng 10/2026 chốt 31/10 trong sổ cũ.
  - 2.15 thay câu "Khách dài hạn…" bằng: "Khách dài hạn: trả tới 15:00 không phụ thu nếu căn không có khách đến. Ngày đầu nhận từ 06:00 không phụ thu nếu căn trống đêm trước. Phụ thu (nếu có) tính trên tiền thuê tháng theo HĐ ÷ 30, không trên giá đêm niêm yết. Chưa chắc Desk tính đúng với đơn nhập tay (chờ QA Q4): báo quản lý, không tự thu."
- Trạng thái: Open

### FB-R3-DOM-BA-09
- Mức độ: Major
- Vị trí: 2.14 bước 5; 2.16; 4.3 "Hóa đơn GTGT"; giả định BA mục 5 dòng 2 (danh sách hóa đơn qua sổ giao ca)
- Vấn đề: Sổ tay chỉ chuyển cho kế toán danh sách **khách lấy hóa đơn công ty**. Hai điểm chưa rõ:
  - Theo DOM hiểu, bán dịch vụ phải lập hóa đơn **cả khi người mua không lấy**, và thời điểm lập là khi hoàn thành dịch vụ (Nghị định 123/2020/NĐ-CP và bản sửa đổi; **PHÁP LÝ – cần kế toán xác nhận**). BR-524 cũng ghi: ngắn ngày xuất khi hoàn tất trả phòng.
  - Đơn OTA đã trả trước: số tiền và người mua trên hóa đơn chưa có hướng dẫn.
- Vì sao quan trọng: Kế toán chỉ nhận danh sách khách công ty thì phần lớn doanh thu không có hóa đơn, gây rủi ro thuế cho Công ty CP UTMG Living. Xuất trễ vài ngày thì sai ngày hóa đơn.
- Đề xuất sửa:
  - 2.16 thay câu "Rồi ghi mã đơn vào sổ giao ca…" bằng:
    > Cuối mỗi ca, lễ tân ghi vào sổ giao ca **mọi phiếu thanh toán đã cấp trong ca**: số phiếu, mã đơn, tổng tiền, cách thu, cột "Hóa đơn công ty" (Có/Không). Không ghi số giấy tờ, số thẻ. Kế toán xuất hóa đơn theo cách kế toán chọn, **ngày hóa đơn là ngày trả phòng**. Đơn OTA đã trả trước: không hứa với khách số tiền trên hóa đơn; ghi thông tin và chuyển kế toán.
  - 4.3 sửa câu "Mỗi ngày kế toán nhận danh sách…" theo cùng ý.
  - Thêm nhãn "[cần kế toán xác nhận: hóa đơn cho khách lẻ không lấy hóa đơn]". Câu này nên đưa vào ESC-038 (xem thẻ 23).
- Trạng thái: Open

### FB-R3-DOM-BA-10
- Mức độ: Major
- Vị trí: 0.9 khung "Tạm ở v1.0"; 5.5 dòng "Mất mạng tại quầy"; 5.6 dòng "Bảng dự phòng"
- Vấn đề:
  - Cách tạm cho mất mạng chỉ là sổ giấy **3 ngày đầu**. Từ 05/11 (khi bỏ sổ giấy) tới v1.1, mất mạng là mất luôn danh sách khách đến/đi, số còn phải thu và số điện thoại khách.
  - Câu "Desk chỉ cho xem dữ liệu lúc gần nhất" chỉ đúng khi trang đang mở sẵn. BR-961 đặt bảng dự phòng hằng ngày chính vì lý do này.
- Vì sao quan trọng: Ở Đà Lạt mất điện, mất mạng theo khu là chuyện có thật. Lễ tân không biết khách đến tối nay là ai, căn nào, đã trả bao nhiêu, nên giao nhầm căn hoặc thu thiếu.
- Đề xuất sửa: khung 0.9 thay câu đầu bằng:
  > **Tạm ở v1.0 (tới v1.1):** mỗi tối lúc 22:00 lễ tân ca tối chép tay **danh sách khách đến và khách đi ngày mai** từ **Sơ đồ phòng / Đơn đặt phòng**: tên gọi, căn, giờ đến dự kiến, còn phải thu, số điện thoại khách. Không ghi số giấy tờ, không ghi mã cửa. Cất ở ngăn khóa tại quầy; hôm sau xé hủy bản cũ. Mất mạng thì dùng danh sách này để giao căn đã sạch cho khách có tên trong danh sách, thu tiền và ghi sổ giấy, nhập bù trong 24 giờ.
  - Ba ngày đầu vẫn ghi thêm sổ giấy như hiện tại.
  - 5.6 cột "Cách làm tạm" sửa tương ứng. SEC xem lại vì danh sách giấy có tên và số điện thoại khách.
- Trạng thái: Open

### FB-R3-DOM-BA-11
- Mức độ: Major
- Vị trí: Chương 2 (thiếu mục; `day-one-guide.md` mục 1 ghi "đơn nhóm chưa có ở v1.0")
- Vấn đề: Một gia đình hay nhóm bạn đặt 2–3 căn là tình huống thường gặp ở OTTIMO. Sổ tay không nói:
  - Cách tạo nhiều đơn.
  - Cách ghi **một lần chuyển khoản cho nhiều đơn**.
  - Giới hạn giữ chỗ của CTV (3 đơn) và sale (5 đơn).
  - Hủy một căn trong nhóm.
- Vì sao quan trọng: Lễ tân ghi cả số tiền gộp vào một đơn thì đơn này thành tiền thừa (sinh yêu cầu hoàn), đơn kia vẫn "Giữ chỗ · chờ cọc" và tự hủy khi hết hạn. Khách mất căn dù đã chuyển đủ tiền.
- Đề xuất sửa: thêm mục 2.5a "Một khách đặt nhiều căn":
  > v1.0 chưa có đơn nhóm. Tạo **mỗi căn một đơn**, cùng khách đứng tên. Ghi chú mỗi đơn: "Nhóm <tên khách>: OTM-…, OTM-…".
  > - **Cọc**: gửi khách mã VietQR của từng đơn. Khách chuyển **một lần** cho cả nhóm: xác nhận cọc ở **từng đơn đúng số cọc của đơn đó**, cùng mã giao dịch, ghi chú "chuyển gộp nhóm". Không ghi cả khoản vào một đơn.
  > - CTV giữ chỗ tối đa 3 đơn, sale tối đa 5 đơn: nhóm lớn hơn thì nhờ lễ tân tạo.
  > - Hủy một căn: hủy đơn đó theo chính sách hủy. Các đơn còn lại giữ nguyên.
  > - Khai báo lưu trú và nhận phòng theo từng đơn, đủ người ở từng căn.
  - QA kiểm: Desk có cho 2 lần xác nhận cọc cùng một mã giao dịch không. Nếu bị chặn, ghi mã giao dịch kèm hậu tố "-1", "-2".
- Trạng thái: Open

### FB-R3-DOM-BA-12
- Mức độ: Minor
- Vị trí: 0.6; 2.11 bảng "Hạn khai báo"; 2.20 gạch đầu dòng cuối
- Vấn đề:
  - Sổ tay nhấn mạnh "từ 00:00 đến 05:59 Desk vẫn tính là ngày hôm trước" nhưng không nói mốc này **không áp** cho hạn khai báo (BR-010, BR-602: hạn pháp lý tính theo giờ đồng hồ).
  - Với khách Việt Nam đến 00:00–05:59, câu "đến từ 23:00 thì trước 08:00 sáng hôm sau" dễ bị hiểu là 08:00 ngày kế tiếp nữa.
- Vì sao quan trọng: Người trực đêm khai trễ hạn luật vì tin theo "ngày Desk".
- Đề xuất sửa:
  - 0.6 thêm: "Mốc 06:00 **không** áp cho hạn khai báo lưu trú: hạn khai báo luôn tính theo giờ đồng hồ thật."
  - 2.11 dòng Công dân Việt Nam thay bằng: "Trước 23:00 ngày đến. Đến 23:00–23:59: trước 08:00 sáng hôm sau. Đến 00:00–05:59: Desk đếm tới 23:00 cùng ngày, nhưng OTTIMO khai **ngay trong ca, muộn nhất 08:00 sáng**."
  - 2.20 sửa tương ứng.
- Trạng thái: Open

### FB-R3-DOM-BA-13
- Mức độ: Minor
- Vị trí: 2.12 "Đổi phòng khi đang ở" bước 4
- Vấn đề: Thiếu các việc của BR-424 và BR-511: kiểm minibar căn cũ, ghi số thẻ trả lại và số thẻ phát mới, xóa mã căn cũ trên app khóa. Đổi phòng do sự cố cũng chưa nhắc lựa chọn bù cho khách.
- Vì sao quan trọng: Không kiểm minibar căn cũ thì mất tiền. Không xóa mã căn cũ thì khách cũ còn vào được căn đã giao cho khách khác.
- Đề xuất sửa: bước 4 thay bằng:
  > Bấm **Đổi sang căn …**. Rồi:
  > (a) Nhờ buồng phòng đếm minibar căn cũ. Món đã dùng ghi vào folio ngay bằng **Thêm phát sinh** (QA kiểm hộp Đổi phòng có ô minibar không).
  > (b) Thu thẻ căn cũ, ghi số thẻ trả. **Xóa mã căn cũ trên app khóa.** Giao mã/thẻ căn mới.
  > (c) Bộ đồ dùng thêm: Desk tự tạo việc chuyển.
  > (d) Đổi do sự cố: khách giữ giá cũ. Muốn bù thêm thì dùng miễn phí, lý do **Bù sự cố**.
- Trạng thái: Open

### FB-R3-DOM-BA-14
- Mức độ: Minor
- Vị trí: 2.8 "Khách không đến" bước 2–4
- Vấn đề:
  - "Desk giữ cọc theo chính sách" chưa nói rõ là giữ **toàn bộ** cọc (BR-311).
  - Thiếu bước kiểm extranet xem khách đã hủy trên kênh chưa.
  - Thiếu lưu ý với đơn đã trả đủ: khách có thể đến sau nửa đêm.
- Vì sao quan trọng: Bán lại căn lúc 23:30 cho khách vãng lai trong khi khách OTA đã trả trước tới lúc 01:00 là tình huống tệ nhất của lễ tân đêm.
- Đề xuất sửa:
  - Bước 2 thêm: "Đơn OTA: kiểm extranet trước. Khách đã hủy trên kênh thì hủy theo kênh, không đánh dấu không đến."
  - Bước 3 thay "giữ cọc theo chính sách" bằng "giữ **toàn bộ cọc**, hủy các đêm còn lại".
  - Thêm bước 5: "Đơn đã trả đủ tiền phòng hoặc OTA đã thu: dù đã đánh dấu không đến, **không bán căn đó trong đêm** tới 06:00. Khách đến thì **Khôi phục đơn không đến**."
- Trạng thái: Open

### FB-R3-DOM-BA-15
- Mức độ: Minor
- Vị trí: 0.9; 5.5 dòng "Mất điện"
- Vấn đề: Dòng mất điện chỉ ghi "Sổ giấy; quá 4 giờ báo chủ đầu tư". Thiếu các việc với khách đang ở (BR-964).
- Vì sao quan trọng: Mất điện buổi tối, việc đầu tiên là an toàn của khách, không phải sổ sách.
- Đề xuất sửa: 5.5 dòng "Mất điện", cột "Trong lúc chờ" thay bằng:
  > Khóa cửa chạy pin vẫn mở bằng mã/thẻ. Đi một vòng các căn có khách, ưu tiên khách có trẻ nhỏ, người lớn tuổi. Báo khách thời gian dự kiến (nếu biết). Máy quầy chạy pin, dùng 4G điện thoại cơ sở. Mất điện riêng một căn có khách: báo sự cố mức **Gấp**, đổi phòng nếu cần. Quá 4 giờ: quản lý báo chủ đầu tư, quyết đổi phòng hoặc bù (**Bù sự cố**).
- Trạng thái: Open

### FB-R3-DOM-BA-16
- Mức độ: Minor
- Vị trí: 0.8 ý 5
- Vấn đề: Ý 5 chỉ nói ảnh của khách đồng ý lưu (30 ngày, lên 3 tháng ở v1.0.1). Thiếu hai hạn đang chạy trên bản thật (`production-defaults.ts`):
  - Ảnh của hồ sơ **khai báo chưa xong** tự xóa sau **7 ngày**, kể cả khi khách đã đồng ý.
  - Dữ liệu điền sẵn cho khách quay lại giữ **3 tháng** sau lần trả phòng cuối.
- Vì sao quan trọng: Lễ tân để dồn hồ sơ chưa khai thì mất ảnh và phải xin khách lại. Khách quay lại sau 3 tháng phải nhập giấy tờ lại; lễ tân cần biết đó là đúng thiết kế.
- Đề xuất sửa: ý 5 thêm hai câu: "Hồ sơ chưa khai báo xong: ảnh tự xóa sau 7 ngày, nên khai đúng hạn. Dữ liệu điền sẵn cho khách quay lại giữ 3 tháng sau lần trả phòng cuối; quá hạn thì nhập lại giấy tờ."
- Trạng thái: Open

### FB-R3-DOM-BA-17
- Mức độ: Minor
- Vị trí: 1.13 khung "Tạm ở v1.0" ("công suất theo ngày ghi tay từ Tổng quan mỗi sáng")
- Vấn đề: Ô **Công suất đêm nay** đọc buổi sáng (sau 06:00) là đêm **sắp tới**, gồm cả khách chưa đến. Đó không phải công suất thật của đêm qua.
- Vì sao quan trọng: Số công suất ghi tay sai thì đánh giá giá đêm và mùa cao điểm (ESC-032) sai từ tháng đầu.
- Đề xuất sửa: thay bằng "công suất từng đêm: ghi lúc 22:00 cùng lần đối chiếu (số căn **Đang ở** trên Sơ đồ phòng, không tính Giữ chỗ, Khóa phòng, Nội bộ), hoặc sáng hôm sau đếm cột đêm hôm qua trên Sơ đồ phòng."
- Trạng thái: Open

### FB-R3-DOM-BA-18
- Mức độ: Minor
- Vị trí: 1.7 gạch đầu dòng 1 ("tạo một mã VietQR nhỏ trên một đơn thử… rồi hủy đơn thử")
- Vấn đề: Tạo đơn thử trên bản thật thì nhảy số đơn (BR-007, mã không tái dùng), sinh bản ghi khai báo, và có thể chiếm căn trên sơ đồ nếu quên hủy.
- Vì sao quan trọng: Dữ liệu ngày đầu lẫn đơn giả là điều `day-one-guide.md` nguyên tắc 3 cấm.
- Đề xuất sửa: thay bằng "Muốn kiểm số đầy đủ: với **đơn thật đầu tiên** cần thu chuyển khoản, trước khi gửi mã cho khách, tự quét bằng ứng dụng ngân hàng, xem tên chủ tài khoản, không chuyển tiền. Không tạo đơn thử trên bản thật."
- Trạng thái: Open

### FB-R3-DOM-BA-19
- Mức độ: Minor
- Vị trí: 2.14 đoạn đầu; 5.1 dòng "Sáng", "Tối"; 2.12 "Gia hạn"
- Vấn đề:
  - Nhắn khách tay chưa có khung giờ (BR-973: tin chủ động 08:00–21:00).
  - Chưa có quy tắc không mời trả muộn khi căn có khách đến (BR-425).
  - Gia hạn chưa nói thu tiền lúc nào (BR-423: ngay khi khách đồng ý, muộn nhất 14:00 ngày đầu phần gia hạn – đang là giả định chờ INV).
- Vì sao quan trọng: Tin 22:30 làm phiền khách. Gia hạn không thu ngay dễ dồn thành công nợ khi khách đi.
- Đề xuất sửa:
  - 2.14 thêm: "Nhắn trong 08:00–21:00. Tối hôm trước nhắn trước 21:00. Căn có khách đến hôm nay: không mời trả muộn trong tin."
  - 5.1 sửa dòng "Tối" thành "Trước 21:00".
  - 2.12 Gia hạn thêm bước 5: "Thu tiền phần gia hạn ngay khi khách đồng ý, muộn nhất 14:00 ngày đầu của phần gia hạn." (QA Q11: Desk có ô thu ở bước gia hạn không; nếu không, ghi sổ giao ca và thu khi trả phòng.)
- Trạng thái: Open

### FB-R3-DOM-BA-20
- Mức độ: Minor
- Vị trí: 2.14 bước 2 ("Không dùng gì – tủ đủ"); 3.7 khung Tạm ở v1.0; 1.11 gạch đầu dòng 4
- Vấn đề:
  - Cách tạm minibar giả định buồng phòng đếm kịp trước khi khách đứng ở quầy. Sổ tay không nói làm gì khi chưa có số.
  - 1.11 viết phát sinh sau trả phòng "ghi được trong 24 giờ" nhưng không nói ai ghi. BR-427 (c): lễ tân trở lên ghi, kèm ảnh. Quá 24 giờ khách chưa trả thì tự thành công nợ.
- Vì sao quan trọng: Lễ tân vội sẽ bấm "Không dùng gì" cho xong. Thất thoát minibar nhỏ nhưng lặp lại mỗi ngày.
- Đề xuất sửa:
  - 2.14 bước 2 thêm: "Buồng phòng chưa báo số: hỏi khách đã dùng gì, nhập theo lời khách, ghi chú 'chưa đếm'. **Không** bấm **Không dùng gì – tủ đủ** khi chưa có số."
  - 3.7 thêm bước 4: "Đếm sau khi khách đi mà thấy thiếu: báo lễ tân ngay, kèm ảnh."
  - 1.11 sửa: "Phát sinh sau trả phòng: lễ tân trở lên ghi trong 24 giờ, kèm ảnh. Khách không trả trong 24 giờ thì Desk tự ghi công nợ." (QA kiểm vai lễ tân có nút này không.)
- Trạng thái: Open

### FB-R3-DOM-BA-21
- Mức độ: Minor
- Vị trí: "Cách đọc sổ tay" gạch đầu dòng 5 ("Khi số trên Desk khác số trong sổ tay, làm theo Desk"); giả định BA mục 5 dòng 1
- Vấn đề: Đồng ý nguyên tắc. Nhưng câu này cũng che luôn trường hợp Desk tính sai (lỗi P0 về tiền), vì lễ tân sẽ làm theo mà không báo ai.
- Vì sao quan trọng: Tuần đầu là lúc dễ phát hiện lỗi tiền nhất. Lễ tân cần được dặn là phải báo.
- Đề xuất sửa: thay bằng "Khi số trên Desk khác số trong sổ tay: nếu chủ đầu tư vừa đổi tham số (xem **Lịch sử thay đổi**), làm theo Desk. Không rõ vì sao khác, nhất là **số tiền**: vẫn làm theo Desk, nhưng **báo lễ tân trưởng ngay trong ca** kèm mã đơn. Có thể là lỗi (P0 nếu sai tiền, mục 5.5)."
- Trạng thái: Open

### FB-R3-DOM-BA-22
- Mức độ: Suggestion
- Vị trí: 2.6 khung "Tạm ở v1.0"
- Vấn đề: "Nhập Desk ngay, rồi đóng phòng trên extranet các kênh khác" là cách tạm đúng, nhưng sổ tay chưa nói khi nào kiểm và ai đóng phòng. Với 10 căn trên 4–5 kênh, overbooking xảy ra ở khoảng trống giữa hai lần kiểm.
- Vì sao quan trọng: Tới v1.1 (Beds24), đơn trùng là rủi ro vận hành lớn nhất của đơn OTA.
- Đề xuất sửa: thêm "Kiểm extranet mọi kênh **đầu ca, 12:00, 18:00 và cuối ca**. Bật thông báo đơn mới của từng kênh về điện thoại cơ sở. Chủ đầu tư ghi rõ ai được đóng/mở phòng trên extranet. Cân nhắc tạm đóng các kênh ít đơn tới v1.1."
- Trạng thái: Open

### FB-R3-DOM-BA-23
- Mức độ: Minor
- Vị trí: `02-escalations/ESC-038.md` mục "Đội đề xuất"; sổ tay 4.3
- Vấn đề:
  - ESC-038 đề xuất C (vai Kế toán chỉ xem) **có điều kiện** "nếu kế toán đối chiếu hằng ngày".
  - Theo thẻ 09, kế toán cần danh sách phiếu thanh toán **hằng ngày** để xuất hóa đơn đúng ngày, nên điều kiện này gần như chắc chắn xảy ra.
  - OTTIMO ít người: chủ đầu tư đang kiêm quản lý, vừa duyệt hoàn vừa đối soát. Kế toán chỉ xem là lớp kiểm soát độc lập rẻ nhất.
- Vì sao quan trọng: INV nên quyết với bức tranh đủ. Nếu không, A kéo dài tới v1.3 và chủ đầu tư mất thời gian ngồi đọc số cho kế toán mỗi ngày.
- Đề xuất sửa (BA sửa ESC-038 trước khi ORC trình):
  - Đội đề xuất đổi thành "**A cho tuần đầu, C ở v1.1**". Vai Kế toán xem Nhật ký tiền, danh sách phiếu thanh toán, công nợ; được bấm **Đã khớp sao kê** (kế toán không thu tiền nên tách nhiệm tốt hơn quản lý tự đối soát; SEC/PO xác nhận); không thấy giấy tờ khách, không duyệt, không sửa giá.
  - Thêm vào bối cảnh câu hỏi phụ cho kế toán: hóa đơn cho khách lẻ không lấy hóa đơn lập thế nào (thẻ 09).
  - Không khuyến nghị B: DOM đồng ý với BA.
- Trạng thái: Open

---

## Đánh giá giả định BA (manual-report mục 5)

| # | Giả định | DOM | Lý do |
|---|---|---|---|
| 1 | Con số theo tham số 27/10; "Desk đúng hơn sổ tay" | **Đồng ý, kèm sửa** | Đúng cách làm, sổ tay không phải phát lại khi INV đổi tham số. Thêm câu báo trong ca khi số tiền khác mà không rõ lý do (thẻ 21) |
| 2 | Đóng ca bằng sổ giao ca có hai chữ ký + Nhật ký tiền; danh sách hóa đơn qua sổ giao ca | **Đồng ý hướng, không đồng ý chi tiết** | Sổ giao ca là cách đúng cho tới v1.3. Cần thêm quỹ lẻ, dòng ghi thu/chi của người khác, lọc theo giờ ca, nộp tiền về chủ đầu tư (thẻ 04). Danh sách gửi kế toán phải gồm **mọi phiếu thanh toán**, không chỉ khách công ty (thẻ 09). DOM xác nhận hai cách tạm này thuộc quyền DOM, trừ số quỹ lẻ (INV đặt) |
| 3 | Minibar: buồng phòng báo số bằng lời hoặc tin nội bộ không có tên khách | **Đồng ý** | Thực tế ở cơ sở nhỏ là gọi bộ đàm hoặc điện thoại. Bổ sung cách làm khi chưa kịp đếm (thẻ 20) |
| 4 | Nhắc giờ trả bằng nhắn tay | **Đồng ý** | Đúng v1.0 (mẫu tin ở v1.2). Thêm khung 08:00–21:00 và không mời trả muộn khi căn có khách đến (thẻ 19) |
| 5 | Kế toán chưa có tài khoản Desk (ESC-038 A) | **Đồng ý cho tuần đầu** | Xem thẻ 23: đề nghị C ở v1.1 không kèm điều kiện |
| 6 | Nước: trẻ dưới 6 tuổi miễn – giữ nhãn chờ INV | **Đồng ý** | Giữ `[GIẢ ĐỊNH – chờ INV xác nhận]` (BR-501 (a)). Thêm ví dụ tính (thẻ 08) |

## Đánh giá các khung "Tạm ở v1.0"

| Mục | Làm được thật? | Rủi ro tiền/dữ liệu | Thẻ |
|---|---|---|---|
| 0.9 sổ giấy 3 ngày | Được, nhưng hết dự phòng từ ngày 4 | Giao nhầm căn, thu thiếu khi mất mạng | 10 |
| 1.8 duyệt bằng tài khoản quản lý | Được. Chậm khi chủ đầu tư không ở cơ sở; chấp nhận ở 10 căn | Thấp (không lộ mật khẩu) | – |
| 1.13 báo cáo | Được | Công suất ghi sai đêm | 17 |
| 1.14 đóng ca | Chưa: thiếu quỹ lẻ, lễ tân không thấy khoản của người khác | Lệch két không giải thích được | 04 |
| 1.15 nhật ký truy cập giấy tờ | Được (chủ đầu tư hỏi đội khi cần) | Thấp | – |
| 2.4 / 2.13 "chờ thấy tiền về" | **Không**: lễ tân không xem được tài khoản cá nhân của chủ đầu tư | Ảnh chuyển khoản giả | 03, ESC-039 |
| 2.6 OTA nhập tay | Được nếu kiểm extranet theo lịch | Overbooking | 07, 22 |
| 2.7 dài hạn bằng sổ | Được, thiếu lịch thu và giới hạn hành vi khi khách trễ | Tranh chấp, rủi ro pháp lý | 08 |
| 2.10 mã cửa ngoài Desk | Được, nhưng **cách gửi mã sai** | An toàn khách | 01 |
| 2.16 / 4.3 hóa đơn ngoài Desk | Được nếu danh sách đủ mọi phiếu | Thuế | 09 |
| 3.7 minibar bằng lời | Được | Thất thoát nhỏ, lặp lại | 20 |
| Trả sớm | **Không có cách làm** | Tồn phòng, hoàn sai, khai báo NN | 02 |

## ESC mới

- **ESC-039 – Lễ tân thấy tiền chuyển khoản về bằng cách nào** (`02-escalations/ESC-039.md`, đã thêm dòng vào `escalations-index.md`). Mức Bình thường, cần trước 31/10 (buổi đào tạo lễ tân). Đội đề xuất A: thông báo tiền vào tới thiết bị của cơ sở ở quầy. Trong lúc chờ: làm theo thẻ 03.

## Việc cho các vai khác (không phải thẻ của BA)

- **PO/ORC:** đưa nút "Trả sớm" (US-137 phần Desk; máy chủ B16 đã có) vào v1.0.1 hoặc trước ngày D (thẻ 02).
- **QA (thêm vào Q1–Q13 của BA):**
  - Q14: bấm Trả phòng ngày đi cho khách đã rời sớm, ghi chú giờ rời thật.
  - Q15: Nhật ký tiền có lọc theo giờ không.
  - Q16: 2 lần xác nhận cọc cùng mã giao dịch.
  - Q17: hộp Đổi phòng có ô minibar không.
  - Q18: tên lý do hủy "OTA hủy".
  - Q19: lễ tân có ghi được phát sinh sau trả phòng không.
- **SEC:** xem lại danh sách khách đến/đi viết tay ở thẻ 10, và câu trả lời mẫu từ chối gửi mã cửa ở thẻ 01.
- **PO + DOM:** `staff-one-pager.md` vẫn ghi "kiểm theo checklist → sẵn sàng" và "đếm minibar, nhập số đã dùng" (BA lệch L2). DOM đồng ý sửa theo sổ tay 3.6, 3.7 trước khi in phát ngày D−1. One-pager cũng cần thêm câu "không gửi mã cửa qua Zalo".

## Điểm làm tốt – nên giữ

1. Mỗi khung "Tạm ở v1.0" và "Lỗi nhỏ đã biết" nằm ngay tại thao tác bị ảnh hưởng, không dồn về cuối sách. Lễ tân gặp đúng lúc cần.
2. Đường ESC-031 (mục 1.9, 2.15) viết đủ và đúng số: gọi trước, Desk ghi đúng giá 1 đêm, không miễn tại quầy, quản lý xem lại trong 24 giờ, người sửa không tự duyệt hoàn. Ví dụ 792.000 → hoàn 396.000 khớp oracle E31.
3. Phần dữ liệu khách (0.8) và quy tắc "mỗi người một tài khoản, không đọc mật khẩu qua điện thoại" viết ngắn, dễ nhớ, đúng tinh thần NĐ 13/2023. Câu nói với khách "Check-in from 12:00 (your room is always ready by 14:00)" lặp lại nhất quán ở 1.16, 2.10, 5.4.
