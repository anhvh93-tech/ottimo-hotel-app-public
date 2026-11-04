# SEC review – PR #74, BUG-R4-039: không còn ngoại lệ nhận phòng vào căn còn khách (`v104/fix-checkin-occupied-exception`)

- Người review: SEC | Round 4, đợt v1.0.4, bước **Review chéo** | 05/11/2026
- Đối tượng: PR #74 @ **`71d0a1b1`**. Đọc bằng `git diff origin/main...origin/v104/fix-checkin-occupied-exception`. Merge-base là `e7545203` (đỉnh `main`), nên diff chỉ gồm phần của PR, sau khi đã gộp #71, #80 và #81.
  - Mã: `frontdesk/internal/checkin.service.ts` (`evaluate`, `roomHolder`, vòng điều kiện của B9).
  - Hợp đồng: `openapi.yaml` (mục (l), mô tả `checkIn`, `CheckInPreview.conditions[]`), và các tệp sinh `api-client` / `openapi-schemas.ts`.
  - Test: `checkin-occupied-exception.test.ts` (mới), `reversal-debt-g4.test.ts`. Oracle: `br-examples.json`.
- Đọc thêm để đối chiếu:
  - định nghĩa "ai đang ở căn": `housekeeping/public/stay-occupancy.ts` (`inRoomOnSql`);
  - đường duyệt: `assertRoomApproval`, `approvals/public/approval.service.ts`;
  - các nơi khác dùng `CheckinService` (`frontdesk.module.ts` hook `amountDue`, `stay.service.ts`, `worker-hooks.ts`);
  - phân quyền: `x-roles`/`x-scope` của `previewCheckIn`, `checkIn`, `getRack`, `listReservations`, `getReservation`;
  - `ARC-on-v104-pr74-checkin-occupied.md` lượt 1–2, mục BUG-R4-039 (QA2) trong `qa/bug-list-v1.0.4.md`.
- Giới hạn: chỉ đọc mã. Không chạy stack, không chạy test, không sửa mã, không commit, không push. Bằng chứng chạy thật là của ARC (7/7, đảo C1 thì ca 301 đỏ) và QA2 (5 lối × C1–C5, K1–K3).

## 0. Kết luận

**ĐẠT CÓ ĐK, rủi ro còn lại Low.**
- Phần mã của #74 đạt. **Gộp được**, không có Blocker.
- Đường chính của lỗi đã đóng ở cả xem trước lẫn lúc ghi, cho mọi vai và cả đường duyệt (mục 1).
- `heldByReservationCode` không lộ thêm dữ liệu (mục 2).
- Không có migration. Phân quyền và audit không đổi, vẫn đúng (mục 3–4).

**Điều kiện (trước khi phát hành v1.0.4, không phải trước khi gộp):** thẻ **01 (Major)**. Lỗi đã nằm ở production từ v1.0.1, nên cần một truy vấn chỉ đọc để biết **đã từng** có khách nhận phòng vào căn còn người hay chưa. Nếu có, đó có thể là sự cố an ninh và riêng tư với khách thật. Truy vấn trước deploy mà ARC đề nghị chỉ thấy tình trạng **hôm nay**.

Thẻ **02 (Minor, v1.0.5):** còn một ca hẹp vẫn mở được ngoại lệ, là ngày khách chuyển về căn cũ (ARC-PR74-04). SEC nâng ca này từ Suggestion lên Minor, vì hậu quả giống hệt BUG-R4-039. Trong lúc chờ v1.0.5, cần thêm một dòng vào sổ tay.

CI run `41889899172` @ `71d0a1b1`: `gitleaks`, API contract (`--strict`), Redocly và "no test endpoints in production contract" đều xanh. Job test đang chạy lúc SEC xem.

## 1. Còn vai nào, hay đường duyệt, lấy được ngoại lệ không

**Đường chính: không còn.**

- **Một nguồn sự thật cho cả xem trước và lúc ghi.**
  - `checkIn` khóa đơn đến (`loadReservation … forUpdate`), rồi gọi lại `evaluate(tx, …, 'write')` trong cùng giao dịch.
  - `roomHolder` chạy ở cả hai chế độ, không phụ thuộc vai.
  - `overridableBy` chỉ có khi đủ ba điều: `!!room && !holder && (VD || CL)`.
  - Vòng điều kiện của B9 chỉ bỏ qua `room_ready` khi `c.overridableBy && roomOverride`. Đây đúng là cờ mà xem trước trả về, client không gửi được.
