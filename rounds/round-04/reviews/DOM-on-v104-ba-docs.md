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

---

## Lượt 2 (04/11) – DOM xác nhận bản sửa BA

- Đọc: `origin/v104/ba-docs` @ `39b61dec`, `rounds/round-04/responses/BA-on-DOM-v104.md`, `git diff 488d9392 39b61dec -- product/docs/manual`.
- Đối chiếu mã @ `39b61dec`: `platform/public/parameter.service.ts` `set()` (hiệu lực ≥ hôm nay; trong ngày không ghi đè dòng đã có hiệu lực, trừ `sameDayOverride` chỉ cho công tắc form website); `config_parameter_def` – `privacy_notice_version` kiểu `text`, `bounds` NULL; `registration.controller.ts` ~458–466 từ chối `noticeVersion` khác tham số đang áp; `RegistrationPage.tsx` dòng 323 gửi bản đã tải lúc mở trang; `work-orders.service.ts` `transition` không bắt đúng người nhận việc khi hoàn tất.

**Kết luận lượt 2: ĐẠT CÓ ĐIỀU KIỆN.** 6/6 thẻ đóng; mở 07–09. Thẻ 07 và 08 phải sửa **trước ngày thay tờ v2** (không chặn v1.0.4 lên). 09 sửa lượt sau cũng được.

### Trạng thái thẻ lượt 1

| ID | Mức | Trạng thái | Ghi chú DOM |
|---|---|---|---|
| 01 | Major | **Closed** | Đủ 7 ý (khung 09:00–11:00, không thay sau 12:00, ≤ 15 phút, cặp tin nhắn, dừng nhận giấy tờ khi chờ, sổ giao ca, tờ EN/RU khi đã in, mở quầy kiểm "v2"). Đường đặt tham số đúng Desk (**Quản trị → Tham số quy tắc → Khác**, **Hiệu lực từ** mặc định hôm nay), không SQL. Nhánh dự phòng: xem thẻ 07 |
| 02 | Major | **Closed** | 8 bước đúng thứ tự; khóa ngay khi cho thôi việc; gỡ Google Chat, tạm ngưng tài khoản `@ottimo.vn`; câu "người trực duy nhất" tốt; mã cho phép người khác hoàn tất phiếu sửa |
| 03 | Minor | **Closed** | Ngoại lệ chủ đầu tư với chuyển khoản ở sổ tay 1.8, `01` mục 4 |
| 04 | Minor | **Closed** | Đủ 4 ý; chữ nhật ký đúng khóa `mlog.a_refund_destination_carried` |
| 05 | Minor | **Closed** | Nút **Nhập nơi nhận hoàn** vẫn hiện; máy chủ ghi đè và đưa về **Chờ duyệt** |
| 06 | Suggestion | **Closed** | B.1, B.2 ghi mọi chỗ, kèm "chủ đầu tư đổi được" |

### Ý kiến về các chỗ BA làm khác

1. G-BA-104-4 (quá 15 phút đặt lại tờ v1): **chấp nhận có sửa** – hướng đúng, nhưng Desk không cho quay về v1 trong ngày (thẻ 07).
2. CTV bước 3, 4, 8 (bước 5 nếu lỡ có trong phòng): **đồng ý** – CTV tạo giữ chỗ (BR-302). Tạm ngưng `@ottimo.vn`, không hứa nút giao lại: đồng ý. Bước 6 chỉ đổi mã khi cho thôi việc: chấp nhận (mã theo lượt ở), trừ căn HĐ thuê tháng (thẻ 09).
3. B.2 ý 4 (căn `VC`): **BA đúng**, DOM trích sai mục 7.4.
4. `02` 14.2 "Áp dụng từ v1.0.4": **đồng ý** (khớp A81, `canInspect`).

### Thẻ mới

