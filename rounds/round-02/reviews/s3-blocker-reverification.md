# Kiểm chéo đối kháng lần 2 – 3 Blocker mở lại + Major mới (ORC, workflow reverify-s3-blockers, HEAD 16941c6, 17/10/2026)

| Mục | Góc nhìn | Bác bỏ? | Tin cậy | Gap |
|---|---|---|---|---|
| SEC-BE-32 | correctness | không | medium | 6 |
| SEC-BE-32 | security/privacy | CÓ | high | 7 |
| DOM-BE-13 | correctness | CÓ | medium | 5 |
| DOM-BE-13 | money-edge-cases | CÓ | high | 7 |
| ARC-S3-03/SEC-BE-47 | security/DoS | CÓ | medium | 6 |
| VER-BE-S3-01..05 | money | CÓ | high | 7 |

## Critic

# Phản biện độ đầy đủ, lượt kiểm 2 (HEAD 16941c6)

HEAD hiện tại là 5304fc8, commit sau 16941c6. Commit này chỉ đổi định dạng quốc tịch (ESC-018) và quyền cọc của SAL, không đụng vùng code đang xét. Riêng `registration.service.ts`, các dòng sau :1491 lệch +1 so với 16941c6. Mọi dòng tôi dẫn dưới đây là dòng ở HEAD hiện tại. Tôi chỉ đọc code, không sửa gì. Có một script tái hiện DB-free nằm trong scratchpad: `.../scratchpad/leak.ts`.

## Kết luận từng mục

| Mục | Kết luận | Lý do (1 dòng) |
|---|---|---|
| SEC-BE-32 | **ĐÓNG (Blocker)** | J16 bước 1a đọc trạng thái đơn, không phụ thuộc hook. Đủ 5 trạng thái × checked_out/cancelled/no_show đều có test: `registration-flow.test.ts:1348` và `:1425`. Phần còn lại là Minor, cộng 2 Major mới ngoài phạm vi thẻ. |
| DOM-BE-13 | **Hạ xuống Major** | Lỗi gốc đã đóng: đơn con không còn đảo khoản thu, `extra_person` đã ra khỏi `OTA_COVERED`, bill bỏ số dự phòng `otaNet`. Còn hở: (a) bất biến `ota_collect` = các dòng OTA_COVERED không được giữ khi sửa/hủy dòng hoặc duyệt FOC; (b) đơn OTA thêm người trước khi nhận phòng thì mất phụ thu. |
| ARC-S3-03 / SEC-BE-47 | **VẪN LÀ BLOCKER** | Tôi đã tái hiện được lỗi rò rỉ chỗ upload (verifier để ở mức PLAUSIBLE, nay xác nhận). Chỉ cần 4 request có phiên khách hợp lệ là mọi upload trả 503 vĩnh viễn, tới khi khởi động lại tiến trình. |
| VER-BE-S3-01..05 | **02/03/04/05 ĐÓNG. 01 hạ xuống Major** | Ca 100% của thẻ 01 đã đóng. Nhưng ở bậc 0% và 50%, khi có cọc vượt và một yêu cầu hoàn đang mở, phí hủy vẫn tính trên phần tiền đã hứa hoàn. Hai phát hiện về đơn con là phần tiếp của ARC-S3-01 (BE-A), không thuộc các thẻ VER. |

## SEC-BE-32

| Gap | Thật hay suy đoán | Mức |
|---|---|---|
| Đơn hủy/no-show lấy mốc kết thúc = min(ngày đi dự kiến, now), không dùng `cancelled_at`/`no_show_marked_at`. Chú thích "never later than the truth" sai. Test :1348 còn assert ảnh của đơn hủy ngày 15/10 vẫn sống ngày 26/10. | Thật (`registration.service.ts:1054-1056`, `stay-view.ts:67-72` không trả 2 cột này). Nhưng hook chạy trong cùng giao dịch, nên lỗi chỉ xảy ra với dữ liệu không qua hook. Hiện chưa có dữ liệu thật. | Minor |
| Khi hook không chạy, J16 không void các khai báo còn void được (pre…scanned) nên không đạt hạn 24 giờ của BR-609(b). | Thật, cùng điều kiện với dòng trên | Minor |
| Đơn kẹt ở `confirmed` (không ai bấm no-show) hoặc `in_house` đã quá ngày đi, có ảnh khách tải trước qua link: ảnh không bao giờ được hẹn xóa. | Thật. `:1058` `if (!ended) continue`. Mục no-show trong "Cần chú ý" chỉ hiện đúng ngày đến (`frontdesk/attention-sources.ts:69`). Link khách được cấp từ `confirmed`. | **Major, thẻ mới** (lưu ảnh hộ chiếu vô hạn, trái NĐ 13) |
| Bỏ người khỏi đoàn (A-38) không xóa ảnh khách tự tải qua link. | Thật. `onPartyMemberRemoved` lọc theo `party_member_id` (:1849), còn `guestUpload` không gắn trường này. Test frontdesk chỉ dùng port giả. | **Major, thẻ mới** (thuộc A-38) |
| Khôi phục no-show (K12) không xóa `stay_ended_at`/`delete_after` của khai báo khác void, nên ảnh bị xóa sớm. | Thật (`:1916-1919`) | Minor (xóa sớm, không phải giữ quá hạn) |
| Ảnh của người không đồng ý ở khai báo `confirmed`/`needs_update` bị xóa với lý do `retention`/T02, đúng ra là `no_consent`/T01. | Thật (`retention.service.ts:123-124`) | Minor (sai nhãn kiểm toán) |
| Bước 1a: một savepoint cho cả lô 200, LIMIT không có con trỏ, đơn kẹt chiếm đầu danh sách. | Thật, nhưng ở quy mô 10 căn thì khó chạm 200 | Minor |
| Phần chạy theo giờ không nằm trong savepoint, nên có thể rollback cả lượt. | Suy đoán, chưa có kịch bản lỗi cụ thể | Minor |
| Luồng J1 hủy hold trong worker không có hook. | Thật, nhưng hold chưa có link khách (`guest-portal.service.ts:116`). Tôi chưa thấy đường nào tạo ảnh cho hold. | Suy đoán |
| Đính chính báo cáo trước: TC-L3-060..062 là test mã cửa, không phải test xóa ảnh. | Thật | Không có E2E nào cho việc xóa ảnh. Bằng chứng duy nhất là 2 test tích hợp nêu trên (tính theo lần chạy 2142/2142 của ORC). |

## DOM-BE-13

| Gap | Thật hay suy đoán | Mức |
|---|---|---|
| `adjustFolioLine`, tức `reverseLine` + `insertLine` (`folio-lines.service.ts:467-488`), và `FolioFocService.onDecided` (`foc.service.ts:156-185`) đều không gọi `syncOtaCollect`. Chặn sửa ở ARC-14 chỉ áp cho dòng `room`/`extra_person` khi đơn còn đang ở. Kịch bản: B16 OTA, MGR sửa `early_departure_fee` → B18 báo BALANCE_DUE 450.000. Sửa giá đêm OTA sau khi trả phòng thì folio đã settled lại hiện còn phải thu. | Thật. B18 không đồng bộ lại trước khi kiểm số dư (`checkout.service.ts:403-406`). Chú thích ở `:1004` nói "Re-run after every change of those lines" là sai. | **Major**. Verifier xếp Blocker, tôi hạ vì đây là đường sửa sai, không phải luồng thường. Nên sửa cùng đợt. |
| Đơn OTA thêm người trước khi nhận phòng: 409 bắt lễ tân PATCH `adults` → `repriceExtraPersons` gán phụ thu 0 và không lưu `bookedParty` (`reservations.service.ts:1259-1270`). Sau đó `nightExtra` coi số người hiện tại là số khách OTA (:1826), nên mất 150.000/đêm. | Thật. Nhưng ở R2 chưa có channel manager, nên PATCH đơn OTA còn có thể là khách sửa đơn trên Agoda. Cần DOM chốt quy tắc. | **Major** (chờ DOM) |
| B16 trên đơn OTA đã gia hạn bằng đơn con, khách rời giữa các đêm của đơn con: B16 đơn cha bị DATE_INVALID (`stay.service.ts:1118`), B16 đơn con bị INVALID_TRANSITION (:1356), B18 bị INVALID_TRANSITION (`checkout.service.ts:291`). Không có cách nào trả phòng. | Thật, đã kiểm lại cả 3 điểm chặn | **Major, thẻ mới** (BE-A, ARC-BE-S3-05) |
| B14 đơn OTA ghi một dòng `room_change_difference` gộp cho mọi đêm chuyển (`stay.service.ts:960-981`). B16 sau đó không đảo phần của đêm bị bỏ, trái BR-424. | Thật. Có đường vòng: MGR sửa dòng bằng tay. | **Major, thẻ mới** |
| Hủy đơn OTA: `retainedVnd` luôn 0, `otaPenaltyVnd` không được ghi lên folio. | Thật (`:2427-2434`). No-show OTA = 0 là có chủ đích (chú thích BR-311, `:3135`). Ảnh hưởng là báo cáo doanh thu, không phải tiền của khách. | Minor (cần DOM chốt BR-310) |
| B16 đơn OTA: phụ thu người đã thu tại quầy của các đêm bỏ không tạo yêu cầu hoàn ở B16 (`stay.service.ts:1148`, `:1291`). | Thật. Tiền không mất, vì B18 bắt buộc chọn cách xử lý tiền dư. | Minor |
| Đơn tạo trước 0042 chưa được backfill. Nhánh dự phòng ở `folio.service.ts:336` vẫn còn. | Thật, chưa có dữ liệu thật | Minor (phải làm trước khi staging nhận dữ liệu) |
| Đổi nhóm tuổi trên đơn OTA làm nhãn bill dùng `count` cũ. | Chưa kiểm | Suy đoán, Minor |

