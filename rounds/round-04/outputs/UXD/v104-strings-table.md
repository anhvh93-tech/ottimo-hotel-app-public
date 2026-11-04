# UXD – Bảng chữ v1.0.4 (P4-01, phần "bảng chữ làm ngay")

- Người làm: UXD | Round 4 – đợt v1.0.4 – Bước **Sản xuất** | 04/11/2026
- Căn cứ: `rounds/round-04/plan-v1.0.4.md` mục 2.4, 3 (P4-01, P4-30…P4-50), 3.1, 8 (brief UXD); `rounds/round-04/qa/bug-list.md` BUG-R4-020, 023–026; `rounds/round-03/qa/bug-list.md` BUG-R3-024, 041–045, 052, ĐX-R3-QA-01; `rounds/round-03/reviews/DOM-on-PO-v1.0.0-docs.md` A.3–A.5; `rounds/round-04/reviews/DOM-on-BUG-R4-025-docs.md`; `rounds/round-04/reviews/UXD-on-v1.0.3-email-desk.md` (EM-13…15); backlog 5.6 (GN-R4-QA-01, 03; FB-R4-DOM-FE-A-01); `product/docs/business-rules.md` BR-214, BR-303, BR-522; brand `00-brief/context/brand/brand-guidelines.md`.
- Tên tệp theo giao việc của ORC (`v104-strings-table.md`). Plan mục 2.4 gọi tệp này là `v1.0.4-copy.md`: cùng một bảng.
- **Chưa sửa `gen_strings.py` hay `strings-*.json`.** Bảng này là nguồn để UXD đưa vào `gen_strings.py` ở nhánh `v104/strings`, cắt từ `main@L` (plan 2.4). Dev dùng **đúng tên khóa** ở đây ngay từ bây giờ.

## 0. Tóm tắt

| | Số khóa |
|---|---|
| Khóa ở plan 3.1 có chữ VI + EN (mới, sửa, dùng lại) | **29** |
| Khóa xóa | 1 (`auth.mfa_later`) |
| Khóa đề xuất thêm, chờ ARC + dev đồng ý (mục 2) | 1 (`users.reset_2fa_reason`) |
| Khóa có sẵn ngoài 3.1, chỉ sửa chữ (mục 3) | 1 (`cancel.fee_none`) |
| Khóa cần RU | 0. Không khóa nào ở 3.1 hướng khách. Chữ khách bản 2 (P4-42) do SEC/CPY đặt trong nhóm riêng |

Giọng chữ: đây là chữ cho nhân viên (Desk, app nhân viên). Theo `content-guide.md` mục 1 và brand OTTIMO: ngắn, rõ, điềm tĩnh, nói việc cần làm. Không "Vui lòng", không xưng hô thừa, không "!", không emoji, không IN HOA. Thuật ngữ giữ như Desk đang dùng: **yêu cầu hoàn** / *refund request*, **Trả sớm** / *Early departure*, **cọc thiếu** / *short deposit*, **xác thực 2 bước** / *2-step verification*, **Giữ chỗ · chờ cọc** / *On hold · awaiting deposit*.

Cột "Loại": **Mới** = chưa có trong `gen_strings.py`; **Sửa** = khóa có sẵn, đổi chữ; **Dùng lại** = giữ nguyên chữ; **Xóa** = bỏ khi rebase.

## 1. Bảng chữ theo gói (plan 3.1)

### P4-30 `v104/fe-users-2fa` – Người dùng & vai, menu Khác…, hộp S2 (FE-A)

