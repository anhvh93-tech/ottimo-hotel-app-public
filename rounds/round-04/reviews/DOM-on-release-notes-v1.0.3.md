# DOM review – Release notes mục v1.0.3 và sửa đích hứa (QC v1.0.3 ĐK5)

- Người review: DOM | Round 4 – Review (QC v1.0.3 ĐK5, phần DOM) | Ngày: 03/11/2026
- Tác giả: PO. Bản đọc: `product/docs/release-notes.md` trong thư mục làm việc (chưa commit), xem qua `git diff`: +115 / −48 dòng.
- Đối chiếu: `rounds/round-04/qc/v1.0.3-gate.md` ĐK5, 2.5 S8, 2.8; `rounds/round-04/plan-v1.0.3.md` 6.2, 6.3, V3-02, V3-07; mã thật: `product/integrations/notification/email-templates.ts` (tiêu đề 4 loại thư), `product/services/api/src/modules/identity/internal/security-email.service.ts` (luật từ chối hộp thư chung), `product/apps/mobile/src/pages/LoginPage.tsx` (app nhân viên gặp tài khoản có 2 bước); `rounds/round-04/qa/bug-list.md` BUG-R4-018, 020, 022; sổ tay 1.8 / bộ hướng dẫn 1.6 và review `DOM-on-manual-1.8.md`.

## Kết luận: **Đạt có điều kiện**

**Phần S8 (đích hứa sai): đạt.** Tôi rà lại cả tệp. Không còn chỗ nào hứa "v1.0.3" cho việc đã dời:
- nhóm giữ chỗ BUG-R3-041/042/043/044, `leaseEndDate`, BUG-R4-015, thông báo xử lý dữ liệu bản 2 cùng việc mở lại check-in online đều đã chuyển sang **v1.0.4** (dự kiến 08/11, chậm nhất 10/11), khớp kế hoạch 6.3;
- dòng "Bản vá sau v1.0.3, chưa xếp bản" (hạn lưu ảnh giấy tờ 3 tháng) và câu "không có trong v1.0.3 và v1.0.4" (tách nhiệm hoàn tiền) không phải lời hứa;
- câu "v1.0.4–v1.0.5" ở lỗi P3 có ghi luật chọn bản, đúng.

**Phần ĐK5(a) đủ ý:**
- có đủ các ý: email nhận thông báo, ai đặt email của ai, thư tới địa chỉ mới / cũ / chủ đầu tư, INV tự nhập ở **Bảo mật tài khoản**, 0091 chỉ đi tiến, giới hạn BUG-R4-020/023/024, check-in online vẫn tạm dừng, B1–B6 tiếp tục tới khi đội bảo mật báo bỏ;
- câu về B1–B6 có điều kiện "ít nhất 24 giờ", nói ở 3 chỗ và cả 3 khớp nhau.

Văn phong dễ đọc với chủ đầu tư, không có emoji, không có mã lỗi kỹ thuật trong phần việc phải làm.

Còn **3 thẻ Major** cần PO sửa trước P0 (cùng hạn với ĐK5). Cả 3 chỉ là sửa chữ:
- FB-01: bản ghi là Desk từ chối "hộp thư chung", nhưng Desk chỉ từ chối `info@`.
- FB-02: buồng phòng và bảo trì bật 2 bước (bản ghi đó là việc đã sửa được) thì sẽ **không vào được app nhân viên**.
- FB-03: bước "việc anh/chị làm" chưa nói rõ người trực đang giữ vai quản lý cũng phải có email, và chưa nói chủ đầu tư nhập trước.

Ngoài ra có 2 Minor, 2 Suggestion. Không có ESC mới.

---

### FB-R4-DOM-PO-RN103-01
- Mức độ: Major
- Vị trí: mục v1.0.3, bảng "Có trong bản này", dòng **Hộp thư chung bị từ chối**.
- Vấn đề: bản ghi "Desk không nhận hộp thư chung của cơ sở, như `info@ottimo.vn`". Mã (`security-email.service.ts`, `check`) chỉ từ chối **đúng địa chỉ gửi thư** (`EMAIL_FROM` = `info@ottimo.vn`). `booking@ottimo.vn` (hộp thư chung công khai, decision-log 17/10) và Gmail chung dùng cho OTA vẫn **lưu được**. Release notes đang nói sai cách sản phẩm chạy, ngay trong tài liệu chủ đầu tư đọc trước khi duyệt Release.
- Vì sao quan trọng: chủ đầu tư sẽ tin Desk tự chặn mọi hộp thư chung, rồi không dặn người trực tránh. Thư bảo mật vào hộp thư mà nhiều người cùng đọc thì người đang lạm dụng tài khoản đọc được và xóa được (cùng lý do với FB-R4-DOM-BA-M18-02 của sổ tay).
- Đề xuất sửa: đổi tên dòng thành **"Chặn `info@`"**. Nội dung: "Desk từ chối `info@ottimo.vn` và báo: '…'. **Desk chỉ chặn được địa chỉ này.** Các hộp thư chung khác như `booking@ottimo.vn`, Gmail dùng cho Booking/Agoda/Airbnb, hộp thư của quầy thì Desk vẫn nhận: không dùng. Hộp thư nhận chỉ một người đọc, không đăng nhập trên máy quầy." Ở bước 1 "Việc anh/chị làm", thêm "hoặc `booking@`" cạnh `info@`.
- Trạng thái: Open

