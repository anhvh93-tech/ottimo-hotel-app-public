# BE-D trả lời review – P4-14 `v104/be-sensitive` (PR-J)

- Người trả lời: BE (làn BE-D) | Ngày: 04/11/2026 | Round 4 – đợt v1.0.4 – Bước: **Phản hồi & sửa**
- Review được trả lời: `rounds/round-04/reviews/ARC-on-v104-p4-14.md` (P414-01, P414-02); `rounds/round-04/reviews/SEC-on-v104-be-d.md` (BED-04, BED-05, phần P4-14).
- Quyết định ORC cho P414-01: **phương án A** (làm PR24PM-01 lõi trên nhánh này trước khi mở PR-J).
- Nhánh `v104/be-sensitive`, đã rebase lên `origin/main` @ `4e94fbcc`. Chưa mở PR, không đụng `main`.

## 1. Bảng trả lời thẻ

| Thẻ | Mức | Trạng thái | Đã làm |
|---|---|---|---|
| FB-R4-ARC-BE-D-P414-01 (= ARC-BE-PR24PM-01 lõi) | Minor | Done (lõi). Phần `guest-portal` để sau | (1) `git mv` `public-site/internal/sensitive-number.ts` → `src/shared/sensitive-number.ts`. Tệp thuần hàm, chỉ nhập `./redact`. (2) `website-request-rules.ts`: sửa **đúng 1 dòng** import (`'./sensitive-number'` → `'../../../shared/sensitive-number'`). (3) `shared/validation.ts` `containsCardNumber` = luật cũ (giữ nguyên, đổi tên nội bộ `containsCardNumberOriginalRule`) **OR** `looksLikeCard` của bộ dò. Mã lỗi giữ `CARD_NUMBER_DETECTED`. Không thêm nơi gọi mới. Không áp nửa giấy tờ. (4) Vòng Luhn riêng trong `sensitive-number.ts` bỏ, dùng `luhnValid` của `shared/redact.ts`, nên cả API chỉ còn **một** vòng Luhn. (5) Test kiến trúc: ngoài `src/shared/` không tệp nào có hàm `luhn`, phép thử `% 10 === 0`, bước nhân đôi `*2 … -9` hay cửa sổ thẻ `{12,18}`/`{13,19}`. Trong `shared/` chỉ `redact.ts` có vòng Luhn |
| FB-R4-ARC-BE-D-P414-02 | Suggestion | Done | `v104-log-line.test.ts` ca BED-05: bỏ khớp nguyên văn. Nay khớp `/'job failed',\s*\{[^}]*\.\.\.errorTag\(\w+\)/`, chịu được Prettier xuống dòng và đổi tên biến. Giữ `not.toMatch(/\.message\b/)` |
| FB-R4-SEC-BE-BED-04 | Minor | Done (lượt trước, `a7b0eff6`) | Không đổi. Ghi chú: ca lọt `4111 1111 11-11 1111` của bộ dò **vẫn bị chặn** ở mọi module khác qua `containsCardNumber` (luật cũ trong phép OR). Có test |
| FB-R4-SEC-BE-BED-05 | Minor | Done (lượt trước) | Không đổi mã. Chỉ nới test theo P414-02 |

## 2. Phạm vi giai đoạn B: đã làm và để sau

| Việc | Trạng thái | Căn cứ |
|---|---|---|
| Chuyển `sensitive-number.ts` sang `src/shared/`, 1 dòng import | Done | ARC P414-01 (A) ý 1; plan 2.4 ngoại lệ |
| `containsCardNumber` = nửa thẻ mới OR luật cũ, ở mọi nơi đang gọi (`guest-portal`, `registration`, `reservations`, `payments/refunds`, `platform/receiving-account`, và mọi chỗ dùng `assertNoCardNumber` / `requireReason`) | Done | ARC P414-01 (A) ý 2; SEC-on-plan-v1.0.4 4.2 ý 1 |
| Test kiến trúc "ngoài `shared/` không tự viết Luhn" | Done | ARC P414-01 (A) ý 3 |
| `guest-portal` nửa giấy tờ: 422 `ID_NUMBER_DETECTED` cho `note` / `arrivalNote` | **Không làm** | ARC: chỉ vào khi SEC duyệt **và** guest-web có câu báo vi/en/ru cùng tag. SEC 4.2 ý 6: nếu không thì để v1.0.5. Máy chủ chưa trả mã này. Hợp đồng không cần sửa (0.3.12 (i) đã ghi điều kiện bật) |

