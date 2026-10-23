# SEC review – BE-B sửa lỗi tiền từ fuzz R3-Q30 (BUG-R3-002, 003, 004)

- Người review: SEC | Ngày: 24/10/2026 | Round 3 Sprint 1 – Bước Phản hồi & sửa (review PR tiền)
- Nhánh: `be-b/r3-fuzz-bugs-002-004`, **SHA `eee4377`**, nằm trên `main` `dabcb99`.
- Căn cứ:
  - `qa/bug-list.md` (BUG-R3-002 P0, BUG-R3-003 P0, BUG-R3-004 P1);
  - BR-433 (a)(d), BR-522 K11-06, BR-525;
  - SEC F8 (yêu cầu hoàn: người xin ≠ người duyệt, không tự áp);
  - review trước: `s1-SEC-on-BE-B.md` (FB-07, FB-09).
- Đã đọc diff `dabcb99..eee4377`:
  - `approval.service.ts`: định tuyến `debt_write_off`;
  - `folio-lines.service.ts`: tạo yêu cầu hoàn sau A32;
  - `folio.service.ts`: `limitBasisVnd` trả `null` khi không còn đêm sống; J15 chờ khi còn tiền dư;
  - test `fuzz/bug-r3-00{2,3,4}`, `r3-bug-002-credit-after-checkout`.
- Dữ liệu dùng để kiểm: toàn bộ là dữ liệu giả.

## Kết luận

| Hạng mục | Kết luận SEC |
|---|---|
| **Gộp** | **Gộp được** ở `eee4377`. **Không có Blocker, không có Major.** |
| BUG-R3-002 – ai tạo và ai duyệt yêu cầu hoàn tự sinh | Đạt. **Người tạo** là MGR/OWN vừa làm A32 (`requested_by` = người đó, lý do `overpayment`, số tiền đúng bằng tiền dư chưa có yêu cầu). Yêu cầu tạo trong cùng giao dịch, dưới khóa folio, qua `closeStayCredit`/`refundPlan` có sẵn. **Người duyệt** phải là MGR/OWN **khác** người tạo: yêu cầu hoàn không bao giờ tự áp (F8, kiểm ở `selfApplication`) và tự duyệt bị chặn bởi `SELF_APPROVAL_FORBIDDEN`. Người đặt nơi nhận tiền cũng không được duyệt (SEC-BE-37). J15 không đóng folio còn tiền dư; mục "Cần chú ý" mở với `dedupeKey`, nên không lặp. |
| MGR có tự hoàn tiền cho khách một mình được không? | **Không.** SEC dò trên DB thật: MGR void đêm phòng → yêu cầu hoàn 667.000 `pending`, `required_role = manager`, `self_applied = false`. Thử duyệt: chính MGR đó → 403 `SELF_APPROVAL_FORBIDDEN`; FDL → 403 `APPROVAL_LIMIT_EXCEEDED`; FD → 403; MGR thứ hai → 200. Bản sửa không mở đường mới: yêu cầu hoàn vẫn đi qua đúng các kiểm soát cũ. Rủi ro còn lại là có sẵn từ trước, xem FB-02. |
| BUG-R3-003 – FDL duyệt xóa nợ | Đạt. `debt_write_off` không bao giờ được định tuyến dưới `manager`. Σ ≤ hạn mức MGR (cơ sở bảo vệ) → `manager`; vượt, hoặc không có đêm → `owner`. Test fuzz: FDL duyệt → 403. |
| BUG-R3-004 – không còn đêm sống | Đạt. `limitBasisVnd` trả `null` khi không còn đêm sống; số chụp lúc B18 chỉ được dùng để **hạ** cơ sở, không thay cho cơ sở đã mất → chờ OWN, đúng BR-433 (a) "không có đêm nào → OWN". Ngưỡng ESC-026 của MGR dùng cùng hàm nên cũng về 0, tức luôn báo OWN, thiên về an toàn. |
| Hạn mức BR-433 sau bản sửa | Vẫn đúng cho xóa nợ: cơ sở = min(giá đêm sống đã bảo vệ, số chụp B18); không có đêm → OWN; không vai nào dưới MGR duyệt được. Còn lệch thứ bậc ở FOC thường khi cơ sở < 300.000 (FB-03). |

## Kiểm đã chạy
Chạy trên worktree tách riêng ở `eee4377`, Postgres 17 mới, migrate từ đầu; đã gỡ sau khi chạy.
1. `fuzz/bug-r3-002`, `bug-r3-003`, `bug-r3-004` (luôn chạy, không cần `FUZZ_KNOWN_BUGS`), `r3-bug-002-credit-after-checkout`, `r3-be83-esc026`, `r3-bb07-limit-basis`: **29/29 đạt**.
2. Test dò tạm của SEC (không commit, đã xóa): thứ tự duyệt yêu cầu hoàn tự sinh, kết quả như bảng trên.

## Thẻ feedback

### FB-R3-SEC-FZ-01
- Mức độ: Minor
- Vị trí: `approval.service.ts`: luật mới chỉ nằm ở `submit` (định tuyến lúc tạo). `approve` vẫn tin `required_role` đã lưu.
- Vấn đề:
  - Yêu cầu `debt_write_off` tạo **trước** bản sửa và đang `pending` với `required_role = front_desk_lead` vẫn duyệt được bởi FDL.
  - Ngoài ra, mọi đường tạo yêu cầu sau này mà quên luật này cũng sẽ lọt.
