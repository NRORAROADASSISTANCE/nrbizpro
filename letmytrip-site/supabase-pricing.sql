create table if not exists public.letmytrip_pricing_settings (
  id integer primary key default 1 check (id=1),
  platform_fee numeric(12,2) not null default 200,
  agent_markup numeric(12,2) not null default 0,
  customer_markup numeric(12,2) not null default 0,
  agent_markup_mode text not null default 'FIXED' check (agent_markup_mode in ('FIXED','PERCENT')),
  customer_markup_mode text not null default 'FIXED' check (customer_markup_mode in ('FIXED','PERCENT')),
  agent_markup_max numeric(12,2) not null default 0,
  customer_markup_max numeric(12,2) not null default 0,
  updated_at timestamptz not null default now()
);
insert into public.letmytrip_pricing_settings(id,platform_fee) values(1,200)
on conflict(id) do nothing;

alter table public.letmytrip_pricing_settings enable row level security;
alter table public.agent_applications
add column if not exists ticket_markup numeric(12,2) not null default 0,
add column if not exists ticket_markup_mode text not null default 'FIXED';