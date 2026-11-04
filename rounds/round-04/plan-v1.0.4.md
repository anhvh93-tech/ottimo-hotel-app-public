# Round 4 – Kế hoạch lắp v1.0.4 (giao song song BE / FE / MOB / OPS / INT)

- Người lập: ARC | Round 4 – đợt v1.0.4 – Bước: **Lập kế hoạch kỹ thuật** | 04/11/2026
- Căn cứ: INV yêu cầu đẩy nhanh, chạy song song tối đa. v1.0.3 lên production 04/11 07:12 (tag `v1.0.3` → `da6d6f3d`, decision-log 04/11). Phạm vi và thứ tự: backlog 5.6 (`03-backlog/backlog.md`, đoạn "Chốt phạm vi v1.0.3", bảng 04/11, bảng đích); `rounds/round-04/plan-v1.0.3.md` mục 4; thiết kế kỹ thuật đã có ở `rounds/round-04/outputs/ARC/v1.0.3-tech-plan.md` mục 4–5 (giữ chỗ, giá hẹn, `leaseEndDate`, PN-01, ETag); `rounds/round-04/qa/bug-list.md` (BUG-R4-015, 020, 023–026); `rounds/round-03/qa/bug-list.md` (BUG-R3-041…046, 052, 053); `rounds/round-04/reviews/SEC-on-info-sent-copies.md` + `02-escalations/ESC-049.md`; `rounds/round-04/reviews/SEC-on-commission-numbers.md`.
- Song song: một ARC khác đang dựng nhánh `lp-v2-main` (= `origin/main` + `origin/lp-v2`, migration LP-v2 đổi thành **0092**, OpenAPI **0.3.11**, gộp strings). Kế hoạch này **không** đụng việc đó, chỉ dùng kết quả của nó.
- Kế hoạch chưa commit. ORC commit.

---

## 0. Kết luận nhanh