### FB-R4-DOM-PO-RN103-02
- Mức độ: Major
- Vị trí: mục v1.0.3, bảng "Có trong bản này", dòng **Buồng phòng, bảo trì, sale nội bộ, CTV** ("Tự bật xác thực 2 bước được …").
- Vấn đề: sau bản sửa BUG-R4-022, buồng phòng và bảo trì tự bật được 2 bước trên Desk (menu **Bảo mật tài khoản**, cùng trang với khối email mới, nên dễ bấm thử). App nhân viên v1.0 chưa đăng nhập được bằng 2 bước: `LoginPage.tsx` gặp `MFA_REQUIRED` thì báo "Đăng nhập 2 bước sẽ có ở bản sau. Nhờ chủ đầu tư hỗ trợ đăng nhập." Desk cũng chưa có nút tắt 2 bước hay đặt lại 2 bước cho người khác (BUG-R4-020). Vì vậy một nhân viên buồng phòng bật 2 bước là **mất app nhân viên** cho tới khi đội kỹ thuật đặt lại. Release notes đang ghi việc này như một điểm tốt. Hướng dẫn `03`, `04` cũng không dặn gì.
- Vì sao quan trọng: buồng phòng không vào app thì không nhận việc dọn và không bấm dọn xong được. Căn kẹt ở trạng thái chưa dọn, lễ tân không biết căn đã sẵn sàng, ngày đông khách là chậm nhận phòng. Lễ tân trưởng dùng app để kiểm phòng cũng bị như vậy. Sale và CTV chỉ dùng Desk nên không bị ảnh hưởng.
- Đề xuất sửa: tách dòng này làm hai.
  - Sale nội bộ, CTV: "tự bật 2 bước được, nên bật".
  - Buồng phòng, bảo trì, lễ tân trưởng dùng app: "**Không bật 2 bước ở v1.0.x.** Bật xong sẽ không đăng nhập được app nhân viên cho tới khi app có đăng nhập 2 bước. Lỡ bật: báo chủ đầu tư, chủ đầu tư báo đội."

  Thêm một dòng vào "Giới hạn đã biết". Đề nghị ORC giao BA thêm cùng câu vào `03` mục 1, `04` mục 1 và `01` 1.9 (chủ đầu tư dặn khi cấp tài khoản). Nếu ARC/BE thấy nên chặn luôn trên Desk thì đó là việc của v1.0.4, release notes không cần chờ.
- Trạng thái: Open

### FB-R4-DOM-PO-RN103-03
- Mức độ: Major
- Vị trí: mục v1.0.3, "Việc anh/chị làm sau khi lên", bước 1 và 4.
- Vấn đề: (a) bước 4 ghi "Có tài khoản quản lý riêng thì sửa email cho quản lý". Hiện OTTIMO có **một người trực giữ cả 6 vai** (mục v1.0.0, "Ba việc phải làm"), tức là tài khoản người trực có vai quản lý, và Desk **bắt buộc** tài khoản đó có email. Câu "có tài khoản quản lý riêng" dễ làm chủ đầu tư nghĩ OTTIMO không có ai cần làm bước này. (b) Theo sổ tay, mỗi người **tự nhập** email; chủ đầu tư chỉ đặt hộ khi cần. Bước 4 lại chỉ nói cách chủ đầu tư đặt hộ. (c) Bản ghi chưa nói thứ tự: chủ đầu tư nhập trước. Nếu người trực nhập trước khi chủ đầu tư có email, bản thư gửi chủ đầu tư thành thư chết `NO_RECIPIENT`, làm nhiễu phép đếm 4b ở gate 2.8, và đội bảo mật chậm báo bỏ B1–B6.
- Vì sao quan trọng: đội bảo mật chỉ báo bỏ B1–B6 khi đủ bằng chứng. Thiếu email của người trực, hoặc làm sai thứ tự, là lý do hay gặp nhất khiến chủ đầu tư phải kiểm sáng thêm nhiều ngày.
- Đề xuất sửa: bước 4 thành "**Sau khi anh/chị đã thấy thư của mình**: người trực (đang giữ vai quản lý, bắt buộc có email) **tự nhập** email riêng ở **Bảo mật tài khoản**. Anh/chị sẽ nhận một thư báo email của người trực đã đổi: thư này là bình thường. Người trực không tự làm được thì anh/chị đặt hộ ở **Người dùng & vai → Sửa email**, hỏi tận miệng địa chỉ."
- Trạng thái: Open

