# ARC review – PR #71 BUG-R4-038: đêm thêm của đơn Nội bộ lấy giá Trực tiếp (B13, B9a, B18, A31) (P0, hotfix)

- Người review: ARC | Round 4 – v1.0.4 – Bước **Review** (hotfix P0) | 04/11/2026
- Đối tượng: `v104/fix-internal-added-night` @ `7557e485`, một commit trên `main` `c2506a53`. Đọc bằng `gh pr diff 71` / `git diff c2506a53 7557e485`.
- Tệp trong PR (9):
  - `stay-support.ts`, `stay.service.ts`, `checkin.service.ts`, `checkout.service.ts` (frontdesk);
  - `folio-lines.service.ts` (folio), `stay-night-pricing.ts` (reservations);
  - test mới `services/api/test/integration/bug-r4-038-internal-added-night.test.ts` (10 ca);
  - `tests/fixtures/br-examples.json` (BR-421-04…11), `tests/tools/validate-fixtures.mjs`.
- Đọc kèm:
  - `business-rules.md` BR-421 v0.5.3 (đã trên `main`);
  - DOM `DOM-on-v104-pr68-docs.md` lượt 3 mục 3 (R1–R5);
  - `rbac-matrix.md` A31 và chú thích 23; `openapi.yaml` (`checkIn`, `extendStay`, `checkOut`, `adjustFolioLine`, `CheckInPreview`, `ExtensionOptions`, `CheckoutSummary`);
  - FE `CheckOutPage.tsx`, `CheckInPage.tsx`, `StayDialogs.tsx` (H15) – không đổi trong PR;
  - nhánh BUG-R4-039 `v104/fix-checkin-occupied-exception` @ `377411d1` (chưa có PR khi review), #70 @ `d3da532d`, #73 `v104/ota-rate-fallback`.
- ARC tự chạy trong worktree tạm (đã xóa khi xong), PostgreSQL riêng, máy tải ~108: test của PR, đảo phần `src`, 3 ca dò tạm (không commit), cây gộp thử 71 + 039 + 73.
- **Lượt 2 @ `02c34bc9` (05/11/2026): ĐẠT.** C1 đã đóng. Xem mục "Lượt 2" ở cuối tệp.

## Phán quyết (head `7557e485`): **ĐẠT CÓ ĐK**

Bản sửa đúng BR-421 v0.5.3 (a)–(d) ở cả ba đường thêm đêm, có một hàm duy nhất cho xem trước và lệnh ghi, kênh khác giữ nguyên. Test đỏ thật trên mã cũ (8/10) và xanh với bản sửa (10/10); CI chạy thật toàn bộ bộ test API (không lấy cache). Không chồng mã với BUG-R4-039, #70, #73. Về mã, ARC không có thẻ chặn.

**Điều kiện gộp #71 (C1)**: hợp đồng phải ghi 5 điểm đổi hành vi. ARC đã viết mô tả `openapi.yaml` (phụ lục A) và đã thử: Redocly hợp lệ, `api-client` sinh lại, test xanh. BE áp vào **chính #71**, kèm `api-client` sinh lại trong cùng commit (bài học BUG-R4-030), rồi chờ CI xanh lại (thẻ 01). Nếu ORC muốn gộp #71 ngay mà không chạy lại CI: ARC mở PR hợp đồng riêng, và PR đó phải vào `main` trước khi cắt v1.0.4 và trước PR FE-A ở mục 8.

**Điều kiện phát hành v1.0.4 (ORC theo dõi, không phải điều kiện gộp mã)**:
- **R1 – FE-A sửa `CheckOutPage.tsx`** (mục 8) đi cùng v1.0.4. Thiếu bản này, ca "đơn Nội bộ, đêm ngày đi đã bán" vẫn kẹt nút **Hoàn tất** trên Desk, dù API đã đúng.
- **R2 – gỡ dữ liệu**: chạy Q5a sau khi deploy. Nhóm A (đang ở, folio `open`) do OWN/MGR sửa bằng A31 → 0. Nếu nhóm B/C > 0 thì cần công cụ một lần (phương án B, ARC + SEC review). Sửa tiền trên production phải có INV duyệt, nên ORC/BE tạo ESC kèm số lượng. ARC không tạo ESC khi chưa có số.
- **R3 – SEC kết luận điểm A31** (mục 3.2). Mã hiện tại là phương án chặt hơn, nên gộp được ngay. Chỉ cần đổi nếu SEC yêu cầu đổi cho v1.0.4.

## 1. Kiểm lại bằng chạy thật (câu 6)

| Lần chạy | Kết quả | Ghi chú |
|---|---|---|
| Test của PR trên head `7557e485` | **10 passed (10)** | 80 s, máy tải ~108 |
| Đảo `src` về `c2506a53` (`git checkout c2506a53 -- product/services/api/src`), giữ test + oracle của head | **8 failed, 2 passed (10)** – khớp số BE báo | 2 ca xanh: đối chứng Trực tiếp và BR-421-07. BR-421-07 vốn đã đúng vì đêm 0 đ thì phụ thu cũng 0 |
| Lý do 8 ca đỏ | Đều đỏ ở **điều khẳng định của lỗi**, không phải lỗi phụ: `defaultRateVnd`/`extraNightDefaultRateVnd` ≠ 0, 422 `AMOUNT_NOT_POSITIVE` khi gõ 0, đêm gia hạn ≠ 0 | Dòng test 294, 320, 350, 381, 409, 432, 518, 548 |
| `gh pr checks 71` | Mọi job **pass**; 3 job deploy/publish `skipping` (đúng: chỉ chạy ở `main`) | Gồm API contract, Redocly, gitleaks, shellcheck, E2E smoke, LP Playwright |
| CI "format · lint · audit · test · build" | `@ottimo/api:test` **cache miss, chạy thật**: 167 tệp passed, 2 skipped; 4135 tests passed. `validate-fixtures` 217 dòng tính lại | Không phải "xanh giả" kiểu BUG-R4-013 |
| 3 ca dò tạm của ARC (không commit) | **3 passed** | Mục 3.1, 3.2 và B9a gõ tay (mục 2) |

## 2. Mã so với quy tắc DOM (BR-421 v0.5.3)

| Quy tắc | Mã | Có test | Kết luận |
|---|---|---|---|
| (a) Mặc định 0 đ, nguồn `complimentary`, **một hàm** cho xem trước và lệnh ghi | `addedNightRate` trả sớm khi `c.complimentary` (cờ đặt ở `addedNightContext` theo `channel_group = 'internal'`). Cả `extension-options`, `extend`, `check-in-preview`, B9a, `checkout-summary` và B18 đều qua hàm này | B13, B9a, B18 | Đúng. Nhánh Nội bộ không đọc lịch Trực tiếp, nên còn bớt truy vấn |
| (a) Không sàn–trần BR-105 | DTO bỏ `floorVnd`/`ceilingVnd`/`extraNightFloorVnd`/`CeilingVnd`. B9a dùng `outOfRange` (vắng = không kiểm). B18 so với giá trị canh 0 … `MAX_SAFE_INTEGER`. B13 có nhánh Nội bộ riêng | B13 gõ 100.000 và 300.000 dưới sàn | Đúng. Có hai cách biểu diễn "không có khoảng" (thẻ 04) |
| (a) Không bậc BR-107 | `retierStay` đã bỏ qua Nội bộ từ trước | Gián tiếp | Đúng |
| (a) Cho gõ 0 | B13 `amount === 0 && !internal`. B9a và B18 đọc `positive: false`, rồi chặn 0 nếu không phải Nội bộ, **sau** khi đọc đơn | B13, B18 có. B9a gõ 0: chỉ ca dò ARC | Đúng (thẻ 02: thêm test B9a gõ 0) |
| (a) `is_complimentary` của đơn giữ nguyên | Không chạm cột đơn; `stay_night` mới lấy cờ của đơn | `expectComplimentary` mọi ca | Đúng |
| (b) Có thu: gõ > 0 = `manual`, không khoảng, không duyệt | Như trên. B9a gõ 150.000 → `manual`, đêm 150.000, cần thu tiền mới nhận phòng (409 `balance_paid` nếu chưa thu) | B13 có. B9a: ca dò ARC | Đúng |
| (c) Phụ thu = % × đêm của chính đơn; 0 → không ghi dòng | `surchargeBase` giữ đọc `stay_night`. Trả về 0 cho Nội bộ khi không có đêm (DOM "stay-support.ts:392") | BR-421-07/08/09 | Đúng |
| (d) Sau 18:00, căn trống → đêm 0 đ; đêm đã bán → 0 đ, không ghi dòng | `freeNight`, `lateChargeOf` = 0 | BR-421-10, 11 và ca B18 đêm đã bán | Đúng |
| Kênh khác không đổi | 0 → 422 như cũ; mặc định = lịch Trực tiếp kèm khoảng | Ca đối chứng (B13, B18, B9a, A31) | Đúng |

