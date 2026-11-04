# ARC review – PR #70 BUG-R4-037: giá bản xem Trực tiếp còn trong ô sau khi đổi kênh, căn, ngày ở H09 (P0, hotfix)

- Người review: ARC | Round 4 – v1.0.4 – Bước **Review** (hotfix P0) | 04/11/2026
- Đối tượng:
  - lượt 1: `v104/fix-booking-rate-carryover` @ `822094b7`, một commit cắt từ `main` `4bf353da`. Đọc bằng `git diff 4bf353da 822094b7`;
  - lượt 2: head mới `94a28258`, thêm một commit sửa thẻ UXD-01 (mục 10). Phán quyết ngay dưới đây là cho head `94a28258`;
  - lượt 3 (ORC gọi là "Lượt 2 – d3da532d"): các commit `d3da532d` và `f8fa5030`, cộng commit merge `98d8a3ad`. **Phán quyết mới nhất, cho head `98d8a3ad`, ở mục 11.**
- Tệp trong PR:
  - `apps/admin-web/src/pages/booking/BookingDialog.tsx` (+87/−25);
  - test mới `apps/admin-web/src/__tests__/v104-booking-rate-carryover.test.tsx` (10 ca);
  - báo cáo FE `rounds/round-04/outputs/FE/bug-r4-037-booking-rate-carryover.md`.
- Đọc kèm:
  - `services/api/src/modules/reservations/public/pricing.service.ts`;
  - `services/api/src/modules/sales/internal/quote-pricing.ts` (`calculateQuote`);
  - `packages/ui/src/Button.tsx`, `hooks/useDebounced.ts`;
  - QA `bug-list-v1.0.4.md` mục BUG-R4-037; BE `bug-r4-037-data-impact.md` mục 1.5–1.8, Q1;
  - `UXD-on-v104-pr70-rate-carryover.md`; DOM `DOM-on-v104-pr68-docs.md` mục 3, 7.1.
- Số dòng theo tệp ở `822094b7`.
- ARC tự chạy trong worktree tạm (đã xóa khi xong): chạy test, đảo phần sửa, đột biến mã, và một test dò tạm (không commit).

## Phán quyết (head `94a28258`): **ĐẠT CÓ ĐK**

Bản sửa đóng được đường sai tiền QA ghi, và cả biến thể BE 1.8. Test đỏ thật trên mã cũ. Không đổi hợp đồng API, không chồng tệp với BUG-R4-038. Commit `94a28258` đã sửa thẻ UXD-01, nên lỗi 422 trên `nightlyRates` không còn bị nuốt (mục 10). Về mã, ARC không còn thẻ chặn.

Điều kiện phát hotfix (ORC theo dõi, không phải điều kiện gộp mã):
1. Sau #70, đơn OTA để trống thì máy chủ trả 422 `nightlyRates REQUIRED` khi production chưa có `ota_base_rate`. Desk nay hiện câu "Nhập giá mỗi đêm (lớn hơn 0)." dưới bảng giá, nên lễ tân gõ đủ giá là đi tiếp được. Không sai tiền, không im lặng. Nhưng **trước khi phát hotfix** cần một trong ba việc:
   - (A) ở mục 6 đi cùng hotfix (ARC đề nghị);
   - INV xác nhận production đã có `ota_base_rate` (tin DOM 7.3);
   - hướng dẫn lễ tân đổi thành "đơn OTA gõ đủ giá mọi đêm theo xác nhận OTA" (DOM 7.1), thay cho "hoặc để trống hết".
2. Sau khi gộp, QA chạy lại A-20, US-139 và tệp `v104-booking-rate-carryover` ở 24 tiến trình (như kế hoạch QA). Lý do: ARC chạy ở tải 95–142 thì có ca hết giờ 15 s (mục 8).

Ở lượt 1 (`822094b7`), ARC đặt điều kiện "không phát #70 một mình khi chưa có (A) hoặc UXD-01". Điều kiện đó nay đã đạt nhờ UXD-01.

Các thẻ ARC đều là Minor hoặc Suggestion, không chặn gộp. Thẻ 01 và 02 chưa được sửa ở `94a28258`. ARC vẫn đề nghị làm thẻ 01 (1 dòng, 1 ca test) nếu FE còn chạm tệp trước khi gộp; không thì dời v1.0.5.

## 1. Còn đường nào gửi giá cũ không (câu 1)

Cơ chế:
- Ô chưa gõ chỉ hiện và chỉ được gửi số của bản xem khi `form.ratesFor === liveKey` (dòng 428–435).
- `liveKey` dùng đúng điều kiện bật của bản xem (dòng 419–427 so với 304, 317). Vì vậy OTA, Nội bộ, dài hạn và quá sức chứa không bao giờ có khóa.
- Trực tiếp/CTV: `priceWaiting = liveKey && calcFor !== liveKey` (dòng 431). Khi đó nút bận và `submit` thoát sớm (dòng 642, 838).

| Đường | Kết quả | Căn cứ |
|---|---|---|
| Trực tiếp → OTA / Nội bộ (ca QA 1, 3) | **Đóng.** Ô trống ngay; `body` chỉ gửi khi mọi đêm do lễ tân gõ (dòng 518) | Test ca 1, 3. Đột biến bỏ kiểm ô hiển thị thì phần kiểm thân yêu cầu vẫn đỏ trên mã cũ (`amountVnd:667000, edited:false`) |
| OTA 2 đêm, căn 201, 4 người (ca QA 2) | **Đóng.** Không còn câu `rate_empty` đổ oan; cảnh báo sức chứa hiện | Test ca 2 |
| Trực tiếp đổi căn, ngày, số đêm, hoặc đổi sang CTV | **Đóng.** Khóa đổi ngay, ô trống ngay, nút chờ tới khi bản xem của lượt ở mới về | Test "another room", BE 1.8. CTV chưa có test (thẻ 02) |
| Bản xem về trễ, sau khi khóa đã đổi | **Đóng.** Kết quả trễ vẫn được ghi (`ratesFor` = khóa cũ), nhưng ≠ `liveKey` nên ô vẫn trống, nút vẫn chờ | Đọc mã 338–369 |
| Bản xem về sai thứ tự | **Đóng.** Cờ `stale` của effect bỏ kết quả của lượt gọi trước. Debounce gộp A→B→A thành không gọi lại, và khi đó số trong ô đúng là của A | Đọc mã 321, 378–380; `useDebounced` |
| Gợi ý căn khác (409 / ở tối thiểu) | **Đóng.** `set({ roomId })` đổi khóa nên `submit(…, { roomId })` bị `priceWaiting` chặn. Nút "Tạo đơn ở căn …" còn khóa riêng bằng `pickedPriced`. OTA chỉ gửi ô đã gõ. Ô OTA hiện 0 đ là chuyện hiển thị (UXD-04) | Đọc mã 725–756 |
| Bản nháp khôi phục | **Đóng.** `calcFor` không lưu vào nháp, nên mở lại luôn chờ bản xem mới. Nháp cũ không có `ratesFor` thì ô chưa gõ trống. Bản sửa còn gỡ luôn giá cũ của nháp production | Đọc mã 153–163 |
| Đổi ngày nghiệp vụ lúc 06:00 | **Đóng.** Ngày đến đổi thì khóa đổi | `useBusinessDayChange` 226–232 |
| Ô đã gõ khi đổi kênh hay căn | **Giữ, có chủ ý**, và hiện rõ trên màn hình. Thay đổi hành vi ở Trực tiếp đổi căn: xem thẻ 03 | Test "a rate the desk typed stays" |
| Trực tiếp sang OTA quá 300 ms rồi quay về, cùng lượt ở | **Không sai tiền, nhưng hở nhỏ.** Nút không chờ, `calc` đang null nên bảng tổng ẩn, và cọc lấy từ báo giá cuối của cùng lượt ở. Xem thẻ 01 | Test dò tạm của ARC (mục 4) |
| Giữ chỗ (`hold`) | Không gửi giá đêm. Máy chủ tính lại từ đầu, nên không mang giá cũ | Dòng 668–697. Ngoài phạm vi: thẻ 05 |

**Kết luận câu 1:** không còn đường nào gửi giá của lượt ở khác. Hở còn lại (thẻ 01) chỉ dùng số của **chính** lượt ở đang hiện.