### FB-R4-DOM-PO-RN103-04
- Mức độ: Minor
- Vị trí: mục v1.0.3, dòng **Email nhận thông báo bảo mật** ("OTTIMO gửi thư Security notice … khi … đổi tài khoản nhận chuyển khoản, dùng mã khôi phục, đặt lại 2 bước, đổi email") và bước 2.
- Vấn đề: bản liệt kê đúng 4 loại thư. Nhưng thư đổi tài khoản nhận cọc có tiêu đề "**Notice:** the deposit receiving account was changed / Thông báo: tài khoản nhận cọc đã thay đổi", không có chữ "Security notice" (`email-templates.ts`). Bản cũng chưa nói nhận thư đó mà mình không làm thì làm gì.
- Vì sao quan trọng: khi B1–B6 bỏ, thư này là lớp báo duy nhất qua email khi tài khoản nhận tiền bị tráo.
- Đề xuất sửa: thêm vào dòng này một câu: "Thư đổi tài khoản nhận cọc có tiêu đề bắt đầu bằng 'Notice:'. Nhận thư về việc mình không làm: mở Desk bằng cách gõ địa chỉ, làm theo sổ tay 1.7 (Hủy lịch, đổi mật khẩu, báo đội)." Bảng đầy đủ để ở sổ tay (FB-R4-DOM-BA-M18-01).
- Trạng thái: Open

### FB-R4-DOM-PO-RN103-05
- Mức độ: Minor
- Vị trí: mục v1.0.3, "Giới hạn đã biết", dòng BUG-R4-020 ("báo chủ đầu tư, chủ đầu tư báo đội (sổ tay 0.4)").
- Vấn đề: hướng dẫn `01` 1.7 cho quản lý mất cả điện thoại lẫn mã khôi phục lại ghi cách khác: chủ đầu tư **Khóa tài khoản** người đó và tạo tài khoản mới, tên đăng nhập mới, đúng các vai cũ. Release notes ghi "báo đội" (đội dùng chức năng đặt lại trên máy chủ, có thư "đặt lại bởi đội kỹ thuật OTTIMO"). Hai tài liệu nói hai cách cho cùng một tình huống.
- Vì sao quan trọng: người trực mất điện thoại lúc nửa đêm thì cần một cách duy nhất, không phải chọn giữa hai tài liệu.
- Đề xuất sửa: PO chốt với SEC một cách cho v1.0.3. Đề xuất của DOM: nhanh nhất là đội đặt lại trên máy chủ, cách của `01` 1.7 làm dự phòng khi không gọi được đội. Ghi cách đó ở cả release notes và `01` 1.7 (chủ đầu tư sẽ nhận thư "đặt lại bởi đội kỹ thuật OTTIMO": đó là thư mình đã biết trước).
- Trạng thái: Open

### FB-R4-DOM-PO-RN103-06
- Mức độ: Suggestion
- Vị trí: mục v1.0.3, dòng "Hướng dẫn: sổ tay gốc bản nội dung 1.8 – mục 0.2, 0.3a, 1.5".
- Vấn đề: nhân viên học theo bộ hướng dẫn theo bộ phận (bản 1.6), không đọc sổ tay gốc.
- Đề xuất sửa: thêm "bộ hướng dẫn 1.6: `01` mục 1.6a, 1.9, 15.1; `02` mục 1.6; `05` mục 1.5", như cách mục v1.0.2 đang ghi.
- Trạng thái: Open

### FB-R4-DOM-PO-RN103-07
- Mức độ: Suggestion
- Vị trí: đoạn mở đầu tệp (câu dài từ "Từ 01/11/2026 bản vá đi theo đợt" tới "cập nhật 04/11").
- Vấn đề: một đoạn nhồi 5 bản, 4 mốc ngày và 2 đường dẫn. Chủ đầu tư đọc trên điện thoại sẽ khó theo.
- Đề xuất sửa: tách thành danh sách 4 dòng (v1.0.1 · v1.0.2 · v1.0.3 · v1.0.4), mỗi dòng ghi việc chính và trạng thái hoặc mốc ngày.
- Trạng thái: Open

---

## Ghi chú cho ORC

- FB-02 vượt khỏi release notes: cần BA thêm câu dặn vào `03`, `04`, `01` 1.9. Việc này nên làm trong cùng lượt sửa sổ tay của ĐK11, trước khi UXD dựng HTML.
- Brand: release notes là Markdown nội bộ, không có màu hay chữ trang trí. Giọng văn điềm tĩnh, không emoji, hợp guideline. Khi dựng trang HTML trình INV thì áp brand ở bước đó.

## Điểm làm tốt (nên giữ)

1. Sửa đích hứa triệt để: các mục v1.0.0, v1.0.1 và v1.0.2 đều ghi "cập nhật 04/11" và chuyển đúng sang v1.0.4, có lý do "không kịp v1.0.3". Lần này không lặp lại lỗi ĐK7 của v1.0.2.
2. Câu về B1–B6 nói được điều kiện bỏ ("bản đã lên, anh/chị đã nhận thư, qua ít nhất 24 giờ không có thư nào bị kẹt") và nói "không bỏ ngay ngày lên bản". Đúng kế hoạch 6.2 bước 5 và tốt hơn bản sổ tay hiện nay.
3. Phần dữ liệu và quay lui viết theo ngôn ngữ vận hành: lùi bản thì mất gì, thư không tới **không** phải lý do lùi bản, khôi phục từ bản sao lưu chỉ khi chủ đầu tư quyết. Có câu "bản này không đổi luồng tiền" giúp chủ đầu tư duyệt Release yên tâm.

