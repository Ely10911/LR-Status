-- Per-resource QA status history.
-- Applied live on 2026-10-21 via runMigration. Idempotent (safe to re-run).
create table if not exists public.resource_history (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null,
  status text not null,
  evaluation_phase text,
  date timestamptz not null default now(),
  remarks text not null default 'Status updated.',
  created_at timestamptz not null default now(),
  checking_items jsonb
);

alter table public.resource_history enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'resource_history' and policyname = 'Public read on resource_history') then
    create policy "Public read on resource_history" on public.resource_history for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'resource_history' and policyname = 'Public insert on resource_history') then
    create policy "Public insert on resource_history" on public.resource_history for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'resource_history' and policyname = 'Public update on resource_history') then
    create policy "Public update on resource_history" on public.resource_history for update using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'resource_history' and policyname = 'Public delete on resource_history') then
    create policy "Public delete on resource_history" on public.resource_history for delete using (true);
  end if;
end $$;

-- Grants for the Supabase API roles (same migration as table creation).
grant select, insert, update, delete on table public.resource_history to anon, authenticated;
