# DOM review – Sổ tay 1.8 / bộ hướng dẫn 1.6: email nhận thông báo bảo mật (v1.0.3)

- Người review: DOM | Round 4 – Review (QC v1.0.3 ĐK11c, phần DOM) | Ngày: 03/11/2026
- Tác giả: BA (FB-R4-UXD-FE-EM-09). ARC đọc cùng phần ở tệp riêng (trọng tâm S2, `info@`, email hiện dạng che, quay lui).
- Phạm vi (chỉ Markdown, không xem HTML vì HTML chưa dựng lại): `product/docs/manual/user-manual-v1.0.md` mục 0.2, 0.3, 0.3a, 1.1 (khung kiểm sáng), 1.5, 1.7, 1.16, 5.6, bảng thuật ngữ, lịch sử bản 1.8; `guides/01-chu-dau-tu-quan-ly.md` mục 1.4, 1.6, 1.6a, 1.9, 2.2, 10.x, 15.1, bảng mục 15; `guides/02-le-tan.md` mục 1.3, 1.6; `guides/05-sale-ctv.md` mục 1.5; `guides/00-index.md` dòng 1.6.
- Đối chiếu: `rounds/round-04/qc/v1.0.3-gate.md` (2.5 S7, 2.8, ĐK5, ĐK11, ĐK12); `rounds/round-04/plan-v1.0.3.md` (V3-02, V3-07, V3-10, 6.2); mã thật: `product/integrations/notification/email-templates.ts` (4 loại thư và tiêu đề), `product/services/api/src/modules/identity/internal/security-email.service.ts` (luật từ chối hộp thư chung), `product/services/api/src/jobs/email-dispatch.ts` (người nhận `self` / `owner` / `previous`); decision-log 17/10 (`booking@ottimo.vn` là email chung công khai).
- Góc nhìn: chủ đầu tư (một người, ở xa, đọc thư trên điện thoại), quản lý/người trực (vai quản lý, làm ca ở quầy), lễ tân, sale/CTV.

## Kết luận: **Đạt có điều kiện**

Phần "ai làm gì" đúng nghiệp vụ và đủ rõ: mỗi người tự nhập email của mình, chủ đầu tư đặt hộ nhân viên ở **Người dùng & vai**, quản lý không đặt cho người khác, chủ đầu tư khác tự đặt; bắt buộc với chủ đầu tư và quản lý, không bắt buộc với vai khác; xác nhận bằng mật khẩu và mã; "hỏi tận miệng, đọc lại"; thư không có link, không hỏi mã. Tên menu, tên khối, câu báo của Desk khớp nhau giữa 3 tệp.

Còn **4 thẻ Major**. Đây đều là chữ trong sổ tay, BA sửa được trong ngày. Phải sửa **trước khi UXD dựng lại HTML (ĐK11a)**, để HTML được dựng từ bản đã sửa và ORC báo INV "v1.0.3 đã lên" bằng bản đúng:
- FB-01: thiếu cách xử lý 3 trong 4 loại thư, trong đó có thư đổi tài khoản nhận cọc (thư về tiền, quan trọng nhất). Tiêu đề thư này không có chữ "Security notice".
- FB-02: câu "Desk từ chối" khiến người đọc tưởng Desk chặn mọi hộp thư chung. Thực tế Desk chỉ chặn đúng `info@`. `booking@ottimo.vn` vẫn lưu được.
- FB-03: sổ tay nói hai kiểu khác nhau về lúc dừng kiểm bảo mật mỗi sáng. Kế hoạch và gate chốt: dừng khi đội bảo mật báo bỏ.
- FB-04: chưa nói hộp thư nhận phải là hộp chỉ người đó đọc. Không được mở hộp đó trên máy quầy hay máy tính bảng của cơ sở.

Có thêm 3 thẻ Minor và 3 Suggestion, dời được. Không có ESC mới: không có chính sách kinh doanh hay pháp lý nào phải hỏi INV.

---

