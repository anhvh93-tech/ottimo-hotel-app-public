# Đặc tả mức trường – EP14 App khách mức 1 (guest-web, phần R2)

- Tác giả: BA | Round 2 – Sprint 2 (đi trước Sprint 4 một sprint) | Ngày: 16/10/2026 | Phiên bản: **0.3** (18/10, tuần Ổn định – Phản hồi & sửa: 4.4 thêm cạnh `in_progress → declined` khi việc HK liên kết đã hủy, luật B-15 của `replyNote` viết lại theo SEC C.6 phương án V2 + bổ sung 18/10 kèm ví dụ; **4.5 mới** – lúc ghi phí dọn theo yêu cầu BR-506). Bản 0.2 (17/10, Sprint 4: mục 3.3, 4.3, 4.4 theo OpenAPI 0.3.7 – mã lý do từ chối `declinedReasonCode` 5 mã + `replyNote`, câu trả lời tự động `guest.req.auto_reply` mới). Bản 0.1 (16/10)
- Phạm vi (Must R2 theo R-C): US-106 (mở trang bằng link/QR), US-108 **trừ phần mã cửa của AC2** (P-R2-5), US-109 (gửi yêu cầu), US-110 (định tuyến + xử lý phía nhân viên), US-112 (tiếng Anh). Check-in online (US-107) và cấp/thu hồi link ở Desk đã đặc tả ở `specs/EP06-registration.md` mục 8 – tài liệu này không lặp lại.
- **Dời R3 theo R-C** (không làm, không hiện chuỗi): US-111 folio/bill, US-128 + phần mã cửa của US-108 AC2, US-141 xác minh mức 2 (OTP/mã lễ tân), US-113 tự gia hạn/trả muộn, US-114 dài hạn xem HĐ, US-115 tiếng Nga, US-116 đánh giá.
- Nguồn và quy ước: như `specs/EP00-platform.md` mục 0. Thứ tự ưu tiên khi lệch: `business-rules.md` **v0.3.1** → backlog (AC) → **điều kiện SEC ĐK-1…ĐK-6** (`rounds/round-02/outputs/SEC/w1-review.md` mục 4, `s1-decisions.md`) → `state-machines.md` SM-15 → `rbac-matrix.md` (S30, D23, cột GST1) → `api/openapi.yaml` **0.3.4-draft** → `design/copy/strings-*.json`. Không chép con số nghiệp vụ.
- Đọc cùng: `EP06-registration.md` mục 8 (8.1 ĐK-1…6 áp nguyên văn, 8.2 cấp link, 8.4 lỗi link, 8.5 ngôn ngữ), `EP07-08-housekeeping-maintenance.md` (việc HK, phiếu sửa sinh từ yêu cầu), `business-processes.md` P04c, P04d; ADR-006; SEC SR-GST-01…15, SR-RL-05, SR-INP-04/05, SR-PWA-03.

---

## 0. Ràng buộc bảo mật áp cho toàn bộ guest-web R2 (ĐK-1…ĐK-6)

Áp nguyên văn `EP06-registration.md` mục 8.1. Bổ sung cho phần thông tin lưu trú và yêu cầu:

| ĐK | Ràng buộc thêm trong tài liệu này |
|---|---|
| ĐK-1 | Không có màn/nút xác minh, không gọi `sendGuestOtp`, `verifyGuestSession`, `getGuestFolio`, `withdrawGuestConsent`. Phiên luôn `level = 1` |
| ĐK-2 | Trang chỉ đọc các khóa mức 1: `GuestSession` (`reservationCode`, `guestFirstName`, `roomNo`, `locale`, `stayEnded`, `expiresAt`), `GuestStay` (mục 2.1 – **không bao giờ** có khóa `guestFullName`, `doorCode`, kể cả `null`), `GuestRequestForGuest` (mục 3.3). Đề nghị thêm trường mới vào `GuestRequestForGuest` (E14-03) **phải qua SEC** trước khi BE cài |
| ĐK-3 | guest-web không lưu dữ liệu đơn ở `localStorage`/`sessionStorage`/IndexedDB; service worker chỉ cache **thông tin lưu trú mức 1** (SR-PWA-03) – không cache danh sách yêu cầu (có ghi chú khách D23) |
| ĐK-4 | Token rời URL ngay (`history.replaceState`), `Referrer-Policy: no-referrer`, không script/font bên thứ ba; QR trong phòng **không chứa token** (SR-GST-12, mục 1.2) |
| ĐK-6 | Thanh điều hướng R2 chỉ có 3 mục: **Lưu trú** (`guest.tab.home`), **Yêu cầu** (`guest.tab.requests`), **Thông tin** (`guest.tab.info`). **Không** có `guest.tab.bill`, khối "Mã cửa" (wireframe L7 vẽ cho R3) – thay bằng dòng R2 **(mới)** `guest.stay.door_at_desk` "Lễ tân giao mã cửa/thẻ phòng khi bạn nhận phòng." |

---

## 1. Mở trang của đơn (US-106)

### 1.1 Bằng link (AC1, AC2)
- Link `/g/{token}` do FD+ cấp (EP06 8.2). Mở → `openGuestSession{token}` → cookie phiên mức 1 → trang **Lưu trú** của đúng đơn đó. Không cài app, không tạo tài khoản (AC1).
- Link đơn A không xem được đơn B: phiên gắn một đơn (`x-scope: reservation`), mọi `/v1/guest/*` chỉ đọc đơn của phiên (AC2).
- Hết hạn/thu hồi/sai → `401 GUEST_LINK_INVALID` → trang `guest.link_expired_title`/`_body` + cách liên hệ (`property.phone` công khai). Quá nhiều lần mở → `429 RATE_LIMITED` (10/phút/IP – SR-RL-03) → `error.RATE_LIMITED`.
- Đơn đã `checked_out` (dài hạn: HĐ `closed` – R3): mọi thao tác → `403 GUEST_STAY_ENDED`; **ngay lúc trả phòng**, Wi-Fi và gửi yêu cầu bị khóa (AC2). R2 không có bill nên trang chỉ hiện `guest.after_checkout.title` "Cảm ơn bạn đã lưu trú" + liên hệ – **không** dùng `guest.after_checkout.body` (nhắc bill – ĐK-6). Ân hạn sau trả phòng (GSTp) chỉ có ý nghĩa từ R3 khi có bill.

### 1.2 Bằng QR trong phòng (AC1 "hoặc QR"; SR-GST-12, SEC-ARC-03)
- QR dán trong căn trỏ tới **trang công khai của căn** `/u/{unitSlug}` (`getPublicUnitPage`): tên cơ sở, số căn, hướng dẫn chung VI/EN, SĐT công khai – **không** đọc dữ liệu đơn nào.
- Ô "Nhập mã đặt phòng để nhận lại link" (`resendGuestLinkFromUnit`):