| Khóa | Loại | VI | EN | Ghi chú |
|---|---|---|---|---|
| `users.more` | Dùng lại | Khác… | More… | Nút mở menu trên mỗi hàng. Dấu "…" là một ký tự (U+2026) |
| `users.more_help` | Dùng lại | "Khác…": Đặt lại mật khẩu (tạo mật khẩu tạm), Khóa tài khoản, Đặt lại xác thực 2 bước. | "More…": Reset password (creates a temporary password), Lock account, Reset 2-step verification. | Chữ có sẵn đúng với menu mới. Không đổi |
| `users.reset_2fa` | Mới | Đặt lại xác thực 2 bước | Reset 2-step verification | Mục menu Khác… Chỉ OWN thấy. Chỉ hiện khi người đó **đã bật** 2 bước (`User.mfaEnabled`), vì chưa bật thì máy chủ trả 409. Không hiện trên hàng của chính mình (422 `NOT_ALLOWED`) |
| `users.reset_2fa_confirm` | Mới | Đặt lại xác thực 2 bước cho {name}? Người này bị đăng xuất trên mọi máy, mã khôi phục cũ hết hiệu lực. Ở lần đăng nhập tới, người này thêm OTTIMO vào ứng dụng xác thực trên điện thoại mới. | Reset 2-step verification for {name}? They are signed out on every device and their old recovery codes stop working. At next sign-in, they add OTTIMO to the authenticator app on their new phone. | Câu dẫn của hộp xác nhận, trước ô lý do và bước S2 (`StrongReauthDialog`). {name} = tên hiển thị, không dùng tên đăng nhập. Hành vi theo `resetUser2fa` (OpenAPI 0.3.8): xóa bí mật + mã khôi phục, thu hồi mọi phiên |
| `users.reset_2fa_done` | Mới | Đã đặt lại xác thực 2 bước cho {name}. | 2-step verification reset for {name}. | Toast sau 204. Không nói về thư: người được đặt lại nhận thông báo bảo mật và thư `mfa_reset` (nếu đã có email), Desk không biết thư có tới hay không |
| `reauth.s2_failed_password` | Mới | Mật khẩu chưa đúng. Kiểm tra lại rồi thử lại. | The password isn't right. Check it and try again. | **BUG-R4-024.** 401 `REAUTH_FAILED` khi hộp S2 **chỉ có ô mật khẩu** (`reauth.s2_help_password`). Hộp có ô mã thì giữ `reauth.s2_failed` |

### P4-31 `v104/fe-lease-ed` – hộp Trả sớm (FE-A)

| Khóa | Loại | VI | EN | Ghi chú |
|---|---|---|---|---|
| `early_departure.lease_rule_paid` | Sửa | Đã thu tiền thuê tới hết HĐ: không vi phạm. Quyết toán ký quỹ như trả phòng đúng hạn HĐ: trừ điện nước, phát sinh chưa thu (minibar, dọn lẻ) và hư hỏng, hoàn phần còn lại trong 7 ngày làm việc. Không hoàn các ngày không ở. | Rent paid up to the lease end: not a breach. Settle the security deposit as at the lease end: deduct utilities, unpaid extras (minibar, extra cleaning) and damage, then refund the rest within 7 working days. Days not stayed are not refunded. | Nhánh 1 (ESC-048 B). Thêm "phát sinh chưa thu" theo BR-214 (backlog 5.6, FB-R4-DOM-FE-A-01 phần còn lại). Bỏ "còn nợ" sau "hư hỏng" vì "chưa thu" đã nói ý đó. DOM duyệt câu |
| `early_departure.row_refund_help` | Sửa | Một yêu cầu hoàn cho phần trả sớm, cần quản lý duyệt. Trả phòng không tạo lại khoản này. Nếu folio còn tiền trả thừa khác, bước Bill hỏi cách xử lý riêng phần đó. | One refund request for the early departure, which needs a manager's approval. Check-out won't create it again. If the folio has any other overpayment, the Bill step asks how to handle that part. | **BUG-R4-025** (chữ Desk). Bỏ câu sai "Trả phòng sau đó không tạo thêm yêu cầu." Khớp release notes đã đính chính 04/11 và BR-522 "Số dư thừa chưa xử lý". Dòng phụ dưới "Sẽ xin hoàn cho khách" ở bước ② |

### P4-41 `v104/fe-money-labels` – lý do ở Nhật ký thao tác tiền, Cần duyệt, Hoàn tiền (FE-A)

