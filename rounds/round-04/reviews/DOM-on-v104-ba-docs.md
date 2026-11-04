# DOM review – Tài liệu BA cho v1.0.4 (sổ tay 1.11, bộ hướng dẫn 1.9)

- Người review: DOM | Round 4 – v1.0.4 – Bước: **Review** | 04/11/2026
- Tác giả: BA. Nhánh `origin/v104/ba-docs` @ `488d9392`. Báo cáo: `rounds/round-04/outputs/BA/v1.0.4-manual-docs.md`.
- Phạm vi: `product/docs/manual/user-manual-v1.0.md` (1.5, 1.8 bước 4, 2.18, 3.1), `guides/00-index.md` mục 4, `01` (1.6a, 1.8, 1.9, 4), `02` (1.8, 7.2, 11.5.2, 13.1d, 17.6), `03`, `04` (phần 2 bước), `release-notes.md` (dòng BUG-R4-025).
- Đối chiếu:
  - SEC `rounds/round-04/reviews/SEC-on-plan-v1.0.4.md` mục 2 (M18-08) và 6.4 ý 5 (thứ tự bật v2);
  - BE-D `origin/v104/be-refund-dest` @ `8539bbfb`, báo cáo `rounds/round-04/outputs/BE/v1.0.4-be-d-refund-dest.md` và CHECK maker-checker ở migration 0042 (ngoại lệ chủ đầu tư với chuyển khoản);
  - `services/api/src/modules/identity/public/mfa-store.ts` (`MFA_REQUIRED_ROLES = ['owner','manager']`);
  - `product/docs/rbac-matrix.md` A81 (kiểm phòng: OWN, MGR, FDL), S09 (giấy tờ: FD trở lên, không HK/MT), ghi chú 2, 9;
  - BR-802, BR-808.
- Góc nhìn: người trực quầy giữ 6 vai (hiện là người duy nhất ở quầy), chủ đầu tư (người duyệt, chi hoàn, quản lý tài khoản), buồng phòng thuê theo giờ.

## Kết luận: **ĐẠT CÓ ĐIỀU KIỆN**

Ba phần ORC hỏi đều đúng hướng và khớp mã:
- **Thay tờ v2:** đúng thứ tự SEC (thay tờ trước, đặt tham số cùng ngày), gỡ cả tờ dự phòng, không để v1 và v2 cùng ở quầy.
- **M18-08:** đúng SEC. **Khóa tài khoản** khác **Tạm khóa do sai mật khẩu**, và giải thích rõ vì sao bản sau vẫn nhận thư.
- **Nơi nhận ở yêu cầu thay thế:** đúng BE-D (một nơi nhận, một người nhập thì mang; khác thì trống).

Còn **2 thẻ Major**. Cả hai là chỗ làm thật sẽ vấp:
- **01 – Ngày thay tờ:** chưa nói thay **lúc nào** trong ngày và **ai** làm việc gì. Hiện chủ đầu tư không ở quầy, còn tham số chỉ chủ đầu tư đặt được. Vì vậy khoảng hở giữa "đã thay tờ" và "đã đặt tham số" có thể kéo dài nhiều giờ. Trong khoảng đó khách đọc tờ v2 nhưng Desk ghi v1.
- **02 – Người nghỉ hẳn:** hai bước trên Desk đúng, nhưng chưa đủ để cắt quyền truy cập thật. Còn phòng Google Chat (có tin yêu cầu của khách), mã cửa/chìa, tiền mặt quầy, việc và yêu cầu hoàn người đó đang giữ. Ở OTTIMO, người dễ nghỉ nhất lại là người duy nhất ở quầy.

Còn 3 Minor và 1 Suggestion. Không có thẻ nào làm sai số tiền hay sai nghiệp vụ.

Hai điểm BA để ngỏ (mục B): DOM đề xuất phương án. **Cả hai không cần ESC**: không phải chính sách giá/giờ/phạt, không phải vấn đề pháp lý. ORC ghi vào báo cáo cuối round dưới dạng "mặc định đội đã chọn, chủ đầu tư đổi được". Chi tiết ở mục B.

