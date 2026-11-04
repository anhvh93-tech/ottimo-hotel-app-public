# UXD review – v1.0.4 P4-41: nhãn lý do hoàn, ghi chú "số có thể giảm", folio khóa (FE-A)

- Người review: UXD | Round 4 – đợt v1.0.4 – bước **Review** | 04/11/2026
- Đối tượng: `git diff origin/main...origin/v104/fe-money-labels` (`origin/main` @ `7b5b6117`, nhánh @ `852bbfa3`). Gồm `app/auditReason.ts`, `pages/approvals/ApprovalsPage.tsx`, `pages/money/MoneyPage.tsx`, `pages/stay/FolioDialog.tsx`, `__tests__/i18n-keys.test.ts`, `__tests__/pending-keys-p4-41.json`. Đọc kèm báo cáo `rounds/round-04/outputs/FE/v1.0.4-fe-money-labels.md` và test `v104-money-labels-fea.test.tsx`.
- Đối chiếu:
  - brand guideline (`00-brief/context/brand/brand-guidelines.md`);
  - bảng chữ UXD `v104-strings-table.md` (nhánh `origin/v104/uxd-manual-font`) mục P4-41;
  - chữ thật trong `gen_strings.py` trên `origin/v104/uxd-strings` @ `36f38edd` (P4-01 lượt 1);
  - plan v1.0.4 mục 3.1 và 6.4 (GN-R4-QA-01).
- Ảnh: không chụp. Đọc mã và test (dữ liệu giả của test), không dùng dữ liệu thật. Trước khi P4-01 gộp, các chỗ mới hiện tên khóa nên ảnh lúc này không dùng được. Bố cục 390/1440 kiểm bằng mã (xem mục "Kiểm theo yêu cầu").

## Kết luận: ĐẠT CÓ ĐIỀU KIỆN

Đúng bảng chữ và đúng phạm vi. Không còn chỗ nào hiện mã thô (`overpayment`, `early_departure`, `refund.destination_carried`). Hai nghĩa của `early_departure` được tách đúng như UXD ghi: dòng folio là "Trả phòng sớm", yêu cầu hoàn là "Hoàn khi trả sớm". Câu `error.FOLIO_LOCKED` mới thay đúng câu sai "chỉ quản lý…".

Điều kiện để ĐẠT:
1. Rebase lên `main@L` sau khi P4-01 gộp. Xóa 4 khóa khỏi `pending-keys-p4-41.json`, xóa tệp nếu rỗng. Test thứ hai trong `i18n-keys.test.ts` sẽ nhắc việc này.
2. Làm thẻ 01: hàng chờ duyệt ở tab Hoàn tiền cũng có ghi chú "Số có thể giảm khi duyệt".

Thẻ 02 không chặn gộp. Không có việc cần báo chủ đầu tư.

| Thẻ | Mức | Tóm tắt |
|---|---|---|
| 01 | Minor | Tab **Hoàn tiền** có cả yêu cầu đang chờ duyệt nhưng thiếu dòng `approvals.refund_may_decrease`. Người xem ở hai màn thấy hai thông tin khác nhau về cùng một yêu cầu |
| 02 | Suggestion | Desk tách 409 "hết cửa sổ" và 409 "công nợ" bằng cách dò chữ `window` trong `detail`. Đúng hôm nay, nhưng chỉ cần BE sửa câu là Desk hiện sai câu và sai nút |

## Duyệt chữ theo khóa (so với `origin/v104/uxd-strings` @ `36f38edd`)

| Khóa | Dùng ở | VI / EN có ở P4-01 | Kết quả |
|---|---|---|---|
| `audit.reason.overpayment` | Nhật ký thao tác tiền (`CODE_KEYS`), Cần duyệt, Hoàn tiền | Có | Đúng |
| `audit.reason.early_departure` | Chỉ yêu cầu hoàn (`REFUND_REASON`) | Có | Đúng. Dòng folio vẫn `mlog.reason.early_departure` |
| `approvals.refund_may_decrease` | Cần duyệt, hàng `type = refund` | Có | Đúng vị trí và cỡ chữ (`li-s`, Stone). Thiếu ở tab Hoàn tiền: thẻ 01 |
| `mlog.a_refund_destination_carried` | `ACTION_KEY` Nhật ký tiền | Có | Đúng. Câu không nhắc số tài khoản hay tên người nhận |
| `error.FOLIO_LOCKED` (sửa chữ) | Khung báo của folio khóa, hộp Điều chỉnh, hộp Thêm phát sinh qua bảng lỗi chung | Có | Đúng. Câu chung cho mọi ca 409 |

Cách nối dòng phụ "Nhãn · "ghi chú" · Người gửi lúc …" (`filter(Boolean).join(' · ')`) bỏ được dấu " · " thừa ở đầu dòng khi không có lý do. Nên giữ cách này.

BUG-R2-097: câu báo chi hoàn dùng `Math.abs`. Hết "Đã ghi hoàn -500.000 đ."

## Kiểm theo yêu cầu