1. **23 gói**, mỗi gói một nhánh `v104/<gói>`. Mỗi tệp nóng có **đúng một chủ** (mục 4). Không hai dev sửa cùng tệp.
2. **12 gói bắt đầu NGAY từ `origin/main`** (mục 5). Chúng không chạm tệp xung đột với `lp-v2-main`. Các gói này **rebase lên `main@L`** (xem ý 3) trước khi mở PR. Rebase sạch vì không chạm tệp LP-v2 đã sửa.
3. **Nền của v1.0.4 = `main@L`**: `main` sau khi ORC gộp `lp-v2-main` (khi CI xanh). Hợp đồng, strings và migration của v1.0.4 **chỉ** viết trên nền này.
   - OpenAPI **0.3.12**: một chủ (ARC, gói P4-00).
   - Strings: một chủ cho lượt 1 (UXD, gói P4-01). Khóa phát sinh muộn theo luật "nhóm riêng, sinh lại, không sửa tay tệp sinh ra" (mục 2.4).
   - Migration giữ số trước: **0093** giữ chỗ, **0094** trigger giá, **0095** PN-01, **0096**/**0097** dự phòng.
4. **Thứ tự ưu tiên giữ đúng backlog 5.6:**
   - (1) nhóm giữ chỗ;
   - (2) `leaseEndDate`;
   - (3) BUG-R4-015 + ED-02;
   - (4) PN-01 Minor;
   - rồi **ARC-RN103-02 + BUG-R4-020** (app nhân viên đăng nhập 2 bước, nút đặt lại 2 bước – ưu tiên cao);
   - rồi các dòng "bắt buộc";
   - rồi mục (5).

   Các nhóm này nằm ở **làn khác nhau**, nên chạy cùng lúc, không chờ nhau. Thứ tự chỉ dùng khi phải cắt việc.
5. **Mốc:**

   | Mốc | Giờ |
   |---|---|
   | Hợp đồng 0.3.12 | 05/11 10:00 |
   | Strings lượt 1 | 05/11 12:00 |
   | Cắt v1.0.4 | 06/11 18:00 |
   | Staging, QA tạo giữ chỗ chờ hết hạn theo giờ thật | 06/11 tối |
   | QA lượt 2 trên staging | 07/11 |
   | **QC rút gọn** | 08/11 sáng |
   | **Production (đích)** | 08/11 chiều |
   | Hạn chót | 10/11 |

6. **Không có ESC mới.** Một điểm ORC cần chốt với PO (mục 2.1 ý 4):
   - v1.0.4 cắt từ `main@L`, nên production v1.0.4 mang theo mã máy chủ + Desk của LP-v2.
   - Phần này **chưa tác động gì tới khách**: `public_show_prices` mặc định `false`, `LANDING_LOCALES` mặc định `en,vi`, landing không deploy lại.
   - Khách chỉ thấy LP-v2 khi OPS deploy landing và OWN bật giá, đúng "phát hành một lần" (INV 01/11).

---

## 1. Phạm vi v1.0.4 theo gói (tóm tắt)

| Nhóm backlog | Gói |
|---|---|
| (1) BUG-R3-042 (P1), 043, 044 + BA M13-03, 041 + WA-04, ĐX-R3-QA-01 | P4-10 (BE-B), P4-40 (FE-B) |
| (2) `leaseEndDate` (FB-R4-DOM-FE-A-01 phần còn lại + DOM-BE-A-04) | P4-11 (BE-C), P4-31 (FE-A) |
| (3) BUG-R4-015 + FB-R4-ARC-BE-A-ED-02 | P4-11 (BE-C) |
| (4) PN-01 Minor (ARC PR29-01/02/S1/S2, SEC PN01-01/02/03) + câu kiểm `ops-check` | P4-13 (BE-D), P4-04 (OPS) |
| **ARC-RN103-02 + BUG-R4-020** (ưu tiên cao) + BUG-R3-052 | P4-50 (MOB), P4-30 (FE-A) |
| Bắt buộc: FB-R4-SEC-ARC-EM-09 (giới hạn đổi email) | P4-00, P4-06 |
| Bắt buộc: FB-R4-ARC-OPS-PR32-06 + ARC-BE-31-05 (`STAFF_EMAIL_TEMPLATES`) | P4-05 + P4-06, **một PR** |
| Bắt buộc: FB-R4-OPS-ARC-31-01 (tách bước `switch` của `deploy.sh`) | P4-02 – gộp **trước** P4-10 |
| Bắt buộc: V3-08 `privacy-2026-10-v2` + mở lại check-in online | P4-42 (MOB, chờ chữ SEC) |
| Bắt buộc: FB-R4-QA-DOM-PR25-01 (`byCalc`) | P4-11 (BE-C) + P4-20 (DOM) |
| Trước QC v1.0.4: PO-DOM-PR25-01…05, SEC-DOM-01, QA-DOM-PR25-02…05, BA-DOM-PR25-01…04/S1–S3, BUG-R4-025 phần BR-428 | P4-20 (DOM + QA) |
| Trước QC v1.0.4: SEC-OPS-01 (CI `confidential-paths`, ô mẫu PR), SEC-ORC-01 G4 (che ảnh) | P4-04, P4-03, QA |
| Email/bảo mật v1.0.4: G-BE-4, INT-BE-31-04, SEC-BE-018-01…04, ARC-BE-018-03/04, SEC-ARC-018-03, DOM-BA-M18-08, ARC-BA-M18-01 phần mã + SEC-SENT-02, ARC-BE-31-04 (nếu kịp), V3-04 (nếu kịp), CPY-INT-05/03 | P4-05, P4-06 |
| OPS: PR32-02(b), PR32-S1 + PR30-09, PR32-S2, PR30-10 (+ca 4c), ARC-OPS-PR30-10, PR30-08, D1 digest, SEC-OPS-PR33-S3 + SENT-01 (README), CODEOWNERS `field-policy.ts` | P4-02, P4-03, P4-04 |
| ETag (V3-09) | P4-00 (tài liệu) + P4-11 (máy chủ nhận hậu tố nén) |
| Giữ nơi nhận khi tạo yêu cầu thay thế (FB-R4-DOM-BA-025-02) | P4-12 (BE-D), SEC duyệt |
| BE-D: ARC-BE-PR24PM-01…04 | P4-14 |
| (5) chữ/tiền: BUG-R4-023, 024, UXD-FE-EM-07/13/14/15, BUG-R4-025 chữ Desk, BUG-R4-026, GN-R4-QA-01 (ghi chú), GN-R4-QA-03, BUG-R2-216, 219, 103, 097, BUG-R3-045, 046, 047, 024, 053 | P4-30, P4-31, P4-41 (FE-A), P4-40, P4-32 (FE-B), P4-33 (FE-A, nếu kịp) |
| Sổ tay HTML nhúng font (UXD L1) | P4-21 (UXD) |
| SEC-BE-01 (hoa hồng không mặc định trong mã) | P4-15 – **có điều kiện** (mục 3, ghi chú P4-15) |

Không vào v1.0.4, mặc định **v1.0.5**:
- BUG-R2-079, 086, 092, 094, 096, 098, 100, 077, 220, 082, 217, 214, 075, 215, 218;
- BUG-R3-021 (phần Desk), 023, 025–031, 034–036, 048;
- BUG-R4-017;
- hạn lưu ảnh 3 tháng.

Làn nào xong sớm thì ORC lấy thêm từ danh sách này theo đúng bản đồ chủ tệp (mục 4). Không lấy việc chạm tệp của làn khác.

---

## 2. Thứ tự với LP-v2, nhánh nền, số hiệu

### 2.1 Nhánh nền
1. **`main@L`** = `main` sau khi ORC gộp `lp-v2-main`.
   - Điều kiện gộp: CI `lp-v2-main` xanh (gồm `gen_strings` check, `migrations-journal`, `schema-parity`), và ARC dựng nhánh báo xong.
   - Dự kiến **04/11 tối**. Từ lúc đó mọi PR v1.0.4 đặt base là `main`.
2. **Gói bắt đầu ngay** (mục 5) cắt từ `origin/main` (`e6b0fa6d` hoặc mới hơn).
   - Khi `main@L` có thì `git rebase main` (hoặc merge `main` vào nhánh) trước khi mở PR.
   - Các gói này không chạm tệp LP-v2 đã sửa (danh sách ở mục 4.2), nên rebase sạch.
   - Gói nào lỡ cần sửa một tệp trong danh sách 4.2 thì **dừng ở phần đó**, chờ `main@L`, không tự gộp tay.
3. **Gói chờ `main@L`**: P4-00, P4-01, P4-04, P4-13, P4-32, P4-42. Cùng mọi phần "giai đoạn B" của gói khác: thêm migration, dùng kiểu sinh từ hợp đồng 0.3.12, thêm khóa chữ.
4. **Điểm ORC chốt với PO:** gộp `lp-v2-main` vào `main` nghĩa là production v1.0.4 chứa mã LP-v2 phía máy chủ và Desk.
   - Phần này trơ với khách: không giá trên web khi `public_show_prices=false`, không ngôn ngữ mới khi `LANDING_LOCALES=en,vi`, landing giữ bản đang chạy.
   - Desk có cột/lọc ngôn ngữ S35 và các sửa của LP-v2. Chúng chỉ có tác dụng khi có yêu cầu ko/zh/ru, mà chưa thể có trước khi landing mới lên.
   - Điều kiện: QC LP-v2 không phản đối phần mã máy chủ + Desk. QA v1.0.4 kiểm thêm ca "LP-v2 trơ" (mục 7.2).
   - Nếu PO/QC không chấp nhận: phương án dự phòng ở 2.5.
5. Hotfix v1.0.3.x (nếu lượt BR-428-02 sáng 05/11 ra lỗi tiền) cắt từ **tag `v1.0.3`**, không từ `main@L`. Sau đó gộp ngược vào `main`. Hotfix đi trước mọi gói ở đây.

### 2.2 Số migration (luật 4.2a + journal, decision-log 16–17/10 và 30/10)

| Số | Gói | Nội dung | Ghi chú |
|---|---|---|---|
| 0092 | LP-v2 (đã có trên `main@L`) | locale + giá ước tính | Không đổi |
| **0093** | P4-10 (BE-B) | CHECK `staff_notification.kind` + `hold_overdue_with_deposit`, `hold_overdue_cap` | Chỉ nới, không đổi dữ liệu |
| **0094** | P4-11 (BE-C) | trigger `BEFORE DELETE ON room_list_price` (ED-02) | Chỉ khi SEC nói "cần". Không cần thì bỏ, số sau dồn xuống |
| **0095** | P4-13 (BE-D) | thân hàm `privacy_notice_version_append_only()` (PN-01 Minor) | Không đổi 0090 |
| ~~0096~~ | ~~P4-15 (BE-C)~~ | **Đã bỏ (ORC 04/11).** Không xóa `default_value` và không xóa/kết thúc dòng `config_parameter` hoa hồng: v1.0.3 trả 500 khi quay lui. "Chưa có tỷ lệ" lưu `{}`. Số 0096 trả lại cho GRANT P4-04 nếu cần | – |
| 0097 | P4-04 (OPS + BE-D) | GRANT cho vai chỉ đọc/vai requeue của lệnh vận hành | Chỉ khi OPS cần GRANT trên DB đang chạy. Vai mới cho máy mới vẫn ở `infra/postgres/init/02-roles.sh` |

Luật:
- Số theo **thứ tự gộp vào `main`**. PR gộp lệch thứ tự thì PR gộp sau đổi số: journal idx +1, `when` = số trước + 2000 và tăng nghiêm ngặt, snapshot đầu sinh lại từ migration trước. Không trộn JSON tay.
- Mọi migration v1.0.4 **chỉ nới hoặc thêm**. Quay lui app về `sha-da6d6f3dc22b` không cần lùi DB. OPS ghi điều này vào runbook.
- Chỉ người viết migration được sửa `migrations/meta/*` trong PR của mình, và chỉ **sau** khi rebase lên `main@L`.

### 2.3 OpenAPI 0.3.12
- `main@L` mang **0.3.11** (LP-v2). v1.0.4 nâng **0.3.12-draft**. Một PR, một chủ: **ARC, gói P4-00**.
- Cùng PR sinh lại các tệp sinh ra: `services/api/src/generated/openapi-meta.ts`, `openapi-schemas.ts`; `packages/api-client/src/generated/openapi.ts`.
- ARC cũng sửa tay `packages/api-client/src/types.ts` và `endpoints.ts` cho các trường/op mới. FE và MOB **không** sửa các tệp này. Thiếu gì thì báo ARC.
- Nội dung 0.3.12 xem P4-00 ở mục 3. Không thêm op mới ngoài danh sách đó. Mọi thay đổi khác phải qua ARC.

### 2.4 Strings – tránh xung đột `strings-*.json`
- Nguồn duy nhất là `product/design/tools/gen_strings.py`. Các tệp `design/copy/strings-{vi,en,ru}.json`, `design/wireframes/assets/strings.js`, `design/tools/strings-tables.md` là tệp sinh ra. CI `Copy is generated` bắt mọi sửa tay.
- **Lượt 1 – một chủ (UXD, gói P4-01):**
  - UXD viết bảng chữ `rounds/round-04/outputs/UXD/v1.0.4-copy.md` cho mọi khóa mục 3 cần (khóa, VI, EN, RU nếu hướng khách, ghi chú). Xong **05/11 10:00**.
  - UXD đưa vào `gen_strings.py` trong một PR, cắt từ `main@L`, gộp trước **05/11 12:00**.
  - `content-guide.md` chỉ UXD sửa.
- **Từ 04/11 tới 05/11 12:00:** dev dùng **đúng tên khóa** ở mục 3 (đã đặt sẵn) trong mã. Test cần khóa mới thì để `it.todo` hoặc chạy sau khi rebase lên strings lượt 1.
- **Khóa phát sinh muộn** (sau lượt 1):
  - Dev tự thêm vào `gen_strings.py`, **chỉ trong khối `g("…")` của nhóm mình**, mỗi gói một nhóm riêng có chữ `v1.0.4 <gói>` trong ghi chú.
  - Chạy `python3 design/tools/gen_strings.py` rồi commit cả tệp sinh ra. UXD duyệt chữ trong review PR.
- **Gộp:** khi xung đột ở tệp sinh ra, **không sửa tay**. Lấy bản bất kỳ, chạy lại `gen_strings.py`, commit. Xung đột trong `gen_strings.py` chỉ có khi hai gói sửa cùng nhóm, và luật trên không cho phép việc đó.
- Không ai trong v1.0.4 sửa `packages/i18n/src/translate.test.ts`, `services/api/test/bug-r4-009-plurals.test.ts`, `services/api/src/modules/public-site/internal/website-request-rules.ts`. Ngoại lệ có chủ: P4-14 sửa đúng 1 dòng import ở tệp cuối, sau `main@L`.

### 2.5 Dự phòng nếu `lp-v2-main` chưa gộp được lúc 05/11 12:00
- **(a) Đề xuất – chờ:** P4-00/P4-01 lùi tối đa nửa ngày. Gói bắt đầu ngay vẫn chạy. Mốc cắt 06/11 18:00 lùi sang 07/11 12:00, production vẫn kịp 09–10/11.
- **(b) Cắt từ `origin/main`:** v1.0.4 dùng 0092+ và 0.3.11. LP-v2 phải đổi số lần nữa (0092 → sau v1.0.4) và gộp strings lại. Tốn khoảng 0,5 ngày ARC + BE LP-v2. Chỉ chọn khi PO/QC không cho LP-v2 lên production cùng v1.0.4 (2.1 ý 4).
- ORC quyết (a)/(b) lúc 05/11 12:00.

---

## 3. Bảng gói

Ước lượng tính bằng giờ làm, chưa gồm review.

Cột "Bắt đầu":
- **Ngay** = cắt từ `origin/main` hôm nay.
- **Ngay → B** = phần A làm ngay; phần B (migration/hợp đồng/strings) sau `main@L`.
- **Chờ L** = cắt từ `main@L`.

| Gói | Vai | Việc | AC ngắn | Tệp/module chạm (chỉ gói này sửa) | Phụ thuộc | Bắt đầu | Ước lượng |
|---|---|---|---|---|---|---|---|
| **P4-00** `v104/contract` | ARC | OpenAPI **0.3.12**: (a) `StaffNotification.kind` + `hold_overdue_with_deposit`, `hold_overdue_cap`; `AttentionItem.kind` + `hold_overdue`, `hold_overdue_cap`; mô tả `confirmDeposit` (hold đã nhận > 0 đ: ghi thêm và xác nhận tới khi nhận phòng; `HOLD_EXPIRED` chỉ còn cho hold chưa cọc); (b) `Reservation.manualLongStay.leaseEndDate` (LocalDate, chỉ đọc); (c) `cancelScheduledRoomListPrice` 409 `currentState: first_price`; (d) "Khóa lạc quan": client dùng `version` trong thân, máy chủ nhận `If-Match` có hậu tố nén (V3-09); (e) `setMyEmail`/`updateUser.email` 429 `RATE_LIMITED` 5 lần đổi thành công/người được đổi/24 giờ (EM-09); (f) `StrongReauth.password` bỏ `required` (vắng/rỗng → 422 `STRONG_REAUTH_REQUIRED`), thay `x-rbac-field: D27` ở 6 chỗ "dữ liệu của chính người gọi" bằng `x-self-data: true` (SEC-ARC-018-03); (g) mô tả yêu cầu hoàn thay thế mang nơi nhận (P4-12); (h) ví dụ hoa hồng trong `openapi.yaml` thay bằng tham số thử `test_rate_*` (SEC-DOM-01, G3). Sinh lại tệp sinh ra; sửa `api-client` `types.ts`/`endpoints.ts`. Ghi decision-log | BE-A, BE-B, SEC ghi "đồng ý"; CI xanh; `x-self-data` có trong `openapi-meta.ts` sinh ra | `product/docs/api/openapi.yaml`, `services/api/src/generated/*`, `packages/api-client/src/{types,endpoints}.ts`, `packages/api-client/src/generated/*`, script sinh meta nếu cần đọc `x-self-data` | `main@L`; DOM xác nhận người nhận A.5 (cho (a)) | Chờ L | 5 |
| **P4-01** `v104/strings` | UXD (+CPY chữ hướng khách) | Strings lượt 1 cho mọi khóa ở bảng 3.1; EM-15 (sửa ghi chú khóa chuỗi trong `gen_strings.py`); `content-guide.md` | CI `Copy is generated` xanh; giọng OTTIMO (ngắn, lịch sự, điềm tĩnh, không emoji); VI + EN đủ | `design/tools/gen_strings.py` + tệp sinh ra, `design/content-guide.md`, `rounds/round-04/outputs/UXD/v1.0.4-copy.md` | `main@L` | Chờ L (bảng chữ: Ngay) | 4 + CPY 1 |
| **P4-02** `v104/ops-deploy-order` | OPS | FB-R4-OPS-ARC-31-01: `deploy.sh` lên bản worker → api → web; lùi bản theo thứ tự ngược; test thứ tự trong `rollback.test.sh`; diễn tập lại 5.0 trên staging | Test thứ tự xanh; log diễn tập staging; **gộp trước P4-10** | `infra/server/bin/deploy.sh`, `infra/server/bin/rollback.sh`, `infra/server/test/rollback.test.sh` (đoạn README để P4-04 ghi) | – | **Ngay** | 4 |
| **P4-03** `v104/ops-scripts` | OPS (+INT cho `mail-test.mjs`) | PR32-S2: `requeue-email-changed.sh` so tag chính xác; PR30-10: `mail-test.sh` kiểm `ssh` giả + ca 4c; ARC-OPS-PR30-10: `mail-test.mjs` đọc địa chỉ thử từ dòng đầu stdin; tạo `.github/CODEOWNERS` (`field-policy.ts` → SEC); tạo `.github/pull_request_template.md` với ô "Không ghi tỷ lệ/tiền hoa hồng, thưởng theo bảng nội bộ" (SEC-OPS-01 G4) | Test `.sh` xanh; không địa chỉ email thật trong repo, test hay lịch sử lệnh | `infra/server/bin/requeue-email-changed.sh`, `infra/server/bin/mail-test.sh`, `infra/server/mail-test.mjs`, `infra/server/test/{requeue-email-changed,mail-test-send}.test.sh`, `.github/CODEOWNERS`, `.github/pull_request_template.md` | – | **Ngay** | 3 |
| **P4-04** `v104/ops-check` | OPS (+BE-D nếu cần 0097) | `ops-check.sh`: PR32-02(b) `via owner: <n>`; PR30-08 `email_missing` gồm `locked`; PR32-S1 + PR30-09 các kiểm chỉ đọc chạy bằng `ottimo_readonly` READ ONLY, câu trả lời không phải số → `FAIL`; vai requeue chỉ `SELECT` + `UPDATE` 4 cột `outbox_message`; câu READ ONLY kiểm 2 trigger PN-01. README 13.8 (PR33-S3, SENT-01, giới hạn `mail-test.mjs`), 5.0 (thứ tự deploy P4-02). Runbook mẫu từ v1.0.4 có S0 digest (D1). CI job `confidential-paths` (SEC-OPS-01 G2). **Runbook v1.0.4** | Test `ops-check` xanh; CI `confidential-paths` đỏ khi thử thêm tệp khớp đường dẫn bảng nội bộ (không đưa số vào CI); runbook có mục quay lui `sha-da6d6f3dc22b` không lùi DB | `infra/server/bin/ops-check.sh`, `infra/server/test/ops-check*.test.sh`, `infra/server/README.md`, `.github/workflows/ci.yml`, `infra/postgres/init/02-roles.sh`, `rounds/round-04/outputs/OPS/v1.0.4-release-runbook.md` | `main@L`; P4-13 (câu kiểm trigger); P4-02 | Chờ L (runbook: Ngay) | 6 + runbook 3 |
| **P4-05** `v104/int-email` | INT | CPY-INT-05 (A) + CPY-INT-03: chân thư `NO_LINK_EN/VI` mới cho 5 mẫu bảo mật; bỏ câu chống lừa đảo trùng ở 3 bản `email_changed`; 4 mẫu cũ có dòng "Time:"/"Thời điểm:". PR32-06/31-05 phần INT: xuất `STAFF_EMAIL_TEMPLATES` (gom `email_changed`), test khóa `isStaffEmailTemplate`. INT-BE-31-04: **một** hàm luật địa chỉ email dùng chung (chuẩn hóa + kiểm), adapter SMTP chỉ siết khi `ops-check email_ascii` = 0. G-BE-4 phần mẫu: `staffName` chỉ ở bản `owner` | Test mẫu thư xanh; 5 thư cùng bố cục; brand OTTIMO, EN dẫn – VI hỗ trợ, không emoji; CPY + SEC duyệt chữ | `integrations/notification/email-templates.ts`, `email-templates.test.ts`, `smtp.ts`, `smtp.test.ts`, tệp mới `integrations/notification/email-address.ts` | – | **Ngay** | 4 |
| **P4-06** `v104/be-identity` | BE-A | EM-09 (bắt buộc): đếm `user_email_change` theo `user_id` trong 24 giờ, ≥ 5 → 429 `RATE_LIMITED` + `Retry-After`, kiểm sau RBAC, trước S2 (không tiêu S2). M18-01 phần mã + SEC-SENT-02: luật hộp thư chung so sau khi bỏ `+…`, nhận danh sách hộp thư chung cấu hình được (ít nhất `info@`, `booking@`) **độc lập với `EMAIL_FROM`**; test "đổi `EMAIL_FROM` vẫn chặn `info@`". M18-08: theo SEC chọn (ARC đề xuất: dispatcher bỏ bản `self` của tài khoản `locked`, giữ bản `owner`). G-BE-4 phần dispatcher. INT-BE-31-04 phần API (dùng hàm của P4-05). PR32-06 phần BE (lệnh nhỏ `known-templates` hoặc đường xuất mà `requeue-email-changed.sh` dùng). SEC-BE-018-01 (mảng hằng ghim `SELF_DATA_FIELDS`), 018-02 + ARC-018-03/04 (tách khóa `schema:`/`op:`, ghép chuỗi chỉ ở nhánh từ chối), SEC-ARC-018-03 phần mã (đọc `x-self-data`, xóa `SELF_DATA_FIELDS` hoặc giữ làm kiểm chéo), 018-04 (`noStore()` cho `startSetup`/`confirm`/`regenerate`). Nếu kịp: ARC-BE-31-04 (`access.denied` dùng trường nội bộ của `ProblemError` thay `WeakSet`), V3-04 (`production-bootstrap --owner-email` qua dấu nhắc ẩn) | Test tự động cho từng thẻ; `privacy-log-check.sh` sạch; CI xanh; SEC Verified EM-09, SENT-02, 018-xx | `services/api/src/modules/identity/**` (gồm `security-email.service.ts`, `users.service.ts`, `users.controller.ts`, `mfa.service.ts`, `identity-options.ts`, `strong-reauth.ts`), `services/api/src/jobs/email-dispatch.ts`, `services/api/src/shared/serialization/{field-policy,serializer}.ts`, `services/api/src/shared/http/problem*.ts`, `services/api/src/main.ts` (đọc cấu hình hộp thư chung), `services/api/src/admin/production-bootstrap*.ts`, test `be-a-v103-email-units`, `v103-security-email`, `serializer`, `email-dispatch` | P4-00 (e)(f) cho phần 429 và `x-self-data`; P4-05 (hàm địa chỉ); SEC chọn M18-08 | **Ngay → B** | 16 (+2 V3-04) |
| **P4-10** `v104/be-holds` | BE-B | 042 (P1): `deposits.service.ts` bỏ chặn `HOLD_EXPIRED` khi `depositPaidVnd > 0`, ghi thêm + xác nhận tới khi nhận phòng; hold chưa cọc giữ luật "tiền về trước hạn"; `allowed-actions.ts` ẩn `confirm-deposit` với hold chưa cọc đã quá hạn. 041 + WA-04: `expireOne` đổi `outboxStaffPush` sang `events.notify` (hộp thư + SSE) cho `hold_expired`, `hold_overdue_with_deposit`, `hold_overdue_cap`, người nhận theo DOM A.5; hold có yêu cầu giảm giá/FOC đang chờ vẫn tự hủy được (hủy luôn yêu cầu duyệt). ĐX-R3-QA-01: nguồn tính "Cần chú ý" `hold_overdue` (mọi hold quá hạn, mọi ngày đến, không tắt bằng "Đã xử lý") + `hold_overdue_cap` (MGR/OWN sau 12:00 ngày đến). Migration **0093** | Ca tái hiện bug-list 042: 200, `confirmed`, **Nhận phòng** mở ngày đến; hold chưa cọc: `receivedAt` trước hạn → 200, sau hạn → `HOLD_EXPIRED`; J1 tạo `staff_notification` đúng người nhận A.5; AC 1–3 ĐX-R3-QA-01; test có `MutableClock`; SEC xem lại SEC-BE-22 | `services/api/src/modules/payments/internal/deposits.service.ts`, `services/api/src/modules/reservations/internal/{reservations.service,allowed-actions}.ts`, `services/api/src/jobs/reservation-jobs.ts`, `services/api/src/modules/frontdesk/internal/attention-sources.ts`, `services/api/src/modules/events/**`, `services/api/src/modules/approvals/public/approval.service.ts`, `migrations/0093_*.sql` + meta | P4-00 (a); **P4-02 gộp trước**; DOM A.5 | **Ngay → B** | 20 |
| **P4-11** `v104/be-lease-prices` | BE-C | (2) `leaseEndDate` theo **quyết định ARC 6.1**: suy ra trong `reservation-dto.ts`; check-in ghi khóa `leaseEndDate` vào `manual_long_stay`; B16 chọn BR-313/BR-428 theo ngày này (`stay.service.ts`, `stay-rules.ts`). (3) BUG-R4-015: `rooms.service.cancelScheduledListPrice` không hủy dòng có `effective_from` nhỏ nhất → 409 `first_price` (`only_price` giữ); ED-02 trigger **0094** nếu SEC cần. ETag: `precondition.ts` nhận `"n-gzip"`, `"n-zstd"`, `"n-br"`. FB-R4-QA-DOM-PR25-01 phần BE: `byCalc` gộp `row.params` lên DS-E (hoặc seed `ds-e-0111`); đổi tên test `a7-lease-nights` theo BR-210-01 (QA-DOM-PR25-02) | DOM đóng FB-01; HĐ đã gia hạn: Trả sớm chọn đúng nhánh; BUG-R4-015 bước 1–4, bước 4 → 409; `If-Match: "6-gzip"` → 200; oracle bảng giá 01/11 chạy qua động cơ giá (0 dòng `calc: null` trong danh sách QA-DOM-PR25-01 sau khi DOM đặt `calc`) | `services/api/src/modules/reservations/internal/reservation-dto.ts`, `services/api/src/modules/frontdesk/internal/{checkin.service,stay.service}.ts`, `services/api/src/modules/frontdesk/public/stay-rules.ts`, `services/api/src/modules/platform/internal/rooms.service.ts` (**sau `main@L`**), `services/api/src/shared/http/precondition.ts`, `services/api/test/reservations-pricing.test.ts`, test mới `v104-lease-*.test.ts`, `migrations/0094_*.sql` + meta | P4-00 (b)(c); DOM sửa `calc` (P4-20) cho `byCalc`; SEC quyết ED-02 | **Ngay → B** (lease, ETag, `byCalc`: Ngay; `rooms.service`, 0094: B) | 12 |
| **P4-12** `v104/be-refund-dest` | BE-D | FB-R4-DOM-BA-025-02: Desk tạo yêu cầu hoàn thay thế thì mang nơi nhận sang, theo **thiết kế ARC 6.3**; SEC duyệt trước khi gộp. Audit không chứa số tài khoản | Test: một yêu cầu cũ có nơi nhận → yêu cầu mới có cùng nơi nhận, yêu cầu cũ bị xóa nơi nhận (SEC-BE-45 giữ); hai yêu cầu khác nơi nhận → yêu cầu mới không có, Desk nhắc nhập; khác khách → không mang; log/Problem sạch | `services/api/src/modules/folio/public/{refund-plan,refund-routing,folio.service}.ts`, `services/api/src/modules/payments/internal/refunds.service.ts`, test mới `v104-refund-dest.test.ts` | SEC duyệt thiết kế 6.3 (04/11 tối) | **Ngay** | 6 |
| **P4-13** `v104/be-pn01` | BE-D | PN-01 Minor: `CREATE OR REPLACE FUNCTION privacy_notice_version_append_only()` so cả hàng trừ `superseded_at`, `superseded_at` trong khoảng `published_at`…`now()`; chú thích ENABLE/replica/`pg_restore`/"chỉ-thêm ở mức DML"; test `tgenabled = 'O'`, `ottimo_app` chỉ SELECT; `publish-privacy-notice.sql` vẫn chạy được. Migration **0095** | Test xanh; ARC + SEC review; không đổi 0090 | `migrations/0095_*.sql` + meta, test `privacy-notice-append-only*.test.ts` | `main@L` (journal có 0092) | Chờ L | 4 |
| **P4-14** `v104/be-sensitive` | BE-D | PR24PM-02: chỉ xóa cụm ngày hợp lệ, không nằm trong chuỗi ≥ 4 nhóm hai chữ số; 2 ca "phải chặn", giữ mọi ca "không được che". PR24PM-03: `log-line.ts` `try/catch` (`logError: "UNSERIALIZABLE"`) + test. PR24PM-04: ESLint `no-console` cho `worker*.ts`, `jobs/**`; dòng lỗi khởi động qua `logLine` không kèm `err.message`. **Sau `main@L`:** PR24PM-01: chuyển `sensitive-number.ts` sang `src/shared/`, `containsCardNumber` gọi nửa thẻ của bộ dò mới (OR với luật cũ), test kiến trúc "ngoài `shared/` không tự viết Luhn"; `guest-portal` áp dụng chỉ khi SEC duyệt | Test xanh; SEC + QA review | `services/api/src/modules/public-site/internal/sensitive-number.ts` (→ `src/shared/sensitive-number.ts`), `services/api/src/shared/{log-line,validation}.ts`, `product/eslint.config.js`, `services/api/src/worker*.ts`, 1 dòng import ở `website-request-rules.ts` (sau `main@L`) | `main@L` cho PR24PM-01 | **Ngay → B** | 6 |
| **P4-15** `v104/be-commission-nodefault` (điều kiện) | BE-C | SEC-BE-01 phần làm được trước H2: khóa hoa hồng ngắn ngày không có mặc định trong mã (`production-defaults.ts`, `ds-e.json`, `default_value` qua **0096**); thiếu tỷ lệ → API trả trạng thái "chưa có tỷ lệ", không tính bằng 0 hay số cũ. Cấu trúc mới (thuê tháng, lịch chi, thưởng) **ở H2**, không ở đây | Test dùng `test_rate_*` (G3); không số thật trong repo | `services/api/src/admin/production-defaults.ts`, seed DS-E, `migrations/0096_*.sql`, nơi tính hoa hồng (BE-C xác định, báo ARC trước khi sửa) | **ORC quyết 04/11: dời trọn sang H2** (hạn 01/12); bỏ 0096 – xem dòng 0096 bảng migration | Dời H2 | 3 |
| **P4-20** `v104/dom-br-fixtures` | DOM + QA | PO-DOM-PR25-01…05 + SEC-DOM-01: nhãn hoa hồng "trước 01/11 – hết hiệu lực", không số mới, `INV-043` cho 16 dòng + BR-114-02, `GIẢ ĐỊNH` BR-208-01/02, nhãn mục 0.1 + `conventions.labels`, không dùng lại id. QA-DOM-PR25-01 phần DOM: đặt `calc` cho các dòng bảng giá 01/11. QA-DOM-PR25-02…05, BA-DOM-PR25-01…04, S1–S3 (gộp ý trùng, làm một lần). BUG-R4-025 phần BR-428 (câu nhánh OTA). Test case và màn mẫu hifi có số cũ ghi "ví dụ theo tỷ lệ cũ" | `validate-fixtures` 0 lỗi; QA chạy lại oracle; PO, BA, SEC đóng thẻ | `product/docs/business-rules.md`, `product/tests/fixtures/br-examples.json` (và fixtures BR khác, **trừ** `rbac-cases.json`), `product/tests/test-cases/**` (QA) | – | **Ngay** | DOM 6 + QA 4 |
| **P4-21** `v104/uxd-manual-font` | UXD | Sổ tay HTML một tệp nhúng font (L1): `build_manual.py` dùng chung cách nhúng font của `build_guides.py` | Mở khi mất mạng vẫn đúng Lora / Be Vietnam Pro; 390/1440 không tràn | `product/design/tools/build_manual.py` (+ helper chung nếu tách) | – | **Ngay** | 2 |
| **P4-30** `v104/fe-users-2fa` | FE-A | **BUG-R4-020** (ưu tiên cao, đi cùng RN103-02): menu **Khác…** ở Người dùng & vai: Đặt lại mật khẩu, Khóa tài khoản, **Đặt lại xác thực 2 bước** (`resetUser2fa`, hộp S2 `StrongReauthDialog`). BUG-R4-023 (cột Email không ngắt giữa địa chỉ ở 1440). BUG-R4-024 (`reauth.s2_failed_password`). UXD-FE-EM-07 (bỏ `margin: 0`, cách 12 px, 9 hộp), EM-13 (nút "Sửa email" khi mất mạng), EM-14 (focus ô mật khẩu khi máy chủ báo thiếu mã) | Ca QA BUG-R4-020/023/024; ảnh 1366/1440; ảnh C1-07, C1-22 chụp lại sau 023; trạng thái tải/rỗng/lỗi; brand OTTIMO | `apps/admin-web/src/pages/{UsersPage,UserEmailDialog}.tsx`, tệp mới `apps/admin-web/src/pages/UserMoreMenu.tsx`, `apps/admin-web/src/components/{StrongReauthDialog,SecurityEmailCard}.tsx`, `packages/ui/src/styles/app.css` (**FE-A là chủ duy nhất ở v1.0.4**, sửa sau `main@L`), test mới `v104-users-fea.test.tsx` | Strings P4-01 | **Ngay → B** | 8 |
| **P4-31** `v104/fe-lease-ed` | FE-A | Hộp **Trả sớm** dùng `manualLongStay.leaseEndDate`: `lease = stayType === 'long' && newDate < leaseEndDate`; chữ `lease_rule_paid` thêm "phát sinh chưa thu" (BR-214); BUG-R4-025 chữ Desk `early_departure.row_refund_help` | DOM duyệt; test HĐ đã gia hạn; UXD chốt chữ | `apps/admin-web/src/pages/stay/EarlyDepartureDialog.tsx`, test `r4-bug014-early-departure-lease.test.tsx` (+ test mới) | P4-00 (b), P4-01 | **Ngay → B** | 3 |
| **P4-41** `v104/fe-money-labels` | FE-A | BUG-R4-026: map `overpayment` (+ `early_departure`) → chữ ở Nhật ký thao tác tiền, hàng Cần duyệt, Hoàn tiền. GN-R4-QA-01 (quyết định ARC 6.4): ghi chú "Số có thể giảm khi duyệt" trên hàng chờ duyệt yêu cầu hoàn. BUG-R2-103 (folio hai dòng "Còn phải thu"). BUG-R2-097 (dấu trừ thừa). BUG-R3-045 (`error.FOLIO_LOCKED` + ẩn **Điều chỉnh**/**Thêm phát sinh** khi folio khóa) | Desk không hiện mã thô; ca bug-list từng dòng | `apps/admin-web/src/app/auditReason.ts`, `apps/admin-web/src/pages/approvals/ApprovalsPage.tsx`, `apps/admin-web/src/pages/money/MoneyPage.tsx`, `apps/admin-web/src/pages/stay/{FolioDialog,StayDialogs}.tsx` | P4-01 | **Ngay → B** | 5 |
| **P4-33** `v104/fe-maint-rooms` (nếu kịp) | FE-A | BUG-R3-053 (quyết định ARC 6.5): vai chỉ Bảo trì lấy danh sách căn từ `room-statuses` (như app nhân viên), không mở `listRooms` cho `maintenance`, không đổi hợp đồng | Tài khoản chỉ vai Bảo trì tạo được phiếu sửa và khóa phòng có kế hoạch trên Desk | `apps/admin-web/src/pages/ops/{MaintenancePage,WorkOrderForms}.tsx` | – | **Ngay** | 3 |
| **P4-40** `v104/fe-holds` | FE-B | 042: ô **Giờ nhận tiền** (FD+, mặc định bây giờ, không cho tương lai), ẩn nút với hold chưa cọc đã quá hạn. 043: ô **Chấp nhận cọc thiếu – lý do** (OWN/MGR, ≥ 3 ký tự; FD/FDL/SAL không thấy). 044 + BA M13-03: khung đơn, câu `HOLD_EXPIRED` có cọc, hộp hủy hiện số sẽ hoàn. ĐX: khối Hôm nay "Giữ chỗ chờ cọc (n)", "Cần chú ý" hiện `hold_overdue`/`hold_overdue_cap`, nhãn 3 kind thông báo mới. BUG-R2-216 (bỏ in hai lần số cọc + nội dung chuyển khoản), 219 (khách đến hôm nay: không hiện bộ chọn thời hạn và mốc đã qua), BUG-R3-046 (lý do **Khác** gửi `note` khi tính thử), 047 (ẩn nút link check-in trên đơn giữ chỗ) | Ca bug-list 042/043/044, AC ĐX 1–3; ảnh 1366/1440; VI + EN; trạng thái tải/rỗng/lỗi | `apps/admin-web/src/pages/reservations/{ReservationDialogs,ReservationDrawer}.tsx`, `apps/admin-web/src/pages/{TodayPage,OverviewPage}.tsx`, `apps/admin-web/src/pages/dashboard/{parts.tsx,useDashboard.ts}`, `apps/admin-web/src/app/{attention,reservations}.ts`, `apps/admin-web/src/pages/booking/BookingDialog.tsx` và `pages/quotes/QuoteDialog.tsx` (216/219, **sau `main@L`**), test mới `v104-holds-feb.test.tsx` | P4-00 (a), P4-01; API P4-10 (code song song bằng mock theo hợp đồng) | **Ngay → B** | 14 |
| **P4-32** `v104/fe-checkout` | FE-B | GN-R4-QA-03: H16 bước ③ Bill và màn Kết quả có dòng "Đang chờ hoàn cho khách … đ (yêu cầu từ Trả sớm)", lấy từ API sẵn có (yêu cầu hoàn của đơn); thiếu trường thì báo ARC, không đổi hợp đồng ở v1.0.4. BA-025-07 nếu UXD chọn hiện số. BUG-R3-024 (màn Trả phòng trước ngày đi chỉ dẫn sang **Trả sớm**) | QA đọc đúng số với OTM thử có B16; VI/EN theo brand | `apps/admin-web/src/pages/stay/{CheckOutPage,CheckInPayment,PaymentPanel}.tsx` | `main@L` (`CheckOutPage.tsx` LP-v2 đã sửa); P4-01 | Chờ L | 4 |
| **P4-42** `v104/guest-privacy-v2` | MOB (FE-B dự phòng) | V3-08: trang khách hiện thông báo `privacy-2026-10-v2` vi/en/ru (tiếng Nga đã duyệt, không rơi về EN – `RU_UNREVIEWED_LEGAL`); `NOTICE_TEXT_VERSIONS` nhận v2; đồng ý ghi đúng version; tờ **Your ID details** cùng chữ | QA đối chiếu từng câu 3 ngôn ngữ và tờ in; SEC kiểm sau production → ORC báo INV mở lại check-in online | `apps/guest-web/src/app/config.ts`, `apps/guest-web/src/checkin/CheckinFlow.tsx`, khối chữ khách trong `gen_strings.py` (nhóm riêng); nếu chữ cổng khách nằm ở `services/api/scripts/gen-portal-copy.mjs` thì sinh lại tệp sinh ra | `main@L`; **chữ gốc SEC + bản ru CPY trước 06/11 10:00**; UXD tờ in | Chờ L | 4 |
| **P4-50** `v104/mob-2fa` | MOB | **ARC-RN103-02** (ưu tiên cao): `401 MFA_REQUIRED` → màn nhập mã 6 số hoặc mã khôi phục → `loginMfa` (như Desk `MfaStep.tsx`: một lỗi `MFA_INVALID`, quay về bước 1 sau 5 phút hoặc 5 lần sai); bỏ chuỗi "Đăng nhập 2 bước sẽ có ở bản sau" (`auth.mfa_later`: bỏ dùng, xóa khóa khi rebase). **Không** ẩn nút Bật 2 bước với buồng phòng/bảo trì. BUG-R3-052: `Me.mustChangePassword` → màn đặt mật khẩu (hoặc tối thiểu báo đúng `PASSWORD_CHANGE_REQUIRED` / `MFA_ENROLLMENT_REQUIRED` dẫn sang Desk, UXD chọn), không báo "mạng yếu". Kiểm luôn hộp Thông báo hiện nhãn cho kind mới (không mã thô – BUG-R4-021) | QA thử **cả 7 vai** đăng nhập app có 2 bước (mã TOTP, mã khôi phục, sai 5 lần); mật khẩu tạm; brand OTTIMO; chạy được trên 390 px | `apps/mobile/src/pages/{LoginPage,MePage,NotificationsPage}.tsx`, tệp mới `apps/mobile/src/pages/{MfaStepPage,SetPasswordPage}.tsx`, `apps/mobile/src/app/{session,api,router}.ts`, `apps/mobile/src/mocks/handlers.ts`, test mobile mới | Dùng khóa `mfa.*` có sẵn; khóa mới (nếu có) theo luật 2.4 | **Ngay → B** | 10 |

