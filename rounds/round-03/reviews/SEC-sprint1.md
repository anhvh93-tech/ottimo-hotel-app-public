# SEC – Sổ Verified Round 3 Sprint 1 (theo B.0 của `outputs/SEC/s1-security-requirements.md`)

- Người ghi: SEC | Ngày: 24/10/2026 | Bước: Kiểm thử (sau cổng tiền G1 – decision-log 24/10, `main` `870ecfd`).
- **Commit được Verified: `880ea19`** (`origin/main`). CI push run `40085123525` (attempt 1):
  - mọi job kiểm **xanh**: format · lint · audit · test · build; API contract; OpenAPI lint; gitleaks; infra scripts; landing Playwright; docker images build + E2E smoke; publish images;
  - log không có `retry #`;
  - riêng `deploy staging` / `deploy landing preview` ở trạng thái `cancelled`. Hai job này chờ người duyệt môi trường, không phải job kiểm.
- Từ `880ea19` tới `870ecfd` chỉ có thay đổi tệp fuzz harness (`test/fuzz/*`) và tài liệu, không đổi mã ứng dụng. CI của `870ecfd` (run `40089913374`) đang chạy lúc ghi sổ. Nếu run này đỏ ở job kiểm, SEC xem lại trước tag RC.
- Cách kiểm lại (B.0 (3)):
  - worktree sạch ở `880ea19`, Postgres 17 mới, init roles của repo, migrate từ đầu tới migration mới nhất trên `main` (0087);
  - test chạy bằng role `ottimo_app` với `--maxWorkers=3`, dữ liệu giả;
  - worktree và container đã gỡ ngay sau khi chạy;
  - `tsc --noEmit` đạt.
- **Kết quả: 18 tệp, 229/229 ca đạt.**
- Kiểm RLS sau migrate: 14 bảng nhạy cảm đều `relrowsecurity = t` và `relforcerowsecurity = t`: `guest`, `reservation`, `reservation_guest`, `guest_request`, `online_checkin`, `attachment`, `approval_request`, `folio_settled_reduction`, `foc_stay_alert`, `website_booking_request`, `public_form_nonce`, `config_parameter`, `mfa_login_challenge`, `retention_run`.
- B.0 (5): log, audit và `retention_run` mới không chứa dữ liệu cá nhân; đã kiểm ở từng review gốc (dẫn trong bảng).

## 1. Bảng Verified

| Thẻ / hạng mục | Mục yêu cầu | Trạng thái | Commit | Tệp test chạy lại (số ca) | Review gốc |
|---|---|---|---|---|---|
| FB-R2-SEC-BE-65 (kiểm lại) | B.1 | **Verified** | `880ea19` | `sec-be65-retention` (10), `registration-party-removal` (18), hồi quy `guest-document-profiles` (5) | `s1-SEC-on-BE-C-q17.md` |
| FB-R2-SEC-BE-74 | B.2 | **Verified** | `880ea19` | `sec-r3-q17` (15, khối BE-74: soát từng cột `guest`, migration bù chạy lại được) | `s1-SEC-on-BE-C-q17.md` |
| FB-R2-SEC-BE-75 | B.3 | **Verified**, có 2 điểm lệch đã chấp nhận (hàm trả `has_open` + `last_end`; policy `org_retention_read`) | `880ea19` | `sec-r3-q17` (khối BE-75 + khối guard BEC-01) | `s1-SEC-on-BE-C-q17.md` mục 3 |
| FB-R2-SEC-BE-79 | B.4 | **Verified** | `880ea19` | `sec-r3-q17` (khối BE-79, 7 ca, gồm ép lỗi giữa giao dịch), `guest-document-profiles` | `s1-SEC-on-BE-C-q17.md` |
| FB-R2-SEC-BE-83 + ESC-026 A (+ R3-Q25) | B.5 | **Verified** | `880ea19` | `r3-be83-esc026` (14), `r3-bb07-limit-basis` (9), `money-limit-basis-architecture` (6), `r3-add3-settled-credit` (13), `r3-br433e-a32-waiver` (11), `r3-bug-012-013` (5), `r3-bug-014-payout-replan` (4). Cổng G1: fuzz 710 chuỗi, 0 vi phạm cứng. | `s1-SEC-on-BE-B.md`, `s1-SEC-on-add3.md`, `s1-SEC-on-fuzz-fixes.md`, `s1-SEC-on-bug-012-013.md`, `s1-SEC-on-bug-014.md` |
| FB-R2-SEC-BE-84 (a) | B.6 (a1) | **Verified** | `880ea19` | `sec-r3-q17` (khối BE-84: "Cần chú ý" chỉ OWN/MGR, chỉ số đếm) | `s1-SEC-on-BE-C-q17.md` |
| R3-Q15 (T13) | B.7 | **Verified** | `880ea19` | `guest-request-t13-r3-bed` (6), `guest-portal-boundaries` (3) | `s1-SEC-on-BE-C-q17.md` mục 8 |
| US-143 / SR-AUTH-06 – **phần mã** | A | **Verified phần mã.** Phần staging/OWN thật còn mở, xem mục 2. | `880ea19` | `mfa-us143` (23); FE `r3-s1-fea` và E2E S2 chạy trong CI | `s1-SEC-on-2FA.md` |
| R3-Q51 (tài khoản nhận VietQR) | C | **Verified** | `880ea19` | `r3-q51-receiving-account` (9), `parameters-delete-architecture` (2); FE `r3-q51-fea` trong CI | `s1-SEC-on-Q51.md` |
| US-155 – **phần server** | `landing-booking-SEC.md` C-2, C-3 (c)(d)(e), C-11, C-12 (a)(c) | **Verified phần server.** Form vẫn **tắt** (mặc định); mốc bật form tính riêng, xem mục 3. | `880ea19` | `public-site-r3-bed` (31), `be-d-r3-s1-units` (45) | `s1-SEC-on-us155.md` |
| BUG-R2-208 / 209 / 210 (lượt kiểm tiền, điều kiện D) | D | **Verified** (D.1–D.4). D.5 có trong hợp đồng 0.3.8; D.6 đạt cùng G1. | `880ea19` | Nằm trong các tệp tiền ở dòng BE-83 (s438-r8) | `s1-SEC-on-BE-B.md` |

