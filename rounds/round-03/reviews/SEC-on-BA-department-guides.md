# SEC review – Bộ hướng dẫn OTTIMO Desk v1.0 theo bộ phận

- Người review: SEC | Round 3 – Bước **Review** | 30/10/2026 | Hạn: trước buổi đào tạo C3a tối 31/10
- Đối tượng: `product/docs/manual/guides/00-index.md` … `05-sale-ctv.md`, `screenshot-additions.md`; bản HTML `product/docs/manual/guides/html/*.html` (gồm `your-id-details-tablet.html`); báo cáo BA `rounds/round-03/outputs/BA/department-guides.md` (A4, A5, A6, S1–S4); `rounds/round-03/reviews/DOM-on-BA-department-guides.md` (G14, G16); `rounds/round-03/outputs/UXD/department-guides-html.md` (mục 4, B1, B6).
- Đối chiếu mã `main`:
  - `identity/internal/users.service.ts`: `resetPassword` không gỡ khóa và không gỡ 2 bước; `status=active` gỡ cả khóa tạm lẫn khóa cứng; không tự đặt lại cho chính mình.
  - `identity/internal/auth.service.ts`: khóa cứng chờ owner mở.
  - `identity/public/operator-reset.ts` cùng CLI `mfa-operator-reset`: chỉ xóa 2 bước, không đổi mật khẩu.
  - `identity/internal/mfa.service.ts`: đăng ký lại hủy mọi phiên.
  - `apps/admin-web/src/pages/UsersPage.tsx`: không có nút đặt lại 2 bước cho người khác, dù API `resetUser2fa` có.
  - Thủ tục 06.33 ngoài repo: SEC chỉ đối chiếu phạm vi, không chép nội dung. Thủ tục này ghi rõ "lệnh không đổi mật khẩu" và nêu giới hạn đã biết: owner duy nhất quên mật khẩu thì chưa có đường khôi phục.
- Căn cứ khác: ESC-027 (INV chọn B ngày 22/10), decision-log 26/10 (diễn tập 06.33 đạt), decision-log 30/10 (SEC D-T4), `SEC-on-BA-user-manual.md`.

## Kết luận

Bộ hướng dẫn dùng được cho C3a sau khi BA chép **4 thẻ Major**. Không có Blocker.
- Phần đăng nhập của từng vai viết đúng: mật khẩu tạm đưa tận tay, không gửi chat; không lưu mật khẩu trên trình duyệt; chỉ gõ địa chỉ; 2 bước cho OWN/MGR; không làm 2 bước và mã khôi phục trên máy quầy; "không ai hỏi mã".
- Không câu nào dạy vòng qua tách nhiệm. Hoàn tiền viết đúng "người tạo không tự duyệt, không tự chi", duyệt tại quầy bằng tài khoản của chính người duyệt.
- Không lộ dữ liệu khách: không có số, tên đăng nhập hay bí mật thật. Bản HTML không còn bình luận nguồn và không gọi mạng.
- Chỗ sai đáng kể nhất nằm ở **khôi phục tài khoản**:
  - Dòng "chủ đầu tư quên mật khẩu → thủ tục khôi phục riêng" sai: thủ tục đó không đổi mật khẩu (G01).
  - Người trực mất cả điện thoại lẫn mã khôi phục: tài liệu chỉ chủ đầu tư "Đặt lại mật khẩu", nhưng cách này không gỡ 2 bước. Người trực sẽ không vào được Desk (G03).
  - Lần đăng nhập đầu của người trực được hướng dẫn làm trên máy quầy, nên mã khôi phục sẽ hiện ngay trên máy quầy (G02).

| Mức | Số thẻ |
|---|---|
| Blocker | 0 |
| Major | 4 (G01–G04) |
| Minor | 4 (G05–G08) |
| Suggestion | 1 (G09) |

## Quyết định SEC cho 4 điểm BA hỏi

**S1 – Tờ "Your ID details" trên máy tính bảng: ĐỒNG Ý, chỉ là cách dự phòng, có điều kiện (thẻ G04).**

Thứ tự dùng:
1. **Bản in A4** trong khung mica trên quầy (cách chính, INV 30/10).
2. **Bản in dự phòng** trong ngăn quầy (DOM G14).
3. **Máy tính bảng**, chỉ khi chưa thay được bản in.

Điều kiện cho máy tính bảng:
- **Thiết bị:** chỉ một **máy tính bảng của cơ sở, dành riêng** cho tờ này. Không dùng:
  - máy quầy hay màn hình của máy quầy (đang chạy Desk có giấy tờ khách);
  - điện thoại cơ sở (có Zalo OTTIMO với tin của khách);
  - máy cá nhân;
  - máy có app khóa cửa.
