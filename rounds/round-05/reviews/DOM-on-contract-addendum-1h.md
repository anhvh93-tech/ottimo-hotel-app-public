# DOM review – hợp đồng 0.3.13 bổ sung 1h: đổi người chốt (ARC, PR #147)

- Người review: DOM | Round 5 (v1.0.5) – Review | Ngày: 07/11/2026
- Đối tượng: PR #147, nhánh `r5-contract-1h` @ **`0943db43`** (chỉ tài liệu, xếp trên #132). Phần 1h là commit `b5fe802f`:
  - `openapi.yaml`: mô tả `updateReservation`, trường `ReservationPatch.closerChangeReason`, phản hồi 403/409, dòng `REASON_REQUIRED` ở bảng mã;
  - `rounds/round-05/outputs/ARC/contract-0.3.13.md` mục 1.29.
- Đối chiếu:
  - BR-903 (3), (4), (5), BR-212 (lịch chi gộp; "bản ghi bị điều chỉnh sau khi đã chi → trừ vào kỳ chi sau"), BR-525 (iii), BR-527, BR-008 (`product/docs/business-rules.md`);
  - `rounds/round-05/outputs/DOM/rules-v1.0.5.md` mục 4.2 ý 3, 4.3; thẻ DOM FB-R5-DOM-BE-131-01 (`DOM-on-be-h-prs-110-131.md`); ARC `ARC-on-be-h-prs-110-123-131.md` mục 4.2;
  - BE-H `BE-on-contract-0313-addendum-1h.md` (xác nhận theo nhánh `r5-h1c` @ `aa63f67d`, chưa đẩy);
  - mã trên `main` @ `12346216`: `folio.service.ts` `tryEarnCommissions`, `syncCommission`; `sales/internal/commissions.service.ts`; `reservations.service.ts` PATCH; `user-manual-v1.0.md` dòng "Hoa hồng theo đợt chi – v1.3";
  - plan `rounds/round-05/plan.md` mục 4a T19, quyết định 31.
- DOM đọc tài liệu và mã bằng `git show` ở đúng SHA trên, không chạy test.
- Không ghi tỷ lệ hay số tiền hoa hồng, thưởng. Ví dụ chỉ dùng `test_rate_short`. Giá 700.000 là số ví dụ của BR-412. Không dữ liệu khách.

## 0. Kết luận

**DUYỆT** PR #147 @ `0943db43` về nghiệp vụ.

Luật theo mốc, đồng bộ hoa hồng cùng giao dịch, `void` kèm bản ghi mới, mốc "đạt" theo B18 đều đúng BR-903 (3)–(5). 409 khi hoa hồng đã `payable`/`paid` cũng đúng. Đây là lưới chặn cho bản sau: ở v1.0.5 không có đường nào đưa bản ghi tới hai trạng thái đó (mục 1.1).

| Mức | Số thẻ | Thẻ |
|---|---|---|
| Blocker / Major | 0 | – |
| Minor | 3 | 1H-01 truy vấn OPS (trước khi `r5-h1c` lên production, trước kỳ chi đầu sau đó); 1H-02 sổ tay + release notes (cùng tag có `r5-h1c`); 1H-03 luật đích cho `payable`/`paid` khi có luồng chi (v1.3, US-089) |
| Suggestion | 2 | 1H-04 khoản thu của người chốt cũ chưa đối soát; 1H-05 ô lý do tùy chọn cho MGR trước nhận phòng |

Không thẻ nào chặn gộp #147. Không ESC.

Trả lời hai câu ORC gửi thêm:
1. `recognized_at` của bản ghi `earned` của người mới = **lúc OWN sửa**, không lấy giờ B18 cũ (mục 1.4).
2. Bản ghi mới "đạt" theo luật B18 và nằm `projected` khi folio còn nợ hoặc người hưởng mới còn khoản thu chưa đối soát: **đúng** (mục 1.3). DOM thêm một ý ở thẻ 1H-04 (Suggestion).

Đồng ý hai thẻ Suggestion của BE-H (FB-R5-BE-ARC-1H-01, 1H-02), xem mục 2.

---

## 1. Từng câu ORC hỏi

Ví dụ dùng chung cho mục này:
- đơn sale căn 202, 2 đêm × 700.000 = 1.400.000 (cơ sở), tỷ lệ ghim `test_rate_short`;
- người chốt ghi lúc tạo đơn: CTV A; người chốt đúng: sale B (ghi nhầm khi chọn tên);
- B18 ngày 28/11, thu đủ ở quầy.

