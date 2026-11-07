# DOM review – FE-A2 PR #159: tên người chốt ở Nhật ký tiền (DOM 155-04)

- Người review: DOM | Round 5 (v1.0.5) – Review | Ngày: 07/11/2026
- Đối tượng: PR #159, commit **`f810e77b`** (head PR hiện nay):
  - `MoneyPage.tsx`, nhánh `reservation.closer_changed`;
  - danh sách người `closer-candidates`, nay lấy loại `all`;
  - mock `stay.ts`;
  - test `r5-mlog-closer-names-fea.test.tsx`.
  DOM chỉ xét phần thẻ FB-R5-DOM-FE-155-04, không xét ARC-FE-145-04/05, ARC PR150-01.
- Đối chiếu: DOM `DOM-on-ops-pr-155-k14.md` thẻ 155-04, mục 1.4; chuỗi `mlog.a_closer_changed`, `mlog.who_unlisted`, `common.loading` (`strings-vi.json`, `strings-en.json`).
- DOM đọc mã và test bằng `git show`, không chạy. Tên trong mock và test (Sơn, Mai, Lan, Quân) là dữ liệu giả. Không dữ liệu khách, không số hoa hồng.

## 0. Kết luận

**DUYỆT.** Dòng "Đổi người chốt" nay cho chủ đầu tư và quầy biết **ai đổi, lúc nào, từ ai sang ai**. Ba cách hiện khi không có tên chấp nhận được tới khi có chữ của UXD.

Đề xuất ORC đóng FB-R5-DOM-FE-155-04 khi #159 gộp. Hai thẻ Suggestion, không chặn gộp. Không ESC.

## 1. Đối chiếu

**Một dòng Nhật ký tiền nay có:**

| Cột | Lấy từ | Trả lời câu |
|---|---|---|
| Lúc | `occurredAt` | Lúc nào |
| Người làm | `actorName` (tên · vai, như mọi dòng) | **Ai đổi** |
| Việc | `Đổi người chốt: {from} → {to}`; `from`, `to` = tên hiển thị tìm theo `before.closerUserId`, `after.closerUserId` trong danh sách người của cơ sở | **Từ ai sang ai** |
| Mã đơn | `entityCode` | Đơn nào |

Đúng nghiệp vụ:
- **Danh sách lấy loại `all`, có cả CTV:** đúng. Ở OTTIMO, đơn kênh CTV có người chốt là CTV (A-06), nên lần đổi giữa sale và CTV là ca hay gặp. Mock Sơn (sale) → Mai (CTV) phủ đúng ca này.
- **Bộ lọc "Người làm" chỉ có nhân viên:** đúng. CTV không bấm trên Desk ở các việc của Nhật ký tiền. Test kiểm Mai không có trong bộ lọc.
- **FD/FDL cũng thấy tên** trên các dòng họ được xem: đúng. FD/FDL đọc được danh sách này từ trước, lúc tạo đơn ở `BookingDialog`. Không lộ thêm gì.
- **Máy chủ không đổi:** audit vẫn chỉ giữ id (SEC 1H-01). FE đổi id ra tên lúc hiện.

**Khi không có tên:**

| Ca | Hiện | DOM |
|---|---|---|
| Id không có trong danh sách (tài khoản đã khóa, người đã nghỉ) | `mlog.who_unlisted` – "Người không còn trong danh sách" / "Someone not on the list" | Chấp nhận tới khi UXD có câu cho tài khoản đã khóa. Nghĩa đúng: người đó không còn hoạt động. Muốn biết tên người đã nghỉ trong dữ liệu cũ thì chủ đầu tư dùng K14-L (DOM 155-01, có ghi "(đã thu hồi)") |
| Danh sách đang tải | `common.loading` | Chấp nhận. Test kiểm danh sách lỗi thì không kẹt mãi ở "Đang tải…" |
| Không có id: trước đó chưa có người chốt (ghi lần đầu) | "— → Mai" | Chấp nhận. "—" là "không có", đọc được ngay |
| Không có id: dòng ghi trước #154 (`before`/`after` rỗng) | "— → —" | Chấp nhận tạm. Một lần đổi người chốt luôn có người mới, nên "— → —" chỉ có thể là dòng cũ không ghi tên. Nhưng chủ đầu tư chưa biết điều này. Tới khi UXD có câu "trước v1.0.5, không ghi tên", sổ tay nói một dòng (thẻ 159-02) |
| Danh sách **không tải được** | Mọi id hiện "Người không còn trong danh sách" (test thứ ba ghim cách này) | Nên đổi (thẻ 159-01). Câu này làm người đọc hiểu nhầm là người chốt đã nghỉ, trong khi chỉ là mạng lỗi |