---

## A. Thẻ feedback

### FB-R4-DOM-BA-104-01
- Mức độ: Major
- Vị trí: `guides/00-index.md` mục 4 đoạn "Áp dụng từ v1.0.4 – tờ bản v2"; `02-le-tan.md` mục 7.2 khối "Áp dụng từ v1.0.4 – tờ bản v2"; `02` mục 2 dòng **Mở quầy**.
- Vấn đề:
  1. **"Thay tờ trước, rồi cùng ngày đặt tham số"** để ngỏ khoảng hở tới cả ngày. Từ lúc thay tờ tới lúc đặt `privacy_notice_version`, khách đọc v2 mà Desk vẫn ghi v1 (SEC 6.4 ý 5.3: tham số quyết định Desk ghi bản nào cho khách tại quầy). Ngược lại cũng sai: đặt tham số trước thì khách đọc v1 mà Desk ghi v2, đúng điều SEC cấm.
  2. **Không nói ai làm gì.** Tờ ở quầy do người trực thay. Tham số chỉ chủ đầu tư đặt được. Chủ đầu tư thường không ở quầy. Thiếu một bước để hai người khớp giờ.
  3. **Không nói giờ.** Khách nhận phòng từ 12:00; khách đến sớm và khách sau 22:00 cũng làm giấy tờ. Thay giữa lúc có khách đang làm giấy tờ thì không biết khách đó đọc bản nào.
  4. **Tờ EN/RU** viết như chắc chắn có từ ngày thay tờ. SEC 6.4 ý 4: bản RU chỉ in khi RU đã duyệt. UXD đã duyệt giọng RU 04/11, nhưng sổ tay nên ghi điều kiện để người trực không đi tìm một tờ chưa in.
  5. Dòng **Mở quầy** chỉ ghi "tờ đúng chỗ". Từ v1.0.4 phải kiểm **đúng bản**, nếu không thì một tờ v1 sót lại (trong ngăn, trong máy tính bảng) sẽ không ai phát hiện.
- Vì sao quan trọng: lý do duy nhất phải làm theo thứ tự là để bản Desk ghi khớp bản khách đọc. Nếu không ghi rõ giờ và người làm, đúng hôm thay tờ sẽ có vài khách bị ghi lệch, và không sửa lại được.
- Đề xuất sửa (thêm vào `00-index` mục 4 và `02` mục 7.2, giữ chữ ngắn):
  1. **Chuẩn bị trước ngày thay** (chủ đầu tư): in 2 tờ A4 EN/VI v2 và tờ EN/RU nếu đã có bản in (chưa có: dùng EN/VI và đọc to câu hạn lưu như cũ). Chép sẵn tệp máy tính bảng v2.
  2. **Giờ thay:** buổi sáng **sau khi v1.0.4 đã lên**, trong khung **09:00–11:00**, lúc không có khách ở quầy và không có khách hẹn nhận sớm. Không thay sau 12:00.
  3. **Thay và đặt liền nhau, cách nhau không quá 15 phút:**
     1. người trực gỡ tờ v1 (khung mica và ngăn quầy), đặt tờ v2 (và EN/RU), xóa tệp v1 trên máy tính bảng, chép tệp v2;
     2. người trực nhắn chủ đầu tư "Đã thay tờ v2 – hh:mm";
     3. chủ đầu tư đặt tham số ngay, nhắn lại "Đã đặt v2 – hh:mm".
     Trong lúc chờ tin "Đã đặt", không nhận giấy tờ của khách mới. Khách tới thì mời ngồi đợi vài phút.
  4. **Ghi sổ giao ca:** "Thay tờ v2 hh:mm – tham số v2 hh:mm".
  5. Khách đã làm giấy tờ trước giờ thay **không** phải xem lại. Người đi cùng đến sau thì xem tờ v2.
  6. Tờ v1 gỡ ra: cất khỏi quầy (hoặc hủy), không để nơi khách thấy.
  7. Dòng **Mở quầy** (`02` mục 2, mục 18): "Tờ Your ID details đúng chỗ, mặt quay ra khách, **chân tờ có chữ v2** (từ v1.0.4)".