| Khóa | Loại | VI | EN | Ghi chú |
|---|---|---|---|---|
| `audit.reason.overpayment` | Mới | Hoàn tiền khách trả thừa | Overpayment refund | **BUG-R4-026.** Nhãn cho `reasonCode = overpayment` ở cột Lý do, hàng Cần duyệt và Hoàn tiền. Mã này máy chủ dùng ở 5 chỗ (B18 chọn hoàn, yêu cầu hoàn tay, A32, đóng khoản thừa, **yêu cầu thay thế**), nên nhãn chung, không ghi "thay yêu cầu đã tự đóng". Yêu cầu thay thế đã có dòng "Đã tự đóng" ngay dưới trong Nhật ký. Lý do người dùng gõ (`reasonNote`) vẫn hiện sau nhãn, như hiện nay |
| `audit.reason.early_departure` | Mới | Hoàn khi trả sớm | Early departure refund | `reasonCode = early_departure` trên yêu cầu hoàn B16. Khác `mlog.reason.early_departure` "Trả phòng sớm" (lý do của dòng folio). FE-A thêm cả hai mã vào `CODE_KEYS` của `auditReason.ts` và `FOC_REASON` của `ApprovalsPage.tsx` |
| `approvals.refund_may_decrease` | Mới | Số có thể giảm khi duyệt: phát sinh ghi sau yêu cầu này được trừ trước khi hoàn. | The amount may go down at approval: charges posted after this request are taken off first. | **GN-R4-QA-01** (quyết định ARC 6.4). Dòng phụ chữ Stone trên hàng chờ duyệt của **yêu cầu hoàn** (mọi lý do). Không hiện trên yêu cầu loại khác |
| `error.FOLIO_LOCKED` | Sửa | Phiếu thanh toán đã khóa. Không ai thêm hay điều chỉnh dòng được nữa, kể cả quản lý. Khoản còn nợ: dùng Thu công nợ, hoặc quản lý Xóa công nợ. | This folio is locked. No one can add or adjust lines any more, managers included. For an amount still owed, use Collect debt, or a manager can Write off debt. | **BUG-R3-045.** Bỏ vế sai "Chỉ quản lý ghi được bút toán điều chỉnh." Câu chung cho mọi chỗ máy chủ trả 409 `FOLIO_LOCKED` (folio `closed`, quá 24 giờ sau trả phòng, hóa đơn điện tử đã phát hành). "Thu công nợ", "Xóa công nợ" đúng tên nút `debt.collect`, `debt.write_off` |

### P4-40 `v104/fe-holds` – giữ chỗ 042/043/044, ĐX-R3-QA-01, thông báo (FE-B; nhãn thông báo trên PWA: MOB)

