# ARC – Review PR #82 `v104/fe-rate-source-typed`: cột "Nguồn giá" ghi đúng thứ ô đang chứa

- Người viết: ARC | Round 4 – đợt v1.0.4 – bước **Review** | 05/11/2026
- Đối tượng:
  - head `e8b1c4e9` (1 commit), chồng trên #75: base `v104/fe-hold-typed-rate-lock` @ `9b45cef3`;
  - diff đã xem: `git diff 9b45cef3...origin/v104/fe-rate-source-typed`, 7 tệp:
    - `BookingDialog.tsx` (+21/−9);
    - test mới `v104-rate-source-typed.test.tsx` (4 ca);
    - khóa `bk.src_typed` trong `gen_strings.py` và các tệp sinh ra từ nó.
- Đối chiếu:
  - `UXD-on-v104-src-typed.md`: bảng mục 2, mục 3 và lượt 2 của UXD;
  - DOM lượt 8 §4.2 trong `DOM-on-v104-pr68-docs.md`;
  - thẻ FB-R4-UXD-FE-PR70-02 và FB-R4-ARC-FE-PR70-02;
  - BR-104 v0.5.1, BR-904 v0.5.5, BR-421 v0.5.3 (b).
- Cách kiểm:
  - worktree tạm ở `e8b1c4e9` trong scratchpad, đã xóa khi xong;
  - không sửa nhánh, không đẩy, không commit;
  - không sửa `decision-log.md`. Dòng đề xuất ở mục 6.

## 1. Kết luận: **ĐẠT CÓ ĐK** cho `e8b1c4e9`

Ba điều ORC hỏi:

| Câu hỏi | Trả lời | Bằng chứng |
|---|---|---|
| Tiền có còn chỉ do máy chủ tính không? | **Có.** #82 chỉ đổi phần hiện (nhãn, `aria-busy`, `–`). `body()`, `validate()`, bản xem, Giữ chỗ và hợp đồng không đổi một dòng nào | Mục 2.1 |
| Có đường nào để giá đã gõ mang nhãn sai không? | **Nhãn luôn khớp thứ ô đang chứa**, ở mọi kênh. Có **một đường** nhãn đúng về ô mà lưu đơn lại bỏ số: đơn **Nội bộ** chỉ gõ một phần số đêm. Máy chủ ghi 0 đ, Desk không báo gì. Lỗi này có từ trước #70. #82 không sinh ra lỗi này, nhưng nhãn "Giá đã gõ" làm lễ tân tin hơn rằng số sẽ được lưu | Mục 2.2, thẻ **PR82-01 (Major)** |
| Bỏ `weekend()` có làm hỏng chỗ khác không? | **Không.** Dòng nhãn là chỗ duy nhất dùng hàm này. `QuoteDialog.tsx` có bản `weekend` riêng của nó. Khóa `bk.src_weekend` vẫn giữ. Toàn bộ test admin-web xanh: 943/943 | Mục 2.3 |

Điều kiện:
1. Job CI `format · lint · audit · test · build` xanh trên `e8b1c4e9`. Lúc review job này còn `pending`, các job khác đều `pass`.
2. Thẻ **PR82-01** sửa xong **trước khi cắt v1.0.4**:
   - DOM chốt luật;
   - nên làm ngay trong #82: thêm 1 dòng `validate()` và 1 ca test;
   - nếu không kịp thì làm PR riêng chồng lên. #82 không được vào bản phát hành mà thiếu bản sửa này.
3. Khi #75 vào `main`: đổi base của #82 sang `main`, chạy lại 4 tệp test ở mục 3 và CI.

Thẻ khác:
- PR82-02 (Minor) không chặn.
- ARC đồng ý hai thẻ của UXD ở lượt 2:
  - **FB-R4-UXD-FE-PR82-01**: chữ BR-107 của lượt ở trước còn hiện trong lúc chờ. ARC tái hiện độc lập ca 7 đêm sang 2 đêm, ra cùng kết quả;
  - **FB-R4-UXD-FE-PR82-02**: `QuoteDialog` còn tách đêm thứ Sáu, thứ Bảy.
- ARC không mở thẻ trùng với hai thẻ đó.

