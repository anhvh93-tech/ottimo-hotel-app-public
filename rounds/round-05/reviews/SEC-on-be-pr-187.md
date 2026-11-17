# SEC review – PR #187 BE (FB-INV-011: tỷ giá bán Vietcombank, OWN ghi đè, khối `fx` của monthly-rates)

- Round 5 – Review (rút gọn). Head đọc: **`4d16f043`** (`gh pr diff 187`).
- Phạm vi: `fx-rates.ts`, `fx-refresh-job.ts`, `worker-jobs.ts` (2 file), `public-site.module.ts` (hook), `price-estimate.service.ts` (DTO), migration `0098`, `.env.example`, `openapi.yaml`, 2 file test. Đối chiếu thứ tự kiểm quyền ở `platform/internal/parameters.service.ts` tại cùng SHA.
- Gitleaks đỏ do nhánh FE cũ – không tính cho PR này (theo ORC).

## 1. Kết quả theo hạng mục ORC giao

| Hạng mục | Kết quả | Bằng chứng |
|---|---|---|
| SSRF / URL cố định | Đạt | `VIETCOMBANK_FX_URL` là hằng, không đọc từ env hay tham số. `fetchVietcombankXml` từ chối mọi thứ khác `https:` + đúng host `portal.vietcombank.com.vn` + cổng rỗng, trước khi gọi mạng. `redirect: 'error'` nên không có chuyển hướng sang host nội bộ. Env `FX_RATES_FETCH` chỉ bật/tắt (`vietcombank`/`off`, giá trị lạ dừng khởi động). API đăng ký job với mode `off`, chỉ worker gọi ra ngoài |
| XXE / billion laughs | Đạt | Không dùng thư viện XML, không bung thực thể. Từ chối `<!DOCTYPE`, `<!ENTITY`, `<!ELEMENT`, `<!ATTLIST`, CDATA, PI ngoài prolog, và mọi tham chiếu thực thể ngoài 5 thực thể chuẩn và thực thể số. Thực thể số không được giải mã, nên `&#85;SD` không lọt allowlist |
| Kích thước / timeout | Đạt | Trần 64 KiB được kiểm ở 3 chỗ: Content-Length khai báo, đếm byte khi đọc luồng (Content-Length sai hay thiếu cũng không lọt), và `parseVietcombankXml` kiểm lại. `AbortSignal.timeout(10 s)` phủ cả lúc đọc thân |
| ReDoS | **Minor** (thẻ 01) | Regex thuộc tính bị bậc hai: đo được khoảng 3,1 s CPU với một thẻ `<Exrate …/>` dài 64 KiB. Các regex còn lại tuyến tính hoặc rẻ: số (anchored), ngày, thực thể, `<Exrate\s([^<>]*?)\/>` đều khoảng 0 ms; gốc `<ExrateList>` lặp 5.000 lần khoảng 130 ms |
| Allowlist / dải hợp lý | Đạt | 4 mã. Mã khác bị bỏ qua, mã trùng thì từ chối, thiếu mã thì từ chối. Dải theo mã được dùng chung cho nguồn tự động, cho OWN ghi đè và khi đọc lại hàng đã lưu (`readAutoValue`). Khóa `__proto__` trong JSON ghi đè bị trả `NOT_ALLOWED` |
| Lộ dữ liệu nội bộ | Đạt | `publicFxDto` dựng từng trường: `base` cố định, `source` chỉ có 2 giá trị, `asOf`, `rates` chỉ gồm mã allowlist có số dương hữu hạn. Không trả `publishedAt`, `reason`, người ghi hay hiệu lực của ghi đè. Không có PII |
| Phân quyền `fx_rates.vietcombank` | Đạt | `edit_roles {owner}`. `set()` kiểm vai trước (403), sau đó hook `before` ném `FORBIDDEN_ACTION` cho mọi vai, kể cả OWN. Test tích hợp xác nhận 403 và đúng 1 dòng `access.denied`. Worker ghi thẳng `config_parameter` (không qua setParameter) |
| Phân quyền `fx_rate_overrides` | Đạt | Chỉ OWN (403 đi trước hook, đúng ghi chú "403 comes first" ở `parameter-hooks.ts`). Hook dùng 422 `NOT_ALLOWED` / `PARAM_OUT_OF_RANGE` kèm `min`/`max`. Mã lạ được cắt còn 20 ký tự trước khi dội lại trong lỗi |
| Log | Đạt | Lỗi chỉ ghi `code`, `ownWarned`, `storedAsOf`. Không ghi thân phản hồi, `err.message` hay URL có tham số. Ghi thành công chỉ có `asOf`. `FxSourceFailure` chỉ mang mã lỗi |
| Cảnh báo OWN không spam | Đạt | Một mục `data_quality` mở tại một thời điểm. OWN đã đóng thì không có mục mới trước ngày địa phương kế tiếp. Lần lấy được tiếp theo tự đóng. Thử lại tối đa 1 lần/giờ (sau 07:30), nên mỗi ngày có tối đa khoảng 17 dòng log `warn`, chấp nhận được |

