# Shared Link Manager

Ứng dụng Next.js static trên GitHub Pages, dùng Supabase Auth, PostgreSQL, RLS và Realtime. Không cần backend riêng.

## Room riêng tư
- Room không xuất hiện trong danh sách công khai.
- Owner tạo room và tự đặt một mã vào room (tối thiểu 6 ký tự).
- Thành viên đăng nhập, nhập đúng mã là được tham gia ngay; không cần email mời hoặc Owner duyệt.
- Mã được lưu dưới dạng SHA-256 hash trong database, không lưu dạng văn bản.
- Chỉ thành viên mới xem được room, danh sách link và lịch sử sử dụng.
- Người tạo nên chọn mã khó đoán và chỉ chia sẻ riêng cho người cần tham gia.

## Link dùng chung
- Owner quản lý danh sách link.
- Thành viên giữ link bằng thao tác nguyên tử ở PostgreSQL; mỗi link chỉ có một người giữ.
- Lock tự hết hạn sau 30 phút và được gia hạn khi người giữ vẫn mở workspace.
- Realtime đồng bộ trạng thái.
- App không thể chặn URL đã bị sao chép truy cập trực tiếp ở dịch vụ đích.

## Cấu hình
1. Tạo project Supabase.
2. Chạy lần lượt SQL trong `supabase/migrations/`: 001, 002, rồi 003.
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
