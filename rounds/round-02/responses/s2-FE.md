# FE – phản hồi thẻ Round 2 · Sprint 2 (bước Phản hồi & sửa)

- Ngày: 16/10/2026 | Vùng: `product/apps/admin-web/**`, `product/packages/{ui,api-client}/**` | Hợp đồng: OpenAPI **0.3.5-draft** (gồm phần bổ sung A-19…A-22 ở `outputs/ARC/s2-contract.md` mục 8.3). `packages/api-client/src/generated` đã sinh lại từ `openapi.yaml` hiện hành.
- Không commit.

## Kết quả lệnh (thư mục `product/`)

| Lệnh | Kết quả |
|---|---|
| `turbo run test --continue` | **12/12 task xanh**. admin-web **106/106** (mới: `s2-fix.test.tsx` 6), api-client 10, ui 7, i18n 3, api 172 (+951 bỏ qua) |
| `turbo run build` | **6/6 xanh**. Bundle chính admin-web 510 KB (gzip 160 KB); rack, đơn và báo giá tải lazy |
| `docker build -f infra/docker/Dockerfile.web .` | **exit 0** |
| `pnpm format:check` | Phần FE xanh. Toàn repo **đỏ** vì 9 file `services/api/**` (BE-A đang sửa: migrations meta 0015–0018, `rack/reservations/room-blocks/occupancy/pricing.service.ts`) và `tests/test-results/.last-run.json` (tệp kết quả Playwright của QA, nên đưa vào `.prettierignore`) |
| `pnpm lint` | ESLint 0 lỗi (còn 1 cảnh báo cũ ở `mockServiceWorker.js` sinh tự động). `turbo typecheck` **đỏ** chỉ ở `@ottimo/api`: `test/reservations-pricing.test.ts:69` thiếu `otaBaseRates` (BE-A, theo ARC 8.1) |

→ Toàn repo chưa xanh. Hai lỗi còn lại đều trong vùng BE-A đang sửa song song; phần FE đã xanh hết.

## UXD (`reviews/s2-UXD.md`)

