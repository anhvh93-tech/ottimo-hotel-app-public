# FE-A – PR tiếp nối review #125 (V5-10) và #128 (Nhật ký tiền)

- Round 5, bước Phản hồi & sửa · FE-A · 07/11/2026
- Nhánh `r5-fe-review-followup`. Gộp vào nhánh này, bằng merge, không rebase: `r5-fe-mlog-reductions` (#128), `r5-fe-v5-10` (#125) và `main`. Khi #125 và #128 đã vào `main`, diff của PR chỉ còn phần dưới đây.
- Nguồn:
  - `rounds/round-05/reviews/ARC-on-prs-105-119-125-128.md` (mục 3, 4);
  - `rounds/round-05/reviews/UXD-on-fe-prs-125-128.md` (lượt 1, mục PR128; lượt 2, PR125-04, PR125-05);
  - `rounds/round-05/reviews/DOM-on-prs-105-125-128.md` (FE-125-01, UXD-128-02);
  - ORC 07/11: ARC FE-125-04, việc BA tìm ra (Nhật ký tiền chỉ tải trang đầu).
- Phải gộp trước mốc cắt v1.0.5 (13/11), vì thẻ FB-R5-ARC-FE-125-01 là Major.

## 1. Trả lời từng thẻ

| Thẻ | Mức | Trạng thái | Cách làm |
|---|---|---|---|
| FB-R5-ARC-FE-125-01 | Major | Done | Thêm 2 test, chạy hết luồng Trả phòng, Phạm Huy còn nợ tiền phòng nên có VietQR. (1) Ca dò của ARC: 07:00 ngày đi, gõ 05:30. Kỳ vọng QR và B18 mang `05:30` của **hôm nay**. (2) T10-8: 01:05 ngày đi, gõ 23:50. Kỳ vọng QR và B18 mang `23:50` của **hôm qua**. Cả hai ca so với `checkoutAt` máy chủ trả. Đột biến ở mục 3 |
| FB-R5-ARC-FE-125-02 | Minor | Done | Ô giờ hiện `act.fields.checkoutAt ?? act.fields.checkoutTime`. B18 trả 422 có trường `checkoutAt` thì tóm tắt được đọc lại; "Tiếp tục" chờ lần đọc đó xong (`atRecheck`) mới đi tiếp. Lần B18 sau mang `checkoutAt` mới. Câu lỗi lấy từ khóa có sẵn (`field.*` qua `fieldErrorText`), không viết chữ mới |
| FB-R5-ARC-FE-125-04 / FB-R5-UXD-FE-PR125-05 | Minor / Suggestion | Done | "Tiếp tục" khóa khi máy chủ đòi ghi chú mà ghi chú dưới 3 ký tự (`timeNote.trim().length < 3`), khớp `checkoutTimeNote` 3–300 của máy chủ. Câu lý do giữ `field.TIME_NOTE_REQUIRED` |
| FB-R5-UXD-FE-PR125-04 | Minor | Done | Bản đầu (`25fcb216`) xuống dòng ở mọi bề rộng; UXD trả thẻ PR140-01. Bản sửa ở mục 7 |
| FB-R5-UXD-FE-PR128-01…03 | Minor | Done | Ghi ở `v5-16-mlog-reductions-fea.md` mục 6 |
| FB-R5-ARC-FE-128-02 | Suggestion | Done | `ListAuditQuery` lấy từ tệp sinh (`types.ts`: `operations['listAuditEvents']['parameters']['query']`). Tạm bỏ `action`, vì đó là tham số lặp (`action=a&action=b`) mà query của client chỉ nhận giá trị đơn; chưa màn nào lọc theo action. Kiểu viết tay trong `endpoints.ts` đã xóa |
| BA: Nhật ký tiền chỉ tải trang đầu | – | Done (nhỏ) | "Xem thêm" đọc trang sau bằng `page.nextCursor`, cùng bộ lọc. Đổi bộ lọc hoặc trang đầu được đọc lại thì bắt đầu lại từ trang đầu. Nút nay dùng khóa chung `common.load_more` (mục 7). Cỡ thay đổi: khoảng 40 dòng trong `MoneyPage.tsx`, 10 dòng mock, 2 test |
| FB-R5-DOM-FE-125-01 | Suggestion | Deferred (v1.0.6) | Lý do ở mục 2 |
| FB-R5-DOM-UXD-128-02 | Suggestion | Deferred (v1.0.6) | Lý do ở mục 2 |
| FB-R5-ARC-FE-125-03 | Suggestion | Deferred (v1.0.6) | Theo ARC: bỏ đường dự phòng `checkoutInstant` sau tag v1.0.5 |

## 2. Hai thẻ DOM để v1.0.6
- **FB-R5-DOM-FE-125-01** (làm nổi giờ tự điền khi đồng hồ quầy đã qua giờ đó quá `manual_time_tolerance_minutes`). Cần một trong hai điều sau, và cả hai đều quá phạm vi một PR sửa review:
  - ngưỡng có trong hợp đồng: hiện API không trả `manual_time_tolerance_minutes`, mà FE không muốn ghi cứng số 30;
  - hoặc đọc lại tóm tắt khi bấm "Tiếp tục" lúc giờ còn là giờ tự điền: máy chủ dùng ngưỡng của chính nó, bật `checkoutTimeNoteRequired`, và PR125-02 sẽ chặn. Nhưng làm vậy đổi luồng "Tiếp tục".

  Đề xuất: ARC chọn một trong hai cách ở 0.3.14. Tới lúc đó, B18 vẫn đòi ghi chú, nên không thất thoát mà không ai biết (DOM đã ghi).
- **FB-R5-DOM-UXD-128-02** (dòng phụ "chưa gồm lần đếm lại minibar", nhãn theo khoảng ngày thật). Cần chữ mới của UXD mà chưa có khóa. FE không tự viết câu. Việc này gộp được với UXD PR128-04 (đổi nhãn công tắc, v1.0.6, PO, BA, UXD). Khi UXD có khóa, FE nối vào trong một lượt.

## 3. Mock và đột biến
- Mock `lateSurcharge` cho Trả phòng (tóm tắt, QR, B18) nay theo **thời điểm** trả, như `postMidnight` của máy chủ (`checkout-at.ts`). Thời điểm thuộc cửa sổ sau nửa đêm của ngày đi, hoặc là tối hôm trước, thì không phụ thu. Trước đây mock theo đồng hồ, nên 05:30 lúc 07:00 bị tính thêm một đêm, khác máy chủ. B15 Trả muộn giữ luật cũ.
- Mock `audit-events` trả `PageInfo` đúng hợp đồng (`limit`, `nextCursor`; trước là `hasMore`) và cắt trang theo `cursor`.
- Đột biến (script ngoài repo, chạy trên `v5-10-checkout-at-fea.test.tsx`, tệp được trả lại nguyên vẹn):

| Đột biến | Kết quả |
|---|---|
| f1b: Desk tự tính thời điểm ở mọi nơi (`checkoutInstant` trước, `s.checkoutAt` sau) | Đỏ: ca 05:30 |
| f1: Desk tự tính thời điểm cho QR | Đỏ: ca 05:30 và ca 23:50 |
| 125-02: không hiện lỗi `checkoutAt` dưới ô giờ | Đỏ |
| 125-04: chỉ chặn ghi chú trống | Đỏ |

## 4. Test
- Vitest:
  - `v5-10-checkout-at-fea.test.tsx` thêm 4 ca: 05:30, 23:50, 422 `checkoutAt`, ghi chú "ok";
  - `v5-16-mlog-reductions-fea.test.tsx` thêm 2 ca phân trang: đọc trang sau đúng bộ lọc, không trùng dòng; đổi bộ lọc thì bắt đầu lại.
- Kiểm tra trên admin-web: cả bộ vitest, `tsc` (admin-web, api-client), `eslint`, `prettier`.
- Ảnh đo `.wiz-foot` (dựng tĩnh, không dữ liệu khách) để ngoài repo, chờ QA kiểm che dữ liệu nếu cần đưa vào.

## 5. Việc cần vai khác (không ESC)
- **UXD**: xem lại phần CSS ở mục 7 (390, 768, 1024); khóa cho DOM-UXD-128-02 ở v1.0.6; xóa `webreq.load_more` khỏi `gen_strings.py` và `content-guide.md` khi muốn (nay không còn chỗ dùng).
- **ARC**: đọc phần chênh; quyết cách cho DOM-FE-125-01 ở 0.3.14 (ngưỡng trong hợp đồng, hoặc đọc lại lúc bấm).
- **QA**: ca hồi quy cho Nhật ký tiền có trên 100 dòng; Trả phòng 05:30 lúc 07:00 và 23:50 lúc 01:05 trên stack đồng hồ.
- **BA**: sổ tay có thể bỏ ý "danh sách có thể bị cắt" nếu đã ghi.

## 6. Giả định, ESC
- Không có ESC mới.
- Giả định:
  - `action` của `listAuditEvents` chưa cần ở Desk trong v1.0.5.

## 7. Phản hồi review #140 @ `25fcb216` (07/11)
- Nguồn:
  - `rounds/round-05/reviews/UXD-on-fe-prs-122-118-102-140.md`: DUYỆT CÓ ĐIỀU KIỆN;
  - `rounds/round-05/reviews/ARC-on-prs-140-124-98-102.md`: DUYỆT.

| Thẻ | Mức | Trạng thái | Cách làm |
|---|---|---|---|
| FB-R5-UXD-FE-PR140-01 | Major | Done | Luật xuống dòng chỉ có tác dụng dưới 600 px, và chỉ cho lớp riêng của Desk: `.wiz-foot.desk-foot`, gắn trên chân bước Nhận phòng và Trả phòng. Khối đặt sau `.input.is-prefilled`, nên chú thích V5-10 về lại cạnh luật của nó. Đo bằng markup tĩnh với 2 tệp CSS thật, câu `field.TIME_NOTE_REQUIRED`: ở 390, câu ở hàng 1, rộng 350, hai nút ở hàng 2, "Tiếp tục" bên phải; ở 768, 1024, 1280 và 1440, một hàng, cao 60, "Tiếp tục" bên phải, cùng hàng "Quay lại" |
| FB-R5-UXD-FE-PR140-02 | Minor | Done | Đi cùng PR140-01: `.wiz-foot` không có `desk-foot` thì không đổi gì. Đo ở 390: `order` 0, `nowrap`. H23 của trang khách giữ câu dưới hai nút |
| FB-R5-UXD-FE-PR140-03 | Minor | Done | "Xem thêm" lỗi thì giữ các dòng đã có. Dưới nút hiện `<p className="err m-0" role="alert">` với `common.error_generic_title`. Câu mất khi lần đọc sau thành công, hoặc khi có trang đầu khác (đổi bộ lọc). Một ca vitest |
| FB-R5-UXD-FE-PR140-04 | Minor | Done | Khóa chung `common.load_more` ("Xem thêm" / "Show more"), ghi chú theo đúng thẻ, thêm qua `gen_strings.py`. Nhật ký tiền và Yêu cầu từ website cùng dùng. `webreq.load_more` không còn chỗ dùng nhưng chưa xóa: UXD xóa cùng `content-guide.md` |
| FB-R5-ARC-FE-140-01 | Minor | Done | Viết lại ca 125-02. Lần đọc lại sau 422 bị giữ bằng một promise trong `server.use`, rồi trả một `checkoutAt` **khác** (12:04). Bấm "Tiếp tục" lúc đang giữ thì không sang bước bill. Sau đó kiểm `reads.length > readsBefore`; B18 lần hai mang giá trị mới, khác giá trị bị từ chối. Đột biến m1 (bỏ `sum.reload()`) và m2 (không chờ) nay đều đỏ |
| FB-R5-ARC-FE-140-02 | Suggestion | Done (rẻ) | Tắt "Xem thêm" khi trang đầu đang tải (`state.status === 'loading'`). Ca đổi bộ lọc kiểm thêm: số dòng ≤ một trang |
| FB-R5-ARC-FE-140-03 | Suggestion | Done (rẻ) | Nhãn của người không có trong danh sách theo **trạng thái** (`loading`), không theo dữ liệu. Danh sách lỗi thì hiện `mlog.who_unlisted`, không hiện "Đang tải…" mãi. Thêm một ca |

Đột biến lượt này (script ngoài repo; các tệp được trả lại nguyên vẹn):

| Đột biến | Kết quả |
|---|---|
| m1: không đọc lại sau 422 | Đỏ |
| m2: "Tiếp tục" không chờ lần đọc lại | Đỏ |
| PR140-03: nuốt lỗi trang sau | Đỏ |
| ARC 140-03: nhãn theo dữ liệu | Đỏ |

- Test: vitest 3 ca mới, 1 ca viết lại.
- UXD xin "một ca test ở 768 px". Vitest không dựng bố cục, nên FE đo bằng Playwright với markup tĩnh (số ở trên; ảnh ngoài repo). Ca E2E thật trên Desk ở 768, đề nghị QA thêm vào bộ UI.
- Không viết chữ mới. Không đổi màu.

## 8. PR nhỏ sau #140 (nhánh `r5-fe-foot-alert`, UXD lượt 3 mục 9.4)

| Thẻ | Mức | Trạng thái | Cách làm |
|---|---|---|---|
| FB-R5-UXD-FE-PR140-05 | Minor | Done | Thêm `.wiz-foot.desk-foot > .btn.pri { margin-left: auto; }` trong cùng `@media (max-width: 599px)`. Đo bằng markup tĩnh với CSS thật: bước Minibar (3 nút) ở 390 và 430, nút chính cách mép phải 20 px; Trả phòng có câu lý do không đổi; từ 768 một hàng như cũ |
| FB-R5-UXD-FE-PR140-06 | Minor | Done | Câu lỗi "Xem thêm" thành `<Alert tone="bad" title={t('common.error_generic_title')} />` của `@ottimo/ui`, nằm trong `.stack`, cách nút 12 px. Không thêm chữ, không thêm CSS |
| ARC #140 G2 (test chập chờn) | – | Chưa sửa – chuyển QA (ARC 11.3) | #150 thêm `{ timeout: 5000 }` ở 4 chỗ của `r3-v1-feb-webreq`, nhưng `setup.ts` đã đặt `asyncUtilTimeout` 5 s, nên không đổi gì. PR `r5-fe-a2-followup` bỏ lại 4 chỗ đó và chú thích "1 s default" (FB-R5-ARC-FE-150-01). Ca chập chờn luồng yêu cầu website → H09 do QA ghi |

- Test:
  - `packages/ui/src/styles.test.ts` thêm 2 ca đọc `app.css`. Ca 1: không luật nào ngoài khối `@media (max-width: 599px)` chạm `.wiz-foot`, và mọi luật trong khối đều là `.wiz-foot.desk-foot`. Ca 2: đủ ba luật, xuống dòng, câu lý do `order: -1`, nút chính `margin-left: auto`;
  - ca "Xem thêm" lỗi kiểm thêm lớp `alert bad` và biểu tượng.
- Đột biến, đều đỏ: bỏ luật PR140-05; thêm lại `.wiz-foot { flex-wrap: wrap }` toàn cục; trả câu lỗi về `<p>`.
- Ca E2E thật ở 390 cho bước Minibar: QA thêm (UXD 9.5).

