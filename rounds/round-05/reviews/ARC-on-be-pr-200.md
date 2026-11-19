# ARC review PR #200 (BE) + PR #201 (FE) – contract §12.4: giá dọn thêm theo căn cho khách dài hạn

- Round 5, bước **Review** kỹ thuật. Người review: ARC. Ngày 19/11/2026.
- PR #200 (BE): nhánh `r5-fb012-cleaning-fee`, head **`58935c02`**, base `main`, CI xanh.
- PR #201 (FE): nhánh `r5-fb012-cleaning-fee-fe`, head **`bd7537c0`**, base `main`, CI xanh. PR này chỉ được kiểm về **độ khớp với hợp đồng**, không review hết.
- Căn cứ:
  - giá INV chốt ngày 19/11: Studio 150.000, Premium/Signature 200.000, OWN nhập theo căn;
  - contract §12.4, §12.11 Q19–Q21;
  - `BE-responses.md` mục "12.4", `FE-responses.md` mục "12.4";
  - thẻ ARC-BE-197-03.
- Không có migration. Không đổi RBAC. OpenAPI chỉ thêm (query `folioId`, `ChargeCatalogItem.priceSource`). File sinh ra (meta, schemas, api-client) đã cập nhật trong PR và CI contract `--strict` xanh.

## 0. Kết luận

- **PR #200: DUYỆT gộp.** Không có thẻ Blocker/Major. Có 1 Minor, 2 Suggestion, không chặn v1.0.7.
- **PR #201: khớp hợp đồng.** Gộp sau #200 (thẻ 200-S2). Chuỗi `params.lscf.price_invalid` đang chờ UXD duyệt, đây là việc của UXD.
- **ARC-BE-197-03: đóng.** Đã cập nhật trạng thái thẻ trong `ARC-on-be-pr-197.md`.
- Không ESC: giá là quyết định INV đã có (19/11). Số giá chỉ nằm trong dữ liệu (Desk, seed dev), không có trong mã.

## 1. Đối chiếu §12.4

| Điểm hợp đồng | Kết quả |
|---|---|
| Hook kiểm khi lưu (G6, 197-03) | Đúng. `parameter-rules.ts` kiểm: phải là object; số căn phải có trong `room` của cơ sở (truy vấn chạy dưới RLS); giá nguyên, bội 1.000, trong khoảng cho phép. Sai → 422 `PARAM_OUT_OF_RANGE`, kèm `allowed` hoặc `min`/`max`. Vai sửa theo A101 (OWN/MGR), FDL → 403. Có test Q21 |
| Một hàm chọn giá `cleaningFeeFor` (module folio, public) | Đúng. Một nguồn duy nhất cho 3 nơi đọc. Đơn ngắn ngày không bao giờ đọc bảng. Hàm trả `source` |
| (a) `addFolioLine` `adhoc_cleaning_fee` | Đúng. `onDate` = ngày dịch vụ (đã kiểm là ngày có thật), không có thì hôm nay. Lễ tân vẫn không sửa được giá |
| (b) trang khách | Đúng. `options()` dùng `cleaningFeeFor`. Lúc tạo yêu cầu, giá lấy `option.feeVnd` (cùng nguồn) và chụp vào `fee_vnd_snapshot`, nên yêu cầu đã gửi giữ giá cũ (test Q20) |
| (c) `getChargeCatalog?folioId` + `priceSource` | Đúng. `folioId` sai dạng → 422; không có folio (RLS) → 404; không gửi → như cũ, không có `priceSource` |
| Khách ngắn ngày, bảng rỗng | Không đổi (test Q19, và ca "căn không có trong bảng") |
| `production-defaults.ts` không ghi dòng | Đúng. Mặc định `{}`. OWN nhập trên production |

## 2. Năm điểm lệch: ARC quyết

