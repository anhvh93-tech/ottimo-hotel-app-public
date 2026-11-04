# UXD review – v1.0.4 P4-42: thông báo xử lý dữ liệu `privacy-2026-10-v2` trên trang khách (MOB)

- Người review: UXD | Round 4 – đợt v1.0.4 – bước **Review** | 04/11/2026
- Đối tượng: `git diff origin/main...origin/v104/guest-privacy-v2` @ `80c35dcc`. Mốc so sánh là `origin/main` @ `7b5b6117`, merge-base `917a39cf`. Diff gồm `apps/guest-web/src/{app/config.ts, app/i18n.tsx, checkin/CheckinFlow.tsx, styles.css, mocks/handlers.ts}`, nhóm `v1.0.4 P4-42 privacy-2026-10-v2` trong `gen_strings.py` và 4 tệp sinh ra. Đọc kèm báo cáo `rounds/round-04/outputs/MOB/v1.0.4-P4-42.md`.
- Đối chiếu:
  - brand guideline `00-brief/context/brand/brand-guidelines.md`;
  - chữ gốc SEC `rounds/round-04/reviews/SEC-on-plan-v1.0.4.md` mục 6.2 và 6.4;
  - bản RU đã duyệt `rounds/round-04/reviews/UXD-on-privacy-v2-ru.md` mục 2.
- Cách kiểm:
  - chạy guest-web bản mock trên một worktree tạm, mở bằng Playwright (Chromium) ở 390×844 và 1440×900, VI/EN/RU, với token giả `demo-guest-link-…`;
  - đọc `innerText`, đọc style tính được và chụp ảnh. Ảnh chỉ để trong scratchpad, không commit, dù không có dữ liệu khách;
  - so chữ bằng script từng ký tự, có kiểm U+00A0.

## Kết luận: ĐẠT

Không có thẻ Blocker hay Major. Có 1 thẻ Minor và 1 thẻ Suggestion, đều không chặn gộp. Không có việc cần báo chủ đầu tư.

**Chữ**
- EN/VI của 4 đoạn khớp từng ký tự với SEC 6.2.
- RU của 11 khóa khớp từng ký tự với UXD-on-privacy-v2-ru mục 2. U+00A0 có đủ ở `3 месяцев`, `35 дней` và `{days} дн.`.
- Bỏ 8 hàng cũ (nhóm "Luồng 7", Sprint 3, `RU_EXTRA`) và gom 11 khóa vào một nhóm. Cách này đúng như UXD đề nghị: sau này UXD/SEC chỉ phải sửa ở một chỗ.

**Trang RU**
- `<html lang="ru">`. Trong `main` không còn phần tử `lang="en"` nào, và nút "Прочитано" không mang `lang`.
- Không còn `gw.legal_en_notice`.

