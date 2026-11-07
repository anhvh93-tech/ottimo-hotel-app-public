# SEC – Review PR #167 (FE-B, font chữ Nga trên trang khách dưới CSP production)

Round 5 · v1.0.5 · bước **Review** · SEC · 07/11/2026

## Đối tượng

| PR | Nhánh | HEAD | Phần đọc | CI lúc đọc |
|---|---|---|---|---|
| #167 | `r5-feb-g2-guest` → `main` | **`838be376`** | 18 tệp. Phần SEC đọc kỹ: `guest-web/vite.config.ts` (`assetsInlineLimit` dạng hàm), `bundle.test.ts` (ca font mới), E2E mới `v5-24-guest-ru-font.r5.spec.ts`, `guest-web.h18.spec.ts` (TC-L7-053), `known-bugs.ts`, `GuestShell.tsx`, `HomePage.tsx`, `quote-copy.ts` (sinh lại), các test Vitest mới, báo cáo `v5-24-g2-guest-feb.md`. Tệp chữ chỉ đọc lướt (CPY duyệt chữ) | Xanh: API contract (RBAC `--strict`), Redocly, gitleaks, confidential paths, shellcheck, landing, no test endpoints. **"format · lint · audit · test · build" đang chạy**, job E2E chưa hiện. GitHub báo PR **đang xung đột** với `main` |

Đối chiếu:
- `infra/caddy/Caddyfile.prod`: snippet `app`, dòng `header ?Content-Security-Policy`, `handle /assets/*`, dòng `import app guest-web no-referrer no-store 'none'`;
- `infra/caddy/expected-headers.sh` (ghim cùng CSP);
- mã nguồn Vite 7.3.7 (bản trong lockfile), hàm `shouldInline`;
- `.github/workflows/ci.yml` (job E2E đặt `E2E_UI=1`) và project `desk-chromium` của Playwright (`testMatch` gồm `ui/`).

Cách kiểm:
- Đọc `gh pr diff 167` và tệp ở `refs/pull/167/head` (ref tạm).
- Worktree tạm ở `838be376` trong scratchpad, `pnpm install --offline`. Build guest-web **hai lần**: một lần với `vite.config.ts` của PR, một lần với `vite.config.ts` của merge-base. So hai bản build (mục 1, điểm 2).
- Probe Playwright cục bộ (Chromium của repo, máy chủ tĩnh loopback, không gọi API). Probe dùng đúng cách của E2E: cùng regex đọc CSP từ `Caddyfile.prod`, cùng `page.route` + `route.fulfill` vào phản hồi document `/g/…`, cùng `document.fonts.load` cho `AЖѢạ` ở 400 và 500. Chạy trên cả hai bản build, có route và không route (mục 3).
- Đã xóa worktree, hai bản build và ref tạm khi xong. Script probe chỉ ở scratchpad, không commit.

Tệp này không có bí mật, mật khẩu, địa chỉ IP, token link khách, tỷ lệ hay số tiền hoa hồng, tên người hay dữ liệu khách.

## Kết luận: **DUYỆT** PR #167 @ `838be376`

Điều kiện gộp, không phải thẻ:
- FE-B giải xung đột với `main`, rồi CI xanh trên đúng SHA mới.
- Báo cáo E2E của SHA đó có ca **V5-24-1 chạy và đạt**, không bị skip. Guard "UI cases ran" của CI chỉ kiểm có ca UI chạy, không kiểm riêng ca này.
- Nếu lần gộp `main` đụng `vite.config.ts`, `bundle.test.ts`, tệp E2E mới hoặc `infra/caddy/`, gửi SEC xem lại. Đụng chỗ khác thì kết luận này giữ nguyên.

0 Blocker · 0 Major · 0 Minor · 3 Suggestion. Không thẻ nào chặn gộp. Không ESC.