- **Không cấp quyền thiết bị** cho máy này ở **Thiết bị được cấp**. Trên máy không đăng nhập Desk, app nhân viên, Zalo, email, app khóa cửa, ngân hàng. Không có tài khoản cá nhân đồng bộ ảnh hay tin nhắn.
- **Khóa máy:** có mật mã màn hình, tự khóa khi không dùng. Lúc quay về phía khách:
  - khóa vào tờ bằng **Truy cập được hướng dẫn** (iPad) hoặc **Ghim ứng dụng** (Android), để khách không thoát ra được;
  - bật **Không làm phiền** để không hiện thông báo.
- **Chỉ có tờ này:** trên máy chỉ có `your-id-details-tablet.html` hoặc bản PDF A4 của tờ. Mở từ tệp lưu trên máy, không cần mạng.
  - **Không chép** cả thư mục bộ hướng dẫn hay các tệp 00–05 lên máy này.
  - Không mở tờ từ link Zalo hay email.
  - Không đưa thư mục `guides/html/` lên mạng để máy tính bảng mở bằng địa chỉ web. Nếu sau này cần địa chỉ web cho tờ (ví dụ để "Thêm vào Màn hình chính" trên iPad), ARC/OPS chỉ đăng **riêng tờ này**, vì nội dung tờ là công khai, và SEC duyệt trước.
- Không có máy đạt đủ các điều kiện trên thì **không dùng cách màn hình**, dùng bản in dự phòng.

**S2 – Chủ đầu tư quên mật khẩu, mất điện thoại 2 bước: tài liệu SAI một dòng, THIẾU một nhánh (G01, G03, G05).**
- Không ai trong Desk đặt lại được mật khẩu hay 2 bước cho chủ đầu tư. Desk chặn tự đặt lại cho mình, và OTTIMO chỉ có một chủ đầu tư (ESC-027 B). Phần này tài liệu nên nói rõ để chống lừa.
- **Mất điện thoại, còn mã khôi phục:** dùng mã, đăng ký lại. Đăng ký lại hủy mọi phiên, kể cả phiên trên máy mất. Tài liệu viết đúng.
- **Mất cả điện thoại lẫn mã:** thủ tục khôi phục riêng (06.33, đã diễn tập 26/10). Tài liệu viết đúng và không lộ chi tiết.
- **Quên mật khẩu, hoặc bị khóa cứng:** hiện **chưa có đường khôi phục**. Lệnh 06.33 không đổi mật khẩu, không mở khóa. SEC xếp rủi ro **Medium**:
  - khả năng thấp nếu chủ đầu tư lưu mật khẩu trong trình quản lý mật khẩu;
  - hậu quả là các việc chỉ chủ đầu tư làm được (duyệt và chi hoàn tiền, tài khoản VietQR, người dùng, thiết bị) dừng tới khi có lệnh mới, còn quầy vẫn chạy.
- Tạm chấp nhận tới khi có lệnh quản trị khôi phục tài khoản chủ đầu tư (đề nghị PO xếp, xem "Ghi chú cho các vai khác"). Không lập ESC: đây không phải Critical/High, và INV đã chọn B ở ESC-027.
- **Người trực (có vai quản lý) mất cả điện thoại lẫn mã:** Desk v1.0 không có nút đặt lại 2 bước cho người khác. Cách nhanh, có nhật ký và làm trên Desk: chủ đầu tư khóa tài khoản cũ rồi tạo tài khoản mới cho người đó (G03).

**S3 – Sale nội bộ gửi mã VietQR khi không ở quầy: KHÔNG tự gửi, nhờ người trực (G06).**
- v1.0 **không cấp thiết bị thứ hai** để nhắn khách. Không đăng nhập Zalo của OTTIMO trên điện thoại hay máy tính cá nhân (kể cả Zalo PC/Web). Lý do:
  - lịch sử tin của khách nằm lại trên máy cá nhân;
  - khi người đó nghỉ việc thì không thu hồi được.
- Sale ngoài quầy báo **chỉ mã đơn** cho người trực, bằng cách gọi điện hoặc nhắn **chỉ mã đơn**, không kèm tên hay số của khách. Người trực mở đơn trên Desk ở điện thoại cơ sở và gửi mã từ tài khoản OTTIMO kèm câu chống giả danh.
  - Lý do: câu chống giả danh nói "OTTIMO chỉ nhắn từ tài khoản này". Mã gửi từ Zalo cá nhân là trái chính câu đó.
- CTV: khách nói chuyện với CTV qua Zalo của CTV, đây là bản chất của CTV, chấp nhận được. Nhưng CTV phải báo khách trước rằng mã cọc do OTTIMO gửi, và CTV không nhận tiền cọc. Lễ tân gửi mã **thẳng cho khách**, không gửi cho CTV để chuyển tiếp.
- Sau này, khi có Zalo OA đã xác thực: chủ đầu tư có thể thêm sale làm nhân viên OA trên máy của cơ sở, rồi thu hồi khi nghỉ. Lúc đó SEC xem lại.