### 3.1 Khóa chữ đặt sẵn (UXD viết chữ ở P4-01)
Tên khóa do ARC đặt để dev viết mã ngay. UXD được đổi chữ, **không** đổi tên khóa. Muốn đổi tên thì báo ARC + dev cùng lúc.

| Gói | Khóa |
|---|---|
| P4-30 | `users.more` (nút "Khác…"), `users.reset_2fa`, `users.reset_2fa_confirm`, `users.reset_2fa_done`, `reauth.s2_failed_password`. Dùng lại `users.more_help` |
| P4-31 | `early_departure.lease_rule_paid` (sửa), `early_departure.row_refund_help` (sửa) |
| P4-41 | `audit.reason.overpayment`, `audit.reason.early_departure`, `approvals.refund_may_decrease`, `error.FOLIO_LOCKED` (sửa) |
| P4-40 | `deposit.received_at`, `deposit.received_at_help`, `deposit.accept_shortfall`, `deposit.accept_shortfall_reason`, `hold.paid_overdue_banner`, `error.HOLD_EXPIRED_PAID`, `cancel.refund_preview`, `today.holds_waiting` ("Giữ chỗ chờ cọc ({n})"), `attention.hold_overdue`, `attention.hold_overdue_cap`, `notif.hold_overdue_with_deposit`, `notif.hold_overdue_cap`, `notif.hold_expired` (nếu chưa có) |
| P4-32 | `checkout.pending_refund_line`, `checkout.use_early_departure` |
| P4-50 | dùng `mfa.*`; nếu cần: `staff.temp_password_desk`, `staff.mfa_enroll_desk`. Xóa `auth.mfa_later` |
| P4-42 | khóa thông báo khách bản 2 do SEC/CPY đặt trong nhóm riêng |