- **Cách sửa đúng hướng bảo mật.** Font thành tệp cùng origin dưới `/assets/`; CSP giữ `font-src 'self'`, không thêm `data:`.
- **Chỉ font đổi.** Hai bản build khác nhau đúng 6 tệp font. JS giống từng byte. CSS giống nhau ngoài `url()`.
- **E2E có áp CSP production.** Trên bản build cũ, cơ chế của E2E bắt đúng 6 vi phạm, nên ca sẽ đỏ. Nhưng nếu route không khớp, ca vẫn xanh mà không kiểm gì (thẻ 167-01). Vi phạm khác `font-src` chỉ được ghi chú lại (thẻ 167-02).
- **Không dữ liệu khách trong test.**
- admin-web và PWA nhân viên còn cùng lỗi. FE-B đã chuyển FE-A và MOB; SEC ghi ràng buộc (thẻ 167-03).

## 1. Điểm ORC hỏi

| # | Điểm | Kết quả | Căn cứ |
|---|---|---|---|
| 1 | Không đổi CSP, không đổi Caddy | **Đạt** | PR không đụng `infra/`. `Caddyfile.prod`:<br>– dòng CSP duy nhất vẫn `font-src 'self'`, không có `data:`;<br>– guest-web vẫn `worker-src 'none'`;<br>– `expected-headers.sh` vẫn ghim đúng chuỗi đó.<br>`/assets/*` đi qua `file_server`, có `Cache-Control … immutable`. Font cùng origin, nên `Cross-Origin-Resource-Policy: same-origin` không cản. `nosniff` cũng không cản, vì `file_server` trả `font/woff2`, `font/woff` theo đuôi tệp |
| 2 | Không gì khác thôi nhúng theo cách ảnh hưởng CSP | **Đạt** | Vite 7.3.7, `shouldInline`: nếu `assetsInlineLimit` là hàm và trả `undefined`, Vite dùng lại mặc định 4096 byte. Hàm của PR chỉ trả `false` cho `.woff`/`.woff2` (khớp cả khi có `?query`), còn lại trả `undefined`. So hai bản build:<br>– bản base có đúng 6 `data:` (4 `data:font/woff2`, 2 `data:font/woff`) và **không có `data:` nào khác**, trong cả CSS lẫn JS;<br>– bản PR: **0** `data:`;<br>– `/assets/` của bản PR thêm đúng 6 tệp: `jetbrains-mono-cyrillic-ext` 400/500 × woff2 + woff, và `jetbrains-mono-vietnamese` 400/500 woff2;<br>– JS giống từng byte; CSS giống nhau khi bỏ phần trong `url()`; `index.html` chỉ khác tên băm.<br>Chỉ font đổi từ nhúng sang tệp, nên `img-src … data:` và mọi chỉ thị khác không bị ảnh hưởng |
| 3 | SRI | **Không áp dụng, không đổi** | guest-web không dùng SRI. `index.html` của cả hai bản build không có `integrity`; Vite không sinh SRI; script module chỉ có `crossorigin`. Font tải từ CSS không mang `integrity`. 6 tệp mới có tên băm và nằm cùng origin. `script-src 'self'` và `style-src 'self'` không đổi |
| 4 | E2E có thật sự áp CSP production | **Đạt, có giới hạn** | – CSP lấy từ `Caddyfile.prod` bằng regex. `{args[3]}` được thay bằng `'none'`, như dòng `import app guest-web …`. Ca kiểm chuỗi có `font-src 'self';` và không có `data:` trong `font-src`. Ai sửa Caddy thì ca đọc bản mới.<br>– Ca áp CSP bằng `route.fulfill` cho phản hồi document `/g/…`. Chromium thực thi header của phản hồi này (`bypassCSP` mặc định tắt).<br>– Probe SEC, bản base với đúng cơ chế đó: **6** vi phạm `font-src`, 2 mặt JetBrains Mono `error`, `check('Ѣ')` = false. Vậy ca sẽ đỏ trên bản chưa sửa. Bản PR: 0 vi phạm, 0 mặt lỗi, `check` = true.<br>– **Giới hạn 1:** bỏ route, hoặc route không khớp đường dẫn, thì bản base cũng cho 0 vi phạm, 0 mặt lỗi, `check` = true. Khi đó ca xanh mà không kiểm gì. Trong ca không có gì chứng minh CSP đã được áp (thẻ 167-01).<br>– **Giới hạn 2:** vi phạm ở chỉ thị khác `font-src` chỉ ghi vào annotation, không làm ca đỏ (thẻ 167-02).<br>– FE-B chưa chạy ca này trên máy (không có stack); lần chạy đầu là ở CI. Vì vậy có điều kiện gộp thứ hai ở trên |
| 5 | Không dữ liệu khách trong test mới | **Đạt** | – E2E: `namedGuest` sinh tên ngẫu nhiên dạng "Nguyen Thi X…", số điện thoại `fakeMobile()`, email `@example.test`; `bookFree` tạo đơn trên stack CI; link khách thuộc đơn giả đó.<br>– Vitest: `MOCK_TOKENS` của MSW.<br>– Không ảnh, không IP.<br>– Vi phạm chỉ ghi `blockedURI` cắt 40 ký tự; console chỉ ghi dòng CSP, cắt 160 ký tự. Trên trang này, không vi phạm nào mang URL `/g/<token>` |
| 6 | Phần còn lại của PR | **Không có vấn đề bảo mật** | – `GuestShell.tsx`, `HomePage.tsx`: chỉ đổi khóa chữ (`gw.lang_auto_sr`). Câu mới không nói ngôn ngữ lấy từ đâu (hồ sơ hay trình duyệt), nên người cầm link không biết thêm gì về hồ sơ khách.<br>– `quote-copy.ts` (sinh lại): chỉ đổi chữ, giữ nguyên 11 chỗ thay `{code}`…`{expires}`.<br>– `known-bugs.ts` bỏ BUG-R2-218. TC-L7-053 bỏ `knownBug` và kiểm câu mới cùng mô tả của ô chọn ngôn ngữ. Hợp lý |

