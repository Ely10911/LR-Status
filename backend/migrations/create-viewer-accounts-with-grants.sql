-- Registered viewer accounts (custom auth: name + email must match).
-- Applied live on 2026-10-21 via runMigration. Idempotent (safe to re-run).
create table if not exists public.viewer_accounts (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  school text not null,
  sub_office text not null,
  created_at timestamptz not null default now()
);

alter table public.viewer_accounts enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'viewer_accounts' and policyname = 'Allow public read access to viewer_accounts') then
    create policy "Allow public read access to viewer_accounts" on public.viewer_accounts for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'viewer_accounts' and policyname = 'Allow public insert to viewer_accounts') then
    create policy "Allow public insert to viewer_accounts" on public.viewer_accounts for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'viewer_accounts' and policyname = 'Allow public update to viewer_accounts') then
    create policy "Allow public update to viewer_accounts" on public.viewer_accounts for update using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'viewer_accounts' and policyname = 'Allow public delete from viewer_accounts') then
    create policy "Allow public delete from viewer_accounts" on public.viewer_accounts for delete using (true);
  end if;
end $$;

-- Grants for the Supabase API roles (same migration as table creation).
grant select, insert, update, delete on table public.viewer_accounts to anon, authenticated;
