# SEC review kế hoạch v1.0.4 (ARC)

- Người review: SEC | Round 4, đợt v1.0.4, bước **Review thiết kế** | 04/11/2026
- Đối tượng: `rounds/round-04/plan-v1.0.4.md` (ARC, chưa commit): mục 6.3, 6.7, gói P4-11 (ED-02), P4-14 (PR24PM-01, phần `guest-portal`), P4-42 (V3-08); backlog 5.6, các dòng tương ứng.
- Đã đọc thêm:
  - `03-backlog/backlog.md` 5.6;
  - `rounds/round-02/reviews/s3-SEC.md` (SEC-BE-45);
  - `rounds/round-04/reviews/{ARC-on-PR22-v1.0.2-ed,ARC-on-PR24-post-merge,SEC-on-PR24-text-safety,DOM-on-manual-1.8,SEC-on-info-sent-copies}.md`;
  - `rounds/round-03/reviews/SEC-sprint1.md` 5.2;
  - `rounds/round-04/outputs/SEC/notice-2026-10-31-final.md` mục 2;
  - `02-escalations/ESC-044.md`, decision-log 04/11 (ESC-049 D, INV bỏ bước người bản xứ đọc LP-v2);
  - mã trên cây làm việc hiện tại: `payments/internal/refunds.service.ts`, `folio/public/folio.service.ts` (`refundPlan`, `carriedOrigin`), `jobs/email-dispatch.ts`, `identity/internal/auth.service.ts`, `admin-web/src/pages/UsersPage.tsx`, `guest-portal/internal/*`, `apps/guest-web/src/{app/config.ts,app/i18n.tsx,app/problem.ts}`, `docs/staff-one-pager.md` Tờ 4, migration 0004/0031/0042/0089.
- Không sửa tệp nào khác, không commit. Không có dữ liệu thật, địa chỉ email thật hay số tài khoản trong tệp này.

---

## 0. Quyết định (một dòng mỗi mục, để ORC chuyển)

| Mục | Quyết định SEC | Người làm | Chi tiết |
|---|---|---|---|
| **6.3** Yêu cầu hoàn thay thế mang nơi nhận (P4-12) | **Đồng ý có điều kiện.** Dùng hàm giải mã nội bộ, đọc nơi nhận trước `autoCancel`, sau `submitStayRefund` thì niêm phong lại bằng DEK mới, AAD theo id yêu cầu **mới**, trong cùng giao dịch. **Chép cả `refund_destination_set_by`/`set_at` gốc** để CHECK "người nhập nơi nhận không được duyệt" còn hiệu lực. Không log, audit hay Problem nào chứa số tài khoản. Có 6 test (mục 1) | BE-D | Mục 1, thẻ 02 |
| **M18-08** Email của người nghỉ việc | **Không** theo đề xuất ARC 6.7. `locked` là trạng thái máy tự khóa khi bị dò mật khẩu, không phải nút **Khóa tài khoản** trên Desk (nút này đặt `disabled`). Bỏ bản `self` của `locked` nghĩa là làm câm thư báo đúng lúc tài khoản đang bị tấn công. **Giữ dispatcher như hiện tại.** BE-A chỉ thêm 2 test khóa hành vi. BA ghi một dòng sổ tay: nghỉ hẳn thì Khóa tài khoản, rồi Xóa email | BE-A (test), BA (sổ tay) | Mục 2, thẻ 01 |
| **ED-02** Trigger chặn xóa giá đã áp dụng (0094) | **Đồng ý có điều kiện (cần).** `BEFORE DELETE ... FOR EACH ROW` chặn khi `OLD.effective_from <=` ngày hôm nay theo tz của property. Thông báo lỗi không chứa giá trị. Không chặn "dòng cuối" ở DB. Có test `tgenabled = 'O'`. Minor: trễ thì sang v1.0.5, không chặn QC | BE-C | Mục 3 |
| **PR24PM-01**, phần `guest-portal` | **Đồng ý có điều kiện.** Áp nửa giấy tờ **chỉ** cho 2 ô khách gõ (`note` của yêu cầu khách, `arrivalNote`), không áp cho `replyNote` (nhân viên), `registration` hay Desk. Lỗi là 422 `ID_NUMBER_DETECTED` trước khi ghi DB, chỉ có `field` + `code`. **Điều kiện bật:** ARC ghi mã này cho 2 op trong 0.3.12, và guest-web (MOB) hiện câu báo vi/en/ru. Hai phần này phải lên cùng tag, nếu không thì phần `guest-portal` sang v1.0.5. Nửa thẻ và việc chuyển tệp vẫn vào v1.0.4 | BE-D, ARC, MOB, CPY | Mục 4, thẻ 03 |
| **SENT-02** (kèm M18-01 phần mã) | **Hạ xuống Minor, không còn "bắt buộc".** ESC-049 đã quyết D nên From không đổi. Vẫn làm trong P4-06 nếu kịp: danh sách hộp thư chung lấy từ cấu hình, **luôn gộp thêm `EMAIL_FROM`**, chặn cả biến thể `+…`. Trễ thì v1.0.5. Nếu sau này đổi From thì việc này lại thành bắt buộc trước lượt đổi `.env` | BE-A | Mục 5 |
| **Chữ gốc `privacy-2026-10-v2`** (P4-42) | **Đã có, ngay trong tệp này (mục 6).** Gồm EN + VI, 4 khóa, cùng chữ với tờ **Your ID details**. Xong sớm hơn hạn 06/11 10:00. CPY dịch RU 4 khóa thông báo và rà RU 6 khóa đồng ý cùng `gw.notice_read`, hạn giữ **06/11 10:00**. Có 5 điều kiện cho MOB/OWN/UXD (mục 6.4) | MOB, CPY, UXD, OWN | Mục 6, thẻ 04 |

