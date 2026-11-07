# ARC review PR #162 (FE) – `r5-fe-closer-field`: ô "Người chốt" trên khung đơn theo mốc (V5-30)

- Round 5 (v1.0.5), bước **Review** kỹ thuật. Người review: ARC. Ngày 07/11/2026.
- PR: [#162](https://github.com/anhvh93-tech/ottimo-hotel-app-public/pull/162), nhánh `r5-fe-closer-field`, head **`c5cc1f50`**, `base = main`.
  - Có 3 commit: mã, gộp `main` @ `78024f17`, báo cáo FE. Quy mô: 11 tệp, +959/−2.
  - Mã: `CloserField.tsx` (mới), `ReservationDrawer.tsx`, `problem.ts`, mock `stay.ts`.
  - Test: `v5-30-closer-field-fea.test.tsx`, 35 ca.
  - Chữ: 7 khóa UXD 9.16, sinh từ `gen_strings.py`.
  - Máy chủ và `openapi.yaml` không đổi.
- Đối chiếu:
  - hợp đồng 0.3.13 bổ sung 1h/1i (`updateReservation`, `ReservationPatch.closerChangeReason`);
  - mã máy chủ trên `main`: `reservations.service.ts` `update()`, `checkCloserForChannel`, `inputs.ts` `Fields.text`/`done`;
  - review của ARC: `ARC-on-be-h-pr-154.md` mục 9 ý 1, `ARC-on-be-h-pr-157.md`;
  - SEC 158-02 (`SEC-on-arc-pr-158.md` mục (k)): thứ tự thật trong mã là 428 → 422 dạng thân → 404 → 412 → 409 trạng thái → 403 → 422 cần đơn → 409 hoa hồng;
  - UXD `copy-v1.0.5.md` 9.16.
  - ARC đọc review của DOM, SEC, UXD về #162 (đã lên `main`) **sau khi** tự kiểm xong, để không lặp thẻ.
- Cách kiểm:
  - ref riêng `refs/scratch/arc-pr162`, worktree tạm `arc-wt162` ở scratchpad. Thư mục `wt162` đã có sẵn ở đó, của vai khác, nên ARC dùng tên riêng và không đụng vào;
  - gộp thử với `main` @ `f63afee0`;
  - không checkout nhánh trong thư mục chính, không push vào nhánh PR;
  - worktree và ref tạm đã xóa sau review;
  - không dữ liệu khách, không số hoa hồng; chỉ dùng tài khoản và đơn mẫu của mock.
- CI của `c5cc1f50` lúc viết: 8 job xanh, gồm `format · lint · audit · test · build` và contract RBAC `--strict`. E2E smoke đang chạy.

---

## 0. Kết luận

| PR @ SHA | Kết luận ARC | Điều kiện gộp | Thẻ ARC |
|---|---|---|---|
| **#162 @ `c5cc1f50`** | **DUYỆT** | ARC không thêm điều kiện ngoài CI xanh, kể cả E2E smoke. Điều kiện gộp UXD 162-01 (focus sau khi lưu) là của UXD | 162-01 (Minor), 162-02 (Suggestion), 162-03 (Suggestion) |

- Khớp luật máy chủ của #154/#157 (mục 1):
  - vai × mốc khớp ở đủ 16 ô;
  - thân PATCH chỉ có `closerUserId`, kèm `closerChangeReason` khi người chốt đổi ngoài giữ chỗ;
  - kiểm lý do tại Desk khớp `Fields.text` (cắt khoảng trắng, 3–500 ký tự);
  - nhãn và lựa chọn theo kênh khớp `checkCloserForChannel`;
  - `CARD_NUMBER_DETECTED` hiện đúng câu, với cả hai dạng thân lỗi của máy chủ.
- Thứ tự lỗi (mục 2): Desk xử lý được từng mã theo thứ tự thật của SEC 158-02. Nhưng ở ca hay gặp nhất, máy chủ trả 412 chứ không phải 403: khách vừa nhận phòng ở máy khác, nên `version` đã tăng. Desk khi đó hiện câu xung đột chung, và câu `error.closer_change_forbidden` không bao giờ hiện. ARC đã chạy thử để chứng minh (probe P1). Đây là thẻ **162-01** (Minor). Không chặn gộp, vì không ghi sai gì và không sinh `access.denied`.
- Mock (mục 3): đúng thứ tự 412 → 409 trạng thái → 403 → 422 cần đơn, và trả đúng mã. Hai chỗ chưa giống máy chủ, không ảnh hưởng hành vi của ô:
  - chọn loại người chốt theo `channelCode` thay vì nhóm kênh;
  - lỗi số thẻ có mã cấp trên là `VALIDATION_FAILED`.
  Thứ tự 409 → 403 của mock chưa có ca giữ (đột biến C11 xanh). Ghi vào thẻ 162-03.
- `channelGroup` (mục 4): lấy từ `catalog.channels` theo `channelId`, vì `Reservation` không có trường nhóm kênh. Nếu danh sách kênh lỗi, đơn kênh CTV mang nhãn "Người chốt" (`bk.closer_sales`) thay vì "CTV chốt đơn", và cho chọn cả nhân viên (probe P2). Máy chủ vẫn chặn bằng 422 `NOT_IN_LIST`. Đây là thẻ **162-02** (Suggestion).
- Gộp thử sạch:
  - `tsc` sạch, `gen_strings.py` không lệch;
  - admin-web **100 tệp / 1135 ca xanh**;
  - Prettier và ESLint sạch.
- Đột biến ARC: 12 đột biến, 8 đỏ. 4 còn xanh:
  - C3, C4: tương đương trên dữ liệu thật;
  - C10, C11: thiếu ca → thẻ 162-03.

---

## 1. Đối chiếu với luật máy chủ

| Luật (máy chủ `main`) | `CloserField.tsx` | Khớp |
|---|---|---|
| "Đổi" = giá trị khác giá trị đang lưu, kể cả người chốt đầu tiên | `changed = pick !== '' && pick !== current` | Có |
| `hold`: không kiểm vai (chỉ FD+ gọi `updateReservation`), lý do không bắt buộc | `hold` → sửa được, không hiện ô lý do, không gửi lý do (đột biến C12 đỏ) | Có |
| Ngoài giữ chỗ, chưa nhận phòng: MGR+, lý do không bắt buộc, nếu có thì ít nhất 3 ký tự | `confirmed` → MGR+ sửa, lý do "không bắt buộc". FD/FDL chỉ đọc kèm `readonly_manager`. Lý do đã gõ mà dưới 3 ký tự thì Desk chặn, không gửi (C1 đỏ) | Có |
| Sau nhận phòng (`actual_checkin_at` có giá trị, hoặc `in_house`/`checked_out`): chỉ OWN, lý do bắt buộc | `checkedIn = status !== 'confirmed' \|\| !!actualCheckinAt`, chỉ xét trong 3 trạng thái sửa được. OWN: lý do bắt buộc. Vai khác: chỉ đọc kèm `readonly_owner` (C2, C5 đỏ) | Có |
| `checked_out` chỉ nhận `closerUserId` + `closerChangeReason`, trường khác → 409 | Thân luôn chỉ có hai khóa đó, gửi kèm `If-Match` (ca `checked_out` kiểm) | Có |
| `cancelled`/`no_show` → 409 | Chỉ đọc tên, không có ô chọn | Có |
| `closerChangeReason` khi người chốt không đổi → 422 `NOT_ALLOWED` | Chọn lại người cũ thì ô lý do ẩn và nội dung bị xóa. Không bao giờ gửi lý do khi không đổi | Có |
| `Fields.text`: bỏ ký tự điều khiển, cắt khoảng trắng hai đầu, gộp khoảng trắng; `REASON_REQUIRED` khi rỗng hoặc dưới 3 ký tự; `TOO_LONG` khi quá 500; `CARD_NUMBER_DETECTED` | Desk cắt khoảng trắng hai đầu, kiểm 3 ký tự, `maxLength` 500 trên chữ gốc (chặt hơn máy chủ một chút, an toàn). 422 nào cũng hiện câu dưới đúng ô | Có |
| Lỗi số thẻ: `f.done()` ném mã cấp trên `CARD_NUMBER_DETECTED`, chỉ kèm lỗi số thẻ | `fieldErrors` đọc `errors[]` theo trường, không theo mã cấp trên. `FIELD_PAIR` mới chọn `field_error.reason_card_number`. Ca `it.each` kiểm cả hai mã cấp trên (C8 đỏ) | Có |
| `checkCloserForChannel`: kênh `agent` cần CTV; `direct` + `sales_staff` cần nhân viên; kênh khác thì người nào trong danh sách cũng được | `closerKindOf` cùng luật. Lựa chọn lọc theo loại, người đang lưu luôn có trong danh sách. Kênh không cần người chốt: ô ẩn nếu chưa có ai, hiện cả danh sách nếu đã có (C7 đỏ) | Có |
| `NOT_IN_LIST` ở `closerUserId` (người vừa bị tắt) | Câu `not_in_list` dưới ô chọn, rồi tải lại danh sách (C9 đỏ) | Có |
| SAL/CTV | Không có dòng. Không gọi `listCloserCandidates`, nên không sinh 403 hay `access.denied` | Có |

## 2. Thứ tự lỗi: những gì Desk thật sự nhận

Thứ tự trong mã máy chủ (SEC 158-02, ARC đã đọc lại `update()`):
1. 428: thiếu `If-Match`;
2. 422 dạng thân, trước khi tải đơn (`f.done()`). Ví dụ `closerUserId` không phải uuid;
3. 404;
4. 412 `VERSION_CONFLICT`;
5. 409 trạng thái (`editable`);
6. 403 người chốt;
7. 422 cần đơn (`NOT_IN_LIST`, lý do);
8. 409 hoa hồng đã vào kỳ chi.

Desk không thể gặp 428 và 422 dạng thân: luôn gửi `If-Match`, và `closerUserId` lấy từ danh sách. Bốn mã còn lại đều có nhánh xử lý, đúng thứ tự.

**Vấn đề (thẻ 162-01):**
- Ca mà 9.16 và DOM 154-03 viết câu `error.closer_change_forbidden` cho là "khách vừa nhận phòng ở máy khác". Ở máy chủ thật, ca này không trả 403:
  - nhận phòng ghi lại đơn, nên `version` tăng;
  - máy chủ kiểm `If-Match` (412) trước cả 409 trạng thái và 403.
- Test 403 của PR tự nói rõ điều này. Ca đó giữ nguyên `version` "on purpose", để PATCH qua được `If-Match` và tới 403. Ca 409 "đơn vừa bị hủy" cũng giữ `version`.
- Probe P1 của ARC chạy đúng ca thật: MGR mở đơn `confirmed`, chọn người khác, gõ lý do; máy khác nhận phòng và tăng `version`; MGR bấm Lưu.
  - Kết quả: 412 → câu `error.VERSION_CONFLICT` kèm nút "Tải lại". Không có câu `closer_change_forbidden`.
  - Sau khi tải lại: ô thành chỉ đọc với dòng `readonly_owner`, câu xung đột biến mất. Không còn câu nào nói vì sao ô vừa đổi.
- 403 thật chỉ còn xảy ra khi vai trong phiên đã cũ, ví dụ vai MGR vừa bị thu hồi. Ca đó SEC 162-01 đã nêu.
- Không có rủi ro dữ liệu: không ghi gì, không sinh `access.denied`. Nhưng câu UXD viết cho đúng ca này không bao giờ hiện, và người dùng thấy một câu xung đột chung chung.

## 3. Mock có trung thực không

- Đúng:
  - `withRes` kiểm 404, rồi `If-Match` (428/412). Sau đó mới tới khối mới: 409 trạng thái (giống `editable` của máy chủ, kể cả ngoại lệ `checked_out` chỉ có người chốt) → 403 theo mốc → 422 (`NOT_IN_LIST`, `REASON_REQUIRED`, `TOO_LONG`, `CARD_NUMBER_DETECTED`). Cùng thứ tự với máy chủ ở mọi mã Desk gặp được.
  - Lý do được chuẩn hóa như máy chủ (cắt, gộp khoảng trắng), cùng mã lỗi.
  - Thứ tự 404 → 428 của `withRes` ngược với máy chủ, nhưng đây là điều có sẵn cho mọi route, và Desk không gặp 428.
- Chưa giống, không đổi hành vi của ô (thẻ 162-03):
  1. Loại người chốt cần có tính theo `r.channelCode === 'agent'` / `'direct'`. Máy chủ dùng nhóm kênh của đơn. Trong mock hai thứ trùng nhau, vì mã kênh seed đặt đúng bằng tên nhóm. Dữ liệu thật thì không: một kênh CTV có thể mang mã khác. Các handler khác của mock đã dùng `channelById(r.channelId)?.channelGroup`.
  2. Lỗi số thẻ trả mã cấp trên `VALIDATION_FAILED` kèm mọi lỗi. Máy chủ trả `CARD_NUMBER_DETECTED` và chỉ lỗi đó. Ca `it.each` đã kiểm Desk với dạng của máy chủ qua `failNext`, nên đây chỉ là độ giống của mock.
  3. Thứ tự 409 trạng thái → 403 của mock chưa có ca giữ: đổi chỗ hai khối (C11) thì 35 ca vẫn xanh. Ca 409 dùng MGR trên đơn `confirmed`, nên không phân biệt được hai thứ tự.

## 4. `channelGroup` trong `ReservationDrawer`

- `Reservation` có `channelId` và `channelCode`, không có nhóm kênh. Drawer tìm `channelGroup` trong `useCatalog(propertyId).channels` theo `channelId`, rồi truyền xuống `CloserField`. `ota` cũng tính lại từ đúng biến này, nên hành vi cũ không đổi.
- Khi danh sách kênh chưa tải xong, hoặc tải lỗi (`catalog.status` là `loading`/`error`, `channels = []`), `channelGroup` là `undefined`, nên `closerKindOf` trả `null`:
  - đơn **chưa** có người chốt: ô ẩn;
  - đơn **đã** có người chốt: nhãn `bk.closer_sales` và danh sách không lọc theo loại.
- Probe P2 chạy ca danh sách kênh lỗi trên đơn CTV giữ chỗ (`Lê Minh`), vai FD: nhãn là "Người chốt" (`bk.closer_sales`) thay vì "CTV chốt đơn" (`bk.closer`). Danh sách có cả 7 người, gồm OWN, MGR, FD, sale và CTV.
  - Nếu FD chọn một nhân viên, máy chủ trả 422 `NOT_IN_LIST` (giữ chỗ không qua kiểm vai), Desk hiện câu dưới ô. Không ghi sai.
  - Nhưng nhãn sai, và danh sách cho chọn người máy chủ chắc chắn từ chối.
- Khi tải bình thường, `useCatalog` giữ bản trong bộ nhớ theo cơ sở, nên thường đã có sẵn. Lần mở đầu tiên có thể thoáng thấy nhãn "Người chốt" rồi đổi thành "CTV chốt đơn". Thẻ **162-02**.

## 5. Test và đột biến

- 35 ca của PR đọc như đặc tả:
  - bảng 16 ô vai × mốc;
  - SAL, CTV;
  - kênh CTV;
  - thân của từng mốc;
  - 403, 422 ×4, `NOT_IN_LIST`, 409, 412.
  Ca 403 và 412 kiểm cả số lần gọi `getReservation`/`updateReservation` và `version` của từng lần gửi.
- Đột biến ARC (mỗi lần một chỗ, chạy `v5-30-closer-field-fea`):

| Mã | Đột biến | Kết quả |
|---|---|---|
| C1 | FD/FDL sửa được ở `confirmed` | **Đỏ** (2) |
| C2 | MGR sửa được sau nhận phòng | **Đỏ** (3) |
| C3 | `checkedIn` chỉ xét `actualCheckinAt` | Xanh. Tương đương trên dữ liệu thật: `in_house`/`checked_out` luôn có giờ nhận phòng (seed của test cũng vậy) |
| C4 | Gửi lý do cả khi giữ chỗ nếu có chữ | Xanh. Tương đương: ô lý do không hiện ở giữ chỗ, nên chữ luôn rỗng |
| C5 | Lý do không bắt buộc sau nhận phòng | **Đỏ** (3) |
| C6 | 403 không tải lại đơn trước khi hiện câu | **Đỏ** |
| C7 | Không lọc lựa chọn theo loại kênh | **Đỏ** |
| C8 | Bỏ `FIELD_PAIR` của `closerChangeReason` | **Đỏ** (3) |
| C9 | `NOT_IN_LIST` không tải lại danh sách | **Đỏ** |
| C10 | Ẩn ô khi kênh không cần người chốt, kể cả khi đơn đã có người chốt | Xanh → thẻ 162-03 |
| C11 | Mock: 403 trước 409 trạng thái | Xanh → thẻ 162-03 |
| C12 | Hiện ô lý do cả khi giữ chỗ | **Đỏ** (4) |

- Probe (tệp test tạm trong worktree, đã xóa): P1 (mục 2) và P2 (mục 4).

## 6. Thẻ feedback ARC

### FB-R5-ARC-FE-162-01
- Mức độ: **Minor** (không chặn gộp; nên làm cùng bản sửa UXD 162-01, muộn nhất trước tag v1.0.5)
- Người sửa: FE-A (mã, test); UXD xác nhận dùng lại câu
- Vị trí: `apps/admin-web/src/pages/reservations/CloserField.tsx` `save()`, nhánh lỗi; `v5-30-closer-field-fea.test.tsx` các ca 403 và 409
- Vấn đề:
  - Máy chủ kiểm `If-Match` (412) trước 409 trạng thái và 403 (SEC 158-02).
  - Hai ca mà PR xử lý bằng câu riêng là khách vừa nhận phòng ở máy khác và đơn vừa bị hủy. Cả hai đều ghi lại đơn, nên ở máy chủ thật chúng trả **412**.
  - Desk khi đó hiện `error.VERSION_CONFLICT`. Tải lại xong thì ô thành chỉ đọc mà không có câu giải thích (probe P1).
  - Câu `error.closer_change_forbidden` (9.16) và câu `rsv.transition_changed` của ô này chỉ hiện trong test, vì test giữ nguyên `version`.
- Vì sao quan trọng:
  - Ô đổi từ "sửa được" sang "chỉ đọc" ngay sau một lỗi chung. MGR không biết là do khách đã nhận phòng.
  - DOM 154-03 và UXD 9.16 viết câu riêng chính cho ca này.
  - Ca test hiện tại cho cảm giác ca đó đã được giữ, trong khi thật ra chưa.
- Đề xuất sửa:
  1. Ở nhánh 412 `VERSION_CONFLICT` của `CloserField`, tự tải lại đơn (như nhánh 403), rồi tính lại `closerAccess` với đơn mới:
     - nếu vai này **không còn sửa được**: hiện `error.closer_change_forbidden`. Câu "Đơn vừa đổi trạng thái… Desk đã tải lại đơn" đúng nguyên văn cho ca này;
     - nếu đơn chuyển sang trạng thái không sửa được (`cancelled`, `no_show`): gọi `onTransitionChanged(fresh.status)`;
     - nếu vẫn sửa được (người khác chỉ sửa trường khác): giữ cách hiện tại, tức câu xung đột, nút "Tải lại", giữ chữ đã gõ.
  2. Sửa ca 403 và 409 cho giống thật: tăng `version` như một lần nhận phòng hoặc hủy thật, rồi kiểm câu riêng sau 412.
  3. Giữ một ca 403 với `version` không đổi, cho đúng ca vai trong phiên đã cũ (ca của SEC 162-01).
  4. Sửa chú thích ở `CloserField` ("e.g. the guest checked in at another desk") và ở test cho khớp.
  5. UXD xác nhận dùng lại `error.closer_change_forbidden` cho nhánh 412 này, không cần khóa mới.
- Trạng thái: Open

### FB-R5-ARC-FE-162-02
- Mức độ: **Suggestion** (v1.0.5 nếu tiện, không thì v1.0.6)
- Người sửa: FE-A; ARC (hợp đồng, nếu PO xếp)
- Vị trí: `ReservationDrawer.tsx:241` (`channelGroup`), `CloserField.tsx` `closerKindOf`/`shown`
- Vấn đề: khi `useCatalog` còn tải hoặc lỗi, nhóm kênh là `undefined`. Đơn CTV đã có người chốt khi đó mang nhãn "Người chốt" thay vì "CTV chốt đơn", và cho chọn mọi người (probe P2). Máy chủ chặn bằng 422, không ghi sai.
- Vì sao quan trọng: nhãn sai trên đơn đang giữ chỗ, đúng lúc lễ tân hay sửa người chốt nhất. Lựa chọn cho ra lỗi chắc chắn.
- Đề xuất sửa:
  1. Truyền `catalog.status` xuống `CloserField`:
     - `loading`: hiện tên người chốt (hoặc "Đang tải…"), chưa hiện ô chọn;
     - `error`: chỉ đọc kèm nút `common.retry`, gọi `catalog.reload()`.
     Chỉ hiện ô chọn khi `ready`.
  2. Lâu dài, ARC đề xuất PO xếp v1.0.6: thêm `Reservation.channelGroup` (chỉ đọc, tùy chọn) vào hợp đồng. Máy chủ đã có `channel_group` trên đơn. Desk khi đó không phải đoán từ danh sách kênh, và mock cũng dùng chung một nguồn.
- Trạng thái: Open

### FB-R5-ARC-FE-162-03
- Mức độ: **Suggestion**
- Người sửa: FE-A (test, mock); QA nếu ORC giao
- Vị trí: `v5-30-closer-field-fea.test.tsx`; `mocks/stay.ts` (khối người chốt của PATCH)
- Vấn đề: hai luật chưa có ca giữ, và mock khác máy chủ ở hai chỗ (mục 3).
  - (a) **C11 xanh:** chưa ca nào giữ thứ tự 409 trạng thái → 403 của mock. Các test sau này của Desk tin vào thứ tự đó.
  - (b) **C10 xanh:** đơn kênh không cần người chốt (OTA, trực tiếp không qua sale) mà đã có người chốt, ví dụ dữ liệu cũ. Ô hiện, với cả danh sách. Chưa ca nào giữ hành vi này, và PO/DOM cũng chưa chốt nên ẩn hay hiện. DOM 162-03 có hướng liên quan.
  - (c) Mock tính loại người chốt theo `channelCode`, không theo nhóm kênh.
  - (d) Mock trả `VALIDATION_FAILED` cho lỗi số thẻ thay vì `CARD_NUMBER_DETECTED` chỉ kèm lỗi đó.
- Đề xuất sửa:
  1. Thêm một ca gọi thẳng `api.updateReservation` qua mock: FD đổi người chốt trên đơn `cancelled` → 409, không phải 403; FD trên đơn `confirmed` kèm lý do 1 ký tự → 403, không phải 422.
  2. Thêm một ca cho (b), theo quyết định của DOM/PO.
  3. Mock dùng `channelById(r.channelId)?.channelGroup`, và trả lỗi số thẻ như `Fields.done()`.
  4. Để sẵn cho v1.3 (luồng chi, US-089), chưa làm bây giờ:
     - 409 hoa hồng có `currentState` `payable`/`paid` đi vào nhánh `INVALID_TRANSITION` hiện tại;
     - `currentStateOf` bỏ giá trị lạ, nên Desk sẽ báo "đơn vừa chuyển sang Đã trả phòng" cho một đơn không hề đổi;
     - UXD 9.16 đã ghi là v1.0.5 không xảy ra. Khi có luồng chi, phải tách nhánh này ra và có câu riêng.
- Trạng thái: Open

## 7. Ghi chú cho ORC

- Gộp khi E2E smoke của `c5cc1f50` xanh và điều kiện UXD 162-01 xong. Thẻ ARC 162-01 nên đi cùng lượt sửa UXD 162-01, vì cùng tệp, cùng nhánh lỗi.
- DOM viết ở `DOM-on-fe-pr-162.md` rằng "403 khi khách vừa nhận phòng ở máy khác thì tải lại rồi hiện dòng `readonly_owner`". Ở máy chủ thật, ca đó đi qua 412 (mục 2). Kết quả cuối giống nhau (chỉ đọc, kèm `readonly_owner`), chỉ thiếu câu giải thích. Thẻ 162-01 bù chỗ này. DOM không cần đổi kết luận.
- SEC 162-01 (403 khi tải lại hỏng, hoặc vai vừa bị thu hồi) và ARC 162-01 cùng chạm nhánh lỗi của `save()`. FE-A làm chung một lượt.
- Tài nguyên tạm đã xóa: worktree `arc-wt162`, ref `refs/scratch/arc-pr162`. ARC không đụng `wt162` của vai khác.

## 8. Việc của ARC

- 0.3.14 (k): chữ thứ tự lỗi theo SEC 158-02, đã nhận. Thêm một câu: "Đơn vừa đổi trạng thái do máy khác (nhận phòng, hủy) thì tăng `version`, nên client nhận 412 trước 409/403; client tải lại rồi tính lại quyền".
- Đề xuất PO, xếp v1.0.6: `Reservation.channelGroup` chỉ đọc (thẻ 162-02 ý 2).

## 9. Điểm làm tốt

- `closerAccess` là một hàm thuần, theo đúng cấu trúc luật máy chủ. Bảng 16 ô của test đọc như đặc tả.
- Thân PATCH tối thiểu. Lý do bị xóa ở mọi chỗ cần xóa (chọn lại người cũ, sau khi lưu, sau 403), nên không bao giờ có 422 `NOT_ALLOWED`.
- Ca `it.each` kiểm Desk với **cả hai** dạng thân lỗi số thẻ, gồm dạng thật của `Fields.done()`. Ca 412 kiểm `version` của từng lần gửi.
- Không gọi `listCloserCandidates` khi ô ẩn. SAL/CTV vì vậy không sinh 403.

## 10. Dòng đề xuất cho `01-decisions/decision-log.md`

| Ngày | Round | Quyết định | Người quyết | Tài liệu |
|---|---|---|---|---|
| 2026-11-07 | 5 | ARC DUYỆT FE #162 (`r5-fe-closer-field`, V5-30 ô Người chốt trên khung đơn) @ `c5cc1f50`, gộp khi CI xanh, kể cả E2E smoke (điều kiện UXD 162-01 là của UXD). Khớp #154/#157: 16 ô vai × mốc, thân chỉ `closerUserId` (+ `closerChangeReason` khi đổi ngoài giữ chỗ, 3–500, cắt khoảng trắng như `Fields.text`), `checked_out` 2 khóa + `If-Match`, nhãn và lựa chọn theo `checkCloserForChannel`, `CARD_NUMBER_DETECTED` qua `FIELD_PAIR` với cả hai dạng thân. Desk xử lý đủ 412 → 409 → 403 → 422 theo thứ tự SEC 158-02; mock đúng thứ tự 412 → 409 → 403 → 422. Gộp thử `main` @ `f63afee0`: `tsc` sạch, `gen_strings` không lệch, admin-web 100 tệp / 1135 ca xanh. 12 đột biến ARC: 8 đỏ, C3/C4 tương đương, C10/C11 xanh. Thẻ: 162-01 Minor (khách nhận phòng hoặc đơn bị hủy ở máy khác làm tăng `version`, nên máy chủ trả 412, không phải 403/409; Desk hiện câu xung đột chung và câu `closer_change_forbidden` không bao giờ hiện – probe P1; tải lại sau 412 rồi tính lại quyền; trước tag v1.0.5 cùng UXD 162-01); 162-02 Suggestion (`channelGroup` từ `catalog`; danh sách kênh lỗi làm đơn CTV mang nhãn "Người chốt" thay vì "CTV chốt đơn" và cho chọn mọi người – probe P2; chờ `catalog` ready; đề xuất `Reservation.channelGroup` v1.0.6); 162-03 Suggestion (ca giữ thứ tự 409 → 403 của mock, ca người chốt cũ trên kênh không cần người chốt, mock theo nhóm kênh và dạng lỗi số thẻ; để sẵn v1.3: 409 hoa hồng không đi nhánh đổi trạng thái đơn). Không ESC | ARC | rounds/round-05/reviews/ARC-on-fe-pr-162.md |
