# Hotel App – Đội agent

Mở thư mục này bằng Claude Code rồi gõ:

1. `/start` – hoàn thiện brief (khoảng 8 câu hỏi)
2. `/round 1`, `/round 2`, `/round 3` – mỗi lệnh chạy trọn một round
3. `/status` – xem tiến độ và việc chờ anh/chị quyết
4. `/feedback <mô tả>` – phản hồi sau khi dùng sản phẩm

Brief ban đầu: `00-brief/investor-brief.md` (có thể sửa trực tiếp trước khi chạy).

## Chạy sản phẩm ở máy local (dành cho dev)

Cần Node 22, pnpm 9 (qua Corepack) và Docker. Chi tiết: `product/docs/dev-setup.md`.

```bash
cd product
cp .env.example .env        # sửa POSTGRES_PASSWORD (giá trị dev, không dùng mật khẩu thật)
pnpm install
pnpm dev                    # 1 lệnh: PostgreSQL + api + worker + web (Docker Compose)
curl http://localhost:3000/health
```
