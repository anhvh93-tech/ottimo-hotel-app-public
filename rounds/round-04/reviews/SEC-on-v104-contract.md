# SEC trên hợp đồng OpenAPI 0.3.12-draft (P4-00)

- Người review: SEC | Round 4, đợt v1.0.4, bước **Review** | 04/11/2026
- Đối tượng: `origin/v104/arc-contract` @ `3320fb33`:
  - `product/docs/api/openapi.yaml`, đọc phần nhật ký 0.3.12 và các operation liên quan;
  - báo cáo `rounds/round-04/outputs/ARC/v1.0.4-contract-0.3.12.md`.
- Phạm vi: 5 điểm ORC hỏi. Không review lại (b), (c), (d), (h). Không sửa tệp nào khác. Không commit.

## Kết luận: ~~ĐỒNG Ý gộp~~ → ~~ĐỒNG Ý CÓ ĐIỀU KIỆN~~ (xem "Bổ sung 04/11": thẻ BEA-ARC-01 Major) → **ĐỒNG Ý gộp P4-00** cùng `15718861` (xem "Review commit 15718861 + 3ff7347e (04/11)" cuối tệp)

| Điểm | Kết quả | Chỗ trong `openapi.yaml` |
|---|---|---|
| (a) đúng chữ `SEC-on-v104-holds.md` mục 3 | **Đạt.** `confirmDeposit` có đủ các ý: SAL/CTV luôn 409; FD+ khi folio đã nhận > 0 đ **trước lần ghi này**, gồm cả `pending`; `existingPaymentId` thì không xét giờ nhận; tới khi nhận phòng, không trần giờ; folio chưa nhận gì thì theo AC4; thiếu cọc sau hạn chỉ MGR/OWN; audit `afterDeadline: true`. Câu cũ được gạch, không xóa. `recordPayment` có HOLDS-01 (409 cho người không có vai FD+, ví dụ `holdExpiredSales`), và `x-roles` của op này chỉ có thêm `sales_staff`, nên chữ "(SAL)" đúng phạm vi. Câu ARC thêm về J1 và `error.HOLD_EXPIRED_PAID` chỉ giải thích, không đổi nghĩa | `confirmDeposit` (op + `existingPaymentId`), `recordPayment`, `Reservation.allowedActions`, nhật ký (a) |
| EM-09 có V104-01 | **Đạt.** `setMyEmail` (1b) và `updateUser` (4b): 429 + `Retry-After`, tính theo người **được đổi**, mọi `via`, kiểm sau 422 và trước S2. **"Xóa email (`null`) không bao giờ bị chặn, nhưng vẫn được ghi và vẫn được đếm"** có ở cả mô tả và `x-rate-limit` của hai op | `setMyEmail`, `updateUser`, `RateLimited` |
| `x-self-data` thay D27 ở 6 chỗ | **Đạt.** Gồm `Me.email`, `setMyEmail` (thân yêu cầu + 200), `startMy2faSetup.otpauthUri`, `confirmMy2fa.recoveryCodes`, `regenerateMyRecoveryCodes.recoveryCodes`. `User.email` (OWN xem người khác) và `updateUser.email` **giữ** D27 + `x-visible-to: [owner]`, đúng. Generator từ chối `x-self-data` đi cùng `x-rbac-field`/`x-visible-to` hoặc nằm dưới cấp đầu. `selfData` sinh ra khớp 5/5 với `SELF_DATA_FIELDS` của BE-A. Trước khi BE-A rebase, phạm vi lộ không rộng hơn (ARC mục 1 (f)) | dòng `x-self-data` (6 chỗ) |
| (i) `ID_NUMBER_DETECTED` chỉ bật cùng tag guest-web | **Đạt.** Mô tả `createGuestRequest.note`, `updateOnlineCheckin.arrivalNote` và nhật ký (i) đều ghi "bật cùng tag với câu báo guest-web; không kịp thì sang v1.0.5 và server chưa trả mã này". Chỉ `field` + `code`, không lưu, không log. Phạm vi đúng **2 ô khách gõ**, không có `replyNote` hay `registration` | op `createGuestRequest`, `updateOnlineCheckin`, bảng mã trường |
| `refund.destination_carried` trong tập `money` | **Đạt.** Có trong `AuditEvent.action` (tập đóng `money`), chỉ mã yêu cầu cũ/mới. `money-actions.ts` khớp từng ký tự với `v104/be-refund-dest`. Mô tả `setRefundDestination` theo 6.3 + điều kiện SEC | `AuditEvent.action`, `setRefundDestination` |

