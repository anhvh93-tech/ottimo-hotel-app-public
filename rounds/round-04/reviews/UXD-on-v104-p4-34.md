# UXD review – v1.0.4 P4-34: Hủy lịch tham số trong hộp Sửa tham số (FE)

- Người review: UXD | Round 4 – đợt v1.0.4 – bước **Review** | 04/11/2026
- Đối tượng: `git diff 7224e8fd 8fda6d7f` trên `origin/v104/fe-param-cancel`, gồm `ParamDialog.tsx` (cột thao tác + `CancelScheduledParamDialog`), `ParamsPage.tsx`, `paramCatalog.ts`, 5 khóa mới trong `gen_strings.py` nhóm "v1.0.4 P4-34" và tệp sinh. Đọc kèm báo cáo `rounds/round-04/outputs/FE/v1.0.4-p4-34-param-cancel.md` và test `v104-param-cancel.test.tsx`.
- Đối chiếu: brand guideline (`00-brief/context/brand/brand-guidelines.md`), `ConfirmDialog` C16 trong `product/packages/ui/src/Modal.tsx`, mẫu hủy lịch đã duyệt ở `ReceivingAccount.tsx` (nút trên dòng lịch sử) và `RoomDrawer.tsx` (hộp xác nhận hủy lịch giá, trạng thái khóa sau 404/409).
- Ảnh: không chụp. Đọc mã và test (dữ liệu giả `privacy-2099-01-v2`, `quote_validity_days`), không dùng dữ liệu thật.
- UXD đã sửa chữ trên chính nhánh: commit `09fba1b5` (`round-4: Review – UXD P4-34 strings`), chỉ đụng `gen_strings.py` và tệp sinh. Test của FE so chữ theo khóa (`tv(...)`) nên không cần sửa test.

## Kết luận: ĐẠT CÓ ĐIỀU KIỆN

Brand đạt. Không có màu tự đặt, chỉ dùng `Button`/`Alert`/`Field`/`ConfirmDialog` của DS. Không emoji, giọng ngắn và điềm tĩnh. Bố cục theo mẫu sẵn có: nút `sm ghost` ở cột cuối như mục Tài khoản nhận, cột có tiêu đề ẩn `rooms.col_action`, chỉ hiện cột khi có dòng Chưa hiệu lực. Hộp C16 có nút an toàn nhận focus, nút xác nhận tông danger. Nút tắt khi mất mạng.

Chữ: duyệt 5 khóa, sửa 2 (`params.cancel_body`, `params.cancel_gone`), thêm khóa trung tính `params.cancel_scheduled`. Điều kiện để ĐẠT: FE làm thẻ 01 (đổi sang khóa mới). Thẻ 02–03 nên làm cùng lúc vì cùng tệp, không chặn gộp. Không có việc cần báo chủ đầu tư.

| Thẻ | Mức | Tóm tắt |
|---|---|---|
| 01 | Minor | `ParamDialog` dùng khóa `rcv.cancel_scheduled` của mục Tài khoản nhận. Đổi sang `params.cancel_scheduled` (UXD đã thêm, cùng chữ) |
| 02 | Minor | Sau 404/409, nút xác nhận đã khóa nhưng nút an toàn vẫn ghi "Không, quay lại". RoomDrawer đổi thành "Đóng" |
| 03 | Minor | 404 "lịch không còn" hiện bằng Alert đỏ (`bad`). Đây không phải lỗi của người dùng. RoomDrawer dùng tông info |
| 04 | Suggestion | Ô Lý do: thêm câu gợi ý dưới ô như hộp hủy lịch giá, hoặc để như hiện tại |

## Trả lời câu hỏi của ORC: dùng lại `rcv.cancel_scheduled` hay đổi sang khóa trung tính?

**Đổi sang `params.cancel_scheduled`, giữ nguyên chữ "Hủy lịch" / "Cancel schedule".** Lý do:

1. `ParamDialog` là hộp chung cho mọi khóa tham số. Khóa `rcv.*` thuộc mục Tài khoản nhận, mục này có S2 và câu riêng. Nếu sau này chữ của mục đó đổi (ví dụ "Hủy lịch đổi tài khoản"), hộp tham số chung sẽ đổi theo mà không ai để ý.
2. Chữ giữ y hệt `rcv.cancel_scheduled`. Hai mục trên cùng trang Tham số vẫn gọi hành động này giống nhau. Sổ tay vẫn ghi đúng một nhãn "Hủy lịch".
3. Không gọi theo kiểu RoomDrawer ("Hủy lịch giá này"). Cột hẹp, và tên tham số đã ở tiêu đề hộp Sửa.

UXD đã thêm khóa trong commit `09fba1b5`. FE chỉ cần đổi mã (thẻ 01).