#### FB-R4-DOM-BA-104-07
- Mức độ: **Major**
- Vị trí: `guides/00-index.md` mục 4 bước 3; `02-le-tan.md` 7.2 khối **Ngày thay tờ** bước 3, 5, 8; `01` 9.2 dòng `privacy_notice_version`.
- Vấn đề: đã **Lưu thay đổi** với hiệu lực hôm nay thì Desk không cho sửa/quay về v1 trong ngày. (a) Tin nhắn đi chéo: người trực đặt lại tờ v1 đúng lúc chủ đầu tư bấm Lưu → Desk ghi v2 cả ngày, khách đọc v1, không sửa được; sổ tay chưa có câu cho ca đã lỡ đặt, người trực cũng không báo đã đặt lại v1. (b) Gõ sai giá trị (text tự do) → cả ngày ghi bản không có thật; câu "không nhờ đội kỹ thuật" chặn luôn đường xin hỗ trợ.
- Vì sao quan trọng: hỏng nguyên ngày dữ liệu đồng ý của khách, không sửa ngược được.
- Đề xuất sửa (cả `00-index` mục 4 và `02` 7.2):
  1. Chủ đầu tư **dán** giá trị chép từ sổ tay; lưu xong mở lại dòng, bảng lịch sử phải có dòng hôm nay đúng `"privacy-2026-10-v2"` rồi mới nhắn "Đã đặt v2".
  2. Cảnh báo: "Đã bấm Lưu thì trong ngày không quay về v1 được."
  3. Quá 15 phút từ tin "Đã thay tờ v2": **gọi người trực trước**, không lưu.
  4. Người trực đặt lại tờ v1 thì nhắn ngay "Đã đặt lại tờ v1 – hh:mm"; tờ v2 cất cạnh, chưa hủy.
  5. Tin "Đã đặt v2" đến sau khi đã đặt lại v1: đặt lại ngay tờ v2; ghi sổ giao ca **mã đơn** (không tên) của khách làm giấy tờ trong khoảng giữa; báo chủ đầu tư → đội bảo mật xem.
  6. Lưu sai giá trị: dừng nhận giấy tờ, báo đội kỹ thuật ngay (**ngoại lệ** của "không nhờ đội"). Nhầm **Hiệu lực từ** ngày mai: sửa lại với hiệu lực hôm nay.
- Gửi kèm PO/ARC: backlog v1.0.5 – giới hạn `privacy_notice_version` theo danh sách bản đã có.
- Trạng thái: Open

#### FB-R4-DOM-BA-104-08
- Mức độ: Minor
- Vị trí: `02` 7.2 khối **Ngày thay tờ** sau bước 3 (và bước 5).
- Vấn đề: trang giấy tờ mở từ trước khi đổi tham số gửi bản cũ, máy chủ từ chối ở bước đồng ý; người trực không biết vì sao.
- Đề xuất: "Nhận tin 'Đã đặt v2': tải lại (F5) mọi trang giấy tờ đang mở trên máy quầy. Desk báo lỗi ở bước đồng ý: tải lại trang, cho khách xem tờ đang ở quầy, làm lại bước đồng ý."
- Trạng thái: Open

#### FB-R4-DOM-BA-104-09
- Mức độ: Suggestion
- Vị trí: `01` 1.9 **Ngày cuối của người nghỉ** bước 6; sổ tay 1.5.
- Vấn đề: mã cửa căn HĐ thuê tháng sống tới hết hợp đồng; người nghỉ êm vẫn biết mã lâu.
- Đề xuất: "Căn HĐ thuê tháng mà người đó biết mã: hẹn khách đổi mã trong 7 ngày, kể cả khi nghỉ êm."
- Trạng thái: Open

Ghi chú: không cần ESC. SEC đọc thẻ 07 cùng lúc với nhánh dự phòng ngày thay tờ.

---

## Lượt 3 (04/11) – DOM xác nhận `v104/ba-docs` @ `97d7ae5d`: **ĐẠT CÓ ĐIỀU KIỆN**

ORC chép từ báo cáo DOM trong phiên.

### Trạng thái thẻ lượt 2
| Thẻ | Trạng thái |
|---|---|
| FB-R4-DOM-BA-104-07 | Closed |
| FB-R4-DOM-BA-104-08 | Closed |
| FB-R4-DOM-BA-104-09 | Closed |

### Ý kiến về 3 chỗ BA làm khác
Đồng ý cả 3. Riêng việc người trực nhắn "Đặt lại v1 – hh:mm" **trước** khi đặt lại tờ v1 là tốt hơn đề xuất của DOM.

### Thẻ mới

#### FB-R4-DOM-BA-104-10
- Mức độ: Minor (sửa trước ngày thay tờ)
- Vị trí: các dòng Mở quầy đang ghi "Từ v1.0.4".
- Vấn đề: v1.0.4 lên production chưa có nghĩa là đã thay tờ.
- Đề xuất:
  - Sửa thành "từ hôm sau ngày sổ giao ca có dòng 'Thay tờ v2 hh:mm – tham số v2 hh:mm'". Chưa có dòng đó thì không tự thay tờ.
  - Tờ v2 sau khi "Đặt lại v1" thì cất **khỏi** quầy, cho vào phong bì.
