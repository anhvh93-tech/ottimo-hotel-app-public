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
| **G2.2** SEC-G3 (8 Major) | **ĐẠT CÓ ĐIỀU KIỆN** – 7/8 Verified (BE-33…37, FE-06, MOB-01). BE-38 mở lại một phần (điểm 2 hồi quy ở S4) → theo dõi bằng **BE-65** (Major, rủi ro Medium). Thẻ mới OPS-04 (Minor) | `s3-SEC.md` 10.2–10.3 |
| **G2.3** S4-17 | **ĐẠT** – đóng bằng test cục bộ; phần qua Caddy thật thuộc S4-15 | mục A |
| **G2.4** review bắt buộc (PWA, guest-web P-R2-4, SSE, nhóm D A/A.3, `roomName`) | **Đã review.** PWA (a)(b), SSE, `roomName`, guest-web: đạt có ghi chú. **Ảnh PWA: không đạt** (BE-65). **Nhóm D: không đạt** (BE-73; BE-74, BE-75 có hạn). Luật B-15: **SEC đã quyết V2** (C.6). Giả định ARC (c) xác nhận; (d) xác nhận có điều kiện. **4 Major mở:** BE-65, BE-73, BE-74, BE-75 | mục C |
| **G2.5** Critical/High mở | **KHÔNG có Critical/High mở.** Mức cao nhất là Major / rủi ro Medium. SEC phụ đề xuất High cho BE-73; SEC chính xếp Medium theo cùng thang với BE-53 (C.9). Cách xếp này **không** bỏ việc phải sửa: SEC không ký S4-11/S4-32 tới khi BE-73 Verified | mục C.9 |
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
- Trạng thái: Open

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
- Trạng thái: **Verified 18/10** (cây làm việc, chưa commit – BE-C `s4-be-c.md` mục 15; mục C.10). Kiểm lại trên commit khi BE-C commit

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
- Trạng thái: Open

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
- Trạng thái: Open

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

## D. Điểm làm tốt (nên giữ)
1. PWA offline chép từng trường theo danh sách cho phép, có test dump IndexedDB thật; service worker không cache API; đăng xuất xóa sạch; `guard.test` chặn gọi endpoint C3.
2. SSE có mức sàn theo loại sự kiện, hub đóng an toàn, payload chỉ id; phiên và vai kiểm lại theo heartbeat.
3. Khóa giấy tờ v1 nhiều lớp (HKDF riêng mục đích, CHECK định dạng, CHECK đồng ý ở DB, không bao giờ ra API/audit). Yêu cầu khách có DTO tối giản, Luhn trước luật chữ số, hiển thị văn bản thuần.