## 2. Số khách không nằm trong khóa (câu 2)

**Đúng với máy chủ.**
- Giá đêm của bản xem là `calendarRate(listPrice[i], d, group, rules, nightUnit)` (`quote-pricing.ts` 304–316). Nó chỉ phụ thuộc giá niêm yết của căn, ngày, nhóm kênh và lịch giá.
- Ở B1, nhánh Trực tiếp/CTV cũng vậy (`pricing.service.ts` 357–378).
- Cọc là `shortDeposit(roomTotalVnd, …)`, chỉ tính trên tiền phòng (BR-305, `quote-pricing.ts` 352–356), nên cũng không phụ thuộc số khách.
- Số khách chỉ ảnh hưởng 2 chỗ:
  - Phụ thu người vượt: máy chủ tự tính, Desk không gửi.
  - Sức chứa: đã nằm trong `liveKey` qua `overCapacity`, và máy chủ kiểm lại.
- Desk không gửi `returnGuestCode`, nên không có % theo khách.
- Đổi số khách vẫn gọi bản xem mới (`calcInput` có `occ`), nhưng không làm nút chờ. Trong lúc đó chỉ bảng tổng (phụ thu) trễ một nhịp. Đây là hiển thị, UXD-02 đã ghi.

## 3. Hook, effect, race (câu 3)

- **Thứ tự hook:** chỉ thêm 1 `useState` (`calcFor`, dòng 218), cạnh các state cũ, không nằm sau lệnh `return` nào. `liveKey`, `prefillLive`, `priceWaiting` là phép tính thường. Không thêm effect.
- **Effect bản xem:**
  - phụ thuộc giữ nguyên `[calcInput, propertyId, vnd]`;
  - `previewKey` khai ở mức module, nên không thiếu phụ thuộc;
  - `setCalcFor` nằm trong cả nhánh thành công và nhánh lỗi, cùng chỗ với `setCalc`/`setForm`. React 18 gộp chúng thành một lần render, nên không có khung hình mà `calcFor` mới nhưng ô còn số cũ.
- **Cập nhật form theo `f` mới nhất:** bản xem dùng updater `setForm((f) => …)`. Ô lễ tân gõ **trong lúc** bản xem đang bay vẫn được giữ.
  - Bản cũ ghi đè ô vừa gõ bằng kết quả về trễ. Đó là một race cũ, nay cũng hết.
- **Không có race mới.** Điểm cần biết:
  - Nút chờ phụ thuộc vào việc bản xem trả lời. Lỗi cũng tính là đã trả lời (dòng 375), nên không chờ mãi khi máy chủ báo lỗi.
  - `api-client` không có timeout. Nếu lượt gọi treo, nút chờ tới khi lễ tân đổi một trường (thẻ 04).
- **Không chờ mãi do lệch điều kiện:** `liveKey` và `calcInput.on` cùng đọc `directLike`, `datesOk`, `longStay`, `overCapacity`, `roomId`, `channel` trong cùng một lần render. Sau 300 ms, effect luôn chạy cho đúng khóa đang chờ.

## 4. Test có đỏ thật trên mã cũ không (câu 4)

Worktree tạm từ `822094b7`, `pnpm install --offline`, build `@ottimo/contracts`.

| Lượt | Kết quả |
|---|---|
| Mã PR, tệp mới | **10/10 xanh** |
| Đảo `BookingDialog.tsx` về `4bf353da`, giữ test | **6/10 đỏ**: 3 ca QA, "another room", "OTA and back", BE 1.8. 4 ca xanh: giữ ô đã gõ và 3 ca cách làm tạm. Khớp báo cáo FE |
| Mã cũ, bỏ 3 dòng kiểm "ô trống" để xem test có kiểm **tiền gửi đi** không | 3 ca QA vẫn đỏ ở phần kiểm thân yêu cầu: `nightlyRates=[{amountVnd:667000, edited:false}]`. Test bắt đúng lỗi tiền, không chỉ lỗi hiển thị |
| Đột biến 1: bỏ `priceWaiting` khỏi `submit` (giữ nút bận) | 10/10 xanh. Đường Enter chưa có test (thẻ 02). Nút bận thì `disabled`, nên bấm chuột vẫn chặn |
| Đột biến 2: bỏ luật mới "Trực tiếp có ô gõ mà còn đêm trống thì báo `rate_empty`" (dòng 486–493) | 10/10 xanh. Luật này chưa có test (thẻ 02) |
| Test dò tạm: Trực tiếp → OTA chờ 700 ms → Trực tiếp, bấm Tạo đơn ngay | Ô hiện `667.000` của cùng lượt ở. Nút **không** chờ, đơn gửi đi với cọc 200.000 của báo giá cũ, không có `nightlyRates`. Đúng tiền, nhưng là hở của thẻ 01 |
| Toàn bộ admin-web, mã PR | Lượt 1: 889/890 (1 đỏ, tải máy ~117, không giữ được tên ca). Lượt 2: **890/890**. Lượt 3: xem ghi chú dưới bảng |
| `tsc --noEmit`, eslint, prettier (2 tệp) | Sạch |
| Mô phỏng cherry-pick lên `v1.0.3` (`git merge-tree`) | Sạch |

Ghi chú lượt 3 toàn bộ admin-web: ARC chạy ở tải máy ~95–142, kết quả ở mục 8. Lượt đỏ duy nhất ở lượt 1 chưa gán được cho ca nào. FE đã chạy 24 tiến trình, 40 lượt, không đỏ. Việc QA chạy lại A-20/US-139 ở 24 tiến trình sau khi gộp vẫn giữ nguyên.

## 5. Hợp đồng API và CI (câu 5)

- **Không đụng hợp đồng.**
  - PR không sửa `docs/api/openapi.yaml` hay `packages/api-client`.
  - Thân yêu cầu `ReservationCreate` vẫn cùng hình dạng. `ratesFor` chỉ là state của client, có lưu vào bản nháp `localStorage`, không gửi lên máy chủ.
  - Ngữ nghĩa vẫn theo ARC 16.18: `edited:false` nghĩa là số lịch trả về nguyên. Desk nay gửi `nightlyRates` **ít hơn** trước: OTA/Nội bộ chỉ gửi khi gõ đủ; Trực tiếp chỉ gửi khi có ô gõ.
  - Hai luật máy chủ dùng đến đã có sẵn: OTA không gửi giá thì theo lịch OTA (BUG-R2-017); Nội bộ không gửi giá thì 0 đ.
- `gh pr checks 70` ở `822094b7`: **xanh hết**. Ở `94a28258` cũng xanh hết, run `41851724469`, `headSha` = `94a28258` (mục 10).
  - `format · lint · audit · test · build` (4m59s);
  - `docker images build · E2E smoke` (18m);
  - `landing LP-v1`, `API contract`, `OpenAPI lint`, `gitleaks`, `confidential paths`, `infra scripts`, `no test endpoints`.
  - 3 job deploy/publish ở trạng thái `skipping`, đúng với PR.
- Ngoài #70, không PR mở nào sửa `BookingDialog.tsx` hay `pricing.service.ts`.

## 6. Chồng với BUG-R4-038, và phương án (A) cho `ota_base_rate` (câu 6 + câu ORC hỏi thêm)

### 6.1 BUG-R4-038 (`v104/fix-internal-added-night`)
- Nhánh chưa đẩy lên remote. Bản WIP trong worktree của BE sửa:
  - `folio-lines.service.ts`, `checkin.service.ts`, `checkout.service.ts`, `stay-support.ts`, `stay.service.ts`, `stay-night-pricing.ts`;
  - và một test tích hợp mới.
- **Không chồng tệp với #70** (chỉ client), và cũng không chạm `pricing.service.ts`.
- **Ngữ nghĩa khớp nhau:**
  - #70 làm đơn Nội bộ mới không gửi giá, nên B1 ghi 0 đ `complimentary`;
  - 038 làm đêm thêm của Nội bộ mặc định 0 đ (DOM R1);
  - Nội bộ có gõ giá thì đi nhánh `manual`, như DOM R2 "Nội bộ có thu". #70 vẫn cho gõ và gửi đủ đêm, nên khớp R2.
- Thứ tự gộp không quan trọng. Hotfix v1.0.3 có thể lấy #70 và 038 riêng.