Ghi chú nhỏ, không thành thẻ:
- B18 nay kiểm `extraNight.rateVnd = 0` **sau** khi đọc đơn (`assertExtraNightRate`). Gửi 0 cho một đơn không tồn tại nay ra 404 thay cho 422. Không ảnh hưởng gì.
- Ba chỗ gọi `assertExtraNightRate` (precheck, tóm tắt QR, B18) cho cùng một câu trả lời. Đây là đúng nguyên tắc "precheck = lệnh ghi" (SEC BE-64).

## 3. Hai lựa chọn của BE cần ARC duyệt

### 3.1 R4 – đơn Nội bộ, đêm ngày đi đã bán: bỏ bước quản lý xác nhận → **ARC DUYỆT**

Lý do:
- Bước xác nhận (BR-416-06, ARC 16.6 (d)) tồn tại để một quản lý **cho phép thu** khoản thay đêm. Số tiền là 0 thì không còn quyết định tiền nào để duyệt.
- Giữ bước này nghĩa là bắt lễ tân gọi quản lý nhập mật khẩu (có 2FA thì phải đi đường `postReview`) chỉ để ghi một con số 0. Làm vậy thêm việc mà không thêm kiểm soát nào.
- Hiện Desk không bao giờ gửi `lateFeeInsteadOfNight` khi số là 0 (`lateFeeMode` cần > 0). Vì vậy "không gửi" là đúng với client hiện có, không phá client nào.

ARC dò lại bằng ca tạm (đơn Nội bộ 301, đơn Trực tiếp đến 17/11, trả 19:00):
- `postReview` với `amountVnd: 0` → 422 `lateFeeInsteadOfNight.amountVnd` `AMOUNT_NOT_POSITIVE`. Lỗi này do bộ đọc trường bắt trước, như mọi lần.
- `postReview` với `amountVnd: 1` → 422 `lateFeeInsteadOfNight` `NOT_ALLOWED`.
- Đường xác nhận tại quầy (MGR, mật khẩu sai, `amountVnd: 1`) → 422 `NOT_ALLOWED`, **không** phải 401. Nghĩa là precheck chạy trước mật khẩu và không đếm sai. Đơn vẫn `in_house`.

Câu trong PR "if sent, it returns 422 NOT_ALLOWED" chỉ đúng khi `amountVnd > 0`. Mô tả hợp đồng ở phụ lục A ghi đủ hai mã.

Không có bản ghi audit `reservation.late_fee_instead_of_night` cho ca 0 đ. Chấp nhận được: bản ghi B18 đã có giờ trả. Chuyện căn có khách đến là chuyện vận hành, không phải chuyện tiền. Lượt nhận phòng của khách đến bị chặn bởi trạng thái buồng (BUG-R4-039).

### 3.2 R5 – A31 đưa đêm Nội bộ về 0 chỉ OWN/MGR, trong khi FD gõ được 1 đ → **không nhất quán; giữ cho v1.0.4, sửa ở v1.0.5**

ARC đã xác nhận bằng ca dò: FD đặt đêm Nội bộ (đơn có thu 300.000) về **1 đ** → 201. FD đặt về **0** → 403 `FORBIDDEN_ACTION`.

Vì sao chặn "0" không phải là kiểm soát:
- Đơn Nội bộ không có sàn–trần (`setNightRate` bỏ kiểm khoảng khi `channel_group = 'internal'`), nên 1 đ luôn đi được. Về tiền, 1 đ gần như 0 đ. Về báo cáo thì còn tệ hơn: đêm 1 đ không được gắn `complimentary`.
- FD vốn đã cho được đêm miễn phí theo đường chính thức: tạo đơn Nội bộ 0 đ (H09), và sau PR này gõ 0 ở B13/B9a/B18.
- Rủi ro thật là đơn "có thu" đã thu tiền mặt rồi bị hạ giá. Rủi ro này có ở cả 0 và 1 đ. Nó đã được che: tiền dư thành `credit`, trả lại phải qua yêu cầu hoàn có duyệt (BR-522), và mọi điều chỉnh đều có lý do + audit `folio_line.adjusted`, `reservation.repriced`.

Quyết định ARC:
- **v1.0.4 giữ như PR.** Đây là phương án chặt hơn, khớp đề xuất DOM R5 và kế hoạch gỡ dữ liệu (nhóm A do OWN/MGR làm). Không mở rộng phạm vi hotfix.
- **v1.0.5 làm cho nhất quán** (thẻ 03). ARC đề xuất **X**: trên dòng `room` của đơn Nội bộ, `0` mở cho cùng các vai được A31 giá > 0 (OWN/MGR/FDL/FD), lý do bắt buộc, nguồn `complimentary`. X khớp BR-421 (b) "cùng vai được gõ" và chú thích 23 của RBAC (FD sửa trong khoảng chính sách; với Nội bộ, giá chính sách là 0).
- Nếu SEC muốn giữ bước quản lý, thì chặn phải đặt ở **mọi lần hạ giá** đêm Nội bộ của FD/FDL (phương án Y), không phải ở con số 0. Y đổi hành vi FD hiện có, nên cần DOM đồng ý.
- SEC chọn X hoặc Y. ARC ghi vào decision-log khi SEC trả lời.

## 4. Hợp đồng API (câu 3) → **cần mô tả; ARC đã viết (phụ lục A)**

Không đổi schema: mọi trường liên quan vốn đã tùy chọn, và `MoneyVnd` cho phép 0. Nhưng hợp đồng là nguồn sự thật cho FE/MOB. Ít nhất hai điểm FE phải dựa vào: "`floorVnd`/`ceilingVnd` vắng ở đơn Nội bộ" và "`lateFeeAsNightVnd === 0` = trả phòng được, không xác nhận". Vì vậy cần ghi, không thể "chốt không cần".

Nội dung (chỉ mô tả, không đổi `x-roles`, không mã lỗi mới):
- mục changelog **0.3.12 (k)**;
- `extendStay.nightlyRates`;
- `checkIn.priorNightRateVnd` và `expectedSurchargeVnd` (B9a 0 đ thì không cần gửi; gửi 0 cũng được);
- `checkOut.extraNight` và `lateFeeInsteadOfNight` (hai mã 422 như mục 3.1);
- `adjustFolioLine.newUnitPriceVnd` (chuyển từ `$ref` một dòng sang `$ref` + `description`);
- `CheckInPreview.priorNight`, `ExtensionOptions.nights[]`, `CheckoutSummary.extraNight*` và `lateFeeAsNightVnd`.

ARC đã kiểm trong worktree tạm, trên head `7557e485` + bản sửa:

| Kiểm | Kết quả |
|---|---|
| Redocly 1.34.21 (bản CI dùng) | Hợp lệ, 6 cảnh báo – đúng bằng số cảnh báo trước khi sửa |
| `pnpm --filter @ottimo/api-client gen` | `generated/openapi.ts` đổi 33 dòng (chỉ chú thích JSDoc). Test `api-client` 37/37 |
| `pnpm --filter @ottimo/api gen:openapi` | `openapi-meta.ts`, `openapi-schemas.ts` **không đổi** |
| `services/api/test/contract.test.ts` | 5/5 |
| `prettier --check` (yaml + client) | OK |
| `gen_traceability.py --strict` / `gen_rbac_cases.py --check` | Exit 0 / OK. Vẫn "fields mismatched 1" như trước khi sửa |
| `openapi-spec-validator` | Không chạy ở máy (phải tải bằng pip); CI chạy |

