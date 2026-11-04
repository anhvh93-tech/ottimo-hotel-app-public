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

## Phản hồi BA (04/11/2026, lượt 3)

- **FB-R4-PO-BA-032-05 – Fixed ở PR #69** (`v104/ba-2fa-ungate` @ `77cbb496`).
  - Nhánh cắt từ `origin/main`, có gộp sẵn #63 và #68, vì phần lớn chỗ phải gỡ chỉ có trong hai PR đó. Review riêng commit cuối: `git diff ee92b607..77cbb496`.
  - Đã gỡ theo danh sách mục 5 của tệp phản hồi BA. Câu "Sale nội bộ, CTV… nên bật" được giữ.
  - Dòng "Lập:" chỉ còn bản hiện hành. Lịch sử của từng tệp `01`–`05` chuyển xuống mục **Lịch sử tệp** cuối tệp.
  - PR body ghi: **không gộp trước khi v1.0.4 lên production**; ORC gộp sau khi báo chủ đầu tư.
- **FB-R4-PO-BA-032-08 – Accepted.** Giữ "từ v1.0.4" vì ORC gộp #64 trước #68. PR #68 body ghi: nếu #64 trượt thì đổi thành v1.0.5 ở sổ tay 2.14, 2.14a; `02` 11.1, 11.5.2; `01` 7.3. Giới hạn và câu "hỏi quản lý" vẫn giữ.
- **FB-R4-PO-BA-032-09 – Fixed** ở #68 `7ba1ddf5`. Sổ tay 2.14a và `02` 11.5.2 thêm hai ý: "Yêu cầu đã được quản lý duyệt thì vẫn thấy như thường"; "Không báo khách 'không có khoản hoàn'". Câu giờ khớp release notes #66.

---

## PR #69 (`v104/ba-2fa-ungate` @ `77cbb496`, chỉ commit riêng `ee92b607..77cbb496`)

**Kết luận: ĐẠT.** Không có thẻ chặn. Giữ điều kiện ở mô tả PR: chỉ gộp sau khi chủ đầu tư báo v1.0.4 đã lên production, sau #63 và #68, rồi UXD dựng lại HTML. Thẻ FB-R4-PO-BA-032-05 chuyển **Done** khi #69 gộp.

- **Đúng phạm vi thẻ 05.**
  - Đã gỡ lời dặn "không bật 2 bước ở v1.0.x" và các đường v1.0.3 cho người mất cả điện thoại lẫn mã khôi phục. Ngoài dòng lịch sử, không còn sót chỗ nào trong 7 tệp; các chỗ "Ở v1.0.3" còn lại là việc khác (tiêu đề thư, yêu cầu hoàn thay thế, đơn HĐ).
  - Giữ câu "Sale nội bộ, CTV… nên bật".
  - Bảng vai ghi giá trị v1.0.4; dòng Lễ tân vẫn "Chưa" (thẻ 07).
  - "Lập:" chỉ còn bản hiện hành; lịch sử chuyển xuống bảng phiên bản (sổ tay 5.7, `00` mục 7) và mục **Lịch sử tệp** của `01`–`05`.
  - Hai thẻ SEC đi kèm (lễ tân trưởng không tự tắt 2 bước; câu in đậm "Desk chặn `info@` và `booking@`") chỉ đúng khi v1.0.4 đã chạy, nên để trong PR này là hợp lý.
- **Dễ đọc cho chủ đầu tư và lễ tân trưởng.**
  - Dòng đầu tệp ngắn.
  - Bước 7 của sổ tay 1.5 và bước 8 của `01` 1.9 viết theo từng vai, mỗi vai một ý. Phần lễ tân trưởng ghi rõ 3 việc rồi mới giao việc.
  - `02` 1.8 nói thẳng "không tự tắt 2 bước, cần tắt thì hỏi chủ đầu tư".
  - Bước A ở `03`/`04` thành tùy chọn, có cách đổi mật khẩu tạm trên app ngay bên dưới.