---

## Phản hồi BA

- Người trả lời: BA | Round 4 – Phản hồi & sửa (cùng lượt sửa sổ tay QC v1.0.3 ĐK11) | Ngày: 03/11/2026
- Chỉ trả lời phần của BA trong thẻ FB-R4-DOM-PO-RN103-02, tức câu dặn trong bộ hướng dẫn. Phần release notes (tách dòng, thêm "Giới hạn đã biết") là việc của PO.

| Thẻ | Trạng thái | Đã làm / lý do |
|---|---|---|
| FB-R4-DOM-PO-RN103-02 (Major) – phần bộ hướng dẫn | **Fixed** | Thêm câu dặn **không bật đăng nhập 2 bước ở v1.0.x**. Lý do: app nhân viên chưa đăng nhập được bằng 2 bước (chép đúng câu app báo, chuỗi `auth.mfa_later`, không có ô nhập mã), và Desk chưa có nút đặt lại 2 bước cho người khác. Thêm cách tự khôi phục theo ARC (ARC-on-manual-1.8, mục "RN103-02 – ARC kiểm"; ORC 03/11). Lỡ bật thì đăng nhập Desk bằng mật khẩu và mã → **Bảo mật tài khoản → Tắt xác thực 2 bước** → đăng nhập lại app. Mất điện thoại và mã khôi phục thì báo chủ đầu tư, chủ đầu tư báo đội. Đã thêm ở: `03` mục 1.6 (bản 1.2); `04` mục 1 (cuối 1.5, bản 1.2); `01` mục 1.9 bước 8 (chủ đầu tư dặn khi cấp tài khoản; sale, CTV chỉ dùng Desk thì tự bật được); và `02` mục 1.8. `02` 1.8 không có trong đề xuất, nhưng lễ tân trưởng đọc tệp `02`, không đọc `03` |

---

## Phản hồi PO

