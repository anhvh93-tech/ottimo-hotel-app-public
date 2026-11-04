# SEC review – Tài liệu BA v1.0.4: Ngày cuối của người nghỉ, Ngày thay tờ v2

- Người review: SEC | Round 4 – v1.0.4 – Bước: **Review** | 04/11/2026
- Đối tượng: `origin/v104/ba-docs` @ `39b61dec`, diff `488d9392..39b61dec`:
  - `user-manual-v1.0.md` mục 1.5 (dòng 384–401);
  - `guides/01-chu-dau-tu-quan-ly.md` mục 1.9 (dòng 240–259);
  - `guides/00-index.md` mục 4 (dòng 101–121);
  - `guides/02-le-tan.md` mục 7.2 (dòng 489–500);
  - `rounds/round-04/responses/BA-on-DOM-v104.md` mục 2 ý 1 (G-BA-104-4).
- Đối chiếu: `SEC-on-plan-v1.0.4.md` mục 2.2 (M18-08) và 6.4 ý 5. Mã: `parameters.service.ts` 190–245; `platform/public/parameter.service.ts` 270–300; `registration.controller.ts` 462; `apps/mobile/src/App.tsx` 128–148.
- **Phán quyết: ĐẠT CÓ ĐIỀU KIỆN.** Điều kiện gộp `v104/ba-docs`: thẻ 01, 02, 03 (Major) Done (khối người nghỉ ghi "áp dụng ngay"; 03 muộn nhất trước ngày thay tờ v2). Minor/Suggestion sửa cùng lượt nếu kịp, chậm nhất sổ tay 1.12.
- Giả định: G-SEC-BA104-1 – nhân viên được giao có đăng nhập extranet OTA, hộp thư chung/Gmail OTA, điện thoại cơ sở có Zalo (sổ tay 2.6, dòng 833); nếu không thì thẻ 02 chỉ còn thẻ tổng, mã máy, mã điện thoại. G-SEC-BA104-2 – app nhân viên giữ bản đọc offline tới khi bấm Đăng xuất (`App.tsx` 128–148, `cache.ts` 1–3). G-SEC-BA104-3 – số dòng theo `39b61dec`.

## A. Điểm đạt
- Thứ tự Khóa tài khoản → Xóa email đúng M18-08; "Tạm khóa do sai mật khẩu" ghi đúng là Desk tự làm, vẫn nhận thư, không đăng xuất các máy.
- Người bị cho thôi việc bị khóa Desk ngay lúc báo, trước khi đếm két; có thu chìa, gỡ ủy quyền app khóa, đổi mã két/Wi-Fi quản trị, đổi mã cửa căn có khách, Thu hồi máy, tạm ngưng `@ottimo.vn`.
- Bước 2: yêu cầu hoàn do người nghỉ tạo thì người khác nhập nơi nhận (giữ maker-checker).
- Ngày thay tờ: không nhận giấy tờ khách mới từ lúc gỡ tờ v1 tới tin "Đã đặt v2"; tham số đặt trên Desk (**Quản trị → Tham số quy tắc**), không SQL; tờ v1 chỉ hủy sau tin "Đã đặt v2". Khung 09:00–11:00 sau mốc 06:00 đổi ngày nên "Hiệu lực từ hôm nay" có hiệu lực ngay. Máy chủ từ chối đồng ý gửi version cũ (`registration.controller.ts` 462, `NOT_IN_LIST`).
- Quét diff: không email thật (chỉ tên miền `@ottimo.vn`, `example.test`), không mật khẩu, mã cửa, mã két, số tài khoản, số hoa hồng.

## B. Thẻ feedback

### FB-R4-SEC-BA-104-01
- Mức độ: **Major**
- Vị trí: sổ tay 1.5 bước 3, 5, 6, 7 (dòng 394, 396–398); `01` 1.9 cùng bước (dòng 250, 252–254).
- Vấn đề: với người **bị cho thôi việc**, chỉ Khóa tài khoản Desk là "ngay lúc báo". Bước 5 (Google Chat, `@ottimo.vn`), 6 (app khóa, mã két), 7 (Thu hồi máy) vẫn "trong ngày", còn đứng sau bước 4. Trong khoảng đó họ vẫn đọc tin khách trong Chat, mở mọi căn bằng app khóa, vào Google Workspace.
- Vì sao quan trọng: nhóm rủi ro phá hoại/lấy dữ liệu cao nhất; khóa Desk mà không khóa app khóa thì không chặn lối vào thực tế (NĐ 13/2023, luật sư xác nhận cùng ESC-001).
- Đề xuất sửa: thêm dưới bước 3 cho người bị cho thôi việc: "**Ngay lúc báo, trong cùng một lần ngồi máy**, làm liền: bước 3 → gỡ ủy quyền app khóa, vô hiệu thẻ/mã nhân viên trên khóa (bước 6) → gỡ khỏi phòng Google Chat, tạm ngưng `@ottimo.vn` (bước 5) → Thu hồi máy (bước 7) → đổi các mật khẩu dùng chung ở bước 6. Sau đó mới làm bước 1, 2, 4, 8." Người nghỉ êm giữ thứ tự, nhưng bước 3, 5, 6, 7 làm **cuối ca cuối cùng**, không để sang hôm sau.
- Trạng thái: Open

