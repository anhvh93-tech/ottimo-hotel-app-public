# UXD – Round 2, Sprint 1: hi-fi cho Sprint 3 (H13–H18)

- Người viết: UXD | Bước 2 (Sản xuất) – Sprint 1 (UXD đi trước dev một sprint) | Ngày: 16/10/2026
- Việc giao: plan R2 mục 4 dòng Sprint 3 (EP03–EP05, EP15, EP06, guest-web check-in online) + chỉ đạo ORC trong Sprint 1 (áp specs BA EP03-05 / EP06: E05-07, E06-10, giả định G-1).
- Đầu vào: plan R2, backlog (AC sau R-C), OpenAPI **0.3.2-draft**, business-rules v0.3 (BR-402/403/411–417/421–428/431–436/511/521/525/527/602–613), SEC `w1-review.md` mục 4 (P-R2-4 ĐK-1…6), specs BA `EP03-05-stay.md`, `EP06-registration.md`, DS v0.3.1, wireframe R1 L3/L4/L7/L9/L10, DS-0.

## 1. Đã làm gì

### 1.1 Hi-fi `product/design/hifi/` – 6 màn mới
| Mã | Màn | Story chính | operationId chính |
|---|---|---|---|
| H13 | Nhận phòng: điều kiện BR-402 (+ `document_ok`), giấy tờ C3 trên thiết bị được cấp (QR CCCD / MRZ / nhập tay, step-up xem đủ), kiểm hạn hộ chiếu/thị thực **Đạt / Không đạt / Chưa kiểm được**, BR-613 (c) **R2 chặn nhận phòng** (FDL+ xác nhận nhận tiếp), khai báo + hạn BR-602/603, phụ thu nhận sớm chủ động (bấm thử), thêm đêm trước 06:00, thu tiền, **mã cửa nhập tay trên app TTLock** (không lưu trong OTTIMO), hoàn tác nhận phòng | US-025, 026, 043, 044, 045, 048, 119, 120, 135 | previewCheckIn, checkIn, undoCheckIn, addGuestDocument, updateGuestDocument, stepUp, getGuestDocumentSensitive, getDocumentImage, completeRegistrationReview |
| H14 | Giấy tờ & khai báo: danh sách theo hạn (quá hạn / khi nhận phòng / trước 23:00), đối chiếu xong + đồng ý lưu ảnh Có/Không không chọn sẵn, sao chép lên cổng (step-up, xóa bộ nhớ tạm), mã hồ sơ → gửi / xác nhận / từ chối, **rút đồng ý qua lễ tân (ĐK-5)**, xóa sớm ảnh (OWN/MGR) | US-042, 044–050, 135 | listRegistrations, getRegistration, recordImageConsent, getPortalData, transitionRegistration, purgeRegistrationImages |
| H15 | Lưu trú: drawer khách đang ở, gia hạn (đơn con OTA, tiết kiệm phí kênh), **trả muộn có ân hạn 12:30** (bấm thử, công tắc "có khách đến hôm nay"), đổi phòng (lý do, căn mới VI/VC), xác nhận giờ trả + thẻ BR-425 theo nhãn BA 4.4, phát sinh có bằng chứng | US-024, 028–032, 050 | getExtensionOptions, extendStay, setLateCheckout, changeRoom, recordCheckoutConfirmation, addFolioLine |
| H16 | Trả phòng 3 bước (minibar +/−, phụ phí, bill & thu tiền), **Phiếu thanh toán** in A5 VI hoặc VI–EN + USD tham khảo, **VietQR** đúng số tiền / nội dung OTM0139, ghi nhận **"Chờ đối soát"**, POS chỉ mã chuẩn chi, hóa đơn công ty, hoàn tất (BALANCE_DUE / PENDING_APPROVALS / chưa kiểm minibar), đối soát của quản lý | US-035–039, 119, 120, 135 | getCheckoutSummary, recordMinibarCheck, getBill, createVietQr, recordPayment, setInvoiceRequest, checkOut, reconcilePayment |
| H17 | Duyệt FOC: form gửi **không có ô chọn người duyệt**, tự áp minibar trong hạn mức (BR-436), hộp "Cần duyệt" của FDL với hạn mức còn lại, duyệt/từ chối bằng **mật khẩu (R2)**, escalated; **nhật ký tiền** (owner đủ, FD của mình, không có xóa) | US-007 AC1–AC6, US-006 | requestFoc, listApprovalRequests, approveRequest, rejectRequest, listAuditEvents |
| H18 | guest-web mức 1: trang lưu trú (chỉ tên, không tab Hóa đơn, không mã cửa, Wi-Fi từ ngày nhận), check-in online thông báo → Giấy tờ → Giờ đến → Xác nhận (≤ 3 bước), không hiện lại ảnh/số, không lưu ảnh trên máy, đồng ý chỉ hỏi Khách 1, dòng rút đồng ý qua lễ tân, trang đã đóng / đã trả phòng / link hết hạn | US-106, 107, 108 (trừ mã cửa), 112, 045 AC3 | openGuestSession, getGuestStay, getOnlineCheckin, updateOnlineCheckin, uploadGuestDocument, recordGuestConsent, completeOnlineCheckin |