## Ghi chú (Info, không chặn)

- **FB-R4-SEC-ARC-C0312-01**: dòng `ID_NUMBER_DETECTED` trong **bảng mã trường** (đầu tệp) liệt kê thêm `createGuestRequest.note`, `updateOnlineCheckin.arrivalNote` mà không kèm điều kiện "bật cùng tag guest-web". Mô tả op và nhật ký đã có điều kiện này, nên hợp đồng không sai. Thêm 4 chữ "(bật cùng tag guest-web)" vào ô đó để người chỉ đọc bảng không hiểu là đã bật. Người làm: ARC, khi tiện.
- Khi BE-A rebase (SEC-ARC-018-03 phần mã), SEC review lại test so `selfData` ↔ `SELF_DATA_FIELDS` trong PR-D. Không thuộc hợp đồng.

ESC mới: không.

---

## Bổ sung 04/11: thẻ BE-A FB-R4-BEA-ARC-01 (Major), **sửa kết luận ở trên**

**Kết luận đổi thành: ĐỒNG Ý CÓ ĐIỀU KIỆN.** Hợp đồng 0.3.12 chỉ vào `main` **cùng** commit sửa của BE-A, như ORC đã quyết. SEC phải review commit đó trước.

- **SEC đồng ý với BE-A: thẻ này là Major.**
  - Serializer hiện chỉ tra `SELF_DATA_FIELDS` khi mã D đã từ chối (`p.f && !rbacFieldAllows`). Bỏ D27 thì 5 thuộc tính `sd` không còn `f`, và nhánh tra danh sách không bao giờ chạy. Như vậy là **fail-open**: thuộc tính được trả cho mọi vai, ở bất kỳ phản hồi nào tham chiếu tới schema đó.
  - Ở dòng `x-self-data` phía trên, SEC đã nhận câu của ARC "không mở rộng phạm vi lộ" mà không tự kiểm đường đi trong serializer. Câu đó chỉ đúng **hôm nay**, nhờ các endpoint `/me*` chỉ trả về chính người gọi. Lớp chặn thứ hai mà SEC-ARC-018-03 muốn giữ đã mất.
- **Điều kiện cho commit sửa** (SEC review theo danh sách này):
  1. `propertyAllowed` dạng **fail-closed**: thuộc tính có `p.sd` chỉ được trả khi `<owner>.<key>` ∈ `SELF_DATA_FIELDS`. Không có thì bỏ, với mọi vai. Các kiểm `w`, `c3`, `g`, `v` vẫn chạy trước như cũ.
  2. Test bằng nhau `SELF_DATA_FIELDS` = `OPENAPI_SCHEMAS.selfData`. Giữ mảng ghim của 018-01 (thêm khóa phải có SEC review).
  3. **Thêm (SEC):** khóa `schema:Me.email` cho phép `Me` ở **mọi** chỗ tham chiếu. Fail-closed không chặn được trường hợp sau này có ai trả `Me` (hay một schema `sd` khác) từ một op không phải "của chính người gọi", ví dụ `listUsers`. Cần một kiểm cấu trúc ở generator hoặc test:
     - mọi schema có thuộc tính `x-self-data` chỉ được tham chiếu (trực tiếp hay gián tiếp) từ phản hồi của một **danh sách op cho phép**: `login`, `loginMfa`, `getMe`, các op `/v1/me*`;
     - op khác tham chiếu tới thì CI đỏ.
     - Người làm: ARC (generator) hoặc BE-A (test). ORC giao. Đây là điều kiện, cùng commit.
  4. Test âm: dựng một shape giả có thuộc tính `sd` với khóa **không** nằm trong `SELF_DATA_FIELDS` → serializer bỏ thuộc tính đó với mọi vai, kể cả OWN.
  5. ARC thêm câu BE-A đề xuất vào mục (f): "Serializer chỉ trả thuộc tính `x-self-data` khi khóa nằm trong `SELF_DATA_FIELDS` của BE; CI kiểm hai tập bằng nhau. Thêm `x-self-data` mà không cập nhật BE thì thuộc tính bị bỏ, không lộ."
