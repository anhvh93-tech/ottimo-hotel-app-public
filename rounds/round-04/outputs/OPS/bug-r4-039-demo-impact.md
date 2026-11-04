# OPS – BUG-R4-039 (PR #74): ảnh hưởng tới seed / smoke demo, staging, E2E

- Người làm: OPS · Round 4 · Bước Kiểm thử (rà rủi ro) · 05/11/2026
- Đối tượng: PR #74 `v104/fix-checkin-occupied-exception`, head `9646029d`. Luật mới: `room_ready` chỉ có `overridableBy` (FDL+) khi buồng `VD`/`CL` **và** căn không còn lượt `in_house` khác (`roomHeldByAnotherStay`). `OC`/`OD`/`OOO`, hoặc căn còn lượt khác (kể cả khi buồng `VI`/`VC`/`VD`/`CL`), thì trả 409 `CHECKIN_CONDITIONS_NOT_MET` cho mọi vai.
- Phạm vi: chỉ đọc mã và chạy local. Không kết nối staging/production, không SSH.

## 1. Kết luận

**#74 không làm hỏng bước nào** của seed demo, smoke demo, seed/smoke staging hay E2E. Không mở PR `v104/ops-demo-checkin-occupied`. Runbook staging và runbook phát hành v1.0.4 không cần đổi.

Khi chạy thật thì lộ ra 3 lỗi **có từ trước, không do #74** trong `seed-demo.mjs` / `smoke-demo.mjs` (mục 4). Lỗi P-1 làm `demo-up.sh` dựng lại từ HEAD chết ngay bước đầu.

## 2. Rà tĩnh: các bước nhận phòng

| Script | Bước nhận phòng | Căn | Căn có lượt `in_house` khác lúc nhận? | Sau #74 |
|---|---|---|---|---|
| `product/infra/demo/seed-demo.mjs` pha 1 (`past`) | longStay D-30 15:00 | 301 | Không. DS-E không có đơn nào | Không đổi |
| | departingToday D-2 14:30 | 103 | Không | Không đổi |
| | midStay D-2 16:10 | 202 | Không | Không đổi |
| | otaInHouse D-1 15:20 | 401 | Không | Không đổi |
| | ctvInHouse D-1 18:45 | 101 | Không | Không đổi |
| `seed-demo.mjs` pha 2 (`now`) | Không nhận phòng | – | – | – |
| `product/infra/demo/smoke-demo.mjs` bước 3 | arrivalToday (D) | 102 | Không. 102 chưa có ai ở trước đó, và bước trả phòng 103 chạy sau, ở căn khác | Không đổi |

- 5 lượt pha 1 ở 5 căn khác nhau, nhận theo thứ tự thời gian. Lối FDL xác nhận ngoại lệ chỉ chạy khi `unmet` chỉ có `room_ready`. Căn trống `VD`/`CL` vẫn được ngoại lệ sau #74, nên lối dự phòng này vẫn đúng.
- `demo-reset.sh` gọi lại `seed_all` (cùng các bước trên).
- Staging/production: `deploy.sh` bước `smoke` chỉ kiểm health, giới hạn vai, worker, header Caddy, blob probe. `smoke-prod/readonly.prod.spec.ts` chỉ đọc. Seed staging là DS-E (`seed-cli`), không có đơn. Landing LP-v2 không nhận phòng. Cả ba **không** đụng nhận phòng.
- E2E/integration có ngoại lệ: `tests/e2e/support/s3.ts` (`inHouse`: FDL override khi chỉ thiếu `room_ready`), `clock/checkin.s3.clock.spec.ts`, `ui-clock/stay-money.s4.spec.ts`, 7 tệp `services/api/test/integration/*`. CI của #74 (run 41865436564, head `9646029d`) xanh: E2E 1985 passed / 0 failed / 92 skipped, có project `clock` và `desk-clock`. BE đã sửa `reversal-debt-g4.test.ts` ngay trong #74.

