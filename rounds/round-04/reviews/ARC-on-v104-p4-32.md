# ARC review – P4-32 `v104/fe-checkout` (PR #64)

- Người review: ARC | Round 4 – v1.0.4 – Bước **Review** | 04/11/2026
- Đối tượng: `git diff origin/main...558c2b01`. Mã ở commit `71be2519`. Các tệp:
  - `CheckOutPage.tsx`
  - test mới `v104-checkout-feb.test.tsx`
  - 3 ca cũ: 1 trong `checkout.test.tsx`, 2 trong `s4-144-fea.test.tsx`
- Nhánh nay ở `94ac2ade`. UXD thêm khóa `checkout.pending_refund_unavailable` (U5), chỉ đổi tệp chữ, không đổi mã. ARC chỉ ghi nhận commit này, không review.
- Đọc kèm:
  - báo cáo `rounds/round-04/outputs/FE/v1.0.4-p4-32-fe-checkout.md`;
  - máy chủ ở cùng commit:
    - `approval.service.ts` `list`;
    - `stay.service.ts` `earlyDeparture`;
    - `checkout.service.ts` `checkOut`/`decide`/`primaryFor`;
    - `folio.service.ts` `openRefundVnd`;
  - OpenAPI `listApprovalRequests`, `CheckoutSummary`;
  - mock `mocks/stay.ts` (approval-requests).
- CI lúc review:
  - đã xanh: `API contract`, `OpenAPI lint`, `gitleaks`, `confidential paths`, `no test endpoints`;
  - còn **chờ**: `format · lint · audit · test · build`, `infra scripts`, `landing`.

## Phán quyết: **ĐẠT CÓ ĐK**

Điều kiện gộp:
1. CI xanh.
2. QA kiểm che 6 ảnh `v1.0.4-p4-32-*.png` (quy tắc ảnh của repo công khai).
3. Sửa thẻ **FB-R4-ARC-FE-P432-04**: khi đọc tóm tắt lỗi vào ngày trước ngày đi, trang không được chỉ sang Trả sớm. Thẻ nhỏ.

Điều kiện trước QA lượt 2 (07/11), không chặn gộp: thẻ **01**. QA sửa tiền điều kiện của CO-01 và thêm ca giới hạn; UXD/PO sửa câu trong sổ tay.

Ghi chú: PR không đổi hợp đồng và không đổi máy chủ, đúng phạm vi P4-32.

## 1. Kiểm kỹ thuật

| Điểm | Kết quả |
|---|---|
| Thứ tự hook (React) | Lệnh `return` sớm mới nằm ở dòng 465, sau mọi hook của `CheckOutPage`. Hook cuối của trang ở dòng 386. `edRefund` (`useResource`) được khai trước. Từ dòng 424 tới hết component (1763) không còn hook nào, nên đổi nhánh giữa các lần render không gây lỗi "Rendered more hooks". Đạt |
| Điều kiện "trước ngày đi" so với máy chủ | Máy chủ `decide` (và `amountDueForQr`) từ chối B18 khi `effectiveStay.departureDate !== ctx.today && !postMidnight`. Desk dùng `stayDepartureDate ?? departureDate` so với `useBusinessDay`, cộng `CheckoutSummary.postMidnightWindow`. Hai bên cùng một luật. Đạt |
| Đơn được chọn để lọc | B16 `assertPrimary`, nên yêu cầu nằm trên đơn chính (`targetCode = row.code`). B18 cũng `primaryFor`, nên trang Trả phòng luôn mở trên đơn chính. Lọc theo `r.code` là đủ. Đạt |
| Công thức số chờ hoàn | Σ `max(0, amountVnd − refundedVnd)`, với trạng thái `pending`/`escalated`/`approved`. Trùng hệt `FolioService.openRefundVnd` của máy chủ, chỉ hẹp hơn ở chỗ thêm `reasonCode = early_departure`. Đạt |
| Nhánh 409 `INVALID_TRANSITION` | Đọc lại đơn. Nếu đã gia hạn, trang chuyển sang câu chỉ dẫn. Có ca test 8. Đạt |
| Gọi API | Bước ①/② không gọi `listApprovals`. Gọi ở bước ③, và gọi lại ở màn Kết quả sau B18. Đọc lỗi thì không chặn **Hoàn tất**. Đạt |
| Test | 8 ca mới. Trên mã cũ 4/8 đỏ, đúng các ca của lỗi. 3 ca cũ chỉ đổi đồng hồ sang ngày đi, giữ nguyên điều kiện kiểm. Các ca này trước đây dựa vào chính BUG-R3-024, nên sửa là đúng. FE-A vẫn cần xem phần sửa trong `s4-144-fea.test.tsx`. Đạt |