### 1.1 409 khi đã `payable`/`paid` – đúng, nhưng ở v1.0.5 không bao giờ xảy ra

**Trên mã hiện nay không có đường tới `payable` hay `paid`.**
- Không chỗ nào trong `services/api/src` chuyển bản ghi sang hai trạng thái này. `commissions.service.ts` ghi rõ: đợt chi thuộc US-089 (v1.3).
- `user-manual-v1.0.md` bảng "Chưa có": "Hoa hồng theo đợt chi – v1.3 – chủ đầu tư chi như hiện nay". Nghĩa là chủ đầu tư xem màn **Hoa hồng** rồi chi ngoài Desk.
- Hệ quả: hoa hồng đã chi cho A ngoài Desk vẫn là `earned` trên Desk. Nhánh 409 không chặn được ca này. 1h cho OWN sửa (A `void` `closer_corrected`, B `earned`). Đó là cách đúng (mục 1.4). Phần tiền đã chi nhầm cho A thì chủ đầu tư trừ ở kỳ chi sau, theo BR-212. Sổ tay phải nói câu này (thẻ 1H-02).

**409 vẫn là lưới chặn đúng cho v1.3**, khi có luồng chi:
- `paid`: không sửa bản ghi đã chi (BR-008). Điều chỉnh sau khi đã chi thì trừ vào kỳ sau (BR-212). Tới khi luồng chi có dòng trừ, 409 "không ghi gì" là cách an toàn duy nhất: không chi hai lần, không sửa lặng lẽ.
- `payable`: thực tế ở boutique stay, nhầm người hưởng hay lộ ra đúng lúc rà danh sách chi. Sale hoặc CTV xem phần của mình rồi hỏi "đơn 202 của em đâu". Lúc đó chưa chuyển tiền, sửa là rẻ nhất. 409 ở `payable` ép chủ đầu tư làm tay đúng lúc dễ sửa nhất. Ở v1.0.5 chấp nhận vì không xảy ra. Luật đích cho v1.3 ở thẻ 1H-03:
  - `payable` → OWN sửa được, bản ghi của B vào **cùng** kỳ chi;
  - `paid` → bản ghi của A giữ nguyên, có dòng trừ cho A ở kỳ sau, B có bản ghi mới.

Trả lời câu "OWN làm gì khi hoa hồng đã chi cho nhầm người":
- **v1.0.5**: sửa người chốt trên Desk như 1h. Chi B theo dòng mới ở kỳ chi kế. Trừ tay phần đã chi cho A ở kỳ sau (BR-212). Ghi vào sổ chi của chủ đầu tư.
- **v1.3**: làm trong luồng chi (thẻ 1H-03), không làm tay.

### 1.2 `void` + bản ghi mới cho cả `closer_changed` và `closer_corrected` – đúng

- Đúng BR-008: không sửa số trên bản ghi cũ. Mỗi lần đổi người hưởng để lại một dòng `void` có lý do và một dòng mới. Ai đã từng là người hưởng, đổi lúc nào, đều tra lại được.
- Hai lý do tách đúng hai việc khác nhau về kiểm soát:
  - `closer_changed`: giao lại khách giữa các sale trước ngày đến (sale nghỉ phép, chuyển ca), hay chọn nhầm tên khi tạo đơn. Việc thường ngày của quản lý (EP02 5.4).
  - `closer_corrected`: chủ đầu tư sửa nhầm sau nhận phòng (BR-903 (3)). Đây là ngoại lệ chủ đầu tư và DATA cần đếm riêng. Báo cáo sau này lọc được theo lý do này.