## 3. Chạy thật trên stack local dùng một lần (từ `9646029d`)

Cách chạy: `git archive 9646029d product` vào scratchpad. Build `ottimo-api:ops039` (không có test support) và `ottimo-api:ops039-seed`. Compose project riêng `ottimo-ops039`, api ở `127.0.0.1:3439`. Không dùng tên `ottimo-demo` và không dùng tag `ottimo-api:demo*` (stack demo của INV đang chạy, build `fe4b166` 17/10, không bị đụng). Env sinh bằng `make-ci-env.sh`. Tài khoản VietQR giả, **không** đọc `product/.env`. Các bước lặp lại `lib.sh seed_all`, rồi chạy `smoke-demo.mjs`. Khi xong đã xóa container, volume, network, image và thư mục scratchpad. Không in env hay secret.

| Bước | Kết quả |
|---|---|
| `seed-demo.mjs past` bản gốc | **Chết ở bước 1** (tạo tài khoản `chunha`): 422 `reauth` `STRONG_REAUTH_REQUIRED`. Lỗi có từ trước (P-1), chưa tới bước nhận phòng |
| `seed-demo.mjs past`, chỉ vá P-1 trong bản sao scratch | Đạt. 5/5 nhận phòng (301, 103, 202, 401, 101) |
| `seed-demo.mjs now` | Đạt (exit 0). VietQR 422 (P-3), `đã tắt 0 tài khoản qa.*` (P-2) |
| `smoke-demo.mjs` | Đăng nhập 8 vai, rack, công suất 54 %, giấy tờ, **nhận phòng OTM-00007 căn 102: ok**, link khách: ok. 2 FAIL ngoài nhận phòng: VietQR `PAYMENT_NOT_CONFIGURED` (P-3), trả phòng `LATE_CHECKOUT_AFTER_LIMIT` (P-4) |
| DB sau smoke | 6 lượt `in_house` (101, 102, 103, 202, 301, 401), cả 6 có `checkin_room_override_by` = NULL. Không lượt nào phải dùng ngoại lệ |

## 4. Lỗi có từ trước (không do #74), đề xuất ORC giao OPS sửa riêng

| ID | Vị trí | Vấn đề (đã kiểm bằng mã lỗi trả về) | Ảnh hưởng | Đề xuất sửa |
|---|---|---|---|---|
| P-1 | `seed-demo.mjs` `phasePast`, `POST /v1/users` | Cổng S2 (`6f87ad43`, 23/10, R3) bắt `reauth` khi tạo tài khoản. Script không gửi → 422 `STRONG_REAUTH_REQUIRED` | `demo-up.sh` từ mọi bản sau 23/10 chết ngay bước 1. `demo-reset.sh` còn chạy được vì dùng lại mã nguồn cũ ở `~/.ottimo-demo/src` | Thêm `reauth: { password: <mật khẩu qa.owner> }` (MFA_ENFORCED=false nên chỉ cần mật khẩu). Đã thử trong bản sao: đạt |
| P-2 | `seed-demo.mjs` `phaseNow`, `PATCH /v1/users/{id}` `status: disabled` | Cùng cổng S2 → 422 `STRONG_REAUTH_REQUIRED`. Script chỉ đếm 200 nên lỗi bị nuốt, log ghi "đã tắt 0" | 13 tài khoản `qa.*` vẫn bật trong demo (chỉ local, mật khẩu nằm trong `demo.env` 0600) | Gửi `reauth` bằng mật khẩu OWN demo. Gặp `status ≠ 200` thì dừng hẳn |
| P-3 | `seed-demo.mjs` `phaseNow`, `PUT …/parameters/payment_receiving_account` | `effectiveFrom: D` → 422 `EFFECTIVE_FROM_TOMORROW` | Demo không có VietQR hôm nay, smoke bước 4 FAIL `PAYMENT_NOT_CONFIGURED`. Với tài khoản thật trong `product/.env` cũng vậy | Đặt tham số ở pha 1 (đồng hồ giả D-1, `effectiveFrom` = D), hoặc ghi rõ demo chỉ có VietQR từ ngày mai. ARC/SEC xem cách nào hợp quy tắc S2 |
| P-4 | `smoke-demo.mjs` bước 4 | Chạy sau giờ giới hạn trả muộn (ở đây là 00:16) → 422 `extraNight` `LATE_CHECKOUT_AFTER_LIMIT` | Smoke phụ thuộc giờ chạy | Ghi "chạy smoke ban ngày", hoặc xử lý nhánh `extraNight` |

