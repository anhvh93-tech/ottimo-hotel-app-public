# Báo cáo kiểm thử Sprint 3 – Round 2 (QA)

- Bước: **Kiểm thử** (Round 2 – Sprint 3) · Người làm: QA · Ngày: 17/10/2026 (00:00–01:35)
- Bản kiểm chính: **HEAD `229db99`** (commit "Sprint 3 response & fix" – bản QC sẽ xét). Bản tham chiếu: `a297273` + `product/infra` của cây làm việc (chạy trước khi `229db99` được commit).
- Hợp đồng: OpenAPI **0.3.6-draft + bổ sung 1 và 2** (ARC 17/10), BR v0.3.4, oracle `product/tests/fixtures/br-examples.json`.
- Danh sách lỗi: `rounds/round-02/qa/bug-list.md` (BUG-R2-030…052, mục 4 kiểm lại).

## 0. Kết luận

| Hạng mục | Kết quả trên `229db99` |
|---|---|
| E2E chạy như CI (2 lượt, mỗi lượt một stack dựng mới) | Lượt 1: **1.748 đạt · 0 trượt** · 82 bỏ qua · 20 trượt đúng dự kiến (lỗi đang mở) · 4 flaky. Lượt 2: **1.750 đạt · 0 trượt** · 82 bỏ qua · 20 trượt dự kiến · 2 flaky |
| 113 ca Sprint 3 (TC-L3 49, TC-L4 54, TC-L7 10) | **88 đạt · 15 trượt dự kiến · 10 bỏ qua · 0 trượt** |
| RBAC Sprint 3 | 67 operation, **737/737 đạt** (2xx 60 op, 401 60, 403 50, 404 7) |
| axe (WCAG 2.1 A/AA + 2.2 AA) | **44 lần quét, 0 vi phạm ở mọi mức** (H01–H18, sáng/tối, VI/EN) |
| Lỗi mở theo mức | **P0: 0** (BUG-R2-044 đã đóng) · **P1: 6** (031, 035, 037, 046, 050, 052) · P2: 9 · P3: 3 |
| ESC | Không lập. P0 duy nhất (044) đã sửa và QA kiểm lại đạt trong round |

**Đề xuất cho QC:** chưa đủ điều kiện ra cổng – còn 6 lỗi P1 mở, trong đó **BUG-R2-050 làm CI đỏ** (checkout sạch không build được guest-web, job E2E của CI không chạy) và **BUG-R2-052 chặn nhận phòng khách đến sau nửa đêm**. Phần tiền của Sprint 3 (OTA thu hộ, cọc của sale, phụ thu nhận sớm phải quyết định) đã đạt sau bản sửa.

## 1. Cách chạy

### 1.1 Môi trường
- Stack dùng một lần `ottimo-qa-s3` (`COMPOSE_PROJECT_NAME`), compose chuẩn `infra/docker-compose.yml` (volume `blobdata`, dịch vụ `db-roles` – bản sửa BUG-R2-030) + file override chỉ đổi cổng và tên ảnh; seed DS-E nạp bằng dịch vụ `seed` (0 cảnh báo, 7/7 mã chứng từ khớp).
- Ảnh `ottimo-api:qa-s3-head` (`--build-arg INCLUDE_TEST_SUPPORT=1`) và `ottimo-web:qa-s3-head` build từ `git archive HEAD product` tại `229db99` – đúng nội dung CI sẽ build. Riêng ảnh web: checkout sạch **không build được** (BUG-R2-050), QA chép thêm `apps/guest-web/build/used-keys.ts` từ cây làm việc vào nguồn build để kiểm tiếp phần còn lại.
- Playwright 1.63 như CI: `CI=true` (retries 1), `E2E_UI=1`, `E2E_COMPOSE_CONTROL=1`, `TEST_SUPPORT_TOKEN`, `QA_SEED_PASSWORD` lấy từ file env của stack (không in ra); `E2E_AUTH_DIR`, `E2E_SEED_OUT` riêng cho stack. Lệnh: `playwright test -c e2e/playwright.config.ts --reporter=json` (mọi project, theo phụ thuộc trong config).
- Mỗi lượt: hạ stack + xóa volume → dựng lại → seed → chạy đủ. Thời gian một lượt: ~255 giây (trên `a297273` là ~94 giây – chênh lệch do harness chờ giới hạn SR-RL-09, xem 1.3).