- Người phản hồi: PO | Round 4 – Phản hồi & sửa (QC v1.0.3 ĐK5) | Ngày: 03/11/2026
- Tệp đã sửa: `product/docs/release-notes.md` (đoạn mở đầu, mục v1.0.3); `03-backlog/backlog.md` mục 5.6 (dòng mới ARC-RN103-02). Chưa commit; ORC commit cùng bước.
- Đã đọc thêm: `rounds/round-04/reviews/ARC-on-manual-1.8.md` mục "RN103-02 – ARC kiểm" (ORC chuyển 03/11), hướng dẫn `01` mục 1.6a, 1.7, 1.9 (bản 1.7), `03` mục 1.6, `04` mục 1.5 (bản 1.2).

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R4-DOM-PO-RN103-01 | **Done** | Dòng đổi tên thành **Chặn `info@`**, ghi "Desk chỉ chặn được địa chỉ này", nêu `booking@ottimo.vn`, Gmail dùng cho Booking/Agoda/Airbnb, hộp thư quầy: Desk vẫn nhận, không dùng; hộp thư chỉ một người đọc, không đăng nhập trên máy quầy. Bước 1 thêm `booking@ottimo.vn` và Gmail chung của OTA. Bước 3 (lượt thử `info@`) sửa chữ "từ chối hộp thư chung" thành "từ chối địa chỉ này" cho khớp |
| FB-R4-DOM-PO-RN103-02 | **Done** | Bỏ câu nêu việc tự bật 2 bước như điểm tốt cho buồng phòng, bảo trì. Tách 3 dòng: (a) BUG-R4-018 thấy lại email; (b) sale nội bộ, CTV "tự bật được, nên bật"; (c) **người dùng app nhân viên (buồng phòng, bảo trì, lễ tân trưởng): chưa bật đăng nhập 2 bước ở v1.0.x**, kèm câu ARC: "Lỡ bật: đăng nhập Desk bằng mật khẩu và mã → Bảo mật tài khoản → Tắt xác thực 2 bước → đăng nhập lại app." Lỡ bật rồi mất cả điện thoại lẫn mã: theo SEC chốt (mục "RN103-05 – SEC chốt"), chủ đầu tư làm như `01` 1.7, không còn "báo đội". Ghi đúng phạm vi ARC chỉnh: buồng phòng, bảo trì, sale, CTV bật được **từ v1.0.3**; lễ tân trưởng bật được từ v1.0.0. Thêm một dòng vào "Giới hạn đã biết". ARC kết luận không chặn bằng mã ở v1.0.3 (rủi ro Thấp, đổi mã thì đổi `SHA_V103`). Sửa gốc: backlog 5.6 dòng **ARC-RN103-02** – app nhân viên có bước nhập mã (`loginMfa` đã có), v1.0.4, ưu tiên cao, gộp với BUG-R4-020; bảng "Chưa có" của v1.0.3 ghi dòng này. **Đề nghị ORC giao BA:** `03` mục 1.6, `04` mục 1.5 và `01` 1.9 bước 8 đã có câu dặn, nhưng mới ghi "tới khi đội kỹ thuật đặt lại"; cần thêm đường tự tắt của ARC. `02` (lễ tân trưởng) kiểm lại cùng câu |
| FB-R4-DOM-PO-RN103-03 | **Done** | Bước 4 viết lại theo đề xuất DOM: sau khi chủ đầu tư thấy thư của mình, người trực (giữ vai quản lý, bắt buộc có email) tự nhập ở **Bảo mật tài khoản**; thư báo email người trực đổi là bình thường; đặt hộ ở **Người dùng & vai → Sửa email**, hỏi tận miệng. Thêm câu thứ tự: chủ đầu tư nhập trước, làm ngược thì thư gửi chủ đầu tư không có người nhận và B1–B6 phải chờ thêm. Không ghi mã `NO_RECIPIENT` cho chủ đầu tư đọc |
| FB-R4-DOM-PO-RN103-04 | **Done** | Dòng **Email nhận thông báo bảo mật** thêm: thư đổi tài khoản nhận cọc có tiêu đề "OTTIMO – Notice: …", không có chữ "Security notice", đừng lọc thư theo chữ đó (đã đối chiếu `email-templates.ts`). Nhận thư về việc mình không làm: mở Desk bằng cách gõ địa chỉ, làm theo bảng **Thư nào – làm gì** (`01` 1.6a); thư tài khoản nhận cọc: Hủy lịch, đổi mật khẩu, báo đội (`01` 10.2, sổ tay 1.7). Bảng đầy đủ để ở sổ tay như DOM đề xuất |
| FB-R4-DOM-PO-RN103-05 | **Done – SEC đã chốt** | SEC chốt 03/11 (mục "RN103-05 – SEC chốt" bên dưới): **cách của `01` mục 1.7 là cách duy nhất ở v1.0.3**, không dùng lệnh 06.33 của đội cho quản lý. Release notes, dòng BUG-R4-020: bỏ câu "đội bảo mật đang chốt lại…"; ghi chủ đầu tư **gặp tận mặt**, **không làm theo tin nhắn**, khóa tài khoản cũ (để khóa, không xóa), thêm người dùng mới với tên đăng nhập mới và đúng các vai cũ, đưa mật khẩu tạm tận tay; người đó bật 2 bước và nhập email nhận thông báo ngay; thêm "v1.0.4 sẽ có nút đặt lại 2 bước trên Desk". Đã bỏ "báo đội (sổ tay 0.4)" và câu "máy chủ đã có chức năng này". Người dùng app lỡ bật rồi mất cả điện thoại lẫn mã (RN103-02) cũng theo cách 1.7, không bật lại 2 bước: đã sửa ở cả bảng "Có trong bản này" và "Giới hạn đã biết". Phần BA (ý 2 của SEC: `01` 1.7 bước (4), `03` 1.6, `04` 1.5, `02` 1.8) do ORC giao |
| FB-R4-DOM-PO-RN103-06 | **Done** | Dòng "Hướng dẫn" ghi bộ hướng dẫn theo bộ phận: `01` mục 1.6a, 1.7, 1.9, 2.2, 10.2, 15.1; `02` mục 1.3, 1.5, 1.6, 1.8; `03` mục 1.6; `04` mục 1.5; `05` mục 1.5. Sổ tay gốc ghi bản nội dung 1.9 (bản BA đang có, áp dụng cùng 1.8) |
| FB-R4-DOM-PO-RN103-07 | **Done** | Đoạn mở đầu tách thành danh sách 4 dòng (v1.0.1, v1.0.2, v1.0.3, v1.0.4), mỗi dòng có việc chính và trạng thái hoặc mốc ngày. Câu PO chốt phạm vi để thành đoạn riêng |

Không có ESC mới. Cả 7 thẻ phía PO đã sửa; RN103-05 sửa lại sau khi SEC chốt (03/11). Cùng lượt, PO sửa thêm theo `BA-on-release-notes-v1.0.3.md` (3 Minor, 3 Suggestion). Còn lại: BA sửa sổ tay theo ý 2 của SEC, rồi DOM rà lại cả lượt.

---

## RN103-05 – SEC chốt

- Người chốt: SEC · 03/11/2026 · Round 4, v1.0.3, bước **Phản hồi & sửa** (ORC giao, trước P0).
- Đã đọc: thẻ RN103-05 và trả lời PO ở trên; hướng dẫn `01` mục 1.7; `release-notes.md` (dòng BUG-R4-020); `bug-list.md` BUG-R4-020 (API `resetUser2fa` của chủ đầu tư chạy đúng, chỉ thiếu nút trên Desk); mã `operator-reset.ts`, `mfa-operator-reset-cli.ts`, `scripts/mfa-operator-reset.sh`; decision-log 26/10 (diễn tập 06.33, mã phiếu `MFA-DRILL-20261026`) và 30/10 (SEC S2, bộ hướng dẫn theo bộ phận).

