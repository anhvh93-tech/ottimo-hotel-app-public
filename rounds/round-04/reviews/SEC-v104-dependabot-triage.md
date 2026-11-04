# SEC – phân loại cảnh báo Dependabot trước khi cắt v1.0.4

- Người làm: SEC | Round 4, đợt v1.0.4 | 05/11/2026 | việc kéo lên trước mốc cắt 06/11 18:00.
- Nguồn:
  - `gh api repos/anhvh93-tech/ottimo-hotel-app-public/dependabot/alerts --paginate`, đọc cả cảnh báo đang mở lẫn đã đóng;
  - `product/pnpm-lock.yaml` trên `origin/main` `a92f55a6` (mục `importers`);
  - mã đọc trên cùng commit.
  - Máy không có `node_modules`, nên SEC không chạy `pnpm why`. Phạm vi gói được xác định từ mục `importers` của lockfile và từ `Dockerfile.api` (`pnpm --filter=@ottimo/api deploy --prod`).
- Đối chiếu với lần phân loại trước: `rounds/round-03/reviews/SEC-sprint1.md` mục 3.5 (26/10).
- Giới hạn: chỉ đọc. Không đóng cảnh báo nào trên GitHub, không sửa mã, không commit, không push.

## 0. Kết luận

**Không có cảnh báo nào loại (a). v1.0.4 không cần nâng gói nào.**

- **Đang mở 7 cảnh báo, không phải 8.** Cả 7 đều mức Medium, không có High hay Critical. Thực chất chỉ có **4 advisory**:
  - `nodemailer`: 3 advisory, mỗi cái báo 2 lần, một lần theo `integrations/package.json` (trực tiếp) và một lần theo `pnpm-lock.yaml`;
  - `react-router`: 1 advisory.
  - Các cảnh báo #1, #2 và #7–#14 đã đóng từ R3, đúng như mục 3.5.
- **`nodemailer`, 6 cảnh báo: (b) v1.0.5.** Gói có trong image api/worker, và mã có lỗi nằm trên đường gửi thư thật. Nhưng cả 3 mẫu tấn công cần các ký tự `"`, `(`/`)`, `;` hoặc `>` trong địa chỉ, mà luật địa chỉ `isEmailAddress` không cho lọt ký tự nào trong số đó. Bản sửa 10.1.4 cũng không phải bản vá nhỏ, vì nhánh 10.1 đổi cách chạy phiên SMTP.
- **`react-router`, 1 cảnh báo: (c) không khai thác được.** Nguồn đường dẫn duy nhất từ bên ngoài đã đi qua `safeInternalPath`, có test cho đúng các mẫu `\` của advisory. Bản sửa chỉ có ở 7.18, tức phải đổi phiên bản lớn, giữ kế hoạch v1.1 như R3.
- CI không bị chặn: bước `pnpm audit --audit-level=high` không xét mức Medium, và `pnpm.auditConfig.ignoreCves` đang rỗng.

## 1. Bảng phân loại

| Cảnh báo | Gói (bản đang dùng → bản sửa) | Advisory | Manifest, phạm vi | Có trong image runtime? | Đường tới mã lỗi | Loại | Lý do |
|---|---|---|---|---|---|---|---|
| #4, #15 | `nodemailer` 10.0.16 → 10.1.4 | GHSA-85x2-q946-cp5h: `>` trong phần local **có ngoặc kép** làm angle-addr kết thúc sớm | `integrations/package.json` (trực tiếp, `dependencies`, ghim đúng bản) và `pnpm-lock.yaml` | **Có:** image **api/worker** (`Dockerfile.api`: `pnpm --filter=@ottimo/api deploy --prod`; `@ottimo/api` phụ thuộc `@ottimo/integrations`). Không có trong `web` | `notification/smtp.ts` `send()` → `sendMail({ to: msg.to })`. `to` là chuỗi, nên nodemailer chạy `addressparser` | **(b) v1.0.5** | Cần `"` trong địa chỉ. Ký tự này bị chặn (mục 2.1) |
| #5, #16 | như trên | GHSA-m943-m63m-w62w: `;` trong chuỗi có ngoặc kép hoặc chú thích làm nhóm địa chỉ kết thúc sớm | như trên | như trên | như trên | **(b) v1.0.5** | Cần `;` cùng với `"` hoặc `()`. Cả ba đều bị chặn |
| #6, #17 | như trên | GHSA-8c8m-p3m8-cjg8: chú thích lồng nhau kết thúc sớm, nhả phần còn lại thành người nhận | như trên | như trên | như trên | **(b) v1.0.5** | Cần `(` `)`. Ở R3 hai ký tự này còn qua regex cũ của adapter. Từ v1.0.4, adapter dùng luật chỉ-cho-phép, nên bị chặn (mục 2.1) |
| #3 | `react-router` 6.30.6 (qua `react-router-dom` ^6.30.1) → 7.18.0 | GHSA-wrjc-x8rr-h8h6 / CVE-2026-53669: open redirect bằng `\` trong `<Link>` và `useNavigate` (cách vòng qua CVE-2025-68470) | `pnpm-lock.yaml`, gián tiếp; chỉ importer `apps/admin-web` | **Có:** bundle tĩnh của Desk trong image **web**, chạy trên trình duyệt nhân viên. Không có trong api/worker | Chỉ `LoginPage` đi theo `location.state.from`, và luôn qua `safeInternalPath` trước. Các đích khác là chuỗi cố định hoặc ID do máy chủ trả (mục 2.2) | **(c) không áp dụng** | Đã chặn trong app từ R3-Q31. Không có bản 6.x nào sửa, chỉ có 7.18 (đổi bản lớn) → nâng 7.x ở v1.1 như R3. Giữ cảnh báo mở để theo dõi việc đó, không đóng |

