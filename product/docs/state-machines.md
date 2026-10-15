# Sơ đồ trạng thái – OTTIMO Desk

- Tác giả: BA | Round 1 – Bước 2 (Sản xuất, đợt 2) | Ngày: 15/10/2026 | Phiên bản: 0.1 (chờ review DOM, ARC; khuyến nghị QA, SEC)
- Nguồn: `business-rules.md` (mã **BR-xxx** – nguồn sự thật duy nhất cho mọi con số), `round-0-baseline.md` (**BL**), `baseline-issues-triage.md`, `security/data-risk-assessment.md` (**SEC**), `PRD.md`, `03-backlog/backlog.md` (**US-xxx**), `rbac-matrix.md` (mã vai).
- Tài liệu này **không chép con số nghiệp vụ**. Mọi mốc giờ, hạn, tỷ lệ, hạn mức đều là tham số trong `business-rules.md` mục 13, ghi bằng mã BR.
- Đọc cùng: `rbac-matrix.md` (vai được phép), `business-processes.md` (quy trình), `use-cases.md` (UC-xx).

## 0. Quy ước

### 0.1 Mã vai dùng trong cột "Ai được chuyển"
| Mã | Vai | Ghi chú |
|---|---|---|
| OWN | Chủ đầu tư (`owner`) | Nhóm U1 |
| MGR | Quản lý (`manager`) | Nhóm U1 |
| FDL | Lễ tân trưởng (`front_desk_lead`) | Nhóm U2; kế thừa toàn bộ quyền FD + quyền duyệt trong hạn mức BR-433 |
| FD | Lễ tân (`front_desk`) | Nhóm U2; người trực đêm (BR-611) dùng vai FD |
| HK | Buồng phòng (`housekeeping`) | Nhóm U3 |
| MT | Bảo trì / kỹ thuật (`maintenance`) | Nhóm U3 |
| SAL | Nhân viên sale nội bộ (`sales_staff`) | Nhóm U4 |
| CTV | Cộng tác viên / môi giới (`collaborator`) | Nhóm U4, ngoài biên chế |
| GST | Khách (qua link app khách của đơn) | U5 |
| SYS | Hệ thống (job theo lịch, sự kiện tự động, webhook đã xác thực) | Không phải người |

"FD+" = FD, FDL, MGR, OWN. "FDL+" = FDL, MGR, OWN. "MGR+" = MGR, OWN. Một tài khoản có thể có nhiều vai (ví dụ lễ tân kiêm sale nội bộ, persona P2) → quyền là **hợp** các vai.

### 0.2 Nguyên tắc chung cho mọi máy trạng thái
1. **Chỉ server chuyển trạng thái.** Giao diện chỉ hiện nút cho chuyển hợp lệ với trạng thái hiện tại **và** vai người dùng (US-020); server kiểm tra lại cả hai. Chuyển không hợp lệ → từ chối, ghi nhật ký lần bị từ chối (US-002 AC2).
2. **Mọi chuyển trạng thái ghi lịch sử**: trạng thái cũ, mới, sự kiện, người/hệ thống, thời điểm (giờ Việt Nam, BR-001), lý do (nếu bắt buộc).
3. **Trạng thái kết thúc không mở lại**. Sửa sai sau khi kết thúc bằng **bút toán điều chỉnh** (BR-008) hoặc chuyển ngoại lệ có tên riêng trong bảng (ví dụ "Khôi phục no-show"), luôn cần MGR+.
4. **Kiểm tra chiếm phòng ở server trong cùng giao dịch** cho mọi chuyển làm thay đổi tồn phòng (BR-906): tạo giữ chỗ, xác nhận, gia hạn, đổi phòng, đổi ngày, khôi phục, tạo/kéo dài khối OOO.
5. **Mọi thay đổi tồn phòng phát sự kiện đồng bộ kênh** (BR-905) – ghi ở cột "Hệ quả" là `sync`.
6. Khóa lạc quan (phiên bản bản ghi): hai người cùng chuyển một bản ghi → người sau nhận thông báo "Dữ liệu vừa thay đổi, tải lại" (cùng tinh thần BR-906 S5).

### 0.3 Danh mục máy trạng thái
| Mã | Đối tượng | Tên trạng thái (dùng trong code) | Mục |
|---|---|---|---|
| SM-01 | Đơn đặt phòng (ngắn ngày và dài hạn) | `hold`, `confirmed`, `in_house`, `checked_out`, `cancelled`, `no_show` | 1 |
| SM-02 | Khối khóa phòng OOO (chặn tồn phòng) | `planned`, `active`, `released`, `cancelled` | 2 |
| SM-03 | Trạng thái buồng | `VC`, `VI`, `VD`, `CL`, `OC`, `OD`, `OOO` | 3 |
| SM-04 | Phiếu sửa chữa | `new`, `in_progress`, `waiting_parts`, `done`, `cancelled` | 4 |
| SM-05 | Khai báo lưu trú (theo đơn) | `none`, `pre`, `partial`, `review`, `scanned`, `sent`, `confirmed`, `needs_update`, `updated`, `void` | 5 |
| SM-06 | Hợp đồng dài hạn | `signed`, `active`, `terminating`, `settling`, `closed`, `cancelled` | 6 |
| SM-07 | Kỳ thu dài hạn | `scheduled`, `due_soon`, `due`, `overdue`, `escalated`, `paid`, `waived` | 7 |
| SM-08 | Báo giá | `active`, `expired`, `converted`, `withdrawn` | 8 |
| SM-09 | Khách tiềm năng (lead) | `new`, `quoted`, `holding`, `won`, `lost` | 9 |
| SM-10 | Yêu cầu duyệt (FOC, giảm giá đặc biệt, ngoại lệ) | `pending`, `approved`, `rejected`, `escalated`, `cancelled` | 10 |
| SM-11 | Hoa hồng (theo đơn/HĐ) | `projected`, `earned`, `payable`, `paid`, `void` | 11 |
| SM-12 | Giao dịch thanh toán | `pending`, `succeeded`, `failed`, `expired`, `reversed` | 12 |
| SM-13 | Folio / bill | `open`, `settled`, `closed` | 13 |
| SM-14 | Việc buồng phòng | `open`, `in_progress`, `done`, `cancelled` | 14 |
| SM-15 | Yêu cầu từ app khách | `new`, `acknowledged`, `in_progress`, `done`, `declined` | 15 |

Tên trạng thái đơn theo decision-log 15/10/2026 (DOM, BR-301). Ánh xạ từ prototype: `cf`→`confirmed`, `in`→`in_house`, `out`→`checked_out`, `cx`→`cancelled`; `ooo` của prototype **không còn là trạng thái đơn** mà là SM-02.

---

## 1. SM-01 – Đơn đặt phòng

