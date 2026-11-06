# FE – Phản hồi review Round 5

- Người trả lời: FE (FE-A, FE-B) · 06/11/2026 · Bước: Phản hồi & sửa.
- Review: `rounds/round-05/reviews/UXD-on-fe-prs-98-102-107.md` (UXD, 06/11). Chữ theo `rounds/round-05/outputs/UXD/copy-v1.0.5.md` bản 1.7 mục 9.7.
- Sửa trên nhánh PR có sẵn, không rebase, không force-push. GW-01 ở PR mới nhánh `r5-fe-gw-alert-brand` (cắt từ `origin/main`).

## Trả lời UXD – PR #98, #102, #107 và khung Alert info trang khách

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R5-UXD-FE-PR98-01 (Minor) | Done | #98: khóa `room_change.no_rooms_not_ready` (nguyên văn 9.7). Danh sách đã lọc rỗng **và** có căn trống (`available`, khác căn đang ở) đang VD/CL → khung `warn` với `{rooms}` tăng dần nối ", " thay `room_change.no_rooms`. Không có căn VD/CL → giữ `no_rooms`; danh sách chưa lọc → không dùng câu này. Thêm ca vitest. Ảnh #98 chụp lại |
| FB-R5-UXD-FE-PR102-01 (Major) | Done | #102: `hk.action.needs_cleaning` = "Báo cần dọn" / "Mark for cleaning", giữ tên khóa; ghi chú khóa và tên nhóm "UXD duyệt 06/11". Sinh lại 4 tệp. Ảnh `v5-15-*` chụp lại. Trùng với MOB #97: PR gộp sau bỏ dòng trùng |
| FB-R5-UXD-FE-PR102-02 (Minor) | Done | #102: câu mới `checkin.room_status_stuck` (OC) và khóa mới `checkin.room_status_stuck_od` (OD), nguyên văn 9.7. `roomBlockedMessage`: `cause = room_status` + OD → `_od`. Ghi chú khóa: "v1.0.5 V5-15: theo nút Báo cần dọn". Test BUG-R4-039 có ca OD và ca OC nhắc tên nút |
| FB-R5-UXD-FE-PR102-03 (Minor) | Done | #102: lớp `room-acts` trên khối nút của dòng căn; `@media (max-width: 520px)` → `.room-acts .btn { min-height: 44px }` trong `packages/ui/src/styles/app.css`. Đo trên mock: 32 px ở 1366, 44 px ở 390 |
| FB-R5-UXD-FE-PR102-04 (Suggestion) | Deferred | v1.0.6: xóa câu 409 khi trạng thái căn khác lúc báo. ORC không giao trong lượt này |
| FB-R5-UXD-FE-PR107-01 (Minor) | Deferred | v1.0.6 theo ORC: câu số thẻ và số giấy tờ của tab Yêu cầu chuyển xuống dòng trợ giúp dưới ô, kèm `aria-invalid`; sửa một lần cho cả hai. Đã ghi vào thân #107 |
| FB-R5-UXD-FE-GW-01 (Major) | Done | PR mới FE-B `r5-fe-gw-alert-brand`: `.guest-app .alert.info` nền Cream, viền Sage, chữ và icon Ink, chỉ trong `apps/guest-web/src/styles.css`. Không đụng `@ottimo/ui`, token `--info`, Desk. Ảnh trước/sau trên mock |

Ghi chú:
- Không có ESC mới.
- Ảnh đổi trong lượt này chỉ có dữ liệu giả từ mock MSW; SEC kiểm lại ảnh mới.