| Mục | Kết quả |
|---|---|
| Brand | Đạt. Không màu tự đặt, không `style=`, không font riêng. Chỉ dùng `Alert` (info), `li-s`, `card`, `appr-card` của DS. Chữ nhân viên ngắn, không "!", không emoji |
| Khóa chữ | Đủ 4 khóa mới + 1 khóa sửa trên `uxd-strings`. Cơ chế `pending-keys-*.json` đúng luật 2.4: test vẫn bắt khóa lạ, và báo khi khóa chờ đã có thật |
| Trạng thái | Cần duyệt và Hoàn tiền giữ đủ `LoadingBlock` / `StateView` rỗng / `ErrorBlock` có Thử lại. Folio khóa: khung info `role="note"`, không có nút chết |
| A11y | Ghi chú mới là chữ thường trong thẻ, đọc theo thứ tự. Nút **Điều chỉnh** bị bỏ khỏi DOM, không chỉ bị ẩn bằng CSS, nên trình đọc màn hình không gặp nút không dùng được |
| 1440 | Dòng phụ trên Cần duyệt dài thêm một dòng. Thẻ `appr-card` đủ rộng, không tràn |
| 390 | `appr-card` xếp dọc trên điện thoại (UXR S4 P-03). Câu `approvals.refund_may_decrease` (VI 87 ký tự) xuống 2–3 dòng, không vỡ khung. Câu `error.FOLIO_LOCKED` dài 3 dòng trong Alert. Chấp nhận được |

---

### FB-R4-UXD-FE-P441-01
- Mức độ: Minor
- Vị trí: `product/apps/admin-web/src/pages/money/MoneyPage.tsx` `Refunds()`, dòng phụ sau khoảng dòng 590 (khối `li-s` "BUG-R4-026: the reason in words, as on Cần duyệt")
- Vấn đề: tab **Hoàn tiền** đọc `REFUND_QUEUE = ['pending', 'escalated', 'approved']`, nên có cả yêu cầu hoàn đang chờ duyệt. Ghi chú GN-R4-QA-01 chỉ hiện ở **Cần duyệt**. Cùng một yêu cầu `pending`: ở Cần duyệt có câu "Số có thể giảm khi duyệt", ở Hoàn tiền thì không.
- Vì sao quan trọng: quản lý và kế toán hay xem số hoàn ở tab Hoàn tiền rồi báo khách. Nếu số giảm lúc duyệt (409 `superseded` hoặc bị trừ phát sinh ghi sau), người đã báo khách số cũ phải gọi lại cho khách. Bảng chữ UXD ghi "trên hàng chờ duyệt của yêu cầu hoàn", không giới hạn ở một màn.
- Đề xuất sửa: trong `Refunds()`, thêm `{a.status === 'pending' || a.status === 'escalated' ? <div className="li-s">{t('approvals.refund_may_decrease')}</div> : null}` ngay dưới dòng lý do. Hàng `approved` không hiện, vì số đã chốt. Thêm một ca vào `v104-money-labels-fea.test.tsx`. Không cần khóa mới.
- Trạng thái: Open

### FB-R4-UXD-FE-P441-02
- Mức độ: Suggestion
- Vị trí: `product/apps/admin-web/src/pages/stay/FolioDialog.tsx` dòng 384 (`/window/i.test(act.error.problem.detail ?? '')`)
- Vấn đề: chỉ khi điều chỉnh **giảm** trên folio `settled`, Desk mới phải phân biệt hai ca 409 `FOLIO_LOCKED`: hết cửa sổ sau trả phòng, hoặc vướng luật công nợ. Desk phân biệt bằng cách tìm chữ "window" trong `detail` tiếng Anh của máy chủ. `detail` là câu cho người đọc, không phải hợp đồng. Nếu BE sửa câu, Desk sẽ hiện câu công nợ kèm nút **Xóa công nợ** cho một folio đã khóa hẳn.
- Vì sao quan trọng: người dùng sẽ bấm một nút dẫn tới lỗi thứ hai. Ca này hiếm và FE đã ghi rủi ro ở G1, nên không chặn v1.0.4.
- Đề xuất sửa: giữ như hiện tại cho v1.0.4. Đưa đề xuất của FE (trường `Folio.postCheckoutWindowUntil` hoặc mã con trong Problem) vào danh sách ARC v1.0.5. Có trường này thì Desk ẩn **Điều chỉnh**/**Thêm phát sinh** trước khi người dùng bấm, không phải đợi lỗi. Trong lúc chờ, thêm một chú thích trong `folio-lines.service.ts` (BE) rằng Desk đang dò chữ "window", để ai sửa câu cũng biết.
- Trạng thái: Open

## Điểm nên giữ
- Bảng `REFUND_REASON` tách riêng khỏi `CODE_KEYS`, có chú thích lý do. Người đọc mã hiểu ngay vì sao một mã có hai nhãn.
- `requestReasonText` trả `null` khi không biết mã. Dòng chỉ còn ghi chú của người gửi, không bao giờ hiện mã thô.
- Folio khóa: bỏ hẳn nút **Điều chỉnh** với mọi vai, kể cả quản lý, và câu báo nói việc còn làm được (Thu công nợ, Xóa công nợ). Người dùng không gặp ngõ cụt.