- **Khớp release notes #66 @ `77800288`.**
  - Khớp: lời dặn cũ hết hiệu lực, mặc định 2 bước theo vai, người trực kiểm căn trên app, Desk chặn `booking@`, các mục được trỏ (sổ tay 1.5, `01` 1.9 bước 8).
  - PO sẽ sửa #66 lúc cắt bản 06/11 18:00, cùng lượt cập nhật bảng "Đang chờ gộp":
    - Bước 1 của **Việc anh/chị làm sau khi lên**: sau khi anh/chị báo "v1.0.4 đã lên", đội gộp bản gỡ lời dặn cũ (sổ tay 1.14, bộ hướng dẫn 1.12) và dựng lại HTML; đào tạo theo bản đó.
    - Dòng **Ai bật 2 bước** và giới hạn "Lễ tân trưởng bắt buộc 2 bước": thêm "dặn người đó không tự tắt (Desk chưa chặn tới v1.0.5)".

### FB-R4-PO-BA-PR69-01
- Mức độ: Suggestion
- Vị trí: dòng "Lập:" của `01`–`05` ("Bộ hướng dẫn theo bộ phận, bản 1.11", "bản 1.12", "bản 1.5", "bản 1.7").
- Vấn đề: mỗi tệp ghi số bản riêng nhưng gọi là "Bộ hướng dẫn… bản x". Trong khi đó `00` ghi bộ hướng dẫn bản 1.12 và release notes cũng dùng số đó. Chủ đầu tư có thể tưởng tệp `05` (bản 1.7) là bộ cũ.
- Đề xuất sửa: ghi "Tệp này bản 1.11 (thuộc bộ hướng dẫn bản 1.12)". Làm ở lượt dọn chung, không chặn #69.
- Trạng thái: Closed (PO lượt 2 @ `b9e40a04`; BA sửa @ `b6d4ecb8`)

### FB-R4-PO-BA-PR69-02
- Mức độ: Suggestion
- Vị trí: các khung "Áp dụng từ v1.0.4" còn lại, ví dụ sổ tay 3.6, `02` 13.2a và 14.2. Ở các chỗ này, nội dung chính ngay trên đã nói cùng ý.
- Vấn đề: sau #69, có chỗ người đọc gặp cùng một ý hai lần, một lần ở nội dung chính và một lần trong khung.
- Đề xuất sửa: lượt dọn chung (chuyển các khung "Áp dụng từ v1.0.4" thành nội dung chính) làm ngay sau #69. PO xếp vào việc tài liệu của v1.0.5 và không chặn #69.
- Trạng thái: Deferred – PO chấp nhận ở lượt 2 @ `b9e40a04` (lượt dọn tài liệu v1.0.5, danh sách gộp ở thẻ PR69-03)

## Phản hồi BA (04/11/2026, thẻ PR69-01/02, PR #69 @ `b6d4ecb8`)

### FB-R4-PO-BA-PR69-01 – Fixed @ `b6d4ecb8`
- Dòng "Lập:" của `01`–`05` nay ghi "Tệp này bản X (thuộc bộ hướng dẫn bản 1.12)":
  - `01` 1.11, `02` 1.12, `03` 1.5, `04` 1.5, `05` 1.7.
- Ghi vào hàng 1.12 của `00` mục 7.

### FB-R4-PO-BA-PR69-02 – Deferred, để lượt dọn tài liệu v1.0.5 (đúng đề xuất PO)
- Không làm trong #69. Nếu chỉ gỡ khung ở sổ tay 3.6 và `02` 14.2, luồng kiểm phòng sẽ nửa cũ nửa mới.
- Danh sách chỗ phải sửa cùng lúc, cho lượt dọn:
  - `02` 13.2a: tiêu đề "(người trực hiện nay; từ v1.0.4 là dự phòng)" và khung;
  - `02` 14.2: khung, và dòng "Tới v1.0.4: ngày lễ tân trưởng nghỉ…";
  - `02` mục 2, bảng giờ trong ngày: hàng "Trước 11:00" và "Ngay khi khách trả";
  - `02` 18 (Bảng giờ): hàng "Trước 11:00";
  - `02` 20.3: bài tập 10;
  - `00` 2.1 và 5;
  - sổ tay 3.6: khung.
