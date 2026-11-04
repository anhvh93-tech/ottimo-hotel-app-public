# Hướng dẫn chuyển Desk sang bảng giá 01/11/2026 – dành cho anh/chị chủ đầu tư

- Người viết: DOM | Round 4 – Phản hồi & sửa | Ngày: 01/11/2026 · **Sửa 04/11/2026** (UXD phát hiện, DOM đọc mã): dòng B6 `ota_base_rate` – câu cũ "Không thấy dòng này thì bỏ qua" sai; nay ghi cách tự xem và việc phải làm khi không có dòng. Dòng "Tự kiểm phần B" sửa theo. **Sửa 05/11/2026** (sau PR #73, BR-103 v0.5.4): B6 – từ v1.0.4 **không có dòng `ota_base_rate` là ổn**, Desk lấy giá đêm niêm yết của căn; có dòng thì sửa cho đúng và phải đổi cùng lúc mỗi khi đổi giá căn.
- Căn cứ: bảng giá 01/11 (mục 1–4), ESC-045 câu 1–6 anh/chị đã quyết 01/11, `product/docs/business-rules.md` v0.5.1, kế hoạch chuyển `pricing-spec-2026-11-01-reconcile.md` mục 2. Tên màn, tên ô, mã khóa đã đối chiếu với mã Desk (`ParamsPage`, `ParamDialog`, `RoomDrawer`, `QuoteDialog`, `parameter.service`, `production-defaults.ts`).
- Thời gian: khoảng **30–40 phút**, làm trên **máy tính**, tài khoản **chủ đầu tư**.

## Đọc trước – 5 điều

1. **Làm được ngay bây giờ**, không cần chờ sáng 03/11: anh/chị chưa vận hành nên không có khách nào bị ảnh hưởng.
2. **Làm hết phần A và phần B trong một lần**, không bỏ dở giữa chừng. Nếu chỉ đổi giá mà chưa đổi tham số, Desk sẽ ra số lai (ví dụ cuối tuần thành 920.000 thay vì 800.000).
3. Ô **Hiệu lực từ**: **để nguyên ngày Desk điền sẵn** (là "hôm nay" theo ngày làm việc của Desk). Làm sau nửa đêm mà Desk vẫn hiện ngày hôm trước là đúng – đừng sửa.
4. Ô **Lý do**: gõ `Bảng giá 01/11/2026` (giống nhau cho mọi lần lưu).
5. **Gõ đúng rồi mới bấm Lưu.** Giá căn (phần A) lưu sai thì sửa lại ngay được. **Tham số (phần B) đã lưu thì trong ngày không sửa lại được** – Desk sẽ báo lỗi. Nếu lỡ sai: chụp màn hình gửi đội, đội hướng dẫn lưu lại với **Hiệu lực từ = ngày mai** (vì chưa vận hành nên không sao).

---

## Phần A – Giá 10 căn (khoảng 15 phút)

1. Menu bên trái, nhóm **Quản trị** → bấm **Danh mục căn**.
2. Ở dòng căn **101**, bấm **Sửa** (cuối dòng). Cửa sổ "Sửa căn 101 · …" mở ra.
3. Kéo xuống khối **Giá niêm yết**:
   - Ô **Giá tháng**: xóa số cũ, gõ số ở bảng dưới.
   - Ô **Giá đêm niêm yết**: xóa số cũ, gõ số ở bảng dưới. (Desk **không** tự tính giá đêm từ giá tháng – phải gõ.)
   - Khi số đổi, Desk hiện thêm ô **Hiệu lực từ** (để nguyên) và ô **Lý do đổi giá** → gõ `Bảng giá 01/11/2026`.
4. Bấm **Lưu**. Desk báo "Đã lưu căn 101."
5. Làm lại bước 2–4 cho 9 căn còn lại. **Không** đổi Định mức, Tối đa, Nhóm, nút Đang bán.

| Căn | Giá tháng (gõ) | Giá đêm niêm yết (gõ) |
|---|---|---|
| 101 | 8.500.000 | 800.000 |
| 201 | 8.500.000 | 800.000 |
| 102 | 9.000.000 | 800.000 |
| 103 | 9.000.000 | 800.000 |
| 202 | 9.000.000 | 800.000 |
| 203 | 9.000.000 | 800.000 |
| 302 | 11.500.000 | 1.100.000 |
| 402 | 11.500.000 | 1.100.000 |
| 301 | 13.500.000 | 1.300.000 |
| 401 | 13.500.000 | 1.300.000 |

Giá tháng gõ là **giá khách Việt Nam**; khách hộ chiếu nước ngoài +10 % Desk tự cộng (tham số đã đúng, không đổi).

**Tự kiểm phần A:** về bảng **Danh mục căn**, cột **Giá tháng** và **Giá đêm niêm yết** của 10 dòng phải đúng như bảng trên.

---

## Phần B – Tham số quy tắc (khoảng 15 phút)

Cách làm **mỗi dòng** trong bảng dưới:

1. Menu **Quản trị** → **Tham số quy tắc**.
2. Bấm **tab** ghi ở cột "Tab" (hàng tab phía trên bảng).
3. Tìm dòng: tên tham số in đậm, **mã khóa** in nhỏ ngay dưới tên. Tab **Khác** dài, dùng phím **Cmd + F** (máy Mac) hoặc **Ctrl + F** (Windows) rồi gõ mã khóa để nhảy tới.
4. Bấm **Sửa** ở cuối dòng. Cửa sổ "Sửa: …" mở ra.
5. Ô **Giá trị mới** (hoặc **Giá trị (JSON)** với dòng dạng danh sách): **xóa hết** chữ cũ, gõ (hoặc dán) **đúng** nội dung ở cột "Gõ vào ô". Với ô JSON nên **sao chép** từ tài liệu này rồi dán, giữ đủ dấu ngoặc và dấu ngoặc kép.
6. **Hiệu lực từ**: để nguyên. **Lý do**: `Bảng giá 01/11/2026`.
7. Bấm **Lưu thay đổi**. Desk báo "Đã lưu …, hiệu lực từ …".

| # | Tab | Dòng (mã khóa) | Đang là (để đối chiếu) | Gõ vào ô | Vì sao |
|---|---|---|---|---|---|
| B1 | Khác | `weekend_uplift_pct` | 15 | `0` | Không tăng giá thứ Sáu, thứ Bảy (ESC-045 câu 1) |
| B2 | Khác | `special_uplift_pct` | 30 | `0` | Không tăng giá ngày lễ, Tết (ESC-045 câu 1) |
| B3 | Khác | `los_discount` | `[{"minNights":7,"pct":10},{"minNights":14,"pct":15}]` | `[]` | Không giảm theo số đêm (bảng giá) |
| B4 | Khác | `long_stay_required_from_nights` | 28 | `30` | Từ 30 đêm là thuê tháng |
| B5 | Khác | `short_stay_max_nights` | 27 | `29` | Ngắn ngày tới 29 đêm. **Làm ngay sau B4** |
| B6 | Khác | `ota_base_rate` | số cũ, đã đúng, hoặc **không có dòng này** | **Chỉ khi có dòng:** `{"L12":800000,"N":1300000,"NPLUS":1100000}` | Một mức giá mọi kênh. **Từ v1.0.4, Desk không cần dòng này**: đơn OTA lễ tân để trống giá thì Desk lấy **giá đêm niêm yết của căn**, sàn–trần cũng theo giá niêm yết. **Có** dòng thì dòng này **được ưu tiên hơn** giá căn. **Cách xem:** tab **Khác**, Cmd + F (Ctrl + F) gõ `ota_base_rate`. Dòng này **chỉ có tên in đậm `ota_base_rate`**, không có tên tiếng Việt; cột giá trị hiện chuỗi trong ngoặc `{…}`. **Không thấy dòng:** ổn, không làm gì; nhắn đội "không có dòng". **Có dòng, số cũ** (ví dụ 760000): **Sửa**, dán đúng chuỗi ở cột bên, lưu như các dòng khác, nhắn đội "có dòng". **Có dòng, đã đúng chuỗi bên:** không sửa, nhắn đội "có dòng, đúng". Khi đã có dòng: **mỗi lần đổi giá căn phải sửa dòng này cùng lúc**, nếu không đơn OTA để trống giá sẽ ra giá cũ; không muốn nhớ việc này thì nhờ đội gỡ dòng. **Tới khi đội báo v1.0.4 đã lên**, dù có dòng hay không, đơn OTA vẫn phải **gõ đủ giá mọi đêm** theo xác nhận của OTA |
| B7 | Khác | `early_checkin_tiers` | `[{"from":"10:00","to":"12:00","pct":30},{"from":"06:00","to":"10:00","pct":50}]` | `[{"from":"10:00","to":"11:00","pct":30},{"from":"06:00","to":"10:00","pct":50}]` | Nhận phòng sớm **miễn phí từ 11:00** |
| B8 | Số người & phụ thu | "Phụ thu trẻ 6–11 tuổi vượt định mức (mỗi đêm)" (`child_fee_6_11`) | 100.000 | `150.000` | Từ 6 tuổi tính như người lớn (ESC-045 câu 3). Dưới 6 tuổi vẫn miễn – không đổi gì |
| B9 | Khác | `long_stay_compare_from_nights` | 15 | `30` | Chỉ từ 30 đêm Desk mới hiện "So sánh: thuê 1 tháng" (ESC-045 câu 6) |
| B10 | FOC, hoa hồng, phí kênh | "Hoa hồng sale/CTV – khách ngắn ngày" (`short_stay_commission_pct`) | `{"collaborator": …, "staff": …}` | `{"collaborator": X, "staff": X}` – **X = tỷ lệ "Sale theo đêm" trong bảng nội bộ của anh/chị**, cùng một số cho cả hai | Bảng nội bộ có một mức Sale chung. Gõ theo **phần trăm**: bảng ghi dạng thập phân thì nhân 100 (ví dụ 0,25 → 25). Không gửi con số này cho đội |
| B11 | Khác | `rounding.monthly_rent` | 10000 | `1000` | Tiền tháng làm tròn 1.000 như bảng giá. Desk báo không cho phép thì bỏ qua |

**Không đổi** (đã khớp bảng giá hoặc Desk chưa dùng): giờ nhận/trả 12:00, trả muộn 30 %/50 %/sau 18:00 tính 1 đêm, ân hạn 12:30, phụ thu người lớn 150.000, tuổi người lớn 12, trẻ miễn dưới 6, khách nước ngoài +10 % (thuê tháng), cọc 30 %, VAT 8 % (giá đã gồm VAT), điện 5.000 đ/kWh, nước 100.000 đ/người/tháng, ở tối thiểu 2 đêm khi đến thứ Sáu/thứ Bảy/ngày lễ, danh sách ngày lễ (vẫn dùng cho ở tối thiểu và không hoàn cọc), `early_termination` (Desk v1.0 chưa dùng – đội tự cập nhật ở bản sau), `adhoc_cleaning_fee` (giữ 100.000 cho khách ngắn ngày – xem H3).

**Tự kiểm phần B:** ở tab **Khác**, các dòng B1–B5, B7, B9, B11 hiện giá trị mới; cột **Hiệu lực từ** là ngày hôm nay; không có chữ "Chưa hiệu lực". Dòng B6 `ota_base_rate`: không có dòng là được; có dòng thì hiện đúng `{"L12":800000,"N":1300000,"NPLUS":1100000}`. Cả hai trường hợp đều đã nhắn đội (xem B6).

---

## Phần C – 4 báo giá thử để tự kiểm (khoảng 10 phút, **không lưu**)

Cách mở: menu nhóm **Khách & bán** → **Báo giá & giữ chỗ** → tab **Căn trống** → điền **Ngày đến**, **Số đêm**, **Người lớn (từ 12 tuổi)** → **Tìm kiếm** → ở căn cần thử bấm **Báo giá**. Cửa sổ báo giá hiện số ngay, **không cần chọn khách**. Xem số xong bấm **Hủy** – **không bấm "Lưu báo giá"**.

| # | Điền | Desk phải hiện | Nếu ra số khác thì là… |
|---|---|---|---|
| C1 | Ngày đến **06/11/2026** (thứ Sáu), **2** đêm, **2** người lớn → căn **102** | "2 đêm thứ Sáu, thứ Bảy × 800.000" = **1.600.000**; cọc **500.000** | 1.840.000 → B1 chưa lưu; 1.500.000 → giá căn 102 chưa đổi |
| C2 | Ngày đến **09/11/2026**, **7** đêm, **5** người lớn → căn **401** | "5 đêm thường × 1.300.000" + "2 đêm thứ Sáu, thứ Bảy × 1.300.000" = 9.100.000; "Phụ thu 1 người vượt định mức × 7 đêm" **1.050.000**; tổng **10.150.000**; cọc **2.700.000**; **không** có dòng "Đã giảm …%" | Có dòng "Đã giảm 10%" → B3 chưa lưu |
| C3 | Ngày đến **09/11/2026**, **29** đêm, **2** người lớn → căn **101** | "8 đêm thứ Sáu, thứ Bảy × 800.000" + "21 đêm thường × 800.000" = **23.200.000**; cọc **7.000.000**; **không** có khối "So sánh: thuê 1 tháng". Sau đó trong cửa sổ đổi **Số đêm** thành **30** → Desk **không** ra giá ngắn ngày mà báo đây là **thuê dài hạn** | 29 đêm bị chặn → B4/B5 chưa lưu; có "So sánh: thuê 1 tháng" → B9 chưa lưu |
| C4 | Ngày đến **10/11/2026** (thứ Ba), **2** đêm, **3** người lớn → căn **302**; trong cửa sổ báo giá thêm **1** ở ô **Trẻ 6–11 tuổi** | 2 đêm × 1.100.000 = 2.200.000; "Phụ thu 1 người vượt định mức × 2 đêm" **300.000**; tổng **2.500.000**; cọc **700.000** | Phụ thu 200.000, tổng 2.400.000 → B8 chưa lưu |

Ghi chú khi thử:
- Ở C3 khi đổi sang 30 đêm, nếu chữ Desk **còn ghi "Từ 28 đêm"** thì đó là chữ cũ chưa sửa (đội sửa ở bản sau, H10). Con số đúng là **30**: 29 đêm ra giá được là đạt.
- Cọc = 30 % tiền phòng (không tính phụ thu người), làm tròn 100.000.
- Nhận sớm miễn phí từ 11:00 (B7) chỉ kiểm được lúc làm thủ tục nhận phòng – không cần thử bây giờ. Ví dụ để nhớ: căn Studio 800.000, nhận 11:00 → 0 đ; 10:30 → 240.000; 08:00 → 400.000.

**Sai số nào:** chụp màn hình cửa sổ báo giá, gửi `/feedback P0 …`. Đội trả lời trong buổi.

---

## Xong rồi thì

1. Nhắn đội: **"Desk đã chuyển giá, 4 báo giá thử đúng"** (hoặc số nào sai). Đội sẽ: sửa sổ tay và tờ dán quầy (bỏ +15 %/+30 %, bỏ giảm 7/14 đêm, 28 → 30 đêm, trẻ từ 6 tuổi 150.000), đánh dấu xong điều kiện P6/P7 của gói landing mới.
2. Giá trên Booking/Agoda/Airbnb anh/chị đã sửa cho khớp (01/11) – không cần làm lại.

## Thuê tháng – Desk chưa tự tính, sale dùng bảng tra

- Bảng tra tiền thuê theo hạng × kỳ hạn × khách VN/nước ngoài: `pricing-spec-2026-11-01-reconcile.md` mục 4 (HĐ **13–23 tháng** dùng cột 10–12 tháng **7 %**; **trên 24 tháng** dùng cột 24 tháng **10 %**).
- Đóng tiền **ngày 05** mỗi tháng (tháng dương lịch). Tháng vào ở tính lẻ: **giá ngày = tiền thuê tháng ÷ 30**, làm tròn 1.000, × số ngày từ ngày vào tới hết tháng; phần lẻ **gộp vào kỳ tháng liền sau**. Ví dụ Studio City 8.500.000 vào 20/11: 283.000 × 11 ngày = **3.113.000** (phí dịch vụ lẻ 73.000).
- Khi ký HĐ thu những gì với khách vào giữa tháng: **chờ anh/chị trả lời ESC-047** (đội đề xuất: ký quỹ + phần lẻ + trọn tháng liền sau; ví dụ trên = **20.386.000**).
- Khách trả phòng trước hạn HĐ: **mất ký quỹ**, không truy thu giảm giá (ESC-045 câu 4).