## 3. Test

- Tệp mới `services/api/test/v104-card-rule-shared.test.ts` (unit, không DB), cho từng tiêu chí:
  - vị trí: tệp chỉ có ở `shared/`, chỉ nhập `./redact`, `website-request-rules.ts` nhập từ `shared/`, `platform/public/validation` vẫn re-export đúng hàm;
  - **bắt thêm** (luật cũ bỏ lọt): ZWSP, chữ số toàn chiều rộng, NBSP, `_`, `/`, hai dấu cách, xuống dòng, `%20`, từng chữ số cách dấu phẩy, từng cặp gạch nối;
  - **giữ** ca luật cũ đã bắt: liền, cách nhóm trong câu, gạch nối, và `4111 1111 11-11 1111` (bộ dò bỏ lọt, luật cũ bắt). Có ca chứng minh phép OR cần cả hai vế;
  - **không chặn**: rỗng, ngày giờ, danh sách ngày, SĐT `+84`, hai SĐT VN, số tiền, số phòng, mã đơn `OTM-…`, số chuyến bay, 16 số không có cửa sổ Luhn hợp lệ. CCCD 12 số thử **không** bị coi là thẻ, chứng minh nửa giấy tờ không nằm trong `containsCardNumber`;
  - lỗi: `assertNoCardNumber` ném `ProblemError` 422 `CARD_NUMBER_DETECTED`, `errors` chỉ `field` + `code`, không nhắc lại chữ đã gõ;
  - kiến trúc: dấu hiệu dò bắt được bản thật trong `shared/` (để chắc phép quét có tác dụng). Ngoài `shared/`: 0 tệp khớp. Trong `shared/`: chỉ `redact.ts` có vòng Luhn.
- `test/integration/guest-requests-s4-bed.test.ts`, ca V-09 của `createGuestRequest`, thêm 3 ghi chú khách gõ qua HTTP trên PostgreSQL thật: thẻ chữ số toàn chiều rộng, NBSP, `_`. Kết quả 422 `CARD_NUMBER_DETECTED`, `errors` = `note` + mã, thân trả về không có chữ số thẻ. ZWSP không dùng ở đây vì `stripControlChars` đã xóa ZWSP trước khi kiểm, nên luật cũ cũng bắt.
- Kết quả chạy: xem mục 5.

## 4. Giả định và rủi ro

1. Ô chữ tự do ở các module khác nay có thể bị 422 nhiều hơn một chút (thẻ viết bằng `_` `/` `,`, NBSP, nhiều dấu cách, toàn chiều rộng). Đây là hỏng theo hướng an toàn, cùng mã lỗi, và đúng điều kiện SEC 4.2 ý 1. Bộ test api đầy đủ không có ca "không được chặn" nào đỏ. QA nên chạy lại TC-V104-SN-04/05.
2. Phép quét kiến trúc chỉ phủ `services/api/src`. Ngoài API còn vòng Luhn ở `apps/guest-web/src/app/validation.ts` (kiểm trước ở máy khách), `apps/admin-web/src/mocks/*` (mock) và `integrations/common` (`scrubCardData`). Ba chỗ này ngoài phạm vi thẻ (thẻ nói "ngoài `shared/`" của API) và không phải tệp của BE-D.
3. Không có migration, không đổi hợp đồng, RBAC hay idempotency.

## 5. Kết quả chạy (cây đã rebase lên `origin/main` @ `4e94fbcc`)

- `vitest` toàn bộ `@ottimo/api` trên PostgreSQL riêng của làn (container `ottimo-p414b-pg`, 17-alpine, init roles của repo): **156 tệp đạt, 2 bỏ qua; 3943 ca đạt, 24 bỏ qua (3981), 0 lỗi** (414 s). Các ca bỏ qua là `skipIf` có sẵn theo biến môi trường, không thuộc gói này. Ca V-09 tích hợp của `createGuestRequest` đã chạy trên DB và đạt.
- `pnpm --filter @ottimo/api typecheck`: sạch.
- `eslint .` (gốc `product/`): 0 lỗi (3 cảnh báo có sẵn ở `mockServiceWorker.js` sinh tự động, không liên quan). `prettier --check .`: sạch.
