# ARC review – PR #76: ghim giờ ban ngày cho 2 ca "Hôm nay" của `v104-holds-feb` (chỉ sửa test)

- Người review: ARC | Round 4 – v1.0.4 – Bước **Review chéo** | 05/11/2026
- Đối tượng: `v104/fe-holds-feb-pin-daytime` @ `f96dbbe9`, một commit cắt từ `main` `476fd9b8`. Tệp duy nhất là `apps/admin-web/src/__tests__/v104-holds-feb.test.tsx` (+3/−0): một dòng import và hai lời gọi `pinDaytime()`.
- Đọc kèm:
  - client: `src/test/clock.ts`, `src/app/dates.ts`, `pages/TodayPage.tsx`, `pages/dashboard/useDashboard.ts`, `mocks/dashboard.ts`;
  - máy chủ: `services/api/src/modules/reporting/internal/dashboard.service.ts`, `platform/public/property-context.ts`.
- ARC tự dựng một bộ giả giờ (không commit, đã xóa): một tệp setup giả `Date` về giờ cần thử theo giờ Asia/Ho_Chi_Minh, chạy **trước** `setup.ts` để dữ liệu MSW mẫu cũng được dựng ở giờ đó. Bộ này viết độc lập với `pin-proof/` của FE. Chỉ chạy tệp `v104-holds-feb`.

## Phán quyết (head `f96dbbe9`): **ĐẠT CÓ ĐK**

Điều kiện duy nhất: **CI xanh ở `f96dbbe9`**. Lúc ghi review, mọi job đều đang chờ.

Bản sửa đúng, và không che lỗi đêm BR-010 nào. Ba thẻ dưới đây không chặn gộp. Thẻ 01 là một lỗi riêng của mã sản phẩm mà ARC thấy khi quét theo câu 2; QA ghi lỗi đó riêng.

## 1. Ghim 12:00 có che một lỗi đêm BR-010 thật không

- **Ngày của bảng "Hôm nay" do máy chủ chọn, không do Desk.**
  - Desk gọi `getArrivalsDepartures({ propertyId })` và không gửi `date` (`useDashboard.ts` 79).
  - Máy chủ lấy `p.today = businessDate(now, tz, rollover)`, tức ngày làm việc theo BR-010 (`property-context.ts` 54, `dashboard.service.ts` 87–89).
  - Đường này không có logic ngày ở phía client. Vì vậy không có lỗi đêm phía client để hai ca này bắt.
- **Ca đỏ ban đêm là do test, không phải do BR-010.**
  - Mock MSW của bảng dùng `todayLocal()`, tức ngày **lịch** (`mocks/dashboard.ts` 326; `dashboard/tonight` ở dòng 321 cũng vậy).
  - Test cũ đặt ngày đến bằng ngày **UTC**: `new Date().toISOString().slice(0, 10)`.
  - Hai ngày này lệch nhau khi giờ Việt Nam từ 00:00 đến 06:59, chứ không phải 00:00–06:00 như PR ghi. Bằng chứng ở bảng dưới, ca 06:30.
- Kết quả bộ giả giờ của ARC (tệp `v104-holds-feb`, 28 ca):

  | Mã | Giờ giả | Kết quả |
  |---|---|---|
  | `main` `476fd9b8` | 03:00 | **2 đỏ**: hai ca "Hôm nay" không thấy tiêu đề "Giữ chỗ chờ cọc (1)" |
  | `main` | **06:30** | **2 đỏ**, dù đã qua giờ chuyển ngày 06:00. Tức nguyên nhân là ngày UTC, không phải BR-010 |
  | `main` | 12:00 | 28/28 |
  | PR | 03:00 · 06:30 · 23:30 · giờ thật 00:3x | 28/28 ở cả 4 giờ |

- Hai ca này kiểm tiêu đề "Giữ chỗ chờ cọc (n)" và câu "Quá hạn từ …" (UXD P440-07). Chúng không kiểm giờ đêm. Hành vi đêm đã có test riêng:
  - client: `s4-211-fea.test.tsx` (02:40, 05:59, 06:00);
  - máy chủ: `dashboard-s4-bed.test.ts`, gồm ca 02:15 "đêm nay vẫn là đêm hôm trước" và ca trả phòng sau nửa đêm.
