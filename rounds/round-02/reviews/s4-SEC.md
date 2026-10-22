# SEC review – Sprint 4 (Round 2) – trước cổng QC Sprint 4 – HEAD `7ac11a4`

- Người review: SEC | Ngày: 18/10/2026 | Bước: Review bắt buộc trước cổng QC Sprint 4 (`sprint-4-plan.md` dòng 389, G2; `qc/s4-gate-readiness.md` G2.1–G2.5, S4-51)
- Mã được review: **`7ac11a4`**.
  - Lúc bắt đầu, cây làm việc sạch.
  - Trong lúc review, HEAD lên **`2b134fb`**. Commit này chỉ đổi CI, tài liệu và review, không đổi mã sản phẩm.
  - Phiên SEC bị ngắt một lần vì giới hạn sử dụng; các SEC phụ đã được giao lại và làm từ đầu.
  - Cây có **nhiều thay đổi chưa commit** của vai khác: `services/api` (housekeeping theo ARC S4-01/S4-05/S4-09, guest-portal, frontdesk, reservations, folio, payments), `admin-web`, `openapi.yaml`, api-client, `design/copy`, `ci.yml`.

    Các phần này **không** được tính. Tệp đang bị sửa dở thì đọc bản `git show 7ac11a4:<tệp>`; SEC-G3 chạy test trên bản trích `git archive 7ac11a4`. Các thẻ ở đây ứng với `7ac11a4`; khi vai khác commit, SEC kiểm lại phần liên quan.
- Test: DB PostgreSQL **mới, riêng** (`ottimo_test_sec_g21`, `_g22`, `_g24a`, `_g24b`), migrate từ đầu, Node 22.23.3. Không chạm stack demo (8181–8183, 3100) hay stack của vai khác. Dữ liệu giả. Không tấn công hệ thống nào.
- Phạm vi:
  - G2.1 (S4-39) và G2.2 (SEC-G3) ghi ở `reviews/s3-SEC.md` mục 10;
  - G2.3 (S4-17), G2.4, G2.5 và S4-51 ghi ở tệp này;
  - đường D5 / SR-AUTH-11 ghi ở `reviews/s4-SEC-lateFee-reauth.md`.
- Đánh số thẻ tiếp theo: BE …64, FE …08, MOB …02, ARC …26, OPS …03. Thẻ mới ở tệp này: BE-65…78, MOB-03, MOB-04 (OPS-04 ở `s3-SEC.md` 10.2).
- Cách làm: SEC chính kiểm G2.1, G2.3, S4-51 và đọc lại mã cho các phát hiện Major. Ba SEC phụ (chỉ đọc, DB riêng) kiểm G2.2, G2.4 PWA/SSE/`roomName`, và G2.4 guest-web/B-15/nhóm D. SEC chính kiểm lại bằng chứng của mọi thẻ Major trên `7ac11a4`. Ca thử của SEC nằm trong scratchpad, ngoài repo.

## Kết luận SEC – cổng QC Sprint 4 (phần G2 và S4-51)

| Mục | Trạng thái | Ghi ở |
|---|---|---|
| **G2.1** S4-39 / BUG-R2-085 / SEC-G1 (b) / ĐK-S3-11 / M3 / T3 | **ĐẠT – Verified 18/10 (`7ac11a4`)**. BE-53, BE-57, BE-58 (2) Closed. Tình huống KHÔNG ĐẠT số 3 gỡ | `s3-SEC.md` 10.1 |
| **G2.2** SEC-G3 (8 Major) | **ĐẠT CÓ ĐIỀU KIỆN** – 7/8 Verified (BE-33…37, FE-06, MOB-01). BE-38 mở lại một phần (điểm 2 hồi quy ở S4) → theo dõi bằng **BE-65** (Major, rủi ro Medium). Thẻ mới OPS-04 (Minor). **19/10 (QC K1): BE-65 Verified, BE-38 đóng → 8/8 Verified** (cây làm việc; chạy lại trên commit chấm lại) | `s3-SEC.md` 10.2–10.4, mục C.15 |
| **G2.3** S4-17 | **ĐẠT** – đóng bằng test cục bộ; phần qua Caddy thật thuộc S4-15 | mục A |
| **G2.4** review bắt buộc (PWA, guest-web P-R2-4, SSE, nhóm D A/A.3, `roomName`) | **Đã review.** PWA (a)(b), SSE, `roomName`, guest-web: đạt có ghi chú. **Ảnh PWA: không đạt** (BE-65). **Nhóm D: không đạt** (BE-73; BE-74, BE-75 có hạn). Luật B-15: **SEC đã quyết V2** (C.6). Giả định ARC (c) xác nhận; (d) xác nhận có điều kiện. **4 Major mở:** BE-65, BE-73, BE-74, BE-75 | mục C |
| **G2.5** Critical/High mở | **KHÔNG có Critical/High mở.** Mức cao nhất là Major / rủi ro Medium. SEC phụ đề xuất High cho BE-73; SEC chính xếp Medium theo cùng thang với BE-53 (C.9). Cách xếp này **không** bỏ việc phải sửa: SEC không ký S4-11/S4-32 tới khi BE-73 Verified. **Đánh giá lại 19/10 khi repo công khai (QC K11): vẫn 0 Critical/High Open** | mục C.9, **mục E** |
| **S4-51** tên miền `maps.app.goo.gl` | **SEC XÁC NHẬN** (gỡ nhãn giả định). Đúng host, https, mở khi khách bấm, `noopener noreferrer`. Gợi ý trước GL dùng link `google.com/maps` | mục B |

**Cập nhật 18/10 (sau sửa của BE-C, mục C.10):**
- **BE-73 Verified** (cây làm việc; kiểm lại trên commit khi BE-C commit) và BE-78 (a) Verified.
- **SEC ký S4-11/S4-32.** Giả định ARC (d) được xác nhận.
- Thẻ mới **BE-79** (Major, Medium – đổi người của giấy tờ không gỡ khóa/last4 trên hồ sơ cũ): dời cùng BE-74/75 tới trước dữ liệu thật.
- Major còn mở: BE-65, BE-74, BE-75, BE-79. Tất cả dời được có hạn, không có Critical/High.

Ảnh hưởng tới cổng, SEC báo để QC/ORC chấm:
- G2 không còn mục nào chặn cứng thuộc SEC. Các Major mới (BE-65, BE-73, BE-74, BE-75) đi theo **G3.2** (Major của review Sprint 4 phải xử lý hoặc dời có lý do) và dòng **S4-11/S4-32** của bảng sẵn sàng:
  - **BE-73**: SEC **không** chấp nhận dời. Đây là lỗi của chính tính năng CỔNG S4-11/S4-32.
  - **BE-65, BE-74, BE-75**: SEC chấp nhận dời có hạn tới **trước dữ liệu thật** (cùng cổng ESC-001), nếu ORC ghi vào decision-log và backlog. Lý do: liên quan hạn lưu chạy sau 12–14 tháng và chưa có dữ liệu thật.
- Minor/Suggestion (BE-66…72, BE-76…78, MOB-03, MOB-04, OPS-04): dời được sang tuần Ổn định hoặc R3; hạn chung là trước bản dùng thử cuối R3. BE-77 (B-15) nên làm cùng PR yêu cầu khách vì đang chặn EP14 3.2.
- Còn chờ, không thuộc cổng S4: SEC-G2 (smoke Caddy trên staging, chờ VPS – ĐK-S3-8); kiểm lại `performedAt` sau khi BE-C commit ARC S4-01/S4-05.

Không có ESC mới. Mức rủi ro và yêu cầu kỹ thuật thuộc quyền SEC.

## A. G2.3 – S4-17: upload pipelining (đóng bằng test cục bộ) – **ĐẠT**

Mã: `services/api/src/http.ts`.
- `readMultipart` (162–248) kiểm theo thứ tự: tuyến → cookie đúng loại → `Content-Length` → trần 42 MB → **upload xếp hàng sau một request chưa trả lời trên cùng kết nối → 429 `RATE_LIMITED` + `Retry-After: 5`** (188–197). Bước này chạy trước khi kiểm phiên thật, trước khi lấy slot và trước khi đọc thân. Node bỏ phần byte còn lại khi phản hồi từ chối đã gửi xong.
- `pipelinedBehindAnother` (319–323) so `socket._httpMessage.req` với request hiện tại.
- `readBody` (257–308) chép thẳng vào một buffer bằng `Content-Length`. Khi xong (`finish`) thì `body = null`, gỡ mọi listener, và lỗi stream đến muộn đi vào `ignoreLateStreamError`, một hàm cấp module không giữ closure nào. Request stream không còn giữ buffer.

Test `test/upload-gate-socket.test.ts`, describe "pipelined uploads on one connection (S4-17)" (427–515):
- socket thô gửi 6 upload 1 MB pipelined trong một lần ghi → `200` rồi `429`, kết nối đóng; handler chỉ chạy 1 lần; `uploadsInFlight() = 0`;
- một upload không pipelined vẫn 200;
- sau `gc()` không còn buffer thân nào sống (`WeakRef`, `alive: 0`).

SEC chạy tệp này trên `ottimo_test_sec_g21`: xanh (nằm trong 50/50 ở `s3-SEC.md` mục 10).

Kết luận: **S4-17 đóng bằng test cục bộ – ĐẠT.** Phần đi qua Caddy thật thuộc S4-15 (VPS), không tính ở G2.

Ghi chú, không tạo thẻ: `pipelinedBehindAnother` dựa vào trường nội bộ `_httpMessage` của Node. Nếu đổi bản Node lớn, test trên sẽ đỏ, nên vẫn phát hiện được hồi quy. Giữ test này bắt buộc trong CI.

## B. S4-51 – tên miền liên kết bản đồ `maps.app.goo.gl` – **SEC XÁC NHẬN** (gỡ nhãn [GIẢ ĐỊNH – SEC xác nhận])

- `maps.app.goo.gl` là tên miền link chia sẻ do ứng dụng Google Maps tạo, chuyển hướng về `google.com/maps`. SEC chấp nhận trong danh sách cho phép E14-08 với điều kiện: **đúng host, chỉ https, không userinfo/port, chỉ mở khi khách bấm (không nhúng), `target="_blank" rel="noopener noreferrer"`**.
- Hiện trạng đạt:
  - server kiểm khi OWN lưu `property_map_url` (`platform/internal/parameter-rules.ts:255-282` `isAllowedMapUrl` → 422 `NOT_IN_LIST`) và kiểm lại khi đọc (`guest-portal.service.ts:45-66`);
  - guest-web lọc lại (`apps/guest-web/src/app/link.ts` `safeMapUrl`);
  - link có `rel="noopener noreferrer"` (`HomePage.tsx:145`, `InfoPage.tsx:45`);
  - giá trị mặc định ở migration `0058`.
- Ghi chú:
  - (1) `safeMapUrl` của guest-web không loại userinfo/port như server. Server đã chặn khi lưu và khi đọc, nên chỉ là lớp phòng thủ thứ hai → gợi ý MOB thêm hai điều kiện đó cho khớp. Không tạo thẻ.
  - (2) Google đã ngừng dịch vụ rút gọn `goo.gl` dùng chung. Theo hiểu biết của SEC, link `maps.app.goo.gl` do Maps tạo vẫn hoạt động, nhưng SEC chưa kiểm tại thời điểm này. Trước GL và trước US-162 (tin nhắc, R3), OWN/OPS bấm thử link. Muốn bền và minh bạch hơn thì đổi sang link `https://www.google.com/maps/...` cùng vị trí; link này đã được cho phép, không cần sửa mã.

## C. G2.4 – review bắt buộc các PR Sprint 4

### C.1 Tổng hợp

| Phần | Kết quả | Thẻ |
|---|---|---|
| PWA nhân viên (a) không có C3, `staff_pwa` không là thiết bị tin cậy | **Đạt có ghi chú** | BE-66, BE-67, BE-69 (Minor) |
| PWA (b) `performedAt` | **Đạt có ghi chú** | BE-68 (Minor); ARC S4-01/S4-05 đang sửa dở – kiểm lại khi BE-C commit |
| PWA (c) ảnh | **Không đạt** tới khi sửa BE-65 | **BE-65 (Major)**, MOB-03, BE-71 |
| SSE (`streamEvents`) theo vai | **Đạt có ghi chú** | BE-72 (Suggestion) |
| `GuestStay.roomName` | **Đạt có ghi chú** | BE-70 (Minor) |
| guest-web yêu cầu khách (P-R2-4) | **Đạt có ghi chú** | MOB-04, BE-76 (Minor) |
| Luật B-15 (`replyNote`) | **SEC đã quyết** (C.6) | BE-77 (Minor) |
| Nhóm D mục A/A.3 (S4-11, S4-32) | **Không đạt** tới khi sửa BE-73; BE-74, BE-75 có hạn | **BE-73, BE-74, BE-75 (Major)**, BE-78 |
| Giả định ARC (c) – hẹn xóa 24 giờ chỉ còn cho đường không có lựa chọn | **SEC xác nhận** | `s3-SEC.md` mục 10.1 |
| Giả định ARC (d) – `id_doc_last4` chỉ ghi khi P05 | **SEC xác nhận có điều kiện** | Đúng là chỉ ghi khi hồ sơ có P05, nhưng hồ sơ đó có thể là của **người khác** (BE-73). Thêm CHECK DB (BE-78 (a)) |

Test SEC phụ chạy (DB `ottimo_test_sec_g24a`, `_g24b`):
- API 11 tệp, 399 passed: housekeeping-s4, rbac-sprint4-bec/bed, dashboard-s4-bed, guest-requests-s4-bed, guest-portal, guard-s3, identity, files-attachments, be-c/be-d-s4-units;
- API nhóm D/guest-web: 75 + 148 passed (be-d-s4-units, registration-rules, guest-requests-s4-bed, guest-document-profiles, guests, rbac-sprint4-bed); chạy lại 3 tệp 4 lần, mỗi lần 26/26;
- PWA `apps/mobile` 71/71; guest-web 63/63 và 16/16;
- ca thử ngoài repo: P1–P5 (PWA/SSE) 5/5, tái hiện BE-73/74/75 2/2.

Một lần chạy verbose lỗi 2 ca ("P05_CRM granted…", "J10 guest_request.sla") và không lặp lại. Nghi do chạy song song cùng DB hoặc dùng chung `dev_clock`. QA để ý, SEC không tạo thẻ.

### C.2 PWA nhân viên buồng phòng / bảo trì

(a) **Không có C3; serializer theo vai; phiên PWA không là thiết bị tin cậy – Đạt có ghi chú.**
- `apps/mobile/src/__tests__/guard.test.ts:21-36` quét mã nguồn tìm `/sensitive`, `door-credential`, `/documents`, `/folio`, `/refund`, `step-up`.
- Luồng ngoài phạm vi trả 404. MT không thấy tên khách; phiếu sửa và 409 khóa phòng không có tên khách.
- Guard server từ chối thiết bị tin cậy cho phiên `staff_pwa` (`auth.guard.ts:496-503`, SEC-BE-34).
- Còn: `Me.deviceTrusted` có thể `true` cho phiên PWA (BE-69); HK nhận **họ tên đầy đủ** thay vì tên gọi (BE-67); `serviceNotes` nhận chữ tự do và trả cho HK (BE-66).

(b) **`performedAt` – Đạt có ghi chú.**
- Server kiểm khoảng [now − 24 giờ, now + 5 phút] (`rules.ts:289-292`).
- Lưu song song giờ máy và giờ server: `state_transition.performed_at`/`occurred_at`, `inspection.inspected_at`/`received_at`; `room_status.since` lấy giờ server.
- `expectedFrom` lệch → 409 kèm `currentState`.
- ARC đã mở FB-R2-ARC-BE-S4-01 (so với `since` làm hỏng chuỗi offline) và S4-05 (`complete` sớm hơn `started_at`). BE-C đang sửa dở; SEC kiểm lại khi BE-C commit.
- SEC thêm BE-68: `start` không có cận dưới, và `done_at` (giờ máy) đang quyết định phí dọn thêm.

(c) **Ảnh – Không đạt (BE-65).**
- Pipeline server đạt:
  - nhận loại tệp bằng magic bytes; trần 10 MB / 40 MP;
  - mã hóa lại bằng sharp nên mất EXIF/GPS;
  - mỗi tệp một DEK;
  - header `no-store`, `sandbox`, CORP;
  - 50 tệp/người/ngày.
