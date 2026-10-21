-- In-app notifications (audience: 'admin' or 'viewer', optionally targeted by email).
-- Applied live on 2026-10-21 via runMigration. Idempotent (safe to re-run).
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  audience text not null,
  target_email text,
  type text not null,
  title text not null,
  message text not null,
  resource_id uuid,
  resource_code text,
  resource_status text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'notifications' and policyname = 'Allow public read access to notifications') then
    create policy "Allow public read access to notifications" on public.notifications for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'notifications' and policyname = 'Allow public insert to notifications') then
    create policy "Allow public insert to notifications" on public.notifications for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'notifications' and policyname = 'Allow public update to notifications') then
    create policy "Allow public update to notifications" on public.notifications for update using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'notifications' and policyname = 'Allow public delete from notifications') then
    create policy "Allow public delete from notifications" on public.notifications for delete using (true);
  end if;
end $$;

-- Grants for the Supabase API roles (same migration as table creation).
grant select, insert, update, delete on table public.notifications to anon, authenticated;
