# UXD review – FE PR #142 (V5-11 Desk: Trả sớm trong 00:00–05:59)

- Người review: UXD | Round 5 – bước **Review** | 07/11/2026
- Đối tượng (chỉ đọc, không đẩy lên nhánh PR): **#142** `r5-fe-v5-11` @ `52a14957` (draft, gộp sau BE #114). Nội dung ở `ae2b0e9e` + `52a14957`. Báo cáo FE: `rounds/round-05/outputs/FE/v5-11-desk.md` (trên `main`).
- Đối chiếu:
  - chữ: `rounds/round-05/outputs/UXD/copy-v1.0.5.md` bản 2.2 mục 9.13 (`7a141dbf`);
  - luật: DOM `rules-v1.0.5.md` mục 2, hợp đồng 0.3.13 mục 1.21 (`earlyDeparture`, `Problem.minNewDepartureDate`, `Problem.useCheckout`);
  - máy chủ: `services/api/src/modules/reservations/internal/allowed-actions.ts` (`checkOutOpen`);
  - thương hiệu: `00-brief/context/brand/brand-guidelines.md`, `product/design/design-system.md`.
- Cách kiểm:
  - đọc `git diff main...origin/r5-fe-v5-11` (5 tệp);
  - dựng worktree tách rời ở `52a14957` trong scratchpad, cài gói offline, chạy Vite với mock MSW;
  - chạy Chromium qua Playwright, khóa đồng hồ trang (`page.clock`), múi giờ Asia/Ho_Chi_Minh, đăng nhập qa.fd (mật khẩu đọc từ `seed.ts`, không in ra);
  - chụp ở 1440 px và 390 px. Ảnh có tên khách giả của mock, để ngoài repo (`scratchpad/uxd-shots/142/` của phiên UXD);
  - chạy `v5-11-early-departure-night-fea.test.tsx` ở `52a14957`: 10/10 đạt;
  - viết 2 ca test tạm tái hiện thẻ 01 (không commit, xóa cùng worktree). Cả 2 ca đều đỏ ở `52a14957`.
- Các trạng thái đã chạy trên trình duyệt:
  - **A.** 03:00 ngày 08/11 (ngày nghiệp vụ 07/11), đơn trực tiếp 06/11 → 10/11. Mở Trả sớm, qua bước ② và ③.
  - **B.** Bước ② mở lúc 23:58 ngày 07/11, đồng hồ sang 00:05, lễ tân tick "Đã báo khách…", rồi bấm Sửa lại.
  - **D.** 03:00, ép 409 `minNewDepartureDate` = 09/11 (máy chủ khác ước tính của Desk), rồi bấm "Dùng 09/11/2026".
  - **E.** 03:00, ép 409 `useCheckout` ở lần tính thử.
  - **F.** 03:00, cận cảnh dòng phí ở bước ②.

## 0. Kết luận

**#142 @ `52a14957`: DUYỆT CÓ ĐIỀU KIỆN.**

- **Điều kiện gộp:** sửa **FB-R5-UXD-FE-142-01 (Major)**. Hộp Trả sớm mở qua 00:00 bị kẹt ở bước ②. Ở bước ① thì hiện câu khoảng ngày chung, không có câu 9.13. Sửa trong PR này, vì đây đúng là ca V5-11 phía Desk sinh ra để xử lý.
- FB-R5-UXD-FE-142-02 (Suggestion) không chặn gộp, để v1.0.6.
- **Không có ESC.** Chữ và cách hiện thuộc quyền UXD; luật thì DOM và hợp đồng đã chốt.
- **Thương hiệu:**
  - màu lấy từ token DS: dòng phụ Stone Grey `rgb(107, 103, 96)`, lỗi ô dùng màu `danger` có sẵn;
  - `Alert info` dùng `--info`, là ngoại lệ chức năng đã có ở DS v0.4;
  - tiêu đề Lora, nội dung Be Vietnam Pro, mã đơn JetBrains Mono;
  - không có emoji. PR không thêm CSS hay màu mới (chỉ dùng tiện ích `mb-16` có sẵn).