| Khóa | Loại | VI | EN | Ghi chú |
|---|---|---|---|---|
| `deposit.received_at` | Mới | Giờ nhận tiền | Time received | **BUG-R3-042.** Ô trong hộp Xác nhận cọc, FD+. Mặc định bây giờ, không cho giờ tương lai |
| `deposit.received_at_help` | Mới | Giờ tiền về tài khoản hoặc khách đưa tiền. Ghi lùi được, không ghi giờ sau bây giờ. Giữ chỗ chưa cọc chỉ xác nhận được khi tiền về trước hạn giữ chỗ. | When the money arrived or the guest paid. You can enter an earlier time, not a later one. A hold with no deposit can only be confirmed if the money arrived before its deadline. | Dòng phụ dưới ô. Câu cuối giữ luật US-085 AC4 / SEC-BE-22 cho hold chưa cọc |
| `deposit.accept_shortfall` | Mới | Chấp nhận cọc thiếu (phần còn lại thu khi nhận phòng) | Accept the short deposit (collect the rest at check-in) | **BUG-R3-043.** Ô chọn, chỉ OWN/MGR thấy, khi đã nhận > 0 và < cọc yêu cầu. FD/FDL/SAL không thấy (máy chủ trả 403). Khớp `ci.shortfall_accepted` |
| `deposit.accept_shortfall_reason` | Mới | Lý do chấp nhận cọc thiếu | Reason for accepting the short deposit | Ô chữ bắt buộc khi đã chọn ô trên, ≥ 3 ký tự. Lỗi dùng `field_error.reason_required` có sẵn |
| `hold.paid_overdue_banner` | Mới | Giữ chỗ quá hạn lúc {time}. Đã nhận {paid}/{required} nên đơn chưa hủy, căn vẫn giữ. Thu nốt cọc, nhờ quản lý chấp nhận cọc thiếu, hoặc hủy và hoàn. Mốc xử lý: 12:00 {date}. | The hold passed its deadline at {time}. {paid} of {required} has been received, so the booking is not cancelled and the room stays held. Collect the rest, ask a manager to accept the short deposit, or cancel and refund. Deadline to decide: 12:00 on {date}. | **BUG-R3-044 (1).** Alert warn trong khung đơn, thay `drawer.hold.expired` khi hold quá hạn **có cọc** (`depositPaidVnd > 0`). {date} = ngày đến (dd/mm). Mốc 12:00 theo BR-303 và DOM A.3; sau mốc này quản lý nhận `hold_overdue_cap`, câu vẫn đúng. Hold chưa cọc giữ `drawer.hold.expired` |
| `error.HOLD_EXPIRED_PAID` | Mới | Giữ chỗ đã quá hạn lúc {time}, nhưng đơn có cọc nên chưa hủy và căn vẫn giữ. Xử lý ngay trên đơn này: thu nốt cọc, chấp nhận cọc thiếu, hoặc hủy và hoàn. | The hold passed its deadline at {time}, but it has a deposit, so it isn't cancelled and the room stays held. Handle it on this booking: collect the rest, accept the short deposit, or cancel and refund. | **BUG-R3-044 (2).** Thay `error.HOLD_EXPIRED` khi máy chủ trả 409 `HOLD_EXPIRED` cho một hold có cọc (ví dụ Gia hạn sau hạn). Không nói "mở bán lại": căn chưa mở. {time} lấy từ Problem, thiếu thì từ `holdExpiresAt` của đơn (Desk luôn có), nên không cần bản `_notime` |
| `cancel.refund_preview` | Mới | Không thu phí. Sẽ tạo yêu cầu hoàn {amount} – cần quản lý duyệt. | No fee. A refund request for {amount} will be created – it needs a manager's approval. | **BUG-R3-044 (3)**, BA M13-03. Hộp Hủy giữ chỗ khi hold đã nhận > 0 (trước hoặc sau hạn), thay dòng `cancel.fee_none`. {amount} = số sẽ hoàn từ bản tính thử |
| `today.holds_waiting` | Mới | Giữ chỗ chờ cọc ({n}) | Holds awaiting deposit ({n}) | ĐX-R3-QA-01, BA M13-02. Tên khối ở Hôm nay, thay "Giữ chỗ chưa cọc (n)" vì khối có cả hold đã nhận một phần. Khớp nhãn trạng thái `status.booking.hold` |
| `attention.hold_overdue` | Mới | Giữ chỗ {code} quá hạn từ {time} – cần xử lý | Hold {code} past its deadline since {time} – needs action | ĐX-R3-QA-01 AC 1–2. Mục đỏ "Cần chú ý", mọi ngày đến, không có nút "Đã xử lý". Tham số giả định giống `attn.hold_expiring` ({code}, {time} = `refCode`, `hold_expires_at`). ARC xác nhận ở P4-00 |
| `attention.hold_overdue_cap` | Mới | Giữ chỗ {code} còn chờ cọc sau 12:00 ngày đến – quản lý quyết | Hold {code} still awaiting deposit after 12:00 on arrival day – manager to decide | DOM A.5: chỉ MGR/OWN. Không có {time}: mốc đã nằm trong câu |
| `notif.hold_overdue_with_deposit` | Mới | Giữ chỗ có cọc đã quá hạn – căn vẫn giữ | A hold with a deposit is past its deadline – the room stays held | BUG-R3-041. Nhãn loại thông báo (hộp Thông báo app nhân viên; Desk nếu có danh sách). Mã đơn hiện riêng ở dòng phụ như `staff.notif.k.debt_recorded`. Không số tiền, không tên khách |
| `notif.hold_overdue_cap` | Mới | Giữ chỗ còn chờ cọc sau 12:00 ngày đến | A hold is still awaiting deposit after 12:00 on arrival day | DOM A.5: MGR, OWN |
| `notif.hold_expired` | Mới | Giữ chỗ chưa cọc đã hết hạn và tự hủy | A hold with no deposit expired and was cancelled | DOM A.5: người tạo, người chốt (CTV báo khách). Chưa có khóa này trong `gen_strings.py` nên là Mới |

### P4-32 `v104/fe-checkout` – Trả phòng (FE-B)