## Duyệt chữ theo khóa (bản cuối trên nhánh @ `09fba1b5`)

| Khóa | VI | EN | Kết quả |
|---|---|---|---|
| `params.cancel_scheduled` (mới) | Hủy lịch | Cancel schedule | Thêm. Nút trên dòng và nút xác nhận |
| `params.cancel_title` | Hủy giá trị đã lên lịch? | Cancel the scheduled value? | Giữ |
| `params.cancel_body` | Giá trị {value}, hiệu lực từ {date}, sẽ không áp dụng. Giá trị trước đó tiếp tục áp dụng. | The value {value}, effective {date}, will not apply. The earlier value stays in effect. | **Sửa** (xem dưới) |
| `params.cancelled` | Đã hủy lịch đổi {name}. | The scheduled change to {name} was cancelled. | Giữ. Khớp `rcv.cancelled` |
| `params.cancel_effective` | Giá trị từ {date} đã bắt đầu áp dụng nên không hủy lịch được nữa. Muốn đổi, lưu giá trị mới. | The value from {date} has already taken effect, so it can't be cancelled. To change it, save a new value. | Giữ. Đúng mẫu `rooms.cancel_sched_effective`, có lối đi tiếp |
| `params.cancel_gone` | Lịch đổi từ {date} không còn – có thể người khác vừa hủy. Lịch sử đã tải lại. | (giữ EN của FE) | **Sửa VI** "Lịch từ" → "Lịch đổi từ" |

Lý do sửa `params.cancel_body`:
- Bản FE mở câu bằng giá trị trần: "privacy-2099-01-v2 từ 10/01/2099 sẽ không áp dụng." / "5 ngày từ …". Câu mở bằng mã viết thường hoặc con số khó đọc. Câu mới có chủ ngữ "Giá trị", EN "effective {date}" khớp `params.saved`.
- Không đưa `{name}` làm chủ ngữ. Nhãn tham số là cụm như "Nhận phòng từ" hay "Trả phòng trước", ghép vào sẽ thành "Nhận phòng từ sẽ không đổi sang …". Tên đã có ở tiêu đề hộp Sửa ngay dưới và ở toast. Mã vẫn truyền `{name}`, thừa tham số không sao.
- "Giá trị đang dùng giữ nguyên" đổi thành "Giá trị trước đó tiếp tục áp dụng". Câu cũ không đúng khi có hai dòng lên lịch: hủy dòng sau thì từ ngày đó dòng lên lịch trước mới áp dụng, không phải giá trị đang dùng.

---

### FB-R4-UXD-FE-P434-01
- Mức độ: Minor
- Vị trí: `product/apps/admin-web/src/pages/ParamDialog.tsx` dòng 352, 355 (nút trên dòng, gồm `aria-label`) và 467 (`confirmLabel`); `src/__tests__/v104-param-cancel.test.tsx` các chỗ `tv('rcv.cancel_scheduled')`
- Vấn đề: hộp tham số chung dùng khóa `rcv.cancel_scheduled` của mục Tài khoản nhận.
- Vì sao quan trọng: nếu sửa chữ của mục Tài khoản nhận, nút ở mọi tham số khác đổi theo. Người bảo trì đọc mã cũng dễ hiểu nhầm nút này cần S2.
- Đề xuất sửa: thay 3 chỗ trong `ParamDialog.tsx` bằng `t('params.cancel_scheduled')`, test đổi theo. Khóa đã có trên nhánh từ `09fba1b5`, chữ y hệt, nên giao diện không đổi. Không đụng `ReceivingAccount.tsx`.
- Trạng thái: Open

### FB-R4-UXD-FE-P434-02
- Mức độ: Minor
- Vị trí: `ParamDialog.tsx` `CancelScheduledParamDialog`, `keepLabel={t('confirm.keep')}` khi `locked = true`
- Vấn đề: sau 404/409, nút xác nhận bị khóa và câu báo đã hiện. Nút còn lại vẫn ghi "Không, quay lại" / "No, go back", trong khi không còn gì để "không" nữa. `RoomDrawer` ở cùng tình huống đổi nút thành `common.close`.
- Vì sao quan trọng: hai hộp hủy lịch trên Desk xử lý cùng một tình huống theo hai cách. Nhãn nút cũng không còn khớp việc nó làm.
- Đề xuất sửa: `keepLabel={locked ? t('common.close') : t('confirm.keep')}`. Không cần khóa mới.
- Trạng thái: Open