- Trạng thái: Open

### FB-R4-DOM-BA-104-02
- Mức độ: Major
- Vị trí: sổ tay 1.5 dòng "Người nghỉ hẳn"; `01-chu-dau-tu-quan-ly.md` 1.9 cùng dòng.
- Vấn đề: hai bước **Khóa tài khoản** + **Xóa email** đúng theo SEC và làm được (chủ đầu tư làm trên Desk, kể cả trên điện thoại, có mật khẩu và mã 6 số). Nhưng nhìn từ quầy, người nghỉ vẫn còn đường vào thông tin khách và tài sản sau khi tài khoản đã khóa. Sổ tay cũng chưa nói phải làm gì với việc người đó đang giữ dở:
  1. **Phòng Google Chat** báo yêu cầu website (ESC-041, `02` 13.1a): tin có tên và liên hệ của khách. Khóa tài khoản Desk **không** đưa người đó ra khỏi phòng Chat. Đây là đường lộ dữ liệu khách lớn nhất sau khi nghỉ.
  2. **Mã cửa, chìa cơ, mã két, mật khẩu Wi-Fi quản trị** mà người đó biết. Ở OTTIMO người trực giao mã cửa cho khách, nên biết mã. Người nghỉ do bị cho thôi việc thì phải đổi trong ngày.
  3. **Tiền mặt quầy**: phải đếm và bàn giao trước khi khóa. Khóa xong thì người đó không còn đăng nhập để chốt ca được.
  4. **Yêu cầu hoàn tiền mặt đang mở** mà người đó là người tạo. Sổ tay `01` mục 4 bảo "người tạo yêu cầu cũ nhập" nơi nhận tiền mặt. Người đó đã nghỉ thì người khác nhập, và chủ đầu tư duyệt.
  5. **Việc buồng phòng, phiếu sửa** đang giao cho người đó: giao lại.
  6. **Thời điểm khóa:** "trong cùng ngày" đủ cho người nghỉ êm. Người bị cho thôi việc thì khóa **trước hoặc ngay lúc báo**, không đợi cuối ngày. Câu "báo trước cho người đó về thư gửi tới địa chỉ cũ" chỉ áp khi nghỉ êm.
  7. **CTV hết hợp tác:** khóa không xóa hoa hồng còn nợ của các đơn CTV đó đã chốt. Chủ đầu tư vẫn chi theo bảng nội bộ, và báo CTV cách nhận số liệu (CTV không còn đăng nhập để xem).
  8. **Thông báo giữ chỗ quá hạn** (J1) gửi cho người tạo và người chốt đơn. Tài khoản đã khóa thì không ai trong hai người nhận. Theo kết luận J1 của DOM (P4-20, `rounds/round-04/outputs/DOM/v1.0.4-p4-20-br-fixtures.md` mục 0), Desk chuyển cho lễ tân và lễ tân trưởng. Sổ tay chỉ cần một câu nhắc: rà **Cần chú ý** các giữ chỗ do người đó tạo.
- Vì sao quan trọng: M18-08 được đặt ra vì tối thiểu dữ liệu sau khi nghỉ (NĐ 13/2023). Nếu chỉ khóa Desk mà người đó vẫn ở phòng Chat và vẫn biết mã cửa, mục đích của M18-08 chưa đạt. Ở OTTIMO, nếu người trực 6 vai nghỉ, chủ đầu tư phải tự vào quầy ngay hôm đó. Danh sách này giúp không sót việc nào.
- Đề xuất sửa: biến dòng "Người nghỉ hẳn" thành danh sách ngắn **"Ngày cuối của người nghỉ"**, theo thứ tự:
  1. bàn giao tiền mặt quầy và sổ giao ca, chủ đầu tư ký nhận;
  2. giao lại việc buồng phòng, phiếu sửa, yêu cầu hoàn tiền mặt đang mở;
  3. **Khóa tài khoản** (bị cho thôi việc: làm ngay, trước bước 1 nếu cần);
  4. **Xóa email**;
  5. đưa ra khỏi phòng Google Chat (và phòng Báo động nếu có);
  6. đổi mã cửa/chìa/két/Wi-Fi quản trị mà người đó biết;
  7. thu hồi thiết bị đã cấp quyền nếu là máy riêng của người đó;
  8. rà **Cần chú ý** các giữ chỗ người đó tạo.
  CTV: chỉ bước 3, 4, 5, kèm câu về hoa hồng còn nợ.