Về ghi chú của FE-B (BUG-R4-017 mô tả quá mức): probe SEC trên bản base khớp. Chỉ 2 mặt lỗi hẳn, là Cyrillic-ext 400 và 500. Chữ thuộc Cyrillic-ext như "Ѣ" rơi về font dự phòng. Mặt Vietnamese woff2 bị chặn nhưng trình duyệt chuyển sang bản `.woff` là tệp. 6 lỗi console = 4 tệp Cyrillic-ext + 2 tệp Vietnamese woff2.

## 2. Ngoài phạm vi PR: admin-web và PWA nhân viên

- admin-web và mobile cùng nạp `@ottimo/ui/styles.css` (chung `@fontsource`). Cả hai không đặt `assetsInlineLimit`.
- Bản build cục bộ ngày 20/10 của cả hai có cùng 6 font nhúng (4 `data:font/woff2`, 2 `data:font/woff`).
- `Caddyfile.prod` dùng cùng snippet CSP (`font-src 'self'`) cho Desk và PWA. Vì vậy Desk và PWA chắc cũng có 6 lỗi console mỗi lần tải. Mức ảnh hưởng thấp: nhân viên dùng tiếng Việt, và mặt Vietnamese đã có `.woff` dự phòng.
- FE-B đã chuyển việc này cho FE-A và MOB (copy-v1.0.5 mục 5.2 ý 2, 4). SEC ghi ràng buộc ở thẻ 167-03.

## 3. Probe của SEC

Chromium của repo, máy chủ tĩnh loopback phục vụ thư mục build, route + CSP chép đúng E2E. Tệp probe không commit.

| # | Bản build | Route CSP | Vi phạm `font-src` | Mặt JetBrains Mono `error` | `check('Ѣ')` | Ý nghĩa |
|---|---|---|---|---|---|---|
| P1 | base (merge-base) | có | **6** | 2 | false | Cơ chế của E2E bắt được lỗi: ca sẽ đỏ |
| P2 | PR `838be376` | có | **0** | 0 | true | Bản sửa đạt dưới CSP production |
| P3 | base | không | 0 | 0 | true | Không có CSP thì bản lỗi vẫn "đạt", nên ca phụ thuộc hoàn toàn vào route |
| P4 | base | route khớp sai đường dẫn | 0 | 0 | true | Như P3, không có dấu hiệu gì (thẻ 167-01) |
| P5 | PR, thêm font mồi `data:` | có | **1** (đúng font mồi) | 0 | true | Font mồi chứng minh CSP đang được thực thi |
| P6 | PR, thêm font mồi `data:` | không | 0 | 0 | true | Không có CSP thì font mồi không bị chặn. Header CSP trên phản hồi `page.goto`: có ở P5, không ở P6 |