### Quyết định: **giữ cách của `01` mục 1.7 làm cách duy nhất cho v1.0.3.** Không dùng `mfa-operator-reset` cho quản lý

Phương án "đội chạy lệnh 06.33 khi chủ đầu tư đồng ý trong chat, 1.7 làm dự phòng" **không** được chọn. SEC giữ đúng quyết định 30/10.

| Tiêu chí | Cách 1.7 (khóa tài khoản cũ, tạo tài khoản mới) | Lệnh 06.33 do đội chạy theo tin nhắn chat |
|---|---|---|
| **Ai cho phép, bằng gì** | Chủ đầu tư, trên Desk, bằng **mật khẩu + mã 2 bước** (S2) ở cả bước Khóa và bước Thêm người dùng. Quyền nằm đúng ở tài khoản OWN | Một **tin nhắn chat**. Đội không kiểm được người gửi có đúng là chủ đầu tư hay không. Kẻ chiếm tài khoản chat, hoặc giả làm chủ đầu tư, có thể xin đặt lại 2 bước cho một tài khoản quản lý mà họ đã có mật khẩu. Đây chính là cách chiếm tài khoản qua bộ phận hỗ trợ mà 2 bước dùng để chặn |
| **Xác minh người mất máy** | Chủ đầu tư gặp tận mặt, đưa mật khẩu tạm tận tay | Đội ở xa không gặp được người đó. Thủ tục 06.33 (để ngoài repo, có người chứng kiến) được viết cho **chủ đầu tư duy nhất**, lúc không còn ai trong cơ sở xác minh được. Đem dùng cho quản lý là mở rộng một lối khẩn cấp (break-glass) ra ngoài phạm vi đã duyệt (ESC-027 B, "đường 3") |
| **Bề mặt tấn công** | Chỉ dùng chức năng Desk đã có, đã kiểm (khóa, thêm người dùng, S2) | Mỗi lần dùng cần ORC/OPS SSH vào production, chạy lệnh quản trị có khóa mã hóa của api. Dùng càng thường thì lối này càng dễ thành đường tắt |
| **Audit** | `user.updated` (khóa, qua `updateUser`), `user.created`, `user.roles_changed`: đều ghi dưới tài khoản OWN, khóa và tạo đều đòi S2 (`users.controller.ts`) | `mfa.reset_by_operator`, có tên người chạy, lý do, mã phiếu: đủ dấu vết. Nhưng căn cứ cho phép chỉ là một dòng chat |
| **Lịch sử tài khoản** | Bị tách làm hai: việc cũ dưới tên đăng nhập cũ (đang khóa), việc mới dưới tên mới. Không mất gì, vì tài khoản cũ **khóa, không xóa** | Giữ một tài khoản. Đây là ưu điểm duy nhất đáng kể |
| **Quyền và RLS** | Tài khoản mới cùng `organization_id`, chủ đầu tư gán lại đúng vai cũ. RLS không khác | Không đổi vai |
| **Tốc độ lúc nửa đêm** | Chủ đầu tư tự làm trong vài phút, không cần đội | Cần người của đội có quyền SSH còn thức, nên không nhanh hơn |

**Lý do quyết định:** điểm mất của cách 1.7 chỉ là lịch sử bị tách làm hai, và việc này không làm mất dữ liệu. Điểm mất của lệnh 06.33 là quyền đặt lại 2 bước của một vai quản lý chuyển từ S2 của chủ đầu tư sang một tin nhắn chat. Đó là rủi ro mạo danh mà v1.0.3 không cần nhận. Đường đúng cho lâu dài là **BUG-R4-020** (v1.0.4): nút **Đặt lại xác thực 2 bước** trên Desk, gọi `resetUser2fa` mà API đã có, chủ đầu tư làm bằng S2, tài khoản giữ nguyên, có thư `mfa_reset`. Khi nút đó lên, nó thành cách chính, còn 1.7 thành dự phòng.

### Phạm vi của lệnh 06.33 (không đổi)
- Chỉ dùng cho **chủ đầu tư (OWN duy nhất) mất cả điện thoại lẫn mã khôi phục** (dòng cuối `01` 1.7: "thủ tục khôi phục riêng đã diễn tập"), theo thủ tục để ngoài repo, có người chứng kiến.
- Người dùng app (buồng phòng, bảo trì, lễ tân trưởng) lỡ bật 2 bước rồi mất cả điện thoại lẫn mã (RN103-02): **cũng làm theo cách 1.7** (chủ đầu tư khóa tài khoản, tạo tài khoản mới, không bật 2 bước). Không cần đội, vì cùng lý do như trên. PO sửa câu "báo chủ đầu tư, chủ đầu tư báo đội" ở dòng đó. Nếu ARC/PO muốn giữ "báo đội" cho nhóm này thì phải qua SEC trước, và đội chỉ làm khi chủ đầu tư xác nhận **trên Desk hoặc tận mặt**, không chỉ qua chat.