ESC mới: **không**. Cả 6 mục thuộc quyền SEC (yêu cầu bảo mật kỹ thuật, chữ thông báo) hoặc đã có quyết định INV (ESC-044, ESC-049).

---

## 1. Mục 6.3: yêu cầu hoàn thay thế mang nơi nhận (P4-12)

### 1.1 Đánh giá
- SEC-BE-45 (T09) đặt ra để **không giữ số tài khoản của yêu cầu sẽ không bao giờ chi**. Yêu cầu thay thế thì **sẽ chi**, và chi cho cùng khách, cùng đơn. Vì vậy mang nơi nhận sang không trái mục đích của SEC-BE-45. Sau khi chép, yêu cầu cũ vẫn bị xóa nơi nhận như cũ.
- Dữ liệu sống lâu hơn vài ngày, nhưng vẫn trong mục đích (chi hoàn). T09 vẫn hủy DEK khi chi xong.
- **Lợi về bảo mật:** lễ tân không phải gọi lại khách xin số tài khoản qua điện thoại/Zalo. Mỗi lần nhập lại là một lần số tài khoản đi qua kênh ngoài Desk.
- Thiết kế ARC thiếu 3 điểm, nếu bỏ qua thì thành lỗi. Ghi ở thẻ 02 và điều kiện dưới.

### 1.2 Điều kiện cho BE-D (bắt buộc, SEC kiểm trong review PR-I)
1. **Thứ tự trong `refundPlan`** (`folio.service.ts` đoạn `carriedOrigin` → `autoCancel` → `submitStayRefund`):
   - đọc và so nơi nhận **trước** vòng `autoCancel`, vì hook `onDecided` của `cancelled` hủy DEK ngay trong vòng đó;
   - niêm phong cho yêu cầu mới **sau** `submitStayRefund`;
   - cả hai bước nằm trong cùng giao dịch và dưới khóa folio hiện có. Các dòng yêu cầu cũ khóa `FOR UPDATE` (đã có qua `openRefunds(..., { lock: true })`).
   - Lỗi giải mã hoặc niêm phong thì **cả giao dịch hủy**. Không để trạng thái yêu cầu cũ đã mất nơi nhận mà yêu cầu mới chưa có.
2. **Mã hóa lại, không chép bản mã:**
   - bản mã gắn AAD `refundAccountAad(id)` theo id yêu cầu, và DEK cũ sẽ bị hủy;
   - vì vậy phải giải mã bằng `RefundAccountCipher` (đường nội bộ, **không** đi qua `getRefundDestination`, tránh ghi `view` giả và tiêu hạn mức C3), rồi `encrypt` với `subjectId` = id yêu cầu **mới**, DEK mới;
   - bản rõ chỉ nằm trong biến cục bộ của module payments. Folio gọi qua một hàm public của payments (ví dụ `peekCarryableDestination` / `applyCarriedDestination`, ARC đặt tên). Không trả bản rõ ra khỏi payments, không đưa vào đối tượng lỗi.
3. **Chép nguồn gốc:**
   - chép `refund_method`, `refund_bank_bin`, `refund_account_last4`;
   - chép **`refund_destination_set_by` và `refund_destination_set_at` của yêu cầu gốc**, không ghi bằng người kích hoạt hay "hệ thống";
   - lý do: CHECK `approver_id <> refund_destination_set_by` (migration 0031/0042) là chốt "người nhập nơi nhận không tự duyệt". Ghi người khác vào đây thì người đã nhập số tài khoản duyệt được khoản chi tới chính số đó.
4. **Luật so:**
   - nơi nhận = (`refund_method`, `bank_bin`, `accountNo` đã giải mã, `accountHolder` đã chuẩn hóa: trim, gộp dấu cách, NFC, không phân biệt hoa thường);
   - các yêu cầu bị đóng không có nơi nhận thì bỏ qua;
   - từ 2 nơi nhận khác nhau trở lên thì **không mang**;
   - chỉ áp cho nhánh tạo **một** yêu cầu thay thế (`plan.createVnd > 0`), cùng `target_id` (cùng đơn). Không áp cho `refundsDownToCredit`, đóng `no_show_restored`, hay khi người dùng từ chối/hủy tay;
   - so trong bộ nhớ, không ghi kết quả so hay độ dài chuỗi ra log.