| ID | Trạng thái | Ghi chú |
|---|---|---|
| FB-R2-UXD-FE-S2-01 | Done | Nút "Hủy đơn" bị khóa (có `aria-describedby`) cho tới khi `dryRun` trả kết quả. Trong lúc chờ hiện `cancel.preview_loading`; nếu lỗi hiện `cancel.preview_failed` + nút Thử lại. Mỗi lần đổi lý do hoặc tiền phạt sẽ gọi lại `dryRun` (300 ms). Câu nội dung chọn theo số tiền: `body` / `body_no_refund` / `body_no_money`. Đơn OTA có thêm lý do `cancel.reason.ota_cancelled` và ô `cancel.ota_penalty` (gửi `otaPenaltyVnd`). Không viết cứng `rsv.cancel_rule`. Test: s2-fix (lỗi xem trước → khóa → thử lại → hủy OTA có tiền phạt) |
| S2-02 | Done | Bỏ tham số `channels`. Dùng `cancel.consequence` chỉ khi đơn có `quoteId`, ngược lại dùng `cancel.consequence_no_lead`. Tên lead lấy tạm theo người đứng tên báo giá, vì `Reservation` không có tên lead |
| S2-03 | Done | 412 và 428 hiện nút `common.reload`. Tải lại xong thì ẩn cảnh báo đỏ, giữ nguyên dữ liệu đã nhập, người dùng tự bấm lưu lại. Test cập nhật |
| S2-04 | Done | 409 INVALID_TRANSITION: tải lại thành công thì đóng hộp và hiện `rsv.transition_changed` trong drawer, `{status}` lấy từ `currentState`. Tải lại thất bại thì giữ hộp, khóa nút chính, hiện `rsv.transition_changed_unknown` + "Tải lại". Test cập nhật |
| S2-05 | Done | `formatInstant` theo giờ Asia/Ho_Chi_Minh; không có `expiredAt` thì dùng `error.HOLD_EXPIRED_notime` |
| S2-06 | Done | Đã xóa `dateLabels()`, dùng `booking.field.arrival/departure`. Thay các khóa: `rack.view_label`, `rack.long_prefix`, `rack.off_sale`, `rack.col_status/col_bookings`, `bk.unassigned_confirm_*` (có `{ota_ref}`), các toast `rsv.toast.*`, `rsv.filter_active`, `rsv.search_placeholder`, `sale.quote_converted/expired`. Nút căn nâng hạng của FD nay hiện chữ `rsv.upgrade_needs_lead` thay cho tooltip |
| S2-07 | Done | Danh sách đơn: `rsv.list_empty_*` (+ nút Đặt phòng mới cho FD+) và `rsv.search_empty`. Báo giá: `sale.quotes_empty_*` + nút sang tab Căn trống |
| S2-08 | Done | `pct` lấy từ `getBookingRules.shortStayDepositPct`; `days` lấy từ `quoteValidityDays` (`useRules`). Nếu không đọc được thì OWN/MGR/FDL dùng `listParameters`, vai khác dùng mặc định BR §13 |
| S2-09 | Done | Có 1 đơn: `rack.conflict_title` (`{channel}`, `{code}`, `{guest}`) + Gán căn. Có từ 2 đơn: tiêu đề `today.unassigned_title` + danh sách, mỗi đơn có nút Gán căn riêng. `rack.conflict_body` chưa dùng vì rack không có căn gợi ý (`suggestions` chỉ có khi gán) |
| S2-10 | Done | Bỏ `aria-label` ở khung bao (chỉ để ở `grid`). Ô không đặt được dùng `rack.cell_past` / `cell_off_sale` / `cell_free`. Hàng lưới dùng lớp `.contents`. Nút Nhận phòng dùng `aria-disabled` + `aria-describedby` (`shell.coming_title`). **Chưa** thử VoiceOver Safari |
| S2-11 | Done | Màn < 768 px dùng `.rack-list` (mỗi căn một thẻ: đơn hiện tại/sắp tới, chip Nhập tay / sofa / giữ chỗ / `rack.ooo_until` / ngừng bán), vùng chạm 44 px. Bảng "Danh sách" giữ cho desktop |
| S2-12 | Done | Dưới thanh chung có thêm dòng `rack.offline` |
| S2-13 | Done | Theo A-13: cọc thiếu trả 200 → dùng `depositRequiredVnd`/`depositPaidVnd` của đơn; `paid` truyền cả số vừa nhập |
| S2-14 | Done (một phần) | `legend` = `rsv.assign_options`; toast `rsv.toast.assigned`. `rsv.assign_lead` chưa hiện vì client không biết căn/nhóm OTA ánh xạ, cần ARC thêm vào `Reservation` hoặc `OverbookingIncident`. `rsv.fit_*` chờ API trả lý do |
| S2-15 | Done | Thay style nội tuyến bằng lớp DS v0.3.3 (`mt-*`, `mb-*`, `p-8`, `card.inset`, `caption`, `fieldset-plain`, `list-plain`, `contents`, `self-end`, `row.tight`). Chỉ còn vị trí lưới rack (dữ liệu động). `app.css` thêm `.p-12`, `.row.wrap`, `.input.auto-w`, `.plain-list`, `.rm-name`; UXD có thể chuyển các lớp này vào `hifi.css` |
| S2-16 | Done | Thêm helper `tv()` trong `test/render.tsx` (đọc `translate('vi', …)`). Các test EP02 bị ảnh hưởng không còn viết cứng câu UXD |
| S2-17 | Done | `field.<MÃ>` được tra tự động; `n` truyền cho `MANUAL_LONG_STAY_BELOW_THRESHOLD`. Gia hạn lần 2 (`extendedCount ≥ 1` hoặc `HOLD_EXTENDED_ONCE`) → `field_error.hold_extended_once`, khóa nút |
| S2-18 | Done | Dùng `vnd()` + `common.vnd_unit` |
| S2-19 | Accepted | Dùng lớp `bar hold urgent`; tạm thêm `.bar.hold.urgent` vào `app.css`, UXD chuyển vào `hifi.css` thì FE xóa dòng này. Chú giải chưa có mẫu "< 2 giờ" |
| S2-20 | Done | `<span lang="vi|en">` trong Seg |

