-- =====================================================
-- Phase 9A.2: Safe non-blocking admin audit trigger
-- Purpose:
-- Audit logging must never block payment verification or appointment updates.
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
alter column table_name drop not null;

alter table public.admin_audit_logs
alter column action drop not null;

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
  v_record_identifier text := null;
  v_table_name text := coalesce(TG_TABLE_NAME, TG_RELNAME, 'unknown');
  v_action text := coalesce(TG_OP, 'UNKNOWN');
begin
  begin
    if TG_OP = 'DELETE' then
      v_record_identifier := old.id::text;

      insert into public.admin_audit_logs(
        table_name,
        record_id,
        action,
        old_data,
        new_data
      )
      values (
        v_table_name,
        v_record_identifier,
        v_action,
        to_jsonb(old),
        null
      );

      return old;
    end if;

    v_record_identifier := new.id::text;

    insert into public.admin_audit_logs(
      table_name,
      record_id,
      action,
      old_data,
      new_data
    )
    values (
      v_table_name,
      v_record_identifier,
      v_action,
      case when TG_OP = 'UPDATE' then to_jsonb(old) else null end,
      to_jsonb(new)
    );

    return new;
  exception when others then
    raise warning 'Admin audit log skipped for %.% operation %: %',
      TG_TABLE_SCHEMA,
      TG_TABLE_NAME,
      TG_OP,
      SQLERRM;

    if TG_OP = 'DELETE' then
      return old;
    end if;

    return new;
  end;
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
