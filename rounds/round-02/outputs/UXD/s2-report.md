# UXD – Round 2, Sprint 2: hi-fi cho Sprint 4 (H19–H24) + DS v0.3.3

- Người viết: UXD | Bước 2 (Sản xuất) – Sprint 2 (UXD đi trước dev một sprint) | Ngày: 16/10/2026
- Việc giao: plan R2 mục 4 dòng Sprint 4 (EP07/EP08 PWA buồng phòng + phiếu sửa, EP14 thông tin lưu trú + yêu cầu khách, EP01 Tổng quan + "Cần chú ý" + SSE) + DS v0.3.3 (FB-R2-UXD-FE-15) + H04 thêm `bedCount`/`areaM2`.
- Đầu vào: plan R2, backlog (US-010/011/012, 052–058, 061/062, 106–112), OpenAPI **0.3.4-draft**, business-rules v0.3.1 (BR-506, 801–812, 904, 907), ADR-005, architecture mục 12 (SSE), SEC `w1-review.md` mục 4 (ĐK-1…6) + `s1-decisions.md` (chuỗi cấm ĐK-6), DS-0 (`tests/fixtures/seed/ds-0.json`), wireframe R1 L6/L7/L8, review `UXD-on-FE.md` (FE-13, FE-15) + `FE-responses.md` (Q6), DS v0.3.2.

## 1. Đã làm gì

### 1.1 Hi-fi `product/design/hifi/` – 6 màn mới + sửa H04
| Mã | Màn | Story / AC chính | operationId chính (0.3.4) |
|---|---|---|---|
| H19 | PWA buồng phòng – việc hôm nay theo căn (nhóm Làm trước / Khách đang ở / Sau trả phòng / Đã xong, thứ tự BR-807 do server), các căn + bộ lọc (Cần dọn = VD/OD/CL), **bộ đồ dùng thêm BR-812** (chuẩn bị · thu hồi · chuyển căn · sắp đến giờ mà chưa chuẩn bị) | US-052, 053 AC2, 054, 056, 110 AC3 | listHkTasks, listRoomStatuses, transitionHkTask, streamEvents |
| H20 | PWA buồng phòng – dọn căn → Dọn xong, **hoàn tác 10 giây (gửi trễ)**, kiểm phòng 12 điểm + điểm bộ đồ dùng thêm + ảnh (nút Kiểm đạt chỉ mở khi đủ), chưa đạt, tự kiểm khi bật, minibar chỉ số lượng (stepper 56px), khách không muốn dọn (lý do bắt buộc) | US-053 AC1–4, 055, 054 AC3, 058 | transitionRoomStatus, getInspectionChecklist, uploadAttachment, recordInspection, getMinibarStandard, recordMinibarCheck (stayover), transitionHkTask |
| H21 | PWA buồng phòng – báo sự cố (chip loại → gợi ý mức, mô tả, ảnh, **Gấp / Trong ngày / Không gấp**, "đề nghị khóa căn"), gửi khi có/mất mạng, **hàng đợi "Đang chờ gửi (n)" + "Cần xem lại"**, đăng nhập lại khi còn hàng đợi | US-057 AC1–2, US-058, BR-809, ADR-005 | uploadAttachment, createWorkOrder (+ mọi lệnh ghi qua hàng đợi) |
| H22 | PWA bảo trì – danh sách phiếu theo mức + hạn bằng câu, chi tiết + nhật ký, Nhận việc, **Chờ vật tư** (ngày dự kiến, dừng hạn), **Sửa xong + ảnh bằng chứng** → mở khóa / "Cần dọn" / việc dọn sau sửa (trạng thái trung thực), tạo phiếu + khóa phòng (2 ngày rõ ràng, đơn trùng, căn có khách) | US-061 AC1–4, 062 AC1–3, 057 AC2, 110 AC1 | listWorkOrders, getWorkOrder, transitionWorkOrder, updateWorkOrder, uploadAttachment, createWorkOrder, createRoomBlock |
| H23 | guest-web mức 1 – tab Yêu cầu (trạng thái SM-15, lý do từ chối, trả lời tự động ngoài giờ), gửi yêu cầu 6 loại (**dọn phòng thêm 100.000 đ/lần – tick đồng ý phí mới gửi**), tab Thông tin (Wi-Fi từ ngày nhận, giờ, chỉ đường, nội quy + phí phạt, liên hệ) | US-108 AC1–2 (trừ mã cửa), 109, 110 AC2, 112 | listMyRequests, createGuestRequest, getGuestStay, setGuestLocale |
| H24 | Tổng quan chủ đầu tư trên điện thoại – Cần duyệt → Cần chú ý → KPI đêm nay (6/9 = 67%), **SSE**: Trực tiếp / Đang kết nối lại / Ngoại tuyến (luôn có chữ), mô phỏng mục mới (aria-live đọc 1 câu), theo vai, **câu cho đủ 19 `AttentionItem.kind`** | US-010 AC1–3, 011, 012 AC1/3/4, 007 (link H17) | getTonightKpi, listAttentionItems, resolveAttentionEvent, listApprovalRequests, streamEvents |
| H04 (sửa) | Danh mục căn: cột + ô **Số giường** (`bedCount`, stepper 1–10) và **Diện tích** (`areaM2`, tùy chọn, m²); hàng đang sửa dùng `tr.is-editing` (FE-13); bỏ hết style nội tuyến | US-004; ARC Q6 | listRooms, updateRoom, createRoom |

