# SEC review – BE-A bản vá v1.0.1 (tính thử B16 theo ADR-015 + giá niêm yết đã lên lịch)

- Người review: SEC | Round 3 – Review chéo (bản vá v1.0.1) | 27/10/2026
- Đọc tại nhánh `be-a-v1.0.1`, commit `5e966a5` (`git diff 22fe06d 5e966a5`, worktree `agent-aa7d925f78ba216d9`, chỉ đọc). Số dòng bên dưới theo commit này.
- Đã đọc:
  - báo cáo `rounds/round-03/outputs/BE/v1.0.1-be-a.md` (mục 2 trả lời thẻ SEC);
  - `db/database.ts`, `shared/http/unit-of-work.ts`, migration `0089_simulation_guard_room_price_cancel.sql`, `schema/infra.ts`;
  - `frontdesk.controller.ts`, `stay.service.ts` `earlyDeparture` (toàn hàm, gồm đoạn không đổi 1504–1690 chạy trong tính thử);
  - `rooms.service.ts`, `platform.controller.ts`, `registration.service.ts` `hasForeignGuestDocument`;
  - 3 file test mới: `b16-preview-v101.test.ts`, `rooms-scheduled-prices-v101.test.ts`, `be-a-v101-units.test.ts`.
- Đối chiếu thêm: `folio.service.ts`, `stay-waiver-alert.ts`, `events.service.ts`, `occupancy.service.ts` (SAVEPOINT), `reservation-hooks.ts` và các listener, `rate-limiter.ts`, OpenAPI 0.3.9 (`Room`, `cancelScheduledRoomListPrice`, `listAuditEvents`), `rbac-matrix.json` S25, `security-requirements.md` mục 13.
- Không chạy lại test (BE-A báo 3.300 test pass trên PostgreSQL 17). SEC tự chạy thử bộ lọc lệnh điều khiển giao dịch với 13 chuỗi biên (kết quả ở thẻ 01).

## Tóm tắt

| Mức | Số thẻ |
|---|---|
| Blocker | 0 |
| Major | 0 |
| Minor | 6 |
| Suggestion | 2 |

**Kết luận: SEC CHẤP NHẬN gộp phần cài đặt BE-A vào bản v1.0.1.** Điều kiện SEC đặt cho lệch mẫu A3 (thẻ 01, 02, 03, 06 của `SEC-on-ADR-015.md`) đã đáp ứng. Hai lệch BE-A tự nêu (SAVEPOINT trong simulate, `tx.db` không qua bộ lọc) SEC chấp nhận, kèm việc nhỏ ở thẻ 01–02.

Điều kiện gộp (đều là quy trình, không phải sửa mã của BE-A):
1. **Chạy lại test ảnh chụp 72 bảng (`b16-preview-v101.test.ts`) trên nhánh đã gộp cùng BE-B v1.0.1.** BE-B có thể đổi đường folio mà tính thử chạy qua (`resyncStay`, `reverseLine`, `postLines`). Test phải xanh sau khi gộp, không chỉ trên nhánh riêng.
2. ORC cấp lại số migration nếu BE-B cũng lấy `0089` (giả định 2 của BE-A). Đổi số không được đổi nội dung trigger.
3. ARC cập nhật lời văn ADR-015 trước phát hành 04/11: `simulation_guard`, ngoại lệ SAVEPOINT (thẻ 01), quy tắc hook (thẻ 03), khoảng trống id là bình thường.

Thẻ 01–04 nên làm ngay trong PR này nếu kịp (mỗi thẻ ước dưới nửa ngày). Không kịp thì dời v1.1, **không chặn gộp**. Thẻ 05–06 dời v1.1 được, SEC đã ghi rủi ro còn lại.

### Đối chiếu điều kiện SEC (thẻ ADR-015)