## 2. Giả định G1–G3 của FE

| Giả định | ARC | Ghi chú |
|---|---|---|
| G1. Không cắt số theo `creditVnd`; Desk không tự tính | **Đồng ý** | Khớp máy chủ: `openRefundVnd` cũng không cắt. Bước duyệt mới so với tiền dư (0.3.8 bổ sung 6: 409 `superseded`). |
| G2. "Trước ngày đi" = ngày nghiệp vụ < ngày đi của lượt (trừ cửa sổ sau nửa đêm), chỉ áp với `in_house` | **Đồng ý**, kèm thẻ 04 | Đúng luật máy chủ. Đơn **quá** ngày đi (máy chủ cũng 409) ngoài phạm vi. ARC đồng ý tách lỗi riêng; DOM quyết hướng (gia hạn hay chỉ dẫn). |
| G3. Đọc lỗi thì im lặng | **Đồng ý cho kỹ thuật** | UXD đã chọn U5: hiện `checkout.pending_refund_unavailable` (`94ac2ade`, thẻ FB-R4-UXD-FE-P432-03). FE nối khóa này theo thẻ của UXD. Lỗi vẫn không chặn **Hoàn tất**. Câu chữ: xem thẻ 01 ý 3. |

## 3. Quyết định A1 và A2 (câu hỏi FE)

### A1. Phạm vi `listApprovalRequests` với FD/FDL

**Xác nhận hiện trạng.** FE mô tả đúng mã (`approval.service.ts` `list`):
- FD thấy yêu cầu mình tạo, cộng mọi `refund` `approved` chưa chi đủ (hàng chờ chi).
- FDL thấy thêm yêu cầu mình duyệt và yêu cầu có `required_role = front_desk_lead`.
- Phần (b) của x-scope 0.3.7 D1 ("refund `pending`/`approved` **chưa có nơi nhận**") chưa được cài.

Hợp đồng ghi rõ yêu cầu `refund` `pending` của người khác **không** vào phạm vi FD/FDL (OWN/MGR quyết). Đây là quyết định tách nhiệm có chủ ý (S23, BR-522), không phải sơ suất.

Ngay cả khi cài đủ (b), yêu cầu Trả sớm **đã nhập nơi nhận** mà còn chờ duyệt vẫn không hiện với FD/FDL. Ví dụ của FE (lễ tân nhập nơi nhận ngay sau B16) rơi đúng vào ca này.

**Chốt v1.0.4: chấp nhận với giới hạn.** Không sửa máy chủ trước bản cắt.
- Lý do 1: mở rộng phạm vi `pending` cho FD/FDL đi ngược hợp đồng và luật tách nhiệm. Làm vội trước bản cắt 06/11 thì rủi ro hơn lợi ích.
- Lý do 2: dòng mới chỉ để báo, không chặn **Hoàn tất**.
- Lý do 3: trường hợp thường gặp vẫn đúng: cùng người làm B16 và B18, hoặc MGR đã duyệt (khi đó yêu cầu vào hàng chờ chi mà FD/FDL thấy).
- Lý do 4: B16 tạo **một** yêu cầu cho mỗi lượt. Vì vậy giới hạn thường biểu hiện là **thiếu dòng**, ít khi là **số nhỏ hơn**.
- Việc kèm theo: xem thẻ 01.

**Hướng v1.0.5: chọn (b).** Thêm một trường chỉ đọc do máy chủ tính. Không chọn (a).
- (a) đòi cho FD/FDL đọc yêu cầu `pending` của người khác, gồm tên người tạo, ghi chú và nơi nhận dạng che. Đó là mở rộng quyền đọc chỉ để lấy một con số.
- (b) chỉ trả **số tiền theo lý do**, không lộ gì thêm. Máy chủ đã có sẵn câu truy vấn (`FolioService.openRefundVnd` và `openRefunds`), nên chỉ cần gom theo `reason_code`.
- Hình dạng đề xuất cho hợp đồng 0.3.13 (ARC chốt khi soạn): `openRefunds: { reasonCode, openVnd }[]`, với `openVnd = Σ (amount − refunded)`, trạng thái `pending`/`escalated`/`approved`, gồm mọi đơn của folio.
  - Đặt ở `CheckoutSummary`, cho bước ③.
  - Đặt cả ở `Folio.totals`, vì màn Kết quả đọc folio đã chốt, lúc này không còn tóm tắt Trả phòng.
  - Quyền giống quyền đọc folio.
