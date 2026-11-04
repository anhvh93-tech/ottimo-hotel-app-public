# SEC review mã – P4-16 `v104/be-notice-allowlist` (danh sách version cho phép của `privacy_notice_version`)

- Người review: SEC | Round 4 – v1.0.4 – Bước: **Review mã** | 04/11/2026
- Đối tượng: `origin/v104/be-notice-allowlist` @ `2975bc97` (BE-C), cắt từ main `7224e8fd`. Diff 5 tệp: `platform/internal/parameter-rules.ts` (+9); mới `platform/public/notice-versions.ts`; `test/v104-notice-allowlist.test.ts`; `test/integration/v104-notice-allowlist.test.ts`; `product/docs/api/openapi.yaml` (+3, mô tả).
- Đối chiếu: thiết kế ARC "v1.0.4 notice-version allowlist" mục 2–4; điều kiện SEC P416-01/02/03 (04/11); thẻ FB-R4-SEC-BA-104-09 (a).
- **Phán quyết: ĐẠT. Gộp ngay sau P4-42** (`v104/guest-privacy-v2` @ `80c35dcc`). Điều kiện duy nhất: CI P4-16 chạy lại xanh trên main đã có P4-42. Không thẻ Blocker/Major/Minor; thẻ 04 Suggestion.

## A. Đối chiếu điều kiện duyệt thiết kế

| Điều kiện | Yêu cầu | Bằng chứng | Kết quả |
|---|---|---|---|
| P416-01 (Major) | G3: đúng 1 version, có câu báo | test "G3" `toHaveLength(1)` + câu báo; chú thích `notice-versions.ts` | Đạt |
| P416-02 (Major) | I7: v1 cho ngày mai bị từ chối | "I7": v1 → 422 `PARAM_OUT_OF_RANGE` + `allowed: [v2]`, không dòng, không audit; ca phụ v3 ngày mai | Đạt |
| P416-02 | G1 chỉ nhận literal | còn sót ký tự → đỏ; không tìm thấy mảng → đỏ | Đạt (thử hỏng mục C) |
| P416-02 | `path.resolve` | `resolve(__dirname, '../../../apps/guest-web/src/app/config.ts')`; chạy từ `/` vẫn 10/10 | Đạt |
| P416-03 (Minor) | I3 audit `category = config` | before v1 → after v2, không `sameDayOverride`, đúng 1 `pg_notify` | Đạt |
| P416-03 | Đồng ý v1 sau khi đổi → 422 `NOT_IN_LIST` | quầy gửi v1 → 422; v2 → 201 | Đạt |
| P416-03 | Hằng đóng băng | `Object.freeze` + test `Object.isFrozen` | Đạt |

P416-03 (c) (BA: OWN kiểm dòng hẹn ngày sau) và Q5 staging thuộc BA/QA.

## B. Mục ORC yêu cầu kiểm
1. Thân lỗi không lặp chuỗi người dùng: **Đạt** (`problem.ts` 73–80 chỉ trả `errors` + `extras.allowed`; I1+I6 và unit "never echoes").
2. Không chạm `parameters.service.ts`/`parameter.service.ts`: **Đạt** (đường ghi duy nhất `platform.controller.ts` 341 → `ParametersService.set` → `checkStructuredParameter`; `PRODUCTION_PARAMETERS` không chứa khóa này). Thứ tự kiểm giữ nguyên.
3. Đoạn `setParameter` trong `openapi.yaml`: **Đạt** – khớp ARC 4.1; `gen-openapi-meta --check` "up to date".
4. So khớp từng ký tự: `includes` trên giá trị gốc, không `trim`/đổi hoa thường (U3).
5. Không bí mật, dữ liệu thật.

## C. Chạy kiểm (không commit)
- Worktree tạm @ `2975bc97`, `config.ts` guest-web thay bản `80c35dcc`; Postgres 17 tạm.
- `vitest run v104-notice-allowlist`: 2 tệp, **20/20 qua** (10 unit/guard, 10 integration thật).
- Thử hỏng G1: config main `[v1]` → đỏ (dự kiến); tên biến → đỏ; spread → đỏ; `Object.freeze([...])` → đỏ "array not found"; hai literal → đỏ "differ".
- Tắt `case 'privacy_notice_version'` → U2, U3, U4, "never echoes" đỏ.
- `eslint` sạch; `tsc` không lỗi ở tệp P4-16. `merge-tree` main ← P4-42 ← P4-16 không xung đột.

## D. Thẻ feedback

