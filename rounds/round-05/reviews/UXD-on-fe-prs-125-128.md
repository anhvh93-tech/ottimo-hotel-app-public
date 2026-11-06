# UXD review – FE PR #125 (V5-10, một `checkoutAt`) và #128 (Nhật ký tiền, "Sửa giảm dòng – 7 ngày")

- Người review: UXD | Round 5 – bước **Review** | 07/11/2026
- Đối tượng (chỉ đọc, không đẩy lên nhánh PR):
  - **#125** `r5-fe-v5-10` @ `797ff439`: Trả phòng (H16) gửi một `checkoutAt` cho bill, VietQR và B18; ô ghi chú giờ hiện trước B18; khóa khi giờ sau hiện tại; viền Earth Brown cho giờ Desk tự điền.
  - **#128** `r5-fe-mlog-reductions` @ `dcb14f11`: Nhật ký tiền có công tắc "Sửa giảm dòng – 7 ngày" và ô Người làm cho MGR, OWN; dòng "Cần chú ý" `line_reduction_count` dẫn tới bộ lọc.
- Cách kiểm:
  - đọc `gh pr diff`, `gh pr view` và báo cáo FE trong từng nhánh (`rounds/round-05/outputs/FE/v5-10-checkout-at-fea.md`, `v5-16-mlog-reductions-fea.md`);
  - dựng hai worktree trong scratchpad, cài gói offline, build admin-web lấy CSS và font thật;
  - dựng từng trạng thái bằng bộ test của dự án (`renderApp` + mock, đăng nhập bằng `mockControl.signInAs`, không gõ mật khẩu);
  - chụp ở 1440 px và 390 px qua localhost, font tải đủ (Lora, Be Vietnam Pro, JetBrains Mono);
  - các trạng thái đã chụp:
    - #125: giờ tự điền 13:00 có phụ thu; giả lập focus; ô ghi chú 12:10; giờ 13:40 sau hiện tại; giả lập giờ tự điền kèm lỗi;
    - #128: MGR mặc định; công tắc bật; lọc theo người; liên kết "Cần chú ý" với người không có trong danh sách (rỗng); FD;
  - so chữ bằng script giữa `strings-vi/en.json` của nhánh với `copy-v1.0.5.md` mục 9.5;
  - chạy lại `gen_strings.py` trên nhánh #128: tệp sinh không đổi (đồng bộ);
  - quét phần thêm của hai PR: màu hex, `font-family`, `rgb()`, emoji;
  - đo pixel viền ô giờ.
- Ảnh kiểm để ngoài repo (dữ liệu mock có tên khách giả): `scratchpad/uxd-review-shots/` của phiên UXD.
- Đối chiếu:
  - `00-brief/context/brand/brand-guidelines.md`; `product/design/design-system.md` v0.4.1; `copy-v1.0.5.md` bản 1.9 (mục 9.5, 9.9);
  - DOM `rules-v1.0.5.md` 15.1–15.2, 15.7 và `DOM-on-be-prs-106-99-checkout.md` mục 5;
  - hợp đồng 0.3.13 (`CheckoutSummary.nightsNotBilled`, 1.19).

## 0. Kết luận

| PR | Kết luận | Điều kiện, thẻ |
|---|---|---|
| **#125** V5-10 @ `797ff439` | **DUYỆT CÓ ĐIỀU KIỆN** | **PR125-01 (Major)**: viền Earth Brown của giờ tự điền phải đi cùng dòng chữ nhắc `checkout.time_prefilled_help` (chữ ở mục 1.3). Nên làm trong PR này. Muộn nhất phải có trước khi cắt tag v1.0.5. PR125-02 (Minor) nên làm trong PR này. PR125-03 (Suggestion) |
| **#128** Nhật ký tiền @ `dcb14f11` | **DUYỆT** | Hai khóa khớp nguyên văn 9.5; chỗ đặt công tắc và ô Người làm đạt ở 390 và 1440. PR128-01…03 (Minor, chỉ thêm chữ) nên làm trong PR này nếu kịp, không chặn gộp. PR128-04 (Minor) để v1.0.6 cùng BA |

