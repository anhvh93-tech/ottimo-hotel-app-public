# UXD review – FE-A2 PR #164 (dòng "Đổi người chốt" ở Nhật ký tiền, chữ 9.18)

- Người review: UXD | Round 5 – bước **Review** | 07/11/2026
- Đối tượng: **#164** `r5-fe-a2-159b-closer-copy` @ **`dbef4c71`**. Chỉ đọc: không đẩy lên nhánh PR, không gộp, không đánh dấu ready. Các tệp: `MoneyPage.tsx` (`AuditAction`, nhánh `reservation.closer_changed`), `gen_strings.py` và các tệp sinh ra, test `r5-mlog-closer-names-fea.test.tsx`.
- Đối chiếu: `rounds/round-05/outputs/UXD/copy-v1.0.5.md` mục 9.18 (bản 2.6, `7f2a8e35`); DOM FB-R5-DOM-FE-159-01; ARC FB-R5-ARC-FE-159-01.
- Cách kiểm:
  - so 2 khóa trong `strings-vi.json`, `strings-en.json` của PR với bảng 9.18 bằng script: **2/2 khớp từng byte, VI và EN**. Không có ký tự lạ (chỉ chữ Việt, ASCII, dấu ngoặc). `gen_strings.py` thêm đúng 2 dòng, ghi chú khóa trỏ về 9.18;
  - đọc mã nhánh `reservation.closer_changed`;
  - chạy mock trong worktree riêng ở scratchpad, cổng 5364. Chụp bằng Chromium không giao diện (Playwright) ở 1440 và 390 px, VI và EN, vai `qa.mgr`. Khung Browser của app không chạy được MSW, như ở review #162. Seed mock chỉ có một dòng đổi người chốt (Sơn → Mai), nên UXD thêm **tạm, chỉ trong worktree**, hai dòng: một dòng `before`, `after` rỗng (bản ghi trước #154), một dòng người chốt cũ là tài khoản đã tắt. Không đẩy, đã xóa cùng worktree. Ảnh chỉ ở scratchpad, không đưa vào repo.

## 0. Kết luận

**DUYỆT.** Không có thẻ.

Trên mock, cả ba dòng hiện đúng 9.18:

| Dòng mock | VI | EN |
|---|---|---|
| Có hai id, cả hai có trong danh sách | Đổi người chốt: Sơn → Mai | Closer changed: Sơn → Mai |
| `after` không có khóa `closerUserId` | Đổi người chốt (bản ghi cũ, không có tên) | Closer changed (older record, no names) |
| Id cũ không có trong danh sách | Đổi người chốt: Tài khoản hiện không hoạt động → Sơn | Closer changed: Inactive account → Sơn |

- Không tràn ngang ở 1440 và 390 (bảng cuộn trong khung của nó, như trước).
- Ô lọc Người làm vẫn dùng `mlog.who_unlisted`, đúng 9.18.

## 1. Chỗ lệch có chủ ý: danh sách tải lỗi

- 9.18 bản 2.6 ghi "tải lỗi: như #159". Lúc UXD viết, #159 sẽ đổi **mọi** id thành chữ "không còn trong danh sách" khi tải lỗi. FE-A2 làm theo DOM 159-01: tải lỗi thì hiện `common.error_generic_title` ("Chưa tải được dữ liệu" / "Couldn't load data").
- **UXD đồng ý.** Lý do:
  - khi danh sách không tải được, Desk không biết người đó còn hoạt động hay không. "Tài khoản hiện không hoạt động" lúc đó là câu sai. Với chủ đầu tư đang kiểm việc đổi người chốt, câu sai còn tệ hơn câu chung;
  - "Chưa tải được dữ liệu" nói đúng điều Desk biết. Cùng trang đã có dòng `mlog.who_error` dưới ô Người làm, chỉ cách tải lại;
  - cùng cách với ô Người chốt ở #162 (G5), nên hai màn nói giống nhau.
- Câu "Đổi người chốt: Chưa tải được dữ liệu → Chưa tải được dữ liệu" hơi dài, nhưng chỉ hiện khi lỗi và nói thật. Không cần khóa mới.
- UXD đã sửa ghi chú 9.18 ở `copy-v1.0.5.md` bản 2.7: tải lỗi → `common.error_generic_title` (DOM 159-01). Không đổi số khóa.

## 2. Ghi chú khác
- Nhánh bản ghi cũ dựa vào **có hay không có khóa** `closerUserId` trong `after` (`after` là `{}` khi máy chủ trả `null`). Bản ghi mới mà ghi người chốt lần đầu vẫn ra "— → Mai". Đúng 9.18.
- Lúc đang tải: "Đang tải… → Đang tải…" (ARC 159-01). Chấp nhận: chỉ thấy trong chốc lát.
- Không thêm màu, cỡ chữ hay emoji. Chữ đi qua `t()`.

## 3. Dòng đề xuất cho `01-decisions/decision-log.md` (ORC ghi)

`| 2026-11-07 | 5 | **UXD – review FE-A2 PR #164 (Nhật ký tiền, dòng Đổi người chốt, chữ 9.18) @ dbef4c71: DUYỆT, không thẻ.** mlog.a_closer_changed_legacy và mlog.closer_inactive khớp 9.18 từng byte VI/EN; mock 1440/390 VI/EN (Playwright headless): ba dòng đúng (tên → tên; bản ghi cũ không có tên; tài khoản hiện không hoạt động), ô lọc Người làm giữ who_unlisted, không tràn ngang. Chỗ lệch có chủ ý (danh sách tải lỗi → common.error_generic_title theo DOM 159-01, thay "như #159"): UXD đồng ý – lúc lỗi Desk không biết người đó có hoạt động không; copy-v1.0.5 bản 2.7 sửa ghi chú 9.18. #162 dùng cùng khóa closer_inactive sau khi #164 gộp (UXD 162-03). Không ESC | UXD | rounds/round-05/reviews/UXD-on-fe-a2-pr-164.md |`
