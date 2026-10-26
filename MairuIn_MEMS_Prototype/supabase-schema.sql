-- MairuIn MEMS starter schema for shared online use.
-- Run in Supabase SQL Editor. Invite/create only authorised office users in Supabase Auth.
create table if not exists public.mems_actions (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);
create table if not exists public.mems_correspondence (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.mems_actions enable row level security;
alter table public.mems_correspondence enable row level security;
drop policy if exists "Authenticated users can read actions" on public.mems_actions;
drop policy if exists "Authenticated users can insert actions" on public.mems_actions;
drop policy if exists "Authenticated users can update actions" on public.mems_actions;
drop policy if exists "Authenticated users can delete actions" on public.mems_actions;
drop policy if exists "Authenticated users can read correspondence" on public.mems_correspondence;
drop policy if exists "Authenticated users can insert correspondence" on public.mems_correspondence;
drop policy if exists "Authenticated users can update correspondence" on public.mems_correspondence;
drop policy if exists "Authenticated users can delete correspondence" on public.mems_correspondence;
create policy "Authenticated users can read actions" on public.mems_actions for select to authenticated using (true);
create policy "Authenticated users can insert actions" on public.mems_actions for insert to authenticated with check (true);
create policy "Authenticated users can update actions" on public.mems_actions for update to authenticated using (true) with check (true);
create policy "Authenticated users can delete actions" on public.mems_actions for delete to authenticated using (true);
create policy "Authenticated users can read correspondence" on public.mems_correspondence for select to authenticated using (true);
create policy "Authenticated users can insert correspondence" on public.mems_correspondence for insert to authenticated with check (true);
create policy "Authenticated users can update correspondence" on public.mems_correspondence for update to authenticated using (true) with check (true);
create policy "Authenticated users can delete correspondence" on public.mems_correspondence for delete to authenticated using (true);