- Trạng thái: BA sửa ở `45d09e5a`, DOM chưa mở lượt 4 (xem ghi chú ORC).

#### FB-R4-DOM-BA-104-11
- Mức độ: Suggestion
- Đề xuất:
  - OWN nói "Đã Lưu" trước khi cúp máy.
  - Người trực nói "vừa nhắn đặt lại v1, tờ v2 còn trên quầy".
- Trạng thái: BA sửa ở `45d09e5a`, DOM chưa mở lượt 4.

Ghi chú DOM:
- Số "n đơn" có thể đếm dư, nhưng vô hại.
- Bước 7 cần sửa câu cho gọn.

### Ghi chú ORC (04/11)
- BA đã sửa 10 và 11 ở `45d09e5a`, sau đó thêm `d11705f4` và `4a842a14` (SEC 13/14b, tên nút P4-34).
- SEC đã xác nhận `4a842a14` ĐẠT.
- DOM chưa có lượt 4 riêng cho thẻ 10/11. ORC giao DOM xác nhận nhanh trước khi gộp `v104/ba-docs`. Thẻ 10 phải xong trước ngày thay tờ.

---

## Lượt 4 (04/11) – DOM xác nhận `v104/ba-docs` @ `4a842a14`: **ĐẠT CÓ ĐIỀU KIỆN**

- Đọc: `git diff 97d7ae5d 4a842a14` (3 commit `45d09e5a`, `d11705f4`, `4a842a14`); `rounds/round-04/responses/BA-on-DOM-v104.md` mục 8–8.5.
- Đối chiếu nhãn nút trên `origin/v104/fe-param-cancel`: `strings-vi.json` có **Sửa: {name}**, **Lịch sử thay đổi**, **Chưa hiệu lực**, **Hủy lịch**, **Hủy giá trị đã lên lịch?**, **Lý do** (bắt buộc), "Đã hủy lịch đổi {name}."; `ParamDialog.tsx` chỉ hiện cột **Hủy lịch** khi có dòng `effectiveFrom > today` và người xem sửa được khóa. Tài liệu ghi đúng.
- Gộp `v104/ba-docs` được. Thẻ 12, 13 sửa **trước ngày thay tờ v2**, không chặn gộp và không chặn v1.0.4 lên.

### Trạng thái thẻ lượt 3

| Thẻ | Trạng thái | Ghi chú DOM |
|---|---|---|
| FB-R4-DOM-BA-104-10 | **Closed** | Đủ 4 chỗ mở quầy: `02` mục 2, mục 18, 7.2 bước 11, `00-index` mục 4 bước 9. Không còn dòng mở quầy nào ghi "Từ v1.0.4" (đã grep `product/docs/manual`). Câu "Chưa có dòng đó: tờ v1 là đúng, không tự thay tờ v2" có ở cả 4 chỗ. Tờ v2 cất khỏi quầy, vào phong bì có ghi chữ, sổ giao ca ghi chỗ cất: tốt hơn đề xuất |
| FB-R4-DOM-BA-104-11 | **Closed** | "Đã Lưu" trước khi gác máy có ở cả `00-index` 3.3 và `02` bước 3. Câu "vừa nhắn đặt lại v1, tờ v2 còn trên quầy" ở `02` bước 6. Nghe "Đã Lưu" thì giữ tờ v2 kể cả đã nhắn "Đặt lại v1": đúng, vì Desk đã ghi v2 |
| Ghi chú DOM (bước 7) | **Closed** | Người nghỉ êm: **Đăng xuất** app nhân viên trước bước 3 (khóa), đúng nghiệp vụ |

BA giữ bước xóa tệp v2 trên máy tính bảng khi đặt lại v1 (mục 8.1 ý 2): **đồng ý**. Bản gốc ở chủ đầu tư, quầy chỉ có tệp v1.

### Các thay đổi sau `45d09e5a`

1. **"Không dịch" (sổ tay 2.18 ý 3, `02` 13.1d, nhánh tin đi chéo):** đúng hướng, áp cho mọi khách là đúng. Nhưng chỗ ghi và cách kiểm chưa dùng được ở quầy: xem thẻ 12.
2. **Kiểm lịch hôm trước và sáng ngày thay:** đúng và cần. Kể cả dòng v2 hẹn đúng ngày thay cũng phải hủy: Desk sẽ đổi sang v2 lúc 00:00, khi quầy còn tờ v1 và có thể có khách nhận phòng sớm từ 06:00. Câu "Không được có dòng nào ngày hiệu lực sau hôm nay" đã đủ để chặn trường hợp này.
3. **Đường đi nút Hủy lịch:** đúng nhãn, đúng thứ tự, chỉ chủ đầu tư, "Xem xong đóng hộp, không Lưu": đúng. Còn một chỗ vênh giữa bước 3.4 và bước 5, chưa có lối ra khi Lưu nhầm sang ngày mai rồi phải hủy buổi thay: xem thẻ 13.

