# PO review – tài liệu v1.0.5 BA sửa ở `1217858a` (release notes v1.0.5, Tờ 2a)

- Người review: PO | Round 5 – Review | Ngày: 07/11/2026
- Đối tượng:
  - `product/docs/release-notes.md` mục v1.0.5 (V5-72, tài liệu của PO) và câu BA sửa ở v1.0.4 bảng "Báo giữ chỗ quá hạn";
  - `product/docs/staff-one-pager.md` Tờ 2a (tài liệu của PO + DOM), phần hộp Thông báo.
- Đối chiếu:
  - mã trên `main`: `hold-notices.ts` (người nhận 3 loại tin), `reservations.service.ts` `expireHolds`, `notifications.tsx` (`NOTIF_KEYS`, `notifRef`), `session.ts` của app nhân viên (vai lễ tân đăng nhập được), `SessionProvider.tsx` của Desk (`MFA_ENROLLMENT_REQUIRED`), `strings-vi.json` (`staff.notif.k.other`, `refund.bank_reference`); Desk không có hộp Thông báo;
  - QA `rounds/round-05/qa/bug-list.md` BUG-R5-005, BUG-R5-006;
  - SEC `rounds/round-05/reviews/SEC-on-be-prs-101-108.md` mục 1.4, 3.3, thẻ V530-01, V516-02;
  - DOM `rounds/round-05/reviews/DOM-on-be-prs-101-108-110.md` mục 1.2, 1.3, thẻ 101-01; `rules-v1.0.5.md` mục 0 việc (4), 14.2;
  - DOM `rounds/round-05/reviews/DOM-on-ba-v105-docs.md` (`da9ac25d`), thẻ FB-R5-DOM-PO-08;
  - sổ tay `user-manual-v1.0.md` 1.5 (không bật 2 bước lần đầu trên máy quầy), `guides/01` (Tham số quy tắc, nhóm "FOC, hoa hồng, phí kênh");
  - brand guideline `00-brief/context/brand/brand-guidelines.md` (câu khách).
- Không ghi tỷ lệ hay số tiền hoa hồng. Không dữ liệu khách.

## 0. Kết luận

**ĐẠT CÓ ĐIỀU KIỆN.** Phần BA sửa đúng mã và đúng phạm vi v1.0.5. PO sửa thẳng 7 chỗ trong hai tài liệu của mình (mục 2), trong đó có chữ thay nguyên văn của DOM cho Tờ 2a (thẻ FB-R5-DOM-PO-08, Major). Điều kiện:

1. Các câu "Từ v1.0.5" đúng khi đủ PR cùng tag. PO đặt bảng kiểm cắt tag ở plan R5 **mục 4a** (T1–T9).
2. DOM đọc lại một câu Tờ 2a theo thẻ 08 trước khi UXD dựng bản in.

UXD dựng lại PDF Tờ 2a **sau khi DOM đọc lại câu đó**. HTML sổ tay và bộ hướng dẫn: chờ BA sửa sổ tay 2.4 và `guides/02` theo cùng thẻ 08. Không có thẻ mới cho BA (mục 3).

## 1. Đối chiếu từng câu ORC nêu

| Câu | Đúng phạm vi v1.0.5 | Lời chủ đầu tư hiểu | Không số hoa hồng, không dữ liệu khách | Kết luận |
|---|---|---|---|---|
| v1.0.4 bảng "Báo giữ chỗ quá hạn", câu BA sửa: app nhân viên v1.0.4 chưa có ba câu riêng, cả ba tin hiện câu chung "Thông báo mới – xem chi tiết trên OTTIMO Desk" kèm mã đơn | Đúng: `NOTIF_KEYS` không có 3 loại giữ chỗ → `staff.notif.k.other`; `notifRef` hiện mã đơn. Người nhận v1.0.4 khớp `hold-notices.ts` | Có | Có | Giữ |
| "Việc anh/chị làm trước ngày lên v1.0.5" | Đúng, nhưng thiếu hai việc chủ đầu tư phải làm trước: hẹn diễn tập khôi phục (chặn cả bản) và nhập tỷ lệ hoa hồng ngắn ngày (DOM 14.2: làm ngay trên Desk v1.0.4). Câu "không bật được trên máy quầy" sai nghĩa: sổ tay 1.5 là **không được** bật lần đầu trên máy quầy, không phải Desk không cho | Có | Có | PO sửa (mục 2, chỗ 3–5) |
| Bảng BUG-R5-005/006 và cách làm tạm | Đúng bug list: P3/P2, có từ v1.0.0, PR #107 đã gộp, nhãn ô `refund.bank_reference` đúng chữ Desk, 8 chữ số không bao giờ bị chặn (luật 13–19 chữ số), câu mới `pay.bank_reference_card_like` đúng UXD. Câu khách EN dẫn, VI hỗ trợ, ngắn, không emoji | Có. "trang tập" là chữ lạ | Có; câu không lặp lại số khách gõ | PO sửa "trang tập" → "staging" (chỗ 6). Câu khách nói rộng hơn "số thẻ": backlog R5-B-14 (DOM thẻ UXD-02) |
| `line_reduction_count` | Đúng ý SEC V516-02 | **Chưa**: tên trường kỹ thuật, không nói chủ đầu tư thấy ở đâu | Có | PO viết lại theo chỗ chủ đầu tư thấy: **Cần chú ý** (chỗ 1) |
| "Chưa có tỷ lệ hoa hồng" | Một phần. (a) "dòng hoa hồng được tạo sau khi chủ đầu tư nhập tỷ lệ" chỉ đúng khi thẻ DOM 101-01 xong (`r5-h1b`, nay ở V5-30). (b) "vẫn nhập bảng mới trước kỳ chốt 01/12" lệch DOM 14.2: làm được và nên làm **ngay** trên Desk v1.0.4, vì mỗi ngày chậm thêm đơn chụp tỷ lệ cũ. (c) Thiếu ý DOM 1.2 ý 2: đơn từ 01/11 tới ngày tỷ lệ mới có hiệu lực mang tỷ lệ cũ, chủ đầu tư chỉnh khi chi ngoài Desk | Có | **Có**: không tỷ lệ, không số tiền | PO sửa (chỗ 2), thêm dòng v1.0.4 **Giới hạn đã biết** (chỗ 7) |
| Tờ 2a, hộp Thông báo | Đúng chỗ đọc, đúng người nhận từ v1.0.5. Sai một ý (DOM thẻ 08): ở v1.0.4 câu chung kèm mã đơn còn là giữ chỗ có cọc quá hạn và giữ chỗ còn chờ cọc sau 12:00; tài khoản 6 vai nhận cả ba; tin không đổ chuông | Có | Có | PO dán chữ DOM nguyên văn (mục 2, Tờ 2a) |