**Bố cục**
- `.gw-notice { white-space: normal }` cần thiết: `.quote-text` lấy `pre-wrap` từ `design/hifi/assets/hifi.css` (DS nhập qua `@ottimo/ui/styles.css`), và dòng này đưa 4 đoạn về ngắt dòng thường.
- Thứ tự từ trên xuống: tiêu đề `gw.notice_title` (Lora 20 px), dòng `guest.oci.why`, khối trích (nền Cream #EDE6D8, chữ Ink #2B2B28, Be Vietnam Pro 14/21), 4 đoạn theo thứ tự SEC, dòng phiên bản, rồi nút chính (Ink trên Ivory, cao 44 px).
- Không tràn ngang ở cả 390 và 1440 (`scrollWidth` bằng chiều rộng khung).
- Ở 390, bản RU dài nhất (khoảng 990 ký tự). `.m-body` cuộn bên trong (701/637 px), dòng phiên bản vẫn tới được, nút đáy luôn hiện.

**Brand**
- Không có màu tự đặt, không có emoji, không có `style` inline.
- Giọng đúng mẫu: câu ngắn, điềm tĩnh, EN dẫn.

| Thẻ | Mức | Tóm tắt |
|---|---|---|
| 01 | Minor | Khoảng cách giữa các đoạn là 10 px, ngoài thang `space` (8/12). Đổi sang 12 px như UXD đã ghi ở bản duyệt RU |
| 02 | Suggestion | Dòng phiên bản `privacy-2026-10-v2` là mã, nên dùng JetBrains Mono theo hệ chữ |

## Trả lời giả định của MOB (báo cáo mục 4)

- **`guest.oci.why` giữ phía trên khối: đồng ý.** Dòng này là câu dẫn "vì sao", không thuộc văn bản thông báo nên đứng ngoài khối trích. SEC 6.2 không yêu cầu bỏ.
- **Bỏ hẳn v1 khỏi `NOTICE_TEXT_VERSIONS`: đồng ý về giao diện.** Khi máy chủ còn ở v1, trang đóng an toàn và dẫn khách tới quầy. Màn này dùng câu sẵn có, đã duyệt ở v1.0.3, không cần chữ mới.

## Việc liên quan ngoài gói (không phải thẻ cho MOB)

- **Tờ in "Your ID details" v2 (EN/VI và RU)** là việc của UXD, trên nhánh `v104/uxd-id-sheet-v2`, theo UXD-on-privacy-v2-ru mục 3.2 T1–T10. Tờ phải xong trước bước 6.4 ý 5.2 (thay tờ ở quầy), tức trước khi OWN đặt `privacy_notice_version` = v2. Tờ không chặn gộp P4-42.
- Font thân chữ RU trên guest-web vẫn theo quy ước hiện hành: Be Vietnam Pro không có Kirin, nên chữ rơi về font hệ thống. Gợi ý S2 dùng Onest như landing `/ru/` để lượt sau. Không chặn.

---

### FB-R4-UXD-MOB-P442-01
- Mức độ: Minor
- Vị trí: `product/apps/guest-web/src/styles.css` dòng 106–108 (`.gw-notice > p + p { margin-top: 10px; }`)
- Vấn đề:
  - đo trên trang (390 và 1440, cả 3 ngôn ngữ): đoạn 2–4 có `margin-top` = 10px;
  - `product/design/tokens.json` mục `space` chỉ có 0/2/4/8/12/16/20…, không có 10;
  - bản duyệt RU (UXD-on-privacy-v2-ru mục 1, "Kiểm chung") đã ghi giữ khoảng cách đoạn 12 px.
- Vì sao quan trọng:
  - Design System chỉ dùng giá trị trong thang;
  - 4 đoạn pháp lý dài: 12 px tách đoạn rõ hơn trên màn 360–390 mà không kéo dài trang đáng kể (thêm 6 px cho cả khối);
  - khối trích đã có `padding: 12px`, cách đoạn bằng đúng padding thì nhịp đều hơn.
- Đề xuất sửa: đổi `10px` thành `12px`. Không cần sửa test, vì test không đo khoảng cách.
- Trạng thái: Open

### FB-R4-UXD-MOB-P442-02
- Mức độ: Suggestion
- Vị trí: `CheckinFlow.tsx` `NoticeStep`, dòng `<p className="li-s mt-8">{t('gw.notice_version', { v: version })}</p>`
- Vấn đề: `privacy-2026-10-v2` là mã phiên bản nhưng đang hiện bằng Be Vietnam Pro. Brand guideline mục 6 quy định mã và thông số dùng JetBrains Mono.
- Vì sao quan trọng: khách và lễ tân đọc đúng mã khi đối chiếu với tờ ở quầy (chân tờ ghi `ID notice · v2`). Mã viết bằng font mono dễ nhận ra là mã, không phải câu văn.
- Đề xuất sửa: bọc `{v}` trong `<span className="mono">`. Khóa `gw.notice_version` có tham số, nên cần tách: hiện nhãn bằng `t(...)` với `v` là phần tử React, hoặc tách thành nhãn + mã. Việc nhỏ, có thể dời sang lượt sau.
- Trạng thái: Open

---

## Điểm làm tốt
- Gom 11 khóa pháp lý vào **một nhóm**, mỗi khóa có ghi chú nguồn (SEC, CPY, UXD, SHA). Đổi chữ là đổi version, nên ai sửa cũng thấy ngay quy tắc.
- Mảng `NOTICE_PARAGRAPHS` giữ thứ tự đoạn ở một chỗ. Mỗi đoạn là một `<p>`, nên trình đọc màn hình đọc từng đoạn, không đọc thành một khối liền.
- Test so chữ RU từng ký tự, có kiểm cả U+00A0, và kiểm trang RU không còn `lang="en"`. Ý duyệt giọng và kiểu chữ của UXD vì thế được giữ lại bằng test.
