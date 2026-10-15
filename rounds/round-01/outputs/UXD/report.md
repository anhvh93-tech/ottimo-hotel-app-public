# Báo cáo UXD – Round 1 · Bước 2 (Sản xuất) · Đợt 2

- Người viết: UXD | Ngày: 15/10/2026
- Việc được giao: `rounds/round-01/plan.md` mục 3.1 (dòng UXD) và mục 3.3 (8 luồng wireframe).

> Ghi chú ORC: UXD không ghi được file này (bị chặn quyền khi chạy nền); ORC ghi lại nội dung UXD gửi, với sự đồng ý của INV. Các dòng decision-log đề xuất đã được ORC ghi vào `01-decisions/decision-log.md`.

## 1. Đã làm gì

1. **Design System OTTIMO v0.1** (`product/design/design-system.md` + `tokens.json`)
   - Giữ nhận diện kem – gỗ sồi, Lora + Be Vietnam Pro (tự host, SIL OFL – miễn phí, không cần ESC). Màu nền/bề mặt/thương hiệu `--oak` giữ nguyên.
   - Token màu **sáng + tối** đo tương phản WCAG 2.2 bằng script: **33 cặp chữ/UI × 2 chế độ (+2 cặp đo bổ sung), 0 cặp không đạt**. Sửa theo checklist `heuristic-review-r0.md` mục 3–4: `--faint` 2,65:1 → 5,15:1 (giá trị cũ đổi thành `--deco`, chỉ trang trí), `--oak-ink`/`--oak-soft` 4,18 → 5,04, `--warn`/`--warn-bg` 4,31 → 5,27, viền focus 2,72 → 5,44 (token `--focus` mới), `--muted` trên sidebar 4,49 → 5,07; thêm `--line-strong` (viền ô nhập ≥ 3:1), `--ink-inverse`.
   - Thang chữ (tối thiểu 12px máy tính, 16px điện thoại, 16–17px buồng phòng), lưới 4px, bo góc, vùng chạm (32/44/48px), chuyển động, breakpoint.
   - **30 component**, **10 mẫu tương tác bắt buộc**, bảng trạng thái tải/rỗng/lỗi/mất mạng, **15 quy tắc a11y** ánh xạ từng mục BL 8.3 + HR.
   - Màu/icon/hoa văn cho trạng thái đơn theo đúng tên DOM (`hold, confirmed, in_house, checked_out, cancelled, no_show`; OOO là khối chặn), 7 trạng thái buồng, 9 trạng thái khai báo (BR-607).
2. **Wireframe HTML tĩnh 8 luồng + index** (`product/design/wireframes/`), mở trực tiếp bằng trình duyệt. Có công tắc Trạng thái (Bình thường/Đang tải/Rỗng/Lỗi/Mất mạng), Sáng/Tối, Ngôn ngữ (L7). Mỗi trang có chú thích đánh số, mã US/BR/HR và ghi chú phân quyền.
   - Trạng thái tải/rỗng/lỗi/mất mạng: **có ở cả 8 luồng**.
   - Buồng phòng (L6) có giao diện mobile riêng: nút ≥ 48px (nút chính 56px), chữ ≥ 16px, câu thường thay mã VC/VD, hoàn tác 10 giây, thao tác được khi mất mạng.
   - **Khắc phục 4 Blocker của UXR**: HR-01 (app khách đổi VI/EN/RU thật), HR-04 (phụ thu = 0 tới khi lễ tân bật và xác nhận), HR-06 (xác nhận phá hủy có hậu quả cụ thể, lý do bắt buộc), HR-07 (kiểm tra 3 trạng thái Đạt / Không đạt / Chưa kiểm được).
   - Xử lý thêm 12/12 Major (HR-02, 03, 05, 08, 09, 10, 11, 12, 13, 14, 20, 21) và các Minor HR-16, 17, 18, 19, 22, 24.
   - Đã xem hiển thị trong trình duyệt; 9 file HTML kiểm cú pháp thẻ không lỗi.
