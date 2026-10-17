# Đặc tả mức trường – EP06 Giấy tờ, đối chiếu, khai báo lưu trú + check-in online mức 1 trên guest-web (phần R2)

- Tác giả: BA | Round 2 – Sprint 1 (đi trước Sprint 3 một sprint) | Ngày: 16/10/2026 | Phiên bản: 0.3 (Sprint 3 Phản hồi & sửa: BR v0.3.4, DOM s3, OpenAPI 0.3.6 bổ sung)
- Phạm vi (Must R2 theo R-C): EP06 – US-042, 043, 044, 045, 046, 047, 048, 049, 050 · US-142 (phần dùng ở màn giấy tờ) · **guest-web check-in online mức 1**: EP14 – US-106, US-107, US-112 (phần trang check-in). *Ghi chú*: phiếu giao việc gọi phần này là "EP15 phần R2"; trong backlog check-in online thuộc **EP14** (US-106/107/112) – EP15 (US-119/120) nằm ở `EP03-05-stay.md`.
- Ngoài phạm vi / dời: US-051 quét QR CCCD/MRZ (Should R3); US-133, US-134 quyền chủ thể dữ liệu (R3); **US-141 xác minh mức 2 [Dời R3 – R-C]** với điều kiện SEC P-R2-4 **ĐK-1…ĐK-6** (mục 8.1); US-108 thông tin lưu trú, US-109/110 yêu cầu khách (Sprint 4 – đặc tả ở đợt sau); US-111 folio khách, US-128 mã cửa (R3).
- Nguồn và quy ước: như `specs/EP00-platform.md` mục 0 (V-01…V-11, hiển thị lỗi, xác nhận lại mục 0.5, thiết bị được cấp mục 10). BR **v0.3.1** nhóm BR-6xx đều mang nhãn **PHÁP LÝ – cần xác nhận** (INV quyết ESC-001: luật sư rà soát **trước khi đưa dữ liệu khách thật vào**; tới lúc đó dùng mặc định hiện hành). Mọi hạn/ngưỡng ghi bằng tham số, không chép số.
- Đọc cùng: `EP03-05-stay.md` mục 1 (nhận phòng – bước 4 và điều kiện), `security/security-requirements.md` (SR-C3, SR-FILE, SR-GST, SR-DEV), `security/data-risk-assessment.md` (R-REG, R-CON), `rounds/round-02/outputs/SEC/w1-review.md` mục 4 (ĐK-1…6).

---

## 0. Quy tắc chung của phân hệ

| Quy tắc | Nội dung | Nguồn |
|---|---|---|
| Thiết bị | Mọi đọc/ghi giấy tờ (C3) của nhân viên chỉ trên **thiết bị được cấp** mở admin-web; PWA/máy chưa cấp → menu "Giấy tờ & khai báo" ẩn, API 403 `DEVICE_NOT_TRUSTED` + `c3_access_log` lần bị từ chối (`device.blocked_title`/`_body`) | rbac 8.7, US-142 AC2 |
| Vai | OWN, MGR, FDL, FD (S09 = ✔ L Q). HK, MT, SAL, CTV: **không** có màn, **không** nhận trường giấy tờ ở bất kỳ API nào (kể cả dạng che, loại giấy tờ) – gọi trực tiếp → 403 + nhật ký | US-048 AC2, rbac M1, D03–D07 |
| Nhật ký C3 | Mỗi lần nhập, sửa, xem số đầy đủ, xem ảnh, sao chép dữ liệu cổng, xóa ảnh → một dòng `c3_access_log` (người, thời điểm, đơn, người được xem, lý do nếu có) ghi **trước khi** trả dữ liệu | US-043 AC4, US-048 AC1, R-REG-09 |
| Xác nhận lại | Xem số đầy đủ (`…/sensitive`), xem ảnh, lấy dữ liệu cổng có `x-step-up`: hết cửa sổ `c3_stepup_minutes` → 401 `REAUTH_REQUIRED` → hộp mật khẩu (EP00 0.5) rồi tự gửi lại | SR-C3-09 |
| Lý do xem | Trong luồng nhận phòng/khai báo **đang mở của chính đơn** → không hỏi lý do; mọi lần khác (khai báo đã `confirmed`, đơn đã trả phòng, đơn ngoài ca) → chọn `reason`: `recheck` (Đối chiếu lại) · `guest_request` (Khách yêu cầu) · `authority_request` (Cơ quan chức năng); thiếu → 422 `REQUIRED` | rbac ghi chú 30 |
| Hiển thị mặc định | Số giấy tờ dạng **4 ký tự cuối** (`docNumberLast4`, "••4821"); số đầy đủ chỉ khi bấm "Hiện số" (gọi `getGuestDocumentSensitive`, tự ẩn sau 60 giây `[GIẢ ĐỊNH BA]`); ảnh xem trong khung có watermark (tên người xem + thời điểm + "Chỉ dùng khai báo lưu trú"), không nút tải về | BR-610, SR-C3-10 |
| Cấm | Không xuất dữ liệu giấy tờ nhiều người (A75 – mọi vai); không đưa số giấy tờ vào ghi chú, tin nhắn, thông báo đẩy, URL, log | US-048 AC4, rbac 8.3 |
| Trẻ em / người dưới ngưỡng dữ liệu | Tuổi khi chỉ có **năm sinh** = năm đến − năm sinh − 1 (tuổi nhỏ nhất có thể – BR-110 v0.3.4, DOM S3-7; an toàn ở ngưỡng dữ liệu trẻ em). Người dưới `minor_data_age_threshold` (BR-612): giấy tờ = số định danh cá nhân, **không bắt ảnh**; không hỏi đồng ý lưu ảnh – ảnh (nếu có, ví dụ hộ chiếu trẻ em NN) **xóa khi khai báo `confirmed`** như người không đồng ý `[GIẢ ĐỊNH BA theo SEC R-CON-05 "không xử lý dữ liệu trẻ em ngoài P01, P02" – SEC xác nhận]` | BR-612, R-CON-05 |

### 0.1 Phân loại khách VN / NN (dùng cho loại khai báo, hạn, kiểm)
Theo **giấy tờ dùng để khai báo** (BR-009): `cccd`, `child_personal_id`, hoặc `passport` có `nationalityCode = VNM` → **công dân VN**; `passport` có quốc tịch khác → **NN** (kể cả Việt kiều mang hộ chiếu nước ngoài). `other` → lễ tân chọn VN/NN khi nhập `[GIẢ ĐỊNH BA]`. Khai báo của đơn: tất cả VN → `vn_citizen_stay`; tất cả NN → `foreigner_temp_residence`; có cả hai → `mixed` (hai lần khai trên cổng – mục 5.1). Giấy tờ khác loại đã báo lúc đặt → cảnh báo quản lý, **không** tự đổi giá (BR-009).

---

## 1. Danh sách cần khai báo – S09 (US-042, US-047, US-050) – `listRegistrations`

| Tham số | Kiểu | BB | Kiểm tra |
|---|---|---|---|
| `view` | enum `action_needed` (mặc định) · `needs_update` · `all` | K | V-11 |
| `cursor`, `limit` | – | K | Theo quy ước phân trang OpenAPI |

`action_needed` = khai báo trạng thái `none`/`pre`/`partial`/`review`/`scanned`/`sent` của đơn `confirmed` đến hôm nay hoặc `in_house`; `needs_update` = trạng thái `needs_update`. Cột: mã đơn, căn, tên người đứng tên (D01), ngày đến, loại (`reg.type.foreigner`/`reg.type.citizen`/cả hai), trạng thái (`status.reg.*`), số người có giấy tờ / cần (`checkin.docs.progress`), hạn.

**Nhãn hạn** (`deadlineLabel`, server tính – US-042 AC1):
| Giá trị | Khi | Hiển thị |
|---|---|---|
| `at_checkin` | Đơn chưa nhận phòng (hạn chưa bắt đầu – hạn tính từ giờ đến thực tế, BR-602/603) | "Khi nhận phòng" **(mới)** |
| `before_deadline_today` | Đã nhận phòng, trạng thái < `sent`, chưa quá hạn | `reg.deadline` + `reg.deadline_left` |
| `overdue` | Trạng thái < `sent` và đã qua `deadlineAt` | `reg.deadline_overdue` – màu cảnh báo **kèm nhãn chữ** (không chỉ màu) |
| `done` | `sent`/`confirmed`/`updated`/`void` | `status.reg.*` |
| `needs_update` | `needs_update` | `status.reg.needs_update` + hạn "trong ngày" (BR-604) |

