# Báo cáo kiểm thử – Round 2, Sprint 1

- Tác giả: QA | Ngày: 16/10/2026 | Bước 5 (Kiểm thử) Sprint 1 | Bản build: commit `d7d42e4` (API 35 operation trong runner, 27 có trên build; admin-web H01–H07)
- Lỗi chi tiết: `rounds/round-02/qa/bug-list.md` (BUG-R2-005 … 013). Review: `reviews/QA-on-BE.md` (8 thẻ), `reviews/QA-on-FE.md` (5 thẻ).

## 1. Môi trường đã dùng (chạy thật, không mock)

| Thành phần | Cách dựng |
|---|---|
| Stack | Compose project riêng `ottimo-qa-r2s1` (bản sao `infra/docker-compose.yml`, cổng **15432 / 13000 / 18081–18083**, volume riêng, mật khẩu DB/`TEST_SUPPORT_TOKEN`/`QA_SEED_PASSWORD` sinh ngẫu nhiên cho lần chạy). Stack dev `ottimo-dev` (5432/3000/8081) **không bị đụng** – PostgreSQL dev vẫn "Up 4 hours" sau khi xong |
| API + worker | Ảnh `ottimo-api:qa-r2s1` build từ `Dockerfile.api` (có `INCLUDE_TEST_SUPPORT=1`), `APP_ENV=dev`, `CLOCK_MODE=mutable`; thêm `ADMIN_BASE_URL=http://127.0.0.1:18081`, `GUEST_BASE_URL` để **bật kiểm Origin** như staging (compose dev không đặt) |
| DB | migrate one-shot exit 0 (0000…0007); seed DS-E bằng service `seed` (file seed chép sang thư mục tạm để không ghi `.out/` của dev): 13 user, 7/7 mã chứng từ khớp, `warnings` [] |
| Web | `Dockerfile.web` **build hỏng** (BUG-R2-006) → QA build `admin-web` bằng `vite build` (production ⇒ `apiMode() = server`, MSW không chạy) và phục vụ bằng Caddy cùng digest + `Caddyfile.dev` (proxy `/v1`, `/health` → api) |
| Chạy test | Playwright 1.63 (`product/tests`), `E2E_API_URL=:13000`, `E2E_WEB_URL=:18081`, `E2E_ORIGIN=http://127.0.0.1:18081`, `E2E_CLOCK_CONTROL=1`. Số liệu cuối lấy từ **lần chạy sạch** (xóa volume, migrate + seed lại) |
| UI | Trình duyệt Playwright (chromium) **chưa cài** trên máy và tải về cần quyền → bộ UI smoke (11 ca) chạy **tay** đúng các bước của `e2e/ui/admin-web.smoke.spec.ts` trên trình duyệt thật (pane trình duyệt của app) với API thật |
| Dọn | `docker compose -p ottimo-qa-r2s1 down -v`, xóa ảnh `ottimo-api:qa-r2s1`, thư mục tạm, cache phiên `e2e/.auth/sessions.json` |

## 2. Kết quả theo nhóm (lần chạy sạch cuối)

| Nhóm | Tổng | Đạt | Trượt | Bỏ qua | Ghi chú bỏ qua |
|---|---|---|---|---|---|
| RBAC runner (`rbac` + `rbac-logout`) | 385 | **288** | **9** | 88 | 44 ca 2FA (R3); 44 ca pending: `listC3AccessLog`, `listChannels`, `setMyApprovalPin`, `stepUp` chưa có trên build (không thuộc 22+ operation S1) |
| E2E API (`api`) | 42 | **29** | **3** | 10 | chờ folio/đơn/báo giá Sprint 2–3 (TC-NT-011, 016, 017(1), 018, 019, 020, 028…036, 030, 039, 040a–d) |
| Smoke (`smoke`) | 40 | **3** | 0 | 37 | 37 ca (S) của tính năng sau Sprint 1 (`pending.spec.ts`); TC-X-050c chạy với cờ compose trỏ đúng stack QA |
| UI smoke admin-web (tay, API thật) | 11 | **11** | 0 | 0 | TC-NT-010 đạt theo kỳ vọng hiện tại nhưng có lỗi trải nghiệm BUG-R2-010 |
| Test đơn vị admin-web (`vitest`) | 64 | 62 | **2** | 0 | BUG-R2-009 |
| **Cộng (không tính vitest)** | **478** | **331** | **12** | **135** | |

Ca trượt cuối cùng:
- RBAC RB-1784…RB-1792 – `trustCurrentDevice` 9 vai bị cấm → `401 REAUTH_FAILED` thay vì `403` → **BUG-R2-005 (P1)**.
- API `TC-NT-008 (thứ tự kiểm, BUG-R2-005)` (ca mới chống tái phát) → `createUser` MGR 422, `trustCurrentDevice` FD 422 → **BUG-R2-005**.
- API `TC-NT-012` → `hold_hours_default` = 36 lưu 200 → **BUG-R2-007 (P2)**.
- API `TC-RB-010` → CTV tra email khách SAL nhận `{"matches":[]}` thiếu `possible_duplicate` → **BUG-R2-008 (P2)**.