### FB-R4-SEC-BA-104-02
- Mức độ: **Major**
- Vị trí: sổ tay 1.5 bước 6 (dòng 397); `01` 1.9 bước 6 (dòng 253).
- Vấn đề: bước 6 thiếu các quyền dùng chung sổ tay cho nhân viên dùng: (a) extranet OTA (Booking.com, Agoda, Airbnb – sổ tay 2.6) có dữ liệu khách, với quản lý có cả thẻ thanh toán ảo; (b) mật khẩu hộp thư chung `booking@`, Gmail OTA, hộp thư quầy (0.3a); (c) mã điện thoại cơ sở, máy tính bảng, máy quầy, Zalo cơ sở; (d) thẻ tổng/thẻ nhân viên của khóa; (e) mật khẩu điểm phát 4G dự phòng. "Mật khẩu người đó biết" hứa rộng hơn danh sách.
- Vì sao quan trọng: các đường này nằm ngoài nhật ký Desk; thẻ ảo OTA thuộc phạm vi PCI.
- Đề xuất sửa: bước 6 thành danh sách "(nếu người đó biết hoặc được giao)": thu chìa cơ, thẻ tổng/thẻ nhân viên; gỡ ủy quyền app khóa, vô hiệu mã/thẻ nhân viên; đổi mật khẩu extranet từng kênh hoặc gỡ tài khoản riêng của người đó; đổi mật khẩu hộp thư chung và Gmail OTA, đăng xuất mọi phiên; đổi mã điện thoại cơ sở, máy tính bảng, máy quầy, đăng xuất/đăng nhập lại Zalo cơ sở; đổi mã két, Wi-Fi quản trị, mật khẩu điểm phát 4G. Không ghi mật khẩu mới vào sổ giao ca, chat hay giấy dán quầy (mục 0.8 điểm 10).
- Trạng thái: Open

### FB-R4-SEC-BA-104-03 (bản sửa 04/11, thay bản đầu)
- Mức độ: **Major**
- Vị trí: `00-index.md` mục 4 bước 3.3–3.5 (dòng 112–114); `02-le-tan.md` 7.2 **Ngày thay tờ** bước 3–5 (dòng 494–496); G-BA-104-4. Trùng ý FB-R4-DOM-BA-104-07.
- Vấn đề: (a) tin nhắn đi chéo – Desk ghi v2 cả ngày, khách đọc v1; (b) gõ sai giá trị – Desk ghi cả ngày một version không có tờ nào (máy chủ không có danh sách giá trị hợp lệ). Cả hai không sửa được trên Desk trong ngày (`sameDayOverride` chỉ cho công tắc khẩn cấp, `platform/public/parameter.service.ts` 270–300).
- Vì sao quan trọng: SEC 6.4 ý 5, decision-log 17/10 ĐK-2.
- Đề xuất sửa: **làm theo DOM 07**, cộng:
  1. **Gọi điện trước mọi lần Lưu**: hỏi "tờ v2 còn trên quầy chứ?", Lưu trong lúc còn gọi (bỏ mốc 10 phút của bản đầu). Mốc chung là giờ trong tin "Đã thay tờ v2 – hh:mm"; người trực chờ tối đa 15 phút; đang gọi mà chủ đầu tư bảo "chờ" thì chờ tiếp.
  2. Dán `"privacy-2026-10-v2"` (không gõ tay); Lưu xong đối chiếu bảng lịch sử từng ký tự **rồi mới** nhắn "Đã đặt v2". Ghi "Đã Lưu thì không quay về v1 trong ngày".
  3. Người trực đặt lại tờ v1 (không gọi được, quá 15 phút): nhắn "Đã đặt lại tờ v1 – hh:mm".
  4. Tin "Đã đặt v2" đến sau khi đã đặt lại v1: ngừng nhận giấy tờ, đặt ngay tờ v2 (khung mica, ngăn quầy, máy tính bảng). Mỗi khách nhận giấy tờ trong khoảng giữa: sổ giao ca chỉ ghi **mã đơn, giờ nhận giấy tờ, giờ cho xem v2** (không tên, số giấy tờ, quốc tịch, SĐT); cho khách xem tờ v2 lần gặp tiếp, trước khi trả phòng; **không** ghi lại đồng ý, không xóa/nhập lại giấy tờ; khách không đồng ý hoặc đã về mà chưa xem: ghi "chưa xem v2", **không đưa tin nhắn của khách đó qua dịch vụ dịch** (ESC-044); chủ đầu tư nhắn đội "Lệch tờ ngày dd/mm: n đơn" (chỉ số lượng). SEC ghi là sai lệch quy trình, không phải lộ dữ liệu (luật sư xác nhận cùng ESC-001), ghi decision-log.
  5. Lưu sai giá trị (ca b): ~~OPS sửa một dòng `config_parameter`~~ – **ORC không chấp nhận** (luật cứng: không ghi SQL tay trên production; ngoại lệ chỉ INV quyết). Thay bằng: kéo thẻ 09(a) vào v1.0.4 để máy chủ chặn giá trị sai; ngày thay tờ chỉ làm sau khi 09(a) đã lên. Xem dòng decision-log ORC 04/11.