- Quyền xem: FD+ xem hết; HK/MT chỉ ảnh mình tải (chặt hơn SEC I1 → BE-71).
- Thiết bị:
  - IndexedDB 3 kho, chép từng trường theo danh sách cho phép (`cache.ts:16-123`);
  - ảnh xóa khi server xác nhận/từ chối/Hoàn tác;
  - service worker không cache `/v1/*`;
  - đăng xuất xóa IndexedDB + Cache Storage (`App.tsx:136-155`).
  - Còn lệch SR-PWA-04 khi **hết phiên** (MOB-03).
- **Hạn lưu không chạy** cho ảnh `work_order`/`inspection` (BE-65). SEC chính đã đọc lại ở `7ac11a4`:
  - `work-orders.service.ts:599-607` và `housekeeping.service.ts:1211-1219` gọi `bindTo` không có `retentionAnchorAt`;
  - không có `setRetentionAnchor` nào cho hai mục đích này;
  - `attachment.service.ts` `purgeDue` chỉ xóa tệp đã gắn khi `retention_anchor_at IS NOT NULL`.

### C.3 SSE – Đạt có ghi chú
- Payload ra client chỉ `{id}` (`events.controller.ts:101-104`). NOTIFY nội bộ có `r`/`u` nhưng không bao giờ ra client.
- Mức sàn theo từng loại sự kiện (`events.service.ts:55-65`). Vai do bên phát truyền vào chỉ cộng thêm, không thu hẹp. Hub đóng an toàn: thiếu `r` thì coi là FD+ (`sse-hub.ts:44-52`). Lọc theo cơ sở.
- Ca thật qua LISTEN: HK không nhận `reservation.changed`/`attention.changed`; SAL không nhận gì.
- Phiên kiểm lại mỗi 25 giây theo heartbeat (`events.controller.ts:119-164`). Ca P4: đổi vai → dừng; thu hồi phiên → dừng. Luồng sống tối đa 15 phút. Tối đa 5 luồng/người (`sse-hub.ts:32`).
- Ghi chú (BE-72):
  - còn tối đa 25 giây sau đăng xuất/thu hồi;
  - GET không kiểm `Origin`;
  - `hk_task.changed` tới mọi HK (chỉ id, chấp nhận).

### C.4 `GuestStay.roomName` – Đạt có ghi chú
- Chỉ trả khi `room_disclosed_to_guest` (`guest-room-view.ts:49`); không bao giờ trả `roomNo`; hết tên sau trả phòng; đơn `cancelled`/`no_show` → `GUEST_LINK_INVALID`.
- Phiên khách gắn đúng một đơn. DTO yêu cầu khách không có phòng. Không vào log, URL, audit, outbox. guest-web bỏ `roomNo`, không lưu trên máy.
- Mức 1 (trang có token) theo BR-012 (4) và hợp đồng. SEC chấp nhận, không đòi mức 2.
- Lệch độ đúng: lấy đoạn lưu trú bắt đầu muộn nhất thay vì đoạn đang hiệu lực (BE-70).

### C.5 guest-web – yêu cầu khách (P-R2-4) – Đạt có ghi chú
- **Chỉ đơn của chính khách:** `guest-requests.service.ts:236` lọc theo `g.reservationId`; `activeStay` chặn `cancelled`/`no_show` và sau trả phòng (`guest-portal.service.ts:274-281`); header `no-referrer`, `no-store`.
- **Không lộ C2/C3 hay tên nhân viên:** `guestDto` (`:391-420`) chỉ có `note` của khách, `replyNote`, `autoReply`, mã lý do, phí.
- **D23 không vào thông báo/SSE/log:** `notify` chỉ kind/roles/ref/code; `publish` chỉ id; logger chỉ id.
- **Kiểm đầu vào:** `note` bỏ ký tự điều khiển, 3–500, Luhn; `replyNote` ≤ 300, Luhn **trước** luật B-15.
- **Nhân viên:** HK/MT gặp yêu cầu không định tuyến cho mình → 404; decline chỉ FD+.
- **Hiển thị:** `RequestsPage.tsx:226-243` là text node React, không `dangerouslySetInnerHTML`, không lưu trên máy.
- Ghi chú: MOB-04, BE-76; bản sao ghi chú D23 sang `hk_task.note`/`work_order.description` phải nằm trong thiết kế T13 (BE-78 (c)).

### C.6 Luật B-15 trong `replyNote` – **QUYẾT ĐỊNH SEC**

Luật gốc của SEC (`outputs/SEC/s3-checklist.md`, dòng B-15) chặn chuỗi ≥ 6 chữ số sau khi bỏ khoảng trắng/chấm/gạch. Luật này cũng chặn **giá tiền** (`350.000 đ`) và **ngày** (`18-10-2026`), mâu thuẫn EP14 3.2 (`s4-be-d.md` 2.6). Nó lại để lọt `482,913`, chữ số toàn khổ (`４８２９１３`) và `/`.

**SEC quyết – phương án V2, chỉ cho `replyNote` (`hasSensitiveDigits`, `guest-request-rules.ts:113-121`):**
1. Giữ thứ tự: kiểm Luhn trên văn bản **gốc** trước (đã đúng).
2. Văn bản để kiểm = `text.normalize('NFKC')` (chỉ để kiểm, không lưu).
3. Thay bằng ký tự `|` (không thay bằng khoảng trắng, để không nối hai số rời) các token sau:
   - **Ngày** `d{1,2}[./-]d{1,2}[./-]yyyy` (cùng một dấu phân cách) là ngày lịch hợp lệ **và** năm trong ±1 năm so với năm hiện tại của cơ sở. Điều kiện năm để không đưa ngày sinh (C3) ra mức 1.
   - **Tiền VND**: chữ số đầu **1–9**, nhóm nghìn bằng **cùng một** dấu `.`/`,`/khoảng trắng hoặc viết liền, tối đa 10 chữ số, **đơn vị ngay sau** (`đ`, `₫`, `VND`, `VNĐ`, `đồng`, không phân biệt hoa thường). Trước token không được dính chữ hay chữ số. Tiền từ 6 chữ số trở lên **phải tận cùng `000`**.
4. Bỏ dấu phân cách `[\s.,\-_+()]` và các gạch Unicode. **Không** bỏ `/` (giữ như hiện nay).
5. Chặn `/\p{Nd}{6,}/u`. Giữ ngoại lệ hotline công khai của cơ sở như cũ.

Lý do các điểm siết:
- SĐT/CCCD Việt Nam bắt đầu bằng 0, nên thêm đơn vị vẫn bị chặn.
- `Mã cửa 482913đ` bị chặn nhờ điều kiện "tận cùng 000".
- `C1234567đ` bị chặn vì có chữ dính trước.

Ca test bắt buộc (BE-D, theo bản mẫu 43 + 12 ca của SEC phụ):
- **không chặn:** `Xe đón lúc 15:30, giá 350.000 đ`, `350.000đ`, `350,000 VND`, `350 000 ₫`, `350000đ`, `Tour 1.500.000 đồng/người`, `Tổng 12.000.000 VNĐ`, `Xe 4 chỗ 350.000đ, 7 chỗ 450.000đ`, `Ngày 18-10-2026 xe đón 15:30`, `Đón 18.10.2026 lúc 07:00`, `Đón 18/10/2026`, `Phòng 202, 2 khách`, hotline;
- **chặn:** `Mã cửa 482913`, `482 913`, `482-913`, `482.913`, `482,913`, `482913đ`, `482.913 đ`, `Mã ４８２９１３`, `0912.345.678`, `Gọi 0912 345 678 giá 350.000đ`, `0912345678đ`, `(+84) 912 345 678`, `CCCD 079123456789`, `079 123 456 789 đ`, `Hộ chiếu C1234567`, `C1234567đ`, `Ngày sinh 05-03-1990`, `05.03.1990`, `31-02-2026`, `Mã 18.10.26`, `giá 350.000` (không đơn vị – giữ ca `be-d-s4-units:466`), `12.345.678.901đ`.

Chặn nhầm SEC chấp nhận (ghi vào câu nhắc Desk "Ghi giá kèm đ/VND, ví dụ 350.000 đ"): `350.000 đến 450.000đ`, `350.000 dong`, `350.000d`, ngày ISO `2026-10-18`, giá lẻ không tròn nghìn, ngày ngoài ±1 năm, `VND 350.000`.

**Không** áp ngoại lệ tiền/ngày cho `hasLongDigitRun` (ghi chú khai báo nội bộ). Ngày ở đó thường là ngày sinh, hạn hộ chiếu hay thị thực (C3), và không cần ghi tiền. Chỉ thêm `,` vào tập dấu phân cách và chuẩn hóa NFKC.

Rủi ro còn lại SEC chấp nhận: B-15 chống lộ **do vô ý**, không chống người nội bộ cố ý (viết bằng chữ, dùng `/`, mã đuôi 000 kèm "đ"). Dấu vết vẫn còn ở `closed_by` và lịch sử SM-15. Hộ chiếu chữ–số không bị bắt ở `replyNote`.

Đồng bộ trong cùng PR:
- mock `admin-web/src/mocks/ops.ts:557-566` (FE-B);
- mô tả `openapi.yaml:281, :7538` và api-client (ARC);
- EP14 4.4 và E14-11 (BA);
- câu nhắc dưới ô nhập (UXD, giọng văn OTTIMO).

Cập nhật dòng B-15 trong `s3-checklist.md` là việc của SEC ở bước Phản hồi & sửa.

**Bổ sung 18/10 – sau khi BE-D cài V2 (`s4-be-d.md` mục 7.5). SEC đọc mã `guest-request-rules.ts` `hasSensitiveDigits` trên cây làm việc, chưa commit.**
- Phạm vi: luật chỉ được gọi ở **một** chỗ – `replyNote` của nhân viên (`guest-requests.service.ts:644`). Ghi chú khách tự viết (`note`) chỉ kiểm Luhn, **không** qua B-15, nên yêu cầu của khách không bao giờ bị chặn vì chuỗi số.
- **(s6) Chặt hơn C.6 – SEC đồng ý.** Token tiền/ngày không được là đuôi của một số nhóm dài hơn (`(?<!\p{Nd}[.,])`), nên `0912.345.000đ` vẫn bị chặn. Đây đúng ý C.6 ("trước token không dính chữ hay chữ số") và chỉ chặn nhiều hơn. Giữ.
- **(s7) `Phòng 202, 203, 204` bị chặn – SEC nới hẹp.** Lễ tân trả lời đoàn khách nhiều căn là việc thật. Số căn trong trang của chính đơn không phải dữ liệu cấm (BR-978 chỉ cấm số căn đi cùng mã cửa hay hướng dẫn vào căn).
  - Cách nới: sau bước thay token, trước khi bỏ dấu phân cách, thay **dấu phẩy hoặc chấm phẩy có khoảng trắng phía sau** (`/[,;]\s+/gu`) bằng `|` (ranh giới danh sách). Dấu phân cách nhóm nghìn không bao giờ có khoảng trắng phía sau, nên không ảnh hưởng token tiền.
  - Kết quả: `Phòng 202, 203, 204` và `Phòng 202; 203` → **không chặn**.
  - Vẫn chặn: `202,203,204` (không có khoảng trắng – trùng dạng mã cửa `482,913`) và `202 203 204` (chỉ khoảng trắng).
  - Rủi ro chấp nhận: mã cửa hay SĐT viết kiểu danh sách `482, 913` sẽ lọt. Dạng này hiếm; B-15 chống lộ do vô ý, không chống người cố ý (như đã ghi ở trên).
  - Ca test thêm (BE-D):
    - không chặn: `Phòng 202, 203, 204`, `Phòng 202; 203`;
    - chặn: `Phòng 202,203,204`, `Phòng 202 203 204`, `Mã cửa 482,913`.
  - UXD bổ sung câu nhắc: "Nhiều căn thì ghi cách nhau bằng dấu phẩy, ví dụ 202, 203".
- `hasLongDigitRun` (thêm `,` + NFKC, `registration/internal/rules.ts:550`) thuộc module của BE-C: ORC giao BE-C, hoặc cho BE-D sửa 2 dòng. **Không** áp nới (s7) cho luật này: ghi chú khai báo không cần danh sách số.

### C.7 Nhóm D mục A / A.3 (S4-11, S4-32) – **Không đạt** tới khi sửa BE-73

Đạt:
- **Khóa giấy tờ v1:** khóa con HKDF từ `ID_HASH_KEY` (info `ottimo:guest_doc:v1`) rồi HMAC-SHA256 (`envelope-crypto.service.ts:195-200`), tiền tố `v1:` (`registration.service.ts:713-721`). Staging/production bắt buộc có khóa (`keyring.ts:66-69`).
- **DB:** CHECK định dạng `^v1:[0-9a-f]{64}$`; CHECK `id_doc_hmac IS NULL OR crm_consent='granted'`; CHECK hồ sơ `document` tối thiểu; chỉ mục duy nhất (`0055:58-75, 85-86`).
- **Không lộ:** `id_doc_hmac` không có trong `GUEST_COLUMNS`; audit chỉ `{code, source}`.
- **`idDocLast4`:** `x-visible-to` FD+; mapper chỉ trả khi `granted`; chỉ ghi ở `writeDocKey` với `WHERE crm_consent='granted'`; rút đồng ý thì xóa cả khóa và 4 số cuối.
- **Thứ tự khớp** (`document-party.port.ts:100-131`) đúng SEC 7.4: tên + ngày sinh khớp hồ sơ ngoài đơn thì không tự gắn, chỉ trả cờ. Nhãn không có danh tính khách khác.
- **SAL/CTV:** không thấy hồ sơ `document` chưa P05; không có đường tra theo số giấy tờ; `addGuestDocument` chỉ FD+.
- `updateGuest` → 422 cho tags/freeNote/serviceNotes/ngày sinh/giới tính của hồ sơ chưa P05.
- J25 tự bù mốc trả phòng, không ẩn danh hồ sơ còn lưu trú mở, có `purge_journal`.

Không đạt:
- **BE-73.** Giấy tờ chính không có `partyMemberId` luôn được coi là của **người đặt** (`guestOfPerson`, `registration.service.ts:723-743` – SEC chính đã đọc lại ở `7ac11a4`). Mô hình đơn chỉ có người đặt + `companion`/`child`. Desk đặt giấy tờ nhập đầu tiên làm giấy tờ chính (`DocsPanel.tsx:646`).
- **BE-74, BE-75.** J25 chỉ ẩn danh tên. Hồ sơ của đơn hủy, no-show hay thành viên bị bỏ thì không bao giờ có mốc hạn lưu. SEC chính đã đọc lại `document-profile.service.ts` `anonymizeDue`.

Quan sát, không thuộc bảo mật: ở `7ac11a4`, admin-web chưa đọc `possibleReturningGuest`, nên nhãn "có thể là khách quen" (S4-11 phần FE-A) chưa có. ORC/QC kiểm phần FE của S4-11.

### C.8 Thẻ feedback

### FB-R2-SEC-BE-65
- Mức độ: Major (rủi ro Medium) | Người sửa: BE-C (housekeeping, files); BE-B cho phần (b) ở folio-lines
- Vị trí:
  - `files/public/attachment.service.ts:81-87` (`work_order`/`inspection` nhận tải lên từ Sprint 4), `:242-259` (`bindTo`: mốc tùy chọn), `:296-311` (`purgeDue` chỉ xóa tệp đã gắn khi có mốc);
  - `housekeeping/internal/work-orders.service.ts:599-607`, `:914`; `housekeeping.service.ts:1211-1219` (`bindTo` không truyền mốc).