- Trạng thái: Open

### FB-R4-DOM-BA-104-03
- Mức độ: Minor
- Vị trí: sổ tay 1.8 bước 4; `01` mục 4 gạch "Trước khi duyệt yêu cầu thay thế"; `02` 11.5.2.
- Vấn đề: câu "Người đã nhập nơi nhận ở yêu cầu cũ vẫn **không** duyệt được yêu cầu mới" viết tuyệt đối, nên mâu thuẫn với ngoại lệ đang có ở ngay câu sau: "chuyển khoản thì chủ đầu tư tự nhập rồi vẫn duyệt và chi được". BE-D chép cả người nhập gốc. CHECK 0042 vẫn cho chủ đầu tư duyệt khoản chuyển khoản do chính mình nhập. Ở OTTIMO đây là ca hay gặp nhất: người trực tạo yêu cầu, chủ đầu tư nhập số TK của khách rồi duyệt. Đọc câu tuyệt đối, chủ đầu tư sẽ tưởng phải nhờ người khác duyệt.
- Đề xuất sửa: "… vẫn không duyệt được yêu cầu mới, **trừ chủ đầu tư với khoản chuyển khoản (như cũ)**".
- Trạng thái: Open

### FB-R4-DOM-BA-104-04
- Mức độ: Minor
- Vị trí: cùng ba chỗ như thẻ 03.
- Vấn đề: ba ý nhỏ làm người duyệt bối rối:
  1. **"Các yêu cầu cũ chỉ có một nơi nhận"**: chưa nói yêu cầu cũ **không có** nơi nhận thì không tính. Theo BE-D ca (c), một yêu cầu có nơi nhận và một yêu cầu trống thì Desk vẫn mang nơi nhận.
  2. **Duyệt không được mang theo.** Yêu cầu cũ đã duyệt chưa chi bị đóng thì yêu cầu thay thế quay về **Chờ duyệt**. Chủ đầu tư sẽ hỏi "đã duyệt rồi sao lại chờ".
  3. **Yêu cầu thay thế tạo trước ngày lên v1.0.4** vẫn trống (—): không có ai chép lại.
  4. Nhật ký thao tác tiền có dòng mới "Chép nơi nhận hoàn sang yêu cầu thay thế" (`refund.destination_carried`, khóa chữ FE-A P4-41). Chủ đầu tư rà nhật ký mỗi ngày (`01` mục 2) nên cần biết dòng này là bình thường.
- Đề xuất sửa: thêm 4 câu ngắn tương ứng, ngay sau câu "giữ nơi nhận".
- Trạng thái: Open

### FB-R4-DOM-BA-104-05
- Mức độ: Minor
- Vị trí: `02` 11.5.2, `01` mục 4.
- Vấn đề: nơi nhận được mang sang có thể **không còn dùng được**. Ví dụ: "Cách hoàn: tiền mặt", nhưng yêu cầu thay thế sinh ra lúc khách đã rời quầy (theo BR-522 v0.5.2: duyệt lúc khách ở, chi sau trả phòng), hoặc khách đổi ý muốn nhận chuyển khoản. Sổ tay chỉ dạy kiểm khi **trống**, chưa dạy kiểm khi **có mà không hợp**.
- Đề xuất sửa: thêm một câu: "Cách hoàn mang sang là **tiền mặt** mà khách đã về, hoặc khách đổi tài khoản: không duyệt, liên hệ khách, làm theo mục 12.2 (đổi nơi nhận)". BA kiểm trên Desk xem đổi nơi nhận của yêu cầu đã có nơi nhận làm bằng nút nào, rồi ghi đúng tên nút. Nếu Desk không cho đổi thì ghi cách đi vòng (từ chối với lý do, tạo đề nghị hoàn mới) và báo PO thành việc cho bản sau.
- Trạng thái: Open

