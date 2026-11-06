# SEC review – PR #107 (V5-46) và ảnh chụp trong PR #98, #102, #107

- Round 5, bước Review. Người viết: SEC. Ngày 06/11/2026.
- Phạm vi:
  1. PR #107 `r5-fe-v5-46` @ `e2ffd228` (guest-web hiện câu `error.ID_NUMBER_DETECTED`), kèm xác nhận phần máy chủ trên `main` (FB-R4-ARC-BE-PR24PM-01, SR-LOG-04);
  2. ảnh chụp `rounds/round-05/outputs/FE/screenshots/*.png` mới trong PR #98 `r5-fe-v5-50` @ `1efe60c7`, PR #102 `r5-fe-v5-15-clean` @ `71db3338`, PR #107 @ `e2ffd228`.
- Đã đọc: `git diff origin/main...origin/r5-fe-v5-46` (10 tệp, +448/−12); `main` @ `ab1fc4ae`: `guest-portal.service.ts`, `guest-requests.service.ts`, `shared/validation.ts`, `shared/redact.ts`, `http.ts`, `openapi.yaml` (0.3.12 (i), bảng mã), `security-requirements.md` SR-LOG-04, `plan.md` V5-46, `backlog.md` dòng PR24PM-01, `decision-log.md` 04/11.
- Ảnh: tải bằng `git show origin/<nhánh>:<đường dẫn>` vào scratchpad, xem từng ảnh, đọc các khối PNG. Không lưu ảnh nào vào repo.
- CI #107 lúc đọc: 7 việc PASS (gồm format · lint · test · build, gitleaks, API contract); E2E smoke và LP-v1 còn chạy. Không PR nào chạm đường dẫn SEC giữ trong `.github/CODEOWNERS`.
- Không approve hay merge trên GitHub.

---

## 0. Kết luận

**PR #107 @ `e2ffd228`: DUYỆT về bảo mật, gộp được ngay.** 0 Blocker, 0 Major với PR này.

- Trang chỉ hiện câu cố định, không nhắc lại chữ khách gõ, không tự dò số giấy tờ, không lưu hay ghi log gì trên máy khách. Câu không lộ luật dò.
- Gộp #107 trước máy chủ là an toàn. Khi máy chủ chưa trả mã này, trang chạy y như cũ. Luật "cùng tag" (SEC 04/11) chỉ cấm chiều ngược lại: máy chủ bật chặn mà trang chưa có câu.

**Phần máy chủ: CHƯA CÓ trên `main`.** Đây không phải lỗi của #107.