Thẻ phụ còn mở, **không chặn** cổng v1.0:
- BE-84 (b) `FOR SHARE` (Should);
- FB-R3-SEC-BE-B-09 (Minor: nâng cơ sở hạn mức qua đường giá hệ thống, chờ DOM, Sprint 2);
- BE-B-05, FZ-03, ADD3-04, 014-01 (Suggestion);
- Q51-03 (HK/axe/E2E – QA), Q51-05 (Suggestion);
- US155-05 (Suggestion).

Ghi chú B.0 (6): trạng thái 6 thẻ trong `round-02/reviews/s4-SEC.md` cần chuyển sang **Verified (`880ea19`)** và gỡ khỏi R3-Q17/Q22/Q33. Lần commit này chỉ gồm tệp này theo chỉ đạo của ORC; SEC sửa `s4-SEC.md` ở lượt sau.

## 2. Điều kiện SEC còn lại trước cổng v1.0 (dữ liệu thật / production)

| # | Điều kiện | Ai làm | Nguồn |
|---|---|---|---|
| 1 | Staging `MFA_ENFORCED = true`. **OWN và MGR thật** đăng nhập hai bước và đăng ký 2FA, có SEC chứng kiến; SEC không giữ mã hay bí mật. Sau bước này US-143 mới được ghi Verified đầy đủ. | OPS bật cờ; INV (OWN), MGR thật; SEC chứng kiến | `s1-SEC-on-2FA.md` "Việc còn lại" (4) |
| 2 | **Thủ tục 06.33** (khôi phục OWN mất cả hai yếu tố): OPS viết, lưu ngoài repo, có bảng **người thật** theo chức danh (FB-R3-SEC-OPS-04). **Diễn tập một lần trên staging, có người chứng kiến thật**, biên bản chỉ ghi kết quả. Xong thì SEC duyệt. | OPS + INV + người chứng kiến; SEC duyệt | `s1-SEC-on-v1-prod.md` mục 5 |
| 3 | **OPS production:** SEC review lại các bản sửa OPS đã báo Done (`responses/s1-OPS-v1.md`): OPS-01 (edge giới hạn kết nối/IP, Major), OPS-02, OPS-03, OPS-05, BOOT-01/02. Production chỉ nhận người dùng thật sau khi OPS-01 Verified. | OPS; SEC kiểm lại | `s1-SEC-on-v1-prod.md` |
| 4 | **Kiểm lại trên commit RC** (B.0 (7)): chạy lại đúng 18 tệp ở mục 1 trên commit gắn tag RC. Nếu tệp liên quan có đổi mã sau `880ea19` thì đọc lại diff. | SEC | B.0 (7) |
| 5 | SEC-G1/G2 (Desk chạy dữ liệu khách thật) theo `s3-SEC.md` mục 9.5, kiểm trên production trước ngày mở. | SEC + OPS | `s3-SEC.md` 9.5 |
| 6 | R3-Q51 trên production: INV **tự nhập** tài khoản nhận thật trên màn H05. Không đưa số vào repo, chat hay tài liệu (Q51-9). | INV | `s1-security-requirements.md` C |

**Mốc riêng – bật form website (US-155),** chỉ khi INV muốn mở form lúc phát hành. Còn 6 điều kiện:
- (1) FE-B/QA: test B.2.1–B.2.3 phía Desk;
- (2) bước VPS: `LANDING_IP`, `LANDING_PUBLIC_API=on`, `LANDING_BASE_URL`; kèm `ops-check` + một lần gọi thật qua landing;
- (3) C-1: kiểm bản dựng landing;
- (4) C-3 (a) và (5) C-13: luật sư, ESC-001;
- (7) QA E2E trên stack có landing.

Chi tiết ở `s1-SEC-on-us155.md`. Form tắt thì không ảnh hưởng cổng v1.0.