- Desk bỏ `listApprovals` khỏi H16. Khung đơn (U4/BA-025-07) cũng dùng được trường này.
- Phần (b) của x-scope D1 (A43, nhập nơi nhận) là việc riêng của BE-B, độc lập với P4-32, giữ trong backlog.

### A2. Desk đọc cả hàng chờ để lấy một đơn

**Chốt: không thêm tham số lọc ở v1.0.5.**
- Theo A1 (b), H16 không còn đọc hàng chờ, nên lý do thêm `reservationCode`/`type` biến mất.
- Tab **Nhật ký tiền → Hoàn tiền** đọc cả hàng chờ là đúng mục đích của nó.
- Với 10 căn, tải hiện tại nhẹ. Chấp nhận cho v1.0.4.
- Nếu sau này có nơi khác cần lọc theo đơn, mở lại câu hỏi, kèm số đo.

## 4. Thẻ feedback

### FB-R4-ARC-FE-P432-01
- Mức độ: Minor. Làm trước QA lượt 2 07/11; không chặn gộp.
- Vị trí:
  - `rounds/round-04/qa/v1.0.4-test-cases.md` TC-V104-CO-01;
  - sổ tay hoặc release notes v1.0.4 (mục Trả phòng);
  - khóa `checkout.pending_refund_unavailable`.
- Vấn đề: giới hạn A1 chưa được ghi ở đâu. QA có thể ghi nhầm thành lỗi. Lễ tân thì không biết vì sao dòng không hiện.
- Đề xuất:
  1. QA sửa tiền điều kiện của CO-01: chạy bằng chính tài khoản đã làm B16, hoặc `qa.mgr`, hoặc sau khi MGR duyệt.
  2. QA thêm ca giới hạn CO-01b: FD khác người làm B16, yêu cầu còn `pending`. Kết quả mong đợi: **không** có dòng; ghi "giới hạn đã biết v1.0.4 – ARC A1".
  3. Sổ tay ghi rõ: dòng có thể không hiện khi yêu cầu hoàn từ Trả sớm do người khác tạo và còn chờ duyệt; khi đó **hỏi quản lý (MGR/OWN)**.
     - **Không** ghi "xem ở Nhật ký tiền → Hoàn tiền" cho ca này, vì tab đó dùng cùng phạm vi, nên FD cũng không thấy.
     - Khóa U5 vẫn đúng cho ca **đọc lỗi**, nên giữ nguyên.
- Trạng thái: Open (QA, UXD/PO)

### FB-R4-ARC-FE-P432-02
- Mức độ: Minor. Việc của v1.0.5.
- Vị trí:
  - `docs/api/openapi.yaml` 0.3.13: `CheckoutSummary`, `Folio.totals`;
  - BE: `folio.service.ts`;
  - FE: `CheckOutPage.tsx`.
- Việc:
  - ARC soạn trường `openRefunds[]` theo A1 (b).
  - BE trả trường này bằng câu `openRefunds` gom theo lý do.
  - FE đổi nguồn của dòng sang trường mới và bỏ `listApprovals` khỏi H16.
  - Thẻ này đóng luôn A2.
- Trạng thái: Open (ARC → BE → FE)

### FB-R4-ARC-FE-P432-03
- Mức độ: Suggestion. Làm cùng thẻ 02.
- Vị trí: `mocks/stay.ts` `GET …/approval-requests`.
- Vấn đề: mock rộng hơn máy chủ. `lead` thấy mọi thứ, FD thấy mọi `refund` ở mọi trạng thái. Vì thế test đơn vị không bao giờ thấy giới hạn A1 (G4 của FE).
- Đề xuất:
  - cho mock theo đúng phạm vi máy chủ: FD = của mình + `refund` `approved` chưa chi đủ; FDL thêm `approver_id = tôi` và `required_role = front_desk_lead`;
  - thêm một ca test cho CO-01b;
  - chạy lại các test của tab Hoàn tiền sau khi đổi.
- Trạng thái: Open (FE)

### FB-R4-ARC-FE-P432-04
- Mức độ: Minor. **Điều kiện gộp.**
- Vị trí: `CheckOutPage.tsx` dòng 465–470: `waiting = addDays(today, 1) === stayDeparture && !s && sum.state.status !== 'error'`.
- Vấn đề:
  - Vào hôm trước ngày đi, nếu đọc `CheckoutSummary` **lỗi**, trang hiện câu "Hôm nay chưa tới ngày đi… dùng Trả sớm".
  - Nhưng lúc đó có thể đang ở **cửa sổ sau nửa đêm** (ví dụ 03:00 ngày đi), khi B18 hợp lệ.
  - Máy chủ `earlyDeparture` không chặn cửa sổ này. `newDepartureDate` bằng ngày nghiệp vụ (= ngày đi − 1) được chấp nhận. Nghĩa là lễ tân làm theo câu chỉ dẫn có thể bỏ đêm khách vừa ngủ và tạo yêu cầu hoàn sai. Đây là chỉ dẫn sai dẫn tới một thao tác tiền.
