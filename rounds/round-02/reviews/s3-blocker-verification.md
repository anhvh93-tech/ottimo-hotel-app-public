# Kiểm chéo đối kháng 7 Blocker Sprint 3 (ORC, workflow verify-s3-blockers, HEAD c8b83f3, 17/10/2026)

Mỗi Blocker có 1 người kiểm độc lập được giao nhiệm vụ BÁC BỎ tuyên bố 'đã sửa' (đọc code + test thật), sau đó 1 critic rà độ đầy đủ.

| Blocker | Bác bỏ? | Tin cậy | Số gap |
|---|---|---|---|
| SEC-BE-32 | CÓ | medium | 5 |
| FB-R2-SEC-OPS-03 | không | medium | 8 |
| DOM-BE-13 | CÓ | high | 6 |
| DOM-BE-14 | không | medium | 5 |
| ARC-S3-01 | không | medium | 6 |
| ARC-S3-02 | không | medium | 5 |
| ARC-S3-03 | CÓ | high | 6 |

## Critic

# Phản biện độ đầy đủ: 7 blocker Sprint 3 (HEAD c8b83f3)

Mã API ở c8b83f3 giống 229db99. Thư mục gốc là `/Users/anhvh/Desktop/hotel-app/product/services/api/`.

## 0. Ba điểm chung mà cả 7 bản kiểm chéo bỏ sót

1. **Gap "chưa chạy được test DB, chỉ có báo cáo tự khai" không còn đúng.** Gap này có ở ARC-S3-01, ARC-S3-02 và DOM-BE-14.
   - Ở HEAD, CI run 38980363276, job 117239532654 ("format · lint · audit · test · build", chạy với PostgreSQL thật) xanh: `Tests 2119 passed (2119)`.
   - Các tệp được dẫn đều xanh: payments-s3.test.ts (35 test), registration-flow.test.ts (12), frontdesk-s3-fixes.test.ts (10), files-attachments.test.ts (9).
   - Nên bỏ gap này. Độ tin cậy của các mục refuted=false có thể nâng lên.
2. **Working tree có WIP chưa commit: 57 tệp, +1286 dòng.** Đây là các bản sửa lỗi QA BUG-R2-031/036/037/041/043/046/047/052, nằm trong đúng các module đang xét: retention, registration, folio, reservations, stay, auth.guard.
   - Tôi đã đối chiếu: WIP không đụng tới các điểm bị bác bỏ. `syncOtaCollect` giữ nguyên, `src/http.ts` không đổi, nhánh 2a của J16 vẫn đòi `stay_ended_at IS NOT NULL`.
   - Phải commit hoặc chốt WIP trước khi giao lại việc, nếu không sẽ xung đột.
3. **Bước E2E của CI ở HEAD đỏ 28 ca**, tất cả vì `403 DEVICE_NOT_TRUSTED` (stack E2E chưa cấp máy tin cậy).
   - Trong số đó có TC-L3-060/061/062 "xóa ảnh giấy tờ theo hạn" và SEC-C3.
   - Vì vậy SEC-BE-32 chưa có xác nhận đầu-cuối nào.

## 1. Đánh giá từng mục

### SEC-BE-32: đồng ý refuted=true, vẫn là Blocker
Lý do giữ mức Blocker mạnh hơn lý do bản kiểm chéo nêu.
- Thẻ gốc, đề xuất (2), yêu cầu J16 tự bắt ca sót theo trạng thái đơn `checked_out/cancelled/no_show` quá 7 ngày. Mục C5 trong danh mục bảo mật được đánh dấu [CHẶN].
- BE-C lại cho J16 dựa vào `stay_ended_at`. Cột này chỉ được ghi ở `registration.service.ts:996`, tức là ghi từ chính hook mà J16 phải chạy dự phòng. Hook không chạy thì J16 cũng không bắt được. Như vậy lưới an toàn không độc lập.

| Gap | Thật hay suy đoán | Mức |
|---|---|---|
| Dữ liệu trước 0053 nằm mãi | Thật. `0053:24` chỉ ADD COLUMN, không backfill; nhánh 2a ở `retention.service.ts:118-126` đòi NOT NULL. Sửa được rẻ vì `registration.actual_checkout_at` đã có từ trước 0053. Hiện chưa môi trường nào giữ dữ liệu thật. | Blocker (gộp với lỗi J16 không độc lập) |
| Nhánh 2a không có test | Thật | Major |
| Không test qua endpoint trả phòng/hủy thật | Thật. Test frontdesk dùng port giả, E2E thì đang đỏ. | Major |
| Chỉ phủ trạng thái `sent` | Thật, nhưng các trạng thái khác đi cùng nhánh code | Minor |
| `needs_update` sau trả phòng | Chưa chứng minh được là API cho thêm giấy tờ sau khi trả phòng | Suy đoán, cần BE-C xác minh |

### FB-R2-SEC-OPS-03: đồng ý refuted=false
- Phần kiểm Caddy trên CI đủ chặt. Tôi đề xuất trạng thái "Đã sửa, chờ smoke trên staging", vì thẻ chỉ chặn việc deploy staging.
- Tất cả gap đều là Minor, thuộc loại làm chặt test:
  - regex Referrer và CSP còn lỏng;
  - ca xóa header không thể fail;
  - không có kiểm tự động việc volume không mount vào web;
  - probe `.map` không chứng minh được gì;
  - log cổng 80 chưa được test.
- Riêng gap "thứ tự handle của Caddy" là **suy đoán**: nếu `/v1` bị đẩy lên trước thì ca 413 đã bắt được.

### DOM-BE-13: đồng ý refuted=true, Blocker thật
Bằng chứng mạnh. Tôi đã tự kiểm lại các điểm sau:
- `syncOtaCollect` lọc `live` chỉ theo `folio_id`;
- đơn con gọi `money.resynced` ở `reservations.service.ts:1767`;
- B13 bỏ resync đơn OTA ở `stay.service.ts:418`;
- bill lấy `otaNet` làm giá trị dự phòng ở `bill.service.ts:150`.

| Gap | Thật hay suy đoán | Mức |
|---|---|---|
| Đơn con (B13 / E05-11 / B9a) đảo khoản `ota_collect` của đơn cha | Thật | Blocker |
| `extra_person` nằm trong `OTA_COVERED` (`folio.service.ts:43`) | Thật. Trái BR-110 (đơn OTA chỉ thu phần người vượt số khách OTA, thu tại quầy) và BR-307 ("Đã thu qua OTA" = tiền phòng). Quầy thu thiếu mà không ai biết. | Blocker |
| Bill dùng `otaNet` khi thiếu khoản thu | Thật. Che mất lỗi. | Major |
| Đơn trước 0042 không được backfill | Thật, nhưng chưa có dữ liệu thật | Minor |
| Không có test B18 cho đơn OTA ở tầng tích hợp | Thật. Đây là test (d) của chính thẻ. | Major |

