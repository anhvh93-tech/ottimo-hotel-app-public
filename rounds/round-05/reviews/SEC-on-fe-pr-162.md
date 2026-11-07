# SEC – Review PR #162 (FE-A, ô "Người chốt" trên khung đơn theo mốc)

Round 5 · v1.0.5 · bước **Review** · SEC · 07/11/2026

## Đối tượng

| PR | Nhánh | HEAD | Phần đọc | CI lúc đọc |
|---|---|---|---|---|
| #162 | `r5-fe-closer-field` → `main` | **`c5cc1f50`** | 11 tệp: `CloserField.tsx` (mới), `ReservationDrawer.tsx` (+14/−1), `problem.ts` (một cặp `FIELD_PAIR`), mock `stay.ts`, test `v5-30-closer-field-fea.test.tsx` (35 ca), 7 khóa chữ (sinh lại), báo cáo FE. Commit gộp `7887aa39` chỉ giải xung đột ở tệp chữ | Xanh: API contract (RBAC `--strict`), Redocly, gitleaks, confidential paths, shellcheck, landing, no test endpoints. **"format · lint · audit · test · build" đang chạy** |

Đối chiếu:
- thẻ SEC FB-R5-SEC-ARC-1I-03 (`SEC-on-contract-0313-addendum-1i.md`) và FB-R5-SEC-ARC-158-03 (`SEC-on-arc-pr-158.md`);
- hợp đồng 0.3.13 bổ sung 1h/1i: `updateReservation`, `ReservationPatch.closerChangeReason`, `listCloserCandidates` (`x-roles` FD+), `CloserCandidate`;
- mã máy chủ trên `main`: `reservations.service.ts` `update` (thứ tự kiểm, 403 theo mốc), `auth.guard.ts` (vai không có operation → 403 + `access.denied`);
- `copy-v1.0.5.md` bản 2.5 mục 9.16; DOM 154-03.

Cách kiểm:
- Đọc `gh pr diff 162` và tệp ở `refs/pull/162/head`.
- Worktree tạm ở `c5cc1f50` trong scratchpad, `pnpm install --offline`, build `@ottimo/contracts`:
  - test của PR: **35/35 xanh**;
  - 3 probe của SEC (tệp test tạm, không commit), mục 3;
  - 1 đột biến, mục 3.
- So chữ bằng script: 7 khóa VI/EN của PR khớp **từng byte** với bảng 9.16 của UXD.
- Đã xóa worktree, ref tạm và tệp tạm khi xong.

Tệp này không có bí mật, mật khẩu, địa chỉ IP, tỷ lệ hay số tiền hoa hồng, tên người hay dữ liệu khách.

## Kết luận: **DUYỆT** PR #162 @ `c5cc1f50`. Gộp khi CI xanh trên đúng SHA

0 Blocker · 0 Major · 0 Minor · 2 Suggestion. Không thẻ nào chặn gộp. Không ESC.

- **1I-03 đạt.** Dòng `rsv.closer.reason_help` hiện mỗi khi ô lý do hiện, kể cả khi có lỗi, và có trong `aria-describedby`. Chữ đúng nguyên văn UXD 9.16: không ghi họ tên, số giấy tờ, số thẻ của khách, tỷ lệ hay số tiền hoa hồng.
- **158-03, phần FE: có.** Dòng nhắc lên cùng PR có ô lý do, đúng như thẻ đòi.
- `CARD_NUMBER_DETECTED` ở ô lý do ra câu `field_error.reason_card_number`, không ra câu chung của ô ghi chú. Desk không lặp lại giá trị đã gõ.
- Lý do chỉ gửi khi người chốt đổi.
- Vai × mốc khớp máy chủ ở mọi ô.
- 403 tải lại đơn trước khi hiện câu.
- Không có dữ liệu hoa hồng nào tới khung đơn qua ô này.
- Hai gợi ý: 403 khi tải lại hỏng (162-01); test giữ luật "SAL/CTV không gọi danh sách người chốt" (162-02).

## 1. Điểm ORC hỏi

