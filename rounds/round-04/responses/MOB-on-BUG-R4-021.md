# MOB trả lời review UXD – BUG-R4-021

Round 4 · v1.0.3 · Bước: Phản hồi & sửa · Nhánh `mob/v1.0.3-notif-text`. Review gốc: `rounds/round-04/reviews/UXD-on-BUG-R4-021.md` (ĐẠT CÓ ĐIỀU KIỆN, trên `fa99b116`).

| Thẻ | Mức | Trả lời | Sửa ở đâu |
|---|---|---|---|
| FB-R4-UXD-MOB-021-01 | Minor | **Accepted.** `_other` nay dùng "một tài khoản khác" / "Another account's", vì OWN cũng nhận thông báo về OWN khác. Đã sửa 2 câu viết cứng ở dòng 64 và 67 của test, và tên ca test ở dòng 48 ("another account"). | `gen_strings.py` nhóm "v1.0.3 BUG-R4-021" (`email_changed_other`, `mfa_reset_other`), `v103-notif-text.test.tsx` |
| FB-R4-UXD-MOB-021-02 | Minor | **Accepted.** Câu chung nay là "Thông báo bảo mật về tài khoản của bạn" / "Security notice for your account" và "Thông báo bảo mật về một tài khoản khác" / "Security notice for another account". Ghi chú khóa đã thêm `mfa.recovery_code_used`, `mfa.recovery_codes_regenerated` và `security_alert` không có `refCode`. | `gen_strings.py` (`other_self`, `other_other`) |
| FB-R4-UXD-MOB-021-03 | Suggestion | **Deferred v1.0.4** (UXD đã chấp nhận cho v1.0.3). Khi UXD viết câu riêng cho `mfa.locked` / `stepup.s2_failed` và `mfa.recovery_code_used`, MOB chỉ cần thêm cặp khóa vào `USER_EVENT_KEYS` ở `notifications.tsx`. | Backlog v1.0.4 |

- Giữ nguyên `email_changed_self` và `mfa_reset_self`.
- Nhãn nhóm chuỗi đã đổi từ "Chờ UXD duyệt" thành "UXD duyệt 03/11".
- JSON, `strings.js` và `strings-tables.md` sinh lại bằng `gen_strings.py`, không sửa tay.