Mỗi màn: khung đặc tả Story/AC · operationId · Problem.code · hành vi/a11y; khung chính có đủ **5 trạng thái** (bình thường / tải / rỗng / lỗi / mất mạng) trên thanh công cụ; sáng/tối qua token; VI/EN. `index.html` thêm 6 dòng + dữ liệu mẫu ngoài DS-0.

### 1.2 Quyết định UX trong quyền UXD (ORC ghi decision-log khi commit)
1. **Hoàn tác 10 giây = gửi trễ 10 giây**: lệnh ghi của PWA (đổi trạng thái buồng, xong việc, kiểm phòng, đếm minibar) nằm 10 giây trong hàng đợi trên máy rồi mới gửi; Hoàn tác = xóa khỏi hàng đợi, **không cần API đảo** (SM-03 không có CL → VD). `performedAt` = giờ bấm. Không áp cho tạo phiếu sự cố, tiền, tồn phòng.
2. Mức phiếu sửa hiển thị **Gấp / Trong ngày / Không gấp** (EN Urgent / Today / Not urgent) = `high/medium/low`; hạn kế tiếp viết thành câu.
3. Lỗi tải ở PWA: nút **Gọi lễ tân** thay "Gửi lỗi cho lễ tân" của wireframe L6 (không có API).
4. Đóng phiếu có khóa phòng và tạo phiếu có khóa **không xếp hàng offline** (ảnh hưởng tồn phòng – ADR-005).
5. Yêu cầu khách có phí: phải tick "Tôi đồng ý phí …" mới gửi (DS 6.3).
6. guest-web R2 dùng `gw.req.fee_notice` thay `guest.req.fee_notice` (chuỗi cũ có chữ "hóa đơn/bill" – SEC ĐK-6).

### 1.3 Design System v0.3.3 + chuỗi
- `design-system.md` v0.3.3: **mục 4.1** bảng ánh xạ 20 mẫu style nội tuyến của admin-web → lớp tiện ích (FE-15); mẫu **6.18** PWA buồng phòng/bảo trì, **6.19** yêu cầu khách có phí, **6.20** Tổng quan + SSE; lịch sử.
- `hifi.css`: mục 13 lớp tiện ích (`.caption`, `.fieldset-plain`, `.card.inset`, `.hr.tight`, `.menu-head`, `.rowlink.static`, `.contents`, `.alert.flush/.tight`, `.input.square`, `.maxw-sm`, `.search.wide`, `.row.tight`, `.self-end`, `.brand.flush`, `.list-plain`, `.mt-*/.mb-*`, `.sk.h-*`…), `[hidden]{display:none !important}` toàn cục, `tr.is-editing`; mục 14 mật độ `.hk` + `.hk-card`, `.filters`, `.qpill`, `.toast-dock`, `.photo-row`, `.tl`, `.req-grid/.req-tile/.req-card`, `.live`, `.kpis.two` – chỉ token/lưới 4px.
- `hifi.js`: `[data-countdown]` toast hoàn tác đếm lùi, `[data-filter]`, `[data-checklist]`, `[data-unhide]` (mô phỏng SSE).
- **303 chuỗi VI/EN mới** (nhóm "R2 hi-fi Sprint 4" + H04) → tổng **1888 chuỗi + 8 mẫu tin**; sửa `hk.task.extra_kit_items` ("1 1 mền"); ghi chú cấm dùng `guest.req.fee_notice` ở guest-web R2. `content-guide.md`: thuật ngữ 3.3 (mức phiếu, hàng đợi, Trực tiếp), mục 8 sinh lại, lịch sử 0.3.4.

## 2. Kiểm tra
| Kiểm | Kết quả |
|---|---|
| `python3 product/design/tools/check_hifi.py` | 25/25 trang ✓ (24 màn + index), 0 lỗi cú pháp/tham chiếu, mọi key có VI + EN, chữ HTML khớp chuỗi VI |
| `python3 product/design/tools/gen_tokens.py` | `fails: 0` |
| `python3 product/design/tools/gen_strings.py` | 1888 chuỗi + 8 mẫu, 0 key trùng |
| Trình duyệt (server tĩnh cục bộ) | H04, H19–H24 đổi EN: 0 chuỗi dự phòng, 0 `{tham số}` sót, 0 lỗi JS, 0 khung điện thoại tràn ngang; toast hoàn tác đếm 10 → 0 (VI/EN); bộ lọc căn/phiếu, checklist mở nút, mô phỏng SSE + aria-live chạy; mật độ HK: 0 điều khiển < 48px, 0 chữ < 16px trong khung PWA (sau khi sửa ảnh/amenity/consequence); sáng/tối xem H20, H24 |
| Quét chuỗi guest-web H23 | 0 chữ "mã cửa / door code / OTP / hóa đơn / bill / invoice / folio" (SEC ĐK-6) |
| Chưa làm | VoiceOver/TalkBack, phóng chữ 200%, mô phỏng mù màu – UXR test R2 và review UXD-on-MOB |