### 6.2 Phương án (A): thiếu `ota_base_rate` thì OTA không gửi giá lấy giá niêm yết của căn – **ARC duyệt, điều kiện dưới đây**

Đã trả lời ORC một dòng lúc 04/11 tối, trước khi review xong. Chi tiết:

| Câu ORC | ARC | Căn cứ |
|---|---|---|
| An toàn không | **An toàn.** Nhánh mới cho đúng số mà hệ thống đang cho khi OWN cài `ota_base_rate` = giá đêm, đúng như BR-103 v0.5.0 yêu cầu. Sàn–trần BR-105 (`bounds`, dòng 247–253), `move-planner.ts` 287, `stay-night-pricing.ts` 153 và `stay-support.ts` 355 đều đã lùi về giá niêm yết khi thiếu khóa. (A) chỉ làm nhánh cuối cùng còn lệch đi theo cùng quy ước | BR-103 v0.5.0; `pricing.service.ts` 321–337 |
| Đổi hợp đồng không | **Không.** Không đổi schema, không thêm mã lỗi. 422 `nightlyRates REQUIRED` khi thiếu khóa chưa từng được ghi trong `openapi.yaml`; dòng 595 chỉ nói tham số nằm ở catalogue. **Không cần sửa openapi.** Nếu BE vẫn muốn thêm mô tả thì phải sinh lại `api-client` trong cùng PR (bài học BUG-R4-030) | `openapi.yaml` 595, 2423 |
| Ảnh hưởng báo giá kênh OTA | **Không có báo giá OTA.** `calculateQuote`/`saveQuote` chỉ nhận kênh Trực tiếp/CTV (`quote-pricing.ts` 143–150, trả `NOT_IN_LIST`). Giữ chỗ (dòng 1040 `reservations.service.ts`) cũng chỉ cho Trực tiếp/CTV. Nhánh này chỉ chạy ở B1 tạo đơn OTA và ở bước chạy thử của công cụ sửa 037 (`data-impact` 3.3). Công cụ sửa còn được lợi: thiếu khóa thì nay vẫn chạy được, không bị 422 | `quote-pricing.ts`; `reservations.service.ts` 717 |
| Ảnh hưởng Q0–Q5 / chỉ số | **Không dương tính giả,** với điều kiện nhánh mới giữ đúng dạng nhánh BUG-R2-017: `source:'calendar'` và **có** `calendarVnd`. Khi đó `stay_night.calendar_rate_vnd` được ghi khác NULL. Dấu hiệu 037 của Q1/Q2 đòi `calendarVnd IS NULL AND calendar_rate_vnd IS NULL` (data-impact 1.5), nên đêm OTA tạo theo (A) không lọt vào. Báo cáo doanh thu, ADR đọc `stay_night` như mọi đêm OTA theo lịch, không đổi định nghĩa. Riêng cột ước tính `ota_chenh_uoc_tinh_vnd` của Q1 vẫn lấy `ota_base_rate`; thiếu khóa thì đêm đếm vào `ota_dem_khong_co_gia_nen`, đúng như hiện nay. Nếu muốn, BE cho cột này lùi về giá niêm yết cho khớp (A), nhưng không bắt buộc | data-impact 1.5, 1.6, Q1 |

Điều kiện cho BE khi làm (A):
1. Sửa trong `pricing.service.ts`, nhánh `group === 'ota' && otaRoomAmountVnd === undefined`. Gốc giá từng đêm = `groupBase ?? PricingService.listPriceOn(input.room, date)`.
2. Giữ nguyên phép tính `calendarRate(base, date, 'ota', p.calendar, p.otaRateUnit)` và hình dạng đêm `{ amountVnd, calendarVnd, source:'calendar', uplift }`.
   - Như vậy kết quả trùng hệt lúc có khóa đúng BR-103.
   - Làm tròn theo `otaRateUnit`, giống `bounds()` (`unitFor`). Giá production 800.000 / 1.100.000 / 1.300.000 tròn 10.000 nên không lệch.
3. Căn thiếu giá niêm yết của **bất kỳ** đêm nào: vẫn trả 422 `nightlyRates REQUIRED` như cũ, không đổi sang `roomId NOT_IN_LIST`. Lý do: FE (UXD-01) bắt theo trường `nightlyRates`.
4. Test đơn vị cho 3 ca: thiếu khóa thì ra giá niêm yết, có `calendarVnd`; có khóa thì như cũ; thiếu cả giá niêm yết thì 422. Thêm 1 ca tích hợp B1 OTA không gửi giá, không có khóa.
5. Không sửa `production-defaults.ts` / `INV_ENTERS_KEYS`. (A) không thay cho việc gỡ khóa ở H6 (v1.1).
6. Đi cùng #70 trong hotfix: đây là cách ARC đề nghị cho điều kiện 1 của phán quyết. Không chồng tệp với 038, nên làm PR riêng hoặc commit riêng đều được.
7. Ghi `decision-log.md`. DOM thêm một câu vào BR-103: "thiếu `ota_base_rate` thì đơn OTA không nhập giá theo giá đêm niêm yết của căn".

Rủi ro còn lại của (A), chấp nhận được:
- Trước đây 422 buộc lễ tân gõ giá theo xác nhận OTA. Nay máy chủ tự lấy giá niêm yết. Nếu OTA chạy khuyến mãi riêng thì số ghi lệch tiền OTA thu.
- Đây đúng là hành vi khi khóa đã được cài (BUG-R2-017). BR-103 và BR-112 vẫn dặn "đơn OTA ghi đúng tiền OTA thu". Sổ tay 5.3 giữ câu "gõ giá theo extranet khi khác giá niêm yết".

## 7. Thẻ feedback

### FB-R4-ARC-FE-PR70-01
- Mức độ: Minor (đề nghị làm ngay ở PR này nếu FE sửa tệp cho UXD-01; không thì v1.0.5)
- Vị trí: `BookingDialog.tsx` dòng 317–320 (effect bản xem, nhánh tắt) và dòng 431 (`priceWaiting`).
- Vấn đề:
  - Khi bản xem tắt (sang OTA/Nội bộ, quá sức chứa), effect chỉ `setCalc(null)` và giữ `calcFor`.
  - Quay lại Trực tiếp cùng lượt ở sau hơn 300 ms thì `calcFor === liveKey`, nên nút **không** chờ. Trong khi đó `calc` đang null, nên bảng tổng và cột Nguồn giá ẩn. Ô hiện số của bản xem cũ, và cọc lấy từ báo giá cũ.
  - Test dò tạm của ARC: Trực tiếp → OTA 700 ms → Trực tiếp, bấm Tạo đơn ngay. Đơn đi luôn, cọc 200.000, không có `nightlyRates`.
- Vì sao quan trọng:
  - Không sai tiền, vì mọi số đều của **chính** lượt ở đang hiện, và máy chủ tự tính giá khi không có ô gõ.
  - Nhưng lễ tân tạo đơn khi chưa thấy bảng tổng. Có ô gõ thì các đêm chưa gõ được gửi theo số bản xem cũ, `edited:false`. Giá niêm yết đổi giữa chừng (OWN sửa bảng giá) thì số đó cũ.
  - Lời hứa của bản sửa, "Tạo đơn chờ bản xem của lượt ở đang hiện", chưa trọn ở ca này.
- Đề xuất sửa:
  - Nhánh tắt: `setCalc(null); setCalcFor(null); return;`. Quay lại Trực tiếp thì luôn chờ bản xem mới, khoảng 300 ms cộng thời gian gọi.
  - Thêm 1 ca test: Trực tiếp → OTA chờ quá 300 ms → Trực tiếp, nút có `aria-busy` tới khi bản xem về.
  - Ô vẫn được hiện số cũ trong lúc chờ (`prefillLive`), vì đó là số của đúng lượt ở. Hoặc ẩn đi cho đồng bộ với UXD-02; FE và UXD chọn.
- Trạng thái: Open