| Trường | Nhãn | Kiểu | BB | Kiểm tra | Lỗi / kết quả |
|---|---|---|---|---|---|
| `bookingCode` | Mã đặt phòng **(mới)** `guest.unit.code_label` | text | B | Cắt khoảng trắng, chữ hoa; 1–20 ký tự `[A-Z0-9-]` | Sai dạng → lỗi tại ô **(mới)** `guest.unit.code_invalid` "Mã đặt phòng có dạng OTM-00171." |

  Server **luôn** trả `202` cùng một câu (không lộ đơn có tồn tại): **(mới)** `guest.unit.sent` "Nếu mã đúng, chúng tôi đã gửi link tới email trên đặt phòng. Không nhận được? Gọi lễ tân {phone}." Link mới là **link chờ**, không làm hỏng link khách đang dùng. Giới hạn 5/giờ/IP, 3/ngày/đơn → `429` → `error.RATE_LIMITED`. Đơn không có email → không gửi gì (câu trả lời vẫn như trên) – khách gọi lễ tân để được cấp link tại quầy.

### 1.3 Trang chủ "Lưu trú" – thứ tự khối (UXD quyết bố cục)
`guest.hello` (`guestFirstName`) → ngày/giờ (mục 2) → nút check-in online khi `onlineCheckinAvailable = true` (EP06 8.3) → Wi-Fi (mục 2.2) → dòng `guest.stay.door_at_desk` (ĐK-6) → lối tắt "Gửi yêu cầu" (mục 3). Trạng thái màn: đang tải; lỗi tải `guest.error_title`/`_body` + Thử lại; mất mạng `guest.offline_banner` (xem được dữ liệu đã tải – mục 5).

---

## 2. Thông tin lưu trú (US-108 trừ mã cửa) – `getGuestStay`

### 2.1 Trường mức 1 và cách hiện
| Trường | Hiển thị (chuỗi) | Quy tắc |
|---|---|---|
| `reservationCode` | "Mã đặt phòng {code}" | Để khách đọc cho lễ tân |
| `status` | Không hiện mã; quyết định khối hiển thị | `confirmed` / `in_house` → trang đầy đủ; `checked_out` → 403 (mục 1.1); `cancelled`/`no_show` → token đã bị thu hồi cùng đơn → 401 `GUEST_LINK_INVALID` `[GIẢ ĐỊNH BA – đề nghị E14-01 thu hồi link khi B5/B10/B11]` |
| `arrivalDate`, `departureDate` | `guest.stay.dates` (`{from} → {to} · {nights} đêm`) | Định dạng theo ngôn ngữ (VI `19/10`, EN `19 Oct`); số đêm = ngày đi − ngày đến (BR-002) |
| `checkinTime`, `checkoutTime` | `guest.stay.checkin_time`, `guest.stay.checkout_time` | **Giờ chuẩn** BR-401 (AC1) – không hiện giờ nhận sớm/trả muộn đã xác nhận ở R2 `[GIẢ ĐỊNH BA – trả muộn đã duyệt hiện ở R3 cùng US-113]` |
| `roomNo` | `guest.stay.room` | Vắng/null (đơn chưa gán căn – US-139) → ẩn dòng. Căn có thể đổi trước ngày đến (B7) – trang luôn đọc lại khi mở |
| `stayType` | Đơn dài hạn: ẩn "{nights} đêm", hiện "Thuê dài hạn đến {to}" **(mới)** `guest.stay.long_until` | – |
| `property.name`, `.address`, `.mapUrl`, `.phone` | Tab **Thông tin**: địa chỉ + nút "Chỉ đường" (`gw.directions`, mở `mapUrl` ở tab mới, `rel="noopener noreferrer"`) + nút gọi `tel:` (AC1) | `mapUrl` chỉ thuộc tên miền bản đồ cho phép (Google Maps) `[GIẢ ĐỊNH BA – SEC xác nhận danh sách]` |
| `houseRules` | Tab **Thông tin**: `gw.house_rules` "Nội quy và phí phạt" (AC1) | Văn bản theo ngôn ngữ phiên (BR-009/US-112), phí lấy từ tham số BR-511 tại thời điểm đọc – server dựng, client hiện văn bản thuần (SR-INP-04) |
| `wifi.ssid`, `wifi.password` | Khối `guest.wifi` + nút sao chép mật khẩu | Mục 2.2 |
| `onlineCheckinAvailable` | Nút `guest.cta.checkin` | EP06 8.3–8.4 |
| `guestFullName`, `doorCode`, `doorCodeAvailableFrom` | **Không dùng ở R2** | ĐK-2 (khóa không có trong JSON mức 1), P-R2-5 |

### 2.2 Wi-Fi theo khung hiệu lực (AC2 phần R2 – P-R2-5)
- Server trả `wifi` (khác `null`) khi: đơn `in_house`, **hoặc** đơn `confirmed` và ngày nghiệp vụ hiện tại ≥ `arrivalDate` (BR-010). Ngược lại `null` → trang hiện `gw.wifi_later` "Hiện ở đây vào ngày nhận phòng ({date})." `[GIẢ ĐỊNH BA: dùng ngày nghiệp vụ – khách nhận trước 06:00 (B9a) đã `in_house` nên vẫn thấy]`.
- Sau `checked_out` → 403 (mục 1.1) – Wi-Fi ẩn ngay (AC2, D22 tinh thần "sau trả phòng thì ẩn").
- Wi-Fi là C1 (rbac mục 6 – có ở GST1). Không đưa mật khẩu Wi-Fi vào URL, log, thông báo.

### 2.3 Lỗi
| Mã | Khi | Trang |
|---|---|---|
| 401 `GUEST_LINK_INVALID` | Phiên/token hết hạn hoặc bị thu hồi | `guest.link_expired_*` |
| 403 `GUEST_STAY_ENDED` | Đơn đã trả phòng | `guest.after_checkout.title` (không câu bill) |
| 5xx, mạng | – | `guest.error_*` + Thử lại; còn bản đã tải (cache SW) → hiện kèm `guest.offline_banner` |

---

## 3. Gửi yêu cầu (US-109; SM-15) – `createGuestRequest`, `listMyRequests`

### 3.1 Loại yêu cầu và khi nào được gửi
| `type` | Nhãn (`guest.req.*`) | Đơn `confirmed` (trước khi đến) | Đơn `in_house` | Định tuyến (BR-811) |
|---|---|:-:|:-:|---|
| `extra_cleaning` | `guest.req.clean` Dọn phòng thêm | ✖ | ✔ | Buồng phòng – việc `guest_request` |
| `amenities` | `guest.req.towels` Khăn, đồ dùng | ✖ | ✔ | Buồng phòng – việc `guest_request` |
| `report_issue` | `guest.req.repair` Báo hỏng | ✖ | ✔ | Bảo trì – phiếu sửa mức mặc định Trung bình (BR-809) |
| `transport_tour` | `guest.req.transport` Đặt xe / tour | ✔ | ✔ | Lễ tân |
| `late_checkout` | `guest.req.late` Trả phòng muộn | ✔ | ✔ | Lễ tân |
| `other` | `guest.req.other` Khác | ✔ | ✔ | Lễ tân |

