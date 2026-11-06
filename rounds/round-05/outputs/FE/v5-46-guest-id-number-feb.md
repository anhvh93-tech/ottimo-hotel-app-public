# FE-B – v1.0.5 V5-46 `r5-fe-v5-46`: câu báo khi máy chủ chặn số giấy tờ (guest-web)

- Người viết: FE-B | Round 5 – bước **Sản xuất** | 06/11/2026
- Nhánh: `r5-fe-v5-46` cắt từ `origin/main` @ `ab1fc4ae` (đã có #94, OpenAPI 0.3.13). Không đổi hợp đồng: `ID_NUMBER_DETECTED` cho `createGuestRequest.note` và `updateOnlineCheckin.arrivalNote` có từ 0.3.12 (i).
- Căn cứ: `rounds/round-05/plan.md` dòng V5-46 (FB-R4-SEC-ARC-P104-03); ARC `contract-0.3.13.md` mục 1.12 và bảng làn ("FE-B: V5-46 không chờ – bật cùng tag máy chủ").
- Trang khách là **web** (`product/apps/guest-web`), nên làm ở FE-B. App khách của MOB (nếu có ô ghi chú tương tự) không ở PR này.
- **Bật cùng tag máy chủ**: phần `guest-portal` của luật SR-LOG-04 (PR24PM-01, chờ SEC) chưa có trên `main`. PR này chỉ thêm câu báo; trang chưa nhận mã này thì chưa hiện gì khác. Hai phần lên cùng một tag (luật "cùng tag" 4.2 ý 6).

## 1. Đã làm gì
- `app/problem.ts`: thêm `ID_NUMBER_DETECTED → error.ID_NUMBER_DETECTED` vào bảng mã của khách. Thêm hàm `sensitiveNumberOf(error)` trả `'card' | 'id'`, đọc **mã trường** và **mã cấp trên** (thẻ trước, giấy tờ sau, như thứ tự của máy chủ). `problemText` dùng hàm này.
- Check-in online, bước **Giờ đến** (`CheckinFlow.tsx`): máy chủ trả 422 với `arrivalNote` + `ID_NUMBER_DETECTED` → câu hiện ngay dưới ô "Ghi chú cho lễ tân" (`role="alert"`, ô `aria-invalid`, `aria-describedby`), khách ở lại bước này, chữ đã gõ vẫn còn để sửa. Sửa ô → câu mất. Giống hệt cách đang làm với số thẻ.
- Tab **Yêu cầu** (`RequestsPage.tsx`): 422 với `note` + `ID_NUMBER_DETECTED` → câu hiện ở khung báo lỗi dưới form, yêu cầu không được tạo.
- **Không** tự dò số giấy tờ trên máy khách: bộ dò của máy chủ (SR-LOG-04) quyết định. Số thẻ vẫn chặn sớm trên máy như cũ.
- Mock MSW: thêm `ID_NUMBER_DETECTED` vào `requestFail`, và một luật thay thế đơn giản (chuỗi 12 số liền) cho `arrivalNote` và `note`. Luật thật nằm ở `services/api/src/shared/sensitive-number.ts`.

### Sửa kèm (lỗi tiềm ẩn cùng chỗ)
- Máy chủ `guest-portal` trả số thẻ trong lời nhắn yêu cầu với **mã cấp trên** `CARD_NUMBER_DETECTED` (không phải `VALIDATION_FAILED`). Tab Yêu cầu trước đây chỉ đọc mã trường khi mã cấp trên là `VALIDATION_FAILED`, nên với máy chủ thật khách sẽ thấy câu "lỗi máy chủ, mã …" thay vì "Vui lòng không ghi số thẻ thanh toán.". Mock cũ trả `VALIDATION_FAILED` nên test không bắt được. Nay `sensitiveNumberOf` đọc cả hai dạng; có 1 ca test riêng. QA xem có cần mở bug để ghi nhận không.

## 2. Chữ
Không viết chữ mới. Dùng nguyên khóa đã duyệt `error.ID_NUMBER_DETECTED` (CPY lượt 2, FB-R4-CPY-UXD-P401-05; nhóm "v1.0.4 PR24PM-01 – guest-web" trong `gen_strings.py`), không sửa `gen_strings.py`:

| Ngôn ngữ | Câu |
|---|---|
| EN | There's no need to include an ID number here. Please remove it and send again. |
| VI | Không cần ghi số giấy tờ ở đây. Vui lòng xóa số đó rồi gửi lại. |
| RU | Номер документа здесь указывать не нужно. Пожалуйста, удалите его и отправьте снова. |

Câu không nhắc lại chữ khách gõ. Khóa có trong mã nguồn dưới dạng chữ cố định nên bản build guest-web mang theo (`build/used-keys.ts`).

## 3. Tệp
- Sửa: `product/apps/guest-web/src/app/problem.ts`, `src/checkin/CheckinFlow.tsx`, `src/pages/RequestsPage.tsx`, `src/mocks/handlers.ts`.
- Mới: `product/apps/guest-web/src/__tests__/v5-46-id-number.test.tsx`, `product/tests/e2e/ui/v5-46-guest-id-number.r5.spec.ts`, ảnh `screenshots/v5-46-*.png`, báo cáo này.

## 4. Kiểm
- Vitest 10 ca: bảng chữ đúng 3 ngôn ngữ; `problemText`/`sensitiveNumberOf`; ghi chú lúc đến VI/EN/RU (câu đúng, `role="alert"`, `aria-invalid`, không lưu ghi chú, ở lại bước, xóa số → đi tiếp và lưu ghi chú mới); lời nhắn yêu cầu VI/EN/RU (câu đúng, không tạo yêu cầu, không hiện câu "cần mô tả"); `requestFail` chỉ có mã trường; dạng thẻ của máy chủ thật (mã cấp trên `CARD_NUMBER_DETECTED`).
- Toàn bộ vitest guest-web xanh (99 ca, gồm `bundle.test.ts` quét bản build). `tsc` guest-web và `tests`, `eslint`, `prettier` sạch.
- E2E (project `desk-chromium`, API thật, chạy ở CI): (1) đơn mới + link khách, qua API làm bước thông báo và gửi giấy tờ 2 khách; trang mở ở bước Giờ đến, gõ số CCCD giả → câu báo, `aria-invalid`, axe 0 critical/serious; xóa số → máy chủ thật nhận bước, sang Xác nhận. (2) tab Yêu cầu, loại "Khác", lời nhắn có số CCCD giả → câu báo + axe.
  - Vì máy chủ chưa bật phần `guest-portal`, lệnh có số giấy tờ được `page.route` trả đúng ví dụ hợp đồng (`idInNote`); số không tới máy chủ. Khi BE bật tag, bỏ `page.route` để chạy với máy chủ thật (ghi trong đầu tệp spec).
- Ảnh 390 px trên mock (dữ liệu giả, số `079000000000`): `v5-46-eta-id-number-390-vi.png`, `-390-en.png`, `v5-46-request-id-number-390-vi.png`. Axe trên mock: 0 critical/serious ở cả 3 màn.

## 5. Giả định
- G1. Không dò số giấy tờ trên máy khách (khác số thẻ). Lý do: luật SR-LOG-04 phức tạp (CCCD, hộ chiếu, MRZ), giữ một chỗ ở máy chủ; plan và hợp đồng chỉ yêu cầu hiện câu.
- G2. Câu ở tab Yêu cầu nằm ở khung báo lỗi chung dưới form (như câu số thẻ `gw.req.card_detected`), không đặt dưới ô. Muốn đặt dưới ô cho cả hai câu thì UXD quyết, sửa một lần cho cả thẻ và giấy tờ.

## 6. Cần xem
- SEC: câu và cách xử lý (không nhắc lại chữ khách, không lưu trên máy, không ghi log ở trang).
- BE / OPS: phần `guest-portal` của PR24PM-01 phải lên cùng tag với PR này.
- QA: sửa kèm số thẻ ở tab Yêu cầu (mục 1); khi máy chủ bật, chạy lại E2E V5-46 không có `page.route`.
- MOB: nếu app khách có ô ghi chú gửi tới hai lệnh này, dùng chung khóa `error.ID_NUMBER_DETECTED`.