- Các thẻ khác của BE-A:
  - **BEA-ARC-02**: SEC đồng ý. Bỏ cờ ở thân yêu cầu `setMyEmail` (hoặc generator báo lỗi khi `x-self-data` nằm trong `requestBody`). Mục (f) sửa "6 chỗ" thành "5 thuộc tính phản hồi".
  - **BEA-ARC-03**: SEC đồng ý. Thật ra (4b) trên `3320fb33` **đã có** câu `null`. Nếu BE-A đọc thấy thiếu thì ARC chép nguyên câu in đậm của (1b) cho đồng nhất.
  - **BEA-ARC-04**: việc của BE-A khi rebase. Không có ý kiến bảo mật.
- SEC chờ ORC báo SHA để review commit sửa, sau đó mới đổi sang "ĐỒNG Ý" cho lượt gộp.

---

## Review commit 15718861 + 3ff7347e (04/11)

- Người review: SEC | Round 4, v1.0.4, bước **Review** | 04/11/2026
- Đối tượng: `origin/v104/arc-contract` @ `15718861` (BE-A: `serializer.ts`, `field-policy.ts`, `test/serializer.test.ts`) và `3ff7347e` (ARC: `openapi.yaml` (f), `gen-openapi-meta.mjs`, `v1.0.4-contract-0.3.12.md` mục (f) và mục 8). Đối chiếu `BE-A-on-v104-contract.md`.
- SEC tự chạy trên `15718861` (checkout tạm, đã trả worktree về `main`):
  - `pnpm --filter @ottimo/api test serializer` → **25/25 xanh**;
  - `node scripts/gen-openapi-meta.mjs --check` → tệp sinh khớp hợp đồng. Chạy sinh lại cũng không đổi tệp nào;
  - `typecheck` chỉ báo lỗi do gói workspace chưa build trong worktree (`@ottimo/contracts`, `@ottimo/integrations`), không liên quan. CI run 41765079485 do ORC theo dõi.

### Kết luận: **ĐỒNG Ý gộp P4-00** (`3320fb33` … `15718861` vào `main` cùng một lượt)

Điều kiện kèm theo không chặn lượt gộp này. Chúng chặn **lượt gộp `v104/be-identity`** sau đó: thẻ C0312-01 bên dưới.