Một đơn chiếm khoảng [ngày đến, ngày đi) của một căn (BR-002). Đơn ngắn ngày và đơn dài hạn dùng **cùng** máy trạng thái; đơn dài hạn có thêm hợp đồng (SM-06) sinh khi xác nhận ký quỹ. Đơn con gia hạn OTA (BR-422) cũng là một đơn SM-01 liên kết đơn gốc.

```mermaid
stateDiagram-v2
    [*] --> hold: Tạo giữ chỗ (từ báo giá hoặc đặt trực tiếp chưa cọc)
    [*] --> confirmed: Tạo đơn đã đảm bảo (OTA, đã thu cọc, khách vãng lai đã thu)
    hold --> hold: Gia hạn giữ chỗ (1 lần, BR-303)
    hold --> confirmed: Xác nhận cọc / ký quỹ
    hold --> cancelled: Hủy (lý do) / Hết hạn giữ chỗ (SYS)
    confirmed --> confirmed: Đổi căn / đổi ngày / dời ngày
    confirmed --> in_house: Nhận phòng
    confirmed --> cancelled: Hủy theo chính sách
    confirmed --> no_show: Đánh dấu không đến
    no_show --> confirmed: Khôi phục no-show (MGR+)
    in_house --> in_house: Gia hạn / đổi phòng / trả muộn / trả sớm
    in_house --> confirmed: Hoàn tác nhận phòng nhầm (MGR+)
    in_house --> checked_out: Hoàn tất trả phòng
    checked_out --> [*]
    cancelled --> [*]
    no_show --> [*]
```

### 1.1 Ý nghĩa và tác động lên số liệu
| Trạng thái | Nghĩa | Khóa tồn phòng | Đêm bán / doanh thu (BR-904) | Hiện ở "Hôm nay" (BR-404) |
|---|---|---|---|---|
| `hold` | Giữ chỗ chờ cọc/ký quỹ, có hạn (BR-302) | Có | Không | Mục riêng "Giữ chỗ chưa cọc" |
| `confirmed` | Đã đảm bảo (cọc/ký quỹ/OTA) | Có | Có | "Khách đến" khi ngày đến = hôm nay |
| `in_house` | Khách đang ở | Có | Có | "Khách đi" khi ngày đi = hôm nay; "Đang ở" |
| `checked_out` | Đã trả phòng, folio đã chốt | Không (từ thời điểm trả) | Có (các đêm đã ở) | Không |
| `cancelled` | Đã hủy (người hủy hoặc hết hạn giữ) | Không | Không; phí hủy giữ lại vào "doanh thu khác" | Không |
| `no_show` | Không đến | Không (mở bán các đêm còn lại, BR-311) | Không; cọc giữ lại vào "doanh thu khác" | Không |