- **Mọi vai đều bị chặn.**
  - Không có `overridableBy` thì lý do của FDL/MGR/OWN bị bỏ qua, và `room_ready` vào `unmet`, trả 409 `CHECKIN_CONDITIONS_NOT_MET`. FD không còn nhánh 202, nên không tạo yêu cầu duyệt.
  - Test khẳng định đủ 4 vai, cả bốn đều không ghi gì: đơn vẫn `confirmed`, trạng thái buồng không đổi, 0 yêu cầu duyệt, 0 việc `priority_clean`.
- **Đường duyệt bị chặn, kể cả yêu cầu đã duyệt từ trước.**
  - `assertRoomApproval` chỉ được gọi **sau** khi đã có `overridableBy`.
  - Một yêu cầu `approved` (ví dụ tạo dưới v1.0.3) gửi vào căn còn người sẽ bị bỏ qua, và trả 409. Test ca 203 có ca này, QA2 ca C2 cũng vậy.
  - Không có 422 riêng cho "yêu cầu không hợp lệ", nên đường này không lộ thông tin gì về yêu cầu.
  - Duyệt yêu cầu không tự nhận phòng. FD phải gửi lại B9, và B9 tính lại điều kiện lúc ghi.
- **Định nghĩa "ai đang ở căn" đầy đủ.**
  - `inRoomOnSql(D)` dùng nguyên, gồm: lượt đi hôm nay chưa B18, lượt phủ đêm nay, đoạn mới nhất ở ngày chuyển căn, và lượt quá ngày đi chưa B18.
  - Lượt của chính đơn này, gốc và đơn con, bị loại đúng.
  - Trạng thái buồng bị sửa tay (C5), hay lên `CL` qua `needs_cleaning`/`start_cleaning` (C1, ca 301/302), đều không mở lại ngoại lệ.
- **SQL an toàn.** `inRoomOnSql` chỉ ghép tên tham số cố định (`$3::date`), không có dữ liệu người dùng. Căn lấy từ đoạn của chính đơn, nên không thể trỏ sang căn của cơ sở khác.
- **Tranh chấp thời điểm (đọc mã, chưa thử).** SEC không thấy cách nào để một lượt "giữ căn" xuất hiện giữa lúc tính và lúc ghi:
  - hai đơn cùng căn cùng đêm đã bị tồn phòng chặn;
  - không có lệnh hoàn tác trả phòng;
  - lượt quá hạn không thể sinh mới.

  Chiều ngược lại, B18 của lượt cũ chạy song song, chỉ làm kết quả an toàn hơn: B9 thấy lượt cũ còn ở thì chặn.

**Còn hai chỗ, đều không phải đường chính:**
- **Ngày khách chuyển về căn cũ** (ARC-PR74-04, BR-424-05): xem thẻ 02.
  - Khi chưa ghi "khách đã chuyển về", `inRoomOnSql` không tính đoạn ở căn tạm, vì đoạn hôm nay đã là căn cũ. Căn tạm vì vậy không có `holder`.
  - Nếu căn tạm lên `CL`/`VD`, FDL trở lên xác nhận được ngoại lệ cho một đơn đến căn tạm cùng ngày, trong khi khách vẫn ở đó.
  - SEC suy ra từ đọc mã và phân tích của ARC, chưa chạy thử.
- **`VI`/`VC` cạnh một lượt quá ngày đi** (ARC-PR74-05): đây không phải ngoại lệ, mà là nhận phòng thường (`met`).
  - Theo ARC và QA2, chỉ dựng được bằng sửa DB tay. Để ra `VI`/`VC`, buồng phòng phải kiểm và xác nhận căn trống.
  - SEC đồng ý dời sang v1.0.5, không mở thẻ.

## 2. `heldByReservationCode`: lộ dữ liệu có chấp nhận được không – **Có**