---

## 4. Bản đồ chủ tệp

### 4.1 Tệp nóng – một chủ trong v1.0.4

| Tệp | Chủ | Người khác cần sửa thì |
|---|---|---|
| `product/docs/api/openapi.yaml`, `services/api/src/generated/*`, `packages/api-client/src/**` | ARC (P4-00) | Gửi ARC; ARC làm bản bổ sung 0.3.12 |
| `design/tools/gen_strings.py` + tệp sinh ra, `design/content-guide.md` | UXD (P4-01) lượt 1; sau đó từng gói trong nhóm riêng (2.4) | – |
| `services/api/src/db/migrations/meta/*` | Gói có migration, theo thứ tự gộp | Đổi số theo 2.2 |
| `reservations.service.ts`, `allowed-actions.ts`, `deposits.service.ts`, `approval.service.ts`, `attention-sources.ts`, `events/**`, `jobs/reservation-jobs.ts` | BE-B (P4-10) | Báo BE-B |
| `reservation-dto.ts`, `checkin.service.ts`, `stay.service.ts`, `stay-rules.ts`, `rooms.service.ts`, `precondition.ts`, `reservations-pricing.test.ts`, `production-defaults.ts` | BE-C (P4-11, P4-15) | Báo BE-C |
| `folio/public/{refund-plan,refund-routing,folio.service}.ts`, `payments/internal/refunds.service.ts`, `sensitive-number.ts`, `shared/{log-line,validation}.ts`, `eslint.config.js` | BE-D (P4-12, P4-14) | Báo BE-D |
| `identity/**`, `jobs/email-dispatch.ts`, `shared/serialization/*`, `shared/http/problem*.ts`, `main.ts`, `admin/production-bootstrap*.ts` | BE-A (P4-06) | Báo BE-A |
| `integrations/notification/**` | INT (P4-05) | – |
| `infra/server/**`, `.github/**`, `infra/postgres/init/**` | OPS (P4-02/03/04) | – |
| `apps/admin-web/src/pages/{UsersPage,UserEmailDialog,UserMoreMenu}.tsx`, `components/{StrongReauthDialog,SecurityEmailCard}.tsx`, `stay/{EarlyDepartureDialog,FolioDialog,StayDialogs}.tsx`, `approvals/**`, `money/**`, `app/auditReason.ts`, `ops/{MaintenancePage,WorkOrderForms}.tsx`, `packages/ui/src/styles/app.css` | FE-A | Báo FE-A |
| `reservations/{ReservationDialogs,ReservationDrawer}.tsx`, `{TodayPage,OverviewPage}.tsx`, `dashboard/*`, `app/{attention,reservations}.ts`, `booking/BookingDialog.tsx`, `quotes/QuoteDialog.tsx`, `stay/{CheckOutPage,CheckInPayment,PaymentPanel}.tsx` | FE-B | Báo FE-B |
| `apps/mobile/**`, `apps/guest-web/**` | MOB | – |
| `docs/business-rules.md`, `tests/fixtures/br-examples.json` | DOM (+QA phần test case) | – |
| `apps/admin-web/src/mocks/{handlers,reservations}.ts` | **Không ai sửa ở v1.0.4** | Mock riêng trong test (`server.use(...)`) hoặc tệp mock mới chỉ test của gói import |

