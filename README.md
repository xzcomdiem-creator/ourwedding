# Wedding Invite Backend

Backend API cho ứng dụng thiệp cưới online, dùng Express + Supabase.

## Cài đặt

```bash
npm install
```

## Cấu hình

1. Vào **Supabase Dashboard → Project Settings → API**, lấy `Project URL` và `service_role key`.
2. Mở file `.env` (đã có sẵn khung), điền 2 giá trị đó:

```
SUPABASE_URL=https://xxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
PORT=4000
```

⚠️ **Không** commit file `.env` lên Git (đã được thêm vào `.gitignore` sẵn). `service_role key` có toàn quyền và bỏ qua RLS — tuyệt đối không đưa nó ra frontend.

## Chạy dev

```bash
npm run dev
```

Server chạy tại `http://localhost:4000`.

## Schema Supabase cần tạo trước

Project này giả định 3 bảng sau đã tồn tại trong Supabase (SQL Editor):

```sql
create extension if not exists "pgcrypto";

create table weddings (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  groom_name text not null,
  bride_name text not null,
  wedding_date timestamptz not null,
  venue_name text,
  venue_address text,
  cover_image_url text,
  story text,
  created_at timestamptz default now()
);

create table guests (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid references weddings(id) on delete cascade,
  name text not null,
  phone text,
  invite_code text unique not null,
  rsvp_status text default 'pending',
  num_guests int default 1,
  created_at timestamptz default now()
);

create table wishes (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid references weddings(id) on delete cascade,
  guest_name text not null,
  message text not null,
  created_at timestamptz default now()
);
```

Vì backend dùng `service_role key` (bỏ qua RLS), bạn có thể bật RLS trên các bảng này và không cần policy cho phép anon — mọi truy cập đều đi qua API này.

## Các endpoint chính

### Admin — quản lý đám cưới (`/api/weddings`)
| Method | Path | Mô tả |
|---|---|---|
| POST | `/api/weddings` | Tạo đám cưới mới (tự sinh `slug`) |
| GET | `/api/weddings` | Danh sách đám cưới |
| GET | `/api/weddings/:id` | Chi tiết 1 đám cưới |
| PUT | `/api/weddings/:id` | Cập nhật thông tin |
| DELETE | `/api/weddings/:id` | Xóa |

### Quản lý khách mời (`/api/guests`)
| Method | Path | Mô tả |
|---|---|---|
| POST | `/api/guests` | Thêm 1 khách mời (tự sinh `invite_code`) |
| POST | `/api/guests/bulk` | Thêm nhiều khách mời cùng lúc |
| GET | `/api/guests?wedding_id=...` | Danh sách khách mời theo đám cưới |
| PUT | `/api/guests/:id` | Sửa tên/sđt khách mời |
| DELETE | `/api/guests/:id` | Xóa khách mời |

### Public — khách mời xem thiệp & tương tác (`/api/public`)
| Method | Path | Mô tả |
|---|---|---|
| GET | `/api/public/wedding/:slug` | Xem thông tin thiệp theo slug |
| GET | `/api/public/guest/:invite_code` | Xem tên khách theo mã mời riêng |
| POST | `/api/public/rsvp` | Gửi xác nhận tham dự |
| POST | `/api/public/wishes` | Gửi lời chúc |
| GET | `/api/public/wishes/:wedding_id` | Xem danh sách lời chúc |

## Bước tiếp theo gợi ý

- Thêm xác thực (JWT/API key) cho nhóm route admin (`/api/weddings`, `/api/guests`) để người lạ không gọi thẳng API sửa/xóa dữ liệu.
- Giới hạn rate limit cho `/api/public/wishes` và `/api/public/rsvp` để tránh spam.