3. **Nội dung chữ** (`product/design/content-guide.md` + `copy/strings-{vi,en,ru}.json`): giọng văn, chính tả, bảng thuật ngữ khớp tên trạng thái DOM, định dạng tiền–ngày–giờ VI/EN/RU, mẫu lỗi/xác nhận/rỗng/mất mạng, quy tắc i18n; **318 chuỗi VI/EN**; cột RU chừa chỗ (thiếu thì hiện EN); **7 mẫu tin nhắn VI/EN/RU** (bản RU là nháp, cần người bản ngữ duyệt).
4. Công cụ sinh lại (`product/design/tools/`): `gen_tokens.py` (tokens.json + tokens.css + kiểm tương phản), `gen_strings.py` (JSON chuỗi + strings.js).

## 2. File tạo/sửa
Chỉ tạo mới, không sửa file của vai khác:
- `product/design/design-system.md`, `tokens.json`, `content-guide.md`
- `product/design/copy/strings-vi.json`, `strings-en.json`, `strings-ru.json`
- `product/design/wireframes/index.html`, `01-login-role-nav.html` … `08-owner-overview.html`
- `product/design/wireframes/assets/tokens.css`, `wf.css`, `wf.js`, `icons.js`, `strings.js`
- `product/design/tools/gen_tokens.py`, `gen_strings.py`
- `rounds/round-01/outputs/UXD/report.md` (file này)

## 3. Giả định
Quyết định thuộc quyền UXD (đã ghi decision-log): Design System v0.1 + chuẩn tương phản; ba mật độ giao diện Desk/Touch/HK; giao diện buồng phòng dùng câu thường; các mẫu tương tác bắt buộc; chính tả và cách gọi "Phiếu thanh toán"/"Hóa đơn", không in "FOC" trên giấy tờ khách; font tự host, chữ Nga dùng font hệ thống; app khách xưng "bạn"/"Вы".

Giả định làm việc (chờ xác nhận ở đợt 4 hoặc bởi vai khác):
- **Phân quyền** vẽ theo cột "Không được thấy" ở PRD mục 4 vì `rbac-matrix.md` chưa có lúc vẽ. Điểm cần đối chiếu: CTV xem "Căn trống" có ẩn tên khách; buồng phòng có thấy tên khách đang ở; ai xác nhận cọc/ký quỹ; quản lý có bị ẩn P&L; ai ghi ngoại lệ khi kiểm giấy tờ "Không đạt".
- Số tiền trên wireframe là ví dụ tính đúng từ BR; số dài hạn và ADR/RevPAR để "… đ".
- Mã lỗi minh họa và dạng mã hồ sơ khai báo là ví dụ – ARC/INT chốt định dạng thật.
- Mất mạng: máy quầy chỉ xem, buồng phòng thao tác offline (khớp ADR-005 của ARC).
- Khai báo lưu trú bán tự động, thứ tự trường thật cần INT/lễ tân kiểm chứng trên cổng.
- Mẫu tin nhắn ghi "14:00 / 12:00" để dễ đọc; FE thay bằng biến từ tham số BR-401.

## 4. Rủi ro / vướng mắc
| # | Rủi ro | Ảnh hưởng | Đề xuất |
|---|---|---|---|
| R1 | RBAC chưa có khi vẽ | Có thể phải ẩn/hiện lại nút, trường (QC B2) | Đợt 4 đối chiếu `rbac-matrix.md`; chỗ phụ thuộc đã đánh dấu "Theo vai" |
| R2 | Bản dịch EN/RU văn bản pháp lý là bản của AI | Sai nghĩa pháp lý | Người dịch/luật sư duyệt trước R2 (gắn ESC-001) |
| R3 | Be Vietnam Pro không có Cyrillic | Chữ Nga khác font | Kiểm ở R3; dự phòng font OFL có Cyrillic |
| R4 | Persona buồng phòng tin cậy thấp | L6 có thể không được dùng | INV cho 1 người buồng phòng thử L6 trước R2 (H-05, ESC-003) |
| R5 | Wireframe chưa test với người thật | Ưu tiên có thể sai | UXR test kịch bản ở R2 |
| R6 | Chưa có logo chính thức | Nhận diện có thể không khớp | Đề xuất ESC logo (đã chuyển PO gom) |

**Đề xuất ESC – Logo chính thức OTTIMO** (Bình thường): A dùng chữ "OTTIMO" Lora giãn chữ (đề xuất, 0 đồng); B INV gửi file logo gốc; C thuê thiết kế. Chưa trả lời thì dùng A, không chặn R2.