### FB-R4-DOM-BA-104-06
- Mức độ: Suggestion
- Vị trí: `02` 1.8 ý cuối, 13.2a, 14.2; `01` 1.8 ý cuối; `03`, `04` phần 2 bước.
- Vấn đề: hai câu "theo chủ đầu tư" / "chủ đầu tư quyết" (2 bước cho FDL/HK/MT; kiểm căn trên app) để người trực không có hướng dẫn cụ thể từ ngày v1.0.4 lên.
- Đề xuất sửa: khi ORC chốt mục B dưới đây, BA thay hai câu đó bằng quy tắc mặc định, kèm "chủ đầu tư có thể đổi".
- Trạng thái: Open

---

## B. Đề xuất cho hai điểm BA để ngỏ (G-BA-104-2)

### B.1 Sau v1.0.4, lễ tân trưởng (FDL), buồng phòng (HK), bảo trì (MT) có bật xác thực 2 bước không?

**Sự thật đang có:**
- Mã chỉ **bắt buộc** 2 bước cho `owner`, `manager` (`MFA_REQUIRED_ROLES`). Muốn bắt buộc vai khác thì phải sửa mã. Nếu không sửa mã, "bắt buộc" chỉ là quy định của khách sạn: người dùng tự bật trên Desk, chủ đầu tư kiểm.
- **Hôm nay OTTIMO không có tài khoản nào chỉ là FDL, HK hay MT.** Người trực 6 vai đã bắt buộc 2 bước vì có vai quản lý. Người dọn thuê theo giờ không có tài khoản. Câu hỏi này chỉ có hiệu lực khi tuyển người.
- Người dùng mất cả điện thoại lẫn mã khôi phục: chỉ chủ đầu tư xử lý được, và phải gặp tận mặt (A111, decision-log 03/11 RN103-05).
- Mức dữ liệu và tiền mỗi vai chạm tới (rbac-matrix):
  - **FDL** xem **Giấy tờ & khai báo** (S09: ảnh, số giấy tờ). FDL duyệt miễn/giảm trong hạn mức (≤ 300.000 đ/lần, ≤ 1.500.000 đ/tháng), xác nhận nâng hạng, nhận phòng vào căn chưa sẵn sàng.
  - **HK** không xem giấy tờ, chỉ thấy trạng thái căn và tên khách trong phạm vi việc. **MT** không thấy tên khách. Cả hai không chạm tiền.

**Phương án:**

| | A – Bắt buộc cả ba vai | B – Bắt buộc FDL; HK, MT tùy chọn | C – Chưa yêu cầu ai |
|---|---|---|---|
| Bảo vệ | Cao nhất | FDL được bảo vệ như quản lý. Đây là vai duy nhất trong ba vai xem giấy tờ và đụng tiền | FDL xem giấy tờ khách mà chỉ có mật khẩu |
| Vận hành | HK/MT hay đổi người, hay dùng điện thoại cũ hoặc dùng chung. Mất điện thoại lúc 07:00 thì buồng phòng không vào app, căn trễ sẵn sàng, chủ đầu tư phải tới gặp tận mặt | FDL thường là người ổn định, có điện thoại riêng. FDL mất máy thì quay về cách 13.2a (kiểm bằng mắt) trong lúc chờ | Không thêm việc |
| Chi phí | Sửa mã + gánh khôi phục cho chủ đầu tư | Ngay: quy định trên sổ tay, chủ đầu tư kiểm lúc tạo tài khoản. Sau: thêm `front_desk_lead` vào `MFA_REQUIRED_ROLES` (backlog v1.0.5, ARC + SEC quyết cách làm) | 0 |