- Vấn đề: ảnh sự cố, ảnh sửa xong và ảnh kiểm phòng đã gắn vào bản ghi nhưng `retention_anchor_at = NULL`, nên J16 không bao giờ xóa. Ca P1: phiếu `done`, `purgeDue` ở T0 + 3 năm → `{"purged":0}`, cả hai ảnh còn. Đây là hồi quy của mục tiêu FB-R2-SEC-BE-38: Sprint 3 chặn tải lên cho tới khi có module; Sprint 4 mở lại tải lên nhưng không đặt mốc.
- Vì sao quan trọng: SEC I5, SR-RET, NĐ 13 – dữ liệu hết mục đích phải xóa. Ảnh kiểm phòng có thể chụp đồ đạc hay sự có mặt của khách.
- Đề xuất sửa:
  - phiếu sửa sang `done`/`cancelled` → `setRetentionAnchor` = giờ đóng; `reopen` → xóa mốc, đặt lại khi đóng lại;
  - lần kiểm phòng → mốc = `inspected_at`, đặt ngay lúc `bindTo`;
  - test: phiếu `done` + J16 sau `attachment_ops_retention_months` + 1 ngày → `purged_at`, DEK hủy; trước hạn thì còn;
  - migration bù mốc cho ảnh đã gắn sẵn.
  - (b) gộp từ SEC-G3: ảnh `penalty_evidence` gắn vào `folio_line` **sau** trả phòng (BR-427 c, `allowPostCheckout`, `folio/internal/folio-lines.service.ts:303-305`) cũng không có mốc, vì mốc chỉ đặt một lần lúc trả phòng (`registration.service.ts:2318-2323`). Đọc mã, chưa probe → `bindTo` với mốc = `actual_checkout_at` (hoặc muộn hơn khi có khiếu nại);
  - lưới an toàn J16: ảnh đã gắn mà vẫn không có mốc sau `uploaded_at` + `attachment_ops_retention_months` + biên → báo "Cần chú ý" hoặc xóa theo `uploaded_at`.
- Liên quan: thay cho điểm (2) của FB-R2-SEC-BE-38 (mở lại một phần, `s3-SEC.md` mục 10.2). Đóng BE-65 thì đóng luôn BE-38.
- Hạn: sửa trong round (Major). Muộn nhất **trước dữ liệu thật** (ảnh phòng thật trên staging/production).
- Trạng thái: **Verified 19/10** (cây làm việc của BE-C, chưa commit, `s4-be-c.md` mục 21; mục C.15, QC K1). Kiểm lại trên commit chấm lại khi BE-C commit, chỉ cần chạy lại 2 tệp test SEC nêu ở C.15. Việc còn lại tách thành **FB-R2-SEC-BE-84** (Minor, R3 Sprint 1)

### FB-R2-SEC-BE-66
- Mức độ: Minor (rủi ro Low) | Người sửa: BE-B (guests); BE-C (phía HK)
- Vị trí: `guests/internal/guests.service.ts:281-291` (chỉ kiểm độ dài ≤ 40, không đối chiếu danh mục); `housekeeping.service.ts:246-248` (trả `serviceNotes` cho HK).
- Vấn đề: rbac D12a quy định danh mục cố định, không gì về sức khỏe; D12b cho HK chỉ thấy nhãn chung. Ca P5: `PATCH /guests/{id}` `serviceNotes: ["Dị ứng tôm cua"]` → 200, sau đó HK đọc `room-statuses` thấy nguyên chuỗi. Danh mục chỉ có ở admin-web (`guestCatalog.ts`).
- Vì sao quan trọng: dữ liệu sức khỏe (C3) có thể tới máy cá nhân của HK chỉ vì server không kiểm.
- Đề xuất sửa: server kiểm theo danh mục khóa đóng → 422 `NOT_IN_LIST`; migration chuyển hoặc xóa giá trị lạ; test ca P5.
- Trạng thái: Open

### FB-R2-SEC-BE-67
- Mức độ: Minor (rủi ro Low) | Người sửa: BE-C
- Vị trí: `housekeeping.service.ts:236` (`currentGuest: full_name · room_no`), `:242`, `:309`; test `housekeeping-s4.test.ts:217` đang khẳng định họ tên đầy đủ.
- Vấn đề: SR-PWA-01 và rbac D01 cho HK "tên gọi + số căn". Server trả họ tên đầy đủ, PWA lưu vào IndexedDB (`cache.ts:75`).
- Vì sao quan trọng: thu gọn dữ liệu trên máy cá nhân của buồng phòng.
- Đề xuất sửa: HK nhận tên gọi (từ cuối của họ tên, như `bookerFirstName`) + số căn; FD+ giữ họ tên; sửa test.
- Trạng thái: Open

### FB-R2-SEC-BE-68
- Mức độ: Minor (rủi ro Low) | Người sửa: BE-C, BE-D
- Vị trí: `housekeeping.service.ts:1001` (`start` không có cận dưới), `:901` (`done_at` = giờ máy); `guest-portal/internal/guest-requests.service.ts:210-231` (`lastFullClean` dùng `done_at` làm căn cứ phí BR-506-03).
- Vấn đề: HK, hoặc máy để sai giờ, khai `start`/`complete` lùi tới 24 giờ, sớm hơn cả lúc tạo việc hay giờ khách nhận phòng. Khi đó lần dọn đầy đủ trong ngày rơi ra ngoài cửa sổ tính phí, và lần dọn thứ hai khách yêu cầu thành miễn phí. Giờ máy đang quyết định tiền.
- Vì sao quan trọng: giờ do nhân viên tự khai không được làm hở đường gian lận tiền hay làm sai báo cáo.
- Đề xuất sửa: `performedAt ≥ max(task.created_at, started_at)` → 422; quyết định phí dùng giờ server (`occurred_at` của SM-14). Làm cùng ARC S4-01/S4-05/S4-09. Test start trước `created_at` → 422.
- Trạng thái: Open

### FB-R2-SEC-BE-69
- Mức độ: Minor (rủi ro Low) | Người sửa: BE-B
- Vị trí: `identity/internal/me.service.ts:110-128`
- Vấn đề: `deviceTrusted` tính từ cookie thiết bị, không xét `client_origin`. Ca P3: phiên `staff_pwa` kèm cookie thiết bị hợp lệ → `GET /v1/me` trả `deviceTrusted = true`. Guard vẫn chặn (SEC-BE-34), nhưng hợp đồng `Me` mâu thuẫn SR-DEV-04 và báo cáo MOB ("luôn false").
- Vì sao quan trọng: hai nguồn sự thật cho một luật; client dựa vào cờ để hiện nút C3 sẽ hiện sai.
- Đề xuất sửa: `staff_pwa` → `deviceTrusted = false`; test như P3.
- Trạng thái: Open

### FB-R2-SEC-BE-70
- Mức độ: Minor (rủi ro Low) | Người sửa: BE-D (BE-A review)
- Vị trí: `reservations/public/guest-room-view.ts:36-38` (`ORDER BY s.from_date DESC LIMIT 1`)
- Vấn đề: lấy đoạn lưu trú bắt đầu muộn nhất, không phải đoạn đang hiệu lực hôm nay. Đơn ở nối tiếp hai căn hay có lịch đổi căn trước sẽ hiện tên căn sau cho khách. Trái BR-012 (5). Cùng loại BUG-R2-178.
- Vì sao quan trọng: khách có thể tìm tới nhầm căn đang có người ở.
- Đề xuất sửa: dùng chung định nghĩa "căn hiện tại" (`currentRoomOfStay`); test đơn hai đoạn hai căn.
- Trạng thái: Open

### FB-R2-SEC-BE-71
- Mức độ: Suggestion | Người sửa: BE-C
- Vị trí: `files/public/attachment.service.ts:56-73`
- Vấn đề: MT chỉ đọc được ảnh mình tải, nên không mở được "ảnh lúc báo" do HK chụp (404). Chặt hơn SEC I1 ("ai thấy phiếu thì thấy ảnh của phiếu"), làm hỏng H22.
- Đề xuất sửa: cho đọc khi tệp đã gắn vào phiếu mà người gọi xem được phiếu đó.
- Trạng thái: Open

### FB-R2-SEC-BE-72
- Mức độ: Suggestion | Người sửa: BE-D
- Vị trí: `events/internal/events.controller.ts:70-134`; `auth.guard.ts:470`
- Vấn đề:
  - sau đăng xuất/thu hồi phiên, luồng còn nhận id tối đa 25 giây;
  - trang cùng site (guest-web, landing) mở được luồng bằng cookie SameSite=Lax: không đọc được (không có CORS) nhưng chiếm chỗ trong giới hạn 5 luồng/người.
- Đề xuất sửa: `logout`/thu hồi phiên gọi hub đóng ngay luồng của phiên; `streamEvents` từ chối `Origin` ngoài danh sách origin nhân viên.
- Trạng thái: Open

### FB-R2-SEC-BE-73
- Mức độ: Major (rủi ro Medium – xem C.9) | Người sửa: BE-C (registration); BE-A, BE-B review; FE-A nếu đổi Desk
- Vị trí: `registration/internal/registration.service.ts:723-743` (`guestOfPerson`: giấy tờ chính không `partyMemberId` → `booker_guest_id`), `:745-757` (`keepDocKey`), `:1270-1345` (`recordCrmConsent`); `apps/admin-web/src/pages/registration/DocsPanel.tsx:646` (`isMain: first`).
- Vấn đề: giấy tờ chính được coi là của người đặt mà không kiểm người trên giấy tờ có phải người đặt không. Tái hiện (DB test, ngoài repo), người đặt X có P05 đặt phòng cho Y (đặt hộ – việc thường):
  - (1) nhập giấy tờ của Y làm giấy tờ chính → hồ sơ X nhận `id_doc_last4` và khóa giấy tờ của Y;
  - (2) Y từ chối P05 → hồ sơ X thành `refused`; Y đồng ý → X thành `granted` dù X không đồng ý;
  - (3) Y quay lại ở đơn khác (người đi cùng) → giấy tờ của Y tự gắn vào **hồ sơ X**.
- Vì sao quan trọng: trái điều kiện SEC đã ký ở `s3-SEC.md` 7.3/F03 (khóa giấy tờ chỉ ghi khi **chính người đó** đồng ý P05); đồng ý gán sai người (NĐ 13); gộp nhầm hồ sơ (lịch sử, ghi chú CRM của X hiện ở đơn của Y – tác hại 7.4).
- Đề xuất sửa:
  - chỉ coi giấy tờ chính là của người đặt khi `nameSearchKey(full_name_on_doc) === name_search` của người đặt, hoặc lễ tân chọn rõ người đặt;
  - ngược lại: `keepDocKey` không ghi; `recordCrmConsent` trả 422 `REQUIRED` (cần chọn người) hoặc đi luồng tạo hồ sơ "từ giấy tờ" rồi mới ghi P05;
  - test đủ 3 bước tái hiện;
  - script kiểm dữ liệu đã ghi trên DB demo/test (không có dữ liệu thật).
- Hạn: **trước khi SEC ký S4-11/S4-32** (CỔNG – G3.2). Bắt buộc trước dữ liệu thật.
- Trạng thái: **Verified 18/10** (cây làm việc – mục C.10); **Verified lại 19/10 trên HEAD `50db5cd`** của repo công khai (mã chạy = `d527f9c`; mã BE-73 gộp ở `20f69f8`) – mục C.14 (QC K6)

### FB-R2-SEC-BE-74
- Mức độ: Major (rủi ro Medium) | Người sửa: BE-C (J25); BE-B review guests
- Vị trí: `guests/public/document-profile.service.ts` `anonymizeDue` (chỉ đổi `full_name`/`name_search`); `guests.service.ts:455-463` (hồ sơ `document` vẫn nhận SĐT, email, công ty).
- Vấn đề: FD thêm SĐT/email/công ty cho hồ sơ `document` → 200. J25 sau 14 tháng đặt `anonymized_at` và tên `ANON…` nhưng **giữ** SĐT, email, công ty (tái hiện). Chỉ mục duy nhất SĐT/email bỏ qua hàng đã ẩn danh, nên có thể sinh hồ sơ trùng.
- Vì sao quan trọng: bản ghi "đã ẩn danh" vẫn định danh được người; trái T05 và SEC 7.2 (thêm liên hệ thì ra khỏi chế độ "từ giấy tờ").
- Đề xuất sửa: (a) thêm liên hệ → `source` thành `desk`, áp T05/T06 như hồ sơ CRM thường; **hoặc** (b) J25 NULL mọi trường ngoài 7.1. Có test.
- Hạn: sửa trong round nếu kịp. Muộn nhất **trước dữ liệu thật** (cùng cổng ESC-001).
- Trạng thái: Open

### FB-R2-SEC-BE-75
- Mức độ: Major (rủi ro Medium) | Người sửa: BE-C
- Vị trí: `document-profile.service.ts` `anonymizeDue` – bù mốc chỉ từ đơn `checked_out` có thành viên chưa bị bỏ; điều kiện `last_stay_checkout_at IS NOT NULL`.
- Vấn đề:
  - Hồ sơ `document` tạo trên đơn sau đó bị hủy, no-show, hoặc thành viên bị bỏ → **không bao giờ** có mốc, nên J25 không bao giờ ẩn danh. Tái hiện: hồ sơ trên đơn đã hủy, tạo cách đây 14 tháng → `anon:false`.
  - Kiểm "còn lưu trú mở" chạy dưới RLS theo cơ sở; khi một tổ chức có nhiều cơ sở thì không thấy đơn của cơ sở khác.
- Vì sao quan trọng: lưu tên vô thời hạn, trái T05/SR-RET.
- Đề xuất sửa: mốc = `COALESCE(last_stay_checkout_at, mốc kết thúc của mọi đơn liên quan kể cả cancelled/no_show/removed, created_at)`; kiểm đơn mở trên phạm vi tổ chức (hàm `SECURITY DEFINER` hẹp hoặc J25 theo tổ chức); test.
- Hạn: như BE-74.
- Trạng thái: Open

### FB-R2-SEC-BE-76
- Mức độ: Minor (rủi ro Low) | Người sửa: BE-D
- Vị trí: `guest-portal/internal/guest-requests.service.ts:257-269` (đếm rồi chèn, không khóa)
- Vấn đề: SR-RL-05 (20 yêu cầu/ngày/đơn) dùng `count(*)` dưới READ COMMITTED; gửi song song với Idempotency-Key khác nhau thì vượt 20.
- Vì sao quan trọng: ngập thông báo của bộ phận và lễ tân.
- Đề xuất sửa: khóa đơn (`FOR NO KEY UPDATE` hoặc `pg_advisory_xact_lock`) trước khi đếm; test song song.
- Trạng thái: Open

### FB-R2-SEC-BE-77
- Mức độ: Minor (rủi ro Low) | Người sửa: BE-D; đồng bộ FE-B (mock), ARC (OpenAPI), BA (EP14), UXD (câu nhắc)
- Vị trí: `guest-portal/internal/guest-request-rules.ts:113-121` (`hasSensitiveDigits`); `registration/internal/rules.ts:550-551` (`hasLongDigitRun`)
- Vấn đề: luật B-15 chặn giá và ngày hợp lệ, nên lễ tân không báo được giá xe/tour (EP14 3.2). Đồng thời lọt `,`, chữ số toàn khổ.
- Vì sao quan trọng: tính năng bị chặn; vẫn còn đường vô ý lộ mã cửa/SĐT.
- Đề xuất sửa: cài đúng quyết định C.6 kèm ca test. `hasLongDigitRun` chỉ thêm `,` + NFKC.
- Trạng thái: Open – SEC đã chốt V2 (C.6)

### FB-R2-SEC-BE-78
- Mức độ: Suggestion | Người sửa: BE-C + ARC (CHECK), BE-B (lookup), BE-D/BE-C (T13)
- Vị trí: `0055_s4_contract_037.sql:67-75`; `guests.service.ts:623-626`; `housekeeping.service.ts:844-866`; `work-orders.service.ts:966-988`
- Vấn đề:
  - (a) DB chỉ CHECK `id_doc_hmac`; chưa có `CHECK (id_doc_last4 IS NULL OR crm_consent='granted')`;
  - (b) `lookupGuestByContact` thiếu điều kiện loại hồ sơ `document` (hiện chưa khai thác được);
  - (c) ghi chú D23 được chép sang `hk_task.note`/`work_order.description`: T13 phải xóa cả bản sao.
- Đề xuất sửa: thêm CHECK (kiểm dữ liệu cũ trước); thêm điều kiện lọc; ghi vào thiết kế T13.
- Trạng thái: (a) **Verified 18/10** (migration 0070, mục C.10); (b), (c) Open