## 5. Việc chưa xong
- Review bắt buộc UXD → UXR (bước 3).
- Đợt 4: chỉnh wireframe theo `rbac-matrix.md` và `openapi.yaml`; cập nhật tên trường/định dạng mã theo ERD.
- Chưa vẽ: modal Gia hạn, Trả muộn; Đổi phòng; màn Kênh OTA, CRM, kho F&B; chốt điện nước.
- Tiếng Nga đầy đủ cho app khách (R3, US-115).
- `screens/<luồng>.md` sẽ tách ở R2 nếu FE/MOB cần.
- Kiểm a11y bằng trình đọc màn hình thật và mô phỏng mù màu: cùng QA ở bước 5.

---

# Đợt 4 – Chỉnh wireframe theo RBAC, máy trạng thái, ERD, API, yêu cầu bảo mật

- Người viết: UXD | Ngày: 15/10/2026 | Việc giao: plan R1 mục 4 (đợt 4, UXD) + báo cáo đợt 2 mục 5; bổ sung giữa đợt của ORC (SEC Phần 2: SR-AUTH, SR-DEV, SR-GST).
- Đầu vào đã đối chiếu: `rbac-matrix.md`, `state-machines.md`, `erd.md` (mục 5, 7, 10, 4.7), `api/openapi.yaml` (37 mã lỗi, `allowedActions`, `x-visible-to`, `dryRun`), `architecture.md` mục 8, backlog US-024, US-133…US-139, decision-log, `security/security-requirements.md`.

## Đ4.1 Đã làm gì

1. **Đối chiếu 8 wireframe + thêm luồng L9** (`09-stay-changes.html`): Gia hạn (đơn OTA tạo đơn con), Trả muộn (dryRun, cảnh báo khách đến, biến thể gửi quản lý duyệt), Đổi căn/đổi ngày + gán căn đơn OTA xung đột, Đổi phòng (US-024, Must R2), Không đến + khôi phục (US-136), bộ 7 hộp xác nhận không đảo ngược (US-135). Mỗi khung có Đang tải/Rỗng/Lỗi/Mất mạng ở các modal chính.
2. **Phân quyền (QC B2)**: dùng 9 mã vai `owner/manager/front_desk_lead/front_desk/housekeeping/maintenance/sales_staff/collaborator` + khách. Bỏ mọi nút/trường mà vai bị cấm; vẽ biến thể theo vai bằng nhãn vai (rack buồng phòng/bảo trì và sale/CTV, drawer CTV, giữ chỗ sale nội bộ vs CTV, ô khóa phòng, ADR/RevPAR, cảnh báo FOC, ghi công nợ, PIN duyệt). Thêm **bảng nút theo trạng thái × vai** (`allowedActions`, L2 mục 2.6).
3. **Máy trạng thái**: tên trạng thái và nhãn theo SM-01/03/05/06/10/11/15; sửa 2 lỗi vẽ đợt 2: (a) buồng phòng "Dọn xong" nhảy thẳng "Sẵn sàng" → nay `CL → VC` "Sạch – chờ kiểm", `VI` do lễ tân trưởng kiểm (R3/R4); (b) kiểm giấy tờ "Không đạt" chặn và chỉ quản lý ghi ngoại lệ → nay không chặn, lễ tân trở lên ghi "Cách xử lý" bắt buộc (K5, SEC R-REG-03).
4. **ERD/API**: mã chứng từ đúng định dạng (`OTM-00171`, `BG-00049`, `WO-00031`, `HD-00012`, `PT-000231`, `F-261015-0003` cấp khi hoàn tất trả phòng, VietQR = mã đơn bỏ gạch); làn **"Chưa gán căn – xung đột OTA"** trên rack, chưa gán thì không có nút Nhận phòng (`RESERVATION_UNASSIGNED`); bỏ mọi mã lỗi minh họa (RK-503, CO-MB-502, QT-500, CM-500, HK-500, OV-500) → lỗi máy chủ dùng `requestId`, lỗi nghiệp vụ dùng 37 `Problem.code`; ghi tên trường/operation API cạnh từng form.
5. **Bảo mật (SEC Phần 2, theo tin nhắn ORC)**: L1 thêm bước 2FA TOTP (owner/manager) và màn "Thiết bị được cấp" (cấp quyền trên chính máy + mật khẩu/TOTP + checklist, thu hồi có xác nhận, chỉ owner); L3 thêm trạng thái `DEVICE_NOT_TRUSTED` thân thiện, ghi chú PWA không bao giờ hiện C3, modal "Cấp mã xác minh cho khách" (nút cũng có ở drawer L2); L7 thay xác minh "4 số cuối SĐT" bằng **OTP email 6 số / mã lễ tân** (email che, đếm ngược gửi lại, còn N lần, khóa sau 5 lần, giới hạn 3 lần gửi/giờ, hết phiên 30 phút) và màn **ân hạn 24 giờ sau trả phòng** (chỉ tab Hóa đơn).
6. **Nội dung chữ**: `gen_strings.py` 318 → **522 chuỗi** (+204, sửa 10): nhóm vai, 37 `error.<CODE>` + `error.server` + `error.DEVICE_NOT_TRUSTED`, L9, xác nhận US-135, buồng phòng, duyệt SM-10, hoa hồng SM-11, bảo mật (TOTP, thiết bị, mã xác minh, OTP khách). `content-guide.md` v0.2: bảng tên vai 3.1b, 5 thuật ngữ mới, mục 5.2b hiển thị lỗi API, bảng chuỗi mục 8 sinh lại. `design-system.md` v0.2: màu trạng thái mới, C31 Code input, C32 Code display (32 component), sửa mẫu 6.1/6.4/6.9 và bảng trạng thái mục 7.
7. **Kiểm**: 10 file HTML qua bộ kiểm thẻ đóng/mở + trùng `id` – 0 lỗi; 3 file JSON chuỗi hợp lệ (VI/EN 530 khóa, RU 28). Chưa xem lại hiển thị trên trình duyệt ở đợt này (Browser pane không mở được file cục bộ) – xem Đ4.6.