### FB-R4-DOM-BA-M18-01
- Mức độ: Major
- Vị trí: `user-manual-v1.0.md` 0.3a (câu "ví dụ khi xác thực 2 bước … được đặt lại hoặc email này thay đổi" và hai gạch cuối); `01` 1.6a (cùng câu, bảng "Ai nhận thư khi email thay đổi", hai gạch cuối); `02` 1.6.
- Vấn đề: sổ tay chỉ hướng dẫn kỹ một loại thư là **email đã đổi**. Mã v1.0.3 (`email-templates.ts`) gửi **4 loại**, và chủ đầu tư nhận cả 4 (`email-dispatch.ts`: chủ đầu tư luôn có trong danh sách nhận):

  | Tiêu đề thư (EN / VI, có tiền tố "OTTIMO – ") | Chủ đầu tư nhận khi | Sổ tay có hướng dẫn xử lý? |
  |---|---|---|
  | Security notice: a recovery code was used / … đã dùng mã khôi phục | Một người (kể cả chính mình) đăng nhập bằng mã khôi phục | Không |
  | Security notice: two-step sign-in was reset / … đăng nhập 2 bước đã được đặt lại | 2 bước của một người bị đặt lại, có thể "bởi đội kỹ thuật OTTIMO" | Không |
  | **Notice: the deposit receiving account was changed / Thông báo: tài khoản nhận cọc đã thay đổi** | Đổi tài khoản nhận VietQR | Chỉ có ở 1.7 (`01` 10.x), không dẫn từ 0.3a |
  | Security notice: notification email changed / … email nhận thông báo đã thay đổi | Thêm, đổi, xóa email | Có |

  Thêm hai điểm. (a) Thư đổi tài khoản nhận cọc **không có chữ "Security notice"** trong tiêu đề. Bước 4 của 0.3a lại dạy chủ đầu tư tìm thư theo chữ "Security notice". Ai lọc thư theo chữ đó sẽ lọt đúng thư về tiền. (b) Hai gạch cuối chỉ nói "hỏi lại người đó trong ngày". Nếu người đó trả lời "không phải em" thì sổ tay không nói làm gì tiếp. Sổ tay cũng không nói hỏi qua kênh nào: không nên hỏi qua Zalo, vì tài khoản Zalo cũng có thể đã bị chiếm.
- Vì sao quan trọng: thư bảo mật được làm ra chính là để thay lượt kiểm sáng B1–B6 (kế hoạch v1.0.3, M1). B1–B6 kiểm đúng 3 việc chưa có hướng dẫn: tài khoản nhận tiền, mã khôi phục, đặt lại 2 bước. Bỏ B1–B6 mà chủ đầu tư không biết đọc 3 loại thư này thì mất lớp bảo vệ đúng chỗ có rủi ro tiền: tráo tài khoản nhận cọc, chiếm tài khoản quản lý.
- Đề xuất sửa: ở 0.3a và `01` 1.6a, thay câu "ví dụ …" bằng bảng **"Thư nào – làm gì"** gồm 4 dòng trên. Ghi đúng tiêu đề, và ghi rõ dòng tài khoản nhận cọc có tiêu đề bắt đầu bằng "Notice:". Cột "Không phải việc mình biết trước":
  1. *Mã khôi phục*, thư về chính mình: gõ địa chỉ Desk, đổi mật khẩu, **Tạo bộ mã mới**, gọi đội. Thư về nhân viên: gọi điện cho người đó theo số đã lưu sẵn. Người đó nói không phải mình thì **Khóa tài khoản** ngay (1.5), rồi xem **Cần chú ý**, rồi gọi đội.
  2. *Đặt lại 2 bước*: làm như dòng 1. Nếu thư ghi "bởi đội kỹ thuật OTTIMO" mà mình không đang làm thủ tục khôi phục với đội: gọi đội ngay theo số đã biết, không theo số ghi trong thư.
  3. *Tài khoản nhận cọc*: làm theo 1.7 "Nhận thông báo đổi tài khoản nhận mà anh/chị không làm" (Hủy lịch, đổi mật khẩu, tạo bộ mã mới, báo đội). Lễ tân ngừng gửi mã VietQR tới khi chủ đầu tư xác nhận.
  4. *Email đổi*: giữ như hiện nay, thêm bước "không phải người đó làm → Khóa tài khoản như dòng 1".

  Thêm một câu: "Thư thật từ OTTIMO có thể không có chữ Security notice. Đừng lọc thư theo chữ này. Đánh dấu **Không phải thư rác** cho thư đầu tiên." `02` 1.6 chỉ cần một dòng dẫn tới bảng này (người trực có vai quản lý cũng nhận dòng 1, 2 cho tài khoản của mình).
