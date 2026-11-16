# SEC – Nhãn thông báo privacy `2026-11-16` (Round 5, Kiểm thử – gate phát hành v1.0.5 + FB-INV-010 Đợt 1)

Ngày: 16/11/2026. Người làm: SEC. Không SSH, không chạm staging/production. Không commit.

Căn cứ: `rounds/round-05/outputs/OPS/report.md` mục 13 (bước `privacy` FAIL, 5 ngôn ngữ, nhãn `2026-11-04`); `product/infra/server/README.md` 12.3 (luật byte theo (`version`, `locale`), luật nhãn theo DB đích `CONST_ROWS`, bước 6 `publish-privacy-notice.sh`), 13.7 (luật thường trực bảng `privacy_notice_version`); `product/apps/landing-web/src/content/privacy.ts` (chú thích luật nhãn, `VERSION`); PR #181 (commit `32c9bd2d`).

## 1. Kết luận

- **Thân thông báo privacy không đổi** giữa `6414be25` (đang chạy, nhãn `2026-11-04` đã đăng) và `32c9bd2d` (#181), cả 5 ngôn ngữ. Chữ đồng ý của form (`consent`/`consentMore`) cũng không đổi.
- Trang privacy đổi byte chỉ vì **layout chung**: `description` trong JSON-LD `LodgingBusiness` (chữ site mới của #181) và tên tệp CSS băm (`Base.<hash>.css`, thêm `fonts-ko/zh.<hash>.css` ở ko/zh).
- FAIL của `deploy-landing.sh` là **đúng thiết kế** (erd 4.14: một (`version`, `locale`) ứng với đúng một chuỗi byte). Không thêm cờ bỏ qua, không sửa log, không SQL tay.
- **Chọn (a): đăng nhãn mới `2026-11-16`, cùng thân thông báo**, kèm điều kiện ở mục 4. Không phát hành `sha-32c9bd2def9a` với nhãn `2026-11-04` ở bất kỳ môi trường dùng chung nào.
- (b) (tách trang privacy khỏi layout chung) **không làm trong round này**. Đưa vào backlog, lý do ở mục 3.

## 2. Bằng chứng (SEC tự kiểm, máy local)

Cách làm: `git archive` thư mục `product/apps/landing-web` ở hai commit vào scratchpad, build Astro cùng biến (`LANDING_BOOKING_FORM=true`, `LANDING_PROPERTY_SLUG=dlt`), cùng `node_modules` (không đổi `package.json`/lockfile giữa hai commit). So từng trang `/privacy/`, `/<xx>/privacy/`. Đây là bản build local, không phải image GHCR: băm tuyệt đối khác image, chỉ dùng để so hai commit với nhau.

Nguồn:
- `git diff 6414be25 32c9bd2d` trên `src/components/PrivacyPage.astro`, `src/content/privacy.ts`, `src/styles/privacy.css`, `src/layouts/`, `src/pages/`: **rỗng**.
- `privacy.ts` đọc `site` (liên hệ, pháp nhân): phần #181 đổi trong `site.json`/`site.ts` chỉ là `booking.shortMaxNights` (bỏ) và khối `longStay` mới; liên hệ và `legal` không đổi.
- `consent`/`consentMore` trong `en/vi/ko/zh/ru.ts`: không dòng nào đổi.

Bản build (5 ngôn ngữ, kết quả giống nhau ở mọi trang):

| Kiểm | en | vi | ko | zh | ru |
|---|---|---|---|---|---|
| `<main>…</main>` (thân thông báo, nhãn, nút về) giống hệt | có | có | có | có | có |
| Phần còn lại của trang, sau khi bỏ JSON-LD và chuẩn hóa tên CSS băm, giống hệt | có | có | có | có | có |
| Khóa JSON-LD khác nhau | chỉ `@graph/0/description` | như en | như en | như en | như en |
| Dòng khác (diff thô) | JSON-LD, `Base.*.css` | như en | + `fonts-ko.*.css` | + `fonts-zh.*.css` | như en |
| Form trang chủ: nhãn đồng ý + `data-consent-version` giống hệt | có (`2026-11-04`) | có | có | có | có |

Khớp với OPS (trang EN của hai image khác đúng 2 dòng). Bốn ngôn ngữ còn lại OPS chưa so từng tệp: SEC xác nhận cùng nguyên nhân bằng bản build.

## 3. Vì sao (a), không (b) ngay

- (a) không đổi mã kiểm, không đổi bảo đảm toàn vẹn. Chỉ đổi một hằng (`VERSION` trong `privacy.ts`), hằng này sinh ra cả thẻ meta, `data-notice-version`, dòng "Version …" của 5 trang và `data-consent-version` của form. Thân thông báo khác bản `2026-11-04` đúng ở dòng phiên bản.
- `CHAT_DETAILS_MIN_NOTICE_VERSION` của api **giữ `2026-11-04`**: staging và production đều đã đăng `2026-11-04` (`CONST_ROWS ≥ 1`), nhãn mới xếp sau hằng nên qua cổng ★2 theo `published_at`. Không Release api, không đổi hằng (README 12.3, luật DB đích).
- (b) đổi phạm vi băm (vd chỉ băm thân thông báo, hoặc trang privacy không dùng layout chung) là đổi luật erd 4.14 mà `deploy-landing.sh` + `publish-privacy-notice.sh` + 2 bộ test đang dựa vào. Cần ARC + SEC review, không kịp cho gate này. Bản build đầu tiên sau (b) cũng đổi byte trang, nên vẫn phải có nhãn mới. Rủi ro của (a) chỉ là chi phí lặp lại: **mỗi lần đổi chữ site, CSS hay font đều phải đổi nhãn**. Đề xuất backlog: "B-SEC/FE/ARC – trang privacy ổn định byte khi thân thông báo không đổi" (ưu tiên trung bình, trước lượt landing kế tiếp có đổi layout).

## 4. Điều kiện (OPS, FE, QA)

**FE (thay đổi mã – nhỏ, cần một PR):**
- F1. Trong `product/apps/landing-web/src/content/privacy.ts` chỉ đổi `const VERSION = '2026-11-04'` thành `'2026-11-16'` và chú thích đi kèm (ghi lại: `2026-11-16` = chữ `2026-11-04` không đổi, chỉ đổi nhãn vì layout, SEC 16/11). Không đổi câu nào của 5 thông báo, không đổi `consent`/`consentMore`.
- F2. Không đổi `CHAT_DETAILS_MIN_NOTICE_VERSION` của api. Test landing nào ghim `2026-11-04` (vd `src/scripts/price-estimate.test.ts` `consentVersion`) thì đổi theo `VERSION` hoặc giữ nếu chỉ là dữ liệu mẫu. FE ghi rõ trong PR.
- F3. `git diff 32c9bd2d <commit mới> -- product/apps/landing-web/src/content/` chỉ có dòng `VERSION` + chú thích + test. Nếu PR có đổi gì khác ở landing (chữ, CSS, font) thì vẫn dùng nhãn `2026-11-16` được, **miễn là chưa đăng ở đâu**, nhưng phải chạy lại kiểm O2.

**OPS (staging trước, production sau):**
- O1. Image phát hành = image landing build từ commit có `VERSION = '2026-11-16'`, **không phải** `sha-32c9bd2def9a`. Digest lấy từ log job `publish images (GHCR)` của đúng lượt CI build tag đó.
- O2. Trước khi deploy, kiểm thân thông báo bằng chính image (chỉ đọc, `--network none`): với mỗi ngôn ngữ, lấy `<main>…</main>` trang privacy của image mới, thay `2026-11-16` thành `2026-11-04`, so sha256 với `<main>…</main>` cùng trang của image `sha-6414be25f20d` (nhãn đã đăng). Phải **bằng nhau cả 5**. Khác thì dừng, báo SEC. Dán 5 cặp băm 12 ký tự vào báo cáo OPS.
- O3. `deploy-landing.sh <tag mới> --digest sha256:… --check-only`: bước `privacy` phải in 5 ngôn ngữ `2026-11-16 (not published yet)` (en, vi, ko, zh, ru), không FAIL, không "older".
- O4. Trước bước đăng, đếm `CONST_ROWS` trên **DB đích** (chỉ đọc, chỉ cột `version`, runbook CHKV) với hằng `2026-11-04`: phải `≥ 1` cho đủ các ngôn ngữ đã đăng. `= 0` thì dừng, báo SEC (không tự đổi hằng).
- O5. **Hash trang đăng phải lấy từ đúng digest phát hành**: chạy `publish-privacy-notice.sh --landing-tag "$(cat <stack>/state/landing_tag)" --version 2026-11-16 …` **sau** `deploy-landing.sh` (không `--check-only`) trên cùng stack, cùng phiên, ngoài giờ cao điểm. Không dùng tag/digest khác, không dùng băm từ build local, không dùng băm của staging cho production (công cụ tự đọc image đang chạy và tải trang qua edge; hai nguồn phải cùng sha256).
  - Staging: `cd / && sudo OTTIMO_HOME=/opt/ottimo /opt/ottimo/infra/server/bin/publish-privacy-notice.sh …` (root, vì basic auth, README 12.3 bài học 5). Production: `sudo -u ottimo /opt/ottimo-prod/…`.
  - Chạy thử phải in `dry-run (would): supersede version 2026-11-04` cho đủ 5 ngôn ngữ. Rồi `--apply` phải in 5 dòng `apply: supersede version 2026-11-04 (<xx>)` và `OK: version 2026-11-16 published (en vi ko zh ru)`. Khác thì dừng, báo SEC.
- O6. Production chỉ sau khi staging đạt O1–O5, QA ký landing staging, INV duyệt lượt landing. Production dùng **cùng digest** đã qua staging. Không `--force`, không thêm cờ bỏ bước `privacy`.
- O7. Khoảng giữa deploy landing và `--apply`, form mới gửi `2026-11-16` mà DB chưa có: server trả `NOTICE_VERSION_INVALID`, trang hiện khối Zalo/gọi. Chấp nhận, giữ khoảng này vài phút. Sau `--apply`, form của trang cũ (`2026-11-04`) còn được nhận 7 ngày (đúng thiết kế).
- O8. Nếu sau khi đã đăng `2026-11-16` ở một môi trường mà trang privacy đổi byte vì bất kỳ lý do nào (kể cả chỉ CSS hay chữ site): nhãn mới (`2026-11-16.1`, hậu tố không số 0 đầu, hoặc ngày mới), không dùng lại `2026-11-16`. Không bao giờ đăng `2026-11-16` với hai chuỗi byte khác nhau ở staging và production: vì vậy O6 bắt buộc cùng digest.
- O9. Luật thường trực giữ nguyên: không SQL tay trên `privacy_notice_version`, không sửa/xóa `state/privacy-notice.log` (README 13.7, 12.3).

**QA:** sau khi đăng trên staging, kiểm 5 trang privacy hiện "Version 2026-11-16" (đúng chữ từng ngôn ngữ), form gửi `consentVersion = 2026-11-16`, gửi thử qua công cụ có header (BUG-R4-054) được nhận; mức tin Chat không bị hạ về A (cổng ★2 vẫn qua vì `published_at` sau hằng `2026-11-04`).

## 5. Dòng cho decision-log (ORC thêm)

| 2026-11-16 | 5 | **SEC – duyệt nhãn privacy 2026-11-16** (cùng thân thông báo `2026-11-04`, 5 ngôn ngữ en/vi/ko/zh/ru; `consent`/`consentMore` không đổi). Lý do: #181 (`32c9bd2d`) đổi layout chung (JSON-LD `description`, tên CSS băm) nên trang privacy đổi byte dù thân không đổi; SEC so build `6414be25` vs `32c9bd2d`: `<main>` giống hệt cả 5 trang, chỉ khác `@graph/0/description` và tên CSS. FE chỉ đổi `VERSION` trong `privacy.ts`; **không đổi** `CHAT_DETAILS_MIN_NOTICE_VERSION` (= `2026-11-04`, `CONST_ROWS ≥ 1` trên staging và production). Điều kiện: image có `VERSION=2026-11-16` (không phải `sha-32c9bd2def9a`); OPS so `<main>` image mới (thay nhãn) với `sha-6414be25f20d` bằng nhau cả 5; `--check-only` in 5 × `2026-11-16 (not published yet)`; `publish-privacy-notice.sh --version 2026-11-16` chạy ngay sau deploy landing, `--landing-tag` = `state/landing_tag` của chính stack (băm lấy từ đúng digest phát hành), staging (root) trước, production cùng digest sau khi QA + INV duyệt; `--apply` phải supersede `2026-11-04` đủ 5 ngôn ngữ. Đổi byte sau khi đăng → nhãn mới, không dùng lại. Backlog: trang privacy ổn định byte khi thân không đổi (FE + ARC, SEC review). Chi tiết `rounds/round-05/reviews/SEC-privacy-label-20261116.md`. | SEC | OPS, FE, QA |

Ghi chú cho ORC: cột cuối theo mẫu các dòng SEC gần nhất; nếu decision-log dùng số cột khác, giữ nguyên nội dung ô thứ ba.

## 6. Giả định

- Nhãn `2026-11-04` đã đăng trên cả staging và production (OPS mục 13: FAIL "for a published notice version" trên staging; production đăng ở lượt LP-v2). O4 kiểm lại trên từng DB.
- Image `sha-6414be25f20d` build từ commit `6414be25`, `sha-32c9bd2def9a` từ `32c9bd2d` (theo tên tag). Bản build local cùng mã nguồn cho cùng cấu trúc HTML; O2 kiểm lại trên chính image.
- Không ESC: việc thuộc quyền SEC (yêu cầu kỹ thuật bảo mật, thủ tục nhãn), không đổi chữ pháp lý.
