# ADR-015 – Tính thử (`dryRun`) cho thao tác tính và ghi xen kẽ: giao dịch luôn ROLLBACK

- Trạng thái: **Chấp nhận** (27/10/2026). SEC chấp nhận lệch mẫu A3 **chỉ cho B16**, có điều kiện; điều kiện đã đáp ứng ở nhánh `be-a-v1.0.1` (`SEC-on-ADR-015.md`, `SEC-on-BE-A-v1.0.1.md`).
- Người quyết: ARC | Ngày: 27/10/2026 | Round 3 – Phản hồi & sửa, bản vá v1.0.1 (04/11)
- **Sửa 27/10 (ARC, theo ORC)**: viết lại theo cách BE-A đã cài và theo review SEC/BE-B:
  - mục 2.1 (`Database.simulate`, `simulation_guard`);
  - mục 2.2 (ngoại lệ SAVEPOINT, bộ lọc chỉ là lớp nhắc);
  - mục 2.4 (quy tắc hook);
  - mục 4 (khoảng trống id, test ảnh chụp toàn tenant);
  - mục 5 (việc dời v1.1).
- Liên quan:
  - OpenAPI 0.3.9 (`earlyDeparture`), US-135, US-137, FB-R3-DOM-BA-02 (Blocker);
  - SEC A3 (0.3.6 – `setLateCheckout` `dryRun` readOnly), SEC-BE-21 (fail-closed `dryRun`), ADR-009 (idempotency);
  - `rounds/round-03/outputs/ARC/contract-v1.0.1.md`;
  - migration `0089_simulation_guard_room_price_cancel.sql`.

## 1. Bối cảnh
- Hợp đồng hứa "hủy đơn, trả sớm, đặt trả muộn hỗ trợ `dryRun`" (US-135). Hộp xác nhận phải nêu hậu quả tiền **trước** khi làm thao tác không đảo ngược. B16 trả sớm chưa có `dryRun`, và FE không được tự tính tiền.
- Mẫu hiện có:
  - `setLateCheckout`, `addPartyMember` tính thử trong giao dịch **READ ONLY** (SEC A3). Ở mẫu này, DB bảo đảm "không ghi".
  - `cancelReservation`, `changeRoom` dùng một hàm tính chung cho tính thử và lần ghi.
- B16 khác. `StayService.earlyDeparture` **phải ghi rồi mới tính được**: giải phóng occupancy → void đêm → `resyncStay` (cả `ota_collect` của đơn OTA trả trước) → đảo chênh lệch đổi phòng → ghi dòng phí → **sau đó** mới đọc `unhandledCreditVnd` để trần số hoàn.
- Viết một công thức thứ hai riêng cho tính thử thì dễ lệch với lần ghi. Đây đúng là loại lỗi tiền đã gặp ở BUG-R3-012/013/014.

## 2. Quyết định
Với thao tác có tính và ghi xen kẽ (hiện **chỉ B16**), tính thử chạy **chính hàm ghi** trong một giao dịch không bao giờ commit được.

### 2.1 Hai lớp bảo đảm, một lớp do DB giữ
1. **`Database.simulate(ctx, fn)`** – đường riêng, **không có đường commit**:
   - Dùng kết nối riêng. Thứ tự: `BEGIN` → `SET_CONTEXT_SQL` (cùng tenant/RLS) → **chèn dòng `simulation_guard`** → `fn(tx)` → `ROLLBACK` trong `finally`.
   - `ROLLBACK` lỗi thì hủy kết nối (`release(true)`), không trả về pool.
   - Mã của `simulate` không có chữ `COMMIT` (có test đọc mã).
   - Không tái dùng `withContext` (hàm này luôn COMMIT khi thành công) với mẹo "ném lỗi để rollback".
2. **Chốt ở tầng DB – `simulation_guard`** (thay cho READ ONLY của A3):
   - Bảng gồm `id`, `organization_id`, `property_id`, `created_at`. RLS forced; `ottimo_app` chỉ có quyền INSERT. Bảng luôn rỗng ngoài một mô phỏng đang mở.
   - `CONSTRAINT TRIGGER simulation_guard_no_commit … DEFERRABLE INITIALLY DEFERRED` **luôn** `RAISE`.
   - Vì vậy giao dịch nào có dòng guard thì Postgres từ chối COMMIT, dù mã làm gì. `SET CONSTRAINTS ALL IMMEDIATE` chỉ làm lỗi xảy ra sớm hơn; giao dịch vẫn hỏng.
3. **Bất biến thứ tự**: dòng guard được chèn ở **mức giao dịch gốc, trước khi handler chạy**, nên không savepoint nào có trước nó.
   - Đổi thứ tự là đổi kiến trúc: chèn guard sau một savepoint hoặc bên trong handler thì `ROLLBACK TO` có thể xóa luôn chốt.
   - Hai test giữ bất biến này (SEC FB-R3-SEC-BE-A-01):
     - test đọc mã: `INSERT INTO simulation_guard` đứng trước lời gọi `fn(`;
     - test DB: guard → `SAVEPOINT a` → ghi → `ROLLBACK TO a` → `RELEASE a` → kết thúc giao dịch phải lỗi.