| # | Lệch | Quyết định | Lý do |
|---|---|---|---|
| 1 | Giá **1.000**–5.000.000 (contract ghi 0–5.000.000) | **Chấp nhận. Contract đã sửa** | Giá 0 không có nghĩa: `roomPriceOf` coi ≤ 0 là "không có giá riêng" và rơi về giá chung. Nếu cho lưu 0, OWN tưởng căn được miễn phí dọn mà thực tế bị tính giá chung. Muốn căn dùng giá chung thì không ghi căn đó vào bảng. FE #201 kiểm cùng khoảng và câu lỗi nói "để trống thì dùng giá chung" |
| 2 | Seed `ds-e.json` ghi `br: BR-506` | **Chấp nhận, kèm Minor 200-01** | Seed là dữ liệu dev/e2e, không ảnh hưởng chạy. Nhưng danh mục (`config_parameter_def.br_ref`, 0100) và nhãn S24 dùng **BR-LS-07**. Seed nên dùng cùng mã để tra cứu không lệch |
| 3 | Chọn căn theo ngày dịch vụ (không có thì hôm nay). Nếu không đoạn nào phủ ngày đó, lấy đoạn gần nhất bắt đầu trước ngày | **Chấp nhận. Contract đã ghi** | Đúng nghĩa "căn đơn đang giữ ngày `onDate`". Phương án dự phòng có thứ tự cố định, không bao giờ trả null khi đơn có đoạn. Một chỗ chú thích lệch code: Suggestion 200-S1 |
| 4 | Giá lưu hỏng → dùng giá mặc định, không lỗi | **Chấp nhận. Contract đã ghi** | Theo bài học V5-25: màn đọc không được vỡ vì một giá trị cũ. Từ khi có hook thì không ghi được giá trị hỏng nữa. Trên production khóa chưa có dòng nào (mặc định `{}`), nên trường hợp này chỉ còn ở DB dev |
| 5 | Không thêm migration | **Chấp nhận** | 0100 đã có dòng danh mục (`edit_roles {owner,manager}`, `br_ref BR-LS-07`, mặc định `{}`). Hook và hàm chọn giá chỉ là mã. 0100 đã đóng băng từ #197 (xem `ARC-on-be-pr-197.md` mục 10) |

## 3. PR #201 (FE): độ khớp hợp đồng

| Điểm | Kết quả |
|---|---|
| Bật 12.4, giữ tắt 12.5 | `goLiveDeferred = { cleaningByRoom: true, catchUp: false }`. Đúng phạm vi v1.0.7 |
| Thêm phát sinh (FE-5) | Gọi `getChargeCatalog` kèm `folioId`. Hiện giá server trả và chip `priceSource`. Không tự tính giá. Mock ghi dòng theo cùng luật (đọc căn của đơn) |
| Bảng S24 (FE-4) | Kiểm 1.000–5.000.000, bội 1.000, khớp hook #200. Server vẫn là nơi quyết. Giá hiện theo nhóm nghìn. Nhãn quy tắc BR-LS-07 |
| Trang khách | Lấy `feeVnd` server trả, không viết cứng 100.000 (có test) |
| Kiểu `ChargePriceSource` | Đang là kiểu viết tay, trùng với `'long_stay_room' \| 'default'`. Đổi sang kiểu sinh sau khi #200 vào main (FE đã ghi) |
| Thương hiệu | Chuỗi mới theo tông app, EN dẫn – VI hỗ trợ, không emoji. Câu lỗi chờ UXD duyệt |

## 4. Thẻ

### FB-R5-ARC-BE-200-01
- Mức độ: Minor
- Vị trí: `product/tests/fixtures/seed/ds-e.json`, mục `long_stay_cleaning_fee_by_room`.
- Vấn đề: `"br": "BR-506"`, trong khi danh mục tham số (0100) và nhãn S24 của FE dùng `BR-LS-07`. BR-506 là luật phí dọn lẻ chung; giá theo căn của khách dài hạn là BR-LS-07.
- Vì sao quan trọng: QA và DOM tra từ seed sang business-rules sẽ ra hai mã khác nhau cho cùng một khóa.
- Đề xuất sửa: đổi thành `"br": "BR-LS-07"`. Có thể ghi thêm BR-506 trong `note` nếu muốn. Làm trong PR này hoặc PR sau đều được.
- Trạng thái: Open

### FB-R5-ARC-BE-200-S1
- Mức độ: Suggestion
- Vị trí: `folio/public/cleaning-fee.ts` `stayRoomOn`.
- Vấn đề / đề xuất: chú thích ghi "không có đoạn trước thì lấy đoạn đầu tiên", nhưng `ORDER BY … s.from_date DESC` thực tế lấy đoạn **cuối**. Chỉ xảy ra khi `onDate` trước ngày đến (ngày dịch vụ đã nằm trong lượt ở, nên gần như không gặp). Sửa chú thích hoặc thứ tự cho khớp. Thêm 1 ca test đổi căn giữa kỳ (khách dài hạn chuyển từ Studio sang Premium: dọn trước ngày đổi tính 150.000, sau ngày đổi tính 200.000), vì đây là lý do hàm nhận `onDate`.
- Trạng thái: Open