## 1. Đối chiếu từng mục ORC hỏi

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| 4 khóa dùng đúng như 9.13 | **Đạt** | `err.min_date` và `use_min_date` cùng `{date}` = `date(serverMin)`. `use_checkout` nằm trong `Alert tone="info" role="alert"`, khung bọc nhận focus. Nút chính dùng lại `checkout_now`. `fee_business_date` hiện dưới `row_fee` (bước ②) và nối sau `done_fee` (bước ③). Chữ trên màn trùng nguyên văn `strings-vi.json` (ca A, D, E), ngày dạng dd/mm/yyyy. |
| Thứ tự 409: `useCheckout` → `minNewDepartureDate` → câu chung | **Đạt** | `nightHint()` xét `useCheckout === true` trước, rồi `minNewDepartureDate` (dạng `YYYY-MM-DD`); còn lại trả `null` → câu chung như cũ. Áp ở cả lần tính thử lẫn lần ghi. `otherPreviewError` loại 409 có gợi ý nên không hiện thêm câu chung (ca D, E). |
| Khoảng ngày rỗng trong W → `use_checkout`, không gọi máy chủ | **Đạt (đọc mã + test FE ca 9)** | `useCheckout = serverCheckout \|\| (night && stayEnd <= estimate)`. Khi đó `sig = ''` nên không có `dryRun`; đơn chỉ được đọc lại một lần (GET) để nút theo `allowedActions`. Không dựng lại được trên trình duyệt, vì mock ẩn nút Trả sớm cho lượt rời hôm nay (đúng luật). |
| `fee_business_date` chỉ trong W và phí > 0 | **Đạt** | Bước ②: `feeDate={night ? today : undefined}`, và dòng chỉ hiện khi `feeDate && earlyDepartureFeeVnd > 0`. Bước ③: nằm trong nhánh `earlyDepartureFeeVnd > 0`, có `night ?`. Ca A: "Đang sau nửa đêm nên phí ghi vào ngày nghiệp vụ 07/11/2026." ở cả hai bước. Ca F: cùng cỡ chữ (13 px), độ đậm và màu với dòng phụ của "Sẽ xin hoàn cho khách", nên hai dòng đọc như một bộ. |
| Lỗi bắt buộc: "Trả phòng ngay" ở bước ③ | **Đạt** | `canCheckOut` chỉ còn dựa vào `allowedActions` có `check_out`. Máy chủ chỉ mở B18 vào ngày đi hiệu lực, hoặc từ 00:00 của ngày đó (`checkOutOpen`, `isCheckoutDay`). Vì vậy câu `checkout_now_hint` "Ngày rời là hôm nay." vẫn đúng, và ngày rời muộn hơn vẫn ra `later_hint`. Ca A ở 03:00: có "Ngày rời là hôm nay…" và nút Trả phòng ngay, không có "nút Trả phòng hiện vào ngày đó". |
| 390 px / 1440 px | **Đạt** | Không cuộn ngang (`scrollWidth` = chiều rộng cửa sổ ở cả hai cỡ). Nút "Dùng 09/11/2026" cao 32 px, nằm ngay dưới câu lỗi và cách "KHÁCH BÁO LÚC" một khoảng rõ. Alert `use_checkout` ở 390 px xuống 3 dòng, nút Đóng không bị đẩy ra ngoài hộp. |

## 2. Hai giả định FE nhờ UXD quyết

1. **Ngày rời mới đặt sẵn trong W = ngày lịch: ĐỒNG Ý.** Hợp đồng 0.3.13 (`minNewDepartureDate` = ngày lịch D+1), DOM 2.1 (2), ca T-11-6 và 9.13 đều ghi như vậy. Câu "theo ngày nghiệp vụ" trong lời giao là nhầm. FE làm đúng khi theo hợp đồng và ghi chỗ lệch vào thân PR.
2. **"Dùng {date}" rồi tính thử tự chạy sau 400 ms: GIỮ, không chặn.**
   - Ở 9.13, "chỉ đặt ngày, không gửi lệnh" nghĩa là nút không **ghi** gì.
   - Tính thử `dryRun` chỉ đọc. Nó chạy với mọi lần đổi ngày; đó là cách bước ① vốn hoạt động.
   - Sau khi tính thử, lễ tân vẫn phải tự bấm "Xem trước số tiền" mới sang bước ②, đúng ý 9.13.
   - Ca D cho thấy sau khi bấm "Dùng", dòng "Báo trước 2 ngày…", "Bỏ 1 đêm: 09/11" hiện ngay. Như vậy tốt hơn: lễ tân thấy số đêm đổi trước khi xem tiền.
   - UXD sẽ đổi câu ở 9.13 cho rõ ("không ghi gì") ở lượt tài liệu tới. Không đổi chữ trên màn.