- Ghim giờ còn là cách **đúng hơn** so với chỉ sửa ngày:
  - Mock dùng ngày lịch, còn máy chủ dùng ngày làm việc (thẻ 03).
  - Nếu chỉ sửa ngày mà không ghim, ca sẽ chạy ban đêm trên một mock mà "hôm nay" mang nghĩa khác máy chủ. Ca xanh lúc đó không chứng minh gì.

**Kết luận câu 1:** ghim 12:00 không che lỗi đêm thật nào. Còn một điểm mong manh: ngày đến vẫn tạo theo UTC, và chỉ đúng vì 12:00 +07 = 05:00 UTC, cùng ngày (thẻ 02).

## 2. Có tệp nào khác cùng kiểu ngày UTC mà đỏ ban đêm không

ARC quét `toISOString().slice(0, 10)`, `split('T')` và `substring(0, 10)` ở `f96dbbe9`, trên `apps/`, `packages/`, `services/api/test` và `tests/`. Có hơn 40 chỗ. Phân loại:

| Loại | Kết quả | Ví dụ |
|---|---|---|
| Cộng/trừ ngày trên **chuỗi ngày** (`new Date('…T00:00:00Z')` + `setUTCDate`, `Date.UTC`) | An toàn. Phần lớn các chỗ thuộc loại này | `addDays` (`app/reservations.ts`, mock), `shiftDay`, `problem.ts`, mobile `time.ts` và `tasks.ts`, e2e `addDays` và `stackToday`, landing `iso(n)` từ `min` của ô ngày |
| Lấy từ "bây giờ" **có bù +7 giờ** | An toàn | `tests/e2e/support/s3.ts` 1266, `guest-web/src/mocks/handlers.ts` 154, `tests/tools/validate-fixtures.mjs` |
| Lấy từ "bây giờ" **theo UTC**, trong test admin-web | 2 chỗ của `v104-holds-feb` (PR này sửa). Thêm `s4-money.test.tsx` 714 (`yesterday` của dòng đưa đón): từ 00:00 đến 06:59 số này thành "hôm kia", nhưng mock chỉ so `serviceDate < today()`, nên ca vẫn đúng. **Không đỏ**, chỉ mong manh | – |
| e2e `rbac/sprint2-ops.ts` (ngày đến +300 ngày) | Lệch 1 ngày không ảnh hưởng | – |
| **Mã sản phẩm** | **Có một lỗi thật:** `ReservationDialogs.tsx` 912 (`ExtendHoldDialog`). Xem thẻ 01 | – |

Phạm vi đã kiểm:
- Toàn bộ `apps/*/src`, và các hàm hỗ trợ của e2e.
- Ở `services/api/test`, các chỗ tìm được đều là `d.toISOString()` trên một biến `d` dựng từ chuỗi ngày, cùng dạng với nhóm an toàn ở bảng trên. ARC không mở từng tệp, và không chạy test API ban đêm.

**Kết luận câu 2:** không có tệp test admin-web nào khác đỏ ban đêm vì kiểu ngày này. Có một chỗ trong mã sản phẩm hiện sai ngày ban đêm (thẻ 01).

## 3. Thẻ feedback

