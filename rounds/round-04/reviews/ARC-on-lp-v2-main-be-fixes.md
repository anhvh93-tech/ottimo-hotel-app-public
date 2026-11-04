# ARC review nhanh: 2 commit sửa của BE trên `lp-v2-main` (QC G3 phần ARC)

- Người review: ARC | Ngày 04/11/2026 | Round 4 – gói LP-v2 – Bước **Review** (ma trận BE → ARC + QA; QA đã kiểm `2760744b`)
- Đối tượng: `origin/lp-v2-main` @ `4fe85e19`. Commit: **`2760744b`** (hằng cổng Chat + `isCalendarDate` trên route công khai) và **`4fe85e19`** (test BUG-R4-027).
- Cách làm: chỉ đọc (`git show`, đọc mã trên nhánh). Không checkout, không chạy test, không commit. Không có dữ liệu khách, khóa hay bí mật trong tệp này.

## 1. Kết luận

**ĐẠT. 0 thẻ mới.** Hai commit đúng kiến trúc, không đổi hợp đồng API, không đổi lược đồ DB. Không cần báo FE/MOB/INT.

## 2. Đã kiểm

| # | Điểm | Kết quả |
|---|---|---|
| 1 | `chat-message.ts`: `CHAT_DETAILS_MIN_NOTICE_VERSION = '2026-11-04'` | Đạt. Vẫn là hằng trong mã, không đọc từ `.env` (test tĩnh `gchat-units` giữ). Chú thích ghi rõ lý do P4 và quy tắc "nhãn không bao giờ đăng thì cổng đóng" |
| 2 | Cổng ★2 `effectiveLevel` + `CHAT_NOTICE_GATE_SQL` | Đạt. Không đổi: so `published_at` của dòng mang nhãn hằng (`min(...) WHERE version = $2`) với `published_at` của đúng (version, locale) của yêu cầu. Không có phép so chữ version. Thiếu một trong hai mốc → A, `capped`. Fail-closed |
| 3 | `shared/time.ts` `isCalendarDate` | Đạt. Regex `LOCAL_DATE` có neo `^…$`, rồi dựng lại ngày bằng `toISOString().slice(0,10)` và so chuỗi. Kiểu `unknown` → không cần `typeof` riêng ở nơi gọi. Test bao các ngày sai (02-31, 02-29 năm thường, tháng 13, ngày 00, thiếu số 0, khoảng trắng đầu, số, `null`) |
| 4 | Nơi dùng `isCalendarDate` | Đạt. `parseEstimateQuery` (route giá) và form website (`arrival`, `departure` – trước đây `departure` chỉ kiểm regex). Lỗi trả `422 VALIDATION_FAILED` trên đúng trường – mã lỗi đã có trong hợp đồng 0.3.11, không cần đổi OpenAPI |
| 5 | `assertLocalDate` giữ nguyên | Đồng ý. Hàm này dùng ở `ParameterService` và các hàm giờ nội bộ; đổi sẽ biến ngày sai thành `RangeError` → 500 ở API nội bộ. Để v1.0.x như SEC đề xuất (SEC-LPV2M-05 phần còn lại) |
| 6 | `env.production.example`, README 13.4 | Đạt. Câu "older than 2026-11-04 (first published notice naming Google Chat)" khớp mã |
| 7 | `4fe85e19` – 4 ca unit + 1 ca tích hợp | Đạt. Mỗi ca cho kết quả **khác nhau** giữa "so `published_at`" và "so chữ version", nên chặn đúng bẫy ngược SEC nêu ở LPV2M-01. Ca tích hợp dùng cả ko và en, `levelCapped = 3`, kiểm không có tên khách và ngày đến trong tin. BE ghi đột biến đã bị bắt (5 ca đỏ; ca tích hợp đỏ với `version >= $2`) – QA chạy lại ở G2 |
| 8 | Ca "nhãn `2026-11-03` đăng **sau** hằng → C" | Ghi nhận, đúng thiết kế: cổng mở "từ thông báo hằng trở đi theo giờ đăng". Ràng buộc "thông báo sau bỏ Google Chat thì phải hạ mức trước khi đăng" (SEC FB-R3-SEC-BE-GCHAT-03) vẫn nằm ở quy trình, không ở mã – như cũ |
| 9 | Phạm vi commit | `2760744b`: 10 tệp (6 mã/tài liệu api + infra, 4 test). `4fe85e19`: 2 tệp test + 1 dòng review BE. Không chạm migration, OpenAPI, client sinh, Desk |

Ghi nhận ngoài phạm vi (không thành thẻ): nhánh honeypot của form (`public-booking.service.ts`, bước 5) vẫn dùng regex `DATE` để chọn ngày cho câu hẹn trả lời. Nhánh này cố ý trả 202 giống hệt trước mọi kiểm (ARC-15), nên một ngày sai ở đó không đổi hành vi nhìn thấy được. Không cần sửa.

## 3. Điểm làm tốt
- Sửa đúng gốc (hằng = nhãn thật sẽ đăng) thay vì "sửa" bằng phép so chuỗi, và có test chứng minh bằng đột biến rằng bản so chuỗi sẽ đỏ.
- `isCalendarDate` tách thành hàm dùng chung có kiểu `v is LocalDate`, không vá rải rác ở từng route.