**S4 – Chương Đăng nhập 5 tệp: thứ tự đúng sổ tay 0.2–0.4 và SEC B1–B6, trừ G02, G03, G05.**
- Giả định A1 (buồng phòng, bảo trì đổi mật khẩu tạm trên Desk trước) không có rủi ro bảo mật: vai HK/MT trên Desk không mở được trang nào có dữ liệu khách. Chờ QA Q2 xác nhận.

---

## Thẻ feedback

### FB-R3-SEC-BA-G01
- Mức độ: Major
- Vị trí: `01-chu-dau-tu-quan-ly.md` mục 1.7, dòng "Chủ đầu tư quên mật khẩu, hoặc mất cả điện thoại lẫn mã khôi phục"; chú thích `BA-GUIDES S2` (A5)
- Vấn đề:
  - Dòng này gộp "quên mật khẩu" vào thủ tục khôi phục riêng. Nhưng thủ tục đó (06.33) **chỉ xóa 2 bước, không đổi mật khẩu**. Chính thủ tục ghi: chủ đầu tư duy nhất quên mật khẩu thì chưa có đường khôi phục.
  - Desk chặn mọi người tự đặt lại mật khẩu cho mình (`NOT_ALLOWED_FOR_SELF`), và OTTIMO chỉ có một chủ đầu tư. Khóa cứng (3 lần khóa trong 24 giờ) cũng chỉ owner khác mở được.
  - Tài liệu đang hứa một đường không có.
- Vì sao quan trọng:
  - Đúng lúc cần, chủ đầu tư và đội sẽ tìm một thủ tục không tồn tại. Áp lực đó dễ dẫn tới sửa thẳng cơ sở dữ liệu, tức không có nhật ký và không xác minh.
  - Tài liệu cũng chưa dặn cách phòng duy nhất hiện có: lưu mật khẩu cẩn thận và dừng trước khi bị khóa cứng.
- Đề xuất sửa: tách thành hai dòng trong bảng mục 1.7:
  > | Chủ đầu tư mất cả điện thoại lẫn mã khôi phục | Làm theo thủ tục khôi phục riêng đã diễn tập với đội kỹ thuật (không ghi trong tài liệu này) |
  > | Chủ đầu tư quên mật khẩu | Ở v1.0 **chưa có cách khôi phục**: không ai trong Desk đặt lại được mật khẩu cho chủ đầu tư, thủ tục khôi phục riêng cũng không đổi mật khẩu. Vì vậy: lưu mật khẩu Desk trong **trình quản lý mật khẩu** ngay khi đặt (không lưu trên trình duyệt). Gõ sai **2 lần** thì dừng, mở trình quản lý mật khẩu xem lại: gõ sai tiếp Desk sẽ khóa, và chỉ một chủ đầu tư khác mới mở được. Đã quên hẳn: gọi đội kỹ thuật, không tự thử tiếp. |

  Thêm sau câu "**Không ai** – chủ đầu tư, quản lý, đội kỹ thuật…" ở cuối mục 1.7:
  > Không ai trong Desk đặt lại được mật khẩu hay 2 bước cho chủ đầu tư. Ai nhắn hay gọi nói "đặt lại giúp" rồi xin mật khẩu, mã 6 số hay mã khôi phục là lừa đảo, kể cả khi xưng đội kỹ thuật.

  Xóa chú thích `BA-GUIDES S2`. Không ghi tên lệnh, máy chủ hay câu xác minh vào tài liệu.
- Trạng thái: Open

### FB-R3-SEC-BA-G02
- Mức độ: Major
- Vị trí: `02-le-tan.md` mục 1.2, bước 1 ("Mở trình duyệt trên máy quầy") và mục 1.3 ("Bật lần đầu… không làm trên máy quầy"); `01` mục 1.9 bước 7
- Vấn đề:
  - Người trực hiện nay có vai quản lý. Desk mở **Bật xác thực 2 bước** ngay sau bước 6 của mục 1.2 (`MFA_ENFORCED`), không cho bỏ qua.
  - Làm mục 1.2 trên máy quầy như hướng dẫn thì mã QR bí mật và **10 mã khôi phục** hiện trên máy quầy. Điều này trái chính mục 1.3 và `01` mục 14.2.
  - `01` mục 1.9 bước 7 ("ngồi cùng người đó lần đăng nhập đầu") cũng chưa nói làm trên máy nào.
- Vì sao quan trọng:
  - Máy quầy dùng chung, có máy in chung, có lịch sử tải về. Mã khôi phục lộ ở đó thì ai có mật khẩu người trực sẽ vào được tài khoản 6 vai mà không cần điện thoại.
  - Lần đăng nhập đầu trên Desk thật diễn ra ngay buổi C3a (31/10–01/11).