- Trên `main`, `createGuestRequest.note` và `updateOnlineCheckin.arrivalNote` chỉ chặn số thẻ, chưa chặn số giấy tờ (mục 2).
- Dòng backlog ghi "Xong v1.0.4" chỉ đúng với phần lõi. Phần `guest-portal` chưa ai làm, và `plan.md` round 5 dòng V5-46 không giao cho BE.
- Phần log của SR-LOG-04 đạt: giá trị không vào log, audit hay thông báo lỗi.
- Thẻ: `FB-R5-SEC-BE-V546-01` (Major, cho đúng V5-46 của v1.0.5, không chặn #107) và `FB-R5-SEC-PO-V546-02` (Minor).

**Ảnh: 8/8 ĐẠT, gộp được ở cả ba PR.** Chỉ có dữ liệu giả của mock. Không có QR, tài khoản, SĐT, email, mã cửa, mã 2FA. Số giấy tờ duy nhất là số giả `079000000000`. Ảnh không mang metadata.

Thẻ: 1 Major (BE), 1 Minor (PO), 1 Suggestion (FE). Không có ESC.

---

## 1. PR #107 – kiểm theo yêu cầu

| Kiểm | Kết quả | Chỗ |
|---|---|---|
| Không nhắc lại chữ khách gõ | Đạt. Lỗi chỉ dẫn tới `t('error.ID_NUMBER_DETECTED')`, `t('error.CARD_NUMBER_DETECTED')` hoặc `t('gw.req.card_detected')`, đều là câu cố định, không tham số. `problemText` không dùng `detail`/`title` của máy chủ. Chữ khách chỉ còn trong ô nhập (state của component) để khách tự sửa | `app/problem.ts` 47–53, 66–83; `CheckinFlow.tsx` 489–493; `RequestsPage.tsx` 351–366 |
| Không tự dò số giấy tờ trên máy | Đạt. Không có regex giấy tờ nào trong mã chạy thật. `ID_RE` chỉ nằm trong `mocks/handlers.ts` (233, 327, 538). Mock chỉ nạp khi `import.meta.env.DEV && apiMode() === 'mock'` (`main.tsx` 15–17), và `apiMode()` trả `server` khi không phải DEV, nên bản build không mang mock | `app/config.ts` 5; `main.tsx` 15 |
| Không lưu trên máy (localStorage, sessionStorage, IndexedDB) | Đạt. `git grep` toàn `guest-web/src` (trừ test): không có lệnh lưu nào. Ghi chú lúc đến là `useState`, ô có `autoComplete="off"`. Chữ không đi vào URL | toàn `src/` |
| Không log, không analytics | Đạt. Không có `console.*`, `sendBeacon`, analytics, Sentry hay `reportError` trong `guest-web/src` | toàn `src/` |
| Câu không lộ luật dò | Đạt. EN "There's no need to include an ID number here. Please remove it and send again." VI và RU cùng nghĩa. Câu không nói 12 số, hộ chiếu, MRZ hay ngưỡng nào. Đây là khóa CPY đã duyệt, PR không đổi chữ | `strings-*.json` 3421 trên `main` |
| Đọc cả mã cấp trên | Đạt. `sensitiveNumberOf` đọc `error.code` và mọi `fieldErrors[].code`, thẻ trước giấy tờ sau, đúng thứ tự `sensitiveNumberKind` của máy chủ. Nhờ vậy sửa luôn lỗi cũ ở tab Yêu cầu: máy chủ thật trả mã cấp trên `CARD_NUMBER_DETECTED`, khách từng thấy câu "lỗi máy chủ" | `problem.ts` 47–53 |
| Bị chặn thì không lưu, không đi tiếp | Đạt. Bước Giờ đến trả `'id'`, không gọi `go('consent')`. Tab Yêu cầu không gọi `onSent()` và đổi khóa idempotency | `CheckinFlow.tsx` 322–329 |
| Mock và test chỉ dùng dữ liệu giả | Đạt. Vitest dùng hằng `FAKE_ID = '079000000000'`. Mock giữ ghi chú trong bộ nhớ và không trả lại. E2E dùng `fakeCccd()` và `namedGuest` (giả). `page.route` chặn mọi lệnh có 12 số trước khi tới máy chủ, nên staging không lưu số nào | test 15–16; spec 51–62 |
| A11y của câu báo | Đạt (ngoài phạm vi SEC, chỉ ghi lại): `role="alert"`, `aria-invalid`, `aria-describedby` | `CheckinFlow.tsx` |

Ghi chú, không thành thẻ:

- Hợp đồng nói hai cách về số thẻ ở `createGuestRequest`:
  - bảng mã cấp trên (openapi 154) có `CARD_NUMBER_DETECTED` 422;
  - mô tả 422 của `createGuestRequest` (9447) lại xếp nó dưới `VALIDATION_FAILED`.
- Máy chủ trả theo cách thứ nhất, FE nay đọc được cả hai. ARC nên thống nhất câu chữ ở 0.3.14. QA quyết có mở bug cho phần sửa kèm (báo cáo FE mục 1) hay không.

---

## 2. Phần máy chủ trên `main` @ `ab1fc4ae` (FB-R4-ARC-BE-PR24PM-01, SR-LOG-04)

| Kiểm | Kết quả | Bằng chứng |
|---|---|---|
| `updateOnlineCheckin.arrivalNote` chặn số giấy tờ | **Chưa.** Chỉ có `containsCardNumber` → `CARD_NUMBER_DETECTED`. Chuỗi giống CCCD được ghi vào `online_checkin.arrival_note` | `guest-portal.service.ts` 552–566 |
| `createGuestRequest.note` chặn số giấy tờ | **Chưa.** `note()` chỉ chặn số thẻ. Chuỗi giống CCCD được ghi vào `guest_request.note`, chép sang `note` của việc buồng phòng (`createTask`) và `description` của phiếu bảo trì (`createWorkOrder`). Như vậy số lọt tới cả vai HK và MT | `guest-requests.service.ts` 277, 330–360, 384–397 |
| Lý do trong mã | Ghi rõ "The ID half is NOT applied here (… guest-portal only after SEC – PR24PM-01 (3))" | `shared/validation.ts` 38–39 |
| Nơi đã dùng bộ dò giấy tờ | Chỉ có `public-site` (form website, chat): `public-booking.service.ts` 528–540, `website-requests.service.ts` 654–656 | `git grep sensitiveNumberKind` |
| SR-LOG-04, phần log | **Đạt.** Log yêu cầu chỉ ghi method, mẫu route, status, thời gian; có che khóa (`http.ts` 1–35). Bộ che `redactText` che 12/9 số, hộ chiếu, MRZ (`redact.ts` 4–5, 38). Audit chỉ ghi `hasNote`, bỏ khóa `arrivalNote` (`guest-portal.service.ts` 582–592). 422 chỉ có `field` + `code` | như cột trái |
| Hợp đồng | 0.3.12 (i) ghi "Chỉ bật khi guest-web có câu báo vi/en/ru cùng tag; không kịp thì phần này sang v1.0.5 và server chưa trả mã này" | `openapi.yaml` 400–401 |
| Kế hoạch | `plan.md` V5-46 giao "ARC → MOB/FE-B → SEC, CPY", không có BE. Hợp đồng 0.3.13 mục 1.12 và bảng làn chỉ giao FE-B và MOB | `plan.md` 163; `contract-0.3.13.md` 394–399, 755 |
| Backlog | Dòng `FB-R4-ARC-BE-PR24PM-01` ghi "**Xong v1.0.4**" và "chờ SEC duyệt". Cả hai đều sai với phần `guest-portal`: SEC đã đồng ý có điều kiện ngày 04/11 (decision-log, mục (4)), và phần này chưa làm | `backlog.md` 1631; `decision-log.md` 1145, 1207 |

Mức rủi ro: **Medium.**

- Số giấy tờ khách tự gõ nằm dạng chữ thường, không mã hóa, trong 2 bảng và 2 nơi nhận việc (HK, MT).
- Ảnh giấy tờ thì được mã hóa và giới hạn người xem, nhưng chuỗi số này thì không.
- Đây là lỗ hổng có từ trước, không phải hồi quy, và SEC đã cho dời sang v1.0.5. Nay đã là v1.0.5 mà chưa ai nhận việc, nên ghi thẻ Major cho round này. Không cần ESC: việc này thuộc quyền kỹ thuật của đội.

---

## 3. Ảnh chụp – bảng kiểm

Danh sách cần che: QR (VietQR, link khách, link check-in), số tài khoản, tên chủ tài khoản, tên/SĐT/email khách, số giấy tờ, mã cửa, mã 2FA.

Cách kiểm:
- xem từng ảnh bằng mắt;
- đối chiếu từng tên người với dữ liệu mẫu trong `product/apps/admin-web/src/mocks/*` (đã có từ round 1, cũng có trong hi-fi và wireframe);
- đọc các khối PNG: cả 8 ảnh chỉ có `IHDR`, `IDAT`, `IEND`, không có `tEXt`/`iTXt`/`zTXt`/`eXIf`/`tIME`.

| PR | Tệp (blob) | Thấy trong ảnh | Vấn đề |
|---|---|---|---|
| #98 | `v5-50-change-room-1366.png` (`91890e6b22c6`) | Hộp Đổi phòng, căn 402, khách "Kim Seo-yeon" (tên mẫu trong `mocks/reservations.ts` 350), ngày 06–09/11/2026, câu "Không còn căn sẵn sàng" | Không |
| #98 | `v5-50-change-room-390.png` (`574a1e94afd2`) | Như trên, khổ 390 | Không |
| #102 | `v5-15-needs-cleaning-1366-after.png` (`7920085ca012`) | Màn Buồng phòng: việc buồng phòng, bảng trạng thái 10 căn, toast "Căn 301…". Tên: Trần Thu Nga, Emma Laurent, Phạm Huy, Daniel Weber (đều trong `mocks/reservations.ts`, `stay.ts`). Lời khách mẫu "Thêm 2 khăn tắm". Nhân viên "Hạnh · Lễ tân" (tên mẫu từ Round 0, `mocks/seed.ts`) | Không |
| #102 | `v5-15-needs-cleaning-1366-before.png` (`abaec9f1dd63`) | Cột Trạng thái buồng 10 căn, nút "Cần dọn" ở 301; cùng các tên mẫu, thêm Kim Seo-yeon | Không |
| #102 | `v5-15-needs-cleaning-390-before.png` (`6177ad080e76`) | Như trên, khổ 390 | Không |
| #107 | `v5-46-eta-id-number-390-vi.png` (`f6147cc5f706`) | Bước Giờ đến, ghi chú "CCCD 079000000000" (số giả của test), câu báo VI. Câu có nói "giao mã cửa" nhưng không có mã nào | Không |
| #107 | `v5-46-eta-id-number-390-en.png` (`03fb6c9f2c14`) | Như trên, EN | Không |
| #107 | `v5-46-request-id-number-390-vi.png` (`298189ad475a`) | Tab Yêu cầu, loại "Khác", lời nhắn "Số CCCD của tôi 079000000000" (giả), khung giờ lễ tân, nút "Gọi người trực" (không hiện số), câu báo VI | Không |

Ghi chú:
- **Số giả trong #107:** `079000000000` đúng là hằng `FAKE_ID` của vitest. Có 6 số cuối bằng 0, rõ là số mẫu, không phải số của ai. Số này cố ý xuất hiện để minh họa luồng chặn, nên không cần che.
- **Tên nhân viên "Hạnh":** chỉ là tên gọi trong dữ liệu mẫu Round 0, không thuộc danh sách cần che, đã có trong repo từ Round 1. Không xử lý gì thêm.
- **Ghim blob:** blob ghi trong bảng là bản SEC đã xem. Nếu ảnh đổi sau các commit đầu nhánh đã ghi ở đầu tệp, SEC phải kiểm lại trước khi gộp.

---

## 4. Thẻ

### FB-R5-SEC-BE-V546-01
- Mức độ: Major
- Vị trí: `product/services/api/src/modules/guest-portal/internal/guest-portal.service.ts` 552–566 (`arrivalNote`); `guest-requests.service.ts` 384–397 (`note()`); `rounds/round-05/plan.md` dòng V5-46
- Vấn đề:
  - Phần `guest-portal` của PR24PM-01 chưa có trên `main` @ `ab1fc4ae`: hai ô khách gõ chỉ chặn số thẻ.
  - Hợp đồng 0.3.12 (i) đã ghi hai ô này trả 422 `ID_NUMBER_DETECTED`, và đặt hạn v1.0.5 nếu không kịp v1.0.4.
  - Round 5 không giao việc này cho BE nào (plan V5-46 chỉ có FE-B và MOB).
- Vì sao quan trọng:
  - Khách gõ số CCCD hay hộ chiếu vào ghi chú thì số đó được lưu dạng chữ thường ở `online_checkin.arrival_note` và `guest_request.note`.
  - Từ đó số được chép sang việc buồng phòng và phiếu bảo trì, nên HK và MT cũng thấy.
  - Điều này trái nguyên tắc tối thiểu dữ liệu và trái cách lưu số giấy tờ đã chốt (mã hóa, giới hạn người xem).
  - Không có chủ thì V5-46 lại trượt, và câu báo của #107 không bao giờ hiện.
- Đề xuất sửa (giữ đúng điều kiện SEC 04/11):
  1. Trong `note()` và nhánh `arrivalNote`: sau `stripControl…().trim()`, dùng `sensitiveNumberKind` của `shared/sensitive-number.ts` (thẻ trước, giấy tờ sau). Giấy tờ → `422 VALIDATION_FAILED`, `errors[{ field: 'note' | 'arrivalNote', code: 'ID_NUMBER_DETECTED' }]`, đúng ví dụ `idInNote`. Chỉ có `field` + `code`, không `detail`.
  2. Bị chặn thì không ghi gì: không UPDATE hay INSERT, không tạo việc HK hay phiếu bảo trì, không audit, không outbox, không SSE. `updateOnlineCheckin` bỏ cả lệnh (giờ đến cũng chưa lưu), khớp với cách #107 giữ khách ở bước Giờ đến.
  3. Không áp nửa giấy tờ cho `replyNote` của nhân viên, cho `registration` hay ô nhân viên nhập (PR24PM-01 giữ nguyên).
  4. Test tích hợp:
     - CCCD 12 số, hộ chiếu và MRZ giả ở cả hai ô → 422 đúng dạng;
     - không có dòng mới hay dòng đổi trong `guest_request`, `online_checkin`, `hk_task`, `work_order`, `audit_event`;
     - log bắt được không chứa dãy số;
     - một chuỗi vừa là số thẻ vừa giống giấy tờ → `CARD_NUMBER_DETECTED`.
  5. Lên **cùng tag** với #107 (hoặc sau #107), không bao giờ trước. Khi bật, QA bỏ `page.route` trong `v5-46-guest-id-number.r5.spec.ts` theo ghi chú đầu tệp.
  6. ORC giao chủ (BE-D, người làm lõi PR24PM-01) và thêm BE vào dòng V5-46 của plan. Nếu không kịp v1.0.5, ORC ghi Deferred có hạn mới vào decision-log, và release-notes không được nói trang đã chặn số giấy tờ.
- Trạng thái: Open

### FB-R5-SEC-PO-V546-02
- Mức độ: Minor
- Vị trí: `03-backlog/backlog.md` dòng 1631 (`FB-R4-ARC-BE-PR24PM-01`)
- Vấn đề: Dòng này ghi "**Xong v1.0.4**" và "chờ SEC duyệt" cho cả việc. Thực tế:
  - phần lõi đã xong ở v1.0.4;
  - SEC đã đồng ý có điều kiện phần `guest-portal` ngày 04/11 (decision-log 1145, mục (4));
  - phần `guest-portal` chưa làm (mục 2 ở trên).
- Vì sao quan trọng: Người đọc backlog (QC, ORC) sẽ tưởng máy chủ đã chặn số giấy tờ ở cổng khách, rồi đóng V5-46 khi chỉ có nửa trang.
- Đề xuất sửa: Tách thành 2 dòng.
  - (a) Lõi: Xong v1.0.4.
  - (b) Phần `guest-portal` (`createGuestRequest.note`, `updateOnlineCheckin.arrivalNote`): SEC đồng ý có ĐK 04/11, đích v1.0.5, chủ BE-D, gắn V5-46 và `FB-R5-SEC-BE-V546-01`, cùng tag với PR #107.
- Trạng thái: Open

### FB-R5-SEC-FE-V546-03
- Mức độ: Suggestion
- Vị trí: `product/tests/e2e/ui/v5-46-guest-id-number.r5.spec.ts` 141, 178 (`fakeCccd()`)
- Vấn đề:
  - `fakeCccd()` sinh `079` + 9 số ngẫu nhiên, nên có thể ra một số đúng cấu trúc CCCD thật.
  - Sau khi máy chủ bật, `page.route` bị bỏ. Lúc đó số này sẽ tới staging, và nằm trong trace Playwright (artifact CI của repo public) khi test hỏng.
- Vì sao quan trọng: Rủi ro thấp (số giả, máy chủ sẽ chặn và không lưu). Nhưng một hằng số rõ ràng là số mẫu dễ rà hơn khi kiểm artifact.
- Đề xuất sửa:
  - Trong spec này, dùng hằng `079000000000` như vitest (không cần đổi `fakeCccd()` dùng chung).
  - Khi bỏ `page.route`, thêm một kiểm "không lưu" qua API Desk: `Registration.onlineCheckin` không có ghi chú mới, và số yêu cầu của đơn không tăng.
- Trạng thái: Open

---

## 5. Điểm làm tốt
- FE không dò số giấy tờ trên máy khách, lý do ghi rõ (G1): luật dò chỉ ở máy chủ, không lộ ra bản build.
- `sensitiveNumberOf` đọc cả mã cấp trên và mã trường, nhờ đó bắt được lỗi cũ của tab Yêu cầu (máy chủ thật trả câu "lỗi máy chủ" thay vì câu số thẻ), kèm test riêng.
- E2E chặn bằng `page.route` trước khi số tới máy chủ, nên staging không bị lưu số giấy tờ trong lúc máy chủ chưa bật. Ảnh chụp trên mock, đều là dữ liệu mẫu, không metadata.