### 1.2 Bảng chuyển trạng thái
| # | Từ → Đến | Sự kiện | Điều kiện (server kiểm) | Ai được chuyển | Hệ quả |
|---|---|---|---|---|---|
| B1 | [*] → `hold` | Tạo giữ chỗ | Căn trống cả khoảng (BR-906), không có khối OOO (BR-804); ngày đến không phải hôm nay (BR-302); có khách với SĐT (BL 5.16); số khách ≤ sức chứa (BR-110); ngắn ngày trong giới hạn BR-112, dài hạn từ ngưỡng BR-108; hạn giữ = công thức BR-302 | FD+, SAL, CTV (khách của mình) | Sinh mã đơn (BR-007); sinh bản ghi khai báo `none` (BR-608); lead → `holding`; `sync` đóng phòng |
| B2 | [*] → `confirmed` | Tạo đơn đã đảm bảo | Như B1 trừ điều kiện "không phải hôm nay"; **một trong**: (a) kênh OTA, có mã OTA và kiểu thanh toán (BR-307); (b) đã ghi giao dịch cọc ≥ mức BR-305 (ngắn ngày) – xem SM-12; (c) khách vãng lai, đến hôm nay, đã thu theo BR-402 | FD+ ; SYS (đơn OTA từ channel manager – R3) | Như B1; giá từng đêm được snapshot (BR-106, BR-006) |
| B3 | `hold` → `hold` | Gia hạn giữ chỗ | Trước khi hết hạn; chưa gia hạn lần nào; mức gia hạn tối đa BR-303; vẫn không vượt trần BR-302 | Người tạo đơn (SAL/CTV của mình), FD+ | Ghi hạn mới; nhắc lại theo BR-303 |
| B4 | `hold` → `confirmed` | Xác nhận cọc / ký quỹ | Có giao dịch `succeeded` (SM-12) đủ số tiền: ngắn ngày BR-305; dài hạn = ký quỹ BR-206/BR-306; kiểm trùng lại (BR-906) | FD+, SAL ; SYS (IPN/webhook đã xác thực – R3). **CTV không được** (chỉ gửi "báo đã chuyển cọc", xem rbac-matrix 4.3) | Lead → `won`; dài hạn: sinh HĐ `signed` (SM-06) + lịch kỳ thu (SM-07); hoa hồng → `projected` (SM-11); nhật ký tiền (BR-008) |
| B5 | `hold` → `cancelled` | Hủy giữ chỗ | Lý do bắt buộc từ danh mục BR-308; không phí | Người tạo (SAL/CTV của mình), FD+ | Lead → `quoted`; `sync` mở phòng; khai báo → `void` |
| B6 | `hold` → `cancelled` | Hết hạn giữ chỗ | Đến hạn (BR-302/303) mà chưa có giao dịch cọc `succeeded` | SYS | Lý do "Hết hạn giữ chỗ"; báo người tạo; lead → `quoted`; `sync` mở phòng; khai báo → `void` |
| B7 | `confirmed` → `confirmed` | Đổi căn / đổi ngày | Kiểm trùng căn mới/khoảng mới (BR-906); lý do bắt buộc; đơn OTA: chỉ đổi căn nội bộ, ngày theo OTA | FD+ | Tính lại giá theo quy tắc của đơn (snapshot giữ nguyên cho đêm không đổi); `sync` |
| B8 | `confirmed` → `confirmed` | Dời ngày thay vì hủy (BR-309) | Đơn trực tiếp/CTV đã cọc; chưa dời lần nào; khoảng mới trong giới hạn BR-309 | MGR+ | Giữ nguyên cọc; `sync` |
| B9 | `confirmed` → `in_house` | Nhận phòng | Hôm nay = ngày đến (nhận trước mốc BR-003/BR-411 thì đêm trước phải thuộc đơn – lễ tân đổi ngày đến trước, B7); **BR-402**: (1) buồng `VI` hoặc `VC`, nếu khác → cần FDL+ xác nhận ngoại lệ có lý do; (2) đã thu đủ phần còn lại hoặc OTA đã trả/đảm bảo; (3) có giấy tờ người đứng tên (khai báo ≥ `partial` có người đứng tên); giờ nhận mặc định giờ chuẩn BR-401, phụ thu chỉ khi lễ tân nhập giờ sớm (BR-414) | FD+ | Ghi giờ nhận thực tế; buồng → `OC` (hoặc `OD` nếu nhận vào buồng `VD` theo ngoại lệ) – SM-03; phụ thu nhận sớm vào folio (BR-411/BR-413), FOC qua SM-10; mã cửa hiệu lực (BR-403); hạn khai báo bắt đầu tính (BR-602/603) |
| B10 | `confirmed` → `cancelled` | Hủy đơn đã đảm bảo | Lý do bắt buộc (BR-308); đơn trực tiếp/CTV: phí hủy/hoàn theo BR-309 – phần hoàn tạo yêu cầu hoàn (BR-522, MGR+ duyệt); đơn OTA: theo BR-310 (số tiền phạt do kênh báo) | FD+ ; SAL (đơn của mình, chỉ đơn trực tiếp); SYS (đơn OTA hủy từ channel manager – R3) | `sync` mở phòng; khai báo → `void`; hoa hồng → `void`; phần cọc giữ lại ghi "phí hủy" |
| B11 | `confirmed` → `no_show` | Đánh dấu không đến | Sau mốc đánh dấu BR-311, chưa nhận phòng, đã có ghi chú "đã gọi/nhắn, không liên lạc được"; **không tự động** | FD+ | Đơn trực tiếp: giữ cọc theo BR-311; đơn OTA: tạo việc "báo no-show trên kênh"; mở bán các đêm còn lại (`sync`); khai báo → `void`; hoa hồng → `void` |
| B12 | `no_show` → `confirmed` | Khôi phục no-show *(BA đề xuất – DOM xác nhận)* | Khách đến muộn sau khi đã đánh dấu; trong ngày nghiệp vụ của đêm đến; căn vẫn trống (BR-906) | MGR+ (FDL+ nếu là người trực đêm duy nhất – chờ DOM) | Đóng lại phòng (`sync`); khai báo → `none` (bản ghi mới) |
| B13 | `in_house` → `in_house` | Gia hạn | Đêm thêm liên tiếp còn trống (BR-906); giới hạn BR-421, vượt → báo giá dài hạn (BR-108); giá theo BR-421; đơn OTA → tạo **đơn con** kênh Trực tiếp liên kết (BR-422) ở `confirmed` rồi SYS chuyển `in_house` | FD+ ; GST (tự phục vụ – R3, chỉ khi giá hiển thị trước) | Đổi ngày đi; buồng → `OD` (BR-802); thu tiền theo BR-423; khai báo NN → `needs_update` (BR-604); `sync` |
| B14 | `in_house` → `in_house` | Đổi phòng | Căn mới trống (BR-906), buồng `VI`/`VC`; lý do bắt buộc; giá theo BR-424 | FD+ | Căn cũ → `VD`/`OD` + việc dọn; hủy mã cửa cũ, cấp mã mới (BR-403); khai báo không khai lại (BR-424); `sync` |
| B15 | `in_house` → `in_house` | Đặt trả muộn | Theo BR-412, BR-416 (có khách đến cùng ngày và không có căn thay thế → chặn, trừ MGR+); sau mốc 100% của BR-416 → xử lý như gia hạn (B13) | FD+ ; GST yêu cầu (lễ tân xác nhận) | Phụ thu vào folio sau khi lễ tân xác nhận (BR-414); mã cửa kéo dài (BR-403) |
| B16 | `in_house` → `in_house` | Trả sớm (báo trước ngày đi) | Hoàn theo BR-428 (yêu cầu hoàn qua SM-10/SM-12) | FD+ | Đổi ngày đi = hôm nay hoặc ngày khách rời; `sync` mở các đêm còn lại; khai báo NN → `needs_update` |
| B17 | `in_house` → `confirmed` | Hoàn tác nhận phòng nhầm *(BA đề xuất)* | Chưa có dòng folio nào sinh sau nhận phòng; cùng ngày nhận | MGR+ | Buồng về trạng thái trước khi nhận; hủy mã cửa; nhật ký lý do |
| B18 | `in_house` → `checked_out` | Hoàn tất trả phòng | Đã qua 3 bước (BR-426); folio "còn phải thu" = 0 **hoặc** MGR+ ghi công nợ có hạn (BR-525); mọi FOC trên folio đã `approved` (SM-10); dài hạn: HĐ chuyển `settling` (SM-06) | FD+ ; GST "trả phòng nhanh" (BR-427) chỉ khi còn phải thu = 0 tại thời điểm bấm | Folio → `settled`/`closed` (SM-13); buồng → `VD` (BR-802); hủy mã cửa (BR-403); việc "Dọn trả phòng" + "Bổ sung minibar" (SM-14); khai báo NN → `needs_update` (BR-604); hoa hồng ngắn ngày → `earned` khi thu đủ (BR-903); hóa đơn điện tử (BR-524) |

### 1.3 Ngoại lệ và lỗi cần xử lý
| Tình huống | Hành vi |
|---|---|
| Hai người cùng xác nhận một giữ chỗ / cùng đặt một căn – đêm (BR-906, S5) | Một người thành công; người kia nhận "Căn vừa được đặt/đơn vừa thay đổi", không tạo bản ghi |
| Đơn OTA về trùng đơn đã có (đồng bộ trễ, BR-312) | Vẫn tạo đơn `confirmed` (đơn OTA là cam kết với kênh) và gắn cờ **xung đột**; cảnh báo đỏ FD + MGR; xử lý "dời khách" bằng B7/B14 theo thứ tự ưu tiên BR-312 |
| Job hết hạn giữ chỗ chạy trễ | Khi job chạy, so thời điểm hiện tại với hạn đã lưu; đơn đã có giao dịch cọc `succeeded` trước hạn → không hủy dù job chạy sau hạn |
| Giao dịch cọc đến **sau** khi giữ chỗ đã tự hủy | Không tự khôi phục; tạo cảnh báo cho FD/SAL "Tiền về cho đơn đã hủy" → tạo đơn mới (B1/B2) nếu căn còn trống, hoặc hoàn tiền (BR-522) |
| Khách đến khi đơn còn `hold` (chưa cọc) | Không nhận phòng trực tiếp từ `hold`: thu tiền → B4 → B9 |
| Khách đến khuya, không có lễ tân (BR-611) | Người trực (FD) hoặc MGR thực hiện B9 trên điện thoại; mã cửa chỉ cấp khi điều kiện BR-402 đạt |
| Đơn dài hạn hết HĐ mà khách chưa trả phòng | Đơn vẫn `in_house`; cảnh báo quá hạn trả phòng; MGR+ chọn: gia hạn HĐ (SM-06) hoặc tính ngày lẻ (BR-210) |

---

## 2. SM-02 – Khối khóa phòng OOO