- Giả định G-SEC-BA104-4: tờ v2 có đủ ý tờ v1, chỉ thêm đoạn dịch tin nhắn; UXD/CPY đổi nghĩa đoạn khác thì SEC xem lại.
- Trạng thái: Open

### FB-R4-SEC-BA-104-08 (ý kiến về DOM 08)
- Mức độ: Minor
- Vị trí: `00-index.md` mục 4 sau bước 3.3; `02` 7.2 sau bước 4.
- Vấn đề: DOM 08 đúng; từ chối `noticeVersion` (`registration.controller.ts` 462, `NOT_IN_LIST`) là cơ chế đóng an toàn, giữ, không nới.
- Đề xuất sửa: đồng ý "nhận tin 'Đã đặt v2' thì F5 mọi trang giấy tờ đang mở". Thêm: "Desk báo lỗi khi lưu đồng ý của khách đang làm dở lúc thay tờ: cho khách xem tờ v2, F5 và hỏi lại câu đồng ý. Không chọn sẵn thay khách." Chữ báo lỗi lấy đúng chuỗi FE.
- Trạng thái: Open

### FB-R4-SEC-BA-104-09 (gửi ARC)
- Mức độ: Minor
- Vị trí: `config_parameter_def` khóa `privacy_notice_version` (migration 0050 dòng 121, `bounds` NULL); `parameters.service.ts set()`.
- Vấn đề: máy chủ nhận mọi chuỗi cho tham số pháp lý này, không có đường quay lại trong ngày.
- Đề xuất sửa: (a) danh sách giá trị cho phép ở máy chủ (cùng nguồn `NOTICE_TEXT_VERSIONS`), giá trị lạ → 422; (b) cho ghi đè dòng hôm nay **chỉ** trong 30 phút sau lần lưu, **chỉ** bởi đúng người vừa lưu, có audit `sameDayOverride`. SEC duyệt thiết kế. **ORC 04/11: kéo (a) vào v1.0.4; (b) ARC đánh giá có kịp v1.0.4 không.**
- Trạng thái: Open

### FB-R4-SEC-BA-104-04
- Mức độ: Minor
- Vị trí: `00-index.md` mục 4 bước 3.1, 3.5 (dòng 110, 114); `02` 7.2 bước 2, 5 (dòng 493, 496).
- Vấn đề: tệp v1 trên máy tính bảng bị xóa ngay lúc thay tờ; nhánh dự phòng không đặt lại tệp v1 → dùng máy tính bảng thì khách đọc v2, Desk ghi v1.
- Đề xuất sửa: "chép tệp v2; tệp v1 đổi tên hoặc chuyển ra thư mục riêng, xóa khi có tin 'Đã đặt v2'". Nhánh dự phòng: "máy tính bảng: mở lại tệp v1, xóa tệp v2". Không có tệp v1 thì hôm đó không dùng máy tính bảng.
- Trạng thái: Open

