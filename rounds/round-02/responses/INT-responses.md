# INT – Trả lời feedback Round 2

| Thẻ | Mức | Trả lời | Chi tiết |
|---|---|---|---|
| FB-R2-SEC-INT-01 | Major | Accepted – đã sửa (Đợt 0) | Tầng B `fieldKinds` + Luhn + IIN + độ dài; `requiredKeys` → `attention[]` `card_suspect`; `droppedByRule` cho nhãn `rule`. Đủ test bắt buộc. Xem `rounds/round-02/outputs/INT/d0-report.md` |
| FB-R2-SEC-INT-02 | Major | Accepted – đã sửa | Tầng A quét mọi cửa sổ 13–19 số; 3 chuỗi đỏ của SEC thành test |
| FB-R2-SEC-INT-03 | Minor | Accepted – đã sửa | Số nguyên vượt `MAX_SAFE_INTEGER` bị xóa; `bigint` kiểm chữ số thật |
| FB-R2-SEC-INT-04 | Minor | Accepted – đã sửa | `env:<NHÓM>` trơn → `CONFIG` |
| FB-R2-SEC-INT-05 | Suggestion | Accepted – đã làm | (a) không phân biệt hoa thường; (b) cấm VNPay/MoMo `production` ngoài production |

## Round 2 – Bước 4 sau cổng QC (R-2): thẻ SEC `reviews/landing-zalo-SEC.md` (21/10/2026)

- Bối cảnh: thẻ review **tài liệu thiết kế** `product/docs/integrations/zalo-oa.md` v0.1. Chưa có mã gọi Zalo thật (ESC-021 A: tự gửi ở R3 – US-126 Sprint 1 giả lập, Sprint 2 nối thật). Toàn bộ yêu cầu SEC đã đưa vào thiết kế: **`zalo-oa.md` v0.2 mục 4.12** (A…G, thắng các mục cũ nếu lệch). Phần cài đặt cần tài khoản Zalo/OAuth/webhook thật → Deferred R3 có dòng backlog; phần làm được ngay, không chạm mã tiền → đã cài kèm test.
- Mã mới: `product/integrations/notification/zalo-policy.ts` + `zalo-policy.test.ts` (12 test; gói `@ottimo/integrations` 151/151 xanh, `tsc --noEmit` sạch). Không đụng mã tiền phía server.
- Các điều kiện [CHẶN] C-4…C-9 của SEC **vẫn giữ nguyên** tới khi cài xong và SEC xác nhận; trả lời này không gỡ chặn nào.