OOO **không phải đơn khách** (BR-301, BR-804). Là khối chặn tồn phòng của một căn trong khoảng ngày; rack, kiểm trùng, channel manager, đêm khả dụng (BR-904) đều đọc từ khối này.

```mermaid
stateDiagram-v2
    [*] --> planned: Tạo khóa có kế hoạch (ngày bắt đầu ở tương lai)
    [*] --> active: Tạo khóa ngay (từ phiếu sửa chữa)
    planned --> active: Đến ngày bắt đầu (SYS)
    planned --> cancelled: Hủy khóa
    active --> active: Kéo dài / rút ngắn khoảng ngày
    active --> released: Phiếu sửa xong hoặc mở khóa
    released --> [*]
    cancelled --> [*]
```

| # | Từ → Đến | Sự kiện | Điều kiện | Ai | Hệ quả |
|---|---|---|---|---|---|
| O1 | [*] → `planned`/`active` | Tạo khối | Có lý do và khoảng ngày dự kiến (BR-804); gắn phiếu sửa chữa (bắt buộc với `active` từ sự cố, không bắt buộc với bảo trì định kỳ); **không** khóa căn đang có đơn `in_house` (đổi phòng trước – B14); khoảng trùng đơn `hold`/`confirmed` → hiện danh sách đơn cần dời, chỉ lưu khi không còn đơn trùng hoặc MGR+ xác nhận đã có phương án dời | MT, FD+ | `sync` đóng phòng; `active` → buồng `OOO` (SM-03) |
| O2 | `planned` → `active` | Đến ngày bắt đầu | Căn không có khách `in_house` | SYS | Buồng → `OOO` |
| O3 | `active` → `active` | Đổi khoảng ngày | Kéo dài: kiểm trùng như O1 | MT, FD+ | `sync` |
| O4 | `active` → `released` | Mở khóa | Phiếu liên kết → `done` (SM-04), hoặc MGR+ mở khóa có lý do | SYS (theo phiếu), MGR+ | Buồng `OOO` → `VD` (BR-804); `sync` mở bán; đêm OOO đã qua vẫn trừ khỏi đêm khả dụng |
| O5 | `planned` → `cancelled` | Hủy khóa | Chưa bắt đầu | MT, FD+ | `sync` mở bán |

---

## 3. SM-03 – Trạng thái buồng

Bảy mã theo BR-801. Trạng thái buồng **tách** khỏi trạng thái đơn, đồng bộ qua sự kiện (BR-801, BR-806).

```mermaid
stateDiagram-v2
    VC --> VI: Kiểm phòng đạt
    VI --> VC: Quá hạn chờ (SYS, BR-805)
    VC --> OC: Nhận phòng (SYS)
    VI --> OC: Nhận phòng (SYS)
    VD --> OD: Nhận phòng ngoại lệ (FDL+)
    OC --> OD: Cần dọn (HK/FD, hoặc SYS hằng ngày / gia hạn)
    OD --> CL: Bắt đầu dọn
    VD --> CL: Bắt đầu dọn
    CL --> OC: Dọn xong (còn khách)
    CL --> VC: Dọn xong (không còn khách)
    OC --> VD: Trả phòng (SYS)
    OD --> VD: Trả phòng (SYS)
    VC --> OOO: Khối OOO active (SYS)
    VI --> OOO: Khối OOO active (SYS)
    VD --> OOO: Khối OOO active (SYS)
    OOO --> VD: Khối OOO released (SYS)
```

| # | Từ → Đến | Sự kiện | Điều kiện | Ai | Hệ quả |
|---|---|---|---|---|---|
| R1 | `VD`/`OD` → `CL` | Bắt đầu dọn | Có việc dọn mở cho căn (SM-14) – nếu chưa có thì tạo | HK | Việc dọn → `in_progress` |
| R2 | `CL` → `OC` | Dọn xong (căn còn đơn `in_house`) | – | HK | Việc dọn → `done` (BL 5.15) |
| R3 | `CL` → `VC` | Dọn xong (không còn đơn `in_house`) | – | HK | Việc dọn → `done`; căn chờ kiểm |
| R4 | `VC` → `VI` | Kiểm phòng đạt | Checklist BR-808 đủ mục; người kiểm theo BR-802: FDL+/MGR, **hoặc** HK tự kiểm khi đủ checklist + ảnh và cấu hình cơ sở cho phép (ca chỉ 1 người) | FDL+, HK (có điều kiện) | Lưu biên bản kiểm (người, giờ, ảnh) |
| R5 | `VI` → `VC` | Quá hạn chờ khách | Không có khách theo BR-805 | SYS | Cần kiểm lại |
| R6 | `VC`/`VI` → `OC` | Nhận phòng (B9) | – | SYS (theo SM-01) | – |
| R7 | `VD` → `OD` | Nhận phòng ngoại lệ (B9 khi buồng chưa sẵn sàng) | FDL+ xác nhận có lý do (BR-402) | SYS (theo SM-01) | Tạo việc dọn ưu tiên cao |
| R8 | `OC` → `OD` | Cần dọn | (a) HK/FD báo; (b) SYS theo mốc giờ hằng ngày BR-802 cho khách ngắn ngày; (c) SYS khi gia hạn (BR-802); (d) SYS theo lịch gói dọn dài hạn (BR-807) | HK, FD+, SYS | Tạo việc "Dọn phòng khách đang ở" (trừ khi khách từ chối dọn – BR-807) |
| R9 | `OC`/`OD`/`CL` → `VD` | Trả phòng (B18) | Nếu đang `CL` khi khách trả: giữ `CL`, khi dọn xong → `VC` | SYS | Việc "Dọn trả phòng" |
| R10 | `VC`/`VI`/`VD` → `OOO` | Khối OOO `active` | Không có đơn `in_house` (O1) | SYS | Mọi việc dọn mở của căn → `cancelled` |
| R11 | `OOO` → `VD` | Khối OOO `released` | – | SYS | Việc "Dọn sau sửa chữa" |

**Chuyển bị cấm** (server từ chối): bất kỳ chuyển nào vào/ra `OOO` bằng tay (chỉ qua SM-02); `VD`/`CL` → `VI` (phải dọn xong và kiểm); `OC`/`OD` → `VC`/`VI` (chỉ trả phòng mới rời trạng thái có khách); nhận phòng vào `OOO`.

**Đối chiếu buồng – đơn** (BR-806): SYS kiểm theo mốc BR-806 và khi mở rack; lệch → cảnh báo FD, không tự sửa.

---

## 4. SM-04 – Phiếu sửa chữa

Tên hiển thị theo BL 4.7: Mới / Đang xử lý / Chờ vật tư / Xong; BA thêm `cancelled` (phiếu trùng/nhầm). Mức độ và thời hạn theo BR-809.

