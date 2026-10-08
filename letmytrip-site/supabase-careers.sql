create table if not exists public.career_applications (
  id uuid primary key default gen_random_uuid(),
  application_no text unique not null,
  full_name text not null,
  mobile text not null,
  email text not null,
  position text not null,
  qualification text,
  experience text,
  location text,
  cv_path text not null,
  submitted_at timestamptz not null default now()
);
alter table public.career_applications enable row level security;
insert into storage.buckets (id,name,public)
values ('letmytrip-cvs','letmytrip-cvs',false)
on conflict (id) do nothing;