| Khóa | Loại | VI | EN | Ghi chú |
|---|---|---|---|---|
| `checkout.pending_refund_line` | Mới | Đang chờ hoàn cho khách {amount} (yêu cầu từ Trả sớm). | Refund pending for the guest: {amount} (requested at early departure). | **GN-R4-QA-03.** Một dòng ở bước ③ Bill và màn Kết quả, dưới "Còn phải thu". {amount} = tổng yêu cầu hoàn còn mở của đơn có lý do `early_departure` (chờ duyệt + đã duyệt chưa chi). Lễ tân đọc câu này cho khách. Vị trí: ngay dưới dòng tổng, chữ Ink, không màu cảnh báo |
| `checkout.use_early_departure` | Mới | Hôm nay chưa tới ngày đi ({date}). Khách rời sớm thì dùng Trả sớm trên khung đơn. | Today is before the departure date ({date}). If the guest is leaving early, use Early departure on the booking. | **BUG-R3-024.** Trang Trả phòng mở trước ngày đi (từ URL hoặc lịch sử): hiện câu này thay cho bước ①, kèm nút mở khung đơn. Không gọi `minibar-checks` |

### P4-50 `v104/mob-2fa` – app nhân viên (MOB)

Nhóm trong `gen_strings.py`: **`v1.0.4 P4-50`**. ORC đã chốt (04/11): mật khẩu tạm đổi ngay trong app; bật 2 bước dẫn sang Desk.

| Khóa | Loại | VI | EN | Ghi chú |
|---|---|---|---|---|
| `staff.mfa_enroll_desk` | Mới | Mở OTTIMO Desk trên máy tính để bật xác thực 2 bước, rồi đăng nhập lại ở đây. | Open OTTIMO Desk on a computer to turn on 2-step verification, then sign in here again. | **BUG-R3-052.** Chữ nháp của MOB, UXD duyệt không sửa. 403 `MFA_ENROLLMENT_REQUIRED` (vai chủ đầu tư/quản lý chưa bật, ví dụ tài khoản 6 vai). App không có màn đăng ký 2 bước. Câu đứng dưới tiêu đề `error.MFA_ENROLLMENT_REQUIRED` có sẵn ("Tài khoản của bạn cần bật xác thực 2 bước trước khi làm việc."), kèm nút Đăng xuất. Thay câu "mạng yếu". Không ghi địa chỉ Desk trong câu: nhân viên đã quen "OTTIMO Desk", và địa chỉ khác nhau giữa staging và production |
| `staff.mfa_network` | Mới | Chưa kết nối được tới máy chủ. Mã bạn đã nhập vẫn còn – kiểm tra mạng rồi bấm Thử lại. | Couldn't reach the server. Your code is still here – check the connection, then tap Try again. | Thay `common.error_network_body` ở **bước nhập mã 2 bước** (lỗi mạng khi gọi `loginMfa`). Câu đầu giống `common.error_network_body`, câu sau nói đúng việc ở bước này: ô mã không bị xóa. Nút dùng `common.retry` ("Thử lại"). Mã TOTP đổi mỗi 30 giây: thử lại mà máy chủ trả `MFA_INVALID` thì hiện câu lỗi mã có sẵn, không cần câu riêng |
| `auth.mfa_later` | Xóa | – | – | Bỏ dùng ở P4-50, xóa khỏi `gen_strings.py` cùng lượt |

Màn nhập mã 2 bước trên app dùng các khóa `mfa.*` có sẵn (`mfa.use_totp`, `mfa.recovery_*`, `mfa.back_to_password`, `mfa.step_expired`, `reauth.s2_wait_code`). Màn đặt mật khẩu dùng `pw.*` có sẵn (`pw.lead`, `pw.new`, `pw.repeat`, `pw.rule_*`, `pw.mismatch`, `pw.submit`).

Bỏ khóa dự phòng `staff.temp_password_desk` của bản trước: ORC chốt đổi mật khẩu tạm ngay trong app (`SetPasswordPage`), nên không cần câu dẫn sang Desk.

## 2. Khóa đề xuất thêm (ngoài plan 3.1) – chờ ARC + FE-A

