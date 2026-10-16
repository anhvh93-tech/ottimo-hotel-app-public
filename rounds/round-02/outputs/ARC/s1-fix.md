# ARC – Sprint 1 vòng sửa: OpenAPI 0.3.4-draft

- Vai: ARC | Ngày: 16/10/2026 | Không commit
- Đầu vào: `reviews/ARC-on-BE.md` mục "Quyết định hợp đồng" (Q1–Q8), `outputs/SEC/s1-decisions.md` (mục 1, 3), `reviews/QA-on-BE.md` (QA-BE-04, 05), `reviews/SEC-on-BE.md` (SEC-BE-16, 20)
- Phản hồi thẻ: `responses/ARC-responses.md`. Quyết định: `01-decisions/decision-log.md` (11 dòng ARC 16/10).

## 1. Bảng thay đổi hợp đồng (báo FE/BE/MOB/INT)

| # | Thay đổi | Vị trí OpenAPI | Loại | Ai làm tiếp |
|---|---|---|---|---|
| Q1 | `lookupGuestByContact` 200 thêm `match: possible_duplicate` (SAL/CTV, hồ sơ trùng ngoài phạm vi); `matches[]` chỉ hồ sơ trong phạm vi; 2 ví dụ | path `/guests/lookup` | thêm | BE thẻ 17(1) test; FE sửa H06 |
| Q2 | Mã trường: `PASSWORD_TOO_COMMON`, `CHECKLIST_REQUIRED`, `CONTACT_REQUIRED`, `CONTACT_CHANNEL_EMPTY`, `REAUTH_FAILED`, `DUPLICATE_GUEST` | bảng "Mã lỗi theo trường" | thêm | UXD chuỗi `field_error.*` |
| Q3 | `changeMyPassword`: thu hồi mọi phiên kể cả phiên gọi, `204` + `Set-Cookie` phiên mới, `csrfToken` đổi, `User.version` +1 (QA-BE-05) | `changeMyPassword` | làm rõ | FE đã đúng; BE thêm assert |
| Q4 | Response chung mới `ReauthFailed` (401 `REAUTH_FAILED` + `errors[]` hoặc `UNAUTHENTICATED`) ở `changeMyPassword`, `trustCurrentDevice`, `approveRequest`, `rejectRequest`; bảng mã lỗi ghi quy tắc client | 4 operation + `components.responses` | làm rõ | BE thẻ 02; FE interceptor 401 theo `code` |
| Q5 | `409 DUPLICATE_GUEST` có `errors[{field: phone\|email}]`; `existingGuest*` chỉ khi người gọi được xem; `updateGuest` mô tả | `createGuest`, `updateGuest` | làm rõ | BE (đã đúng) |
| Q6 | `Room`/`RoomInput`/`RoomPatch`: `bedSetup` (≤100), `bedCount` (1–10), `areaM2` | schemas | thêm | BE thẻ 17(2); FE bật cột |
| Q7 | `GuestSummary.lastStayDate` (D11, Sprint 2), `possibleDuplicate` (FD+, D29) + cột `guest.possible_duplicate_at` | schema + erd 4.2 | thêm | BE thẻ 17(3) – migration mới |
| Q8 | `Me.screens` mô tả nguyên tắc; MGR R2 không có S26 | schema `Me` | làm rõ | BE thẻ 14 |
| – | `nationalityCode` hồ sơ khách alpha-2 `pattern '^[A-Z]{2}$'` (`GuestInput/Guest/GuestSummary`); giấy tờ alpha-3 có `pattern` (`GuestDocumentMasked/Sensitive`); quy ước chung ghi nơi chuyển đổi | schemas + info | chặt hơn | BE kiểm input (422 nếu sai) |
| QA-BE-04 | SĐT response = E.164 có `+`; `Guest.phone` `pattern`; DB giữ `84…`; EP00 V-02 thêm câu (BA xác nhận) | info + `Guest.phone` | chốt | QA siết TC-L5-041 |
| SEC-BE-16 | `Guest.gender` `x-visible-to` FD+ | `Guest` | chặt hơn | serializer tự áp sau khi sinh lại |
| SEC mục 1 | `x-security-parameters` thêm `session_policy`, `login_lockout` (type `object`, biên + `default` theo SEC); phạm vi: giá trị chặt nhất trong các cơ sở (SEC-BE-20) | `setParameter` | thêm | **BE**: migration `is_security=true` + `bounds`; sửa `parameter-rules.ts` theo biên mới |
| SEC mục 3 | E06-06 `x-sec-review: approved-DK2 (SEC 16/10/2026)` (2 operation + 3 thuộc tính); điều kiện ghi ở `updateOnlineCheckin`; `x-rate-limit` SR-RL-05 + `429` cho `update/completeOnlineCheckin`; `Registration.onlineCheckin.arrivalNote` `x-rbac-field: D23` + `x-visible-to` FD+ | guest-portal | duyệt | BE cài Sprint 3 |