### FB-R4-SEC-BA-104-05
- Mức độ: Minor
- Vị trí: sổ tay 1.5 bước 7 (dòng 398); `01` 1.9 bước 7 (dòng 254); khối CTV (dòng 401, 257).
- Vấn đề: khi bị khóa, app nhân viên trên điện thoại riêng chỉ về màn đăng nhập, **bản đọc offline vẫn còn** (tên gọi khách việc hôm nay, số căn, phiếu sửa); chỉ **Đăng xuất** mới xóa (`App.tsx` 128–148, SR-PWA-04). CTV không có bước 7.
- Đề xuất sửa: bước 7 thêm: "Người nghỉ êm: nhờ họ bấm **Đăng xuất** trong app trước mặt anh/chị, **trước** bước 3. Người bị cho thôi việc: nhờ họ xóa dữ liệu trang của app hoặc gỡ app; không làm thì ghi sổ giao ca, không ép." Khối CTV thêm "và bước 7 nếu máy CTV đã được cấp quyền".
- Trạng thái: Open

### FB-R4-SEC-BA-104-06
- Mức độ: Minor
- Vị trí: sổ tay 1.5 dòng "Khóa tài khoản" và bước 3; `01` 1.9 cùng chỗ.
- Vấn đề: chưa cấm **Mở khóa** tài khoản người đã nghỉ hẳn; mật khẩu, 2 bước và mã khôi phục vẫn hiệu lực.
- Đề xuất sửa: "Tài khoản người nghỉ hẳn **không Mở khóa lại**. Tuyển lại thì tạo tài khoản mới (tên đăng nhập mới, mật khẩu tạm mới, bật 2 bước lại nếu vai cần)."
- Trạng thái: Open

### FB-R4-SEC-BA-104-07
- Mức độ: Suggestion
- Vị trí: sổ tay 1.5 bước 4 (dòng 395); `01` 1.9 bước 4 (dòng 251).
- Vấn đề: "địa chỉ cũ sẽ nhận một thư" đứng cạnh "tài khoản đã Khóa không nhận thư bảo mật về chính mình nữa" – đọc như trái nhau.
- Đề xuất sửa: "Sau bước 3, tài khoản này không nhận thư bảo mật về chính mình nữa, **trừ một** thư 'notification email changed' gửi tới địa chỉ cũ ở bước này." Thư không có dữ liệu khách.
- Trạng thái: Open

---

## Duyệt thiết kế P4-16 (04/11) – ARC `v1.0.4-notice-version-allowlist.md`: **DUYỆT CÓ ĐIỀU KIỆN**

ORC chép kết quả từ báo cáo SEC trong phiên. Thẻ 09(a) có thiết kế ở `rounds/round-04/outputs/ARC/v1.0.4-notice-version-allowlist.md`.
- Đồng ý G-ARC-NV-1: bỏ v1 khỏi danh sách. Sau v1.0.4, máy chủ và guest-web chỉ nhận `privacy-2026-10-v2`.
- G-ARC-NV-4 (`SECURITY_AUDITED_KEYS`): không làm ở v1.0.4, dời v1.0.5 cùng 09(b).
- 09(b), ghi đè trong ngày: dời v1.0.5. Điều kiện bù là test G3 bắt danh sách có đúng 1 version. Lý do: khi chỉ có một giá trị hợp lệ thì không thể lưu sai sang một version khác. Còn lỗi lưu nhầm ngày hiệu lực thì P4-34 xử lý bằng nút Hủy lịch.

### FB-R4-SEC-BE-P416-01
- Mức độ: Major (điều kiện duyệt)
- Đề xuất: test G3 khẳng định danh sách có độ dài 1 và có câu báo "thêm version thứ hai phải làm 09(b) trước".
- Trạng thái: **Closed** – SEC review mã `2975bc97` (`SEC-on-v104-p4-16.md`).

### FB-R4-SEC-BE-P416-02
- Mức độ: Major (điều kiện duyệt)
- Đề xuất:
  - test I7: giá trị lạ có ngày hiệu lực tương lai cũng bị 422;
  - test G1: so với `config.ts` của guest-web chỉ theo literal (regex neo đầu/cuối), đường dẫn tính bằng `path.resolve`.
- Trạng thái: **Closed** – `2975bc97`.

### FB-R4-SEC-BE-P416-03
- Mức độ: Minor
- Đề xuất:
  - (a) I3: audit ghi đúng nhóm `config`; đồng ý v1 tại quầy → 422 `NOT_IN_LIST`;
  - (b) Q5 kiểm trên staging;
  - (c) BA: trước ngày thay tờ, OWN kiểm không có dòng hẹn ngày tương lai cho `privacy_notice_version`;
  - (d) hằng `Object.freeze`.
