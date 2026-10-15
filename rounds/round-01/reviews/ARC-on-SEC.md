# ARC review SEC – Round 1, Bước 3

- Người review: ARC | Ngày: 15/10/2026 | Loại: review bắt buộc (plan R1 mục 5) – góc **tính khả thi**
- Phạm vi đã đọc: `product/docs/security/threat-model.md` (mục 1–13), `product/docs/security/security-requirements.md` (SR-AUTH … SR-INC, DoD mục 20), `rounds/round-01/outputs/SEC/report.md` mục 4–6; đối chiếu `architecture.md`, ADR-003/005/006/010/013, `erd.md`, `api/openapi.yaml`, `docs/hosting-plan.md`, `integrations/README.md`, `business-processes.md` P03.
- Câu hỏi review: các yêu cầu có làm được với **1 VPS, ngân sách hạ tầng ≤ 1 tr/tháng, không KMS/HSM**, đội nhỏ, R2–R3 không?
- Kết luận nhanh: **Khả thi**. Không yêu cầu bắt buộc (B) nào cần dịch vụ trả phí: argon2id, TOTP, AES-256-GCM qua Node `crypto`, KEK trong biến môi trường, rate limit trên PostgreSQL, `age` cho backup, gitleaks/Dependabot đều miễn phí. Chi phí thêm duy nhất là email giao dịch cho OTP (nằm trong gói miễn phí ở < 1.000 email/tháng – đã có trong ADR-010). Rủi ro còn lại TM-13 (không KMS) được nêu trung thực cho INV. Các thẻ dưới là điểm **khó hiện thực như đang viết** hoặc **va với nghiệp vụ**, cần SEC chỉnh câu chữ trước khi thành checklist DoD R2.

---

### FB-R1-ARC-SEC-01
- Mức độ: Major
- Vị trí: `security-requirements.md` SR-FILE-01 (cho phép HEIC/HEIF), SR-FILE-03 (decode → encode lại JPEG/WebP, bỏ EXIF, ở **server**)
- Vấn đề: Ảnh iPhone mặc định là HEIC (nén HEVC). Thư viện xử lý ảnh phổ biến cho Node (`sharp` – bản dựng sẵn libvips) **không kèm bộ giải mã HEVC** vì vấn đề bản quyền sáng chế; muốn decode HEIC trên server phải tự build libvips + libheif + libde265 trong image Alpine (tăng thời gian build, kích thước image, rủi ro giấy phép/sáng chế HEVC). Nếu không làm, SR-FILE-03 "lỗi decode → từ chối" sẽ **từ chối mọi ảnh HEIC** của khách iPhone check-in online.
- Vì sao quan trọng: check-in online (UC-10, US-106/107) là luồng giảm tải quầy; khách nước ngoài thuê tháng phần lớn dùng iPhone. Server decode ảnh 40 MP còn tốn RAM trên VPS 4 GB.
- Đề xuất sửa: Chuyển việc chuẩn hóa ảnh lên **client**: guest-web và admin-web vẽ ảnh vào `canvas`, xuất JPEG (chất lượng ~0,85, cạnh dài ≤ 2.500 px) trước khi tải – tự bỏ EXIF/GPS, giảm dung lượng trên 4G. Server: chỉ nhận **JPEG/PNG/WebP** (magic bytes), vẫn decode → encode lại bằng `sharp` (rẻ, có sẵn) để chặn tệp độc và bảo đảm không EXIF; HEIC gửi thẳng → `422 FILE_REJECTED` kèm hướng dẫn. Giới hạn 40 MP giữ nguyên. Sửa SR-FILE-01/03 tương ứng.
- Trạng thái: Open

