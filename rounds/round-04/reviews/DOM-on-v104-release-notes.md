# DOM review – PR #66 release notes v1.0.4

- Người review: DOM | Round 4 – v1.0.4 – Bước **Review** | 04/11/2026
- Tác giả: PO. Bản đọc: `git diff origin/main...origin/v104/po-release-notes` tại head `9580f180`. PR sửa một tệp `product/docs/release-notes.md`: mục v1.0.4 mới (dòng 16–113) và mục v1.0.3 đổi sang "Đã phát hành" (dòng 117–122). Số dòng trong file này là số dòng của tệp trên nhánh PR.
- Đối chiếu với `origin/main` @ `58183764`. Trên main đã có #34, #35, #37, #38–#59 và #60; còn mở #61–#65.
  - Quyết định: decision-log các dòng 04/11 (gộp v1.0.4, phát hành v1.0.3, INV đồng ý trước, B.1/B.2, P4-11, P4-13).
  - Kế hoạch và runbook: `rounds/round-04/plan-v1.0.4.md` mục lịch; `rounds/round-04/outputs/OPS/v1.0.4-release-runbook.md` mục 1.3.
  - Báo cáo: BE-B `v104-be-holds.md`, BE-D `v1.0.4-be-d-refund-dest.md`, `v104-be-identity.md`, FE-A `v1.0.4-fe-users-2fa.md` và `v1.0.4-fe-lease-ed.md`, FE-B `v1.0.4-fe-holds.md`, FE `v1.0.4-p4-34-param-cancel.md`, ARC `v1.0.4-notice-version-allowlist.md`.
  - Review: `rounds/round-04/reviews/ARC-on-v104-p4-32.md`, `UXD-on-v104-p4-32.md`, `DOM-on-v104-ba-docs.md` (B.1, B.2).
  - Mã đã mở trên main:
    - `mobile/src/app/session.ts` (vai được vào app nhân viên);
    - `identity/internal/mfa.service.ts` `resetByOwner`;
    - `admin-web/.../EarlyDepartureDialog.tsx`, `stay.service.ts:1408`;
    - migration 0093;
    - `strings-vi.json`;
    - sổ tay và bộ hướng dẫn trên main so với nhánh #63.

## Phán quyết: **ĐẠT CÓ ĐIỀU KIỆN**

Phần lớn các dòng mô tả đúng cái Desk làm trên main (bảng ở mục 1). Không có Blocker. Không có số hoa hồng hay thưởng, dữ liệu khách, IP máy chủ hay khóa. Tài liệu viết tiếng Việt, không emoji.

Có **5 Major**, đều chỉ là sửa chữ:
- **Sửa trước khi gộp #66:** 01–04.
  - 01, 02: đoạn giới hạn P4-32 có câu chỉ dẫn đúng hướng ("hỏi quản lý hoặc chủ đầu tư"). Nhưng điều kiện để lễ tân biết lúc nào phải hỏi thì lễ tân không nhìn thấy được, và câu "sửa ở v1.0.5" hứa rộng hơn hướng ARC đã chốt.
  - 03: sổ tay 1.12 và bộ hướng dẫn 1.10 được ghi như đã có, thực tế mới nằm ở #63, chưa gộp.
  - 04: "Hộp Thông báo" chỉ có trên app nhân viên. Sale và CTV được kê là người nhận tin, nhưng không có chỗ nào để xem.
- **Sửa muộn nhất lúc cắt bản 06/11 18:00:** 05. Đây là giới hạn tiền của Trả sớm trước 06:00, có từ v1.0.2. DOM chốt luật ở mục 3.