**Cách tính `deadlineAt`** (giờ đồng hồ thật, **không** dùng ngày nghiệp vụ – BR-010):
- Công dân VN: BR-602 (`registration_deadline_vn`) theo **ngày lịch của giờ đến thực tế** (`actualCheckinAt`).
- NN: `actualCheckinAt` + `registration_deadline_foreigner_hours` theo `registration_deadline_foreigner_mode` (BR-603). Khách tự nhận qua check-in online: R2 chưa có tự nhận (mã cửa dời R3) → luôn dùng `actualCheckinAt` của B9.
- `mixed`: hai hạn tính riêng; danh sách hiện **hạn sớm hơn** chưa xong.
- Nhập bù sau mất mạng (P12): tính từ giờ nhận thực tế đã khai, không từ giờ nhập.
- Đổi tham số (luật sư – ESC-001) → hạn của khai báo chưa `sent` tính lại khi đọc, không đổi code (AC3).

**Nhắc** (AC2): trước hạn `registration_reminder_before_minutes` → thông báo trong app cho người trực FD + MGR; mốc `registration_digest_times` → danh sách tổng hợp hồ sơ chưa khai (BR-611); quá hạn → "Cần chú ý" (BR-907).

**Mọi đơn có bản ghi** (US-047): server sinh `none` cho **mọi** luồng tạo đơn (B1, B2, đơn OTA, AC5a) với `requiredCount` = người lớn + trẻ 6–11 + trẻ dưới 6 (BR-601/608 – mọi người kể cả trẻ dưới 6); đơn con gia hạn **không** sinh bản ghi (việc "Cập nhật ngày đi"); đổi số khách → `requiredCount` cập nhật, khai báo đã `confirmed` → `needs_update` (K9), đang `review` mà thiếu người → `partial` (K13). QA kiểm bằng API (không có màn riêng).

---

## 2. Nhập giấy tờ – K3/K4 (US-043) – `addGuestDocument`, `updateGuestDocument`

### 2.1 Quyền
FD+ (A70 = ✔ L Q), thiết bị được cấp. `addGuestDocument` nhận `multipart/form-data` (phần `data` JSON + 0…4 phần `image`); `updateGuestDocument` cần `If-Match`.

### 2.2 Bảng trường (`GuestDocumentInput`) – theo loại giấy tờ
Ký hiệu cột BB theo loại: **C** = `cccd` · **P** = `passport` · **T** = `child_personal_id` (trẻ em) · **O** = `other`. "NN" = hộ chiếu quốc tịch khác VNM.

| Trường | Nhãn (`checkin.docs.field.*`) | Kiểu | BB | Kiểm tra (chuẩn hóa trước, kiểm sau) | Lỗi |
|---|---|---|---|---|---|
| `partyMemberId` | Người trong đơn | uuid | K | Chọn người đã có trong đơn; bỏ trống → server tự tìm người theo **thứ tự khớp ở mục 2.2a** (BUG-R2-033 b – SEC 17/10). Người dưới ngưỡng dữ liệu → **không** tạo hồ sơ (rbac mục 9) | `NOT_IN_LIST`; 409 `PARTY_DUPLICATE` |
| `docType` | `doc_type` | enum `cccd` · `passport` · `child_personal_id` · `other` | B | V-11. Người có tuổi < `minor_data_age_threshold` mà chưa có giấy tờ riêng → gợi ý `child_personal_id` (US-043 AC2) | `NOT_IN_LIST` |
| `isMain` | Người đứng tên | bool | K | Đúng **một** giấy tờ `isMain = true` mỗi đơn; mặc định `true` cho giấy tờ đầu tiên khớp người đứng tên đơn | `MAIN_GUEST_DUPLICATE` **(đề nghị ARC E06-05)** |
| `fullNameOnDoc` | `full_name` (như trên giấy tờ) | text | B | V-01; lưu nguyên dạng nhập (có dấu); so khớp theo mục 3 | `REQUIRED`; `NAME_INVALID` |
| `docNumber` | `doc_no` | text (C3, chỉ ghi) | B | Bỏ khoảng trắng, chữ hoa. **C, T**: đúng 12 chữ số `^[0-9]{12}$`; **P**: 6–12 ký tự chữ/số `^[A-Z0-9]{6,12}$`; **O**: 3–30 ký tự chữ/số/`-` `[GIẢ ĐỊNH BA – ràng buộc nhập liệu, INT/luật sư đối chiếu biểu mẫu cổng]` | `DOC_NUMBER_INVALID` **(E06-05)** → `field_error.doc_number` **(mới)** "Số giấy tờ chưa đúng dạng (CCCD/định danh: 12 chữ số)." |
| `dateOfBirth` | `dob` | date (C3) | B (C, P, T); K (O) | Không ở tương lai; tuổi ≤ 120. **Không** áp V-06 `DOB_MINOR` ở đây (trẻ em được nhập giấy tờ). Tuổi < `minor_data_age_threshold` với `docType = cccd`/`passport` → đánh dấu dữ liệu trẻ em (mục 0) | `DOB_FUTURE`; `DOB_INVALID` |
| `gender` | Giới tính **(mới)** | enum `male`/`female`/`other` | K | V-11 (chỉ khi biểu mẫu cổng cần – R-REG-04) | – |
| `nationalityCode` | `nationality` | text | B (P); K (C, T: mặc định `VNM`) | Mã ISO 3166-1 alpha-3 từ danh sách (như vùng MRZ); C, T phải `VNM` | `NOT_IN_LIST` |
| `passportIssueDate` | Ngày cấp **(mới)** | date (C3) | K | ≤ hôm nay; > ngày sinh | `DATE_INVALID` |
| `passportExpiryDate` | `passport_expiry` | date (C3) | B (P) | > `passportIssueDate` nếu có. **Cho phép** ngày đã qua (để hệ thống đánh dấu "Không đạt" – không chặn nhập) | `REQUIRED`; `DATE_ORDER` |
| `issuingPlace` | Nơi cấp **(mới)** | text (C3) | K | ≤ 100 | `TOO_LONG` |
| `visaKind` | Diện nhập cảnh **(mới)** | enum `visa` (thị thực) · `visa_exempt` (miễn thị thực) · `temp_residence_card` (thẻ tạm trú) | B (P – NN) | V-11; không áp cho khách VN | `REQUIRED` |
| `visaNumber` | Số thị thực/thẻ **(mới)** | text (C3) | ĐK: `visa`, `temp_residence_card` | 3–20 chữ/số | `REQUIRED` |
| `visaValidUntil` | `visa` (… đến ngày) | date (C3) | B (P – NN) | ≥ `entryDate`. Miễn thị thực: ngày hết hạn tạm trú ghi trên dấu nhập cảnh. Cho phép ngày đã qua (để kiểm "Không đạt") | `REQUIRED`; `DATE_ORDER` |
| `entryDate` | `entry_date` | date (C3) | B (P – NN) | ≤ hôm nay; ≥ ngày sinh. Không có dấu/chứng nhận nhập cảnh → bỏ trống **và** đánh dấu ở bước kiểm (mục 3, BR-613 c) | `ENTRY_DATE_FUTURE` **(E06-05)** |
| `entryPort` | Cửa khẩu nhập cảnh **(mới)** | text (C3) | K | ≤ 100 | – |
| `entryPurpose` | Mục đích nhập cảnh **(mới)** | text (C3) | K (NN) | ≤ 100 (BR-606) | – |
| `address` | Địa chỉ thường trú | text (C3) | K | Chỉ hiện ô khi biểu mẫu cổng yêu cầu (R-REG-04) ≤ 300 | – |
| `captureMethod` | – | enum | B (server đặt) | `manual` ở R2 (`qr_cccd`, `mrz` – US-051 R3); giấy tờ từ app khách = `guest_upload` | – |
| `image` (multipart) | `checkin.docs.scan` | tệp | B (C, P – người lớn); K (T, O) | JPEG/PNG/WebP theo magic bytes; ≤ 10 MB, ≤ 40 MP; ≤ 4 ảnh/người (SR-FILE-01/02); HEIC/PDF → từ chối kèm hướng dẫn chụp lại; client chuẩn hóa qua canvas trước khi gửi, server vẫn mã hóa lại và bỏ EXIF/GPS (SR-FILE-03) | 422 `FILE_REJECTED` → `error.FILE_REJECTED` (**UXD bỏ** nhắc HEIC/PDF – R-4 Đợt 0); 413 `PAYLOAD_TOO_LARGE` |

### 2.2a Gắn giấy tờ vào người – hồ sơ khách "từ giấy tờ" (BUG-R2-033 b; PO 17/10 chọn A; SEC duyệt có điều kiện – `reviews/s3-SEC.md` mục 7) – **cài đặt Sprint 4**
Khi lễ tân nhập giấy tờ mà **không** chọn `partyMemberId`, server tìm người theo thứ tự (dừng ở bước đầu tiên khớp):