4. **Ghép cờ với giao dịch**:
   - `simulate` gắn `tx.ctx.simulation = true`. `earlyDeparture` lấy chế độ **từ `tx.ctx`**, không nhận tham số do controller truyền.
   - Thân `dryRun: true` trong giao dịch thường, hoặc thân thường trong giao dịch mô phỏng → lỗi 500 trước khi đọc gì.
   - `UnitOfWork.simulate` chỉ nhận request mà guard đã xác định là dry run khai báo (`operation.dryRun` + thân `dryRun: true`). Nó kiểm lại quyết định vai, giữ dấu "trong unit of work" (chặn mở kết nối thứ hai), không ghi `idempotency_key`.
   - `lock_timeout` 1 s, `statement_timeout` 5 s, đặt local.

### 2.2 Lệnh điều khiển giao dịch
- `tx.query` của `simulate` từ chối:
  - `COMMIT`, `END`, `ABORT`;
  - `ROLLBACK` (không có `TO`);
  - `BEGIN`, `START`/`PREPARE TRANSACTION`;
  - `SET` không `LOCAL`, `RESET`, `DISCARD`.
- **Ngoại lệ có chủ đích: cho phép `SAVEPOINT` / `RELEASE` / `ROLLBACK TO`.** Lý do:
  - (a) guard có trước mọi savepoint (bất biến mục 2.1 điểm 3), nên `ROLLBACK TO` không xóa được sự kiện trigger đã xếp hàng;
  - (b) `RELEASE`/`ROLLBACK TO` không kết thúc được giao dịch gốc;
  - (c) `occupancy.update` của B16 cần savepoint để bắt 23P01 (chống đặt trùng, ADR-009).
- Bộ lọc này **chỉ là lớp nhắc lập trình viên, không phải ranh giới bảo mật**. Nó có thể bị lách bằng chú thích trong chuỗi hoặc `set_config(..., false)`. **Ranh giới là `simulation_guard`.** Mọi câu SQL đều tham số hóa nên không có đường tiêm.
- `tx.db` (drizzle) không đi qua bộ lọc. Quy tắc: **trên đường mô phỏng không gọi `tx.db.transaction(...)`**, vì drizzle sẽ gửi `begin/commit/rollback` thẳng lên kết nối. Hiện không chỗ nào dùng `tx.db` trong `src/modules`, `src/shared`.

### 2.3 Trong chế độ mô phỏng, hàm bỏ gì và trả gì
- **Bỏ** các bước để lại dấu vết có ý nghĩa hoặc có tác dụng ngoài giao dịch:
  - `approvals.submit` (không cấp mã yêu cầu duyệt);
  - `attachments.bindTo` (vẫn chạy `assertUsable`);
  - `audit.recordMoney` cuối hàm;
  - hook registration, outbox, SSE, hook đơn đặt phòng (`stay.emit`).
- **Chạy thật rồi rollback**: occupancy, void đêm, `replaceLateCharge`, `resyncStay`, `onReservationVoided`, `reverseLine`, `postLines`, `balance`. Audit lồng trong các hàm folio cũng nằm trong giao dịch và mất khi rollback.
- **Trả về**:
  - `reservation` là **ảnh chụp đơn đang lưu**, đọc dưới khóa (đơn → căn → folio) **trước** lần ghi đầu tiên. Không trả đơn sau khi đổi. `ETag` là `version` đang lưu (SEC thẻ 02).
  - Các hậu quả nằm ở `EarlyDepartureResult`, không phản ánh vào `reservation`.
- **Lần ghi thật** nhận `expectedRefundVnd`/`expectedFeeVnd`:
  - Hai số này lấy từ lần tính thử có **cùng toàn bộ input**. Server tính lại trong giao dịch ghi; lệch thì trả `409 AMOUNT_CHANGED`, rollback cả khóa idempotency.
  - Hai số chỉ để so, không bao giờ là số ghi. Audit lần ghi có `previewConfirmed` và hai số đã hiện.

### 2.4 Quy tắc hook (SEC thẻ 03)
- Hook đăng ký vào `ReservationHooks` (và các listener `transitioned`/`stay_changed`/`created`) **chỉ được dùng `tx` của tham số**: không mở kết nối, không gọi HTTP, không ghi tệp, không đổi trạng thái trong tiến trình (cache, bộ đếm).
- Hook nào bắt buộc có tác dụng ngoài giao dịch thì phải đọc `tx.ctx.simulation` và bỏ qua khi đang mô phỏng.
- Đường tính thử B16 hiện không gọi `emit`, nên không hook nào chạy. Quy tắc này dành cho thao tác sau và cho trường hợp ai đó thêm `emit`.
- Thêm thao tác thứ hai dùng mẫu này thì bắt buộc có test kiến trúc liệt kê mọi listener, để reviewer thấy khi có hook mới.