| # | Điểm | Kết quả | Căn cứ |
|---|---|---|---|
| 1 | Ô lý do có `rsv.closer.reason_help` | **Đạt** | `Field help={t('rsv.closer.reason_help')}` ở cả hai luật (bắt buộc, không bắt buộc). `Field` của `@ottimo/ui` luôn vẽ `help` khi có, dù có `error` hay không. `aria-describedby` = lỗi + help. Không CSS nào ẩn `.help` khi ô `invalid`. Test của PR kiểm help còn hiện ở cả 4 ca 422 và ca dưới 3 ký tự |
| 2 | Chữ dòng nhắc | **Đạt** | VI: "Lễ tân và lễ tân trưởng đọc được lý do này trong lịch sử đơn. Không ghi họ tên, số giấy tờ, số thẻ của khách, cũng không ghi tỷ lệ hay số tiền hoa hồng." EN tương ứng. Cả 7 khóa khớp từng byte với 9.16 |
| 3 | `CARD_NUMBER_DETECTED` → `field_error.reason_card_number` | **Đạt** | `FIELD_PAIR` thêm cặp `/(^\|\.)closerChangeReason$/` + `CARD_NUMBER_DETECTED`; áp cho cả `body.closerChangeReason`. Câu nằm dưới ô, không lên khung lỗi, không hiện `error.CARD_NUMBER_DETECTED`. `fieldErrors` chỉ dịch mã, không bao giờ chép `message` hay giá trị từ máy chủ. Test: hai mã gốc và một ca đầu cuối với số thẻ thử qua V-09 của mock |
| 4 | Lý do chỉ gửi khi người chốt đổi | **Đạt** | `save` dừng khi `!changed`. Thân = `closerUserId`, cộng `closerChangeReason` chỉ khi `askReason && text`. `askReason` = đổi người **và** đơn ngoài giữ chỗ. Chọn lại người cũ thì xóa chữ đã gõ. 403 và lưu xong cũng xóa chữ. Lý do được cắt khoảng trắng; dưới 3 ký tự bị chặn ngay tại Desk. Test: giữ chỗ chỉ có `closerUserId`; MGR để trống thì không có khóa; chọn lại người cũ thì không gửi |
| 5 | Vai × mốc | **Đạt, khớp máy chủ** | `closerAccess` so với `update` trên `main`:<br>– không phải FD+ → `hidden`;<br>– `hold` → FD+ sửa, không lý do;<br>– `confirmed` chưa nhận phòng → MGR+ sửa (lý do không bắt buộc), FD/FDL chỉ đọc kèm `readonly_manager`;<br>– đã nhận phòng (`in_house`, `checked_out`, hoặc có `actualCheckinAt`) → chỉ OWN sửa (lý do bắt buộc), MGR/FDL/FD chỉ đọc kèm `readonly_owner`;<br>– `cancelled`, `no_show` → chỉ tên.<br>Người có nhiều vai được hợp quyền, như `hasAny` của máy chủ. `checked_out`: thân chỉ 2 khóa và đúng `If-Match` (BE 1H-01). Test có đủ 16 ô vai × mốc |
| 6 | SAL/CTV không có dòng | **Đạt** | `shown` = false trước mọi `useEffect` gọi mạng, nên SAL/CTV không gọi `listCloserCandidates` (FD+ only). Nếu gọi, guard trả 403 và ghi `access.denied` ở mỗi lần mở khung đơn. Probe P1: SAL trên `hold`, `confirmed`, `in_house`, `checked_out` → 0 lời gọi danh sách, 0 PATCH. Test của PR chưa giữ điều này (thẻ 162-02) |
| 7 | 403 tải lại đơn trước khi hiện câu | **Đạt** | Nhánh `FORBIDDEN_ACTION`: `await reload()` (`getReservation`), đặt lại người chọn, xóa lý do, rồi mới hiện `error.closer_change_forbidden` (`role="alert"`, đưa focus tới). Ô thành chỉ đọc kèm dòng của mốc mới. Test kiểm lần đọc lại xảy ra trước câu. Ca tải lại hỏng: thẻ 162-01 |
| 8 | Không có dữ liệu hoa hồng tới khung đơn | **Đạt** | Ô chỉ đọc `Reservation` (không có trường hoa hồng nào) và `CloserCandidate` (`userId`, `displayName` D27 – FD/FDL được thấy, `kind`). Thân trả về của PATCH là `Reservation`. Dòng "Hoa hồng dự kiến của bạn" có sẵn của khung đơn chỉ chạy khi `sales = !fd && (SAL \| CTV)`, mà vai đó không thấy ô người chốt. Đổi người chốt không đọc lại hoa hồng. Người chốt không còn trong danh sách hiện `mlog.who_unlisted`, không hiện tên |
| 9 | Lý do không vào URL, log, toast | **Đạt** | PATCH mang lý do ở thân, URL chỉ có id. Không `console.*`, không toast. `notifyChanged()` chỉ gửi tên sự kiện. `useWrite` không lưu thân vào storage; thông báo gửi lại không có thân. Probe P3: chuỗi đánh dấu trong lý do (ca lưu được và ca 422) → 0 lần trong `console.*`, `localStorage`, `sessionStorage`, `location.href` |