| Bước | Khớp bằng | Hành vi | Ghi chú |
|---|---|---|---|
| 1 | **Trong cùng đơn/khai báo**: `guest_document.doc_number_hmac` (số giấy tờ chuẩn hóa: in hoa, bỏ `[\s.\-/]` – BE-48) | Đã có giấy tờ cùng số → 409 `PARTY_DUPLICATE` (không nhập trùng). Không phụ thuộc ảnh (ảnh có thể đã xóa theo BR-609) | Khóa sống tới T03 |
| 2 | **Hồ sơ ngoài đơn có đồng ý P05**: `guest.id_doc_hmac` = `keyedHash('guest_doc', "<loại>\|<quốc gia cấp alpha-3>\|<số chuẩn hóa>")` (khóa riêng, khác `doc_number_hmac`) | **Tự gắn** hồ sơ đó vào đơn (`role = companion`, quan hệ `unknown`) | Chỉ hồ sơ mà **chính người đó** đã đồng ý P05 mới có khóa này (F03). Không có P05: HMAC tính trong bộ nhớ chỉ để so, rồi bỏ |
| 3 | **Tên + ngày sinh** trùng hồ sơ ngoài đơn (BR-952 – "nghi trùng") | **Không** tự gắn. Phản hồi kèm gợi ý **(đề nghị ARC E06-13)** `possibleReturningGuest {guestCode, displayName}` → giao diện hiện **(mới)** `checkin.docs.maybe_returning` "Có thể là khách quen {name} ({code}). Dùng hồ sơ này?" với hai nút ngang hàng "Dùng hồ sơ {code}" / "Tạo người mới" – lễ tân xác nhận bằng mắt (gắn nhầm người làm lộ lịch sử/ghi chú của khách khác cho đơn này) | Ngày sinh chỉ dùng để **so trong lúc nhập**, không chép sang hồ sơ |
| 4 | Không khớp | Server tạo hồ sơ khách **nguồn "từ giấy tờ"** (`source = document`) với **trường tối thiểu** dưới đây, gắn vào đơn `role = companion`, quan hệ `unknown`. Làm số người vượt số khách của đơn → **vẫn gắn**, cảnh báo **(mới)** `checkin.docs.over_party` "Đơn có {n} khách, giấy tờ đã nhập cho {m} người – sửa số khách hoặc thêm người (có ngày áp dụng)" và hướng sang EP03-05 4.7 (phụ thu **không** tự ghi) | Trẻ dưới ngưỡng dữ liệu: **không** tạo hồ sơ (như cũ) |

**Trường tối thiểu của hồ sơ "từ giấy tờ"** (SEC 7.1 – hồ sơ này **không phải hồ sơ CRM**, chỉ phục vụ P01 lưu trú + P02 khai báo):
| Được lưu trên hồ sơ (`guest`, `source = document`) | **Không** lưu trên hồ sơ (chỉ nằm trong `guest_document` mã hóa, theo T03) |
|---|---|
| Mã `KH-`; họ tên **như trên giấy tờ** + `name_search`; quốc tịch (alpha-3 → alpha-2) + cờ người nước ngoài; `source = document`; `crmConsent = not_asked`; người tạo, lúc tạo; mốc lần trả phòng cuối | Ngày sinh, giới tính, số giấy tờ, 4 số cuối, khóa băm số giấy tờ (khi chưa có P05), địa chỉ, thị thực, ảnh; SĐT/email (không có); `tags`, `freeNote`, `serviceNotes`, phân khúc (đều là mục đích P05) |

Hệ quả có chủ đích: lần ở sau, hồ sơ "từ giấy tờ" **không** tự khớp theo tên + ngày sinh (bước 3 chỉ gợi ý với hồ sơ thường có ngày sinh); muốn được nhận ra tự động → người đó đồng ý P05 (mục 4.1).

**Hạn lưu** (SEC 7.2, T05): ẩn danh hồ sơ "từ giấy tờ" sau `document_profile_retention_months` (mặc định 12, biên 1–12, chỉ OWN sửa) kể từ lần trả phòng cuối – tên → mã, giữ `code` và quốc tịch cho thống kê. Ra khỏi chế độ này chỉ khi: chính người đó đồng ý P05 (→ T06), hoặc hồ sơ được thêm SĐT/email / trở thành người đứng tên (→ quy tắc CRM thường, EP00 11.2). `[GIẢ ĐỊNH SEC – chờ luật sư, câu phụ trong ESC-001]`. Job ẩn danh phải có **trước khi** đưa dữ liệu khách thật vào.

**Hiển thị**: FD+ thấy chip **(mới)** `crm.source_document` "Từ giấy tờ – chưa đồng ý ghi nhớ" trên hồ sơ và trong danh sách người đi cùng; SAL/CTV **không** thấy hồ sơ loại này ở bất kỳ danh sách/tìm kiếm/tra cứu nào (rbac D10, ghi chú 40); HK chỉ tên gọi + căn trong ngày (D01 T). Hồ sơ "từ giấy tờ" không vào danh sách/xuất tiếp thị.

Ảnh được nhận **trước** khi ghi đồng ý lưu ảnh (dùng để khai báo – nghĩa vụ luật P02); đồng ý chỉ quyết định giữ ảnh tới hạn BR-610 hay xóa khi khai báo xong (BR-609, R-REG-05). Đọc ảnh lỗi (mờ, lóa) → `checkin.docs.read_failed`.

### 2.3 Kết quả và trạng thái (US-043 AC1, AC3, AC4)
- Người thứ nhất đủ trường → khai báo `partial` (K3); đủ số người `requiredCount` → `review` (K4). Bỏ một giấy tờ khi đang `review` → `partial` (K13).
- Mỗi lần nhập/sửa → `c3_access_log` (`guest_document` `create`/`update`). Phản hồi trả `Registration` dạng **che** (`GuestDocumentMasked`): không có số đầy đủ, ngày sinh, hạn hộ chiếu, thị thực.
- Sửa giấy tờ khi khai báo đã `sent`/`confirmed` → được, nhưng hiện cảnh báo "Đã khai trên cổng – sửa ở đây không tự sửa trên cổng" **(mới)**; khai báo `confirmed` → `needs_update` (K9 – đổi giấy tờ) `[GIẢ ĐỊNH BA theo BR-608 "đổi giấy tờ"]`.
- Giấy tờ khách gửi trước qua app (`captureMethod = guest_upload`, trạng thái `pre`): lễ tân thấy `checkin.docs.from_app`, mở ảnh (C3, có nhật ký) và **nhập/xác nhận các trường** theo 2.2 – app khách chỉ gửi ảnh, không gửi trường (mục 8.3).

### 2.4 Xem số đầy đủ, xem ảnh – `getGuestDocumentSensitive`, `getDocumentImage` (US-048)
FD+ (A71 = ✔ L Q, chỉ trong hạn lưu BR-610). Thứ tự kiểm: thiết bị → step-up → quyền → (lý do theo mục 0) → ghi log → trả (`Cache-Control: no-store`). Quá giới hạn `x-rate-limit` (SR-RL-06) → 429 `RATE_LIMITED`. Ảnh đã xóa (mục 6) → 404 `NOT_FOUND`, giao diện hiện "Ảnh đã xóa lúc {time} ({reason})" **(mới)** thay cho khung ảnh. Hồ sơ khách ở CRM chỉ hiện 4 ký tự cuối (AC3) – không có nút "Hiện số" ở CRM.

---

## 3. Đối chiếu tự động – K5 (US-044, BR-605, BR-613, BR-952)

### 3.1 Các mục kiểm và kết quả
Mỗi mục chỉ có **3 kết quả hiển thị**: **Đạt** · **Không đạt** · **Chưa kiểm được – cần kiểm tay** (US-044 AC2, HR-07); "Không áp dụng" thì **ẩn** dòng. Không bao giờ hiện "Đạt" khi thiếu dữ liệu. Hợp đồng hiện chỉ có `ok`/`warning`/`not_applicable` → **đề nghị ARC E06-01** đổi thành `pass`/`fail`/`unverified`/`not_applicable` + cờ `blocking`.

