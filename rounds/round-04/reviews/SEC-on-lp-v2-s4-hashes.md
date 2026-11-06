# SEC – Kết luận điều kiện LPV2M-02 (băm trang thông báo ở S4/P10)

Round 4 · bước Review · SEC · 06/11/2026
Đối tượng: `rounds/round-04/outputs/OPS/lp-v2-release-runbook.md` S4 (dòng "phải trùng 5 băm FE-B báo khi đổi nhãn"), P10 (so với S4 và FE-B), bảng dừng S0–S8.
Đầu vào: số liệu ORC đo 06/11 (image landing `sha-6414be25f20d`, digest `6f224ed3…8a3d`), `rounds/round-04/reviews/FE-B-on-lp-v2-main.md` mục 4, `SEC-on-lp-v2-main.md` thẻ FB-R4-SEC-LPV2M-02.

## 1. Kết luận: ĐẠT (có điều kiện)

Đăng production bằng 5 băm của **image CI** (không phải 5 băm FE-B) **đạt** LPV2M-02.

Lý do: LPV2M-02 nhằm bảo đảm **chữ khách đọc trên trang đang chạy = chữ đã đăng vào `privacy_notice_version` với nhãn `2026-11-04`**. Băm FE-B chỉ là mốc tham chiếu từ bản dựng thử. Chính FE-B đã ghi ở mục 4: "OPS vẫn so băm trên image thật khi đăng, vì biến dựng của CI có thể khác". Bản FE-B dựng với `build:booking-live-test`, slug `dl01`, không có `LANDING_SITE_URL`/`LANDING_INDEXABLE`, nên khác byte (canonical, robots, slug). Đây không phải khác chữ thông báo. Nguồn đúng để so là trang trong image sẽ chạy trên production.

## 2. SEC tự kiểm lại (06/11, trên tệp ORC để ở scratchpad, không chạm production)

| Trang | Băm image (12) | Băm ORC dựng lại với biến CI | So byte |
|---|---|---|---|
| en | `f593b94ea33a` | `f593b94ea33a` | trùng |
| vi | `9d7bffa853fe` | `9d7bffa853fe` | trùng |
| ko | `a9bccbb8341b` | `a9bccbb8341b` | trùng |
| zh | `1ab9efad8c34` | `1ab9efad8c34` | trùng |
| ru | `43e080ce6503` | `12f782afc3db` | khác 1 chỗ |

- ru: `diff` (sau khi tách theo thẻ) chỉ ra **đúng một khác biệt**: `/_astro/fonts-ru.BQkOmm7a.css` (image) với `/_astro/fonts-ru.ncLopJ2r.css` (Mac). Thay tên tệp này bằng một chuỗi cố định ở cả hai bản thì băm sha256 hai bản **trùng nhau** (`cd6119358e95779b…`). Vậy chữ, meta, cấu trúc trang ru giống hệt. Chỉ dấu vân tay của tệp CSS phông khác (CSS dựng trên Mac khác CI, có thể do đường dẫn hoặc phiên bản gói phông). Phần này không thuộc nội dung thông báo.
- Cả 5 trang trong image có `<meta name="ottimo-notice-version" content="2026-11-04">`.
- Trang ru trong image chỉ trỏ ra ngoài bằng liên kết (`ottimo.vn`, `schema.org`, `maps.app.goo.gl`, `facebook.com`, `zalo.me`). Không tải tài nguyên bên thứ ba.
- Vì đã so được chữ ru như trên, SEC **không cần thêm bước so chữ ru** lúc đăng. Production chạy cùng digest image, nên băm production phải trùng **byte** với băm S4. Đây là kiểm chặt hơn so chữ.

## 3. Điều kiện (bắt buộc cho P10)

1. **Mốc so = 5 băm S4 của image**, gồm en `f593b94ea33a`, vi `9d7bffa853fe`, ko `a9bccbb8341b`, zh `1ab9efad8c34`, ru `43e080ce6503`. Băm FE-B chỉ còn là tư liệu, không làm mốc dừng/chạy.
2. Landing production phải chạy **đúng image `sha-6414be25f20d`, digest `6f224ed3…8a3d`** (cùng image đã đăng ở staging). Ảnh khác thì phải dựng lại, đo lại S4 và SEC xem lại.
3. P10: 5 băm từ dòng `apply … sha_<xx>=` cuối của `state/privacy-notice.log` production phải **trùng đúng** 5 băm ở mục 1. Lệch dù một trang thì **dừng**, không `--apply` lại với nhãn `2026-11-04`. Báo SEC để đặt nhãn mới, theo quy tắc "không dùng lại nhãn cho chữ khác".
4. Không dựng lại landing trên máy khác để thay image trong lượt này, vì phông ru đổi dấu vân tay và làm lệch băm ru.

## 4. Thẻ

### FB-R4-SEC-OPS-LPV2S4-01
- Mức độ: Minor
- Vị trí: `rounds/round-04/outputs/OPS/lp-v2-release-runbook.md` S4 (dòng 219), P10 (dòng 411), bảng dừng S0–S8 (dòng 577).
- Vấn đề: runbook bắt "trùng 5 băm FE-B". Băm FE-B được tính trên bản dựng thử, với biến khác CI, nên không bao giờ trùng image thật. Nếu làm theo chữ, S4 sẽ dừng sai.
- Vì sao quan trọng: người chạy có thể dừng sai hoặc tự bỏ qua kiểm này. Bỏ qua thì mất cổng chặn chữ lạ.
- Đề xuất sửa (OPS): đổi thành "5 băm S4 phải trùng 5 băm trang trong image landing sẽ lên production (cùng digest). P10 phải trùng S4. Băm FE-B chỉ là tham chiếu bản dựng thử". Ghi 5 băm ở mục 3 điều kiện 1 vào runbook lượt này.
- Trạng thái: Open. Không chặn P10 nếu ORC áp dụng mục 3.

### Ghi nhận (không phải lỗi bảo mật, chuyển FE xem)
`fonts-ru.*.css` dựng trên Mac có `src:url(@fontsource/onest/files/…)` chưa được phân giải thành `/_astro/…`. Phông Onest Cyrillic có thể bị 404 và phải dùng phông dự phòng. SEC chưa xem được CSS trong image. FE kiểm `fonts-ru.BQkOmm7a.css` trong image. Nếu bị lỗi này, sửa ở bản sau. Bản sửa sẽ đổi byte trang ru, nên cần SEC xét nhãn trước khi đăng. **Không sửa trong lượt này**.