- Đề xuất sửa: thêm vào đầu `02` mục 1.2, trước bước 1:
  > **Tài khoản có vai quản lý (người trực hiện nay):** làm lần đăng nhập đầu trên **laptop hoặc máy tính riêng** (của mình, hoặc của chủ đầu tư sau khi chủ đầu tư đã đăng xuất), **không làm trên máy quầy**. Ngay sau bước 6, Desk mở bật 2 bước và hiện 10 mã khôi phục (mục 1.3). Quét mã QR bằng điện thoại của mình.

  `01` mục 1.9 bước 7, sửa thành:
  > 7. Ngồi cùng người đó lần đăng nhập đầu: đổi mật khẩu tạm. Người có vai quản lý: làm trên laptop riêng (không phải máy quầy), bật 2 bước trên điện thoại riêng của họ, cất mã khôi phục như mục 1.3 bước 5.
- Trạng thái: Open

### FB-R3-SEC-BA-G03
- Mức độ: Major
- Vị trí: `01` mục 1.7, dòng "Quản lý mất cả điện thoại lẫn mã khôi phục"; `01` mục 14.1, dòng "Nhân viên quên mật khẩu, mất điện thoại"; `02` mục 1.7, dòng "Mất cả điện thoại lẫn mã khôi phục"
- Vấn đề:
  - Tài liệu dặn người trực báo chủ đầu tư, còn chủ đầu tư thì **Đặt lại mật khẩu** hoặc **Khóa tài khoản**.
  - Nhưng đặt lại mật khẩu **không gỡ 2 bước** (`users.service.ts`, nhánh `resetPassword` chỉ đổi mật khẩu). Desk v1.0 **không có nút** đặt lại 2 bước cho người khác: API `resetUser2fa` có, nhưng Desk chưa có nút. Sau khi đặt lại mật khẩu, người trực vẫn kẹt ở màn **Nhập mã xác thực**.
- Vì sao quan trọng:
  - Người trực là người duy nhất ở quầy. Kẹt đăng nhập thì cả ca không nhận phòng, không thu tiền được.
  - Chủ đầu tư không biết đường đúng sẽ mất thời gian, hoặc bị dụ làm cách không an toàn: dùng chung tài khoản, đọc mã qua điện thoại.
- Đề xuất sửa:
  - `01` mục 1.7, thay dòng "Quản lý mất cả điện thoại lẫn mã khôi phục":
    > | Quản lý (người trực) mất cả điện thoại lẫn mã khôi phục | Người đó **báo chủ đầu tư**, không xin mã của người khác. Chủ đầu tư, trên máy riêng: (1) **Khóa tài khoản** của người đó ngay; (2) **Thêm người dùng** mới cho chính người đó, **tên đăng nhập mới**, đúng các vai cũ (mục 1.9); (3) đưa mật khẩu tạm tận tay; người đó đăng nhập lần đầu trên laptop riêng và bật 2 bước trên điện thoại mới. Desk v1.0 chưa có nút đặt lại 2 bước cho người khác; **Đặt lại mật khẩu không gỡ 2 bước**. Tài khoản cũ để khóa, không xóa (giữ nhật ký) |
  - `01` mục 14.1, sửa dòng cuối:
    > | Nhân viên quên mật khẩu | **Đặt lại mật khẩu** (mục 1.9) |
    > | Nhân viên mất điện thoại | Không có 2 bước: **Đặt lại mật khẩu** hoặc **Khóa tài khoản**. Có 2 bước (quản lý) mà mất cả mã khôi phục: làm theo mục 1.7 |
  - `02` mục 1.7, dòng "Mất cả điện thoại lẫn mã khôi phục":
    > **Báo chủ đầu tư.** Chủ đầu tư khóa tài khoản cũ và tạo cho anh/chị tài khoản mới (tên đăng nhập mới); đăng nhập lần đầu như mục 1.2 trên laptop riêng. Không xin mã của người khác, không dùng tài khoản người khác trong lúc chờ
- Trạng thái: Open

### FB-R3-SEC-BA-G04
- Mức độ: Major
- Vị trí: `02-le-tan.md` mục 7.2, gạch "**Bản trên màn hình**…" và chú thích `BA-GUIDES S1`; `00-index.md` mục 4, gạch thứ 2; `01` mục 13, gạch "In tờ Your ID details"
- Vấn đề:
  - "Máy tính bảng **hoặc màn hình ở quầy**" cho phép quay màn hình máy quầy (đang chạy Desk có giấy tờ khách) về phía khách. Câu này cũng không nói thiết bị nào, khóa ra sao, trên máy có gì.
  - Chỉ dặn "chỉ hiện tờ thông báo" là chưa đủ: khách chạm được, thông báo Zalo hay tin nhắn có thể hiện đè lên, và máy có thể đang đăng nhập Desk ở tab khác.
  - Cách màn hình đang đặt ngang hàng với bản in, trong khi INV đã chọn bản in A4 là chính (DOM G14).
