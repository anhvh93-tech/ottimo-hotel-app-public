# SEC – Review FE FB-INV-011 (landing: giá ước tính theo tiền của ngôn ngữ trang)

Round 5 · bước **Review (rút gọn)** · SEC · 17/11/2026

Đối tượng: nội dung diff `gh pr diff 186`, HEAD **`b56255f2`** (FE sẽ mở lại thành PR mới, một commit, cùng nội dung; review này áp cho nội dung, không cho lịch sử). Đối chiếu: `04-investor-feedback/FB-INV-011.md`, `rounds/round-05/fb-inv-011/contract.md`.

Cách kiểm: đọc toàn bộ diff (19 tệp), `git show b56255f2:` cho `price-estimate.ts` (hàm `el`), `pages/[privacy].astro`, nơi import `Rooms.astro`/`BookingForm.astro`. Không checkout nhánh vào bản làm việc chung, không chạy stack, không gọi staging/production.

Tệp này không có bí mật hay dữ liệu khách.

## Kết luận: **DUYỆT**

| Điểm kiểm | Bằng chứng | Kết quả |
|---|---|---|
| Số ngoại tệ chỉ render bằng textContent | `room-prices.ts`: `createElement('p'/'data')`, `textContent`, `data.value = String(number)`, `from.after(...)`. `price-estimate.ts`: `el(tag, cls, text)` gán `n.textContent` (dòng 90–93 tại `b56255f2`). Không có `innerHTML`/`set:html`/`insertAdjacentHTML` trong mã chạy; `innerHTML` chỉ ở `room-prices.test.ts` với fixture tĩnh | Đạt |
| `fx` coi là không tin cậy | `fxQuote()` nhận `unknown`, kiểm `base === 'VND'`, `asOf` string; chỉ đọc `rates[currency]` với `currency` lấy từ bảng cố định `FX_CURRENCY` (4 mã; vi → null) – không lặp khóa của API; `typeof number` + `Number.isFinite`; khoảng hợp lý `FX_SANE` (USD 10k–65k, KRW 7–50, CNY 1,4k–9k, RUB 100–800) nên rate luôn > 0, không chia 0; `asOf` qua regex `YYYY-MM-DD` + kiểm vòng `Date.UTC` (loại 2026-02-30); tuổi ≤ 7 ngày, chấp nhận sớm 1 ngày. `asOf` chỉ ra màn qua `Intl.DateTimeFormat`, số qua `Intl.NumberFormat` style currency với mã từ allowlist. Sai bất kỳ điểm nào → null → chỉ VND | Đạt |
| Không nới CSP / connect-src | Diff không đụng `astro.config.*`, header, `public/`, hạ tầng; không thêm URL ngoài, không fetch mới (dùng lại `fetchMonthlyRates` cùng origin). E2E chạy với CSP thật (`connect-src 'self'`) và `cspViolations` | Đạt |
| Trang privacy không đổi byte | Không sửa `landing.css`, layout `Base` hay `PrivacyPage`. `fx.css` là tệp mới, chỉ import ở `Rooms.astro` và `BookingForm.astro`; hai component này chỉ đi qua `HomePage.astro` / `home/Book.astro`, `[privacy].astro` không dùng. Khớp báo cáo FE (sha1 giống) | Đạt |
| Không bí mật trong test | Tỷ giá, giá là số bịa; `form-token` và `estimateToken` sinh lúc chạy (`'e2e'.padEnd(40,'x')`, base64url của query + `c2lnbmF0dXJl` = "signature"), không phải khóa thật; không email/điện thoại thật | Đạt |
| PII / log | Không log, không đưa dữ liệu vào URL; dữ liệu mới chỉ là tỷ giá công khai | Đạt |

## Thẻ

### FB-R5-SEC-FE-FB011-01
- Mức độ: Suggestion
- Vị trí: `product/apps/landing-web/src/scripts/booking-form.ts` (`TODAY = todayIn(tz, new Date())`) → `fx.ts` `fxQuote()` kiểm tuổi `asOf`
- Vấn đề: lớp kiểm tuổi phía trang dựa trên đồng hồ máy khách. Đồng hồ sai thì trang có thể ẩn quy đổi (tệ nhất: chỉ VND) hoặc nhận một `asOf` cũ hơn 7 ngày nếu bản trả lời bị cache lâu.
- Vì sao quan trọng: thấp – máy chủ đã bỏ `fx` quá 7 ngày (hợp đồng), dòng chú thích luôn ghi ngày tỷ giá và "Payment in VND", số VND vẫn là giá thật. Không có đường nào làm sai tiền phải trả.
- Đề xuất sửa: giữ như hiện tại; nếu sau này có header `Date` của bản trả lời thì có thể dùng nó thay đồng hồ máy khách. Không cần làm trong round này.
- Trạng thái: Open

### FB-R5-SEC-FE-FB011-02
- Mức độ: Suggestion
- Vị trí: `product/apps/landing-web/src/scripts/fx.test.ts`
- Vấn đề: test đã phủ thiếu `fx`, rate lạ, ngày cũ; chưa có ca `fx.rates` là mảng hoặc có khóa lạ (`__proto__`, `"USD "`) và `asOf` chứa ký tự HTML. Mã hiện tại đã xử lý đúng (đọc khóa theo allowlist, regex ngày chặt), test chỉ để khóa hành vi lại.
- Vì sao quan trọng: chống hồi quy nếu ai đó đổi `fxQuote` sang lặp `Object.entries(rates)` hoặc nới regex ngày.
- Đề xuất sửa: thêm 2–3 ca vào `fx.test.ts` khi FE sửa tệp này lần tới.
- Trạng thái: Open

## Điểm nên giữ
- Allowlist mã tiền đi từ ngôn ngữ trang, không từ dữ liệu API; mọi sai lệch rơi về VND.
- Tách CSS ra `fx.css` để không đổi byte trang `/privacy/` đã đăng.
- Số ngoại tệ đặt trong `<data value>` dạng số, chữ qua textContent – không có chỗ nào dựng HTML từ dữ liệu.

ESC: không. Không giả định ngoài việc PR mới mang đúng nội dung `b56255f2`.

| 2026-11-17 | 5 | **SEC – review FE FB-INV-011 landing tiền theo ngôn ngữ (PR #186 @ b56255f2, nội dung áp cho PR mở lại): DUYỆT.** Ngoại tệ chỉ textContent/`data.value`; `fx` coi là không tin cậy (allowlist 4 mã theo ngôn ngữ, finite + khoảng hợp lý, ngày ISO kiểm vòng, ≤ 7 ngày, sai → chỉ VND); không đổi CSP/connect-src, không fetch mới; không đụng `landing.css`/Base nên `/privacy/` không đổi byte; token test sinh lúc chạy. Thẻ 01 Suggestion (tuổi asOf theo đồng hồ khách), 02 Suggestion (thêm ca test rates lạ/asOf HTML). Không ESC | SEC | rounds/round-05/reviews/SEC-on-fe-fb011.md |