- Trạng thái: Open

### FB-R4-DOM-BA-M18-02
- Mức độ: Major
- Vị trí: `user-manual-v1.0.md` 0.3a bước 2 gạch 2; `01` 1.6a bước 2; `01` 1.9 bước 3; `02` 1.6 bước 2; `05` 1.5.
- Vấn đề: sổ tay viết "Không dùng hộp thư chung của cơ sở, như `info@`. Desk từ chối: 'Đây là hộp thư chung của cơ sở…'". Người đọc sẽ hiểu Desk tự chặn mọi hộp thư chung. Mã thật (`security-email.service.ts`, `check`) chỉ từ chối **đúng một địa chỉ**, là địa chỉ gửi thư (`EMAIL_FROM` = `info@ottimo.vn`). OTTIMO còn ít nhất một hộp thư chung công khai khác là `booking@ottimo.vn` (decision-log 17/10, in trên brochure). Desk **nhận** địa chỉ này, và nhận cả Gmail chung đang dùng cho extranet Booking/Agoda/Airbnb, hộp thư của quầy, hay email của người nhà. Sổ tay cũng không nói vì sao cấm. Không hiểu lý do thì người ta sẽ chọn "hộp thư nào chung mà Desk không chặn" cho tiện.
- Vì sao quan trọng: ở khách sạn nhỏ, người ta hay dùng hộp thư chung để cả quầy cùng đọc. Thư bảo mật vào hộp thư chung thì chính người đang lạm dụng tài khoản cũng đọc được, rồi xóa đi trước khi chủ đầu tư thấy. Lúc đó tính năng mất tác dụng mà ai cũng tưởng vẫn an toàn.
- Đề xuất sửa: thay bằng: "Dùng **email riêng chỉ mình anh/chị đọc**. **Không dùng hộp thư chung** của cơ sở, như `info@ottimo.vn`, `booking@ottimo.vn`, Gmail dùng cho Booking/Agoda/Airbnb, hộp thư của quầy. Lý do: ai đọc được hộp thư chung cũng đọc và xóa được thư báo. **Desk chỉ chặn được `info@`**. Các hộp thư chung khác Desk không nhận ra, anh/chị phải tự tránh." Ở `01` 1.9 bước 3 (chủ đầu tư đặt hộ), thêm: "Hỏi người đó: 'Hộp thư này chỉ mình em đọc phải không?'"
- Trạng thái: Open

### FB-R4-DOM-BA-M18-03
- Mức độ: Major
- Vị trí: `user-manual-v1.0.md` 1.1 khung "Tạm ở v1.0 – kiểm bảo mật mỗi sáng (tới khi thư 'Security notice' về tới chủ đầu tư …)"; 0.3a khung "Tới khi v1.0.3 lên, Desk chưa có khối này, và chủ đầu tư vẫn kiểm bảo mật mỗi sáng"; `01` 2.2 khung đầu ("Tạm ở v1.0 (tới khi thư 'Security notice' về tới chủ đầu tư …)"); `01` 15.1 câu 1 ("Hết tạm khi thư 'Security notice' về tới chủ đầu tư") và câu 2 ("Vẫn kiểm mỗi sáng tới khi đội bảo mật báo bỏ"); `01` 1.6a khung đầu.
- Vấn đề: có 2 cách nói về lúc dừng lượt kiểm sáng B1–B6, và chúng mâu thuẫn nhau.
  - Cách 1 (sổ tay 1.1, 0.3a; `01` 2.2, 1.6a, 15.1 câu 1): dừng **khi thư về tới chủ đầu tư**, hoặc ngầm hiểu là dừng khi v1.0.3 lên.
  - Cách 2 (`01` 15.1 câu 2, bảng mục 15; sổ tay bảng 5.6): dừng **khi đội bảo mật báo bỏ**.

  Kế hoạch v1.0.3 6.2 bước 5 và V3-07 chốt cách 2: SEC cần `email_dead` = 0 sau 24 giờ, "không bỏ ngay ngày 06/11". Gate ĐK5 cũng ghi "B1–B6 tiếp tục tới khi đội bảo mật báo bỏ". Ngoài ra, sổ tay gốc mục 1.1 và 1.16 không có việc "khi v1.0.3 lên: nhập email ngay, thấy thư thì báo đội 'đã nhận', không dán địa chỉ vào chat". Việc này `01` 15.1 có, nhưng `01` 15.1 lại thiếu ý "không dán địa chỉ email vào chat" (kế hoạch 6.2 bước 2).