```mermaid
stateDiagram-v2
    [*] --> new: Tạo phiếu (MT/HK/FD+/SYS từ app khách)
    new --> in_progress: Nhận phiếu
    new --> cancelled: Hủy (trùng/nhầm)
    in_progress --> waiting_parts: Chờ vật tư
    waiting_parts --> in_progress: Có vật tư
    in_progress --> done: Sửa xong
    waiting_parts --> cancelled: Hủy (có lý do)
    done --> in_progress: Mở lại (khách báo lại)
    done --> [*]
    cancelled --> [*]
```

| # | Từ → Đến | Sự kiện | Điều kiện | Ai | Hệ quả |
|---|---|---|---|---|---|
| W1 | [*] → `new` | Tạo phiếu | Căn, mô tả (bắt buộc), mức độ (mặc định theo BR-809; từ app khách mặc định Trung bình, FD nâng mức); tùy chọn "Khóa phòng" → tạo khối OOO (SM-02, O1) | MT, HK, FD+ ; SYS (yêu cầu "Báo hỏng" từ app khách, BR-811) | Mã phiếu do server cấp (BR-007); hạn nhận/xử lý tính theo BR-809; mức Cao → báo ngay MT + FD + MGR và vào "Cần chú ý" (BR-907) |
| W2 | `new` → `in_progress` | Nhận phiếu | Có người xử lý (tự nhận hoặc được giao) | MT (tự nhận), FD+ (giao) | Ghi thời điểm nhận – đo hạn BR-809 |
| W3 | `in_progress` ↔ `waiting_parts` | Chờ / có vật tư | Ghi chú vật tư cần | MT, FD+ | Hạn BR-809 tạm dừng? → **không**, hạn vẫn chạy; quá hạn vẫn cảnh báo *(BA đề xuất)* |
| W4 | `in_progress` → `done` | Sửa xong | Ghi kết quả; ảnh sau sửa (khuyến nghị, bắt buộc với mức Cao) | MT, FD+ | Khối OOO liên kết → `released` (O4) → buồng `VD`; yêu cầu khách liên kết → `done` (SM-15) |
| W5 | `new`/`waiting_parts` → `cancelled` | Hủy | Lý do bắt buộc; nếu có khối OOO → hủy/giải phóng khối | FD+ (MT chỉ hủy phiếu do chính mình tạo, khi còn `new`) | – |
| W6 | `done` → `in_progress` | Mở lại | Trong cùng kỳ lưu trú của khách báo; nếu cần khóa lại → tạo khối OOO mới | FD+ | Hạn tính lại từ thời điểm mở lại |

**Mức Cao và khách đang ở**: nếu hết thời hạn phương án của BR-809 chưa xong → hệ thống gợi ý đổi phòng (B14) + FOC bù sự cố (SM-10) – xem quy trình P04 trong `business-processes.md`.

**Bảo trì định kỳ** (BR-810) không phải phiếu sửa; khi hoàn thành một kỳ → SYS sinh kỳ kế tiếp theo BR-810. Nếu công việc định kỳ cần khóa phòng → tạo khối OOO `planned`.

---

## 5. SM-05 – Khai báo lưu trú (theo đơn)

Tên trạng thái theo BR-607. **Thay đổi so với BL 5.12** theo SEC R-REG-05 và decision-log 15/10/2026: đồng ý lưu ảnh giấy tờ **không** còn là điều kiện để sang `scanned`; đồng ý chỉ quyết định ảnh được lưu theo hạn BR-610 hay xóa ngay sau khi khai báo (BR-609).

```mermaid
stateDiagram-v2
    [*] --> none: Đơn được tạo (mọi luồng, BR-608)
    none --> pre: Khách gửi giấy tờ trước qua app
    pre --> partial: Lễ tân đối chiếu, còn thiếu người
    pre --> review: Lễ tân đối chiếu, đủ người
    none --> partial: Nhập giấy tờ một phần
    partial --> review: Đủ số người (BR-601)
    review --> partial: Thêm người / bỏ một người
    review --> scanned: Đối chiếu xong
    scanned --> sent: Đã khai trên cổng, nhập mã hồ sơ
    sent --> confirmed: Cổng xác nhận
    sent --> scanned: Cổng từ chối, sửa lại
    confirmed --> needs_update: Gia hạn / trả sớm / trả phòng NN / đổi giấy tờ / thêm người
    needs_update --> updated: Đã cập nhật trên cổng
    updated --> needs_update: Thay đổi tiếp
    none --> void: Đơn hủy / no-show trước khi khai
    partial --> void: Đơn hủy / no-show
    pre --> void: Đơn hủy / no-show
    confirmed --> [*]
    updated --> [*]
    void --> [*]
```

| # | Từ → Đến | Sự kiện | Điều kiện | Ai | Hệ quả |
|---|---|---|---|---|---|
| K1 | [*] → `none` | Đơn sinh (B1, B2) | Mọi luồng tạo đơn (BR-608); đơn con gia hạn **không** sinh bản ghi mới (BR-608) | SYS | Số người cần = số khách đơn (BR-601) |
| K2 | `none` → `pre` | Check-in online | Khách tải giấy tờ qua link có thời hạn gắn đơn (SEC R-REG-08); không nhận ảnh qua chat | GST | Ảnh vào kho C3; báo FD |
| K3 | `pre`/`none` → `partial`/`review` | Nhập/đối chiếu giấy tờ | Mỗi người: loại giấy, số, họ tên, ngày sinh, quốc tịch; NN thêm hạn hộ chiếu, thị thực, ngày nhập cảnh (BR-606); trẻ em theo BR-612 | FD+ | Ghi nhật ký C3 mỗi lần xem/nhập (SEC R-REG-09) |
| K4 | `partial` → `review` | Đủ người | Số người có giấy tờ ≥ số khách đơn | SYS | – |
| K5 | `review` → `scanned` | Đối chiếu xong | Đối chiếu tự động đã chạy và lễ tân xử lý mọi cảnh báo: tên khớp đơn, hạn hộ chiếu so thật, thị thực đến ngày trả, ngày đi khai không vượt hạn tạm trú (BR-605) – cảnh báo **không chặn** nhận phòng (SEC R-REG-03) nhưng phải có ghi chú xử lý; trạng thái đồng ý lưu ảnh đã ghi (có / không) | FD+ | Không đồng ý → đánh dấu ảnh "xóa sau khi khai báo xong" (BR-609) |
| K6 | `scanned` → `sent` | Đã khai | Lễ tân chọn đúng loại (NN / công dân VN, BR-602/603/606), sao chép dữ liệu, tự đăng nhập cổng (SEC R-REG-06), dán mã hồ sơ | FD+ | Ghi người khai, thời điểm, mã hồ sơ |
| K7 | `sent` → `confirmed` | Cổng xác nhận | Lễ tân ghi nhận xác nhận | FD+ | Áp hạn lưu ảnh (BR-610) hoặc xóa ngay nếu không đồng ý |
| K8 | `sent` → `scanned` | Cổng từ chối | Ghi lý do từ chối | FD+ | Sửa dữ liệu, khai lại |
| K9 | `confirmed`/`updated` → `needs_update` | Thay đổi phải cập nhật | Với hồ sơ NN: gia hạn (B13), trả sớm (B16), trả phòng (B18), gia hạn HĐ, đổi giấy tờ (BR-604, BR-608); với mọi hồ sơ: thêm người giữa chừng (BR-601) | SYS | Tạo việc "Cập nhật ngày đi / khai bổ sung" cho FD trong ngày (BR-604) |
| K10 | `needs_update` → `updated` | Đã cập nhật | Nhập ngày đi thực tế / mã khai bổ sung | FD+ | – |
| K11 | `none`/`pre`/`partial`/`review` → `void` | Đơn `cancelled`/`no_show` | Chưa khai trên cổng | SYS | Ảnh đã nhận xóa theo hạn của SEC mục 7 cho hồ sơ không lưu trú |