### 2.5 Phạm vi và fail-closed
- Thao tác chỉ đọc mà vẫn tính được (setLateCheckout, addPartyMember…) **giữ** giao dịch READ ONLY (A3). Chỉ dùng mẫu mô phỏng khi READ ONLY không làm được.
- Fail-closed (SEC-BE-21): khai `dryRun` trong hợp đồng làm guard bỏ `Idempotency-Key`/`If-Match`. Vì vậy handler chưa cài nhánh tính thử phải từ chối `dryRun: true` (422 `NOT_ALLOWED`).
  - Chốt này có trong `frontdesk.controller.ts` ở nhánh hợp đồng ARC.
  - BE-A gỡ chốt trong cùng PR cài `simulate`.
- Hiện chỉ controller B16 được dùng `uow.simulate` (có test).

## 3. Phương án đã cân nhắc
- **A. Giao dịch luôn ROLLBACK + `simulation_guard` (chọn)**
  - Ưu: một hàm, nên số tính thử bằng số ghi ngay từ cách dựng; DB bảo đảm không commit.
  - Nhược: giữ khóa dòng đơn/căn/folio khi tính (tối đa 1 s chờ khóa); chạy các câu ghi rồi bỏ.
- **B. Tách hàm tính chỉ đọc** (`planEarlyDeparture`) – không chọn. Phải mô phỏng `resyncStay` và đồng bộ `ota_collect`, thành hai đường tính dễ lệch.
- **C. SAVEPOINT trong `uow.run` rồi `ROLLBACK TO`** – bỏ. Cách này lẫn giao dịch có khóa idempotency, chỉ một nhánh trả kết quả là đã COMMIT.
- **D. Client tự tính** – bỏ. Vi phạm "không tính tiền ở client".

## 4. Hệ quả
- **Tốt**: hộp xác nhận B16 hiện đúng số sẽ ghi; không có công thức thứ hai; "không commit" do DB giữ.
- **Phải chấp nhận**:
  - **Khoảng trống id là bình thường.** Sequence không rollback, nên mỗi lần tính thử có thể tiêu `state_transition_id_seq`, `audit_event_id_seq`, `purge_journal_id_seq`…
    - Không kiểm soát nào được dựa vào id liên tục. SEC xác nhận: không có chuỗi băm audit. QA và báo cáo không được coi id nhảy là mất dữ liệu.
    - Bộ đếm chứng từ (`doc_sequence`) là bảng, nên nếu có cấp cũng bị rollback.
    - Đường B16 không cấp số bill hay mã yêu cầu duyệt, và không cấp số nào có ý nghĩa pháp lý hay hiện cho khách.
  - Tính thử khóa dòng đơn, đơn con, căn, folio (chặn đặt phòng vào căn đó trong lúc tính, tối đa 1 s). FE phải debounce ≥ 400 ms và hủy request cũ.
  - Mỗi bước có tác dụng ngoài giao dịch thêm vào `earlyDeparture` sau này phải theo mục 2.3–2.4.
- **Test bắt buộc** (đã có ở `be-a-v1.0.1`):
  1. **Ảnh chụp toàn tenant** thay cho danh sách bảng viết tay.
     - Lấy `count` + `md5` của mọi bảng có `organization_id`/`property_id` (72 bảng), so trước và sau `dryRun`. Loại trừ `simulation_guard`; không so giá trị sequence.
     - Dữ liệu mẫu có: đơn con gia hạn bị hủy hẳn; giấy tờ khách nước ngoài có ảnh (C3); phụ thu trả muộn của ngày đi cũ. Dùng cổng registration, guest-access và đơn con **thật**.
     - Không có SSE nào tới trong 500 ms.
     - Test tự chứng minh không mù: sau lần ghi thật thì ảnh chụp đổi.
  2. Tính thử và lần ghi ra cùng số trên oracle BR-428-01…06.
  3. Tính thử trả `version`/`ETag` đang lưu; đơn đổi giữa hai lần gọi → lần ghi 412.
  4. Lệch số → 409, không ghi; dùng lại cùng `Idempotency-Key` thì thành công.
  5. `simulate`:
     - (i) cờ dry trong `uow.run` → lỗi;
     - (ii) handler trả bình thường → không đổi gì;
     - (iii) ép COMMIT → lỗi trigger;
     - (iv) ROLLBACK lỗi → kết nối bị hủy.
  6. Bất biến thứ tự của mục 2.1 điểm 3.

## 5. Điều kiện xem lại và việc dời v1.1
- Thêm thao tác thứ hai cần mẫu này thì làm ba việc:
  - gom thành tiện ích chung;
  - thêm test kiến trúc "mọi operation có `meta.dryRun = true` đều có test ảnh chụp không để lại gì", áp cho cả các dry run READ ONLY;
  - thêm test liệt kê listener hook.
- p95 tính thử B16 > 300 ms, hoặc staging hay gặp `lock_timeout` → xem lại phương án B.
- Dời v1.1 (SEC đã chấp nhận rủi ro còn lại):
  - giới hạn tần suất `dryRun` theo người (SR-RL – SEC thêm dòng);
  - `previewToken` hoặc `childVersions` để lần ghi bắt được thay đổi trên **đơn con** giữa tính thử và ghi. Gia hạn thêm làm tăng `version` đơn chính nên đã bị 412 chặn; chỉ còn thao tác trực tiếp trên đơn con là lọt.