### 4.2 Tệp LP-v2 đã sửa – gói "Ngay" không được chạm trước `main@L`
- Danh sách xung đột ORC đã liệt kê:
  - `ci.yml`, `content-guide.md`, `strings-*.json`, `gen_strings.py`, `strings-tables.md`, wireframes `strings.js`;
  - `openapi.yaml`;
  - infra `README.md`, `deploy-landing.sh`, `ops-check.sh`;
  - i18n `translate.test.ts`, migrations meta, `website-request-rules.ts`, `bug-r4-009-plurals.test.ts`.
- Cộng các tệp LP-v2 có sửa (rebase có thể vấp):
  - Desk: `AppShell.tsx`, `GuestPicker.tsx`, `GuestFormDialog.tsx`, `RoomDrawer.tsx`, `BookingDialog.tsx`, `LongStayDialog.tsx`, `QuoteDialog.tsx`, `CheckOutPage.tsx`, `pages/webreq/**`, `mocks/{handlers,reservations,webreq}.ts`;
  - guest-web `CheckinFlow.tsx`, `HomePage.tsx`;
  - packages: `packages/ui/src/{Controls.tsx,styles/app.css}`, `packages/contracts/**`, `packages/api-client/**`, `packages/i18n/src/translate.ts`;
  - API: `platform/internal/{parameter-rules,parameters.service,platform.controller,rooms.service}.ts`, `platform/public/{parameter-hooks,parameter.service}.ts`, `platform/audit-entities.ts`, `crypto/public/crypto.service.ts`, `public-site/**`, `reservations/public/public-rate*.ts`, `reservations/reservations.module.ts`, `sales/internal/quotes.service.ts`, `services/api/src/db/schema/public-site.ts`, `services/api/test/integration/sales.test.ts`;
  - khác: `tests/fixtures/rbac-cases.json`, `product/.env.example`, `infra/server/{env.example,env.production.example}`, `docker-compose.prod.yml`, `turbo.json`, `pnpm-lock.yaml`, các `package.json`.
- Phần nào của gói chạm các tệp này thuộc "giai đoạn B" (sau `main@L`).

---

## 5. Gói bắt đầu NGAY từ `origin/main`

| Gói | Vai | Phần làm ngay | Phần chờ `main@L` |
|---|---|---|---|
| P4-02 | OPS | toàn bộ | – (đoạn README → P4-04) |
| P4-03 | OPS | toàn bộ | – |
| P4-05 | INT | toàn bộ | – |
| P4-06 | BE-A | mọi thẻ trừ phần đọc kiểu sinh từ 0.3.12 | mã lỗi 429 trong meta, `x-self-data`, khóa chữ (nếu có) |
| P4-10 | BE-B | logic 042, 041 + WA-04, ĐX; test đơn vị | migration 0093, test tích hợp kind mới, enum hợp đồng |
| P4-11 | BE-C | `leaseEndDate` (dto, check-in, B16), ETag, `byCalc` | `rooms.service.ts` (BUG-R4-015), 0094 |
| P4-12 | BE-D | toàn bộ (sau khi SEC duyệt 6.3) | – |
| P4-14 | BE-D | PR24PM-02, 03, 04 | PR24PM-01 (import ở `website-request-rules.ts`) |
| P4-20 | DOM + QA | toàn bộ | – |
| P4-21 | UXD | toàn bộ | – |
| P4-30 | FE-A | menu Khác…, hộp S2, focus, mất mạng (dùng khóa đặt sẵn 3.1) | CSS `app.css` (023, EM-07), khóa chữ |
| P4-31 | FE-A | logic hộp Trả sớm theo `leaseEndDate` (mock theo hợp đồng) | kiểu `leaseEndDate` từ api-client, khóa chữ |
| P4-33 | FE-A | toàn bộ (nếu kịp) | – |
| P4-40 | FE-B | 042/043/044/ĐX/046/047 trong `ReservationDialogs`/`ReservationDrawer`/`TodayPage`/`attention.ts` | 216/219 (`BookingDialog`, `QuoteDialog`), kiểu kind mới, khóa chữ |
| P4-41 | FE-A | toàn bộ trừ khóa chữ | khóa chữ |
| P4-50 | MOB | toàn bộ (dùng `mfa.*` có sẵn) | xóa `auth.mfa_later`, khóa mới (nếu có) |

**Chờ `main@L` từ đầu:** P4-00 (ARC), P4-01 (UXD), P4-04 (OPS), P4-13 (BE-D), P4-15 (BE-C, điều kiện), P4-32 (FE-B), P4-42 (MOB).

---

## 6. Quyết định ARC trong kế hoạch này

Thuộc quyền ARC. ORC ghi decision-log khi commit.

1. **`leaseEndDate` – đổi cách so với tech plan v1.0.3**, để BE-C không phải sửa `reservations.service.ts` (của BE-B):
   - Check-in đơn `stay_type = 'long'` có `manual_long_stay` → ghi khóa `leaseEndDate = departure_date` vào jsonb `manual_long_stay`, trong cùng giao dịch check-in (`checkin.service.ts`).
   - DTO (`reservation-dto.ts`) đọc theo thứ tự: khóa trong jsonb → nếu đơn chưa nhận phòng thì `departure_date` → còn lại `booked_departure_date` (đơn cũ).
   - B13/B16 không đổi khóa. Không thêm cột, không migration.
   - Giới hạn đã biết: đơn đã nhận phòng **trước** v1.0.4 mà đổi ngày HĐ bằng `PATCH` trước khi nhận phòng sẽ lấy `booked_departure_date`. Production chưa vận hành thật (decision-log 01/11), nên BE-C chỉ cần đếm số đơn như vậy trong runbook. Có đơn thì OPS báo DOM.
2. **ETag:** máy chủ nhận `If-Match` có hậu tố nén `-gzip`/`-zstd`/`-br`. Hợp đồng ghi client ưu tiên `version` trong thân. Không chỉnh Caddy.
3. **Yêu cầu hoàn thay thế mang nơi nhận (P4-12):**
   - Trong `refundPlan`, khi đóng các yêu cầu đang chờ của **cùng đơn** và tạo **một** yêu cầu thay thế:
     - nếu mọi yêu cầu bị đóng có nơi nhận đều cùng **một** nơi nhận và cùng khách nhận → chép nơi nhận sang yêu cầu mới **trong cùng giao dịch**, rồi mới xóa ở yêu cầu cũ theo SEC-BE-45;
     - khác nhau hoặc không có → yêu cầu mới không có nơi nhận, Desk nhắc nhập như hiện nay.
   - Chép bằng dịch vụ mã hóa (C3), không đưa số tài khoản ra log, audit hay Problem. Audit `refund.destination_carried`, chỉ có mã yêu cầu.
   - Yêu cầu mới vẫn **Chờ duyệt**.
   - **SEC duyệt** vì đổi so với SEC-BE-45. SEC không duyệt thì P4-12 dừng; giữ cách tạm ở sổ tay 1.8 bước 4 và release notes.
4. **GN-R4-QA-01:** v1.0.4 **không** tính lại yêu cầu hoàn lúc ghi phát sinh mới. Giữ chốt lúc duyệt: 409 `superseded`, không hoàn quá được. Desk thêm ghi chú "Số có thể giảm khi duyệt" (P4-41). Tính lại ngay khi ghi phát sinh để cùng ED-03 (v1.1).
5. **BUG-R3-053:** Desk lấy danh sách căn từ `room-statuses` cho tài khoản chỉ có vai Bảo trì. Không mở `listRooms` cho `maintenance`, không đổi hợp đồng, không đổi `rbac-cases.json`.
6. **EM-09:**
   - Đếm theo người **được đổi** (`user_email_change.user_id`), mọi `via`, 24 giờ trượt.
   - Kiểm sau RBAC, trước S2. Lần thứ 6 nhận 429 `RATE_LIMITED`, `Retry-After` = giây tới khi lần cũ nhất ra khỏi cửa sổ.
   - Không cần migration: bảng nhỏ, đã có cột `changed_at`.
7. **M18-08 (đề xuất cho SEC chọn):** dispatcher bỏ bản `self` (và `previous`) của tài khoản `locked`, vẫn gửi bản `owner`. Không xóa email khi khóa, vì mở khóa lại thì cần.
8. **OPS-ARC-31-01 là bắt buộc của v1.0.4:** P4-10 thêm kind và đổi J1 sang `events.notify`. P4-02 gộp **trước** P4-10.
9. **SEC-BE-01:** đề xuất để trọn trong H2 (hạn 01/12). Lý do: H2 đổi cấu trúc khóa hoa hồng, nên làm "không mặc định" một lần ở H2. P4-15 chỉ làm nếu ORC muốn gỡ số cũ khỏi bản dựng mới ngay ở v1.0.4.

