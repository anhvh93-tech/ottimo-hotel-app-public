# PO review – BUG-R4-032: sổ tay "Đặt lại xác thực 2 bước" (PR #63)

- Người review: PO | Round 4 – v1.0.4 – Bước: **Review + Phản hồi** | 04/11/2026
- Đối tượng: PR #63, nhánh `v104/ba-2fa-reset-manual` @ `f8d87d3a` (cắt từ `origin/main` @ `40825ee1`). Đã đọc `git diff origin/main...f8d87d3a` (11 tệp) và `rounds/round-04/responses/BA-BUG-R4-032.md`.
- Đối chiếu: `rounds/round-04/plan-v1.0.4.md` mục 1, 3 (P4-30, P4-50), 7.4; `rounds/round-04/qa/bug-list-v1.0.4.md` BUG-R4-032; `rounds/round-04/qa/v1.0.4-test-cases.md` TC-V104-MN-02; decision-log 15/10 (2FA bắt buộc OWN/MGR), 03/11 (ARC RN103-02, SEC chốt RN103-05), 04/11 (DOM B.1, ORC gộp 22 PR); `product/docs/rbac-matrix.md` (S09, ghi chú 3–4); `product/design/copy/strings-vi.json` trên `main`; `shared-mailboxes.ts`, `lease-end.ts` trên `main`.

## Kết luận: ĐẠT CÓ ĐIỀU KIỆN