## ARC-S3-03 / SEC-BE-47

**Tôi đã tái hiện rò rỉ chỗ.**
- Cách làm: dựng `createHttpAdapter` thật trên socket thật. Hàm kiểm phiên giả mất 5 ms, gần với độ trễ DB thật. Client gửi header cùng một phần thân rồi đóng kết nối ngay.
- `uploadsInFlight()` tăng 1 sau mỗi request như vậy và không bao giờ giảm. Sau 4 lần, 3 giây sau vẫn là 4, và một upload hợp lệ nhận `503`.
- Nguyên nhân: `http.ts:147-158` lấy chỗ trong `.then()` của hàm kiểm phiên mà không xét request đã bị hủy chưa. `onRequestAbort` đã chạy lúc chỗ chưa được gán. `readBody` chờ trên một luồng đã destroy nên không bao giờ kết thúc.
- Hậu quả: một khách đặt phòng bất kỳ (có link), hoặc mạng di động chập chờn theo thời gian, sẽ khóa hết upload. Upload giấy tờ khai báo lưu trú là nghĩa vụ pháp lý.

| Gap | Thật hay suy đoán | Mức |
|---|---|---|
| Rò rỉ chỗ khi client hủy lúc đang kiểm phiên | **Thật, đã tái hiện** | **Blocker** |
| Cổng 4 chỗ dùng chung toàn tiến trình, không chia theo phiên/IP. Thân gửi chậm giữ chỗ tới khoảng 60 s. Giới hạn số lần trong controller không đếm được các request này. | Thật (`upload-gate.ts`, `http.ts:153`) | Major |
| Kiểm phiên không gắn với route: cookie khách được giữ chỗ trên route của nhân viên | Thật (`upload-session.check.ts:43-85`) | Minor (gộp vào phần sửa công bằng) |
| Thân chunked dùng `Buffer.concat`, đỉnh khoảng 2× | Thật, có trần | Minor |
| Các test dùng `inject`, không có test trên socket thật | Thật. Chính vì vậy lỗi rò rỉ lọt qua. | Major (test) |

## VER-BE-S3-01..05

| Gap | Thật hay suy đoán | Mức |
|---|---|---|
| B10: phí hủy = `depositPaid − hoàn` (`pricing.ts:226-227`), tính cả phần cọc đang có yêu cầu hoàn mở và phần cọc vượt giá trị đơn. Với cọc 1,5tr cho đơn 1tr và yêu cầu hoàn 500k đang mở: bậc 0% thu phí 1,5tr và 500k không chi được; bậc 50% có tổng yêu cầu 1,25tr trong khi số dư thừa chỉ 750k. | Thật. Cọc vượt được phép với FD+ kèm ghi chú (`deposits.service.ts:151-159`). Test :2612 chỉ phủ ca 100%. | **Major** (thẻ 01 chưa đóng hết) |
| `syncChildrenParty` thu thêm phụ thu cho đêm của đơn con vượt số đã báo và đã xác nhận: báo 150k, ghi 300k. | Thật. Chính test `frontdesk-s3-fixes.test.ts:743-749` cho thấy điều này. | Major (BE-A, phần tiếp ARC-S3-01) |
| Thêm người vào ngày chỉ còn đêm của đơn con: đơn cha bị 422 (`party.service.ts:216`), đơn con không có `reservation_guest` nên `changed=false` và mất phụ thu. | Thật (`:240-256`) | Major (BE-A, gap cũ của ARC-S3-01 mới đóng một nửa) |
| Đọc yêu cầu hoàn mở lúc hủy mà không khóa folio | Thật, nhưng tiền vẫn được trần chi ở payOut chặn | Minor |

## Việc cần giao lại (chỉ cho gap thật)

| Vai | File | Việc |
|---|---|---|
| **BE-C (Blocker)** | `src/http.ts` (`readMultipart`, `readBody`), `src/modules/files/public/upload-gate.ts`, `src/modules/files/internal/upload-session.check.ts`, `test/integration/files-attachments.test.ts` | (1) Sau khi kiểm phiên xong, nếu request đã hủy/destroy thì không lấy chỗ. `readBody` nghe thêm `close`/`aborted` để kết thúc với lỗi và trả chỗ. (2) Giới hạn chỗ theo phiên (≤1–2) và theo IP. (3) Cookie khách chỉ được dùng cho route khách, cookie nhân viên chỉ cho route nhân viên. (4) Test trên socket thật (`listen` + `net.connect`, theo mẫu `leak.ts`): hủy lúc đang kiểm phiên thì `uploadsInFlight()=0`; một phiên giữ thân chậm không chặn được phiên khác. |
| BE-C + BE-A | `reservations/public/stay-view.ts`, `registration.service.ts` (`scheduleEndedStays`, `onReservationRestored`), `retention.service.ts`, `registration-flow.test.ts:1348` | Stay view trả thêm `cancelledAt`/`noShowMarkedAt`; J16 dùng chúng làm mốc kết thúc và void các khai báo còn void được. Sửa assert ở test :1348. Thêm nhánh cho đơn `confirmed`/`in_house` đã quá ngày đi N ngày, kèm mục "Cần chú ý" và test. K12 xóa `stay_ended_at`/hạn xóa của khai báo chưa xác nhận. Mỗi registration một savepoint, có con trỏ. Ghi đúng lý do `no_consent`. |
| BE-C + BE-A (A-38) | `registration.service.ts:1845` (`onPartyMemberRemoved`), `guestUpload` | Gắn `party_member_id` cho giấy tờ khách tự tải (hoặc khớp theo người/`person_index`). Test tích hợp với port thật, kiểm DEK bị hủy và tệp bị xóa. |
| BE-B | `folio/public/folio.service.ts` (`reverseLine`/`insertLine`), `folio/internal/foc.service.ts`, `folio-lines.service.ts` | Gọi `syncOtaCollect` sau mọi lần sửa dòng OTA_COVERED, hoặc dòng FOC/giảm giá gắn với dòng đó. Test: B16 OTA, MGR sửa phí rồi B18 trả 200; FD hủy dòng thì "Đã thu qua" đúng. |
| BE-B | `reservations.service.ts:2439-2468` (`cancellationQuote`), `payments-s3.test.ts` | Cơ sở tính phí = `depositPaid − yêu cầu mở`, phí không vượt giá trị đơn. Test bậc 0% và 50% có cọc vượt và yêu cầu hoàn mở: tổng yêu cầu ≤ số dư thừa sau hủy. |
| BE-B | migration 0043–0049 | Backfill `ota_collect` cho đơn tạo trước 0042, làm trước khi staging nhận dữ liệu (Minor). |
| BE-A | `reservations.service.ts` (tạo đơn OTA, `repriceExtraPersons`) | Lưu `bookedParty` ngay khi tạo đơn OTA. PATCH chỉ đổi `bookedParty` khi đó là sửa đơn OTA (theo quy tắc DOM chốt). Test: Agoda căn 201, 2→3 người trước khi nhận phòng → thu 150k/đêm tại quầy. |
| BE-A | `frontdesk/internal/stay.service.ts` (B16, B14), `checkout.service.ts` | B16 bỏ được đêm của đơn con (ngày đi mới tính theo ngày đi hiệu lực). Chênh lệch đổi phòng OTA ghi theo từng đêm, hoặc B16 đảo phần của đêm bỏ. Test: OTA 01–03 + đơn con 03–05, khách rời ngày 04; B14 rồi B16. |
| BE-A | `frontdesk/internal/party.service.ts:216-306` | Bản tính thử và `expectedSurchargeVnd` gồm cả đêm của đơn con. Có đường thêm người khi chỉ còn đêm của đơn con. Có test. |
| DOM | Quy tắc | Chốt 4 điểm: (1) PATCH số khách của đơn OTA là sửa đơn hay là thêm người; (2) FOC trên đêm OTA trả trước; (3) BR-310 có ghi tiền phạt OTA lên folio không; (4) B16 OTA có hoàn phụ thu người tại B16 không. |
| QA | `tests/e2e` | Thêm ca E2E xóa ảnh của khai báo chưa xác nhận (hiện chưa có), hoặc ghi rõ việc chấp nhận bằng chứng tích hợp. |