| Khóa | VI | EN | Vì sao |
|---|---|---|---|
| `users.reset_2fa_reason` | Lý do đặt lại (ví dụ: mất điện thoại) | Reason for the reset (for example: lost phone) | `resetUser2fa` bắt buộc `reason` 3–300 ký tự. Plan 3.1 chưa có nhãn cho ô này. Desk không có nhãn "Lý do" chung, chỉ có nhãn theo ngữ cảnh (`cancel.reason`, `move.reason`, `approval.reject_reason`). Lỗi dùng `field_error.reason_required`. Nếu ARC/FE-A không muốn thêm khóa, dùng tạm `hk.task.refused_reason` ("Lý do") |

## 3. Khóa có sẵn ngoài 3.1 – chỉ sửa chữ, không đổi tên

| Khóa | Chữ cũ | VI mới | EN mới | Vì sao |
|---|---|---|---|---|
| `cancel.fee_none` | Không thu phí (giữ chỗ chưa cọc) / No fee (hold without deposit) | Không thu phí | No fee | **BUG-R3-044 (3).** Bỏ vế "(giữ chỗ chưa cọc)". Câu đang hiện cả với hold có cọc. Hold có cọc hiện thêm `cancel.refund_preview`. Chạm `ReservationDialogs.tsx` (FE-B, P4-40) chỉ ở chữ, không đổi mã |

## 4. Quyết định UXD đi kèm

### 4.1 BUG-R4-023 – cột Email ở Người dùng & vai

Chọn: **địa chỉ trên một dòng, nếu buộc phải xuống dòng thì chỉ ngắt ngay sau `@`. Không rút gọn bằng "…".**

- Ô Email: `white-space: nowrap` cho phần trước và sau `@`, chèn `<wbr>` ngay sau `@`. Không dùng `overflow-wrap: anywhere` hay `word-break: break-all` (gây lỗi hiện nay).
- Lấy chỗ cho cột Email từ cột Thao tác. Sau BUG-R4-020, cột Thao tác chỉ còn **Sửa vai** và **Khác…** (Đặt lại mật khẩu, Khóa tài khoản đã vào menu), nên hẹp hơn hẳn.
- Không dùng dấu "…" kèm `title`. Người đọc chép địa chỉ từ bảng, và `title` không đọc được trên máy cảm ứng.
- Chữ địa chỉ giữ JetBrains Mono 13 px (`.mono`), như khối Bảo mật tài khoản.
- Đích: 1440 px và 1366 px một dòng với địa chỉ dài cỡ `qa.fd.v103d7@example.test`. 1024 px được phép ngắt sau `@`.
- Sau khi FE-A sửa: QA chụp lại C1-07, C1-22 (luật ảnh, dữ liệu giả), UXD dựng lại HTML sổ tay (đã nhúng font, P4-21).

### 4.2 BUG-R3-052 – mật khẩu tạm và 2 bước trên app nhân viên

UXD đề xuất, **ORC đã chốt 04/11**:
- `Me.mustChangePassword = true` (hoặc 403 `PASSWORD_CHANGE_REQUIRED`) → **màn Đặt mật khẩu ngay trong app** (`SetPasswordPage`, khóa `pw.*`). Buồng phòng và bảo trì thường chỉ có điện thoại, không có máy quầy.
- 403 `MFA_ENROLLMENT_REQUIRED` → câu `staff.mfa_enroll_desk`, kèm nút Đăng xuất. App không có màn đăng ký 2 bước, và việc bật 2 bước cần lưu 10 mã khôi phục, nên làm trên Desk.
- Lỗi mạng ở bước nhập mã → `staff.mfa_network`, giữ nguyên mã đã nhập.
- Cả ba trường hợp không bao giờ hiện câu "mạng yếu" chung.

### 4.3 Tên khóa lệch quy ước có sẵn – báo ARC, **không** tự đổi

Theo plan 3.1, UXD không đổi tên khóa. Ghi để ARC và dev biết lúc code:
- `attention.hold_overdue`, `attention.hold_overdue_cap`: `apps/admin-web/src/app/attention.ts` dựng khóa mặc định là `attn.${item.kind}`. FE-B phải ghi đè khóa trong `switch` cho 2 kind này. Nếu ARC muốn đổi thành `attn.hold_overdue`, `attn.hold_overdue_cap` thì báo FE-B và UXD trước 05/11 10:00. Chữ giữ nguyên.
- `notif.*`: hộp Thông báo của app nhân viên dùng `staff.notif.k.<kind>` (`apps/mobile/src/app/notifications.tsx` `NOTIF_KEYS`). MOB thêm 3 kind vào `NOTIF_KEYS`, trỏ tới khóa `notif.*` ở trên. Nếu ARC muốn đổi thành `staff.notif.k.*`, chữ giữ nguyên.
- `audit.reason.*`: các lý do hệ thống khác đang ở `mlog.reason.*` và `cancel.reason.*`, `foc.r_*`. FE-A map tay trong `CODE_KEYS`, nên tên nào cũng chạy được.

