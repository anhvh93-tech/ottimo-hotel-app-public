# DOM review – ARC PR #158: hợp đồng 0.3.13 bổ sung 1j (C0313-38, `cancelledFrom`, 0.3.14 (y), (z))

- Người review: DOM | Round 5 (v1.0.5) – Review | Ngày: 07/11/2026
- Đối tượng: PR #158 (`r5-contract-1j`), commit **`bf3070fa`**. DOM chỉ xét phần chạm luật DOM:
  - `contract-0.3.13.md` mục 1.31 (dòng C0313-38, DOM 148-02), 1.21 ý 4, 1.26 (y) và (z);
  - `openapi.yaml`: `createDepositNotice`, `recordPayment` (B), `Reservation.cancellation.cancelledFrom`;
  - `ARC-on-contract-0.3.13-reviews.md` mục 12.
  DOM không xét C0313-34, SEC 1I-02 và các ý (k)–(x) khác của 1.26.
- Đối chiếu:
  - DOM `DOM-on-be-d2-pr-148.md` 1.1, 1.3, thẻ 148-02, 148-05;
  - DOM `DOM-on-ops-pr-155-k14.md` thẻ 155-05;
  - DOM `rules-v1.0.5.md` 11.4 mục 2 (f) và 5;
  - ARC `ARC-on-be-d2-pr-148.md` thẻ ARC-DOM 148-05.
- Cách đọc: `gh pr diff 158`, `git grep`/`git show` trên ref của PR và `origin/main`. Không checkout nhánh, không chạy mã. Không dữ liệu khách, không số liệu production, không tỷ lệ hay số tiền hoa hồng.

## 0. Kết luận

**DUYỆT.** Chữ của ARC khớp đúng luật DOM:
- luật đóng mục `deposit_after_cancel` (C0313-38), kể cả vế "khoản thu ghi **trước** lúc báo không đóng mục của báo sau";
- vế "đóng khi đã khôi phục **và** đã đối soát" đã bỏ khỏi hợp đồng;
- luật `cancelledFrom` khớp thẻ 148-02 và 11.4 2 (f);
- (y), (z) chép đúng hai thẻ của DOM.

DOM trả lời luôn thẻ ARC-DOM 148-05 mà (y) đang chờ: **đồng ý** (mục 2).

Bốn thẻ, không chặn gộp:
- 158-01 Minor: còn một chỗ sót câu cũ, ở `state-machines.md` B19;
- 158-02, 158-03, 158-04 Suggestion: chữ 0.3.14.

Đề xuất ORC đóng FB-R5-DOM-ARC-148-02 khi BE-D2 gộp PR nhỏ thêm trường. Không ESC.

## 1. Đối chiếu

### 1.1 C0313-38 – lúc đóng mục `deposit_after_cancel`

