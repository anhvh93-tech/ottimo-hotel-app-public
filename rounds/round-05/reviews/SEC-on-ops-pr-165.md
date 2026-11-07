# SEC review – OPS PR #165 (V5-47: so chữ tờ in "Your ID details" với trang khách)

- Người review: SEC | Round 5 (v1.0.5) – Review | Ngày: 07/11/2026
- Đối tượng: PR #165 @ **`38c9c398`** (`38c9c398956e0b3542ffe86bf25542f85c8e5991`), merge-base với `main` là `f63afee0`. 7 tệp: `product/design/tools/check_print_notice.py` (mới), `tests/test_check_print_notice.py` (mới), `build_print_sheets.py` (tách `notice_parts`, gọi bộ so trước khi dựng), `.github/workflows/ci.yml`, `.github/CODEOWNERS`, `docs/dev-setup.md`, báo cáo OPS.
- SEC xét: luật so cho chữ pháp lý (thông báo xử lý dữ liệu cá nhân, NĐ 13/2023), CI gate, hai tệp có dòng SEC (`ci.yml` thuộc `/.github/workflows/`, `CODEOWNERS` thuộc `/.github/CODEOWNERS`), bộ so có chạy an toàn trong CI không. Chữ và bộ dựng là việc của UXD, tiêu chí là việc của PO.
- Đã chạy trên cây của PR (worktree tạm, đã gỡ): `python3 -I design/tools/tests/test_check_print_notice.py` → **23/23 đạt**; `python3 -I design/tools/check_print_notice.py` → `KHỚP: 7 tờ × 4 khóa`, thoát 0, không để lại tệp nào (`git status` sạch). Thêm một phép thử đột biến (mục 2, thẻ 01).

## 0. Kết luận

**DUYỆT CÓ ĐIỀU KIỆN.** Gộp được. 0 Blocker, 0 Major, 1 Minor, 2 Suggestion. Không ESC.

Điều kiện không chặn gộp: thẻ 01 (Minor) sửa trong v1.0.5 nếu kịp, không thì v1.0.6. Trước khi sửa, việc tắt nửa HTML của bộ so vẫn cần một PR sửa `build_print_sheets.py` **và** xóa các tệp `to-4-*.html` cùng lúc. Người review UXD sẽ thấy điều đó, nên rủi ro thấp.

## 1. Đối chiếu

| Điều SEC cần | PR | Kết quả |
|---|---|---|
| So từng đoạn, bỏ `<span class="nb">`, lệch thì dừng (FB-R4-SEC-UXD-IDS2-01) | Bỏ thẻ HTML, giải mã thực thể, gộp khoảng trắng ASCII, NFC. Giữ U+00A0. `gw.notice_body` tách 2 đoạn ở cuối câu, ghép lại phải bằng đúng chữ trang | Đạt. Đúng cách SEC ghi ở `SEC-on-v104-id-sheet-v2.md` mục 0 |
| Chữ khách thật sự đọc, không chỉ chữ trong JSON | Luật `legalLocale`: thiếu khóa pháp lý hoặc RU còn chưa duyệt thì trang hiện EN, và tờ VI/RU bị báo LỆCH NGÔN NGỮ | Đạt. Đây là điều quan trọng nhất về pháp lý: tờ không được hứa bằng một ngôn ngữ mà trang không hiện |
| Version ở chân tờ khớp version có chữ trên trang | `· vN` phải là một mục `NOTICE_TEXT_VERSIONS` có đuôi `-vN` | Đạt. Bằng chứng đồng ý ghi version của trang, nên đây là chỗ nối tờ với bằng chứng |
| So thứ được in | So cả Markdown và mọi `docs/print/to-4-*.html`, kể cả bản thứ 2 của A4 cắt đôi; tệp lạ, tệp thiếu, chữ ngoài đoạn đều đỏ | Đạt, trừ thẻ 01 và 02 |
| Không tự chọn bên đúng | Log in chữ trang, chữ tờ, phần khác nhau; "UXD (chữ) + SEC (chữ pháp lý) quyết" | Đạt |
| Chạy an toàn trong CI | Chỉ thư viện chuẩn, `python3 -I`, chỉ đọc, `sys.dont_write_bytecode`. Không mạng, không `eval`, không subprocess. Không đọc biến môi trường, không bí mật. Job `build-test` có `permissions: contents: read`, checkout không giữ token | Đạt |
| CI gate | Hai bước trong `build-test`, `if: ${{ !cancelled() }}` (chạy cả khi bước trước đỏ), `timeout-minutes: 2`. Bước so giữ mã thoát (1 lệch, 2 không đọc được) qua `\|\| { rc=$?; …; exit $rc; }`. Nằm sau bước `gen_strings.py`, nên JSON được so là JSON đã khớp script | Đạt |
| CODEOWNERS | Thêm `check_print_notice.py` và test của nó cho SEC, có chú thích vì sao. `ci.yml` vẫn thuộc dòng `/.github/workflows/` | Đạt. Thiếu một nguồn mà bộ so tin: thẻ 01 |
| Đọc nguồn trang khách | Đọc `NOTICE_PARAGRAPHS`, `NOTICE_TEXT_VERSIONS`, `LEGAL_KEYS`, `RU_UNREVIEWED_LEGAL` bằng regex. Khai báo đổi dạng thì thoát 2 (đỏ), không lặng lẽ coi là rỗng; `NOTICE_PARAGRAPHS` rỗng hay có `...` thì cũng thoát 2 | Đạt. Đúng hướng "không đọc được thì đỏ" |

## 2. Thẻ