**Hạn khai báo** (không phải trạng thái mà là thuộc tính tính toán, hiển thị và nhắc):
- Công dân VN: theo BR-602. Người nước ngoài: theo BR-603 – **hạn sớm hơn** giữa "giờ nhận phòng thực tế + số giờ BR-603" và mốc BR-602 ngày đến.
- **Mâu thuẫn còn mở**: BL 5.12 dùng một mốc 23:00 cho mọi khách; SEC R-REG-01 và DOM BR-603 cho rằng người nước ngoài là 12 giờ kể từ khi đến. Đội đang dùng hạn sớm hơn `[GIẢ ĐỊNH – chờ INV/luật sư xác nhận]` (decision-log 15/10/2026, DOM). Tham số tách riêng `registration_deadline_vn` và `registration_deadline_foreigner_hours` để luật sư sửa không phải đổi máy trạng thái.
- Cờ "quá hạn" khi trạng thái < `sent` và đã qua hạn → vào "Cần chú ý" (BR-907), nhắc người trực theo BR-611.

---

## 6. SM-06 – Hợp đồng dài hạn

Sinh khi xác nhận ký quỹ cho đơn dài hạn (B4, BR-306). Đơn dài hạn vẫn đi theo SM-01 (`confirmed` → `in_house` → `checked_out`); HĐ theo dõi phần tiền và nghĩa vụ.

```mermaid
stateDiagram-v2
    [*] --> signed: Xác nhận ký quỹ (đơn hold -> confirmed)
    signed --> active: Khách nhận phòng (đơn -> in_house)
    signed --> cancelled: Hủy trước ngày vào ở
    active --> active: Gia hạn bằng phụ lục / thu kỳ / đổi gói dọn
    active --> terminating: Khách báo chấm dứt sớm
    terminating --> active: Khách rút thông báo (MGR+)
    active --> settling: Trả phòng (hết hạn hoặc gia hạn sang HĐ mới)
    terminating --> settling: Trả phòng
    settling --> closed: Quyết toán ký quỹ xong
    closed --> [*]
    cancelled --> [*]
```

| # | Từ → Đến | Sự kiện | Điều kiện | Ai | Hệ quả |
|---|---|---|---|---|---|
| H1 | [*] → `signed` | Xác nhận ký quỹ (B4) | Ký quỹ theo BR-206 đã thu; snapshot tiền thuê, giảm kỳ hạn, hệ số ký quỹ, chu kỳ thu, tỷ lệ hoa hồng, người chốt (BR-006, BR-212); ngày kết thúc theo tháng lịch (BR-209) | FD+, SAL; SYS (R3) | Sinh lịch kỳ thu (SM-07) theo BR-207/208; hoa hồng `projected` (SM-11) |
| H2 | `signed` → `active` | Nhận phòng | Kỳ đầu đã thu trước khi giao mã cửa (BR-208); đơn B9 | SYS (theo SM-01) | Lịch dọn gói (BR-807) bắt đầu; chỉ số công tơ đầu kỳ ghi (BR-502) |
| H3 | `signed` → `cancelled` | Hủy trước vào ở | Hoàn theo BR-314 (yêu cầu hoàn – MGR+ duyệt, BR-522) | MGR+ | Đơn → `cancelled` (B10); hoa hồng `void` |
| H4 | `active` → `active` | Gia hạn HĐ | Theo BR-211: phụ lục hoặc HĐ mới với giá/tham số tại thời điểm gia hạn; ký quỹ chuyển tiếp, bù chênh; NN kiểm thị thực (BR-605) | MGR+, SAL (đề xuất), FD+ | Đơn kéo dài ngày đi (kiểm trùng BR-906); kỳ thu mới; khai báo → `needs_update` |
| H5 | `active` → `active` | Sửa tay con số trên HĐ | Lý do + người duyệt MGR+ (BR-006) | MGR+ | Nhật ký giá trị cũ/mới |
| H6 | `active` → `terminating` | Khách báo chấm dứt sớm | Ghi ngày báo, ngày nghỉ dự kiến; mức mất ký quỹ và tiền hoàn theo BR-313 tính sẵn để quản lý xem | FD+, MGR+ | Kỳ thu chưa bắt đầu sau ngày nghỉ → `waived`; hoa hồng đợt chưa chi → `void` (BR-212) |
| H7 | `terminating` → `active` | Khách rút thông báo | Trước ngày nghỉ | MGR+ | Khôi phục kỳ thu |
| H8 | `active`/`terminating` → `settling` | Khách trả phòng (B18) | Chốt công tơ ngày trả (BR-502), biên bản kiểm phòng có ảnh (BR-214) | SYS (theo SM-01) | Lập bảng quyết toán BR-214 |
| H9 | `settling` → `closed` | Quyết toán xong | Bảng quyết toán đã được MGR+ duyệt; nếu dương → đã thu; nếu âm → giao dịch hoàn `succeeded` trong hạn BR-214 | MGR+ | Ký quỹ = 0; hoa hồng còn lại xử lý theo BR-212 |

---

## 7. SM-07 – Kỳ thu dài hạn

Mỗi HĐ có danh sách kỳ thu (tiền thuê + phí dịch vụ, thu trước) và hóa đơn điện nước hằng tháng (thu sau, BR-504) – cả hai dùng chung máy trạng thái này, khác loại kỳ.

```mermaid
stateDiagram-v2
    [*] --> scheduled: Sinh theo lịch HĐ / chốt công tơ
    scheduled --> due_soon: Còn số ngày nhắc trước hạn (SYS)
    due_soon --> due: Đến ngày hạn (SYS)
    due --> overdue: Quá mốc cảnh báo đỏ (SYS)
    overdue --> escalated: Quá mốc chuyển quản lý (SYS)
    scheduled --> paid: Thu trước hạn
    due_soon --> paid: Thu đủ
    due --> paid: Thu đủ
    overdue --> paid: Thu đủ
    escalated --> paid: Thu đủ
    scheduled --> waived: Chấm dứt sớm / miễn (MGR+)
    paid --> [*]
    waived --> [*]
```