- Tổng 7 thẻ: 1 Major, 5 Minor, 1 Suggestion. Không có Blocker.
- **Không có ESC.** Chữ, màu trong bảng và chỗ đặt thuộc quyền UXD.
- **Thương hiệu, hai PR:**
  - Màu: chỉ một màu mới, Earth Brown, dùng qua token `--oak-ink` (#7A5C44). Mã hex chỉ xuất hiện trong chú thích.
  - Font: không đổi; ảnh chụp tải đúng Lora, Be Vietnam Pro, JetBrains Mono (mã `OTM-…` ở cột Đơn).
  - Không có emoji.
- **Ngoài phạm vi #125:** ORC ghi #125 có hộp Trả phòng quá ngày đi, lời nhắc D12c `checkout.overdue_reason_help` và 3 lý do gợi ý. Ở `797ff439` không có phần nào trong số đó:
  - PR không chạm tệp chữ nào;
  - `overdueReason`, `nightsNotBilled`, `overdue_reason_help` không có trên `main` và cả hai nhánh;
  - báo cáo FE mục 4 ghi đó là việc kế tiếp (V5-15, sau BE #99).

  UXD xem phần này ở PR V5-15 của FE-A. Chữ UXD còn nợ cho hộp đó: mục 3.
- CI lúc review:
  - #125: các job đã xong đều xanh; job `format · lint · audit · test · build` còn chạy.
  - #128: job `infra scripts (shellcheck)` đỏ. Có thể lại là test `postgres-log-terse` chập chờn (FB-R5-ARC-OPS-11), vì PR không chạm script hạ tầng. ORC cho chạy lại.

---

## 1. PR #125 – một `checkoutAt` cho bill, VietQR và Trả phòng

### 1.1 Đạt
- **Câu `field.TIME_AFTER_ACTION` cho `checkoutAtAfterNow`: UXD đồng ý dùng lại.** Chữ "Giờ này muộn hơn hiện tại. Ghi đúng giờ đã diễn ra – không ghi giờ chưa tới." đúng với ý hợp đồng.
  - Câu hiện ở ba chỗ: dưới ô giờ (viền đỏ, `aria-invalid`), lý do của "Tiếp tục" và lý do của "Hoàn tất".
  - Ảnh 1440: chữ đỏ `--bad` kèm dấu ✕ của Field error, không tràn.
  - Nút VietQR tắt theo `qrOff`. Ở bước 3 gần như không gặp, vì "Tiếp tục" đã khóa trước đó. Không cần thêm câu cạnh nút QR.
- **Ô ghi chú giờ hiện trước B18** (`checkoutTimeNoteRequired`): ảnh 390 đạt. Ô có dấu * và câu `stay.time_note_help` ngay dưới, không tràn.
- **Viền Earth Brown** (`.input.is-prefilled`):
  - dùng token `--oak-ink`, trong bảng thương hiệu;
  - tương phản với nền ô (`--surface` #FBF9F4) khoảng 5,8:1, trên mức 3:1 cho viền thành phần;
  - đo pixel: viền 1 px cộng bóng 1 px, ra vòng 2 px dính sát ô;
  - khi ô có lỗi, viền đỏ `--bad` vẫn thắng (đo: viền #B8554C), chỉ thêm một nét nâu 1 px bên ngoài. Xem PR125-03.
- Giữ giờ điền sẵn là giờ máy quầy (KB7), đúng DOM 15.2.

### 1.2 Vấn đề
- Chỉ màu viền báo "giờ này Desk tự điền, đang tính thêm tiền". Không có chữ nào nói điều đó (FE ghi rõ đang chờ khóa UXD). Hai hệ quả:
  - không đạt WCAG 1.4.1: thông tin chỉ truyền bằng màu;
  - `--focus` cũng là #7A5C44. Ô giờ có vòng Earth Brown 2 px nên trông như đang được chọn (ảnh `co-prefilled-1440`, so với `co-prefilled-focus`: vòng focus chỉ khác ở khe 2 px). Lễ tân dễ hiểu là "ô đang được chọn", không hiểu là "cần kiểm giờ".
- DOM 15.1: khách trả chìa 11:40, lễ tân bấm 12:10, căn có khách đến thì bị tính oan 210.000. Dòng chữ là thứ chặn ca này. Viền chỉ là dấu phụ.

### 1.3 Chữ UXD chốt cho dòng nhắc (DOM 15.2, 15.7)

| Khóa | VI | EN | Ghi chú |
|---|---|---|---|
| `checkout.time_prefilled_help` | Giờ này Desk tự điền theo đồng hồ máy quầy và đang tính thêm tiền. Ghi giờ khách rời thật – lúc trả chìa hoặc báo đã rời căn – không phải lúc bấm. | Desk filled in this time from the desk clock, and it adds a charge. Enter when the guest actually left – when they returned the key or said they'd gone – not when you click. | `help` của `Field` ô giờ trả, chỉ khi `timePrefilledCharged`. Có cả `co.time_from_late` thì ghép sau câu đó, cách một dấu cách. Chữ Stone như mọi `Field help`; không Alert, không thêm màu. `aria-describedby` theo `Field` |

Sau khi có dòng này, viền Earth Brown giữ nguyên làm dấu phụ. Không đổi màu, không bỏ.

### 1.4 Thẻ

### FB-R5-UXD-FE-PR125-01
- Mức độ: **Major**
- Vị trí: `apps/admin-web/src/pages/stay/CheckOutPage.tsx`, `Field` ô `checkout.departure_time` (bước 2); `gen_strings.py`
- Vấn đề: giờ tự điền đang tính thêm tiền chỉ được báo bằng viền màu, trùng màu focus (mục 1.2).
- Vì sao quan trọng: khách có thể bị tính phụ thu trả muộn oan (DOM 15.1). Thông tin chỉ bằng màu không đạt WCAG 1.4.1.
- Đề xuất sửa:
  - thêm khóa `checkout.time_prefilled_help`, chữ ở mục 1.3, vào `gen_strings.py` rồi sinh lại;
  - hiện ở `help` của ô giờ khi `timePrefilledCharged`;
  - test: giờ tự điền 13:00 có phụ thu thì có câu, và ô có `aria-describedby` trỏ tới câu; lễ tân sửa giờ thì câu mất; 12:05 (trong ân hạn) thì không có câu.
- Trạng thái: Open (nên làm trong PR này; muộn nhất trước khi cắt tag v1.0.5)

### FB-R5-UXD-FE-PR125-02
- Mức độ: Minor
- Vị trí: `CheckOutPage.tsx`, `lateWhy` (lý do khóa "Tiếp tục")
- Vấn đề:
  - máy chủ đã báo trước `checkoutTimeNoteRequired`, nên ô ghi chú hiện ở bước 2 (có dấu *);
  - nhưng "Tiếp tục" vẫn bấm được khi ô còn trống;
  - lễ tân qua bước 3, thu tiền, bấm "Hoàn tất", B18 trả `TIME_NOTE_REQUIRED`, trang đưa về bước 2 (mã dòng 1026–1030).
- Vì sao quan trọng: thu tiền xong mới bị đưa về sửa ghi chú, trong lúc khách đứng ở quầy. Biết trước thì chặn trước.
- Đề xuất sửa:
  - thêm vào đầu chuỗi `lateWhy`, ngay sau `timeAfterNow`: khi `timedSummary && s.checkoutTimeNoteRequired && !timeNote.trim()` thì lý do là `t('field.TIME_NOTE_REQUIRED')`. Khóa này đã có, không cần chữ mới;
  - test: gõ 12:10 lúc 13:00 thì "Tiếp tục" có `aria-disabled` và mô tả bằng câu đó; gõ ghi chú thì mở.
- Trạng thái: Open (nên làm trong PR này)

### FB-R5-UXD-FE-PR125-03
- Mức độ: Suggestion
- Vị trí: `CheckOutPage.tsx` lớp `is-prefilled`; `packages/ui/src/styles/app.css`
- Vấn đề: ô vừa là giờ tự điền vừa có lỗi (ví dụ đồng hồ máy quầy chạy nhanh hơn máy chủ, nên giờ tự điền ở sau "hiện tại") thì có hai vòng: viền đỏ cộng nét nâu bên ngoài.
- Vì sao quan trọng: lỗi là thứ duy nhất cần thấy lúc đó; nét nâu làm ô rối.
- Đề xuất sửa: chỉ gắn `is-prefilled` khi ô không có `error` (`timePrefilledCharged && !timeError`).
- Trạng thái: Open (tùy FE)

UXD tự sửa ở v1.0.6 (không phải thẻ FE):
- `field.TIME_NOTE_REQUIRED` lấy ví dụ "mất mạng lúc khách đi". Theo DOM 15.1, ca hay gặp nhất là "khách trả chìa 11:40, bấm Trả phòng lúc 12:15".
- `stay.time_note_help` "Bắt buộc khi giờ ghi sớm hơn lúc bấm" thiếu ngưỡng (`manual_time_tolerance_minutes`).
- Đưa cả hai vào lượt copy v1.0.6.

---

## 2. PR #128 – Nhật ký tiền: "Sửa giảm dòng – 7 ngày", lọc theo người

### 2.1 Đạt
- **Chữ:** `mlog.filter_reductions` và `attn.line_reduction_count` khớp **nguyên văn** `copy-v1.0.5.md` 9.5, cả VI và EN, ở mọi tệp sinh:
  - `strings-*.json`, `strings.js`, `strings-tables.md`;
  - chạy lại `gen_strings.py` không ra thay đổi.
- `mlog.who` và `mlog.all_people` là khóa có sẵn trên `main`, đã duyệt; FE không tự viết câu.
- **Chỗ đặt (FE hỏi):**
  - 1440: hàng lọc gồm Từ ngày, Đến ngày, Người làm, rồi công tắc dạng viên, căn đáy với các ô.
  - 390: hai ô ngày cùng hàng, Người làm xuống hàng, công tắc riêng một hàng. Vùng chạm ≥ 44 px, không cuộn ngang (scrollWidth 390).
  - Bảng cuộn ngang trong khung `table-wrap` như trước; các tab dồn hai hàng ở 390 là chuyện có từ trước.
  - Đồng ý chỗ đặt.
- Công tắc có `role="switch"`, `aria-checked`, nhãn là chữ. Ô Người làm có nhãn qua `Field`.
- FD không thấy công tắc và ô người, đúng US-177 AC7 (i).
- Bật công tắc: khoảng ngày thành 7 ngày lịch (ảnh: 01/11 – 07/11), bảng chỉ còn lần sửa giảm, mã đơn bằng JetBrains Mono.
- Dòng "Cần chú ý" không có tên, link theo máy chủ. Link lạ thì mở bộ lọc chung, đúng ý 9.5.

### 2.2 Thẻ

### FB-R5-UXD-FE-PR128-01
- Mức độ: Minor
- Vị trí: `pages/money/MoneyPage.tsx`, ô Người làm, `<option value={actor}>–</option>`
- Vấn đề: liên kết "Cần chú ý" trỏ tới người không có trong danh sách (đã nghỉ, hoặc mất vai). Lúc đó ô hiện "–" trong khi bảng đang lọc theo người đó. Quản lý không biết bộ lọc đang bật.
- Vì sao quan trọng: quản lý dễ hiểu nhầm "–" là chưa lọc, và đọc sai số lần sửa giảm.
- Đề xuất sửa: thay "–" bằng khóa mới `mlog.who_unlisted`:
  - VI "Người không còn trong danh sách"
  - EN "Someone not on the list"
- Trạng thái: Open (nên làm trong PR này)

### FB-R5-UXD-FE-PR128-02
- Mức độ: Minor
- Vị trí: `MoneyPage.tsx`, `people` (`listCloserCandidates`)
- Vấn đề: tải danh sách người lỗi thì ô chỉ còn "Mọi người", không có câu nào báo.
- Vì sao quan trọng: mọi màn hình phải có trạng thái lỗi (checklist UXD). Quản lý tưởng không ai có quyền sửa.
- Đề xuất sửa: khi `people.state.status === 'error'`, hiện `help` (Stone, không Alert) dưới ô bằng khóa mới `mlog.who_error`:
  - VI "Chưa tải được danh sách người làm. Tải lại trang để lọc theo người."
  - EN "Couldn't load the list of people. Reload the page to filter by person."

  Bảng vẫn chạy bình thường.
- Trạng thái: Open (nên làm trong PR này)

### FB-R5-UXD-FE-PR128-03
- Mức độ: Minor
- Vị trí: `MoneyPage.tsx`, `StateView` rỗng (`mlog.empty_title`, `mlog.empty_body`)
- Vấn đề:
  - (a) Bật "Sửa giảm dòng" mà không có dòng nào thì vẫn hiện câu chung "Không có thao tác tiền trong khoảng này". Với quản lý, kết quả này là tin tốt: không ai tự sửa giảm. Câu chung không nói vậy.
  - (b) FD không có ô Người làm mà câu `mlog.empty_body` vẫn bảo "bỏ bộ lọc người làm". Câu này có từ trước, PR này làm lộ ra.
- Vì sao quan trọng: trạng thái rỗng phải nói đúng điều người dùng vừa hỏi, và không chỉ tới nút không có.
- Đề xuất sửa: hai khóa mới:
  - `mlog.empty_reductions_title`: VI "Không có lần sửa giảm dòng nào trong khoảng này", EN "No line reductions in this period". Dùng khi công tắc bật. Thân giữ `mlog.empty_body` cho MGR, OWN.
  - `mlog.empty_body_dates`: VI "Đổi khoảng ngày để xem thêm.", EN "Change the date range to see more." Dùng thay `mlog.empty_body` khi không có ô Người làm (FD, FDL).
- Trạng thái: Open (nên làm trong PR này)

### FB-R5-UXD-FE-PR128-04
- Mức độ: Minor
- Vị trí: nhãn công tắc `mlog.filter_reductions` "Sửa giảm dòng – 7 ngày"
- Vấn đề: mở từ liên kết "Cần chú ý" thì khoảng ngày là cả tháng (ví dụ 01/11 – 25/11), nhưng nhãn vẫn ghi "7 ngày". Đổi ngày tay khi công tắc bật cũng vậy.
- Vì sao quan trọng: nhãn nói một khoảng, bảng lọc khoảng khác. Hai ô ngày ở ngay cạnh nên mức lệch nhỏ.
- Đề xuất sửa:
  - v1.0.5 giữ nguyên, vì tên "Sửa giảm dòng – 7 ngày" đã ở PO quyết định 26, release notes và sổ tay BA;
  - v1.0.6 đổi nhãn thành "Chỉ sửa giảm dòng" / "Line reductions only". Bật công tắc vẫn đặt 7 ngày lịch. BA sửa cùng lượt.
  - PO xếp vào backlog v1.0.6 (nhóm R5-B).
- Trạng thái: Open (v1.0.6, PO + BA + UXD)

---

## 3. Chữ UXD chốt cho PR V5-15 kế tiếp (hộp Trả phòng quá ngày đi)

DOM 15.7 giao UXD chốt chữ chỉ dẫn cho FD, FDL theo `nightsNotBilled`. Đây là ca không có `allowedActions.overdue`; MGR gặp 403 `requiredRole = owner` cũng dùng câu thứ hai. Chữ chốt sẵn để FE-A không phải chờ:

| Khóa | VI | EN | Ghi chú |
|---|---|---|---|
| `checkout.overdue_need_manager` | Đơn đã quá ngày đi 1 đêm: cần quản lý hoặc chủ đầu tư trả phòng. | This stay is 1 night past departure: a manager or the owner needs to check it out. | `nightsNotBilled` = 1, người xem FD/FDL. Alert info, không nút |
| `checkout.overdue_need_owner` | Đơn đã quá ngày đi {n} đêm: cần chủ đầu tư trả phòng. | This stay is {n} nights past departure: the owner needs to check it out. | `nightsNotBilled` ≥ 2 (FD/FDL), hoặc MGR nhận 403 `requiredRole = owner`. `{n}` luôn ≥ 2 nên EN số nhiều cố định |

Chú thích hợp đồng 0.3.13 (`CheckoutSummary.nightsNotBilled`) lấy ví dụ "Quá 1 đêm: cần chủ đầu tư trả phòng." cho ca > 1 đêm. Chữ ở bảng trên thay ví dụ đó.

`checkout.overdue_reason_help` (bản 1.9, mục 9.9) giữ nguyên, bắt buộc trong PR V5-15. Nhãn ô, tiêu đề hộp và 3 lý do gợi ý (DOM 7.1): FE-A viết theo chữ DOM, UXD duyệt ở PR đó (báo cáo UXD mục 10).

Các khóa mới ở mục 1.3, 2.2 và 3 vào `copy-v1.0.5.md` **bản 1.10** ở lượt sửa copy kế tiếp. Theo ORC, lượt này chỉ commit tệp review. Tới lúc đó, tệp này là nguồn chữ cho FE.

---

## 4. Điểm làm tốt
- #125 tách rõ lần đọc có giờ và lần đọc không giờ (`askedTime`). Desk không bao giờ tự ghép ngày với giờ khi máy chủ đã trả `checkoutAt`. Test bắt đúng T10-6.
- #125 chọn Earth Brown, không chọn Light Oak, vì Oak chỉ đạt khoảng 2,7:1. Đúng cách dùng bảng màu cho viền.
- #128 phát hiện và sửa lỗi có từ trước: ô Từ ngày, Đến ngày chưa bao giờ có tác dụng (`dateFrom`/`dateTo`). Mock nay có dạng như máy chủ, nên cột Trước → sau hiện đúng số.

---

Dòng decision-log đề xuất (ORC ghi):

`| 2026-11-07 | 5 | **UXD – review FE PR #125 (V5-10) @ 797ff439 và #128 (Nhật ký tiền, US-177 AC7 (i)) @ dcb14f11** (rounds/round-05/reviews/UXD-on-fe-prs-125-128.md): #125 **DUYỆT CÓ ĐIỀU KIỆN** – PR125-01 (Major): viền Earth Brown giờ tự điền phải đi cùng dòng nhắc checkout.time_prefilled_help (VI "Giờ này Desk tự điền theo đồng hồ máy quầy và đang tính thêm tiền. Ghi giờ khách rời thật – lúc trả chìa hoặc báo đã rời căn – không phải lúc bấm."), trong PR hoặc muộn nhất trước tag v1.0.5; dùng lại field.TIME_AFTER_ACTION cho checkoutAtAfterNow; PR125-02 Minor (khóa Tiếp tục khi checkoutTimeNoteRequired mà ghi chú trống, lý do field.TIME_NOTE_REQUIRED). #128 **DUYỆT** – chữ khớp 9.5, chỗ đặt đạt 390/1440; PR128-01…03 Minor (mlog.who_unlisted, mlog.who_error, mlog.empty_reductions_title, mlog.empty_body_dates) nên làm trong PR; PR128-04 đổi nhãn "Chỉ sửa giảm dòng" ở v1.0.6 cùng BA. Chữ chỉ dẫn quá ngày đi cho FD/FDL: checkout.overdue_need_manager, checkout.overdue_need_owner. Hộp quá ngày đi và D12c không có trong #125, xem ở PR V5-15 | UXD | Quyền UXD (giao diện, chữ Desk); DOM 15.2, 15.7; WCAG 1.4.1 |`

---

## Lượt 2 – #125 @ `3022addc` (FE-A sửa theo PR125-01…03)

- Ngày: 07/11/2026 | Round 5 – Review
- Đã đọc: `git diff 8551ecc7 3022addc`. `8551ecc7` chỉ là commit gộp `main` sau lần review `797ff439`. Các tệp đổi:
  - `CheckOutPage.tsx`;
  - `gen_strings.py` và các tệp sinh;
  - `mocks/stay.ts` (thêm `checkoutClockSkewMinutes` cho test);
  - 2 tệp test;
  - báo cáo FE.
- Đã chạy: worktree trong scratchpad, Desk mock, Playwright khóa đồng hồ 13:00 ngày 07/11. Đơn Phạm Huy (201) trả hôm nay, đã thu tiền phòng. Chụp ở 1440 × 900 và 390 × 844. Ảnh để ngoài repo; ảnh không có dữ liệu khách thật, chỉ có dữ liệu mock.

| Thẻ | Kết quả | Bằng chứng |
|---|---|---|
| PR125-01 (Major) | **Done** | Khóa `checkout.time_prefilled_help` khớp nguyên văn bảng 1.3, cả VI và EN (so bằng script trên `strings-*.json` của `3022addc`). Câu hiện ở `help` của ô giờ và nối qua `aria-describedby` (đo: `descText` đúng câu, ở cả 1440 và 390). Ở 390 câu xuống 3 dòng dưới ô, không tràn. Gõ giờ khác thì câu và viền mất. 12:05, trong ân hạn, không có câu (test) |
| PR125-02 (Minor) | **Done** | Có `checkoutTimeNoteRequired` mà ô ghi chú còn trống thì "Tiếp tục: Bill & thu tiền" có `aria-disabled="true"`, mô tả là `field.TIME_NOTE_REQUIRED`. Đo khi gõ 12:10 lúc 13:00. Gõ ghi chú thì nút mở (test). Test B18 cũ giữ lại làm đường dự phòng cho máy chủ chưa có cờ |
| PR125-03 (Suggestion) | **Done** | Lệch đồng hồ −20 phút, giờ tự điền thành "sau hiện tại". Ô có `aria-invalid`, viền đỏ (`rgb(168, 64, 60)`), `box-shadow: none`, không có lớp `is-prefilled`, không có câu nhắc. Chỉ còn câu lỗi `field.TIME_AFTER_ACTION` |

Thương hiệu:
- không màu mới; viền Earth Brown vẫn qua token `--oak-ink`;
- font không đổi;
- không emoji;
- câu nhắc dùng chữ `help` Stone Grey của `Field`, như các câu phụ khác.

**Kết luận: #125 @ `3022addc` DUYỆT.** Hết điều kiện từ phía UXD. Gộp khi CI xanh.

Hai thẻ mới, không chặn gộp:

### FB-R5-UXD-FE-PR125-04
- Mức độ: Minor (có từ trước, không do PR này)
- Vị trí: chân bước của H16 (`.wiz-foot`, `CheckOutPage.tsx` khoảng dòng 2065), câu lý do `li-s` đứng giữa "Quay lại" và nút chính; kiểu `.wiz-foot` trong `design/hifi/assets/hifi.css` (`display:flex`, không `flex-wrap`).
- Vấn đề: ở 390 px câu lý do bị ép thành một cột hẹp khoảng 40 px, mỗi dòng một hai chữ, cao gần 400 px (ảnh `125-note-390`, `125-390`). `main` cũng vậy với câu `co.go_bill_needs_told`. PR này thêm một lý do dài nữa (`field.TIME_NOTE_REQUIRED`) cho một ca hay gặp.
- Vì sao quan trọng: lễ tân trực bằng điện thoại phải cuộn mới đọc hết lý do nút bị khóa. Câu khó đọc nhất lại là câu duy nhất nói phải làm gì.
- Đề xuất sửa: dưới 600 px, câu lý do lên một hàng riêng phía trên hai nút. Ví dụ `.wiz-foot{flex-wrap:wrap}` và `@media (max-width:599px){.wiz-foot>.li-s{flex:1 0 100%;order:-1}}`. Áp cho cả Trả phòng và Nhận phòng (cùng lớp). UXD làm ở lượt DS tới, hoặc FE thêm vào `app.css`, ai chạm trước. v1.0.5 nếu kịp, muộn nhất v1.0.6.
- Trạng thái: Open (UXD/FE-A)

### FB-R5-UXD-FE-PR125-05
- Mức độ: Suggestion
- Vị trí: `CheckOutPage.tsx`, `lateWhy`: `s.checkoutTimeNoteRequired && !timeNote.trim()`.
- Vấn đề: máy chủ nhận ghi chú 3–300 ký tự (`checkout.service.ts`, `f.text('checkoutTimeNote', 300, { min: 3 })`). Ghi chú 1–2 ký tự mở được "Tiếp tục". Lễ tân thu tiền xong, tới "Hoàn tất" mới gặp lỗi. Đây là đúng ca PR125-02 muốn chặn, chỉ hẹp hơn.
- Vì sao quan trọng: hiếm gặp, nhưng khi gặp thì khách đang đứng ở quầy.
- Đề xuất sửa: chặn khi `timeNote.trim().length < 3`, giữ nguyên câu lý do. Thêm một ca test gõ "ok".
- Trạng thái: Open (FE-A, tùy)

Dòng decision-log đề xuất (ORC ghi):

`| 2026-11-07 | 5 | **UXD – #125 (V5-10) lượt 2 @ 3022addc: DUYỆT** (rounds/round-05/reviews/UXD-on-fe-prs-125-128.md, Lượt 2): PR125-01 Done (checkout.time_prefilled_help khớp nguyên văn, ở help của ô giờ, aria-describedby, đo ở 390 và 1440), PR125-02 Done ("Tiếp tục" aria-disabled với field.TIME_NOTE_REQUIRED khi máy chủ đòi ghi chú), PR125-03 Done (có lỗi thì chỉ viền đỏ, không viền nâu, không câu nhắc). Gộp khi CI xanh. Thẻ mới không chặn: PR125-04 Minor, có từ trước (câu lý do ở chân bước H16 bị ép thành cột hẹp ở 390, .wiz-foot cần flex-wrap); PR125-05 Suggestion (chặn ghi chú dưới 3 ký tự như máy chủ) | UXD | Lượt 2 trong tệp review |`