(DOM D-13 a: 3 loại tới lễ tân dùng được trước ngày đến – đón sân bay Liên Khương, hỏi nhận sớm/trả muộn, khác). Danh sách loại dùng được, phí và ô ghi chú bắt buộc lấy từ **`listGuestRequestOptions`** (ARC B-16, OpenAPI 0.3.6 – `[{type, available, unavailableReason, feeVnd|null, noteRequired}]`, mức 1, khóa sau trả phòng; **chờ SEC duyệt ĐK-2**). Loại không được phép theo trạng thái → nút ẩn; gọi API → 422 mã trường `REQUEST_TYPE_NOT_AVAILABLE` (ARC B-14) → **(mới)** `guest.req.not_available` "Yêu cầu này dùng được khi bạn đã nhận phòng."

### 3.2 Bảng trường – `createGuestRequest` (`Idempotency-Key`)
| Trường | Nhãn | Kiểu | BB | Kiểm tra | Lỗi |
|---|---|---|---|---|---|
| `type` | Bạn cần gì? (`guest.req.title`) | enum | B | Mục 3.1 | `NOT_IN_LIST`; `REQUEST_TYPE_NOT_AVAILABLE` |
| `note` | `guest.req.note` | text | ĐK: **B** với `report_issue`, `transport_tour`, `other`; K với loại còn lại `[GIẢ ĐỊNH BA – bộ phận cần biết hỏng gì/đặt gì]` | Cắt khoảng trắng; 3–500 ký tự khi bắt buộc, ≤ 500 khi không; V-09 (dãy giống số thẻ → 422); câu nhắc dưới ô **(mới)** `guest.req.note_hint` "Không ghi số giấy tờ, số thẻ thanh toán hay thông tin sức khỏe." (SR-INP-05) | `REQUIRED` → **(mới)** `guest.req.note_required` "Mô tả ngắn giúp chúng tôi xử lý nhanh hơn."; `CARD_NUMBER_DETECTED` → **(mới)** `guest.req.card_detected` "Vui lòng không ghi số thẻ thanh toán." |

- **Phí trước khi gửi** (không phải folio – ĐK-6 cho phép; ARC B-16 thay đề nghị E14-04 cũ): `feeVnd` của loại lấy từ `listGuestRequestOptions`; `feeVnd > 0` → hiện `guest.req.fee_notice` và ô đồng ý **(mới)** `guest.req.fee_accept` "Tôi đồng ý phí {amount}" (không tích sẵn) → gửi `feeAccepted = true`; thiếu → 422 mã trường `FEE_NOT_ACCEPTED`; server lưu `feeVndSnapshot` (lúc nào phí vào folio: mục 4.5). Loại có phí (DOM D-15 B-16): `extra_cleaning` theo cách hiểu BR-506 của DOM D-13 b – **khách ngắn ngày**: dọn bù lần dọn hằng ngày bị bỏ (khách từ chối buổi sáng, chiều gọi) = **miễn phí**; **lần dọn đầy đủ thứ hai trong cùng ngày** = phí BR-506; **khách dài hạn**: mọi lần dọn lẻ ngoài gói = phí BR-506 `[GIẢ ĐỊNH – chờ INV xác nhận cách hiểu ngắn ngày, PO gom ESC cuối round]`; `amenities` (thay khăn, đồ dùng) = miễn phí; `transport_tour` giá báo riêng → `feeVnd = null`, lễ tân báo giá trong `replyNote`. Sửa câu `guest.req.fee_notice`: R2 không có hóa đơn trên app → "Dịch vụ này có phí {amount}, sẽ cộng vào khoản thanh toán khi trả phòng." (UXD – E14-06).
- Giới hạn: 20 yêu cầu/ngày/đơn (SR-RL-05) → `429 RATE_LIMITED` → **(mới)** `guest.req.too_many` "Bạn đã gửi nhiều yêu cầu hôm nay. Vui lòng gọi lễ tân {phone}."
- Đơn đã trả phòng → `403 GUEST_STAY_ENDED`; check-in online không ảnh hưởng.
- Mất mạng: nút gửi khóa + `guest.offline_banner` ("gửi yêu cầu khi có mạng lại") – **không** xếp hàng trên máy (ĐK-3). Nội dung đang gõ giữ trong bộ nhớ trang tới khi gửi được.

Kết quả (AC1): thẻ yêu cầu `guest.req.sent` + nhãn `guest.req.status.new` "Đã gửi" + thời điểm gửi (giờ VN, định dạng theo ngôn ngữ). Trong giờ trực (`front_desk_hours` – BR-811) hiện `guest.req.reply_time` với `{minutes}` = `guest_request_response_minutes` và giờ trực lấy từ tham số (sửa câu – không cố định "07:00–22:00", E14-06). Ngoài giờ trực: trả lời tự động hiện ngay trên thẻ (`autoReply`) – mục 4.3.

### 3.3 Danh sách yêu cầu của khách – `listMyRequests` (US-109 AC1, AC2)
| Trường (`GuestRequestForGuest`) | Hiển thị |
|---|---|
| `type` | Nhãn loại |
| `note` | Nội dung khách đã gửi (văn bản thuần) |
| `status`, `statusLabel` | 5 nhãn SM-15 theo ngôn ngữ: `guest.req.status.new/acknowledged/in_progress/done/declined` = Đã gửi · Đã nhận · Đang xử lý · Hoàn thành · Không thực hiện được |
| `autoReply` | Dòng trả lời tự động ngoài giờ |
| `declinedReasonCode` **(0.3.6 B-15 / 0.3.7 – thay `declinedReason` tự do)** | Khi `declined` (AC2): nhãn lý do theo ngôn ngữ phiên khách – `guest.req.decline.<mã>` (bảng mục 4.4); mã lạ → `guest.req.decline.other` |
| `replyNote` | Lời nhắn của nhân viên (văn bản thuần, mức 1 – ai có link cũng đọc được): hiện dưới nhãn trạng thái khi `done` hoặc `declined`; bắt buộc có khi lý do `other` |
| `feeVnd` | Phí khách đã đồng ý (snapshot) – "Phí {amount}" khi > 0 |
| `createdAt`, `updatedAt` | "Gửi lúc {time}" · "Cập nhật {time}" |

Sắp mới nhất trước; rỗng → `guest.req.empty`. Cập nhật trạng thái: guest-web **không** có SSE (SSE chỉ cho nhân viên) → gọi lại `listMyRequests` khi mở tab Yêu cầu, khi trang được focus, và mỗi 30 giây khi tab đang mở và còn yêu cầu chưa kết thúc (`new`/`acknowledged`/`in_progress`) `[GIẢ ĐỊNH BA]`.

---

## 4. Định tuyến và xử lý phía nhân viên (US-110; BR-811, BR-809; SM-15) – S30