### FB-R4-SEC-BE-P416-04
- Mức độ: **Suggestion**
- Vị trí: `test/v104-notice-allowlist.test.ts`, G1, regex `/export const NOTICE_TEXT_VERSIONS[^=]*=\s*\[([^\]]*)\]/`.
- Vấn đề: không neo đầu dòng, lấy lần khớp đầu – dòng chú thích dạng `// export const NOTICE_TEXT_VERSIONS = [...]` nằm trên khai báo thật có thể làm G1 xanh giả. Hiện `80c35dcc` chỉ có 1 chỗ khớp.
- Đề xuất: neo `/^export const NOTICE_TEXT_VERSIONS[^=]*=\s*\[([^\]]*)\]/m`; kiểm đúng 1 chỗ khớp (`matchAll` cờ `gm`); câu báo "array not found" ghi guest-web phải khai báo dạng `= [ '…' ]`. Không phải điều kiện gộp.
- Trạng thái: Open

## E. Nhắc bước sau
- P4-16 chỉ chặn lần ghi mới; dòng đã hẹn từ trước vẫn có hiệu lực → BA/QA P416-03 (c), Q5: OWN kiểm và hủy (`cancelScheduledParameter`) trước ngày thay tờ. QA Q1–Q4 staging 07/11.

## F. Điểm làm tốt
- Gói nhỏ, đúng làn, không migration; guard không xanh giả với tên biến/spread; integration kiểm đủ không dòng/không audit/không `pg_notify`; câu báo test chỉ rõ việc phải làm.

Giả định: G-SEC-P416-1 P4-42 gộp trước và giữ khai báo mảng literal; G-SEC-P416-2 CI thật trên main sau P4-42 là bằng chứng chốt; G-SEC-P416-3 số dòng theo `2975bc97`.

---

## G. Chú thích luật `CONST_ROWS` trong `privacy.ts` – `v104/be-notice-allowlist` @ `d5fa87d7` (04/11)

- Đối tượng: commit `d5fa87d7`. Chỉ đổi khối chú thích trên `const VERSION` trong `apps/landing-web/src/content/privacy.ts`, cùng `responses/BE-C-P4-16.md`. Không đổi mã chạy, không đổi chữ thông báo, không đổi `VERSION`.
- Căn cứ: SEC LPV2RB-02/05 (`SEC-on-lp-v2-main.md`), việc thêm ORC 04/11 ở `plan-v1.0.4.md` (3 ý phải ghi).

**Kết luận: ĐẠT. Chữ đúng ý SEC.** Thẻ RB-02 phần chú thích `privacy.ts`: **Verified**. Còn một gợi ý chữ (S1), không bắt buộc.

| Ý phải ghi (plan, việc thêm ORC 04/11) | Chú thích | Kết quả |
|---|---|---|
| (1) Quy tắc theo `CONST_ROWS` của **DB đích**: 0 → lần đăng đầu, hằng = nhãn đang đăng; ≥ 1 → không đổi hằng | Có cả hai nhánh, nói rõ "rule by the TARGET database" và trỏ về runbook CHKV. Nhánh ≥ 1 nêu đúng hệ quả: đổi hằng sẽ đưa mọi yêu cầu đã gửi theo nhãn cũ về mức A | Đạt |
| (2) Sau lần đăng đầu có nêu Google Chat thì không đổi `CHAT_DETAILS_MIN_NOTICE_VERSION` trừ khi SEC yêu cầu | Có "Do not change the constant after the first publication naming Google Chat", nhưng thiếu vế "trừ khi SEC yêu cầu" | Đạt (xem S1) |
| (3) Đổi chữ thông báo thì phải có dòng SEC duyệt chữ trong decision-log trước khi đăng | Có, kèm lý do GCHAT-03 (chữ bỏ Google Chat khỏi danh sách người nhận làm hạ mức trước khi đăng) | Đạt |
| Câu cũ "nhãn mới → đặt hằng bằng nhãn đó" (sai khi `CONST_ROWS` ≥ 1) | Đã bỏ, thay bằng hai nhánh trên. Luật "không dùng lại nhãn cho chữ khác" vẫn giữ | Đạt |

### FB-R4-SEC-BE-P416-S1
- Mức độ: Suggestion
- Vị trí: `privacy.ts` chú thích, gạch đầu dòng "Do not change the constant after the first publication naming Google Chat."
- Đề xuất sửa: thêm "unless SEC asks for it (decision-log line)", để người sửa sau biết đường hợp lệ duy nhất là qua SEC, đúng ý (2). Làm khi tệp được sửa lần tới. Không chặn gộp.
- Trạng thái: Open

Dòng decision-log đề xuất: `| 2026-11-04 | 4 | **SEC – chú thích CONST_ROWS ở privacy.ts (be-notice-allowlist @ d5fa87d7): ĐẠT**, RB-02 phần chú thích Verified (SEC-on-v104-p4-16.md mục G): đủ 3 ý (theo CONST_ROWS của DB đích; không đổi hằng sau lần đăng đầu có Google Chat; đổi chữ cần dòng SEC duyệt trong decision-log), chỉ chú thích, không đổi mã/VERSION. Suggestion P416-S1: thêm "trừ khi SEC yêu cầu" | SEC | Quyền SEC |`