## 3. Thẻ

### FB-R5-UXD-FE-142-01
- Mức độ: **Major** (điều kiện gộp)
- Vị trí: `pages/stay/EarlyDepartureDialog.tsx`:
  - `clientErrors.newDepartureDate`: nhánh `err.date_range` khi `newDate < minDate`;
  - `sig = useCheckout || Object.keys(clientErrors).length || photoBusy ? '' : …`;
  - phần thân bước ② `{!p ? (preview_loading + LoadingBlock) : …}`.
- Vấn đề: hộp mở trước 00:00 rồi dùng tiếp sau 00:00. Đây là ca chính khiến Desk cần chữ 9.13: lễ tân mở Trả sớm lúc 23:55, khách quyết lúc 00:05. Sau 00:00, lần vẽ lại đầu tiên tính lại `estimate` = ngày lịch, nên ngày đang chọn (ngày nghiệp vụ) bị lỗi ở client trước khi máy chủ kịp trả 409. Hậu quả:
  - **(a) Bước ② kẹt.** Ca B (1440 px): tick "Đã báo khách…" lúc 00:05.
    - `clientErrors` có lỗi ngày → `sig = ''` → mất bản tính thử → hộp hiện "Đang tính thử…" kèm khung xám mãi mãi, dù không có lệnh nào đang chạy.
    - Ô tick biến mất ngay dưới chuột.
    - Nút Xác nhận khóa với lý do "Chờ tính thử xong để xem trước."
    - Chữ trên màn nói sai việc đang xảy ra. Lễ tân chỉ thoát được nếu tự bấm "Sửa lại".
  - **(b) Bước ① hiện câu chung thay câu 9.13.** Sau "Sửa lại" (hoặc hộp đang ở bước ① khi qua 00:00), dưới ô là `err.date_range` "Chọn ngày từ 08/11/2026 đến 08/11/2026.":
    - không nói vì sao ngày hôm qua không còn chọn được;
    - không có nút "Dùng 08/11/2026".

  `err.min_date` và `use_min_date` chỉ hiện khi máy chủ trả 409, tức là khi không có lần vẽ lại nào giữa 00:00 và cú bấm (test FE ca 7 tick trước khi đổi giờ, nên không gặp), hoặc khi đồng hồ quầy lệch.
- Bằng chứng:
  - trình duyệt, ca B: bước ② sau tick chỉ còn "Đang tính thử… ⏎ Đang tải… ⏎ ← Sửa lại ⏎ Chờ tính thử xong để xem trước."; sau Sửa lại: "Chọn ngày từ 08/11/2026 đến 08/11/2026.";
  - 2 ca test tạm (dựng trên các hàm của tệp test FE), cả hai đỏ ở `52a14957`:
    - (1) `at('23:58', Y)`, sang bước ②, `at('00:05')`, tick → `preview_loading` vẫn còn sau 1,5 giây;
    - (2) `at('23:58', Y)`, ở bước ①, `at('00:05')`, bấm vào ô giờ → không có `err.min_date` hay `use_min_date`.
- Vì sao quan trọng:
  - đây là cửa sổ V5-11 nhắm tới, và là lúc chỉ có một lễ tân trực;
  - màn hình báo "đang tính" mà không tính gì, nên lễ tân dễ đợi, đóng hộp hoặc làm lại từ đầu trong khi khách đang chờ;
  - không sai tiền: máy chủ vẫn chặn đêm khách đã ở.