### FB-R2-SEC-MOB-03
- Mức độ: Minor (rủi ro Low) | Người sửa: MOB
- Vị trí: `apps/mobile/src/App.tsx:116-134` (401 hoặc hàng đợi dừng vì `auth` → về màn đăng nhập, không xóa gì), `:96-104` (mất mạng lúc mở app → vào bằng hồ sơ đã lưu); `data/cache.ts:129-135` (chỉ xóa khi đổi người)
- Vấn đề: SR-PWA-04 và EP07-08 8.1 yêu cầu hết phiên thì xóa IndexedDB, có cảnh báo hàng đợi. Hiện snapshot (tên khách + căn của việc hôm nay, ghi chú, phiếu sửa) còn trên máy khi phiên đã hết hoặc bị OWN thu hồi; ai cầm máy lúc mất mạng cũng mở đọc được.
- Vì sao quan trọng: máy cá nhân của nhân viên có thể bị mất hoặc nhân viên đã nghỉ.
- Đề xuất sửa: gặp 401 → xóa ngay kho `snapshot`, giữ `queue`/`blobs` để cùng người đăng nhập lại gửi tiếp kèm cảnh báo; chỉ mở offline khi snapshot còn trong hạn nhàn rỗi 72 giờ; test 401 → snapshot rỗng, queue còn.
- Trạng thái: Open

### FB-R2-SEC-MOB-04
- Mức độ: Minor (rủi ro Low) | Người sửa: MOB (guest-web H23); FE-B nếu mock dùng chung
- Vị trí: `apps/guest-web/src/pages/RequestsPage.tsx:349-365`; `mocks/handlers.ts:495-498`
- Vấn đề: server trả `code = CARD_NUMBER_DETECTED` ở cấp trên (`guest-requests-s4-bed.test.ts:332`). Client chỉ đọc mã này trong nhánh `VALIDATION_FAILED`, nên khách thấy "lỗi máy chủ" thay vì câu nhắc không ghi số thẻ. Mock trả `VALIDATION_FAILED` lệch server nên test vẫn xanh.
- Vì sao quan trọng: khách không biết vì sao bị từ chối, dễ gọi điện đọc số thẻ (SR-PAY-09).
- Đề xuất sửa: đọc `fieldErrors` có `CARD_NUMBER_DETECTED` với mọi mã cấp trên; sửa mock theo server; có thể kiểm Luhn ở client trước khi gửi.
- Trạng thái: Open

### C.9 Mức rủi ro của BE-73 (vì sao Medium, không High)

SEC phụ đề xuất High. SEC chính xếp **Major, rủi ro Medium**, cùng thang với FB-R2-SEC-BE-53 (mất/giữ sai C3 của khách còn ở – Major, Medium):
- dữ liệu chỉ lộ trong FD+ (người vốn có quyền xem giấy tờ), không ra ngoài phạm vi được phép;
- chưa có dữ liệu thật và chưa có tin ưu đãi nào được gửi (R2 nhắn tay, BR-971 đòi đồng ý của người nhận);
- sửa được và dữ liệu sai sửa lại được.

Hạ mức **không** làm nhẹ việc phải sửa. BE-73 là lỗi ngay trong tính năng CỔNG S4-11/S4-32: SEC **không ký** S4-11/S4-32 tới khi BE-73 Verified. Cổng vẫn bị giữ qua G3.2 và dòng S4-11/S4-32 của bảng sẵn sàng.

### C.10 Kiểm lại BE-73 và BE-78 (a) – **Verified 18/10**; SEC ký S4-11/S4-32

- Mã kiểm: cây làm việc ngày 18/10 (HEAD `2b134fb` + phần BE-C chưa commit, `s4-be-c.md` mục 15). Có lẫn thay đổi chưa commit của vai khác. Khi BE-C commit, SEC đối chiếu lại commit với kết quả dưới đây (chỉ cần chạy lại ca SEC).
- **Ca tái hiện của SEC, chạy lại** (cùng 3 bước như lúc tìm ra lỗi, ngoài repo, DB mới `ottimo_test_sec_be73`), X đã có P05, đặt hộ Y:

| Bước | Trước khi sửa | Sau khi sửa |
|---|---|---|
| (1) Giấy tờ của Y nhập đầu tiên làm giấy tờ chính, **không** chọn người (cách Desk cũ) | Hồ sơ X nhận last4 + khóa của Y | 201. X **không** có last4/khóa. Giấy tờ được gắn vào một người riêng của Y, hồ sơ ≠ X |
| (2) P05 | Y từ chối → X `refused`; Y đồng ý → X `granted` | Không chọn người → 422 `REQUIRED` (`partyMemberId`). Chọn "người đặt" cho giấy tờ không phải của người đặt → 422. Y từ chối → chỉ Y `refused`, X giữ `granted`. Y đồng ý → Y `granted` + last4 + khóa; X vẫn không có last4 |
| (3) Y quay lại làm người đi cùng ở đơn khác, không chọn người | Gắn vào hồ sơ X | Gắn vào hồ sơ **Y**, không phải X |
| BE-78 (a) | Không có CHECK | `UPDATE guest SET id_doc_last4 … ` khi không P05 → **23514** (`guest_id_doc_last4_consent_check`) |

- **Test repo** trên cùng DB: `guest-document-profiles` (gồm ca "SEC FB-R2-SEC-BE-73 (ARC 16.22)…"), `registration-flow`, `registration-party-removal`, `guests` → **4 tệp, 53/53 xanh**.
- **Đọc mã:**
  - Không còn suy người từ `isMain`. Thiếu `partyMemberId` thì mọi giấy tờ đi cổng khớp người.
  - Người đặt là một người được chọn rõ (`partyMemberId` = id đơn), lưu ở `guest_document.guest_id`.
  - `keepDocKey` và `recordCrmConsent` chỉ ghi lên hồ sơ của đúng người đã gắn.
  - Migration 0070:
    - kiểm dữ liệu cũ trước (`RAISE`, không tự sửa);
    - CHECK `guest_id` loại trừ `party_member_id`;
    - unique một giấy tờ người đặt cho mỗi khai báo;
    - `GRANT UPDATE (guest_id)` hẹp;
    - CHECK BE-78 (a) `NOT VALID` rồi `VALIDATE`.
  - Script `scripts/sec-be73-check.sql`: chỉ đọc, chỉ in id/đếm, không có tên hay số giấy tờ.
- **Kết luận:** FB-R2-SEC-BE-73 **Verified**; BE-78 (a) **Verified**. **SEC ký S4-11/S4-32** (nhóm D mục A/A.3) cho cổng Sprint 4. Giả định ARC (d) "`id_doc_last4` chỉ khi P05" nay **SEC xác nhận** (có cả CHECK DB).
  - FE-A sửa H14 để luôn gửi `partyMemberId` là việc **đúng danh sách đoàn**, không còn là điều kiện bảo mật. Phía server đã an toàn khi thiếu `partyMemberId`: tệ nhất là tạo thêm một người trùng cho chính người đặt, không gán dữ liệu sang người khác. SEC không chặn ký vì việc này.
  - Ghi chú cho OPS/QA: 0070 dừng (`RAISE`) nếu DB demo/QA còn dữ liệu sai theo quy tắc cũ. Chạy `sec-be73-check.sql` trên các DB đó **trước** khi migrate; sửa bằng thao tác Desk hoặc script một lần có review, như ghi đầu script.
- BE-74, BE-75 vẫn Open (dời tới trước dữ liệu thật, như mục Kết luận).

### FB-R2-SEC-BE-79
- Mức độ: Major (rủi ro Medium) | Người sửa: BE-C (registration, guests); BE-B review
- Vị trí: `registration/internal/registration.service.ts` `updateGuestDocument` (đổi `partyMemberId`/người của giấy tờ); `guests/public/document-profile.service.ts` `writeDocKey`. Lỗi có từ trước BE-73, do BE-C tự báo (`s4-be-c.md` mục 15, "Rủi ro còn lại").
- Vấn đề: khi lễ tân sửa giấy tờ từ người A sang người B (sửa chọn nhầm người), khóa giấy tờ và `id_doc_last4` đã ghi lên hồ sơ A **không bị gỡ**. Hệ quả giống BE-73, chỉ qua đường sửa:
  - hồ sơ A giữ 4 số cuối của B;
  - lần sau B đến, cổng khớp theo khóa sẽ gắn B vào **hồ sơ A**.
  
  Nếu P05 đã ghi qua giấy tờ này lúc còn gắn A, quyết định đó cũng nằm trên hồ sơ A.
- Vì sao quan trọng: đúng việc sửa nhầm lại để lại dữ liệu sai. Trái SEC 7.3 (khóa và last4 chỉ trên hồ sơ của chính người đó).
- Đề xuất sửa: trong cùng giao dịch đổi người:
  - (1) gỡ `id_doc_hmac`/`id_doc_last4` khỏi hồ sơ cũ nếu trùng khóa của giấy tờ này;
  - (2) nếu P05 của hồ sơ cũ được ghi qua giấy tờ này: đưa về quyết định trước đó của hồ sơ cũ, hoặc `not_asked`, và ghi audit; người mới phải được hỏi P05 lại (không chép quyết định sang);
  - (3) ghi khóa lên hồ sơ mới chỉ khi người mới có P05;
  - test: gắn A → A có P05 + khóa → đổi sang B → A không còn khóa/last4, B chỉ có khi đã P05; B quay lại → gắn B.
- **Quyết định SEC về mức và hạn:**
  - Major, rủi ro Medium, cùng thang BE-73/BE-53: chỉ lộ trong FD+, chưa có dữ liệu thật, sửa được;
  - tần suất thấp hơn BE-73, vì chỉ xảy ra khi lễ tân chọn nhầm rồi sửa. Đường chính (BE-73) đã đúng.
  - **Chấp nhận đề xuất của BE-C: sửa cùng BE-74/BE-75, hạn trước dữ liệu thật** (cùng cổng ESC-001).
  - **Không** chặn ký S4-11/S4-32 hay cổng S4, với điều kiện ORC ghi hạn vào decision-log và backlog như BE-65/74/75.
- Trạng thái: Open

### C.11 Giả định FE-B (UXR P-06): danh sách "Khai báo quá hạn" trên máy chưa cấp quyền – **SEC ĐỒNG Ý**

Nguồn: `outputs/FE/s4-report.md`, mục "FE-B – UXR S4", dòng P-06 và giả định "[GIẢ ĐỊNH – chờ SEC xác nhận]".

- `listRegistrations` chỉ cho FD+ (`x-roles: [owner, manager, front_desk_lead, front_desk]`). Operation này không có `x-requires-trusted-device` và không có trường C3.
- `RegistrationSummary` gồm: mã đơn, số căn, `guestDisplayName` (D01, lấy từ đơn, không từ giấy tờ), ngày đến, loại khai báo, trạng thái, số giấy tờ n/N, hạn. Đây là cùng lớp dữ liệu C2 vận hành mà Desk vẫn hiện trên máy chưa cấp (sơ đồ phòng, danh sách đơn).
- SR-DEV-03 chỉ đòi máy được cấp cho endpoint C3: giấy tờ, ảnh, `sensitive`, `portal-data`, mã cửa, tài khoản hoàn. Chi tiết khai báo và giấy tờ vẫn khóa trên máy chưa cấp, nên P-06 không nới ranh giới nào.
- **Kết luận: ĐỒNG Ý.** Giữ dòng `UNTRUSTED_PAGES`. **API không cần chặn lại.**
- Điều kiện giữ:
  - trang chỉ hiện các trường trên. Không thêm trường giấy tờ (số, quốc tịch chi tiết, ngày sinh, ảnh) vào danh sách hay `RegistrationSummary` mà không qua SEC;
  - dòng không bấm được; không lưu vào Web Storage/IndexedDB (giữ quy tắc `app/storage.ts`).
- Nhắc lại SR-DEV-09: máy cá nhân của nhân viên không bao giờ được cấp quyền. Việc trang này mở được trên máy chưa cấp không đổi quy định dùng thiết bị của cơ sở.

### C.12 Vòng sửa 7 (gộp #18 = `316b9ac`) – đường `debt_write_off` và N-7 (SEC, 18/10)

Nguồn: `reviews/s4-money-recheck7.md` (mục "Phân loại bảo mật", BUG-R2-203, N-7), ARC 16.27 mục 2 và 16.28, BE-B `foc.service.ts`.

Mã kiểm:
- `316b9ac`, cộng phần BE-B chưa commit ở `foc.service.ts`: trần lấy `OpenDebt.openDebtVnd`, không lấy số dư. Phần sửa này không chạm chỗ lỗi dưới đây.
- Ca thử của SEC nằm ngoài repo: bản sao `reversal-debt-g4.test.ts` cộng một ca `SEC-R7`, chạy trên DB mới `ottimo_test_sec_r7`.

**Kết quả `debt_write_off`:**

| Điểm kiểm | Kết quả | Bằng chứng |
|---|---|---|
| Vai: chỉ OWN, MGR | Đạt | `foc.service.ts` `WRITE_OFF_ROLES = ['owner','manager']`, FD → 403. Test "R7LOCK-02 rules" |
| `kind = foc`, ghi chú bắt buộc, chỉ khi có công nợ mở, folio đang mở → 422 | Đạt | Cùng test |
| Hạn mức BR-433 (MGR tới giá 1 đêm, vượt → chờ OWN) | Đạt | `approvals.submit` với `limitBasisVnd = nightRateBasis`; test 5.000.000 → `pending`, `requiredRole: owner` |
| **Trần ≤ công nợ đang mở** | **Không đạt** | Chỉ kiểm lúc **gửi**. Lúc **duyệt** không kiểm lại, và lúc gửi không trừ các yêu cầu xóa nợ đang chờ (FB-R2-SEC-BE-80) |
| Audit, báo cáo | Đạt | Audit money `folio.foc_requested` (ghi chú = lý do), dòng duyệt, audit hoa hồng `commission.projected`; báo cáo FOC tách mã `debt_write_off`, không vào cảnh báo BR-435 (`reporting/internal/attention-sources.ts`) |
| Đua với thu nợ (MGR tự áp ‖ FD thu) | Đạt | L1 → L3 ở cả hai lệnh; test cặp đua "R7LOCK-02 … one 201, the other 409" ở cả hai thứ tự |
| **Đua "yêu cầu chờ OWN" ‖ thu nợ** | **Không đạt** | FB-R2-SEC-BE-80 |

Ca thử `SEC-R7`:
- (A) Công nợ 5.000.000. MGR xin xóa 5.000.000 → `pending`. Khách trả đủ 5.000.000 → 201. OWN duyệt → 200 `approved`. Kết quả: folio `closed`, còn phải thu 0, **dư thừa 5.000.000**.
- (B) Công nợ 8.000.000, thu 3.000.000, còn 5.000.000. Hai yêu cầu xóa 5.000.000 và 3.000.000 đều qua trần lúc gửi, đều `pending`. OWN duyệt cả hai → **dư thừa 3.000.000** trên folio `closed`.

### FB-R2-SEC-BE-80
- Mức độ: **Blocker** (sai tiền – protocol mục 6; rủi ro SEC: Medium) | Người sửa: BE-B (folio, approvals); BE-A (cổng `openDebt`/`debtSettled`); QA cấp mã lỗi
- Vị trí:
  - `folio/internal/foc.service.ts` `request` (trần `min(headroom, nợ)` chỉ lúc gửi, không trừ yêu cầu xóa nợ đang chờ);
  - `onDecided` → `syncReductions` → `afterWriteOff` (lúc duyệt không đối chiếu công nợ hiện tại).
- Vấn đề: yêu cầu `debt_write_off` vượt hạn mức MGR phải chờ OWN. Trong lúc chờ:
  - khách trả nợ, hoặc có yêu cầu xóa nợ khác;
  - OWN duyệt sau đó, FOC vẫn được áp đủ số đã xin;
  - kết quả là dư thừa trên folio `closed` (5.000.000 ở ca A, 3.000.000 ở ca B).
  
  Folio `closed` không chi hoàn được (`FOLIO_LOCKED`), nên số này treo trên sổ: báo cáo tiền sai, khách "được nợ lại" khoản đã trả.
- Vì sao quan trọng:
  - sai tiền trong luồng thường (khách chuyển khoản trả nợ sau khi quản lý đã xin xóa);
  - mở đường gian lận nội bộ: xin xóa, cho người quen trả, rồi chờ đường hoàn ở R3;
  - trái ARC 16.27 mục 2 ("không để xóa nợ sinh dư thừa").