- Vì sao quan trọng: đây là lúc khách đứng sát quầy, cầm máy nhìn. Một tab Desk, một thông báo tin nhắn của khách khác, hay một chạm thoát khỏi tờ đều làm lộ dữ liệu khách (Nghị định 13/2023), đúng ở bước đang thông báo cho khách về bảo vệ dữ liệu.
- Đề xuất sửa: `02` mục 7.2, thay hai gạch "Cho khách xem bằng một trong hai cách" bằng (gồm cả chữ DOM G14):
  > Cho khách xem theo thứ tự:
  > 1. **Bản in khổ A4** trong khung mica trên quầy, mặt quay ra khách, chỗ khách đứng làm thủ tục, không bị che (cách chính, theo quyết định của chủ đầu tư 30/10).
  > 2. **Bản in dự phòng** trong ngăn quầy. Tờ trên quầy hỏng hay mất thì thay ngay bằng bản này, ghi sổ giao ca để chủ đầu tư in lại trong ngày.
  > 3. **Máy tính bảng của cơ sở** – chỉ khi chưa thay được bản in, và chỉ khi máy đạt đủ điều kiện dưới đây:
  >    - Máy **dành riêng** cho tờ này. **Không** dùng máy quầy hay màn hình máy quầy, điện thoại cơ sở, máy cá nhân, máy có app khóa cửa.
  >    - Máy **không** được cấp quyền thiết bị và **không** đăng nhập Desk, app nhân viên, Zalo, email, app khóa cửa.
  >    - Máy có mật mã màn hình. Trên máy chỉ có tệp **`your-id-details-tablet.html`** (hoặc bản PDF A4 của tờ), mở từ máy, không cần mạng.
  >    - Trước khi quay về phía khách: bật **Không làm phiền**, mở tờ, chạm một lần cho toàn màn hình, rồi khóa vào tờ (iPad: **Truy cập được hướng dẫn**; Android: **Ghim ứng dụng**). Nhìn lại: màn hình chỉ có tờ, dòng chân "OTTIMO · ID notice · 11/2026".
  >    - Máy không đạt đủ điều kiện: **không dùng**.
  >
  > Không có bản in nào và không có máy đạt điều kiện: không nhận giấy tờ, gọi chủ đầu tư.

  - `00` mục 4, gạch thứ 2, thay bằng: "Bản in dự phòng trong ngăn quầy; máy tính bảng của cơ sở chỉ khi chưa thay được bản in và máy đạt đủ điều kiện ở `02` mục 7.2."
  - `01` mục 13, thêm vào gạch "In tờ Your ID details": "In **2 bản** khổ A4 (một trong khung mica, một trong ngăn quầy). Nếu dùng máy tính bảng dự phòng: chuẩn bị máy theo `02` mục 7.2 (không cấp quyền thiết bị, mật mã, chỉ chép tệp `your-id-details-tablet.html`)."
  - Xóa chú thích `BA-GUIDES S1`.
  - UXD dựng lại HTML sau khi BA sửa.
- Trạng thái: Open

### FB-R3-SEC-BA-G05
- Mức độ: Minor
- Vị trí: dòng "Tài khoản bị tạm khóa do sai nhiều lần" ở `02` mục 1.7, `03` mục 1.5, `04` mục 1.5, `05` mục 1.6; `01` mục 1.9 gạch "Trạng thái **Tạm khóa do sai mật khẩu**"
- Vấn đề:
  - "…hoặc nhờ chủ đầu tư đặt lại mật khẩu" không đúng mã. `resetPassword` chỉ đặt lại bộ đếm sai. Nó **không** xóa `locked_until`, cũng không gỡ khóa cứng.
  - Nút gỡ khóa là **Mở khóa** (`status=active`, xóa cả khóa tạm lẫn khóa cứng).
  - Ngoài ra, tài liệu chưa dặn: bị khóa mà mình không gõ sai là dấu hiệu có người dò mật khẩu.
- Vì sao quan trọng: chủ đầu tư đặt lại mật khẩu mà người đó vẫn không vào được, mất thời gian giữa ca. Và một lần dò mật khẩu bị bỏ qua.
- Đề xuất sửa:
  - Bốn tệp 02–05, thay dòng:
    > | Tài khoản bị khóa do sai nhiều lần | Chờ đúng số phút Desk báo, hoặc nhờ chủ đầu tư **Mở khóa**. Bị khóa mà mình **không** gõ sai: báo chủ đầu tư ngay (có thể có người dò mật khẩu) |
  - `01` mục 1.9:
    > Trạng thái **Tạm khóa do sai mật khẩu**: chờ hết thời gian khóa, hoặc bấm **Mở khóa**. Người đó nói không gõ sai: hỏi lại, rồi đổi mật khẩu cho họ (**Đặt lại mật khẩu**) và xem **Cần chú ý**.