## 2. Vì sao không khai thác được

### 2.1 `nodemailer` (`addressparser`)

Chỉ có ba trường địa chỉ thư đi qua `addressparser`, và cả ba đều đã được kiểm:
- **`to`**: `send()` ném `INVALID_REQUEST` khi `!isEmailAddress(msg.to)`. Việc này xảy ra **trước** `sendMail`, ở mọi thư.
  - `isEmailAddress` (`notification/email-address.ts`) chỉ cho phép:
    - ASCII in được;
    - đúng một `@`;
    - phần local `[a-z0-9._%+-]{1,64}`;
    - tên miền gồm các nhãn `[a-z0-9-]`, nhãn cuối chỉ có chữ;
    - không có khoảng trắng ở hai đầu.
  - Vì vậy `"`, `(`, `)`, `;`, `<`, `>`, `,`, khoảng trắng và CR/LF đều không vào được phong bì thư.
- **Dữ liệu đã lưu cũng theo đúng luật này.** API chuẩn hóa địa chỉ bằng `normalizeEmailAddress` từ v1.0.3. `ops-check email_ascii` cho kết quả 0 trên staging và production ngày 04/11 (K9). Người nhận là email nhân viên do OWN/MGR nhập.
- **`from`** là object `{ name, address }`, lấy từ cấu hình máy chủ (`EMAIL_FROM` theo `isEmailAddress`; `fromName` mặc định "OTTIMO"). Người dùng không chạm được trường này.
- Không có `cc`, `bcc`, `replyTo`. Header thêm chỉ là hằng số. Lệnh `infra/server/mail-test.mjs` cũng kiểm `isEmailAddress` cho `to`.
- Repo không có chỗ nào import `addressparser` hay `mailparser` trực tiếp.
- **Production (v1.0.3):** adapter còn dùng regex cũ, nên `()` qua được ở lớp adapter. Nhưng địa chỉ đi tới adapter đều lấy từ DB, đã chuẩn hóa, và `email_ascii` = 0. Gửi được địa chỉ có `()` thì phải có quyền OWN/MGR **và** lách được bước chuẩn hóa của API. SEC không thấy đường nào làm vậy. v1.0.4 đóng nốt lớp adapter.

**Vì sao không nâng ở v1.0.4, dù 10.1.4 cùng bản lớn 10:**
- 10.1.0 không chỉ sửa lỗi. Bản này đổi cách chạy phiên SMTP:
  - "harden message streams, SMTP connections and the connection pool";
  - kết thúc phiên khi gặp mọi phản hồi 421;
  - "drive the envelope through one step";
  - tính thời gian chờ lời chào vào `connectionTimeout`;
  - tắt Nagle.
- Đường thư này là thư bảo mật cho nhân viên (`mfa_*`, `receiving_account_changed`). Muốn chắc nó còn chạy thì phải thử qua relay thật trên staging, không chỉ chạy fake SMTP. Không đủ thời gian trước 18:00 ngày 06/11, và rủi ro lớn hơn lợi ích, vì lỗi không khai thác được.
- PR Dependabot #9 và #11 (lên 10.1.4) đỏ từ 26/10 và chưa ai chạy lại.

### 2.2 `react-router` (GHSA-wrjc-x8rr-h8h6)