## DOM (`reviews/s2-DOM.md`) + ARC A-19

| ID | Trạng thái | Ghi chú |
|---|---|---|
| FB-R2-DOM-FE-01 / A-19 | Done (phần FE), chờ UXD | Dùng `MoveReasonCode` (7 mã). Lọc theo vai đúng spec: `upgrade` chỉ FDL+; `overbooking` chỉ khi `conflictState=open` hoặc `capacityConflict`; `force_majeure` chỉ khi dời-thay-hủy + MGR+; `other` và `force_majeure` bắt buộc ghi chú. **Danh sách chỉ hiện khi đủ 7 khóa `move.reason.<mã>` trong strings UXD** (hiện chưa có). Tới lúc đó form vẫn là ô chữ tự do (`other` + ghi chú), để không hiện mã thô cho lễ tân. Mock kiểm đủ các ràng buộc |
| FB-R2-DOM-FE-02 | Done (một phần) | Khi chọn khách có `lastStayDate` mà nguồn đang là mặc định Zalo → tự chọn "Khách quay lại" (lễ tân đổi được). Dòng gợi ý dưới ô chờ chuỗi UXD |

## SEC (`reviews/s2-SEC.md`)

| ID | Trạng thái | Ghi chú |
|---|---|---|
| FB-R2-SEC-FE-05 | Done | Khóa nháp có id người dùng: `booking.new.<userId>`, `booking.longStay.<userId>`. Test s2-fix kiểm khóa có id người dùng và khóa cũ không còn dùng. Vẫn xóa hết khi đăng xuất/đổi người (`clearClientData`) |

## ARC `s2-contract.md` mục 5 + 8.3