- **Đúng phạm vi v1.0.4.** Chỉ sửa tài liệu, chỉ mô tả cái đã có trên `main` (P4-30 #53, P4-50 #39). Không hứa tính năng mới. Mọi chỗ mới ghi "áp dụng từ v1.0.4", đúng vì production đang chạy v1.0.3.
- **Đủ ý BUG-R4-032 (a), (b), (b').** Hai hàng "mất cả điện thoại lẫn mã khôi phục" đặt đường mới lên trước, đường cũ xuống dưới, khớp SEC RN103-05 ("1.7 thành dự phòng").
- **Dễ hiểu cho chủ đầu tư và lễ tân trưởng.** Khối mới đi theo thứ tự chủ đầu tư thật sự làm: trước khi bấm → 5 bước → khi Desk báo lỗi → Desk tự làm gì → người đó làm tiếp. Chữ trên nút và câu báo khớp `strings-vi.json`.
- **Điều kiện trước khi gộp:** sửa thẻ 01 (Major). Thẻ 02 (quyết định F4) và 03 nên làm trong cùng lượt. Thẻ 04–07 làm sau hoặc theo mốc ghi trong thẻ.
- Không ESC mới.

---

### FB-R4-PO-BA-032-01
- Mức độ: Major
- Vị trí: `user-manual-v1.0.md` mục 1.5, khối **Đặt lại xác thực 2 bước**, phần "Trước khi bấm" gạch 2 và "Người đó làm tiếp" bước 4. Cùng chữ ở `01-chu-dau-tu-quan-ly.md` mục 1.9.
- Vấn đề: hai câu trong cùng một khối nói ngược nhau. "Trước khi bấm" viết cho **mọi** người: "Đặt lại xong, người đó bật lại 2 bước ngay, không để tài khoản chỉ còn mật khẩu qua đêm." Bước 4 cũng trong khối đó lại ghi: "Buồng phòng, bảo trì, sale, CTV: … Bật lại như bước 3 chỉ khi người đó muốn". Với vai tùy chọn, tài khoản chỉ còn mật khẩu là trạng thái bình thường (DOM B.1, `03` 1.6, `04` 1.5).
- Vì sao quan trọng: chủ đầu tư làm theo khối này khi đang ngồi cùng nhân viên. Đọc gạch đầu, chủ đầu tư có thể ép buồng phòng bật lại dù họ không giữ được mã khôi phục. Người đó lại mất máy thì chủ đầu tư phải gặp tận mặt thêm lần nữa, đúng điều DOM B.1 muốn tránh. Đọc bước 4 thì lại thấy câu "không để qua đêm" thừa. QC 7.4 đọc đúng khối này.
- Đề xuất sửa: thu hẹp câu ở "Trước khi bấm" cho người **phải** có 2 bước: "Quản lý và lễ tân trưởng bật lại 2 bước ngay buổi đó, không để tài khoản chỉ còn mật khẩu qua đêm." Bước 4 tách hai dòng theo thẻ 02: sale nội bộ, CTV **nên bật lại ngay buổi đó**; buồng phòng, bảo trì **tùy chọn**, không bật lại thì tài khoản chỉ có mật khẩu như trước khi bật. Câu này là ý BA thêm (mục 3 ý 3 của tệp phản hồi) và đang chờ SEC đọc: SEC đổi gì thì giữ phạm vi theo vai như trên.
- Trạng thái: Open

### FB-R4-PO-BA-032-02 – Quyết định F4 (PO)
- Mức độ: Minor
- Vị trí: `05-sale-ctv.md` mục 1.2 (dòng 46 "Sale/CTV không cần đăng nhập 2 bước"), `05` mục 1.6 (hàng mới "Đã tự bật 2 bước…"); `01` mục 1.9 và sổ tay mục 1.5, bảng vai (Sale nội bộ, CTV: "Chưa"); khối **Đặt lại xác thực 2 bước** bước 4.
- Vấn đề: `05` 1.2 ghi "không cần", còn `01` 1.9 bước 8 và sổ tay 1.5 bước 7 ghi "tự bật được, nên bật". Bảng vai ghi "Chưa", đọc như "sẽ có sau". Lỗi có từ trước: `05` viết ngày 30/10, lúc sale/CTV còn chưa bật được (D27 ẩn mã QR tới v1.0.3, ARC 03/11).
- Vì sao quan trọng: sale, CTV đọc `05`, chủ đầu tư đọc `01`. Hai tệp nói khác nhau thì không ai biết nên làm gì.
- **Quyết định PO:** sale nội bộ, CTV: **không bắt buộc (Desk không ép), nên bật** khi dùng điện thoại riêng và cất được 10 mã khôi phục. Giữ chữ của `01` và sổ tay. Sửa `05` theo.
  - Căn cứ: decision-log 15/10 và mã chỉ bắt buộc chủ đầu tư, quản lý (`MFA_REQUIRED_ROLES`, `MFA_ENFORCED=true` trên production). DOM B.1 (04/11) chỉ quyết lễ tân trưởng, buồng phòng, bảo trì. Release notes v1.0.3 đã ghi "Sale, CTV … tự bật được, nên bật" (DOM, SEC đã duyệt). Khác buồng phòng/bảo trì ("không khuyến khích"): sale, CTV đăng nhập Desk từ ngoài cơ sở trên điện thoại riêng, thấy tên và liên hệ khách của đơn mình, sale xử lý yêu cầu từ website, cả hai ghi được cọc tiền mặt (rbac ghi chú 3–4, 33a, 42). Cái giá nếu mất máy cũng giống nhau: chủ đầu tư gặp tận mặt rồi **Đặt lại xác thực 2 bước**.
  - Đây là mặc định đội chọn, không phải chính sách với khách. Không ESC. ORC ghi cùng dòng "mặc định 2 bước theo vai" của DOM B.1 trong báo cáo cuối round; chủ đầu tư đổi được.
- Đề xuất sửa (BA):
  - `05` 1.2: "Sale/CTV: đăng nhập 2 bước không bắt buộc, nhưng nên bật nếu anh/chị dùng điện thoại riêng và cất được 10 mã khôi phục. Bật ở **tên của mình → Bảo mật tài khoản → Xác thực 2 bước** (từ v1.0.3), làm như `02` mục 1.3."
  - `05` 1.6 hàng mới: thêm "Bật lại 2 bước ngay buổi đó cùng chủ đầu tư (nên bật)."
  - Bảng vai `01` 1.9 và sổ tay 1.5, cột 2 bước của sale nội bộ, CTV: "Không bắt buộc – nên bật".
  - Khối mới bước 4: như thẻ 01.
- Trạng thái: Open

### FB-R4-PO-BA-032-03
- Mức độ: Minor
- Vị trí: khối mới "Người đó làm tiếp" bước 3 ("bắt buộc theo quy định OTTIMO, bước 7 ở trên"); sổ tay 0.4 và `01` 1.7 hàng buồng phòng/bảo trì/lễ tân trưởng ("bắt buộc theo quy định OTTIMO"); bảng vai `01` 1.9 dòng lễ tân trưởng.
- Vấn đề: bước 7/8 ghi đúng là "mặc định đội chọn (anh/chị đổi được, báo đội)". Các chỗ mới lại ghi "quy định OTTIMO", nghe như chủ đầu tư đã ban hành.
- Vì sao quan trọng: chủ đầu tư chưa xác nhận mặc định này. ORC sẽ trình ở cuối round 4 (DOM B.1). Chữ trong sổ tay phải để chủ đầu tư biết mình còn đổi được.
- Đề xuất sửa: đổi thành "bắt buộc (mặc định đội chọn, bước 7/8; anh/chị đổi được)". Khi chủ đầu tư xác nhận thì bỏ phần trong ngoặc.
- Trạng thái: Open

### FB-R4-PO-BA-032-04 – F1 (câu báo 409)
- Mức độ: Minor
- Vị trí: khối mới, gạch "Desk báo thao tác không còn dùng được… Câu báo này có thể mở đầu bằng 'Đơn vừa chuyển sang…': lỗi chữ, đã báo đội." (sổ tay 1.5, `01` 1.9).
- Vấn đề: câu tạm đúng với `main` hôm nay. Bản sửa đã có: PR #65 (`v104/users-2fa-stale`: UXD `46ff21a2` thêm `users.reset_2fa_stale`, FE-A `6b346d85`).
- Vì sao quan trọng: #65 gộp mà sổ tay vẫn ghi câu tạm thì sổ tay sai so với Desk.
- Đề xuất sửa: phạm vi PO cho F1: **v1.0.4 nếu #65 gộp trước khi cắt bản 06/11 18:00**, không kịp thì v1.0.5 (P3, chỉ chữ, không chạm tiền). #65 gộp thì BA thay câu tạm bằng chữ Desk mới: "Đã có người đổi xác thực 2 bước của {tên} trước bạn – hiện không còn bật, nên không cần đặt lại. Danh sách đã được tải lại." Release notes v1.0.4 (#66) đã đưa #65 vào bảng "Đang chờ gộp".
- Trạng thái: Open

### FB-R4-PO-BA-032-05 – QC 7.4, câu "không bật 2 bước ở v1.0.x"
- Mức độ: Suggestion
- Vị trí: tệp phản hồi BA mục 5; `01` 1.8/1.9 bước 8, `02`, `03`, `04`; dòng "Lập:" đầu các tệp.
- Vấn đề: BA đề xuất giữ đoạn cũ kèm hộp "Áp dụng từ v1.0.4" tới ngày v1.0.4 lên, rồi gỡ trong một commit.
- Vì sao quan trọng: PO **đồng ý** hướng này. v1.0.3 đang chạy, gỡ sớm thì người dùng app nhân viên có thể bật 2 bước và mất app (ARC RN103-02). Release notes v1.0.4 đã ghi lời dặn **hết hiệu lực từ v1.0.4**, đủ phần PO của QC 7.4. Rủi ro là ngày lên bản phải sửa nhiều tệp cùng lúc.
- Đề xuất sửa: BA chuẩn bị sẵn nhánh gỡ theo danh sách mục 5, để QA đọc trước QC 08/11. Ngày lên bản chỉ còn gộp nhánh đó và UXD dựng lại HTML. Trong cùng nhánh, chuyển phần lịch sử dài ở dòng "Lập:" (đầu `00-index` khoảng 2.000 ký tự) xuống bảng phiên bản cuối tệp, chỉ giữ bản hiện hành. Chủ đầu tư và lễ tân trưởng đọc đầu tệp trước tiên.
- Trạng thái: Open

### FB-R4-PO-BA-032-06 – các điểm v1.0.4 ngoài BUG-R4-032 (cùng đợt tài liệu)
- Mức độ: Minor
- Vị trí và vấn đề:
  - (a) Sổ tay 0.3a (dòng 122) và `01` 1.6a (dòng 125) ghi "**Desk chỉ chặn được `info@`**". Từ v1.0.4 Desk chặn cả `booking@` (`shared-mailboxes.ts` `DEFAULT_SHARED_LOCAL_PARTS = ['info','booking']`, SEC SENT-02/M18-01 Verified), kể cả dạng `info+…@`.
  - (b) `02` 9.3 bước 6 và 17.5 (mục 1 "Gia hạn làm mất ngày kết thúc HĐ trên Desk") vẫn nói Desk không giữ ngày kết thúc HĐ khi gia hạn. Từ v1.0.4 Desk giữ ngày này (P4-11 #57, `lease-end.ts`) và **Trả sớm** chọn đúng nhánh.
  - (c) Khi #64 (P4-32) gộp: lễ tân và lễ tân trưởng không thấy yêu cầu hoàn đang chờ do người khác tạo, ở dòng "Đang chờ hoàn" lẫn ở **Nhật ký tiền → Hoàn tiền** (ARC chốt 04/11).
- Vì sao quan trọng: (a) sai nhưng an toàn (vẫn dặn tránh `booking@`). (b) bắt lễ tân làm một việc tạm đã hết cần. (c) lễ tân có thể báo khách thiếu số tiền hoàn.
- Đề xuất sửa:
  - (a), (b): thêm hộp "Áp dụng từ v1.0.4" như cách BA đang làm. Bảng kỳ thu vẫn giữ cột ngày kết thúc HĐ.
  - (c) dùng đúng câu này ở `02` 11.5.2 và chỗ nói về trang Trả phòng: "Lễ tân và lễ tân trưởng không thấy yêu cầu hoàn đang chờ do người khác tạo, cả ở dòng 'Đang chờ hoàn' của trang Trả phòng lẫn ở **Nhật ký tiền → Hoàn tiền**. Khách có Trả sớm chưa được duyệt: **hỏi quản lý hoặc chủ đầu tư** trước khi báo khách số tiền hoàn." Đây là giới hạn đã biết, sửa ở v1.0.5. Không ghi ngày.
  - Ngoài phạm vi PR #63, ORC xếp vào lượt tài liệu v1.0.4 kế tiếp. Không chặn #63.
- Trạng thái: Open

### FB-R4-PO-BA-032-07
- Mức độ: Suggestion (cho DOM + SEC, BA chỉ ghi khi đã có quyết định)
- Vị trí: bảng vai `01` 1.9 và sổ tay 1.5, dòng **Lễ tân** ("Chưa"); `02` mục 1.7 hàng "Mất cả điện thoại lẫn mã khôi phục" (chỉ nói vai quản lý và lễ tân trưởng làm gì sau khi đặt lại).
- Vấn đề: chưa ai đặt mặc định 2 bước cho vai **Lễ tân**. DOM B.1 chỉ quyết lễ tân trưởng, buồng phòng, bảo trì. Vai Lễ tân cũng xem **Giấy tờ & khai báo** (rbac S09) như lễ tân trưởng.
- Vì sao quan trọng: hôm nay chưa ảnh hưởng ai (người trực 6 vai đã bắt buộc vì có vai quản lý). Sẽ thành câu hỏi khi tuyển lễ tân đầu tiên.
- Đề xuất sửa: DOM + SEC chốt cùng việc thêm `front_desk_lead` vào `MFA_REQUIRED_ROLES` ở v1.0.5. PO đề xuất tạm "không bắt buộc, nên bật", giống sale/CTV. Tới lúc đó BA không đổi chữ.
- Trạng thái: Open

---

## Ghi chú cho ORC

- **F2:** release notes v1.0.4 ở PR #66 (`v104/po-release-notes`, base `main`). Đã có dòng BA đề xuất, giới hạn "Đang chờ hoàn" theo câu ARC chốt, bảng "Đang chờ gộp" (#60, #63, #64, #65). Mục v1.0.3 chuyển sang "Đã phát hành 04/11". Số mục sổ tay trỏ tới #63, nên gộp #63 trước hoặc cùng #66.
- **TC-V104-MN-02** còn một phần ngoài lỗi này: "bỏ cách tạm giữ chỗ sổ tay 2.4 sau khi QA đạt". #63 chưa làm, đúng, vì phải chờ QA kiểm trên staging. Sổ tay 2.4, `02` mục 4.5 và 17.1, `05` (dòng 210) vẫn ghi "chưa có Chấp nhận cọc thiếu". Cần một lượt BA sau QA mục 2, trước QC 08/11.

## Điểm làm tốt (nên giữ)

1. Cột "Mã nói gì / Sổ tay ghi" (tệp phản hồi mục 2): mỗi câu trong sổ tay có nguồn trong mã. PO kiểm lại nhanh, không phải hỏi.
2. "Chưa gặp được ngay thì Khóa tài khoản trước" và "thư này anh/chị biết trước, không cần làm gì". Hai câu này trả lời đúng hai việc chủ đầu tư sẽ lo nhất lúc mất máy.
3. Thứ tự **Từ v1.0.4** trước, **Ở v1.0.3** sau trong cùng một ô. Từ ngày lên bản, đường cũ chỉ còn là dự phòng mà không phải viết lại bảng.

## Phản hồi BA (04/11/2026, lượt 2 của PR #63)

- **FB-R4-PO-BA-032-01 – Fixed.** **Trước khi bấm**: "Quản lý và lễ tân trưởng … bật lại 2 bước ngay buổi đó, không để tài khoản chỉ còn mật khẩu qua đêm. Vai khác: bước 4, 5." **Người đó làm tiếp** tách: 4 = sale nội bộ, CTV nên bật lại ngay buổi đó; 5 = buồng phòng, bảo trì tùy chọn, không bật lại thì chỉ có mật khẩu như trước khi bật; 6 = app nhân viên.
- **FB-R4-PO-BA-032-02 – Fixed theo quyết định F4.** `05` 1.2 có đoạn **Đăng nhập 2 bước** (không bắt buộc, nên bật). BA viết 4 bước ngắn ngay trong `05` thay cho trỏ sang `02` 1.3, vì sale/CTV chỉ nhận tệp `05`. `05` 1.6 có câu "Bật lại 2 bước ngay buổi đó cùng chủ đầu tư (nên bật)". Bảng vai sổ tay 1.5 và `01` 1.9 ghi "Không bắt buộc – nên bật".
  - Bảng vai sổ tay 1.5 cũng ghi giá trị v1.0.4 cho lễ tân trưởng, buồng phòng, bảo trì để khớp `01`. Dòng Lễ tân giữ "Chưa".
- **FB-R4-PO-BA-032-03 – Fixed.** "quy định OTTIMO" đổi thành "bắt buộc – mặc định đội chọn…; anh/chị đổi được" ở khối mới bước 3, dòng sổ tay 0.4 / `01` 1.7 và bảng vai `01` 1.9. `02` 1.8 bỏ vế "nên đây là quy định của OTTIMO".
- **FB-R4-PO-BA-032-04 – Fixed, cần gộp #65 trước hoặc cùng #63.** Câu tạm được thay bằng hành vi mới: hộp đóng, danh sách tải lại, Desk hiện "Đã có người đổi xác thực 2 bước của {tên} trước bạn – hiện không còn bật, nên không cần đặt lại. Danh sách đã được tải lại." (`users.reset_2fa_stale`, `origin/v104/users-2fa-stale` @ `6b346d85`). Nếu #65 trượt sang v1.0.5 thì BA trả lại câu tạm.
- **FB-R4-PO-BA-032-05 – Accepted, Deferred.** Nhánh gỡ "không bật 2 bước ở v1.0.x" và việc chuyển lịch sử dòng "Lập:" xuống bảng phiên bản sẽ cắt từ `main` sau khi #63 và PR tài liệu r4b gộp. Xong trước 06/11 18:00 để QA đọc trước QC 08/11. Câu "Sale nội bộ, CTV… nên bật" giữ lại khi gỡ.
- **FB-R4-PO-BA-032-06 – Tách PR riêng.** Làm ở PR #68 (`v104/ba-docs-r4b` @ `da98e511`, cắt từ `origin/main`, gộp sau #63). PR này có thêm luật DOM 04/11 về Trả sớm lúc 00:00–05:59. Chưa làm phần MN-02 (bỏ cách tạm giữ chỗ 2.4) vì còn chờ QA.
- **FB-R4-PO-BA-032-07 – Ghi nhận.** Không đổi chữ dòng **Lễ tân** (bảng vai, `02` 1.7) cho tới khi DOM và SEC chốt việc thêm `front_desk_lead` vào `MFA_REQUIRED_ROLES` ở v1.0.5.

---

## PO kiểm lượt 2 (04/11/2026, PR #63 head `8192e26b`)

**Kết luận: ĐẠT** về góc PO. Điều kiện gộp: #65 vào `main` trước #63 (thứ tự #65 → #63 → #68).

| ID | Trạng thái mới | Ghi chú PO |
|---|---|---|
| FB-R4-PO-BA-032-01 | **Closed** | "Bật lại ngay, không để qua đêm" nay chỉ áp cho quản lý và lễ tân trưởng (khối **Trước khi bấm**, sổ tay 1.5 và `01` 1.9). Bước 4 (sale nội bộ, CTV nên bật lại ngay buổi đó), 5 (buồng phòng, bảo trì tùy chọn), 6 (app nhân viên) không còn mâu thuẫn |
| FB-R4-PO-BA-032-02 | **Closed** | `05` 1.2 có đoạn **Đăng nhập 2 bước** 4 bước, viết ngay trong `05` vì sale, CTV chỉ nhận tệp này. PO đồng ý. `05` 1.6, bảng vai sổ tay 1.5 và `01` 1.9 ghi "Không bắt buộc – nên bật". Các giá trị v1.0.4 của lễ tân trưởng, buồng phòng, bảo trì ở sổ tay 1.5 khớp `01` |
| FB-R4-PO-BA-032-03 | **Closed** | Không còn "quy định OTTIMO"; mọi chỗ ghi "bắt buộc – mặc định đội chọn…; anh/chị đổi được" |
| FB-R4-PO-BA-032-04 | **Closed (có điều kiện)** | Câu mới khớp từng chữ chuỗi `users.reset_2fa_stale` ở #65 @ `6b346d85`. #65 phải gộp trước. Nếu #65 trượt sang v1.0.5 thì BA trả lại câu tạm trước khi gộp #63, đúng như BA đã ghi |
| FB-R4-PO-BA-032-05 | **Deferred – PO đồng ý** | Nhánh gỡ cắt từ `main` sau khi #63 và #68 gộp, **mở PR trước 06/11 18:00**, QA đọc trước QC 08/11. PR đó gộp **khi chủ đầu tư báo v1.0.4 đã lên** (v1.0.3 còn chạy tới lúc đó, gỡ sớm thì người dùng app có thể bật 2 bước rồi mất app), rồi UXD dựng lại HTML. Giữ câu "Sale nội bộ, CTV… nên bật". Chuyển lịch sử dòng "Lập:" xuống bảng phiên bản trong cùng nhánh. QC 7.4 phần sổ tay xét theo PR này |
| FB-R4-PO-BA-032-06 | **Moved → #68** | Xem ghi chú dưới |
| FB-R4-PO-BA-032-07 | Ghi nhận | Chờ DOM, SEC chốt `front_desk_lead` trong `MFA_REQUIRED_ROLES` ở v1.0.5 |

### Ghi chú cho #68 (thẻ 06, `v104/ba-docs-r4b` @ `da98e511`)

PO đọc nhanh, chưa phải review đầy đủ. (a) `booking@` và (b) ngày kết thúc HĐ khi gia hạn: đúng ý. (c) Câu giới hạn P4-32 trong sổ tay 2.14a và `02` 11.5 khớp hướng ORC: hỏi quản lý (hoặc chủ đầu tư) trước khi báo khách, cả hai chỗ đều không hiện. Câu Trả sớm 00:00–05:59 khớp luật DOM. Câu "ký quỹ và tiền các ngày gia hạn vẫn làm ngoài app" đúng theo mã. Release notes #66 @ `27bf18cd` đã sửa theo câu này.

### FB-R4-PO-BA-032-08
- Mức độ: Minor
- Vị trí: #68, sổ tay 2.14 bước 6, 2.14a; `02` 11.1, 11.5; `01` 7.3 (dòng **Đang chờ hoàn** "từ v1.0.4").
- Vấn đề: dòng này là của #64 (P4-32), #64 vẫn đang mở. #68 ghi như đã chắc có trong v1.0.4.
- Vì sao quan trọng: nếu #64 trượt sang v1.0.5, lễ tân sẽ tìm một dòng không có trên Desk.
- Đề xuất sửa: gộp #64 trước #68. Nếu tới lúc cắt bản #64 chưa gộp, BA đổi "từ v1.0.4" thành "từ v1.0.5" cho dòng **Đang chờ hoàn**. Giới hạn ở **Nhật ký tiền → Hoàn tiền** và câu "hỏi quản lý" vẫn giữ, vì giới hạn đó có cả ở bản đang chạy.
- Trạng thái: Open

### FB-R4-PO-BA-032-09
- Mức độ: Suggestion
- Vị trí: #68, câu giới hạn P4-32 (sổ tay 2.14a, `02` 11.5).
- Vấn đề: release notes #66 dùng câu đã qua DOM (RN-01), có thêm hai ý mà #68 chưa có:
  - yêu cầu đã được quản lý duyệt thì vẫn thấy như thường;
  - không báo khách "không có khoản hoàn".
- Đề xuất sửa: thêm hai ý này để sổ tay và release notes nói cùng một câu.
- Trạng thái: Open