Cách áp (BE, trên nhánh #71):
1. `git apply /private/tmp/claude-501/-Users-anhvh-Desktop-hotel-app/36df3adc-c586-471c-a039-340d2b696728/scratchpad/arc71-openapi.patch` (gồm cả `api-client` đã sinh lại). Nếu tệp tạm không còn: áp đoạn diff ở phụ lục A, rồi chạy `pnpm --filter @ottimo/api-client gen`.
2. Chạy `pnpm --filter @ottimo/api-client test` và `prettier --check`.
3. Commit, ví dụ `round-4: Review – ARC contract text for BUG-R4-038 (descriptions only) + api-client regen`.

Đã thử gộp bản sửa này với nhánh 039 (cũng sửa `openapi.yaml` và `api-client`): sạch. Sinh lại client trên cây gộp không ra dòng khác nào.

## 5. Xung đột với BUG-R4-039 ở `checkin.service.ts` (câu 4)

| Nhánh | Các đoạn đổi (số dòng của base) |
|---|---|
| #71 | 74–80 (`Evaluation.priorNight` tùy chọn khoảng), 97–108 (`outOfRange`), 181–235 (xem trước / QR), 295–315 (`priorNight` trong `evaluate`), 528–563 (đọc `priorNightRateVnd`, chặn 0 sau khi đọc đơn), 642–670 (`expectedSurchargeVnd`), 694, 708–735 (nguồn đêm), 935–970 (`writePriorNight`) |
| 039 | ~20 (import `inRoomOnSql`), 351–370 (`room_ready`, `overridableBy`), thêm hàm `roomHeldByAnotherStay` sau ~503, 585–622 (vòng ngoại lệ) |

- **Không chồng.** Cách gần nhất là hàm mới của 039 (~503) và đoạn 528 của #71, cách nhau khoảng 25 dòng, ngoài vùng ngữ cảnh của git.
- Về nghĩa, cũng không dính nhau: 039 chỉ đổi điều kiện `room_ready`; #71 chỉ đổi `priorNight` và giá.
- `git merge-tree` 71 ↔ 039 sạch theo cả hai chiều. Cây gộp thử **71 + (hợp đồng ARC) + 039 + #73**:
  - `tsc --noEmit` của `@ottimo/api` qua;
  - `validate-fixtures` 0 lỗi (218 dòng tính lại);
  - `api-client` sinh lại không ra dòng khác;
  - 3 tệp test `bug-r4-038…`, `checkin-occupied-exception`, `v104-ota-list-price-fallback`: **17/17 passed**.
- Hai nhánh cùng thêm dòng vào `br-examples.json` và cùng đặt `source.version` 0.5.3. Git gộp sạch.

Thứ tự gộp ARC đề nghị:
1. **#71 trước**, kèm hợp đồng ARC. Lý do: đây là P0, rộng hơn, và CI đã xanh trên head.
2. **039 rebase lên `main`** sau đó:
   - chạy lại `pnpm --filter @ottimo/api-client gen` (dự kiến không ra dòng khác) và để CI chạy `api-client`/`api` không lấy cache;
   - nếu 039 thêm mục changelog 0.3.12 thì đặt là **(l)**, sau (k) của #71;
   - mô tả 039 đang ghi "chờ ARC duyệt": ARC duyệt ở review riêng của 039.

Đi ngược thứ tự (039 trước) cũng gộp sạch. Khi đó #71 phải sinh lại `api-client` sau khi rebase.

## 6. Không chồng với #70 và #73 (câu 5)

- **#73** (`pricing.service.ts`, fixture test, `br-examples.json`): chỉ chung `br-examples.json`, gộp sạch. Cây gộp ở mục 5 có cả #73 và test của nó xanh. Về nghĩa: nhánh Nội bộ của #71 trả về trước khi đọc `directRate`/`otaBaseRates`, nên không dính đường dự phòng giá OTA của #73.
- **#70** (FE `BookingDialog.tsx`): không chung tệp nào với #71. Lưu ý cho ORC: **#70 @ `d3da532d` hiện CONFLICTING với `main`** ở `product/design/wireframes/assets/strings.js`. Xung đột này giữa #70 và `main`, không do #71. FE cần rebase #70.

## 7. `validate-fixtures.mjs` và oracle BR-421-04…11 (câu 7)

- Bộ kiểm:
  - `extension` có nhánh Nội bộ: mặc định 0, gõ thì lấy số gõ, `nightSources` theo `> 0 ? manual : complimentary`, `floorCeilingApplies: false`, `amountDueAfterVnd`;
  - `lateCheckout` nhận `channel` và `departureNightSellable`, thêm `surchargeLineWritten`. Nhánh sau 18:00 của Nội bộ: căn trống → `extensionVnd 0` + `extraNightSource`; đêm đã bán → `lateFeeAsNightVnd 0`;
  - dòng cũ không đổi kết quả, vì bộ so chỉ so các khóa có trong `expected`;
  - **khớp mã server**.
- 8 dòng khớp **đúng số DOM** trong BR-421 v0.5.3:
  - 04: 2 đêm → [0, 0], phải thu 0;
  - 05: gõ 0 được nhận;
  - 06: gõ 300.000 → `manual`;
  - 07: 15:00 có khách đến → 0, không dòng;
  - 08: 90.000; 09: 150.000;
  - 10: 19:00 căn trống → đêm 0 `complimentary`;
  - 11: 19:00 đêm đã bán → 0, không dòng.
- ARC đã soát: mọi khóa `expected` của 8 dòng đều được bộ kiểm tính lại, không khóa nào bị bỏ qua.
- Nhãn `GIẢ ĐỊNH` + `NGÀNH` đúng luật của validator (ô Nhãn BR-421 bắt đầu bằng `[GIẢ ĐỊNH`).
- Điểm yếu có từ trước, không do PR này: `keys = expected ∩ got`. Một khóa `expected` mà hàm tính không trả về thì bị **bỏ qua trong im lặng** (thẻ 05, cho QA).
- Chưa có dòng oracle cho B9a và cho phụ thu nhận sớm của đơn Nội bộ có thu (BR-421 (c), BR-411). Lý do: ví dụ của DOM không có số cho hai ca này. Test tích hợp đã phủ B9a 0 đ (thẻ DOM-01).

## 8. Hệ quả FE – điều kiện FE-A cần sửa ở `CheckOutPage.tsx`

Số dòng theo `main` (#71 không chạm FE; tệp giống hệt ở `7557e485`).

Hiện trạng với đơn Nội bộ, đêm ngày đi đã bán:
- server trả `extraNightRequired: true`, `extraNightAvailable: false`, **`lateFeeAsNightVnd: 0`**, `amountDueAtCheckoutVnd`;
- FE: `lateFeeMode = lateFeeAsNight !== undefined && lateFeeAsNight > 0` (dòng 562) → `false`;
- vì vậy `whyLocked = extraUnavailable && !lateFeeMode` (dòng 1768–1770) → nút **Hoàn tất** bị khóa với câu `checkout.extra_night_unavailable`.

Cần sửa (FE-A, một PR nhỏ):
1. Thêm `const lateFeeFree = extraUnavailable && s?.lateFeeAsNightVnd === 0;`. Phải so **bằng đúng 0, có mặt**. Vắng (server cũ) thì giữ khóa như hiện nay.
2. `whyLocked`: đổi nhánh đầu thành `extraUnavailable && !lateFeeMode && !lateFeeFree ? t('checkout.extra_night_unavailable') : …`.
3. `dueAtCheckout` (dòng 625–634): khi `lateFeeFree`, dùng **`s.amountDueAtCheckoutVnd`** của server, không dùng `balanceDueVnd`. Lý do: đơn Nội bộ có thu có thể đã có dòng trả muộn (B15 hẹn 17:00 → 150.000). B18 lúc 19:00 sẽ đảo dòng đó về 0. Số của server đã trừ phần này, còn `balanceDueVnd` thì chưa. Dùng `balanceDueVnd` sẽ bắt thu thừa, và `finalPayment` có thể bị 422 `AMOUNT_EXCEEDS_BALANCE`.
4. Thân B18 giữ như hiện nay: không `lateFeeInsteadOfNight` (đã đúng vì `!lateFeeMode`), không `extraNight` (đã đúng vì `extraUnavailable`). Không mở hộp mật khẩu, không gọi `getMy2fa`: `lfOffered` dòng 360 cần `> 0` nên đã đúng.
5. Chữ:
   - ô cảnh báo đỏ dòng 1335–1345 và dòng tóm tắt 1062–1068 cần câu trung tính riêng cho `lateFeeFree`. Ví dụ VI: "Đêm nay căn đã có khách. Đơn Nội bộ không tính phụ thu thay đêm (0 đ)." UXD chốt câu, có EN, theo brand guideline (ngắn, điềm tĩnh, không emoji);
   - không dùng lại `co.late_fee_as_night_line` với số 0.
6. Test FE: tóm tắt có `extraNightAvailable: false, lateFeeAsNightVnd: 0` → nút bật, thân gửi không có `lateFeeInsteadOfNight`/`extraNight`. Tóm tắt **không có** `lateFeeAsNightVnd` → vẫn khóa.

Các màn khác đã đúng với server mới, không phải sửa:
- B9a `CheckInPage.tsx`: `needTold = amount > 0` → không gửi `expectedSurchargeVnd`; không dùng `floorVnd`;
- B13 `StayDialogs.tsx`: không gửi `nightlyRates`;
- B18 khi căn trống: không có `extraNightFloorVnd` thì không kiểm khoảng; ô hiện 0;
- `FolioDialog.tsx`: đã cho giá ≥ 0.

---

## Thẻ feedback

### FB-R4-ARC-BE-PR71-01
- Mức độ: Major
- Vị trí: `product/docs/api/openapi.yaml` (không có trong PR); `packages/api-client/src/generated/openapi.ts`
- Vấn đề: PR đổi hành vi ở 5 operation và 3 schema phản hồi, nhưng `openapi.yaml` không ghi điểm nào. PR để phần chữ cho ARC.
- Vì sao quan trọng: hợp đồng là nguồn sự thật cho FE/MOB. FE-A phải dựa vào "`lateFeeAsNightVnd === 0` = trả phòng được" và "khoảng vắng ở đơn Nội bộ" (mục 8). Sửa `openapi.yaml` mà không sinh lại client là lặp lại BUG-R4-030.
- Đề xuất sửa: áp bản vá ARC (phụ lục A, hoặc tệp `arc71-openapi.patch` đã gồm client sinh lại) vào #71 trong một commit, rồi chờ CI xanh. Cách thay thế nếu ORC không muốn chạy lại CI: PR hợp đồng ARC riêng, vào `main` trước khi cắt v1.0.4 và trước PR FE-A.
- Trạng thái: Open

### FB-R4-ARC-BE-PR71-02
- Mức độ: Minor
- Vị trí: `services/api/test/integration/bug-r4-038-internal-added-night.test.ts`
- Vấn đề: ba hành vi mới chưa có test. ARC đã dò bằng ca tạm và cả ba đều đúng:
  - (1) đơn Nội bộ, đêm đã bán, gửi `lateFeeInsteadOfNight` → 422 (`amountVnd 0` → `AMOUNT_NOT_POSITIVE` ở `.amountVnd`; `> 0` → `NOT_ALLOWED`, ở cả `postReview` lẫn đường mật khẩu, không ra 401);
  - (2) B9a đơn Nội bộ **gõ** `priorNightRateVnd: 0` → 200 `complimentary`;
  - (3) B9a gõ 150.000 (dưới sàn Trực tiếp) → `manual`, đêm 150.000.
- Vì sao quan trọng: đây là các điểm hợp đồng mới ghi (thẻ 01). Không có test thì lần sửa sau dễ làm hỏng mà không biết, nhất là đường kiểm trước mật khẩu (SEC BE-64).
- Đề xuất sửa: thêm 2 ca trong cùng lần đẩy với thẻ 01 (CI chạy lại đằng nào cũng chạy). Mẫu: ca dò ARC dùng căn 301 (đêm đã bán, đơn Trực tiếp đến 17/11) và căn 402 (B9a 04:30), với cùng helper của tệp. Không kịp thì dời v1.0.5.
- Trạng thái: Open

### FB-R4-ARC-BE-PR71-03
- Mức độ: Minor
- Vị trí: `stay-night-pricing.ts` `setNightRate` (`zeroByManager`); `folio-lines.service.ts` `adjust`
- Vấn đề: A31 đưa đêm Nội bộ về 0 thì FD/FDL nhận 403, nhưng đưa về 1 đ thì FD được (đã dò: 201). Như vậy chặn 0 không phải là kiểm soát (mục 3.2).
- Vì sao quan trọng:
  - quy tắc tự mâu thuẫn: FD đã gõ 0 được ở H09/B13/B9a/B18;
  - đêm 1 đ không được gắn `complimentary`, nên lệch báo cáo Q-05;
  - lễ tân dễ "lách" bằng 1 đ thay vì gọi quản lý.
- Đề xuất sửa: v1.0.4 giữ nguyên. v1.0.5 làm theo X (0 mở cho mọi vai A31 trên đêm `room` của đơn Nội bộ, lý do bắt buộc) hoặc Y (mọi lần hạ giá đêm Nội bộ của FD/FDL cần MGR+). SEC chọn, DOM đồng ý nếu là Y. Sửa kèm mô tả `adjustFolioLine.newUnitPriceVnd` và test.
- Trạng thái: Open

### FB-R4-ARC-BE-PR71-04
- Mức độ: Suggestion
- Vị trí: `stay-support.ts` `AddedNightRate` (`floorVnd: 0`, `ceilingVnd: MAX_SAFE_INTEGER`); `checkin.service.ts` `outOfRange`; `checkout.service.ts` dòng so `x.floorVnd`/`x.ceilingVnd`
- Vấn đề: "không có khoảng" đang có hai cách biểu diễn. `AddedNightRate` và `ExtraNight` dùng giá trị canh; `Evaluation.priorNight` dùng trường tùy chọn + `outOfRange`. Cả hai đều đúng, nhưng người sửa sau phải nhớ cả hai.
- Vì sao quan trọng: nếu ai đó trả `extraNightFloorVnd: x.floorVnd` mà quên nhánh `complimentary`, Desk sẽ hiện "0 – 9.007.199.254.740.991".
- Đề xuất sửa (v1.0.5): cho `floorVnd`/`ceilingVnd` của `AddedNightRate` là tùy chọn. Đưa `outOfRange` vào `stay-support.ts` để B9a, B13, B18 dùng chung.
- Trạng thái: Open

### FB-R4-ARC-QA-PR71-05
- Mức độ: Suggestion
- Vị trí: `product/tests/tools/validate-fixtures.mjs` – đoạn tính lại (`const keys = Object.keys(row.expected).filter((k) => k in got)`)
- Vấn đề: khóa `expected` mà hàm tính không trả về bị bỏ qua trong im lặng. Chỉ khi không so được khóa nào mới báo lỗi. Có từ trước PR này. 8 dòng mới không dính (ARC đã soát).
- Vì sao quan trọng: đây là loại "xanh giả" (họ BUG-R4-013). Một dòng oracle có thể ghi số sai mà bộ kiểm vẫn báo OK.
- Đề xuất sửa: báo **cảnh báo** (rồi nâng thành lỗi) khi một khóa `expected` không có trong `got`, trừ khi dòng liệt kê khóa đó trong `uncheckedKeys`. Việc của QA (chủ validator).
- Trạng thái: Open

### FB-R4-ARC-DOM-PR71-01
- Mức độ: Suggestion
- Vị trí: `business-rules.md` BR-421 v0.5.3 (c), (d); `br-examples.json`
- Vấn đề:
  - (1) Đơn Nội bộ **có thu** (đêm cuối 300.000): trả 17:00 → 150.000, nhưng trả 19:00 khi đêm đã bán → 0. Nếu đã có dòng hẹn trả muộn (B15), B18 còn đảo nó về 0. Mã làm đúng chữ của (d); đây là câu hỏi nghiệp vụ;
  - (2) Chưa có ví dụ số cho B9a và phụ thu nhận sớm của đơn Nội bộ có thu (BR-421 (c), BR-411).
- Vì sao quan trọng: (1) trả muộn hơn mà trả ít hơn, nên lễ tân có thể hỏi lại. (2) Thiếu oracle cho một nhánh có tiền.
- Đề xuất sửa: DOM cân nhắc ở v1.0.5. Ví dụ với "có thu", sau 18:00 đêm đã bán thì giữ bậc 50 % hoặc lấy giá đêm của chính đơn. Thêm 1–2 dòng oracle B9a/BR-411 cho Nội bộ có thu. Không chặn v1.0.4.
- Trạng thái: Open

## Điểm làm tốt (nên giữ)
- Một nhánh ở **một hàm** (`addedNightRate`) cho cả xem trước, trần QR và lệnh ghi, đúng nguyên tắc "xem trước = lệnh ghi" của phụ lục 5A. Không rải `if internal` khắp nơi.
- Test đúng cách: qua HTTP như Desk gọi, đồng hồ giả, đọc oracle theo id, kiểm bất biến tiền (đơn, `stay_night`, folio). Có ca đối chứng kênh khác. Đã tự đảo `src` để chứng minh test đỏ trên mã cũ.
- PR body đủ để review: liệt kê điểm đổi hợp đồng, hệ quả FE, kế hoạch gỡ dữ liệu không đụng production, và tự nêu điểm A31 chưa nhất quán.

## Quyết định ARC – dòng đề nghị ghi vào `01-decisions/decision-log.md` (ORC ghi; tệp đang có thay đổi chưa commit của vai khác nên ARC không sửa)

| Ngày | Round | Quyết định | Người quyết | Lý do |
|---|---|---|---|---|
| 2026-11-04 | 4 | BUG-R4-038 R4: đơn Nội bộ trả sau 18:00, đêm ngày đi đã bán → phụ thu thay đêm 0 đ, không ghi dòng, **không** bước quản lý xác nhận; gửi `lateFeeInsteadOfNight` → 422 | ARC | Số tiền 0 thì không có quyết định tiền để duyệt; DOM chấp nhận cả hai cách (BR-421 (d)) |
| 2026-11-04 | 4 | BUG-R4-038 R5: v1.0.4 A31 đưa đêm `room` của đơn Nội bộ về 0 chỉ OWN/MGR; v1.0.5 làm nhất quán với giá > 0 (X hoặc Y, SEC chọn) | ARC | Chặt hơn cho bản hotfix; chặn 0 trong khi 1 đ đi được không phải kiểm soát (FB-R4-ARC-BE-PR71-03) |
| 2026-11-04 | 4 | Hợp đồng 0.3.12 (k): mô tả 5 điểm đổi hành vi BUG-R4-038, không đổi schema; áp cùng #71 kèm `api-client` sinh lại | ARC | Bài học BUG-R4-030; FE-A dựa vào `lateFeeAsNightVnd === 0` |
| 2026-11-04 | 4 | Thứ tự gộp: #71 trước, nhánh BUG-R4-039 rebase sau (sinh lại `api-client`, changelog (l)) | ARC | Không chồng mã (mục 5); P0 trước |

## Phụ lục A – bản vá `openapi.yaml` (ARC, chỉ mô tả)

Áp lên `7557e485`. Sau khi áp, chạy `pnpm --filter @ottimo/api-client gen` (sinh lại `generated/openapi.ts`, 33 dòng). `pnpm --filter @ottimo/api gen:openapi` không đổi gì.

```diff
diff --git a/product/docs/api/openapi.yaml b/product/docs/api/openapi.yaml
index 6dde9cc5..fee7f71e 100644
--- a/product/docs/api/openapi.yaml
+++ b/product/docs/api/openapi.yaml
@@ -331,6 +331,11 @@ info:
       không lưu). Chỉ bật khi guest-web có câu báo vi/en/ru cùng tag; không kịp thì phần này sang v1.0.5 và server chưa trả mã này.
     - **(j) SEC-BA-104-09 (a), gói P4-16**: `setParameter` khóa `privacy_notice_version` chỉ nhận `privacy-2026-10-v2` (danh sách version do server giữ, khớp từng ký tự);
       giá trị khác (kể cả `privacy-2026-10-v1`) → `422 PARAM_OUT_OF_RANGE` kèm `allowed[]`. Chỉ mô tả, không đổi schema; chữ đầy đủ ở mô tả `setParameter`.
+    - **(k) BUG-R4-038 (P0, BR-421 v0.5.3 nhánh Nội bộ; ARC 04/11 `rounds/round-04/reviews/ARC-on-v104-pr71-internal-nights.md`)**: đêm thêm của đơn kênh **Nội bộ** (B13, B9a, B18)
+      mặc định **0** (nguồn `complimentary`), không sàn–trần BR-105, không bậc BR-107; gõ `0` được nhận, gõ `> 0` = nguồn `manual` không sàn–trần. Chỉ mô tả, không đổi schema
+      (`floorVnd`/`ceilingVnd`/`extraNightFloorVnd`/`extraNightCeilingVnd` vốn tùy chọn – **vắng** ở đơn Nội bộ). Đổi hành vi: `extendStay.nightlyRates`, `checkIn.priorNightRateVnd` +
+      `expectedSurchargeVnd`, `checkOut.extraNight.rateVnd`, `checkOut.lateFeeInsteadOfNight` (Nội bộ, đêm đã bán: không gửi, gửi → 422), `adjustFolioLine.newUnitPriceVnd = 0`
+      (đêm `room` của đơn Nội bộ, chỉ OWN/MGR; FD/FDL → 403 `FORBIDDEN_ACTION`). Kênh khác: không đổi (`0` → 422 `AMOUNT_NOT_POSITIVE`).
 
     ## Thay đổi phiên bản 0.3.11-draft (R4 – gói LP-v2: FB-INV-008 + FB-INV-009; ARC 01/11; chi tiết `rounds/round-04/outputs/ARC/lp-v2-design.md`)
     **Trước đây 0.3.10-draft trên nhánh `lp-v2`** – đổi nhãn khi gộp sau v1.0.3 (decision-log 03/11 "ORC – số hợp đồng/migration v1.0.3 vs LP-v2"; ARC `rounds/round-04/outputs/ARC/lp-v2-main-merge.md`).
@@ -3198,7 +3203,7 @@ paths:
                 applyEarlySurcharge: { type: boolean, default: false, description: Lễ tân xác nhận ghi phụ thu vào folio (BR-414) }
                 expectedSurchargeVnd:
                   $ref: '#/components/schemas/MoneyVnd'
-                  description: 'Số phụ thu (hoặc tiền đêm thêm B9a) client đang hiển thị khi lễ tân xác nhận – bắt buộc khi `applyEarlySurcharge=true`; lệch → `409 SURCHARGE_CHANGED` (0.3.3, E03-02)'
+                  description: 'Số phụ thu (hoặc tiền đêm thêm B9a) client đang hiển thị khi lễ tân xác nhận – bắt buộc khi `applyEarlySurcharge=true`; lệch → `409 SURCHARGE_CHANGED` (0.3.3, E03-02). **v1.0.4 (BUG-R4-038, BR-421 v0.5.3 (a)–(d))**: với `addPriorNight=true` chỉ bắt buộc khi tiền đêm B9a > 0 – đơn Nội bộ đêm 0 đ thì không gửi (gửi `0` cũng được)'
                 requestFocForSurcharge: { $ref: '#/components/schemas/FocRequestInput' }
                 roomNotReadyOverride:
                   type: object
@@ -3232,7 +3237,7 @@ paths:
                   description: 'B9a – thêm đêm trước khi khách nhận trước mốc đổi ngày (BR-417, BR-010; 0.3.3, E03-05)'
                 priorNightRateVnd:
                   $ref: '#/components/schemas/MoneyVnd'
-                  description: 'Mặc định từ `CheckInPreview.priorNight.defaultRateVnd`; trong sàn–trần BR-105. **Vòng sửa 5 (ARC 16.18 – nguồn đêm theo thao tác)**: không còn bắt buộc – **vắng** = giá mặc định (nguồn `default`); **có** = lễ tân nhập tay (nguồn `manual`, kể cả bằng số gợi ý). Client chỉ gửi khi lễ tân sửa ô'
+                  description: 'Mặc định từ `CheckInPreview.priorNight.defaultRateVnd`; trong sàn–trần BR-105. **Vòng sửa 5 (ARC 16.18 – nguồn đêm theo thao tác)**: không còn bắt buộc – **vắng** = giá mặc định (nguồn `default`); **có** = lễ tân nhập tay (nguồn `manual`, kể cả bằng số gợi ý). Client chỉ gửi khi lễ tân sửa ô. **v1.0.4 (BUG-R4-038, BR-421 v0.5.3 (a)–(d))**: đơn **Nội bộ** – mặc định 0, nhận `0` (nguồn `complimentary`), `> 0` = nguồn `manual` không sàn–trần; kênh khác `0` → 422 `AMOUNT_NOT_POSITIVE` như cũ'
                 payment:
                   $ref: '#/components/schemas/PaymentCreate'
                   description: '0.3.7 (BUG-R2-038): khoản thu ở bước nhận phòng H13 (`type = charge`) – thứ tự trong giao dịch và trần `amountDueAtCheckinVnd` xem mô tả operation'
@@ -3348,7 +3353,7 @@ paths:
                 nights: { type: integer, minimum: 1, description: '≤ `ExtensionOptions.maxNights` → vượt: 422 mã trường `EXTENSION_LIMIT_EXCEEDED` (0.3.3). Đơn `externalContract=true` không bị giới hạn BR-421' }
                 nightlyRates:
                   type: array
-                  description: 'Bỏ trống = giá mặc định BR-421; sửa được trong sàn–trần BR-105. Đơn `externalContract=true` (dài hạn nhập tay) **không** sinh dòng `room` → gửi trường này: 422 `NIGHTLY_RATES_NOT_ALLOWED` (0.3.3, E04-01). **Vòng sửa 5 (BR-417 phụ lục 5A mục 3/9 – nguồn đêm theo thao tác, ARC 16.18)**: đêm **có** phần tử = lễ tân **nhập tay** (nguồn `manual`, kể cả gõ đúng số gợi ý/số lịch); đêm **không** có phần tử = **mặc định** (nguồn `default`). Server không so số với lịch. Client chỉ gửi đêm lễ tân đã sửa ô'
+                  description: 'Bỏ trống = giá mặc định BR-421; sửa được trong sàn–trần BR-105. Đơn `externalContract=true` (dài hạn nhập tay) **không** sinh dòng `room` → gửi trường này: 422 `NIGHTLY_RATES_NOT_ALLOWED` (0.3.3, E04-01). **Vòng sửa 5 (BR-417 phụ lục 5A mục 3/9 – nguồn đêm theo thao tác, ARC 16.18)**: đêm **có** phần tử = lễ tân **nhập tay** (nguồn `manual`, kể cả gõ đúng số gợi ý/số lịch); đêm **không** có phần tử = **mặc định** (nguồn `default`). Server không so số với lịch. Client chỉ gửi đêm lễ tân đã sửa ô. **v1.0.4 (BUG-R4-038, BR-421 v0.5.3 (a)–(d))**: đơn **Nội bộ** – đêm không có phần tử = 0 (nguồn `complimentary`); `amountVnd = 0` được nhận (nguồn `complimentary`); `> 0` = Nội bộ có thu (nguồn `manual`), không sàn–trần BR-105, không bậc BR-107. Kênh khác `0` → 422 `AMOUNT_NOT_POSITIVE` (`field` = `nightlyRates`) như cũ'
                   items: { $ref: '#/components/schemas/NightRate' }
                 visaWarningAckReason:
                   type: string
@@ -3917,11 +3922,16 @@ paths:
                     Mặc định `CheckoutSummary.extraNightDefaultRateVnd` (lịch giá Trực tiếp đêm đó, BR-421); giá ngoài sàn–trần BR-105 → `RATE_OUT_OF_RANGE`.
                     **Vòng sửa 5 (ARC 16.18)**: `rateVnd` không còn bắt buộc – vắng = giá mặc định (nguồn `default`); có = lễ tân nhập tay (nguồn `manual`, kể cả bằng số gợi ý);
                     khoảng nhập `CheckoutSummary.extraNightFloorVnd`–`extraNightCeilingVnd`.
+                    **v1.0.4 (BUG-R4-038, BR-421 v0.5.3 (a)–(d))**: đơn **Nội bộ** – mặc định 0 (nguồn `complimentary`), nhận `rateVnd = 0` (nguồn `complimentary`), `> 0` = nguồn `manual`
+                    không sàn–trần. Kênh khác `rateVnd = 0` → 422 `AMOUNT_NOT_POSITIVE` (`field` = `extraNight.rateVnd`) như cũ.
                   properties:
                     rateVnd: { $ref: '#/components/schemas/MoneyVnd' }
                 lateFeeInsteadOfNight:
                   type: object
                   description: |
+                    **v1.0.4 (BUG-R4-038, BR-421 v0.5.3 (a)–(d))**: đơn **Nội bộ** – `CheckoutSummary.lateFeeAsNightVnd = 0`, không có gì để thu nên **không** có bước xác nhận: B18 gửi không kèm trường này
+                    (và không kèm `extraNight`), không ghi dòng `late_checkout`. Gửi trường này (mọi cách xác nhận, kể cả `postReview`) → 422, kiểm trước mật khẩu, không đếm sai, không ghi gì:
+                    `amountVnd = 0` → `AMOUNT_NOT_POSITIVE` (`field` = `lateFeeInsteadOfNight.amountVnd`, như cũ); `amountVnd > 0` → `NOT_ALLOWED` (`field` = `lateFeeInsteadOfNight`).
                     0.3.7 bổ sung 4 (BUG-R2-139, BR-416-06): "Trả phòng – phụ thu trả muộn bằng giá 1 đêm" khi đêm ngày đi không bán được – **quản lý trở lên xác nhận tại quầy** (ARC 18/10):
                     lễ tân làm B18, quản lý nhập tên đăng nhập + mật khẩu của mình (`approverUsername`, `authMethod`, `secret`); người gọi là OWN/MGR thì bỏ `approverUsername`, nhập lại mật khẩu
                     của chính mình. Không tạo yêu cầu duyệt. Người xác nhận phải là OWN/MGR **của cơ sở** và đang hoạt động; sai mật khẩu, tên không có hoặc không đủ vai đều trả **cùng** 401
@@ -5361,7 +5371,13 @@ paths:
               required: [reason]
               properties:
                 newQuantity: { type: number, minimum: 0 }
-                newUnitPriceVnd: { $ref: '#/components/schemas/MoneyVnd' }
+                newUnitPriceVnd:
+                  $ref: '#/components/schemas/MoneyVnd'
+                  description: |
+                    **v1.0.4 (BUG-R4-038, BR-421 v0.5.3; DOM R5)**: `0` chỉ nhận trên dòng `room` của đơn **Nội bộ** còn đồng bộ (`hold`/`confirmed`/`in_house`, A31) và chỉ **OWN/MGR**
+                    (FD/FDL → 403 `FORBIDDEN_ACTION`); lý do bắt buộc như mọi điều chỉnh. Đêm thành nguồn `complimentary` (audit `reservation.repriced` `rateSource: complimentary`),
+                    `totalRoomVnd` tính lại từ đêm. Mọi trường hợp khác `0` → 422 `AMOUNT_NOT_POSITIVE` (kênh khác, dòng `extra_person`, dòng khác, folio `settled` – A32 không đồng bộ đêm).
+                    Đơn Nội bộ không có sàn–trần BR-105 nên giá `> 0` không bị chặn khoảng (FD+ như A31).
                 voidLine: { type: boolean, default: false }
                 reason: { type: string, minLength: 3, maxLength: 500 }
             example: { newUnitPriceVnd: 150000, reason: 'Khách trả 14:00 không phải 15:00' }
@@ -11499,8 +11515,8 @@ components:
           properties:
             date: { $ref: '#/components/schemas/LocalDate' }
             available: { type: boolean, description: 'Căn trống đêm trước và không có OOO (BR-906)' }
-            defaultRateVnd: { $ref: '#/components/schemas/MoneyVnd', description: 'Vòng sửa 5: giá bước 4 của BR-417 phụ lục 5A cho đêm B9a (đêm tham chiếu = đêm nhập tay sớm nhất sau `date`, AN-32)' }
-            floorVnd: { $ref: '#/components/schemas/MoneyVnd', description: 'Vòng sửa 5 – khoảng Desk bước 4 phụ lục 5A (min áp → sàn thấp hơn của hai căn)' }
+            defaultRateVnd: { $ref: '#/components/schemas/MoneyVnd', description: 'Vòng sửa 5: giá bước 4 của BR-417 phụ lục 5A cho đêm B9a (đêm tham chiếu = đêm nhập tay sớm nhất sau `date`, AN-32). **v1.0.4 (BUG-R4-038, BR-421 v0.5.3 (a)–(d))**: đơn Nội bộ = 0 (nguồn `complimentary`)' }
+            floorVnd: { $ref: '#/components/schemas/MoneyVnd', description: 'Vòng sửa 5 – khoảng Desk bước 4 phụ lục 5A (min áp → sàn thấp hơn của hai căn). **v1.0.4 (BUG-R4-038, BR-421 v0.5.3 (a)–(d))**: **vắng** ở đơn Nội bộ – cùng `ceilingVnd`' }
             ceilingVnd: { $ref: '#/components/schemas/MoneyVnd', description: 'Vòng sửa 5 – khoảng Desk bước 4 phụ lục 5A (min áp → trần cao hơn của hai căn)' }
             createsChildReservation: { type: boolean, description: 'Đơn OTA → đơn con kênh Trực tiếp (BR-422)' }
         earlyCheckinSurcharge:
@@ -11589,8 +11605,8 @@ components:
             properties:
               date: { $ref: '#/components/schemas/LocalDate' }
               available: { type: boolean }
-              defaultRateVnd: { $ref: '#/components/schemas/MoneyVnd', description: 'Vòng sửa 5: giá bước 4 của BR-417 phụ lục 5A (giá trước bậc)' }
-              floorVnd: { $ref: '#/components/schemas/MoneyVnd', description: 'Vòng sửa 5 – khoảng Desk theo bước 4 phụ lục 5A: sàn–trần căn đêm thêm; khi quy tắc min áp = sàn thấp hơn của hai căn' }
+              defaultRateVnd: { $ref: '#/components/schemas/MoneyVnd', description: 'Vòng sửa 5: giá bước 4 của BR-417 phụ lục 5A (giá trước bậc). **v1.0.4 (BUG-R4-038, BR-421 v0.5.3 (a)–(d))**: đơn Nội bộ = 0 (nguồn `complimentary`)' }
+              floorVnd: { $ref: '#/components/schemas/MoneyVnd', description: 'Vòng sửa 5 – khoảng Desk theo bước 4 phụ lục 5A: sàn–trần căn đêm thêm; khi quy tắc min áp = sàn thấp hơn của hai căn. **v1.0.4 (BUG-R4-038, BR-421 v0.5.3 (a)–(d))**: **vắng** ở đơn Nội bộ (không có khoảng) – cùng `ceilingVnd`' }
               ceilingVnd: { $ref: '#/components/schemas/MoneyVnd', description: 'Vòng sửa 5 – trần căn đêm thêm; khi quy tắc min áp = trần cao hơn của hai căn (bước 4 phụ lục 5A)' }
     LateCheckoutResult:
       type: object
@@ -11729,8 +11745,8 @@ components:
         pendingApprovals: { type: integer, description: 'Không tính yêu cầu loại `refund` (0.3.6). 0.3.6 bổ sung 2 (BA v0.3, ARC 17/10): chỉ yêu cầu tiền (`foc`, `special_discount`, `damage_pricing`)' }
         unhandledCreditVnd: { $ref: '#/components/schemas/MoneyVnd', description: '0.3.6 bổ sung 2 (BA v0.3, ARC 17/10) (E15-05): `creditVnd` − yêu cầu hoàn đang mở; blocker `credit_balance` khi > 0' }
         extraNightRequired: { type: boolean, description: '0.3.6 bổ sung 2 (BA v0.3, ARC 17/10) (E05-11): giờ trả (`checkoutTime`/`checkoutAt`) sau mốc cuối BR-412 → `checkOut` phải gửi `extraNight`' }
-        extraNightDefaultRateVnd: { $ref: '#/components/schemas/MoneyVnd', description: '0.3.6 bổ sung 2 (BA v0.3, ARC 17/10); có khi `extraNightRequired`. **Vòng sửa 5**: giá bước 4 của BR-417 phụ lục 5A cho đêm ngày đi (AN-43) – thay các câu BUG-R2-134 trước đây' }
-        extraNightFloorVnd: { $ref: '#/components/schemas/MoneyVnd', description: '0.3.7 bổ sung 4 (vòng sửa 5): khoảng Desk cho `extraNight.rateVnd` theo bước 4 phụ lục 5A – sàn căn đêm thêm; min áp → sàn thấp hơn của hai căn. Có khi `extraNightRequired`' }
+        extraNightDefaultRateVnd: { $ref: '#/components/schemas/MoneyVnd', description: '0.3.6 bổ sung 2 (BA v0.3, ARC 17/10); có khi `extraNightRequired`. **Vòng sửa 5**: giá bước 4 của BR-417 phụ lục 5A cho đêm ngày đi (AN-43) – thay các câu BUG-R2-134 trước đây. **v1.0.4 (BUG-R4-038, BR-421 v0.5.3 (a)–(d))**: đơn Nội bộ = 0 (nguồn `complimentary`)' }
+        extraNightFloorVnd: { $ref: '#/components/schemas/MoneyVnd', description: '0.3.7 bổ sung 4 (vòng sửa 5): khoảng Desk cho `extraNight.rateVnd` theo bước 4 phụ lục 5A – sàn căn đêm thêm; min áp → sàn thấp hơn của hai căn. Có khi `extraNightRequired`. **v1.0.4 (BUG-R4-038, BR-421 v0.5.3 (a)–(d))**: **vắng** ở đơn Nội bộ – cùng `extraNightCeilingVnd`' }
         extraNightCeilingVnd: { $ref: '#/components/schemas/MoneyVnd', description: '0.3.7 bổ sung 4 (vòng sửa 5): trần tương ứng (min áp → trần cao hơn của hai căn)' }
         lateFeeAsNightVnd:
           $ref: '#/components/schemas/MoneyVnd'
@@ -11738,6 +11754,8 @@ components:
             0.3.7 bổ sung 4 (BUG-R2-139, BR-416-06 – DOM 18/10): **phụ thu trả muộn bằng giá 1 đêm** – có khi `extraNightRequired = true` **và** `extraNightAvailable = false` (đêm ngày đi không
             bán được). = giá bước 4 phụ lục 5A của đêm ngày đi (= `extraNightDefaultRateVnd`; AN-44; không thêm đêm nên không tính lại bậc BR-107 các đêm). Ghi bằng `checkOut.lateFeeInsteadOfNight` (quản lý xác nhận).
             Ví dụ 203, 16–18/04/2030, đã thu đủ, căn có khách đến 18/04, rời 19:00 → **792.000**
+            **v1.0.4 (BUG-R4-038, BR-421 v0.5.3 (a)–(d))**: đơn **Nội bộ** → **0** (giá mặc định đêm thêm của đơn Nội bộ) – B18 **không** gửi `lateFeeInsteadOfNight` (gửi → 422, xem `checkOut`), không ghi dòng,
+            không cần quản lý xác nhận. Client: `lateFeeAsNightVnd === 0` (có mặt, bằng 0) = trả phòng được, không mở hộp xác nhận; vắng = server cũ (giữ khóa như trước).
         extraNightAvailable: { type: boolean, description: '0.3.6 bổ sung 2 (BA v0.3, ARC 17/10): căn còn trống đêm ngày đi (false → lễ tân xử lý đổi phòng/khách đến trước khi trả). **0.3.7 bổ sung 4 (BUG-R2-139, BR-416-06)**: `false` → không bao giờ cộng đêm thêm; đường trả phòng là `lateFeeInsteadOfNight` (`lateFeeAsNightVnd`), hoặc dời khách đến sang căn khác rồi tóm tắt lại' }
         minibarUncheckedRooms:
           type: array
```

---

## Lượt 2 @ `02c34bc9` – 05/11/2026

- Người review: ARC | Round 4 – v1.0.4 – Bước **Review** (lượt 2) | 05/11/2026
- Đối tượng: `v104/fix-internal-added-night` @ `02c34bc9`, thêm 3 commit trên `7557e485`:
  - `d47c3649`: bản vá hợp đồng của ARC + `api-client` sinh lại (thẻ 01);
  - `1e3a91fd`: test cho thẻ ARC 02 và SEC PR71-01; `actorRole` (SEC PR71-02) ở `folio-lines.service.ts`, `stay-night-pricing.ts`;
  - `02c34bc9`: một câu ở `CheckoutSummary.lateFeeAsNightVnd` (ORC 05/11) + client sinh lại; ca BR-421-11 thêm bước B15 17:00.
- Đọc: `git diff 7557e485 02c34bc9` (5 tệp, +213/−26), `gh pr checks 71`, log CI run `41874464049`.
- ARC tự chạy: worktree tạm và PostgreSQL 17 riêng trong scratchpad, **đã xóa** khi xong; máy tải 8–65. Chỉ chạy tệp `bug-r4-038-internal-added-night.test.ts` (không chạy cả bộ API, theo ORC), 4 đột biến mã, đảo `src`, `gen_traceability.py --strict` trên 3 cây.

### Phán quyết lượt 2: **ĐẠT**

C1 đã đóng. Cả 5 điểm ORC hỏi đều đúng (bảng dưới). Không có thẻ mới chặn gộp.

Gộp khi CI xanh thật. Đây là luật chung, không phải điều kiện riêng của ARC:
- CI của `02c34bc9` chỉ đỏ ở 2 ca "Hôm nay" trong `v104-holds-feb.test.tsx` (admin-web). Turbo dừng nên `@ottimo/api:test` chưa chạy xong. Log CI không có dòng nào của `bug-r4-038…`.
- CI chạy theo `pull_request` (checkout ref gộp với `main`). Vì vậy sau khi #76 vào `main`, chỉ cần **chạy lại** CI của #71, không phải rebase. ORC soát log: `@ottimo/api:test` là cache miss và có `bug-r4-038-internal-added-night.test.ts` 11/11.
- Các bước khác đã xanh trên `02c34bc9`: Format, ESLint + `tsc` (`@ottimo/api:typecheck` cache miss, chạy thật), test drift `api-client`, Redocly, spec validator + RBAC `--strict`, gitleaks.

Điều kiện phát hành R1–R3 của lượt 1 giữ nguyên, ORC theo dõi. Câu mới ở điểm 2 là chỗ dựa hợp đồng cho R1: FE-A tính `dueAtCheckout` bằng `amountDueAtCheckoutVnd` (mục 8 bước 3).

### Kết quả 5 điểm

| # | Câu hỏi | Kết luận | Bằng chứng |
|---|---|---|---|
| 1 | C1: `d47c3649` áp đúng nguyên bản vá; `generated/openapi.ts` khớp kết quả sinh lại | **Đúng** | `git patch-id --stable` của `arc71-openapi.patch` và của `git diff 7557e485 d47c3649` trùng nhau (`cac50d93…`). Các dòng +/− từng tệp trùng khít (yaml 38, client 33). `pnpm --filter @ottimo/api-client gen` trên `02c34bc9` → "openapi.ts up to date". CI: test drift `api-client` xanh. Sinh lại trên cây gộp thử `main`+#71 và `main`+#71+#74: không khác |
| 2 | `lateFeeAsNightVnd = 0` → số cần thu là `amountDueAtCheckoutVnd`, không phải `balanceDueVnd` | **Đúng**; test BR-421-11 chứng minh được | Mục 2.1 |
| 3 | ARC 02: đơn Nội bộ gửi `lateFeeInsteadOfNight` → 422, kể cả mật khẩu sai, không ghi audit | **Đúng**; test bắt được lỗi | Mục 2.2 |
| 4 | `actorRole` không đổi hành vi nhánh giá > 0 | **Đúng** | Mục 2.3 |
| 5 | Lệch `traceability.md` có sẵn trên `main` | **Đúng**; #71 không thêm lệch | Mục 2.4 |

### 2.1 Điểm 2 – câu `lateFeeAsNightVnd = 0`

Mã (`checkout.service.ts`, không đổi từ lượt 1):
- `summary` tính `amountDueAtCheckoutVnd` bằng `dueAtCheckout(…, lateFeeAsNight = true)`:
  max(0, `balanceDueVnd` − `rawCreditVnd` + (phụ thu mới − FOC mới) − (dòng `late_checkout` đang sống − FOC của nó) + đêm thêm).
- Đơn Nội bộ, đêm ngày đi đã bán: phụ thu mới = `lateChargeOf(d)` = `defaultRateVnd` = 0, không có đêm thêm. Vậy số cần thu = số dư − dòng B15 đang sống.
- B18: `surcharge = 0 < old.grossVnd`, nên `replaceLateCharge` đảo dòng B15 (dòng 1134). Việc này xảy ra **trước** khi kiểm trần `finalPayment` (dòng 1211, trần = số dư sau khi đảo). Hệ quả:
  - `finalPayment = amountDueAtCheckoutVnd` → đi được;
  - `finalPayment = balanceDueVnd` → 422 `AMOUNT_EXCEEDS_BALANCE` khi có dòng B15.
- Câu mới khớp định nghĩa sẵn có của `amountDueAtCheckoutVnd` (0.3.7 S4-47: số cần thu nếu hoàn tất B18 ngay, là trần của `finalPayment`). Câu chỉ nói rõ cho ca 0. Không đổi schema, không cần mục changelog riêng.

Test BR-421-11 (`02c34bc9`):
- B15 lúc 10:00, hẹn trả 17:00 → dòng 150.000 (số của BR-421-09: đơn Nội bộ có thu, đêm cuối 300.000).
- 19:00, đêm đã bán: tóm tắt trả `lateFeeAsNightVnd 0`, `amountDueAtCheckoutVnd 0`, `balanceDueVnd 150.000`.
- B18 không gửi trường gì thêm → 200. Tổng dòng trả muộn còn sống = 0, số dư 0.
- **Đột biến M1** (bỏ phần trừ dòng cũ trong `dueAtCheckout`, tức "số cần thu = số dư"): ca BR-421-11 **đỏ** đúng ở `amountDueAtCheckoutVnd` (nhận 150.000, mong 0). Vậy test bắt được đúng lỗi mà câu hợp đồng cảnh báo.
- Giới hạn, không thành thẻ: sau khi đảo thì phần còn nợ là 0, nên test không có ca "còn nợ thật > 0 + `finalPayment`". Chấp nhận được, vì công thức dùng chung cho mọi kênh và `checkout-due.test.ts` (S4-47) đã phủ "số hiện = số B18 để lại" cùng trần `finalPayment`. Chỉ nhánh 0 của Nội bộ là mới, và BR-421-11 phủ nhánh đó.
- Sửa nhỏ, hợp lý: `surchargeLineWritten` nay so **tổng tiền các dòng sống** thay cho số dòng. Lý do: khi có B15, sau B18 có cả dòng gốc lẫn dòng đảo.

### 2.2 Điểm 3 – `lateFeeInsteadOfNight` trên đơn Nội bộ, đêm đã bán

- Ca B18 "đêm ngày đi đã bán" thêm 3 lần gửi, mỗi lần kiểm 422 và đúng mã:
  - `postReview`, `amountVnd 0` → `lateFeeInsteadOfNight.amountVnd` `AMOUNT_NOT_POSITIVE`;
  - `postReview`, `amountVnd 1` → `lateFeeInsteadOfNight` `NOT_ALLOWED`;
  - MGR + mật khẩu sai, `amountVnd 1` → `lateFeeInsteadOfNight` `NOT_ALLOWED`.
- Sau đó: đơn vẫn `in_house`, không có audit `reservation.late_fee_instead_of_night`. Rồi B18 không kèm trường → 200.
- **M2** (bỏ `|| freeNight` ở dòng thêm `NOT_ALLOWED`): đỏ. Lần gửi `postReview` 1 ra **200**, đơn bị trả phòng.
- **M2b** (chỉ chặn khi có `postReview`, để đường mật khẩu đi qua): đỏ ở lần gửi thứ 3, ra **401 `REAUTH_FAILED`**. Nghĩa là lần gửi này thật sự tới bước mật khẩu nếu precheck để lọt. Kết quả 422 hiện nay chứng minh precheck chạy trước mật khẩu, nên không đếm sai mật khẩu.
- B9a gõ tay (thẻ 02 (2)(3)): ca mới gõ `0` → `complimentary`; gõ `150.000` (dưới sàn Trực tiếp) → `manual`, thu 150.000 lúc nhận phòng, số dư 0.
- Đảo `src` về `c2506a53`, giữ test của head: **9 đỏ, 2 xanh (11)**. Ca B9a gõ tay mới cũng đỏ trên mã cũ. Hai ca xanh vẫn là đối chứng Trực tiếp và BR-421-07, như lượt 1.

### 2.3 Điểm 4 – `actorRole` (SEC PR71-02)

- `folio-lines.service.ts`: `actorRole` chỉ được thêm vào input của `setNightRate` trong nhánh `zeroPrice`, cùng chỗ với `zeroByManager`. Giá > 0 thì input giống hệt trước. `actorRoleOf` là hàm thuần (không truy vấn, không ném lỗi), đã được import và dùng sẵn ở dòng 696, 714.
- `stay-night-pricing.ts`: chỉ ghi `actorRole` vào `after` của `reservation.repriced` khi `complimentary`, tức giá 0. Giá 0 chỉ tới được đây khi là dòng `room` + đơn Nội bộ + `zeroByManager`; các ca khác đã ném 422/403 trước đó. Nhánh `extra_person` không đổi. `setNightRate` chỉ có một chỗ gọi.
- `actorRole` đã có trong danh sách cho phép audit của `reservation` (`frontdesk/audit-entities.ts`), nên không ném lỗi entity audit.
- Test: FD gõ 1 đ → audit `rateSource: manual`, actor là FD, **không** có `actorRole`. MGR đưa về 0 → `actorRole: manager`. **M3** (bỏ `actorRole`): ca BR-421-04/05/06 đỏ.

### 2.4 Điểm 5 – `traceability.md`

| Cây | `gen_traceability.py --strict --out <tạm>` | So với bản sinh trên `main` |
|---|---|---|
| `main` `476fd9b8` | exit 0; "ops mismatched 0; fields mismatched 1" | – |
| head `02c34bc9` | exit 0; log giống hệt | Tệp `.md` sinh ra giống hệt |
| `main` + #71 (gộp thử, sạch) | exit 0; log giống hệt | Giống hệt |

- `product/docs/qa/traceability.md` đã commit giống hệt nhau trên `main` và `02c34bc9`, vì #71 không chạm tệp này. Lần sinh lại gần nhất là Round 2 (`e3f98d17`).
- Bản sinh từ `main` lệch bản đã commit khoảng 49 dòng (AC dời R3, BR mới, operation mới, luồng LP-v2…). Đây là lệch có sẵn trên `main`, không do #71.
- "fields mismatched 1" là `email` D27: `x-visible-to: owner`, trong khi RBAC cho MGR "Đầy". Lệch này có sẵn, theo chiều ẩn bớt (không lộ dữ liệu), nên không làm `--strict` đỏ. Không do #71.
- CI ghi bản sinh ra `$RUNNER_TEMP`, nên lệch so với tệp đã commit không bao giờ làm CI đỏ. Gợi ý cho QA (chủ tệp): sinh lại và commit `traceability.md` bằng một PR tài liệu riêng trước QC v1.0.4, không đưa vào hotfix.

### 2.5 Gộp với `main` và #74 (head mới)

- `git merge-tree`: `main`+#71, `main`+#74 (`9646029d`), `main`+#71+#74 đều sạch.
- Sinh lại `api-client` từ `openapi.yaml` của cây `main`+#71 và `main`+#71+#74: trùng với tệp sinh ra mà git gộp. #74 không thêm mục changelog, nên chưa có (l).
- Thứ tự gộp của lượt 1 (mục 5) và review #74 (mục 6) giữ nguyên.

### Trạng thái thẻ sau lượt 2

| ID | Trạng thái | Ghi chú |
|---|---|---|
| FB-R4-ARC-BE-PR71-01 (Major) | **Closed** | `d47c3649` = bản vá ARC (patch-id trùng) + client sinh lại. `02c34bc9` thêm một câu đúng (mục 2.1). Các job hợp đồng trên CI xanh |
| FB-R4-ARC-BE-PR71-02 (Minor) | **Closed** | Đủ (1), (2), (3). Đột biến M2/M2b chứng minh test bắt được lỗi |
| FB-R4-ARC-BE-PR71-03 (Minor) | Open – dời v1.0.5 | Test ghi rõ FD gõ 1 đ là chủ ý. Chờ SEC chọn X/Y |
| FB-R4-ARC-BE-PR71-04 (Suggestion) | Open – v1.0.5 | Không đổi |
| FB-R4-ARC-QA-PR71-05 (Suggestion) | Open – QA | Không đổi |
| FB-R4-ARC-DOM-PR71-01 (Suggestion) | Open – DOM, v1.0.5 | Ca BR-421-11 mới cho thấy rõ ý (1): đơn có thu trả 17:00 thì phụ thu 150.000; trả 19:00 khi đêm đã bán thì 0, và dòng 150.000 bị đảo |

Không có ESC mới. Không có dòng decision-log mới: 4 dòng đề nghị ở lượt 1 vẫn dùng được (ORC ghi).