5. **Nhật ký:**
   - `c3_access_log`: yêu cầu mới `create`, yêu cầu cũ `purge` như hiện nay. Không ghi `view`;
   - audit tiền `refund.destination_carried`, chỉ có `fromApprovalIds` + `toApprovalId`, không có BIN, 4 số cuối hay tên chủ tài khoản;
   - `privacy-log-check.sh` phải sạch.
6. Yêu cầu mới vẫn **Chờ duyệt**, cấp duyệt theo `minRequiredRole` đã mang. Đổi nơi nhận sau khi duyệt vẫn về `pending` (F8).
7. **Test** (`v104-refund-dest.test.ts`):
   - (a) 1 yêu cầu cũ có nơi nhận → yêu cầu mới có cùng nơi nhận (giải mã ra đúng), yêu cầu cũ `refund_account_enc IS NULL` và DEK đã hủy;
   - (b) 2 nơi nhận khác nhau → yêu cầu mới không có nơi nhận;
   - (c) 1 có, 1 không → mang;
   - (d) người đã nhập nơi nhận ở yêu cầu cũ duyệt yêu cầu mới → bị chặn (CHECK hoặc 409);
   - (e) giải mã lỗi giả lập → giao dịch hủy, cả hai yêu cầu như trước;
   - (f) log, audit, Problem không có chuỗi số tài khoản thử (quét bằng chuỗi `…@example.test`/số thử Luhn sai).

Gợi ý, không bắt buộc ở v1.0.4: hộp duyệt hiện "Nơi nhận chép từ yêu cầu trước, người nhập: {tên}" để người duyệt đối chiếu. Để FE-A/UXD xếp ở v1.0.5.

---

## 2. M18-08: email của người nghỉ việc

### 2.1 Sự thật trên mã
- Nút **Khóa tài khoản** trên Desk (`UsersPage.tsx` dòng 103) đặt `status = 'disabled'`. Chuỗi `users.lock_body`: "đăng xuất ngay trên mọi máy".
- `status = 'locked'` **không do người đặt**. Máy tự đặt khi bị khóa cứng sau nhiều lần sai mật khẩu (`auth.service.ts` dòng 6–8, 515–527; chuỗi `users.status_locked` "Tạm khóa do sai mật khẩu"). Khóa cứng **không** đăng xuất phiên đang chạy.
- Dispatcher (`email-dispatch.ts` dòng 241) gửi bản `self` khi `status IN ('active','locked')`. Vậy tài khoản đã bấm **Khóa tài khoản** (`disabled`) **đã không** nhận bản `self`. Bản `owner` chỉ gửi cho OWN `active`.
- Nhận xét của BA ở `DOM-on-manual-1.8.md` dòng 153 ("dispatcher gửi cho tài khoản `locked`") đúng về mã, nhưng đã hiểu `locked` là nút Khóa tài khoản. Đề xuất ARC 6.7 dựa trên cách hiểu đó.

### 2.2 Quyết định
- **Không** bỏ bản `self`/`previous` của `locked`. Người đang làm việc mà bị dò mật khẩu tới mức khóa cứng thì phiên của kẻ dò (nếu đã vào được) vẫn chạy. Lúc đó thư "mã khôi phục đã dùng", "email đã đổi" là cách duy nhất để chính người đó biết. Bỏ đi là giảm phát hiện đúng lúc cần nhất.
- **Không đổi dispatcher.** BE-A thêm 2 test vào `email-dispatch` để khóa hành vi:
  - (a) người được báo `disabled` → không có bản `self`, OWN `active` vẫn có bản `owner`;
  - (b) người được báo `locked` (khóa cứng, `locked_until IS NULL`) → **vẫn** có bản `self`.
  - Chú thích cạnh câu SQL: "`locked` = khóa tự động do sai mật khẩu, không phải nút Khóa tài khoản (SEC M18-08)".
- **Tối thiểu dữ liệu (NĐ 13/2023, cần luật sư xác nhận cùng ESC-001).** Người nghỉ hẳn (nhân viên, CTV hết hợp tác) thì OWN làm 2 bước:
  1. **Khóa tài khoản**;
  2. **Xóa email** ngay trong ngày.
  - Sẽ có **một** thư "email đã đổi" tới địa chỉ cũ (bản `previous`) và bản `owner`. Cần báo trước cho người đó, đúng như DOM đề xuất.
  - Khóa tạm (nghỉ phép, nghi lộ mật khẩu) thì giữ email.
- **BA:** thêm một dòng vào sổ tay 1.5 / `01` 1.9 theo ý trên. Ghi rõ "Tạm khóa do sai mật khẩu" là việc máy làm, khác với **Khóa tài khoản**, và vẫn nhận thư bảo mật.
- **OPS (P4-04):** PR30-08 (`email_missing` gồm `locked`) vẫn đúng và nên giữ, vì `locked` vẫn là người nhận.
- Dòng backlog M18-08 đóng khi có 2 test và dòng sổ tay. Gói P4-06 bớt việc, không thêm.

---

## 3. ED-02: trigger `BEFORE DELETE ON room_list_price` (0094)

