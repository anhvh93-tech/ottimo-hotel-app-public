# SEC – Khói L của US-155 trên production (REQ-84EKR1V6, kết quả 11/14)

- Người viết: SEC | Round: 3 | Bước: Kiểm thử | Ngày: 30/10/2026
- Đầu vào:
  - `rounds/round-03/outputs/OPS/b2-runbook.md` mục 8.7: lệnh đếm L5 ra 11/14, FAIL các kiểm 2, 4, 5.
  - Lời INV qua ORC: đã bấm **"Đóng – không thành đơn"** thay cho **"Xóa theo yêu cầu người gửi"** (WR8). Sau đó không thấy nút xóa nữa.
- Cách làm: chỉ đọc mã trên nhánh `main` (`git show main:…`). Không đụng production, không truy vấn, không xem dòng dữ liệu nào.
- Mã đã đọc:
  - `services/api/src/modules/public-site/internal/website-requests.service.ts` (`allowed`, `transition`, `lookup`, `PII_NULLS`);
  - `…/public-site/internal/public-booking.service.ts` (cách lưu tên/email, giới hạn liên hệ);
  - `…/public-site/public/worker-jobs.ts` (`web_request.purge`, `web_request.stale`);
  - `…/public-site/public/website-request.port.ts` (WR6);
  - `db/migrations/0086_public_site_us155.sql` (tham số hạn lưu, ràng buộc `website_booking_request_contact_check`);
  - `apps/admin-web/src/pages/webreq/WebRequestDrawer.tsx`, `WebRequestsPage.tsx`, chuỗi `webreq.*`;
  - `infra/server/bin/us155-smoke-counts.sh`, `infra/server/us155-smoke-counts.sql`, `infra/server/test/publish-privacy-notice.test.sh` (ca 15–19);
  - các test `public-site-r3-bed.test.ts`, `r3-v1-feb-webreq.test.tsx`, `us155-website-requests.r3.spec.ts`.

## Kết luận nhanh

1. **WR8 làm được với yêu cầu đã Đóng. Mã không có lỗ hổng quyền.**
   - Máy chủ và Desk đều cho OWN/MGR/FDL xóa yêu cầu `declined` chưa xóa dữ liệu.
   - "Tìm theo liên hệ" cũng tìm ra yêu cầu đã đóng.
   - Việc INV không thấy nút là lỗi **khó tìm** (nghi vấn), cộng với **thiếu test**. Đã ghi **BUG-R3-056 (P2)**, chờ QA tái hiện; tái hiện được "OWN không có nút" thì nâng P1.
2. **Đóng không xóa dữ liệu liên hệ.** Kiểm 3 và 14 bằng 0 vì dòng yêu cầu **không chứa** "TEST OTTIMO" lẫn "info@ottimo.vn". Tên và email đã lưu khác chuỗi thử, nên không còn chắc đây là dữ liệu giả.
3. **Không chấp nhận 11/14.** Khói L chỉ đạt sau khi INV chạy WR8 trên Desk cho REQ-84EKR1V6 và lệnh đếm ra 14/14. Không dùng hạn lưu tự xóa làm cách dọn, không SQL tay.

## 1. WR8 có làm được với yêu cầu đã Đóng không

### 1.1 Mã nói gì

| Lớp | Mã (`main`) | Kết quả cho yêu cầu `declined` do nhân viên đóng |
|---|---|---|
| Danh sách hành động | `allowed()`: `if (r.status !== 'converted' && !r.pii_purged_at && isLead(actor.roles)) out.push('erase')` | Có `erase` với OWN, MGR, FDL |
| Thực hiện | `transition('erase')`: chỉ 409 khi `converted` hoặc `pii_purged_at` đã có; FD/SAL 403 trước khi đọc dòng | 200: xóa C2, `contact_hmac`, `ip_hmac`; ghi `pii_purged_at`; `decline_reason_code = 'erased_on_request'` (ghi đè lý do đóng); `purge_journal` `dsr_erase`; audit `security` `website_request.erased` |
| Tìm lại yêu cầu | `lookup()`: `status <> 'converted' AND pii_purged_at IS NULL` | Tìm theo liên hệ trả cả yêu cầu đã đóng |
| Hợp đồng | `openapi.yaml` bảng `transitionWebsiteBookingRequest`: WR8 `new, in_progress, declined, spam → declined` | Đúng như mã |
| Desk, ngăn chi tiết | `WebRequestDrawer.tsx`: `can('erase')` đọc `allowedActions`. Sau khi Đóng, ngăn **vẫn mở**, nhận DTO mới có `erase` | Nút **có**, nhưng nằm **giữa thân ngăn** dưới khối **Liên hệ**. Chân ngăn của yêu cầu đã đóng chỉ còn **Mở lại** |
| Desk, danh sách | `WebRequestsPage.tsx`: lọc mặc định chỉ **Mới** và **Đang xử lý** | Đóng ngăn xong, yêu cầu **biến khỏi danh sách**. Muốn thấy lại phải gõ mã (bỏ qua lọc trạng thái, máy chủ dùng `OR $4 IS NOT NULL`), bật chip **Đã đóng**, hoặc dùng **Tìm theo liên hệ** |