## 4. Thẻ

### FB-R5-SEC-FEB-167-01
- Mức độ: Suggestion
- Người nhận: FE-B, QA biết
- Vị trí: `product/tests/e2e/ui/v5-24-guest-ru-font.r5.spec.ts`, ca V5-24-1, đoạn `page.route(…)` và `page.goto(link.url)`
- Vấn đề:
  - Ca chỉ chứng minh "0 vi phạm" chứ không chứng minh "CSP đã được áp".
  - Route chỉ khớp khi origin của link khách trùng origin trang và đường dẫn bắt đầu bằng `/g/`. Nếu sau này link khách đổi dạng (đường dẫn, origin, chuyển hướng), route không chạy.
  - Probe P3, P4: khi đó bản build còn lỗi vẫn cho 0 vi phạm, 0 mặt lỗi, `check` = true, và ca xanh.
- Vì sao quan trọng:
  - Đây là ca CI duy nhất giữ luật "font tự host không bị CSP chặn". Stack CI dùng `Caddyfile.dev`, không có CSP.
  - Nếu ca xanh mà không kiểm gì, lần sau ai đó đổi `assetsInlineLimit` hoặc thêm font nhỏ thì lỗi quay lại mà CI không biết.
  - Khi đó dễ có người "sửa" bằng cách thêm `data:` vào `font-src`, tức nới CSP.
- Đề xuất sửa: thêm một hoặc cả hai bước, đều đã thử ở probe P5, P6:
  - Kiểm header thật mà trang nhận: `const resp = await page.goto(link.url); expect(resp?.headers()['content-security-policy']).toBe(csp);`.
  - Font mồi chứng minh CSP đang thực thi: sau khi trang tải, gọi `await page.evaluate(() => new FontFace('csp-canary', 'url(data:font/woff2;base64,AAAA)').load().catch(() => null));`. Kỳ vọng đúng **một** vi phạm `font-src` có `uri` bắt đầu bằng `data`. Bỏ vi phạm đó ra rồi mới kiểm "0 vi phạm" như hiện nay.
- Trạng thái: Open

### FB-R5-SEC-FEB-167-02
- Mức độ: Suggestion
- Người nhận: FE-B, QA biết
- Vị trí: cùng ca, đoạn `const other = violations.filter((v) => v.directive !== 'font-src')`
- Vấn đề:
  - Vi phạm CSP ở chỉ thị khác `font-src` (`img-src`, `style-src`, `connect-src`, `script-src`…) chỉ ghi vào annotation `csp-other`, ca vẫn xanh.
  - Ca này là chỗ duy nhất trong CI chạy trang khách thật (có API) dưới CSP production.
- Vì sao quan trọng:
  - Một thay đổi sau này bị CSP production chặn sẽ chỉ lộ ra trên staging hoặc ở khách, nếu nó không làm hỏng dòng chữ mà ca chờ. Ví dụ: ảnh từ origin khác, thẻ `<style>` chèn lúc chạy, `fetch` sang host khác.
  - Lúc đó dễ có người nới CSP cho nhanh.
- Đề xuất sửa:
  - Xem annotation `csp-other` của lần CI đầu.
  - Nếu rỗng, đổi thành `expect(violations).toEqual([])`, sau khi bỏ font mồi của 167-01.
  - Nếu không rỗng, ghi từng chỉ thị vào báo cáo FE-B và gửi SEC xem trước khi siết.
- Trạng thái: Open

### FB-R5-SEC-FEB-167-03
- Mức độ: Suggestion
- Người nhận: FE-A (admin-web), MOB (PWA nhân viên); FE-B biết
- Vị trí: `product/apps/admin-web/vite.config.ts`, `product/apps/mobile/vite.config.ts` (việc copy-v1.0.5 mục 5.2 ý 2, 4)
- Vấn đề:
  - Cả hai app nạp cùng `@ottimo/ui/styles.css` và chưa đặt `assetsInlineLimit`.
  - Bản build cục bộ ngày 20/10 của cả hai có 6 font `data:`. CSP production của Desk và PWA cũng là `font-src 'self'`, nên các font này bị chặn như trang khách trước #167.
