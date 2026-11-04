# BE-C trả lời thẻ – P4-16 `v104/be-notice-allowlist`

- Round 4 (v1.0.4), bước **Phản hồi & sửa**, 04/11/2026
- Nhánh: `v104/be-notice-allowlist`. Review: `rounds/round-04/reviews/ARC-on-v104-p4-16.md`, `SEC-on-v104-p4-16.md`; chú thích hằng Chat theo `SEC-on-lp-v2-main.md` FB-R4-SEC-OPS-LPV2RB-02 (phần "chú thích `privacy.ts` dời v1.0.4").

| Thẻ | Mức | Trạng thái | Commit | Ghi chú |
|---|---|---|---|---|
| FB-R4-ARC-BE-C-P416-02 | Suggestion | Fixed | `21aade4e` | Nhãn test "I1–I6" → "I1–I7 + consent" (tệp unit và integration). |
| FB-R4-ARC-ARC-P416-03 | Minor | Fixed | `21aade4e` | `openapi.yaml` changelog 0.3.12 thêm ý **(j)** `setParameter` `privacy_notice_version` (SEC-BA-104-09 a), chỉ mô tả, không đổi schema, không lặp đoạn văn ở `setParameter`. |
| FB-R4-ARC-BE-C-P416-01 | Suggestion | Deferred (v1.0.5) | – | I3 vẫn chờ cố định 300 ms cho `pg_notify`. Đổi sang `vi.waitFor` (≤ 2 s) khi chạm tệp lần sau; chưa thấy chập chờn trên CI. |
| FB-R4-SEC-BE-P416-04 | Suggestion | Fixed | `9590a2cb` | G1 neo đầu dòng, đúng 1 chỗ khớp. |
| FB-R4-SEC-OPS-LPV2RB-02 (phần chú thích `privacy.ts`) | Minor | Fixed | xem commit chú thích trên nhánh này | `apps/landing-web/src/content/privacy.ts`: chú thích hằng `CHAT_DETAILS_MIN_NOTICE_VERSION` theo DB đích – `CONST_ROWS=0` thì hằng = nhãn đăng; `CONST_ROWS≥1` thì không đổi hằng; không đổi hằng sau lần đăng Chat đầu; phải có dòng SEC duyệt chữ trong decision-log trước khi đăng nhãn mới. Chỉ chú thích, không đổi mã, nội dung trang build không đổi. README 12.3 là phần OPS. |
