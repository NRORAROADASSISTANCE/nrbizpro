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