- Đề xuất sửa:
  1. Lúc gửi: trần = min(dư địa của dòng, công nợ mở − Σ yêu cầu `debt_write_off` đang chờ của folio). Chạy dưới L1 → L3 như hiện tại.
  2. Lúc duyệt: preLock đã giữ L1 → L3. Với `debt_write_off`, áp **min(số đã duyệt, công nợ mở lúc duyệt)**.
     - Công nợ đã đóng hoặc bằng 0 → yêu cầu tự hủy (`superseded`, lý do "công nợ đã thu/xóa"), không ghi FOC, báo người xin.
     - Phần áp được nhỏ hơn số xin → ghi rõ trong audit và trong phản hồi duyệt.
     - Không bao giờ để `creditVnd > 0` vì xóa nợ.
  3. Test:
     - ca A và B ở trên → dư thừa 0, công nợ đóng một lần;
     - cặp đua "OWN duyệt ‖ FD thu nợ" hai thứ tự, kết quả bằng chạy tuần tự;
     - BR-525-15 giữ nguyên.
- Hạn: **trước gộp #18 / trước khi QA đóng BUG-R2-203**. Đường mới này chưa đạt "trần ≤ công nợ".
- Trạng thái: **Closed – Verified 18/10 trên `f6803d0`** (mục C.13)

### FB-R2-SEC-BE-81 – N-7: chặn A32 giảm dòng khi đơn có công nợ mở – **quyết định SEC**
- Mức độ: Major (rủi ro Medium – kiểm soát nội bộ) | Người sửa: BE-B (folio `adjustFolioLine`); BE-A (cổng `openDebt`); DOM chốt câu nghiệp vụ; BA sửa SM-13
- Vị trí: `adjustFolioLine` (A32: `voidLine`, giảm `newQuantity`/`newUnitPriceVnd`) trên folio `settled` có công nợ mở.
- Vấn đề: theo QA (2/2 tái hiện), MGR một mình void 1.500.000 và 1.200.000 trên folio `settled` đang nợ → 201. Không có yêu cầu duyệt, không vào báo cáo FOC/xóa nợ, `debt_settled_at` vẫn null. Cùng số đó qua `debt_write_off` thì phải chờ OWN (BR-433).
  - Ca SEC thử thêm không đi tới đó: thiếu `If-Match` → 428. SEC dùng kết quả của QA.
- Vì sao quan trọng: hai đường cho cùng một việc là tha tiền khách đang nợ. Đường không hạn mức, không vào báo cáo, sẽ thành đường chính để vượt BR-433. Audit có ghi nhưng không ai đọc nếu không có báo cáo.
- **Quyết định SEC (kiểm soát nội bộ):**
  - Khi đơn có công nợ mở, A32 **giảm** dòng (void, giảm số lượng/đơn giá) → **409** cho **mọi vai, kể cả OWN**. ARC chọn mã, dùng mã có sẵn, ví dụ `FOLIO_LOCKED` kèm `detail`.
  - Desk chỉ sang "Xóa nợ" (`debt_write_off`). OWN dùng chính đường đó: tự áp không giới hạn nhưng vẫn vào báo cáo và đóng công nợ đúng cách.
  - A32 **tăng** dòng trên folio `settled` vẫn được (công nợ đi theo số còn phải thu).
  - Folio không có công nợ: giữ A32 như hiện nay (sửa sai trong cửa sổ 24 giờ).
- DOM đang chốt câu nghiệp vụ. Nếu DOM chọn "A32 là sửa sai có audit" thì SEC **không đồng ý** giữ nguyên. Cách thay tối thiểu:
  - A32 giảm trên đơn có công nợ phải qua hạn mức BR-433 như FOC;
  - và vào báo cáo xóa nợ.
- Test:
  - đơn có công nợ: MGR và OWN void/giảm → 409, folio và công nợ không đổi;
  - tăng dòng → 201, công nợ tăng;
  - đơn không nợ trong cửa sổ: A32 như cũ.
- Hạn: sửa trong round (Major), cùng PR với BE-80 nếu kịp; muộn nhất trước dữ liệu thật.
- Trạng thái: **Closed – Verified 18/10 trên `f6803d0`** (mục C.13; test BE-B "N-7 …")

### FB-R2-SEC-BE-82
- Mức độ: Suggestion | Người sửa: BE-B; ARC
- Vấn đề:
  - (a) 403 theo trường trong handler (FD gửi `debt_write_off`, FD gửi `debt` ở B18) không ghi `access.denied`. Chỉ guard theo operation mới ghi (SR-AZ-01).
  - (b) MGR tự áp `debt_write_off` trong hạn mức không bắt nhập lại mật khẩu. Đây là tha tiền sau khi đã chốt bill, nên SEC đề nghị nhập lại mật khẩu như khi duyệt (`approveRequest`).
- Đề xuất sửa:
  - (a) helper chung ghi `access.denied` cho 403 trong handler;
  - (b) `requestFoc` với `reasonCode = debt_write_off` bắt buộc `authMethod`/`secret` của người gọi (`PasswordReauth.verify`, bộ đếm SR-RL-02).
- Hạn: R3, hoặc cùng BE-80 nếu tiện.
- Trạng thái: Open

**Kết luận C.12:**
- Đường `debt_write_off` **chưa đạt** vì Blocker BE-80 (sai tiền khi duyệt muộn). Phải sửa trước gộp #18 và trước khi đóng BUG-R2-203.
- N-7: **SEC quyết chặn A32 giảm dòng khi có công nợ mở** (BE-81, Major).
- Không có lỗ hổng xác thực mới. Không có ESC mới.

### C.13 Kiểm lại BE-80, BE-81 trên gộp #19 = `f6803d0` (SEC, 18/10)

- Mã kiểm: **`f6803d0`**, bản trích `git archive` riêng của SEC trong scratchpad. `node_modules` liên kết từ repo. `dist` của `packages/contracts` và `integrations` chép từ cây chính (không có trong git).
- Không đụng cây chính, ngoài tệp review này. DB mới `ottimo_test_sec_r8`. Nguồn: `s4-be-b.md` mục 25, ARC 16.30.
- Test repo trên bản trích: `reversal-debt-g4`, `foc-debt-write-off-s4-bed`, cộng tệp ca SEC → **3 tệp, 59/59 xanh**. Hai dòng log ERROR "test: failure after the debt was written" là lỗi cố ý của ca rollback trong test, không phải lỗi mã.

| Ca SEC (giữ nguyên như C.12) | Trên `316b9ac` | Trên `f6803d0` |
|---|---|---|
| A: chờ OWN 5.000.000 → khách trả đủ → OWN duyệt | Áp đủ → dư thừa 5.000.000 trên folio `closed` | Duyệt → yêu cầu **tự hủy `debt_cleared`**, áp 0, không có dòng FOC. Folio `closed`, còn phải thu 0, **dư thừa 0**, công nợ đóng |
| B: công nợ 5.000.000, xin 5.000.000 (chờ) rồi xin thêm 3.000.000 | Cả hai qua trần → dư thừa 3.000.000 | Yêu cầu thứ hai → **422 `max` 0** (trần lúc gửi trừ yêu cầu đang chờ). OWN duyệt yêu cầu đầu → áp 5.000.000. **Dư thừa 0** |
| Đua "OWN duyệt yêu cầu chờ" ‖ "FD thu đủ nợ", chạy đồng thời 6 lần (3 lần mỗi thứ tự) | – | Cả 6 lần: một bên thu 201, bên duyệt ra `cancelled`. Folio `closed`, còn phải thu 0, **dư thừa 0**, công nợ đóng một lần. Không 500, không deadlock |
| N-7: A32 giảm dòng khi có công nợ mở | MGR 201, không duyệt | Test BE-B "N-7 (DOM 18/10, BR-525) …" xanh: void/giảm giá → 409 `FOLIO_LOCKED`; phần nợ chỉ giảm qua `debt_write_off`. SEC thử thêm trên folio `closed`: MGR tăng/giảm và OWN void → đều 409 (đúng ARC 16.28) |

- Đọc mã:
  - `approval.service.ts` `setAppliedCap`: `applied_cap_vnd` cố định lúc duyệt; audit money `approval.applied_capped` (mã lý do, không có tên);
  - `cancelApproved`: tự hủy `debt_cleared`, không tính vào hạn mức người duyệt, báo người xin;
  - quyết định chạy dưới preLock L1 → L3.
- **Kết luận:** FB-R2-SEC-BE-80 **Closed**, FB-R2-SEC-BE-81 **Closed** (Verified trên `f6803d0`).

**Rà các cách lách hạn mức BR-433 còn lại:**

| Cách | Kết quả |
|---|---|
| MGR duyệt yêu cầu chờ OWN (của mình hoặc MGR khác) | Bị chặn: 403 `APPROVAL_LIMIT_EXCEEDED` (đã thử) |
| FD xóa nợ | Bị chặn: 403 (test BE-B) |
| A32 tăng rồi xóa nợ | Không tạo đường mới. Folio `closed` → A32 409 cả tăng lẫn giảm. Trong cửa sổ 24 giờ, tăng dòng thì công nợ tăng bằng đúng số đó, xóa nợ vẫn bị trần công nợ. Không ra tiền |
| Nhiều yêu cầu chờ cộng vượt nợ | Bị chặn (ca B) |
| **Chia nhỏ yêu cầu dưới giá 1 đêm** | **Lách được** (FB-R2-SEC-BE-83) |

### FB-R2-SEC-BE-83
- Mức độ: Major (rủi ro Medium – kiểm soát nội bộ) | Người sửa: BE-B (folio/approvals); DOM chốt câu "một lần" cho xóa nợ; PO ghi BR-433
- Vị trí:
  - `approvals/public/approval.service.ts` `selfApplication` (a): `within(input.amountVnd, limit.perTime)` xét **từng yêu cầu**;
  - BR-433: "Quản lý: ≤ giá 1 đêm phòng/lần, không giới hạn tháng".
- Vấn đề: ca thử trên `f6803d0`: công nợ 5.000.000 trên một dòng, giá 1 đêm (cơ sở hạn mức) 667.000. MGR gửi 11 yêu cầu `debt_write_off` 450.000 → cả 11 **tự áp** (`approved`, vai `manager`), xóa 4.950.000 mà OWN không duyệt. Yêu cầu thứ 12 chỉ bị chặn vì chạm trần công nợ (422). Quy tắc "MGR xóa vượt giá 1 đêm thì chờ OWN" (ARC 16.27 mục 2, DOM 18/10) mất tác dụng khi chia nhỏ. Không có hạn mức tháng cho MGR nên không có gì chặn.
- Vì sao quan trọng:
  - xóa nợ là tha tiền sau khi đã chốt bill, đường dễ gian lận nhất (TM-06, TM-32);
  - một quản lý một mình tha toàn bộ công nợ lớn chỉ bằng nhiều lần bấm;
  - báo cáo FOC có ghi từng lần nhưng không ai bị chặn hay được báo.
- Đề xuất sửa:
  - với `reasonCode = debt_write_off`, hạn mức "mỗi lần" của MGR tính trên **tổng xóa nợ của cùng công nợ**: Σ số đã áp/đã duyệt của các yêu cầu `debt_write_off` trên folio kể từ khi công nợ mở, cộng yêu cầu này, ≤ giá 1 đêm;
  - vượt thì chờ OWN, kể cả khi từng mảnh nhỏ hơn giá 1 đêm. Đọc dưới L1 → L3 như trần hiện tại;
  - test: 11 × 450.000 → yêu cầu thứ 2 (tổng 900.000 > 667.000) `pending` OWN; OWN tự áp không đổi;
  - DOM xác nhận "một lần = một công nợ" cho xóa nợ, PO ghi vào BR-433.
- Ghi chú phạm vi:
  - FOC thường trên folio đang mở cũng chia nhỏ được, vì hạn mức của MGR là "mỗi lần, không giới hạn tháng". Đây là quy tắc kinh doanh INV đã chọn (ESC-007 A), nên SEC **không** tự đổi.
  - Đề nghị DOM/PO xem ở R3: hạn mức theo khóa FOC hoặc theo lượt ở, hoặc báo OWN khi một người áp nhiều FOC trên cùng lượt. Nếu cần đổi thì gom ESC cuối round.
- Hạn: sửa trong round nếu kịp (cùng PR BE-80); muộn nhất **trước dữ liệu thật**. Không chặn cổng S4: không sai tiền, mọi lần đều có audit, báo cáo FOC tách mã `debt_write_off`.
- Trạng thái: Open

### C.14 QC K6 – BE-73 trên commit đã gộp: **Verified 19/10 trên HEAD `50db5cd`** (SEC)

Cổng QC Sprint 4 (`qc/s4-qc-gate.md` mục 5, K6) yêu cầu SEC ghi Verified BE-73 trên commit đã gộp, không phải cây làm việc (C.10).

- **Commit kiểm:** HEAD `50db5cd` của repo công khai `ottimo-hotel-app-public`. Mã chạy giống `d527f9c` của repo cũ (`git diff d527f9c HEAD -- product/` chỉ đổi tài liệu, OpenAPI, test, fixture; không đổi `src`).
- **Mã BE-73 đi vào lịch sử ở `20f69f8`.** Từ `20f69f8` tới HEAD, `registration/` chỉ đổi một chỗ: BUG-R2-205, một câu `SELECT count(*)` chỉ đọc để cảnh báo `partyOverCount`. Không chạm `guestOfPerson`, `keepDocKey`, `recordCrmConsent`, migration 0070 hay `sec-be73-check.sql`.
- **Đọc lại mã trên HEAD** (`registration.service.ts`):
  - `guestOfPerson` (dòng 773–787): chỉ trả hồ sơ người đặt khi giấy tờ gắn rõ người đặt (`bookerGuestId`), ngược lại trả hồ sơ của thành viên. Không còn suy người từ `isMain`.
  - Thêm giấy tờ không có `partyMemberId` đi cổng `party.memberForDocument` (dòng 654–672). Cổng này dùng cả giấy tờ chính.
  - `recordCrmConsent` (dòng 1362–1373): giấy tờ chưa gắn ai → 422 `REQUIRED`; không tìm ra hồ sơ → 422 `NOT_IN_LIST`.
- **Chạy lại** trên `git worktree` sạch tại `50db5cd`, tách khỏi cây làm việc chính (lúc kiểm, cây chính có thay đổi chưa commit của BE-C cho BE-65). DB là container Postgres 17 tạm của SEC, dùng role và mật khẩu CI công khai trong `ci.yml`, migrate đủ tới 0076:
  - 4 tệp `guest-document-profiles`, `registration-flow`, `registration-party-removal`, `guests`: **4/4 tệp, 54/54 xanh**. Số ca tăng 53 → 54 so với C.10 vì có thêm ca BUG-R2-205. Ca SEC "SEC FB-R2-SEC-BE-73 (ARC 16.22) …" (`guest-document-profiles.test.ts:424`) chạy đủ 3 bước tái hiện, 422 `REQUIRED` và CHECK BE-78 (a).
  - `pg_constraint`: `guest_id_doc_last4_consent_check` có và `convalidated = true` (BE-78 (a)).
  - `scripts/sec-be73-check.sql` chạy được trên DB mới, chỉ in số đếm.
- **Kết luận:** FB-R2-SEC-BE-73 **Verified trên commit đã gộp** (`50db5cd`); BE-78 (a) giữ Verified. Chữ ký S4-11/S4-32 của SEC (C.10) đứng trên commit này. Phần K6 của SEC xong.

### C.15 QC K1 – kiểm BE-65 (SEC, 19/10): **Verified**; BE-38 điểm 2 đóng