### DOM-BE-14: đồng ý refuted=false
- Gap "test không chạy" đã được CI giải quyết (xem mục 0).
- **Thiếu test B16 → B18 qua endpoint thật**: thật, mức Major. Đây là nghiệm thu (d) "đúng 1 yêu cầu" của thẻ; test hiện có tạo yêu cầu hoàn bằng tay.
- **Hủy đơn B10 sinh yêu cầu hoàn trùng**: thật, mức Major. Tiền không bị chi hai lần nhờ trần chi ở payOut (`refunds.service.ts:484`), nhưng quản lý vẫn thấy hai yêu cầu để duyệt. Nên mở thẻ mới.
- Race giữa B18 và yêu cầu hoàn tay: Minor.
- Ghi chuyển khoản thành `card_pos` để đi vòng chặn đối soát: Minor, đúng theo đặc tả, đưa vào phạm vi đối soát Round 3.

### ARC-S3-01: đồng ý refuted=false cho cơ chế đảo dòng, nhưng thẻ mới sửa một phần
- **Lỗi thứ hai của thẻ, `extraCount`, vẫn còn**: thật, mức Major. `folio.service.ts:1119` ghi `extra_guest x${stay.extraGuestCount}` lấy từ snapshot, nên bill in "Phụ thu 0 người" kèm 150.000.
- Đơn OTA gia hạn trước, thêm người sau thì đơn con mất phụ thu: thật, Major, nên mở thẻ mới.
- `effectiveFrom` nhận ngày tương lai: thật, Major (thu thừa của khách). `party.service.ts:214` chỉ chặn ngày nhỏ hơn hôm nay.
- B17 không xóa mức phụ thu riêng: có khả năng thật nhưng là ca biên, Minor.
- Thiếu test ARC đã yêu cầu ("thêm trẻ có phụ thu rồi gia hạn", đổi phòng B14, trả sớm B16): Major về mặt test.
- Migration 0031 không backfill: suy đoán, vì chưa có dữ liệu thật.

### ARC-S3-02: đồng ý refuted=false
- Thiếu test riêng cho J1: Minor.
- `confirmDeposit` nhận id của dòng đảo (`deposits.service.ts:163`): thật, nhưng Minor, vì `depositPaid` vẫn chặn được số tiền.
- Hold có tiền nhưng ghi sai loại `charge` nên J1 vẫn hủy: thật, Major, khác gốc, nên mở thẻ mới.
- `depositPaid` không trừ khoản đã hoàn, và yêu cầu hoàn không bị chặn khi đơn đang hold: thật, Major, nên mở thẻ mới.

### ARC-S3-03: nên tách kết luận
- **Kịch bản gốc đã đóng**:
  - multipart gửi tới route khác bị trả 415 (`src/http.ts:94-97`);
  - `requestHash` từ chối Buffer;
  - các test này xanh trên CI.
- **Vector mới là thật.** Tôi đã kiểm:
  - `src/http.ts:70` chỉ khớp định dạng cookie, không kiểm phiên thật;
  - `src/http.ts:103-122` đệm toàn bộ thân vào RAM trước khi tới guard;
  - cổng 4 upload (`upload-gate.ts`) nằm trong controller, tức là sau khi thân đã đệm xong;
  - container api `mem_limit 1g`, `restart: unless-stopped`.
- Hậu quả giống hệt thẻ gốc (đánh sập api) và **không cần đăng nhập**. Chú thích ở `upload-gate.ts:3` nói sai.
- Đề xuất: **Blocker trước khi deploy staging**, mở dưới thẻ FB-R2-ARC-BE-S3-18 / SEC-BE-47 hoặc một thẻ mới. Đóng S3-03 gốc.

## 2. Mục nào bị kiểm hời hợt
- **ARC-S3-01, ARC-S3-02, DOM-BE-14**: không xem CI nên tự hạ độ tin cậy. Kết luận đúng, nhưng thiếu bằng chứng sẵn có.
- **SEC-BE-32**: không đối chiếu với đề xuất (2) của thẻ gốc (J16 phải độc lập với hook). Không phát hiện E2E TC-L3-060..062 đang đỏ.
- **ARC-S3-03**: bằng chứng chắc, nhưng gán sai phạm vi. Kịch bản gốc đã đóng; cái còn lại là cổng giới hạn đồng thời (S3-18) không có hiệu lực.
- **DOM-BE-13 và SEC-OPS-03**: kỹ, không có gì phải bổ sung.

## 3. Việc cần giao lại
(Commit hoặc chốt WIP trước khi giao.)

| Vai | Việc | File |
|---|---|---|
| BE-B (+DOM chốt quy tắc) | (1) `syncOtaCollect` chỉ xử lý khoản `ota_collect` của chính đơn (lọc theo `reservation_id`); đơn con trực tiếp không được đụng khoản của đơn cha. (2) Bỏ `extra_person` khỏi `OTA_COVERED`, sau khi DOM xác nhận theo BR-110. (3) Bill không lấy `otaNet` làm giá trị dự phòng. (4) Test tích hợp đi qua POST /reservations kênh Agoda, gồm các ca: B13 gia hạn, E05-11, B9a, thêm người giữa kỳ, rồi B18. | `src/modules/folio/public/folio.service.ts` (43, 953-1010), `src/modules/folio/internal/bill.service.ts:150`, `test/integration/payments-s3.test.ts`, `frontdesk-stay.test.ts` |
| BE-C (+SEC review) | (1) Nhánh 2a của J16 xét trạng thái đơn `checked_out/cancelled/no_show` quá 7 ngày, không dựa vào `stay_ended_at`; hoặc thêm migration 0054 backfill từ `actual_checkout_at` và ngày hủy/no-show. (2) Sửa chú thích ở `retention.service.ts:118` và nội dung phản hồi. (3) Test: 2a với `stay_ended_at` NULL; ảnh thêm sau khi trả phòng; trả phòng qua endpoint thật; trạng thái pre/partial/review/scanned và no_show. (4) Xác minh ca `needs_update`. | `src/modules/registration/internal/retention.service.ts`, `src/db/migrations/0054_*.sql`, `test/integration/registration-flow.test.ts`, `rounds/round-02/responses/s3-BE-C.md` |
| BE-C (+ARC/SEC, OPS tùy chọn) | (1) Giữ chỗ trong cổng upload ngay ở `readMultipart`, trước khi đọc thân (vượt mức trả 503 và hủy luồng), và/hoặc kiểm phiên thật ở hook `onRequest` cho 3 route multipart. (2) Bỏ bản sao kép khi `Buffer.concat`. (3) Sửa chú thích ở `upload-gate.ts:3`. (4) Test: cookie đúng định dạng nhưng giả; 5 upload đồng thời; hồi quy bộ nhớ. | `src/http.ts`, `src/modules/files/public/upload-gate.ts`, `test/integration/files-attachments.test.ts`, `infra/caddy/Caddyfile.prod` |
| BE-A | (1) Ghi `extraCount` đúng theo từng đêm, hoặc đổi nhãn để không in "0 người". (2) Đồng bộ phụ thu sang đơn con khi đổi số người ở đơn cha. (3) Chặn `effectiveFrom` ngày tương lai, hoặc tính theo người có mặt từng đêm. (4) Thêm test trẻ có phụ thu, B14 và B16 sau khi thêm người giữa kỳ. | `src/modules/frontdesk/internal/party.service.ts`, `src/modules/folio/public/folio.service.ts:1119`, `src/modules/reservations/internal/reservations.service.ts`, `test/integration/frontdesk-s3-fixes.test.ts` |
| BE-B | Mở thẻ Major mới: (1) B10 hủy đơn phải trừ các yêu cầu hoàn đang mở; (2) `depositPaid` trừ khoản đã hoàn, chặn yêu cầu hoàn khi đơn đang hold; (3) khoản thu sai loại trên hold. Thêm test B16 → B18 qua endpoint thật và test J1 với cọc bị đảo. | `src/modules/reservations/internal/reservations.service.ts` (2235-2355), `src/modules/folio/public/folio.service.ts:514`, `src/modules/payments/internal/refunds.service.ts:140`, `src/modules/payments/internal/deposits.service.ts:163` |
| QA + OPS | Sửa phần cấp máy tin cậy trong stack E2E (`DEVICE_NOT_TRUSTED`), chạy lại để TC-L3-060..062 và SEC-C3 xanh. | `.github/workflows/ci.yml` (bước seed/compose), seed E2E |
| OPS | Làm chặt test (Minor): neo regex Referrer và CSP, request thử có Cookie/Authorization, kiểm volume `blobdata` không nằm trong service web. Chạy smoke staging khi có VPS. | `product/infra/ci/check-caddy-prod.sh`, `product/infra/server/deploy.sh` |