Thư mục `product/infra/demo/` không nằm trong CODEOWNERS (không thuộc path SEC). Riêng P-3 có đụng tham số S2 nên SEC nên xem.

## 5. Ghi chú phụ

- Tệp HTML sinh ra, chưa commit: `product/docs/manual/ottimo-manual-v1.0.html` dòng 550 còn ghi ngoại lệ cho căn "`VD`, `CL`, `OD`". Bản md 1.13 (`user-manual-v1.0.md`, `guides/02-le-tan.md`) đã ghi chỉ `VD`, `CL`. Cần sinh lại HTML trước khi phát hành (BA/UXD).
- QA TC-V104-RG-14 ghi "STG nếu có cặp đơn như vậy". Trên staging không có script nào tạo sẵn cặp đơn này. QA tự dựng trên Desk nếu cần.

## 6. Giả định

- "Căn `OC`/`OD`" gồm cả trường hợp rộng hơn mà #74 chặn: căn còn lượt `in_house` khác đi hôm nay hoặc phủ đêm nay, dù trạng thái buồng là gì. Đã rà cả trường hợp này.
- Lần chạy local dùng giờ thật 00:11–00:16 ngày 05/11, tức ngày nghiệp vụ 04/11. P-4 do giờ chạy, không phải do mã.

## 7. Sửa P-1…P-4 (PR `v104/ops-demo-seed-fixes`)

- Người làm: OPS · Round 4 · Bước Phản hồi & sửa · 05/11/2026. PR PRNUM, cắt từ `origin/main` `476fd9b8`. Chưa gộp.
- Chỉ sửa `product/infra/demo/` (`seed-demo.mjs`, `smoke-demo.mjs`, `lib.sh`). Không sửa mã sản phẩm, không nới cổng S2. Script gửi bằng chứng S2 giống Desk và harness E2E (`tests/e2e/support/api.ts` `seedReauthFor`, `s3-stay.ts` `ensureReceivingAccount`).

### 7.1 Đã sửa