Đường dẫn liên quan:
- `/Users/anhvh/Desktop/hotel-app/product/services/api/src/http.ts`
- `/Users/anhvh/Desktop/hotel-app/product/services/api/src/modules/registration/internal/registration.service.ts`
- `/Users/anhvh/Desktop/hotel-app/product/services/api/src/modules/folio/public/folio.service.ts`
- `/Users/anhvh/Desktop/hotel-app/product/services/api/src/modules/reservations/internal/reservations.service.ts`
- `/Users/anhvh/Desktop/hotel-app/product/services/api/src/modules/frontdesk/internal/party.service.ts`
- `/Users/anhvh/Desktop/hotel-app/product/services/api/src/modules/frontdesk/internal/stay.service.ts`
- Script tái hiện: `/private/tmp/claude-501/-Users-anhvh-Library-Application-Support-Claude-scratch-workspaces-00554cf2-3678-4864-82b0-830aaeaa97bd-4c0caebe-be05-49c5-a5a2-5bf357fddc6a-scratch-2026-10-15-c4f0d4/36df3adc-c586-471c-a039-340d2b696728/scratchpad/leak.ts`

## Chi tiết

### SEC-BE-32 – correctness
- Bằng chứng: Kiểm ở HEAD 16941c6, chỉ đọc. Unit DB-free be-c-s3-units + registration-rules chạy xanh (39/39), nhưng không unit nào phủ scheduleEndedStays. Phần tích hợp dựa vào kết quả ORC đã chạy (api 2142/2142).

Kết luận: không dựng được kịch bản nào khiến một đơn đã kết thúc (checked_out/cancelled/no_show) có ảnh còn sống, chưa có hạn, mà không được J16 lên lịch. Cả 5 gap của báo cáo trước đều có code và test tên cụ thể.

**Code: J16 nay độc lập với hook**
- `product/services/api/src/modules/registration/internal/retention.service.ts:109-118`: bước 1a chạy theo giờ, TRƯỚC bước xóa đến hạn (:121-129). Bước 1a gọi `regs.scheduleEndedStays`.
- `registration.service.ts:1028-1065` (`scheduleEndedStays`):
  - Ứng viên là mọi registration khác `void`, không `legal_hold`, còn ảnh có `deleted_at IS NULL AND delete_after IS NULL`. Điều kiện này không phụ thuộc `stay_ended_at`.
  - Trạng thái đơn đọc qua `readStays` → `reservations/public/stay-view.ts:110-122` (`SELECT r.status`, `actual_checkout_at`) với SYSTEM_ACTOR, nên `ownScopeSql` = null.
  - `checked_out` → mốc kết thúc = `actualCheckoutAt`.
  - `cancelled`/`no_show` → mốc kết thúc = min(ngày đi dự kiến + `checkout_time`, now).
  - Sau đó gọi `scheduleAfterStay` (:1067-1101):
    - Chưa xác nhận: mọi ảnh sống nhận `LEAST(COALESCE(delete_after, until), until)`, với until = mốc kết thúc + `id_image_unconfirmed_max_days`.
    - `AFTER_CONFIRMED` (`confirmed`/`needs_update`/`updated`, :130): người giữ ảnh → T02; người bỏ → `endedAt`.
  - Sau lời gọi này không còn ảnh nào giữ `delete_after` NULL, vì `guest_document_id` NOT NULL (`schema/registration.ts:260`) và ảnh của giấy tờ bị gỡ đã bị xóa ngay ở `onPartyMemberRemoved`.
- Reservation chỉ có 6 trạng thái (`schema/reservations.ts:187`), nên 3 trạng thái kết thúc đều được phủ.
- Thêm một bằng chứng cho thấy độc lập là cần: worker J1 tạo `new ReservationHooks()` không có listener (`reservations/public/worker-jobs.ts:48`). Đơn hold bị J1 hủy trong worker không hề chạy hook registration, và giờ chỉ có J16 1a bắt được ca này.

**Test cho từng gap cũ**
1. Dữ liệu trước 0053 / hook không chạy, và đủ các trạng thái pre/partial/review/scanned/sent kết thúc bằng checked_out/cancelled/no_show: `test/integration/registration-flow.test.ts:1348` 'SEC BE-32 reopened: J16 reads the BOOKING state – no hook ran, stay_ended_at NULL; pre/partial/review/scanned/sent; checkout, cancel, no-show'.
   - Đơn được kết thúc bằng SQL trực tiếp (`test/helpers/registration-fixture.ts:94-112`), không qua hook.
   - Test assert `stay_ended_at` NULL và `delete_after` NULL trước khi chạy J16.
   - Ngày 6: mọi ảnh đã có hạn nhưng chưa bị xóa. Ngày 7 + 1 phút: đều đã xóa với lý do `unconfirmed`.
2. Nhánh 2a cũ đã bị bỏ, thay bằng 1a có test như mục 1.
3. Endpoint thật: `registration-flow.test.ts:1425` 'SEC BE-32 reopened: real cancel endpoint → deadline; real checkout endpoint → T02; an image added after checkout (needs_update) still gets deleted'.
   - `POST …/actions/cancel` → hạn = T0 + 7 ngày.
   - `POST …/actions/check-out` → T02 = T0 + 30 ngày.
4. `needs_update`: cùng test :1425.
   - Thêm giấy tờ người 2 sau trả phòng → trạng thái `needs_update`, đúng 1 ảnh chưa có hạn.
   - Chạy J16: ảnh đó bị xóa, ảnh của người đồng ý được giữ, không còn ảnh NULL. Bước 1a và bước xóa xảy ra trong cùng một lượt.
5. Mốc ±1 phút, purge_journal, c3_access_log, legal_hold, mục "Cần chú ý" vẫn được phủ ở :876 'SEC BE-32: a declaration never confirmed – images go 7 days after the stay ended (checkout / cancel), legal hold keeps them'.