### Thẻ mới

#### FB-R4-DOM-BA-104-12
- Mức độ: Minor (sửa trước ngày thay tờ; SEC đọc cùng vì quy tắc gốc là SEC 11, 13)
- Vị trí: `02` 13.1d câu "Khách nói không muốn tin nhắn của mình được dịch"; sổ tay 2.18 ý 3; `02` 7.2 bước 7 và `00-index` mục 4 bước 4 (dòng "không dịch", "chưa xem v2").
- Vấn đề:
  - (a) Sổ giao ca ghi theo ca. Khách ở dài ngày hoặc theo HĐ thuê tháng nói "không dịch" từ tuần trước, thì tối nay người trực phải lật sổ nhiều ngày trước mỗi lần dịch. Lúc 22:00 một mình ở quầy, người trực sẽ bỏ bước này, tức là quy tắc có trên giấy nhưng không ai làm.
  - (b) Khách hỏi qua website chưa có mã đơn, chỉ có mã yêu cầu. Câu hiện tại chỉ nói "mã đơn".
- Vì sao quan trọng: đây là lời hứa trên tờ v2. Dịch tin của khách đã nói "không" là sai lời hứa với khách, và không rút lại được.
- Đề xuất sửa:
  - Ghi "không dịch" (và "chưa xem v2") vào ô **Ghi chú nội bộ** của đơn, để ai mở đơn ở ca nào cũng thấy. Sổ giao ca vẫn ghi để bàn giao ca. Chưa có đơn thì ghi theo **mã yêu cầu** website; khi lập đơn từ yêu cầu đó, chép dòng này sang **Ghi chú nội bộ**.
  - Câu kiểm sửa thành: "Trước khi dịch tin của một khách, mở đơn (hoặc yêu cầu) của khách đó: **Ghi chú nội bộ** có 'không dịch' hoặc 'chưa xem v2' thì không dịch."
  - SEC xác nhận **Ghi chú nội bộ** không in trên bill và không gửi khách. Hai chữ này không phải dữ liệu nhạy cảm.
- Trạng thái: Open

#### FB-R4-DOM-BA-104-13
- Mức độ: Minor (sửa trước ngày thay tờ; SEC đọc cùng vì câu về **Hủy lịch** là câu SEC)
- Vị trí: `00-index` mục 4 bước 1 (ý **Kiểm lịch đã đặt**, câu "không dùng nút này để sửa một lần Lưu sai"), bước 3.4 (câu "Lỗi ở ô khác (ví dụ **Hiệu lực từ**), hoặc Lịch sử không có dòng v2 hôm nay, thì không nhắn… báo đội"), bước 5 (câu "Nhầm **Hiệu lực từ** sang ngày mai… sửa lại dòng đó"); `01` 9.2 nếu có câu tương tự.
- Vấn đề:
  - (a) Bước 3.4 bảo "báo đội", còn bước 5 bảo tự Lưu lại với hiệu lực hôm nay. Hai câu này nói khác nhau về cùng một tình huống.
  - (b) Desk không sửa được dòng cũ. Lưu lại chỉ tạo thêm dòng hôm nay, còn dòng hẹn ngày mai vẫn ở đó. Nếu sau đó buổi thay bị hủy (quá 15 phút, người trực đã đặt lại v1) mà dòng ngày mai còn, thì 00:00 Desk đổi sang v2 trong khi quầy đang để tờ v1. Cả ngày hôm sau ghi sai và không quay lại được. Lần kiểm lịch cho buổi thay sau thì đã quá muộn.
  - (c) Câu SEC "không dùng nút này để sửa một lần Lưu sai" dễ hiểu thành "Lưu nhầm ngày thì không được hủy". Thật ra dòng Lưu nhầm sang ngày mai là dòng **Chưa hiệu lực**, và **Hủy lịch** là đúng cách gỡ dòng đó.