Ghi chú, không thành thẻ:
- Ô lý do không đặt `autoComplete="off"`. Các ô ghi chú tự do khác của Desk (ví dụ ghi chú nội bộ) cũng vậy, và chưa có luật SR nào về việc này. SEC không đòi riêng ở đây. Dòng nhắc 1I-03 là chốt chính.
- Mock MSW chỉ dùng cho dev và test, theo khuôn có sẵn. Dữ liệu là đơn mẫu và tài khoản QA. Số thẻ trong test là số thử công khai.

## 2. Thẻ SEC liên quan

| Thẻ | Trạng thái |
|---|---|
| FB-R5-SEC-ARC-1I-03 (Suggestion) | Phần UXD: Done (copy 2.5, 9.16). **Phần FE-A: Done ở #162 → Closed khi #162 gộp.** Phần ARC: một câu ở 0.3.14 (m) |
| FB-R5-SEC-ARC-158-03 (Suggestion) | Phần FE: **có trong #162**. Phần ARC (chữ (m), mục 12) vẫn mở |

## 3. Probe và đột biến của SEC

Chạy trên worktree tạm ở `c5cc1f50`. Tệp probe không commit, đã xóa cùng worktree.

| # | Ca | Kết quả |
|---|---|---|
| P1 | SAL mở khung đơn "Sale nội bộ" ở `hold`, `confirmed`, `in_house`, `checked_out` | Không có dòng người chốt; **0** lời gọi `listCloserCandidates`, **0** PATCH. Đạt |
| P2 | MGR đổi người chốt ở `confirmed`; khách nhận phòng ở máy khác; PATCH → 403; lần `getReservation` sau đó lỗi (mất mạng) | Câu `error.closer_change_forbidden` ("Desk đã tải lại đơn") vẫn hiện, dù tải lại đã hỏng. Ô chọn **vẫn sửa được**. Chọn lại thì nút Lưu hiện, gửi được PATCH thứ hai, tức một 403 nữa và một dòng `access.denied` nữa → thẻ 162-01 |
| P3 | OWN, `in_house`: lý do mang chuỗi đánh dấu; một lần lưu được, một lần 422 `CARD_NUMBER_DETECTED` | Chuỗi đánh dấu không có ở `console.*`, `localStorage`, `sessionStorage`, `location.href`. Đạt |
| M5 | Đột biến: SAL/CTV vẫn gọi `listCloserCandidates` (ô vẫn ẩn) | 35/35 ca của PR **vẫn xanh** (đột biến sống); P1 đỏ 4/4 → thẻ 162-02 |

## 4. Thẻ

### FB-R5-SEC-FE-162-01
- Mức độ: Suggestion
- Người nhận: FE-A; UXD xem câu
- Vị trí: `CloserField.tsx`, nhánh `FORBIDDEN_ACTION` trong `save`, và cách vẽ ô theo `forbidden`
- Vấn đề:
  - Sau 403, ô chỉ thành chỉ đọc khi lần tải lại thành công **và** làm `closerAccess` đổi.
  - Tải lại hỏng (probe P2) thì `fresh` = null. Đơn trong khung vẫn là bản cũ, nên ô vẫn sửa được. Câu vẫn nói "Desk đã tải lại đơn". Người dùng chọn lại và gửi tiếp, máy chủ ghi thêm một dòng `access.denied`.
  - Cùng chuyện khi 403 đến vì vai của người dùng vừa bị thu hồi: tải lại đơn không đổi `roles` của phiên, nên ô vẫn sửa được.
- Vì sao quan trọng:
  - DOM 154-03 và 1H-03 muốn vai bị máy chủ từ chối thì không có nút. Như vậy `access.denied` chỉ ghi những lần đáng xem.
  - Nhiều dòng từ chối liên tiếp của một quản lý trên màn tuần của OWN trông như dò quyền.
  - Câu báo sai ("đã tải lại") làm người dùng thử lại.
  - Mức thấp: không có quyền nào bị lọt; máy chủ vẫn chặn mọi lần.
