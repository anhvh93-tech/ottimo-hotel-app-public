# FE-A trả lời review #81 (BUG-R4-042) – PR tiếp theo cho H16 bước ①

- Round 4, đợt v1.0.4, bước **Phản hồi & sửa**.
- Review:
  - `rounds/round-04/reviews/ARC-on-v104-pr81-minibar-race.md` (ĐẠT CÓ ĐK);
  - `rounds/round-04/reviews/UXD-on-v104-pr81-minibar-race.md` (ĐẠT).
- Lỗi QA3 liên quan (`rounds/round-04/qa/bug-list-v1.0.4.md`): BUG-R4-045 (P2), BUG-R4-047 (P2).
- Nhánh `v104/fe-minibar-followup`, cắt từ head #81 `054d40c0`. PR xếp chồng lên #81 (base `v104/fe-checkout-minibar-race`). #81 giữ nguyên, không đẩy thêm gì.
- Không làm thẻ ARC 03 và 04 (Suggestion), theo ORC.

## Tóm tắt

| Thẻ / lỗi | Trạng thái | Phần sửa |
|---|---|---|
| FB-R4-ARC-FE-PR81-02 | Done | Thêm test: Quay lại (G-FE-042-1), tủ không có món tính tiền (M7) |
| FB-R4-ARC-FE-PR81-01 = BUG-R4-045 | Done | Tủ máy chủ đòi đếm lại được đưa lại; B18 trả `MINIBAR_NOT_CHECKED` thì về bước ① |
| BUG-R4-047 | Done (phía FE) | Quay lại bước ① thì đọc lại bản chuẩn của tủ đang hiện |
| FB-R4-UXD-FE-PR81-01 | Done | Nút chính nêu tủ kế tiếp; toast "Đã lưu số đếm tủ căn …" |
| Nhóm chữ "CHỜ UXD DUYỆT" | Done | Đổi tên nhóm trong `gen_strings.py` thành "UXD duyệt 05/11" |

## FB-R4-ARC-FE-PR81-02 – test Quay lại và nhánh không có món tính tiền

**Trạng thái: Done.** Chỉ thêm test, không đổi mã trang.

- Ca G-FE-042-1, theo mục 3.1 của ARC:
  - chọn 202 trước, rồi 402 (bia dùng 1), sang bước ②, bấm Quay lại;
  - kiểm: dòng tên tủ ghi "Căn 402 (đã chuyển đi)", nhóm chọn tủ ẩn, bia dùng 1;
  - bấm Tiếp tục: lệnh thứ ba `[402, 201]`, `lines` giống lệnh thứ hai, folio vẫn `[[402, 35.000]]`.
- Ca tủ không có món tính tiền:
  - 202 đã đếm từ trước (máy chủ chỉ liệt kê 402), bản chuẩn của 202 không có món;
  - lễ tân chọn 202, thấy "Căn này không có minibar tính tiền.", bấm Tiếp tục;
  - kiểm: không gửi lệnh đếm, trang sang 402 có tên, 202 không còn được đưa, không có toast.
- Đột biến: M7 (không ghi tủ bỏ qua vào tập đã đếm) làm ca này đỏ. Bỏ dòng tên tủ (M9) làm ca Quay lại đỏ.

## FB-R4-ARC-FE-PR81-01 / BUG-R4-045 – tủ máy chủ đòi đếm lại phải quay lại bước ①

**Trạng thái: Done.** FE làm cả cách (a) và cách (b) của ARC, vì QA yêu cầu tủ phải quay lại **kể cả khi Quay lại**, không chỉ sau B18.

- (b) Một tủ chỉ là "đã đếm trên trang" cho tới khi có bản tóm tắt **gửi sau** lần đếm đó về.
  - Lần đếm gọi `sum.reload()` cùng lượt với lúc ghi tủ vào tập đã đếm. `useResource` bỏ mọi câu trả lời cũ hơn (`seq`). Vì vậy mọi bản `ready` về sau lần đếm là bản đọc sau lần đếm.
  - Mỗi bản đọc mới (nhận theo `loadedAt`): tủ nào trong tập đã đếm mà bản đó vẫn liệt kê thì bỏ khỏi tập. Tủ được đưa lại, có câu "Cần đếm lại" theo `reason`.
  - Bản đọc gửi **trước** lần đếm (đường race của BUG-R4-042) không bao giờ tới bước này. Các ca race của #81 vẫn xanh.