### 3.1 Đánh giá
- Dữ liệu không phải dữ liệu cá nhân. Đây là **toàn vẹn sổ sách**: lịch sử giá niêm yết là căn cứ đối soát báo giá và giải thích tiền với INV (STRIDE: Tampering/Repudiation).
- `ottimo_app` có `DELETE` trên cả bảng (0089 dòng 45). Chỉ có **một** đường xóa (`rooms.service.ts` dòng 318). Không có FK `ON DELETE CASCADE` trỏ vào bảng này.
- Trigger rẻ (đã giữ số 0094), cùng nguyên tắc "DB tự giữ bất biến" như `simulation_guard` và PN-01. **SEC nói "cần"**, mức Low/Minor.

### 3.2 Điều kiện cho BE-C
1. `BEFORE DELETE ... FOR EACH ROW`. Từ chối khi `OLD.effective_from <= (now() AT TIME ZONE p.timezone)::date`, với `p` = property của dòng.
   - Lấy tz bằng truy vấn theo `OLD.property_id`. Không có property thì từ chối (đóng an toàn).
   - Hàm `SECURITY INVOKER`, `SET search_path` cố định.
2. Lỗi: `RAISE EXCEPTION` với thông báo cố định (ví dụ `room_list_price: applied price row is append-only`).
   - Không nối `id`, giá hay ngày vào thông báo.
   - Lớp dịch vụ đã chặn trước (409 `first_price`/`only_price`), nên trigger chỉ bắn khi có lỗi lập trình → 500 chung, không lộ chi tiết.
3. **Không** chặn "dòng cuối/dòng đầu của căn" ở DB. Luật này cần đọc các dòng khác nên dễ đua, và lớp dịch vụ đã làm (BUG-R4-015).
4. Chỉ thêm, không đổi dữ liệu:
   - app cũ `sha-da6d6f3dc22b` chỉ xóa dòng có ngày hiệu lực **sau** hôm nay, nên vẫn chạy với trigger. BE-C ghi câu này cho runbook;
   - `TRUNCATE` trong dọn dẹp test không bắn trigger dòng, nên không ảnh hưởng.
5. Test:
   - (a) `ottimo_app` xóa dòng quá khứ → lỗi;
   - (b) xóa dòng tương lai → được;
   - (c) dòng `effective_from` = hôm nay theo tz property, quanh 00:00 → bị chặn;
   - (d) `tgenabled = 'O'`;
   - (e) chạy cùng `MutableClock` của lớp dịch vụ không làm đỏ test BUG-R4-015.
6. Muốn sau này xóa thật (sửa dữ liệu) thì làm bằng migration có `ALTER TABLE ... DISABLE TRIGGER` của chủ bảng, có review SEC. Không có cờ bỏ qua cho `ottimo_app`.
7. OPS (tùy chọn, P4-04): thêm 1 câu READ ONLY kiểm trigger này `enabled`, cùng chỗ với 2 trigger PN-01.
8. Trễ giờ cắt thì sang v1.0.5, đóng thẻ có lý do. Không chặn QC v1.0.4.

---

## 4. PR24PM-01: áp bộ dò mới cho `guest-portal`

### 4.1 Đánh giá
- Ô chữ tự do của khách ở cổng khách lưu dưới dạng chữ thường: `guest_request.note`, `arrival_note`. Các ô này không có mã hóa C3, không cần step-up. Ai xem được đơn trên Desk đều đọc được.
- Hiện chỉ có luật thẻ cũ chặn. Số CCCD/hộ chiếu khách lỡ gõ vào đây sẽ nằm ngoài mọi biện pháp bảo vệ của ảnh giấy tờ.
- Áp nửa giấy tờ là hỏng theo hướng an toàn: 422 trước khi ghi, không lưu gì (giống G2 form website, SEC-on-PR24 mục 4). PO đã đồng ý về trải nghiệm.

### 4.2 Điều kiện
1. **Nửa thẻ** (`containsCardNumber` = bộ dò mới OR luật cũ):
   - áp ở mọi nơi đang gọi, không thêm nơi gọi mới;
   - mã lỗi giữ nguyên `CARD_NUMBER_DETECTED`.
2. **Nửa giấy tờ chỉ áp cho 2 ô khách gõ:**
   - `guest-requests.service.ts` hàm `note()` (dòng ~391);
   - `guest-portal.service.ts` `arrivalNote` (dòng ~525).
   - **Không** áp cho `replyNote` (nhân viên gõ, đã có B-15 `SENSITIVE_DATA_DETECTED`), `registration`, ô Desk, payments.
3. Lỗi:
   - 422 `ID_NUMBER_DETECTED` (mã đã có trong hợp đồng cho form website), xảy ra **trước** khi ghi DB;
   - `FieldError` chỉ có `field` + `code`, không nhắc lại chữ của khách;
   - không ghi chuỗi vào log hay audit (`logLine`);
   - không đếm vào rate limit theo cách lộ được kết quả dò.