**DOM đề xuất B:**
- **FDL bắt buộc** từ khi OTTIMO có tài khoản FDL đầu tiên.
  - Trước khi có mã ép, chủ đầu tư làm 3 việc: tạo tài khoản; người đó bật 2 bước trên Desk ngay buổi đầu (quét bằng điện thoại riêng, cất 10 mã); chủ đầu tư nhìn thấy đã bật rồi mới giao việc.
  - Nên đưa việc sửa mã vào v1.0.5, để không phụ thuộc trí nhớ.
- **HK, MT tùy chọn.**
  - Cho bật nếu người đó có điện thoại riêng và giữ được mã khôi phục. Không khuyến khích chủ động.
  - Bảo vệ cho hai vai này dựa vào ba lớp đang có: mật khẩu mạnh, thư bảo mật, quy trình người nghỉ hẳn (thẻ 02).
- Lời dặn cũ "không bật ở v1.0.x" bỏ như BA đã ghi.

**Có cần INV quyết không:** **không cần ESC.**
- Đây là quy định bảo mật tài khoản nhân viên. Nó không phải chính sách giá, giờ hay phạt với khách, và chưa áp lên ai hôm nay.
- SEC có ý kiến về mặt bảo mật. Nếu SEC đồng ý B, ORC ghi vào báo cáo cuối round một dòng: "mặc định: lễ tân trưởng bật 2 bước, buồng phòng/bảo trì tùy chọn; chủ đầu tư đổi được".
- **Chỉ thành câu hỏi cho INV** nếu SEC muốn A, vì A thêm việc cho chính chủ đầu tư mỗi lần nhân viên mất máy.

### B.2 Người trực (vai quản lý) vào được app: kiểm căn chuyển sang app, hay giữ `02` mục 13.2a?

**Sự thật đang có:**
- **A81** cho OWN, MGR, FDL bấm **Kiểm phòng** (`VC` → `VI`). Người trực giữ cả vai quản lý lẫn lễ tân trưởng, nên từ v1.0.4 đã có quyền kiểm trên app. Trước đây chỉ bị chặn ở bước đăng nhập 2 bước.
- 13.2a là cách tạm: kiểm bằng mắt theo 12 mục rồi bấm **Làm xong**. Căn ở `VC`, Desk không ghi ai kiểm, lúc nào, mục nào chưa đạt.
- Kiểm trên app (14.2, BR-808) có 4 lợi:
  - ghi từng mục trong 12 mục;
  - **Chưa đạt** tự sinh việc "Dọn lại" và gắn cờ "Kiểm chưa đạt";
  - nhận phòng vào căn có cờ thì Desk cảnh báo lễ tân;
  - căn lên `VI` thì sơ đồ phòng phân biệt được căn đã kiểm và căn mới dọn.

**Phương án:**

| | A – Chuyển sang app từ ngày v1.0.4 lên | B – Giữ 13.2a |
|---|---|---|
| Lợi | Có dấu vết kiểm (ai, giờ, mục chưa đạt). Căn chưa đạt không lặng lẽ thành "Làm xong". Cùng một cách với khi có FDL riêng, nên không phải dạy hai lần | Không đổi thói quen |
| Thiếu | Thêm khoảng 1–2 phút mỗi căn để đánh dấu 12 mục. Cần mạng (căn mất Wi-Fi thì dùng 4G) | Không có dấu vết. Căn `VC` và căn đã kiểm trông như nhau trên Desk. Sổ tay phải giữ hai cách |
| Rủi ro riêng OTTIMO | Người trực vừa dọn vừa kiểm căn của chính mình (tự kiểm). Ở cơ sở 10 căn một người thì không tránh được, và hôm nay cũng đang như vậy. App ít nhất ghi lại | – |

**DOM đề xuất A**, kèm 4 điều:
1. **Giữ nguyên mốc giờ của 13.2a:**
   - căn trống từ đêm qua có khách đến: kiểm xong **trước 11:00**;
   - căn khách trả có khách mới cùng ngày: kiểm xong **trước 14:00**;
   - căn trống quá 3 ngày: kiểm lại trong ngày khách đến.
   Chỉ đổi chỗ ghi: bấm **Kiểm đạt – sẵn sàng** trên app thay cho chỉ bấm **Làm xong**.