Diễn biến (trung thực về số đỏ giả):
| Lần | Stack | Đạt / Trượt / Bỏ qua / Không chạy | Nhận xét |
|---|---|---|---|
| 1 | mới | 273 / 46 / 136 / 11 | 26 ca đỏ do test QA lệch build (tên có chữ số, login thiếu Origin…) → BUG-R2-012 (QA, đã sửa); 20 ca đỏ thật |
| 2 | dùng lại | 301 / 18 / 136 / 11 | thêm 6 ca `429 RATE_LIMITED` do bộ đếm xác nhận mật khẩu còn từ lần 1 (đỏ môi trường – thẻ FB-R2-QA-BE-07) |
| 3 | mới | 307 / 12 / 136 / 11 | còn 1 ca test QA (If-Match cũ sau đổi mật khẩu) → sửa |
| **Cuối** | **mới** | **308 / 11 / 136** + logout **11 / 0 / 0** + ca mới BUG-R2-005 trượt + TC-X-050c đạt | số trong bảng trên |

## 3. Story Sprint 1 → TC → kết quả

| Story | TC / kiểm tra | Kết quả | Lỗi |
|---|---|---|---|
| **US-001** Đăng nhập tài khoản riêng | TC-NT-001 (A) cookie + getMe; TC-SEC-020 token mới; TC-NT-005 locked từ chối chung; TC-NT-043 (a) khóa sau 5 lần, (b) mở sau 15 phút (MutableClock); TC-NT-044 trùng tên đăng nhập; TC-NT-002 (A) 401 không lộ dữ liệu; RBAC `getMe`, `logout`, `changeMyPassword` (33 ca); UI: TC-NT-001 (E), TC-NT-002 (E) 3 URL sâu | **Đạt** | – |
| **US-002** Gán vai, thu hồi phiên, nhật ký từ chối | TC-NT-007 + TC-SEC-022(a) + TC-SEC-025 (mật khẩu tạm, đổi vai → mọi phiên 401); TC-SEC-022(b)(c) đặt lại/khóa; TC-NT-010 (A) MGR 403; TC-NT-008 biến thể S1 (audit `access.denied`); RBAC `listUsers/createUser/updateUser/setUserRoles` (44 ca); UI TC-NT-006 × 8 vai, TC-NT-010 (E) | **Trượt một phần** – vai bị cấm + body sai không ra 403/không ghi nhật ký | BUG-R2-005 (P1), BUG-R2-010 (P3), BUG-R2-011 (P3) |
| **US-003** Ẩn dữ liệu nhạy cảm theo vai | TC-L5-042 không có trường giấy tờ; TC-RB-010 phạm vi M (404 khách người khác, danh sách chỉ của mình); serializer trường theo vai – kiểm gián tiếp qua RBAC đọc `getGuest`/`searchGuests` (22 ca) | **Đạt** phần ẩn dữ liệu (không lộ id/tên) | (thiếu tín hiệu: BUG-R2-008) |
| **US-004** Danh mục căn | TC-NT-040(e), (e′) `MAX_OCCUPANCY_RANGE`; RBAC `listRoomGroups/listRooms/createRoom/updateRoom` (44 ca); UI H04: 10 căn, giá đêm BR-101 (101 → 667.000, 202 → 792.000) | **Đạt** phần S1; TC-NT-018/019/020/039/040a–d chờ đơn (Sprint 2) | createRoom thuộc BUG-R2-005 |
| **US-005** Tham số quy tắc | TC-NT-013 (MGR/owner), TC-NT-014 (FDL xem, vai khác không), TC-NT-015 lịch sử, TC-NT-041 + TC-SEC-028 tham số bảo mật, TC-NT-042 biên 9.1a; **TC-NT-012** trượt; RBAC `listParameters/getParameterHistory/setParameter` (33 ca); UI H05 chỉ cho chọn 12/24/48 | **Trượt** TC-NT-012; TC-NT-011 chờ giữ chỗ (S2) | BUG-R2-007 (P2) |
| **US-006** Nhật ký thao tác | TC-NT-008 (S1), TC-NT-017 (2)(3) phạm vi own; RBAC `listAuditEvents` (11 ca) | **Đạt** phần S1; TC-NT-016, 017(1) chờ thao tác tiền | thiếu `access.denied` ở BUG-R2-005 |
| **US-007** Yêu cầu duyệt | TC-NT-027 (hợp đồng: FD chỉ thấy của mình, 404); RBAC `listApprovalRequests/approveRequest/rejectRequest/cancelRequest` (44 ca) | **Đạt** phần chạy được; TC-NT-028…036, 030 chờ `requestFoc`/folio (Sprint 2–3) – SELF_APPROVAL_FORBIDDEN mới có test tầng A của BE | rejectRequest thuộc BUG-R2-005 |
| **US-071** Tạo/sửa hồ sơ khách | TC-L5-040, TC-L5-041 (chuẩn hóa SĐT/email), TC-L5-042, TC-NT-038 (giữ mã KH); RBAC `createGuest/updateGuest/getGuest` (33 ca); UI H06 tạo khách thật (KH-0065) | **Đạt** | thẻ FB-R2-QA-BE-04 (định dạng `+84`) |
| **US-072** Chặn trùng | TC-L5-043 (409 + existingGuestId với FD), TC-L5-044 (nghi trùng tên đảo + ngày sinh), TC-L5-046; UI: rời ô SĐT `+84…` → cảnh báo + khóa Lưu | **Đạt** với FD; SAL/CTV thiếu cảnh báo trước khi lưu | BUG-R2-008 (P2) |
| **US-073** Bộ chọn khách / tìm | TC-L5-045 (có/không dấu, ≥ 2 ký tự, ≤ 5); RBAC `searchGuests`, `lookupGuestByContact` (22 ca); UI H06 tìm "nguyen thu …" | **Đạt** | – |
| **US-087** (phần khách) CTV chỉ thấy của mình | TC-RB-010 | **Trượt** (chỉ phần tín hiệu "có thể trùng"; phần 404/danh sách đạt) | BUG-R2-008 |
| **US-135** Thao tác không đảo ngược / lý do | Gián tiếp: `reason` bắt buộc ở `setParameter` (TC-NT-015/041), lý do từ chối duyệt (RBAC reject) – chưa có thao tác hủy/no-show ở S1 | **Chưa đủ để kết luận** – chờ Sprint 2 | – |
| **US-142** Thiết bị được cấp | RBAC `listTrustedDevices/trustCurrentDevice/revokeTrustedDevice` (33 ca); UI H07 Thiết bị (checklist khóa nút, danh sách `qa-tablet-night`); thử tay: FD có mật khẩu đúng → 403 (không leo thang) | **Trượt** – vai bị cấm nhận 401/422 | BUG-R2-005 (P1) |
| Nền (health, CI, ảnh) | TC-X-050a/b/c; build ảnh api (đạt), ảnh web (hỏng); vitest admin-web | api **Đạt**; web/CI **Trượt** | BUG-R2-006 (P1), BUG-R2-009 (P2) |