## 3. Giả định (dùng nhãn trong hi-fi)
1. Kiểm phòng **chưa đạt** → căn `VC → VD` + việc dọn lại `[GIẢ ĐỊNH UXD – chờ BA chốt SM-03]`.
2. Sửa xong phiếu **bắt buộc ≥ 1 ảnh sau sửa** + ghi kết quả `[GIẢ ĐỊNH UXD – chờ PO/DOM]`.
3. Phí dọn thêm trên guest-web lấy từ cấu hình build (100.000) cho tới khi có API phí `[GIẢ ĐỊNH UXD]`.
4. Nhãn checklist kiểm phòng EN lấy từ chuỗi `hk.insp.i01…i12` khi server chỉ trả một ngôn ngữ.
5. Dữ liệu minh họa ngoài DS-0: WO-00005 căn 101 (khách báo, nâng Gấp), thu hồi bộ 202, chuyển bộ 402 → 301, yêu cầu của Anna (103), diện tích các căn ở H04, Wi-Fi, nội quy.

## 4. Rủi ro / vướng mắc – đề nghị vai khác (sẽ ghi thẻ ở bước review)
| # | Vấn đề | Gửi | Đề xuất |
|---|---|---|---|
| 1 | Không có trường **ngày dự kiến có vật tư** → server không dừng hạn được (BR-809); DS-0 đã có `partsExpectedDate` | ARC | `partsExpectedDate` ở body `wait-parts` + `WorkOrder` |
| 2 | Buồng phòng chỉ được **đề nghị** khóa (US-057 AC2, A86) nhưng hợp đồng chỉ có `block` (tạo khối thật) | ARC | `WorkOrderCreate.blockRequested` + `WorkOrder.blockRequested` |
| 3 | Bảo trì không có nguồn **nhật ký phiếu** (listAuditEvents không cho MT) | ARC | `WorkOrder.history[]` {at, actorName, event, from, to} – không tên khách |
| 4 | `createWorkOrder` 409 chưa ghi mã: đơn tương lai trùng vs căn đang có khách (US-061 AC2/AC3) | ARC | `ROOM_UNAVAILABLE` + `conflicts[]`; mã mới `ROOM_OCCUPIED` |
| 5 | `block.endDatePlanned` – ngày xong hay ngày mở bán lại? (BR-804 đề nghị `reopenDatePlanned`) | ARC | Chốt ngữ nghĩa; UI hiện cả hai ngày |
| 6 | Thiếu ảnh sau sửa chưa có lỗi server | ARC/BE | `VALIDATION_FAILED` mã trường `EVIDENCE_REQUIRED` cho `done` (theo giả định 2) |
| 7 | `getInspectionChecklist` nhãn một ngôn ngữ → PWA EN thiếu chữ | ARC | Nhãn theo `Accept-Language` hoặc `labelEn` |
| 8 | Phí yêu cầu khách không có trong hợp đồng; ĐK-2 cấm thêm trường guest khi chưa qua SEC | ARC + SEC | `GET /v1/guest/request-options` [{type, feeVnd, available}] + `createGuestRequest.feeAccepted` |
| 9 | Hoàn tác = gửi trễ | ARC/MOB | Ghi vào ADR-005 mục 3; lễ tân thấy thay đổi chậm ≤ 10 giây |
| 10 | Số tiền trong tham số chuỗi (vd "100.000 đ") cần định dạng theo ngôn ngữ | MOB/FE | Dùng `common.currency_vnd` / Intl theo locale khi điền `{amount}` |

**Không có ESC mới** (mọi việc trong quyền UXD hoặc chuyển vai khác).

## 5. File tạo / sửa
- Mới: `product/design/hifi/19-hk-tasks.html`, `20-hk-clean-inspect.html`, `21-hk-incident-queue.html`, `22-maintenance.html`, `23-guest-requests.html`, `24-owner-overview.html`
- Sửa: `product/design/hifi/04-rooms.html`, `hifi/index.html`, `hifi/assets/hifi.css`, `hifi/assets/hifi.js`, `product/design/design-system.md`, `product/design/content-guide.md`, `product/design/tools/gen_strings.py`, `tools/strings-tables.md`, `copy/strings-{vi,en,ru}.json`, `wireframes/assets/strings.js`, `wireframes/assets/tokens.css` (sinh lại, không đổi giá trị)

## 6. Việc chưa xong
- Hi-fi cũ (H01–H03, H05–H18) còn style nội tuyến – đổi dần sang lớp mục 4.1 khi chạm tới (H08 giữ vị trí lưới động).
- Màn Desk cho yêu cầu khách / phiếu sửa ở máy quầy dùng lại H03 (Hôm nay) + component H22; chưa vẽ riêng.
- Trả phòng sớm (US-137 – Should) chưa có hi-fi.
- Kiểm VoiceOver / phóng chữ 200% / mù màu trên bản build (UXD-on-MOB, UXD-on-FE Sprint 4).