### 1.2 Kiểm tĩnh (cây làm việc hiện tại)
| Lệnh | Kết quả |
|---|---|
| `tsc -p tests/tsconfig.json --noEmit` | đạt |
| `eslint tests` | 0 lỗi |
| `prettier --check tests` | đạt |
| `node tests/tools/validate-fixtures.mjs` | 0 lỗi, 1 cảnh báo (không chặn); 277 dòng oracle, 167 dòng tự tính lại |
| `gen_traceability.py --strict` | exit 0 – 71/71 story Must R2, 251/251 AC có TC |
| `gen_rbac_cases.py --check` | rbac-cases up to date (189 operation, 2.079 ca) |

### 1.3 Điều chỉnh harness theo bản `229db99`
- **SR-RL-09** (600 request/phút/người – mới ở `229db99`): các worker song song dùng chung tài khoản `qa.*` nên bị 429. `support/api.ts call()` chờ `Retry-After` ≤ 65 giây rồi gửi lại cùng request (tối đa 2 lần, kéo dài timeout ca, log `BUG-R2-051`). Mỗi lượt có 15 lần chờ; 2–4 ca UI flaky vì trình duyệt `qa.fd` nhận "Bạn đã thử quá nhiều lần" (qua ở lần chạy lại). Bộ đếm này không xóa được qua `/__test__/rate-limits/reset` và chạy theo MutableClock (BUG-R2-051).
- **Quyết định phụ thu bắt buộc** (DOM S3-12): ca không lấy phụ thu làm chủ đề nhận **mặc định của quầy** (ghi phụ thu đang hiển thị) khi server trả `SURCHARGE_DECISION_REQUIRED` – có annotation `harness` trên ca (TC-L3-004, 044, 047, 049, TC-L4-012, 044). Ca kiểm chính quy tắc (TC-L3-014) vẫn gửi `false` và kỳ vọng 422.
- **Đồng hồ trình duyệt** ở H16 (`desk-clock`) đặt bằng giờ ảo của stack (`page.clock.setFixedTime`) – H16 mặc định giờ trả = "bây giờ" của trình duyệt.

## 2. Kết quả theo project

| Project | `229db99` lượt 1 (đạt / trượt / bỏ qua / trượt dự kiến / flaky) | `229db99` lượt 2 | Tham chiếu `a297273` (2 lượt) |
|---|---|---|---|
| api | 147 / 0 / 11 / 3 / 2 | 149 / 0 / 11 / 3 / 0 | 147 / 0 / 11 / 5 / 0 |
| clock | 72 / 0 / 7 / 15 / 0 | 72 / 0 / 7 / 15 / 0 | 70 / 0 / 7 / 17 / 0 |
| db-outage | 1 / 0 / 0 / 0 / 0 | 1 / 0 / 0 / 0 / 0 | 1 / 0 / 0 / 0 / 0 |
| desk-chromium | 33 / 0 / 2 / 2 / 2 | 33 / 0 / 2 / 2 / 2 | 35 / 0 / 2 / 2 / 0 |
| desk-clock | 1 / 0 / 0 / 0 / 0 | 1 / 0 / 0 / 0 / 0 | 1 / 0 / 0 / 0 / 0 |
| limits | 2 / 0 / 1 / 0 / 0 | 2 / 0 / 1 / 0 / 0 | 2 / 0 / 1 / 0 / 0 |
| rbac | 1.474 / 0 / 55 / 0 / 0 | 1.474 / 0 / 55 / 0 / 0 | 1.474 / 0 / 55 / 0 / 0 |
| rbac-logout | 11 / 0 / 0 / 0 / 0 | 11 / 0 / 0 / 0 / 0 | 11 / 0 / 0 / 0 / 0 |
| serial | 5 / 0 / 0 / 0 / 0 | 5 / 0 / 0 / 0 / 0 | 5 / 0 / 0 / 0 / 0 |
| smoke | 2 / 0 / 6 / 0 / 0 | 2 / 0 / 6 / 0 / 0 | 2 / 0 / 6 / 0 / 0 |
| **Tổng** | **1.748 / 0 / 82 / 20 / 4** | **1.750 / 0 / 82 / 20 / 2** | **1.748 / 0 / 82 / 24 / 0** |

