-- Add a role column to viewer_accounts to support sub-office monitor accounts.
-- 'viewer' = writer (submits LRs), 'sub_office' = sub-office monitor (read-only oversight).
-- Applied live on 2026-10-22 via runMigration. Idempotent (safe to re-run).
alter table public.viewer_accounts add column if not exists role text not null default 'viewer';

-- Grants for the Supabase API roles (same migration as the schema change).
grant select, insert, update, delete on table public.viewer_accounts to anon, authenticated;