- Vì sao quan trọng: chủ đầu tư nhập email, thấy thư đầu tiên về hộp thư, rồi đọc khung 1.1. Rất có thể anh/chị bỏ kiểm sáng ngay hôm sau, trước khi SEC kịp xác nhận đường gửi ổn định. Đây là khoảng hở đúng lúc chuyển đổi, và lỗi hay xảy ra nhất ở chỗ này.
- Đề xuất sửa: thống nhất mọi chỗ thành "**tới khi đội bảo mật báo bỏ** (đội báo qua điều phối viên; thấy thư đầu tiên **chưa** phải lúc bỏ)". Sửa khung 0.3a và `01` 1.6a thành: "Tới khi v1.0.3 lên, Desk chưa có khối này. Sau khi lên vẫn kiểm mỗi sáng tới khi đội bảo mật báo bỏ (mục 1.1)." Thêm vào sổ tay 1.16, hoặc ngay dưới khung 1.1, 3 bước: (1) chủ đầu tư nhập email trước (xem FB-05); (2) thấy thư thì báo đội "đã nhận", **không dán địa chỉ email vào chat**; (3) vẫn kiểm sáng. Thêm ý (2) vào `01` 15.1.
- Trạng thái: Open

### FB-R4-DOM-BA-M18-04
- Mức độ: Major
- Vị trí: `user-manual-v1.0.md` 0.3a; `01` 1.6a; `02` 1.6 (người trực); 0.5 / `02` 1.5 (luật máy quầy).
- Vấn đề: sổ tay dặn dùng "email riêng" nhưng không nói **hộp thư đó được mở ở đâu**. Ở OTTIMO, chủ đầu tư ở xa. Người trực dùng máy quầy cả ngày. Rất hay gặp cảnh Gmail riêng của chủ hoặc quản lý đã đăng nhập sẵn trên máy quầy hay máy tính bảng của cơ sở. Cũng hay gặp hộp thư riêng có cài tự chuyển tiếp sang hộp thư chung. Luật máy quầy hiện chỉ cấm Zalo và ứng dụng chat, chưa nói tới hộp thư.
- Vì sao quan trọng: email "riêng" nhưng đang mở trên máy quầy thì lễ tân cũng đọc và xóa được. Tác dụng của nó lúc đó không hơn `info@`. Thư về tài khoản nhận cọc là thư chủ đầu tư cần thấy trước mọi người khác.
- Đề xuất sửa: thêm vào 0.3a và `01` 1.6a một gạch: "Hộp thư này **không đăng nhập trên máy quầy, máy tính bảng của cơ sở** hay máy dùng chung, và **không cài tự chuyển tiếp** sang hộp thư khác. Nên bật đăng nhập 2 bước cho chính hộp thư đó." Ở luật máy quầy 0.5 và `02` 1.5, thêm "không đăng nhập hộp thư riêng" bên cạnh Zalo/chat.
- Trạng thái: Open

