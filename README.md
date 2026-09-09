# Liftlog PT Manager

Ứng dụng dùng Supabase Auth và Supabase Database cho workspace PT, member portal
và lịch công khai. Dữ liệu vận hành nằm trong các bảng chuẩn hóa và được bảo vệ
bằng RLS; `public.app_states` được giữ làm backup tương thích ngược.

## Cấu hình Supabase

1. Tạo project Supabase.
2. Tạo một user trong **Authentication > Users**. Có thể dùng email mẫu
   `alex@liftlog.local` và mật khẩu `123456` nếu muốn giữ luồng demo cũ.
3. Sao chép `.env.example` thành `.env.local` và điền URL project cùng
   publishable key từ **Project Settings > API**.
4. Đăng nhập CLI và liên kết project, sau đó đẩy migration:

```bash
supabase login
supabase link --project-ref <project-ref>
supabase db push
```

Migration sẽ tạo bảng, quyền truy cập và chính sách RLS. Không đưa secret key
hoặc service role key vào frontend.

## Các vai trò và đường dẫn

- PT đăng nhập tại `/`, quản lý member, lịch tuần và thực đơn.
- Member đăng nhập bằng account PT cấp và được chuyển tới member portal chỉ đọc.
- Lịch công khai của PT có dạng `/pt/<public-slug>`, không cần đăng nhập.
- PT cấp account member bằng lời mời email hoặc mật khẩu tạm qua Edge Function
  `create-member-account`.

## Chạy ứng dụng

```bash
npm install
npm run dev
```

Lịch dùng `public.schedule_slots` làm nguồn dữ liệu chung cho PT, member và
public page. Public page chỉ nhận các cột an toàn (`starts_at`, `ends_at`, trạng
thái và nhãn công khai), không nhận thông tin member.

## Kiểm thử database

```bash
supabase test db
```

Test RLS nằm tại `supabase/tests/app_states_rls_test.sql` và các test portal
được bổ sung trong `supabase/tests/`.