| `DocumentCheckCode` | Chuỗi | Đạt khi | Không đạt khi | Chưa kiểm được khi | Hệ quả "Không đạt" (BR-613) |
|---|---|---|---|---|---|
| `name_match` | `checkin.verify.name` | Mọi từ trong tên trên đơn (người đứng tên / người đi cùng đã gắn) có trong tên trên giấy tờ, sau chuẩn hóa: bỏ dấu, chữ hoa, gộp khoảng trắng, **không xét thứ tự** ("Daniel Weber" ↔ "WEBER DANIEL" – AC3; giấy tờ có thêm tên đệm vẫn Đạt) (DOM G-5 đồng ý). **Tên trên đơn chỉ có một từ** (khách nhắn Zalo "anh Tuấn") → `unverified`, lễ tân kiểm tay – **không** tự Đạt (G-5) | Có từ của tên trên đơn không có trên giấy tờ | Người chưa gắn với ai trên đơn (người mới "Chưa rõ") | Cảnh báo; ghi chú xử lý |
| `passport_valid_through_departure` | `checkin.verify.passport` | `passportExpiryDate` **sau** ngày đi (BR-605) | `passportExpiryDate` ≤ ngày đi (AC1: hết hạn **đúng** ngày trả = Không đạt) | Thiếu `passportExpiryDate` | (b) hết trong kỳ ở → cảnh báo, không chặn |
| `passport_valid_at_arrival` **(E06-01)** | **(mới)** "Hộ chiếu còn hạn tại ngày nhận phòng" | `passportExpiryDate` ≥ ngày nhận | < ngày nhận | Thiếu | (c) **chặn** – `blocksDoorCode = true` |
| `visa_valid_through_departure` | `checkin.verify.visa` | `visaValidUntil` ≥ ngày đi | < ngày đi và ≥ ngày nhận | Thiếu `visaKind`/`visaValidUntil` (NN) | (a) không chặn; ngày đi khai = `visaValidUntil`; nhắc khách gia hạn từ `visaValidUntil` − `visa_expiry_warning_days` (dài hạn/ngắn ngày); đơn vào "Cần chú ý" (AC4) – `checkin.verify.visa_short` |
| `visa_valid_at_arrival` **(E06-01)** | **(mới)** "Thị thực còn hạn tại ngày nhận phòng" | ≥ ngày nhận | < ngày nhận | Thiếu | (c) **chặn** |
| `entry_record_present` **(E06-01)** | **(mới)** "Có dấu / chứng nhận nhập cảnh" | Có `entryDate` | Lễ tân đánh dấu "Không có dấu nhập cảnh" | Thiếu `entryDate` mà chưa đánh dấu | (c) **chặn** |
| `stay_within_visa` | **(mới)** "Ngày đi khai báo không vượt hạn tạm trú" | Ngày đi đơn ≤ `visaValidUntil` | Ngày đi > `visaValidUntil` | Thiếu | Ngày đi khai đề xuất = `visaValidUntil` (BR-605); không chặn |
| `party_count` | `checkin.verify.headcount` | Số người có giấy tờ ≥ `requiredCount` (BR-601) | Thiếu người | – | Không chặn nhận phòng nếu có giấy tờ người đứng tên (BR-402 (3), P03 E3); chặn `complete-review` (K5 cần đủ người) |

Mục kiểm thị thực/nhập cảnh/hộ chiếu chỉ áp cho **NN** (mục 0.1); khách VN → `not_applicable` (ẩn).

### 3.2 Kiểm tay và ghi chú xử lý
- Dòng "Chưa kiểm được" có hai nút `checkin.verify.mark_pass` / `checkin.verify.mark_fail` (lễ tân xem giấy tờ gốc – `checkin.verify.unknown_help`); dòng "Không đạt" có ô `checkin.verify.note_label` (`note_placeholder`).
- Mọi dòng **Không đạt** hoặc **Chưa kiểm được** (kể cả sau khi lễ tân bấm "Tôi đã kiểm") phải có ghi chú xử lý (3–500 ký tự, V-09 – **không** ghi lại số giấy tờ) mới chuyển `scanned` (AC4, K5) – `checkin.verify.note_required`.
- Kết quả có `blocking = true` (BR-613 c) → `Registration.blocksDoorCode = true` → **chặn nhận phòng** ở R2 (EP03-05 mục 1.3, điều kiện `document_check_block`), chỉ FDL+ xác nhận nhận tiếp có lý do; MGR nhận thông báo. Kết quả kiểm và người xử lý ghi nhật ký.

### 3.3 Đối chiếu xong – `completeRegistrationReview` (K5, `If-Match`)
| Trường | Kiểu | BB | Kiểm tra | Lỗi |
|---|---|---|---|---|
| `warningNotes[].documentId` | uuid | ĐK | Giấy tờ của khai báo này | `NOT_IN_LIST` |
| `warningNotes[].checkCode` | enum | ĐK | Mục có kết quả `fail`/`unverified` | `NOT_IN_LIST` |
| `warningNotes[].note` | text | ĐK | 3–500, V-09 | `CHECK_NOTE_REQUIRED` **(E06-05)** → `checkin.verify.note_required` |
| `warningNotes[].manualResult` **(E06-01)** | enum `pass`/`fail` | ĐK: mục `unverified` | Kết quả lễ tân kiểm tay | `REQUIRED` |

Điều kiện server: trạng thái `review`; đủ người; mọi mục `fail`/`unverified` có ghi chú (và `manualResult` với `unverified`); **mọi người có ảnh** (trừ người dưới ngưỡng dữ liệu – mục 0) đã ghi quyết định đồng ý lưu ảnh (mục 4). Thiếu → 409 `REGISTRATION_INCOMPLETE` → `error.REGISTRATION_INCOMPLETE` (kèm danh sách mục thiếu). Thành công → `scanned`; người **không đồng ý** → ảnh đánh dấu "xóa khi khai báo xong" (K5, BR-609).

---

## 4. Đồng ý lưu ảnh giấy tờ (US-045, BR-609) – `recordImageConsent` (Desk), `recordGuestConsent` (app khách – mục 8)

| Trường | Nhãn | Kiểu | BB | Kiểm tra | Lỗi |
|---|---|---|---|---|---|
| `partyMemberId` | Người | uuid | B (Desk) | Người có ít nhất một ảnh giấy tờ; không phải người dưới ngưỡng dữ liệu (mục 0) | `NOT_IN_LIST` |
| `purpose` | – | enum | B | Màn này chỉ `P02B_ID_IMAGE_RETENTION` | `NOT_IN_LIST` |
| `decision` | `checkin.consent.yes` / `checkin.consent.no` | enum `granted`/`refused` | B | **Không chọn sẵn** (R-CON-01): hai nút ngang hàng, trạng thái ban đầu "Chưa hỏi" (`not_recorded`) | `REQUIRED` |
| `noticeVersion` | – | text | B | Phiên bản thông báo xử lý dữ liệu đang hiển thị (ví dụ `privacy-2026-10-v1`) = tham số cơ sở `privacy_notice_version` hiện hành; khác → 422 `NOT_IN_LIST` | `REQUIRED`; `NOT_IN_LIST` |
| `retentionDays` (OpenAPI 0.3.6 bổ sung) | – | int | **B** với P02B | Số ngày lưu ảnh khách **đã đọc** trong câu đồng ý = `id_image_retention_days_after_checkout` hiện hành (BR-610); khác → 422 `NOT_IN_LIST`. Lưu vào bản ghi đồng ý; J16 dùng min(số ngày lúc đồng ý, tham số hiện hành) – đổi tham số sau này không kéo dài lưu ảnh của người đã đồng ý trước | `REQUIRED`; `NOT_IN_LIST` |
| `locale` | – | enum `vi`/`en` | B | Ngôn ngữ văn bản đã đọc cho khách (R-CON-02) | `NOT_IN_LIST` |
| `channel` | Hình thức | enum `desk` (tại quầy) · `paper` (khách ký giấy) | B | `guest_app` chỉ dùng ở app khách | `NOT_IN_LIST` |

- Mỗi người tự quyết; người đặt phòng **không** quyết thay người đi cùng (R-CON-04). Câu hỏi nêu thời hạn lưu = `id_image_retention_days_after_checkout` (`checkin.consent.label`) và `checkin.consent.help`.
- Chọn **Không** vẫn khai báo bình thường (AC1, R-REG-05); ảnh xóa ngay khi khai báo `confirmed` (AC2 – mục 6).
- Khách đã chọn qua check-in online (AC3): Desk hiện "Đã chọn qua app lúc {time}: Có/Không" **(mới)**; không hỏi lại (trừ khi khách muốn đổi).
- **Đổi quyết định / rút đồng ý tại quầy (SEC P-R2-4 ĐK-5)**: Desk được ghi `refused` cho người đã `granted` (ghi bản ghi mới, giữ lịch sử – R-CON-02). Hệ quả theo BR-609 (c): khai báo chưa `confirmed` → ảnh xóa khi `confirmed`; đã `confirmed` → **xóa ngay** (J16). Đổi `refused → granted`: chỉ khi khai báo chưa `confirmed` (ảnh còn) – sau đó → 409 `CONSENT_CHANGE_NOT_ALLOWED` **(đề nghị ARC E06-02)** → chuỗi **(mới)** "Ảnh đã xóa theo lựa chọn trước đó, không bật lại được." Hợp đồng hiện chưa mô tả ghi đè → ARC ghi rõ ở `recordImageConsent` (E06-02).