- Trạng thái: Open

### FB-R3-SEC-BA-G06
- Mức độ: Minor
- Vị trí: `05-sale-ctv.md` mục 5.1 bước 3 và chú thích `BA-GUIDES S3` (A6); `05` mục 5.2; `05` mục 7.2; `02` mục 4.1
- Vấn đề:
  - Tài liệu chưa nói sale nội bộ ngoài quầy gửi mã cọc thế nào.
  - CTV chưa được dặn báo khách trước rằng mã cọc do OTTIMO gửi.
  - Lễ tân chưa được dặn gửi mã thẳng cho khách của CTV.
  - Hiện sale nội bộ chính là người trực, nên phần sale chưa phát sinh. Phần CTV thì phát sinh ngay khi có CTV.
- Vì sao quan trọng:
  - Lừa đảo tiền cọc là rủi ro tiền thật lớn nhất của kênh Zalo: tài khoản giả danh, hoặc CTV đưa số tài khoản riêng.
  - Câu chống giả danh chỉ có tác dụng khi **mọi** mã cọc đi từ một tài khoản OTTIMO.
- Đề xuất sửa:
  - `05` mục 5.1 bước 3, thay bằng:
    > 3. Nhắn từ tài khoản Zalo/số điện thoại của OTTIMO **trên điện thoại của cơ sở**. Không nhắn khách từ Zalo cá nhân. Không đăng nhập Zalo của OTTIMO trên điện thoại hay máy tính cá nhân (kể cả Zalo PC, Zalo Web). **Làm việc ngoài quầy:** gọi hoặc nhắn người trực **chỉ mã đơn** (không kèm tên, số điện thoại của khách); người trực gửi mã cọc từ tài khoản OTTIMO. Không tự gửi.
  - `05` mục 5.2, thêm gạch đầu:
    > - Khi khách đồng ý giữ chỗ, báo khách trước: mã cọc sẽ do **OTTIMO gửi từ tài khoản OTTIMO**, nội dung chuyển khoản là mã đơn, và **không chuyển tiền cọc cho CTV**. Câu nói với khách: UXD viết EN/VI (thẻ DOM G16). Không gửi số tài khoản, không chụp lại hay chuyển tiếp mã QR cho khách.
  - `05` mục 7.2, thêm gạch:
    > - Không nhận tiền cọc, tiền phòng vào tài khoản của mình; không đưa khách số tài khoản nào.
  - `02` mục 4.1, thêm gạch:
    > - Đơn của CTV: gửi mã cọc **thẳng cho khách** từ tài khoản OTTIMO (số điện thoại trên đơn). Không gửi mã cho CTV để chuyển tiếp.
  - Xóa chú thích `BA-GUIDES S3`.
  - Bản nháp câu cho UXD chốt (giọng OTTIMO: ngắn, điềm tĩnh, không emoji):
    > EN: "Your deposit QR will come from the official OTTIMO account, with your booking code as the reference. Please pay only to that QR, not to me."
    > VI: "Mã QR đặt cọc sẽ do tài khoản chính thức của OTTIMO gửi, nội dung là mã đặt phòng. Anh/chị vui lòng chỉ chuyển theo mã đó, không chuyển cho tôi."
- Trạng thái: Open

### FB-R3-SEC-BA-G07
- Mức độ: Minor
- Vị trí: dòng "Tài liệu nội bộ…" ở đầu `00`–`05`; `00` mục 2 (ai đọc tệp nào) và mục 5; liên quan UXD B6
- Vấn đề:
  - Bộ hướng dẫn nay phát bằng tệp HTML qua Zalo hoặc email (UXD mục 1). Tệp gửi qua Zalo nằm lại trên máy chủ Zalo và máy người nhận, chuyển tiếp được, không thu hồi được. Dòng "Nghỉ việc thì trả lại" không còn đúng.
  - Nội dung **không có bí mật hay dữ liệu khách**: SEC đã kiểm HTML, không có bình luận nguồn, không gọi mạng, không có tên đăng nhập hay số thật. Nhưng tệp `01` tả các kiểm soát chống gian lận và lỗ hổng tạm thời. Ví dụ `01` mục 2.2: thư báo bảo mật chưa gửi ở v1.0, chủ đầu tư kiểm mỗi sáng trước 09:00. Kẻ gian, kể cả CTV bên ngoài, biết điều này thì dễ chọn giờ.
  - Ngoài ra, một tệp "hướng dẫn mới" giả gửi qua Zalo có thể chứa ô đăng nhập giả.
