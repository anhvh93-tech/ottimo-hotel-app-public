# DOM review – BE-A2 PR #133 (V5-16, đếm lại minibar ghi `folio_line.adjusted`)

- Người review: DOM | Round 5 (v1.0.5) – Review | Ngày: 07/11/2026
- Đối tượng: PR #133, nhánh `r5-v516-minibar` @ **`0636f2fc`** (draft, xếp trên #110 @ `e870a1c9`; `e870a1c9` là tổ tiên của `0636f2fc`). So với #110, PR đổi 2 tệp:
  - `product/services/api/src/modules/inventory/internal/minibar.service.ts` (commit `0b2ebb45`, rồi gộp `origin/r5-b2` ở `d3c60e28`, `0636f2fc`);
  - `product/services/api/test/integration/v5-16-minibar-recount-audit.test.ts` (tệp mới).
- Đối chiếu:
  - lệnh (A) ở `rounds/round-05/responses/DOM-responses.md`: phần chặn hoãn tới màn đếm của buồng phòng (R5-B-15), phần audit làm sớm;
  - `DOM-on-be-prs-101-108-110.md` mục 3.3 (luật đếm lại, ý 1–4); BR-438 (2a), (4) (`product/docs/business-rules.md` v0.5.14+);
  - oracle `product/tests/fixtures/br-examples.json` BR-438-08 (ca a–g, `pendingFix` FB-R5-SEC-BE-V516-01);
  - sổ tay `product/docs/manual/guides/01-chu-dau-tu-quan-ly.md` dòng 371 ("Mỗi tuần"), 569–577 (mục 8.1), 919 (K-MB);
  - `product/docs/release-notes.md` dòng 77, 91; plan `rounds/round-05/plan.md` mục 4a dòng T5; thẻ DOM 110-02 (`DOM-on-be-h-prs-110-131.md`).
- DOM đọc mã bằng `git show` / `git diff e870a1c9..0636f2fc`, không chạy test. CI của #133 lúc đọc: job chính đang chạy, `infra scripts (shellcheck)` đỏ (không thuộc 2 tệp này). DOM chỉ kết luận nghiệp vụ.
- Số tiền dưới đây là số ví dụ của oracle (bia 35.000). Không dữ liệu khách.

## 0. Kết luận

| PR | SHA | Kết luận DOM | Thẻ |
|---|---|---|---|
| #133 | `0636f2fc` | **DUYỆT.** Đúng lệnh (A): chỉ phần audit, không chặn. Mỗi món có dòng nhỏ đi ghi đúng **một** `folio_line.adjusted`, lý do `minibar_recount`, 5 khóa (`actorRole` + 4 khóa dòng gốc). Bản ghi có trong **Sửa giảm dòng – 7 ngày**; món về 0 có thêm trong `removalsOnly`. Chỉ FD/FDL vào `line_reduction_count`. Không ghi gì khi đếm tăng, đếm giữ dòng (R6), đếm lần đầu của kỳ | 133-01 (Minor, cho R5-B-15, không chặn #133), 133-02 (Minor, BE-A2, nên làm trong #133 trước khi rời draft), 133-03 (Suggestion, QA + BE-A2) |

**Thẻ 110-02:** điều kiện nay là **#133 @ `0636f2fc`** có trong tag v1.0.5 (mục 3).

Không có ESC mới. Luật dùng ở đây đều đã chốt (BR-438 (2a), DOM 3.3, lệnh (A)). Mục 133-01 là DOM làm rõ luật cũ cho phần chặn, không phải chính sách mới.

---

## 1. Đối chiếu với lệnh (A) và luật đếm lại (DOM 3.3)