"Trượt dự kiến" = ca có `test.fail` đặt ngay trước bước lỗi của một BUG đang mở – khi lỗi được sửa, ca báo "passed unexpectedly" để QA đóng lỗi. Flaky ở `229db99`: TC-L3-036 (429 SR-RL-09), TC-L2-079 (409 `CONCURRENT_UPDATE` khi ca song song), TC-L2-021 (E) và BUG-R2-026 (E) (trình duyệt nhận 429) – đều qua ở lần chạy lại.

## 3. 113 ca Sprint 3

| Nhóm | Số ca | Đạt | Trượt dự kiến | Bỏ qua |
|---|---|---|---|---|
| TC-L3 nhận phòng, giấy tờ, khai báo | 49 | 37 | 10 | 2 |
| TC-L4 lưu trú, trả phòng, bill, thu tiền | 54 | 41 | 5 | 8 |
| TC-L7 check-in online (guest-web) | 10 | 10 | 0 | 0 |
| **Tổng** | **113** | **88** | **15** | **10** |

- Trượt dự kiến theo lỗi: BUG-R2-033 (TC-L3-032) · 034 (TC-L3-004, 037) · 035 (TC-L3-044, 046, 048) · 036 (TC-L3-039) · 037 (TC-L3-054) · 038 (TC-L3-011) · **052** (TC-L3-008) · 041 (TC-L4-059) · 043 (TC-L4-066) · 045 (TC-L4-003) · 046 (TC-L4-056) · 047 (TC-L4-004). Ngoài 113 ca: BUG-R2-046 còn ở TC-NT-029, 030, 036; BUG-R2-031 ở TC-L3-030 (E); BUG-R2-052 ở TC-L3-001 (E) khi chạy trước 06:00.
- So với `a297273`: TC-L3-014 (039), TC-L4-061, 046, 047 (044), TC-L4-063 (042) chuyển sang **đạt**; TC-L3-008 chuyển sang trượt dự kiến (lỗi mới 052).
- Bỏ qua có lý do: TC-L3-060, 061 (US-128 mã cửa – dời R3); TC-L4-080, 081 (US-041 – dời R3); TC-L4-021, 023 (`getArrivalsDepartures` – EP01 Sprint 4); TC-L4-024 (job J4 `checkout.reminders` chưa đăng ký); TC-L4-068 (job J15 `folio.close` chưa đăng ký – phần cửa sổ BR-427 đã kiểm); TC-L4-070, 071 (`createItem`/`updateItem` US-066 – chưa có trong sprint nào).

## 4. Phạm vi đã kiểm theo việc được giao