### 4.1 Định tuyến lúc tạo (SYS, cùng giao dịch với `createGuestRequest`)
| Loại | `routedTo` | Sinh kèm | Ghi chú |
|---|---|---|---|
| `extra_cleaning`, `amenities` | `housekeeping` | Việc `guest_request` (`source = guest_app`, `note` = nội dung khách, bậc ưu tiên 3 – EP07 3.3) cho căn của đơn, `dueDate` = hôm nay | US-054 AC2 – chip "App khách" |
| `report_issue` | `maintenance` | Phiếu sửa `new`, `source = guest_app`, `severity = medium` (BR-809, AC1), `category = other`, `title` = "Khách báo hỏng – căn {room}", `description` = nội dung khách, `guestRequestId` | FD nâng mức (`updateWorkOrder`, EP07 6.3); mã `WO-` do server cấp |
| `transport_tour`, `late_checkout`, `other` | `front_desk` | Không sinh việc – yêu cầu nằm ở hàng "Yêu cầu khách" của lễ tân (S30, `today.requests`) | – |

Mọi loại: `ackDueAt` tính ngay (mục 4.3); thông báo `guest_request_new` tới **bộ phận được định tuyến** + FD (FD theo dõi mọi yêu cầu – S30 ✔); SSE `request.created`.

### 4.2 Ai thấy gì – `listGuestRequests` (S30; D23)
| Vai | Phạm vi | Trường |
|---|---|---|
| OWN, MGR, FDL, FD | Mọi yêu cầu của cơ sở | Đủ (`note` D23 đầy đủ) |
| HK | Chỉ `routedTo = housekeeping` (AC3, `routed_to_me`) | Loại + căn + nội dung (D23 – T) |
| MT | Chỉ `routedTo = maintenance` | Như HK |
| SAL, CTV | ✖ | – |

Lọc `status` (mặc định chưa kết thúc: `new`, `acknowledged`, `in_progress`); sắp: quá hạn trả lời trước (`isAckOverdue`), rồi `ackDueAt` tăng dần. Cột: căn, loại, nội dung (văn bản thuần – SR-INP-04), gửi lúc, hạn trả lời ("còn {m} phút"/"quá {m} phút" đỏ), trạng thái, chip việc/phiếu liên kết (bấm mở EP07).

### 4.3 Hạn trả lời và trả lời tự động (BR-811; AC2)
- Trong giờ trực [`front_desk_hours.from`, `front_desk_hours.to`) (gồm mốc đầu, không gồm mốc cuối – BR-811): `ackDueAt` = lúc gửi + `guest_request_response_minutes`. Ví dụ BR-811: gửi 21:59 → hạn 22:09 (hạn được phép rơi ra ngoài giờ trực).
- Ngoài giờ trực: server **ngay lúc tạo** ghi `autoRepliedAt`; mỗi lần khách đọc (`listMyRequests`) server dựng `autoReply` theo **ngôn ngữ phiên khách** từ chuỗi **`guest.req.auto_reply`** (UXD duyệt 17/10, bản 0.3.7 – thay câu nháp 0.1 và khóa cũ `gw.req.auto_reply` đã đánh dấu "CŨ"):
  - VI: "OTTIMO đã nhận yêu cầu của bạn lúc {time}. Lễ tân sẽ xử lý từ {open_time}. Nếu cần gấp, bạn vui lòng gọi {phone}." · EN: "We received your request at {time}. Our front desk will take care of it from {open_time}. If it is urgent, please call {phone}." · RU: bản nháp UXD (khóa RU còn thiếu thì dùng EN – P-S4-10).
  - Tham số (đúng như `guest-requests.service.ts`): `{time}` = giờ `autoRepliedAt` theo giờ cơ sở, dạng `HH:mm`; `{open_time}` = `front_desk_hours.from` (BR-811); `{phone}` = `property.phone_public` (hotline công khai). **Cơ sở chưa có số công khai** → server bỏ nguyên câu chứa `{phone}` (câu trả lời còn hai câu đầu) – đề nghị OWN nhập hotline ở Tham số trước khi chạy thật (E14-10).
  - Chuỗi do server dựng từ bản chuỗi đã sinh (`scripts/gen-guest-request-copy.mjs` → `guest-request-copy.ts`); đổi chữ ở `gen_strings.py` thì BE-D chạy lại script (`--check` trong CI) – guest-web **không** tự dựng câu.
  - `ackDueAt` = mốc mở giờ trực kế tiếp + `guest_request_response_minutes` (ví dụ gửi 22:00 → hạn 07:10 hôm sau) (DOM D-13 c). **Ngoại lệ `report_issue`**: ngoài giờ vẫn thông báo **ngay** cho người trực đêm/FDL (`work_order_new`/`work_order_high_new` – mất nước nóng, mất điện, khóa cửa không chờ sáng); câu trả lời tự động **luôn** có số điện thoại trực (`{phone}`).
- J10 (mỗi phút): yêu cầu còn `new` quá `ackDueAt` → `isAckOverdue = true`, thông báo `guest_request_overdue` tới bộ phận định tuyến **và** FD (AC2 "front_desk nhận nhắc"); vào "Cần chú ý" của FD+ (`EP01-dashboard.md` mục 3 – đề nghị kind E14-05).

### 4.4 Chuyển trạng thái – `transitionGuestRequest` (SM-15) và liên kết việc/phiếu
| Nút (nhân viên) | `action` | Từ → Đến | Ai | Trường | Kết quả phía khách |
|---|---|---|---|---|---|
| "Đã nhận" (`today.req_ack`) | `acknowledge` | `new` → `acknowledged` | Bộ phận định tuyến (HK/MT theo loại) hoặc FD+ | – | "Đã nhận"; dừng đo hạn BR-811 (`acknowledgedAt`) |
| (tự động) | – | `new`/`acknowledged` → `in_progress` | SYS | – | "Đang xử lý" khi việc HK liên kết `in_progress` hoặc phiếu liên kết `in_progress` (W2). Bắt đầu việc/nhận phiếu khi yêu cầu còn `new` → SYS ghi luôn `acknowledgedAt` (coi như đã nhận) `[GIẢ ĐỊNH BA]` |
| (tự động) | – | `new`/`acknowledged`/`in_progress` → `done` | SYS | – | "Hoàn thành" khi việc HK liên kết `done` hoặc phiếu liên kết `done` (W4) – AC2. Phí BR-506 (nếu có) ghi folio trong cùng giao dịch – mục 4.5 |
| "Xong" (yêu cầu lễ tân) | `complete` | `acknowledged`/`in_progress` → `done` | FD+ (HK/MT chỉ khi yêu cầu không có việc/phiếu liên kết) | `replyNote` K (SEC đã duyệt ĐK-2 16/10), ≤ 300 – câu trả lời hiện cho khách; kiểm theo luật B-15 dưới bảng | "Hoàn thành" (+ câu trả lời). **v0.3:** yêu cầu có việc HK/phiếu liên kết → `complete` **không** ghi phí; yêu cầu không có việc liên kết → `complete` ghi phí (mục 4.5) |
| "Không thực hiện được" | `decline` | `new`/`acknowledged` → `declined`; **v0.3:** `in_progress` → `declined` **chỉ khi** việc HK liên kết đã `cancelled` | FD+ (HK/MT không từ chối – báo lễ tân; gọi → 403) | `declinedReasonCode` **B** – enum **0.3.7** (bảng dưới); `replyNote` **B** khi `other`, K với mã khác | "Không thực hiện được" + nhãn lý do theo ngôn ngữ khách (AC2) + `replyNote` nếu có. Việc HK liên kết còn `open` → `cancelled` (lý do `other`, ghi chú "Yêu cầu khách bị từ chối"); phiếu liên kết **không** tự hủy (sự cố vẫn cần sửa). Không bao giờ ghi phí |