---

## 7. Review, QA, QC và lịch

### 7.1 Review bắt buộc (protocol mục 5)

| Gói | Review bắt buộc | Khuyến nghị |
|---|---|---|
| P4-00 (ARC) | BE-A, BE-B, SEC | OPS, MOB, FE-A |
| P4-01 (UXD) | PO, UXR (rút gọn: PO + CPY cho chữ hướng khách) | FE-A, FE-B, MOB |
| P4-02/03/04 (OPS) | ARC, SEC | – |
| P4-05 (INT) | ARC, SEC; CPY (chữ thư) | BE-A |
| P4-06 (BE-A) | ARC, QA, **SEC** (bảo mật) | – |
| P4-10 (BE-B) | ARC, QA, **SEC** (SEC-BE-22, đường tiền) | DOM (người nhận A.5) |
| P4-11 (BE-C) | ARC, QA; DOM (BR-313/428); SEC (ED-02) | – |
| P4-12/13/14 (BE-D) | ARC, QA, **SEC** | – |
| P4-20 (DOM) | PO, BA; SEC (số hoa hồng) | QA |
| P4-30/31/41/33, P4-40/32 (FE) | UXD, QA | ARC |
| P4-50, P4-42 (MOB) | UXD, QA; **SEC** (đăng nhập 2 bước, thông báo xử lý dữ liệu) | ARC |

**Gom PR khi gộp** (mỗi PR bỏ được khỏi tag mà không phải gỡ mã):

| PR | Gồm | Ghi chú |
|---|---|---|
| PR-A | P4-02 | Gộp đầu tiên |
| PR-B | P4-00 | – |
| PR-C | P4-01 | – |
| PR-D | P4-05 + P4-06 | Một PR, theo yêu cầu PR32-06 |
| PR-E | P4-50 + P4-30 | RN103-02 + BUG-R4-020 |
| PR-F | P4-10 + P4-40 | Giữ chỗ, **0093** |
| PR-G | P4-11 + P4-31 | **0094** |
| PR-H | P4-13 | **0095** |
| PR-I | P4-12 | – |
| PR-J | P4-14 | – |
| PR-K | P4-41 + P4-32 + P4-33 | – |
| PR-L | P4-42 | – |
| PR-M | P4-04 | Gộp cuối, sau PR-H |
| PR-N | P4-20 | Gộp lúc nào cũng được |
| PR-O | P4-21 | Gộp lúc nào cũng được |

### 7.2 QA

**Lượt 1 – trên stack thử của từng PR** (05/11 chiều – 06/11). `MutableClock` được phép cho giữ chỗ.
- Ca theo bug-list cho từng dòng.
- Ca SEC: EM-09, SENT-02, 018-xx.
- Dữ liệu thử chỉ `…@example.test`, hoa hồng chỉ `test_rate_*`. Ảnh kiểm qua che theo G4.

**Lượt 2 – staging, giờ thật:**
- **06/11 tối:** QA tạo các giữ chỗ ngắn nhất cho phép: có cọc một phần, chưa cọc, có yêu cầu giảm giá chờ duyệt. Chúng hết hạn trong đêm.
- **07/11:** kiểm
  - 3 lối ra: xác nhận cọc, chấp nhận cọc thiếu, hủy hoàn;
  - J1 vào hộp thư + SSE đúng người nhận; "Cần chú ý" `hold_overdue`, sau 12:00 `hold_overdue_cap`;
  - DOM thử lại 3 lối ra (điều kiện bỏ cách tạm DOM-09);
  - app nhân viên **7 vai** đăng nhập 2 bước, đặt lại 2 bước từ Desk (S2), mật khẩu tạm;
  - `leaseEndDate`; BUG-R4-015 bước 1–4; ETag `-gzip`;
  - thông báo `privacy-2026-10-v2` 3 ngôn ngữ + tờ in;
  - hồi quy `smoke-prod` 9/9;
  - **LP-v2 trơ**: `public_show_prices=false`, form landing đang chạy không đổi, S35 không lỗi.

### 7.3 SEC
- Duyệt trong ngày 04/11:
  - thiết kế 6.3 (nơi nhận yêu cầu thay thế);
  - chọn M18-08;
  - ED-02 cần hay không;
  - PR24PM-01 áp cho `guest-portal`.
- Chữ gốc `privacy-2026-10-v2`: **06/11 10:00**.
- Review PR-D, F, H, I, J, L, E.
- Sau production:
  - kiểm thông báo bản 2 rồi báo ORC mở lại check-in online;
  - xác nhận G4 (ảnh) trước QC.

### 7.4 QC rút gọn v1.0.4 – 08/11 sáng
Điều kiện:
- Không P0/P1 mở.
- Đủ các dòng "bắt buộc": EM-09, PR32-06/31-05, OPS-31-01 (diễn tập 5.0), V3-08, QA-DOM-PR25-01, PO-DOM-PR25-01 + SEC-DOM-01, SEC-OPS-01 mẫu PR, SEC-ORC-01 G4.
- Runbook v1.0.4 có quay lui về `sha-da6d6f3dc22b`.
- Release notes v1.0.4 (PO): bỏ "chưa bật 2 bước ở v1.0.x", mở lại check-in online khi SEC kiểm xong.
- Sổ tay (BA): bỏ câu "chưa bật 2 bước" ở `01` 1.8/1.9, `02`, `03`, `04`; thêm đường **Đặt lại xác thực 2 bước**; bỏ cách tạm giữ chỗ sổ tay 2.4 sau khi QA đạt; M18-08.
- UXD dựng lại HTML sổ tay (đã nhúng font nhờ P4-21).
- Mọi tài liệu trình INV theo brand OTTIMO.

### 7.5 Lịch

| Ngày | Giờ | Việc |
|---|---|---|
| **04/11 (T4)** | chiều – tối | Giao các gói "Ngay" (mục 5). SEC quyết 4 điểm 7.3. DOM xác nhận người nhận A.5. UXD viết bảng chữ. ARC khác hoàn tất `lp-v2-main` → ORC gộp vào `main` (= `main@L`) khi CI xanh |
| **05/11 (T5)** | 06:07–10:00 | QA chạy BR-428-02 giờ thật cho v1.0.3 trên staging. **Không deploy staging trước 10:00.** Lỗi tiền → hotfix v1.0.3.x đi trước |
| | 10:00 | P4-00 hợp đồng 0.3.12 gộp (BE-A, BE-B, SEC đồng ý) |
| | 12:00 | P4-01 strings lượt 1 gộp. ORC quyết dự phòng 2.5 nếu chưa có `main@L` |
| | chiều | Mọi gói rebase lên `main`, làm giai đoạn B. Migration 0093–0095 theo thứ tự PR-F → G → H. PR-A, PR-D, PR-E mở review + QA lượt 1 |
| **06/11 (T6)** | sáng | PR-F, G, H, I, J, K mở review + QA lượt 1. Chữ SEC bản 2 lúc 10:00 → P4-42 |
| | **18:00** | **Cắt v1.0.4.** ORC gộp PR đạt review bắt buộc + QA lượt 1. PR chưa đạt → v1.0.5 (trừ dòng "bắt buộc": ORC báo PO dời mốc trong khung 10/11) |
| | 19:00 | INV duyệt deploy staging. QA tạo giữ chỗ chờ hết hạn |
| **07/11 (T7)** | cả ngày | QA lượt 2 (7.2), DOM thử 3 lối ra, SEC kiểm. Vòng sửa lỗi. ESC-049 hạn trả lời |
| **08/11 (CN)** | 09:00 | **QC rút gọn** |
| | chiều | **Production v1.0.4** (INV duyệt Release, runbook v1.0.4) |
| **09–10/11** | – | Dự phòng. **10/11 hạn chót** |

### 7.6 Tải theo người (giờ, chưa tính review)

| Người | Gói | Tổng | Ghi chú |
|---|---|---|---|
| ARC | P4-00 5 + review ~8 | ~13 | Review PR-A…M |
| BE-A | P4-06 16 (+2) | 16–18 | – |
| BE-B | P4-10 20 | 20 | Đường găng nhóm (1) |
| BE-C | P4-11 12 (+P4-15 3) | 12–15 | – |
| BE-D | P4-12 6 + P4-13 4 + P4-14 6 | 16 | ORC chưa mở làn BE-C/BE-D thì: P4-11 → BE-A sau P4-06; P4-12/13/14 → BE-B sau P4-10 (v1.0.4 lùi về 10/11) |
| FE-A | P4-30 8 + P4-31 3 + P4-41 5 (+P4-33 3) | 16–19 | – |
| FE-B | P4-40 14 + P4-32 4 | 18 | – |
| MOB | P4-50 10 + P4-42 4 | 14 | – |
| OPS | 4 + 3 + 6 + runbook 3 | 16 | + deploy staging/production |
| INT | P4-05 4 | 4 | – |
| UXD | P4-01 4 + P4-21 2 + review | ~10 | – |
| DOM / QA | P4-20 6 / 4 + QA lượt 1–2 | – | – |

---

## 8. Brief giao việc

ORC dán nguyên văn vào lệnh giao. Mỗi brief đã kèm round, bước, nhánh, tệp đọc/ghi. Quy tắc chung cho mọi brief:
- **Round 4 – v1.0.4 – Bước: Sản xuất.** Đọc `rounds/round-04/plan-v1.0.4.md` mục 2, 4 (chủ tệp) và dòng gói của mình ở mục 3.
- Không sửa tệp ngoài cột "Tệp" của gói. Cần sửa thì báo chủ tệp qua ORC.
- Không ghi email/địa chỉ/khóa thật. Dữ liệu thử `…@example.test`. Hoa hồng chỉ `test_rate_*`.
- Ảnh kiểm qua che (G4) trước commit. Không dữ liệu khách trong repo.
- Mọi chữ hướng người dùng theo **brand OTTIMO**:
  - màu 80/15/5 (Ivory, Cream, Stone Grey, Ink / Light Oak, Earth Brown / Sage);
  - Lora tiêu đề, Be Vietnam Pro nội dung, JetBrains Mono cho mã;
  - giọng ngắn, lịch sự, điềm tĩnh, không emoji; với khách: EN dẫn – VI hỗ trợ.
- Commit tiếng Anh. Không push lên `main`, không tự gộp. Báo cáo `rounds/round-04/outputs/<VAI>/v1.0.4-<gói>.md` (Đã làm gì · Tệp · Giả định · Rủi ro · Việc chưa xong).

**ARC – P4-00 `v104/contract`** (chờ `main@L`)
> Cắt `v104/contract` từ `main` sau khi `lp-v2-main` đã gộp (0.3.11). Nâng `openapi.yaml` lên **0.3.12-draft** đúng 8 ý (a)–(h) của dòng P4-00 ở `plan-v1.0.4.md` mục 3. Thêm ví dụ request/response và mã lỗi cho từng thay đổi.
> Sinh lại `services/api/src/generated/*` và `packages/api-client/src/generated/*`. Sửa tay `packages/api-client/src/{types,endpoints}.ts` cho `leaseEndDate`, kind mới, `first_price`. Script sinh meta phải mang `x-self-data`.
> Đọc: `rounds/round-04/outputs/ARC/v1.0.3-tech-plan.md` mục 4; backlog 5.6 (EM-09, SEC-ARC-018-03, V3-09); `rounds/round-04/reviews/SEC-on-BUG-R4-018-022.md`; DOM A.5 (người nhận J1).
> Ghi: `product/docs/api/openapi.yaml`, tệp sinh ra, `packages/api-client/src/**`, `product/docs/architecture.md` (đoạn khóa lạc quan), `rounds/round-04/outputs/ARC/v1.0.4-contract.md`.
> Xong khi BE-A, BE-B, SEC ghi "đồng ý". Hạn **05/11 10:00**.