### FB-R5-ARC-BE-200-S2
- Mức độ: Suggestion
- Vị trí: thứ tự gộp #200, #201.
- Vấn đề / đề xuất: gộp #200 trước. #201 merge `origin/main`, đổi `ChargePriceSource` sang kiểu sinh, rồi chờ CI xanh mới gộp. Nếu gộp #201 trước, Desk sẽ gửi `folioId` lên server chưa biết tham số này. Server có thể bỏ qua tham số (trả giá chung, thiếu chip nguồn giá) hoặc từ chối (nếu kiểm query chặt). ARC chưa kiểm trường hợp nào xảy ra, nên không gộp theo thứ tự đó. ORC theo thứ tự này. Sau khi cả hai lên production: OWN nhập bảng, rồi lễ tân bỏ dòng phần chênh (go-live-guide 5.3, ARC-BE-197-03).
- Trạng thái: Open

## 5. Điểm làm tốt

- Hook được làm trước tiên. Hàm chọn giá đặt trong module folio, dùng chung cho ba nơi, nên không có chỗ thứ hai tự tính giá.
- Giá INV không có trong mã: chỉ nằm ở seed dev và do OWN nhập trên Desk.
- FE kiểm cùng khoảng giá với server, và câu lỗi nói rõ cách dùng giá chung.

---

## Phụ lục 19/11: BUG-R5-017, sửa bảng giá dọn trong ngày

### A. Hiện trạng (đọc trên `origin/main`)

- `ParameterService.set()` (`platform/public/parameter.service.ts` ~225–315) ghi bằng `INSERT … ON CONFLICT (property_id, key, effective_from) DO UPDATE … WHERE effective_from > today OR $sameDayOverride`.
  - Dòng **tương lai**: ghi đè thoải mái.
  - Dòng **hôm nay**: chỉ ghi đè được khi có cờ `sameDayOverride`; không có cờ thì trả 422 `VALIDATION_FAILED` "value already effective", lỗi gắn vào `effectiveFrom` dưới mã chung. Đây là luật erd 4.1: "giá trị đang có hiệu lực thì không sửa".
- Cờ `sameDayOverride` hiện chỉ do `ParametersService.setParameter` đặt, qua danh sách trắng `KILL_SWITCH_SAFE_VALUE` (BUG-R3-008). Danh sách gồm `public_booking_requests_enabled = false` và `public_show_prices = false`. Audit `config.changed` ghi `before.value`, `after.value`, `after.sameDayOverride: true`. `pg_notify('config_changed')` xóa cache.
- **Có khóa dựa vào việc chặn ghi đè trong ngày:**
  - bật lại công tắc khẩn (`true`) phải chờ sang ngày mới (test `public-site-r3-bed`, `v104-notice-allowlist`);
  - `payment_receiving_account` buộc hiệu lực từ ngày mai (kiểm riêng);
  - các khóa giá và luật (`min_stay`, `damage_catalog`, giá theo đêm…) được giữ nguyên trong ngày để báo giá và đơn tạo trong ngày nhất quán với nhau.
  
  Vì vậy **không** mở ghi đè trong ngày cho mọi tham số.

### B. Quyết định ARC

**Chọn (a), nhưng chỉ cho một khóa:** cho phép ghi đè dòng hôm nay của `long_stay_cleaning_fee_by_room`, bằng cơ chế `sameDayOverride` có sẵn, có audit trước/sau. Mọi khóa khác giữ luật hiện tại. Thêm phần FE của (b) cho mọi khóa: câu báo rõ ràng và nút "hiệu lực từ ngày mai".

Lý do:
- **Rủi ro thấp.** Ghi đè chỉ đổi những lần đọc *sau* thời điểm đó. Tiền đã ghi trước đó không đổi:
  - dòng folio `adhoc_cleaning_fee` lưu `unit_price_vnd` ngay lúc ghi;
  - yêu cầu dọn của khách chụp `fee_vnd_snapshot`.
  
  Không bảng nào khác đọc khóa này. Mã đã có sẵn (cờ + audit + xóa cache), nên chỉ phải thêm một tên khóa vào danh sách.
- **Đúng nhu cầu go-live.** Bảng có 10 căn, OWN nhập tay. Gõ nhầm hay quên một căn mà phải chờ tới ngày mai thì lễ tân phải giữ dòng phần chênh thêm một ngày (go-live-guide 5.3), dễ thu sai.
- **(b) đơn thuần không đủ.** Hướng dẫn "nhập cả 10 căn trong một lần lưu" không tránh được lỗi gõ nhầm. Nó chỉ dời lỗi sang hôm sau.
- Không ghi đè cho mọi tham số, vì các luật ở mục A sẽ mất tác dụng.