- Vì sao quan trọng:
  - Có ba app chung một bộ font. Nếu mỗi app sửa một kiểu, rất dễ có app sửa bằng cách nới CSP.
  - Lỗi CSP lặp ở mỗi lần tải làm nhiễu console. Một vi phạm thật dễ lẫn vào đó mà không ai thấy.
- Đề xuất sửa:
  - Dùng đúng cách của #167: hàm `assetsInlineLimit` trả `false` cho `.woff`/`.woff2`.
  - Nên để hàm ở một chỗ chung để ba app không lệch nhau, ví dụ export từ `packages/ui` hoặc một tệp cấu hình Vite dùng chung.
  - Thêm ca bundle như `bundle.test.ts` của guest-web: CSS không có `data:font`, mọi `url(…woff2?)` là tệp `/assets/` có trong bản build.
  - **Không** thêm `data:` vào `font-src` của `Caddyfile.prod` hay `expected-headers.sh`.
  - Gửi SEC review cùng PR.
- Trạng thái: Open

## 5. Điểm làm tốt

- Sửa ở bản build, không nới CSP. FE-B ghi rõ "Không đổi CSP" và mời SEC xem lại.
- Ca bundle đã được thử đỏ: FE-B đặt lại giới hạn 4096 thì ca đỏ. Ca kiểm từng tập và từng mặt, không chỉ "không có `data:`".
- E2E đọc CSP từ `Caddyfile.prod` chứ không chép tay, nên đi theo mọi lần sửa Caddy sau này.
- FE-B đo lại phạm vi lỗi và sửa mô tả BUG-R4-017 cho đúng. Probe SEC khớp.
- Test chỉ dùng dữ liệu giả, và cắt ngắn mọi chuỗi ghi lại.

ESC mới: **không**.

## Dòng decision-log (ORC ghi)

| 2026-11-07 | 5 | **SEC – review FE-B PR #167 (r5-feb-g2-guest, font chữ Nga trang khách dưới CSP production, V5-24 BUG-R4-017) @ 838be376: DUYỆT, gộp khi FE-B giải xung đột với main, CI xanh trên SHA mới và báo cáo E2E có ca V5-24-1 chạy và đạt (không skip)**; lần gộp main đụng vite.config.ts, bundle.test.ts, tệp E2E mới hoặc infra/caddy thì gửi SEC xem lại. Không đổi CSP hay Caddy: PR không đụng infra, Caddyfile.prod và expected-headers.sh giữ font-src self, /assets/ qua file_server cùng origin. Chỉ font thôi nhúng: Vite 7.3.7 shouldInline dùng lại mặc định 4096 khi hàm trả undefined; so build base với build PR: base có đúng 6 data: (4 font/woff2, 2 font/woff), không data: nào khác; PR 0 data:, thêm đúng 6 tệp JetBrains Mono (cyrillic-ext 400/500 woff2 và woff, vietnamese 400/500 woff2); JS giống từng byte, CSS giống ngoài url(). guest-web không dùng SRI. E2E đọc CSP từ Caddyfile.prod và áp bằng route.fulfill vào document /g/; probe SEC với đúng cơ chế đó: build base 6 vi phạm font-src, 2 mặt lỗi, check Ѣ false (ca sẽ đỏ), build PR 0, 0, true; nhưng route không khớp thì build lỗi cũng xanh. Test chỉ dữ liệu giả (namedGuest tên ngẫu nhiên, fakeMobile, example.test; MOCK_TOKENS). Ghi chú FE-B về BUG-R4-017 khớp probe (chỉ Cyrillic-ext lỗi hẳn; Vietnamese woff2 bị chặn nhưng có woff dự phòng). Thẻ: 167-01 Suggestion FE-B (bằng chứng CSP đã áp: header trên phản hồi page.goto và font mồi data: đúng 1 vi phạm, đã thử), 167-02 Suggestion FE-B (vi phạm khác font-src chỉ ghi annotation; xem lần CI đầu rồi siết thành 0), 167-03 Suggestion FE-A và MOB (admin-web và PWA còn 6 font data: theo build cục bộ 20/10, cùng CSP; sửa như #167 bằng hàm dùng chung và ca bundle, không thêm data: vào font-src, gửi SEC). Không ESC | SEC | rounds/round-05/reviews/SEC-on-feb-pr-167.md |
