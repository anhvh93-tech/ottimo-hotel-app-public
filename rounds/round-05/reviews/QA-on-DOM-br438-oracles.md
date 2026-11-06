# QA review – DOM oracle BR-438-04 (review PR #110 mục 3.5, BR-438 v0.5.14)

- Người review: QA | Round 5 – Phản hồi & sửa | Ngày: 07/11/2026
- Bối cảnh: lúc sửa oracle theo thẻ FB-R5-DOM-QA-BR438-01, QA đọc mã:
  - `main` @ `dce1c0fd`;
  - PR #110, nhánh `r5-b2` @ `c71ae350`.
- Đối chiếu:
  - BR-438 v0.5.14 (1), (2), (3);
  - DOM `rounds/round-05/reviews/DOM-on-be-prs-101-108-110.md` mục 3.1, 3.5;
  - `rounds/round-05/outputs/DOM/rules-v1.0.5.md` 14.1;
  - rbac A32.
- Không dữ liệu khách.

### FB-R5-QA-DOM-BR438-01
- Mức độ: Minor. Không chặn v1.0.5: dòng hệ thống trên folio mở đã có BR-438-07 (B15).
- Vị trí:
  - `product/tests/fixtures/br-examples.json` BR-438-04;
  - DOM review PR #110 mục 3.5, dòng BR-438-04 (`source` → `checkout`, "B18 lưu `checkout`");
  - BR-438 cột ví dụ: "Phụ thu trả muộn Desk tự ghi khi Hạnh bấm Trả phòng → Hạnh bỏ dòng → bị chặn (dòng hệ thống); muốn miễn → FOC theo hạn mức BR-433".
- Vấn đề: dòng trả muộn B18 (`source = checkout`) không bao giờ nằm trên folio mở.
  - `checkout.service.ts` ghi dòng này (`replaceLateCharge` với `source: 'checkout'`), rồi gọi `folios.settle` trong **cùng giao dịch**. QA không thấy đường nào mở lại folio.
  - BR-438 chỉ áp cho folio chưa `settled`. Dòng B18 luôn ở folio `settled`, nên A32 áp, không phải BR-438.
  - Ở `folio-lines.service.ts` `adjust` (cả `main` và `r5-b2`), kiểm A32 đứng **trước** kiểm BR-438: `if (folio.status === 'settled' && !managers) throw problem('FORBIDDEN_ACTION')`.
  - Kết quả: FD/FDL nhận 403 `FORBIDDEN_ACTION` **không có** `requiredFlow`. MGR được, theo A32 và BR-433 (e).
  - Vậy `allowed: [false, false, true]` của oracle vẫn đúng. Riêng `hint: foc_request` thì không dựng được ca trên mã.
- Vì sao quan trọng:
  - test dựng theo BR-438-04 sẽ đỏ ở `hint`, hoặc phải dựng một trạng thái không có thật (dòng `checkout` trên folio mở);
  - câu ví dụ "muốn miễn → FOC theo hạn mức BR-433" ngầm nói lễ tân có đường FOC sau Trả phòng, mà A32 nói sau Trả phòng chỉ MGR+ sửa. Desk nói với lễ tân điều gì ở đây thì cần DOM chốt.
- Đề xuất sửa (DOM chọn):
  - **A (QA đề xuất).** Ghi BR-438-04 thành ca A32: dòng `checkout` trên folio `settled`. FD/FDL 403 `FORBIDDEN_ACTION`, không `requiredFlow`. MGR được (BR-433 (e)). Bỏ `hint` khỏi `expected`. Sửa câu ví dụ của BR-438 thành "sau Trả phòng: theo A32, lễ tân nhờ quản lý". Câu "đặt giờ trả muộn" v0.5.14 đã có, giữ.
  - **B.** Giữ BR-438-04 là luật đích, kèm `pendingFix`, nếu DOM muốn lễ tân có lối "Gửi miễn có duyệt" cho dòng trả muộn sau Trả phòng. Khi đó cần thẻ cho ARC/BE: 403 trên folio `settled` cũng mang `requiredFlow`, và FOC được xin trên folio `settled`.
- Tới khi DOM trả lời:
  - QA đã đổi `source` của BR-438-04 thành `checkout` như DOM yêu cầu. `expected` không đổi. Ghi chú của dòng nêu lệch này;
  - ca staging TC-V105-B438-04 (`rounds/round-05/qa/v1.0.5-test-cases.md` mục 2) chỉ kiểm `allowed` và ghi lại thân 403.
- Trạng thái: Open