- **Vai thấy được:** chỉ OWN, MGR, FDL, FD (`x-roles` của `previewCheckIn`). Guard kiểm theo `@Operation('previewCheckIn')`, và CI "API contract (RBAC `--strict`)" xanh. SAL, CTV, HK, MT gọi thì nhận 403.
- **Không phải thông tin mới với các vai đó.**
  - Với 4 vai này, `listReservations`/`getReservation` không có `x-scope`; chỉ SAL/CTV bị giới hạn ở `own`.
  - `getRack` đã trả `RackBar.reservationCode` cho cả căn đó.
  - Lỗi `ROOM_UNAVAILABLE` hiện có còn trả `reservationCode` kèm `guestDisplayName` cho FD trở lên.

  Tức là trường mới lộ **ít hơn** những gì các vai này đang thấy.
- **Không kèm PII.** Trường chỉ có mã đơn gốc, dạng `OTM-xxxxx`. Không có tên, số điện thoại, giấy tờ hay số căn. `detail` vẫn chỉ là trạng thái buồng.
- **Không phải chìa khóa truy cập.** Web khách dùng token của link và mã xác minh riêng (`GUEST_CODE_SIGNING_KEY`), không đăng nhập được bằng mã đơn.
- **Không lọt ra kênh khác.**
  - Lỗi 409 chỉ có `unmet`, không có mã đơn.
  - Hook `amountDue` của thanh toán dùng `evaluate` nhưng chỉ trả số tiền, và chặn vai ngoài quầy (403).
  - `CheckInPreview` chỉ được dùng ở `previewCheckIn`. Không có đường nào của web khách trả `conditions`.

## 3. Regex migration và quét bí mật

- `git diff origin/main...origin/v104/fix-checkin-occupied-exception -- '**/migrations/*'`: **0 tệp**. Regex SEC (`SEC-on-v104-ops-scripts.md` mục 5.2 (a)) khớp 0 dòng.
- Quét cả diff, bỏ dòng chú thích: khớp 1 dòng, là nhiễu. Đó là chữ "revoke" trong chuỗi mô tả `owner` của `br-examples.json`, không phải SQL.
- Bí mật và PII trong diff: không có. Mã thông báo thiết bị trong test sinh bằng `randomBytes` và chỉ lưu hash. Tên khách trong test là giả ("Khách Xe Đêm"). `setPassword` là helper của test.

## 4. Phân quyền và audit

- **Phân quyền không đổi.** `FDL_UP` = FDL/MGR/OWN cho `overridableBy`. Lúc ghi vẫn kiểm `fdlPlus` theo vai của phiên. FD chỉ tạo được yêu cầu `checkin_room_not_ready` khi căn **có** `overridableBy`. `assertRoomApproval` vẫn buộc yêu cầu đúng loại, đúng đơn, `approved`, và được duyệt trong ngày kinh doanh hôm nay.
- **Audit không đổi, vẫn đủ.** Khi có ngoại lệ, hệ thống ghi:
  - trên đơn: `checkin_room_override_by`, `checkin_room_override_reason`, `checkin_room_status_before`;
  - chuyển trạng thái, kèm lý do;
  - audit `reservation.checked_in`, có `roomStatusBefore` và `reason`.

  Lệnh bị từ chối (409) rollback cả giao dịch và không ghi gì, như mọi lệnh từ chối khác trong hệ thống. Test kiểm điều này.
- **Không đổi số phiên bản hợp đồng (`0.3.12-draft`, mục (l)): chấp nhận.** Thay đổi chỉ thu hẹp hành vi trong mã lỗi đã có, và thêm 2 trường đọc, tùy chọn, trong một tập mở.

## 5. Thẻ feedback