| Việc | Đã làm | Kết quả |
|---|---|---|
| 1. Thân 113 ca `test.fixme` | Viết đủ theo OpenAPI 0.3.6 + báo cáo BE `s3-be-{a,b,c}.md` | 88/15/10/0 (mục 3) |
| Oracle BR | BR-411/412/413/415/416/417, 422, 428, 433, 436, 507, 511, 521/522/527, 602/603/605, 609/610/611, 702, 903 đọc từ `br-examples.json` (không gõ số tay) | đạt, trừ các BR của lỗi mở (BR-307 đã đạt sau 044) |
| Tách nhiệm (self-confirm / self-pay → 403) | TC-NT-030 (a) FDL tự duyệt FOC → 403 `SELF_APPROVAL_FORBIDDEN`; TC-L4-062: MGR tự duyệt yêu cầu hoàn mình tạo → 403 `SELF_APPROVAL_FORBIDDEN`, FD tạo yêu cầu rồi tự chi tiền mặt → 403 `SELF_REFUND_FORBIDDEN`, FD chi chuyển khoản → 403, chi vượt số duyệt → chặn; TC-L4-069: MGR tự đối soát khoản mình ghi → 403 `SELF_RECONCILE_FORBIDDEN` (OWN được, cờ self), sale tự xác nhận tiền mặt nộp quầy → 403 (BR-527-05), FD đối soát chuyển khoản → 403; TC-L5-052 SAL tự đối soát → 403. Chưa kiểm: quy tắc SEC-37 mới (người duyệt ≠ người đặt nơi nhận; OWN vừa duyệt vừa chi hoàn chuyển khoản) | đạt |
| C3 – không lộ giá trị rõ cho vai sai | `c3-access.s3` (TC-RB-001: JSON của SAL/CTV không có khóa giấy tờ, kể cả 4 số cuối; TC-RB-002: SAL/CTV/HK/MT gọi thẳng 4 endpoint C3 → 403/404, không nội dung, không thêm `c3_access_log`; TC-RB-022: FD trên PWA/không thiết bị → 403, máy quầy được cấp + xác thực lại mới xem được, `no-store`, có `c3_access_log`); phản hồi `addGuestDocument` của FD chỉ có 4 số cuối; TC-SEC-010 (7 endpoint cần máy được cấp → 403 `DEVICE_NOT_TRUSTED`, không lộ dữ liệu); SEC-C3 lúc lưu (psql: không bản rõ số giấy tờ/ngày sinh/địa chỉ, cột `*_enc`, không rò sang `audit_event`/`idempotency_key`/`c3_access_log`/`registration`; tệp blob không phải ảnh rõ) | đạt |
| Guest portal ĐK-1 | 5 route mức 2 + mã cửa US-128 → **404 với mọi chủ thể** (runner RBAC + TC-L7); khách mức 1 chỉ thấy dữ liệu ĐK-2; cookie nhân viên trên operation khách → 401; ghi của khách cần Origin guest-web; `retentionDays` thiếu → 422 `REQUIRED`, khác tham số → 422 `NOT_IN_LIST` | đạt |
| J16 xóa ảnh / J24 hết hạn QR qua `/__test__/clock` + job | J16: TC-L3-039, 070, 071 (BR-609/610); J24: TC-L4-064, 069 (QR hết hạn, không ghi tiền) | J24 đạt; J16 đạt trừ lượt tại đúng mốc +24 giờ (BUG-R2-036) |
| Runner RBAC Sprint 3 | `rbac/sprint3-ops.ts` 67 operation (thêm `createLead`, `transitionRoomBlock` S2 còn sót) | 737/737 |
| 2. Seed DS-E | thêm `early_departure_refund` {minNoticeDays 1, refundPct 50} (BR-428, INV-006); 3 tham số khác có mặc định catalogue | seed 0 cảnh báo |
| 3. UI E2E + axe | H13 4 bước trên máy được cấp + hộp xác nhận, H13 máy chưa cấp, H14 danh sách/chi tiết, H15 drawer, H16 trả phòng 3 bước (`desk-clock`), H17 Cần duyệt + Nhật ký tiền 3 tab, giao diện tối; guest-web H18 VI/EN 390×844 (thông báo, giấy tờ, đồng ý, giờ đến, hoàn tất, link sai/thu hồi) | 44 lần quét, 0 vi phạm; chức năng đạt trừ lỗi mở |
| 4. Chạy như CI, ghi lỗi | 2 lượt × stack mới trên `229db99` + 2 lượt tham chiếu `a297273` | mục 2; lỗi BUG-R2-030…052 |
| Kiểm lại bản sửa | 025–029 (Sprint 2) đóng; **039, 042, 044 đóng** trên `229db99`; 030 đã commit, chờ CI E2E xanh | bug-list mục 4 |
| Yêu cầu giữa chừng của ORC: TC-L2-053 (b) | Đổi kỳ vọng theo 0.3.6 (A-34): `balanceDueVnd` 0 + `creditVnd` 350.000 – lỗi ở test, không phải server | đạt cả 4 lượt |

### 4.1 Cập nhật test theo hợp đồng 0.3.6 bổ sung 1 + 2 (không phải lỗi sản phẩm)
`ConsentInput.retentionDays` bắt buộc cho P02B; `OnlineCheckin.currentNoticeVersion`/`imageRetentionDays`; giá trị cổng khai báo ngày `dd/MM/yyyy`, quốc tịch "Tên nước (alpha-3)"; `earlyDeparture` trả `EarlyDepartureResult`; B9a cần `expectedSurchargeVnd` = `priorNightRateVnd`; giờ nhập sớm hơn giờ thao tác quá 30 phút cần `checkoutTimeNote`/`checkinTimeNote`; `setLateCheckout`/`checkIn` không còn "không ghi phụ thu" im lặng; kiểm minibar `mode=stayover` đóng tới US-033 (TC-NT-032 lấy dòng minibar từ kiểm trả phòng của 2 đơn khác); hoa hồng chỉ "đạt" sau trả phòng + thu đủ (BR-527/903 v0.3.4 – TC-L5-052).

