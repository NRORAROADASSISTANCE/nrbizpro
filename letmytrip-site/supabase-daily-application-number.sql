-- LETMYTRIP atomic daily application numbering (India time)
create table if not exists public.agent_application_daily_counter (
  application_date date primary key,
  last_number bigint not null default 0 check (last_number >= 0)
);
alter table public.agent_application_daily_counter enable row level security;

create or replace function public.next_agent_application_no()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_date date := (now() at time zone 'Asia/Kolkata')::date;
  v_number bigint;
begin
  insert into public.agent_application_daily_counter(application_date,last_number)
  values (v_date,1)
  on conflict (application_date)
  do update set last_number = public.agent_application_daily_counter.last_number + 1
  returning last_number into v_number;

  return 'LMT-' || to_char(v_date,'YYYYMMDD') || '-' || lpad(v_number::text,4,'0');
end;
$$;

revoke all on function public.next_agent_application_no() from public, anon, authenticated;
grant execute on function public.next_agent_application_no() to service_role;