## Đ4.2 Trả lời 5 điểm đợt 2 cần đối chiếu (theo `rbac-matrix.md`)

| # | Câu hỏi đợt 2 | Kết luận (nguồn) | Đã sửa ở |
|---|---|---|---|
| 1 | CTV xem "Căn trống" có ẩn tên khách? | **Có ẩn.** `sales_staff`/`collaborator` chỉ thấy căn – đêm còn/hết; không tên khách, kênh, giá đơn người khác; API không trả `guestDisplayName` (S03 ghi chú 3, `RackBar` `x-visible-to`). Khóa phòng hiện "Không bán", không nêu lý do. Đơn của chính mình vẫn thấy tên | L2 mục 2.4, L5 |
| 2 | Buồng phòng có thấy tên khách? | **Chỉ tên gọi + số căn**, chỉ với căn có việc hôm nay của mình (D01 "Tên+căn (T)"); căn sắp có khách đến chỉ "Có khách đến hôm nay 14:00", không tên. `maintenance` không thấy tên ở bất kỳ đâu (D18) | L2 2.4, L6 |
| 3 | Ai xác nhận cọc/ký quỹ? | `owner`, `manager`, `front_desk_lead`, `front_desk`, `sales_staff` (đơn của mình) – A04/B4. **CTV không được**, chỉ "Báo đã chuyển cọc" kèm ảnh (A53, `createDepositNotice`); lễ tân/sale nội bộ xác nhận | L2 drawer CTV, L5 (2 khung) |
| 4 | Quản lý có bị ẩn P&L? | **Không.** `manager` thấy P&L, báo cáo kênh, doanh thu, giá vốn (S20, S21). Chỉ khác `owner`: không có Người dùng & vai (A100), không sửa hạn mức FOC/tỷ lệ hoa hồng/phí kênh (A102), không nhận cảnh báo thất thoát FOC (BR-435), không cấp thiết bị (trừ khi owner bật) | L1 1.2, L8 |
| 5 | Ai ghi ngoại lệ khi kiểm giấy tờ "Không đạt"? | **Mọi vai `front_desk` trở lên**, bằng ô "Cách xử lý" bắt buộc cho từng mục (K5, `warningNotes`); cảnh báo **không chặn** nhận phòng (SEC R-REG-03). Đợt 2 vẽ "chỉ quản lý" – đã bỏ | L3 3.2, design-system 6.4 |