### FB-R4-DOM-BA-M18-05
- Mức độ: Minor
- Vị trí: `01` 15.1 ("anh/chị và quản lý nhập email ngay"); sổ tay 1.16.
- Vấn đề: sổ tay không nói **ai nhập trước**. Thư `email_changed` luôn gửi cho chủ đầu tư (`owner`). Nếu quản lý nhập trước khi chủ đầu tư có email, bản gửi chủ đầu tư thành thư chết `NO_RECIPIENT`. Chủ đầu tư cũng mất một lần thấy thư báo thật về nhân viên. Việc đếm `NO_RECIPIENT` từ giờ T ở gate 2.8 (4b) cũng bị nhiễu.
- Vì sao quan trọng: thư chết không làm sai tiền, nhưng làm nhiễu bằng chứng SEC cần để báo bỏ B1–B6 (FB-03). Nó cũng làm mất buổi tập thật đầu tiên cho chủ đầu tư.
- Đề xuất sửa: ghi rõ thứ tự: "**Chủ đầu tư nhập email trước**, thấy thư của mình rồi mới bảo quản lý nhập. Khi quản lý nhập, chủ đầu tư sẽ nhận một thư báo email của quản lý đã đổi: thư này là bình thường, đây là lần tập đọc thư." ORC/OPS kiểm lại câu này có khớp với giờ T ở runbook không.
- Trạng thái: Open

### FB-R4-DOM-BA-M18-06
- Mức độ: Minor
- Vị trí: `02` 1.6 gạch cuối ("Nhận thư báo email đã đổi mà mình không làm: không trả lời thư, báo chủ đầu tư ngay, đổi mật khẩu").
- Vấn đề: so với sổ tay gốc 0.3a, gạch này thiếu "mở Desk bằng cách **gõ địa chỉ**". Gạch này cũng chỉ nói một loại thư, trong khi người trực có vai quản lý còn nhận thư "đã dùng mã khôi phục" và "đặt lại 2 bước" cho tài khoản của mình.
- Vì sao quan trọng: thư giả thường dụ người ta bấm link. Ở quầy đông khách, lễ tân làm theo đúng câu đang thấy, không mở mục khác để đọc thêm.
- Đề xuất sửa: "Nhận **bất kỳ** thư báo nào của OTTIMO về việc mình không làm: không trả lời, không bấm gì trong thư. Mở Desk bằng cách **gõ địa chỉ**, đổi mật khẩu, gọi chủ đầu tư ngay. Bảng đủ ở `01` mục 1.6a."
- Trạng thái: Open

### FB-R4-DOM-BA-M18-07
- Mức độ: Minor
- Vị trí: `user-manual-v1.0.md` bảng thuật ngữ (dòng **Email nhận thông báo bảo mật**).
- Vấn đề: bảng thuật ngữ có tên trang và tên khối, nhưng chưa có dòng giải nghĩa chữ **Security notice / Thông báo bảo mật**. Người đọc cũng không biết có một thư cùng nhóm mà tiêu đề lại là "Notice: …" (FB-01).
- Vì sao quan trọng: đào tạo bằng bảng thuật ngữ là cách nhanh nhất cho nhân viên mới.
- Đề xuất sửa: thêm dòng "**Security notice (Thông báo bảo mật)**: thư OTTIMO gửi khi có mã khôi phục được dùng, 2 bước bị đặt lại, email đổi. Thư đổi tài khoản nhận cọc có tiêu đề 'Notice: …'. Không có link, không hỏi mã (mục 0.3a)."
- Trạng thái: Open

### FB-R4-DOM-BA-M18-08
- Mức độ: Suggestion
- Vị trí: sổ tay 1.5 / `01` 1.9 gạch **Khóa tài khoản** ("dùng khi nghỉ việc, hết hợp tác CTV …").
- Vấn đề: sổ tay chưa nói email của người nghỉ việc thì xử lý thế nào: giữ hay **Xóa email**. Nếu giữ, mọi thư về tài khoản đã khóa vẫn tới hộp thư riêng của người cũ. Nếu xóa, Desk gửi thêm một thư tới địa chỉ cũ và chủ đầu tư, và lưu email lâu hơn mức cần thì có thể vướng nguyên tắc tối thiểu dữ liệu (Nghị định 13/2023, **cần SEC xác nhận**).
- Vì sao quan trọng: OTTIMO có CTV ra vào thường xuyên. Không có luật chung thì mỗi lần một người làm một kiểu.
- Đề xuất sửa: SEC chọn một cách (đề xuất của DOM: khi nghỉ việc thì **Khóa tài khoản trước, rồi Xóa email**; nói trước với người đó là sẽ có một thư báo). BA thêm một dòng vào 1.5 / `01` 1.9. Có thể làm ở v1.0.4.
- Trạng thái: Open