## Chi tiết từng mục

### SEC-BE-32
- Bằng chứng: Phần sửa cho dữ liệu mới đứng vững: registration.service.ts:975-1011 (scheduleAfterStay: khai báo chưa confirmed thì delete_after = LEAST(..., hết lưu trú + id_image_unconfirmed_max_days) cho mọi ảnh còn sống, ghi stay_ended_at), :1698-1711 (onCheckedOut gọi scheduleAfterStay với mọi trạng thái), :1804-1813 (onReservationVoided: trạng thái không VOIDABLE như sent vẫn hẹn xóa). Đường thật đã nối: checkout.service.ts:572 gọi ports.registration.onCheckedOut; registration.module.ts:64-67 cho hook cancelled/no_show; RegistrationModule có @Global nên FD_REGISTRATION_PORT không rơi về UnwiredRegistrationPort. J16 tại retention.service.ts:105-113 xóa ảnh đến hạn với reason 'unconfirmed' và bỏ qua legal_hold. Test registration-flow.test.ts:792 'SEC BE-32: a declaration never confirmed – images go 7 days after the stay ended (checkout / cancel), legal hold keeps them' kiểm trả phòng và hủy đơn khi khai báo đang sent, mốc ngày 7 trừ/cộng 1 phút, purge_journal destroy_dek + delete_blob, c3_access_log purge, tệp mất, legal_hold giữ ảnh, 2 mục 'Cần chú ý'. Phản bác: phản hồi BE-C và chú thích retention.service.ts:114 nói nhánh 2a bắt 'dữ liệu trước 0053', nhưng 0053_retention_hardening_be_c.sql:24 chỉ ADD COLUMN stay_ended_at, không backfill, nên mọi dòng có trước đều NULL. Chỗ duy nhất ghi cột này là registration.service.ts:977. Truy vấn 2a (retention.service.ts:115-123) lại đòi 'x.stay_ended_at IS NOT NULL', nên không bao giờ khớp dữ liệu cũ.
- Gap:
  - Kịch bản lỗi vẫn còn: một DB đã chạy migration tới 0052, có đơn đã trả phòng (hoặc đã hủy/no-show) trong khi khai báo đang sent/scanned/review/partial/pre. Ảnh của đơn này có delete_after NULL và stay_ended_at NULL. Sau khi áp 0053: nhánh due không khớp (delete_after NULL), nhánh 2a không khớp (stay_ended_at NULL), T01 không khớp (trạng thái không phải void/confirmed). onCheckedOut cũng không chạy lại, nên ảnh hộ chiếu/CCCD nằm vô thời hạn. Đây đúng là kịch bản gốc của thẻ, và phản hồi tuyên bố sai rằng J16 đã bao trường hợp này.
  - Nhánh 2a (stale) của J16 không có test nào. Test BE-32 chỉ dựng dữ liệu mới, chạy trên DB tạo mới ottimo_test_bec, nên không kiểm được dữ liệu trước 0053 cũng như ảnh thêm sau khi trả phòng.
  - Test gọi thẳng port.onCheckedOut và port.onReservationVoided sau setStayStatus, không đi qua endpoint check-out thật (checkout.service.ts:572) hay luồng hủy đơn thật qua hook transitioned. Các test frontdesk lại dùng port giả (frontdesk-stay.test.ts:68, frontdesk-s3-fixes.test.ts:73). Vì vậy chưa có test đầu-cuối chứng minh trả phòng thật làm ảnh có hạn xóa.
  - Test chỉ phủ trạng thái sent. Chưa có ca nào trả phòng khi khai báo ở pre/partial/review/scanned, cũng chưa có ca no_show khi sent, dù về code các trạng thái này đi cùng nhánh.
  - Kịch bản phụ, ngoài đúng phạm vi 'chưa từng confirmed': sau khi trả phòng, lễ tân thêm giấy tờ cho một người vào khai báo đã confirmed. Khai báo chuyển sang needs_update (K9). Nếu đồng ý P02b đã được ghi trước theo person_index thì ảnh mới có delete_after NULL. Nhánh 2a loại trạng thái needs_update, T01 bỏ qua vì đồng ý là granted, nên ảnh chỉ có hạn khi khai báo được K7 xác nhận lại; nếu lễ tân không bao giờ bấm thì ảnh ở lại mãi.