## 2. Thẻ feedback

### FB-R5-SEC-BE-187-01
- Mức độ: Minor
- Vị trí: `product/services/api/src/modules/public-site/public/fx-rates.ts`, `parseVietcombankXml`, regex thuộc tính `/([A-Za-z]+)="([^"<>]*)"/g`
- Vấn đề: Regex này bị bậc hai khi một thẻ `<Exrate` chứa một dãy chữ dài không có `="`. Ở mỗi vị trí bắt đầu, `[A-Za-z]+` ăn hết dãy chữ rồi lùi dần. Đo trên Node, nội dung `<ExrateList><DateTime>…</DateTime><Exrate ` + 65.000 chữ `a` + `/></ExrateList>` (dưới 64 KiB, qua mọi kiểm tra đánh dấu): regex thẻ mất 0 ms, regex thuộc tính mất **3.128 ms**.
- Vì sao quan trọng: Event loop của worker bị chặn khoảng 3 s mỗi lần thử, tối đa 1 lần/giờ, trong khi giao dịch DB đang mở. Chỉ xảy ra khi phản hồi TLS từ đúng host Vietcombank bị làm độc (host bị xâm nhập, hoặc trang lỗi trả HTML/XML lạ có `text/xml`). Khả năng thấp, tác động giới hạn ở worker, API công khai không bị ảnh hưởng. Vì vậy chỉ ở mức Minor, nhưng parser tự viết đã được thiết kế để chống ReDoS thì nên kín hẳn.
- Đề xuất sửa: Chặn điểm bắt đầu và giới hạn độ dài, ví dụ `/(?<![A-Za-z])([A-Za-z]{1,32})="([^"<>]{0,64})"/g`. SEC đã đo: 0 ms trên 65.000 ký tự, và vẫn đọc đúng `CurrencyCode`, `CurrencyName`, `Buy`, `Transfer`, `Sell` của bảng thật. Có thể thêm trần cho thẻ: `<Exrate\s([^<>]{0,1024}?)\/>`. Thêm 1 ca unit: thẻ 64 KiB toàn chữ được xử lý dưới 200 ms (và đỏ với regex cũ).
- Trạng thái: Open

### FB-R5-SEC-BE-187-02
- Mức độ: Suggestion
- Vị trí: `fx-refresh-job.ts`, `handler`: gọi `source()` bên trong `tx` của job runner
- Vấn đề: Lệnh gọi mạng (tối đa 10 s) chạy khi giao dịch DB đang mở. BE đã ghi rõ trong report là con số này dưới `idle_in_transaction_session_timeout` 30 s. Tuy vậy, cứ mỗi property thử một lần thì một kết nối pool bị giữ suốt thời gian chờ mạng.
- Vì sao quan trọng: Hiện có 1 property nên ảnh hưởng không đáng kể. Khi có nhiều property, hoặc khi mạng chập chờn, các job tick khác của worker phải chờ kết nối.
- Đề xuất sửa: Không bắt buộc. Nếu job runner hỗ trợ thì lấy XML một lần cho mỗi tick (dùng chung cho các property, vì bảng giống nhau) trước khi mở giao dịch, rồi mới mở giao dịch để ghi. Nếu không hỗ trợ thì giữ nguyên và ghi chú vào `architecture.md`.
- Trạng thái: Open