Các lỗi còn lại tôi tìm được đều Minor, hoặc nằm ngoài tuyên bố (xem gaps). Không lỗi nào làm một đơn đã kết thúc bị bỏ sót lịch xóa.
- Gap:
  - Tuyên bố 'luôn không muộn hơn sự thật' (chú thích ở registration.service.ts:1018-1026 và phản hồi BE-C) là SAI với đơn hủy bị phát hiện muộn. J16 dùng min(ngày đi dự kiến, now) dù `reservation.cancelled_at` luôn có (CHECK ở schema/reservations.ts:214); stay view chỉ không đưa cột này ra. Chính test :1348 cho thấy điều đó: đơn `partial` bị hủy lúc T0 = 15/10 09:00, nhưng ảnh vẫn được assert là còn sống lúc 26/10 12:00 (11 ngày sau khi hủy), và đến 27/10 12:00 mới bị xóa. Hook sẽ cho hạn 22/10. Khi hệ thống chạy ổn định, J16 chạy mỗi giờ nên độ lệch ≤ 55 phút. Với dữ liệu cũ hoặc khi J16 ngừng chạy, ảnh bị giữ thêm tới 7 ngày kể từ lúc phát hiện. Mức Minor, vì hiện chưa có dữ liệu thật.
  - Khôi phục no-show (BR-315, K12) không xóa `stay_ended_at`, và cũng không bỏ hạn xóa đã đặt: `onReservationRestored` thoát ngay khi registration khác `void` (registration.service.ts:1916-1919). Khai báo đang `sent`, bị đánh dấu no-show rồi được khôi phục → ảnh vẫn bị xóa vào ngày no-show + 7, dù khách đã vào ở. Nếu sau đó K7 xác nhận, T02 lại tính từ mốc no-show cũ, vì `scheduleRetention` dùng `reg.stay_ended_at` và `scheduleAfterStay` giữ nguyên giá trị cũ bằng COALESCE. Hậu quả là xóa sớm, không phải giữ quá hạn. Đây là lỗi đúng-sai mới do cột `stay_ended_at` sinh ra, và không có test.
  - Ghi sai lý do xóa: ảnh của người KHÔNG đồng ý trong khai báo `confirmed`/`needs_update`/`updated` được đặt hạn = lúc hết lưu trú, rồi bị bước xóa đến hạn ghi lý do `retention` (retention.service.ts:123-124). Kéo theo `purge_journal` ghi policy T02 (POLICY_OF ở registration.service.ts:108-117), c3_access_log ghi reasonCode `retention` và retention_run cộng vào T02, thay vì `no_consent`/T01. Phản hồi nói ca needs_update bị xóa vì 'không đồng ý', nhưng test :1425 chỉ đếm số ảnh, không assert lý do.
  - Bước 1a chỉ có MỘT savepoint cho cả lô 200 registration, sắp `ORDER BY x.id LIMIT 200` (registration.service.ts:1029-1036; retention.service.ts:114-116). Chú thích đầu file nói 'mỗi mục có savepoint riêng' là sai với bước này. Hai hệ quả:
  - Một dòng lỗi lặp lại sẽ làm hỏng toàn bộ bước 1a mỗi giờ.
  - Các đơn chưa ở trạng thái kết thúc nhưng có ảnh chưa có hạn vẫn chiếm chỗ trong LIMIT. Ví dụ đơn `confirmed` đã quá ngày đi mà lễ tân không đánh dấu no-show (BR-311 là thao tác tay), hoặc đơn `in_house` quên trả phòng.
  Với quy mô 10 căn thì khó chạm tới 200 nên khả năng xảy ra thấp. Riêng ảnh của các đơn bị 'bỏ quên' như vậy thì không bao giờ được lên lịch xóa; việc này ngoài phạm vi checked_out/cancelled/no_show của thẻ, chỉ ghi nhận.
  - Độ phủ test còn hở:
  - Không có ca J16-only (không qua hook) cho khai báo `confirmed`/`updated` mà T02 phải tính từ `actualCheckoutAt`.
  - Ở ca needs_update, ảnh của người đồng ý không được assert giá trị hạn sau khi J16 chạy lại `scheduleRetention`.
  - Không có no-show qua endpoint thật; chỉ có hủy qua endpoint.
  - Test trả phòng thật đặt `in_house` bằng SQL thay vì nhận phòng thật.
  - Không test luồng J1 hủy hold trong worker, nơi không có hook nào.
  - Ca 1a dùng `force: true`; không có test bước 1a chạy qua cổng chặn theo giờ ở một tick bình thường.
  - Hai test SEC-BE-32 mới cần DB. Tôi không tự chạy được (chỉ đọc, không docker), nên dựa vào lần chạy tại máy của ORC. Chưa thấy CI ở HEAD 16941c6. E2E không có ca nào cho ảnh khai báo chưa xác nhận: TC-L3-060..062 mà critic dẫn thật ra là test mã cửa, không liên quan việc xóa ảnh.

### SEC-BE-32 – security/privacy
- Bằng chứng: Kiểm ở HEAD 16941c6, chỉ đọc code và test, không chạy DB.

PHẦN ĐÃ ĐÓNG so với báo cáo trước (có code và test):
- J16 bước 1a không còn dựa vào `stay_ended_at`. `scheduleEndedStays` (registration.service.ts:1028-1065) đọc trạng thái đơn qua `readStays`; retention.service.ts:113-118 chạy bước này TRƯỚC bước xóa đến hạn.
- Dữ liệu trước 0053 và ảnh thêm sau trả phòng ở đơn `checked_out` được bắt.
- Test registration-flow.test.ts:1348 'SEC BE-32 reopened: J16 reads the BOOKING state…' phủ 5 trạng thái pre/partial/review/scanned/sent, với `checked_out`/`cancelled`/`no_show`, không qua hook.
- Test :1425 'real cancel endpoint → deadline; real checkout endpoint → T02; an image added after checkout (needs_update)…' đi qua endpoint thật.
- Hook chạy trong cùng giao dịch (reservation-hooks.ts:3-4), nên "hook lỗi" thì nghiệp vụ cũng rollback.

VẪN BÁC BỎ ĐƯỢC. Có 3 kịch bản cụ thể, đều có dẫn chứng code.

(1) Lưới J16 tính mốc kết thúc SAI (muộn hơn sự thật) với đơn cancelled/no_show, và chính test khẳng định điều đó.
- registration.service.ts:1054-1056 lấy `ended = min(ngày đi dự kiến 12:00, now)`.
- Chú thích ở :1023-1025 nói mốc này "never later than the truth". Điều đó sai:
  - Đơn bị hủy hoặc đánh dấu no-show luôn trước khi nhận phòng, nên `cancelled_at` / `no_show_marked_at` sớm hơn ngày đi dự kiến.
  - Còn `now` (lúc J16 phát hiện) thì luôn muộn hơn lúc hủy.
- Bảng `reservation` có sẵn `cancelled_at` (schema reservations.ts:120, CHECK :214 bắt NOT NULL) và `no_show_marked_at` (:127). Nhưng stay view (stay-view.ts:67-72) không trả hai cột này.
- Test :1348 tự chứng minh vi phạm:
  - Đơn `partial` bị hủy qua `setStayStatus` (:1369), với `cancelled_at = T0 = 15/10 09:00` (registration-fixture.ts:106, tenant.ts:13).
  - Lượt chạy ngày 26/10 (:1397-1408) assert ảnh CÒN SỐNG, tức 11 ngày sau khi hủy.
  - Ảnh chỉ bị xóa ngày 27/10 12:01 (:1409-1410).
  - Hạn đúng: theo BR-609(b), khai báo `partial` của đơn bị hủy phải void và xóa ngay, chậm nhất 24 giờ (16/10). Ngay cả trần 7 ngày của SR-RET-02 cũng chỉ tới 22/10.
  - Ca `sent` + no_show (:1374) cũng vậy: no-show đánh dấu ngày đến 15/10 nên hạn là 22/10, nhưng J16 cho tới 27/10.
- Thêm nữa, J16 không void khai báo VOIDABLE của đơn đã hủy mà chỉ hẹn +7 ngày. Hạn trên T01 24 giờ vì thế bị bỏ qua.
- Đơn hủy sớm có ngày đi ở tương lai thì mốc = lúc J16 phát hiện, tức hạn = lúc phát hiện + 7 ngày, muộn hơn lúc hủy + 7 ngày.
- Vậy đề xuất (2) của thẻ gốc, "đơn cancelled/no_show quá 7 ngày → xóa", không được bảo đảm.

(2) Đơn kẹt ở `confirmed` (khách không đến, lễ tân không bấm no-show) giữ ảnh vô thời hạn.
- BR-311: no-show "không tự động". Không có job nào chuyển đơn sang no_show (grep jobs).
- Link khách được cấp từ `confirmed` (guest-portal.service.ts:116). `guestUpload` (registration.service.ts:1984-2050) lưu ảnh với `delete_after` NULL.
- `scheduleEndedStays` coi `confirmed` là "đang ở", vì `if (!ended) continue` (:1058). T01 và bước "đến hạn" đều không bắt.
- Nguồn "Cần chú ý" `registration_due` chỉ tính đơn có ngày đến = hôm nay (attention-sources.ts:35-36). Sang ngày hôm sau, đơn này biến mất khỏi mọi danh sách.
- Ví dụ: đơn 20–22/10, khách tải hộ chiếu ngày 18/10 và từ chối P02b, rồi không đến. Không ai bấm gì, ảnh nằm mãi. Không có test nào cho ca này.

(3) Bỏ người khỏi đoàn không xóa ảnh do khách tự tải.
- `onPartyMemberRemoved` chỉ lọc giấy tờ theo `d.party_member_id === memberId` (registration.service.ts:1848).
- `guestUpload` không bao giờ gắn `party_member_id` (:2016-2033). `updateDocument` chỉ gắn khi lễ tân tự chọn (:665).
- Nên khi bỏ người 3 (party.service.ts:567), ảnh người 3 đã tải qua link vẫn sống và đi theo lịch thường (nếu đồng ý: trả phòng + 30 ngày), trái với A-38 "xóa ngay".
- Đường bỏ người không có test tích hợp nào kiểm ảnh bị xóa thật: grep 'party_removed' trong test/ không có kết quả; frontdesk.test.ts:67/659 chỉ ghi lại lời gọi vào port giả.