### FB-R4-UXD-FE-P434-03
- Mức độ: Minor
- Vị trí: `ParamDialog.tsx` `CancelScheduledParamDialog`, `<Alert tone="bad">{banner}</Alert>` cho cả 404 và 409
- Vấn đề: 404 (`params.cancel_gone`: có thể người khác vừa hủy) là tin trạng thái, không phải lỗi. Alert đỏ làm người dùng tưởng mình làm sai. `RoomDrawer` hiện `rooms.cancel_sched_gone` bằng thông báo tông info.
- Vì sao quan trọng: DS dành tông `bad` cho lỗi cần sửa và tông `info` cho tin báo (tokens v0.4.1). Desk nên báo cùng một tình huống bằng cùng một tông.
- Đề xuất sửa: giữ `tone="bad"` cho 409 (`params.cancel_effective`), lỗi mạng/5xx và 422. 404 dùng `tone="info"` với `role="status"`. Ví dụ lưu thêm `bannerTone` cạnh `banner`.
- Trạng thái: Open

### FB-R4-UXD-FE-P434-04
- Mức độ: Suggestion
- Vị trí: `ParamDialog.tsx` `CancelScheduledParamDialog`, ô Lý do
- Vấn đề: hộp hủy lịch giá (`RoomDrawer`) có gợi ý dưới ô "Lưu vào nhật ký cấu hình." và dùng `textarea` 2 dòng. Hộp này dùng `input` một dòng, không có gợi ý. Hộp này vẫn đúng mẫu `ReceivingAccount`, nên không bắt buộc sửa.
- Vì sao quan trọng: nhỏ. Gợi ý cho người dùng biết lý do được lưu lại và ai sẽ đọc.
- Đề xuất sửa: nếu FE còn mở tệp, thêm `help` cho `Field`. Muốn có khóa trung tính thì báo UXD tạo `params.cancel_reason_help` ("Lưu vào nhật ký cấu hình." / "Kept in the settings log."). Không làm cũng được ở v1.0.4.
- Trạng thái: Open

---

## Nhãn cuối cùng cho sổ tay (BA)

Ngày thay tờ quyền riêng tư, hủy dòng đã lên lịch của `privacy_notice_version`. Đường đi: **Quản trị → Tham số quy tắc → nhóm "Khác" → Sửa: {tên tham số}** → bảng **Lịch sử thay đổi** → dòng có chip **Chưa hiệu lực** → nút **Hủy lịch** → hộp **Hủy giá trị đã lên lịch?** → ghi **Lý do** → bấm **Hủy lịch**. Thành công thì báo **Đã hủy lịch đổi {tên tham số}.**

EN: **Admin → Rule settings → Other → Edit: {name}** → **Change history** → chip **Not yet effective** → **Cancel schedule** → **Cancel the scheduled value?** → **Reason** → **Cancel schedule** → "The scheduled change to {name} was cancelled."

Nút an toàn: **Không, quay lại** / **No, go back**. Sau khi làm thẻ 02, nút này đổi thành **Đóng** khi lịch đã không còn hoặc đã có hiệu lực. Chỉ người có quyền sửa khóa đó mới thấy nút (với `privacy_notice_version` là Chủ đầu tư). Mục Tài khoản nhận vẫn hủy ở mục riêng của nó, có S2.

## Điểm làm tốt
- Kiểm hợp đồng trước khi code. Nêu rõ vì sao bỏ `error.INVALID_TRANSITION` (câu nói về "Đơn") và viết câu riêng theo mẫu đã duyệt của RoomDrawer.
- Hộp Sửa vẫn mở sau khi hủy, lịch sử và chip trên trang tải lại. Người dùng thấy ngay kết quả mà không mất chỗ đang đứng.
- Test so theo khóa, nên UXD sửa chữ không làm vỡ test.

## Xác nhận (04/11) – `449aa5c2`

UXD không mở lượt riêng. SEC đọc thay 3 thẻ khi xác nhận bản sửa của FE (ORC ghi, xem `SEC-on-v104-p4-34.md` mục "Xác nhận lượt 2"):

- UXD-FE-P434-01: **Đóng**. Khóa `params.cancel_scheduled` dùng ở cả 3 chỗ (nhãn nút, `aria-label`, `confirmLabel`), có trong `strings-vi/en`, test đã đổi theo.
- UXD-FE-P434-02: **Đóng**. Sau 404/409 nút an toàn là `common.close`, không còn `confirm.keep`; có 2 test xác nhận. Nhãn nút an toàn tiếng Anh vẫn lấy từ `confirm.keep` khi hộp còn hủy được.
- UXD-FE-P434-03: **Đóng**. 404 hiện Alert `info` với `role="status"`, 409 hiện Alert `bad` với `role="alert"`; có test.
- UXD-FE-P434-04: **Deferred → v1.0.5** (`03-backlog/backlog.md` mục 5.6b).

FE trả lời từng thẻ ở `rounds/round-04/responses/FE-P4-34.md`. Kết luận: **ĐẠT**, gộp theo PR #37.