### FB-R4-DOM-BA-M18-09
- Mức độ: Suggestion
- Vị trí: `02` 1.6 ("Lễ tân, lễ tân trưởng không có vai quản lý: không bắt buộc").
- Vấn đề: lễ tân trưởng có quyền duyệt trong hạn mức và nhận phòng ngoại lệ, nên rủi ro cao hơn lễ tân thường. Sổ tay để chung với các vai không bắt buộc.
- Vì sao quan trọng: nếu tài khoản lễ tân trưởng bị lạm dụng thì có thể miễn giảm hay nhận phòng sai. Thư báo đổi email là cách duy nhất để người đó tự biết.
- Đề xuất sửa: giữ "không bắt buộc" theo đúng Desk, thêm "**khuyến khích** lễ tân trưởng thêm email riêng". Không đổi mã.
- Trạng thái: Open

### FB-R4-DOM-BA-M18-10
- Mức độ: Suggestion (chuyển ARC/SEC, ngoài phần sổ tay)
- Vị trí: đường gửi thư (`docker-compose.prod.yml`: đường chính là relay `smtp-relay.gmail.com`, đường dự phòng là `smtp.gmail.com` với mật khẩu ứng dụng của `info@`).
- Vấn đề: thư bảo mật **gửi từ** `info@ottimo.vn`. Nếu phải chuyển sang đường dự phòng `smtp.gmail.com`, Gmail thường lưu một bản trong "Đã gửi" của hộp thư dùng để gửi. Khi đó ai đọc `info@` cũng thấy nội dung thư bảo mật (có tên nhân viên, giờ). **DOM chưa kiểm được, cần ARC/SEC xác nhận.**
- Vì sao quan trọng: lý do sổ tay cấm dùng `info@` (FB-02) sẽ yếu đi nếu bản sao vẫn nằm trong `info@`.
- Đề xuất sửa: ARC/SEC xác nhận. Nếu đúng thì runbook ghi "dùng đường dự phòng thì xóa thư trong Đã gửi" hoặc giới hạn người đọc `info@`. Sổ tay không cần đổi.
- Trạng thái: Open

---

## Ghi chú cho ORC

- Kế hoạch v1.0.3 6.2 bước 2 ghi menu **"Tài khoản của tôi"**. Desk thật và sổ tay dùng **tên của mình → Bảo mật tài khoản**. Khi báo INV, ORC dùng tên trong sổ tay.
- Sau khi BA sửa FB-01…04, DOM chỉ cần đọc lại phần diff, không cần review lại cả bộ. FB-05…10 không chặn ĐK11.

## Điểm làm tốt (nên giữ)

1. Phân vai rõ, đúng thực tế: mỗi người tự nhập email của mình; chủ đầu tư đặt hộ có "hỏi tận miệng, đọc lại cho người đó nghe"; quản lý không thấy cột Email; chủ đầu tư khác tự đặt. Như vậy không ai đặt được email của người có quyền cao hơn mình.
2. Có bảng "Ai nhận thư khi email thay đổi" (địa chỉ mới / cũ / chủ đầu tư) và câu "thư không có link, không hỏi mã. Thư nào có link là thư giả". Người không rành kỹ thuật cũng làm theo được.
3. Có mốc "sau 15 phút chưa thấy thì xem Spam, rồi kiểm lại địa chỉ", và dặn chủ đầu tư/quản lý dùng **Đổi email** thay cho **Xóa email**. Đây đúng là những tình huống quầy hay gặp.