Không có unit test DB-free nào cho retention. Chỉ có hai test tích hợp nêu trên.
- Gap:
  - Mốc kết thúc của đơn cancelled/no_show trong J16 (registration.service.ts:1054-1056) dùng min(ngày đi dự kiến, now) thay cho `reservation.cancelled_at` / `no_show_marked_at`, nên luôn muộn hơn sự thật. Test registration-flow.test.ts:1348 còn assert ảnh của đơn hủy ngày 15/10 vẫn sống ngày 26/10 (:1397-1408). Cần: stay view trả thêm hai cột đó; J16 dùng chúng làm mốc; sửa assert để ảnh mất trước 22/10.
  - J16 không void khai báo VOIDABLE (pre/partial/review/scanned) của đơn cancelled/no_show khi hook không chạy, mà hẹn +7 ngày. Hạn trên của BR-609(b) là void cộng tối đa 24 giờ. Chưa có test kiểm hạn này.
  - Đơn kẹt ở `confirmed` hoặc `in_house` sau ngày đi (không đánh dấu no-show, quên trả phòng) có ảnh tải trước qua guest-portal: J16 không bao giờ hẹn hạn (`if (!ended) continue`, :1058), và không có mục 'Cần chú ý' nào. Cần một nhánh dựa vào ngày đi dự kiến đã qua N ngày, kèm test.
  - Bỏ người khỏi đoàn (A-38) không xóa ảnh do khách tải qua guest-portal, vì giấy tờ này không có `party_member_id` (registration.service.ts:1848, :2016-2033). Không có test tích hợp nào chứng minh `party_removed` thực sự hủy DEK và tệp; các test frontdesk chỉ dùng port giả.
  - Truy vấn của `scheduleEndedStays` (:1029-1036) không loại đơn đang ở. Thứ tự ORDER BY x.id LIMIT 200 không có con trỏ, và các đơn kẹt ở (2) tích tụ vĩnh viễn ở đầu danh sách, nên có thể làm đói lưới an toàn. Toàn bộ lô còn nằm trong 1 SAVEPOINT: một dòng lỗi hoặc một lần quá lock_timeout 10 giây sẽ rollback cả 200 dòng.
  - Phần theo giờ của J16 (bước 3, 5 và nhật ký J16) không nằm trong SAVEPOINT. Nếu lỗi kéo dài ở đây, toàn bộ lượt bị rollback, kể cả các lần xóa ảnh ở bước 1, và vì không có dòng J16 nên tick nào cũng là 'hourly' và lặp lại lỗi. Chỉ phát hiện được qua cảnh báo 26 giờ. Chưa có test.
  - Chưa kiểm được kết quả E2E TC-L3-060..062 ở HEAD (lần trước đỏ vì DEVICE_NOT_TRUSTED). Việc 2142/2142 test api xanh không phủ các kịch bản (1)–(3) ở trên.

### DOM-BE-13 – correctness
- Bằng chứng: Kết luận: bác bỏ. Chuỗi lỗi Blocker cũ đã được đóng, có code và test làm bằng chứng. Nhưng điều kiện "phụ thu người thu tại quầy" vẫn hỏng ở một luồng thật, và một gap của báo cáo trước vẫn còn mở.

**A. Các gap cũ đã đóng (code + test cụ thể)**

1. Đơn con không còn đảo khoản thu của đơn cha.
   - Code: `folio.service.ts:1021-1028`. Truy vấn `live` của `syncOtaCollect` đã lọc thêm `reservation_id = $2`. Đơn con kênh Trực tiếp không có khoản thu riêng, nên hàm thoát luôn ở dòng 1029.
   - `moneyPosition` (`folio.service.ts:322-339`) chỉ dùng tiền OTA để trả các dòng OTA_COVERED của chính đơn có khoản `ota_collect`.
   - Test, gia hạn B13: `ota-prepaid-flow.test.ts:177` "B13 extension (direct child) keeps the OTA receipt…". Khoản thu 1.800.000 giữ nguyên, B18 chỉ thu `childNight`, bill có `otaPrepaidVnd` 1.800.000.
   - Test, B9a và E05-11: `ota-prepaid-flow.test.ts:215` "B9a prior night + a person above the OTA count … + E05-11…".
   - Các test này xanh theo bằng chứng ORC (api 2142/2142). Tôi không chạy được test tích hợp vì cần DB.
2. `extra_person` đã ra khỏi `OTA_COVERED`.
   - Code: `folio.service.ts:47-52`.
   - Test 215 kiểm `balanceDueVnd = rate + extra` và khoản `ota_collect` không đổi.
3. Bill không còn dùng `otaNet` làm số dự phòng.
   - Code: `bill.service.ts:138` (`paidOtaVnd > 0`) và `:150`.
   - Test: `payments-s3.test.ts:1420`. Khi chưa có khoản thu hệ thống, `otaPrepaidNote` là null và dòng tiền phòng vẫn được in.
4. Unit test `be-b-s3-units.test.ts`: 14/14 xanh, tôi đã tự chạy.

**B. Kịch bản vẫn làm hỏng "phụ thu thu tại quầy"**

- Đơn Agoda `ota_prepaid`, căn 201 (định mức 2), 2 người lớn, 10–12/11.
- Ngày đến, trước khi nhận phòng (đơn còn `confirmed`), lễ tân thêm người lớn thứ 3 qua POST /party. API trả 409 `INVALID_TRANSITION` "update the guest counts of the booking first (updateReservation)" (`party.service.ts:266-270`).
- Lễ tân làm theo, PATCH `adults=3`. Vì đơn chưa `in_house`, code gọi `repriceExtraPersons` (`reservations.service.ts:1153`). Hàm này gán `charged=false` cho OTA (dòng 1259) và `extraPersonFeePerNightVnd = 0` (dòng 1264). Nó không lưu `bookedParty`.
- Sau đó `nightExtra` lấy số khách OTA dự phòng = số người hiện tại, là 3 (`reservations.service.ts:1826`). Lần ghi `bookedParty` đầu tiên khi đang ở cũng ghi giá trị đã bị đẩy lên 3 (dòng ~1948).
- Kết quả: folio không bao giờ có dòng `extra_person`, B18 số dư 0, quầy thu thiếu 150.000 × 2 = 300.000.
- Điều này trái EP02 (mục thêm người, dòng 268-270): thêm người vượt số đã khai thì `updateReservation`, và "Đơn OTA… phụ thu chỉ khi số người thực tế vượt số khách trên đơn OTA".
- Không có test nào cho ca OTA thêm người trước khi nhận phòng.

**C. Hệ quả cũ chưa sửa theo quyết định DOM 17/10 (B16 trả phòng sớm)**

- `stay.service.ts:1148`: `droppedFeesVnd = ota ? 0`. Dòng 1292: chỉ đơn không phải OTA mới tạo yêu cầu hoàn.
- Phụ thu người của đơn OTA giờ là tiền thu tại quầy. Khách đã trả tại quầy rồi trả phòng sớm (B16) thì phụ thu của các đêm bỏ thành tiền dư mà không có yêu cầu hoàn nào ở B16.
- Điều này trái BR-428 ("phụ thu người của các đêm bỏ hoàn 100%… bằng một yêu cầu hoàn"). Việc xử lý bị đẩy sang `overpaymentHandling` ở B18.

**D. Gap của báo cáo trước vẫn mở**

- Đơn tạo trước 0042 chưa được backfill (BE-B ghi Deferred).
- Nay bill không còn số dự phòng, nên một đơn như vậy mà không có lần đồng bộ đêm nào sẽ bị B18 báo `BALANCE_DUE` toàn bộ tiền phòng OTA.
- Fallback `folio.service.ts:336` ("OTA money pays the whole folio" khi khoản thu thiếu `reservation_id`) vẫn còn. Đây là nhánh dự phòng cho dữ liệu cũ.
- Gap:
  - Đơn OTA thêm người trước khi nhận phòng: party.service.ts:266-270 bắt PATCH số khách → repriceExtraPersons (reservations.service.ts:1259-1264) gán phụ thu 0 và không lưu bookedParty → nightExtra (dòng 1826) lấy số người hiện tại làm số khách OTA. Người vượt số khách OTA không bao giờ bị thu tại quầy (ví dụ Agoda 201, 2→3 người lớn, thu thiếu 300.000). Không có test.
  - B16 đơn OTA: stay.service.ts:1148 vẫn đặt droppedFeesVnd = 0 và dòng 1292 bỏ qua yêu cầu hoàn với OTA. Phụ thu người đã thu tại quầy của các đêm bỏ không được hoàn theo BR-428 bằng một yêu cầu ở B16 mà bị đẩy sang overpaymentHandling ở B18. Đây là hệ quả của việc đưa extra_person ra khỏi OTA_COVERED mà chưa sửa theo. Không có test.
  - Gap của báo cáo trước chưa đóng: đơn ota_prepaid tạo trước 0042 chưa được backfill ota_collect (Deferred). Nay bill không còn otaNet nên B18 sẽ đòi toàn bộ tiền phòng OTA nếu không có lần đồng bộ đêm nào. Nhánh dự phòng của moneyPosition cho khoản thu thiếu reservation_id (folio.service.ts:336) vẫn để tiền OTA trả cả folio.
  - Không tự chạy được test tích hợp (cần DB). Các ca ota-prepaid-flow.test.ts:177/215 và payments-s3.test.ts:1420 được tính là xanh dựa trên bằng chứng ORC (2142/2142), không phải do tôi chạy.
  - Không có test nào cho tổ hợp đơn OTA gia hạn B13 trước rồi thêm người (syncChildrenParty), cũng không có test đổi phòng B14 sau khi thêm người cho đơn ota_prepaid. Hai luồng này không được ota-prepaid-flow kiểm.