### 4.1 Hỏi người đi cùng đồng ý **P05 – ghi nhớ để lần sau nhận ra** (tùy chọn; SEC 17/10 mục 7.3–7.4, BR-955, R-CON-04) – **cài đặt Sprint 4**
Áp cho người đi cùng là **người lớn** có hồ sơ `source = document` (mục 2.2a), tại quầy, trên thiết bị được cấp, sau khi đã nhập giấy tờ.

| Bước | Hành vi |
|---|---|
| Hiện câu hỏi | Dưới khối người đó, câu **(mới)** `checkin.crm_consent.q` "Anh/chị {name} có muốn OTTIMO ghi nhớ để lần sau nhận ra khi đến ở không? (Không ảnh hưởng việc nhận phòng.)" + liên kết văn bản thông báo P05 theo ngôn ngữ đã đọc cho khách. **Tùy chọn** – không bắt buộc để nhận phòng/khai báo |
| Hai nút | **"Đồng ý"** / **"Không đồng ý"** – **ngang hàng** (cùng kích thước, cùng màu, không nút nào nổi bật), **không chọn sẵn**; trạng thái ban đầu "Chưa hỏi" (`not_asked`). Có thể đóng mà không chọn → giữ `not_asked` (R-CON-01) |
| Ai quyết | **Chính người đi cùng**; người đặt phòng **không** quyết thay (R-CON-04, BR-955). Lễ tân chỉ bấm theo câu trả lời của người đó |
| Gửi | Đề nghị ARC **E06-12**: `recordImageConsent` (hoặc operation riêng) nhận `purpose = P05_CRM` cho `partyMemberId` có hồ sơ; trường như mục 4 (`decision`, `noticeVersion`, `locale`, `channel = desk\|paper`) – **không** có `retentionDays` (P05 theo T06) |
| Đồng ý | `crmConsent = granted`; server tính và ghi `guest.id_doc_hmac` = `keyedHash('guest_doc', …)` từ giấy tờ trong đơn (giải mã ở server, không trả API); hồ sơ chuyển hạn lưu T06; từ nay lễ tân được thêm `tags`/`serviceNotes`/`freeNote` (EP00 11.2) |
| Không đồng ý | `crmConsent = refused`; **không** ghi khóa giấy tờ; hồ sơ giữ hạn T05 (mục 2.2a); không hỏi lại ở lần ở này |
| Rút đồng ý sau đó | Qua lễ tân (S31 – OWN/MGR) hoặc app khách mức 2 (R3): `crmConsent = refused`, **xóa** `id_doc_hmac` cùng giao dịch; hồ sơ quay về T05 tính từ lần trả phòng cuối |
| Người dưới ngưỡng dữ liệu | Không hỏi (không có hồ sơ) |

Lỗi: người không có hồ sơ/không phải người lớn → 422 `NOT_IN_LIST`; thiết bị chưa cấp → 403 `DEVICE_NOT_TRUSTED`; `noticeVersion` lệch → 422 `NOT_IN_LIST`.

---

## 5. Khai báo bán tự động – K6…K10 (US-046, US-050) – `getPortalData`, `transitionRegistration`

### 5.1 Chuẩn bị dữ liệu – `getPortalData` (A73 = ✔ L Q)
- Tiêu đề theo loại (AC1): có ít nhất một NN → `reg.type.foreigner`; toàn công dân VN → `reg.type.citizen`; `mixed` → hai khối lần lượt (`getPortalData?kind=`), mỗi khối một lần khai và một mã hồ sơ.
- **Định dạng dữ liệu cổng** (BR-606 v0.3.4, DOM S3-5; OpenAPI 0.3.6 bổ sung – **một** cài đặt ở server; `[GIẢ ĐỊNH – chờ INV xác nhận, ESC-018]` vì đội chưa thấy biểu mẫu thật của cổng):
  | Trường | Giá trị sao chép (`fields[].value`, `clipboardText`) | Hiển thị cho lễ tân |
  |---|---|---|
  | Mọi ngày | Theo tham số `portal_date_format` (mặc định `dd/MM/yyyy`, ví dụ `20/10/2026`) | Như giá trị |
  | Quốc tịch | Theo `portal_nationality_format` (mặc định "Tên nước tiếng Việt (alpha-3)", ví dụ "Hàn Quốc (KOR)"); dữ liệu lưu vẫn alpha-3 | Như giá trị |
  | **Ngày đến** | Ngày lịch (giờ cơ sở) của **giờ nhận phòng thực tế** `actualCheckinAt` (BR-602, BR-417 (4)) – không phải ngày đến của đơn (B9a 04:40 ngày 20/10 → `20/10/2026`, dù đơn đã thêm đêm 19/10); chưa nhận phòng → ngày đến của đơn | Như giá trị |
  | Ngày đi (khách NN) | min(ngày đi, hạn thị thực/tạm trú) (BR-605) | Như giá trị |
  | Enum (giới tính, loại thị thực) | Chữ **tiếng Việt** dán lên cổng ("Nữ", "Miễn thị thực") bất kể ngôn ngữ giao diện | Theo `valueKey` (`reg.value.*`) dịch theo ngôn ngữ người dùng |
  | Trường rỗng | Chuỗi rỗng (vẫn giữ đúng thứ tự cổng) | `reg.value.empty`, **không** có nút sao chép |
  Nhãn trường = khóa `reg.field.*` (`fields[].label`). Đổi định dạng = đổi tham số, không sửa code (khi INV gửi mẫu cổng – ESC-018).
- Các bước (`reg.step.copy` → `reg.step.open` → `reg.step.code`): danh sách trường từng người **đúng thứ tự cổng** (BR-606), mỗi trường nút `reg.copy_field` → `reg.copied`; nút "Sao chép tất cả" (`clipboardText`); nút mở `portalUrl` ở thẻ mới; nút **"Xóa bộ nhớ tạm"** **(mới)** (ghi chuỗi rỗng vào clipboard) và tự xóa sau 60 giây kể từ lần sao chép cuối `[GIẢ ĐỊNH BA – R-REG-07]`. Mỗi lần gọi `getPortalData` = một dòng log `portal_data view`; mỗi lần sao chép ghi `copy` (client gọi lại hoặc server ghi theo lần lấy – ARC chốt, E06-03).
- Chỉ trên máy quầy/thiết bị được cấp (AC2); step-up như mục 0. Điều kiện: trạng thái `scanned` (hoặc `needs_update` khi cập nhật ngày đi). Khác → 409 `INVALID_TRANSITION`.
- Không lưu mật khẩu cổng trong app (R-REG-06) – lễ tân tự đăng nhập cổng.

### 5.2 Ghi kết quả – `transitionRegistration` (`If-Match`)
| `transition` | Trường | Kiểu | BB | Kiểm tra | Kết quả | Lỗi |
|---|---|---|---|---|---|---|
| `mark-sent` (K6) | `portalReference` (`reg.code_label`) | text | B | Cắt khoảng trắng; 3–64 ký tự `[A-Za-z0-9-/._]`; `mixed` → mỗi khối một mã | `sent`, ghi người khai, thời điểm, mã (AC3) | `PORTAL_REFERENCE_REQUIRED` **(E06-05)** → `reg.code_error` |
| `mark-confirmed` (K7) | – | – | – | Trạng thái `sent` | `confirmed` → rời danh sách cần xử lý; ảnh người **không** đồng ý xóa ngay; người đồng ý → hạn lưu = trả phòng + `id_image_retention_days_after_checkout` | `INVALID_TRANSITION` |
| `mark-rejected` (K8) | `rejectedReason` | text | B | V-08 (lý do cổng trả), V-09 | `scanned` để sửa và khai lại (AC3). Khai báo `mixed` bị từ chối → khai lại **mọi khối** (mã cũ của các khối bỏ) (DOM S3-8) | `REASON_REQUIRED` |
| `mark-updated` (K10) | `actualDepartureDate` | date | B | Ngày đi thực tế/mới đã khai trên cổng; ≥ ngày nhận phòng | `updated`; việc "Cập nhật ngày đi" đóng | `REQUIRED`; `DATE_INVALID` |

"Khai báo sau" (`reg.later`, `reg.later_note`): đóng màn khai báo, việc nằm trên Tổng quan và nhắc theo mốc BR-611 tới khi `sent`.