### FB-R4-ARC-FE-PR70-02
- Mức độ: Minor (v1.0.5, hoặc cùng commit với thẻ 01)
- Vị trí: `v104-booking-rate-carryover.test.tsx`.
- Vấn đề: hai phần bảo vệ của bản sửa chưa có test. ARC đột biến mã thì test vẫn 10/10 xanh:
  - (a) Luật mới dòng 486–493: Trực tiếp/CTV có ô gõ mà còn đêm trống thì báo `rate_empty`, không gửi 0 đ. Có hai ca đi qua luật này: lễ tân tự xóa một ô; bản xem của căn mới **lỗi** trong khi đã có ô gõ (`calcFor` = khóa, `ratesFor` ≠ khóa, nên đêm chưa gõ trống).
  - (b) Chặn trong `submit` (dòng 642), tức đường Enter. Trình duyệt không gửi form ngầm khi nút mặc định `disabled`, nên đây là lớp phòng thủ thứ hai. Vẫn nên khóa lại bằng test.
  - (c) Chưa có ca Trực tiếp → CTV (khóa đổi `channelId`), và chưa có ca nút "Tạo đơn ở căn …" của 409 với ô Trực tiếp cũ.
- Vì sao quan trọng: luật (a) là chỗ thay cho 422 `AMOUNT_NOT_POSITIVE` của máy chủ. Không có test thì lần sửa sau có thể bỏ mất mà CI vẫn xanh.
- Đề xuất sửa: thêm 3 ca.
  - Trực tiếp 2 đêm, gõ đêm 1, xóa đêm 2: thấy `rate_empty`, không có POST.
  - Căn mới mà `quotes/calculate` trả 500, đã gõ đêm 1: thấy `rate_empty`, không có POST chứa `amountVnd: 0`.
  - Trực tiếp → CTV: nút `aria-busy` rồi mới bật.
- Trạng thái: Open

### FB-R4-ARC-FE-PR70-03
- Mức độ: Minor (DOM xác nhận; v1.0.5)
- Vị trí: `BookingDialog.tsx` dòng 343–360 (bản xem giữ ô đã gõ).
- Vấn đề:
  - Bản cũ: bản xem mới đặt `ratesEdited: {}`, nên đổi căn ở Trực tiếp thì giá gõ cho căn A bị thay bằng giá lịch của căn B.
  - Bản mới: giá đã gõ được **giữ** qua đổi căn, đổi ngày, đổi số khách, đổi kênh. Đổi từ căn 101 sang căn N thì giá thỏa thuận cho 101 thành giá của căn N, gửi `edited:true`, ghi `manual_agreed`. Số vẫn hiện rõ trong ô, và máy chủ vẫn kiểm sàn–trần BR-105.
  - Với OTA thì giữ là đúng: giá OTA theo đơn, không theo căn, như chú thích dòng 734.
  - Nội bộ: ô gõ từ Trực tiếp đi theo sang Nội bộ thành "Nội bộ có thu" (DOM R2). Hiện rõ, cách làm này khớp R2.
- Vì sao quan trọng: đây là đổi hành vi nghiệp vụ nằm trong một bản hotfix tiền. Không sai ngầm, nhưng lễ tân quen bản cũ có thể không để ý rằng giá gõ không còn tự đổi theo căn.
- Đề xuất sửa:
  - DOM xác nhận: giữ giá đã gõ khi đổi căn ở Trực tiếp/CTV có đúng thực tế không.
  - Nếu không: chỉ bỏ ô đã gõ khi đổi **căn** ở Trực tiếp/CTV; vẫn giữ khi đổi số khách hay kênh, và giữ cho OTA.
  - Dù chọn cách nào, BA thêm một câu vào sổ tay 5.1: "giá đã gõ không tự đổi khi đổi căn".
- Trạng thái: Open

### FB-R4-ARC-FE-PR70-04
- Mức độ: Suggestion (v1.0.5)
- Vị trí: `BookingDialog.tsx` 322–335; `packages/api-client/src/client.ts` (không có timeout).
- Vấn đề: nút Tạo đơn nay phụ thuộc vào việc `calculateQuote` trả lời. Lượt gọi treo (mạng chập chờn, không có timeout) thì nút "Đang tải…" mãi, tới khi lễ tân đổi một trường. Trước bản sửa, nút không phụ thuộc vào bản xem.
- Vì sao quan trọng: lễ tân kẹt ở hộp đặt phòng khi mạng yếu, mà không có câu giải thích.
- Đề xuất sửa: truyền `AbortSignal.timeout(10_000)` vào `calculateQuote`, như B16 đã có `signal`, và tính hết giờ là lỗi (`calcFor` được đặt, hiện `calcError`). Hoặc thêm timeout mặc định ở `api-client` cho các lệnh đọc. ARC sẽ chốt mức timeout chung ở v1.0.5.
- Trạng thái: Open