### FB-R4-SEC-QA-PR74-01
- Mức độ: Major (không chặn gộp #74; điều kiện trước khi phát hành v1.0.4)
- Người làm: QA viết truy vấn, SEC duyệt câu SQL, OPS chạy trên production. Gộp chung với FB-R4-ARC-QA-PR74-01 (2).
- Vị trí: dữ liệu production và staging, từ khi deploy `bad6f599` (16/10, có trong v1.0.1–v1.0.3).
- Vấn đề:
  - Truy vấn trước deploy ARC đề nghị (QA-PR74-01 (2)) chỉ tìm căn có ≥ 2 đơn `in_house` **hôm nay**, và yêu cầu `pending`.
  - Truy vấn đó không thấy các lần đã xảy ra trong quá khứ: khách mới nhận phòng vào căn còn người, rồi cả hai đã trả phòng.
  - Lỗi có ở production hơn hai tuần, nên SEC chưa biết đã có khách thật nào bị ảnh hưởng hay chưa.
- Vì sao quan trọng: BUG-R4-039 được xếp P1 chính vì hậu quả ngoài đời, là giao cửa căn đang có người ngủ (an ninh và riêng tư). Nếu đã xảy ra với khách thật, đó là sự cố cần chủ đầu tư quyết cách xử lý. SEC không tự kết luận được khi chưa có số liệu.
- Đề xuất sửa:
  1. Chạy truy vấn chỉ đọc (`BEGIN READ ONLY`, cùng vai và cách chạy mà OPS đã dùng cho truy vấn kiểm của BUG-R4-037) trên production, rồi trên staging. Hai nhóm cần tìm:
     - (a) đơn có `checkin_room_override_by IS NOT NULL` và `checkin_room_status_before IN ('OC','OD')`;
     - (b) cặp đơn **gốc** khác nhau, cùng căn (theo `reservation_segment.room_id`), có khoảng ở thật `[actual_checkin_at, COALESCE(actual_checkout_at, now()))` chồng nhau. Nhóm này bắt cả ca trạng thái bị sửa tay (C5) và ca `CL` (C1), vốn không để lại `OC`/`OD`.
  2. Gửi câu SQL cho SEC duyệt trước khi chạy.
  3. Trong repo (repo công khai) chỉ ghi **số lượng và ngày**. Không ghi mã đơn, tên hay căn của khách thật. Danh sách mã đơn gửi riêng cho ORC.
  4. Kết quả = 0: ghi vào decision-log, đóng thẻ.
  5. Kết quả ≥ 1: SEC tạo ESC cho chủ đầu tư, kèm phương án:
     - có liên hệ khách hay không;
     - có coi là sự cố dữ liệu cá nhân hay không. Việc này cần luật sư xác nhận; SEC không tuyên bố tuân thủ.
- Trạng thái: Open

### FB-R4-SEC-BE-PR74-02
- Mức độ: Minor (mã sửa ở v1.0.5; dòng sổ tay làm ngay ở v1.0.4)
- Người làm: BE sửa mã ở v1.0.5, cùng FB-R4-ARC-BE-PR74-04. BA thêm dòng sổ tay ngay.
- Vị trí: `checkin.service.ts` `roomHolder` → `inRoomOnSql(D)`. Trường hợp ngày về căn cũ (BR-424-05, `until_parent_departure`) khi chưa ghi khách chuyển về.
- Vấn đề:
  - Ngày D, khách chuyển tạm sang căn Y. Đoạn hôm nay của khách đã là căn cũ X, nhưng khách vẫn ở Y vì chưa ghi "đã chuyển về".
  - `inRoomOnSql` không tính đoạn Y, vì đã có đoạn X từ D. Căn Y vì vậy không có `holder`.
  - Nếu Y lên `CL`/`VD`, ví dụ buồng phòng bấm "Bắt đầu dọn" vì Y hiện là căn đi hôm nay, thì FDL trở lên xác nhận được ngoại lệ cho một đơn đến Y cùng ngày.
  - ARC xếp ca này là Suggestion v1.0.5. SEC suy ra từ đọc mã, chưa chạy thử.
- Vì sao quan trọng: kết quả giống hệt BUG-R4-039: giao cửa căn còn người. Ca này hẹp, vì cần đủ: một lần chuyển căn có ngày về, một đơn đến đúng căn tạm, buồng lên `CL`/`VD`, và FDL trở lên xác nhận có lý do. Vì vậy SEC không chặn v1.0.4. Nhưng ca này thuộc nhóm an ninh, nên không để ở mức Suggestion.
- Đề xuất sửa:
  1. v1.0.4, sổ tay lễ tân, mục ngoại lệ nhận phòng: "Ngày khách chuyển về căn cũ: ghi 'khách đã chuyển về' trước khi nhận phòng đơn mới vào căn tạm. Không xác nhận ngoại lệ cho căn tạm khi chưa ghi."
  2. v1.0.5: dùng hàm `roomOccupantOn(tx, roomId, D)` (ARC-PR74-04), tính cả ngày về chưa ghi, cho cả `met` lẫn `overridableBy` (ARC-PR74-05). Thêm test: ngày về chưa ghi, căn tạm `CL` → mọi vai 409, không tạo yêu cầu duyệt.
- Trạng thái: Open

## 6. Điểm làm tốt

- Xem trước và lệnh ghi dùng **cùng một cờ** `overridableBy`. Đường duyệt cũng đi qua cờ này, nên yêu cầu đã duyệt từ trước không mở lại được ngoại lệ, và có test riêng cho ca đó.
- Test khẳng định "không ghi gì" ở 4 mặt (đơn, buồng, yêu cầu duyệt, việc dọn) cho từng vai. Hai ca C1 đi qua API `status-transitions`, không chèn trạng thái bằng SQL. ARC đã đảo bản vá để chứng minh test bắt được lỗi.
- `cause` và `heldByReservationCode` giúp lễ tân biết phải trả phòng đơn nào, mà không mở thêm dữ liệu so với những gì vai đó đã thấy.

## 7. Dòng decision-log đề xuất (ORC ghi; SEC không sửa `decision-log.md` ở lượt này)

```
| 2026-11-05 | 4 | **SEC – #74 `v104/fix-checkin-occupied-exception` @ 71d0a1b1: ĐẠT CÓ ĐK, rủi ro còn lại Low – gộp được.** Ngoại lệ `room_ready` chỉ khi `room && !holder && VD/CL`; xem trước và B9 cùng cờ `overridableBy`; FDL/MGR/OWN và FD (202) đều 409, yêu cầu đã duyệt từ trước cũng bị bỏ qua; không ghi gì khi từ chối. `heldByReservationCode` chấp nhận: chỉ OWN/MGR/FDL/FD, chỉ mã đơn gốc, ít hơn rack và `ROOM_UNAVAILABLE` đang trả. Không migration (regex 0), RBAC/audit không đổi, gitleaks xanh. Điều kiện phát hành v1.0.4: SEC-QA-PR74-01 (Major) – truy vấn chỉ đọc trên production tìm các lần đã nhận phòng vào căn còn người từ v1.0.1 (override `OC`/`OD` + khoảng ở chồng nhau), repo chỉ ghi số; ≥ 1 → SEC tạo ESC. SEC-BE-PR74-02 (Minor): ngày về căn cũ chưa ghi vẫn mở ngoại lệ ở căn tạm – sổ tay ngay, mã v1.0.5 cùng ARC-PR74-04/05 | SEC | Review |
```

## Phản hồi BA (05/11/2026) – FB-R4-SEC-BE-PR74-02, phần sổ tay

- **Fixed (sổ tay), PR #72, vẫn nháp.** Sổ tay 2.10 và `02` 7.4, chỗ ngoại lệ `VD`/`CL`, thêm một câu:
  - trước khi gửi hoặc xác nhận ngoại lệ, kiểm căn (hoặc hỏi buồng phòng) thật sự không còn người và đồ của khách, nhất là căn có khách đổi phòng trong hôm nay mà chưa chuyển xong;
  - còn người hoặc đồ: không xác nhận; chờ khách chuyển xong, hoặc đổi đơn mới sang căn trống khác.
- **Lệch so với chữ đề xuất:** BA không viết "ghi 'khách đã chuyển về' trước", vì trên `main` Desk và app nhân viên không có chỗ để ghi.
  - Không giao diện nào gửi `stayScope: until_parent_departure` (lối "chuyển tới hết đơn gốc").
  - Cũng không giao diện nào gửi `roomReturnRecorded`. Hai trường này chỉ có ở API.
  - Vì vậy sổ tay dùng bước kiểm căn thật. Khi FE thêm nút, BA thêm bước ghi. Đã có chú thích ẩn trong md.
- Mã vẫn sửa ở v1.0.5 (BE, cùng ARC-PR74-04/05). Thẻ để SEC đóng phần sổ tay.