| Mục | Trạng thái | Ghi chú |
|---|---|---|
| Sinh lại kiểu 0.3.5 | Done | `pnpm --filter @ottimo/api-client gen`; thêm kiểu `CloserCandidate`, `BookingRules`, `OccupancyConflict`, `MoveReasonCode` |
| A-01 RackBar | Done | Dùng 4 trường chính thức. SAL/CTV: rack chỉ còn "Đã kín"; H12 lấy `listReservations` (x-scope own) để vẽ đơn của mình mở được |
| A-02 Problem | Done | Đọc `currentState`, `depositRequiredVnd`/`depositPaidVnd`, `roomNo`, `max`, `expiredAt`, `minStayNights`, `availableFrom` (`app/reservations.ts`) |
| A-04 no-show | Done | Bỏ khóa theo giờ máy. Nút theo `allowedActions`; chưa tới giờ thì hiện nút `aria-disabled` + "Mở được từ {giờ của `noShowAvailableFrom`}"; nhận 409 kèm `availableFrom` thì hiện câu tương ứng |
| A-05 đêm lẻ | Done | `MIN_STAY_NOT_MET` hiện nút "Dùng căn X" từ `suggestions[]`. Chuỗi "(đêm lẻ)" chờ UXD. Gán căn OTA gọi `searchAvailability?reservationId=` và dùng `upgrade` server trả |
| A-06 người chốt | Done | Kênh CTV có ô `bk.closer` lấy từ `listCloserCandidates?kind=agent`, gửi `closerUserId`. Nhãn "Người chốt" cho sale nội bộ chờ UXD |
| A-07 | Done | `getBookingRules` cho mọi vai đặt phòng, có đường lui như S2-08 |
| A-13 | Done | Cọc thiếu → 200 `hold`: hộp không đóng, hiện số đã ghi/còn thiếu, đổi Idempotency-Key cho lần nhập sau. Test cập nhật |
| A-14 | Done | H09/H12 dùng `extraPersonFeeVnd`, `extraGuestCount` (bỏ phép trừ) |
| A-17 | Done | Không có ô ảnh biên nhận (CTV "Báo đã chuyển cọc" chỉ có số tiền + ghi chú) |
| A-18 | Done | Báo giá `expired`: MGR/OWN "Gia hạn" → 200; SAL/CTV "Gửi quản lý gia hạn" kèm lý do → 202. Toast 202 tạm dùng `common.saved`, chờ UXD chuỗi riêng. Test MGR |
| A-20 | Done | OTA vượt tối đa: ô số khách chỉ cảnh báo, không khóa. Khi nhận 422 `CAPACITY_EXCEEDED_WARNING` → hiện cảnh báo + ô lý do → gửi lại với `capacityWarningAckReason`. Làm ở cả H09 và Đổi căn. Drawer: chip "Xung đột OTA" + cảnh báo `error.CAPACITY_EXCEEDED`. Rack: icon cảnh báo + nhãn đọc màn hình, **nhưng cần `RackBar.capacityConflict`** (0.3.5 chưa có – xem mục cuối). Test s2-fix |
| A-21 | Done | `restoreNoShow` nhận body `{reason, roomId?, allowUnassigned?}`. MGR+ khi gặp 409 (căn đã bán lại) thấy "Dùng căn X" + "Lưu chưa gán căn". FD/FDL đơn OTA → 202. Test s2-fix |
| A-22 | Done | `calendarRateVnd` chỉ đọc: bảng giá H09 hiện giá lịch gạch ngang khi khác giá áp; FE không bao giờ gửi trường này |
| Mock MSW | Done | `mocks/reservations.ts` theo 0.3.5: Problem mới, 200 cọc thiếu, `noShowAvailableFrom` + thứ tự kiểm A-04, `closer-candidates`, `booking-rules`, `quotes/{id}/actions/extend` (+ báo giá tự `expired`), `QuoteCalculation` tách tiền, `MIN_STAY_NOT_MET` + căn đêm lẻ, `searchAvailability?reservationId` + `upgrade`, `OTA_PENALTY_OTA_ONLY`, `MoveReasonCode` + ràng buộc, `CAPACITY_EXCEEDED_WARNING`/`capacityConflict`, `restoreNoShow` A-21, `calendarRateVnd` |

## Cần vai khác
| Gửi | Nội dung |
|---|---|
| ARC | `RackBar.capacityConflict` (A-20 nói hiện trên rack, nhưng schema RackBar chưa có trường này; FE đọc nếu có, mock đã gửi). Thêm căn/nhóm OTA ánh xạ cho đơn chưa gán, để hiện `rsv.assign_lead` |
| UXD | Chuỗi: `move.reason.<7 mã>`; gợi ý nguồn khách (DOM FE-02); "Dùng căn {room} (đêm lẻ)"; "Người chốt"; toast "Đã gửi quản lý gia hạn báo giá"; nhãn/chip "Vượt sức chứa (OTA)" cho rack và drawer; mẫu chú giải "Giữ chỗ < 2 giờ"; chuyển `.bar.hold.urgent` và các lớp tiện ích mới vào `hifi.css` |
| QA | Đưa `tests/test-results/` vào `.prettierignore` (đang làm `format:check` toàn repo đỏ) |
| BE-A | `format:check` 9 file + typecheck `reservations-pricing.test.ts` (`otaBaseRates`) |

## Bổ sung – lượt 2 (ARC A-24/A-25, 22 chuỗi UXD `responses/s2-UXD.md`)