| # | Chuyển | Điều kiện | Ai | Hệ quả |
|---|---|---|---|---|
| T1 | → `due_soon` / `due` / `overdue` / `escalated` | Mốc theo BR-207 (tiền thuê) hoặc hạn BR-504 (điện nước) | SYS | Nhắc khách (app/mẫu tin), "Cần chú ý" (BR-907), cảnh báo đỏ MGR; **không tự khóa cửa** (BR-207) |
| T2 | → `paid` | Tổng giao dịch `succeeded` gắn kỳ ≥ số tiền kỳ | FD+, SYS (IPN – R3) | Hóa đơn điện tử theo BR-524; hoa hồng đợt 1 → `payable` nếu là kỳ đầu (BR-212) |
| T3 | → `waived` | Chấm dứt sớm (H6) hoặc MGR+ miễn có lý do | MGR+, SYS | Nhật ký tiền (BR-008) |

Thu một phần: kỳ giữ nguyên trạng thái, hiển thị "đã thu x / còn y".

---

## 8. SM-08 – Báo giá

| # | Từ → Đến | Sự kiện | Điều kiện | Ai | Hệ quả |
|---|---|---|---|---|---|
| Q1 | [*] → `active` | Lưu báo giá | Snapshot giá và tham số (BR-006); hiệu lực theo BR-304; **không khóa phòng** | SAL, CTV, FD+ | Mã báo giá (BR-007); lead → `quoted` |
| Q2 | `active` → `converted` | Tạo giữ chỗ từ báo giá (B1) | Còn hiệu lực; căn còn trống | Người tạo báo giá, FD+ | Đơn `hold` liên kết |
| Q3 | `active` → `expired` | Hết hiệu lực | Theo BR-304 | SYS | – |
| Q4 | `expired` → `active` | Gia hạn báo giá | Theo BR-304 | MGR+ | Hạn mới; giá giữ nguyên snapshot |
| Q5 | `active`/`expired` → `withdrawn` | Rút báo giá | – | Người tạo, FD+ | – |

Muốn tạo giữ chỗ từ báo giá `expired` mà không được gia hạn → tạo báo giá mới theo giá hiện hành (BR-304).

```mermaid
stateDiagram-v2
    [*] --> active: Lưu báo giá
    active --> converted: Tạo giữ chỗ
    active --> expired: Hết hiệu lực (SYS)
    expired --> active: Gia hạn (MGR+)
    active --> withdrawn: Rút
    expired --> withdrawn: Rút
    converted --> [*]
    withdrawn --> [*]
```

---

## 9. SM-09 – Khách tiềm năng (lead)

Nối với khách bằng **mã khách** (BR-954). Giai đoạn kanban theo BL 4.10.

| Từ → Đến | Sự kiện | Ai |
|---|---|---|
| [*] → `new` | Tạo lead | SAL, CTV, FD+ |
| `new` → `quoted` | Báo giá `active` đầu tiên (Q1) | SYS |
| `quoted` → `holding` | Đơn `hold` từ báo giá (B1) | SYS |
| `holding` → `won` | Đơn → `confirmed` (B4) | SYS |
| `holding` → `quoted` | Đơn giữ chỗ hủy/hết hạn (B5, B6) | SYS |
| `new`/`quoted` → `lost` | Đóng lead, lý do bắt buộc (cùng danh mục BR-308) | Người phụ trách, MGR+ |
| `lost` → `quoted` | Mở lại khi khách quay lại | Người phụ trách, MGR+ |

---

## 10. SM-10 – Yêu cầu duyệt (FOC, giảm giá đặc biệt, ngoại lệ có duyệt)

Áp cho: FOC phát sinh và giảm giá đặc biệt (BR-431–435), hoàn tiền (BR-522), sửa tay số trên HĐ (BR-006), chỉ số công tơ nhỏ hơn kỳ trước (BR-503), công nợ khi trả phòng (BR-525), trả muộn khi có khách đến (BR-416), chênh lệch kiểm kê (BR-705), định giá hư hỏng ngoài bảng (BR-512). Người duyệt và hạn mức: `rbac-matrix.md` mục 5.

```mermaid
stateDiagram-v2
    [*] --> pending: Gửi yêu cầu (lý do bắt buộc)
    [*] --> approved: Tự áp trong hạn mức của chính vai (chỉ trường hợp được phép)
    pending --> approved: Người duyệt xác nhận bằng PIN/mật khẩu của chính mình
    pending --> rejected: Người duyệt từ chối (lý do)
    pending --> escalated: Vượt hạn mức người duyệt
    escalated --> approved: Cấp trên duyệt
    escalated --> rejected: Cấp trên từ chối
    pending --> cancelled: Người gửi rút lại
    approved --> [*]
    rejected --> [*]
    cancelled --> [*]
```

| # | Chuyển | Điều kiện | Ai | Hệ quả |
|---|---|---|---|---|
| A1 | [*] → `pending` | Có lý do từ danh mục BR-432; giá trị; đối tượng (đơn/folio/HĐ) | Người thao tác (FD+, HK cho báo hư hỏng, MT cho công tơ) | Folio hiện dòng "chờ duyệt"; báo người duyệt có quyền |
| A2 | [*] → `approved` (tự áp) | **Chỉ khi** người thao tác là MGR/OWN (BR-432), hoặc FD áp FOC minibar trong hạn mức của vai FD (BR-433, BR-704) | MGR+, FD (trường hợp hẹp) | Ghi người thao tác = người duyệt |
| A3 | `pending` → `approved` | Người duyệt **khác** người gửi (trừ MGR/OWN); giá trị ≤ hạn mức lần và hạn mức tháng còn lại của người duyệt (BR-433); xác thực lại bằng PIN/mật khẩu của chính người duyệt | FDL+, MGR+ theo loại yêu cầu | Folio: dòng phát sinh + dòng FOC âm (BR-434); nhật ký; cộng dồn hạn mức tháng; kiểm cảnh báo thất thoát (BR-435) |
| A4 | `pending` → `escalated` | Giá trị vượt hạn mức người duyệt hiện tại | SYS | Chuyển cấp trên theo BR-433 |
| A5 | `pending`/`escalated` → `rejected` | Lý do từ chối | Người duyệt | Dòng FOC bị bỏ; phát sinh giữ nguyên phải thu |
| A6 | `pending` → `cancelled` | – | Người gửi | – |

**Chặn trả phòng**: folio có yêu cầu `pending`/`escalated` → không hoàn tất trả phòng (B18) cho đến khi xử lý xong hoặc người gửi rút lại.