Lỗi: chuyển không hợp lệ → 409 `INVALID_TRANSITION` (gồm: `decline` yêu cầu `in_progress` khi việc HK liên kết **đang làm**, hoặc khi yêu cầu gắn **phiếu sửa** thay vì việc HK; `complete` yêu cầu đã `done` vì HK vừa dọn xong); HK/MT thao tác yêu cầu không định tuyến tới mình → 404 `NOT_FOUND`; HK/MT gọi `decline`, hoặc gọi `complete` yêu cầu có việc/phiếu liên kết → 403 `FORBIDDEN_ACTION`.

**Cạnh `in_progress → declined` (v0.3 – ARC FB-R2-ARC-BE-S4-07, BE-D `s4-be-d.md` 7.1; ARC đang xác nhận giả định (s5))**
- Điều kiện: yêu cầu đang `in_progress` **và** việc HK liên kết đã `cancelled`. Lễ tân dùng cạnh này để báo khách "không thực hiện được" sau khi việc bị hủy (ví dụ khối OOO), thay vì phải bấm "Xong" cho một việc không làm.
- Server: trong cùng giao dịch, gọi hủy việc HK (không đổi gì nếu việc đã `cancelled` hoặc đang làm), đọc lại trạng thái việc; chỉ nhận khi trạng thái việc là `cancelled`. Việc đang `in_progress`/`done` → 409, giao dịch quay lui (việc không bị hủy).
- Chỉ áp cho **việc HK** (`extra_cleaning`, `amenities`). Yêu cầu `report_issue` gắn phiếu sửa: phiếu không tự hủy, không có cạnh này.
- Hiện nay SM-14 chỉ hủy việc từ `open` (khách từ chối dọn, khối OOO, đơn hủy) và yêu cầu chỉ sang `in_progress` khi việc đã bắt đầu, nên tình huống này **chưa** có đường sinh ra trong R2. Cạnh được cài sẵn cho đường hủy việc đang làm sau này (BE-D 7.1 ca (b)).

**Mã lý do từ chối (`declinedReasonCode`, OpenAPI 0.3.7 – thay danh sách nháp 0.1)** – khách thấy nhãn theo ngôn ngữ phiên (chuỗi UXD duyệt 17/10):

| Mã | Khi nào lễ tân dùng | Khách thấy (VI · EN) | Chuỗi |
|---|---|---|---|
| `not_available_now` | Dịch vụ có nhưng hiện không làm được (hết xe, hết đồ, đang bảo trì thiết bị) | "Hiện chưa thực hiện được" · "Not available right now" | `guest.req.decline.not_available_now` |
| `outside_service_hours` | Yêu cầu rơi ngoài giờ phục vụ của dịch vụ đó | "Ngoài giờ phục vụ" · "Outside service hours" | `guest.req.decline.outside_service_hours` |
| `needs_front_desk` | Cần lễ tân xử lý trực tiếp (gọi lại, cần thông tin thêm, việc liên quan tiền/giấy tờ) | "Lễ tân sẽ liên hệ bạn để xử lý trực tiếp" · "The front desk will contact you about this" | `guest.req.decline.needs_front_desk` |
| `duplicate` | Trùng một yêu cầu khách đã gửi (vẫn đang xử lý bản kia) | "Trùng với một yêu cầu bạn đã gửi" · "Same as a request you've already sent" | `guest.req.decline.duplicate` |
| `other` | Lý do khác – **bắt buộc** `replyNote` giải thích cho khách | "Lý do khác – xem lời nhắn của lễ tân" · "Other reason – see the front desk's message" | `guest.req.decline.other` |

- Khóa nháp 0.1 **bỏ** (UXD đánh dấu "CŨ"): `guest.req.decline.fully_booked`, `guest.req.decline.out_of_hours`, `gw.req.decline.*`; mã `not_offered` **không** còn là lý do từ chối – chỉ là `unavailableReason` của `listGuestRequestOptions` (nút loại đó ẩn/khóa, khách không gửi được).
- `replyNote` (server – `guest-requests.service.ts`), kiểm theo thứ tự: không phải chuỗi → 422 `VALIDATION_FAILED`; bỏ ký tự điều khiển, cắt khoảng trắng; `other` mà rỗng → 422 `REQUIRED`; > 300 ký tự → `TOO_LONG`; giống số thẻ (Luhn, trên văn bản gốc) → `CARD_NUMBER_DETECTED`; rồi **luật B-15** (dưới đây) → `SENSITIVE_DATA_DETECTED`. Mọi lỗi là lỗi trường `replyNote`. Thiếu/sai mã → `declinedReasonCode` `REQUIRED` / `NOT_IN_LIST`.
- Không vào thông báo đẩy/outbox; xóa theo T13 cùng `guest_request.note`.

**Luật B-15 cho `replyNote` (v0.3 – SEC `reviews/s4-SEC.md` C.6 phương án V2 + bổ sung 18/10; BE-D đã cài – FB-R2-SEC-BE-77)**

Phạm vi: **chỉ** `replyNote` nhân viên viết khi `complete`/`decline` (ai có link của đơn cũng đọc được). Ghi chú khách tự viết (`note`, mục 3.2) chỉ kiểm số thẻ (V-09), **không** qua luật này – yêu cầu của khách không bao giờ bị chặn vì dãy số. Ghi chú khai báo nội bộ (`hasLongDigitRun`, EP06) có luật riêng, không dùng các ngoại lệ dưới đây.

Câu luật: **`replyNote` không được chứa dãy từ 6 chữ số trở lên** (mã cửa, số giấy tờ, số điện thoại). **Được phép**: giá tiền VND **có đơn vị**, ngày **gần hiện tại**, danh sách số cách nhau bằng **dấu phẩy hoặc chấm phẩy kèm khoảng trắng**, và hotline công khai của cơ sở. **Bị chặn**: số dài không thuộc các trường hợp trên, kể cả khi chèn dấu cách, chấm, phẩy, gạch giữa các chữ số.

