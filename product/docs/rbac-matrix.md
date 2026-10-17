# Ma trận phân quyền (RBAC) – OTTIMO Desk

- Tác giả: BA | Round 1 – Bước 4 (Phản hồi & sửa) | Ngày: 15/10/2026 | Phiên bản: 0.2.2 (R2 Sprint 2: S33 theo vai – ghi chú 33a; 0.2.1 đã xử lý review DOM, ARC, SEC, QA #12 – xem `rounds/round-01/responses/BA-responses.md`; bước 5 sửa BUG-R1-005, -006; thêm A119 theo BUG-R1-SEC-02)
- Bản máy đọc: `rbac-matrix.json` (vai × hành động × endpoint OpenAPI) – sinh từ tài liệu này; khi lệch, tài liệu này là nguồn sự thật.
- Nguồn: BL mục 2 và 8.2 #27; `security/data-risk-assessment.md` mục 3 (thang C0–C3), mục 4 (kiểm kê D01–D28), mục 8 (R-REG), mục 11; `business-rules.md` (BR-432, 433, 610…); `PRD.md` mục 4; backlog US-002, 003, 007, 020, 048, 087; decision-log 15/10/2026.
- Không chép con số nghiệp vụ: hạn mức duyệt, thời hạn lưu… ghi bằng mã BR.
- Đọc cùng `state-machines.md` (cột "Ai được chuyển" dùng cùng mã vai).

## 1. Vai và nhóm người dùng

| Mã | Vai (code) | Nhóm PRD | Ai (BL/persona) | Thiết bị chính `[GIẢ ĐỊNH]` | Màn hình mặc định sau đăng nhập |
|---|---|---|---|---|---|
| OWN | `owner` – Chủ đầu tư | U1 | Chủ đầu tư (P1) | Điện thoại + laptop | Tổng quan |
| MGR | `manager` – Quản lý | U1 | Quản lý anh Hoàng Anh | Laptop + điện thoại | Tổng quan |
| FDL | `front_desk_lead` – Lễ tân trưởng | U2 | Lễ tân trưởng Hạnh | Máy quầy (thiết bị được cấp) | **Hôm nay** (Sơ đồ phòng mở bằng 1 lần bấm) |
| FD | `front_desk` – Lễ tân (gồm người trực đêm BR-611) | U2 | Lễ tân (P2) | Máy quầy hoặc máy tính bảng **của cơ sở** đã được cấp (admin-web); điện thoại cá nhân chỉ dùng PWA – không có C3 | **Hôm nay** (Sơ đồ phòng mở bằng 1 lần bấm) |
| HK | `housekeeping` – Buồng phòng | U3 | Chị Lan, chị Mai (P3) | Điện thoại | Buồng phòng – việc hôm nay |
| MT | `maintenance` – Bảo trì/kỹ thuật | U3 | Anh Tùng (P3 kiêm) | Điện thoại | Bảo trì – phiếu đang mở |
| SAL | `sales_staff` – Sale nội bộ (nhân viên) | U4 | NV Hạnh | Điện thoại | Sale & báo giá |
| CTV | `collaborator` – CTV/môi giới (ngoài biên chế) | U4 | CTV Minh Anh (P4) | Điện thoại | Sale & báo giá |
| GST | Khách (không có tài khoản; truy cập bằng link theo đơn) | U5 | P5, P6, P7 | Điện thoại | App khách của đơn |
| SYS | Hệ thống (job, webhook) | – | – | – | – |

Quy tắc vai:
1. **Kế thừa**: FDL = FD + quyền duyệt trong hạn mức BR-433 + ngoại lệ nhận phòng (BR-402). OWN = MGR + quản lý tài khoản/vai + đặt hạn mức FOC và tỷ lệ hoa hồng (mục 5.3).
2. **Nhiều vai một người**: quyền = hợp các vai (ví dụ P2 lễ tân kiêm sale nội bộ = FD ∪ SAL; P3 = HK ∪ MT). Phạm vi dữ liệu "của mình" của SAL vẫn áp cho màn Sale; khi thao tác ở màn Lễ tân thì theo quyền FD.
3. **Theo cơ sở**: mọi quyền gắn với cơ sở (đa cơ sở thiết kế sẵn, MVP 1 cơ sở – decision-log). Người dùng chỉ thấy cơ sở được gán.
4. **Không có vai F&B, kế toán riêng** (decision-log PO): việc kho do FD+HK, việc kế toán do OWN/MGR.
5. Vai khách GST không phải tài khoản: **một link cho mỗi đơn** (ADR-006), có 2 mức (SR-GST-06/07, decision-log SEC 15/10/2026):
   - **GST1** – chỉ có link: Wi-Fi, nội quy, gửi yêu cầu, check-in online (tải giấy tờ – chỉ ghi), ghi đồng ý.
   - **GST2** – link + xác minh: OTP gửi email của đơn **hoặc** mã xác minh do lễ tân cấp (A113). 4 số cuối SĐT và mã đặt phòng **không** là yếu tố xác minh. Mã lễ tân cấp được gửi qua kênh nhắn tin OTA hoặc Zalo **chỉ khi OWN bật kênh đó** (mặc định tắt – phân xử ORC 15/10/2026, A118); mặc định đọc tại quầy hoặc qua điện thoại.
   - **GSTp** – sau `checked_out`: ân hạn tối đa 24 giờ, **bắt buộc GST2**, chỉ xem bill và thanh toán phát sinh; Wi-Fi, mã cửa, yêu cầu, tải giấy tờ → ✖ (SR-GST-11, threat-model M4). Đơn dài hạn: GSTp áp sau khi HĐ `closed`.

## 2. Ký hiệu

| Ký hiệu | Nghĩa |
|---|---|
| ✔ | Được, toàn bộ dữ liệu của cơ sở |
| M | Chỉ dữ liệu **của mình** (do mình tạo, được gán phụ trách, hoặc mình là người chốt) |
| T | Chỉ dữ liệu **liên quan việc hôm nay** của mình (căn có việc/phiếu được giao hoặc trong danh sách hôm nay) |
| Đ | Chỉ đơn của chính khách (link). **Đ1** = đủ ở mức GST1; **Đ2** = cần GST2; **Đp** = còn được trong ân hạn sau trả phòng (GSTp, luôn kèm GST2) |
| Q | Chỉ trên **thiết bị được cấp** mở admin-web (8.7); từ PWA hoặc thiết bị chưa cấp → server từ chối `DEVICE_NOT_TRUSTED` |
| R | Chỉ xem (không sửa) |
| D | Được gửi, **cần duyệt** qua SM-10 |
| L | Mỗi lần xem/thao tác ghi nhật ký truy cập C3 |
| ✖ | Không có quyền: không hiện menu/nút **và** server từ chối, ghi nhật ký lần bị từ chối (US-002 AC2) |

Mức phân loại dữ liệu theo SEC mục 3: **C0** công khai · **C1** nội bộ · **C2** nhạy cảm · **C3** rất nhạy cảm.

## 3. Ma trận theo màn hình

| Mã | Màn hình (phân hệ PRD) | OWN | MGR | FDL | FD | HK | MT | SAL | CTV | GST |
|---|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| S01 | Đăng nhập, đổi mật khẩu, PIN duyệt (M0) | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✖ |
| S02 | Tổng quan – KPI đêm nay, khách đến/đi, "Cần chú ý" (M1) | ✔ | ✔ | ✔ | ✔ ¹ | ✖ | ✖ | ✖ | ✖ | ✖ |
| S03 | Room rack 14 ngày (M2) | ✔ | ✔ | ✔ | ✔ | R ² | R ² | R ³ | R ³ | ✖ |
| S04 | Chi tiết đơn + folio (M2) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | M | M ⁴ | Đ1 (ngày ở, căn) / Đ2 (folio) / Đp (bill) |
| S05 | Đặt phòng mới ngắn ngày (M2) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | ✖ ⁵ | ✖ ⁵ | ✖ |
| S06 | Nhận phòng (M2) | ✔ Q | ✔ Q | ✔ Q | ✔ Q | ✖ | ✖ | ✖ | ✖ | ✖ |
| S07 | Trả phòng 3 bước + bill (M2, M6, M12) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ |
| S08 | Gia hạn, trả muộn, xác nhận giờ trả, đổi phòng (M2) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | Đ1 ⁶ |
| S09 | Giấy tờ & khai báo lưu trú (M3) | ✔ L Q | ✔ L Q | ✔ L Q | ✔ L Q | ✖ | ✖ | ✖ | ✖ | Đ1 ⁷ |
| S10 | Buồng phòng – trạng thái, việc hôm nay, checklist (M4) | ✔ | ✔ | ✔ | ✔ | ✔ | R | ✖ | ✖ | ✖ |
| S11 | Bảo trì – phiếu sửa, khóa phòng, bảo trì định kỳ (M5) | ✔ | ✔ | ✔ | ✔ | ◐ ⁸ | ✔ | ✖ | ✖ | ✖ |
| S12 | Chốt công tơ điện nước (M5) | ✔ | ✔ | ✔ | ✔ | ✖ | ✔ ⁹ | ✖ | ✖ | ✖ |
| S13 | Kho F&B / minibar (M6) | ✔ | ✔ | ✔ | ✔ ¹⁰ | ◐ ¹⁰ | ✖ | ✖ | ✖ | ✖ |
| S14 | Khách hàng – CRM (M7) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | M | M | ✖ |
| S15 | Sale & báo giá, kanban lead (M8) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | M | M | ✖ |
| S16 | Hợp đồng dài hạn, kỳ thu (M8) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | M R | M R | Đ2 ¹¹ |
| S17 | Hoa hồng (M8) | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | M R | M R | ✖ |
| S18 | Kênh OTA, lịch giá, đồng bộ (M9) | ✔ | ✔ | R | R ¹² | ✖ | ✖ | ✖ | ✖ | ✖ |
| S19 | Báo cáo vận hành (công suất, ADR, RevPAR, ALOS) (M10) | ✔ | ✔ | R ¹³ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ |
| S20 | Báo cáo kênh (doanh thu, phí kênh, thực thu) (M10) | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ |
| S21 | Lãi lỗ P&L + nhập chi phí (M10) | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ |
| S22 | Báo cáo FOC (M10) | ✔ | ✔ | M R ¹⁴ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ |
| S23 | Hộp duyệt (yêu cầu chờ duyệt SM-10) | ✔ | ✔ | ✔ ¹⁵ | M ¹⁶ | M ¹⁶ | M ¹⁶ | M ¹⁶ | M ¹⁶ | ✖ |
| S24 | Tham số quy tắc (bảng BR mục 13) (M0) | ✔ | ✔ ¹⁷ | R | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ |
| S25 | Danh mục căn, nhóm căn, giá niêm yết (M0) | ✔ | ✔ | R ²⁵ᵃ | R ²⁵ᵃ | ✖ ²⁵ᵃ | ✖ ²⁵ᵃ | R ²⁵ᵃ | R ²⁵ᵃ | ✖ |
| S26 | Người dùng & vai, thiết bị được cấp, phiên đăng nhập, 2FA (M0) | ✔ | ◐ ²⁰ᵃ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ |
| S27 | Nhật ký thao tác (tiền, trạng thái) (M0) | ✔ | ✔ | M | M | ✖ | ✖ | ✖ | ✖ | ✖ |
| S28 | Nhật ký truy cập dữ liệu C3 (M0, M3) | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ |
| S29 | Mẫu tin nhắn đa ngôn ngữ – dùng / sửa mẫu (M13) | ✔ | ✔ | ✔ dùng | ✔ dùng | ✖ | ✖ | ✔ dùng | ✔ dùng | ✖ |
| S30 | Yêu cầu khách & đồ thất lạc (M11, BR-513) | ✔ | ✔ | ✔ | ✔ | T ¹⁸ | T ¹⁸ | ✖ | ✖ | Đ1 |
| S31 | Yêu cầu của chủ thể dữ liệu (xem/sửa/xóa/rút đồng ý – SEC R-DSR) | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | Đ2 ¹⁹ |
| S32 | Ca làm việc & đóng ca (P11, SM-17) | ✔ | ✔ | ✔ | M | ✖ | ✖ | ✖ | ✖ | ✖ |
| S33 | Đối soát chuyển khoản (P11, SM-12) | ✔ | ✔ | M R ³³ᵃ | M R ³³ᵃ | ✖ | ✖ | M R ³³ᵃ | ✖ | ✖ |
| S34 | Danh sách dự phòng mất mạng (P12) – bản in/bản đọc offline | ✔ | ✔ | ✔ Q | ✔ Q | ✖ | ✖ | ✖ | ✖ | ✖ |

Ghi chú:
1. FD thấy KPI đêm nay và "Cần chú ý" vận hành; **không** thấy dòng tài chính (doanh thu tháng, ADR, RevPAR, cảnh báo FOC BR-435). Cảnh báo FOC chỉ đến OWN.
2. HK, MT xem rack ở dạng **trạng thái căn + có/không có khách đến hôm nay/ngày mai**; không thấy tên khách ngoài phạm vi T, không thấy kênh, giá.
3. SAL/CTV xem **phòng trống** (căn – đêm còn/hết) để báo giá; không thấy tên khách, kênh, giá của đơn người khác.
4. CTV chỉ thấy đơn mình chốt; không thấy folio chi tiết ngoài tổng tiền phòng và cọc (cơ sở hoa hồng).
5. SAL/CTV không đặt phòng ngắn ngày trực tiếp; tạo **giữ chỗ từ báo giá** ở S15 (BR-112, luồng P01/P02).
6. GST: yêu cầu ở thêm/trả muộn (R3 tự phục vụ – US-113); lễ tân xác nhận.
7. GST: chỉ tải giấy tờ của đơn mình (check-in online) và xem trạng thái "đã nhận/đã khai"; không xem lại ảnh đã tải.
8. HK: tạo phiếu (báo sự cố), xem phiếu của căn mình đang dọn; không đổi trạng thái phiếu.
9. MT: chỉ thấy số căn + chỉ số, **không thấy tên khách** (SEC D18).
10. FD: xuất nhập tồn, kiểm kê (nhập số), minibar; HK: kiểm minibar, tick bổ sung tủ; **HK không thấy giá vốn** (US-003 AC2). Giá vốn chỉ OWN/MGR (mục 6).
11. GST dài hạn: xem HĐ của mình, lịch dọn, kỳ thu, hóa đơn điện nước (US-114).
12. FD: xem tình trạng đồng bộ và nhật ký lỗi (BR-905) để xử lý cảnh báo; không sửa giá.
13. FDL: báo cáo vận hành không có doanh thu (chỉ công suất, ALOS, số đêm) – BA đề xuất, chờ DOM.
14. FDL: báo cáo FOC của các yêu cầu mình gửi hoặc duyệt.
15. FDL: yêu cầu thuộc hạn mức FDL theo BR-433.
16. M: chỉ thấy trạng thái các yêu cầu mình gửi và rút lại được (A6). CTV gửi gia hạn báo giá (A51) nên cần theo dõi được yêu cầu của mình (QA #12) – ARC thêm `collaborator` với `x-scope: own` vào `listApprovalRequests` và `cancelRequest`.
33a. **S33 theo vai (R2 Sprint 2 – trả lời ARC Q-B1)**: OWN/MGR xem toàn cơ sở và đối soát (A46). FDL, FD, SAL chỉ **xem** giao dịch **của mình** (`recordedBy` hoặc `confirmedBy` = mình – suy từ A33; SAL chỉ cọc đơn của mình) để theo dõi cờ "chờ đối soát"; không đối soát (A46 ✖). Khớp `listPayments` `x-scope: own` (OpenAPI 0.3.3) và EP03-05 mục 2.4. Bản cũ (FDL R toàn bộ, FD ✖) bỏ.
37. **Danh sách người chốt – `listCloserCandidates`** (ARC A-06, OpenAPI 0.3.5; S05): FD+ thấy **chỉ** `userId`, `displayName` (D27), `kind` (`agent`/`staff`) của CTV/sale nội bộ đang hoạt động để chọn `closerUserId` khi tạo đơn; **không** username, SĐT, email, trạng thái khóa. SAL/CTV ✖ (S05). Bản máy đọc: hành động `A01-closer` trong `rbac-matrix.json`.
38. **A46a, A47a – tách theo phương thức tiền** (PO 16/10, decision-log; Q-S3-1, ARC B-30/B-31): tiền mặt tại quầy là việc lễ tân thấy tận tay nên FD+ làm được – A46a xác nhận tiền mặt SAL/CTV nộp quầy, A47a chi hoàn tiền mặt đã duyệt; cả hai **cấm tự làm với khoản của chính mình** (người ghi / người tạo yêu cầu – server kiểm, 403 `SELF_RECONCILE_FORBIDDEN` / `SELF_APPROVAL_FORBIDDEN` hoặc mã ARC đặt). Chuyển khoản/VietQR (đối soát sao kê A46, chi chuyển khoản A47 – cần D15 C3) **giữ MGR+**. Operation: xem `outputs/ARC/s3-contract.md` mục "BA – ánh xạ A46a/A47a".
39. **Tách nhiệm hoàn chuyển khoản – "trừ OWN"** (PO 17/10, SEC-37; cùng mẫu A46 "trừ OWN"): với mọi vai, người duyệt ≠ người đặt/đổi nơi nhận và người chi (A47) ≠ người tạo yêu cầu ≠ người duyệt ≠ người đặt nơi nhận. **OWN** được miễn trong cùng một khoản: vừa duyệt vừa chi (kể cả khi OWN đặt nơi nhận), mỗi bước vẫn xác nhận lại + `If-Match`, nhật ký ghi rõ "OWN tự duyệt và chi". **MGR** không bao giờ vừa duyệt vừa chi cùng một khoản (→ 403 `SELF_APPROVAL_FORBIDDEN`). Hoàn tiền mặt (A47a) không đổi (người chi ≠ người tạo yêu cầu).
40. **Hồ sơ khách nguồn "từ giấy tờ"** (`Guest.source = document`; BUG-R2-033 b, PO 17/10 A, SEC duyệt có điều kiện 17/10 – `reviews/s3-SEC.md` mục 7): hồ sơ tối thiểu do server tạo khi nhập giấy tờ người đi cùng không khớp ai (tên trên giấy tờ, quốc tịch; **không** ngày sinh, số/khóa giấy tờ, liên hệ, tag/ghi chú). FD+ thấy (chip "Từ giấy tờ"); **SAL/CTV không thấy** hồ sơ loại này ở `searchGuests`, bộ chọn khách, `lookupGuestByContact`, danh sách/xuất tiếp thị – kể cả khi đơn là của mình (chỉ thấy số người như D10); HK: tên gọi + căn trong ngày (D01 T); MT ✖. Khóa giấy tờ trên hồ sơ (`id_doc_hmac`) chỉ khi chính người đó đồng ý P05 (EP06 4.1). Hết điều kiện khi hồ sơ có SĐT/email hoặc đồng ý P05 → áp quyền như hồ sơ thường (D01, D02).
20a. **Round 2: chỉ OWN** xem danh sách, cấp, thu hồi thiết bị được cấp (A110 – `listTrustedDevices`, `trustCurrentDevice`, `revokeTrustedDevice`); MGR ✖ – khớp OpenAPI, wireframe L1 và ARC-responses bước 4 ("thiết bị giữ owner"), chặt hơn SR-DEV-01 nên vẫn đạt yêu cầu SEC. Ở S26, MGR chỉ quản lý mật khẩu/PIN/2FA/phiên **của mình** (A112); không gán vai, không đặt lại 2FA người khác. Ủy quyền cho MGR khi OWN bật (tùy chọn của SR-DEV-01) **chưa làm**; khi PO đưa vào round sau, BA thêm lại MGR ◐ kèm tham số bật ủy quyền và báo ARC thêm `manager` vào `x-roles` (BUG-R1-006).
25a. S25 theo vai (khớp `listRooms`, `listRoomGroups`; BUG-R1-005): OWN/MGR xem đầy đủ + sửa (A101/A103). FDL/FD/SAL/CTV chỉ **xem dạng tra cứu** (`x-scope: catalog_only`): số căn, tầng, nhóm căn, tên, sức chứa (`baseOccupancy`, `maxOccupancy` – cần để xếp khách và báo giá, BR-601) và giá niêm yết hiện hành; không thấy lịch sử giá. **HK/MT ✖: không dùng `listRooms`/`listRoomGroups`.** Số căn, tầng, nhóm căn mà HK/MT cần lấy từ **danh sách việc buồng phòng** (S10 – `listHkTasks`, `listRoomStatuses`), phiếu sửa (S11 – `listWorkOrders`) và rack dạng trạng thái (S03, ghi chú 2). Với HK/MT, `maxOccupancy`, `baseOccupancy` và mọi giá là **K** (không trả về); ARC gắn `x-visible-to: [owner, manager, front_desk_lead, front_desk, sales_staff, collaborator]` cho `Room.maxOccupancy`, `RoomGroup.maxOccupancy`, `RoomGroup.baseOccupancy` nếu các schema này còn xuất hiện trong response dành cho HK/MT.
17. MGR sửa tham số vận hành; **không** sửa hạn mức FOC (`foc_limits`), tỷ lệ hoa hồng, phí kênh – chỉ OWN (mục 5.3).
18. HK/MT: yêu cầu định tuyến tới bộ phận mình (BR-811); đồ thất lạc: HK được tạo bản ghi (người nhặt), không xem danh sách đồ giá trị.
19. GST: gửi yêu cầu qua app (mức GST2); OWN/MGR xử lý (SEC R-DSR-01). Bản sao dữ liệu giao qua app khách mức 2, không đính kèm email (A77).

## 4. Ma trận theo hành động

Cột "Duyệt" = vai duyệt khi hành động cần duyệt (SM-10). Hạn mức theo BR-433.

### 4.1 Đơn, rack, nhận/trả phòng
| # | Hành động | OWN | MGR | FDL | FD | HK | MT | SAL | CTV | GST | SYS | Duyệt / ghi chú |
|---|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|---|
| A01 | Tạo đơn ngắn ngày đã đảm bảo (B2) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✔ (OTA R3) | – |
| A02 | Tạo giữ chỗ (B1) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | M | M | ✖ | ✖ | Khách của mình |
| A03 | Gia hạn giữ chỗ (B3) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | M | M | ✖ | ✖ | 1 lần (BR-303) |
| A04 | Xác nhận cọc/ký quỹ (B4) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | M | ✖ ²⁰ | ✖ | ✔ (IPN R3) | – |
| A05 | Hủy giữ chỗ (B5) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | M | M | ✖ | ✔ hết hạn | Lý do BR-308 |
| A06 | Hủy đơn đã đảm bảo (B10) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | M ²¹ | ✖ | ✖ | ✔ (OTA R3) | Phần hoàn → A43 |
| A07 | Đổi căn / đổi ngày (B7) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | Lý do bắt buộc |
| A07a | Gán căn cho đơn xung đột / chưa gán căn (B7a) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | Dời khách ra ngoài: MGR+ (`resolveOverbookingExternal`) |
| A07b | Áp thay đổi OTA cho đơn (B7c) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✔ (R3) | Đơn `in_house` rút ngắn: FD xác nhận |
| A08 | Dời ngày thay vì hủy (B8) | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | BR-309 |
| A09 | Đánh dấu no-show (B11) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | Không tự động (BR-311) |
| A10 | Khôi phục no-show (B12) | ✔ | ✔ | ✔ / D ³⁵ | ✔ / D ³⁵ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | DOM SQ-1 |
| A11 | Nhận phòng (B9) | ✔ Q | ✔ Q | ✔ Q | ✔ Q | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | Cần C3 (đối chiếu giấy tờ) |
| A11a | Nhận trước 06:00 – thêm đêm trước (B9a) | ✔ Q | ✔ Q | ✔ Q | ✔ Q | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | Đơn OTA → đơn con Trực tiếp |
| A11b | Nhập bù thao tác sau mất mạng (giờ thực tế trong quá khứ + lý do "nhập bù sau mất mạng") | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | P12; giờ thực tế không sớm hơn mốc tham số `offline_backfill_max_hours`; MGR nhận danh sách |
| A12 | Nhận phòng khi buồng chưa VC/VI | ✔ | ✔ | ✔ | D | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | FDL+ (BR-402) |
| A13 | Hoàn tác nhận phòng (B17) | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | – |
| A14 | Gia hạn (B13) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | D (R3) | ✖ | GST gửi yêu cầu, FD xác nhận |
| A15 | Đổi phòng (B14) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | Lý do bắt buộc |
| A16 | Đặt trả muộn (B15) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | D | ✖ | Có khách đến cùng ngày → MGR+ (BR-416) |
| A17 | Trả sớm (B16) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | Hoàn → A43 |
| A18 | Hoàn tất trả phòng (B18) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | Đ ²² | ✖ | – |
| A19 | Ghi công nợ khi trả phòng (BR-525) | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | – |
| A20 | Thêm người đi cùng / trẻ em vào đơn | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | Đ | ✖ | – |
| A21 | Nhập/sửa/xem mã cửa, số thẻ phòng (BR-403) | ✔ L Q | ✔ L Q | ✔ L Q | ✔ L Q | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | Mã cửa = C3 (D22) |
| A22 | Gửi link app khách / link check-in **qua kênh hệ thống** (email/ZNS), không thấy link | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✔ | SEC-BA-07. Quyết định bước 4 (ARC bỏ `sales_staff` khỏi `issueGuestLink`): SAL **không** cấp, gửi hay sao chép link; khách của SAL nhận link do hệ thống tự gửi (SYS) hoặc do FD+ gửi. Endpoint A22 (`issueGuestLink`, `issueGuestVerificationCode`) chỉ FD+ (BUG-R1-006) |
| A22a | Cấp link và **sao chép link** (token hiện một lần khi cấp; xem lại = cấp lại, thu hồi link cũ) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | Ghi audit; SR-GST-01, SR-GST-04 |
| A23 | Tạo/sửa nhóm đơn, phân bổ cọc chung (SM-16) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | M | M ³⁶ | ✖ | ✖ | CTV chỉ tạo nhóm giữ chỗ, không phân bổ tiền |

### 4.2 Folio, tiền, duyệt
| # | Hành động | OWN | MGR | FDL | FD | HK | MT | SAL | CTV | GST | SYS | Duyệt / ghi chú |
|---|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|---|
| A30 | Thêm dòng phát sinh từ danh mục (phụ thu, giặt, phạt BR-511) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✔ | Nhật ký BR-008 |
| A31 | Sửa giá một dòng / giá đêm ngoài lịch giá | ✔ | ✔ | ✔ | ✔ ²³ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | Trong sàn–trần BR-105 |
| A32 | Điều chỉnh folio đã `settled` (bút toán) | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | Lý do bắt buộc |
| A33 | Ghi nhận thu tiền (giao dịch `succeeded`) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | M | ✖ | ✖ | ✔ | Chuyển khoản ghi tay → `reconciliation = pending` (SM-12) |
| A34 | Đảo giao dịch ghi sai | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | – |
| A35 | Gửi FOC / giảm giá đặc biệt | ✔ | ✔ | D | D ²⁴ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | SM-10 |
| A36 | Duyệt FOC / giảm giá đặc biệt | ✔ | ✔ ²⁵ | ✔ ²⁵ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | Không duyệt cho chính mình (trừ MGR/OWN) – BR-432 |
| A37 | Kiểm minibar (nhập số còn lại) | ✔ | ✔ | ✔ | ✔ | ✔ ²⁶ | ✖ | ✖ | ✖ | ✖ | ✖ | – |
| A38 | Xuất hóa đơn GTGT (thông tin công ty) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | Đ ²⁷ | ✔ (MISA R3) | – |
| A39 | Tạo VietQR / link thanh toán | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | M | ✖ | Đ (R3) | ✔ | – |
| A43 | Gửi yêu cầu hoàn tiền (cọc, ký quỹ, trả sớm) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | Duyệt MGR+ (BR-522) |
| A44 | Xem tổng thu trong ngày theo cách thanh toán | ✔ | ✔ | ✔ | M ²⁸ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | – |
| A45 | Mở / đóng ca của mình, nhập tiền mặt đếm thực tế (SM-17) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | Chênh lệch → lý do, báo MGR |
| A46 | Đối soát chuyển khoản với sao kê (`reconciled`/`disputed`) | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✔ (bank feed R3) | Không đối soát giao dịch do chính mình ghi, trừ OWN |
| A46a | Xác nhận **đã nhận tiền mặt** sale/CTV nộp quầy (giao dịch `cash` do SAL/CTV ghi, chờ đối soát – BR-527) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ³⁸ **Không** xác nhận khoản do chính mình ghi; chuyển khoản/VietQR vẫn là A46 (MGR+). PO 16/10 (ESC-017 A) |
| A47 | Thực hiện chuyển khoản hoàn và ghi giao dịch hoàn | ✔ L | ✔ L ³⁹ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | Chỉ trên yêu cầu hoàn `approved`; xem D15 đầy đủ; người chi ≠ người tạo yêu cầu ≠ người duyệt ≠ người đặt/đổi nơi nhận, **trừ OWN** (OWN được vừa duyệt vừa chi cùng một khoản, kể cả khi tự đặt nơi nhận; mỗi bước vẫn xác nhận lại mật khẩu + `If-Match`; nhật ký ghi "OWN tự duyệt và chi"); **MGR không bao giờ vừa duyệt vừa chi** cùng một khoản – PO 17/10 (SEC-37) |
| A47a | Chi hoàn **tiền mặt tại quầy** theo yêu cầu hoàn đã duyệt và ghi giao dịch hoàn | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ³⁸ Chỉ yêu cầu `refund` `approved`, nơi nhận `cash`; ≤ số đã duyệt còn lại; **không** chi khoản hoàn do chính mình tạo yêu cầu; không cần D15/thiết bị được cấp. Chuyển khoản vẫn là A47 (MGR+). PO 16/10 (Q-S3-1) |

### 4.3 Sale, hợp đồng, hoa hồng
| # | Hành động | OWN | MGR | FDL | FD | HK | MT | SAL | CTV | Duyệt / ghi chú |
|---|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|---|
| A50 | Lập/lưu báo giá ngắn ngày và dài hạn | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | ✔ | ✔ | Snapshot BR-006 |
| A51 | Gia hạn báo giá hết hiệu lực (Q4) | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | D | D | BR-304; người gửi theo dõi ở S23 (M). Operation `extendQuote` (ARC A-18, OpenAPI 0.3.5): MGR/OWN → 200; SAL/CTV chỉ báo giá của mình → 202 + yêu cầu `quote_extension` |
| A52 | Tạo / chuyển giai đoạn lead | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | M | M | – |
| A53 | Báo "khách đã chuyển cọc" (kèm ảnh biên nhận) | – | – | – | – | ✖ | ✖ | M | M | FD/SAL xác nhận A04 |
| A54 | Gia hạn HĐ (H4) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | D | ✖ | MGR+ duyệt khi SAL đề xuất |
| A55 | Sửa tay con số trên HĐ (H5) | ✔ | ✔ | D | D | ✖ | ✖ | ✖ | ✖ | MGR+ (BR-006) |
| A56 | Ghi chấm dứt sớm (H6) / hủy HĐ trước vào ở (H3) | ✔ | ✔ | ✔ H6 | ✔ H6 | ✖ | ✖ | ✖ | ✖ | H3: MGR+ |
| A57 | Duyệt quyết toán ký quỹ (H9) | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | BR-214 |
| A58 | Ghi nhận thu kỳ (T2) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | – |
| A59 | Miễn kỳ thu (T3) | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | – |
| A60 | Xem hoa hồng | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | M | M | US-087, US-089 |
| A61 | Đánh dấu đã chi hoa hồng | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | – |
| A62 | Xuất PDF hợp đồng (R3) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | M ²⁹ | ✖ | – |

### 4.4 Giấy tờ & khai báo
| # | Hành động | OWN | MGR | FDL | FD | Khác | Ghi chú |
|---|---|:-:|:-:|:-:|:-:|:-:|---|
| A70 | Nhập/tải giấy tờ, đối chiếu (K3–K5) | ✔ L Q | ✔ L Q | ✔ L Q | ✔ L Q | GST Đ1 (tải lên, chỉ ghi) | Không nhận ảnh qua chat (R-REG-08) |
| A71 | Xem ảnh giấy tờ, xem số giấy tờ đầy đủ (`…/sensitive`) | ✔ L Q ³⁰ | ✔ L Q ³⁰ | ✔ L Q ³⁰ | ✔ L Q ³⁰ | ✖ | Chỉ trong hạn lưu BR-610 |
| A72 | Ghi đồng ý lưu ảnh (BR-609) | ✔ | ✔ | ✔ | ✔ | GST Đ | Không bắt buộc để khai báo (R-REG-05) |
| A73 | Sao chép dữ liệu khai báo, ghi mã hồ sơ (K6–K10) | ✔ L Q | ✔ L Q | ✔ L Q | ✔ L Q ³¹ | ✖ | R-REG-07 |
| A74 | Xóa sớm ảnh theo yêu cầu khách | ✔ L Q | ✔ L Q | ✖ | ✖ | ✖ | R-DSR |
| A75 | Xuất dữ liệu giấy tờ **của nhiều người** | ✖ | ✖ | ✖ | ✖ | ✖ | **Cấm với mọi vai** (C3 – SEC mục 3); không áp cho A77 |
| A76 | Xem nhật ký truy cập C3 | ✔ | ✔ | ✖ | ✖ | ✖ | – |
| A77 | Tạo bản sao dữ liệu của **một** chủ thể (S31) | ✔ L Q | ✔ L Q | ✖ | ✖ | ✖ | Ghi `c3_access_log`; giao qua app khách GST2, không đính kèm email (SEC-BA-11) |

### 4.5 Buồng phòng, bảo trì, kho
| # | Hành động | OWN | MGR | FDL | FD | HK | MT | Ghi chú |
|---|---|:-:|:-:|:-:|:-:|:-:|:-:|---|
| A80 | Bắt đầu dọn / dọn xong (R1–R3) | ✔ | ✔ | ✔ | ✔ | ✔ | ✖ | – |
| A81 | Kiểm phòng đạt VC → VI (R4) | ✔ | ✔ | ✔ | ✖ | ◐ ³² | ✖ | BR-802, BR-808 |
| A82 | Báo cần dọn OC → OD (R8) | ✔ | ✔ | ✔ | ✔ | ✔ | ✖ | – |
| A83 | Tạo/giao/hủy việc buồng phòng | ✔ | ✔ | ✔ | ✔ | ◐ ³³ | ✖ | – |
| A84 | Tạo phiếu sửa chữa (W1) | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | – |
| A85 | Nhận / cập nhật / hoàn thành phiếu (W2–W4) | ✔ | ✔ | ✔ | ✔ | ✖ | ✔ | – |
| A86 | Tạo/kéo dài khối OOO (O1, O3) | ✔ | ✔ | ✔ | ✔ | ✖ | ✔ | Trùng đơn tương lai → MGR+ xác nhận |
| A87 | Mở khóa OOO không qua phiếu (O4) | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | – |
| A88 | Chốt công tơ (BR-502) | ✔ | ✔ | ✔ | ✔ | ✖ | ✔ | Ảnh bắt buộc |
| A89 | Lưu chỉ số nhỏ hơn kỳ trước (BR-503) | ✔ | ✔ | D | D | ✖ | D | MGR+ |
| A90 | Nhập kho, xuất kho, kiểm kê | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | Chênh lệch vượt BR-705 → MGR+ |
| A91 | Sửa danh mục mặt hàng, giá bán, giá vốn | ✔ | ✔ | ✖ | ✖ | ✖ | ✖ | – |
| A92 | Ghi đồ thất lạc (BR-513) | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | Đồ giá trị → bàn giao MGR |

### 4.6 Cấu hình, người dùng, báo cáo
| # | Hành động | OWN | MGR | FDL | FD | Khác | Ghi chú |
|---|---|:-:|:-:|:-:|:-:|:-:|---|
| A100 | Tạo/khóa tài khoản, gán vai, đặt lại mật khẩu | ✔ | ✖ | ✖ | ✖ | ✖ | US-002, US-008; **có hiệu lực ngay, thu hồi mọi phiên** của người đó (SR-SES-06); mật khẩu tạm buộc đổi ở lần đăng nhập đầu |
| A101 | Sửa tham số vận hành (giờ, hạn, phụ thu, giá…) | ✔ | ✔ | ✖ | ✖ | ✖ | US-005; **không** gồm thông tin nhận tiền (A108) |
| A102 | Sửa hạn mức FOC, tỷ lệ hoa hồng, phí kênh | ✔ | ✖ | ✖ | ✖ | ✖ | Tách người đặt hạn mức với người duyệt `[GIẢ ĐỊNH]` |
| A103 | Sửa lịch giá, đẩy giá lên kênh | ✔ | ✔ | ✖ | ✖ | ✖ | BR-105 |
| A104 | Bật/tắt mở bán kênh | ✔ | ✔ | ✖ | ✖ | ✖ | – |
| A105 | Xuất báo cáo ra bảng tính (C2) | ✔ L | ✔ L | ✖ | ✖ | ✖ | Mặc định **không** có SĐT/email/số giấy tờ; muốn có phải chọn rõ từng cột, ghi audit (SEC-BA-10) |
| A106 | Sửa mẫu tin nhắn | ✔ | ✔ | ✖ | ✖ | ✖ | US-127; ràng buộc ở 8.9 |
| A107 | Gộp hồ sơ khách | ✔ | ✔ | ✔ | ✔ | ✖ | BR-953 (R3 – US-074) |
| A108 | Đổi tài khoản nhận tiền / thông tin thanh toán của cơ sở (VietQR, thông tin chuyển khoản trên bill) | ✔ | ✖ | ✖ | ✖ | ✖ | Xác nhận lại mật khẩu (+2FA khi có); ghi audit; thông báo OWN; hiệu lực sau bước xác nhận thứ hai (SEC-BA-03) |

### 4.7 Bảo mật tài khoản, thiết bị, link khách (FB-R1-ARC-BA-08, SEC-BA-01/02/06)
| # | Hành động | OWN | MGR | FDL | FD | HK/MT | SAL | CTV | Ghi chú |
|---|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|---|
| A110 | Cấp / thu hồi thiết bị được cấp (danh sách ở S26) | ✔ | ✖ ²⁰ᵃ | ✖ | ✖ | ✖ | ✖ | ✖ | SR-DEV-01…09; chọn loại `desk`/`facility_mobile` (≤ 30 ngày, ký checklist); OWN rà danh sách hằng tháng; PWA và máy cá nhân không bao giờ được cấp |
| A111 | Bật / đặt lại 2FA TOTP của **người khác** | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | 2FA bắt buộc OWN/MGR trước dữ liệu thật (R3) – SR-AUTH-06 |
| A112 | Đặt/đổi PIN duyệt, mật khẩu, 2FA **của mình** | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | SR-AUTH-09 |
| A113 | Cấp mã xác minh cho khách (để lên GST2) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | ✖ | Ghi audit; mặc định đọc tại quầy/điện thoại (SR-GST-07b) |
| A114 | Thu hồi link khách | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | ✖ | SR-GST-04 |
| A115 | Xem / thu hồi phiên đăng nhập của người khác | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | SR-SES-07; mỗi người xem/thu hồi phiên của mình (A112) |
| A116 | Khôi phục tài khoản OWN | – | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | Bằng **mã khôi phục in sẵn do INV giữ**, không qua MGR; quy trình ở runbook OPS |
| A117 | Đổi người nhanh trên máy quầy (đăng xuất + đăng nhập người khác) | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | ✖ | 8.8 |
| A118 | Bật/tắt gửi mã xác minh qua kênh nhắn tin OTA / Zalo (theo từng kênh) | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | **Mặc định tắt** (phân xử ORC 15/10/2026); rủi ro còn lại ghi trong threat-model; là trường hợp riêng của A119 (khóa `guest_verify_code_channels`) |
| A119 | Sửa **tham số bảo mật** (8 khóa trong `x-security-parameters` của `setParameter`, erd 9.3): `guest_verify_max_attempts`, `guest_level2_idle_minutes`, `guest_link_grace_hours`, `guest_verify_code_channel_minutes`, `guest_verify_code_channels`, `trusted_device_days`, `trusted_device_mobile_days`, `c3_stepup_minutes` | ✔ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | `setParameter` (BUG-R1-SEC-02). MGR (và mọi vai khác) → `403 FORBIDDEN_ACTION` + audit `access.denied`. Giá trị ngoài **biên cứng** SEC đặt (hoặc phần tử ngoài tập kênh cho phép) → `422 PARAM_OUT_OF_RANGE` kèm `min`/`max` hoặc `allowed[]` – **áp cả với OWN**; sai kiểu → `422 VALIDATION_FAILED`. Mỗi lần sửa ghi audit `category='security'` (trước/sau, lý do, người sửa). Server xác định khóa bảo mật theo khóa trong đường dẫn. Biên và mặc định: xem OpenAPI `x-security-parameters` (nguồn chuẩn), không chép lại ở đây |

Ghi chú hành động:
20. CTV **không xác nhận cọc** vì không kiểm được tiền vào tài khoản OTTIMO; CTV dùng A53, FD/SAL xác nhận A04 `[GIẢ ĐỊNH – chờ INV xác nhận]`.
21. SAL hủy đơn trực tiếp do mình chốt; phần hoàn đi qua A43.
22. GST "trả phòng nhanh" (BR-427) chỉ khi còn phải thu = 0.
23. FD sửa giá trong khoảng sàn–trần BR-105; giảm dưới giá chính sách = "giảm giá đặc biệt" → A35.
24. FD/FDL tự áp FOC **minibar** khi ≤ hạn mức lần của vai FD (BR-433, BR-704) **và** còn trong hạn mức tháng tự áp (`foc_self_monthly_limit` `[GIẢ ĐỊNH – chờ INV qua ESC-007]`); PIN của chính mình, lý do bắt buộc; vượt tháng → `pending` lên FDL+ khác người gửi. FOC loại khác luôn D (DOM SQ-3; SM-10 A2).
25. Trong hạn mức lần và tháng của vai (BR-433); vượt → chuyển cấp trên; xác thực bằng PIN/mật khẩu của chính người duyệt.
26. HK nhập số lượng; không thấy thành tiền và giá vốn.
27. GST nhập thông tin xuất hóa đơn công ty qua app (R3).
28. FD thấy tổng thu ca của mình (bàn giao tiền mặt – US-124).
29. SAL xuất PDF HĐ do mình chốt; bản PDF cho SAL **không in số giấy tờ** (SEC D17).
30. Lý do khi xem C3 (SEC-BA-05, SR-C3-07/09): (1) trong luồng nhận phòng/khai báo **đang mở của chính đơn đó** – không cần lý do; (2) mọi lần xem khác (sau `confirmed`, đơn đã trả phòng, đơn không thuộc ca) – chọn lý do: đối chiếu lại · khách yêu cầu · cơ quan chức năng · khác + ghi chú; (3) xác nhận lại PIN/mật khẩu nếu lần xác thực gần nhất > 15 phút; (4) xem C3 của đơn đã trả phòng > 7 ngày → cảnh báo OWN (SR-LOG-06).
31. Bản text sao chép chỉ dùng trên thiết bị được cấp, có nút xóa clipboard (R-REG-07).
35. FD/FDL tự khôi phục khi đủ 3 điều kiện (còn ngày nghiệp vụ của đêm đến; căn còn trống, không phải đổi căn; không hoàn tiền/đổi giá) – lý do bắt buộc, MGR được báo, hiện trong báo cáo đóng ca. Ngoài 3 điều kiện hoặc đơn OTA đã báo no-show lên kênh → D, MGR+ duyệt (DOM SQ-1).
36. CTV tạo nhóm từ báo giá nhiều căn cho khách của mình (giữ chỗ); không phân bổ cọc (không xác nhận tiền – ghi chú 20).
32. HK tự kiểm chỉ khi đủ checklist + ảnh và cơ sở bật chế độ "1 người" (BR-802).
33. HK chỉ hủy việc "dọn phòng khách đang ở" khi khách từ chối dọn (ghi lý do).

## 5. Phê duyệt và hạn mức

### 5.1 Loại yêu cầu và người duyệt
| Loại yêu cầu (SM-10) | Người gửi | Người duyệt | Căn cứ |
|---|---|---|---|
| FOC phát sinh (phụ thu, minibar, dọn lẻ, phạt, bồi thường, đêm bù sự cố) | FD, FDL | FDL / MGR / OWN theo hạn mức; FOC minibar trong hạn mức lần + tháng của vai FD: **tự áp** (ghi chú 24) | BR-431–433, BR-704 |
| Giảm giá đặc biệt tiền phòng | FD, FDL, SAL | MGR / OWN theo hạn mức | BR-431 |
| Hoàn tiền (cọc, ký quỹ, trả sớm, hủy) | FD+ (nhập, thấy số TK dạng che) | MGR, OWN – người duyệt cũng là người thực hiện chuyển (A47); đổi số TK sau khi duyệt → duyệt lại | BR-522 |
| Sửa tay con số trên HĐ | FD+, SAL | MGR, OWN | BR-006 |
| Nhận phòng khi buồng chưa sẵn sàng | FD | FDL, MGR, OWN | BR-402 |
| Trả muộn khi có khách đến cùng ngày | FD+ | MGR, OWN | BR-416 |
| Chỉ số công tơ nhỏ hơn kỳ trước | FD+, MT | MGR, OWN | BR-503 |
| Chênh lệch kiểm kê vượt ngưỡng | FD+ | MGR, OWN | BR-705 |
| Định giá hư hỏng ngoài bảng | FD+ | MGR, OWN | BR-512 |
| Gia hạn báo giá | SAL, CTV, FD+ | MGR, OWN | BR-304 |
| Khôi phục no-show **ngoài 3 điều kiện** (căn đã bán lại, phải đổi căn, có hoàn/đổi giá, qua ngày nghiệp vụ, OTA đã báo kênh) | FD, FDL | MGR, OWN | SM-01 B12 (trong 3 điều kiện: FD+ tự làm) |
| Công nợ khi trả phòng | – (MGR+ tự ghi) | MGR, OWN | BR-525 |

### 5.2 Quy tắc duyệt
1. Người duyệt xác nhận **bằng tài khoản và PIN/mật khẩu của chính mình**; người gửi không chọn tên người duyệt (BR-432, US-007 – khắc phục BL 8.2 #24).
2. *Không ai duyệt yêu cầu của chính mình, **trừ** khi giá trị nằm trong hạn mức tự áp của vai mình* (FD/FDL: FOC minibar; MGR/OWN: theo BR-433) – câu chung do DOM chốt (SQ-3) để BR-432 và BR-433/704 không đọc mâu thuẫn.
3. Hạn mức lần và hạn mức tháng theo BR-433; vượt → tự chuyển cấp trên (SM-10 A4).
4. Cảnh báo thất thoát BR-435 chỉ gửi OWN.
5. Mọi yêu cầu, kể cả bị từ chối, vào báo cáo FOC/nhật ký (BR-434).

### 5.3 Tách nhiệm vụ (kiểm soát nội bộ) `[GIẢ ĐỊNH – chờ INV xác nhận]`
- Người đặt hạn mức FOC, tỷ lệ hoa hồng, phí kênh (OWN) khác người duyệt FOC hằng ngày (FDL/MGR).
- CTV không xác nhận tiền (A04) và không xem dữ liệu khách ngoài khách của mình.
- MGR không tự gán vai cho mình hay người khác (A100 chỉ OWN); không đổi tài khoản nhận tiền (A108 chỉ OWN); không sửa tham số bảo mật (A119 chỉ OWN).
- Người ghi nhận chuyển khoản (FD, SAL) khác người đối soát với sao kê (MGR+, A46). **Tiền mặt sale/CTV nộp quầy**: FD+ xác nhận đã nhận (A46a), người xác nhận ≠ người ghi; hoa hồng của người ghi "đạt" sau khi xác nhận (BR-527, PO 16/10). Xác nhận cọc của SAL (A04) tạo giao dịch `reconciliation = pending`, MGR+ đối soát trong ngày (SEC-BA-12).
- **Chi hoàn tiền mặt tại quầy** (A47a): FD+ được chi khi yêu cầu đã `approved` bởi MGR/OWN, người chi ≠ người tạo yêu cầu; có ảnh/chữ ký biên nhận của khách; vào đóng ca (BR-526) và nhật ký tiền (BR-008). Người thực hiện chuyển khoản hoàn (MGR+, A47) phải đi qua yêu cầu `approved`; Duyệt hoàn theo **vai** (MGR/OWN, mọi số tiền – không qua `foc_limits`; ARC 17/10). Hoàn **chuyển khoản**: người chi ≠ người tạo yêu cầu ≠ người duyệt ≠ người đặt/đổi nơi nhận, **trừ OWN** (OWN được vừa duyệt vừa chi cùng một khoản, kể cả khi tự đặt nơi nhận; mỗi bước vẫn xác nhận lại mật khẩu + `If-Match`; nhật ký ghi "OWN tự duyệt và chi"); **MGR không bao giờ vừa duyệt vừa chi** cùng một khoản – PO 17/10 (SEC-37). Khi OWN vắng: OWN duyệt từ xa, MGR (khác người đặt nơi nhận) chi tại máy được cấp; không liên lạc được OWN thì khoản chờ.

## 6. Ma trận theo trường dữ liệu nhạy cảm

Ký hiệu thêm: **Đầy** = xem đầy đủ · **Che** = che giữa (ví dụ `0905***456`) · **4S** = chỉ 4 ký tự cuối · **Tên+căn** = chỉ tên gọi + số căn · **K** = không thấy (trường không trả về từ API, không chỉ ẩn trên giao diện).

Cột khách tách theo mức (FB-R1-ARC-BA-02, SEC-BA-02; SR-GST-06/07/11): **GST1** chỉ có link · **GST2** link + OTP email/mã lễ tân cấp · **GSTp** sau trả phòng ≤ 24 giờ (bắt buộc GST2). Wi-Fi, nội quy (C1) có ở GST1, ✖ ở GSTp. Ô có **Q** = chỉ trả về khi phiên chạy trên thiết bị được cấp (8.7).

| Mã SEC | Trường | Mức | OWN/MGR | FDL/FD | HK | MT | SAL | CTV | GST1 | GST2 | GSTp |
|---|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| D01 | Họ tên, ngày sinh, giới tính, quốc tịch | C2 | Đầy | Đầy | Tên+căn (T) | K | Tên + quốc tịch (M) | Tên + quốc tịch (M) | Tên gọi người đứng tên | Đ | Tên trên bill |
| D02 | SĐT, Zalo/WhatsApp, email | C2 | Đầy | Đầy | K | K | Đầy (M) | Đầy (M) | K | Đ | K |
| D03 | Số CCCD / định danh | C3 | Đầy L Q (màn khai báo); 4S (CRM) | Đầy L Q (màn khai báo); 4S (CRM) | K | K | **K** | **K** | K | 4S | K |
| D04 | Hộ chiếu (số, ngày cấp/hết hạn, MRZ) | C3 | như D03 | như D03 | K | K | **K** | **K** | K | 4S + hạn | K |
| D05 | Thị thực, nhập cảnh | C3 | Đầy L Q | Đầy L Q | K | K | K | K | K | Hạn thị thực | K |
| D06 | Ảnh giấy tờ | C3 | Đầy L Q | Đầy L Q | K | K | K | K | Chỉ tải lên (không xem lại) | K | K |
| D07 | Địa chỉ thường trú, quê quán | C3 | Đầy L Q | Đầy L Q | K | K | K | K | Chỉ ghi | K | K |
| D09 | Dữ liệu trẻ em (tên, năm sinh, số định danh) | C3 | Đầy L Q | Đầy L Q | K | K | K | K | Chỉ ghi | Tên + năm sinh | K |
| D10 | Người đi cùng: tên, **quan hệ**, liên hệ; hồ sơ khách nguồn **"từ giấy tờ"** ⁴⁰ | C2 | Đầy | Đầy | Số người | K | Số người, **không** quan hệ; **không** thấy hồ sơ "từ giấy tờ" ⁴⁰ | Số người; **không** thấy hồ sơ "từ giấy tờ" ⁴⁰ | Số người | Đ | K |
| D11 | Lịch sử lưu trú (ngày, căn, kênh, giờ thực tế) | C2 | Đầy | Đầy | Hôm nay (T) | K | M | M | Ngày ở + căn của đơn này | Đ (đơn này) | Ngày ở trên bill |
| D12a | Tag / lưu ý phục vụ từ **danh mục không liên quan sức khỏe** | C2 | Đầy | Đầy | Lưu ý phục vụ (T) | K | Tag (M) | K | K | K | K |
| D12b | **Lưu ý sức khỏe** từ danh mục cố định (ví dụ "dị ứng thực phẩm – hỏi lễ tân"); chỉ ghi khi khách đồng ý | C3 | Đầy L | Đầy L | Nhãn chung "Có lưu ý – hỏi lễ tân" (T) | K | K | K | K | K (xem qua S31) | K |
| D12c | Ghi chú tự do (giao diện cảnh báo "không ghi thông tin sức khỏe, giấy tờ") | C2 | Đầy | Đầy | K | K | K | K | K | K | K |
| D13 | Dữ liệu thẻ (PAN, CVV) | C3 cấm lưu | K | K | K | K | K | K | K | K | K |
| D14 | Kết quả thanh toán (mã giao dịch, số tiền, 4 số cuối thẻ, tên người chuyển) | C2 | Đầy | Đầy | K | K | Cọc đơn M | K | K | Đ | Đ |
| D15 | Tài khoản ngân hàng nhận hoàn của khách | C3 | Đầy L (người thực hiện hoàn, A47 – **người chi ≠ người duyệt ≠ người đặt nơi nhận, trừ OWN** ³⁹; OWN duyệt từ xa chỉ thấy dạng che) | Che (FD nhập yêu cầu) | K | K | K | K | K | Đ (nhập/xem của mình, che) | Đ (nhập/xem của mình, che) |
| D16 | Thông tin xuất hóa đơn (công ty, MST) | C2 | Đầy | Đầy | K | K | K | K | K | Đ | Đ |
| D17 | Hợp đồng dài hạn (số tiền, kỳ thu) / số giấy tờ in trên HĐ | C2 / C3 | Đầy / Đầy L Q | Đầy / 4S | K | K | M / **K** | M (tiền thuê, kỳ hạn) / **K** | K | Đ / 4S | K (chỉ bill quyết toán) |
| D18 | Chỉ số điện nước gắn khách dài hạn | C2 | Đầy | Đầy | K | Chỉ số + căn, **không tên** | K | K | K | Đ | Kỳ cuối trên bill |
| D19 | Mã đặt phòng OTA, dữ liệu channel manager | C2 | Đầy | Đầy | K | K | K | K | K | Mã của mình | K |
| D20 | Hồ sơ đồng ý | C2 | Đầy | Trạng thái có/không | K | K | K | K | Ghi đồng ý (chỉ ghi) | Đ (của mình, rút lại được) | K (qua S31) |
| D21 | Vân tay | C3 | K (không lưu trên hệ thống) | K | K | K | K | K | K | K | K |
| D22 | Mã cửa còn hiệu lực, thẻ từ | C3 | Đầy L Q | Đầy L Q | K | K | K | K | **K** | Đ (chỉ trong khoảng hiệu lực BR-403) | **K** |
| D23 | Yêu cầu từ app khách, tin nhắn | C2 | Đầy | Đầy | Loại + căn + nội dung (T, định tuyến) | như HK | K | K | Gửi + xem trạng thái | Đ | K |
| D25 | Token link app khách | C3 | **Một lần khi cấp** (để sao chép/gửi – A22a), không xem lại; xem lại = cấp lại (thu hồi link cũ) | như OWN/MGR | K | K | K (không gửi, không cấp – A22) | K (kể cả khi render mẫu tin) | – | – | – |
| D26 | CTV/Sale: số tài khoản, CCCD/MST | C3 | Đầy L | K | K | K | Của mình | Của mình | – | – | – |
| D27 | Tài khoản nhân viên, nhật ký thao tác | C2 | Đầy | Nhật ký của mình; **tên hiển thị người chốt** (CTV/sale) khi tạo đơn ở S05 ³⁷ | K | K | K | K | – | – | – |
| D28 | Lead (tên, liên hệ, nhu cầu) | C2 | Đầy | Đầy | K | K | M | M | – | – | – |
| D29 | Cảnh báo / danh sách đen về khách (`Guest.warnings`, có thể kèm mã khách khác) | C2 | Đầy | Đầy | K | K | K | K | K | K (xem qua S31) | K |
| – | Tài khoản nhận tiền của cơ sở (VietQR, thông tin chuyển khoản) | C1 – toàn vẹn quan trọng | Đầy; **sửa chỉ OWN** (A108) | Đầy (để hiện QR) | K | K | Đầy (QR của đơn M) | K | K | Đ (trên QR/bill) | Đ |

Câu hỏi "lưu ý sức khỏe có cần đồng ý riêng không" (D12b) đề xuất gộp vào ESC-001 (luật sư) – xem `BA-responses.md`.

**Dữ liệu kinh doanh nhạy cảm (BL 8.2 #27)**:
| Trường | Mức | OWN/MGR | FDL | FD | HK | MT | SAL | CTV | GST |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Giá bán phòng, folio của đơn | C2 | Đầy | Đầy | Đầy | **K** | K | M | M (tổng tiền phòng, cọc) | Đ |
| Giá bán minibar (bảng giá trong phòng) | C0 | Đầy | Đầy | Đầy | Đầy | K | K | K | Đầy |
| **Giá vốn kho**, giá trị tồn theo giá vốn, lãi gộp F&B | C2 | Đầy | K | K | **K** (chỉ số lượng) | K | K | K | K |
| **P&L**, chi phí vận hành, GOP | C2 | Đầy | K | K | K | K | **K** | **K** | K |
| Phí kênh thực tế từng đơn, thực thu, báo cáo kênh | C2 | Đầy | K | K | K | K | K | K | K |
| Tỷ lệ phí kênh cấu hình (dùng trong thông báo gia hạn BR-422) | C1 | Đầy | R | R | K | K | K | K | K |
| Doanh thu tháng, ADR, RevPAR | C2 | Đầy | K ¹³ | K | K | K | K | K | K |
| **Hoa hồng** – của mình | C2 | Đầy | – | – | – | – | Đầy (M) | Đầy (M) | K |
| **Hoa hồng** – của người khác, tổng hoa hồng | C2 | Đầy | K | K | K | K | **K** | **K** | K |
| Phần "OTTIMO còn lại" trên báo giá | C2 | Đầy | Đầy | Đầy | K | K | Đầy (báo giá M) | K ³⁴ | K |
| Báo cáo FOC | C2 | Đầy | M | K | K | K | K | K | K |

34. CTV thấy "Sale nhận" (hoa hồng của mình) trên báo giá, không thấy "OTTIMO còn lại" (biên lợi nhuận) – BA đề xuất, chờ PO/DOM.

## 7. Giải quyết mâu thuẫn BL mục 2 và BL 8.2 #27

| # | Mâu thuẫn trong prototype | Quyết định trong ma trận | Căn cứ |
|---|---|---|---|
| M1 | Lưu trữ giấy tờ ghi "buồng phòng, sale, CTV không thấy giấy tờ", nhưng vai Sale vào CRM thấy loại + số giấy tờ đã che | SAL/CTV: trường giấy tờ (D03–D07) **không trả về** ở mọi màn hình, kể cả dạng che và loại giấy tờ; "Khóa định danh" trong CRM của SAL/CTV chỉ còn SĐT, email, mã OTA (của khách mình) | BR-610, SEC D03/D04, US-003 AC1 |
| M2 | Vai Sale xem được báo cáo Lãi lỗ | P&L chỉ OWN/MGR; SAL/CTV chỉ có màn Hoa hồng (của mình) | US-003 AC3, PRD U4 |
| M3 | Vai Buồng phòng xem được giá vốn kho | HK xem số lượng, mức chuẩn, món thiếu; không có cột giá vốn, giá trị tồn, lãi gộp | US-003 AC2 |
| M4 | Mọi vai bấm được mọi hành động trong drawer/modal mở từ CRM | Quyền kiểm theo **hành động** (mục 4) ở server, độc lập màn hình đang mở; nút chỉ hiện khi vai + trạng thái hợp lệ (US-020); gọi trực tiếp → từ chối + ghi nhật ký | US-002 AC2 |
| M5 | "Xem với vai trò" chỉ ẩn menu, không có đăng nhập | Đăng nhập tài khoản riêng; menu, API, trường dữ liệu cùng theo ma trận này | US-001 |
| M6 | Sale thấy CRM toàn bộ khách | SAL/CTV chỉ thấy khách/lead **của mình** (M) | US-087, SEC D01/D02 |
| M7 | Buồng phòng thấy Kho F&B đầy đủ, Bảo trì đầy đủ | HK: minibar + bổ sung tủ, báo sự cố; MT: phiếu sửa, công tơ (không tên khách) | PRD U3, SEC D18 |
| M8 | Lễ tân không thấy Báo cáo nhưng thấy "Kênh OTA" đầy đủ (sửa giá, bật/tắt kênh) | FD/FDL chỉ xem tình trạng đồng bộ; sửa giá, bật/tắt kênh là MGR+ | BR-905, US-097, US-098 |

## 8. Quy tắc thực thi (cho ARC/BE/SEC)
1. Kiểm quyền ở **server** cho cả màn hình (API đọc), hành động (API ghi) và trường (lọc trường trong phản hồi). Ẩn trên giao diện chỉ là phụ.
2. Phạm vi "M" xác định bằng: `created_by`, `assigned_to` (lead/khách phụ trách), `closer_id` (người chốt đơn/HĐ). Phạm vi "T" bằng danh sách căn có việc/phiếu giao cho người dùng trong ngày nghiệp vụ hiện tại (giờ VN, BR-001).
3. Dữ liệu C3: đọc qua API riêng, mỗi lần đọc ghi nhật ký (ai, lúc nào, đơn/khách nào, lý do nếu có); cấm xuất hàng loạt; không đưa vào log, URL, thông báo đẩy, nội dung tin nhắn (SEC mục 3).
4. Xuất file C2 (A105) cần quyền riêng và ghi nhật ký.
5. Mỗi lần bị từ chối quyền ghi nhật ký (người, hành động, đối tượng) – OWN xem ở S27.
6. Link app khách (GST) chỉ truy cập đúng đơn; mức GST1/GST2 và ân hạn GSTp theo mục 1 quy tắc 5 (SR-GST-06/07/11, decision-log SEC 15/10/2026 M4); đơn dài hạn: GSTp tính từ khi HĐ `closed`. Serializer phía khách lọc trường theo cột GST1/GST2/GSTp của mục 6 – JSON mức 1 không chứa trường cấm (test SR-GST-06).
7. **Thiết bị được cấp (quyết định SEC, decision-log 15/10/2026; phân xử ORC về nhận phòng khuya)**: mọi đọc/ghi C3 của **mọi vai nhân viên** (A11, A11a, A21, A70, A71, A73, A74, A77, endpoint `…/sensitive`, `…/door-credential`, ảnh giấy tờ) chỉ chạy trên thiết bị được OWN cấp (A110) và chỉ qua admin-web; **PWA nhân viên không bao giờ được cấp**. Thiết bị của cơ sở được cấp như máy quầy: máy tính quầy (`device_kind = desk`, hạn `trusted_device_days`) và **thiết bị di động của cơ sở** (`facility_mobile` – máy tính bảng/điện thoại do OTTIMO mua, tài khoản Apple/Google của cơ sở, theo checklist SR-DEV-08, hạn cấp ≤ 30 ngày, ở lại cơ sở, mất máy → OWN thu hồi trong ngày). **Không bao giờ cấp** máy cá nhân của nhân viên (kể cả người trực đêm), PWA, máy dùng chung ngoài cơ sở (SR-DEV-09); ngoại lệ duy nhất: laptop của OWN/MGR. Luồng khách đến khuya: SR-GST-15 (P03 E2). Thiết bị chưa cấp: menu C3 ẩn, server trả `403 DEVICE_NOT_TRUSTED`, ghi nhật ký.
8. **Mỗi người một tài khoản** (SEC-BA-09): cấm dùng chung tài khoản trên máy quầy; đổi ca phải đăng xuất hoặc dùng "Đổi người nhanh" (A117); phiên admin-web tự khóa sau 30 phút không hoạt động, tối đa 12 giờ; PWA 72 giờ không hoạt động, tối đa 30 ngày (decision-log SEC). Ca làm việc (SM-17) gắn đúng người đăng nhập.
9. **Mẫu tin nhắn** (SEC-BA-08): mỗi loại mẫu có danh sách biến cho phép cố định trong code; biến C3 duy nhất là mã cửa, chỉ trong mẫu "mã cửa", chỉ hệ thống gửi vào ngày đến; không có biến cho số giấy tờ; URL trong mẫu chỉ thuộc tên miền OTTIMO; sửa mẫu ghi audit nội dung trước/sau. Biến "link app khách" chỉ render cho FD+ (A22a); SAL/CTV render mẫu không có link.
10. **Thu hồi phiên**: khóa tài khoản, đổi vai, đặt lại mật khẩu, thu hồi thiết bị → mọi phiên liên quan hết hiệu lực ngay (SR-SES-06).

## 9. Ngưỡng "trẻ em" – mâu thuẫn cần thống nhất
| Nguồn | Ngưỡng | Dùng để |
|---|---|---|
| BL 3.17 (modal Thêm người đi cùng) | dưới 14 tuổi | Loại "Trẻ em" trong đơn (không hồ sơ CRM, chỉ năm sinh) |
| SEC R-CON-05 (luật trẻ em VN) | dưới 16 tuổi | Chế độ bảo vệ dữ liệu trẻ em (C3, không CRM/marketing) |
| BR-110 | bậc tuổi riêng | Phụ thu người/trẻ em (giá) |

Quyết định BA (cách trình bày đặc tả, thuộc quyền BA): tách **hai thuộc tính độc lập** trên mỗi người trong đơn:
- `is_minor_data` = tuổi dưới **ngưỡng bảo vệ dữ liệu của SEC** (thay ngưỡng BL 3.17): người này xử lý như D09 (C3), không tạo hồ sơ CRM, không lưu liên hệ, không đồng ý marketing.
- Bậc tuổi tính phụ thu: theo BR-110, không liên quan quyền dữ liệu.
Đề nghị DOM thêm tham số ngưỡng vào BR-612; ngưỡng cuối cùng do luật sư xác nhận trong phạm vi ESC-001 (đề xuất bổ sung câu hỏi – xem report BA).

## 10. Truy vết
| Story | Mục trong tài liệu này |
|---|---|
| US-001, US-002 | 1, 3, 8 |
| US-003 | 6, 7 (M1–M3) |
| US-007 | 4.2 (A35, A36), 5 |
| US-020 | 4 (cùng `state-machines.md`) |
| US-048 | 4.4, 6 (D03–D06) |
| US-080 | 6 (phần "OTTIMO còn lại", hoa hồng) |
| US-087, US-089 | 3 (S14–S17), 4.3, 6 |

## 11. Lịch sử thay đổi
| Ngày | Round | Thay đổi | Người |
|---|---|---|---|
| 15/10/2026 | 1 (đợt 2) | Bản đầu: 9 vai + hệ thống, 31 màn hình, ~70 hành động, ma trận trường theo D01–D28 và dữ liệu kinh doanh; giải quyết BL 2 và 8.2 #27 | BA |
| 15/10/2026 | 1 (bước 4) | Màn mặc định FD/FDL = Hôm nay; ký hiệu Q (thiết bị được cấp) theo quyết định SEC + phân xử ORC; GST1/GST2/GSTp; D12 tách a/b/c; D15, D22, D25 sửa; thêm D29; A07a/b, A11a/b, A22a, A23, A45–A47, A77, A108, 4.7 (A110–A118); A10 theo SQ-1; ghi chú 24 theo SQ-3; S23 cho CTV (QA #12); S32–S34; 8.7–8.10; bản máy đọc `rbac-matrix.json` | BA |
| 16/10/2026 | 1 (bước 5) | BUG-R1-005: ghi chú 25a – S25 dạng tra cứu cho FDL/FD/SAL/CTV, HK/MT không dùng `listRooms`/`listRoomGroups` (dùng danh sách việc buồng phòng), sức chứa ẩn với HK/MT. BUG-R1-006: A22 SAL ✖ (theo quyết định bước 4); A110 MGR ✖ ở R2 (ghi chú 20a). `rbac-matrix.json` v0.2.1 cập nhật theo | BA |
| 16/10/2026 | 1 (bước 5, lượt 2) | Thêm **A119** "Sửa tham số bảo mật – chỉ OWN" (8 khóa `x-security-parameters` của `setParameter` 0.2.1-draft; MGR 403; ngoài biên 422 `PARAM_OUT_OF_RANGE` kể cả OWN) theo BUG-R1-SEC-02 / fix-notes-ARC; A118 ghi là trường hợp riêng của A119; mục 5.3 thêm A119. `rbac-matrix.json` thêm A119, A118 ánh xạ `setParameter` | BA |
| 16/10/2026 | 2 (Sprint 2) | S33: FDL/FD/SAL **M R** (giao dịch của mình – ghi chú 33a), trả lời ARC Q-B1, khớp `listPayments` OpenAPI 0.3.3; `rbac-matrix.json` không đổi (bản máy đọc chỉ có hành động A-xx; `listPayments` đã ánh xạ A33) | BA |
| 16/10/2026 | 2 (Sprint 2 – phản hồi) | A51 ghi operation `extendQuote` (ARC A-18); ghi chú 37 + D27 cho `listCloserCandidates` (ARC A-06); `rbac-matrix.json` 0.2.2: A51 `operationIds: [extendQuote]`, thêm `A01-closer` → `listCloserCandidates` | BA |
| 16/10/2026 | 2 (Sprint 3) | Thêm **A46a** (FD+ xác nhận tiền mặt SAL/CTV nộp quầy) và **A47a** (FD+ chi hoàn tiền mặt đã duyệt), ghi chú 38, mục 5.3 – theo PO 16/10; A46, A47 giữ MGR+. `rbac-matrix.json` 0.2.3 | BA |
| 17/10/2026 | 2 (Sprint 3) | A47, D15 thêm "người chi ≠ người duyệt ≠ người đặt nơi nhận, **trừ OWN**" (ghi chú 39; mục 5.3 bỏ "MGR tự duyệt hoàn trong hạn mức BR-433" – duyệt hoàn theo vai) – PO 17/10, SEC-37. `rbac-matrix.json` 0.2.4 | BA |
| 17/10/2026 | 2 (Sprint 3) | D10 + ghi chú 40: SAL/CTV không thấy hồ sơ khách nguồn "từ giấy tờ" (SEC 17/10, BUG-R2-033 b). Không đổi `rbac-matrix.json` (bản máy đọc chỉ có hành động; phạm vi do serializer/x-scope ARC 0.3.7) | BA |
