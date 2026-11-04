# BE-C trả lời thẻ – P4-11 `v104/be-lease-prices` (PR-G)

- Round 4 (v1.0.4), bước **Phản hồi & sửa**, 04/11/2026
- Review: `rounds/round-04/reviews/ARC-on-v104-p4-11.md`, `rounds/round-04/reviews/SEC-on-v104-be-lease-prices.md`
- Nền mới: `origin/v104/be-holds` @ `a91acb84` (PR-F, 0093 ở idx 69) + merge `origin/v104/dom-br-fixtures` @ `6bddbc29` (PR #41) = `231a2ee1`. 4 commit BE-C rebase lên nền này (commit DOM `e116c2b4`, `ceb05937` và merge `lp-v2-main` không còn nằm riêng trên nhánh: đã có trong nền). Khi PR-F và PR #41 vào `main`, BE-C rebase lại lên `main`.

## Bảng trả lời thẻ

| Thẻ | Mức | Trạng thái | Ghi chú |
|---|---|---|---|
| FB-R4-ARC-BE-C-P411-01 | Major (điều kiện gộp) | Fixed | Journal 0094 idx **70**, `when` `1792782177681` (0093 = `1792782175681`, tăng nghiêm ngặt). `meta/0094_snapshot.json` = bản chép `meta/0093_snapshot.json` của `a91acb84`, giữ `id` `6691350d-e953-46bf-bed3-9e94a364cfca`, `prevId` = `96671c28-784b-486a-a34e-ed25cc3be90a`; phần thân trùng từng byte với 0093 (0094 không đổi schema). Chú thích đầu SQL: "the snapshot is 0093's", bỏ câu "`when` = 0092 + 4000 … if the merge order differs". `drizzle-kit generate`: "No schema changes, nothing to migrate". `schema-parity` + `migrations-journal` xanh trên DB migrate từ đầu và DB migrate tới idx 69 rồi lên head. |
| FB-R4-SEC-BE-P411-01 | Minor | Fixed | `rooms.service.ts` `cancelScheduledListPrice`: so `effectiveFrom` với `max(ngày kinh doanh, ngày lịch theo tz property)` (`localDate(pc.now, pc.timezone)`) → 409 `INVALID_TRANSITION` `currentState: 'effective'`. Trigger không đổi. Test tích hợp mới (`rooms-scheduled-prices-v101`): đồng hồ 01:00 giờ property ngày 16/10/2026 (ngày kinh doanh còn 15/10, rollover 06:00), hủy dòng 16/10 bằng OWN và MGR → 409 `effective`, dòng còn, `version` giữ. Đã thử bỏ phần sửa: ca này ra **500 `INTERNAL_ERROR`** (trigger chặn) → test bắt đúng lỗi. Câu runbook trong chú thích 0094 sửa theo SEC 3 (v1.0.3 chỉ xóa dòng sau ngày kinh doanh; khung 00:00 → rollover bị trigger chặn, 500 chung, không mất dữ liệu). **Đổi thân tệp SQL (chỉ chú thích) → SEC xác nhận nhanh ở head mới.** |
| FB-R4-ARC-BE-C-P411-02 | Minor | Ghi chú (không đổi trigger) | Chú thích 0094 thêm câu về `now()` thật của DB. **Ghi chú cho QA v1.0.4:** trigger 0094 đọc giờ thật của DB, không đọc đồng hồ app. Trên staging `CLOCK_MODE=mutable` đang lùi về quá khứ (offset âm hoặc đóng băng ở quá khứ), hủy một giá hẹn có ngày nằm giữa "hôm nay giả" và "hôm nay thật" sẽ ra 500 chung, không mất dữ liệu. Đây không phải lỗi; đừng diễn tập hủy giá hẹn khi đồng hồ staging đang lùi. Tua đồng hồ tới tương lai thì không gặp. Production (`SystemClock`) không gặp. Ánh xạ `check_violation` → 409 (cần savepoint) để v1.0.5 nếu QA cần. Dòng README `MutableClock`: OPS/BE thêm ở lần chạm README kế tiếp. |
| FB-R4-ARC-BE-C-P411-03 | Suggestion | Fixed | `parseEntityTag` chỉ đọc hậu tố `-gzip/-zstd/-br` **trong ngoặc kép** (`"6-gzip"`, `W/"6-gzip"`). `6-gzip`, `W/6-br` không ngoặc → null → 422. Số trần `6` vẫn nhận như cũ. Thêm 2 ca đơn vị. |

## Kiểm thử (PostgreSQL 17 riêng, container `ottimo-p411c-pg`, vai `ottimo_app`/`ottimo_migrator` theo `02-roles.sh`)
- Migrate từ đầu (`ottimo_test`): 71 migration, trigger `room_list_price_append_only` `tgenabled = 'O'`.
- Migrate từ idx 69 (`ottimo_from69`): chạy tới 0093 (70 dòng, chưa có trigger), rồi `db:migrate` lên head: 71 dòng, trigger `O`. `schema-parity` + `room-list-price-append-only` trên DB này: 12/12.
- Toàn bộ vitest `@ottimo/api`: **159 tệp đạt, 2 bỏ qua; 3981 đạt, 19 bỏ qua, 1 todo, 0 lỗi**.
- `drizzle-kit generate`: "No schema changes".
- `tsc --noEmit` sạch, `eslint services/api` 0 lỗi, `prettier --check` sạch.