- Advisory chỉ nguy hiểm khi **đường dẫn do kẻ tấn công đưa vào** được truyền cho `<Link to>` hay `navigate()`.
- Ở `origin/main`, SEC grep `admin-web/src`, bỏ thư mục test:
  - nguồn duy nhất là `afterLoginPath(location.state.from)` trong `LoginPage.tsx`. Hàm này gọi `safeInternalPath` trước;
  - `safeInternalPath` từ chối:
    - đường dẫn không bắt đầu bằng `/`, hoặc bắt đầu bằng `//`;
    - `\` (thô và `%5C`), ký tự điều khiển (thô và mã hóa);
    - dạng giải mã ra `//`;
    - đường dẫn ra khác origin.

    Sau đó còn chỉ cho đi tới mục menu mà vai đó mở được.
  - `r3-s1-fea.test.tsx` có bộ `SEC_VECTORS`/`MORE`, gồm đúng các mẫu `\` của advisory (`/\evil`, `/%5Cevil`, `/overview\@evil`…).
- Các đích còn lại đều là chuỗi cố định (`NAV`, `homePath`, `/registration/${id}`), hoặc ID do máy chủ trả (`attention.ts`: `/reservations/${uuid}`). Không đích nào lấy từ query hay hash.
- Từ R3 tới nay không có đường nào mới lấy đường dẫn từ bên ngoài.

## 3. Việc cho v1.0.5 (OPS/INT làm một PR riêng; SEC review)

1. `product/integrations/package.json`: `"nodemailer": "10.0.16"` → **bản 10.x mới nhất lúc làm, ghim đúng bản**.
   - Lúc viết, bản mới nhất là `10.3.1`. Tối thiểu phải `10.1.4`; nên ≥ `10.1.7`, vì 10.1.5–10.1.6 sửa thêm `addressparser`.
   - Không thêm `pnpm.overrides`: chỉ một importer dùng gói này.
2. Sinh lại `product/pnpm-lock.yaml` bằng `pnpm install`, chỉ cho gói này.
3. Kiểm:
   - `integrations` `smtp.test.ts` (fake SMTP, các luật TLS);
   - `infra/server/test/mail-test-send.test.sh`;
   - `mapSmtpError` vẫn không để lộ chữ của nhà cung cấp. 10.2.0 thêm `err.permanent` và `info.serverMessageId`; adapter không được log hai trường này nếu chúng chứa địa chỉ;
   - `mail-test` qua relay trên staging trước khi phát hành.
4. Đóng PR Dependabot #9 và #11 (chúng ghim 10.1.4), thay bằng PR của đội. 6 cảnh báo sẽ tự đóng khi lockfile trên `main` có bản mới.
5. SEC đổi hạn đã ghi ở R3 (mục 3.5: "≤ 2 tuần sau phát hành", tức 13/11 tính từ `v1.0.0` 30/10) thành **v1.0.5**. Lý do: lớp adapter của v1.0.4 đã chặn nốt mẫu `()`. Nếu v1.0.5 trễ quá 20/11, ORC báo SEC để xem lại.

Ghi chú ngoài phạm vi: các PR Dependabot không gắn với cảnh báo bảo mật (#36 nhóm minor-and-patch, #27 image `node`, #28 image `postgres`, #1, #2, #5, #6) không được phân loại ở đây. Bản cập nhật digest image gốc (#27, #28) có thể kèm bản vá hệ điều hành. OPS nên xem ở v1.0.5.

## 4. Dòng decision-log đề xuất (ORC ghi; SEC không sửa `decision-log.md` ở lượt này)

```
| 2026-11-05 | 4 | **SEC – phân loại Dependabot trước cắt v1.0.4** (`rounds/round-04/reviews/SEC-v104-dependabot-triage.md`): 7 cảnh báo mở (không phải 8), đều Medium, 4 advisory. **(a) v1.0.4: không có – không nâng gói nào.** `nodemailer` 10.0.16 (#4–#6, #15–#17; image api/worker) → **(b) v1.0.5**: cả 3 mẫu `addressparser` cần `"`/`()`/`;`/`>`, mà `isEmailAddress` (adapter từ v1.0.4, API từ v1.0.3, `email_ascii` = 0 ngày 04/11) không cho qua; 10.1.x đổi cách chạy phiên SMTP, phải thử relay thật. v1.0.5: ghim bản 10.x mới nhất (≥ 10.1.7, hiện 10.3.1) ở `integrations/package.json`, sinh lại lockfile, smtp test + `mail-test` staging, đóng PR #9/#11. Hạn R3 "≤ 2 tuần sau v1.0" đổi thành v1.0.5 (xem lại nếu quá 20/11). `react-router` 6.30.6 (#3; bundle web) → **(c)**: chỉ `location.state.from` qua `safeInternalPath` (có test mẫu `\`); bản sửa chỉ có ở 7.18 → v1.1 như R3, giữ cảnh báo mở để theo dõi | SEC | Review |
```