4. **Hợp đồng:** ARC thêm `ID_NUMBER_DETECTED` vào mô tả 422 của `createGuestRequest` và op ghi `arrivalNote` trong **0.3.12 (P4-00, hạn 05/11 10:00)**. Chỉ là tài liệu, không thêm op. Lỡ hạn thì làm ở bản bổ sung 0.3.12 của ARC.
5. **guest-web (MOB):**
   - `app/problem.ts`, `RequestsPage.tsx` và ô ghi chú lúc đến trong `CheckinFlow.tsx` nhận `ID_NUMBER_DETECTED` và hiện câu báo;
   - khóa mới `error.ID_NUMBER_DETECTED` trong nhóm riêng của MOB (luật 2.4);
   - chữ: EN "No need to send ID numbers here. Please remove it and try again." / VI "Không cần gửi số giấy tờ ở đây. Vui lòng xóa đi rồi gửi lại.";
   - RU do CPY dịch. UXD chốt giọng văn OTTIMO.
6. **Cùng tag:** phần máy chủ (4.2 ý 2) chỉ gộp khi phần guest-web (ý 5) gộp cùng bản. Không kịp giờ cắt 06/11 18:00 thì BE-D giữ ý 2 sau một nhánh riêng sang v1.0.5. Ý 1 (nửa thẻ, chuyển `sensitive-number.ts` sang `src/shared/`, test kiến trúc) vẫn vào v1.0.4.
7. **Test:**
   - **phải chặn:** CCCD 12 số (cả viết cách, viết từng cặp sau khi xong PR24PM-02), hộ chiếu, MRZ;
   - **không được chặn:** số phòng, số chuyến bay (`VN 1234`), giờ, ngày, số tiền có đơn vị, SĐT có `+84`;
   - SĐT nước ngoài không có `+` bị chặn là chấp nhận được (như G2). QA ghi vào danh sách đã biết.

---

## 5. SENT-02 sau ESC-049 = D

- From giữ `info@`, và `info@` đã bị chặn làm email nhận thông báo. Rủi ro SENT-02 ("đổi From thì `info@` hết bị chặn") **chưa xảy ra**. Hạ từ "Major nếu C1/A" xuống **Minor**.
- Vẫn nên làm trong P4-06 cùng M18-01, vì chi phí nhỏ và chặn được `info+x@`, `booking@`:
  - danh sách hộp thư chung = tham số cấu hình (`.env.example` có biến mẫu, giá trị mẫu `info@example.test`, `booking@example.test`), **luôn gộp thêm `EMAIL_FROM`**;
  - so sau khi chuẩn hóa hàm luật địa chỉ chung của P4-05 và bỏ phần `+…`;
  - test "đổi `EMAIL_FROM` vẫn chặn `info@`" giữ, vì chỉ thêm một ca.
- Không kịp thì v1.0.5. Không còn là dòng "bắt buộc" của QC v1.0.4.
- **Điều kiện treo:** nếu sau này có lượt đổi From (C1/A), thẻ này lại là **bắt buộc** và phải lên production **trước** lượt đổi `.env`. OPS ghi câu này cạnh bước đổi From trong README 13.8.

---

## 6. Chữ gốc `privacy-2026-10-v2` cho trang khách (P4-42)

### 6.1 Trạng thái
- Các ý của v2 đã có ở nhiều nơi:
  - câu hạn lưu: `SEC-sprint1.md` 5.2;
  - câu sao lưu và câu quyền của khách: tờ **Your ID details** (`staff-one-pager.md` Tờ 4, đang dán ở quầy);
  - câu dịch: `notice-2026-10-31-final.md` mục 2, bản luật sư đã đọc cho landing.
- Chưa có một bản gộp cho trang khách. **Bản gộp ở dưới là chữ gốc chính thức**, giao 04/11, sớm hơn hạn 06/11 10:00.
- Không cần luật sư đọc lại trước khi đăng (ESC-001: luật sư để tham khảo, không chặn).
- Câu dịch là câu luật sư đã đọc, chỉ đổi "request" thành "messages" cho đúng ngữ cảnh khách lưu trú.

### 6.2 Văn bản: 4 khóa, nhóm `v1.0.4 P4-42 privacy-2026-10-v2` trong `gen_strings.py`

Thứ tự hiện trên trang, mỗi khóa một đoạn:

| Khóa | EN (dẫn) | VI |
|---|---|---|
| `gw.notice_body` (sửa) | OTTIMO uses your ID details to register your stay with the police, as required by Vietnamese law. ID photos are encrypted; only reception and managers can see them. We will ask separately whether we may keep your ID photos after registration. Saying no does not affect your stay. | OTTIMO dùng thông tin giấy tờ của bạn để khai báo lưu trú với cơ quan công an theo luật Việt Nam. Ảnh giấy tờ được mã hóa; chỉ lễ tân và quản lý xem được. Chúng tôi sẽ hỏi riêng bạn có muốn cho lưu ảnh giấy tờ sau khi khai báo hay không. Bạn không đồng ý cũng không ảnh hưởng gì tới việc lưu trú. |
| `gw.notice_retention` (mới) | ID photos and saved ID details are deleted within 3 months after check-out, unless the law requires us to keep them longer. Copies in our encrypted backups are deleted within a further 35 days. | Ảnh và thông tin giấy tờ được xóa trong vòng 3 tháng sau khi trả phòng, trừ phần pháp luật yêu cầu lưu lâu hơn. Bản sao trong dữ liệu sao lưu đã mã hóa được xóa trong 35 ngày sau đó. |
| `gw.notice_translation` (mới) | We may use a translation service, such as Google Translate, to read your messages and reply to you. The text we translate may include your name, contact, stay details and message. The service handles this text under its own privacy policy, and its servers may be outside Viet Nam. | OTTIMO có thể dùng một dịch vụ dịch, như Google Dịch, để đọc tin nhắn và trả lời bạn. Nội dung được dịch có thể gồm tên, liên hệ, thông tin lưu trú và lời nhắn của bạn. Dịch vụ này xử lý nội dung đó theo chính sách riêng của họ, và máy chủ của họ có thể đặt ngoài Việt Nam. |
| `gw.notice_rights` (mới) | To see, correct or delete your details, please ask reception. | Muốn xem, sửa hoặc xóa thông tin của bạn, vui lòng hỏi lễ tân. |

Ghi chú khóa (cột ghi chú trong `gen_strings.py`): `Văn bản pháp lý privacy-2026-10-v2 – SEC chữ gốc (SEC-on-plan-v1.0.4 mục 6) – đổi chữ = đổi version`.

Chữ đã theo brand OTTIMO: ngắn, điềm tĩnh, EN dẫn, VI hỗ trợ, không emoji. Câu 1 và 2 của `gw.notice_body` giữ nguyên văn v1. Câu 3 và 4 lấy từ tờ ở quầy. UXD được chỉnh dấu câu và kiểu chữ. **Không** được đổi nghĩa hay bỏ vế. Đổi nghĩa thì báo SEC.

### 6.3 Vì sao câu đúng với hệ thống hiện tại
- 3 tháng là **mức trên**, nên câu vẫn đúng với mọi giá trị trong biên:
  - ảnh của khách đồng ý lưu: hiện tối đa 30 ngày (nới lên 90 ngày là việc v1.0.5, vẫn ≤ 3 tháng);
  - ảnh của khai báo chưa xong: ≤ 7 ngày;
  - hồ sơ điền sẵn: OWN đặt 3 tháng.
- Ràng buộc cũ vẫn giữ: OWN **không** đặt `document_profile_retention_months` > 3 khi v2 còn hiệu lực.
- "Pháp luật yêu cầu lưu lâu hơn" là bản ghi khai báo lưu trú, chờ luật sư (ESC-001).
- Câu dịch theo ESC-044 (INV cho phép, không giới hạn, cho nội dung khách gửi). Câu **không** nói giấy tờ được dịch: số giấy tờ không phải chữ cần dịch, và không thuộc "nội dung khách gửi" mà ESC-044 nói tới.
  - Để câu luôn đúng, BA thêm một dòng sổ tay: "Không dùng **Dịch trang này** ở màn **Giấy tờ & khai báo** và màn xem ảnh giấy tờ".
  - Đề xuất v1.0.5 (FE-A): đặt `translate="no"` cho khối số giấy tờ và ảnh trên Desk. Có rồi thì dòng sổ tay thành lớp thứ hai.

### 6.4 Điều kiện cho P4-42 và lượt bật (SEC kiểm)
1. **`NOTICE_TEXT_VERSIONS = ['privacy-2026-10-v2']`**, bỏ v1, vì trang không còn chữ v1. Máy chủ còn v1 thì trang **đóng an toàn** (đưa khách tới quầy). Check-in online đang dừng nên việc này không làm hỏng gì.
2. Trang hiện đủ 4 đoạn theo đúng thứ tự 6.2, ngay dưới `gw.notice_title`, trước nút `gw.notice_read`. Dòng `gw.notice_version` hiện `privacy-2026-10-v2`. Lượt đồng ý gửi đúng version máy chủ báo (`currentNoticeVersion`).
3. **Tiếng Nga:**
   - CPY dịch 3 khóa mới, `gw.notice_body` bản sửa, và **rà lại RU** của 6 khóa đồng ý đang rơi về EN (`guest.oci.why`, `guest.oci.consent_q`, `guest.oci.consent`, `guest.oci.consent_no`, `guest.oci.consent_optional`, `guest.oci.withdraw_hint`) và `gw.notice_read`;
   - CPY ghi vào bảng chữ, SEC đối chiếu nghĩa từng câu, UXD duyệt giọng văn;
   - xong 3 bước thì MOB bỏ đúng các khóa đó khỏi `RU_UNREVIEWED_LEGAL` (luật decision-log 17/10), và thêm 3 khóa mới vào danh sách tới khi RU được duyệt;
   - khóa nào chưa đủ 3 bước thì giữ trong danh sách (rơi về EN) và P4-42 **chưa đạt** AC "không rơi về EN";
   - hạn CPY: **06/11 10:00**.