### DOM-BE-13 – money-edge-cases
- Bằng chứng: Kiểm ở HEAD 16941c6. Thư mục gốc: /Users/anhvh/Desktop/hotel-app/product/services/api.

**A. Ba gap của lần trước đã đóng thật (có code và test)**
1. `syncOtaCollect` đã lọc thêm `reservation_id` (src/modules/folio/public/folio.service.ts:1020-1027). Đơn con kênh Trực tiếp không còn đảo khoản `ota_collect` của đơn cha.
2. `OTA_COVERED` đã bỏ `extra_person` (folio.service.ts:47-52).
3. Bill chỉ ẩn dòng và in "Đã thu qua OTA" khi `paidOtaVnd > 0`, không còn dùng `otaNet` làm số dự phòng (src/modules/folio/internal/bill.service.ts:134).
4. Test test/integration/ota-prepaid-flow.test.ts:177 (B13 rồi B18) và :215 (B9a, thêm người thứ 3, E05-11) phủ đúng 3 điểm trên.
5. Đã chạy be-b-s3-units.test.ts: 14/14 xanh.

**B. Kịch bản vẫn làm sai số dư hoặc bill**
Đồng bộ `ota_collect` chỉ chạy ở 3 chỗ: `postLines` (:622-624), `voidStay` (:996) và `syncStay` (:1205). Các đường còn lại không đồng bộ, nên khoản thu OTA bị cũ.

(1) Sửa dòng phí OTA giữ – chặn trả phòng (BLOCKER).
- adjustFolioLine gọi `reverseLine` rồi `insertLine` (src/modules/folio/internal/folio-lines.service.ts:467-488), không gọi `syncOtaCollect`. `reverseLine` (folio.service.ts:633-687) cũng không gọi.
- Chặn FB-R2-ARC-BE-S3-14 chỉ áp cho dòng `room`/`extra_person` (folio-lines.service.ts:411-427). `early_departure_fee` (charge_code `ota_retained`) vẫn sửa được: MGR đổi giá, FD hủy dòng.
- Kịch bản: Agoda 3 đêm × 900.000 (2.700.000). B16 bỏ đêm 3, lễ tân nhập nhầm `otaRetainedVnd` = 450.000, nên `ota_collect` = 2.250.000. MGR sửa dòng phí thành 900.000.
- Chạy `moneyPosition` thật bằng tsx (script ở scratchpad, không sửa repo) cho `balanceDueVnd` = **450.000**. B18 (src/modules/frontdesk/internal/checkout.service.ts:405-407) ném BALANCE_DUE 450.000, tức đòi khách khoản OTA đã giữ.
- Bill tự mâu thuẫn: tổng 0, "Đã thu qua Agoda 2.250.000", còn phải thu 450.000.
- Nếu FD hủy dòng phí: bill in "Đã thu qua" cao hơn thực tế 450.000, kèm `otaExcess` ảo.

(2) Sửa giá đêm OTA sau trả phòng ("rate override").
- Giả định 4 của BE-B cho MGR sửa dòng `room` khi đơn đã `checked_out`.
- Sửa đêm 900.000 thành 1.000.000 thì `ota_collect` vẫn 1.800.000. Kết quả chạy thử: `balanceDueVnd` = 100.000 trên folio đã settled. Điều này trái BR-307 ("tự điều chỉnh khi đêm của đơn OTA đổi").

(3) B16 trên đơn OTA đã gia hạn B13.
- B13 tạo đơn con và giữ nguyên ngày đi của đơn cha (src/modules/frontdesk/internal/stay.service.ts:320-334).
- B16 chỉ chạy trên đơn chính (`assertPrimary`, stay.service.ts:1116 và 1359), với `nd < row.departure_date` của đơn cha (:1118).
- B18 đòi ngày đi hiệu lực = ngày đi của đơn con (checkout.service.ts:293-298; `effectiveStay` ở src/modules/frontdesk/internal/stay-support.ts:444-463).
- Ví dụ: Agoda 2 đêm 01–03, gia hạn thêm 2 đêm 03–05, khách rời ngày 04. B16 đơn cha bị DATE_INVALID, B16 đơn con bị INVALID_TRANSITION, B18 ngày 04 bị INVALID_TRANSITION. Không có đường nào bỏ đêm của đơn con: khách phải trả đêm không ở, hoặc không trả phòng được.

(4) B14 rồi B16 trên đơn OTA.
- Chênh lệch đổi phòng được ghi thành **một** dòng gộp `room_change_difference` cho mọi đêm chuyển (stay.service.ts:766-776 và 960-981).
- `syncStay` và B16 không động tới dòng này (folio.service.ts:1116-1199 chỉ xử lý `room`, `extra_person`, `no_show_fee`).
- Kết quả chạy thử: chênh lệch 250.000/đêm × 2 đêm, sau đó B16 bỏ 1 đêm, quầy vẫn đòi 500.000 (dư 250.000). Trái BR-424 (chênh lệch tính theo từng đêm) và cách tính BR-428.

(5) FOC trên đêm OTA.
- `FolioFocService.onDecided` (src/modules/folio/internal/foc.service.ts:156-185) duyệt FOC mà không đồng bộ khoản thu OTA.
- "Đã thu qua Agoda" trên bill là 1.800.000 hay 900.000 tùy có thao tác đồng bộ nào xảy ra sau đó hay không. Trong lúc chờ, folio hiện `otaExcess` 900.000.

(6) Hủy hoặc no-show đơn OTA.
- `cancellationQuote` luôn trả `retainedVnd: 0` cho đơn OTA (src/modules/reservations/internal/reservations.service.ts:2427-2434), dù có nhập `otaPenaltyVnd` (:2278).
- No-show đặt `kept = 0` (:3136).
- Vì vậy `ota_collect` bị đảo về 0 và tiền phạt OTA giữ cho OTTIMO không bao giờ lên folio. Tuyên bố của BE-B "phí OTA giữ: hủy / không đến" không đúng với code.

(7) Đơn chưa gán phòng rồi gán (B7a).
- `assignRoom` (reservations.service.ts:2858-2946) không đổi giá. Tôi không tìm ra lỗi tiền ở ca này.

