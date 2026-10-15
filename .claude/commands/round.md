Chạy trọn Round $ARGUMENTS theo `.claude/skills/hotel-orchestrator/SKILL.md` mục B và protocol mục 3–4.

- Tạo task list 7 bước để chủ đầu tư theo dõi.
- Bước 2 (Sản xuất), 3 (Review chéo), 4 (Phản hồi & sửa): giao cho các subagent `hotel-*`, chạy song song khi không phụ thuộc.
- Bước 5: hotel-qa test, dev sửa, test lại tối đa 3 lượt. Bước 6: hotel-qc ra quyết định.
- Commit git sau mỗi bước.
- Kết thúc bằng `rounds/round-<n>/round-summary.md` và trình chủ đầu tư phần "CẦN ANH/CHỊ QUYẾT ĐỊNH" ngắn gọn.
- Chỉ dừng giữa chừng nếu có ESC mức Gấp.
