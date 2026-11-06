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