## 4. Chưa test được / giới hạn
- **Playwright UI tự động** (project `desk-chromium`): chưa chạy vì máy không có trình duyệt Playwright (tải chromium cần quyền). Đã chạy tay đủ 11 ca cùng bước + kiểm H04–H07 với API thật. Đề nghị OPS/ORC cài `playwright install chromium` (hoặc chạy ở CI) – QA chạy lại tự động khi có.
- **Staging**: chưa có (BUG-R2-006 chặn ảnh web). Mọi kết quả trên là stack compose cục bộ.
- **Đồng hồ dùng chung**: TC-NT-043(b) tua MutableClock trong khi ca khác chạy song song → mốc thời gian lịch sử tham số bị lệch +15 phút (thấy ở H05 "16:49"). Không làm sai kết quả đạt/trượt lần này; QA sẽ tách ca tua đồng hồ sang project chạy tuần tự.
- Không chạy lại `vitest` của api (510 ca theo báo cáo BE) – cần DB test riêng; lỗi BUG-R2-005 cho thấy bộ đó thiếu ca âm.
- CSRF/Origin âm (TC-SEC-023) chưa có ca E2E riêng; gián tiếp: login thiếu Origin → 403 (thấy ở lần chạy 1).
- Hiệu năng, đa ngôn ngữ EN, khả năng truy cập (axe) chưa chạy ở Sprint 1.

## 5. Sửa của QA trong bước này (test, không phải code sản phẩm)
- `product/tests/e2e/support/api.ts`: `uniqName()` (tên chỉ chữ cái – V-01), `createThrowawayUser` dùng tên hợp lệ, `activateUser` lấy token mới sau `changeMyPassword`.
- `product/tests/e2e/rbac/sprint1-ops.ts`: tên tạm hợp lệ; `changeMyPassword` chấp nhận `401 REAUTH_FAILED`.
- `product/tests/e2e/api/identity.api.spec.ts`: TC-SEC-020 gửi `Origin`; TC-NT-007 đọc lại `version`; **ca mới** `TC-NT-008 (thứ tự kiểm, BUG-R2-005)`.
- `product/tests/e2e/api/guests.api.spec.ts` (TC-L5-041 chấp nhận `+84…`/`84…`), `api/audit-approvals.api.spec.ts` (TC-NT-017 so theo `actorName`).
- `product/tests/e2e/smoke/health.spec.ts` + `product/tests/README.md`: `E2E_COMPOSE_FILE/ENV_FILE/PROJECT` (BUG-R2-013), ghi chú `E2E_ORIGIN`.
- `tsc --noEmit` và `prettier --check e2e` xanh.

## 6. Kết luận QA (quyền QA)
Sprint 1 **chưa đạt** mức "đủ dùng" để coi là xong: còn **2 lỗi P1 Open** (BUG-R2-005 phân quyền, BUG-R2-006 ảnh web/staging) và 3 lỗi P2 Open. Phần lõi đăng nhập/phiên/khóa tài khoản, cổng vai (288/297 ca), hồ sơ khách và tham số bảo mật chạy đúng với API thật. QA test lại ngay khi BE/FE/OPS báo sửa.