### FB-R5-SEC-OPS-165-01
- Mức độ: Minor
- Vị trí: `check_print_notice.py`, `notice_jobs()` và `html_copies()`; `.github/CODEOWNERS`.
- Vấn đề: bộ so lấy danh sách tờ HTML phải có từ `build_print_sheets.JOBS`. Tệp đó không thuộc SEC trong CODEOWNERS. SEC thử: bỏ các lần in Tờ 4 khỏi `JOBS` và để thư mục HTML trống thì `run()` trả **0 chỗ lệch, 2 tờ** (chỉ hai bản Markdown), CI xanh. Nửa so HTML, phần so "thứ được in ra giấy", tắt mà không ai thấy đỏ. Cùng kiểu: `notice_parts()` và `il()` cũng ở bộ dựng.
- Vì sao quan trọng: CODEOWNERS SEC ở bộ so nhằm đúng điều này ("một sửa đổi ở bộ so có thể để tờ ở quầy và bằng chứng đồng ý lệch nhau mà không ai thấy"). Nhưng chỗ quyết bộ so so cái gì lại nằm ở tệp không cần SEC duyệt.
- Đề xuất sửa (chọn một, OPS chọn):
  - (a, SEC nghiêng về cách này) trong `check_print_notice.py` ghi cứng tập tên tệp Tờ 4 mong đợi (hiện là 4 tệp: `to-4-your-id-details-a5`, `-a4`, `-a4-2-ban`, `-a4-ru`) và số tờ của mỗi tệp. `notice_jobs()` khác tập đó thì thoát 2 với câu "danh sách tờ Your ID details đổi: sửa cả check_print_notice.py (SEC duyệt)". Thêm một ca test: `JOBS` không còn Tờ 4 → thoát khác 0;
  - (b) tối thiểu: không có tệp HTML Tờ 4 nào để so (`from_html` rỗng) thì đỏ.
  Không cần thêm `build_print_sheets.py` vào CODEOWNERS SEC: tệp đó đổi thường vì dàn trang, và SEC không cần duyệt mọi lần đổi dàn trang.
- Trạng thái: Open

### FB-R5-SEC-OPS-165-02
- Mức độ: Suggestion
- Vị trí: `check_print_notice.py`, `_SheetHTML`.
- Vấn đề: bộ so đọc chữ trong thẻ, không đọc CSS. Một quy tắc CSS có `content: "…"` có chữ, hoặc `display:none` / `visibility:hidden` / `font-size:0` trên một `<span>` trong đoạn, làm chữ in ra khác chữ được so. Hôm nay mọi `content:` trong `to-4-*.html` là chuỗi rỗng (đường kẻ, chấm đầu dòng), nên không có lệch.
- Vì sao quan trọng: thấp. Muốn vậy phải sửa tay HTML hay bộ dựng, và UXD review. Ghi để bộ so đóng nốt lối này với giá rẻ.
- Đề xuất sửa: trong mỗi tệp `to-4-*.html`, đỏ khi có `content:` với chuỗi khác rỗng, hoặc có `display:none`, `visibility:hidden`, `font-size:0` trong khối CSS hay thuộc tính `style`/`hidden` trong một `section.notice`. Một ca test.
- Trạng thái: Open

### FB-R5-SEC-OPS-165-03
- Mức độ: Suggestion
- Vị trí: `check_print_notice.py`, docstring "Không so: … PDF".
- Vấn đề: tờ ở quầy được in từ PDF trong `docs/print/pdf/`. PDF dựng từ HTML bằng Chrome, nên HTML khớp thì PDF thường khớp. Nhưng PDF cũ có thể nằm lại sau khi HTML đã dựng lại.
- Đề xuất sửa: không cần so chữ PDF. Đủ là bộ dựng ghi SHA-256 của HTML nguồn vào metadata PDF (hoặc một tệp `.src-sha256` cạnh PDF), và bộ so đỏ khi PDF không trỏ đúng HTML hiện tại. Làm khi UXD đụng tới bộ dựng PDF lần sau, không cần riêng.
- Trạng thái: Open

## 3. Dòng decision-log (ORC chép)

`| 2026-11-07 | 5 | **SEC – review OPS PR #165 (V5-47, so chữ tờ Your ID details với trang khách) @ 38c9c398: DUYỆT CÓ ĐIỀU KIỆN, gộp được.** Luật so đúng SEC IDS2-01 (bỏ thẻ, NFC, gộp khoảng trắng ASCII, giữ U+00A0, notice_body 2 đoạn ở cuối câu), theo legalLocale (tờ VI/RU đỏ khi trang hiện EN), chân tờ vN phải có chữ trên trang; so cả Markdown và mọi to-4-*.html; chỉ đọc, stdlib, python3 -I, không bí mật; CI 2 bước !cancelled(), giữ mã thoát; CODEOWNERS SEC cho bộ so và test. SEC chạy: test 23/23, KHỚP 7 tờ. Minor 165-01: tắt được nửa so HTML bằng cách sửa JOBS của build_print_sheets.py (không thuộc SEC) – ghi cứng tập tệp Tờ 4 trong bộ so, v1.0.5 nếu kịp. Suggestion 165-02 (CSS content/ẩn chữ), 165-03 (PDF trỏ HTML nguồn). Không ESC | SEC | rounds/round-05/reviews/SEC-on-ops-pr-165.md |`

## 4. Điểm làm tốt

- So theo chữ khách thật sự thấy (luật ngôn ngữ pháp lý), không chỉ theo JSON. Một tờ RU hứa bằng tiếng Nga trong khi trang hiện tiếng Anh sẽ bị bắt.
- Log lệch hiện ký tự không thấy được dạng `<U+00A0>`: người sửa thấy ngay chỗ khác, và SEC không phải đoán.
- Nguồn đổi dạng là thoát 2 (đỏ), không coi là rỗng. Bộ so không xanh chỉ vì không đọc được gì, trừ chỗ ở thẻ 01.
