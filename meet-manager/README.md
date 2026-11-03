# Shared Link Manager

Ứng dụng React/Next.js chạy static trên GitHub Pages, dùng Supabase làm dịch vụ quản lý dữ liệu và xác thực. Không cần tự vận hành backend riêng.

## Chức năng

- Đăng ký / đăng nhập bằng email và mật khẩu.
- Tạo nhóm; người tạo là Owner.
- Owner mời thành viên bằng email trong ứng dụng.
- Người dùng có thể tìm nhóm công khai và gửi yêu cầu tham gia; Owner duyệt hoặc từ chối.
- Quản lý link dùng chung theo nhóm.
- Mỗi link chỉ một người được giữ tại một thời điểm. Việc giữ link được xử lý nguyên tử bằng PostgreSQL function.
- Lock tự hết hạn sau 30 phút; giao diện tự làm mới trạng thái mỗi 15 giây.
- Realtime cập nhật khi link hoặc lock thay đổi.
- Owner quản lý link, lời mời và yêu cầu tham gia; Member chỉ giữ/trả link.

## Cấu hình Supabase

1. Tạo project tại https://supabase.com/.
2. Mở SQL Editor và chạy toàn bộ file `supabase/migrations/001_shared_link_manager.sql`.
3. Trong Authentication → URL Configuration:
   - Site URL: `https://tchiphuong.github.io/meet-manager/`
   - Thêm URL trên vào Redirect URLs.
4. Trong Project Settings → API, lấy Project URL và Publishable key (hoặc legacy anon key).
5. Tạo `.env.local` từ `.env.example` và điền:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Chạy local:
   ```bash
   npm install
   npm run dev
   ```
7. Khi deploy GitHub Pages, tạo hai GitHub Actions Variables cùng tên:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Publishable/anon key được phép xuất hiện trong frontend khi mọi bảng đều bật RLS. Tuyệt đối không đưa Supabase Secret/Service Role key vào frontend hoặc GitHub Pages.

## Luồng lời mời và duyệt thành viên

- Owner nhập email trong trang nhóm để tạo lời mời trong ứng dụng.
- Người nhận đăng ký/đăng nhập bằng đúng email đó rồi chấp nhận lời mời.
- Ngoài lời mời, người dùng có thể gửi yêu cầu tham gia nhóm công khai; Owner phê duyệt hoặc từ chối.
- Vì ứng dụng không có server/Edge Function riêng, lời mời trong ứng dụng không tự gửi email. Owner cần gửi email/thông báo cho người được mời bằng kênh riêng.

## Cơ chế khóa link

PostgreSQL dùng `link_locks.link_id` làm primary key và RPC `claim_link` để bảo đảm chỉ một giao dịch giành được quyền giữ link. Lock hết hạn sau 30 phút; lần claim tiếp theo sẽ dọn lock hết hạn trước khi cấp quyền mới. Người đang giữ link có thể trả sớm bằng `release_link`.

Đây là khóa quyền lấy link qua ứng dụng. Nếu thành viên đã sao chép URL ra ngoài, ứng dụng không thể chặn họ truy cập trực tiếp vào dịch vụ đích.

## Build và deploy

```bash
npm run build
```

Next.js static export được tạo trong `out/`. GitHub Actions workflow giữ nguyên homepage gốc và deploy ứng dụng vào `/meet-manager/`.