- Trạng thái: (a)(d) **Closed** ở `2975bc97` (SEC Suggestion 04 của review mã làm ở `acd0f7ca`). (b) **chờ QA** kiểm trên staging ở QA lượt 2 v1.0.4. (c) **Closed**: BA làm ở `45d09e5a`, tên nút theo P4-34 ở `4a842a14`.

---

## Xác nhận lượt 2 (04/11) – `v104/ba-docs` @ `97d7ae5d`: **ĐẠT**

- Thẻ 01–08: Closed.
- Thẻ 09: (a) chuyển thành gói P4-16 của v1.0.4. (b) còn mở, dời v1.0.5.
- Đồng ý 3 chỗ BA làm khác DOM/SEC.
- Ghi decision-log: lệch tờ ở quầy so với tham số là **sai lệch quy trình, không phải lộ dữ liệu**. Chờ luật sư xác nhận cùng ESC-001.

### FB-R4-SEC-BA-104-10
- Mức độ: Suggestion
- Đề xuất: ghi "ô Giá trị mới báo **bất kỳ lỗi nào** = chưa lưu".
  - Thiếu dấu nháy thì `ParamDialog` báo "Chọn một giá trị trong danh sách." (do `JSON.parse` lỗi).
  - QA kiểm cả hai chuỗi này trên staging.
- Trạng thái: **Closed** – `45d09e5a`.

### FB-R4-SEC-BA-104-11
- Mức độ: Minor
- Vấn đề: khách đã xem v2 nhưng không muốn tin nhắn được dịch.
- Đề xuất: sổ giao ca ghi "không dịch" cạnh mã đơn. 13.1d thành quy tắc chung. DOM kiểm.
- Trạng thái: **Closed** – `45d09e5a`.

### FB-R4-SEC-BA-104-12
- Mức độ: Suggestion
- Đề xuất: `01` 12.1 bỏ chữ "cùng ngày", xếp thứ tự theo 1.9.
- Trạng thái: **Closed** – `45d09e5a`.

---

## Xác nhận lượt 3 (04/11) – `v104/ba-docs` @ `45d09e5a`: **ĐẠT**

Thẻ 10/11/12 và P416-03(c) đóng. Hai thẻ mới:

### FB-R4-SEC-BA-104-13
- Mức độ: Minor
- Vị trí: sổ tay 2.18.
- Vấn đề: thiếu quy tắc "không dịch" như `02-le-tan.md`.
- Trạng thái: **Closed** – `d11705f4`. Lượt 4 xác nhận chữ trùng `02-le-tan.md`: áp cho mọi khách; mã đơn có ghi "không dịch" hoặc "chưa xem v2" thì không dịch.

### FB-R4-SEC-BA-104-14
- Mức độ: Suggestion
- Đề xuất:
  - (a) nếu P4-34 trễ: ghi đè dòng hẹn tương lai bằng v2, cùng `effectiveFrom`;
  - (b) kiểm lần 1 hôm trước, kiểm lần 2 sáng ngày thay tờ; gặp lỗi ở ô khác thì không nhắn "Đã đặt v2".
- Trạng thái:
  - (a) **Không làm** – chấp nhận, vì P4-34 (nút Hủy lịch) đã vào v1.0.4.
  - (b) **Closed** – `d11705f4`.

---

## Xác nhận lượt 4 (04/11) – `v104/ba-docs` @ `4a842a14`: **ĐẠT, gộp được**

- Diff `45d09e5a..4a842a14` gồm 3 tệp: `00-index.md`, `user-manual-v1.0.md`, `BA-on-DOM-v104.md`. Hết điều kiện.
- 13, 14(b), P416-03(c): đóng.
  - Đường đi đối chiếu từng chuỗi với `strings-vi.json` trên `v104/fe-param-cancel`: Hủy lịch → hộp "Hủy giá trị đã lên lịch?" → Lý do → Hủy lịch → toast "Đã hủy lịch đổi …".
  - Câu "chỉ dòng hẹn từ ngày mai trở đi" khớp lỗi 409 `params.cancel_effective`.
  - Câu "chỉ chủ đầu tư thấy nút" khớp `edit_roles '{owner}'` (migration 0050).
- Quét các dòng thêm: không có email, mật khẩu, khóa, số tài khoản hay số điện thoại. Không có thẻ mới.
- Giả định: nếu UXD đổi chữ P4-34 trước khi gộp, BA đồng bộ lại `00-index` mục 4 bước 1.