---

## 11. SM-11 – Hoa hồng (theo đơn hoặc HĐ, mỗi người chốt)

| Từ → Đến | Sự kiện | Điều kiện | Ai |
|---|---|---|---|
| [*] → `projected` | Đơn/HĐ có người chốt SAL/CTV được xác nhận (B4) | Tỷ lệ và cơ sở tính snapshot (BR-212, BR-903) | SYS |
| `projected` → `earned` | Ngắn ngày: đơn `checked_out` và thu đủ (BR-903). Dài hạn: chia đợt – mỗi đợt là một bản ghi, đợt 1 khi kỳ đầu `paid`, đợt 2 khi qua mốc thời hạn BR-212 | – | SYS |
| `earned` → `payable` | Đến kỳ chi (gộp theo tháng – BA đề xuất, chờ DOM) | – | SYS |
| `payable` → `paid` | Đánh dấu đã chi, ghi ngày, cách chi, chứng từ | – | OWN, MGR |
| `projected`/`earned` → `void` | Đơn `cancelled`/`no_show`; HĐ chấm dứt sớm trước đợt 2 (BR-212) | – | SYS; MGR+ (điều chỉnh có lý do) |

---

## 12. SM-12 – Giao dịch thanh toán

Mỗi khoản thu/hoàn là một giao dịch gắn folio (BR-521). OTTIMO không lưu dữ liệu thẻ (decision-log SEC).

| Từ → Đến | Sự kiện | Ai |
|---|---|---|
| [*] → `pending` | Tạo yêu cầu thu online (VietQR động, link VNPay/MoMo – R3) | FD+, SAL, SYS |
| [*] → `succeeded` | Ghi nhận thu tay (tiền mặt, chuyển khoản đã thấy tiền, "đã thu qua OTA") | FD+, SAL (cọc đơn của mình) |
| `pending` → `succeeded` | IPN/webhook đã xác thực chữ ký và khớp số tiền (decision-log INT), hoặc FD+ xác nhận đã thấy tiền | SYS, FD+ |
| `pending` → `failed` / `expired` | Cổng báo lỗi / quá hạn link | SYS |
| `succeeded` → `reversed` | Ghi sai: tạo giao dịch đảo (không xóa – BR-008) | MGR+ |

Hoàn tiền = giao dịch âm riêng, cần yêu cầu duyệt `approved` (SM-10, BR-522).

---

## 13. SM-13 – Folio / bill

| Trạng thái | Nghĩa | Ai được ghi dòng |
|---|---|---|
| `open` | Đơn chưa trả phòng; thêm/sửa dòng phát sinh (BR-008: sửa = bút toán điều chỉnh, có nhật ký) | FD+; HK gián tiếp qua kiểm minibar; SYS (gia hạn, công tơ) |
| `settled` | Đã hoàn tất trả phòng, bill phát hành, số bill do server cấp (BR-007) – **bill khóa** (US-038) | Chỉ bút toán điều chỉnh của MGR+; phát sinh sau trả phòng nhanh (BR-427) do FD+ ghi trong thời hạn BR-427 |
| `closed` | Hết thời hạn phát sinh sau trả phòng, đã đối soát | Chỉ MGR+ điều chỉnh, có lý do |

Chuyển: `open` → `settled` cùng lúc B18; `settled` → `closed` do SYS khi hết thời hạn BR-427 và còn phải thu = 0 (hoặc công nợ đã ghi).

---

## 14. SM-14 – Việc buồng phòng

| Từ → Đến | Sự kiện | Ai |
|---|---|---|
| [*] → `open` | SYS sinh (trả phòng, gia hạn, lịch dọn dài hạn BR-807, OC→OD, yêu cầu khách BR-811, bổ sung minibar) hoặc FD+ tạo tay | SYS, FD+ |
| `open` → `in_progress` | Bắt đầu dọn (R1) hoặc nhận việc | HK |
| `in_progress`/`open` → `done` | Dọn xong (R2/R3) hoặc tick xong; việc "Bổ sung minibar" → trừ kho (US-068) | HK, FD+ |
| `open` → `cancelled` | Khách từ chối dọn, khối OOO, đơn hủy | HK (khách từ chối – ghi lý do), FD+, SYS |

Thứ tự ưu tiên danh sách việc theo BR-807.

---

## 15. SM-15 – Yêu cầu từ app khách

| Từ → Đến | Sự kiện | Ai |
|---|---|---|
| [*] → `new` | Khách gửi (6 loại, BR-811) | GST |
| `new` → `acknowledged` | Bộ phận được định tuyến bấm "Đã nhận" – đo thời hạn phản hồi BR-811; ngoài giờ trực → SYS trả lời tự động | FD+, HK, MT theo loại; SYS |
| `acknowledged` → `in_progress` | Tạo việc HK (SM-14) / phiếu sửa (SM-04) / ghi chú lễ tân | SYS, người nhận |
| `in_progress` → `done` | Việc/phiếu liên kết `done`, hoặc lễ tân trả lời xong | SYS, FD+ |
| `new`/`acknowledged` → `declined` | Không thực hiện được, ghi lý do gửi khách | FD+ |

Khách thấy trạng thái theo nhãn thân thiện (VI/EN, RU từ R3): Đã gửi · Đã nhận · Đang xử lý · Hoàn thành · Không thực hiện được.

---

## 16. Câu hỏi gửi DOM/ARC (không cần INV)
| # | Câu hỏi | Đề xuất BA |
|---|---|---|
| SQ-1 | Có cho "Khôi phục no-show" (B12) không, ai được làm khi chỉ có người trực đêm? | Có, MGR+; người trực đêm vai FD gửi yêu cầu duyệt nhanh qua SM-10 |
| SQ-2 | Hạn BR-809 có tạm dừng khi phiếu `waiting_parts`? | Không dừng (khách vẫn chịu ảnh hưởng) |
| SQ-3 | FOC minibar trong hạn mức của FD: tự áp (A2) hay vẫn cần FDL duyệt? BR-432 ("không tự duyệt") và BR-433/BR-704 ("lễ tân FOC minibar trong hạn mức") đọc khác nhau | Tự áp, vẫn ghi nhật ký và tính vào cảnh báo BR-435 |
| SQ-4 | Hoa hồng `payable` gộp chi theo tháng? | Có, gộp theo tháng lịch |
| SQ-5 | ARC: lưu trạng thái buồng là bảng riêng có lịch sử (không suy ra từ đơn) – đúng BL 4.5 | Bảng riêng + bảng lịch sử chuyển |

## 17. Lịch sử thay đổi
| Ngày | Round | Thay đổi | Người |
|---|---|---|---|
| 15/10/2026 | 1 (đợt 2) | Bản đầu: 15 máy trạng thái, bảng chuyển có điều kiện + vai | BA |