Ngoài ra có 3 Minor còn hiệu lực (06 là #60 đã gộp, cần chuyển bảng; 08 đã rút, xem thẻ 08) và 3 Suggestion. Không có ESC mới.

---

## 1. Đã đối chiếu – khớp main

| Dòng | Nội dung | Căn cứ |
|---|---|---|
| 8–9, 18 | v1.0.3 đã phát hành 04/11. Lịch v1.0.4: cắt bản 06/11 18:00 → QA 07/11 → QC 08/11 sáng → production 08/11 chiều, chậm nhất 10/11. INV đã đồng ý trước việc gộp, staging và production | `plan-v1.0.4.md` dòng 34–39; decision-log 04/11 "INV – đồng ý trước toàn bộ" |
| 18 | #35, #37 và 22 PR #38–#59 đã gộp, mỗi PR qua review chéo và CI | `gh pr list` (cả 22 đều MERGED ngày 04/11); decision-log "Gộp v1.0.4 vào main" + #58 |
| 119 | Mục v1.0.3: tag `v1.0.3` trên `da6d6f3d`, production chạy từ 07:12 (P6 00:12:28Z). INV chọn "Phát hành ngay". Lượt kiểm K1–K9 chạy đủ | decision-log 04/11 "INV – Phát hành ngay", "ORC – v1.0.3 lên production" |
| 28 | Giữ chỗ có cọc mà quá hạn: không tự hủy. Lễ tân trở lên thu nốt cọc tới khi nhận phòng. **Giờ nhận tiền** ghi lùi được, không ghi sau bây giờ. Giữ chỗ chưa cọc chỉ xác nhận khi tiền về trước hạn. Sale, CTV bị chặn sau hạn | BR-303 (1); BE-B mục 1, 1b (HOLDS-01); FE-B mục 1; `deposit.received_at_help` |
| 29 | **Chấp nhận cọc thiếu**: chỉ chủ đầu tư và quản lý, lý do từ 3 ký tự | BR-303 (2); FE-B BUG-R3-043 |
| 32 | Hủy giữ chỗ có cọc: không phí, hoàn 100 %, cần quản lý duyệt. Lý do **Khác (ghi rõ)** hủy được. Giữ chỗ có giảm giá hoặc FOC chờ duyệt cũng tự hủy. Bỏ nút link check-in ở đơn giữ chỗ | BR-303 (3), BR-308; `cancel.refund_preview`; BE-B WA-04; FE-B 046, 047 |
| 38–40 | Đặt lại 2 bước: chỉ chủ đầu tư làm, không đặt lại cho chính mình. Desk đăng xuất người đó trên mọi máy, xóa mã khôi phục cũ, giữ mật khẩu. Thư báo tới người đó và mọi chủ đầu tư. Menu **Khác…**, cột Email, câu báo khi chỉ có ô mật khẩu | `mfa.service.ts` `resetByOwner` (`revokeAll`, `email(..., { owners: true })`); FE-A mục 1 |
| 42 | Desk chặn `booking@` và `info+…@`. Mỗi email đổi tối đa 5 lần trong 24 giờ. Xóa email không bị chặn | BE identity EM-09, SENT-02, V104-01 |
| 47 | Yêu cầu hoàn thay thế mang theo nơi nhận. Không mang khi có hai nơi nhận hoặc hai người nhập. Người nhập nơi nhận không tự duyệt được | BE-D mục 1, test (b), (d) |
| 50–53 | Trả sớm HĐ đã gia hạn chọn đúng nhánh. Không hủy được dòng giá đầu tiên của căn mới. **Hủy lịch** chỉ hiện trên dòng chưa hiệu lực. Vai bảo trì có danh sách căn | FE-A P4-31 (khớp FB-R4-DOM-FE-A-01); BE-C P4-11 `first_price`; FE P4-34; P4-33 |
| 59–60 | Tham số `privacy_notice_version` chỉ nhận `privacy-2026-10-v2`. Check-in online chưa mở lại | ARC allowlist mục 2.3; runbook mục 2 |
| 82 | 0092–0095 chỉ thêm, quay lui không cần lùi DB | runbook 1.3 |
| 95 | LP-v2: khách chưa thấy gì, vì `public_show_prices=false` và `LANDING_LOCALES=en,vi` | decision-log 04/11 "ORC chốt 2.1 ý 4 = (a)" |
| 90 | Giới hạn P4-32: câu chỉ dẫn là "hỏi quản lý hoặc chủ đầu tư", **không** chỉ sang Nhật ký tiền, **không** hứa ngày. Khớp chữ U5 trên màn hình ("Hỏi quản lý trước khi báo khách.") | ARC A1, thẻ P432-01 ý 3; UXD U5 bổ sung 04/11 |

Hai PR #61 và #62 chỉ đụng CI và test e2e, khách và nhân viên không thấy gì khác. Vì vậy không cần đưa vào release notes (giả định của DOM).

---

## 2. Thẻ feedback

### FB-R4-DOM-PO-RN-01
- Mức độ: Major (sửa trước khi gộp #66)
- Vị trí: `product/docs/release-notes.md` dòng 90, mục **Giới hạn đã biết**, ý 1 (giới hạn P4-32).
- Vấn đề: câu chỉ dẫn đúng hướng, nhưng lễ tân không dùng được vì 3 lý do.
  1. **Điều kiện không nhìn thấy được.** Câu ghi: "Khách có Trả sớm chưa được duyệt: hỏi…". Lễ tân không thấy yêu cầu của người khác, nên cũng không biết yêu cầu đó "chưa được duyệt". Cái lễ tân thấy được là: mình không phải người bấm Trả sớm, hoặc Desk không hiện khoản hoàn nào.
  2. **"Đang chờ" chưa rõ.** Theo ARC A1, FD và FDL **có** thấy yêu cầu hoàn đã duyệt mà chưa chi (hàng chờ chi), kể cả do người khác tạo. Hai vai này chỉ không thấy yêu cầu **còn chờ duyệt** do người khác tạo. Đọc "đang chờ", lễ tân trưởng dễ nghĩ cả khoản đã duyệt cũng không hiện.
  3. **Phạm vi hẹp hơn giới hạn thật.** Ở tab **Nhật ký tiền → Hoàn tiền**, giới hạn áp cho **mọi** yêu cầu hoàn: hủy giữ chỗ có cọc (Desk vừa ghi "Sẽ tạo yêu cầu hoàn … – cần quản lý duyệt"), tiền khách trả thừa, Trả sớm. Câu chỉ dẫn chỉ nói tới Trả sớm.
- Vì sao quan trọng: ví dụ khách gọi hỏi tiền hoàn của giữ chỗ đã hủy, mà ca trước hủy. Lễ tân trưởng mở Hoàn tiền, không thấy gì, rồi báo khách "không có khoản hoàn" hoặc báo sai số. Khách khiếu nại, chủ đầu tư phải gọi lại khách. Luật tách nhiệm BR-522 vẫn đúng. Nhưng lễ tân cần một dấu hiệu nhìn thấy được để biết lúc nào phải hỏi.
- Đề xuất sửa: thay ý 1 bằng đoạn dưới. Giữ "hỏi quản lý hoặc chủ đầu tư", không thêm "xem Nhật ký tiền".
  > - **Lễ tân và lễ tân trưởng không thấy yêu cầu hoàn còn chờ duyệt do người khác tạo** (Trả sớm, hủy giữ chỗ có cọc, tiền khách trả thừa), cả ở dòng "Đang chờ hoàn" của trang Trả phòng (nếu #64 vào bản này) lẫn ở **Nhật ký tiền → Hoàn tiền**. Yêu cầu đã được quản lý duyệt thì vẫn thấy như thường. Đơn có Trả sớm hoặc hủy có cọc mà anh/chị không phải người bấm, hoặc khách hỏi tiền hoàn mà Desk không hiện: **hỏi quản lý hoặc chủ đầu tư** trước khi báo khách số tiền. Không báo khách "không có khoản hoàn". (Câu v1.0.5: xem thẻ 02.)
- Trạng thái: Closed (PO Done @ `27bf18cd`; DOM đọc lại câu trên nhánh 04/11 tối)

### FB-R4-DOM-PO-RN-02
- Mức độ: Major (sửa trước khi gộp #66)
- Vị trí: dòng 90, câu cuối "Sửa ở v1.0.5, chưa có ngày."; dòng 102 (bảng **Chưa có**) "Lễ tân thấy mọi yêu cầu hoàn đang chờ của đơn lúc trả phòng, kể cả do người khác tạo".
- Vấn đề: câu "Sửa ở v1.0.5" đứng ngay sau hai chỗ (trang Trả phòng **và** Nhật ký tiền → Hoàn tiền). Người đọc sẽ hiểu là từ v1.0.5 lễ tân thấy yêu cầu chờ duyệt của người khác ở cả hai chỗ. ARC đã chốt khác (`ARC-on-v104-p4-32.md` mục 3 A1, A2):
  - tab **Hoàn tiền** giữ nguyên phạm vi. Đây là tách nhiệm có chủ ý (S23, BR-522), không phải lỗi;
  - v1.0.5 theo phương án (b): máy chủ trả **tổng số đang chờ hoàn theo lý do**, hiện ở trang Trả phòng và trên folio. Desk không cho xem từng yêu cầu (người tạo, ghi chú, nơi nhận).

  Dòng 102 "thấy mọi yêu cầu hoàn" cũng hứa rộng hơn.

  Về nghiệp vụ, DOM đồng ý với ARC. Lễ tân chỉ cần **số tiền** để trả lời khách. Lễ tân không cần và không nên xem nơi nhận tiền hay ghi chú của yêu cầu người khác nhập.
- Vì sao quan trọng: nếu release notes hứa sai, chủ đầu tư chờ một quyền mà đội sẽ không làm. Lên v1.0.5 không thấy, chủ đầu tư sẽ báo thành lỗi. Hoặc đội bị đẩy mở quyền đọc trái luật tách nhiệm.
- Đề xuất sửa:
  - Dòng 90, câu cuối: "v1.0.5 (chưa có ngày): trang Trả phòng và folio hiện **tổng số đang chờ hoàn** của đơn, kể cả yêu cầu do người khác tạo. Tab **Hoàn tiền** giữ phạm vi như hiện nay; đây là phân quyền có chủ ý."
  - Dòng 102: "Trang Trả phòng và folio hiện tổng số đang chờ hoàn của đơn, kể cả yêu cầu do người khác tạo | **v1.0.5**".
- Trạng thái: Closed (PO Done @ `27bf18cd`; DOM đọc lại câu trên nhánh 04/11 tối)

### FB-R4-DOM-PO-RN-03
- Mức độ: Major (sửa trước khi gộp #66)
- Vị trí: dòng 21 ("Hướng dẫn: sổ tay bản nội dung 1.12; bộ hướng dẫn theo bộ phận bản 1.10"); dòng 38, cuối ô ("sổ tay 1.5, `01` 1.9"); dòng 75, bước 1 ("nhân viên làm theo sổ tay 1.12 và bộ hướng dẫn 1.10"). So với dòng 71.
- Vấn đề: main hiện có **sổ tay bản nội dung 1.11** (`user-manual-v1.0.md` dòng 5) và **bộ hướng dẫn bản 1.9** (`guides/00-index.md` dòng 4). Bản 1.12 và 1.10 chỉ có ở #63 (`v104/ba-2fa-reset-manual`), PR này còn mở. Trên main, sổ tay không có chữ "Đặt lại xác thực 2 bước" nào. Ở dòng 71, chính tài liệu đã xếp #63 vào bảng "Đang chờ gộp", còn dòng 21 và 75 thì ghi như đã có. Đây là ghi điều chưa gộp như thể đã có.
- Vì sao quan trọng: nếu #63 không kịp cắt bản, v1.0.4 lên với nút **Đặt lại xác thực 2 bước**, nhưng sổ tay 1.11 vẫn dạy cách cũ: khóa tài khoản rồi tạo tài khoản mới. Chủ đầu tư hoặc lễ tân trưởng đi tìm bản 1.12 sẽ không thấy. Với một thao tác bảo mật phải làm đúng thủ tục (gặp tận mặt, ghi lý do), thiếu hướng dẫn là rủi ro thật.
- Đề xuất sửa:
  - Dòng 21: "sổ tay bản nội dung 1.11, bộ hướng dẫn bản 1.9 (lên **1.12 / 1.10** nếu #63 gộp trước khi cắt bản) – …".
  - Dòng 75: viết cùng điều kiện như dòng 21.
  - Dòng 38: "… (hướng dẫn từng bước ở sổ tay 1.12 mục 1.5 khi #63 vào bản này; nếu không vào, chủ đầu tư nhắn Điều phối viên trước khi làm)".
  - Lúc cắt bản, PO bỏ điều kiện theo kết quả gộp, như đã định cho bảng "Đang chờ gộp".
- Trạng thái: Closed (PO Done @ `27bf18cd`; DOM đọc lại câu trên nhánh 04/11 tối)

### FB-R4-DOM-PO-RN-04
- Mức độ: Major (sửa trước khi gộp #66)
- Vị trí: dòng 31, dòng **Báo giữ chỗ quá hạn**.
- Vấn đề:
  1. **Desk không có hộp Thông báo.** FE-B ghi rõ: "Desk không có hộp thư thông báo (chỉ app nhân viên có `NotificationsPage`)" (`v1.0.4-fe-holds.md` mục 1, dòng cuối). Mã `admin-web` không đọc `/v1/me/notifications`. Ba loại tin này chỉ hiện ở **app nhân viên**.
  2. **Sale, CTV được kê là người nhận nhưng không xem được tin.** App nhân viên chỉ mở cho buồng phòng, bảo trì, và lễ tân trở lên (`mobile/src/app/session.ts`: "Sales/agents have nothing here"). Dòng 31 kê "người tạo, người chốt" là người nhận. Hai người này thường là sale hoặc CTV. Người đọc sẽ hiểu là sale/CTV được báo khi giữ chỗ của mình quá hạn hoặc tự hủy. Thực tế tin được ghi vào hộp thư của họ, nhưng họ không có màn nào để xem.
  3. **Người nhận dự phòng chưa khớp mã.** Mã gửi tin "tự hủy" cho **lễ tân và lễ tân trưởng**, không chỉ "lễ tân". Lượt dự phòng chỉ chạy khi không còn người tạo hay người chốt nào đang hoạt động. Nó không chạy khi người tạo là một sale/CTV vẫn đang hoạt động (BE-B mục 3).
- Vì sao quan trọng: BR-303 ghi "báo sale". Release notes làm chủ đầu tư và lễ tân trưởng tin Desk đã báo, nên họ thôi nhắn CTV. CTV không báo khách là giữ chỗ đã hủy. Khách đến quầy với một đơn đã hủy, trong khi căn có thể đã bán cho người khác. Với cơ sở 10 căn, đây là một tình huống "ác mộng" có thật.
- Đề xuất sửa:
  - Đổi "Hộp **Thông báo**" thành "Hộp **Thông báo trên app nhân viên**".
  - Sửa "không có thì lễ tân" thành "không còn ai thì lễ tân và lễ tân trưởng".
  - Thêm câu: "**Sale, CTV chỉ dùng Desk nên không nhận các tin này.** Tiếp tục mở **Đơn của tôi** đầu ngày và xử lý khi Desk nhắc **Giữ chỗ sắp hết hạn** (`05` mục 2) như hiện nay."
  - Thêm câu về Desk: "Trên Desk, lễ tân trở lên thấy mục giữ chỗ quá hạn ở **Cần chú ý**; quản lý và chủ đầu tư thấy thêm mục 'còn chờ cọc sau 12:00 ngày đến – quản lý quyết'."
  - Việc cho backlog (PO xếp, không chặn v1.0.4): BR-303 "báo sale" chưa có đường tới sale và CTV. Đề xuất v1.0.5 một trong hai cách: hộp Thông báo trên Desk, hoặc dòng "Giữ chỗ đã tự hủy" trong **Đơn của tôi**.
- Trạng thái: Closed (PO Done @ `27bf18cd`; DOM đọc lại câu trên nhánh 04/11 tối)

### FB-R4-DOM-PO-RN-05
- Mức độ: Major (muộn nhất lúc cắt bản 06/11 18:00; PO thêm cùng lượt sửa bảng "Đang chờ gộp")
- Vị trí: mục **Giới hạn đã biết** (dòng 88–95), hiện thiếu. Liên quan thẻ ARC FB-R4-ARC-DOM-B16-01 và FB-R4-ARC-FE-P432-04.
- Vấn đề: hộp **Trả sớm** đặt sẵn **Ngày rời mới** = ngày nghiệp vụ (`EarlyDepartureDialog.tsx` dòng 78–95: `minDate = today` lấy từ `useBusinessDay`, rồi `useState(minDate)`). Từ 00:00 tới 05:59, ngày nghiệp vụ vẫn là hôm qua (BR-010). Vì vậy giá trị đặt sẵn coi đêm khách vừa ngủ là một đêm bỏ. Máy chủ vẫn nhận (`stay.service.ts:1408` chỉ chặn `nd < ctx.today`). Lỗi có từ v1.0.2, v1.0.4 không đổi, nhưng release notes chưa ghi.
- Ví dụ số: đơn Trực tiếp ở 01/11–05/11 (4 đêm), có phụ thu người. Khách báo lúc 04:30 ngày 03/11 rằng rời ngay để kịp chuyến bay sớm. Lúc đó ngày nghiệp vụ là 02/11.
  - **Để nguyên 02/11:** Desk coi 3 đêm (02, 03, 04/11) là bỏ. Số ngày báo trước = 02/11 − 02/11 = 0 ngày, nên không hoàn 50 %. Tiền phòng của cả 3 đêm thành "phí trả phòng sớm": đây là doanh thu khác, nên đêm 02/11 không tính vào lấp đầy và không tính hoa hồng CTV. Phụ thu người của cả 3 đêm hoàn 100 %.
  - **Đúng là chọn 03/11:** đêm 02/11 là đêm đã ở. Còn 2 đêm bỏ (03, 04/11). Số ngày báo trước = 03/11 − 02/11 = 1 ngày (BR-011), nên hoàn 50 % tiền phòng 2 đêm và 100 % phụ thu người 2 đêm.
  - Sai cả hai chiều: khách mất phần hoàn 50 % của mình, OTTIMO hoàn thừa phụ thu 1 đêm, báo cáo lấp đầy và hoa hồng lệch.
- Vì sao quan trọng: đây là sai tiền với khách. Ở Đà Lạt, khách rời trước 06:00 để ra sân bay Liên Khương không hiếm. Ca đêm chỉ có một người trực, thường bấm theo giá trị đặt sẵn.
- Đề xuất sửa: thêm vào **Giới hạn đã biết**:
  > - **Khách rời trước 06:00:** ô **Ngày rời mới** của **Trả sớm** đặt sẵn ngày hôm trước (Desk chưa sang ngày mới). Khách rời trong khoảng 00:00–05:59: đổi **Ngày rời mới** thành **ngày lịch hôm nay** rồi mới bấm **Xem trước**. Khách rời đúng ngày đi ghi trên đơn: không dùng Trả sớm. Cả hai trường hợp, nút **Trả phòng** chỉ hiện **từ 06:00**: lúc đó mở khung đơn → **Trả phòng**, ghi **Giờ trả phòng thực tế** đúng giờ khách đi. Sửa ở v1.0.5.

  BA thêm cùng câu vào sổ tay 2.14a, bước 2. BE xếp v1.0.5: máy chủ trả 409 kèm chỉ dẫn (theo thẻ ARC B16-01). Luật DOM chốt ở mục 3.
  - Đính chính (DOM, 04/11 tối, sau khi đọc mã cho PR #68): bản đầu của đoạn trên viết "dùng **Trả phòng**" mà không nói giờ. Trên main, khung đơn chỉ có nút **Trả phòng** khi ngày nghiệp vụ trùng ngày đi (`allowed-actions.ts:115`). Trang **Hôm nay** cũng chỉ liệt kê khách đi của ngày nghiệp vụ. Vì vậy trước 06:00 không có nút nào dẫn tới Trả phòng. Xem `DOM-on-v104-pr68-docs.md` thẻ 01.
- Trạng thái: Reopened, hạ xuống **Minor** (phần giới hạn Done @ `27bf18cd`; dòng 100 còn thiếu câu "Trả phòng chỉ hiện từ 06:00", PO sửa lúc cắt bản – xem DOM lượt 2)

### FB-R4-DOM-PO-RN-06
- Mức độ: Minor (ORC nêu; nên làm cùng lượt sửa thẻ 01–04)
- Vị trí: dòng 18 ("22 PR của v1.0.4 (#38–#59)"); dòng 62–68 (bảng **Đang chờ gộp**, hàng #60).
- Vấn đề: #60 (BUG-R2-216, 219, hộp **Giữ chỗ** sau khi tạo) đã gộp vào main lúc 04/11 19:30 (merge `58183764`), nhưng vẫn nằm trong bảng "Đang chờ gộp". Câu "Không kịp thì sang v1.0.5" vì vậy sai với #60. Mô tả hàng #60 thì đúng với PR (CTV và ca chưa có QR vẫn có khối tóm tắt).
- Đề xuất sửa:
  - Chuyển hàng #60 vào bảng **Giữ chỗ và cọc**, cột Nguồn ghi "BUG-R2-216, 219".
  - Dòng 18 đổi thành "23 PR của v1.0.4 (#38–#60)".
  - Bảng chờ gộp còn #63, #64, #65.
  - (Gợi ý) Dòng 18 có thể nhắc #34 (LP-v2, có migration 0092) đã gộp 04/11 cho đủ, vì dòng 82 và 95 có nói tới nó.
- Trạng thái: Closed (PO Done @ `27bf18cd`; DOM đọc lại câu trên nhánh 04/11 tối)

### FB-R4-DOM-PO-RN-07
- Mức độ: Minor
- Vị trí: dòng 84, câu "Trong lúc lùi: …".
- Vấn đề: danh sách hệ quả khi lùi về v1.0.3 còn thiếu 4 điểm mà ca trực sẽ gặp:
  1. Người trực có vai quản lý, nên bắt buộc 2 bước. Lùi bản thì người trực **không vào được app nhân viên**, nên kiểm căn quay về cách cũ: kiểm bằng mắt rồi bấm **Làm xong** (`02` mục 13.2a), ghi sổ giao ca.
  2. Tin giữ chỗ quá hạn và mục **Cần chú ý** mới không còn. Lượt rà 3 mốc (bước 5) thành cách duy nhất.
  3. Trả sớm của đơn HĐ đã gia hạn lại hiện khung "Trả trước hạn hợp đồng thuê tháng" (lỗi đã biết của v1.0.3). Làm theo khung lỗi ở sổ tay 2.14a: ký quỹ theo nhánh đã thu đủ, hỏi quản lý.
  4. Dòng giá đầu tiên của căn mới lại hủy được (BUG-R4-015). 0094 chỉ chặn dòng có ngày đã tới, không chặn dòng ở tương lai.
- Đề xuất sửa: thêm 4 ý trên vào câu "Trong lúc lùi", mỗi ý một vế ngắn kèm việc phải làm. Điểm 4 ghi: "không hủy dòng giá của căn mới trong lúc lùi".
- Trạng thái: Closed (PO Done @ `27bf18cd`; DOM đọc lại câu trên nhánh 04/11 tối)

### FB-R4-DOM-PO-RN-08 – **RÚT LẠI** (DOM tự đính chính 04/11 tối)
- Lý do rút: đọc lại mã (`stay.service.ts` dòng 457 và 1485–1487). Gia hạn đơn HĐ nhập tay bằng B13 chỉ dời ngày đi của chính đơn và đồng bộ "đêm HĐ", không bao giờ tạo dòng tiền trên folio. Vì vậy, ở nhánh BR-428, phần gia hạn có số tiền = 0: Desk không tính hoàn, không ghi phí. Câu dòng 86 "cách tính tiền không đổi" là **đúng**, PO không cần sửa. Nội dung gốc giữ dưới đây để tra.
- Mức độ (gốc): Minor
- Vị trí: dòng 86, câu "Cách tính tiền phòng, cọc, folio không đổi so với v1.0.3, trừ các dòng giữ chỗ và yêu cầu hoàn ở bảng trên."
- Vấn đề: câu này bỏ sót một thay đổi về tiền. Khách của đơn HĐ đã gia hạn mà rời trong phần gia hạn:
  - ở v1.0.3, Desk đi nhánh BR-313 (không tính tiền, chỉ hiện khung);
  - ở v1.0.4, Desk đi nhánh BR-428: tự tính hoàn 50 % các đêm gia hạn chưa ở, ghi phí trả phòng sớm và tạo yêu cầu hoàn.

  Thay đổi này đúng luật (FB-R4-DOM-FE-A-01), nhưng là thay đổi tiền.
- Đề xuất sửa: "… trừ các dòng giữ chỗ, yêu cầu hoàn và **Trả sớm của đơn HĐ đã gia hạn** ở bảng trên."
- Trạng thái: Closed (DOM rút, PO đúng – xem DOM lượt 2)

### FB-R4-DOM-PO-RN-09
- Mức độ: Minor
- Vị trí: dòng 41, dòng **Ai bật 2 bước**.
- Vấn đề:
  1. Một ô gộp hai việc khác nhau: ai bật 2 bước (B.1) và người trực kiểm căn trên app (B.2).
  2. "Tự kiểm rồi bấm **Làm xong**" dễ hiểu nhầm là "tự kiểm căn mình dọn". Ý đúng là cách cũ 13.2a: kiểm bằng mắt rồi chỉ bấm **Làm xong**.
  3. Thiếu hai ý của DOM B.2:
     - "khoảng 1–2 phút mỗi căn": ORC phải báo INV điều này;
     - B.2 ý 4: nhận khách vào căn đã kiểm. Căn còn chờ kiểm lúc khách tới thì kiểm trên app ngay, hoặc làm như nhận phòng khi buồng chưa sẵn sàng.
  4. "Anh/chị đổi được (báo đội)" chỉ đúng với lễ tân trưởng, buồng phòng, bảo trì. Với chủ đầu tư và quản lý, 2 bước do mã ép.
- Đề xuất sửa:
  - Tách thành hai hàng.
  - Hàng "Ai bật 2 bước": chủ đầu tư, quản lý bắt buộc, Desk ép; lễ tân trưởng, buồng phòng, bảo trì, sale, CTV theo mặc định của đội, anh/chị đổi được (báo đội).
  - Hàng mới "**Người trực kiểm căn trên app nhân viên**": "Từ bản này kiểm căn trên app, khoảng 1–2 phút mỗi căn. Giữ mốc 11:00 và 14:00. Nhận khách vào căn đã kiểm. App không vào được thì kiểm bằng mắt rồi bấm **Làm xong** như cũ, ghi sổ giao ca."
- Trạng thái: Closed (PO Done @ `27bf18cd`; DOM đọc lại câu trên nhánh 04/11 tối)

### FB-R4-DOM-PO-RN-10
- Mức độ: Suggestion
- Vị trí: dòng 42 (giới hạn đổi email).
- Vấn đề: giới hạn 5 lần trong 24 giờ đếm theo **người được đổi**, gộp cả những lần chủ đầu tư đổi hộ. Lần xóa cũng được đếm. Xóa lúc nào cũng làm được, nhưng đặt lại ngay sau đó có thể phải chờ (BE identity EM-09, V104-01). Câu "Mỗi người đổi email tối đa 5 lần" dễ hiểu là chỉ đếm lần người đó tự đổi.
- Đề xuất: "Email của mỗi người đổi được tối đa 5 lần trong 24 giờ, kể cả khi chủ đầu tư đổi hộ. Xóa email lúc nào cũng làm được, nhưng lần xóa vẫn được tính."
- Trạng thái: Closed (PO Done @ `27bf18cd`; DOM đọc lại câu trên nhánh 04/11 tối)

### FB-R4-DOM-PO-RN-11
- Mức độ: Suggestion
- Vị trí: dòng 21 câu "Phần giữ chỗ quá hạn (sổ tay 2.4) viết lại sau khi QA kiểm…"; dòng 79 (bước 5).
- Vấn đề: bước 5 dặn "Giữ lượt rà 3 mốc … (sổ tay 2.4)". Nhưng khung 2.4 trên main vẫn dạy cách tạm của v1.0.3, ví dụ bước 3: "**Không** bấm **Xác nhận đã nhận cọc** (Desk từ chối)". Lễ tân trưởng mở 2.4 để rà thì dễ làm theo cả cách cũ, tức là hủy rồi tạo đơn mới thay vì thu nốt cọc. Bước 5 cũng chưa nói khi nào thì bỏ lượt rà.
- Đề xuất: "**Giữ** lượt rà 3 mốc giữ chỗ mỗi ngày (cách rà ở sổ tay 2.4). Gặp giữ chỗ có cọc quá hạn thì xử lý theo bảng **Giữ chỗ và cọc** ở trên, không theo các bước 'Desk từ chối' của 2.4. Đội báo bỏ lượt rà khi tin giữ chỗ quá hạn đã chạy đúng trên production."
- Trạng thái: Closed (PO Done @ `27bf18cd`; DOM đọc lại câu trên nhánh 04/11 tối)

### FB-R4-DOM-PO-RN-12
- Mức độ: Suggestion
- Vị trí: dòng 82; dòng 76 (bước 2); dòng 52.
- Vấn đề và đề xuất:
  - Dòng 82: "chỉ đi tiến" và "khóa chỉ-thêm" là chữ kỹ thuật. Đổi thành "chỉ thêm, không sửa hay xóa dữ liệu cũ" và "chặn chặt hơn việc sửa, xóa bản thông báo quyền riêng tư đã đăng".
  - Dòng 82: "0093 (3 loại tin giữ chỗ quá hạn)" chưa khớp migration. 0093 chỉ thêm **2** loại (`hold_overdue_with_deposit`, `hold_overdue_cap`). Loại "tự hủy" có từ trước; v1.0.4 chỉ đưa nó vào hộp Thông báo. Đổi thành "0093 (2 loại tin mới về giữ chỗ quá hạn)".
  - Dòng 76: production dự kiến lên chiều 08/11, nên khung 09:00–11:00 rơi vào **sáng hôm sau**. Ghi thẳng "sáng hôm sau ngày lên" để chủ đầu tư xếp lịch cùng người trực.
  - Dòng 52: dòng hẹn tham số áp dụng từ **06:00** ngày đó (decision-log 04/11, BA). Có thể ghi "trước 06:00 của ngày áp dụng vẫn hủy được" cho ca đêm.
- Trạng thái: Closed (PO Done @ `27bf18cd`; DOM đọc lại câu trên nhánh 04/11 tối)

---

## 3. Ghi chú DOM cho ORC – luật Trả sớm trước 06:00 (trả lời FB-R4-ARC-DOM-B16-01)

DOM chốt theo quyền nghiệp vụ. Đây là chuẩn ngành, không đổi giá hay chính sách với khách, nên không cần ESC. Đề nghị ORC ghi vào decision-log:

| Ngày | Round | Quyết định | Người quyết | Lý do |
|---|---|---|---|---|
| 2026-11-04 | 4 | **Trả sớm trong khoảng 00:00–05:59** (BR-010, BR-428): đêm của ngày nghiệp vụ là đêm khách **đã ở**. **Ngày rời mới** của Trả sớm tối thiểu = ngày lịch (= ngày nghiệp vụ + 1). Khách rời đúng ngày đi ghi trên đơn thì dùng Trả phòng (B18, phụ thu 0), không dùng Trả sớm. Trên Desk v1.0.4, nút Trả phòng chỉ hiện từ 06:00: lúc đó làm Trả phòng, ghi Giờ trả phòng thực tế đúng giờ khách đi. Số ngày báo trước vẫn đếm theo BR-011 (ví dụ 04:30 ngày 03/11 rời 03/11 = báo trước 1 ngày). v1.0.4: ghi giới hạn trong release notes và sổ tay 2.14a. v1.0.5: máy chủ trả 409 kèm chỉ dẫn, Desk đặt sẵn ngày lịch | DOM | FB-R4-ARC-DOM-B16-01; FB-R4-DOM-PO-RN-05 |

---

## 4. Điểm làm tốt nên giữ

1. Mục v1.0.4 tách rõ ba phần: "Có trong bản này" (đã trên main), "Đang chờ gộp" (kèm số PR) và "Chưa có". Đoạn giới hạn P4-32 có điều kiện "(nếu #64 vào bản này)". Đây là cách viết đúng cho người đọc không rành kỹ thuật, và lúc cắt bản chỉ phải sửa một chỗ.
2. Phần giữ chỗ và cọc khớp BR-303 và mã từng ý: không tự hủy giữ chỗ có cọc; hủy thì không phí và hoàn 100 %; sale và CTV chuyển sang lễ tân sau hạn; chỉ chủ đầu tư và quản lý chấp nhận cọc thiếu; giờ nhận tiền không ghi sau bây giờ. Người làm quầy đọc là làm được.
3. Câu chỉ dẫn P4-32 đi đúng hướng ARC và UXD: hỏi quản lý hoặc chủ đầu tư, không chỉ sang Nhật ký tiền, không hứa ngày. Mục "Việc anh/chị làm sau khi lên" ngắn, có thứ tự, nêu đúng người làm.

---

## Phản hồi PO (04/11/2026)

Sửa trên `v104/po-release-notes`: `f28ee517` (thẻ 01–12, thêm #67), rồi `27bf18cd` (trỏ đúng mục #63, #68; sửa câu tiền ở thẻ 08). Head hiện tại: `27bf18cd`.

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R4-DOM-PO-RN-01 | Done | Giới hạn P4-32 viết theo câu DOM: yêu cầu hoàn **còn chờ duyệt** do người khác tạo (Trả sớm, hủy giữ chỗ có cọc, tiền khách trả thừa); đã duyệt thì vẫn thấy; hỏi quản lý hoặc chủ đầu tư; không báo khách "không có khoản hoàn". Có trỏ sổ tay 2.14, 2.14a; `02` 11.1, 11.5; `01` 7.3 (#68) |
| FB-R4-DOM-PO-RN-02 | Done | v1.0.5 (chưa có ngày): chỉ hiện **tổng số đang chờ hoàn** ở Trả phòng và folio. Tab Hoàn tiền giữ phạm vi, là phân quyền có chủ ý. Bảng **Chưa có** đổi theo |
| FB-R4-DOM-PO-RN-03 | Done | Dòng Hướng dẫn: 1.11 / 1.9 đang có trên main; 1.12 / 1.10 khi #63 gộp; 1.13 / 1.11 khi #68 gộp (thứ tự #65 → #63 → #68). Ô 2 bước và bước 1 có điều kiện #63; #63 trượt thì việc đặt lại 2 bước nhắn ORC trước |
| FB-R4-DOM-PO-RN-04 | Done | Dòng **Báo giữ chỗ quá hạn**: Desk hiện ở **Cần chú ý** và **Hôm nay**; tin trong hộp Thông báo chỉ có trên app nhân viên (3 trường hợp); người nhận dự phòng là lễ tân và lễ tân trưởng; sale, CTV chỉ dùng Desk nên xem **Đơn của tôi** / **Giữ chỗ sắp hết hạn** (`05` mục 2). Việc còn lại (BR-303 "báo sale" chưa có đường tới sale, CTV): PO xếp **v1.0.5**, UXD + ARC chọn giữa hộp thông báo trên Desk và một dòng ở **Đơn của tôi**. Nhờ ORC ghi vào backlog v1.0.5 |
| FB-R4-DOM-PO-RN-05 | Done (giới hạn); **phạm vi: giữ đề xuất DOM** | Thêm giới hạn "Trả sớm trước 06:00", áp dụng ngay, sửa ở v1.0.5; trỏ sổ tay 2.14a bước 2, `02` 11.5 (#68 đã có câu này). Lý do không kéo sửa vào v1.0.4 ở dưới |
| FB-R4-DOM-PO-RN-06 | Done | "23 PR của v1.0.4 (#38–#60)", có ghi #34, #35, #37. #60 chuyển sang bảng giữ chỗ (dòng **Hộp Giữ chỗ sau khi tạo**), bỏ khỏi "Đang chờ gộp" |
| FB-R4-DOM-PO-RN-07 | Done | Hệ quả quay lui tách thành 6 ý (giữ chỗ có cọc bị khóa lại; app mất bước nhập mã; không có nút Đặt lại 2 bước; Trả sớm đơn HĐ hiện lại khung HĐ; dòng giá đầu của căn mới hủy được; giới hạn đổi email tắt), ý Trả sớm đơn HĐ thêm "lấy ngày kết thúc HĐ ở bảng kỳ thu" |
| FB-R4-DOM-PO-RN-08 | Done, **câu khác đề xuất** | Lượt 2 PO dùng câu DOM ("tự tính hoàn 50 %…"). Lượt 3 PO đổi lại sau khi đọc mã trên main @ `58183764`: đêm của đơn HĐ nhập tay là `lease_allocation`, **không bao giờ lên folio**, kể cả các ngày thêm bằng **Gia hạn** (`lease-nights.ts` dòng 10–12; `stay.service.ts` B13 với `external_contract` chỉ gọi `syncLeaseNights`, không ghi đêm có giá). Vì vậy B16 trong phần gia hạn đi nhánh BR-428 nhưng số tiền các đêm bỏ = 0, không có phí, không tạo yêu cầu hoàn. Thay đổi thật so với v1.0.3 là **không còn khung ký quỹ** trả trước hạn HĐ; ký quỹ và tiền các ngày gia hạn vẫn làm ngoài app. Câu này khớp #68 (sổ tay 2.14a, `02` 17.5). Nhờ DOM xác nhận; nếu DOM muốn Desk tự tính hoàn cho phần gia hạn của đơn HĐ thì đó là việc mới (đơn HĐ phải có dòng tiền cho ngày gia hạn), PO xếp sau v1.0.5 |
| FB-R4-DOM-PO-RN-09 | Done | Tách 2 dòng: **Ai bật 2 bước** và **Người trực kiểm căn trên app nhân viên** (1–2 phút mỗi căn, giữ mốc 11:00 và 14:00, nhận khách vào căn đã kiểm, dự phòng `02` 13.2a) |
| FB-R4-DOM-PO-RN-10 | Done | Giới hạn đổi email: tối đa 5 lần trong 24 giờ, kể cả khi chủ đầu tư đổi hộ; xóa lúc nào cũng làm được nhưng lần xóa vẫn được tính |
| FB-R4-DOM-PO-RN-11 | Done | Bước 5: **Giữ** lượt rà 3 mốc theo sổ tay 2.4; giữ chỗ có cọc quá hạn làm theo bảng **Giữ chỗ và cọc**; đội báo bỏ lượt rà khi tin chạy đúng trên production |
| FB-R4-DOM-PO-RN-12 | Done | "chỉ thêm, không sửa hay xóa dữ liệu cũ"; 0093 = 2 loại tin mới; bước 2 "sớm nhất là sáng hôm sau ngày lên"; dòng hẹn tham số áp dụng từ 06:00, trước 06:00 vẫn hủy được |

### Quyết định phạm vi RN-05 (PO)

**Giữ đề xuất DOM:** v1.0.4 chỉ ghi giới hạn (release notes, sổ tay 2.14a bước 2 qua #68). v1.0.5 sửa: máy chủ trả 409 kèm chỉ dẫn, Desk đặt sẵn ngày lịch. PO xếp việc này lên đầu backlog v1.0.5. Lý do không kéo vào v1.0.4:
1. Ca hiếm (khách trả sớm trong 00:00–05:59), cách làm tạm chỉ là đổi một ô, và bước **Xem trước** hiện số đêm bỏ nên lễ tân thấy ngay khi sai.
2. Lỗi có từ v1.0.2, bản đang chạy cũng có. Cách làm tạm áp dụng từ hôm nay, không chờ bản mới.
3. Còn khoảng 1,5 ngày tới lúc cắt bản. FE-A giữ `EarlyDepartureDialog` và đang làm #67 (P1 minibar), xung đột #64, #65. Thêm một sửa ở luồng tiền B16 cần thêm một vòng DOM/ARC/SEC/QA và test đồng hồ trên staging. Việc đó có thể làm trễ bản đang sửa lỗi P1 giữ chỗ và minibar.
4. Đây là chuẩn ngành, không đổi giá hay chính sách với khách, nên không cần ESC.

### Nhờ ORC
- Ghi luật DOM mục 3 (Trả sớm 00:00–05:59) vào decision-log.
- Ghi vào backlog v1.0.5: sửa RN-05 (409 + ngày lịch mặc định) và đường báo sale, CTV của BR-303 (RN-04).
- Lúc cắt bản PO sửa bảng "Đang chờ gộp" và số bản sổ tay theo PR đã gộp.

---

## DOM lượt 2 (04/11 tối, sau phản hồi PO @ `27bf18cd`)

- **RN-08: Closed. PO đúng.** DOM xác nhận đêm của đơn HĐ nhập tay là `lease_allocation`, không lên folio, kể cả các ngày thêm bằng Gia hạn. Vì vậy B16 trong phần gia hạn có số tiền = 0. Câu của PO ở lượt 3 đúng. DOM không đề nghị Desk tự tính tiền cho phần gia hạn của đơn HĐ.
- **RN-05: mở lại, Minor** (không chặn gộp; PO sửa cùng lượt cắt bản). Dòng 100 cần thêm "nút **Trả phòng** chỉ hiện từ 06:00; lúc đó ghi **Giờ trả phòng thực tế** đúng giờ khách đi". Lý do: trên main, khung đơn và trang Hôm nay không có nút Trả phòng trong khoảng 00:00–05:59. Chi tiết ở `DOM-on-v104-pr68-docs.md` thẻ 01.
- Thẻ 01–04, 06, 07, 09–12: **Closed.** DOM đã đọc lại toàn mục v1.0.4 ở `27bf18cd` (dòng 16–125), khớp bảng phản hồi của PO:
  - 01, 02: giới hạn P4-32 đúng câu DOM, đúng hướng ARC A1/A2 (v1.0.5 chỉ hiện tổng số đang chờ hoàn; tab Hoàn tiền giữ phạm vi). Chỉ dẫn là "hỏi quản lý hoặc chủ đầu tư", không trỏ Nhật ký tiền. Mục được trỏ (`01` 7.3, `02` 11.1, 11.5, sổ tay 2.14, 2.14a) đều có trong #68.
  - 03: số bản sổ tay có điều kiện #63/#68; ô **Đặt lại xác thực 2 bước** và bước 1 có nhánh "#63 không vào".
  - 04: Desk = **Cần chú ý** + khối **Giữ chỗ chờ cọc (n)** ở Hôm nay (có trên main, `v104-holds-feb.test.tsx`); hộp Thông báo chỉ trên app nhân viên; dự phòng là lễ tân và lễ tân trưởng; sale, CTV xem **Đơn của tôi**.
  - 06, 07, 09–12: đúng như PO ghi. Quay lui có đủ 6 ý; ý Trả sớm đơn HĐ trỏ khung v1.0.3 ở sổ tay 2.14a. #68 giữ khối "Giới hạn tới v1.0.3 (đơn HĐ)" nên lúc lùi bản vẫn có chỗ để làm theo.

### Kết luận lượt 2 (DOM, 04/11 tối) – PR #66 @ `27bf18cd`

**ĐẠT CÓ ĐIỀU KIỆN. Gộp được ngay.** Không còn Blocker hay Major.

- **RN-08 đóng.** Câu của PO ở dòng **Trả sớm – đơn HĐ thuê tháng đã gia hạn** và ở ý cuối mục **Thay đổi cấu trúc dữ liệu** đúng nghiệp vụ.
  - Đúng với mã. Desk giữ ngày kết thúc HĐ, nên `earlyDepartureRuleOf` chọn BR-313 chỉ khi khách rời trước ngày đó. Phần gia hạn không có dòng tiền vì đêm HĐ là `lease_allocation`, không lên folio. Vì vậy khung ký quỹ không còn, và Desk không tự tính hoàn hay phí cho phần gia hạn.
  - Khớp #68 gần như từng chữ: sổ tay 2.14a dòng 1229, `02` 17.5.
  - Chữ "như cũ" có chỗ dựa: cách tính ngoài app (các ngày gia hạn chưa ở như đơn ngắn ngày Trực tiếp, quản lý duyệt) nằm ở sổ tay 2.14a dòng 1224.
- **Điều kiện (Minor, không chặn gộp; PO sửa lúc cắt bản 06/11 18:00, cùng lúc BA sửa thẻ FB-R4-DOM-BA-PR68-01 ở #68):** dòng 100, ý **Trả sớm trước 06:00**. Câu đề xuất thay cho "Khách rời đúng ngày đi ghi trên đơn: dùng **Trả phòng**, không dùng Trả sớm.":
  > Khách rời đúng ngày đi ghi trên đơn: không dùng Trả sớm. Cả hai trường hợp, nút **Trả phòng** chỉ hiện **từ 06:00**: lúc đó mở khung đơn → **Trả phòng**, ghi **Giờ trả phòng thực tế** đúng giờ khách đi.

  Lý do: câu hiện tại bảo người trực đêm "làm ngay từ hôm nay", mà trước 06:00 không có nút Trả phòng (`allowed-actions.ts:115`). Nếu người trực quay sang Trả sớm và để nguyên ngày đặt sẵn, đêm vừa ở bị tính là đêm bỏ. Đó chính là lỗi tiền mà giới hạn này muốn tránh.
- **Gợi ý (không bắt buộc):** nếu ORC và PO nhận bug P3 "Desk không có lối vào Trả phòng trong 00:00–05:59" (`DOM-on-v104-pr68-docs.md`, Ghi chú cho ORC), thêm một dòng vào bảng **Chưa có**: "Nút **Trả phòng** từ 00:00 cho khách đi đúng ngày | **v1.0.5**".