| Điểm | Luật | #133 @ `0636f2fc` | Đạt |
|---|---|---|---|
| Lệnh (A) | Phần chặn (403 trên `recordMinibarCheck`) hoãn tới R5-B-15. Phần audit lên sớm | Chú thích đầu tệp ghi rõ "Nothing is refused here", 403 chờ hợp đồng cho `recordMinibarCheck`. Không đổi mã lỗi hay luồng đếm | Đạt |
| 3.3 ý 1 – xét từng món | Mỗi món có số tiền mới nhỏ hơn dòng đang sống là một lần sửa giảm | Vòng R7 tính `isLineReduction('minibar', live, amount)` theo từng món. Test 202: hai món giảm trong một lần đếm → hai bản ghi | Đạt |
| 3.3 ý 1 – dòng gốc | Người ghi, ngày ghi lấy theo dòng gốc (`rootLineOf`, như #110). Dòng đã sửa bằng **Điều chỉnh** về dòng đếm ban đầu | `recountOrigin` = `rootLineOf` + `reductionScope` của #110, đọc **trước** khi đảo dòng. Ngày nghiệp vụ dùng mốc `business_day_rollover` ở ngày ghi dòng gốc. Test 203: quản lý nâng lên 3 bằng Điều chỉnh, Hạnh đếm lại 1 → `rootLineId` = dòng đếm của Hạnh | Đạt (xem 133-01 cho chuỗi đếm lại R7) |
| 3.3 ý 3 – như cũ | Lần đếm giữ dòng (R6), lần đếm tăng, lần đếm đầu không là sửa giảm | R6 `continue` trước khối audit. Đếm tăng: `isLineReduction` sai. Đếm đầu kỳ: `history()` rỗng nên không có `live`. Test 201: tăng từ không dòng, rồi đếm lại cùng số → số bản ghi giữ 2 | Đạt |
| 3.3 ý 4 – mọi vai đều ghi | HK, MGR, OWN đếm lại như cũ, nhưng mọi lần làm dòng nhỏ đi đều ghi một `folio_line.adjusted` `minibar_recount` | Không lọc theo vai trước khi ghi. Test 201: HK đếm về 0 → bản ghi `actorRole: housekeeping`, `after.amountVnd` 0 | Đạt |
| 3.3 ý 4 – chỉ FD/FDL vào số đếm | `line_reduction_count` chỉ đếm vai lúc sửa FD/FDL | Số đếm đi qua cổng `countLineReductionsByActor` của #110 với `FRONT_DESK_ROLES` = `front_desk`, `front_desk_lead`. Đúng về mã, nhưng test chưa chứng minh HK bị loại (133-02) | Đạt về mã |
| Bộ lọc 7 ngày | Lần đếm lại thấp hơn có trong **Sửa giảm dòng – 7 ngày**; về 0 có trong `removalsOnly` | `before.category` minibar, `after.amountVnd` < `before.amountVnd` → khớp `lineReductionWhere`. Test: 2 → 1 có ở `reductionsOnly`, không có ở `removalsOnly`; 1 → 0 có ở cả hai | Đạt |
| Chữ chủ đầu tư đọc | Lý do hiện **Đếm lại minibar**, không hiện mã | `reason` = `minibar_recount`; Desk dịch bằng `mlog.reason.minibar_recount` ("Đếm lại minibar" / "Minibar recounted") qua `auditReasonText` | Đạt |
| Dữ liệu trong bản ghi | Chỉ id và cờ, không số tiền ngoài `amountVnd`, không dữ liệu khách | Test khẳng định đúng 7 khóa của `before`. `entity_code` = mã đơn | Đạt |

Bản ghi nằm trên **dòng cũ** (`entityId` = dòng đang sống trước lần đếm), giống `adjustFolioLine`. Nhật ký thao tác tiền của một lần đếm thấp hơn có 3 hàng: **Đảo dòng folio**, **Điều chỉnh dòng folio** và **Thêm dòng folio** (hàng cuối không có khi về 0). Cả 3 cùng lý do **Đếm lại minibar**. Vậy là khớp sổ tay dòng 573 và release notes dòng 77. Bộ lọc 7 ngày chỉ lấy hàng **Điều chỉnh dòng folio**, nên mỗi món chỉ hiện một lần.

## 2. Oracle BR-438-08 ở v1.0.5 (chỉ có phần audit)

Ghi chú `pendingFix` của oracle: khi v1.0.5 chỉ có phần audit, các ca (a), FDL của (e) và lần 06:10 của (g) thành "được + một `folio_line.adjusted` `minibar_recount`". Đây là giới hạn đã biết. Kiểm soát tạm là K-MB (đếm kho mỗi tuần) và việc rà bộ lọc mỗi tuần.

| Ca | Kỳ vọng ở v1.0.5 theo mã #133 | Test #133 |
|---|---|---|
| (a) Lan FD đếm 2 trên lần đếm 3 của Minh HK | Được. Bill 70.000, không FOC. Một bản ghi `actorRole front_desk`, `postedByActor` **false**, `sameBusinessDay` true. Vào số đếm của Lan (+1). Hạn mức FOC tháng của Lan **không** bị trừ | Có (201, ca 1: dòng HK 2 → Lan 1). Chưa khẳng định +1 cho Lan (133-02) |
| (b) Minh HK tự đếm lại 2 | Được. Một bản ghi `housekeeping`, cả 3 cờ true. Số đếm +0 | Chưa có (cùng nhánh mã với (d)) – 133-03 |
| (c) Lan đếm lại lần của chính mình trong ngày | Được. Một bản ghi `front_desk`, cả 3 cờ true. Số đếm +1 | Có (202: Hạnh 2 bia + 1 coca → 0; cả hai vào số 4 của Hạnh) |
| (d) Minh HK đếm lại lần của Lan | Được. Một bản ghi `housekeeping`, `postedByActor` false. Số đếm +0 | Có (201, ca 2, về 0, có ở `removalsOnly`). Chưa chứng minh +0 (133-02) |
| (e) FDL, rồi MGR trên lần đếm của HK | FDL: được + bản ghi `front_desk_lead`, số đếm **+1** (oracle phần chặn: 403, +0). MGR chạy **tiếp** sau FDL: cùng số với lần FDL vừa đếm, nên R6 giữ dòng, **không** bản ghi (oracle phần chặn: 1 bản ghi). MGR chạy riêng trên lần đếm HK: được + bản ghi `manager`, +0 | Chưa có – 133-03 |
| (f) Đếm giữ dòng, đếm tăng | Không bản ghi | Có (201, cuối ca 2) |
| (g) Lan đếm 23:50, đếm lại 00:20 hoặc 06:10 (hai lần chạy riêng, cùng từ dòng gốc) | 00:20: cùng ngày nghiệp vụ, `sameBusinessDay` true, +1 như (c). 06:10: được + bản ghi `sameBusinessDay` **false**, +1 (oracle phần chặn: 403) | Một phần (202: 09:00 hôm trước → 09:00 hôm sau, `sameBusinessDay` false). Ca qua nửa đêm, trước 06:00 chưa có – 133-03 |
| Thêm: Điều chỉnh rồi đếm lại (3.3 ý 1) | Dòng gốc là lần đếm đầu | Có (203) |

Ở OTTIMO hiện nay, tài khoản trực ca giữ 6 vai, trong đó có quản lý. `actorRoleOf` lấy vai cao nhất nên bản ghi mang `actorRole manager` và không vào `line_reduction_count`. Bản ghi vẫn có trong bộ lọc 7 ngày. Dòng "Mỗi tuần" ở sổ tay (dòng 371) bảo chủ đầu tư chú ý **mọi** dòng **Đếm lại minibar**, không chỉ dòng có vai lễ tân, nên kiểm soát vẫn đủ. Đây là giới hạn đã biết của lệnh (A), không cần thẻ mới.

## 3. Cập nhật thẻ FB-R5-DOM-BE-110-02 (điều kiện tag)

DOM duyệt #133 @ `0636f2fc`. Vì vậy điều kiện của 110-02 là:

1. Chú thích nguồn sổ tay (mục 8.1 dòng 577, dòng đầu tệp, dòng "Mỗi tuần") và release notes dòng 91: đổi "BE-A2 r5-v516-minibar 0b2ebb45, chỉ khi #110 và nhánh này cùng vào tag" thành **"PR #133 @ `0636f2fc` (chứa `0b2ebb45` và #110 @ `e870a1c9`) có trong tag"**. Chữ chủ đầu tư đọc giữ nguyên.
2. Plan 4a dòng T5: ghi "PR #133 @ `0636f2fc`" thay cho riêng `0b2ebb45`.
3. Lệnh kiểm lúc cắt. Repo đang cho cả squash và rebase (`gh repo view`), nên `git merge-base --is-ancestor` chỉ đúng khi #133 gộp bằng **merge commit**. Đề xuất:
   - gộp #133 bằng merge commit, như #123;
   - kiểm theo nội dung, đúng với mọi cách gộp: `git grep -n "reason: MINIBAR_RECOUNT_REASON" v1.0.5 -- product/services/api/src/modules/inventory/internal/minibar.service.ts` ra đúng 1 dòng (trên `main` hôm nay ra 0), và `git cat-file -e v1.0.5:product/services/api/test/integration/v5-16-minibar-recount-audit.test.ts` không lỗi.
4. Commit sau `0636f2fc` chỉ sửa test (133-02, 133-03) hoặc gộp `main` không đụng khối R7 thì DOM giữ kết luận. Commit nào sửa khối R7 hay `recountOrigin` trong `minibar.service.ts` thì DOM đọc lại phần đó.
5. Thiếu #133 lúc cắt tag: theo lối lùi đã ghi ở T5 (câu `d467578b`, dòng **Đóng ca** về **Đảo dòng folio**).

Trạng thái 110-02: Open tới khi BA, PO/ORC sửa 3 chỗ ở bước 1–2.

## 4. Thẻ feedback

### FB-R5-DOM-BE-133-01
- Mức độ: **Minor** (đích R5-B-15, phần chặn; không chặn #133, không đổi v1.0.5)
- Người sửa: DOM (ghi luật vào BR-438 (2a) khi lập R5-B-15), ARC (chọn cách tính), QA (oracle BR-438-08 thêm ca h), BE-A2 (khi làm phần chặn)
- Vị trí: `minibar.service.ts` vòng R7. Dòng mới đăng bằng `postLines` không nối `related_line_id` về dòng vừa đảo, nên `rootLineOf` của dòng đếm lại là chính nó.
- Vấn đề: mỗi lần đếm lại R7, "dòng gốc" bắt đầu lại. Lễ tân có thể **đếm tăng rồi đếm giảm** để xóa nguồn gốc lần đếm của người khác. Ví dụ, cùng ngày:
  - Minh (HK) đếm 3 bia, dòng 105.000;
  - Lan (FD) đếm 4: đếm tăng, không bản ghi, dòng 140.000 thành dòng **của Lan**;
  - Lan đếm 1: bản ghi `postedByActor` **true**, `sameBusinessDay` true, `rootLineId` là dòng của Lan.
  
  Bill còn 35.000, thấp hơn lần đếm của Minh (105.000) là 70.000, mà bản ghi trông như lễ tân tự sửa dòng mình vừa đếm.
  - Ở v1.0.5 ảnh hưởng nhỏ. Lần giảm vẫn được ghi và vẫn vào số đếm của Lan, vì mọi lần FD giảm đều được đếm. Desk không hiện 3 cờ này. Sổ tay bảo chú ý mọi dòng **Đếm lại minibar**.
  - Khi có phần chặn: luật "chỉ tự sửa dòng mình ghi trong ngày" bị vượt bằng 2 lần đếm, và ví dụ BR-438-02 lại vô nghĩa.
- Luật DOM làm rõ (BR-438 (2a), cho phần chặn và cho 3 cờ từ v1.0.6). Với một món trong kỳ tủ hiện tại, **mốc** là số của lần đếm gần nhất do **người khác** làm, hoặc do chính người đó làm ở **ngày nghiệp vụ trước**.
  - FD/FDL đếm lại **thấp hơn mốc** là giảm số của người khác. Phần chặn trả 403 `foc_request`. Bản ghi mang `postedByActor` false (hoặc `sameBusinessDay` false theo mốc).
  - Đếm thấp hơn số mình vừa đếm tăng trong ngày, nhưng **không thấp hơn mốc**, là tự sửa: được.
  - Ví dụ trên, Lan đếm 3 → được. Lan đếm 1 → chặn.
  - Lần **Điều chỉnh** của quản lý nâng số sau lần đếm (test 203) cùng lớp này. DOM đề nghị ARC tính mốc chung cho cả lần đếm lẫn Điều chỉnh do người khác làm. Nếu thấy nặng, ARC báo lại; DOM chấp nhận mốc chỉ theo các lần đếm cho R5-B-15.
- Đề xuất sửa:
  - ARC chọn một trong hai cách:
    - nối dòng R7 với dòng vừa đảo bằng `related_line_id` rồi tính mốc trên chuỗi;
    - hoặc tính mốc từ `minibar_check_line` của kỳ.
  - QA thêm BR-438-08 (h): Minh 3 → Lan 4 → Lan 1, hoặc Minh 3 → Lan 4 → Lan 3 (hai lần chạy riêng). Ở v1.0.5 cả hai lần giảm đều được và có bản ghi, +1 mỗi lần. Ở phần chặn: Lan 1 → 403, Lan 3 → được.
- Trạng thái: Open

### FB-R5-DOM-BE-133-02
- Mức độ: **Minor** (nên làm trong #133 trước khi rời draft; không chặn kết luận DOM)
- Người sửa: BE-A2
- Vị trí: `v5-16-minibar-recount-audit.test.ts`, ca "Cần chú ý `line_reduction_count`"
- Vấn đề: tên ca nói "HK and Lan (1) are not [counted]". Nhưng HK chỉ có 1 lần giảm, chưa vượt ngưỡng test 2. Vậy HK không hiện dù có bị đếm hay không. Đây là đường duy nhất sinh `folio_line.adjusted` mang `actorRole housekeeping` (HK không có `adjustFolioLine`). Vì vậy luật "HK có trong bộ lọc nhưng không vào số đếm" (oracle (b), (d) +0) chưa test nào giữ.
- Vì sao quan trọng: nếu ai đó nới `FRONT_DESK_ROLES` hay đổi cổng đếm, buồng phòng sẽ bị cảnh báo "sửa giảm nhiều lần" vì đi đếm tủ. Chủ đầu tư sẽ nghi nhầm người.
- Đề xuất sửa:
  - Cho HK có ≥ 3 lần đếm lại thấp hơn trong tháng (thêm vài lần ở căn 201 hoặc 203), rồi khẳng định không có mục `foc_threshold` nào có `actorUserId` của HK.
  - Cùng ca, khẳng định số 4 của Hạnh bằng số hàng `reductionsOnly=true&actorUserId=<Hạnh>` trong tháng. Chủ đầu tư bấm từ **Cần chú ý** phải thấy đúng 4 dòng. Đây là ý ARC FB-R5-ARC-BE-B2-01 xin khi #133 gộp.
- Trạng thái: Open

### FB-R5-DOM-BE-133-03
- Mức độ: Suggestion
- Người sửa: QA (oracle), BE-A2 (test)
- Vị trí: `product/tests/fixtures/br-examples.json` BR-438-08, ghi chú `pendingFix`; tệp test #133
- Vấn đề:
  - Ghi chú v1.0.5 của oracle nói (a), FDL của (e), (g) 06:10 thành "được + một bản ghi", nhưng chưa ghi số đếm. Theo mã #133, cả ba là **+1** vào `line_reduction_count`; phần chặn thì +0 vì bị từ chối.
  - Ca (e) chạy nối tiếp: ở v1.0.5, lần FDL đã hạ dòng về 70.000, nên lần MGR cùng số bị R6 giữ dòng và **không** có bản ghi. `adjustedAudits` của (e) ở v1.0.5 là [1, 0], ngược với [0, 1] của phần chặn.
  - Test #133 chưa có (b), (e) và lần 00:20 / 06:10 của (g).
- Đề xuất sửa:
  - QA ghi rõ kỳ vọng v1.0.5 từng ca vào ghi chú, ví dụ:
    - `lineReductionCountDeltaV105`: (a) 1, (e) [1, 0], (g) [1, 1]. Mỗi lần của (g) là một lần chạy riêng từ dòng gốc; lần 00:20 là tự sửa trong ngày, vẫn +1 như (c);
    - `adjustedAuditsV105` của (e): [1, 0];
    - `afterVndV105` của (e): [70.000, 70.000].
  - BE-A2 thêm vào tệp test, hoặc QA làm ở T-16-13…15:
    - một FDL, một MGR đếm lại trên lần đếm của HK;
    - Lan đếm 23:50, rồi đếm lại 00:20 (`sameBusinessDay` true) hoặc 06:10 (false).
- Trạng thái: Open

## 5. Điểm làm tốt

- Nguồn gốc dòng được đọc **trước** khi đảo dòng. Nhờ vậy bản ghi đo trên dòng đang sống thật, không phải dòng đã đảo.
- PR dùng lại đúng `rootLineOf`, `reductionScope`, `actorRoleOf` của #110, không viết định nghĩa thứ hai cho "sửa giảm". Lần đếm lại và lần Điều chỉnh vì thế đi chung một bộ lọc và một số đếm.
- Test kiểm cả những chỗ dễ sai lặng: đúng 7 khóa trong `before` (allowlist), đếm tăng và đếm giữ dòng không ghi gì, quản lý nâng rồi lễ tân đếm lại vẫn về dòng đếm gốc.

## 6. Giả định DOM dùng

1. Đọc mã ở `0636f2fc` bằng `git show` / `git diff`, không chạy test. Kết luận chỉ về nghiệp vụ; gộp vẫn cần CI xanh và ARC, SEC duyệt.
2. HK hiện không dùng màn đếm (sổ tay dòng 919: buồng phòng báo số bằng lời, lễ tân nhập). Vì vậy ở OTTIMO, bản ghi `actorRole housekeeping` còn hiếm tới R5-B-15.
3. 133-01 là DOM làm rõ BR-438 (2a) cho phần chặn đã hoãn theo lệnh (A), không phải chính sách mới, nên không ESC.
4. 3 cờ `postedByActor`, `sameBusinessDay`, `rootLineManual` hiện chỉ nằm trong bản ghi; Desk chưa hiện (không có mã FE nào đọc trên `main`). Nên 133-01 không đổi gì ở v1.0.5.

## 7. Dòng đề xuất ghi `decision-log.md` (ORC ghi)

`| 2026-11-07 | 5 | **DOM – review BE-A2 #133 @ 0636f2fc (V5-16, V516-01 ý 2): DUYỆT** – đúng lệnh (A): chỉ phần audit, không chặn; mỗi món có dòng nhỏ đi ghi một folio_line.adjusted lý do minibar_recount, 5 khóa (actorRole + rootLineId, rootLineManual, postedByActor, sameBusinessDay đọc trước khi đảo dòng), có trong Sửa giảm dòng – 7 ngày, về 0 có trong removalsOnly, chỉ FD/FDL vào line_reduction_count, không ghi khi đếm tăng, R6, đếm đầu kỳ; ở v1.0.5 oracle BR-438-08 (a), FDL (e), (g) 06:10 là "được + bản ghi, +1" (giới hạn đã biết, K-MB). 110-02: điều kiện tag = #133 @ 0636f2fc; gộp bằng merge commit hoặc kiểm theo nội dung (git grep "reason: MINIBAR_RECOUNT_REASON" trên tag). 133-01 Minor (R5-B-15): đếm tăng rồi đếm giảm xóa nguồn gốc – mốc là lần đếm gần nhất của người khác hoặc ngày trước; 133-02 Minor (test chưa chứng minh HK bị loại khỏi số đếm); 133-03 Suggestion (oracle ghi số đếm v1.0.5, thêm ca b, e, g). Không ESC | DOM | rounds/round-05/reviews/DOM-on-be-pr-133.md |`
