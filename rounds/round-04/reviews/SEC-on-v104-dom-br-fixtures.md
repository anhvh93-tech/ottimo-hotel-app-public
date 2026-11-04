# SEC review P4-20 `v104/dom-br-fixtures` (số hoa hồng, dữ liệu cá nhân trong fixtures)

- Người review: SEC | Round 4, đợt v1.0.4, bước **Review** | 04/11/2026
- Đối tượng: `origin/v104/dom-br-fixtures` @ **`6bddbc29`** (3 commit trên `c6cd32a8`: `e116c2b4`, `ceb05937`, `6bddbc29`). So với `origin/main` @ `7b5b6117`.
- Tệp trong diff: `product/docs/business-rules.md`, `product/tests/fixtures/br-examples.json`, `product/tests/tools/validate-fixtures.mjs`, `product/tests/test-cases/r1-main-flows.md`, `product/tests/e2e/api/stay-checkout.s3.api.spec.ts`, `rounds/round-04/outputs/DOM/v1.0.4-p4-20-br-fixtures.md`.
- Căn cứ: SEC-on-commission-numbers (thẻ SEC-DOM-01, G1–G4), plan-v1.0.4 P4-20 ("SEC: số hoa hồng").
- Không sửa tệp nào ngoài tệp này. **Tệp này không ghi tỷ lệ hay số tiền hoa hồng/thưởng nào, cũ hay mới.**

---

## 0. Kết luận

**ĐẠT.** Không có thẻ Blocker, Major hay Minor.
- **Không có số hoa hồng/thưởng của bảng nội bộ 01/11** trong diff, trong nội dung nhánh hay trong thông điệp commit.
- Fixtures **không có dữ liệu cá nhân thật**.
- **FB-R4-SEC-DOM-01: Verified.**

## 1. Cách kiểm số hoa hồng (không đưa số vào repo)

Bảng nội bộ nằm ngoài git (`00-brief/context/pricing/` có trong `.gitignore`, `git check-ignore` xác nhận). SEC đọc bảng **cục bộ** để biết cấu trúc và mức của mục hoa hồng/thưởng, rồi kiểm diff nhánh bằng script chạy trên máy (không lưu số vào tệp nào trong repo):

| Kiểm | Kết quả |
|---|---|
| (1) Mọi dòng thêm có từ khóa hoa hồng/thưởng/hiệu suất/commission/bonus/payout kèm chữ số | Toàn bộ là nhãn "ví dụ theo tỷ lệ cũ – trước 01/11, hết hiệu lực" gắn vào số **cũ** đã có (ESC-005), hoặc câu "không ghi số ở kho mã". Không có số mới |
| (2) So từng giá trị có khóa `commission*`/`bonus*`/`payout*` trong `br-examples.json` giữa `main` và nhánh | 33 → 35 giá trị. Hai giá trị mới chỉ là chữ của quy ước `oldCommissionFigures` (nhãn, `validUntil`, `replacedBy`), không có số |
| (3) Mẫu đặc trưng của cấu trúc mới (cơ sở tính, cách chia đợt chi, thưởng hiệu suất, mức theo kỳ hạn mới, phụ trội khách nước ngoài) | 0 kết quả |
| (4) Đường dẫn bảng nội bộ hoặc tên tệp bảng trong diff | 0 kết quả |
| (5) Thông điệp commit | Không có tỷ lệ, số tiền hoa hồng hay địa chỉ |

Ghi chú: giá phòng đêm/tháng, giảm theo kỳ hạn, phí dịch vụ, điện nước của bảng 01/11 (mục 1–4 của bảng INV) **có** trong BR và fixtures. Đây là phần INV cho hiển thị công khai (website), không thuộc phạm vi bảo mật. INV chỉ giữ kín mục hoa hồng/thưởng.

## 2. Kiểm dữ liệu cá nhân

| Kiểm | Kết quả |
|---|---|
| Số điện thoại VN, số dạng `+<mã nước>`, dãy 12 chữ số (CCCD), dạng hộ chiếu (chữ + 7–8 số) trên dòng thêm | 0 |
| Trường `name`/`fullName`/`phone`/`email`/`idNumber`/`passport` có giá trị trên dòng thêm | 0 |
| Email | 0 |
| BR-428-10 (ca trần ba phần, Agoda 302 → 301) | DOM ghi rõ số tự đặt để thử thứ tự trừ, không phải số khách thật. Không có tên, mã OTA hay ngày thật của khách |

## 3. FB-R4-SEC-DOM-01 – Verified
- BR-527-05, BR-527-06: có `oldCommissionFigures` (`validUntil: 2026-10-31`, `replacedBy` bảng nội bộ) và ghi chú "Phần hoa hồng: ví dụ theo tỷ lệ cũ…".
- BR-903-03 (và 903-01/02/04, 212-01/02, 326-01): có `supersededBy` + `validUntil: 2026-10-31` + ghi chú.
- `business-rules.md` BR-326 và mục 13 `commission_payout`: ghi "Từ 01/11 theo bảng nội bộ INV 01/11 (không ghi số ở kho mã)" và tách phần "Trước 01/11 – hết hiệu lực".
- Quy ước `oldCommissionFigures` ghi rõ ca hoa hồng mới (H2) chỉ dùng tham số thử `test_rate_*` (G3).
- BR-208-02/03 (hoa hồng thuê tháng theo bảng mới) đã **bỏ** và đưa vào `retiredIds`; validator chặn dùng lại id. Đúng hướng: không có "chỗ trống" để ai đó điền số mới vào sau.

## 4. Ghi chú cho ORC (không phải thẻ)
- Còn số cũ ở màn mẫu hifi (`design/hifi/11-reservation.html`, `12-sales-quote.html`), `production-defaults.ts`, seed và `LEASE_TIERS` của validator. Theo SEC-on-commission-numbers, số cũ không coi là bí mật ([GIẢ ĐỊNH – chờ INV xác nhận] đã ghi 04/11). Việc gắn nhãn hifi là của UXD; bỏ số cũ khỏi mã là của H2 (SEC-BE-01). Không chặn P4-20.
- `v104/be-lease-prices` đang dựa trên `ceb05937`, chưa có `6bddbc29` (khác ở `validate-fixtures.mjs`). Chỉ là thứ tự gộp, không ảnh hưởng bảo mật. PR-N gộp trước thì BE-C rebase.

## 5. Điểm làm tốt
- Biên bản DOM tự khai "không ghi tỷ lệ hay số tiền hoa hồng/thưởng nào", và diff đúng như vậy.
- Quy ước `oldCommissionFigures`/`supersededBy`/`retiredIds` làm cho số cũ không bị dùng nhầm làm đáp án và không bị "cập nhật" thành số mới.
- Validator được đột biến thử (10 đột biến, bắt cả 10), nên "0 lỗi" có nghĩa.

## 6. Dòng decision-log đề xuất (ORC ghi khi commit, SEC không sửa decision-log)

`| 2026-11-04 | 4 | **SEC – review P4-20 dom-br-fixtures @ 6bddbc29: ĐẠT** (rounds/round-04/reviews/SEC-on-v104-dom-br-fixtures.md): không có số hoa hồng/thưởng của bảng nội bộ 01/11 trong diff, nội dung nhánh hay commit (SEC đối chiếu cục bộ với bảng ngoài git, không ghi số vào repo); fixtures không có PII thật; giá phòng/phí 01/11 là phần công khai. FB-R4-SEC-DOM-01 Verified (BR-527-05/06, 903-xx, 212-xx, 326-01, BR-326, mục 13 commission_payout; BR-208-02/03 retired) | SEC | Quyền SEC |`