### Việc kèm theo (sửa chữ, cùng lượt ĐK5/ĐK11)
1. **PO** (`release-notes.md`, dòng BUG-R4-020): bỏ câu "đội bảo mật đang chốt lại cách này…". Ghi đúng cách 1.7, và ghi "v1.0.4 sẽ có nút đặt lại 2 bước trên Desk". Dòng RN103-02 sửa theo mục "Phạm vi" ở trên.
2. **BA** (`01` mục 1.7, dòng "mất cả điện thoại lẫn mã"): thêm bước (4). Người đó **nhập email nhận thông báo** ở **Bảo mật tài khoản** ngay sau khi bật 2 bước, vì vai quản lý bắt buộc có email. Nếu `EMAIL_NO_RECIPIENT_ALERT` đã bật, `email_missing` sẽ FAIL tới khi nhập xong (README 13.8, "Thêm OWN/MGR mới sau khi đã bật"). Thêm câu: chủ đầu tư **gặp tận mặt** người xin tài khoản mới, không làm theo tin nhắn. Giữ "tên đăng nhập mới" và "tài khoản cũ để khóa, không xóa". Câu "Desk v1.0 chưa có nút…" giữ đến v1.0.4. Dòng tương ứng trong `03` 1.6, `04` 1.5, `02` 1.8 sửa cùng ý.
3. **Decision-log, khi có ca thật:** chỉ ghi "1 tài khoản quản lý được thay theo 1.7" kèm giờ. Không ghi tên, không ghi tên đăng nhập.

**FB-R4-DOM-PO-RN103-05: SEC chốt.** Giữ cách 1.7. Thẻ đóng được sau khi PO và BA sửa ý 1–2 và DOM rà lại. Không có ESC: đây là yêu cầu bảo mật kỹ thuật thuộc quyền SEC, không đổi chính sách kinh doanh.

---

## Phản hồi BA – RN103-05 (theo SEC chốt)

- Người trả lời: BA | Round 4 – Phản hồi & sửa (QC v1.0.3 ĐK5/ĐK11) | Ngày: 03/11/2026
- Làm theo mục "RN103-05 – SEC chốt", ý 2 và mục "Phạm vi của lệnh 06.33". Phần release notes (ý 1) là việc của PO. Chưa commit; không sửa HTML.

| Thẻ | Trạng thái | Đã làm |
|---|---|---|
| FB-R4-DOM-PO-RN103-05 – phần bộ hướng dẫn và sổ tay | **Fixed** (chờ DOM rà) | `01` mục 1.7, dòng quản lý mất cả điện thoại lẫn mã: thêm câu chủ đầu tư **gặp tận mặt** người đó, **không làm theo tin nhắn** hay cuộc gọi; thêm bước (4) người đó nhập **email nhận thông báo** ở **tên của mình → Bảo mật tài khoản** ngay sau khi bật 2 bước (vai quản lý bắt buộc có email); ghi "cách duy nhất ở v1.0.3, không nhờ đội kỹ thuật đặt lại 2 bước". Giữ "tên đăng nhập mới", "tài khoản cũ để khóa, không xóa" và câu "Desk v1.0 chưa có nút…" (thêm "dự kiến có ở v1.0.4"). Thêm một dòng mới cho buồng phòng, bảo trì, lễ tân trưởng lỡ bật 2 bước rồi mất cả điện thoại lẫn mã: làm bước (1)–(3), gặp tận mặt, **không bật 2 bước** ở tài khoản mới. `01` mục 1.9 bước 8: bỏ "chủ đầu tư báo đội… Đội cần anh/chị đồng ý trong chat", thay bằng gặp tận mặt, tạo tài khoản mới theo 1.7. `02` mục 1.7 (dòng mất cả hai): thêm gặp tận mặt, trỏ `01` 1.7, nhập email ngay sau khi bật 2 bước. `02` mục 1.8, `03` mục 1.6, `04` mục 1.5: bỏ "chủ đầu tư báo đội", thay bằng báo chủ đầu tư; chủ đầu tư gặp tận mặt, khóa tài khoản cũ, tạo tài khoản mới theo `01` mục 1.7; tài khoản mới không bật 2 bước; đội kỹ thuật không đặt lại. Sổ tay gốc: mục 0.4 (dòng quản lý viết lại như `01` 1.7, thêm dòng người dùng app nhân viên), mục 1.5 bước 7 và mục 3.1 sửa cùng ý (trỏ mục 0.4). **Giữ nguyên** phần tự tắt 2 bước trên Desk. Ghi lịch sử: sổ tay dòng 1.9, `00-index` dòng 1.7, đầu tệp `01` |

Không có ESC mới. Dòng chủ đầu tư mất cả điện thoại lẫn mã (thủ tục 06.33) không đổi.

---

## Lượt 2 – DOM đọc lại