### FB-R5-SEC-BE-187-03
- Mức độ: Suggestion
- Vị trí: `fx-refresh-job.ts`, câu `INSERT … ON CONFLICT (property_id, key, effective_from) DO UPDATE`
- Vấn đề: Worker ghi `fx_rates.vietcombank` mà không tạo `audit_event`. Khi có bảng mới hơn trong cùng ngày, giá trị trước bị ghi đè (chỉ `version` tăng). Lịch sử theo ngày vẫn còn, nhưng mất bảng giữa ngày.
- Vì sao quan trọng: Khi khách hỏi "trang báo ≈ X USD lúc 9 giờ", OWN không truy lại được đúng tỷ giá đã hiện. Số này chỉ là ước tính, không phải tiền thu, nên rủi ro thấp.
- Đề xuất sửa: Có thể ghi một `audit_event` category `config`, actor hệ thống, chỉ gồm `asOf`/`publishedAt` và 4 số (không có thân XML). Cũng có thể chấp nhận như hiện tại và ghi rõ trong `integrations.md`.
- Trạng thái: Open

## 3. Ghi chú cho ORC / OPS (không phải thẻ)
- Egress mới của **worker**: `portal.vietcombank.com.vn:443`. Nếu staging/production có lọc egress thì OPS cần mở đúng host này cho container worker, không mở cho api. Nếu không có lọc thì không cần làm gì thêm. Phía mã đã tự giới hạn host.
- Việc dùng nội dung XML công khai của Vietcombank (điều khoản sử dụng, tần suất) là câu hỏi pháp lý/vận hành, không phải bảo mật. BE ghi nhận file chỉ cho phép tối đa 1 lần/5 phút và job hỏi tối đa 1 lần/giờ. SEC không đặt điều kiện.

## 4. Kết luận

**DUYỆT #187 @ `4d16f043`.** 0 Blocker · 0 Major · 1 Minor · 2 Suggestion. Minor 01 có thể sửa ngay trong PR này (2 dòng + 1 ca test) hoặc dời. Không chặn gộp. ESC mới: **không**.

Điểm làm tốt:
- Parser được phòng thủ nhiều lớp: chặn đánh dấu nguy hiểm trước khi đọc, chỉ đọc 2 loại phần tử, allowlist kèm dải hợp lý dùng chung cho nguồn tự động, cho ghi đè và khi đọc lại hàng đã lưu.
- Fetcher kiểm host/giao thức/cổng trước khi gọi mạng, không theo redirect, đếm byte khi đọc luồng. Test phủ cả host giả, luồng vô hạn và Content-Length sai.
- Khóa do hệ thống ghi được khóa cứng ở hook (403 cả với OWN, có `access.denied`). Log và cảnh báo chỉ mang mã lỗi, có chống spam theo ngày.

| 2026-11-17 | 5 | SEC – DUYỆT #187 @ 4d16f043 (FB-INV-011 BE fx): URL Vietcombank cố định, chỉ https + đúng host + không cổng, redirect error, timeout 10 s, trần 64 KiB (khai báo + luồng + parser); parser tự viết chặn DOCTYPE/ENTITY/CDATA/PI/thực thể lạ (không XXE, không billion laughs); allowlist USD/KRW/CNY/RUB + dải hợp lý; fx_rates.vietcombank chỉ worker ghi (setParameter 403 cả OWN, access.denied), fx_rate_overrides chỉ OWN (403 trước hook, 422 NOT_ALLOWED/PARAM_OUT_OF_RANGE); khối fx công khai dựng từng trường; log chỉ mã lỗi; cảnh báo OWN tối đa 1 mục/ngày. FB-R5-SEC-BE-187-01 Minor (regex thuộc tính bậc hai, khoảng 3,1 s/64 KiB, chỉ khi nguồn bị làm độc), 187-02/03 Suggestion. Không ESC | SEC | rounds/round-05/reviews/SEC-on-be-pr-187.md |