- Đề xuất sửa:
  1. **Một câu cho mọi lần ngày rơi dưới mức sàn giờ đêm.** Trong W, khi `newDate < minDate` và mức sàn đang quyết định ngày tối thiểu (`minDate === floor`, tức `floor ≥ arrival + 1`), dùng `err.min_date` với `{date}` = `date(minDate)` và hiện nút `use_min_date` cùng ngày đó, như nhánh `serverMin` hiện có.
     - Ví dụ: `const nightFloor = serverMin ?? (night ? estimate : null)`; điều kiện hiện câu: `validDate && nightFloor && minDate === nightFloor && newDate < nightFloor`.
     - Ngoài W, và khi `newDate > maxDate`, giữ `err.date_range`.
     - Ca T-11-6 (gõ ngày hôm qua lúc 02:00) cũng sẽ ra câu này. Câu này tốt hơn câu khoảng ngày; test FE ca 3 đổi theo.
  2. **Bước ② không bao giờ chờ một lần tính không chạy.** Khi đang ở `phase === 'preview'` mà ngày thành lỗi ở client: về bước ①, `setTold(false)`, focus ô ngày. Làm giống nhánh 409 ở lần ghi (`setFocusDate`). Lễ tân thấy ngay câu ở (1) và nút "Dùng {date}".
  3. Thêm 2 ca test như trên (bước ② tick sau 00:00; bước ① vẽ lại sau 00:00), kỳ vọng `err.min_date` + `use_min_date`, không có `preview_loading`.
  - Không cần khóa chữ mới.
- Trạng thái: Open (FE-4)

### FB-R5-UXD-FE-142-02
- Mức độ: Suggestion (có từ v1.0.1, không do PR này; v1.0.6)
- Vị trí: `EarlyDepartureDialog.tsx`, `toPreviewWhy`: lý do dưới nút "Xem trước số tiền" khi chưa `ready`.
- Vấn đề: khi một ô đang có lỗi ở client (ví dụ ngày ngoài khoảng), không có lần tính nào chạy, nhưng lý do vẫn là `to_preview_wait` "Chờ tính thử xong để xem trước." Lỗi ở mục (b) thẻ 01 và ảnh D-390 đều cho thấy câu này đứng cạnh nút khóa.
- Vì sao quan trọng: câu bảo lễ tân chờ một việc không xảy ra. Câu lỗi dưới ô đã nói cần làm gì, nên đây chỉ là lệch nhỏ.
- Đề xuất sửa:
  - khi còn lỗi ở client, lý do của nút trỏ về ô có lỗi;
  - UXD viết khóa mới (dự kiến `early_departure.to_preview_fix`, "Sửa ô báo lỗi ở trên để xem trước.") ở bảng chữ v1.0.6;
  - FE nối khóa khi có.
- Trạng thái: Open (UXD chữ, FE-4 nối; v1.0.6)

## 4. Chưa kiểm

- Desk EN ở 1366 px (ca cuối mục 8 của 9.13). Chưa chạy, vì đổi ngôn ngữ Desk là cài đặt người dùng, không theo locale trình duyệt. Rủi ro thấp: câu EN dài nhất 129 ký tự, nằm trong Alert tự xuống dòng. QA chạy cùng ca T-11-4 trên staging.
- Ban ngày không có dòng ngày ghi phí: mới kiểm bằng đọc mã (`night` = `estimate > today`), chưa chụp.
- Ô ngày và ô giờ hiện theo locale của Chromium (mm/dd/yyyy, "03:00 AM") dù câu giúp nói "Dạng 24 giờ". Lỗi này có từ trước, FE đã ghi ở báo cáo mục 5. Không thuộc PR này.

## 5. Điểm nên giữ

- `nightHint()` gom thứ tự 9.13 vào một hàm có test riêng. Lần tính thử và lần ghi dùng chung một đường.
- Số tiền chỉ lấy từ máy chủ, có test số lạ (1.234.000 / 456.000) và 4 đột biến chạy tay. Đây là cách chứng minh tốt cho luật "Desk không tự tính".
- Bỏ so ngày ở `canCheckOut`, để `allowedActions` của máy chủ quyết. Cách này gọn và đúng cả ngoài W.

## 6. Dòng decision-log đề xuất (ORC ghi)

