-- Certificate of recognition requests tied to learning resources.
-- Applied live on 2026-10-21 via runMigration. Idempotent (safe to re-run).
create table if not exists public.certificate_requests (
  id uuid primary key default gen_random_uuid(),
  requester_name text not null,
  requester_email text not null,
  resource_id text not null,
  resource_code text not null,
  resource_title text not null,
  resource_type text not null,
  cert_name text not null,
  cert_position text not null,
  cert_school text not null,
  cert_date text not null,
  status text not null default 'pending',
  slip_number text not null,
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  processed_by text,
  created_at timestamptz not null default now(),
  cert_email text
);

alter table public.certificate_requests enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'certificate_requests' and policyname = 'Public read on certificate_requests') then
    create policy "Public read on certificate_requests" on public.certificate_requests for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'certificate_requests' and policyname = 'Public insert on certificate_requests') then
    create policy "Public insert on certificate_requests" on public.certificate_requests for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'certificate_requests' and policyname = 'Public update on certificate_requests') then
    create policy "Public update on certificate_requests" on public.certificate_requests for update using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'certificate_requests' and policyname = 'Public delete on certificate_requests') then
    create policy "Public delete on certificate_requests" on public.certificate_requests for delete using (true);
  end if;
end $$;

-- Grants for the Supabase API roles (same migration as table creation).
grant select, insert, update, delete on table public.certificate_requests to anon, authenticated;