| Điều kiện | Kết quả SEC kiểm | Bằng chứng |
|---|---|---|
| 01.1 Kết nối riêng, không nhánh COMMIT, ROLLBACK trong `finally`, ROLLBACK lỗi → hủy kết nối | **Đạt** | `database.ts:155–193`: `pool.connect()` riêng, `BEGIN` → `SET_CONTEXT_SQL` (local) → chèn guard → `fn` → `finally { ROLLBACK }`, lỗi thì `release(true)`. `withContext` không đổi. Test đọc mã khẳng định không có chữ COMMIT (`be-a-v101-units.test.ts:72`). Test (iv) kiểm sự kiện `remove` của pool. |
| 01.2 Cờ ghép với giao dịch | **Đạt** | `stay.service.ts:1340–1345`: chế độ lấy từ `tx.ctx.simulation`; thân `dryRun` lệch chế độ thì ném lỗi trước khi đọc. `simulation` chỉ gắn ở `makeSimulationTx` (`database.ts:183`). `UnitOfWork.simulate` (`unit-of-work.ts:233`) chỉ nhận dry run đã khai báo, kiểm lại `enforced/allowed`. Test (i) đủ hai chiều. |
| 01.3 Chốt ở tầng DB | **Đạt** | Migration 0089 dòng 9–42: bảng RLS forced, `ottimo_app` chỉ INSERT (không DELETE/TRUNCATE nên không gỡ được dòng chặn), `CONSTRAINT TRIGGER … DEFERRABLE INITIALLY DEFERRED` luôn `RAISE`. Guard được chèn **trước** khi handler chạy. `SET CONSTRAINTS … IMMEDIATE` chỉ làm trigger nổ sớm (vẫn chặn). `session_replication_role` cần superuser. Test (iii) chứng minh DB từ chối commit với vai app. |
| 01.4 `tx.query` từ chối lệnh điều khiển | **Đạt, có lệch được chấp nhận** | `database.ts:220–241`. Lệch: cho SAVEPOINT/RELEASE/ROLLBACK TO. Xem thẻ 01. |
| 01.5 Test (i)–(iv) | **Đạt** | `b16-preview-v101.test.ts:821–927`. |
| 02 Trả version/ETag đang lưu | **Đạt** | `storedDto` đọc dưới khóa, trước lần ghi đầu (`stay.service.ts:1503`), qua cùng `dtoOf`/serializer. Controller đặt `ETag` từ `reservation.version` của bản đang lưu (`frontdesk.controller.ts:383–392`). Test: `etag = v0`, `version = v0` (dòng 380–381); đổi đơn giữa tính thử và ghi → 412 (dòng 617). |
| 03 "Không để lại gì" toàn tenant + SSE | **Đạt phần chính, còn 2 khoảng trống (thẻ 04)** | Ảnh chụp `count + md5` mọi bảng có `organization_id`/`property_id` (SEC đếm từ snapshot 0089: 72 bảng; 4 bảng ngoài diện: `config_parameter_def`, `dev_clock`, `organization` (đã so riêng), `rate_limit_counter`). Dữ liệu mẫu có đơn con bị hủy hẳn, hộ chiếu khách nước ngoài thật (C3 mã hóa), phụ thu trả muộn ngày cũ. LISTEN kênh SSE 500 ms không nhận gì. Có đối chứng: lần ghi thật thì có sự kiện. |
| 06 Chốt fail-closed có test | **Đạt** | Chốt 422 gỡ cùng PR cài `simulate` (đúng đề xuất). Test `dryRun: "true"` không header → không 200, ảnh chụp không đổi; HK → 403 (dòng 785–811). |

SEC lần theo đoạn mã không đổi chạy thật trong tính thử (`stay.service.ts:1504–1690`), không thấy tác dụng nào ra ngoài giao dịch:
- `occupancy.release/update`;
- `recordTransition`;
- `folios.resyncStay/onReservationVoided/reverseLine/postLines/balance`, `replaceLateCharge`;
- `stay-waiver-alert` → `events.notify/openAttention`.

Tất cả chỉ ghi bằng `tx.query`. `pg_notify` có tính giao dịch. Các `Map` trong folio/approvals/hooks chỉ là bộ đăng ký hoặc chỉ mục cục bộ, không phải cache bị đổi. `pool.connect()` chỉ có trong `db/database.ts` (ngoài `clock-store` của môi trường dev). Đường xóa DEK (`purgeImages` → `crypto.destroy`) và thu hồi link khách chỉ đi qua hook `transitioned`, mà hook này nằm **sau** điểm trả về của tính thử (`stay.service.ts:1751`).