### FB-R1-ARC-SEC-02
- Mức độ: Minor
- Vị trí: SR-FILE-01 (PDF từ quầy), SR-FILE-05 (ClamAV container; nếu chưa có thì "PDF chỉ hiển thị dạng ảnh đã kết xuất ở server"), SR-C3-10 ("PDF hiển thị ảnh đã kết xuất")
- Vấn đề: (1) ClamAV nạp bộ chữ ký vào RAM ~1–1,5 GB – trên VPS 2 vCPU/4 GB đang chạy PostgreSQL + api + worker + Caddy (ADR-010 ước ~1,5–2 GB) là quá nặng, có thể phải lên gói 8 GB (PA3, ~0,94 tr/tháng – sát trần). (2) Kết xuất PDF thành ảnh ở server cần pdfium/poppler (thêm thư viện native) hoặc MuPDF (giấy phép AGPL – không phù hợp).
- Vì sao quan trọng: ngân sách và độ phức tạp image cho một nhu cầu nhỏ (máy scan ở quầy).
- Đề xuất sửa: MVP **không nhận PDF** cho giấy tờ: máy scan/điện thoại quầy xuất JPEG (mọi máy scan phổ thông làm được). Bỏ SR-FILE-05 khỏi R3, ghi "xem lại nếu bắt buộc nhận PDF". Khi đó SR-C3-10 chỉ còn trường hợp ảnh.
- Trạng thái: Open

### FB-R1-ARC-SEC-03
- Mức độ: Major
- Vị trí: SR-GST-07 (mức 2 = OTP email **hoặc** mã lễ tân đọc tại quầy/gọi điện SĐT trên đơn), SR-GST-10 (mã cửa chỉ ở mức 2), SR-LOCK-03; đối chiếu BA P03 E2 (khách đến khuya, BR-611)
- Vấn đề: Nhiều khách **không có email dùng được**: Airbnb không chia sẻ email khách (liên lạc qua hộp thư nền tảng), Booking.com đưa email chuyển tiếp, khách nội địa hay chỉ có Zalo/SĐT. Với họ, đường duy nhất lên mức 2 là lễ tân gọi điện hoặc gặp tại quầy. Hệ quả thực tế: khách đến khuya không có lễ tân không tự lấy được mã cửa trên app; người trực phải gọi từng khách; nhóm khách OTA (phần lớn đơn ngắn ngày) gần như không dùng được phần mức 2 của app.
- Vì sao quan trọng: mâu thuẫn trực tiếp với mục tiêu "nhận phòng không chờ quầy" và tải ca đêm (persona P2). Không phải vấn đề chi phí mà là trải nghiệm + vận hành; nếu không xử lý, nhân viên sẽ "lách" bằng cách gửi mã cửa qua chat (TM-39 nặng hơn).
- Đề xuất sửa: Giữ nguyên nguyên tắc (không dùng mã đơn/4 số SĐT). Bổ sung có kiểm soát: (a) cho phép lễ tân gửi **mã xác minh lễ tân** qua kênh nhắn tin đã xác thực của OTA (hộp thư Airbnb/Booking) hoặc Zalo của SĐT trên đơn – ghi rõ rủi ro còn lại (kênh có thể trùng với kênh chứa link) và để mặc định **tắt**, OWN bật theo kênh; (b) hoặc mã cửa cho nhóm khách này được gửi trực tiếp theo SR-LOCK-03 (mẫu `door_code` đúng ngày đến) thay vì qua app. Ghi lựa chọn và rủi ro còn lại vào threat-model mục 9 để INV biết. UXR nên kiểm giả thuyết tỉ lệ khách có email ở dữ liệu thật.
- Trạng thái: Open

### FB-R1-ARC-SEC-04
- Mức độ: Minor
- Vị trí: SR-SECR-05(c) ("`NODE_ENV=production` mà adapter tiền (`PAYMENT_*_MODE`, `BANKFEED_PROVIDER`) là `mock` → dừng khởi động")
- Vấn đề: Theo INT, mỗi cổng có biến `_MODE` và hiện chỉ có `mock|sandbox|production`; `BANKFEED_PROVIDER=none` là "tắt". Nếu INV chọn ESC-INT-B phương án B/C (không ký MoMo, VNPay ở R3), cổng chưa ký chỉ có thể để `mock` → production **không khởi động được**, hoặc người vận hành đặt `production` không có khóa.
- Vì sao quan trọng: chặn go-live vì một cổng không dùng; hoặc đẩy người vận hành vào cấu hình sai.
- Đề xuất sửa: Viết lại (c): "adapter tiền **đang bật** mà ở chế độ `mock` → dừng khởi động; cổng không dùng đặt `off`". ARC đã gửi INT thẻ FB-R1-ARC-INT-12 thêm giá trị `off` + `PAYMENT_METHODS_ENABLED`.
- Trạng thái: Open