| Mục | Trạng thái | Ghi chú |
|---|---|---|
| Sinh lại api-client | Done | `RackBar.capacityConflict` (A-24), `requestedRoomGroupId/Code` trên `Reservation` + `RackBar` (A-25). `RackBarX` chỉ còn là tên khác của `RackBar`, không còn trường tự thêm |
| A-25 `rsv.assign_lead` | Done | Hộp gán căn hiện câu dẫn với `{channel}`, `{group}` (tên nhóm lấy từ `listRoomGroups` theo `requestedRoomGroupCode`), `{from}`, `{to}`. `searchAvailability?reservationId=` → server đánh dấu `upgrade` theo nhóm OTA ánh xạ. **`{room}` tạm điền tên nhóm** vì API chỉ có nhóm, không có căn – đề nghị UXD có biến thể câu không cần `{room}` |
| A-24 rack | Done | Nhãn đọc màn hình `rack.capacity_conflict` + icon cảnh báo trên thanh |
| Chuỗi UXD mới | Done | `move.reason.*` → hộp đổi căn tự chuyển sang danh sách, lọc theo vai. Cảnh báo sức chứa dùng `booking.capacity_warning` / `capacity_reason` / `capacity_reason_help` (H09 + đổi căn); drawer dùng `rsv.capacity_chip` + `rsv.capacity_conflict_body`. Thêm `bk.use_room_orphan`, `bk.closer_sales` (ô người chốt cho nguồn "Sale nội bộ", lọc `kind=staff`), `bk.source_help` + `bk.source_auto_returning` (DOM FE-02 xong hẳn), `sale.extend_requested`, `rack.legend_hold_urgent` (mẫu `bar hold urgent` trong chú giải), `error.ROOM_OCCUPIED`; `field.HOLD_LIMIT_REACHED` nhận `{max}` từ `Problem.max` (qua `rsvErrorText` → `fieldErrorText`) |
| CSS trùng | Done | Đã xóa khỏi `packages/ui/src/styles/app.css` các khai báo hifi.css mục 13 đã có (`.p-12`, `.row.wrap`, `.input.auto-w`, `.plain-list`, `.rm-name`, `.rack-list .rowlink`, `.bar.hold.urgent`); mã FE đổi sang `.list-none` |
| Test | Done | Sửa test 412 (chọn lý do `other` rồi nhập ghi chú); test A-20 theo chuỗi mới; thêm 2 test: A-25 (câu dẫn + căn nâng hạng bị khóa với FD) và A-19 (FD chỉ thấy 4 lý do) |
| Mock | Done | Đơn OTA chưa gán căn có `requestedRoomGroupId`; rack trả `requestedRoomGroupId/Code` + `capacityConflict` cho FD+; `searchAvailability?reservationId` tính `upgrade` theo nhóm OTA ánh xạ |

**Kết quả lệnh lượt 2** (toàn repo `product/`): `pnpm format:check` **xanh**; `pnpm lint` **xanh** (12/12 task, ESLint 0 lỗi, còn 1 cảnh báo cũ ở `mockServiceWorker.js`); `turbo test build --continue` **16/16 xanh**, admin-web **108/108**; `docker build -f infra/docker/Dockerfile.web .` **exit 0**.

## Bổ sung – lượt 3 (CI run 38908702473: test "hold: countdown…" không tìm thấy drawer "Lê Minh")
- Nguyên nhân: test này là test **đầu tiên** của `reservation.test.tsx`. Nó phải chờ Vite biến đổi tại chỗ (on-demand) các chunk route tải lazy (rack/đơn/báo giá). Khi CI chạy nhiều worker song song, thời gian đó vượt 1 s – mức chờ mặc định của `findBy*`. Không phải lỗi mã: sau khi ghi cọc thiếu (A-13), hộp vẫn mở đúng và drawer không đóng/mở lại.
- Sửa (`apps/admin-web/src/test/setup.ts`): `configure({ asyncUtilTimeout: 5000 })`; `beforeAll` nạp sẵn 3 chunk lazy (giới hạn 30 s), để không test nào phải gánh thời gian biến đổi module. Bỏ phụ thuộc đồng hồ thật: regex đếm ngược `2[12] giờ` → `\d+ giờ` (`reservation.test.tsx`, `rack.test.tsx`).
- Kiểm: `pnpm --filter @ottimo/admin-web test` ×5 liên tiếp, lần nào cũng 108/108; `turbo run test --force` (toàn repo chạy song song) 12/12 task xanh; prettier, ESLint, tsc admin-web xanh.