### RBAC và audit phần giá đã lên lịch – Đạt

- `cancelScheduledRoomListPrice`: `x-roles [owner, manager]`, S25 trong rbac-matrix.
  - Test: FDL/FD/SAL/CTV → 403.
  - Khóa `room FOR UPDATE` trước khi xóa, `If-Match` = `room.version`, `version + 1` trong cùng giao dịch.
  - Thân `.strict()`; `assertNoCardNumber('reason')`.
  - Dòng ≤ ngày nghiệp vụ → 409; dòng duy nhất → 409. Xóa theo `id` dưới RLS, căn khác cơ sở → 404.
- `scheduledListPrices`: `x-visible-to [owner, manager]` sinh vào `openapi-schemas.ts` cho `Room` và phản hồi inline của `updateRoom`. Serializer mặc định từ chối nên vai khác **vắng** trường. Test kiểm `'scheduledListPrices' in r === false` cho FDL/FD/SAL/CTV trên `listRooms`.
- **Không lộ cho FD qua đường khác**:
  - `Room` chỉ trả ở 4 operation, 3 cái còn lại FD không gọi được.
  - SSE chỉ mang `{id}`.
  - Replay idempotency theo đúng người gọi.
  - `listAuditEvents` cho FD/FDL `x-scope own`, nên FD không đọc được audit `room.list_price_cancelled` của OWN/MGR.
  - FD **vẫn suy ra được** giá của ngày tương lai qua `quotes/calculate`. Đây là đúng thiết kế (lễ tân phải báo giá). Nó cũng khớp ý kiến SEC trước: giá niêm yết không phải tham số bảo mật, `x-visible-to` ở đây là phạm vi màn hình, không phải bí mật.
- Audit:
  - `config` `room.list_price_cancelled`: `before.listPrice` đủ hai giá và lý do cũ, `after.cancelledEffectiveFrom`, `reason`. Allowlist đã đăng ký. Test so nguyên dòng.
  - B16 ghi thêm `previewConfirmed` và hai số `expected*` (chỉ số, đã vào allowlist `reservation`).
  - Tính thử không ghi audit. Đúng: không có gì xảy ra. Lần 403 vẫn ghi `access.denied` ở guard.

---

## Thẻ feedback

### FB-R3-SEC-BE-A-01
- Mức độ: Minor
- Vị trí: `product/services/api/src/db/database.ts:220–241` (`SIMULATION_FORBIDDEN`, `makeSimulationTx`); `reservations/public/occupancy.service.ts:215–220`
- Vấn đề: BE-A lệch thẻ 01.4, vẫn cho SAVEPOINT/RELEASE/ROLLBACK TO trong tính thử. **SEC chấp nhận lệch này**, vì:
  - (a) dòng `simulation_guard` được chèn ở mức giao dịch gốc, **trước** khi handler chạy, nên không có savepoint nào tạo trước nó. `ROLLBACK TO` chỉ quay về savepoint của handler và không bỏ được sự kiện trigger đã xếp hàng của dòng guard;
  - (b) RELEASE và ROLLBACK TO không kết thúc được giao dịch gốc;
  - (c) cấm thì `occupancy.update` không bắt được 23P01.

  Còn hai điểm:
  - (1) Chưa có test nào khóa lập luận (a). Nếu sau này ai đó đổi thứ tự, chèn guard **sau** một savepoint hoặc bên trong handler, thì `ROLLBACK TO` sẽ xóa luôn chốt mà không test nào báo.
  - (2) Bộ lọc chỉ là lớp nhắc lập trình viên, **không phải ranh giới bảo mật**. SEC thử: `SELECT '--x'; COMMIT` lọt qua, vì bước bỏ chú thích cắt cả phần sau `--` nằm trong chuỗi. `set_config('app.property_id', …, false)` cũng lọt. Không có đường tiêm SQL (mọi câu đều tham số hóa), và chốt DB vẫn chặn commit, nên hiện không khai thác được.