**UXD (+CPY) – P4-01 `v104/strings` + P4-21 `v104/uxd-manual-font`**
> Ngay hôm nay: viết `rounds/round-04/outputs/UXD/v1.0.4-copy.md` cho mọi khóa ở bảng 3.1 (VI, EN; RU chỉ cho chữ khách).
> Giữ nguyên tên khóa ARC đặt. Chốt chữ:
> - BUG-R4-024, BUG-R4-025 (`row_refund_help`), BUG-R4-026, GN-R4-QA-01/03;
> - giữ chỗ 042/043/044/ĐX;
> - app nhân viên 2 bước + mật khẩu tạm (BUG-R3-052);
> - cách hiển thị cột Email (BUG-R4-023).
>
> Theo brand OTTIMO (giọng nhân viên không "Vui lòng"; không emoji). CPY duyệt chữ hướng khách. Xong 05/11 10:00.
> Sau khi `main@L` có: cắt `v104/strings`, đưa vào `product/design/tools/gen_strings.py` (sửa luôn ghi chú khóa của EM-15), chạy `python3 design/tools/gen_strings.py`, cập nhật `product/design/content-guide.md`. PR gộp trước **05/11 12:00**. Không sửa tay tệp sinh ra.
> Song song, cắt `v104/uxd-manual-font` từ `origin/main`: `product/design/tools/build_manual.py` nhúng font như `build_guides.py`; kiểm 390/1440 khi mất mạng.
> Đọc: `rounds/round-04/qa/bug-list.md` (BUG-R4-023…026), `rounds/round-04/reviews/UXD-on-v1.0.3-email-desk.md`, `rounds/round-04/outputs/UXD/manual-1.8-html-report.md`, `00-brief/context/brand/brand-guidelines.md`.

**OPS – P4-02 `v104/ops-deploy-order`, P4-03 `v104/ops-scripts`** (Ngay, từ `origin/main`), **P4-04 `v104/ops-check`** (chờ `main@L`)
> **P4-02:** `infra/server/bin/deploy.sh` lên bản worker → api → web, `rollback.sh` theo thứ tự ngược, test thứ tự trong `infra/server/test/rollback.test.sh`, diễn tập lại 5.0 trên staging (không deploy staging trước 05/11 10:00). Phải gộp **trước** PR giữ chỗ.
> **P4-03:**
> - `requeue-email-changed.sh` so tag chính xác `":$tag$(envval API_TAG_SUFFIX)"`;
> - `mail-test.sh` kiểm `ssh` là ssh giả + ca 4c;
> - `infra/server/mail-test.mjs` đọc địa chỉ thử từ dòng đầu stdin;
> - tạo `.github/CODEOWNERS` (`services/api/src/shared/serialization/field-policy.ts` → SEC);
> - tạo `.github/pull_request_template.md` có ô "Không ghi tỷ lệ/tiền hoa hồng, thưởng theo bảng nội bộ".
>
> **P4-04** (sau `main@L`, sau P4-13):
> - `ops-check.sh`: `via owner: <n>`; `email_missing` gồm `locked`; kiểm chỉ đọc bằng `ottimo_readonly` READ ONLY, trả lời không phải số → FAIL; vai requeue chỉ SELECT + UPDATE 4 cột `outbox_message` (GRANT cho DB đang chạy cần migration thì xin số **0097** và nhờ BE-D); câu READ ONLY kiểm 2 trigger PN-01;
> - README 13.8 + 5.0 + đường dự phòng `smtp.gmail.com` lưu bản sao (SEC PR33-S3, SENT-01);
> - CI job `confidential-paths` trong `.github/workflows/ci.yml` (không đưa số vào CI);
> - runbook `rounds/round-04/outputs/OPS/v1.0.4-release-runbook.md`: S0 digest (D1), migration 0092–0095 chỉ nới, quay lui `sha-da6d6f3dc22b` không lùi DB, thứ tự deploy mới, LP-v2 giữ `LANDING_LOCALES=en,vi` và `public_show_prices=false`, đếm đơn dài hạn nhận phòng trước v1.0.4 có `departure_date ≠ booked_departure_date`.
>
> Đọc: `rounds/round-04/reviews/{SEC-on-PR32,SEC-on-PR30-email-alert,ARC-on-PR30-email-alert,ARC-on-PR32,SEC-on-info-sent-copies,SEC-on-commission-numbers}.md`; FB-R4-OPS-ARC-31-01 ở `rounds/round-04/outputs/OPS/v1.0.3-staging-drill.md` và `qc/v1.0.3-gate.md` (D2); runbook v1.0.3 r3.2.

**INT – P4-05 `v104/int-email`** (Ngay, từ `origin/main`; cùng PR với BE-A P4-06)
> Sửa `integrations/notification/email-templates.ts`:
> - chân thư chung `NO_LINK_EN/VI` của 5 mẫu bảo mật theo CPY lượt 2, phương án A;
> - bỏ câu chống lừa đảo trùng ở 3 bản `email_changed`;
> - 4 mẫu cũ dùng dòng riêng "Time:" / "Thời điểm:";
> - `staffName` chỉ ở bản `owner`;
> - xuất `STAFF_EMAIL_TEMPLATES` (gồm `email_changed`) + test khóa `isStaffEmailTemplate`.
>
> Tạo `integrations/notification/email-address.ts`: một hàm luật địa chỉ email dùng chung (chuẩn hóa + kiểm). Adapter SMTP chỉ siết khi `ops-check email_ascii` = 0.
> Brand OTTIMO: EN dẫn – VI hỗ trợ, không emoji. CPY và SEC duyệt chữ.
> Đọc: `rounds/round-04/reviews/{CPY-on-v1.0.3-email-changed,INT-on-PR31-dispatcher,ARC-on-PR31-v1.0.3-email,ARC-on-PR32}.md`.
> Ghi: `integrations/notification/**`, `rounds/round-04/outputs/INT/v1.0.4-int-email.md`.

**BE-A – P4-06 `v104/be-identity`** (Ngay → B)
> Cắt từ `origin/main`. Làm theo dòng P4-06 mục 3 và quyết định ARC 6.6, 6.7:
> - **EM-09** (bắt buộc);
> - luật hộp thư chung bỏ `+…` + danh sách cấu hình độc lập `EMAIL_FROM` (M18-01 + SEC-SENT-02), có test "đổi `EMAIL_FROM` vẫn chặn `info@`";
> - M18-08 theo SEC chọn;
> - dispatcher bỏ `staffName` ở bản `self`/`previous`;
> - dùng hàm địa chỉ của INT;
> - đường xuất mẫu thư cho `requeue-email-changed.sh`;
> - SEC-BE-018-01/02/04, ARC-BE-018-03/04, SEC-ARC-018-03 phần mã.
>
> Nếu kịp: `access.denied` không dựa vào `WeakSet` (`users.service.ts`), `production-bootstrap --owner-email` qua dấu nhắc ẩn.
> Phần 429 trong meta và `x-self-data` làm sau khi P4-00 gộp và bạn rebase lên `main`. Không chạm `openapi.yaml` hay tệp sinh ra.
> Chỉ sửa: `services/api/src/modules/identity/**`, `jobs/email-dispatch.ts`, `shared/serialization/*`, `shared/http/problem*.ts`, `main.ts`, `admin/production-bootstrap*.ts` và test liên quan.
> Đọc: backlog 5.6 các dòng tương ứng; `rounds/round-04/reviews/{SEC-on-v1.0.3-contract-email,SEC-on-PR31-v1.0.3-email,SEC-on-BUG-R4-018-022,ARC-on-BUG-R4-018-022,ARC-on-manual-1.8,DOM-on-manual-1.8,SEC-on-info-sent-copies,INT-on-PR31-dispatcher}.md`.
> `privacy-log-check.sh` phải sạch.

**BE-B – P4-10 `v104/be-holds`** (Ngay → B; đường găng nhóm (1))
> Cắt từ `origin/main`. Làm BUG-R3-042 (P1), 041 + WA-04, ĐX-R3-QA-01 theo dòng P4-10 mục 3 và `rounds/round-04/outputs/ARC/v1.0.3-tech-plan.md` mục 4 (các dòng 042, 041, ĐX).
> Mốc xử lý giữ chỗ đã cọc quá hạn là **tới khi nhận phòng** (BR-303 (1), DOM A.6). Người nhận J1 theo DOM A.5.
> Phần A (ngay):
> - `deposits.service.ts`, `allowed-actions.ts`, `expireOne` trong `reservations.service.ts` → `events.notify`;
> - WA-04 (`approval.service.ts`);
> - nguồn `hold_overdue`/`hold_overdue_cap` trong `frontdesk/internal/attention-sources.ts`;
> - test đơn vị với `MutableClock`.
>
> Phần B (sau `main@L` + P4-00): migration **0093** (CHECK `staff_notification.kind`, chỉ nới) theo luật journal 4.2a, test tích hợp.
> Không sửa `reservation-dto.ts`, `checkin.service.ts`, `stay.service.ts` (BE-C) và `folio/**` (BE-D).
> PR gộp sau P4-02 (OPS). Gộp chung PR-F với FE-B P4-40.
> Đọc: `rounds/round-03/qa/bug-list.md` BUG-R3-041…044 + mục 4 (ĐX-R3-QA-01); `rounds/round-04/plan-v1.0.3.md` G3; SEC-BE-22.
> Review: ARC, QA, SEC.

**BE-C – P4-11 `v104/be-lease-prices`** (Ngay → B)
> Cắt từ `origin/main`.
> - (a) `leaseEndDate` theo **quyết định ARC 6.1**: ghi khóa lúc check-in trong `checkin.service.ts`, đọc trong `reservation-dto.ts`; B16 chọn BR-313/BR-428 theo ngày này trong `stay.service.ts`/`stay-rules.ts`.
> - (b) ETag: `shared/http/precondition.ts` nhận `"n-gzip"`, `"n-zstd"`, `"n-br"`.
> - (c) `byCalc` trong `test/reservations-pricing.test.ts` gộp `row.params` lên DS-E; đổi tên test `a7-lease-nights`.
>
> Sau `main@L` + P4-00:
> - (d) BUG-R4-015: `platform/internal/rooms.service.ts` → 409 `first_price`;
> - (e) migration **0094** trigger `BEFORE DELETE ON room_list_price` nếu SEC nói cần.
>
> Không sửa `reservations.service.ts` (BE-B). DOM review cách chọn BR-313/428.
> Đọc: `v1.0.3-tech-plan.md` mục 4 (dòng 015, ED-02, leaseEndDate, ETag); `rounds/round-04/qa/bug-list.md` BUG-R4-015; `rounds/round-04/reviews/QA-on-PR25.md`.
> Không ghi số hoa hồng thật.

**BE-D – P4-12 `v104/be-refund-dest`, P4-14 `v104/be-sensitive`** (Ngay), **P4-13 `v104/be-pn01`** (chờ `main@L`)
> **P4-12:** sau khi SEC duyệt thiết kế ARC 6.3, sửa `folio/public/{refund-plan,refund-routing,folio.service}.ts` + `payments/internal/refunds.service.ts` để yêu cầu hoàn thay thế mang nơi nhận khi các yêu cầu bị đóng cùng một nơi nhận và cùng khách. Chép qua dịch vụ mã hóa trong cùng giao dịch, rồi xóa ở yêu cầu cũ (giữ SEC-BE-45). Không số tài khoản trong log/audit/Problem. Có test 3 ca.
> **P4-14:**
> - PR24PM-02 (regex cụm ngày), 03 (`log-line.ts` try/catch), 04 (ESLint `no-console` cho worker/jobs);
> - sau `main@L`: PR24PM-01 (chuyển `sensitive-number.ts` sang `src/shared/`, đổi đúng 1 dòng import ở `website-request-rules.ts`, `containsCardNumber` OR với luật cũ, test kiến trúc). `guest-portal` chỉ khi SEC duyệt.
>
> **P4-13:** migration **0095** thay thân hàm `privacy_notice_version_append_only()` (so cả hàng trừ `superseded_at`, chặn `superseded_at` ngoài khoảng) + test `tgenabled`, quyền `ottimo_app`; không đổi 0090. Báo OPS câu kiểm trigger cho P4-04.
> Đọc: `rounds/round-04/reviews/{DOM-on-BUG-R4-025-docs,ARC-on-PR24-post-merge,SEC-on-PR24-text-safety,SEC-on-PR29-pn-01,ARC-on-PR29-pn-01}.md`; `rounds/round-04/qa/v1.0.2-dk10-b18.md` mục 9 (QA đọc yêu cầu thay thế).