- Người đọc: DOM | 03/11/2026 | Bước Review (QC v1.0.3 ĐK5, lượt 2)
- Đã đọc: `product/docs/release-notes.md` trong thư mục làm việc (đoạn mở đầu, toàn bộ mục v1.0.3, các dòng đích hứa ở v1.0.2 / v1.0.1 / v1.0.0), mục "Phản hồi PO", "RN103-05 – SEC chốt", "Phản hồi BA – RN103-05" ở trên, backlog 5.6 dòng ARC-RN103-02 và BUG-R4-020. Đối chiếu với bộ hướng dẫn 1.7 / sổ tay 1.9 (`DOM-on-manual-1.8.md` lượt 2).
- Đính chính lượt 1: thẻ RN103-02 ghi "Desk cũng chưa có nút tắt 2 bước". Câu này **sai**. Desk có nút **Tắt xác thực 2 bước** cho mọi vai không bắt buộc (`SecurityPage.tsx`, `disableMy2fa`), ARC đã chỉ ra. Hậu quả DOM nêu (mất app nhân viên) vẫn đúng. Chỉ có đường khôi phục là dễ hơn DOM viết.

| Thẻ | Kết quả lượt 2 | Ghi chú |
|---|---|---|
| FB-R4-DOM-PO-RN103-01 (Major) | **Closed** | Dòng **Chặn `info@`** ghi "Desk chỉ chặn được địa chỉ này". Có liệt kê `booking@`, Gmail dùng cho OTA, hộp thư quầy, ghi "không dùng", "chỉ một người đọc, không đăng nhập trên máy quầy, không tự chuyển tiếp". Bước 1 và 3 đã khớp |
| FB-R4-DOM-PO-RN103-02 (Major) | **Closed** | Đã tách 3 dòng. Dòng "Người dùng app nhân viên: chưa bật 2 bước ở v1.0.x" ghi đúng phạm vi (buồng phòng, bảo trì mới bật được từ v1.0.3; lễ tân trưởng từ v1.0.0), ghi hậu quả bằng lời vận hành ("không nhận việc dọn, không bấm dọn xong"), có đường tự tắt và cách 1.7. Có dòng trong "Giới hạn đã biết". Sửa gốc nằm ở backlog ARC-RN103-02 (v1.0.4, ưu tiên cao). Câu dặn đã có trong `01`, `02`, `03`, `04` |
| FB-R4-DOM-PO-RN103-03 (Major) | **Closed** | Bước 4 nêu đúng người trực giữ vai quản lý, bắt buộc có email, tự nhập, anh/chị đặt hộ khi cần, và thứ tự "anh/chị nhập trước". Hậu quả làm ngược được viết bằng lời thường, không có mã `NO_RECIPIENT` |
| FB-R4-DOM-PO-RN103-04 (Minor) | **Closed** | Có câu "OTTIMO – Notice: …", đừng lọc theo chữ Security notice, kèm việc phải làm và chỗ dẫn `01` 1.6a / 10.2 |
| FB-R4-DOM-PO-RN103-05 (Minor) | **Closed** | Theo SEC chốt: cách 1.7 là cách duy nhất ở v1.0.3, có "gặp tận mặt, không làm theo tin nhắn", "khóa, không xóa", nhập email ngay, "v1.0.4 sẽ có nút". Đã bỏ "báo đội". Release notes và bộ hướng dẫn khớp nhau |
| FB-R4-DOM-PO-RN103-06 (Suggestion) | **Closed** | Dòng "Hướng dẫn" đã ghi đủ mục của bộ hướng dẫn theo bộ phận và sổ tay 1.9 |
| FB-R4-DOM-PO-RN103-07 (Suggestion) | **Closed** | Đoạn mở đầu đã tách thành danh sách 4 bản, dễ đọc trên điện thoại |

Rà lại S8 trên bản hiện tại: không còn chỗ nào hứa "v1.0.3" cho việc đã dời. Tất cả dời sang v1.0.4 và khớp backlog 5.6.

Hai ý nhỏ, không phải thẻ, không chặn. PO tự cân nhắc:
- Dòng **Email nhận thông báo bảo mật** vẫn mở đầu bằng "OTTIMO gửi thư **Security notice** … khi đổi tài khoản nhận chuyển khoản…", rồi mới nói thư đó có tiêu đề "Notice:". Viết "OTTIMO gửi **thư báo**…" (như sổ tay 0.3a) thì khỏi phải đính chính ngay trong cùng một ô.
- Phần quay lui có hai câu: "Email đã lưu vẫn dùng, thư báo bảo mật vẫn tới" và "Thư báo đổi email trong khoảng đó được gửi bù sau khi lên lại". Hai câu này đúng hay không thuộc phần ARC kiểm (quay lui). DOM chỉ ghi lại để ARC xác nhận rằng đọc chung không gây hiểu lầm.

**Kết luận lượt 2: ĐẠT.** 3 Major, 2 Minor, 2 Suggestion đều đóng. Không còn Major. Phần DOM của ĐK5 xong.