Trạng thái thẻ cũ:
- **FB-R4-UXD-FE-PR70-02**: #82 đóng phần cột và các ô tiền.
- **FB-R4-ARC-FE-PR70-02** (test thiếu (a)–(d) của #70) vẫn **Open**. #82 không thuộc thẻ này.

## 2. Ba điều ORC hỏi

### 2.1 Tiền vẫn chỉ do máy chủ tính
- Các hunk của diff:
  - xóa hàm `weekend`;
  - `aria-busy` trên `.rate-table`;
  - ô nhãn dòng 1388–1392;
  - bảng tổng dòng 1465–1507: `aria-busy`, và 4 ô tiền thành `priceWaiting ? '–' : …`.
- Không có phép tính mới. Các số trong bảng tổng vẫn như trước:
  - `calc.roomTotalVnd`, `extraPersonFeeVnd`, `depositVnd` của máy chủ;
  - hoặc tổng các ô đã gõ, cách hiện đã duyệt từ A-14 và S4-38.
- `body()` (dòng 564–581), `validate()`, effect bản xem (dòng 366–440), `hold()` và `submit()` không đổi. Hợp đồng và `openapi.yaml` cũng không đổi.
- `aria-busy` chỉ là thuộc tính, không khóa gì. Nút Tạo đơn vẫn chờ theo `priceWaiting` như ở #70.

### 2.2 Nhãn của ô giá đã gõ: xét từng đường

Biểu thức mới:

```tsx
{form.ratesEdited[r.date] && form.rates[r.date] ? t('bk.src_typed') : r.raw && calc ? t('bk.src_list') : '–'}
```

Bất biến ARC kiểm trong mã:
- `calc` khác `null` thì `calcFor === ratesFor === khóa của calc`. Lý do:
  - lúc thành công, ba giá trị được đặt cùng một lượt render (React 18 gộp);
  - lúc lỗi thì `calc = null`;
  - khi `!p.on` thì `calc = null`.
- Vì vậy `prefillLive && calc` nghĩa là `calc` là bản xem của đúng lượt ở đang hiện. Ô chưa gõ khi đó chứa đúng số của `calc`, vì lúc thành công `rates` được dựng lại từ `nightlyRates`.
- Số người không nằm trong khóa, nhưng giá đêm không phụ thuộc số người. Chỗ này đã chốt ở review #70.

| Đường | Ô chứa | Nhãn | Đúng? |
|---|---|---|---|
| Gõ số, mọi kênh, cả khi đang chờ bản xem | Số đã gõ | Giá đã gõ | Đúng. Trực tiếp/CTV gửi `edited:true`, máy chủ ghi `manual` |
| Gõ rồi xóa | Trống | – | Đúng |
| Chưa gõ, bản xem của lượt ở đang hiện | Giá niêm yết | Giá niêm yết (BR-101) | Đúng, theo bất biến trên |
| Chưa gõ, đang chờ bản xem (đổi căn, ngày, kênh; hoặc `rateDrop`) | Trống | – | Đúng |
| Chưa gõ, bản xem của cùng lượt ở bị lỗi (đổi số người, máy chủ trả 503) | Giá niêm yết của bản xem trước | – | Chấp nhận (giả định của FE). Nhãn nói ít đi chứ không nói sai. Bảng tổng ẩn, có câu lỗi. Bấm Tạo đơn thì không gửi giá, máy chủ tự tính (probe A) |
| Khôi phục bản nháp có `ratesFor` trùng khóa | Số của bản nháp | – cho tới khi bản xem về | Đúng. Nút chờ, bản xem về thì thay số |
| OTA, trong 300 ms đầu sau khi đổi kênh (`calc` của Trực tiếp còn) | Trống (`liveKey = null`) | – | Đúng. Mã cũ ghi "Giá niêm yết" ở đây: ca 4 đỏ trên `9b45cef3` vì đúng chỗ này |
| OTA gõ một phần số đêm | Số gõ / trống | Giá đã gõ / – | Đúng. `validate()` chặn bằng `rate_empty` (probe) |
| **Nội bộ gõ một phần số đêm** | Số gõ / trống | Giá đã gõ / – | **Nhãn đúng về ô, nhưng đơn lưu 0 đ cho mọi đêm, không báo gì.** Thẻ PR82-01 |

Probe (test tạm, đã xóa cùng worktree). Nội bộ, 2 đêm, căn 203, gõ đêm 1 = 500000:
- Trước khi bấm: đêm 1 "500000 | Giá đã gõ", đêm 2 "trống | –".
- Bấm Tạo đơn thì đơn được tạo, `nightlyRates = undefined`, không có lỗi. Máy chủ ghi 0 đ `complimentary` cho cả 2 đêm.
- Cùng các bước với OTA: không tạo đơn, hiện "Nhập giá mỗi đêm (lớn hơn 0)."

### 2.3 Bỏ `weekend()`
- `grep` trong `product/apps`: `weekend(` ở admin-web chỉ còn bản riêng trong `QuoteDialog.tsx` dòng 63 (`const` của module, không import). Hai chỗ còn lại không dính tới hàm này:
  - `mocks/reservations.ts` dòng 544, là lịch giá của mock;
  - một chữ trong landing.
- `bk.src_weekend` vẫn có trong JSON, vì hi-fi `09-booking.html` dòng 93 còn dùng.
- Không có test nào bắt khóa không dùng. `i18n-keys.test.ts` chỉ kiểm khóa **đang dùng** có trong VI/EN, và vẫn xanh.
- `strings.js`: so `9b45cef3` với `e8b1c4e9`, VI và EN mỗi bên chỉ thêm `bk.src_typed`. Không bớt khóa nào, không đổi chữ nào. RU không đổi.
- Chạy lại `python3 -I product/design/tools/gen_strings.py` (3474 chuỗi + 8 mẫu) không ra diff.
- Ghi chú, không mở thẻ:
  - mock MSW vẫn tính thứ Sáu, thứ Bảy +15% (`mocks/reservations.ts` dòng 544–545). Ca 3 chỉ kiểm nhãn nên không bị ảnh hưởng. Khi chỉnh mock theo BR-104 v0.5.1 thì ca 3 vẫn đúng;
  - phần `QuoteDialog` đã có thẻ FB-R4-UXD-FE-PR82-02.

## 3. Test đã chạy (máy tải thấp, load 2–8)

| Việc | Kết quả |
|---|---|
| 4 tệp liên quan ở `e8b1c4e9`: `v104-rate-source-typed`, `v104-hold-typed-rate-lock`, `v104-booking-rate-carryover`, `booking` | **47/47 xanh**, 23 s |
| Test mới với `BookingDialog.tsx` của `9b45cef3` (chuỗi giữ ở head) | **4/4 đỏ**, đúng chỗ khẳng định nhãn: ca 1, 2, 4 nhận "Giá niêm yết (BR-101)"; ca 3 nhận "Lịch giá: thứ Sáu/thứ Bảy +15% (BR-104)" |
| M1: bỏ `&& form.rates[d]` | Ca 1 đỏ (ô đã xóa vẫn ghi "Giá đã gõ") |
| M2: `r.raw && calc` thành `calc` | Ca 1, 2, 4 đỏ |
| M3: bỏ `–` ở Tổng tiền đơn khi chờ | Ca 2 đỏ |
| M4: bỏ `aria-busy` của `.rate-table` | Ca 2 đỏ |
| Toàn bộ admin-web ở `e8b1c4e9` | **943/943 xanh**, 83 tệp |
| `tsc --noEmit`, `eslint` và `prettier --check` trên các tệp đổi | Sạch |
| `gh pr checks 82` | 7 `pass`; `format · lint · audit · test · build` còn `pending` (điều kiện 1) |

Probe thêm (test tạm, không commit):
- **A.** Đổi số người, bản xem lỗi 503: xem bảng mục 2.2.
- **B.** Đổi số người, giữ bản xem lại. Bảng tổng vẫn là **1.434.000** của 2 người: không có dòng phụ thu, không có `aria-busy`, nút Tạo đơn vẫn bật. Nhả bản xem ra thì thành **1.734.000** (thêm phụ thu 300.000). Thẻ PR82-02.
- **C.** 7 đêm sang 2 đêm, giữ bản xem lại. Các ô tiền là `–`, nhưng hai câu vẫn là của lượt ở trước:
  - "Lượt ở 2 đêm được giảm 10%…";
  - "Đã giảm 10% vì ở từ 7 đêm (BR-107)".

  Trùng với FB-R4-UXD-FE-PR82-01.
- **Nội bộ / OTA gõ một phần số đêm**: xem mục 2.2. Thẻ PR82-01.

## 4. Nhận xét về test mới
- Bốn ca bám đúng bảng UXD mục 2.
- Ca 2 giữ bản xem của căn 203 bằng `server.use` cho tới khi mở. Cách này chắc chắn hơn chờ theo giờ.
- Ca 3 tự tìm thứ Sáu kế tiếp, nên chạy được mọi ngày trong tuần:
  - nếu hôm nay là thứ Bảy, lượt ở trung gian dài 8 đêm và cột có thêm dòng "Sau giảm";
  - `toHaveTextContent` so một phần chuỗi nên vẫn đúng;
  - hai `fireEvent.change` liền nhau nên debounce chỉ thấy lượt ở cuối.
- Thiếu một ca **Nội bộ**: xem thẻ PR82-01.

## 5. Thẻ

### FB-R4-ARC-FE-PR82-01
- Mức độ: **Major** (tiền). Lỗi có từ trước #70, không do #82 sinh ra. Phải sửa trước khi cắt v1.0.4.
- Vị trí: `BookingDialog.tsx` @ `e8b1c4e9`:
  - `validate()` dòng 543–544: luật "gõ một phần" chỉ áp cho OTA;
  - `body()` dòng 575–578: Nội bộ chỉ gửi giá khi **mọi** đêm đã gõ;
  - ô nhãn dòng 1388.
- Vấn đề:
  - Đơn **Nội bộ** gõ giá cho một phần số đêm thì vẫn qua `validate()`. `body()` gửi `nightlyRates = undefined`, nên máy chủ ghi 0 đ `complimentary` cho **mọi** đêm. Số đã gõ mất mà Desk không báo gì.
  - Trước #70 mã cũng thế (`every(r => r.raw)`), nên đây không phải lỗi mới. ARC đã không bắt được lỗi này ở review #70.
  - Từ #82, cạnh số đó có nhãn "Giá đã gõ". Theo ghi chú của khóa, nghĩa là "Máy chủ ghi manual". Ở ca này điều đó sai.
  - Desk không gõ được 0 (`rate_empty` khi ≤ 0). Vì vậy lễ tân không có cách nào nói "đêm 1 thu 500.000, đêm 2 miễn phí" ở bước tạo đơn. Họ sẽ gõ đêm 1 rồi để trống đêm 2.
- Vì sao quan trọng:
  - BR-904 v0.5.5 và BR-421 v0.5.3 (b): đêm "Nội bộ có thu" là đêm bán có thu tiền và vào ADR.
  - Mất số gõ thì OTTIMO không thu khoản đó, Folio ghi 0 đ, và đêm bị đếm là miễn phí.
  - Desk không có dấu hiệu nào cho thấy số đã bị bỏ.
- Đề xuất sửa (FE; DOM chốt luật):
  - (A, ARC đề xuất cho v1.0.4) Áp luật của OTA cho cả Nội bộ: có ô gõ mà còn ô trống thì `e.rates = booking.error.rate_empty`, không gửi.

    ```tsx
    if ((form.group === 'ota' || form.group === 'internal') && rateList.some((r) => r.raw) && rateList.some((r) => !r.raw))
    ```

    - Lễ tân gõ đủ mọi đêm (có thu) hoặc xóa hết (miễn phí).
    - Đêm muốn miễn phí trong một đơn có thu thì làm sau khi tạo: FOC hoặc giảm 100 % ở Folio. Đêm đó thành miễn phí theo BR-904.
    - Không đổi hợp đồng. Không cần khóa mới, nhưng UXD có thể cấp câu riêng cho Nội bộ nếu muốn.
  - (B, không đề xuất ở v1.0.4) Gửi cả đêm trống với 0 đ cho Nội bộ. Cách này cần BE xem `price()` xử lý đêm `edited:false` của Nội bộ thế nào, và cần bỏ chặn ≤ 0 ở Desk. Rộng hơn mức một PR nhỏ.
  - Test: Nội bộ, 2 đêm, gõ đêm 1. Phải thấy `rate_empty` và không có POST `…/reservations`. Gõ đủ 2 đêm thì POST có `nightlyRates` 2 đêm, `edited:true`. Probe của ARC có các bước giống hệt ca OTA trong `v104-booking-rate-carryover`.
  - Đề nghị QA ghi thành lỗi v1.0.4 (ARC đề xuất P2: mất tiền ở luồng ít gặp, không có cách vòng) để theo dõi, rồi xác nhận bản sửa.
- Trạng thái: Open

### FB-R4-ARC-FE-PR82-02
- Mức độ: Minor. Có từ trước, không chặn. Làm ở v1.0.5, hoặc cùng FB-R4-UXD-FE-PR82-01 nếu FE làm luôn.
- Vị trí: `BookingDialog.tsx`:
  - `priceWaiting` dòng 490: khóa `previewKey` không có số người;
  - bảng tổng dòng 1465–1507.
- Vấn đề:
  - Đổi số người thì `calcInput` đổi nhưng `liveKey` không đổi. Vì vậy `priceWaiting = false`.
  - Trong 300 ms debounce cộng thời gian gọi, bảng tổng vẫn hiện tổng và dòng phụ thu của **số người cũ**. Không có `aria-busy`, nút Tạo đơn vẫn bật.
  - Probe B: 2 sang 3 người thì màn vẫn ghi 1.434.000 cho tới khi bản xem về, rồi mới thành 1.734.000.
  - Đây là phần PR70-02 không phủ tới. #82 làm đúng phạm vi thẻ UXD (đổi căn, ngày, kênh).
- Vì sao quan trọng:
  - Không sai tiền: máy chủ tính theo số người mới khi lưu, cọc 30 % tiền phòng không đổi theo số người.
  - Nhưng lễ tân đọc tổng cho khách qua điện thoại đúng lúc vừa bấm thêm người, nên sẽ báo thiếu khoản phụ thu. Mạng Đà Lạt yếu thì khoảng này có thể dài vài giây.
- Đề xuất sửa (không cần khóa mới):
  - Thêm một khóa riêng cho bảng tổng: `totalsKey = liveKey + số người`.
  - Lúc bản xem thành công thì lưu `calcTotalsFor`. Đặt `totalsWaiting = priceWaiting || calcTotalsFor !== totalsKey`, và dùng nó cho bảng tổng (`aria-busy` và `–`).
  - **Không** đưa số người vào `previewKey`, nếu không ô giá sẽ bị xóa mỗi lần bấm số người. Nút Tạo đơn có chờ theo `totalsWaiting` hay không thì UXD quyết. Về tiền thì không cần.
  - Test: giữ bản xem có `adults: 3`, bấm "Tăng Người lớn". Bảng tổng phải có `aria-busy` và Tổng hiện `–`. Nhả bản xem ra thì có dòng phụ thu.
- Trạng thái: Open

## 6. Dòng decision-log đề xuất (ORC ghi)

| Ngày | Round | Quyết định | Người | Ghi chú |
|---|---|---|---|---|
| 2026-11-05 | 4 | **ARC – review PR #82 @ `e8b1c4e9`: ĐẠT CÓ ĐK.** Cột "Nguồn giá" ghi đúng thứ ô đang chứa ở mọi kênh: 4 ca mới đỏ trên `9b45cef3`, 4 đột biến đều bị bắt. Tiền vẫn do máy chủ tính, PR chỉ đổi phần hiện. Bỏ `weekend()` không ảnh hưởng chỗ khác: admin-web 943/943, `strings.js` chỉ thêm `bk.src_typed`. **ĐK:** (1) job CI build xanh; (2) thẻ **ARC-PR82-01** sửa trước khi cắt v1.0.4, nên làm trong #82. Lỗi: đơn Nội bộ chỉ gõ một phần số đêm thì lưu 0 đ mà không báo, có từ trước #70. Sửa: áp luật `rate_empty` của OTA cho cả Nội bộ, DOM chốt; (3) sau #75 đổi base sang `main` rồi chạy lại. Đóng FB-R4-UXD-FE-PR70-02 (cột và ô tiền). FB-R4-ARC-FE-PR70-02 vẫn Open | ARC | `rounds/round-04/reviews/ARC-on-v104-pr82-rate-source.md`. ARC-PR82-02 Minor: đổi số người thì bảng tổng vẫn của số người cũ, làm ở v1.0.5. ARC đồng ý thẻ UXD-PR82-01 (chữ BR-107 của lượt ở trước) và UXD-PR82-02 (`QuoteDialog` tách đêm thứ Sáu, thứ Bảy). Đề nghị QA ghi lỗi P2 cho ARC-PR82-01 |

## 7. Giả định
- G-ARC-82-1: chấp nhận giả định của FE: ô có số nhưng `calc` rỗng vì bản xem lỗi thì hiện `–`. Lý do:
  - nhãn nói ít đi chứ không nói sai;
  - bảng tổng ẩn, có câu lỗi;
  - lưu đơn để máy chủ tự tính giá (probe A).
- G-ARC-82-2: luật (A) của thẻ PR82-01 là đề xuất của ARC, chờ DOM chốt. Điều cần chốt: ở bước tạo đơn, Nội bộ phải gõ đủ mọi đêm hoặc để trống hết; đêm miễn phí trong đơn có thu thì sửa ở Folio. Nếu DOM muốn tạo được đơn vừa có đêm thu vừa có đêm miễn phí ngay ở bước tạo, thì đi đường (B) cùng BE ở v1.0.5. Tới đó vẫn áp (A) để không mất tiền.
- Không có ESC. Không có việc nào cần chủ đầu tư quyết.

## 8. Phản hồi DOM (05/11, Round 4 – bước Phản hồi & sửa)

**DOM đồng ý quy tắc (A) cho v1.0.4. FE giữ cách đang làm.** Head `4344802c` của #82 đã có phần `validate()` và ca test. DOM sửa một ý trong đề xuất của ARC: đêm miễn phí trong đơn có thu **không** làm bằng FOC hay giảm 100 %. Quản lý sửa giá đêm đó về 0 ở Folio (A31, PR #71). Xem 8.2.

Người viết: DOM. Đã đọc thẻ PR82-01, G-ARC-82-2, BR-103, BR-104, BR-105, BR-421, BR-431–433, BR-904, BUG-R4-037, 038, 043. Đã đọc mã:
- `BookingDialog.tsx` @ `4344802c`;
- `pricing.service.ts`;
- `reservation-store.ts` `insertNights`;
- PR #71 (`folio-lines.service.ts`, `stay-night-pricing.ts`);
- `FolioDialog.tsx`.

DOM không chạy test.

### 8.1 Câu 1: đồng ý (A)
- Vì sao:
  - BR-105 viết "giá rỗng hoặc 0 → báo lỗi tại ô, không bỏ qua lặng lẽ". Khi chỉ gõ một phần số đêm, máy chủ có hai cách hiểu, và cả hai đều sai tiền mà không ai thấy:
    - bỏ các số đã gõ (đây là lỗi hiện tại);
    - coi ô trống là 0 đ.
  - (A) dùng cùng luật với OTA. Lễ tân chỉ phải nhớ một câu: "giá mỗi đêm: gõ đủ hoặc để trống hết".
  - Không đổi hợp đồng, không đổi máy chủ, vừa một PR nhỏ.
- Đã kiểm trong mã @ `4344802c`:
  - Với đơn Nội bộ, ô chỉ có số khi lễ tân đã gõ: `raw` = `ratesEdited || prefillLive`, và Nội bộ không có bản xem giá. Vì vậy "mọi ô có số" cũng là "mọi ô đã gõ", và `body()` gửi đủ giá.
  - Không còn đường nào ô có số mà số đó không được gửi.
- Kèm theo (không chặn #82): thẻ **FB-R4-DOM-UXD-PR82-01** ở 8.5, về câu lỗi và chữ hướng dẫn của Nội bộ.

### 8.2 Câu 2: đơn Nội bộ có cả đêm thu và đêm miễn phí trên v1.0.4
Cách làm (BR-105 v0.5.8 (4)):
1. **Lúc tạo đơn:** gõ giá cho **mọi** đêm. Đêm miễn phí gõ cùng giá với đêm có thu. Đừng gõ một số nhỏ cho có.
2. **Ghi chú nội bộ:** ghi đêm nào thu, đêm nào miễn phí, ai cho miễn phí, và câu "chờ quản lý sửa 0 đ".
3. **Quản lý hoặc chủ đầu tư:** mở Folio, chọn dòng Tiền phòng của đêm miễn phí, bấm Sửa, nhập giá 0, ghi lý do.
   - Làm ngay sau khi tạo đơn. Muộn nhất là **trước khi trả phòng**: A31 chỉ chạy khi đơn còn Giữ chỗ, Đã xác nhận hoặc Đang ở.
   - Lễ tân và lễ tân trưởng không sửa được về 0. Quản lý chưa làm thì đơn để như đã gõ. Folio vẫn hiện Còn phải thu, nên không mất tiền. Ghi sổ giao ca.
4. **Lễ tân kiểm:** Folio ghi đúng tiền phòng và Còn phải thu sau khi sửa.

Ví dụ: người nhà nhân viên ở căn 202, 3 đêm 12–15/11. Đêm 12 và 13/11 thu 300.000/đêm, đêm 14/11 miễn phí.

| Cách nhập | Kết quả |
|---|---|
| Gõ 300.000, 300.000, để trống đêm 14/11 | Có (A): Desk **chặn**. Tới v1.0.3: đơn **0 đ** cả 3 đêm, mất **600.000**, không ai được báo |
| Gõ 300.000 cả 3 đêm, rồi quản lý sửa đêm 14/11 về 0 | Đơn **900.000**, sau khi sửa là **600.000**. Còn phải thu 600.000. 2 đêm bán có thu (doanh thu phòng +600.000, vào ADR) và 1 đêm miễn phí (vào công suất) |
| Như dòng trên, khách trả phòng 14:00 ngày 15/11 | Phụ thu trả muộn tính trên đêm cuối của chính đơn (BR-421 (c)). Đêm 14/11 = 0 đ, nên phụ thu = **0**, không ghi dòng |
| Để trống cả 3 ô | Đơn **0 đ**, 3 đêm miễn phí |

Vì sao không dùng FOC hay giảm 100 % như ARC đề xuất:
- BR-431: FOC chỉ dùng cho khoản phát sinh. Giảm tiền phòng gọi là "giảm giá đặc biệt", và phải qua luồng duyệt BR-432/433:
  - mỗi đêm một yêu cầu;
  - từ 2 đêm thì tổng vượt cơ sở 1 đêm, nên phải chờ chủ đầu tư duyệt;
  - khoản này vào báo cáo FOC và cảnh báo BR-435.
- Một đêm Nội bộ miễn phí không phải khoản miễn ngoài chính sách. Nó giống một đơn Nội bộ 0 đ. A31 về 0 của #71 cho đúng nguồn `complimentary`, bắt buộc có lý do, có nhật ký tiền, và chỉ OWN/MGR làm được.
- Từ v1.0.5, cờ miễn phí đi theo tiền (BR-904). Ở v1.0.4, DATA đếm đêm miễn phí bằng `room_revenue_vnd = 0`. Cả hai cách đều đếm đúng đêm này.

Hai ca khác:
- **Phụ thuộc #71.** A31 về 0 chỉ có khi #71 vào v1.0.4 (P0, vẫn đang chờ gộp). Nếu #71 trượt khỏi bản cắt, cách dự phòng:
  - xin giảm giá đặc biệt 100 % cho đêm đó, lý do "Khác: Nội bộ – đêm miễn phí";
  - quản lý duyệt được 1 đêm; từ 2 đêm thì chủ đầu tư duyệt.
- **Đêm miễn phí quyết trong lúc ở, nối sau ngày đi:** dùng Gia hạn B13, đêm thêm mặc định 0 đ (BR-421 (a)).
  - Không dùng cách này cho đêm đã biết từ lúc đặt, vì căn có thể bị bán mất trước khi kịp gia hạn.
  - Không tách thành 2 đơn (một đơn có thu, một đơn 0 đ). Tách thì phải trả phòng rồi nhận phòng lại giữa chừng, nhập lại giấy tờ, khai báo lại, và buồng phòng nhận 2 việc dọn (sổ tay 2.12 bước 7).

### 8.3 Câu 3: có cập nhật BR. Bản mới là **v0.5.8**, không đổi con số nào
- **BR-105** thêm nhánh "Đơn kênh Nội bộ lúc tạo đơn", gồm 7 ý:
  1. để trống mọi đêm → 0 đ, nguồn `complimentary`;
  2. gõ mọi đêm → `manual`, là đêm bán có thu;
  3. gõ một phần → Desk chặn. Ô trống không bao giờ được hiểu là 0 đ trong đơn có đêm thu tiền;
  4. đơn trộn đêm thu và đêm miễn phí: làm như 8.2;
  5. phụ thu nhận sớm và trả muộn tính theo đêm của chính đơn;
  6. đêm quyết trong lúc ở thì dùng B13;
  7. cho gõ 0 ngay lúc tạo đơn: để bản sau, và ô trống vẫn bị chặn.
  
  Ví dụ căn 202 như ở 8.2.
- **BR-421 (b):** thêm tham chiếu tới BR-105 v0.5.8.
- Đã cập nhật mục 17 (dòng decision-log đề xuất) và mục 18 (lịch sử thay đổi).
- `node product/tests/tools/validate-fixtures.mjs`: **0 lỗi**. Không thêm mã BR mới. BR-105 vẫn có dòng oracle.
- Về đường (B): DOM **không cần** (B) ở v1.0.5.
  - Lý do: ca này hiếm, và A31 đã đủ dùng.
  - (B) theo kiểu "ô trống = 0 đ" bị cấm theo BR-105 (3).
  - Nếu PO muốn bớt một bước cho quản lý, có thể làm (B′): cho gõ **0** tay vào ô giá Nội bộ lúc tạo đơn. Đây là Suggestion, PO xếp vào backlog. (B′) không mở quyền mới, vì lễ tân vốn đã tạo được đơn Nội bộ 0 đ. Còn sửa về 0 **sau khi tạo đơn** thì vẫn chỉ OWN/MGR làm được.

### 8.4 Việc kéo theo
- **FE (#82):** giữ `4344802c`. Ca test của ARC đã có trong `v104-booking-rate-carryover.test.tsx`. ARC xem lại khi review lượt sau.
- **BA (sổ tay, mục tạo đơn bước 4 "Nội bộ"):** viết 3 gạch: miễn phí thì để trống mọi ô; có thu thì gõ mọi đêm; đơn trộn thì làm 4 bước ở 8.2. Đổi chữ "không tính doanh thu" thành "mặc định không thu tiền".
- **QA:** ghi lỗi và chốt mức theo `test-strategy.md` mục 8. DOM không đề xuất mức. Ca hồi quy: Nội bộ 2 đêm, gõ đêm 1 thì phải thấy chặn và không có POST.
- **DATA/OPS (nên làm):** đếm số đơn Nội bộ 0 đ tạo từ 02/11, để quản lý đối chiếu với Ghi chú nội bộ. Số đã gõ không bao giờ được gửi lên, nên dữ liệu không tự tìm ra được. Repo chỉ ghi số đếm, không ghi dữ liệu khách.

### 8.5 Thẻ

#### FB-R4-DOM-UXD-PR82-01
- Mức độ: Minor. Không chặn v1.0.4. FE kịp thì làm trong #82, không kịp thì để v1.0.5.
- Vị trí:
  - `booking.error.rate_empty` khi đơn Nội bộ gõ một phần số đêm (`BookingDialog.tsx` @ `4344802c`, khối `validate()` của PR82-01);
  - `bk.internal_help` trong `gen_strings.py` dòng 720.
- Vấn đề:
  - Câu "Nhập giá mỗi đêm (lớn hơn 0)." đẩy lễ tân gõ giá vào cả đêm định miễn phí.
  - `bk.internal_help` ghi "không tính doanh thu", lệch BR-904 v0.5.5: "Nội bộ có thu" vào doanh thu và ADR.
- Vì sao quan trọng: lễ tân gõ giá vào đêm miễn phí để qua được câu chặn, rồi quên nhờ quản lý sửa. Khách bị đòi tiền một đêm đã hứa miễn phí. Folio có hiện số nên không mất tiền, nhưng thành chuyện khiếu nại ở quầy.
- Đề xuất sửa (UXD quyết chữ):
  - câu lỗi riêng cho Nội bộ. VI: "Đơn Nội bộ: nhập giá cho mọi đêm, hoặc xóa hết nếu miễn phí cả đơn." EN: "Internal stay: enter a rate for every night, or clear all if the whole stay is free.";
  - `bk.internal_help`. VI: "Phòng dùng nội bộ, vẫn chiếm phòng. Miễn phí: để trống giá. Có thu: nhập giá mọi đêm." EN: "Internal use, still blocks the room. Free: leave rates empty. Charged: enter a rate for every night.".
- Trạng thái: Open

### 8.6 Dòng decision-log đề xuất (ORC ghi)

| Ngày | Round | Quyết định | Người | Ghi chú |
|---|---|---|---|---|
| 2026-11-05 | 4 | **DOM chốt luật cho thẻ ARC-PR82-01: đồng ý (A) cho v1.0.4 (BR-105 v0.5.8).** Đơn Nội bộ lúc tạo đơn gõ giá đủ mọi đêm (có thu, `manual`) hoặc để trống hết (0 đ, `complimentary`). Gõ một phần thì Desk chặn như OTA. Ô trống không bao giờ là 0 đ trong đơn có đêm thu. Đơn có cả đêm thu và đêm miễn phí: gõ mọi đêm, rồi quản lý hoặc chủ đầu tư sửa đêm miễn phí về 0 ở Folio (A31, cần #71) trước khi trả phòng. Không dùng FOC hay giảm 100 %. Không cần (B) ở v1.0.5 | DOM | `rounds/round-04/reviews/ARC-on-v104-pr82-rate-source.md` mục 8. Ví dụ căn 202, 3 đêm: chặn thay cho mất 600.000. Dự phòng nếu #71 trượt: giảm giá đặc biệt 100 % (BR-431–433). Thẻ FB-R4-DOM-UXD-PR82-01 (Minor): câu lỗi Nội bộ và `bk.internal_help`. Không có ESC |

## 9. ARC lượt 2 – delta `e8b1c4e9..4344802c` (05/11)

- Đối tượng: `git diff e8b1c4e9 4344802c`, gồm 2 commit, 3 tệp:
  - `d8346931`: FB-R4-UXD-FE-PR82-01, chữ BR-107 khi chờ bản xem;
  - `4344802c`: FB-R4-ARC-FE-PR82-01, Nội bộ gõ đủ hoặc không gõ.
- Tệp đổi:
  - `BookingDialog.tsx`;
  - `v104-rate-source-typed.test.tsx`: thêm ca "7 đêm → 3";
  - `v104-booking-rate-carryover.test.tsx`: thêm ca Nội bộ.
- Cách kiểm: worktree tạm ở `4344802c`, đã xóa. Không commit, không đẩy.
- Đã đọc mục 8 của DOM trước khi ghi. Mục này ghi nối sau, không sửa mục 8.

### 9.1 Kết luận: **ĐẠT CÓ ĐK** cho `4344802c`
- Điều kiện 2 của lượt 1 (thẻ PR82-01) **đã xong**:
  - FE áp luật (A);
  - DOM chốt ở BR-105 v0.5.8 (mục 8);
  - ARC kiểm lại bằng đột biến và chạy trên mã trước bản sửa (9.3).
- Điều kiện còn lại:
  1. CI trên `4344802c` xanh hết. Lúc kiểm:
     - `format · lint · audit · test · build` đã `pass`;
     - `docker images build · E2E smoke` và `landing LP-v1 · Playwright` còn `pending`;
     - lượt chạy của `e8b1c4e9` đã bị hủy vì có lần đẩy mới, nên điều kiện 1 của lượt 1 chuyển sang head này.
  2. Khi #75 vào `main`: đổi base của #82 sang `main`, rồi chạy lại 4 tệp test và CI. Điều kiện này giữ nguyên.
- Trạng thái thẻ:
  - **FB-R4-ARC-FE-PR82-01**: Fixed.
  - **FB-R4-UXD-FE-PR82-01**: ARC xác nhận đã sửa đúng. UXD đóng thẻ.
  - **FB-R4-ARC-FE-PR82-02** vẫn Open, để v1.0.5.
  - Thẻ mới **PR82-03** và **PR82-04**: Minor, không chặn.

### 9.2 Xem delta

`d8346931` (chữ BR-107):
- `losShown = priceWaiting ? 0 : losPct` thay cho `losPct` ở mọi chỗ là **chữ**: dòng "Sau giảm" từng đêm, câu `rate.tier_*` dưới bảng giá, và đuôi `· rate.pre_tier_short`.
- Dòng phụ `sale.los_applied` / `bk.los_none` ẩn hẳn khi chờ.
- `ratesLocked` vẫn dùng `losPct` của bản xem. ARC đồng ý: đây là chốt để không giảm hai lần, không phải chữ.
  - Ghi nhận, không mở thẻ: với máy chủ cũ thiếu `calendarRateVnd`, trong lúc chờ các ô vẫn chỉ đọc mà không có câu `rate.tier_locked`.
  - Ô chưa gõ khi đó vốn đang trống, và khoảng chờ chỉ vài trăm ms.
- Tiền không đổi. `roomTotal`, `body()` và `submit()` giữ nguyên. Các ô tiền vẫn là `–` như lượt 1.
- Nhãn dòng phụ thu nay là `priceWaiting ? extra : (calc.extraGuestCount ?? extra)`. Cách này sinh ra một câu sai mới khi đổi sang căn có định mức lớn hơn: thẻ PR82-04.

`4344802c` (luật Nội bộ):
- Điều kiện thành `(form.group === 'ota' || form.group === 'internal') && some(raw) && some(!raw)`.
- Nội bộ không có bản xem (`liveKey = null`), nên ô chỉ có `raw` khi lễ tân đã gõ. "Có ô có số và có ô trống" vì vậy đúng bằng "gõ một phần". Kết quả:
  - gõ đủ: `body()` gửi mọi đêm với `edited:true`. Test so đúng payload `[500000, 400000]`;
  - không gõ: `nightlyRates` không gửi, máy chủ ghi 0 đ `complimentary`.
- `hold()` bỏ lỗi `rates` và `nightlyRates[…]` trước khi kiểm, nên Giữ chỗ không bị ảnh hưởng.
- Ô gõ 0 vẫn bị chặn ở từng đêm, khớp BR-105 v0.5.8 (7): cho gõ 0 là việc của bản sau.
- Không đổi hợp đồng, không đổi máy chủ.

### 9.3 Test (load 8–14)

| Việc | Kết quả |
|---|---|
| 4 tệp ở `4344802c`: `v104-rate-source-typed`, `v104-hold-typed-rate-lock`, `v104-booking-rate-carryover`, `booking` | **49/49 xanh**, 24 s |
| Toàn bộ admin-web ở `4344802c` | **945/945 xanh**, 83 tệp |
| Hai ca mới chạy với `BookingDialog.tsx` của `e8b1c4e9` | Cả 2 đỏ: ca BR-107 vẫn thấy "Lượt ở 3 đêm được giảm 10%…"; ca Nội bộ không có `rate_empty` |
| Hai ca mới chạy với `BookingDialog.tsx` của `d8346931` | Ca BR-107 xanh, ca Nội bộ đỏ. Mỗi commit sửa đúng ca của nó |
| **V1**: điều kiện trở lại `form.group === 'ota'` | Ca Nội bộ đỏ. Bắt được |
| **V2**: điều kiện chỉ còn `form.group === 'internal'` (bỏ OTA) | **Lọt**: 2 tệp 34/34, toàn bộ admin-web 945/945. Luật OTA chưa có test nào: thẻ PR82-03 |
| **L1**: `losShown = losPct` | Ca BR-107 đỏ. Bắt được |
| **L2**: không ẩn dòng phụ BR-107 khi chờ | Ca BR-107 đỏ. Bắt được |
| `tsc --noEmit`, `eslint` và `prettier --check` trên 3 tệp đổi | Sạch |
| Probe dòng phụ thu (test tạm, đã xóa) | Xem thẻ PR82-04 |

Nhận xét về test mới:
- Ca BR-107 giữ bản xem 3 đêm bằng `server.use`. Ca này kiểm cả hai câu của lượt ở 7 đêm trước khi đổi, nên chắc chắn câu đó có mặt rồi mới vắng đi.
- Ca Nội bộ kiểm cả nhánh chặn (không có POST) lẫn nhánh gõ đủ (payload đúng từng đêm). Tốt.

### 9.4 Về phản hồi DOM (mục 8)
- ARC nhận sửa của DOM. Đêm miễn phí trong đơn Nội bộ có thu được quản lý sửa về 0 ở Folio (A31, cần #71). **Không** dùng FOC hay giảm 100 % như câu "Đề xuất sửa" của thẻ PR82-01 ở mục 5. Lý do theo DOM 8.2: BR-431–433, luồng duyệt và báo cáo FOC.
  - G-ARC-82-2 đóng.
  - Thêm một phụ thuộc: cách làm này cần **#71** vào v1.0.4. Nếu #71 trượt thì dùng cách dự phòng của DOM: giảm giá đặc biệt 100 %.
- Thẻ FB-R4-DOM-UXD-PR82-01 (câu lỗi riêng cho Nội bộ, `bk.internal_help`): ARC đồng ý.
  - Khi UXD cấp khóa, FE phải tách `if` chung của OTA và Nội bộ thành hai nhánh. Việc này đụng đúng dòng mà đột biến V2 lọt.
  - Nên làm thẻ PR82-03 cùng lúc.

### 9.5 Thẻ

#### FB-R4-ARC-FE-PR82-01: cập nhật
- Trạng thái: **Fixed** @ `4344802c`.
  - Đột biến V1 bắt được; ca test đỏ trên `e8b1c4e9` và `d8346931`.
  - DOM chốt luật (A) ở BR-105 v0.5.8.
  - Cách xử lý đêm miễn phí theo DOM 8.2, thay cho câu FOC/100 % ở mục 5.

#### FB-R4-ARC-FE-PR82-03
- Mức độ: Minor (chỉ thêm test). Không chặn. Nên làm cùng lúc tách câu lỗi của thẻ DOM-UXD-PR82-01. Không kịp thì để v1.0.5.
- Vị trí:
  - `v104-booking-rate-carryover.test.tsx` (thiếu ca);
  - `BookingDialog.tsx`, khối `validate()` của PR82-01.
- Vấn đề:
  - Bỏ OTA khỏi điều kiện (đột biến V2) mà cả 945 test vẫn xanh. Phần OTA của luật có từ v1.0.x và chưa từng có test.
  - Nay luật OTA chung một `if` với Nội bộ. Lần tách câu lỗi theo thẻ DOM-UXD-PR82-01 sẽ sửa đúng dòng này.
- Vì sao quan trọng: đơn OTA gõ một phần mà lọt qua thì `body()` không gửi giá, máy chủ lấy lịch OTA cho mọi đêm, và số OTA đã gõ mất không báo. Đây là cùng loại lỗi tiền với PR82-01.
- Đề xuất sửa: thêm ca sinh đôi với ca Nội bộ.
  - OTA, 2 đêm, nhập mã OTA và khách, gõ đêm 1. Bấm Tạo đơn thì thấy `rate_empty` dưới bảng giá, không có POST.
  - Gõ đêm 2 rồi bấm lại thì POST có 2 đêm, `edited:true`.
  - Probe lượt 1 của ARC đã chạy nửa đầu: Desk chặn bằng "Nhập giá mỗi đêm (lớn hơn 0).".
- Trạng thái: Open

#### FB-R4-ARC-FE-PR82-04
- Mức độ: Minor. Chỉ là phần hiện, trong lúc chờ bản xem. Không chặn.
- Vị trí: `BookingDialog.tsx`, dòng phụ thu của bảng tổng (`extraFee > 0 ? … occ.fee_line …`). Nhãn đổi ở `d8346931`.
- Vấn đề:
  - Dòng phụ thu hiện hay không vẫn theo `extraFee` của bản xem cũ, còn số người trong nhãn nay lấy `extra` của căn mới.
  - Probe: 3 người lớn ở căn 101 (định mức 2), đổi sang căn 301 (định mức 4), giữ bản xem lại. Trong lúc chờ, bảng tổng ghi **"Phụ thu 0 người vượt định mức × 1 đêm (BR-110) –"**.
  - Bản xem về thì dòng này biến mất (tổng 958.000, không phụ thu).
  - Chiều ngược lại không sai: bản xem cũ không có phụ thu thì trong lúc chờ không có dòng nào.
- Vì sao quan trọng: đây là câu tự mâu thuẫn ngay trước mắt lễ tân, cùng loại với UXD-PR82-01 vừa sửa. Không sai tiền: nút Tạo đơn đang chờ, ô tiền là `–`.
- Đề xuất sửa (UXD quyết cách hiện):
  - ẩn dòng phụ thu khi chờ, như dòng phụ BR-107: `extraFee > 0 && !priceWaiting`;
  - nhãn trở lại `calc.extraGuestCount ?? extra`;
  - test: đúng ca probe trên. Trong lúc chờ không có dòng "Phụ thu". Bản xem của 301 về thì vẫn không có.
- Trạng thái: Open

### 9.6 Dòng decision-log đề xuất (ORC ghi)

| Ngày | Round | Quyết định | Người | Ghi chú |
|---|---|---|---|---|
| 2026-11-05 | 4 | **ARC – review PR #82 lượt 2 @ `4344802c`: ĐẠT CÓ ĐK.** `d8346931` ẩn chữ BR-107 trong lúc chờ bản xem (câu dưới bảng giá, "Sau giảm", dòng phụ của bảng tổng), đóng UXD-PR82-01. `4344802c` chặn đơn Nội bộ gõ một phần số đêm như OTA (luật A, DOM chốt ở BR-105 v0.5.8), đóng ARC-PR82-01. Hai ca mới đỏ trước bản sửa. 4 tệp 49/49, admin-web 945/945. Đột biến bỏ Nội bộ khỏi điều kiện bị bắt. ĐK: các job CI còn `pending` (docker/E2E, landing) phải xanh; sau #75 đổi base sang `main` rồi chạy lại | ARC | `rounds/round-04/reviews/ARC-on-v104-pr82-rate-source.md` mục 9. Thẻ mới Minor, không chặn: PR82-03 (luật OTA gõ một phần chưa có test; đột biến bỏ OTA vẫn 945/945), PR82-04 (trong lúc chờ, bảng tổng ghi "Phụ thu 0 người…"). ARC nhận sửa của DOM: đêm miễn phí trong đơn Nội bộ có thu sửa về 0 ở Folio (A31, cần #71), không dùng FOC hay giảm 100 % |

## 10. ARC lượt 3 – delta `4344802c..0e48686c` (05/11)

- Đối tượng: `git diff 4344802c 0e48686c`, gồm 1 commit `0e48686c` và 8 tệp:
  - `BookingDialog.tsx`;
  - 2 tệp test;
  - `gen_strings.py` và các tệp sinh ra từ nó: JSON VI/EN, `strings-tables.md`, `strings.js`.
- Ba việc:
  - FB-R4-ARC-FE-PR82-03: ca test OTA sinh đôi với ca Nội bộ;
  - FB-R4-ARC-FE-PR82-04: ẩn dòng phụ thu khi chờ bản xem;
  - FB-R4-DOM-UXD-PR82-01: khóa mới `booking.error.rate_empty_internal`, viết lại `bk.internal_help`.
- Cách kiểm: worktree tạm ở `0e48686c`, đã xóa. Không commit, không đẩy.
- Đã đọc lại tệp này ngay trước khi ghi. Mục 10 ghi nối sau mục 9, không sửa mục nào ở trên.

### 10.1 Kết luận: **ĐẠT CÓ ĐK** cho `0e48686c`
- Đóng thẻ:
  - FB-R4-ARC-FE-PR82-03: Fixed;
  - FB-R4-ARC-FE-PR82-04: Fixed.
- FB-R4-DOM-UXD-PR82-01:
  - phần mã của ARC đạt;
  - chữ của câu do UXD duyệt. DOM đề xuất "xóa hết", FE viết "để trống hết". Cách viết của FE cùng cách nói với `bk.internal_help`.
- Điều kiện còn lại:
  1. CI trên `0e48686c` xanh hết. Lúc kiểm:
     - còn `pending`: `format · lint · audit · test · build` và `landing LP-v1 · Playwright`;
     - lượt chạy của `4344802c` đã bị hủy khi có lần đẩy mới. Vì vậy job `docker images build · E2E smoke` chưa từng xong trên head nào của #82, và phải xanh trên `0e48686c`.
  2. Khi #75 vào `main`: đổi base của #82 sang `main` và sinh lại chuỗi. ORC đã nhận việc này. Sau đó chạy lại 4 tệp test và CI.
- Thẻ còn Open:
  - FB-R4-ARC-FE-PR82-02 (đổi số người thì bảng tổng của số người cũ), để v1.0.5;
  - FB-R4-ARC-FE-PR70-02 (thẻ của #70).

### 10.2 Xem delta
- `validate()`:
  - điều kiện chung của OTA và Nội bộ giữ nguyên;
  - chỉ chọn câu theo kênh: Nội bộ dùng `booking.error.rate_empty_internal`, OTA giữ `booking.error.rate_empty`;
  - ô gõ 0 hoặc số không hợp lệ vẫn báo `booking.error.rate_empty` tại ô, đúng ghi chú của khóa.
- Dòng phụ thu:
  - `extraFee > 0 && !priceWaiting`, nên khi chờ thì ẩn, giống dòng phụ BR-107;
  - nhãn trở lại `calc.extraGuestCount ?? extra`;
  - ô tiền không còn nhánh `–`, vì dòng đã ẩn;
  - không còn câu "Phụ thu 0 người".
- Tiền không đổi. `body()`, `submit()` và `hold()` giữ nguyên.
- Chuỗi:
  - `strings.js` so giữa `4344802c` và `0e48686c`: VI và EN mỗi bên thêm `booking.error.rate_empty_internal` và đổi `bk.internal_help`. Không bớt khóa nào. RU không đổi;
  - chạy lại `gen_strings.py` (3475 chuỗi + 8 mẫu) không ra diff.
- Ghi nhận, không mở thẻ:
  - chữ cũ "không tính doanh thu" còn ở bản chụp `content-guide.md` dòng 954, ở chữ dự phòng của hi-fi `09-booking.html` dòng 67, ở sổ tay `user-manual-v1.0.md` dòng 852 và ở `guides/02-le-tan.md` dòng 337;
  - phần sổ tay DOM đã giao BA ở 8.4;
  - hi-fi lấy chữ từ `strings.js` lúc chạy.

### 10.3 Test (load 3–13)

| Việc | Kết quả |
|---|---|
| 4 tệp ở `0e48686c`: `v104-rate-source-typed`, `v104-hold-typed-rate-lock`, `v104-booking-rate-carryover`, `booking` | **51/51 xanh**, 25 s. FE báo 53/53, có lẽ vì chạy thêm `i18n-keys` (2 ca). Toàn bộ admin-web đều xanh, nên không lệch gì |
| Toàn bộ admin-web ở `0e48686c` | **947/947 xanh**, 83 tệp |
| **V2** chạy lại: bỏ OTA khỏi điều kiện | Ca OTA mới **đỏ**. Lượt 2 đột biến này lọt qua cả 945 test, nay bị bắt |
| **V1**: bỏ Nội bộ khỏi điều kiện | Ca Nội bộ đỏ |
| **K1**: Nội bộ dùng lại `booking.error.rate_empty` | Ca Nội bộ đỏ |
| **F1**: bỏ `!priceWaiting` ở dòng phụ thu | Ca PR82-04 đỏ |
| 3 ca của lượt này chạy với `BookingDialog.tsx` của `4344802c` | 2 ca đỏ, đúng chỗ: PR82-04 nhận "Phụ thu 0 người vượt định mức × 2 đêm (BR-110)"; ca Nội bộ nhận câu cũ. Ca OTA xanh, vì luật OTA đã có từ trước: ca này để khóa luật lại, và V2 chứng minh nó khóa được |
| `tsc --noEmit`, `eslint` và `prettier --check` trên 3 tệp mã và 2 tệp JSON | Sạch |

Nhận xét về test mới:
- Ca OTA:
  - kiểm cả nhánh chặn (đúng câu của OTA, không có câu Nội bộ, không có POST);
  - kiểm cả nhánh gõ đủ (payload 2 đêm, `edited:true`).
- Ca PR82-04:
  - dựng đúng tình huống probe của ARC (3 người lớn, căn 101 sang căn 301, giữ bản xem);
  - kiểm không có dòng với cả `n = 0` và `n = 1`, trong lúc chờ và sau khi bản xem về.

### 10.4 Thẻ: cập nhật
- **FB-R4-ARC-FE-PR82-03**: Fixed @ `0e48686c`. Đột biến V2 nay bị bắt.
- **FB-R4-ARC-FE-PR82-04**: Fixed @ `0e48686c`. Đột biến F1 bị bắt; ca test đỏ trên `4344802c`.

### 10.5 Dòng decision-log đề xuất (ORC ghi)

| Ngày | Round | Quyết định | Người | Ghi chú |
|---|---|---|---|---|
| 2026-11-05 | 4 | **ARC – review PR #82 lượt 3 @ `0e48686c`: ĐẠT CÓ ĐK.** Thêm ca OTA gõ một phần số đêm: đột biến bỏ OTA khỏi điều kiện nay bị bắt, đóng ARC-PR82-03. Dòng phụ thu ẩn khi chờ bản xem, không còn câu "Phụ thu 0 người", đóng ARC-PR82-04. Nội bộ có câu chặn riêng `booking.error.rate_empty_internal` và `bk.internal_help` viết lại theo BR-105 v0.5.8 (phần mã của DOM-UXD-PR82-01; chữ do UXD duyệt). 4 tệp 51/51, admin-web 947/947. **ĐK:** CI trên `0e48686c` xanh hết, gồm `docker images build · E2E smoke` chưa từng xong trên head nào của #82. Sau #75 đổi base sang `main` và sinh lại chuỗi (ORC), rồi chạy lại | ARC | `rounds/round-04/reviews/ARC-on-v104-pr82-rate-source.md` mục 10. Còn Open: ARC-PR82-02 (v1.0.5). Sổ tay còn chữ "không tính doanh thu", đã giao BA ở mục 8.4 |

## 11. ARC lượt 4 – `0e48686c..a4cb703a`, #82 đã chuyển base sang `main` (05/11)

- Đối tượng: head `a4cb703a`, base `main`. Trên `0e48686c` có thêm hai commit:
  - `a931c50b`: gộp `origin/main` @ `ebca5a95` (#75);
  - `a4cb703a`: UXD PR82-03 (chỉ chữ EN) và PR82-04 (câu riêng tại ô cho đêm Nội bộ gõ 0).
- Kiểm ngắn theo yêu cầu ORC. Worktree tạm ở `a4cb703a`, đã xóa. Không commit, không đẩy.
- Đã đọc lại tệp này ngay trước khi ghi. Mục 11 ghi nối sau mục 10, không sửa mục nào ở trên.

### 11.1 Kết luận: **ĐẠT CÓ ĐK** cho `a4cb703a`

| Câu ORC hỏi | Trả lời |
|---|---|
| `a4cb703a` chỉ đổi câu? Đơn còn bị chặn, không có POST? OTA/Trực tiếp không đổi? | **Đúng cả ba.** Phép thử `r.raw && !(parseVnd(r.raw) > 0)` giữ nguyên, khóa lỗi `nightlyRates[i].amountVnd` vẫn được đặt, nên `submit()` vẫn dừng trước POST. Chỉ chọn câu: Nội bộ dùng `booking.error.rate_zero_internal`, mọi kênh khác (Trực tiếp, CTV, OTA) giữ `booking.error.rate_empty`. Ca test mới thấy câu mới dưới cả hai ô, không thấy câu cũ, không có POST |
| `git diff 0e48686c a931c50b` chỉ là nội dung của main cộng chuỗi sinh lại? Tệp của #82 có đổi không? | **Đúng.** 42 tệp: mọi tệp ngoài 8 tệp của #82 trùng blob với `ebca5a95`. Các dòng +/− của #82 trong `BookingDialog.tsx`, hai tệp test và `gen_strings.py` trùng hệt trước và sau khi gộp (87/80/230/6 dòng). Main không đụng ba tệp mã/test đó kể từ `9b45cef3`. `--remerge-diff`: tay chỉ gỡ xung đột ở `strings-{en,vi}.json` và `strings.js` |

Điều kiện:
1. CI trên `a4cb703a` xanh hết. Lúc kiểm, `format · lint · audit · test · build` đang chạy, các job khác `pass`. Lượt chạy của `0e48686c` và `4344802c` đều bị hủy khi có lần đẩy mới, nên `docker images build · E2E smoke` (chạy sau job build) **chưa từng xong trên head nào của #82**. Job này phải xanh trên `a4cb703a`.
- Điều kiện "đổi base sang `main`, sinh lại chuỗi" của các lượt trước: **đã xong** (ORC, FE).

Thẻ mới: **FB-R4-ARC-FE-PR82-05** (Minor, chỉ test, không chặn).

### 11.2 Test (load 5–10)

| Việc | Kết quả |
|---|---|
| 4 tệp liên quan cộng `i18n-keys` ở `a4cb703a` | **54/54 xanh**, khớp số FE báo |
| Toàn bộ admin-web ở `a4cb703a` | **954/954 xanh**, 85 tệp. Khớp số FE báo |
| `gen_strings.py` chạy lại ở `a931c50b` (3476 chuỗi) và ở `a4cb703a` (3477 chuỗi) | Không ra diff ở cả hai commit |
| `strings.js` so `ebca5a95` với `a931c50b` | VI và EN mỗi bên thêm 2 khóa của #82 (`bk.src_typed`, `booking.error.rate_empty_internal`) và đổi `bk.internal_help`. Không bớt khóa nào |
| `strings.js` so `0e48686c` với `a931c50b` | Chỉ thêm `co.minibar_cabinet_counting` của main (#81). Không mất khóa nào |
| **Z2**: Nội bộ dùng lại `booking.error.rate_empty` tại ô | Ca mới đỏ |
| **Z3**: bỏ hẳn phép thử ô ≤ 0 | Ca mới đỏ (có POST). Đơn Nội bộ gõ 0 bị chặn là do phép thử này, và có test khóa |
| **Z1**: mọi kênh dùng `booking.error.rate_zero_internal` | **Lọt**: toàn bộ admin-web 954/954 xanh. Thẻ PR82-05 |
| `tsc --noEmit`, `eslint` và `prettier --check` trên các tệp đổi | Sạch |

### 11.3 Thẻ

#### FB-R4-ARC-FE-PR82-05
- Mức độ: Minor (chỉ thêm test). Không chặn #82. Làm nếu FE còn đẩy commit vào #82, không thì để v1.0.5.
- Vị trí:
  - `BookingDialog.tsx` @ `a4cb703a`: phép thử ô ≤ 0 trong `validate()`, nhánh chọn câu theo kênh;
  - `v104-booking-rate-carryover.test.tsx`: thiếu ca.
- Vấn đề:
  - Đột biến Z1 (mọi kênh hiện câu "Miễn phí: để trống ô…") lọt qua cả 954 test. Không test nào khóa câu tại ô của Trực tiếp, CTV hay OTA.
  - Phép thử ô ≤ 0 của các kênh đó cũng chưa có test riêng. Đột biến Z3 chỉ bị ca Nội bộ bắt.
  - Đọc mã thì OTA và Trực tiếp **không đổi**: nhánh chỉ là `form.group === 'internal'`. Chỉ là chưa có test khóa.
- Vì sao quan trọng:
  - Câu "Miễn phí: để trống ô" hiện ở đơn Trực tiếp hay OTA là câu sai: ô trống ở đó không có nghĩa là miễn phí. Trực tiếp có ô gõ thì luật BUG-R4-037 chặn; OTA thì máy chủ lấy lịch OTA.
  - Lần sửa câu sau có thể làm lệch mà CI vẫn xanh.
- Đề xuất sửa: thêm một ca. Trực tiếp, 1 đêm, gõ `0` rồi bấm Tạo đơn. Phải thấy `booking.error.rate_empty` dưới ô, không thấy `booking.error.rate_zero_internal`, và không có POST. Có thể thêm cùng cách cho OTA.
- Trạng thái: Open

### 11.4 Ghi nhận khác
- Chữ: UXD đã duyệt PR82-03 và PR82-04. Ghi chú của `booking.error.rate_empty_internal` trong `gen_strings.py` đã cập nhật đúng: ô gõ 0 của Nội bộ nay dùng `rate_zero_internal`.
- Khi DOM làm đường (B′) (cho gõ 0 lúc tạo đơn), phải bỏ khóa `rate_zero_internal` và phép thử ở đây. Ghi chú của khóa đã nhắc việc này.
- Thẻ còn Open: FB-R4-ARC-FE-PR82-02 (v1.0.5), PR82-05 (mới), FB-R4-ARC-FE-PR70-02.

### 11.5 Dòng decision-log đề xuất (ORC ghi)

| Ngày | Round | Quyết định | Người | Ghi chú |
|---|---|---|---|---|
| 2026-11-05 | 4 | **ARC – review PR #82 lượt 4 @ `a4cb703a` (base `main`): ĐẠT CÓ ĐK.** `a931c50b` gộp main @ `ebca5a95` (#75): ngoài 8 tệp của #82, mọi tệp trùng main. Phần thay đổi của #82 giữ nguyên dòng nào cũng vậy. Chỉ gỡ xung đột ở chuỗi sinh ra; sinh lại thì không ra diff. `a4cb703a` chỉ đổi câu: đêm Nội bộ gõ 0 hiện `booking.error.rate_zero_internal`, vẫn chặn, không POST. OTA, Trực tiếp và CTV giữ `rate_empty`. 54/54 (4 tệp cộng i18n), admin-web 954/954. **ĐK:** CI trên `a4cb703a` xanh hết, gồm `docker images build · E2E smoke` chưa từng xong trên head nào của #82 | ARC | `rounds/round-04/reviews/ARC-on-v104-pr82-rate-source.md` mục 11. Thẻ mới ARC-PR82-05, Minor, chỉ test, không chặn: chưa có test khóa câu và phép thử ô ≤ 0 của Trực tiếp/OTA (đột biến cho mọi kênh hiện câu Nội bộ vẫn 954/954). Còn Open: ARC-PR82-02 (v1.0.5) |