- Tủ đang hiện đã đếm, mà có tủ khác được đưa lại: tủ đang hiện vẫn nằm trong nhóm chọn tủ, đang được chọn. Trang không tự đổi tủ dưới tay lễ tân (ARC PR67-03). Nút chính ghi tủ cần đếm.
- Quay lại từ bước ② về bước ① thì đọc lại bản tóm tắt. Tủ được nạp hoặc đánh dấu ở phiên khác hiện ra ngay ở bước ①.
- (a) B18 trả 409 `MINIBAR_NOT_CHECKED`: chờ bản tóm tắt đọc sau câu trả lời đó, rồi:
  - bỏ khỏi tập đã đếm những tủ bản đó liệt kê;
  - về bước ① với tủ đầu tiên (BR-703-01: căn cũ trước). Tủ đó đã hiện sẵn thì đọc lại bản chuẩn;
  - câu "Chưa kiểm minibar. Làm bước 1 trước khi hoàn tất." hiện ở bước ①. Đếm xong, sang bước ② thì câu này mất.
  - Đường này cũng gỡ D2 (bản tóm tắt đầu chưa về khi trang rời bước ①).
- Tủ máy chủ không liệt kê lại thì vẫn là đã đếm, không được đưa lại (giữ phần sửa BUG-R4-042). FE chọn cách này thay vì xóa cả tập như cách (a) gốc. Kết quả cho tủ phải đếm là như nhau, nhưng tủ không cần đếm thì không bị đưa ra.
- Test (đều đỏ trên hành vi #81, xem phần bằng chứng):
  - ca D của QA: 402 bị đánh dấu đếm lại ngay sau lần đếm. 402 được đưa lại cạnh 202, nút ghi "Tiếp tục: Tủ căn 402". Đếm 202 xong thì sang 402 có câu "Tủ căn 402 cần đếm lại", folio vẫn 35.000;
  - G-FE-042-2: 202 được nạp tủ ở phiên khác khi trang đã ở bước ②. Quay lại thì 202 được đưa lại, có câu `new_fill`. Đếm 202 thì sang bước ②, máy chủ không còn tủ nào phải đếm;
  - D2: bản tóm tắt đầu bị giữ, đếm 202, sang bước ③, Hoàn tất bị 409. Trang về bước ① với 402, có tên và câu lỗi. Đếm 402, câu lỗi mất ở bước ②, Hoàn tất thành công, folio 35.000.
- Sổ tay H16 không cần thêm dòng "tải lại trang" (ARC đề xuất dòng đó chỉ khi dời sang v1.0.5).

## BUG-R4-047 – Quay lại rồi Tiếp tục nhận 409 "Tủ vừa được bổ sung…"

**Trạng thái: Done phía FE. Không cần sửa máy chủ.**

- Nguyên nhân (theo QA3): máy chủ thật mở kỳ `check_in` ở lần đếm đầu của tủ chưa từng nạp (`registerFridge`). Bản chuẩn trên trang vẫn của lần đọc trước, `periodId: null`. Lần gửi lại bị 409.
- Sửa: bấm Quay lại từ bước ② về bước ① thì đọc lại bản chuẩn của tủ đang hiện (cùng lúc đọc lại bản tóm tắt). Lần gửi sau dùng `periodId` mới. Số điền sẵn là lần đếm vừa gửi (`latestCheck`), nên lễ tân không phải gõ lại.
- Test: mock MSW không mở kỳ ở lần đếm đầu, nên test tự mở kỳ (`minibarPeriods`) ngay sau 201 đầu tiên, giống `registerFridge`.
  - Kiểm: lệnh thứ hai 201 có `periodId` (không còn `null`), cùng `lines`, không có câu "Số đếm chưa được lưu", folio một dòng 35.000.
  - Trên hành vi #81: lệnh thứ hai 409.
- Việc còn lại (v1.0.5, FE/BE): cho mock MSW mở kỳ ở lần đếm đầu như máy chủ thật, để mọi test minibar chạy đúng luật này. FE không đổi mock chung trong PR này, vì nhiều test minibar khác dựa vào kỳ 0.

## FB-R4-UXD-FE-PR81-01 – nút chính nêu tủ kế tiếp, toast khi đã lưu một tủ

**Trạng thái: Done.** Chữ lấy đúng bảng của UXD. FE thêm vào `gen_strings.py` theo lệnh ORC (thẻ ghi UXD thêm khi FE nhận thẻ), rồi sinh lại tệp.

| Khóa | VI | EN |
|---|---|---|
| `co.go_next_cabinet` | Tiếp tục: Tủ căn {room} | Continue: Room {room} minibar |
| `co.minibar_cabinet_saved` | Đã lưu số đếm tủ căn {room}. | Room {room} minibar count saved. |

- (a) Sau tủ đang hiện còn tủ khác thì nút chính ghi `co.go_next_cabinet`. "Còn tủ khác" = bản tóm tắt mới nhất, bỏ tủ đã đếm trên trang và tủ đang hiện. Hết tủ thì `co.go_extras`. Nhãn busy như #67.
- (b) Sau 201, trang sang tủ khác thì hiện toast `co.minibar_cabinet_saved`. `{room}` là tủ vừa đếm. Sang thẳng bước ② thì không có toast. Tủ bỏ qua vì không có món tính tiền thì cũng không có toast, vì không có gì được lưu.
- Toast của DS có `role="status"`, nên trình đọc màn hình đọc được câu đã lưu.
- Test theo gợi ý của UXD: ở 402 còn 202, nút ghi "Tiếp tục: Tủ căn 202". Sau 201 có toast "Đã lưu số đếm tủ căn 402.", nút ghi "Tiếp tục: Phụ phí". Sang bước ② thì không có toast cho 202.
- Các test cũ bấm `co.go_extras` ở tủ đầu của lượt có 2 tủ được đổi sang nhãn mới: `bug-r4-042-fea`, `s4-144-fea`, `s4-416-fea`, `v104-minibar-prefill-fea`. Spec E2E `ui-clock/b14-fridges.s5.spec.ts` (TC-L4-138) cũng đổi ở lần bấm đầu. Phần E2E chỉ kiểm được trên CI (`E2E smoke`).

## Nhóm chữ của #81

- `gen_strings.py`: nhóm "v1.0.4 BUG-R4-042 – FE-A … CHỜ UXD DUYỆT" đổi thành "… UXD duyệt 05/11 (UXD-on-v104-pr81-minibar-race)". Khóa `co.minibar_cabinet_counting` giữ nguyên.
- Hai khóa mới nằm ở nhóm riêng "v1.0.5 FB-R4-UXD-FE-PR81-01". Tệp sinh (`strings-vi.json`, `strings-en.json`, `wireframes/assets/strings.js`, `tools/strings-tables.md`) sinh lại bằng `gen_strings.py`, không sửa tay.

## Bằng chứng

- Tệp test minibar/checkout của H16 (16 tệp, gồm 7 tệp ORC liệt kê): **142/142** xanh.
- `bug-r4-042-fea.test.tsx`: 12 ca (5 ca của #81, 7 ca mới).
- Chạy với `CheckOutPage.tsx` của #81 (`054d40c0`), giữ chữ mới: 11/12 đỏ.
  - Các ca dùng nhãn mới đỏ ở nhãn nút.
  - D2 đỏ vì trang ở lại bước ③. Ca 047 đỏ vì lệnh thứ hai 409.
- Hành vi #81 với nhãn mới (gỡ cả phần sửa 045 và 047, giữ nhãn): đúng 4 ca mới đỏ ở chỗ kiểm hành vi (ca D, G-FE-042-2, D2, 047). 8 ca còn lại xanh, gồm 2 ca chỉ thêm test của thẻ 02.
- Gỡ từng phần sửa, mỗi lần chỉ đỏ đúng ca của phần đó:

  | Đột biến | Ca đỏ |
  |---|---|
  | Bỏ resync sau B18 | D2 |
  | Bỏ bước "bản đọc sau lần đếm vẫn liệt kê thì bỏ khỏi tập đã đếm" | ca D, G-FE-042-2 |
  | Quay lại không đọc lại bản chuẩn | 047 |
  | Quay lại không đọc lại bản tóm tắt | G-FE-042-2 |
  | Tủ đang hiện không nằm trong nhóm chọn tủ | G-FE-042-2 |
  | Không xóa câu `MINIBAR_NOT_CHECKED` khi sang bước ② | D2 |
  | Nhãn luôn `co.go_extras` | 9 ca dùng nhãn mới |
  | Không có toast / toast cả khi sang bước ② | ca UXD |
  | M7 | ca không có món tính tiền |
  | Bỏ dòng tên tủ (M9) | 8 ca, gồm ca Quay lại |

- Chạy dưới tải (3 tệp `bug-r4-042-fea`, `v104-minibar-prefill-fea`, `s4-144-fea`): 6 × 2 và 12 × 1 lượt song song, 0 lượt đỏ (load 2 → 18).
- `tsc --noEmit` (admin-web), eslint và prettier trên các tệp đã đổi: đạt.
- Chưa chạy: E2E trên stack (chờ CI `E2E smoke`, gồm TC-L4-138).

## Giả định

- Máy chủ không liệt kê tủ không có món tính tiền (ARC, thẻ 02). Nếu có liệt kê, B18 sẽ chặn mãi vì Desk không gửi lệnh đếm cho tủ đó. Lỗi này có từ trước, không do PR này.
- Một tủ đang hiện mà vừa được máy chủ đánh dấu lại, nếu bản chuẩn trên trang đã cũ, thì lần đếm có thể nhận 409 `MINIBAR_PERIOD_CHANGED`. Câu đó lúc này đúng (tủ vừa được nạp), và trang tự đọc lại.

---

# Lượt 2 – trả lời review #83 @ `19cfa3f7`

- Review:
  - `rounds/round-04/reviews/ARC-on-v104-pr83-minibar-followup.md` (KHÔNG ĐẠT, thẻ 01 Major);
  - `rounds/round-04/reviews/UXD-on-v104-pr81-minibar-race.md`, phần Lượt 2 (ĐẠT, thẻ PR83-01 Minor và ghi chú tên nhóm).
- Một lần đẩy lên `v104/fe-minibar-followup`:
  - commit gộp `origin/main` (không rebase, không force-push);
  - commit sửa.

| Thẻ | Trạng thái | Phần sửa |
|---|---|---|
| FB-R4-ARC-FE-PR83-01 (Major) | Done | Effect `minibarResync`: lễ tân đã ở bước ① thì không đổi tủ, không đọc lại bản chuẩn. Ca S2a |
| FB-R4-ARC-FE-PR83-02 (Minor) | Done | Nhả tập tủ đã đếm theo `doneCabinets` của chính lần render, không theo `doneRef` |
| FB-R4-ARC-FE-PR83-03 (Suggestion) | Done | Thêm ca N7, bỏ dòng `cabinetSettled` thừa. Không sửa câu "Cần đếm lại" tạm thời (nit) |
| FB-R4-UXD-FE-PR83-01 (Minor) | Done | Nhóm chọn tủ giữ một thứ tự: các căn của lượt theo thứ tự ở, căn đang ở cuối |
| Ghi chú UXD: tên nhóm khóa mới | Done | "v1.0.5 FB-R4-UXD-FE-PR81-01" đổi thành "v1.0.4 …" |
| FB-R4-UXD-FE-PR83-02 (Suggestion) | Không làm | ORC không giao trong lượt này. Đề xuất v1.0.5 |

## FB-R4-ARC-FE-PR83-01 – số đã gõ không mất khi bản tóm tắt sau 409 về muộn

- Sửa đúng như ARC đã thử: sau `setMinibarResync(false)` thêm `if (step === 0) return;`.
- Phần nhả tập tủ đã đếm vẫn chạy trước dòng đó. Vì vậy tủ bị đòi đếm lại vẫn được đưa ra trong nhóm chọn tủ, và nút chính nêu tên nó.
- Ca S2a lấy từ snippet của ARC:
  - sau 409, bản tóm tắt bị giữ. Lễ tân bấm Quay lại hai lần và gõ 1 bia trên 202, rồi bản tóm tắt được thả;
  - kiểm: số vẫn là 1, tủ trên màn vẫn là 202;
  - kiểm thêm (giả định d của ARC): **không có lần đọc bản chuẩn nào** sau khi thả;
  - trước khi sửa ca này đỏ ("expected '0' to be '1'"), sau khi sửa thì xanh.
- Biến thể "chọn tủ khác rồi gõ số" cùng gốc. Dòng `return` chặn cả `setCabinet`, nên không viết ca riêng.

## FB-R4-ARC-FE-PR83-02 – nhả theo `doneCabinets` của lần render

- Effect chỉ nhả những tủ có trong `doneCabinets` của lần render có bản tóm tắt `ready` đó. `doneRef` chỉ dùng để giữ các tủ còn lại.
- Một lần đếm trả 201 giữa lúc bản đọc (gửi trước lần đếm đó) đã commit và lúc effect của nó chạy: tủ đó có trong `doneRef` nhưng không có ở đây, nên không bị nhả.
- Chú thích của effect đã sửa theo.
- Không có test tất định, như ARC đã nói. Đột biến "nhả theo ref" không làm ca nào đỏ.

## FB-R4-ARC-FE-PR83-03 – test N7, dòng thừa

- Ca N7:
  - đếm 402 rồi 202; ở phiên khác nạp lại tủ 202, tức tủ đếm cuối và đang hiện;
  - Hoàn tất nhận 409. Trang về bước ① trên 202, có câu "Tủ căn 202 cần đếm lại";
  - kiểm: **đúng 1 lần** đọc bản chuẩn 202 sau 409. Lệnh đếm 201 mang `periodId` mới, không có câu "Số đếm chưa được lưu";
  - Hoàn tất thành công, folio 35.000.
- Đột biến N7 (bỏ `std.reload()` trong effect) nay làm ca này đỏ.
- Bỏ dòng `cabinetSettled.current = true` trong effect resync. Mọi đường tới B18 đều đã qua "Tiếp tục" ở bước ①, nên cờ đã được đặt. Có ghi chú tại chỗ.

## FB-R4-UXD-FE-PR83-01 – thứ tự nhóm chọn tủ cố định

- `cabinets` được sắp lần cuối theo thứ tự các căn trong `segments` của lượt ở, căn đang ở cuối cùng. Thứ tự này không phụ thuộc tủ nào đang hiện hay tủ nào vừa được đưa lại.
- Test G-FE-042-2 đổi thành `offered: [OLD, HERE]`. Trước khi sửa ca này đỏ.

## Gộp `origin/main`

- Chỉ có một xung đột, ở `product/design/wireframes/assets/strings.js` (tệp sinh).
- Cách giải:
  - lấy bản của `main` cho cả 4 tệp sinh (`strings-vi.json`, `strings-en.json`, `strings.js`, `strings-tables.md`);
  - chạy `gen_strings.py` hai lần. Lần hai không đổi gì (so `shasum`).
- Không mất khóa nào. Số khóa vi/en: `main` 3483, nhánh 3484, sau gộp 3485. Phần thêm so với `main` đúng bằng `co.go_next_cabinet` và `co.minibar_cabinet_saved`.
- Sau khi đổi tên nhóm, chạy lại hai lần nữa, lần hai vẫn không đổi.

## Bằng chứng lượt 2

- `bug-r4-042-fea.test.tsx`: **14/14** xanh (thêm S2a, N7).
- Trước khi sửa, trên mã đã gộp: S2a đỏ, G-FE-042-2 đỏ ở thứ tự nút. N7 xanh, vì ca này khóa hành vi đã có.
- Gỡ từng phần sửa, chạy trên head mới:

  | Đột biến | Ca đỏ |
  |---|---|
  | Bỏ `if (step === 0) return;` | S2a |
  | Effect resync bỏ `std.reload()` (N7) | N7 |
  | Bỏ thứ tự cố định | G-FE-042-2 |
  | Nhả theo `doneRef` (PR83-02) | 0, như ARC dự kiến |
  | Đột biến lượt 1 (resync, nhả, Quay lại, nhãn, toast, M7, M9…) | vẫn đỏ đúng ca |

- 20 tệp test H16 / minibar / `useResource`: **211/211** xanh.
- Dưới tải 8 × 2 lượt song song (load tới 17): 0 lượt đỏ.
- `tsc --noEmit`, eslint, prettier: đạt.