### FB-R1-ARC-SEC-05
- Mức độ: Minor
- Vị trí: SR-DEV-02 (cấp thiết bị trên origin admin-web), SR-DEV-04 (PWA không bao giờ được cấp), SR-DEV-07 (checklist cứng hóa viết cho máy tính: BitLocker/FileVault, tài khoản OS chuẩn…); threat-model mục 11 giả định máy quầy là 1–2 máy tính
- Vấn đề: Chưa nói rõ một **điện thoại/máy tính bảng của cơ sở** mở admin-web có được cấp làm thiết bị tin cậy hay không. Nhu cầu có thật: người trực đêm nhận phòng (BA P03 E2 – ARC đã gửi FB-R1-ARC-BA-01). Câu chữ hiện tại cho phép về kỹ thuật (chỉ cấm origin PWA) nhưng checklist SR-DEV-07 không áp được cho điện thoại.
- Vì sao quan trọng: nếu không có câu trả lời, BA/DOM sẽ chọn phương án vận hành không đúng ý SEC, hoặc BE chặn nhầm.
- Đề xuất sửa: Thêm SR-DEV-08: "Thiết bị di động **của cơ sở** (không phải máy cá nhân) mở admin-web được cấp như máy quầy với checklist di động: khóa màn hình ≤ 1 phút + mã PIN/sinh trắc, mã hóa thiết bị bật sẵn, không cài ứng dụng chat, cập nhật OS, 'Tìm thiết bị' bật để xóa từ xa; hết hạn ≤ 30 ngày". Nếu SEC không chấp nhận → ghi rõ "không" để BA chọn phương án (b) của thẻ BA-01.
- Trạng thái: Open