- Đề xuất sửa:
  - Khi `forbidden` đúng, vẽ ô ở chế độ chỉ đọc, không ô chọn, không nút, cho tới khi đơn có `version` mới hoặc khung đơn đóng.
  - Tải lại hỏng: vẫn hiện câu 403, thêm nút `common.reload` như nhánh 412. Hoặc UXD cho một câu không nói "đã tải lại".
  - Thêm một ca test: 403 + `getReservation` lỗi → không có ô chọn, không có PATCH thứ hai.
- Trạng thái: Open

### FB-R5-SEC-FE-162-02
- Mức độ: Suggestion
- Người nhận: FE-A, QA biết
- Vị trí: `v5-30-closer-field-fea.test.tsx`, ca "SAL: no closer row…" và "CTV: no closer row on their own hold"
- Vấn đề:
  - Hai ca này chỉ kiểm không có chữ và không có ô chọn.
  - Đột biến M5 (SAL/CTV vẫn gọi `listCloserCandidates`, ô vẫn ẩn) làm cả 35 ca vẫn xanh.
  - Nếu sau này có người dời `useEffect` hay điều kiện `shown`, mỗi lần SAL/CTV mở khung đơn sẽ thành một 403 và một dòng `access.denied` của guard. Giao diện không thấy gì khác.
- Đề xuất sửa: thêm vào hai ca (hoặc một `it.each` cho SAL/CTV × `hold`/`confirmed`/`in_house`/`checked_out`), như probe P1 của SEC:
  - `vi.spyOn(api, 'listCloserCandidates')` và `vi.spyOn(api, 'updateReservation')`;
  - chờ khung đơn đọc xong;
  - `expect(...).not.toHaveBeenCalled()`.
- Trạng thái: Open

## 5. Điểm làm tốt

- Desk dựng quyền theo đúng thứ tự và luật của máy chủ, ghi rõ nguồn từng nhánh. Vai bị máy chủ từ chối thì không có nút, nên không sinh `access.denied` vô ích.
- Thân PATCH tối thiểu: chỉ người chốt và lý do khi thật sự đổi. Đơn `checked_out` nhận được, và lý do không bao giờ đi lạc sang lần gửi khác.
- Lỗi số thẻ ở ô lý do có câu riêng, nằm dưới đúng ô. Desk không lặp giá trị, và dòng nhắc vẫn hiện khi có lỗi.

ESC mới: **không**.

## Dòng decision-log (ORC ghi)

| 2026-11-07 | 5 | **SEC – review FE-A PR #162 (r5-fe-closer-field, ô Người chốt trên khung đơn theo mốc) @ c5cc1f50: DUYỆT, gộp khi CI xanh trên đúng SHA** (format/lint/test/build đang chạy lúc đọc). 1I-03 đạt: rsv.closer.reason_help luôn hiện cùng ô lý do, kể cả khi lỗi, có trong aria-describedby; 7 khóa khớp từng byte UXD 9.16. Phần FE của 1I-03 Done → Closed khi #162 gộp; phần FE của 158-03 có. CARD_NUMBER_DETECTED ở closerChangeReason → field_error.reason_card_number (FIELD_PAIR), không lặp giá trị. Lý do chỉ gửi khi người chốt đổi và đơn ngoài giữ chỗ (cắt khoảng trắng, chặn dưới 3 ký tự tại Desk, xóa khi chọn lại người cũ, sau 403 và sau khi lưu). Vai × mốc khớp update trên main (hold FD+; confirmed MGR+, FD/FDL chỉ đọc + readonly_manager; sau nhận phòng chỉ OWN, còn lại chỉ đọc + readonly_owner; checked_out thân 2 khóa + If-Match). SAL/CTV không có dòng, không gọi listCloserCandidates (probe P1: 0 lời gọi, 0 PATCH). 403 tải lại đơn trước khi hiện error.closer_change_forbidden. Không dữ liệu hoa hồng nào tới ô (Reservation không có trường hoa hồng; CloserCandidate chỉ userId, displayName D27, kind; dòng hoa hồng có sẵn chỉ cho SAL/CTV thuần). Lý do không ở URL, console, storage (probe P3). Test của PR 35/35 xanh trên worktree tạm. Thẻ: 162-01 Suggestion FE-A (403 khi tải lại hỏng hoặc vai vừa bị thu hồi: ô vẫn sửa được, câu nói đã tải lại, gửi lại được → thêm access.denied; giữ chỉ đọc sau 403 tới version mới), 162-02 Suggestion FE-A (test SAL/CTV không gọi listCloserCandidates và updateReservation – đột biến M5 sống với 35 ca). Không ESC | SEC | rounds/round-05/reviews/SEC-on-fe-pr-162.md |