- Đề xuất: khi `addDays(today, 1) === stayDeparture` mà tóm tắt lỗi, hiện khối lỗi kèm **Thử lại** (mẫu lỗi sẵn có của trang), **không** hiện câu chỉ dẫn. Chỉ hiện câu chỉ dẫn khi:
  - tóm tắt đọc được và `postMidnightWindow = false`; hoặc
  - còn từ hai ngày trở lên mới tới ngày đi (như hiện tại).

  Thêm một ca test: hôm trước ngày đi, tóm tắt 500, thì không có câu chỉ dẫn và có nút Thử lại.
- Trạng thái: Open (FE-B)

### FB-R4-ARC-DOM-B16-01 (chuyển DOM/BE, ngoài PR này)
- Mức độ: Minor. Cần DOM chốt luật trước khi BE sửa.
- Vị trí: `stay.service.ts` `earlyDeparture`, điều kiện `nd < ctx.today || nd >= eff.departureDate || nd <= row.arrival_date`.
- Vấn đề: trong cửa sổ sau nửa đêm (ngày nghiệp vụ = ngày đi − 1, ngày lịch = ngày đi), B16 vẫn nhận `newDepartureDate` = ngày nghiệp vụ. Vì vậy có thể bỏ và hoàn tiền đêm khách đang dùng. Lỗi này có từ trước, không do P4-32 gây ra; thẻ 04 chỉ làm nó dễ xảy ra hơn khi đọc tóm tắt lỗi.
- Đề xuất: DOM xác nhận luật "trong cửa sổ sau nửa đêm, dùng B18 (phụ thu 0), không dùng B16 cho ngày đi − 1". Nếu đúng, BE trả 409 kèm chỉ dẫn sang B18 (v1.0.5). QA thêm ca kiểm.
- Trạng thái: Open (DOM → BE)

## 5. Điểm làm tốt
- Đối chiếu đúng phạm vi máy chủ và tự nêu khoảng hở A1, thay vì để mock rộng che mất.
- Chứng minh test có giá trị: chạy trên mã cũ thì 4/8 đỏ đúng chỗ.
- Trang chỉ dẫn không ghi gì: không `minibar-checks`, không B18. Có test đếm 0 POST.
- Không đổi hợp đồng, không thêm khóa ngoài phần UXD đã cấp.

---

## ARC review lại (04/11/2026, head `56e9e72f`)

- Phạm vi: `git diff 94ac2ade..56e9e72f`, gồm `CheckOutPage.tsx`, `mocks/stay.ts` và `v104-checkout-feb.test.tsx`. Đọc kèm:
  - mục 9 báo cáo FE;
  - `approval.service.ts` `list` và `submit`;
  - `approvals/internal/limits.ts`;
  - `rounds/round-04/qa/masking-pr64.md` lượt 2;
  - `UXD-on-v104-p4-32.md` mục "Review lại @ 56e9e72f".
- CI lúc review: xanh `API contract`, `OpenAPI lint`, `gitleaks`, `confidential paths`, `no test endpoints`. Còn **chờ** `format · lint · audit · test · build`, `infra scripts`, `landing`.

### Kết luận
1. **Thẻ 03 và 04: Verified, đóng.**
2. **PR #64 gộp được khi CI xanh.** Không còn điều kiện nào của ARC.
3. **Hai điều kiện ngoài ARC đã có:**
   - QA kiểm che lượt 2 @ `56e9e72f`: **ĐẠT**. Gồm 4 ảnh chụp lại, 2 ảnh mới; 2 ảnh `before-departure` giữ blob nên dùng kết quả lượt 1.
   - UXD review lại @ `56e9e72f`: **ĐẠT**. Đóng thẻ UXD 01–03.

Còn mở, không chặn gộp:
- Thẻ 01 (QA sửa tiền điều kiện CO-01; sổ tay ghi "hỏi quản lý"). FE đã thêm ca CO-01b ở mức test đơn vị. Câu U5 nay là "Hỏi quản lý trước khi báo khách", không chỉ sang Nhật ký tiền, đúng ý 3 của thẻ 01.
- Thẻ 02 (v1.0.5).
- Thẻ DOM-B16-01.