## 5. Việc khi cắt `v104/strings` từ `main@L` (P4-01 phần B)

1. Đưa 29 khóa ở mục 1 (và mục 2, 3 nếu ARC/FE-A đồng ý) vào `product/design/tools/gen_strings.py`, một nhóm `v1.0.4 P4-01 – UXD lượt 1 (04/11/2026)`; riêng 2 khóa app nhân viên vào nhóm `v1.0.4 P4-50`. Khóa **Sửa** sửa tại chỗ, ghi lý do và mã lỗi vào ghi chú. Xóa `auth.mfa_later`.
2. **EM-15:** thêm `secmail.status_set` vào `KEYS` của `v103-email-fea.test.tsx` (nếu FE-A chưa làm); sửa ghi chú `users.email_self`, `users.email_other_owner`, `secmail.purpose` theo mã hiện tại; đổi tiêu đề nhóm v1.0.3 thành "UXD đã duyệt (lượt 2, 03/11/2026)"; sửa chú thích test thành "thông báo bảo mật".
3. Chạy `python3 design/tools/gen_strings.py`, commit cả tệp sinh ra. Không sửa tay tệp sinh ra.
4. `product/design/content-guide.md`: thêm dòng đổi phiên bản, thuật ngữ "cọc thiếu / short deposit", luật chọn `reauth.s2_failed` / `reauth.s2_failed_password`.
5. PR gộp trước 05/11 12:00. Review: PO (rút gọn). CPY không cần, vì không có chữ hướng khách.

## 6. Giả định

- G1. Tham số của `attention.hold_overdue` là {code}, {time} như `attn.hold_expiring`. P4-00 chốt `AttentionItem` thì UXD chỉnh câu nếu tham số khác.
- G2. `checkout.pending_refund_line` chỉ cộng yêu cầu hoàn có lý do `early_departure`. Đơn có yêu cầu hoàn đang mở vì lý do khác thì FE-B không hiện dòng này. Nếu PO muốn hiện mọi yêu cầu hoàn còn mở, UXD thêm một khóa không có vế "(yêu cầu từ Trả sớm)".
- G3. Mốc 12:00 trong `hold.paid_overdue_banner` và `attention.hold_overdue_cap` là mốc quyết định theo BR-303 / DOM A.3, A.5. Việc ghi thêm cọc vẫn làm được tới khi nhận phòng (quyết định P4-10), nên câu không nói "sau 12:00 không làm được".
- G4. `users.reset_2fa` chỉ hiện với người đã bật 2 bước. Nếu FE-A hiện cho mọi người thì cần thêm câu cho 409 `INVALID_TRANSITION`.

## 7. Tự kiểm theo brand OTTIMO

| Mục | Kết quả |
|---|---|
| Giọng | Ngắn, nói việc cần làm. Không "Vui lòng", không "!", không emoji, không IN HOA (kiểm bằng tìm chuỗi trong bảng này) |
| EN – VI | Mỗi khóa có đủ hai bản, cùng ý, không dịch từng chữ. EN dùng cách viết tắt nhẹ (*isn't*, *won't*) như các khóa Desk có sẵn |
| Không đổ lỗi | Câu lỗi nói tình trạng và việc tiếp theo ("Kiểm tra lại rồi thử lại", "Xử lý ngay trên đơn này") |
| Dữ liệu cá nhân | Không câu nào chứa số tài khoản, số tiền trong thông báo đẩy, hay tên khách. Thông báo chỉ có mã đơn ở dòng phụ |
| Thuật ngữ | Khớp tên nút đang có: Trả sớm, Thu công nợ, Xóa công nợ, Khác…, Giữ chỗ · chờ cọc |