`| 2026-11-07 | 5 | **UXD – FE PR #142 (V5-11 Desk) @ 52a14957: DUYỆT CÓ ĐIỀU KIỆN** (rounds/round-05/reviews/UXD-on-fe-pr-142.md). Đạt: 4 khóa 9.13 đúng nguyên văn; thứ tự 409 useCheckout → minNewDepartureDate → câu chung ở cả tính thử và ghi; khoảng ngày rỗng trong 00:00–05:59 hiện use_checkout, không gọi B16; fee_business_date chỉ trong W và khi phí > 0; "Trả phòng ngay" ở bước ③ chỉ theo allowedActions; 390/1440 không cuộn ngang, đúng token DS. UXD quyết: ngày đặt sẵn trong W là ngày lịch (theo hợp đồng); giữ tính thử tự chạy sau "Dùng {date}" (chỉ đọc). Điều kiện gộp: FB-R5-UXD-FE-142-01 (Major) – hộp mở qua 00:00 kẹt "Đang tính thử…" ở bước ② và ra err.date_range thay err.min_date + "Dùng {date}" ở bước ①; sửa bằng dùng mức sàn giờ đêm của Desk cho câu 9.13 và về bước ① khi ngày thành lỗi. 142-02 Suggestion v1.0.6 | UXD | Chữ 9.13 phải hiện ở ca thật (hộp mở qua nửa đêm), không chỉ khi máy chủ trả 409 |`

---

## 7. Re-review delta `52a14957..710209ec` (07/11/2026, bước Review)

- Đối tượng (chỉ đọc, không đẩy lên nhánh PR): **#142** @ **`710209ec`** (draft).
  - Delta của PR: `3927e137` (UXD-01, DOM-01), `7baac854` (ARC-03, ARC-01), hai merge `main` (`877c9dde`, `710209ec`).
  - Tệp của PR đổi trong delta: `pages/stay/EarlyDepartureDialog.tsx`, `app/dates.ts`, `__tests__/v5-11-early-departure-night-fea.test.tsx`.
  - Trả lời của FE-4: `rounds/round-05/responses/FE-responses.md` (`6d5e02ec`).
- Cách kiểm:
  - worktree tách rời ở `710209ec` trong scratchpad, cài gói offline, build `@ottimo/contracts`;
  - chạy **nguyên văn** tệp repro 2 ca của UXD (giữ ngoài repo) cùng tệp test V5-11 của PR: 18/18 đạt (repro 2/2, PR 16/16). Cả bộ admin-web: 89 tệp, 1011 ca đạt;
  - 4 đột biến chạy tay, mỗi lần trả lại tệp gốc:
    - bỏ đường về bước ① → 2 ca đỏ (repro 1, ca R2 của FE);
    - bỏ kiểm lại đồng hồ khi focus → 3 ca đỏ (repro 2, ca R1, ca repro của FE);
    - bỏ đồng hồ 00:00 → 1 ca đỏ (ca "để yên qua 00:00");
    - mức sàn chỉ lấy từ máy chủ → 7 ca đỏ;
  - Vite + mock MSW, Chromium qua Playwright, khóa đồng hồ trang (`page.clock`), múi giờ Asia/Ho_Chi_Minh, đăng nhập qa.fd (mật khẩu đọc từ `seed.ts`, không in ra). Đơn căn 101 của seed (05/11 → 09/11), ngày nghiệp vụ 07/11;
  - chụp ở 1440 px và 390 px. Ảnh có tên khách giả của mock, để ngoài repo (`scratchpad/uxd-shots/142d/` của phiên UXD).
- Các ca đã chạy trên trình duyệt:
  - **B1.** Bước ② mở lúc 23:59, đã tick "Đã báo khách…", để yên. Đồng hồ của hộp chạy lúc 00:00.
  - **B2.** Bước ② mở lúc 23:58. Đồng hồ nhảy sang 00:05 mà hẹn giờ không chạy (như máy ngủ), rồi bấm vào chữ "Đã báo khách…".
  - **B3.** Như B2, nhưng dùng Tab tới ô tick rồi bấm Space.
  - **C.** Bước ① để yên qua 00:00, con trỏ đang ở ô Giờ; sau đó bấm Esc.
  - **G.** Bước ② với ngày 08/11 (vẫn hợp lệ sau 00:00), đã tick, qua 00:00.
  - **T.** Thứ tự Tab sau khi về bước ①; đối chứng: Esc lúc 23:59 khi chưa sửa gì.

### 7.0 Kết luận

**#142 @ `710209ec`: DUYỆT.**