**C. Test**
- Không có test tích hợp nào phủ các ca B14 OTA, B16 OTA có kiểm `ota_collect`/số dư/bill, FOC OTA, hủy/no-show OTA, hoặc sửa dòng OTA.
- frontdesk-s3-fixes.test.ts:467 chỉ kiểm `earlyDepartureFeeVnd`.
- Grep cả thư mục test không thấy `roomChangeDifferenceVnd`.
- Gap:
  - BLOCKER – Sửa dòng tiền OTA không đồng bộ lại `ota_collect`. Agoda 3 đêm × 900.000; B16 với otaRetainedVnd nhập nhầm 450.000; MGR sửa dòng `early_departure_fee` thành 900.000 qua adjustFolioLine (reverseLine + insertLine ở folio-lines.service.ts:467-488, không gọi syncOtaCollect). `ota_collect` vẫn 2.250.000 nên B18 báo BALANCE_DUE 450.000, tức đòi khách khoản OTA đã giữ. Bill in tổng 0, 'Đã thu qua Agoda 2.250.000', còn phải thu 450.000.
  - Major – 'Rate override' sau trả phòng: MGR sửa giá đêm OTA từ 900.000 lên 1.000.000 trên folio đã settled (giả định 4 của BE-B cho phép). `ota_collect` không đổi nên folio hiện còn phải thu 100.000, trái BR-307. FD hủy dòng phí OTA thì ngược lại: bill in 'Đã thu qua OTA' cao hơn thực tế và hiện otaExcess ảo.
  - Major – B16 trên đơn OTA đã gia hạn B13 (đơn con 03–05, đơn cha 01–03), khách rời ngày 04. B16 đơn cha bị DATE_INVALID (stay.service.ts:1118), B16 đơn con bị INVALID_TRANSITION (assertPrimary :1359), B18 ngày 04 bị INVALID_TRANSITION vì ngày đi hiệu lực là 05 (checkout.service.ts:293-298). Khách buộc phải trả đêm gia hạn không ở. B16 ngày 02 cũng để đơn con còn đêm và chặn trả phòng.
  - Major – B14 đơn OTA đổi phòng theo yêu cầu khách ghi chênh lệch thành một dòng gộp `room_change_difference` cho mọi đêm chuyển (stay.service.ts:960-981). B16 sau đó không đảo phần chênh lệch của đêm bị bỏ. Ví dụ 250.000 × 2 đêm, bỏ 1 đêm thì quầy vẫn thu 500.000 (dư 250.000), trái BR-424 (chênh lệch theo từng đêm) và BR-428.
  - Major – Duyệt FOC trên đêm OTA (foc.service.ts:156-185) không đồng bộ `ota_collect`. 'Đã thu qua Agoda' trên bill là 1.800.000 hay 900.000 tùy có lần đồng bộ ngẫu nhiên nào xảy ra sau đó. Trong lúc chờ, folio hiện otaExcess 900.000. Chưa có quy tắc DOM cho FOC trên đơn OTA trả trước, và cũng không có test.
  - Major – Hủy hoặc no-show đơn OTA trả trước: `retainedVnd` luôn bằng 0 (reservations.service.ts:2427-2434 và :3136), dù có nhập otaPenaltyVnd. `ota_collect` bị đảo về 0 và tiền phạt OTA giữ cho OTTIMO (BR-310) không lên folio. Tuyên bố của BE-B 'phí OTA giữ: hủy / không đến' không đúng với code.
  - Test – Không có test tích hợp nào kiểm `ota_collect`, số dư hoặc bill cho: B14 OTA, B16 OTA (frontdesk-s3-fixes.test.ts:467 chỉ kiểm phí), FOC OTA, hủy/no-show OTA có phạt, sửa dòng OTA (adjustFolioLine), và B16 trên đơn OTA có đơn con. Ca chưa gán phòng rồi gán (B7a) không có lỗi tiền theo code, nhưng cũng không có test kiểm ota_collect.

### ARC-S3-03/SEC-BE-47 – security/DoS
- Bằng chứng: PHẦN ĐÃ ĐÓNG (có code và test):
- Vector OOM không cần đăng nhập trong báo cáo trước đã đóng. Trong src/http.ts:120-170, readMultipart kiểm theo thứ tự: route thuộc MULTIPART_ROUTES (:125, khác thì 415), cookie đúng dạng (:130, khác thì 401), Content-Length ≤ 42 MB (:136, vượt thì 413), phiên thật qua MULTIPART_SESSION_CHECK (:140-150; không có hàm kiểm thì fail-closed 401), rồi giữ chỗ cổng (:153-157, đầy thì 503). Chỉ sau đó mới đọc thân (readBody :159).
- Hàm kiểm phiên nằm ở src/modules/files/internal/upload-session.check.ts:36-87. Nó tra auth_resolve_session / guest_resolve_session và xét revoked, expires, idle, disabled.
- Chỗ trong cổng được trả ở onResponse/onRequestAbort (http.ts:236-237) và khi đọc thân lỗi (:163).
- Bộ nhớ thân upload có trần 4 × 42 MB. Chú thích ở upload-gate.ts đã sửa.
- Test tích hợp trong test/integration/files-attachments.test.ts:
  - 's3-blocker-verification: a well-formed FAKE session cookie → 401 before the body is read (staff and guest)' (~:347): thân không bao giờ kết thúc vẫn nhận 401, và uploadsInFlight()=0.
  - 's3-blocker-verification: the upload slot is taken BEFORE the body – 5th concurrent upload → 503 at once' (~:370).
  - 'ARC S3-03 / SEC BE-47: multipart only on the 3 upload routes…' (~:316).
- Caddyfile.prod:84-113 đặt trần 42 MB cho 3 route upload, 1 MB cho route khác, và từ chối sớm khi Content-Length khai vượt.

PHẦN CHƯA ĐẠT (lý do bác bỏ):
1. Cổng 4 chỗ là toàn cục, không chia công bằng theo phiên hay IP. upload-gate.ts:12-26 chỉ đếm inFlight, còn http.ts:153 giữ chỗ cho bất kỳ phiên thật nào.
   - Một người có phiên khách hợp lệ (link check-in online cấp cho mọi khách đặt phòng) có thể giữ cả 4 chỗ bằng thân gửi chậm, tới requestTimeout 60 s (Node kiểm theo chu kỳ nên thực tế có thể tới ~90 s), rồi lặp lại.
   - Hệ quả: mọi upload khác đều nhận 503, gồm giấy tờ đăng ký tạm trú ở lễ tân, đính kèm của nhân viên và giấy tờ của khách khác.
   - Giới hạn 20 lần/giờ/phiên và 60 lần/giờ/IP nằm trong controller, nên request không bao giờ xong thân thì không bị đếm.
   - Chính test '5th concurrent upload → 503 at once' đang xác nhận hành vi này là chủ đích thiết kế, chứ không chứng minh có chống slowloris.
2. Kiểm phiên không gắn với route. upload-session.check.ts:43-85 chấp nhận phiên nhân viên HOẶC phiên khách cho cả 3 route.
   - Phiên khách vẫn giữ được chỗ và được đọc thân tới 42 MB trên route nhân viên (/v1/properties/:propertyId/attachments, /registrations/:id/documents) trước khi AuthGuard trả 401/403.
   - Phiên nhân viên cũng không bị kiểm thiết bị tin cậy hay CSRF ở bước này.
   - Không có test nào thử cookie khách thật trên route nhân viên.
3. Nghi rò rỉ chỗ khi client bỏ kết nối lúc check() còn chờ DB (chưa tự chạy tái hiện, mức PLAUSIBLE).
   - Ở http.ts:147-158, chỗ được giữ trong .then() của check(), sau một bước async, mà không xét request đã bị abort hay chưa.
   - Fastify (node_modules fastify@5.12.7, lib/route.js:579-590) chạy onRequestAbort ngay lúc 'close'. Nếu 'close' tới trước khi chỗ được gán thì releaseUploadSlot không có gì để trả.
   - Sau đó readBody gắn listener vào một luồng đã destroy. IncomingMessage chỉ phát 'error' khi lúc destroy đã có listener, nên 'end'/'error' có thể không bao giờ tới, và vì không có phản hồi nên onResponse cũng không chạy.
   - Nếu đúng như vậy, mỗi lần rơi vào trường hợp này mất vĩnh viễn 1/4 chỗ cho tới khi khởi động lại tiến trình.
4. Thân chunked (không có Content-Length) vẫn bị nối bằng Buffer.concat(chunks, size) ở http.ts:201. Lúc nối, một request chiếm khoảng 2 × 42 MB, trái với tuyên bố 'một bản sao' trong s3-BE-C.md:79. Mức có trần (≈ 4 × 84 MB) nên chỉ là Minor, nhưng không có test chunked nào.
5. Lỗ hổng test:
   - Các test dùng fa.app.inject (light-my-request), không đi qua socket thật, nên không thử được: onRequestAbort, client bỏ giữa chừng, requestTimeout trả chỗ, abort trong lúc check() đang chờ.
   - be-c-s3-units.test.ts:78-99 chỉ thử withUploadGate đứng riêng.
   - Không test nào đo bộ nhớ, thử nhiều phiên thật đồng thời, hay giới hạn chỗ theo phiên/IP.
6. Route khác: thân JSON ≤ 1 MiB (mặc định của Fastify, không thấy bodyLimit nào khác trong src) vẫn được đệm trước guard, và Caddy không giới hạn số kết nối theo IP. Đây là rủi ro chung, mức thấp hơn, nằm ngoài phạm vi chính của thẻ này.
- Gap:
  - Cổng 4 upload là toàn cục, không chia theo phiên/IP: một phiên khách hợp lệ gửi thân chậm có thể giữ cả 4 chỗ tới requestTimeout rồi lặp lại, làm mọi upload của nhân viên và khách khác nhận 503. Rate limit theo phiên/IP nằm trong controller nên không bao giờ được tính (upload-gate.ts:12-26, http.ts:153).
  - Kiểm phiên trước thân không gắn với route: phiên khách được giữ chỗ và đọc thân tới 42 MB trên route nhân viên (/attachments, /registrations/:id/documents) trước khi AuthGuard từ chối (upload-session.check.ts:43-85). Không có test cookie khách thật trên route nhân viên.
  - Nghi rò rỉ chỗ: chỗ được giữ trong .then() của check() async mà không xét request đã abort (http.ts:147-158). onRequestAbort của Fastify chạy lúc 'close', có thể trước khi chỗ được gán, khi đó readBody chờ trên luồng đã destroy và không bao giờ trả chỗ. Chưa tái hiện, mức PLAUSIBLE.
  - Thân chunked không có Content-Length vẫn nối bằng Buffer.concat (http.ts:201), đỉnh khoảng 84 MB mỗi upload, trái với tuyên bố 'một bản sao'. Không có test chunked.
  - Test dùng inject, không đi qua socket thật: không thử onRequestAbort, client bỏ giữa chừng, requestTimeout trả chỗ, hay abort khi check() đang chờ. Không đo bộ nhớ, không thử nhiều phiên thật đồng thời.
  - Route khác: JSON ≤ 1 MiB vẫn đệm trước guard, Caddy không giới hạn số kết nối theo IP. Rủi ro chung, mức thấp hơn, ngoài phạm vi chính.

