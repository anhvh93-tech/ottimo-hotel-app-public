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
| FB-R5-UXD-FE-PR125-04 | Minor | Done | `packages/ui/src/styles/app.css`: `.wiz-foot { flex-wrap: wrap }`. Dưới 600 px, `.wiz-foot > .li-s` chiếm cả hàng, nằm trên hai nút. Áp cho cả Trả phòng và Nhận phòng (cùng lớp). Đo với 2 tệp CSS thật: ở 390 câu lý do rộng 350 px, nằm trên, hai nút ở hàng dưới; ở 1440 vẫn một hàng. Không thêm màu |
| FB-R5-UXD-FE-PR128-01…03 | Minor | Done | Ghi ở `v5-16-mlog-reductions-fea.md` mục 6 |
| FB-R5-ARC-FE-128-02 | Suggestion | Done | `ListAuditQuery` lấy từ tệp sinh (`types.ts`: `operations['listAuditEvents']['parameters']['query']`). Tạm bỏ `action`, vì đó là tham số lặp (`action=a&action=b`) mà query của client chỉ nhận giá trị đơn; chưa màn nào lọc theo action. Kiểu viết tay trong `endpoints.ts` đã xóa |
| BA: Nhật ký tiền chỉ tải trang đầu | – | Done (nhỏ) | "Xem thêm" đọc trang sau bằng `page.nextCursor`, cùng bộ lọc. Đổi bộ lọc hoặc trang đầu được đọc lại thì bắt đầu lại từ trang đầu. Nút dùng khóa có sẵn `webreq.load_more` ("Xem thêm" / "Show more"), không viết chữ mới. UXD có thể chuyển sang khóa chung nếu muốn. Cỡ thay đổi: khoảng 40 dòng trong `MoneyPage.tsx`, 10 dòng mock, 2 test |
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
- **UXD**: xem lại chỗ câu lý do ở 390 trên Nhận phòng và Trả phòng; xem có muốn khóa chung thay `webreq.load_more` không; khóa cho DOM-UXD-128-02 ở v1.0.6.
- **ARC**: đọc phần chênh; quyết cách cho DOM-FE-125-01 ở 0.3.14 (ngưỡng trong hợp đồng, hoặc đọc lại lúc bấm).
- **QA**: ca hồi quy cho Nhật ký tiền có trên 100 dòng; Trả phòng 05:30 lúc 07:00 và 23:50 lúc 01:05 trên stack đồng hồ.
- **BA**: sổ tay có thể bỏ ý "danh sách có thể bị cắt" nếu đã ghi.

## 6. Giả định, ESC
- Không có ESC mới.
- Giả định:
  - "Xem thêm" dùng khóa có sẵn của màn Yêu cầu web là chấp nhận được tới khi UXD đổi;
  - `action` của `listAuditEvents` chưa cần ở Desk trong v1.0.5.
