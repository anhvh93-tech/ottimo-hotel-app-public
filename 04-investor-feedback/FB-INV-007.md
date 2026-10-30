# FB-INV-007 – Form đặt phòng: ô số liên hệ ghi "Số điện thoại", không ghi "Số Zalo"

- Ngày: 30/10/2026 | Người gửi: INV | Ghi: ORC | Loại: câu chữ giao diện (landing ottimo.vn, form US-155) | Ưu tiên: P2 | Đích: landing kế tiếp (cùng hoặc trước v1.0.1)

## Nguyên văn
> chỗ này nên để là số điện thoại thôi, đừng ghi là số zalo, do nhiều khách họ để lạ sđt để contact qua whatapps thì sao

## Hiện trạng (landing-v1.1.0)
- Form có 4 lựa chọn "Trả lời qua": Zalo (chọn sẵn), WhatsApp, Gọi điện, Email.
- Nhãn ô số đổi theo lựa chọn: "Số Zalo" / "Số WhatsApp" / "Số điện thoại" (EN: "Zalo number" / "WhatsApp number" / "Phone number") – `product/apps/landing-web/src/content/vi.ts`, `en.ts` dòng 257.
- Vì Zalo chọn sẵn nên khách thấy "Số Zalo" đầu tiên, dễ hiểu là chỉ nhận số Zalo.

## Hiểu của ORC
- Ô số luôn ghi **"Số điện thoại" / "Phone number"** cho cả Zalo, WhatsApp, Gọi điện; lựa chọn "Trả lời qua" giữ nguyên để lễ tân biết kênh khách muốn.
- UXD chốt chữ (EN dẫn, VI hỗ trợ, theo brand) và có thể thêm gợi ý ngắn cho khách nước ngoài (mã quốc gia).
- Không đổi dữ liệu gửi lên máy chủ, không đổi thông báo xử lý dữ liệu.

## Việc
- UXD: chốt chữ EN/VI. FE-B: sửa `vi.ts`/`en.ts` (+ test landing). QA: kiểm form 4 lựa chọn. Phát hành: tag landing mới, INV duyệt Release; trước khi duyệt OPS so băm 2 trang privacy với `state/privacy-notice.log` (ARC FB-01) – trang privacy không đổi nên băm phải giữ nguyên.