- Vì sao quan trọng: an toàn của ngoại lệ SAVEPOINT dựa vào **thứ tự** "guard trước handler". Thứ tự đó cần được test giữ, không chỉ dựa vào chú thích.
- Đề xuất sửa:
  - Thêm test DB: trong `withContext`, chèn guard → `SAVEPOINT a` → ghi → `ROLLBACK TO SAVEPOINT a` → `RELEASE SAVEPOINT a` → kết thúc giao dịch thì phải lỗi `must never be committed`.
  - Thêm test đọc mã: trong `Database.simulate`, `INSERT INTO simulation_guard` đứng trước `fn(`.
  - Ghi vào chú thích `SIMULATION_FORBIDDEN`: "lớp nhắc; ranh giới là `simulation_guard`".
  - ARC ghi ngoại lệ SAVEPOINT và lý do (a)–(c) vào ADR-015 mục 2.
- Trạng thái: Open

### FB-R3-SEC-BE-A-02
- Mức độ: Minor
- Vị trí: `database.ts:231` (`db: inner.db` trên `tx` của simulate); `database.ts:183–193`
- Vấn đề: `tx.db` (drizzle) không qua bộ lọc lệnh. Hiện **0 chỗ** trong `src/modules` và `src/shared` dùng `tx.db` (SEC grep). Nhưng nếu sau này có code gọi `tx.db.transaction(...)` trong đường tính thử, drizzle sẽ gửi thẳng `begin`/`commit`/`rollback` lên kết nối:
  - `commit` → trigger guard từ chối, giao dịch bị hủy;
  - `rollback` (khi callback ném lỗi) → giao dịch gốc bị hủy, **dòng guard cũng mất**.

  Trong cả hai trường hợp, các câu lệnh sau đó chạy ở chế độ **tự commit**, không còn chốt. Hậu quả hiện bị chặn nhờ ngữ cảnh RLS đặt bằng `set_config(..., true)`: ngữ cảnh mất theo giao dịch, `app_current_property()` trả NULL, bảng tenant FORCE RLS thì không đọc và không ghi được. Nhưng đây là bảo vệ gián tiếp. `simulate` cũng không phát hiện được giao dịch đã bị kết thúc giữa chừng: `ROLLBACK` cuối chỉ ra cảnh báo "no transaction in progress", không ném lỗi.
- Vì sao quan trọng: thẻ 01 của ADR-015 đòi "không thể ghi thật trong giao dịch dry". Đường `tx.db` là lỗ duy nhất còn mở ở tầng mã, dù hiện chưa có ai đi qua.
- Đề xuất sửa (khoảng 10 dòng):
  - (a) Trong `makeSimulationTx`, đặt `db` là một Proxy luôn ném `'drizzle is not available inside a simulation (ADR-015)'`. Không ai đang dùng nên không vỡ gì.
  - (b) Ngay sau khi chèn guard, đọc `txid_current()`. Trước `ROLLBACK`, khi `fn` thành công, kiểm `txid_current_if_assigned()` vẫn bằng giá trị đó. Lệch thì ném lỗi 500 và ghi log `security`. Bắt được mọi cách kết thúc giao dịch lọt qua bộ lọc.
  - (c) Test: `tx.db` trong simulate → ném lỗi; ép kết thúc giao dịch bằng client thô → `simulate` ném lỗi.
- Trạng thái: Open

### FB-R3-SEC-BE-A-03
- Mức độ: Minor
- Vị trí: `stay.service.ts:1751` (điểm trả về của tính thử); `reservations/public/reservation-hooks.ts:338` (`emit`); `approvals.submit`, `audit.recordMoney`, `attachments.bindTo`; báo cáo BE-A mục 6 "Việc chưa xong" (thẻ 03 (4) chưa có test kiến trúc listener)
- Vấn đề: hiện tính thử an toàn vì **mọi** bước có tác dụng nặng nằm sau `if (dryRun) return`:
  - hook `transitioned` → `revokeAllForReservation`, `purgeImages` → `crypto.destroy`;
  - outbox;
  - `approvals.submit`, `audit.recordMoney`.

  Đây là kỷ luật thứ tự dòng trong một hàm dài 470 dòng. Ví dụ: một bản sửa sau này dời `hooks.emit` lên trước điểm trả về để "đơn con bị hủy cập nhật sớm". Khi đó tính thử sẽ chạy hook trong giao dịch rollback. DB vẫn rollback, nhưng phần nằm ngoài DB thì không: cache của listener mới, gọi HTTP. Test ảnh chụp không bắt được loại này. Danh sách listener viết tay (đề xuất 03 (4) cũ) cũng chỉ giúp người review nhìn thấy, không chặn được.