| Thẻ | Mức | Trạng thái | Chi tiết |
|---|---|---|---|
| FB-R2-SEC-INT-07 | Major [C-4] | **Deferred → R3-Q40** (thiết kế Done) | Thứ tự webhook (64 KB + 300/phút → chữ ký trên byte thô `timingSafeEqual` → `app_id`/`oa_id` → `timestamp` [now−3h, now+5′] → `inbox_message` khóa duy nhất → 200), 401 không chi tiết + SR-LOG-06, webhook không ký chỉ là tín hiệu + `queryStatus`, log chỉ `event_name`/kết quả/`request_id`, `ZALO_OA_SECRET_KEY_FILE`, 4 ca mock: `zalo-oa.md` 4.12-A, 4.11. Lý do hoãn: công thức/dạng header chữ ký cần xác minh trên tài liệu Zalo và thử với OA thật (không bịa); webhook chỉ bật ở US-126 Sprint 2. Hạn: R3 Sprint 2, **trước khi bật webhook Zalo** |
| FB-R2-SEC-INT-08 | Major [C-5] | **Deferred → R3-Q41** (thiết kế Done) | `CryptoService` AES-256-GCM + AAD, `INTEGRATION_TOKEN_KEK_FILE`, kiểm khởi động khi `ZALO_PROVIDER=zalo`, OAuth chỉ OWN + xác nhận lại mật khẩu, `state` 256 bit gắn phiên 10′ + PKCE S256, từ chối OA ≠ `ZALO_OA_ID`, quy trình làm mới không dùng lại refresh token cũ, host cố định + timeout 15″, bí mật dạng `_FILE`: `zalo-oa.md` 4.12-F, 4.11 (đã đổi tên biến). Lý do hoãn: cần App Zalo + OA đã xác thực của INV và bảng `integration_credential` (BE/ARC); trùng US-126 AC1. Hạn: R3 Sprint 2, **trước khi kết nối Zalo thật** |
| FB-R2-SEC-INT-09 | Major [C-6] | **Accepted quyết định SEC 17/10** (decision-log 17/10 "token thông báo") – thiết kế Done; cài đặt **Deferred → US-161 AC5 + R3-Q42** | L-1 của INT bỏ; `zalo-oa.md` 4.8 đánh dấu thay thế, 4.12-B ghi đủ 8 điểm SEC (worker không cấp/thu hồi token chính; `purpose=notify` mức 1; ≤ 1 token thông báo/đơn, tổng ≤ 3; token gốc chỉ trong bộ nhớ; chỉ gửi link tới liên hệ đã xác nhận; audit mỗi lần cấp). Lý do hoãn: cần BE (cấp token `notify`) và ARC sửa ADR-006 điểm 4 – R3 Sprint 1 cùng US-161. Hạn: R3 Sprint 1, **trước khi gửi tin tự động có link** |
| FB-R2-SEC-INT-10 | Major [C-7] | **Done** (lớp kiểm + test); gắn vào lõi theo US-126 AC4 (đã có trong backlog) | `zalo-policy.ts`: `checkTemplateVariables(templateKey, channel, params)` – bảng cho phép theo mẫu **và** kênh cho 8 mẫu, danh sách cấm (mã cửa, mã xác minh, số/ảnh giấy tờ, ngày sinh, số căn/tên phòng, Wi-Fi, token), tiền chỉ ở mẫu bill/thanh toán, mẫu lạ bị chặn; trả `TEMPLATE_VAR_REJECTED` (lõi → 422), không lặp giá trị. `room_name` → `room_type_name`. Câu cuối 3.1 sửa đúng chữ SEC. Test: snapshot khóa 8 mẫu + 10 ca biến cấm × 2 kênh (`zalo-policy.test.ts`) |
| FB-R2-SEC-INT-11 | Major [C-8] | **Deferred → R3-Q43** (thiết kế Done) | Nhận câu trả lời Q8 của SEC: Tag 1/2 theo thực hiện thỏa thuận; Tag 3/voucher chỉ khi `consent_record` P06 của chính người nhận, follow OA không thay được, không gửi khách OTA; từ chối qua `-139/-141`, token hủy đăng ký HMAC riêng, lễ tân tắt: `zalo-oa.md` 4.7 (sửa), 4.12-D. Lý do hoãn: tin marketing chỉ có ở US-116(b) R3 Sprint 2–3, cần US-077 (đồng ý) và trang hủy đăng ký. Câu NĐ 91/2020 + dự thảo OTT vào ESC-001: việc SEC/ORC (không mở ESC mới). Hạn: **trước tin marketing đầu tiên** (R3 Sprint 3) |
| FB-R2-SEC-INT-12 | Major | **Done** (phần INT – quyết định SEC 17/10, decision-log 17/10 "Chat OA") | Không có mã. `zalo-oa.md` 1.4/4.9 sửa: OA Manager bản web trên máy cơ sở, hồ sơ trình duyệt riêng; mini app điện thoại cá nhân chỉ OWN/MGR; 4.12-E ghi đủ 7 quy tắc (mỗi người một tài khoản, gỡ quyền trong ngày, không nhận ảnh giấy tờ…). Việc của vai khác (không phải INT): SEC sửa SR-DEV-07/08; ORC tóm tắt điều kiện vào ESC-021 (cùng SEC-INT-13); DOM/UXD đưa vào hướng dẫn vận hành lễ tân → đề nghị PO gộp vào R3-Q44 |
| FB-R2-SEC-INT-14 | Major [C-9] | **Done** (điểm 2, 3, 4) + **Deferred điểm 1 → R3-Q45** | Điểm 2: `toZaloIntegrationLog` – `integration_log` Zalo chỉ `templateKey`, kênh, mã lỗi, `msg_id`, thời gian, `cost_units`; SĐT, `template_data`, token, body bị bỏ theo cấu trúc (test có chuỗi rò). Điểm 3–4: giữ `notification_delivery` không SĐT/nội dung, cờ "không có Zalo" trên hồ sơ khách (4.12-G). Điểm 1 (tên pháp nhân, nơi lưu, vai bên xử lý theo điều khoản ZBS): danh sách trường gửi đi đã có (4.12-C); tên pháp nhân/điều khoản chỉ đọc được khi INV tạo tài khoản ZBS – hạn: **trước khi gửi tin tự động** (R3 Sprint 2), SEC cập nhật DRA P11 sau đó |

### Dòng backlog R3 đề nghị PO thêm (mục 5.5, sau R3-Q39)
| Mã đề nghị | Nội dung | Vai | Ưu tiên / hạn | Thẻ |
|---|---|---|---|---|
| R3-Q40 | Webhook Zalo theo `zalo-oa.md` 4.12-A (chữ ký byte thô, `oa_id`, cửa sổ thời gian, chống lặp, không log body, 4 ca mock) | INT + BE, SEC review | Must – trước khi bật webhook (US-126 Sprint 2) | SEC-INT-07, C-4 |
| R3-Q41 | Kết nối Zalo OA: `integration_credential` mã hóa `CryptoService`, OAuth `state`+PKCE, kiểm `oa_id`, làm mới an toàn, bí mật `_FILE`, kiểm khởi động `ZALO_PROVIDER=zalo` | INT + BE + ARC, SEC review | Must – trước kết nối thật (US-126 AC1) | SEC-INT-08, C-5 |
| R3-Q42 | Token thông báo `purpose=notify` (4.12-B) + ARC sửa ADR-006 điểm 4 (≤ 3 token/đơn) + cờ "liên hệ đã xác nhận" | BE + ARC, SEC review | Must – R3 Sprint 1 cùng US-161 AC5 | SEC-INT-09, C-6 |
| R3-Q43 | Tin marketing Zalo: điều kiện `consent_record` P06, token hủy đăng ký HMAC + trang `g.`, chặn khách OTA | BE + INT + FE, SEC review | Must trước tin marketing đầu tiên (US-116(b)) | SEC-INT-11, C-8 |
| R3-Q44 | Hướng dẫn vận hành chat OA cho nhân viên (4.12-E) + SEC sửa SR-DEV-07/08 | DOM + SEC (UXD biên tập) | Should – trước khi lễ tân chat OA với khách thật | SEC-INT-12 |
| R3-Q45 | Thông tin bên nhận dữ liệu Zalo/VNG (pháp nhân, nơi lưu, vai) từ điều khoản ZBS → SEC cập nhật DRA P11 + thông báo xử lý dữ liệu | INT → SEC (luật sư – ESC-001) | Must – trước gửi tin tự động | SEC-INT-14, C-9 |

- Phần gắn `checkTemplateVariables` vào lõi đã nằm trong US-126 AC4 – không cần dòng mới.