- Vì sao quan trọng: CTV là người ngoài. Tệp lan sang nhóm chat thì không lấy lại được.
- Đề xuất sửa:
  - Dòng in đậm ở đầu `01`–`05`, thay bằng:
    > **Tài liệu nội bộ OTTIMO – không chuyển tiếp cho người ngoài OTTIMO, không gửi vào nhóm chat, không chụp, không đăng lên mạng. Nghỉ việc hoặc hết hợp tác: xóa tệp trên máy và báo chủ đầu tư.** Bộ hướng dẫn chỉ do chủ đầu tư gửi, và không bao giờ có ô đăng nhập hay hỏi mật khẩu; tệp "hướng dẫn" nhận từ người khác thì không mở, báo chủ đầu tư.
  - `00` mục 5, thêm gạch:
    > - Gửi bộ hướng dẫn: chủ đầu tư gửi **riêng từng người** (không gửi nhóm), mỗi người **đúng tệp của vai mình**. CTV chỉ nhận `05`. Tệp `01` chỉ cho chủ đầu tư và người giữ vai quản lý. Người trực 6 vai nhận `01`–`05`. Ai hết hợp tác: **Khóa tài khoản** là việc chính; tệp không thu hồi được.
  - `00` giữ dòng cảnh báo hiện có, thêm vế "không chuyển tiếp cho người ngoài OTTIMO".
- Trạng thái: Open

### FB-R3-SEC-BA-G08
- Mức độ: Minor
- Vị trí: `screenshot-additions.md` dòng G3-02 (cột mô tả: "khi đang mở `staff.staging.ottimo.vn`"); bản dựng `html/03-buong-phong.html` in nguyên mô tả này trong khung "Ảnh mới · chờ chụp"
- Vấn đề:
  - Mô tả ảnh thiếu được bộ dựng in vào tệp phát tay. Vì vậy địa chỉ Desk tập (staging) lộ trong tệp buồng phòng, trái PO thẻ 03 và chú thích ở `00` ("không in địa chỉ staging vào bản phát tay").
  - Cột che của G3-02 chỉ ghi "che thanh địa chỉ nếu có tham số". Ảnh chụp thật sẽ hiện địa chỉ staging.
- Vì sao quan trọng: Desk tập mở từ Internet. Địa chỉ của nó chỉ đưa tận tay trong buổi đào tạo, để giảm người lạ dò tài khoản tập.
- Đề xuất sửa:
  - G3-02, cột mô tả: "…khi đang mở app nhân viên".
  - Cột che: "**Che toàn bộ thanh địa chỉ**; không lộ thông báo hệ điều hành".
  - Rà 18 dòng G còn lại theo cùng quy tắc: mọi ảnh chụp trên staging phải che thanh địa chỉ, hoặc chỉ cắt phần trang.
  - UXD dựng lại. QA kiểm che trước khi commit ảnh G (quy tắc ảnh hiện hành).
- Trạng thái: Open

### FB-R3-SEC-BA-G09
- Mức độ: Suggestion
- Vị trí: `01` mục 14.2 (Không được làm)
- Vấn đề:
  - Tên đăng nhập là một nửa của việc khóa tài khoản: ai biết tên chỉ cần gõ sai đủ lần (5 lần × 3 lượt trong 24 giờ) là khóa cứng.
  - Với chủ đầu tư duy nhất, khóa cứng hiện **không ai mở được** (G01).
  - Tài liệu chưa dặn giữ kín tên đăng nhập của chủ đầu tư.
- Vì sao quan trọng: giảm khả năng ai đó cố ý làm chủ đầu tư bị khóa, tới khi có lệnh khôi phục.
- Đề xuất sửa: thêm gạch vào `01` mục 14.2:
  > - Không cho nhân viên, CTV biết **tên đăng nhập của chủ đầu tư**; không ghi tên này vào sổ giao ca, nhóm chat, tài liệu phát tay.
- Trạng thái: Open

---

## Ghi chú cho các vai khác (không phải thẻ cho BA)

- **PO (xếp hạng mục), ARC, BE, OPS:**
  - Đề nghị một **lệnh quản trị khôi phục tài khoản chủ đầu tư**, chạy theo đúng thủ tục xác minh 06.33 (không có endpoint HTTP). Lệnh làm: đặt mật khẩu tạm hiện một lần (`must_change_password`), gỡ khóa tạm và khóa cứng, hủy mọi phiên, ghi audit `security` (người chạy, mã phiếu), gửi email.
  - Lệnh này đóng "giới hạn đã biết" của 06.33 (G01, G09). Mức SEC: Medium. Đích đề xuất: trong tháng 11, PO xếp. OPS cập nhật thủ tục 06.33 ngoài repo khi có lệnh. Tới lúc đó thủ tục giữ nguyên câu "không tự sửa DB".
  - PO cân nhắc thêm nút **Đặt lại 2 bước** trên Desk cho chủ đầu tư (API `resetUser2fa` đã có, có S2) ở v1.0.x. Khi có nút này, G03 đổi lại thành "chủ đầu tư đặt lại 2 bước", không cần tạo tài khoản mới.