4. **Tờ Your ID details** (UXD): thêm đoạn dịch (`gw.notice_translation`) vào bản EN và VI, đổi chân trang thành `OTTIMO · ID notice · v2 · 11/2026`, giữ bản cũ trong lịch sử repo (SEC D08). Bản RU in khi RU đã duyệt (ý 3).
5. **Thứ tự bật trên production** (OPS ghi vào runbook v1.0.4):
   1. deploy v1.0.4. Trang khách đóng an toàn vì tham số còn v1;
   2. INV/OWN thay tờ v2 ở quầy;
   3. **cùng ngày**, OWN đặt tham số Desk `privacy_notice_version` = `privacy-2026-10-v2` (H05). Từ lúc này Desk ghi v2 cho cả khách làm thủ tục tại quầy, nên tờ phải là v2 trước;
   4. SEC kiểm (6.5);
   5. ORC báo INV mở lại check-in online.

### 6.5 SEC kiểm sau production (trước khi ORC báo mở lại)
- Trang khách vi/en/ru hiện đúng 4 đoạn, khớp từng câu với 6.2 và bản RU đã duyệt. Không khóa nào rơi về EN ở trang RU.
- Lượt đồng ý thử (khách thử, dữ liệu `…@example.test`) ghi `privacy-2026-10-v2`.
- Tham số trên production (đọc bằng `ops-check` hoặc màn Tham số, không chụp dữ liệu khách):
  - `document_profile_retention_months` ≤ 3;
  - `id_image_retention_days_after_checkout` ≤ 90;
  - `id_image_unconfirmed_max_days` ≤ 7;
  - sao lưu giữ ≤ 35 ngày.
- Tờ ở quầy là bản v2.

---

## 7. Thẻ feedback

### FB-R4-SEC-ARC-P104-01
- Mức độ: Major
- Vị trí: `plan-v1.0.4.md` mục 6 ý 7 (M18-08); P4-06 cột Việc "M18-08: theo SEC chọn (ARC đề xuất: dispatcher bỏ bản `self` của tài khoản `locked`…)"; brief BE-A.
- Vấn đề: `locked` là trạng thái máy tự đặt khi khóa cứng do sai mật khẩu, và khóa cứng không đăng xuất phiên đang chạy (`auth.service.ts` dòng 6–8, 524). Nút **Khóa tài khoản** trên Desk đặt `disabled` (`UsersPage.tsx` dòng 103), và dispatcher đã loại `disabled`. Đề xuất ARC sẽ tắt thư bảo mật tới chính người dùng đúng lúc tài khoản bị dò mật khẩu.
- Vì sao quan trọng: thư "mã khôi phục đã dùng" / "email đã đổi" là cách duy nhất để người đó tự phát hiện bị chiếm tài khoản (BUG-R3-032, M18-09).
- Đề xuất sửa: bỏ ý 7. P4-06 thay bằng "M18-08: không đổi dispatcher; thêm 2 test `disabled` không nhận `self`, `locked` vẫn nhận `self` (SEC-on-plan-v1.0.4 mục 2)". Sổ tay: BA thêm dòng theo mục 2.2.
- Trạng thái: Open

### FB-R4-SEC-ARC-P104-02
- Mức độ: Major
- Vị trí: `plan-v1.0.4.md` mục 6 ý 3; P4-12; brief BE-D.
- Vấn đề: thiết kế chưa nói 3 điểm:
  - (a) bản mã gắn AAD theo id yêu cầu và DEK cũ bị hủy trong vòng `autoCancel`, nên phải giải mã **trước** vòng đó và mã hóa lại sau khi tạo yêu cầu mới;
  - (b) phải chép `refund_destination_set_by`/`set_at` gốc;
  - (c) lỗi giữa chừng thì cả giao dịch hủy.
- Vì sao quan trọng: thiếu (b) thì người đã nhập số tài khoản duyệt được khoản chi tới chính số đó, vượt CHECK maker-checker (0031/0042). Đây là đường tiền. Thiếu (a) thì hoặc chép bản mã không giải được, hoặc gọi `getRefundDestination` để lại `view` giả trong `c3_access_log`.
- Đề xuất sửa: đưa mục 1.2 (7 ý) vào AC của P4-12 và brief BE-D. SEC review PR-I theo đúng danh sách đó.
- Trạng thái: Open

### FB-R4-SEC-ARC-P104-03
- Mức độ: Minor
- Vị trí: P4-14 ("`guest-portal` áp dụng chỉ khi SEC duyệt"); P4-00 (không nhắc mã lỗi mới cho op cổng khách); P4-42/P4-50 (không có việc guest-web).
- Vấn đề: áp nửa giấy tờ cho cổng khách cần hai phần ngoài BE-D: ARC ghi `ID_NUMBER_DETECTED` cho 2 op, và guest-web hiện câu báo. Hiện guest-web chỉ biết `CARD_NUMBER_DETECTED` (`app/problem.ts` dòng 35, 60). Thiếu hai phần này thì khách thấy lỗi chung và không biết sửa gì.
- Vì sao quan trọng: khách bỏ yêu cầu, hoặc gọi điện đọc số giấy tờ qua kênh khác.
- Đề xuất sửa: thêm vào P4-00 mục (i) "mô tả 422 `ID_NUMBER_DETECTED` cho `createGuestRequest` và op `arrivalNote`". Thêm vào làn MOB (P4-42 hoặc P4-50, ORC chọn) việc 4.2 ý 5. Thêm khóa `error.ID_NUMBER_DETECTED` vào 3.1. Áp luật "cùng tag" ở 4.2 ý 6.
- Trạng thái: Open