- Các khung "Áp dụng từ v1.0.4" khác cũng nên gỡ trong cùng lượt dọn: tờ v2 ở `02` 7.2, ngày kết thúc HĐ ở sổ tay 2.14a và `02` 17.5.

---

## Lượt 2 – PO đọc lại PR #69 (04/11/2026, `v104/ba-2fa-ungate` @ `b9e40a04`)

- Đã đọc: `gh pr diff 69` và PR body; riêng `8b2b0204..b6d4ecb8` (sửa thẻ lượt 1) và `b6d4ecb8..b9e40a04` (gộp nhánh #68 @ `ba841ea2`, DOM 07–10).
- Đã so: phần #69 thêm trên #68 (`git diff origin/v104/ba-docs-r4b origin/v104/ba-2fa-ungate`) với hai commit riêng `ee92b607..77cbb496` và `8b2b0204..b6d4ecb8`.

**Kết luận: ĐẠT.** Không có thẻ chặn. Giữ điều kiện gộp như lượt 1:
- gộp sau #68;
- chỉ gộp khi chủ đầu tư báo v1.0.4 đã lên production; sau đó UXD dựng lại HTML;
- lùi về v1.0.3 thì gỡ (revert) #69 cùng lúc (SEC lượt 1).

| ID | Trạng thái mới | Ghi chú PO |
|---|---|---|
| FB-R4-PO-BA-PR69-01 | **Closed** | Dòng **Lập:** của cả 5 tệp ghi "Tệp này bản X (thuộc bộ hướng dẫn bản 1.12)": `01` 1.11, `02` 1.12, `03` 1.5, `04` 1.5, `05` 1.7. Hàng 1.12 ở `00` mục 7 có ghi việc này. Không tệp nào còn gọi số bản riêng là "Bộ hướng dẫn… bản x" |
| FB-R4-PO-BA-PR69-02 | **Deferred – PO chấp nhận** | Lý do của BA đúng. Luồng kiểm phòng nằm ở 7 chỗ (`02` mục 2, 13.2a, 14.2, 18, 20.3; `00` 2.1 và 5; sổ tay 3.6). Chỉ gỡ 2 khung thì luồng nửa cũ nửa mới. PO đã đọc khung còn lại ở `02` 13.2a và 14.2: nội dung đúng với v1.0.4, chỉ lặp ý. Câu "Tới v1.0.4: …" ở 14.2 tự hết hạn. Người đọc không làm sai việc gì. Dọn ở v1.0.5, theo một danh sách chung (thẻ 03) |

### Số phiên bản sau khi gộp #68

| Tệp | #68 @ `ba841ea2` | #69 @ `b9e40a04` | Bảng lịch sử ở #69 |
|---|---|---|---|
| Sổ tay | 1.13 | **1.14** | Mục 5.7: hàng 1.14 ("Gộp sau 1.13 (PR #68)") đứng trên 1.13 |
| `00` (bộ hướng dẫn) | 1.11 | **1.12** | Mục 7: hàng 1.12 ("Gộp sau bản 1.11 (PR #68)") ngay sau 1.11 |
| `01` | 1.10 | 1.11 | **Lịch sử tệp**: bản 1.10 ở trên cùng |
| `02` | 1.11 | 1.12 | **Lịch sử tệp**: bản 1.11 ở trên cùng |
| `03`, `04` | 1.4 (#68 không đổi) | 1.5 | **Lịch sử tệp**: bản 1.4 ở trên cùng |
| `05` | 1.6 | 1.7 | **Lịch sử tệp**: bản 1.6 ở trên cùng |

- **Khớp.** Mỗi tệp đúng một bản trên #68.
- Ghi chú của #68 chuyển xuống **Lịch sử tệp** (`01` bản 1.10, `02` bản 1.11, `05` bản 1.6) trùng từng chữ với dòng **Lập:** của #68 @ `ba841ea2`. Có cả phần DOM lượt 3: căn `OC`/`OD`, đơn OTA gõ đủ giá, đơn Nội bộ ở thêm.
- Ngoài các dòng **Lập:** và **Lịch sử tệp**, phần #69 thêm trên #68 chỉ gồm hai commit riêng. Không mất dòng nào của #68.
- Không chỗ nào trong 7 tệp trỏ sai số bản. `00` hàng 1.8 nhắc "sổ tay 1.10", đúng với lịch sử.

### FB-R4-PO-BA-PR69-03
- Mức độ: Suggestion
- Vị trí:
  - Phần #68 vào #69 ở `b9e40a04`: sổ tay 2.5 (đơn Nội bộ), 2.10 (căn `OC`/`OD`, "dù Desk hiện vẫn cho bấm"), 2.12 bước 7, 5.6 (hàng BUG-R4-038); `02` 5.1, 7.4, 9.3 bước 7, 17.6.
  - `00` mục 1 ý 4: "Phần lớn sửa ở v1.0.3 (dự kiến 07/11)…". v1.0.3 đã lên 04/11.
- Vấn đề:
  - Danh sách dọn của BA (PR body #69) viết ở `b6d4ecb8`, trước khi gộp DOM 07–10. Các chỗ trên cũng là cách tạm "tới khi v1.0.4 lên".
  - DOM đã liệt kê phần #68 ở `DOM-on-v104-pr68-docs.md` lượt 4 ("Việc dọn sau khi v1.0.4 lên"). Vậy là có hai danh sách ở hai nơi.
- Vì sao quan trọng:
  - Lượt dọn v1.0.5 dễ sót một trong hai danh sách.
  - Câu "Từ v1.0.4: bấm Gia hạn như đơn khác" chỉ đúng khi bản sửa BUG-R4-038 có trong v1.0.4. Câu "Desk chặn từ v1.0.4" cũng vậy với BUG-R4-039.
- Đề xuất sửa:
  - Lượt dọn v1.0.5 dùng một danh sách: danh sách BA (PR body #69), danh sách DOM #68 lượt 4, và `00` mục 1 ý 4. PO thêm một dòng vào backlog mục 5.6b khi cắt bản.
  - Lúc cắt bản, nếu BUG-R4-038 hoặc 039 trượt khỏi v1.0.4: BA sửa câu tương ứng ở #68, rồi gộp lại vào #69 trước khi gộp #69 (cùng ý SEC lượt 2).
  - Không chặn #69.
- Trạng thái: Open

### Ghi chú cho lần PO sửa release notes #66 lúc cắt bản (06/11 18:00)

- Dòng **Hướng dẫn** ở đầu mục v1.0.4: `main` đã có #63 (sổ tay 1.12 / bộ hướng dẫn 1.10). Bản cắt có #68: **1.13 / 1.11**. Bản gỡ lời dặn cũ (#69): **1.14 / 1.12**, gộp sau khi lên. #69 không đưa vào bảng **Đang chờ gộp**.
- **Việc anh/chị làm sau khi lên**, bước 1: viết như đã ghi ở lượt 1 (đội gộp #69, dựng lại HTML, đào tạo theo 1.14 / 1.12). Nếu #68 trượt sang v1.0.5 thì #69 không gộp được như hiện tại: BA cắt lại từ `main`, số bản thành 1.13 / 1.11.
- Đoạn lùi về v1.0.3: thêm câu "Nếu đã gộp bản gỡ lời dặn cũ, đội gỡ bản đó cùng lúc; nhân viên dùng lại sổ tay 1.13 và bộ hướng dẫn 1.11."
- **Có trong bản này**: thêm BUG-R4-037 (#70), BUG-R4-038, BUG-R4-039 nếu kịp vào bản. Hiện #66 @ `77800288` chưa có ba lỗi này, mà SEC lượt 2 yêu cầu kiểm trước khi gộp #69. Hàng "Sổ tay 1.13, bộ hướng dẫn 1.11" thêm: đơn Nội bộ ở thêm, không nhận ngoại lệ vào căn có khách, đơn OTA gõ đủ giá mọi đêm.
- Giữ sửa ở dòng **Ai bật 2 bước** đã ghi ở lượt 1: "dặn người đó không tự tắt (Desk chưa chặn tới v1.0.5)".