- **FB-R5-UXD-FE-142-01: Closed.** Điều kiện gộp của UXD đã hết. Thứ tự gộp vẫn theo ARC/DOM (sau BE #114).
- FB-R5-UXD-FE-142-02: nâng **Suggestion → Minor**, vẫn v1.0.6, không chặn gộp (lý do ở 7.4).
- FB-R5-UXD-FE-142-03 **mới, Minor**, không chặn gộp.
- **Không có ESC.**

### 7.1 Đối chiếu từng mục

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| 142-01 (a): bước ② không còn kẹt | **Đạt** | B1 (1440, 390): lúc 00:00 hộp tự về bước ①, bỏ tick, focus ô "Ngày rời mới" (`aria-invalid="true"`), không còn "Đang tính thử…". B2, B3: hẹn giờ lỡ thì cú bấm hoặc Tab vào ô tick cũng đưa về bước ①, vì Desk kiểm lại đồng hồ khi focus. Repro (1) đạt. |
| 142-01 (b): bước ① ra câu 9.13 kèm nút | **Đạt** | B1, C: dưới ô là "Đang sau nửa đêm nên đêm qua là đêm khách đã ở. Ngày rời mới sớm nhất là 08/11/2026." và nút "Dùng 08/11/2026". Không còn `err.date_range`. Gõ quá ngày cuối vẫn ra câu khoảng ngày (test FE). Repro (2) đạt. |
| Mức sàn của Desk | **Đạt** | `nightFloor = serverMin ?? (night ? estimate : null)`, chỉ áp khi mức sàn quyết định ngày tối thiểu. `{date}` = `date(minDate)`, cùng ngày với nút. Đúng đề xuất (1) của thẻ 01; `estimate` = max(ngày nghiệp vụ, ngày lịch) theo ARC-03. |
| "Dùng {date}" | **Đạt** | B1: bấm thì ô = 08/11, focus ở lại ô, tính thử tự chạy ("Bỏ 1 đêm: 08/11"). Lễ tân vẫn tự bấm "Xem trước số tiền". Bước ② mới: ô tick trống, số mới (hoàn 334.000 đ, phí 333.000 đ, kèm "Đang sau nửa đêm nên phí ghi vào ngày nghiệp vụ 07/11/2026."). |
| Tự về bước ① lúc 00:00 | **Chấp nhận** | Xem 7.2. |
| Focus và thông báo | **Đạt** | Xem 7.3. |
| Ngày vẫn hợp lệ sau 00:00 (G) | **Đạt** | Hộp ở lại bước ②, giữ tick, số không đổi. Chỉ thêm dòng `fee_business_date` dưới dòng phí. Đúng: khách đã nghe đúng số; dòng mới là ghi sổ nội bộ. |
| Chữ ngoài `gen_strings.py` | **Không có** | Delta chỉ dùng lại `err.min_date` và `use_min_date`. Cả PR không đổi gì trong `product/design/` hay `product/packages/` so với gốc tách từ `main`. Không có chữ viết cứng trong JSX. |
| Thương hiệu | **Đạt** | Không thêm CSS, màu hay lớp mới. Ảnh B1, C: nền Ivory, tiêu đề Lora, nội dung Be Vietnam Pro, mã đơn JetBrains Mono, câu lỗi dùng màu `danger` của DS. 390 px và 1440 px không cuộn ngang (`scrollWidth` = chiều rộng cửa sổ). |

### 7.2 Tự về bước ① lúc 00:00: chấp nhận

- **Lý do đúng.** Số ở bước ② tính cho ngày rời 07/11, tức bỏ cả đêm 07/11 mà khách đã ở. Sau 00:00 máy chủ sẽ trả 409 cho đúng các số đó. Để lễ tân đọc tiếp số cũ cho khách còn tệ hơn là đổi bước.
- **Cùng một cách hiện.** 9.13 đã định cho lần ghi: "về bước 1 như 412, focus ô". Nay Desk tự phát hiện trước thì cũng hiện đúng như vậy. Lễ tân chỉ gặp một kiểu, dù Desk hay máy chủ thấy trước.
- **Lễ tân hiểu vì sao.**
  - Câu 9.13 nói thẳng lý do ("Đang sau nửa đêm nên đêm qua là đêm khách đã ở") và ngày dùng được.
  - Nút "Dùng 08/11/2026" ngay dưới câu là việc cần làm tiếp.
  - Thanh bước chuyển về "Ngày rời và giờ báo".
- **Bỏ tick là đúng.** Số hoàn và phí đổi (B1: từ "Bỏ 2 đêm: 07/11, 08/11" xuống "Bỏ 1 đêm: 08/11"), nên lễ tân phải báo lại khách số mới.
- **Không mất gì đã nhập.** Giờ khách báo, ghi chú và ảnh giữ nguyên; chỉ ngày rời cần đổi.
- **Cú bấm lỡ không gây hại (B2).**
  - Khi hẹn giờ lỡ, hộp đổi bước ngay lúc nhấn chuột vào ô tick. Lúc nhả chuột, chỗ cũ là vùng trống (1440) hoặc một ô nhập của bước ① (390). Không giá trị nào đổi, focus vẫn ở ô ngày.
  - Ở chân hộp, nút "Xem trước số tiền" nằm đúng chỗ của "Xác nhận trả sớm" nhưng đang khóa (`aria-disabled`), nên bấm lỡ không gửi gì.
- **Không cần câu mới** kiểu "Đã qua 00:00, hộp quay lại bước 1". Câu 9.13 đã nói điều đó; thêm câu thì thành hai lời giải thích cho một việc.

### 7.3 Focus và thông báo

- **Về bước ① (B1, B2, B3).**
  - Focus vào ô "Ngày rời mới". Trình đọc màn hình đọc nhãn, trạng thái không hợp lệ, rồi `aria-describedby` theo thứ tự: câu 9.13 → câu giúp "Từ 08/11/2026 đến 08/11/2026…".
  - Thanh bước chuyển `aria-current` sang bước 1.
  - Đúng 9.13 (lỗi dưới ô, `aria-invalid`, `aria-describedby`, focus ô).
- **Thứ tự Tab (T, 1440 px):** ô ngày (3 phần ngày/tháng/năm) → "Dùng 08/11/2026" → Ngày khách báo → Giờ. Nút "Dùng" đứng ngay sau ô.
- **Bấm "Dùng":** focus ở lại ô ngày, câu lỗi mất, vùng trạng thái `polite` đọc "Bỏ 1 đêm: 08/11".
- **Bước ① để yên qua 00:00 (C):**
  - câu lỗi và nút hiện, focus **không** bị kéo khỏi ô Giờ đang đứng. Đúng: người dùng không thao tác thì không giật focus;
  - câu lỗi dưới ô không phải vùng live (`Field` làm vậy ở mọi ô của Desk). Người dùng trình đọc màn hình chỉ nghe khi tới ô ngày, hoặc khi tới nút khóa. Nút khóa lúc này đọc "Chờ tính thử xong để xem trước." (xem 142-02).
- **Kiểm lại đồng hồ khi focus (B3):** Tab vào ô tick sau 00:00 → về bước ①, focus ô ngày. Space sau đó không đổi gì.

### 7.4 Thẻ

#### FB-R5-UXD-FE-142-01 – Closed
Đạt cả (a), (b) và 3 đề xuất sửa. Đồng hồ 00:00 và kiểm lại khi focus nằm ngoài đề xuất của UXD, nhưng cần cho ca thật (hộp để yên qua nửa đêm, máy ngủ). UXD đồng ý.

#### FB-R5-UXD-FE-142-02 – nâng Suggestion → Minor (v1.0.6, không chặn gộp)
- Lý do nâng:
  - trước bản sửa, câu `to_preview_wait` "Chờ tính thử xong để xem trước." cạnh nút khóa chỉ hiện ở ca lẻ;
  - nay **mọi** hộp mở qua 00:00 đều dừng ở trạng thái này (B1, B2, C). Ô ngày báo lỗi, nút "Dùng" ở ngay dưới, mà chân hộp vẫn bảo chờ một lần tính không chạy;
  - ở ca C, với trình đọc màn hình, đây là câu đầu tiên nghe được về nút khóa.
- Trả lời FE ghi "bản sửa làm ca này hiếm hơn". Thực tế ca này nay thường hơn, nhưng câu 9.13 ngay dưới ô đã giảm hại. Vì vậy vẫn không chặn gộp.
- Việc:
  - UXD viết `early_departure.to_preview_fix` ở bảng chữ v1.0.6 (đã hẹn ở mục 3);
  - FE nối: khi còn lỗi ở client, lý do của nút "Xem trước số tiền" dùng khóa này.
- Trạng thái: Open (UXD viết chữ trước, FE-4 nối; v1.0.6)

#### FB-R5-UXD-FE-142-03 (mới)
- Mức độ: **Minor** (không chặn gộp; làm luôn nếu FE-4 còn đẩy PR này, nếu không thì v1.0.6)
- Vị trí: `pages/stay/EarlyDepartureDialog.tsx`, prop `dirty` của `Modal` ở bước ①: vế `newDate !== minDate`.
- Vấn đề:
  - lúc 00:00 `minDate` dời từ 07/11 sang 08/11, nên một hộp chưa sửa gì cũng thành "có thay đổi";
  - ca C (1440, 390): mở lúc 23:59, không nhập gì, qua 00:00, bấm Esc → hộp hỏi "Bỏ các thay đổi chưa lưu? Bạn đã nhập thông tin trong form này.";
  - đối chứng T: bấm Esc lúc 23:59 thì hộp đóng ngay;
  - nút X và bấm ra ngoài đi cùng đường Esc (`requestClose` của `Modal`). Nút Hủy gọi thẳng `onClose` nên không hỏi;
  - vế `newDate !== minDate` có từ trước, nhưng trước đây phải có một lần vẽ lại sau 00:00 mới lộ ra. Đồng hồ 00:00 của bản sửa làm nó luôn xảy ra.
- Vì sao quan trọng: câu nói sai với lễ tân ("Bạn đã nhập…"), đúng trong cửa sổ V5-11, và thêm một cú bấm "Bỏ thay đổi" khi khách đang chờ. Không mất dữ liệu.
- Đề xuất sửa:
  - so với ngày hộp đã điền lúc mở, không so với mức sàn đang dời. Ví dụ `const [filledDate] = useState(minDate)`, rồi dùng `newDate !== filledDate`;
  - bấm "Dùng {date}" vẫn tính là đã sửa (đúng, lễ tân đã chọn ngày);
  - thêm 1 ca test: mở 23:59, qua 00:00, bấm Esc → hộp đóng, không hỏi.
  - Không cần khóa chữ mới.
- Trạng thái: Open (FE-4)

### 7.5 Chưa kiểm

- Desk EN ở 1366 px: như mục 4, QA chạy cùng ca T-11-4 trên staging.
- Máy ngủ qua 06:00: mốc 06:00 do `useBusinessDay` lo (R3-Q36), không thuộc delta.

### 7.6 Điểm nên giữ

- Một đường cho "ngày thành sai khi đang ở bước ②": về bước ①, bỏ tick, focus ô ngày. Dùng chung cho lỗi ở client và 409 ở lần ghi.
- Đồng hồ 00:00 cộng kiểm lại khi focus phủ cả hộp để yên lẫn máy ngủ. Mỗi phần có test đỏ khi bỏ (đã thử bằng đột biến).
- Không thêm khóa chữ: câu 9.13 được dùng lại đúng chỗ.

### 7.7 Dòng decision-log đề xuất (ORC ghi)

`| 2026-11-07 | 5 | **UXD – re-review FE PR #142 (V5-11 Desk) delta 52a14957..710209ec: DUYỆT @ 710209ec.** FB-R5-UXD-FE-142-01 Closed: hộp mở qua 00:00 tự vẽ lại lúc 00:00 và kiểm lại đồng hồ khi focus; bước ① ra err.min_date + "Dùng {date}" theo mức sàn của Desk (max(ngày nghiệp vụ, ngày lịch)); bước ② tự về bước ①, bỏ tick, focus ô ngày – UXD chấp nhận vì cùng đường với 409 ở lần ghi và câu 9.13 nói rõ lý do. Repro UXD 2/2 đạt nguyên văn, tệp V5-11 16/16, admin-web 1011/1011, 4 đột biến đều đỏ; 1440/390 đúng token DS, không có chữ ngoài gen_strings.py. 142-02 nâng Minor (v1.0.6, UXD viết to_preview_fix trước); 142-03 mới Minor (hộp chưa sửa gì vẫn hỏi "Bỏ các thay đổi chưa lưu?" sau 00:00); cả hai không chặn gộp | UXD | rounds/round-05/reviews/UXD-on-fe-pr-142.md |`