### FB-R4-ARC-FE-PR70-05
- Mức độ: Suggestion (ngoài phạm vi #70, có từ trước; QA phân loại)
- Vị trí: `BookingDialog.tsx` 668–697 (`hold`); `quote-pricing.ts` (Q1/Q2 không nhận giá đêm).
- Vấn đề:
  - "Giữ chỗ đến …" không gửi giá đêm: `saveQuote` tính lại theo giá niêm yết. Ô lễ tân đã gõ (giá thỏa thuận) **bị bỏ không báo**: giữ chỗ và mã VietQR theo giá niêm yết.
  - Thêm một ý nhỏ do #70: luật mới ở dòng 486–493 cũng chạy trong `hold()`. Trong khoảng `priceWaiting`, nếu có ô gõ thì "Giữ chỗ" báo `rate_empty`, dù giữ chỗ không dùng giá ô. Câu này chỉ hiện chốc lát.
- Vì sao quan trọng: không thuộc 037 và không mang giá của lượt ở khác. Nhưng đây là một đường mà số lễ tân thấy khác số được ghi.
- Đề xuất sửa: QA mở lỗi riêng nếu xác nhận. Hướng sửa: ẩn hoặc khóa "Giữ chỗ" khi có ô gõ, kèm một câu, hoặc cho Q1 nhận giá thỏa thuận. Việc này cần ARC đổi hợp đồng nên để v1.0.5. Bỏ kiểm `rates` trong `hold()` (`delete v.rates`), như đang bỏ `deposit`.
- Trạng thái: Open

## 8. Ghi chú chạy lại toàn bộ admin-web (lượt 3)

Lượt 3 chạy trên `822094b7`, tải máy 95 → 142 (các agent khác chạy cùng), 375 s: **7 đỏ / 883 xanh**, ở 6 tệp.
- Cả 7 ca đỏ đều do **hết giờ**: `Test timed out in 15000ms`, hoặc `findBy…` không thấy `grid`/`dialog`/`table` trong thời gian chờ.
  - `booking` (US-017 Trực tiếp);
  - `r4-lp-v2-fea4`;
  - `s2-fix` (A-20);
  - `s4-211-fea`;
  - `v101-early-departure-fea`;
  - 2 ca của `v104-booking-rate-carryover`: ca OTA 1 đêm đỏ ở bước đầu `findByRole('grid')`, tức trước khi mở hộp; ca BE 1.8 hết 15 s.
- Không ca nào đỏ vì kiểm sai. Log không có chữ "Nhập giá mỗi đêm" nào (0 dòng), tức không có dấu hiệu 037.
- Nhiều tệp không liên quan đỏ cùng lúc, nên đây là do máy quá tải. Lượt 2 trên cùng mã: 890/890.
- Lưu ý cho QA: ca BE 1.8 và các ca OTA của tệp mới mất 6–16 s ở tải ~100. Hạn 15 s là sát nếu chạy quá tải. Ở 24 tiến trình (mức QA quy định), FE đo 0/40.

## 9. Điểm làm tốt

- Gắn số điền sẵn với **khóa của lượt ở** (`ratesFor`) và dùng **đúng điều kiện bật** của bản xem cho `liveKey`. Nhờ vậy OTA, Nội bộ, dài hạn và quá sức chứa tự rơi về "máy chủ tự tính" mà không cần nhánh riêng. Cách này cùng tinh thần với `edits.of === std.state.data` của #67; nên giữ làm mẫu cho mọi ô "điền sẵn từ máy chủ".
- Test chạy đúng nhịp người, kiểm **thân yêu cầu gửi đi** chứ không chỉ kiểm màn hình. Có ca BE 1.8 giữ bản xem bằng cổng `gate`, nên khoảng hở dài bao lâu tùy test, không phụ thuộc máy nhanh hay chậm. Ba ca cách làm tạm xanh trên mã cũ là bằng chứng tốt cho hướng dẫn lễ tân v1.0.3.
- Báo cáo FE nói rõ phần **không** sửa (hộp gợi ý căn hiện 0 đ, nhãn chờ), có kiểm cherry-pick lên `v1.0.3` và có số chạy dưới tải. ORC quyết đường hotfix được ngay từ báo cáo.

---

## 10. Lượt 2 – head `94a28258` (sửa thẻ UXD-01)

- Phần chênh: `git diff 822094b7 94a28258`, một commit.
  - `BookingDialog.tsx` +20/−4, chỉ trong `handleError`, nhánh `VALIDATION_FAILED`;
  - test thêm 2 ca (tổng 12);
  - báo cáo FE thêm mục 9.
- Logic `ratesFor`/`calcFor`/`priceWaiting` **không đổi**: phần chênh không chạm dòng nào của mục 1–3.

### 10.1 Đọc mã

| Điểm | Kết quả |
|---|---|
| `rateKey(field)`: bỏ tiền tố `body.`, nhận `nightlyRates`, `nightlyRates[i]…`, `nightlyRates.x`; không nhận tên khác bắt đầu bằng `nightlyRates` (regex `^nightlyRates(\[\|\.\|$)`) | Đúng |
| Có chỉ số `i` và `i < rateList.length` thì ghi `nightlyRates[i].amountVnd` (dưới ô đêm i); còn lại ghi `rates` (dưới bảng giá) | Đúng. Desk gửi `nightlyRates` theo đúng thứ tự `rateList` (`body` dòng 519–522), nên chỉ số của máy chủ khớp ô. `rateList` đọc trong cùng closure với lần `submit` đã gửi |
| `REQUIRED`, `AMOUNT_NOT_POSITIVE` → `rate_empty`; `RATE_OUT_OF_RANGE` → `rate_range` vào khóa hiển thị; lỗi khác → `fieldErrorText` | Đúng. Thứ tự nhánh giữ nguyên: `RATE_OUT_OF_RANGE_WARNING`, `CAPACITY_EXCEEDED_WARNING`, `MIN_STAY_NOT_MET` vẫn được xét trước |
| Trường không phải `nightlyRates` | Đi đúng đường cũ (`rk` = null thì `out[fe.field]`) |
| Khóa `rates` trùng với luật `validate` | Cùng nghĩa, cùng chỗ hiện (dòng 1324). Không xung đột |
| Đường "Tạo đơn ở căn …" (`submit` có `roomId`) | Bảng giá vẫn hiện bên dưới hộp gợi ý, nên câu lỗi vẫn thấy được |
| Hợp đồng | Không đổi. Chỉ đọc các mã đã có trong `openapi.yaml` (bảng mã lỗi, dòng 10086) |
| Khớp với phương án (A) | Khớp. ARC đã yêu cầu (A) giữ 422 `nightlyRates REQUIRED` khi căn thiếu giá niêm yết (mục 6.2 điều kiện 3). Lỗi đó nay hiện `rate_empty` dưới bảng giá |

Ghi chú cho UXD (không phải thẻ mới, gộp vào UXD-03 ở v1.0.5): `rate_range` nhận `min`/`max` dạng số thô, không định dạng tiền, ví dụ "500000". Điều này có từ trước, lượt này không đổi.

### 10.2 Chạy lại (worktree tạm, head `94a28258`)

| Lượt | Kết quả |
|---|---|
| Tệp `v104-booking-rate-carryover`, hạn mặc định 15 s | Tải ~57: **12/12 xanh**. Lượt khác ở tải ~99: 3 ca **hết giờ** (không có lỗi kiểm). Một lượt tải cao: ca BE 1.8 hết giờ |
| Cùng tệp, `--testTimeout=90000`, tải ~66–88 | **12/12 xanh** |
| 2 ca mới trên `BookingDialog.tsx` của `822094b7`, `--testTimeout=90000` | **2/2 đỏ đúng lý do**: `Unable to find … "Nhập giá mỗi đêm (lớn hơn 0)."`. Ca thứ hai đỏ ngay ở bước `body.nightlyRates[0]` |
| `tsc --noEmit`, eslint, prettier | Sạch |
| `gh pr checks 70` | **Xanh hết** ở run `41851724469`, `headSha` = `94a28258`: `format · lint · audit · test · build` 4m36s, `docker images build · E2E smoke` 15m51s, landing, contract, lint, gitleaks, confidential, infra, no-test-endpoints. 3 job deploy/publish `skipping` |
| Mô phỏng cherry-pick `4bf353da..94a28258` lên `v1.0.3` (`git merge-tree`) | Sạch |

Không chạy lại toàn bộ admin-web ở head mới, vì phần chênh chỉ ở `handleError` của một tệp. CI đã chạy toàn bộ suite và xanh. FE báo 891/892 ở tải 100–135, ca đỏ là `s4-38-fea` hết giờ; ARC không kiểm lại số này.

### 10.3 Trạng thái thẻ sau lượt 2

| Thẻ | Trạng thái |
|---|---|
| FB-R4-UXD-FE-PR70-01 (Major, UXD) | ARC xác nhận **đã sửa** về mặt kỹ thuật. UXD đóng thẻ |
| FB-R4-ARC-FE-PR70-01, 02 | Open. Chưa sửa ở `94a28258`. Không chặn |
| FB-R4-ARC-FE-PR70-03 | Open. Chờ DOM xác nhận (cùng câu hỏi với UXD-05: có bỏ ô đã gõ khi đổi kênh hay căn không) |
| FB-R4-ARC-FE-PR70-04, 05 | Open. Suggestion, v1.0.5 |

### 10.4 Điểm làm tốt (lượt 2)

- Sửa theo **trường** chứ không chỉ theo mã `REQUIRED`. Nhờ vậy `AMOUNT_NOT_POSITIVE`, `RATE_OUT_OF_RANGE`, `VALIDATION_FAILED` trên `nightlyRates` và tiền tố `body.` cũng hết bị nuốt. Báo cáo FE mục 9 có bảng "trước/sau" cho từng lỗi.
- Test mới đỏ đúng lý do trên mã cũ, và kiểm cả lớp `invalid` của khung, không chỉ kiểm chữ.

---

## DOM trả lời ARC-03/UXD-05 (04/11 khuya)

Căn cứ: BR-106; BR-112 (đơn OTA ghi đúng tiền OTA); BR-305 (cọc 30 % tiền phòng); BR-429 (g) (giá thỏa thuận gắn với căn, khách đổi căn thì lấy lịch giá căn mới, OTTIMO muốn giữ ưu đãi thì lễ tân gõ lại); BR-421 v0.5.3 (b) (Nội bộ có thu là gõ có chủ ý).

**1. Có giữ giá đã gõ không: giữ theo điều kiện, không giữ mọi lúc.**

| Lễ tân đổi | Ô giá đã gõ | Vì sao |
|---|---|---|
| Số khách | **Giữ** | Giá đêm không phụ thuộc số khách; phụ thu người tách riêng (BR-110) |
| Ngày | **Giữ** cho các đêm còn trong khoảng; đêm mới lấy giá lịch (Trực tiếp/CTV) hoặc để trống (OTA) | Lễ tân thấy từng đêm, sửa được |
| Kênh Trực tiếp ↔ CTV | **Giữ** | Cùng bảng giá; CTV chỉ khác hoa hồng |
| Kênh **sang hoặc khỏi OTA / Nội bộ** | **Xóa cả ô đã gõ**, kèm câu `role="status"` UXD đề xuất | Giá thỏa thuận Trực tiếp không phải giá OTA (BR-112), cũng không phải "Nội bộ có thu" (R2 phải là gõ có chủ ý). Giữ lại là cùng họ lỗi 037 |
| Căn, ở Trực tiếp/CTV, **khác nhóm căn** | **Xóa**, tính lại theo lịch căn mới (như bản cũ) | BR-429 (g): giá thỏa thuận gắn với căn/hạng; giá Studio mang sang căn N là giảm giá ngầm |
| Căn, ở Trực tiếp/CTV, **cùng nhóm căn** | **Giữ** | Cùng hạng, cùng giá niêm yết, cùng sàn–trần; lễ tân thường đổi căn cùng hạng khi căn đầu đã kín. Nếu FE khó tách theo nhóm thì xóa khi đổi mọi căn (đúng như bản cũ), DOM chấp nhận |
| Căn, ở OTA | **Giữ** | Giá OTA theo đơn, không theo căn (ARC đúng) |

Thời điểm: dòng "đổi kênh sang/khỏi OTA, Nội bộ thì xóa" là luật tiền, cùng họ 037, **nên đi trong #70 (v1.0.4)**. Dòng "đổi căn khác nhóm" cũng nên đi trong #70, vì #70 đã đổi hành vi cũ. Không kịp thì đi v1.0.5; khi đó sổ tay 5.1 (BA) ghi: "giá đã gõ không tự đổi khi đổi căn hoặc đổi kênh – kiểm lại từng đêm trước khi Tạo đơn". Dù chọn cách nào, câu sổ tay này vẫn cần.

**2. Giữ chỗ không mang giá đã gõ: không phải quy tắc đúng, đây là lỗ hổng.**
- Đúng ra: giữ chỗ phải theo giá đã báo khách (giá thỏa thuận trong sàn–trần BR-105), và cọc = 30 % tiền phòng tính trên giá đó (BR-305).
- Hiện nay Desk bỏ giá đã gõ mà không báo. Giữ chỗ và VietQR tính theo giá niêm yết. Khách bị đòi cọc cao hơn số đã báo, và khi đơn được xác nhận, giá đơn là giá niêm yết, cao hơn giá đã thỏa thuận, nếu không ai sửa lại.
- Đề xuất:
  - **v1.0.4, chỉ FE:** có ô đã gõ thì khóa **Giữ chỗ**, kèm câu (UXD viết), ví dụ: "Giữ chỗ chưa nhận giá đã gõ. Thu cọc rồi Tạo đơn, hoặc xóa giá đã gõ để giữ theo giá niêm yết."
  - **v1.0.5:** Q1 nhận giá thỏa thuận (ARC đổi hợp đồng), như thẻ ARC-05.
- QA ghi lỗi riêng. DOM đề xuất **P2 nếu v1.0.4 có khóa tạm**, vì khi đó Desk không còn bỏ giá lặng lẽ. Nếu không có khóa thì **P1**. QA chốt mức.
- Production v1.0.3 (BA đưa vào sổ tay 2.5 bước 10): giá thỏa thuận thì **không bấm Giữ chỗ**; báo khách cọc 30 % theo giá thỏa thuận, khách chuyển rồi mới **Tạo đơn** với giá đã gõ. Buộc phải giữ chỗ: ghi giá thỏa thuận vào ghi chú, rồi sửa giá đêm ngay sau khi đơn được xác nhận (lễ tân, trong sàn–trần, có lý do).

## Phản hồi BA (04/11/2026, phần sổ tay của ARC-03/05 và DOM trả lời ARC-03/UXD-05)

- Câu sổ tay nằm ở PR #72 (`v104/ba-docs-r4c` @ `1998c9e8`, bản nháp, chưa gộp). Đợi FE chốt hành vi ở #70 rồi BA chốt chữ.
- **ARC-03.** Câu "giá đã gõ được giữ hay bị xóa" đặt ở sổ tay **2.5** bước 8 và `02` 5.1 bước 8. Mục 5.1 của sổ tay là **Bảng giờ**, không phải phần đặt phòng.
  - Câu ghi rõ "từ v1.0.4".
  - Giữ khi đổi số khách, ngày, Trực tiếp ↔ CTV, đổi căn của đơn OTA.
  - Xóa khi đổi kênh sang hoặc rời OTA/Nội bộ, và khi đổi căn của đơn Trực tiếp/CTV, theo quy tắc gọn của ORC.
  - Tới v1.0.3: chọn xong căn, ngày, khách, kênh rồi mới gõ giá; kiểm từng đêm trước khi bấm **Tạo đơn**.
  - Nếu #70 không xóa khi đổi kênh hoặc đổi căn, BA đổi sang câu dự phòng của DOM.
- **ARC-05.** Cách làm tạm cho **Giữ chỗ** với giá thỏa thuận đặt ở sổ tay 2.5 bước 10 và `02` 5.1 bước 11:
  - có giá thỏa thuận thì không bấm Giữ chỗ;
  - v1.0.3 bỏ mất giá đã gõ; từ v1.0.4 Desk khóa nút này khi có giá đã gõ;
  - buộc phải giữ chỗ thì sửa giá đêm bằng **Điều chỉnh** ngay sau khi đơn được xác nhận.
  - Nếu nút khóa bị dời sang v1.0.5, BA đổi chữ cho khớp.

**3. Khách chốt giá thỏa thuận nhưng chưa chuyển cọc (tới v1.0.5; BA đưa vào sổ tay 2.5).** Mục này thay câu "Buộc phải giữ chỗ…" ở điểm 2 và áp cho cả v1.0.3. Căn cứ mã: `confirmHold` đòi cọc ≥ mức cọc của giữ chỗ, tức 30 % giá niêm yết. Desk không mở Folio của giữ chỗ. "Điều chỉnh" giá đêm (lễ tân làm được, trong sàn–trần) chỉ làm được khi đơn đã xác nhận.
- **Khách chuyển ngay, trong vài phút:** không giữ chỗ. Tiền về thì **Tạo đơn** với giá đã gõ, cọc 30 % theo giá thỏa thuận.
- **Phải giữ căn lâu hơn:**
  - Xóa các ô đã gõ, rồi **Giữ chỗ** theo giá niêm yết.
  - Ghi sổ giao ca: "OTM-…: giá thỏa thuận …/đêm".
  - Báo khách **đúng số cọc Desk hiện ở giữ chỗ**, nói rõ phần chênh được trừ vào tiền còn lại khi nhận phòng. Không báo cọc theo giá thỏa thuận: số đó thấp hơn mức Desk đòi, nên lễ tân không **Xác nhận cọc** được.
  - Ví dụ: Studio niêm yết 800.000, thỏa thuận 700.000, 2 đêm. Cọc giữ chỗ là 500.000; theo giá thỏa thuận chỉ 400.000.
- **Tiền về:**
  - **Xác nhận cọc** như thường.
  - Ngay sau đó mở Folio của đơn, bấm **Điều chỉnh** từng dòng Tiền phòng về giá thỏa thuận. Lý do ghi "Giá thỏa thuận lúc đặt". Đơn từ 7 đêm thì gõ giá trước giảm.
  - Kiểm Folio: Tiền phòng bằng tổng thỏa thuận; Còn phải thu bằng tổng thỏa thuận trừ cọc đã nhận.
  - Giá dưới sàn thì không dùng cách này: làm giảm giá đặc biệt có duyệt (BR-431…433).
- **Không làm "giữ chỗ giá niêm yết, tiền về thì Tạo đơn mới":** đơn mới trùng căn với giữ chỗ, nên phải hủy giữ chỗ trước. Lúc đó căn bị hở, ca khác hoặc web có thể bán mất. Cách này còn thêm một đơn hủy, và dễ ghi cọc nhầm đơn.
- **Khách hủy sau khi đã cọc theo giá niêm yết:** phí hủy BR-309 tính trên cọc đã nhận. Phần cọc vượt mức theo giá thỏa thuận (100.000 ở ví dụ) nên hoàn đủ, quản lý duyệt. v1.0.5 Q1 nhận giá thỏa thuận ở giữ chỗ thì bỏ hẳn các bước này.

### Phản hồi BA – DOM điểm 3 (PR #72 @ `17b2c3fd`, vẫn nháp)
- Đã thay câu "buộc phải giữ chỗ…" ở sổ tay 2.5 bước 10 và `02` 5.1 bước 11 bằng điểm 3 của DOM, ghi "áp dụng ngay, tới v1.0.5":
  - chuyển ngay thì không giữ chỗ;
  - phải giữ lâu: giữ chỗ theo giá niêm yết, ghi sổ giao ca, báo khách đúng số cọc Desk hiện;
  - tiền về: **Xác nhận đã nhận cọc**, rồi **Điều chỉnh** từng dòng tiền phòng về giá thỏa thuận và kiểm **Folio**;
  - giá dưới sàn thì làm giảm giá đặc biệt có duyệt;
  - không hủy giữ chỗ để tạo đơn mới;
  - khách hủy thì hoàn phần cọc vượt, quản lý duyệt.
- Giữ ví dụ 800.000/700.000 × 2 đêm (cọc 500.000 thay vì 400.000).
- Câu "từ v1.0.4 Desk khóa nút" vẫn chờ FE chốt #70.

---

## 11. Lượt 3 – `d3da532d` + `f8fa5030` + merge `98d8a3ad` (ORC gọi là "Lượt 2 – d3da532d")

- Phần chênh:
  - `git diff 94a28258 d3da532d`: quy tắc DOM cho giá đã gõ, câu `booking.rates_cleared_channel`, `requote`;
  - `git diff d3da532d f8fa5030`: câu `booking.rates_cleared_room_group` {room} (thẻ UXD PR70-07), hàm `rateDrop`;
  - `git show --remerge-diff 98d8a3ad`: merge `origin/main` (`ea979fe7`).
- Mỗi commit đọc riêng. Chạy trong 2 worktree tạm, đều đã xóa: mã mới, và đối chứng `94a28258`.

### 11.1 Phán quyết (head `98d8a3ad`): **ĐẠT CÓ ĐK**

Điều kiện:
1. **CI xanh ở `98d8a3ad`.** Lúc ghi review:
   - đã xanh: `format · lint · audit · test · build` (11m23s, run `41867849893`, `headSha` = `98d8a3ad`), `API contract`, `OpenAPI lint`, `gitleaks`, `confidential paths`, `infra scripts`, `no test endpoints`, `landing`;
   - còn chờ: `docker images build · E2E smoke`.
2. **Điều kiện phát hotfix ở mục "Phán quyết (head 94a28258)" vẫn giữ nguyên:** (A) đi cùng hotfix, hoặc INV xác nhận đã có `ota_base_rate`, hoặc hướng dẫn lễ tân "gõ đủ giá mọi đêm".
3. **QA chạy lại 24 tiến trình × 40 lượt khi máy rảnh** (tải nền dưới ~20) rồi mới tới QC. Lý do ở mục 11.4: ARC không đo được "0/40" trên máy dùng chung, nhưng đo được mã mới không chậm hơn đối chứng.

Không có thẻ chặn. Hai thẻ ARC-01 và ARC-03 đóng. Thẻ ARC-02 còn mở và có thêm một mục (11.5).

### 11.2 `d3da532d` – quy tắc DOM và `requote`

| Điểm | Kết quả |
|---|---|
| `dropsTypedRates`/`rateDrop` khớp bảng DOM (mục 10 báo cáo FE) | **Đúng.** Xóa khi đổi kênh sang hoặc rời OTA/Nội bộ (kể cả OTA ↔ Nội bộ), và khi đổi căn ở Trực tiếp/CTV sang nhóm khác. Giữ khi đổi số khách, ngày, Trực tiếp ↔ CTV, căn cùng nhóm, và căn ở OTA/Nội bộ. Lần gán căn mặc định (`was.roomId` rỗng) không xóa. Căn không rõ nhóm thì xóa, tức là chọn phía an toàn. `roomGroupId` là trường bắt buộc của `Room` và không bị `x-visible-to` giới hạn (`openapi.yaml` 10538, 10559), nên mọi vai đều thấy |
| Xóa trong updater `setForm((f) => …)`, tính lại trên `f` mới nhất | Đúng. Các việc phụ (`setCalcFor(null)`, `setRequote`, câu báo) tính trên `form` của lần render. Hai bên chỉ có thể lệch khi gọi hai lần `set()` đổi kênh hay căn trong cùng một sự kiện, mà mã hiện không có chỗ nào như vậy |
| **ARC-01** (Trực tiếp → OTA quá 300 ms → Trực tiếp, nút không chờ) | **Đóng.** Test dò của ARC: ngay khi quay về, mã mới cho nút `aria-busy=true` và ô trống. Khi bản xem điền lại ô, nút bật. Đối chứng `94a28258`: nút không chờ, ô hiện `667.000` cũ |
| Ca đi rồi về trong vòng 300 ms (FE tự bắt) | **Đóng nhờ `requote`.** Đột biến bỏ `requote` khỏi `calcInput` thì 2 ca đỏ ("OTA and back", "at once"), khớp báo cáo FE |
| `requote` có làm thêm vòng render hay gọi xem giá thừa không (ORC hỏi) | **Không.** Đếm bằng hook React DevTools giả, cài trước `setup.ts`, trên luồng ca đầu tệp (mở hộp, xem giá, OTA, căn 203, khách, mã OTA): mã mới và đối chứng **cùng 12 lần commit** khi mở và xem giá, **cùng 23 lần commit** khi sửa, cùng **1** lần gọi `quotes/calculate`, cùng 2 lần `availability`. Ca Trực tiếp → OTA 700 ms → Trực tiếp: cả hai cùng 6 lần commit, cùng 1 lần gọi xem giá. Thời gian từng bước như nhau (mở 457–518 ms / 462–570 ms; sửa 1028–1154 ms / 1028–1147 ms). Các `setState` mới nằm trong cùng trình xử lý sự kiện với `setForm`, nên React 18 gộp thành một lần commit. `requote` chỉ thêm lần gọi xem giá trong ca đi rồi về dưới 300 ms, và lần gọi đó là cần thiết |
| Câu `booking.rates_cleared_channel` | `span.help role="status"`, không màu lỗi. Chỉ hiện khi có ô đã gõ thật sự bị xóa. Đúng DS; UXD đã duyệt chữ |
| Ô chưa gõ cũng bị xóa (`rates: {}`) | Không mất gì, vì ô chưa gõ vốn đã bị khóa theo `ratesFor`. Bản nháp lưu theo |

### 11.3 `f8fa5030` – câu đổi căn khác nhóm (UXD PR70-07)

- `rateDrop` trả lý do `'channel' | 'room_group'`. Đổi cả kênh lẫn căn thì kênh được ưu tiên. Logic xóa không đổi so với `d3da532d`, chỉ thêm tên lý do.
- Mỗi lúc chỉ hiện **một** câu:
  - đổi kênh: đặt lại câu (không có ô gõ nào bị xóa thì không hiện câu);
  - đổi căn: hiện câu căn nếu có ô bị xóa. Nếu không, giữ câu kênh đang hiện, và bỏ câu căn cũ;
  - gõ lại một ô: ẩn câu.
- Đúng như thẻ UXD.
- `{room}` lấy `roomNo` của căn mới. Chữ VI/EN điềm tĩnh, không emoji, có cách làm tiếp ("Kiểm lại giá mỗi đêm trước khi tạo đơn"). Chữ thuộc quyền UXD.
- Chữ có ở `strings-vi.json`, `strings-en.json`, `gen_strings.py`, `strings-tables.md`, `strings.js`. Chạy lại `gen_strings.py` ở `f8fa5030` không đổi gì.

### 11.4 Test và chạy tải

| Lượt | Kết quả |
|---|---|
| Tệp `v104-booking-rate-carryover` ở `f8fa5030` | **28/28 xanh**. `tsc`, eslint, prettier (4 tệp) sạch |
| Test ở `f8fa5030`, `BookingDialog.tsx` của `d3da532d` (`--testTimeout=60000`) | **3 đỏ**, đúng 3 ca mới của PR70-07 |
| Test ở `f8fa5030`, `BookingDialog.tsx` của `94a28258` | **12 đỏ**: 6 ca xóa khi đổi kênh, ca "at once", 2 ca đổi căn khác nhóm, ca câu căn, ca "một câu". Thêm ca cách làm tạm OTA đỏ một lần ở tải ~60–97. Ca này không đổi so với lượt 2 và đã xanh ở lượt 2, nên ARC coi là do tải |
| Đột biến: bỏ `setCalcFor(null)` (giữ `requote`) | 25/25 xanh (lượt đầu có 1 ca hết giờ do tải, chạy lại xanh). Phần "nút chờ sau khi xóa" của ARC-01 **chưa có test**: thẻ ARC-02 mục (d) |
| **A/B dưới tải**, 24 tiến trình: 40 lượt mã mới (`98d8a3ad`) xen kẽ 40 lượt đối chứng (`94a28258`), cùng một hàng đợi, cùng tải nền | Tải nền lúc bắt đầu là **70–110** do các agent khác. Mỗi tệp chạy 3–8 phút. Ở mức này **cả hai bên đều đỏ gần hết**: mã mới 39/40 lượt, đối chứng 36/40 lượt. Ca đầu tệp đỏ: mới **29/40**, đối chứng **30/40**. Thời gian ca đầu tệp: trung vị mới 15,5 s, đối chứng 15,7 s (cả hai chạm hạn 15 s); p90 16,6 / 16,5 s. Kiểu lỗi: mã mới 262 ca hết giờ và 1 ca "không thấy `grid`" (chưa mở hộp), **0 lỗi kiểm**. Đối chứng 174 hết giờ, 1 "không thấy `grid`", và 2 lỗi kiểm `toHaveValue(880000)` ở ca "giữ ô đã gõ khi đổi kênh". Ca đó đã bỏ ở `d3da532d`: test cũ bị race giữa `clear` → `type` và một bản xem về trễ |

Đọc kết quả:
- **Không có dấu hiệu `requote` làm chậm.** Số commit và số lần gọi bằng nhau. Dưới cùng tải, ca đầu tệp của mã mới đỏ không nhiều hơn đối chứng (29 so với 30) và không chậm hơn.
- Ca đầu tệp nặng nhất vì phải biên dịch các chunk route lười, như `setup.ts` dòng 10–13 đã ghi. Vì vậy khi 24 tiến trình cùng khởi động, ca này hết giờ trước. Điều này giải thích lượt 6/40 của FE, rồi 0/40 ngay sau đó.
- Thời gian cả tệp của mã mới dài hơn (trung vị 318 s so với 170 s) vì tệp có 28 ca thay vì 12, không phải vì từng ca chậm hơn.
- ARC **không** tái lập được "0/40" trên máy dùng chung lúc này. Vì vậy có điều kiện 3 của 11.1.

### 11.5 Merge `98d8a3ad`

- `git show --remerge-diff 98d8a3ad`: chỉ `product/design/wireframes/assets/strings.js`. Đây là phần giải xung đột của tệp sinh: lấy bản của main rồi sinh lại.
- ARC kiểm ở `98d8a3ad`:
  - chạy `gen_strings.py` ra "3472 strings + 8 templates" và không đổi tệp nào;
  - `booking.rates_cleared_channel` và `booking.rates_cleared_room_group` đều có trong `strings-vi.json`, `strings-en.json`, và 2 lần trong `strings.js` (VI, EN);
  - JSON hợp lệ, không còn dấu xung đột.
- Main mang vào: `CheckOutPage.tsx`, `mocks/stay.ts` và 3 tệp test checkout (#64), các `turbo.json` (#61), `openapi.ts` sinh lại (#61), cùng tài liệu. Không tệp nào là `BookingDialog.tsx`, `pricing.service.ts` hay tệp test của #70, nên không đụng logic của PR.
- Ca `s4-144-fea` đỏ ở lượt chạy toàn bộ của FE là BUG-R4-035, được sửa ở #67, không thuộc #70. ARC đồng ý.

### 11.6 Trạng thái thẻ ARC sau lượt 3

| Thẻ | Trạng thái |
|---|---|
| FB-R4-ARC-FE-PR70-01 | **Done** (`d3da532d`: `setCalcFor(null)` + `requote` khi xóa). ARC kiểm bằng test dò. Test còn thiếu chuyển sang 02 (d) |
| FB-R4-ARC-FE-PR70-02 | Open, Minor, v1.0.5. Thêm mục **(d)**: một ca Trực tiếp → OTA chờ quá 300 ms → Trực tiếp, nút có `aria-busy` tới khi bản xem về. Đột biến bỏ `setCalcFor(null)` hiện vẫn xanh. (a), (b) còn nguyên. (c): đã có ca Trực tiếp ↔ CTV (giữ) và agent → OTA (xóa), nhưng chưa có ca CTV đổi khóa thì nút chờ |
| FB-R4-ARC-FE-PR70-03 | **Done.** DOM chốt quy tắc; FE làm đúng bảng ở `d3da532d`, và thêm câu đổi căn ở `f8fa5030` |
| FB-R4-ARC-FE-PR70-04 | Open, Suggestion, v1.0.5 (timeout bản xem) |
| FB-R4-ARC-FE-PR70-05 | Open. `gen_strings.py` nhắc một PR riêng `v104/fe-hold-typed-rate-lock` (khóa Giữ chỗ khi có giá đã gõ), có vẻ đang làm thẻ này. ARC sẽ review ở PR đó |

Ghi chú nhỏ, không thành thẻ: tiêu đề nhóm trong `gen_strings.py` và `strings-tables.md` nhắc "khóa Giữ chỗ khi có giá đã gõ", việc của PR khác. Nếu PR kia thêm khóa vào cùng nhóm thì dễ xung đột ở 2 tệp này và ở `strings.js`. Nên gộp #70 trước, rồi PR kia merge main.

### 11.7 Điểm làm tốt (lượt 3)

- FE tự tìm ra ca "đi rồi về trong 300 ms" khi viết test, rồi sửa đúng gốc bằng đầu vào bản xem (`requote`) thay vì thêm hẹn giờ. Cách này không tốn thêm render hay lần gọi nào.
- `rateDrop` là hàm thuần, đặt ngoài component, viết theo đúng bảng DOM. Đọc mã là đối được với quy tắc nghiệp vụ.
- Merge giải xung đột tệp sinh đúng quy trình (lấy bản main, sinh lại, kiểm khóa), và `--remerge-diff` sạch.

### Phản hồi BA – sau khi #70 và #73 đã gộp (PR #72 @ `248778e8`, vẫn nháp)

- **ARC-03 (phần sổ tay): Fixed.** Bước 8 ở sổ tay 2.5 và `02` 5.1 viết theo `rateDrop()` trên main @ `d0ea6dc2`, áp dụng từ v1.0.4:
  - Desk giữ giá đã gõ khi đổi số khách, đổi ngày (các đêm còn trong khoảng), đổi Trực tiếp ↔ CTV, đổi căn cùng nhóm, hoặc đổi căn của đơn OTA / Nội bộ.
  - Desk xóa giá khi đổi kênh sang hoặc rời OTA / Nội bộ, hoặc khi đổi căn của đơn Trực tiếp / CTV sang nhóm khác. Desk hiện hai câu báo của `booking.rates_cleared_channel` và `booking.rates_cleared_room_group`.
  - Giả định cũ "đổi căn Trực tiếp/CTV xóa mọi căn" đã bỏ.
- **OTA (theo #73 @ `da5c3c4c`): Fixed.** Ở sổ tay 2.6 và `02` 5.3, bước 4:
  - tới v1.0.3, gõ đủ mọi đêm theo xác nhận OTA;
  - từ v1.0.4, để trống mọi ô thì Desk lấy giá lịch OTA theo giá niêm yết của căn, hoặc gõ đủ mọi đêm theo xác nhận OTA;
  - gõ thiếu một số đêm thì Desk chặn.
- **ARC-05 (khóa Giữ chỗ): vẫn chờ.** Câu "Từ v1.0.4, Desk khóa nút này khi có giá đã gõ" chờ PR `v104/fe-hold-typed-rate-lock`. Nếu khóa không kịp v1.0.4, BA chỉ sửa câu này. Các bước DOM điểm 3 giữ nguyên tới v1.0.5.
- **ARC-05, cập nhật 05/11 (PR #72 @ `bf72b2c9`, vẫn nháp):** sổ tay 2.5 bước 10 và `02` 5.1 bước 11 đã có câu khóa cuối của UXD, ghi nguyên văn. Từ v1.0.4, xóa hết giá đã gõ thì nút mở lại. Câu này chờ FE #75 gộp.
- **ARC-05, cập nhật ARC 05/11 (review #75 @ `e71ab25f`, ĐẠT CÓ ĐK – chờ CI):** phần v1.0.4 **Done**, đóng khi #75 gộp: "Giữ chỗ" bị khóa (`aria-disabled`, có câu UXD) khi còn giá đã gõ trên một đêm của lượt ở, và `hold()` không còn bị `rate_empty` của #70 chặn. Máy chủ không nhận giá đêm ở Q1/Q2 (`QuoteInput` không có trường này; zod bỏ lặng), nên giữ chỗ luôn theo giá niêm yết. Phần v1.0.5 (Q1 nhận giá thỏa thuận, đổi hợp đồng) ARC giữ. Chi tiết: `ARC-on-v104-pr75-hold-lock.md`.