- **Mã kiểm:** cây làm việc ngày 19/10 = HEAD `50db5cd` + phần BE-C chưa commit (`s4-be-c.md` mục 21.1–21.2, `responses/s4-BE-C.md`). Cây có cả thay đổi chưa commit của vai khác. Khi BE-C commit, SEC chạy lại 2 tệp test dưới đây trên commit chấm lại.
- **Đọc mã:**
  - (a) `setRetentionAnchorForRef` chỉ theo **một** bản ghi (`bound_ref_type` + `bound_ref_id`), không theo mục đích (giữ ARC FB-S3-31 (2)), chỉ đụng tệp chưa xóa;
    - phiếu sửa `complete`/`cancel` → mốc = giờ đóng cho mọi ảnh của phiếu; `reopen` → NULL. Chạy trong giao dịch đang giữ khóa phiếu, sau vòng `bindTo` ảnh sửa xong, nên ảnh gắn lúc đóng cũng có mốc;
    - kiểm phòng → mốc = `performedAt`. Giá trị này đã bị chặn bởi `performedAtInRange`, nên không lùi hay đẩy mốc tùy ý được.
  - (b1) `penalty_evidence` tải lên khi đơn `checked_out`/`cancelled`/`no_show` → mốc = giờ tải lên (giữ lâu hơn, không ngắn hơn). Trạng thái đơn đọc qua `ownership()`, chính lần đọc kiểm quyền sẵn có.
    - `onReservationVoided` đặt mốc cho bằng chứng tải lên **trước** khi hủy/no-show, và đặt **trước** `if (!reg) return`, nên đơn không có `registration` vẫn có mốc. Hàm "chỉ tăng" (`retention_anchor_at < $4`): no-show được khôi phục rồi trả phòng sẽ có mốc muộn hơn.
    - Không sửa `folio/**`, `payments/**`, checkout tiền. ORC cũng đã kiểm.
  - (b2) J16 đếm ảnh đã gắn mà quá `attachment_ops_retention_months` vẫn không có mốc, và **không xóa** (đúng: phiếu đang mở hoặc lượt ở dài có thể còn hợp lệ). Ghi một dòng `retention_run` `policy_key = 'anchor_missing'`, chỉ có số đếm, không id hay dữ liệu cá nhân. Bảng không có CHECK `policy_key`, nên không có rủi ro J16 lỗi.
  - (b3) migration 0078:
    - chỉ sửa dòng `retention_anchor_at IS NULL AND purged_at IS NULL`, chạy lại không đổi;
    - mốc = `done_at` / `updated_at` (phiếu hủy) / `inspected_at` / `actual_checkout_at` · `cancelled_at` · `no_show_marked_at`, thiếu thì `uploaded_at`;
    - tắt rồi bật lại RLS + FORCE cho đủ 4 bảng trong cùng giao dịch migrator. Ca (6b) chứng minh nếu không tắt thì bù 0 dòng.
- **Chạy test** (container Postgres 17 tạm của SEC, DB mới `ottimo_test_k1`, migrate đủ tới 0078):
  - `sec-be65-retention` **9/9** + `registration-party-removal` **18/18** = **27/27 xanh**. Ca 1 chính là ca P1 của SEC: phiếu `done`, J16 trước hạn còn, sau hạn → `purged_at`, DEK hủy, GET 404;
  - hồi quy gần: `files-attachments`, `housekeeping-s4`, `housekeeping-s4-arc`, `registration-flow`, `registration-open-cap`, `guest-document-profiles` + 2 tệp trên → **8/8 tệp, 98/98 xanh**. BE-C báo toàn bộ vitest api 2971 đạt / 0 hỏng.
- **Quyết định SEC về hai điểm còn lại:**
  1. **`anchor_missing` chỉ ghi `retention_run` – CHẤP NHẬN cho R2.**
     - R2 chưa có dữ liệu thật; đường còn lọt rất hẹp (điểm 2 dưới đây, và đơn không có `registration` lúc trả phòng);
     - số đếm vẫn ghi lại được, và lưới an toàn không xóa nhầm;
     - đổi hợp đồng "Cần chú ý" (danh sách `check` đóng trong OpenAPI 0.3.7) giữa lúc sửa sau cổng QC là rủi ro hơn lợi.
     - **Điều kiện:** trước dữ liệu thật phải có **một** trong hai: mục "Cần chú ý" `attachment_retention_anchor_missing` cho OWN/MGR, **hoặc** cảnh báo OPS từ `retention_run` khi `anchor_missing` > 0 (người nhận OWN). Theo dõi bằng FB-R2-SEC-BE-84.
  2. **Ảnh tải lên đúng lúc giao dịch trả phòng chưa commit – CHẤP NHẬN là rủi ro còn lại Low.**
     - Upload đọc trạng thái `in_house` theo READ COMMITTED, còn `onCheckedOut` chỉ đặt mốc cho dòng đã commit, nên ảnh lọt cửa sổ vài mili giây giữa hai giao dịch có mốc NULL.
     - Không mất kiểm soát: (b2) đếm được và không có gì bị lộ, chỉ là giữ lâu hơn.
     - Cách sửa gọn cho R3 (cùng thẻ BE-84): `upload` khóa dòng `reservation` (`FOR SHARE`) khi đọc trạng thái, để xếp hàng với khóa của trả phòng, kèm test song song. Hoặc dựa vào cảnh báo ở điểm 1.
- **Kết luận:** FB-R2-SEC-BE-65 **Verified** (cây làm việc). FB-R2-SEC-BE-38 điểm 2 **đóng** (`s3-SEC.md`). SEC-G3 nay **8/8 Verified**: G2.2 gỡ phần SEC, chỉ còn chờ chạy lại trên commit chấm lại (K3).

### FB-R2-SEC-BE-84
- Mức độ: Minor (rủi ro Low) | Người sửa: ARC + BE-C + UXD + FE-A (mục "Cần chú ý"), hoặc OPS (cảnh báo); BE-C (khóa đọc trạng thái)
- Vị trí: `files/public/attachment.service.ts` `upload` (đọc `ownership().status`) và `purgeDue` (`anchorMissing`); `registration/internal/retention.service.ts` (`retention_run` `anchor_missing`)
- Vấn đề:
  - ảnh đã gắn mà không có mốc hạn lưu chỉ được **đếm** vào `retention_run`, không ai được báo;
  - `penalty_evidence` tải lên trong cửa sổ trước khi giao dịch trả phòng commit vẫn có mốc NULL (C.15 điểm 2).
- Vì sao quan trọng: ảnh không mốc bị giữ vô thời hạn (SEC I5, NĐ 13). Khi có dữ liệu thật thì phải có người được báo để xử lý.
- Đề xuất sửa:
  - (a) mục "Cần chú ý" `attachment_retention_anchor_missing` cho OWN/MGR (ARC thêm giá trị vào danh sách `check`, UXD viết câu), **hoặc** cảnh báo OPS từ `retention_run`;
  - (b) `upload` đọc trạng thái đơn với `FOR SHARE`, có test song song với trả phòng.
- Hạn: R3 Sprint 1. (a) bắt buộc **trước dữ liệu thật**.
- Trạng thái: Open

## D. Điểm làm tốt (nên giữ)
1. PWA offline chép từng trường theo danh sách cho phép, có test dump IndexedDB thật; service worker không cache API; đăng xuất xóa sạch; `guard.test` chặn gọi endpoint C3.
2. SSE có mức sàn theo loại sự kiện, hub đóng an toàn, payload chỉ id; phiên và vai kiểm lại theo heartbeat.
3. Khóa giấy tờ v1 nhiều lớp (HKDF riêng mục đích, CHECK định dạng, CHECK đồng ý ở DB, không bao giờ ra API/audit). Yêu cầu khách có DTO tối giản, Luhn trước luật chữ số, hiển thị văn bản thuần.

## E. QC K11 – đánh giá lại G2.5 khi repo đã công khai (SEC, 19/10/2026)

- **Bối cảnh.** INV quyết công khai repo ở ESC-025 (19/10). Repo công khai là `anhvh93-tech/ottimo-hotel-app-public`, HEAD `50db5cd`, 137 commit, lịch sử đã làm sạch. Repo riêng tư cũ đã lưu trữ (`archived: true`, `private`).
- **Cách làm.** SEC **chỉ đọc** cài đặt GitHub qua `gh api`, không đổi gì. Các cài đặt nên đổi nằm ở E.6 để ORC/OPS làm và INV duyệt.

### E.1 Tài liệu review công khai mô tả cách lách của Major còn mở

Cả `rounds/` công khai, nên mọi thẻ SEC/QA kèm bước tái hiện đều đọc được. Nhóm có "công thức lách" và còn mở ở HEAD:

| Thẻ | Cách lách mô tả công khai | Ai làm được | Đánh giá |
|---|---|---|---|
| FB-R2-SEC-BE-83 | MGR chia nhỏ xóa nợ dưới giá 1 đêm để khỏi chờ OWN | Chỉ tài khoản **MGR** | Rủi ro gian lận nội bộ. Người cần biết nhất (quản lý của khách sạn) nay đọc được cách làm |
| FB-R2-SEC-BE-79 | Sửa giấy tờ từ người A sang B, khóa giấy tờ và last4 ở lại hồ sơ A | FD+ | Gán sai dữ liệu trong phạm vi đã có quyền xem. Không ra ngoài |
| FB-R2-SEC-BE-65, 74, 75 | Ảnh, tên, liên hệ không bao giờ bị xóa (thiếu mốc hạn lưu) | Không ai "khai thác" được | Lỗi tuân thủ hạn lưu, không phải đường tấn công |
| BUG-R2-208/209/210 | Lệch chu kỳ nợ, thiếu nhật ký nợ | Thao tác bình thường của FD/MGR | Sai số liệu, không có lợi cho người ngoài |
| Thẻ [CHẶN] landing/Zalo/booking | Điều kiện trước khi **bật** tính năng | – | Tính năng chưa bật, không có bề mặt |

Đánh giá:

- **Người ngoài:** mọi cách lách ở trên đều cần tài khoản nhân viên đã đăng nhập (FD/MGR). R2 chưa có staging chạy (E.2), chưa có dữ liệu thật. Công khai **không** tạo đường tấn công mới cho người ngoài, chỉ bỏ lớp "che giấu", mà dự án vốn không dựa vào lớp này (threat model giả định kẻ tấn công biết mã nguồn).
- **Người trong:** cái thay đổi thật là BE-83. Trước khi công khai, chỉ đội biết cách chia nhỏ. Nay một quản lý khách sạn đọc được. Tác hại có giới hạn: mỗi lần đều có audit, báo cáo FOC tách mã `debt_write_off`, và tổng xóa không vượt trần công nợ. Mức vẫn là **Major / rủi ro Medium**, không lên High.
- **Rủi ro trước dữ liệu thật:** nếu tới ngày nhập dữ liệu thật mà còn Major có công thức lách công khai, rủi ro nội bộ của BE-83 tăng vì ai cũng biết cách làm. Vì vậy SEC **siết hạn**:
  - BE-83, BE-79 phải **Verified trước dữ liệu thật**, không dời qua mốc đó. Hạn này đã có, nay thành điều kiện cứng của cổng dữ liệu thật (cùng ESC-001);
  - BE-65, BE-74, BE-75 giữ hạn cũ: trước dữ liệu thật.
- **Nên làm (quy tắc mới cho đội, SEC tự quyết trong quyền):**
  - (a) Từ nay, phát hiện **Critical/High**, hoặc Major mở có công thức khai thác được **từ bên ngoài**, không ghi bước tái hiện chi tiết vào repo công khai trước khi Verified. Bản chi tiết đi kênh riêng: GitHub Security Advisory nháp (private vulnerability reporting đang bật) hoặc repo riêng tư cũ. Repo công khai chỉ ghi một dòng tóm tắt + mã thẻ.
  - (b) Major chỉ khai thác được bởi người trong (như BE-83) vẫn ghi công khai như hiện nay, để review chéo và QC kiểm được. Bù lại phải sửa trước dữ liệu thật.
  - (c) Không xóa hay viết lại lịch sử vì các thẻ hiện có: không có thẻ nào thuộc nhóm (a).

### E.2 `environment: staging` + `STAGING_SSH_KEY`

Đọc ngày 19/10:

| Mục | Kết quả |
|---|---|
| `GET …/environments` | `total_count: 0`: chưa có environment nào |
| Secret của Actions, Dependabot | 0 / 0. **Không có** `STAGING_SSH_KEY`, `STAGING_SSH_KNOWN_HOSTS` |
| Biến của repo | 0. `PUBLISH_IMAGES`, `STAGING_DEPLOY`, `STAGING_SSH_HOST` chưa đặt |
| Job `deploy-staging` (`ci.yml`) | `if: push` + `refs/heads/main` + `vars.PUBLISH_IMAGES == 'true'` + `vars.STAGING_DEPLOY == 'true'`, `environment: staging`. Khóa SSH trên VPS chỉ chạy forced command `deploy-from-ci.sh` |

- **Kết luận:** hôm nay **không có gì để lộ**. Không khóa, không host, job deploy tắt.
- **Rủi ro tiềm ẩn (Medium nếu bật sai thứ tự):** khi workflow có `environment: staging` chạy lần đầu, GitHub **tự tạo** environment đó mà **không có bảo vệ**. Nếu OPS đặt `STAGING_SSH_KEY` làm **secret cấp repo** thay vì secret của environment, mọi workflow chạy trên nhánh của repo đều đọc được khóa (PR từ fork thì không).
- **Điều kiện SEC trước khi bật deploy:** tạo environment `staging` có bảo vệ **trước** khi đặt khóa (E.6 mục 1).

### E.3 PR từ fork / Dependabot có lấy được secret không

- `ci.yml` chỉ dùng `pull_request`. **Không** có `pull_request_target`, `workflow_run` hay `issue_comment`.
  - PR từ fork chạy với `GITHUB_TOKEN` chỉ đọc và **không có secret** (mặc định GitHub).
  - PR của Dependabot chỉ nhận secret Dependabot. Hiện có 0 secret.
- `permissions: contents: read` ở đầu workflow. Chỉ `publish-images` có `packages: write`, và job này chỉ chạy khi push vào `main`.
- Cài đặt repo:
  - `default_workflow_permissions: read`;
  - `can_approve_pull_request_reviews: false`;
  - PR từ fork của **mọi** người ngoài phải chờ duyệt mới chạy (`approval_policy: all_external_contributors`).
- `actions/checkout` dùng `persist-credentials: false`; action ghim theo SHA.
- Cache (`actions/cache`, pnpm): GitHub tách phạm vi cache của PR, PR không ghi được vào cache của `main`.
- **Kết luận: Đạt.** PR từ fork hoặc Dependabot không lấy được secret. Hiện cũng không có secret nào để lấy.
- Ghi chú:
  - Các PR Dependabot #1–#6 đang **đỏ**. Đây là chuyện của OPS (cập nhật phụ thuộc), không phải lỗ hổng.
  - `allowed_actions: all`, `sha_pinning_required: false`. Đội đã ghim SHA tay, nhưng nên bật bắt buộc (E.6 mục 4).

### E.4 Ba cảnh báo Dependabot mức trung bình (`dependabot/alerts?state=open`)

| # | Gói | Đường vào | Lỗ hổng | Có chạm tới không | Mức SEC |
|---|---|---|---|---|---|
| 1 | `esbuild` 0.18.20 (vá ở 0.25.0) | Chỉ dev: `drizzle-kit` → `@esbuild-kit/core-utils` (`pnpm why`). Dependabot ghi "runtime" vì đọc lockfile | GHSA-67mh-4wv8-2f99: dev server của esbuild cho trang web bất kỳ đọc phản hồi | **Không.** Không chạy `esbuild --serve`. drizzle-kit chỉ dùng loader. Không vào image | Low |
| 2 | `react-router` 6.30.6 (vá ở 7.18.0, nhánh 6 không có bản vá) | `admin-web` → `react-router-dom` (guest-web không dùng) | GHSA-337j-9hxr-rhxg: `deserializeErrors()` khi hydrate SSR | **Không.** admin-web là SPA, không SSR, không `createStaticHandler`/dữ liệu hydrate | Low |
| 3 | `react-router` 6.30.6 | như trên | GHSA-wrjc-x8rr-h8h6: chuyển hướng ra ngoài bằng `\` trong `<Link>`/`useNavigate` khi đường dẫn do kẻ tấn công đưa vào | **Hầu như không.** Chỗ duy nhất điều hướng tới đường dẫn "từ ngoài" là `useAfterLoginPath` (`LoginPage.tsx:21-35`). `from` lấy từ `location.state` (do `routes.tsx:77` đặt bằng `location.pathname`, link ngoài không đặt được) và phải `startsWith` một đường của `NAV` | Low |

- **Kết luận:** cả 3 là **Low** theo thang dự án. Không cái nào thành High. `pnpm audit --audit-level=high` của CI vẫn đúng.
- **Việc cần làm (backlog R3, không chặn):**
  - nâng `react-router-dom` lên 7.18+ (bản lớn: ARC/FE-A lên kế hoạch). Thêm test cho `useAfterLoginPath` với `from` chứa `\`, `//`, `%5C`;
  - `esbuild`: nâng `drizzle-kit` khi có bản bỏ `@esbuild-kit`, hoặc đóng cảnh báo với lý do "vulnerable code not used", ghi ngày xem lại.