### FB-R4-ARC-FE-PR76-01
- Mức độ: Minor (lỗi riêng, có từ trước, không phải điều kiện gộp #76; QA ghi lỗi và chốt mức)
- Vị trí: `apps/admin-web/src/pages/reservations/ReservationDialogs.tsx` dòng 912, `ExtendHoldDialog`:
  ```ts
  const fmt = (d: Date) => `${timeHHmm(d)} ${dayMonth(d.toISOString().slice(0, 10))}`;
  ```
- Vấn đề:
  - Giờ được lấy theo múi giờ Việt Nam, nhưng ngày lại lấy theo UTC.
  - Một mốc từ 00:00 đến 06:59 vì vậy hiện **sớm một ngày**. Ví dụ, 01:00 ngày 06/11 hiện thành "01:00 05/11"; ARC đã kiểm bằng `node`.
  - Mốc như vậy có thật:
    - Giữ chỗ 12 giờ tạo trong khoảng 12:00–18:59 sẽ hết hạn trong khoảng 00:00–06:59.
    - Gia hạn +24 giờ (`hold_extension_max_hours`) giữ nguyên giờ đó. Chỉ khi chạm trần (12:00 ngày đến) thì ngày mới đúng.
  - Câu sai hiện ở nút `rsv.extend_submit` và ở thông báo `rsv.toast.hold_extended`.
- Vì sao quan trọng:
  - Đây là hạn giữ chỗ mà lễ tân đọc và báo lại cho khách. Báo sớm một ngày thì khách vội chuyển cọc, hoặc ca sau tưởng giữ chỗ đã hết hạn.
  - Không sai tiền.
- Đề xuất sửa:
  - Đổi thành `dayMonth(todayLocal('Asia/Ho_Chi_Minh', d))`, giống cách tính `holdUntil` ở `BookingDialog.tsx` dòng 790.
  - Thêm 1 ca test: hạn giữ chỗ 01:00, và kiểm câu trên nút gia hạn.
- Trạng thái: Open

### FB-R4-ARC-FE-PR76-02
- Mức độ: Suggestion (làm ngay ở PR này nếu FE còn sửa tệp; không thì bỏ qua)
- Vị trí: `v104-holds-feb.test.tsx` dòng 577 và 587; phần "Lỗi" trong mô tả PR #76.
- Vấn đề:
  - Sau khi ghim giờ, `r.arrivalDate = new Date().toISOString().slice(0, 10)` chỉ đúng vì 12:00 +07 = 05:00 UTC. Nếu ai đó ghim sang 06:30 thì ca lại đỏ.
  - `clock.ts` cũng ghi rằng các ca không kiểm giờ đêm nên lấy ngày từ `todayLocal()`.
  - Mô tả PR quy nguyên nhân cho BR-010 và khung 00:00–06:00. Thực tế nguyên nhân là ngày UTC so với ngày lịch của mock, và khung đỏ là 00:00–06:59.
- Vì sao quan trọng: người sửa sau đọc mô tả PR sẽ tìm sai chỗ.
- Đề xuất sửa:
  - Giữ `pinDaytime()`, và đổi hai dòng thành `r.arrivalDate = todayLocal();`.
  - Sửa câu nguyên nhân trong mô tả PR.
- Trạng thái: Open

### FB-R4-ARC-FE-PR76-03
- Mức độ: Suggestion (v1.0.5)
- Vị trí: `apps/admin-web/src/mocks/dashboard.ts` dòng 321 (`dashboard/tonight`) và 326 (`arrivals-departures`, giá trị mặc định của `date`).
- Vấn đề:
  - Mock dùng `todayLocal()` (ngày lịch). Máy chủ dùng ngày làm việc (BR-010).
  - Ngay trong mock đã không đồng nhất: Me dùng `businessDayLocal()` (`handlers.ts`), và `ops.ts` cũng vậy.
  - Hệ quả: từ 00:00 đến 06:00, mock hiện bảng "Hôm nay" và `businessDate` của ngày lịch, còn production hiện của ngày hôm trước.
- Vì sao quan trọng:
  - Test ban đêm của màn Hôm nay chạy trên một mock khác nghĩa với máy chủ.
  - Muốn viết ca đêm cho màn này, ví dụ "03:00 thấy khách đến của ngày làm việc", thì hiện chưa viết được.
- Đề xuất sửa:
  - Dùng `businessDayLocal()` cho hai đường này.
  - Sau khi đổi, chạy lại các tệp test có `/today` ở giờ giả 03:00.
- Trạng thái: Open

## 4. Điểm làm tốt

- Sửa đúng phạm vi: chỉ một tệp test, không nới giới hạn thời gian, không đổi cấu hình, và dùng chung helper `pinDaytime()` đã có.
- Có bằng chứng đỏ/xanh ở nhiều giờ giả, gồm cả giờ thật lúc nửa đêm. Bộ giả giờ dựng dữ liệu MSW ở đúng giờ giả, nên bằng chứng có giá trị.

- **Cập nhật ARC 05/11:** thẻ FB-R4-ARC-FE-PR76-01 được sửa ở PR #80 (`796a0cee`). ARC review ĐẠT CÓ ĐK (chờ CI). Thẻ Done khi #80 gộp. Chi tiết: `ARC-on-v104-pr80-extend-hold-date.md`.