| ĐK | Kết quả | Bằng chứng |
|---|---|---|
| 1. `propertyAllowed` fail-closed | **Đạt.** Thứ tự: `w` → `c3` → `g` → `v` → `f` → `sd`. Thuộc tính có `sd` chỉ qua khi `${owner}.${key}` ∈ `SELF_DATA_FIELDS`. Thiếu owner (cấp sâu, phần tử mảng, `extra`) thì bị bỏ, với mọi vai. Mã D **không còn** ngoại lệ "dữ liệu của mình": `if (p.f && !rbacFieldAllows(...)) return false;` đứng riêng. `SELF_DATA_FIELDS` chỉ còn được tra ở đúng một chỗ này. | `serializer.ts` `propertyAllowed`, `walk` (`ref` → `schema:<Name>`, `serializeResponse` → `op:<id>`, `union` giữ owner cùng cấp, `array`/`object` con → `null`) |
| 2. Test `SELF_DATA_FIELDS` = `OPENAPI_SCHEMAS.selfData`, giữ mảng ghim | **Đạt.** Có hai test riêng: bằng mảng ghim 5 khóa (chú thích "thêm khóa phải có SEC review") và bằng `selfData` sinh ra. Thêm: khóa phải có tiền tố `schema:`/`op:`. Mỗi khóa là thuộc tính cấp đầu, `sd`, **không** `f`/`v`. Khóa `op:` phải thuộc op chỉ trả về chính người gọi. | `serializer.test.ts` "SEC 018-01 (a)", "SEC condition 2", "SEC 018-02", "every SELF_DATA_FIELDS key…" |
| 3. Kiểm cấu trúc tham chiếu | **Đạt.** Danh sách cho phép: `getMe`, `login`, `loginMfa` và op có path khớp `^/v1/me(/\|$)`. Regex không khớp nhầm `/v1/members`, `/v1/media`. Test duyệt **mọi** mã trạng thái của **mọi** op, theo `$ref` lồng nhau (`array`, `union`, thuộc tính, `extra`). Op ngoài danh sách chạm schema `sd` thì CI đỏ. Hai chốt chặt hơn yêu cầu: tập op dùng `Me` phải **đúng bằng** 3 op hiện nay (thêm một op `/v1/me*` mới trả `Me` cũng phải qua review), và **không** schema nào khác được nhúng schema `sd`. Có ca chứng minh bộ dò bắt được `Me` nằm sâu trong mảng. Thuộc tính `sd` inline ở op lạ không lọt: muốn trả thì phải vào `selfData` = danh sách ghim, mà test khóa `op:` buộc op đó thuộc danh sách cho phép. | "SEC condition 3", "SEC condition 3 (guard works)" |
| 4. Test âm 8 vai | **Đạt.** Một shape giả có `email` `sd`, chạy cho cả 8 vai, kể cả OWN. Bị bỏ khi owner là `op:listUsers`, khi owner là `schema:User`, khi không có owner, và khi dùng khóa kiểu cũ không tiền tố. Chỉ được trả khi owner là `op:setMyEmail` (khóa có trong danh sách). Có thêm test `sd` không vượt được `w`/`c3`/`g`/`v`, và test `Me.email` lồng dưới object khác không được trả. Các ca dương cũ vẫn xanh: mọi vai thấy email và mã 2FA của chính mình, C3 vẫn chặn khi op không có `x-c3-log`, `User.email` vẫn chỉ OWN. | "SEC condition 4 / FB-R4-BEA-ARC-01", "sd does not bypass w / c3 / g / v", "a nested Me.email…" |
| 5. Câu (f) của ARC | **Đạt.** `openapi.yaml` (f) có: "serializer chỉ trả thuộc tính `x-self-data` khi khóa nằm trong `SELF_DATA_FIELDS` của BE; CI kiểm hai tập … bằng nhau. Thuộc tính `sd` mà BE không nhận ra thì bị bỏ khỏi phản hồi, không bao giờ lộ". Ý trùng câu BE-A đề xuất. Báo cáo ARC (f) và mục 8 cũng ghi. BEA-ARC-02 xong: thân yêu cầu `setMyEmail` không còn cờ. Generator ném lỗi khi gặp `x-self-data` trong `requestBody`. Ghi "5 thuộc tính phản hồi". Hợp đồng có đúng 5 dòng `x-self-data`, tệp sinh có 5 cờ `sd`, khớp 5 khóa. | `openapi.yaml` dòng ~321–327; `gen-openapi-meta.mjs` `buildSchemas` |

**Đường nào trả `sd` ngoài danh sách?** SEC dò các đường sau, không thấy đường nào:
- `serializeResponse` chỉ được gọi từ `SerializeInterceptor`. Lượt phát lại idempotent cũng đi qua đây.
- `serializeSchema` và `serializeShape` hiện **không** có chỗ gọi nào trong `src/` (không SSE/outbox nào dùng).
- Các route `@Res({ passthrough: true })` (`getMe`, `login`…) vẫn qua interceptor.
- `login`/`loginMfa` (op public) vẫn có `ottimoAuth`, nên vẫn được lọc. `Me.email` ở đây là email của chính người vừa đăng nhập.
- Route `@PublicRoute` (`/health`, test-support) không trả schema `sd`.
- Phản hồi lỗi đi qua `ProblemFilter`, schema `Problem` không có `sd`.

Còn **một khe ở mức mã** (chưa có chỗ gọi nào), xem thẻ C0312-02.

### Thẻ mới