Server kiểm theo 5 bước (bản chuẩn hóa chỉ dùng để kiểm; lưu và hiện nguyên văn lễ tân viết):
1. Kiểm số thẻ (Luhn) trên văn bản gốc – như dòng trên.
2. Chuẩn hóa NFKC (chữ số toàn khổ `４８２９１３` thành chữ số thường).
3. Gỡ các đoạn được phép (thay bằng một ký tự ngắt, để hai số rời không nối vào nhau):
   - **Ngày**: `ngày[./-]tháng[./-]năm 4 số`, cùng một dấu phân cách, là ngày có thật trên lịch, năm cách năm của ngày nghiệp vụ hiện tại (BR-010) không quá 1. Ngày xa hơn (ví dụ ngày sinh – C3) không được gỡ.
   - **Tiền VND**: chữ số đầu từ 1 đến 9; nhóm nghìn bằng **một** loại dấu (`.`, `,` hoặc khoảng trắng) hoặc viết liền; tối đa 10 chữ số; **đơn vị ngay sau** (được một khoảng trắng): `đ`, `₫`, `VND`, `VNĐ`, `đồng`, không phân biệt hoa thường; từ 6 chữ số trở lên phải **tận cùng `000`**; phía trước không dính chữ cái, chữ số, hay chữ số + dấu nhóm (không phải phần đuôi của một số dài hơn).
   - **Ranh giới danh sách**: dấu `,` hoặc `;` **có khoảng trắng phía sau**. (Dấu nhóm nghìn không bao giờ có khoảng trắng phía sau, nên không ảnh hưởng tiền.)
4. Bỏ các dấu phân cách: khoảng trắng, `.`, `,`, `-`, `_`, `+`, `(`, `)` và các gạch Unicode. **Giữ** `/`.
5. Còn dãy ≥ 6 chữ số → 422 `SENSITIVE_DATA_DETECTED`. Ngoại lệ: dãy trùng hotline công khai `property.phone_public` (so 9 chữ số cuối, nên `0263…`, `84263…`, `+84 263…` là cùng một số).

| Không bị chặn | Bị chặn (`SENSITIVE_DATA_DETECTED`) – lý do |
|---|---|
| `Xe đón lúc 15:30, giá 350.000 đ` | `Mã cửa 482913`, `482 913`, `482-913`, `482.913` – số dài không đơn vị |
| `350.000đ`, `350,000 VND`, `350 000 ₫`, `350000đ` | `482,913` – phẩy **không** có khoảng trắng phía sau, không phải danh sách |
| `Tour 1.500.000 đồng/người`, `Tổng 12.000.000 VNĐ` | `482913đ`, `482.913 đ` – có đơn vị nhưng không tận cùng `000` |
| `Xe 4 chỗ 350.000đ, 7 chỗ 450.000đ` | `Mã ４８２９１３` – chữ số toàn khổ |
| `Ngày 18-10-2026 xe đón 15:30`, `Đón 18.10.2026 lúc 07:00`, `Đón 18/10/2026` | `0912.345.678`, `(+84) 912 345 678`, `Gọi 0912 345 678 giá 350.000đ` – số điện thoại |
| `Phòng 202, 2 khách` | `0912345678đ`, `0912.345.000đ` – số bắt đầu bằng 0 / phần đuôi `345.000đ` dính vào số dài hơn (SEC giữ mức chặt hơn – s6) |
| `Phòng 202, 203, 204`, `Phòng 202; 203` – danh sách (SEC nới 18/10 – s7) | `Phòng 202,203,204`, `Phòng 202 203 204` – danh sách không có khoảng trắng sau dấu phẩy, hoặc chỉ cách bằng khoảng trắng |
| Hotline công khai của cơ sở | `CCCD 079123456789`, `079 123 456 789 đ`, `Hộ chiếu C1234567`, `C1234567đ` – số giấy tờ |
| | `Ngày sinh 05-03-1990`, `05.03.1990` – ngày ngoài ±1 năm; `31-02-2026` – ngày không có thật; `Mã 18.10.26` – năm 2 số |
| | `giá 350.000` – thiếu đơn vị; `12.345.678.901đ` – quá 10 chữ số |

- **Chặn nhầm SEC chấp nhận** (lễ tân viết lại theo câu nhắc): `350.000 đến 450.000đ` (số đầu thiếu đơn vị), `350.000 dong`, `350.000d`, `VND 350.000` (đơn vị đứng trước), ngày ISO `2026-10-18`, giá lẻ không tròn nghìn từ 6 chữ số, ngày ngoài ±1 năm.
- **Rủi ro SEC chấp nhận**: luật chống lộ **do vô ý**, không chống người cố ý (viết số bằng chữ, dùng `/`, mã đuôi `000` kèm "đ", mã viết kiểu danh sách `482, 913`). Hộ chiếu chữ–số không bị bắt ở `replyNote`. Dấu vết còn ở `closed_by` và lịch sử SM-15.
- Desk – câu nhắc dưới ô `replyNote` phải nói đủ 3 ý: không ghi mã cửa, số giấy tờ, số điện thoại; **ghi giá kèm đ/VND** (ví dụ 350.000 đ); **nhiều căn thì cách nhau bằng dấu phẩy** (ví dụ 202, 203). Câu chữ do UXD viết (E14-13). Lỗi `SENSITIVE_DATA_DETECTED` hiện dưới ô, giữ nguyên nội dung đã gõ.

Việc HK liên kết bị **hủy** (ví dụ khách từ chối dọn) → yêu cầu **không** tự đổi; FD thấy chip **(mới)** `req.linked_cancelled` "Việc liên quan đã hủy – trả lời khách" và chọn: `decline` (từ `new`/`acknowledged`, hoặc từ `in_progress` theo cạnh v0.3 ở trên) hoặc `complete`. Cả hai đường **không** ghi phí (mục 4.5).

Trả muộn (`late_checkout`): lễ tân xử lý bằng `setLateCheckout` (EP03-05 4.2 – phụ thu do lễ tân xác nhận, BR-414) rồi `complete` yêu cầu với `replyNote` nêu giờ trả đã duyệt.

### 4.5 Phí dọn theo yêu cầu – lúc ghi folio (BR-506 bản 18/10 – S4-07; v0.3)
Áp cho yêu cầu có `feeVndSnapshot > 0` (khách đã đồng ý phí khi gửi – mục 3.2; loại có phí theo BR-506). Phí tính theo **việc HK đã làm xong**, không theo lúc lễ tân đóng yêu cầu. DOM đã xác nhận (s1), (s2) trong `business-rules.md` BR-506 (18/10).
- **Yêu cầu có việc HK liên kết**: SYS ghi dòng folio `adhoc_cleaning` (A30 SYS) **một lần**, lúc việc HK `done`, kể cả khi lễ tân đã `complete` yêu cầu trước đó. `complete` của lễ tân **không bao giờ** ghi phí cho yêu cầu này.
- **Việc HK bị hủy** → **không** thu, dù lễ tân đóng yêu cầu bằng `complete` hay `decline`.
- **Yêu cầu bị `declined`** → không thu (việc HK còn `open` bị hủy cùng lúc – mục 4.4).
- **Yêu cầu không có việc liên kết** (cổng việc HK chưa gắn, hoặc khách gửi khi đơn chưa có căn): phí ghi lúc `complete` (lễ tân; HK/MT được `complete` yêu cầu loại này – mục 4.4). `complete` nghĩa là lễ tân xác nhận đã dọn xong; không dọn thì `decline`.
- Số tiền = `feeVndSnapshot` lúc khách gửi. Mỗi yêu cầu tối đa **một** dòng phí (`feeFolioLineId` chỉ ghi một lần).
- Folio đã đóng (sau cửa sổ sau trả phòng) → không ghi được dòng; yêu cầu vẫn đóng; lễ tân thu tay (ghi nhật ký, không chứa dữ liệu khách).
- Ghi sai hoặc khách khiếu nại → lễ tân đảo dòng có lý do (BR-008).