### FB-R4-SEC-ARC-P104-04
- Mức độ: Minor
- Vị trí: P4-42 cột AC; 7.3 "Sau production"; runbook P4-04.
- Vấn đề: kế hoạch chưa có bước OWN đặt tham số `privacy_notice_version` và bước thay tờ ở quầy. Cũng chưa nói `NOTICE_TEXT_VERSIONS` bỏ v1. Đổi tham số trước khi thay tờ thì khách làm thủ tục tại quầy bị ghi đồng ý v2 trong khi đọc tờ v1.
- Vì sao quan trọng: bằng chứng đồng ý phải khớp đúng chữ khách đã đọc (decision-log 17/10, ĐK-2).
- Đề xuất sửa: đưa 6.4 ý 1 và ý 5 vào AC P4-42 và runbook v1.0.4 (OPS).
- Trạng thái: Open

---

## 8. Dòng decision-log đề xuất (ORC ghi khi commit)

`| 2026-11-04 | 4 | **SEC – 4 điểm plan v1.0.4 mục 7.3 + chữ privacy-2026-10-v2** (rounds/round-04/reviews/SEC-on-plan-v1.0.4.md): (1) 6.3 nơi nhận yêu cầu hoàn thay thế: ĐỒNG Ý CÓ ĐK – giải mã trước autoCancel, mã hóa lại DEK mới/AAD id mới cùng giao dịch, chép refund_destination_set_by/at gốc (CHECK maker-checker), lỗi → hủy cả giao dịch, audit chỉ mã yêu cầu; (2) M18-08: KHÔNG theo ARC 6.7 – locked = khóa tự động do sai mật khẩu (vẫn phải nhận thư), nút Khóa tài khoản = disabled đã không nhận; không đổi dispatcher, thêm 2 test; nghỉ hẳn = Khóa rồi Xóa email (sổ tay); (3) ED-02: CẦN – trigger 0094 chặn xóa dòng effective_from ≤ hôm nay theo tz property, không chặn dòng cuối ở DB; Minor, trễ thì v1.0.5; (4) PR24PM-01 guest-portal: ĐỒNG Ý CÓ ĐK – nửa giấy tờ chỉ cho note + arrivalNote của khách, 422 ID_NUMBER_DETECTED, cần ARC ghi mã ở 0.3.12 + guest-web hiện câu báo cùng tag, không thì v1.0.5; (5) SENT-02 hạ Minor sau ESC-049 D (danh sách hộp thư chung luôn gộp EMAIL_FROM), bắt buộc lại nếu đổi From; (6) chữ gốc privacy-2026-10-v2 EN/VI giao 04/11 (4 khóa, cùng tờ quầy), RU CPY hạn 06/11 10:00 | SEC | Quyền SEC (yêu cầu bảo mật kỹ thuật, chữ thông báo); ESC-044, ESC-049 |`

---

## 9. Giả định

1. **RU trang khách.** INV bỏ bước người bản xứ đọc cho LP-v2 ngày 04/11. SEC áp cùng chuẩn cho chữ RU của trang khách lưu trú: CPY dịch, SEC đối chiếu nghĩa, UXD duyệt giọng văn, thay cho "người dịch duyệt" (HR-01). ORC nêu một câu trong `round-summary.md`. INV không đồng ý thì RU tiếp tục rơi về EN và P4-42 lên mà chưa đạt AC RU.
2. **Câu dịch không nhắc giấy tờ.** Giả định nhân viên không dịch màn giấy tờ (dòng sổ tay 6.3). Có bằng chứng nhân viên vẫn dịch màn đó thì SEC phải thêm "ID details" vào câu dịch (version mới).
3. "Reception and managers" gồm cả OWN, giữ nguyên chữ v1 như tờ ở quầy đã dùng từ 02/11.
4. Số dòng mã dẫn ở trên là của cây làm việc 04/11 (`lp-v2-main`). Rebase lên `main@L` có thể lệch vài dòng, nhưng không đổi nghĩa.

## 10. Điểm làm tốt

- Bản đồ chủ tệp một chủ cho mỗi tệp nóng. SEC review từng PR dễ hơn hẳn, không phải lo hai người cùng sửa `refunds.service.ts`.
- Mọi migration v1.0.4 "chỉ nới hoặc thêm", quay lui app không lùi DB. Điều này giữ cho ED-02 và PN-01 an toàn khi phải lùi bản.
- Chừa sẵn đường dự phòng khi SEC không duyệt (R4, R5): biết rõ phải giữ cách tạm nào, không có quyết định treo.