### Thẻ 04: hôm trước ngày đi, đọc tóm tắt lỗi
- Rẽ nhánh mới:
  - `eve` (= hôm trước ngày đi và chưa có tóm tắt) cộng `error` thì hiện `ErrorBlock` kèm **Thử lại** (`sum.reload`);
  - `eve` khi đang tải thì hiện `LoadingBlock`;
  - còn lại thì hiện câu chỉ dẫn. Câu chỉ dẫn chỉ còn hiện khi tóm tắt đọc được mà `postMidnightWindow = false`, hoặc khi còn từ hai ngày trở lên mới tới ngày đi. Đúng đề xuất.
- Không thêm hook nào. Nhánh vẫn nằm sau mọi hook của trang.
- Test:
  - lúc 03:00 ngày đi, tóm tắt lỗi: có Thử lại, không có câu chỉ dẫn; bấm Thử lại thì vào 3 bước;
  - ca đối chứng lúc 15:00 hôm trước, tóm tắt đọc được: có câu chỉ dẫn.
- FE báo đã thử đột biến: trả điểm sửa về mã cũ thì ca đỏ.

### Thẻ 03: mock `GET …/approval-requests` so với máy chủ
| Luật máy chủ (`ApprovalService.list`, `limits.ts`) | Mock @ `56e9e72f` | Khớp |
|---|---|---|
| `approverRoleOf` lấy vai cao nhất. OWN/MGR thấy tất cả | `ownMgr = has(roles, OWN_MGR)` xét trước | Có |
| FDL (vai duyệt cao nhất): `requested_by = me OR approver_id = me OR required_role = 'front_desk_lead'` | `fdl && (approverUserId === me \|\| routedTo(a) === 'front_desk_lead')` + của mình | Có |
| Vai khác: chỉ của mình | `requestedByUserId === me` | Có |
| Hàng chờ chi: chỉ khi vai thuộc `REFUND_PAYOUT_DESK_ROLES` = {`front_desk`, `front_desk_lead`}; điều kiện `type='refund' AND status='approved' AND refunded_vnd < amount_vnd` | `payoutDesk` = FD hoặc FDL; cùng điều kiện, `refundedVnd ?? 0` | Có |
| Lọc `status` AND với phạm vi | `.filter(status).filter(scope)` | Có |
| `refund` có vai tối thiểu `manager` (`minRoleFor`), nên **không bao giờ** có `required_role = front_desk_lead`; leo thang chỉ lên cao hơn. Vì vậy FDL không thấy yêu cầu hoàn `pending` của người khác | `routedTo`: `requiredRole` để trống thì `refund` → `manager` | Có. Đây là phần A1 cần, nên ca CO-01b phản ánh đúng máy chủ |

Một chỗ lệch nhỏ, ngoài P4-32, **không thành thẻ chặn**:
- Với loại **không phải** `refund` mà `requiredRole` để trống, mock suy ra `front_desk_lead`.
- Máy chủ thì chỉ `foc`, `special_discount`, `checkin_room_not_ready` mới bắt đầu từ `front_desk_lead`. Các loại khác như `damage_pricing` bắt đầu từ `manager`, và số tiền vượt hạn mức FDL thì cũng lên `manager`.
- Mock vẫn nhất quán với chính nó, vì nút duyệt của mock cũng cho FDL duyệt mọi loại trừ `refund`. Mock vẫn rộng hơn máy chủ ở các loại này, nhưng hẹp hơn hẳn bản trước (trước đây `lead` thấy tất cả). Không ảnh hưởng test P4-32.
- Nếu sau này test hộp Duyệt cần chính xác, nên cho `routedTo` dùng cùng luật `minRoleFor`. Ghi vào thẻ 02 làm việc kèm ở v1.0.5.

FE đọc đúng luật đầy đủ chứ không theo bản tóm "chỉ của mình": FD/FDL vẫn thấy hàng chờ chi, và FDL thấy yêu cầu chuyển cho mình. ARC xác nhận đây là luật máy chủ thật. Ba test FDL cũ (H24, `s3-review`, `refund`) vẫn xanh.

### Ghi nhận phần sửa theo UXD (không thuộc thẻ ARC)
- `awaitingDecision` chỉ bật với `pending`/`escalated`. Khớp luật máy chủ: chỉ ở bước duyệt, số mới bị cắt theo tiền dư còn trống (0.3.8 bổ sung 6).
- Lọc thêm `amountVnd − refundedVnd > 0` trước khi cộng. Kết quả giống `max(0, …)` cũ, và giúp yêu cầu đã chi đủ không làm bật nhầm `awaitingDecision`.
- `paidLabel` dùng chung cho nút chính và nút trong `ConfirmDialog`. Đọc danh sách lỗi thì dùng nhãn không có số. Về kỹ thuật, đúng.
