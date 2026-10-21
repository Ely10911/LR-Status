-- Visitor log: one row per visit (per-user history + counts).
-- Applied live on 2026-10-21 via runMigration. Idempotent (safe to re-run).
create table if not exists public.visitors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  visited_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.visitors enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'visitors' and policyname = 'Public read on visitors') then
    create policy "Public read on visitors" on public.visitors for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'visitors' and policyname = 'Public insert on visitors') then
    create policy "Public insert on visitors" on public.visitors for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'visitors' and policyname = 'Public update on visitors') then
    create policy "Public update on visitors" on public.visitors for update using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'visitors' and policyname = 'Public delete on visitors') then
    create policy "Public delete on visitors" on public.visitors for delete using (true);
  end if;
end $$;

-- Grants for the Supabase API roles (same migration as table creation).
grant select, insert, update, delete on table public.visitors to anon, authenticated;