Rủi ro còn lại (chấp nhận, ghi nhận): khách mở danh sách yêu cầu dọn, thấy giá cũ, OWN sửa giá, rồi khách gửi. Khi đó `fee_vnd_snapshot` lấy giá mới, vì `feeAccepted` chỉ là cờ true/false, không kèm số tiền. Rủi ro này đã có với mọi lần đổi giá; lần này nó chỉ xảy ra trong vài phút OWN sửa bảng lúc go-live. Hướng xử lý: OWN nhập bảng trước khi mở trang khách cho khách dài hạn. Round sau cân nhắc thêm `feeAcceptedVnd`: số tiền khách đã đồng ý, server so với giá hiện tại, lệch thì trả 409.

### C. Việc cho từng vai

**BE (PR nhỏ, trước tag v1.0.7)**

| # | Việc |
|---|---|
| BE-1 | `parameters.service.ts`: thêm danh sách `SAME_DAY_EDITABLE_KEYS = new Set(['long_stay_cleaning_fee_by_room'])` cạnh `KILL_SWITCH_SAFE_VALUE`. Đặt `sameDayOverride: true` khi `input.key` thuộc danh sách **và** `effectiveFrom === today`. Không đổi `ParameterService.set()`. Hook kiểm của 197-03 vẫn chạy trước, như mọi lần lưu |
| BE-2 | Khi dòng hôm nay đã có và khóa không thuộc danh sách: đổi mã trường từ `VALIDATION_FAILED` thành `effectiveFrom: ALREADY_IN_FORCE`. Vẫn là `422 VALIDATION_FAILED`, `detail` giữ nguyên. Chỉ thêm, nên client cũ vẫn hiện câu chung như hiện nay. Ghi mã vào bảng mã trường và vào mô tả `setParameter` trong OpenAPI 0.3.15 (sinh lại meta/api-client nếu có đổi) |
| BE-3 | Test tích hợp: (1) OWN lưu bảng hôm nay 2 lần → 200 cả hai; giá trị đang có là bảng lần 2; audit lần 2 có `before` = bảng lần 1 và `sameDayOverride: true`; dòng folio ghi giữa hai lần giữ giá cũ. (2) MGR ghi đè trong ngày cũng được (theo A101). (3) Khóa khác (ví dụ `adhoc_cleaning_fee`) lưu lần 2 trong ngày → 422 `effectiveFrom: ALREADY_IN_FORCE`. (4) Test công tắc khẩn hiện có vẫn xanh |
| BE-4 | `erd.md` mục 4.1: thêm ngoại lệ thứ hai "`long_stay_cleaning_fee_by_room` – sửa trong ngày, audit `sameDayOverride`" |

**FE (#201 hoặc PR theo sau, trước tag)**

| # | Việc |
|---|---|
| FE-1 | S24, mọi khóa: lỗi `effectiveFrom: ALREADY_IN_FORCE` hiện câu rõ nghĩa (UXD duyệt, EN dẫn – VI hỗ trợ). Gợi ý: "A value is already in force today. Choose a later date. · Đã có giá trị hiệu lực hôm nay. Chọn ngày sau." Kèm nút "Effective tomorrow · Hiệu lực từ ngày mai" điền sẵn T+1 |
| FE-2 | Bảng giá dọn theo căn: lưu lại trong ngày được. Sau khi lưu, hiện "Saved – in force now · Đã lưu – áp dụng ngay". Không dùng màu đỏ hay câu cảnh báo |
| FE-3 | Test: lưu 2 lần trong ngày với bảng giá dọn → thành công; khóa khác → câu mới cùng nút ngày mai |

**PO/OPS (go-live-guide 7.1) và UXD**
- Go-live-guide 7.1: "OWN nhập cả 10 căn, hiệu lực từ hôm nay. Sửa lại trong ngày được; mỗi lần sửa đều được ghi lại. Bỏ dòng phần chênh sau khi đã kiểm giá trên một dòng thử." Không còn câu "chờ ngày mai".
- UXD duyệt câu của FE-1 và FE-2.

**QA:** kiểm lại BUG-R5-017 trên staging theo BE-3 (1) và (3), cùng FE-1.

Không ESC: đây là quyết định kỹ thuật thuộc ARC, không đổi giá hay quyền của INV.
