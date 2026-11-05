# ARC review – PR #83 H16 minibar follow-up sau #81 (BUG-R4-045, BUG-R4-047, ARC-PR81-01/02, UXD-PR81-01)

- Người review: ARC | Round 4 – v1.0.4 – Bước **Review** | 05/11/2026
- Đối tượng: `v104/fe-minibar-followup` @ `19cfa3f7`, base `main`. #81 đã gộp ở `3e6a762b`. Hai commit:
  - `a89f2fd2`: phần sửa, test, khóa chữ, E2E;
  - `19cfa3f7`: trả lời review #81 (`responses/FE-on-PR81-reviews.md`), sửa câu G-FE-042-1/2 trong báo cáo BUG-R4-042.
- Tệp mã trong PR:
  - `CheckOutPage.tsx` (+117 dòng);
  - `bug-r4-042-fea.test.tsx` (thêm 7 ca, nay 12 ca);
  - 3 tệp test chỉ đổi tên nút: `s4-144-fea`, `s4-416-fea`, `v104-minibar-prefill-fea`. Nút chính nay là `co.go_next_cabinet` khi còn tủ, ARC đã xem: không nới điều kiện kiểm;
  - E2E `b14-fridges.s5.spec.ts`: bấm `co.go_next_cabinet` (căn đang ở) sau tủ cũ, rồi `co.go_extras`. Đúng với thiết kế;
  - 2 khóa chữ (`co.go_next_cabinet`, `co.minibar_cabinet_saved`) qua `gen_strings.py` và 4 tệp sinh.
- Đọc kèm:
  - bug-list v1.0.4, các mục BUG-R4-045 và BUG-R4-047;
  - ARC review #67 (thẻ PR67-03) và #81;
  - `useResource` (`seq`, `loadedAt`, giữ dữ liệu cũ khi tải lại);
  - `minibar.service.ts` `record()`: `assertPeriod` rồi `registerFridge` mở kỳ `check_in`;
  - B18 `checkout.service.ts:1223` (`uncheckedMinibars`).
- Cách kiểm: worktree riêng `wt-arc83` trong scratchpad (đã xóa), không commit, không push.
- CI (`gh pr checks 83` @ `19cfa3f7`):
  - đã xanh: `format · lint · audit · test · build` (gồm tsc, eslint, prettier, test), `API contract`, `OpenAPI lint`, `gitleaks`, `confidential paths`, `infra scripts`, `landing LP-v1`, `no test endpoints`;
  - còn **chờ**: `docker images build · E2E smoke`;
  - trạng thái gộp: **`CONFLICTING`**. `git merge-tree` chỉ báo xung đột ở `product/design/wireframes/assets/strings.js` (tệp sinh 1 dòng). Các tệp chữ khác tự gộp được.

## Phán quyết: **KHÔNG ĐẠT ở `19cfa3f7`**. Sửa xong thẻ 01 thì ĐẠT

Phần lớn PR làm đúng và có bằng chứng tốt:
- BUG-R4-045 (tủ đã đếm bị đòi đếm lại thì quay lại bước ①) đóng được cả G-FE-042-2 và D2;
- BUG-R4-047 dùng `periodId` mới, không có khung hình cũ, không đua với bản tóm tắt;
- 3 bảo đảm của #67 vẫn giữ trên mọi đường cũ.

Nhưng effect `minibarResync` mở ra **một đường mất số đã gõ mới, không báo gì**, đúng loại PR67-03 (Major). Cụ thể: sau 409 `MINIBAR_NOT_CHECKED`, lễ tân làm theo câu lỗi, tự Quay lại bước ① và gõ số trước khi bản tóm tắt đọc lại về. Khi bản đó về, effect đọc lại bản chuẩn của chính tủ trên màn, và số vừa gõ về 0. ARC tái hiện được tất định (mục 1.1).