## Đ4.3 Bảng thay đổi đợt 4

| Luồng | Thay đổi | Lý do / nguồn |
|---|---|---|
| Mọi luồng | Mã lỗi minh họa → `requestId` (5xx) và `Problem.code` (nghiệp vụ); chuỗi `error.*` | openapi info (RFC 9457, 37 mã) |
| Mọi luồng | Mã chứng từ theo ERD; số phiếu `F-yymmdd-nnnn` chỉ cấp khi `settled`; VietQR = mã đơn bỏ gạch | erd mục 10 |
| Mọi luồng | Nhãn biến thể theo mã vai; nút = `allowedActions`, `requiresApproval` → "Gửi … duyệt" | rbac mục 3–6, US-020 |
| L1 | Bảng 5 nhóm → 9 mã vai (trang chủ, menu, khác vai gần nhất, không thấy); 2FA TOTP; màn Thiết bị được cấp (1.4); lỗi `RATE_LIMITED` | rbac mục 1; SR-AUTH-04/06, SR-DEV-01…07 |
| L2 | Làn "Chưa gán căn" + cảnh báo đỏ; rack rút gọn cho HK/MT và SAL/CTV (2.4); drawer thêm Gia hạn giữ chỗ, Cấp mã xác minh, biến thể CTV; bảng trạng thái × vai (2.6); trường API của form đặt phòng; nút giữ chỗ theo `hold.expiresAt` | erd 7, US-139; rbac S03, A03, A04, A53; SR-GST-07b |
| L3 | Bảng điều kiện nhận phòng (4 mã) + biến thể buồng chưa sẵn sàng FD (gửi duyệt) / FDL (tự xác nhận); "Không đạt" không chặn + ghi xử lý bắt buộc; đồng ý lưu ảnh chọn Có/Không; bỏ định dạng mã hồ sơ giả; nút xóa clipboard; trạng thái `DEVICE_NOT_TRUSTED`; modal mã xác minh khách (3.5) | state-machines B9, K5–K6; rbac A12, ghi chú 30–31; SR-DEV-03/04, SR-GST-07b |
| L4 | Số phiếu cấp khi hoàn tất; `PAYMENT_NOT_CONFIGURED`; "Ghi công nợ" chỉ MGR+; `BALANCE_DUE`/`PENDING_APPROVALS`; HĐ `settling → closed`, duyệt quyết toán MGR+ | erd 10; rbac A19, A57; SM-06 |
| L5 | Khung sale nội bộ (xác nhận ký quỹ) và CTV (báo đã chuyển cọc); "OTTIMO còn lại" chỉ sale nội bộ; thời gian giữ theo `hold_hours_options`; nhãn hoa hồng SM-11 | rbac ghi chú 20, 34; SM-11; openapi `createHoldFromQuote` |
| L6 | Dọn xong → "Sạch – chờ kiểm"; tự kiểm khi bật ca 1 người; bỏ ô khóa phòng với HK; tên gọi khách; "Khách không muốn dọn"; offline có `Idempotency-Key` | SM-03 R3/R4; rbac A81, A83, A86, D01 |
| L7 | Xác minh mức 2 bằng OTP email / mã lễ tân (bỏ 4 số cuối SĐT); khóa, giới hạn gửi; ân hạn 24 giờ sau trả phòng; đồng ý lưu ảnh 2 lựa chọn; 5 nhãn trạng thái yêu cầu SM-15 | SR-GST-07…11; R-CON-01; SM-15 |
| L8 | Công suất 60% → 67% (6/9); mục đỏ đơn OTA chưa gán; cảnh báo FOC chỉ owner; ADR/RevPAR chỉ owner/manager; hộp duyệt PIN (8.2) | US-010 AC1, US-139, BR-435; rbac S02, S21; SR-AUTH-09 |
| L9 (mới) | Gia hạn, trả muộn, đổi căn/gán căn, đổi phòng, không đến + khôi phục, 7 hộp xác nhận | US-024, 028, 029, 135, 136; SM-01 B7, B11–B15 |
| Design System | v0.2: màu trạng thái mới, C31–C32, mẫu 6.1/6.4/6.9, mục 7 | như trên |
| Nội dung chữ | v0.2: 522 chuỗi; bảng vai; mục 5.2b lỗi API | như trên |