Kết luận: **không có lỗ hổng quyền trong mã.** Người gửi xin xóa sau khi yêu cầu đã đóng thì OWN/MGR/FDL vẫn xóa được, và tìm ra yêu cầu bằng liên hệ của họ.

### 1.2 Vì sao INV không thấy nút

Từ mã, có hai khả năng. SEC không phân biệt được nếu không thao tác lại:
- (a) **Khó tìm (khả năng cao).**
  - INV tìm ở chân ngăn, nơi có "Đóng – không thành đơn" lúc trước. Nút xóa lại nằm giữa thân ngăn.
  - Hoặc INV đóng ngăn và quay lại danh sách. Yêu cầu đã rời lọc mặc định nên không thấy.
- (b) **Lỗi thật chưa thấy trong mã.** Ví dụ phiên Desk lúc đó không mang vai OWN, hoặc ảnh `web` trên production lệch.
  - Ít khả năng: ở bước K, INV vừa bật công tắc chỉ OWN được bật.
  - Ảnh web vẫn là bản `v1.0.0` của sáng 30/10.

**Thiếu test:**
- Test WR8 phía BE (`public-site-r3-bed.test.ts`, "erase (WR8, ARC-16)") xóa từ `in_progress`.
- Test FE (`r3-v1-feb-webreq.test.tsx`) và E2E (`us155-website-requests.r3.spec.ts`) xóa từ `new`/`in_progress`.
- **Không ca nào đi đường "nhân viên đóng → người gửi xin xóa"**, đúng đường INV vừa đi.

### 1.3 Mức độ, hạn sửa, cách tạm

- **Mức rủi ro SEC: Medium.**
  - Quyền xóa của người gửi vẫn còn trong hệ thống.
  - Nhưng nếu nhân viên không tìm ra nút, yêu cầu xóa có thể chậm quá hạn luật định. Nghị định 13/2023 có hạn xử lý yêu cầu xóa; đội hiểu là 72 giờ, **cần luật sư xác nhận**.
- **Lỗi: BUG-R3-056, P2** (FE-B + UXD; BE thêm test). Đích v1.0.1. **Không chặn** form đang chạy.
- **Nâng P1, sửa trước khi nhận yêu cầu thật thứ 2,** nếu QA tái hiện được: tài khoản OWN mở yêu cầu đã đóng mà không có nút.
- **Cách tạm (hiệu lực ngay):**
  1. Hướng dẫn lễ tân/sổ tay: người gửi xin xóa → **Tìm theo liên hệ**, hoặc gõ mã REQ ở ô tìm → mở yêu cầu → cuộn xuống dưới khối **Liên hệ** → **Xóa theo yêu cầu người gửi**.
  2. Lưới an toàn sẵn có: job `web_request.purge` chạy 03:10 hằng ngày, xóa C2 của yêu cầu đã đóng sau `retention.web_request_declined_days`.
     - Tham số này ở migration 0086: mặc định **90 ngày**, khoảng **30–90**, chỉ OWN sửa. Mốc tính từ lần thao tác cuối, tức lúc đóng.
     - Job ghi `purge_journal` với `policy_key = 'T19'`, **không** ghi `dsr_erase`.
     - Đây chỉ là lưới an toàn cho yêu cầu bị quên. **Không thay** cho việc xóa khi người gửi xin. SEC **không** đề nghị hạ 90 xuống 30 chỉ vì lỗi này: hạ thì mất khả năng gọi lại khách đã đóng, mà lỗi sửa được ở giao diện.

## 2. Vì sao kiểm 3 và 14 bằng 0 khi yêu cầu chỉ bị Đóng