Mỗi màn có khung đặc tả Story/AC · operationId (0.3.2) · Problem.code · hành vi/a11y; khung chính có đủ 5 trạng thái (bình thường / tải / rỗng / lỗi / mất mạng) trên thanh công cụ; sáng/tối qua token; VI/EN. Không có RTL (theo giao việc). `index.html` thêm 6 dòng + dữ liệu mẫu ngoài DS-0.

### 1.2 Áp chỉ đạo ORC / specs BA (E05-07, E06-10, G-1)
- BR-613 (c) ở R2 = **chặn nhận phòng** (nút Nhận phòng khóa, FD "Gửi lễ tân trưởng xác nhận", FDL+ xác nhận nhận tiếp có lý do); điều kiện `checkin.cond.document_ok`; thêm kiểm `passport_valid_at_arrival`, `entry_record_present`.
- 3 nhãn kết quả hệ thống `checkin.verify.result.pass/fail/unknown` = Đạt / Không đạt / Chưa kiểm được.
- Sửa chuỗi: `guest.oci.done_body` → "Phòng sẵn sàng từ {time}. Lễ tân sẽ giao mã cửa khi bạn đến." (ĐK-6); `pay.card` → "Thẻ (máy POS tại quầy)"; `approval.pin_title/label`, `error.REAUTH_FAILED` → mật khẩu; `checkout.complete_confirm_body` bỏ mã cửa, thêm thu hồi bộ đồ dùng thêm; **xóa** `handover.foc_approver`. H18 không dùng `guest.verify.*`, `guest.door_code*`, `guest.late.*` (mã cửa), `guest.tab.bill`, `guest.bill.*`.
- Chuỗi mới theo specs: `checkin.kit_not_ready`, `checkin.prior_night(_unavailable)`, `pay.pending_reconcile`, `pay.bank_transfer`, `error.SELF_RECONCILE_FORBIDDEN`, `field_error.evidence_required/minibar_over_standard/doc_number`, `guest.oci.withdraw_hint/companions_at_desk/closed_desk`, nhãn thẻ khách đi (4.4 – không dùng "Đã nhắc"), cấp lại/thu hồi link, cảnh báo thị thực, "phát sinh sau trả phòng", "Đã khai trên cổng…", "Ảnh đã xóa lúc…", "Đã chọn qua app lúc…".