### FB-R2-SEC-OPS-03
- Bằng chứng: Code ở HEAD c8b83f3 (thư mục product/infra và .github giống hệt 229db99, git diff rỗng):
- CSP: product/infra/caddy/Caddyfile.prod:132 đặt `header ?Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' blob: data:; ... worker-src {args[3]}; frame-ancestors 'none'; base-uri 'none'; form-action 'self'; object-src 'none'"`, không có unsafe-*. Host guest dùng worker-src 'none' (:213). API không tự gửi CSP lỏng hơn: chỉ có `sandbox; default-src 'none'` ở registration.controller.ts:294 và attachments.controller.ts:131, và không dùng helmet.
- Referrer-Policy: Caddyfile.prod:133 và :213 (guest-web nhận no-referrer, index.html no-store). Lớp thứ hai là thẻ meta referrer no-referrer ở apps/guest-web/index.html:7.
- Che log: Caddyfile.prod:62-71 (access log) và :38-46 (log default) thay `?.*` thành `?[q]` và `^/g/.*$` thành `/g/[redacted]`, xóa toàn bộ header request và response. Token chỉ nằm ở path `/g/<token>`: link được dựng ở guest-portal.service.ts:153 và guest-web chỉ chấp nhận `^/g/…` (link.ts:13). Không đường /v1 nào chứa token (openapi.yaml:6791-7247).
- Volume blob: docker-compose.prod.yml:141-142 (api), :163-165 (worker), web :189-192 chỉ mount Caddyfile và volume chứng chỉ. docker-compose.yml dev: web :159-160 không có blobdata. BLOBSTORE_LOCAL_PATH là đường dẫn tuyệt đối (prod :60).
- Test: product/infra/ci/check-caddy-prod.sh, gọi từ .github/workflows/ci.yml:237-242 ở bước "Production compose config + Caddyfile.prod (headers, probes, body limit, log masking)" trong job docker-build, chạy cho cả PR lẫn push. Bước này XANH trên CI run 38980363276 (job 117240884612, HEAD c8b83f3). Log in 45 dòng ok, trong đó có: "g.localhost CSP", "g.localhost Referrer-Policy no-referrer", "g.localhost Cache-Control no-store", "/var/lib/ottimo/blobs/00/0000 404", "/blobs/x 404" cho cả 3 host, "no /g/ token in the Caddy log", "access log shows /g/[redacted]", rồi "OK: Caddyfile.prod headers, probes, body limit and log masking". Ca log làm đúng cả hai chiều: request `/g/$token?utm=$token` phải không còn token trong log, và log phải có dòng `"uri":"/g/[redacted]"`, nên test không đậu nhờ log bị tắt. Run này đỏ ở bước E2E (28 ca fail, dùng compose dev), không liên quan Caddyfile.prod. Ở commit phản hồi 229db99 (run 38940900970), job docker-build bị skip vì build-test đỏ lint, nên HEAD là lần đầu bước kiểm này thực sự chạy trên CI.
- Không tìm được kịch bản nào ở HEAD làm lỗi gốc xảy ra lại: thiếu CSP, token /g/ hoặc query lọt vào log Caddy, guest thiếu no-referrer, hay web mount blob.
- Gap:
  - Kiểm Referrer-Policy chỉ khớp tiền tố (check-caddy-prod.sh:52 và deploy.sh:121 dùng regex `^referrer-policy: no-referrer`). Nếu ai đổi Caddyfile.prod:213 thành `no-referrer-when-downgrade`, header này để lộ URL /g/<token> qua Referer mà test vẫn xanh. Hiện còn thẻ meta ở guest-web/index.html:7 che lại, nhưng không test nào kiểm thẻ meta đó.
  - Ca 'no request headers in the access log' (check-caddy-prod.sh:71) không thể fail: request thử ở dòng 66 không gửi Cookie hay Authorization, nên dù xóa dòng `request>headers delete` (Caddyfile.prod:68) thì grep `"(Cookie|Authorization)"` vẫn không thấy gì. Việc xóa header, gồm Referer và cookie phiên, thực tế chưa được test.
  - Cam kết 'volume blob không mount vào web' không có kiểm tự động nào. CI chỉ chạy `docker compose config --quiet` (ci.yml:239-241). Probe /var/lib/ottimo/blobs/… ra 404 là nhờ regex @hidden và `root /srv/...` của Caddy, dù volume có mount hay không. Thêm `blobdata` vào service web thì CI vẫn xanh.
  - Probe `.map` dùng `/assets/index.js.map`, tệp này không tồn tại, nên file_server trả 404 dù @hidden có hoạt động hay không. Ca này không chứng minh được rằng source map thật dưới /assets bị chặn. Hiện các app build với sourcemap=false nên chưa có rủi ro thật.
  - Regex CSP trong test có `.*` ở giữa và không neo cuối chuỗi (check-caddy-prod.sh:49). Chèn thêm nguồn ngoài như `script-src-elem https://x` hoặc bỏ `object-src 'none'` thì test vẫn xanh. Test chỉ chặn chuỗi `unsafe-`.
  - Test chỉ chạy trên cổng 443 (CI publish mỗi 443), chưa kiểm log của server chuyển hướng HTTP→HTTPS cổng 80 với `http://g.host/g/<token>`. Theo phân tích cấu hình thì vẫn qua bộ lọc của log default, nhưng chưa có test.
  - Bước kiểm nằm trong job docker-build, job này `needs: build-test`. Hễ build-test đỏ là bước kiểm Caddy bị skip, như đã xảy ra ở 229db99. Smoke trên staging thật (deploy.sh:113-143) chưa chạy lần nào vì chưa có VPS, nên điều kiện 'SEC kiểm lại trên staging' của thẻ vẫn còn mở.
  - Thứ tự `handle` (@hidden và @too_big_other đứng trước /assets/* và /v1/*) phụ thuộc vào thuật toán sắp xếp của Caddy, vốn không có tính bắc cầu giữa matcher path và matcher có tên. Hiện khối site có đúng 20 route nên Go chỉ chạy insertion sort. Thêm một directive nữa có thể làm đổi thứ tự. Ca 413 sẽ bắt được nếu /v1 bị đẩy lên trước, nhưng probe .map thì không.

### DOM-BE-13
- Bằng chứng: Bác bỏ: chỉ cần đơn OTA trả trước có thêm một đơn con (đêm thêm) là lỗi gốc quay lại.

Chuỗi gây lỗi trong code ở HEAD 229db99:
(1) Đơn con dùng chung folio với đơn OTA nhưng là đơn trực tiếp.
- reservations.service.ts:1609-1613 (chú thích "on the same room and the SAME folio (parent's)") và :1674-1677: đơn con ghi `payment_model='direct'`, `folio_id = parent.folio_id`.
- Đơn con được tạo ở ba chỗ, không chỗ nào đồng bộ lại đơn cha sau đó:
  • B13 gia hạn đơn OTA: stay.service.ts:302-316. Ở dòng 418, `if (row.channel_group !== 'ota' ...)` bỏ qua resync đơn cha.
  • B9a nhận phòng sớm: checkin.service.ts:628-637.
  • E05-11 thêm đêm lúc trả phòng: checkout.service.ts:592-602, ngay trong giao dịch B18.
(2) Ngay sau khi tạo, đơn con được đồng bộ folio: reservations.service.ts:1767-1772 gọi `money.resynced(confirmedStay(child))`, với `paymentModel = 'direct'` (dòng 1013).
(3) Cuối `syncStay`, folio.service.ts:1138 gọi `syncOtaCollect(tx, folio.id, child.id, 'direct')`.
(4) Trong `syncOtaCollect` (folio.service.ts:961-1004):
- Truy vấn `live` chỉ lọc theo `folio_id` + `provider='ota_system'`, không lọc theo đơn, nên lấy được khoản `ota_collect` của đơn CHA.
- Dòng 968: `covered = false` (vì 'direct'), nên `target = 0`.
- Kết quả: đảo khoản OTA 1.800.000 của đơn cha và không ghi khoản mới.
(5) B18 ở checkout.service.ts:405-407 đọc `balance()` và trả `BALANCE_DUE` = toàn bộ tiền phòng OTA + đêm thêm. Giữa lúc tạo đơn con và bước kiểm tra này không có lần resync đơn cha nào.
(6) Bill ở bill.service.ts:150: `otaPrepaidVnd = m.paidOtaVnd > 0 ? m.paidOtaVnd : otaNet`. Khi đã mất khoản thu, bill vẫn in "Đã thu qua Agoda 1.800.000" (lấy từ `otaNet`), trong khi `balanceDueVnd` (dòng 200) là toàn bộ. Đúng lỗi (2) của thẻ gốc.

Chạy thử (tsx, script ở scratchpad, không sửa repo):
- Gọi `FolioService.syncOtaCollect(tx, 'F', 'CHILD', 'direct')` với tx giả trả về khoản OTA của đơn cha.
- Kết quả: có INSERT dòng đảo, có `UPDATE payment SET status='reversed'`, audit `payment.ota_collect_adjusted` với `after.amountVnd = 0`.
- `moneyPosition`: `balanceDueVnd` từ 1.042.000 lên 2.842.000, `paidOtaVnd` = 0.

Test không kiểm điều được tuyên bố:
- frontdesk-stay.test.ts:256 "B9a OTA (BR-417-01)…" và :337 "B13 OTA (BR-422)…" chỉ kiểm đơn con và đơn cha. Không assert `ota_collect`, `balanceDueVnd` hay B18.
- payments-s3.test.ts:1724 "DOM BE-13 / x-ota-prepaid-rule…": lấy booking fixture rồi đổi `payment_model` bằng `UPDATE` SQL, resync một đơn. Không có đơn con, không chạy B18 check-out.
- be-b-s3-units.test.ts:198 chỉ là hàm thuần `moneyPosition`. Không có test nào cho B18 của đơn OTA ở tầng API tích hợp.
- Gap:
  - Agoda 401, 2 đêm 1.800.000 (ota_prepaid), check-in rồi gia hạn B13 thêm 1 đêm 1.042.000 tạo đơn con direct trên cùng folio. Bước sync của đơn con đảo khoản ota_collect của đơn cha. Khi trả phòng, B18 báo BALANCE_DUE 2.842.000 thay vì 1.042.000. Bill in 'Đã thu qua Agoda 1.800.000' kèm 'Còn phải thu 2.842.000'.
  - Đơn OTA trả trước, lúc trả phòng chọn E05-11 'tính thêm 1 đêm'. addExtraNight tạo đơn con direct ngay trong giao dịch B18 và đảo khoản ota_collect của đơn cha. Cũng trong giao dịch đó, kiểm tra số dư ở checkout.service.ts:405 ném BALANCE_DUE gồm toàn bộ tiền phòng OTA.
  - Đơn OTA trả trước nhận phòng sớm (B9a, 04:40, có đêm trước) tạo đơn con direct, và khoản ota_collect của đơn cha bị đảo. Khoản này chỉ được ghi lại nếu sau đó có thao tác resync đơn cha (ví dụ đổi số người). Không có thao tác đó thì B18 vẫn đòi thu cả tiền phòng.
  - OTA_COVERED gồm cả 'extra_person', trong khi phụ thu người của đơn OTA chỉ phát sinh khi số người thực tế vượt số khách OTA đã bán (nightFee ở reservations.service.ts:1793-1808; lúc đặt phụ thu bị đặt 0 ở :1243-1248). Ví dụ Agoda 202, khách thêm 1 người lớn giữa kỳ, 150.000 × 2 đêm: ota_collect tự tăng thêm 300.000 nên B18 báo còn thu 0. Bill ẩn dòng này và ghi 'Đã thu qua Agoda' cả phần OTA không hề thu, nên quầy thu thiếu 300.000.
  - bill.service.ts:150 dùng otaNet khi không có khoản ota_collect. Vì vậy bất kỳ đơn ota_prepaid nào thiếu khoản thu hệ thống vẫn in đồng thời 'Đã thu qua OTA' và 'Còn phải thu' toàn bộ. Trường hợp này gồm đơn đã xác nhận trước bản sửa (migration 0042 không backfill ota_collect) và đơn vừa bị đơn con đảo khoản thu.
  - Bộ test không có ca B18 check-out cho đơn OTA ở tầng tích hợp API. Ca tích hợp duy nhất đổi payment_model bằng SQL trên booking fixture, không đi qua luồng tạo đơn OTA thật (POST /reservations kênh Agoda), không có đơn con và không gọi check-out.

### DOM-BE-14
- Bằng chứng: Kiểm ở HEAD c8b83f3. Commit này không đổi gì trong services/api so với 229db99. Các thay đổi chưa commit trong working tree không đụng tới những đoạn code dưới đây.

(a) Không tạo yêu cầu hoàn thứ hai sau B16:
- folio.service.ts:672-697 `balance()`: `creditVnd` = `unhandledCreditVnd` = max(0, rawCredit − openRefundVnd).
- folio.service.ts:699-716 `openRefundVnd`: cộng (amount_vnd − refunded_vnd) của các yêu cầu refund có status pending/escalated/approved, target là đơn chính và các đơn có dòng trên folio.
- B16 (stay.service.ts:1258-1275) tạo yêu cầu với targetType 'reservation', targetId row.id, nên được openRefundVnd tính vào.
- B18 (checkout.service.ts:409-423) chỉ đòi `overpaymentHandling` và chỉ tạo yêu cầu khi `balance.unhandledCreditVnd > 0`; blocker ở checkout.service.ts:214 cũng dùng số này.
- `createRefundRequest` (refunds.service.ts:154-165) khóa folio rồi lấy trần = unhandledCreditVnd.

(b) Lệnh chi bị chặn theo số dư thừa hiện tại:
- refunds.service.ts:447 khóa folio FOR UPDATE trước khi đọc số dư.
- refunds.service.ts:484-491: số chi phải ≤ min(còn được duyệt, rawCreditVnd hiện tại). Mỗi lần chi đã ghi làm rawCredit giảm, nên dù có hai yêu cầu cùng mở thì tổng tiền chi vẫn không vượt số dư thừa thật.
- Chỉ có payOut ghi payment type 'refund' (refunds.service.ts:545).

(c) Khoản thừa từ khoản thu chưa đối soát không chi được:
- moneyPosition (folio.service.ts:318-343): khoản thu pending tính 0, khoản disputed chỉ tính số thực nhận; payableCreditVnd = min(credit, settledOwn − refunded − dueAfterOta).
- refunds.service.ts:493-500 trả 409 REFUND_SOURCE_NOT_RECONCILED.
- Không có đường nào tự động chuyển sang 'reconciled'. Desk ghi chuyển khoản/VietQR luôn là 'pending' (payment.service.ts:99-101).

Test:
- payments-s3.test.ts:1782 'DOM BE-14 / E15-05: an open refund request leaves no unhandled credit…': có yêu cầu mở thì balance() trả creditVnd 0, unhandled 0, raw 700.000; tạo yêu cầu thứ hai bị chặn với max 0; chi 700.000 bị 422 max 630.000; chi 630.000 được 201.
- payments-s3.test.ts:938 'A47 transfer refund…', đoạn 1047-1056: chuyển khoản pending thì chi bị 409 REFUND_SOURCE_NOT_RECONCILED.
- payments-s3.test.ts:1847 'ARC-BE-S3-13: short cash handover…': trả 409.
- frontdesk.test.ts:691 'A-34 credit…': B18 đọc đúng unhandledCreditVnd khi chưa có yêu cầu mở (blocker credit_balance, yêu cầu 150.000).
- be-b-s3-units.test.ts:242 'payable credit: pending transfers count for nothing…': tôi đã chạy tệp này, 14/14 xanh. Các test integration cần DB nên tôi không chạy được.
- Gap:
  - Không có test nào chạy B16 rồi B18 qua endpoint thật: test B16 ở frontdesk-stay.test.ts:358 dừng sau B16, còn test DOM BE-14 dùng createRefundRequest thủ công và gọi thẳng FolioService.balance. Vì vậy nếu checkout.service.ts:410 bị đổi sang rawCreditVnd thì không test nào bắt được, và cũng chưa có test kiểm checkout-summary không còn blocker credit_balance khi đang có yêu cầu hoàn mở.
  - Có race giữa B18 và yêu cầu hoàn thủ công. B18 (checkout.service.ts:250-423) không khóa folio trước khi đọc balance, trừ khi có finalPayment hoặc đổi phụ thu trả muộn; createRefundRequest (refunds.service.ts:154) chỉ khóa folio, không khóa đơn. Nếu lễ tân A bấm 'Đề nghị hoàn' 700.000 đúng lúc lễ tân B trả phòng với refund_request, sẽ có hai yêu cầu 700.000. Tiền không bị chi hai lần nhờ trần chi ở payOut, nhưng quản lý vẫn thấy hai yêu cầu để duyệt.
  - Hủy đơn B10 (reservations.service.ts:2235-2246, cancellationQuote ở 2310-2355) tính số hoàn theo depositPaid (folio.service.ts:514-521): không trừ yêu cầu hoàn đang mở, không trừ khoản đã hoàn. Ví dụ: cọc 1.500.000 cho bill 1.000.000, đã có yêu cầu hoàn 500.000, khách hủy với chính sách 100% thì sinh thêm yêu cầu 1.500.000, tổng 2.000.000 trên số dư 1.500.000. Như vậy giả định 2 trong s3-BE-B.md (hủy đơn cũng tự tránh hoàn trùng) là sai; tiền chỉ được trần chi ở payOut chặn.
  - Khoản thu desk ghi bằng card_pos hoặc cash có reconciliation not_required (payment.service.ts:99-101), nên được chi ngay. Nếu lễ tân ghi ảnh chuyển khoản của khách thành card_pos (posAuthCode chỉ cần 1–12 ký tự chữ số) thì đi vòng được REFUND_SOURCE_NOT_RECONCILED. Đây là đúng theo đặc tả DOM (c), nhưng vẫn là một lỗ hở.
  - Các test integration chứng minh (b) và (c) cần DB nên chưa được chạy lại trong lần kiểm này; con số '2087 test xanh' chỉ là báo cáo tự khai của BE-B.

### ARC-S3-01
- Bằng chứng: Kết luận: với đơn trực tiếp (direct/agent) và đơn OTA một mã, cơ chế lỗi ban đầu đã bị gỡ tận gốc. Lỗi cũ là một dòng gộp từ frontdesk, rồi syncStay so dòng đó với perNight của snapshot và đảo đi. Nay mọi lần resync đều lấy phụ thu theo từng đêm từ stay_night:
- migration 0031_frontdesk_fix_be_a.sql dòng 12–15: thêm cột extra_person_fee_vnd, NULL = mức của snapshot.
- reservations.service.ts:971–1010 confirmedStay, dòng 1007: `extraPersonVnd: n.extra ?? snap.extraPersonFeePerNightVnd`.
- folio.service.ts:1095–1134 syncStay: một dòng extra_person cho mỗi đêm. Dòng đang có được giữ khi `wanted.get(service_date) === amount_vnd`.
- Không còn chỗ nào khác post dòng extra_person (grep chỉ ra folio.service.ts:903, 1105, 1118).
- party.service.ts:300 (bản xem trước) và 419–433: peopleFromNight(write) rồi resyncStay. Hàm peopleFromNight (reservations.service.ts:1862–1916) chốt mức của các đêm trước effectiveFrom thành mức riêng, các đêm từ effectiveFrom nhận mức mới.

Các đường resync mà thẻ gốc nêu, tôi đã đọc từng đường:
- B13 / E05-11 / B9a: writeRepricedNights gọi feesForNewNights (reservations.service.ts:1919–1946, lời gọi ở dòng 2065).
- B14: setNightFees cho các đêm được chuyển (stay.service.ts:765–776, 866).
- B16: chỉ void các đêm bỏ (stay.service.ts:1177–1182).
- PATCH khi in_house: peopleFromNight(ctx.today) (reservations.service.ts:1137–1139).
- Mọi nơi gọi resync đều dựng dữ liệu qua confirmedStay (grep resyncStay/resynced).
- Grant UPDATE trên stay_night ở mức bảng (0014:52). 0031 có trong _journal.json:191.

Test: test/integration/frontdesk-s3-fixes.test.ts:200 'ARC-01 / DOM-16: an adult added from 03/11 → 150.000 per night from that night; extension keeps it and adds one'. Test kiểm 03 và 04, mỗi đêm 150.000. Sau B13 có thêm đêm 05. Người rời ngày 05 thì đêm 05 bị bỏ, 03–04 giữ nguyên. Test này cần DB nên ở đây bị skip: vitest báo 1 file skipped, 10 test skipped. Tôi chưa tự chạy được. Báo cáo outputs/BE/s3-be-a.md:140 của BE-A ghi 2119 test xanh, có cả file này.

Còn một phần của thẻ chưa sửa: snapshot.extraCount vẫn không được cập nhật. Tôi chạy lineLabel từ line-labels.ts trong scratchpad với 'extra_guest x0'. Kết quả là labelParams {date, count: 0}, nên FE in ra "Phụ thu 0 người vượt định mức".
- Gap:
  - Đơn OTA gia hạn trước, thêm người sau thì mất phụ thu ở các đêm của đơn con. Ví dụ: đơn Agoda căn định mức 2, 2 người lớn, 02–05. Ngày 03/11 gia hạn B13, sinh đơn con trực tiếp 05–07; createChildStay chép parent.adults=2 vào snapshot với phụ thu 0 (reservations.service.ts:1640–1670). Ngày 04/11 thêm người lớn thứ 3 vào đơn cha. party.service.ts không đụng tới đơn con nên mất 2 × 150.000 ở đêm 05 và 06 mà không có cảnh báo.
  - B17 hủy nhận phòng không xóa extra_person_fee_vnd (checkin.service.ts:720–800). Ví dụ: đơn 1 người lớn, căn định mức 2. Nhận phòng, thêm 1 người cùng ngày (phụ thu 0 nên không post dòng nào, mọi đêm thành mức riêng = 0), rồi hủy nhận phòng (B17). Sau đó PATCH adults=3 trên đơn confirmed: repriceExtraPersons (reservations.service.ts:1141, 1232–1263) chỉ sửa snapshot, còn confirmedStay:1007 ưu tiên mức riêng 0, nên phụ thu 150.000/đêm không bao giờ được post.
  - Thẻ gốc chỉ ra hai lỗi. Lỗi thứ hai là snapshot.extraCount không cập nhật, và lỗi này vẫn còn. peopleFromNight trả extraCount nhưng không nơi gọi nào ghi lại. syncStay ghi description 'extra_guest x0' (folio.service.ts:1119). Kết quả: bill in 'Phụ thu 0 người vượt định mức · đêm 03/11' kèm 150.000. Đã chạy lineLabel thật và ra count=0.
  - effectiveFrom cho phép ngày tương lai (party.service.ts:211), trong khi reservation.adults được tăng ngay. Mọi lần tính lại từ hôm nay sau đó dùng cả nhóm hiện tại, gồm người chưa tới. Các lần đó là: B14 guest_request (stay.service.ts:765–772), PATCH in_house, xóa người khác, hoặc thêm một trẻ dưới 6 tuổi. Hệ quả là thu thừa phụ thu cho các đêm trước ngày người đó đến (sai chiều ngược lại, không phải mất tiền).
  - Test chỉ phủ đường gia hạn B13 và người rời. Chưa có test nào cho đổi phòng B14, trả sớm B16, E05-11 hay PATCH số người khi in_house sau khi thêm người giữa kỳ. Cũng chưa có ca thêm trẻ có phụ thu như ARC yêu cầu, và chưa có ca OTA hay đơn con. Test tích hợp lại bị skip khi không có DB, nên lần kiểm này không xác nhận được nó xanh.
  - Migration 0031 không backfill. Nếu có đơn đang ở với dòng extra_person gộp kiểu cũ, lần resync đầu tiên sau khi deploy sẽ vẫn đảo dòng đó. Rủi ro này chỉ có khi staging/prod đã có dữ liệu.

### ARC-S3-02
- Bằng chứng: Tôi đọc mã ở HEAD 229db99. Lỗi gốc của thẻ FB-R2-ARC-BE-S3-02 (đảo cọc làm depositPaid thành −X) không còn xảy ra được, lý do như sau:
(1) product/services/api/src/modules/folio/public/folio.service.ts:514-520: depositPaid() là `SUM(amount_vnd) ... WHERE folio_id=$1 AND type='deposit' AND status='succeeded' AND reversal_of_id IS NULL`. Dòng đảo do reverse() sinh ra ở payments.service.ts:622-633 (chép type, -amount_vnd, 'succeeded', reversal_of_id=id) bị loại nhờ `reversal_of_id IS NULL`. Dòng gốc bị đổi sang 'reversed' nên cũng bị loại nhờ điều kiện status.
(2) depositPaid không thể âm: CHECK `payment_amount_sign_check` ở migrations/0011_sales_folio_be_b.sql:211 buộc mọi dòng không phải refund và không phải dòng đảo có amount > 0.
(3) Không đảo được hai lần, cũng không đảo được chính dòng đảo: payments.service.ts:616 trả 409 nếu `p.status !== 'succeeded' || p.reversal_of_id`. Ngoài ra có UK `payment_one_reversal_key` ở migrations/0042_money_review_s3_be_b.sql:93.
(4) Mọi nơi dùng đều đi qua một hàm duy nhất: J1 expireOne ở reservations/internal/reservations.service.ts:3252 gọi money.depositPaid → money-bridge.ts:44-47 → FolioService.depositPaid. confirmDeposit ở payments/internal/deposits.service.ts:150 và :228, trần SAL ở payments.service.ts:178, trần VietQR khi hold ở payments.service.ts:708, báo giá hủy và no-show ở reservations.service.ts:2317 và :2989 cũng vậy. Ngoài folio.service.ts:516 không còn câu SQL nào khác cộng cọc.
(5) Test: test/integration/payments-s3.test.ts:1677 'SEC-BE-36 / ARC-BE-S3-02: a reversed deposit counts 0 (not −X): VietQR cap of the hold = required deposit; re-recorded deposit confirms'. Kịch bản: ghi cọc thiếu 100.000 → MGR đảo → depositPaid = 0 → tạo QR với required+1 bị VALIDATION_FAILED max=required → đảo lần hai bị 409 → ghi lại đủ cọc → status 'confirmed'. Với mã cũ, test này fail (trần = required+100k, và confirm ra DEPOSIT_INSUFFICIENT), nên test thực sự bắt được lỗi gốc.
Lưu ý: test chạy trong describe.skipIf(!HAS_DB). Tôi đã chạy `vitest run test/integration/payments-s3.test.ts` và cả 35 test bị skip vì môi trường không có DATABASE_URL, nên tôi KHÔNG tự xác nhận được kết quả xanh. Con số 2087 test xanh là do BE-B báo, ghi ở responses/s3-BE-B.md:30.
- Gap:
  - J1 chưa có test riêng cho kịch bản đảo cọc, dù ARC đã đề xuất 'chạy J1 không hủy'. Chưa có test nào gọi expireHolds với hold có cọc bị đảo rồi được ghi lại một khoản thiếu (mong đợi kept_paid). Phần J1 hiện chỉ được suy ra từ việc J1 dùng chung FolioService.depositPaid (reservations.service.ts:3252).
  - confirmDeposit với existingPaymentId vẫn chấp nhận dòng đảo: deposits.service.ts:163-164 lọc `type='deposit' AND status='succeeded'` nhưng thiếu `reversal_of_id IS NULL`. Hệ quả: FD gửi existingPaymentId là id của dòng đảo (âm) thì vẫn qua. receivedAt lấy theo thời điểm đảo để xét AC4 cho hold quá hạn, và deposit_notice.handled_payment_id trỏ vào dòng đảo. Tác động thấp, vì FD vốn đã được ghi lùi receivedAt.
  - Hold có tiền nhưng ghi sai loại vẫn bị J1 hủy, đây là lỗi khác gốc chứ không phải do đảo cọc. depositPaid chỉ đếm type='deposit'. FD có thể ghi khoản type 'charge' trên folio của hold qua POST /folios/{id}/payments (payment.service.ts:106 và :285 chỉ chặn SAL), hoặc tạo VietQR với purpose 'balance' khi hold (payments.service.ts:704 và :736 sinh type 'charge') rồi xác nhận đã nhận tiền. Khi đó depositPaid = 0, J1 hủy một hold đã có tiền, và confirmDeposit báo DEPOSIT_INSUFFICIENT.
  - depositPaid không trừ khoản hoàn: createRefundRequest không chặn hold (refunds.service.ts:140-163, trần = unhandledCreditVnd = toàn bộ cọc vì hold chưa có dòng). Sau khi đã hoàn hết cọc, depositPaid vẫn đếm đủ, nên confirmDeposit xác nhận đơn bằng tiền đã trả lại khách, còn J1 giữ hold mãi ở trạng thái kept_paid. Lỗi này nằm ngoài gốc 'dòng đảo', nhưng cùng loại sai số cọc.
  - Không tự chạy được test DB (thiếu DATABASE_URL/MIGRATION_DATABASE_URL), nên kết quả xanh của payments-s3.test.ts:1677 chỉ dựa trên báo cáo của BE-B.

### ARC-S3-03
- Bằng chứng: Phần đã sửa đúng: multipart gửi tới route không phải upload bị từ chối mà không đọc thân (product/services/api/src/http.ts:94-97, readMultipart trả 415). requestHash từ chối Buffer, typed array và ArrayBuffer (src/shared/http/unit-of-work.ts:111-113). Hai điểm này có test 'refuses binary bodies (Buffer, typed array, ArrayBuffer)' trong test/be-c-s3-units.test.ts:103-112 (chạy xanh 7/7) và test tích hợp files-attachments.test.ts:316. Vì vậy kịch bản gốc (multipart 40 MB tới completeOnlineCheckin) không còn xảy ra.

Phần "giới hạn đồng thời" và "không làm sập API" thì BÁC BỎ:
(1) http.ts:70 `SESSION_COOKIE` chỉ khớp ĐỊNH DẠNG cookie (`ottimo_gsid=` cộng ≥32 ký tự bất kỳ), không kiểm phiên thật. Sau đó http.ts:103-122 đệm TOÀN BỘ thân, tối đa 42 MB, vào RAM TRƯỚC guard. Không có hook onRequest/preParsing nào khác: grep addHook chỉ thấy onSend ở http.ts:159.
(2) Trần 4 upload (src/modules/files/public/upload-gate.ts:13-26) chỉ được gọi bên trong controller, tức là SAU khi thân đã đệm xong: registration.controller.ts:207, guest.controller.ts:223, attachments.controller.ts:89. Rate limit theo phiên/IP (guest.controller.ts:208-209) cũng nằm sau bước parse. Comment "never queued with its body in memory" trong upload-gate.ts:3 là sai.
(3) Buffer.concat(chunks, size) ở http.ts:122 cấp thêm một bản sao trong khi chunks còn giữ, nên đỉnh khoảng 84 MB mỗi request.
(4) infra/docker-compose.prod.yml:144 đặt `mem_limit: 1g` cho api. Caddyfile.prod chỉ giới hạn 42 MB cho từng request, không giới hạn số kết nối theo IP. read_body 90s, requestTimeout 60s.
Chạy thử thật bằng tsx với readMultipart của HEAD: 6 request dùng cookie giả `__Host-ottimo_gsid=AAAA…(43)`, mỗi request 41 MB chưa kết thúc, giữ 247 MB arrayBuffers. Khi kết thúc, parser chấp nhận và trả Buffer 42.991.616 byte, RSS lên 390 MB. Suy ra khoảng 25 kết nối song song (≈1 GB trong 60 s, khoảng 140 Mbps) sẽ khiến container api bị OOM-kill.
Test hiện có không kiểm điều được tuyên bố: files-attachments.test.ts:316 chỉ thử trường hợp KHÔNG có cookie (401) và thân nhỏ tới route khác; không thử cookie đúng định dạng nhưng giả, không thử nhiều request đồng thời, không đo bộ nhớ (test hồi quy "không tăng bộ nhớ" mà ARC đề xuất không có). Test này là test tích hợp cần DB nên không chạy được ở đây. Test 'upload gate' trong be-c-s3-units.test.ts:78-99 chỉ thử withUploadGate đứng riêng, không thử giai đoạn parse.
- Gap:
  - Kẻ tấn công không cần link khách: chỉ cần gửi `Cookie: __Host-ottimo_gsid=<43 ký tự bất kỳ>` kèm khoảng 25 POST multipart ~41 MB song song tới /v1/guest/online-checkin/documents. Mỗi thân bị đệm đủ vào RAM trước khi guard trả 401, nên api (mem_limit 1g) bị OOM-kill.
  - Trần 4 upload đồng thời (withUploadGate) chỉ áp sau khi thân đã đệm xong, nên không giới hạn số thân 42 MB nằm trong bộ nhớ cùng lúc. Tuyên bố 'có giới hạn đồng thời' không đúng ở tầng đọc thân.
  - Khách có link thật (phiên hợp lệ) cũng làm được như trên: giới hạn 20 lần/giờ/phiên và 60 lần/giờ/IP chỉ được tính trong controller, sau khi thân đã nằm trong RAM. Request thất bại vẫn đã tốn bộ nhớ.
  - readMultipart giữ mảng chunks trong lúc Buffer.concat cấp bản mới, nên đỉnh bộ nhớ là khoảng 84 MB mỗi upload. Ngưỡng OOM vì vậy thấp hơn nữa khi nhiều request kết thúc cùng lúc.
  - Caddy prod chỉ giới hạn kích thước từng request (42 MB), không giới hạn số kết nối hay tốc độ theo IP trên 3 route upload, nên không chặn được tấn công song song.
  - Không có test hồi quy nào thử cookie đúng định dạng nhưng giả, thử nhiều request đồng thời, hay đo bộ nhớ tiến trình. Test files-attachments.test.ts:316 chỉ dùng thân nhỏ và trường hợp thiếu cookie, và là test tích hợp cần DB.
