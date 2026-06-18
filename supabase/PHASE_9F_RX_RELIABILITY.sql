-- =====================================================
-- Phase 9F: RX reliability and atomic RX number generation
-- =====================================================

create table if not exists public.rx_sequences (
  year integer primary key,
  current_value integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.rx_sequences enable row level security;

drop policy if exists "Service role full access for rx sequences"
on public.rx_sequences;

create policy "Service role full access for rx sequences"
on public.rx_sequences
for all
to service_role
using (true)
with check (true);

grant select, insert, update
on table public.rx_sequences
to service_role;

create or replace function public.next_rx_number(target_year integer default extract(year from now())::integer)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  next_value integer;
begin
  insert into public.rx_sequences(year, current_value, updated_at)
  values (target_year, 1, now())
  on conflict (year)
  do update set
    current_value = public.rx_sequences.current_value + 1,
    updated_at = now()
  returning current_value into next_value;

  return 'RX-' || target_year::text || '-' || lpad(next_value::text, 6, '0');
end;
$$;

grant execute on function public.next_rx_number(integer)
to service_role;