## 5. Lỗi theo mức

| Mức | Mở | Mã | Ghi chú |
|---|---|---|---|
| **P0** | 0 | – | BUG-R2-044 (OTA thu hộ tính tiền phòng vào "Còn phải thu") **đã sửa, QA kiểm lại đạt, Closed** |
| **P1** | 6 | 031 Reservation thiếu `registrationId`… (H13 bước Giấy tờ treo) · 035 job J5 nhắc hạn khai báo chưa có · 037 gia hạn vượt hạn thị thực không chặn mềm · 046 quản lý không duyệt được FOC phát sinh trong hạn mức · **050 tệp guest-web không có trong git – CI đỏ** · **052 khách đến sau nửa đêm không nhận phòng được** | 039 đã Closed; 030 Fixed (đã commit, chờ CI E2E xanh – đang chặn bởi 050) |
| P2 | 9 | 033, 034, 036, 038, 041, 045, 047, 048, **051** | 042 đã Closed; 038 BE-A ghi hoãn chờ ARC 0.3.7 |
| P3 | 3 | 032, 040, 043 | – |

Lỗi mới ở bước này (chi tiết đủ bước tái hiện trong bug-list):
- **BUG-R2-050 (P1, FE + OPS)** – `apps/guest-web/build/used-keys.ts` bị `.gitignore` gốc (`build/`) loại nên không vào `229db99`; `vite.config.ts:7` và `guard.test.ts:5` import → CI 38940900970 đỏ ở Lint (`TS2307`), ảnh web không build được từ checkout sạch.
- **BUG-R2-051 (P2, BE-B)** – bộ đếm SR-RL-09 trong `AuthGuard` là thể hiện riêng theo MutableClock: reset của test-support không xóa được; sau khi tua giờ về hiện tại `Retry-After` = 247.743.660 giây cho `qa.fd`/`qa.owner` (khóa tới khi khởi động lại api).
- **BUG-R2-052 (P1, BE-A + FE)** – 01:30 ngày D+1 (ngày nghiệp vụ = ngày đến D): preview báo phụ thu 0 nhưng `checkIn` trả 422 `addPriorNight: REQUIRED`; H13 chỉ hiện "Bắt buộc". Hồi quy của bản sửa B9a ở `229db99` (trên `a297273` đạt).

## 6. Chưa kiểm được / hạn chế (trung thực)
- **Thiết bị thật**: không có điện thoại/máy quầy thật – H18 chạy Chromium giả lập 390×844, chụp ảnh giấy tờ bằng chọn tệp (chưa thử camera, ảnh HEIC, mạng chập chờn trên điện thoại); máy quầy được cấp là cookie thiết bị của seed/ảo. Đề xuất đưa vào kế hoạch Round 3 (đa thiết bị) – chưa cần ESC ở Sprint 3.
- **Dọn buồng** (`transitionRoomStatus`, HK) là Sprint 4: trên stack dùng một lần, buồng sạch được giả lập bằng xóa `room_status` qua psql; `listHkTasks` chưa có (7 ca RBAC + TC-L6-053/055 bỏ qua).
- **Job chưa đăng ký**: J4 `checkout.reminders`, J5 `registration.deadline` (lỗi 035), J15 `folio.close`, `hold.remind`.
- **Staging**: chưa có stack staging để chạy lại (CI `229db99` không tới bước deploy vì BUG-R2-050). Mọi kết quả là trên stack QA dựng từ đúng commit.
- Đồng hồ: ca theo giờ dùng MutableClock + ngày ảo (> hôm nay + 800), không phải đồng hồ thật nhiều ngày. Sau project `clock` không chạy lại project dùng API trên cùng stack (BUG-R2-051).
- TC-L3-001 (E) và quét axe H15 chạy ban đêm (trước 06:00) nên dừng ở BUG-R2-052; lượt `a297273` buổi tối đã đạt đủ (H15 0 vi phạm).
- Chưa kiểm: báo cáo đóng ca BR-526 (FOC tự áp trong ca), cảnh báo thất thoát BR-435, US-066 danh mục hàng (chưa có sprint – báo PO), hoa hồng chuyển "đạt" lúc trả phòng (BR-903 v0.3.4 – chỉ kiểm vế "chưa đạt" sau đối soát), `markNotificationRead`, `resolveAttentionEvent`, `setMyApprovalPin`, 2FA (R3).
- Quan sát gửi các vai (không ghi lỗi): OpenAPI vẫn liệt kê `mode: stayover` mà server từ chối (ARC sửa enum hoặc ghi chú); `addFolioLine` mặc định `serviceDate` sau cửa sổ BR-427; `ci.yml` đếm "UI cases ran" chỉ thư mục `ui/` (chưa tính `ui-clock/`); cần sửa chữ TC-L3-037, 056(c), 070, TC-L4-022, 047 (238.000 theo BR-415 v0.2), 050, 054(a), 067; hợp đồng thiếu `Registration.rejectedReason`, metadata đồng ý chỉ có trong nhật ký.