Trên `main` (#81), đường này ồn nhưng an toàn: lệnh đếm với `periodId` cũ nhận 409 `MINIBAR_PERIOD_CHANGED` kèm câu "Tủ vừa được bổ sung". Với PR này nó thành im lặng: lễ tân bấm Tiếp tục với số 0, và folio thiếu món. Vì vậy đây là hồi quy về tiền, nên chặn gộp.

Bản sửa chỉ 1 dòng và đã thử (mục 1.1). Điều kiện để thành ĐẠT:
1. Sửa thẻ 01 và thêm ca S2a vào `bug-r4-042-fea.test.tsx`.
2. Rebase lên `main`. Giải xung đột ở `gen_strings.py` nếu có, chạy lại script để sinh `strings.js` và các tệp kia. Không sửa tay tệp sinh.
3. CI xanh ở head mới, gồm `E2E smoke` (desk-clock chạy TC-L4-138 `b14-fridges.s5`).
4. ARC chỉ xem lại phần chênh của `CheckOutPage.tsx` và ca test mới. Không cần review lại toàn bộ.

Thẻ 02 (Minor) và 03 (Suggestion) không chặn gộp. ARC đề xuất làm 02 trong cùng lần sửa, vì chạm đúng effect đó.

## 1. Đường tiền: mất số đã gõ, đếm hai lần, sai tủ

### 1.1 Mất số đã gõ: **có**, ở effect `minibarResync` (thẻ 01)

`CheckOutPage.tsx` dòng 456–481. Khi B18 trả 409, trang đặt `minibarResync`. Bản tóm tắt `ready` kế tiếp làm 4 việc:
- đặt `cabinetSettled`;
- gọi `std.reload()` nếu tủ đầu trong danh sách là tủ đang hiện;
- `setCabinet(...)`;
- `setStep(0)`.

Effect không xét lễ tân đang ở bước nào. Nhưng câu lỗi B18 bảo "Làm bước 1 trước khi hoàn tất", nên Quay lại là việc tự nhiên. Mạng yếu (Đà Lạt) thì bản tóm tắt sau 409 có thể về chậm vài giây.

**Ca S2a** (scratch, chạy trên `19cfa3f7`). Lượt ở Kim có 2 tủ: 402 (căn cũ) và 202 (đang ở). Các bước:
1. Đếm 402 (1 bia), rồi đếm 202, sang bước ②, rồi ③.
2. Ở phiên khác, buồng phòng nạp lại tủ 202: tăng `minibarPeriods`, thêm khóa vào `minibarNewFill`, xóa `minibarChecks`.
3. Thu đủ tiền. Giữ bản tóm tắt bằng `summaryGate().hold()`. Bấm Hoàn tất và xác nhận, nhận 409 `MINIBAR_NOT_CHECKED`.
4. Bấm Quay lại hai lần. Lần về bước ① gọi `std.reload()` (BUG-047), nên bản chuẩn 202 là của kỳ mới.
5. Gõ 1 bia dùng trên 202. Ô hiện `1`.
6. Thả bản tóm tắt.

Kết quả:

| Thời điểm | Tủ trên màn | Bia dùng | Lần đọc bản chuẩn từ bước 4 |
|---|---|---|---|
| Trước khi bản tóm tắt về | Căn 202 (đang ở) | 1 (vừa gõ) | 1 lần (của Quay lại) |
| Sau khi bản tóm tắt về | Căn 202 (đang ở) | **0** | **2 lần**: effect đọc thêm 1 lần |

Test đỏ: `the figure typed on 202 stays (PR67-03): expected '0' to be '1'`.

Màn không có câu báo nào: không có `co.minibar_period_changed_title`, nhóm chọn tủ ẩn. Lễ tân bấm "Tiếp tục" thì lệnh đếm gửi 0 bia cho kỳ mới, với `periodId` đúng, nên máy chủ nhận và folio thiếu 1 bia.

Biến thể cùng gốc, không cần test riêng: lễ tân Quay lại, chọn tủ khác và gõ số. Effect `setCabinet(first)` kéo màn sang tủ khác, và số đã gõ bị bỏ.

**Bản sửa đã thử** trong worktree (đã hoàn nguyên, `cmp` khớp head):

```ts
if (!minibarResync) return;
setMinibarResync(false);
// the desk is back on step 1 by itself – never switch or re-read under its hands (ARC PR67-03)
if (step === 0) return;
```

Vì sao đủ:
- Ngoài effect này, chỉ có `back()` đưa trang về bước ①. Từ bước ②, `back()` đã đọc lại bản chuẩn và bản tóm tắt sau 409.
- Phần nhả tập tủ đã đếm chạy **trước** dòng `return`. Tủ bị đòi đếm lại vẫn hiện trong nhóm chọn tủ, kèm câu "Cần đếm lại", và nút chính nêu tên nó.

Có S2a và bản sửa, 4 tệp chính cộng S2a xanh: 41/41 (12 ca của bản sao bị bỏ qua). Ca D, D2, G2 và 047 vẫn xanh.

### 1.2 Đếm hai lần: không

Một tủ chỉ được đếm lại khi:
- máy chủ liệt kê lại nó (nhả khỏi tập done), hoặc
- lễ tân tự Quay lại (G-FE-042-1).

Máy chủ ghi "lần đếm này thay lần đếm mới nhất của CÙNG kỳ", nên gửi cùng số thì folio không đổi. Lệnh đếm của 047 rơi vào kỳ `check_in` do `registerFridge` mở lúc đếm lần đầu. Vì vậy `latestCheck` chính là lần đếm đó, và số hiện lại bằng số đã gửi (mục 3).

### 1.3 Sai tủ: không

- Dòng tên tủ (K11-03) vẫn giữ: M6 làm 11 ca đỏ.
- `nextCabinet` bỏ tủ đã đếm và tủ đang hiện. Nhãn `co.go_next_cabinet` nêu tủ kế tiếp, đúng chỗ nút dẫn tới.
- Toast `co.minibar_cabinet_saved` nêu tủ vừa đếm, không phải tủ đang hiện. Có test UXD.
- Nhóm chọn tủ giữ tủ đang hiện khi tủ đó đã đếm mà tủ khác bị đòi đếm lại: không đổi tủ dưới tay lễ tân. N5 làm G2 đỏ.

## 2. Các bảo đảm của #67

| Bảo đảm | Trên PR83 | Bằng chứng |
|---|---|---|
| `stdForCabinet` (bản chuẩn đúng `roomId`) | Giữ. Ô số và nút "Đủ cả" `disabled={!stdForCabinet}`, bảng `aria-busy` | M9 đỏ ca PR67 (b); M8 không đỏ, đúng thiết kế (lớp chặn thứ hai) |
| `cabinetSettled` (bản tóm tắt sau không kéo tủ) | Giữ ở effect BR-703-01 và lúc bấm | M4 đỏ |
| PR67-03 (số đã gõ gắn với đúng đối tượng bản chuẩn) | Giữ ở mọi đường cũ. **Vỡ** ở effect `minibarResync` | S2a (mục 1.1) |

## 3. BUG-R4-047: `periodId` mới, không đua với bản tóm tắt

`back()` (dòng 810–816) gọi `std.reload()` và `sum.reload()` khi về bước ①.
- `std.reload()` đặt `loading` ngay trong cùng lần render, nên `stdForCabinet` tắt. Nút chính `busy`, ô số khóa. Không có khung hình nào để gửi bằng `periodId: null` cũ.
- Lần đọc bản chuẩn không phụ thuộc bản tóm tắt. Hai lần đọc về theo thứ tự nào cũng được. Bản tóm tắt chỉ nhả tập done và đổi nhãn nút, không đổi tủ trên màn (trừ effect `minibarResync`, thẻ 01).
- Về tiền: lần đếm đầu mở kỳ `check_in` trên máy chủ (`registerFridge`). Bản đọc mới có `periodId` của kỳ đó, và `latestCheck` là lần đếm vừa gửi, nên số hiện lại đúng số đã gửi. Bấm Tiếp tục thì lệnh thay chính lần đếm đó.
- N3 (Quay lại không đọc lại bản chuẩn) làm ca 047 đỏ.

## 4. Chạy test (ARC tự chạy)

| Bộ | Kết quả |
|---|---|
| 24 tệp H16 (minibar, trả phòng) ở head | **251/251** |
| 4 tệp chính: `bug-r4-042-fea`, `v104-minibar-prefill-fea`, `s4-144-fea`, `s4-416-fea` | 40/40 |
| Dưới tải: 12 tiến trình × 2 vòng, 4 tệp chính, load 1 phút 14–34 | **0/24** lượt đỏ (960 ca) |
| S2a (scratch) ở head | **Đỏ**, tất định |
| S2a + 4 tệp chính, có bản sửa thử | 41/41 |
| `tsc`, `eslint`, `prettier` | Đạt (job CI `format · lint · audit · test · build`) |

**Đột biến cũ của #81, chạy lại trên mã PR83** (4 tệp chính):

| # | Đổi | Ca đỏ |
|---|---|---|
| M0 | `CheckOutPage.tsx` của #81 | 17 |
| M1 | Tủ kế tiếp lấy từ closure | 1 (ca 5) |
| M2 | Nhóm chọn tủ đưa lại tủ đã đếm | 3 |
| M3 | Chỉ bỏ tủ vừa đếm | 2 (race, ca 4) |
| M4 | Không đặt `cabinetSettled` khi bấm | 1 |
| M5 | Bỏ bộ lọc `doneRef` trong effect BR-703-01 | 0 (bộ lọc thừa, như PR81-03) |
| M6 | Bỏ dòng tên tủ | 11 |
| M7 | Tủ không có món tính tiền không vào done | **1**: PR81-02 đã đóng |
| M8 | Bỏ dòng chặn `!stdForCabinet` | 0, đúng thiết kế |
| M9 | `stdForCabinet` bỏ điều kiện `roomId` | 1 (PR67 (b)) |
| M10 | Bỏ `roomId` cho căn đang ở | 22 |

**Đột biến mới cho PR83:**

| # | Đổi | Ca đỏ |
|---|---|---|
| N1 | Không nhả tập done | 2 (ca D, G2) |
| N2 | Không đặt `minibarResync` khi 409 | 1 (D2) |
| N3 | Quay lại không `std.reload()` | 1 (047) |
| N4 | Quay lại không `sum.reload()` | 1 (G2) |
| N5 | Nhóm chọn tủ không giữ tủ đang hiện | 1 (G2) |
| N6 | Nhả mọi tủ done, không xét danh sách | 1 (G2) |
| N7 | Effect resync không `std.reload()` tủ đang hiện | **0**: thiếu test (thẻ 03) |
| N8 | Effect resync không đặt `cabinetSettled` | 0: dòng thừa (thẻ 03) |

Không chạy stack E2E. Job `E2E smoke` của CI sẽ chạy `b14-fridges.s5` sau khi rebase.

## 5. Thẻ feedback

### FB-R4-ARC-FE-PR83-01
- Mức độ: **Major**. Chặn gộp: hồi quy về tiền so với `main`, và mất số không báo gì.
- Vị trí: `CheckOutPage.tsx`, effect `minibarResync`, dòng 466–478 (`std.reload()` ở dòng 476, `setCabinet`/`setStep(0)` ở 477–478).
- Vấn đề: sau 409 `MINIBAR_NOT_CHECKED`, nếu lễ tân đã tự về bước ① trước khi bản tóm tắt đọc lại về, effect vẫn đọc lại bản chuẩn của tủ đang hiện hoặc đổi tủ. Số đã gõ bị bỏ, màn không báo gì. Lễ tân bấm Tiếp tục thì gửi số 0 cho kỳ mới, và folio thiếu món. Đây là đúng loại PR67-03.
- Bằng chứng: ca S2a (mục 1.1) đỏ tất định trên head, xanh khi có bản sửa.
- Đề xuất sửa:
  - trong effect, sau `setMinibarResync(false)`, thêm `if (step === 0) return;`. Phần nhả tập done vẫn chạy trước đó, nên tủ bị đòi đếm lại vẫn được đưa ra;
  - cập nhật chú thích của effect: "về bước ① với tủ đầu tiên" chỉ khi trang chưa ở bước ①;
  - thêm ca S2a vào `bug-r4-042-fea.test.tsx`: giữ bản tóm tắt sau 409, Quay lại hai lần, gõ 1 bia trên 202, thả bản tóm tắt, rồi kiểm số vẫn là 1. Nếu muốn, kiểm thêm là không có lần đọc bản chuẩn nào sau khi thả (ARC chưa chạy điều kiện này). Bản ca ARC đã chạy nằm ở `scratchpad/arc81-mut/zz-arc83-S2a.snippet.tsx` của phiên ORC; nó dùng helper sẵn có trong tệp test của FE. ORC chuyển cho FE nếu cần;
  - nếu FE chọn cách khác (ví dụ giữ số đã gõ khi đọc lại), phải qua được S2a và biến thể đổi tủ.
- Trạng thái: Open (FE-A)

### FB-R4-ARC-FE-PR83-02
- Mức độ: Minor. Không chặn gộp. Nên làm trong cùng lần sửa thẻ 01.
- Vị trí: effect `minibarResync`, phần nhả tập done (dòng 457–465), và chú thích dòng 444–449.
- Vấn đề:
  - effect là effect bị động, chạy sau commit. Nó đọc `doneRef` (ref thay đổi được) nhưng so với `sum.state` của lần render cũ hơn;
  - giả sử bản tóm tắt gửi **trước** lần đếm tủ A về và commit, nhưng effect của nó chưa chạy. Nếu 201 của A về đúng khe đó, `markDone` thêm A vào `doneRef`, rồi effect chạy với bản tóm tắt cũ vẫn liệt kê A, và **nhả A**. Đây là đúng hình của BUG-R4-042;
  - với 2 tủ thì vô hại. Với từ 3 tủ (2 lần B14) và mạng chậm: lần đếm tủ B sau đó tạo tập done thiếu A. `goNextCabinet` đọc `latestSummary` còn liệt kê A, nên trang quay lại tủ A đã đếm. Tủ có tên trên màn, gửi cùng số thì folio không đổi, nên không sai tiền;
  - chú thích nói "bản đọc gửi trước lần đếm không bao giờ tới đây". Điều này chỉ đúng khi effect chạy trước 201. React 18 không bảo đảm thứ tự đó với commit không do thao tác người dùng (cùng lý do với PR81-03).
- Đề xuất: chỉ nhả những tủ có trong `doneCabinets` của chính lần render đó (state, không phải ref). Bản tóm tắt sau lần đếm luôn commit cùng hoặc sau render có A trong `doneCabinets`, vì `markDone` và `sum.reload()` cùng một lần gộp. Ví dụ:
  ```ts
  const release = [...doneCabinets.keys()].filter(listed);
  if (release.length) {
    const kept = new Map([...doneRef.current].filter(([id]) => !release.includes(id)));
    ...
  }
  ```
  Cách khác: ghi thời điểm đếm cho mỗi tủ, và so với lần `reload()` của bản tóm tắt. Sửa chú thích theo cách FE chọn. Khó viết test tất định, nên ARC không bắt buộc test.
- Trạng thái: Open (FE-A)

### FB-R4-ARC-FE-PR83-03
- Mức độ: Suggestion.
- Vị trí: `bug-r4-042-fea.test.tsx`; effect `minibarResync` dòng 471 và 476; khối bước ① dòng 1310–1330.
- Vấn đề và đề xuất:
  - **Thiếu test cho N7.** Bỏ `std.reload()` trong effect resync không làm ca nào đỏ. Đường này là: lễ tân còn ở bước ②/③, và tủ bị đòi đếm lại là tủ trên màn. Nếu thiếu đọc lại, lệnh đếm sau gửi `periodId` cũ và nhận 409 `MINIBAR_PERIOD_CHANGED`. Không sai tiền, vì máy chủ chặn bằng `assertPeriod`, nhưng lễ tân phải bấm lại. Đề xuất thêm 1 ca: như ca D, nhưng tủ bị đòi đếm lại là tủ đếm cuối. Kiểm có 1 lần đọc bản chuẩn sau 409, và lệnh đếm mang `periodId` mới;
  - **Dòng thừa.** `cabinetSettled.current = true` trong effect resync (N8 không đỏ). Mọi đường tới 409 đều đã bấm lưu, nên `cabinetSettled` đã đặt. Ghi là lớp phòng thủ, hoặc bỏ;
  - **Câu "Cần đếm lại" tạm thời** (nit). Câu này lấy `due` từ `toCount`, tức dữ liệu cũ mà `useResource` giữ khi tải lại. Lễ tân Quay lại tủ A vừa đếm (G-FE-042-1) mà bản tóm tắt `ready` cuối còn là bản gửi trước lần đếm, với `reason` khác `never_counted`. Khi đó câu "Cần đếm lại" hiện trên A cho tới khi bản mới về. Không sai tiền; có thể bỏ qua.
- Trạng thái: Open (FE-A)

## 6. Điểm làm tốt
- FE chọn đúng cách (a) của PR81-01 và mở rộng thành quy tắc chung: một tủ chỉ là "đã đếm" cho tới khi có bản tóm tắt gửi sau lần đếm về. Đóng được cả G-FE-042-2 lẫn D2 với ít mã.
- BUG-R4-047 tìm ra đúng gốc (`periodId: null` của bản đọc trước lần đếm đầu) và sửa ở chỗ rẻ nhất. FE còn dựng được ca trên mock, dù bug-list ghi "mock MSW không tái hiện".
- PR81-02 đã đóng: M7 nay làm 1 ca đỏ; có ca Quay lại cho G-FE-042-1.
- Bộ test mạnh: 7 trong 8 đột biến mới đỏ đúng ca. Cổng giữ bản tóm tắt (`summaryGate`) giúp ARC dựng S2a chỉ trong vài dòng.
- Câu trả lời review (`FE-on-PR81-reviews.md`) nêu rõ thẻ nào làm, thẻ nào không làm theo quyết định của ORC (PR81-03/04).

## 7. Dòng `decision-log.md` đề xuất (ORC ghi)

| Ngày | Round | Quyết định | Người quyết | Lý do |
|---|---|---|---|---|
| 2026-11-05 | 4 | **ARC – #83 @ `19cfa3f7` (BUG-R4-045, BUG-R4-047, ARC-PR81-01/02, UXD-PR81-01): KHÔNG ĐẠT, sửa thẻ 01 thì ĐẠT.** FB-R4-ARC-FE-PR83-01 (Major, chặn gộp): effect `minibarResync` sau 409 `MINIBAR_NOT_CHECKED` đọc lại bản chuẩn hoặc đổi tủ cả khi lễ tân đã tự về bước ①, nên số vừa gõ về 0 mà không báo (loại PR67-03; `main` an toàn nhờ 409 `MINIBAR_PERIOD_CHANGED`). Sửa: `if (step === 0) return;` sau `setMinibarResync(false)`, cộng ca test S2a. Điều kiện gộp: rebase lên `main` và sinh lại `strings.js` bằng `gen_strings.py`, CI xanh gồm `E2E smoke`, ARC xem lại phần chênh. Chấp nhận cách sửa BUG-R4-045 (nhả tập done theo bản tóm tắt gửi sau lần đếm) và BUG-R4-047 (Quay lại đọc lại bản chuẩn, `periodId` mới, không đua với bản tóm tắt). FB-PR83-02 (Minor: nhả done theo `doneCabinets` của render, không theo ref), 03 (Suggestion: test N7, dòng thừa) | ARC | S2a đỏ tất định ở head, xanh với bản sửa 1 dòng (41/41); 24 tệp H16 251/251; tải 12 × 2: 0/24 lượt đỏ; 11 đột biến cũ và 8 đột biến mới, chỉ N7, N8 (thừa), M5, M8 (theo thiết kế) không đỏ |

---

# Lượt 2 – head `e411cb22` (05/11/2026)

- Đối tượng: 2 commit trên `19cfa3f7`:
  - `51217a2c`: gộp `origin/main` @ `28f24919`, sinh lại tệp chữ;
  - `e411cb22`: sửa theo thẻ PR83-01/02/03 và UXD-PR83-01, đổi tên nhóm khóa thành "v1.0.4".
- Đọc kèm:
  - `responses/FE-on-PR81-reviews.md`, phần Lượt 2;
  - bug-list v1.0.4 trên `main`: BUG-R4-048 (P0, QA3) chính là thẻ PR83-01, chỉ có trên nhánh.
- Cách kiểm: worktree riêng `wt-arc83b` trong scratchpad (đã xóa), không commit, không push.
- CI (`gh pr checks 83` @ `e411cb22`):
  - đã xanh: mọi job, trừ `docker images build · E2E smoke`, job này còn **chờ**;
  - trạng thái gộp lại là **`CONFLICTING`**, vì `main` vừa gộp #82 (`f9ff4e1f`, `e84cb5fa`). `git merge-tree` chỉ báo xung đột ở `strings.js` (tệp sinh).

## Phán quyết lượt 2: **ĐẠT CÓ ĐK**

Thẻ 01 (Major, tức BUG-R4-048 P0) đã đóng. Thẻ 02 và 03 đã làm. ARC không còn thẻ Blocker hay Major nào mở. Giả định (d) của FE đúng (mục L2.3).

Điều kiện gộp:
1. Gộp lại `main` (đã có #82). Xung đột chỉ ở `strings.js`; giải như lần trước: lấy bản của `main` cho tệp sinh, rồi chạy `gen_strings.py`. Nếu `CheckOutPage.tsx` không đổi thì không cần ARC xem lại.
2. CI xanh ở head mới, gồm `E2E smoke`.
3. QA chạy lại R6 (BUG-R4-048) và R5 (BUG-R4-045) trên máy chủ thật ở head mới. 048 là P0, nên QA là người đóng lỗi.

## L2.1 Phần sửa ở `e411cb22`

| Thẻ | Phần sửa | ARC kiểm |
|---|---|---|
| PR83-01 | `if (step === 0) return;` ở dòng 473 | Đúng chỗ: sau phần nhả tập done, trước mọi lệnh ghi `cabinet`, `std` và `step`. Chú thích đã sửa theo. Ca S2a của FE kiểm thêm "không đọc bản chuẩn sau khi thả". Mốc đo là sau lần đọc của Quay lại, nên điều kiện này đúng. Gỡ dòng này (P1) thì S2a, S2b, S2c cùng đỏ |
| PR83-02 | `release` lấy từ `doneCabinets` của lần render (dòng 465). `kept` vẫn lọc từ `doneRef` | Đúng đề xuất. Tủ vừa đếm trong khe giữa commit và effect không bị nhả và không bị mất khỏi `doneRef`. P2 (quay về đọc ref) không làm ca nào đỏ: như đã thống nhất, không có test tất định. ARC chấp nhận |
| PR83-03 | Thêm ca N7; bỏ dòng `cabinetSettled` thừa, có ghi chú tại chỗ | Đột biến N7 nay đỏ 1 ca (trước đó 0). N2 nay đỏ 2 ca (D2, N7). Câu "Cần đếm lại" tạm thời không sửa (nit): ARC chấp nhận |
| UXD-PR83-01 | `cabinets` được sắp theo vị trí của căn trong `r.segments`, căn đang ở cuối (dòng 585–589). Khối `if` viết lại thành `else if` | Ngữ nghĩa giữ như cũ. `list` là mảng mới từ `filter`, nên sắp tại chỗ an toàn. Thiếu `segments` thì mọi tủ hạng 0, và `sort` ổn định nên giữ nguyên thứ tự. Thứ tự chỉ đổi vị trí nút, không đổi tủ được chọn, vì nút bấm gắn theo `roomId`. P3 (bỏ sắp xếp) đỏ ca G2; P4 (căn đang ở lên đầu) đỏ 3 ca |

Test cũ bị sửa ở commit này:
- ca G2 đổi `offered` thành `[OLD, HERE]`, theo UXD;
- `payAndComplete` dùng `findByRole` cho nút tiền mặt, tức chờ chắc hơn.

Không ca nào bị nới điều kiện kiểm.

## L2.2 Commit gộp `51217a2c`: chỉ có nội dung `main` và chữ sinh lại, không mất khóa

- Hai cha của commit: `19cfa3f7` (nhánh) và `28f24919` (`main` lúc gộp). Merge-base là `53500bcd`.
- So với `main`, commit gộp chỉ khác đúng 13 tệp của PR:
  - 8 tệp không phải tệp chữ giống từng byte với `19cfa3f7`;
  - 15 tệp `main` đã đổi từ merge-base và PR không đụng tới đều giống từng byte với `main`.
- 5 tệp chữ do cả hai bên cùng sửa:
  - `gen_strings.py` giống từng byte với kết quả `git merge-file` 3 chiều (base, `main`, nhánh), 0 xung đột;
  - `strings-vi.json` và `strings-en.json`: tập khóa đúng bằng hợp 3 chiều. Không mất khóa, không thừa khóa, không khóa nào đổi giá trị, không có xung đột thật;
  - số lá, tính cả `_meta`: base 3486, `main` 3487, nhánh 3488, gộp 3489. FE ghi 3483/3484/3485 vì đếm khóa cấp cao nhất; phần chênh giống hệt (`main` +1, nhánh +2: `co.go_next_cabinet`, `co.minibar_cabinet_saved`).
- Chạy `gen_strings.py` ở `51217a2c` và ở `e411cb22`: không tệp nào đổi.
- `e411cb22` chỉ đổi tên nhóm trong `gen_strings.py` và `strings-tables.md`. Hai tệp JSON và `strings.js` không đổi.

## L2.3 Giả định (d) của FE: "chọn tủ khác rồi gõ số" bị chặn bởi cùng dòng `return`

**Theo mã.**
- Tủ đang hiện chỉ phụ thuộc vào `cabinet`: `countingRoomId = cabinet ?? hereRoomId` (dòng 219). Bản chuẩn được đọc theo `countingRoomId`, và số đã gõ gắn với đối tượng `std.state.data` (dòng 236–246).
- Trước dòng `return`, effect chỉ làm hai việc: ghi `doneRef`/`doneCabinets`, và tắt `minibarResync`. Hai việc này chỉ đổi danh sách tủ trong nhóm chọn, thứ tự của chúng và nhãn nút chính.
- Không việc nào chạm `cabinet` hay `std`. Vì vậy lễ tân ở tủ nào thì vẫn ở tủ đó, với đúng số đã gõ.

**Theo test** (2 ca scratch của ARC, chạy trên `e411cb22`). Chuẩn bị chung:
- đếm 402 rồi 202;
- ở bước ②, cho 402 bị đòi đếm lại (`minibarRecount`) và nạp lại tủ 202 (`new_fill`). Đổi giờ đi sang 10:55 để trang đọc bản tóm tắt thấy cả hai;
- Hoàn tất nhận 409 trong lúc bản tóm tắt bị giữ;
- Quay lại hai lần. Nhóm chọn tủ hiện `[402, 202]`, tủ đang hiện là 202.

| Ca | Lễ tân làm | Ở head | Gỡ dòng `return` (P1) |
|---|---|---|---|
| S2b | Chọn 402 (tủ đầu danh sách) và gõ số, rồi thả bản tóm tắt | Xanh: số giữ nguyên, không đọc bản chuẩn, vẫn ở 402 | Đỏ: effect đọc lại 402, số về lại số cũ |
| S2c | Ở lại 202 và gõ số trong lúc 402 đứng đầu danh sách | Xanh: không bị kéo sang 402, số giữ nguyên | Đỏ: trang tự chuyển sang 402 |

FE không bắt buộc thêm hai ca này, vì S2a đã khóa dòng `return`. Nếu muốn khóa cả biến thể, S2c là ca rẻ nhất. ARC gửi được mã ca qua ORC.

## L2.4 Chạy test (ARC tự chạy, `e411cb22`)

| Bộ | Kết quả |
|---|---|
| `bug-r4-042-fea` | 14/14 |
| 4 tệp chính: `bug-r4-042-fea`, `v104-minibar-prefill-fea`, `s4-144-fea`, `s4-416-fea` | 42/42 |
| 24 tệp H16 (trả phòng, minibar) | **253/253** |
| Ca scratch S2b, S2c | 2/2 |
| Tải lượt 1: 12 × 2, 4 tệp chính, load 27–49 | 22/24 lượt xanh. 2 lượt đỏ, cùng một lý do: timeout 15 s của ca s4-416 "FD: … FOC 50 % … → B18" (ca này chạy riêng mất 977 ms) |
| Tải lượt 2: 12 × 2, load 31–48 | **24/24** |

Ca timeout nằm ở đường phụ thu trả muộn và mật khẩu quản lý, không thuộc phần đổi của PR. Nó không lặp lại ở lượt 2. ARC không ghi thẻ cho FE; QA có thể đưa ca này vào danh sách theo dõi ca chậm khi máy tải nặng.

**Đột biến** (4 tệp chính và tệp scratch S2b/S2c, 44 ca):

| # | Đổi | Ca đỏ |
|---|---|---|
| M1 | Tủ kế tiếp lấy từ closure | 1 |
| M2 | Nhóm chọn tủ đưa lại tủ đã đếm | 3 |
| M3 | Chỉ bỏ tủ vừa đếm | 2 |
| M4 | Không đặt `cabinetSettled` khi bấm | 1 |
| M5 | Bỏ bộ lọc `doneRef` của effect BR-703-01 | 0 (bộ lọc thừa, như PR81-03) |
| M6 | Bỏ dòng tên tủ | 13 |
| M7 | Tủ không có món tính tiền không vào done | 1 |
| M8 | Bỏ dòng chặn `!stdForCabinet` | 0, đúng thiết kế |
| M9 | `stdForCabinet` bỏ điều kiện `roomId` | 1 |
| M10 | Bỏ `roomId` cho căn đang ở | 26 |
| N1 | Không nhả tập done | 3 (ca D, G2, S2b) |
| N2 | Không đặt `minibarResync` khi 409 | 2 (D2, N7) |
| N3 | Quay lại không `std.reload()` | 1 (047) |
| N4 | Quay lại không `sum.reload()` | 1 (G2) |
| N5 | Nhóm chọn tủ không giữ tủ đang hiện | 1 (G2) |
| N6 | Nhả mọi tủ done | 3 (G2, S2a, N7) |
| N7 | Effect resync không `std.reload()` | **1** (N7), trước đây 0 |
| P1 | Bỏ `if (step === 0) return;` | **3** (S2a, S2b, S2c) |
| P2 | Nhả theo `doneRef` thay vì `doneCabinets` | 0 (không test tất định, đã chấp nhận) |
| P3 | Bỏ sắp xếp nhóm chọn tủ | 1 (G2) |
| P4 | Căn đang ở lên đầu | 3 |

## L2.5 Thẻ

- FB-R4-ARC-FE-PR83-01: **Closed**. QA đóng BUG-R4-048 sau R6 trên máy chủ thật.
- FB-R4-ARC-FE-PR83-02: **Closed**. Không có test, ARC chấp nhận.
- FB-R4-ARC-FE-PR83-03: **Closed**. Nit "Cần đếm lại" tạm thời: chấp nhận không sửa.

### FB-R4-ARC-FE-PR83-04
- Mức độ: Suggestion. Không chặn gộp. Đề xuất v1.0.5.
- Vị trí:
  - `cabinets` (dòng 585–589) sắp theo `r.segments`, căn đang ở cuối;
  - `nextCabinet` (dòng 810), `goNextCabinet` (dòng 831) và effect BR-703-01 lấy theo thứ tự máy chủ trả;
  - máy chủ: `stayRooms` (`inventory/internal/fridge.ts:112`) sắp `ORDER BY first, rm.room_no`. Căn đang ở không bị đẩy xuống cuối. Contract `minibarUncheckedRooms` không nêu thứ tự.
- Vấn đề: hai thứ tự chỉ khác nhau khi lượt ở **quay lại một căn đã ở trước** và có từ 3 tủ. Ví dụ lượt 202 → 402 → 303 → 202:
  - máy chủ trả `[202, 402, 303]`, nhóm chọn tủ hiện `[402, 303, 202]`;
  - đếm xong 402, nút chính ghi "Tiếp tục: Tủ căn 202", trong khi nút kế tiếp trong nhóm chọn là 303.

  Không sai tiền: tủ trên màn luôn có tên, và B18 chặn tủ còn thiếu. Chỉ là lệch giữa thứ tự hiển thị và thứ tự đi tiếp.
- Đề xuất:
  - FE: tạo một hàm `rank` dùng chung, và sắp `toCount` một lần theo hàm đó, để nhóm chọn tủ, nút chính và effect BR-703-01 đi cùng một thứ tự;
  - ARC: trong lần nâng contract tới, ghi rõ thứ tự của `minibarUncheckedRooms`: theo lần đầu vào căn, căn đang ở cuối. Sau đó BE sửa `ORDER BY` theo. Đây là việc của ARC, ARC tự theo dõi.
- Trạng thái: Open (FE-A, ARC), v1.0.5

## L2.6 Điểm làm tốt
- FE sửa đúng một dòng như bản thử và kiểm thêm "không đọc bản chuẩn". Mốc đo đặt sau lần đọc của Quay lại, nên điều kiện này không bị nới.
- Thẻ 02 được làm theo cách giữ `kept` từ `doneRef`. Đây là chi tiết dễ làm sai: nếu lấy `kept` từ `doneCabinets` thì mất tủ vừa đếm trong khe.
- Commit gộp sạch, kiểm lại được: chỉ một tệp sinh xung đột, và FE ghi số khóa trước và sau.

## L2.7 Dòng `decision-log.md` đề xuất (ORC ghi)

| Ngày | Round | Quyết định | Người quyết | Lý do |
|---|---|---|---|---|
| 2026-11-05 | 4 | **ARC – #83 lượt 2 @ `e411cb22`: ĐẠT CÓ ĐK.** FB-PR83-01 (tức BUG-R4-048 P0) đã sửa: effect `minibarResync` không đổi tủ, không đọc lại bản chuẩn khi lễ tân đã ở bước ①. Giả định (d) của FE, "chọn tủ khác rồi gõ số", bị chặn bởi cùng dòng đó. 02 và 03 đã làm. Commit gộp `51217a2c` chỉ mang nội dung `main` và chữ sinh lại, không mất khóa. Điều kiện: gộp lại `main` (sau #82, chỉ `strings.js` xung đột; sinh lại bằng `gen_strings.py`), CI xanh gồm `E2E smoke`, QA chạy lại R6/R5 trên máy chủ thật để đóng BUG-R4-048. FB-PR83-04 (Suggestion, v1.0.5): nhóm chọn tủ và nút Tiếp tục dùng một thứ tự; ARC ghi thứ tự vào contract | ARC | S2a, S2b, S2c xanh ở head; gỡ dòng sửa thì cả 3 đỏ. N7 nay đỏ. 21 đột biến, chỉ M5, M8 (theo thiết kế) và P2 (không test tất định, đã chấp nhận) không đỏ. 24 tệp H16: 253/253. Tải 12 × 2, hai lượt: 46/48 lượt xanh; 2 lượt đỏ là timeout 15 s của một ca s4-416 ngoài phần đổi ở load 49, không lặp lại |