- Ví dụ (trước nhận phòng): 20/11 quản lý đổi A → B. A `void` (`closer_changed`). B `projected` = `test_rate_short` × 1.400.000. Tỷ lệ không đổi vì là tỷ lệ ghim của đơn (#131).
- Lưới an toàn `ensureCommission` dùng `closer_changed` khi sửa các đơn đổi người trước khi bản sửa lên. Chấp nhận, trừ các đơn quản lý đổi **sau** nhận phòng (thẻ 1H-01 ý 3).
- Ngoài phạm vi 1h, đã có thẻ: đổi giữa CTV và sale mà đơn không có ảnh chụp tỷ lệ thì tỷ lệ đọc theo bảng ngày đồng bộ, không theo ngày tạo đơn (FB-R5-DOM-BE-131-02, v1.0.6). Bảng nội bộ hiện có một mức cho mọi người hưởng, nên ở OTTIMO hôm nay số không đổi.

### 1.3 Người mới ở trạng thái đơn đang đạt (`projected` / `earned` theo luật B18) – đúng

- "Đạt" nghĩa là OTTIMO đã có tiền (BR-903 (4), BR-525, BR-527). Đổi người hưởng không làm tiền về hay mất đi. Vì vậy người mới phải qua **đúng** luật B18 như người cũ:
  - folio còn phải thu = 0;
  - khoản chuyển khoản ghi sau `folio.settled_at` đã đối soát;
  - khoản do chính người hưởng ghi đã đối soát.
- Câu "`earned` sau B18" của 1h dễ hiểu thành "luôn `earned`". Đồng ý thẻ BE 1H-02, đổi chữ.
- Ví dụ:
  - Sửa lúc đang ở (OWN, 25/11, có lý do): A `void` (`closer_corrected`), B `projected`. B18 28/11 thu đủ → B `earned` 28/11.
  - Sửa sau trả phòng, folio đã thu đủ (OWN, 03/12): A `earned` → `void` (`closer_corrected`); B `earned` ngay, ngày 03/12.
  - Sửa sau trả phòng, folio còn nợ 100.000 (công nợ BR-525): B `projected`. Thu xong nợ → B `earned` ngày thu xong.
- **Chỗ hở nhỏ (thẻ 1H-04, Suggestion):** điều kiện thứ ba chỉ xét khoản do **người hưởng hiện tại** ghi (`p.recorded_by = c.payee_user_id` trong `tryEarnCommissions`).
  - Ví dụ: CTV A ghi cọc tiền mặt 1.000.000 lúc bán, chưa nộp quầy (còn ở **Chờ đối soát**). OWN sửa người chốt sang sale B sau trả phòng.
  - B `earned` ngay, dù tiền mặt A giữ chưa về OTTIMO.
  - Nếu khoản đó sau này bị đảo, luồng G-4 đưa B về `projected`. Nhưng nếu chủ đầu tư chi B trước lúc đó thì đã chi trên tiền chưa về.

### 1.4 `recognized_at` của bản ghi mới = lúc OWN sửa – đúng

Câu hỏi: dòng `earned` của B tính vào tháng nào khi chốt hoa hồng.

| | `recognized_at` = lúc sửa (03/12) | `recognized_at` = giờ B18 cũ (28/11) |
|---|---|---|
| Kỳ của B | kỳ tháng 12 (chốt 01/01) | kỳ tháng 11 (chốt 01/12), kỳ **đã chốt** |
| v1.0.5, chủ đầu tư chi ngoài Desk | B hiện trong danh sách kỳ kế, được chi | B nằm trong kỳ chủ đầu tư đã rà và đã chi xong, dễ sót |
| v1.3, lịch gộp ngày 1 (BR-212) | lần gộp 01/01 lấy B | lần gộp 01/12 đã chạy; bản ghi "tháng 11" sinh sau đó không lần gộp nào lấy, B không bao giờ vào `payable` |

Vì vậy chọn **lúc sửa**. Lý do:
- Cùng nguyên tắc BR-212: điều chỉnh đi vào kỳ sau, không mở lại kỳ đã chốt.
- Cùng cách BR-525 (iii) đang làm: hoa hồng "đạt lại" mang ngày của lúc đạt lại (`unearnCommissions` xóa `recognized_at`, `tryEarnCommissions` ghi ngày mới).
- Màn **Hoa hồng** hiện lọc theo ngày tạo bản ghi (`created_at`). Bản ghi của B tạo lúc sửa, nên hai ngày khớp nhau.
- Phân bổ hoa hồng theo đêm (`stay_night`) vẫn nằm ở đêm ở. Báo cáo doanh thu ròng theo tháng ở của DATA không đổi.
- Sửa trong cùng tháng với B18 (ví dụ 25/11 với B18 28/11) thì hai cách cho cùng kỳ.
- Bản ghi `void` của A giữ ngày cũ, chỉ để tra.

Ca sửa sau ngày chốt nhưng trước khi chi (ví dụ 03/12, trước hạn chi kỳ tháng 11):
- dòng của A đã `void`, nên chủ đầu tư không chi A;
- dòng của B mang ngày 03/12, nên vào kỳ tháng 12;
- chủ đầu tư muốn chi B ngay kỳ tháng 11 thì cộng tay ở v1.0.5. Ở v1.3 làm đúng bằng luật `payable` của thẻ 1H-03.

### 1.5 FD+ ở `hold`; MGR+ trước nhận phòng; chỉ OWN sau nhận phòng – đúng

- **`hold` FD+ – đúng.**
  - Giữ chỗ chưa cọc là lời hỏi, chưa là đơn bán. Ở OTTIMO lễ tân nhận khách qua Zalo/điện thoại rồi chuyển cho sale, nên chọn lại người chốt ở bước này là việc thường.
  - Đơn `hold` chưa có bản ghi hoa hồng. Bản ghi tạo ở B2/B4 cho người chốt lúc xác nhận.
  - SAL/CTV không gọi được `updateReservation` (`x-roles` không có hai vai này), nên sale không tự gán đơn cho mình được. Mọi lần đổi có audit `money` `reservation.closer_changed`.
- **Trước nhận phòng MGR+, lý do tùy chọn – đúng** EP02 5.4. Lý do không bắt buộc vì hoa hồng còn `projected` và audit đã ghi ai đổi. Tuy vậy, tranh chấp giữa sale và CTV ("sao đơn em chuyển cho người khác") hay xảy ra. Ô lý do mà Desk không hiện thì không ai gõ (thẻ 1H-05).
- **Sau nhận phòng chỉ OWN, lý do bắt buộc 3–500, kể cả ghi lần đầu – đúng** BR-903 (3) và rules 4.2 ý 3. Đóng đường quản lý gán hoa hồng cho người quen trên lượt đang ở. `access.denied` khi MGR/FDL/FD gọi thẳng API (Desk không có nút) cho chủ đầu tư thấy lần thử.
  - Ví dụ: khách vãng lai nhận phòng 22/11 không có người chốt; 24/11 một sale nói đã giới thiệu khách → chỉ OWN ghi được, có lý do.
- **Đơn `checked_out` chỉ nhận người chốt, trường khác 409 – đúng.** Số khách, giờ đến, ghi chú của lượt đã xong là lịch sử. Đồng ý thẻ BE 1H-01, viết câu này vào hợp đồng.
- **Gửi lý do mà không đổi người chốt → 422 `NOT_ALLOWED` – đúng.** Lưu lại cùng người kèm lý do không có nghĩa nghiệp vụ, chỉ thêm nhiễu vào audit.
- **Phạm vi:** 1h là hoa hồng ngắn ngày. HĐ thuê tháng có người hưởng ghi trên HĐ lúc ký (BR-212 (c)), bản ghi gắn `lease_contract_id` (PR-M, 1.22). Đổi người chốt trên đơn dài hạn không chuyển hoa hồng HĐ. Sổ tay phải nói rõ (thẻ 1H-02). Sửa nhầm người hưởng trên HĐ là việc của PR-M; hiện chưa có khách dài hạn đang ở (chủ đầu tư xác nhận 30/10).

### 1.6 Sổ tay và release notes – cần (thẻ 1H-02)

Ba chỗ người dùng sẽ hỏi:
- (a) Quản lý mất nút sửa người chốt khi khách đã nhận phòng.
- (b) Màn **Hoa hồng** đổi người ngay khi sửa.
- (c) Chủ đầu tư đã chi cho người cũ ngoài Desk thì làm gì.

Câu 409 không cần đưa vào sổ tay v1.0.5 vì không xảy ra. Tới khi `r5-h1c` gộp, BA giữ câu sổ tay tạm của DOM 131-01 mục 4. Nếu tag thiếu `r5-h1c` thì có dòng **Giới hạn đã biết** "Sửa người chốt" (plan T19). Câu đề xuất ở thẻ.

### 1.7 Truy vấn OPS chỉ đọc – cần, và phải rộng hơn 1.29 (thẻ 1H-01)

**Cần**, vì lưới an toàn của `r5-h1c` chỉ sửa được một phần dữ liệu cũ:

| Ca trên production trước khi `r5-h1c` lên | Lưới an toàn | Cần chủ đầu tư xem |
|---|---|---|
| Quản lý đổi người chốt trước nhận phòng, đơn chưa trả phòng (A `projected`) | Tự sửa ở B18: A `void`, B có bản ghi | Không |
| Quản lý đổi người chốt trước nhận phòng, đơn **đã trả phòng** (A `earned`, đơn ghi B) | **Không** sửa (bỏ qua khi đã có `earned`) | **Có**: theo BR-903 (3) B mới là người hưởng; kỳ chi kế sẽ chi A nếu không ai biết |
| Quản lý đổi **sau** nhận phòng, đơn còn đang ở | Tự đồng bộ ở B18 → người mới có hoa hồng, trái BR-903 (3) nếu chủ đầu tư không xác nhận | **Có, trước lúc trả phòng** |
| Quản lý đổi sau nhận phòng, đơn đã trả phòng | Không sửa | **Có** |

Câu 1.29 hiện chỉ tìm `reservation.closer_changed` sau giờ nhận phòng, tức thiếu dòng 2 của bảng. Thêm nữa, theo BE-H, trên production các bản ghi `reservation.closer_changed` có `before`/`after` **rỗng**: allowlist cũ bỏ khóa `closerUserId`. Audit chỉ cho biết ai đổi và lúc nào, không cho biết đổi từ ai sang ai. Hình dạng truy vấn đề xuất ở thẻ 1H-01.

---

## 2. Hai thẻ của BE-H

| Thẻ | DOM |
|---|---|
| FB-R5-BE-ARC-1H-01 (đơn `checked_out` chỉ nhận `closerUserId` + `closerChangeReason`, trường khác 409) | Đồng ý về nghiệp vụ (mục 1.5). Câu ở 0.3.14 là đủ, vì FE-A chỉ gửi hai trường này cho OWN |
| FB-R5-BE-ARC-1H-02 ("`earned` sau B18" → "theo luật B18, `projected` nếu chưa đủ điều kiện") | Đồng ý (mục 1.3). Nên thêm vào cùng câu: "`recognized_at` = lúc sửa" (mục 1.4), để QA viết ca đúng kỳ |

---

## 3. Thẻ feedback

### FB-R5-DOM-ARC-1H-01
- Mức độ: **Minor** (không chặn gộp #147; xong trước khi `r5-h1c` lên production và trước kỳ chi hoa hồng đầu tiên sau đó)
- Người sửa: ARC (câu OPS ở 1.29, hoặc 0.3.14), OPS (bước trong runbook bản có `r5-h1c`), ORC (gửi danh sách cho chủ đầu tư qua kênh riêng)
- Vị trí: `contract-0.3.13.md` 1.29 gạch "Đơn mà MGR đã đổi người chốt sau nhận phòng"; `ARC-on-be-h-prs-110-123-131.md` 4.2 cùng gạch
- Vấn đề:
  - (a) Truy vấn chỉ tìm lần đổi sau nhận phòng. Sót các đơn quản lý đổi **trước** nhận phòng mà đã trả phòng: A `earned`, đơn ghi B. Lưới an toàn không sửa ca này vì đã có `earned` (mục 1.7, bảng dòng 2).
  - (b) Trên production, `reservation.closer_changed` không có người chốt cũ/mới (`before`/`after` rỗng, theo BE-H). Chỉ `reservation_change` (`field = 'closer_user_id'`, `old_value`, `new_value`, `changed_at`, `changed_by`) còn giữ giá trị.
  - (c) "Trước khi cắt tag" chưa đủ: từ lúc cắt tới lúc lên bản, máy chủ cũ vẫn cho quản lý đổi sau nhận phòng.
  - (d) Đơn quản lý đổi sau nhận phòng mà còn đang ở sẽ được lưới an toàn tự gán hoa hồng cho người mới lúc trả phòng.
- Vì sao quan trọng: kỳ chốt 01/12 là kỳ chi đầu tiên sau H2. Chủ đầu tư chi theo màn **Hoa hồng**, nên sẽ chi A cho các đơn ở (a) và chi người quản lý gán ở (d), mà không ai thấy.
- Đề xuất sửa (chỉ hình dạng truy vấn; không số, không dữ liệu trong repo):
  - **Khi chạy:** ngay sau khi máy chủ có `r5-h1c` lên. Từ lúc đó vai khác OWN không đổi được sau nhận phòng nữa, nên danh sách là trọn vẹn. Gửi chủ đầu tư trong ngày. Chạy lại nếu kỳ chi kế tới trước khi chủ đầu tư xử lý xong.
  - **Danh sách 1 – đổi sau nhận phòng:**
    - nguồn: `reservation_change` nối `reservation`;
    - lọc: `field = 'closer_user_id'`, `r.actual_checkin_at IS NOT NULL`, `changed_at >= r.actual_checkin_at`;
    - cột: mã đơn, trạng thái đơn, ngày nhận phòng, lúc đổi, tên hiển thị người đổi kèm vai hiện có (ghi "đã thu hồi" nếu vai đã thu hồi), người chốt cũ, người chốt mới (tên hiển thị nhân viên), trạng thái các bản ghi hoa hồng chưa `void` và người hưởng của chúng;
    - đánh dấu "**xử lý trước lúc trả phòng**" cho đơn `in_house`.
  - **Danh sách 2 – người hưởng lệch người chốt:**
    - nguồn: `reservation` nối `commission`;
    - lọc: bản ghi chưa `void`, `c.payee_user_id IS DISTINCT FROM r.closer_user_id`;
    - cột: mã đơn, trạng thái đơn, trạng thái bản ghi (`projected`/`earned`), người hưởng trên bản ghi, người chốt trên đơn, lần đổi cuối (từ `reservation_change`) trước hay sau nhận phòng;
    - đơn `projected` chưa trả phòng ghi "Desk tự sửa lúc trả phòng", trừ đơn đã có ở danh sách 1.
  - **Không có trong danh sách:** tên, SĐT, giấy tờ của khách, tỷ lệ, số tiền hoa hồng.
    - Chủ đầu tư xem số trên màn **Hoa hồng**.
    - Repo và runbook chỉ ghi "Danh sách 1 = 0 / > 0, Danh sách 2 = 0 / > 0", như cách K13 (SEC 129).
  - **Chủ đầu tư làm gì với từng đơn:**
    - Danh sách 1, đơn đang ở: giữ người mới (không làm gì), hoặc trả lại người cũ (OWN sửa trên Desk, có lý do), trước lúc trả phòng. Nếu chủ đầu tư quyết "không có hoa hồng" thì Desk không có cách bỏ người chốt; ghi "không chi" vào sổ chi.
    - Danh sách 1, đơn đã trả phòng, và danh sách 2 dòng `earned`: chi đúng người ở kỳ chi kế, ngoài Desk như hiện nay (BR-903 (3): người chốt ghi trên đơn trước nhận phòng là người hưởng). Không sửa dữ liệu bằng tay trên production.
- Trạng thái: Open

### FB-R5-DOM-ARC-1H-02
- Mức độ: **Minor** (cùng tag có `r5-h1c`; tag thiếu `r5-h1c` thì dùng dòng **Giới hạn đã biết** T19)
- Người sửa: BA (sổ tay `01-chu-dau-tu-quan-ly.md`, `05-sale-ctv.md`, `user-manual-v1.0.md`), PO (`release-notes.md` v1.0.5); UXD rà chữ
- Vị trí:
  - `01-chu-dau-tu-quan-ly.md`: mục chi hoa hồng, và mục quản lý sửa đơn;
  - `05-sale-ctv.md` mục **Đơn của tôi**;
  - `release-notes.md` dòng **Hoa hồng và phí dọn thuê tháng**
- Vấn đề: chưa có chữ cho ba thay đổi ở mục 1.6. Câu tạm của DOM 131-01 mục 4 chưa có trong `01`: grep "người chốt" trên `main` @ `12346216` không ra dòng nào.
- Vì sao quan trọng:
  - Quản lý thấy mất nút sửa người chốt thì báo lỗi.
  - Chủ đầu tư đã chi cho người cũ ngoài Desk, sau đó sửa trên Desk, rồi chi người mới mà quên trừ người cũ: chi hai lần.
- Đề xuất sửa (câu nội bộ, không số):
  - **Chủ đầu tư (`01`):**
    - "Sửa người chốt sau khi khách nhận phòng: chỉ anh/chị sửa được, phải ghi lý do. Desk chuyển hoa hồng sang người mới ngay. Dòng của người mới mang ngày sửa và vào kỳ chi kế tiếp."
    - "Anh/chị đã chi hoa hồng đơn đó cho người cũ: vẫn sửa trên Desk để đơn đúng người, rồi trừ phần đã chi ở kỳ chi sau của người cũ."
    - "Trước khi sửa, mở **Nhật ký tiền → Chờ đối soát** của đơn: người chốt cũ còn khoản tiền mặt chưa nộp thì đối soát trước." (tới khi có 1H-04)
  - **Quản lý (`01`):** "Khách đã nhận phòng: quản lý không sửa người chốt. Báo chủ đầu tư, kèm lý do."
  - **Phạm vi (`01`):** "Sửa người chốt chỉ chuyển hoa hồng khách ngắn ngày. HĐ thuê tháng: người hưởng theo HĐ lúc ký."
  - **Sale/CTV (`05`):** "Đơn đổi người chốt thì dòng **Hoa hồng dự kiến của bạn** chuyển sang người mới. Thấy sai thì báo quản lý (trước khi khách nhận phòng) hoặc chủ đầu tư (sau đó)."
  - **Release notes**, thêm vào dòng hoa hồng: "Sửa người chốt chuyển hoa hồng sang người mới ngay. Sau khi khách nhận phòng, chỉ chủ đầu tư sửa, có lý do."
- Trạng thái: Open

### FB-R5-DOM-ARC-1H-03
- Mức độ: **Minor** (Deferred v1.3 – US-089; ở v1.0.5 nhánh 409 không xảy ra)
- Người sửa: PO (tiêu chí nghiệm thu US-089), ARC (hợp đồng bản có luồng chi)
- Vị trí: `updateReservation` 1h gạch "Đơn đã có bản ghi hoa hồng `payable` hoặc `paid` → 409"; bảng 1.29 dòng cuối; `03-backlog/backlog.md` US-089
- Vấn đề: 409 cho cả `payable` lẫn `paid` là lưới chặn đúng tới khi có luồng chi. Nhưng nếu giữ nguyên ở v1.3 thì:
  - ở `payable` (đã vào danh sách kỳ chi, chưa chuyển tiền), chủ đầu tư không sửa được đúng lúc dễ phát hiện và dễ sửa nhất;
  - ở `paid`, đơn mang người chốt sai mãi, báo cáo theo người chốt của DATA lệch mãi.
- Vì sao quan trọng: ở v1.3, sale và CTV xem danh sách kỳ chi của mình rồi mới báo nhầm. Chặn lúc đó thì luồng chi trong app vô dụng cho ca này, chủ đầu tư lại phải làm tay.
- Đề xuất sửa (luật đích cho US-089, chỉ OWN, lý do bắt buộc):
  - `payable`: dòng của người cũ `void` (`closer_corrected`). Người mới có dòng `payable` trong **cùng** kỳ chi, cùng tỷ lệ ghim. Tổng kỳ của hai người tính lại trước khi chi (làm tròn 1.000 ở tổng kỳ, BR-212).
  - `paid`: dòng đã chi giữ nguyên (BR-008). Người cũ có một dòng trừ đúng số đó ở kỳ chi kế (lý do `closer_corrected`). Người mới có dòng `earned` ngày sửa.
  - Tới khi luồng chi có dòng trừ, giữ 409 cho `paid`.
  - PO ghi vào US-089 cùng câu BR-525 (iii) còn chờ chốt (trừ hoa hồng đã chi khi xóa nợ). Hai việc dùng chung cơ chế dòng trừ.
- Trạng thái: Open

### FB-R5-DOM-ARC-1H-04
- Mức độ: Suggestion (BE-H làm trong `r5-h1c` nếu rẻ; nếu không thì v1.0.6, tới đó dùng câu sổ tay ở 1H-02)
- Người sửa: BE-H; QA thêm ca
- Vị trí: `folio.service.ts` `tryEarnCommissions`, điều kiện `p.recorded_by = c.payee_user_id`
- Vấn đề: sau khi đổi người chốt, khoản thu do **người chốt cũ** ghi mà còn `pending`/`disputed` không giữ hoa hồng của người mới. Ví dụ ở mục 1.3: CTV A ghi cọc tiền mặt 1.000.000 chưa nộp quầy; OWN sửa sang sale B sau trả phòng; B `earned` ngay.
- Vì sao quan trọng: "đạt" nghĩa là OTTIMO đã có tiền (BR-527). Tiền mặt sale/CTV thu hộ chỉ là của OTTIMO khi đã nộp và đối soát (sổ tay `05`: "Hoa hồng thành 'đạt' sau khi khoản này được đối soát"). Ca hiếm ở 10 căn: cần OWN sửa sau nhận phòng **và** người cũ còn tiền chưa nộp.
- Đề xuất sửa: điều kiện ba xét khoản do người hưởng hiện tại **hoặc** người hưởng trước của cùng đơn ghi. Người hưởng trước lấy theo bản ghi `void` lý do `closer_changed`/`closer_corrected`. Ca QA: A ghi tiền mặt chờ đối soát → OWN sửa sang B → B `projected`; MGR đối soát khoản của A → B `earned`.
- Trạng thái: Open

### FB-R5-DOM-ARC-1H-05
- Mức độ: Suggestion
- Người sửa: FE-A, UXD (câu chữ)
- Vị trí: `updateReservation` 1h gạch "Desk (FE-A)"; `contract-0.3.13.md` 1.29 gạch **FE-A**
- Vấn đề: hợp đồng nhận lý do tùy chọn trước nhận phòng ("có thì ghi vào audit"). Nhưng Desk chỉ hiện ô lý do cho OWN sau nhận phòng, nên quản lý không bao giờ gõ được lý do khi đổi người ở đơn `confirmed`.
- Vì sao quan trọng: đổi người chốt trước ngày đến là chỗ tranh chấp hay gặp nhất giữa sale và CTV. Một dòng lý do trong lịch sử đơn giúp chủ đầu tư trả lời mà không phải hỏi lại quản lý.
- Đề xuất sửa: khi MGR+ đổi người chốt ở đơn ngoài `hold`, chưa nhận phòng, Desk hiện ô "Lý do đổi người chốt (không bắt buộc)". Ô bắt buộc chỉ ở OWN sau nhận phòng như 1h. Không đổi hợp đồng.
- Trạng thái: Open

---

## 4. Điểm làm tốt

- 1h giữ đúng một luật quyền theo mốc nhận phòng thật, phủ cả ca "ghi lần đầu sau nhận phòng". Đây là đường lách hay bị bỏ sót.
- Hoa hồng đồng bộ trong cùng giao dịch với lần đổi, khóa theo đúng thứ tự B18. Màn **Hoa hồng** không còn lúc nào lệch với đơn.
- ARC tự nêu chỗ chưa chắc (409 ở `payable`/`paid`) và hỏi DOM, thay vì im lặng chọn. BE-H đối chiếu từng luật với mã `r5-h1c` và 16 đột biến trước khi DOM đọc.

## 5. Giả định DOM dùng

1. Đọc `0943db43`, `b5fe802f` và `main` @ `12346216` bằng `git show`, không chạy test. Hành vi `r5-h1c` (người mới theo luật B18, 409 ở `payable`, lưới an toàn dùng `closer_changed`) lấy từ bảng của BE-H, nhánh chưa đẩy.
2. "Không có đường tới `payable`/`paid` ở v1.0.5": DOM tìm trong `services/api/src` không thấy chỗ nào chuyển bản ghi sang hai trạng thái này. PR-M (1.22) thêm `instalment_no`, không thêm luồng chi.
3. "`before`/`after` của `reservation.closer_changed` trên production rỗng": theo ghi chú của BE-H, DOM không đọc dữ liệu production.
4. Kỳ chốt và hạn chi theo BR-212 (gộp ngày 1, chi theo kỳ lương); ngày cụ thể là tham số chủ đầu tư nhập. "Kỳ chốt 01/12" theo plan T19.
5. BR-903 (3) và BR-212 "trừ vào kỳ sau" là luật đã có, không phải chính sách mới. Luật đích ở 1H-03 thuộc PO (US-089), cùng nhóm với BR-525 (iii). Vì vậy không ESC.

## 6. Dòng đề xuất ghi `decision-log.md` (ORC ghi)

`| 2026-11-07 | 5 | **DOM – review hợp đồng 0.3.13 bổ sung 1h (PR #147 @ 0943db43, đổi người chốt)**: DUYỆT về nghiệp vụ – hold FD+, trước nhận phòng MGR+ (lý do tùy chọn), sau nhận phòng chỉ OWN có lý do 3–500 kể cả ghi lần đầu (BR-903 (3)); void + bản ghi mới cho closer_changed và closer_corrected (BR-008); người mới đạt theo luật B18 (projected khi còn nợ hoặc khoản của người hưởng chưa đối soát), recognized_at = lúc sửa (vào kỳ chi kế, không mở lại kỳ đã chốt – BR-212, BR-525 (iii)); 409 khi payable/paid đúng làm lưới chặn nhưng ở v1.0.5 không xảy ra (chưa có luồng chi, US-089 v1.3) – hoa hồng đã chi ngoài Desk cho người cũ thì sửa trên Desk và trừ người cũ ở kỳ sau; đồng ý BE 1H-01, 1H-02. Thẻ: 1H-01 Minor truy vấn OPS chỉ đọc hai danh sách (đổi sau nhận phòng; người hưởng lệch người chốt) từ reservation_change, chạy ngay sau khi r5-h1c lên, repo chỉ ghi 0 / > 0; 1H-02 Minor sổ tay + release notes; 1H-03 Minor luật đích v1.3 (payable sửa được, người mới vào cùng kỳ; paid giữ nguyên + dòng trừ kỳ sau); 1H-04, 1H-05 Suggestion. Không ESC, không số hoa hồng | DOM | rounds/round-05/reviews/DOM-on-contract-addendum-1h.md |`
