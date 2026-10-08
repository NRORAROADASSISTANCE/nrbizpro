-- LETMYTRIP agent authentication migration
alter table public.agent_applications
  add column if not exists password_hash text;

-- Password hashes are never exposed through public policies.