### FB-R1-ARC-SEC-06
- Mức độ: Minor
- Vị trí: SR-LOG-06 ("xem C3 **ngoài giờ ca cấu hình**"), SR-C3-12
- Vấn đề: MVP không có ca/chấm công (plan R1 mục 8 #13 → ngoài MVP), ERD không có bảng ca. "Giờ ca cấu hình" chưa có nguồn dữ liệu.
- Vì sao quan trọng: yêu cầu không có dữ liệu để kiểm = không test được, QC sẽ đánh dấu chưa đạt.
- Đề xuất sửa: Đổi thành "ngoài khung giờ `front_desk_hours` của cơ sở (tham số BR mục 13 đã có)", hoặc dời điều kiện này sang khi có phân hệ ca.
- Trạng thái: Open

### FB-R1-ARC-SEC-07
- Mức độ: Suggestion
- Vị trí: threat-model mục 9 TM-13 (chiếm root VPS = có KEK + DB); SR-KEY-03, SR-KEY-04; SR-BAK-03
- Vấn đề: Đồng ý không mua KMS/HSM (vượt ngân sách, đúng ADR-010/013). Có thể giảm thêm một phần TM-13 mà **không tốn tiền**: hiện KEK nằm trong `/opt/ottimo/.env` trên đĩa VPS → có trong snapshot ổ đĩa của nhà cung cấp và trong bất kỳ bản sao ổ nào.
- Vì sao quan trọng: kẻ lấy được bản sao ổ đĩa (TA-10, nhà cung cấp VPS) nhưng không chiếm được máy đang chạy sẽ không có KEK.
- Đề xuất sửa: Thêm SR-KEY-10 (N, R3): KEK không ở `.env` chung mà ở tệp riêng `0400` chủ root, nạp vào container qua Docker secret (tmpfs `/run/secrets`), thư mục chứa tệp loại khỏi mọi bản sao lưu tệp; kết hợp SR-BAK-03 (tắt snapshot tự động). Ghi rõ đây không chống được kẻ có root trên máy đang chạy (rủi ro TM-13 vẫn High). Không đề xuất "mở khóa tay sau khởi động" vì xung đột với tự vá + khởi động lại tự động (SR-OPS-03).
- Trạng thái: Open

### FB-R1-ARC-SEC-08
- Mức độ: Suggestion
- Vị trí: SR-BAK-04 ("đích backup chỉ cho **ghi thêm** … hoặc đích tự kéo về")
- Vấn đề: Đúng hướng nhưng chưa nêu cơ chế cụ thể theo phương án hosting của OPS. PA2 dùng VPS thứ hai (khác hãng); PA1 dùng BizFly Simple Storage – chưa xác minh có Object Lock/versioning.
- Vì sao quan trọng: OPS cần cơ chế cụ thể để ước tính công và chọn PA (ESC hosting).
- Đề xuất sửa: Ghi 2 cách miễn phí: (a) PA2 – máy phụ **tự kéo** (pull) bản sao lưu đã mã hóa từ VPS chính qua SSH khóa chỉ đọc vào thư mục backup; hoặc `restic rest-server --append-only` trên máy phụ; (b) PA1 – chỉ chọn object storage nếu xác nhận được Object Lock/versioning + khóa truy cập không có quyền xóa. OPS chọn khi lấy báo giá.
- Trạng thái: Open

### FB-R1-ARC-SEC-09
- Mức độ: Suggestion
- Vị trí: SR-AZ-09 (bộ test phân quyền sinh từ OpenAPI: mỗi operation × 8 vai + khách mức 1/2 + không đăng nhập), DoD mục 20
- Vấn đề: OpenAPI hiện ~150 operation → khoảng 1.600–1.800 ca. Khả thi nhưng chỉ khi tách hai lớp, nếu không R2 sẽ tốn công viết fixture cho từng ca.
- Vì sao quan trọng: năng lực BE/QA R2 là rủi ro T1 (architecture mục 19).
- Đề xuất sửa: Ghi rõ 2 lớp trong SR-AZ-09: (1) **tự sinh hoàn toàn** cho lớp hành động (`x-roles` → 403/không 403) dùng một bộ seed chung 2 cơ sở – chạy mọi operation; (2) **viết tay** cho phạm vi (IDOR, `x-scope` M/T/Đ, 404 chéo cơ sở) cho khoảng 10 tài nguyên chính (Reservation, Folio, Guest, Quote, Lead, Commission, Registration, Document, DoorCredential, LeaseContract). ARC sẽ thêm `x-roles` đầy đủ + lint ở bước 4 để lớp (1) chạy được.
- Trạng thái: Open

### FB-R1-ARC-SEC-10
- Mức độ: Suggestion
- Vị trí: SR-SES-03 (admin-web hết phiên sau 30 phút không hoạt động), SR-C3-09 (xác thực lại trước khi xem C3 nếu lần xác thực gần nhất > 15 phút), SR-C3-11 (sao chép từng trường), SR-C3-10 (watermark)
- Vấn đề: Mỗi yêu cầu hợp lý, nhưng cộng lại ở giờ cao điểm nhận phòng (lễ tân vừa đối chiếu giấy tờ, vừa khai báo cho 3–4 đơn) có thể làm vượt mục tiêu thời gian quầy (BR-426/PRD) và khiến nhân viên tìm cách lách (chụp màn hình bằng điện thoại – TM-17).
- Vì sao quan trọng: biện pháp bảo mật bị lách thì mất tác dụng; nên đo trước khi khóa cứng.
- Đề xuất sửa: Định nghĩa step-up C3 là **cửa sổ trượt 15 phút** tính theo lần thao tác C3 gần nhất (không phải lần đăng nhập), và đưa tổ hợp này vào kịch bản test khả dụng của UXR ở R2 (đo số lần nhập PIN/ca); giữ tham số để SEC chỉnh sau khi có số liệu.
- Trạng thái: Open

---

## Điểm làm tốt nên giữ
1. Mọi yêu cầu có mã SR, **cách kiểm chứng**, round và vai; DoD bảo mật cho story R2 (mục 20) – QA/QC dùng được ngay, không phải diễn giải.
2. Bám ngân sách thật: chọn TOTP thay SMS OTP, rate limit trên PostgreSQL thay Redis, `age` thay dịch vụ backup trả phí, thừa nhận rõ TM-13 là rủi ro còn lại vì không có KMS thay vì đòi thêm hạ tầng.
3. Phát hiện đúng 3 lỗi thiết kế nặng của ARC trước khi code: xác minh mức 2 bằng mã đơn tăng dần, "hủy khóa" không xóa khỏi backup, "C3 chỉ trên máy quầy" chưa có cơ chế – kèm cơ chế thay thế cụ thể (thiết bị được cấp, OTP/mã lễ tân, `purge_journal`).

---

## Tự nhận lỗi để sửa ở bước 4 (tài liệu của ARC – không sửa bây giờ)

Các lỗi trong `architecture.md`, ADR, `erd.md`, `api/openapi.yaml` mà vai khác đã nêu hoặc ARC tự phát hiện khi review. ARC sẽ trả lời từng mục trong `responses/ARC-responses.md` và sửa ở bước 4.

### A. Do SEC nêu (`rounds/round-01/outputs/SEC/report.md` mục 4)
| # | Mục | Lỗi | Sửa dự kiến |
|---|---|---|---|
| 1 | SEC-R1-01 | OpenAPI `verifyGuestSession` lên mức 2 bằng `phoneLast4`/`bookingCode` | Bỏ 2 trường; OTP email + mã xác minh lễ tân; thêm endpoint gửi OTP, endpoint FD+ cấp mã (SR-GST-07) |
| 2 | SEC-R1-02 | `guest_session.failed_verify_count` đếm theo phiên | Chuyển bộ đếm + `verify_locked_until` + bộ đếm OTP sang `guest_access_token` |
| 3 | SEC-R1-03 | "C3 chỉ trên máy quầy" chưa có cơ chế | Bảng `trusted_device`, cookie `__Host-ottimo_did`, `x-requires-trusted-device`, endpoint cấp/thu hồi (OWN) |
| 4 | SEC-R1-04 | ADR-013 nói hủy DEK làm backup cũ không giải mã được (sai); ADR-010 giữ backup "3 tháng" | Sửa câu chữ ADR-013; ADR-010 vòng đời ≤ 35 ngày (7 ngày + 4 tuần), snapshot tắt/≤ 7 ngày; thêm `purge_journal` (cũng là ý OPS – hosting-plan mục 7) |
| 5 | SEC-R1-05 | Đổi vai/khóa tài khoản không thu hồi phiên | Sửa mô tả `PUT /users/{id}/roles`, `PATCH /users/{id}`: thu hồi mọi phiên |
| 6 | SEC-R1-07 | Webhook thiếu `{propertySlug}`, chỉ POST, enum có `mock`, chưa giới hạn body | Đường dẫn `/v1/webhooks/{provider}/{propertySlug}`, thêm GET khi cổng cần, `mock` chỉ ngoài production, body ≤ 64 KB |
| 7 | SEC-R1-09 | `Guest.tags`, `serviceNotes`, `warnings`, `Party.members` lệch rbac D10/D12 | Thêm `x-visible-to` đúng danh sách SEC; ghi serializer `own_count_only` |
| 8 | SEC-R1-10 | `QuoteCalculation.commission`, `Folio.totals` lộ cho FD/CTV | `x-visible-to` theo rbac |
| 9 | SEC-R1-06, 11–22 | (Medium/Low, cũng thuộc ARC) render `checkin_link` cho CTV, `guests/lookup` dò SĐT, `writeOnly`, mã cửa ≥ 6 số, `AuditEvent.before/after`, trường `c3_access_log`, giới hạn tệp, rút đồng ý, `/me/password` + PIN + cột 2FA, `data_key_id` trẻ em + `visa_kind_enc`, `ip_hmac`, `purge_journal`, `Idempotency-Key`/`If-Match` cho thao tác C3 | Xử lý theo mức P2/P3 SEC đề xuất, ưu tiên các mục chạm R2 Must |

### B. Do QA nêu (`rounds/round-01/outputs/QA/report.md`)
| # | Mục | Lỗi | Sửa dự kiến |
|---|---|---|---|
| 10 | QA #1 (P1) | Khoảng ngày khối OOO: `endDatePlanned` không rõ bao gồm hay nửa mở (BR-804 bao gồm, BL 4.4 nửa mở) | Chốt cùng DOM; OpenAPI dùng `[startDate, endDate)` nửa mở như mọi khoảng lưu trú, UI hiển thị "đến hết ngày X" = `endDate − 1`; ghi rõ trong `RoomBlockCreate` + erd 4.9 |
| 11 | QA #3 | Mã lỗi khóa lạc quan: ADR-009 `409 VERSION_CONFLICT` vs OpenAPI/BA `412` | Thống nhất `412 PRECONDITION_FAILED` (`If-Match`), sửa ADR-009 |
| 12 | QA #6 | US-023 AC2 (Must R2) cần gộp hồ sơ khách, ERD để R3, OpenAPI không có endpoint | Chờ PO xác nhận phạm vi; nếu giữ R2 → thêm `POST /guests/{id}/merge` + cột ERD |
| 13 | QA #7 | US-087 AC2 cần endpoint hoa hồng (chưa có) | Thêm `GET /commissions` (phạm vi M cho SAL/CTV) + `PATCH …/paid` (OWN/MGR) |
| 14 | QA (rủi ro kiểm thử) | `FixedClock` chỉ đóng băng giờ; chưa tua giờ, chưa gọi job theo yêu cầu | Thêm `MutableClock` (dev/staging/test) + endpoint/CLI chỉ ngoài production: đặt/tua giờ, chạy job theo `job_key`; SR-SECR-05 vẫn chặn ở production. Ghi vào ADR-008 + architecture 9.1 |

### C. Do OPS nêu
| # | Mục | Lỗi | Sửa dự kiến |
|---|---|---|---|
| 15 | OPS report R3 | ADR-010 giữ backup 3 tháng vs SEC T18 ≤ 35 ngày | Gộp với mục 4 |
| 16 | OPS G2 | Compose ở `infra/docker-compose.yml`, architecture mục 17 và ADR-012 ghi `infra/compose/` | Sửa architecture 17 + lệnh `pnpm dev` ở ADR-012 theo vị trí OPS (FB-R1-ARC-OPS-11) |

### D. Do UXD nêu (`rounds/round-01/outputs/UXD/report.md` mục ARC)
| # | Mục | Lỗi | Sửa dự kiến |
|---|---|---|---|
| 17 | UXD (a) | Bảng mã lỗi OpenAPI thiếu `DEVICE_NOT_TRUSTED` (403) | Thêm mã thứ 38 + `x-requires-trusted-device` |
| 18 | UXD (b) | `verifyGuestSession` còn `phoneLast4`/`bookingCode` | Gộp với mục 1 |
| 19 | UXD (c) | Thiếu endpoint màn Hoa hồng (US-087), cấp/thu hồi thiết bị, 2FA TOTP | Gộp mục 13 + 3; thêm `/me/2fa` (đăng ký, xác nhận, tắt), mã khôi phục (R3) |

### E. ARC tự phát hiện khi review bước 3
| # | Nơi | Lỗi | Sửa dự kiến |
|---|---|---|---|
| 20 | `architecture.md` mục 13 dòng PaymentAdapter | Ghi "trạng thái giao dịch của INT dùng nguyên trong ERD" – sai; ERD theo BA SM-12 (`pending/succeeded/failed/expired/reversed`, hoàn tiền là dòng riêng) | Sửa câu chữ; INT chỉnh theo FB-R1-ARC-INT-11 |
| 21 | ADR-011 mục 1 + ADR-012 | Ghi lõi phụ thuộc `@ottimo/integrations/contracts` nhưng chưa quy định cách đóng gói ESM/CJS; khung hiện tại sẽ gãy khi API (CommonJS) import giá trị từ package ESM-only | Chốt Node ≥ 22.12 + điều kiện `default` trong `exports` (hoặc package CJS) và `moduleResolution: Node16` cho API (FB-R1-ARC-OPS-01) |
| 22 | `api/openapi.yaml` | Chưa từng chạy `redocly lint`; chưa có `x-roles` lint (SR-AZ-01) | Tự chạy lint, sửa lỗi; phối hợp OPS thêm job CI (FB-R1-ARC-OPS-08) |
| 23 | `api/openapi.yaml` `allowedActions` | Tên hành động chưa khớp mã sự kiện của BA | Dùng mã sự kiện BA thêm theo FB-R1-ARC-BA-10 |
| 24 | `erd.md` + OpenAPI phần khách | `x-visible-to` cho khách chưa tách mức 1/mức 2/sau trả phòng | Đồng bộ theo bảng BA sau FB-R1-ARC-BA-02 và SR-GST-06/11 |
