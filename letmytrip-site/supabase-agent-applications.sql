-- LETMYTRIP agent applications
create extension if not exists pgcrypto;

create table if not exists public.agent_applications (
  id uuid primary key default gen_random_uuid(),
  application_no text not null unique,
  agency_name text not null,
  owner_name text not null,
  mobile text not null,
  whatsapp text,
  email text not null,
  business_type text not null,
  pan text not null,
  gst text,
  website text,
  pincode text not null,
  state text not null,
  city text not null,
  address text not null,
  account_name text not null,
  bank_name text not null,
  account_number text not null,
  ifsc text not null,
  status text not null default 'PENDING' check (status in ('PENDING','APPROVED','REJECTED')),
  rejection_reason text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewer text
);

create index if not exists agent_applications_status_idx on public.agent_applications(status);
create index if not exists agent_applications_submitted_at_idx on public.agent_applications(submitted_at desc);

alter table public.agent_applications enable row level security;

-- Public registration is insert-only. No public select/update/delete policy is created.
drop policy if exists "letmytrip_agent_public_insert" on public.agent_applications;
create policy "letmytrip_agent_public_insert"
on public.agent_applications
for insert
to anon, authenticated
with check (status = 'PENDING');