| ID | Sửa | Commit |
|---|---|---|
| P-1 | `createUser` gửi `reauth: { password }` bằng mật khẩu `qa.owner`. Stack demo chạy `MFA_ENFORCED=false`, nên mật khẩu là đủ | `55552db6` |
| P-2 | `PATCH /v1/users/{id}` `status: disabled` gửi `reauth: { password }` bằng mật khẩu OWN demo. Trả lời khác 200 thì pha 2 dừng (`must`). Sau vòng tắt, script đọc lại danh sách và dừng nếu còn tài khoản `qa.*` bật | `55552db6` |
| P-3 | Tham số `payment_receiving_account` chuyển sang **pha 1**. Lúc đó đồng hồ giả đang ở D−35, `effectiveFrom` = D, tức đúng đường "từ ngày kinh doanh sau" của S2. Pha 2 (api demo, không có endpoint kiểm thử) không ghi tham số này nữa. `lib.sh` truyền `DEMO_ENV_FILE` cho pha 1 thay vì pha 2. Bị từ chối thì log in mã lỗi, không in giá trị. Tệp tài khoản demo ghi ngày hiệu lực; nếu chưa cấu hình thì ghi rõ quy tắc "nhập hôm nay, mai mới có hiệu lực" | `55552db6` |
| P-4 | Smoke bước 4 dùng một giờ trả phòng cho cả bước. Sau mốc trả muộn cuối (18:00 → 06:00): đọc `checkout-summary`, tạo VietQR `purpose: check_out` đúng số "còn phải thu" (đã gồm đêm thêm), xác nhận tiền, rồi trả phòng với `extraNight: {}` (giá mặc định, ARC 16.18). Ban ngày và trong khung bậc phụ thu thì giữ luồng cũ. Đêm ngày đi không bán được (cần OWN/MGR xác nhận phí) thì báo FAIL rõ là kịch bản đã đổi. Kịch bản hiện tại để căn 103 trống đêm D | `55552db6` |
| P-5 (mới) | Lộ ra khi P-4 đã qua: B18 trả 409 `MINIBAR_NOT_CHECKED`. Từ BUG-R2-196, lượt kiểm minibar bắt buộc có `roomId` + `periodId`. Smoke cũ không gửi hai trường này và không đọc lỗi 422. Bản sửa kiểm mọi tủ mà `checkout-summary` liệt kê (`minibarUncheckedRooms`), lấy `roomId`/`periodId` từ `getMinibarStandard`, và báo FAIL nếu bị từ chối. Lỗi này có cả ban ngày, nên smoke ban ngày cũng đã đỏ từ sau BUG-R2-196 | `210407cd` |

### 7.2 Bằng chứng chạy (05/11/2026, 00:35–00:39 giờ thật, ngày nghiệp vụ 04/11)

Cách chạy: `git archive` vào scratchpad. Build image **một lần**: `ottimo-api:ops-p14-seed` (có test support) và `ottimo-api:ops-p14`. Compose project riêng `ottimo-ops-p14`, api `127.0.0.1:3414`, thư mục làm việc trong scratchpad, không container `web`. Không dùng `~/.ottimo-demo`, cổng 3100/8181–8183, tag `ottimo-api:demo*` hay project `ottimo-demo`. Stack `ottimo-demo` của INV vẫn chạy nguyên (Up 11 days) trước và sau. Wrapper nạp đúng `lib.sh` của PR, chỉ thay `dc()` (project, cổng, tag image) và bỏ `sample_images`, rồi gọi `seed_all` và `smoke-demo.mjs`. Tài khoản nhận là tài khoản THỬ đã có trong repo (`TEST_RECEIVING_ACCOUNT`), **không** đọc `product/.env`. Không in env hay secret.

Trên cùng stack này, `seed_all` + smoke chạy **2 lượt**. Lượt 1 (`55552db6`) làm lộ P-5. Lượt 2 (`210407cd`) chạy sau khi sửa P-5; `seed_all` tự xóa volume và nạp lại. Không build lại image, không dựng project thứ hai.

| Bước | Lượt 1 (`55552db6`) | Lượt 2 (`210407cd`) |
|---|---|---|
| `seed-demo.mjs past`: tạo 8 tài khoản (P-1) | Đạt | Đạt |
| Lên lịch tài khoản nhận VietQR (P-3) | Đạt: "hiệu lực từ 2026-11-04" | Đạt |
| 5 lượt nhận phòng pha 1 (301, 103, 202, 401, 101), giữ chỗ 201 | Đạt | Đạt |
| `seed-demo.mjs now`: tắt `qa.*` (P-2) | Đạt: "đã tắt 13 … (kiểm lại: không còn tài khoản qa.* nào bật)" | Đạt |
| Smoke: 8 vai, rack, công suất 54 %, giấy tờ, nhận phòng OTM-00007 | Đạt | Đạt |
| Smoke bước 4 lúc 00:35 / 00:39 (sau mốc 18:00, P-4) | Đêm thêm 750.000 đ → VietQR `check_out` 810.000 đ → xác nhận → **FAIL** trả phòng 409 `MINIBAR_NOT_CHECKED` (P-5) | Đêm thêm 750.000 đ → VietQR 810.000 đ → xác nhận → kiểm minibar 10 món → **trả phòng OTM-00002: ok** |
| Smoke bước 5 (link khách) | Đạt | Đạt |
| Kết luận | `SMOKE: 1 lỗi` | **`SMOKE ĐẠT`**, exit 0 |

