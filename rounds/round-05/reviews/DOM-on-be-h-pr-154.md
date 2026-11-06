# DOM review – BE-H PR #154 (`r5-h1c`, V5-30 bổ sung 1h): hoa hồng đi theo người chốt

- Người review: DOM | Round 5 (v1.0.5) – Review | Ngày: 07/11/2026
- Đối tượng: PR #154, nhánh `r5-h1c` @ **`279b5492`** (draft), gốc gộp với `main` @ `8598bb5a`. 12 tệp. Phần nghiệp vụ DOM đọc:
  - `reservations/internal/reservations.service.ts` (`update`), `reservations.controller.ts` (`access.denied` sau rollback), `money-bridge.ts` `closerChanged`;
  - `folio/public/folio.service.ts`: `syncCommissionOnly` (mới), `ensureCommission`, `tryEarnCommissions` (điều kiện 1H-04), `syncCommission` (lý do `void`);
  - `test/integration/v5-30-closer-change.test.ts` (18 ca, mới), `test/integration/v5-16-br438-checkout.test.ts` (ca DOM 110-03).
- Đối chiếu:
  - `DOM-on-contract-addendum-1h.md` (mục 1.3, 1.4, 1.5, thẻ 1H-01…1H-05); `DOM-on-be-h-prs-110-131.md` (thẻ 110-03, 131-01);
  - hợp đồng `contract-0.3.13.md` 1.29, 1.30 và mô tả `updateReservation` ở nhánh `r5-contract-1i` (#152);
  - BR-903 (3)–(5), BR-212, BR-525 (iii), BR-527, BR-008 (`product/docs/business-rules.md`);
  - sổ tay `02-le-tan.md` (bước tạo đơn, chọn **Người chốt**), `user-manual-v1.0.md` (tiền mặt sale/CTV thu hộ; "Hoa hồng theo đợt chi – v1.3").
- Cách đọc: `git worktree` tạm ở `279b5492` (đã gỡ sau khi đọc), đọc mã và test. DOM không chạy test. CI của PR trên đúng `279b5492` (run 42305592795): job "format · lint · audit · test · build" xanh; E2E còn chạy lúc DOM đọc.
- Không ghi tỷ lệ hay số tiền hoa hồng, thưởng. Ví dụ chỉ dùng `test_rate_short`. Giá 700.000/đêm là số ví dụ của BR-412. Không dữ liệu khách.

## 0. Kết luận

**DUYỆT** PR #154 @ `279b5492` về nghiệp vụ.

Ai hưởng, hưởng lúc nào, và bản ghi đã đạt của người chốt cũ đi đâu: cả ba đều đúng BR-903 (3)–(5), BR-527, BR-212 và các quyết định DOM ở review 1h. Không có lỗi tiền.

| Mức | Số thẻ | Thẻ |
|---|---|---|
| Blocker / Major | 0 | – |
| Minor | 3 | 154-02 ghim `recognized_at` = lúc sửa trong test (BE-H, nên làm luôn trong `r5-h1c`); 154-03 Desk không mời FD/FDL đổi người chốt sau khi đơn đã xác nhận (FE-A, UXD, ARC 0.3.14); 154-04 chỉnh câu sổ tay 1H-02 theo mã đã làm (BA, cùng tag có `r5-h1c`) |
| Suggestion | 2 | 154-01 bản ghi `earned` của người cũ khi `void` nên giữ ngày đạt; 154-05 mở rộng 1H-04 cho người chốt cũ chưa có bản ghi (v1.0.6) |

Không thẻ nào chặn gộp. Không ESC.

Đề xuất ORC đóng khi #154 gộp:
- FB-R5-DOM-BE-131-01 (Major): đủ 4 ý (mục 1.3, 1.5);
- FB-R5-DOM-ARC-1H-04 (Suggestion): làm đúng đề xuất, có ca K1, K2 (mục 1.1);
- FB-R5-DOM-BE-110-03 (Suggestion): làm đúng đề xuất (mục 1.2).

Trả lời câu ORC "FD/FDL đổi người chốt trước nhận phòng → 403 `CLOSER_CHANGE_BEFORE_CHECKIN` có đúng với quầy thật không": **đúng**, với một điều kiện ở phía Desk (mục 1.4, thẻ 154-03).

---

## 1. Từng điểm ORC hỏi

Ví dụ dùng chung:
- đơn sale căn 202, 2 đêm × 700.000 = 1.400.000 (cơ sở), tỷ lệ ghim `test_rate_short`;
- người chốt ghi trên đơn: sale A; người chốt đúng: sale B.

### 1.1 DOM 1H-04 – khoản người chốt cũ ghi mà chưa ai xác nhận: đúng

**Mã.** `tryEarnCommissions`, điều kiện thứ ba: khoản `pending`/`disputed` giữ hoa hồng khi người ghi là **bất kỳ người hưởng nào của đơn**, kể cả người có bản ghi đã `void` (`p.recorded_by IN (SELECT v.payee_user_id FROM commission v WHERE v.reservation_id = …)`). Đúng hướng DOM đề xuất và ARC đồng ý ở 1.30. Hai điều kiện kia (folio hết nợ; chuyển khoản ghi sau `folio.settled_at` đã đối soát) giữ nguyên.

**Hai ca test** (`DOM 1H-04: money the OLD closer recorded…`). Sale A ghi cọc ngày đến; khoản chờ quầy hoặc ngân hàng xác nhận (BR-527):

| Ca | Khoản A ghi | Lúc OWN sửa A → B | Tại B18 / lúc sửa | Ai xác nhận | Kết quả |
|---|---|---|---|---|---|
| K1 | Tiền mặt, A chưa nộp quầy | Khách đang ở (`closer_corrected`) | B18 thu đủ, nhưng tiền mặt của A còn chờ → B `projected` | Lễ tân bấm **Đã nhận tiền mặt** (`confirm-cash-handover`, `received`) | B `earned`, `recognized_at` = lúc lễ tân xác nhận |
| K2 | Chuyển khoản | Sau trả phòng | Tại B18, A còn là người hưởng, khoản của chính A còn chờ → A `projected` (luật cũ). OWN sửa → A `void`, B `projected` (luật mới) | MGR đối soát (`reconcile`, `reconciled`) | B `earned`, `recognized_at` = lúc đối soát |

Đúng nghiệp vụ:
- "Đạt" nghĩa là tiền đã về OTTIMO. Tiền mặt sale/CTV thu hộ chỉ là của OTTIMO khi đã nộp quầy và được xác nhận. Sổ tay ghi đúng câu này: "Hoa hồng thành 'đạt' sau khi khoản này được đối soát."
- Đổi người hưởng không làm tiền về sớm hơn. B phải chờ đúng khoản đó, như A đã phải chờ.
- K1 và K2 phủ hai lối vào của luật đạt: B18 sau lần sửa lúc đang ở, và lần sửa sau trả phòng. Đột biến H4a (chỉ khoản của người hưởng hiện tại), H4b (chỉ bản ghi chưa `void`) đều đỏ.
- A không bao giờ nộp tiền thì khoản bị đảo, folio còn nợ, B vẫn `projected`. Không ai được hưởng trên tiền OTTIMO chưa nhận.

**Giới hạn BE-H nêu (người chốt cũ chưa có bản ghi vì đơn đang `rate_missing` lúc đổi): chấp nhận cho v1.0.5.**
- Ca này cần đủ ba điều kiện: đơn xác nhận khi chưa có bảng tỷ lệ, có đổi người chốt, và người cũ còn tiền chờ xác nhận. Ở OTTIMO, bảng nội bộ đã nhập (giả định 3), nên chỉ còn các đơn xác nhận trước ngày nhập.
- Muốn phủ thì đọc `reservation_change`, không cần đọc audit (thẻ 154-05, v1.0.6).

### 1.2 DOM 110-03 – dòng trả muộn B15 `manual` trên folio đã chốt: đúng

Lượt thứ ba của `carryToCheckout`: Hạnh (FD) bỏ dòng B15 trên folio `settled`.
- Kết quả: 403 `FORBIDDEN_ACTION` theo A32, thân không có `requiredFlow`, số `access.denied` lý do `BR-438` không đổi, `version` và toàn bộ `lines` của folio không đổi.
- Khớp từng ý thẻ 110-03. Đột biến D-a (bỏ A32) và D-b (kiểm BR-438 trước A32) đều đỏ. Lễ tân sẽ không bao giờ thấy gợi ý "Gửi miễn có duyệt" trên folio đã chốt.

### 1.3 Luật 1h trên mã

| Luật (DOM 1h) | Mã `279b5492` | Test | Đúng |
|---|---|---|---|
| Sau nhận phòng chỉ OWN, lý do bắt buộc 3–500, kể cả ghi người chốt lần đầu | "Sau nhận phòng" = có `actual_checkin_at`, hoặc trạng thái `in_house`/`checked_out`. Vai khác OWN → 403 `CLOSER_CHANGE_AFTER_CHECKIN`, đúng một `access.denied` | (b): MGR (có và không có lý do), FDL, FD → 5 lần 403, 5 `access.denied`, đơn và hoa hồng không đổi. OWN thiếu lý do, lý do ngắn sau khi lọc ký tự điều khiển → `REASON_REQUIRED`; có số thẻ → `CARD_NUMBER_DETECTED`. T-30-3: khách không người chốt, MGR ghi sau nhận phòng → 403; OWN ghi có lý do → có hoa hồng | Có |
| Đơn `checked_out`: chỉ nhận người chốt + lý do; trường khác → 409, không ghi gì | `closerOnly`: mọi khóa của thân phải là `closerUserId` hoặc `closerChangeReason`. Kiểm ngay sau khi tải đơn và kiểm `version`, trước mọi lệnh ghi, nên cả giao dịch không ghi gì | 5 thân: `etaTime`; `adults`; người chốt + `adults`; người chốt + `internalNote`; cùng người chốt + lý do → 409 `INVALID_TRANSITION` (`currentState` = `checked_out`). Không đổi: người chốt, `adults`, `version`, hoa hồng, số dòng folio, audit `reservation.closer_changed` | Có |
| Người mới đạt theo luật B18 | `syncCommissionOnly`: tạo bản ghi người mới theo tỷ lệ ghim, rồi trên đơn `checked_out` gọi `tryEarnCommissions` (luật B18 đầy đủ, cả 1H-04) | X: thu đủ → B `earned`. K2: khoản của A còn chờ → B `projected` | Có |
| `recognized_at` = lúc sửa | `tryEarnCommissions` ghi `clock.now()` của lần sửa. `created_at` của bản ghi mới cũng là lúc sửa, nên màn danh sách hoa hồng (lọc theo `created_at`) đặt dòng của B vào cùng kỳ | X chỉ kiểm `recognized_at` khác rỗng, chưa kiểm đúng giờ sửa (thẻ 154-02). K1/K2 kiểm đúng giờ xác nhận | Mã đúng, test chưa ghim |
| Có bản ghi `payable`/`paid` → 409, không ghi gì | 409 `INVALID_TRANSITION` (`currentState`) trước mọi lệnh ghi hoa hồng | Y: đặt `payable` bằng SQL → 409; người chốt, hoa hồng, audit, `version` không đổi | Có (ở v1.0.5 không xảy ra, xem DOM 1h mục 1.1) |
| Gửi lý do mà không đổi người chốt → 422 `NOT_ALLOWED` | Có | 2 thân → 422, không ghi gì | Có |
| Lý do ở cột `reason` của audit, `after` chỉ có `closerUserId` | Có | (a), (b), T-30-3 đọc lại `audit_event` | Có |

Thẻ 131-01, đối chiếu từng ý:
- (1) đổi trước nhận phòng đồng bộ hoa hồng cùng giao dịch, tỷ lệ ghim: ca (a), rồi B18 của A ở ca lưới an toàn → A `void` (`closer_changed`), B `earned`;
- (2) sau nhận phòng chỉ OWN, có lý do: bảng trên;
- (3) đủ 5 ca test DOM liệt kê. Ca `rate_missing` (đơn R): MGR bị từ chối lúc đang ở → B18 chỉ tạo bản ghi cho người chốt **gốc**;
- (4) câu sổ tay tạm: thay bằng 1H-02 (thẻ 154-04).

Mã chỉ coi là "đổi" khi giá trị khác giá trị đang lưu. Vì vậy hộp sửa đơn của Desk gửi lại đúng người chốt cũ cùng giờ đến thì FD không bị 403.

### 1.4 FD/FDL đổi người chốt khi đơn đã xác nhận, chưa nhận phòng → 403 + `access.denied`: đúng với quầy thật

Cách quầy OTTIMO làm hôm nay:
- Lễ tân tạo đơn từ Zalo/điện thoại hoặc từ sale gửi qua. Nguồn **Sale nội bộ** thì chọn **Người chốt** ngay ở bước tạo (`02-le-tan.md`).
- Đơn qua Zalo thường đi theo thứ tự: giữ chỗ → khách chuyển cọc → xác nhận, cách nhau vài giờ tới vài ngày. Trong lúc giữ chỗ, FD vẫn sửa được người chốt (FD+). Phần lớn lỗi chọn nhầm tên được sửa ở bước này.

Vì sao chặn FD/FDL từ lúc xác nhận là đúng:
- **FD và FDL cũng là người chốt được.** `closerKind` nhận `front_desk`, `front_desk_lead` là người chốt nội bộ. Nếu FD đổi được sau khi đơn có cọc, FD có thể chuyển hoa hồng sang mình hoặc người quen. Đây đúng là lúc đơn bắt đầu có giá trị tiền.
- **Không gấp.** Trước nhận phòng, hoa hồng chỉ là `projected`, chưa ai được chi. Chọn nhầm tên không tốn gì nếu quản lý sửa trước ngày khách đến.
- **Một người phân xử.** Tranh chấp "khách này em giới thiệu" giữa sale, CTV và lễ tân là việc của quản lý (EP02 5.4), không phải của người đang đứng quầy.
- **`access.denied` có nghĩa** khi Desk không mời FD/FDL bấm. Hôm nay Desk chưa có chỗ nào sửa người chốt trên đơn đã tạo (`main`: chỉ `BookingDialog` lúc tạo). Hợp đồng 1.29 gạch FE-A mới nói về sau nhận phòng. Nếu FE-A sau này hiện nút cho FD ở đơn `confirmed`, mỗi lần lễ tân bấm thử là một dòng `access.denied`. Chủ đầu tư sẽ thấy "từ chối truy cập" của nhân viên làm đúng việc, và tín hiệu thật bị lẫn (thẻ 154-03).

Ca hiếm cần nói trong sổ tay:
- Sale gửi đơn Zalo, khách đến **ngay trong ngày**. Lễ tân tạo đơn có cọc (đơn `confirmed` ngay) và chọn nhầm sale. Khách nhận phòng trước khi quản lý kịp sửa.
- Từ lúc đó chỉ chủ đầu tư sửa được, có lý do. Tiền vẫn ra đúng người (mục 1.5), chỉ thêm việc cho chủ đầu tư. Không nới quyền cho ca này. Sổ tay lễ tân dặn "thấy nhầm thì báo quản lý ngay, trước giờ khách nhận phòng" (thẻ 154-04).

### 1.5 Kết quả tiền cho OTTIMO (10 căn)

Ví dụ chung, cơ sở 1.400.000, tỷ lệ ghim `test_rate_short` cho cả A và B:

| Lúc sửa | Ai sửa được | Bản ghi của A | Bản ghi của B | B đạt khi nào |
|---|---|---|---|---|
| Giữ chỗ | FD+ | chưa có | tạo lúc xác nhận (B2/B4) | như mọi đơn |
| Đã xác nhận, chưa đến | MGR+ | `projected` → `void` (`closer_changed`) | `projected`, cùng tỷ lệ, cùng cơ sở | B18 |
| Đang ở | Chỉ OWN, có lý do | `projected` → `void` (`closer_corrected`) | `projected` | B18 nếu đủ điều kiện; tiền A thu hộ còn chờ thì lúc lễ tân xác nhận (K1) |
| Đã trả phòng, thu đủ, không khoản chờ | Chỉ OWN, có lý do | `earned` → `void` (`closer_corrected`) | `earned` ngay | lúc sửa (đơn X) |
| Đã trả phòng, A còn khoản chờ đối soát | Chỉ OWN, có lý do | `void` | `projected` | lúc đối soát (K2) |
| Đã trả phòng, còn công nợ | Chỉ OWN, có lý do | `projected` → `void` | `projected` | lúc thu xong nợ (luật B18 như cũ, BR-525) |
| Có bản ghi `payable`/`paid` | Không ai | không đổi | – | 409, chủ đầu tư chỉnh lúc chi |

Ba ý về tiền:
- **Cơ sở của B tính lại lúc sửa** từ các đêm còn bán. Sau B16, cơ sở là các đêm còn giữ, không gồm phí trả sớm (đơn E, đột biến D1). Sau xóa nợ dòng tiền phòng, cơ sở là tiền phòng trừ phần xóa nợ (đơn W, ARC 131-03). Đúng BR-903: B hưởng trên tiền OTTIMO thật sự giữ.
- **Tỷ lệ không đổi khi đổi người cùng loại người hưởng** (tỷ lệ ghim, #131). Đổi giữa CTV và sale khi đơn không có ảnh chụp tỷ lệ vẫn là thẻ cũ 131-02 (v1.0.6). Bảng nội bộ hiện có một mức cho mọi người hưởng, nên ở OTTIMO hôm nay số không đổi.
- **Hoa hồng đã đạt của A:**
  - Trên Desk: `void`, lý do `closer_corrected`. Nhật ký tiền có `commission.voided` với `before` = `earned` và số tiền, nên chủ đầu tư thấy A đã từng đạt.
  - Ở v1.0.5 chưa có luồng chi. Chủ đầu tư đã chi cho A ngoài Desk thì vẫn sửa trên Desk, chi B ở kỳ kế, rồi trừ phần của A ở kỳ chi sau của A (BR-212, câu sổ tay 1H-02). Desk không tự trừ.
  - Mã xóa `recognized_at` của dòng A khi `void`. DOM 1h mục 1.4 đã nói dòng này giữ ngày cũ để tra; luồng hủy đơn (`voidCommissions`) cũng giữ (thẻ 154-01, không đổi kết quả tiền).

Hợp đồng thuê tháng không bị chạm: `syncCommissionOnly` chỉ đọc bản ghi theo `reservation_id`, đơn dài hạn không tạo bản ghi ngắn ngày. Câu phạm vi của 1H-02 vẫn đúng.

---

## 2. Thẻ feedback

### FB-R5-DOM-BE-154-01
- Mức độ: Suggestion (không đổi kết quả tiền; rẻ, nên làm cùng `r5-h1c`)
- Người sửa: BE-H
- Vị trí: `folio.service.ts` `syncCommissionOnly`, lệnh `UPDATE commission SET status = 'void', void_reason = $3, recognized_at = NULL …`; test `checked out: … sal2 earned` (đơn X), khối `recognized` cuối ca
- Vấn đề: dòng `earned` của người chốt cũ khi `void` bị xóa ngày đạt. Test ghim điều này (`{ status: 'void', recognized: false }`). Khác hai chỗ:
  - DOM 1h mục 1.4: "Bản ghi `void` của A giữ ngày cũ, chỉ để tra";
  - `voidCommissions` (hủy đơn) giữ `recognized_at` khi `void` một dòng `earned`.
- Vì sao quan trọng: ở v1.0.5 chủ đầu tư chi ngoài Desk. Muốn trừ phần đã chi cho A ở kỳ sau (BR-212) thì phải biết dòng của A đã đạt ở kỳ nào. `listCommissions` chỉ trả `recognizedAt` khi có; dòng `void` không ngày trông giống dòng chưa bao giờ đạt (ví dụ một lần đổi trước ngày đến). Hiện vẫn tra được qua sự kiện `commission.earned` cũ trong Nhật ký tiền, nhưng phải lục.
- Đề xuất sửa: bỏ `recognized_at = NULL` trong lệnh `void` của `syncCommissionOnly`. Đổi ca X: dòng `void` của A giữ đúng giờ B18. Không có báo cáo nào cộng theo `recognized_at` mà không lọc trạng thái (DOM tìm trong `src`: chỉ `commissions.service.ts` và `folio.service.ts` đọc cột này), nên giữ ngày không làm cộng trùng. Nếu ARC muốn giữ `NULL` thì ghi lý do ở 0.3.14; khi đó BA thêm câu "tra ngày đạt cũ ở Nhật ký tiền" vào sổ tay.
- Trạng thái: Open

### FB-R5-DOM-BE-154-02
- Mức độ: **Minor** (nên làm trong `r5-h1c` trước khi gộp, một dòng kiểm; không thì QA thêm ca theo 1i "QA viết ca theo kỳ")
- Người sửa: BE-H (hoặc QA)
- Vị trí: `v5-30-closer-change.test.ts`, ca `checked out: …` (đơn X), khối `recognized`
- Vấn đề: luật "`recognized_at` của bản ghi `earned` mới = lúc sửa" (DOM 1h mục 1.4, mô tả `updateReservation` 1i) là luật chọn kỳ chi. Ca X chỉ kiểm `recognized_at` khác rỗng. Đột biến "B lấy lại ngày đạt của A" (giờ B18) vẫn xanh: ở X, B18 lúc 11:00, OWN sửa lúc 12:00, cả hai đều khác rỗng. K1 và K2 kiểm đúng giờ, nhưng ở đó A chưa từng đạt nên không bắt được đột biến này.
- Vì sao quan trọng: B lấy ngày đạt cũ thì dòng của B rơi vào kỳ đã chốt. Ở v1.0.5, chủ đầu tư dễ sót khi chi. Ở v1.3, lần gộp ngày 1 của kỳ đó đã chạy, nên B không bao giờ vào danh sách chi (DOM 1h mục 1.4, bảng).
- Đề xuất sửa: trong ca X, kiểm `recognized_at` của dòng `earned` của B bằng đúng giờ OWN sửa (`2026-10-21T12:00:00+07:00`), như K1/K2 đang làm. Thêm đột biến "B kế thừa `recognized_at` của dòng cũ" vào bảng đột biến, phải đỏ.
- Trạng thái: Open

### FB-R5-DOM-BE-154-03
- Mức độ: **Minor** (trước khi FE-A làm chỗ sửa người chốt trên Desk; không đổi mã máy chủ)
- Người sửa: FE-A (Desk), UXD (câu chữ), ARC (một câu ở gạch FE-A của 1.29, hoặc 0.3.14)
- Vị trí: hợp đồng 1.29 gạch **FE-A** và mô tả `updateReservation` gạch "Desk (FE-A)"; Desk, khung đơn, ô **Người chốt**
- Vấn đề: hợp đồng chỉ nói "MGR/FDL/FD không có nút đổi người chốt sau nhận phòng". Chưa nói FD/FDL ở đơn đã xác nhận, chưa nhận phòng, dù máy chủ trả 403 kèm `access.denied` (`CLOSER_CHANGE_BEFORE_CHECKIN`).
- Vì sao quan trọng:
  - Desk mà hiện nút cho FD ở đơn `confirmed` thì lễ tân làm đúng việc vẫn sinh `access.denied`. Chủ đầu tư thấy "từ chối truy cập" của nhân viên quầy, và lần thử thật bị lẫn.
  - Lễ tân thấy nút mà bấm bị từ chối thì báo lỗi, không biết phải nhờ ai.
- Đề xuất sửa:
  - Ô **Người chốt** sửa được theo mốc, đúng bảng 1.29:
    - giữ chỗ: FD+;
    - đã xác nhận, chưa nhận phòng: MGR+, ô lý do không bắt buộc (DOM 1H-05);
    - sau nhận phòng: chỉ OWN, ô lý do bắt buộc.
  - Vai không sửa được thì thấy tên người chốt ở dạng chỉ đọc, kèm một dòng nhỏ. UXD chốt chữ, ví dụ: "Cần đổi người chốt? Báo quản lý (trước khi khách nhận phòng) hoặc chủ đầu tư (sau đó)."
  - Thân PATCH chỉ có `closerUserId` khi người dùng đổi ô này. Đơn `checked_out` chỉ gửi hai trường (BE 1H-01).
- Trạng thái: Open

### FB-R5-DOM-BE-154-04
- Mức độ: **Minor** (cùng tag có `r5-h1c`; sửa thêm vào thẻ FB-R5-DOM-ARC-1H-02)
- Người sửa: BA (`02-le-tan.md`, `01-chu-dau-tu-quan-ly.md`, `user-manual-v1.0.md`); UXD rà chữ
- Vị trí:
  - `02-le-tan.md`, bước tạo đơn, dòng "**Sale nội bộ** (chọn **Người chốt**)";
  - `01-chu-dau-tu-quan-ly.md`, các câu đề xuất ở 1H-02 (mục chi hoa hồng)
- Vấn đề: câu 1H-02 viết trước khi có mã. Ba chỗ cần khớp `279b5492`:
  - (a) Sổ tay lễ tân chưa nói lễ tân chỉ sửa người chốt khi đơn còn là giữ chỗ.
  - (b) Câu tạm "Trước khi sửa, mở **Nhật ký tiền → Chờ đối soát** … (tới khi có 1H-04)" không còn cần khi tag có `r5-h1c`: Desk tự giữ hoa hồng của người mới (mục 1.1).
  - (c) Câu "Dòng của người mới mang ngày sửa" chưa đủ: còn khoản chờ thì dòng của người mới mang ngày xác nhận khoản đó (K1, K2).
- Vì sao quan trọng: lễ tân chọn nhầm tên mà không biết đường sửa thì để nguyên, hoặc báo muộn sau khi khách đã nhận phòng (lúc đó chỉ chủ đầu tư sửa được). Chủ đầu tư làm thừa một bước, hoặc tìm dòng của người mới ở sai kỳ.
- Đề xuất sửa (câu nội bộ, không số):
  - (a) `02-le-tan.md`, sau dòng chọn **Người chốt**: "Chọn nhầm người chốt: sửa được khi đơn còn là giữ chỗ. Đơn đã xác nhận thì báo quản lý ngay, trước giờ khách nhận phòng. Khách đã nhận phòng thì chỉ chủ đầu tư sửa."
  - (b) `01`: bỏ câu "Trước khi sửa, mở Nhật ký tiền → Chờ đối soát…" nếu tag có `r5-h1c`. Thay bằng: "Người chốt cũ còn khoản tiền mặt hoặc chuyển khoản chưa đối soát thì hoa hồng của người mới chờ tới khi khoản đó được xác nhận." Tag không có `r5-h1c` thì giữ câu cũ.
  - (c) `01`, thay "mang ngày sửa" bằng: "Dòng của người mới mang ngày đạt: ngày anh/chị sửa, hoặc ngày khoản còn chờ được xác nhận. Dòng đó vào kỳ chi kế tiếp."
- Trạng thái: Open

### FB-R5-DOM-BE-154-05
- Mức độ: Suggestion (v1.0.6; v1.0.5 chấp nhận giới hạn BE-H đã nêu)
- Người sửa: BE-H; QA thêm ca
- Vị trí: `folio.service.ts` `tryEarnCommissions`, điều kiện "người hưởng của đơn" (`SELECT v.payee_user_id FROM commission v …`)
- Vấn đề: người chốt cũ chưa từng có bản ghi hoa hồng thì khoản họ ghi còn chờ không giữ hoa hồng của người mới. Ví dụ: đơn xác nhận khi chưa có bảng tỷ lệ, CTV A thu tiền mặt chưa nộp, quản lý đổi sang sale B trước ngày đến. Sau đó bảng được nhập, B18 tạo bản ghi cho B và B `earned` ngay.
- Vì sao quan trọng: cùng lý do 1H-04 (BR-527). Ở OTTIMO rất hiếm (mục 1.1).
- Đề xuất sửa: tập "người hưởng" thêm các người chốt cũ lấy từ `reservation_change` (`field = 'closer_user_id'`, `old_value` khác rỗng) của đơn. Bảng này có từ đầu, giữ cả giá trị cũ. Không cần đọc audit `reservation.closer_changed` (trên production trước `r5-h1c` audit đó rỗng `before`/`after`). Không migration. Ca QA: như K1, nhưng đơn `rate_missing` lúc đổi.
- Trạng thái: Open

---

## 3. Điểm làm tốt

- 1H-04 làm đúng hướng, có hai ca phủ cả hai lối vào của luật đạt (B18 sau lần sửa lúc đang ở; lần sửa sau trả phòng). Test kiểm `recognized_at` đúng giờ lễ tân/quản lý xác nhận, không chỉ kiểm trạng thái.
- Đơn `checked_out` từ chối mọi trường khác người chốt **trước** mọi lệnh ghi. Test đọc lại người chốt, số khách, phiên bản, hoa hồng, dòng folio và audit cho cả 5 thân lệnh.
- BE-H tự nêu giới hạn của 1H-04 (`rate_missing`) và đề xuất hạn, thay vì để DOM tự tìm. Ca lưới an toàn và ca "legacy" (đơn đã lệch từ trước, OWN đặt lại đúng người) đều không tạo dòng thứ hai.

## 4. Giả định DOM dùng

1. DOM đọc mã và test ở `279b5492` trong worktree tạm (đã gỡ), không chạy test. Kết quả xanh lấy từ CI run 42305592795 trên đúng SHA và từ mô tả PR (30 đột biến đỏ).
2. "Desk chưa có chỗ sửa người chốt trên đơn đã tạo": DOM tìm `closerUserId` trong `product/apps/admin-web/src` trên `main` @ `92635b39`. Chỉ `BookingDialog` (tạo đơn) và mock có. Các lời gọi `updateReservation` của Desk (`CheckInPage`, `StayDialogs`) không gửi người chốt.
3. "Bảng nội bộ đã nhập, một mức cho mọi người hưởng": theo DOM `DOM-on-be-h-prs-110-131.md` mục 5 giả định 4. DOM không đọc dữ liệu production.
4. FD/FDL là người chốt được: theo `closerKind` (`reservations.service.ts`), danh sách vai nhận làm người chốt nội bộ có `front_desk`, `front_desk_lead`.
5. Mọi điểm ở đây là luật đã có (BR-903, BR-212, BR-525, BR-527, EP02 5.4) hoặc quyết định DOM ở review 1h. Không có chính sách mới, nên không ESC.

## 5. Dòng đề xuất ghi `decision-log.md` (ORC ghi)

`| 2026-11-07 | 5 | **DOM – review BE-H PR #154 (r5-h1c, V5-30 bổ sung 1h) @ 279b5492: DUYỆT về nghiệp vụ.** Hoa hồng đi theo người chốt trong cùng giao dịch: trước nhận phòng MGR+ (người cũ void closer_changed, người mới projected cùng tỷ lệ ghim); sau nhận phòng chỉ OWN có lý do 3–500, kể cả ghi lần đầu (MGR/FDL/FD 403 + đúng một access.denied); đơn checked_out chỉ nhận người chốt + lý do, trường khác 409 trước mọi lệnh ghi; người mới đạt theo luật B18, cơ sở tính lại theo đêm còn bán (không phí trả sớm, trừ phần xóa nợ); dòng earned của người cũ void closer_corrected, đã chi ngoài Desk thì trừ ở kỳ sau (BR-212); payable/paid 409. DOM 1H-04 đúng: khoản người chốt cũ ghi còn chờ (K1 tiền mặt chưa nộp → lễ tân xác nhận; K2 chuyển khoản → MGR đối soát) giữ người mới ở projected, earned lúc xác nhận. DOM 110-03 đúng (A32 trước BR-438 trên folio settled). FD/FDL 403 trước nhận phòng đúng với quầy (FD/FDL cũng là người chốt được, trước nhận phòng không gấp, quản lý phân xử), với điều kiện Desk không hiện nút cho họ (154-03). Đóng 131-01, 1H-04, 110-03 khi gộp. Thẻ: 154-02 Minor ghim recognized_at = lúc sửa trong test X; 154-03 Minor Desk theo mốc + dòng chỉ đọc cho FD/FDL; 154-04 Minor sổ tay lễ tân + chỉnh câu 1H-02; 154-01 Suggestion giữ ngày đạt trên dòng void của người cũ; 154-05 Suggestion v1.0.6 người chốt cũ chưa có bản ghi (đọc reservation_change). Không ESC, không số hoa hồng | DOM | rounds/round-05/reviews/DOM-on-be-h-pr-154.md |`