**Đóng không xóa dữ liệu liên hệ.**
- Nhánh `decline` chỉ ghi `decline_reason_code`, `decline_note`, `assigned_user_id`.
- Chỉ có 3 đường đặt `pii_purged_at` và xóa C2:
  - WR6 chuyển thành đơn (`website-request.port.ts`): trạng thái `converted`;
  - WR8 (`erase`);
  - job T19: sớm nhất 30 ngày sau khi đóng, hoặc 90–180 ngày sau khi tạo.
- Cả ba đều không xảy ra trong 6 phút từ 17:46 tới 17:52:
  - không có WR8, vì kiểm 4 và 5 FAIL;
  - INV bấm Đóng, không tạo đơn;
  - T19 chưa tới hạn.
- Thêm nữa, ràng buộc `website_booking_request_contact_check` của DB **bắt buộc** dòng chưa xóa phải có `guest_name`, đúng một trong SĐT/email, và `contact_hmac`.

=> Dòng REQ-84EKR1V6 **còn nguyên tên và email**.

**Cột lưu chữ thường, không mã hóa** (`text`). Lệnh đếm tìm `row::text ILIKE '%TEST OTTIMO%'` hoặc `'%info@ottimo.vn%'`, không phân biệt hoa thường.
- Tên qua `normalizeFreeText` (NFC, bỏ ký tự định dạng, gộp khoảng trắng); email qua `normalizeEmail` (cắt khoảng trắng, chữ thường). Cả hai không làm "TEST OTTIMO" hay "info@ottimo.vn" mất khớp.
- Ca 18 trong `publish-privacy-notice.test.sh` đã chứng minh: dòng chưa xóa có hai chuỗi này thì kiểm 3 ra FAIL.

=> Kiểm 3 bằng 0 nghĩa là **tên lưu không chứa "test ottimo" và email lưu không phải "info@ottimo.vn"**. Kiểm 14 bằng 0 nghĩa là "TEST OTTIMO" không có ở bảng nào: chuỗi này **chưa từng được lưu**.

Khả năng (b) trong runbook 8.7 đúng; khả năng (a) ("lối đóng đã xóa một phần") bị loại.

Hệ quả cho bảo mật:
1. **Không còn chắc dòng thử chứa dữ liệu giả.**
   - Tiền đề của SEC ở `SEC-on-OPS-us155-enable.md` mục 3 ý 1 ("dòng thử không chứa dữ liệu cá nhân của ai") **chưa được xác nhận** trên production.
   - Có thể trình duyệt tự điền tên/email thật của người gửi, hoặc INV gõ khác kịch bản. Đây là suy đoán, chưa kiểm.
   - SEC không cần biết giá trị. Chỉ cần INV trả lời có/không (mục 3, C3).
2. **Sáu kiểm "không rò" (6, 7, 8, 10, 11, 13) không có giá trị bằng chứng cho lần gửi này:**
   - Chúng tìm đúng hai chuỗi thử, mà hai chuỗi đó không có trong yêu cầu.
   - Bù lại có hai nguồn:
     - (i) QA chạy cùng ảnh `sha-8b3aec89486f` trên stack thử, gửi yêu cầu có đúng chuỗi thử, chạy WR8 rồi chạy lệnh đếm: **14/14** (`qa3-rc1.md` mục 21–23, REQ-DNWFFR5W);
     - (ii) review mã: thông báo, SSE, audit, `state_transition` không mang C2; `idempotency_key.response_body` chỉ có `refCode`, `promise`.
   - Hai nguồn này đủ để SEC chấp nhận phần "không rò" mà **không** cần gửi thêm một yêu cầu thử trên production. Gửi thêm thì lại tạo thêm dữ liệu.
3. Lần gửi không có email nào đi tới người gửi: form không gửi thư xác nhận, `public-booking.service.ts` không ghi outbox cho khách. Vì vậy liên hệ đã lưu không bị dùng để gửi đi đâu.

## 3. Quyết định về khói L

**Không chấp nhận 11/14. Không dùng hạn lưu tự xóa cho dòng này.**

Lý do:
- (1) WR8 có sẵn cho yêu cầu đã đóng: cách dọn có kiểm soát đã có, không cần công cụ mới.
- (2) Mục đích của L là chứng minh đường WR8 chạy đủ trên production (C2 NULL, `dsr_erase`, audit `security`). 11/14 chưa chứng minh điều đó.
- (3) Tiền đề "dữ liệu giả" không đứng vững (mục 2). Để dữ liệu có thể là thật nằm 90 ngày, tức tới khoảng 29/01/2027 03:10 theo tham số mặc định, là không cần thiết.