2. **Trình tự:** dọn xong → **Làm xong** (căn `VC`) → kiểm trên app → `VI`. Người dọn theo giờ không có tài khoản: người trực bấm **Làm xong** thay, rồi kiểm trên app.
3. **Dự phòng:** app không vào được (mất mạng, mất điện thoại, chưa nhận mã) thì quay về 13.2a cho căn đó, và ghi sổ giao ca "Kiểm bằng mắt căn … – hh:mm – lý do". 13.2a ở lại sổ tay với vai **dự phòng**, không còn là cách chính.
4. **Nhận phòng:** từ khi chuyển, nhận khách vào căn `VI`. Căn còn `VC` lúc khách tới thì kiểm trên app ngay, hoặc làm như 7.4 (nhận phòng khi buồng chưa sẵn sàng), không nhận thẳng như trước.

**Có cần INV quyết không:** **không cần ESC.**
- Đây là chuẩn vận hành buồng phòng (BR-802, BR-808, quyền DOM). Không đổi giá, giờ nhận/trả phòng hay chính sách với khách.
- Người làm thêm việc là người trực, nên ORC **báo** INV trong báo cáo cuối round: "từ v1.0.4 người trực kiểm căn trên app nhân viên (khoảng 1–2 phút mỗi căn), cách cũ giữ làm dự phòng; chủ đầu tư muốn giữ cách cũ thì báo".
- BA sửa `02` 1.8, 13.2a, 14.2, 2 (bảng việc) và `01` 1.8 theo đề xuất này sau khi ORC chốt.

---

## B.3 (ORC giao thêm) Thẻ Minor của BE-C về BR-108-03

- Nguồn: `origin/v104/be-lease-prices`, `rounds/round-04/outputs/BE/v104-be-lease-prices.md` mục 6, "Gửi DOM (Minor)".
- **DOM xác nhận: BE-C đúng.** Số kỳ vọng **23.200.000 giữ nguyên**, chỉ sửa `params` của dòng.
  - 23.200.000 = 29 × 800.000, theo lịch giá 01/11:
    - không tăng cuối tuần/lễ (BR-104, ESC-045 câu 1 = A);
    - không giảm theo số đêm (BR-107, `los_discount = []`).
  - Dòng BR-108-02 đã khai lịch này. BR-108-03 thì thiếu. Validator nhân thẳng giá đêm × số đêm nên vẫn ra đúng. Còn `byCalc` gộp lên DS-E thì có giảm theo số đêm (từ 7 đêm) và tăng cuối tuần, nên ra số khác. Lỗi nằm ở dòng fixtures, không nằm ở mã BE.
- Đã sửa trên `v104/dom-br-fixtures` @ `6bddbc29`, commit và push:
  - BR-108-03 thêm `weekend_uplift_pct 0`, `weekend_nights [FRI,SAT]`, `special_uplift_pct 0`, `los_discount []`, và ghi chú nguồn;
  - `validate-fixtures.mjs`: hàm `stayKindByNights` báo lỗi khi dòng tính tổng ngắn ngày mà thiếu lịch 01/11. Như vậy dòng mới cùng loại không lặp lại lỗi này.
  - Đã thử: xóa `los_discount` của BR-108-03 thì validator báo 1 lỗi; trả lại thì 0 lỗi.
  - `reservations-pricing` + `frontdesk-rules`: 105/105.
- BE-C: lấy dòng này từ `v104/dom-br-fixtures` (gộp P4-20 trước P4-11, hoặc rebase P4-11 lên), rồi để `byCalc` gộp `params` của dòng như các dòng khác (dòng đã có `calc: stayKindByNights`). Thẻ đóng khi test BE đọc BR-108-03 ra 23.200.000.

## C. Điều kiện để ĐẠT
- Sửa thẻ **01** và **02** trước khi ORC báo INV "v1.0.4 đã lên" (thẻ 01 phải có trước ngày thay tờ).
- Thẻ 03–05 sửa cùng lượt nếu kịp; nếu không kịp, dời sang lượt sửa v1.0.4.1 được.
- Thẻ 06 sửa sau khi ORC chốt mục B.