### 5.3 Ngày đi thực tế & hạn tạm trú (US-050, BR-604, BR-605)
> Cập nhật ngày đi khi gia hạn chỉ áp **khách NN** (BR-604). Với khách VN, cổng thông báo lưu trú có cần cập nhật ngày đi khi gia hạn (qua đơn con OTA – BR-608) hay không là câu hỏi **PHÁP LÝ** – đã gộp vào danh sách cho luật sư của ESC-001 (DOM G-18); R2 không sinh việc cập nhật cho khách VN.
- **Tự sinh việc** (AC1): khách NN có khai báo `confirmed`/`updated` mà đơn gia hạn (B13), trả sớm (B16), trả phòng (B18), đổi giấy tờ → `needs_update` (K9) + việc "Cập nhật ngày đi" hạn trong ngày nghiệp vụ cho FD. Khách VN: chỉ khi thêm người giữa chừng (K9) `[theo SM-05 K9]`.
- **Cảnh báo khi lưu đơn/gia hạn** (AC2): khách NN có `visaValidUntil` < ngày đi (mới) → chặn mềm: 422 mã trường cảnh báo `VISA_EXPIRES_BEFORE_DEPARTURE` (đề nghị ARC E04-01, xem EP03-05 4.1) → hộp **(mới)** "Thị thực của {guest} hết hạn {date}, trước ngày đi {departure}. Khai báo chỉ đến {date}. Nhắc khách gia hạn trước {remind}." + ô lý do bắt buộc (V-08) → gửi lại với `visaWarningAckReason`. Ngày đi khai không vượt `visaValidUntil`; nhắc khách từ `visaValidUntil` − `visa_expiry_warning_days` (`.long_stay`/`.short_stay`).

---

## 6. Xóa ảnh giấy tờ (US-049, BR-609, BR-610) – job J16 + `purgeRegistrationImages`

### 6.1 Xóa tự động (SYS – J16)
| Tình huống | Thời điểm xóa | Hạn trên (job dự phòng) |
|---|---|---|
| Người **không** đồng ý (BR-609 a) / người dưới ngưỡng dữ liệu (mục 0) | Ngay khi khai báo `confirmed` (cùng giao dịch K7 hoặc ngay sau) | `id_image_purge_max_hours` |
| Đơn `cancelled`/`no_show` trước khi khai (khai báo `void` – BR-609 b) | Ngay khi `void` | `id_image_purge_max_hours` |
| Rút đồng ý (BR-609 c, mục 4) | Chưa `confirmed`: như dòng 1; đã `confirmed`: ngay | `id_image_purge_max_hours` |
| Người đồng ý, đơn `checked_out` (AC1, BR-610) | Trả phòng + `id_image_retention_days_after_checkout` | J16 chạy hằng giờ `[GIẢ ĐỊNH BA – ARC chốt lịch]` |
| **Trả sớm (B16)** – khách đã ở rồi rời trước ngày đi (kể cả lễ tân ghi là "hủy phần còn lại") sau khi khai báo `confirmed` (DOM G-17) | Trả sớm = trả phòng: người đồng ý → `actualCheckoutAt` + `id_image_retention_days_after_checkout`; người không đồng ý đã xóa lúc `confirmed` | Như dòng trên |
| Người bị **bỏ khỏi đơn** (`removePartyMember`, EP03-05 4.7; OpenAPI 0.3.6 A-38) | **Ngay khi bỏ**, trong cùng giao dịch: giấy tờ và ảnh của người đó bị xóa (hủy DEK, `purge_journal`); khai báo đã `confirmed` → `needs_update` | – (cùng giao dịch) |

Xóa = hủy khóa dữ liệu của ảnh (ADR-013) – không khôi phục được; **giữ** các trường văn bản cần cho khai báo theo tham số lưu riêng (AC1); khôi phục no-show **không** khôi phục ảnh (K12 – khách nộp lại). Mỗi lần xóa → `c3_access_log` `purge` (actor `system`) + `Registration.imageRetentionUntil`/`imagesPurgedAt` cập nhật.

### 6.2 Xóa sớm theo yêu cầu khách – `purgeRegistrationImages` (A74, US-049 AC3)
OWN/MGR (✔ L Q); FD/FDL **không** có nút (API 403). `reason` (B) enum `guest_request` (Khách yêu cầu xóa) · `consent_withdrawn` (Khách rút đồng ý); `If-Match`. Hộp xác nhận EP00 mục 9: `confirm.purge_images.title`/`.body`, nút "Xóa ảnh". Kết quả 204, nhật ký; khai báo chưa `sent` → vẫn khai được bằng trường văn bản đã nhập (ảnh không còn – lễ tân xem bản gốc nếu cần). Đã xóa hết → 409 `INVALID_TRANSITION` "Ảnh đã được xóa trước đó" **(mới)**.

---

## 7. Truy vết story → mục (AC backlog)

| Story / AC | Mục | Ghi chú |
|---|---|---|
| US-042 AC1–AC3 | 1 | |
| US-043 AC1–AC4 | 2 | |
| US-044 AC1–AC4 | 3 | AC4: chặn giao mã cửa → R2 chặn nhận phòng (EP03-05 1.3); mã cửa **[Dời R3]** |
| US-045 AC1–AC3 | 4, 3.3, 8.3 | |
| US-046 AC1–AC3 | 5.1, 5.2 | |
| US-047 AC1–AC3 | 1 (đoạn cuối) | AC1 "HĐ dài hạn" → R2 = đơn AC5a; HĐ thật R3 |
| US-048 AC1–AC4 | 0, 2.4 | |
| US-049 AC1–AC3 | 6 | |
| US-050 AC1–AC2 | 5.3 | |
| US-142 AC2–AC3 | 0 | AC1 ở EP00 mục 10 |
| US-106 AC1, AC2 | 8.2, 8.5 | **AC3 → US-141 [Dời R3 – R-C]**; R2 không có phần nhạy cảm nào để mở (ĐK-6) |
| US-107 AC1–AC5 | 8.3, 8.4 | AC2 theo ĐK-3 (không hiện lại ảnh) |
| US-112 AC1–AC3 (phần check-in) | 8.6 | Phần còn lại cùng US-108/109 ở Sprint 4 |
| US-133, US-134 | – | **R3** (rút đồng ý trên app khách → R3; R2 qua lễ tân – ĐK-5) |

---

## 8. Guest-web – check-in online mức 1 (US-106, US-107, US-112; SEC P-R2-4)

### 8.1 Điều kiện bắt buộc của SEC khi dời US-141 (ĐK-1…ĐK-6) – áp nguyên văn, vi phạm → US-141 quay lại R2
| ĐK | Ràng buộc trong đặc tả này |
|---|---|
| ĐK-1 | guest-web R2 **không gọi** `sendGuestOtp`, `verifyGuestSession`, `getGuestFolio`, `withdrawGuestConsent`, `issueGuestVerificationCode`; không có màn OTP/xác minh. `openGuestSession` luôn trả `level: 1`, `verification.emailOtpAvailable: false`, `level2ExpiresAt: null` – client **không** dựa vào trường `verification` để hiện nút |
| ĐK-2 | Màn check-in chỉ dùng trường mức 1: `GuestSession.reservationCode`, `guestFirstName`, `roomNo`, `locale`, `stayEnded`; `OnlineCheckin.*`; `GuestStay` (ngày, giờ chuẩn, cơ sở, `onlineCheckinAvailable`). JSON mức 1 không bao giờ có `guestFullName`, `doorCode`. Không thêm trường mới vào `GuestStay`/`OnlineCheckin` mà không qua SEC (đề nghị ở E06-06 phải qua SEC) |
| ĐK-3 | Không hiện lại ảnh/số giấy tờ khi mở lại link – chỉ "Đã có giấy tờ của {n}/{m} khách" + nút tải lại từng người; **không lưu** ảnh/số giấy tờ ở `localStorage`/`sessionStorage`/IndexedDB/Cache Storage/service worker (kể cả để gửi lại khi mất mạng); ảnh chỉ nằm trong bộ nhớ trang tới khi gửi xong; thu hồi object URL ngay sau khi gửi hoặc khi rời bước; không có màn OTP, folio, mã cửa |
| ĐK-4 | SR-GST-01 (token 256 bit, lưu băm), -02 (token rời URL: đọc `/g/{token}` → `POST /v1/guest/sessions` → `history.replaceState` về `/`, `Referrer-Policy: no-referrer`), -03 (không script/font/analytics bên thứ ba; che `/g/*` trong log), -04/-05 (thu hồi, hết hạn → `401 GUEST_LINK_INVALID`), -11 (sau trả phòng mọi thao tác → 403 `GUEST_STAY_ENDED`; R2 không có bill nên chỉ hiện trang "đã kết thúc"), -12 (QR trong phòng không chứa token) |
| ĐK-5 | Rút đồng ý ở R2 **qua lễ tân** (mục 4); trang khách hiện dòng `guest.oci.withdraw_hint` **(mới)** "Muốn rút đồng ý lưu ảnh? Báo lễ tân – ảnh sẽ được xóa." (SEC duyệt câu chữ) |
| ĐK-6 | Không hiện bất kỳ thứ gì gắn mức 2 (mã cửa, folio, họ tên đầy đủ). **UXD không dùng ở R2** các chuỗi: `guest.verify.*`, `guest.door_code*`, `guest.late.done_title`, `guest.late.code_*`, `guest.late.how_*`, `guest.late.prompt`, `guest.late.arrival_hint`, `guest.tab.bill`, `guest.bill.*`, `guest.after_checkout.body` (nhắc bill); và **sửa** `guest.oci.done_body` (đang hứa "Mã cửa sẽ hiện trong trang này") thành bản R2 **(mới)** "Phòng sẵn sàng từ {time}. Lễ tân sẽ giao mã cửa khi bạn đến." |