- Vì sao quan trọng: đây là phòng thủ nhiều lớp cho chính lỗi P0 vừa sửa. Staging hiện chỉ có dữ liệu giả, nhưng mọi môi trường đã chạy bản cũ đều có thể còn dòng như vậy.
- Đề xuất sửa:
  - trong `approve`/`decide`: nếu `reason_code = debt_write_off` và vai người duyệt dưới `manager` thì 403 `APPROVAL_LIMIT_EXCEEDED`, bất kể `required_role` đã lưu;
  - thêm test: chèn tay một dòng `pending` có `required_role = front_desk_lead`, FDL duyệt → 403.
- Trạng thái: Open

### FB-R3-SEC-FZ-02
- Mức độ: Minor (rủi ro đã có từ trước, bản sửa làm nó lộ rõ hơn; chuyển DOM quyết, Sprint 2)
- Vị trí: A32 giảm trên folio `settled` khi O = 0 (`folio-lines.service.ts`) → yêu cầu hoàn tự sinh (BUG-R3-002); quyền duyệt yêu cầu hoàn = mọi MGR/OWN khác người xin, không có hạn mức số tiền.
- Vấn đề:
  - Sau trả phòng, MGR giảm hoặc void được một khoản **khách đã trả**, không giới hạn số tiền và không tính vào Σ ESC-026. Lần giảm đó sinh tiền dư, nay thành ngay một yêu cầu hoàn.
  - Chỉ cần thêm **một** MGR khác duyệt là tiền ra khỏi quỹ. Nơi nhận do người xin hoặc FD đặt.
  - Như vậy một cặp MGR có thể hoàn tiền phòng đã thu mà OWN không bắt buộc phải duyệt. Với OTTIMO hiện chỉ có một MGR thì OWN phải duyệt, nên rủi ro trước mắt thấp.
- Vì sao quan trọng: hoàn tiền sau trả phòng là đường tiền ra. BR-433 giới hạn MGR miễn thu (FOC) theo giá một đêm, nhưng "giảm khoản đã thu rồi hoàn" lại không có giới hạn tương ứng.
- Đề xuất sửa (DOM chọn):
  - yêu cầu hoàn sinh từ A32 sau trả phòng mà số tiền > cơ sở hạn mức MGR (`limitBasisVnd`) → `required_role = owner`;
  - và/hoặc tính phần A32 giảm sau trả phòng của vai dưới OWN vào Σ ESC-026, để OWN được báo;
  - ghi rõ trong `reason_note` của yêu cầu hoàn tự sinh là "từ A32 trên dòng …", để người duyệt thấy nguồn gốc.
- Trạng thái: Open

### FB-R3-SEC-FZ-03
- Mức độ: Suggestion (DOM xác nhận quy tắc)
- Vị trí: `requiredRoleFor` / `roleLimit` (định tuyến FOC thường).
- Vấn đề:
  - Khi cơ sở (giá một đêm đã bảo vệ) < hạn mức lần của FDL (300.000), một FOC thường vượt hạn mức MGR nhưng ≤ 300.000 sẽ được định tuyến về **FDL**. Tức là FDL duyệt được khoản mà MGR không tự áp được, thứ bậc bị đảo.
  - BUG-R3-003 chỉ sửa cho `debt_write_off`.
- Vì sao quan trọng: cơ sở thấp xảy ra được (đơn giá thấp, hoặc A31 hạ giá trong lúc ở, BB07-6). Lúc đó kiểm soát dựa trên vai không còn đơn điệu.
- Đề xuất sửa: hạn mức lần của FDL tính theo min(300.000, cơ sở). Hoặc luật chung: định tuyến không bao giờ chọn vai có hạng thấp hơn vai mà người xin đã không đủ hạn mức. Thêm ca fuzz.
- Trạng thái: Open

## Ca thêm cho fuzz R3-Q30
1. I4 mở rộng: sau mọi A32 giảm trên folio `settled`, tiền dư chưa có yêu cầu = 0; J15 không bao giờ đóng folio còn tiền dư.
2. Yêu cầu hoàn tự sinh: `requested_by` = người làm A32; mọi lần duyệt bởi chính người đó, FDL hoặc FD → 403.
3. `debt_write_off`: không bao giờ có `required_role` dưới `manager`; không bao giờ được duyệt bởi vai dưới `manager` (kể cả dòng cũ – FB-01).
4. Đã void hết đêm: cơ sở = null → mọi yêu cầu xóa nợ chờ OWN.

## Điểm làm tốt
1. Sửa đúng chỗ: tận dụng `closeStayCredit`/`refundPlan` có sẵn, nên giữ nguyên toàn bộ kiểm soát hoàn tiền cũ (F8, SEC-BE-37), không viết đường hoàn tiền mới.
2. J15 có lưới an toàn: không bao giờ đóng folio còn tiền của khách, kể cả khi tiền dư đến từ đường khác A32.
3. BUG-R3-004 sửa theo hướng an toàn: không còn đêm sống thì cơ sở = null, không rơi về số chụp cũ.
