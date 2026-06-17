-- =====================================================
-- Phase 9A: Critical auth/database hardening
-- Repaired idempotent version
-- Fixes:
-- 1) Wrong appointment date/time index
-- 2) Missing admin_2fa_challenges table
-- 3) Missing reviews table
-- 4) Existing old admin_audit_logs table without table_name column
-- =====================================================

create table if not exists public.admin_audit_logs (
  id bigserial primary key
);

alter table public.admin_audit_logs
add column if not exists table_name text;

alter table public.admin_audit_logs
add column if not exists record_id text;

alter table public.admin_audit_logs
add column if not exists action text;

alter table public.admin_audit_logs
add column if not exists old_data jsonb;

alter table public.admin_audit_logs
add column if not exists new_data jsonb;

alter table public.admin_audit_logs
add column if not exists created_at timestamptz not null default now();

update public.admin_audit_logs
set table_name = 'legacy'
where table_name is null;

update public.admin_audit_logs
set action = 'LEGACY'
where action is null;

alter table public.admin_audit_logs
alter column table_name set not null;

alter table public.admin_audit_logs
alter column action set not null;

drop index if exists public.idx_appointments_date_time;

create index if not exists idx_appointments_date_time
on public.appointments(appointment_date, appointment_time);

create table if not exists public.admin_2fa_challenges (
  id uuid primary key default gen_random_uuid(),
  admin_email text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists admin_2fa_challenges_admin_email_idx
on public.admin_2fa_challenges(admin_email);

create index if not exists admin_2fa_challenges_expires_at_idx
on public.admin_2fa_challenges(expires_at);

alter table public.admin_2fa_challenges enable row level security;

drop policy if exists "Service role full access for admin 2fa challenges"
on public.admin_2fa_challenges;

create policy "Service role full access for admin 2fa challenges"
on public.admin_2fa_challenges
for all
to service_role
using (true)
with check (true);

grant select, insert, update, delete
on table public.admin_2fa_challenges
to service_role;

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  rating integer not null check (rating between 1 and 5),
  message text not null,
  status text not null default 'Pending' check (status in ('Pending', 'Approved', 'Rejected')),
  created_at timestamptz not null default now()
);

create index if not exists reviews_status_created_at_idx
on public.reviews(status, created_at desc);

alter table public.reviews enable row level security;

drop policy if exists "Service role full access for reviews"
on public.reviews;

create policy "Service role full access for reviews"
on public.reviews
for all
to service_role
using (true)
with check (true);

grant select, insert, update, delete
on table public.reviews
to service_role;

create index if not exists admin_audit_logs_table_created_idx
on public.admin_audit_logs(table_name, created_at desc);

alter table public.admin_audit_logs enable row level security;

drop policy if exists "Service role full access for admin audit logs"
on public.admin_audit_logs;

create policy "Service role full access for admin audit logs"
on public.admin_audit_logs
for all
to service_role
using (true)
with check (true);

grant select, insert, update, delete
on table public.admin_audit_logs
to service_role;

do $$
begin
  if to_regclass('public.admin_audit_logs_id_seq') is not null then
    grant usage, select on sequence public.admin_audit_logs_id_seq to service_role;
  end if;
end;
$$;

create or replace function public.write_admin_audit_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  record_identifier text;
begin
  if tg_op = 'DELETE' then
    record_identifier := old.id::text;

    insert into public.admin_audit_logs(table_name, record_id, action, old_data, new_data)
    values (tg_table_name, record_identifier, tg_op, to_jsonb(old), null);

    return old;
  end if;

  record_identifier := new.id::text;

  insert into public.admin_audit_logs(table_name, record_id, action, old_data, new_data)
  values (
    tg_table_name,
    record_identifier,
    tg_op,
    case when tg_op = 'UPDATE' then to_jsonb(old) else null end,
    to_jsonb(new)
  );

  return new;
end;
$$;

do $$
declare
  v_table_names text[] := array[
    'appointments',
    'patients',
    'prescriptions',
    'prescription_visits',
    'appointment_payments',
    'reviews'
  ];
  v_table_name text;
begin
  foreach v_table_name in array v_table_names loop
    if to_regclass('public.' || v_table_name) is not null then
      execute format(
        'drop trigger if exists %I on public.%I;',
        'trg_admin_audit_' || v_table_name,
        v_table_name
      );

      execute format(
        'create trigger %I after insert or update or delete on public.%I for each row execute function public.write_admin_audit_log();',
        'trg_admin_audit_' || v_table_name,
        v_table_name
      );
    end if;
  end loop;
end;
$$;