## Đ4.4 File tạo/sửa (đợt 4)
- Tạo: `product/design/wireframes/09-stay-changes.html`
- Sửa: `product/design/wireframes/index.html`, `01-login-role-nav.html` … `08-owner-overview.html`, `assets/wf.css` (thêm lớp làn xung đột, `unavailable`, nhãn vai), `assets/strings.js` (sinh lại)
- Sửa: `product/design/tools/gen_strings.py`; sinh lại `product/design/copy/strings-vi.json`, `strings-en.json`, `strings-ru.json`
- Sửa: `product/design/design-system.md` (v0.2), `product/design/content-guide.md` (v0.2)
- Sửa: `rounds/round-01/outputs/UXD/report.md` (thêm phần này, giữ đợt 2)
- Không sửa file của vai khác, decision-log, 02-escalations.

## Đ4.5 Giả định và đề nghị cho vai khác
- Không có ESC mới. Mọi thay đổi thuộc quyền giao diện/nội dung của UXD hoặc theo tài liệu đã có.
- Quyết định UXD đề nghị ORC ghi decision-log: (1) lỗi máy chủ hiện "mã tham chiếu" = `requestId`, lỗi nghiệp vụ hiện theo `error.<CODE>`; (2) Design System v0.2 thêm C31 Code input (một ô, `one-time-code`) và C32 Code display; (3) "Dọn xong" của buồng phòng hiển thị "Sạch – chờ kiểm".
- **ARC**: (a) thêm `DEVICE_NOT_TRUSTED` (403) vào bảng mã `openapi.yaml` (hiện 37 mã, SR-DEV-03 cần mã thứ 38); (b) schema `verifyGuestSession` còn `phoneLast4`/`bookingCode` – cần đổi sang OTP email + mã lễ tân, thêm endpoint gửi OTP và cấp mã xác minh (SR-GST-07); (c) chưa có endpoint màn Hoa hồng (US-087 Must R2) và cấp/thu hồi thiết bị, 2FA – UXD đã vẽ, chờ API.
- **DOM/BA**: theo K5 + SEC R-REG-03, hộ chiếu hết hạn trước ngày trả phòng **không chặn** nhận phòng, chỉ bắt ghi xử lý. Nếu DOM muốn chặn hoặc bắt lễ tân trưởng duyệt, chỉ cần đổi nút "Tiếp tục" thành "Gửi duyệt" – UXD sửa trong R2.
- Giữ nguyên giả định đợt 2: số liệu minh họa khớp ví dụ BR (BR-309 350.000/350.000, BR-412 30%, BR-421 1.042.000); ADR/RevPAR, kỳ thu dài hạn để "… đ"; nhãn mức độ phiếu "Gấp / Trong ngày / Không gấp" = `high/medium/low`.

## Đ4.6 Rủi ro / việc chưa xong
| # | Nội dung | Đề xuất |
|---|---|---|
| R7 | Chưa xem lại hiển thị trình duyệt cho các phần mới đợt 4 (chỉ kiểm cú pháp) | UXD hoặc QA mở `index.html` ở bước 3 (review) – kiểm làn xung đột và bảng 2.6 ở màn hẹp |
| R8 | Chuỗi mới (+204) chưa có RU; chuỗi pháp lý/bảo mật EN chưa qua người dịch | Gắn ESC-001 như đợt 2; RU ở R3 (US-115) |
| R9 | API chưa có các endpoint bảo mật mới (OTP, thiết bị, 2FA) – tên trường trong wireframe là dự kiến | ARC cập nhật OpenAPI; UXD đối chiếu lại ở R2 |
| – | Chưa vẽ: Trả sớm (US-137 Should – chỉ có nút trong bảng 2.6), màn Kênh OTA, CRM gộp hồ sơ (chỉ có hộp xác nhận), kho F&B, chốt công tơ, màn yêu cầu dữ liệu cá nhân US-133/134 (R3) | R2/R3 theo backlog |