Kiểm DB sau lượt 2 (psql trong container postgres của stack dùng một lần):

| Kiểm | Kết quả |
|---|---|
| `config_parameter` `payment_receiving_account` | 1 dòng, `effective_from` 2026-11-04, tạo lúc 2026-09-30 09:00 (đồng hồ giả) |
| `app_user` `qa.*` | 13/13 `disabled`. 8 tài khoản demo `active` |
| `audit_event` `stepup.s2_granted` | `createUser` 8, `updateUser` 13, `setParameter` 1, `changeMyPassword` 8, `trustCurrentDevice` 1; tất cả `method = password`. `stepup.s2_failed`: 0 |
| OTM-00002 (căn 103) | `checked_out`, ngày đi 04/11 → 05/11 (đêm thêm 04/11 750.000 đ), folio `settled`. VietQR PT-000030 `check_out` 810.000 đ `succeeded` (đêm thêm + giặt là 60.000 đ) |
| Lượt `in_house` | 6 lượt (gồm OTM-00007 nhận ở smoke), không lượt nào có `checkin_room_override_by` |

Kiểm tĩnh: `prettier --check` và `eslint` (cấu hình `product/eslint.config.js`) trên 2 tệp `.mjs` đều sạch. `bash -n lib.sh` sạch. Máy không có shellcheck; job CI "infra scripts (shellcheck)" kiểm thay.

Dọn: đã xóa container, volume `ottimo-ops-p14_pgdata`/`_blobdata`, network `ottimo-ops-p14_default`, image `ottimo-api:ops-p14*`, thư mục làm việc (env, state, tệp tài khoản `.out/`). Sau khi dọn không còn gì mang nhãn project `ottimo-ops-p14`.

### 7.3 Cần SEC review (P-3)

P-3 đụng tham số S2 `payment_receiving_account` (R3-Q51, SEC Q51-5: chỉ nhận ngày hiệu lực sau ngày kinh doanh, kể cả lần đầu). `product/infra/demo/` không nằm trong CODEOWNERS của SEC, nên PR ghi rõ là cần SEC review.

- Server đi đúng đường S2: OWN gửi mật khẩu của chính mình, và `effectiveFrom` lớn hơn ngày kinh doanh **theo đồng hồ server**. Đồng hồ giả chỉ có ở image pha dựng dữ liệu (`demo-seed`, `CLOCK_MODE=mutable`) trên localhost. Staging/production không có đồng hồ giả.
- Hệ quả cần SEC chấp nhận: trong demo, tài khoản nhận có hiệu lực ngay ngày dựng. Ở bản thật thì mai mới có hiệu lực.

### 7.4 Còn lại, không sửa trong PR này

- Lượt chạy chỉ chứng minh nhánh sau mốc trả muộn (nhánh hỏng ở P-4) vì chạy lúc 00:35–00:39. Nhánh ban ngày và nhánh khung bậc phụ thu giữ logic cũ; phần minibar (P-5) dùng chung cho mọi nhánh. INV/QA chạy `demo-up.sh --smoke` ban ngày sau khi gộp là kiểm được.
- Smoke giả định seed và smoke cùng một ngày nghiệp vụ. Nếu `demo-up.sh --smoke` chạy vắt qua 06:00, bước 3–4 sẽ lệch ngày. Trường hợp này hiếm vì cả lượt mất khoảng 1 phút.
- Dòng "web khách đọc lượt ở (căn ?)": `GuestStay.roomNo` đã bỏ có chủ đích (BR-012, 0.3.7 D1). Chỉ là chữ trong log, smoke vẫn đạt.
