-- NR CHAT by NR CONNECT
-- Supabase foundation. Run this in the NR CHAT Supabase project.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text not null,
  avatar_url text,
  bio text,
  is_online boolean not null default false,
  last_seen timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'direct' check (type in ('direct','group')),
  title text,
  avatar_url text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
  conversation_id uuid references public.conversations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  is_hidden boolean not null default false,
  is_private boolean not null default false,
  is_locked boolean not null default false,
  hidden_at timestamptz,
  primary key (conversation_id,user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  message_type text not null default 'text' check (message_type in ('text','image','file','audio','system')),
  body text,
  attachment_url text,
  reply_to_id uuid references public.messages(id),
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz
);

create index if not exists messages_conversation_created_idx on public.messages(conversation_id,created_at);
create index if not exists conversation_members_user_idx on public.conversation_members(user_id);

alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

-- Policies will be added with the authenticated Supabase client in the next integration step.
-- Never expose a service-role key in browser code.

-- Per-user privacy controls for hidden/private/locked conversations.
-- The lock credential must never be stored here; use secure device authentication or a dedicated auth flow.
create table if not exists public.conversation_privacy (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  is_hidden boolean not null default false,
  is_private boolean not null default false,
  is_locked boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (conversation_id,user_id)
);

alter table public.conversation_privacy enable row level security;


-- NR CHAT Status / Stories
create table if not exists public.statuses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status_type text not null default 'text' check (status_type in ('text','image','video')),
  text_content text,
  media_url text,
  background text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);
create index if not exists statuses_user_expires_idx on public.statuses(user_id,expires_at);

create table if not exists public.status_views (
  status_id uuid not null references public.statuses(id) on delete cascade,
  viewer_id uuid not null references auth.users(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key(status_id,viewer_id)
);

-- NR CHAT Business Accounts
create table if not exists public.business_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  business_name text not null,
  category text,
  description text,
  logo_url text,
  website_url text,
  phone text,
  email text,
  address text,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free','pro','premium')),
  status text not null default 'active' check (status in ('active','past_due','cancelled','expired')),
  started_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

-- Monetization foundation: payments/earnings ledger.
-- NR CONNECT company-only monetization ledger.
-- No creator rewards or user payouts: advertising income belongs to NR CONNECT.
create table if not exists public.monetization_transactions (
  id uuid primary key default gen_random_uuid(),
  transaction_type text not null check (transaction_type in ('subscription','business_plan','advertising','refund')),
  amount numeric(12,2) not null default 0,
  currency text not null default 'INR',
  status text not null default 'pending' check (status in ('pending','paid','failed','refunded')),
  provider text,
  provider_reference text,
  advertiser_id uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Advertiser accounts and campaigns.
create table if not exists public.advertiser_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  business_name text not null,
  contact_name text,
  mobile text,
  email text,
  website_url text,
  gst_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  advertiser_id uuid not null references public.advertiser_profiles(id) on delete cascade,
  title text not null,
  description text,
  creative_type text not null default 'image' check (creative_type in ('image','video','text')),
  creative_url text,
  destination_url text,
  call_to_action text default 'Learn More',
  target_location text,
  daily_budget numeric(12,2) not null default 0,
  total_budget numeric(12,2) not null default 0,
  package text not null default 'custom' check (package in ('7_days','15_days','30_days','custom')),
  starts_at timestamptz,
  ends_at timestamptz,
  status text not null default 'draft' check (status in ('draft','pending_payment','paid','pending_approval','active','paused','rejected','completed','refunded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ad_campaign_events (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.ad_campaigns(id) on delete cascade,
  event_type text not null check (event_type in ('impression','click','conversion')),
  session_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.ad_packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  duration_days integer not null,
  price numeric(12,2) not null,
  currency text not null default 'INR',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.ad_packages (name,duration_days,price)
select * from (values
  ('Starter 7 Days',7,499::numeric),
  ('Growth 15 Days',15,999::numeric),
  ('Premium 30 Days',30,1999::numeric)
) v(name,duration_days,price)
where not exists (select 1 from public.ad_packages);

alter table public.monetization_transactions enable row level security;
alter table public.advertiser_profiles enable row level security;
alter table public.ad_campaigns enable row level security;
alter table public.ad_campaign_events enable row level security;
alter table public.ad_packages enable row level security;

alter table public.statuses enable row level security;
alter table public.status_views enable row level security;
alter table public.business_profiles enable row level security;
alter table public.business_subscriptions enable row level security;
alter table public.monetization_transactions enable row level security;