## 7. Việc tiếp theo đề xuất
| Vai | Việc |
|---|---|
| FE + OPS | BUG-R2-050 (đổi thư mục hoặc ngoại lệ `.gitignore`, commit tệp) – điều kiện để CI xanh và đóng BUG-R2-030 |
| BE-A | BUG-R2-052 (B9 sau nửa đêm), 031 (DTO 0.3.6), 037, 046 (cùng BE-B), 047, 040, 038 (chờ ARC 0.3.7) |
| BE-B | BUG-R2-051 (dùng `RATE_LIMITER` chung để reset xóa được, cửa sổ theo giờ thật hoặc mở lại khi đồng hồ lùi), 041, 043 |
| BE-C | BUG-R2-035 (J5), 036 (J16), 048, 033/034 (cùng BE-A; PO chốt sprint của 034) |
| FE | BUG-R2-032 (nhãn nút bước 3), thông báo lỗi trường `addPriorNight` ở H13 (đi kèm 052) |
| QA | Kiểm lại ngay khi có commit sửa; bỏ `test.fail` tương ứng; chạy lại đủ 2 lượt trên stack mới |

## 8. File đã tạo/sửa ở bước này
- Tạo: `product/tests/e2e/support/s3.ts`, `e2e/api/guest-checkin-online.s3.api.spec.ts`, `e2e/api/c3-at-rest.s3.api.spec.ts`, `e2e/clock/guest-portal.s3.clock.spec.ts`, `e2e/rbac/sprint3-ops.ts`, `e2e/rbac/rbac-sprint3.spec.ts`, `e2e/ui/axe.ts`, `e2e/ui/stay.h13-h17.spec.ts`, `e2e/ui/guest-web.h18.spec.ts`, `e2e/ui/s3-retest.spec.ts`, `e2e/ui-clock/checkout.h16.spec.ts`; cùng QA phụ: `e2e/support/s3-checkin.ts`, `e2e/support/s3-stay.ts`, `e2e/api/checkin.s3.api.spec.ts`, `e2e/api/stay-checkout.s3.api.spec.ts`, `e2e/api/c3-access.s3.api.spec.ts`, `e2e/clock/checkin.s3.clock.spec.ts`, `e2e/clock/stay-checkout.s3.clock.spec.ts`, `e2e/clock/approvals-foc.s3.clock.spec.ts`; báo cáo này.
- Sửa: `e2e/support/api.ts` (`isAvailable` context riêng, `stackToday` theo ngày nghiệp vụ, chờ 429 SR-RL-09), `e2e/support/env.ts`, `e2e/playwright.config.ts` (project `desk-clock`), `e2e/rbac/cases.ts`, `e2e/ui/helpers.ts`, `e2e/ui/a11y.axe.spec.ts`, `e2e/ui/rack-booking.smoke.spec.ts`, `e2e/api/s2-fix.api.spec.ts` (TC-L2-053 b), `e2e/api/s3-kickoff.api.spec.ts`, `e2e/api/platform.api.spec.ts` (TC-NT-020, ngày hiệu lực 2090–2092), `e2e/api/audit-approvals.api.spec.ts`, `e2e/smoke-manifest.json`, `fixtures/seed/ds-e.json`, `product/tests/README.md`, `rounds/round-02/qa/bug-list.md`, `01-decisions/decision-log.md` (2 dòng QA 17/10).