### 8.2 Cấp link ở Desk – `issueGuestLink`, `revokeGuestLink` (US-106 AC1)
- Quyền: FD+ (A22a cấp + sao chép; A114 thu hồi). SAL/CTV không có nút, không render link trong mẫu tin (rbac A22, 8.9). Đơn `hold`/`cancelled`/`no_show`/`checked_out` → không có nút `[GIẢ ĐỊNH BA: cấp từ `confirmed`]`.
- Cấp: URL hiện **một lần** trong hộp có nút "Sao chép link" + mã QR để khách quét tại chỗ; đóng hộp → không xem lại được. Đã có link → nút đổi thành "Cấp lại link" với hộp xác nhận **(mới)** "Cấp link mới cho đơn {code}? Link cũ ngừng hoạt động ngay." (SR-GST-04 – thu hồi mọi token và phiên khách cũ). `expiresAt` hiện "Link dùng được tới {time}".
- Thu hồi: hộp xác nhận (EP00 mục 9) **(mới)** "Thu hồi link của đơn {code}? Khách mở link sẽ thấy 'Liên kết đã hết hạn'." → 204.

### 8.3 Các bước check-in online (US-107 AC1)
Mở link → trang của đơn (`guest.hello` dùng `guestFirstName`, `guest.stay.dates`, `guest.stay.checkin_time`/`checkout_time`) + nút `guest.cta.checkin` khi `onlineCheckinAvailable = true`.

| Bước | `currentStep` | Nội dung và trường | Kiểm tra | Lỗi / trạng thái |
|---|---|---|---|---|
| 0 Thông báo xử lý dữ liệu | `notice` | Văn bản thông báo của phiên bản **`OnlineCheckin.currentNoticeVersion`** (OpenAPI 0.3.6 bổ sung, SEC duyệt ĐK-2 17/10; VI/EN đã duyệt – AC5, HR-01) + `guest.oci.why`; nút "Tôi đã đọc" **(mới)**. Client chỉ có văn bản cho các phiên bản nó biết: phiên bản **lạ** hoặc **thiếu** trường → **không** hiện bước thông báo/đồng ý, hướng **(mới)** `guest.oci.desk_only` "Vui lòng làm thủ tục tại quầy." (fail closed – không có hằng số phiên bản trong client) | Bắt buộc bấm trước bước 1; gửi lại đúng `currentNoticeVersion` ở `updateOnlineCheckin.noticeVersion` (khác → 422 `NOT_IN_LIST`) | – |
| 1 Giấy tờ (`guest.oci.step1`) | `documents` | Danh sách `guest.oci.person_n` cho `n` = 1…`requiredPeople` (`guest.oci.people`); mỗi người: chọn `docType` (CCCD / Hộ chiếu / Giấy tờ trẻ em) + chụp/tải 1–4 ảnh (`guest.oci.add_doc`). Người đã có → chip `guest.chip.doc_ok` + "Tải lại" | Client: chỉ JPEG/PNG/WebP sau chuẩn hóa canvas (HEIC từ camera → chuyển JPEG trên máy); ≤ 10 MB/ảnh sau nén; ≤ 4 ảnh/người; ≤ 30 tệp/đơn (SR-FILE-02, SR-RL-05). Server: magic bytes, 40 MP, mã hóa lại | 422 `FILE_REJECTED` → `guest.oci.upload_error` + tải lại (AC4); 429 `RATE_LIMITED`; tiến trình `guest.oci.uploading`; mạng yếu `guest.oci.upload_weak` (thử lại **trong bộ nhớ** khi trang còn mở – ĐK-3) |
| 2 Giờ đến (`guest.oci.step2`) | `eta` | `etaTime` (`guest.oci.arrival`): chọn theo khung 30 phút từ 06:00 tới 23:30 + lựa chọn `guest.oci.arrival_late` "Sau 22:00" (lưu `22:00` và cờ đến khuya) `[GIẢ ĐỊNH BA]`; `note` cho lễ tân (`guest.oci.note`) **chưa có trường trong hợp đồng** → E06-06 | `HH:mm` | – |
| 3 Đồng ý lưu ảnh (`guest.oci.step3`) | `consent` | Câu hỏi `guest.oci.consent_q` + hai nút ngang hàng "Có" (`guest.oci.consent`, `{days}` = **`OnlineCheckin.imageRetentionDays`** – không viết cứng 30; thiếu trường → không hiện câu đồng ý) / `guest.oci.consent_no`, **không chọn sẵn**; `guest.oci.consent_optional` | Chỉ hỏi cho **Khách 1** (người nhận link). Khách 2…n: hiện "Người đi cùng tự trả lời tại quầy" **(mới)** – người đặt không quyết thay (R-CON-04) `[GIẢ ĐỊNH BA – SEC xác nhận]`; người dưới ngưỡng dữ liệu: không hỏi (mục 0) | `recordGuestConsent` (`purpose = P02B_ID_IMAGE_RETENTION`, `personIndex = 1`, `decision`, `noticeVersion` = `currentNoticeVersion`, **`retentionDays` = `imageRetentionDays`** (B – lệch tham số → 422 `NOT_IN_LIST`), `locale`, `channel = guest_app`) |
| Gửi | `done` | Nút `guest.oci.submit` → `completeOnlineCheckin` | Server: đủ ảnh cho mọi người lớn có giấy tờ cần ảnh **hoặc** khách chọn "Bổ sung tại quầy" cho người còn thiếu `[GIẢ ĐỊNH BA – đề nghị E06-06]`; có `etaTime`; Khách 1 đã chọn Có/Không | 409 `INVALID_TRANSITION` kèm bước còn thiếu → quay về bước đó; thành công → `guest.oci.done_title` + `guest.oci.done_body` (bản R2 – 8.1 ĐK-6) |

Kết quả: lần tải đầu tiên chuyển khai báo `none → pre` (K2); hoàn tất → `completedAt`, `etaTime` ghi vào đơn (`Reservation.etaTime` – dùng cho nhắc no-show BR-311), FD nhận thông báo "Khách {code} đã làm thủ tục trước – đến lúc {eta}" **(mới)** và thấy `checkin.docs.from_app` (AC1). Chọn "Không" vẫn hoàn tất (AC3). Lễ tân vẫn đối chiếu bản gốc tại quầy và nhập trường (mục 2.3) – ảnh khách gửi chỉ là dữ liệu đầu vào.

### 8.4 Mở lại link, bỏ dở, trạng thái lỗi (US-107 AC2, AC4; US-106 AC2)
- Mở lại: `getOnlineCheckin` → vào thẳng `currentStep`; bước giấy tờ chỉ hiện chỉ số người đã có (`uploadedPeople`) – **không** ảnh, **không** loại/số giấy tờ (ĐK-3); "Tải lại" thay ảnh cũ của người đó (server giữ bản mới nhất `[GIẢ ĐỊNH BA]`).
- Check-in online đóng (`onlineCheckinAvailable = false`) khi khai báo đã ≥ `partial` do lễ tân nhập, đơn đã `in_house`, hoặc đơn không còn `confirmed` → trang hiện "Lễ tân đã nhận giấy tờ của bạn" **(mới)** (hoặc trạng thái đơn tương ứng); gọi API ghi → 409 `INVALID_TRANSITION` → đề nghị mã riêng `ONLINE_CHECKIN_CLOSED` (E06-06).
- Link sai/hết hạn/đã thu hồi: 401 `GUEST_LINK_INVALID` → `guest.link_expired_title`/`_body` (cách liên hệ lễ tân). Đơn đã trả phòng: 403 `GUEST_STAY_ENDED` → trang "Cảm ơn bạn đã lưu trú" (`guest.after_checkout.title`) **không** kèm câu về bill (R2). Link của đơn A không xem được đơn B (phiên gắn một đơn – `x-scope: reservation`).
- Mất mạng: `guest.offline_banner`; không có hàng đợi lưu trên máy (ĐK-3). Lỗi tải trang: `guest.error_title`/`_body`.