| Chỗ | Chữ ở #158 | So với DOM | Kết quả |
|---|---|---|---|
| `recordPayment` (B) | Thay câu "đóng khi đã hoàn xong (hoặc đã khôi phục **và** khoản thu đã đối soát – 5B-2)" bằng nguyên văn DOM 148 mục 1.3. Mục đóng khi có khoản thu ghi sau lúc đóng đơn, trong lúc mục mở; báo `open` thành `handled` cùng giao dịch; 5B-2 đóng ngay, không chờ đối soát; hoặc "Không thấy tiền" | Đúng từng chữ | Khớp |
| `createDepositNotice` | Thêm: "khoản thu ghi **trước** lúc báo không đóng mục của báo sau, vì báo có thể nói về một lần chuyển khác; FD+ kiểm rồi đóng tay, ghi mã phiếu thu vào ghi chú" | Đúng từng chữ, cả lý do | Khớp |
| Contract 1.21 ý 4 (5B-2) | Gạch vế "đóng khi đã khôi phục **và** khoản thu đã đối soát". Thay bằng "khoản thu của lần khôi phục tự đóng `deposit_after_cancel` ngay lúc ghi, không chờ đối soát" | Đúng DOM 1.1 | Khớp |
| Contract 1.31 dòng C0313-38 | Tóm đúng ba chỗ trên. Ghi "#148 đã đúng, không đổi mã"; QA ca (e') theo DOM 1.1 | Đúng | Khớp |

**"#148 đã đúng, không đổi mã" – DOM kiểm lại trên `main` và thấy đúng:**
- Khoản thu ghi sau khi đóng làm hai việc trong cùng giao dịch:
  - mọi báo `open` của đơn thành `handled`, kèm mã khoản thu;
  - mục đóng theo khóa trùng `deposit_after_cancel:<đơn>`.
- Khóa trùng chỉ chặn khi mục **chưa đóng**. Vì vậy:
  - khoản thu ghi trước lúc báo không đóng được gì, vì lúc đó chưa có mục;
  - báo đến sau mở mục mới. FD+ kiểm tay.
- Cách chạy này đúng vế "khoản thu ghi trước lúc báo không đóng mục".

**Câu cũ còn sót:** `product/docs/state-machines.md` SM-01, dòng B19, cột kết quả vẫn ghi "mục 'Cần chú ý' `deposit_after_cancel` đóng khi đã khôi phục **và** khoản thu đã đối soát". Xem thẻ 158-01. B19 chỉ áp từ 0.3.14, nên hôm nay chưa mã nào đọc dòng này. `rounds/round-05/outputs/BE/pr-b3.md` dòng 69 là ghi chép cũ của BE, giữ nguyên.

### 1.2 `cancelledFrom` (DOM 148-02)

| Ý | Chữ ở #158 | Kết quả |
|---|---|---|
| Giá trị | `hold` \| `confirmed`, đọc `reservation.status_before_cancel`, không migration | Đúng |
| Ai thấy | `x-visible-to` FD+ (bảng sinh `openapi-schemas.ts` cũng đúng bốn vai) | Đúng: chỉ FD+ ghi khoản thu trên đơn đã đóng |
| Luật Desk | `hold` → `deposit`; còn lại (`confirmed`, đơn `no_show`) → `charge` | Đúng 11.4 2 (f) |
| Gửi sai | Vẫn 422 `NOT_ALLOWED` ở `type` | Đúng, máy chủ vẫn là chốt chặn |
| Thứ tự PR | BE-D2 PR nhỏ sau #148, gộp **trước** PR Desk 5B-1 của FE-A | Đúng. Ô 9.1 không có ô chọn loại, nên Desk cần trường này trước |

**Desk và máy chủ không thể lệch nhau.** DOM soát từng loại đơn trên `main`:

| Đơn | Desk (theo `cancelledFrom`) | Máy chủ (`afterClosureType`) |
|---|---|---|
| Hủy lúc giữ chỗ (J1, B5) | `hold` → gửi `deposit` | `status_before_cancel = hold` → `deposit` |
| Hủy sau xác nhận (B10) | `confirmed` → gửi `charge` | `confirmed` → `charge` |
| `no_show` | không có `cancellation` → gửi `charge` | `confirmed` (B11 ghi cố định) → `charge` |
| Đã trả phòng | không có `cancellation` → gửi `charge` | `null` → `charge` |

Không có đơn hủy nào mang `status_before_cancel` rỗng. Ràng buộc `reservation_status_before_cancel_check` buộc đơn `cancelled`/`no_show` phải có `hold` hoặc `confirmed`. Vì vậy DOM bỏ câu hỏi về đơn cũ rỗng.

### 1.3 Danh sách 0.3.14 (y) và (z)

- **(y) DOM 148-05:**
  - Đúng ý chính: cờ "Có thể trùng" cho hai khoản cùng số trên **cùng** đơn, cả hai ghi sau khi đóng.
  - Chữ còn thiếu ba điều của thẻ 148-05 (thẻ 158-03):
    - cờ mang mã của chính đơn;
    - khoản thường của cùng đơn không có cờ;
    - nên đọc dấu "ghi sau khi đóng" lưu lúc ghi, khi (x)(iii) có.
- **(z) DOM 155-05:**
  - Chép đúng: chỉ khi K14 lần 1 ra (a) hoặc (b1) > 0; chỉ OWN, sau nhận phòng, lý do bắt buộc; ý (1) đồng bộ lại (`closer_corrected`); ý (2) `closerUserId: null` bỏ người chốt, `void` dòng còn sống, không tạo dòng mới; xong trước US-089.
  - ARC ghi thêm hai hệ quả, đúng: ý (2) đổi schema và đổi luật "đổi" của 1h; ý (1) đổi luật 409 `checked_out` của 1i.
  - Còn thiếu hai chốt về tiền (thẻ 158-02).

## 2. Quyết định DOM về thẻ ARC-DOM 148-05 (đang chờ ở (y))

**Đồng ý thêm luật.** Đây đúng là ca gốc của BUG-R5-002:
1. Sale báo "khách đã chuyển" đúng hạn.
2. Lễ tân chưa xác nhận.
3. J1 hủy giữ chỗ.
4. Tiền có thể đã về, mà "Cần chú ý" không có dòng nào và FD+ không nhận tin.

Hậu quả: khách đến hoặc gọi hỏi về một căn đã nhả.

Luật DOM, để ARC ghi ở (y):
- **Khi nào mở mục:** đơn chuyển sang đã đóng mà còn ít nhất một báo "khách đã chuyển" ở trạng thái `open`. Các đường đóng đơn: J1 (`hold_expired`), B5 (hủy giữ chỗ), B10 (hủy tay), B11 (no-show).
  - Làm ở cùng chỗ với việc cho hết hạn VietQR đang chờ của BUG-R5-002, trong giao dịch đóng đơn.
  - Mở `deposit_after_cancel` với **cùng khóa trùng**, nên báo sau lúc đóng không sinh mục thứ hai.
  - Báo FD+ (FD, FDL, MGR, OWN), tin chỉ có mã đơn.
  - Không báo sale, theo SEC S8: sale đọc trạng thái đơn trong danh sách của mình.
- **Báo cũ:** giữ `open`, không tự đóng lúc hủy. Khoản thu ghi sau sẽ chuyển báo thành `handled`, như C0313-38.
- **Đóng mục:** theo đúng C0313-38: có khoản thu ghi sau lúc đóng đơn, trong lúc mục mở; hoặc FD+ bấm "Không thấy tiền" kèm ghi chú. Không thêm cách đóng nào.
- **Chữ tin:** `today.money_after_cancel` ghi "đơn đã hủy". Với đơn no-show, UXD xem có cần chữ riêng không, cùng đợt.
- **Lịch:** việc nhỏ, không migration (ARC ước khoảng 0,25 ngày BE). PO xếp lịch:
  - Nếu BE-D2 còn chỗ mà không dời tag v1.0.5, làm ngay ở v1.0.5. Ca này để tiền khách nằm ngoài sổ mà không ai được nhắc.
  - Nếu không, làm ở v1.0.6 cùng 5B-2. Tới lúc đó, BA thêm một câu sổ tay: mỗi sáng sau J1, FD+ mở các đơn tự hủy trong đêm, xem mục "Báo đã chuyển" của đơn. Đơn nào còn báo chưa xử lý thì đối chiếu sao kê.
- Không phải việc của chủ đầu tư: chỉ thêm lời nhắc nội bộ, không đổi luật tiền.

## 3. Thẻ

### FB-R5-DOM-BA-158-01
- Mức độ: Minor – BA (`state-machines.md`), ARC xem. Sửa trước khi BE viết mã 5B-2 (v1.0.6), hoặc thêm một dòng ngay ở #158 nếu ARC tiện.
- Vị trí: `product/docs/state-machines.md` SM-01, dòng B19, cột kết quả: "mục 'Cần chú ý' `deposit_after_cancel` đóng khi đã khôi phục **và** khoản thu đã đối soát".
- Vấn đề: vế ARC vừa bỏ ở hợp đồng (1.21 ý 4, `recordPayment` (B)) còn nguyên ở sơ đồ trạng thái.
- Vì sao quan trọng: BE làn 5B-2 và QA đọc B19 khi viết mã và ca test. Nếu theo B19, mục sẽ treo tới lúc đối soát. FD+ thấy một mục "Tiền về cho đơn đã hủy" trên một đơn đã khôi phục và đã ghi tiền, rồi dễ bấm "Không thấy tiền" sai.
- Đề xuất sửa: thay vế đó bằng "khoản thu của lần khôi phục tự đóng `deposit_after_cancel` ngay lúc ghi, không chờ đối soát (C0313-38, DOM 148 mục 1.1)". BA tăng bản `state-machines.md`.
- Trạng thái: Open

### FB-R5-DOM-ARC-158-02
- Mức độ: Suggestion – ARC (chữ 0.3.14 (z)), BE-H khi làm. Chỉ khi (z) được làm.
- Vị trí: `contract-0.3.13.md` 1.26 (z).
- Vấn đề:
  - (z) ghi "dòng chưa `void` → `void`", nhưng không nói rõ dòng `payable`/`paid` thì sao;
  - (z) không nói dòng mới của ý (1) lấy ngày nào.
  Thẻ 155-05 cũng chưa ghi hai điều này.
- Vì sao quan trọng: (z) phải xong trước luồng chi v1.3 (US-089). Đó là lúc có dòng `payable`/`paid`.
  - Nếu ý (2) `void` cả dòng đã chi, sổ hoa hồng mất dấu tiền đã trả.
  - Nếu dòng mới của ý (1) lấy lại ngày cũ, dòng đó rơi vào kỳ chi đã khóa.
- Đề xuất sửa: thêm vào (z):
  - cả hai ý giữ 409 `payable`/`paid` của 1h, là bước cuối của thứ tự lỗi (k). Hai ý chỉ chạm dòng `projected`/`earned`;
  - dòng `void` giữ `recognized_at`;
  - dòng mới của ý (1) lấy ngày như đổi người chốt sau trả phòng ở #157 (lúc sửa).
- Trạng thái: Open

### FB-R5-DOM-ARC-158-03
- Mức độ: Suggestion – ARC (chữ 0.3.14 (y)), BE khi làm.
- Vị trí: `contract-0.3.13.md` 1.26 (y), phần DOM 148-05.
- Vấn đề: (y) chỉ ghi "hai khoản cùng số trên **cùng** đơn, cả hai sau khi đóng". BE dễ làm rộng hoặc hẹp hơn luật, vì thiếu ba ý của thẻ 148-05.
- Vì sao quan trọng:
  - Cờ bật cho khoản thường thì lễ tân quen bỏ qua cờ, vì cọc và phần còn lại cùng số là chuyện thường.
  - Cờ tắt sau khi khôi phục thì hở lại đúng ca hoàn hai lần.
- Đề xuất sửa: ghi rõ ở (y):
  - **Phạm vi:** một nhánh thêm vào truy vấn "Có thể trùng" đang chạy, giữ nguyên điều kiện: chuyển khoản/VietQR, cùng số, trong 24 giờ;
  - **Mã trên cờ:** cờ mang mã của chính đơn;
  - **Khoản thường:** khoản ghi trước khi đóng trên cùng đơn không bật cờ;
  - **Sau 0.3.14:** khi (x)(iii) có dấu lưu lúc ghi, nhánh này đọc dấu đó, không đọc `AFTER_CLOSURE_SQL`. Như vậy cờ không mất khi đơn được khôi phục (B12/B19).
- Trạng thái: Open

### FB-R5-DOM-ARC-158-04
- Mức độ: Suggestion – ARC (chữ 0.3.14, cùng lúc với (y)). DOM tự sửa 11.4 mục 5 ở bản luật kế tiếp.
- Vị trí: `createDepositNotice`, câu nền "Mục tự đóng khi đơn có khoản thu ghi sau lúc báo (5B-1, 5B-2)". Câu này chép từ DOM 11.4 mục 5.
- Vấn đề:
  - Hôm nay mục chỉ mở lúc báo, nên "sau lúc báo" và "sau lúc đóng đơn, trong lúc mục đang mở" (`recordPayment` (B)) cho cùng kết quả.
  - Khi luật ARC-DOM 148-05 (mục 2) có, mục có thể mở lúc **hủy**, với báo gửi **trước** đó. Khi ấy "sau lúc báo" lại tính cả khoản thu ghi giữa lúc báo và lúc hủy, vốn không được đóng mục.
- Vì sao quan trọng: nên chỉ có một câu luật cho cả hai đường. QA viết ca (e') theo một câu, BE không phải chọn.
- Đề xuất sửa: khi ghi (y), đổi câu nền của `createDepositNotice` thành "mục tự đóng khi đơn có khoản thu ghi sau lúc đóng đơn, trong lúc mục đang mở (5B-1, 5B-2)", giống `recordPayment` (B). Mã không đổi: mục đóng theo khóa trùng chỉ khi mục còn mở.
- Trạng thái: Open

## 4. Điểm làm tốt

- ARC chép nguyên văn chữ DOM 1.3. ARC còn gạch rõ câu cũ ở 1.21 ý 4, không xóa im lặng, nên người đọc thấy luật đã đổi.
- `cancelledFrom` đủ các ý: nguồn cột có sẵn, vai thấy, luật Desk, máy chủ vẫn chặn, thứ tự PR. FE-A không phải đoán.
- 1.31 tách rõ: trường nào đổi schema, ý nào chỉ là chữ. Mục 12 ở tệp phản hồi cho biết thẻ nào Done, thẻ nào hoãn 0.3.14.
- (z) giữ đúng điều kiện "chỉ khi K14 > 0" và hạn "trước US-089". ARC còn chỉ ra phần nào đổi schema.

## 5. Giả định

- PR head vẫn là `bf3070fa` lúc ORC gộp. Nếu ARC đẩy thêm commit chỉ để sửa 158-01, DOM không cần xem lại.
- Luật ARC-DOM 148-05 (mục 2) không đổi tiền và không đổi quyền, chỉ thêm lời nhắc nội bộ, nên không cần chủ đầu tư quyết.
- DOM chỉ đọc chữ và mã trên `main` và trên ref của PR, không chạy test.

## 6. Dòng decision log (ORC ghi)

`| 2026-11-07 | 5 | **DOM – review ARC PR #158 (hợp đồng 0.3.13 bổ sung 1j) @ bf3070fa: DUYỆT về nghiệp vụ.** C0313-38 khớp nguyên văn DOM 148 mục 1.3: deposit_after_cancel đóng khi có khoản thu ghi sau lúc đóng đơn trong lúc mục mở (báo open → handled), 5B-2 đóng ngay không chờ đối soát, hoặc "Không thấy tiền"; vế "khoản thu ghi trước lúc báo không đóng mục của báo sau" đúng chữ; vế "đóng khi đã khôi phục và đã đối soát" đã bỏ ở hợp đồng (1.21 ý 4, recordPayment (B)); "#148 đã đúng, không đổi mã" đúng (khóa trùng chỉ chặn mục còn mở). cancelledFrom khớp 148-02 và 11.4 2 (f): Desk và máy chủ cho cùng type ở mọi loại đơn, không có đơn hủy rỗng status_before_cancel (ràng buộc CHECK). (y), (z) chép đúng DOM 148-05, 155-05. **DOM đồng ý ARC-DOM 148-05:** đóng đơn (J1, B5, B10, B11) mà còn báo "khách đã chuyển" open → mở deposit_after_cancel cùng khóa trùng, báo FD+ chỉ mã đơn, không báo sale, đóng theo C0313-38; PO xếp v1.0.5 nếu không dời tag, nếu không thì v1.0.6 kèm câu sổ tay. Thẻ: 158-01 Minor BA state-machines B19 còn vế cũ; 158-02 Suggestion ARC (z) giữ 409 payable/paid, void giữ recognized_at, dòng mới lấy ngày lúc sửa; 158-03 Suggestion ARC (y) ghi rõ phạm vi cờ cùng đơn; 158-04 Suggestion ARC câu nền createDepositNotice theo câu recordPayment (B). Đóng FB-R5-DOM-ARC-148-02 khi BE-D2 gộp PR thêm trường. Không ESC | DOM | rounds/round-05/reviews/DOM-on-arc-pr-158.md |`
