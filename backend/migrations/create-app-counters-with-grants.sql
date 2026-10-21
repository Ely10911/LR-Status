-- Generic named counters (e.g. submission sequence numbers).
-- Applied live on 2026-10-21 via runMigration. Idempotent (safe to re-run).
create table if not exists public.app_counters (
  id text primary key,
  value integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.app_counters enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'app_counters' and policyname = 'Public read on app_counters') then
    create policy "Public read on app_counters" on public.app_counters for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'app_counters' and policyname = 'Public insert on app_counters') then
    create policy "Public insert on app_counters" on public.app_counters for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'app_counters' and policyname = 'Public update on app_counters') then
    create policy "Public update on app_counters" on public.app_counters for update using (true) with check (true);
  end if;
end $$;

-- Grants for the Supabase API roles (same migration as table creation).
grant select, insert, update on table public.app_counters to anon, authenticated;