### FB-R4-SEC-BE-C0312-01
- Mức độ: Major (điều kiện gộp `v104/be-identity`, **không** chặn P4-00)
- Vị trí: `origin/v104/be-identity`, các tệp `serializer.ts`, `field-policy.ts`, `test/serializer.test.ts`
- Vấn đề: `be-identity` vẫn mang bản cũ: `if (p.f && !rbacFieldAllows) { if (!SELF_DATA_FIELDS.has(...)) return false; }`, không có nhánh `sd`. Test cũng là bản cũ. Hợp đồng 0.3.12 đã bỏ D27 ở 5 thuộc tính. Nếu khi rebase hoặc gộp mà bản của `be-identity` thắng ở cả mã lẫn test, serializer quay về **fail-open** và không test nào đỏ.
- Vì sao quan trọng: đây chính là lỗi FB-R4-BEA-ARC-01 quay lại một cách lặng lẽ, qua xung đột gộp.
- Đề xuất sửa: khi rebase `be-identity` lên `main` (đã có P4-00), lấy bản `15718861` cho cả 3 tệp, hoặc một bản rộng hơn vẫn giữ mọi test của nó. Trước khi gộp, `git diff main -- <3 tệp>` phải rỗng. Nếu có khác biệt thì SEC review phần khác biệt. ORC ghi điều này vào cổng gộp `be-identity`.
- Trạng thái: Open

### FB-R4-SEC-BE-C0312-02
- Mức độ: Minor
- Vị trí: `serializer.ts` `serializeSchema`. Test `serializer.test.ts` "nothing else is relaxed" (`ser('Me', me, ['housekeeping']).email` được trả).
- Vấn đề: `serializeSchema('Me', x, ctx)` đi qua `ref` → owner `schema:Me` → trả `email` cho bất kỳ `ctx`. Kiểm cấu trúc (ĐK 3) chỉ quét phản hồi op và schema nhúng nhau. Nó **không** bắt được một module SSE/outbox sau này gọi thẳng `serializeSchema('Me', <người khác>)`. Chú thích đầu tệp lại chỉ dẫn SSE/outbox dùng đúng hàm này. Hiện chưa có chỗ gọi nào, nên chưa lộ.
- Vì sao quan trọng: đúng kịch bản ĐK 3 muốn chặn ("trả `Me` từ chỗ không phải của chính người gọi"), chỉ là đi đường mã thay vì đường hợp đồng.
- Đề xuất sửa: chọn một trong hai cách.
  - `serializeSchema` ném lỗi, hoặc gọi `walk` với owner `null` (bỏ `sd`), khi schema có thuộc tính `sd`;
  - một test quét `src/` để không có lời gọi `serializeSchema`/`serializeShape` với schema `sd` hay owner `op:`/`schema:` tự đặt.
  Sửa ca test hiện tại theo cách đã chọn. Làm cùng lượt rebase `be-identity` hoặc ở v1.0.5.
- Trạng thái: Open

### Ghi chú (Info, không thẻ)
- Kiểm `requestBody` trong generator dùng `JSON.stringify(op.requestBody).includes('"x-self-data"')`, nên không theo `$ref`. Thân yêu cầu `$ref` tới `Me` sẽ không bị báo. Không lộ gì: serializer không đọc thân yêu cầu. ARC sửa khi tiện, bằng cách resolve `$ref` như `resolveComponent`.
- Báo cáo ARC (f), gạch đầu dòng cuối ("Hành vi máy chủ trước khi BE-A rebase … Không mở rộng phạm vi lộ dữ liệu") đã cũ: P4-00 vào `main` cùng `15718861`. ARC gạch câu này khi tiện. Hợp đồng không có câu đó.
- Sửa kết luận phần trên: dòng `x-self-data` trong bảng đầu tệp nay được bảo đảm bằng mã + test, không còn dựa vào câu "không mở rộng phạm vi lộ".

### Điểm làm tốt
- Fail-closed gọn: chỉ một điều kiện, chỉ dựng chuỗi khóa khi `p.sd` đúng. Owner có tiền tố, nên schema và op không thể trùng khóa.
- Kiểm cấu trúc chặt hơn yêu cầu (tập op dùng `Me` phải bằng đúng, cấm schema nhúng schema `sd`) và có ca chứng minh bộ dò hoạt động.
- Generator tự đếm `sd` ở mọi cấp và so với số khóa cấp đầu, nên cờ đặt sai chỗ làm build hỏng chứ không bị bỏ qua lặng lẽ.

ESC mới: không.