- Đề xuất sửa (thay câu cuối bước 5 và chỉnh câu ở bước 3.4):
  - "Lưu xong mà **Lịch sử thay đổi** có dòng **Chưa hiệu lực** (nhầm **Hiệu lực từ**): bấm **Hủy lịch** ở dòng đó ngay, trong ngày. Còn trong cuộc gọi và người trực nói tờ v2 còn trên quầy: Lưu lại với **Hiệu lực từ** hôm nay, kiểm như bước 3.5. Không còn như vậy: chỉ hủy lịch, không Lưu, người trực làm theo nhánh đặt lại v1. Không hủy được trên Desk: báo đội ngay trong ngày."
  - Bước 3.4: chỉ giữ "báo đội" cho lỗi ở ô khác **Hiệu lực từ** và cho trường hợp Lịch sử không có dòng hôm nay **lẫn** dòng **Chưa hiệu lực**.
  - Câu SEC ở bước 1 sửa thành: "Dòng đã có hiệu lực hôm nay không hủy được. **Hủy lịch** không sửa được một lần Lưu sai giá trị hôm nay. Dòng Lưu nhầm sang ngày mai thì hủy được (bước 5)."
- Trạng thái: Open

Ghi chú: không cần ESC. Hai thẻ đều thuộc tài liệu và không đổi mã.

---

## Lượt 5 (04/11) – DOM xác nhận `v104/ba-docs` @ `0699b1de`: **ĐẠT**

- Đọc: `git diff 8ddde2ae 0699b1de`, `rounds/round-04/responses/BA-on-DOM-v104.md` mục 9, `rounds/round-04/reviews/BA-on-FE-internal-note.md`. Câu báo "Đã lưu {name}, hiệu lực từ {date}." (`params.saved`) có trong `strings-vi.json` trên `origin/v104/fe-param-cancel`.
- Không còn điều kiện nào trước ngày thay tờ v2 từ phía DOM.

### Trạng thái thẻ lượt 4

| Thẻ | Trạng thái | Ghi chú DOM |
|---|---|---|
| FB-R4-DOM-BA-104-12 | **Closed** (BA làm khác đề xuất, DOM chấp nhận) | BA đã kiểm: Desk v1.0.4 không có ô ghi chú mà ca sau mở đơn là thấy. Ô **Ghi chú nội bộ** chỉ có khi tạo đơn kênh Nội bộ; ô của yêu cầu website bị xóa khi lập đơn. Vì vậy dùng **trang Không dịch** ở đầu sổ giao ca là đúng. Trang này giải được cả hai ý: một trang dùng chung mọi ca, mọi ngày (khách dài ngày, HĐ thuê tháng không bị sót), và ghi theo `REQ-…` khi chưa có đơn. Đọc trang lúc mở quầy và kiểm trước mỗi lần dịch: đủ nhanh cho một người trực. Chỉ ghi mã: đúng |
| FB-R4-DOM-BA-104-13 | **Closed** | Đúng đề xuất. Bước 3.4 và bước 5 hết vênh. Bước 3.5 thêm "không có dòng **Chưa hiệu lực**". Thứ tự Hủy lịch → Lưu lại / chỉ hủy → nhánh đặt lại v1 là đúng. `02` bước 3 có câu cho người trực. Chủ đầu tư nhận ra Lưu nhầm ngày ngay từ câu báo "hiệu lực từ {date}" |

### G-BA-104-6 (dòng trên trang Không dịch giữ nguyên, không gạch): **DOM xác nhận**

- "Không dịch" là ý của khách, không có hạn. "Chưa xem v2" chỉ ghi khi khách đã không xem, hoặc đã về mà chưa xem, tức là chuyện đã xong. Cả hai không có lúc nào cần gạch.
- Trang chỉ có mã, không có tên, số điện thoại hay số căn, nên giữ lâu không rủi ro. Mã `REQ-…` vẫn ở trên trang sau khi Desk xóa yêu cầu (WR8, T19): chấp nhận được, vì mã không cho biết khách là ai.
- Thêm một ý, BA ghi ở lượt sửa sau cũng được, không phải điều kiện: khi sổ giao ca hết trang và thay sổ mới, chép nguyên trang Không dịch sang đầu sổ mới. Khách quay lại với đơn mới (mã `OTM-…` mới) thì trang không tự nhận ra. Khách nhắc lại thì ghi dòng mới.

### G-BA-104-7 (ô Ghi chú nội bộ ở `02` 5.2 và mục 6 ý 5)

- DOM ghi nhận: lỗi này có từ trước và không thuộc v1.0.4.
- Chờ FE/PO trả lời FB-R4-BA-FE-IN-01. Nếu BA chuyển các câu đó sang sổ giao ca, DOM đọc lại lúc đó.

Ghi chú: không cần ESC. Không có thẻ mới.