### 8.5 Ngôn ngữ (US-112 phần check-in)
Mặc định theo ngôn ngữ hồ sơ khách, không có thì theo trình duyệt (`en*` → EN, còn lại VI); chọn tay ở đầu trang (`guest.lang`) → `setGuestLocale`. Mọi chuỗi bước 0–3, lỗi, trạng thái có bản EN đã duyệt (không dịch máy – HR-01); `ru` ở R3 (`guest.lang.ru_soon` – nếu hiện nút RU thì trang dùng EN). Văn bản thông báo xử lý dữ liệu và câu đồng ý ghi `locale` vào bằng chứng đồng ý (R-CON-02).

---

## 9. Đề nghị hợp đồng cho ARC (OpenAPI 0.3.2 → 0.3.3) và vai khác

| # | Gửi | Nội dung |
|---|---|---|
| E06-01 | ARC (+ SEC xem) | `GuestDocumentMasked.checks[].result` đổi thành `pass` · `fail` · `unverified` · `not_applicable` (+ `blocking: bool`, `manualResult`, `handledBy`); `DocumentCheckCode` thêm `passport_valid_at_arrival`, `visa_valid_at_arrival`, `entry_record_present`; `GuestDocumentInput.noEntryRecord: bool` (lễ tân đánh dấu thiếu dấu nhập cảnh); `completeRegistrationReview.warningNotes[].manualResult`; `Registration.blocksDoorCode` dùng làm điều kiện `document_check_block` của `previewCheckIn` (EP03-05 E03-01) |
| E06-02 | ARC + SEC | `recordImageConsent`: mô tả ghi đè `granted → refused` (ĐK-5) và hệ quả xóa (BR-609 c); `refused → granted` sau `confirmed` → 409 `CONSENT_CHANGE_NOT_ALLOWED`; trả `Registration` có `imagesPurgeScheduledAt` |
| E06-03 | ARC | `getPortalData?kind=foreigner_temp_residence|vn_citizen_stay` cho khai báo `mixed`; `mark-sent` nhận `kind` + `portalReference` theo từng khối; xác nhận cách ghi log `copy` (mỗi lần lấy dữ liệu hay mỗi lần sao chép) |
| E06-04 | ARC | `Registration.imagesPurgedAt`, `imagesPurgeReason`; `getDocumentImage` sau khi xóa → 404 (không phải 500); `GuestDocumentMasked.imageIds` rỗng sau xóa |
| E06-05 | ARC | Mã trường mới: `DOC_NUMBER_INVALID`, `MAIN_GUEST_DUPLICATE`, `ENTRY_DATE_FUTURE`, `CHECK_NOTE_REQUIRED`, `PORTAL_REFERENCE_REQUIRED`; `nationalityCode` thu về đúng 3 ký tự (alpha-3) thay `{2,3}` |
| E06-06 | ARC + **SEC (ĐK-2: thêm trường phải qua SEC)** | `OnlineCheckin.currentStep` thêm `notice` + `noticeVersion` đã đọc; `updateOnlineCheckin` thêm `arrivalNote` (≤ 300, V-09) và `lateArrival: bool`; `completeOnlineCheckin` cho phép người còn thiếu ảnh ở trạng thái "bổ sung tại quầy" (`deferredPeople[]`); mã `ONLINE_CHECKIN_CLOSED` (409); `Registration.onlineCheckin { completedAt, etaTime, uploadedCount }` cho Desk |
| E06-07 | ARC | `uploadGuestDocument` lặp lại cho cùng `personIndex` = thay thế bản trước (ghi rõ trong mô tả); mã trường `FILE_TYPE`, `FILE_TOO_LARGE`, `TOO_MANY_FILES` trong `errors[]` của `FILE_REJECTED` để guest-web hiện đúng câu |
| E06-12 | ARC | Ghi đồng ý **P05_CRM** tại quầy cho người đi cùng có hồ sơ (mục 4.1): `recordImageConsent` nhận `purpose = P05_CRM` (đổi tên/tách operation tùy ARC); đồng ý → server ghi `guest.id_doc_hmac` (`keyedHash('guest_doc', …)` v1), rút → xóa khóa; `Guest.crmConsent` cập nhật |
| E06-13 | ARC | `addGuestDocument` phản hồi `possibleReturningGuest {guestCode, displayName}` khi chỉ khớp tên + ngày sinh (bước 3 – không tự gắn); `PartyMember.profileSource` (`document`/`crm`) cho FD+; tạo hồ sơ `source = document` qua cổng public BE-B (không qua form CRM). Cùng các mục ARC trong SEC 7.4 (`Guest.source`, 2 CHECK DB, tham số `document_profile_retention_months`) |
| E06-08 | DOM | **Đã trả lời** (s2-DOM G-5: đồng ý cả ba + tên một từ → `unverified`; áp 3.1, Sprint 3). Nội dung cũ: Quy tắc so tên "tập con, không xét thứ tự" (3.1); người dưới ngưỡng dữ liệu không hỏi đồng ý, ảnh xóa khi khai xong (mục 0); "đổi giấy tờ" sau `confirmed` → `needs_update` (2.3) |
| E06-09 | SEC | Xác nhận: (a) guest-web chỉ hỏi đồng ý cho Khách 1, người đi cùng trả lời tại quầy (8.3 – R-CON-04); (b) dòng `guest.oci.withdraw_hint` (ĐK-5); (c) danh sách chuỗi cấm dùng ở R2 (8.1 ĐK-6); (d) tự ẩn số đầy đủ sau 60 giây, tự xóa clipboard sau 60 giây |
| E06-10 | UXD | Chuỗi **(mới)** trong tài liệu (VI/EN); bản R2 của `guest.oci.done_body`; nhãn 3 kết quả kiểm (Đạt / Không đạt / Chưa kiểm được) – hiện có `mark_pass`/`mark_fail` nhưng chưa có nhãn kết quả hệ thống; bỏ nhắc HEIC/PDF ở `error.FILE_REJECTED` |
| E06-11 | QA | Test tự động ĐK-2 (JSON mức 1 không có `guestFullName`/`doorCode`, kể cả `null`) mỗi PR; kiểm DevTools ĐK-3 (không có ảnh trong storage/cache sau khi gửi); đồng hồ giả lập cho hạn BR-602 (23:00, khách đến 23:40) và BR-603 (+12 giờ, 01:30); xóa ảnh J16 với `Clock` giả (BR-609, BR-610) |

## 10. Lịch sử thay đổi
| Ngày | Round | Thay đổi | Người |
|---|---|---|---|
| 16/10/2026 | 2 (Sprint 1) | Bản đầu: đặc tả mức trường EP06 (US-042…050), dùng thiết bị được cấp (US-142), check-in online mức 1 trên guest-web (US-106, 107, 112 phần check-in) theo SEC P-R2-4 ĐK-1…6; xác nhận phần BA của ĐK-5 (ghi đè `granted → refused` tại quầy); BR-613 ở R2 = chặn nhận phòng | BA |
| 16/10/2026 | 2 (Sprint 3 khởi động) | DOM G-5 (so tên: một từ → `unverified`), G-17 (trả sớm = trả phòng khi tính hạn xóa ảnh; người bị bỏ khỏi đơn), G-18 (ngày đi khách VN – câu hỏi luật sư ESC-001); E06-08 đã trả lời | BA |
| 17/10/2026 | 2 (Sprint 3 – Phản hồi & sửa) | v0.3: BR v0.3.4 + DOM s3 (S3-5 định dạng cổng – giả định ESC-018, "Ngày đến" = ngày nhận phòng thực tế; S3-7 tuổi từ năm sinh; S3-8 `mixed` bị từ chối khai lại mọi khối) và ARC 0.3.6 bổ sung (`currentNoticeVersion`, `imageRetentionDays`, `ConsentInput.retentionDays` cho Desk và app khách, fail closed) | BA |
| 17/10/2026 | 2 (Sprint 3 – theo SEC 17/10) | 2.2 `partyMemberId` + **2.2a** hồ sơ khách "từ giấy tờ" (BUG-R2-033 b): thứ tự khớp (trong đơn bằng `doc_number_hmac`; ngoài đơn **chỉ tự gắn khi khớp `id_doc_hmac` của hồ sơ có P05**; tên + ngày sinh **chỉ gợi ý**), trường tối thiểu, hạn lưu T05, hiển thị theo vai; **4.1** luồng hỏi người đi cùng đồng ý P05 (tùy chọn, hai nút ngang hàng, không chọn sẵn); đề nghị E06-12, E06-13. Cài đặt Sprint 4 | BA |
