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
