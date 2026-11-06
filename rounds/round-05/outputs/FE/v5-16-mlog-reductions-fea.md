# FE-A – Nhật ký tiền: bộ lọc "Sửa giảm dòng – 7 ngày" (US-177 AC7 (i))

- Round 5, bước Sản xuất · FE-A · 07/11/2026
- Nguồn:
  - ORC 07/11: PO giữ AC7 (i) ở v1.0.5 (quyết định 26);
  - BR-438 (4)(ii); hợp đồng 0.3.13 bổ sung 1 `listAuditEvents.reductionsOnly`; BE PR #108 (đã gộp);
  - UXD `copy-v1.0.5.md` mục 9.5 (`mlog.filter_reductions`, `attn.line_reduction_count`);
  - BA `01` mục 2.1, 8.1 ("7 ngày tính theo ngày lịch").
- Nhánh `r5-fe-mlog-reductions` cắt từ `origin/main`.

## 1. Việc đã làm
- **Bộ lọc "Sửa giảm dòng – 7 ngày"** (`pages/money/MoneyPage.tsx`, tab Nhật ký thao tác tiền):
  - công tắc `mlog.filter_reductions`, chỉ MGR, OWN. FD, FDL không thấy;
  - bật công tắc: gửi `reductionsOnly=true`, khoảng ngày đặt về 7 ngày lịch gần nhất (hôm nay − 6 → hôm nay);
  - ô **Người làm** (`mlog.who`, mặc định `mlog.all_people`), chỉ MGR, OWN, gửi `actorUserId`. Danh sách người lấy từ `listCloserCandidates(kind=staff)`: người dùng đang hoạt động có vai sale, lễ tân, lễ tân trưởng, quản lý, chủ đầu tư. FD+ đọc được; `listUsers` chỉ OWN đọc được nên không dùng.
- **Liên kết từ "Cần chú ý"** `/audit?reductionsOnly=true&month=YYYY-MM&actorUserId=…`:
  - trang mở với công tắc bật, đúng người;
  - tháng đổi thành khoảng ngày lịch, từ ngày 1 tới hết tháng hoặc tới hôm nay (theo BE-H: API nhận `from`/`to`).
- **Dòng "Cần chú ý"** `foc_threshold` `check = line_reduction_count` (`app/attention.ts`):
  - câu `attn.line_reduction_count`, không tên;
  - mở `link` của máy chủ khi link trỏ vào `/audit?`, không thì mở bộ lọc chung.
- **Sửa lỗi có sẵn, phát hiện khi làm**:
  - Desk gửi `dateFrom`/`dateTo`, nhưng máy chủ chỉ đọc `from`/`to`. Vì vậy ô **Từ ngày**, **Đến ngày** chưa bao giờ có tác dụng: máy chủ luôn trả 7 ngày gần nhất;
  - `ListAuditQuery` (`packages/api-client/src/endpoints.ts`, viết tay, không phải tệp sinh) nay là `from`/`to`, kèm `reductionsOnly`;
  - mốc "hôm nay" của Nhật ký tiền đổi từ ngày nghiệp vụ sang ngày lịch (máy chủ đọc `from`/`to` theo ngày lịch). Không đổi thì lúc 00:00–05:59 dòng ghi sau nửa đêm bị lọc mất.
- **Chữ**:
  - `gen_strings.py` thêm 2 khóa, chép nguyên từ UXD 9.5: `mlog.filter_reductions`, `attn.line_reduction_count`;
  - đã sinh lại `strings-*.json`, `strings.js`, `strings-tables.md`. FE không tự viết câu.

## 2. Mock
- `audit-events`:
  - lọc `from`/`to` theo ngày lịch Asia/Ho_Chi_Minh, mặc định 7 ngày;
  - `reductionsOnly`: `folio_line.adjusted` có số sau < số trước, không gồm dòng tiền đêm (`room`, `extra_person`, `room_change_difference`).
- Bản ghi `folio_line.adjusted` của mock nay có dạng như máy chủ: `before { amountVnd, category }`, `after { amountVnd }`, `reason`. Trước đây mock để số trước trong `after.before`, nên cột Trước → sau hiện "—".
- `closer-candidates` `kind=staff`: theo máy chủ, gồm sale, lễ tân, lễ tân trưởng, quản lý, chủ đầu tư. Trước đây mock chỉ trả sale.