### 1.3 Design System + chuỗi + công cụ
- `hifi.css` mục 12: `.conds`, `.chk3` (ok/fail/unknown viền đứt/block), `.lock-box`, `.person`, `.masked`, `.bill-paper` (+ `@media print`), `.wiz-foot`, `.chip.recon`, `.upload-slot`, `.choice` – chỉ token.
- `hifi.js`: `[data-sur]` bấm thử phụ thu (BR-411/412/414/417, ân hạn 12:30, làm tròn 1.000 đ) và `[data-enables]` (tick → mở nút). Đã thử trên trình duyệt: trả muộn 201 (708.000) 12:20/12:30 → 0; 12:31, 15:00 → 212.000; 17:00 → 354.000; 19:00 → gia hạn; có khách đến 12:20 → 212.000; nhận sớm 103 (750.000) 14:00 → 0, 11:00 → 225.000, 08:00 → 375.000, 05:30 → thêm đêm; đổi EN chạy đúng, không có chuỗi dự phòng; không lỗi console.
- Icon mới `printer`, `cash`, `scan`.
- `design-system.md` v0.3.2: 6.4 bổ sung BR-613 R2, mẫu **6.16** (phụ thu chủ động, mã cửa ngoài app, chờ đối soát, duyệt bằng mật khẩu), **6.17** (guest-web mức 1).
- **363 chuỗi VI/EN mới** (nhóm "R2 hi-fi Sprint 3", tổng 1486 + 8 mẫu tin), sinh lại `copy/strings-*.json`, `wireframes/assets/strings.js`; content-guide mục 8 sinh lại + lịch sử 0.3.2.

## 2. Kiểm tra
| Kiểm | Kết quả |
|---|---|
| `python3 product/design/tools/check_hifi.py` | 19/19 trang ✓, 0 lỗi cú pháp/tham chiếu, mọi key có VI + EN, chữ HTML khớp chuỗi VI |
| `python3 product/design/tools/gen_tokens.py` | `fails: 0` |
| `python3 product/design/tools/gen_strings.py` | 1486 chuỗi + 8 mẫu |
| Trình duyệt (server tĩnh cục bộ) | Bộ tính phụ thu H13/H15 đúng ví dụ BR-411/412/415; EN đổi đủ; 0 lỗi console. Chưa đo VoiceOver, phóng chữ 200% (UXR test R2). |

## 3. Giả định (UXD tự quyết – ORC ghi decision-log khi commit)
1. R2 bước "Giao mã" = hướng dẫn tạo mã 6 số trên app TTLock + ô tick "Đã tạo mã và giao cho khách" (chỉ là kiểm tra trên màn, **không lưu** vì `setDoorCredential` dời R3); trả phòng / đổi phòng / hoàn tác hiện "tạo việc Xóa mã trên app khóa" `[GIẢ ĐỊNH UXD – cần BE xác nhận có sinh việc này không]`.
2. Ví dụ trả phòng dùng OTM-0139 "Agoda trả tại chỗ", 820.000/đêm, Coca 25.000 để khớp US-037 AC1 (2.485.000); tỷ giá 26.300, số phiếu F26-000123, tài khoản Techcombank thử là ví dụ (index mục 4).
3. Tên khách DS-0 bổ sung (Anna/Lucas Martin, Kim Seo-yeon) và giờ nhận 21:30 14/10 của 402 là dữ liệu minh họa.
4. Màn thông báo xử lý dữ liệu của check-in online không tính là bước nhập (giữ ≤ 3 bước); văn bản thông báo là bản nháp – SEC/luật sư duyệt câu chữ (ESC-001 đã quyết: luật sư rà trước dữ liệu thật).
5. Giờ đến chọn theo khung 2 giờ (14–16, 16–18, 18–22, sau 22:00) `[GIẢ ĐỊNH UXD]` – API nhận `etaTime` một giờ; MOB gửi giờ đầu khung.