## 2. Thẻ feedback

### FB-R5-DOM-FE-159-01
- Mức độ: Suggestion (không chặn gộp; nên làm cùng PR vì rẻ)
- Người sửa: FE-A2; UXD xem chữ
- Vị trí: `MoneyPage.tsx`, hàm `who` trong `AuditAction`; test "the list cannot be read …"
- Vấn đề: khi `closer-candidates` lỗi, `names.byId` rỗng và `loading` = false, nên mọi id hiện `mlog.who_unlisted`.
- Vì sao quan trọng: chủ đầu tư rà Nhật ký tiền thấy "Người không còn trong danh sách" ở cả lần đổi người chốt của sale đang làm. Họ dễ nghĩ sale đó đã bị khóa, hoặc dữ liệu sai.
- Đề xuất sửa: tách ba trạng thái của danh sách.
  - Đã tải xong mà không thấy id → `mlog.who_unlisted` (như bây giờ).
  - Đang tải → `common.loading` (như bây giờ).
  - Lỗi → chữ có sẵn `common.error_generic_title` ("Chưa tải được dữ liệu" / chữ EN tương ứng), hoặc chữ UXD chọn.
  - Sửa test thứ ba theo.
- Trạng thái: Open

### FB-R5-DOM-BA-159-02
- Mức độ: Suggestion (cùng tag có #159; bỏ khi UXD có câu riêng)
- Người sửa: BA
- Vị trí: `01-chu-dau-tu-quan-ly.md` mục 8.1 (Nhật ký thao tác tiền)
- Vấn đề: "— → —" ở các lần đổi người chốt trước v1.0.5 chưa có lời giải thích.
- Vì sao quan trọng: chủ đầu tư hỏi đội vì sao lần đổi không có tên, hoặc hiểu là đơn không có người chốt.
- Đề xuất sửa: thêm một dòng: "Dòng **Đổi người chốt**: '—' bên trái là trước đó chưa có người chốt. '— → —' là lần đổi trước v1.0.5, Desk không ghi tên. Cần biết tên thì báo đội chạy danh sách K14." Tài khoản đã khóa hiện "Người không còn trong danh sách".
- Trạng thái: Open

## 3. Giả định DOM dùng

1. `closer-candidates` loại `all` trả người đang hoạt động của cơ sở, có cả nhân viên lẫn CTV, như `BookingDialog` dùng lúc tạo đơn. DOM không đọc lại mã máy chủ của danh sách này.
2. UXD đang viết hai câu: dòng trước v1.0.5 không ghi tên, và tài khoản đã khóa (theo ORC). Khi có thì thẻ 159-02 bỏ.
3. Đây là tính đúng nghiệp vụ của câu hiện trên Desk, không có chính sách mới, nên không ESC.

## 4. Dòng đề xuất ghi `decision-log.md` (ORC ghi)

`| 2026-11-07 | 5 | **DOM – review FE-A2 PR #159 @ f810e77b, phần DOM 155-04 (tên người chốt ở Nhật ký tiền): DUYỆT.** Dòng "Đổi người chốt" đọc closerUserId, hiện tên từ closer-candidates loại all (có CTV, vì CTV hay là người chốt); cột Người làm cho biết ai đổi, nên dòng nói đủ ai đổi, lúc nào, từ ai sang ai; bộ lọc Người làm chỉ nhân viên; máy chủ vẫn chỉ ghi id. Cách hiện khi không có tên chấp nhận tới khi UXD có câu: id ngoài danh sách → who_unlisted; đang tải → common.loading; không id → "—" (ghi lần đầu "— → tên"; dòng trước #154 "— → —"). Đóng 155-04 khi gộp. Thẻ: 159-01 Suggestion FE-A2 – danh sách lỗi thì hiện common.error_generic_title, không hiện "Người không còn trong danh sách"; 159-02 Suggestion BA – một dòng sổ tay giải thích "—" tới khi có câu UXD. Không ESC | DOM | rounds/round-05/reviews/DOM-on-fe-a2-pr-159.md |`