- Vì sao quan trọng: đây là chỗ nối giữa tính thử và các hook xóa dữ liệu C3, thu hồi quyền khách.
- Đề xuất sửa (thay cho test liệt kê listener): **fail-closed tại nguồn**. `ReservationHooks.emit`, `ApprovalService.submit`, `AuditService.recordMoney`, `AttachmentService.bindTo` ném `Error('… inside a simulation (ADR-015)')` khi `tx.ctx.simulation === true`. Bốn dòng `if`, cộng một test cho mỗi hàm. Khi đó quy tắc "hook phải đọc `tx.ctx.simulation`" (thẻ 03.4 cũ) không còn cần, vì hook không bao giờ chạy trong tính thử.
- Trạng thái: Open

### FB-R3-SEC-BE-A-04
- Mức độ: Minor
- Vị trí: báo cáo BE-A mục 6 (thẻ 03 (c), 03 (2)); `b16-preview-v101.test.ts:678`
- Vấn đề: hai khoảng trống test BE-A tự ghi:
  - (c) ảnh chụp toàn tenant chưa chạy với đơn OTA có `room_change_difference`. Đường này gọi `reverseLine`, có audit lồng và cập nhật FOC. SEC đọc thấy mọi thứ trong `tx`, nhưng là đường duy nhất trong B16 chưa có dữ liệu mẫu qua tính thử;
  - (2) chưa đếm `pool.connect()`. SEC chấp nhận thay bằng kiến trúc: pool chỉ được dùng trong `db/database.ts`, `withContext`/`simulate` đều chặn kết nối lồng.
- Vì sao quan trọng: test ảnh chụp chỉ mạnh khi dữ liệu mẫu đi qua mọi nhánh ghi.
- Đề xuất sửa:
  - (c) thêm một ca vào test ảnh chụp: đơn Agoda đã đổi phòng có chênh lệch B14, trả sớm qua đêm có chênh lệch → `cleanPreview`, rồi so số với lần ghi. Dùng lại fixture của `frontdesk-s3-fixes`.
  - (2) thêm test kiến trúc: `pool.connect`/`new Pool`/`new Client` chỉ xuất hiện trong `src/db/` và `events/internal/sse-hub.ts`.
  - Làm trong v1.0.1 nếu QA còn thời gian, không thì v1.1.
- Trạng thái: Open

### FB-R3-SEC-BE-A-05
- Mức độ: Minor
- Vị trí: `frontdesk.controller.ts:379–392`; `unit-of-work.ts:128–129`; `identity/public/rate-limiter.ts` (`RATE_RULES`); `security-requirements.md` mục 13
- Vấn đề: chưa giới hạn tần suất tính thử (thẻ 04b cũ). BE-A chờ SEC ra dòng SR-RL. Mỗi lần tính thử khóa đơn, đơn con, căn và folio, rồi **ghi thật** các dòng occupancy/folio, giữ khóa dòng tới lúc rollback. Hai điểm:
  - `lock_timeout` 1 s chỉ giới hạn thời gian **chờ**.
  - `statement_timeout` 5 s tính **từng câu**, không tính cả giao dịch. Một lần tính thử nhiều câu có thể giữ khóa lâu hơn 5 s.

  Rủi ro thấp: chỉ FD+ đã đăng nhập, 10 căn, có giới hạn chung SR-RL-09.