- **UXD:**
  - Dựng lại HTML sau khi BA sửa G04, G07, G08.
  - Thử `your-id-details-tablet.html` trên máy tính bảng thật của cơ sở, nếu có, mở từ tệp trong máy (iPad: ứng dụng Tệp). Cách "Thêm vào Màn hình chính" trên iPad cần một địa chỉ web: **không** đưa thư mục `guides/html/` lên mạng để làm việc này (S1).
  - Chốt câu EN/VI cho G06 theo brand guideline.
- **QA:** khi chụp 19 ảnh G, che toàn bộ thanh địa chỉ staging (G08). Trên Desk tập, thử một lần: tài khoản tập bị khóa tạm → chủ đầu tư tập bấm **Mở khóa** → đăng nhập được (G05; SEC kỳ vọng Đạt theo mã).
- **ORC:**
  - Nhắc chủ đầu tư ở C3a: lưu mật khẩu Desk trong trình quản lý mật khẩu; gõ sai 2 lần thì dừng (G01). Gửi tệp riêng từng người (G07).
  - Không cần ESC.

## Dòng decision-log đề xuất cho ORC

`| 2026-10-30 | 3 | **SEC – bộ hướng dẫn theo bộ phận** (`rounds/round-03/reviews/SEC-on-BA-department-guides.md`, 0 Blocker · 4 Major · 4 Minor · 1 Suggestion): (S1) tờ Your ID details: bản in A4 khung mica là chính + 1 bản in dự phòng; máy tính bảng chỉ dự phòng, chỉ máy riêng của cơ sở không cấp quyền thiết bị, không đăng nhập Desk/app nhân viên/Zalo/email/app khóa cửa, có mật mã, khóa vào tờ (Guided Access/Ghim ứng dụng), tắt thông báo, chỉ chứa your-id-details-tablet.html hoặc PDF A4; cấm dùng máy quầy, điện thoại cơ sở, máy cá nhân; (S2) chủ đầu tư duy nhất quên mật khẩu hoặc bị khóa cứng: v1.0 chưa có đường khôi phục (06.33 chỉ xóa 2 bước) – rủi ro Medium, tạm chấp nhận với biện pháp lưu mật khẩu trong trình quản lý mật khẩu, sai 2 lần thì dừng, giữ kín tên đăng nhập; đề nghị PO xếp lệnh quản trị khôi phục tài khoản chủ đầu tư theo thủ tục 06.33; người trực mất cả điện thoại lẫn mã: chủ đầu tư khóa tài khoản cũ, tạo tài khoản mới (Desk v1.0 không có nút đặt lại 2 bước, đặt lại mật khẩu không gỡ 2 bước); lần đăng nhập đầu của tài khoản có vai quản lý không làm trên máy quầy; (S3) sale nội bộ ngoài quầy không tự gửi mã VietQR – báo chỉ mã đơn cho người trực gửi từ tài khoản OTTIMO trên điện thoại cơ sở; không đăng nhập Zalo OTTIMO trên máy cá nhân; CTV báo khách trước mã cọc do OTTIMO gửi, không nhận cọc; lễ tân gửi mã thẳng cho khách; (S4) bộ HTML gửi riêng từng người đúng tệp của vai (CTV chỉ 05; 01 chỉ chủ đầu tư và người giữ vai quản lý), không chuyển tiếp, xóa khi nghỉ; ảnh G che thanh địa chỉ staging | SEC | Quyền SEC (mức rủi ro, yêu cầu bảo mật kỹ thuật); ESC-027 B đã quyết; không chính sách kinh doanh mới, không ESC |`

## Điểm làm tốt – nên giữ

1. Chương Đăng nhập riêng cho từng vai, giữ đúng các ranh giới bảo mật: mật khẩu tạm đưa tận tay, không lưu trên trình duyệt, chỉ gõ địa chỉ, không làm 2 bước và mã khôi phục trên máy quầy, "không ai hỏi mã", duyệt tại quầy bằng tài khoản của chính người duyệt.
2. Tách nhiệm hoàn tiền viết rõ, nhất quán ở cả `01` và `02` ("người tạo không tự duyệt, không tự chi, kể cả có quyền quản lý"). Không có câu nào gợi cách vòng qua.
3. Tài liệu không lộ thủ tục khôi phục 06.33, không có địa chỉ staging (trừ G08), tên đăng nhập hay số thật. Bản HTML đã bỏ bình luận nguồn và không gọi mạng.