Điều kiện "Từ v1.0.5" (giả định BA): **plan R5 mục 4a** – T1 (#100 + MOB #117), T2 (FE #102 + MOB #97), cùng T3–T9 cho các câu khác của release notes. Bảng kiểm thuộc PO vì PO viết plan và release notes.

## 2. PO đã sửa thẳng

**Release notes** (`product/docs/release-notes.md`):
1. Dòng **Trả phòng và tiền ở quầy**: câu `line_reduction_count` → "**Cần chú ý** báo chủ đầu tư khi một người tự sửa giảm dòng quá ngưỡng trong tháng (cùng ngưỡng với cảnh báo miễn phí). Tháng 11/2026 chỉ đếm các lần sửa từ lúc v1.0.5 lên…". Bộ lọc ghi rõ ở **Nhật ký tiền**, cho quản lý và chủ đầu tư, lọc theo người; lọc theo loại dòng ở v1.0.6 (R5-B-11).
2. Dòng **Hoa hồng và phí dọn thuê tháng**:
   - đơn chốt lúc thiếu tỷ lệ có dòng hoa hồng chậm nhất lúc trả phòng và thu đủ, đơn giữ tỷ lệ đó (101-01);
   - tỷ lệ 0 ghi "0 đ";
   - Desk hiện vẫn dùng tỷ lệ cũ: nhập ngay trên Desk đang chạy;
   - đơn từ 01/11 tới ngày tỷ lệ mới: đội báo số đơn, chủ đầu tư chỉnh khi chi, ngoài Desk.
3. **Việc anh/chị làm trước ngày lên**: thêm bước 1, hẹn diễn tập khôi phục.
4. Cùng mục: thêm bước 3, nhập tỷ lệ hoa hồng ngắn ngày ngay. Ghi chỗ nhập trên Desk, không gửi số cho đội.
5. Cùng mục, bước 2: "không bật được trên máy quầy" → "không được bật lần đầu trên máy quầy (sổ tay 1.5)". Sửa số bước ở v1.0.4 **Giới hạn đã biết** (bước 1 → bước 2).
6. BUG-R5-005: "trang tập v1.0.5" → "staging v1.0.5".
7. v1.0.4 **Giới hạn đã biết**: thêm dòng "Hoa hồng ngắn ngày vẫn tính theo tỷ lệ cũ", trỏ bước 3.

Thêm theo DOM thẻ 08: dòng **Tin giữ chỗ tự hủy** có câu "Tin không đổ chuông…, làm theo trạng thái đơn".

**Tờ 2a** (`product/docs/staff-one-pager.md`):
- gạch **Ở đâu** và vế đầu gạch **Hết hạn, chưa cọc**: chữ DOM thẻ 08 nguyên văn;
- bảng **Cách in và dán**: câu "Tờ 2a chưa in tới khi sửa dòng Hết hạn, chưa cọc" đã cũ (dòng đó sửa 06/11 khuya). Thay bằng "in bản sửa 07/11 khi đội báo PDF đã dựng lại";
- dòng lịch sử sửa.

## 3. Thẻ

Không có thẻ mới cho BA. Mọi chỗ cần sửa nằm trong tài liệu PO sở hữu, nên PO sửa thẳng. Ý cùng thẻ DOM 08 ở sổ tay 2.4 và `guides/02` do BA sửa theo thẻ DOM; ORC đã báo BA.

## 4. Điểm làm tốt

- BA đối chiếu từng câu với mã (`hold-notices.ts`, `notifications.tsx`, `SessionProvider.tsx`). Nhờ đó câu v1.0.4 "Báo giữ chỗ quá hạn" sửa được đúng hiện trạng trước khi chủ đầu tư đọc.
- Mỗi chỗ ghi cả v1.0.4 và "Từ v1.0.5", và không gỡ lời dặn tạm trước khi bản lên. Cách trình bày này giữ được cho các bản sau.
- BA tự nêu giả định "Từ v1.0.5" cần đủ PR cùng tag. PO dựng được bảng kiểm 4a từ đó.