### E.5 Lịch sử ngoài mẫu gitleaks

- **SEC rà lại độc lập** (bổ sung lần rà của ORC ngày 19/10). Phạm vi là mọi dòng **thêm vào** trong 137 commit của `origin/main` công khai (≈ 915 nghìn dòng). Các mẫu gitleaks không bắt:
  - **Email:** chỉ có địa chỉ mẫu (`name@`, `ten@`, `someone@`, `nguyen.van.a@` gmail; `example`, `vidu`) và một danh sách mật khẩu phổ biến. Không có email cá nhân của INV hay đội. Commit dùng email `noreply` của GitHub.
  - **SĐT Việt Nam:**
    - số dạng mẫu (`0901234567`, `0912345678`…);
    - hotline/Zalo của OTTIMO. Đây là số liên hệ kinh doanh công khai (landing, brochure), **không** phải dữ liệu cá nhân.
  - **Số giấy tờ:** chỉ số mẫu. Một số CCCD đúng định dạng (`079188…`) là của fixture "Trần Thị Thử" (tên giả, giá trị toàn số 0 ở giữa) và đã bị xóa ở commit sau.
  - **Mã cửa:** chỉ có chuỗi mẫu `Mã cửa 482913` trong test luật B-15 (ví dụ bị chặn). Không thấy mã cửa, mật khẩu wifi, mã két hay mã camera thật. SEC **không biết** mã cửa thật nên không đối chiếu được giá trị: ORC đã rà câu mã cửa thật ở bước làm sạch.
  - **IP:** chỉ IP mẫu (`203.0.113.x`, `1.2.3.4`) và chuỗi trong danh sách mật khẩu. Không có IP hay host của VPS staging (`STAGING_SSH_HOST` chỉ là tên biến).
  - **Khóa riêng (`BEGIN … PRIVATE KEY`), link Google Drive/Docs:** 0.
- **GitHub:** secret scanning và push protection **đang bật**, 0 cảnh báo.
- **Giới hạn:**
  - quét bằng mẫu, không đọc từng tệp nhị phân (ảnh, PDF trong `00-brief/context/`);
  - ref `refs/pull/*` của Dependabot nằm trên cùng lịch sử sạch.
- **Việc còn lại cho ORC:** xác nhận tệp nhị phân trong lịch sử công khai không có ảnh giấy tờ, ảnh phòng có khách hay ảnh màn hình khóa cửa. Theo mô tả ESC-025, tệp gốc riêng tư đã bỏ.
- **Kết luận:** không thấy dữ liệu cá nhân hay thông tin an ninh vật lý thật ngoài mẫu gitleaks.

### E.6 Đề xuất cài đặt GitHub cho ORC/OPS (SEC không tự đổi)

| # | Cài đặt | Vì sao | Khi nào |
|---|---|---|---|
| 1 | Tạo environment `staging`: **Required reviewers** = INV (hoặc OPS + INV); **Deployment branches** = chỉ `main`; bật "Prevent self-review" nếu có từ 2 người duyệt. Đặt `STAGING_SSH_KEY`, `STAGING_SSH_KNOWN_HOSTS` là **secret của environment**, không phải secret của repo | E.2 | **Trước** khi đặt khóa hay bật `STAGING_DEPLOY` (điều kiện SEC) |
| 2 | Sau lần `publish-images` đầu tiên: kiểm gói GHCR `ottimo-api` / `ottimo-web` là **private**. Riêng `-test` (có endpoint test) không được public | Image của repo công khai có thể thừa hưởng chế độ hiển thị | Lần publish đầu |
| 3 | Branch protection `main`: hiện chỉ cấm force-push/xóa, đòi 1 review nhưng **không áp cho admin** (`enforce_admins: false`), không có required status checks. Đề xuất: required status checks = các job CI chính + `secrets-scan`. Admin bypass giữ được cho 1 người, nhưng chỉ sau khi CI xanh | Repo công khai: một push sai đi thẳng vào lịch sử công khai, không gỡ được | Trước R3 |
| 4 | Actions: bật `sha_pinning_required`. `allowed_actions` = "selected" (GitHub, `pnpm/action-setup`) | Khóa lại điều đội đang làm tay | Khi tiện |
| 5 | Bật **Dependabot security updates** (đang tắt). Giữ secret scanning + push protection; bật thêm `secret_scanning_non_provider_patterns` | Cảnh báo có PR vá tự động; bắt chuỗi bí mật dạng chung | Khi tiện |
| 6 | Không thêm workflow dùng `pull_request_target`/`workflow_run` có checkout mã PR. Mọi workflow mới đi qua SEC review | Giữ kết luận E.3 | Thường trực |
| 7 | Quy tắc E.1 (a): chi tiết Critical/High hoặc lỗ hổng khai thác từ ngoài chưa vá → GitHub Security Advisory nháp, không ghi vào `rounds/` công khai | E.1 | Từ nay |

### E.7 Kết luận K11 – G2.5

- **Vẫn 0 Critical / 0 High Open.** Công khai repo không nâng mức thẻ nào:
  - không có bí mật hay dữ liệu thật trong lịch sử;
  - không có secret trên GitHub;
  - không có đường lấy secret từ PR;
  - 3 cảnh báo Dependabot là Low theo cách dùng thực tế;
  - các cách lách công khai đều cần tài khoản nhân viên.
- **Thay đổi duy nhất là hạn:** BE-83 và BE-79 thành điều kiện cứng **trước dữ liệu thật**. Hai đề xuất cài đặt là điều kiện SEC trước khi bật deploy staging: E.6 mục 1 trước khi đặt khóa, E.6 mục 2 ở lần publish đầu.
- **Không tạo ESC mới.** Quy tắc E.1 (a) và mức rủi ro thuộc quyền SEC. Các cài đặt E.6 là việc của OPS/ORC. Nếu INV muốn đổi lại chế độ công khai trước ngày dữ liệu thật, đó là quyết định mới của INV, không phải yêu cầu của SEC.

## F. QC C11 – điều kiện SEC cho BUG-R2-208 (N-7 theo số) ở R3 (SEC, 20/10/2026)

- **Nguồn:**
  - `qc/s4-qc-gate.md` mục 10.5 C11 (c);
  - backlog R3-Q19 (dẫn tới mục này), R3-Q20 (209), R3-Q21 (210);
  - ARC 16.31.1;
  - DOM BR-525 khối lần 8 (208);
  - quyết định N-7 của SEC (FB-R2-SEC-BE-81, C.12–C.13).
- **Vì sao SEC giữ cổng:** 208 nới N-7. Hiện tại, chu kỳ nợ còn mở thì A32 giảm bị chặn hẳn. Sau 208, A32 được giảm khi phần giảm ≤ còn phải thu − `openDebtVnd`. N-7 được đặt ra để chặn một đường tha nợ không qua OWN: A32 tăng dòng rồi giảm, hoặc MGR void phần đã thành nợ. Nới sai thì đường này mở lại.

Điều kiện, **tất cả bắt buộc** trước khi gộp 208:

1. **Thứ tự cài:** 207 → 210 → 208.
   - 208 chỉ cài khi 207 đã gộp và 210 đã Verified, tức `openDebtVnd` đúng cả trên dữ liệu ghi trước migration 0076;
   - lý do: 208 lấy `openDebtVnd` làm trần. Nếu số này thấp hơn thực tế (lỗi 210), phần giảm được phép sẽ lớn hơn phần thật sự chưa thành nợ, nghĩa là void được cả phần nợ.
2. **SEC review trước khi gộp:**
   - PR 208 phải có SEC review riêng, ghi trong `reviews/` của R3, trên commit sẽ gộp;
   - không gộp dựa trên review của cây làm việc;
   - 208 nằm trong lượt kiểm tiền riêng R3 Sprint 1 (R3-Q19…Q24, Q29, Q30).
3. **Test bắt buộc trong PR**, chạy trên DB thật như test N-7 hiện có:
   - (a) **"A32 tăng lặp rồi giảm vẫn 409":** folio `settled` có công nợ đang mở > 0. Lặp tăng một dòng N lần (mỗi lần công nợ tăng theo), rồi giảm dần từng lần hoặc một lần lớn. Mọi lần giảm làm còn phải thu − phần giảm < `openDebtVnd` → **409**. `openDebtVnd` sau chuỗi thao tác không bao giờ thấp hơn trước chuỗi, trừ khi có thu tiền hoặc xóa nợ đã duyệt;
   - (b) **ranh giới:** giảm đúng bằng còn phải thu − `openDebtVnd` → được; thêm 1 đồng → 409;
   - (c) **song song:** hai A32 giảm cùng lúc trên một folio, mỗi cái hợp lệ riêng nhưng cộng lại vượt → đúng một cái 409. Đọc số dưới khóa folio, cùng thứ tự khóa ARC 16.19;
   - (d) cổng `openDebt` trả `null` khi `openDebtVnd` = 0 không làm mất kiểm tra ở các đường khác (xóa nợ, J15);
   - (e) đưa các ca (a)–(c) vào fuzz công nợ R3-Q30, giữ bất biến BR-525 (ii).
4. **Không mở đường MGR void phần nợ không qua OWN:**
   - phần đã thành công nợ chỉ giảm được qua `debt_write_off` (hạn mức BR-433, chờ OWN khi vượt; gồm cả cách tính theo tổng khi sửa FB-R2-SEC-BE-83 / R3-Q22) hoặc qua thu tiền;
   - A32 giảm, void, đảo dòng, đổi giá hay chuyển dòng sang folio khác đều không được làm `openDebtVnd` giảm;
   - SEC review rà **mọi** đường ghi `folio_line` trên folio `settled` trong cửa sổ, không chỉ A32;
   - mỗi lần giảm được phép ghi audit có vai, số giảm và `openDebtVnd` trước/sau.
5. **Hợp đồng `Folio.totals.openDebtVnd`** (Desk) chỉ hiển thị cho FD+, như các số tiền khác của folio. Không thêm vai được đọc.

- **Nếu thiếu điều kiện nào:** SEC không ký 208, và giữ hành vi N-7 hiện tại (chặn theo chu kỳ). Hành vi này an toàn về kiểm soát, chỉ bất tiện (ngõ cụt sửa khoản ghi nhầm, cần OWN xử lý).
- Trạng thái: **Điều kiện đã ghi**, chờ PR 208 ở R3 Sprint 1.

### E.8 Bổ sung 21/10 – quyết định SEC về R5-01 (`outputs/OPS/staging-readiness.md` mục 3): log Actions công khai của `deploy-staging`

- **SEC đồng ý** đề xuất của OPS: forced command `deploy-from-ci.sh` chỉ trả về **một dòng tóm tắt**. Toàn bộ output `deploy.sh` ghi trên VPS.
- **Hạn:** **trước lần deploy staging đầu tiên từ CI**, tức trước khi bật `STAGING_DEPLOY=true`. Không đợi tới production. Lý do:
  - log Actions của repo công khai ai cũng đọc và tải được trong suốt thời gian lưu;
  - một khi đã lộ thì chỉ xóa run mới gỡ được;
  - lỗi khởi động hay lỗi SQL ở staging có thể in cấu hình, tên bảng, đường dẫn nội bộ. Dữ liệu giả không làm giảm lượng thông tin hạ tầng bị lộ.
- Deploy tay qua SSH của OPS (`deploy.sh sha-…`) **không** bị ảnh hưởng: output đầy đủ vẫn hiện trên máy OPS.

**Yêu cầu cho bản sửa (OPS; SEC review cùng PR):**
1. `deploy-from-ci.sh`:
   - chạy `deploy.sh` với stdout/stderr ghi vào tệp log trên VPS, chủ `ottimo`, quyền 0600, xoay vòng như `deploy-history.log`;
   - trả về đúng một dòng `deploy <tag>: ok` hoặc `deploy <tag>: failed (step=<tên bước>, ref=<mã lượt>)`, giữ mã thoát khác 0 khi lỗi;
   - `ref` là mã ngẫu nhiên hoặc thời điểm, để OPS tìm trong log VPS. Không chứa IP, đường dẫn hay nội dung lỗi.
2. **Giữ regex hiện tại:** chỉ `deploy sha-<hex>`, CI không chọn được tag `-test`. Đúng như R5-04: chuyển sang `-test` chỉ làm bằng tay. Sửa lại chú thích đầu tệp, đang ghi `[-test]` lệch với regex.
3. **Chuyển `STAGING_SSH_HOST` từ biến (vars) sang secret của environment `staging`.** Biến không bị che trong log, secret được che. Chuyện IP đã lộ qua DNS không phải lý do để in nó cùng tên user `ottimo@` và cổng SSH.
4. **Bước SSH trong `ci.yml`:**
   - thêm `-o LogLevel=ERROR` để không in cảnh báo host kèm IP;
   - không `set -x`, không `echo` biến môi trường;
   - thông báo lỗi chỉ nêu tên biến thiếu (như hiện nay).
5. **Test:**
   - (a) deploy cố ý lỗi (tag không có trên GHCR) → log Actions chỉ có một dòng `failed`, log VPS có chi tiết;
   - (b) lệnh lạ → `refused`, mã 2.
   - OPS ghi kết quả vào `staging-readiness.md`.

**Điều kiện SEC cho lần deploy staging đầu tiên từ CI** (gộp với E.6). Đủ cả 6 mới bật `STAGING_DEPLOY`:

| # | Điều kiện | Nguồn |
|---|---|---|
| D1 | Environment `staging` có người duyệt bắt buộc (INV) và chỉ nhánh `main`. `STAGING_SSH_KEY`, `STAGING_SSH_KNOWN_HOSTS`, `STAGING_SSH_HOST` là **secret của environment**, tạo **sau** khi đã có bảo vệ | E.6 (1), mục 3 trên |
| D2 | Bản sửa R5-01 (mục 1–5 trên) đã gộp và có kết quả test (a)(b) | E.8 |
| D3 | Gói GHCR `ottimo-api` (gồm `-test`) và `ottimo-web` là **Private**. INV kiểm ngay sau lượt publish đầu, trước khi kéo image | E.6 (2), R5-02 |
| D4 | Khóa CI trên VPS chỉ dùng được với `command="…deploy-from-ci.sh",restrict`. Khóa CI khác khóa của OPS/INV, chỉ dùng cho CI | `deploy-from-ci.sh` |
| D5 | Staging chỉ có dữ liệu giả: không nạp dump, không nâng tại chỗ dữ liệu thật (điều kiện C2 cổng S4) | C2 |
| D6 | Sau lượt đầu, SEC đọc log Actions của lượt đó (trường hợp xanh, và một lượt lỗi cố ý nếu có): không có IP, đường dẫn, biến môi trường hay output compose | E.8 |

- **Khuyến nghị (không chặn):** giảm thời gian lưu log/artifact Actions của repo xuống 30 ngày (mặc định 90) để giới hạn thời gian lộ nếu sau này có sót.
- **Kết luận:** R5-01 là rủi ro Medium (phần b), không phải Critical/High. **G2.5 không đổi.** Không tạo ESC mới: đây là cấu hình kỹ thuật thuộc quyền SEC/OPS. INV chỉ thực hiện D1, D3 theo checklist của OPS.

#### E.8.1 Kiểm bản sửa R5-01 của OPS (SEC, 21/10) – **Verified** (cây làm việc, chờ ORC commit)

