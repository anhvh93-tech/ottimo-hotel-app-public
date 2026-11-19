# ARC review PR #199 (BE) – BUG-R5-014, BUG-R5-015 (QA staging FB-INV-012 §12)

- Round 5, bước **Review** kỹ thuật (nhanh). Người review: ARC. Ngày 19/11/2026.
- PR #199, nhánh `r5-fb012-golive-be-fix`, head **`11fac85a`**, base `main`. Sửa 4 file: `checkin.service.ts`, `statements.service.ts`, `fb-inv-012-golive.test.ts`, `BE-responses.md`. Không có migration, không đổi OpenAPI/RBAC/file sinh.
- Đã đọc: `gh pr diff 199`; `BE-responses.md` mục "QA staging 19/11"; `rounds/round-05/qa/fb-inv-012-staging.md` mục L3.4; contract §12.1.2, §12.11.
- CI của `11fac85a`: mọi job xanh (contract `--strict`, Redocly, test có PostgreSQL thật, E2E smoke, gitleaks).

## 0. Kết luận

**DUYỆT gộp.** Không có thẻ Blocker/Major/Minor. Có 1 Suggestion. Không ESC.

## 1. BUG-R5-014: `moveArrival` loại đoạn của chính đơn

- **Sửa:** `occupancy.update` được gọi kèm `excludeSegmentIds: [seg.id]`. B9a (`checkin.service.ts` ~1307) cũng gọi đúng như vậy, nên hai đường giờ nhất quán.
- **Kết quả:** khi kiểm căn trống cho các đêm thêm, server không còn coi đêm của chính đơn là xung đột. 409 `ROOM_UNAVAILABLE` chỉ liệt kê lượt khác.
- **Không đổi:** kiểm đặt trùng với lượt khác vẫn chạy trong cùng giao dịch, dưới khóa căn.
- **Test:** ca Q4 khẳng định `conflicts[].reservationCode` chỉ có mã của đơn đang giữ đêm 04/11. Đạt.

## 2. BUG-R5-015: `availableActions` của MGR dùng cùng điều kiện với lúc ghi

- **Hàm dùng chung:** `paymentHistoryBarsManager` là một câu SQL, chặn khi phiếu có khoản `reversed` hoặc có khoản thu thật nhận sau ngày nhận phòng bù. Hai nơi cùng gọi:
  - `assertManagerGoLiveScope` (lúc ghi);
  - `managerMayOffer` (lúc trả `availableActions`), gộp với `holdsBackdatedArrival`.
- **Hệ quả:** hai lối không thể lệch nhau nữa. Thẻ ARC-BE-197-02 giờ phủ cả phần lịch sử thanh toán SEC 197-02 thêm sau đó.
- **Phạm vi:** OWN không đổi. Trường hợp chỉ có vai FDL/FD trả `false` sớm, không chạy truy vấn.
- **Chi phí:** chỉ MGR tốn thêm một truy vấn đếm cho mỗi phiếu `issued`/`partially_paid` của đơn nhận phòng bù. Cơ sở có 10 căn, nên không đáng kể so với ngân sách p95.
- **Test:** sau khi đảo khoản, MGR không thấy hành động, OWN vẫn thấy, MGR gửi lệnh vẫn 403. Đạt.

## 3. Q3: tài liệu lệch code

BE nói đúng. Với `createReservation`, đơn ngắn ngày (không kèm `manualLongStay`) gửi `backdatedArrival` nhận `422 backdatedArrival: NOT_ALLOWED`. Hành vi này khớp §12.1.1, OpenAPI 0.3.15 và test. `NOT_LONG_STAY` chỉ dùng ở `checkInBackdated`. ARC đã sửa contract §12.11 Q3 theo code.

## 4. QA L3.4: `checkinBackdatedOn` vẫn còn sau khi hoàn tác nhận phòng (B17)

**Đúng chủ ý. Giữ nguyên.**

- **Nghĩa của cột:** "đơn đã từng nhận phòng bù", không phải "đang ở theo nhận phòng bù". Cột là dấu để kiểm soát:
  - SEC 12-01 (2): đổi người chốt chỉ OWN được làm;
  - SEC 12-02: phạm vi MGR khi ghi "ngoài app";
  - audit hằng tháng của OWN.
  
  Xóa cột khi hoàn tác sẽ mở lại đúng đường SEC muốn chặn: nhập bù, hoàn tác, đổi người chốt.
- **Không có đường "nhận phòng thường" với dấu cũ:** sau B17, đơn vẫn có ngày đến < T. `checkIn` thường đòi `today = arrival_date` (`checkin.service.ts` ~207, ~658), nên chỉ còn `checkInBackdated`, và lệnh này ghi đè ngày và lý do. Đúng như QA thấy.
- **Đã ghi vào contract §12.1.2** (dòng "Ghi").

Ghi chú thêm: cũng ở L3.4, QA nêu §12.3 "trang công khai căn" chưa có ở server. ARC đã thêm vào contract §12.3: "chưa áp dụng ở v1.0.7".

## 5. Thẻ

### FB-R5-ARC-BE-199-S1
- Mức độ: Suggestion
- Vị trí: `reservations.service.ts` (dời ngày, A08); `checkin.service.ts` `checkIn`.
- Vấn đề / đề xuất: trường hợp hiếm duy nhất còn dấu cũ đi qua đường thường: đơn đã hoàn tác nhận phòng bù, rồi được dời ngày đến về đúng hôm nay, rồi nhận phòng **thường**. Khi đó cửa sổ chỉ số nhận phòng của 12.1.3 vẫn áp (luôn ghi trễ, FDL+). Cửa sổ này chặt hơn, không lỏng hơn, nên không có rủi ro tiền hay quyền. Nếu QA gặp, thêm một ca vào test; không cần sửa mã.
- Trạng thái: Open

## 6. Điểm làm tốt

- Sửa đúng gốc: dùng lại `excludeSegmentIds` có sẵn, và tách một hàm dùng chung thay vì chép điều kiện sang chỗ thứ hai.
- BE báo lệch tài liệu Q3 cho ARC sửa, không tự sửa contract. Migration 0100 giữ nguyên (đã đóng băng).