**Điều kiện để L đạt:**
- **C1. INV (OWN) chạy WR8 trên Desk.** Mục tiêu trong 31/10, trước bước M.
  - Mở **Yêu cầu từ website** → ô tìm gõ `84EKR1V6` (hoặc bật chip **Đã đóng**) → mở REQ-84EKR1V6.
  - Cuộn xuống dưới khối **Liên hệ** → **Xóa theo yêu cầu người gửi**.
  - Cách xác minh: chọn "Họ liên hệ từ chính SĐT hoặc email trên yêu cầu" (yêu cầu chỉ có email thì chỉ có cách này). Ô liên hệ dán đúng email đang hiện ở khối **Liên hệ** (nút **Sao chép email**). Bấm **Xóa ngay**.
  - Kỳ vọng: toast "Đã xóa dữ liệu của yêu cầu 84EKR1V6", đầu ngăn ghi "Đã xóa theo yêu cầu của người gửi". Dòng dưới ghi "theo hạn lưu" là BUG-R3-055, đã biết.
  - **Không** bấm **Mở lại** trước khi xóa: không cần, và làm sai số liệu.
  - **Không** chụp màn hình khi ngăn còn hiện tên/email. Không gửi giá trị đó vào chat hay repo.
- **C2. OPS chạy lại đúng lệnh L5,** cùng `--ref REQ-84EKR1V6 --since 2026-10-30T17:45:59+07:00`. Đạt khi in `RESULT: OK – 14/14`. Kiểm 12 sẽ tăng thêm 1 dòng lịch sử; không ảnh hưởng.
- **C3. INV trả lời một câu có/không,** không nêu giá trị: "Tên và email trên yêu cầu có đúng là TEST OTTIMO / info@ottimo.vn không?"
  - Nếu **không** (ví dụ trình duyệt tự điền): SEC ghi "dòng thử chứa dữ liệu thật của chính người gửi thử, đã xóa bằng WR8". Không cần làm gì thêm, vì người gửi là INV và đã đồng ý.
  - Lần thử sau trên production: tắt tự điền hoặc dùng cửa sổ riêng tư, và chạy lệnh đếm **trước** WR8 (thẻ 02).
- **C4. Không có lần sửa DB nào ngoài Desk.** Không SQL tay, không `psql` tương tác.
- **Nếu C1 không làm được** vì OWN mở đúng yêu cầu mà vẫn không có nút:
  - Dừng, báo SEC và QA. BUG-R3-056 lên **P1**.
  - SEC chấp nhận L ở mức **đạt có điều kiện**: dòng nằm chờ tới khi bản sửa lên production rồi xóa bằng WR8. Hạn lưu T19 là chặn trên.
  - Vẫn không SQL tay.
- **Bước M** (SEC ghi mốc "bật form" vào decision-log) chỉ làm sau C1–C3.

## 4. Thẻ feedback

### FB-R3-SEC-FEB-SMOKEL-01
- Mức độ: Major
- Vị trí: `apps/admin-web/src/pages/webreq/WebRequestDrawer.tsx` (khối `can('erase')` giữa thân ngăn; chân ngăn của yêu cầu đã đóng); `WebRequestsPage.tsx` (`DEFAULT_STATUSES`); test BE/FE/E2E của WR8
- Vấn đề: trên production, OWN đóng yêu cầu rồi không tìm thấy **Xóa theo yêu cầu người gửi**. Mã vẫn cho xóa, nhưng nút nằm giữa thân ngăn còn yêu cầu thì rời danh sách mặc định. Không có test nào xóa từ trạng thái `declined` do nhân viên đóng (BUG-R3-056).
- Vì sao quan trọng: người gửi xin xóa thường tới **sau** khi khách sạn đã đóng yêu cầu. Nhân viên không tìm ra nút thì việc xóa chậm quá hạn luật định, trái cam kết ở trang `/privacy/`.
- Đề xuất sửa:
  - (1) UXD quyết: đưa nút xóa vào chân ngăn của yêu cầu **Đã đóng/Spam** (cạnh **Mở lại**), hoặc giữ chỗ cũ kèm một dòng chỉ dẫn ở chân ngăn.
  - (2) BE: ca tích hợp `decline` → `erase` (200, `dsr_erase`, audit `security`, `reopen` sau đó 409).
  - (3) FE: ca `declined` + `owner` → có nút; `declined` + `front_desk` → không.
  - (4) E2E: đóng → tìm theo liên hệ → xóa.
  - (5) BA/UXD: sổ tay lễ tân thêm 1 dòng "người gửi xin xóa sau khi đã đóng".