- Vì sao quan trọng: client lỗi (vòng gọi lại khi đổi ô nhập) hoặc người cố ý có thể làm nghẽn thu tiền, trả phòng của đúng căn đó ở giờ cao điểm.
- Đề xuất sửa: **SEC chốt dòng SR-RL-10** (SEC ghi vào `security-requirements.md` ở bước Phản hồi & sửa):

  | Mã | Mức | Đường | Ngưỡng | Theo | Khi |
  |---|---|---|---|---|---|
  | SR-RL-10 | B | Tính thử ghi-rồi-hủy (`uow.simulate`, hiện chỉ B16 `earlyDeparture` `dryRun`) | 30 lần/phút/người; vượt → `429 RATE_LIMITED` + `Retry-After` | người dùng | v1.1 |

  Ba lưu ý cài đặt:
  - Bộ đếm **RAM** (`RateLimiter`, thêm `earlyDepartureDryRunPerUser`) hoặc giao dịch riêng **trước** `uow.simulate`.
  - **Không** dùng `rate_limit_counter` bên trong `simulate`: bộ đếm sẽ bị rollback cùng giao dịch và không bao giờ tăng.
  - Đếm sau guard (đã xác thực), trước khi mở kết nối.

  SEC chấp nhận dời sang **v1.1**. Nếu BE-A làm luôn trong v1.0.1 thì càng tốt (khoảng 5 dòng + 1 test).

  Thêm (Suggestion): đo trên staging thời gian giữ khóa thực tế của một lần tính thử (p95, gắn vào việc đo của ADR mục 5). Nếu > 2 s, cân nhắc `transaction_timeout` (PostgreSQL 17); BE kiểm xem tham số này có hiệu lực khi đặt local trong giao dịch không.
- Trạng thái: Open

### FB-R3-SEC-BE-A-06
- Mức độ: Minor
- Vị trí: `stay.service.ts:1690–1699` (so `AMOUNT_CHANGED`); báo cáo BE-A mục 6 rủi ro 2 (thẻ 05 cũ, `previewToken` chưa làm)
- Vấn đề: lần ghi chỉ so hai số và `If-Match` của đơn **chính**. SEC kiểm phạm vi rủi ro còn lại:
  - `extend` (B13) tăng `version` của đơn chính ở cả nhánh trực tiếp lẫn OTA (`stay.service.ts:416–428`). Vậy trường hợp hay gặp nhất (gia hạn thêm giữa tính thử và ghi) đã bị 412 chặn.
  - Còn lọt: thao tác **trực tiếp trên đơn con** không đụng đơn chính, ví dụ đổi phòng hoặc thêm người trên đơn con. Khi đó `childBookings`/`droppedNights` lễ tân đã thấy có thể khác lần ghi mà không bị 409.
  - Server luôn tự tính tiền nên không có đường gian lận tiền. Rủi ro chỉ ở tính toàn vẹn của sự đồng ý (US-135).
- Vì sao quan trọng: ít gặp với 10 căn, nhưng là thao tác tiền có hậu quả hủy đơn con.
- Đề xuất sửa:
  - SEC chấp nhận dời `previewToken` sang **v1.1** (ARC quyết hình thức). Rủi ro còn lại ghi như trên.
  - Cách rẻ nhất cho v1.1 nếu ARC không muốn token: tính thử trả `childVersions` và lần ghi gửi lại. Server so với version các đơn con đang khóa, lệch → 409 `AMOUNT_CHANGED`.
  - FE-A v1.0.1: sau 409/412 luôn gọi lại tính thử và bắt lễ tân xác nhận lại (đúng hợp đồng 0.3.9).
- Trạng thái: Open