## 4. Rủi ro / vướng mắc – cần vai khác (thẻ sẽ ghi ở bước review)
| # | Vấn đề | Gửi | Đề xuất |
|---|---|---|---|
| 1 | `GuestDocumentMasked.checks[].result` chỉ có `ok/warning/not_applicable` – không phân biệt **Không đạt** với **Chưa kiểm được** (HR-07, US-044 AC2) | ARC | Thêm `fail` + `unknown` (hoặc `missing_data`), giữ `not_applicable` |
| 2 | Chưa có operation liệt kê giao dịch "chờ đối soát" toàn cơ sở, lọc ngày + người ghi (US-119 AC6) – H16 16.6 cần | ARC/BE | `GET /payments?reconciliation=pending&dateFrom&recordedBy` (MGR/OWN) |
| 3 | E03-01 (`document_check_block`, `warnings[]`, `documentBlockOverride`), E03-05 (`addPriorNight`), E06-06 (`notice`), E05-03 (`SELF_RECONCILE_FORBIDDEN`) chưa có trong 0.3.2 – giao diện đã chừa chỗ | ARC | Chốt trước Sprint 3 |
| 4 | Không có chỗ ghi "đã giao mã/thẻ" ở R2 (giả định 1) – lễ tân có thể quên tạo/xóa mã | PO/BE | Hoặc thêm `checkIn.doorHandover {method, cardsIssued}` (không chứa mã), hoặc chấp nhận tick cục bộ ở R2 |
| 5 | Chuỗi R1 còn hứa mã cửa trên app (`handover.door_code_help`, `guest.late.*`, mẫu 6.11) – giữ cho R3, R2 không dùng | MOB/FE | Không dùng ở R2; QA kiểm guest-web R2 không có các key này (ĐK-6) |

Không có ESC mới (mọi việc trong quyền UXD hoặc chuyển vai khác).

## 5. Việc chưa xong
- Hi-fi Sprint 4: PWA buồng phòng (việc, checklist, sự cố, hàng đợi offline), phiếu sửa, yêu cầu khách + định tuyến, Tổng quan + "Cần chú ý" (SSE) – phải xong trước tuần 8.
- Trả sớm (US-137 – Should) chưa vẽ hi-fi (dùng wireframe L9 nếu PO kéo vào).
- Kiểm VoiceOver / phóng chữ 200% / mô phỏng mù màu trên bản build (review UXD-on-FE, UXD-on-MOB).

## Phụ lục – Review FE (bắt buộc UXD → FE) và chuyển chuỗi pending (16/10/2026)
- Đã làm: review admin-web H01–H07 + `packages/ui`, `packages/i18n` → `rounds/round-02/reviews/UXD-on-FE.md` (0 Blocker · 4 Major · 9 Minor · 3 Suggestion). Dev server mock chạy được nhưng MSW không đăng ký được trong Browser pane → review bằng đọc mã + chạy test.
- Chuỗi: chuyển 71 khóa `packages/i18n/src/pending.{vi,en}.json` vào `gen_strings.py` (chỉnh 9 câu); sửa `auth.login.username`, `error.REAUTH_FAILED` (bỏ `{left}`), `error.REAUTH_REQUIRED`, `device.grant_confirm`; thêm 24 `params.k.*`, `common.error_network_body`, `login.hide_password`, `common.vnd_unit`, `shell.main_nav`. Tổng 1585 chuỗi + 8 mẫu; content-guide mục 8 sinh lại, lịch sử 0.3.3.
- Hi-fi: H01 (bỏ ô "Giữ đăng nhập", ví dụ `hanh.fd`, nhãn Tên đăng nhập), H07, H17 theo chuỗi mới.
- Kiểm: `gen_strings.py` 1585 + 8 ✓; `check_hifi.py` 19/19 ✓; `gen_tokens.py` fails 0; admin-web test 62/64 (2 đỏ do nhãn đăng nhập – thẻ FB-R2-UXD-FE-01); i18n test 1 đỏ (khóa pending trùng – chờ FE xóa pending).
- File: `product/design/tools/gen_strings.py`, `tools/strings-tables.md`, `copy/strings-{vi,en,ru}.json`, `wireframes/assets/strings.js`, `content-guide.md`, `hifi/01-login.html`, `hifi/07-users-devices.html`, `hifi/17-approvals-moneylog.html`, `01-decisions/decision-log.md`.