**FE-A – P4-30 `v104/fe-users-2fa` → P4-31 `v104/fe-lease-ed` → P4-41 `v104/fe-money-labels` (→ P4-33 nếu kịp)**
> Cắt từ `origin/main`. **P4-30 trước** (đi cặp với app nhân viên 2 bước).
> P4-30:
> - menu **Khác…** ở `UsersPage.tsx` (tệp mới `UserMoreMenu.tsx`): Đặt lại mật khẩu, Khóa tài khoản, Đặt lại xác thực 2 bước (`resetUser2fa`, `StrongReauthDialog`);
> - BUG-R4-023, BUG-R4-024;
> - UXD-FE-EM-07/13/14.
>
> P4-31: `EarlyDepartureDialog.tsx` dùng `manualLongStay.leaseEndDate`; chữ `lease_rule_paid`, `row_refund_help`.
> P4-41:
> - BUG-R4-026 (`app/auditReason.ts`, `approvals/ApprovalsPage.tsx`, `money/MoneyPage.tsx`);
> - ghi chú GN-R4-QA-01;
> - BUG-R2-103, BUG-R2-097, BUG-R3-045 (`stay/FolioDialog.tsx`, `StayDialogs.tsx`).
>
> P4-33: Desk lấy căn từ `room-statuses` cho vai chỉ Bảo trì.
> Dùng đúng tên khóa ở bảng 3.1. Sau `main@L`: rebase, lấy khóa từ P4-01, kiểu mới từ api-client; sửa `packages/ui/src/styles/app.css` (bạn là chủ duy nhất).
> Không sửa `mocks/handlers.ts` hay `mocks/reservations.ts`: mock trong test bằng `server.use`. Không sửa tệp của FE-B (mục 4.1).
> Ảnh 1366/1440, có trạng thái tải/rỗng/lỗi, VI + EN, brand OTTIMO. QA chụp lại C1-07, C1-22.
> Đọc: `rounds/round-04/qa/bug-list.md` BUG-R4-020, 023–026; `rounds/round-04/reviews/UXD-on-v1.0.3-email-desk.md`; `rounds/round-04/qa/v1.0.2-dk10-b18.md` mục 5, 9; `rounds/round-03/qa/bug-list.md` BUG-R3-045, 053.

**FE-B – P4-40 `v104/fe-holds` → P4-32 `v104/fe-checkout`**
> Cắt `v104/fe-holds` từ `origin/main`. Làm Desk cho nhóm giữ chỗ:
> - 042 (ô **Giờ nhận tiền**, ẩn nút với hold chưa cọc quá hạn);
> - 043 (ô **Chấp nhận cọc thiếu – lý do**, OWN/MGR);
> - 044 + BA M13-03 (khung đơn, câu `HOLD_EXPIRED` có cọc, hộp hủy hiện số hoàn);
> - ĐX ("Giữ chỗ chờ cọc (n)", "Cần chú ý" `hold_overdue`/`hold_overdue_cap`, nhãn kind mới);
> - BUG-R3-046 (gửi `note` khi tính thử), 047.
>
> Tệp: `reservations/ReservationDialogs.tsx`, `ReservationDrawer.tsx`, `TodayPage.tsx`, `OverviewPage.tsx`, `dashboard/*`, `app/attention.ts`, `app/reservations.ts`.
> Sau `main@L`: BUG-R2-216, 219 trong `booking/BookingDialog.tsx`/`quotes/QuoteDialog.tsx`; lấy khóa P4-01 và kiểu 0.3.12.
> Code song song với BE-B bằng mock theo hợp đồng P4-00. Gộp chung PR-F.
> Sau đó cắt `v104/fe-checkout` từ `main`: GN-R4-QA-03 (dòng "Đang chờ hoàn cho khách … đ" ở bước ③ Bill và màn Kết quả, dữ liệu từ API sẵn có; thiếu thì báo ARC), BUG-R3-024.
> Không sửa `mocks/handlers.ts`/`mocks/reservations.ts`, `packages/ui/src/styles/app.css` (FE-A) hay tệp FE-A.
> Ảnh 1366/1440, VI + EN, brand OTTIMO.
> Đọc: `rounds/round-03/qa/bug-list.md` BUG-R3-041…047 + mục 4; `rounds/round-02/qa/bug-list.md` BUG-R2-216, 219; `rounds/round-04/qa/v1.0.2-dk10-b18.md` mục 5 ý 3.

**MOB – P4-50 `v104/mob-2fa` (Ngay) → P4-42 `v104/guest-privacy-v2` (chờ `main@L` + chữ SEC)**
> Cắt `v104/mob-2fa` từ `origin/main`. **ARC-RN103-02 (ưu tiên cao):**
> - app nhân viên `staff.ottimo.vn` xử lý `401 MFA_REQUIRED` bằng màn nhập mã 6 số hoặc mã khôi phục → `loginMfa`. Làm như Desk `apps/admin-web/src/pages/MfaStep.tsx`: một lỗi `MFA_INVALID`, quay về bước 1 sau 5 phút hoặc 5 lần sai, dùng khóa `mfa.*` có sẵn;
> - bỏ dùng `auth.mfa_later` (xóa khóa khi rebase lên `main`);
> - không ẩn nút Bật 2 bước với buồng phòng/bảo trì.
>
> BUG-R3-052: `Me.mustChangePassword` → màn đặt mật khẩu; tối thiểu báo đúng `PASSWORD_CHANGE_REQUIRED`/`MFA_ENROLLMENT_REQUIRED` (UXD chọn), không báo "mạng yếu". Kiểm hộp Thông báo có nhãn cho kind mới.
> Tệp: `apps/mobile/src/pages/{LoginPage,MePage,NotificationsPage}.tsx`, tệp mới `MfaStepPage.tsx`/`SetPasswordPage.tsx`, `app/{session,api,router}.ts`, `mocks/handlers.ts` của mobile.
> Sau đó P4-42: trang khách hiện `privacy-2026-10-v2` vi/en/ru (`apps/guest-web/src/app/config.ts` `NOTICE_TEXT_VERSIONS`, `checkin/CheckinFlow.tsx`, khối chữ khách nhóm riêng trong `gen_strings.py`). Chữ do SEC (gốc) + CPY (ru) giao trước 06/11 10:00. Tiếng Nga không rơi về EN.
> Brand OTTIMO với khách: EN dẫn, không emoji. 390 px.
> Đọc: `rounds/round-04/reviews/ARC-on-manual-1.8.md` mục RN103-02; `rounds/round-03/qa/bug-list.md` BUG-R3-052; `rounds/round-04/qa/bug-list.md` BUG-R4-021; `rounds/round-04/plan-v1.0.3.md` V3-08.
> Review: UXD, QA, SEC.

**DOM + QA – P4-20 `v104/dom-br-fixtures`** (Ngay)
> Cắt từ `origin/main`. DOM làm một lượt BR + fixtures:
> - FB-R4-PO-DOM-PR25-01…05 + FB-R4-SEC-DOM-01: nhãn hoa hồng "trước 01/11 – hết hiệu lực", **không** số mới; `INV-043`; `GIẢ ĐỊNH` BR-208-01/02; nhãn 0.1 + `conventions.labels`; không dùng lại id;
> - đặt `calc` cho các dòng bảng giá 01/11 ở QA-DOM-PR25-01;
> - QA-DOM-PR25-02…05, BA-DOM-PR25-01…04/S1–S3 (gộp ý trùng);
> - câu nhánh OTA BR-428 (BUG-R4-025).
>
> QA sửa test case, ghi "ví dụ theo tỷ lệ cũ" chỗ còn số cũ, chạy lại oracle sau khi BE-C xong `byCalc`.
> Chỉ sửa `product/docs/business-rules.md`, `product/tests/fixtures/br-examples.json` (không `rbac-cases.json`), test case QA.
> Đọc: `rounds/round-04/reviews/{PO-on-PR25-BR-labels,SEC-on-commission-numbers,QA-on-PR25,BA-on-PR25,DOM-on-BUG-R4-025-docs}.md`.
> Không ghi số của bảng nội bộ; ORC đưa phần bảng cần dùng qua kênh ngoài kho mã.

---

## 9. Rủi ro

| # | Rủi ro | Mức | Xử lý |
|---|---|---|---|
| R1 | `lp-v2-main` chưa gộp được tới 05/11 12:00 → P4-00/P4-01 và giai đoạn B trễ | TB | Gói "Ngay" vẫn chạy. Dự phòng 2.5 (a) lùi nửa ngày, vẫn kịp 10/11 |
| R2 | PO/QC không cho mã LP-v2 lên production cùng v1.0.4 | Thấp–TB | 2.5 (b). Hỏi PO ngay 04/11 |
| R3 | BE-B (20 giờ) là đường găng nhóm (1); QA giữ chỗ phải chờ giờ thật | TB | BE-B chỉ làm P4-10. QA tạo giữ chỗ tối 06/11. Cách tạm sổ tay 2.4 giữ tới khi lên |
| R4 | SEC không duyệt 6.3 (nơi nhận yêu cầu thay thế) | Thấp | Bỏ P4-12 khỏi v1.0.4. Giữ cách tạm (kiểm **Cách hoàn** trước khi duyệt) |
| R5 | Chữ SEC `privacy-2026-10-v2` trễ → dòng bắt buộc V3-08 trễ | TB | Hạn 06/11 10:00. Trễ thì ORC báo PO: v1.0.4 lên không có V3-08, check-in online tiếp tục dừng, V3-08 thành v1.0.4.1 |
| R6 | Lệch số migration khi gộp sai thứ tự | Thấp | Luật 2.2. CI `migrations-journal` + `schema-parity` |
| R7 | Xung đột strings giữa các gói | Thấp | Luật 2.4: nhóm riêng, sinh lại, không sửa tay tệp sinh ra |
| R8 | Hotfix v1.0.3.x (lượt BR-428-02 05/11) chiếm BE/FE | TB | Hotfix đi trước. ORC dời mốc trong khung 10/11 |
| R9 | ORC không mở làn BE-C, BE-D | TB | Gộp theo mục 7.6. v1.0.4 nhắm 10/11 thay 08/11 |
| R10 | Đổi thứ tự deploy (P4-02) lỗi khi lên production | Thấp | Diễn tập 5.0 trên staging trước. Runbook có quay lui |

---

## 10. Giả định

| # | Giả định |
|---|---|
| G1 | `lp-v2-main` mang LP-v2 migration **0092** và OpenAPI **0.3.11**, có trước 05/11 10:00 |
| G2 | Production chưa vận hành thật (decision-log 01/11). Số đơn dài hạn đã nhận phòng có `departure_date ≠ booked_departure_date` là 0 hoặc rất ít (quyết định 6.1). OPS đếm trong runbook |
| G3 | ORC có thể mở làn BE-C, BE-D như các đợt trước (BE-C/BE-D đã làm R2–R4). Nếu không: mục 7.6 |
| G4 | ESC-049 không chặn v1.0.4. Phần mã SENT-02 vào v1.0.4 dù INV chọn B, C1 hay A. Đổi `EMAIL_FROM` chỉ là bước vận hành sau khi INV quyết |
| G5 | H2 (hoa hồng theo bảng nội bộ) là hotfix riêng, hạn 01/12. P4-15 chỉ làm khi ORC muốn |
| G6 | Staging có thể deploy lại sau 05/11 10:00. Lượt BR-428-02 của v1.0.3 dùng staging hiện tại tới lúc đó |
