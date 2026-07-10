-- Arogya Phase 10: production hardening
-- Run once in Supabase SQL Editor before accepting new bookings after deployment.

-- Stop two simultaneous requests from booking the same active one-hour slot.
-- This diagnostic returns rows only when duplicate active slots already exist.
select
  appointment_date,
  left(appointment_time, 5) as appointment_time,
  count(*) as active_bookings,
  array_agg(id order by created_at) as appointment_ids
from public.appointments
where lower(coalesce(status, 'new')) <> 'cancelled'
group by appointment_date, left(appointment_time, 5)
having count(*) > 1;

select appointment_id, lower(patient_email) as patient_email, count(*) as rows
from public.appointment_payments
group by appointment_id, lower(patient_email)
having count(*) > 1;

select lower(trim(transaction_ref)) as transaction_ref, count(*) as rows
from public.appointment_payments
where transaction_ref is not null and trim(transaction_ref) <> ''
group by lower(trim(transaction_ref))
having count(*) > 1;

select appointment_id, count(*) as rx_rows, array_agg(id order by created_at) as visit_ids
from public.prescription_visits
where appointment_id is not null
group by appointment_id
having count(*) > 1;

-- If index creation fails, use the diagnostic above to identify conflicts;
-- review them in the admin CRM and cancel the incorrect duplicate, then rerun.
begin;

-- Never retain authentication tokens, password hashes, or storage secrets in
-- audit JSON. Existing rows are scrubbed and future trigger writes are redacted.
create or replace function public.redact_admin_audit_json(payload jsonb)
returns jsonb
language sql
immutable
as $$
  select coalesce(payload, '{}'::jsonb)
    - 'password_hash'
    - 'token_hash'
    - 'code_hash'
    - 'upload_token'
    - 'secure_token'
    - 'screenshot_url'
    - 'file_path';
$$;

update public.admin_audit_logs
set
  old_data = case when old_data is null then null else public.redact_admin_audit_json(old_data) end,
  new_data = case when new_data is null then null else public.redact_admin_audit_json(new_data) end
where old_data is not null or new_data is not null;

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
        table_name, record_id, action, old_data, new_data
      ) values (
        v_table_name,
        v_record_identifier,
        v_action,
        public.redact_admin_audit_json(to_jsonb(old)),
        null
      );
      return old;
    end if;

    v_record_identifier := new.id::text;
    insert into public.admin_audit_logs(
      table_name, record_id, action, old_data, new_data
    ) values (
      v_table_name,
      v_record_identifier,
      v_action,
      case
        when TG_OP = 'UPDATE' then public.redact_admin_audit_json(to_jsonb(old))
        else null
      end,
      public.redact_admin_audit_json(to_jsonb(new))
    );
    return new;
  exception when others then
    raise warning 'Admin audit log skipped for %.% operation %: %',
      TG_TABLE_SCHEMA, v_table_name, v_action, SQLERRM;
    if TG_OP = 'DELETE' then return old; end if;
    return new;
  end;
end;
$$;

create unique index if not exists appointments_one_active_booking_per_slot
on public.appointments (appointment_date, (left(appointment_time, 5)))
where lower(coalesce(status, 'new')) <> 'cancelled';

create unique index if not exists appointment_payments_one_row_per_patient_booking
on public.appointment_payments (appointment_id, (lower(patient_email)));

create unique index if not exists appointment_payments_unique_transaction_reference
on public.appointment_payments ((lower(trim(transaction_ref))))
where transaction_ref is not null and trim(transaction_ref) <> '';

create unique index if not exists prescription_visits_one_rx_per_appointment
on public.prescription_visits (appointment_id)
where appointment_id is not null;

create index if not exists idx_password_reset_active_token
on public.password_reset_requests (token_hash, expires_at)
where used_at is null;

create index if not exists idx_email_verification_active_token
on public.email_verification_tokens (token_hash, expires_at)
where used_at is null;

create index if not exists idx_admin_2fa_active_challenge
on public.admin_2fa_challenges (id, expires_at)
where used_at is null;

commit;