| Tình huống (yêu cầu "Dọn thêm" có phí) | Phí ghi folio |
|---|---|
| HK dọn xong → yêu cầu tự `done` | 1 dòng, lúc việc `done` |
| Lễ tân `complete` lúc 15:00 khi việc còn `open`; HK dọn xong 16:00 (ví dụ BR-506 S4-07) | 1 dòng, lúc **16:00** |
| Lễ tân `complete` khi việc còn `open`; sau đó việc bị hủy | 0 |
| Việc bị hủy (khách từ chối dọn); lễ tân `complete` hoặc `decline` | 0 |
| HK dọn xong rồi lễ tân bấm `complete` | 409 `INVALID_TRANSITION` (yêu cầu đã `done`); vẫn 1 dòng |
| Không có việc liên kết; lễ tân `complete` | 1 dòng, lúc `complete`; `complete` lần hai → 409 |
| Lễ tân `decline` | 0 |

Khóa ghi (ARC 16.19 bổ sung 3 – BE-D 7.2): đường nào ghi phí thì giữ folio trước rồi mới giữ việc HK và yêu cầu; `decline` và `complete` có việc liên kết không ghi phí nên không giữ folio. Chi tiết thuộc ARC.

---

## 5. Ngôn ngữ (US-112)
- Mặc định (AC2): ngôn ngữ hồ sơ khách (`preferredLocale`); không có → trình duyệt (`en*` → EN, còn lại VI). Chọn tay ở đầu mọi trang (`guest.lang`) → `setGuestLocale` → ghi theo phiên/đơn. RU: `guest.lang.ru_soon`, hiện EN (R3 – US-115).
- Mọi chữ trên trang – menu, nút, lỗi, trạng thái yêu cầu, trả lời tự động, lý do từ chối – lấy từ `strings-{vi,en}.json` (AC1); không còn chuỗi VI cố định. Văn bản do server dựng (`houseRules`, `autoReply`, `statusLabel`, nhãn lý do từ chối) theo `locale` của phiên.
- Chuỗi pháp lý (thông báo xử lý dữ liệu, đồng ý, nội quy, chính sách) dùng bản EN **đã duyệt** theo content-guide (AC3, HR-01) – không dịch máy. Nội quy kèm phí là văn bản pháp lý-nghiệp vụ → UXD + DOM duyệt bản EN.
- Câu trả lời tự do của lễ tân (`replyNote`, `declinedNote`): hiện nguyên văn; Desk nhắc **(mới)** `req.reply_lang_hint` "Khách dùng {language} – viết câu trả lời bằng {language}." theo `locale` của phiên khách.

---

## 6. Trạng thái màn (DoD)
| Màn | Đang tải | Rỗng | Lỗi | Mất mạng |
|---|---|---|---|---|
| Lưu trú | Khung xương | – | `guest.error_*` | Bản cache SW + `guest.offline_banner` |
| Yêu cầu | Khung xương | `guest.req.empty` | `guest.error_*` | Banner; nút gửi khóa |
| Thông tin | Khung xương | – | `guest.error_*` | Bản cache SW |
| Trang căn (QR) | – | – | `guest.error_*` | Banner |

---

## 7. Truy vết story → mục (AC Must R2 theo R-C)
| Story / AC | Mục |
|---|---|
| US-106 AC1 | 1.1, 1.2; EP06 8.2 |
| US-106 AC2 | 1.1, 2.2 (khóa ngay khi trả phòng; R2 không có ân hạn bill) |
| US-106 AC3 | **Dời R3** (US-141) – ĐK-1 |
| US-108 AC1 | 2.1 |
| US-108 AC2 (phần Wi-Fi) | 2.2; phần mã cửa **Dời R3** |
| US-109 AC1–AC2 | 3, 4.4, 4.5 (phí BR-506) |
| US-110 AC1–AC3 | 4.1–4.3 |
| US-112 AC1–AC3 | 5 |

---