## 3. Test
- Vitest `v5-16-mlog-reductions-fea.test.tsx` (4 ca):
  - MGR:
    - lần đọc đầu gửi `from`/`to`, không còn `dateFrom`;
    - bật công tắc thì gửi `reductionsOnly` với 7 ngày, bảng chỉ còn 2 lần sửa giảm. Bị loại: dòng tiền đêm, lần tăng, lần cũ hơn 7 ngày;
    - chọn Lan thì gửi `actorUserId`, bảng còn 1 dòng;
  - FD: không có công tắc, không có ô người;
  - liên kết "Cần chú ý" (tháng, người) mở đúng bộ lọc;
  - dòng "Cần chú ý" `line_reduction_count`: câu đúng, link đúng; link lạ thì không theo.
- Admin-web cả bộ; `tsc` (admin-web, api-client); `eslint`; `prettier`.

## 4. Việc cần vai khác (không ESC)
- **UXD**: xem chỗ đặt công tắc và ô Người làm trên hàng lọc (390 và 1440 px). Hai khóa đã dùng nguyên chữ mục 9.5.
- **BA**: `01` mục 8.1 ghi "không lọc theo người". Nay MGR, OWN lọc được theo người, và ô Từ ngày, Đến ngày đã có tác dụng thật.
- **QA**: ca T-16-6, T-16-10 phần bộ lọc. Ca hồi quy: ô ngày của Nhật ký tiền nay có tác dụng thật.
- v1.0.6 (thẻ 108-01, không làm ở đây): lọc theo loại dòng, cột vai lúc sửa, số trước → sau riêng cho lần sửa giảm.

## 5. Giả định, ESC
- Không có ESC mới.
- Giả định:
  - danh sách người lấy từ `closer-candidates` `kind=staff` là đủ cho bộ lọc, vì người sửa giảm là FD, FDL, MGR, OWN;
  - người của liên kết "Cần chú ý" không còn trong danh sách (đã nghỉ) thì ô vẫn lọc theo người đó. Nhãn của lựa chọn này nay là `mlog.who_unlisted` (mục 6, PR128-01), không còn "–".

## 6. Phản hồi review UXD #128 (`rounds/round-05/reviews/UXD-on-fe-prs-125-128.md`)
Đã merge main trước (merge, không rebase; strings.js lấy bản của main rồi chạy lại `gen_strings.py`). Bốn khóa mới chép nguyên văn từ tệp review, đặt ngay sau `mlog.filter_reductions` trong `gen_strings.py`.

| Thẻ | Mức | Trạng thái | Cách làm |
|---|---|---|---|
| FB-R5-UXD-FE-PR128-01 | Minor | Done | Lựa chọn cho người của liên kết "Cần chú ý" không có trong danh sách: nhãn `mlog.who_unlisted` thay "–". Lúc danh sách chưa tải xong thì nhãn là `common.loading`, để không gọi nhầm một người còn làm là "không còn trong danh sách". Bộ lọc vẫn theo người đó |
| FB-R5-UXD-FE-PR128-02 | Minor | Done | Tải danh sách người lỗi thì ô Người làm có dòng `help` = `mlog.who_error`. Dòng này gắn vào ô qua `aria-describedby` của `Field`. Chữ Stone, không Alert; bảng vẫn tải |
| FB-R5-UXD-FE-PR128-03 | Minor | Done | (a) Công tắc bật mà không có dòng nào thì tiêu đề là `mlog.empty_reductions_title`. (b) FD, FDL không có ô Người làm, nên thân là `mlog.empty_body_dates`. MGR, OWN giữ `mlog.empty_body` |
| FB-R5-UXD-FE-PR128-04 | Minor | Deferred (v1.0.6) | Theo review: giữ nhãn "Sửa giảm dòng – 7 ngày" ở v1.0.5. PO, BA, UXD đổi nhãn ở v1.0.6 |

Test thêm 4 ca vitest trong `v5-16-mlog-reductions-fea.test.tsx`:
- người không có trong danh sách: lựa chọn đúng nhãn, vẫn là giá trị đang lọc, tiêu đề rỗng của công tắc, thân MGR;
- danh sách người lỗi (500): câu nhắc là mô tả của ô, không có `role=alert`;
- danh sách tải được: không có câu nhắc;
- FD, khoảng ngày không có dòng nào: tiêu đề thường, thân chỉ nói về ngày.

Hai thẻ DOM (FB-R5-DOM-FE-125-01, FB-R5-DOM-UXD-128-02) không làm trong PR này, theo lệnh ORC: đi PR tiếp nối hoặc v1.0.6.