- Trạng thái: Open

### FB-R3-SEC-OPS-SMOKEL-02
- Mức độ: Minor
- Vị trí: `infra/server/us155-smoke-counts.sql` kiểm 3, 6–8, 10–11, 13–14; kế hoạch khói L (`outputs/OPS/us155-enable-plan.md`)
- Vấn đề: các kiểm "không có chuỗi thử" chỉ có nghĩa khi chuỗi thử **thật sự** nằm trong yêu cầu. Lần này tên/email lưu khác chuỗi thử, nên 7 kiểm này ra 0 "OK" mà không chứng minh gì. Lệnh đếm không tự phát hiện được việc đó.
- Vì sao quan trọng: kết quả xanh giả ở một lệnh dùng làm bằng chứng xóa dữ liệu trên production.
- Đề xuất sửa (trước lần dùng lại tiếp theo, không gấp):
  - Thêm chế độ `--before-erase`, chạy **trước** WR8. Đạt khi kiểm 3 = 1, tức dòng có đúng chuỗi thử, đồng thời các kiểm rò khác = 0.
  - Kế hoạch khói ghi bước này trước WR8. Nếu kiểm 3 = 0 ở bước trước: dừng, xóa bằng WR8, rồi gửi lại với đúng chuỗi.
  - Thêm ca test tương ứng vào `publish-privacy-notice.test.sh`.
- Trạng thái: Open

### FB-R3-SEC-SEC-SMOKEL-03 (SEC tự sửa)
- Mức độ: Minor
- Vị trí: `rounds/round-03/reviews/SEC-on-OPS-us155-enable.md` mục 3 ý 1
- Vấn đề: SEC kết luận "dòng thử không chứa dữ liệu cá nhân của ai" dựa trên kịch bản, chưa có bằng chứng sau khi gửi.
- Đề xuất sửa: từ nay mọi tiền đề "dữ liệu giả" trên production phải được xác nhận sau khi gửi (lệnh đếm trước khi xóa, thẻ 02, hoặc INV trả lời có/không), không chỉ dựa vào kịch bản.
- Trạng thái: Open

## 5. Dòng decision-log đề xuất (ORC ghi sau khi đồng ý)

```
| 2026-10-30 | 3 | **SEC – khói L US-155 (REQ-84EKR1V6) 11/14: KHÔNG chấp nhận, không dùng hạn lưu tự xóa** (`rounds/round-03/reviews/SEC-on-us155-smoke-L.md`). Đọc mã `main`: WR8 vẫn làm được với yêu cầu đã Đóng (OWN/MGR/FDL, cả "Tìm theo liên hệ"); Đóng không xóa dữ liệu liên hệ; kiểm 3/14 = 0 vì tên/email lưu khác chuỗi thử (tiền đề "dữ liệu giả" chưa xác nhận). L đạt khi: C1 INV chạy WR8 trên Desk (tìm mã 84EKR1V6, nút dưới khối Liên hệ), C2 OPS chạy lại đúng L5 → 14/14, C3 INV trả lời có/không về chuỗi thử; không SQL tay. Kiểm "không rò" 6–13 chấp nhận theo QA stack thử cùng ảnh (14/14) + review mã. Mở BUG-R3-056 (P2, FE-B + UXD – khó tìm nút xóa ở yêu cầu đã đóng, thiếu test; tái hiện được thì P1). Bước M chờ C1–C3 | SEC | Quyền SEC (mức rủi ro, yêu cầu bảo mật kỹ thuật) |
```

## 6. Điểm làm tốt

- OPS dừng đúng lúc: không truy vấn tay, không tự xóa. Gửi nguyên đầu ra (chỉ số đếm và mã REQ), đọc đúng ba kiểm FAIL là dấu vết của WR8.
- Thiết kế WR8 cho cả trạng thái `declined`, và có "Tìm theo liên hệ" lấy cả yêu cầu đã đóng. Nhờ vậy sự cố này dọn được bằng công cụ có audit, không phải SQL.
- Lệnh đếm có ca test âm (17, 18, 19). Nhờ đó SEC suy ra chắc chắn rằng kiểm 3 = 0 nghĩa là "chuỗi không có", chứ không phải lệnh hỏng.