## 8. Đề nghị hợp đồng cho ARC (OpenAPI 0.3.4 → 0.3.5) và vai khác
| # | Gửi | Nội dung |
|---|---|---|
| E14-01 | ARC | Thu hồi mọi `guest_access_token` của đơn khi đơn `cancelled`/`no_show` (B5, B10, B11) trong cùng giao dịch – để link đơn hủy ra trang "hết hạn" thay vì hiện thông tin đơn hủy; ghi rõ ở `openGuestSession` |
| E14-02 | ARC | Mã trường `REQUEST_TYPE_NOT_AVAILABLE` (422) cho `createGuestRequest` (loại không dùng được với trạng thái đơn – mục 3.1); `note` bắt buộc theo loại (mục 3.2) → `REQUIRED` |
| E14-03 | ARC → **SEC (ĐK-2)** | `transitionGuestRequest`: `declinedReasonCode` enum (`fully_booked`, `out_of_hours`, `not_offered`, `other`) + `declinedNote`; `complete` nhận `replyNote` (≤ 300, V-09). `GuestRequestForGuest` thêm `declinedReasonCode`, `replyNote` (văn bản do nhân viên viết cho chính khách – không chứa dữ liệu người khác); bỏ `declinedReason` tự do khỏi phía khách. **BE không cài khi SEC chưa duyệt** |
| E14-04 | ARC | **Thay bằng ARC B-16** (`listGuestRequestOptions` + `feeAccepted` – không thêm trường vào `GuestStay`). Nội dung cũ: `createGuestRequest`/`GuestStay`: trả phí dọn lẻ hiện hành (`feeVnd` theo loại, chỉ khi áp dụng – BR-506) để guest-web hiện `guest.req.fee_notice` không cần đọc bảng tham số. Là giá công khai (C0) – vẫn báo SEC theo ĐK-2 vì thêm trường vào `GuestStay` |
| E14-05 | ARC | `AttentionItem.kind` thêm `guest_request_overdue` (yêu cầu quá hạn trả lời – US-110 AC2, BR-811) |
| E14-06 | UXD | Chuỗi **(mới)** trong tài liệu (VI/EN); sửa `guest.req.reply_time` (giờ trực lấy tham số), `guest.req.fee_notice` (R2 không có hóa đơn trên app); thanh điều hướng 3 mục (ĐK-6); bỏ khối "Mã cửa" khỏi trang Lưu trú R2, thay `guest.stay.door_at_desk` |
| E14-07 | DOM | **Đã trả lời** (s2-DOM D-13; áp 16/10 Sprint 2; (b) còn chờ INV). Nội dung cũ: Xác nhận: (a) 3 loại yêu cầu lễ tân dùng được trước ngày đến (3.1); (b) phí dọn thêm cho khách ngắn ngày (3.2); (c) hạn trả lời yêu cầu gửi ngoài giờ trực (4.3); (d) phí dọn lẻ ghi folio tự động khi việc xong (4.4) |
| E14-08 | SEC | Danh sách tên miền bản đồ cho `mapUrl` (2.1); xác nhận guest-web không cache `listMyRequests` (0, ĐK-3) |
| E14-09 | QA | Test ĐK-2 cho `GuestStay` và `GuestRequestForGuest` (danh sách khóa được phép); ca giờ trực 06:59/07:00/21:59/22:00 (BR-811); link đơn A không đọc đơn B; sau B18 gửi yêu cầu → 403; QR trang căn không lộ đơn (cùng phản hồi 202 cho mã đúng/sai) |
| E14-03 | – | **Đã áp** (0.3.6 B-15, 0.3.7): enum `not_available_now`, `outside_service_hours`, `needs_front_desk`, `duplicate`, `other` + `replyNote` (SEC duyệt ĐK-2 16/10) – mục 4.4 |
| E14-10 | PO/OWN (qua ORC) | Nhập `property.phone_public` (hotline công khai) trước khi chạy thật – thiếu thì câu trả lời tự động mất câu "gọi {phone}" và `replyNote` không ghi được hotline (4.3); UXD cân nhắc biến thể có câu thay thế ("nhắn Zalo OTTIMO") nếu OWN không muốn công khai số |
| E14-11 | QA | Ca 4.4: từ chối `other` không `replyNote` → 422; **(sửa v0.3)** luật B-15: mọi ví dụ của bảng "Không bị chặn / Bị chặn" mục 4.4 (gồm 5 ca SEC thêm 18/10: `Phòng 202, 203, 204`, `Phòng 202; 203` nhận; `Phòng 202,203,204`, `Phòng 202 203 204`, `Mã cửa 482,913` chặn; và `0912.345.000đ` chặn) qua HTTP `complete` và `decline`; `note` của khách có 6 chữ số liền → **không** bị chặn; có hotline → nhận; khách VI/EN thấy đúng nhãn 5 mã; ca 4.3 cơ sở không có `phone_public` → câu trả lời 2 câu |
| E14-12 | QA | **(mới v0.3)** Ca 4.5 phí BR-506: đủ 7 dòng bảng tình huống (số dòng `adhoc_cleaning` và thời điểm ghi); ca 4.4 `in_progress → declined`: việc HK đã hủy → 200, việc đang làm → 409 và việc **không** bị hủy, yêu cầu gắn phiếu sửa → 409. BE-D đã có ca tương ứng ở `guest-requests-s4-fix-bed.test.ts` – QA đưa vào bộ hồi quy E2E |
| E14-13 | UXD | **(mới v0.3)** Câu nhắc Desk dưới ô `replyNote` đủ 3 ý (mục 4.4): không ghi mã cửa/số giấy tờ/số điện thoại; ghi giá kèm đ/VND, ví dụ 350.000 đ; nhiều căn thì cách nhau bằng dấu phẩy, ví dụ 202, 203. Kèm câu lỗi `SENSITIVE_DATA_DETECTED` gợi đúng cách viết. Giọng văn OTTIMO (brand guideline); FE-B đồng bộ mock `admin-web/src/mocks/ops.ts` |
| E14-14 | ARC | **(mới v0.3)** (a) Xác nhận giả định (s5) cạnh `in_progress → declined` khi việc HK liên kết đã hủy (mục 4.4, SM-15) và chữ ký cổng `taskStatus` (s4); (b) cập nhật mô tả `transitionGuestRequest` và `replyNote` trong `openapi.yaml` (SEC C.6 nêu dòng 281, 7538) theo luật B-15 mục 4.4 và lúc ghi phí mục 4.5. ARC sửa khác thì BA sửa lại mục 4.4 |

## 9. Lịch sử thay đổi
| Ngày | Round | Thay đổi | Người |
|---|---|---|---|
| 16/10/2026 | 2 (Sprint 2) | Bản đầu: guest-web mức 1 R2 – mở trang (link/QR), thông tin lưu trú (Wi-Fi theo khung, không mã cửa), yêu cầu khách + định tuyến + xử lý phía nhân viên, tiếng Anh; áp ĐK-1…6; đề nghị E14-01…09 | BA |
| 16/10/2026 | 2 (Sprint 2 – phản hồi) | Áp DOM D-13 (3 loại trước ngày đến; phí dọn thêm ngắn ngày – chờ INV; `report_issue` ngoài giờ báo ngay; phí ghi folio tự động), D-15 (loại có phí); ARC B-14, B-16 (`listGuestRequestOptions`, `feeAccepted`) – FB-R2-DOM-BA-01 | BA |
| 17/10/2026 | 2 (Sprint 4 – theo UXD `s4-UXD.md` mục E "Ghi chú cho BA" và OpenAPI 0.3.7) | v0.2: **4.4** mã lý do từ chối theo enum 0.3.7 (`not_available_now`, `outside_service_hours`, `needs_front_desk`, `duplicate`, `other`) kèm câu khách thấy VI/EN, `replyNote` bắt buộc khi `other` và quy tắc kiểm server (`SENSITIVE_DATA_DETECTED`…), bỏ khóa nháp `fully_booked`/`out_of_hours`/`not_offered`; **4.3** câu trả lời tự động lấy theo `guest.req.auto_reply` mới (tham số `{time}`, `{open_time}`, `{phone}`; thiếu hotline → bỏ câu gọi); **3.3** `declinedReasonCode`, `replyNote`, `feeVnd` thay `declinedReason`. (UXD gọi "EP14 3.4 bảng hành động" – bảng hành động thực tế ở mục 4.4.) E14-03 đã áp; thêm E14-10, E14-11 | BA |
| 18/10/2026 | 2 (tuần Ổn định – Phản hồi & sửa; theo `outputs/BE/s4-be-d.md` mục 7, `reviews/s4-SEC.md` C.6 + bổ sung 18/10, `business-rules.md` BR-506 18/10) | v0.3: **4.4** thêm cạnh `in_progress → declined` chỉ khi việc HK liên kết đã `cancelled` (ARC S4-07; giả định (s5) ARC đang xác nhận – E14-14), bổ sung lỗi 409/403 tương ứng, cạnh tự động `→ done` ghi rõ trạng thái nguồn; viết lại **luật B-15** của `replyNote` theo SEC V2: câu luật, 5 bước kiểm, bảng ví dụ chặn/không chặn, chặn nhầm và rủi ro SEC chấp nhận, gồm SEC bổ sung 18/10 (giữ chặn `0912.345.000đ` – s6; nới danh sách `Phòng 202, 203, 204` – s7); phạm vi chỉ `replyNote`, `note` của khách không qua luật; **4.5 mới** lúc ghi phí BR-506 theo việc HK đã xong (DOM xác nhận (s1), (s2) – không còn nhãn chờ); 3.2 trỏ 4.5; sửa E14-11, thêm E14-12…E14-14 | BA |