### FB-R3-SEC-BE-A-07
- Mức độ: Suggestion
- Vị trí: migration `0089_simulation_guard_room_price_cancel.sql:45` (`GRANT DELETE ON room_list_price TO ottimo_app`); `rooms.service.ts:318`
- Vấn đề: trước bản này, lịch sử giá niêm yết **không xóa được ở tầng DB** (app không có quyền DELETE). Giờ quyền DELETE mở cho cả bảng. Chỉ service kiểm "dòng chưa tới ngày, không phải dòng duy nhất". Bất kỳ đường mã nào sau này cũng xóa được dòng giá đã áp (lịch sử giá). Ảnh hưởng thấp: đơn và báo giá đã lưu giữ giá chụp (BR-006), mọi lần hủy có audit.
- Vì sao quan trọng: lịch sử giá là bằng chứng khi tranh chấp giá với khách hoặc nội bộ.
- Đề xuất: chọn một trong hai.
  - (a) Trigger `BEFORE DELETE ON room_list_price` từ chối dòng có `effective_from <= (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date`. Giới hạn lỏng theo ngày lịch, còn ngày nghiệp vụ chính xác vẫn do service kiểm.
  - (b) Test kiến trúc: `DELETE FROM room_list_price` chỉ được xuất hiện ở `rooms.service.ts`.

  v1.1 là được.
- Trạng thái: Open

### FB-R3-SEC-BE-A-08
- Mức độ: Suggestion
- Vị trí: `registration/internal/registration.service.ts:2931–2952`; `frontdesk/public/ports.ts` (`hasForeignGuestDocument?`); thẻ 07 cũ (chuyển ARC)
- Vấn đề / ý kiến:
  - (a) Khối JSDoc mới chen giữa chú thích cũ của `earliestVisaValidUntil` và hàm của nó, nên chú thích "never returned to a client, never logged" giờ nằm trên `hasForeignGuestDocument`. Chỉ là chú thích, nhưng nó mô tả quy tắc về dữ liệu giấy tờ, cần nằm đúng chỗ.
  - (b) Hàm đọc mới đúng tinh thần C3: chỉ `EXISTS` trên `is_foreigner`/`removed_at`, không giải mã, không cần `c3_access_log`, trả về một cờ boolean.
  - (c) Thẻ 07 cũ (`x-visible-to` cho `otaRetainedMaxVnd`/`droppedNights[].netVnd`) vẫn mở bên ARC. Không chặn BE-A, nhưng ARC cần chốt **trước khi FE-A phát hành hộp tính thử**. Nếu ARC thêm `x-visible-to`, serializer sẽ tự áp mà BE không phải sửa.
- Đề xuất: dời khối JSDoc lên trên đúng hàm. ORC nhắc ARC thẻ 07.
- Trạng thái: Open

---

## Điểm làm tốt (nên giữ)

- Cài **đủ bốn lớp** đúng như SEC yêu cầu, không rút gọn:
  - đường riêng không có COMMIT;
  - cờ lấy từ giao dịch;
  - chốt ở tầng DB;
  - bộ lọc lệnh.

  Bảng `simulation_guard` chỉ cho INSERT nên không có đường gỡ chốt từ vai app.
- Test ảnh chụp **sinh tự động từ catalog** (mọi bảng có cột tenant), không phải danh sách viết tay. Có đối chứng: lần ghi thật làm 6 bảng đổi, SSE có sự kiện. Dùng cổng registration/guest-access **thật** và hộ chiếu mã hóa thật, nên đường xóa DEK được kiểm thật chứ không giả.
- Báo cáo minh bạch: tự nêu hai lệch (SAVEPOINT, `tx.db`) và hai khoảng trống test thay vì báo "đã sửa hết". `409 AMOUNT_CHANGED` đặt đúng chỗ (sau `balance`, trước `approvals.submit`), rollback cả khóa idempotency, có test dùng lại cùng khóa.

## Ghi chú cho ORC

- Không có ESC. Mọi điểm thuộc quyền kỹ thuật của BE/ARC/SEC.
- SEC sẽ ghi vào `decision-log.md` và `security-requirements.md` ở bước Phản hồi & sửa (lần này không commit nên chưa ghi):
  - (1) chấp nhận lệch SAVEPOINT trong `simulate` (thẻ 01);
  - (2) SR-RL-10 (thẻ 05), dời v1.1;
  - (3) chấp nhận dời `previewToken` sang v1.1, rủi ro còn lại như thẻ 06.
- Thẻ 01–04 nên cùng PR. Nếu BE-A không kịp trước khi cắt v1.0.1, SEC đồng ý dời sang v1.1 với điều kiện chúng nằm trong `plan.md` của round kế tiếp.