Không đổi đường dẫn, không bỏ trường. Thay đổi phá vỡ duy nhất về hành vi: client phải xử lý `401 REAUTH_FAILED` khác `UNAUTHENTICATED` (đã là hành vi BE hiện tại).

## 2. Mã đã sửa ngoài tài liệu (để giữ build xanh)
`x-security-parameters` dạng object làm `openapi-meta.ts` sinh `type: 'object'` → `tsc` của api lỗi. ARC sửa tối thiểu:
- `services/api/src/shared/openapi-types.ts`: `SecurityParameterBounds.type` thêm `'object'`, `required?`, `properties?`, `description?`.
- `services/api/src/modules/platform/public/parameter.service.ts`: `checkSecurityBounds` đệ quy cho object (`field` = `value.admin.idleMinutes`…; thiếu khóa con bắt buộc → `422 VALIDATION_FAILED` mã `REQUIRED`). Ràng buộc chéo vẫn ở `parameter-rules.ts`.
- **BE lưu ý**: `test/integration/architecture.test.ts` ("security keys = x-security-parameters") sẽ **đỏ** cho tới khi BE thêm migration đặt `session_policy`/`login_lockout` `is_security=true`, `bounds` = phần còn lại của khai báo (không `default`/`ref`) – đó là việc BE theo SEC mục 1. BE có thể chỉnh test bỏ `description` khi so `bounds`.

## 3. Kết quả kiểm (16/10/2026)
| Lệnh | Kết quả |
|---|---|
| `pnpm --filter @ottimo/api gen:openapi` | ghi lại `openapi-meta.ts`, `openapi-schemas.ts` (0.3.4-draft); `--check` exit 0 |
| `pnpm --filter @ottimo/api-client gen` | `openapi.ts` sinh lại; `typecheck` api-client OK |
| `pnpm --filter @ottimo/api typecheck` | OK (sau sửa mục 2) |
| `vitest` api (không integration) | 9 file đạt, 81 ca đạt, 6 bỏ qua |
| `gen_rbac_cases.py` + `--check` | sinh lại: 178 operation, 1.958 ca, rbac mismatch [] → `--check` OK |
| `gen_traceability.py --strict` | exit 0; ops/fields mismatch 0; `x-rbac-field` 125, untagged [] |
| `openapi-spec-validator` | OK `openapi.yaml`, `openapi.test.yaml` |
| `npx @redocly/cli@1.34.21 lint` | **0 lỗi**, 4 cảnh báo (như cũ, có chủ đích) |
| `admin-web typecheck` | lỗi `GuestsPage.tsx` thiếu `Alert` – **không do hợp đồng** (FE đang sửa dở) |

## 4. Giả định
- Phạm vi tham số xác thực: phương án "chặt nhất trong các cơ sở" (không thêm tầng tổ chức ở R2).
- `possibleDuplicate` dùng nhãn trường `D29` (cùng `Guest.warnings`); `lastStayDate` dùng `D11`.
- `isForeigner`, `preferredLocale`, `preferredContact` vẫn trả SAL/CTV.
- Câu V-02 thêm ở EP00 cần BA xác nhận câu chữ.