- **Nguồn:** `outputs/OPS/staging-readiness.md` mục 7. Các tệp: `deploy-from-ci.sh`, `deploy.sh`, `bootstrap-vps.sh`, `ci.yml` (job `deploy-staging` và `infra-scripts`), `product/infra/ci/test-deploy-from-ci.sh` (mới), `inv-staging-checklist.md`.
- **Đọc mã, đối chiếu từng yêu cầu E.8:**
  1. Forced command:
     - regex vẫn chỉ nhận `deploy sha-<hex 7–40>`; chú thích đã sửa khớp regex (bỏ `[-test]`);
     - output của `deploy.sh` ghi vào `state/deploy-logs/ci-<ref>.log` (umask 077, 0600, giữ 30 tệp), stdin là `/dev/null`;
     - CI chỉ nhận một dòng `ok` hoặc `failed (step, ref)`, mã thoát 1 khi lỗi;
     - `step` đọc tối đa 32 byte, lọc còn `a-z-`; `ref` = thời điểm UTC + 3 byte ngẫu nhiên; lệnh bị từ chối trả mã 2 và chỉ ghi `logger` (không lộ nội dung).

     **Đạt.**
  2. `deploy.sh`: hàm `step` chỉ ghi tên bước cố định, và chỉ khi có `OTTIMO_STEP_FILE`. Deploy tay không đổi hành vi. **Đạt.**
  3. `HOST` đọc từ `secrets.STAGING_SSH_HOST`; `trap` xóa cả `deploy_key` và `known_hosts`. **Đạt.**
  4. `ssh -o LogLevel=ERROR`, không `set -x`, thông báo lỗi chỉ nêu tên biến, điều kiện `if:` của job không đổi (vẫn tắt). **Đạt.**
  5. Test. SEC tự chạy lại `test-deploy-from-ci.sh` trong container `ubuntu:24.04`, mount `product/` chỉ đọc. Kết quả: dòng cuối `OK: …`; đạt cả (a) lỗi có dấu IP/đường dẫn giả, (b) 14 lệnh lạ, (c) thành công và giữ 30 log. Test đã nối vào job `infra-scripts`. **Đạt.**
- **D4 (`bootstrap-vps.sh`):** so phần base64 của khóa, nên khóa CI không thể đồng thời là khóa người (mất `restrict`), và ngược lại; chạy lại không thêm dòng trùng. Đọc mã đạt. Bản chạy trọn với root để tới khi có VPS. OPS ghi kết quả vào `staging-readiness.md` lúc bootstrap.
- **Checklist INV:** đã có D1–D6, `STAGING_SSH_HOST` thành secret của environment, tạo secret sau khi có người duyệt, khóa CI riêng, kiểm GHCR ngay sau lần publish đầu, gợi ý lưu log 30 ngày. **Đạt.**
- **Ghi chú, không chặn:**
  - (i) Nếu chính `deploy-from-ci.sh` lỗi trước khi mở được log (ví dụ `mkdir` lỗi quyền), bash in một dòng lỗi có đường dẫn `/opt/ottimo/state/…`. Đường dẫn này vốn đã công khai trong repo, chấp nhận.
  - (ii) `deploy-history.log` chưa xoay vòng (mỗi lượt một dòng, không có dữ liệu nhạy cảm). Để R3.
- **Kết luận:** R5-01 **Verified** trên cây làm việc. **SEC đồng ý để ORC commit.** Sau commit, job `infra-scripts` trên CI phải xanh, có step `deploy-from-ci.sh`. Đây là điều kiện D2.

#### E.8.2 Cách hiểu D6 – **SEC xác nhận**

Hiểu của OPS/ORC đúng: **bật `STAGING_DEPLOY` khi đủ D1–D5**. D6 là kiểm **ngay sau lượt deploy CI đầu tiên**. Không đạt thì **tắt lại** `STAGING_DEPLOY`. Thêm 3 điểm:
- ORC báo SEC **trước** khi INV bấm duyệt lượt đầu, để SEC đọc log ngay khi lượt chạy xong. Lượt sau chỉ được duyệt khi SEC đã ghi kết quả D6 vào mục này.
- Nếu log lượt đầu có IP, đường dẫn, biến môi trường hay output compose, thì INV (hoặc ORC qua `gh run delete`) **xóa run đó**, tắt `STAGING_DEPLOY`, và OPS sửa trước lượt sau. Nếu lộ IP thì thêm bước: đổi khóa CI nếu có nghi ngờ khóa liên quan. Riêng IP thì không cần đổi, vì IP vốn có trong DNS.
- Nếu lượt đầu xanh mà chưa thấy được nhánh lỗi, SEC chấp nhận vì test (a) trên CI đã phủ nhánh lỗi. Không cần cố ý làm hỏng một lượt trên staging thật.

### E.9 Nền VPS staging – review diff `bootstrap-vps.sh` (R5-09…R5-11) và quyết định R5-12…R5-14 (SEC, 22/10)

- **Nguồn:** `outputs/OPS/staging-readiness.md` mục 8 (lượt 3); diff `product/infra/server/bootstrap-vps.sh`, chưa commit.
- **Giới hạn:** SEC không SSH vào VPS. Kết quả trên máy lấy theo bảng 8.3 của OPS.

#### E.9.1 Diff – **Đạt, SEC đồng ý commit**

| Mã | Sửa | Đánh giá SEC |
|---|---|---|
| R5-09 | `60-ottimo.conf` → `00-ottimo.conf`, xóa tệp cũ; sau `sshd -t` kiểm thêm `sshd -T`: `passwordauthentication no` và `permitrootlogin` đúng, sai thì dừng **trước** reload | Đúng gốc lỗi: sshd lấy giá trị đọc đầu tiên. Kiểm bằng giá trị hiệu lực thay vì nội dung tệp nên bắt được mọi tệp khác ghi đè. Nếu `sshd -T` lỗi thì `eff` rỗng và script dừng: an toàn. **Đạt** |
| R5-10 | `ssh-keygen -A` | Tạo khóa host ed25519 còn thiếu, cần cho `STAGING_SSH_KNOWN_HOSTS`. **Đạt** |
| R5-11 | `systemctl enable --now ufw` + kiểm `is-enabled` | Lỗi nặng nhất trong 3: tường lửa mất sau mỗi lần reboot, kể cả lần tự vá 02:30. OPS đã kiểm lại sau reboot: `active`, `INPUT DROP`, từ ngoài chỉ vào được 22. **Đạt** |

Đề xuất nhỏ cho cùng PR, không chặn commit:
- (a) Kiểm `sshd -T` thêm `kbdinteractiveauthentication no` (cùng nhóm đăng nhập mật khẩu).
- (b) Thêm `sshd -T -C user=ottimo-admin,host=x,addr=203.0.113.1` để bắt cả khối `Match` của nhà cung cấp, nếu có.
- (c) Sau `ufw --force enable`, kiểm thêm `ufw status | grep -q '^Status: active'`.

Mục 8.1–8.3: OPS kiểm đăng nhập `ottimo-admin` + `sudo -n` **trước** khi tắt root và mật khẩu, có kiểm từ ngoài, reboot 2 lần. IP không ghi vào repo. Cách làm đúng.

#### E.9.2 Quyết định rủi ro

| Mã | Rủi ro | Mức | Quyết định SEC | Hạn |
|---|---|---|---|---|
| **R5-13** | Khóa `ottimo_ops` **không passphrase** mở được `ottimo-admin` có `sudo NOPASSWD`, tức root trên VPS. Ai lấy được tệp khóa trên máy INV là thành root | **Medium** | Staging sắp giữ bí mật thật của hệ thống: KEK dữ liệu (`init-secrets.sh`), token GHCR `read:packages`, khóa SSH cho CI. Lộ khóa thì mất cả các bí mật này, dù dữ liệu chỉ là dữ liệu giả. Việc sửa chỉ là một lệnh trên máy INV (`ssh-keygen -p -f ~/.ssh/ottimo_ops`), không đụng VPS | **Trước staging:** trước `init-secrets.sh` và `docker login` GHCR (mục 8.5). Sau đó dùng qua Keychain/ssh-agent (`ssh-add --apple-use-keychain`) |
| **R5-12** | `ottimo-admin` uid 1000 trùng uid người dùng trong container api; đọc được `seed` (dữ liệu giả) | Low | Chấp nhận cho staging. Người này có sudo nên không có thêm quyền thật. `secrets` 0710 root:ottimo không đi qua được bằng uid này | **Trước production:** người quản trị dùng uid ≠ 1000, và mọi thư mục của uid 1000 chỉ chứa thứ container cần. Script nên dừng khi `--admin-user` có uid 1000 ở `APP_ENV=production` |
| **R5-14** | `10-legacy-rsa.conf` của nhà cung cấp bật lại `ssh-rsa` (chữ ký SHA-1) | Low | Không mở thêm đường đăng nhập (vẫn phải có khóa đã cài). Tấn công SHA-1 thực tế không giả được chữ ký xác thực SSH. Chấp nhận cho staging | **Trước production.** Cách rẻ, làm luôn được: `00-ottimo.conf` đọc trước nên thắng. Thêm `PubkeyAcceptedAlgorithms -ssh-rsa`, `HostKeyAlgorithms -ssh-rsa`, `HostKey` chỉ ed25519 (+ rsa-sha2), kiểm bằng `sshd -T`, xóa khóa host DSA. Không cần xóa tệp của nhà cung cấp |
| (kèm) | Khóa `ottimo_ops` còn trong `/root/.ssh/authorized_keys`, đang vô hiệu vì `PermitRootLogin no` | Low | Chấp nhận cho staging, giữ để dự phòng như OPS nêu | **Trước production:** gỡ. Mở lại root chỉ qua console của nhà cung cấp |

**Điều kiện production rút ra (ghi vào `hosting-plan` / checklist production, OPS):**
- mỗi người quản trị một khóa riêng có passphrase;
- **không dùng lại** `ottimo_ops` của staging;
- khóa CI production khác khóa CI staging;
- `sudo` cho người quản trị: hoặc có mật khẩu, hoặc `NOPASSWD` chỉ khi khóa có passphrase. SEC chọn NOPASSWD + passphrase bắt buộc, để không phải lưu mật khẩu sudo ở đâu;
- R5-12, R5-14 và mục (kèm) trên.

#### E.9.3 Kết luận
- Diff `bootstrap-vps.sh` **Đạt**, ORC commit được. Đề xuất nhỏ (a)(b)(c) làm cùng lúc hoặc ở lượt sau.
- **Điều kiện mới trước staging:** R5-13 (passphrase cho `ottimo_ops` trước `init-secrets.sh` / GHCR login). Gộp vào D1–D5, gọi là **D0**: INV làm, một lệnh.
- R5-12, R5-14 và khóa ở `/root`: trước production.
- **G2.5 không đổi:** 0 Critical/High. Không tạo ESC mới.

### E.10 D3 trượt – gói GHCR công khai (SEC, 22/10)

- **Sự việc:** lượt publish đầu (run 39763920224, commit `4fd0651`) tạo `ghcr.io/anhvh93-tech/ottimo-api` (tag `sha-4fd0651b7be3` và `sha-4fd0651b7be3-test`) và `ottimo-web`. Hai gói thừa kế **Public** từ repo công khai. ORC đã đặt `PUBLISH_IMAGES=false`. INV chưa `docker login`.

#### E.10.1 SEC kiểm nội dung image

SEC tự kéo cả 3 tag **không cần đăng nhập** (đúng là công khai) rồi kiểm:

| Kiểm | Kết quả |
|---|---|
| `Config.Env` | api: chỉ `PATH`, `NODE_VERSION`, `YARN_VERSION`, `NODE_ENV=production`. web: chỉ biến của Caddy. **Không** có biến bí mật |
| `docker history` (lệnh build) | Không có `secret`/`token`/`password`/`key=`. Build arg duy nhất là `VITE_DESK_PHONE`: hotline công khai, có cả trên landing |
| Tệp trong image (ngoài `node_modules`, migration) | Không có `.env*`, `*.pem`, `*.key`, `*.age`, `id_*`, `*.p12`, `*.sql`, `*.dump`, `*.kdbx` |
| Chuỗi khóa trong `/app/dist`, `/srv` | Không có khóa riêng, `ghp_`/`github_pat_`, `AKIA…`, `sk_live_` |
| Ngữ cảnh build | Checkout sạch trên CI. `.dockerignore` loại `.env*`, khóa, dump, `infra/demo/.work`/`.out` |
| `-test` | Có `/app/dist/test-support`. Bản production không có (đúng BUG-R1-SEC-08) |

- **Kết luận:** image chỉ chứa mã đã công khai trong repo, cộng phụ thuộc npm và chuỗi giao diện. Bí mật chỉ nạp lúc chạy (`.env`, `_FILE`). **Không có gì lộ.**

#### E.10.2 Quyết định SEC

1. **CHẤP NHẬN gói Public** cho cả `ottimo-api` và `ottimo-web`. Không phải xóa gói, không phải đổi tên. Rủi ro công khai image bằng rủi ro công khai mã nguồn, mà INV đã chấp nhận ở ESC-025. Điều kiện E.6 (2) "gói phải Private" **được thay** bằng E.10.
2. **Tag `-test`: giữ, không cần xóa, được tiếp tục publish.**
   - QA cần `-test` cho E2E đồng hồ giả trên staging (R5-04).
   - Mã `test-support` vốn đã công khai trong repo, nên kẻ tấn công không lợi gì thêm từ image. Endpoint `/__test__` chỉ có khi **chính OTTIMO** chạy image này với `INCLUDE_TEST_SUPPORT=1`. `config.ts` từ chối cờ này và `TEST_SUPPORT_TOKEN` khi `APP_ENV=production`, và CI không chọn được tag `-test` (E.8).
   - Điều kiện thêm, **trước production** (OPS): `deploy.sh` từ chối tag có hậu tố `-test` và `API_TAG_SUFFIX` khác rỗng khi `.env` có `APP_ENV=production`. Có test trong `infra-scripts`.
3. **Bỏ bước `docker login` GHCR của INV trên VPS.** VPS kéo image công khai không cần token, nên không có token `read:packages` nằm trên VPS, bớt một bí mật phải giữ. OPS sửa `inv-staging-checklist.md` và README mục 8 cho khớp.
4. **Quy tắc mới, vì mọi image đẩy lên là công khai ngay và không thu hồi được hoàn toàn:**
   - (a) **Không bao giờ** đưa bí mật vào build arg, `ENV` hay `COPY` của Dockerfile. Mọi thay đổi `infra/docker/Dockerfile.*` và `.dockerignore` phải có SEC review.
   - (b) **Trước production:** CI quét image vừa build trước khi push (`docker history` + danh sách tệp cấm như bảng E.10.1, hoặc gitleaks trên filesystem image). Có lỗi thì không push.
   - (c) **Trước production:** production kéo image theo **digest** (`@sha256:…`) do CI ghi lại, không theo tag.
   - (d) Lỡ đẩy nhầm bí mật: xóa phiên bản gói ngay **và coi bí mật đó đã lộ**, phải xoay khóa. Xóa gói không đủ.
5. Nếu INV muốn image Private sau này (không bắt buộc theo SEC):
   - đẩy sang **gói tên mới** tạo Private **trước** lần đẩy đầu, ví dụ tạo tay hoặc đẩy từ máy OPS với gói không liên kết repo, rồi sửa `owner/api`/`web` trong `ci.yml`;
   - hoặc build trên VPS;
   - hoặc dùng registry khác.

   Cả ba đều tốn thêm việc mà không giảm rủi ro thật, nên SEC **không khuyến nghị** ở R2/R3.

#### E.10.3 Điều kiện bật deploy staging sau E.10

| # | Điều kiện | Thay đổi |
|---|---|---|
| D0 | Passphrase cho `ottimo_ops` trước `init-secrets.sh` (E.9) | Giữ nguyên |
| D1 | Environment `staging` có người duyệt bắt buộc, chỉ nhánh `main`. 3 secret của environment, tạo sau khi có bảo vệ | Giữ nguyên |
| D2 | Bản sửa R5-01 đã gộp, `infra-scripts` xanh | Giữ nguyên |
| **D3** | **Đổi thành:** gói Public được chấp nhận (E.10.2); VPS **không** `docker login`; image đúng tag `sha-<commit>` đã kiểm như E.10.1 | **Đạt** với 3 tag hiện có |
| D4 | Khóa CI riêng, có `restrict` | Giữ nguyên |
| D5 | Staging chỉ có dữ liệu giả | Giữ nguyên |
| D6 | SEC đọc log Actions ngay sau lượt deploy CI đầu (E.8.2) | Giữ nguyên |

- **`PUBLISH_IMAGES` bật lại được ngay.** SEC không chặn.
- **G2.5 không đổi:** 0 Critical/High. Không tạo ESC mới. Công khai image là hệ quả trực tiếp của ESC-025, INV đã quyết.
