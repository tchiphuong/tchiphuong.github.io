# Shared Link Manager

Ứng dụng Next.js static trên GitHub Pages, dùng Supabase Auth, PostgreSQL, RLS và Realtime. Không cần backend riêng.

## Nhóm riêng tư và lời mời
- Nhóm không xuất hiện trong tìm kiếm; chỉ thành viên mới xem được thông tin nhóm.
- Owner nhập email để tạo link mời riêng và gửi link qua email/chat.
- Người nhận mở link, đăng nhập bằng đúng email được mời và gửi yêu cầu tham gia.
- Owner duyệt hoặc từ chối. Chỉ sau khi duyệt, người nhận mới trở thành thành viên và truy cập link của nhóm.
- Không có link mời hợp lệ thì không thể gửi yêu cầu hoặc xem nhóm.
- Ứng dụng không tự gửi email; Owner gửi link qua kênh riêng.

## Link dùng chung
- Owner quản lý danh sách link.
- Thành viên giữ link bằng thao tác nguyên tử ở PostgreSQL; mỗi link chỉ có một người giữ.
- Lock tự hết hạn sau 30 phút và được gia hạn khi người giữ vẫn mở workspace.
- Realtime đồng bộ trạng thái.
- App không thể chặn URL đã bị sao chép truy cập trực tiếp ở dịch vụ đích.

## Cấu hình
1. Tạo project Supabase.
2. Chạy lần lượt SQL trong `supabase/migrations/` theo thứ tự (001 rồi 002).
3. Authentication → URL Configuration: thêm `https://tchiphuong.github.io/meet-manager/` vào Site URL và Redirect URLs.
4. Lấy Project URL và Publishable/anon key.
5. Tạo `.env.local` từ `.env.example`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
6. GitHub → Settings → Secrets and variables → Actions → Variables, tạo hai biến cùng tên cho workflow.
7. Chạy local: `npm install`, `npm run dev`. Build: `npm run build`.

Chỉ dùng Publishable/anon key ở frontend. Không đưa Secret/Service Role key vào GitHub Pages.