### VER-BE-S3-01..05 – money
- Bằng chứng: Kiểm ở HEAD 16941c6, chỉ đọc code, không chạy test DB. Đường dẫn tương đối theo product/services/api.

Các mục ĐÃ ĐÓNG, có code và test:
- **Hold chỉ nhận cọc**
  - recordPayment: payments.service.ts:174-178.
  - createVietQr: payments.service.ts:696-699. purpose null trên hold mặc định thành deposit (:708).
  - Test: payments-s3.test.ts:2534 "Verification 17/10: J1 cancels a hold…". Charge bị trả NOT_IN_LIST; QR balance bị trả NOT_IN_LIST; refund tay trên hold trả 409; J1 hủy hold có cọc bị đảo và giữ hold đã trả lại tiền.
- **confirmDeposit từ chối id của dòng đảo**
  - Code: deposits.service.ts:163-164.
  - Test: cùng test ở trên, phần (9).
- **B16 → B18 tạo đúng 1 yêu cầu hoàn qua endpoint thật**
  - Test: ota-prepaid-flow.test.ts:296. B18 không cần overpaymentHandling vẫn trả 200, và chỉ có 1 dòng approval_request.
- **effectiveFrom chỉ nhận hôm nay**
  - Code: party.service.ts:216.
  - Test: frontdesk-s3-fixes.test.ts:672 (gửi ngày mai thì bị 422 DATE_INVALID).
- **Nhãn bill đếm số người theo từng đêm**
  - Code: migration 0032; reservations.service.ts nightExtra và setNightFees (mọi nơi gọi đều truyền count); folio.service.ts:1162-1197.
  - Test: description 'extra_guest x1' ở frontdesk-s3-fixes.test.ts:699-703.

Các phản chứng còn lại:

1. **B10 trừ yêu cầu hoàn đang mở khỏi trần hoàn, nhưng không trừ khỏi cơ sở tính phí hủy**
   - Code liên quan:
     - reservations.service.ts:2439-2440 và 2467-2468: `refundable = min(R, depositPaid − open)`, nhưng `retained = depositPaid − R`.
     - `depositPaid` (folio.service.ts:519-536) chỉ trừ refund ĐÃ CHI (`back`), không trừ yêu cầu đang mở.
     - voidStay (folio.service.ts:967) ghi nguyên phí, không có trần.
   - Kịch bản:
     - Đơn direct 1 đêm 1.000.000. FD xác nhận cọc 1.500.000 kèm note; desk được ghi vượt khi có note (deposits.service.ts:154). Đơn sang confirmed, credit 500.000.
     - FD tạo yêu cầu hoàn 500.000. Request này hợp lệ vì đơn không còn ở hold.
     - Khách hủy khi còn dưới 3 ngày (bậc 0%, pricing.ts:222-228): depositPaid = 1.500.000, nên phí hủy = 1.500.000, lớn hơn giá trị đơn.
     - rawCredit còn 0, nên yêu cầu hoàn 500.000 đang mở không bao giờ chi được (payOut bị trần bởi credit).
     - Nếu khoản 500.000 đã được chi TRƯỚC khi hủy thì depositPaid = 1.000.000 và phí chỉ 1.000.000. Cùng một bộ dữ kiện, khách mất thêm 500.000 chỉ vì thời điểm chi tiền.
   - Ở bậc 50%: hoàn 750.000, phí 750.000, credit sau hủy 750.000, nhưng tổng yêu cầu mở là 1.250.000. Quản lý vẫn thấy tổng yêu cầu vượt số dư; đây đúng là triệu chứng gốc của thẻ.
   - Test không chứng minh được điều này: payments-s3.test.ts:2612 dùng khoản thừa từ `charge` chứ không phải từ cọc, và chỉ assert `asked ≤ max(depositPaid, 500k)` (:2648). Không có ca bậc có phí > 0.

2. **syncChildrenParty tính phụ thu cho đêm của đơn con vượt số đã báo và đã xác nhận**
   - Số tiền báo cho lễ tân chỉ tính đêm của đơn cha: `surcharge`/`nights` lấy từ peopleFromNight của đơn cha (party.service.ts:306). Kiểm `expectedSurchargeVnd`/SURCHARGE_CHANGED cũng chỉ dựa trên số này.
   - Sau đó party.service.ts:438 ghi thêm phụ thu cho đêm của đơn con mà không báo và không chặn.
   - Chính test cho thấy chênh lệch: frontdesk-s3-fixes.test.ts:743 gửi `expectedSurchargeVnd: 150_000`, nhưng :748-749 ghi 2 dòng 150.000 (đơn cha 05, đơn con 06), tổng 300.000.

3. **Thêm người vào ngày chỉ còn đêm của đơn con: mất phụ thu**
   - Đơn Agoda 202 (chuẩn 2), 04–06, 2 người lớn. B13 gia hạn tạo đơn con 06–07.
   - Ngày 06 có người lớn thứ 3. POST party trên đơn cha bị 422 DATE_INVALID, vì party.service.ts:216 đòi `effectiveFrom < row.departure_date` (= 06).
   - POST trên đơn con thì 201, nhưng đơn con không có dòng reservation_guest nào. createChildStay không chép thành viên, và trong src chỉ party.service.ts:353 cùng document-party.port.ts:131 có INSERT vào bảng này.
   - Vì vậy present = 2 = declared 2, `changed` = false: không có phụ thu, không đổi số khách, mất 150.000 cho đêm 06.
   - Không có test nào cho ca này. Test :726 chỉ thêm người vào ngày 05, khi đơn cha còn đêm.
- Gap:
  - [Major] B10/BR-309: phí hủy tính trên depositPaid gồm cả phần cọc đang có yêu cầu hoàn mở (reservations.service.ts:2467-2468, folio.service.ts:519-536). Cọc 1.500.000 cho đơn 1.000.000, yêu cầu hoàn 500.000 đang mở, hủy ở bậc 0% → phí 1.500.000 > giá trị đơn, yêu cầu 500.000 không chi được. Nếu đã chi trước khi hủy thì phí chỉ 1.000.000. Kết quả phụ thuộc thời điểm chi.
  - [Major] B10 bậc 50% cùng dữ kiện: tổng yêu cầu mở 1.250.000 trong khi số dư thừa sau hủy chỉ 750.000. Quản lý vẫn thấy nhiều yêu cầu hoàn vượt số dư, chỉ được trần chi ở payOut chặn lại.
  - [Major – test] Test B10 (payments-s3.test.ts:2612) lấy khoản thừa từ charge chứ không từ cọc, và chỉ assert cận lỏng (:2648). Không có ca có phí hủy > 0 và không kiểm tổng yêu cầu ≤ số dư thừa sau hủy.
  - [Major] syncChildrenParty ghi phụ thu cho đêm của đơn con ngoài số đã báo và đã xác nhận (surchargeVnd/expectedSurchargeVnd chỉ tính đêm đơn cha, party.service.ts:306 rồi :438). Test frontdesk-s3-fixes.test.ts:743-749 xác nhận 150.000 nhưng ghi 300.000.
  - [Major] Đơn OTA đã gia hạn bằng đơn con, ngày chỉ còn đêm của đơn con: thêm người vào đơn cha bị 422 DATE_INVALID (party.service.ts:216). Thêm vào đơn con không tính phí vì đơn con không có reservation_guest, nên changed=false. Mất phụ thu, không có test.
  - [Minor] Đọc yêu cầu hoàn mở lúc hủy (reservations.service.ts:2439) không khóa folio. createRefundRequest chạy đồng thời vẫn có thể tạo yêu cầu trùng.
  - [Minor] Nhãn đếm người: đơn OTA đổi nhóm tuổi (PATCH in_house) có thể ra phí > 0 nhưng count = 0. syncStay giữ dòng cũ khi chỉ count đổi mà phí không đổi, nên nhãn bị cũ.
